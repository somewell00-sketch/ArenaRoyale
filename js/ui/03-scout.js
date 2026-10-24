/* ===================== SCOUT'S TABLE: pick up to three candidates, bet on how far they go ===================== */
let SCOUT = {jenny: 300, rec: {bets: 0, won: 0, profit: 0, best: null}, ex: {}, hist: [], prev: []};
const scoutFix = s => Object.assign({jenny: 300, rec: {bets: 0, won: 0, profit: 0, best: null}, ex: {}, hist: [], prev: []}, s || {});
const SC_LVL = [
  {k: 'mid', l: 'Halfway', d: 'Reaches the halfway point of the exam', w: 'if they reach halfway'},
  {k: 'zev', l: 'Zevil Island', d: 'Reaches Zevil Island', w: 'if they reach Zevil Island'},
  {k: 'lic', l: 'Licensed', d: 'Earns a Hunter License', w: 'if they get licensed'},
  {k: 'r1', l: 'Licensed in round 1', d: 'Earns the license with the first bout of the final', w: 'if they win it in round 1'}
];
// how likely each outcome is, by a candidate's standing on paper (calibrated on many simulated exams)
const SC_TAB = {r: [1, 2, 4.7, 11.4, 32, 61, 108, 175, 262, 364, 900],
  mid: [.97, .953, .94, .915, .87, .81, .73, .62, .57, .41, .25],
  zev: [.48, .447, .42, .357, .29, .23, .156, .095, .066, .046, .015],
  lic: [.174, .145, .129, .096, .062, .052, .027, .014, .0055, .0035, .001],
  r1: [.11, .092, .062, .048, .024, .02, .0074, .0028, .0011, .0006, .0002]};
const scScore = c => Object.values(c.a).reduce((s, v) => s + v, 0) + ({Elite: 45, Skilled: 20, Trained: 5}[c.tier] || 0) + (attemptsOf(c) > 1 ? 15 : 0);
function scRanks(){ if(S._scR && S._scR.n === S.candidates.length) return S._scR.m; const m = {}; S.candidates.slice().sort((a, b) => scScore(b) - scScore(a)).forEach((c, i) => m[c.id] = i + 1); S._scR = {n: S.candidates.length, m}; return m; }
function scProb(c, k){
  const r = Math.log(scRanks()[c.id] || 999), R = SC_TAB.r.map(Math.log), V = SC_TAB[k];
  if(r <= R[0]) return V[0]; if(r >= R[R.length - 1]) return V[V.length - 1];
  for(let i = 1; i < R.length; i++) if(r <= R[i]){ const f = (r - R[i - 1]) / (R[i] - R[i - 1]); return Math.exp(Math.log(V[i - 1]) + f * (Math.log(V[i]) - Math.log(V[i - 1]))); }
  return V[V.length - 1];
}
// fair odds less a 5% house cut, up to ×1000 for a true miracle (calibrated on ~2,700 simulated exams)
const scOdds = (p, loyal) => { const o = Math.min(1000, Math.max(1.02, 0.95 / Math.max(p, 0.0002))) * (loyal ? 1.1 : 1);
  return o >= 100 ? Math.round(o / 5) * 5 : o >= 20 ? Math.round(o) : o >= 2 ? Math.round(o * 10) / 10 : Math.round(o * 100) / 100; };
