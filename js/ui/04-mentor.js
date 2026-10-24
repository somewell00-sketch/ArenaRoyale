/* ===================== MENTOR'S LODGE: sponsor an apprentice, train them between exams, set their posture in each phase ===================== */
const mentorFix = m => Object.assign({made: false, off: false, open: false, name: '', nen: null, renown: 0, appr: [], log: [], pool: null}, m || {});
let MENTOR = mentorFix();
const MT_GEN = generateNen;
// sponsoring is priced by how good the candidate already is: an Ordinary kid is cheap, an Elite costs a fortune
const MT_TIER_FEE = {Ordinary: 100, Trained: 250, Skilled: 500, Elite: 1000};
const mtFeeOf = c => MT_TIER_FEE[c && c.tier] || 300;
const MT_FEE = 300, MT_POINTS = 7, MT_GIFT = 600, MT_AWAKEN = 8;
const MT_TRACKS = [
  {k: 'body', l: 'Body', a: ['strength', 'speed', 'endurance', 'agility', 'combat'], d: 'Strength, speed, endurance, agility, combat'},
  {k: 'mind', l: 'Mind', a: ['intelligence', 'perception', 'strategy'], d: 'Intelligence, perception, strategy'},
  {k: 'spirit', l: 'Spirit', a: ['determination', 'courage', 'charisma', 'teamwork'], d: 'Determination, courage, charisma, teamwork'}
];
const mtTracks = a => MT_TRACKS;
// your Nen type gives you a signature lesson: always on offer, and it works better when you teach it
const MT_SIG = {Enhancement: 'dirty', Transmutation: 'wild', Emission: 'grit', Conjuration: 'mind', Manipulation: 'read', Specialization: 'nerve'};
// Nen is taught along the hexagon: a mentor teaches its own type fastest, neighbours well, the opposite type slowly
const MT_NEN = {Enhancement: 'Hits hardest in fights and on Zevil Island', Transmutation: 'Shines in dangerous crossings', Emission: 'Strongest in physical trials',
  Conjuration: 'Sharpest in tests of wits', Manipulation: 'Best in team trials, makes allies easily', Specialization: 'A big edge in one kind of trial, different every exam'};
const MT_NEN_K = {Enhancement: 'fight', Transmutation: 'danger', Emission: 'body', Conjuration: 'wits', Manipulation: 'team'};
const mtHexD = (a, b) => { const i = NEN_CATS.indexOf(a), j = NEN_CATS.indexOf(b), d = Math.abs(i - j); return Math.min(d, 6 - d); };
const mtTeach = a => a.latent && MENTOR.nen ? [1.5, 1.25, 1, 0.75][mtHexD(MENTOR.nen, a.latent)] : 1;
const mtNenWord = k => ({Enhancement: 'Enhancer', Transmutation: 'Transmuter', Emission: 'Emitter', Conjuration: 'Conjurer', Manipulation: 'Manipulator', Specialization: 'Specialist'})[k] || k;
const MT_NENS = Object.keys(MT_NEN);
const MT_LESSONS = {
  wild: {l: 'Survival in the wild', d: 'Stronger in physical trials', hit: ph => PHYSICAL.has(ph.id)},
  read: {l: 'Read people', d: 'Better in team trials and at making allies', hit: ph => !!(ph.team || ph.prisoner)},
  dirty: {l: 'Fight dirty', d: 'Sharper in fights and on Zevil Island', hit: ph => !!(ph.zevil || ph.final || (ph.w && (ph.w.combat || 0) >= .3))},
  mind: {l: 'Think before you run', d: 'Stronger in trials of wits', hit: ph => !!(ph.w && ((ph.w.intelligence || 0) + (ph.w.strategy || 0) + (ph.w.perception || 0)) >= .4)},
  grit: {l: 'Never stop walking', d: 'Tires less in long trials', hit: ph => !!ph.fatigue},
  nerve: {l: 'Hold your nerve', d: 'A small edge everywhere', hit: () => true}
};
const MT_POST = [
  {k: 'cautious', l: 'Cautious', d: 'Leans to the safe approach: fewer injuries, harder to kill'},
  {k: 'steady', l: 'Steady', d: 'Follows their own instinct'},
  {k: 'aggressive', l: 'Aggressive', d: 'Leans to the bold approach: big swings, more injuries'},
  {k: 'allies', l: 'Seek allies', d: 'Leans to going with others: alliances come easier'}
];
const MT_TITLES = [[0, 'Novice Mentor'], [3, 'Known Mentor'], [8, 'Respected Mentor'], [15, 'Renowned Mentor'], [25, 'Legendary Master']];
const mtTitle = () => MT_TITLES.filter(t => MENTOR.renown >= t[0]).pop()[1];
const mtSlots = () => 1 + (MENTOR.renown >= 8 ? 1 : 0) + (MENTOR.renown >= 20 ? 1 : 0);
const mtActive = () => MENTOR.appr.filter(a => a.status === 'active');
const mtOf = id => MENTOR.appr.find(a => a.id === id && a.status === 'active');
const mtHere = () => mtActive().map(a => ({a, c: S.candidates.find(c => c.id === a.id)})).filter(x => x.c);
const mtLog = text => { MENTOR.log.push({ed: S.edition, text}); MENTOR.log = MENTOR.log.slice(-40); };
const mtChip = () => `<span class="sc-chip mt-chip" aria-hidden="true">◆</span>`;
const mtRng = k => makeRng((nhash(S.seed + ':mt:' + k)) >>> 0);
const mtDream = c => { try { return pro(BG.dream[background(c).dream], c); } catch(e){ return 'earn a license'; } };

