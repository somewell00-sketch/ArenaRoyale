/* ---------- controls ---------- */
$('bStep').onclick = () => { if(mtNeedsChoice()){ mtAsk(); return; } if(S.live){ liveStep(); return; } zDay = null; ANCH = ANCH && ANCH.ph === S.phase ? ANCH : null; runFav(); selPhase = S.cat && S.cat.stage === 'impact' ? S.cat.p : lastDone(); save(); render(); showTab('phase'); mtToast(selPhase); if(!ANCH) toTrialTop(); };
$('bAll').onclick = () => { if(mtNeedsChoice()){ mtAsk(); return; } if(S.live) liveCommit(true); zDay = null; while(!S.finished && !mtNeedsChoice() && !(S.cat && S.cat.stage === 'impact' && S.cat.wait)) runFav(); selPhase = S.cat && S.cat.stage === 'impact' ? S.cat.p : lastDone(); save(); render(); showTab('phase'); if(mtNeedsChoice()) mtAsk(); else toTrialTop(); };
let CAT_NEXT = false;
$('bCat').onclick = () => { const b = $('bCat');
  if(S.cat){ b.textContent = 'This exam already has one'; return; }
  if(!S.started && !S.finished){ setupCatastrophe(S, makeRng((S.seed ^ 0xCA7) >>> 0)); save(); b.textContent = 'Set: this exam ✓'; }
  else { CAT_NEXT = true; b.textContent = 'Set: the next exam ✓'; } };
$('bMore').onclick = e => { e.stopPropagation(); const o = $('ctlExtra').classList.toggle('open'); $('bMore').setAttribute('aria-expanded', o); };
document.addEventListener('click', e => { if(!e.target.closest('#ctlExtra') && !e.target.closest('#bMore')){ $('ctlExtra').classList.remove('open'); $('bMore').setAttribute('aria-expanded', false); } });
// testing shortcut: a decade in one click — finish this exam, then run nine more, one per tick so the page stays responsive
$('bSkip10').onclick = () => {
  const b = $('bSkip10'); if(b.disabled) return; b.disabled = true; clearTimeout(RP.timer); RP.active = false; MT_AUTO = true;
  let n = 0;
  if(S.finished) $('bNext').click();   // the exam on screen is already done: start counting from a new one
  const step = () => {
    try {
      if(!S.finished) $('bAll').click();
      n++; b.textContent = `Running… ${n}/10`;
      if(n < 10){ $('bNext').click(); setTimeout(step, 30); return; }
    } catch(e){ console.error(e); }
    b.disabled = false; MT_AUTO = false; b.textContent = 'Run 10 exams at once'; $('ctlExtra').classList.remove('open'); save(); render(); showTab('results');
  };
  setTimeout(step, 30);
};
$('bRestart').onclick = () => { clearTimeout(RP.timer); RP.active = false; restartState(S); favReturn(null); selPhase = null; save(); render(); showTab('phase'); };
$('bNext').onclick = () => {
  clearTimeout(RP.timer); RP.active = false;
  if(!S.finished) return;
  registerHunters(); if(!S.paper) S.paper = makePaper(S);
  HISTORY.push(archive(S));
  // only the last 25 editions keep their full replay (route, bracket, island, every event); older ones keep the summary
  HISTORY.forEach((r, i) => { if(r.snap && i < HISTORY.length - 25) r.snap = null; });
  // keep the full replay for the 12 most recent editions; older ones keep the paper, route and key moments
  HISTORY.slice(0, -12).forEach(r => { if(r.snap && !r.slim){ r.snap.events = r.snap.events.filter(e => ['death','betray','major','sabot','arc','rival','event'].includes(e.t)).slice(0, 120); r.snap.alliances = (r.snap.alliances || []).slice(0, 6); r.slim = true; } });
  finalizeAttempts(S);
  hunterYear(S);
  mtForceReturn(); const prev = S; S = fresh(S.edition + 1, S); FORCE_RETURN = new Set(); favReturn(prev); heirsEnter(S); try { schoolsEnter(S); } catch(e){ console.error(e); } selPhase = null; save(); render(); showTab('phase');
};
// wiping the whole world lives in History, next to the save file, behind a second click
function resetEverything(){
  const b = $('bReset');
  if(!resetArmed){ resetArmed = true; b.textContent = `Click again: this deletes ${HISTORY.length} edition${HISTORY.length === 1 ? '' : 's'} and ${fmt(HUNTERS.length)} Hunters`; setTimeout(() => { resetArmed = false; if($('bReset')) $('bReset').textContent = 'Start a new world'; }, 4000); return; }
  resetArmed = false;
  try{ localStorage.removeItem(KEY); }catch(e){}
  HISTORY = []; HUNTERS = []; HA_SEQ = 0; FAV = {}; SCOUT = scoutFix(); MENTOR = mentorFix(); BULLETINS = []; WORLD = worldFix(); updateFavCss(); newWorld(); selPhase = null; save(); render(); showTab('phase');
}

