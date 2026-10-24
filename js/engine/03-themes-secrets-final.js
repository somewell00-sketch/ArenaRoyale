/* ===== Theme of the year: every exam gets its own identity and one twist ===== */
let THEME = 'classic';
const THEMES = {
  classic:{name:'By the Book', w:14, desc:'The Association seems to want an ordinary year.', ann:'The Chairman promises nothing special this year. Some candidates find that more worrying than a threat.'},
  storm:{name:'Season of Black Clouds', w:10, desc:'The sky has not cleared in weeks.', ann:'Storm warnings everywhere. The Chairman shrugs: "Hunters do not wait for good weather."'},
  whim:{name:"The Chairman's Dice", w:10, desc:'The Chairman is in a playful mood. That is rarely good news.', ann:'The Chairman smiles a little too much at the opening ceremony and says he has "a few surprises" planned.'},
  blood:{name:'The Crimson Ledger', w:8, desc:'Some of the examiners chosen this year have a reputation.', ann:'Older candidates go quiet when they hear who the examiners are.'},
  jubilee:{name:'Golden Gates', w:8, desc:'Banners and music at the gate. The Association is celebrating something.', ann:'Banners everywhere and free food at the gate. The examiners look almost cheerful.'},
  rookie:{name:'New Leaves', w:9, desc:'The routes look unfamiliar, even to those who have been here before.', ann:'Veterans grumble: none of the routes look the way they remember them.'},
  oldguard:{name:'Old Ghosts', w:8, desc:'So many familiar faces in the crowd.', ann:'Half the crowd seems to know each other already. Old faces, old grudges.'},
  silence:{name:'Closed Hands', w:8, desc:'Something has made everyone wary of everyone else.', ann:'"Nobody will help you here," the Chairman says. "Not even your friends, if they are smart."'},
  friendship:{name:'The Red Thread', w:9, desc:'Strangers seem strangely drawn to each other this year.', ann:'Something in the air this year: strangers become friends faster than anyone can explain.'},
  shadows:{name:'Masks in the Crowd', w:8, desc:'Not everyone here is who they claim to be.', ann:'The Chairman warns: "Not everyone here is who they claim to be."'},
  wild:{name:'Teeth and Thorns', w:8, desc:'The land itself seems angry this year.', ann:'Every creature on the route seems angrier than usual, and the paths are worse than anyone remembers.'}
};
// a line of atmosphere at the start of each phase, so the theme is felt rather than announced
const THEME_LINES = {
  storm:[o => `Rain hammers the candidates all through ${o.ph}.`, o => `Thunder rolls over ${o.ph}. Nobody can hear the examiner's instructions twice.`, o => `The wind turns ${o.ph} into something much worse.`],
  whim:[o => `The Chairman watches ${o.ph} from a deckchair, rolling a pair of dice.`, o => `Before ${o.ph}, the Chairman whispers something to the examiner. The examiner sighs.`],
  blood:[o => `The examiner lets things go further than the rules allow in ${o.ph}.`, o => `Medics are already waiting at the end of ${o.ph}. A bad sign.`, o => `Nobody stops the fights in ${o.ph} until it is far too late.`],
  jubilee:[o => `Music plays at the start of ${o.ph}. Even the examiner hums along.`, o => `The examiner hands out water before ${o.ph}. Unheard of.`],
  rookie:[o => `The veterans' old tricks are useless in ${o.ph}: everything has been rebuilt.`, o => `First-timers seem oddly at home in ${o.ph}.`],
  oldguard:[o => `Old rivals nod at each other at the start of ${o.ph}.`, o => `"Same as last time," a veteran mutters before ${o.ph}. It is not.`],
  silence:[o => `Nobody talks during ${o.ph}. Nobody shares anything either.`, o => `In ${o.ph}, candidates walk past each other's mistakes without a word.`],
  friendship:[o => `Strangers share food and stories on the way to ${o.ph}.`, o => `Laughter at the start of ${o.ph}. It is that kind of year.`],
  shadows:[o => `Someone has been going through the candidates' bags before ${o.ph}.`, o => `Whispers and false names everywhere around ${o.ph}.`],
  wild:[o => `Something big moves in the undergrowth around ${o.ph}.`, o => `The ground itself seems to fight the candidates in ${o.ph}.`, o => `Thorns, teeth and loose rocks: ${o.ph} is in a foul mood.`]
};

function pickTheme(seed){
  const ids = Object.keys(THEMES), tot = ids.reduce((s, k) => s + THEMES[k].w, 0);
  let r = (nhash('theme' + seed) % 10000) / 10000 * tot;
  for(const k of ids){ r -= THEMES[k].w; if(r <= 0) return k; }
  return 'classic';
}
let SPECIAL = null;
const themeEase = () => (THEME === 'jubilee' ? 2.5 : THEME === 'blood' ? -1.5 : 0) + (SPECIAL === 'jubilee' ? -1.5 : SPECIAL === 'centenary' ? -2.5 : 0);

