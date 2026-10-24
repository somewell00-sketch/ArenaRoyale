/* ---------- live trials: Zevil Island day by day, the Final bout by bout, while an apprentice is in them ---------- */
// the trial is simulated on a copy with the calls made so far; only what has "happened" is shown; the last call commits it for real
const liveKind = ph => ph && ph.zevil ? 'zevil' : ph && ph.final ? 'final' : null;
const liveWanted = () => !!(S && !S.finished && !S.live && !MENTOR.off && S.started && liveKind(PHASES[S.phase]) && mtHere().some(({c}) => c.status === 'Active'));
function liveStart(){ S.live = {p: S.phase, kind: liveKind(PHASES[S.phase]), st: {}, day: 0, ids: mtHere().filter(({c}) => c.status === 'Active').map(({c}) => c.id)}; LIVEP = null; }
let LIVEP = null, LIVE_CAP = null;
function liveApply(T, L){ Object.entries(L.st || {}).forEach(([id, arr]) => { const c = T.candidates.find(x => x.id === id); if(!c) return; if(L.kind === 'zevil') c.zSt = arr.slice(); else c.fSt = arr.slice(); }); }
function livePreview(){
  const key = JSON.stringify(S.live) + ':' + S.log.length + ':' + S.edition;
  if(LIVEP && LIVEP.key === key) return LIVEP;
  const R0 = {S, MENTOR, SCOUT}, L = S.live, C = JSON.parse(JSON.stringify({S, MENTOR, SCOUT}));
  let P = null;
  try { S = C.S; MENTOR = C.MENTOR; SCOUT = C.SCOUT; delete S.live; liveApply(S, L); MT_AUTO = true; mtBefore(); runPhase(S); const q = lastDone(); if(q !== null) mtAfter(q); P = {S, MENTOR, SCOUT}; }
  finally { MT_AUTO = false; S = R0.S; MENTOR = R0.MENTOR; SCOUT = R0.SCOUT; }
  LIVEP = {key, ...P}; return LIVEP;
}
// zevil: who is still deciding on the island, and where things stood at the end of the day just shown
function liveZ(){ const P = livePreview(), Z = P.S.zevil, d = S.live.day, snap = Z && Z.days[Math.min(d, Z.days.length - 1)]; return {P, Z, snap, d}; }
const liveZPts = (Z, snap, id) => (snap.hold[id] || []).reduce((s, b) => s + (b === id || b === Z.targets[id] ? 3 : 1), 0);
function liveZWho(){ const {Z, snap} = liveZ(); if(!Z || !snap) return []; return S.live.ids.filter(id => Z.ids.includes(id) && !(snap.gone || {})[id]); }
// final: the earliest bout of yours that has no call yet
function liveGate(){
  const P = livePreview(), B = P.S.bracket; if(!B) return null;
  const all = [].concat(B.prelim, B.rounds.flat(), ...(B.groups || []).map(g => g.rounds.flat())).filter(m => m && m.a && m.b && !m.examiner && !m.bye).sort((x, y) => x.seq - y.seq);
  const seen = {};
  for(const m of all) for(const id of [m.a, m.b]){ if(!S.live.ids.includes(id)) continue; const n = seen[id] = (seen[id] || 0) + 1; if((S.live.st[id] || [])[n - 1] == null) return {m, id, n, opp: id === m.a ? m.b : m.a, P}; }
  return null;
}
const ZOPT = [{k: 'hunt', l: 'Hunt your target'}, {k: 'ambush', l: 'Ambush anyone'}, {k: 'hide', l: 'Lie low and guard'}, {k: 'ally', l: 'Look for allies'}, {k: 'revenge', l: 'Go after the thief'}];
const FOPT = [{k: 'allout', l: 'All out from the bell'}, {k: 'read', l: 'Read them first'}, {k: 'wear', l: 'Wear them down'}, {k: 'careful', l: 'Stay careful'}, {k: 'concede', l: 'Concede, save strength'}];
function liveZDefault(c, pts, ownGone){ const l = mtLean(c); if(pts >= 6) return l === 'kind' ? 'ally' : 'hide'; if(ownGone && l === 'bold') return 'revenge'; return l === 'bold' ? 'ambush' : l === 'kind' ? 'ally' : 'hunt'; }
const liveFDefault = c => ({bold: 'allout', safe: 'careful', kind: 'wear', sly: 'read'})[mtLean(c)] || 'read';
// the box in the apprentice's row: today's call on the island, or the next bout
function liveBoxHtml(a, c){
  const L = S.live; if(!L || !L.ids.includes(c.id)) return '';
  const opt = (k, l, def, mine, id) => `<button type="button" class="${mine === k ? 'on' : !mine && def === k ? 'def' : ''}" data-live="${id}" data-k="${k}">${esc(l)}</button>`;
  const F = c.first || c.name;
  if(L.kind === 'zevil'){
    const {Z, snap, d, P} = liveZ(); if(!Z || !snap || d >= 7) return '';
    if((snap.gone || {})[c.id]) return '';
    const pts = liveZPts(Z, snap, c.id), id = c.id, tg = Z.targets[id], hold = snap.hold, cm = cmap(P.S);
    const owner = b => Object.keys(hold).find(k => (hold[k] || []).includes(b)), tOwner = owner(tg), thief = owner(id) !== id ? owner(id) : null;
    const hunters = Object.keys(Z.targets).filter(k => Z.targets[k] === id && k !== id && !(snap.gone || {})[k] && !(hold[k] || []).includes(id)).length;
    const r = mtRng('lz' + d + id), truth = r() < 0.8, rumorOwner = truth ? tOwner : Object.keys(hold)[Math.floor(r() * Object.keys(hold).length)];
    const hints = pts >= 6 ? [{t: 'Points', s: `Six points: safe, if ${PR(c).they} can keep them.`}] : [];
    if(tOwner === id) hints.push({t: 'Target', s: `${F} already holds the target badge.`});
    else if(rumorOwner && cm[rumorOwner]) hints.push({t: 'Rumour', s: `Word is badge #${(cm[tg] || {}).reg} is with ${cm[rumorOwner].first}.`});
    if(thief && cm[thief]) hints.push({t: 'Danger', s: `${cm[thief].first} has ${F}'s own badge.`}); else if(hunters) hints.push({t: 'Danger', s: `Someone on the island is hunting for ${F}'s badge.`});
    const mine = (L.st[id] || [])[d + 1], def = liveZDefault(c, pts, !!thief);
    if(mine && !LIVE_EDIT.has(id)) return `<div class="mt-dpanel in mt-ap mt-live set mt-folded" data-biome="${biomeOf(PHASES[S.phase].id)}"><span class="mt-lab">◆ ${esc(F)}<span class="mt-stamp">Day ${d + 1} · morning</span></span><b class="mt-fcall">${esc((ZOPT.find(o => o.k === mine) || {}).l || mine)} ✓</b><button type="button" class="sc-link" data-liveedit="${id}">Change</button></div>`;
    const opts = ZOPT.filter(o => o.k !== 'revenge' || thief);
    // the badges on them right now: own and target slots always, dashed when missing; any others after
    const H = hold[id] || [], rg = b => (cm[b] || {}).reg, bd = (b, k, t) => `<span class="bdg ${k}${H.includes(b) ? '' : ' miss'}" title="${t}">${rg(b)}</span>`;
    const zb = `<span class="mt-zb">${bd(id, 'own', H.includes(id) ? 'Own badge · 3 pts' : thief && cm[thief] ? 'Own badge, taken by ' + cm[thief].first : 'Own badge, lost')}${tg ? bd(tg, 'tgt', H.includes(tg) ? 'Target badge · 3 pts' : 'Target badge, not yet') : ''}${H.filter(b => b !== id && b !== tg).map(b => `<span class="bdg any" title="Badge · 1 pt">${rg(b)}</span>`).join('')}<b class="mt-zp">${pts}/6</b></span>`;
    return `<div class="mt-dpanel in mt-ap mt-live${mine ? ' set' : ''}" data-biome="${biomeOf(PHASES[S.phase].id)}"><div class="mt-dtop"><span class="mt-lab">◆ ${esc(c.first || c.name)}<span class="mt-stamp">Day ${d + 1} · morning</span></span>${zb}</div>
      <ul class="mt-hints">${hints.map(h => `<li><i class="t-${h.t.toLowerCase()}">${h.t}</i><span>${esc(h.s)}</span></li>`).join('')}</ul>
      <div class="mt-dopts">${opts.map(o => opt(o.k, o.l, def, mine, id)).join('')}</div>
      <div class="mt-dfoot"><span>${mine ? mtCallFoot() : 'No call yet: going by instinct.'}</span></div></div>`;
  }
  const g = liveGate(); if(!g || g.id !== c.id) return '';
  const cm = cmap(g.P.S), o = cm[g.opp], m = g.m; if(!o) return '';
  const sty = x => ['strength', 'agility', 'strategy', 'combat', 'determination'].sort((p, q) => x.a[q] - x.a[p])[0];
  const prev = [].concat(g.P.S.bracket.prelim, g.P.S.bracket.rounds.flat()).filter(x => x && x.seq < m.seq && (x.a === o.id || x.b === o.id) && x.w).pop();
  const root = !!m.root, prelim = m.id.startsWith('P');
  const hints = [{t: 'Opponent', s: `${o.first} ${BOUT_STYLE[sty(o)][1]}.`}];
  if(prev) hints.push({t: 'Form', s: prev.w === o.id ? `${o.first} won ${PR(o).their} last bout by ${prev.how}.` : `${o.first} lost ${PR(o).their} last bout, by ${prev.how}.`});
  if(c.injury) hints.push({t: 'Danger', s: `${F} is carrying a ${c.injury.w}.`});
  hints.push({t: 'Stakes', s: root ? 'Lose this one and there is no next round.' : prelim ? 'The loser of this bout goes home.' : 'Lose, and you fight again.'});
  const mine = ((L.st[c.id] || [])[g.n - 1]), def = liveFDefault(c);
  const opts = FOPT.filter(x => x.k !== 'concede' || (!root && !prelim));
  return `<div class="mt-dpanel in mt-ap mt-live${mine ? ' set' : ''}" data-biome="${biomeOf(PHASES[S.phase].id)}"><div class="mt-dtop"><span class="mt-lab">◆ ${esc(c.first || c.name)} <span class="mt-vs">vs ${esc(o.name)}</span></span><span class="mt-stamp">Bout ${g.n} · ${root ? 'last match' : prelim ? 'preliminary' : 'round ' + m.round}</span></div>
    <ul class="mt-hints">${hints.map(h => `<li><i class="t-${h.t.toLowerCase()}">${h.t}</i><span>${esc(h.s)}</span></li>`).join('')}</ul>
    <div class="mt-dopts">${opts.map(x => opt(x.k, x.l, def, mine, c.id)).join('')}</div>
    <div class="mt-dfoot"><span>No call yet: going by instinct.</span></div></div>`;
}
// a call made: record it; when everyone on the island has one, the day happens; when no bout is waiting, the final is played for real
// a call keeps the page where it is and moves you to the next one; only a day that runs turns the page
let LIVE_EDIT = new Set();
function liveFocusNext(){
  requestAnimationFrame(() => {
    const mob = matchMedia('(max-width:760px)').matches, root = mob ? $('mtDrawer') : $('pane-phase'); if(!root) return;
    const nx = root.querySelector('.mt-live:not(.set)'), done = root.querySelector('.mt-squad');
    const tgt = nx || done; if(!tgt) return;
    tgt.classList.remove('just'); void tgt.offsetWidth; tgt.classList.add('just');
    const sm = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if(mob){ const body = root.querySelector('.md-body'); if(body){ const y = tgt.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8; body.scrollTo({top: Math.max(0, y), behavior: sm}); } return; }
    const r = tgt.getBoundingClientRect(); if(r.top < 70 || r.top > innerHeight * 0.55) window.scrollTo({top: Math.max(0, r.top + scrollY - 90), behavior: sm});
  });
}
function liveStay(){ const y = scrollY, b = document.querySelector('#mtDrawer .md-body'), by = b ? b.scrollTop : 0; render(); window.scrollTo({top: y, behavior: 'instant'}); const b2 = document.querySelector('#mtDrawer .md-body'); if(b2) b2.scrollTop = by; }
function liveDecide(id, k){
  const L = S.live; if(!L) return; LIVE_EDIT.delete(id);
  if(L.kind === 'zevil'){ const arr = L.st[id] = L.st[id] || []; arr[L.day + 1] = k; LIVEP = null; save();
    if(liveZWho().every(x => (L.st[x] || [])[L.day + 1])){ liveNextDay(); if(S.live){ selPhase = L.p; save(); render(); toTrialTop(); } return; }
    selPhase = L.p; liveStay(); liveFocusNext(); return; }
  const g = liveGate(); if(!g || g.id !== id) return; const arr = L.st[id] = L.st[id] || []; arr[g.n - 1] = k; if(!liveGate()) return liveCommit();
  LIVEP = null; selPhase = L.p; save(); liveStay(); liveFocusNext();
}
function liveNextDay(){
  const L = S.live; const {Z, snap, P} = liveZ();
  liveZWho().forEach(id => { const arr = L.st[id] = L.st[id] || []; if(!arr[L.day + 1]){ const c = cmap(P.S)[id], own = Object.keys(snap.hold).find(k => (snap.hold[k] || []).includes(id)); arr[L.day + 1] = liveZDefault(c, liveZPts(Z, snap, id), own && own !== id); } });
  L.day++; LIVEP = null;
  if(L.day >= 7 || !liveZWho().length) liveCommit();
}
// Run: one more day, or the next bout on instinct
function liveStep(){
  const L = S.live; if(!L) return false;
  if(L.kind === 'zevil'){ liveNextDay(); if(S.live){ selPhase = L.p; save(); render(); toTrialTop(); } return true; }
  const g = liveGate(); if(!g) { liveCommit(); return true; }
  const arr = L.st[g.id] = L.st[g.id] || []; arr[g.n - 1] = liveFDefault(cmap(g.P.S)[g.id]); LIVEP = null;
  if(!liveGate()) liveCommit(); else { selPhase = L.p; save(); render(); toTrialTop(); }
  return true;
}
function liveCommit(quiet){
  const L = S.live; if(!L) return; const pv = livePreview(); S.live = null; LIVEP = null;
  liveApply(S, L);
  zDay = null; runFav(); S.candidates.forEach(c => { delete c.zSt; delete c.fSt; });
  try { const sig = T => JSON.stringify(T.candidates.filter(c => c.out === L.p || c.status === 'Approved').map(c => c.id + c.status).sort()); window.__liveSame = sig(pv.S) === sig(S); } catch(e){}
  if(!quiet){ selPhase = lastDone(); save(); render(); showTab('phase'); toTrialTop(); }
}
const isOpening = e => !!e && (e.sp || (e.p === 0 && /^The (Centenary|Jubilee)\. |Centennial Stars who came before/.test(e.text || '')));
const NEN_ROOT0 = generateNen;
generateNen = (S0, c, used) => {
  const base = NEN_ROOT0(S0, c, used);
  try {
    if(!base || !base.hatsu || MENTOR.appr.some(x => x.id === c.id && x.nen)) return base;
    const r = makeRng(nhash(c.id + ':root') >>> 0); if(r() > 0.6) return base;   // not everyone's Hatsu is about their past
    const roots = nenRoots(c); if(!roots.length) return base;
    for(let t = 0; t < 12; t++){
      const n = t ? NEN_ROOT0(Object.assign({}, S0, {seed: (S0.seed + t * 104729) >>> 0}), c, used) : base;
      const kw = n.hatsu.keywords || [];
      const R0 = roots.filter(x => x.words && x.words.some(w => kw.includes(w)));
      const R1 = R0.length ? R0[Math.floor(r() * R0.length)] : (t === 11 ? roots.find(x => x.src === 'nick') : null);
      if(!R1) continue;
      const w = R1.words ? R1.words.find(x => kw.includes(x)) : kw[1] || kw[0];
      n.hatsu.alias = nenRootName(R1, w, r);
      if(r() < 0.75) n.hatsu.born = pro(R1.born, c);
      if(R1.vow && r() < 0.5 && !(n.hatsu.vows || []).some(v => v.text === R1.vow)){ n.hatsu.vows = [{text: R1.vow, bonus: 14}].concat((n.hatsu.vows || []).slice(0, 1)); n.hatsu.power = Math.min(100, (n.hatsu.power || 50) + 6); }
      return n;
    }
  } catch(e){}
  return base;
};{ const _ac = allianceChance; allianceChance = (a, b, w, ctx) => { const v = _ac(a, b, w, ctx); const man = x => x.mPost && x.nen && x.nen.category === 'Manipulation'; return v > 0 && (a.mPost === 'allies' || b.mPost === 'allies') ? Math.min(0.95, v + 0.2 + (man(a) || man(b) ? 0.1 : 0)) : v > 0 && (man(a) || man(b)) ? Math.min(0.95, v + 0.1) : v > 0 && (a.mLesson === 'read' || b.mLesson === 'read') ? Math.min(0.95, v + 0.08) : v; };
  const _fr = fatalRoll; fatalRoll = (S0, rng, w, l) => { const d = _fr(S0, rng, w, l); if(l && l.mPost === 'cautious') return d && rng() < 0.5; if(l && l.mPost === 'aggressive') return d || rng() < 0.03; return d; }; }

