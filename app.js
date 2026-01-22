import { MapSize, createInitialWorld } from "./state.js";
import { generateMapData } from "./mapgen.js";
import { MapUI } from "./mapui.js";
import { advanceDay } from "./sim.js";
import { saveToLocal, loadFromLocal, clearLocal, downloadJSON, uploadJSON } from "./storage.js";

const root = document.getElementById("root");

let world = null;
let paletteIndex = 0;

// UI-only planning state (does NOT mutate world)
let plannedToAreaId = null; // destination preview for today's MOVE
let plannedAction1 = "DO_NOTHING"; // ATTACK | DEFEND | DO_NOTHING
let plannedAction2 = "STAY";       // MOVE | STAY

function renderStart(){
  root.innerHTML = `
    <div class="screen">
      <div class="card">
        <div class="h1">Arena</div>
        <div class="muted">Escolha o tamanho do mapa e entre na arena. O motor roda por dias e é determinístico por seed.</div>
        <hr class="sep" />
        <div class="row">
          <label class="muted">Tamanho</label>
          <select id="size" class="select">
            <option value="${MapSize.SMALL}">Pequena (24 áreas)</option>
            <option value="${MapSize.MEDIUM}" selected>Média (48 áreas)</option>
            <option value="${MapSize.LARGE}">Grande (72 áreas)</option>
          </select>
          <button id="enter" class="btn">Entrar na arena</button>
          <button id="resume" class="btn">Continuar save</button>
        </div>
        <div class="muted small" style="margin-top:10px;">
          Dica: rode em servidor local (ex: <code>python -m http.server</code>).
        </div>
      </div>
    </div>
  `;

  document.getElementById("enter").onclick = () => {
    const mapSize = Number(document.getElementById("size").value);
    startNewGame(mapSize);
  };

  document.getElementById("resume").onclick = () => {
    const saved = loadFromLocal();
    if(!saved){
      alert("Nenhum save encontrado.");
      return;
    }
    world = saved;
    renderGame();
  };
}

function startNewGame(mapSize){
  const seed = (Math.random() * 1e9) | 0;
  const mapData = generateMapData({
    seed,
    regions: mapSize,
    width: 820,
    height: 820,
    paletteIndex
  });

  world = createInitialWorld({ seed, mapSize, mapData, npcCount: 6 });
  saveToLocal(world);
  renderGame();
}