/* ===== Secrets: a few candidates hide something that surfaces mid-exam ===== */
const SECRETS = {
  assassin:{label:'Heir of an assassin family', ok: a => a.combat >= 60 && a.agility >= 55},
  hunterchild:{label:'Child of a legendary Hunter', ok: () => true},
  spy:{label:'Spy for a crime syndicate', ok: a => a.strategy >= 55},
  royal:{label:'Royal heir in disguise', ok: a => a.charisma >= 55},
  debtor:{label:'On the run from dangerous lenders', ok: () => true},
  undercover:{label:'Undercover examiner', ok: a => T_SUM(a) >= 620},
  amnesia:{label:'Lost {their} memory before the exam', ok: () => true}
};
const T_SECRET = {
  assassin:[o => `The truth about ${o.c.name} comes out: heir to a family of professional assassins. Several candidates quietly move their sleeping spots.`, o => `${o.c.name} moves too fast and too quietly. Someone finally recognises the family name: assassins, for generations.`],
  hunterchild:[o => `It turns out ${o.c.name} is the child of ${o.c.hParentName || 'a legendary Hunter'}${o.c.hParentName ? (o.c.hParentGone ? ', a legend the Association still talks about' : ', one of the most famous Hunters alive') : ''}. Some candidates are impressed. Others are furious.`, o => `An examiner lets it slip: ${o.c.name}'s parent is ${o.c.hParentName || 'one of the most famous Hunters alive'}.`],
  spy:[o => `${o.c.name} is caught passing notes to an outsider: a spy for a crime syndicate.`, o => `A coded message falls out of ${o.c.name}'s pack. The syndicate sent ${PR(o.c).them}.`],
  royal:[o => `A signet ring gives ${o.c.name} away: a royal heir, travelling under a false name.`, o => `Two bodyguards in plain clothes are spotted shadowing ${o.c.name}. The candidate is royalty.`],
  debtor:[o => `Men in suits appear at the edge of the route asking for ${o.c.name}. The debt has found ${PR(o.c).them}.`, o => `${o.c.name} goes pale: the lenders ${PR(o.c).they} ran from have tracked ${PR(o.c).them} to the exam.`],
  undercover:[o => `${o.c.name} takes off a fake badge and salutes the examiners: an undercover examiner all along. Nobody saw it coming.`, o => `Plot twist: ${o.c.name} was never a candidate. ${PR(o.c).They} ${PR(o.c).were} the Association's eyes inside the crowd.`],
  amnesia:[o => `In the middle of ${o.ph}, ${o.c.name} suddenly remembers who ${PR(o.c).they} ${PR(o.c).are}, and why ${PR(o.c).they} came.`, o => `Something in ${o.ph} brings ${o.c.name}'s memory back all at once. ${PR(o.c).They} sit${PR(o.c).s} down and cr${PR(o.c).ies}, then keep${PR(o.c).s} going.`]
};
function setupTheme(S){
  THEME = S.theme || 'classic';
  const T = THEMES[THEME]; if(!T) return;
  log(S, 0, 'major', `${T.name}: ${T.ann}`, []);
  S.log.unshift(S.log.pop());   // the year's tone opens the exam, before anything else that happened on arrival
  if(THEME === 'whim' && S.whimPs === undefined){ const L = lineupOf(S); const opts = L.map((ph, i) => ph.stage >= 1 && ph.stage <= 3 && !ph.team ? i : -1).filter(i => i >= 0).sort((a, b) => nhash(S.seed + 'w' + a) - nhash(S.seed + 'w' + b)); S.whimPs = opts.slice(0, 2); }
  if(THEME === 'blood' && !S.bloodDone){ (S.phaseSpec || []).forEach((sp, i) => { if(sp.ex && nhash(S.seed + 'bl' + i) % 2) sp.ex.style = 'Cruel'; }); S.bloodDone = true; _lineups.delete(S); useLineup(S); }
}
// people with a secret are rarely ordinary: they arrive trained for the life they hide
const SECRET_PROFILE = {
  assassin:{tier:'Elite', boost:{combat:12, agility:10, speed:8, perception:6}},
  hunterchild:{tier:'Elite', boost:{determination:8, courage:6, endurance:4}},
  undercover:{tier:'Elite', boost:{perception:8, strategy:6}},
  spy:{tier:'Skilled', boost:{strategy:10, perception:8, intelligence:5}},
  royal:{tier:'Skilled', boost:{charisma:12, intelligence:6}},
  debtor:{tier:'Trained', boost:{speed:6, determination:6}},
  amnesia:{tier:'Trained', boost:{determination:4}}
};
const TIER_MEAN = {Ordinary: 44, Trained: 50, Skilled: 56, Elite: 61};
function setupSecrets(S){
  const n = Math.max(2, Math.round(S.candidates.length * 0.006 * (S.theme === 'shadows' ? 2 : 1)));
  if(S.candidates.some(c => c.secret && c.secret.ed === undefined && !c.secret.revealed && (c.attempts || []).length <= 1)) return;   // already set up (restart)
  const pool = S.candidates.filter(c => !c.secret && (c.attempts || []).length <= 1).sort((a, b) => nhash(a.id + 'sec') - nhash(b.id + 'sec'));
  const kinds = Object.keys(SECRETS);
  pool.slice(0, n).forEach(c => {
    const k = kinds[nhash(c.id + 'sk') % kinds.length], pr = SECRET_PROFILE[k];
    if(TIER_MEAN[pr.tier] > TIER_MEAN[c.tier]){
      const lift = TIER_MEAN[pr.tier] - TIER_MEAN[c.tier];
      Object.keys(c.a).forEach(x => c.a[x] = clamp(c.a[x] + lift, 1, 98)); c.tier = pr.tier;
    }
    Object.entries(pr.boost).forEach(([x, v]) => c.a[x] = clamp(c.a[x] + v, 1, 98));
    if(c.attempts && c.attempts[0]) c.attempts[0].tier = c.tier;
    c.trait = undefined; persona(c);   // personality follows the new profile
    c.secret = {k, revealed: false};
  });
}
function revealSecret(S, c, p, rng){
  const sc = c.secret; if(!sc || sc.revealed) return;
  sc.revealed = true; sc.ed = S.edition;
  const ph = PHASES[p];
  dlog(S, p, 'secret', vpick(S, T_SECRET[sc.k], c.id)({c, ph: thePhase(ph.name)}), [c.id], 8);
  c.notes.push({p, text:`Secret revealed: ${pro(SECRETS[sc.k].label, c).toLowerCase()}`});
  const live = S.candidates.filter(o => o !== c && o.status === 'Active');
  if(sc.k === 'assassin'){
    if(!c.nick){ c.nick = vpick(S, ['the Silent Heir','the Family Blade','the Quiet Killer','the Shadow Child'], c.id); c.nickWhy = 'for the family secret that came out'; c.nickEd = S.edition; }
    alliesOf(S, c).filter(o => !bonded(o, c) && !isRelative(o, c) && rng() < 0.3).forEach(o => leaveAlliance(S, o, p, `${o.name} wants nothing to do with an assassin and leaves.`, 'split'));
  } else if(sc.k === 'hunterchild'){
    const j = live[Math.floor(rng() * live.length)]; if(j) addGrudge(j, c, 'got everything handed to {them} by a famous parent');
    c.bondFire = p + 1;
  } else if(sc.k === 'spy'){
    if(rng() < 0.35){ c.status = 'Disqualified'; c.out = p; c.reason = `${ph.name}: exposed as a syndicate spy and expelled`; dlog(S, p, 'secret', `${ph.ex ? ph.ex.name : 'The examiner'} expels ${c.name} on the spot.`, [c.id], 7); }
    else { alliesOf(S, c).forEach(o => addGrudge(o, c, 'turned out to be a syndicate spy')); if(c.alliance) leaveAlliance(S, c, p, `${c.name} is thrown out of ${PR(c).their} alliance.`, 'split'); }
  } else if(sc.k === 'royal'){
    live.filter(o => !o.alliance && Math.abs(o.reg - c.reg) < 60).slice(0, 2).forEach(o => { if(rng() < 0.5) formAlliance(S, p, o, c, 'eager to be close to royalty', rng); });
  } else if(sc.k === 'debtor'){
    c.debtHit = p + 1;
  } else if(sc.k === 'undercover'){
    c.status = 'Eliminated'; c.out = p; c.reason = `${ph.name}: revealed as an undercover examiner and left the candidate list`; c.noReturn = true;
  }
}
function secretsAfter(S, ph, p, rng){
  if(p === 0) return;
  const chance = S.theme === 'shadows' ? 0.4 : 0.28;
  S.candidates.forEach(c => { if(c.status === 'Active' && c.secret && !c.secret.revealed && rng() < chance) revealSecret(S, c, p, rng); });
}

