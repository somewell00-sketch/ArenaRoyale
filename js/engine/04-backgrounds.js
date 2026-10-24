/* ===== Backgrounds: modular life stories, some of which matter in specific phases ===== */
const BG = {
  origin:[
    ['grew up in a fishing village where the sea took someone every winter', ['sea','raft','bandits']],
    ['was raised by a desert caravan that never stayed anywhere for more than a week', ['desert']],
    ['comes from a monastery high in the mountains', ['mountain','cliffpath','stairs']],
    ['grew up in a forest hamlet three days from the nearest road', ['nighthunt','disguise','capture']],
    ['grew up in the slums of a city of ten million', ['nighttrain','auction','bandits']],
    ['was born into a noble house with a very long name', ['auction','quiz']],
    ['grew up with a travelling circus', ['egg','cliffpath','beast']],
    ['was raised in an orphanage that ran out of money every spring', ['marathon','stairs']],
    ['comes from a frontier town where everyone carries a knife', ['prisoner','bandits','guardians']],
    ['grew up on a swamp island you can only reach by boat', ['wetlands','raft']],
    ['was raised on a ranch full of animals nobody else could handle', ['capture','beast']],
    ['grew up above a busy restaurant', ['cooking']],
    ['comes from a mining town that lives underground', ['marathon','maze','tower']],
    ['grew up in a library {their} parents ran', ['quiz','treasure','maze']]
  ,['grew up on a lighthouse rock in the open sea',['sea','raft']],['comes from a desert caravan that never stops moving',['desert','marathon']],['grew up in the slums of a big port city',['bandits','auction','disguise']],['was raised in a cliffside village of rope bridges',['cliffpath','mountain','egg']],['grew up among night-market traders',['auction','nighttrain','quiz']],['comes from a hunting tribe deep in the forest',['nighthunt','capture','beast']],['grew up in an old prison town',['prisoner','tower']],['grew up on a river barge',['raft','bandits','wetlands']],['grew up in a floating market on stilts',['wetlands','auction','raft']],['comes from a mountain monastery that took in strays',['mountain','stairs','quiz']],['grew up in a city built inside a canyon',['cliffpath','maze','stairs']],['was raised on a whaling ship',['sea','beast']],['grew up in the back rooms of a casino',['auction','nighttrain','disguise']],['comes from a village that trains guard dogs',['capture','beast','guardians']],['grew up in a salt-mining town on the edge of a desert',['desert','marathon']],['was raised by smugglers on a mountain pass',['mountain','bandits','disguise']],['grew up in an old theatre',['disguise','quiz']],['comes from an island of beekeepers',['capture','cooking']],['grew up in a railway town where the trains never stop',['nighttrain','marathon']],['comes from a fortress town under constant siege',['prisoner','guardians','tower']],['grew up in a jungle research camp',['wetlands','nighthunt','egg']],['was raised in a famous restaurant kitchen',['cooking','auction']]],
  family:['raised by a grandmother who feared nothing','the youngest of six siblings','the only child of two doctors','the child of a smuggler','the child of a blacksmith','raised by an older sister','the child of a retired soldier','raised by a single father who drove a night bus','the child of street performers','adopted by a family of fishermen','raised by an uncle nobody talks about','the eldest of four, and the one who held them together','raised by a travelling monk','the middle child of a huge farming family','raised by a fisherman who never spoke','the child of a disgraced Hunter','raised in a temple by strangers','the twin of someone very different','raised by an aunt who sold maps','the child of a famous chef','raised by neighbours after {their} parents left','the only child of a lighthouse keeper','raised by a retired circus strongman','the child of two rival merchants','raised by a blind grandfather who taught by sound','one of eleven cousins raised in the same house','the child of a lighthouse-ship captain','raised by a priest who used to be a thief','the child of a wandering storyteller','raised by a mother who ran a boxing gym','the child of a famous gambler','raised by an older brother barely older than {them}','the child of a poisoner turned herbalist','raised by a whole village, a week at each house','the child of a cartographer who never came home','raised by a pair of retired assassins who deny everything'],
  job:['worked as a bodyguard','cooked in a roadside diner','picked pockets at train stations','crewed a cargo ship','studied at a university','served two years in a border army','performed on street corners','delivered mail across the mountains','worked in a mine','sold fake antiques','trained horses','washed dishes in a five-star hotel','was a night watchman','was an apprentice locksmith','hunted pests for farmers','guided tourists through ruins','ran a market stall','carried messages for a royal court','did stunts for travelling shows','fed the animals at a city zoo','cooked on a fishing boat','repaired clocks','dug graves','worked as a translator','sold umbrellas in a city where it never rains','worked as a bounty-board clerk','taught children to swim','was a bouncer at a fighting arena','hauled ice from the mountains','worked as a ship\'s cook','was a professional mourner','tested traps for a locksmith guild','ran a ferry across a dangerous river','worked as a stunt double','collected rare insects for museums','was an apprentice to a beast tamer','forged documents, allegedly','worked as a butler for a crime family','delivered milk at dawn for ten years','sang in a dockside tavern'],
  train:['taught {themselves} everything {they} know{s}','trained at a strict martial arts dojo','learned to fight in the army','learned to hunt with {their} father','learned everything from books','was trained by a retired Hunter','learned by getting into fights','trained alone in the mountains','copied moves from fighters {they} watched','learned to climb on the rooftops of {their} city','trained with a circus troupe','studied under a strict old swordmaster','learned to swim before {they} could walk','trained with the border patrol','learned to fight from a street gang','practised alone every night for ten years','learned survival from a hermit in the woods','learned to fight by watching Hunters on TV','trained in a waterfall every morning','copied an old martial arts manual page by page','sparred with a pet bear','trained under a master who never spoke','learned to dodge in crowded markets','trained by carrying stones up a mountain','learned from a different teacher in every town','studied fights in slow motion, frame by frame','trained in secret, at night, for years','was taught by an older sibling who failed the exam','learned to survive on the streets before {they} could read','trained with weights {they} made from scrap'],
  moment:['survived a shipwreck at nine','lost a duel that humiliated {them}','pulled a child out of a burning house','was left at a train station at six','saw a Hunter save {their} town','spent a winter lost in the mountains','was betrayed by {their} best friend','won a fortune and lost it in a single night','watched {their} home flood','once outran a bear, or so {they} claim{s}','was kidnapped as a child and escaped alone','got lost in a desert for three days','was the only survivor of a landslide','gave away everything {they} owned','was saved by a stranger who never gave a name','won a fighting tournament at twelve','was cheated out of an inheritance','spent a year living on the streets','failed an exam {they} {were} sure to pass','met a three-star Hunter on a train','lost a sibling to a beast attack','was struck by lightning and survived','watched a Hunter walk away from a fight {they} could have won','read a Hunter\'s memoir and could not sleep for a week','lost a bet that cost {them} {their} home','saw a Chimera Ant in the news and decided to get stronger','fell through ice and pulled {themselves} out','was mistaken for a criminal and chased for a day','stopped a robbery with a frying pan','was abandoned by {their} expedition group','saw an aurora that nobody else believed in','beat {their} old master in a duel','saved a rare beast from poachers','found {their} parent\'s old Hunter license in a drawer','lost {their} voice for a year and learned to listen','was crowned champion of a village eating contest'],
  fear:[['heights',['cliffpath','mountain','egg','stairs']],['deep water',['sea','raft','wetlands']],['the dark',['nighthunt','marathon','maze']],['closed spaces',['tower','maze','nighttrain']],['large animals',['capture','beast','wetlands']],['fire',['cooking']],['crowds',['auction','quiz']],['being alone',['desert','prisoner','guardians']],['snakes',['wetlands','nighthunt','desert']],['storms',['sea','raft','mountain']],['the cold',['mountain','cliffpath']],['spiders',['egg','maze','tower']],['falling behind',['marathon','stairs','desert']],['being watched',['disguise','auction','zevil']],['trains',['nighttrain']],['blood',['prisoner','guardians','beast']],['being lied to',['quiz','disguise','auction']],['rivers',['raft','bandits']],['silence',['nighthunt','zevil']],['failing in public',['quiz','cooking','auction']],['needles',[]],['birds',['egg','cliffpath']],['losing control',['beast','capture']],['being buried alive',['marathon','maze','guardians']],['deep forests',['nighthunt','wetlands']],['fast water',['raft','sea']],['mirrors',['disguise','tower']],['sand',['desert']],['heights over water',['cliffpath','egg']],['dogs',['capture','guardians']],['clowns',[]],['being forgotten',[]],['thunder',['mountain','sea']],['masks',['disguise','guardians']],['counting games',['quiz','auction']],['the smell of blood',['cooking','prisoner']],['deep holes',['marathon','tower','egg']],['fog',['wetlands','nighthunt','cliffpath']],['insects',['wetlands','capture']],['losing a friend',[]],['owls',['nighthunt']],['open sky',['desert','mountain']]],
  talent:[['can hold {their} breath for four minutes',['sea','raft','wetlands'],'endurance'],['never gets lost',['maze','desert','nighthunt','disguise'],'perception'],['can hear footsteps from far away',['nighthunt','zevil','disguise'],'perception'],['can climb almost anything',['cliffpath','mountain','egg'],'agility'],['gets along with any animal',['capture','beast'],'charisma'],['can cook anything',['cooking'],'intelligence'],['reads people like a book',['auction','quiz','nighttrain'],'charisma'],['can run all day',['marathon','stairs','desert'],'endurance'],['spots traps at a glance',['tower','treasure','guardians'],'intelligence'],['never panics in a fight',['prisoner','bandits','guardians'],'combat'],['can see in near-total darkness',['nighthunt','marathon','maze'],'perception'],['has the balance of a cat',['cliffpath','raft','egg'],'agility'],['can carry twice {their} own weight',['mountain','stairs','raft'],'strength'],['can go days without food',['desert','marathon','zevil'],'endurance'],['remembers everything {they} read{s}',['quiz','treasure','tower'],'intelligence'],['can talk anyone into anything',['auction','bandits','disguise'],'charisma'],['swims like a fish',['sea','raft','wetlands'],'endurance'],['always finds a loophole in the rules',['tower','quiz','auction'],'strategy'],['can read any map at a glance',['treasure','maze','desert'],'strategy'],['can sleep anywhere and wake up rested',['nighttrain','zevil','marathon'],'endurance'],['hits harder than {they} look{s}',['prisoner','guardians','bandits'],'combat'],['can mimic any voice',['disguise','nighttrain','zevil'],'charisma'],['can track anything that moves',['capture','nighthunt','zevil'],'perception'],['never lets a teammate fall behind',['tower','raft','maze'],'teamwork'],['knows every poisonous plant by sight',['wetlands','cooking','nighthunt'],'intelligence'],['moves without making a sound',['nighthunt','zevil','capture'],'agility'],['can hold a grudge and a rope equally well',['mountain','cliffpath'],'determination'],['never gives up on a bad plan',['marathon','stairs','desert'],'determination'],['can bluff with a straight face for hours',['auction','disguise','quiz'],'strategy'],['calms any crowd',['nighttrain','bandits','guardians'],'charisma'],['learns any game after one round',['auction','quiz','tower'],'intelligence'],['can feel a storm coming a day early',['sea','mountain','raft'],'perception'],['knows how to fall without getting hurt',['cliffpath','egg','stairs'],'agility'],['can lift a cart by one corner',['raft','tower','guardians'],'strength'],['fights better when outnumbered',['prisoner','bandits','zevil'],'combat'],['can cook a feast from almost nothing',['cooking','desert','zevil'],'intelligence'],['never forgets a face',['disguise','nighttrain','zevil'],'perception'],['keeps going long after others drop',['marathon','stairs','mountain'],'determination'],['can climb a wall with bare hands',['tower','cliffpath','egg'],'strength'],['can hide in plain sight',['disguise','zevil','nighthunt'],'agility'],['makes friends with the guards',['prisoner','guardians','bandits'],'charisma'],['walks into danger without blinking',['guardians','prisoner','beast'],'courage'],['can read a riddle backwards',['quiz','treasure','bandits'],'intelligence'],['sees a weak spot in anything',['prisoner','guardians','tower'],'combat']],
  keep:['a cracked compass from {their} mother','a knife with someone else\'s initials','a photo of a house that no longer exists','a lucky marble','a letter {they} {have} never opened','{their} grandfather\'s old Hunter guidebook','a ribbon from a sister','a broken pocket watch','a coin from a country that no longer exists','a whistle carved from bone','a map with one place circled','a lock of someone\'s hair','a jar of sand from home','a toy soldier missing an arm','a pressed four-leaf clover','a dented harmonica','a bracelet made of fishing line','a key that opens nothing {they} know{s} of','a wanted poster with {their} own face on it','a recipe book in a dead language','a cheap ring won at a fair','a tooth from the first beast {they} hunted','a sealed envelope addressed to the Chairman','a small knife {their} father forged','a paper crane folded by a dying friend','a jar of honey from home','a pocket mirror with a crack','the button off a Hunter\'s coat','a chess piece, the black queen','a flute {they} cannot play','a smooth stone from {their} mother\'s grave','a tin of mints that never seems to run out','a lucky sock, unwashed','a medal {they} did not earn','a feather from a bird {they} raised','a tiny bell sewn into {their} sleeve','a tattered children\'s book about Hunters','a pair of dice that always roll seven','a cracked teacup wrapped in cloth','a train ticket that was never used'],
  wait:['A younger brother is waiting at home, counting the days.','{Their} mother lit a candle for {them} before {they} left.','Nobody is waiting for {them}, and {they} like{s} it that way.','A whole village pooled money for {their} trip.','{Their} partner thinks {they} {are} on a business trip.','An old dog is waiting by the door.','{Their} old teacher made {them} promise to write. {They} {have} not.','A twin is waiting at home, convinced {they} will fail.','{Their} grandmother keeps a chair by the window for {them}.','A small dojo is waiting for {them} to come back as its master.','{Their} creditors are waiting, too.','A rival back home bet {they} would not last a day.','{Their} younger siblings drew {them} a good-luck card.','Nobody knows {they} {are} here.','{Their} old crew sent {them} off with a terrible song.','A shop with {their} name on it has been closed since {they} left.','Somewhere, a dog is still waiting at the station.','A grumpy cat is waiting at home, unimpressed.','{Their} rival is waiting too, hoping {they} fail{s}.','{Their} parents think {they} {are} at a cooking school.','A girl from the next village keeps asking when {they} will be back.','{Their} old master has already carved {their} name on the dojo wall.','A whole football team signed a flag for {them}.','{Their} landlord wants this month\'s rent first.','A little sister sleeps in {their} bed until {they} come{s} back.','{Their} hometown has already planned the parade.','{Their} ex is waiting, but not in a good way.','Three nephews want stories when {they} get{s} home.','Nobody back home even knows what a Hunter is.'],
  dream:['open a restaurant nobody can find without a license','explore the Dark Continent','buy {their} family a house','become a three-star Hunter before thirty','find the treasure from {their} grandfather\'s stories','never be poor again','teach the next generation','see every country at least once','find out who {they} really {are}','map the places nobody has mapped','track down the person who abandoned {them}','start {their} own guild','retire somewhere quiet with a lot of money','make the front page of the Hunter Herald','find a cure nobody has found','hunt a beast nobody has ever seen','prove {their} family wrong','buy back the land {their} family lost','read everything in the Hunter archives','find the city from {their} grandmother\'s lullaby','become the Hunter who finally catches the Phantom Troupe','eat at every Gourmet restaurant in the world','fund a school for street children','climb the World Tree','get a beast named after {them}','be the first in {their} family to finish anything','build a home that cannot be taken away','pay back everyone who ever helped {them}','open a gym for people nobody else trains','live long enough to be bored','collect every rare beast\'s autograph, somehow','see {their} name carved in Heavens Arena'],
  since:['spent the year training with a retired Hunter','worked on a fishing boat to pay for the trip','studied every report of the last exam','swore {they} would never come back, and came back anyway','trained every single morning since the last exam','travelled the world looking for better teachers','spent months healing from the last attempt','opened a small dojo and closed it again','travelled to the edge of the world and turned back','spent the year working off a debt','went home and came back with a new scar','studied every examiner\'s old records','fought in Heavens Arena and reached the 100th floor','learned a new language just to read old exam reports','worked as a guide for this year\'s candidates, briefly','lost a lot of weight and gained a lot of muscle','got married, and came anyway','spent the year as a dishwasher, saving every coin','trained with a former examiner who owed {them} a favour','survived a shipwreck on the way here']
};
function background(c){
  if(c.bg) return c.bg;
  const h = k => nhash(c.id + ':bg:' + k), pick = (arr, k) => h(k) % arr.length;
  // talent follows the strongest matching attribute; fear avoids the phases the talent covers
  const tal = BG.talent.map((t, i) => ({i, v: (c.a[t[2]] || 50) + h('t' + i) % 25})).sort((x, y) => y.v - x.v)[0].i;
  const fears = BG.fear.map((f, i) => i).filter(i => !BG.fear[i][1].some(x => BG.talent[tal][1].includes(x)));
  c.bg = {origin: pick(BG.origin, 'o'), family: pick(BG.family, 'f'), job: pick(BG.job, 'j'), train: pick(BG.train, 'tr'), moment: pick(BG.moment, 'm'),
    fear: c.a.courage < 70 || h('fq') % 3 === 0 ? fears[h('fe') % fears.length] : null, talent: tal, keep: pick(BG.keep, 'k'), wait: pick(BG.wait, 'w'), dream: pick(BG.dream, 'd')};
  if(c.family && c.family.bg){ if(c.family.type !== 'adopted') c.bg.origin = c.family.bg.origin % BG.origin.length; c.bg.wait = c.family.bg.wait % BG.wait.length; }
  return c.bg;
}
// talents, fears and home ground nudge a candidate in the phases they fit, and the log says so now and then
function backgroundBefore(S, ph, p, rng, active){
  if(ph.final) return;
  const hits = {fear: [], talent: [], home: []};
  active.forEach(c => {
    const b = background(c);
    if(BG.talent[b.talent][1].includes(ph.id)){ c.pmod = (c.pmod || 0) + 3; hits.talent.push(c); }
    if(b.fear !== null && BG.fear[b.fear][1].includes(ph.id)){ c.pmod = (c.pmod || 0) - 3; hits.fear.push(c); }
    if(BG.origin[b.origin][1].includes(ph.id)){ c.pmod = (c.pmod || 0) + 1.5; hits.home.push(c); }
  });
  const P = thePhase(ph.name), PC = P.charAt(0).toUpperCase() + P.slice(1);
  const one = arr => typeof castBias === 'function' ? castBias(S, arr, rng, 0.4) : arr.length ? arr[Math.floor(rng() * arr.length)] : null;   // the camp leans toward the cast
  const f = one(hits.fear), t = one(hits.talent), o = rng() < 0.5 ? one(hits.home) : null;
  if(f) dlog(S, p, 'story', vpick(S, [x => `${x.c.name} has been afraid of ${x.w} since childhood. ${x.PC} is a nightmare.`, x => `${x.c.name}'s fear of ${x.w} makes ${x.P} twice as hard.`, x => `${x.c.first} goes pale at the start of ${x.P}. ${x.w.charAt(0).toUpperCase() + x.w.slice(1)}. Of course it had to be ${/^being /.test(x.w) ? 'this' : x.w}.`], f.id)({c: f, w: BG.fear[f.bg.fear][0], P, PC}), [f.id], 4);
  if(t) dlog(S, p, 'story', vpick(S, [x => `${x.c.name} ${x.w}, and in ${x.P} it shows.`, x => `${x.PC} might as well have been designed for ${x.c.name}, who ${x.w}.`], t.id)({c: t, w: pro(BG.talent[t.bg.talent][0], t), P, PC}), [t.id], 3);
  if(o) dlog(S, p, 'story', `${o.name} ${BG.origin[o.bg.origin][0]}. ${PC} feels like home.`, [o.id], 3);
}
const FAM_EV = {
  close: [o => `The ${o.Ls} share one blanket and one plan in ${o.P}.`, o => `Whenever one of the ${o.Ls} falls behind, another is already there.`, o => `The ${o.Ls} check on each other every hour in ${o.P}, whether they need to or not.`],
  legacy: [o => `"Our name is on the wall of the Association," ${o.a.first} reminds ${o.b.first}. Nobody relaxes.`, o => `An examiner recognises the ${o.L} name. The ${o.Ls} stand up straighter.`, o => `${o.a.first} has heard the family stories about this exam a hundred times. None of them mentioned ${o.P}.`],
  fractured: [o => `${o.a.name} and ${o.b.name} argue loudly in ${o.P}. Other candidates move away.`, o => `${o.a.first} refuses to wait for ${o.b.first}. The ${o.L} family splits up for the day.`, o => `${o.a.name} pretends not to know ${o.b.name} when an examiner asks.`],
  strangers: [o => `${o.a.name} and ${o.b.name} compare old photographs and realise they are family. Neither knows what to say.`, o => `A birthmark, a surname, a story about a lost relative: ${o.a.first} and ${o.b.first} finally understand who they are to each other.`, o => `${o.a.first} hears someone call out the ${o.L} name in ${o.P}, turns around, and meets a relative for the first time.`],
  adopted: [o => `Someone mocks the ${o.Ls} for not looking alike. ${o.a.first} and ${o.b.first} make them regret it.`, o => `The ${o.Ls} have a secret handshake. They use it before every phase.`, o => `${o.a.first} and ${o.b.first} share their water without a word. Blood has nothing to do with it.`],
  clan: [o => `Candidates give the ${o.Ls} a wide berth in ${o.P}. Nobody wants to be next to them in the dark.`, o => `${o.a.name} cracks ${PR(o.a).their} knuckles and the whole row of candidates moves back.`, o => `Rumours spread in ${o.P} about what the ${o.Ls} do for a living. Nobody dares to ask.`],
  business: [o => `${o.a.name} and ${o.b.name} spend ${o.P} negotiating who inherits what if one of them falls.`, o => `The ${o.Ls} try to buy their way past an obstacle. It almost works.`, o => `${o.a.first} offers another candidate a contract in the middle of ${o.P}. It has a lot of fine print.`],
  poor: [o => `The ${o.Ls} split a single sandwich four ways in ${o.P}, and laugh about it.`, o => `${o.a.first} keeps a list of everything the family spent to get here. It is a long list.`, o => `${o.a.first} patches ${o.b.first}'s boots with string in ${o.P}. They have to last the whole exam.`],
  protective: [o => `${o.a.name} spends ${o.P} watching ${o.b.first} instead of the road ahead.`, o => `${o.b.name} begs ${o.a.first} to stop hovering. ${o.a.first} does not stop.`, o => `${o.a.first} takes a hit meant for ${o.b.first} in ${o.P} and pretends it did not hurt.`],
  rival: [o => `${o.a.name} and ${o.b.name}, from rival branches of the ${o.L} family, race each other through ${o.P}.`, o => `Old family grudges flare up in ${o.P}: ${o.a.first} will not let ${o.b.first} finish ahead.`, o => `The ${o.L} cousins refuse to share a route in ${o.P}, even when it costs them both.`]
};
function familyBefore(S, ph, p, rng, active){
  if(ph.final) return;
  const groups = {};
  active.forEach(c => { if(c.famActive && c.fam && c.family && c.family.type) (groups[c.family.key] = groups[c.family.key] || []).push(c); });
  S._famLog = S._famLog || {}; S._famRev = S._famRev || {};
  Object.entries(groups).forEach(([k, g]) => {
    if(g.length < 2) return;
    const t = g[0].family.type, add = (c, v) => c.pmod = (c.pmod || 0) + v;
    const top = Math.min(...g.map(c => c.family.gen)), elders = g.filter(c => c.family.gen === top), kids = g.filter(c => c.family.gen > top);
    if(['close', 'adopted', 'poor'].includes(t) || (t === 'strangers' && S._famRev[k])) g.forEach(c => add(c, 1.5));
    if(t === 'legacy') g.forEach(c => add(c, 1));
    if(t === 'fractured') g.forEach(c => add(c, -1));
    if(t === 'clan' && ['prisoner', 'guardians', 'bandits', 'zevil', 'beast'].includes(ph.id)) g.forEach(c => add(c, 2));
    if(t === 'business' && ['auction', 'quiz'].includes(ph.id)) g.forEach(c => add(c, 4));
    if(t === 'protective' && kids.length){ elders.forEach(c => add(c, -1)); kids.forEach(c => add(c, 2.5)); }
    let a = g[0], b = g[1];
    if(t === 'protective' && kids.length) { a = elders[0]; b = kids[0]; }
    if(t === 'rival'){ const x = g.find(c => g.some(o => o.family.br !== c.family.br)); if(x){ a = x; b = g.find(o => o.family.br !== x.family.br); } }
    if((t === 'fractured' || t === 'rival') && rng() < 0.07 && !hasGrudge(a, b)){ addGrudge(a, b, `fought with {them} in the ${ph.name}`); addGrudge(b, a, `fought with {them} in the ${ph.name}`); }
    const reveal = t === 'strangers' && !S._famRev[k] && rng() < 0.35;
    if(reveal) S._famRev[k] = p;
    if(reveal || (t !== 'strangers' && !S._famLog[k] && rng() < 0.22)){
      S._famLog[k] = p;
      const P = thePhase(ph.name), L = g[0].family.last;
      dlog(S, p, 'family', vpick(S, FAM_EV[t], k)({a, b, L, Ls: famPl(L), P}), [a.id, b.id], 4);
    }
  });
}
function dramaBefore(S, ph, p, rng, active){
  castPhase(S, p, active.filter(c => c.status === 'Active'));
  backgroundBefore(S, ph, p, rng, active);
  personalNicks(S, ph, p, rng, active);
  familyBefore(S, ph, p, rng, active);
  traitMoments(S, ph, p, rng, active);
  active.forEach(c => { if(c.bondFire === p) c.pmod = (c.pmod || 0) + 3; if(c.debtHit === p) c.pmod = (c.pmod || 0) - 6; if(THEME === 'rookie' && (c.attempts || []).length <= 1) c.pmod = (c.pmod || 0) + 3.5; });
  if(ph.final || ph.zevil) promisesAt(S, ph, p);
  crusherActs(S, ph, p, rng, active);
  if(!ph.final) setPieces(S, ph, p, rng, active.filter(c => c.status === 'Active'));
  lightEvents(S, ph, p, rng, active.filter(c => c.status === 'Active'));
  makePromise(S, ph, p, rng, active);
}
function dramaAfter(S, ph, p, rng){
  castFalls(S, ph, p);
  if(p === 0) castIntro(S, p);
  const m = cmap(S);
  if(!ph.final) bondsAfter(S, ph, p, rng);
  if(!ph.final) secretsAfter(S, ph, p, rng);
  // sabotage aftermath
  S.candidates.forEach(v => {
    if(v.sabP === p && v.status === 'Eliminated' && v.out === p && m[v.sabBy]) dlog(S, p, 'sabot', vpick(S, T_SAB_AFTER, v.id)({v, c: m[v.sabBy]}), [v.sabBy, v.id], 7);
  });
  // debts that can never be repaid
  S.candidates.forEach(d => {
    if(!d.debt || d.status !== 'Active') return;
    const c = m[d.debt.to];
    if(c && c.out === p && c.status !== 'Approved'){
      if(d.debt.p < p && rng() < 0.3) dlog(S, p, 'arc', `${d.name} owed ${c.name} from ${thePhase(d.debt.from)}, a debt that can never be repaid now.`, [d.id, c.id], 4);
      d.debt = null;
    }
  });
  if(!ph.final) promisesAt(S, ph, p);
  // new injuries from exhaustion in physical phases
  if(PHYSICAL.has(ph.id) || ph.fatigue >= 20){
    let n = 0;
    S.candidates.filter(c => c.status === 'Active' && c.fatigue > 55 && !c.injury).forEach(c => {
      if(n >= 2 || rng() >= (THEME === 'wild' ? 0.22 : 0.08)) return;
      const inj = injure(S, c, p, rng); if(!inj) return; n++;
      dlog(S, p, 'arc', vpick(S, T_INJ_NEW, c.id)({c, w: inj.w, ph: ph.name}), [c.id], 4);
    });
  }
  // injuries heal over time
  S.candidates.forEach(c => {
    if(c.pmod) c.pmod = 0;
    if(c.injury && c.injury.p < p && c.status === 'Active'){
      c.injury.left--;
      if(c.injury.left <= 0){ log(S, p, 'arc', `${c.name}'s ${c.injury.w} has healed.`, [c.id], true); c.injury = null; }
    }
  });
}


