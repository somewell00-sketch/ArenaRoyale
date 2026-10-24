/* ---------- the newspaper ---------- */
// a century in five lines: who shaped the Association
function centuryHall(S){
  const H = HUNTERS.filter(h => !h.legacy), out = [], used = new Set(), age = h => hunterAge(h);
  const put = (h, why) => { if(h && !used.has(h.license)){ used.add(h.license); out.push({n: h.name, lic: h.license, why}); } };
  const terms = {}; (WORLD.chairHist || []).forEach(x => { terms[x.lic] = (terms[x.lic] || 0) + ((x.to || S.edition) - x.from); });
  const longChair = Object.entries(terms).filter(x => x[1] > 0 && x[1] < 100).sort((a, b) => b[1] - a[1])[0]; if(longChair) put(hLic(longChair[0]), `Chairman for ${longChair[1]} year${longChair[1] === 1 ? '' : 's'}`);
  const zt = h => (h.pastRoles || []).filter(r => r.r !== 'Chairman' && r.r !== 'Vice-Chairman' && r.from != null && r.to != null).reduce((s, r) => s + r.to - r.from, 0);
  const zBest = H.slice().sort((a, b) => zt(b) - zt(a))[0]; if(zBest && zt(zBest)) put(zBest, `${zt(zBest)} years in the Zodiac`);
  const capt = H.filter(h => (h.log || []).some(x => /brought in|captured|hunted down/.test(x.text))).sort((a, b) => (b.rp || 0) - (a.rp || 0))[0]; if(capt) put(capt, 'the most decorated Hunter of the century');
  const oldest = H.filter(h => hActive(h)).sort((a, b) => age(b) - age(a))[0]; if(oldest) put(oldest, `still active at ${age(oldest)}`);
  const ret = H.filter(h => (h.attempts || 0) > 3).sort((a, b) => b.attempts - a.attempts)[0]; if(ret) put(ret, `licensed on attempt ${ret.attempts}`);
  return out;
}
function makePaper(S){
  useLineup(S);
  const C = S.candidates, ap = C.filter(c => c.status === 'Approved'), dead = C.filter(c => c.status === 'Deceased'), dq = C.filter(c => c.status === 'Disqualified');
  const m = cmap(S), seed = S.seed + ':' + S.edition, pk = (arr, k) => arr[nhashUI(seed + k) % arr.length];
  const recent = HISTORY.slice(-4).map(r => r.paper).filter(Boolean);
  const usedKinds = recent.map(p => p.kind), usedPhoto = recent.map(p => p.photoKind), usedGossip = recent.slice(-2).flatMap(p => p.gossipKinds || []);
  const N = S.config.applicants, n = ap.length;
  const fam = {}; ap.forEach(c => { if(c.fam){ (fam[c.fam] = fam[c.fam] || []).push(c); } });
  const famWin = Object.values(fam).sort((a, b) => b.length - a.length)[0];
  const alli = {}; ap.forEach(c => { if(c.alliance && !c.fam){ (alli[c.alliance] = alli[c.alliance] || []).push(c); } });
  const alliWin = Object.entries(alli).sort((a, b) => b[1].length - a[1].length)[0];
  const tries = ap.slice().sort((a, b) => attemptsOf(b) - attemptsOf(a))[0], young = ap.slice().sort((a, b) => a.age - b.age)[0], old = ap.slice().sort((a, b) => b.age - a.age)[0];
  const killerH = ap.find(c => c.kills), nickH = ap.find(c => c.nick), favH = ap.find(c => isFav(c.id)), crush = dq.find(c => /sabotag/.test(c.reason || ''));
  const crusherH = ap.find(c => c.crusher), underdog = ap.find(c => c.trait === 'Underdog'), firstTry = ap.filter(c => attemptsOf(c) === 1).length;
  const drops = S.stats.filter(s => s.before > 20 && !PHASES[s.p].final && !PHASES[s.p].zevil).map(s => ({s, r: 1 - s.after / s.before})).sort((a, b) => b.r - a.r)[0];
  const kept = (S.promises || []).find(x => x.kept && PHASES[S.phase - 1] && x.goal === 'final');
  const exCruel = PHASES.find(p => p.ex && p.ex.style === 'Cruel');
  const A = [];   // candidate angles: [kind, score, headline options, ids]
  const add = (kind, score, heads, ids) => A.push({kind, score: score * (usedKinds.includes(kind) ? 0.25 : 1) * (0.85 + (nhashUI(seed + kind) % 30) / 100), heads, ids: ids || []});
  if(S.cat && S.cat.stage === 'done') add('cat', 9999, [`${S.cat.name}: The Exam That Never Ended`, `${S.cat.dead} Dead, ${n} Licensed in ${S.cat.name}`, `${S.cat.name} Ends the ${ordinal(S.edition)} Hunter Exam`, `Heroes of ${S.cat.name}: ${n} Licenses for Courage`]);
  if(favH) add('fav', 90, [`${favH.name} Earns a Hunter License`, `It Happened: ${favH.name} Is a Hunter`, `${favH.first}'s Day: License Secured`], [favH.id]);
  if(!n) add('none', 85, ['No New Hunters This Year', 'Not a Single License', 'The Association Turns Everyone Away', `${fmt(N)} Tried. Nobody Passed.`]);
  if(dead.length >= 3) add('deaths', 30 + dead.length * 8, [`Bloodiest Exam in Years: ${dead.length} Dead`, `${dead.length} Candidates Will Not Be Going Home`, `A Deadly ${ordinal(S.edition)} Exam`, `Death Toll Rises to ${dead.length}`]);
  if(crush) add('crusher', 55, [`Rookie Crusher ${crush.name} Thrown Out`, `Caught in the Act: ${crush.name} Expelled`, `The Newcomers' Nightmare Is Finally Gone`, `${crush.name}'s Last Trick`], [crush.id]);
  if(crusherH) add('crusherwin', 70, [`Rookie Crusher ${crusherH.name} Somehow Gets a License`, `The Saboteur Passes: ${crusherH.name}`, `Rookies Furious as ${crusherH.name} Is Licensed`], [crusherH.id]);
  if(tries && attemptsOf(tries) >= 3) add('tries', 22 + attemptsOf(tries) * 6, [`${tries.name} Passes on Attempt ${attemptsOf(tries)}`, `${attemptsOf(tries)} Tries Later, ${tries.name} Is a Hunter`, `Persistence Pays: ${tries.name}`, `"Never Again" Said ${tries.first} — Then Came Back`], [tries.id]);
  if(young && young.age <= 14) add('young', 62 - young.age, [`${young.age}-Year-Old ${young.name} Earns a License`, `Child Prodigy ${young.name} Stuns the Examiners`, `Just ${young.age}, and Already a Hunter`], [young.id]);
  if(old && old.age >= 45) add('old', 20 + old.age / 2, [`${old.name}, ${old.age}, Proves Age Is Just a Number`, `Never Too Late: ${old.name} Licensed at ${old.age}`, `The Oldest in the Room Walks Out a Hunter`], [old.id]);
  if(n >= 11) add('bumper', 45, [`A Bumper Year: ${n} New Hunters`, `${n} Licenses, the Zodiac Nearly Full`, `The Association Opens Its Doors Wide`]);
  if(n && n <= 2) add('few', 50, [`Only ${n === 1 ? 'One' : 'Two'} Survive${n === 1 ? 's' : ''} the ${ordinal(S.edition)} Exam`, `${n === 1 ? 'A Single License' : 'Just Two Licenses'} from ${fmt(N)} Applicants`, `${n === 1 ? 'One' : 'Two'} out of ${fmt(N)}`]);
  if(famWin && famWin.length >= 2){ const F = familyOf(S, famWin[0]); add('family', 40 + famWin.length * 8, [`The ${F.name.replace(/^The /, '')} Strikes: ${famWin.length} Licenses`, `Blood Is Thicker: ${famWin.length} ${famWin[0].last}s Pass`, `A Family Affair at the ${ordinal(S.edition)} Exam`], famWin.map(c => c.id)); }
  if(alliWin && alliWin[1].length >= 3){ const AL = (S.alliances || []).find(x => x.id === alliWin[0]); if(AL) add('alliance', 35 + alliWin[1].length * 6, [`${AL.name} Takes ${alliWin[1].length} Licenses`, `Strength in Numbers: ${AL.name}`, `Together to the End: ${AL.name}`], alliWin[1].map(c => c.id)); }
  if(killerH) add('killer', 50, [`A Killer Among the New Hunters?`, `${killerH.name} Licensed Despite Blood on ${PR(killerH).Their} Hands`, `Questions Grow Over ${killerH.name}'s License`], [killerH.id]);
  if(nickH) add('nick', 30, [`"${nickH.nick}" Earns a License`, `They Called ${nickH.first} "${nickH.nick}". Now Call ${PR(nickH).Them} Hunter.`, `The Legend of "${nickH.nick}"`], [nickH.id]);
  if(underdog) add('underdog', 42, [`Nobody Believed in ${underdog.name}`, `Underdog ${underdog.name} Defies Every Prediction`, `From Last in Line to Hunter: ${underdog.name}`], [underdog.id]);
  if(drops && drops.r >= 0.6) add('phase', 20 + drops.r * 30, [`${PHASES[drops.s.p].name} Claims ${Math.round(drops.r * 100)}% of the Field`, `Massacre at ${thePhase(PHASES[drops.s.p].name).replace(/^the /, 'the ')}`, `Nobody Was Ready for ${thePhase(PHASES[drops.s.p].name)}`]);
  if(exCruel) add('examiner', 26, [`${exCruel.ex.name}'s Cruel Exam Leaves Candidates Shaken`, `Complaints Pour In Against ${exCruel.ex.name}`, `"${exCruel.ex.name} Enjoyed It," Say Survivors`]);
  if(firstTry && firstTry === n && n >= 4) add('rookies', 34, [`A Class of First-Timers`, `Every New Hunter Passed on Their First Try`, `Rookies Sweep the ${ordinal(S.edition)} Exam`]);
  const bondH = ap.find(c => (c.bonds || []).some(b => { const o = m[b.id]; return o && o.status === 'Approved' && o.id > c.id; }));
  if(bondH){ const o = m[bondH.bonds.find(b => m[b.id] && m[b.id].status === 'Approved' && b.id > bondH.id).id]; add('bond', 72, [`Inseparable: ${bondH.first} and ${o.first} Become Hunters Together`, `Side by Side to the End: ${bondH.name} and ${o.name}`, `Two Friends, Two Licenses`], [bondH.id, o.id]); }
  const bondLoss = dead.find(c => (c.bonds || []).length);
  if(bondLoss) add('bondloss', 38, [`${bondLoss.name} Falls; a Friend Fights On Alone`, `Grief at the ${ordinal(S.edition)} Exam`], [bondLoss.id]);
  if(kept){ const a = m[kept.a], b = m[kept.b]; if(a && b) add('promise', 32, [`A Promise Kept: ${a.first} and ${b.first} Reach the Final`, `"See You at the Final" — and They Did`], [a.id, b.id]); }
  const TH = THEMES[S.theme || 'classic'];
  const sec = C.filter(c => c.secret && c.secret.revealed && c.secret.ed === S.edition);
  const under = sec.find(c => c.secret.k === 'undercover'), royal = sec.find(c => c.secret.k === 'royal'), assassin = sec.find(c => c.secret.k === 'assassin'), spy = sec.find(c => c.secret.k === 'spy'), heirH = ap.find(c => c.secret && c.secret.revealed && c.secret.k === 'hunterchild');
  if(under) add('undercover', 60, [`Plot Twist: ${under.name} Was an Examiner All Along`, `The Spy Among Us Was the Association Itself`, `Unmasked: Undercover Examiner ${under.name}`], [under.id]);
  if(royal) add('royal', 48, [`Royal Heir ${royal.name} Unmasked at the Exam`, `A Crown in the Crowd: ${royal.name}`, `${royal.first}'s Royal Secret Is Out`], [royal.id]);
  if(assassin) add('assassin', 55, [`Assassin Heir ${assassin.name} Revealed`, `Candidates Shaken: Assassin Family Heir Among Them`, `The Quiet One Was a Killer by Trade`], [assassin.id]);
  if(spy) add('spy', 45, [`Syndicate Spy ${spy.name} Exposed`, `Infiltrated: A Spy in the ${ordinal(S.edition)} Exam`, `${spy.name} Was Never Here for the License`], [spy.id]);
  if(heirH) add('heir', 44, [`Like Parent, Like Child: ${heirH.name} Earns a License`, `A Legend's Child Becomes a Hunter`, `${heirH.first} Lives Up to the Family Name`], [heirH.id]);
  if(TH && S.theme !== 'classic') add('theme', 24, [`${TH.name}: ${n} New Hunters`, `${TH.name} Ends with ${n} License${n === 1 ? '' : 's'}`]);
  if(S.special === 'jubilee') add('jubilee', 40, [`The Jubilee Crowns ${n} New Hunters`, `${n} Licenses in a Single Year: the Jubilee`, `Gates Wide Open: ${n} New Hunters at the Jubilee`]);
  if(S.special === 'centenary'){ const ch = S.starCup && S.starCup.champ ? cmap(S)[S.starCup.champ] : null; add('centenary', 80, ch ? [`${ch.name} Wins the Centennial Star`, `A Hundred Exams, and ${ch.first} on Top`] : [`The Centenary Exam: ${n} New Hunter${n === 1 ? '' : 's'}`, `A Hundred Exams Later`], ch ? [ch.id] : []); }
  add('count', 18, [`${n} New Hunters Crowned`, `${n} Licenses Awarded at the ${ordinal(S.edition)} Exam`, `Meet the Class of the ${ordinal(S.edition)}`, `The ${ordinal(S.edition)} Exam Is Over`]);
  A.sort((a, b) => b.score - a.score);
  const top = A[0];
  const head0 = pk(top.heads, 'h'), head = head0.replace(/^("?)(\w)/, (x, q, ch) => q + ch.toUpperCase());
  const ratio = n ? Math.round(N / n) : 0;
  const dek = pk([
    `${fmt(N)} applicants went in. ${n || 'None'} came out with a license${dead.length ? `, and ${dead.length} did not come out at all` : ''}.`,
    n ? `One license for every ${fmt(ratio)} applicants${dead.length ? `; ${dead.length} dead along the way` : ''}.` : `${fmt(N)} applicants, zero licenses${dead.length ? `, ${dead.length} funerals` : ''}.`,
    `${PHASES.length} phases, ${fmt(N)} hopefuls, ${n} new Hunter${n === 1 ? '' : 's'}${dq.length ? `, ${dq.length} expelled` : ''}.`,
    `The exam that ${n >= 8 ? 'was kind to the brave' : n ? 'broke almost everyone' : 'broke everyone'}: ${n} of ${fmt(N)} made it.`
  ], 'd');
  const exNames = [...new Set(PHASES.filter(p => p.ex).map(p => p.ex.name))];
  const toughest = drops ? PHASES[drops.s.p].name : null;
  const leadParts = [
    pk([`It began at ${thePhase(PHASES[0].name)} and ended ${PHASES.length} trials later at ${thePhase(PHASES[PHASES.length - 1].name)}.`, `${PHASES.length} phases stood between the applicants and a license.`, `From ${thePhase(PHASES[0].name)} to the Final, the road had ${PHASES.length} stops.`], 'l1'),
    toughest ? pk([`${thePhase(toughest).replace(/^t/, 'T')} did the most damage, sending home ${Math.round(drops.r * 100)}% of those who entered it.`, `The hardest stretch was ${thePhase(toughest)}: ${drops.s.before - drops.s.after} candidates fell there.`, `Ask any survivor about ${thePhase(toughest)} and watch them go pale.`], 'l2') : '',
    exNames.length ? pk([`Among the examiners were ${andList(exNames.slice(0, 3))}.`, `${exNames[0]} set the tone early${exNames.length > 1 ? `, and ${exNames[exNames.length - 1]} closed things out` : ''}.`, `${exNames.length} Hunters served as examiners this year.`], 'l3') : ''
  ];
  if(TH && S.theme !== 'classic') leadParts.unshift(pk([`This was ${TH.name}. ${TH.desc}`, `${TH.name}, they are already calling it. ${TH.desc}`], 'lt'));
  const lead = leadParts.filter(Boolean).join(' ');
  // photo: the most dramatic moment, avoiding the kind used in recent issues
  const kindOf = e => e.type === 'death' ? (/Fatal Duel/.test(e.text) ? 'kill' : 'death') : e.type === 'arc' ? (/promise|Promise/.test(e.text) ? 'promise' : /even|repays|forgotten/.test(e.text) ? 'repay' : /looks away|walks on/.test(e.text) ? 'refuse' : /injur|gives out|costs them|limping|nursing|hiding/.test(e.text) ? 'injury' : 'arc') : e.type;
  const pool = S.log.filter(e => !e.d && !['fav','phase','info','team','examiner','nen'].includes(e.type));
  const scoreE = (e, used) => (e.dr || DRAMA_W[e.type] || 1) + ((e.ids || []).some(isFav) ? 3 : 0) - (used.includes(kindOf(e)) ? 7 : 0) + (nhashUI(seed + e.text) % 100) / 60 + (top.ids.length && (e.ids || []).some(id => top.ids.includes(id)) ? 3 : 0);
  const photo = pool.slice().sort((a, b) => scoreE(b, usedPhoto) - scoreE(a, usedPhoto))[0] || null;
  // gossip: one item per kind, rotating away from recent issues
  const seen = new Set(photo ? [kindOf(photo)] : []), gossip = [];
  pool.filter(e => e !== photo && ['sabot','arc','betray','rival','event','story','rescue','split','family','veteran'].includes(e.type))
    .sort((a, b) => scoreE(b, usedGossip) - scoreE(a, usedGossip))
    .forEach(e => { const k = kindOf(e); if(gossip.length < 4 && !seen.has(k)){ seen.add(k); const ph = PHASES[e.p] ? PHASES[e.p].name : ''; gossip.push({t: briefText(e.text, ph), h: briefHead(e, k, ph), ids: e.ids, ph, k}); } });
  // gossip reads as news: a headline, then the story without repeating the phase name
  function briefText(x, ph){
    const esc2 = ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return x.replace(new RegExp('\\s+(?:in|during|at|on) (?:the )?' + esc2 + '(?=[.,;:!?—( ]|$)', 'g'), '').replace(/\s*\([^)]*\)\s*\.?$/, '.').replace(/\.\.$/, '.');
  }
  function briefHead(e, k, ph){
    const a = e.ids && m[e.ids[0]], b = e.ids && m[e.ids[1]], A = a ? a.first : 'A candidate', B = b ? b.first : 'a rival', x = e.text, v = arr => pk(arr, 'bh' + x.length + A);
    const tag = (x.match(/\(([^)]*(?:Family|Alliance|Pact|Crew|Circle|Band|Company|Guild|Order|League)[^)]*)\)/) || [])[1];
    if(/never happen|almost disappointed/.test(x)) return v([`A Rivalry Without an Ending`, `Showdown Cancelled`]);
    if(/both reach|meet again|finally face/i.test(x) && b) return v([`${A} and ${B}: The Showdown Is Set`, `Unfinished Business`]);
    if(/Chairman/.test(x)) return v([`The Chairman Intervenes`, `A Roll of the Chairman's Dice`]);
    if(/last match|no next round|comes down to this|license left/i.test(x)) return v([`One Match Left`, `Everything on One Fight`]);
    if(/nickname|people call|"[^"]+" —|name sticks/i.test(x) && k === 'story') return v([`${A} Gets a Name`, `Meet "${(x.match(/"([^"]{2,30})"/) || [, ''])[1]}"`]);
    if(k === 'repay') return v([`${A} Repays a Debt`, `A Debt Settled`, `${A} Remembers`]);
    if(k === 'promise') return /kept/i.test(x) ? v([`A Promise Kept`, `${A} and ${B} Keep Their Word`]) : /broken|alone|dies|neither|cannot keep/i.test(x) ? v([`A Promise Broken`, `A Promise Dies`]) : v([`A Promise on the Line`, `${A} Gives ${a ? PR(a).Their : 'Their'} Word`]);
    if(/injur|concussion|hamstring|fracture|sprain|dislocat|cracked|gives out|costs \w+ everything/i.test(x)) return /gives out|everything/.test(x) ? v([`${A}'s Injury Catches Up`, `The Wound That Ended It`]) : v([`${A} Hurt but Standing`, `Wounded, ${A} Pushes On`]);
    if(/save their fight|settle|argument|before they could/i.test(x)) return v([`Unfinished Business`, `A Score Left Open`]);
    const fm = x.match(/The (\w+) [Ff]amily/);
    if(k === 'family' && fm && /[Ff]amily is out/.test(x)) return v([`The ${fm[1]} Family Is Out`, `End of the Road for the ${fm[1]} Family`]);
    if(k === 'family' && fm && /lost|falls|is out/i.test(x)) return v([`The ${fm[1]} Family Loses One`, `A Gap in the ${fm[1]} Family`]);
    if(k === 'family' && /first time|long-lost|never met/i.test(x)) return v([`A Family Reunion`, `Strangers, Then Family`]);
    if(k === 'family' && fm && /split|refuse|argue|walks? away/i.test(x)) return v([`Rift in the ${fm[1]} Family`, `The ${fm[1]}s Go Separate Ways`]);
    if(k === 'refuse') return v([`${A} Walks On`, `No Help for ${B}`]);
    if(k === 'injury') return v([`${A} Hurt but Standing`, `Wounded, ${A} Pushes On`]);
    if(k === 'sabot') return v([`Foul Play Reported`, `Sabotage in the Field`, `${A} Plays Dirty`]);
    if(k === 'betray') return v([`Betrayal: ${A} Turns on ${B}`, `${B} Stabbed in the Back`]);
    if(k === 'rival' && (!b || /finishing what|avenge|revenge/i.test(x))) return v([`${A} Comes for Revenge`, `${A} Holds a Grudge`]);
    if(k === 'rival') return /never happen|disappoint|denied/.test(x) ? v([`A Rivalry Without an Ending`, `Showdown Cancelled`]) : v([`${A} vs ${B}`, `Bad Blood Between ${A} and ${B}`]);
    if(k === 'rescue') return v([`${A} Goes Back for ${B}`, `Nobody Left Behind`]);
    if(k === 'split') return v([`An Alliance Cracks`, `${A} Goes ${a ? 'It Alone' : 'Solo'}`]);
    if(k === 'family') return tag ? v([`Family First for the ${tag}`, `The ${tag} Sticks Together`]) : v([`Family First`, `Blood Before Badges`]);
    if(k === 'veteran') return v([`A Veteran's Lesson`, `Old Hands, New Tricks`]);
    if(k === 'event') return /dives|shoves|drags|pulls|grabs/.test(x) ? v([`Close Call`, `Saved at the Last Second`]) : /carries|shares|helps|gives/.test(x) ? v([`A Helping Hand`, `${A} Lends a Hand`]) : /avalanche|storm|rock|tusk|thorn|flood|bite|stung|poison|venom|swarm|current|wave|ice|sand/i.test(x) ? v([`Nature Fights Back`, `Accident on the Course`]) : v([`A Strange Day for ${A}`, `Off Script`]);
    if(/Final/.test(ph)) return v([`Down to the Wire`, `A Final to Remember`]);
    return v([`${A}'s Story Turns`, `Talk of the Exam`]);
  }
  // quote of the exam: the line people will remember — last words, a new Hunter's first words, a taunt, a cruel examiner
  const quotes = [], qadd = (q, by, ctx, w, id) => quotes.push({q, by, ctx, w, id});
  dead.filter(c => c.lastWords).forEach(c => qadd(c.lastWords, c.name, 'last words', 10, c.id));
  const fin = PHASES.findIndex(x => x.final), returning = c => attemptsOf(c) > 1;
  const WIN_Q = ['Somebody pinch me.', 'I just want to call my family.', 'Is it always this quiet after?', 'I expected to feel taller.', 'Now I get to find out what all this was for.', 'Do they give you a nap with the license?', 'This is for everyone who said I could not.', 'Now the real work starts.', 'I am going to sleep for a week.', 'I never doubted it. Not once. Fine, once.', 'Where do I pick up the card?', 'That was the easy part, right?', 'Ask me again tomorrow, when it feels real.', 'I would do it all again. Most of it.', 'I came here with nothing. I am leaving with everything.'];
  const star = ap.slice().sort((x, y) => (attemptsOf(y) + ((y.bonds || []).length ? 2 : 0) + (nhashUI(seed + y.id) % 3)) - (attemptsOf(x) + ((x.bonds || []).length ? 2 : 0) + (nhashUI(seed + x.id) % 3)))[0];
  [star].filter(Boolean).forEach(c => {
    const pool = WIN_Q.slice();
    if(returning(c)) pool.push(`${ordinal(attemptsOf(c)).replace(/^./, x => x.toUpperCase())} time lucky. I told you I would be back.`, 'They kept telling me to quit. I kept coming back.');
    if(dead.length) pool.push('I owe this to the ones who did not make it home.');
    if(c.bonds && c.bonds.length) pool.push(`I would not be standing here without ${c.bonds[0].name.split(' ')[0]}.`);
    qadd(pool[nhashUI(seed + c.id + 'wq') % pool.length], c.name, 'on getting the license', 5, c.id);
  });
  S.log.forEach(e => {
    if(e.type === 'examiner'){ const mq = e.text.match(/"([^"]+)"\s*$/), ex = PHASES[e.p] && PHASES[e.p].ex; if(mq && ex) qadd(mq[1], ex.name, thePhase(PHASES[e.p].name), ex.style === 'Cruel' ? 3 : ex.style === 'Unpredictable' ? 1.5 : 0.3); return; }
    const mq = e.text.match(/"([^"]{4,90}[.!?…])"/); if(!mq || !/\s/.test(mq[1]) || e.type === 'death') return;   // speech only, not names or nicknames
    const who = m[e.ids[0]], ctx = PHASES[e.p] ? (e.p === fin ? 'the Final Tournament' : thePhase(PHASES[e.p].name)) : '';
    if(/Chairman/.test(e.text.slice(0, e.text.indexOf('"')))) qadd(mq[1], CHAIR ? 'Chairman ' + CHAIR.name : 'The Chairman', ctx, 3);
    else if(who && e.text.startsWith(who.name)) qadd(mq[1], who.name, ctx, e.p === fin ? 4 : 2.5, who.id);
  });
  const usedQ = recent.map(p => p.quote && p.quote.q); quotes.forEach(x => { if(usedQ.includes(x.q)) x.w *= 0.05; });
  let quote = null;
  if(quotes.length){ const tot = quotes.reduce((t, x) => t + x.w, 0); let r = (nhashUI(seed + 'q') % 10000) / 10000 * tot; quote = quotes.find(x => (r -= x.w) < 0) || quotes[0]; }
  const cnt = t => S.log.filter(e => e.type === t).length;
  return {
    edition: S.edition, head, hid: top.ids, kind: top.kind, dek, lead,
    photo: photo ? {t: photo.text, ids: photo.ids, ph: PHASES[photo.p] ? PHASES[photo.p].name : ''} : null, photoKind: photo ? kindOf(photo) : null,
    hunters: ap.map(c => ({id: c.id, n: c.name, career: c.career || '', tries: attemptsOf(c), age: c.age})),
    special: S.special || null, hall: S.special === 'centenary' ? centuryHall(S) : null,
    obits: dead.slice(0, 6).map(c => ({id: c.id, n: c.name, age: c.age, w: c.lastWords || '', why: clean(c.reason || '')})),
    gossip, gossipKinds: gossip.map(g => g.k), quote,
    nums: [['Applicants', fmt(N)], ['Hunters', n], ['Deaths', dead.length], ['Disqualified', dq.length], ['Rescues', cnt('rescue')], ['Sabotages', S.log.filter(e => e.type === 'sabot' && e.dr === 7).length], ['Alliances', (S.alliances || []).length]]
  };
}
function paperHtml(P, live){
  if(!P) return '';
  const L = (t, ids) => live ? linkNames(t, ids) : esc(clean(t));
  const nm = (x) => live ? `<a data-id="${x.id}">${esc(x.n)}</a>` : esc(x.n);
  return `<article class="paper">
    <header class="pp-mast"><div class="pp-meta"><span>${P.special === 'centenary' ? 'Centenary edition' : P.special === 'jubilee' ? 'Jubilee edition' : 'Special edition'}</span><span>After the ${ordinal(P.edition)} Hunter Exam</span><span>Price: one badge</span></div><h2>The Hunter Herald</h2></header>
    <h3 class="pp-head">${L(P.head, P.hid)}</h3>
    <p class="pp-dek">${esc(P.dek)}</p>
    <div class="pp-cols">
      <div class="pp-main">
        ${P.photo ? `<figure class="pp-photo"><div class="pp-img" aria-hidden="true"><span>${esc(P.photo.ph)}</span></div><figcaption>${L(P.photo.t, P.photo.ids)}</figcaption></figure>` : ''}
        <p class="pp-lead">${esc(P.lead)}</p>
        ${P.gossip.length ? `<h4>In brief</h4>${P.gossip.map(g => g.h ? `<div class="pp-b"><h5>${esc(g.h)}</h5><p class="pp-g"><span class="pp-dl">${esc(g.ph)} —</span> ${L(g.t, g.ids)}</p></div>` : `<p class="pp-g"><b>${esc(g.ph)}.</b> ${L(g.t, g.ids)}</p>`).join('')}` : ''}
      </div>
      <aside class="pp-side">
        ${live ? '' : `<h4>New Hunters</h4>`}${live ? '' : P.hunters.length ? `<ol class="pp-list">${P.hunters.map(h => `<li>${nm(h)}<small>${esc(h.career.replace(' Hunter', ''))}${h.tries > 1 ? ` · attempt ${h.tries}` : ''}</small></li>`).join('')}</ol>` : '<p class="pp-g">The Association issued no licenses this year.</p>'}
        ${P.quote ? `<h4>Quote of the exam</h4><blockquote class="pp-q">"${esc(P.quote.q.replace(/^"|"$/g, ''))}"<cite>${esc(P.quote.by)}, ${esc(P.quote.ctx)}</cite></blockquote>` : ''}
        ${P.hall && P.hall.length ? `<h4>A century of Hunters</h4>${P.hall.map(x => `<p class="pp-g">${live ? `<a data-hunter="${esc(x.lic)}">${esc(x.n)}</a>` : esc(x.n)} — ${esc(x.why)}</p>`).join('')}` : ''}
        ${P.obits.length ? `<h4>Obituaries</h4>${P.obits.map(o => { const qd = P.quote && P.quote.id === o.id && P.quote.ctx === 'last words'; return `<p class="pp-g">${nm(o)}, ${o.age}.${o.w && !qd ? ` <i>"${esc(o.w)}"</i>` : o.why ? ` <span class="pp-why">${esc(o.why.replace(/^[^:]{3,40}:\s*/, '').replace(/^./, s => s.toUpperCase()))}${/[.!?]$/.test(o.why) ? '' : '.'}</span>` : ''}</p>`; }).join('')}` : ''}
        <h4>By the numbers</h4><div class="pp-nums">${P.nums.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>
      </aside>
    </div>
  </article>`;
}

