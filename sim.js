import { cloneWorld } from "./state.js";
import {
  getItemDef,
  ItemTypes,
  computeWeaponDamage,
  isBlockedByShield,
  isAxeShieldBreak,
  INVENTORY_LIMIT,
  inventoryCount,
  addToInventory,
  removeInventoryItem,
  strongestWeaponInInventory,
  isPoisonWeapon
} from "./items.js";

export function isAdjacent(world, fromId, toId){
  const adj = world.map.adjById[String(fromId)] || [];
  return adj.includes(Number(toId));
}

export function maxSteps(entity){
  const hp = entity.hp ?? 100;
  const fp = entity.fp ?? 70;
  return (hp > 30 && fp > 20) ? 3 : 1;
}

function isAreaActive(world, areaId){
  const a = world.map.areasById[String(areaId)];
  return !!a && a.isActive !== false;
}

function canEnter(world, toAreaId){
  const a = world.map.areasById[String(toAreaId)];
  if(!a) return { ok:false, reason:"missing_area" };
  if(a.isActive === false) return { ok:false, reason:"area_closed" };
  if(a.hasWater && !a.hasBridge) return { ok:false, reason:"water_no_bridge" };
  return { ok:true };
}

function actorById(world, id){
  if(id === "player") return world.entities.player;
  return world.entities.npcs?.[id];
}

function prng(seed, day, salt){
  // deterministic 0..1
  let h = 2166136261 >>> 0;
  const s = String(seed) + "|" + String(day) + "|" + String(salt);
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // xorshift-ish
  h ^= h << 13; h >>>= 0;
  h ^= h >>> 17; h >>>= 0;
  h ^= h << 5; h >>>= 0;
  return (h >>> 0) / 4294967296;
}

function applyDamage(target, dmg){
  target.hp = Math.max(0, (target.hp ?? 100) - dmg);
}