/* ---------- dilemmas, trust and letters ---------- */
// each apprentice leans one way: kind, bold, safe or sly; choices that match their nature build trust
const MT_LEAN = {Guardian: 'kind', Charmer: 'kind', Diplomat: 'kind', Daredevil: 'bold', 'Hot-headed': 'bold', Brute: 'bold', Bruiser: 'bold', 'Show-off': 'bold', Duelist: 'bold', Schemer: 'sly', Mastermind: 'sly', Tactician: 'sly', Stoic: 'safe', Watcher: 'safe', Coward: 'safe', Bookworm: 'safe', Hermit: 'safe', 'Lone Wolf': 'bold'};
function mtLean(c){
  if(MT_LEAN[c.trait]) return MT_LEAN[c.trait];
  const a = c.a, s = {kind: a.teamwork + a.charisma, bold: a.courage + a.combat, safe: a.perception + a.intelligence, sly: a.strategy * 2 - 10};
  return Object.keys(s).sort((x, y) => s[y] - s[x])[0];
}
const mtTrust = a => a.trust == null ? 50 : a.trust;
const mtCheck = (c, keys, diff, r) => keys.reduce((s, k) => s + c.a[k], 0) / keys.length + (r() - 0.5) * 40 >= diff;
const mtOther = (c, r, f) => { const L = S.candidates.filter(o => o.status === 'Active' && o.id !== c.id && (!f || f(o))); return L.length ? L[Math.floor(r() * L.length)] : null; };
// a dilemma only shows up when its situation is real: a rival in the field, a hurt ally, a dangerous trial, a crusher on the prowl
// each situation: who speaks, one line, three answers (one careful, one that leans on a skill, one that gambles); the UI never says which is which
const R3 = (r, a) => a[Math.floor(r() * a.length)];
const MT_DILS = [
  {k: 'crusher', when: c => attemptsOf(c) <= 1 && S.candidates.some(o => o.crusher && o.status === 'Active'), who: () => ({n: 'A veteran with kind eyes', i: 'V'}),
    q: 'Here, kid. Water. You look like you need it.',
    opts: [{l: 'Drink it', lean: 'kind', run: (c, o, r) => r() < 0.5 ? {m: -8, fat: 15, say: R3(r, ['It was laced. The veteran laughed the whole way.', 'The water tasted wrong. Too late.'])} : {m: 3, say: R3(r, ['Just water, for once. A small kindness.', 'Cold, clean, and nothing else.'])}},
      {l: 'Thank him and pour it out', lean: 'safe', run: (c, o, r) => ({m: 0, say: R3(r, ['Poured it into the dirt with a smile.', 'Polite, careful, and thirsty.'])})},
      {l: 'Offer him yours instead', lean: 'sly', run: (c, o, r) => mtCheck(c, ['perception', 'charisma'], 55, r) ? {m: 3, say: R3(r, ['The veteran froze. Everyone saw why.', 'He refused his own water. Now everyone knows.'])} : {m: -2, say: 'He laughed it off. You both know.'}}]},
  {k: 'sabotage', when: (c, ph) => ['danger', 'body', 'team'].includes(mtKind(ph)), who: c => ({n: c.first, i: c.first[0], me: true}),
    q: 'Someone has been at my gear.',
    opts: [{l: 'Fix it carefully', lean: 'safe', run: (c, o, r) => ({m: -1, say: R3(r, ['Fixed every strap twice. Lost a little time.', 'Slow repairs, sure footing.'])})},
      {l: 'Swap it with someone else\'s', lean: 'sly', run: (c, o, r, p) => { const v = mtOther(c, r); return r() < 0.6 ? {m: 4, foe: v, say: `Swapped it with ${v ? v.first + "'s" : "a stranger's"}. Nobody noticed. Yet.`} : {m: -6, say: 'Caught swapping gear. The examiner is watching now.'}; }},
      {l: 'Find who did it', lean: 'bold', run: (c, o, r) => mtCheck(c, ['perception', 'intelligence'], 55, r) ? {m: 2, say: 'Found the culprit. They will think twice.'} : {m: -2, say: 'Searched for an hour. Found nothing.'}}]},
  {k: 'split', when: c => alliesOf(S, c).length > 0, o: 'ally', who: (c, o) => ({n: o.name, i: o.first[0]}),
    q: 'Trust me. We split here and meet at the end.',
    opts: [{l: 'Split up', lean: 'bold', run: (c, o, r, p) => r() < 0.55 ? {m: 3, say: R3(r, [`${o.first} kept the promise.`, 'Two routes, both open. It worked.'])} : {m: -6, leave: true, foe: o, say: `${o.first} never showed up. Of course.`}},
      {l: 'Stay together', lean: 'safe', run: (c, o, r) => ({m: 0, say: R3(r, ['Side by side, the whole way.', 'Slower together, but together.'])})},
      {l: 'Follow them quietly', lean: 'sly', run: (c, o, r) => mtCheck(c, ['perception', 'agility'], 55, r) ? {m: 3, say: `Followed ${o.first}. Learned a lot.`} : {m: -2, foe: o, say: `${o.first} noticed. Things are cold now.`}}]},
  {k: 'tired', when: c => (c.fatigue || 0) > 40, who: c => ({n: c.first, i: c.first[0], me: true}),
    q: 'I can\'t feel my legs.',
    opts: [{l: 'Rest an hour', lean: 'safe', run: (c, o, r) => ({m: -2, fat: -20, say: R3(r, ['Slept under a rock. Worth it.', 'An hour of sleep, a new person.'])})},
      {l: 'Push on', lean: 'bold', run: (c, o, r, p) => r() < 0.3 ? {m: -2, inj: true, say: 'Pushed on. The body said no.'} : {m: 3, say: R3(r, ['Pushed on, and it held.', 'Found a second wind somewhere.'])}},
      {l: 'Ask an ally to carry the pack', lean: 'kind', run: (c, o, r) => alliesOf(S, c).length && mtCheck(c, ['charisma', 'teamwork'], 50, r) ? {m: 1, fat: -10, say: 'Someone took the pack without a word.'} : {m: -1, say: 'Nobody had strength to spare.'}}]},
  {k: 'drown', when: (c, ph) => /sea|raft|wetland|river|swamp|storm/i.test(ph.id + ph.name), o: 'any', who: (c, o) => ({n: o.name, i: o.first[0]}),
    q: 'Help—!',
    opts: [{l: 'Dive in', lean: 'bold', run: (c, o, r) => mtCheck(c, ['strength', 'endurance', 'courage'], 58, r) ? {m: -1, ally: o, say: `Dragged ${o.first} out. A friend for life.`} : {m: -4, inj: true, say: 'The current took you both for a while.'}},
      {l: 'Throw a rope', lean: 'kind', run: (c, o, r) => r() < 0.65 ? {m: -1, ally: o, say: `The rope held. ${o.first} owes you now.`} : {m: -1, say: 'The rope fell short.'}},
      {l: 'Keep swimming', lean: 'safe', run: (c, o, r) => ({m: 1, say: R3(r, ["Kept swimming. Didn't look back.", 'Someone else will help. Probably.'])})}]},
  {k: 'shortcut', when: (c, ph) => ['danger', 'body'].includes(mtKind(ph)), who: () => ({n: 'A local kid', i: 'K'}),
    q: 'There\'s a way through the old tunnel. Nobody uses it any more.',
    opts: [{l: 'Take the tunnel', lean: 'bold', run: (c, o, r) => mtCheck(c, ['agility', 'perception'], 55, r) ? {m: 6, say: 'The tunnel held. Way ahead now.'} : {m: -3, inj: true, say: "The tunnel didn't hold."}},
      {l: 'Pay the kid to guide you', lean: 'sly', run: (c, o, r) => r() < 0.7 ? {m: 3, say: 'The kid knew every turn.'} : {m: -2, say: 'The kid ran off with the money.'}},
      {l: 'Stay on the road', lean: 'safe', run: () => ({m: -1, say: 'Took the long way. Arrived whole.'})}]},
  {k: 'bribe', when: (c, ph) => ['wits', 'team'].includes(mtKind(ph)), who: () => ({n: 'A man in a grey coat', i: 'G'}),
    q: 'The answers. For a favour, later.',
    opts: [{l: 'Take them', lean: 'sly', run: (c, o, r) => r() < 0.3 ? {m: -8, say: 'The examiner was watching. That cost a lot.'} : {m: 5, say: 'The answers were real. The favour can wait.'}},
      {l: 'Refuse', lean: 'kind', run: () => ({m: 0, say: 'Refused. Did it honestly.'})},
      {l: 'Take them, then report him', lean: 'bold', run: (c, o, r) => mtCheck(c, ['strategy', 'charisma'], 58, r) ? {m: 3, say: 'Reported him. The examiner nodded, once.'} : {m: -4, say: 'Nobody believed the story.'}}]},
  {k: 'rival', when: c => (c.grudges || []).some(g => S.candidates.some(o => o.id === g.id && o.status === 'Active')), o: 'rival', who: (c, o) => ({n: o.name, i: o.first[0]}),
    q: 'Remember me?',
    opts: [{l: 'Settle it now', lean: 'bold', run: (c, o, r) => mtCheck(c, ['combat', 'strength'], (o.a.combat + o.a.strength) / 2, r) ? (o.pmod = (o.pmod || 0) - 5, {m: 3, say: `Faced ${o.first} and won. ${o.first} limps away.`}) : {m: -3, inj: true, say: `${o.first} was stronger today.`}},
      {l: 'Walk away', lean: 'safe', run: () => ({m: -1, say: 'Walked away. Not today.'})},
      {l: 'Offer a truce', lean: 'kind', run: (c, o, r) => mtCheck(c, ['charisma'], 55, r) ? (c.grudges = (c.grudges || []).filter(g => g.id !== o.id), o.grudges = (o.grudges || []).filter(g => g.id !== c.id), {m: 1, ally: o, say: `${o.first} took the hand. Strange times.`}) : {m: -2, say: `${o.first} spat on the offer.`}}]},
  {k: 'hurt', when: c => alliesOf(S, c).some(o => o.injury || o.fatigue > 55), o: 'hurt', who: (c, o) => ({n: o.name, i: o.first[0]}),
    q: 'Go on without me.',
    opts: [{l: 'Carry them', lean: 'kind', run: (c, o, r) => mtCheck(c, ['endurance', 'strength'], 52, r) ? {m: -1, fat: 8, say: `Carried ${o.first} the whole way.`} : {m: -4, fat: 15, say: `Carried ${o.first} as far as the body allowed.`}},
      {l: 'Leave them', lean: 'bold', run: (c, o, r) => ({m: 3, leave: true, foe: o, say: `Left ${o.first} behind. That bridge is burned.`})},
      {l: 'Fetch a medic', lean: 'safe', run: () => ({m: -3, say: 'Found a medic. Lost a lot of time.'})}]},
  {k: 'zevil', when: (c, ph) => !!ph.zevil, who: c => ({n: c.first, i: c.first[0], me: true}), group: true,
    q: 'Three days. One target. What do I do?',
    opts: [{l: 'Hunt your target', lean: 'safe', run: (c, o, r) => mtCheck(c, ['perception', 'combat'], 58, r) ? {m: 4, say: 'Tracked the target for two days. Got it.'} : {m: -2, say: 'The target was always one step ahead.'}},
      {l: 'Ambush anyone', lean: 'bold', run: (c, o, r) => r() < 0.5 ? {m: 7, say: 'Ambushed three people. Collected plenty.'} : {m: -6, inj: true, say: 'Picked the wrong person to ambush.'}},
      {l: 'Hide and guard your badge', lean: 'sly', run: (c, o, r) => ({m: 1, fat: -10, say: 'Stayed hidden in the roots for three days.'})}]},
  {k: 'final', when: (c, ph) => !!ph.final, who: c => ({n: c.first, i: c.first[0], me: true}),
    q: 'The arena is waiting. How do I fight?',
    opts: [{l: 'All out from the bell', lean: 'bold', run: (c, o, r) => r() < 0.5 ? {m: 7, say: 'All out from the first second. It worked.'} : {m: -5, say: 'Burned out by the second round.'}},
      {l: 'Read them first', lean: 'sly', run: (c, o, r) => mtCheck(c, ['strategy', 'perception'], 58, r) ? {m: 4, say: 'Read every move before it came.'} : {m: -2, say: 'Too busy reading to fight.'}},
      {l: 'Stay careful, live to try again', lean: 'safe', run: (c, o, r) => (c.mPost = 'cautious', {m: -1, say: 'Fought carefully. Lived to tell it.'})}]},
  {k: 'examiner', when: (c, ph) => ph.ex && ['Strict', 'Cruel'].includes(ph.ex.style), who: (c, o, ph) => ({n: ph.ex.name, i: ph.ex.name[0]}),
    q: 'You. Prove you belong here.',
    opts: [{l: 'Show off', lean: 'bold', run: (c, o, r) => r() < 0.5 ? {m: 5, say: 'The examiner raised an eyebrow. A good sign.'} : {m: -5, say: 'The examiner was not impressed.'}},
      {l: 'Answer politely', lean: 'safe', run: () => ({m: 1, say: 'Polite and brief. The examiner moved on.'})},
      {l: 'Ask a sharp question back', lean: 'sly', run: (c, o, r) => mtCheck(c, ['intelligence', 'charisma'], 58, r) ? {m: 3, say: 'The examiner smiled. Nobody has seen that before.'} : {m: -2, say: 'The examiner wrote something down. Not good.'}}]},
  {k: 'crowd', when: (c, ph) => mtKind(ph) === 'body' && S.candidates.filter(o => o.status === 'Active').length > 200, who: c => ({n: c.first, i: c.first[0], me: true}),
    q: 'There are too many people on this path.',
    opts: [{l: 'Elbow through', lean: 'bold', run: (c, o, r) => { const v = mtOther(c, r); return r() < 0.55 ? {m: 4, foe: v, say: `Shoved ${v ? v.first : 'someone'} aside. Made enemies, and time.`} : {m: -3, inj: true, say: 'Elbowed the wrong person.'}; }},
      {l: 'Go around', lean: 'safe', run: () => ({m: -1, say: 'Took the outer edge. Quiet, slow.'})},
      {l: 'Ride someone\'s slipstream', lean: 'sly', run: (c, o, r) => mtCheck(c, ['agility', 'speed'], 55, r) ? {m: 3, say: 'Stuck behind the fastest runner. Free speed.'} : {m: -1, say: 'Lost the runner in the crowd.'}}]},
  {k: 'lost', when: (c, ph) => ['danger', 'wits'].includes(mtKind(ph)), who: c => ({n: c.first, i: c.first[0], me: true}),
    q: 'The map makes no sense.',
    opts: [{l: 'Trust your gut', lean: 'bold', run: (c, o, r) => r() < 0.5 ? {m: 5, say: 'The gut was right.'} : {m: -4, say: 'The gut was very, very wrong.'}},
      {l: 'Go back and start over', lean: 'safe', run: () => ({m: -2, say: 'Backtracked to the start. Then got it right.'})},
      {l: 'Climb up and look', lean: 'sly', run: (c, o, r) => mtCheck(c, ['perception', 'agility'], 55, r) ? {m: 3, say: 'From the treetop, everything made sense.'} : {m: -2, inj: true, say: 'The branch broke.'}}]},
  {k: 'team', when: c => !alliesOf(S, c).length && S.candidates.filter(o => o.status === 'Active').length > 10, o: 'any', who: (c, o) => ({n: o.name, i: o.first[0]}),
    q: 'Team up? Two is better than one.',
    opts: [{l: 'Yes', lean: 'kind', run: (c, o, r) => ({m: 1, ally: o, say: `${o.first} and you, then.`})},
      {l: 'No thanks', lean: 'safe', run: () => ({m: 0, say: 'Alone is simpler.'})},
      {l: 'Yes, and use them', lean: 'sly', run: (c, o, r) => r() < 0.6 ? {m: 4, ally: o, say: `${o.first} does all the heavy lifting. Without knowing it.`} : {m: -3, foe: o, say: `${o.first} figured it out fast.`}}]},
  {k: 'berries', when: (c, ph) => ['body', 'danger'].includes(mtKind(ph)) && (c.fatigue || 0) > 20, who: c => ({n: c.first, i: c.first[0], me: true}),
    q: 'Found some berries. Probably edible.',
    opts: [{l: 'Eat them', lean: 'bold', run: (c, o, r) => r() < 0.55 ? {m: 2, fat: -15, say: 'Sweet, and exactly what the body needed.'} : {m: -5, fat: 10, say: 'Not edible. Definitely not edible.'}},
      {l: 'Share them around', lean: 'kind', run: (c, o, r) => { const v = mtOther(c, r); return {m: 0, fat: -5, ally: r() < 0.5 ? v : null, say: v ? `Shared them with ${v.first}. A friendly face now.` : 'Shared them around. Everyone survived.'}; }},
      {l: 'Leave them', lean: 'safe', run: () => ({m: 0, say: 'Left the berries for the birds.'})}]},
  {k: 'night', when: (c, ph) => ['body', 'danger'].includes(mtKind(ph)), who: c => ({n: c.first, i: c.first[0], me: true}),
    q: 'Something is moving out there in the dark.',
    opts: [{l: 'Go and look', lean: 'bold', run: (c, o, r) => r() < 0.5 ? {m: 4, say: 'Only a lost candidate. Who now owes a favour.'} : {m: -4, inj: true, say: 'It was not a candidate.'}},
      {l: 'Keep watch till dawn', lean: 'safe', run: () => ({m: -1, fat: 6, say: 'Watched the dark all night. Nothing came.'})},
      {l: 'Wake an ally', lean: 'kind', run: (c, o, r) => alliesOf(S, c).length ? {m: 2, say: 'Two pairs of eyes. Nothing dared come close.'} : {m: -1, say: 'Nobody to wake. A long night.'}}]},
  {k: 'lodge', when: c => mtHere().filter(x => x.c.status === 'Active').length >= 2, group: true, who: c => ({n: 'Your apprentices', i: '◆'}),
    q: 'Do we stick together or split up?',
    opts: [{l: 'Stick together', lean: 'kind', run: () => ({m: 1, say: 'The lodge moves as one.'})},
      {l: 'Split to cover more ground', lean: 'bold', run: (c, o, r) => r() < 0.5 ? {m: 4, say: 'Split up, covered everything.'} : {m: -3, say: 'Split up, and missed each other when it mattered.'}},
      {l: 'Let the strongest lead', lean: 'safe', run: (c, o, r) => mtCheck(c, ['teamwork'], 50, r) ? {m: 2, say: 'Followed the strongest. Smart.'} : {m: -1, say: 'Followed, but grumbled.'}}]}
];
const mtAlly = (c, o, p, why) => { try { formAlliance(S, p, c, o, why, mtRng('al' + p)); } catch(e){} };
// up to three a year, never two phases in a row; group situations go to every apprentice at once
// apprentices in the same exam enter as one alliance
function mtLodgeAlly(){ const H = mtHere().filter(x => x.c.status === 'Active').map(x => x.c); const had = !!H[0] && !!H[0].alliance;
  for(let i = 1; i < H.length; i++) if(!alliesOf(S, H[0]).includes(H[i])) mtAlly(H[0], H[i], S.started ? S.phase : 0, '— they trained in the same lodge');
  // a new alliance born in the lodge carries the lodge's name, everywhere it was already written
  const A = H[0] && allianceOf(S, H[0]); if(!had && A && !A.lodge && H.length > 1){ const old = A.name, nm = `${MENTOR.name || 'the Old Master'}'s Lodge`.replace(/^the /, 'The ');
    A.name = nm; A.lodge = true; delete A.sizeTpl; S.log.forEach(e => { if(e.text && e.text.includes(old)) e.text = e.text.split(old).join(nm); }); H.forEach(c => (c.notes || []).forEach(n => { if(n.text.includes(old)) n.text = n.text.split(old).join(nm); })); } }