// three prospects per exam: raw talents, late bloomers and underdogs, never the favourites
function mtPool(){
  const was = new Set(MENTOR.appr.map(a => a.id));
  if(MENTOR.pool && MENTOR.pool.ed === S.edition) return MENTOR.pool.ids.map(x => ({...x, c: S.candidates.find(c => c.id === x.id)})).filter(x => x.c && x.c.status === 'Active' && !was.has(x.id));
  const R = scRanks(), C = S.candidates.filter(c => c.status === 'Active' && !was.has(c.id)), rng = mtRng('pool'), out = [], used = new Set();
  const take = (f, tag) => { const L = C.filter(c => !used.has(c.id) && f(c)); if(!L.length) return; const c = L[Math.floor(rng() * L.length)]; used.add(c.id); out.push({id: c.id, tag}); };
  take(c => c.age <= 16 && R[c.id] > 40 && R[c.id] <= 300, 'Raw talent');
  take(c => attemptsOf(c) >= 2 && R[c.id] > 30 && R[c.id] <= 260, 'Late bloomer');
  take(c => c.tier === 'Ordinary' && Math.max(...Object.values(c.a)) >= 78 && R[c.id] > 80 && R[c.id] <= 400, 'Underdog');
  while(out.length < 3){ const n = out.length; take(c => R[c.id] > 40 && R[c.id] <= 300, 'Prospect'); if(out.length === n) break; }
  take(c => c.tier === 'Elite' && R[c.id] > 6 && R[c.id] <= 40, 'Blue chip');
  MENTOR.pool = {ed: S.edition, ids: out};
  return out.map(x => ({...x, c: S.candidates.find(c => c.id === x.id)}));
}
function mtRecruit(id){
  const c = S.candidates.find(x => x.id === id); if(!c || S.started || mtActive().length >= mtSlots() || SCOUT.jenny < mtFeeOf(c)) return;
  const fee = mtFeeOf(c); SCOUT.jenny -= fee; MENTOR.newSeat = false;
  MENTOR.appr.push({id, name: c.name, from: S.edition, posture: 'steady', status: 'active', camp: {ed: S.edition, pts: {body: 0, mind: 0, spirit: 0, nen: 0}, lesson: null, paid: true, done: false, offer: mtOffer(id)}, total: {body: 0, mind: 0, spirit: 0, nen: 0}, fee, start: {...c.a}, exams: 0, nenP: 0, latent: mtLatent(c)});
  if(!isFav(id)) toggleFav(id);
  const E = scEx(); if(E.pool && !E.pool.some(x => x.id === id)){ E.pool = [{id, tag: 'Apprentice'}].concat(E.pool).slice(0, 8); }
  mtLog(`You took on ${c.name} (age ${c.age}) as your apprentice for the ${ordinal(S.edition)} exam.`);
  save(); render();
}
// the type a candidate would awaken: fixed when they join the lodge, revealed only when they awaken
const mtLatent = c => { try { return generateNen(S, c, new Set()).category; } catch(e){ return 'Enhancement'; } };
function mtAwaken(a, c){
  let n = null;
  for(let k = 0; k < 60; k++){ n = MT_GEN(Object.assign({}, S, {seed: (S.seed + k * 7919) >>> 0}), c, new Set()); if(n.category === a.latent) break; }
  n.status = 'Awakened'; n.mastery = Math.max(n.mastery, 18); a.nen = n; c.nen = JSON.parse(JSON.stringify(n));
  c.notes.push({p: 0, text: `Awakened Nen under ${MENTOR.name}: ${n.category}, Hatsu "${n.hatsu.alias}" (${n.hatsu.name})`});
  mtLog(`Under your teaching, ${c.name} awakened Nen: a${/^[AEIOU]/.test(n.category) ? 'n' : ''} ${mtNenWord(n.category)}! Hatsu: "${n.hatsu.alias}".`);
}
const mtOffer = id => { const r = makeRng(nhash(id + ':lesson:' + S.edition) >>> 0), sig = MT_SIG[MENTOR.nen], ks = Object.keys(MT_LESSONS).filter(k => k !== sig); r.shuffle(ks); return (sig ? [sig] : []).concat(ks).slice(0, 3); };
const MT_EXTRA_MAX = 5, mtExtraCost = cp => 100 * ((cp.extra || 0) + 1);
const mtPtsLeft = cp => MT_POINTS + (cp.extra || 0) - cp.pts.body - cp.pts.mind - cp.pts.spirit - (cp.pts.nen || 0);
// every training point adds +1 to each skill of its track; the bonus point must go to the mentor's track (or anywhere for Specialists)
function mtCanAdd(cp, k){ return mtPtsLeft(cp) > 0; }
const mtCanBuy = cp => mtPtsLeft(cp) <= 0 && (cp.extra || 0) < MT_EXTRA_MAX && SCOUT.jenny >= mtExtraCost(cp);
// the camp for the coming exam: a fee each year after the first, then points and a lesson; skipped camps run themselves
function mtCampFor(a){
  if(!a.camp || a.camp.ed !== S.edition) a.camp = {ed: S.edition, pts: {body: 0, mind: 0, spirit: 0, nen: 0}, lesson: null, paid: false, done: false, offer: mtOffer(a.id)};
  return a.camp;
}
function mtApplyCamp(a, c, auto){
  const cp = mtCampFor(a); if(cp.done) return;
  c.mLesson = null;
  let paidNow = 0;
  if(!cp.paid){ const fee = a.fee || MT_FEE; if(SCOUT.jenny < fee){ cp.done = true; cp.broke = true; mtLog(`You could not pay the camp for ${c.name}: ${c.first || c.name} trained alone this year.`); return; } SCOUT.jenny -= fee; cp.paid = true; paidNow = fee; purseFx(-fee); }
  if(auto){   // fill the remaining points towards the weakest tracks, pick the first lesson
    const avg = t => t.a.reduce((s, k) => s + c.a[k], 0) / t.a.length;
    while(mtPtsLeft(cp) > 0){ const t = MT_TRACKS.filter(t => t.k !== 'nen' && mtCanAdd(cp, t.k)).sort((x, y) => (avg(x) + cp.pts[x.k] * 3) - (avg(y) + cp.pts[y.k] * 3))[0]; if(!t) break; cp.pts[t.k]++; }
    if(!cp.lesson) cp.lesson = cp.offer[0];
  }
  MT_TRACKS.forEach(t => t.a.forEach(k => c.a[k] = Math.min(100, c.a[k] + cp.pts[t.k])));
  MT_TRACKS.forEach(t => a.total[t.k] = (a.total[t.k] || 0) + (cp.pts[t.k] || 0));
  if(cp.pts.nen && !a.nen){
    a.nenP = (a.nenP || 0) + cp.pts.nen * mtTeach(a);
    if(cp.pts.nen >= 5 && mtRng('burn' + a.id)() < 0.35){ c.fatigue = Math.min(100, (c.fatigue || 0) + 30); cp.burn = true; mtLog(`You pushed the Nen training too hard: ${c.name} reaches the exam exhausted.`); }
    if(a.nenP >= MT_AWAKEN) mtAwaken(a, c);
  }
  if(a.nen){ c.nen = JSON.parse(JSON.stringify(a.nen)); if(a.nen.category === 'Specialization') a.specK = ['fight', 'danger', 'body', 'wits', 'team'][Math.floor(mtRng('spec' + a.id)() * 5)]; }
  if(!cp.broke) mtCampStory(a, c, cp);
  cp.done = true; c.mLesson = cp.lesson; a.exams++;
  mtLog(`Your training camp for ${c.name}: ${MT_TRACKS.filter(t => cp.pts[t.k]).map(t => `${t.l} +${cp.pts[t.k]}`).join(', ') || 'rest'}${cp.lesson ? ` · lesson: ${MT_LESSONS[cp.lesson].l}` : ''}${auto ? ` (planned by ${c.first || c.name} alone)` : ''}${paidNow ? ` · camp −${fmt(paidNow)} Jenny` : ''}.`);
}
// the purse shows every coin that moves: a small −/+ that floats off the header chip
function purseFx(d){
  try{ const w = $('walletChip'); if(!w || !d || MT_AUTO) return;
    const s = document.createElement('span'); s.className = 'pfx ' + (d < 0 ? 'neg' : 'pos'); s.innerHTML = (d < 0 ? '−' : '+') + fmtJ(Math.abs(d));
    w.appendChild(s); setTimeout(() => s.remove(), 1800); }catch(e){}
}
// how well an order suits a phase: the right call is worth a lot, the wrong one costs a little
const mtKind = ph => { const w = ph.w || {}; return ph.zevil || ph.final || (w.combat || 0) + (w.strength || 0) >= .3 ? 'fight' : ph.team ? 'team' : ((w.intelligence || 0) + (w.strategy || 0) + (w.perception || 0)) >= .4 || ph.prisoner ? 'wits' : ph.obstacle ? 'danger' : PHYSICAL.has(ph.id) ? 'body' : 'wits'; };
const MT_FIT = {steady: {}, aggressive: {fight: 6, body: 1, team: -1, wits: -3, danger: -2}, cautious: {fight: -3, body: -1, team: 0, wits: 4, danger: 4}, allies: {fight: -2, body: 2, team: 5, wits: 0, danger: 2}};
const mtFit = (ph, k, c) => (MT_FIT[k][mtKind(ph)] || 0) + (k === 'allies' && mtKind(ph) === 'body' && c && alliesOf(S, c).length ? 1 : 0);
const MT_KIND_L = {fight: 'a fight', team: 'a team trial', wits: 'a test of wits', danger: 'a dangerous crossing', body: 'a physical trial'};
const MT_FIGHT_A = ['strength', 'combat', 'speed', 'agility'];
/* ---------- approach: one call per trial, in the trial's own words; hints, never numbers ---------- */
// b = bold (pushes, like Aggressive), s = safe (like Cautious), g = with others (like Seek allies); each: [label, what the rumour says]
const MT_AP = {
  ridge: {b: ['Run between the strikes', 'the lightning never hits the same spot twice'], s: ['Wait out each strike flat on the rock', 'the ones who run are the ones it finds'], g: ['Cross in a chain', 'a chain of hands gets everyone over']},
  pit: {b: ['Take the middle of the pit', 'whoever holds the centre is left alone'], s: ['Keep to the wall', 'the wall is where nobody can reach your back'], g: ['Stand back to back with someone', 'pairs outlast the ones who stand alone']},
  banquet: {b: ['Sit at the high table', 'the examiner only notices the bold'], s: ['Eat only what the host eats', 'one dish on the table is a test'], g: ['Work the room with others', 'friends at the banquet are friends for the exam']},
  blankmap: {b: ['Pick a direction and keep going', 'the land rewards the ones who commit'], s: ['Map every step', 'the ones who guess walk in circles'], g: ['Explore in a group', 'three pairs of eyes see the path']},
  hall: {b: ['Trust what you remember', 'the hall repeats itself, almost'], s: ['Read every rule on the wall', 'the rules changed in one room only'], g: ['Follow a veteran', 'the ones who were here before know the doors']},
  mute: {b: ['Move fast and quiet', 'the silence is easier to keep for a short time'], s: ['Copy the examiner\'s signals', 'every signal means something'], g: ['Stay close to others, hand on shoulder', 'touch is not a word']},
  pairs: {b: ['Set the pace for both', 'the strong half decides whether the pair makes it'], s: ['Match your partner\'s pace', 'pairs that fight the rope snap it'], g: ['Pick an ally as partner', 'allies tied together pass more often']},
  mirror: {b: ['Follow your first instinct', 'the real examiner is always the first one you see'], s: ['Watch the reflections blink', 'the impostors blink late'], g: ['Check each other\'s reflections', 'nobody sees their own impostor']},
  feeding: {b: ['Run across the open ground', 'the herd is slow to turn'], s: ['Go round by the trees', 'nothing feeds near the trees'], g: ['Cross as a herd', 'the beasts leave big groups alone']},
  dice: {b: ['Roll for everything', 'the Chairman likes a gambler'], s: ['Play only the safe bets', 'the Chairman punishes greed'], g: ['Pool your luck with others', 'the Chairman lets groups throw together']},
  sea: {b: ['Work the deck through the storm', 'the captain only notices the ones on deck'], s: ['Stay below and save strength', 'the storm takes the ones who stay up top'], g: ['Join a rope crew', 'the crews that haul together get fed first']},
  quiz: {b: ['Answer first, and fast', 'the examiner rewards nerve, not right answers'], s: ['Think twice before every answer', 'the questions are traps for the quick'], g: ['Listen to how the others answer', 'the right answer hides in other people\'s mistakes']},
  disguise: {b: ['Accuse someone early', 'the examiner hides near the front, in plain sight'], s: ['Watch and wait', 'whoever guesses early guesses wrong'], g: ['Compare notes with others', 'nobody spots the examiner alone']},
  nighttrain: {b: ['Walk the roof between cars', 'the quickest way through the train is over it'], s: ['Stay in the compartment, eyes open', 'the ones who wander are the ones who vanish'], g: ['Share a compartment with strangers', 'the lone sleepers never reach the station']},
  cliffpath: {b: ['Take the narrow ledge', 'the ledge is wider than it looks'], s: ['Hug the wall, step by step', 'the wind takes anyone in a hurry'], g: ['Rope up with others', 'no rope team has lost anyone on this path']},
  marathon: {b: ['Run with the leaders', 'the examiner never slows down; the back of the pack gets lost'], s: ['Find a pace and keep it', 'the leaders always burn out by the tenth hour'], g: ['Run in a pack', 'packs share water and keep each other awake']},
  stairs: {b: ['Take them two at a time', 'the stairs get steeper; get ahead early'], s: ['One step at a time', 'the stairs never end for the impatient'], g: ['Climb in a line, swapping the lead', 'the ones who pace each other reach the top']},
  wetlands: {b: ['Cut across the bog', 'the bog is shallower than it looks'], s: ['Stick to the examiner\'s heels', 'the mist swallows anyone who loses the examiner'], g: ['Hang back with the pack', 'the creatures only go for the ones alone']},
  desert: {b: ['March through midday', 'the oasis dries up by the third day'], s: ['Travel by night', 'the sun kills more than the sand'], g: ['Join a caravan', 'the caravans always know where the water is']},
  nighthunt: {b: ['Chase it head-on', 'the quarry tires if you push it'], s: ['Track it quietly', 'the quarry bolts at the first sound'], g: ['Corner it together', 'it takes three to corner one']},
  mountain: {b: ['Climb the north face', 'the ice on the north face holds this year'], s: ['Take the switchbacks', 'the north face has taken two climbers this month'], g: ['Rope up with a team', 'the summit is a team climb this year']},
  capture: {b: ['Grab it bare-handed', 'the creatures are slower than they look'], s: ['Set a trap and wait', 'the creatures bite when rushed'], g: ['Hunt it in pairs', 'one distracts, one grabs: that is the trick']},
  cooking: {b: ['Hunt the rarest ingredient', 'the examiner only cares about the meat'], s: ['Cook what you know', 'the examiner hates surprises'], g: ['Share ingredients with a rival', 'the examiner wants a dish no one could make alone']},
  egg: {b: ['Jump first', 'the wind dies by noon; jump early'], s: ['Watch the others jump, then go', 'the first jumpers always misjudge the drop'], g: ['Go down with a partner on the rope', 'pairs on one rope come back up']},
  auction: {b: ['Bid big, and early', 'the room folds to whoever bids loud first'], s: ['Wait for the last lot', 'the best lot always comes last'], g: ['Pool money with others', 'the winners always bid together']},
  beast: {b: ['Stare it down', 'the beasts respect the bold'], s: ['Approach slowly, on your knees', 'the beasts charge anything that moves fast'], g: ['Calm it with others around', 'the beasts trust a herd, not a hunter']},
  treasure: {b: ['Dig where nobody else is', 'the treasure lies far from the crowd'], s: ['Read every clue twice', 'the clues lie to the quick reader'], g: ['Trade clues', 'every clue has a twin in someone else\'s pocket']},
  tower: {b: ['Take the fastest door', 'the short route is shorter than it looks'], s: ['Test every floor before stepping', 'the floors are rigged for the hasty'], g: ['Wait for a full team', 'the long route needs five; find them']},
  prisoner: {b: ['Fight the prisoner', 'the prisoners are weaker than they act'], s: ['Pick a game of wits', 'the prisoners fight dirty'], g: ['Let the team choose the match', 'the teams that argue are the ones that lose']},
  maze: {b: ['Run every left turn', 'the exit is left, always left'], s: ['Mark every wall', 'the labyrinth punishes the ones who rush'], g: ['Stay with the group', 'groups find the exit twice as fast']},
  guardians: {b: ['Strike first', 'the guardians are slow to start'], s: ['Wait for an opening', 'the guardians punish anyone who rushes them'], g: ['Fight back to back', 'the guardians fall to teams']},
  raft: {b: ['Shoot the rapids', 'the rapids are calmer this year'], s: ['Carry the raft around the falls', 'the falls have flipped every raft this season'], g: ['Lash two rafts together', 'two rafts tied together never flip']},
  bandits: {b: ['Charge their camp', 'the bandits are half asleep by noon'], s: ['Slip past in the reeds', 'the bandits shoot anything that charges'], g: ['Cross on a full boat', 'the bandits never board a full boat']},
  centennial: {b: ['Go for the hardest test', 'the hardest test counts double'], s: ['Take every test in order', 'skipping ahead is a disqualification'], g: ['Partner with a veteran', 'the veterans know this one by heart']},
  zevil: {b: ['Hunt at night', 'targets sleep badly on the island'], s: ['Guard your own badge first', 'the hunters get hunted here'], g: ['Hunt with a partner', 'pairs hold more badges by day three']},
  final: {b: ['All out from the bell', 'this year\'s opponents start slow'], s: ['Read them first', 'the bracket rewards patience'], g: ['Study the bracket with friends', 'everyone repeats their tricks; ask who fought them']}
};
const MT_AP_KIND = {
  fight: {b: ['Strike first', 'the opponents are slow to start'], s: ['Wait for an opening', 'the ones who rush get punished'], g: ['Fight back to back', 'teams last longer here']},
  wits: {b: ['Trust the first idea', 'the trick is simpler than it looks'], s: ['Think it through', 'the obvious answer is the trap'], g: ['Work it out with others', 'two heads find the catch']},
  danger: {b: ['Take the short way', 'the short way is safer than it looks'], s: ['Go slow and look twice', 'the fast ones fall'], g: ['Cross with others', 'nobody falls with a hand to hold']},
  body: {b: ['Push the pace', 'the slow ones get left behind'], s: ['Save strength', 'the fast starters fade'], g: ['Move with a pack', 'packs carry their stragglers']},
  team: {b: ['Take the lead', 'the team needs someone to decide'], s: ['Let others lead', 'the loud leaders get it wrong'], g: ['Keep the team together', 'the teams that split up fail']}
};
const MT_AP_POST = {b: 'aggressive', s: 'cautious', g: 'allies'}, MT_AP_K = ['b', 's', 'g'];
const MT_AP_ATTR = {b: ['courage', 'strength', 'speed'], s: ['perception', 'intelligence', 'determination'], g: ['teamwork', 'charisma']};
const MT_AP_REACT = {
  b: ['{F} is already rolling {their} shoulders.', '{F}: “Let me go first.”', '{F} grins at the hard way.', '{F} has the look of someone about to do something reckless.'],
  s: ['{F} is studying the ground, not the crowd.', '{F}: “Slow is fine. Slow is alive.”', '{F} counts the exits before anything else.', '{F} wants to watch first.'],
  g: ['{F} keeps looking for familiar faces.', '{F}: “Nobody does this one alone.”', '{F} has already started learning names.', '{F} drifts towards the others.']
};
const mtApDefs = ph => { const D = MT_AP[ph.id] || MT_AP_KIND[mtKind(ph)] || MT_AP_KIND.wits; return MT_AP_K.map(k => ({k, l: D[k][0], ru: D[k][1], post: MT_AP_POST[k]})); };
// everything hidden about one trial: what the ground favours this year, what suits the apprentice, what you know, what people say
function mtApInfo(a, c, p){
  const ph = PHASES[p]; if(!ph) return null;
  const r = mtRng('ap' + p + a.id), rT = mtRng('apt' + p), opts = mtApDefs(ph), tw = {}, pers = {};
  const TW = [-2, -1, 0, 0, 1, 2, 3]; MT_AP_K.forEach(k => { tw[k] = TW[Math.floor(rT() * TW.length)]; });
  MT_AP_K.forEach(k => { const L = MT_AP_ATTR[k], v = L.reduce((s, x) => s + (c.a[x] || 50), 0) / L.length; pers[k] = Math.max(-2, Math.min(3, Math.round((v - 58) / 8))); });
  if(!alliesOf(S, c).length) pers.g -= 1;
  const tot = k => mtFit(ph, MT_AP_POST[k], c) + tw[k] + pers[k];
  const best = f => MT_AP_K.slice().sort((x, y) => f(y) - f(x))[0];
  const kTw = best(k => tw[k]), kPers = best(k => pers[k]), kTot = best(tot);
  // the rumour: right most of the time, and nobody says when it is not
  const ruRight = rT() < 0.78, ruK = ruRight ? kTw : MT_AP_K.filter(k => k !== kTw)[Math.floor(rT() * 2)];
  const F = c.first || c.name.split(' ')[0], P = PR(c), fill = t => t.replace(/\{F\}/g, F).replace(/\{their\}/g, P.their);
  const hints = [];
  hints.push({t: 'Instinct', s: pers[kPers] >= 1 ? fill(MT_AP_REACT[kPers][Math.floor(r() * MT_AP_REACT[kPers].length)]) : `${F} has no feeling about this one, either way.`, k: pers[kPers] >= 1 ? kPers : null});
  const cp = a.camp && a.camp.ed === S.edition ? a.camp : null, L = c.mLesson && MT_LESSONS[c.mLesson];
  const kind = mtKind(ph), lucky = r() < 0.5, drilled = (L && L.hit(ph) && c.mLesson !== 'nerve') || (lucky && cp && ((cp.focus === 'body' && ['body', 'danger', 'fight'].includes(kind)) || (cp.focus === 'mind' && kind === 'wits') || (cp.focus === 'spirit' && kind === 'team')));
  if(drilled) hints.push({t: 'Training', s: `You drilled this in camp. “${opts.find(o => o.k === kTot).l}” feels right.`, k: kTot});
  hints.push({t: 'Rumour', s: (r => r.charAt(0).toUpperCase() + r.slice(1))(opts.find(o => o.k === ruK).ru) + '.', k: ruK});
  return {opts, tw, pers, tot, kTot, ruK, ruRight, hints};
}
// with no call from you, they follow their temperament; Steady means their own instinct
function mtApDefault(a, c){
  const m = {aggressive: 'b', cautious: 's', allies: 'g'}[a.posture]; if(m) return m;
  const I0 = mtApInfo(a, c, S.phase), ins = I0 && I0.hints.find(h => h.t === 'Instinct' && h.k); if(ins) return ins.k;   // steady: their gut, the ◎ on the card
  const l = mtLean(c); return l === 'bold' ? 'b' : l === 'safe' ? 's' : l === 'kind' ? 'g' : (() => { const i = mtApInfo(a, c, S.phase); return i ? MT_AP_K.slice().sort((x, y) => i.pers[y] - i.pers[x])[0] : 's'; })();
}
// once every apprentice has your call, the trial runs; until then the others go by instinct if you press Run
function mtCalled(a, c){ const d = mtDilFor(a, c); if(mtInBlock(a)) return !!mtApMine(a, S.phase) && (!d || d.done || d.choice != null); if(d && !d.done) return d.group ? !!(MENTOR.gdil && MENTOR.gdil.choice != null) : d.choice != null; return !!mtApMine(a, S.phase); }
const mtLiveHere = () => mtHere().filter(({c}) => c.status === 'Active');
const mtAllCalled = () => { const L = mtLiveHere(); return L.length > 0 && L.every(({a, c}) => mtCalled(a, c)); };
const mtCallFoot = () => { const left = mtLiveHere().filter(({a, c}) => !mtCalled(a, c)).length; return left ? `Called. The trial runs once ${left === 1 ? 'the other one has' : 'the others have'} a call too, or press Run.` : 'Called.'; };
const mtGoIfCalled = () => { if(!S.finished && mtAllCalled()) $('bStep').click(); else renderPhase(); };
const mtApMine = (a, p) => a.ap && a.ap.ed === S.edition && a.ap.p === p ? a.ap.k : null;
const mtApK = (a, c, p) => mtApMine(a, p) || mtApDefault(a, c);
// a choice of the moment (a dilemma) is this trial's call; otherwise the approach is
const mtApOpen = (a, c) => !mtDilFor(a, c);
function mtApHtml(a, c, inCard){
  const p = S.phase, ph = PHASES[p], I = mtApInfo(a, c, p); if(!I) return '';
  const k = mtApK(a, c, p), mine = mtApMine(a, p), T = MT_POST.find(o => o.k === a.posture);
  const names = c.first || c.name;
  return `<div class="mt-dpanel mt-ap${inCard ? ' in' : ''}${mine ? ' set' : ''}" id="mtAp-${a.id}" data-biome="${biomeOf(ph.id)}"><div class="mt-dtop"><span class="mt-lab">◆ ${inCard ? esc(names) : `Approach · ${esc(names)}`}</span>${inCard ? `<span class="mt-stamp">Next · ${esc(ph.name)}</span>` : `<span class="mt-dwhen">before ${esc(ph.name)}</span>`}</div>
    ${mtRuHtml(I)}
    <div class="mt-dopts">${I.opts.map(o => `<button type="button" class="${o.k === k ? (mine ? 'on' : 'def') : ''}" data-mtap="${a.id}" data-k="${o.k}" aria-pressed="${o.k === k}">${mtMarks([{c, I}], o.k, false)}<span>${esc(o.l)}</span></button>`).join('')}</div>
    <div class="mt-dfoot"><span>${mine ? mtCallFoot() : `No call yet: ${inCard ? 'going' : esc(c.first || 'they') + ' will go'} by ${a.posture === 'steady' ? 'instinct' : 'temperament (' + T.l.toLowerCase() + ')'}.`}</span>${mtLegend([{c, I}])}</div></div>`;
}
// what you know, as marks on the answers: ◎ where their gut leans, ✦ what they drilled in camp; the rumour stays a line of text
const mtHint = (I, t) => I.hints.find(h => h.t === t && h.k);
const mtRuHtml = I => { const r = I.hints.find(h => h.t === 'Rumour'), ph = PHASES[S.phase];
  const wait = ph && ph.prisoner && ph.npcs ? (() => { const L = ph.npcs.slice().sort((x, y) => nhash(x + S.edition) - nhash(y + S.edition)).slice(0, 3); return `<p class="mt-ru mt-wait"><i class="t-wait">Waiting</i><span>${L.map(n => esc(n) + (NPC_EPI[n] ? ', ' + esc(NPC_EPI[n].replace(/^who /, 'who ')) : '')).join('; ')}; and others. Each candidate draws two: a fight, a riddle or a wager.</span></p>`; })() : '';
  return (r ? `<p class="mt-ru"><i class="t-rumour">Rumour</i><span>${esc(r.s)}</span></p>` : '') + wait; };
