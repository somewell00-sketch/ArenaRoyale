import { cloneWorld } from "./state.js";
import { generateNpcIntents } from "./ai.js";

export function isAdjacent(world, fromId, toId){
  const adj = world.map.adjById[String(fromId)] || [];
  return adj.includes(toId);
}

export function maxSteps(entity){
  const hp = (entity.hp ?? 100);
  const fp = (entity.fp ?? entity.stamina ?? 70);
  return (hp > 30 && fp > 20) ? 3 : 1;
}

function isAreaActive(world, areaId){
  const a = world.map.areasById[String(areaId)];
  return !!(a && a.isActive !== false);
}

export function isRouteValid(world, fromAreaId, route, entity){
  // route is an array of destination ids (excluding the starting area)
  if(!Array.isArray(route) || route.length === 0) return { ok:false, reason:"empty_route" };

  const stepsAllowed = maxSteps(entity);
  if(route.length > stepsAllowed) return { ok:false, reason:"too_many_steps", stepsAllowed };

  let cur = fromAreaId;
  for(const raw of route){
    const to = Number(raw);
    if(!isAreaActive(world, to)) return { ok:false, reason:"area_closed", at: to };
    if(!isAdjacent(world, cur, to)) return { ok:false, reason:"not_adjacent", from: cur, to };

    const dest = world.map.areasById[String(to)];
    if(dest?.hasWater && !dest?.hasBridge){
      return { ok:false, reason:"water_no_bridge", to };
    }
    cur = to;
  }
  return { ok:true, finalAreaId: cur };
}

export function advanceDay(world, playerActionsForDay = []){
  const next = cloneWorld(world);

  const events = [];
  const day = next.meta.day;

  // 0) Apply closures that become effective today, and schedule new closures.
  applyClosuresForDay(next, day);

  // 1) NPC intents
  const npcIntents = generateNpcIntents(next);

  // 2) juntar ações: player first (você pode inverter depois)
  const actions = [
    ...playerActionsForDay.map(a => ({ ...a, source: "player" })),
    ...npcIntents
  ];

  // 3) aplicar ações com regras
  // Phase A known MVP: Attack/Defend (no items yet) - only affects logs
  // Phase B: Movement (validated routes)
  for (const act of actions){
    if (act.type === "ATTACK"){
      events.push({ type: "ATTACK_DECLARED", who: act.source, payload: act.payload || {} });
    } else if (act.type === "DEFEND"){
      events.push({ type: "DEFEND_DECLARED", who: act.source });
    } else if (act.type === "DO_NOTHING"){
      events.push({ type: "DO_NOTHING", who: act.source });
    }
  }

  for (const act of actions){
    if (act.type === "MOVE"){
      applyMove(next, act.source, act.payload || {}, events);
    } else if (act.type === "STAY"){
      events.push({ type: "STAY", who: act.source });
    } else if (act.type === "REST"){
      events.push({ type: "REST", who: act.source });
    }
  }

  // 4) manutenção (FP -10; Cornucopia food auto)
  for(const e of [next.entities.player, ...Object.values(next.entities.npcs)]){
    if(e.hp <= 0) continue;
    const fp = (e.fp ?? e.stamina ?? 70);
    const inCornucopia = (e.areaId === 1);
    if(inCornucopia){
      e.fp = 70;
    } else {
      e.fp = fp - 10;
    }
  }

  // 5) avançar o dia
  next.meta.day += 1;

  // 5) log
  next.log.days.push({ day, events });

  return { nextWorld: next, dayEvents: events };
}

function applyMove(world, who, payload, events){
  const entity = (who === "player")
    ? world.entities.player
    : world.entities.npcs[who];

  if (!entity) return;

  const from = entity.areaId;

  // Support both {toAreaId} and {route:[...]} payloads.
  const route = Array.isArray(payload.route)
    ? payload.route.map(Number)
    : (payload.toAreaId != null ? [Number(payload.toAreaId)] : []);

  if(route.length === 0){
    events.push({ type: "MOVE_BLOCKED", who, from, reason: "empty_route" });
    return;
  }

  // cannot start from a closed area (edge case)
  if(!isAreaActive(world, from)){
    events.push({ type: "MOVE_BLOCKED", who, from, reason: "start_area_closed" });
    return;
  }

  const res = isRouteValid(world, from, route, entity);
  if(!res.ok){
    events.push({ type: "MOVE_BLOCKED", who, from, to: route[0], reason: res.reason, details: res });
    return;
  }

  const to = res.finalAreaId;
  entity.areaId = to;
  events.push({ type: "MOVE", who, from, to, route });

  // flags (somente player marca visitado)
  if (who === "player"){
    const v = new Set(world.flags.visitedAreas);
    v.add(to);
    v.add(1);
    world.flags.visitedAreas = Array.from(v).sort((a,b)=>a-b);
  }
}


function applyClosuresForDay(world, day){
  // Close anything scheduled for today
  for(const idStr of Object.keys(world.map.areasById)){
    const a = world.map.areasById[idStr];
    if(a.isActive !== false && a.willCloseOnDay === day){
      a.isActive = false;
      world.flags.closedAreas = Array.from(new Set([...(world.flags.closedAreas||[]), a.id])).sort((x,y)=>x-y);
    }
  }

  // Starting day 3, every 2 days: mark 4 highest-id active areas (excluding 1) to close next day.
  // Day 3 marks (red border) -> closes day 4; Day 5 marks -> closes day 6; etc.
  if(day >= 3 && ((day - 3) % 2 === 0)){
    const active = Object.values(world.map.areasById)
      .filter(a => a.id !== 1 && a.isActive !== false);

    // pick 4 with highest id
    active.sort((a,b)=>b.id-a.id);
    const toMark = active.slice(0, 4);
    for(const a of toMark){
      // don't override if already scheduled earlier
      if(a.willCloseOnDay == null){
        a.willCloseOnDay = day + 1; // warning today, closes tomorrow
      }
    }
  }
}