const mtLodgeA = () => { const H = mtHere().map(x => x.c), A = H[0] && allianceOf(S, H[0]); return A && H.filter(c => c.alliance === A.id).length >= 2 ? A : null; };
function mtDilFor(a, c){
  if(!S.started && mtActive().length > 1) mtLodgeAlly();
  const p = S.phase, ph = PHASES[p]; if(!ph || c.status !== 'Active') return null;
  if(ph.zevil || ph.final) return null;   // on the island and in the arena, the calls are made live
  if(a.dil && a.dil.ed === S.edition && a.dil.p === p) return a.dil;
  const g = MENTOR.gdil && MENTOR.gdil.ed === S.edition && MENTOR.gdil.p === p ? MENTOR.gdil : null;
  if(g){ a.dil = {ed: S.edition, p, k: g.k, o: null, choice: g.choice, group: true}; return a.dil; }
  if(mtActive().some(x => x !== a && x.dil && x.dil.ed === S.edition && x.dil.p === p)) return null;   // one choice per phase for the whole lodge
  const past = (a.dils || []).filter(d => d.ed === S.edition);
  if(past.length >= 3 || past.some(d => d.p === p - 1)) return null;
  const r = mtRng('dil' + p + a.id); if(r() > (ph.zevil || ph.final ? 0.6 : 0.3)) return null;
  const L = MT_DILS.filter(d => d.when(c, ph) && !past.some(x => x.k === d.k)); if(!L.length) return null;
  const W = {crusher: 0.5, lodge: 1.5, zevil: 2, final: 2, rival: 1.5, hurt: 1.5, drown: 1.5}, tot = L.reduce((s, d) => s + (W[d.k] || 1), 0);
  let x = r() * tot, D = L[L.length - 1]; for(const d of L){ x -= W[d.k] || 1; if(x <= 0){ D = d; break; } }
  let o = null;
  if(D.o === 'ally') o = alliesOf(S, c)[0];
  else if(D.o === 'hurt') o = alliesOf(S, c).find(y => y.injury || y.fatigue > 55);
  else if(D.o === 'rival') o = S.candidates.find(y => y.status === 'Active' && (c.grudges || []).some(gg => gg.id === y.id));
  else if(D.o === 'any') o = mtOther(c, r, y => !alliesOf(S, c).includes(y));
  if(D.o && !o) return null;
  a.dil = {ed: S.edition, p, k: D.k, o: o ? o.id : null, choice: null, group: !!D.group};
  if(D.group){ MENTOR.gdil = {ed: S.edition, p, k: D.k, choice: null}; }
  return a.dil;
}
const mtDilDef = d => MT_DILS.find(x => x.k === d.k);
const mtDilWho = (d, c) => { const o = d.o && S.candidates.find(x => x.id === d.o); return mtDilDef(d).who(c, o, PHASES[d.p] || PHASES[S.phase]); };
const mtDilQ = (d, c) => { const w = mtDilWho(d, c); return `${w.me ? (c.first || c.name) : w.n}: “${mtDilDef(d).q}”`; };
const mtNeedsChoice = () => false && !MT_AUTO && !MENTOR.off && !S.finished && mtHere().some(({a, c}) => { const d = mtDilFor(a, c); return d && d.choice == null; });
let MT_AUTO = false;
function mtSetChoice(aid, k){
  const a = mtOf(aid); if(!a || !a.dil) return;
  const v = k;
  if(a.dil.group){ if(MENTOR.gdil) MENTOR.gdil.choice = v; mtActive().forEach(x => { if(x.dil && x.dil.ed === S.edition && x.dil.p === a.dil.p && x.dil.group) x.dil.choice = v; }); }
  else a.dil.choice = v;
}
// resolve right before the phase runs: your call, or theirs if you left it
function mtDilResolve(a, c, p){
  const d = a.dil; if(!d || d.ed !== S.edition || d.p !== p || d.done) return;
  const D = mtDilDef(d), lean = mtLean(c), auto = d.choice == null;
  const idx = auto ? Math.max(0, D.opts.findIndex(x => x.lean === lean)) : d.choice, opt = D.opts[idx] || D.opts[0];
  const o = d.o && S.candidates.find(x => x.id === d.o) || {first: 'Someone', name: 'Someone', a: c.a, id: null};
  const res = opt.run(c, o, mtRng('dr' + p + a.id), p) || {};
  c.pmod = (c.pmod || 0) + (res.m || 0);
  if(res.fat) c.fatigue = Math.max(0, Math.min(100, (c.fatigue || 0) + res.fat));
  if(res.inj) injure(S, c, p, mtRng('di' + p + a.id));
  if(res.ally && res.ally.id) mtAlly(c, res.ally, p, 'after a moment in the exam');
  if(res.foe && res.foe.id){ addGrudge(res.foe, c, 'crossed {them} during the exam'); addGrudge(c, res.foe, 'a falling-out during the exam'); }
  if(res.leave){ try { leaveAlliance(S, c, p, `${c.name} goes a separate way.`, 'split'); } catch(e){} }
  if(!auto){ a.trust = Math.max(0, Math.min(100, mtTrust(a) + (opt.lean === lean ? 8 : -6))); }
  d.done = true; d.auto = auto; d.say = res.say; d.label = opt.l;
  a.dils = (a.dils || []).concat([{ed: S.edition, p, k: d.k}]).slice(-30);
  { const F = c.first || c.name, w = mtDilWho(d, c), q = mtDilDef(d).q, act = opt.l.charAt(0).toLowerCase() + opt.l.slice(1);
    const ask = w.me ? `${c.name}: “${q}”` : w.n === 'Your apprentices' ? `The lodge, around the fire: “${q}”` : `${w.n} to ${c.name}: “${q}”`;
    log(S, p, 'story', `${ask} ${auto ? `${F} chose to ${act}.` : `On your word, ${F} chose to ${act}.`} ${res.say}`, [c.id]); }
}
// the choice panel, under the phase header: who speaks, the line, three answers
// an apprentice already shown in a card gets their choice inside it; group choices and cardless apprentices keep the panel
const mtHasCard = (a, i) => !MENTOR.off && i != null && a.trail && a.trail.ed === S.edition && (a.trail.ph.find(x => x.p === i) || a.trail.ph.length);
function mtDilPanelHtml(i, only, grpOnly){
  if(MENTOR.off || S.finished) return '';
  const L = mtHere().filter(({c}) => c.status === 'Active').map(({a, c}) => ({a, c, d: mtDilFor(a, c)})).filter(x => x.d && !x.d.done && (grpOnly ? x.d.group : only ? x.a.id === only && !x.d.group : x.d.group || !mtHasCard(x.a, i)));
  const seen = new Set();
  return L.filter(x => { if(!x.d.group) return true; if(seen.has('g')) return false; seen.add('g'); return true; }).map(({a, c, d}) => {
    const D = mtDilDef(d), w = mtDilWho(d, c), nx = PHASES[d.p], dk = Math.max(0, D.opts.findIndex(x => x.lean === mtLean(c)));
    const names = d.group ? mtHere().filter(x => x.c.status === 'Active').map(x => x.c.first || x.c.name).join(' & ') : (c.first || c.name);
    return `<div class="mt-dpanel${d.choice != null ? ' set' : ''}${only || grpOnly ? ' in' : ''}${grpOnly ? ' mt-grp' : ''}" id="mtDil-${a.id}" data-biome="${biomeOf(nx ? nx.id : '')}"><div class="mt-dtop"><span class="mt-lab">◆ ${only || grpOnly ? grpOnly ? 'Apprentices' : esc(c.first || c.name) : `A choice · ${esc(names)}`}</span><span class="mt-dwhen">${grpOnly ? esc(names) + `<span class="mt-dph"> · ${esc(nx ? nx.name : '')}</span>` : only ? `<span class="mt-stamp">Now · ${esc(nx ? nx.name : '')}</span>` : `before ${esc(nx ? nx.name : 'the next trial')}`}</span></div>
      <div class="mt-dcard"><span class="mt-dav${w.me ? ' me' : ''}">${esc(w.i)}</span><div><small>${esc(w.me ? names : w.n)}</small><p>“${esc(D.q)}”</p></div></div>
      <div class="mt-dopts">${D.opts.map((o, i) => `<button type="button" class="${d.choice === i ? 'on' : d.choice == null && i === dk ? 'def' : ''}" data-mtdil="${a.id}" data-k="${i}" aria-pressed="${d.choice === i}">${esc(o.l)}</button>`).join('')}</div>
      <div class="mt-dfoot"><span>${d.choice != null ? mtCallFoot() : `No call yet: ${d.group ? 'they go' : only ? 'going' : esc(c.first || 'they') + ' will go'} by instinct.`}</span></div></div>`; }).join('');
}
// low trust: sometimes they ignore your order; high trust: a little extra when it counts
function mtTrustEdge(a, c, ph, mine){
  const t = mtTrust(a), r = mtRng('tr' + S.phase + a.id);
  if(t < 30 && mine && r() < 0.3){ c.mDefy = true; return -(c.mAp ? c.mAp.tot : 0); }
  if(t > 70 && (ph.zevil || ph.final || mtKind(ph) === 'fight')) return 1.5;
  return 0;
}
// letters between exams: short, in their voice, coloured by how far they got and how much they trust you
const MT_LETTERS = {
  early: ['Master, I fell early. I know. I will not waste your Jenny again.', 'I was not ready. Next year I will be.', 'Everyone was faster than me. For now.', 'I keep replaying the first trial. It will not happen twice.'],
  mid: ['Master, I got further this time. Not far enough.', 'Halfway there. I could see the rest of the road.', 'I made friends out there. And one enemy.', 'I almost had it. Almost.'],
  late: ['Master, I reached Zevil this time. Next year.', 'So close I could touch the card.', 'I saw the license with my own eyes. I want it more now.', 'The final was right there. I will be back for it.'],
  low: ['I did it my way. I hope you understand.', 'You push too hard, Master. I am still here, though.', 'I did not always listen. I know.'],
  high: ['Thank you for believing in me. Again.', 'Your lessons kept me alive out there.', 'I will make you proud. That is a promise.']
};
function mtLetter(a){
  const L = a.last; if(!L || L.status !== 'Eliminated' || L.ed !== S.edition - 1 && L.ed !== S.edition) return '';
  const zi = PHASES.findIndex(ph => ph.zevil), mid = Math.floor(PHASES.length / 2), r = mtRng('letter' + a.id + L.ed);
  const pool = L.out >= zi ? MT_LETTERS.late : L.out >= mid ? MT_LETTERS.mid : MT_LETTERS.early;
  const t = mtTrust(a), extra = t < 30 ? MT_LETTERS.low : t > 70 ? MT_LETTERS.high : null;
  const pick = arr => arr[Math.floor(r() * arr.length)];
  return pick(pool) + (extra ? ' ' + pick(extra) : '');
}
// rare words of their own, only at moments that matter
const MT_QUOTES = {
  big: ['I did not look down. Not once.', 'Is that all? I thought it would be harder.', 'Still standing. Wait till the lodge hears.', 'One more. Just one more.', 'I can hear my heart. It is loud.'],
  hair: ['That was too close.', 'My legs are shaking. Do not tell anyone.', 'I am still in. I am still in.'],
  out: ['The Master will hear about this. I am sorry.', 'I will be back. Remember my face.', 'Not like this. Not again.', 'Next year. I swear it.'],
  lic: ['Look at this card. Wait until the Master sees it.', 'I have to write to the lodge tonight.', 'I am a Hunter. Say it again.']
};
function mtQuote(e, ph, r){
  const key = e.k === 'lic' ? 'lic' : e.k === 'out' ? 'out' : e.k === 'ok' && (ph.zevil || ph.final) ? 'big' : e.k === 'ok' && e.rank && e.n > 20 && e.rank / e.n > 0.85 ? 'hair' : null;
  if(!key || r() > (key === 'lic' ? 0.7 : 0.35)) return null;
  const L = MT_QUOTES[key]; return '“' + L[Math.floor(r() * L.length)] + '”';
}