const scEx = () => SCOUT.ex[S.edition] = SCOUT.ex[S.edition] || {picks: [], locked: false};
// the Jenny sign: a J with two bars, drawn in CSS so it works in any font
const JY = '<span class="jy" aria-label="Jenny">J</span>';
const fmtJ = n => JY + fmt(Math.round(n));
// one purse look everywhere: label, amount, and your scout rank under it
const scPurse = (label = 'Purse', n = SCOUT.jenny) => `<div class="sc-stub sc-purse"><small><i class="sc-coin" aria-hidden="true"></i>${label}</small><b>${fmtJ(n)}</b></div>`;
// the shared top row of every Scout's Table state: chip · title (+ rank) and a line · right side
const scTop = (title, sub, right, rank = true, chip) => `<div class="sc-top">${chip || scChip()}<div class="sc-bar-t"><div class="sc-tline"><b class="sc-title">${title}</b>${rank ? `<span class="sc-rank">${typeof rank === 'string' ? rank : scTitle()}</span>` : ''}</div><span class="muted">${sub}</span></div><div class="sc-bar-r">${right}</div></div>`;
const scChip = () => `<span class="sc-chip" aria-hidden="true">${JY}</span>`;
// the pool: a few favourites, some dark horses, a veteran, the youngest, someone you backed before
function scPool(){
  const E = scEx();
  if(E.pool && !E.locked) MENTOR.appr.filter(a => a.status === 'active' && !E.pool.some(x => x.id === a.id) && S.candidates.some(c => c.id === a.id && c.status === 'Active')).forEach(a => { E.pool = [{id: a.id, tag: 'Apprentice'}].concat(E.pool).slice(0, 8); });
  if(E.pool) return E.pool.map(x => ({...x, c: S.candidates.find(c => c.id === x.id)})).filter(x => x.c);
  const R = scRanks(), C = S.candidates.filter(c => c.status === 'Active'), by = f => C.filter(f).sort((a, b) => R[a.id] - R[b.id]), out = [], used = new Set();
  const put = (c, tag) => { if(c && !used.has(c.id) && out.length < 8){ used.add(c.id); out.push({id: c.id, tag}); } };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  (typeof MENTOR !== 'undefined' ? MENTOR.appr : []).filter(a => a.status === 'active').forEach(a => put(C.find(c => c.id === a.id), 'Apprentice'));
  C.filter(c => c.heir).forEach(c => put(c, 'Heir'));
  by(c => R[c.id] <= 2).forEach(c => put(c, 'Favorite'));
  put(rnd(by(c => R[c.id] > 2 && R[c.id] <= 15)), 'Contender');
  SCOUT.prev.forEach(id => { const c = C.find(x => x.id === id); if(c) put(c, 'Back again'); });
  put(by(c => attemptsOf(c) >= 3)[0], 'Veteran');
  const dark = by(c => R[c.id] > 25 && R[c.id] <= 200 && Math.max(...Object.values(c.a)) >= 88);
  put(rnd(dark), 'Dark horse'); put(rnd(dark.filter(c => !used.has(c.id))), 'Dark horse');
  put(C.filter(c => R[c.id] <= 400).sort((a, b) => a.age - b.age)[0], 'Youngest');
  put(rnd(by(c => c.fam && R[c.id] <= 300)), 'Family');
  while(out.length < 8){ const c = rnd(by(c => R[c.id] > 10 && R[c.id] <= 250 && !used.has(c.id))); if(!c) break; put(c, 'Wildcard'); }
  E.pool = out; return out.map(x => ({...x, c: S.candidates.find(c => c.id === x.id)}));
}
function scOutcome(c, k){
  const zi = PHASES.findIndex(ph => ph.zevil), mid = Math.floor(PHASES.length / 2), reach = i => c.out == null || c.out >= i;
  return k === 'mid' ? reach(mid) : k === 'zev' ? reach(zi) : k === 'lic' ? c.status === 'Approved' : c.status === 'Approved' && /round 1\b/.test(c.reason || '');
}
// already decided before the end? (out early = lost; reached the mark = won)
function scLive(c, k){
  if(S.finished) return scOutcome(c, k) ? 'won' : 'lost';
  const zi = PHASES.findIndex(ph => ph.zevil), mid = Math.floor(PHASES.length / 2), need = k === 'mid' ? mid : k === 'zev' ? zi : PHASES.length;
  if(c.out != null && c.out < need) return 'lost';
  if(c.status === 'Deceased' || c.status === 'Disqualified') return 'lost';
  if(k === 'mid' && S.started && S.phase >= mid) return 'won';
  if(k === 'zev' && S.started && S.phase >= zi) return 'won';
  return 'live';
}
function scLock(auto){
  const E = scEx(); if(E.locked) return;
  E.picks = E.picks.filter(x => S.candidates.some(c => c.id === x.id));
  if(!E.picks.length){ E.locked = true; if(auto && SCOUT.open){ SCOUT.open = false; } return; }
  const total = E.picks.reduce((s, x) => s + x.stake, 0);
  if(total > SCOUT.jenny){ E.picks.forEach(x => x.stake = Math.max(10, Math.floor(x.stake * SCOUT.jenny / total / 10) * 10)); }
  E.picks.forEach(x => { const c = S.candidates.find(y => y.id === x.id); x.odds = scOdds(scProb(c, x.lvl), SCOUT.prev.includes(x.id)); SCOUT.jenny -= x.stake; });
  E.locked = true; E.auto = !!auto; save();
}
function scDouble(id){
  const E = scEx(), x = E.picks.find(p => p.id === id), c = S.candidates.find(y => y.id === id); if(!x || x.dbl || SCOUT.jenny < x.stake) return;
  const pz = scProb(c, 'zev'), pl = scProb(c, x.lvl), odds = scOdds(Math.min(0.95, pl / Math.max(pz, 0.01)));
  x.dbl = {stake: x.stake, odds}; SCOUT.jenny -= x.stake; save(); render();
}
// every finished exam the Association pays its scouts a small stipend, so a broke purse slowly refills
// paid only to those who took part this year (a bet on the table or an apprentice in the exam), never for skipping years
const SC_STIPEND = 100;
function scStipend(){
  if(!S.finished || SCOUT.stipEd === S.edition) return; SCOUT.stipEd = S.edition;
  const E = SCOUT.ex[S.edition], bet = !!(E && E.picks && E.picks.length && E.locked), appr = MENTOR.appr.some(a => a.trail && a.trail.ed === S.edition);
  SCOUT.stipAmt = bet || appr ? SC_STIPEND : 0; SCOUT.jenny += SCOUT.stipAmt; if(SCOUT.stipAmt) setTimeout(() => purseFx(SCOUT.stipAmt), 300);
}
function scSettle(){
  scStipend();
  const E = SCOUT.ex[S.edition]; if(!E || !E.locked || E.settled || !S.finished) return;
  let net = 0; const res = [];
  E.picks.forEach(x => { const c = S.candidates.find(y => y.id === x.id); if(!c) return; const won = scOutcome(c, x.lvl);
    const pay = won ? x.stake * x.odds + (x.dbl ? x.dbl.stake * x.dbl.odds : 0) : 0, cost = x.stake + (x.dbl ? x.dbl.stake : 0);
    x.res = won ? 'won' : 'lost'; x.pay = Math.round(pay); SCOUT.jenny += pay; net += pay - cost;
    SCOUT.rec.bets++; if(won){ SCOUT.rec.won++; if(!SCOUT.rec.best || pay - cost > SCOUT.rec.best.gain) SCOUT.rec.best = {gain: Math.round(pay - cost), name: c.name, ed: S.edition, lvl: x.lvl, odds: x.odds}; }
    if(!won && c.status !== 'Deceased' && !SCOUT.prev.includes(c.id)) SCOUT.prev.push(c.id);
    if(c.status === 'Approved') SCOUT.prev = SCOUT.prev.filter(id => id !== c.id);
    res.push({name: c.name, lvl: x.lvl, res: x.res, pay: x.pay, cost}); });
  SCOUT.prev = SCOUT.prev.slice(-20);
  SCOUT.rec.profit += net; E.settled = true; E.net = Math.round(net);
  Object.keys(SCOUT.ex).forEach(k => { if(+k < S.edition - 5) delete SCOUT.ex[k]; });
  if(res.length) SCOUT.hist.push({ed: S.edition, net: Math.round(net), picks: res}); SCOUT.hist = SCOUT.hist.slice(-30);
}
const scTitle = () => { const w = SCOUT.rec.won; return w >= 40 ? 'Legendary Scout' : w >= 20 ? 'Master Scout' : w >= 8 ? 'Trusted Scout' : 'Rookie Scout'; };
// the table itself, shown before the first phase
// how likely a license looks, in words and five dots (the payout shows once picked)
function scChance(p){
  const n = p >= .12 ? 5 : p >= .06 ? 4 : p >= .025 ? 3 : p >= .008 ? 2 : 1;
  return `<span class="sc-ch"><span class="sc-dots">${'●'.repeat(n)}<i>${'●'.repeat(5 - n)}</i></span>${['Miracle', 'Long shot', 'Fair shot', 'Good chance', 'Strong chance'][n - 1]}</span>`;
}
function scoutHtml(){
  const E = scEx();
  if(S.finished) return '';
  if(E.locked || S.started){
    if(!E.locked || !E.picks.length || scDoubleHtml()) return '';
    const live = E.picks.filter(x => { const c = S.candidates.find(y => y.id === x.id); return c && scLive(c, x.lvl) !== 'lost'; }).length;
    const at = E.picks.reduce((s, x) => s + x.stake + (x.dbl ? x.dbl.stake : 0), 0);
    return `<div class="mini-tk sc-mini"><span class="sc-chip" aria-hidden="true">${JY}</span><b>Bet slip</b><span class="muted">${E.picks.length} bet${E.picks.length > 1 ? 's' : ''} · ${live === E.picks.length ? 'all alive' : live ? live + ' alive' : 'all out'}</span><span class="mini-r"><b class="mini-gold">${fmtJ(at)}</b><span class="muted mini-x">at stake</span><i class="mini-lock" title="Locked until the exam ends">🔒</i></span></div>`;
  }
  if(SCOUT.off) return '';
  if(SCOUT.jenny < 50){ SCOUT.jenny += 100; E.grant = true; }
  if(!SCOUT.open) return `<div class="scout sc-bar sc-ticket pre"><button type="button" class="tk-hide" data-scoff title="Hide betting · you can bring it back from History" aria-label="Hide betting">×</button>${scTop("Scout's Table", `Call how far they'll go. Long shots pay up to ×1000.`, `${scPurse()}<button class="sc-go" data-scopen>Place bets</button>`)}</div>`;
  const pool = scPool(), sel = id => E.picks.find(x => x.id === id), R = scRanks();
  const card = ({c, tag}) => { const s = sel(c.id), top = topAttrs(c, 2).map(k => ATTR_LABEL[k]).join(' · ');
    return `<button class="sc-card${s ? ' on' : ''}${scFx.pop === c.id ? ' pop' : ''}" data-scpick="${c.id}" aria-pressed="${!!s}"><span class="sc-tag t-${tag.replace(/\s/g, '')}">${tag}</span><b>${esc(c.name)}</b>
      <small>${c.age} · ${esc(c.tier)}${attemptsOf(c) > 1 ? ` · attempt ${attemptsOf(c)}` : ''}</small><small class="muted">${esc(top)}</small>
      ${scChance(scProb(c, 'lic'))}</button>`; };
  const tagOf = id => (pool.find(x => x.id === id) || {}).tag || '';
  const CHIPS = [[50, 'c50'], [100, 'c100'], [250, 'c250'], [500, 'c500']];
  const ticket = (x, n) => { const c = S.candidates.find(y => y.id === x.id); if(!c) return '';
    const loyal = SCOUT.prev.includes(c.id), free = SCOUT.jenny - E.picks.reduce((s, y) => s + (y === x ? 0 : y.stake), 0);
    const li = SC_LVL.findIndex(L => L.k === x.lvl), o = scOdds(scProb(c, x.lvl), loyal), win = Math.round(x.stake * o), tag = tagOf(c.id);
    const wild = scProb(c, x.lvl) < 0.01;
    return `<div class="sc-pick${wild ? ' wild' : ''}${scFx.pop === c.id ? ' enter' : ''}">
      <div class="sc-ph"><span class="sc-num">${n}</span><b>${esc(c.name)}</b>${tag ? `<span class="sc-tag t-${tag.replace(/\s/g, '')}">${tag}</span>` : ''}${loyal ? '<span class="sc-tag t-Backagain" title="You backed them before: +10% on every payout">+10% loyalty</span>' : ''}${scChance(scProb(c, 'lic'))}
        <button type="button" class="sc-rm" data-scpick="${c.id}" aria-label="Remove ${esc(c.name)}" title="Remove">×</button></div>
      <div class="sc-pb">
        <div class="sc-z z-far"><div class="sc-lab">How far</div><div class="sc-track" style="--i:${li}" role="radiogroup" aria-label="How far will ${esc(c.name)} go?">${SC_LVL.map((L, i) => { const w = Math.round(x.stake * scOdds(scProb(c, L.k), loyal));
          return `<button type="button" role="radio" class="sc-stop${i <= li ? ' lit' : ''}${i === li ? ' on' : ''}" data-sclvl="${c.id}" data-k="${L.k}" aria-checked="${i === li}" title="${L.d} · pays ×${scOdds(scProb(c, L.k), loyal)}"><i></i><span>${L.k === 'r1' ? 'Round 1' : L.k === 'zev' ? 'Zevil' : L.l}</span><b>${fmtJ(w)}</b></button>`; }).join('')}</div></div>
        <div class="sc-z z-bet"><div class="sc-lab">Bet</div><div class="sc-chips" role="radiogroup" aria-label="Stake">${CHIPS.filter(([a]) => a < free).map(([a, k]) => `<button type="button" role="radio" class="pchip ${k}${x.stake === a ? ' on' : ''}${x.stake === a && scFx.chip === c.id ? ' drop' : ''}" data-scamt="${c.id}" data-v="${a}" aria-checked="${x.stake === a}" title="Bet ${fmt(a)} Jenny"><span>${a}</span></button>`).join('')}<button type="button" role="radio" class="pchip call${x.stake === free ? ' on' : ''}${x.stake === free && scFx.chip === c.id ? ' drop' : ''}" data-scamt="${c.id}" data-v="${free}" aria-checked="${x.stake === free}" title="All in: ${fmt(free)} Jenny"><span>All<br>in</span></button></div></div>
        <div class="sc-z z-win"><div class="sc-lab">To win</div><b>${fmtJ(win)}</b></div>
      </div>
    </div>`; };
  const slot = n => `<div class="sc-pick empty"><span class="sc-num">${n}</span><span>Pick a candidate above</span></div>`;
  const total = E.picks.reduce((s, x) => s + x.stake, 0), pot = E.picks.reduce((s, x) => { const c = S.candidates.find(y => y.id === x.id); return s + (c ? Math.round(x.stake * scOdds(scProb(c, x.lvl), SCOUT.prev.includes(c.id))) : 0); }, 0);
  const html = `<div class="scout sc-ticket sc-open">${scTop("Scout's Table", `${ordinal(S.edition)} exam · Choose up to 3, call how far they'll go and place your chips. Bets lock when the first trial runs.${E.grant ? ` <b>The Association advanced you ${fmtJ(100)} to keep scouting.</b>` : ''}`, `${scPurse()}<button type="button" class="sc-x" data-scclose aria-label="Close the Scout's Table" title="Close (clears your picks)">×</button>`)}
    <div class="sc-grid">${pool.map(card).join('')}</div>
    <div class="sc-picks">${[0, 1, 2].map(i => E.picks[i] ? ticket(E.picks[i], i + 1) : slot(i + 1)).join('')}</div>
    ${E.picks.length ? `<div class="sc-foot"><div class="sc-tot"><span><small>Total stake</small><b>${fmtJ(total)}</b></span><span><small>Potential win</small><b class="gold">${fmtJ(pot)}</b></span></div><button class="sc-go" data-sclock ${total > SCOUT.jenny ? 'disabled' : ''}>Lock in ${E.picks.length} bet${E.picks.length > 1 ? 's' : ''}</button></div>`
      : `<p class="muted" style="margin:0;font-size:12.5px">Or just watch: run the first trial and this table goes away.</p>`}
  </div>`;
  return html;
}
// one-shot effects for the next render (which card popped, which chip dropped), plus the counting payout
const scFx = {pop: null, chip: null, wins: {}};
// a choice in the lodge or at the table re-draws the page: keep what you clicked where it was, and light up what changed
let ANCH = null;
const ANCH_SEL = '[data-mtpt],[data-mtles],[data-mtcamp],[data-mtrec],[data-mtopen],[data-mtpeek],[data-mtclose],[data-mtap],[data-mtdil],[data-mtrel],[data-scpick],[data-sclvl],[data-scamt],[data-scstake],[data-sclock],[data-scopen],[data-scclose],[data-scdbl]';
document.addEventListener('click', e => {
  const t = e.target.closest(ANCH_SEL), pane = $('pane-phase');
  if(!t || !pane || !pane.contains(t)){ return; }
  const sel = [...t.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-on').map(a => `[${a.name}${a.value ? `="${CSS.escape(a.value)}"` : ''}]`).join('');
  const cont = t.closest('.mt-lodge') ? '.mt-lodge' : t.closest('.mt-open,.mt-bar,.mt-mini') ? '.mt-open,.mt-bar,.mt-mini' : '.sc-open,.sc-ticket:not(.mt-bar):not(.mt-open),.sc-mini';
  const c = t.closest(cont);
  ANCH = {sel, top: t.getBoundingClientRect().top, cont, ctop: c ? c.getBoundingClientRect().top : null, at: Date.now(), ph: S.phase, fin: S.finished};
}, true);
// a trial that runs turns the page: back to the top of the trial, gently, with what just happened lit up
function toTrialTop(){
  { const b = document.querySelector('#mtDrawer .md-body'); if(b) b.scrollTop = 0; }
  requestAnimationFrame(() => { const pane = $('pane-phase'), tabs = document.querySelector('#examTop>.tabs'); if(!pane) return;
    const y = (tabs || pane).getBoundingClientRect().top + scrollY - 10; if(Math.abs(scrollY - y) > 8) window.scrollTo({top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    const hit = pane.querySelector('.mt-lodge .mt-past') || pane.querySelector('.rep-head'); if(hit){ hit.classList.remove('just'); void hit.offsetWidth; hit.classList.add('just'); } });
}
function keepAnchor(){
  const A = ANCH; ANCH = null; if(!A || Date.now() - A.at > 2500) return;
  if(A.ph !== S.phase || A.fin !== S.finished){ toTrialTop(); return; }
  const pane = $('pane-phase'); if(!pane) return;
  let el = pane.querySelector(A.sel), ref = A.top;
  if(!el || !el.offsetParent){ el = pane.querySelector(A.cont); ref = A.ctop; }
  if(!el || ref == null) return;
  const d = el.getBoundingClientRect().top - ref;
  if(Math.abs(d) > 1) window.scrollBy({top: d, behavior: 'instant'});
  // what just changed: the card that now holds the result
  const hit = el.closest('.mt-camp,.mt-row,.mt-pro,.sc-card,.sc-pk,.mini-tk,.mt-lodge,.scout') || el;
  const tgt = el.matches(A.sel) ? hit : (pane.querySelector('.mt-lodge .mt-past') || hit);
  tgt.classList.remove('just'); void tgt.offsetWidth; tgt.classList.add('just');
}
function scAnimate(){
  scFx.pop = null; scFx.chip = null; scFx.stamp = false;
}
// before Zevil Island: one chance to double each live bet, at the odds of the moment
function scDoubleHtml(){
  const E = SCOUT.ex[S.edition], zi = PHASES.findIndex(ph => ph.zevil);
  if(!E || !E.locked || S.finished || S.phase !== zi) return '';
  const can = E.picks.filter(x => { const c = S.candidates.find(y => y.id === x.id); return c && !x.dbl && ['lic', 'r1'].includes(x.lvl) && scLive(c, x.lvl) === 'live'; });
  if(!can.length) return '';
  return `<div class="scout sc-dbl"><div class="meta">Before Zevil Island</div><h3>Double down?</h3><p class="muted">Your picks made it this far. Add the same stake again at today's odds, or hold.</p>
    ${can.map(x => { const c = S.candidates.find(y => y.id === x.id), odds = scOdds(Math.min(0.95, scProb(c, x.lvl) / Math.max(scProb(c, 'zev'), 0.01)));
      return `<div class="sc-row"><b>${esc(c.name)}</b><span class="muted">${SC_LVL.find(L => L.k === x.lvl).l} · first bet ${fmtJ(x.stake)} at ×${x.odds}</span><button class="btn small" data-scdbl="${c.id}" ${SCOUT.jenny < x.stake ? 'disabled' : ''}>+${fmtJ(x.stake)} at ×${odds}</button></div>`; }).join('')}</div>`;
}
// after the exam: how your picks did
function scResultHtml(){
  const E = SCOUT.ex[S.edition]; if(!E || !E.settled || !E.picks.length) return '';
  const won = E.picks.filter(x => x.res === 'won').length;
  return `<div class="scout sc-res"><div class="sc-head"><div><div class="meta">Your picks</div><h3>${won} of ${E.picks.length} came through · <span class="${E.net >= 0 ? 'pos' : 'neg'}">${E.net >= 0 ? '+' : '−'}${fmtJ(Math.abs(E.net))}</span></h3></div><div class="sc-wallet"><small>${scTitle()}</small><b>${fmtJ(SCOUT.jenny)}</b></div></div>
    ${E.picks.map(x => { const c = S.candidates.find(y => y.id === x.id); return c ? `<div class="sc-row"><a data-id="${c.id}">${esc(c.name)}</a><span class="muted">${SC_LVL.find(L => L.k === x.lvl).l} · ${fmtJ(x.stake + (x.dbl ? x.dbl.stake : 0))}${x.dbl ? ' (doubled)' : ''}</span><span class="${x.res === 'won' ? 'pos' : 'neg'}">${x.res === 'won' ? `won ${fmtJ(x.pay)}` : 'lost'}</span></div>` : ''; }).join('')}${SCOUT.stipEd === S.edition && SCOUT.stipAmt ? `<div class="muted" style="font-size:12px">+ ${fmtJ(SCOUT.stipAmt)} scouting stipend from the Association</div>` : ''}</div>`;
}
function scRecordHtml(){
  const r = SCOUT.rec;
  if(SCOUT.off) return `<div><div class="section-h">Scout record</div><p class="muted" style="font-size:13px;margin:0">Betting is hidden. <button type="button" class="sc-link" data-scon>Show the Scout's table again</button></p></div>`;
  if(!r.bets) return '';
  return `<div><div class="section-h">Scout record</div><div class="stats" style="margin-bottom:8px"><div class="stat gold"><b>${fmtJ(SCOUT.jenny)}</b><span>${scTitle()}</span></div><div class="stat"><b>${r.won}/${r.bets}</b><span>Bets won</span></div><div class="stat"><b>${r.profit >= 0 ? '+' : '−'}${fmt(Math.abs(Math.round(r.profit)))}</b><span>Net profit (J)</span></div>${r.best ? `<div class="stat"><b>+${fmt(r.best.gain)}</b><span>Best call · ${esc(r.best.name)} (${ordinal(r.best.ed)}, ×${r.best.odds})</span></div>` : ''}</div>
    ${SCOUT.hist.length ? `<div class="bulletin">${SCOUT.hist.slice(-6).reverse().map(h => `<div class="bl ${h.net >= 0 ? 'promo' : 'fail'}"><i>${h.net >= 0 ? '▲' : '▼'}</i><span><span class="muted">${ordinal(h.ed)} exam</span> ${h.picks.map(p => `${esc(p.name)} <span class="${p.res === 'won' ? 'pos' : 'neg'}">${p.res === 'won' ? '✓' : '✗'}</span>`).join(' · ')} <span class="${h.net >= 0 ? 'pos' : 'neg'}">${h.net >= 0 ? '+' : '−'}${fmtJ(Math.abs(h.net))}</span></span></div>`).join('')}</div>` : ''}</div>`;
}
document.addEventListener('click', e => {
  const pk = e.target.closest('[data-scpick]');
  if(pk){ const E = scEx(), id = pk.dataset.scpick; if(E.locked) return;
    const i = E.picks.findIndex(x => x.id === id);
    if(i >= 0){ E.picks.splice(i, 1); if(isFav(id)) toggleFav(id); }
    else if(E.picks.length < 3){ const free = SCOUT.jenny - E.picks.reduce((s, x) => s + x.stake, 0); if(free < 10) return; E.picks.push({id, lvl: 'lic', stake: free >= 300 ? 100 : free >= 100 ? 50 : Math.max(10, Math.floor(free / 10) * 10)}); if(!isFav(id)) toggleFav(id); scFx.pop = id; }
    save(); renderPhase(); return; }
  const lv = e.target.closest('[data-sclvl]');
  if(lv){ const x = scEx().picks.find(p => p.id === lv.dataset.sclvl); if(x){ x.lvl = lv.dataset.k; save(); renderPhase(); } return; }
  if(e.target.closest('[data-scopen]')){ SCOUT.open = true; save(); renderPhase(); return; }
  if(e.target.closest('[data-scclose]')){ SCOUT.open = false; const E = scEx(); E.picks.forEach(x => { if(isFav(x.id)) toggleFav(x.id); }); E.picks = []; save(); render(); return; }
  if(e.target.closest('[data-scoff]')){ SCOUT.off = true; SCOUT.open = false; save(); renderPhase(); return; }
  if(e.target.closest('[data-scon]')){ SCOUT.off = false; save(); render(); return; }
  const am = e.target.closest('[data-scamt]');
  if(am){ const x = scEx().picks.find(p => p.id === am.dataset.scamt); if(x){ const v = Math.max(10, +am.dataset.v); if(v === x.stake) return; x.stake = v; scFx.chip = x.id; save(); renderPhase(); } return; }
  if(e.target.closest('[data-sclock]')){ scLock(false); scFx.stamp = true; render(); return; }
  const db = e.target.closest('[data-scdbl]'); if(db){ scDouble(db.dataset.scdbl); return; }
});
document.addEventListener('input', e => {
  const st = e.target.closest('[data-scstake]'); if(!st) return;
  const x = scEx().picks.find(p => p.id === st.dataset.scstake); if(!x) return;
  x.stake = +st.value; st.nextElementSibling.innerHTML = fmtJ(x.stake);
  const row = st.closest('.sc-row'), c = S.candidates.find(y => y.id === x.id), o = scOdds(scProb(c, x.lvl), SCOUT.prev.includes(c.id));
  row.querySelector('.sc-win').innerHTML = `×${o} → <b>${fmtJ(x.stake * o)}</b>`;
  const tot = scEx().picks.reduce((s, p) => s + p.stake, 0), f = document.querySelector('.sc-foot span'); if(f) f.innerHTML = `Staked ${fmtJ(tot)} of ${fmtJ(SCOUT.jenny)}`;
  const lb = document.querySelector('[data-sclock]'); if(lb) lb.disabled = tot > SCOUT.jenny;
});
document.addEventListener('change', e => { if(e.target.closest('[data-scstake]')) save(); });
document.addEventListener('change', e => { const s = e.target.closest && e.target.closest('[data-mtpostsel]'); if(!s) return; const a = mtOf(s.dataset.mtpostsel); if(a){ a.posture = s.value; save(); mtCtlRender(); renderPhase(); } });
