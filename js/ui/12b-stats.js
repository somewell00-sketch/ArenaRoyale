/* ---------- Statistics: one compact row a year, and a page that reads it ----------
   WORLD.yearly keeps a few numbers per year (under 100 KB for 500 years); WORLD.tally counts things that never shrink.
   Everything else on the page is read live from the register, the schools, the cases and the relics. */
const ST_CAUSE = {f: 'In the field', h: 'Blacklist', c: 'Crisis', x: 'Dark Continent', u: 'Duel', e: 'As examiner', o: 'Old age', r: 'Relic'};
function deathCause(h, ed){
  const t = ((h.log || []).filter(x => x.ed === ed && x.k === 'death').pop() || {}).text || '';
  if(h.lostIn || /Dark Continent/.test(t)) return 'x';
  if(h.killedBy || /Blacklist|was last seen there/.test(t)) return 'h';
  if(/ during the (Grey Fever|Border War|Great Stampede|Year of Storms|Gold Rush|Long Famine|Syndicate Wars)/.test(t)) return 'c';
  if(/duel/.test(t)) return 'u';
  if(/as an examiner/.test(t)) return 'e';
  if(/jar|sleep, the same night/.test(t)) return 'r';
  if(/in retirement|peacefully|own bed|between two pages|outlived|answering letters|died at \d+/.test(t) || h.retire) return 'o';
  return 'f';
}
function statsYear(prev, ed, items){
  const Y = WORLD.yearly = WORLD.yearly || [], T = WORLD.tally = WORLD.tally || {exp: 0, expBack: 0, expLost: 0, back: 0, crisis: {}, disc: 0};
  if(Y.length && Y[Y.length - 1].ed === ed) return;
  const act = HUNTERS.filter(h => hActive(h) && !h.legacy), d = {};
  HUNTERS.filter(h => h.status === 'Deceased' && h.diedEd === ed && !h.legacy).forEach(h => { const k = deathCause(h, ed); d[k] = (d[k] || 0) + 1; });
  const s = [0, 1, 2, 3].map(n => act.filter(h => hStars(h) === n).length);
  Y.push({ed, a: act.length, s, d, ap: (prev.config || {}).applicants || 0, li: (prev.candidates || []).filter(c => c.status === 'Approved').length,
    age: act.length ? Math.round(act.reduce((x, h) => x + hunterAge(h), 0) / act.length) : 0});
  if(Y.length > 600) WORLD.yearly = Y.slice(-600);
  (items || []).forEach(it => {
    if(it.kind === 'exped'){ if(/^The Association sends|^A rescue expedition sets out/.test(it.text)) T.exp++; else if(/expedition returns/.test(it.text)) T.expBack++; else if(/declared lost/.test(it.text)) T.expLost++; }
    if(it.kind === 'missing' && /back|turns up|found alive|walks into|picks up|had been living/.test(it.text)) T.back++;
  });
  const C = WORLD.crisis; if(C && C.start === ed) T.crisis[C.k] = (T.crisis[C.k] || 0) + 1;
  if(WORLD.lastDisc === ed) T.disc++;
}
// small charts: one series each, so no legend; every mark carries a tooltip
function stLine(rows, key, label){
  const pts = rows.map(r => [r.ed, typeof key === 'function' ? key(r) : r[key]]).filter(p => p[1] != null);
  if(pts.length < 2) return '';
  const W = 640, H = 150, P = {l: 36, r: 10, t: 10, b: 22}, x0 = pts[0][0], x1 = pts[pts.length - 1][0], ymax = Math.max(...pts.map(p => p[1])) * 1.1 || 1;
  const X = e => P.l + (e - x0) / Math.max(1, x1 - x0) * (W - P.l - P.r), Yv = v => H - P.b - v / ymax * (H - P.t - P.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Yv(p[1]).toFixed(1)}`).join('');
  const ticks = [0, 0.5, 1].map(f => Math.round(ymax / 1.1 * f));
  const step = Math.max(1, Math.ceil(pts.length / 60)), dots = pts.filter((p, i) => i % step === 0 || i === pts.length - 1);
  return `<figure class="st-fig"><figcaption>${esc(label)}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    ${ticks.map(t => `<line x1="${P.l}" x2="${W - P.r}" y1="${Yv(t)}" y2="${Yv(t)}" class="st-grid"/><text x="${P.l - 6}" y="${Yv(t) + 4}" class="st-ax" text-anchor="end">${t}</text>`).join('')}
    <text x="${P.l}" y="${H - 6}" class="st-ax">${ordinal(x0)}</text><text x="${W - P.r}" y="${H - 6}" class="st-ax" text-anchor="end">${ordinal(x1)}</text>
    <path d="${path}" class="st-line"/>${dots.map(p => `<circle cx="${X(p[0])}" cy="${Yv(p[1])}" r="6" class="st-hit"><title>${ordinal(p[0])}: ${p[1]}</title></circle>`).join('')}</svg></figure>`;
}
function stBars(title, list, fmtV){
  const L = list.filter(x => x[1] > 0); if(!L.length) return '';
  const max = Math.max(...L.map(x => x[1])), tot = L.reduce((a, x) => a + x[1], 0);
  return `<div class="st-bars"><div class="st-h">${esc(title)}</div>${L.map(([k, v]) => `<div class="st-b" title="${esc(k)}: ${v} (${Math.round(v / tot * 100)}%)"><span>${esc(k)}</span><i><b style="width:${(v / max * 100).toFixed(1)}%"></b></i><em>${fmtV ? fmtV(v, tot) : v}</em></div>`).join('')}</div>`;
}
const stList = (title, rows) => rows.length ? `<div class="mk"><div class="section-h">${esc(title)}</div>${rows.map(([a, b]) => `<div class="mk-r"><i>·</i><span><b>${a}</b><small>${b}</small></span></div>`).join('')}</div>` : '';
function statsHtml(){
  const Y = WORLD.yearly || [], T = WORLD.tally || {}, H = HUNTERS.filter(h => !h.legacy), act = H.filter(hActive);
  const hl = h => h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—', pct = (v, t) => `${v} · ${Math.round(v / t * 100)}%`;
  const recent = Y.slice(-200);
  // deaths
  const D = {}; Y.forEach(r => Object.entries(r.d || {}).forEach(([k, v]) => D[k] = (D[k] || 0) + v)); const dTot = Object.values(D).reduce((a, b) => a + b, 0);
  const life = H.filter(h => h.status === 'Deceased' && h.diedEd != null && !h.pro), career = life.length ? (life.reduce((a, h) => a + (h.diedEd - h.edition), 0) / life.length).toFixed(1) : '—';
  // exam pass rate
  const ex = HISTORY.filter(r => r.applicants).slice(-200).map(r => ({ed: r.edition, p: Math.round(r.hunters.length / r.applicants * 1000) / 10}));
  // Nen and careers
  const nen = NEN_CATS.map(c => [c, act.filter(h => h.nen && h.nen.category === c).length]).sort((a, b) => b[1] - a[1]);
  const top3 = NEN_CATS.map(c => { const n = H.filter(h => h.nen && h.nen.category === c), t = n.filter(h => hStars(h) >= 3).length; return [c, n.length ? Math.round(t / n.length * 1000) / 10 : 0]; }).sort((a, b) => b[1] - a[1]);
  const car = {}; act.forEach(h => { const c = (h.career || '—').replace(' Hunter', ''); car[c] = (car[c] || 0) + 1; });
  // families: generations through the heirs, and surnames with the most Hunters
  const byCid = new Map(H.map(h => [h.cid, h])), gen = h => { let d = 1, cur = h, g = 0; while(cur && g++ < 12){ const k = (WORLD.heirs || []).find(x => x.cid === cur.cid); const p = k && k.parents.map(l => hLic(l)).find(Boolean); if(!p) break; d++; cur = p; } return d; };
  const dyn = H.filter(h => h.heirOf || h.hParent).map(h => [h, gen(h)]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const fam = {}; H.filter(h => h.heirOf || h.hParent || (WORLD.heirs || []).some(k => k.parents.includes(h.license))).forEach(h => { const s = h.name.split(' ').slice(-1)[0]; fam[s] = (fam[s] || 0) + 1; });
  // schools, cases, outlaws, relics, chairs
  const Sc = (WORLD.schools || []).map(s => ({s, all: H.filter(h => h.school === s.id).length})).sort((a, b) => b.all - a.all).slice(0, 5);
  const C = WORLD.cases || [], V = WORLD.caseV || {};
  const W = WORLD.wanted || [], dead = W.filter(w => w.kills).sort((a, b) => b.kills - a.kills).slice(0, 3);
  const R = Object.values(WORLD.relics || {}).filter(r => r.st !== 'hidden'), most = R.slice().sort((a, b) => (b.n || 0) - (a.n || 0)).slice(0, 3);
  const longHold = R.flatMap(r => (r.owners || []).map(o => ({r, o, y: (o.to ?? S.edition) - o.from}))).sort((a, b) => b.y - a.y)[0];
  const terms = {}; (WORLD.chairHist || []).forEach(x => { terms[x.lic] = (terms[x.lic] || 0) + ((x.to || S.edition) - x.from); }); const longChair = Object.entries(terms).sort((a, b) => b[1] - a[1])[0];
  const crisisN = Object.entries(T.crisis || {}).map(([k, v]) => [CRISES[k] ? capS(CRISES[k].name) : k, v]).sort((a, b) => b[1] - a[1]);
  if(!Y.length && !ex.length) return '';
  return `<div class="wstats"><div class="section-h">Statistics</div>
    ${Y.length ? `<p class="muted st-note">Counted from the ${ordinal(Y[0].ed)} exam on.</p>` : ''}
    <div class="hcard"><div><small>Active Hunters</small><b>${act.length}</b></div><div><small>Average age, active</small><b>${act.length ? Math.round(act.reduce((a, h) => a + hunterAge(h), 0) / act.length) : '—'}</b></div><div><small>Deaths a year</small><b>${Y.length ? (dTot / Y.length).toFixed(1) : '—'}</b></div><div><small>Average career, the dead</small><b>${career} yrs</b></div><div><small>Expeditions</small><b>${T.exp || 0}</b></div><div><small>Came back from missing</small><b>${T.back || 0}</b></div></div>
    <div class="st-two">${stLine(recent, 'a', 'Active Hunters')}${stLine(recent, r => r.s ? r.s[3] : null, '★★★ Hunters')}</div>
    <div class="st-two">${stLine(ex, 'p', 'Exam pass rate, % of applicants')}${stLine(recent, r => Object.values(r.d || {}).reduce((a, b) => a + b, 0), 'Deaths a year')}</div>
    <div class="st-three">${stBars('Causes of death', Object.entries(D).map(([k, v]) => [ST_CAUSE[k] || k, v]).sort((a, b) => b[1] - a[1]), pct)}${stBars('Nen, active Hunters', nen, pct)}${stBars('Reach ★★★ by Nen, %', top3, v => v + '%')}</div>
    <div class="st-three">${stBars('Specialties, active', Object.entries(car).sort((a, b) => b[1] - a[1]).slice(0, 8), pct)}${stBars('Crises by kind', crisisN)}${stBars('Cases', [['Guilty', V.guilty || 0], ['Cleared', V.cleared || 0], ['Reopened', C.filter(c => c.re).length], ['Licenses revoked', H.filter(h => h.revoked).length]])}</div>
    <div class="marks">
      ${stList('Longest lines', dyn.map(([h, g]) => [hl(h), `${g} generations of Hunters`]))}
      ${stList('Families with the most Hunters', Object.entries(fam).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, n]) => [esc(s), `${n} Hunters`]))}
      ${stList('Largest schools', Sc.map(({s, all}) => [`<a data-school="${s.id}">${esc(capS(s.name))}</a>`, `${all} students · ${s.heads.length} master${s.heads.length === 1 ? '' : 's'} · ${s.st}`]))}
      ${stList('Deadliest outlaws', dead.map(w => [esc(w.name) + (w.nick ? ` “${esc(w.nick)}”` : ''), `${w.kills} Hunter${w.kills === 1 ? '' : 's'} killed · ${w.status}`]))}
      ${stList('Relics', most.map(r => [`<a data-relic="${r.id}">${esc(capS(RDEF[r.id].name))}</a>`, `${r.n || 0} owners`]).concat(longHold ? [[hl(hLic(longHold.o.lic)) || esc(longHold.o.name), `held ${esc(RDEF[longHold.r.id].name)} for ${longHold.y} years`]] : []))}
      ${stList('Records of the world', [longChair ? [hl(hLic(longChair[0])), `Chairman for ${longChair[1]} years`] : null, [`${T.expBack || 0} of ${T.exp || 0}`, 'expeditions came home'], [`${T.disc || 0}`, 'places discovered'], [`${W.filter(w => w.status === 'captured').length} / ${W.length}`, 'outlaws captured']].filter(Boolean))}
    </div></div>`;
}