/* ---------- the lodge in the apprentice's story: where they trained, how, and what you taught ---------- */
const MT_SPOTS = ['a ruined dojo above {pl}', 'the waterfalls outside {pl}', 'an old lighthouse near {pl}', 'an abandoned mine under {pl}', 'a mountain monastery above {pl}', 'the rooftops of {pl}', 'a fishing boat off {pl}', 'a frozen lake north of {pl}', 'your lodge, an hour out of {pl}', 'a stone quarry outside {pl}', 'the forest behind {pl}', 'a circus camped in {pl} for the winter', 'a cliffside shrine over {pl}', 'the back rooms of a tea house in {pl}', 'a sunken ferry off {pl}', 'the ruins of a fort near {pl}', 'a salt flat beyond {pl}', 'a bell tower in {pl} nobody climbs any more', 'the night markets of {pl}', 'a goat farm in the hills behind {pl}'];
const MT_DO = {
  body: ['ran the hills until {their} legs gave out', 'carried stones up a thousand steps at dawn', 'sparred with you every evening and lost every evening, until one day {they} did not', 'swam against the current until it felt easy', 'chopped wood one-handed for a month', 'climbed the same cliff every day, faster each week', 'learned to fall without breaking', 'chased goats, and eventually caught them', 'hauled nets with the fishermen for their dinner', 'dodged the rocks you threw, then the knives'],
  mind: ['read every book on your shelves, twice', 'played strategy games with you by candlelight', 'learned to read tracks in the mud', 'solved the riddles you left nailed to the door', 'drew maps of places {they} had only heard of', 'memorised the names of a hundred poisons', 'studied the old exam records until {they} could recite them', 'spent nights watching the stars and learning to navigate', 'played cards with gamblers and learned to lie with a straight face', 'kept a notebook of every mistake {they} made'],
  spirit: ['meditated under the waterfall until the cold stopped mattering', 'learned to stay calm while you shouted', 'made friends in every village around', 'fasted for three days to learn patience', 'sat with the old Hunters and listened to their stories', 'buried a friend and kept going', 'learned to sleep anywhere, and wake up ready', 'sang to the crowd in the market until the stage fright died', 'carried a stranger to the healer, two days on foot', 'spent a winter alone in a cabin, on purpose'],
  mixed: ['did a little of everything, and complained about all of it', 'followed you around and copied everything you did', 'trained by day and worked in the kitchen by night', 'turned every chore you gave {them} into a contest']
};
const MT_NEN_TEACH = {
  Enhancement: ['You taught {them} that the body is the first weapon and the last one standing.', 'Your lesson was simple: hit harder than yesterday.', 'You made {them} believe strength is a habit, not a gift.'],
  Transmutation: ['You taught {them} to change shape like water.', 'Your lessons were tricks inside tricks, and {they} learned them all.', 'You showed {them} that the strangest move is often the right one.'],
  Emission: ['You taught {them} to throw {their} will further than {their} fists.', 'Your lessons were about distance: reach, endurance, and never being where the enemy expects.', 'You taught {them} to keep going long after the body wants to stop.'],
  Conjuration: ['You made {them} picture every trial before living it.', 'Your lessons were patient and precise, and so is {their} plan for the exam.', 'You taught {them} that preparation is a kind of weapon.'],
  Manipulation: ['You taught {them} to move people the way you move pieces on a board.', 'Your lessons were about reading the room before entering it.', 'You showed {them} that the best ally is the one who thinks it was their idea.'],
  Specialization: ['Your lessons made sense to no one but {them}.', 'You taught {them} things you still cannot fully explain.', 'Nobody understood your methods. {They} did.'],
  none: ['You taught {them} what the exam once taught you.', 'You passed on everything you learned the hard way.', 'Your lessons came from scars, and {they} paid attention.']
};
const MT_LEAN_BIO = {
  kind: ['{They} listened to every word.', '{They} cooked for the whole lodge without being asked.', '{They} thanked you after every lesson, even the cruel ones.'],
  bold: ['{They} argued with half your lessons and won a few.', '{They} skipped the warm-ups and paid for it, every time.', '{They} picked fights with older students, on purpose.'],
  safe: ['{They} took notes on everything.', '{They} asked why before every exercise, and you usually had an answer.', '{They} never once did anything twice without checking.'],
  sly: ['{They} found a shortcut through every exercise.', '{They} cheated at cards with you, and you let {them}.', '{They} learned your tricks and then a few you never taught.']
};
const MT_LESSON_DO = {wild: 'survive in the wild', read: 'read people', dirty: 'fight dirty when it matters', mind: 'think before running', grit: 'never stop walking', nerve: 'hold {their} nerve'};
const mtCampFocus = cp => { const P = cp.pts || {}; const top = ['body', 'mind', 'spirit'].sort((x, y) => (P[y] || 0) - (P[x] || 0)); return (P[top[0]] || 0) - (P[top[1]] || 0) >= 2 ? top[0] : 'mixed'; };
// pick a spot for this year's camp (once per camp), remembered for the story
function mtCampStory(a, c, cp){
  if(cp.place) return;
  const r = makeRng(nhash(a.id + ':spot:' + S.edition) >>> 0), pl = PLACES[Math.floor(r() * PLACES.length)];
  cp.place = MT_SPOTS[Math.floor(r() * MT_SPOTS.length)].replace('{pl}', pl);
  cp.focus = mtCampFocus(cp);
  const L = MT_DO[cp.focus]; cp.act = L[Math.floor(r() * L.length)];
  a.camps = (a.camps || []).concat([{ed: S.edition, place: cp.place, focus: cp.focus, act: cp.act, lesson: cp.lesson, nen: MENTOR.nen || null}]).slice(-8);
}
const mtPick = (arr, key) => arr[nhash(key) % arr.length];
// the sentences the bio uses: how long with you and where, what you taught, how they took it, and the last year
function mtBio(c){
  const a = MENTOR.appr.find(x => x.id === c.id && (x.camps || []).length); if(!a) return null;
  const C = a.camps, first = C[0], last = C[C.length - 1], yrs = C.length;
  const nen = MT_NEN_TEACH[first.nen || MENTOR.nen || 'none'] || MT_NEN_TEACH.none;
  const span = yrs > 1 ? `${yrs} years` : 'a year';
  const before = mtPick([
    `For ${span} before this exam, ${c.first} trained under you at ${first.place}, where {they} ${first.act}.`,
    `${c.first} spent ${span} under your wing at ${first.place}, where {they} ${first.act}.`,
    `You took ${c.first} in ${yrs > 1 ? `${yrs} exams ago` : 'just before this exam'}; at ${first.place}, {they} ${first.act}.`,
    `Your lodge became home for ${span}: at ${first.place}, ${c.first} ${first.act}.`,
    `${c.first} answered your call and followed you to ${first.place}, where {they} ${first.act}.`
  ], a.id + 'before');
  const teach = mtPick(nen, a.id + 'nen') + ' ' + mtPick(MT_LEAN_BIO[mtLean(c)], a.id + 'lean');
  const les = last.lesson ? MT_LESSON_DO[last.lesson] || 'keep going' : null;
  const since = yrs > 1 ? mtPick([
    `Since the last exam, {they} trained with you at ${last.place}: ${c.first} ${last.act}${les ? `, and learned to ${les}` : ''}.`,
    `After the last failure you moved the training to ${last.place}, where ${c.first} ${last.act}${les ? `. This year's lesson: ${les}` : ''}.`,
    `The last year was spent at ${last.place}. ${c.first} ${last.act}${les ? `, and finally learned to ${les}` : ''}.`,
    `You did not let ${c.first} rest after the last exam: off to ${last.place}, where {they} ${last.act}${les ? ` and learned to ${les}` : ''}.`
  ], a.id + 'since' + last.ed) : null;
  return {before, teach, since, place: last.place};
}
// seats: who sits in the lodge, which seats are free, and how far the next one is
function mtSeatsHtml(roster){
  const L = roster ? mtActive() : [], n = mtSlots(), R = MENTOR.renown, next = R < 8 ? 8 : R < 20 ? 20 : null;
  const seats = L.map(a => `<span class="mt-seat on"><i>◆</i><a data-id="${a.id}">${esc(a.name)}</a></span>`).join('')
    + Array.from({length: roster ? Math.max(0, n - mtActive().length) : 0}, () => `<span class="mt-seat free${MENTOR.newSeat ? ' glow' : ''}"><i>◇</i>Free seat</span>`).join('');
  // renown fills toward the next seat; the earlier threshold stays marked on the bar
  const meter = next ? `<div class="mt-ren" title="Renown: +3 for each apprentice licensed (+2 in round 1, +1 on a first try), +1 when one reaches Zevil Island and falls, −1 when one dies">
      <div class="mt-ren-t"><span>Renown <b>${R}</b><i>/${next}</i></span><span>${next === 8 ? 'Next: a second seat' : 'Next: a third seat'}</span></div>
      <div class="mt-ren-b"><b style="width:${Math.min(100, R / next * 100)}%"></b>${next === 20 ? `<em style="left:${8 / 20 * 100}%"></em>` : ''}</div></div>`
    : `<div class="mt-ren"><div class="mt-ren-t"><span>Renown <b>${R}</b></span><span>All three seats open</span></div><div class="mt-ren-b"><b style="width:100%"></b></div></div>`;
  const A = mtActive(), deciding = A.some(a => { const c = S.candidates.find(x => x.id === a.id); return c && !mtCampFor(a).done; }) || A.length < n, fees = A.reduce((s, a) => s + (a.fee || MT_FEE), 0), net = SC_STIPEND - fees, led = A.length && deciding ? `<div class="mt-ledger">${net === 0 ? 'Each exam: the stipend covers the camp' + (A.length > 1 ? 's' : '') : `Each exam: <b class="${net < 0 ? 'neg' : 'pos'}">${net < 0 ? '−' : '+'}${fmtJ(Math.abs(net))}</b> <span>(camp${A.length > 1 ? 's' : ''} ${fmtJ(fees)}, stipend ${fmtJ(SC_STIPEND)})</span>`} · bonuses when they go far</div>` : '';
  return `<div class="mt-seatrow mt-col"><div class="mt-stat">${meter}${led}</div>${seats ? `<div class="mt-seats">${seats}</div>` : ''}</div>`;
}

async function boot(){
  try {
    if(!(await load())) newWorld();
    else { ensurePros(S.edition); ensureChair(S.edition); }
    updateFavCss();
    try { render(); } catch(e){
      // a save from an older version can trip the newest panels: retry without them before giving up
      console.error(e); MENTOR.open = false; SCOUT.open = false; render();
    }
    save();
    if(nlFromHash()) showTab('nen');
  } catch(e){ console.error(e); bootError(e); }
}
// if the world cannot be shown, say so and keep the save safe instead of a blank page
function bootError(e){
  const d = document.createElement('div'); d.className = 'booterr';
  d.innerHTML = `<b>Something went wrong while loading your world.</b><span>${String(e && e.message || e).replace(/</g, '&lt;')}</span><div><button class="btn small" id="beExp">Download my save</button><button class="btn small" id="beRe">Reload</button></div>`;
  document.body.prepend(d);
  document.getElementById('beExp').onclick = () => { try { exportSave(); } catch(x){ alert('Export failed: ' + x.message); } };
  document.getElementById('beRe').onclick = () => location.reload();
}
const lastDone = () => S.stats.length ? S.stats[S.stats.length-1].p : null;