function snapshot(S){
  useLineup(S);
  const m = cmap(S), people = {};
  const addP = id => { const c = m[id]; if(c && !people[id]) people[id] = {n: c.name, r: c.reg, s: c.status}; };
  const events = S.log.filter(e => !e.d).slice(0, 900);
  events.forEach(e => (e.ids || []).forEach(addP));
  const strip = x => x && ({id: x.id, a: x.a, b: x.b, w: x.w, l: x.l, how: x.how, fatal: !!x.fatal, bye: !!x.bye, root: !!x.root, examiner: x.examiner || null, dq: x.dq || null});
  const B = S.bracket ? {prelim: S.bracket.prelim.map(strip), rounds: S.bracket.rounds.map(r => r.map(strip)), solo: strip(S.bracket.solo), groups: S.bracket.groups ? S.bracket.groups.map(g => ({name: g.name, rounds: g.rounds.map(r => r.map(strip)), solo: strip(g.solo)})) : undefined} : null;
  if(B) [...B.prelim, ...B.rounds.flat(), B.solo].filter(Boolean).forEach(x => { addP(x.a); addP(x.b); });
  let zevil = null;
  if(S.zevil && S.zevil.days && S.zevil.days.length){
    const last = S.zevil.days[S.zevil.days.length - 1], tg = S.zevil.targets || {};
    zevil = S.zevil.ids.map(id => ({id, badges: (last.hold[id] || []).length, pts: (last.hold[id] || []).reduce((s, b) => s + (b === id || b === tg[id] ? 3 : 1), 0), gone: (last.gone || {})[id] || null}))
      .sort((x, y) => y.pts - x.pts).slice(0, 16);
    zevil.forEach(z => addP(z.id));
  }
  const alliances = (S.alliances || []).filter(A => A.ever.length >= 2).map(A => ({name: A.name, family: !!A.family, ever: A.ever, saves: A.saves || 0, together: A.together || 0, hunters: A.ever.filter(id => m[id] && m[id].status === 'Approved').length}))
    .sort((x, y) => y.hunters - x.hunters || y.saves - x.saves).slice(0, 12);
  alliances.forEach(A => A.ever.forEach(addP));
  S.candidates.filter(c => c.status === 'Approved').forEach(c => addP(c.id));
  return {
    phases: PHASES.map((ph, i) => { const st = S.stats.find(x => x.p === i); return {name: ph.name, group: ph.group, ex: ph.ex || null, before: st ? st.before : null, after: st ? st.after : null}; }),
    chronicle: S.chronicle || chronicle(S),
    events: events.map(e => ({p: e.p, t: e.type, x: e.text})), bracket: B, zevil, alliances, people,
    dead: S.candidates.filter(c => c.status === 'Deceased').length, dq: S.candidates.filter(c => c.status === 'Disqualified').length
  };
}
function archive(S){
  const ap = S.candidates.filter(c => c.status === 'Approved');
  return {
    edition: S.edition, applicants: S.config.applicants, licenses: S.config.licenses, seed: S.seed,
    funnel: S.stats.map(s => s.after),
    hunters: ap.map(c => ({name:c.name, reg:c.reg, age:c.age, best: topAttrs(c,2).map(k => ATTR_LABEL[k]).join(', '), reason:c.reason, career:c.career || null})),
    snap: snapshot(S), paper: S.paper || null
  };
}

/* ---------- render ---------- */
function topAttrs(c, n){ return Object.keys(c.a).sort((x,y) => c.a[y]-c.a[x]).slice(0, n); }
function counts(){
  const hide = hiddenFinal();
  const C = S.candidates.map(c => hide.has(c.id) ? {status:'Active'} : c);
  return { total:C.length, active:C.filter(c => c.status === 'Active' || c.status === 'Finalist').length,
    elim:C.filter(c => c.status === 'Eliminated' || c.status === 'Disqualified').length, dead:C.filter(c => c.status === 'Deceased').length, appr:C.filter(c => c.status === 'Approved').length };
}

const attemptsOf = c => (c.attempts && c.attempts.length) || 1;
const isReturning = c => attemptsOf(c) > 1;
const atStage = a => a.stage !== undefined ? a.stage : (a.phase !== null && a.phase !== undefined ? PHASE_DEFS[CLASSIC[Math.min(a.phase, CLASSIC.length - 1)]].stage : -1);
const prevBestAt = c => (c.attempts || []).filter(a => a.edition !== S.edition && a.phase !== null && a.phase !== undefined).sort((x, y) => (atStage(y) * 100 + y.phase) - (atStage(x) * 100 + x.phase))[0] || null;
const prevBest = c => { const a = prevBestAt(c); return a ? atStage(a) * 100 + a.phase : -1; };