/* ===== Final Tournament: pre-match stories, friends who refuse to hurt each other ===== */
const T_PRE_GRUDGE = [o => `Before the bell, ${o.a.name} stares down ${o.b.name}. This one is personal: ${o.b.first} ${o.why}.`, o => `${o.a.name} has waited a long time for this: ${o.b.name} ${o.why}.`];
const T_PRE_TALK = [o => `${o.a.name} tells ${o.b.name} exactly how this will end. Loudly.`, o => `${o.a.name} blows a kiss to the crowd and points at ${o.b.name}: "You're next."`, o => `${o.a.name} cracks ${PR(o.a).their} knuckles and grins at ${o.b.name}. ${o.b.first} does not grin back.`];
const T_PRE_BOND = [o => `The bracket pairs ${o.a.name} with ${o.b.name}. Friends, forced to fight. The arena goes quiet.`, o => `${o.a.first} and ${o.b.first} step into the ring together and look at each other for a long time.`];
const T_FORFEIT = [o => `${o.l.name} raises a hand before the first blow: "I won't fight ${o.w.first}." ${o.w.name} wins by forfeit.`, o => `${o.l.name} simply walks out of the ring. Hurting ${o.w.first} is not an option.`];
const T_AFTER_BOND = [o => `${o.w.name} helps ${o.l.name} up and does not let go of ${PR(o.l).their} hand for a while.`, o => `After the match, ${o.w.first} and ${o.l.first} leave the arena side by side, as if nothing happened.`];
// what is at stake grows every round: each loss is one chance gone
function stakesLine(S, A, B, ctx){
  const k = A.id + B.id, pick = arr => arr[nhash(k + 'st') % arr.length];
  if(ctx.prelim) return null;   // the stakes are explained once, in the section header
  if(ctx.root) return pick([`The last match. ${A.name} and ${B.name} have lost every chance but this one. Whoever falls leaves with nothing.`, `Everything comes down to this: ${A.name} against ${B.name}. One license left, and one of them will not get it.`, `The arena goes silent for the last match. ${A.first} and ${B.first} both know there is no next round.`]);
  const worn = [A, B].filter(c => (c.losses || 0) >= 1).sort((x, y) => (y.losses || 0) - (x.losses || 0))[0];
  if(worn) return pick([`${worn.name} has already lost ${worn.losses === 1 ? 'once' : worn.losses + ' times'}. Every defeat brings ${worn.first} closer to the edge.`, `For ${worn.name}, ${worn.losses === 1 ? 'one loss' : worn.losses + ' losses'} in, the margin for error is gone.`, `${worn.name} cannot afford many more of these.`]);
  return null;
}
// how the bout felt, read from the exchanges: quick, close, long, a comeback or a rout
function intensityLine(r, A, B){
  const ex = (r.ex || []).filter(e => e.ha !== undefined), last = ex[ex.length - 1]; if(!last || r.how === 'forfeit') return null;
  const wA = r.w === A, wh = wA ? last.ha : last.hb, lh = wA ? last.hb : last.ha;
  let swings = 0, prev = 0; ex.forEach(e => { const d = Math.sign(e.ha - e.hb); if(d && prev && d !== prev) swings++; if(d) prev = d; });
  const mid = ex[Math.floor(ex.length / 2)], trailed = mid && ((wA ? mid.hb - mid.ha : mid.ha - mid.hb) >= 28);
  const w = r.w, l = r.l, k = w.id + l.id, pick = arr => arr[nhash(k + 'in') % arr.length];
  if(trailed || swings >= 3) return pick([`${w.first} was losing badly, then turned it around.`, `Nobody saw ${w.first}'s comeback coming, least of all ${l.first}.`, `The lead changes hands ${swings || 2} times before ${w.first} finally takes it.`]);
  if(r.rounds <= 3 && r.how === 'knockout') return pick([`Over almost before it began.`, `${l.first} never gets going. Three exchanges, and it is done.`]);
  if(wh <= 35) return pick([`${w.first} wins on ${PR(w).their} last legs, barely standing.`, `Both are bleeding by the end. ${w.first} just has a little more left.`, `It could have gone either way until the very last blow.`]);
  if(r.rounds >= 10) return pick([`A long, brutal fight that leaves both of them exhausted.`, `It goes the distance. The crowd is as tired as the fighters.`]);
  if(wh >= 85 && lh <= 40) return pick([`${w.first} barely takes a scratch.`, `A one-sided fight from start to finish.`]);
  return null;
}
/* a bout told in beats: who they are, how it went, the moment, how it ended, what it leaves */
const BOUT_STYLE = {
  strength: ['a brawler', 'hits like a door slamming shut'], agility: ['a dancer', 'is never quite where the punch lands'],
  strategy: ['a schemer', 'fights three moves ahead'], combat: ['a technician', 'wastes nothing'], determination: ['a wall', 'simply refuses to fall']
};
const BOUT_CLASH = {
  'strength|agility': ['One clean hit would end it. The whole fight is about whether it ever lands.', 'Power against speed, the oldest argument in the arena.'],
  'strength|strategy': ['Muscle against a plan. The plan has to work every single time.', 'One of them thinks; the other does not need to.'],
  'strength|combat': ['Raw force against clean form.', 'A sledgehammer against a scalpel.'],
  'strength|determination': ['Something heavy meets something that will not move.', 'Two people who only know how to go forward.'],
  'agility|strategy': ['Speed against patience. Someone will run out first.', 'One of them is fast; the other already knows where they will be.'],
  'agility|combat': ['Footwork against form, and it is beautiful to watch.', 'Neither lets the other set their feet.'],
  'agility|determination': ['The fast one lands ten blows. The stubborn one only needs one.', 'Speed against stubbornness.'],
  'strategy|combat': ['A chess game with fists.', 'Clean technique against a mind that is always one step ahead.'],
  'strategy|determination': ['A plan against a will. The will does not read plans.', 'Every trap works. The trouble is, nothing stops them.'],
  'combat|determination': ['Perfect form against pure refusal.', 'The better fighter against the one who will not quit.']
};
function boutTale(r, A, B, ctx){
  const ex = (r.ex || []).filter(e => e.ha !== undefined), last = ex[ex.length - 1]; if(!last || r.how === 'forfeit') return null;
  if(r.tactical) return `${r.l.first} looks at ${r.w.first}, looks at the bracket, and raises a hand before a single blow. A loss now, a fresh body for the next round. The crowd boos; the examiners take note.`;
  const w = r.w, l = r.l, k = w.id + l.id, P = c => PR(c), h = s => nhash(k + s);
  const pick = (arr, s) => arr[h(s) % arr.length];
  const sty = c => ['strength', 'agility', 'strategy', 'combat', 'determination'].sort((x, y) => c.a[y] - c.a[x])[0];
  const sA = sty(A), sB = sty(B), L = [], star = !!(ctx && ctx.star);
  // for the Centennial Star: nothing to survive, everything to prove
  if(star) L.push(ctx.round === 'Final' ? pick([`The whole Association is watching. Whoever wins starts a career with a star already on the license.`, `No license at stake, no second chance needed: only the Centennial Star, and a hundred years of history watching.`, `Two new Hunters, one star. Neither of them has anything left to lose, which is exactly why it matters.`], 'st0') : pick([`Nobody fails today. They fight for the right to stand in the final, and for nothing else.`, `Both already hold a license. What they fight for now is a name.`, `A bout without fear in it: just pride, and an audience.`], 'st0'));
  // who they are
  if(sA === sB) L.push(pick([`Two of a kind: both ${BOUT_STYLE[sA][0].replace(/^an? /, '')}s, and neither will give an inch.`, `Mirror match. Both ${BOUT_STYLE[sA][0].replace(/^an? /, '')}s, both waiting for the other to blink.`], 'same'));
  else { const key = [sA, sB].sort((x, y) => Object.keys(BOUT_STYLE).indexOf(x) - Object.keys(BOUT_STYLE).indexOf(y)).join('|');
    L.push(`${A.first} ${BOUT_STYLE[sA][1]}; ${B.first} ${BOUT_STYLE[sB][1]}. ${pick(BOUT_CLASH[key] || ['Two styles, one ring.'], 'clash')}`); }
  // what they carry in
  const ctxs = [];
  [A, B].forEach(c => { const o = c === A ? B : A;
    if(c.injury) ctxs.push(`${c.first} fights on the ${c.injury.w}, and ${o.first} knows exactly where it is.`);
    if((c.fatigue || 0) > 55) ctxs.push(`${c.first} arrives running on empty after Zevil Island.`);
    if(c.nick && h('nick' + c.id) % 2) ctxs.push(`Half the crowd is chanting "${c.nick}".`);
    if((c.attempts || []).length > 2) ctxs.push(`${c.first} has waited ${(c.attempts || []).length} exams for this ring.`); });
  if(Math.abs(A.age - B.age) >= 12){ const o = A.age > B.age ? A : B, y = o === A ? B : A; ctxs.push(`${o.age - y.age} years between them: ${o.first} was fighting before ${y.first} could walk.`); }
  if(star){ ctxs.length = 0;
    if((A.bonds || []).some(b => b.id === B.id)) ctxs.push(`They passed the exam side by side. Today one of them has to win.`, `Best friends, forced to try their hardest against each other. Both are grinning.`);
    ctxs.push(`A few days ago they were fighting to survive. Today it is only about pride.`, `Neither has slept properly since the exam ended. Neither cares.`);
    if(A.nen && B.nen) ctxs.push(`Both woke their Nen days ago. Neither knows yet what the other can do.`); }
  if(ctxs.length) L.push(ctxs[h('ctx') % ctxs.length]);
  // how it went
  const wA = w === A, wh = wA ? last.ha : last.hb, lh = wA ? last.hb : last.ha;
  let swings = 0, prev = 0; ex.forEach(e => { const d = Math.sign(e.ha - e.hb); if(d && prev && d !== prev) swings++; if(d) prev = d; });
  const mid = ex[Math.floor(ex.length / 2)], trailed = mid && ((wA ? mid.hb - mid.ha : mid.ha - mid.hb) >= 28);
  const dmg = ex.reduce((s, e) => s + (e.dmg || 0), 0), brutal = dmg >= 150 || (r.rounds >= 9 && wh <= 45);
  if(trailed) L.push(pick([`For half the fight ${l.first} is winning, and winning easily. Then ${w.first} finds something.`, `${w.first} is down, then down further, then suddenly not down at all.`, `Nobody gives ${w.first} a chance at the halfway mark, least of all ${l.first}.`], 'arc'));
  else if(swings >= 3) L.push(pick([`The lead changes hands ${swings} times. Every time one of them looks finished, they are not.`, `Back and forth, back and forth: ${swings} times the fight turns.`], 'arc'));
  else if(r.rounds <= 3) L.push(pick([`It is over almost before the crowd has sat down.`, `${r.rounds} exchanges. That is all it takes.`, `${l.first} never gets going.`], 'arc'));
  else if(r.rounds >= 10) L.push(pick([`It goes on, and on. By the end both of them are moving like old men.`, `A long war of a fight. The crowd stops cheering and just watches.`, `${r.rounds} exchanges, and every one of them hurts.`], 'arc'));
  else if(wh >= 85 && lh <= 40) L.push(pick([`${w.first} barely takes a scratch. It is less a fight than a lesson.`, `One-sided from the first exchange to the last.`], 'arc'));
  else if(wh <= 35) L.push(pick([`Both are bleeding by the end. ${w.first} just has a little more left.`, `It could have gone either way until the very last blow.`], 'arc'));
  else L.push(pick([`They trade evenly for a while, feeling each other out.`, `A careful start. Then ${w.first} starts to find the gaps.`, `Neither gives much away early.`], 'arc'));
  // the moment
  const big = ex.reduce((b, e) => (e.dmg || 0) > ((b && b.dmg) || 0) ? e : b, null), wn = w.nen && w.nen.hatsu && w.nen.status !== 'Partially Awakened';
  if(star && w.nen && w.nen.hatsu && h('sn') % 5 < 3) L.push(pick([`${w.first} reaches for a Hatsu barely days old: "${w.nen.hatsu.alias}". It is clumsy, raw, and it works.`, `Then ${w.first} tries "${w.nen.hatsu.alias}" for the first time against someone who can fight back. ${l.first} did not see it coming.`], 'sn2'));
  else if(wn && (trailed || swings >= 2 || r.rounds >= 7)) L.push(`Then ${w.first} shows ${P(w).their} Hatsu for the first time in public: "${w.nen.hatsu.alias}". The examiners lean forward.`);
  else if(big && big.text && h('big') % 3) L.push(`The moment everyone remembers: ${big.text.replace(/\.$/, '')}${brutal ? ', and the sound carries to the back rows.' : '.'}`);
  // how it ended
  const tough = l.a.determination >= 65, proud = ['Hot-headed', 'Show-off', 'Bruiser', 'Berserker', 'Duelist'].includes(l.trait), calm = ['Stoic', 'Watcher', 'Tactician', 'Mastermind', 'Bookworm'].includes(l.trait);
  if(star) L.push(r.how === 'knockout' ? pick([`${l.first} goes down. In a fight for glory, there is no shame in that.`, `${l.first} hits the floor, and gets up laughing.`], 'se') : r.how === 'surrender' ? pick([`${l.first} bows out to ${w.first}. Nobody boos.`, `${l.first} raises a hand and then, after a moment, offers it to ${w.first}.`], 'se') : pick([`The judges decide. Nobody leaves the hall unhappy.`, `Time runs out. The judges pick ${w.first}, but the crowd is cheering for both.`], 'se'));
  else if(r.how === 'knockout') L.push(brutal ? pick([`${l.first} goes down and stays down. The medics are in the ring before the examiner finishes counting.`, `The last blow lands, and ${l.first} is out before ${P(l).they} hit${P(l).s} the floor.`], 'end') : pick([`${l.first} drops to a knee and cannot get back up. The examiner waves it off.`, `A clean finish from ${w.first}. ${l.first} is down, and it is done.`], 'end'));
  else if(r.how === 'surrender') L.push(tough || proud ? pick([`${l.first} surrenders to ${w.first} only when standing is no longer possible.`, `It takes everything ${l.first} has to raise that hand to ${w.first}.`], 'end') : calm ? pick([`${l.first} raises a hand early and calmly: there is another bout to fight, and ${P(l).they} know${P(l).s} it.`, `${l.first} does the arithmetic and concedes, saving what is left for the next round.`], 'end') : pick([`${l.first} has seen enough and gives it to ${w.first}.`, `${l.first} taps out, breathing hard. ${w.first} does not celebrate.`], 'end'));
  else if(/judges/.test(r.how)) L.push(pick([`No knockout, no surrender. The judges decide, and the crowd argues about it for an hour.`, `Time runs out with both still standing. The judges give it to ${w.first}, narrowly.`], 'end'));
  // what it leaves
  const close = wh - lh < 20, grudge = (l.grudges || []).some(g => g.id === w.id);
  if(star) L.push(proud ? pick([`${l.first} wants a rematch. Next year, as Hunters, somewhere with no judges.`, `${l.first} will be thinking about this one for a long time.`], 'sa') : pick([`${w.first} lifts ${l.first}'s hand too, and the crowd loves it.`, `They will be colleagues by tomorrow. Today they were rivals, and it was beautiful.`, `${l.first} is the first to congratulate ${w.first}.`], 'sa'));
  else if(proud && !close) L.push(pick([`${l.first} does not take the offered hand.`, `${l.first} leaves without a word. This is not over.`], 'aft'));
  else if(close && !grudge && h('aft') % 2) L.push(pick([`They shake hands at the end, and it looks like it means something.`, `${w.first} helps ${l.first} up. Neither says anything. Neither needs to.`], 'aft'));
  else if(brutal && h('aft2') % 2) L.push(pick([`Both of them leave the ring limping.`, `The floor needs cleaning before the next match.`], 'aft'));
  return L.join(' ');
}
// what the examiner says after a bout: depends on how it went and on who the examiner is
const EX_REMARK = {
  quick:   {any: ['"Next. That was not a fight."', '"Somebody wake the loser up. Gently."', '"Efficient. I like efficient."'], Cruel: ['"Pathetic. Both of you, somehow."'], Lenient: ['"It happens. You will have another bout."'], Physical: ['"That is what a body is for."']},
  comeback:{any: ['"Never count anyone out. Write that down."', '"That is the bout people will talk about."', '"I had already stopped watching. My mistake."'], Strict: ['"Sloppy for half of it. Brilliant for the other half."'], Cerebral: ['"The turn was a decision, not luck. Remember that."']},
  war:     {any: ['"Get them both to the infirmary. Then get me a coffee."', '"That one cost both of them something."', '"Long. Ugly. Honest."'], Cruel: ['"More of that."'], Lenient: ['"Enough. Both of you sit down for a while."'], Physical: ['"Now that is stamina."']},
  judges:  {any: ['"Close. Too close. Someone will be angry tonight."', '"A decision, not a victory. Win clearly next time."'], Strict: ['"If you want my vote, finish it yourself."'], Unpredictable: ['"I flipped a coin. Joking. Mostly."']},
  early:   {any: ['"Smart, or scared. We will find out in the next round."', '"Giving up is a skill too. Not one I admire."'], Cerebral: ['"Good arithmetic. Save it for the next one."'], Cruel: ['"Coward. Next."']},
  onesided:{any: ['"That was a lesson, not a fight."', '"One of you belongs here today."'], Strict: ['"The winner can do better. The loser has to."'], Fair: ['"Clean, and deserved."']},
  even:    {any: ['"That is how it is done."', '"Sloppy. But a win is a win."', '"I want to see more from both of you."', '"Remember that one. It was good."'], Fair: ['"By the book. Good."'], Unpredictable: ['"Interesting. I did not expect that, and I expect everything."']}
};
function exRemark(S, r, ex){
  const e = (r.ex || []).filter(x => x.ha !== undefined), last = e[e.length - 1]; if(!ex || !last || r.how === 'forfeit') return null;
  const wA = r.w.id === (r.ex.aId || null), lh = Math.min(last.ha, last.hb), wh = Math.max(last.ha, last.hb);
  let swings = 0, prev = 0; e.forEach(x => { const d = Math.sign(x.ha - x.hb); if(d && prev && d !== prev) swings++; if(d) prev = d; });
  const k = r.rounds <= 3 ? 'quick' : swings >= 3 ? 'comeback' : r.rounds >= 10 ? 'war' : /judges/.test(r.how) ? 'judges' : r.how === 'surrender' && lh >= 40 ? 'early' : wh >= 85 && lh <= 40 ? 'onesided' : 'even';
  const P = EX_REMARK[k], own = P[ex.style] || [], pool = own.length && nhash(r.w.id + ex.name) % 2 ? own : P.any;
  return `${ex.name}, after ${r.w.name} vs ${r.l.name}: ${pool[nhash(r.w.id + r.l.id + k) % pool.length]}`;
}
function finalFight(S, A, B, p, rng, ctx){
  const pair = [A, B];
  pair.forEach(c => { c.fBout = (c.fBout || 0) + 1; c.fNow = (c.fSt || [])[c.fBout - 1] || null; });
  const sl = ctx ? stakesLine(S, A, B, ctx) : null; if(sl) dlog(S, p, 'story', sl, [A.id, B.id], ctx.root ? 7 : 4);
  if(bonded(A, B)){
    dlog(S, p, 'bond', vpick(S, T_PRE_BOND, A.id + B.id)({a: A, b: B}), [A.id, B.id], 8);
    if(rng() < 0.4){
      const l = perfScore(A) < perfScore(B) ? A : B, w = l === A ? B : A;
      dlog(S, p, 'bond', vpick(S, T_FORFEIT, l.id)({w, l}), [l.id, w.id], 8);
      if(w.wins !== undefined) w.wins++; if(l.losses !== undefined) l.losses++;
      return {w, l, how: 'forfeit', rounds: 0, ex: [{by:'x', text:`${l.first} refuses to fight and forfeits.`, ha:100, hb:100}], nokill: true};
    }
    const r = fight(S, A, B, p, rng); r.nokill = true; r.after = (boutTale(r, A, B, ctx) || intensityLine(r, A, B));
    dlog(S, p, 'bond', vpick(S, T_AFTER_BOND, r.w.id)({w: r.w, l: r.l}), [r.w.id, r.l.id], 6);
    return r;
  }
  const g = pair.map((x, i) => ({x, o: pair[1 - i], g: (x.grudges || []).find(gg => gg.id === pair[1 - i].id)})).find(z => z.g);
  if(g) dlog(S, p, 'rival', vpick(S, T_PRE_GRUDGE, g.x.id)({a: g.x, b: g.o, why: g.g.why}), [g.x.id, g.o.id], 6);
  else { const t = pair.find(x => ['Hot-headed','Show-off','Bruiser','Berserker','Joker'].includes(x.trait)); if(t && rng() < 0.5) dlog(S, p, 'story', vpick(S, T_PRE_TALK, t.id)({a: t, b: pair.find(x => x !== t)}), [t.id], 3); }
  const r = fight(S, A, B, p, rng);
  r.after = (boutTale(r, A, B, ctx) || intensityLine(r, A, B));
  const ph = PHASES[p];
  if(ph.ex && rng() < (ctx && ctx.root ? 0.8 : 0.35)) r.exLine = exRemark(S, r, ph.ex);
  return r;
}

