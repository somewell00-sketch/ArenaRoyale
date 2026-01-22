// AI generates INTENTS. It must NOT mutate world state.
export function generateNpcIntents(world){
  const intents = [];
  const currentDay = world.meta.day;

  for (const npc of Object.values(world.entities.npcs)){
    const adj = world.map.adjById[String(npc.areaId)] || [];
    if (adj.length === 0) continue;

    // small chance to rest
    const r = pseudoRandom(world.meta.seed, currentDay, npc.id);
    if (r < 0.25){
      intents.push({ source: npc.id, type: "REST", payload: {} });
      continue;
    }

    const idx = Math.floor(pseudoRandom(world.meta.seed + 999, currentDay, npc.id) * adj.length);
    const toAreaId = adj[idx];

    intents.push({ source: npc.id, type: "MOVE", payload: { toAreaId } });
  }

  return intents;
}

function pseudoRandom(seed, day, id){
  // deterministic tiny PRNG based on a few integers
  let h = 2166136261 >>> 0;
  const s = String(seed) + "|" + String(day) + "|" + String(id);
  for (let i = 0; i < s.length; i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // convert to [0,1)
  return (h >>> 0) / 4294967296;
}
