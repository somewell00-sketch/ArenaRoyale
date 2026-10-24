/* ---------- one way to tell a trial, everywhere: how it went, then the moments with other people; never the same line twice ---------- */
const VERD_TOLD = {
  'excelled': ['Among the very best in the {ph}.', 'Made the {ph} look easy.', 'Near the front of the whole field.', 'The examiner noticed. Everyone did.'],
  'passed comfortably': ['Through the {ph} without much trouble.', 'A steady run. Nothing to worry about.', 'Comfortably through.', 'Kept {their} head and got through.'],
  'scraped through': ['Through the {ph}, but only just.', 'Scraped through by a hair.', 'Made it, barely, and knows it.', 'One more stumble and it would have been over.']
};
const DUEL_WIN = {Combat: ['put {N} on the floor', 'outfought {N}', 'took {N} down'], Riddle: ['solved {N}\'s riddle', 'out-thought {N}', 'answered {N} before the question was finished'], Wager: ['out-bluffed {N}', 'won the wager against {N}', 'took {N}\'s hours at the table']};
const reEsc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function tidyStory(t){
  t = String(t).replace(/\s*\(\d+ members?\)/g, '').replace(/ — the group is now /g, ', now called ');
  (S.alliances || []).forEach(A => { if(A.name) t = t.split(` (${A.name})`).join(''); });
  return t;
}
function trialStory(c, p, seen){
  seen = seen || new Set();
  const ph = PHASES[p]; if(!ph) return {head: '', moments: []};
  const F = c.first || c.name.split(' ')[0], P = PR(c), h = s => nhash(c.id + p + s);
  const norm = t => String(t).replace(/<[^>]+>/g, '').replace(/\W+/g, ' ').trim().toLowerCase().slice(0, 60);
  const once = t => { const k = norm(t), full = String(t).replace(/<[^>]+>/g, '').replace(/\W+/g, ' ').trim().toLowerCase(); if(!k || seen.has(k) || [...seen].some(x => x.length > 24 && full.endsWith(x))) return false; seen.add(k); return true; };
  const out = ['Eliminated', 'Deceased', 'Disqualified'].includes(c.status) && c.out === p;
  const strip = t => clean(t).replace(new RegExp('^' + reEsc(ph.name) + ':\\s*'), '');
  const notes = foldAllyNotes((c.notes || []).filter(n => n.p === p && !/^After the exam:|^Chose a caree/.test(n.text))).map(n => ({...n, t: strip(n.text)}));
  // how it went
  let head = '', used = new Set();
  if(out) head = c.fall || (() => { let r = strip(c.reason || '').replace(/\.$/, ''); if(!r) return ''; if(/^[A-Z]/.test(r)) return r + '.'; return `${F} ${/^(exposed|revealed|caught|killed|expelled|beaten|thrown|trampled|crushed|pulled|mauled|drowned|disqualified)\b/.test(r) ? (P.pl ? 'were ' : 'was ') : ''}${r}.`; })();
  else for(const n of notes){ let m;
    if((m = n.t.match(/^team (\d+) with (.+?), ((?:found|reached|made|crossed|got|finished|escaped|came).*)$/i))){ const who = m[2].split(', '), w = who.length > 1 ? who.slice(0, -1).join(', ') + ' and ' + who[who.length - 1] : who[0]; head = `With ${w}, team ${m[1]} ${m[3].replace(/(\d+)h to spare/, '$1 hours to spare')}.`; used.add(n); break; }
    if(/^(beat|lost to) /.test(n.t)){ const parts = n.t.split(/, (?=beat |lost to )/).map((x, i) => { const q = x.match(/^(beat|lost to) (.+?) \((\w+)(?:, with tips from ally (.+))?\)$/); if(!q) return x; const V = q[1] === 'beat' ? DUEL_WIN[q[3]] || DUEL_WIN.Combat : FALL_DUEL[q[3]] || FALL_DUEL.Combat; return V[h(i) % V.length].replace('{N}', q[2]) + (q[4] ? `, with a whispered tip from ${q[4]}` : ''); });
      head = `${F} ${parts.join(', then ')}.`; used.add(n); break; }
    if(VERD_TOLD[n.t.toLowerCase()]){ const V = VERD_TOLD[n.t.toLowerCase()]; head = pro(V[h('v') % V.length], c).replace('{ph}', ph.name); used.add(n); break; }
  }
  if(head) once(head);
  // the moments, in the words of the log
  const KEEP = ['major', 'info', 'story', 'arc', 'ally', 'rescue', 'help', 'bond', 'family', 'rival', 'sabot', 'split', 'betray', 'examiner', 'veteran', 'secret', 'nen', 'fight', 'death', 'elim'];
  const evs = S.log.filter(e => e.p === p && !e.d && e.ids && e.ids.includes(c.id) && KEEP.includes(e.type) && !/took the target badge|earns a Hunter License|loses the license bout|^(Team \d|Majority|\d+ teams)/.test(e.text) && !(out && e.type === 'elim'));
  const moments = [];
  evs.forEach(e => { const t = tidyStory(e.text); if(once(t)) moments.push({h: linkNames(t, e.ids.filter(id => id !== c.id)), good: e.type === 'major', bad: e.type === 'death'}); });
  // notes only where the log has not already told it
  const names = n => S.candidates.filter(o => o.id !== c.id && n.t.includes(o.name)).map(o => o.first || o.name);
  const told = n => { const k = names(n); return k.length && evs.some(e => k.every(x => e.text.includes(x))); };
  notes.filter(n => !used.has(n) && !VERD_TOLD[n.t.toLowerCase()] && !told(n) && !(/^Secret revealed/.test(n.t) && evs.some(e => e.type === 'secret')) && !/^rescued by /i.test(n.t) && !(out && /^(Killed by|Died)/.test(n.t))).forEach(n => { let t = tidyStory(n.t); t = t.charAt(0).toUpperCase() + t.slice(1); if(!/[.!?”]$/.test(t)) t += '.'; if(once(t)) moments.push({h: autoLink(esc(t), c.id), good: /License|Qualifier|nickname/.test(t)}); });
  // on the island, the days in order
  const dn = m => { const q = m.h.replace(/<[^>]+>/g, '').match(/^Day (\d+)/); return q ? +q[1] : 0; };
  moments.sort((x, y) => dn(x) - dn(y));
  return {head, out, moments};
}

// their exam so far: each trial with how it went, the line they left, and the moments with other people
const MT_BEAT = ['ally', 'rescue', 'help', 'bond', 'family', 'rival', 'sabot', 'split', 'betray'];
const mtBeats = (c, p, n) => S.log.filter(x => x.p === p && x.ids && x.ids.includes(c.id) && MT_BEAT.includes(x.type) && !/^(Team \d|Majority)/.test(x.text)).slice(0, n || 2);
let SQ_OPEN = new Set();
// what the trial gave them besides the result: highlights, alliances, rescues, names; prose, never a list, never the line already shown
function mtStoryHtml(c, p, shown){
  { const seen = new Set(); [shown, c.fallScene].filter(Boolean).forEach(t => seen.add(String(t).replace(/\W+/g, ' ').trim().toLowerCase().slice(0, 60)));
    const T = trialStory(c, p, seen); return T.moments.filter(m => !T.out || true).slice(0, 3).map(m => m.h).join(' '); }
  const parts = [], seen = new Set(), norm = t => String(t).replace(/<[^>]+>/g, '').replace(/\W+/g, ' ').trim().toLowerCase();
  const add = (txt, html) => { const k = norm(txt); if(!k || seen.has(k) || (shown && norm(shown).includes(k.slice(0, 40))) || (c.fallScene && k.includes(norm(c.fallScene).slice(0, 40)))) return; seen.add(k); parts.push(html); };
  S.log.filter(e => e.p === p && !e.d && e.ids && e.ids.includes(c.id) && ['major', 'elim', 'info', ...MT_BEAT].includes(e.type) && !/took the target badge|earns a Hunter License|loses the license bout|^(Team \d|Majority)/.test(e.text)).forEach(e => add(e.text, linkNames(e.text, e.ids.filter(id => id !== c.id))));
  foldAllyNotes((c.notes || []).filter(n => n.p === p && !/^After the exam:|^Chose a caree/.test(n.text) && !new RegExp('^' + PHASES[p].name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': (?!rescued|team)').test(n.text))).forEach(n => { const t = n.text.replace(/^[^:]+: /, '').replace(/^(\w)/, x => x.toUpperCase()); add(t, autoLink(esc(t.replace(/\.?$/, '.')), c.id)); });
  return parts.slice(0, 3).join(' ');
}
function mtJourneyHtml(a, c){
  const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : []; if(!tr.length) return '';
  return `<ol class="sq-tl">${tr.map(e => { const mk = e.k === 'ok' ? `<i class="mt-ck up">✓</i>${e.pct ? `<span class="sq-pct">Top ${e.pct}%</span>` : ''}` : e.k === 'lic' ? '<i class="mt-ck lic">★</i>' : `<i class="mt-ck dn">${e.k === 'dead' ? '✝' : '✗'}</i>`;
    const seen = new Set(), say = e.k !== 'ok' && e.k !== 'lic' || e.dil ? '' : e.say || ''; if(say) seen.add(say.replace(/\W+/g, ' ').trim().toLowerCase().slice(0, 60));
    const T = trialStory(c, e.p, seen), line = T.out ? T.head : say || T.head;
    return `<li><div class="tl-h"><b>${esc(PHASES[e.p].name)}</b>${mk}${e.ap ? `<span class="tl-call">${esc(e.ap.l)}</span>` : e.dil ? `<span class="tl-call">${esc(e.dil.label)}</span>` : ''}</div>${line ? `<p>${esc(line)}</p>` : ''}${T.moments.slice(0, 3).map(m => `<p class="tl-b">${m.h}</p>`).join('')}</li>`; }).join('')}</ol>`;
}
// how the lodge did in the last trial, one quiet line each, with the temperament picker at the end; the same card on phones and desktop
// on the island: how yesterday went for each of them, answering the call you made for that day
const ZQUIET = {hunt: ['Hunted all day. The target never showed.', 'Followed a trail to the target, and lost it at dusk.'], ambush: ['Waited in ambush. Nobody walked by.', 'Set a trap by the stream. It stayed empty.'],
  hide: ['Lay low and kept {their} badges close. Nobody came.', 'Spent the day in a hollow tree. A quiet day, which was the point.'], ally: ['Looked for allies. Nobody trusted {them} today.', 'Shared a fire with a stranger, and nothing more.'], revenge: ['Tracked the thief. The trail went cold.', 'Found the thief\'s camp, empty.']};