/* unbreakable bonds: two allies close in age (or two relatives) who will not abandon each other */
const bonded = (a, b) => !!(a && b && (a.bonds || []).some(x => x.id === b.id));
const bondPartners = (S, c) => (c.bonds || []).map(x => cmap(S)[x.id]).filter(Boolean);
function bondChance(a, b){
  const d = Math.abs(a.age - b.age);
  let p = d <= 1 ? 0.3 : d === 2 ? 0.14 : 0.14 * Math.pow(0.6, d - 2);   // per phase spent side by side
  if(['Lone Wolf','Hermit','Schemer'].includes(a.trait) || ['Lone Wolf','Hermit','Schemer'].includes(b.trait)) p *= 0.4;
  if(THEME === 'friendship') p *= 1.8;
  return p;
}
const T_BOND = [
  o => `${o.a.name} and ${o.b.name} have become inseparable. Whatever comes next, they face it together.`,
  o => `Somewhere along the way, ${o.a.first} and ${o.b.first} stopped being allies and became something closer: the kind of friends who would die for each other.`,
  o => `${o.a.name} and ${o.b.name} make a quiet pact: nobody gets left behind. Not ever.`,
  o => `Everyone can see it now: ${o.a.name} and ${o.b.name} are a pair. Separate them at your own risk.`,
  o => `${o.a.first} and ${o.b.first} share their last rations without a second thought. An unbreakable bond.`
];
const T_BOND_FAM = [
  o => `${o.a.name} and ${o.b.name} have always been inseparable, and the exam will not change that.`,
  o => `Of all the ${o.f}, ${o.a.first} and ${o.b.first} are the closest. One does not move without the other.`
];
const T_BOND_LOSS = [
  o => `${o.s.name} watches ${o.g.name} leave the exam and does not say a word for hours. Now ${o.s.first} is fighting for both of them.`,
  o => `${o.g.name} is out. ${o.s.name} swears to carry on for ${PR(o.g).them}.`,
  o => `Losing ${o.g.first} hits ${o.s.name} harder than any examiner could.`
];
const T_BOND_DEATH = [
  o => `${o.s.name} kneels beside ${o.g.name} for a long time. Something in ${o.s.first} has changed.`,
  o => `${o.g.name} is dead. ${o.s.name} will never forgive whoever did this.`
];
function makeBond(S, p, a, b, fam){
  if(bonded(a, b)) return false;
  (a.bonds = a.bonds || []).push({id: b.id, name: b.name, ed: S.edition, fam: !!fam});
  (b.bonds = b.bonds || []).push({id: a.id, name: a.name, ed: S.edition, fam: !!fam});
  a.notes.push({p, text:`Formed an unbreakable bond with ${b.name}`}); b.notes.push({p, text:`Formed an unbreakable bond with ${a.name}`});
  return true;
}
// relatives: a coin flip for each pair, decided once
function setupBonds(S){
  let shown = 0;
  (S.alliances || []).filter(A => A.family).forEach(A => {
    const ms = A.members.map(id => cmap(S)[id]).filter(Boolean);
    for(let i = 0; i < ms.length; i++) for(let j = i + 1; j < ms.length; j++){
      const a = ms[i], b = ms[j];
      if(bonded(a, b) || nhash([a.id, b.id].sort().join('') + 'fb') % 2) continue;
      makeBond(S, 0, a, b, true);
      dlog(S, 0, 'bond', vpick(S, T_BOND_FAM, a.id + b.id)({a, b, f: A.name}), [a.id, b.id], 4);
      if(shown++ > 3) S.log[S.log.length - 1].d = true;
    }
  });
}
// allies close in age may bond after facing a phase together
function bondsAfter(S, ph, p, rng){
  const m = cmap(S);
  (S.alliances || []).filter(A => !A.family).forEach(A => {
    const live = A.members.map(id => m[id]).filter(c => c && c.status === 'Active');
    for(let i = 0; i < live.length; i++) for(let j = i + 1; j < live.length; j++){
      const a = live[i], b = live[j];
      if(bonded(a, b) || isRelative(a, b)) continue;
      const since = Math.max((A.joined || {})[a.id] ?? A.formed ?? 0, (A.joined || {})[b.id] ?? A.formed ?? 0);
      if(p - since < 2) continue;                                         // a bond needs time: at least two phases side by side
      if((a.bonds || []).filter(x => !x.fam).length >= 2 || (b.bonds || []).filter(x => !x.fam).length >= 2) continue;
      if(rng() < bondChance(a, b) && makeBond(S, p, a, b)) dlog(S, p, 'bond', vpick(S, T_BOND, a.id + b.id)({a, b}), [a.id, b.id], 7);
    }
  });
  // a bonded partner falls: the one left behind fights for both
  S.candidates.forEach(g => {
    if(g.out !== p || !['Eliminated','Deceased','Disqualified'].includes(g.status)) return;
    bondPartners(S, g).filter(s => s.status === 'Active').forEach(s => {
      s.bondFire = p + 1;
      dlog(S, p, 'bond', vpick(S, g.status === 'Deceased' ? T_BOND_DEATH : T_BOND_LOSS, s.id + g.id)({s, g}), [s.id, g.id], g.status === 'Deceased' ? 8 : 6);
      if(ph.stage < 2 && g.status !== 'Deceased') S.log[S.log.length - 1].d = true;
      if(g.status === 'Deceased' && g.killedBy && m[g.killedBy]) addGrudge(s, m[g.killedBy], `killed ${g.first}`);
    });
  });
}
function setupCrushers(S){
  const ret = S.candidates.filter(c => c.attempts && c.attempts.length >= 2 && (c.crusher || c.trait === 'Schemer'));
  ret.sort((a, b) => (b.crusher ? 1 : 0) - (a.crusher ? 1 : 0) || b.attempts.length - a.attempts.length || nhash(a.id + 'cr') - nhash(b.id + 'cr'));
  ret.forEach(c => { c.crushOn = false; });
  ret.slice(0, 3).forEach(c => {
    const known = !!c.crusher;
    c.crusher = true; c.crushOn = true;
    if(known) log(S, 0, 'sabot', vpick(S, T_CRUSH_WARN, c.id)({c, n: c.attempts.length}), [c.id]);
  });
}
function crusherActs(S, ph, p, rng, active){
  if(ph.final || ph.zevil) return;
  const firsts = active.filter(c => !c.crushOn && (!c.attempts || c.attempts.length <= 1));
  active.filter(c => c.crushOn).forEach(c => {
    if(!firsts.length || rng() >= (THEME === 'shadows' ? 0.55 : 0.35)) return;
    const picks = [0, 1, 2].map(() => firsts[Math.floor(rng() * firsts.length)]);
    const v = picks.sort((x, y) => x.a.perception - y.a.perception)[0];
    c.sabs = (c.sabs || 0) + 1;
    if(v.a.perception + rng.gauss(0, 15) > 82){
      dlog(S, p, 'sabot', vpick(S, T_SAB_SEEN, v.id)({c, v}), [c.id, v.id], 5);
      addGrudge(v, c, 'tried to sabotage {them}');
      v.notes.push({p, text:`Saw through ${c.name}'s sabotage`});
      return;
    }
    v.pmod = (v.pmod || 0) - 9; v.sabBy = c.id; v.sabP = p;
    addGrudge(v, c, 'sabotaged {their} exam');
    const bank = ph.team ? T_SAB_TEAM : ph.id === 'cooking' ? T_SAB_COOK : T_SAB;
    dlog(S, p, 'sabot', vpick(S, bank, v.id)({c, v, ph: ph.name}), [c.id, v.id], 7);
    v.notes.push({p, text:`Sabotaged by ${c.name}`}); c.notes.push({p, text:`Sabotaged first-timer ${v.name}`});
    if(c.sabs >= 2 && !c.nick){ c.nick = vpick(S, ['the Rookie Crusher','the Newcomer Crusher','the Welcome Committee','the Friendly Face','Uncle Poison'], c.id); c.nickWhy = 'for ruining first-timers'; c.nickEd = S.edition; }
    const catchP = 0.06 + (ph.ex && ph.ex.style === 'Strict' ? 0.12 : 0);
    if(rng() < catchP){
      c.status = 'Disqualified'; c.out = p; c.reason = `${ph.name}: caught sabotaging ${v.name} and expelled`;
      c.notes.push({p, text:`Caught sabotaging ${v.name}, expelled`});
      dlog(S, p, 'sabot', `${ph.ex ? ph.ex.name : 'The examiner'} catches ${c.name} in the act. The rookie crusher is thrown out of the exam.`, [c.id, v.id], 9);
    }
  });
}

