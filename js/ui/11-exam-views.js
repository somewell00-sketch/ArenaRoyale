/* ---------- save file ---------- */
async function exportSave(){
  const data = {v:3, S, HISTORY, HUNTERS, HA_SEQ, FAV, BULLETINS, WORLD, SCOUT, MENTOR, exported: new Date().toISOString()};
  const msg = t => { const m = $('saveMsg'); if(m) m.textContent = t; };
  let dl = null; try{ dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; }catch(e){ dl = null; }
  if(!dl){   // outside Claude (GitHub Pages, a local file): a plain browser download
    try{ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'})); a.download = `hunter-exam-save-${S.edition}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); msg('Save file exported. Keep it somewhere safe; use Import save to restore it.'); }
    catch(e){ msg('Could not export the save file here.'); }
    return; }
  try{ await dl.save({filename: `hunter-exam-save-${S.edition}.json`, data: JSON.stringify(data)}); msg('Save file exported. Keep it somewhere safe; use Import save to restore it.'); }
  catch(e){ msg(e && e.code === 'declined' ? 'Export cancelled.' : e && e.code === 'rate_limited' ? 'A save prompt is already open.' : 'Could not export the save file here.'); }
}
function importSave(file){
  const r = new FileReader();
  r.onload = () => {
    let d; try{ d = JSON.parse(r.result); }catch(e){ d = null; }
    if(!(d && d.S && Array.isArray(d.S.candidates))){ $('saveMsg').textContent = 'That file is not a Hunter Exam save.'; return; }
    S = d.S; HISTORY = d.HISTORY || []; HUNTERS = d.HUNTERS || []; HA_SEQ = d.HA_SEQ || HUNTERS.length; FAV = d.FAV || {}; SCOUT = scoutFix(d.SCOUT); MENTOR = mentorFix(d.MENTOR); BULLETINS = d.BULLETINS || []; WORLD = worldFix(d.WORLD); hatsuNameFix();
    ensurePros(S.edition); updateFavCss(); selPhase = null; save(); render(); showTab('history');
    $('saveMsg').textContent = `Loaded: ${ordinal(S.edition)} Hunter Exam, ${HISTORY.length} archived edition${HISTORY.length === 1 ? '' : 's'}, ${HUNTERS.length} Hunters.`;
  };
  r.readAsText(file);
}

/* ---------- favorites (followed across editions by permanent candidate ID) ---------- */
let FAV = {};
const isFav = id => !!FAV[id];
function updateFavCss(){
  let st = document.getElementById('favcss');
  if(!st){ st = document.createElement('style'); st.id = 'favcss'; document.head.appendChild(st); }
  const ids = Object.keys(FAV).filter(id => /^[\w-]+$/.test(id));
  st.textContent = ids.length ? ids.map(id => `a[data-id="${id}"]`).join(',') + '{}' + ids.map(id => `a[data-id="${id}"]::before`).join(',') + "{content:'★ ';color:var(--gold)}" : '';
}
function toggleFav(id){
  if(FAV[id]) delete FAV[id];
  else { const c = S.candidates.find(x => x.id === id), h = HUNTERS.find(x => x.cid === id); FAV[id] = (c || h || {}).name || id; }
  updateFavCss(); save();
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', isFav(id)); b.textContent = isFav(id) ? '★ Favorite' : '☆ Favorite'; });
  renderFavStrip(); renderTab(curTab);
  if($('pgrid')) drawGrid();
}
const favBtn = id => `<button class="btn small favbtn" data-fav="${esc(id)}" aria-pressed="${isFav(id)}" title="Follow this candidate across exams">${isFav(id) ? '★ Favorite' : '☆ Favorite'}</button>`;
function favLog(p, text, id){ S.log.push({p, type:'fav', text, ids: id ? [id] : []}); }
function runFav(){
  if(!S.started) scLock(true);   // picks still open when the exam starts: lock them as they are
  const before = {}; S.candidates.forEach(c => { if(FAV[c.id]) before[c.id] = c.status; });
  if(S.cat && S.phase === S.cat.p && !S.cat.stage) S.cat.wait = !MT_AUTO && !MENTOR.off && mtHere().some(({c}) => c.status === 'Active');
  if(S.cat && S.cat.stage === 'impact') mtHere().forEach(({a, c}) => { if(!S.cat.mt[c.id]) S.cat.mt[c.id] = a.posture === 'cautious' ? 'run' : a.posture === 'aggressive' ? 'hold' : 'help'; });
  mtBefore();
  runPhase(S);
  if(S.cat && S.cat.stage === 'impact'){ selPhase = S.cat.p; return; }
  const p = lastDone(); if(p === null) return;
  mtAfter(p);
  const ph = PHASES[p];
  S.candidates.forEach(c => {
    if(!(c.id in before) || before[c.id] !== 'Active' && before[c.id] !== 'Finalist') return;
    const t = c.status === 'Approved' ? `${c.name} earned a Hunter License!`
      : c.status === 'Deceased' && c.out === p ? `${c.name} died in ${thePhaseUI(ph)}.`
      : c.status === 'Disqualified' && c.out === p ? `${c.name} was disqualified in ${thePhaseUI(ph)}.`
      : c.status === 'Eliminated' && c.out === p ? `${c.name} was eliminated in ${thePhaseUI(ph)}.`
      : (c.status === 'Active' || c.status === 'Finalist') ? (PHASES[p + 1] && PHASES[p + 1].final ? `${c.name} made it to the Final Tournament.` : `${c.name} got through ${thePhaseUI(ph)}.`) : null;
    if(t) favLog(p, t, c.id);
  });
}
const thePhaseUI = ph => (/^The /.test(ph.name) ? 'the ' + ph.name.slice(4) : ph.name);
function favReturn(prev){
  S.candidates.forEach(c => { if(FAV[c.id] && isReturning(c)) favLog(0, `${c.name} is back for attempt ${attemptsOf(c)}.`, c.id); });
  if(prev){
    const here = new Set(S.candidates.map(c => c.id));
    prev.candidates.forEach(c => { if(FAV[c.id] && c.status === 'Eliminated' && !here.has(c.id)) favLog(0, `${c.name} did not return for the ${ordinal(S.edition)} Hunter Exam.`, null); });
  }
}
let FS_ALL = false;
document.addEventListener('click', e => { if(e.target.closest('[data-fsall]')){ FS_ALL = !FS_ALL; renderFavStrip(); } });
function renderFavStrip(){
  const el = $('favstrip'); if(!el) return; const ids = Object.keys(FAV);
  if(!ids.length){ el.hidden = true; el.innerHTML = ''; return; }
  const map = byIdMap();
  const lab = c => c.status === 'Approved' ? ['Hunter', 'ok'] : c.status === 'Active' ? [S.started ? 'Still in' : isReturning(c) ? 'Attempt ' + attemptsOf(c) : 'Registered', 'live'] : c.status === 'Finalist' ? ['Finalist', 'ok']
    : [(c.status === 'Deceased' ? 'Died' : c.status === 'Disqualified' ? 'Disqualified' : 'Out') + (c.out != null && PHASES[c.out] ? ' · ' + PHASES[c.out].name : ''), 'bad'];
  const E0 = SCOUT.ex[S.edition], hasBet = id => mtOf(id) ? -1 : E0 && E0.locked && E0.picks.some(x => x.id === id) ? 0 : 1;
  const inExam = ids.filter(id => map[id] && !(S.started && mtOf(id))).map(id => map[id]).sort((a, b) => hasBet(a.id) - hasBet(b.id) || a.reg - b.reg);
  if(!inExam.length){ el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  const E = SCOUT.ex[S.edition], betOf = id => E && E.locked && E.picks.find(x => x.id === id);
  const MAX = 5, more = inExam.length - MAX, shown = FS_ALL || more <= 1 ? inExam : inExam.slice(0, MAX);
  const dot = c => 'fs-' + (c.status === 'Active' && !S.started ? 'reg' : lab(c)[1]);
  el.classList.toggle('all', FS_ALL);
  el.innerHTML = `<span class="fs-lab">★ Following</span>` + shown.map(c => { const [t] = lab(c), b = betOf(c.id), bs = b ? (b.res || scLive(c, b.lvl)) : null, L = b && SC_LVL.find(x => x.k === b.lvl);
    return `<span class="fs-i ${dot(c)}" title="${esc(t)}"><i class="fs-d" aria-hidden="true"></i><a data-id="${c.id}">${esc(c.name)}</a>${mtOf(c.id) ? '<i class="fs-mt" title="Your apprentice">◆</i>' : ''}<span class="sr-only">(${esc(t)})</span>${b ? `<i class="fs-coin b-${bs}" role="img" aria-label="Your bet" title="Your bet · ${L.l} ×${b.odds}${b.dbl ? ' (doubled)' : ''} · ${bs === 'won' ? 'won' : bs === 'lost' ? 'lost' : fmt(b.stake + (b.dbl ? b.dbl.stake : 0)) + ' Jenny at stake'}"></i>` : ''}</span>`; }).join('')
    + (more > 1 ? `<button type="button" class="fs-more" data-fsall>${FS_ALL ? 'Show less' : '+' + more}</button>` : '');
}
function renderReturning(){
  const C = S.candidates, ret = C.filter(isReturning), N = C.length;
  $('retstrip').hidden = !ret.length && attemptsOf(C.reduce((b, c) => attemptsOf(c) > attemptsOf(b) ? c : b, C[0])) <= 1;
  const most = C.reduce((b, c) => attemptsOf(c) > attemptsOf(b) ? c : b, C[0]);
  const avg = C.reduce((s, c) => s + attemptsOf(c), 0) / N;
  const info = S.returnInfo;
  const famN = (S.alliances || []).filter(A => A.family).length;
  $('retstrip').innerHTML = `
    ${ret.length ? `<span><b>${fmt(ret.length)}</b> returning${info ? ` from the ${ordinal(info.from)}${info.early ? `, ${info.early} early standouts` : ''}` : ''}</span>` : ''}${attemptsOf(most) > 1 ? `<span>most tries: <a data-id="${most.id}">${esc(most.name)}</a> (${attemptsOf(most)})</span>` : ''}`;
}
// a candidate whose secret is a legendary parent gets a real one among the Hunters; half of them carry the name
function legendParents(S){
  if(!S || typeof HUNTERS === 'undefined' || !HUNTERS.length) return;
  S.candidates.filter(c => c.secret && c.secret.k === 'hunterchild' && !c.hParent).forEach(c => {
    const age = h => h.age || 40, taken = new Set(S.candidates.map(o => o.hParent).filter(Boolean));
    const born = S.edition - c.age, L = HUNTERS.filter(h => hStars(h) >= 3 && h.edition >= born - 25 && h.edition <= born + 8 && !taken.has(h.license));   // licensed in the years around the child's birth
    if(!L.length) return; const H = L[nhash(c.id + 'hp') % L.length];
    c.hParent = H.license; c.hParentName = H.name; c.hParentGone = H.status === 'Deceased';
    const last = H.name.split(' ').slice(1).join(' ');
    if(last && !c.fam && nhash(c.id + 'sn') % 2 === 0 && !(S.log || []).some(e => e.p > 0)){   // takes the name only before the exam has said anything about them
      const old = c.name, nw = (c.first || old.split(' ')[0]) + ' ' + last; c.name = nw; c.last = last; c.hName = true;
      (S.log || []).forEach(e => { if(e.text && e.text.includes(old)) e.text = e.text.split(old).join(nw); });
    }
  });
}
const legendKnown = c => c.hParent && (c.hName || (c.secret && c.secret.revealed));
function render(){
  try { legendParents(S); } catch(e){}
  useLineup(S); FINAL_P = PHASES.length - 1;
  if(selPhase === null) selPhase = lastDone();
  $('edition').textContent = S.special === 'jubilee' ? `The ${ordinal(S.edition)} · Jubilee Exam` : S.special === 'centenary' ? `The ${ordinal(S.edition)} · Centenary Exam` : ordinal(S.edition) + ' Hunter Exam';
  $('navExam').textContent = `${ordinal(S.edition)}${S.special ? (S.special === 'jubilee' ? ' Jubilee' : ' Centenary') : ''} · ${S.finished ? 'complete' : S.started ? PHASES[S.phase].name : 'not started'}`;
  $('navHist').textContent = HISTORY.length ? `${HISTORY.length} on record` : 'no records yet'; $('navHist').parentElement.classList.toggle('dim', !HISTORY.length);
  $('navHunt').textContent = `${fmt(HUNTERS.filter(h => hActive(h)).length)} active`;
  $('navWorld').textContent = WORLD && WORLD.crisis ? 'Crisis · ' + (CRISES[WORLD.crisis.k] ? CRISES[WORLD.crisis.k].name.replace(/^the /, '') : 'ongoing') : BULLETINS.length ? `Herald No. ${BULLETINS[BULLETINS.length - 1].edition}` : 'quiet for now';
  { const ch = typeof hLic === 'function' && WORLD && WORLD.chair ? hLic(WORLD.chair.lic) : null; $('navAssoc').textContent = ch ? `Chairman ${ch.name.split(' ').slice(-1)[0]}` : 'Council & politics'; }
  const TH = THEMES[S.theme || 'classic'];
  document.documentElement.dataset.exTheme = S.special ? 'sp-' + S.special : S.theme || 'classic';
  document.querySelector('header.top').dataset.kj = S.special === 'centenary' ? '百' : S.special === 'jubilee' ? '祭' : '';
  document.querySelector('.brand small').textContent = `第${S.edition}回 · ${S.special === 'centenary' ? 'CENTENARY EXAM' : S.special === 'jubilee' ? 'JUBILEE EXAM' : 'HUNTER EXAM SIMULATOR'}`;
  $('pageFoot').textContent = `Seed ${S.seed}`;
  $('seed').innerHTML = `${S.special ? `<span class="thm">${S.special === 'jubilee' ? 'Up to 48 licenses this year' : 'A Centennial Star will be crowned'}</span>` : TH ? `<span class="thm" title="${esc(TH.desc)}">${esc(TH.name)}</span>` : ''}`;
  const pill = $('statePill');
  pill.className = 'pill' + (S.finished ? ' pl-done' : S.started ? ' pl-live' : '');
  pill.textContent = RP.active ? 'Final Tournament · live' : S.finished ? 'Exam complete' : S.started ? 'In progress' : 'Candidates registered';
  $('bStep').disabled = $('bAll').disabled = S.finished;
  if(liveWanted()) liveStart();
  $('bStep').textContent = S.finished ? 'Exam complete' : S.live ? (S.live.kind === 'zevil' ? (() => { const W = liveZWho(), n = W.filter(x => (S.live.st[x] || [])[S.live.day + 1]).length; return `Run day ${S.live.day + 1}${W.length > 1 ? ` · ${n} of ${W.length} called` : ''}`; })() : (() => { const g = liveGate(); return g ? `Run bout ${g.n}` : 'Run next bout'; })()) : S.cat && S.cat.stage === 'impact' ? 'Run the aftermath' : `Run ${PHASES[S.phase].name}`;
  $('bAll').innerHTML = S.finished ? 'Run all remaining phases' : S.phase >= PHASES.length - 1 ? 'Run the final' : `<span class="xl">Run to the end</span><span class="xs">Run all</span>`;
  $('bNext').textContent = `Start the ${ordinal(S.edition + 1)} exam`;
  $('bStep').hidden = $('bAll').hidden = S.finished; $('bNext').hidden = !S.finished;   // only the buttons that make sense right now
  $('bRestart').disabled = !S.started;
  $('bNext').disabled = !S.finished;

  const k = counts();
  $('stats').innerHTML = [
    ['Applicants', fmt(k.total), 'link'], S.finished || !S.started ? null : ['In the exam', fmt(k.active)], S.started ? ['Eliminated', fmt(k.elim)] : null, k.dead ? ['Deceased', fmt(k.dead), 'dead'] : null,
    k.appr || S.finished ? ['Licensed', k.appr, 'gold'] : null,
  ].filter(Boolean).map(([l,v,c]) => `<div class="stat ${c||''}" ${c === 'link' ? 'data-people role="button" tabindex="0"' : ''}><b>${v}</b><span>${l}</span></div>`).join('');

  scSettle(); scStipend(); mtSettle(); registerHunters(); renderReturning(); renderFavStrip(); renderStepper(); renderPhase(); renderTab(curTab);
  const wc = $('walletChip'); if(wc) wc.innerHTML = fmtJ(SCOUT.jenny);
}

const BIOME = {ridge:'mountain', pit:'arena', banquet:'kitchen', blankmap:'forest', hall:'tower', mute:'underground', pairs:'forest', mirror:'tower', feeding:'wild', dice:'vault', sea:'water', raft:'water', bandits:'water', desert:'desert', disguise:'forest', quiz:'forest', nighttrain:'night', nighthunt:'night', cliffpath:'mountain', mountain:'mountain', egg:'mountain',
  marathon:'underground', stairs:'underground', maze:'underground', guardians:'underground', wetlands:'swamp', tower:'tower', prisoner:'tower', cooking:'kitchen', auction:'vault', treasure:'vault',
  capture:'wild', beast:'wild', zevil:'island', final:'arena', centennial:'mountain'};
const biomeOf = id => BIOME[id] || 'tower';
// cosmetic: tag the phase pane with its biome and chapter number whenever it is redrawn
new MutationObserver(() => {
  const el = $('pane-phase'); let i = selPhase ?? lastDone();
  if((i === null || !S.stats.find(s => s.p === i)) && !S.finished) i = S.phase;
  if(i === null || !PHASES[i]) return;
  if(el.dataset.biome !== biomeOf(PHASES[i].id)) el.dataset.biome = biomeOf(PHASES[i].id);
  const st = PHASES[i].stage, mark = st ? String(st) : '序';
  const rh = el.querySelector('.rep-head'); if(rh && rh.dataset.ch !== mark) rh.dataset.ch = mark;
}).observe(document.getElementById('pane-phase'), {childList: true});
function renderStepper(){
  // phases sit under one label per group; a thin bar shows how many are still standing
  const N0 = S.config.applicants || 1, groups = [];
  PHASES.forEach((ph, i) => { const g = groups[groups.length - 1]; if(g && g.name === ph.group) g.ix.push(i); else groups.push({name: ph.group, ix: [i]}); });
  const step = i => { const ph = PHASES[i], st = S.stats.find(s => s.p === i), isNext = !S.finished && i === S.phase;
    const cls = st ? 'done' : isNext ? 'next' : 'todo';
    // never break a word: each card is at least as wide as the longest word in its name
    const mw = Math.max(84, Math.ceil(Math.max(...ph.name.split(' ').map(w => w.length)) * 7.6 + 20));
    return `<button class="step ${cls}" style="min-width:${mw}px" data-biome="${biomeOf(ph.id)}" data-step="${i}" title="${esc(PREVIEW[ph.id] || '')}${st ? ` · ${st.after} left` : ''}" aria-pressed="${selPhase === i || (selPhase === null && isNext)}" ${st || isNext ? '' : 'disabled'}>
      <span class="n">${esc(ph.name)}</span><span class="c">${st ? `${fmt(st.after)} left` : isNext ? 'Next' : ''}</span>${st ? `<span class="lb"><i style="width:${Math.max(2, st.after / N0 * 100)}%"></i></span>` : ''}</button>`; };
  // only what has happened and what comes next: the rest of the route stays a surprise
  const seen = i => S.finished || i <= S.phase, vis = groups.map(g => ({...g, ix: g.ix.filter(seen)})).filter(g => g.ix.length);
  $('stepper').classList.toggle('partial', !S.finished);
  $('stepper').innerHTML = vis.map(g => `<div class="sg" style="flex:${g.ix.length} 0 auto"><div class="sg-h">${esc(g.name)}</div><div class="sg-row">${g.ix.map(step).join('')}</div></div>`).join('')
    + (S.finished ? '' : `<div class="sg sg-more" aria-hidden="true"><div class="sg-h">&nbsp;</div><div class="sg-row"><span class="step-more">⋯</span></div></div>`);
  const cur = $('stepper').querySelector('[aria-pressed="true"]');
  if(cur) cur.scrollIntoView({block:'nearest', inline:'center'});
}

const byIdMap = () => cmap(S);
function linkNames(text, ids){
  let out = esc(clean(text));
  if(!ids || !ids.length) return out;
  const map = byIdMap();
  // link full names; when a line only uses a first name ("Ebele and Leni stopped being allies"), link that instead
  const tok = [], put = html => '\u0001' + (tok.push(html) - 1) + '\u0002';
  ids.forEach(id => { const c = map[id]; if(!c) return;
    const full = esc(c.name);
    if(out.includes(full)){ out = out.split(full).join(put(`<a data-id="${c.id}">${full}</a>`)); return; }
    const f = esc(c.first || c.name.split(' ')[0]);
    const re = new RegExp('(^|[^\\p{L}\\u0001-\\u0002\\d])(' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\p{L}])', 'u');
    out = out.replace(re, (m, pre) => pre + put(`<a data-id="${c.id}">${f}</a>`));
  });
  return out.replace(/\u0001(\d+)\u0002/g, (m, i) => tok[+i]);
}
const nameLinks = list => list.map(c => `<a data-id="${c.id}">${esc(c.name)}</a>`).join(', ');
const PREVIEW = {
  ridge:'Only in a year of storms: a bare ridge to cross while the lightning walks along it.',
  pit:'Only in a year of the Crimson Ledger: a mud pit, three nights, and whoever is still standing climbs out.',
  banquet:'Only in a year of celebration: a royal banquet where every guest is watching, and some of them are examiners.',
  blankmap:'Only in a year of new routes: a land nobody has mapped. Veterans have nothing to remember here.',
  hall:'Only in a year of old ghosts: a hall built from the trials of past exams. Those who were there before know the way.',
  mute:'Only in a year of closed hands: a crossing in total silence. One word and you are out. Nobody can help anybody.',
  pairs:'Only in a year of the red thread: candidates are tied together two by two. A pair passes or falls together.',
  mirror:'Only in a year of masks: a hall of mirrors where one examiner is real and the rest are not.',
  feeding:'Only in a wild year: the grazing grounds of the island beasts, at feeding time.',
  dice:'Only when the Chairman is playing: his own game, his own rules, his own dice. Luck matters more than anywhere else.',
  sea:'A storm-tossed crossing to the exam site. The crew watches who keeps their nerve and who helps others.',
  quiz:'An old woman blocks the road with an impossible question. The trick is in how you answer.',
  disguise:'Shapeshifting Kiriko pose as guides. Spot the fake or get lost in the forest.',
  marathon:'Follow the examiner through endless tunnels. No finish line is announced.',
  stairs:'The tunnel ends in a staircase that seems to climb forever, on legs already spent.',
  wetlands:'The Numere Wetlands: mist, swamp mud, predators and creatures that imitate the examiner.',
  capture:'Bring back a Great Stamp for the gourmet examiners.',
  cooking:'Cook a dish that satisfies a very particular examiner. Failures may get a second chance.',
  egg:'Jump into a ravine and grab a Spider Eagle egg from the webs below.',
  tower:'Descend the Trick Tower in teams within 72 hours, deciding every door by majority vote.',
  prisoner:'Convicts offer reduced sentences for beating candidates in fights, riddles and wagers.',
  centennial:'Only in centenary years: a road of a hundred stairs and a hundred doors, past the names of every Hunter who came before.',
  zevil:'A week on Zevil Island hunting badges. Each candidate has a secret target.',
  nighttrain:'An overnight train to the exam site. Bandits, card sharks and a conductor who is more than he seems.',
  cliffpath:'A narrow path along sea cliffs, with rope bridges and rockfalls between the port and the exam site.',
  desert:'Cross the dunes with the water you can carry. The examiner never slows down.',
  nighthunt:'Chase the examiner\'s lantern through a pitch-black forest full of pits and predators.',
  mountain:'Climb to a summit hut before nightfall. Ice, ropes and thin air.',
  auction:'Each candidate gets a budget and a catalogue. Buy the genuine treasure, avoid the forgeries.',
  beast:'Tame a wild beast and ride it back to the examiners.',
  treasure:'A torn map, a buried cache and a deadline at sunset.',
  maze:'Find the way out of an underground labyrinth in teams within 72 hours.',
  guardians:'Ancient guardians block the last gates with duels, riddles and wagers.',
  raft:'Run a wild river on team rafts and reach the delta within 72 hours.',
  bandits:'River bandits demand a toll: beat them in a fight, a riddle or a wager.',
  final:'Last stand: one-on-one bouts, then a license bout against an examiner.'
};

/* ---------- final tournament bracket ---------- */
const RP = {active:false, idx:0, ex:0, timer:null, view:null}; // replay state
let FINAL_P = PHASES.length - 1;
function bracketMatches(){ const B = S.bracket; if(!B) return []; return B.prelim.concat(B.rounds.flat(), B.solo ? [B.solo] : [], ...(B.groups || []).map(g => g.rounds.flat().concat(g.solo ? [g.solo] : []))); }
function matchById(id){ return bracketMatches().find(m => m.id === id); }
const revealed = m => !RP.active || m.seq < RP.idx;
function hiddenFinal(){
  // ids whose final outcome is not yet shown during the replay
  const hide = new Set();
  if(!RP.active || !S.bracket) return hide;
  bracketMatches().forEach(m => { if(m.seq >= RP.idx){ if(m.w) hide.add(m.w); if(m.dq) hide.add(m.dq); if(m.l && (m.root || m.id.startsWith('P') || m.examiner)) hide.add(m.l); } });
  return hide;
}
function startReplay(){
  clearTimeout(RP.timer);
  if(!S.bracket || !S.bracket.order.length) return;
  Object.assign(RP, {active:true, idx:0, ex:0, view:S.bracket.order[0]});
  tick();
}
function stopReplay(){ clearTimeout(RP.timer); RP.active = false; RP.ex = 0; render(); }
function tick(){
  if(!RP.active) return;
  const order = S.bracket.order;
  if(RP.idx >= order.length){ stopReplay(); return; }
  const m = matchById(order[RP.idx]); RP.view = m.id;
  const n = m.ex ? m.ex.length : 0;
  let delay;
  if(RP.ex < n){ RP.ex++; delay = RP.ex === n ? 950 : 330; }
  else { RP.idx++; RP.ex = 0; delay = m.ex ? 250 : 350; }
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) delay = Math.min(delay, 120);
  if(selPhase === FINAL_P && !$('pane-phase').hidden) renderBracket(); 
  renderStatsOnly();
  RP.timer = setTimeout(tick, delay);
}
const initials = name => name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
function who(id){ if(!id) return null; if(id === 'examiner') return null; return S.candidates.find(c => c.id === id); }

