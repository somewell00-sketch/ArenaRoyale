/* ---------- Hunter Association database (permanent, survives new editions) ---------- */
const licenseId = (edition, reg) => 'HL-' + edition + String(reg).padStart(4, '0'); // e.g. 247th exam, #4 → HL-2470004
// Hunters keep ageing: one year per exam edition held since their approval
const hunterAge = h => h.age + Math.max(0, (h.status === 'Deceased' && h.diedEd != null ? h.diedEd + 1 : S ? S.edition : h.edition) - h.edition);   // the dead stop ageing
const ageMark = h => h.status === 'Deceased' ? ' ✝' : h.status === 'Missing' ? ' ?' : '';
const ageTxt = h => `${hunterAge(h)}${ageMark(h)}`;
function registerHunters(){
  if(!S || !S.finished) return 0;
  finalizeAttempts(S);
  // the examiners of a catastrophe year: the dead are mourned, the rest are decorated and go to the front of the promotion queue
  if(S.cat && S.cat.ex && !S.cat.applied){ S.cat.applied = true;
    S.cat.ex.forEach(x => { const h = hLic(x.license); if(!h || !hActive(h)) return;
      if(x.died){ h.status = 'Deceased'; h.diedEd = S.edition; (h.log = h.log || []).push({ed: S.edition, k: 'death', text: `${h.name} died in ${S.cat.name.toLowerCase()}, as an examiner of the ${ordinal(S.edition)} exam, going back for the candidates.`}); }
      else { h.rp = (h.rp || 0) + 250; h.fast = S.edition; (h.log = h.log || []).push({ed: S.edition, k: 'award', text: `${h.name} is decorated by the Association for leading the rescue in ${S.cat.name.toLowerCase()}.`}); } }); }
  // Hunters' children who took the exam and did not pass stay on their parents' record
  WORLD.heirs = WORLD.heirs || [];
  S.candidates.filter(c => c.status !== 'Approved' && c.status !== 'Active' && c.status !== 'Finalist').forEach(c => {
    let k = WORLD.heirs.find(x => x.cid === c.id);
    if(!k && c.hParent && legendKnown(c) && hLic(c.hParent)) WORLD.heirs.push(k = {id: 'K' + (++WORLD.seq), first: c.first, name: c.name, gender: c.gender, born: S.edition - c.age, parents: [c.hParent], entered: S.edition, cid: c.id, legend: true});
    if(k && !k.fate) k.fate = {st: c.status, ed: S.edition, at: c.out != null && PHASES[c.out] ? PHASES[c.out].name : null};
  });
  const have = new Set(HUNTERS.map(h => h.cid));
  let added = 0;
  S.candidates.filter(c => c.status === 'Approved' && !have.has(c.id)).sort((a,b) => a.reg - b.reg).forEach(c => {
    HA_SEQ += 1;
    HUNTERS.push({
      license: licenseId(S.edition, c.reg), cid: c.id, name: c.name, gender: c.gender, age: c.age,
      edition: S.edition, attempts: (c.attempts || []).length || 1, special: S.special || undefined, catTag: c.catHero && S.cat ? S.cat.tag : undefined, catName: c.catHero && S.cat ? S.cat.name : undefined, starCup: c.starCup || undefined, longlived: Math.random() < 0.003 || undefined,
      ...(c.starCup === 'champion' ? {st: 1, rp: RANK_AT[1]} : {}),
      history: JSON.parse(JSON.stringify(c.attempts || [])), attrs: {...c.a}, reason: c.reason,
      nen: c.nen ? JSON.parse(JSON.stringify(c.nen)) : null, career: c.career || hunterCareer(c), examined: [],
      savedBy: c.rescuedBy || null, heirOf: c.heir ? c.heir.parents : null, hParent: c.hParent && legendKnown(c) ? c.hParent : null, savedIn: ((c.notes || []).find(n => /rescued by/.test(n.text)) || {text: ''}).text.split(':')[0] || null,
      home: pickR(PLACES), scouted: ((SCOUT.ex[S.edition] || {}).picks || []).some(x => x.id === c.id) || undefined, mentored: MENTOR.appr.some(a => a.id === c.id) || undefined, mStart: (MENTOR.appr.find(a => a.id === c.id && a.start) || {}).start, keep: keepsake(c), prodigy: isProdigy(c.age, c.a) || undefined, status: 'Active Hunter', bonds: JSON.parse(JSON.stringify(c.bonds || [])), motive: c.motive, trait: c.trait, secret: c.secret && c.secret.revealed ? c.secret.k : null, rivals: (c.grudges || []).map(g => g.id), rivalWhy: Object.fromEntries((c.grudges || []).map(g => [g.id, g.why || ''])), nick: c.nick || null, nickWhy: c.nickWhy || null, nickEd: c.nickEd || null, avenge: c.avenge || null, dojo: c.dojo ? c.dojo.id : undefined, dojoNen: c.dojoNen || undefined
    });
    { const h = HUNTERS[HUNTERS.length - 1]; if(h.dojoNen && h.nen){ h.nen.mastery = Math.min(70, (h.nen.mastery || 0) + 12); h.nen.techniques = NEN_TECH.filter(t => h.nen.mastery >= t[1]).map(t => t[0]); h.nen.status = h.nen.mastery < 15 ? 'Partially Awakened' : h.nen.mastery < 35 ? 'Awakened' : h.nen.mastery < 55 ? 'Trained' : 'Advanced'; } }   // Nen learned before the license shows
    have.add(c.id); added++;
  });
  const byCid = new Map(HUNTERS.map(h => [h.cid, h]));
  S.candidates.forEach(c => (c.bonds || []).forEach(b => { const h = byCid.get(b.id); if(h && !(h.bonds || []).some(x => x.id === c.id)) (h.bonds = h.bonds || []).push({id: c.id, name: c.name, ed: b.ed, fam: b.fam}); }));
  return added;
}
function backfillLegacy(){
  // older saves kept only a summary of each edition's Hunters
  if(HUNTERS.length) return;
  HISTORY.forEach(r => (r.hunters || []).forEach(h => {
    HA_SEQ += 1;
    HUNTERS.push({license:licenseId(r.edition, h.reg), cid:'legacy-' + r.edition + '-' + h.reg, name:h.name, gender:'—', age:h.age, edition:r.edition, attempts:1, history:[], attrs:null, reason:h.reason, nen:null, registered:null, status:'Active Hunter', legacy:true});
  }));
}
let haPage = 0, haSort = 'license', haDir = 'desc', haEd = '', haQ = '', haCar = '', haFav = false, haZod = false, haFormer = '';
// the register's view and filters: a few quick views up front, everything else behind "Filters" (remembered between visits)
// opens on the register, active Hunters, best first; the council has its own tab
let haView = 'all', haSt = 'Active', haStar = '', haNen = '', haFam = '', haOpen = false, haPane = 'register', haSch = '', haRel = '', haCase = '', haMas = '';
haSort = 'rank'; haDir = 'desc';
try { const s = JSON.parse(localStorage.getItem('hxsim-ha2') || 'null'); if(s) ({haView = 'all', haSt = 'Active', haStar = '', haNen = '', haCar = '', haEd = '', haFormer = '', haFam = '', haSort = 'rank', haDir = 'desc', haPane = 'register', haSch = '', haRel = '', haCase = '', haMas = ''} = s); } catch(e){}
const haKeep = () => { try { localStorage.setItem('hxsim-ha2', JSON.stringify({haView, haSt, haStar, haNen, haCar, haEd, haFormer, haFam, haSort, haDir, haPane, haSch, haRel, haCase, haMas})); } catch(e){} };
const HA_TEXT = ['name','career','gender','status'];   // text columns start A→Z, numbers start high→low
function renderAssociation(){
  const el = $('pane-hunters'); let TOP10 = [];
  const H = HUNTERS, HE = HUNTERS.filter(h => !h.pro);
  const done = HISTORY.length + (S.finished ? 1 : 0);
  const latestEd = HE.length ? Math.max(...HE.map(h => h.edition)) : null;
  const latestN = latestEd === null ? 0 : HE.filter(h => h.edition === latestEd).length;
  const avg = f => HE.length ? (HE.reduce((s, h) => s + f(h), 0) / HE.length) : 0;
  let top = null;
  HE.forEach(h => h.attrs && Object.entries(h.attrs).forEach(([k, v]) => { if(!top || v > top.v) top = {v, k, h}; }));

  // table
  const q = haQ.trim().toLowerCase();
  const CN = council();
  rolesReady();
  const wasR = (h, f) => f === 'Elder' ? isElder(h) : (h.pastRoles || []).some(r => f === 'any' || (f === 'Zodiac' ? !['Chairman', 'Vice-Chairman'].includes(r.r) : r.r === f));
  const official = h => CN.has(h.license) || (h.pastRoles || []).length > 0 || isElder(h);
  const inView = h => haView === 'fav' ? isFav(h.cid) : haView === 'off' ? official(h) : true;
  const stOf = h => hActive(h) ? 'Active' : h.status === 'Deceased' ? 'Deceased' : h.status === 'Missing' ? 'Missing' : 'Retired';
  const edOk = h => !haEd || (haEd === 'main' ? !h.pro && !h.regional : haEd === 'pro' ? h.pro : haEd === 'reg' ? !!h.regional : haEd === 'jub' ? h.special === 'jubilee' : haEd === 'cen' ? h.special === 'centenary' : !h.pro && h.edition === +haEd);
  // family ties with other Hunters: a Hunter spouse (or late spouse), Hunter parents, Hunter children, other Hunter relatives
  const famT = new Map(), byCid = new Map(HUNTERS.map(x => [x.cid, x]));
  const kidsLeg = new Map(); HUNTERS.forEach(x => { if(x.hParent) kidsLeg.set(x.hParent, (kidsLeg.get(x.hParent) || 0) + 1); });
  const fam = h => { if(famT.has(h.license)) return famT.get(h.license);
    const t = {wed: !!((h.spouse && hLic(h.spouse)) || (h.widowOf && hLic(h.widowOf))), par: !!(h.hParent && hLic(h.hParent)), kid: kidsLeg.has(h.license), kin: false};
    lineage(h.license, h.cid).forEach(x => { if(!x.h || x.step) return; if(/^(father|mother|parent)$/.test(x.rel)) t.par = true; else if(/^(son|daughter|child)$/.test(x.rel)) t.kid = true; else t.kin = true; });
    ((h.keep && h.keep.fam && h.keep.fam.kin) || []).forEach(x => { if(byCid.has(x.id)) t.kin = true; });
    famT.set(h.license, t); return t; };
  const RLS = WORLD.relics || {}, holdsR = h => RELICS.some(d => RLS[d.id] && (RLS[d.id].st === 'held' || RLS[d.id].st === 'missing') && (RLS[d.id].holder === h.license || RLS[d.id].holder2 === h.license));
  const relOk2 = (h, f) => f === 'now' ? holdsR(h) : RELICS.some(d => RLS[d.id] && ((RLS[d.id].owners || []).some(o => o.lic === h.license)));
  const CS = WORLD.cases || [], caseOk = (h, f) => f === 'open' ? !!caseOf(h) : f === 'guilty' ? !!h.guiltyEd || !!h.revoked : f === 'cleared' ? !!h.clearedEd : CS.some(c => c.lic === h.license);
  const pupilsOf = new Map(); HUNTERS.forEach(x => { if(x.master) pupilsOf.set(x.master, (pupilsOf.get(x.master) || 0) + 1); });
  const masOk = (h, f) => f === 'master' ? pupilsOf.has(h.license) : f === 'pupil' ? !!h.master : f === 'head' ? (WORLD.schools || []).some(s => schHead(s) && schHead(s).lic === h.license) : true;
  const famOk = (h, f) => { const t = fam(h); return f === 'any' ? t.wed || t.par || t.kid || t.kin : t[f]; };
  const passF = (h, skip) => (skip === 'fam' || !haFam || famOk(h, haFam)) && (skip === 'st' || !haSt || stOf(h) === haSt) && (skip === 'star' || !haStar || hStars(h) >= +haStar) && (skip === 'car' || !haCar || h.career === haCar) && (skip === 'nen' || !haNen || (h.nen && h.nen.category === haNen)) && (skip === 'ed' || edOk(h)) && (skip === 'off' || !haFormer || wasR(h, haFormer)) && (skip === 'sch' || !haSch || (haSch === 'any' ? !!h.school : h.school === haSch)) && (skip === 'rel' || !haRel || relOk2(h, haRel)) && (skip === 'case' || !haCase || caseOk(h, haCase)) && (skip === 'mas' || !haMas || masOk(h, haMas));
  const base = H.filter(h => inView(h) && (!q || h.name.toLowerCase().includes(q) || h.license.toLowerCase().includes(q) || h.cid.toLowerCase().includes(q)));
  let rows = base.filter(h => passF(h));
  // option counts follow the other active filters, so an option never leads to an empty table
  const cnt = (skip, f) => base.filter(h => passF(h, skip) && f(h)).length;
  const opt = (skip, cur, list) => list.map(([v, l, f]) => { const n = v === '' ? null : cnt(skip, f); return n === 0 && cur !== v ? '' : `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(l)}${n != null ? ` (${n})` : ''}</option>`; }).join('');
  haKeep();
  const sk = haSort;
  const val = {license: h => h.pro ? -1 : parseInt(h.license.slice(3)), name: h => h.name, career: h => h.career || '', gender: h => h.gender || '', status: h => h.status || '',
    rank: h => (hActive(h) ? 1e7 : 0) + hStars(h) * 1e6 + (h.rp || 0), school: h => { const x = schOf(h.school); return x ? x.name.replace(/^the /, '') : ''; }, age: h => apAge(h), now: h => hunterAge(h), attempts: h => h.attempts || -1, edition: h => h.pro ? -1 : h.edition}[sk] || (h => h.attrs ? h.attrs[sk] : -1);
  const dir = haDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => { const x = val(a), y = val(b); const c = typeof x === 'string' ? x.localeCompare(y) : x - y; return c * dir || a.license.localeCompare(b.license); });
  const per = 25, pages = Math.max(1, Math.ceil(rows.length / per)); haPage = clamp(haPage, 0, pages - 1);
  const th = (k, l) => `<th class="sortable${sk === k ? ' on' : ''}" data-hasort="${k}" aria-sort="${sk === k ? (haDir === 'asc' ? 'ascending' : 'descending') : 'none'}" title="Sort by ${l}">${l}<i>${sk === k ? (haDir === 'asc' ? '▲' : '▼') : '↕'}</i></th>`;
  const edOpts = (H.some(h => h.pro) ? `<option value="pro" ${haEd === 'pro' ? 'selected' : ''}>Veterans (before records)</option>` : '') + [...new Set(HE.map(h => h.edition))].sort((a,b) => b - a).map(e => `<option value="${e}" ${haEd == e ? 'selected' : ''}>${ordinal(e)} Hunter Exam</option>`).join('');
  const sortOpts = [['license','License ID'],['rank','Rank'],['name','Name'],['career','Specialty'],['gender','Gender'],['status','Status'],['now','Current age'],['age','Age at approval'],['attempts','Number of attempts'],['edition','Exam edition']].concat(ATTRS.map(a => [a[0], a[1]])).map(([v,l]) => `<option value="${v}" ${haSort === v ? 'selected' : ''}>Sort: ${l}</option>`).join('');
  $('pane-assoc').innerHTML = '';
  el.innerHTML = `${pageHead('Council & register', 'Hunter Association', 'var(--gold)')}${advanceBarHtml()}
    ${`<div class="stats hastats">
      <div class="stat gold"><b>${H.filter(hActive).length}</b><span>Active Hunters</span></div>
      <div class="stat"><b>${H.length}</b><span>Registered Hunters</span></div>
      <div class="stat"><b>${H.filter(h => hActive(h) && hStars(h) === 3).length}</b><span>★★★ Hunters</span></div>
      <div class="stat"><b>${H.length ? avg(h => apAge(h)).toFixed(1) : '—'}</b><span>Avg age at approval</span></div>
      <div class="stat"><b>${(() => { const A = H.filter(h => hActive(h) && !h.legacy); return A.length ? (A.reduce((s, h) => s + hunterAge(h), 0) / A.length).toFixed(1) : '—'; })()}</b><span>Avg age of active Hunters</span></div>
      <div class="stat"><b>${(() => { const X = H.filter(h => h.attempts); return X.length ? (X.reduce((s, h) => s + h.attempts, 0) / X.length).toFixed(2) : '—'; })()}</b><span>Avg attempts</span></div>
    </div>
    ${councilHtml()}
    <div class="ha-two"><div><div class="section-h">Top Hunters</div><div class="toph">${(TOP10 = H.filter(h => hActive(h) && !h.legacy).sort((a, b) => rpRecent(b) - rpRecent(a) || hStars(b) - hStars(a)).slice(0, 10)).map((h, i) => `<div data-hunter="${esc(h.license)}"><small>${i + 1}</small><span><b>${esc(h.name)}</b> <span class="muted">${esc((h.career || '').replace(' Hunter', ''))}</span></span><span class="stars">${starStr(hStars(h)) || '<span class="muted">—</span>'}</span></div>`).join('') || '<p class="muted" style="margin:0">Nobody yet.</p>'}</div></div>
        <div><div class="section-h">Rising Hunters</div><div class="toph">${H.filter(h => hActive(h) && !h.legacy && !TOP10.includes(h) && S.edition - h.edition <= 10 && h.edition < S.edition + (S.finished ? 1 : 0)).sort((a, b) => (b.rp || 0) / Math.max(1, S.edition - b.edition) - (a.rp || 0) / Math.max(1, S.edition - a.edition) || hStars(b) - hStars(a)).slice(0, 5).map((h, i) => `<div data-hunter="${esc(h.license)}"><small>${i + 1}</small><span><b>${esc(h.name)}</b> <span class="muted">${esc((h.career || '').replace(' Hunter', ''))}</span></span><span class="stars">${starStr(hStars(h)) || `<span class="muted mono-s">${ordinal(h.edition)} · ${hunterAge(h)}</span>`}</span></div>`).join('') || '<p class="muted" style="margin:0">Nobody yet.</p>'}</div></div></div>`}${`
    <div class="section-h ha-regh">Register</div>
    ${(() => {
      const nMore = [haCar, haNen, /^\d/.test(haEd) ? haEd : '', haFormer, haFam, haSch, haRel, haCase, haMas, ATTR_LABEL[haSort] ? 1 : ''].filter(Boolean).length;
      const chip = (k, label) => `<button class="fchip" data-haclr="${k}">${esc(label)} <i aria-hidden="true">×</i></button>`;
      const edLabel = haEd === 'main' ? 'Main exam' : haEd === 'pro' ? 'Veterans' : haEd === 'reg' ? 'Regional' : haEd === 'jub' ? 'Jubilee' : haEd === 'cen' ? 'Centennial' : haEd ? ordinal(+haEd) + ' exam' : '';
      const offLabel = {any: 'Any former office', Chairman: 'Former Chairmen', 'Vice-Chairman': 'Former Vices', Zodiac: 'Former Zodiac', Elder: 'Elders'}[haFormer];
      const schL = haSch === 'any' ? 'In a school' : haSch ? capS((schOf(haSch) || {name: 'a school'}).name) : '';
      const chips = [haSt && chip('st', haSt), haStar && chip('star', '★'.repeat(+haStar) + '+'), haCar && chip('car', haCar.replace(' Hunter', '')), haNen && chip('nen', haNen), haEd && chip('ed', edLabel), haFormer && chip('off', offLabel), haFam && chip('fam', {any: 'Hunter family', wed: 'Married to a Hunter', par: 'Hunter parent', kid: 'Hunter child', kin: 'Hunter relatives'}[haFam]), haSch && chip('sch', schL), haRel && chip('rel', haRel === 'now' ? 'Holds a relic' : 'Held a relic'), haCase && chip('case', {open: 'Case open', guilty: 'Found guilty', cleared: 'Cleared', any: 'Ever accused'}[haCase]), haMas && chip('mas', {master: 'Has students', pupil: 'Trained by a master', head: 'Master of a school'}[haMas]), ATTR_LABEL[haSort] && chip('sort', 'Sorted by ' + ATTR_LABEL[haSort])].filter(Boolean);
      const careers = [...new Set(H.map(h => h.career).filter(Boolean))].sort();
      const pill = (key, cur, v, label, f, extra) => { const n = v === '' ? null : cnt(key, f); return `<button type="button" class="hpill${cur === v ? ' on' : ''}" data-hapill="${key}:${esc(v)}" ${n === 0 && cur !== v ? 'disabled' : ''} ${extra || ''}>${label}${n != null ? `<small>${n}</small>` : ''}</button>`; };
      const sch = (WORLD.schools || []).filter(x => H.some(h => h.school === x.id)).sort((a, b) => a.name.replace(/^the /, '').localeCompare(b.name.replace(/^the /, '')));
      return `<div class="ha-bar"><input id="haq" type="search" placeholder="Search name or license" value="${esc(haQ)}" aria-label="Search Hunters">
        <div class="seg" role="group" aria-label="View">${[['all', 'Everyone'], ['fav', '★ Favorites'], ['off', 'Officials']].map(([v, l]) => `<button type="button" data-haview="${v}" aria-pressed="${haView === v}">${l}</button>`).join('')}</div></div>
      <div class="ha-quick">
        <div class="hq-row"><span class="hq-l">Status</span>${[['', 'Any'], ['Active', 'Active'], ['Retired', 'Retired'], ['Deceased', 'Deceased'], ['Missing', 'Missing']].map(([v, l]) => pill('st', haSt, v, l, h => stOf(h) === v)).join('')}</div>
        <div class="hq-row"><span class="hq-l">Rank</span>${[['', 'Any'], ['1', '★+'], ['2', '★★+'], ['3', '★★★']].map(([v, l]) => pill('star', haStar, v, l, h => hStars(h) >= +v)).join('')}</div>
        <div class="hq-row"><span class="hq-l">Licensed</span>${[['', 'Any'], ['main', 'Main exam', h => !h.pro && !h.regional], ['reg', 'Regional office', h => !!h.regional], ['pro', 'Before the records', h => h.pro]].map(([v, l, f]) => pill('ed', haEd, v, l, f)).join('')}</div>
        <div class="hq-row"><span class="hq-l"></span><button type="button" class="btn small ha-fbtn" id="hafbtn" aria-expanded="${haOpen}">More filters${nMore ? ` · ${nMore}` : ''}</button></div>
      </div>
      ${haOpen ? `<div class="ha-panel">
        <div><small>Specialty & Nen</small>
          <select id="hacar" aria-label="Specialty">${opt('car', haCar, [['', 'Any specialty']].concat(careers.map(c => [c, c.replace(' Hunter', ''), h => h.career === c])))}</select>
          <select id="hanen" aria-label="Nen type">${opt('nen', haNen, [['', 'Any Nen type']].concat(NEN_CATS.map(c => [c, c, h => h.nen && h.nen.category === c])))}</select></div>
        <div><small>Origin</small>
          <select id="haed" aria-label="Origin">${opt('ed', haEd, [['', 'Any origin'], ['main', 'Main exam', h => !h.pro && !h.regional], ['pro', 'Veterans (before records)', h => h.pro], ['reg', 'Regional offices', h => !!h.regional], ['jub', 'Jubilee exams', h => h.special === 'jubilee'], ['cen', 'Centennial exams', h => h.special === 'centenary']].concat([...new Set(HE.map(h => h.edition))].sort((a, b) => b - a).map(e => [String(e), ordinal(e) + ' Hunter Exam', h => !h.pro && h.edition === e])))}</select></div>
        <div><small>Office</small>
          <select id="haformer" aria-label="Office">${opt('off', haFormer, [['', 'Any'], ['any', 'Any former office', h => wasR(h, 'any')], ['Chairman', 'Former Chairmen', h => wasR(h, 'Chairman')], ['Vice-Chairman', 'Former Vice-Chairmen', h => wasR(h, 'Vice-Chairman')], ['Zodiac', 'Former Zodiac', h => wasR(h, 'Zodiac')], ['Elder', 'Elders of the Association', h => isElder(h)]])}</select></div>
        <div><small>Family</small>
          <select id="hafam" aria-label="Family">${opt('fam', haFam, [['', 'Any'], ['any', 'Any Hunter in the family', h => famOk(h, 'any')], ['wed', 'Married to a Hunter', h => famOk(h, 'wed')], ['par', 'Child of a Hunter', h => famOk(h, 'par')], ['kid', 'Parent of a Hunter', h => famOk(h, 'kid')], ['kin', 'Siblings & other relatives', h => famOk(h, 'kin')]])}</select></div>
        <div><small>School</small>
          <select id="hasch" aria-label="School">${opt('sch', haSch, [['', 'Any'], ['any', 'In any school', h => !!h.school]].concat(sch.map(x => [x.id, capS(x.name), h => h.school === x.id])))}</select>
          <select id="hamas" aria-label="Master">${opt('mas', haMas, [['', 'Teacher or student: any'], ['master', 'Has students', h => masOk(h, 'master')], ['head', 'Master of a school', h => masOk(h, 'head')], ['pupil', 'Trained by a master', h => masOk(h, 'pupil')]])}</select></div>
        <div><small>Relics & cases</small>
          <select id="harel" aria-label="Relics">${opt('rel', haRel, [['', 'Relics: any'], ['now', 'Holds a relic', h => relOk2(h, 'now')], ['ever', 'Ever held a relic', h => relOk2(h, 'ever')]])}</select>
          <select id="hacase" aria-label="Cases">${opt('case', haCase, [['', 'Cases: any'], ['open', 'Case open', h => caseOk(h, 'open')], ['guilty', 'Found guilty', h => caseOk(h, 'guilty')], ['cleared', 'Cleared', h => caseOk(h, 'cleared')], ['any', 'Ever accused', h => caseOk(h, 'any')]])}</select></div>
        <div><small>Sort by attribute</small>
          <select id="hasort" aria-label="Sort by attribute"><option value="">— (use the column headers)</option>${ATTRS.map(a => `<option value="${a[0]}" ${haSort === a[0] ? 'selected' : ''}>${a[1]}</option>`).join('')}</select></div>
      </div>` : ''}
      <div class="fchips"><span class="ha-count"><b>${rows.length}</b> of ${H.length} Hunters</span>${chips.join('')}${chips.length ? `<button class="fchip clr" data-haclr="all">Clear all</button>` : ''}</div>`;
    })()}
    ${rows.length ? `<div class="tablebox"><table class="hatable ha-reg"><thead><tr>${th('license','License ID')}${th('name','Name')}${th('career','Specialty')}${th('rank','Rank')}${th('school','School')}${th('now','Age now')}${th('edition','Edition')}${ATTR_LABEL[sk] ? th(sk, ATTR_LABEL[sk]) : ''}${th('status','Status')}</tr></thead><tbody>
      ${rows.slice(haPage*per, haPage*per + per).map(h => `<tr data-hunter="${esc(h.license)}"><td class="num c-lic">${h.license}</td><td class="c-name">${isFav(h.cid) ? '<span style="color:var(--gold)">★</span> ' : ''}${roleOf(h) ? `<span class="role" title="${esc(roleFull(h))}">${roleOf(h) === 'Chairman' ? '♛' : roleOf(h) === 'Vice-Chairman' ? 'V' : roleOf(h).split(' · ')[1]}</span> ${zodOf(h) && !roleOf(h).startsWith('Zodiac') ? `<span class="role" title="${esc(zodOf(h))} of the Zodiac">${zodOf(h)}</span> ` : ''}` : ''}${h.nen ? `<i class="ndot" style="background:${NEN_COLOR[h.nen.category]}" title="${h.nen.category}"></i> ` : ''}${esc(h.name)}${h.nick ? ` <span class="hnick">“${esc(h.nick)}”</span>` : ''}${h.special && h.special !== 'regional' ? ` <span class="xtag sm sp">${h.special === 'centenary' ? (h.starCup === 'champion' ? '★C' : 'C') : 'J'}</span>` : ''}${h.catTag ? ` <span class="xtag sm cat" title="Licensed for ${esc(PR(h).their)} part in ${esc((h.catName || h.catTag).toLowerCase())}">✚</span>` : ''}${h.regional ? ` <span class="xtag sm reg" title="Licensed by the regional office in ${esc(h.regional)}">R</span>` : ''}${pastTags(h).slice(0, 2).map(x => ` <span class="xtag sm">ex-${esc(x.r === 'Vice-Chairman' ? 'Vice' : x.r)}${x.n > 1 ? ' ×' + x.n : ''}</span>`).join('')}</td><td class="c-car">${h.career ? `<span class="ctag">${esc(h.career.replace(' Hunter', ''))}</span>` : '<span class="muted">—</span>'}${(h.examined || []).length ? ' <span class="muted" title="Has served as an examiner">◆</span>' : ''}</td><td class="stars c-rank">${starStr(hStars(h)) || '<span class="muted">—</span>'}</td><td class="c-sch">${schOf(h.school) ? `<a class="golink sm" data-school="${h.school}" title="Open the school">${esc(capS(schOf(h.school).name))}</a>` : '<span class="muted">—</span>'}</td><td class="num c-age">${ageTxt(h)}</td><td class="c-ed">${h.pro ? '<span class="muted">Veteran</span>' : h.regional ? `<span class="muted" title="Licensed by the regional office in ${esc(h.regional)}">Regional</span>` : ordinal(h.edition)}</td>${ATTR_LABEL[sk] ? `<td class="num">${h.attrs ? h.attrs[sk] : '—'}</td>` : ''}<td class="c-st">${hStatusCell(h)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="pager"><span>${rows.length} Hunter${rows.length === 1 ? '' : 's'} · page ${haPage+1} of ${pages}</span><button class="btn small" data-hap="-1" ${haPage === 0 ? 'disabled' : ''}>Prev</button><button class="btn small" data-hap="1" ${haPage >= pages-1 ? 'disabled' : ''}>Next</button></div>`
      : `<div class="empty">${H.length ? 'No Hunters match this search.' : 'No Hunters registered yet. Finish an exam and its new Hunters are added here automatically.'}</div>`}`}`;
  el.querySelectorAll('[data-hapill]').forEach(b => b.onclick = () => { const [k, v] = b.dataset.hapill.split(':'); if(k === 'st') haSt = v; else if(k === 'star') haStar = v; else if(k === 'nen') haNen = haNen === v ? '' : v; else if(k === 'ed') haEd = v; haPage = 0; renderAssociation(); });
  $('haq').oninput = e => { haQ = e.target.value; haPage = 0; renderAssociation(); const i = $('haq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  const set = (id, fn) => { const x = $(id); if(x) x.onchange = e => { fn(e.target.value); haPage = 0; renderAssociation(); }; };
  set('haed', v => haEd = v); set('hacar', v => haCar = v); set('haformer', v => haFormer = v); set('hafam', v => haFam = v); set('hast', v => haSt = v); set('hastar', v => haStar = v); set('hanen', v => haNen = v); set('hasch', v => haSch = v); set('harel', v => haRel = v); set('hacase', v => haCase = v); set('hamas', v => haMas = v);
  set('hasort', v => { haSort = v || 'rank'; haDir = 'desc'; });
  $('hafbtn').onclick = () => { haOpen = !haOpen; renderAssociation(); };
  el.querySelectorAll('[data-haview]').forEach(b => b.onclick = () => { haView = b.dataset.haview; haPage = 0; renderAssociation(); });
  el.querySelectorAll('[data-haclr]').forEach(b => b.onclick = () => { const k = b.dataset.haclr;
    if(k === 'st' || k === 'all') haSt = ''; if(k === 'star' || k === 'all') haStar = ''; if(k === 'car' || k === 'all') haCar = ''; if(k === 'nen' || k === 'all') haNen = '';
    if(k === 'ed' || k === 'all') haEd = ''; if(k === 'off' || k === 'all') haFormer = ''; if(k === 'fam' || k === 'all') haFam = ''; if(k === 'sch' || k === 'all') haSch = ''; if(k === 'rel' || k === 'all') haRel = ''; if(k === 'case' || k === 'all') haCase = ''; if(k === 'mas' || k === 'all') haMas = ''; if(k === 'sort' || (k === 'all' && ATTR_LABEL[haSort])) { haSort = 'rank'; haDir = 'desc'; }
    haPage = 0; renderAssociation(); });
}
const hStatus = h => `<span class="st ${hActive(h) ? 'Approved' : h.status === 'Deceased' ? 'Deceased' : 'Eliminated'}">${esc(h.status === 'Retired' && h.licSold ? 'License sold' : h.status || 'Active Hunter')}</span>`;
const hStatusCell = h => hActive(h) ? '<span class="muted">Active</span>' : hStatus(h);
function openHunter(license){
  const h = HUNTERS.find(x => x.license === license); if(!h) return;
  modalBack = null;
  const groups = {}; ATTRS.forEach(([k,l,g]) => (groups[g] = groups[g] || []).push([k,l]));
  let attrs = '';
  const A0 = h.attrs0;   // as licensed; the bar shows today, the tick shows then
  if(h.mStart){ const lic = h.attrs0 || h.attrs, g = Object.keys(h.mStart).reduce((s, k) => s + ((lic[k] || 0) - h.mStart[k]), 0); if(g > 0) attrs += `<div class="grp mt-since">◆ Trained by you · +${g} skill points from your lodge to the license</div>`; }
  if(h.attrs) for(const g in groups) attrs += `<div class="grp">${g}</div>` + groups[g].map(([k,l]) => { const d = A0 ? h.attrs[k] - A0[k] : 0;
    return `<div class="attr${A0 ? ' grow' : ''}"><span>${l}</span><span class="t"><i style="width:${h.attrs[k]}%"></i>${A0 && d ? `<b style="left:${A0[k]}%" title="At approval: ${A0[k]}"></b>` : ''}</span><span class="v">${h.attrs[k]}${A0 ? `<small class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? '+' + d : d < 0 ? d : ''}</small>` : ''}</span></div>`; }).join('');
  const hist = (h.history || []).slice().reverse().map(x => `<details class="eh" open><summary><b>${ordinal(x.edition)} Hunter Exam</b><span class="eh-r ${x.result === 'Licensed Hunter' ? 'ok' : 'bad'}">${esc(x.result || '')}</span></summary>
      <div class="eh-b"><span>Age <b>${x.age}</b></span><span><span class="regn">#${x.reg}</span></span><span>Reached <b>${esc(x.phaseName || '—')}</b></span></div>
      <div class="eh-i">Improvements on entry: ${x.improvements && x.improvements.length ? x.improvements.map(k => ATTR_LABEL[k] + ' +' + (x.impAmt || 2)).join(', ') : 'None (first attempt)'}</div>
      ${x.reason ? `<div class="eh-i">${esc(clean(x.reason))}</div>` : ''}</details>`).join('');
  showModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(h.name)}">
    <div class="sheet-head"><div><div class="meta">Hunter Association · ${h.license}</div><div class="sh-t"><h2>${esc(h.name)}</h2>${hStatus(h)}</div>${h.nick ? `<div class="meta knownas">Known as <b>“${esc(h.nick)}”</b>${(h.nickWhy || (h.keep && h.keep.nick && h.keep.nick.why)) ? ` — ${esc(h.nickWhy || h.keep.nick.why)}` : ''}${h.nickEd && h.nickEd !== h.edition ? ` (since the ${ordinal(h.nickEd)})` : h.keep && h.keep.ed ? ` (${ordinal(h.keep.ed)} exam)` : ''}</div>` : ''}
      <div class="meta">${h.pro ? `Veteran professional · ${h.gender} · ${h.status === 'Deceased' ? `died at ${ageTxt(h)}` : h.status === 'Missing' ? `${hunterAge(h)} years old ?` : `${hunterAge(h)} years old`} · ${(() => { const y = (h.years || 0) + Math.max(0, S.edition - h.edition); const at = h.age - (h.years || 0); return y ? `licensed at ${at}, ${y} year${y === 1 ? '' : 's'} ago` : `licensed at ${at}, this year`; })()}, before the exam records began` : h.regional ? `Regional license · ${esc(h.regional)} office · ${h.gender} · ${h.status === 'Deceased' ? `died at ${ageTxt(h)}` : h.status === 'Missing' ? `${hunterAge(h)} years old ?` : `${hunterAge(h)} years old now`} · licensed at ${h.age}` : `${h.gender} · ${h.status === 'Deceased' ? `died at ${ageTxt(h)}` : h.status === 'Missing' ? `${hunterAge(h)} years old ?` : `${hunterAge(h)} years old now`} · approved at ${h.age} · ${h.attempts} attempt${h.attempts === 1 ? '' : 's'}`}</div>
      ${pastTags(h).length || specialTags(h).length ? `<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${specialTags(h).map(x => `<span class="xtag sp">${esc(x)}</span>`).join('')}${pastTags(h).map(x => `<span class="xtag" title="${esc((h.pastRoles || []).filter(y => y.r === x.r).map(yrs).join(', '))}">${esc(x.label)}</span>`).join('')}</div>` : ''}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${favBtn(h.cid)}<button class="btn" id="mClose">Close</button></div></div>
    ${roleBanner(h)}${retireBanner(h)}
    <div class="hcard"><div><small>License</small><b>${h.license}</b></div><div><small>Rank</small><b class="stars">${starStr(hStars(h)) || '<span class="muted">Unranked</span>'}</b></div><div><small>Specialty</small><b>${esc(h.career || '—')}</b></div><div><small>Hometown</small><b>${esc(homeOf(h))}</b></div>${schOf(h.school) ? `<div><small>School</small><b style="display:flex;gap:8px;align-items:center">${schoolCrest(schOf(h.school), 30)}<a class="golink" data-school="${h.school}" title="Open the school">${esc(capS(schOf(h.school).name))} ›</a></b></div>` : ''}<div><small>${h.regional ? 'Licensed by' : 'Edition passed'}</small><b>${h.pro ? 'Before records' : h.regional ? esc(h.regional.replace(/^the /, '').replace(/^./, s => s.toUpperCase())) + ' office' : ordinal(h.edition)}</b></div>${(() => { const y = Math.max(0, (h.pro ? (h.years || 0) : 0) + S.edition - h.edition); return `<div><small>Licensed</small><b>${y === 0 ? 'This year' : y === 1 ? '1 year ago' : y + ' years ago'}</b></div>`; })()}<div><small>${h.pro ? 'Background' : 'How they passed'}</small><b style="font-weight:400;font-size:13px">${esc(h.reason || '—')}</b></div></div>
    ${(() => { const B = (h.bonds || []).filter(b => cmap(S)[b.id] || HUNTERS.some(x => x.cid === b.id));   // only bonds you can click through to
      return B.length ? `<div><div class="section-h">Unbreakable bonds</div><div class="grs">${B.map(bondRow).join('')}</div></div>` : ''; })()}
    ${(() => { const L = x => { const o = hLic(x); return o ? `<a data-hunter="${esc(o.license)}">${esc(o.name)}</a>` : ''; };
      const kids = [], par = [];   // children and parents now live in the Family block
      const kl = kids.length ? `<p class="h-fam"><span>✦</span> ${kids.length === 1 ? 'Child' : 'Children'}: ${kids.map(k => { const kh = HUNTERS.find(x => x.cid === k.cid); return `${kh ? L(kh.license) : esc(k.name)} <span class="muted">(born after the ${ordinal(k.born)}${kh ? ', licensed in the ' + ordinal(kh.edition) : k.entered ? ', took the ' + ordinal(k.entered) + ' exam' : ''})</span>`; }).join(', ')}</p>` : '';
      const pl = par.length ? `<p class="h-fam"><span>✦</span> Child of ${par.map(x => L(x.license)).join(' and ')}</p>` : '';
      return pl + kl; })()}
    ${lineageHtml(h.license, h.cid, spouseRow(h))}
    ${schoolRowHtml(h)}
    ${relicRowHtml(h)}
    ${(() => { const K = S.candidates.filter(c => c.hParent === h.license && legendKnown(c)); return K.length ? `<p class="h-fam"><span>✦</span> ${K.length === 1 ? 'Child' : 'Children'} in the ${ordinal(S.edition)} exam: ${K.map(c => `<a data-id="${c.id}">${esc(c.name)}</a>`).join(', ')}</p>` : ''; })()}
    ${(h.log || []).length || h.originNote ? `<div><div class="section-h">Career</div><div class="bulletin career">${careerHtml(h)}${h.originNote ? `<div class="bl origin"><i>◉</i><span><span class="muted">Before the records</span> ${esc(h.originNote.startsWith(h.name + ' ') ? h.originNote.slice(h.name.length + 1) : h.originNote)}</span></div>` : ''}</div></div>` : ''}
    ${h.nen ? nenPanel({nen: h.nen}) : ''}
    ${keepHtml(h)}
    ${(h.examined || []).length ? `<details class="pf-more"><summary>Examiner duty · ${h.examined.length}</summary><div class="duty">${h.examined.map(x => `<div><b>${ordinal(x.edition)} Hunter Exam</b><span>${esc(x.phase)}</span><span class="exs ${x.style}">${esc(x.style)}</span></div>`).join('')}</div></details>` : ''}
    <details class="pf-more"><summary>${h.attrs0 ? `Attributes <span class="muted" style="font-weight:400;text-transform:none;letter-spacing:0">· ${hActive(h) ? 'now' : h.status === 'Deceased' ? 'at death' : h.status === 'Missing' ? 'when last seen' : 'at retirement'}, against the year they were licensed</span>` : h.pro ? 'Attributes' : 'Attributes at approval'}</summary>${h.attrs ? `<div class="attrs">${attrs}</div>` : '<p class="muted" style="margin:0">Not recorded for this older entry.</p>'}</details>
    ${h.pro ? '' : `<details class="pf-more"><summary>Exam history${(h.history || []).length ? ` · ${h.history.length} attempt${h.history.length === 1 ? '' : 's'}` : ''}</summary>${hist ? `<div class="ehs">${hist}</div>` : '<p class="muted" style="margin:0">Not recorded for this older entry.</p>'}</details>`}
    ${h.cid && !h.pro ? `<div class="pf-id">Candidate ID ${esc(h.cid)}</div>` : ''}
  </div>`);
}