function renderGame(){
  root.innerHTML = `
    <div class="app">
      <aside class="panel">
        <div class="row" style="justify-content:space-between;">
          <div>
            <div class="h1" style="margin:0;">Area Inspector</div>
            <div class="muted small">Dia: <span id="day"></span> • Seed: <span id="seed"></span></div>
          </div>
        </div>

        <div class="row">
          <button id="nextDay" class="btn">Planejar e encerrar o dia</button>
          <button id="regen" class="btn">Novo mapa</button>
          <button id="resetProgress" class="btn">Reiniciar progresso</button>
        </div>

        <div class="pill" id="plannedPill">Plano do dia: —</div>

        <div class="row">
          <button id="saveLocal" class="btn">Salvar</button>
          <button id="export" class="btn">Export JSON</button>
          <label class="btn" style="display:inline-flex; align-items:center; gap:8px;">
            Import JSON <input id="import" type="file" accept="application/json" style="display:none" />
          </label>
          <button id="clearLocal" class="btn">Apagar save</button>
        </div>

        <div class="row">
          <span class="pill"><span class="swatch" id="swatch"></span><span id="title">—</span></span>
          <span class="pill" id="visitedCount">Visitadas: —</span>
        </div>

        <div class="kv">
          <div>Número</div><div id="infoNum">—</div>
          <div>Bioma</div><div id="infoBiome">—</div>
          <div>Cor</div><div id="infoColor">—</div>
          <div>Água</div><div id="infoWater">—</div>
          <div>Visitada</div><div id="infoVisited">—</div>
          <div>Visitável</div><div id="infoVisit">—</div>
        </div>

        <div class="muted">Notas</div>
        <textarea id="notes" placeholder="Depois você pode anexar infos por área."></textarea>

        <div class="muted small">Atalho: [1] muda paleta (placeholder)</div>
      </aside>

      <main class="canvasWrap">
        <canvas id="c" width="820" height="820"></canvas>
        <div class="hint">Mapa = UI • Simulação por dias • Água = lago/pântano/rios</div>
      </main>
    </div>

    <div id="dayModal" class="modalOverlay">
      <div class="modal">
        <div class="h1">Decisão do Dia</div>
        <div class="muted small">Escolha 2 ações fixas na ordem: Ação 1 (Ataque/Proteção) e Ação 2 (Mover/Permanecer).</div>
        <div class="modalGrid">
          <label for="action1">Ação 1</label>
          <select id="action1" class="select">
            <option value="ATTACK">Atacar</option>
            <option value="DEFEND">Proteger (Escudo)</option>
            <option value="DO_NOTHING">Não fazer nada</option>
          </select>

          <label for="action2">Ação 2</label>
          <select id="action2" class="select">
            <option value="STAY">Permanecer</option>
            <option value="MOVE">Mover</option>
          </select>

          <label>Destino</label>
          <div class="muted" id="plannedDestination">—</div>
        </div>

        <div class="modalFooter">
          <button id="cancelDay" class="btn">Cancelar</button>
          <button id="confirmDay" class="btn">Confirmar e avançar</button>
        </div>
      </div>
    </div>
  `;

  const dayEl = document.getElementById("day");
  const seedEl = document.getElementById("seed");
  const swatch = document.getElementById("swatch");
  const title = document.getElementById("title");
  const visitedCount = document.getElementById("visitedCount");
  const plannedPill = document.getElementById("plannedPill");
  const infoNum = document.getElementById("infoNum");
  const infoBiome = document.getElementById("infoBiome");
  const infoColor = document.getElementById("infoColor");
  const infoWater = document.getElementById("infoWater");
  const infoVisited = document.getElementById("infoVisited");
  const infoVisit = document.getElementById("infoVisit");

  const canvas = document.getElementById("c");
  const mapUI = new MapUI({
    canvas,
    onAreaClick: (id) => {
      // clicar sempre mostra info; só PLANEJA move se for visitável
      const cur = world.entities.player.areaId;
      const adj = world.map.adjById[String(cur)] || [];
      const canMove = (id === cur) || adj.includes(id);

      setFocus(id);

      if (canMove){
        plannedToAreaId = id;
        plannedAction2 = (id === cur) ? "STAY" : "MOVE";
        sync(); // UI only
      }
    }
  });

  function ensureReplaySlot(w){
    while(w.replay.playerActionsByDay.length < w.meta.day){
      w.replay.playerActionsByDay.push([]);
    }
  }

  let focusedId = world.entities.player.areaId;

  function setFocus(id){
    focusedId = id;
    const info = mapUI.getAreaInfo(id);
    if(!info) return;

    title.textContent = (info.id === 1) ? `Área ${info.id} (🍞)` : `Área ${info.id}`;
    swatch.style.background = info.color;
    infoNum.textContent = String(info.id);
    infoBiome.textContent = info.biome;
    infoColor.textContent = info.color;
    infoWater.textContent = info.hasWater ? "Sim" : "Não";
    infoVisited.textContent = info.visited ? "Sim" : "Não";
    infoVisit.textContent = info.visitable ? "Sim (adjacente)" : "Não";
  }

  function sync(){
    dayEl.textContent = String(world.meta.day);
    seedEl.textContent = String(world.meta.seed);
    visitedCount.textContent = `Visitadas: ${world.flags.visitedAreas.length}`;
    mapUI.setData({ world, paletteIndex, ui: { plannedToAreaId } });
    setFocus(focusedId);

    const cur = world.entities.player.areaId;
    const destText = (plannedToAreaId == null)
      ? "—"
      : (plannedToAreaId === cur ? `Permanecer (Área ${cur})` : `Mover para Área ${plannedToAreaId}`);
    plannedPill.textContent = `Plano do dia: A1=${plannedAction1} • A2=${plannedAction2} • ${destText}`;
  }

  // Buttons
  document.getElementById("nextDay").onclick = () => {
    openDayModal();
  };

  const dayModal = document.getElementById("dayModal");
  const action1Select = document.getElementById("action1");
  const action2Select = document.getElementById("action2");
  const plannedDestination = document.getElementById("plannedDestination");

  function openDayModal(){
    action1Select.value = plannedAction1;
    action2Select.value = plannedAction2;
    const cur = world.entities.player.areaId;
    plannedDestination.textContent = (plannedToAreaId == null)
      ? "Nenhum destino selecionado no mapa"
      : (plannedToAreaId === cur ? `Área ${cur} (permanecer)` : `Área ${plannedToAreaId}`);
    dayModal.classList.add("show");
  }

  function closeDayModal(){
    dayModal.classList.remove("show");
  }

  action1Select.onchange = (e) => { plannedAction1 = e.target.value; sync(); };
  action2Select.onchange = (e) => { plannedAction2 = e.target.value; sync(); };

  document.getElementById("cancelDay").onclick = () => closeDayModal();

  document.getElementById("confirmDay").onclick = () => {
    // Build PlayerAction[] for today ONLY when confirmed
    const actions = [];

    // Ação 1
    if (plannedAction1 === "ATTACK"){
      // placeholder: no target selection yet
      actions.push({ type: "ATTACK", payload: {} });
    } else if (plannedAction1 === "DEFEND"){
      actions.push({ type: "DEFEND", payload: {} });
    } else {
      actions.push({ type: "DO_NOTHING", payload: {} });
    }

    // Ação 2
    if (plannedAction2 === "MOVE"){
      const cur = world.entities.player.areaId;
      const to = (plannedToAreaId == null) ? cur : plannedToAreaId;
      actions.push({ type: "MOVE", payload: { toAreaId: to } });
    } else {
      actions.push({ type: "STAY", payload: {} });
    }

    ensureReplaySlot(world);
    world.replay.playerActionsByDay[world.meta.day - 1] = actions;

    const { nextWorld } = advanceDay(world, actions);
    world = nextWorld;

    // reset planning for next day (UI only)
    plannedToAreaId = null;
    plannedAction1 = "DO_NOTHING";
    plannedAction2 = "STAY";

    saveToLocal(world);
    closeDayModal();
    sync();
  };

  document.getElementById("regen").onclick = () => {
    // novo mapa (mantém meta/day? aqui vou resetar jogo)
    startNewGame(world.meta.mapSize);
  };

  document.getElementById("resetProgress").onclick = () => {
    world.flags.visitedAreas = [1];
    world.entities.player.areaId = 1;
    focusedId = 1;
    saveToLocal(world);
    sync();
  };

  document.getElementById("saveLocal").onclick = () => {
    saveToLocal(world);
    alert("Salvo no navegador.");
  };

  document.getElementById("export").onclick = () => downloadJSON(world);

  document.getElementById("import").onchange = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    try{
      const loaded = await uploadJSON(file);
      world = loaded;
      saveToLocal(world);
      renderGame(); // re-render inteira
    } catch(err){
      alert(err.message || "Falha ao importar.");
    }
  };

  document.getElementById("clearLocal").onclick = () => {
    clearLocal();
    alert("Save apagado.");
  };

  // Palette shortcut placeholder
  window.onkeydown = (e) => {
    if (e.key === "1"){
      paletteIndex = 0;
      sync();
    }
  };

  sync();
}

renderStart();