function mtMarks(X, k, named){
  const ins = X.filter(({I}) => (mtHint(I, 'Instinct') || {}).k === k), tr = X.filter(({I}) => (mtHint(I, 'Training') || {}).k === k);
  const nm = L => L.map(({c}) => c.first || c.name.split(' ')[0]).join(', ');
  return (ins.length || tr.length) ? `<span class="mt-mks">${ins.length ? `<span class="mt-mk mk-i" title="${esc(named ? 'Instinct: ' + nm(ins) : ins.map(({I}) => mtHint(I, 'Instinct').s).join(' '))}">◎</span>` : ''}${tr.length ? `<span class="mt-mk mk-t" title="${esc(named ? 'Drilled in camp: ' + nm(tr) : 'Drilled this in camp')}">✦</span>` : ''}</span>` : '';
}
function mtLegend(X){
  const i = X.some(({I}) => mtHint(I, 'Instinct')), t = X.some(({I}) => mtHint(I, 'Training'));
  return i || t ? `<span class="mt-leg">${i ? '<span><b class="mk-i">◎</b> instinct</span>' : ''}${t ? '<span><b class="mk-t">✦</b> drilled in camp</span>' : ''}</span>` : '';
}
// two or more apprentices on the same trial are one block: one call for all, unless you split them
const mtSplit = () => MENTOR.split === S.edition + ':' + S.phase;
const mtBlockable = () => MENTOR.off || S.finished || S.live ? [] : mtLiveHere().filter(({a, c}) => { const d = mtDilFor(a, c); return !(d && d.group) && mtApInfo(a, c, S.phase); });
const mtBlock = () => { const L = mtBlockable(); return L.length >= 2 && !mtSplit() ? L : null; };
const mtInBlock = a => { const B = mtBlock(); return !!(B && B.some(x => x.a === a)); };
function mtBlockState(B){
  const p = S.phase, X = B.map(x => ({...x, I: mtApInfo(x.a, x.c, p), mine: mtApMine(x.a, p), k: mtApK(x.a, x.c, p)}));
  const m0 = X[0].mine, all = m0 && X.every(x => x.mine === m0) ? m0 : null, any = X.some(x => x.mine);
  const d0 = X[0].k, same = !any && X.every(x => x.k === d0) ? d0 : null;
  return {X, all, any, same};
}
function mtApBlockHtml(B){
  const p = S.phase, ph = PHASES[p], {X, all, any, same} = mtBlockState(B), opts = X[0].I.opts;
  const ru = X[0].I.hints.find(h => h.t === 'Rumour');
  const who = X.map(({c, I}) => { const F = c.first || c.name.split(' ')[0], ins = I.hints.find(h => h.t === 'Instinct'), tr = I.hints.find(h => h.t === 'Training');
    let t = ins.k ? ins.s.replace(new RegExp('^' + F.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':?\\s*'), '') : 'No feeling either way.'; t = t.charAt(0).toUpperCase() + t.slice(1);
    return {F, t, tr}; }).reduce((g, x) => { const h = !x.tr && g.find(y => !y.tr && y.t === x.t); if(h) h.F += ' · ' + x.F; else g.push({...x}); return g; }, [])
    .map(({F, t, tr}) => `<li><i class="t-who">${esc(F)}</i><span>${esc(t)}${tr ? ` <em class="t-tr">Drilled in camp: “${esc(opts.find(o => o.k === tr.k).l)}”.</em>` : ''}</span></li>`).join('');
  const names = X.map(({c}) => c.first || c.name.split(' ')[0]);
  const foot = all ? (mtAllCalled() ? 'Called, for all of them.' : `Called for them. Still open: ${esc(X.filter(({a, c}) => !mtCalled(a, c)).map(({c}) => (c.first || c.name) + '’s moment').join(', ') || 'one call')}. Or press Run.`) : any ? 'Different calls for now. Pick one for all.' : same ? 'No call yet: going by instinct.' : 'No call yet: each goes by instinct.';
  return `<div class="mt-dpanel mt-ap in mt-blk${all ? ' set' : ''}" id="mtAp-blk" data-biome="${biomeOf(ph.id)}"><div class="mt-dtop"><span class="mt-lab">◆ Apprentices</span><span class="mt-dwhen">${esc(names.join(' · '))}</span><span class="mt-stamp">Next · ${esc(ph.name)}</span></div>
    ${mtRuHtml(X[0].I)}
    <div class="mt-dopts">${opts.map(o => `<button type="button" class="${all === o.k ? 'on' : same === o.k ? 'def' : ''}" data-mtapall="${o.k}" aria-pressed="${all === o.k}">${mtMarks(X, o.k, true)}<span>${esc(o.l)}</span></button>`).join('')}</div>
    <div class="mt-dfoot"><span>${foot}</span>${mtLegend(X)}</div></div>`;
}
// one switch for the whole lodge: one call for all, or a call each
function mtModeHtml(){ if(mtBlockable().length < 2) return ''; const sp = mtSplit();
  return `<span class="mt-mode" role="group" aria-label="Calls"><button type="button" class="${sp ? '' : 'on'}" data-mtjoin aria-pressed="${!sp}">One call</button><button type="button" class="${sp ? 'on' : ''}" data-mtsplit aria-pressed="${sp}">Each their own</button></span>`;
}
// apprentices without a card yet (the first trial) get the same block on its own
function mtApPanelHtml(i){
  if(MENTOR.off || S.finished || !MENTOR.made) return '';
  return mtHere().filter(({a, c}) => c.status === 'Active' && !mtHasCard(a, i) && mtCampFor(a).done && mtApOpen(a, c)).map(({a, c}) => mtApHtml(a, c, false)).join('');
}
const mtNenK = a => a.nen ? (a.nen.category === 'Specialization' ? a.specK : MT_NEN_K[a.nen.category]) : null;
const mtNenEdge = (a, ph) => !a.nen ? 0 : mtNenK(a) === mtKind(ph) ? (a.nen.category === 'Specialization' ? 9 : 7) : 1.5;
// posture and lesson act on the phase about to run; the engine resets these nudges after every phase
function mtBefore(){
  if(!S.started){ mtHere().forEach(({a, c}) => mtApplyCamp(a, c, true));
    mtLodgeAlly(); }
  const ph = PHASES[S.phase]; if(!ph) return;
  mtHere().forEach(({a, c}) => { if(c.status !== 'Active'){ delete c.mPost; return; }
    const dl = mtDilFor(a, c), I = mtApInfo(a, c, S.phase), ak = mtApK(a, c, S.phase), mine = !!mtApMine(a, S.phase);
    c.mPost = MT_AP_POST[ak]; c.mAp = {k: ak, mine, l: I.opts.find(o => o.k === ak).l, tot: I.tot(ak), ru: ak === I.ruK && !I.ruRight};
    let m = I.tot(ak) + mtNenEdge(a, ph) + mtTrustEdge(a, c, ph, mine);
    if(ak === 'b') m += (mtRng('apv' + S.phase + a.id)() - 0.5) * 6;   // the bold call swings both ways
    mtDilResolve(a, c, S.phase);
    if(a.nen && !c.nen) c.nen = JSON.parse(JSON.stringify(a.nen));
    // in fights, an awakened apprentice reinforces the body with aura (Enhancers most of all); undone after the phase
    if(a.nen && mtKind(ph) === 'fight'){ const B = a.nen.category === 'Enhancement' ? 10 : 5; c.mBoost = B; MT_FIGHT_A.forEach(k => c.a[k] += B); }
    const L = c.mLesson && MT_LESSONS[c.mLesson], sig = c.mLesson === MT_SIG[MENTOR.nen]; if(L && L.hit(ph)) m += (c.mLesson === 'nerve' ? 1.5 : 3) + (sig ? (c.mLesson === 'nerve' ? 1 : 1.5) : 0);
    c.pmod = (c.pmod || 0) + m; c.mFat = c.fatigue; c.mAllies = alliesOf(S, c).map(o => o.id);
  });
}
function mtAfter(p){
  const ph = PHASES[p]; if(!ph) return;
  const rng = mtRng('after' + p);
  mtHere().forEach(({a, c}) => {
    if(c.mPost && (c.out == null || c.out >= p)){
      const tr = (a.trail = a.trail && a.trail.ed === S.edition ? a.trail : {ed: S.edition, ph: []});
      if(!tr.ph.some(x => x.p === p)){ const e = {p, k: c.status === 'Approved' ? 'lic' : c.out === p ? (c.status === 'Deceased' ? 'dead' : 'out') : 'ok', post: c.mPost, fit: c.mAp ? c.mAp.tot : mtFit(ph, c.mPost, c), ap: c.mAp && !c.mDefy && !ph.zevil && !ph.final ? {l: c.mAp.l, mine: c.mAp.mine, call: c.mAp.tot >= 4 ? 'right' : c.mAp.tot <= -1 ? 'wrong' : '', ru: c.mAp.ru} : null, inj: !!(c.injury && c.injury.p === p)};
        const d = a.dil; if(d && d.ed === S.edition && d.p === p && d.done) e.dil = {q: mtDilQ(d, c), label: d.label, auto: d.auto, say: d.say};
        if(c.mDefy){ e.defy = true; delete c.mDefy; }
        { const T = mtTeamOf(c, p); if(T) e.team = T; else { const w = (c.mAllies || []).concat(alliesOf(S, c).map(o => o.id)).filter((id, k, A) => A.indexOf(id) === k && id !== c.id); if(w.length) e.with = w.slice(0, 6); } }
        if(e.k === 'ok' || e.k === 'lic'){ const nx = PHASES[p + 1], mid = Math.floor(PHASES.length / 2), got = (tr.paid = tr.paid || {});
          const ms = nx && nx.final ? ['final', 300, 'reached the Final'] : nx && nx.zevil ? ['zevil', 150, 'reached Zevil Island'] : p + 1 === mid ? ['mid', 50, 'passed the halfway mark'] : null;
          if(ms && !got[ms[0]]){ got[ms[0]] = 1; SCOUT.jenny += ms[1]; e.bonus = ms[1]; mtLog(`${c.name} ${ms[2]}: the Association pays you ${fmt(ms[1])} Jenny.`); } }
        Object.assign(e, mtBeat(c, ph, p, e)); tr.ph.push(e); }
    }
    if(c.status === 'Active' || c.status === 'Finalist'){
      if(c.mPost === 'aggressive' && !c.injury && rng() < (mtKind(ph) === 'fight' ? 0.18 : 0.1)){ const j = injure(S, c, p, rng); if(j) log(S, p, 'story', `Pushing too hard, ${c.name} picks up a ${c.injury.w}.`, [c.id], true); }
      if(c.mFat != null && c.fatigue > c.mFat){ const gain = c.fatigue - c.mFat; c.fatigue -= gain * ((c.mPost === 'cautious' ? .25 : 0) + (c.mLesson === 'grit' ? .3 : 0)); }
    }
    delete c.mFat; delete c.mAllies; delete c.mAp;
    if(c.mBoost){ MT_FIGHT_A.forEach(k => c.a[k] -= c.mBoost); delete c.mBoost; }
  });
}
// one short beat per phase, built from what really happened and answering the order you gave; big pools so it never feels canned
const MT_SAY = {
  post: {
    aggressive: ['Pushed hard from the first step.', 'Went straight for the front.', 'No holding back.', 'Shoved through the crowd without asking.', 'Ran like something was chasing {them}.', 'Took the risky line without blinking.', 'Set the pace for everyone else.', 'All teeth, no hesitation.', 'Hit the trial head-on.', 'Hungry, loud, and fast.'],
    cautious: ['Played it safe, start to finish.', 'Slow and careful.', 'Picked every step.', 'Watched first, moved later.', 'Let the reckless ones go first.', 'Took the long way round, and lived.', 'Never once rushed.', 'Kept {their} head while others lost theirs.', 'Patient as stone.', 'Did exactly enough, nothing more.'],
    allies: ['Looked for friends from the start.', 'Stayed close to the others.', 'Kept an eye out for partners.', 'Shared water with a stranger.', 'Moved with the group, not ahead of it.', 'Traded a joke, made a friend.', 'Helped someone up, and was helped back.', 'Never walked alone for long.', 'Learned three names before noon.', 'Chose company over speed.'],
    steady: ['Kept {their} own pace.', 'Head down, one step at a time.', 'Quiet and steady.', 'No drama. Just got it done.', 'Did what {they} came to do.', 'Calm the whole way.', 'Breathing even, eyes forward.', 'Unremarkable, in the best way.', 'Found a rhythm and kept it.', 'Another trial, another step closer.']
  },
  kind: {
    fight: ['Took a hit, gave two back.', 'Fists up the whole time.', 'Bruised knuckles, clear eyes.', 'Stood {their} ground.'],
    wits: ['Read the trick before anyone else.', 'Thought it through, twice.', 'Saw the trap and stepped around it.', 'Kept counting while others guessed.'],
    danger: ['Did not look down.', 'One wrong step away, the whole time.', 'Crossed where others turned back.', 'Shaking hands, steady feet.'],
    body: ['Legs burning, still moving.', 'Lungs on fire, still running.', 'Mud to the knees, still going.', 'Outlasted the ones who started fast.'],
    team: ['Held the team together.', 'Made the others believe.', 'Carried a slower teammate the last stretch.', 'Argued, then agreed, then won.']
  },
  best: ['Among the very best.', 'Near the front of the whole field.', 'The examiner noticed.', 'Others started to watch {them}.', 'Barely broke a sweat.'],
  hair: ['Scraped through. Barely.', 'One of the last to make it.', 'Through, by a whisker.', 'Made it with nothing to spare.', 'So close it hurt.'],
  hurt: ['Got through, but hurt: {w}.', 'Limping, but in: {w}.', 'Paid for it with a {w}.', 'Through, nursing a {w}.'],
  ally: ['Found {a}. They go on together.', 'Teamed up with {a}.', '{a} watches {their} back now.', 'A new partner: {a}.', 'Shook hands with {a}. An alliance.'],
  saved: ['Would have fallen. Someone reached back.', 'Pulled through by another hand.', 'Owes someone now.', 'Saved at the last second.'],
  outHair: ['Missed the cut by a hair.', 'So close. Not enough.', 'One more step would have done it.', 'Out by the smallest margin.'],
  out: ['Fell behind: {r} of {n}.', 'Could not keep up this time.', 'The trial was stronger today.', 'Out, but not broken.', 'Ran out of strength.', 'Not this year.'],
  dead: ['Did not come back.', 'The trial took {them}.', 'Gone.'],
  lic: ['Licensed. The lodge did it.', 'A Hunter now. Your Hunter.', 'Card in hand, grinning ear to ear.', 'From your lodge to the Association.']
};
function mtBeat(c, ph, p, e){
  const sc = c.scores && c.scores[ph.id], pool = sc == null ? [] : S.candidates.filter(o => o.scores && o.scores[ph.id] != null);
  const rank = sc == null ? null : pool.filter(o => o.scores[ph.id] > sc).length + 1, n = pool.length;
  const r = mtRng('beat' + p + c.id), P = PR(c), used = new Set(((MENTOR.appr.find(a => a.id === c.id) || {}).trail || {ph: []}).ph.map(x => x.say));
  const notes = (c.notes || []).filter(x => x.p === p).map(x => x.text).join(' | ');
  const newAlly = alliesOf(S, c).find(o => !(c.mAllies || []).includes(o.id));
  const fill = s => s.replace(/\{them\}/g, P.them).replace(/\{their\}/g, P.their).replace(/\{they\}/g, P.they).replace(/\{w\}/g, c.injury ? c.injury.w : 'wound')
    .replace(/\{a\}/g, newAlly ? (newAlly.first || newAlly.name) : 'a stranger').replace(/\{r\}/g, rank ? ordinal(rank) : '').replace(/\{n\}/g, fmt(n));
  const pick = a => { const L = a.filter(x => !used.has(fill(x)) && ![...used].some(u => u.indexOf(fill(x)) >= 0)); const z = L.length ? L : a; return z[Math.floor(r() * z.length)]; };
  let say;
  const q = !e.dil && !e.defy ? mtQuote(e, ph, r) : null;
  if(e.dil && e.k === 'ok') say = e.dil.say;
  else if(e.defy && e.k === 'ok') say = `Ignored your order. Did it ${P.their} way.`;
  else if(q) say = q;
  else if(e.k === 'lic') say = pick(MT_SAY.lic);
  else if(e.k === 'dead') say = pick(MT_SAY.dead);
  else if(e.k === 'out' && PHASES[p] && PHASES[p].team) say = pick(['The team ran out of time, and took {them} with it.', 'Did {their} part. The team did not.', 'Out with the whole team.', 'The team never made it. Neither did {they}.'])
  else if(e.k === 'out') say = /by a hair/.test(c.reason || '') ? pick(MT_SAY.outHair) : pick(MT_SAY.out.filter(x => rank || x.indexOf('{r}') < 0));
  else if(/rescued by|thanks to ally/i.test(notes)) say = pick(MT_SAY.saved);
  else if(newAlly) say = pick(MT_SAY.ally);
  else if(e.inj) say = pick(MT_SAY.hurt);
  else if(rank && n > 20 && rank / n > 0.85) say = pick(MT_SAY.hair);
  else if(rank && n > 20 && rank / n <= 0.05) say = pick(MT_SAY.post[e.post] || MT_SAY.post.steady) + ' ' + pick(MT_SAY.best);
  else say = r() < 0.4 ? pick(MT_SAY.kind[mtKind(ph)] || MT_SAY.post.steady) : pick(MT_SAY.post[e.post] || MT_SAY.post.steady);
  return {say: e.dil && e.k === 'ok' || e.defy || q ? say : fill(say), rank, n, pct: rank && n ? Math.max(1, Math.round(rank / n * 100)) : null};
}
// once an exam ends: graduates, the fallen and the ones who will come back
function mtSettle(){
  if(!S.finished || MENTOR.settled === S.edition) return;
  MENTOR.settled = S.edition; const seats0 = mtSlots();
  mtHere().forEach(({a, c}) => {
    a.last = {ed: S.edition, status: c.status, out: c.out, reason: c.reason};
    a.snap = {ed: S.edition, age: c.age, gender: c.gender, tier: c.tier, a: {...c.a}, status: c.status, reason: c.reason, reached: (PHASES[c.out] || PHASES[PHASES.length - 1]).name, tries: attemptsOf(c), fall: c.fall || '',
      allies: (() => { const ids = new Set(); (a.trail && a.trail.ed === S.edition ? a.trail.ph : []).forEach(x => (x.with || []).forEach(id => ids.add(id))); alliesOf(S, c, false).forEach(o => ids.add(o.id)); const A = allianceOf(S, c); if(A) A.ever.forEach(id => ids.add(id)); ids.delete(c.id); const m = cmap(S); return [...ids].map(id => m[id]).filter(Boolean).map(o => ({id: o.id, n: o.first || o.name, s: o.status})); })(),
      lodgeA: (allianceOf(S, c) || {}).name || ''};
    if(c.status === 'Approved'){
      const r1 = /round 1\b/.test(c.reason || ''); a.status = 'grad'; a.ed = S.edition;
      MENTOR.renown += 3 + (r1 ? 2 : 0) + (a.exams <= 1 ? 1 : 0); SCOUT.jenny += MT_GIFT;
      mtLog(`${c.name} earned a Hunter License${r1 ? ' in the first round' : ''}! ${c.first || c.name} sends you ${fmt(MT_GIFT)} Jenny with a thank-you note.`);
    } else if(c.status === 'Deceased'){ a.status = 'fallen'; a.ed = S.edition; MENTOR.renown = Math.max(0, MENTOR.renown - 1); mtLog(`${c.name} died in the ${ordinal(S.edition)} exam. ${c.reason ? c.reason + '.' : ''}`); }
    else if(c.status === 'Disqualified' && !/kill/i.test(c.reason || '')){ a.status = 'left'; a.ed = S.edition; mtLog(`${c.name} was disqualified and left your lodge.`); }
    else { const zi = PHASES.findIndex(ph => ph.zevil); if(c.out != null && c.out >= zi) MENTOR.renown += 1; mtLog(`${c.name} fell in ${thePhaseUI(PHASES[c.out] || PHASES[PHASES.length - 1])} and will try again next year.`); }
  });
  if(mtSlots() > seats0){ MENTOR.newSeat = true; mtLog(`Your renown opens a new seat: the lodge has room for ${mtSlots() === 2 ? 'a second' : 'a third'} apprentice.`); }
  save();
}
// sponsored apprentices always come back next year
const mtForceReturn = () => { FORCE_RETURN = new Set(mtActive().map(a => a.id)); };