/* ---------- Alliances panel ---------- */
let alFilter = 'all', alSort = 'passed', alShow = 40;
function renderAlliancesTab(){
  const el = $('pane-alli'), m = cmap(S);
  const AL = (S.alliances || []).filter(A => A.ever.length >= 2);
  const liveN = A => A.members.filter(id => m[id] && ALIVE(m[id].status)).length;
  const state = A => liveN(A) >= 2 ? 'together' : 'dissolved';
  const hunters = A => A.ever.filter(id => m[id] && m[id].status === 'Approved').length;
  const passed = A => A.ever.filter(id => m[id] && (m[id].status === 'Approved' || m[id].status === 'Active' || m[id].status === 'Finalist')).length; // Hunters, or still in while the exam runs
  let rows = AL.filter(A => alFilter === 'all' || (alFilter === 'family' ? A.family : state(A) === alFilter));
  const key = {passed: A => passed(A) * 1000 + hunters(A) * 100 + (A.together || 0), saves: A => (A.saves || 0), together: A => (A.together || 0), size: A => A.ever.length, hunters: A => hunters(A)}[alSort];
  rows.sort((a, b) => key(b) - key(a) || (b.together || 0) - (a.together || 0));
  const totalSaves = AL.reduce((s, A) => s + (A.saves || 0), 0), totalBetr = AL.reduce((s, A) => s + (A.betrayals || 0), 0);
  const allied = new Set(AL.flatMap(A => A.ever));
  const ap = S.candidates.filter(c => c.status === 'Approved');
  const apAllied = ap.filter(c => allied.has(c.id)).length;
  const chip = id => { const o = m[id]; if(!o) return ''; const cls = o.status === 'Approved' ? 'h' : ALIVE(o.status) ? 'a' : o.status === 'Deceased' ? 'd' : 'x';
    return `<a class="amem ${cls}" data-id="${o.id}" title="${o.status === 'Approved' ? 'Hunter' : o.status}${!(m[id].alliance && AL.some(A => A.members.includes(id))) ? '' : ''}">${esc(o.name)}</a>`; };
  el.innerHTML = `<div class="rep-head"><div><div class="meta">${ordinal(S.edition)} Hunter Exam</div><h2>Alliances</h2></div>
      <div class="rep-nums"><span><b>${AL.length}</b>alliances</span><span><b>${AL.filter(A => A.family).length}</b>families</span><span><b>${AL.filter(A => state(A) === 'together').length}</b>still together</span><span><b>${totalSaves}</b>saves by allies</span><span class="out"><b>${totalBetr}</b>betrayals</span>${S.finished ? `<span><b>${apAllied}/${ap.length}</b>Hunters had allies</span>` : ''}</div></div>
    <div class="bar-tools">
      <div class="legend">${[['all','All'],['family','Families'],['together','Still together'],['dissolved','Dissolved']].map(([v,l]) => `<button class="chip" data-alf="${v}" aria-pressed="${alFilter === v}">${l}</button>`).join('')}</div>
      <select id="alsort" aria-label="Sort alliances">${[['passed', S.finished ? 'Most members passed' : 'Most members still in'],['saves','Most saves'],['together','Longest together'],['size','Largest'],['hunters','Most Hunters']].map(([v,l]) => `<option value="${v}" ${alSort === v ? 'selected' : ''}>Sort: ${l}</option>`).join('')}</select>
    </div>
    ${rows.length ? `<div class="acards">${rows.slice(0, alShow).map(A => `<div class="acd ${state(A)}${A.family ? ' family' : ''}">
        <div class="acd-h"><b>${esc(A.name || 'Unnamed alliance')}</b><span class="acd-s">${A.family ? '<span class="ftag">Family</span> ' : ''}${state(A) === 'together' ? 'Together' : 'Dissolved'}</span></div>
        <div class="acd-m">${A.family ? `Registered together as #${Math.min(...A.ever.map(id => m[id].reg))}–#${Math.max(...A.ever.map(id => m[id].reg))}` : `Formed in the ${esc(PHASES[A.formed].name)}`} · ${A.ever.length} member${A.ever.length === 1 ? '' : 's'} over time</div>
        <div class="acd-n"><span class="${passed(A) ? 'ok' : ''}"><b>${passed(A)}/${A.ever.length}</b> ${S.finished ? 'passed' : 'still in'}</span><span><b>${A.together || 0}</b> trials together</span><span><b>${A.saves || 0}</b> saves</span>${A.betrayals ? `<span class="bad"><b>${A.betrayals}</b> betrayal${A.betrayals === 1 ? '' : 's'}</span>` : ''}${hunters(A) ? `<span class="gold"><b>${hunters(A)}</b> Hunter${hunters(A) === 1 ? '' : 's'}</span>` : ''}</div>
        <div class="amems">${A.ever.map(chip).join('')}</div></div>`).join('')}</div>
      ${rows.length > alShow ? `<div><button class="btn small" data-almore>Show more (${rows.length - alShow} left)</button></div>` : ''}`
      : `<div class="empty">${S.started ? 'No alliances match this filter.' : 'Alliances form once the exam starts and candidates meet.'}</div>`}
    <p class="muted" style="margin:0;font-size:12px">Member colours: <span style="color:var(--green)">still in</span> · <span style="color:var(--gold)">Hunter</span> · <span style="color:var(--red)">eliminated or disqualified</span> · <span style="color:var(--dead)">deceased</span>.</p>`;
  $('alsort').onchange = e => { alSort = e.target.value; alShow = 40; renderAlliancesTab(); };
}

function openArchive(ed){
  const r = HISTORY.find(x => x.edition === ed); if(!r) return;
  modalBack = null;
  const P = r.snap ? r.snap.people : {};
  const nm = id => id === 'examiner' ? 'Examiner' : P[id] ? `${esc(P[id].n)} <span class="muted">#${P[id].r}</span>` : '—';
  const sec = (t, b) => b ? `<div><div class="section-h">${t}</div>${b}</div>` : '';
  let body = '';
  if(!r.snap){
    body = `<p class="muted" style="margin:0">Only a summary was kept for this older edition.</p>` + sec('New Hunters', r.hunters.map(h => `<div class="arow"><b>${esc(h.name)}</b> <span class="regn">#${h.reg}</span> <span class="muted">${esc(h.best)}</span></div>`).join('') || '<span class="muted">None</span>');
  } else {
    const sn = r.snap;
    const route = `<div class="tablebox"><table><thead><tr><th>Phase</th><th>Examiner</th><th>Entered</th><th>Advanced</th></tr></thead><tbody>${sn.phases.map(ph => `<tr><td>${esc(ph.name)} <span class="muted">${esc(ph.group)}</span></td><td>${ph.ex ? `${esc(ph.ex.name)} <span class="exs ${ph.ex.style}">${esc(ph.ex.style)}</span>${ph.ex.license ? ' ★' : ''}` : '<span class="muted">—</span>'}</td><td class="num">${ph.before ?? '—'}</td><td class="num">${ph.after ?? '—'}</td></tr>`).join('')}</tbody></table></div>`;
    const hunters = r.hunters.length ? r.hunters.map(h => `<div class="arow"><b>${esc(h.name)}</b> <span class="regn">#${h.reg}</span> <span class="muted">${esc(h.career || h.best)}</span><div class="muted" style="font-size:12px">${esc(h.reason || '')}</div></div>`).join('') : '<span class="muted">Nobody earned a license.</span>';
    const mline = x => x.bye ? `<div class="mline muted">${nm(x.a || x.b)} — bye</div>` : `<div class="mline${x.fatal ? ' bad' : ''}">${nm(x.a)} <span class="muted">vs</span> ${x.examiner ? esc(x.examiner) : nm(x.b)} → <b>${x.fatal ? 'fatal — both removed' : nm(x.w)}</b> <span class="muted">${esc(x.how || '')}</span></div>`;
    const br = sn.bracket ? [sn.bracket.prelim.length ? `<div class="mround"><small>Preliminary</small>${sn.bracket.prelim.map(mline).join('')}</div>` : '', ...sn.bracket.rounds.map((rd, i) => `<div class="mround"><small>${i === sn.bracket.rounds.length - 1 ? 'Last match' : 'Round ' + (i + 1)}</small>${rd.map(mline).join('')}</div>`), sn.bracket.solo ? `<div class="mround"><small>License bout</small>${mline(sn.bracket.solo)}</div>` : '', ...(sn.bracket.groups || []).map(g => g.rounds.map((rd, i) => `<div class="mround"><small>${esc(g.name)} · ${i === g.rounds.length - 1 ? 'Last match' : 'Round ' + (i + 1)}</small>${rd.map(mline).join('')}</div>`).join(''))].join('') : '';
    const zv = sn.zevil ? `<div class="tablebox"><table><thead><tr><th>Candidate</th><th>Badges</th><th>Points</th></tr></thead><tbody>${sn.zevil.map(z => `<tr><td>${nm(z.id)}${z.gone ? ` <span class="muted">· ${z.gone === 'Deceased' ? 'killed' : 'disqualified'}</span>` : ''}</td><td class="num">${z.badges}</td><td class="num" style="color:${z.pts >= 6 ? 'var(--green)' : 'var(--muted)'}">${z.pts}</td></tr>`).join('')}</tbody></table></div>` : '';
    const al = sn.alliances.length ? sn.alliances.map(A => `<div class="arow"><b>${esc(A.name)}</b>${A.family ? ' <span class="ftag">Family</span>' : ''} <span class="muted">· ${A.hunters} Hunter${A.hunters === 1 ? '' : 's'} · ${A.saves} saves</span><div class="muted" style="font-size:12px">${A.ever.map(id => P[id] ? esc(P[id].n) : '').filter(Boolean).join(', ')}</div></div>`).join('') : '';
    const byPhase = sn.phases.map((ph, i) => { const ev = sn.events.filter(e => e.p === i); return ev.length ? `<details class="cause" ${i === sn.phases.length - 1 ? 'open' : ''}><summary><span>${esc(ph.name)}</span><b style="color:var(--muted)">${ev.length}</b></summary><div class="story">${ev.map(e => `<div class="ev ${e.t}"><span class="txt">${esc(clean(e.x))}</span></div>`).join('')}</div></details>` : ''; }).join('');
    body = `<div class="rep-nums"><span><b>${fmt(r.applicants)}</b>applicants</span><span><b>${r.hunters.length}</b>new Hunters</span><span><b>${sn.phases.length}</b>phases</span><span class="out"><b>${sn.dead}</b>deaths</span><span class="out"><b>${sn.dq}</b>disqualified</span></div>
      ${r.paper ? paperHtml(r.paper, false) : ''}${sn.chronicle ? `<div class="chron"><div class="section-h">Chronicle</div>${sn.chronicle.map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}${sec('Route & examiners', route)}${sec('New Hunters', hunters)}${sec('Final Tournament', br)}${sec('Zevil Island · final standings', zv)}${sec('Notable alliances', al)}${sec('Key events by trial', `<div class="causes">${byPhase}</div>`)}`;
  }
  showModal(`<div class="sheet wide" role="dialog" aria-modal="true" aria-label="${ordinal(r.edition)} Hunter Exam">
    <div class="sheet-head"><div><div class="meta">Archive · seed ${r.seed}</div><h2>${ordinal(r.edition)} Hunter Exam</h2></div><button class="btn" id="mClose">Close</button></div>${body}</div>`);
}
function hallOfFame(){
  const ALLH = HUNTERS.filter(h => !h.legacy), H = ALLH.filter(h => !h.pro), rec = [];
  const by = (arr, f, best) => arr.reduce((b, x) => b === null || (best === 'min' ? f(x) < f(b) : f(x) > f(b)) ? x : b, null);
  const tr = by(ALLH.filter(hActive), h => h.rp || 0);
  if(tr) rec.push(['Top-ranked Hunter', tr.name, `${starStr(hStars(tr)) || 'Unranked'} · ${(tr.career || '').replace(' Hunter', '')}`, tr.license]);
  if(H.length){
    const y = by(H, h => h.age, 'min'), o = by(H, h => h.age), at = by(H, h => h.attempts), ex = by(ALLH, h => (h.examined || []).length);
    rec.push(['Youngest Hunter', y.name, `licensed at ${y.age} · ${ordinal(y.edition)}`, y.license]);
    rec.push(['Oldest Hunter', o.name, `licensed at ${o.age} · ${ordinal(o.edition)}`, o.license]);
    if(at.attempts > 1) rec.push(['Never gave up', at.name, `licensed on attempt ${at.attempts}`, at.license]);
    if((ex.examined || []).length) rec.push(['Busiest examiner', ex.name, `${ex.examined.length} exam${ex.examined.length === 1 ? '' : 's'} judged`, ex.license]);
    const cc = {}; H.forEach(h => h.career && (cc[h.career] = (cc[h.career] || 0) + 1)); const topC = Object.entries(cc).sort((a, b) => b[1] - a[1])[0];
    if(topC) rec.push(['Most common path', topC[0], `${topC[1]} Hunter${topC[1] === 1 ? '' : 's'}`]);
  }
  const eds = HISTORY.slice();
  if(eds.length){
    const big = by(eds, r => r.hunters.length), small = by(eds, r => r.hunters.length, 'min'), large = by(eds, r => r.applicants);
    rec.push(['Biggest class', ordinal(big.edition) + ' Hunter Exam', `${big.hunters.length} new Hunters`]);
    rec.push(['Toughest year', ordinal(small.edition) + ' Hunter Exam', `${small.hunters.length} new Hunter${small.hunters.length === 1 ? '' : 's'}`]);
    rec.push(['Largest field', ordinal(large.edition) + ' Hunter Exam', `${fmt(large.applicants)} applicants`]);
    const withSnap = eds.filter(r => r.snap);
    if(withSnap.length){
      const dead = by(withSnap, r => r.snap.dead); if(dead.snap.dead) rec.push(['Deadliest exam', ordinal(dead.edition) + ' Hunter Exam', `${dead.snap.dead} candidate${dead.snap.dead === 1 ? '' : 's'} killed`]);
      let bestA = null; withSnap.forEach(r => (r.snap.alliances || []).forEach(A => { if(!bestA || A.hunters > bestA.A.hunters) bestA = {A, ed: r.edition}; }));
      if(bestA && bestA.A.hunters) rec.push(['Most successful alliance', bestA.A.name, `${bestA.A.hunters} Hunter${bestA.A.hunters === 1 ? '' : 's'} · ${ordinal(bestA.ed)}`]);
    }
  }
  if(!rec.length) return '';
  return `<div><div class="section-h">Hall of Fame</div><div class="hl">${rec.map(([l, n, d, lic]) => `<div ${lic ? `data-hunter="${esc(lic)}"` : 'style="cursor:default"'}><small>${esc(l)}</small><b>${esc(n)}</b><span>${esc(d)}</span></div>`).join('')}</div></div>`;
}
// new Hunters per edition: lives in History, each bar opens its edition
function edChartHtml(){
  const HE = HUNTERS.filter(h => !h.pro);
  // per-edition counts, including editions with no new Hunters
  const eds = {}; HISTORY.forEach(r => eds[r.edition] = 0); if(S.finished) eds[S.edition] = 0;
  const rg = {};   // stacked: the main exam at the bottom, regional offices on top
  HE.forEach(h => { eds[h.edition] = (eds[h.edition] || 0) + 1; if(h.regional) rg[h.edition] = (rg[h.edition] || 0) + 1; });
  const series = Object.entries(eds).map(([e, n]) => [+e, n, rg[e] || 0]).filter(x => !WORLD.recordsFrom || x[0] >= WORLD.recordsFrom).sort((a,b) => a[0] - b[0]).slice(-30);
  const maxN = Math.max(7, ...series.map(x => x[1]));
  // the chart is plain flex columns, so it stretches to fill its side of the page
  const chart = series.length ? `<div class="hc">${series.some(x => x[2]) ? `<div class="hleg"><span><i style="background:var(--gold)"></i>Main exam</span><span><i style="background:#5aa8d6"></i>Regional offices</span></div>` : ''}
      <div class="hc-plot">
        ${series.map(([e, n, r]) => `<div class="hc-col"${HISTORY.some(r => r.edition === e && r.snap) ? ` data-arch="${e}"` : ''} title="${ordinal(e)}: ${n - r} from the main exam${r ? `, ${r} from regional offices` : ''}"><b>${n}</b><div class="hc-bar" style="height:${n / maxN * 100}%">${r ? `<i class="rg" style="flex:${r}"></i>` : ''}<i style="flex:${Math.max(n - r, 0.0001)}"></i></div><small>${e}</small></div>`).join('')}</div></div>`
    : '<p class="muted">Finish this exam to start the chart.</p>';
  return chart;
}
let hiSort = {k: 'ed', dir: -1}, hiAll = false;   // editions: the latest 20 unless expanded   // editions: newest first until a header is clicked
function renderHistory(){
  const el = $('pane-history');
  const kf = {ed: r => r.edition, app: r => r.applicants || 0, hun: r => (r.hunters || []).length}[hiSort.k] || (r => r.edition);
  const rows = HISTORY.slice().sort((a, b) => (kf(a) - kf(b)) * hiSort.dir || b.edition - a.edition);
  const hth = (k, l) => `<th class="sortable${hiSort.k === k ? ' on' : ''}" data-hisort="${k}" aria-sort="${hiSort.k === k ? (hiSort.dir > 0 ? 'ascending' : 'descending') : 'none'}">${l}<i>${hiSort.k === k ? (hiSort.dir > 0 ? '▲' : '▼') : '↕'}</i></th>`;
  const cur = `<tr><td>${ordinal(S.edition)} Hunter Exam <span class="hi-now">${S.finished ? 'just finished' : S.started ? 'in progress' : 'up next'}</span></td><td class="num hi-app">${fmt(S.config.applicants)}</td><td class="num">${counts().appr}</td><td class="hi-names"></td></tr>`;
  const names = r => { const L = r.hunters || []; return L.length ? L.slice(0, 3).map(hh => esc(hh.name)).join(', ') + (L.length > 3 ? ` <span class="muted">+${L.length - 3}</span>` : '') : '<span class="muted">None</span>'; };
  const O = WORLD.origin, pre = O ? (WORLD.chairHist || []).filter(x => x.from < O.ed) : [];
  // the record first (editions), then what it adds up to (fame), then the world it happened in, oldest memories last
  const editions = `<div><div class="section-h">Editions</div><div class="hi-chart"><div class="hi-cap">New Hunters per edition</div>${edChartHtml()}</div><div class="tablebox hi-tab"><table><thead><tr>${hth('ed', 'Edition')}${hth('app', 'Applicants').replace('<th ', '<th data-c="app" ')}${hth('hun', 'Hunters')}<th class="hi-names">New Hunters</th></tr></thead><tbody>${cur}` +
    (hiAll ? rows : rows.slice(0, 20)).map(r => `<tr class="archrow" data-arch="${r.edition}" title="${r.snap ? 'Open this edition' : 'Only a summary was kept for this older edition'}"><td>${ordinal(r.edition)} Hunter Exam${r.snap ? ' <span class="muted">›</span>' : ''}</td><td class="num hi-app">${fmt(r.applicants)}</td><td class="num">${r.hunters.length}</td><td class="hi-names">${names(r)}</td></tr>`).join('') +
    `</tbody></table></div>` + (rows.length > 20 ? `<button type="button" class="btn small hi-more" id="hiMore">${hiAll ? 'Show the latest 20' : `Show all ${fmt(rows.length)} editions`}</button>` : '') + (rows.length ? '<p class="muted" style="margin:6px 0 0;font-size:12.5px">Tap an edition to reopen its route, bracket, island and key events.</p>' : '<p class="muted">Finished exams are archived here when you start the next exam.</p>') + '</div>';
  el.innerHTML = pageHead('The records', 'History', '#6fa8dc') + editions + hallOfFame() + statsHtml() + scRecordHtml() + mtRecordHtml();   // the world and its origin live in World
  if($('hiMore')) $('hiMore').onclick = () => { hiAll = !hiAll; renderHistory(); };
  el.querySelectorAll('[data-hisort]').forEach(th => th.onclick = () => { const k = th.dataset.hisort; hiSort = hiSort.k === k ? {k, dir: -hiSort.dir} : {k, dir: -1}; renderHistory(); });
}
// the save file: its own small window from the menu, away from the story
function openSaveBox(){
  showModal(`<div class="sheet savebox2" role="dialog" aria-modal="true" aria-label="Save file">
    <div class="sheet-head"><div><div class="meta">Your world · ${HISTORY.length} edition${HISTORY.length === 1 ? '' : 's'} · ${fmt(HUNTERS.length)} Hunters</div><h2>Save file</h2></div><button class="btn" id="mClose">Close</button></div>
    <p class="muted" id="saveMsg" style="margin:0;font-size:13px">Your progress lives in this browser and saves itself after every trial. Export a copy now and then to keep it safe, or to move it to another device.</p>
    <div class="sv-row"><button class="btn" id="bExport">Export save</button><label class="btn" style="cursor:pointer">Import save<input type="file" id="fImport" accept="application/json,.json" hidden></label></div>
    <div class="sv-danger"><div><b>Start a new world</b><p class="muted">Deletes every edition, every Hunter, the Association's history and your favorites, and begins again from the first exam.</p></div><button class="btn warn" id="bReset">Start a new world</button></div>
  </div>`);
  $('bExport').onclick = exportSave;
  $('fImport').onchange = e => { const f = e.target.files[0]; if(f) importSave(f); e.target.value = ''; };
  $('bReset').onclick = () => { const was = HISTORY.length; resetEverything(); if(!resetArmed && was !== HISTORY.length) closeModal(); };
}
$('navSave').onclick = openSaveBox;

/* tabs */
let curTab = 'phase';
// only the visible tab is drawn; the others draw when opened
function renderTab(t){ ({log: renderLog, results: renderResults, alli: renderAlliancesTab, history: renderHistory, assoc: renderAssociation, hunters: renderAssociation, world: renderWorld, nen: renderNenLab})[t]?.(); }
let lastExamTab = 'phase';
const SEC_OF = t => ['history', 'hunters', 'world', 'nen'].includes(t) ? t : 'exam';
function showTab(t){
  if(t === 'assoc') t = 'hunters';   // the council lives on the Hunters page now
  curTab = t; renderTab(t);
  const sec = SEC_OF(t); if(sec === 'exam') lastExamTab = t;
  document.body.dataset.sec = sec; document.body.dataset.tab = t;
  document.querySelectorAll('.mainnav button[data-sec]').forEach(b => { b.toggleAttribute('aria-current', b.dataset.sec === sec); const s = b.querySelector('small:not([hidden])'); if(s) b.title = s.textContent; });
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
  ['phase','log','results','alli','history','assoc','hunters','world','nen'].forEach(x => $('pane-' + x).hidden = x !== t);
}
document.querySelectorAll('.tab').forEach(b => b.onclick = () => showTab(b.dataset.tab));
document.querySelectorAll('.mainnav button[data-sec]').forEach(b => b.onclick = () => { showTab(b.dataset.sec === 'exam' ? lastExamTab : b.dataset.sec); window.scrollTo(0, 0); });