function mtZDayHtml(){
  if(!S.live || S.live.kind !== 'zevil') return '';
  const {Z, d} = liveZ(); if(!Z || d < 1) return '';
  const prev = Z.days[d - 1], now = Z.days[d], cm = cmap(livePreview().S);
  const lines = mtHere().filter(({c}) => Z.ids.includes(c.id)).map(({a, c}) => {
    const id = c.id, k = (S.live.st[id] || [])[d], gone = now && (now.gone || {})[id], wasGone = prev && (prev.gone || {})[id]; if(wasGone) return '';
    const pts = s2 => s2 ? liveZPts(Z, s2, id) : 0, dp = pts(now) - pts(prev);
    const evR = Z.ev.filter(e => e.day === d && e.ids && e.ids.includes(id)).sort((x, y) => ((y.ids[0] === id) * 2 + /#\d/.test(y.text)) - ((x.ids[0] === id) * 2 + /#\d/.test(x.text)));   // what they did with badges first
    const ev = evR.map(e => e.text.replace(/^(Day \d+|Arrival): /, ''));
    const opt = k ? (ZOPT.find(o => o.k === k) || {}).l : null;
    const what = ev.length ? linkNames(ev[0], evR[0].ids) : esc(pro((ZQUIET[k || 'hide'] || ZQUIET.hide)[nhash(id + d) % 2], c));
    return `<div class="sq-l zq${gone ? ' off' : ''}"><a data-id="${id}">${esc(c.first || c.name)}</a><span class="sq-m">${dp ? `<i class="mt-ck ${dp > 0 ? 'up' : 'dn'}">${dp > 0 ? '+' : ''}${dp}</i>` : ''}<span class="sq-pct">${pts(now)}/6</span></span><span class="sq-w zq-w"><em>${esc(opt || 'By instinct')}</em> → ${what}${ev.length > 1 ? ` <span class="muted">+${ev.length - 1} more</span>` : ''}</span></div>`; }).join('');
  return lines ? `<div class="mt-squad"><div class="sq-h"><span>Day ${d} · result</span></div>${lines}</div>` : '';
}
// in the arena: each bout you called, as soon as it is fought
function mtFBoutHtml(){
  if(!S.live || S.live.kind !== 'final') return '';
  const P = livePreview(), B = P.S.bracket; if(!B) return ''; const cm = cmap(P.S);
  const all = [].concat(B.prelim || [], (B.rounds || []).flat(), ...(B.groups || []).map(g => g.rounds.flat())).filter(m => m && m.a && m.b && !m.bye).sort((x, y) => x.seq - y.seq);
  const lines = [];
  mtHere().forEach(({c}) => { const id = c.id, st = S.live.st[id] || []; let n = 0;
    all.filter(m => m.a === id || m.b === id).forEach(m => { n++; if(n > st.length || st[n - 1] == null) return;
      const won = m.w === id, o = cm[won ? m.l : m.w] || {}, k = st[n - 1], ex = (m.ex || []).filter(e => e.text), last = ex[ex.length - 1];
      lines.push({seq: m.seq, h: `<div class="sq-l zq${won ? '' : ' lost'}"><a data-id="${id}">${esc(c.first || c.name)}</a><span class="sq-m"><i class="mt-ck ${won ? 'up' : 'dn'}">${won ? '✓' : '✗'}</i></span><span class="sq-w zq-w"><em>${esc((FOPT.find(x => x.k === k) || {}).l || 'By instinct')}</em> → ${won ? 'beat' : 'lost to'} ${esc(o.name || '?')} by ${esc(m.how || 'decision')}.${last ? ` <span class="muted">${esc(last.text)}</span>` : ''}${won ? ' <b class="zq-h">Hunter ★</b>' : ''}</span></div>`}); }); });
  if(!lines.length) return '';
  return `<div class="mt-squad"><div class="sq-h"><span>Your bouts · results</span></div>${lines.sort((x, y) => y.seq - x.seq).slice(0, 4).map(x => x.h).join('')}</div>`;
}
function mtSquadHtml(p){
  const L = mtHere(); if(!L.length || MENTOR.off) return '';
  const zq = mtZDayHtml() || mtFBoutHtml(); if(zq) return zq;
  const pick = a => { const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : []; return {tr, e: p == null ? tr[tr.length - 1] : tr.find(x => x.p === p)}; };
  const X = L.map(({a, c}) => ({a, c, ...pick(a)})), P = X.find(x => x.e);
  const lines = X.map(({a, c, e, tr}) => { const live = c.status === 'Active' && !S.finished, last = tr[tr.length - 1];
    const mark = e ? (e.k === 'ok' ? `<i class="mt-ck up" title="Through">✓</i>${e.pct ? `<span class="sq-pct">Top ${e.pct}%</span>` : ''}` : e.k === 'lic' ? '<i class="mt-ck lic" title="Licensed">★</i>' : `<i class="mt-ck dn" title="${e.k === 'dead' ? 'Died' : 'Out'}">${e.k === 'dead' ? '✝' : '✗'}</i>`)
      : last && last.k !== 'ok' ? `<span class="sq-pct">${last.k === 'lic' ? '★ Licensed' : 'out since ' + esc(PHASES[last.p].name)}</span>` : '';
    const say = e && e.k !== 'ok' && e.k !== 'lic' && c.fall ? c.fall : e && e.say ? e.say : !e && live ? 'Ready.' : '';
    const story = e ? mtStoryHtml(c, e.p, say) : '', open = SQ_OPEN.has(a.id);
    return `<div class="sq-l${live ? '' : ' off'}"><a data-id="${a.id}" title="${esc(a.name)}">${esc(c.first || a.name)}</a><span class="sq-m">${mark}</span><span class="sq-w" title="${esc(say)}">${esc(say)}${story ? `<span class="sq-beat">${story}</span>` : ''}${tr.length > 1 ? `<button type="button" class="sq-more" data-sqopen="${a.id}">${open ? 'Hide' : 'Their exam so far'} ${open ? '▴' : '▾'}</button>` : ''}${open ? mtJourneyHtml(a, c) : ''}</span>${live && !S.live ? `<select data-mtpostsel="${a.id}" title="Temperament: how ${esc(c.first || 'they')} goes when you make no call">${MT_POST.map(o => `<option value="${o.k}"${a.posture === o.k ? ' selected' : ''}>${o.l}</option>`).join('')}</select>` : ''}</div>`; }).join('');
  // who they ran with: the alliance and anyone beside them in that trial, one row for the lodge; who fell there is faded, who died has a cross
  const mine = new Set(X.map(x => x.c.id)), cm = cmap(S), ids = new Set();
  X.forEach(({c, e}) => { (e && (e.team && e.team.ids || e.with) || []).forEach(id => ids.add(id)); alliesOf(S, c, false).forEach(o => ids.add(o.id)); });
  const wc = [...ids].filter(id => !mine.has(id) && cm[id]).map(id => cm[id]).sort((x, y) => (x.status !== 'Active') - (y.status !== 'Active'));
  const chip = o => { const fell = P && o.out === P.e.p && !['Active', 'Approved', 'Finalist'].includes(o.status), gone = ['Eliminated', 'Deceased', 'Disqualified'].includes(o.status);
    return `<a class="mt-wc${gone ? ' gone' : o.status === 'Approved' ? ' hunter' : ''}" data-id="${o.id}" title="${gone ? (o.status === 'Deceased' ? 'Died' : 'Out') + ' in the ' + esc((PHASES[o.out] || {}).name || 'exam') : 'Still in'}">${esc(o.first || o.name)}${o.status === 'Deceased' ? ' ✝' : o.status === 'Approved' ? ' ★' : ''}</a>`; };
  const withRow = wc.length ? `<div class="mt-with sq-with"><span>with</span>${wc.map(chip).join('')}</div>` : '';
  return `<div class="mt-squad"><div class="sq-h"><span>${P ? esc(PHASES[P.e.p].name) + ' · result' : 'Before the first trial'}</span>${!S.live && X.some(x => x.c.status === 'Active') ? '<span class="sq-t">Temperament</span>' : ''}</div>${withRow}${lines}</div>`;
}
const mtTempHtml = (a, c) => `<div class="md-temp"><span title="How ${esc(c.first || 'they')} goes when you make no call">Temperament</span>${MT_POST.map(o => `<button type="button" class="${a.posture === o.k ? 'on' : ''}" data-mtpost="${a.id}" data-k="${o.k}" title="${esc(o.d)}">${o.l}</button>`).join('')}</div>`;
function drawerRender(){
  const el = $('mtDrawer'); if(!el) return;
  const L = MENTOR.off || S.finished ? [] : mtHere().filter(({c}) => c.status === 'Active');
  const bye = S.started ? mtByeHtml() : '', byeN = bye ? mtByes() : [];
  const ready = (L.length && (S.started || L.every(({a}) => mtCampFor(a).done))) || bye;
  if(!ready){ el.hidden = true; el.innerHTML = ''; return; }
  const at = S.phase + ':' + (S.live ? S.live.kind + (S.live.day || 0) + JSON.stringify(S.live.st) : ''); DRAWER_AT = at;
  const calls = L.map(({a, c}) => ({a, c, k: drawerCall(a, c)})).filter(x => x.k);
  const first = calls[0];
  const B0 = mtBlock(), bs = B0 && mtBlockState(B0), bk = bs && (bs.all || bs.same), bl = bk && bs.X[0].I.opts.find(o => o.k === bk).l;
  const sum = !L.length ? `<span class="md-n">◆ ${esc(byeN.map(x => x.c.first || x.c.name).join(' & '))}</span><span class="md-ctx">${byeN.every(x => x.e.k === 'lic') ? 'a Hunter now' : 'the exam is over for ' + (byeN.length > 1 ? 'them' : PR(byeN[0].c).them)}</span>` : B0 ? `<span class="md-n">◆ ${B0.length === 2 ? 'Both' : 'All ' + B0.length}</span><span class="md-ctx">${esc(PHASES[S.phase].name)}</span><span class="md-call${bs.all ? ' mine' : ''}">${esc(bl || (bs.any ? 'mixed calls' : 'by instinct'))}</span>` : first ? `<span class="md-n">◆ ${esc(first.c.first || first.c.name)}</span><span class="md-ctx">${esc(first.k.ctx)}</span><span class="md-call${first.k.mine ? ' mine' : ''}">${esc(first.k.l)}</span>${calls.length > 1 ? `<span class="md-more">+${calls.length - 1}</span>` : ''}` : `<span class="md-n">◆ Your apprentice${L.length > 1 ? 's' : ''}</span><span class="md-ctx">nothing to decide</span>`;
  const last = ({a}) => { const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : []; const e = tr[tr.length - 1]; return e ? `<small class="md-last">${lastP != null ? '' : 'Last: ' + esc(PHASES[e.p].name) + ' · '}${e.k === 'ok' ? 'through' + (e.pct ? ' · top ' + e.pct + '%' : '') : e.k}</small>` : ''; };
  const B = mtBlock(), lastP = (() => { const ps = L.map(({a}) => { const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : []; const e = tr[tr.length - 1]; return e ? e.p : -1; }); return B && ps.every(x => x === ps[0]) && ps[0] >= 0 ? ps[0] : null; })();
  const boxes = L.map(({a, c}) => S.live ? liveBoxHtml(a, c) : (mtDilPanelHtml(S.phase, a.id) || (mtApOpen(a, c) && !mtInBlock(a) ? mtApHtml(a, c, true) : ''))).join('') + (B ? mtApBlockHtml(B) : '');
  const grp = S.live ? '' : mtDilPanelHtml(S.phase, null, true);
  el.hidden = false; el.classList.toggle('open', DRAWER_OPEN);
  const mode = S.live ? '' : mtModeHtml(), LA = mtLodgeA();
  const keepY = (el.querySelector('.md-body') || {}).scrollTop || 0;
  el.innerHTML = `<button type="button" class="md-sum" data-mddrawer aria-expanded="${DRAWER_OPEN}">${sum}<em>${DRAWER_OPEN ? '▾' : '▴'}</em></button>${DRAWER_OPEN ? `<div class="md-body">${L.length ? drawerBrief() : ''}${mode || LA ? `<div class="md-mode">${LA ? `<span class="mt-lodgea">◆ ${esc(LA.name)}</span>` : ''}${mode}</div>` : ''}${bye}${L.length ? mtSquadHtml(null) : ''}${boxes}${grp}</div>` : ''}`;
  { const b = el.querySelector('.md-body'); if(b && keepY) b.scrollTop = keepY; }
}
document.addEventListener('click', e => { if(e.target.closest('[data-mddrawer]')){ DRAWER_OPEN = !DRAWER_OPEN; drawerRender(); } });
// by the Run button: one quiet chip per apprentice, a small menu of orders above it
let mtPopOpen = null;
function mtCtlRender(){
  const el = $('mtCtl'); if(!el) return;
  const L = MENTOR.off || S.finished ? [] : mtHere();
  if(!L.length){ el.innerHTML = ''; return; }
  const nx = PHASES[S.phase], info = L.map(({a, c}) => { const live = c.status === 'Active', d = live ? mtDilFor(a, c) : null; return {a, c, live, P: MT_POST.find(x => x.k === a.posture), ask: false}; });
  const live = info.filter(x => x.live), ask = info.some(x => x.ask), one = info.length === 1 ? info[0] : null;
  const label = one ? `<span class="mt-cn">${esc(one.c.first || one.c.name)} ·</span><b>${!one.live ? 'out' : one.ask ? 'a choice' : one.P.l}</b>` : `<span class="mt-cn">Temperament ·</span><b>${live.length}</b>`;
  const pop = mtPopOpen ? `<span class="mt-pop" role="menu"><small>Temperament · how they go when you make no call</small>${info.map(({a, c, live, ask}) => `<div class="mt-pg${live ? '' : ' off'}">${info.length > 1 ? `<span class="mt-pn">◆ ${esc(c.first || c.name)}${live ? '' : ' · out'}</span>` : ''}${live ? MT_POST.map(o => `<button type="button" role="menuitemradio" aria-checked="${a.posture === o.k}" class="${a.posture === o.k ? 'on' : ''}" data-mtpost="${a.id}" data-k="${o.k}" title="${o.d}">${o.l}</button>`).join('') : ''}</div>`).join('')}</span>` : '';
  el.innerHTML = `<span class="mt-cw"><button type="button" class="mt-cbtn${live.length ? '' : ' off'}${ask ? ' ask' : ''}" data-mtpop="all" ${live.length ? '' : 'disabled'} title="Temperament of your apprentice${info.length > 1 ? 's' : ''}"><i>◆</i>${label}${live.length ? '<em>▾</em>' : ''}</button>${live.length && !MENTOR.hintSeen2 && !mtPopOpen ? `<span class="mt-hint-b">Temperament: how ${info.length > 1 ? 'they go' : esc(info[0].c.first || 'they') + ' goes'} when you make no call<button type="button" data-mthint aria-label="Got it">×</button></span>` : ''}${pop}</span>`;
  drawerRender();
}
// the same lines their profile keeps for this phase: log highlights, the examiner's notes, and how it ended
function mtRecord(c, p){
  const ph = PHASES[p]; if(!ph) return '';
  { const T = trialStory(c, p), L = T.moments.map(m => `<div${m.good ? ' class="good"' : ''}>${m.h}</div>`);
    if(T.out) L.unshift(`<div class="bad">${c.status === 'Deceased' ? 'Died. ' : c.status === 'Disqualified' ? 'Disqualified. ' : ''}${autoLink(esc(T.head), c.id)}</div>`);
    if(c.status === 'Approved' && ph.final) L.push(`<div class="good">Hunter License awarded.</div>`);
    return L.join(''); }
  const his = S.log.filter(e => e.p === p && !e.d && e.ids && e.ids.includes(c.id) && ['major','elim','info'].includes(e.type) && !/took the target badge|earns a Hunter License|loses the license bout/.test(e.text));
  const strip = t => clean(t).replace(new RegExp('^' + ph.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*'), '');
  const keys = n => [...(n.text.match(/^Day \d+/) || []), ...(n.text.match(/#\d+/g) || []), ...S.candidates.filter(o => o.id !== c.id && n.text.includes(o.name)).map(o => o.name)];
  const told = n => { const k = keys(n); return k.length >= 2 && his.some(e => k.every(x => e.text.includes(x))); };
  const out = ['Eliminated', 'Deceased', 'Disqualified'].includes(c.status) && c.out === p, L = [];
  his.forEach(e => L.push(`<div>${linkNames(e.text, e.ids.filter(id => id !== c.id))}</div>`));
  foldAllyNotes((c.notes || []).filter(n => n.p === p).map(n => { const m = !MENTOR.off && n.text.match(/^(?:[^:]+: )?team \d+ with .+?, ((?:found|reached|made|crossed|got|finished|escaped|came)[^,]*)$/i); return m ? {...n, text: m[1].charAt(0).toUpperCase() + m[1].slice(1)} : n; })).filter(n => !/^After the exam:|^Chose a career|^Back for attempt|^Attempt \d+\.|^Returns for a|^Here again\.|^Knows the routine/.test(n.text) && !/^(excelled|passed comfortably|scraped through)\.?$/i.test(strip(n.text)) && !told(n)).forEach(n => { const s = strip(n.text); L.push(`<div>${autoLink(esc(s.charAt(0).toUpperCase() + s.slice(1)), c.id)}</div>`); });
  if(out) L.push(`<div class="bad">${c.status === 'Deceased' ? `Died: ${autoLink(esc(strip(c.reason || '')), c.id)}` : c.status === 'Disqualified' ? `Disqualified: ${autoLink(esc(strip(c.reason || '')), c.id)}` : autoLink(esc(mtWhy(c)), c.id)}</div>`);
  if(c.status === 'Approved' && ph.final) L.push(`<div class="good">Hunter License awarded.</div>`);
  return L.join('');
}
// under the phase header: the apprentice's road so far and what this phase did to them
// the team they ran with in a team trial: number, name and who was in it
function mtTeamOf(c, p){
  const e = S.log.find(x => x.p === p && x.type === 'team' && (x.ids || []).includes(c.id)); if(!e) return null;
  const m = e.text.match(/^Team (\d+)(?: · (.+?))? \(/); return m ? {n: +m[1], name: m[2] || '', ids: (e.ids || []).filter(id => id !== c.id), ok: /to spare/.test(e.text)} : null;
}
// why they went out, said plainly
function mtWhy(c, e){
  if(c.fall){ const ap = e && e.ap, P = PR(c), F = c.first || c.name, pk = (arr) => arr[nhash(c.id + (e ? e.p : 0) + 'cl') % arr.length];
    const act = ap && ap.l ? ap.l.charAt(0).toLowerCase() + ap.l.slice(1) : '';
    const cl = !ap || !ap.call ? '' : ap.call === 'wrong' ? (ap.mine ? pk([`${F} went in as you said, to ${act}, and it was the wrong road for this trial.`, `On your word ${P.they} chose to ${act}. Here, that was the wrong choice.`]) : pk([`${F} followed ${P.their} gut and chose to ${act}. ${P.Their} gut was wrong.`, `Left to ${P.their} instinct, ${F} chose to ${act}, the wrong road here.`]))
      : pk([`${P.They} chose to ${act}, the right call, and it was still not enough.`, `To ${act} was the right call. The trial was simply stronger.`]);
    const sc = c.fallScene && c.fall.startsWith(c.fallScene) ? c.fallScene : c.fall, rest = sc === c.fall ? '' : c.fall.slice(sc.length).trim();
    return [sc, cl, rest].filter(Boolean).join(' '); }
  let r = clean(c.reason || '').replace(/^[^:]+:\s*/, ''); const P = PR(c), cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const hair = /, missing the cut by a hair$/.test(r); r = r.replace(/, missing the cut by a hair$/, '');
  let m;
  if((m = r.match(/^team (.+?); out of time \(team (\d+)\)$/))){ const why = m[1].replace(/^was crippled by (.+?)['’]s refusal to cooperate$/, '$1 would not cooperate').replace(/^(\w)/, x => x); return /ran out of time$/.test(why) ? `Team ${m[2]} ${why}.` : `Team ${m[2]} ran out of time: ${/would not cooperate$/.test(why) ? why : 'the team ' + why}.`; }
  if((m = r.match(/^lost to (.+?) \((\w+)\) and lost to (.+?) \((\w+)\); the time penalties ran out the clock$/))) return `Lost both challenges, to ${m[1]} (${m[2].toLowerCase()}) and ${m[3]} (${m[4].toLowerCase()}). The time penalties ran out the clock.`;
  if(/^lost the last match of the bracket/.test(r)) return `Lost the last match: the one finalist who does not pass.`;
  return (hair ? 'Missed the cut by a hair: ' : '') + (hair ? r : cap(r)) + (/[.!?]$/.test(r) ? '' : '.');
}
function mtReportHtml(i){
  if(MENTOR.off || !MENTOR.made) return '';
  const here = mtHere(); if(!S.started && (!here.length || here.some(({a}) => !mtCampFor(a).done))) return '';
  const L = MENTOR.appr.filter(a => (a.trail && a.trail.ed === S.edition) || here.some(x => x.a === a));
  const G = L.length >= 2 || (here.some(x => x.c.status === 'Active') && !S.finished);
  const rows = L.map(a => {
    const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : [], e = i == null ? null : tr.find(x => x.p === i);
    const last = tr[tr.length - 1], gone = !!(last && last.k !== 'ok');
    const dots = PHASES.map((ph, j) => { const x = tr.find(y => y.p === j); return `<i class="${x ? 'd-' + x.k + (x.k === 'ok' && x.fit >= 4 ? ' d-star' : '') : gone && j > last.p ? 'd-none' : 'd-todo'}${j === i ? ' d-cur' : ''}" title="${esc(ph.name)}"></i>`; }).join('');
    const out = !e ? '' : e.k === 'ok' ? 'Through' : e.k === 'lic' ? 'Licensed ✦' : e.k === 'dead' ? 'Died here' : 'Out here · back next year';
    const prev = e && tr.filter(x => x.p < i && x.pct).pop(), pct = e && e.k === 'ok' && e.pct ? `<span class="mt-pct" title="${ordinal(e.rank)} of ${fmt(e.n)} in this trial">Top ${e.pct}%${prev ? (e.pct < prev.pct ? ' <i class="up">▲</i>' : e.pct > prev.pct ? ' <i class="dn">▼</i>' : '') : ''}</span>` : '';
    const gone2 = !e && gone && (i == null || i > last.p) ? `<span class="mt-out k-${last.k}">${last.k === 'lic' ? 'Licensed ✦' : `Out since ${esc(PHASES[last.p].name)}`}</span>` : '';
    const c = S.candidates.find(x => x.id === a.id), who = x => x ? '' : ' <span>· by instinct</span>';
    // the trial just run: the call, what came of it, then the record; a balloon only when they actually said something
    const call = !e ? '' : e.dil ? `<div class="mt-call">${esc(c && e.dil.q.startsWith((c.first || c.name) + ': ') ? e.dil.q.slice((c.first || c.name).length + 2) : e.dil.q)} → <b>${esc(e.dil.label)}</b>${who(!e.dil.auto)}</div>`
      : e.ap ? `<div class="mt-call"><b>${esc(e.ap.l)}</b>${who(e.ap.mine)}${e.ap.call ? ` <span class="mt-fx ${e.ap.call === 'right' ? 'up' : 'dn'}">${e.ap.call === 'right' ? 'right call' : 'wrong call'}</span>` : ''}${e.ap.ru ? ' <span>· the rumour was wrong</span>' : ''}</div>`
      : e.defy ? `<div class="mt-call">Ignored your call. Did it ${PR(c || {}).their || 'their'} way.</div>` : '';
    const quote = e && e.say && /^“/.test(e.say), what = e && e.say && !quote && !e.defy ? `<p class="mt-what">${esc(e.say)}</p>` : '';
    const rec = e && c ? mtRecord(c, i) : '';
    // a quieter twin of the Next box: the trial and how it ended, the call, what came of it, the record
    const T = e ? (e.team || (c ? mtTeamOf(c, i) : null)) : null, W = e && !T ? (e.with || []) : [];
    // an ally who fell in this trial keeps their chip, faded, with a red edge
    const chip = id => { const o = cmap(S)[id]; if(!o) return ''; const fell = o.out === i && o.status !== 'Active' && o.status !== 'Approved' && o.status !== 'Finalist', dead = fell && o.status === 'Deceased';
      return `<a class="mt-wc${fell ? ' gone' : ''}" data-id="${o.id}"${fell ? ` title="${dead ? 'Died here' : o.status === 'Disqualified' ? 'Disqualified here' : 'Eliminated here'}"` : ''}>${esc(o.first || o.name)}${dead ? ' ✝' : ''}</a>`; };
    const withRow = T ? `<div class="mt-with"><span>Team ${T.n}${T.name ? ' · ' + esc(T.name) : ''}</span>${T.ids.map(chip).join('')}</div>` : W.length ? `<div class="mt-with"><span>with</span>${W.map(chip).join('')}</div>` : '';
    const past = e ? `<div class="mt-dpanel in mt-past k-${e.k}"><div class="mt-dtop"><span class="mt-lab">◆ ${esc(PHASES[i].name)}</span><span class="mt-res"><span class="mt-out k-${e.k}">${out}</span>${pct}${e.bonus ? `<span class="mt-fx mt-bonus">+${fmtJ(e.bonus)}</span>` : ''}</span></div>${withRow}${call}${what}${quote ? `<p class="mt-say">${esc(e.say)}</p>` : ''}${rec ? `<div class="mt-rec">${rec}</div>` : ''}</div>` : gone2 ? `<div class="mt-dpanel in mt-past"><div class="mt-dtop">${gone2}</div></div>` : '';
    const live = c && c.status === 'Active' && !S.finished;
    const dilIn = live && !S.live ? mtDilPanelHtml(i, a.id) : '';
    const orders = live && S.live ? liveBoxHtml(a, c) : live && !dilIn && mtApOpen(a, c) && !mtInBlock(a) ? mtApHtml(a, c, true) : '';
    // once their exam is over, everyone they ran with this year stays on the card, with how it ended for them
    const allyRow = (() => { if(live || !c) return ''; const ids = new Set(); tr.forEach(x => (x.with || []).forEach(id => ids.add(id))); alliesOf(S, c).forEach(o => ids.add(o.id)); ids.delete(c.id); if(!ids.size) return '';
      const cm = cmap(S), st = o => o.status === 'Approved' ? 'hunter' : ['Eliminated', 'Deceased', 'Disqualified'].includes(o.status) ? 'gone' : '';
      return `<div class="mt-with mt-allies"><span>Allies this year</span>${[...ids].map(id => cm[id]).filter(Boolean).sort((x, y) => (y.status === 'Approved') - (x.status === 'Approved')).map(o => `<a class="mt-wc ${st(o)}" data-id="${o.id}" title="${o.status === 'Approved' ? 'Became a Hunter' : o.status === 'Deceased' ? 'Died' : o.status === 'Disqualified' ? 'Disqualified' : o.status === 'Eliminated' ? 'Eliminated in ' + esc((PHASES[o.out] || {}).name || 'the exam') : 'Still in'}">${esc(o.first || o.name)}${o.status === 'Deceased' ? ' ✝' : o.status === 'Approved' ? ' ★' : ''}</a>`).join('')}</div>`; })();
    if(G){ if(!e && !gone2 && !dilIn && !orders && !allyRow && !live) return '';
      const res = e ? `<span class="mt-out k-${e.k}">${out}</span>${pct}${e.bonus ? `<span class="mt-fx mt-bonus">+${fmtJ(e.bonus)}</span>` : ''}` : gone2;
      return {a, c, live, e, T, W, chips: T ? T.ids : W, chip, dilIn, orders, res, gone2, tip: [e && e.ap ? e.ap.l : e && e.dil ? e.dil.label : '', e && e.say].filter(Boolean).join(' — '),
        line: `<div class="mt-gl${e ? ' k-' + e.k : ''}"><div class="mt-gh"><a data-id="${a.id}" title="${esc(a.name)}">${esc(c ? c.first || a.name : a.name)}</a><span class="mt-gc">${call ? call.replace(/^<div class="mt-call">/, '').replace(/<\/div>$/, '') : ''}</span><span class="mt-gres">${res}</span></div>${what || quote ? `<div class="mt-gw" title="${esc(e.say)}">${esc(e.say)}</div>` : ''}${allyRow}</div>`}; }
    if(!past && !dilIn && !orders && !allyRow) return '';
    return `<div class="mt-row${e ? ' k-' + e.k : ''}"><div class="mt-rl"><a data-id="${a.id}">${esc(a.name)}</a><span class="mt-dots">${dots}</span><span class="mt-trust" title="Trust ${mtTrust(a)}/100: calls that fit their nature build it"><i style="width:${mtTrust(a)}%"></i></span></div>${allyRow}${past}${dilIn}${orders}${live ? mtTempHtml(a, c) : ''}</div>`; }).filter(Boolean);
  const B = mtBlock();
  const grp = (S.finished || S.live ? '' : mtDilPanelHtml(i, null, true)) + (B ? mtApBlockHtml(B) : '');
  if(!rows.length && !grp) return '';
  const live = here.some(({c}) => c.status === 'Active') && !S.finished;
  if(G){
    // two or more: one box for the trial just run, then the calls, then their temperaments in one table
    const withE = rows.filter(x => x.e), mine = new Set(rows.map(x => x.a.id));
    const ext = x => (x.chips || []).filter(id => !mine.has(id)).sort().join(',');
    const shared = withE.length > 1 && withE.every(x => ext(x) === ext(withE[0]) && !!x.T === !!withE[0].T) ? withE[0] : null;
    const sw = shared && ext(shared) ? `<div class="mt-with">${shared.T ? `<span>Team ${shared.T.n}${shared.T.name ? ' · ' + esc(shared.T.name) : ''}</span>` : '<span>with</span>'}${ext(shared).split(',').map(shared.chip).join('')}</div>` : '';
    const ownWith = x => { if(shared || !x.e) return ''; const ids = (x.chips || []).filter(id => id !== x.a.id); return ids.length ? `<div class="mt-with">${x.T ? `<span>Team ${x.T.n}</span>` : '<span>with</span>'}${ids.map(x.chip).join('')}</div>` : ''; };
    const qs = withE.map(x => x.e.dil ? x.e.dil.q : null), q1 = withE.length > 1 && qs[0] && qs.every(q => q === qs[0]) ? qs[0] : null;
    const qShow = q1 && q1.replace(/^[^:“"]+:\s*/, '');
    const pastBox = `<div class="mt-dpanel in mt-past mt-gpast">${i != null && withE.length ? `<div class="mt-dtop"><span class="mt-lab">◆ ${esc(PHASES[i].name)}</span></div>${sw}${q1 ? `<div class="mt-call mt-gq">${esc(qShow)}</div>` : ''}` : ''}${rows.map(x => (q1 ? x.line.split(esc(q1) + ' → ').join('→ ') : x.line).replace(/<\/span><\/div>(<div class="mt-gw"|<\/div>$)/, (m, t) => '</span></div>' + ownWith(x) + t)).join('')}</div>`;
    const calls = rows.filter(x => x.dilIn || x.orders).map(x => `<div class="mt-gcall">${x.dilIn}${x.orders}</div>`).join('');
    const temps = rows.filter(x => x.live).map(x => `<div class="mt-gt"><span>${esc(x.c.first || x.c.name)}</span>${mtTempHtml(x.a, x.c).replace(/<span title="[^"]*">Temperament<\/span>/, '')}</div>`).join('');
    const LA = mtLodgeA();
    // while they are still in it: one line of chips (name, how the last trial went, temperament); the full story stays in the log and their profiles
    if(rows.some(x => x.live)){
      const strip = rows.map(x => { return `<span class="mt-gchip${x.e ? ' k-' + x.e.k : ''}${x.live ? '' : ' off'}" title="${esc(x.tip)}"><a data-id="${x.a.id}">${esc(x.c ? x.c.first || x.a.name : x.a.name)}</a>${x.e ? `<span class="mt-gr">${x.e.k === 'ok' ? `<i class="mt-ck up" title="Through">✓</i>${x.e.pct ? `<span class="mt-pct">Top ${x.e.pct}%</span>` : ''}` : x.e.k === 'lic' ? '<i class="mt-ck lic" title="Licensed">★</i>' : `<i class="mt-ck dn" title="${x.e.k === 'dead' ? 'Died' : 'Out'}">${x.e.k === 'dead' ? '✝' : '✗'}</i>`}</span>` : x.res ? `<span class="mt-gr">${x.res}</span>` : ''}${x.live ? `<select data-mtpostsel="${x.a.id}" title="Temperament: how ${esc(x.c.first || 'they')} goes when you make no call">${MT_POST.map(o => `<option value="${o.k}"${x.a.posture === o.k ? ' selected' : ''}>${o.l}</option>`).join('')}</select>` : ''}</span>`; }).join('');
      return `<div class="mt-rep mt-lodge mt-grouped mt-glive"><div class="mt-lh"><span class="mt-lab">◆ Your apprentice${L.length > 1 ? 's' : ''}${LA ? `<span class="mt-lodgea"> · ${esc(LA.name)}</span>` : ''}</span>${!S.live ? mtModeHtml() : ''}</div>${i == null || i === mtByeP() ? mtByeHtml() : ''}${mtSquadHtml(i != null && withE.length ? i : null)}${calls}${grp}</div>`;
    }
    return `<div class="mt-rep mt-lodge mt-grouped"><div class="mt-lh">${''}<span class="mt-lab">◆ Your apprentices${LA ? `<span class="mt-lodgea"> · ${esc(LA.name)}</span>` : ''}</span>${live && !S.live ? mtModeHtml() : ''}</div>${i === mtByeP() ? mtByeHtml() : ''}${pastBox}${calls}${grp}${temps ? `<div class="mt-gtemp"><span class="mt-gtl" title="How they go when you make no call">Temperament</span>${temps}</div>` : ''}</div>`;
  }
  return `<div class="mt-rep mt-lodge"><div class="mt-lh"><span class="mt-lab">◆ Your ${rows.length > 1 ? 'apprentices' : 'apprentice'}</span></div>${i === mtByeP() ? mtByeHtml() : ''}${rows.join('')}${grp}</div>`;
}
// a former apprentice who never became a Hunter: what the lodge remembers of them
function mtPastProfile(a){
  const s = a.snap || {}, lines = MENTOR.log.filter(l => l.text.indexOf(a.name) >= 0);
  const bars = s.a ? ATTRS.map(([k, l]) => `<div class="attr"><span>${l}</span><span class="t"><i style="width:${s.a[k]}%"></i></span><span class="v">${s.a[k]}</span></div>`).join('') : '';
  showModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(a.name)}"><div class="sheet-head"><div><div class="meta">◆ Former apprentice · since the ${ordinal(a.from)}</div><h2>${esc(a.name)}</h2>
    <div class="meta">${MT_OUT[a.status] || ''}${a.ed ? ' in the ' + ordinal(a.ed) : ''}${s.age ? ` · ${s.age} years` : ''}${s.tier ? ` · ${esc(s.tier)}` : ''}${s.tries ? ` · ${s.tries} exam${s.tries > 1 ? 's' : ''}` : ''}</div></div><button class="btn" id="mClose">Close</button></div>
    ${s.reason ? `<p class="muted" style="margin:0">Last exam: ${esc(s.fall || clean(s.reason))}</p>` : ''}
    ${s.allies && s.allies.length ? `<div class="mt-with mt-allies"><span>Allies${s.lodgeA ? ' · ' + esc(s.lodgeA) : ''}</span>${s.allies.map(o => { const n = s.ed === S.edition && cmap(S)[o.id]; return n ? {...o, s: n.status} : o; }).sort((x, y) => (y.s === 'Approved') - (x.s === 'Approved')).map(o => `<a class="mt-wc ${o.s === 'Approved' ? 'hunter' : ['Eliminated', 'Deceased', 'Disqualified'].includes(o.s) ? 'gone' : ''}" data-id="${o.id}">${esc(o.n)}${o.s === 'Deceased' ? ' ✝' : o.s === 'Approved' ? ' ★' : ''}</a>`).join('')}</div>` : ''}
    ${bars ? `<div class="attrs">${bars}</div>` : ''}
    ${lines.length ? `<div class="bulletin">${lines.map(l => `<div class="bl"><i>◆</i><span><span class="muted">${ordinal(l.ed)}</span> ${esc(l.text)}</span></div>`).join('')}</div>` : ''}</div>`);
}
function mtResultHtml(){
  const L = MENTOR.appr.filter(a => a.last && a.last.ed === S.edition); if(!L.length) return '';
  return `<div class="scout sc-res mt-res"><div class="sc-top">${mtChip()}<div class="sc-bar-t"><div class="sc-tline"><b class="sc-title">Your Lodge</b><span class="sc-rank">${mtTitle()}</span></div><span class="muted">How your apprentice${L.length > 1 ? 's' : ''} did</span></div></div>
    ${L.map(a => { const st = a.last.status, ok = st === 'Approved'; return `<div class="sc-row"><a data-id="${a.id}">${esc(a.name)}</a><span class="muted">${ok ? 'Licensed Hunter' : st === 'Deceased' ? 'Died · ' + esc(a.last.reason || '') : st === 'Disqualified' ? 'Disqualified' : 'Out in ' + esc((PHASES[a.last.out] || {}).name || 'the exam') + ' · back next year'}</span><span class="${ok ? 'pos' : st === 'Deceased' ? 'neg' : 'muted'}">${ok ? '+' + fmtJ(MT_GIFT) : ''}</span></div>`; }).join('')}</div>`;
}
function mtRecordHtml(){
  if(MENTOR.off) return `<div><div class="section-h">Your Lodge</div><p class="muted" style="font-size:13px;margin:0">Mentoring is hidden. <button type="button" class="sc-link" data-mton>Show the lodge again</button></p></div>`;
  if(!MENTOR.made) return '';
  const g = MENTOR.appr.filter(a => a.status === 'grad').length, f = MENTOR.appr.filter(a => a.status === 'fallen').length;
  return `<div><div class="section-h">Your Lodge</div><div class="stats" style="margin-bottom:8px"><div class="stat gold"><b>${MENTOR.renown}</b><span>Renown · ${mtTitle()}</span></div><div class="stat"><b>${MENTOR.appr.length}</b><span>Apprentices</span></div><div class="stat"><b>${g}</b><span>Became Hunters</span></div><div class="stat"><b>${f}</b><span>Lost</span></div></div>
    ${mtFormerHtml()}${MENTOR.log.length ? `<div class="bulletin">${MENTOR.log.slice(-8).reverse().map(l => `<div class="bl"><i>◆</i><span><span class="muted">${ordinal(l.ed)}</span> ${esc(l.text)}</span></div>`).join('')}</div>` : ''}</div>`;
}
document.addEventListener('click', e => {
  const t = e.target;
  if(t.closest('[data-mtopen]')){ if(!MENTOR.made){ MENTOR.made = true; mtLog('You opened a lodge for young candidates.'); } MENTOR.open = true; save(); renderPhase(); return; }
  if(t.closest('[data-mtnentab]')){ showTab('nen'); return; }
  if(t.closest('[data-mtclose]')){ MENTOR.open = false; MENTOR.peek = false; save(); renderPhase(); return; }
  if(t.closest('[data-mtpeek]')){ MENTOR.peek = true; MENTOR.open = true; renderPhase(); return; }
  if(t.closest('[data-mtoff]')){ MENTOR.off = true; MENTOR.open = false; save(); renderPhase(); return; }
  if(t.closest('[data-mton]')){ MENTOR.off = false; save(); render(); return; }
  const nn = t.closest('[data-mtnen]'); if(nn){ MENTOR.nen = nn.dataset.mtnen; const v = $('mtName'); if(v) MENTOR.name = v.value.trim(); renderPhase(); return; }
  if(t.closest('[data-mtmake]')){ const v = $('mtName'); MENTOR.name = (v && v.value.trim()) || 'Old Master'; MENTOR.nen = MENTOR.nen || ((typeof NLAB !== 'undefined' && MT_NEN[NLAB.type]) ? NLAB.type : 'Enhancement'); MENTOR.made = true; mtLog(`You, ${MENTOR.name}, opened a lodge for young candidates.`); save(); renderPhase(); return; }
  const rc = t.closest('[data-mtrec]'); if(rc){ mtRecruit(rc.dataset.mtrec); return; }
  const pt = t.closest('[data-mtpt]'); if(pt){ const a = mtOf(pt.dataset.mtpt); if(!a) return; const cp = mtCampFor(a), k = pt.dataset.k, d = +pt.dataset.d;
    if(d > 0 && !mtCanAdd(cp, k)){ if(!mtCanBuy(cp)) return; const cost = mtExtraCost(cp); SCOUT.jenny -= cost; cp.extra = (cp.extra || 0) + 1; cp.spent = (cp.spent || 0) + cost; }
    if(d < 0 && !cp.pts[k]) return;
    cp.pts[k] = Math.max(0, (cp.pts[k] || 0) + d);
    if(d < 0 && cp.extra && mtPtsLeft(cp) > 0){ SCOUT.jenny += 100 * cp.extra; cp.spent -= 100 * cp.extra; cp.extra--; }   // giving a point back refunds the last one you bought
    save(); renderPhase(); return; }
  const ls = t.closest('[data-mtles]'); if(ls){ const a = mtOf(ls.dataset.mtles); if(!a) return; mtCampFor(a).lesson = ls.dataset.k; save(); renderPhase(); return; }
  const cm = t.closest('[data-mtcamp]'); if(cm){ const a = mtOf(cm.dataset.mtcamp), c = a && S.candidates.find(x => x.id === a.id); if(c){ mtApplyCamp(a, c, false); MENTOR.peek = false; save(); render(); } return; }
  const rl = t.closest('[data-mtrel]'); if(rl){ const id = rl.dataset.mtrel, a = mtOf(id); if(!a || S.started && !S.finished) return;
    if(mtRelArm !== id){ mtRelArm = id; renderPhase(); setTimeout(() => { if(mtRelArm === id){ mtRelArm = null; renderPhase(); } }, 4000); return; }
    mtRelArm = null; a.status = 'released'; a.ed = S.edition; mtLog(`You released ${a.name} from your lodge.`); save(); render(); return; }
  if(t.closest('[data-mthint]')){ MENTOR.hintSeen = MENTOR.hintSeen2 = true; save(); mtCtlRender(); return; }
  const pp = t.closest('[data-mtpop]'); if(pp){ if(!MENTOR.hintSeen2){ MENTOR.hintSeen = MENTOR.hintSeen2 = true; save(); } mtPopOpen = mtPopOpen ? null : 'all'; mtCtlRender(); return; }
  const dl = t.closest('[data-mtdil]'); if(dl){ const a = mtOf(dl.dataset.mtdil), k = +dl.dataset.k; const off = a && a.dil && a.dil.choice === k; mtSetChoice(dl.dataset.mtdil, off ? null : k); save(); if(off) renderPhase(); else mtGoIfCalled(); return; }
  const gt = t.closest('[data-mtgo]'); if(gt){ mtPopOpen = null; mtCtlRender(); mtScrollDil(gt.dataset.mtgo); return; }
  if(t.closest('[data-mtself]')){ MENTOR.self = t.closest('[data-mtself]').checked; save(); renderPhase(); return; }
  if(t.closest('.mt-pz')) return;
  const lv = t.closest('[data-live]'); if(lv){ liveDecide(lv.dataset.live, lv.dataset.k); return; }
  const le = t.closest('[data-liveedit]'); if(le){ LIVE_EDIT.add(le.dataset.liveedit); liveStay(); return; }
  const aa = t.closest('[data-mtapall]'); if(aa){ const B = mtBlock(); if(B){ const k = aa.dataset.mtapall, off = mtBlockState(B).all === k; B.forEach(({a}) => { a.ap = off ? null : {ed: S.edition, p: S.phase, k}; }); save(); if(off) renderPhase(); else mtGoIfCalled(); } return; }
  if(t.closest('[data-mtbye]')){ const B = mtByes(); if(B.length){ MENTOR.byeSeen = S.edition + ':' + B[0].e.p; save(); } mtCtlRender(); renderPhase(); return; }
  const sqo = t.closest('[data-sqopen]'); if(sqo){ const id = sqo.dataset.sqopen; SQ_OPEN.has(id) ? SQ_OPEN.delete(id) : SQ_OPEN.add(id); mtCtlRender(); renderPhase(); return; }
  if(t.closest('[data-mtsplit]')){ MENTOR.split = S.edition + ':' + S.phase; save(); mtCtlRender(); renderPhase(); return; }
  if(t.closest('[data-mtjoin]')){ MENTOR.split = null; save(); mtCtlRender(); renderPhase(); return; }
  const ap = t.closest('[data-mtap]'); if(ap){ const a = mtOf(ap.dataset.mtap); if(a){ const off = mtApMine(a, S.phase) === ap.dataset.k; a.ap = off ? null : {ed: S.edition, p: S.phase, k: ap.dataset.k}; save(); if(off) renderPhase(); else mtGoIfCalled(); } return; }
  const po = t.closest('[data-mtpost]'); if(po){ const a = mtOf(po.dataset.mtpost); if(a){ a.posture = po.dataset.k; if(mtHere().length <= 1) mtPopOpen = null; save(); mtCtlRender(); renderPhase(); } return; }
  if(mtPopOpen && !t.closest('.mt-pop') && !t.closest('#bStep,#bAll')){ mtPopOpen = null; mtCtlRender(); }
});
// engine hooks: allies come easier for those told to look for them; caution halves the chance of dying in a duel
generateNen = (S0, c, used) => { const a = MENTOR.appr.find(x => x.id === c.id && x.nen); if(!a) return MT_GEN(S0, c, used); const n = JSON.parse(JSON.stringify(a.nen)); n.mastery = Math.max(n.mastery, 25); n.status = n.mastery < 35 ? 'Awakened' : 'Trained'; return n; };

// ---- a Hatsu that grows out of the person (often, not always: people change)
// each root: where it comes from, the Nen words it can echo, names that say so, the "born from" line, and a vow it may carry
const NEN_ROOTS = [
  ['keep', /compass/, ['Compass','Map','Tracking','Homing'], ["Mother's North", 'True North', 'The Cracked Needle'], "the cracked compass from {their} mother", 'Only works while the user carries the cracked compass'],
  ['keep', /someone else's initials/, ['Blade','Edge','Steel','Name'], ["Someone Else's Initials", 'The Borrowed Blade'], "a knife with someone else's initials", null],
  ['keep', /photo of a house/, ['Portrait','Doll House','Memory','Lantern'], ['The House That Was', 'Address Unknown'], 'a photo of a house that no longer exists', null],
  ['keep', /marble/, ['Sphere','Orb','Luck','Fortune','Bead'], ['Lucky Marble', 'Last Marble Standing'], 'a lucky marble', null],
  ['keep', /letter .*never opened/, ['Secret','Paper','Seal','Ink'], ['The Unopened Letter', 'Return to Sender'], 'a letter {they} never opened', 'The user must never read the letter'],
  ['keep', /guidebook/, ['Book','Rulebook','Map','Ink'], ["Grandfather's Guidebook", 'Chapter Seven, Page Nine'], "{their} grandfather's old Hunter guidebook", null],
  ['keep', /ribbon/, ['Ribbon','Silk','Thread','String'], ["Sister's Ribbon", 'Tied With Care'], 'a ribbon from a sister', 'Only works while the ribbon is tied'],
  ['keep', /pocket watch/, ['Clock','Clockwork','Time','Hourglass','Rewind','Stealing Time','Delaying'], ['The Broken Hour', 'Quarter Past Never'], 'a broken pocket watch', 'Only works while the watch stays stopped'],
  ['keep', /coin from a country/, ['Coin','Debt','Toll','Gold','Bargain'], ['Currency of Nowhere', 'Exchange Rate Zero'], 'a coin from a country that no longer exists', 'The user must pay the target a coin first'],
  ['keep', /whistle carved/, ['Whistle','Bone','Signal','Howl'], ['Bone Whistle', 'Call of the Marrow'], 'a whistle carved from bone', null],
  ['keep', /map with one place/, ['Map','Compass','Tracking','Homing','Maze'], ['The Circled Place', 'X Marks It'], 'a map with one place circled', null],
  ['keep', /lock of someone's hair/, ['Thread','String','Memory','Binding'], ['A Lock of Hair', 'What I Kept of You'], "a lock of someone's hair", null],
  ['keep', /jar of sand/, ['Sand','Mirage','Dust','Hourglass'], ['Sand From Home', 'The Jar on the Shelf'], 'a jar of sand from home', null],
  ['keep', /toy soldier/, ['Puppet','Doll','Marionette','Doll House'], ['The One-Armed Soldier', 'Toy Regiment'], 'a toy soldier missing an arm', null],
  ['keep', /clover/, ['Luck','Fortune','Root','Petal'], ['Fourth Leaf', 'Pressed Luck'], 'a pressed four-leaf clover', null],
  ['keep', /harmonica/, ['Song','Sound','Breath','Music Box','Echo'], ['Dented Harmonica Blues', 'Blues for the Road'], 'a dented harmonica', 'The user must play a note first'],
  ['keep', /fishing line/, ['Fishing Line','String','Thread','Net','Hook'], ['Bracelet of Line', 'The Long Cast'], 'a bracelet made of fishing line', null],
  ['keep', /key that opens nothing/, ['Key','Lock','Door','Locking','Gatekeeping'], ['The Key to Nothing', 'A Door Somewhere'], 'a key that opens nothing {they} know of', 'Only works on something that is locked'],
  ['keep', /wanted poster/, ['Mark','Name','Brand','Tracking'], ['Wanted, Alive', 'Reward Unclaimed'], 'a wanted poster with {their} own face on it', null],
  ['keep', /recipe book/, ['Book','Ink','Tea','Honey','Hunger'], ['Recipes of a Dead Tongue', 'Grandmother Wrote It Down'], 'a recipe book in a dead language', null],
  ['keep', /ring won at a fair/, ['Ring','Luck','Lottery','Fortune'], ['Prize at the Fair', 'Third Throw Lucky'], 'a cheap ring won at a fair', null],
  ['keep', /tooth from the first beast/, ['Fang','Bone','Beast','Hound','Bite','Claw'], ['Tooth of the First Hunt', 'First Blood'], 'a tooth from the first beast {they} hunted', null],
  ['keep', /sealed envelope/, ['Seal','Paper','Secret','Sealing'], ["For the Chairman's Eyes", 'Do Not Open'], 'a sealed envelope addressed to the Chairman', null],
  ['keep', /father forged/, ['Blade','Iron','Steel','Anvil','Edge','Tempering'], ["Father's Forge", 'Hammered True'], 'a small knife {their} father forged', null],
  ['keep', /paper crane/, ['Origami','Paper','Feather','Wing','Flock'], ['A Thousand Cranes', 'The Last Fold'], 'a paper crane folded by a dying friend', 'The user must fold a crane before each use'],
  ['keep', /honey/, ['Honey','Bee','Swarm','Sticking'], ['Honey From Home', 'The Hive Remembers'], 'a jar of honey from home', null],
  ['keep', /pocket mirror/, ['Mirror','Mirror Twin','Reflection','Glass','Mirroring'], ['Cracked Reflection', 'Seven Years'], 'a pocket mirror with a crack', null],
  ['keep', /button off a Hunter's coat/, ['Coat','Mantle','Token','Pin'], ["The Hunter's Button", 'Off the Old Coat'], "the button off a Hunter's coat", null],
  ['keep', /black queen/, ['Chess','Game','Throne','Crown','Gambit'], ['Black Queen', 'Queen Takes All'], 'a chess piece, the black queen', null],
  ['keep', /flute .*cannot play/, ['Flute','Song','Sound','Breath','Lullaby'], ['The Song I Cannot Play', 'Silent Flute'], 'a flute {they} cannot play', null],
  ['keep', /grave/, ['Stone','Granite','Echo of the Dead','Haunting','Memory'], ["Mother's Stone", 'Grave Weight'], "a smooth stone from {their} mother's grave", 'Only works on the anniversary of the day the user\'s mother died'],
  ['keep', /dice/, ['Dice','Luck','Lottery','Wager','Fortune'], ['Always Seven', 'Loaded Fate'], 'a pair of dice that always roll seven', 'The user must roll the dice first'],
  ['keep', /feather from a bird/, ['Feather','Hawk','Owl','Crow','Wing','Flock'], ['The Bird I Raised', 'Fledgling'], 'a feather from a bird {they} raised', null],
  ['keep', /tiny bell/, ['Bell','Chime','Signal'], ['Sleeve Bell', 'Ring Twice'], 'a tiny bell sewn into {their} sleeve', null],
  ['keep', /children's book about Hunters/, ['Book','Paper','Ink','Prophecy','Lullaby'], ['The Last Page', 'Once Upon a License'], "a tattered children's book about Hunters", null],
  ['keep', /teacup/, ['Tea','Porcelain','Lacquer','Shattering'], ['Cracked Teacup Ceremony', 'Steeped'], 'a cracked teacup wrapped in cloth', null],
  ['keep', /train ticket/, ['Ferry','Toll','Calendar','Clockwork'], ['The Train Not Taken', 'Platform Nine, Unused'], 'a train ticket that was never used', null],
  ['talent', /hold .*breath/, ['Breath','Water','Tide','Bubble','Exhale'], ['Four Minutes Under', 'Deep Breath'], 'four minutes without air', 'Only works while the user holds their breath'],
  ['talent', /never gets lost|read any map/, ['Compass','Map','Maze','Homing'], ['Always North', 'Never Lost'], 'a sense of direction that never failed', null],
  ['talent', /footsteps/, ['Echo','Sound','Detection','Eavesdropping'], ['Far Footsteps', 'I Heard You Coming'], 'ears that hear footsteps from far away', null],
  ['talent', /climb/, ['Rope','Spider','Web','Ladder','Claw'], ['Nothing Too High', 'Bare Hands'], 'a life spent climbing', null],
  ['talent', /animal/, ['Beast','Familiar','Taming','Hound','Wolf','Herding','Leash'], ['Friend of Beasts', 'The Pack Follows'], 'a way with animals', null],
  ['talent', /cook/, ['Tea','Honey','Salt','Hunger','Blade','Steam'], ["Chef's Table", 'From Almost Nothing'], 'a cook\'s hands', null],
  ['talent', /reads people/, ['Lens','Eye','Truth-Telling','Questioning','Gaze'], ['Open Book', 'I Know That Look'], 'a talent for reading people', 'The user must look the target in the eye'],
  ['talent', /run all day|keeps going/, ['Step','Sprint','Momentum','Second Wind','Outlasting','Enduring'], ['All Day Long', 'Last One Running'], 'legs that never stop', null],
  ['talent', /traps/, ['Snare','Trapping','Net','Mine'], ['Trap Sense', 'Not That Floor'], 'an eye for traps', null],
  ['talent', /darkness/, ['Shadow','Moon','Owl','Lantern'], ['Eyes for the Dark', 'Lights Out'], 'eyes that see in the dark', 'Only works at night'],
  ['talent', /remembers everything/, ['Memory','Book','Recording','Ink'], ['Total Recall', 'Page and Line'], 'a memory that keeps everything', null],
  ['talent', /talk anyone|makes friends with the guards/, ['Voice','Charming','Command Word','Bargain','Bargaining'], ['Silver Tongue', 'Just Hear Me Out'], 'a tongue that talks anyone into anything', 'The user must speak to the target first'],
  ['talent', /swims/, ['Water','Tide','Shark','Coral','Ripple'], ['Like a Fish', 'Undertow'], 'a swimmer\'s lungs', null],
  ['talent', /loophole/, ['Rulebook','Clause','Contract','Rule-Setting','Covenant'], ['The Loophole', 'Fine Print'], 'a gift for loopholes', 'The user must state the rule out loud'],
  ['talent', /mimic any voice/, ['Voice','Echo','Mimicry','Copying'], ['Borrowed Voice', 'Say It Like Me'], 'a voice that can be anyone\'s', null],
  ['talent', /track anything/, ['Tracking','Hound','Homing','Mark','Marking'], ['Nothing Escapes', 'The Long Trail'], 'a tracker\'s patience', null],
  ['talent', /poisonous plant/, ['Poison','Venom','Thorn','Root','Fungus'], ['Botany of Harm', 'Do Not Eat'], 'a garden of things not to eat', null],
  ['talent', /without making a sound|hide in plain sight/, ['Hush','Silence','Shadow Step','Camouflage','Veil','Disguising'], ['Not a Sound', 'Plain Sight'], 'a habit of not being noticed', null],
  ['talent', /grudge and a rope/, ['Grudge','Rope','Binding','Lasso'], ['Grudge and Rope', 'Tied Up in It'], 'a grudge held as tightly as a rope', null],
  ['talent', /bluff/, ['Lie','Card','Deck','Mask','Wager'], ['Straight Face', 'All In'], 'a face that never gives anything away', null],
  ['talent', /calms any crowd/, ['Calming','Song','Voice','Lullaby'], ['Hush, Now', 'Easy, Everyone'], 'a voice crowds listen to', null],
  ['talent', /learns any game/, ['Game','Chess','Dice','Card','Tournament'], ['One Round Is Enough', 'New Rules'], 'a knack for any game', 'The target must agree to play'],
  ['talent', /storm coming/, ['Storm','Lightning','Cloud','Thunderclap','Static'], ['Storm Tomorrow', 'Feel It in the Bones'], 'bones that feel the storm coming', 'Only works while it is raining'],
  ['talent', /how to fall/, ['Cushioning','Feather','Lightening'], ['Soft Landing', 'The Right Way Down'], 'knowing how to fall', null],
  ['talent', /never forgets a face/, ['Portrait','Mask','Memory','Detection'], ['Never Forget a Face', 'I Know You'], 'a memory for faces', 'The target must know the user\'s name'],
  ['talent', /weak spot/, ['Piercing','Needle','Guard-Breaking','Rending','Pin'], ['The Weak Spot', 'Right There'], 'an eye for the weak spot in anything', null],
  ['origin', /fishing village|whaling|lighthouse|river barge/, ['Tide','Water','Salt','Net','Anchor','Lantern'], ['What the Sea Took', 'Salt in the Blood'], 'a childhood by the water', null],
  ['origin', /desert caravan|salt-mining/, ['Sand','Mirage','Thirst','Salt'], ['Caravan Road', 'Mirage Waltz'], 'years crossing the desert', null],
  ['origin', /monastery/, ['Discipline','Bell','Stance','Calming','Grounding'], ['Monastery Bell', 'Morning Bell'], 'a childhood of monastery bells', null],
  ['origin', /slums/, ['Rust','Soot','Hunger','Smoke'], ['Gutter Born', 'Nothing to Lose'], 'the slums that raised {them}', null],
  ['origin', /circus|theatre/, ['Puppet','Marionette','Stage','Laughter','Rope','Mask'], ['Big Top', 'Final Act'], 'a childhood on the stage', 'The user must announce the act'],
  ['origin', /library/, ['Book','Ink','Paper','Memory'], ['The Stacks', 'Overdue'], 'a childhood among books', null],
  ['origin', /prison town/, ['Chain','Cage','Lock','Key','Sentence','Roll Call'], ['Visiting Hours', 'Lights Out, Cell Block'], 'growing up in a prison town', 'The user must read the target their sentence'],
  ['origin', /casino/, ['Dice','Card','Deck','Wager','Lottery','Luck'], ['The House Always Wins', 'Back Room Odds'], 'a childhood behind a casino', 'Only works if the user names a price beforehand'],
  ['origin', /beekeepers/, ['Bee','Honey','Swarm','Wasp'], ['The Hive', 'Island of Bees'], 'an island of beekeepers', null],
  ['origin', /railway/, ['Clockwork','Iron','Steam','Anchor'], ['Last Train Out', 'Never Stops'], 'a town where the trains never stop', null],
  ['origin', /mining town/, ['Stone','Granite','Cave','Iron','Lantern'], ['Underground', 'Deep Shift'], 'a childhood underground', null],
  ['origin', /restaurant/, ['Tea','Honey','Salt','Hunger','Steam'], ['House Special', 'Order Up'], 'a childhood in a busy kitchen', null],
  ['origin', /guard dogs|ranch/, ['Hound','Leash','Collar','Beast','Herding'], ['Good Dog', 'Heel'], 'a childhood among animals', null],
  ['origin', /fortress town/, ['Wall','Shield','Pillar','Armor','Watchtower'], ['Siege Walls', 'Hold the Gate'], 'growing up under siege', null],
  ['origin', /noble house/, ['Crown','Throne','Name','Pride','Covenant'], ['The Very Long Name', 'Blue Blood'], 'a noble house with a very long name', null]
];
const NEN_MODS = {"Mother's North": ["Compass", "Mother's", ["Cracked", "Northbound", "Faithful"]], "Someone Else's Initials": ["Initials", "a Stranger's", ["Borrowed", "Engraved", "Stolen"]], "The House That Was": ["House", "Childhood", ["Vanished", "Faded", "Lost"]], "Lucky Marble": ["Marble", "a Child's", ["Lucky", "Rolling", "Glass-Eyed"]], "The Unopened Letter": ["Letter", "Unsent", ["Unopened", "Sealed", "Unread"]], "Grandfather's Guidebook": ["Guidebook", "Grandfather's", ["Dog-Eared", "Annotated", "Old"]], "Sister's Ribbon": ["Ribbon", "Sister's", ["Tied", "Knotted", "Faded"]], "The Broken Hour": ["Watch", "Father's", ["Broken", "Stopped", "Late"]], "Currency of Nowhere": ["Coin", "a Lost Country's", ["Worthless", "Foreign", "Last"]], "Bone Whistle": ["Whistle", "the Marrow's", ["Carved", "Hollow", "Shrill"]], "The Circled Place": ["Map", "the Traveller's", ["Circled", "Folded", "Marked"]], "A Lock of Hair": ["Lock", "a Beloved's", ["Kept", "Braided", "Silver"]], "Sand From Home": ["Sand", "Home's", ["Bottled", "Warm", "Shifting"]], "The One-Armed Soldier": ["Soldier", "a Toy's", ["One-Armed", "Tin", "Last-Standing"]], "Fourth Leaf": ["Clover", "Spring's", ["Pressed", "Four-Leaf", "Lucky"]], "Dented Harmonica Blues": ["Harmonica", "the Road's", ["Dented", "Wailing", "Rusty"]], "Bracelet of Line": ["Line", "the Fisher's", ["Knotted", "Taut", "Silver"]], "The Key to Nothing": ["Key", "Nobody's", ["Lockless", "Spare", "Nameless"]], "Wanted, Alive": ["Poster", "the Outlaw's", ["Wanted", "Torn", "Unclaimed"]], "Recipes of a Dead Tongue": ["Recipe", "Grandmother's", ["Forgotten", "Spiced", "Secret"]], "Prize at the Fair": ["Ring", "the Fair's", ["Cheap", "Prize", "Brass"]], "Tooth of the First Hunt": ["Tooth", "the First Beast's", ["First", "Broken", "Savage"]], "For the Chairman's Eyes": ["Envelope", "the Chairman's", ["Sealed", "Urgent", "Unopened"]], "Father's Forge": ["Forge", "Father's", ["Hammered", "Tempered", "Red-Hot"]], "A Thousand Cranes": ["Crane", "a Dying Friend's", ["Folded", "Paper", "Thousandth"]], "Honey From Home": ["Honey", "the Hive's", ["Golden", "Sweet", "Wild"]], "Cracked Reflection": ["Mirror", "the Pocket's", ["Cracked", "Silver", "Two-Faced"]], "The Hunter's Button": ["Button", "an Old Hunter's", ["Brass", "Loose", "Last"]], "Black Queen": ["Queen", "the Board's", ["Black", "Sacrificed", "Cornered"]], "The Song I Cannot Play": ["Flute", "a Silent", ["Unplayed", "Hollow", "Wordless"]], "Mother's Stone": ["Stone", "Mother's", ["Smooth", "Grave", "Cold"]], "Always Seven": ["Dice", "the Gambler's", ["Loaded", "Lucky", "Weighted"]], "The Bird I Raised": ["Bird", "a Fledgling's", ["Hand-Raised", "Homing", "Feathered"]], "Sleeve Bell": ["Bell", "the Sleeve's", ["Tiny", "Sewn", "Tinkling"]], "The Last Page": ["Storybook", "a Child's", ["Tattered", "Last", "Dog-Eared"]], "Cracked Teacup Ceremony": ["Teacup", "the Ceremony's", ["Cracked", "Steeped", "Porcelain"]], "The Train Not Taken": ["Ticket", "the Departed's", ["Unused", "One-Way", "Punched"]], "Four Minutes Under": ["Breath", "the Deep's", ["Held", "Drowned", "Last"]], "Always North": ["North", "the Wanderer's", ["True", "Unerring", "Fixed"]], "Far Footsteps": ["Footsteps", "a Stranger's", ["Distant", "Quiet", "Approaching"]], "Nothing Too High": ["Summit", "the Climber's", ["Sheer", "Bare-Handed", "Vertical"]], "Friend of Beasts": ["Beast", "the Pack's", ["Tamed", "Loyal", "Wild"]], "Chef's Table": ["Feast", "the Chef's", ["Simmering", "Seasoned", "Hungry"]], "Open Book": ["Face", "a Liar's", ["Open", "Readable", "Telling"]], "All Day Long": ["Road", "the Runner's", ["Endless", "Tireless", "Long"]], "Trap Sense": ["Trap", "the Hunter's", ["Sprung", "Hidden", "Disarmed"]], "Eyes for the Dark": ["Dark", "the Night's", ["Moonless", "Pitch", "Starless"]], "Total Recall": ["Memory", "the Archive's", ["Perfect", "Indexed", "Unforgetting"]], "Silver Tongue": ["Tongue", "the Talker's", ["Silver", "Honeyed", "Persuasive"]], "Like a Fish": ["Current", "the River's", ["Undertow", "Deep", "Rushing"]], "The Loophole": ["Loophole", "the Lawyer's", ["Fine-Print", "Hidden", "Legal"]], "Borrowed Voice": ["Voice", "Someone Else's", ["Borrowed", "Mimicked", "Second"]], "Nothing Escapes": ["Trail", "the Tracker's", ["Cold", "Long", "Fresh"]], "Botany of Harm": ["Garden", "the Poisoner's", ["Bitter", "Deadly", "Blooming"]], "Not a Sound": ["Silence", "the Ghost's", ["Unseen", "Hushed", "Soundless"]], "Grudge and Rope": ["Grudge", "an Old", ["Knotted", "Unforgiving", "Tight"]], "Straight Face": ["Bluff", "the Gambler's", ["Straight", "Poker", "Stone"]], "Hush, Now": ["Crowd", "the Peacemaker's", ["Calmed", "Quiet", "Gathered"]], "One Round Is Enough": ["Game", "the Player's", ["New", "Fair", "Rigged"]], "Storm Tomorrow": ["Storm", "Tomorrow's", ["Coming", "Distant", "Brewing"]], "Soft Landing": ["Fall", "the Acrobat's", ["Soft", "Graceful", "Long"]], "Never Forget a Face": ["Face", "a Stranger's", ["Remembered", "Familiar", "Unforgotten"]], "The Weak Spot": ["Seam", "the Armor's", ["Weak", "Hidden", "Last"]], "What the Sea Took": ["Sea", "the Tide's", ["Salt", "Drowned", "Winter"]], "Caravan Road": ["Caravan", "the Desert's", ["Drifting", "Dusty", "Endless"]], "Monastery Bell": ["Bell", "the Monastery's", ["Morning", "Tolling", "Still"]], "Gutter Born": ["Gutter", "the Slum's", ["Rusted", "Hungry", "Back-Alley"]], "Big Top": ["Circus", "the Ringmaster's", ["Painted", "Grand", "Travelling"]], "The Stacks": ["Library", "the Archivist's", ["Overdue", "Hushed", "Dusty"]], "Visiting Hours": ["Cell", "the Warden's", ["Locked", "Barred", "Solitary"]], "The House Always Wins": ["House", "the Dealer's", ["Rigged", "Lucky", "High-Stakes"]], "The Hive": ["Hive", "the Queen's", ["Buzzing", "Golden", "Swarming"]], "Last Train Out": ["Train", "the Station's", ["Last", "Night", "Runaway"]], "Underground": ["Mine", "the Miner's", ["Deep", "Dark", "Collapsed"]], "House Special": ["Kitchen", "the Cook's", ["Busy", "Burnt", "Midnight"]], "Good Dog": ["Hound", "the Kennel's", ["Loyal", "Barking", "Faithful"]], "Siege Walls": ["Wall", "the Garrison's", ["Besieged", "Unbroken", "Last"]], "The Very Long Name": ["Name", "the House's", ["Noble", "Very Long", "Inherited"]]};
// a modular name: the root's own words, the Nen word it echoes, and the shared poetic vocabulary
function nenRootName(R1, w, r){
  const M = NEN_MODS[R1.names[0]], pk = L => L[Math.floor(r() * L.length)];
  if(!M || r() < 0.25) return pk(R1.names).replace('{W}', w);
  const [o, who, adj] = M, N = pk(NEN_NOUN), A = pk(adj), W = w || o;
  return pk([`${who} ${W}`, `${o} ${N}`, `${N} of the ${A} ${o}`, `The ${A} ${W}`, `${A} ${o} ${N}`, `${W} for ${who.replace(/'s$/, '')}`, `${who} ${N}`, `${A} ${W}`])
    .replace(/^the the /i, 'The ').replace(/ a the /, ' the ').replace(/^([a-z])/, x => x.toUpperCase());
}
function nenRoots(c){
  const out = [], b = typeof background === 'function' ? background(c) : null; if(!b) return out;
  const txt = {keep: BG.keep[b.keep], talent: (BG.talent[b.talent] || [''])[0], origin: (BG.origin[b.origin] || [''])[0]};
  NEN_ROOTS.forEach(r => { if(r[1].test(txt[r[0]] || '')) out.push({src: r[0], words: r[2], names: r[3], born: r[4], vow: r[5]}); });
  if(c.avenge) out.push({src: 'avenge', words: ['Grudge','Debt','Chain','Binding','Oath','Promise','Fate-Sealing'], names: [`For ${c.avenge.hunter.split(' ')[0]}`, 'The Debt Unpaid'], born: `the Hunter {they} came to avenge`, vow: 'Only works against the one who wronged the user'});
  if(c.nick && /^the [A-Z][a-z]+( [A-Z][a-z]+)?$/.test(c.nick) && !/\b(Upset|Lucky|Lost|Late|Quiet|Unseen|Kind|Brave)$/.test(c.nick) && makeRng(nhash(c.id + ':nk') >>> 0)() < 0.35) out.push({src: 'nick', words: null, names: [`${c.nick.replace(/^the /i, '').replace(/^./, x => x.toUpperCase())}'s {W}`], born: `the name the exam gave {them}: ${c.nick}`, vow: null});
  return out;
}
// children of Hunters come of age and register: they arrive as Elite, with their parents' names on everyone's lips
function heirsEnter(S){
  const H = WORLD.heirs || [], ed = S.edition, used = new Set(S.log.flatMap(e => e.ids || []));
  const pick = H.filter(k => !k.entered && !k.never && ed - k.born >= 12 && ed - k.born <= 22).filter(k => {
    const age = ed - k.born; if(age === 22 && Math.random() < 0.4){ k.never = true; return false; }   // some choose another life
    return Math.random() < 0.08 + (age - 12) * 0.03;
  }).slice(0, 2);
  pick.forEach(k => {
    const c = S.candidates.find(x => x.status === 'Active' && !x.fam && !x.heir && attemptsOf(x) <= 1 && !used.has(x.id) && !x.secret && !mtOf(x.id) && !isFav(x.id) && x.tier !== 'Elite'); if(!c) return;
    const P = k.parents.map(hLic).filter(Boolean), age = ed - k.born;
    c.name = k.name; c.first = k.first; c.gender = k.gender; c.age = age; c.tier = 'Elite';
    Object.keys(c.a).forEach(a => { const pv = P.map(h => (h.attrs && h.attrs[a]) || 60), avg = pv.reduce((s, x) => s + x, 0) / Math.max(1, pv.length);
      c.a[a] = clamp(Math.round(avg * 0.55 + 34 + (Math.random() - 0.5) * 16 - Math.max(0, 16 - age) * 1.5), 35, 97); });
    c.heir = {kid: k.id, parents: k.parents}; k.entered = ed; k.cid = c.id;
    const pn = P.map(h => h.name).join(' and '), alive = P.filter(h => hActive(h));
    c.notes.unshift({p: 0, text: `Child of Hunter${P.length > 1 ? 's' : ''} ${pn}`});
    // following a parent means following the child; the Herald announces them
    if(P.some(h => isFav(h.cid))){ FAV[c.id] = c.name; try{ updateFavCss(); }catch(e){} }
    log(S, 0, 'heir', pickR([`${c.name}, child of Hunter${P.length > 1 ? 's' : ''} ${pn}, registers for the exam at ${age}. Every examiner already knows the name.`, `The child of ${pn} is here: ${c.name}, ${age}. Some candidates ask for an autograph. Others ask for a fight.`]) + (alive.length ? ` ${alive.map(h => h.name.split(' ')[0]).join(' and ')} watch${alive.length === 1 ? 'es' : ''} from the crowd.` : P.length > 1 ? ' Neither parent lived to see it.' : ` ${P[0] ? P[0].name.split(' ')[0] : 'The parent'} did not live to see it.`), [c.id]);
    // an old feud passes down: the child of a parent's rival is here too
    S.candidates.filter(o => o !== c && o.heir).forEach(o => {
      const feud = P.some(h => (o.heir.parents || []).some(l => { const x = hLic(l); return x && ((h.rivals || []).includes(x.cid) || (x.rivals || []).includes(h.cid) || (h.log || []).some(e => e.k === 'rival' && e.text.includes(x.name))); }));
      if(feud){ (c.grudges = c.grudges || []).push({id: o.id, name: o.name, why: 'their parents never settled it'}); (o.grudges = o.grudges || []).push({id: c.id, name: c.name, why: 'their parents never settled it'}); }
    });
  });
}
// a special exam's opening lines (flagged when logged; exams started before the flag are recognised by their words)
// alliance notes from one trial fold into one line: "Formed X with A and B"
function foldAllyNotes(L){
  const G = {}, out = [];
  L.forEach(n => { const t = n.text; let m = t.match(/^(Formed|Joined) (.+?) with (.+)$/), k, who, verb;
    if(m){ verb = m[1]; k = m[2]; who = m[3]; } else if((m = t.match(/^(.+?) joined (.+)$/)) && !/^(After|Day)/.test(t)){ verb = null; k = m[2]; who = m[1]; } else { out.push(n); return; }
    if(!G[k]){ G[k] = {n: {...n}, verb, who: []}; out.push(G[k].n); } if(verb === 'Formed' || (verb && !G[k].verb)) G[k].verb = verb; if(!G[k].who.includes(who)) G[k].who.push(who); });
  Object.entries(G).forEach(([k, g]) => { const w = g.who.length > 1 ? g.who.slice(0, -1).join(', ') + ' and ' + g.who[g.who.length - 1] : g.who[0]; g.n.text = g.verb ? `${g.verb} ${k} with ${w}` : `${w} joined ${k}`; });
  return out;
}
// what a trial tests: one quiet line under its description
const phTests = ph => ph && ph.w ? `<div class="ph-tests">Tests ${Object.keys(ph.w).map(x => ATTR_LABEL[x]).join(' · ')}</div>` : '';
