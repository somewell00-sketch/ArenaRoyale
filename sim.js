import { cloneWorld, getAllActors } from "./state.js";
import { generateNpcIntents } from "./ai.js";

export function isAdjacent(world, fromId, toId){
  const adj = world.map.adjById[String(fromId)] || [];
  return adj.includes(toId);
}

function isActive(world, areaId){
  return world.map.areasById[String(areaId)]?.isActive !== false;
}

function maxSteps(actor){
  return (actor.hp > 30 && actor.stamina > 20) ? 3 : 1;
}

function pseudoRandom(seed, day, salt){
  let h = 2166136261 >>> 0;
  const s = `${seed}|${day}|${salt}`;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h << 13; h >>>= 0;
  h ^= h >>> 17; h >>>= 0;
  h ^= h << 5; h >>>= 0;
  return (h >>> 0) / 4294967296;
}

function getActor(world, who){
  if (who === "player") return world.entities.player;
  return world.entities.npcs[who];
}

function allAliveActors(world){
  return getAllActors(world).filter(a => a.alive);
}

// Step 2 – Day loop (no items yet)
// Phases:
// 1) collect intents (player + NPC)
// 2) movement
// 3) encounters by area
// 4) combat (if any)
// 5) maintenance (FP -10, food auto, death by FP=0 at start of next day)
// 6) public summary (deaths / injuries / weapon used)
export function advanceDay(world, playerActionsForDay = []){
  const next = cloneWorld(world);
  const day = next.meta.day;

  const privateEvents = [];
  const publicEvents = [];

  // 0) start-of-day death check (FP=0 and no food)
  for (const a of allAliveActors(next)){
    if (a.stamina === 0){
      const area = next.map.areasById[String(a.areaId)];
      const fedHere = !!area?.hasFood;
      if (!fedHere){
        a.alive = false;
        privateEvents.push({ type: "DEATH_STARVATION", who: a.id });
        publicEvents.push({ type: "CANON", who: a.id, reason: "starvation" });
      }
    }
  }

  // 1) collect intents
  const npcIntents = generateNpcIntents(next);

  const actions = [
    ...playerActionsForDay.map(a => ({ ...a, source: "player" })),
    ...npcIntents
  ];

  // Normalize into per-actor action1 + action2
  const plan = new Map(); // who -> { a1, a2 }
  for (const act of actions){
    const who = act.source;
    if (!plan.has(who)) plan.set(who, { a1: null, a2: null });
    const slot = plan.get(who);
    if (act.type === "ATTACK" || act.type === "DEFEND"){
      slot.a1 = act;
    } else if (act.type === "MOVE" || act.type === "STAY"){
      slot.a2 = act;
    }
  }

  // Ensure defaults (A1 mandatory: ATTACK or DEFEND; A2 mandatory: MOVE or STAY)
  for (const a of allAliveActors(next)){
    const who = a.id === "player" ? "player" : a.id;
    if (!plan.has(who)) plan.set(who, { a1: null, a2: null });
    const slot = plan.get(who);
    if (!slot.a1) slot.a1 = { source: who, type: "DEFEND", payload: {} };
    if (!slot.a2) slot.a2 = { source: who, type: "STAY", payload: {} };
  }

  // 2) Movement phase
  for (const [who, slot] of plan.entries()){
    if (slot.a2?.type === "MOVE"){
      applyMove(next, who, slot.a2.payload?.route || [], privateEvents);
    } else {
      privateEvents.push({ type: "STAY", who });
    }
  }

  // 3) Encounters by area
  const byArea = new Map();
  for (const a of allAliveActors(next)){
    const k = a.areaId;
    if(!byArea.has(k)) byArea.set(k, []);
    byArea.get(k).push(a);
  }

  for (const [areaId, list] of byArea.entries()){
    if (list.length >= 2){
      privateEvents.push({ type: "ENCOUNTER", areaId, who: list.map(x=>x.id) });
    }
  }

  // 4) Combat phase (very minimal, no items)
  // rule: if you ATTACK and have a valid target in the same area, deal base damage 10.
  // DEFEND reduces damage by 50%.
  for (const [areaId, list] of byArea.entries()){
    if (list.length < 2) continue;

    // build quick lookup
    const idToActor = new Map(list.map(a => [a.id, a]));

    // attackers in this area
    const attacks = [];
    for (const a of list){
      const who = a.id === "player" ? "player" : a.id;
      const a1 = plan.get(who)?.a1;
      if (a1?.type === "ATTACK"){
        attacks.push({ attackerId: a.id, targetId: a1.payload?.targetId });
      }
    }
    if (!attacks.length) continue;

    // resolve attacks in deterministic order (force then id)
    attacks.sort((x,y)=>{
      const ax = idToActor.get(x.attackerId);
      const ay = idToActor.get(y.attackerId);
      const fx = ax?.attrs?.F ?? 0;
      const fy = ay?.attrs?.F ?? 0;
      if (fx !== fy) return fy - fx;
      return String(x.attackerId).localeCompare(String(y.attackerId));
    });

    for (const atk of attacks){
      const attacker = idToActor.get(atk.attackerId);
      if (!attacker || !attacker.alive) continue;

      // pick target
      let target = null;
      if (atk.targetId && idToActor.has(atk.targetId)){
        target = idToActor.get(atk.targetId);
      } else {
        const candidates = list.filter(a => a.id !== attacker.id && a.alive);
        if (!candidates.length) continue;
        const r = pseudoRandom(next.meta.seed, day, `${attacker.id}|target|${areaId}`);
        target = candidates[Math.floor(r * candidates.length)];
      }
      if (!target || !target.alive) continue;

      const targetWho = target.id === "player" ? "player" : target.id;
      const targetA1 = plan.get(targetWho)?.a1;
      const defending = targetA1?.type === "DEFEND";

      const dmg = defending ? 5 : 10;
      target.hp = Math.max(0, target.hp - dmg);

      privateEvents.push({ type: "HIT", areaId, attacker: attacker.id, target: target.id, dmg, defending });
      publicEvents.push({ type: "INJURY", target: target.id, weapon: "melee" });

      if (target.hp === 0){
        target.alive = false;
        privateEvents.push({ type: "DEATH", areaId, who: target.id, by: attacker.id });
        publicEvents.push({ type: "CANON", who: target.id, reason: "combat" });
      }
    }
  }

  // 5) Maintenance phase
  for (const a of allAliveActors(next)){
    const area = next.map.areasById[String(a.areaId)];
    // FP -10
    a.stamina = Math.max(0, a.stamina - 10);

    // food auto
    if (area?.hasFood){
      a.stamina = 70;
      privateEvents.push({ type: "EAT", who: a.id, areaId: a.areaId });
    }
  }

  // Area closing (simple deterministic): every 2 days, close 1 random active area (not 1)
  if (day >= 2 && day % 2 === 0){
    const candidates = Object.values(next.map.areasById)
      .filter(a => a.id !== 1 && a.isActive !== false)
      .map(a => a.id);

    // avoid closing area where the player currently is (if possible)
    const playerArea = next.entities.player.areaId;
    const filtered = candidates.filter(id => id !== playerArea);
    const pool = filtered.length ? filtered : candidates;

    if (pool.length){
      const r = pseudoRandom(next.meta.seed, day, "close");
      const idx = Math.floor(r * pool.length);
      const toClose = pool[idx];
      next.map.areasById[String(toClose)].isActive = false;
      if (!next.flags.closedAreas.includes(toClose)) next.flags.closedAreas.push(toClose);
      privateEvents.push({ type: "AREA_CLOSED", areaId: toClose });
      publicEvents.push({ type: "AREA_CLOSED", areaId: toClose });
    }
  }

  // 6) Advance day + log
  next.meta.day += 1;
  next.log.days.push({ day, publicEvents, privateEvents });

  return { nextWorld: next, dayEvents: { publicEvents, privateEvents } };
}

function applyMove(world, who, route, events){
  const entity = getActor(world, who);
  if (!entity || !entity.alive) return;

  const steps = maxSteps(entity);
  if (!Array.isArray(route) || !route.length){
    events.push({ type: "MOVE_BLOCKED", who, reason: "empty_route" });
    return;
  }

  let cur = entity.areaId;
  let moved = 0;

  for (const raw of route){
    if (moved >= steps) break;
    const to = Number(raw);

    if (!isActive(world, to)){
      events.push({ type: "MOVE_BLOCKED", who, from: cur, to, reason: "area_inactive" });
      break;
    }
    if (!isAdjacent(world, cur, to)){
      events.push({ type: "MOVE_BLOCKED", who, from: cur, to, reason: "not_adjacent" });
      break;
    }

    cur = to;
    moved++;
  }

  const from = entity.areaId;
  entity.areaId = cur;

  if (from !== cur){
    events.push({ type: "MOVE", who, from, to: cur, steps: moved });
  } else {
    events.push({ type: "STAY", who });
  }

  // player marks visited
  if (who === "player"){
    const v = new Set(world.flags.visitedAreas);
    v.add(cur); v.add(1);
    world.flags.visitedAreas = Array.from(v).sort((a,b)=>a-b);
  }
}
