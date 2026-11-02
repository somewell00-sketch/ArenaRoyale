// Narrative layer: everything the player reads about the world goes through here.
// Rule: no raw numbers about the world. The player learns things the way their
// tribute would — by seeing, hearing, smelling and remembering.
import { getItemDef } from "./items.js";

function hash32(str){
  let h = 2166136261 >>> 0;
  const s = String(str);
  for(let i = 0; i < s.length; i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
export function pick(list, key){
  const arr = Array.isArray(list) ? list : [];
  if(!arr.length) return "";
  return arr[hash32(key) % arr.length];
}
function cap(s){ const t = String(s || ""); return t ? t[0].toUpperCase() + t.slice(1) : t; }

// ---------------------------------------------------------------------------
// Senses (neighbouring areas)
// ---------------------------------------------------------------------------
const FOOD_SMELL = {
  wild_fruits: "ripe fruit",
  edible_roots: "freshly turned earth and roots",
  freshwater_fish: "fish",
  capital_ration: "something sweet and processed — Capitol food"
};

function towards(dir){
  if(dir === "here") return "here";
  if(dir === "nearby") return "nearby";
  return `to the ${dir}`;
}

export function senseText(s, key){
  const where = towards(s.dir);
  const k = `${key}:${s.kind}:${s.areaId}`;
  const vague = s.clarity === "vague";
  const clear = s.clarity === "clear";
  switch(s.kind){
    case "monster":
      return pick([
        `The ground trembles ${where}. Something huge is moving.`,
        `A deep, wet growl rolls in from ${s.dir === "nearby" ? "nearby" : "the " + s.dir}.`,
        `Trees crack and fall ${where}. That is no tribute.`
      ], k);
    case "danger":
      if(s.dir === "here") return pick([
        "It is loud here. Too loud. Something is hunting.",
        "Every sound here carries. You feel watched."
      ], k);
      return pick([
        `Birds burst from the trees ${where}.`,
        `A scream, cut short, ${where}.`,
        `Metal on metal ${where}. A fight, maybe.`
      ], k);
    case "noise":
      return pick([
        "Distant voices drift through this place.",
        "Footsteps came and went here not long ago."
      ], k);
    case "people":
      if(vague) return pick([
        `You think you heard something ${where}. Or nothing at all.`,
        `A twig snaps ${where}… maybe.`
      ], k);
      if(clear && Number(s.detail) >= 3) return pick([
        `Several voices ${where}. A group, keeping low.`,
        `You count more than two shadows moving ${where}.`
      ], k);
      if(clear && Number(s.detail) === 1) return pick([
        `One person ${where}, moving carefully.`,
        `Single footsteps ${where}. Someone alone.`
      ], k);
      return pick([
        `Footsteps ${where}.`,
        `Someone is ${where}. You catch a glimpse of movement.`,
        `Low voices ${where}.`
      ], k);
    case "water":
      return vague
        ? pick([`The air feels damp ${where}.`, `You might hear water ${where}.`], k)
        : pick([`You hear running water ${where}.`, `The smell of clean water ${where}.`], k);
    case "food": {
      if(vague) return pick([`Something edible ${where}? Hard to tell.`, `A faint smell of food ${where}.`], k);
      const what = FOOD_SMELL[s.detail] || "food";
      return clear ? `The smell of ${what} ${where}.` : `Something edible ${where}.`;
    }
    case "heal":
      return pick([`A glint of a white medical box ${where}.`, `You spot a scrap of bandage ${where}.`], k);
    case "trap":
      return pick([`Freshly disturbed soil ${where}. Someone set something.`, `A thin wire catches the light ${where}.`], k);
    default:
      return "";
  }
}

export function senseLines(world){
  const s = world?.flags?.senses;
  const day = Number(world?.meta?.day ?? 1);
  if(!s || s.day !== day || s.areaId !== world?.entities?.player?.areaId) return [];
  const key = `${world?.meta?.seed ?? 0}:${day}`;
  // Merge repeated sensations of the same kind into one sentence ("…to the east and north").
  const groups = new Map();
  for(const it of (s.items || [])){
    const k = it.kind === "people" ? `people:${it.areaId}` : it.kind;
    if(!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  const out = [];
  for(const items of groups.values()){
    const first = items[0];
    if(items.length === 1 || first.dir === "here"){
      out.push({ areaId: first.areaId, dir: first.dir, kind: first.kind, text: senseText(first, key) });
      continue;
    }
    const dirs = Array.from(new Set(items.map(x => x.dir).filter(d => d && d !== "here")));
    const list = dirs.length > 1 ? `${dirs.slice(0, -1).join(", ")} and ${dirs[dirs.length - 1]}` : dirs[0];
    const text = senseText({ ...first, dir: "__DIRS__" }, key).replace("to the __DIRS__", `to the ${list}`).replace("the __DIRS__", `the ${list}`).replace("__DIRS__", list);
    out.push({ areaId: first.areaId, dir: list, kind: first.kind, text, areaIds: items.map(x => x.areaId) });
  }
  return out.filter(x => x.text);
}

export const SENSE_ICON = { monster:"🐾", danger:"⚠️", noise:"🔊", people:"👣", water:"💧", food:"🍎", heal:"✚", trap:"🪤" };

// Unmerged sensations about one area (for map hover), each with an icon.
export function senseItemsFor(world, areaId){
  const s = world?.flags?.senses;
  const day = Number(world?.meta?.day ?? 1);
  if(!s || s.day !== day || s.areaId !== world?.entities?.player?.areaId) return [];
  const key = `${world?.meta?.seed ?? 0}:${day}`;
  return (s.items || []).filter(it => Number(it.areaId) === Number(areaId) && it.dir !== "here")
    .map(it => ({ kind: it.kind, icon: SENSE_ICON[it.kind] || "•", text: senseText(it, key) }));
}

// ---------------------------------------------------------------------------
// Memory (visited areas) — fades with time
// ---------------------------------------------------------------------------
export function memoryLines(world, areaId){
  const m = world?.flags?.intel?.[String(areaId)];
  if(!m) return [];
  const day = Number(world?.meta?.day ?? 1);
  const age = Math.max(0, day - Number(m.day ?? day));
  const isHere = Number(world?.entities?.player?.areaId) === Number(areaId);
  const lines = [];
  const sure = isHere || age <= 1;
  const hazy = !isHere && age >= 5;
  if(hazy){
    lines.push("Your memory of this place is hazy.");
    return lines;
  }
  const lead = sure ? "" : "You think ";
  if(m.cornucopia) lines.push("The Cornucopia. Its crates are restocked with food every dawn.");
  if(m.water) lines.push(sure ? "There is clean water here." : `${lead}there was water here.`);
  if(m.food && m.food.length){
    const what = m.food.map(id => (getItemDef(id)?.name || id).toLowerCase());
    const uniq = Array.from(new Set(what));
    lines.push(sure ? `Food here: ${uniq.join(", ")}.` : `${lead}you saw ${uniq.join(", ")} here.`);
  }
  if(m.heal) lines.push(sure ? "Medical supplies lie here." : `${lead}there were medical supplies here.`);
  if(!lines.length) lines.push(sure ? "Nothing useful here." : `${lead}there was nothing useful here.`);
  return lines;
}

// ---------------------------------------------------------------------------
// Body (option B: bars without numbers + a word)
// ---------------------------------------------------------------------------
export function bodyHPWord(hp){
  if(hp <= 0) return "Dead";
  if(hp <= 14) return "Dying";
  if(hp <= 39) return "Badly wounded";
  if(hp <= 69) return "Wounded";
  if(hp <= 89) return "Scratched";
  return "Unhurt";
}
export function bodyFPWord(fp){
  if(fp <= 0) return "Starving";
  if(fp <= 19) return "Exhausted";
  if(fp <= 39) return "Hungry";
  if(fp <= 69) return "Tired";
  return "Strong";
}

export function bodySentence(hp, fp, key){
  const h = Number(hp) || 0, f = Number(fp) || 0;
  const body = h > 89 ? "Your body is whole." : h > 69 ? "Cuts and bruises, nothing more." : h > 39 ? "Your wounds throb." : h > 14 ? "You are badly hurt." : "You are barely holding on.";
  const energy = f > 69 ? "You still have strength." : f > 39 ? "Tiredness sits in your bones." : f > 19 ? "Hunger gnaws at you." : f > 0 ? "You are running on nothing." : "You are starving.";
  return `${body} ${energy}`;
}

// ---------------------------------------------------------------------------
// Damage, weapons
// ---------------------------------------------------------------------------
export function hurtPhrase(dmg, key){
  const d = Number(dmg) || 0;
  if(d <= 0) return "no harm done";
  if(d < 8) return pick(["a graze", "a shallow scratch", "a bruise"], key);
  if(d < 20) return pick(["a cut", "a painful blow", "a bleeding gash"], key);
  if(d < 35) return pick(["a deep wound", "a heavy blow", "something cracks"], key);
  return pick(["a brutal wound", "a crushing blow", "a wound that should have killed you"], key);
}

export function hitOnOther(dmg, key){
  const d = Number(dmg) || 0;
  if(d <= 0) return "but it does nothing";
  if(d < 8) return pick(["and barely scratch them", "and only graze them"], key);
  if(d < 20) return pick(["and draw blood", "and they stagger"], key);
  if(d < 35) return pick(["and hit hard", "and they cry out"], key);
  return pick(["and the blow is devastating", "and they go down on one knee"], key);
}

export function weaponFeel(def){
  const d = Number(def?.damage || 0);
  if(def?.effects?.appliesPoison) return "Poisoned darts. Quiet, slow, cruel.";
  if(def?.effects?.penetratesShield) return "It will hurt everyone nearby — maybe you too.";
  if(d <= 15) return "Light. Better than bare hands.";
  if(d <= 35) return "Solid in the hand.";
  if(d <= 55) return "Heavy. It could end a fight.";
  return "Brutal. It could end a life in one blow.";
}

export function usesPhrase(n){
  const u = Number(n);
  if(!Number.isFinite(u)) return "";
  if(u <= 1) return "Only one use left.";
  if(u <= 3) return "A few uses left.";
  return "";
}

export function itemTooltip(def, it){
  if(!def) return "";
  const lines = [def.name];
  if(def.type === "weapon") lines.push(weaponFeel(def));
  if(def.type === "protection") lines.push("Raise it when you defend.");
  if(def.type === "consumable" && def.effects?.healFP) lines.push("Food.");
  if(def.type === "consumable" && def.effects?.healHP) lines.push("Medical supplies.");
  const uses = usesPhrase(it?.usesLeft);
  if(uses) lines.push(uses);
  if(def.description) lines.push(def.description);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Other tributes: what you can see of them
// ---------------------------------------------------------------------------
export function visibleState(entity, { isMonster = false } = {}){
  const hp = Number(entity?.hp ?? 100);
  const max = Number(entity?.maxHp ?? 100) || 100;
  const pct = hp / max;
  const bits = [];
  if(pct <= 0.15) bits.push("barely standing");
  else if(pct <= 0.4) bits.push("limping");
  else if(pct <= 0.75) bits.push("bloodied");
  if(!isMonster){
    const w = entity?.inventory?.equipped?.weaponDefId;
    const def = w ? getItemDef(w) : null;
    if(def && def.id !== "fist") bits.push(`carries a ${def.name.toLowerCase()}`);
    else bits.push("empty-handed");
    if(Number(entity?.fp ?? 100) <= 19) bits.push("gaunt");
  }
  return bits.join(", ");
}

export { cap };
