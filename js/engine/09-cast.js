/* ---------- The cast of an exam: who the story keeps coming back to ----------
   Every logged moment gives its people a little spotlight; the brightest 6–8 still in the exam are "the cast".
   The cast is picked more often for the next set pieces, the next scenes remember what already happened to them
   (an injury, a debt, a grudge, a name, something they found), and between trials the camp cuts back to them.
   Small scenes of another kind live here too: silly moments, finds and wanderings, the jokes of the camp. */
const CAST_N = 8;
const SPOT_W = {event: 2, story: 1, bond: 3, betray: 3, sabot: 3, arc: 2, rival: 2, rescue: 2, heir: 3, secret: 3, major: 2, family: 1, duel: 1, fight: 1.5, ally: 0.3, help: 0.6, veteran: 0.5};
// called from log() and dlog() for every line written to the exam log
function castNote(S, e){
  if(!S || !e || e.d || !e.ids || !e.ids.length || e.type === 'phase') return;
  const w = (SPOT_W[e.type] || 0.5) + (e.dr ? e.dr / 4 : 0) + (/“|"/.test(e.text) ? 1 : 0), M = S.spot = S.spot || {};
  e.ids.slice(0, 2).forEach((id, i) => { M[id] = (M[id] || 0) + (i ? w * 0.7 : w); });
}
const castSet = S => new Set((S.castNow || []));
// at the start of each trial: the light fades a little, and the cast is drawn again (those still standing keep their place)
function castPhase(S, p, active){
  if(p === 0) return;   // the first cast is drawn after the first trial, from the people it showed (castIntro)
  const M = S.spot = S.spot || {}; Object.keys(M).forEach(k => { M[k] *= 0.85; });
  const live = new Set(active.map(c => c.id)), keep = (S.castNow || []).filter(id => live.has(id));
  const rest = active.filter(c => !keep.includes(c.id) && (M[c.id] || 0) >= 3).sort((a, b) => (M[b.id] || 0) - (M[a.id] || 0));
  const fam = {}, m = cmap(S); keep.forEach(id => { const f = m[id] && m[id].fam; if(f) fam[f] = (fam[f] || 0) + 1; });
  const add = rest.filter(c => { if(!c.fam) return true; if((fam[c.fam] || 0) >= 2) return false; fam[c.fam] = (fam[c.fam] || 0) + 1; return true; });   // no family takes over the cast
  S.castNow = keep.concat(add.slice(0, Math.max(0, CAST_N - keep.length)).map(c => c.id));
  S.castEver = S.castEver || [];
  S.castNow.forEach(id => { if(!S.castEver.some(x => x.id === id) && S.castEver.length < 60) S.castEver.push({id, p}); });
}
const castW = c => S_CUR && S_CUR.castNow && S_CUR.castNow.includes(c.id) ? 9 : 1;
// a scene that remembers: one short aside, at most one of each kind per person per exam
function castCallback(S, p, rng, ...who){
  const cs = castSet(S); if(!cs.size) return '';
  for(const c of who){
    if(!c || !cs.has(c.id) || rng() >= 0.3) continue;
    const F = c.first || c.name.split(' ')[0], P = PR(c), used = c.cbk = c.cbk || [], m = cmap(S), opts = [];
    if(c.injury && c.injury.p < p) opts.push(['inj', `(${F} is still nursing the ${c.injury.w} from ${thePhase(c.injury.from)}.)`]);
    if(c.debt && m[c.debt.to] && m[c.debt.to].status === 'Active') opts.push(['debt', `(${F} still owes ${m[c.debt.to].first || c.debt.name} for ${thePhase(c.debt.from)}.)`]);
    const g = (c.grudges || []).find(x => m[x.id] && m[x.id].status === 'Active'); if(g) opts.push(['grudge', `(${F} has not forgotten what ${m[g.id].first || g.name} did.)`]);
    const b = (c.bonds || []).map(x => m[x.id]).find(x => x && x.status === 'Active'); if(b) opts.push(['bond', `(${b.first || b.name} is never far from ${F}.)`]);
    if(c.nick) opts.push(['nick', `("${c.nick}", they call ${F} now.)`]);
    if(c.find) opts.push(['find', `(${F} still has ${c.find.w}.)`]);
    const ok = opts.filter(o => !used.includes(o[0])); if(!ok.length) continue;
    const o = ok[Math.floor(rng() * ok.length)]; used.push(o[0]); return ' ' + o[1];
  }
  return '';
}
/* ---------- small scenes ---------- */
// finds: something picked up now that may matter later
const FINDS = [
  {w: 'a coil of old rope', t: o => `${o.a.name} finds a coil of old rope ${o.at}, left by some earlier candidate, and loops it over ${o.P.their} shoulder.`, pay: o => `The rope ${o.a.first} picked up in ${o.from} gets ${o.P.them} up a ledge nobody else can reach.`, phys: true},
  {w: 'a hand-drawn map', t: o => `Under a loose stone ${o.at}, ${o.a.name} finds a map of the trial, drawn by someone who clearly failed it.`, pay: o => `${o.a.first} checks the failed candidate's map from ${o.from}. It is wrong in exactly the right places.`},
  {w: 'a smooth black stone', t: o => `${o.a.name} pockets a smooth black stone ${o.at}. It hums when nobody is listening.`, pay: o => `The black stone from ${o.from} grows warm in ${o.a.first}'s pocket a second before the trouble starts. ${o.P.They} ${o.P.are} already moving.`},
  {w: 'an old Hunter\'s badge', t: o => `${o.a.name} digs an old Hunter's badge out of the mud ${o.at}. The name on it has been scratched off.`, pay: o => `${o.a.first} rubs the nameless badge from ${o.from} for luck. Whether it works or not, ${o.P.they} do${o.P.es} better than anyone expected.`},
  {w: 'a tin of last year\'s supplies', t: o => `${o.a.name} finds a tin of supplies left by last year's candidates: dried fish, matches and a note that says "good luck".`, pay: o => `The dried fish ${o.a.first} found in ${o.from} is the only food ${o.P.they} ha${o.P.s === 's' ? 's' : 've'} left when it counts.`},
  {w: 'a whistle carved from bone', t: o => `${o.a.name} finds a whistle carved from bone ${o.at} and, against all advice, blows it. Nothing happens. Yet.`, pay: o => `${o.a.first} blows the bone whistle from ${o.from}. Something in the distance answers, and the beasts around ${o.P.them} scatter.`, phys: true}
];
const DISCOVER = [
  o => `${o.a.name} spots a shortcut ${o.at} that no map shows, and keeps it to ${o.P.themselves}.`,
  o => `${o.a.name} and ${o.b.name} stumble on the bones of a beast nobody can name. They agree never to mention it.`,
  o => `${o.a.name} finds the Association's crest carved into a tree ${o.at}. The tree is older than the Association.`,
  o => `${o.a.name} follows a strange bird for twenty minutes and comes back with a perfect egg and no idea where the others went.`,
  o => `${o.a.name} discovers a hot spring ${o.at} and loses half an hour to it. Worth it, ${o.P.they} say${o.P.s}.`,
  o => `${o.a.name} finds a ring of footprints ${o.at} that start nowhere and end nowhere. ${o.b.name} decides not to look closer.`,
  o => `${o.a.name} works out that the examiner's markers, read backwards, spell a word. Nobody believes ${o.P.them}.`,
  o => `${o.a.name} climbs the tallest thing nearby to get a sense of the land, and comes down with a nosebleed and a very good idea.`,
  o => `${o.a.name} and ${o.b.name} find a door in a hillside ${o.at}. It is locked. They knock anyway. Something knocks back.`
];
const FUNNY = [
  o => `${o.a.name} tries to bribe ${o.ex} with half a sandwich. ${o.ex} takes the sandwich.`,
  o => `${o.a.name} falls asleep standing up during the briefing and wakes up already walking.`,
  o => `${o.a.name} and ${o.b.name} argue for an hour over whether a frog counts as a beast. Nobody wins.`,
  o => `${o.a.name} introduces ${o.P.themselves} to ${o.b.name} for the third time today.`,
  o => `${o.a.name}'s stomach growls so loudly in the silence that ${o.b.name} reaches for a knife.`,
  o => `${o.a.name} ${o.quirk}. ${o.b.name} has started doing it too, and is annoyed about it.`,
  o => `${o.a.name} loses a boot, finds a better boot, and does not ask whose it was.`,
  o => `Somebody keeps leaving tiny stacks of pebbles outside ${o.a.name}'s tent. ${o.a.first} is starting to take it personally.`,
  o => `${o.a.name} gives a stirring speech to nobody in particular. ${o.g} applaud, a little sarcastically.`,
  o => `${o.a.name} counts the candidates out loud, twice, and gets two different numbers. Both are wrong.`,
  o => `${o.a.name} names a passing beetle "Examiner" and talks to it for the rest of the day.`,
  o => `${o.a.name} shares a secret family recipe with ${o.b.name}. It is boiled rice.`,
  o => `${o.a.name} sneezes in the middle of ${o.ex}'s instructions, and ${o.ex} starts again from the beginning. Everyone glares.`,
  o => `${o.a.name} spends the evening teaching ${o.g} a card game whose rules change every round.`,
  o => `${o.a.name} and ${o.b.name} map the area by moonlight and end up with a very good drawing of a horse.`,
  o => `${o.a.name} reads a lost candidate's diary aloud to the camp. The candidate is not lost. The candidate is sitting right there.`
];
// the camp cuts back to someone in the cast, as they are now
function castCut(S, c, m){
  const F = c.first || c.name.split(' ')[0], P = PR(c), o = [];
  if(c.injury) o.push(`Meanwhile, ${F} re-wraps the ${c.injury.w} alone and waves off anyone who offers to help.`);
  if(c.debt && m[c.debt.to] && m[c.debt.to].status === 'Active') o.push(`Meanwhile, ${F} keeps one eye on ${m[c.debt.to].first || c.debt.name}, waiting for a chance to settle what ${P.they} owe${P.s}.`);
  const g = (c.grudges || []).find(x => m[x.id] && m[x.id].status === 'Active'); if(g) o.push(`Meanwhile, ${F} watches ${m[g.id].first || g.name} across the fire and does not blink first.`);
  const b = (c.bonds || []).map(x => m[x.id]).find(x => x && x.status === 'Active'); if(b) o.push(`Meanwhile, ${F} and ${b.first || b.name} split their last ration without a word.`);
  if(c.nick) o.push(`Meanwhile, ${F} hears someone call ${P.them} "${c.nick}" and pretends not to like it.`);
  if(c.find) o.push(`Meanwhile, ${F} turns ${c.find.w} over in ${P.their} hands again.`);
  if(c.alliance){ const A = (S.alliances || []).find(x => x.id === c.alliance); if(A && A.name) o.push(`Meanwhile, ${A.name} close ranks around ${F}.`); }
  return o;
}
function lightEvents(S, ph, p, rng, active){
  if(ph.final || active.length < 6) return;
  const m = cmap(S), cs = castSet(S), at = atPhase(ph.name), ex = ph.ex ? ph.ex.name : 'the examiner';
  const pick = (pool, not) => { const arr = pool.filter(c => !not.includes(c)); if(!arr.length) return null; const tot = arr.reduce((s, c) => s + (cs.has(c.id) ? 4 : 1), 0); let r = rng() * tot; for(const c of arr){ r -= cs.has(c.id) ? 4 : 1; if(r <= 0) return c; } return arr[arr.length - 1]; };
  const o = (a, b, g) => ({a, b, at, ex, P: PR(a), g: g ? gNames(g) : '', quirk: a.quirk != null ? pro(QUIRKS[a.quirk] || 'hums the same three notes all day', a) : 'hums the same three notes all day'});
  // something found earlier pays off
  active.filter(c => c.find && c.find.p < p && (!c.find.phys || PHYSICAL.has(ph.id))).slice(0, 2).forEach(c => {
    if(rng() >= 0.35) return; const F = FINDS.find(x => x.w === c.find.w) || FINDS[0];
    dlog(S, p, 'event', F.pay({a: c, P: PR(c), from: thePhase(c.find.from)}), [c.id], 5); c.pmod = (c.pmod || 0) + 3; c.notes.push({p, text: `Used ${c.find.w} found in ${thePhase(c.find.from)}`}); delete c.find; });
  // a find or a wander
  if(rng() < 0.55){ const a = pick(active, []); if(a){
    if(!a.find && rng() < 0.45){ const F = FINDS[Math.floor(rng() * FINDS.length)]; a.find = {w: F.w, p, from: ph.name, phys: !!F.phys}; const t = F.t(o(a)); dlog(S, p, 'event', t, [a.id], 4); a.notes.push({p, text: t}); }
    else { const b = pick(active, [a]), f = DISCOVER[Math.floor(rng() * DISCOVER.length)], t = f(o(a, b || a)); if(/\$\{o\.b|o\.b\.name/.test(f.toString()) && !b) return; dlog(S, p, 'event', t, b && t.includes(b.name) ? [a.id, b.id] : [a.id], 3); if(/shortcut/.test(t)) a.pmod = (a.pmod || 0) + 3; if(/hot spring/.test(t)) a.fatigue = Math.max(0, (a.fatigue || 0) - 10); } } }
  // a joke at the camp
  if(rng() < 0.7){ const a = pick(active, []), b = a && pick(active, [a]); if(a && b){ const g = []; for(let i = 0; i < 3; i++){ const x = pick(active, [a, b].concat(g)); if(x) g.push(x); }
    const t = FUNNY[Math.floor(rng() * FUNNY.length)](o(a, b, g.length >= 2 ? g : [b])), ids = [a.id].concat(t.includes(b.name) ? [b.id] : []).concat(g.filter(x => t.includes(x.name)).map(x => x.id));
    dlog(S, p, 'story', t, ids, 3); } }
  // the camp cuts back to someone in the cast
  if(p > 0 && cs.size && rng() < 0.75){ const c = m[[...cs][Math.floor(rng() * cs.size)]]; if(c && c.status === 'Active'){ const L = castCut(S, c, m), used = c.cut = c.cut || []; const ok = L.filter(t => !used.includes(t.slice(10, 30))); if(ok.length){ const t = ok[Math.floor(rng() * ok.length)]; used.push(t.slice(10, 30)); dlog(S, p, 'story', t, [c.id], 3); } } }
}
// when someone in the cast falls, they get a card of their own: how it ended, and what they leave unfinished
// (two cards a trial at most, for the ones the story followed longest)
function castFalls(S, ph, p){
  const m = cmap(S), moments = id => S.log.filter(e => !e.d && e.type !== 'phase' && e.type !== 'castout' && (e.ids || []).includes(id)).length;
  const out = (S.castNow || []).map(id => m[id]).filter(c => c && c.out === p && ['Eliminated', 'Deceased', 'Disqualified'].includes(c.status) && !c.castOut)
    .map(c => ({c, n: moments(c.id)})).filter(x => x.n >= 5).sort((a, b) => b.n - a.n).slice(0, 2);
  out.forEach(({c, n}) => {
    c.castOut = p;
    const P = PR(c), how = (c.fall || (c.reason || '').replace(/^[^:]+:\s*/, '') || 'out').replace(/\.$/, ''), ids = [c.id], left = [];
    const b = (c.bonds || []).map(x => m[x.id]).find(x => x && (x.status === 'Active' || x.status === 'Finalist' || x.status === 'Approved'));
    if(c.debt && m[c.debt.to] && (!b || b.id !== c.debt.to)){ left.push(`a debt to ${m[c.debt.to].name} from ${thePhase(c.debt.from)} that will never be paid`); ids.push(c.debt.to); }
    const g = (c.grudges || []).find(x => m[x.id] && m[x.id].status === 'Active'); if(g){ left.push(`a grudge against ${m[g.id].name}, unsettled`); ids.push(g.id); }
    if(c.find) left.push(`${c.find.w}, never used`);
    const nick = c.nick ? `, "${c.nick}",` : '';
    const head = c.status === 'Deceased' ? `${c.name}${nick} dies ${atPhase(ph.name)}.` : `The exam ends for ${c.name}${nick} ${atPhase(ph.name)}.`;
    const bond = b && !how.includes(b.name) ? ` ${b.name} goes on without ${P.them}.` : '';
    if(b) ids.push(b.id);
    const tail = left.length ? ` ${P.They} leave${P.s} behind ${andList(left.slice(0, 2))}.` : '';
    dlog(S, p, 'castout', `${head} ${how.charAt(0).toUpperCase() + how.slice(1)}.${bond}${tail} ${n} moments this exam.`, ids, 8);
  });
}

// the opening cast: the people the first trial's report puts in front of the reader, in the order it shows them
// (the five visible cards of "What happened", then the camp, then the rest), as long as they made it through
const CAST_HIDE = new Set(['phase', 'examiner', 'fav', 'ally', 'betray', 'help', 'split', 'family', 'team', 'rescue', 'veteran', 'duel', 'fight', 'info', 'elim']);
function castIntro(S, p){
  const m = cmap(S), all = S.log.filter(e => e.p === p && !e.d && !CAST_HIDE.has(e.type)), ev = all.filter(e => (e.ids || []).length);   // lines without people still take a card on screen
  const mo = typeof momentOf === 'function' ? momentOf(S.log.filter(e => e.p === p)) : null;   // the moment of the trial comes first: it is what the reader sees first
  const hiAll = all.filter(e => e.type !== 'story' && e.type !== 'bond' && e !== mo), hi = hiAll.filter(e => (e.ids || []).length), shown = hiAll.slice(0, 5).filter(e => (e.ids || []).length), order = (mo && (mo.ids || []).length ? [mo] : []).concat(shown, ev.filter(e => e.type === 'story' && e !== mo), hi.filter(e => !shown.includes(e)), ev.filter(e => e.type === 'bond' && e !== mo));
  // variety: one kind of scene cannot fill the cast (old rivalries open almost every exam); a second pass fills any gap
  const seen = new Set(), fam = {}, kind = {}, L = [], CAP = {rival: 2, sabot: 1, secret: 2, heir: 2, story: 3, event: 3};
  const take = capped => order.forEach(e => { const k = e.type, ids = e.ids.slice(0, 2).filter(id => !seen.has(id));
    ids.forEach(id => { const c = m[id]; if(!c || seen.has(id) || c.status !== 'Active' || L.length >= CAST_N) return;
      if(capped && (kind[k] || 0) >= (CAP[k] || 2)) return;
      if(c.fam && (fam[c.fam] || 0) >= 2) return;
      seen.add(id); if(c.fam) fam[c.fam] = (fam[c.fam] || 0) + 1; kind[k] = (kind[k] || 0) + 1; L.push(c); }); });
  take(true); if(L.length < CAST_N) take(false);
  const pos = c => order.findIndex(e => e.ids.slice(0, 2).includes(c.id)); L.sort((a, b) => pos(a) - pos(b));   // listed in the order the report shows them
  S.castNow = L.map(c => c.id); S.castEver = L.map(c => ({id: c.id, p}));
}