/* promises between allies or rivals: kept or broken on the way to the Final */
function makePromise(S, ph, p, rng, active){
  S.promises = S.promises || [];
  if(ph.final || ph.zevil || ph.stage < 1 || ph.stage > 3 || S.promises.length >= 3 || rng() >= 0.35) return;
  const busy = new Set(S.promises.flatMap(x => [x.a, x.b]));
  const ok = c => c.status === 'Active' && !busy.has(c.id);
  const pairs = [];
  active.filter(ok).forEach(c => {
    (c.grudges || []).forEach(g => { const o = cmap(S)[g.id]; if(o && ok(o)) pairs.push([c, o, 'rival']); });
  });
  if(!pairs.length || rng() < 0.6) (S.alliances || []).forEach(A => { const m = A.members.map(id => cmap(S)[id]).filter(c => c && ok(c)); if(m.length >= 2) pairs.push([m[0], m[1], 'ally']); });
  if(!pairs.length) return;
  pairs.sort((x, y) => Math.min(total(y[0]), total(y[1])) - Math.min(total(x[0]), total(x[1])));
  const [a, b, kind] = pairs[Math.floor(rng() * Math.min(3, pairs.length))];
  const goal = ph.stage >= 3 ? 'final' : 'zevil', G = goal === 'final' ? 'the Final Tournament' : 'Zevil Island', g = goal === 'final' ? 'the Final' : 'the island';
  S.promises.push({a: a.id, b: b.id, kind, p, goal, open: true});
  const txt = kind === 'ally' ? vpick(S, [
    o => `${o.a.name} and ${o.b.name} make a promise: they will see each other ${goal === 'final' ? 'at' : 'on'} ${G}.`,
    o => `"${g.charAt(0).toUpperCase() + g.slice(1)}. Both of us." ${o.a.name} and ${o.b.name} shake on it.`,
    o => `${o.a.name} makes ${o.b.name} swear they will both reach ${G}.`
  ], a.id)({a, b}) : vpick(S, [
    o => `${o.a.name} to ${o.b.name}: "Not here. We settle this on ${g}."`,
    o => `${o.a.name} and ${o.b.name} agree to save their fight for ${G}.`,
    o => `"Don't you dare fail before ${g}," ${o.a.name} tells ${o.b.name}. "I want to beat you there."`
  ], a.id)({a, b});
  dlog(S, p, 'arc', txt, [a.id, b.id], 5);
  a.notes.push({p, text: txt}); b.notes.push({p, text: txt});
}
function promisesAt(S, ph, p){
  const m = cmap(S), alive = c => c && (c.status === 'Active' || c.status === 'Finalist' || c.status === 'Approved');
  (S.promises || []).filter(x => x.open).forEach(x => {
    const a = m[x.a], b = m[x.b];
    const goalHere = (x.goal || 'final') === 'final' ? ph.final : ph.zevil;
    if(goalHere && alive(a) && alive(b)){
      x.open = false; x.kept = true;
      const fin = ph.final;
      dlog(S, p, 'arc', x.kind === 'ally' ? (fin ? `Promise kept: ${a.name} and ${b.name} meet again at the Final Tournament.` : `Promise kept: ${a.name} and ${b.name} both set foot on Zevil Island.`)
        : (fin ? `${a.name} and ${b.name} both made it. The Final can settle it now.` : `${a.name} and ${b.name} both reach Zevil Island. Now the hunt is personal.`), [a.id, b.id], 6);
      return;
    }
    if(goalHere) return;
    const outA = !alive(a) && a.out === p, outB = !alive(b) && b.out === p;
    if(!outA && !outB) return;
    x.open = false; x.kept = false;
    if(outA && outB){ dlog(S, p, 'arc', `Neither ${a.name} nor ${b.name} makes it. Their promise dies ${atPhase(ph.name)}.`, [a.id, b.id], 6); return; }
    const [gone, left] = outA ? [a, b] : [b, a];
    dlog(S, p, 'arc', x.kind === 'ally' ? vpick(S, [
      o => `A promise broken: ${o.g.name} falls in ${thePhase(o.ph)}, and ${o.l.name} goes on alone.`,
      o => `${o.l.name} will have to keep going for both of them now. ${o.g.name} is out.`,
      o => `${o.g.name} cannot keep the promise made to ${o.l.name}.`
    ], gone.id)({g: gone, l: left, ph: ph.name}) : vpick(S, [
      o => `${o.l.name} wins the argument by default: ${o.g.name} is out before they could settle it.`,
      o => `The showdown will never happen. ${o.g.name} falls in ${thePhase(o.ph)}, and ${o.l.name} is almost disappointed.`
    ], gone.id)({g: gone, l: left, ph: ph.name}), [gone.id, left.id], 6);
  });
}