export function commitPlayerAction(world, action){
  // Applies immediately. Returns { nextWorld, events }.
  const next = cloneWorld(world);
  const day = next.meta.day;
  const seed = next.meta.seed;

  const events = [];
  const player = next.entities.player;
  if((player.hp ?? 0) <= 0){
    events.push({ type:"NO_ACTION", reason:"player_dead" });
    return { nextWorld: next, events };
  }

  // reset one-day flags
  player._today = { defendedWithShield: false, invisible: false };

  const kind = action?.kind || "NOTHING";

  const npcsHere = Object.values(next.entities.npcs || {})
    .filter(n => (n.hp ?? 0) > 0 && n.areaId === player.areaId);

  function pickRandomNpc(tag){
    if(!npcsHere.length) return null;
    const r = prng(seed, day, tag);
    return npcsHere[Math.floor(r * npcsHere.length)];
  }

  function getEquippedWeapon(entity){
    const defId = entity?.inventory?.equipped?.weaponDefId || null;
    if(!defId) return null;
    const inst = (entity.inventory.items || []).find(it => it.defId === defId) || null;
    if(!inst) return null;
    const def = getItemDef(defId);
    if(!def || def.type !== ItemTypes.WEAPON) return null;
    return { def, inst };
  }

  function computeAttackDamage(attacker, target, { forDispute = false } = {}){
    const w = getEquippedWeapon(attacker);
    if(!w){
      // fists
      const base = 5;
      const bonus = Math.floor(prng(seed, day, `rpg_bonus_${attacker.id}`) * 4); // 0..3
      return { ok:true, dmg: base + bonus, weaponDefId: null, meta: { fists: true } };
    }

    const res = computeWeaponDamage(w.def, w.inst.qty, attacker, target, { forDispute });
    if(!res.ok) return { ok:false, reason: res.reason, dmg:0, weaponDefId: w.def.id, meta:{} };

    return { ok:true, dmg: res.dmg, weaponDefId: w.def.id, meta: { weapon: w.def.name } };
  }

  function spendWeaponUse(entity, weaponDefId){
    if(!weaponDefId) return;
    const inst = (entity.inventory.items || []).find(it => it.defId === weaponDefId);
    if(!inst) return;
    if(inst.usesLeft == null) return;
    inst.usesLeft = Math.max(0, inst.usesLeft - 1);
    if(inst.usesLeft <= 0){
      // remove item
      const idx = (entity.inventory.items || []).findIndex(it => it.defId === weaponDefId);
      if(idx !== -1) removeInventoryItem(entity.inventory, idx);
    }
  }

  function addStatus(entity, status){
    if(!entity.status) entity.status = [];
    entity.status.push(status);
  }

  function hasStatus(entity, kind){
    return (entity.status || []).some(s => s?.type === kind);
  }

  if(kind === "COLLECT"){
    const area = next.map.areasById[String(player.areaId)];
    if(!area || !Array.isArray(area.groundItems) || area.groundItems.length === 0){
      events.push({ type:"COLLECT", ok:false, reason:"no_item" });
      return { nextWorld: next, events };
    }

    if(inventoryCount(player.inventory) >= INVENTORY_LIMIT){
      events.push({ type:"COLLECT", ok:false, reason:"inventory_full" });
      return { nextWorld: next, events };
    }

    const idx = Number(action?.itemIndex ?? 0);
    const item = area.groundItems[idx] ?? area.groundItems[0];
    if(!item){
      events.push({ type:"COLLECT", ok:false, reason:"missing_item" });
      return { nextWorld: next, events };
    }

    // Remove from ground first
    const realIdx = area.groundItems.indexOf(item);
    if(realIdx !== -1) area.groundItems.splice(realIdx, 1);

    // Backpack opens into 2–3 items, then disappears
    if(item.defId === "backpack"){
      const salt = item.meta?.seedTag || `bp_${realIdx}`;
      const roll = prng(seed, day, `bp_open_${salt}`);
      const count = 2 + Math.floor(roll * 2); // 2..3
      const pool = ["sword","club","spear","trident","axe","wand","knife","dagger","bow","blowgun","shield","camouflage","flask"];

      const gained = [];
      for(let k=0;k<count;k++){
        const pick = pool[Math.floor(prng(seed, day, `bp_pick_${salt}_${k}`) * pool.length)];
        // Stackables are tracked per-slot with qty (max 7). Initial drop qty is 1.
        const qty = 1;
        const meta = {};
        if(pick === "flask"){
          meta.hiddenKind = (prng(seed, day, `bp_flask_${salt}_${k}`) < 0.5) ? "medicine" : "poison";
        }
        const ok = addToInventory(player.inventory, { defId: pick, qty, meta });
        if(ok.ok){
          gained.push(pick);
        } else {
          // drop back on ground if full
          area.groundItems.push({ defId: pick, qty, meta });
        }
      }
      events.push({ type:"COLLECT", ok:true, itemDefId:"backpack", opened:true, gained });
      return { nextWorld: next, events };
    }

    const ok = addToInventory(player.inventory, item);
    if(!ok.ok){
      // Put it back if we couldn't add
      area.groundItems.unshift(item);
      events.push({ type:"COLLECT", ok:false, reason: ok.reason });
      return { nextWorld: next, events };
    }
    events.push({ type:"COLLECT", ok:true, itemDefId: item.defId, qty: item.qty || 1 });
    return { nextWorld: next, events };
  }

  if(kind === "DEFEND"){
    // If you have a Shield equipped as defense, it becomes active for the day.
    const defId = player.inventory?.equipped?.defenseDefId;
    if(defId === "shield"){
      player._today.defendedWithShield = true;
      events.push({ type:"DEFEND", ok:true, with:"Shield" });
    } else {
      events.push({ type:"DEFEND", ok:true });
    }

    if(!npcsHere.length){
      events.push({ type:"INFO", msg:"No threats nearby." });
      return { nextWorld: next, events };
    }

    // 50% chance of being attacked while defending
    const attacked = prng(seed, day, "def_atk") < 0.5;
    if(!attacked){
      events.push({ type:"INFO", msg:"No one attacked you." });
      return { nextWorld: next, events };
    }

    const attacker = pickRandomNpc("def_attacker");
    const atk = computeAttackDamage(attacker, player);
    let incoming = atk.ok ? atk.dmg : 8;

    // Shield blocks incoming (unless weapon is not blocked)
    if(player._today.defendedWithShield){
      const w = getEquippedWeapon(attacker);
      const blocked = w ? isBlockedByShield(w.def) : true;
      if(blocked){
        incoming = 0;
        events.push({ type:"SHIELD_BLOCK", who:"player", from: attacker?.id ?? "unknown" });
      }
    }

    if(incoming > 0){
      applyDamage(player, incoming);
      events.push({ type:"DAMAGE_RECEIVED", from: attacker?.id ?? "unknown", dmg: incoming });
      if((player.hp ?? 0) <= 0) events.push({ type:"DEATH", who:"player", areaId: player.areaId });
    }
    return { nextWorld: next, events };
  }

  if(kind === "ATTACK"){
    const targetId = action?.targetId || null;
    const target = targetId ? actorById(next, targetId) : null;

    if(!target || (target.hp ?? 0) <= 0 || target.areaId !== player.areaId){
      events.push({ type:"ATTACK", ok:false, reason:"no_valid_target" });
      return { nextWorld: next, events };
    }

    // Camouflage: you cannot be attacked, but can still attack.
    if(target._today?.invisible){
      events.push({ type:"ATTACK", ok:false, reason:"target_invisible" });
      return { nextWorld: next, events };
    }

    const atk = computeAttackDamage(player, target);
    if(!atk.ok){
      events.push({ type:"ATTACK", ok:false, reason: atk.reason || "requirements" });
      return { nextWorld: next, events };
    }

    let dmg = atk.dmg;

    const w = atk.weaponDefId ? getItemDef(atk.weaponDefId) : null;

    // Target shield block if they defended with shield
    if(target._today?.defendedWithShield && w && isBlockedByShield(w)){
      dmg = 0;
      events.push({ type:"SHIELD_BLOCK", who: targetId, from: "player" });
    }

    // Axe breaks shield: removes shield, no damage
    if(w && isAxeShieldBreak(w) && target._today?.defendedWithShield){
      dmg = 0;
      target._today.defendedWithShield = false;
      events.push({ type:"SHIELD_BROKEN", who: targetId, by:"player" });
    }

    if(dmg > 0){
      applyDamage(target, dmg);
      events.push({ type:"ATTACK", ok:true, target: targetId, dmgDealt: dmg, weapon: w?.name || "Fists" });
    } else {
      events.push({ type:"ATTACK", ok:true, target: targetId, dmgDealt: 0, weapon: w?.name || "Fists", note:"blocked" });
    }

    // Weapon use consumption
    if(atk.weaponDefId) spendWeaponUse(player, atk.weaponDefId);

    // Grenade self-damage
    if(w?.effects?.selfDamage){
      applyDamage(player, Number(w.effects.selfDamage) || 0);
      events.push({ type:"SELF_DAMAGE", who:"player", dmg: Number(w.effects.selfDamage) || 0, weapon: w.name });
    }

    // Blowgun poison
    if(w && isPoisonWeapon(w)){
      if(!hasStatus(target, "poison")) addStatus(target, { type:"poison", perDay: 10 });
      events.push({ type:"POISON_APPLIED", who: targetId, by:"player" });
    }

    if((target.hp ?? 0) <= 0){
      events.push({ type:"DEATH", who: targetId, areaId: target.areaId });
      player.kills = (player.kills ?? 0) + 1;
    }
    if((player.hp ?? 0) <= 0){
      events.push({ type:"DEATH", who: "player", areaId: player.areaId });
    }

    return { nextWorld: next, events };
  }

  // NOTHING
  // If there are NPCs here, there is a chance you get hit (you were careless).
  if(npcsHere.length && prng(seed, day, "nth_atk") < 0.35){
    const attacker = pickRandomNpc("nth_attacker");
    const atk = computeAttackDamage(attacker, player);
    let dmg = atk.ok ? atk.dmg : 5;

    // If you are invisible (camouflage), name not revealed, but you still take trap damage only.
    // For now, NOTHING damage is considered a sneak hit; camouflage prevents being attacked.
    if(player._today?.invisible){
      dmg = 0;
      events.push({ type:"NOTHING", ok:true, note:"camouflage_prevented_attack" });
      return { nextWorld: next, events };
    }

    applyDamage(player, dmg);
    events.push({ type:"NOTHING", ok:true, note:"caught_off_guard" });
    events.push({ type:"DAMAGE_RECEIVED", from: attacker?.id ?? "unknown", dmg });
    if((player.hp ?? 0) <= 0) events.push({ type:"DEATH", who:"player", areaId: player.areaId });
    return { nextWorld: next, events };
  }

  // Environmental hazard chance even if alone.
  if(prng(seed, day, "nth_haz") < 0.15){
    const dmg = 3 + Math.floor(prng(seed, day, "nth_haz_dmg") * 5); // 3..7
    applyDamage(player, dmg);
    events.push({ type:"NOTHING", ok:true });
    events.push({ type:"DAMAGE_RECEIVED", from:"environment", dmg });
    if((player.hp ?? 0) <= 0) events.push({ type:"DEATH", who:"player", areaId: player.areaId });
    return { nextWorld: next, events };
  }

  events.push({ type:"NOTHING", ok:true, note:"quiet_day" });
  return { nextWorld: next, events };
}

