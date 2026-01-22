export const MapSize = {
  SMALL: 24,
  MEDIUM: 48,
  LARGE: 72
};

export const DISTRICTS = [
  { id: 1, name: "Luxury items", emoji: "💎", career: true },
  { id: 2, name: "Masonry, defense, weaponry", emoji: "🛡️", career: true },
  { id: 3, name: "Electronics, technology", emoji: "⚙️", career: false },
  { id: 4, name: "Fishing", emoji: "🎣", career: true },
  { id: 5, name: "Power, energy", emoji: "⚡", career: false },
  { id: 6, name: "Transportation", emoji: "🚆", career: false },
  { id: 7, name: "Lumber, wood", emoji: "🪵", career: false },
  { id: 8, name: "Textiles, clothing", emoji: "🧵", career: false },
  { id: 9, name: "Grain, agriculture", emoji: "🌾", career: false },
  { id: 10, name: "Livestock, meat", emoji: "🐄", career: false },
  { id: 11, name: "Agriculture, food production", emoji: "🍎", career: false },
  { id: 12, name: "Coal mining", emoji: "⛏️", career: false }
];

export function cloneWorld(world){
  return structuredClone(world);
}

function pseudoRandom(seed, salt){
  // deterministic [0,1)
  let h = 2166136261 >>> 0;
  const s = `${seed}|${salt}`;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h << 13; h >>>= 0;
  h ^= h >>> 17; h >>>= 0;
  h ^= h << 5; h >>>= 0;
  return (h >>> 0) / 4294967296;
}

function rollAttributes(seed, actorId){
  // distribute 7 points across F/D/P (min 0)
  let pts = 7;
  let F=0,D=0,P=0;
  for(let i=0;i<7;i++){
    const r = pseudoRandom(seed, `${actorId}|attr|${i}`);
    if (r < 0.34) F++;
    else if (r < 0.67) D++;
    else P++;
  }
  return { F, D, P };
}

export function createInitialWorld({
  seed,
  mapSize,
  mapData,
  totalPlayers = 12,
  playerDistrict = 12,
  tributePool = null
}){
  const pool = (tributePool && Array.isArray(tributePool) && tributePool.length)
    ? tributePool
    : Array.from({length: totalPlayers}, (_,i)=>({ name: `Tribute ${i+1}` }));

  // pick names (deterministic order from seed)
  const names = pool.slice(0);
  // fisher-yates with deterministic randomness
  for(let i=names.length-1;i>0;i--){
    const r = pseudoRandom(seed, `shuffle|${i}`);
    const j = Math.floor(r*(i+1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  const npcs = {};
  const npcCount = Math.max(0, totalPlayers - 1);

  for (let i = 1; i <= npcCount; i++){
    const id = `npc_${i}`;
    const district = 1 + Math.floor(pseudoRandom(seed, `${id}|district`) * 12);
    npcs[id] = {
      id,
      kind: "npc",
      name: names[i]?.name || `Tribute ${i+1}`,
      district,
      areaId: 1,
      hp: 100,
      stamina: 70,
      attrs: rollAttributes(seed, id),
      status: [],
      inventory: {},
      memory: { goal: "survive" },
      alive: true
    };
  }

  const player = {
    id: "player",
    kind: "player",
    name: "You",
    district: Number(playerDistrict),
    areaId: 1,
    hp: 100,
    stamina: 70,
    attrs: rollAttributes(seed, "player"),
    status: [],
    inventory: {},
    memory: {},
    alive: true
  };

  return {
    meta: {
      version: 2,
      seed,
      day: 1,
      mapSize,
      totalPlayers
    },
    map: mapData, // { areasById, adjById, uiGeom }
    entities: {
      player,
      npcs
    },
    flags: {
      visitedAreas: [1],
      closedAreas: [] // areaIds
    },
    log: {
      days: [] // [{day, publicEvents:[], privateEvents:[]}]
    },
    replay: {
      playerActionsByDay: [] // index day-1
    }
  };
}

export function getAllActors(world){
  return [world.entities.player, ...Object.values(world.entities.npcs)];
}

export function districtInfo(id){
  return DISTRICTS.find(d => d.id === Number(id)) || { id: Number(id), name: "Unknown", emoji: "🏷️", career: false };
}