/* debts: rescued candidates may get the chance to repay (or refuse) */
const T_REPAY = [
  o => `${o.d.name} repays the debt from ${thePhase(o.from)} and goes back for ${o.c.name}.`,
  o => `${o.d.name} has not forgotten ${thePhase(o.from)}. This time it is ${o.d.first} pulling ${o.c.name} through.`,
  o => `"Now we're even," says ${o.d.name}, hauling ${o.c.name} over the line.`
];
const T_REFUSE = [
  o => `${o.d.name} sees ${o.c.name} struggling and looks away. The debt from ${thePhase(o.from)} goes unpaid.`,
  o => `${o.c.name} saved ${o.d.name} once. ${o.d.first} walks on without turning around.`
];
function repayDebts(S, ph, p, rng, T, passed, failed){
  for(const c of failed.slice()){
    if(c.scores[ph.id] < T - 9) continue;
    const d = passed.find(x => x.debt && x.debt.to === c.id && x.debt.p < p);
    if(!d || rng() < 0.4) continue;
    const from = d.debt.from; d.debt = null;
    if(d.trait === 'Schemer' || d.trait === 'Lone Wolf' ? rng() < 0.6 : rng() < 0.15){
      addGrudge(c, d, 'left {them} behind despite owing {them}');
      dlog(S, p, 'arc', vpick(S, T_REFUSE, d.id)({d, c, from}), [d.id, c.id], 7);
      c.notes.push({p, text:`Abandoned by ${d.name}, who owed ${PR(c).them}`});
      continue;
    }
    failed.splice(failed.indexOf(c), 1); passed.push(c);
    c.rescuedBy = d.id; d.fatigue = clamp(d.fatigue + 6, 0, 100);
    dlog(S, p, 'arc', vpick(S, T_REPAY, d.id)({d, c, from}), [d.id, c.id], 7);
    c.notes.push({p, text:`${ph.name}: pulled through by ${d.name}, repaying an old debt`}); d.notes.push({p, text:`Repaid the debt to ${c.name}`});
  }
}

