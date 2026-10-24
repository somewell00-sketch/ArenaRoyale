/* ---------- modals ---------- */
let modalBack = null; // {kind:'people'} to return to the grid
function showModal(html){ $('modal').innerHTML = html; $('modal').hidden = false; const c = $('mClose'); if(c){ c.focus(); c.onclick = closeModal; } }
function closeModal(){ $('modal').hidden = true; $('modal').innerHTML = ''; modalBack = null; }
$('modal').onclick = e => { if(e.target === $('modal')) closeModal(); };
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('modal').hidden) closeModal(); });

let pFilter = '', pQuery = '', pOrigin = '', pSort = 'reg';
function openPeople(){
  modalBack = {kind:'people'};
  const C = S.candidates;
  const n = s => C.filter(c => c.status === s).length;
  const chips = [['','All',C.length,'var(--muted)'],['Active','Still in',n('Active')+n('Finalist'),'var(--fg)'],['Eliminated','Eliminated',n('Eliminated'),'var(--red)'],['Deceased','Deceased',n('Deceased'),'var(--dead)'],['Disqualified','Disqualified',n('Disqualified'),'var(--red)'],['Approved','Hunters',n('Approved'),'var(--gold)']];
  showModal(`<div class="sheet wide" role="dialog" aria-modal="true" aria-label="All participants">
    <div class="sheet-head"><div><div class="meta">${ordinal(S.edition)} Hunter Exam</div><h2>All participants</h2></div><button class="btn" id="mClose">Close</button></div>
    <div class="bar-tools">
      <div class="legend">${chips.map(([v,l,c,col]) => `<button class="chip" data-pf="${v}" aria-pressed="${pFilter === v}"><i style="background:${col}"></i>${l} <span class="muted">${c}</span></button>`).join('')}</div>
      <input id="pq" type="search" placeholder="Find by name or number" value="${esc(pQuery)}" aria-label="Find participant">
    </div>
    <div class="bar-tools">
      <div class="legend">${[['','All candidates'],['first','First-time'],['ret','Returning'],['fam','Families'],['fav','★ Favorites']].map(([v,l]) => `<button class="chip" data-po="${v}" aria-pressed="${pOrigin === v}">${l}</button>`).join('')}</div>
      <select id="psort" aria-label="Sort participants">${[['reg','Registration number'],['attempts','Number of attempts'],['age','Age'],['best','Previous best trial'],['perf','Current performance']].map(([v,l]) => `<option value="${v}" ${pSort === v ? 'selected' : ''}>Sort: ${l}</option>`).join('')}</select>
    </div>
    <div class="grid" id="pgrid"></div>
  </div>`);
  drawGrid();
  $('pq').oninput = e => { pQuery = e.target.value; drawGrid(); };
  $('psort').onchange = e => { pSort = e.target.value; drawGrid(); };
}
function drawGrid(){
  const q = pQuery.trim().toLowerCase().replace('#','');
  const cur = c => c.status === 'Approved' ? PHASES.length : (c.out ?? S.phase);
  const key = {reg: c => -c.reg, attempts: c => attemptsOf(c), age: c => c.age, best: c => prevBest(c), perf: c => cur(c)}[pSort];
  const list = S.candidates.filter(c => (!pFilter || c.status === pFilter || (pFilter === 'Active' && c.status === 'Finalist')) && (!pOrigin || (pOrigin === 'fav' ? isFav(c.id) : pOrigin === 'fam' ? !!c.fam : (pOrigin === 'ret') === isReturning(c))))
    .sort((a,b) => key(b) - key(a) || a.reg - b.reg);
  $('pgrid').innerHTML = list.map(c => {
    const hit = q && (String(c.reg) === q || c.name.toLowerCase().includes(q));
    return `<button class="tile ${c.status}${hit ? ' hit' : ''}${isReturning(c) ? ' ret' : ''}${c.fam ? ' fam' : ''}${isFav(c.id) ? ' favt' : ''}" data-id="${c.id}" title="${esc(c.name)}${c.fam ? ' · ' + esc(familyOf(S, c).name) : ''}${isReturning(c) ? ' · attempt ' + attemptsOf(c) : ''}">${c.reg}</button>`;
  }).join('') || '<p class="muted">Nobody here yet.</p>';
  const h = $('pgrid').querySelector('.hit'); if(h) h.scrollIntoView({block:'nearest'});
}

