import { cloneWorld } from "./state.js";

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

  const kind = action?.kind || "NOTHING";

  const npcsHere = Object.values(next.entities.npcs || {})
    .filter(n => (n.hp ?? 0) > 0 && n.areaId === player.areaId);

  function pickRandomNpc(tag){
    if(!npcsHere.length) return null;
    const r = prng(seed, day, tag);
    return npcsHere[Math.floor(r * npcsHere.length)];
  }

  if(kind === "ATTACK"){
    const targetId = action?.targetId || null;
    const target = targetId ? actorById(next, targetId) : null;

    if(!target || (target.hp ?? 0) <= 0 || target.areaId !== player.areaId){
      events.push({ type:"ATTACK", ok:false, reason:"no_valid_target" });
      return { nextWorld: next, events };
    }

    const base = 8;
    const roll = prng(seed, day, "atk");
    const dmg = base + Math.floor(roll * 5); // 8..12

    applyDamage(target, dmg);
    events.push({ type:"ATTACK", ok:true, target: targetId, dmgDealt: dmg });

    // retaliation chance (only makes sense if target is still alive and present)
    const ret = prng(seed, day, "ret");
    if((target.hp ?? 0) > 0 && target.areaId === player.areaId && ret < 0.55){
      const rDmg = 6 + Math.floor(prng(seed, day, "ret_dmg") * 5); // 6..10
      applyDamage(player, rDmg);
      events.push({ type:"DAMAGE_RECEIVED", from: targetId, dmg: rDmg });
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

  if(kind === "DEFEND"){
    // Defend only matters if something attacks you.
    // If no one is around, nothing happens.
    if(!npcsHere.length){
      events.push({ type:"DEFEND", ok:true, note:"no_threats" });
      return { nextWorld: next, events };
    }

    // 50% chance of being attacked while defending
    const attacked = prng(seed, day, "def_atk") < 0.5;
    if(!attacked){
      events.push({ type:"DEFEND", ok:true, note:"no_attack" });
      return { nextWorld: next, events };
    }

    const attacker = pickRandomNpc("def_attacker");
    const incoming = 8 + Math.floor(prng(seed, day, "def_dmg") * 6); // 8..13
    const reduced = Math.ceil(incoming * 0.5);

    applyDamage(player, reduced);
    events.push({ type:"DEFEND", ok:true });
    events.push({ type:"DAMAGE_RECEIVED", from: attacker?.id ?? "unknown", dmg: reduced, reducedFrom: incoming });

    if((player.hp ?? 0) <= 0) events.push({ type:"DEATH", who:"player", areaId: player.areaId });
    return { nextWorld: next, events };
  }

  // NOTHING
  // If there are NPCs here, there is a chance you get hit (you were careless).
  if(npcsHere.length && prng(seed, day, "nth_atk") < 0.35){
    const attacker = pickRandomNpc("nth_attacker");
    const dmg = 5 + Math.floor(prng(seed, day, "nth_dmg") * 6); // 5..10
    applyDamage(player, dmg);
    events.push({ type:"NOTHING", ok:true, note:"caught_off_guard" });
    events.push({ type:"DAMAGE_RECEIVED", from: attacker?.id ?? "unknown", dmg });
    if((player.hp ?? 0) <= 0) events.push({ type:"DEATH", who:"player", areaId: player.areaId });
    return { nextWorld: next, events };
  }

  // Small chance of environmental hazard even if alone.
  if(prng(seed, day, "nth_haz") < 0.15){
    const dmg = 3 + Math.floor(prng(seed, day, "nth_haz_dmg") * 5); // 3..7
    applyDamage(player, dmg);
    events.push({ type:"NOTHING", ok:true });
    events.push({ type:"DAMAGE_RECEIVED", from:"hazard", dmg });
    if((player.hp ?? 0) <= 0) events.push({ type:"DEATH", who:"player", areaId: player.areaId });
    return { nextWorld: next, events };
  }

  events.push({ type:"NOTHING", ok:true, note:"quiet_day_moment" });
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