const T_INJ_GIVE = [
  o => `${o.c.name}'s ${o.w} from ${thePhase(o.from)} finally gives out.`,
  o => `The ${o.w} ${o.c.name} picked up in ${thePhase(o.from)} costs ${PR(o.c).them} everything.`,
  o => `${o.c.name} has been hiding a ${o.w} since ${thePhase(o.from)}. Not anymore.`
];
const T_INJ_NEW = [
  o => `${o.c.name} gets through ${thePhase(o.ph)}, but with a ${o.w}.`,
  o => `${o.c.name} finishes ${thePhase(o.ph)} limping: a ${o.w}.`,
  o => `${o.c.name} makes it, nursing a ${o.w}. It will slow ${PR(o.c).them} down.`
];
// call where a score is compared to a threshold: logs when an old injury made the difference
function injuryCheck(S, c, p, score, T){
  if(!c.injury || c.injury.p >= p) return;
  if(score < T && score + c.injury.pen >= T){
    dlog(S, p, 'arc', vpick(S, T_INJ_GIVE, c.id)({c, w: c.injury.w, from: c.injury.from}), [c.id], 6);
    c.notes.push({p, text:`The ${c.injury.w} cost ${PR(c).them}`});
  }
}

/* personality moments: small, trait-specific beats in the log (pure flavour) */
const TRAIT_LINES = {
  'Hot-headed':[o => `${o.c.name} picks a fight with a tree that got in the way.`, o => `${o.c.name} shouts at the examiner. The examiner does not blink.`],
  'Schemer':[o => `${o.c.name} spends the break quietly working out who to betray first.`],
  'Guardian':[o => `${o.c.name} slows down to walk with the stragglers.`],
  'Charmer':[o => `${o.c.name} has three new friends before ${o.ph} even starts.`],
  'Stoic':[o => `${o.c.name} has not said a word all day.`],
  'Daredevil':[o => `${o.c.name} takes the most dangerous route on purpose.`],
  'Bookworm':[o => `${o.c.name} reads by torchlight while everyone else sleeps.`],
  'Brute':[o => `${o.c.name} opens a locked door by removing it.`],
  'Lone Wolf':[o => `${o.c.name} turns down two alliance offers before breakfast.`],
  'Watcher':[o => `${o.c.name} memorises every face in the crowd.`],
  'Sprinter':[o => `${o.c.name} gets bored waiting and runs ahead just to come back.`],
  'Ironhide':[o => `${o.c.name} shrugs off a fall that would have ended anyone else.`],
  'Tactician':[o => `${o.c.name} draws a map of ${o.ph} in the dirt before setting off.`],
  'Diplomat':[o => `${o.c.name} settles a shouting match between two candidates with a sentence.`],
  'Glass Cannon':[o => `${o.c.name} cracks a boulder with one punch, then needs a long sit down.`],
  'Bulwark':[o => `${o.c.name} plants ${PR(o.c).their} feet, and the crowd simply flows around ${PR(o.c).them}.`],
  'Acrobat':[o => `${o.c.name} crosses ${o.ph} partly upside down, for no clear reason.`],
  'Mastermind':[o => `${o.c.name} predicts the next twist out loud. Ten minutes later, it happens.`],
  'Coward':[o => `${o.c.name} hides behind the biggest candidate ${PR(o.c).they} can find.`],
  'Show-off':[o => `${o.c.name} does a backflip at the starting line. Nobody asked.`],
  'Hermit':[o => `${o.c.name} camps a long way from everyone else, again.`],
  'Bruiser':[o => `${o.c.name} offers to arm-wrestle anyone, for any reason.`],
  'Duelist':[o => `${o.c.name} bows to every opponent, then beats them.`],
  'Workhorse':[o => `${o.c.name} is still moving long after the others have stopped.`],
  'Quitter':[o => `${o.c.name} asks the examiner, twice, where the exit is.`],
  'Klutz':[o => `${o.c.name} trips over ${PR(o.c).their} own pack. Then over someone else's.`],
  'Dreamer':[o => `${o.c.name} gets lost watching a butterfly.`],
  'Team Player':[o => `${o.c.name} organises a shared meal for everyone nearby.`],
  'Born Leader':[o => `Without anyone deciding it, ${o.c.name} ends up leading a group through ${o.ph}.`],
  'Underdog':[o => `The others laugh at ${o.c.name}. ${o.c.first} keeps walking.`],
  'Prodigy':[o => `${o.c.name} makes it look easy, which annoys everyone.`],
  'Berserker':[o => `${o.c.name} roars at a wild animal. The animal leaves.`],
  'Scout':[o => `${o.c.name} comes back from the front with news nobody else has.`],
  'Escape Artist':[o => `${o.c.name} slips out of a tangle of vines like it was nothing.`],
  'Lurker':[o => `Someone turns around and finds ${o.c.name} standing right there. Again.`],
  'Gentle Giant':[o => `${o.c.name} carries a smaller candidate's pack without being asked.`],
  'Iron-willed':[o => `${o.c.name} is told it is impossible. ${PR(o.c).They} ${PR(o.c).do} it anyway.`],
  'Pacifist':[o => `${o.c.name} talks ${PR(o.c).their} way out of a fight that everyone else wanted.`],
  'Thrill-seeker':[o => `${o.c.name} looks disappointed that ${o.ph} is not more dangerous.`],
  'Know-it-all':[o => `${o.c.name} explains ${o.ph} to the examiner who designed it.`],
  'Gossip':[o => `By nightfall, ${o.c.name} knows who is lying about their age.`],
  'Merchant':[o => `${o.c.name} sells spare water at triple the price, and sells out.`],
  'Gambler':[o => `${o.c.name} runs a betting pool on who will fall next.`],
  'Joker':[o => `${o.c.name} tells a joke at exactly the wrong moment. Even the examiner snorts.`],
  'Glutton':[o => `${o.c.name} spends the break hunting for snacks.`, o => `${o.c.name} cooks something on a flat rock, and a small crowd gathers.`],
  'Perfectionist':[o => `${o.c.name} goes back to redo a part of ${o.ph} ${PR(o.c).they} had already finished.`],
  'Optimist':[o => `${o.c.name} is sure this is the easiest phase yet. It is not.`],
  'Pessimist':[o => `${o.c.name} has already written ${PR(o.c).their} farewell letter. Twice.`],
  'Romantic':[o => `${o.c.name} spends ${o.ph} writing poems about another candidate.`],
  'Collector':[o => `${o.c.name} pockets a strange stone from ${o.ph}.`],
  'Drifter':[o => `${o.c.name} wanders off the path, then wanders back as if nothing happened.`],
  'Mystic':[o => `${o.c.name} reads the clouds and announces that three candidates will fall today.`],
  'Insomniac':[o => `${o.c.name} keeps watch all night, again, by choice.`],
  'Prankster':[o => `${o.c.name} swaps two candidates' boots in the night.`],
  'Worrier':[o => `${o.c.name} checks the map nine times in an hour.`],
  'Aristocrat':[o => `${o.c.name} complains about the lack of proper chairs.`],
  'Zealot':[o => `${o.c.name} kneels and prays before ${o.ph} begins.`],
  'Wildcard':[o => `Nobody can tell what ${o.c.name} is planning. Probably not even ${o.c.first}.`]
};
function traitMoments(S, ph, p, rng, active){
  if(ph.final || active.length < 3) return;
  const n = rng() < 0.5 ? 1 : 2;
  for(let i = 0; i < n; i++){
    const c = active[Math.floor(rng() * active.length)];
    if(!c || c.status !== 'Active') continue;
    persona(c);
    const lines = TRAIT_LINES[c.trait]; if(!lines) continue;
    const text = lines[Math.floor(rng() * lines.length)]({c, ph: thePhase(ph.name)});
    dlog(S, p, 'story', text, [c.id], 3);
  }
}