// link every candidate name that appears in a piece of (already escaped) text
let NL = {key:null, re:null, map:null};
function autoLink(html, selfId){
  html = String(html).replace(/ \(#\d+\)/g, '');
  const key = S.edition + ':' + S.seed + ':' + S.candidates.length;
  if(NL.key !== key){
    const map = {}; S.candidates.forEach(c => map[c.name] = c.id);
    const names = Object.keys(map).sort((a,b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    NL = {key, map, re: names.length ? new RegExp('(^|[^\\p{L}])(' + names.join('|') + ')(?![\\p{L}])', 'gu') : null};
  }
  if(!NL.re) return html;
  return html.replace(NL.re, (m, pre, name) => NL.map[name] === selfId ? m : `${pre}<a data-id="${NL.map[name]}">${name}</a>`);
}
const ALIVE = st => st === 'Active' || st === 'Finalist' || st === 'Approved';
// ---- Hunter families across generations, built from the births on record
// a person is a Hunter (license) and/or a child on record (kid); relatives are found through the kids' parents
const kidOfCid = cid => (WORLD.heirs || []).find(k => k.cid === cid);
function lineage(lic, cid){
  // a person is a Hunter (license), a child on record (kid), or both; every relation is walked the same way, so nobody is skipped
  const H = WORLD.heirs || [], out = [], seen = new Set();
  const g = (x, m, f, n) => x === 'Male' ? m : x === 'Female' ? f : n;
  const licOfKid = k => { const h = k && k.cid && HUNTERS.find(x => x.cid === k.cid); return h ? h.license : null; };
  const ofLic = l => { const h = hLic(l); return h ? {lic: l, kid: kidOfCid(h.cid) || null} : null; };
  const me = lic ? ofLic(lic) || {lic, kid: null} : cid ? (k => k ? {lic: licOfKid(k), kid: k} : null)(kidOfCid(cid)) : null;
  if(!me) return out;
  const key = p => p.lic || (p.kid && p.kid.id);
  const parents = p => { const h = p.lic && hLic(p.lic); return ((p.kid && p.kid.parents) || (h && (h.heirOf || (h.hParent ? [h.hParent] : null))) || []).map(ofLic).filter(Boolean); };
  const children = l => !l ? [] : H.filter(k => k.parents.includes(l)).map(k => ({lic: licOfKid(k), kid: k}))
    .concat(HUNTERS.filter(x => x.hParent === l && !H.some(k => k.cid === x.cid)).map(x => ({lic: x.license, kid: null})));
  const uniq = arr => { const m = new Map(); arr.forEach(p => { const k = key(p); if(k && !m.has(k)) m.set(k, p); }); return [...m.values()]; };
  [me].forEach(p => seen.add(key(p))); if(me.kid) seen.add(me.kid.id); if(me.lic) seen.add(me.lic);
  const add = (p, rel, step) => { const k = key(p); if(!k || seen.has(k) || (p.kid && seen.has(p.kid.id))) return false; seen.add(k); if(p.kid) seen.add(p.kid.id); if(p.lic) seen.add(p.lic);
    const h = p.lic && hLic(p.lic), gd = (h && h.gender) || (p.kid && p.kid.gender); out.push(Object.assign(p.kid ? {rel: rel(gd), k: p.kid, h: h || null} : {rel: rel(gd), h}, step ? {step: true} : {})); return true; };
  // step ties run through a marriage that lasted: to the end, or still going; a divorce or a new marriage ends them on both sides, so the tree does not fill up over the centuries
  const wed = (a, b) => a && b && ((a.spouse === b.license && (b.spouse === a.license || (!b.spouse && b.widowOf === a.license))) || (b.spouse === a.license && !a.spouse && a.widowOf === b.license));
  const spouses = l => { const h = l && hLic(l); if(!h) return []; return [h.spouse, !h.spouse && h.widowOf].filter(x => x && wed(h, hLic(x))).map(ofLic).filter(Boolean); };
  const P = parents(me), PL = P.map(p => p.lic);
  P.forEach(p => add(p, x => g(x, 'father', 'mother', 'parent')));
  const SP = uniq(P.flatMap(p => spouses(p.lic))).filter(s => !PL.includes(s.lic)).filter(p => add(p, x => g(x, 'stepfather', 'stepmother', 'step-parent'), 1));
  const GP = uniq(P.flatMap(parents)); GP.forEach(p => add(p, x => g(x, 'grandfather', 'grandmother', 'grandparent')));
  const AU = uniq(GP.flatMap(p => children(p.lic))).filter(p => !PL.includes(p.lic) && !P.some(q => q.kid && p.kid && q.kid.id === p.kid.id)).filter(p => add(p, x => g(x, 'uncle', 'aunt', "parent's sibling")));
  const SIB = uniq(P.flatMap(p => children(p.lic))).filter(s => { const sp = parents(s).map(q => q.lic), full = sp.length === PL.length && PL.every(l => sp.includes(l)); return add(s, x => (full ? '' : 'half-') + g(x, 'brother', 'sister', 'sibling')); });
  uniq(SP.flatMap(p => children(p.lic))).forEach(p => add(p, x => g(x, 'stepbrother', 'stepsister', 'step-sibling'), 1));
  uniq(AU.flatMap(p => children(p.lic))).forEach(p => add(p, () => 'cousin'));
  uniq(SIB.flatMap(p => children(p.lic))).forEach(p => add(p, x => g(x, 'nephew', 'niece', "sibling's child")));
  const K = uniq(children(me.lic)); K.forEach(p => add(p, x => g(x, 'son', 'daughter', 'child')));
  uniq(spouses(me.lic).flatMap(p => children(p.lic))).forEach(p => add(p, x => g(x, 'stepson', 'stepdaughter', 'stepchild'), 1));
  uniq(K.flatMap(p => children(p.lic))).forEach(p => add(p, x => g(x, 'grandson', 'granddaughter', 'grandchild')));
  return out;
}
// the spouse sits at the top of the Family block, styled like every other relative
function spouseRow(h){
  const row = (l, how) => { const o = hLic(l); if(!o) return ''; const w = o.gender === 'Male' ? 'husband' : o.gender === 'Female' ? 'wife' : 'spouse';
    const st = `${o.status === 'Active Hunter' ? 'Hunter' : esc((o.status || '').toLowerCase())} · ${o.license}`;
    return `<div class="fam-wed"><span style="color:#e892b4">⚭</span> <a data-hunter="${esc(o.license)}">${esc(o.name)}</a> <span class="muted">— ${how(w, o)} · ${st}</span></div>`; };
  const out = [];
  if(h.spouse) out.push(row(h.spouse, (w, o) => h.status === 'Deceased' || o.status === 'Deceased' ? `${w} · married in the ${ordinal(h.wedEd)}, to the end` : `${w} · married since the ${ordinal(h.wedEd)}`));
  if(h.widowOf && h.widowOf !== h.spouse) out.push(row(h.widowOf, w => `late ${w} · lost after the ${ordinal(h.widowEd)}`));
  if(h.exSpouse && h.exSpouse !== h.spouse && h.exSpouse !== h.widowOf) out.push(row(h.exSpouse, w => `former ${w}`));
  return out.join('');
}
function lineageHtml(lic, cid, pre){
  const L = lineage(lic, cid); if(!L.length) return pre ? `<div><div class="section-h">Family</div><div class="grs">${pre}</div></div>` : '';
  const ED = S.edition, row = r => {
    const h = r.h, k = r.k, c = k && k.cid && S.candidates.find(x => x.id === k.cid);
    const link = h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : c ? `<a data-id="${c.id}">${esc(c.name)}</a>` : `<span class="fam-civ-n">${esc(k.name)}</span>`;
    const st = h ? `${h.status === 'Active Hunter' ? 'Hunter' : esc((h.status || '').toLowerCase())} · licensed in the ${ordinal(h.edition)}${hStars(h) ? ' · ' + starStr(hStars(h)) : ''}`
      : c ? `in the ${ordinal(ED)} exam · ${esc(c.status === 'Active' ? 'still in' : c.status.toLowerCase())}`
      : (() => { const a = Math.max(0, ED - k.born), age = a > 80 ? '' : ` · ${a} years old`;   // past eighty, the record stops counting
        if(k.entered && k.fate && k.fate.st === 'Deceased') return `died in the ${ordinal(k.entered)} exam, at ${k.entered - k.born}`;
        if(k.entered) return `${ED - k.entered >= 3 ? `took the ${ordinal(k.entered)} exam · chose another life` : `did not pass the ${ordinal(k.entered)} exam`}${age}`;
        return k.never ? `chose another life${age}` : a > 80 ? `born after the ${ordinal(k.born)} exam` : age.slice(3); })();
    return `<div${!h && !c ? ' class="fam-civ"' : r.step ? ' class="fam-step"' : ''}><span style="color:var(--gold)">✦</span> ${link} <span class="muted">— ${esc(r.rel)} · ${st}</span></div>`; };
  return `<div><div class="section-h">Family</div><div class="grs">${pre || ''}${L.map(row).join('')}</div></div>`;
}
function familyHtml(c){ const LP = legendKnown(c) && hLic(c.hParent) ? (() => { const H = hLic(c.hParent); return `<div><div class="section-h">Family</div><div class="grs"><div><span style="color:var(--gold)">✦</span> <a data-hunter="${esc(H.license)}">${esc(H.name)}</a> <span class="muted">— parent · ${H.status === 'Active Hunter' ? 'Hunter' : esc((H.status || '').toLowerCase())} · licensed in the ${ordinal(H.edition)}${hStars(H) ? ' · ' + starStr(hStars(H)) : ''}</span></div></div></div>`; })() : '';
  if(LP) return LP + familyHtml0(c).replace('<div class="section-h">Family</div>', '<div class="sub-h">Registered together</div>');
  const L = c.heir ? lineageHtml(null, c.id) : ''; const F = familyHtml0(c); return L ? L + F.replace('<div class="section-h">Family</div>', '<div class="sub-h">Registered together</div>') : F; }
function familyHtml0(c){
  ensureFamilies(S);
  const F = familyOf(S, c) || (c.family ? (S.alliances || []).find(A => A.family && A.famKey === c.family.key) : null);
  if(!F) return c.family && attemptsOf(c) > 1 ? `<div><div class="section-h">Family</div><p class="muted" style="margin:0">Member of the ${esc(c.family.last)} family, entering alone this time.</p></div>` : '';
  const m = cmap(S);
  const rows = F.ever.map(id => m[id]).filter(Boolean).sort((x, y) => x.reg - y.reg).map(o => {
    const st = o.status === 'Approved' ? 'Hunter' : o.status;
    const left = o.id !== c.id && !F.members.includes(o.id) ? ' · left the family alliance' : '';
    const rw = o.id === c.id ? 'you' : relWord(c, o);
    return `<div class="fmr${o.id === c.id ? ' me' : ''}"><span class="num regn">#${o.reg}</span>${o.id === c.id ? `<b>${esc(o.name)}</b>` : `<a data-id="${o.id}">${esc(o.name)}</a>`}<span class="st ${o.status}">${st}</span><span class="muted" style="font-size:11.5px">${o.id === c.id ? '' : esc(rw.charAt(0).toUpperCase() + rw.slice(1)) + ' · '}${o.age} yrs${left}</span></div>`;
  }).join('');
  return `<div><div class="section-h">Family</div><p style="margin:0 0 6px;font-size:13px"><b>${esc(F.name)}</b> <span class="muted">· ${c.family && c.family.type ? esc(FAM_TYPES[c.family.type].label) + ' · ' : ''}${F.saves || 0} saves · registered together</span></p><div class="fmrs">${rows}</div></div>`;
}
function allianceHtml(c){
  const A = allianceOf(S, c), m = cmap(S);
  const past = (S.alliances || []).filter(x => x !== A && !x.family && x.ever.includes(c.id));
  const old = isReturning(c) ? (c.prevAllies || []).filter(id => m[id] && m[id].id !== c.id && attemptsOf(m[id]) > 1) : [];
  if(!A && !past.length && !old.length) return '';
  const chip = id => { const o = m[id]; if(!o) return ''; return `<a class="cn" data-id="${o.id}"><span class="av">${initials(o.name)}</span><span><b>${esc(o.name)}</b><small style="color:${ALIVE(o.status) ? 'var(--green)' : 'var(--dim)'}">${o.status === 'Approved' ? 'Hunter' : o.status}</small></span></a>`; };
  return `<div><div class="section-h">Alliance</div>
    ${A ? `<p style="margin:0 0 6px;font-size:13px"><b>${esc(A.name || 'Alliance')}</b> <span class="muted">· formed in the ${esc(PHASES[A.formed].name)} · ${A.members.length} member${A.members.length === 1 ? '' : 's'} · ${A.saves || 0} saves · ${A.together || 0} trials together</span></p><div class="cns">${A.members.filter(id => id !== c.id).map(chip).join('') || '<span class="muted">Everyone else has left.</span>'}</div>` : '<p class="muted" style="margin:0">Not in an alliance right now.</p>'}
    ${past.length ? `<p class="muted" style="margin:8px 0 6px;font-size:12.5px">Earlier alliances this exam</p><div class="cns">${[...new Set(past.flatMap(x => x.ever))].filter(id => id !== c.id).map(chip).join('')}</div>` : ''}
    ${old.length ? `<p class="muted" style="margin:8px 0 6px;font-size:12.5px">Allies from previous exams who are here again</p><div class="cns">${old.map(chip).join('')}</div>` : ''}</div>`;
}
function connectionsHtml(c){
  const rel = {}; // otherId -> Set of labels
  const add = (id, label) => { if(id === c.id || id === 'examiner') return; (rel[id] = rel[id] || new Set()).add(label); };
  S.log.forEach(e => {
    if(!e.ids || e.ids.length < 2 || !e.ids.includes(c.id)) return;
    const me = e.ids.indexOf(c.id), first = e.ids[0], others = e.ids.filter(x => x !== c.id);
    if(e.type === 'death'){ if(/^Fatal Duel/.test(e.text)) add(others[0], me === 0 ? 'Killed' : 'Killed by'); return; }
    if(e.type === 'help'){ add(others[0], me === 0 ? 'Helped' : 'Helped by'); return; }
    if(e.type === 'split' && /turns down/.test(e.text)){ add(others[0], me === 0 ? 'Turned down' : 'Was turned down by'); return; }
    if(e.type === 'team') others.forEach(o => add(o, 'Teammate'));
    else if(e.type === 'ally' && /form an alliance/.test(e.text)) others.forEach(o => add(o, 'Ally'));
    else if(e.type === 'betray') add(others[0], me === 0 ? 'Betrayed' : 'Betrayed by');
    else if(e.type === 'rescue') add(others[0], me === 0 ? 'Rescued' : 'Rescued by');
    else if(e.type === 'trade' && /trades badge/.test(e.text)) add(others[0], 'Traded with');
    else if(e.type === 'ally' && /hands ally/.test(e.text)) add(others[0], me === 0 ? 'Gave a badge to' : 'Got a badge from');
    else if(/slipped away/.test(e.text)) add(others[0], me === 0 ? 'Escaped from' : 'Was evaded by');
    else if(/with help from/.test(e.text) && me === 2) add(first, 'Helped');
    else if(['duel','fight','major','elim'].includes(e.type) && e.ids.length === 2 && /beat|took|robbed|ambushed|overpowered|defeats|disqualified/.test(e.text))
      add(others[0], me === 0 ? 'Beat' : 'Lost to');
  });
  (S.alliances || []).forEach(A => { if(A.ever.includes(c.id)) A.ever.forEach(o => add(o, A.family ? 'Family' : A.members.includes(c.id) && A.members.includes(o) ? 'Ally' : 'Former ally')); });
  const ids = Object.keys(rel);
  if(!ids.length) return '';
  const map = byIdMap();
  const alive = ids.map(id => map[id]).filter(o => o && ALIVE(o.status)).sort((a,b) => rel[b.id].size - rel[a.id].size);
  const gone = ids.length - alive.length;
  const chips = alive.map(o => `<a class="cn" data-id="${o.id}"><span class="av">${initials(o.name)}</span><span><b>${esc(o.name)}</b><small>${[...rel[o.id]].join(' · ')}${o.status === 'Approved' ? ' · Hunter' : ''}</small></span></a>`).join('');
  return `<div><div class="section-h">Connections still in the game</div>${chips ? `<div class="cns">${chips}</div>` : `<p class="muted" style="margin:0">None of the people ${PR(c).they} crossed paths with are still in the exam.</p>`}${gone && chips ? `<p class="muted" style="margin:6px 0 0;font-size:12.5px">${gone} other connection${gone===1?'':'s'} already eliminated.</p>` : ''}</div>`;
}
/* ---------- Nen panel ---------- */
const NEN_COLOR = {Enhancement:'var(--n-enh)', Transmutation:'var(--n-tra)', Emission:'var(--n-emi)', Conjuration:'var(--n-con)', Manipulation:'var(--n-man)', Specialization:'var(--n-spe)'};
const nenChip = cat => `<span class="nchip" style="--c:${NEN_COLOR[cat]}">${cat}</span>`;
function nenHex(n){
  const cx = 150, cy = 120, R = 82;
  const pt = (k, r) => { const ang = (-90 + 60*k) * Math.PI/180; return [cx + r*Math.cos(ang), cy + r*Math.sin(ang)]; };
  const ring = f => NEN_CATS.map((_, k) => pt(k, R*f).map(v => v.toFixed(1)).join(',')).join(' ');
  const poly = NEN_CATS.map((c, k) => pt(k, R * Math.max(0.04, n.efficiency[c]/100)).map(v => v.toFixed(1)).join(',')).join(' ');
  const labels = NEN_CATS.map((c, k) => {
    const [x, y] = pt(k, R + 22), me = c === n.category;
    const anchor = Math.abs(x - cx) < 5 ? 'middle' : x > cx ? 'start' : 'end';
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" class="hl-t${me ? ' me' : ''}" style="fill:${NEN_COLOR[c]}">${c.slice(0, 5)}. ${n.efficiency[c]}%</text>`;
  }).join('');
  const dots = NEN_CATS.map((c, k) => { const [x, y] = pt(k, R); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${c === n.category ? 6 : 3.5}" style="fill:${NEN_COLOR[c]}"/>`; }).join('');
  return `<svg viewBox="0 0 300 240" class="hex" role="img" aria-label="Nen affinity hexagon, natural category ${n.category}">
    <polygon points="${ring(1)}" class="hx-o"/><polygon points="${ring(.6)}" class="hx-g"/><polygon points="${ring(.8)}" class="hx-g"/><polygon points="${ring(.4)}" class="hx-g"/>
    <polygon points="${poly}" class="hx-p" style="fill:${NEN_COLOR[n.category]};stroke:${NEN_COLOR[n.category]}"/>${dots}${labels}</svg>`;
}
function nenPanel(c){
  const n = c.nen; if(!n) return '';
  const h = n.hatsu, col = NEN_COLOR[n.category];
  const bar = (l, v) => `<div class="attr"><span>${l}</span><span class="t"><i style="width:${v}%;background:${col}"></i></span><span class="v">${v}</span></div>`;
  const kw = h.keywords.map((k, i) => `<span class="kw"><small>${['Source','Form','Effect'][i]}</small>${esc(k)}</span>`).join('<span class="kplus">+</span>');
  const row = (l, v) => `<div><dt>${l}</dt><dd>${esc(v)}</dd></div>`;
  const tech = NEN_TECH.map(t => `<span class="tech ${n.techniques.includes(t[0]) ? 'on' : ''}" title="${esc(t[2])}${n.techniques.includes(t[0]) ? '' : ' · unlocks at mastery ' + t[1]}">${t[0]}</span>`).join('');
  return `<div class="nen" style="--c:${col}">
    <div class="nen-h"><div><div class="section-h" style="margin:0">Nen · unlocked after the exam</div><div class="nen-cat">${nenChip(n.category)}<span class="muted">${n.status}</span></div></div></div>
    <div class="nen-top">${nenHex(n)}<div class="nen-stats">${bar('Potential', n.potential)}${bar('Mastery', n.mastery)}${bar('Aura capacity', n.capacity)}${bar('Aura output', n.output)}${bar('Aura control', n.control)}${n.sch && typeof schOf === 'function' && schOf(n.sch.id) ? `<p class="nen-sch">⛩ Shaped by <a class="golink" data-school="${n.sch.id}">${esc(capS(schOf(n.sch.id).name))}</a>: ${esc(n.sch.k)} +${n.sch.v}</p>` : ''}</div></div>
    <div class="acard">
      <div class="acard-h"><small>Hatsu</small><h3>${esc(h.alias || h.name)}</h3>${h.alias ? `<div class="akw">${esc(h.name)}</div>` : ''}<div class="acats">${nenChip(h.primary)}${h.secondary ? '<span class="muted">+</span>' + nenChip(h.secondary) : ''}</div></div>
      <p>${esc(h.description)}</p>${h.born ? `<p class="h-born"><span>Born from</span> ${esc(h.born)}</p>` : ''}
      <div class="ameter"><span>Power <b>${h.power}</b></span><span>Accuracy <b>${h.accuracy}</b></span><span>Aura cost <b>${h.cost}</b></span></div>
      <dl class="adl">${row('Activation', h.activation)}${row('Range', h.range)}${row('Duration', h.duration)}${row('Recovery', h.cooldown)}${row('Effect', h.effect)}${row('Weakness', h.weakness)}${row('Counterplay', h.counterplay)}</dl>
      ${h.vows.length ? `<div class="vows"><small>Vows & limitations</small>${h.vows.map(v => `<div><span>${esc(v.text)}</span><b>+${v.bonus} power</b></div>`).join('')}</div>` : ''}
    </div>
    <div><small class="muted" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase">Techniques</small><div class="techs">${tech}</div></div>
  </div>`;
}

function examHistoryHtml(c){
  const at = c.attempts || [];
  if(at.length < 2) return '';
  const entries = at.slice().reverse().map((x, i) => {
    const cur = x.edition === S.edition;
    const res = cur ? (S.finished ? (c.status === 'Approved' ? 'Licensed Hunter' : c.status) : 'In progress') : x.result;
    const reached = cur ? (S.finished ? (c.status === 'Approved' ? PHASES.at(-1).name : PHASES[c.out ?? PHASES.length - 1].name) : PHASES[Math.min(c.out ?? S.phase, PHASES.length - 1)].name) : x.phaseName;
    const imp = x.improvements.length ? x.improvements.map(k => `${ATTR_LABEL[k]} +${x.impAmt || 2}`).join(', ') : 'None (first attempt)';
    const bad = /Eliminated|Deceased|Disqualified/.test(res);
    return `<details class="eh ${cur ? 'cur' : ''}" ${i < 2 ? 'open' : ''}><summary><b>${ordinal(x.edition)} Hunter Exam</b><span class="eh-r ${res === 'Licensed Hunter' ? 'ok' : bad ? 'bad' : ''}">${esc(res)}</span></summary>
      <div class="eh-b"><span>Age <b>${x.age}</b></span><span><span class="regn">#${x.reg}</span></span><span>Reached <b>${esc(reached || '—')}</b></span></div>
      ${!cur && x.reason ? `<div class="eh-i">${autoLink(esc(clean(x.reason)), c.id)}</div>` : ''}</details>`;
  }).join('');
  const keys = ATTRS.map(a => a[0]);
  const lastImp = at[at.length - 1].improvements || [];
  const stA = x => x.start || c.a;
  const prog = keys.filter(k => at.some((x, i) => i && stA(x)[k] !== stA(at[i-1])[k])).map(k =>
    `<div class="ap ${lastImp.includes(k) ? 'new' : ''}"><span>${ATTR_LABEL[k]}</span><span class="apv">${at.map(x => stA(x)[k]).join(' → ')}</span></div>`).join('');
  return `<div><div class="section-h">Exam history · ${at.length} attempts</div><div class="ehs">${entries}</div></div>
    ${prog ? `<div><div class="section-h">Attribute progression</div><div class="aps">${prog}</div><p class="muted" style="margin:6px 0 0;font-size:12px">Highlighted: improved on entering the ${ordinal(S.edition)}.</p></div>` : ''}`;
}
// the family paragraph: what kind of family, and who came along
const FAM_TXT = {
  close: ['The {Ls} are close-knit and do everything together.', 'In the {L} family nobody goes anywhere alone, and that includes the Hunter Exam.'],
  legacy: ['There has been a Hunter in every {L} generation, and {F} does not want to be the one who breaks the chain.', 'The {L} name already belongs to a licensed Hunter, and {F} feels the weight of it.'],
  fractured: ['The {Ls} barely speak to each other; they registered together only because someone made them.', 'The {L} family is held together by habit and old arguments.'],
  strangers: ['{F} grew up apart from the other {Ls} and barely knows them.', 'Separated as children, the {Ls} are strangers who happen to share a name.'],
  adopted: ['The {Ls} are a family by choice, not by blood, and they will fight anyone who says otherwise.', 'Nobody in the {L} family was born into it; they found each other.'],
  clan: ['The {Ls} are a clan people lower their voices about.', 'Other candidates step aside when the {L} clan walks past.'],
  business: ['The {Ls} run a trading empire, and every one of them wants to be its heir.', 'To the {L} family, a Hunter license is an investment.'],
  poor: ['The {Ls} are many, poor and stubborn; the whole family pooled its savings for this.', 'Back home there are more {Ls} than chairs, and these ones came to change that.'],
  rival: ['Two branches of the {L} family that have not spoken in years ended up in the same exam.', 'The {L} cousins have been rivals since childhood, and the exam will not change that.']
};
function familyLine(c){
  ensureFamilies(S);
  const F = c.family; if(!F || !F.type) return '';
  const A = (S.alliances || []).find(x => x.family && x.famKey === F.key);
  const rel = A ? A.ever.map(id => cmap(S)[id]).filter(o => o && o.id !== c.id) : [];
  const pk = arr => arr[nhashUI(F.key + c.id) % arr.length];
  let t;
  if(F.type === 'protective'){
    const top = Math.min(F.gen, ...rel.map(o => o.family.gen)), kids = rel.filter(o => o.family.gen > F.gen), par = rel.find(o => o.family.gen === top && o.family.gen < F.gen);
    t = F.gen === top && kids.length ? `{F} only entered the exam to keep an eye on {their} ${kids.length === 1 ? relWord(c, kids[0]) : 'family'}.` : par ? `{F}'s ${relWord(c, par)} entered the exam only to keep an eye on {them}, which {F} finds mortifying.` : pk(FAM_TXT.close);
  } else t = pk(FAM_TXT[F.type] || FAM_TXT.close);
  t = t.replace(/\{Ls\}/g, famPl(F.last)).replace(/\{L\}/g, F.last).replace(/\{F\}/g, c.first);
  if(rel.length){
    const names = rel.slice(0, 3).map(o => `${relWord(c, o)} ${o.first}`), more = rel.length - names.length;
    const list = more > 0 ? names.join(', ') + ` and ${more} more` : names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    if(F.type !== 'protective' || F.gen !== Math.min(F.gen, ...rel.map(o => o.family.gen))) t += ` {Their} ${list} registered with {them}.`;
  }
  return t;
}
const LEAD_NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function storyLead(c){
  const A = (c.attempts || []).filter(x => x.status === 'Completed' && x.edition < S.edition), n = attemptsOf(c);
  // a long road: five tries or more
  if(n >= 5 && A.length){
    const best = A.slice().sort((x, y) => (y.stage || 0) - (x.stage || 0) || (y.phase || 0) - (x.phase || 0))[0];
    const fails = n - 1, fw = String(fails < LEAD_NUM.length ? LEAD_NUM[fails] : fails);
    return `This is attempt ${n} for ${c.first}. ${fw.charAt(0).toUpperCase() + fw.slice(1)} exams have ended without a license${best && best.phaseName ? `, the closest ${/Island$/.test(best.phaseName) ? 'on' : 'in the'} ${best.phaseName}, in the ${ordinal(best.edition)}` : ''}.`;
  }
  // a score to settle, and the other one is here too
  const m = cmap(S), g = (c.grudges || []).find(g => g.ed === S.edition - 1 && m[g.id] && m[g.id].status === 'Active' && /^(\w+ed|took|stole|beat|left|cost|broke|threw|sold|hit|ran|gave|made|won|caught|fought|lied|tore|swore|shot|cut|struck|knocked|led|let|kept|sent|told|stood|spat|bit)\b/.test(g.why || ''));   // a past deed only: "took Rumi's own badge", not "trains at the rival school"
  if(g) return `Last year, ${g.name} ${g.why.replace(/(\w+)'s own /, "$1's ")}. Both are back.`;
  // sent by a school
  if(c.dojo && c.dojo.name) return `${c.first} was sent to the exam by ${c.dojo.name}.`;
  return '';
}
function storyOf(c){
  persona(c); const b = background(c);
  const h = k => nhash(c.id + ':' + k), pk = (arr, k) => arr[h(k) % arr.length];
  const mo = MOTIVES[c.motive] || MOTIVES[0], parts = [];
  const nick = c.nick ? ` — "${c.nick}" —` : '';
  if(legendKnown(c) && hLic(c.hParent)){ const H = hLic(c.hParent); parts.push(`${c.first || c.name} is the child of ${H.name}, and the whole exam knows it now.`); }
  if(c.heir){ const P = c.heir.parents.map(hLic).filter(Boolean); if(P.length) parts.push(`${c.first || c.name} is the child of Hunter${P.length > 1 ? 's' : ''} ${P.map(h => h.name).join(' and ')}, and has heard about the exam at every dinner {they} can remember.`); }
  // the strongest fact about this candidate opens the story, before the portrait
  const lead = storyLead(c); if(lead) parts.push(lead);
  parts.push(pk([
    `${c.name}${nick} is ${/^(8|11|18|8\d)$/.test(String(c.age)) ? 'an' : 'a'} ${c.age}-year-old ${traitNoun(c.trait)}: ${traitDesc(c.trait)}.`,
    `${c.name}${c.nick ? `, known as "${c.nick}",` : ''} is ${c.age} and ${aN(traitNoun(c.trait))} through and through: ${traitDesc(c.trait)}.`
  ], 's1'));
  const famT = c.fam || (c.family && c.family.type && attemptsOf(c) === 1) ? familyLine(c) : '';
  const avT = c.avenge && /brother|sister|sibling|father|mother|parent|uncle|aunt/.test(c.avenge.relH || '') ? `{They} grew up in the shadow of {their} ${c.avenge.relH}, ${c.avenge.hunter}, a licensed Hunter.` : '';
  parts.push(`${c.first} ${BG.origin[b.origin][0]}. ${famT || avT || `${pk(['{They} {were}', 'Growing up, {they} {were}'], 'fw')} ${BG.family[b.family]}.`}`);
  const MB = typeof mtBio === 'function' ? mtBio(c) : null;
  if(MB){ parts.push(pk([`Before the exam, ${c.first} ${BG.job[b.job]}.`, `${c.first} ${BG.job[b.job]} for a while.`], 'j') + ' ' + MB.before + ' ' + MB.teach); }
  else parts.push(pk([`Before the exam, ${c.first} ${BG.job[b.job]}, and ${BG.train[b.train]}.`, `${c.first} ${BG.job[b.job]} for a while and ${BG.train[b.train]}.`], 'j'));
  parts.push(pk([`Everything changed when ${c.first} ${BG.moment[b.moment]}.`, `The moment that shaped {them}: ${c.first} ${BG.moment[b.moment]}.`], 'm'));
  parts.push(c.avenge ? `{They} came to avenge ${c.avenge.hunter}, {their} ${c.avenge.relH || 'friend'}, a Hunter who never came home${c.avenge.killer ? `, and to find ${c.avenge.killer}` : ''}.` : pk([`{They} came ${mo.m}.`, `{They} entered the exam ${mo.m}.`], 's2'));
  if(QUIRKS[c.quirk]) parts.push(`${c.first} ${QUIRKS[c.quirk]}, and never goes anywhere without ${BG.keep[b.keep]}.`);
  if(!famT) parts.push(BG.wait[b.wait]);   // families already got their paragraph; keeps the bio the same length
  { const D = BG.dream, k = c.avenge || !/family wrong/.test(mo.m || '') || !/family wrong/.test(D[b.dream]) ? b.dream : (b.dream + 1) % D.length;   // never say the same thing twice
    parts.push(`If {they} get{s} the license, {they} want{s} to ${D[k]}.`); }
  if(isReturning(c)){ const sn = MB && MB.since ? MB.since : b.since !== undefined ? `Since the last exam, {they} ${BG.since[b.since]}.` : ''; if(sn) parts.push(sn); }   // the attempt count and best result are in the header and the exam history
  return pro(parts.join(' '), c);
}
function bgHtml(c){
  const b = background(c);
  const cell = (k, v, cls) => `<div class="${cls || ''}"><small>${k}</small><span>${esc(pro(v, c))}</span></div>`;
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  return `<div class="bgrid">
    ${''/* origin, former life and training are already told in the story above */}
    ${cell('Talent', cap(BG.talent[b.talent][0]), 'good')}
    ${b.fear !== null ? cell('Fear', cap(BG.fear[b.fear][0]), 'bad') : cell('Fear', 'Nothing {they} will admit to')}
    ${QUIRKS[c.quirk] ? '' : cell('Keepsake', cap(BG.keep[b.keep]))}
  </div>`;
}
function grudgesHtml(c){
  const G = c.grudges || []; if(!G.length) return '';
  const m = cmap(S);
  // the same rules as bonds: rivals who left fade (and vanish after six years), rivals who became Hunters stay, tagged
  const who = g => { const o = m[g.id], h = (!o || o.status === 'Approved') ? HUNTERS.find(x => x.cid === g.id) : null, w = WORLD.wanted.some(x => x.cid === g.id); return {o, h, w, gone: !o && !h && !w}; };
  const show = G.filter(g => !(who(g).gone && g.ed != null && S.edition - g.ed > 6)), faded = G.length - show.length;
  if(!show.length) return '';
  const row = g => { const {o, h, w, gone} = who(g);
    const link = h ? `<a data-hunter="${esc(h.license)}">${esc(g.name)}</a> <span class="xtag sm sp">Hunter</span>` : o ? `<a data-id="${o.id}">${esc(g.name)}</a>` : `<span class="fam-civ-n">${esc(g.name)}</span>`;
    const st = h ? ` · ${h.status === 'Active Hunter' ? 'Hunter' : esc(h.status)}${hStars(h) ? ' · ' + starStr(hStars(h)) : ''}` : o ? '' : w ? ' (now on the Blacklist)' : ' (did not come back)';
    return `<div${gone ? ' class="fam-civ"' : ''}>${link} <span class="muted">— ${esc(g.why)}${st}</span></div>`; };
  // the same grievance against several people reads as one line ("took Rumi's own badge on Zevil Island" four times becomes one row with four names)
  const byWhy = new Map(); show.forEach(g => { const k = g.why || ''; byWhy.set(k, (byWhy.get(k) || []).concat([g])); });
  const many = gs => { const names = gs.map(g => { const {o, h} = who(g); return h ? `<a data-hunter="${esc(h.license)}">${esc(g.name)}</a>` : o ? `<a data-id="${o.id}">${esc(g.name)}</a>` : `<span class="fam-civ-n">${esc(g.name)}</span>`; });
    const nH = gs.filter(g => who(g).h).length;
    return `<div>${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} <span class="muted">— ${esc(gs[0].why)}${nH ? ` · ${nH === gs.length ? 'all' : nH} Hunter${nH === 1 ? '' : 's'} now` : ''}</span></div>`; };
  const rows = [...byWhy.values()].map(gs => gs.length > 1 && gs[0].why ? many(gs) : gs.map(row).join(''));
  return `<div><div class="section-h">Grudges</div><div class="grs">${rows.join('')}${faded ? `<p class="muted" style="margin:4px 0 0;font-size:12px">${faded} older grudge${faded === 1 ? '' : 's'} faded with time.</p>` : ''}</div></div>`;
}
function bondsHtml(c){
  const B = c.bonds || []; if(!B.length) return '';
  const m = cmap(S);
  // partners who left the exam world fade out after a few years; Hunters and anyone still around stay
  const gone = b => { const o = m[b.id], h = HUNTERS.find(x => x.cid === b.id); return !h && !o && !WORLD.wanted.some(w => w.cid === b.id); };
  const show = B.filter(b => !(gone(b) && S.edition - (b.ed || S.edition) > 6)), faded = B.length - show.length;
  if(!show.length) return '';
  return `<div><div class="section-h">Unbreakable bonds</div><div class="grs">${show.map(bondRow).join('')}${faded ? `<p class="muted" style="margin:4px 0 0;font-size:12px">${faded} older bond${faded === 1 ? '' : 's'} faded with time.</p>` : ''}</div></div>`;
}
// a bond partner may be in this exam, a licensed Hunter from an earlier one, or gone from the records
function bondRow(b){
  const o = cmap(S)[b.id], h = !o || o.status === 'Approved' ? HUNTERS.find(x => x.cid === b.id) : null;
  const link = h ? `<a data-hunter="${esc(h.license)}">${esc(b.name)}</a>` : o ? `<a data-id="${o.id}">${esc(b.name)}</a>` : `<b>${esc(b.name)}</b>`;
  const st = h ? `${h.status === 'Active Hunter' ? 'Hunter' : esc(h.status)}${hStars(h) ? ' · ' + starStr(hStars(h)) : ''} · ${h.license}` : o ? (ALIVE(o.status) ? 'still in' : o.status === 'Deceased' ? 'died' : 'out') : b.dead ? `died in the ${ordinal(b.dead)}` : (WORLD.wanted.some(w => w.cid === b.id) ? 'now on the Blacklist' : 'did not apply again');
  const civ = !h && !o;   // never came back: a step back, like relatives who chose another life
  return `<div${civ ? ' class="fam-civ"' : ''}><span style="color:var(--bond)">∞</span> ${civ ? `<span class="fam-civ-n">${esc(b.name)}</span>` : link}${h ? ' <span class="xtag sm sp">Hunter</span>' : ''} <span class="muted">— ${b.fam ? 'family' : 'bonded in the ' + ordinal(b.ed)} · ${st}</span></div>`;
}
function openProfile(id){
  const c = S.candidates.find(x => x.id === id);
  if(!c){ const h = HUNTERS.find(x => x.cid === id); if(h){ openHunter(h.license); return; } const a = MENTOR.appr.find(x => x.id === id); if(a) mtPastProfile(a); return; }
  const back = modalBack && modalBack.kind === 'people' ? `<button class="btn" id="mBack">‹ All participants</button>` : '';
  const groups = {};
  ATTRS.forEach(([k,l,g]) => (groups[g] = groups[g] || []).push([k,l]));
  const top = topAttrs(c,3), low = Object.keys(c.a).sort((x,y) => c.a[x]-c.a[y]).slice(0,2);
  let attrs = '';
  const MS = (MENTOR.appr.find(a => a.id === c.id && a.start) || {}).start;   // your apprentice: the tick shows them on the day you took them on
  if(MS) attrs += `<div class="grp mt-since">◆ Since joining your lodge · the tick marks where they started</div>`;
  for(const g in groups){
    attrs += `<div class="grp">${g}</div>` + groups[g].map(([k,l]) => { const d = MS ? c.a[k] - MS[k] : 0;
      return `<div class="attr${MS ? ' grow' : ''}"><span>${l}</span><span class="t"><i class="${top.includes(k)?'hi':low.includes(k)?'lo':''}" style="width:${c.a[k]}%"></i>${MS && d ? `<b style="left:${MS[k]}%" title="When you took them on: ${MS[k]}"></b>` : ''}</span><span class="v">${c.a[k]}${MS ? `<small class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? '+' + d : d < 0 ? d : ''}</small>` : ''}</span></div>`; }).join('');
  }
  // exam story: per phase, the candidate's highlights from the phase report, then their own record
  const hiFor = p => S.log.filter(e => e.p === p && !e.d && e.ids && e.ids.includes(c.id) && ['major','elim','info'].includes(e.type)
    && !/took the target badge|earns a Hunter License|loses the license bout/.test(e.text));
  const strip = (t, p) => clean(t).replace(new RegExp('^' + PHASES[p].name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ':\\s*'), '');
  let tl = '';
  // what happens once the exam is over (career, Nen awakening) is an epilogue, not part of the last phase
  const isAfter = n => /^After the exam:|^Chose a career/.test(n.text);
  PHASES.forEach((ph, p) => {
    if(true){ const T = trialStory(c, p); if(!T.head && !T.moments.length) return;
      const mt = (MENTOR.appr || []).find(a => a.id === c.id), e = mt && mt.trail && mt.trail.ed === S.edition ? mt.trail.ph.find(x => x.p === p) : null, call = e && (e.ap ? e.ap.l : e.dil ? e.dil.label : '');
      tl += `<div class="ph-l">${esc(ph.name)}</div>`;
      if(call) tl += `<div class="tl-mc">◆ ${esc(call)}${e.ap && e.ap.call ? ` <span class="mt-fx ${e.ap.call === 'right' ? 'up' : 'dn'}">${e.ap.call === 'right' ? 'right call' : 'wrong call'}</span>` : ''}</div>`;
      const ownSay = e && e.say && !T.out && !e.dil ? e.say : '';
      if(T.out) tl += `<div class="bad">${c.status === 'Deceased' ? 'Died. ' : c.status === 'Disqualified' ? 'Disqualified. ' : ''}${autoLink(esc(T.head), c.id)}</div>`;
      else if(ownSay && !/^“/.test(ownSay)) tl += `<div class="good">${esc(ownSay)}</div>`;
      else if(T.head) tl += `<div class="good">${autoLink(esc(T.head), c.id)}</div>`;
      if(ownSay && /^“/.test(ownSay)) tl += `<div class="tl-say">${esc(ownSay)}</div>`;
      const sn = ownSay.replace(/\W+/g, ' ').trim().toLowerCase();
      T.moments.filter(m => !sn || !m.h.replace(/<[^>]+>/g, '').replace(/\W+/g, ' ').trim().toLowerCase().endsWith(sn)).forEach(m => { tl += `<div class="${m.good ? 'hi' : m.bad ? 'bad' : ''}">${m.h}</div>`; });
      return; }
    const notes = foldAllyNotes(c.notes.filter(n => n.p === p && !isAfter(n))), his = hiFor(p), out = ['Eliminated','Deceased','Disqualified'].includes(c.status) && c.out === p;
    if(!notes.length && !his.length && !out) return;
    tl += `<div class="ph-l">${esc(ph.name)}</div>`;
    his.forEach(e => { tl += `<div class="hi ${e.type === 'elim' ? 'bad' : ''}">★ ${linkNames(e.text, e.ids.filter(id => id !== c.id))}</div>`; });
    const keys = n => [...(n.text.match(/^Day \d+/) || []), ...(n.text.match(/#\d+/g) || []), ...S.candidates.filter(o => o.id !== c.id && n.text.includes(o.name)).map(o => o.name)];
    const told = n => { const k = keys(n); return k.length >= 2 && his.some(e => k.every(x => e.text.includes(x))); };
    notes.filter(n => !told(n)).forEach(n => { const t = strip(n.text, p); tl += `<div class="${/License|Qualifier|excelled|rescued /.test(n.text)?'good':''}">${autoLink(esc(t.charAt(0).toUpperCase() + t.slice(1)), c.id)}</div>`; });
    if(out) tl += `<div class="bad">${c.status === 'Deceased' ? 'Died' : c.status === 'Disqualified' ? 'Disqualified' : 'Eliminated'}: ${autoLink(esc(c.fall || strip(c.reason, p)), c.id)}</div>`;
  });
  if(c.status === 'Approved') tl += `<div class="good"><b>Hunter License awarded.</b></div>`;
  const after = c.notes.filter(isAfter);
  if(after.length){ tl += `<div class="ph-l">After the exam</div>`; after.forEach(n => { const t = n.text.replace(/^After the exam:\s*/, ''); tl += `<div class="good">${autoLink(esc(t.charAt(0).toUpperCase() + t.slice(1)), c.id)}</div>`; }); }
  const state = c.fatigue > 55 ? ' Running on empty.' : c.fatigue > 30 ? ' Visibly tired.' : '';
  showModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(c.name)}">
    <div class="sheet-head"><div><div class="meta"><span class="regn">#${c.reg}</span></div><div class="sh-t"><h2>${esc(c.name)}</h2><span class="st ${c.status}">${c.status === 'Approved' ? 'Hunter' : c.status}</span></div>${c.nick ? `<div class="meta knownas">Known as <b>“${esc(c.nick)}”</b>${c.nickWhy ? ` — ${esc(c.nickWhy)}` : ''}${c.nickEd && c.nickEd !== S.edition ? ` (${ordinal(c.nickEd)} exam)` : ''}</div>` : ''}
      <div class="meta">${c.age} years · ${c.gender} · ${c.tier} applicant</div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${isReturning(c) ? `<span class="rtag">Returning candidate · attempt ${attemptsOf(c)}</span>` : '<span class="rtag first">First attempt</span>'}${c.fam ? `<span class="ftag">${esc(familyOf(S, c).name)}</span>` : ''}${c.heir ? `<span class="ftag" title="${esc(c.heir.parents.map(l => (hLic(l) || {}).name).filter(Boolean).join(' & '))}">Child of two Hunters</span>` : ''}${c.career ? `<span class="ctag">${esc(c.career)}</span>` : ''}${c.trait ? `<span class="ttag" title="${esc(traitDesc(c.trait))}">${esc(c.trait)}</span>` : ''}${c.nick ? `<span class="ntag" title="${esc(c.nickWhy || '')}">“${esc(c.nick)}”</span>` : ''}${c.secret && c.secret.revealed ? `<span class="secrettag" title="Revealed in the ${ordinal(c.secret.ed || S.edition)} exam">${esc(pro(SECRETS[c.secret.k].label, c))}</span>` : ''}${c.crusher ? `<span class="sabtag" title="A veteran who comes back to ruin first-timers">Rookie Crusher</span>` : ''}${c.injury && ALIVE(c.status) ? `<span class="injtag" title="Picked up in ${esc(thePhase(c.injury.from))}">Injured · ${esc(c.injury.w)}</span>` : ''}</div></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${favBtn(c.id)}${HUNTERS.find(h => h.cid === c.id) ? `<button class="btn small" data-hunter="${HUNTERS.find(h => h.cid === c.id).license}">${HUNTERS.find(h => h.cid === c.id).license}</button>` : ''}${back}<button class="btn" id="mClose">Close</button></div></div>
    <div><div class="section-h">Story</div><p class="story-p">${autoLink(esc(storyOf(c)), c.id)}</p>${bgHtml(c)}<p class="muted" style="margin:6px 0 0;font-size:12.5px">Best at ${top.map(k => ATTR_LABEL[k]).join(', ')}; weakest in ${low.map(k => ATTR_LABEL[k]).join(' and ')}.${ALIVE(c.status) ? state : ''}</p></div>
    ${bondsHtml(c)}
    ${grudgesHtml(c)}
    ${c.dojo && schOf(c.dojo.id) ? `<p class="h-fam"><span>⛩</span> ${c.dojoNen ? 'Already taught some Nen at' : 'Trained at'} ${schoolCrest(schOf(c.dojo.id), 22)} <a class="golink" data-school="${c.dojo.id}" title="Open the school">${esc(capS(schOf(c.dojo.id).name))} ›</a></p>` : ''}
    ${familyHtml(c)}
    ${allianceHtml(c)}
    ${connectionsHtml(c)}
    ${examHistoryHtml(c)}
    <div><div class="section-h">Exam story · ${ordinal(S.edition)}</div><div class="timeline">${tl || '<div class="muted">Has not competed yet.</div>'}</div></div>
    ${nenPanel(c)}
    <div><div class="section-h">Attributes</div><div class="attrs">${attrs}</div></div>
    <div class="pf-id">Candidate ID ${esc(c.id)}</div>
  </div>`);
  if(back){ $('mBack').onclick = () => openPeople(); }
}

