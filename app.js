import { MapSize, createInitialWorld } from "./state.js";
import { generateMapData, BIOME_BG } from "./mapgen.js";
import { MapUI } from "./mapui.js";
import { commitPlayerAction, useInventoryItem, moveActorOneStep, endDay, refreshPlayerIntel } from "./sim.js";
import { pick, cap, senseLines, memoryLines, bodyHPWord, bodyFPWord, bodySentence, hurtPhrase, hitOnOther, itemTooltip, visibleState } from "./narrative.js";
import { getItemDef, getItemIcon, ItemTypes, displayDamageLabel, inventoryCount, INVENTORY_LIMIT, itemsReady } from "./items.js";
import { generateNpcIntents } from "./ai.js";
import { saveToLocal, loadFromLocal, clearLocal, downloadJSON, uploadJSON } from "./storage.js";

const root = document.getElementById("root");

// Mobile Safari can "helpfully" zoom/pan the page on double-tap / pinch gestures,
// which feels like the map camera jumping around. We block those gestures so the
// canvas stays visually stable.
document.addEventListener("gesturestart", (e) => { e.preventDefault(); }, { passive: false });
document.addEventListener("gesturechange", (e) => { e.preventDefault(); }, { passive: false });
document.addEventListener("gestureend", (e) => { e.preventDefault(); }, { passive: false });

// --- Global tooltip system (works on start screen and in-game) ---
const getUiTooltipEl = () => document.getElementById("uiTooltip");
let __tooltipsInit = false;
let tooltipActive = false;
let tooltipText = "";
function showTooltip(text){
  const uiTooltipEl = getUiTooltipEl();
  if(!uiTooltipEl) return;
  tooltipActive = true;
  tooltipText = String(text || "");
  uiTooltipEl.textContent = tooltipText;
  uiTooltipEl.classList.remove("hidden");
}
function hideTooltip(){
  tooltipActive = false;
  const uiTooltipEl = getUiTooltipEl();
  if(!uiTooltipEl) return;
  uiTooltipEl.classList.add("hidden");
}
function moveTooltip(e){
  const uiTooltipEl = getUiTooltipEl();
  if(!tooltipActive || !uiTooltipEl) return;
  const pad = 14;
  const w = uiTooltipEl.offsetWidth || 240;
  const h = uiTooltipEl.offsetHeight || 80;
  const x = clamp((e.clientX + 14), pad, window.innerWidth - w - pad);
  const y = clamp((e.clientY + 16), pad, window.innerHeight - h - pad);
  uiTooltipEl.style.left = `${x}px`;
  uiTooltipEl.style.top = `${y}px`;
}
function ensureTooltips(){
  if(__tooltipsInit) return;
  __tooltipsInit = true;
  document.addEventListener("mousemove", moveTooltip, { passive:true });
  document.addEventListener("mouseover", (e) => {
    const t = e.target?.closest?.("[data-tooltip]");
    if(!t) return;
    const txt = t.getAttribute("data-tooltip");
    if(txt) showTooltip(txt);
  });
  document.addEventListener("mouseout", (e) => {
    const t = e.target?.closest?.("[data-tooltip]");
    if(!t) return;
    hideTooltip();
  });
}

// Ensure item definitions are loaded before any UI/simulation tries to reference them.
try {
  await itemsReady;
} catch (e) {
  console.error(e);
  root.innerHTML = `
    <div class="screen">
      <div class="card">
        <div class="banner-hero h1">Battle Royale Simulator</div>
        <div class="alert">Failed to load item definitions (data/items.json). Please reload.</div>
      </div>
    </div>
  `;
  throw e;
}

let world = null;

// --- Minimal UI-only toast log (for death/victory recap) ---
// Stored in-memory in app.js only (does not affect sim/ai/state/sync).
let toastLog = [];

// --- UI-only narrative memory (area scars + light mood/foreshadowing) ---
// Stored under `world.uiNarrative` so it never affects sim rules.
function ensureUiNarrative(){
  if(!world) return null;
  if(!world.uiNarrative){
    world.uiNarrative = {
      areas: {},
      // cooldowns / last-shown markers to avoid spam
      lastAreaNarrativeAt: {},
      lastMoodToastDay: 0,
      lastMoodKey: "",
      lastQuietToastAt: { day: 0, areaId: 0, n: 0 }
    };
  }
  if(!world.uiNarrative.areas) world.uiNarrative.areas = {};
  if(!world.uiNarrative.lastAreaNarrativeAt) world.uiNarrative.lastAreaNarrativeAt = {};
  if(!world.uiNarrative.lastQuietToastAt) world.uiNarrative.lastQuietToastAt = { day: 0, areaId: 0, n: 0 };
  return world.uiNarrative;
}

function getAreaNarrative(areaId){
  const ui = ensureUiNarrative();
  if(!ui) return null;
  const k = String(areaId ?? "");
  if(!ui.areas[k]){
    ui.areas[k] = {
      lastPlayerInjuryDay: 0,
      lastPlayerInjuryCause: "",
      deaths: [] // { name, day }
    };
  }
  return ui.areas[k];
}

function areaName(areaId){
  const a = world?.map?.areasById?.[String(areaId ?? "")];
  if(!a) return `Area ${areaId}`;
  // Prefer label if present; fall back to numeric.
  return a.name || a.label || `Area ${areaId}`;
}

function recordPlayerInjury({ areaId, causeText } = {}){
  const ui = ensureUiNarrative();
  if(!ui) return;
  const aId = Number(areaId ?? world?.entities?.player?.areaId ?? 1);
  const day = Number(world?.meta?.day ?? 0);
  const mem = getAreaNarrative(aId);
  if(!mem) return;
  mem.lastPlayerInjuryDay = day;
  mem.lastPlayerInjuryCause = String(causeText || "").trim();
}

function recordAreaDeath({ areaId, whoId } = {}){
  const ui = ensureUiNarrative();
  if(!ui) return;
  const aId = Number(areaId ?? world?.entities?.player?.areaId ?? 1);
  const day = Number(world?.meta?.day ?? 0);
  if(!whoId || whoId === "player") return;
  const n = world?.entities?.npcs?.[whoId];
  const name = (n?.name || String(whoId)).trim();
  const mem = getAreaNarrative(aId);
  if(!mem) return;
  mem.deaths = Array.isArray(mem.deaths) ? mem.deaths : [];
  mem.deaths.push({ name, day });
  // keep only the last 2 to avoid clutter
  if(mem.deaths.length > 2) mem.deaths.splice(0, mem.deaths.length - 2);
}

const uiState = {
  focusedAreaId: 1,
  phase: "needs_action", // needs_action | explore
  movesUsed: 0,
  dayEvents: [],
  selectedTarget: null,
  selectedGroundIndex: null,
  selectionMode: null, // "target" | "item" | null
  leftAlert: null,
  victoryDialogShown: false,
};

const MAX_MOVES_PER_DAY = 3;

// --- Tooltip helpers (single tooltip for the whole UI) ---
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function hash32(str){
  // Deterministic small hash (FNV-1a-ish)
  let h = 2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // force unsigned 32-bit
  return h >>> 0;
}

function pickDeterministic(list, key){
  if(!list || list.length === 0) return "";
  const idx = hash32(key) % list.length;
  return list[idx];
}

// --- Procedural biome background texture (no image assets) ---
// Applied to .canvasWrap as: [biome color overlay] + [generated texture].
// Cached by (biome, variant) so it is generated once per session.
const BIOME_TEXTURES = {
  glacier:    { grain: 0.20, streaks: 0.70, spots: 0.05, grid: 0.00 },
  tundra:     { grain: 0.25, streaks: 0.35, spots: 0.10, grid: 0.00 },
  mountain:   { grain: 0.22, streaks: 0.30, spots: 0.20, grid: 0.00 },
  desert:     { grain: 0.25, streaks: 0.60, spots: 0.05, grid: 0.00 },
  caatinga:   { grain: 0.28, streaks: 0.45, spots: 0.12, grid: 0.00 },
  savanna:    { grain: 0.22, streaks: 0.40, spots: 0.10, grid: 0.00 },
  plains:     { grain: 0.20, streaks: 0.45, spots: 0.08, grid: 0.00 },
  woods:      { grain: 0.30, streaks: 0.15, spots: 0.45, grid: 0.00 },
  forest:     { grain: 0.35, streaks: 0.10, spots: 0.55, grid: 0.00 },
  jungle:     { grain: 0.38, streaks: 0.08, spots: 0.65, grid: 0.00 },
  fairy:      { grain: 0.22, streaks: 0.18, spots: 0.28, grid: 0.00 },
  swamp:      { grain: 0.35, streaks: 0.10, spots: 0.65, grid: 0.00 },
  lake:       { grain: 0.15, streaks: 0.25, spots: 0.35, grid: 0.00 },
  industrial: { grain: 0.20, streaks: 0.15, spots: 0.10, grid: 0.80 },
  cornucopia: { grain: 0.18, streaks: 0.20, spots: 0.12, grid: 0.25 },
  default:    { grain: 0.25, streaks: 0.20, spots: 0.15, grid: 0.00 },
};

const biomeTexCache = new Map(); // key: `${biome}:${variant}` => dataURL

function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(x){ return Math.max(0, Math.min(1, x)); }

function hexToRgba(hex, alpha){
  const h = String(hex || "").trim();
  if(!h.startsWith("#") || (h.length !== 7)) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(1,3), 16);
  const g = parseInt(h.slice(3,5), 16);
  const b = parseInt(h.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function makeBiomeOverlay(biome){
  const bg = BIOME_BG?.[biome] || BIOME_BG?.default || ["#0b0f1a", "#0b0f1a"];
  const c1 = hexToRgba(bg[0], 0.55);
  const c2 = hexToRgba(bg[1], 0.55);
  return `linear-gradient(180deg, ${c1}, ${c2})`;
}

function makeTextureDataURL(biome, seedBase, variant, size = 256){
  const recipe = BIOME_TEXTURES[biome] || BIOME_TEXTURES.default;
  const rnd = mulberry32((seedBase ^ ((variant + 1) * 9973)) >>> 0);

  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });

  const img = ctx.createImageData(size, size);
  const d = img.data;

  const grain = recipe.grain ?? 0.25;
  const streaks = recipe.streaks ?? 0.20;
  const spots = recipe.spots ?? 0.15;
  const grid = recipe.grid ?? 0.00;

  // streak direction: glacier/tundra diagonal; desert/plains more horizontal; others mixed
  const angle = (biome === "glacier" || biome === "tundra") ? (Math.PI / 4)
    : (biome === "desert" || biome === "plains" || biome === "savanna" || biome === "caatinga") ? (Math.PI / 2)
    : (Math.PI / 3);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);

  // blobs
  const blobCount = Math.floor(8 + 22 * spots);
  const blobs = [];
  for(let i=0;i<blobCount;i++){
    blobs.push({
      x: rnd() * size,
      y: rnd() * size,
      r: (0.06 + rnd() * 0.22) * size,
      s: 0.5 + rnd() * 0.9,
    });
  }

  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const idx = (y * size + x) * 4;

      // grain
      let v = (rnd() - 0.5) * 2 * grain;

      // streaks (wave along chosen axis)
      if(streaks > 0){
        const t = (x * ax + y * ay) / size;
        v += Math.sin((t * 10 + rnd() * 2) * Math.PI * 2) * 0.5 * streaks;
      }

      // spots/blobs
      if(spots > 0){
        let b = 0;
        for(let i=0;i<blobs.length;i++){
          const dx = x - blobs[i].x;
          const dy = y - blobs[i].y;
          const dist2 = dx*dx + dy*dy;
          const rr = blobs[i].r * blobs[i].r;
          b += Math.exp(-dist2 / rr) * blobs[i].s;
        }
        v += (b / blobs.length) * spots;
      }

      // industrial grid / scanlines
      if(grid > 0){
        const gx = (x % 24) === 0 || (x % 24) === 1;
        const gy = (y % 24) === 0 || (y % 24) === 1;
        const line = (gx || gy) ? 0.9 : 0;
        v += line * grid;
      }

      // convert to alpha: a subtle darkening texture over the biome overlay
      const a = clamp01(Math.abs(v)) * 0.35;
      d[idx + 0] = 0;
      d[idx + 1] = 0;
      d[idx + 2] = 0;
      d[idx + 3] = Math.floor(a * 255);
    }
  }

  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

function applyBiomeBackground(){
  if(!world) return;
  const wrap = document.querySelector(".canvasWrap");
  if(!wrap) return;
  const p = world?.entities?.player;
  if(!p) return;
  const a = world?.map?.areasById?.[String(p.areaId)];
  const biome = String(a?.biome || "default").toLowerCase();

  const day = Number(world?.meta?.day ?? 0);
  const seedBase = hash32(`${day}:${p.areaId}:${biome}:${world?.meta?.seed ?? 0}`);
  const variant = seedBase % 5;
  const key = `${biome}:${variant}`;
  let tex = biomeTexCache.get(key);
  if(!tex){
    tex = makeTextureDataURL(biome, seedBase, variant, 256);
    biomeTexCache.set(key, tex);
  }

  const overlay = makeBiomeOverlay(biome);
  wrap.style.backgroundImage = `${overlay}, url("${tex}")`;
}

function hpSignal(hp, key){
  if(hp <= 0) return pickDeterministic([
    "Falls lifeless.",
    "Drops to the ground, dead."
  ], key + ":hp:dead");
  if(hp <= 14) return pickDeterministic([
    "Barely standing, bleeding heavily.",
    "On the verge of physical collapse.",
    "Struggling to stay upright, bleeding heavily."
  ], key + ":hp:crit");
  if(hp <= 39) return pickDeterministic([
    "Bleeding heavily.",
    "Severely injured.",
    "Struggling to stay upright."
  ], key + ":hp:low");
  if(hp <= 69) return pickDeterministic([
    "Visible wounds.",
    "Clearly injured, but still standing.",
    "Blood is visible."
  ], key + ":hp:mid");
  return pickDeterministic([
    "No visible wounds.",
    "Minor cuts and scratches.",
    "Superficial injuries."
  ], key + ":hp:high");
}

function fpSignal(fp, key){
  if(fp <= 0) return "Collapses from exhaustion.";
  if(fp <= 9) return pickDeterministic([
    "Breathing is labored.",
    "Slow reactions.",
    "Movements are slowing."
  ], key + ":fp:crit");
  if(fp <= 19) return pickDeterministic([
    "Barely keeping pace.",
    "Hands tremble with fatigue.",
    "Struggling to stay focused."
  ], key + ":fp:low");
  if(fp <= 49) return pickDeterministic([
    "Breathing is faster.",
    "Showing signs of fatigue.",
    "Movement is less consistent."
  ], key + ":fp:mid");
  return pickDeterministic([
    "Steady and confident movements.",
    "Breathing is calm and controlled.",
    "Maintains a strong posture."
  ], key + ":fp:high");
}

function tierHP(hp){
  if(hp <= 0) return 4;
  if(hp <= 14) return 3;
  if(hp <= 39) return 2;
  if(hp <= 69) return 1;
  return 0;
}
function tierFP(fp){
  if(fp <= 0) return 3;
  if(fp <= 9) return 2;
  if(fp <= 19) return 1;
  return 0;
}

function statusTooltipFor(entity, worldMeta){
  const hp = Number(entity?.hp ?? 0);
  const fp = Number(entity?.fp ?? 0);
  const keyBase = `${worldMeta?.seed ?? 0}:${worldMeta?.day ?? 0}:${entity?.id ?? "?"}`;

  // Death is always just the HP signal.
  if(hp <= 0) return hpSignal(hp, keyBase);

  const hpT = tierHP(hp);
  const fpT = tierFP(fp);
  const hpS = hpSignal(hp, keyBase);
  const fpS = fpSignal(fp, keyBase);

  // Mold B: critical state -> two short sentences.
  if(hpT >= 3 || fpT >= 2){
    // Prioritize the worse axis first.
    if(hpT > fpT) return `${hpS} ${fpS}`;
    if(fpT > hpT) return `${fpS} ${hpS}`;
    return `${hpS} ${fpS}`;
  }

  // Mold A: one dominant axis
  const diff = Math.abs(hpT - fpT);
  if(diff >= 1){
    const connector = pickDeterministic(["but", "while", "despite", "even though"], keyBase + ":conn");
    if(hpT > fpT){
      return `${stripPeriod(hpS)}, ${connector} ${lowerFirst(stripPeriod(fpS))}.`;
    }
    if(fpT > hpT){
      return `${stripPeriod(fpS)}, ${connector} ${lowerFirst(stripPeriod(hpS))}.`;
    }
  }

  // Mold C: balanced
  return `${stripPeriod(hpS)} and ${lowerFirst(stripPeriod(fpS))}.`;
}

function stripPeriod(s){
  return String(s || "").replace(/\.$/, "").trim();
}
function lowerFirst(s){
  const t = String(s || "").trim();
  return t ? (t[0].toLowerCase() + t.slice(1)) : t;
}

const DISTRICT_INFO = {
  1: { name: "Luxury items", emoji: "💎", career: true },
  2: { name: "Masonry, defense, weaponry", emoji: "🛡️", career: true },
  3: { name: "Electronics, technology", emoji: "💻", career: false },
  4: { name: "Fishing", emoji: "🐟", career: true },
  5: { name: "Power, energy", emoji: "⚡", career: false },
  6: { name: "Transportation", emoji: "🚆", career: false },
  7: { name: "Lumber, wood", emoji: "🪵", career: false },
  8: { name: "Textiles, clothing", emoji: "🧵", career: false },
  9: { name: "Grain, agriculture", emoji: "🌾", career: false },
  10:{ name: "Livestock, meat", emoji: "🐄", career: false },
  11:{ name: "Agriculture, food production", emoji: "🥕", career: false },
  12:{ name: "Coal mining", emoji: "⛏️", career: false },
};