export function useInventoryItem(world, who, itemIndex, targetId = who){
  const next = cloneWorld(world);
  const day = next.meta.day;
  const seed = next.meta.seed;
  const events = [];

  const user = actorById(next, who);
  const target = actorById(next, targetId);
  if(!user || !target) return { nextWorld: next, events: [{ type:"USE_ITEM", ok:false, reason:"missing_actor" }] };
  if((user.hp ?? 0) <= 0) return { nextWorld: next, events: [{ type:"USE_ITEM", ok:false, reason:"user_dead" }] };

  const inv = user.inventory;
  const it = (inv?.items || [])[itemIndex];
  if(!it) return { nextWorld: next, events: [{ type:"USE_ITEM", ok:false, reason:"missing_item" }] };
  const def = getItemDef(it.defId);
  if(!def || def.type !== ItemTypes.CONSUMABLE) return { nextWorld: next, events: [{ type:"USE_ITEM", ok:false, reason:"not_consumable" }] };

  // Apply effects (data-driven flags)
  if(def.effects?.invisibleOneDay){
    user._today = user._today || {};
    user._today.invisible = true;
    events.push({ type:"USE_ITEM", ok:true, who, itemDefId:def.id });
    events.push({ type:"INVISIBLE", who });
  } else if(def.id === "flask" && def.effects?.revealOnUse){
    const kind = it.meta?.hiddenKind || (prng(seed, day, `flask_${who}_${itemIndex}`) < 0.5 ? "medicine" : "poison");
    if(kind === "medicine"){
      const hadPoison = (target.status || []).some(s => s?.type === "poison");
      if(hadPoison){
        target.status = (target.status || []).filter(s => s?.type !== "poison");
        events.push({ type:"FLASK_REVEAL", who, kind:"Medicine" });
        events.push({ type:"POISON_CURED", who: targetId, by: who });
      } else {
        target.hp = Math.min(100, (target.hp ?? 100) + 30);
        events.push({ type:"FLASK_REVEAL", who, kind:"Medicine" });
        events.push({ type:"HEAL", who: targetId, by: who, amount: 30 });
      }
    } else {
      events.push({ type:"FLASK_REVEAL", who, kind:"Poison" });
      // Poison only works if target "accepts"; for now: self-use always accepts.
      if(targetId === who){
        target.hp = 0;
        events.push({ type:"POISON_DRINK", who: targetId });
        events.push({ type:"DEATH", who: targetId, areaId: target.areaId, note:"poison" });
      } else {
        events.push({ type:"USE_ITEM", ok:false, reason:"target_must_accept" });
        return { nextWorld: next, events };
      }
    }
  } else {
    events.push({ type:"USE_ITEM", ok:false, reason:"unhandled" });
    return { nextWorld: next, events };
  }

  // Consume one use and remove item
  removeInventoryItem(inv, itemIndex);
  return { nextWorld: next, events };
}

