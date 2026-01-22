import { MapSize, createInitialWorld } from "./state.js";
import { generateMapData } from "./mapgen.js";
import { MapUI } from "./mapui.js";
import { commitPlayerAction, moveActorOneStep, endDay } from "./sim.js";
import { generateNpcIntents } from "./ai.js";
import { saveToLocal, loadFromLocal, clearLocal, downloadJSON, uploadJSON } from "./storage.js";

const root = document.getElementById("root");

let world = null;

const uiState = {
  focusedAreaId: 1,
  phase: "needs_action", // needs_action | explore
  movesUsed: 0,
  dayEvents: [],
};

const MAX_MOVES_PER_DAY = 3;

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
  root.innerHTML = `
    <div class="screen">
      <div class="card">
        <div class="h1">Arena Simulator</div>
        <div class="muted">Você começa na Cornucopia (Área 1). Todo dia: primeiro Commit Action, depois você pode se mover (até 3 áreas adjacentes) e encerrar com End Day.</div>
        <hr class="sep" />

        <div class="row">
          <label class="muted">Map size</label>
          <select id="size" class="select">
            <option value="${MapSize.SMALL}">Small (24)</option>
            <option value="${MapSize.MEDIUM}" selected>Medium (48)</option>
            <option value="${MapSize.LARGE}">Large (72)</option>
          </select>

          <label class="muted">Players</label>
          <select id="players" class="select">
            <option value="12" selected>12</option>
            <option value="24">24</option>
            <option value="48">48</option>
          </select>

          <label class="muted">Your district</label>
          <select id="district" class="select">
            ${Array.from({length:12}, (_,i)=>`<option value="${i+1}">District ${i+1}</option>`).join("")}
          </select>
        </div>

        <div class="row" style="margin-top:10px;">
          <button id="enter" class="btn primary" style="flex:1;">Enter arena</button>
          <button id="resume" class="btn">Resume</button>
          <button id="wipe" class="btn">Clear save</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("enter").onclick = () => {
    const mapSize = Number(document.getElementById("size").value);
    const totalPlayers = Number(document.getElementById("players").value);
    const playerDistrict = Number(document.getElementById("district").value);
    startNewGame(mapSize, totalPlayers, playerDistrict);
  };

  document.getElementById("resume").onclick = () => {
    const saved = loadFromLocal();
    if(!saved){ alert("No save found."); return; }
    world = saved;
    uiState.focusedAreaId = world.entities.player.areaId;
    uiState.phase = "needs_action";
    uiState.movesUsed = 0;
    uiState.dayEvents = [];
    renderGame();
  };

  document.getElementById("wipe").onclick = () => {
    clearLocal();
    alert("Save cleared.");
  };
}

function startNewGame(mapSize, totalPlayers, playerDistrict){
  const seed = (Math.random() * 1e9) | 0;
  const mapData = generateMapData({
    seed,
    regions: mapSize,
    width: 820,
    height: 820,
    paletteIndex: 0
  });

  world = createInitialWorld({ seed, mapSize, mapData, totalPlayers, playerDistrict });

  uiState.focusedAreaId = 1;
  uiState.phase = "needs_action";
  uiState.movesUsed = 0;
  uiState.dayEvents = [];

  saveToLocal(world);
  renderGame();
}

function renderGame(){
  root.innerHTML = `
    <div class="app">
      <aside class="panel">
        <div class="h1" style="margin:0;">Arena</div>
        <div class="muted small">Day <span id="day"></span> • Seed <span id="seed"></span></div>

        <div class="section">
          <div id="banner" class="banner">—</div>
          <div class="row" style="margin-top:10px;">
            <button id="mainBtn" class="btn primary" style="width:100%; padding:12px 14px;">—</button>
          </div>
          <div class="muted small" style="margin-top:6px;">
            Movimentos restantes hoje: <span id="movesLeft"></span>
          </div>
        </div>

        <div class="section">
          <div class="muted">Focused area</div>
          <div class="row" style="margin-top:6px;">
            <span class="pill"><span class="swatch" id="swatch"></span><span id="title">—</span></span>
            <span class="pill" id="visitedCount">Visited: —</span>
          </div>

          <div class="muted" style="margin-top:10px;">Occupants</div>
          <div id="occupants" class="list"></div>

          <div class="kv">
            <div>Area</div><div id="infoNum">—</div>
            <div>Biome</div><div id="infoBiome">—</div>
            <div>Water</div><div id="infoWater">—</div>
            <div>Visited</div><div id="infoVisited">—</div>
            <div>Phase</div><div id="infoPhase">—</div>
          </div>
        </div>

        <div class="section">
          <div class="muted">Tools</div>
          <div class="row" style="margin-top:8px;">
            <button id="regen" class="btn">New map</button>
            <button id="restart" class="btn">Restart</button>
          </div>
          <div class="row" style="margin-top:8px;">
            <button id="saveLocal" class="btn">Save</button>
            <button id="export" class="btn">Export JSON</button>
            <label class="btn" style="display:inline-flex; align-items:center; gap:8px;">
              Import <input id="import" type="file" accept="application/json" style="display:none" />
            </label>
            <button id="clearLocal" class="btn">Clear save</button>
          </div>
        </div>
      </aside>

      <main class="canvasWrap">
        <canvas id="c" width="820" height="820"></canvas>
        <div class="hint">Cornucopia is Area 1 • Clique nas áreas adjacentes durante a exploração</div>
      </main>

      <aside class="panel">
        <div class="h1" style="margin:0;">You</div>
        <div class="muted small"><span id="youDistrict">—</span></div>

        <div class="row" style="margin-top:10px;">
          <span class="pill">HP <span id="youHP" style="font-family:var(--mono);">—</span></span>
          <span class="pill">FP <span id="youFP" style="font-family:var(--mono);">—</span></span>
          <span class="pill">Kills <span id="youKills" style="font-family:var(--mono);">—</span></span>
        </div>

        <div class="kv" style="margin-top:10px;">
          <div>Visited areas</div><div id="youVisited">—</div>
          <div>Moves/day</div><div id="youSteps">3</div>
          <div>Inventory</div><div class="muted">Soon</div>
        </div>
      </aside>
    </div>
  `;

  const dayEl = document.getElementById("day");
  const seedEl = document.getElementById("seed");

  const bannerEl = document.getElementById("banner");
  const mainBtn = document.getElementById("mainBtn");
  const movesLeftEl = document.getElementById("movesLeft");

  const swatch = document.getElementById("swatch");
  const title = document.getElementById("title");
  const visitedCount = document.getElementById("visitedCount");
  const occupantsEl = document.getElementById("occupants");

  const infoNum = document.getElementById("infoNum");
  const infoBiome = document.getElementById("infoBiome");
  const infoWater = document.getElementById("infoWater");
  const infoVisited = document.getElementById("infoVisited");
  const infoPhase = document.getElementById("infoPhase");

  const youDistrict = document.getElementById("youDistrict");
  const youHP = document.getElementById("youHP");
  const youFP = document.getElementById("youFP");
  const youKills = document.getElementById("youKills");
  const youVisited = document.getElementById("youVisited");

  const canvas = document.getElementById("c");
  const mapUI = new MapUI({
    canvas,
    getCurrentAreaId: () => world?.entities?.player?.areaId ?? 1,
    onAreaClick: (id) => {
      uiState.focusedAreaId = id;
      handleAreaClick(id);
      sync();
    }
  });

  function handleAreaClick(id){
    if(!world) return;

    // Always allow inspecting focus. Movement only in explore.
    if(uiState.phase !== "explore") return;

    const cur = world.entities.player.areaId;
    if(id === cur) return;

    if(uiState.movesUsed >= MAX_MOVES_PER_DAY) return;

    const res = moveActorOneStep(world, "player", id);
    if(!res.ok) return;

    uiState.movesUsed += 1;
    uiState.dayEvents.push(...res.events);

    // reveal the destination immediately (spec: unlocking/revealing on click)
    saveToLocal(world);
  }

  function resetDayState(){
    uiState.phase = "needs_action";
    uiState.movesUsed = 0;
    uiState.dayEvents = [];
  }

  function sync(){
    if(!world) return;

    dayEl.textContent = String(world.meta.day);
    seedEl.textContent = String(world.meta.seed);

    const p = world.entities.player;

    const dInfo = DISTRICT_INFO[p.district] || {};
    youDistrict.textContent = `${districtTag(p.district)} • ${dInfo.name || ""}`;
    youHP.textContent = String(p.hp ?? 100);
    youFP.textContent = String(p.fp ?? 70);
    youKills.textContent = String(p.kills ?? 0);
    youVisited.textContent = String(world.flags.visitedAreas.length);

    visitedCount.textContent = `Visited: ${world.flags.visitedAreas.length}`;

    const movesLeft = Math.max(0, MAX_MOVES_PER_DAY - uiState.movesUsed);
    movesLeftEl.textContent = String(movesLeft);

    if(uiState.phase === "needs_action"){
      bannerEl.textContent = "Você deve fazer uma ação nesta área antes de se mover para a próxima.";
      mainBtn.textContent = "Commit Action";
    } else {
      bannerEl.textContent = "Você sobreviveu mais um dia. Escolha uma nova área para ir.";
      mainBtn.textContent = "End Day";
    }

    const focus = uiState.focusedAreaId;
    const a = world.map.areasById[String(focus)];
    const visited = world.flags.visitedAreas.includes(focus);

    title.textContent = (focus === 1) ? `Area 1 (🏺 Cornucopia)` : `Area ${focus}`;
    swatch.style.background = (visited ? (a?.color || "#2a2f3a") : "#2a2f3a");

    infoNum.textContent = String(focus);
    infoBiome.textContent = visited ? (a?.biome || "—") : "Unknown";
    infoWater.textContent = visited ? ((a?.hasWater) ? "Yes" : "No") : "Unknown";
    infoVisited.textContent = visited ? "Yes" : "No";
    infoPhase.textContent = uiState.phase;

    // Occupants: reveal if visited OR your current area
    const reveal = visited || (focus === p.areaId);
    const occ = [];
    if(reveal){
      if(p.areaId === focus) occ.push({ name: "You", district: p.district, id: "player" });
      for(const npc of Object.values(world.entities.npcs)){
        if(npc.areaId === focus && (npc.hp ?? 0) > 0) occ.push({ name: npc.name, district: npc.district, id: npc.id });
      }
    }

    occupantsEl.innerHTML = occ.length
      ? occ.map(o => `<div class="pill"><strong>${escapeHtml(o.name)}</strong><span>${escapeHtml(districtTag(o.district))}</span></div>`).join("")
      : `<div class="muted small">${reveal ? "No one here" : "Unknown"}</div>`;

    mapUI.setData({ world, paletteIndex: 0 });
    mapUI.render();

    // If player died, lock controls
    const dead = (p.hp ?? 0) <= 0;
    if(dead){
      bannerEl.textContent = "Você morreu. Reinicie o jogo.";
      mainBtn.disabled = true;
    } else {
      mainBtn.disabled = false;
    }
  }

  mainBtn.onclick = () => {
    if(!world) return;

    if(uiState.phase === "needs_action"){
      openCommitModal();
      return;
    }

    // End day
    const intents = generateNpcIntents(world);
    world = endDay(world, intents, uiState.dayEvents);

    uiState.focusedAreaId = world.entities.player.areaId;
    resetDayState();

    saveToLocal(world);
    sync();
  };

  document.getElementById("regen").onclick = () => {
    startNewGame(world.meta.mapSize, world.meta.totalPlayers || 12, world.entities.player.district || 12);
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
  sync();

  function openCommitModal(){
    const p = world.entities.player;

    const sameAreaNpcs = Object.values(world.entities.npcs).filter(n => n.areaId === p.areaId && (n.hp ?? 0) > 0);
    const canAttack = sameAreaNpcs.length > 0;

    const overlay = document.createElement("div");
    overlay.className = "modalOverlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="h1" style="margin:0;">Commit Action (Day ${world.meta.day})</div>
        <div class="muted small" style="margin-top:6px;">Escolha sua ação para hoje. Depois disso, o mapa fica ativo para você se mover (até 3 áreas adjacentes). </div>

        <div class="section">
          <div class="row">
            <button id="aAttack" class="btn" ${canAttack ? "" : "disabled"}>Atacar</button>
            <button id="aDefend" class="btn">Defender</button>
            <button id="aNothing" class="btn">Nothing</button>
          </div>

          <div class="row" style="margin-top:10px; align-items:center;">
            <label class="muted small">Alvo</label>
            <select id="target" class="select" ${canAttack ? "" : "disabled"}>
              ${sameAreaNpcs.map(n => `<option value="${n.id}">${escapeHtml(n.name)} (${districtTag(n.district)})</option>`).join("")}
            </select>
          </div>

          <div class="muted small" style="margin-top:10px;">
            ${canAttack ? "Você pode atacar alguém na sua área." : "Sem alvos válidos aqui."}
          </div>
        </div>

        <div class="row" style="margin-top:14px; justify-content:flex-end;">
          <button id="close" class="btn">Close</button>
          <button id="confirm" class="btn primary">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let actionKind = "NOTHING";

    function setSelected(){
      overlay.querySelectorAll("button").forEach(b => {
        if(b.id?.startsWith("a")) b.style.outline = "";
      });
      const id = actionKind === "ATTACK" ? "#aAttack" : actionKind === "DEFEND" ? "#aDefend" : "#aNothing";
      const btn = overlay.querySelector(id);
      if(btn) btn.style.outline = "2px solid var(--accent)";
    }

    overlay.querySelector("#close").onclick = () => overlay.remove();
    overlay.querySelector("#aAttack").onclick = () => { if(canAttack){ actionKind="ATTACK"; setSelected(); } };
    overlay.querySelector("#aDefend").onclick = () => { actionKind="DEFEND"; setSelected(); };
    overlay.querySelector("#aNothing").onclick = () => { actionKind="NOTHING"; setSelected(); };
    setSelected();

    overlay.querySelector("#confirm").onclick = () => {
      const targetId = overlay.querySelector("#target")?.value || null;

      const { nextWorld, events } = commitPlayerAction(world, {
        kind: actionKind,
        targetId: (actionKind === "ATTACK") ? targetId : null
      });

      world = nextWorld;
      uiState.dayEvents.push(...events);
      uiState.phase = "explore";
      overlay.remove();

      saveToLocal(world);
      sync();
      openResultDialog(events);
    };
  }

  function openResultDialog(events){
    const lines = formatEvents(events);

    const overlay = document.createElement("div");
    overlay.className = "modalOverlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="h1" style="margin:0;">Resultado da ação</div>
        <div class="muted small" style="margin-top:6px;">O que aconteceu:</div>

        <div class="eventList">
          ${lines.length ? lines.map(l => `<div class="eventLine">${escapeHtml(l)}</div>`).join("") : `<div class="muted small">Nada aconteceu.</div>`}
        </div>

        <div class="row" style="margin-top:14px; justify-content:flex-end;">
          <button id="ok" class="btn primary">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector("#ok").onclick = close;

    // auto-close after 5 seconds
    setTimeout(() => { if(document.body.contains(overlay)) close(); }, 5000);
  }

  function formatEvents(events){
    const p = world?.entities?.player;
    const npcName = (id) => {
      if(id === "player") return "Você";
      const n = world?.entities?.npcs?.[id];
      return n?.name || id;
    };

    const out = [];
    for(const e of (events || [])){
      if(e.type === "ATTACK"){
        if(e.ok){
          out.push(`Você atacou ${npcName(e.target)} e causou ${e.dmgDealt} de dano.`);
        } else {
          out.push("Você tentou atacar, mas não havia alvo válido.");
        }
      } else if(e.type === "DEFEND"){
        out.push("Você se defendeu.");
        if(e.note === "nothing_happened") out.push("Nada aconteceu.");
      } else if(e.type === "NOTHING"){
        out.push("Você não fez nada.");
        if(e.note) out.push("Nada aconteceu.");
      } else if(e.type === "MOVE"){
        out.push(`Você se moveu da área ${e.from} para a área ${e.to}.`);
      } else if(e.type === "DAMAGE_RECEIVED"){
        if(e.from === "hazard"){
          if(e.reducedFrom != null) out.push(`Você recebeu ${e.dmg} de dano (reduzido de ${e.reducedFrom}).`);
          else out.push(`Você recebeu ${e.dmg} de dano.`);
        } else {
          out.push(`Você recebeu ${e.dmg} de dano de ${npcName(e.from)}.`);
        }
      } else if(e.type === "DEATH"){
        if(e.who === "player") out.push("Você morreu.");
        else out.push(`${npcName(e.who)} morreu.`);
      }
    }
    return out;
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

renderStart();