function fighterRow(m, side, known){
  const id = m[side];
  const done = revealed(m) && (m.w || m.examiner);
  if(!known) return `<div class="fr tbd"><span class="av">?</span><span class="nm">${m.round > 1 ? 'Loser of R' + (m.round-1) + '-' + (2*(+m.id.split('-')[1]) - (side === 'a' ? 1 : 0)) : '—'}</span></div>`;
  if(id === 'examiner'){
    const win = done && m.w === 'examiner';
    return `<div class="fr ${done ? (win ? 'win' : 'lose') : ''}"><span class="av ex">EX</span><span class="nm">${esc(m.examiner)}</span><span class="tg">${done && win ? 'Won' : ''}</span></div>`;
  }
  const c = who(id);
  if(!c) return `<div class="fr bye"><span class="av">—</span><span class="nm">Bye</span><span class="tg"></span></div>`;
  let cls = '', tag = '';
  if(done){
    if(m.fatal){ if(m.dq === id){ cls = 'out'; tag = 'DQ'; } else { cls = 'dead'; tag = 'Killed'; } }
    else if(m.w === id){ cls = 'win'; tag = 'Passed'; }
    else if(m.dq === id){ cls = 'out'; tag = 'DQ'; }
    else if(m.root || m.id.startsWith('P') || m.examiner){ cls = 'out'; tag = 'Eliminated'; }
    else { cls = 'lose'; tag = 'Fights again →'; }
  } else if(m.bye && revealed(m)){ tag = 'Bye →'; cls = 'lose'; }
  return `<div class="fr ${cls}"><span class="av">${initials(c.name)}</span><span class="nm"><a data-id="${c.id}">${esc(c.name)}</a><small><span class="regn">#${c.reg}</span></small></span><span class="tg">${tag}</span></div>`;
}
function matchCard(m, known){
  const live = RP.active && RP.view === m.id && m.seq === RP.idx;
  const st = m.bye && !m.examiner ? 'bye' : !revealed(m) ? (live ? 'live' : 'pending') : 'done';
  if(st === 'bye' && m.a && !m.b){ const c = cmap(S)[m.a]; return `<div class="mc bye mbye" data-match="${m.id}">${c ? `<a data-id="${c.id}">${esc(c.name)}</a>` : '—'}<small>bye →</small></div>`; }
  const label = m.id.startsWith('P') ? `Prelim ${m.round} · ${m.id.split('-')[1]}` : m.id === 'EX' ? 'License bout' : (m.root ? 'Last match' : `Round ${m.round} · M${m.id.split('-')[1]}`);
  return `<div class="mc ${st}${m.fatal ? ' fatal' : ''}" data-match="${m.id}"><div class="mh"><span>${label}</span><span>${st === 'bye' ? '' : st === 'live' ? 'Live' : st === 'pending' ? 'Pending' : m.fatal ? 'Fatal' : ''}</span></div>
    ${fighterRow(m, 'a', known.a)}${m.bye && !m.examiner && !m.b ? fighterRow(m, 'b', true) : fighterRow(m, 'b', known.b)}
    ${st === 'done' ? matchStory(m.id) : ''}</div>`;
}
// the log lines that belong to one bout: build-up, result, examiner remarks, aftermath
let MLOG = {key: null, map: {}};
function matchStory(id){
  const key = S.edition + ':' + S.log.length;
  if(MLOG.key !== key){ const map = {}; S.log.forEach(e => { if(e.mt) (map[e.mt] = map[e.mt] || []).push(e); }); MLOG = {key, map}; }
  const ev = (MLOG.map[id] || []).filter(e => !/^(Preliminary: there is no second chance here|.+ meet in the preliminary\. One of them goes home tonight)/.test(e.text));
  if(!ev.length) return '';
  const one = e => `<div class="ev ${e.type}"><span class="txt">${linkNames(e.text.replace(/^(Round \d+|Preliminary|Last match|Fatal Duel): /, '').replace(/ in (?:round \d+|the preliminary round)(?= and was disqualified)/, '').replace(/ \S+ is out of the exam\.$/, '').replace(/, after .+? vs .+?: /, ': ').replace(/ \(#\d+\) loses the last match and is the one finalist who does not pass\./, ' is the one finalist who does not pass.'), e.ids)}</span></div>`;
  const ki = (() => { for(let k = ev.length - 1; k >= 0; k--) if(/concede|surrender|passes|is a Hunter|license goes|does not pass|disqualif|kill|dies|beats|wins/i.test(ev[k].text)) return k; return ev.length - 1; })();
  const rest = ev.filter((_, k) => k !== ki);
  return `<div class="mstory">${one(ev[ki])}${rest.length ? `<details class="mmore"><summary>The bout</summary>${rest.map(one).join('')}</details>` : ''}</div>`;
}