function districtTag(d){
  const info = DISTRICT_INFO[d] || { emoji:"🏷️", name:"" };
  return `${info.emoji} Dist. ${d}`;
}

function renderStart(){
  // Enable hover tooltips on the start screen as well.
  ensureTooltips();
  root.innerHTML = `
    <div class="screen">
      <div class="card">
        <div class="banner-hero h1">Battle Royale Simulator</div>
        <div class="muted">You start at the Cornucopia (Area 1). Each day: first commit an action, then you can move (up to 3 adjacent areas) and finish with End Day.</div>
        <hr class="sep" />

        <div class="h2" style="margin:0 0 6px 0;">Your attributes (20 points)</div>
        <div class="muted small" style="margin-bottom:10px;">Allocate 20 points across Strength (S), Dexterity (D), and Perception (P). Each attribute ranges from 0 to 10.</div>

        <div class="attrStack">
          <div class="attrRow">
            <div class="attrRowLabel"><span class="attrName">Strength</span> <span class="muted">(S)</span> <span class="helpIcon" data-tooltip="Determines who strikes first when attacks are mutual.">?</span></div>
            <div class="attrRowMin">0</div>
            <input id="attrF" class="hSlider" type="range" min="0" max="10" step="1" value="7" aria-label="Strength" />
            <div class="attrRowMax">10</div>
            <div class="attrRowVal" id="attrFVal">7</div>
          </div>

          <div class="attrRow">
            <div class="attrRowLabel"><span class="attrName">Dexterity</span> <span class="muted">(D)</span> <span class="helpIcon" data-tooltip="Prioritizes item pickups. Some weapons require Dexterity.">?</span></div>
            <div class="attrRowMin">0</div>
            <input id="attrD" class="hSlider" type="range" min="0" max="10" step="1" value="7" aria-label="Dexterity" />
            <div class="attrRowMax">10</div>
            <div class="attrRowVal" id="attrDVal">7</div>
          </div>

          <div class="attrRow">
            <div class="attrRowLabel"><span class="attrName">Perception</span> <span class="muted">(P)</span> <span class="helpIcon" data-tooltip="Sharpens your senses. What you notice around you is clearer and more reliable, and you are harder to ambush or trap. Low Perception means vague hunches and false alarms.">?</span></div>
            <div class="attrRowMin">0</div>
            <input id="attrP" class="hSlider" type="range" min="0" max="10" step="1" value="6" aria-label="Perception" />
            <div class="attrRowMax">10</div>
            <div class="attrRowVal" id="attrPVal">6</div>
          </div>

          <div class="attrTotalRow">
            <div class="attrTotalLabel">Total</div>
            <div id="attrTotal" class="attrTotalValue">20 / 20</div>
            <div id="attrHint" class="attrTotalHint">OK</div>
          </div>

          <div class="muted small" style="margin-top:10px;">Tip: when the total is 20, you can only increase one attribute after reducing another.</div>
        </div>

        <hr class="sep" />

        <div class="row">
          <label class="muted">Map size</label>
          <select id="size" class="select">
            <option value="${MapSize.SMALL}">Small (24)</option>
            <option value="${MapSize.MEDIUM}" selected>Medium (48)</option>
            <option value="${MapSize.LARGE}">Large (72)</option>
            <option value="${MapSize.HUGE}">Huge (120)</option>
          </select>

          <label class="muted">Players</label>
          <select id="players" class="select">
            <option value="12">12</option>
            <option value="24" selected>24</option>
            <option value="36">36</option>
            <option value="48">48</option>
          </select>

          <label class="muted">Your district</label>
          <select id="district" class="select">
            ${Array.from({length:12}, (_,i)=>`<option value="${i+1}">District ${i+1}</option>`).join("")}
          </select>
        </div>

        <div class="row" style="margin-top:10px;">
          <button id="enter" class="btn primary" style="flex:1;" disabled>Enter arena</button>
          <button id="resume" class="btn">Resume</button>
          <button id="wipe" class="btn">Clear save</button>
        </div>
      </div>
    </div>
  `;

  const elF = document.getElementById("attrF");
  const elD = document.getElementById("attrD");
  const elP = document.getElementById("attrP");
  const elFVal = document.getElementById("attrFVal");
  const elDVal = document.getElementById("attrDVal");
  const elPVal = document.getElementById("attrPVal");
  const totalEl = document.getElementById("attrTotal");
  const hintEl = document.getElementById("attrHint");
  const enterBtn = document.getElementById("enter");

  const ATTR_MAX = 10;
  const ATTR_TOTAL = 20;

  // Sliders can never exceed a total of 7.
  // If the user tries to increase a slider beyond the available remaining points,
  // we automatically clamp the changed slider back down.
  const lastValid = {
    F: Number(elF.value) || 0,
    D: Number(elD.value) || 0,
    P: Number(elP.value) || 0,
  };

  function readVals(){
    return {
      F: Number(elF.value) || 0,
      D: Number(elD.value) || 0,
      P: Number(elP.value) || 0,
    };
  }

  function renderInvPills(inv){
    const items = Array.isArray(inv?.items) ? inv.items : [];
    if(!items.length) return `<span class="muted tiny">(empty)</span>`;
    return items.slice(0, 7).map(it => {
      const defId = it.defId;
      const def = getItemDef(defId);
      const icon = getItemIcon(defId);
      const qty = Number(it.qty || 1);
      const stack = qty > 1 ? ` x${escapeHtml(String(qty))}` : "";
      const title = escapeHtml(def?.description || "");
      return `<span class="debugItemPill" title="${title}"><span class="pillIcon" aria-hidden="true">${escapeHtml(icon)}</span>${escapeHtml(def?.name || defId)}${stack}</span>`;
    }).join("");
  }

  function writeVals(v){
    elF.value = String(v.F);
    elD.value = String(v.D);
    elP.value = String(v.P);
  }

  function updateLabels(v){
    elFVal.textContent = String(v.F);
    elDVal.textContent = String(v.D);
    elPVal.textContent = String(v.P);
  }

  function updateAttrsUI(){
    const v = readVals();
    let sum = v.F + v.D + v.P;
    totalEl.textContent = `${sum} / ${ATTR_TOTAL}`;

    if(sum === ATTR_TOTAL){
      hintEl.textContent = "OK";
      enterBtn.disabled = false;
    } else {
      const diff = ATTR_TOTAL - sum;
      hintEl.textContent = diff > 0 ? `Missing ${diff}` : `Reduce ${Math.abs(diff)}`;
      enterBtn.disabled = true;
    }
    updateLabels(v);
  }

  function onSliderInput(which){
    // Keep everything as ints 0..10
    const v = {
      F: Math.max(0, Math.min(ATTR_MAX, Math.round(Number(elF.value) || 0))),
      D: Math.max(0, Math.min(ATTR_MAX, Math.round(Number(elD.value) || 0))),
      P: Math.max(0, Math.min(ATTR_MAX, Math.round(Number(elP.value) || 0))),
    };

    let sum = v.F + v.D + v.P;
    if(sum > ATTR_TOTAL){
      const overflow = sum - ATTR_TOTAL;
      // Reduce ONLY the slider the user is currently changing.
      v[which] = Math.max(0, v[which] - overflow);
      writeVals(v);
      sum = v.F + v.D + v.P;
    }

    // Store last valid state (sum <= ATTR_TOTAL always holds here).
    lastValid.F = v.F; lastValid.D = v.D; lastValid.P = v.P;
    updateAttrsUI();
  }

  elF.addEventListener("input", () => onSliderInput("F"));
  elD.addEventListener("input", () => onSliderInput("D"));
  elP.addEventListener("input", () => onSliderInput("P"));
  // On change, ensure it snaps to an integer and stays consistent.
  [elF, elD, elP].forEach(el => el.addEventListener("change", () => updateAttrsUI()));
  updateAttrsUI();

  enterBtn.onclick = () => {
    const mapSize = Number(document.getElementById("size").value);
    const totalPlayers = Number(document.getElementById("players").value);
    const playerDistrict = Number(document.getElementById("district").value);
    const playerAttrs = {
      F: Number(elF.value) || 0,
      D: Number(elD.value) || 0,
      P: Number(elP.value) || 0,
    };
    startNewGame(mapSize, totalPlayers, playerDistrict, playerAttrs);
  };

  document.getElementById("resume").onclick = () => {
    const saved = loadFromLocal();
    if(!saved){ alert("No save found."); return; }
    world = saved;
    try { refreshPlayerIntel(world); } catch(_e) {}
    // UI-only: reset toast log so recaps match this resumed run.
    toastLog = [];
    uiState.focusedAreaId = world.entities.player.areaId;
    uiState.phase = "needs_action";
    uiState.movesUsed = 0;
    uiState.dayEvents = [];
    uiState.deathDialogShown = false;
    uiState.victoryDialogShown = false;
    renderGame();
  };

  document.getElementById("wipe").onclick = () => {
    clearLocal();
    alert("Save cleared.");
  };
}

function startNewGame(mapSize, totalPlayers, playerDistrict, playerAttrs, seedOverride = null){
  const seed = Number.isFinite(Number(seedOverride)) && seedOverride !== null ? Number(seedOverride) : ((Math.random() * 1e9) | 0);
  // Bigger arenas get a bigger world (cells keep a readable size).
  const worldSize = Math.round(820 * Math.sqrt(Math.max(48, Number(mapSize) || 48) / 48));
  const mapData = generateMapData({
    seed,
    regions: mapSize,
    width: worldSize,
    height: worldSize,
    paletteIndex: 0
  });

  world = createInitialWorld({ seed, mapSize, mapData, totalPlayers, playerDistrict, playerAttrs });
  world.meta.setup = { seed, mapSize, totalPlayers, playerDistrict, playerAttrs: playerAttrs ? { ...playerAttrs } : null };
  refreshPlayerIntel(world);

  // UI-only: reset toast log for the new run.
  toastLog = [];

  // UI-only: reset toast log for a fresh run.
  toastLog = [];

  uiState.focusedAreaId = 1;
  uiState.phase = "needs_action";
  uiState.movesUsed = 0;
  uiState.dayEvents = [];
  // Allow the death dialog to appear again after restarting.
  uiState.deathDialogShown = false;
  uiState.victoryDialogShown = false;

  saveToLocal(world);
  renderGame();
}

