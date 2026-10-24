/* ---------- Advance: let the years run without watching each exam ----------
   Every year is still an exam (that is where new Hunters, heirs and examiners come from), it just runs out of sight.
   The run stops by itself when something you would want to see happens. */
const ADV_STOP_DEF = {fav: true, election: false, cat: true, relic: true, schism: false, appr: true};
const ADV_STOP_LBL = {fav: 'A favourite dies or goes missing', election: 'A new Chairman is elected', cat: 'A catastrophe hits the exam', relic: 'A relic is found for the first time', schism: 'A school splits', appr: 'Your apprentice enters an exam'};
let ADV_STOPS = (() => { try { return Object.assign({}, ADV_STOP_DEF, JSON.parse(localStorage.getItem('hxsim-adv') || '{}')); } catch(e){ return {...ADV_STOP_DEF}; } })();
let ADV = {on: false};
// tucked behind a ⋯ button, like the exam's extra actions, so a stray click never runs fifty years
function advanceBarHtml(){
  return `<div class="adv"><button type="button" class="btn more" data-advmenu aria-label="More actions" aria-expanded="false" title="More actions">⋯</button>
    <div class="adv-menu" hidden><small>Advance the world</small>${[1, 10, 50].map(n => `<button type="button" class="btn" data-adv="${n}">+${n} year${n === 1 ? '' : 's'}</button>`).join('')}
    <details class="adv-stops" open><summary>Stop when…</summary><div>${Object.keys(ADV_STOP_DEF).map(k => `<label><input type="checkbox" data-advstop="${k}" ${ADV_STOPS[k] ? 'checked' : ''}> ${ADV_STOP_LBL[k]}</label>`).join('')}</div></details></div></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-advmenu]');
  document.querySelectorAll('.adv-menu').forEach(m => { const mine = b && m.previousElementSibling === b; if(mine){ m.hidden = !m.hidden; b.setAttribute('aria-expanded', !m.hidden); } else if(!e.target.closest('.adv-menu')){ m.hidden = true; if(m.previousElementSibling) m.previousElementSibling.setAttribute('aria-expanded', false); } });
});
function advCheck(ed, cat){
  const B = BULLETINS[BULLETINS.length - 1], it = B && B.edition === ed ? B.items : [], why = [];
  if(ADV_STOPS.fav){ const f = HUNTERS.find(h => isFav(h.cid) && ((h.status === 'Deceased' && h.diedEd === ed) || (h.status === 'Missing' && (h.missEd ?? h.diedEd) === ed))); if(f) why.push(`${f.name} ${f.status === 'Deceased' ? 'has died' : 'has gone missing'}`); }
  if(ADV_STOPS.election){ const e = it.find(x => x.kind === 'election' && /elected Chairman/.test(x.text)); if(e) why.push('A new Chairman has been elected'); }
  if(ADV_STOPS.cat && cat) why.push(`${cat} struck the ${ordinal(ed)} exam`);
  if(ADV_STOPS.relic){ const r = Object.values(WORLD.relics || {}).find(x => x.found && x.found.ed === ed && x.found.how !== 'before the records'); if(r) why.push(`${capS(RDEF[r.id].name)} has been found`); }
  if(ADV_STOPS.schism){ const s = it.find(x => x.kind === 'school' && /splits|walks out of/.test(x.text)); if(s) why.push('A school has split'); }
  if(ADV_STOPS.appr && typeof mtHere === 'function'){ try { const a = mtHere().find(({a}) => !ADV.seen.has(a.id)); if(a){ ADV.seen.add(a.a.id); why.push(`${a.c.name} is entering the ${ordinal(S.edition)} exam`); } } catch(e){} }
  return why;
}
function advanceYears(n){
  if(ADV.on) return;
  clearTimeout(RP.timer); RP.active = false;
  const keep = {render, renderPhase, showTab, save, mt: MT_AUTO};
  ADV = {on: true, tab: document.body.dataset.tab, n, i: 0, stop: false, why: [], from: S.edition, top: [], seen: new Set(), t: {lic: 0, dead: 0}};
  try { mtHere().forEach(({a}) => ADV.seen.add(a.id)); } catch(e){}
  showModal(`<div class="sheet adv-run" role="dialog" aria-modal="true" aria-label="Advancing"><div class="sheet-head"><div><div class="meta">The years go by</div><div class="sh-t"><h2 id="advH">Advancing…</h2></div></div></div>
    <div class="adv-bar"><i id="advBar" style="width:0%"></i></div><p class="muted" id="advT" style="margin:0">Starting…</p><div><button class="btn" id="advStop">Stop after this year</button></div></div>`);
  $('advStop').onclick = () => { ADV.stop = true; $('advStop').disabled = true; $('advStop').textContent = 'Stopping…'; };
  MT_AUTO = true; render = () => {}; renderPhase = () => {}; showTab = () => {}; save = () => {};
  const finish = err => {
    Object.assign(window, {render: keep.render, renderPhase: keep.renderPhase, showTab: keep.showTab, save: keep.save}); MT_AUTO = keep.mt; ADV.on = false;
    selPhase = null; save(); render(); showTab(ADV.tab || 'world');
    advSummary(err);
  };
  const step = () => {
    try {
      if(S.live) liveCommit(true);
      try { legendParents(S); } catch(e){}
      let g = 0; while(!S.finished && g++ < 400) runFav();
      const ed = S.edition, cat = S.cat && S.cat.stage === 'done' ? S.cat.name : null;
      const lic0 = HUNTERS.length, dead0 = HUNTERS.filter(h => h.status === 'Deceased').length;
      $('bNext').onclick();
      ADV.i++; ADV.t.lic += HUNTERS.length - lic0; ADV.t.dead += HUNTERS.filter(h => h.status === 'Deceased').length - dead0;
      const B = BULLETINS[BULLETINS.length - 1]; if(B && B.edition === ed) ADV.top.push(...B.items.filter(x => x.rank >= 7 && !['promo', 'job', 'duty', 'debut'].includes(x.kind)).map(x => ({ed, text: x.text, rank: x.rank, kind: x.kind})));
      ADV.why = advCheck(ed, cat);
      const bar = $('advBar'), t = $('advT'); if(bar) bar.style.width = (ADV.i / n * 100) + '%'; if(t) t.textContent = `Year ${ADV.i} of ${n} · the ${ordinal(S.edition)} exam is next`;
      if(ADV.i < n && !ADV.stop && !ADV.why.length){ setTimeout(step, 0); return; }
      finish();
    } catch(e){ console.error(e); finish(e); }
  };
  setTimeout(step, 30);
}
function advSummary(err){
  const yrs = ADV.i, top = ADV.top.slice().sort((a, b) => b.rank - a.rank || b.ed - a.ed).slice(0, 12).sort((a, b) => a.ed - b.ed);
  showModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="What happened"><div class="sheet-head"><div><div class="meta">${yrs} year${yrs === 1 ? '' : 's'} · the ${ordinal(ADV.from)} to the ${ordinal(S.edition - 1)} exam</div><div class="sh-t"><h2>What happened</h2></div>
    ${ADV.why.length ? `<div class="meta adv-why">Stopped: ${esc(ADV.why.join(' · '))}</div>` : ADV.stop ? '<div class="meta adv-why">Stopped by you</div>' : ''}${err ? `<div class="meta adv-why">Stopped by an error: ${esc(err.message)}</div>` : ''}</div>
    <div style="display:flex;gap:8px;align-items:center"><button class="btn" id="mClose">Close</button></div></div>
    <div class="hcard"><div><small>New Hunters</small><b>${ADV.t.lic}</b></div><div><small>Deaths</small><b>${ADV.t.dead}</b></div><div><small>Active now</small><b>${HUNTERS.filter(h => hActive(h) && !h.legacy).length}</b></div><div><small>Chairman</small><b style="font-size:13px">${WORLD.chair && hLic(WORLD.chair.lic) ? esc(hLic(WORLD.chair.lic).name) : '—'}</b></div></div>
    ${top.length ? `<div><div class="section-h">The headlines</div><div class="bulletin">${top.map(x => `<div class="bl ${x.kind}"><i>${(typeof CAREER_IC !== 'undefined' && CAREER_IC[x.kind]) || '·'}</i><span><span class="muted">${ordinal(x.ed)}</span> ${autoLink(esc(x.text))}</span></div>`).join('')}</div></div>` : ''}
  </div>`);
}
document.addEventListener('click', e => { const a = e.target.closest('[data-adv]'); if(a){ advanceYears(+a.dataset.adv); } });
document.addEventListener('change', e => { const c = e.target.closest('[data-advstop]'); if(c){ ADV_STOPS[c.dataset.advstop] = c.checked; try { localStorage.setItem('hxsim-adv', JSON.stringify(ADV_STOPS)); } catch(x){} } });
// the old testing shortcut in the exam's menu now uses the same runner
if($('bSkip10')) $('bSkip10').onclick = () => { $('ctlExtra').classList.remove('open'); advanceYears(10); };