function starCupHtml(){
  const C = S.starCup; if(!C || RP.active) return '';
  const m = cmap(S), nm = id => m[id] ? `<a data-id="${id}">${esc(m[id].name)}</a>` : '—';
  const card = (x, lab) => { const row = id => `<div class="sr${id === x.w ? ' w' : ''}"><span>${nm(id)} <small>#${m[id] ? m[id].reg : ''}</small></span><small>${id === x.w ? 'Wins' : 'Out'}</small></div>`;
    return `<div class="sc"><div class="sh"><span>${lab}</span><span>${esc(x.how)}</span></div>${row(x.a)}${row(x.b)}${x.tale ? `<details class="mmore sc-tale"><summary>The bout</summary><p>${autoLink(esc(x.tale))}</p></details>` : ''}</div>`; };
  const semis = C.matches.filter(x => x.round !== 'Final'), fin = C.matches.find(x => x.round === 'Final');
  const byeId = C.seeds && C.seeds.length === 3 ? C.seeds[0] : null;
  const left = semis.map((x, i) => card(x, 'Semi-final ' + (i + 1))).join('') + (byeId ? `<div class="sc"><div class="sh"><span>Bye</span><span>best of the exam</span></div><div class="sr w"><span>${nm(byeId)}</span><small>Bye →</small></div></div>` : '');
  const champ = C.champ ? `<div class="sc champ"><div class="cst">★</div><small>Centennial Star</small><b>${nm(C.champ)}</b><small>starts as a ★ Hunter</small></div>` : '';
  return `<div><div class="section-h">The Centennial Star</div><p class="muted" style="margin:-2px 0 10px;font-size:13px;max-width:75ch">The best new Hunters of the centenary fight once more. No license is at stake: the winner starts ${PR(m[C.champ] || {}).their} career with a star.</p>
    ${C.solo ? `<div class="scup"><div class="col"></div><div class="col"></div><div class="col">${champ}</div></div>` : `<div class="scup">${left ? `<div class="col"><small>Semi-finals</small>${left}</div>` : ''}<div class="col"><small>Final</small>${fin ? card(fin, 'Final') : ''}</div><div class="col"><small>Champion</small>${champ}</div></div>`}</div>`;
}
function renderBracket(){
  const el = $('pane-phase'), B = S.bracket;
  if(!B){ el.innerHTML = '<div class="empty">No bracket was played this year.</div>'; return; }
  const st = S.stats.find(s => s.p === FINAL_P);
  // --- bracket geometry
  const CW = 236, GAP = 54, SLOT = 112, CH = 96;
  const drawTree = G => {
  const R = G.rounds.length, M1 = R ? G.rounds[0].length : 0;
  const W = R * CW + (R - 1) * GAP, H = Math.max(M1, 1) * SLOT;
  const cy = (r, j) => (j + 0.5) * SLOT * 2 ** r;
  let cards = '', lines = '';
  const B = G;
  G.rounds.forEach((round, r) => round.forEach((m, j) => {
    const x = r * (CW + GAP), y = cy(r, j) - CH / 2;
    const known = r === 0 ? {a:true, b:true} : {a: revealed(B.rounds[r-1][2*j]), b: revealed(B.rounds[r-1][2*j+1])};
    const on = revealed(m) && (m.l || m.bye) ? 1 : 0;
    cards += `<div class="slot" data-r="${r}" data-j="${j}" data-on="${on}" style="left:${x}px;top:${y}px;width:${CW}px">${matchCard(m, known)}</div>`;
  }));
  const heads = G.rounds.map((round, r) => `<span style="left:${r * (CW + GAP)}px;width:${CW}px">${r === R - 1 ? 'Last match' : 'Round ' + (r + 1)}</span>`).join('');
  return R ? `<div class="bwrap"><div class="bheads" style="width:${W}px">${heads}</div><div class="bracket" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}" aria-hidden="true">${lines}</svg>${cards}</div></div>` : '';
  };
  const trees = B.groups ? B.groups.map(g => `<div class="section-h" style="margin-top:14px">${esc(g.name)}${g.eliminated && !hiddenFinal().has(g.eliminated) ? ` <span class="muted" style="font-weight:400">· one falls here</span>` : ''}</div>${g.solo ? `<div class="pre">${matchCard(g.solo, {a:true,b:true})}</div>` : ''}${drawTree(g)}`).join('') : drawTree(B);
  const prelim = B.prelim.length ? `<div><div class="section-h">Preliminary round</div><p class="muted" style="margin:-2px 0 10px;font-size:13px;max-width:75ch">Too many finalists for the bracket, so the ones with the weakest exam record fight first. No second chances here: every loser in this round leaves the exam, and only the winners move on to the bracket.</p><div class="pre">${B.prelim.map(m => matchCard(m, {a:true, b:true})).join('')}</div></div>` : '';
  const solo = B.solo ? `<div><div class="section-h">License bout</div><div class="pre">${matchCard(B.solo, {a:true,b:true})}</div></div>` : '';
  // --- outcome
  const hide = hiddenFinal();
  const fin = S.candidates.filter(c => c.out === FINAL_P || (c.status === 'Approved'));
  const passed = S.candidates.filter(c => c.status === 'Approved' && !hide.has(c.id));
  const outF = S.candidates.filter(c => c.out === FINAL_P && c.status === 'Eliminated' && !hide.has(c.id) && !B.prelim.some(m => m.l === c.id || m.dq === c.id));
  const removed = S.candidates.filter(c => c.out === FINAL_P && (c.status === 'Deceased' || c.status === 'Disqualified'));
  const lineFor = licLines(passed);
  const howPassed = c => lineFor[c.id] || '';
  const mates = c => (c.bonds || []).map(b => passed.find(o => o.id === b.id)).filter(Boolean);
  const hlF = highlights(S), lic = c => licCardHtml(c, howPassed(c), hlF);
  const row = (c, k, why) => `<a class="orow ${k}" data-id="${c.id}"><b>${esc(c.name)}</b><small>${esc(why)}</small></a>`;
  const outWhy = c => clean(c.reason || '').replace(/^Final Tournament: /, '').replace(/^lost the last match of the bracket and was the only finalist left without a win$/, 'Lost the last match: the one finalist who does not pass');
  const outcome = `<div class="outcome">
    <div class="ofull"><div class="section-h">New Hunters · ${passed.length}</div><div class="cards">${passed.map(lic).join('') || '<span class="muted">No one has passed yet.</span>'}</div></div>
    </div>`;   // who lost, died or was disqualified is already in the bracket above
  el.innerHTML = `<div class="rep-head"><div><h2>Final Tournament</h2>${phTests(PHASES[FINAL_P])}${PHASES[FINAL_P].ex ? `<div class="exline">${exChip(PHASES[FINAL_P].ex)}</div>` : ''}</div>
</div>
    ${(() => { const lost = S.candidates.filter(c => c.out === FINAL_P && !hide.has(c.id) && /last match/i.test(c.reason || '')); const dq = removed.length;
      return passed.length ? `<p class="fin-sum"><b>${passed.length} new Hunter${passed.length === 1 ? '' : 's'}</b>${lost.length ? ` · ${lost.map(c => `<a data-id="${c.id}">${esc(c.name)}</a>`).join(', ')} ${lost.length === 1 ? 'fails' : 'fail'} the last match` : ''}${dq ? ` · ${dq} removed for killing or dying` : ''}</p>` : ''; })()}
    <details class="fin-rules"><summary>How the final works</summary><p class="muted" style="margin:6px 0 0;max-width:75ch">${B.groups ? `The Jubilee splits the finalists into four brackets that run side by side, each with its own last match. ` : ``}Win one match and you pass; lose and you fight again. Only the finalist who loses the last match fails. The best performers of the exam start in round 1, with more chances.</p></details>
    ${prelim}${solo}
    ${trees}
    ${starCupHtml()}
    ${outcome}`;
  layoutBracket(CW, GAP);
  const lx = $('lx'); if(lx) lx.scrollTop = lx.scrollHeight;
}
// cards grow with their story, so place them by their real height: first round stacked, later rounds centred on the two matches feeding them
let BRK = [210, 46];
document.addEventListener('toggle', e => { if(e.target.classList && e.target.classList.contains('mmore')) layoutBracket(...BRK); }, true);
function layoutBracket(CW, GAP){ BRK = [CW, GAP]; document.querySelectorAll('#pane-phase .bracket').forEach(box => layoutOne(box, CW, GAP)); }
function layoutOne(box, CW, GAP){
  const slots = [...box.querySelectorAll('.slot')], byR = {};
  slots.forEach(el => (byR[el.dataset.r] = byR[el.dataset.r] || [])[+el.dataset.j] = el);
  const rounds = Object.keys(byR).map(Number).sort((a, b) => a - b), V = 18;
  const centre = {};
  let bottom = 0;
  rounds.forEach(r => {
    let floor = 0;
    byR[r].forEach((el, j) => {
      if(!el) return;
      const h = el.offsetHeight || 96;
      let c = r === 0 ? floor + h / 2 : (() => { const a = centre[(r - 1) + ':' + 2 * j], b = centre[(r - 1) + ':' + (2 * j + 1)]; return a !== undefined && b !== undefined ? (a + b) / 2 : a ?? b ?? floor + h / 2; })();
      if(c - h / 2 < floor) c = floor + h / 2;   // never overlap the card above
      el.style.top = (c - h / 2) + 'px';
      centre[r + ':' + j] = c; floor = c + h / 2 + V; bottom = Math.max(bottom, c + h / 2);
    });
  });
  let lines = '';
  rounds.slice(0, -1).forEach(r => byR[r].forEach((el, j) => {
    if(!el) return;
    const x1 = r * (CW + GAP) + CW, x2 = x1 + GAP, xm = x1 + GAP / 2, y1 = centre[r + ':' + j], y2 = centre[(r + 1) + ':' + Math.floor(j / 2)];
    if(y2 !== undefined) lines += `<path class="ln${el.dataset.on === '1' ? ' on' : ''}" d="M${x1} ${y1} H${xm} V${y2} H${x2}"/>`;
  }));
  box.style.height = (bottom + 8) + 'px';
  const svg = box.querySelector('svg'); svg.setAttribute('height', bottom + 8); svg.innerHTML = lines;
}
function renderStatsOnly(){
  const k = counts();
  const v = document.querySelectorAll('#stats .stat b');
  if(v.length >= 6){ v[1].textContent = fmt(k.active); v[2].textContent = fmt(k.elim); v[3].textContent = fmt(k.dead); v[4].textContent = k.appr; }
}