function renderGame(){
  root.innerHTML = `
    <div class="app stage">

      <!-- STAGE HUD: one slim line (you · body · energy · carrying · time · alive) -->
      <header class="stageHud" id="stageHud" aria-label="You"></header>

      <!-- LEFT: player inventory + debug -->
      <aside class="panel" id="rightPanel">
        <div class="row" style="justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div class="h1" style="margin:0; display:flex; align-items:center; gap:8px;">YOU <span id="youPoison" class="poisonIcon hidden" title="Poisoned">☠</span></div>
          <div id="youMeta" class="muted small" style="text-align:right;"></div>
        </div>

        <div class="statBlock">
          <div class="statLine">
            <div class="muted small">❤️ Body · <span id="youHpText"></span></div>
          </div>
          <div class="statBar"><div id="youHpBar" class="statFill"></div></div>
          <div class="statLine" style="margin-top:10px;">
            <div class="muted small">🍽️ Strength · <span id="youFpText"></span></div>
          </div>
          <div class="statBar"><div id="youFpBar" class="statFill"></div></div>
        </div>

        <div class="section" style="margin-top:12px;">
          <div><strong>Attack item</strong></div>
          <div id="attackSlot" class="slotRow" style="margin-top:8px;"></div>
          <div style="margin-top:10px;"><strong>Defense item</strong></div>
          <div id="defenseSlot" class="slotRow" style="margin-top:8px;"></div>
        </div>

        <div class="section" style="margin-top:12px;">
          <div><strong>Inventory</strong></div>
          <div class="muted small" style="margin-top:6px;">Limit: <span id="invCount"></span> / ${INVENTORY_LIMIT}</div>
          <div id="invPills" class="pillWrap" style="margin-top:10px;"></div>
          <div class="muted tiny" style="margin-top:8px;">Click a weapon to hold it, a shield to carry it, food or medicine to use it.</div>
        </div>

        <details id="debugDetails" class="section" style="margin-top:12px;">
          <summary class="muted" style="cursor:pointer;">Debug</summary>
          <div class="muted small" style="margin-top:6px;">Seed <span id="seed"></span></div>
          <div class="row" style="margin-top:8px;">
            <button id="debugAdvance" class="btn">Advance day</button>
          </div>
          <div class="muted small" style="margin-top:8px;">Entities (HP • area • S/D/P • K)</div>
          <div id="debugList" class="list" style="max-height:320px; overflow:auto;"></div>

          <div class="row" style="margin-top:10px; align-items:center; gap:8px;">
            <label class="muted small" style="display:inline-flex; align-items:center; gap:8px;">
              <input id="debugAiToggle" type="checkbox" /> AI metrics
            </label>
          </div>
          <div id="debugAiMetrics" class="muted small" style="margin-top:6px;"></div>

          <div class="muted" style="margin-top:12px;">Tools</div>
          <div class="row" style="margin-top:8px; flex-wrap:wrap; gap:8px;">
            <button id="regen" class="btn">New map</button>
            <button id="restart" class="btn">Restart</button>
            <button id="saveLocal" class="btn">Save</button>
            <button id="export" class="btn">Export JSON</button>
            <label class="btn" style="display:inline-flex; align-items:center; gap:8px;">
              Import <input id="import" type="file" accept="application/json" style="display:none" />
            </label>
            <button id="clearLocal" class="btn">Clear save</button>
          </div>
        </details>
      </aside>
    <main class="canvasWrap">
        <canvas id="c" width="820" height="820"></canvas>
        <div class="mapZoom" role="group" aria-label="Map zoom">
          <button id="zoomIn" class="zoomBtn" type="button" aria-label="Zoom in" data-tooltip="Zoom in (mouse wheel also works)">+</button>
          <button id="zoomOut" class="zoomBtn" type="button" aria-label="Zoom out" data-tooltip="Zoom out">−</button>
          <button id="zoomFit" class="zoomBtn wide" type="button" aria-pressed="false" data-tooltip="Show the whole arena / follow your tribute">Whole map</button>
          <button id="recenterBtn" class="zoomBtn wide" type="button" data-tooltip="Back to where you are">Recenter</button>
          <button id="journalBtn" class="zoomBtn wide" type="button" aria-expanded="false" aria-controls="journalDrawer">📓 Journal<span id="journalDot" class="journalDot hidden" aria-hidden="true"></span></button>
        </div>
        <aside id="journalDrawer" class="journalDrawer hidden" aria-label="Journal">
          <div class="journalHead"><strong>Journal</strong><button id="journalClose" class="zoomBtn" type="button" aria-label="Close journal">×</button></div>
          <div id="journalBody" class="journalBody"></div>
        </aside>
        <canvas id="mini" width="200" height="200" class="minimap" aria-label="Minimap"></canvas>
        <div id="areaInfo" class="areaInfo">—</div>
        <div id="toastHost" class="toastHost" aria-live="polite" aria-relevant="additions"></div>
        <div id="nightCard" class="nightCard hidden"></div>
        <span class="youDot" aria-hidden="true"></span>
        <section id="actionCard" class="actionCard" aria-live="polite" aria-label="Where you are and what you can do"></section>
        <section id="stageLog" class="stageLog" aria-label="Log"></section>
        <div class="hint">Act first, then click a neighbouring area to move</div>
      </main>
      <!-- RIGHT: gameplay (actions + entities in your current area) -->
      <aside class="panel" id="leftPanel">
        <div class="panelHeader">
          <div class="h1" style="margin:0;">${(world && world.map && world.map.arenaName) ? world.map.arenaName : "Survival Arena"}</div>
          <div class="fallenTributes" id="fallenTributes">${(() => {
            const npcs = world?.entities?.npcs || {};
            const ids = Object.keys(npcs);
            const fallen = ids.filter(id => (npcs[id]?.hp ?? 0) <= 0).length;
            return `${fallen} fallen tributes`;
          })()}</div>
          <div class="muted small">Day <span id="day"></span> • Area <span id="curArea"></span></div>
        </div>

        <div id="leftAlert" class="alert hidden">—</div>


        <div id="needsAction" class="section">
          <div class="banner">
            What do you do here? You must act before you can move on.
          </div>

          <div class="muted" style="margin-top:12px;">Players in the area</div>
          <div id="areaPills" class="pillWrap" style="margin-top:8px;"></div>

          <div id="groundItemWrap" class="hidden" style="margin-top:12px;">
            <div class="muted">Within reach</div>
            <div id="groundItemPills" class="pillWrap" style="margin-top:8px;"></div>
          </div>

          <div class="actionBar" id="needsActionBar">
          <div style="padding: 8px" ;="">Possible Actions:</div>
            <div class="row" style="gap:8px; flex-wrap:wrap;">
            <button id="btnDefend" class="btn blue" style="flex:1; min-width:120px;" data-tooltip="Brace yourself: attacks against you hurt less today. Moving cancels it.">🛡️ Defend</button>
            <button id="btnNothing" class="btn ghost" style="flex:1; min-width:120px;" data-tooltip="Wait and watch. Careless people get caught off guard.">Do Nothing</button>
            <button id="btnRest" class="btn teal hidden" style="flex:1; min-width:120px;" data-tooltip="Lie down and recover. A quiet night heals you; being found does not. Moving cancels it.">🛌 Rest</button>
            <button id="btnForage" class="btn hidden" style="flex:1; min-width:120px;" data-tooltip="Search for something to eat. Green and wet places are kinder. The land runs out if you keep searching.">🌿 Forage</button>
            <button id="btnHide" class="btn purple hidden" style="flex:1; min-width:120px;" data-tooltip="Lie low. You make no noise here, and the arena and its beasts may pass you by. Moving cancels it.">🫥 Hide</button>
            <button id="btnDrink" class="btn teal hidden" style="flex:1; min-width:120px;" data-tooltip="Restore 10 FP by drinking water">💧 Drink water</button>
            <button id="btnSetNet" class="btn purple hidden" style="flex:1; min-width:120px;" data-tooltip="Set a Net trap here (activates tomorrow)">🕸️ Set Net</button>
            <button id="btnSetMine" class="btn orange hidden" style="flex:1; min-width:120px;" data-tooltip="Set a Mine trap here (activates tomorrow)">🧨 Set Mine</button>
            <button id="btnAttack" class="btn red hidden" style="flex:1; min-width:120px;">⚔️ Attack</button>
            <button id="btnCollect" class="btn hidden" style="flex:1; min-width:120px;" data-tooltip="Pick up the selected item">🫳 Collect item</button>
            </div>
            <div class="muted small" style="margin-top:8px;">Moves left today: <span id="movesLeft"></span></div>
          </div>
        </div>

        <div id="exploreState" class="section hidden">
          <div class="banner">
            Done. You can move up to three areas, or settle here for the night.
          </div>
          <div class="actionBar" id="exploreActionBar">
          <div class="row">
            <button id="btnEndDay" class="btn green" style="width:100%; padding:12px 14px;">🌙 Settle for the night</button>
          </div>
          <div class="muted small" style="margin-top:8px;">Moves left today: <span id="movesLeft2"></span></div>
          </div>
        </div>

        <div id="trappedState" class="section hidden">
          <div class="banner danger">
            You are trapped in a Net. You cannot act or move for <span id="trapDays"></span> day(s).
          </div>
          <div class="muted" style="margin-top:10px;">You can only escape by cutting the net with a Dagger.</div>
          <div class="actionBar" id="trappedActionBar">
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <button id="btnCutNet" class="btn red hidden" style="flex:1; min-width:160px;" data-tooltip="Consume 1 Dagger to escape">Cut net (Dagger)</button>
            <button id="btnEndDayTrapped" class="btn green" style="flex:1; min-width:160px;">End Day</button>
          </div>
        </div>
        </div>
      </aside>

      </div>

  `;

  const dayEl = document.getElementById("day");
  const seedEl = document.getElementById("seed");
  const fallenEl = document.getElementById("fallenTributes");

  const curAreaEl = document.getElementById("curArea");

  const leftAlertEl = document.getElementById("leftAlert");
  const needsActionEl = document.getElementById("needsAction");
  const exploreStateEl = document.getElementById("exploreState");
  const trappedStateEl = document.getElementById("trappedState");
  const trapDaysEl = document.getElementById("trapDays");
  const movesLeftEl = document.getElementById("movesLeft");
  const movesLeftEl2 = document.getElementById("movesLeft2");
  const areaPillsEl = document.getElementById("areaPills");
  const groundItemWrap = document.getElementById("groundItemWrap");
  const groundItemPills = document.getElementById("groundItemPills");
  const btnDefend = document.getElementById("btnDefend");
  const btnNothing = document.getElementById("btnNothing");
  const btnDrink = document.getElementById("btnDrink");
  const btnSetNet = document.getElementById("btnSetNet");
  const btnSetMine = document.getElementById("btnSetMine");
  const btnAttack = document.getElementById("btnAttack");
  const btnCollect = document.getElementById("btnCollect");
  const btnEndDay = document.getElementById("btnEndDay");

  const btnCutNet = document.getElementById("btnCutNet");
  const btnEndDayTrapped = document.getElementById("btnEndDayTrapped");

  const debugList = document.getElementById("debugList");
  const debugAiToggle = document.getElementById("debugAiToggle");
  const debugAiMetrics = document.getElementById("debugAiMetrics");

  const youMetaEl = document.getElementById("youMeta");
  const youPoisonEl = document.getElementById("youPoison");
  const youHpTextEl = document.getElementById("youHpText");
  const youFpTextEl = document.getElementById("youFpText");
  const youHpBarEl = document.getElementById("youHpBar");
  const youFpBarEl = document.getElementById("youFpBar");
  const attackSlotEl = document.getElementById("attackSlot");
  const defenseSlotEl = document.getElementById("defenseSlot");
  const invCountEl = document.getElementById("invCount");
  const invPillsEl = document.getElementById("invPills");

  const areaInfoEl = document.getElementById("areaInfo");

  const toastHost = document.getElementById("toastHost");

  // Default toast TTL increased to 8s for readability.
  // Journal: a persistent, per-day record of what your tribute lived through.
  function logJournal(text, { kind = "info", day = null } = {}){
    if(!world || !text) return;
    world.journal = Array.isArray(world.journal) ? world.journal : [];
    const d = Number(day ?? world?.meta?.day ?? 0);
    const last = world.journal[world.journal.length - 1];
    if(last && last.day === d && last.text === text) return;
    world.journal.push({ day: d, kind, text: String(text) });
    if(world.journal.length > 600) world.journal.splice(0, world.journal.length - 600);
    if(journalOpen) renderJournal();
    else markJournalUnread();
  }

  const MAX_VISIBLE_TOASTS = 2; // the latest event, plus the previous one faded
  let journalOpen = false;
  function markJournalUnread(){ document.getElementById("journalDot")?.classList.remove("hidden"); }
  function renderJournal(){
    const body = document.getElementById("journalBody");
    if(!body) return;
    const entries = Array.isArray(world?.journal) ? world.journal : [];
    if(!entries.length){ body.innerHTML = `<div class="muted small">Nothing written yet.</div>`; return; }
    const byDay = new Map();
    for(const e of entries){ const d = Number(e.day || 0); if(!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(e); }
    const days = Array.from(byDay.keys()).sort((a,b) => b - a);
    body.innerHTML = days.map(d => `
      <section class="journalDay">
        <h4>Day ${escapeHtml(String(d))}</h4>
        ${byDay.get(d).map(e => `<p class="j ${escapeHtml(e.kind || "")}">${escapeHtml(e.text)}</p>`).join("")}
      </section>`).join("");
  }
  function setJournal(open){
    journalOpen = !!open;
    const drawer = document.getElementById("journalDrawer");
    const btn = document.getElementById("journalBtn");
    drawer?.classList.toggle("hidden", !journalOpen);
    btn?.setAttribute("aria-expanded", journalOpen ? "true" : "false");
    if(journalOpen){ document.getElementById("journalDot")?.classList.add("hidden"); renderJournal(); }
  }

  function pushToast(content, { kind="info", ttl=8000, meta=null, silent=false, action=null } = {}){
    if(!toastHost && !silent) return;
    const el = silent ? null : document.createElement("div");
    if(el) el.className = `toast ${kind}`;

    // Capture a plain-text representation for the toast log (UI-only).
    let toastText = "";
    if(Array.isArray(content)){
      const lines = content.map(line => String(line));
      toastText = lines.join("\n");
      if(el) el.innerHTML = lines.map(line => `<div class="toastLine">${escapeHtml(String(line))}</div>`).join("");
    } else {
      toastText = String(content ?? "");
      if(el) el.textContent = toastText;
    }

    // Keep an in-memory log of what was shown via toasts, for death/victory recaps.
    // This does not affect game rules, state sync, or rendering order.
    try {
      toastLog.push({
        t: Date.now(),
        day: Number(world?.meta?.day ?? 0),
        kind,
        text: toastText,
        meta: meta || null
      });
      // Avoid unbounded growth in long sessions.
      if(toastLog.length > 500) toastLog.splice(0, toastLog.length - 500);
    } catch(_e) {}

    if(!silent && toastText) logJournal(toastText.replace(/\n/g, " "), { kind });

    if(el && action && action.label && typeof action.onClick === "function"){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "toastAction";
      b.textContent = action.label;
      b.onclick = (ev) => { ev.stopPropagation(); action.onClick(); el.remove(); };
      el.appendChild(b);
    }

    if(el) toastHost.appendChild(el);
    // Keep the map readable: only the latest few messages stay on screen (all are in the journal).
    if(el){
      const all = Array.from(toastHost.children);
      for(const old of all.slice(0, Math.max(0, all.length - MAX_VISIBLE_TOASTS))) old.remove();
    }

    const remove = () => {
      if(!el) return;
      if(!el.parentNode) return;
      el.classList.add("out");
      setTimeout(() => { el.remove(); }, 200);
    };

    if(el) el.addEventListener("click", remove);
    // Events stay on the map until the next one replaces them (no timed disappearance).
  }

  // --- Minimal, surgical: extra toast feedback for player damage events ---
  // Uses the existing toast infrastructure (pushToast/toastHost). No game logic changes.
  function __evtStr(v){ return (v === null || v === undefined) ? "" : String(v); }

  function __evtFirstNonEmpty(...vals){
    for(const v of vals){
      const s = __evtStr(v).trim();
      if(s) return s;
    }
    return "";
  }

  function __evtNpcNameFromIdOrName(v){
    const s = __evtStr(v).trim();
    if(!s) return "";
    if(s === "player") return "You";
    const n = world?.entities?.npcs?.[s];
    return n?.name || s;
  }

  function __evtCreatureName(e){
    // Priority order requested (when applicable).
    return __evtFirstNonEmpty(
      e?.creatureName,
      e?.creature,
      e?.name,
      e?.sourceName,
      e?.threatName
    );
  }

  function __evtAttackerName(e){
    // Priority order requested (when applicable).
    const raw = __evtFirstNonEmpty(
      e?.attackerName,
      e?.whoName,
      e?.who,
      e?.byName,
      e?.by
    );
    return __evtNpcNameFromIdOrName(raw);
  }

  function __evtWeaponPart(e){
    const w = __evtFirstNonEmpty(e?.weaponName, e?.weapon, e?.itemName);
    return w ? ` with ${w}` : "";
  }

  function __evtAffectsPlayer(e){
    if(!e) return false;
    const who = e.who ?? null;
    const target = e.target ?? e.targetId ?? null;
    if(who === "player") return true;
    if(target === "player") return true;
    // Some event shapes use explicit flags.
    if(e.isPlayer === true) return true;
    if(e.targetIsPlayer === true) return true;
    return false;
  }

  // Events that carry an "amount" but are NOT damage (food, healing, costs…).
  const __EVT_NOT_DAMAGE = new Set(["EAT","HEAL","DRINK","FP_COST","BUFF","POISON_CURED","SPOILS_PICK","BACKPACK_ITEM","BACKPACK_OPEN","COLLECT","AUTO_EQUIP","USE_ITEM"]);

  function __evtPlayerDamageToastLine(e){
    if(!__evtAffectsPlayer(e)) return "";
    if(__EVT_NOT_DAMAGE.has(e?.type)) return "";

    // Only add lines for damage events that currently lack clear player-facing feedback.
    // (Other damage events already have messaging via formatEvents.)
    switch(e.type){
      case "THREAT": {
        const k = __evtFirstNonEmpty(e.kind, e.threatKind);
        if(k === "creature"){
          const creature = __evtCreatureName(e) || "A creature";
          return `${creature} attacked you.`;
        }
        if(k === "hazard") return "A biome hazard injured you.";
        const creature = __evtCreatureName(e);
        if(creature) return `${creature} attacked you.`;
        return "Something in the area injured you.";
      }
      case "ATTACK": {
        // NPC attacking player.
        const target = e.target ?? e.targetId ?? null;
        if(target !== "player") return "";
        if(e.ok === false) return "";
        const attacker = __evtAttackerName(e) || "An enemy";
        return `${attacker} attacked you${__evtWeaponPart(e)}.`;
      }
      case "SPLASH_DAMAGE": {
        const src = __evtAttackerName(e) || __evtFirstNonEmpty(e?.sourceName, e?.source);
        const srcName = __evtNpcNameFromIdOrName(src);
        if(srcName) return `You were caught in ${srcName}'s blast.`;
        return "You were caught in a blast.";
      }
      case "MINE_HIT": {
        return "You triggered a hidden trap.";
      }
      case "HOSTILE_EVENT": {
        return "Hostile activity injured you.";
      }
      case "LASER": {
        return "A targeting beam hit you.";
      }
      case "HAZARD_TICK": {
        const t = String(e?.hazardType || "").trim();
        if(t === "heat") return "The heat injured you.";
        if(t === "cold") return "Extreme cold injured you.";
        if(t === "toxic") return "Toxic fumes injured you.";
        if(t === "unstable_ground") return "Unstable ground injured you.";
        if(t === "flooded") return "Rising water injured you.";
        return "A hazard injured you.";
      }
      case "POISON_TICK": {
        // Already covered in formatEvents, but keep the requested short feedback without duplicating.
        return "";
      }
      case "SELF_DAMAGE": {
        // Already covered in formatEvents.
        return "";
      }
      case "CREATURE_ATTACK": {
        // Already covered in formatEvents.
        return "";
      }
      case "MONSTER_AOE": {
        if(e.who === "player"){
          const icon = e.monsterIcon ? `${e.monsterIcon} ` : "";
          const verb = e.verb || "mauls";
          return `${icon}${e.monsterName || "A monster"} ${verb} you for ${e.dmg} HP.`;
        }
        return "";
      }
      case "DAMAGE_RECEIVED": {
        // Already covered in formatEvents.
        return "";
      }
      case "DISPUTE_DAMAGE": {
        // Covered in formatEvents (with item name and opponent).
        return "";
      }
      default: {
        // Fallback for other damage-like events we can detect.
        const dmg = (e.dmg ?? e.damage ?? e.amount ?? null);
        if(dmg !== null && dmg !== undefined && Number(dmg) > 0) return "You were injured.";
        return "";
      }
    }
  }

  function __evtDamageAmount(e){
    const v = (e?.dmg ?? e?.damage ?? e?.amount ?? e?.dmgDealt ?? null);
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function __evtPlayerDamageContextLine(e){
    if(!__evtAffectsPlayer(e)) return "";
    if(__EVT_NOT_DAMAGE.has(e?.type)) return "";
    const dmg = __evtDamageAmount(e);
    const dmgPart = (dmg !== null && dmg > 0) ? ` (${dmg} damage)` : "";

    switch(e?.type){
      case "ATTACK": {
        const target = e.target ?? e.targetId ?? null;
        if(target !== "player") return "";
        const attacker = __evtAttackerName(e) || __evtNpcNameFromIdOrName(e?.who) || "An enemy";
        return `${attacker} attacked you${__evtWeaponPart(e)}${dmgPart}.`;
      }
      case "DAMAGE_RECEIVED": {
        const from = (e?.from === "environment") ? "the environment" : (__evtNpcNameFromIdOrName(e?.from) || "an attacker");
        return `You took damage from ${from}${dmgPart}.`;
      }
      case "THREAT": {
        const k = __evtFirstNonEmpty(e.kind, e.threatKind);
        if(k === "creature"){
          const creature = __evtCreatureName(e) || "a creature";
          return `You were attacked by ${creature}${dmgPart}.`;
        }
        if(k === "hazard") return `A biome hazard injured you${dmgPart}.`;
        const creature = __evtCreatureName(e);
        if(creature) return `You were hurt by ${creature}${dmgPart}.`;
        return `Something in the area injured you${dmgPart}.`;
      }
      case "CREATURE_ATTACK": {
        const creature = __evtCreatureName(e) || e?.creature || "a creature";
        return `You were attacked by ${creature}${dmgPart}.`;
      }
      case "MINE_HIT": return `You triggered a hidden trap${dmgPart}.`;
      case "SPLASH_DAMAGE": {
        const src = __evtNpcNameFromIdOrName(e?.by) || __evtAttackerName(e);
        if(src) return `You were caught in ${src}'s blast${dmgPart}.`;
        return `You were caught in a blast${dmgPart}.`;
      }
      case "HOSTILE_EVENT": return `Hostile activity injured you${dmgPart}.`;
      case "LASER": return `A targeting beam hit you${dmgPart}.`;
      case "MONSTER_AOE": {
        const icon = e.monsterIcon ? `${e.monsterIcon} ` : "";
        const verb = e.verb || "hits";
        return `${icon}${e.monsterName || "A monster"} ${verb} you${dmgPart}.`;
      }
      case "SELF_DAMAGE": return `You hurt yourself${dmgPart}.`;
      case "DISPUTE_DAMAGE": {
        const nm = getItemDef(e.itemDefId)?.name || "an item";
        return `You were hurt fighting over ${nm}${dmgPart}.`;
      }
      case "POISON_TICK": return `Poison harms you${dmgPart}.`;
      default: {
        if(dmg !== null && dmg > 0) return `You were injured${dmgPart}.`;
        return "";
      }
    }
  }


  function toastEvents(events, { limit=6 } = {}){
    // Extra: ensure player damage always yields a visible toast (10s) when applicable.
    // This is additive and does not alter the existing event formatting/flow.
    for(const e of (events || [])){
      // Record a narrative damage entry (cause of death / broadcast recap).
      const ctx = (__evtAffectsPlayer(e) && !__EVT_NOT_DAMAGE.has(e?.type) && Number(__evtDamageAmount(e) || 0) > 0)
        ? (formatEvents([e])[0] || "") : "";
      if(ctx){
        const dmg = __evtDamageAmount(e);
        pushToast(ctx, { kind:"event", ttl: 0, silent: true, meta: { damageToPlayer: true, eventType: e?.type || "", dmg } });

        // UI-only narrative memory: mark this area as previously injurious.
        try { recordPlayerInjury({ areaId: e?.areaId ?? world?.entities?.player?.areaId, causeText: ctx }); } catch(_e) {}
      }

      // UI-only narrative memory: remember where tributes fell.
      if(e?.type === "DEATH"){
        try { recordAreaDeath({ areaId: e?.areaId, whoId: e?.who }); } catch(_e) {}
      }
    }
    const lines = formatEvents(events).filter(Boolean);
    if(!lines.length){
      // Text-only pacing: when nothing notable happens, let the silence speak (but don't spam).
      try {
        const ui = ensureUiNarrative();
        const day = Number(world?.meta?.day ?? 0);
        const areaId = Number(world?.entities?.player?.areaId ?? 1);
        const last = ui?.lastQuietToastAt || { day:0, areaId:0, n:0 };
        const sameSpot = (last.day === day) && (last.areaId === areaId);
        const n = sameSpot ? (Number(last.n || 0) + 1) : 1;
        // Show at most 1 quiet line per area per day.
        if(!sameSpot){
          const quietLines = [
            "Nothing happens. The silence stretches on.",
            "Time passes. Too quietly.",
            "You wait. Nothing comes.",
            "Only wind and distant stillness."
          ];
          const t = pickDeterministic(quietLines, `quiet:${day}:${areaId}`);
          if(t) pushToast(t, { kind:"info", ttl: 8000 });
          if(ui) ui.lastQuietToastAt = { day, areaId, n };
        }
      } catch(_e) {}
      return;
    }
    const chunks = [];
    for(let i=0;i<lines.length;i+=limit) chunks.push(lines.slice(i, i+limit));
    for(const c of chunks) pushToast(c, { kind:"event" });
  }

  const canvas = document.getElementById("c");
  // Avoid browser zooming on double-tap over the canvas.
  canvas.addEventListener("dblclick", (e) => e.preventDefault());
  const mapUI = new MapUI({
    canvas,
    getCurrentAreaId: () => world?.entities?.player?.areaId ?? 1,
    canMove: () => uiState.phase === "explore",
    options: {
      followPlayer: true, zoom: (() => { try { const z = Number(localStorage.getItem("arena.zoom")); return (z >= 1 && z <= 5) ? z : 2.6; } catch(_e){ return 2.6; } })(),
      minZoom: 1, maxZoom: 5, wheelZoom: true,
      padding: 18, draggable: true, smooth: true, smoothness: 0.22,
      alwaysCenter: true, texturesOnVisited: true, visitedTextureAlpha: 0.3, activeTextureAlpha: 0.6, unknownTextureAlpha: 0.1,
      onZoomChange: (z, follow) => {
        try { localStorage.setItem("arena.zoom", String(z)); } catch(_e) {}
        const fitBtn = document.getElementById("zoomFit");
        if(fitBtn){ fitBtn.textContent = follow ? "Whole map" : "Follow me"; fitBtn.setAttribute("aria-pressed", follow ? "false" : "true"); }
        try { miniMapUI?.render(); } catch(_e) {}
      }
    },
    onAreaClick: (id) => {
      uiState.focusedAreaId = id;
      handleAreaClick(id);
      sync();
    }
  });

  const miniCanvas = document.getElementById("mini");
  const miniMapUI = new MapUI({
    canvas: miniCanvas,
    getCurrentAreaId: () => world?.entities?.player?.areaId ?? 1,
    canMove: () => uiState.phase === "explore",
    options: { followPlayer: false, showViewport: true, getViewportRect: () => (mapUI.options.followPlayer ? mapUI.getViewRectGeom() : null) },
    onAreaClick: (id) => {
      uiState.focusedAreaId = id;
      handleAreaClick(id);
      sync();
    }
  });

  // Zoom controls + responsive canvas sizing.
  document.getElementById("zoomIn").onclick = () => { if(!mapUI.options.followPlayer) mapUI.setFollow(true); mapUI.setZoom(mapUI.getZoom() * 1.25); };
  document.getElementById("zoomOut").onclick = () => { if(!mapUI.options.followPlayer) return; mapUI.setZoom(mapUI.getZoom() / 1.25); };
  document.getElementById("zoomFit").onclick = () => mapUI.setFollow(!mapUI.options.followPlayer);
  document.getElementById("journalBtn").onclick = () => setJournal(!journalOpen);
  document.getElementById("recenterBtn").onclick = () => { mapUI._pan.x = 0; mapUI._pan.y = 0; if(!mapUI.options.followPlayer) mapUI.setFollow(true); else mapUI.render(); };
  document.getElementById("journalClose").onclick = () => setJournal(false);
  if(!window.__arenaEscBound){
    window.__arenaEscBound = true;
    window.addEventListener("keydown", (ev) => {
      if(ev.key !== "Escape") return;
      document.getElementById("journalClose")?.click();
      const n = document.getElementById("nightCard");
      if(n && !n.classList.contains("hidden")) n.classList.add("hidden");
    });
  }
  try {
    if(window.__arenaResizeObserver) window.__arenaResizeObserver.disconnect();
    const ro = new ResizeObserver(() => mapUI.resizeToElement());
    ro.observe(canvas);
    window.__arenaResizeObserver = ro;
  } catch(_e) {}
  mapUI.resizeToElement();
  // Stage mode on narrow screens: keep your area above the action card.
  const applyStageOffset = () => {
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    mapUI.options.centerOffsetY = narrow ? -0.2 : 0;
    document.querySelector(".youDot")?.style.setProperty("top", narrow ? "30%" : "50%");
    mapUI._pan.x = 0; mapUI._pan.y = 0;
    mapUI.resizeToElement();
    mapUI.render();
  };
  applyStageOffset();
  // The first layout pass can settle after the first frame: re-centre once it has.
  requestAnimationFrame(() => setTimeout(applyStageOffset, 120));
  try { window.matchMedia("(max-width: 900px)").addEventListener("change", applyStageOffset); } catch(_e) {}

  function emitAreaArrivalNarrative(areaId, incomingEvents = []){
    // UI-only, text-only: make places feel remembered.
    try {
      const ui = ensureUiNarrative();
      if(!ui) return;
      const day = Number(world?.meta?.day ?? 0);
      const key = `${day}:${areaId}`;
      if(ui.lastAreaNarrativeAt?.[key]) return;

      const mem = getAreaNarrative(areaId);
      const lines = [];

      // "You were injured here earlier." (only if it happened on a previous day)
      if(mem && Number(mem.lastPlayerInjuryDay || 0) > 0 && Number(mem.lastPlayerInjuryDay || 0) < day){
        const injuryLines = [
          "You were injured here earlier.",
          "You remember being hurt in this place.",
          "This area has cost you blood before."
        ];
        lines.push(pickDeterministic(injuryLines, `injury:${mem.lastPlayerInjuryDay}:${areaId}`));
      }

      // "This is where X died." (last known death, if any)
      if(mem && Array.isArray(mem.deaths) && mem.deaths.length){
        const last = mem.deaths[mem.deaths.length - 1];
        const nm = String(last?.name || "").trim();
        if(nm){
          const deathLines = [
            `This is where ${nm} died.`,
            `${nm} fell here.`,
            `A tribute named ${nm} was killed in this area.`
          ];
          lines.push(pickDeterministic(deathLines, `death:${last?.day || 0}:${areaId}:${nm}`));
        }
      }

      // Foreshadowing: hint at danger without explaining mechanics.
      const aliveHere = Object.values(world?.entities?.npcs || {}).filter(n => (n?.hp ?? 0) > 0 && n?.areaId === areaId);
      const hazardsIncoming = (incomingEvents || []).some(e => e && (e.type === "MINE_HIT" || e.type === "THREAT" || e.type === "HOSTILE_EVENT" || e.type === "LASER" || e.type === "CREATURE_ATTACK" || e.type === "TRAPPED"));
      if(hazardsIncoming){
        const omenLines = [
          "The air here feels wrong.",
          "Something about this place makes you tense.",
          "You feel exposed the moment you step in."
        ];
        lines.push(pickDeterministic(omenLines, `omen:${day}:${areaId}`));
      } else if(aliveHere.length){
        const presenceLines = [
          "You feel like you're not alone.",
          "Faint movement echoes nearby.",
          "You sense eyes on you."
        ];
        lines.push(pickDeterministic(presenceLines, `presence:${day}:${areaId}:${aliveHere.length}`));
      }

      // Keep it concise: at most 2 lines so it doesn't drown actual events.
      const out = lines.map(s => String(s || "").trim()).filter(Boolean).slice(0, 2);
      if(out.length){
        for(const t of out) pushToast(t, { kind:"info", ttl: 9000 });
        ui.lastAreaNarrativeAt[key] = true;
      }
    } catch(_e) {}
  }

  function handleAreaClick(id){
    if(!world) return;

    // Always allow inspecting focus. Movement only in explore.
    if(uiState.phase !== "explore"){
      showLeftAlert("You must commit an action before moving.");
      return;
    }

    const cur = world.entities.player.areaId;
    if(id === cur) return;

    if(uiState.movesUsed >= MAX_MOVES_PER_DAY){
      showLeftAlert("You already moved 3 times today.");
      return;
    }

    const wasLyingLow = !!(world.entities.player._today?.hidden || world.entities.player._today?.resting);
    const res = moveActorOneStep(world, "player", id);
    if(res.ok && wasLyingLow) pushToast("You leave your shelter behind.", { kind:"info", ttl: 5000 });
    if(!res.ok){
      showLeftAlert("You can't move there.");
      return;
    }

    uiState.movesUsed += 1;
    uiState.dayEvents.push(...res.events);
    try {
      const dest = world.map.areasById[String(id)];
      const name = Number(id) === 1 ? "the Cornucopia" : `the ${String(dest?.biome || "unknown").toLowerCase()}`;
      const others = Object.values(world.entities.npcs || {}).filter(n => (n.hp ?? 0) > 0 && n.areaId === Number(id)).length;
      logJournal(`You move into ${name} (Area ${id}). ${others === 0 ? "No one is here." : others === 1 ? "Someone is here." : `${others} tributes are here.`}`, { kind: "move" });
    } catch(_e) {}

    // UI-only: area arrival narrative (scars, deaths, and light foreshadowing).
    emitAreaArrivalNarrative(id, res.events || []);

    // If something immediate happened on entering (e.g., creature attack, mine, hazard), show it now.
    const immediate = (res.events || []).some(e => (e.who === "player") && (e.type === "CREATURE_ATTACK" || e.type === "POISON_APPLIED" || e.type === "MINE_HIT" || e.type === "TRAPPED" || e.type === "THREAT" || e.type === "HOSTILE_EVENT" || e.type === "LASER" || e.type === "DEATH"));
    if(immediate){
      openResultDialog(res.events || []);
    }

    // Auto end the day once the 3rd move is taken.
    // This feels more natural than requiring an extra click.
    if(uiState.movesUsed >= MAX_MOVES_PER_DAY){
      // If the move killed the player (e.g., creature on enter), do not auto-end.
      if((world.entities.player.hp ?? 0) > 0){
        performEndDay();
        return;
      }
    }

    // reveal the destination immediately (spec: unlocking/revealing on click)
    saveToLocal(world);
    sync();
  }

  function resetDayState(){
    uiState.phase = "needs_action";
    uiState.movesUsed = 0;
    uiState.dayEvents = [];
    uiState.selectedTarget = null;
    uiState.selectedGroundIndex = null;
    uiState.selectionMode = null;
  }

  function showLeftAlert(msg){
    uiState.leftAlert = msg;
    if(leftAlertEl){
      leftAlertEl.textContent = msg;
      leftAlertEl.classList.remove("hidden");
    }
    setTimeout(() => {
      // Only hide if it's still the same message
      if(uiState.leftAlert === msg && leftAlertEl){
        leftAlertEl.classList.add("hidden");
      }
    }, 2800);
  }

  function renderAreaPills(){
    if(!areaPillsEl) return;

    const p = world.entities.player;

    // If trapped by a Net, force trapped UI state.
    if((p.trappedDays ?? 0) > 0 && (p.hp ?? 0) > 0){
      uiState.phase = "trapped";
    }
    const here = p.areaId;
    const npcsHere = Object.values(world.entities.npcs || {}).filter(n => (n.hp ?? 0) > 0 && n.areaId === here);
    const monstersHere = Object.values(world.entities.monsters || {}).filter(m => (m.hp ?? 0) > 0 && m.alive !== false && m.areaId === here);
    const items = [
      { id:"player", name:"You", district:p.district, selectable:false, entity:p },
      ...npcsHere.map(n => ({ id:n.id, name:n.name, district:n.district, selectable:true, entity:n }))
      ,...monstersHere.map(m => ({ id:m.id, name:`${m.icon ? m.icon + ' ' : ''}${m.name}`, district:null, selectable:true, entity:m, isMonster:true }))
    ];

    // Long crowds (the Cornucopia) collapse to keep actions in view.
    const CROWD_PREVIEW = 6;
    const crowded = items.length > CROWD_PREVIEW + 2 && !uiState.showFullCrowd;
    const shown = crowded ? items.filter((t, i) => i < CROWD_PREVIEW || t.id === uiState.selectedTarget) : items;
    areaPillsEl.innerHTML = (items.length ? shown.map(t => {
      const selected = uiState.selectedTarget === t.id;
      const cls = `playerPill ${t.selectable ? "selectable" : ""} ${selected ? "selected" : ""}`;
      const tip = t.entity ? statusTooltipFor(t.entity, world?.meta) : "";
      const tipAttr = tip ? ` data-tooltip="${escapeHtml(tip)}"` : "";
      return `<button class="${cls}" data-id="${escapeHtml(t.id)}" ${t.selectable ? "" : "disabled"}${tipAttr}>
        <span class="pillName">${escapeHtml(t.name)}</span>
        <span class="pillSub">${escapeHtml(t.isMonster ? (visibleState(t.entity, { isMonster:true }) || "enraged") : (t.id === "player" ? districtTag(t.district) : [districtTag(t.district), visibleState(t.entity)].filter(Boolean).join(" · ")))}</span>
      </button>`;
    }).join("") : `<div class="muted small">No one here</div>`)
      + (crowded ? `<button type="button" class="playerPill morePill" id="crowdMore">+${items.length - shown.length} more</button>` : "")
      + (!crowded && uiState.showFullCrowd && items.length > CROWD_PREVIEW + 2 ? `<button type="button" class="playerPill morePill" id="crowdLess">Show fewer</button>` : "");
    document.getElementById("crowdMore")?.addEventListener("click", () => { uiState.showFullCrowd = true; renderAreaPills(); });
    document.getElementById("crowdLess")?.addEventListener("click", () => { uiState.showFullCrowd = false; renderAreaPills(); });

    // wire
    areaPillsEl.querySelectorAll(".playerPill.selectable").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        uiState.selectedTarget = id;
        uiState.selectionMode = "target";
        uiState.selectedGroundIndex = null;
        btnAttack.classList.remove("hidden");
        // refresh selected style
        renderAreaPills();
        renderGroundItem();
      };
    });

    // Attack is always visible when someone is here; it unlocks once you pick a target.
    const hasTargets = items.some(t => t.selectable);
    const hasTarget = uiState.selectionMode === "target" && uiState.selectedTarget && uiState.selectedTarget !== "player";
    btnAttack.classList.toggle("hidden", !hasTargets);
    btnAttack.disabled = !hasTarget || uiState.phase !== "needs_action";
    const tName = hasTarget ? items.find(t => t.id === uiState.selectedTarget)?.name : null;
    btnAttack.textContent = tName ? `⚔️ Attack ${tName}` : "⚔️ Attack";
    btnAttack.setAttribute("data-tooltip", hasTarget ? "Strike the tribute you picked." : "Pick someone above first.");
  }

  function renderGroundItem(){
    const p = world.entities.player;
    const a = world.map.areasById[String(p.areaId)];
    const ground = Array.isArray(a?.groundItems) ? a.groundItems : [];
    if(!groundItemWrap || !groundItemPills) return;

    if(ground.length === 0){
      groundItemWrap.classList.add("hidden");
      btnCollect.classList.add("hidden");
      uiState.selectedGroundIndex = null;
      if(uiState.selectionMode === "item") uiState.selectionMode = null;
      return;
    }

    groundItemWrap.classList.remove("hidden");

    // If selection is out of range, clear it (do NOT auto-select).
    if(uiState.selectedGroundIndex != null && (uiState.selectedGroundIndex < 0 || uiState.selectedGroundIndex >= ground.length)){
      uiState.selectedGroundIndex = null;
      if(uiState.selectionMode === "item") uiState.selectionMode = null;
    }

    // Only what is within reach: in a crowded pile (the Cornucopia) you can't see everything.
    // Perception lets you spot more of it. Identical items are grouped.
    const P = Number(p.attrs?.P ?? 0);
    const reach = 3 + Math.ceil(P / 2);
    const seen = new Map();
    const indexed = ground.map((it, idx) => {
      const k = `${it.defId}|${it.qty || 1}`;
      const occ = (seen.get(k) || 0) + 1; seen.set(k, occ);
      return { it, idx, key: k, order: hash32(`${world.meta.seed}:${world.meta.day}:${a?.id}:${k}:${occ}`) };
    });
    const visible = indexed.length > reach ? [...indexed].sort((x, y) => x.order - y.order).slice(0, reach) : indexed;
    const hiddenCount = indexed.length - visible.length;
    const groups = new Map();
    for(const v of visible.sort((x, y) => x.idx - y.idx)){
      if(!groups.has(v.key)) groups.set(v.key, { first: v.idx, count: 0, it: v.it, idxs: [] });
      const g = groups.get(v.key); g.count += 1; g.idxs.push(v.idx);
    }
    groundItemPills.innerHTML = Array.from(groups.values()).map(g => {
      const it = g.it;
      const def = getItemDef(it.defId);
      const name = def ? def.name : it.defId;
      const icon = getItemIcon(it.defId);
      const qty = it.qty || 1;
      const stack = qty > 1 ? ` x${escapeHtml(String(qty))}` : "";
      const many = g.count > 1 ? `<span class="pillCount">×${g.count}</span>` : "";
      const tip = def ? buildItemTooltip(def, it, qty) : "";
      const sel = g.idxs.includes(uiState.selectedGroundIndex) ? "selected" : "";
      return `<button class="itemPill ground ${sel}" data-gidx="${g.first}" data-tooltip="${escapeHtml(tip)}">
        <span class="pillIcon" aria-hidden="true">${escapeHtml(icon)}</span>
        <span class="pillName">${escapeHtml(name)}${stack}</span>${many}
      </button>`;
    }).join("") + (hiddenCount > 0 ? `<div class="muted small groundMore">More supplies lie scattered further off. You can't reach them all.</div>` : "");

    groundItemPills.querySelectorAll(".itemPill.ground").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-gidx"));
        uiState.selectedGroundIndex = idx;
        uiState.selectionMode = "item";
        uiState.selectedTarget = null;
        renderAreaPills();
        renderGroundItem();
      };
    });

    // Collect is always visible when something is within reach; it unlocks once you pick an item.
    const picked = uiState.selectionMode === "item" && uiState.selectedGroundIndex != null;
    btnCollect.classList.remove("hidden");
    const full = inventoryCount(p.inventory) >= INVENTORY_LIMIT;
    btnCollect.disabled = !picked || full || uiState.phase !== "needs_action";
    const pickedDef = picked ? getItemDef(ground[uiState.selectedGroundIndex]?.defId) : null;
    btnCollect.textContent = pickedDef ? `🫳 Take ${pickedDef.name}` : "🫳 Take";
    btnCollect.setAttribute("data-tooltip", full ? "Your hands are full. Drop something first." : (picked ? "Grab it — someone else may be reaching for it too." : "Pick an item above first."));
  }

  function renderInventory(){
    const p = world.entities.player;
    // Header meta: district + attributes + poison
    const a = p.attrs || { F:0, D:0, P:0 };
    if(youMetaEl){
      const k = Number(p.kills || 0);
      youMetaEl.textContent = `D${p.district} • S${a.F} D${a.D} P${a.P} • K${k}`;
    }
    const poisoned = (p.status || []).some(s => s?.type === "poison");
    if(youPoisonEl){
      if(poisoned) youPoisonEl.classList.remove("hidden");
      else youPoisonEl.classList.add("hidden");
    }

    const hp = clamp(Number(p.hp ?? 100), 0, 100);
    const fp = clamp(Number(p.fp ?? 100), 0, 100);
    if(youHpTextEl) youHpTextEl.textContent = bodyHPWord(hp);
    if(youFpTextEl) youFpTextEl.textContent = bodyFPWord(fp);

    const hpPct = hp / 100;
    const fpPct = fp / 100;
    function barClass(pct){
      if(pct >= 0.5) return "good";
      if(pct >= 0.25) return "warn";
      return "bad";
    }
    if(youHpBarEl){
      youHpBarEl.style.width = `${Math.round(hpPct*100)}%`;
      youHpBarEl.classList.remove("good","warn","bad");
      youHpBarEl.classList.add(barClass(hpPct));
    }
    if(youFpBarEl){
      youFpBarEl.style.width = `${Math.round(fpPct*100)}%`;
      youFpBarEl.classList.remove("good","warn","bad");
      youFpBarEl.classList.add(barClass(fpPct));
    }
    invCountEl.textContent = String(inventoryCount(p.inventory));

    const items = p.inventory?.items || [];
    const weaponEq = p.inventory?.equipped?.weaponDefId;
    const defEq = p.inventory?.equipped?.defenseDefId;

    // Equipped slots (render as pills, even when empty)
    function renderEquipSlot(el, defId, kind){
      if(!el) return;
      if(!defId){
        const label = (kind === "weapon") ? "Attack Slot" : "Defense Slot";
        el.innerHTML = `<button class="itemPill emptySlot slotEquip" disabled aria-disabled="true" data-kind="${escapeHtml(kind)}" data-tooltip="Empty ${escapeHtml(label)}">
          <span class="pillIcon" aria-hidden="true">＋</span>
          <span class="pillName">${escapeHtml(label)}</span>
        </button>`;
        return;
      }

      const def = getItemDef(defId);
      const icon = getItemIcon(defId);
      const name = def?.name || defId;
      const tip = def ? def.description : "";
      // Click equipped slot to unequip.
      el.innerHTML = `<button class="itemPill slotEquip" data-kind="${escapeHtml(kind)}" data-tooltip="${escapeHtml(tip || "Click to unequip")}">
        <span class="pillIcon" aria-hidden="true">${escapeHtml(icon)}</span>
        <span class="pillName">${escapeHtml(name)}</span>
        <span class="pillSub">(equipped)</span>
      </button>`;
    }
    renderEquipSlot(attackSlotEl, weaponEq, "weapon");
    renderEquipSlot(defenseSlotEl, defEq, "defense");

    // Slot interactions (unequip)
    attackSlotEl?.querySelectorAll(".slotEquip:not(.emptySlot)").forEach(btn => {
      btn.onclick = () => {
        if(p.inventory?.equipped) p.inventory.equipped.weaponDefId = null;
        saveToLocal(world);
        renderInventory();
        pushToast("Attack slot cleared.");
      };
    });
    defenseSlotEl?.querySelectorAll(".slotEquip:not(.emptySlot)").forEach(btn => {
      btn.onclick = () => {
        if(p.inventory?.equipped) p.inventory.equipped.defenseDefId = null;
        saveToLocal(world);
        renderInventory();
        pushToast("Defense slot cleared.");
      };
    });

    // Render fixed inventory slots (video-game style): always show INVENTORY_LIMIT pills.
    // Filled pills map 1:1 to items[] indices; remaining slots are empty placeholders.
    const slots = Array.from({ length: INVENTORY_LIMIT }, (_, slotIdx) => {
      const it = items[slotIdx];
      if(!it){
        return `<button class="itemPill emptySlot" disabled aria-disabled="true" data-tooltip="Empty slot">
          <span class="pillIcon" aria-hidden="true">＋</span>
          <span class="pillName">Empty</span>
        </button>`;
      }

      const def = getItemDef(it.defId);
      const name = def ? def.name : it.defId;
      const qty = it.qty || 1;
      const eq = (weaponEq && it.defId === weaponEq) ? "equipped" : "";
      const de = (defEq && it.defId === defEq) ? "defEquipped" : "";
      const badge = "";
      const stack = qty > 1 ? ` x${escapeHtml(String(qty))}` : "";
      const tooltip = buildItemTooltip(def, it, qty);
      return `<button class="itemPill ${eq} ${de}" data-idx="${slotIdx}" data-tooltip="${escapeHtml(tooltip)}">
        <span class="pillIcon" aria-hidden="true">${escapeHtml(getItemIcon(it.defId))}</span>
        <span class="pillName">${escapeHtml(name)}${stack}</span>
        ${badge}
        <span class="pillRemove" data-remove-idx="${slotIdx}" title="Discard">×</span>
      </button>`;
    });

    invPillsEl.innerHTML = slots.join("");

    // interactions
    // Remove buttons
    invPillsEl.querySelectorAll(".pillRemove").forEach(x => {
      x.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = Number(x.getAttribute("data-remove-idx"));
        const it = items[idx];
        const def = it ? getItemDef(it.defId) : null;
        const name = def?.name || it?.defId || "item";
        const p = world.entities.player;
        if(p?.inventory?.items?.[idx]){
          const removed = p.inventory.items.splice(idx, 1)[0];
          const wasWeapon = p.inventory?.equipped?.weaponDefId === removed?.defId;
          const wasDefense = p.inventory?.equipped?.defenseDefId === removed?.defId;
          if(p.inventory?.equipped?.weaponDefId && !p.inventory.items.some(it2 => it2.defId === p.inventory.equipped.weaponDefId)) p.inventory.equipped.weaponDefId = null;
          if(p.inventory?.equipped?.defenseDefId && !p.inventory.items.some(it2 => it2.defId === p.inventory.equipped.defenseDefId)) p.inventory.equipped.defenseDefId = null;
          saveToLocal(world);
          renderInventory();
          const dayAtDrop = world.meta.day;
          pushToast(`You drop the ${name.toLowerCase()}.`, { kind:"info", ttl: 7000, action: { label: "Undo", onClick: () => {
            const pp = world?.entities?.player;
            if(!pp || world.meta.day !== dayAtDrop || inventoryCount(pp.inventory) >= INVENTORY_LIMIT) return;
            pp.inventory.items.splice(Math.min(idx, pp.inventory.items.length), 0, removed);
            if(wasWeapon) pp.inventory.equipped.weaponDefId = removed.defId;
            if(wasDefense) pp.inventory.equipped.defenseDefId = removed.defId;
            saveToLocal(world);
            renderInventory();
          } } });
        }
      };
    });

    // Only interactive pills (ignore empty placeholders)
    invPillsEl.querySelectorAll(".itemPill:not(.emptySlot)").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-idx"));
        const it = items[idx];
        const def = getItemDef(it.defId);
        if(!def) return;

        if(def.type === ItemTypes.WEAPON){
          p.inventory.equipped.weaponDefId = def.id;
          saveToLocal(world);
          renderInventory();
          return;
        }
        if(def.type === ItemTypes.PROTECTION){
          p.inventory.equipped.defenseDefId = def.id;
          saveToLocal(world);
          renderInventory();
          return;
        }
        if(def.type === ItemTypes.CONSUMABLE){
          // Two-step: first click arms it ("Use?"), second click within a few seconds uses it.
          if(!btn.classList.contains("armed")){
            invPillsEl.querySelectorAll(".itemPill.armed").forEach(x => { x.classList.remove("armed"); const n = x.querySelector(".pillName"); if(n?.dataset.label) n.textContent = n.dataset.label; });
            btn.classList.add("armed");
            const nm = btn.querySelector(".pillName");
            if(nm){ nm.dataset.label = nm.textContent; nm.textContent = `Use ${def.name}?`; }
            setTimeout(() => { if(btn.isConnected && btn.classList.contains("armed")){ btn.classList.remove("armed"); if(nm?.dataset.label) nm.textContent = nm.dataset.label; } }, 3500);
            return;
          }
          const res = useInventoryItem(world, "player", idx, "player");
          world = res.nextWorld;
          uiState.dayEvents.push(...(res.events || []));
          saveToLocal(world);
          renderInventory();
          toastEvents(res.events || []);
          return;
        }
      };
    });
  }

  function buildItemTooltip(def, it, qty){
    return itemTooltip(def, it);
  }


  // ======================= STAGE UI (map-centred) =======================
  const stageState = { more: false };
  function stageVisible(el){ return !!el && !el.classList.contains("hidden") && !el.disabled; }
  function firstName(n){ return String(n || "").split(" ")[0]; }

  function stageSituation(){
    const p = world.entities.player;
    const here = Object.values(world.entities.npcs || {}).filter(n => (n.hp ?? 0) > 0 && n.areaId === p.areaId);
    const monsterHere = Object.values(world.entities.monsters || {}).some(m => (m.hp ?? 0) > 0 && m.alive !== false && m.areaId === p.areaId);
    const sensed = senseLines(world);
    const danger = sensed.filter(x => x.kind === "monster" || x.kind === "danger");
    const area = world.map.areasById[String(p.areaId)];
    const bits = [];
    if(here.length === 0) bits.push("You are alone.");
    else if(here.length === 1) bits.push(`${here[0].name} is here.`);
    else bits.push(`${here.length} tributes are here.`);
    const limping = here.find(n => (n.hp ?? 100) <= 40);
    if(limping) bits.push(`${firstName(limping.name)} is limping.`);
    const needs = [];
    if((p.fp ?? 100) <= 39) needs.push("You're hungry");
    if((p.hp ?? 100) <= 69) needs.push(needs.length ? "hurt" : "You're hurt");
    if(needs.length){
      const help = area?.hasWater ? " There's water here." : (area?.hasFood ? " There's food here." : "");
      bits.push(needs.join(" and ") + "." + help);
    }
    const warn = [];
    if(monsterHere) warn.push("The beast is here.");
    for(const d of danger.slice(0, 1)) warn.push(d.text);
    return { text: bits.join(" "), warn: warn.join(" ") };
  }

  function stageOptions(){
    const p = world.entities.player, out = [];
    const sensed = senseLines(world);
    const dangerNear = sensed.some(x => x.kind === "monster" || x.kind === "danger");
    const area = world.map.areasById[String(p.areaId)];
    const hp = Number(p.hp ?? 100), fp = Number(p.fp ?? 100);
    const armed = !!p.inventory?.equipped?.weaponDefId;

    if(uiState.phase === "trapped"){
      if(stageVisible(btnCutNet)) out.push({ ic:"✂️", t:"Cut the net", why:"uses a dagger", score:5, run:() => btnCutNet.click() });
      out.push({ ic:"⏳", t:"Wait it out", why:"the net holds you today", score:1, run:() => btnEndDayTrapped.click() });
      return out;
    }
    if(uiState.phase !== "needs_action") return out;

    // Fight
    areaPillsEl.querySelectorAll(".playerPill.selectable").forEach(pill => {
      const id = pill.getAttribute("data-id");
      const e = world.entities.npcs?.[id] || world.entities.monsters?.[id];
      if(!e) return;
      const weak = (e.hp ?? 100) <= 40;
      const isMonster = !!world.entities.monsters?.[id];
      out.push({ ic:"⚔️", t:`Attack ${isMonster ? "the beast" : firstName(e.name)}`, why: isMonster ? "very dangerous" : (weak ? "they're limping" : (armed ? visibleState(e) : "bare-handed")), warn: !armed || isMonster,
        score: (armed ? 2 : 0.3) + (weak ? 2 : 0) - (isMonster ? 2 : 0), run:() => { pill.click(); btnAttack.click(); } });
    });
    // Take (one entry per kind within reach)
    groundItemPills.querySelectorAll(".itemPill.ground").forEach(pill => {
      const idx = Number(pill.getAttribute("data-gidx"));
      const def = getItemDef(world.map.areasById[String(p.areaId)]?.groundItems?.[idx]?.defId);
      if(!def) return;
      let score = 1;
      if(def.type === ItemTypes.WEAPON && !armed) score = 4;
      else if(def.effects?.healFP && fp < 70) score = 3.6;
      else if(def.effects?.healHP && hp < 70) score = 3.6;
      else if(def.id === "backpack") score = 3;
      const many = pill.querySelector(".pillCount")?.textContent || "";
      out.push({ ic: getItemIcon(def.id), t:`Take the ${def.name.toLowerCase()}`, why: Object.values(world.entities.npcs || {}).some(n => (n.hp ?? 0) > 0 && n.areaId === p.areaId) ? "others may reach for it" : (many ? `${many} here` : ""), score, run:() => { pill.click(); btnCollect.click(); } });
    });
    // Use what you carry
    (p.inventory?.items || []).forEach((it, idx) => {
      const def = getItemDef(it.defId);
      if(def?.type !== ItemTypes.CONSUMABLE) return;
      const heals = def.effects?.healHP || def.effects?.healFP;
      if(!heals) return;
      out.push({ ic: getItemIcon(def.id), t:`Use the ${def.name.toLowerCase()}`, why:"from your pack", score: (hp < 60 && def.effects?.healHP) || (fp < 40 && def.effects?.healFP) ? 4.5 : 0.4,
        run:() => { const pill = invPillsEl.querySelector(`.itemPill[data-idx="${idx}"]`); if(pill){ pill.click(); pill.click(); } } });
    });
    const add = (btn, ic, t, why, score, warn) => { if(stageVisible(btn)) out.push({ ic, t, why, score, warn, run:() => btn.click() }); };
    const crowd = Object.values(world.entities.npcs || {}).filter(n => (n.hp ?? 0) > 0 && n.areaId === p.areaId).length;
    add(btnDefend, "🛡️", "Defend", "blows hurt less until you move", crowd ? (armed ? 2.2 : 3) : 0);
    add(btnDrink, "💧", "Drink", "restores energy", fp < 80 ? 3.5 : 0.3);
    add(document.getElementById("btnRest"), "🛌", "Rest", dangerNear ? "heals, if nothing finds you" : "heals a little tonight", hp < 70 ? 3 : 0.5, dangerNear);
    add(document.getElementById("btnForage"), "🌿", "Forage", area?.hasFood ? "food grows here" : "slim chances", fp < 60 ? 3 : 0.8);
    add(document.getElementById("btnHide"), "🫥", "Hide", "silent; danger may pass you by", dangerNear ? 4 : 0.6);
    add(btnSetNet, "🕸️", "Set a net", "ready tomorrow", 1);
    add(btnSetMine, "🧨", "Set a mine", "ready tomorrow", 1);
    add(btnNothing, "⏳", "Wait", "careless people get caught", 0.1);
    return out.sort((a, b) => b.score - a.score);
  }

  function lastEvent(){
    const j = Array.isArray(world?.journal) ? world.journal : [];
    const d = Number(world?.meta?.day ?? 1);
    for(let i = j.length - 1; i >= 0; i--){ if(j[i].day >= d - 1) return j[i].text; }
    return "The gong sounds. You step off your plate.";
  }

  function renderStage(){
    if(!world) return;
    const p = world.entities.player;
    const hp = clamp(Number(p.hp ?? 100), 0, 100), fp = clamp(Number(p.fp ?? 100), 0, 100);
    const barCol = (v) => v > 69 ? "#4fbf6a" : v > 39 ? "#e9a23b" : "#e5533d";
    const npcs = Object.values(world.entities.npcs || {});
    const alive = npcs.filter(n => (n.hp ?? 0) > 0).length + ((p.hp ?? 0) > 0 ? 1 : 0);
    const weaponId = p.inventory?.equipped?.weaponDefId;
    const items = (p.inventory?.items || []).map((it, idx) => ({ it, idx, def: getItemDef(it.defId) })).filter(x => x.def);

    // HUD
    const hud = document.getElementById("stageHud");
    if(hud){
      hud.innerHTML = `
        <div class="hudWho"><span class="hudPortrait">D${escapeHtml(String(p.district ?? "?"))}</span><span>You</span><span class="hudMut">S${p.attrs?.F ?? 0} D${p.attrs?.D ?? 0} P${p.attrs?.P ?? 0}</span></div>
        <div class="hudMeter" data-tooltip="Body"><span class="hudLbl body">Body</span><span class="hudBar"><i style="width:${hp}%;background:${barCol(hp)}"></i></span><span>${escapeHtml(bodyHPWord(hp))}</span></div>
        <div class="hudMeter" data-tooltip="Energy"><span class="hudLbl energy">Energy</span><span class="hudBar"><i style="width:${fp}%;background:${barCol(fp)}"></i></span><span>${escapeHtml(bodyFPWord(fp))}</span></div>
        <div class="hudItems">${items.length ? items.map(x => `<button type="button" class="hudItem ${x.def.id === weaponId ? "held" : ""}" data-idx="${x.idx}" data-tooltip="${escapeHtml(itemTooltip(x.def, x.it))}">${escapeHtml(getItemIcon(x.def.id))} ${escapeHtml(x.def.name)}${(x.it.qty || 1) > 1 ? ` ×${x.it.qty}` : ""}</button>`).join("") : `<span class="hudMut">Empty-handed</span>`}</div>
        <div class="hudRight"><span>Day ${world.meta.day} · <b>${uiState.phase === "explore" ? "Travel" : uiState.phase === "trapped" ? "Trapped" : "Act"}</b></span><span><b>${alive}</b> alive</span></div>`;
      hud.querySelectorAll(".hudItem").forEach(b => {
        b.onclick = () => {
          const pill = invPillsEl.querySelector(`.itemPill[data-idx="${b.getAttribute("data-idx")}"]`);
          const def = getItemDef(p.inventory.items[Number(b.getAttribute("data-idx"))]?.defId);
          if(!pill || !def) return;
          if(def.type === ItemTypes.CONSUMABLE){
            if(!b.classList.contains("armed")){ b.classList.add("armed"); b.dataset.label = b.textContent; b.textContent = `Use ${def.name}?`; setTimeout(() => { if(b.isConnected){ b.classList.remove("armed"); b.textContent = b.dataset.label; } }, 3000); return; }
            pill.click(); pill.click(); return;
          }
          pill.click();
        };
      });
    }

    // Action card (anchored to your area, which is always at the centre)
    const card = document.getElementById("actionCard");
    if(card){
      const area = world.map.areasById[String(p.areaId)];
      const biome = String(area?.biome || "").toLowerCase();
      const sit = stageSituation();
      const opts = stageOptions();
      const top = opts.slice(0, 3), rest = opts.slice(3);
      const movesLeft = Math.max(0, MAX_MOVES_PER_DAY - uiState.movesUsed);
      let actionsHtml = "";
      if((p.hp ?? 0) <= 0){
        actionsHtml = "";
      } else if(uiState.phase === "explore"){
        const risky = senseLines(world).some(x => x.kind === "monster" || x.kind === "danger");
        actionsHtml = `<div class="acHint">Click a lit area to move · ${movesLeft} move${movesLeft === 1 ? "" : "s"} left</div>
          <div class="acRow"><button type="button" class="acBtn first" id="acSettle">🌙 Settle for the night</button></div>
          ${risky ? `<div class="acWarn">Something dangerous is close.</div>` : ""}`;
      } else {
        actionsHtml = `<div class="acRow">${top.map((o, i) => `<button type="button" class="acBtn ${i === 0 ? "first" : ""}" data-opt="${i}"><span class="acIc">${o.ic}</span><span>${escapeHtml(o.t)}${o.why ? `<small class="${o.warn ? "warn" : ""}">${escapeHtml(o.why)}</small>` : ""}</span></button>`).join("")}</div>
          ${rest.length ? `<button type="button" class="acMore" id="acMore" aria-expanded="${stageState.more}">${stageState.more ? "Fewer options" : `More (${rest.length})`}</button>` : ""}
          ${stageState.more ? `<div class="acRow extra">${rest.map((o, i) => `<button type="button" class="acBtn small" data-opt="${i + 3}"><span class="acIc">${o.ic}</span><span>${escapeHtml(o.t)}</span></button>`).join("")}</div>` : ""}
          <div class="acHint">Act first, then you can move</div>`;
      }
      card.innerHTML = `
        <div class="acPlace">${escapeHtml(area?.id === 1 ? "The Cornucopia" : cap(biome || "unknown"))} <span>· Area ${escapeHtml(String(p.areaId))}</span></div>
        <p class="acEvent">${escapeHtml(lastEvent())}</p>
        <p class="acCtx">${escapeHtml(sit.text)}${sit.warn ? ` <span class="warn">${escapeHtml(sit.warn)}</span>` : ""}</p>
        ${actionsHtml}`;
      card.querySelectorAll("[data-opt]").forEach(b => { b.onclick = () => { stageState.more = false; opts[Number(b.getAttribute("data-opt"))]?.run(); }; });
      const more = card.querySelector("#acMore"); if(more) more.onclick = () => { stageState.more = !stageState.more; renderStage(); };
      const settle = card.querySelector("#acSettle"); if(settle) settle.onclick = () => btnEndDay.click();
    }

    // Delicate log
    const log = document.getElementById("stageLog");
    if(log){
      const j = (Array.isArray(world.journal) ? world.journal : []).slice(-5);
      log.innerHTML = `<div class="logHead"><span>Log</span><button type="button" id="logOpen">Open journal</button></div>
        ${j.map((e, i) => `<p style="opacity:${(0.35 + 0.65 * (i + 1) / j.length).toFixed(2)}"><b>D${e.day}</b> ${escapeHtml(e.text)}</p>`).join("")}`;
      const open = log.querySelector("#logOpen"); if(open) open.onclick = () => setJournal(true);
    }
  }
  // ======================================================================

  function renderSenses(){
    const list = document.getElementById("sensesList");
    if(!list) return;
    const lines = senseLines(world);
    if(!lines.length){
      list.innerHTML = `<li class="muted">${escapeHtml(pick(["Only wind and your own breathing.", "Nothing stirs. That is almost worse.", "Quiet, for now."], `${world?.meta?.seed}:${world?.meta?.day}:${world?.entities?.player?.areaId}:quiet`))}</li>`;
      return;
    }
    list.innerHTML = lines.map(l => `<li data-area="${escapeHtml(String(l.areaId))}" class="sense ${escapeHtml(l.kind)}">${escapeHtml(l.text)}</li>`).join("");
    list.querySelectorAll("li[data-area]").forEach(li => {
      li.onmouseenter = () => { uiState.focusedAreaId = Number(li.getAttribute("data-area")); try { mapUI.hoveredId = uiState.focusedAreaId; mapUI.render(); } catch(_e) {} };
      li.onmouseleave = () => { try { mapUI.hoveredId = null; mapUI.render(); } catch(_e) {} };
    });
  }

  function sync(){
    if(!world) return;

    dayEl.textContent = String(world.meta.day);
    seedEl.textContent = String(world.meta.seed);

    if(fallenEl){
      const npcs = world?.entities?.npcs || {};
      const ids = Object.keys(npcs);
      const fallenNpcs = ids.filter(id => (npcs[id]?.hp ?? 0) <= 0).length;
      const fallenPlayer = ((world?.entities?.player?.hp ?? 0) <= 0) ? 1 : 0;
      const fallen = fallenNpcs + fallenPlayer;
      fallenEl.textContent = `${fallen} fallen tributes`;
    }

    const p = world.entities.player;

    curAreaEl.textContent = String(p.areaId);

    // Background texture for the current biome (keeps biome colors via overlay)
    applyBiomeBackground();

    renderInventory();
    renderGroundItem();

    const movesLeft = Math.max(0, MAX_MOVES_PER_DAY - uiState.movesUsed);
    movesLeftEl.textContent = String(movesLeft);
    if(movesLeftEl2) movesLeftEl2.textContent = String(movesLeft);

    // Panel state toggles
    if(uiState.phase === "needs_action"){
      needsActionEl.classList.remove("hidden");
      exploreStateEl.classList.add("hidden");
      if(trappedStateEl) trappedStateEl.classList.add("hidden");
    } else if(uiState.phase === "trapped"){
      needsActionEl.classList.add("hidden");
      exploreStateEl.classList.add("hidden");
      if(trappedStateEl) trappedStateEl.classList.remove("hidden");
    } else {
      needsActionEl.classList.add("hidden");
      exploreStateEl.classList.remove("hidden");
      if(trappedStateEl) trappedStateEl.classList.add("hidden");
    }

    // Contextual actions for the current area
    const curArea = world.map.areasById[String(p.areaId)];
    const npcsHere = Object.values(world.entities.npcs || {}).filter(n => (n.hp ?? 0) > 0 && n.areaId === p.areaId);
    const canDefend = uiState.phase === "needs_action" && npcsHere.length > 0;
    // Defend is only meaningful when there is at least one NPC in the current area.
    // This is a UI-only change (rules remain intact).
    if(btnDefend){
      if(canDefend) btnDefend.classList.remove("hidden");
      else btnDefend.classList.add("hidden");
    }
    // Alone: rest, forage or hide instead of just waiting.
    const alone = uiState.phase === "needs_action" && npcsHere.length === 0;
    for(const id of ["btnRest","btnForage","btnHide"]){
      const b = document.getElementById(id);
      if(b){ b.classList.toggle("hidden", !alone); b.disabled = !alone; }
    }
    if(btnNothing) btnNothing.classList.toggle("hidden", alone);
    const canDrink = uiState.phase === "needs_action" && !!curArea?.hasWater;
    if(btnDrink){
      if(canDrink) btnDrink.classList.remove("hidden");
      else btnDrink.classList.add("hidden");
    }

    // Trap-related actions
    const invItems = p.inventory?.items || [];
    const hasNet = invItems.some(it => it.defId === "net" && (it.qty || 1) > 0);
    const hasMine = invItems.some(it => it.defId === "mine" && (it.qty || 1) > 0);
    if(btnSetNet){
      if(uiState.phase === "needs_action" && hasNet) btnSetNet.classList.remove("hidden");
      else btnSetNet.classList.add("hidden");
    }
    if(btnSetMine){
      if(uiState.phase === "needs_action" && hasMine) btnSetMine.classList.remove("hidden");
      else btnSetMine.classList.add("hidden");
    }

    // Trapped UI
    if(uiState.phase === "trapped"){
      if(trapDaysEl) trapDaysEl.textContent = String(p.trappedDays ?? 0);
      const hasDagger = invItems.some(it => it.defId === "dagger" && (it.qty || 1) > 0);
      if(btnCutNet){
        if(hasDagger) btnCutNet.classList.remove("hidden");
        else btnCutNet.classList.add("hidden");
      }
    }

    // Map overlay area info (focused area)
    const focus = uiState.focusedAreaId;
    const a = world.map.areasById[String(focus)];
    const visited = world.flags.visitedAreas.includes(focus);
    const revealed = visited || focus === p.areaId;
    const biome = revealed ? (a?.biome || "—") : "Unknown land";
    const known = revealed ? memoryLines(world, focus) : ["You have never been here."];
    const sensedHere = senseLines(world).filter(x => Number(x.areaId) === Number(focus) && x.dir !== "here").map(x => x.text);
    areaInfoEl.innerHTML = `
      <div><strong>Area ${escapeHtml(String(focus))}</strong> <span class="muted tiny">· ${escapeHtml(String(biome))}</span></div>
      ${[...known, ...sensedHere].map(l => `<div class="muted tiny">${escapeHtml(l)}</div>`).join("")}
    `;

    // What you sense around you (right panel)
    renderSenses();
    queueMicrotask(renderStage);

    // Left panel pills (current area occupants)
    renderAreaPills();

    // Debug list (compact)
    if(debugList){
      const everyone = [
        { id: "player", name: "You", district: p.district, hp: p.hp ?? 100, fp: p.fp ?? 100, areaId: p.areaId, dead: (p.hp ?? 0) <= 0, attrs: p.attrs, inv: p.inventory, kills: p.kills || 0 },
        ...Object.values(world.entities.npcs || {}).map(n => ({
          id: n.id,
          name: n.name,
          district: n.district,
          hp: n.hp ?? 100,
          fp: n.fp ?? 100,
          areaId: n.areaId,
          dead: (n.hp ?? 0) <= 0,
          attrs: n.attrs,
          inv: n.inventory,
          kills: n.kills || 0,
        })),
        ...Object.values(world.entities.monsters || {}).map(m => ({
          id: m.id,
          name: `${m.icon || "🟣"} ${m.name || "Monster"}`,
          district: null,
          hp: m.hp ?? 0,
          fp: null,
          areaId: m.areaId,
          dead: !((m.alive ?? true)) || (m.hp ?? 0) <= 0,
          attrs: null,
          inv: null,
          kills: 0,
          isMonster: true,
        })),
      ];
      everyone.sort((a,b) => (a.dead - b.dead) || (a.areaId - b.areaId) || String(a.name).localeCompare(String(b.name)));
      debugList.innerHTML = everyone.map(t => {
        const status = t.dead ? "DEAD" : "ALIVE";
        const F = t.attrs?.F ?? 0;
        const D = t.attrs?.D ?? 0;
        const P = t.attrs?.P ?? 0;
        const K = Number(t.kills || 0);
        const invHtml = renderInvPills(t.inv);
        const tagHtml = t.isMonster ? `<span class="muted tiny">🟣 Monster</span>` : `<span class="muted tiny">${escapeHtml(districtTag(t.district))}</span>`;
        const fpTxt = t.isMonster ? "—" : String(t.fp ?? 100);
        return `<div class="debugCard ${t.dead ? "dead" : ""}">
          <div class="debugTop"><strong>${escapeHtml(t.name)}</strong>${tagHtml}</div>
          <div class="debugBottom"><span>HP ${escapeHtml(String(t.hp))}</span><span>FP ${escapeHtml(fpTxt)}</span><span>Area ${escapeHtml(String(t.areaId))}</span><span>F${escapeHtml(String(F))} D${escapeHtml(String(D))} P${escapeHtml(String(P))}</span><span>K${escapeHtml(String(K))}</span><span>${status}</span></div>
          <div class="debugInv">${invHtml}</div>
        </div>`;
      }).join("") || `<div class="muted small">—</div>`;
    }

    // Debug AI metrics (toggle)
    if(debugAiToggle && debugAiMetrics){
      if(debugAiToggle.checked){
        const last = Array.isArray(world.log?.days) ? world.log.days[world.log.days.length - 1] : null;
        const d = last?.debug || null;
        if(d){
          debugAiMetrics.innerHTML =
            `<div>NPCs sharing an area: <strong>${escapeHtml(String(d.sharedNpcCount ?? "—"))}</strong></div>` +
            `<div>NPC attacks: possible <strong>${escapeHtml(String(d.attacksPossible ?? "—"))}</strong> • executed <strong>${escapeHtml(String(d.attacksExecuted ?? "—"))}</strong></div>`;
        } else {
          debugAiMetrics.innerHTML = `<div class="muted small">No metrics for this day yet.</div>`;
        }
      } else {
        debugAiMetrics.innerHTML = "";
      }
    }

    mapUI.setData({ world, paletteIndex: 0 });
    mapUI.render();
    // Minimap (full view + viewport rectangle)
    if(miniMapUI){
      miniMapUI.setData({ world, paletteIndex: 0 });
      miniMapUI.render();
    }

    // If player died, lock controls
    const dead = (p.hp ?? 0) <= 0;
    const everyoneAlive = [
      { id: "player", hp: p.hp ?? 100 },
      ...Object.values(world.entities.npcs || {}).map(n => ({ id: n.id, hp: n.hp ?? 100 }))
    ].filter(x => (x.hp ?? 0) > 0);
    const playerWon = !dead && (everyoneAlive.length === 1) && (everyoneAlive[0].id === "player");

    if(playerWon){
      showLeftAlert("Victory. You are the last tribute alive.");
      openVictoryDialog();
      btnDefend.disabled = true;
      btnNothing.disabled = true;
      if(btnDrink) btnDrink.disabled = true;
      btnAttack.disabled = true;
      btnCollect.disabled = true;
      btnEndDay.disabled = true;
      return;
    }
    if(dead){
      showLeftAlert("☠️ You died. Restart the game.");
      // Show a dedicated game over dialog (e.g., if the area vanished).
      const a = world?.map?.areasById?.[String(p.areaId)];
      const reason = (a && a.isActive === false) ? "area_closed" : "death";
      openDeathDialog({ reason });
      btnDefend.disabled = true;
      btnNothing.disabled = true;
      if(btnDrink) btnDrink.disabled = true;
      btnAttack.disabled = true;
      btnCollect.disabled = true;
      btnEndDay.disabled = true;
    } else {
      btnDefend.disabled = false;
      btnNothing.disabled = false;
      if(btnDrink) btnDrink.disabled = false;
      const tooTired = Number(p.fp ?? 0) < 10;
      const hasTarget = uiState.selectionMode === "target" && uiState.selectedTarget && uiState.selectedTarget !== "player";
      btnAttack.disabled = tooTired || !hasTarget || uiState.phase !== "needs_action";
      // UX: explain a disabled Attack button.
      if(tooTired) btnAttack.setAttribute("data-tooltip", "You are too exhausted to fight.");
      // Collect availability handled in renderGroundItem()
      btnEndDay.disabled = false;

      // UI-only: light internal narration based on your condition (text-only, low-cost).
      try {
        const ui = ensureUiNarrative();
        const day = Number(world?.meta?.day ?? 0);
        const hp = Number(p?.hp ?? 0);
        const fp = Number(p?.fp ?? 0);
        const status = Array.isArray(p?.status) ? p.status : [];

        let key = "";
        if(hp > 0 && hp <= 25) key = "wounded";
        else if(fp <= 0) key = "starving";
        else if(fp > 0 && fp <= 20) key = "exhausted";
        else if(status.some(s => String(s || "").toLowerCase().includes("poison"))) key = "poisoned";

        if(ui && key){
          const changed = (ui.lastMoodToastDay !== day) || (ui.lastMoodKey !== key);
          if(changed){
            const linesByKey = {
              wounded: [
                "Every movement hurts.",
                "Your body protests with each step.",
                "You're bleeding. You should be careful."
              ],
              exhausted: [
                "You feel exhausted.",
                "Your legs feel heavy.",
                "You can barely catch your breath."
              ],
              starving: [
                "Your body is starting to fail.",
                "Hunger claws at your focus.",
                "You are starving and out of energy."
              ],
              poisoned: [
                "Something toxic burns in your veins.",
                "Your stomach churns. The poison isn't done with you.",
                "You feel sick."
              ]
            };
            const pick = pickDeterministic(linesByKey[key] || [], `mood:${day}:${key}`);
            if(pick) pushToast(pick, { kind:"info", ttl: 9000 });
            ui.lastMoodToastDay = day;
            ui.lastMoodKey = key;
          }
        }
      } catch(_e) {}
    }
  }

  // Action buttons (commit immediately)
  btnDefend.onclick = () => {
    if(!world) return;
    const { nextWorld, events } = commitPlayerAction(world, { kind:"DEFEND" });
    world = nextWorld;
    uiState.dayEvents.push(...events);
    uiState.phase = "explore";
    saveToLocal(world);
    sync();
    openResultDialog(events);
  };

  for(const [id, kind] of [["btnRest","REST"],["btnForage","FORAGE"],["btnHide","HIDE"]]){
    const b = document.getElementById(id);
    if(!b) continue;
    b.onclick = () => {
      if(!world) return;
      const { nextWorld, events } = commitPlayerAction(world, { kind });
      world = nextWorld;
      uiState.dayEvents.push(...events);
      uiState.phase = "explore";
      saveToLocal(world);
      sync();
      openResultDialog(events);
    };
  }

  btnNothing.onclick = () => {
    if(!world) return;
    const kind = "NOTHING";
    const { nextWorld, events } = commitPlayerAction(world, { kind });
    world = nextWorld;
    uiState.dayEvents.push(...events);
    uiState.phase = "explore";
    saveToLocal(world);
    sync();
    if(shouldShowActionResult(kind, events)) openResultDialog(events);
  };

  btnDrink.onclick = () => {
    if(!world) return;
    const p = world.entities.player;
    const a = world.map.areasById[String(p.areaId)];
    if(!a?.hasWater){
      showLeftAlert("There is no water here.");
      return;
    }
    const { nextWorld, events } = commitPlayerAction(world, { kind:"DRINK" });
    world = nextWorld;
    uiState.dayEvents.push(...events);
    uiState.phase = "explore";
    saveToLocal(world);
    sync();
    openResultDialog(events);
  };

  if(btnSetNet){
    btnSetNet.onclick = () => {
      if(!world) return;
      const { nextWorld, events } = commitPlayerAction(world, { kind:"SET_TRAP", trapDefId:"net" });
      world = nextWorld;
      uiState.dayEvents.push(...events);
      uiState.phase = "explore";
      saveToLocal(world);
      sync();
      openResultDialog(events);
    };
  }

  if(btnSetMine){
    btnSetMine.onclick = () => {
      if(!world) return;
      const { nextWorld, events } = commitPlayerAction(world, { kind:"SET_TRAP", trapDefId:"mine" });
      world = nextWorld;
      uiState.dayEvents.push(...events);
      uiState.phase = "explore";
      saveToLocal(world);
      sync();
      openResultDialog(events);
    };
  }

  if(btnCutNet){
    btnCutNet.onclick = () => {
      if(!world) return;
      const { nextWorld, events } = commitPlayerAction(world, { kind:"CUT_NET" });
      world = nextWorld;
      uiState.dayEvents.push(...events);
      // Cutting the net counts as your action for the day.
      uiState.phase = "explore";
      saveToLocal(world);
      sync();
      openResultDialog(events);
    };
  }

  btnCollect.onclick = () => {
    if(!world) return;
    if(uiState.selectionMode !== "item" || uiState.selectedGroundIndex == null){
      showLeftAlert("Select an item to collect.");
      return;
    }
    const { nextWorld, events } = commitPlayerAction(world, { kind:"COLLECT", itemIndex: uiState.selectedGroundIndex });
    world = nextWorld;
    uiState.dayEvents.push(...events);
    uiState.phase = "explore";
    saveToLocal(world);
    sync();
    openResultDialog(events);
  };

  btnAttack.onclick = () => {
    if(!world) return;
    if(!uiState.selectedTarget || uiState.selectedTarget === "player"){
      showLeftAlert("Select a player to attack.");
      return;
    }
    const { nextWorld, events } = commitPlayerAction(world, { kind:"ATTACK", targetId: uiState.selectedTarget });
    world = nextWorld;
    uiState.dayEvents.push(...events);
    uiState.phase = "explore";
    saveToLocal(world);
    sync();
    openResultDialog(events);
  };

  function performEndDay(){
    if(!world) return;
    const intents = generateNpcIntents(world);
    world = endDay(world, intents, uiState.dayEvents);
    uiState.focusedAreaId = world.entities.player.areaId;
    resetDayState();
    saveToLocal(world);
    sync();
    const evs = world.log.days[world.log.days.length-1]?.events || [];
    if((world.entities.player.hp ?? 0) > 0) openEndDayDialog(evs);
  }

  btnEndDay.onclick = () => {
    performEndDay();
  };

  if(btnEndDayTrapped){
    btnEndDayTrapped.onclick = () => btnEndDay.onclick();
  }

  document.getElementById("debugAdvance").onclick = () => {
    if(!world) return;

    // If user hasn't committed an action yet, auto-commit NOTHING for testing.
    if(uiState.phase === "needs_action"){
      const { nextWorld, events } = commitPlayerAction(world, { kind:"NOTHING" });
      world = nextWorld;
      uiState.dayEvents.push(...events);
      uiState.phase = "explore";
    }

    const intents = generateNpcIntents(world);
    world = endDay(world, intents, uiState.dayEvents);
    uiState.focusedAreaId = world.entities.player.areaId;
    resetDayState();
    saveToLocal(world);
    sync();
    const evs = world.log.days[world.log.days.length-1]?.events || [];
    if((world.entities.player.hp ?? 0) > 0) openEndDayDialog(evs);
  };

  document.getElementById("regen").onclick = () => {
    startNewGame(world.meta.mapSize, world.meta.totalPlayers || 24, world.entities.player.district || 12);
  };
  document.getElementById("restart").onclick = () => {
    clearLocal();
    world = null;
    renderStart();
  };
  document.getElementById("saveLocal").onclick = () => { saveToLocal(world); alert("Saved."); };
  document.getElementById("export").onclick = () => downloadJSON(world);

  document.getElementById("import").onchange = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const next = await uploadJSON(file);
    world = next;
    uiState.focusedAreaId = world.entities.player.areaId;
    resetDayState();
    saveToLocal(world);
    sync();
  };

  document.getElementById("clearLocal").onclick = () => {
    clearLocal();
    alert("Save cleared. Refresh and start a new game.");
  };

  mapUI.setData({ world, paletteIndex: 0 });
  if(miniMapUI) miniMapUI.setData({ world, paletteIndex: 0 });
  sync();

  // Prevent opening multiple death dialogs.
  if(!uiState.deathDialogShown) uiState.deathDialogShown = false;
  if(!uiState.victoryDialogShown) uiState.victoryDialogShown = false;

  function openResultDialog(events){
    // UI change: results are shown as toasts (dialogs are reserved for death/victory).
    toastEvents(events);
  }

  function broadcastHighlights(){
    const out = [];
    const days = Array.isArray(world?.log?.days) ? world.log.days : [];
    const npcName = (id) => world?.entities?.npcs?.[id]?.name || null;
    for(const d of days){
      const dayN = Number(d?.day ?? 0);
      const evs = Array.isArray(d?.events) ? d.events : [];
      const myTargets = new Set(evs.filter(e => e?.type === "ATTACK" && !e.who && e.ok && e.target).map(e => e.target));
      const deaths = evs.filter(e => e?.type === "DEATH" && e.who && e.who !== "player" && npcName(e.who));
      for(const e of deaths){
        if(myTargets.has(e.who)) out.push({ day: dayN, text: `You killed ${npcName(e.who)}.` });
      }
      if(deaths.length >= 5) out.push({ day: dayN, text: `A bloodbath. ${deaths.length} tributes fell.` });
      for(const e of evs){
        if(e?.type === "SPONSOR_GIFT") out.push({ day: dayN, text: `A sponsor sent a ${(getItemDef(e.itemDefId)?.name || "gift").toLowerCase()}.` });
        else if(e?.type === "GROUND_CONTEST" && e.outcome === "tie_fight" && (e.tied || []).includes("player")){
          const other = (e.tied || []).filter(x => x !== "player").map(npcName).filter(Boolean).join(", ");
          out.push({ day: dayN, text: `Fought ${other || "a rival"} for a ${(getItemDef(e.itemDefId)?.name || "prize").toLowerCase()} — and ${e.winner === "player" ? "won" : "lost"}.` });
        }
        else if(e?.type === "ATTACK" && e.target === "player" && Number(e.dmg || 0) >= 25 && npcName(e.who)) out.push({ day: dayN, text: `Badly wounded by ${npcName(e.who)}.` });
        else if(e?.type === "MONSTER_AOE" && e.who === "player") out.push({ day: dayN, text: `Mauled by the ${String(e.monsterName || "beast").replace(/^the\s+/i, "")}.` });
        else if(e?.type === "HIDDEN_SAFE") out.push({ day: dayN, text: "Stayed hidden while death walked past." });
      }
    }
    // De-duplicate and keep it to a broadcast-sized reel.
    const seen = new Set();
    const uniq = out.filter(h => { const k = `${h.day}|${h.text}`; if(seen.has(k)) return false; seen.add(k); return true; });
    return uniq.length > 9 ? [...uniq.slice(0, 4), ...uniq.slice(-5)] : uniq;
  }

  function deathCauseText(){
    const days = Array.isArray(world?.log?.days) ? world.log.days : [];
    for(let i = days.length - 1; i >= 0; i--){
      const evs = days[i]?.events || [];
      const d = [...evs].reverse().find(e => e?.type === "DEATH" && e.who === "player");
      if(d){
        const line = formatEvents([d])[0];
        const hit = [...evs].reverse().find(e => (e?.target === "player" || e?.who === "player") && Number(e?.dmg || 0) > 0 && e.type !== "DEATH");
        const hitLine = hit ? formatEvents([hit])[0] : "";
        return [hitLine, line].filter(Boolean).join(" ");
      }
    }
    for(let i = (toastLog?.length || 0) - 1; i >= 0; i--){ if(toastLog[i]?.meta?.damageToPlayer) return toastLog[i].text; }
    return "Everything goes dark.";
  }

  function openBroadcast({ won = false } = {}){
    if(won){ if(uiState.victoryDialogShown) return; uiState.victoryDialogShown = true; }
    else { if(uiState.deathDialogShown) return; uiState.deathDialogShown = true; }
    try { toastHost.innerHTML = ""; } catch(_e) {}
    document.getElementById("nightCard")?.classList.add("hidden");

    const player = world?.entities?.player;
    const npcs = world?.entities?.npcs || {};
    const total = Object.keys(npcs).length + 1;
    const alive = Object.values(npcs).filter(n => (n?.hp ?? 0) > 0).length;
    const placement = won ? 1 : alive + 1;
    const ordinal = (n) => { const v = Math.abs(Number(n) || 0), m = v % 100; if(m >= 11 && m <= 13) return `${v}th`; return `${v}${["th","st","nd","rd"][v % 10] || "th"}`; };
    const dayNum = Number(world?.meta?.day ?? 0);
    const kills = Number(player?.kills ?? 0);
    const arena = world?.map?.arenaName || "the arena";
    const district = player?.district ?? "?";
    const highlights = broadcastHighlights();

    const overlay = document.createElement("div");
    overlay.className = "modalOverlay";
    overlay.innerHTML = `
      <div class="modal broadcast" role="dialog" aria-labelledby="bcTitle">
        <div class="bcKicker">● Capitol Broadcast · ${escapeHtml(arena)}</div>
        <div id="bcTitle" class="bcTitle">${won ? `A victor from District ${escapeHtml(String(district))}!` : `The tribute from District ${escapeHtml(String(district))} has fallen`}</div>
        <div class="bcLead">${escapeHtml(won ? "The last cannon fires. The hovercraft descends for the only tribute left standing." : deathCauseText())}</div>
        <div class="bcStats">
          <div><span>${escapeHtml(ordinal(placement))}</span>of ${total}</div>
          <div><span>${dayNum}</span>${dayNum === 1 ? "day" : "days"}</div>
          <div><span>${kills}</span>${kills === 1 ? "kill" : "kills"}</div>
        </div>
        ${highlights.length ? `<div class="bcReelTitle">Tonight's highlights</div><ol class="bcReel">${highlights.map(h => `<li><b>Day ${h.day}</b> ${escapeHtml(h.text)}</li>`).join("")}</ol>` : ""}
        <details class="bcJournal"><summary>Your journal</summary><div class="bcJournalBody"></div></details>
        <div class="row" style="margin-top:14px; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
          <button id="bcReplay" class="btn" type="button">Replay this arena</button>
          <button id="bcNew" class="btn primary" type="button">New Games</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    try {
      const jb = overlay.querySelector(".bcJournalBody");
      const entries = Array.isArray(world?.journal) ? world.journal : [];
      jb.innerHTML = entries.map(e => `<p><b>Day ${escapeHtml(String(e.day))}</b> ${escapeHtml(e.text)}</p>`).join("") || `<p class="muted">Nothing written.</p>`;
    } catch(_e) {}

    const setup = world?.meta?.setup || null;
    const reset = () => { world = null; toastLog = []; uiState.deathDialogShown = false; uiState.victoryDialogShown = false; overlay.remove(); };
    overlay.querySelector("#bcReplay").onclick = () => {
      if(!setup){ reset(); renderStart(); return; }
      reset();
      startNewGame(setup.mapSize, setup.totalPlayers, setup.playerDistrict, setup.playerAttrs, setup.seed);
    };
    overlay.querySelector("#bcNew").onclick = () => { clearLocal(); reset(); renderStart(); };
    try { overlay.querySelector("#bcNew").focus({ preventScroll: true }); } catch(_e) {}
  }

  function openDeathDialog(){ openBroadcast({ won: false }); }
  function openVictoryDialog(){ openBroadcast({ won: true }); }

  function shouldShowActionResult(kind, events){
    // Show when the player chose a meaningful action OR something meaningful happened.
    if(kind !== "NOTHING") return true;

    const notes = (events || []).filter(e => e.type === "NOTHING").map(e => e.note).filter(Boolean);
    const nonQuietNote = notes.find(n => n !== "quiet_day");
    if(nonQuietNote) return true;

    // Only show a popup for NOTHING if something affected *you*.
    const affectsPlayer = (e) => {
      if(!e) return false;
      const who = e.who ?? null;
      const target = e.target ?? e.targetId ?? null;
      if(who === "player") return true;
      if(target === "player") return true;
      return false;
    };

    const meaningfulTypes = new Set([
      "DAMAGE_RECEIVED",
      "DEATH",
      "SELF_DAMAGE",
      "POISON_APPLIED",
      "POISON_TICK",
      "SHIELD_BLOCK",
      "SHIELD_BROKEN",
      "FLASK_REVEAL",
      "HEAL",
      "DRINK",
      "EAT",
      "STARVING"
    ]);
    return (events || []).some(e => meaningfulTypes.has(e.type) && affectsPlayer(e));
  }

  function formatEvents(events){
    // Narrative formatter (English, no numbers about the world).
    const P = world?.entities?.player;
    const day = Number(world?.meta?.day ?? 0);
    const seed = Number(world?.meta?.seed ?? 0);
    const name = (id) => {
      if(id === "player") return "you";
      const n = world?.entities?.npcs?.[id];
      if(n?.name) return n.name;
      const m = world?.entities?.monsters?.[id];
      if(m?.name) return `the ${String(m.name).replace(/^the\s+/i, "")}`;
      return "someone";
    };
    const Name = (id) => cap(name(id));
    const beast = (nm) => { const t = String(nm || "beast").replace(/^the\s+/i, ""); return `the ${t}`; };
    const itemName = (defId) => (getItemDef(defId)?.name || "item");
    const lower = (s) => String(s || "").toLowerCase();
    const isMe = (id) => id === "player";
    const nearMe = (areaId) => areaId == null || Number(areaId) === Number(P?.areaId);
    const out = [];
    let i = 0;
    for(const e of (events || [])){
      i++;
      const k = `${seed}:${day}:${i}:${e?.type}`;
      switch(e?.type){
        case "AREA_FLAVOR": {
          for(const ln of (Array.isArray(e.lines) ? e.lines : [])) if(ln) out.push(String(ln));
          break;
        }
        case "AMBIENCE": { if(nearMe(e.areaId) && e.text) out.push(String(e.text)); break; }
        case "USE_ITEM": {
          if(e.ok) out.push(`You use the ${lower(itemName(e.itemDefId))}.`);
          else out.push("It doesn't work.");
          break;
        }
        case "INVISIBLE": { if(isMe(e.who)) out.push("You smear on the camouflage paste and melt into the background."); break; }
        case "ATTACK": {
          if(e.who && !isMe(e.who)){
            if(!isMe(e.target)) break;
            const wDef = e.weaponDefId ? getItemDef(e.weaponDefId) : null;
            const w = wDef ? ` with a ${lower(wDef.name)}` : "";
            if(e.ok === false || Number(e.dmg || 0) <= 0){ out.push(`${Name(e.who)} lunges at you${w}, but misses.`); break; }
            const hurt = hurtPhrase(e.dmg, k);
            if(e.defended) out.push(`${Name(e.who)} strikes${w}. You brace — it still leaves ${hurt}.`);
            else out.push(`${Name(e.who)} attacks you${w}: ${hurt}.`);
            break;
          }
          if(e.ok){
            const w = e.weapon && e.weapon !== "Fists" ? ` with your ${lower(e.weapon)}` : " with your bare hands";
            if(Number(e.dmgDealt || 0) === 0) out.push(`You strike at ${name(e.target)}${w}, but the blow is blocked.`);
            else out.push(`You strike ${name(e.target)}${w} ${hitOnOther(e.dmgDealt, k)}${e.defended ? " — they were braced for it" : ""}.`);
          } else {
            if(e.reason === "target_invisible") out.push("You swing at where they were. There is nothing there.");
            else if(e.reason === "too_tired") out.push("Your arms won't lift. You are too exhausted to fight.");
            else if(e.reason === "dex_too_low" || e.reason === "min_dex") out.push("They are too quick for that weapon. Your shot goes wide.");
            else out.push("By the time you strike, they are gone.");
          }
          break;
        }
        case "ATTACK_BLOCKED": { if(isMe(e.target)) out.push(`${Name(e.who)}'s blow slams into your shield.`); break; }
        case "DEFEND": {
          if(e.who && !isMe(e.who)) break;
          out.push(e.with ? "You raise your shield and keep your back to something solid." : "You crouch low, guard up, ready for whoever comes.");
          break;
        }
        case "DRINK": {
          if(e.who && !isMe(e.who)) break;
          if(e.ok) out.push(pick(["You drink. The water is cold and clean.", "You drink until your stomach aches. It helps."], k));
          else out.push("You search for water. There is none here.");
          break;
        }
        case "TRAP_SET": {
          if(e.who && !isMe(e.who)) break;
          if(e.ok) out.push(`You set the ${lower(itemName(e.trapDefId))} and cover it. It will be ready by tomorrow.`);
          else out.push("You fumble with the trap. It won't hold here.");
          break;
        }
        case "TRAPPED": { out.push("The net holds you fast. You can barely move."); break; }
        case "NET_CAUGHT": { if(isMe(e.who)) out.push("A net snaps shut around you!"); else if(nearMe(e.areaId)) out.push(`${Name(e.who)} is caught in a net.`); break; }
        case "NET_RELEASE": { if(isMe(e.who)) out.push("The net finally gives. You are free."); break; }
        case "CUT_NET": { out.push(e.ok ? "You saw through the net with your dagger and roll free." : "You claw at the net. Without a blade, it won't give."); break; }
        case "NET_TRIGGER": {
          if(nearMe(e.areaId)){
            if(e.caught?.length) out.push(`A net springs: ${e.caught.map(name).join(", ")} caught.`);
            else out.push("A net springs shut on empty air.");
          }
          break;
        }
        case "MINE_BLAST": { out.push(nearMe(e.areaId) ? "An explosion rips through the ground nearby!" : "An explosion echoes in the distance."); break; }
        case "MINE_HIT": { if(isMe(e.who)) out.push(`The ground explodes under your feet: ${hurtPhrase(e.dmg, k)}.`); break; }
        case "CREATURE_ATTACK": { if(isMe(e.who)) out.push(`${cap(e.creature || "a creature")} attacks you: ${hurtPhrase(e.dmg, k)}.`); break; }
        case "THREAT": {
          if(!isMe(e.target)) break;
          if(e.kind === "creature") out.push(`${cap(e.creature || "a creature")} comes out of nowhere: ${hurtPhrase(e.dmg, k)}.`);
          else out.push(`The land itself turns on you: ${hurtPhrase(e.dmg, k)}.`);
          break;
        }
        case "HAZARD_TICK": {
          if(!isMe(e.who)) break;
          const t = String(e.hazardType || "");
          out.push(({ heat:"The heat is crushing. Your head pounds.", cold:"The cold bites into your bones.", toxic:"Something in the air burns your lungs.", unstable_ground:"The ground gives way under you. You fall hard.", flooded:"The water drags at you. You nearly go under." })[t] || "This place is hurting you.");
          break;
        }
        case "HOSTILE_EVENT": { if(isMe(e.who)) out.push(`Something in the noise finds you: ${hurtPhrase(e.dmg, k)}.`); break; }
        case "LASER": { if(isMe(e.who)) out.push("A thin red beam from the sky. Searing pain. The Gamemakers want you moving."); break; }
        case "MONSTER_AOE": {
          const m = `${e.monsterIcon ? e.monsterIcon + " " : ""}${cap(beast(e.monsterName))}`;
          if(isMe(e.who)) out.push(`${m} ${e.verb || "mauls"} you: ${hurtPhrase(e.dmg, k)}.`);
          else if(nearMe(e.areaId)) out.push(`${m} ${e.verb || "mauls"} ${name(e.who)}.`);
          break;
        }
        case "MONSTER_DIE_DROP": { out.push(`${cap(beast(e.monsterName))} collapses. Its hoard spills across the ground.`); break; }
        case "MONSTER_MOVE": {
          if(nearMe(e.to)) out.push(`${cap(beast(e.monsterName))} crashes into this place.`);
          else if(nearMe(e.from)) out.push(`${cap(beast(e.monsterName))} moves off. You breathe again.`);
          break;
        }
        case "NOTHING": {
          if(e.note === "caught_off_guard") out.push("You let your guard down — someone takes the chance.");
          else if(e.note === "camouflage_prevented_attack") out.push("Someone walks right past you. The camouflage holds.");
          break;
        }
        case "GROUND_CONTEST": {
          const nm = lower(itemName(e.itemDefId));
          if(e.outcome === "tie_fight"){
            if(!(e.tied || []).includes("player")) break;
            const others = (e.tied || []).filter(id => !isMe(id)).map(name);
            out.push(`You and ${others.join(", ") || "someone"} reach the ${nm} at the same moment. You fight for it.`);
            if(e.winner === "player") out.push(`You tear the ${nm} away.`);
            else if(e.winner) out.push(`${Name(e.winner)} wrenches the ${nm} from your hands.`);
          } else if(e.outcome === "dex_win" && e.winner && !isMe(e.winner) && nearMe(e.areaId)){
            out.push(`${Name(e.winner)} is faster and snatches the ${nm} first.`);
          }
          break;
        }
        case "DISPUTE_DAMAGE": { if(isMe(e.who)) out.push(`The struggle leaves you with ${hurtPhrase(e.dmg, k)}.`); break; }
        case "BACKPACK_OPEN": { break; }
        case "BACKPACK_ITEM": {
          if(!isMe(e.who)) break;
          const qty = e.qty && e.qty > 1 ? ` (${e.qty})` : "";
          out.push(e.ok ? `• ${itemName(e.itemDefId)}${qty}` : `• ${itemName(e.itemDefId)}${qty} — no room, you leave it`);
          break;
        }
        case "AUTO_EQUIP": { if(isMe(e.who)) out.push(`You grip the ${lower(itemName(e.weaponDefId))}. It feels right in your hand.`); break; }
        case "SPOILS_PICK": { if(isMe(e.who)) out.push(`You take the ${lower(itemName(e.itemDefId))} from ${name(e.from)}'s body.`); break; }
        case "PICKUP": { if(isMe(e.who)) out.push(`You grab the ${lower(itemName(e.itemDefId))}.`); break; }
        case "COLLECT": {
          if(e.ok && e.who && !isMe(e.who)) break;
          if(e.ok && e.note === "opened"){ out.push("You tear the backpack open. Inside:"); break; }
          if(e.ok && e.note === "consumed_on_collect") break; // EAT / HEAL narrate it
          if(e.ok){ out.push(`You take the ${lower(itemName(e.itemDefId))}.`); break; }
          if(e.reason === "inventory_full") out.push("Your hands are full. You'd have to drop something.");
          else if(e.reason === "no_winner") out.push("No one is left standing to take it.");
          else out.push("It slips out of reach.");
          break;
        }
        case "SHIELD_BLOCK": { if(isMe(e.who)) out.push("Your shield takes the blow."); else if(nearMe(e.areaId)) out.push(`${Name(e.who)} catches your blow on a shield.`); break; }
        case "SHIELD_BROKEN": case "SHIELD_BREAK": { if(isMe(e.who) || isMe(e.target)) out.push("An axe splits your shield."); else if(isMe(e.by)) out.push(`Your axe splits ${name(e.who || e.target)}'s shield.`); break; }
        case "SELF_DAMAGE": { out.push(`The blast catches you too: ${hurtPhrase(e.dmg, k)}.`); break; }
        case "SPLASH_DAMAGE": { if(isMe(e.who)) out.push(`You are caught in ${name(e.by)}'s blast: ${hurtPhrase(e.dmg, k)}.`); break; }
        case "POISON_APPLIED": { if(isMe(e.who)) out.push("A sting at your neck. A dart. Your blood starts to burn."); else if(isMe(e.by)) out.push(`Your dart finds ${name(e.who)}.`); break; }
        case "POISON_DRINK": { if(isMe(e.who)) out.push("It tastes wrong. Too late."); break; }
        case "POISON_TICK": { if(isMe(e.who)) out.push("The poison burns through your veins."); break; }
        case "POISON_CURED": { if(isMe(e.who)) out.push("The burning in your blood fades."); break; }
        case "HEAL": { if(isMe(e.who)) out.push(pick(["You clean and bind your wounds.", "You patch yourself up as best you can."], k)); break; }
        case "BUFF": {
          if(!isMe(e.who)) break;
          if(e.kind === "prevent_trap_once") out.push("You'll watch your footing more carefully now.");
          else if(e.kind === "ignore_move_block_today") out.push("A jolt of energy. Nothing will hold you down today.");
          break;
        }
        case "FLASK_REVEAL": { if(isMe(e.who)) out.push(String(e.kind).toLowerCase() === "medicine" ? "It was medicine. Warmth spreads through you." : "It was poison."); break; }
        case "EAT": { if(isMe(e.who)) out.push(pick(["You eat quickly. The hunger loosens its grip.", "Food. Your hands stop shaking."], k)); break; }
        case "STARVING": { if(isMe(e.who)) out.push("You are starving. If you don't eat or drink today, you won't wake up."); break; }
        case "DAMAGE_RECEIVED": {
          if(e.from === "environment") out.push(`You slip and fall: ${hurtPhrase(e.dmg, k)}.`);
          else out.push(`${Name(e.from)} catches you: ${hurtPhrase(e.dmg, k)}.`);
          break;
        }
        case "MOVE_BLOCKED": { if(isMe(e.who)) out.push("You can't go that way."); break; }
        case "INFO": { if(e.msg === "No threats nearby.") out.push("No one else is here."); else if(e.msg) out.push(e.msg); break; }
        case "ARRIVAL": { if(nearMe(e.to)) out.push(`${Name(e.who)} arrives.`); break; }
        case "DEATH": {
          if(isMe(e.who)){
            if(e.reason === "area_closed") out.push("The air around you hardens and closes. There is no way out.");
            else if(e.reason === "starvation") out.push("You lie down. You don't get up.");
            else if(e.reason === "item_dispute") out.push(`You die fighting over the ${lower(itemName(e.itemDefId))}.`);
            else out.push("Everything goes dark.");
          } else if(nearMe(e.areaId)){
            out.push(`${Name(e.who)} falls and doesn't move again. A cannon booms.`);
          } else {
            out.push("A cannon booms somewhere in the arena.");
          }
          break;
        }
        // New mechanics (solo actions, sponsors)
        case "REST": {
          if(!isMe(e.who)) break;
          if(e.pending) out.push("You find a sheltered spot and lie down to rest.");
          else if(e.ok) out.push("The rest did you good. Your wounds feel less raw.");
          else out.push("You never really rested. Not tonight.");
          break;
        }
        case "FORAGE": {
          if(!isMe(e.who)) break;
          if(e.ok) out.push(`You forage and find ${lower(itemName(e.itemDefId))}.`);
          else out.push("You search for anything edible. Nothing.");
          break;
        }
        case "HIDE": { if(isMe(e.who)) out.push("You find a hollow, pull leaves over yourself and stay still."); break; }
        case "HIDDEN_SAFE": {
          if(!isMe(e.who)) break;
          if(e.source === "arena") out.push("Something stalks through this place in the dark. It never finds your hollow.");
          else out.push(`${cap(name(e.source))} passes a few steps away and never sees you.`);
          break;
        }
        case "SPONSOR_GIFT": {
          if(!isMe(e.who)) break;
          out.push(`A silver parachute drifts down to you. Inside: ${lower(itemName(e.itemDefId))}. Someone out there is watching.`);
          break;
        }
        default: break;
      }
    }
    // Collapse exact duplicates that come from parallel event sources.
    return out.filter((ln, idx) => out.indexOf(ln) === idx);
  }

  function openEndDayDialog(events){
    // Night: the anthem plays and the faces of the day's fallen are projected in the sky.
    const evs = Array.isArray(events) ? events : [];
    const host = document.getElementById("nightCard");
    if(!host) return;
    const dayEnded = Math.max(1, Number(world?.meta?.day ?? 1) - 1);

    const deadIds = new Set();
    for(const e of evs){
      if(e?.type === "DEATH" && e.who) deadIds.add(e.who);
      if(e?.type === "MINE_BLAST" && Array.isArray(e.dead)) for(const id of e.dead){ if(id) deadIds.add(id); }
    }
    deadIds.delete("player");
    const faces = [];
    let beastFell = false;
    for(const id of deadIds){
      const n = world?.entities?.npcs?.[id];
      if(n) faces.push({ name: n.name, district: n.district });
      else if(world?.entities?.monsters?.[id]) beastFell = true;
    }

    // What happened to you after you settled for the night (End Day phase only).
    const nightLines = formatEvents(evs.filter(e => e?.phase === "endDay" && (
      e.who === "player" || e.target === "player" || ["SPONSOR_GIFT","HIDDEN_SAFE","REST","STARVING"].includes(e.type)
    ) && e.type !== "AREA_FLAVOR" && e.type !== "DEATH")).slice(0, 5);
    for(const ln of nightLines) logJournal(ln, { kind: "night", day: dayEnded });

    const p = world?.entities?.player;
    const closing = Object.values(world?.map?.areasById || {}).some(a => a && a.isActive !== false && a.willCloseOnDay === Number(world?.meta?.day) + 1);
    const initials = (nm) => String(nm || "?").split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase();

    const facesHtml = faces.length
      ? `<div class="nightFaces">${faces.map(f => `
          <div class="nightFace"><div class="nightAvatar">${escapeHtml(initials(f.name))}</div>
          <div><div class="nightName">${escapeHtml(f.name)}</div><div class="nightDistrict">District ${escapeHtml(String(f.district ?? "?"))}</div></div></div>`).join("")}</div>`
      : `<div class="muted">The sky stays dark. No one died today.</div>`;

    host.innerHTML = `
      <div class="nightInner" role="dialog" aria-label="Night ${dayEnded}">
        <div class="nightKicker">Night ${dayEnded}</div>
        <div class="nightTitle">${faces.length ? "The anthem plays. Faces appear in the sky." : "The anthem plays to an empty sky."}</div>
        ${facesHtml}
        ${beastFell ? `<div class="muted small" style="margin-top:8px;">Somewhere, the beast's roar has stopped.</div>` : ""}
        ${nightLines.length ? `<div class="nightLines">${nightLines.map(l => `<div>${escapeHtml(l)}</div>`).join("")}</div>` : ""}
        <div class="nightFoot">
          <span class="muted small">${escapeHtml(p && (p.hp ?? 0) > 0 ? bodySentence(p.hp, p.fp, `${world.meta.seed}:${world.meta.day}`) : "")}${closing ? " The arena groans — some places will be gone by tomorrow night." : ""}</span>
          <button id="nightDawn" class="btn primary" type="button">Dawn</button>
        </div>
      </div>`;
    try { toastHost.innerHTML = ""; } catch(_e) {}
    host.classList.remove("hidden");
    const close = () => host.classList.add("hidden");
    host.querySelector("#nightDawn").onclick = close;
    host.onclick = (ev) => { if(ev.target === host) close(); };

    if(faces.length) logJournal(`Faces in the sky: ${faces.map(f => f.name).join(", ")}.`, { kind: "night", day: dayEnded });
    else logJournal("No faces in the sky tonight.", { kind: "night", day: dayEnded });
  }

  function shouldShowEndDayDialog(events){
    // Only show the end-of-day popup if something meaningful happened:
    // - any tribute died (including the player)
    // - the player took damage during the day rollover (poison tick, mine, daily threat)
    const evs = Array.isArray(events) ? events : [];
    let anyDeath = false;
    for(const e of evs){
      if(!e) continue;
      if(e.type === "DEATH" && e.who) { anyDeath = true; break; }
      if(e.type === "MINE_BLAST" && Array.isArray(e.dead) && e.dead.length) { anyDeath = true; break; }
    }
    if(anyDeath) return true;

    const rolloverDamage = evs.some(e => e && e.who === "player" && ["POISON_TICK","MINE_HIT","CREATURE_ATTACK","HOSTILE_EVENT","LASER"].includes(e.type) && Number(e.dmg || 0) > 0);
    return rolloverDamage;
  }
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// Debug helper: render an inventory as compact pills.
// This must live at the top-level because sync() uses it.
function renderInvPills(inv){
  const items = Array.isArray(inv?.items) ? inv.items : [];
  if(!items.length) return `<span class="muted tiny">(empty)</span>`;
  return items.slice(0, 7).map(it => {
    const defId = it.defId;
    const def = getItemDef(defId);
    const icon = getItemIcon(defId);
    const qty = Number(it.qty || 1);
    const stack = qty > 1 ? ` x${escapeHtml(String(qty))}` : "";
    const title = escapeHtml(def?.description || "");
    return `<span class="debugItemPill" title="${title}"><span class="pillIcon" aria-hidden="true">${escapeHtml(icon)}</span>${escapeHtml(def?.name || defId)}${stack}</span>`;
  }).join("");
}

renderStart();
