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
  selectedTarget: null,
  leftAlert: null,
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
      <!-- LEFT: gameplay (actions + entities in your current area) -->
      <aside class="panel" id="leftPanel">
        <div class="panelHeader">
          <div class="h1" style="margin:0;">Arena</div>
          <div class="muted small">Day <span id="day"></span> • Area <span id="curArea"></span></div>
        </div>

        <div id="leftAlert" class="alert hidden">—</div>

        <div id="needsAction" class="section">
          <div class="banner">
            You must perform an action in this area before moving to the next one.
          </div>

          <div class="muted" style="margin-top:12px;">Players in the area</div>
          <div id="areaPills" class="pillWrap" style="margin-top:8px;"></div>

          <div class="row" style="margin-top:12px; gap:8px; flex-wrap:wrap;">
            <button id="btnDefend" class="btn blue" style="flex:1; min-width:120px;">Defend</button>
            <button id="btnNothing" class="btn ghost" style="flex:1; min-width:120px;">Nothing</button>
            <button id="btnAttack" class="btn red hidden" style="flex:1; min-width:120px;">Attack</button>
          </div>

          <div class="muted small" style="margin-top:8px;">Moves left today: <span id="movesLeft"></span></div>
        </div>

        <div id="exploreState" class="section hidden">
          <div class="banner">
            You survived another day. You may move and then end the day.
          </div>
          <div class="row" style="margin-top:12px;">
            <button id="btnEndDay" class="btn green" style="width:100%; padding:12px 14px;">End Day</button>
          </div>
          <div class="muted small" style="margin-top:8px;">Moves left today: <span id="movesLeft2"></span></div>
        </div>
      </aside>

      <main class="canvasWrap">
        <canvas id="c" width="820" height="820"></canvas>
        <div id="areaInfo" class="areaInfo">—</div>
        <div class="hint">Cornucopia is Area 1 • Select an area to inspect • Move only after committing an action</div>
      </main>

      <!-- RIGHT: debug only -->
      <aside class="panel" id="rightPanel">
        <div class="h1" style="margin:0;">Debug</div>
        <div class="muted small">Seed <span id="seed"></span></div>

        <div class="section" style="margin-top:10px;">
          <div class="row">
            <button id="debugAdvance" class="btn">Advance day</button>
          </div>
          <div class="muted small" style="margin-top:8px;">Entities (HP + area)</div>
          <div id="debugList" class="list" style="max-height:360px; overflow:auto;"></div>
        </div>

        <div class="section">
          <div class="muted">Tools</div>
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
        </div>
      </aside>
    </div>
  `;

  const dayEl = document.getElementById("day");
  const seedEl = document.getElementById("seed");

  const curAreaEl = document.getElementById("curArea");

  const leftAlertEl = document.getElementById("leftAlert");
  const needsActionEl = document.getElementById("needsAction");
  const exploreStateEl = document.getElementById("exploreState");
  const movesLeftEl = document.getElementById("movesLeft");
  const movesLeftEl2 = document.getElementById("movesLeft2");
  const areaPillsEl = document.getElementById("areaPills");
  const btnDefend = document.getElementById("btnDefend");
  const btnNothing = document.getElementById("btnNothing");
  const btnAttack = document.getElementById("btnAttack");
  const btnEndDay = document.getElementById("btnEndDay");

  const debugList = document.getElementById("debugList");

  const areaInfoEl = document.getElementById("areaInfo");

  const canvas = document.getElementById("c");
  const mapUI = new MapUI({
    canvas,
    getCurrentAreaId: () => world?.entities?.player?.areaId ?? 1,
    canMove: () => uiState.phase === "explore",
    onAreaClick: (id) => {
      uiState.focusedAreaId = id;
      handleAreaClick(id);
      sync();
    }
  });

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

    const res = moveActorOneStep(world, "player", id);
    if(!res.ok){
      showLeftAlert("You can't move there.");
      return;
    }

    uiState.movesUsed += 1;
    uiState.dayEvents.push(...res.events);

    // reveal the destination immediately (spec: unlocking/revealing on click)
    saveToLocal(world);
  }

  function resetDayState(){
    uiState.phase = "needs_action";
    uiState.movesUsed = 0;
    uiState.dayEvents = [];
    uiState.selectedTarget = null;
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
    const here = p.areaId;
    const npcsHere = Object.values(world.entities.npcs || {}).filter(n => (n.hp ?? 0) > 0 && n.areaId === here);
    const items = [
      { id:"player", name:"You", district:p.district, selectable:false },
      ...npcsHere.map(n => ({ id:n.id, name:n.name, district:n.district, selectable:true }))
    ];

    areaPillsEl.innerHTML = items.length ? items.map(t => {
      const selected = uiState.selectedTarget === t.id;
      const cls = `playerPill ${t.selectable ? "selectable" : ""} ${selected ? "selected" : ""}`;
      return `<button class="${cls}" data-id="${escapeHtml(t.id)}" ${t.selectable ? "" : "disabled"}>
        <span class="pillName">${escapeHtml(t.name)}</span>
        <span class="pillSub">${escapeHtml(districtTag(t.district))}</span>
      </button>`;
    }).join("") : `<div class="muted small">No one here</div>`;

    // wire
    areaPillsEl.querySelectorAll(".playerPill.selectable").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        uiState.selectedTarget = id;
        btnAttack.classList.remove("hidden");
        // refresh selected style
        renderAreaPills();
      };
    });

    // show/hide attack
    if(uiState.selectedTarget && uiState.selectedTarget !== "player"){
      btnAttack.classList.remove("hidden");
    } else {
      btnAttack.classList.add("hidden");
    }
  }

  function sync(){
    if(!world) return;

    dayEl.textContent = String(world.meta.day);
    seedEl.textContent = String(world.meta.seed);

    const p = world.entities.player;

    curAreaEl.textContent = String(p.areaId);

    // Debug panel: list all tributes with HP + area.
    if(debugList){
      const rows = [];
      const everyone = [
        { id: "player", name: "You", district: p.district, hp: p.hp ?? 100, areaId: p.areaId, dead: (p.hp ?? 0) <= 0 },
        ...Object.values(world.entities.npcs || {}).map(n => ({
          id: n.id,
          name: n.name,
          district: n.district,
          hp: n.hp ?? 100,
          areaId: n.areaId,
          dead: (n.hp ?? 0) <= 0,
        }))
      ];
      everyone.sort((a,b) => (a.dead - b.dead) || (a.areaId - b.areaId) || String(a.name).localeCompare(String(b.name)));
      for(const t of everyone){
        const status = t.dead ? "DEAD" : "ALIVE";
        rows.push(
          `<div class="debugRow">
            <div class="debugName"><strong>${escapeHtml(t.name)}</strong> <span class="muted small">${escapeHtml(districtTag(t.district))}</span></div>
            <div class="debugMeta"><span class="pill">HP ${escapeHtml(String(t.hp))}</span><span class="pill">Area ${escapeHtml(String(t.areaId))}</span><span class="pill">${status}</span></div>
          </div>`
        );
      }
      debugList.innerHTML = rows.join("") || `<div class="muted small">—</div>`;
    }

    const movesLeft = Math.max(0, MAX_MOVES_PER_DAY - uiState.movesUsed);
    movesLeftEl.textContent = String(movesLeft);
    if(movesLeftEl2) movesLeftEl2.textContent = String(movesLeft);

    if(uiState.phase === "needs_action"){
      needsActionEl.classList.remove("hidden");
      exploreStateEl.classList.add("hidden");
    } else {
      needsActionEl.classList.add("hidden");
      exploreStateEl.classList.remove("hidden");
    }

    // Map overlay area info (focused area)
    const focus = uiState.focusedAreaId;
    const a = world.map.areasById[String(focus)];
    const visited = world.flags.visitedAreas.includes(focus);
    const revealed = visited || focus === p.areaId;
    const biome = revealed ? (a?.biome || "—") : "Unknown";
    const water = revealed ? ((a?.hasWater) ? "Yes" : "No") : "Unknown";
    const status = visited ? "Visited" : (revealed ? "Revealed" : "Hidden");
    areaInfoEl.innerHTML = `
      <div><strong>Area ${escapeHtml(String(focus))}</strong></div>
      <div class="muted tiny">Biome: ${escapeHtml(String(biome))}</div>
      <div class="muted tiny">Water: ${escapeHtml(String(water))}</div>
      <div class="muted tiny">Status: ${escapeHtml(String(status))}</div>
    `;

    // Left panel pills (current area occupants)
    renderAreaPills();

    // Debug list (compact)
    if(debugList){
      const everyone = [
        { id: "player", name: "You", district: p.district, hp: p.hp ?? 100, areaId: p.areaId, dead: (p.hp ?? 0) <= 0 },
        ...Object.values(world.entities.npcs || {}).map(n => ({
          id: n.id,
          name: n.name,
          district: n.district,
          hp: n.hp ?? 100,
          areaId: n.areaId,
          dead: (n.hp ?? 0) <= 0,
        }))
      ];
      everyone.sort((a,b) => (a.dead - b.dead) || (a.areaId - b.areaId) || String(a.name).localeCompare(String(b.name)));
      debugList.innerHTML = everyone.map(t => {
        const status = t.dead ? "DEAD" : "ALIVE";
        return `<div class="debugCard ${t.dead ? "dead" : ""}">
          <div class="debugTop"><strong>${escapeHtml(t.name)}</strong><span class="muted tiny">${escapeHtml(districtTag(t.district))}</span></div>
          <div class="debugBottom"><span>HP ${escapeHtml(String(t.hp))}</span><span>Area ${escapeHtml(String(t.areaId))}</span><span>${status}</span></div>
        </div>`;
      }).join("") || `<div class="muted small">—</div>`;
    }

    mapUI.setData({ world, paletteIndex: 0 });
    mapUI.render();

    // If player died, lock controls
    const dead = (p.hp ?? 0) <= 0;
    if(dead){
      showLeftAlert("You died. Restart the game.");
      btnDefend.disabled = true;
      btnNothing.disabled = true;
      btnAttack.disabled = true;
      btnEndDay.disabled = true;
    } else {
      btnDefend.disabled = false;
      btnNothing.disabled = false;
      btnAttack.disabled = false;
      btnEndDay.disabled = false;
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

  btnNothing.onclick = () => {
    if(!world) return;
    const { nextWorld, events } = commitPlayerAction(world, { kind:"NOTHING" });
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

  btnEndDay.onclick = () => {
    if(!world) return;
    const intents = generateNpcIntents(world);
    world = endDay(world, intents, uiState.dayEvents);
    uiState.focusedAreaId = world.entities.player.areaId;
    resetDayState();
    saveToLocal(world);
    sync();
    openEndDayDialog(world.log.days[world.log.days.length-1]?.events || []);
  };

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
    openEndDayDialog(world.log.days[world.log.days.length-1]?.events || []);
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
          if(e.reducedFrom != null) out.push(`Você recebeu ${e.dmg} de dano do ambiente (reduzido de ${e.reducedFrom}).`);
          else out.push(`Você recebeu ${e.dmg} de dano do ambiente.`);
        } else {
          out.push(`Você recebeu ${e.dmg} de dano de ${npcName(e.from)}.`);
        }
      } else if(e.type === "DEATH"){
        if(e.who === "player") out.push("Você morreu.");
        else out.push(`${npcName(e.who)} morreu.`);
      } else if(e.type === "ARRIVAL"){
        out.push(`${npcName(e.who)} chegou na sua área (Area ${e.to}).`);
      }
    }
    return out;
  }

  function openEndDayDialog(events){
    const pArea = world.entities.player.areaId;
    const npcName = (id) => {
      const n = world?.entities?.npcs?.[id];
      return n?.name || id;
    };

    const arrivals = (events || []).filter(e => e.type === "ARRIVAL" && e.to === pArea);
    const hereNow = Object.values(world.entities.npcs || {})
      .filter(n => (n.hp ?? 0) > 0 && n.areaId === pArea)
      .map(n => n.name);

    const overlay = document.createElement("div");
    overlay.className = "modalOverlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="h1" style="margin:0;">Fim do dia</div>
        <div class="muted small" style="margin-top:6px;">Resumo do que aconteceu enquanto o dia encerrava.</div>

        <div class="eventList" style="margin-top:12px;">
          <div class="eventLine"><strong>Sua área:</strong> Area ${pArea}</div>
          <div class="eventLine"><strong>Quem está na sua área agora:</strong> ${hereNow.length ? escapeHtml(hereNow.join(", ")) : "Ninguém"}</div>
          <div class="eventLine"><strong>Quem foi para a sua área hoje:</strong> ${arrivals.length ? escapeHtml(arrivals.map(a => npcName(a.who)).join(", ")) : "Ninguém"}</div>
        </div>

        <div class="row" style="margin-top:14px; justify-content:flex-end;">
          <button id="ok" class="btn primary">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#ok").onclick = () => overlay.remove();
    setTimeout(() => { if(document.body.contains(overlay)) overlay.remove(); }, 5000);
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