/* ---------- Zevil Island dashboard ---------- */
let zDay = null;
// the most dramatic event of a phase, by type, engine drama weight and whether favorites are involved
const DRAMA_W = {secret:8, bond:6, death:10, betray:8, sabot:7, arc:6, event:5, rescue:5, rival:5, family:4, elim:4, major:3, help:3, split:3, ally:2, veteran:2, story:2, duel:2, fight:3, team:1, info:1};
function momentOf(ev){
  let best = null, bs = 0;
  ev.forEach((e, i) => {
    if(!DRAMA_W[e.type] || e.type === 'info' || e.type === 'team') return;
    let sc = (e.dr || DRAMA_W[e.type]) + ((e.ids || []).some(isFav) ? 3 : 0) + (/killed|dies|died|betray|caught/i.test(e.text) ? 2 : 0) + (nhashUI(e.text) % 100) / 1000;
    if(e.d) sc -= 1.5;
    if(sc > bs){ bs = sc; best = e; }
  });
  return bs >= 4 ? best : null;
}
const nhashUI = s => { let h = 2166136261; for(const ch of String(s)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function renderZevil(st){
  const el = $('pane-phase'), Z = S.zevil, map = byIdMap();
  const last = LIVE_CAP != null ? Math.min(Z.days.length - 1, LIVE_CAP) : Z.days.length - 1;
  if(zDay === null || zDay > last) zDay = last;   // open on the latest day; the day buttons rewind
  const snap = Z.days[zDay];
  const val = (id, b) => (b === id || b === Z.targets[id]) ? 3 : 1;
  const pts = id => (snap.hold[id] || []).reduce((s, b) => s + val(id, b), 0);
  const reg = id => map[id] ? map[id].reg : '?';
  const rows = Z.ids.map(id => ({c: map[id], p: pts(id), b: snap.hold[id] || []})).sort((x, y) => y.p - x.p || y.b.length - x.b.length || x.c.reg - y.c.reg);
  const end = zDay === Z.days.length - 1 && LIVE_CAP == null;
  const badge = (id, b) => { const v = val(id, b); const kind = b === id ? 'own' : b === Z.targets[id] ? 'tgt' : 'any';
    return `<span class="bdg ${kind}" title="Badge #${reg(b)} · ${v} pt${v>1?'s':''}${kind === 'own' ? ' · own' : kind === 'tgt' ? ' · target' : ''}">${reg(b)}</span>`; };
  const bar = p => `<div class="zbar"><i style="width:${Math.min(100, p/6*100)}%" class="${p >= 6 ? 'ok' : ''}"></i></div>`;
  const left = 7 - zDay;
  const days = Z.days.filter(d => d.day <= last).map(d => `<button class="zd" data-zday="${d.day}" aria-pressed="${d.day === zDay}">${d.day === 0 ? 'Arrival' : 'Day ' + d.day}</button>`).join('');
  const qualifying = rows.filter(r => r.p >= 6).length;
  const lead = rows.slice(0, 10).map((r, k) => `<div class="lb"><span class="rk">${k+1}</span><a data-id="${r.c.id}">${esc(r.c.name)}</a><span class="lp">${r.p} pt${r.p===1?'':'s'}</span>${bar(r.p)}</div>`).join('');
  const feed = Z.ev.filter(e => e.day === zDay).map(e => `<div class="ev ${e.type}"><span class="txt">${linkNames(e.text.replace(/^(Day \d+|Arrival): /, ''), e.ids)}</span></div>`).join('');
  // one standings table: everyone ranked, the ones you follow always shown, the rest behind a toggle
  const keep = r => isFav(r.c.id) || !!mtOf(r.c.id);
  const zrow = (r, k) => { const gone = (snap.gone || {})[r.c.id], out = (end && zDay > 0 && r.p < 6) || gone, al = (snap.allies && snap.allies[r.c.id]) || [];
    return `<div class="zr ${gone === 'Deceased' ? 'dead' : out ? 'out' : r.p >= 6 ? 'ok' : ''}"><span class="rk">${k + 1}</span><span class="zn"><a data-id="${r.c.id}">${esc(r.c.name)}</a>${al.length ? `<small>with ${al.map(id => map[id] ? esc(map[id].first) : '').join(', ')}</small>` : ''}</span><span class="inv">${invOf(r)}</span><span class="zpts">${bar(r.p)}<b>${r.p}</b><small>/6</small></span><span class="zst">${gone === 'Deceased' ? 'Killed' : gone ? 'DQ' : out ? 'Out' : r.p >= 6 ? (end ? 'Through' : 'Safe') : ''}</span></div>`; };
  // every row shows its own badge and its target, held or not, then whatever else was taken
  const invOf = r => { const id = r.c.id, tg = Z.targets[id], has = b => r.b.includes(b);
    const slot = (b, kind, missT) => has(b) ? badge(id, b) : `<span class="bdg ${kind} miss" title="${missT}">${reg(b)}</span>`;
    return slot(id, 'own', `Own badge #${reg(id)} · ${zDay ? 'taken by someone' : 'held'}`) + (tg ? slot(tg, 'tgt', `Target #${reg(tg)} · not taken yet`) : '') + r.b.filter(b => b !== id && b !== tg).map(b => badge(id, b)).join(''); };
  const TOP = 10, vis = rows.map((r, k) => [r, k]).filter(([r, k]) => k < TOP || keep(r)), hid = rows.map((r, k) => [r, k]).filter(([r, k]) => !(k < TOP || keep(r)));
  const table = `<div class="ztab">${vis.map(([r, k]) => zrow(r, k)).join('')}</div>${hid.length ? `<details class="zall"><summary>Show all ${rows.length}</summary><div class="ztab">${hid.map(([r, k]) => zrow(r, k)).join('')}</div></details>` : ''}`;
  el.innerHTML = `<div class="rep-head"><div><h2>Zevil Island</h2><p class="pdesc">${esc(PREVIEW['zevil'] || '')}</p>${phTests(PHASES.find(x => x.zevil))}${PHASES.find(x => x.zevil).ex ? `<div class="exline">${exChip(PHASES.find(x => x.zevil).ex)}</div>` : ''}</div>
      <div class="rep-nums"><span><b>${st.before}</b>landed</span><span><b>${qualifying}</b>${end ? 'qualified' : 'holding 6+'}</span>${end ? `<span class="out"><b>${st.before - st.after}</b>eliminated</span>` : ''}</div></div>
    <div class="zhead"><div class="zdays">${days}</div><div class="zcount"><b>${left}</b> day${left === 1 ? '' : 's'} remaining</div></div>
    <div class="rep-grid">
      <div class="rep-col">
        <div><div class="section-h">Event feed · ${zDay === 0 ? 'arrival' : 'day ' + zDay}</div><div class="story scroll log zfeed">${feed || '<div class="muted" style="padding:10px">A quiet day on the island.</div>'}</div></div>
      </div>
      <div class="rep-col">
        <div><div class="section-h">Standings · ${zDay === 0 ? 'on arrival' : end ? 'final' : 'end of day ' + zDay}</div><p class="zkey"><span class="bdg own">#</span><span class="bdg tgt">#</span> own or target 3 pts · <span class="bdg any">#</span> other 1 pt · <span class="bdg tgt miss">#</span> not held · 6 to qualify</p>${table}</div>
      </div>
    </div>`;
}

function exChip(ex){
  const st = EX_STYLES[ex.style] || {};
  // the style badge already names the style, so the description drops its leading word and the dashes
  const d = (st.desc || '').replace(new RegExp('^' + ex.style + '\\s*—\\s*', 'i'), ''), desc = d ? d.charAt(0).toUpperCase() + d.slice(1) + '.' : '';
  return `<span class="exs ${ex.style}" title="${esc(ex.style)} examiner">Examiner</span> ${ex.license ? `<a data-hunter="${esc(ex.license)}">${esc(ex.name)}</a> <span class="muted">${esc(ex.career || 'Hunter')}, ${ex.from ? `licensed in the ${ordinal(ex.from)}` : 'a veteran'}. ${esc(desc)}</span>` : `<b>${esc(ex.name)}</b> <span class="muted">${esc(desc)}</span>`}`;
}
// not betting, not mentoring yet: one quiet line instead of two banners
function renderPhase(){ renderPhase0(); const sh = scoutHtml(), mh = mentorHtml(); let x = mh + sh + scDoubleHtml();
  // both closed before the start: the two tickets sit side by side under one line of invitation
  const pre = h => /class="scout sc-bar sc-ticket[^"]*\bpre\b/.test(h);
  const mini = h => /class="mini-tk/.test(h);
  if(mini(sh) && mini(mh)) x = `<div class="mini-row">${mh}${sh}</div>` + scDoubleHtml();
  else if(pre(sh) && pre(mh)) x = `<div class="stake-row"><div class="sr-t">${!HISTORY.length && !MENTOR.made ? 'Press <b>Run</b> to watch the exam unfold, or take a stake.' : 'Want a stake?'} <span class="muted">Place it before the first trial.</span></div>${mh}${sh}</div>` + scDoubleHtml();
  const pane = $('pane-phase'), rh = pane.querySelector('.rep-head');
  if(rh){ rh.insertAdjacentHTML('afterend', S.started ? mtReportHtml(selPhase) + '<div class="favstrip" id="favstrip" hidden></div>' + x : '<div class="favstrip" id="favstrip" hidden></div>' + x + mtReportHtml(selPhase)); renderFavStrip(); }
  else if(x || mtReportHtml(null)) pane.insertAdjacentHTML('afterbegin', S.started ? mtReportHtml(null) + x : x + mtReportHtml(null));
  if(x) scAnimate();
  requestAnimationFrame(keepAnchor);
  mtCtlRender(); }
function renderLive(el){
  const L = S.live, P = livePreview(), R0 = S, rp = {...RP}, g = L.kind === 'final' ? liveGate() : null;
  try {
    S = P.S;
    if(L.kind === 'zevil'){ LIVE_CAP = L.day; if(zDay === null || zDay > L.day) zDay = L.day; const st = S.stats.find(x => x.p === L.p) || {before: S.zevil.ids.length, after: 0}; renderZevil(st); }
    else { Object.assign(RP, {active: true, idx: g ? g.m.seq : 1e9, ex: 0, view: g ? g.m.id : null}); renderBracket(); }
  } finally { S = R0; LIVE_CAP = null; Object.assign(RP, rp); }
}
// the exam that never finished: a halted-exam banner, the count, who held, the examiners who became the rescue, and a wall for the dead
const CAT_SFX = {quake: 'ゴゴゴ', breach: 'ズン', siege: 'バン', tide: 'ドドド', fire: 'ゴォォ', flood: 'ザザァ'};
const CAT_KANJI = {quake: '震', breach: '異', siege: '襲', tide: '獣', fire: '炎', flood: '水'};
const CAT_ICON = {quake: '⚡', breach: '◉', siege: '⌖', tide: '⚔', fire: '🔥︎', flood: '≈'};
function renderCat(el, i){
  const C = S.cat, cm = cmap(S);
  if(i > C.p){ el.innerHTML = `<div class="cat-never"><span class="cat-k">Never held</span><b>${esc(PHASES[i].name)}</b><p>The ${ordinal(S.edition)} Hunter Exam ended in ${esc(C.name.toLowerCase())}. This trial never took place.</p></div>`; return; }
  const ev = S.log.filter(e => e.p === i), impact = ev.find(e => e.text === C.impact) || ev.find(e => e.type === 'major' && !(e.ids || []).length);
  const banner = `<div class="cat-ban"><i class="cat-fx" aria-hidden="true"></i><i class="cat-sfx" aria-hidden="true">${CAT_SFX[C.k] || 'ドン'}</i><i class="cat-kanji" aria-hidden="true">${CAT_KANJI[C.k] || '災'}</i>
    <div class="cat-ban-in"><span class="cat-k">${C.stage === 'done' ? `The ${ordinal(S.edition)} Hunter Exam · catastrophe` : 'Catastrophe · now'}</span><h2>${esc(C.name)}</h2>
    ${impact ? `<p class="cat-cap">${linkNames(impact.text, [])}</p>` : ''}</div><span class="cat-stamp">${C.stage === 'done' ? 'Exam ended' : 'Exam halted'}</span></div>`;
  let body = '';
  if(C.stage === 'impact'){
    const L = mtHere().filter(({c}) => c.status === 'Active');
    body = L.length ? `<div class="cat-call"><div class="cat-call-h"><span class="cat-alarm" aria-hidden="true"></span>Your apprentices are in there · one call each</div>${L.map(({a, c}) => `<div class="cat-row"><a data-id="${c.id}">${esc(c.first || c.name)}</a><span>${Object.entries(CAT_CALL).map(([k, o]) => `<button type="button" class="btn small${C.mt[c.id] === k ? ' on' : ''}" data-catcall="${c.id}" data-k="${k}">${o.l}</button>`).join('')}</span></div>`).join('')}<p class="cat-hint"><b>Run</b> the safest, and no chance of a license · <b>Help others</b> the usual risk, a chance to be remembered · <b>Hold the line</b> the most dangerous, and the best chance to be licensed for it</p></div>`
      : `<p class="cat-wait">Nobody knows yet who made it out. Run the aftermath.</p>`;
  } else {
    const heroes = (C.heroes || []).map(id => cm[id]).filter(Boolean), deadC = S.candidates.filter(c => c.status === 'Deceased' && c.out === i);
    const heroLine = c => { const e = ev.find(x => x.type === 'major' && (x.ids || [])[0] === c.id); return e ? linkNames(e.text, e.ids) : `<a data-id="${c.id}">${esc(c.name)}</a> was there when it mattered.`; };
    const after = impact ? ev.slice(ev.indexOf(impact) + 1) : ev, exLines = after.filter(e => !(e.ids || []).length && e.type !== 'phase' && e.type !== 'examiner' && !/candidates died in|candidates run|scatter/.test(e.text));
    const deathScenes = ev.filter(e => e.type === 'death' && (e.ids || []).length);
    const count = (n, l, k) => `<div class="cat-n ${k}"><b>${fmt(n)}</b><span>${l}</span></div>`;
    body = `<div class="cat-nums">${count(heroes.length, 'licensed for it', 'gold')}${count(C.dead || 0, 'dead', 'red')}${count(C.fled || 0, 'fled', 'grey')}${count((C.ex || []).length, 'examiners in the rescue', 'blue')}</div>`
      + (heroes.length ? `<div class="section-h">Who held</div><div class="cat-heroes">${heroes.map(c => `<div class="cat-hero"><span class="cat-cross">✚</span><p>${heroLine(c)}</p></div>`).join('')}</div>` : `<div class="cat-none">Nobody earned a license. Some days nobody does.</div>`)
      + ((C.ex || []).length ? `<div class="section-h">The examiners</div><div class="cat-exam"><div class="cat-roster">${C.ex.map(x => `<span class="${x.died ? 'dead' : ''}">${x.died ? '✝ ' : ''}${hLic(x.license) ? `<a data-hunter="${esc(x.license)}">${esc(x.name)}</a>` : esc(x.name)}</span>`).join('')}</div>${exLines.map(e => `<p>${linkNames(e.text, [])}</p>`).join('')}</div>` : '')
      + `<div class="section-h">The fallen · ${fmt(deadC.length)}</div><div class="cat-wall">${deathScenes.map(e => `<p class="cat-ds">${linkNames(e.text, e.ids)}</p>`).join('')}<div class="cat-names">${deadC.slice(0, 80).map(c => `<a data-id="${c.id}">${esc(c.name)}</a>`).join('')}${deadC.length > 80 ? `<span class="more">and ${fmt(deadC.length - 80)} more</span>` : ''}</div></div>`
      + (heroes.length ? `<div class="section-h">New Hunters · ${heroes.length}</div><div class="cards">${heroes.map(c => licCardHtml(c, '', [])).join('')}</div>` : '');
  }
  el.innerHTML = `<div class="cat-page k-${C.k}">${banner}${body}</div>`;
  el.querySelectorAll('[data-catcall]').forEach(b => b.onclick = () => { C.mt[b.dataset.catcall] = b.dataset.k; save(); renderCat(el, i); });
}
function renderPhase0(){
  const el = $('pane-phase');
  if(S.live && !S.finished && selPhase === S.live.p) return renderLive(el);
  const i = selPhase;
  if(S.cat && S.cat.stage && i !== null && i >= S.cat.p){ renderCat(el, i); return; }
  const st = i === null ? null : S.stats.find(s => s.p === i);
  if(!st){
    const n = S.finished ? null : S.phase;
    if(n === null){ el.innerHTML = '<div class="empty">Pick a trial above.</div>'; return; }
    const ph = PHASES[n];
    el.innerHTML = `<div class="rep-head"><div><h2>${esc(ph.name)}</h2><p class="pdesc">${esc(PREVIEW[ph.id] || '')}</p>${phTests(ph)}${ph.ex ? `<div class="exline">${exChip(ph.ex)}</div>` : ''}</div>
      <div class="rep-nums"><span><b>${fmt(counts().active)}</b>will take part</span></div></div>`;
    return;
  }
  if(PHASES[i].final){ renderBracket(); return; }
  if(PHASES[i].zevil && S.zevil && S.zevil.days.length){ renderZevil(st); return; }
  const ph = PHASES[i];
  const ev = S.log.filter(e => e.p === i);
  const allies = ev.filter(e => ['ally','betray','help','split','family'].includes(e.type));
  const teams = ev.filter(e => e.type === 'team');
  const vets = ev.filter(e => e.type === 'veteran');
  const duels = ev.filter(e => e.type === 'duel' || e.type === 'fight' || (e.type === 'major' && /defeats|took the target badge/.test(e.text)) || (ph.final && e.type === 'elim'));
  const rescues = ev.filter(e => e.type === 'rescue');
  const favs = ev.filter(e => e.type === 'fav');
  const moment = momentOf(ev);
  const key = ev.filter(e => e.type !== 'phase' && !/alliances? (form|forms) or grow/.test(e.text) && e !== moment && !e.d && e.type !== 'examiner' && e.type !== 'fav' && !duels.includes(e) && !allies.includes(e) && !teams.includes(e) && !rescues.includes(e));
  if(i === 0){ const tn = THEMES[S.theme || 'classic']; const k0 = key.findIndex(e => tn && e.text.startsWith(tn.name + ':')); if(k0 > 0) key.unshift(key.splice(k0, 1)[0]); const sp = key.filter(isOpening); if(sp.length) key.splice(0, key.length, ...sp, ...key.filter(e => !isOpening(e))); }
  const phRe = new RegExp(` (?:in|during) the ${PHASES[i].name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[.,;:!?)—]| \\()`, 'g');
  const trimPh = s => { const r = s.replace(phRe, ''); return /\w/.test(r) ? r : s; };
  const story = (arr, scroll, lite) => arr.length ? `<div class="story ${scroll ? 'scroll' : ''} ${lite ? 'lite' : ''}">${arr.map(e => `<div class="ev ${e.type}"><span class="txt">${evLine(e)}${foldTail(e)}</span></div>`).join('')}</div>` : '';
  // routine lines read as short entries: who, with whom, under what name
  const nm = id => { const c = cmap(S)[id]; return c ? `<a data-id="${c.id}">${esc(c.name)}</a>` : ''; };
  const evLine = e => {
    const ids = e.ids || [];
    if(e.type === 'ally' && /form an alliance/.test(e.text) && ids.length >= 2){ const m = e.text.match(/alliance(?::| —) ([^,.;(]+)/); if(m) return `<b>${esc(m[1].trim())}</b> <span class="muted">—</span> ${ids.map(nm).filter(Boolean).join(', ')}`; }
    if(e.type === 'rescue' && ids.length >= 2){ const m = e.text.match(/\(([^)]+)\)\.?$/); return `${nm(ids[0])} <span class="muted">→</span> ${nm(ids[1])}${m ? ` <span class="muted">· ${esc(m[1])}</span>` : ''}`; }
    return linkNames(trimPh(e.text), e.ids);
  };
  const sec = (title, body) => body ? `<div><div class="section-h">${title}</div>${body}</div>` : '';
  // the same sentence about different people reads once: "X keeps refusing… · +4 more: A, B, C, D"
  const cmF = cmap(S), shape = e => { let t = e.text; (e.ids || []).forEach(id => { const c = cmF[id]; if(c) t = t.split(c.name).join('N').split(c.first).join('N'); }); return t.replace(/\d+/g, '#'); };
  const foldSame = arr => { const by = {}, out = []; arr.forEach(e => { const k = shape(e); if(by[k]){ by[k].more.push(e); return; } by[k] = {e, more: []}; out.push(by[k]); }); return out.map(g => g.more.length >= 2 ? Object.assign({}, g.e, {fold: g.more}) : [g.e, ...g.more]).flat(); };
  const foldTail = e => e.fold ? ` <span class="ev-more">+${e.fold.length} more: ${e.fold.map(x => nm((x.ids || [])[0])).filter(Boolean).join(', ')}</span>` : '';
  // alliances: a one-line summary and the dramatic moments; routine joins stay folded away
  // veterans: identical lines fold into one, with every name linked
  const vetHtml = arr => {
    const groups = {}, cm = cmap(S);
    arr.forEach(e => { const c = cm[e.ids[0]], k = c && e.text.startsWith(c.name) ? e.text.slice(c.name.length) : null; if(k) (groups[k] = groups[k] || []).push(c); });
    const big = Object.entries(groups).filter(([, g]) => g.length >= 3);
    const rest = arr.filter(e => !big.some(([k, g]) => g.some(c => c.id === e.ids[0]) && e.text.endsWith(k)));
    const folded = big.map(([k, g]) => `<div class="story"><div class="ev veteran"><span class="txt">${g.length} veterans${k.replace(/^ has /, ' have ').replace(/ knows /, ' know ').replace(/ remembers /, ' remember ')}</span><div class="who" style="margin-top:6px;font-size:13px">${nameLinks(g)}</div></div></div>`).join('');
    return folded + story(rest, rest.length > 6, true);
  };
  // routine alliance news only names people worth following: strong or returning candidates, favourites, nicknames, future Hunters, bonds and secrets
  const cmN = cmap(S);
  const notable = c => c && (c.tier === 'Skilled' || c.tier === 'Elite' || attemptsOf(c) > 1 || c.nick || isFav(c.id) || c.status === 'Approved' || (c.bonds || []).length || (c.secret && c.secret.revealed) || c.crusher || c.kills);
  const worth = e => (e.ids || []).some(id => notable(cmN[id]));
  const eliteR = rescues.filter(e => { const r = cmN[e.ids[0]]; return r && r.tier === 'Elite'; }).slice(0, 2);
  const allyParts = all => {
    if(!all.length) return {sum: '', top: [], rest: [], hidden: 0};
    const arr = all.filter(e => worth(e) || /betray|turns on/i.test(e.text)), hiddenN = all.length - arr.length;
    const kind = e => /form an alliance/.test(e.text) ? 'form' : / joins /.test(e.text) ? 'join' : /turns down/.test(e.text) ? 'refuse' : e.type === 'family' && /registered together/.test(e.text) ? 'fam' : (e.type === 'split' || e.type === 'betray') ? 'twist' : 'help';
    const n = {}; all.forEach(e => { const k = kind(e); n[k] = (n[k] || 0) + 1; });
    const pl = (k, one, many) => n[k] ? `${n[k]} ${n[k] === 1 ? one : many}` : '';
    const sum = [pl('form', 'new alliance', 'new alliances'), pl('help', 'helping hand', 'helping hands'), pl('twist', 'split', 'splits and betrayals')].filter(Boolean).join(' · ');
    if(arr.length <= 4) return {sum, top: arr, rest: [], hidden: hiddenN};
    // the highlights should not read alike: one line per sentence pattern
    const pat = e => e.text.split(' — ')[0].replace(/[A-Z][\w'’-]*( [A-Z][\w'’-]*)*/g, 'N').replace(/\(.*?\)/g, '');
    const seenP = new Set(), top = arr.filter(e => kind(e) === 'twist').concat(arr.filter(e => kind(e) === 'form')).filter(e => { const k = pat(e); if(seenP.has(k)) return false; seenP.add(k); return true; }).slice(0, 4), rest = arr.filter(e => !top.includes(e));
    return {sum, top, rest, hidden: hiddenN};
  };
  // bonds, alliances and rescues are one story: who holds on to whom
  const bondsHtml = (bonds, allies) => {
    const AP = allyParts(allies), rr = rescues.filter(e => !eliteR.includes(e)), rW = rr.filter(worth), rShow = (rW.length ? rW : rr).slice(0, 8), rLeft = rr.length - rShow.length;
    const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    const sum = [bonds.length ? pl(bonds.length, 'unbreakable bond') : '', AP.sum, rr.length ? pl(rr.length, 'rescue') : ''].filter(Boolean).join(' · ');
    if(!sum) return '';
    const pair = e => (e.ids || []).length >= 2 ? `<span class="pair">${nm(e.ids[0])} <i>∞</i> ${nm(e.ids[1])}</span>` : `<span class="pair">${linkNames(trimPh(e.text), e.ids)}</span>`;
    const hl = bonds.slice(0, 1).concat(AP.top);
    const note = (n, w) => n ? `<p class="muted" style="font-size:12px;margin:6px 0 0">…and ${n} more ${w} among lesser-known candidates.</p>` : '';
    const rest = (bonds.length > 1 ? `<div class="sub-h">Bonds</div><div class="pairs">${bonds.slice(1).map(pair).join('')}</div>` : '')
      + (AP.rest.length || AP.hidden ? `<div class="sub-h">Alliances</div>${story(AP.rest, AP.rest.length > 8, true)}${note(AP.hidden, 'events')}` : '')
      + (rr.length ? `<div class="sub-h">Rescues</div>${story(rShow, false, true)}${note(rLeft, 'rescues')}` : '');
    return `<p class="ally-sum">${sum}</p>${hl.length ? story(hl) : ''}${rest ? `<details class="ally-more"><summary>Show all</summary>${rest}</details>` : ''}`;
  };

  // teams: one row each, the ones who made it first; your people always shown
  const teamsHtml = arr => {
    if(!arr.length) return '';
    const T = arr.map(e => { const m = e.text.match(/^Team (\d+)(?: · (.+?))? \((.+?)\) — led by (.+?)\. (.*)$/); if(!m) return null;
      const sp = m[5].match(/with (\d+)h to spare/), v = m[5].match(/(\d+) of (\d+) majority votes/);
      return {e, n: +m[1], name: m[2] || '', ok: !!sp, spare: sp ? +sp[1] : -1, votes: v ? `${v[1]}/${v[2]}` : '', ids: e.ids || []}; }).filter(Boolean);
    if(!T.length) return story(arr, true, true);
    T.sort((a, b) => b.spare - a.spare || a.n - b.n);
    const mine = t => t.ids.some(id => isFav(id) || mtOf(id)), first = id => { const c = cmF[id]; return c ? `<a data-id="${c.id}">${esc(c.first || c.name)}</a>` : ''; };
    const row = t => `<div class="tr ${t.ok ? 'ok' : 'out'}"><span class="tn"><b>Team ${t.n}</b>${t.name ? `<small>${esc(t.name)}</small>` : ''}</span><span class="tm">${t.ids.map(first).filter(Boolean).join(', ')}</span><span class="tv" title="Majority votes passed">${t.votes}</span><span class="tres">${t.ok ? `✓ ${t.spare}h to spare` : '✗ out of time'}</span></div>`;
    const vis = T.filter((t, k) => k < 6 || mine(t)), hid = T.filter(t => !vis.includes(t)), made = T.filter(t => t.ok).length;
    return `<p class="ally-sum">${made} of ${T.length} teams made it</p><div class="ttab">${vis.map(row).join('')}</div>${hid.length ? `<details class="zall"><summary>Show all ${T.length} teams</summary><div class="ttab">${hid.map(row).join('')}</div></details>` : ''}`;
  };
  // standouts: best performers in words, no numbers
  let stand = '';
  if(!ph.team && !ph.prisoner && !ph.final){
    const sc = S.candidates.filter(c => typeof c.scores[ph.id] === 'number').sort((x,y) => y.scores[ph.id] - x.scores[ph.id]).slice(0, 6);
    const lbl = c => ph.zevil ? `${c.badges.length} badge${c.badges.length===1?'':'s'}` : ['Led the field','2nd','3rd','4th','5th','6th'][sc.indexOf(c)];
    if(sc.length) stand = `<div class="standouts">${sc.map(c => `<div><a data-id="${c.id}">${esc(c.name)}</a><span>${lbl(c)}</span></div>`).join('')}</div>`;
  }
  const outs = S.candidates.filter(c => c.out === i && ['Eliminated','Deceased','Disqualified'].includes(c.status));
  const groups = {};
  outs.forEach(c => {
    let k = clean(c.reason).replace(/^[^:]+:\s*/, '').replace(/\s*\(team \d+\)/, '').replace(/; out of time.*$/, '').replace(/, missing the cut by a hair$/, '')
      .replace(/\b[A-Z][\w-]+(?: [A-Z][\w'’-]+)+['’]s\b/g, "a teammate's").replace(/\b(by|with|to|from|against) [A-Z][\w-]+(?: [A-Z][\w'’-]+)+\b/g, '$1 a rival');
    if(ph.prisoner) k = 'Lost both prisoner challenges';
    if(c.status === 'Deceased') return;   // the dead have their own list ("Lost in this trial")
    if(c.status === 'Disqualified'){ (groups['Disqualified for killing'] = groups['Disqualified for killing'] || []).push(c); return; }
    if(ph.zevil) k = c.badges.length === 0 ? 'All badges stolen' : 'Not enough badges';
    if(ph.final) k = /license bout/.test(c.reason) ? 'Lost the license bout to an examiner' : 'Lost a qualifying bout';
    (groups[k] = groups[k] || []).push(c);
  });
  const causeHtml = Object.entries(groups).sort((a,b) => b[1].length - a[1].length).map(([k, arr]) =>
    `<details class="cause"><summary><span>${esc(k.charAt(0).toUpperCase() + k.slice(1))}</span><b>${arr.length}</b></summary><div class="who">${nameLinks(arr)}</div></details>`).join('');
  const rescued = S.candidates.filter(c => c.notes.some(n => n.p === i && /rescued by/.test(n.text))).length;

  el.innerHTML = `<div class="rep-head"><div><h2>${esc(ph.name)}</h2><p class="pdesc">${esc(PREVIEW[ph.id] || '')}</p>${phTests(ph)}${ph.ex ? `<div class="exline">${exChip(ph.ex)}</div>` : ''}</div>
      ${(() => { const cut = st.before - st.after, dead = outs.filter(c => c.status === 'Deceased').length, pct = st.before ? st.after / st.before * 100 : 0;
        // one headline (who fell), the rest as context under a thin bar
        return `<div class="rn2"><div class="rn-h"><b>${fmt(st.after)}</b> of ${fmt(st.before)} go on</div><div class="rn-bar" role="img" aria-label="${Math.round(pct)}% go on"><i style="width:${pct}%"></i></div><div class="rn-s">${cut ? `${fmt(cut)} out` : 'nobody out'}${rescued ? ` · ${rescued} rescued` : ''}${dead ? ` <span class="rn-d" title="${dead} died">✝ ${dead}</span>` : ''}</div></div>`; })()}</div>
    <div class="rep-grid">
      <div class="rep-col">
        ${moment ? `<div class="moment"><span class="mo-h">Moment of the trial</span><p>${linkNames(moment.text, moment.ids)}</p></div>` : ''}
        ${(() => {
          // the phase in three layers: what mattered, the mood around it, and the bonds that formed
          const all = key.concat(eliteR), flav = all.filter(e => e.type === 'story'), bonds = all.filter(e => e.type === 'bond');
          const hi = all.filter(e => !flav.includes(e) && !bonds.includes(e)); { const tn = THEMES[S.theme || 'classic'], op = e => isOpening(e) || (tn && e.text.startsWith(tn.name + ':')); let at = 0; while(at < hi.length && op(hi[at])) at++; at = Math.max(1, at);
            const j = hi.findIndex(e => e.type === 'heir'); if(j > at) hi.splice(at, 0, hi.splice(j, 1)[0]);
            const co = hi.filter(e => e.type === 'castout'); co.forEach(e => hi.splice(hi.indexOf(e), 1)); hi.splice(at, 0, ...co); }   // the cast's falls come right after the opening   // an heir sits right after the trial's own opening line
          const hf = foldSame(hi), top = hf.slice(0, 5), more = hf.slice(5);
          return sec('What happened', story(top) + (more.length ? `<details class="ally-more"><summary>${more.length} more from this trial</summary>${story(more, more.length > 8, true)}</details>` : ''))
            + (flav.length ? `<div class="camp"><h4 class="camp-t">Around the camp</h4><p>${flav.map(e => linkNames(trimPh(e.text), e.ids)).join(' ')}</p></div>` : '')
            + sec('Bonds &amp; alliances', bondsHtml(bonds, ph.zevil ? [] : allies));
        })()}
        ${ph.zevil ? sec('Island log, day by day', story(ev.filter(e => allies.includes(e) || duels.includes(e)), true)) : ''}
        ${sec('Teams', teamsHtml(teams))}
        ${sec('Veterans', vetHtml(vets))}
        ${ph.zevil ? '' : sec(ph.final ? 'Bouts' : 'Duels', story(duels, true, true))}
      </div>
      <div class="rep-col">
        ${castStripHtml(i)}
        ${(() => {
          const mtShown = id => !MENTOR.off && mtOf(id), fc = S.candidates.filter(c => isFav(c.id) && !mtShown(c.id) && (c.out == null || c.out >= i));
          if(!fc.length) return '';
          const sc = S.candidates.filter(c => typeof c.scores[ph.id] === 'number').sort((x, y) => y.scores[ph.id] - x.scores[ph.id]);
          return sec('★ Your watchlist', `<div class="watch">${fc.map(c => { const r = sc.indexOf(c), out = c.out === i;
            return `<div><a data-id="${c.id}">${esc(c.name)}</a><span class="${out ? 'bad' : 'ok'}">${out ? (c.status === 'Deceased' ? 'died here' : c.status === 'Disqualified' ? 'disqualified' : 'eliminated') : r >= 0 ? `through · ${ordinal(r + 1)}` : 'through'}</span></div>`; }).join('')}</div>${story(favs.filter(e => !(e.ids || []).some(mtShown)), false, true)}`);
        })()}
        ${(() => { const d = outs.filter(c => c.status === 'Deceased'); return d.length ? sec('Lost in this trial', `<div class="lost">${d.map(c => `<div><a data-id="${c.id}">${esc(c.name)}</a> <span class="muted">${c.age}</span><small>${esc(clean(c.reason).replace(/^[^:]+:\s*/, ''))}</small></div>`).join('')}</div>`) : ''; })()}
        ${sec(ph.zevil ? 'Biggest badge hauls' : 'Standouts', stand)}
        ${sec('How they were eliminated', causeHtml ? `<div class="causes">${causeHtml}</div>` : outs.length ? '' : '<p class="muted" style="margin:0">Nobody was eliminated here.</p>')}
      </div>
    </div>`;
}

function renderLog(){
  const sel = $('logPhase');
  if(sel.dataset.ed != S.edition + ':' + PHASES.length){ sel.length = 1; PHASES.forEach((p,i) => sel.add(new Option(p.name, i))); sel.dataset.ed = S.edition + ':' + PHASES.length; }
  const t = $('logType').value, p = $('logPhase').value;
  // highlights leave out the routine traffic (alliance joins, helping hands, every single duel); picking a type shows everything of that type
  const ROUTINE = ['ally', 'help', 'split', 'family', 'rescue', 'duel', 'fight', 'trade', 'info', 'team', 'veteran'];
  $('logMode').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lm === logMode));
  $('logMode').hidden = !!t;
  const MTI = new Set(MENTOR.appr.filter(a => S.candidates.some(c => c.id === a.id)).map(a => a.id)), isMt = e => (e.ids || []).some(id => MTI.has(id));
  if(MTI.size && !sel.parentElement.querySelector('#logType option[value="mt"]')) $('logType').add(new Option('◆ Your apprentice', 'mt'), 1);
  // the apprentice's own beat closes each phase they ran, as a line of its own
  const beats = {}; MENTOR.appr.forEach(a => { if(a.trail && a.trail.ed === S.edition && MTI.has(a.id)) a.trail.ph.forEach(x => (beats[x.p] = beats[x.p] || []).push({p: x.p, type: 'mtbeat', text: x.say, ids: [a.id], b: x, nm: a.name})); });
  const LOG = []; S.log.forEach((e, i) => { LOG.push(e); const nx = S.log[i + 1]; if(beats[e.p] && (!nx || nx.p !== e.p)){ LOG.push(...beats[e.p]); delete beats[e.p]; } });
  Object.values(beats).forEach(b => LOG.push(...b));
  const rows = LOG.filter(e => !e.d && !(e.type === 'fav' && isMt(e)) && (e.type !== 'mtbeat' || !t || t === 'mt') && (!t || e.type === t || (t === 'fav' && (e.ids || []).some(isFav)) || (t === 'mt' && isMt(e))) && (p === '' || e.p == p) && (t || logMode === 'all' || !ROUTINE.includes(e.type) || (e.ids || []).some(isFav) || isMt(e))).reverse().slice(0, 400);
  // one heading per phase instead of the phase name on every line
  let last = null;
  // in highlights, a phase's new bonds fold into one line of pairs
  const cm = cmap(S), lk = id => cm[id] ? `<a data-id="${id}">${esc(cm[id].name)}</a>` : '';
  const bondsBy = {}; if(!t && logMode === 'hi') rows.forEach(e => { if(e.type === 'bond' && (e.ids || []).length >= 2) (bondsBy[e.p] = bondsBy[e.p] || []).push(e); });
  const shown = new Set();
  $('log').innerHTML = rows.length ? rows.map(e => {
    let body;
    if(bondsBy[e.p] && bondsBy[e.p].length > 2 && bondsBy[e.p].includes(e)){ if(shown.has(e.p)) return ''; shown.add(e.p); const B = bondsBy[e.p]; body = `<div class="ev bond"><span class="txt">${B.length} new unbreakable bonds: ${B.map(x => `${lk(x.ids[0])} & ${lk(x.ids[1])}`).join(' · ')}</span></div>`; }
    else if(e.type === 'mtbeat'){ const x = e.b, P = MT_POST.find(o => o.k === x.post); body = `<div class="ev mt-beat k-${x.k}"><span class="txt"><i>◆</i><a data-id="${e.ids[0]}">${esc(e.nm.split(' ')[0])}</a><em>${esc(e.text)}</em>${x.ap ? `<span class="mt-fx${x.ap.call === 'right' ? ' up' : x.ap.call === 'wrong' ? ' dn' : ''}">${esc(x.ap.l)}</span>` : P ? `<span class="mt-fx">${P.l}</span>` : ''}${x.k === 'ok' && x.rank ? `<span class="mt-pct">${ordinal(x.rank)} of ${fmt(x.n)}</span>` : ''}</span></div>`; }
    else body = `<div class="ev ${e.type}${isMt(e) ? ' mt-ev' : ''}"><span class="txt">${linkNames(e.text, e.ids)}</span></div>`;
    const hd = e.p !== last ? `<div class="log-ph"><span>${esc(PHASES[e.p].name)}</span><small>${rows.filter(x => x.p === e.p).length}</small></div>` : ''; last = e.p; return hd + body; }).join('')
    : `<div class="empty">${S.started ? 'No events match these filters.' : `${fmt(S.candidates.length)} applicants have registered. Press <b>Run</b> to begin.`}</div>`;
}
let logMode = 'hi';
$('logType').onchange = $('logPhase').onchange = renderLog;
$('logMode').onclick = e => { const b = e.target.closest('[data-lm]'); if(!b) return; logMode = b.dataset.lm; renderLog(); };

// what each new Hunter's exam was about: one story beat per license card, no two cards telling the same kind of story when there is a choice
function licLines(passed){
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const ages = passed.map(c => c.age), yMin = Math.min(...ages), yMax = Math.max(...ages);
  const beats = c => {
    const P = PR(c), f = c.first, N = c.notes || [], L = [];   // [weight, key, options]
    const add = (w, k, ...o) => L.push([w, k, o]);
    const nm = re => N.map(n => n.text.match(re)).filter(Boolean);
    const lineup = PHASES.map(x => x.id), b = background(c), A = attemptsOf(c);
    const resc = nm(/^(.+?): rescued by (?:ally )?(.+)$/)[0];
    if(resc) add(7, 'saved', `Would not be here without ${resc[2]}, who pulled ${P.them} through ${thePhase(resc[1])}.`, `${resc[2]} caught ${P.them} in ${thePhase(resc[1])}. ${f} owes ${P.their} license to that moment.`, `One bad moment in ${thePhase(resc[1])}, and ${resc[2]} was there.`);
    if((c.rescues || 0) >= 2) add(6, 'saver', `Pulled ${c.rescues} other candidates through on the way to ${P.their} license.`, `${c.rescues} candidates owe ${f} a favour now.`, `Kept stopping to help others${c.rescues === 2 ? ', twice' : `, ${c.rescues} times`}. Passed anyway.`);
    else if((c.rescues || 0) === 1){ const r = nm(/^(.+?): rescued (?:ally )?(?!by )(.+)$/)[0]; if(r) add(4, 'saver', `Stopped to save ${r[2]} in ${thePhase(r[1])}, and still made it.`, `Risked ${P.their} own exam for ${r[2]} in ${thePhase(r[1])}.`); }
    const bond = (c.bonds || [])[0];
    if(bond) passed.some(o => o.id === bond.id) ? add(5, 'bond', `Came through it side by side with ${bond.name}.`, `${f} and ${bond.name}: two licenses, one story.`, `Never far from ${bond.name}, from the first phase to the last.`) : add(6, 'bond', `Lost ${bond.name} along the way, and carried on for both of them.`, `This license is half ${bond.name}'s, as far as ${f} is concerned.`);
    if(A > 2) add(7, 'tries', `${cap(ordinal(A))} attempt. ${f} simply refused to stop coming back.`, `${A} exams, ${A - 1} failures, one license.`, `It took ${A} tries. Every one of them shows.`, `Most people quit after one try. ${f} came back ${A - 1} times.`);
    else if(A === 2){ const pb = prevBestAt(c); add(5, 'tries', pb ? `Fell in ${thePhase(pb.phaseName)} last year. Not this time.` : `Back for a second try, and it paid off.`, `A second attempt, and a different ending.`); }
    if(c.secret && c.secret.revealed) add(6, 'secret', `Arrived with a secret (${pro(SECRETS[c.secret.k].label, c).toLowerCase()}) and passed anyway.`, `Everyone knows ${P.their} secret now. ${cap(P.they)} passed regardless.`);
    if(c.kills) add(8, 'kill', `Licensed, with blood on ${P.their} hands.`, `Passed. Not everyone ${P.they} fought can say the same.`);
    if(c.trait === 'Underdog') add(6, 'under', `Nobody expected ${P.them} to get past the gate.`, `The least likely Hunter of the year, on paper.`);
    if(c.age === yMin && passed.length > 2) add(5, 'young', `The youngest of the new Hunters, at ${c.age}.`, `Only ${c.age}, and already a Hunter.`);
    if(c.age === yMax && passed.length > 2) add(4, 'old', `The oldest of the new Hunters, at ${c.age}.`, `At ${c.age}, proof that it is never too late.`);
    const led = nm(/^(.+?): excelled$/);
    if(led.length >= 3) add(5, 'ace', `Excelled in ${led.length} trials. Never really in danger.`, `Near the top in almost every trial.`, `Made the whole exam look easy.`);
    if(b.fear !== null && BG.fear[b.fear][1].some(x => lineup.includes(x))) add(4, 'fear', `Afraid of ${BG.fear[b.fear][0]}, and got through anyway.`, `Faced ${P.their} fear of ${BG.fear[b.fear][0]} and kept going.`);
    if(BG.talent[b.talent][1].some(x => lineup.includes(x))) add(3, 'talent', `${cap(pro(BG.talent[b.talent][0], c))}, and the exam found out.`);
    if(N.some(n => /^Sabotaged by/.test(n.text))) add(6, 'sab', `Survived a rookie crusher's sabotage.`, `Someone tried to end ${P.their} exam early. It did not work.`);
    if(N.some(n => /betrayed by/.test(n.text))) add(5, 'betray', `Betrayed on Zevil Island, and passed anyway.`, `Lost ${P.their} badge to an ally's betrayal, and still found a way.`);
    if(c.injury) add(4, 'hurt', `Finished the exam nursing a ${c.injury.w}.`, `Passed with a ${c.injury.w}. It will make a good story.`);
    const mo = MOTIVES[c.motive]; if(mo) add(2, 'motive', pro(`Came ${mo.m}. One step closer now.`, c), pro(`${f} came ${mo.m}. Now ${P.they} can.`.replace(/Now (\w+) can\.$/, 'The license changes everything.'), c));
    return L;
  };
  const lineFor = {}, usedK = new Set();
  passed.slice().sort((x, y) => Math.max(0, ...beats(y).map(z => z[0])) - Math.max(0, ...beats(x).map(z => z[0]))).forEach(c => {
    const pickB = beats(c).sort((x, y) => (y[0] - (usedK.has(y[1]) ? 5 : 0)) - (x[0] - (usedK.has(x[1]) ? 5 : 0)))[0];
    if(!pickB){ lineFor[c.id] = 'Quietly did everything right.'; return; }
    usedK.add(pickB[1]); lineFor[c.id] = pickB[2][nhashUI(c.id + ':lic') % pickB[2].length];
  });
  return lineFor;
}
// the one license card, the same in the Final Tournament and in Results
function licRoute(c){
  const out = [];
  PHASES.forEach((ph, p) => { if(p >= FINAL_P || !c.scores || c.scores[ph.id] == null) return;
    const sc = c.scores[ph.id], pool = S.candidates.filter(o => o.scores && o.scores[ph.id] != null), rank = pool.filter(o => o.scores[ph.id] > sc).length + 1;
    out.push({ph, rank, n: pool.length, q: rank / pool.length}); });
  return out;
}
function licCardHtml(c, line, hl){
  const R = licRoute(c), best = R.filter(r => r.n > 3 && r.ph.id !== 'zevil').sort((x, y) => x.q - y.q || x.rank - y.rank)[0], A = attemptsOf(c);
  const pip = r => `<i class="${r.rank <= 3 ? 'g' : r.q <= 0.1 ? 'hi' : r.q <= 0.5 ? 'mid' : ''}" title="${esc(r.ph.name)} · ${r.ph.id === 'zevil' ? `${c.points ?? c.scores.zevil} pts` : `${ordinal(r.rank)} of ${fmt(r.n)}`}"></i>`;
  const m = (c.reason || '').match(/(?:against|defeated) (.+?) by (.+?)\.?$/), sole = /^Sole finalist/.test(c.reason || '');
  const bout = m ? `${sole ? 'License bout' : /final match/.test(c.reason) ? 'Final' : (c.reason.match(/round \d+/) || ['Bout'])[0].replace(/^r/, 'R')}: beat ${m[1]} by ${m[2]}` : clean(c.reason || '');
  const ties = [], H = legendKnown(c) && hLic(c.hParent), ap = (MENTOR.appr || []).some(a => a.id === c.id);
  if(H) ties.push(`<span class="lt-lg">✦ ${c.gender === 'Female' ? 'Daughter' : c.gender === 'Male' ? 'Son' : 'Child'} of <a data-hunter="${esc(H.license)}">${esc(H.name)}</a></span>`);
  if(ap) ties.push(`<span class="lt-mt">◆ ${MENTOR.made ? 'Your apprentice' : `${esc(MENTOR.name || 'The Old Master')}'s apprentice`}</span>`);
  const bonds = (c.bonds || []).map(b => S.candidates.find(o => o.id === b.id)).filter(o => o && o.status === 'Approved');   // the ones who passed too; the rest are on the profile
  if(bonds.length) ties.push(`<span class="lt-bd">∞ ${bonds.map(o => `<a data-id="${o.id}">${esc(o.first || o.name)}</a>`).join(', ')}</span>`);
  const H2 = (hl || []).filter(x => x.id === c.id);
  return `<div class="license" data-id="${c.id}" tabindex="0">
    <div class="top"><small>HUNTER · ${ordinal(S.edition).toUpperCase()}</small><code title="Exam #${c.reg}">${licOf(c)}</code></div>
    <h3>${esc(c.name)}</h3>${c.nick ? `<p class="lnick" title="${esc(c.nickWhy || '')}">“${esc(c.nick)}”</p>` : ''}
    <p class="lmeta">${c.age} · ${esc(c.tier)}${c.career ? ` · <b>${esc(c.career)}</b>` : ''} · ${A > 1 ? `${ordinal(A)} attempt` : 'First try'}</p>
    ${H2.length || c.starCup === 'champion' || c.catHero ? `<div class="lhl">${c.catHero && S.cat ? `<span class="lcat">✚ ${esc(S.cat.tag)}</span>` : ''}${c.starCup === 'champion' ? '<span>★ Centennial Star</span>' : ''}${H2.map(x => `<span>★ ${esc(x.label.replace(/ \(.*\)$/, ''))}</span>`).join('')}</div>` : ''}
    <div class="tags">${topAttrs(c, 3).map(k => `<span class="tag">${ATTR_LABEL[k]}</span>`).join('')}</div>
    ${R.length ? `<div class="lroute"><span class="pips">${R.map(pip).join('')}<i class="fin" title="Final Tournament">⚔</i></span>${best ? `<span class="lbest">Best: ${ordinal(best.rank)} in ${esc(best.ph.name)}</span>` : ''}</div>` : ''}
    <p class="lbout">${c.catHero ? '✚' : '⚔'} ${esc(bout)}</p>
    ${line ? `<p class="lline">${esc(line)}</p>` : ''}
    ${c.nen ? `<div class="lnen">${nenChip(c.nen.category)}<span>${esc(c.nen.hatsu.alias || c.nen.hatsu.name)}</span></div>` : ''}
    ${ties.length ? `<div class="lties">${ties.join('')}</div>` : ''}
  </div>`;
}
const licOf = c => { const h = HUNTERS.find(x => x.cid === c.id); return h ? h.license : licenseId(S.edition, c.reg); };
/* results */
function renderResults(){
  const el = $('pane-results');
  if(!S.finished || RP.active){
    el.innerHTML = `<div class="empty">${RP.active ? 'Results appear when the tournament finishes.' : 'Results appear when the exam ends.'}</div>` + rulesHtml();
    return;
  }
  const ap = S.candidates.filter(c => c.status === 'Approved');
  const dead = S.candidates.filter(c => c.status === 'Deceased').length, dqs = S.candidates.filter(c => c.status === 'Disqualified').length;
  const chron = S.chronicle || chronicle(S);
  if(!S.paper){ S.paper = makePaper(S); save(); }
  // the outcome first (who got a license), then the story of the exam, then the numbers
  let h = scResultHtml() + mtResultHtml() + `<div class="section-h">${ap.length ? `${ap.length} new Hunter${ap.length === 1 ? '' : 's'}` : 'License cards'}</div>`;
  const hl = highlights(S), lines = licLines(ap);
  h += ap.length ? '<div class="cards">' + ap.map(c => licCardHtml(c, lines[c.id], hl)).join('') + '</div>'
    : `<div class="empty">No candidate earned a license this year.</div>`;
  if(hl.length) h += '<div class="section-h">Highlights</div><div class="hl">' + hl.map(x => `<div data-id="${x.id}"><small>${esc(x.label)}</small><b>${esc(x.name)}</b> <span class="regn">#${x.reg}</span><span>${esc(clean(x.detail).replace(/\s*\(\d+\)$/, '').replace(/^Lowest attribute total among Hunters$/, 'Least gifted on paper, still made it').replace(/^Total \d+, out at /, 'Highly gifted, out at ').replace(/^Score \d+$/, 'Led the field through the tunnels'))}</span></div>`).join('') + '</div>';
  h += paperHtml(S.paper, true) + `<details class="res-more chron"><summary>Read the chronicle of the ${ordinal(S.edition)} Hunter Exam</summary>${chron.map(p => `<p>${autoLink(esc(p))}</p>`).join('')}</details>`;
  h += '<details class="res-more"><summary>Phase by phase · the numbers</summary><div class="tablebox"><table><thead><tr><th>Phase</th><th>Entered</th><th>Advanced</th><th>Eliminated</th></tr></thead><tbody>' +
    S.stats.map(s => `<tr data-step="${s.p}" style="cursor:pointer"><td>${esc(PHASES[s.p].name)}</td><td class="num">${s.before}</td><td class="num">${s.after}</td><td class="num">${s.before - s.after}</td></tr>`).join('') + '</tbody></table></div></details>';
  el.innerHTML = h + rulesHtml();
}
function rulesHtml(){
  return `<div class="section-h" style="margin-top:8px">How it works</div><div class="rules">
  Every edition draws its own route: two or three preliminary trials, two or three endurance trials, a second phase (sometimes the Gourmet trial, sometimes an auction, a beast or a treasure hunt), a team trial (Trick Tower, a labyrinth or a river run) followed by duels, then <b>Zevil Island</b> and the <b>Final Tournament</b>. Trials are grouped into phases, and each trial has an <b>examiner</b> with a style — strict, lenient, physical, cerebral, cruel or unpredictable — that changes who gets through. Registered Hunters are sometimes called back to examine, usually the trial that matches their specialty (★ in the route).
  Each phase tests a mix of attributes, with some luck, and tired candidates do worse. Allies and families help each other; veterans remember trials they have seen before. On Zevil Island own and target badges are worth 3 points, any other 1; 6 points to pass. The Final Tournament is a reverse-elimination bracket: win once and you pass; the finalist who loses the last match fails.</div>`;
}


// the cast of this exam, as it stood after this trial: only those still in, kept as short as the standouts
function castStripHtml(i){
  const m = cmap(S), L = (S.castEver || []).filter(x => x.p <= i).map(x => m[x.id]).filter(c => c && !(c.out != null && c.out <= i && c.status !== 'Approved'));
  if(!L.length) return '';
  // the opening ones in the order the first trial's report shows them (moment first), then each newcomer in the trial they joined
  const tag = c => c.nick ? `“${c.nick}”` : (c.attempts || []).length > 1 ? 'returning' : c.hParent || c.heir ? 'heir' : c.crusher ? 'rookie crusher' : traitNoun(c.trait || '');
  return `<div><div class="section-h">Ones to watch</div><div class="standouts">${L.slice(0, 8).map(c => `<div><a data-id="${c.id}">${esc(c.name)}</a><span>${esc(tag(c))}</span></div>`).join('')}</div></div>`;
}