export function moveActorOneStep(world, who, toAreaId){
  // Mutates world. Returns { ok, events: [] }
  const events = [];
  const entity = actorById(world, who);
  if(!entity) return { ok:false, events };

  if((entity.hp ?? 0) <= 0) return { ok:false, events };

  const from = entity.areaId;
  const to = Number(toAreaId);

  if(!isAreaActive(world, from)){
    events.push({ type:"MOVE_BLOCKED", who, from, to, reason:"start_area_closed" });
    return { ok:false, events };
  }
  if(!isAdjacent(world, from, to)){
    events.push({ type:"MOVE_BLOCKED", who, from, to, reason:"not_adjacent" });
    return { ok:false, events };
  }
  const enter = canEnter(world, to);
  if(!enter.ok){
    events.push({ type:"MOVE_BLOCKED", who, from, to, reason: enter.reason });
    return { ok:false, events };
  }

  entity.areaId = to;
  events.push({ type:"MOVE", who, from, to });

  if(who === "player"){
    const v = new Set(world.flags.visitedAreas || []);
    v.add(1); v.add(to);
    world.flags.visitedAreas = Array.from(v).sort((a,b)=>a-b);
  }
  return { ok:true, events };
}

export function endDay(world, npcIntents = [], dayEvents = []){
  // Ends the day, applies NPC movement + maintenance, logs events, advances day.
  const next = cloneWorld(world);
  const day = next.meta.day;
  const events = [...(dayEvents || [])];

  // Track positions to report who moved into the player's area when the day ends.
  const playerArea = next.entities.player.areaId;
  const prevNpcAreas = {};
  for(const npc of Object.values(next.entities.npcs || {})){
    prevNpcAreas[npc.id] = npc.areaId;
  }

  // NPC movement intents (ignore combat declarations for now)
  for(const act of (npcIntents || [])){
    if(!act || !act.source) continue;
    if(act.type === "MOVE"){
      const route = Array.isArray(act.payload?.route) ? act.payload.route : [];
      const to = (route.length ? route[route.length-1] : act.payload?.toAreaId);
      if(to != null){
        const res = moveActorOneStep(next, act.source, to);
        events.push(...res.events);
      }
    } else if(act.type === "STAY"){
      events.push({ type:"STAY", who: act.source });
    }
  }

  // After NPC moves, report anyone who moved into the player's area.
  for(const npc of Object.values(next.entities.npcs || {})){
    if((npc.hp ?? 0) <= 0) continue;
    const from = prevNpcAreas[npc.id];
    const to = npc.areaId;
    if(from !== to && to === playerArea){
      events.push({ type:"ARRIVAL", who: npc.id, from, to });
    }
  }

  // Ongoing status effects (poison)
  for(const e of [next.entities.player, ...Object.values(next.entities.npcs || {})]){
    if((e.hp ?? 0) <= 0) continue;
    const poison = (e.status || []).find(s => s?.type === "poison");
    if(poison){
      const dmg = Number(poison.perDay) || 10;
      applyDamage(e, dmg);
      events.push({ type:"POISON_TICK", who: e.id, dmg });
      if((e.hp ?? 0) <= 0) events.push({ type:"DEATH", who: e.id, areaId: e.areaId });
    }
  }

  // Maintenance: FP -10; Cornucopia restores
  for(const e of [next.entities.player, ...Object.values(next.entities.npcs || {})]){
    if((e.hp ?? 0) <= 0) continue;
    const inCorn = (e.areaId === 1);
    if(inCorn){
      e.fp = 70;
    } else {
      e.fp = (e.fp ?? 70) - 10;
    }
  }

  // Advance to the next day first, then apply area closures/scheduling so that
  // the map state the player sees on the new day already contains:
  // - areas that disappeared today (isActive=false)
  // - areas that will disappear tomorrow (willCloseOnDay=newDay+1)
  // This timing is important for the "red border one day before" UI.
  next.meta.day += 1;
  applyClosuresForDay(next, next.meta.day);

  next.log.days.push({ day, events });

  return next;
}

function applyClosuresForDay(world, day){
  // Close anything scheduled for today
  for(const idStr of Object.keys(world.map.areasById || {})){
    const a = world.map.areasById[idStr];
    if(a?.isActive !== false && a?.willCloseOnDay === day){
      a.isActive = false;
      world.flags.closedAreas = Array.from(new Set([...(world.flags.closedAreas||[]), a.id])).sort((x,y)=>x-y);
    }
  }

  // Starting day 3, every 2 days: mark 4 highest-id active areas (excluding 1) to close next day.
  if(day >= 3 && ((day - 3) % 2 === 0)){
    const active = Object.values(world.map.areasById || {})
      .filter(a => a && a.id !== 1 && a.isActive !== false);

    active.sort((a,b)=>b.id-a.id);
    const toMark = active.slice(0, 4);
    for(const a of toMark){
      if(a.willCloseOnDay == null){
        a.willCloseOnDay = day + 1;
      }
    }
  }
}
