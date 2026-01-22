import { cloneWorld } from "./state.js";
import { generateNpcIntents } from "./ai.js";

export function isAdjacent(world, fromId, toId){
  const adj = world.map.adjById[String(fromId)] || [];
  return adj.includes(toId);
}

export function advanceDay(world, playerActionsForDay = []){
  const next = cloneWorld(world);

  const events = [];
  const day = next.meta.day;

  // 1) NPC intents
  const npcIntents = generateNpcIntents(next);

  // 2) juntar ações: player first (você pode inverter depois)
  const actions = [
    ...playerActionsForDay.map(a => ({ ...a, source: "player" })),
    ...npcIntents
  ];

  // 3) aplicar ações com regras
  // Ordem (MVP): Ação 1 (combate/defesa) -> Ação 2 (movimento)
  const phase1 = actions.filter(a => ["ATTACK","DEFEND","DO_NOTHING"].includes(a.type));
  const phase2 = actions.filter(a => ["MOVE","STAY","REST"].includes(a.type));

  for (const act of phase1){
    if (act.type === "ATTACK"){
      // placeholder: combate completo vem depois (por enquanto só loga)
      events.push({ type: "ATTACK", who: act.source, payload: act.payload || {} });
    } else if (act.type === "DEFEND"){
      events.push({ type: "DEFEND", who: act.source });
    } else if (act.type === "DO_NOTHING"){
      events.push({ type: "DO_NOTHING", who: act.source });
    }
  }

  for (const act of phase2){
    if (act.type === "MOVE"){
      applyMove(next, act.source, act.payload?.toAreaId, events);
    } else if (act.type === "STAY"){
      events.push({ type: "STAY", who: act.source });
    } else if (act.type === "REST"){
      events.push({ type: "REST", who: act.source });
    }
  }

  // 4) avançar o dia
  next.meta.day += 1;

  // 5) log
  next.log.days.push({ day, events });

  return { nextWorld: next, dayEvents: events };
}

function applyMove(world, who, toAreaId, events){
  const entity = (who === "player")
    ? world.entities.player
    : world.entities.npcs[who];

  if (!entity) return;

  const from = entity.areaId;
  const to = Number(toAreaId);

  // regra: só move para adjacente
  if (!isAdjacent(world, from, to)) {
    events.push({ type: "MOVE_BLOCKED", who, from, to, reason: "not_adjacent" });
    return;
  }

  entity.areaId = to;
  events.push({ type: "MOVE", who, from, to });

  // flags (somente player marca visitado)
  if (who === "player"){
    const v = new Set(world.flags.visitedAreas);
    v.add(to);
    v.add(1);
    world.flags.visitedAreas = Array.from(v).sort((a,b)=>a-b);
  }
}