/* ---------- lodge UI ---------- */
function mentorHtml(){
  MENTOR.nen = (typeof NLAB !== 'undefined' && MT_NEN[NLAB.type]) ? NLAB.type : null;
  if(S.finished) return '';
  if(MENTOR.off) return '';
  if(S.started) return '';   // during the exam the orders live by the Run button, the report under the phase header
  const camps0 = mtHere().filter(({a}) => !mtCampFor(a).done).length, settled = MENTOR.made && mtActive().length && !camps0 && mtActive().length >= mtSlots();
  if(settled && !MENTOR.peek){ const H = mtHere(); return `<div class="mini-tk mt-mini">${mtChip()}<b>Your lodge</b><span class="muted">${H.length === 1 ? esc(H[0].c.first || H[0].c.name) + ' is' : H.length + ' apprentices are'} ready</span><span class="mini-r"><span class="muted mini-x">Renown ${MENTOR.renown}</span><button type="button" class="sc-link" data-mtpeek>Open</button></span></div>`; }
  if(!MENTOR.open){
    const camps = camps0;
    const sub = !MENTOR.made ? 'Sponsor a candidate and train them between exams.'
      : camps ? `Training camp is open: ${camps === 1 ? 'your apprentice has' : camps + ' apprentices have'} ${mtPtsLeft(mtCampFor(mtHere()[0].a))} points to spend.`
      : mtActive().length < mtSlots() ? `A free seat: three prospects are waiting.` : `${mtActive().length} apprentice${mtActive().length > 1 ? 's' : ''} ready.`;
    return `<div class="scout sc-bar sc-ticket mt-bar pre"><button type="button" class="tk-hide" data-mtoff title="Hide mentoring · you can bring it back from History" aria-label="Hide mentoring">×</button>${scTop(MENTOR.made ? 'Your Lodge' : "Mentor's Lodge", `${sub}`, `<button class="sc-go mt-go" data-mtopen>${camps ? 'Train' : 'Open lodge'}</button>`, MENTOR.made ? 'You · ' + mtTitle() : false, mtChip())}</div>`;
  }
  const x = `<button type="button" class="sc-x" data-mtclose aria-label="Close the lodge" title="Close">×</button>`;
  const here = mtHere(), free = mtActive().length < mtSlots();
  const camp = here.map(({a, c}) => { const cp = mtCampFor(a); if(cp.done) return ''; const left = mtPtsLeft(cp);
    const letter = mtLetter(a), fee = a.fee || MT_FEE;
    // no money for the camp: nothing to plan, only to accept
    if(!cp.paid && SCOUT.jenny < fee) return `<div class="mt-camp mt-broke"><div class="sc-ph"><span class="sc-num">◆</span><b>${esc(c.name)}</b><span class="sc-tag">${attemptsOf(c) > 1 ? 'Attempt ' + attemptsOf(c) : 'First exam'}</span>${scChance(scProb(c, 'lic'))}<button type="button" class="sc-link mt-rel" data-mtrel="${a.id}">${mtRelArm === a.id ? 'Click again to release' : 'Release'}</button></div>${letter ? `<p class="mt-letter">“${esc(letter)}”</p>` : ''}
      <p class="mt-brk">The camp costs ${fmtJ(fee)} and you have ${fmtJ(SCOUT.jenny)}. No camp this year: ${esc(c.first || c.name)} trains alone, with no points and no lesson.</p>
      <div class="sc-foot"><span class="mt-cost"><i>Short of Jenny</i></span><button class="sc-go" data-mtcamp="${a.id}">${esc(c.first || 'They')} trains alone</button></div></div>`;
    return `<div class="mt-camp"><div class="sc-ph"><span class="sc-num">◆</span><b>${esc(c.name)}</b><span class="sc-tag">${attemptsOf(c) > 1 ? 'Attempt ' + attemptsOf(c) : 'First exam'}</span>${scChance(scProb(c, 'lic'))}<button type="button" class="sc-link mt-rel" data-mtrel="${a.id}">${mtRelArm === a.id ? 'Click again to release' : 'Release'}</button></div>${letter ? `<p class="mt-letter">“${esc(letter)}”<small>a letter from ${esc(c.first || c.name)}</small></p>` : ''}
      <div class="mt-cb"><div class="sc-z"><div class="sc-lab">Training · <b class="mt-left">${left}</b> point${left === 1 ? '' : 's'} left</div>
        ${mtTracks(a).map(t => { const nen = t.k === 'nen', avg = nen ? Math.round(Math.min(100, (a.nenP || 0) / MT_AWAKEN * 100)) + '%' : Math.round(t.a.reduce((s, k) => s + c.a[k], 0) / t.a.length); return `<div class="mt-track${nen ? ' mt-nenrow' : ''}"><span class="mt-tl" title="${t.d}">${t.l}<small>${avg}</small></span><button type="button" class="mt-pm" data-mtpt="${a.id}" data-k="${t.k}" data-d="-1" ${cp.pts[t.k] ? '' : 'disabled'} aria-label="Less ${t.l}">−</button><span class="mt-pips">${Array.from({length: Math.max(MT_POINTS + 1, cp.pts[t.k] + 1)}, (_, i) => `<i class="${i < cp.pts[t.k] ? 'on' : ''}"></i>`).join('')}</span>${mtCanAdd(cp, t.k) || (cp.extra || 0) >= MT_EXTRA_MAX ? `<button type="button" class="mt-pm" data-mtpt="${a.id}" data-k="${t.k}" data-d="1" ${mtCanAdd(cp, t.k) ? '' : 'disabled'} aria-label="More ${t.l}">+</button>` : `<button type="button" class="mt-pm mt-buy" data-mtpt="${a.id}" data-k="${t.k}" data-d="1" ${mtCanBuy(cp) ? '' : 'disabled'} title="Buy an extra point for ${fmt(mtExtraCost(cp))} Jenny (${MT_EXTRA_MAX - (cp.extra || 0)} left this year)" aria-label="Buy an extra ${t.l} point">+${fmtJ(mtExtraCost(cp))}</button>`}<span class="mt-gain">${!cp.pts[t.k] ? '' : nen ? `→ ${Math.min(100, Math.round(((a.nenP || 0) + cp.pts.nen * mtTeach(a)) / MT_AWAKEN * 100))}%` : `+${cp.pts[t.k]} each`}</span></div>`; }).join('')}
</div>
        <div class="sc-z"><div class="sc-lab">Lesson of the year</div><div class="mt-lessons">${cp.offer.map(k => `<button type="button" class="mt-les${cp.lesson === k ? ' on' : ''}" data-mtles="${a.id}" data-k="${k}"><b>${MT_LESSONS[k].l}</b><small>${MT_LESSONS[k].d}</small>${MT_SIG[MENTOR.nen] === k ? '<span class="mt-sig">✦ Your signature lesson · stronger</span>' : ''}</button>`).join('')}</div></div></div>
      <div class="sc-foot"><span class="mt-cost">${cp.paid ? `Camp <i>paid on sponsoring</i>` : `Camp ${fmtJ(a.fee || MT_FEE)}${SCOUT.jenny < (a.fee || MT_FEE) ? ' <i>· short of Jenny: they train alone</i>' : ''}`}${cp.spent ? ` · extras ${fmtJ(cp.spent)}` : ''}<br><i>Skip it and ${esc(c.first || 'they')} plans the camp alone.</i></span><button class="sc-go" data-mtcamp="${a.id}" ${left > 0 || !cp.lesson ? 'disabled' : ''}>${left > 0 ? `Spend ${left} more` : !cp.lesson ? 'Pick a lesson' : 'Confirm camp'}</button></div></div>`; }).join('');
  const pros = free ? mtPool().map(({c, tag}) => `<div class="mt-pro"><span class="sc-tag">${tag}</span><b>${esc(c.name)}</b><small>${c.age} · ${esc(c.tier)}${attemptsOf(c) > 1 ? ` · attempt ${attemptsOf(c)}` : ''}</small><small class="muted">${topAttrs(c, 2).map(k => ATTR_LABEL[k]).join(' · ')}</small><p>“Wants to ${esc(mtDream(c))}.”</p>${scChance(scProb(c, 'lic'))}<button class="sc-go mt-take" data-mtrec="${c.id}" ${SCOUT.jenny < mtFeeOf(c) ? 'disabled' : ''}>${SCOUT.jenny < mtFeeOf(c) ? 'Needs' : 'Sponsor ·'} ${fmtJ(mtFeeOf(c))}</button><small class="mt-each">then ${fmtJ(mtFeeOf(c))} each exam for the camp</small></div>`).join('') : '';
  return `<div class="scout sc-ticket sc-open mt-open">${scTop('Your Lodge', `You are a retired ${MENTOR.nen ? mtNenWord(MENTOR.nen) : 'Hunter'} · ${mtActive().length}/${mtSlots()} apprentice${mtSlots() > 1 ? 's' : ''}${MENTOR.nen ? ` · signature lesson: ${MT_LESSONS[MT_SIG[MENTOR.nen]].l}` : ` · <button type="button" class="sc-link" data-mtnentab>Find your Nen type</button> to unlock a signature lesson`}. ${free ? 'Sponsored apprentices always come back if they fail.' : ''}`, x, 'You · ' + mtTitle(), mtChip())}
    ${mtSeatsHtml(!camp)}${camp}${free ? `<div class="sc-lab" style="margin-top:2px">Prospects this year</div><div class="mt-pros">${pros}</div>` : ''}${!camp && !free ? '<p class="muted" style="margin:0;font-size:13px">Camp done. Their first call is up top, under the trial; or just press Run.</p>' : ''}${mtFormerHtml()}</div>`;
}
// who you train now (with a quiet way to let them go) and everyone you trained before
let mtRelArm = null;
function mtRosterHtml(){
  const L = mtActive(); if(!L.length) return '';
  return `<div class="mt-roster">${L.map(a => `<span class="mt-ri"><i>◆</i><a data-id="${a.id}">${esc(a.name)}</a><span class="muted">since the ${ordinal(a.from)}</span><button type="button" class="sc-link" data-mtrel="${a.id}">${mtRelArm === a.id ? 'Click again to release' : 'Release'}</button></span>`).join('')}</div>`;
}
const MT_OUT = {grad: 'Hunter', fallen: 'Died', left: 'Disqualified', released: 'Released'};
function mtFormerHtml(){
  const L = MENTOR.appr.filter(a => a.status !== 'active'); if(!L.length) return '';
  return `<div class="mt-former"><span class="sc-lab">Former apprentices</span>${L.slice().reverse().map(a => `<span class="mt-fi st-${a.status}"><a data-id="${a.id}">${esc(a.name)}</a><small>${MT_OUT[a.status] || ''}${a.ed ? ' · ' + ordinal(a.ed) : ''}</small></span>`).join('')}</div>`;
}
// paused for a choice: open the chip's menu and nudge it
function mtScrollDil(id){ showTab('phase'); const el = document.getElementById('mtDil-' + id) || document.querySelector('.mt-dpanel'); if(!el) return; el.scrollIntoView({behavior: 'smooth', block: 'center'}); el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); }
function mtAsk(){ const h = mtHere().find(({a, c}) => { const d = mtDilFor(a, c); return d && d.choice == null; }); if(!h) return; selPhase = lastDone(); render(); mtScrollDil(h.a.id); const b = document.querySelector('.mt-cbtn.ask'); if(b){ b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); } }
// right after Run: a two-second whisper above the chip with what just happened
function mtToast(p){
  const el = $('mtCtl'); if(!el || p == null) return;
  const L = MENTOR.appr.map(a => a.trail && a.trail.ed === S.edition && a.trail.ph.find(x => x.p === p) && {a, e: a.trail.ph.find(x => x.p === p)}).filter(Boolean); if(!L.length) return;
  const old = document.querySelector('.mt-toast'); if(old) old.remove();
  const d = document.createElement('div'); d.className = 'mt-toast';
  d.innerHTML = L.map(({a, e}) => `<span class="k-${e.k}"><i>◆</i>${esc(a.name.split(' ')[0])} · ${e.k === 'ok' ? 'Through' : e.k === 'lic' ? 'Licensed ✦' : e.k === 'dead' ? 'Died' : 'Out'}${e.k === 'ok' && e.rank ? ` · ${ordinal(e.rank)}` : ''}${e.bonus ? ` · <b class="mt-gold">+${fmtJ(e.bonus)}</b>` : ''}</span>`).join('');
  const b = el.querySelector('.mt-cw') || el; b.appendChild(d);
  const hb = document.querySelector('.mt-hint-b'); if(hb) hb.style.visibility = 'hidden';
  setTimeout(() => d.classList.add('go'), 2200); setTimeout(() => { d.remove(); const h2 = document.querySelector('.mt-hint-b'); if(h2) h2.style.visibility = ''; }, 2700);
}
/* ---------- the mentor's drawer (phones): the next call lives by the Run button, with just enough about the trial to make it ---------- */
let DRAWER_OPEN = false, DRAWER_AT = null;
function drawerCall(a, c){
  const ph = PHASES[S.phase]; if(!ph) return null;
  if(S.live){
    if(S.live.kind === 'zevil'){ const {Z, snap, d} = liveZ(); if(!Z || !snap || (snap.gone || {})[c.id]) return null; const pts = liveZPts(Z, snap, c.id), own = Object.keys(snap.hold).find(k => (snap.hold[k] || []).includes(c.id)), k = (S.live.st[c.id] || [])[d + 1] || liveZDefault(c, pts, own && own !== c.id);
      return {ctx: `Day ${d + 1} morning`, l: (ZOPT.find(o => o.k === k) || {}).l, mine: !!(S.live.st[c.id] || [])[d + 1]}; }
    const g = liveGate(); if(!g || g.id !== c.id) return null; const o = cmap(g.P.S)[g.opp], k = (S.live.st[c.id] || [])[g.n - 1] || liveFDefault(c);
    return {ctx: `vs ${o ? o.first : '?'}`, l: (FOPT.find(x => x.k === k) || {}).l, mine: false};
  }
  const d = mtDilFor(a, c);
  if(d && !d.done){ const D = mtDilDef(d), dk = Math.max(0, D.opts.findIndex(x => x.lean === mtLean(c))); return {ctx: 'a choice', l: D.opts[d.choice != null ? d.choice : dk].l, mine: d.choice != null}; }
  const I = mtApInfo(a, c, S.phase); if(!I) return null; const k = mtApK(a, c, S.phase);
  return {ctx: ph.name, l: I.opts.find(o => o.k === k).l, mine: !!mtApMine(a, S.phase)};
}
function drawerBrief(){
  const ph = PHASES[S.phase]; if(!ph) return '';
  return `<div class="md-brief" data-biome="${biomeOf(ph.id)}" data-ch="${ph.stage ? String(ph.stage) : '序'}">${drawerBriefIn(ph)}</div>`;
}
function drawerBriefIn(ph){
  if(S.live && S.live.kind === 'zevil'){ const {Z, snap, d} = liveZ(); const left = Z ? Z.ids.filter(id => !(snap.gone || {})[id]).length : 0;
    return `<b>Zevil Island</b><span class="md-day">Day ${d + 1} of 7 · ${left} still hunting</span><p>Hunt badges: your own or your target's are worth 3, any other 1. Six points to leave the island.</p>`; }
  if(S.live && S.live.kind === 'final') { const g = liveGate(); return `<b>Final Tournament</b>${g ? `<span class="md-day">Bout ${g.n}</span>` : ''}<p>Win once and you are a Hunter. Lose, and you fight again; only the last loser fails. Killing means disqualification.</p>`; }
  const ex = ph.ex, st = ex && EX_STYLES[ex.style];
  return `<b>${esc(ph.name)}</b><p>${esc(PREVIEW[ph.id] || '')}</p>${phTests(ph)}${ex ? `<small class="md-ex"><span class="exs ${ex.style}" title="${esc(ex.style)}">Examiner</span> ${esc(ex.name)}${st && st.desc ? ': ' + esc(st.desc.replace(/^\w+ — /, '')) : ''}</small>` : ''}`;
}
// an apprentice whose exam just ended gets a short farewell before the card lets them go
const MT_BYE = {
  out: ['{F} walks out on {their} own feet. The lodge keeps {their} bed made.', 'Back to the lodge, then. There is always next year.', '{F} does not look back at the gate. You do.', 'One more year of training. {F} is already planning it.', 'The exam is over for {them}. The lessons are not.', 'You will hear about this one at dinner, for a long time.'],
  dead: ['The lodge lights a candle tonight.', '{F} does not come home. The training yard is very quiet.', 'You taught {them} to stand. {F} stood to the end.'],
  dq: ['Disqualified. {F} will have to answer for it, at the lodge and elsewhere.', 'The examiners have seen enough of {F} this year. So have you.'],
  lic: ['A Hunter. The lodge has one more name on the wall.', '{F} holds the card up to the light, then looks for you in the crowd.']
};
function mtByes(){
  if(MENTOR.off || !MENTOR.made) return [];
  const L = mtHere(); const lastP = Math.max(-1, ...L.map(({a}) => { const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : []; return tr.length ? tr[tr.length - 1].p : -1; }));
  if(lastP < 0 || MENTOR.byeSeen === S.edition + ':' + lastP) return [];
  return L.map(({a, c}) => { const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : [], e = tr[tr.length - 1]; return e && e.p === lastP && e.k !== 'ok' ? {a, c, e} : null; }).filter(Boolean);
}
const mtByeP = () => { const B = mtByes(); return B.length ? B[0].e.p : -2; };
function mtByeHtml(){
  const B = mtByes(); if(!B.length) return '';
  return B.map(({a, c, e}, i) => { const F = c.first || c.name, P = PR(c), k = e.k === 'lic' ? 'lic' : e.k === 'dead' ? 'dead' : c.status === 'Disqualified' ? 'dq' : 'out';
    const pool = MT_BYE[k], line = pool[nhash(a.id + S.edition + 'bye') % pool.length].replace(/\{F\}/g, F).replace(/\{their\}/g, P.their).replace(/\{them\}/g, P.them);
    const why = k === 'lic' ? `Licensed in the ${esc(PHASES[e.p].name)}.` : k === 'out' ? esc(mtWhy(c, e)) : esc(clean(c.reason || '').replace(/\.$/, '')).replace(/^(\w)/, x => x.toUpperCase()) + '.';
    const quote = e.say && /^“/.test(e.say) ? `<p class="by-q">${esc(e.say)}</p>` : '';
    return `<div class="mt-bye k-${k}"><div class="by-h"><span>◆ ${esc(F)}</span><em>${k === 'lic' ? 'Hunter ★' : k === 'dead' ? 'Died · ' : 'Out · '}${k === 'lic' ? '' : esc(PHASES[e.p].name)}</em></div><p class="by-w">${why.replace(/\.\.$/, '.')}</p>${quote}<p class="by-e">${esc(line)}</p>${(() => { const tr = a.trail && a.trail.ed === S.edition ? a.trail.ph : []; return tr.length > 1 ? `<p class="by-road">${tr.length > 3 ? '… ' : ''}${tr.slice(-3).map(x => `<span class="${x.k === 'ok' ? '' : 'end'}">${esc(PHASES[x.p].name)}</span>`).join(' → ')}${tr.length > 3 ? ` <span class="muted">· ${tr.length} trials</span>` : ''}</p>` : ''; })()}${i === B.length - 1 ? `<button type="button" class="sc-link by-x" data-mtbye>Let ${B.length > 1 ? 'them' : esc(F)} go</button>` : ''}</div>`; }).join('');
}
