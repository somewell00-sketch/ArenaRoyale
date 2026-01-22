// AI generates INTENTS. It does NOT mutate world state.
import { getAllActors } from "./state.js";

// Intent types:
// - ACTION1: { type: "ATTACK", payload:{ targetId } } or { type:"DEFEND" }
// - ACTION2: { type: "MOVE", payload:{ route:[areaId,...] } } or { type:"STAY" }

export function generateNpcIntents(world){
  const intents = [];
  const day = world.meta.day;
  const actors = getAllActors(world).filter(a => a.alive);

  // Build a quick lookup by area
  const byArea = new Map();
  for (const a of actors){
    const k = a.areaId;
    if (!byArea.has(k)) byArea.set(k, []);
    byArea.get(k).push(a);
  }

  for (const npc of Object.values(world.entities.npcs)){
    if (!npc.alive) continue;

    // ACTION 1: attack if someone else is in same area
    const here = byArea.get(npc.areaId) || [];
    const targets = here.filter(x => x.id !== npc.id && x.alive);

    const r1 = pseudoRandom(world.meta.seed, day, npc.id, "a1");
    if (targets.length && r1 < 0.40){
      const tIdx = Math.floor(pseudoRandom(world.meta.seed, day, npc.id, "t") * targets.length);
      intents.push({ source: npc.id, type: "ATTACK", payload: { targetId: targets[tIdx].id } });
    } else {
      intents.push({ source: npc.id, type: "DEFEND", payload: {} });
    }

    // ACTION 2: move (or stay)
    const maxSteps = (npc.hp > 30 && npc.stamina > 20) ? 3 : 1;
    const r2 = pseudoRandom(world.meta.seed, day, npc.id, "a2");

    if (r2 < 0.20){
      intents.push({ source: npc.id, type: "STAY", payload: {} });
      continue;
    }

    const reachable = reachableAreas(world, npc.areaId, maxSteps).filter(id => id !== npc.areaId);
    if (!reachable.length){
      intents.push({ source: npc.id, type: "STAY", payload: {} });
      continue;
    }

    const pickIdx = Math.floor(pseudoRandom(world.meta.seed, day, npc.id, "dest") * reachable.length);
    const dest = reachable[pickIdx];
    // store route as [dest] (engine can expand later)
    intents.push({ source: npc.id, type: "MOVE", payload: { route: [dest] } });
  }

  return intents;
}

function reachableAreas(world, startId, maxSteps){
  const isActive = (id) => world.map.areasById[String(id)]?.isActive !== false;
  const q = [[startId, 0]];
  const seen = new Set([startId]);
  const out = [];
  while(q.length){
    const [cur, d] = q.shift();
    out.push(cur);
    if (d >= maxSteps) continue;
    const adj = world.map.adjById[String(cur)] || [];
    for (const n of adj){
      if (seen.has(n)) continue;
      if (!isActive(n)) continue;
      seen.add(n);
      q.push([n, d+1]);
    }
  }
  return out;
}

// deterministic RNG without global state
function pseudoRandom(seed, day, id, salt){
  let h = 2166136261 >>> 0;
  const s = `${seed}|${day}|${id}|${salt}`;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h << 13; h >>>= 0;
  h ^= h >>> 17; h >>>= 0;
  h ^= h << 5; h >>>= 0;
  return (h >>> 0) / 4294967296;
}
