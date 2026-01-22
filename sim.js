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
  for (const act of actions){
    if (act.type === "MOVE"){
      applyMove(next, act.source, act.payload.toAreaId, events);
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


// --- Phase helpers (MVP) ---
// Apply ONLY Action 1 (ATTACK/DEFEND/DO_NOTHING) without advancing the day.
export function applyAction1Phase(world, actions){
  const next = structuredClone(world);

  const byId = (id) => {
    if(id === "player") return next.entities.player;
    return next.entities.npcs[id];
  };

  const damage = 5;

  // Build actions map
  const actionByActor = new Map();
  for(const a of actions){
    const actorId = (a.source === "player") ? "player" : a.actorId;
    actionByActor.set(actorId, a);
  }

  // Group actors by area
  const actors = [];
  actors.push({ id: "player", e: next.entities.player });
  for(const [id,e] of Object.entries(next.entities.npcs)) actors.push({ id, e });

  const inArea = new Map();
  for(const a of actors){
    const areaId = a.e.areaId;
    if(!inArea.has(areaId)) inArea.set(areaId, []);
    inArea.get(areaId).push(a.id);
  }

  const messages = [];

  // Deterministic order: areaId asc, then attackerId asc
  const areaIds = [...inArea.keys()].map(Number).sort((a,b)=>a-b).map(String);

  for(const areaId of areaIds){
    const ids = inArea.get(areaId);
    if(!ids || ids.length < 2) continue;

    const attacks = [];
    for(const attackerId of ids){
      const act = actionByActor.get(attackerId);
      if(act && act.type === "ATTACK" && act.payload?.targetId){
        const targetId = act.payload.targetId;
        if(ids.includes(targetId)){
          attacks.push({ attackerId, targetId });
        }
      }
    }

    attacks.sort((a,b)=> (a.attackerId > b.attackerId) - (a.attackerId < b.attackerId));

    for(const {attackerId, targetId} of attacks){
      const attacker = byId(attackerId);
      const target = byId(targetId);
      if(!attacker || !target) continue;
      if(attacker.hp <= 0 || target.hp <= 0) continue;

      const targetAct = actionByActor.get(targetId);
      const targetDefending = targetAct && targetAct.type === "DEFEND";
      let dealt = damage;
      if(targetDefending) dealt = Math.ceil(damage * 0.5);

      target.hp = Math.max(0, target.hp - dealt);

      if(targetId === "player"){
        const name = (attackerId === "player") ? "You" : attacker.name;
        messages.push(`${name} attacked you with a punch (-${dealt} HP)`);
      }
      if(attackerId === "player"){
        const name = (targetId === "player") ? "You" : target.name;
        messages.push(`You attacked ${name} with a punch (-${dealt} HP)`);
      }
    }
  }

  next.meta = next.meta || {};
  next.meta.lastActionMessages = messages;

  return next;
}

// End-of-day maintenance ONLY (FP -10, food auto). (MVP)
export function endDayMaintenance(world){
  const next = structuredClone(world);
  next.meta = next.meta || {};
  next.meta.day = (next.meta.day || 1) + 1;

  const applyActor = (e) => {
    if(!e || e.hp <= 0) return;
    e.fp = Math.max(0, (e.fp ?? 0) - 10);

    const area = next.map?.areasById?.[String(e.areaId)];
    const hasFood = !!area?.hasFood || (String(e.areaId) === "1"); // Cornucopia always food
    if(hasFood){
      e.fp = 70;
    }
  };

  applyActor(next.entities.player);
  for(const e of Object.values(next.entities.npcs)) applyActor(e);

  return next;
}
