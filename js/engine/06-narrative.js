/* ===== Duel fatalities ===== */
const FATALITIES = true; // fatalities setting (always on in this simulator)
const duelPower = c => weighted(c, {strength:.25, combat:.35, speed:.2, agility:.2}) + (c.nen ? c.nen.output * 0.1 : 0) - (c.fatigue || 0) * 0.3;
function fatalityChance(A, B){
  if(!FATALITIES) return 0;
  const d = Math.abs(duelPower(A) - duelPower(B));
  return d <= 10 ? 0 : d <= 20 ? .02 : d <= 30 ? .05 : d <= 40 ? .08 : d <= 50 ? .12 : d <= 60 ? .16 : .20;
}
// one roll per finished duel between two candidates; returns true if the loser died
function fatalRoll(S, rng, winner, loser){
  const f = fatalityChance(winner, loser), chance = S.theme === 'blood' ? Math.min(0.3, Math.max(0.05, f * 2.5)) : Math.min(0.2, f);
  return rng() < chance;
}
function lastWords(S, p, v, k){
  persona(v);
  (S.alliances || []).filter(A => A.ever.includes(v.id)).forEach(A => A.ever.forEach(id => { const o = cmap(S)[id]; if(o && o !== k && o !== v) addGrudge(o, k, `killed ${v.first}`); }));
  if(nhash(v.id + 'lw') % 10 < 6){ const w = MOTIVES[v.motive].last; v.lastWords = w; log(S, p, 'death', vpick(S, T_LAST, v.id)({v, w}), [v.id]); }
}
function killOutsideFinal(S, p, rng, killer, victim, where){
  victim.status = 'Deceased'; victim.out = p; victim.reason = `${PHASES[p].name}: killed by ${killer.name}${where ? ' ' + where : ''}`;
  victim.killedBy = killer.id; killer.kills = (killer.kills || 0) + 1;
  victim.notes.push({p, text:`Killed by ${killer.name}${where ? ' ' + where : ''}`});
  log(S, p, 'death', `Fatal Duel: ${killer.name} killed ${victim.name}.`, [killer.id, victim.id]);
  const fe = S.log[S.log.length - 1];   // one line tells the kill and what came of it
  lastWords(S, p, victim, killer);
  const caught = rng() < 0.5; // detection: always exactly 50%
  if(caught){
    killer.status = 'Disqualified'; killer.out = p; killer.reason = `${PHASES[p].name}: caught after killing ${victim.name} and expelled from the exam`;
    killer.notes.push({p, text:`Killed ${victim.name} and was caught — expelled`});
    fe.text = fe.text.replace(/\.$/, ' and was caught. Disqualified.');
  } else {
    killer.notes.push({p, text:`Killed ${victim.name} and was not caught`});
    fe.text = fe.text.replace(/\.$/, '. Nobody saw it, and the exam goes on.');
    giveNick(S, killer, 'ghost', `for a kill no one could prove`, p, 0.6);
  }
  return caught;
}

/* ===== Narrative: personas, nicknames, grudges and varied prose ===== */
const nhash = s => { let h = 2166136261; for(const ch of String(s)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
// deterministic choice: same seed, same story; never touches the simulation's random stream
// pick a variant, preferring the ones this exam has used least, so the same sentence does not keep coming back
const _vuse = new WeakMap();
const vpick = (S, arr, salt) => {
  if(arr.length < 2) return arr[0];
  let u = _vuse.get(S); if(!u){ u = new Map(); _vuse.set(S, u); }
  const key = arr.length + '|' + String(arr[0]).slice(0, 80);
  let c = u.get(key); if(!c){ c = new Array(arr.length).fill(0); u.set(key, c); }
  const min = Math.min(...c), opts = []; c.forEach((v, i) => { if(v === min) opts.push(i); });
  const M = S.smem = S.smem || {}, fresh = opts.filter(i => { const v = M['v' + nhash(key + '|' + i).toString(36)]; return v === undefined || S.edition - v > 2; });   // and, across exams, the ones not heard lately
  const pool = fresh.length ? fresh : opts, i = pool[nhash(S.seed + ':' + S.log.length + ':' + salt) % pool.length]; c[i]++; M['v' + nhash(key + '|' + i).toString(36)] = S.edition;
  return arr[i];
};
const T_SUM = a => Object.values(a).reduce((s, v) => s + v, 0);
// [name, condition on attributes, description, weight]; temperaments (weight 1) can land on anyone, attribute traits weigh more
const TRAITS = [
  ['Hot-headed', a => a.combat >= 65 && a.teamwork < 45, 'quick to anger and quicker to swing', 3],
  ['Schemer', a => a.strategy >= 66 && a.charisma < 50, 'always three moves ahead and trusted by no one', 3],
  ['Guardian', a => a.courage >= 60 && a.teamwork >= 62, 'the kind who goes back for the people left behind', 3],
  ['Charmer', a => a.charisma >= 70, 'makes friends faster than enemies can be counted', 2],
  ['Stoic', a => a.determination >= 70 && a.charisma < 52, 'says little, never quits', 3],
  ['Daredevil', a => a.courage >= 70 && a.strategy < 48, 'jumps first and plans on the way down', 3],
  ['Bookworm', a => a.intelligence >= 70 && a.strength < 48, 'brilliant on paper, fragile in a fight', 3],
  ['Brute', a => a.strength >= 70 && a.intelligence < 46, 'solves most problems by hitting them', 3],
  ['Lone Wolf', a => a.teamwork < 36, 'trusts nobody and prefers it that way', 2],
  ['Watcher', a => a.perception >= 72, 'notices everything and forgets nothing', 2],
  ['Sprinter', a => a.speed >= 72, 'already gone before anyone reacts', 2],
  ['Ironhide', a => a.endurance >= 72, 'built to outlast', 2],
  ['Tactician', a => a.strategy >= 70, 'reads a fight like a board game', 2],
  ['Diplomat', a => a.charisma >= 60 && a.teamwork >= 60, 'talks rivals into allies', 3],
  ['Survivor', a => a.determination >= 64, 'has been knocked down before and got up every time', 1.5],
  ['Glass Cannon', a => a.strength >= 70 && a.endurance < 42, 'hits like a truck, breaks like a teacup', 4],
  ['Bulwark', a => a.endurance >= 68 && a.strength >= 65, 'stands in the way of everything', 3],
  ['Acrobat', a => a.agility >= 74, 'treats walls as floors', 3],
  ['Mastermind', a => a.intelligence >= 74 && a.strategy >= 68, 'has planned the whole exam in {their} head', 4],
  ['Coward', a => a.courage < 30, 'runs first and asks questions from a safe distance', 3],
  ['Show-off', a => a.charisma >= 64 && a.courage >= 64, 'needs an audience, and always finds one', 3],
  ['Hermit', a => a.charisma < 30, 'speaks maybe twice a day', 3],
  ['Bruiser', a => a.combat >= 70 && a.strength >= 62, 'fights for the fun of it', 3],
  ['Duelist', a => a.combat >= 70 && a.agility >= 64, 'treats every fight like a dance', 3],
  ['Workhorse', a => a.determination >= 68 && a.endurance >= 64, 'never fast, never stops', 3],
  ['Quitter', a => a.determination < 30, 'always has one eye on the exit', 3],
  ['Klutz', a => a.agility < 30, 'trips over things that are not there', 3],
  ['Dreamer', a => a.intelligence >= 60 && a.perception < 38, 'brilliant, distracted and usually somewhere else', 3],
  ['Team Player', a => a.teamwork >= 72, 'happiest as one part of something bigger', 2],
  ['Born Leader', a => a.charisma >= 64 && a.teamwork >= 55 && a.courage >= 55, 'people simply follow', 3],
  ['Underdog', a => T_SUM(a) < 520, 'nobody expected {them} to make it past the gate', 3],
  ['Prodigy', a => T_SUM(a) >= 760, 'good at everything, and knows it', 5],
  ['Berserker', a => a.combat >= 64 && a.strategy < 38, 'stops thinking the moment the fighting starts', 4],
  ['Scout', a => a.speed >= 64 && a.perception >= 64, 'always the first to see what is ahead', 3],
  ['Escape Artist', a => a.agility >= 66 && a.intelligence >= 60, 'no knot, lock or corner holds {them} for long', 3],
  ['Lurker', a => a.perception >= 64 && a.charisma < 40 && a.agility >= 58, 'you only notice {them} when {they} {are} already behind you', 4],
  ['Gentle Giant', a => a.strength >= 70 && a.teamwork >= 58, 'could crush you, would rather carry you', 4],
  ['Iron-willed', a => a.determination >= 80, 'cannot be talked out of anything', 3],
  ['Pacifist', a => a.combat < 45 && a.teamwork >= 50, 'refuses to hurt anyone if it can be helped', 2],
  ['Thrill-seeker', a => a.courage >= 58, 'is only here for the danger', 0.6],
  ['Know-it-all', a => a.intelligence >= 62, 'corrects the examiners, out loud', 0.6],
  ['Gossip', a => a.charisma >= 50, 'knows everyone\'s secrets by the second day', 0.6],
  ['Merchant', a => a.charisma >= 50 && a.strategy >= 50, 'sells things to the other candidates', 1.5],
  ['Gambler', () => true, 'bets on everything, including {themselves}', 0.3],
  ['Joker', () => true, 'cracks jokes at the worst possible moments', 0.3],
  ['Glutton', () => true, 'thinks about food more than about the license', 0.3],
  ['Perfectionist', () => true, 'does everything twice, just to be sure', 0.3],
  ['Optimist', () => true, 'is sure it will all work out', 0.3],
  ['Pessimist', () => true, 'is certain everyone is doomed, {themselves} first', 0.3],
  ['Romantic', () => true, 'falls a little in love in every phase', 0.3],
  ['Collector', () => true, 'pockets a souvenir from every phase', 0.3],
  ['Drifter', () => true, 'has never stayed anywhere for long', 0.3],
  ['Mystic', () => true, 'reads omens in clouds and tea leaves', 0.3],
  ['Insomniac', () => true, 'never seems to sleep', 0.3],
  ['Prankster', () => true, 'cannot resist a practical joke', 0.3],
  ['Worrier', () => true, 'checks the map nine times', 0.3],
  ['Aristocrat', () => true, 'acts like royalty, and might actually be', 0.3],
  ['Zealot', () => true, 'believes the license is a sacred calling', 0.3],
  ['Wildcard', () => true, 'hard to predict, even for {themselves}', 0.1]
];
const MOTIVES = [
  {m:'to avenge an older brother lost to a Blacklist bounty', pass:'One step closer to the man who killed their brother.', fail:'The brother\'s killer will have to wait another year.', last:'Tell my mother I tried.'},
  {m:'to pay off a family debt that grows every month', pass:'The license alone is worth more than the debt.', fail:'The debt collectors will be waiting at home.', last:'The debt... is still mine.'},
  {m:'to find a parent who left to become a Hunter and never came back', pass:'Now they can finally go looking.', fail:'The trail goes cold for another year.', last:'I almost found you.'},
  {m:'for access to restricted ruins no one else may enter', pass:'The sealed doors are open to them now.', fail:'The ruins stay sealed.', last:'The ruins... someone else will have to see them.'},
  {m:'to prove a strict family wrong', pass:'The family will have to admit they were wrong.', fail:'They will hear "we told you so" for a long time.', last:'Don\'t let them say they were right.'},
  {m:'to cure a sister\'s rare illness with a Hunter-only medicine', pass:'The medicine is within reach now.', fail:'The medicine stays out of reach.', last:'Someone take care of her.'},
  {m:'because a Hunter once saved {their} village', pass:'Now they can be that Hunter for someone else.', fail:'The village will have to wait for its hero.', last:'I wanted to repay them.'},
  {m:'for the fame — and the endorsements', pass:'The sponsors are already calling.', fail:'No sponsor calls back a loser.', last:'At least they\'ll remember my name.'},
  {m:'to hunt the beast that destroyed {their} farm', pass:'The beast\'s days are numbered.', fail:'The beast roams free another year.', last:'It\'s still out there.'},
  {m:'to get into the Gourmet circles {they} {have} dreamed of since childhood', pass:'The great kitchens of the world just opened their doors.', fail:'The great kitchens will have to wait.', last:'I never cooked the perfect dish.'},
  {m:'to track down a stolen family heirloom', pass:'The heirloom has nowhere left to hide.', fail:'The heirloom stays lost.', last:'Find it for me.'},
  {m:'simply because {they} {were} bored', pass:'Boredom is cured, at least for now.', fail:'Back to being bored.', last:'Well, that wasn\'t boring.'},
  {m:'on a bet with an old friend', pass:'They won the bet.', fail:'They owe their friend dinner — and an apology.', last:'Guess I lost the bet.'},
  {m:'to escape a life someone else planned for {them}', pass:'The planned life is behind them for good.', fail:'The planned life is waiting at home.', last:'At least I chose this.'},
  {m:'to protect a younger sibling who wants to take the exam next year', pass:'Now they can watch over the next generation.', fail:'The sibling will have to go in without a guide.', last:'Don\'t follow me here.'},
  {m:'to test a fighting style no master would teach {them}', pass:'Their style just earned its proof.', fail:'The style still needs work.', last:'It wasn\'t the style that failed.'},
  {m:'for the right to enter a forbidden archive', pass:'The archive\'s doors are open.', fail:'The archive stays closed.', last:'All those books...'},
  {m:'to settle a score with a former partner who passed last year', pass:'Now they stand as equals with the partner who left them behind.', fail:'The old partner is still one step ahead.', last:'Tell them I came close.'},
  {m:'to make a dead mentor proud', pass:'Somewhere, their mentor is smiling.', fail:'The mentor\'s lessons will have to last another year.', last:'Master, I\'m sorry.'},
  {m:'to fund an orphanage that is running out of money', pass:'The orphanage can keep its doors open.', fail:'The orphanage will struggle through another winter.', last:'The children...'},
  {m:'because the license grants passage across closed borders', pass:'No border can stop them now.', fail:'The borders stay closed to them.', last:'I wanted to see the other side.'},
  {m:'to hunt a legendary treasure everyone else calls a myth', pass:'The myth is about to get a visitor.', fail:'The myth stays a myth.', last:'It was real. I know it was.'},
  {m:'to clear {their} family name', pass:'The family name is clean again.', fail:'The family name stays stained.', last:'Our name... clear it.'},
  {m:'for revenge on a gang that burned {their} home', pass:'The gang should start running.', fail:'The gang sleeps easy another year.', last:'They won.'},
  {m:'to see how far {they} can go', pass:'Further than anyone expected.', fail:'Now they know where the limit was — this year.', last:'So this is how far.'},
  {m:'because a fortune teller said {they} would', pass:'The fortune teller was right.', fail:'The fortune teller owes them a refund.', last:'She said I would make it.'},
  {m:'to earn the respect of a famous Hunter parent', pass:'The famous parent will have to take notice now.', fail:'The famous parent will not even ask how it went.', last:'Did you watch?'},
  {m:'to search for a lost expedition', pass:'The expedition has a rescuer now.', fail:'The lost expedition stays lost.', last:'They\'re still out there waiting.'},
  {m:'to get away from a city that remembers too much', pass:'The city is finally behind them.', fail:'Back to the city that remembers.', last:'At least I left.'},
  {m:'to build a sanctuary for endangered beasts', pass:'The sanctuary has its first protector.', fail:'The beasts will have to wait for their sanctuary.', last:'Keep them safe.'},
  {m:'to find the Hunter who saved {their} life and say thank you', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to win back a family sword sold to a collector', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to get into the Hunter archives and find out what happened to {their} village', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'because {their} late mother made {them} promise', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to protect {their} island from poachers', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to become strong enough to never be pushed around again', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to impress someone who will never notice', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to earn enough to rebuild a burned-down school', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to map the uncharted coast {their} grandfather never finished', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'because a stranger gave {them} the entry fee and vanished', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to beat an older sibling who already has a license', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'},
  {m:'to get access to a cure only Hunters can buy', pass:'The road ahead is open now.', fail:'Another year of waiting.', last:'I was so close.'}
];
function persona(c){
  if(!c.trait){
    const hits = TRAITS.filter(t => t[1](c.a)), tot = hits.reduce((s, t) => s + (t[3] || 1), 0);
    let r = (nhash(c.id + 't2') / 4294967296) * tot; c.trait = hits[hits.length - 1][0];
    for(const t of hits){ r -= (t[3] || 1); if(r <= 0){ c.trait = t[0]; break; } }
  }
  if(c.quirk === undefined) c.quirk = nhash(c.id + 'q') % QUIRKS.length;
  if(c.motive === undefined) c.motive = nhash(c.id + 'm') % MOTIVES.length;
}
const QUIRKS = ['carries a pet lizard in {their} coat','hums the same three notes all day','never takes off a battered pair of goggles','writes everything down in a tiny notebook','eats only boiled eggs','talks to {their} shoes','collects other people\'s buttons','sleeps standing up','wears a different hat every day','counts everything','bows before every challenge','keeps a lucky coin and flips it constantly','refuses to step on cracks','sharpens a pencil {they} never use{s}','whistles when nervous','quotes a grandmother nobody has met','is covered in tattoos of maps','carries a folding chair everywhere','apologises to furniture','has a laugh you can hear across a valley','braids {their} hair before every fight','never says {their} own name','smells faintly of smoke','keeps score of everything in {their} head','sketches the other candidates','never removes a pair of white gloves','talks to the weather','is always eating something','wears one earring shaped like a key','has a scar {they} tell{s} a different story about each time','keeps a dried flower in {their} pocket','sings in {their} sleep','bites {their} nails down to nothing','prays before every meal','is followed everywhere by a stray cat','cracks {their} knuckles one by one','wears sunglasses at night','speaks only in questions when tired','carries a book {they} never open{s}','salutes the examiners','keeps a journal of every insult','juggles stones to calm down','always sits facing the door','renames every animal {they} meet{s}','hoards matches','walks barefoot','drinks only cold tea','checks {their} pulse constantly','paints {their} nails black before each phase','tells terrible riddles','can name every star','keeps a tally of near-death experiences on {their} arm','wears a coat three sizes too big','carries {their} mother\'s compass','never turns {their} back on anyone','laughs when {they} get{s} hurt','smiles at everyone, constantly','writes letters {they} never send{s}','counts {their} steps out loud','talks to {their} reflection','never sits with {their} back to the sun','carries salt in every pocket','names every weapon {they} own{s}','laughs at {their} own jokes before the punchline','only eats things {they} cooked','snores like a bear','is always the first to wake','collects bottle caps','keeps a pet beetle in a matchbox','does push-ups whenever {they} {are} nervous','speaks to animals as if they understand','whistles the same lullaby every night','writes poems nobody is allowed to read','tells everyone {their} age is a secret','refuses to wear shoes, even in the snow','quotes old Hunter laws from memory','never finishes a sentence','calls everyone by the wrong name on purpose','keeps {their} money in {their} boots','ties a new knot in a string every day','hates being thanked','keeps a list of everyone {they} owe{s}','stretches for an hour before anything','wears a scarf in any weather','carries spare bandages for strangers','tastes everything first, even rocks','hums battle songs during meals','keeps score of how many times {they} {have} been underestimated'];
const TRAIT_NOUN = {'Hot-headed':'hothead', 'Stoic':'stoic', 'Lone Wolf':'lone wolf', 'Iron-willed':'iron-willed fighter', 'Born Leader':'born leader'};
const traitNoun = t => TRAIT_NOUN[t] || t.toLowerCase();
const aN = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const andList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const thePhase = n => /Island$/.test(n) ? n : 'the ' + n;
const atPhase = n => /Island$/.test(n) ? 'on ' + n : 'in the ' + n;
const traitDesc = (t, c) => pro((TRAITS.find(x => x[0] === t) || TRAITS[TRAITS.length - 1])[2], c);
const hasGrudge = (a, b) => !!(a && b && (a.grudges || []).some(g => g.id === b.id));
function addGrudge(c, o, why){
  if(!c || !o || c.id === o.id || o.id === 'examiner') return;
  c.grudges = c.grudges || [];
  if(!c.grudges.some(g => g.id === o.id)) c.grudges.push({id: o.id, name: o.name, why: pro(why, c), ed: typeof S !== 'undefined' && S ? S.edition : undefined});   // ed: when it started, so it can fade
}
const NICK = {
  ace: ['Ace','Comet','Prodigy','Natural','Bullet','Flash','Wonder'],
  life: ['the Lifeline','the Shepherd','the Anchor','the Good Samaritan','the Rope','the Saint','the Lantern','the Ferryman','the Second Chance','the Mother Hen','the Lighthouse','the Bridge','Safe Hands','the Net'],
  viper: ['the Viper','the Turncoat','Two-Face','the Knife','the Jackal','Snake Eyes'],
  ghost: ['the Ghost of Zevil','the Silent Blade','the Shadow','the Unseen','Nightfall'],
  magpie: ['the Magpie','the Badge Collector','the Pickpocket','the Hoarder','the Raven'],
  giant: ['the Giant-Slayer','the Upset','Long Odds','Slingshot'],
  hand: ['the Old Hand','the Guide','the Compass','the Pathfinder','Old Maps','Trail-Boss','the Usher','Follow-Me'],
  almost: ['the Uncrowned','the Runner-Up','the Last Step','Heartbreak','the Doorstep','the Unlicensed','So-Close']
};
// phase leaders get a name that fits the ground they conquered
const ACE_NICK = {
  sea:['Sea Legs','the Albatross','Saltwater'], quiz:['the Sphinx','Riddle-Eater','the Oracle'], disguise:['the Chameleon','Two-Faces','the Mask'],
  nighttrain:['the Conductor','Last Stop','the Stowaway'], cliffpath:['the Mountain Goat','Cliffwalker','Ropeless'], marathon:['the Mole','Tunnel Rat','the Engine'],
  stairs:['the Climber','Ten Thousand Steps','Lungs of Iron'], wetlands:['the Heron','Marsh Fox','Mudskipper'], desert:['the Camel','Dune Runner','the Mirage'],
  nighthunt:['Night Owl','the Lantern','Moonrunner'], mountain:['the Summit','Ice Axe','the Ibex'], capture:['the Snare','the Trapper','Beast-Catcher'],
  cooking:['the Chef','Golden Spoon','the Palate'], egg:['the Spider','Eggshell','Long Drop'], auction:['the Gavel','Deep Pockets','the Broker'],
  beast:['the Tamer','Beastfriend','the Whistle'], treasure:['the Magpie','Goldfinder','the Dowser'], tower:['the Locksmith','Trapdoor','the Escape'],
  prisoner:['the Warden','Cellbreaker','the Turnkey'], maze:['Thread','the Minotaur','Dead-End'], guardians:['Gatebreaker','the Sentinel','Iron Gate'],
  centennial:['the Centurion','Hundred-Steps','the Heirloom'], raft:['the Oar','Riverborn','White Water'], bandits:['Tollbreaker','the Highwayman','the Bandit King'], zevil:['the Islander','Badge-Eater','the Castaway']
};
/* ===== Themed trials: in some years, the theme brings a trial of its own ===== */
const THEME_TRIAL = {storm:'ridge', blood:'pit', jubilee:'banquet', rookie:'blankmap', oldguard:'hall', silence:'mute', friendship:'pairs', shadows:'mirror', wild:'feeding', whim:'dice'};
Object.assign(PHASE_DEFS, {
  ridge:{name:'Lightning Ridge', stage:1, themed:'storm', w:{endurance:.35,courage:.35,agility:.3}, T:41, fatigue:25, obstacle:true, rescue:'dragged {v} off the ridge before the next strike',
   fail:{endurance:'could not keep climbing through the hail and turned back', courage:'froze when the lightning hit the ridge ahead', agility:'slipped on the wet rock and slid back to the start'}},
  pit:{name:'Mud Pit', stage:1, themed:'blood', w:{combat:.4,determination:.3,endurance:.3}, T:42, fatigue:25, rescue:'pulled {v} out of the pit by the collar', pit:true,
   fail:{combat:'was thrown out of the pit and not allowed back in', determination:'climbed out of the pit before the bell', endurance:'collapsed in the mud on the second night'}},
  banquet:{name:'Golden Banquet', stage:1, themed:'jubilee', w:{charisma:.4,perception:.35,strategy:.25}, T:35, rest:true, rescue:'covered for {v} at the high table',
   fail:{charisma:'insulted the wrong guest at the high table', perception:'ate the one dish that was a test', strategy:'told the examiner\'s spy everything over dessert'}},
  blankmap:{name:'Blank Map Trek', stage:1, themed:'rookie', w:{perception:.35,intelligence:.35,determination:.3}, T:40, fatigue:15, rookie:true, rescue:'went back for {v} at the last fork',
   fail:{perception:'walked in circles for two days on a route nobody had ever used', intelligence:'trusted an old map that did not match the land', determination:'gave up when the path ran out'}},
  hall:{name:'Hall of Old Exams', stage:1, themed:'oldguard', w:{strategy:.35,intelligence:.35,determination:.3}, T:41, fatigue:10, rest:true, vets:true, rescue:'talked {v} through a trial they had seen before',
   fail:{strategy:'repeated a mistake from an exam thirty years old', intelligence:'could not read the old rules carved on the walls', determination:'lost heart in the room of names'}},
  mute:{name:'Mute Crossing', stage:1, themed:'silence', w:{perception:.4,strategy:.35,courage:.25}, T:41, fatigue:15, mute:true, rescue:'pulled {v} back by the sleeve without a word',
   fail:{perception:'missed the hand signal and walked into the trap', strategy:'spoke, and was sent back', courage:'panicked in the silence and shouted'}},
  pairs:{name:'Bound Pairs', stage:1, themed:'friendship', w:{teamwork:.45,endurance:.3,charisma:.25}, T:40, fatigue:20, pairs:true, rescue:'carried {v} across the line',
   fail:{teamwork:'fought with the partner tied to {them} until the rope snapped', endurance:'could not keep the pace for two', charisma:'could not get a stranger to trust {them} on the rope'}},
  mirror:{name:'Mirror Hall', stage:1, themed:'shadows', w:{perception:.45,intelligence:.35,courage:.2}, T:41, rest:true, rescue:'found {v} in the right reflection',
   fail:{perception:'followed the wrong reflection out of the hall', intelligence:'could not tell the impostor from the examiner', courage:'broke a mirror in a panic and was disqualified from the hall'}},
  feeding:{name:'Feeding Grounds', stage:1, themed:'wild', w:{agility:.35,courage:.35,perception:.3}, T:42, fatigue:20, obstacle:true, rescue:'pulled {v} out from under a beast',
   fail:{agility:'was run down by a grazing herd', courage:'climbed a tree and would not come down', perception:'walked between a mother and her young'}},
  dice:{name:'Game of Dice', stage:1, themed:'whim', w:{charisma:.35,strategy:.35,courage:.3}, T:40, luck:2.4, rescue:'gave {v} a second throw',
   fail:{charisma:'lost the Chairman\'s patience along with the game', strategy:'played the odds, and the odds lost', courage:'refused to roll the last die'}}
});
['ridge','feeding','pit'].forEach(id => PHYSICAL.add(id));
['ridge','pit','banquet','blankmap','hall','mute','pairs','mirror','feeding','dice'].forEach(id => { const d = PHASE_DEFS[id]; d.id = id; d.group = STAGE_NAME[d.stage]; d.xpKey = d.xp || id; });
Object.assign(FALL_SC, {
  ridge: {endurance: ['{F} climbed until the hail turned to ice, then could not climb any more.'], courage: ['Lightning hit the rock ten metres ahead. {F} did not take another step.'], agility: ['{F} slid all the way back to the start on the wet stone, and the examiner waved {them} off.']},
  pit: {combat: ['{F} was thrown out of the pit on the first night, and the gate closed behind {them}.'], determination: ['{F} climbed out of the pit before the bell. The crowd above jeered.'], endurance: ['{F} lay down in the mud on the second night and did not get up.']},
  banquet: {charisma: ['{F} told a joke about the wrong family at the high table.'], perception: ['{F} ate the only dish on the table that was a test.'], strategy: ['{F} told the guest beside {them} everything. The guest was the examiner.']},
  blankmap: {perception: ['{F} walked the same valley three times without noticing.'], intelligence: ['{F} trusted the old map. The land had changed.'], determination: ['The path ran out, and so did {F}.']},
  hall: {strategy: ['{F} made the exact mistake an applicant made in the same room forty years ago.'], intelligence: ['{F} could not read the old rules carved in the wall.'], determination: ['{F} stopped in the room of names and could not go on.']},
  mute: {perception: ['{F} missed the signal, and the floor gave way.'], strategy: ['{F} said one word. The examiner pointed at the exit.'], courage: ['In the silence, {F} shouted. That was the end of it.']},
  pairs: {teamwork: ['{F} and {their} partner pulled in opposite directions until the rope snapped.'], endurance: ['{F} could not carry {their} half of the pair any further.'], charisma: ['{F} never got the stranger on the other end of the rope to trust {them}.']},
  mirror: {perception: ['{F} followed a reflection out of the hall. It was not {their} own.'], intelligence: ['{F} saluted the impostor and turned {their} back on the examiner.'], courage: ['{F} broke a mirror in a panic. The hall does not forgive that.']},
  feeding: {agility: ['{F} could not get out of the way of the herd.'], courage: ['{F} climbed the tallest tree in the grounds and refused to come down.'], perception: ['{F} walked between a mother and her young.']},
  dice: {charisma: ['{F} lost the Chairman\'s attention, which is worse than losing the game.'], strategy: ['{F} played the odds perfectly. The dice did not care.'], courage: ['{F} would not roll the last die.']}
});
Object.assign(ACE_NICK, {ridge:['Lightning Rod','Stormcrow','the Ridge'], pit:['Pit Dog','the Last Standing','Mudlark'], banquet:['the Toast','Silver Fork','Host'], blankmap:['Pathfinder','the Blank','Fresh Ink'], hall:['the Archivist','Old Rules','the Echo'], mute:['the Mute','Hush','Sign'], pairs:['Knot','Two-Hands','the Pair'], mirror:['Reflection','the Real One','Glass Eye'], feeding:['Herdwalker','Tusk','the Grazer'], dice:['Snake Eyes','Lucky Seven','the House']});
Object.assign(SP, {
  ridge:[
    {a:['courage',1], ma:5, dr:4, t:o => `Lightning strikes the ridge. ${o.a.name} keeps climbing toward it.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `Hail the size of eggs. ${o.a.name} takes one to the temple.`},
    {g:null, gs:[3,6], mg:-3, fat:8, dr:3, t:o => `The wind pins ${o.g} flat against the rock for an hour.`},
    {a:['strategy',1], b:null, mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} tells ${o.b.name} to drop ${PR(o.b).their} metal canteen. A second later, lightning hits where it would have been.`},
    {a:null, dr:2, t:o => `${o.a.name} watches the lightning from the ridge for a minute too long. It is beautiful, and it is going to kill someone.`},
    {a:['agility',1], ma:4, dr:3, t:o => `${o.a.name} runs the last stretch between two strikes, counting the seconds.`}
  ],
  pit:[
    {a:['combat',1], ma:5, dr:4, t:o => `${o.a.name} stands in the middle of the pit all night. Nobody comes close.`},
    {a:null, b:null, ma:3, mb:-4, gr:'b>a', dr:5, t:o => `${o.a.name} throws ${o.b.name} into the mud and takes ${PR(o.b).their} corner.`},
    {a:['determination',1], ma:4, dr:3, t:o => `${o.a.name} is knocked down eleven times. ${PR(o.a).They} get${PR(o.a).s} up eleven times.`},
    {a:null, b:null, ma:2, mb:2, bond:true, dr:5, t:o => `${o.a.name} and ${o.b.name} stand back to back for a whole night in the pit, and never ask each other's names.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `Someone in the pit fights with a hidden blade. ${o.a.name} finds out the hard way.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The examiners throw more people into the pit. ${o.g} end up under the pile.`}
  ],
  banquet:[
    {a:['charisma',1], ma:5, dr:3, t:o => `${o.a.name} gives a toast that makes the whole high table laugh, including the examiner.`},
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} notices which guests never eat, and avoids every dish they avoid.`},
    {a:null, dr:2, t:o => `${o.a.name} dances with a duchess. Nobody knows if it counts.`},
    {a:['charisma',0], ma:-4, dr:3, t:o => `${o.a.name} uses the wrong fork. Then the wrong knife. Then the wrong name.`},
    {a:['strategy',1], b:null, ma:3, mb:-4, gr:'b>a', dr:4, t:o => `${o.a.name} seats ${o.b.name} next to the most boring guest at the banquet. It works.`},
    {g:['charisma',1], gs:[3,5], mg:2, ally:'g', dr:4, t:o => `Over dessert, ${o.g} agree to look after each other for the rest of the exam.`}
  ],
  blankmap:[
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} draws the map as ${PR(o.a).they} walk${PR(o.a).s}. By the end, the examiners want a copy.`},
    {a:null, who:'vet', ma:-4, dr:4, t:o => `${o.a.name} looks for a shortcut ${PR(o.a).they} used years ago. It is a lake now.`},
    {a:null, who:'new', ma:4, dr:3, t:o => `First-timer ${o.a.name} has no habits to unlearn, and walks straight through.`},
    {a:null, dr:2, t:o => `${o.a.name} names a nameless hill after ${PR(o.a).their} mother. It might stick.`},
    {a:['intelligence',0], ma:-4, dr:3, t:o => `${o.a.name} follows the sun and ends up going the wrong way for a day.`},
    {g:null, gs:[3,5], mg:2, ally:'g', dr:4, t:o => `Lost together, ${o.g} decide to stay lost together.`}
  ],
  hall:[
    {a:null, who:'vet', ma:5, dr:4, t:o => `${o.a.name} has seen this room before, in an exam years ago, and walks straight to the right door.`},
    {a:['intelligence',1], ma:4, dr:3, t:o => `${o.a.name} reads the old rules carved on the wall and finds a loophole nobody has used in decades.`},
    {a:null, dr:2, t:o => `${o.a.name} finds ${PR(o.a).their} own name scratched on a wall, from an exam ${PR(o.a).they} do${PR(o.a).es} not remember taking.`},
    {a:null, who:'new', ma:-4, dr:3, t:o => `${o.a.name} has never seen any of these trials. Everyone around ${PR(o.a).them} has.`},
    {a:null, b:null, who:'vet', ma:-3, mb:-3, gr:'mut', dr:5, t:o => `${o.a.name} and ${o.b.name} argue about how this room was solved twenty years ago. Both are wrong.`},
    {a:['determination',1], ma:3, dr:3, t:o => `In the room of names, ${o.a.name} reads every name aloud, then walks on.`}
  ],
  mute:[
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} learns the examiners' hand signals in the first hour and never misses one.`},
    {a:['charisma',0], ma:-4, dr:3, t:o => `${o.a.name} sneezes. Everyone looks. The examiner writes something down.`},
    {a:null, dr:2, t:o => `${o.a.name} and a stranger have a whole argument in silence, using only eyebrows.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} writes warnings in the dust for the people behind ${PR(o.a).them}.`},
    {a:null, b:null, mb:3, debt:'b>a', dr:4, t:o => `${o.a.name} stops ${o.b.name} from stepping on a creaking board with one hand on ${PR(o.b).their} shoulder.`},
    {g:['courage',0], gs:[3,5], mg:-3, dr:3, t:o => `A loud bang somewhere in the dark. ${o.g} flinch, and two of them gasp.`}
  ],
  pairs:[
    {a:['teamwork',1], b:null, ma:3, mb:3, bond:true, dr:5, t:o => `${o.a.name} and ${o.b.name}, tied together by the examiner, are finishing each other's sentences by noon.`},
    {a:null, b:null, ma:-3, mb:-3, gr:'mut', dr:5, t:o => `${o.a.name} and ${o.b.name} are tied together. Within an hour, they have stopped speaking.`},
    {a:['strength',1], b:['endurance',0], mb:4, debt:'b>a', dr:5, t:o => `${o.b.name}'s legs give out. ${o.a.name} carries both ends of the rope.`},
    {a:null, dr:2, t:o => `${o.a.name} unties a knot in the rope, then ties it again, more neatly.`},
    {g:null, gs:[4,6], mg:-3, dr:3, t:o => `Two pairs get tangled at the river. ${o.g} spend an hour untangling.`},
    {a:['charisma',1], b:null, mb:3, dr:3, t:o => `${o.a.name} keeps ${o.b.name} laughing the whole way. It helps more than either expected.`}
  ],
  mirror:[
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} notices one reflection blinks a moment late, and follows the other one.`},
    {a:['courage',0], ma:-4, dr:3, t:o => `${o.a.name} sees ${PR(o.a).their} own reflection smile when ${PR(o.a).they} did not.`},
    {a:null, dr:2, t:o => `${o.a.name} fixes ${PR(o.a).their} hair in every mirror on the way through.`},
    {secret:true, dr:7, t:() => ''},
    {a:['intelligence',1], b:null, mb:3, debt:'b>a', dr:4, t:o => `${o.a.name} tells ${o.b.name} which of the two examiners is real. ${o.b.first} was about to salute the other one.`},
    {g:['perception',0], gs:[3,5], mg:-3, dr:3, t:o => `${o.g} follow a reflection into a corridor that does not exist.`}
  ],
  feeding:[
    {a:['agility',1], ma:5, dr:3, t:o => `${o.a.name} runs across the backs of a grazing herd to reach the far side.`},
    {a:['courage',1], ma:4, dr:4, t:o => `A beast lowers its horns at ${o.a.name}. ${o.a.first} lowers ${PR(o.a).their} head back. The beast leaves.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `Something in the long grass bites ${o.a.name} and does not let go for a while.`},
    {a:null, dr:2, t:o => `A small beast decides ${o.a.name} is its mother. It follows ${PR(o.a).them} out of the grounds.`},
    {a:['perception',1], b:null, mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} drags ${o.b.name} flat into the grass just before a herd thunders over the spot.`},
    {g:null, gs:[3,6], mg:-4, dr:4, t:o => `Feeding time. ${o.g} find out what the grounds are named after.`}
  ],
  dice:[
    {a:null, ma:6, dr:4, t:o => `${o.a.name} rolls three sixes in a row. The Chairman raises an eyebrow.`},
    {a:null, ma:-5, dr:4, t:o => `${o.a.name} rolls snake eyes twice. The Chairman laughs for a long time.`},
    {a:['charisma',1], ma:4, dr:3, t:o => `${o.a.name} talks the Chairman into one more throw.`},
    {a:null, dr:2, t:o => `${o.a.name} blows on the dice for luck. The Chairman does the same, mocking ${PR(o.a).them}.`},
    {a:['strategy',1], b:null, ma:3, mb:-3, gr:'b>a', dr:4, t:o => `${o.a.name} bets on ${o.b.name} losing. ${o.b.first} loses.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The Chairman changes the rules mid-game. ${o.g} were winning under the old ones.`}
  ]
});

// personal names: from who they are (home, work, why they came, a habit, a gift, a fear) or just a silly, fond play on their name
const QUIRK_NICK = [[/goggles/,'Goggles'],[/folding chair/,'the Chair'],[/lizard/,'Lizard'],[/boiled eggs/,'Egghead'],[/notebook/,'Notes'],[/different hat/,'Hats'],[/counts everything/,'the Abacus'],[/lucky coin/,'Heads-or-Tails'],[/maps$/,'the Atlas'],[/white gloves/,'Gloves'],[/shaped like a key/,'Keyhole'],[/stray cat/,'Catkeeper'],[/sunglasses/,'Shades'],[/juggles/,'the Juggler'],[/walks barefoot/,'Barefoot'],[/cold tea/,'Iced Tea'],[/every star/,'Stargazer'],[/three sizes/,'the Coat'],[/smoke/,'Smokey'],[/across a valley/,'Thunderclap'],[/riddles/,'the Riddler'],[/salutes/,'Sarge'],[/apologises/,'Sorry'],[/whistles when/,'Whistler'],[/sings in/,'Lullaby'],[/only in questions/,'Question Mark'],[/snores/,'the Bear'],[/salt in every/,'Salty'],[/scarf/,'Scarf'],[/bandages/,'Patches'],[/tastes everything/,'Rock-Eater'],[/beetle/,'Beetle'],[/push-ups/,'Push-Up'],[/sleeps standing/,'the Horse'],[/sketches/,'Sketch'],[/tally of near-death/,'Tally'],[/always eating/,'Snack'],[/pet beetle/,'Beetle'],[/one by one/,'Knuckles'],[/hoards matches/,'Matchstick'],[/never says/,'No-Name'],[/terrible riddles/,'the Riddler'],[/buttons/,'Buttons'],[/same three notes/,'Three Notes']];
const TALENT_NICK = [[/breath/,'Lungs'],[/never gets lost/,'Compass'],[/footsteps/,'Big Ears'],[/climb almost/,'Spider'],[/any animal/,'Beastwhisperer'],[/cook anything/,'Chef'],[/reads people/,'the Reader'],[/run all day/,'the Engine'],[/spots traps/,'Trapfinder'],[/never panics/,'Ice Veins'],[/darkness/,'Owl'],[/balance of a cat/,'Catfoot'],[/twice/,'the Ox'],[/without food/,'Camel'],[/remembers everything/,'the Archive'],[/talk anyone/,'Silver Tongue'],[/swims/,'Fish'],[/loophole/,'the Lawyer'],[/any map/,'the Cartographer'],[/sleep anywhere/,'Dozer'],[/hits harder/,'Sledge'],[/mimic/,'Parrot'],[/track anything/,'Bloodhound'],[/teammate/,'the Shepherd'],[/poisonous/,'Herbalist'],[/without making a sound/,'Whisper'],[/grudge and a rope/,'Knots'],[/bad plan/,'the Mule'],[/bluff/,'Poker Face'],[/calms any crowd/,'the Calm'],[/learns any game/,'Quick Study'],[/storm coming/,'Weathervane'],[/how to fall/,'Rubber'],[/lift a cart/,'the Cart'],[/outnumbered/,'Mob-Breaker'],[/feast/,'Pantry'],[/forgets a face/,'Never-Forget'],[/keeps going/,'Long Haul'],[/bare hands/,'Gecko'],[/plain sight/,'Wallpaper'],[/guards/,'the Diplomat'],[/without blinking/,'No-Blink'],[/backwards/,'Backwards'],[/weak spot/,'the Needle']];
const ALLIT = ['Bubbly','Brave','Cheery','Cosy','Dandy','Dizzy','Fuzzy','Giggly','Happy','Jolly','Jumpy','Lucky','Merry','Nifty','Peppy','Plucky','Rosy','Sunny','Sparky','Snappy','Tiny','Wiggly','Zippy','Bouncy','Chipper','Gentle','Kind'];
const ORIGIN_NICK = [[/fishing village/,['Fishbone','Salty'],'for the fishing village {first} grew up in'],[/caravan/,['Sandy','Caravan'],'for growing up on the move with a caravan'],[/monastery/,['Monk','Mountain Bell'],'for the monastery {first} came down from'],[/forest hamlet/,['Woodsy','Pinecone'],'for the forest hamlet three days from any road'],[/slums/,['Alley Cat','Street Mouse'],'for the slums {first} grew up in'],[/noble house/,['Your Highness','Silver Spoon'],'for the very long family name'],[/circus/,['Circus','Somersault'],'for the travelling circus {first} grew up in'],[/orphanage/,['Patchwork','Spare Change'],'for the orphanage that raised {them}'],[/frontier/,['Frontier','Sheriff'],'for the frontier town {first} comes from'],[/swamp/,['Froggy','Bog'],'for the swamp island {first} calls home'],[/ranch/,['Cowpoke','Lasso'],'for the ranch full of difficult animals'],[/restaurant/,['Crumbs','Dumpling'],'for growing up above a restaurant'],[/mining/,['Lamp','Pebble'],'for the mining town under the ground'],[/library/,['Bookmark','Dog-Ear'],'for the library {first} grew up in'],[/lighthouse/,['Lamplight','Foghorn'],'for the lighthouse rock {first} grew up on']];
const JOB_NICK = [[/bodyguard/,['the Bodyguard','Shoulders']],[/diner/,['Short Order','Pancake']],[/pick/,['Fingers','Sticky']],[/cargo ship/,['Deckhand','Bosun']],[/university/,['the Scholar','Footnote']],[/army/,['Corporal','Sarge']],[/street corners/,['Busker','Encore']],[/mail/,['Postie','Stamp']]];
const MOTIVE_NICK = [[/avenge|revenge|settle a score/,['Payback','the Grudge']],[/debt|never be poor/,['Pocket Money','Coins']],[/fund|earn enough/,['Piggy Bank','Bricks']],[/bored/,['Yawn','Sleepy']],[/on a bet/,['Double-or-Nothing','the Bet']],[/fortune teller/,['Destiny','Crystal Ball']],[/illness|cure/,['Medicine','the Remedy']],[/fame/,['Autograph','Spotlight']],[/treasure|heirloom|sword/,['Treasure Map','X-Marks']],[/beast/,['Beastkeeper','the Ark']],[/strict family|famous Hunter parent|older sibling/,['Prove-It','Told-You-So']],[/archive|ruins/,['Dust','Keyhole']],[/impress someone/,['Lovesick','Daydream']],[/fortune|stranger gave/,['Lucky Penny','Windfall']]];
const FEAR_NICK = {'heights':['Vertigo','Ground Floor'],'deep water':['Dry Feet','Paddles'],'the dark':['Nightlight','Candle'],'closed spaces':['Open Door','Elbow Room'],'large animals':['Mouse','Shoo'],'fire':['Wet Match','Ember-Shy']};
const VOW = /[aeiouy]/i;
const cv = s => { s = s.replace(/[^A-Za-z]/g, ''); return s.length > 1 && !VOW.test(s[0]) && VOW.test(s[1]) ? s.slice(0, 2) : null; };
// Joseph Joestar → Jojo, Kira → Kiki, Agnieszka → Aggie, Bartholomew → Barty
function nameNick(c){
  const f = c.first, last = (c.name.split(' ').slice(1).join(' ') || ''), out = [], a = cv(f), b = cv(last), lo = s => s.toLowerCase();
  if(a && b && a !== b) out.push([`${a}${lo(b)}`, f.length + last.length >= 12 ? `because ${f} ${last} is a mouthful` : `since the first morning, for no better reason`]);
  if(a && b && a === b) out.push([`${a}${lo(a)}`, `because ${f} ${last} was always going to be ${a}${lo(a)}`]);
  if(a && f.length >= 4) out.push([`${a}${lo(a)}`, `because nobody calls ${PR(c).them} ${f} for long`]);
  if(last && f[0] === last[0]) out.push([`${f[0]}${f[0]}`, `for the double ${f[0]}`]);
  else if(last && f.length + last.length >= 14) out.push([`${f[0]}${last[0]}`, `because ${f} ${last} takes too long to shout`]);
  const i = f.search(VOW); let j = i + 1; while(j < f.length && VOW.test(f[j])) j++;
  if(f.length >= 6 && j < f.length && i <= 2 && j <= 2){ const st = f.slice(0, j + 1), k = st[st.length - 1];
    if(!/[hjqwxyc]/.test(k)) out.push([st.length === 2 ? `${st}${k}ie` : /[ktp]/.test(k) ? `${st}y` : `${st}${k}y`, `because nobody can say ${f} fast enough`]); }
  const al = ALLIT.filter(x => x[0] === f[0]); if(al.length) out.push([`${al[nhash(c.id + ':al') % al.length]} ${f}`, `because it just sounded right`]);
  if(c.age <= 15) out.push([`Little ${f}`, `for being the smallest one in the line`]);
  else if(c.a.strength >= 85) out.push([`Big ${f}`, `for the size of ${PR(c).them}`]);
  return out;
}
function storyNick(S, c){
  const b = background(c), P = PR(c), out = [], put = (arr, why, k) => out.push([arr[nhash(c.id + ':sn:' + k) % arr.length], why]);
  const fill = s => s.replace(/\{first\}/g, c.first).replace(/\{them\}/g, P.them);
  const o = ORIGIN_NICK.find(([re]) => re.test(BG.origin[b.origin][0])); if(o) put(o[1], fill(o[2]), 'o');
  const j = JOB_NICK.find(([re]) => re.test(BG.job[b.job])); if(j) put(j[1], `because ${c.first} ${BG.job[b.job]} before the exam`, 'j');
  const mo = MOTIVES[c.motive], m = mo && MOTIVE_NICK.find(([re]) => re.test(mo.m)); if(m) put(m[1], pro(`for coming ${mo.m}`, c), 'm');
  if(b.fear !== null && FEAR_NICK[BG.fear[b.fear][0]]) put(FEAR_NICK[BG.fear[b.fear][0]], `for being afraid of ${BG.fear[b.fear][0]} and coming anyway`, 'f');
  if(c.injury) put(['Stitches', 'Patches', 'Hopalong'], `for carrying on with a ${c.injury.w}`, 'i');
  if(c.hParentName && (c.hName || (c.secret && c.secret.revealed))){ const sn = c.hParentName.split(' ').slice(-1)[0]; put([`Little ${sn}`, `${sn} Junior`], `for being ${c.hParentName}'s child`, 'h'); }
  const kin = c.fam ? S.candidates.find(x => x.id !== c.id && x.fam === c.fam && x.age > c.age + 3) : null;
  if(kin) put([`Little ${kin.first}`, `${kin.first}'s Shadow`], `for sticking to ${P.their} ${relWord(c, kin)} ${kin.first}`, 'k');
  const q = QUIRK_NICK.find(([re]) => re.test(QUIRKS[c.quirk] || '')); if(q) out.push([q[1], `because ${c.first} ${pro(QUIRKS[c.quirk], c)}`]);
  const t = TALENT_NICK.find(([re]) => re.test(BG.talent[b.talent][0])); if(t) out.push([t[1], `because ${c.first} ${pro(BG.talent[b.talent][0], c)}`]);
  if(c.age >= 60) out.push([c.age >= 78 ? 'Old Iron' : c.gender === 'Male' ? 'Grandpa' : c.gender === 'Female' ? 'Granny' : 'Old Timer', `for still being here at ${c.age}`]);
  return out;
}
const personalNick = (S, c) => {
  const h = k => nhash(c.id + ':pn:' + k + S.edition), used = new Set(S.candidates.map(o => o.nick).filter(Boolean).concat(S.lastNicks || []));
  const pickFrom = L => { L = L.filter(x => !used.has(x[0])); return L.length ? L[h('p') % L.length] : null; };
  const st = storyNick(S, c), nm = nameNick(c);
  return h('g') % 2 ? pickFrom(nm) || pickFrom(st) : pickFrom(st) || pickFrom(nm);
};
// returners: a name earned across exams
const NUMW = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen'];
function returnerNick(S, c){
  const A = c.attempts || [], n = A.length, prev = A[n - 2] || {}, prev2 = A[n - 3] || {}, h = k => nhash(c.id + ':rn:' + k + S.edition), pk = (arr, k) => arr[h(k) % arr.length];
  if(c.dqKill && c.dqKill.ed === S.edition - 1) return [pk(['the Exile', 'the Unforgiven', 'Bloodstain'], 'x'), 'for coming back after being thrown out for killing'];
  if(/last match/.test(prev.reason || '')) return [pk(['Next Year', 'the Almost', 'One More Step'], 'l'), 'for losing the very last match last year'];
  if(n >= 5) return [pk([`${NUMW[Math.min(n, 15)]} Tries`, 'Old Faithful', 'the Regular'], 'n'), `for ${n} attempts and counting`];
  if(prev.phaseName && prev.phaseName === prev2.phaseName && !/Final/.test(prev.phaseName)) { const w = prev.phaseName.split(' ').pop(); return [pk([`the ${w}'s Favourite`, `Twice Bitten`, `${w} Bait`], 's'), `for falling in the ${prev.phaseName} two years running`]; }
  const lost = (c.bonds || []).find(x => !S.candidates.some(o => o.id === x.id));
  if(lost && h('b') % 3 === 0){ const lf = lost.name.split(' ')[0]; return [pk(['Half-Heart', 'the Left-Behind', 'Lonely Road', 'Echo', 'Empty Seat', 'Odd Sock'], 'b'), `for coming back without ${lost.name}`]; }
  const rival = n >= 3 ? (c.grudges || []).map(g => S.candidates.find(o => o.id === g.id)).find(o => o && (o.attempts || []).length > 2) : null;
  if(rival) return [`${rival.first}'s Shadow`, `for following ${rival.name} from exam to exam`];
  if(prev.stage !== undefined && prev.stage < 2 && n >= 2 && h('c') % 2) return [pk(['the Comeback', 'Second Wind', 'Round Two'], 'c'), 'for coming back after an early exit'];
  return null;
}
// who coins the name: the crowd, an examiner, a rival, the family, or an ally
function nickSource(S, c, p){
  const m = cmap(S), r = nhash(c.id + ':src:' + p) % 100, ex = PHASES[p] && PHASES[p].ex;
  const fam = c.fam ? S.candidates.find(o => o.id !== c.id && o.fam === c.fam && o.status === 'Active') : null;
  const riv = (c.grudges || []).map(g => m[g.id]).find(o => o && o.status === 'Active') || S.candidates.find(o => o.status === 'Active' && (o.grudges || []).some(g => g.id === c.id));
  const ally = c.alliance && !c.fam ? alliesOf(S, c).find(o => o.status === 'Active') : null;
  if(fam && r < 30) return {k: 'family', o: fam};
  if(riv && r < 50) return {k: 'rival', o: riv};
  if(ally && r < 70) return {k: 'ally', o: ally};
  if(ex && r < 85) return {k: 'examiner', ex: ex.name};
  return {k: 'crowd'};
}
const NICK_SRC = {
  crowd: [o => `From here on, people call ${o.c.name} "${o.n}".`, o => `A nickname sticks: ${o.c.name} is now "${o.n}".`, o => `Candidates start calling ${o.c.name} "${o.n}" — ${o.why}.`, o => `"${o.n}" — that is what the others whisper when ${o.c.first} walks by.`],
  examiner: [o => `${o.ex} calls ${o.c.name} "${o.n}" in front of everyone. The name sticks.`, o => `The examiners have a name for ${o.c.name} now: "${o.n}" — ${o.why}.`],
  rival: [o => `${o.o.name} mockingly calls ${o.c.first} "${o.n}". Meant as an insult, it sticks anyway.`, o => `"${o.n}," ${o.o.first} sneers at ${o.c.name}. By evening, everyone is using it.`],
  family: [o => `${o.o.first} has always called ${PR(o.o).their} ${relWord(o.o, o.c)} "${o.n}". Now the whole exam does.`, o => `${o.c.name}'s ${relWord(o.c, o.o)} lets the family nickname slip: "${o.n}". It spreads fast.`],
  ally: [o => `${o.o.first} starts calling ${o.c.name} "${o.n}", and the rest of the alliance follows.`, o => `${o.c.name}'s allies have a name for ${PR(o.c).them}: "${o.n}" — ${o.why}.`]
};
function giveNick(S, c, kind, why, p, chance, given){
  if(!c || c.nick || (chance !== undefined && nhash(c.id + kind + S.seed) % 100 >= chance * 100)) return;
  if(given && S.candidates.some(o => o.nick === given)) return;   // one of each name per exam
  let n = given || vpick(S, NICK[kind], c.id + kind);
  if(kind === 'ace') n = vpick(S, ACE_NICK[PHASES[p].id] || NICK.ace.map(x => 'the ' + x), c.id + 'ace');
  c.nick = n; c.nickWhy = why; c.nickEd = S.edition; c.nickKind = kind;
  c.notes.push({p, text:`Earned the nickname "${n}" — ${why}`});
  const src = kind === 'return' ? (PHASES[p] && PHASES[p].ex && nhash(c.id) % 2 ? {k: 'examiner', ex: PHASES[p].ex.name} : {k: 'crowd'}) : nickSource(S, c, p);
  log(S, p, 'story', vpick(S, NICK_SRC[src.k], c.id + 'nick')({c, n, why, o: src.o, ex: src.ex}), [c.id].concat(src.o ? [src.o.id] : []), true);
}
// on licensing day, about a third of the new Hunters without a name get one: from home, from the file, or from the other new Hunters
const LIC_NICK = [o => `${o.c.first}'s people back home always called ${o.P.them} "${o.n}" — ${o.why}. The Association writes it down too.`,
  o => `On licensing day an examiner reads "${o.n}" off ${o.c.name}'s file — ${o.why}. It sticks.`,
  o => `By the end of the night the other new Hunters are calling ${o.c.name} "${o.n}" — ${o.why}.`];
function licenseNicks(S, p){
  S.candidates.filter(c => c.status === 'Approved' && !c.nick && nhash(c.id + ':licnick') % 100 < 35).forEach(c => {
    const pn = personalNick(S, c); if(!pn) return;
    c.nick = pn[0]; c.nickWhy = pn[1]; c.nickEd = S.edition; c.nickKind = 'license';
    c.notes.push({p, text:`Earned the nickname "${pn[0]}" — ${pn[1]}`});
    log(S, p, 'story', vpick(S, LIC_NICK, c.id + 'ln')({c, n: pn[0], why: pn[1], P: PR(c)}), [c.id], true);
  });
}
// a few candidates per phase get a name from who they are rather than what they did
function personalNicks(S, ph, p, rng, active){
  if(ph.final || rng() > 0.55) return;
  const pool = active.filter(c => !c.nick); if(!pool.length) return;
  const strong = pool.slice().sort((x, y) => total(y) - total(x)).slice(0, Math.max(3, Math.ceil(pool.length * 0.2))), src = rng() < 0.65 ? strong : pool;   // names stick to the ones people watch
  const c = src[Math.floor(rng() * src.length)], pn = personalNick(S, c);
  if(pn) giveNick(S, c, 'personal', pn[1], p, undefined, pn[0]);
}
const T_LEAD = [
  o => `${o.c.name} finishes the ${o.ph} at the front of the pack.`,
  o => `Nobody keeps up with ${o.c.name} in the ${o.ph}.`,
  o => `${o.c.name} makes the ${o.ph} look easy.`,
  o => `The examiners mark one name after the ${o.ph}: ${o.c.name}.`,
  o => `${o.c.name} crosses the ${o.ph} first, barely out of breath.`,
  o => `First through the ${o.ph}: ${o.c.name}, ${o.c.trait === 'Stoic' ? 'without a word' : 'grinning'}.`
];
const T_SURPRISE = [
  o => `Surprise exit: ${o.c.name}, one of the more capable applicants, ${o.why}.`,
  o => `Few saw it coming: ${o.c.name} ${o.why}.`,
  o => `The favourites are not safe — ${o.c.name} ${o.why}.`,
  o => `Gasps from the crowd as ${o.c.name}, a clear contender, ${o.why}.`,
  o => `${o.c.name} had the talent to go far, but ${o.why}.`
];
const T_HELP = [
  o => `${o.h.name} helps ${o.rel} ${o.c.name} get through the ${o.ph}${o.tag}.`,
  o => `${o.h.name} slows down so ${o.rel} ${o.c.name} can keep up in the ${o.ph}${o.tag}.`,
  o => `With ${o.h.name} beside ${PR(o.c).them}, ${o.c.name} survives the ${o.ph}${o.tag}.`,
  o => `${o.c.name} would have fallen in the ${o.ph} — ${o.relH} ${o.h.name} would not allow it${o.tag}.`,
  o => `${o.h.name} talks ${o.rel} ${o.c.name} through the worst of the ${o.ph}${o.tag}.`,
  o => `Shoulder to shoulder, ${o.h.name} and ${o.c.name} make it through the ${o.ph}${o.tag}.`,
  o => `${o.h.name} carries ${o.rel} ${o.c.name}'s pack for the last stretch of the ${o.ph}${o.tag}.`,
  o => `${o.c.name} is ready to quit the ${o.ph}. ${o.h.first} simply says no${o.tag}.`,
  o => `${o.h.name} and ${o.c.name} take turns leading through the ${o.ph}. Neither falls behind${o.tag}.`,
  o => `${o.h.name} shares the last of ${PR(o.h).their} water with ${o.rel} ${o.c.name} in the ${o.ph}${o.tag}.`,
  o => `In the ${o.ph}, ${o.h.first} keeps one eye on the route and one on ${o.c.first}${o.tag}.`,
  o => `${o.c.name} limps through the ${o.ph} on ${o.h.name}'s shoulder${o.tag}.`
];
const T_ARESCUE = [
  o => `${o.r.name} refuses to leave ${o.rel} ${o.c.name} behind and pulls ${PR(o.c).them} through the ${o.ph}${o.tag}.`,
  o => `${o.r.name} turns back for ${o.rel} ${o.c.name} in the ${o.ph}, and both make it${o.tag}.`,
  o => `${o.c.name} is about to drop out of the ${o.ph} when ${o.relH} ${o.r.name} hauls ${PR(o.c).them} back up${o.tag}.`,
  o => `${o.r.name} gives up a safe lead in the ${o.ph} to carry ${o.rel} ${o.c.name}${o.tag}.`,
  o => `"Not without you." ${o.r.name} drags ${o.rel} ${o.c.name} across the line in the ${o.ph}${o.tag}.`,
  o => `${o.c.name} goes down in the ${o.ph}. ${o.r.name} is back for ${PR(o.c).them} before anyone else even notices${o.tag}.`,
  o => `${o.r.name} hears ${o.c.first} fall behind in the ${o.ph} and turns around without a word${o.tag}.`,
  o => `Out of strength in the ${o.ph}, ${o.c.name} is half-carried to the finish by ${o.relH} ${o.r.name}${o.tag}.`,
  o => `${o.r.name} throws away ${PR(o.r).their} own lead in the ${o.ph} to go back for ${o.c.first}${o.tag}.`,
  o => `${o.c.name} would be out of the ${o.ph} if ${o.r.first} had kept running. ${o.r.first} did not${o.tag}.`
];
const T_RESCUE_CODA = ['', '', ' No one asked {them} to.', ' It costs {them} precious time.', ' The examiner pretends not to notice.', ' The two do not even know each other\'s names.', ' Neither says a word about it afterwards.'];
const T_ESCAPE = [
  o => `${o.p.name} spotted ${o.h.name} first and slipped away.`,
  o => `${o.p.name} heard ${o.h.first} coming and vanished into the undergrowth.`,
  o => `${o.h.name} closed in, but ${o.p.name} was already gone.`,
  o => `${o.p.name} doubled back through a stream and lost ${o.h.first}.`,
  o => `${o.p.name} left a false trail, and ${o.h.first} followed it for hours.`,
  o => `${o.h.name} found only a cold campfire where ${o.p.name} had been.`
];
const HOW_TRAP = ['ambushed','blindsided','outfoxed','waylaid','caught out','trapped'];
const HOW_FORCE = ['overpowered','ran down','outfought','flattened','cornered and beat','steamrolled'];
const HOW_COUNTER = ['fought off and robbed','turned the tables on','counter-ambushed','reversed the attack of','punished'];
const T_SCORE = [' — settling an old score', ' — and it was personal', ', paying back an old debt', ' — revenge, at last'];
const T_BETRAY = [
  o => `${o.h.name} betrays ally ${o.p.name}, who was holding ${o.h.first}'s target badge ${o.b}.`,
  o => `Friendship ends on day ${o.d}: ${o.h.name} turns on ally ${o.p.name} for badge ${o.b}.`,
  o => `${o.p.name} never saw it coming — ally ${o.h.name} strikes for target badge ${o.b}.`,
  o => `${o.h.name} smiles at ${o.p.name} over the campfire, then takes badge ${o.b} while ${PR(o.p).they} sleep${PR(o.p).s}.`,
  o => `The alliance is over: ${o.h.name} goes after ${o.p.name} for target badge ${o.b}.`
];
const T_BETRAY_KIN = [
  o => `${o.h.name} turns on ${kinOf(o.h, o.p)} ${o.p.name} for target badge ${o.b} — the ${o.f} is split.`,
  o => `Blood is not thicker than badges: ${o.h.name} betrays ${kinOf(o.h, o.p)} ${o.p.name} for ${o.b}. The ${o.f} will not forget.`,
  o => `${o.h.name} chooses the exam over family and takes ${o.b} from ${o.p.name}. The ${o.f} breaks apart.`,
  o => `A family dinner will never be the same: ${o.h.name} robs ${kinOf(o.h, o.p)} ${o.p.name} of badge ${o.b}.`
];
const T_HUNT_RIVAL = [
  o => `${o.h.name} spots ${o.o.name} — the one who ${o.why} — and changes course.`,
  o => `${o.h.name} has not forgotten: ${o.o.name} ${o.why}. The hunt is on.`,
  o => `Old wounds: ${o.h.name} goes looking for ${o.o.name}, who ${o.why}.`,
  o => `${o.h.name} ignores the target number and tracks ${o.o.name} instead.`
];
const T_LAST = [
  o => `${o.v.first}'s last words: "${o.w}"`,
  o => `Before the end, ${o.v.first} manages to say: "${o.w}"`,
  o => `${o.v.first} whispers "${o.w}" and goes still.`
];
// describe a bout by how it ended, so it is always clear who did what
function boutLine(w, l, how, k){
  const pick = arr => arr[(nhash(w.id + l.id + k) % arr.length)];
  if(how === 'knockout') return pick([`${w.name} knocks out ${l.name}`, `${w.name} drops ${l.name} with a final blow`, `${l.name} goes down and stays down against ${w.name}`]);
  if(/surrender$/.test(how)) return pick([`${l.name} raises a hand and surrenders to ${w.name}`, `${w.name} keeps pushing until ${l.name} gives up`, `${l.name} has had enough and concedes to ${w.name}`]);
  if(how === 'forfeit') return `${l.name} forfeits, and ${w.name} wins without a fight`;
  return pick([`${w.name} beats ${l.name} on the judges' decision`, `Neither falls, but the judges give it to ${w.name} over ${l.name}`]);
}
const T_FINAL_WIN = [
  o => `Round ${o.r}: ${boutLine(o.w, o.l, o.how, o.r)}. ${o.w.first} passes.`,
  o => `Round ${o.r}: ${boutLine(o.w, o.l, o.how, o.r)}. ${o.w.first} is a Hunter.`,
  o => `Round ${o.r}: ${boutLine(o.w, o.l, o.how, o.r)}, and the license goes to ${o.w.first}.`
];
// what an examiner says depends on the trial too: the kind of test, how crowded it is, and their own line of work
const EX_KIND_QUOTES = {
  fight: ['"I do not stop fights early. Plan accordingly."', '"Hit first, think later? We will see how that works out."', '"Bleed if you must. Do it quietly."'],
  wits: ['"The answer is in front of you. Most of you will walk past it."', '"Think. It is cheaper than running."', '"I wrote this one myself. I am rather proud of it."'],
  team: ['"You will hate your team by tonight. Finish anyway."', '"One fool can sink a whole group. Choose well."', '"I am not grading you. I am grading the team."'],
  body: ['"Your legs are the exam. Everything else is decoration."', '"Keep up or go home. Those are the options."', '"I will not slow down. I never do."'],
  danger: ['"Something out there wants to eat you. Do not let it."', '"Watch your feet, not my face."', '"Fear is useful. Panic is not."']
};
const exKind = ph => { const w = ph.w || {}; return (w.combat || 0) + (w.strength || 0) >= .3 ? 'fight' : (w.teamwork || 0) >= .3 ? 'team' : (w.intelligence || 0) + (w.strategy || 0) + (w.perception || 0) >= .4 ? 'wits' : (w.courage || 0) >= .3 ? 'danger' : 'body'; };
function exIntro(S, ph, p){
  const n = S.candidates.filter(c => c.status === 'Active').length, ex = ph.ex;
  const pool = (EX_QUOTES[ex.style] || EX_QUOTES.Fair).concat(EX_KIND_QUOTES[exKind(ph)]);
  if(n > 600) pool.push(`"${n} of you. By tonight, a lot fewer."`, '"Too many faces. I will fix that."');
  else if(n < 60) pool.push(`"Only ${n} left. Now it gets interesting."`, '"Few enough that I will remember your names. Make it worth it."');
  if(ex.career && CAREER_FOR[ph.id] && ex.career.startsWith(CAREER_FOR[ph.id])) pool.push(`"This is my trade. I will know if you are faking it."`, `"I have done this for a living. You have done it for an afternoon."`);
  if(ex.from && ex.from >= S.edition - 6) pool.push(`"I was standing where you are ${S.edition - ex.from} year${S.edition - ex.from === 1 ? '' : 's'} ago. It does not get easier."`);
  return vpick(S, pool, p + ':exq');
}
const EX_QUOTES = {
  Fair:['"Do your best. That is all I ask."','"Rules are simple. Follow them."','"Everyone starts equal here."','"Show me what you can do."'],
  Strict:['"I expect more than most examiners do."','"Half of you will not finish. I would prefer more."','"Mediocre is a fail."','"Do not waste my time."'],
  Lenient:['"Relax. Nobody is here to humiliate you."','"I like second chances."','"Help each other. I will not mind."','"Take a breath before you start."'],
  Physical:['"Your legs will answer the question, not your mouth."','"I hope you ate breakfast."','"Run until I stop. Then run more."','"Muscle first. Clever later."'],
  Cerebral:['"Think before you move. Most of you won\'t."','"The answer is simpler than you fear."','"Brains over brawn, today."','"I am testing what is behind your eyes."'],
  Cruel:['"No one is coming back for you."','"If you fall, stay down."','"Helping others? Not on my watch."','"I like it when they cry."'],
  Unpredictable:['"I have not decided the rules yet."','"Luck is a skill. Let\'s see yours."','"Maybe everyone passes. Maybe nobody does."','"Surprise me — or I will surprise you."']
};
const T_RET_NOTE = [
  o => `Back for attempt ${o.n}, a year older and a lot quieter.`,
  o => `Attempt ${o.n}. Last time ended in the ${o.last}.`,
  o => `Returns for a ${o.ord} try — the ${o.last} still haunts ${PR(o.c).them}.`,
  o => `Here again. ${o.n} exams, one goal.`,
  o => `Knows the routine now: this is attempt ${o.n}.`
];
function setupStories(S){
  S.candidates.forEach(persona);
  const m = cmap(S), ret = S.candidates.filter(c => c.attempts && c.attempts.length > 1);
  ret.forEach(c => {
    const prev = c.attempts[c.attempts.length - 2];
    c.notes.unshift({p:0, text: vpick(S, T_RET_NOTE, c.id)({n: c.attempts.length, ord: ordinal(c.attempts.length), last: prev.phaseName || 'exam'})});
  });
  ret.forEach(c => { if(c.nick) return; const rn = returnerNick(S, c); if(rn && nhash(c.id + 'rn' + S.edition) % 100 < 35) giveNick(S, c, 'return', rn[1], 0, undefined, rn[0]); });
  const most = ret.slice().sort((a, b) => b.attempts.length - a.attempts.length)[0];
  if(most && most.attempts.length >= 3) log(S, 0, 'story', vpick(S, [
    o => `${o.c.name} is back for attempt number ${o.n}. Some of the examiners recognise the face.`,
    o => `Attempt ${o.n} for ${o.c.name}. Nobody has tried more times this year.`,
    o => `${o.c.name} registers again — ${o.n} tries now. Persistence or stubbornness, nobody can tell.`
  ], 'most')({c: most, n: most.attempts.length}), [most.id]);
  ret.filter(c => c.dqKill && c.dqKill.ed === S.edition - 1).forEach(c => { const v = c.dqKill.v; log(S, 0, 'rival', vpick(S, [
    o => `${o.c.name} is back. Last year ${PR(o.c).they} ${PR(o.c).were} thrown out for killing ${o.v || 'another candidate'}. The examiners have been told to watch ${PR(o.c).them}.`,
    o => `A murmur runs through the crowd: ${o.c.name}, disqualified last year for killing ${o.v || 'a rival'}, has registered again.`,
    o => `${o.c.name} walks in as if last year never happened. Everyone else remembers ${o.v || 'what happened'}.`
  ], c.id + 'dq')({c, v}), [c.id]); c.pmod = (c.pmod || 0); c.notes.unshift({p: 0, text: `Returned after being disqualified for killing ${v || 'a candidate'}`}); });
  ret.filter(c => (c.attempts[c.attempts.length - 2].reason || '').includes('last match')).forEach(c => log(S, 0, 'story', vpick(S, [
    o => `Last year ${o.c.name} lost the final match by a hair. This year ${PR(o.c).they} want${PR(o.c).s} the license more than anyone.`,
    o => `${o.c.name} was one win away from a license last year. ${PR(o.c).They} ${PR(o.c).are} back.`,
    o => `The candidate who lost the very last match last year, ${o.c.name}, has returned.`
  ], c.id)({c}), [c.id]));
  const seen = new Set(), named = new Set(); let shown = 0;
  ret.forEach(c => (c.grudges || []).forEach(g => { const o = m[g.id]; const k = [c.id, g.id].sort().join(); if(o && !seen.has(k) && !named.has(c.id) && !named.has(o.id) && shown < 3){ seen.add(k); named.add(c.id); named.add(o.id); shown++; log(S, 0, 'rival', vpick(S, [
    x => `Old rivals: ${x.c.name} and ${x.o.name} are both back. ${x.c.first} still remembers that ${x.o.first} ${x.why}.`,
    x => `${x.c.name} spots ${x.o.name} in the crowd. Last time, ${x.o.first} ${x.why}.`,
    x => `Unfinished business: ${x.c.name} and ${x.o.name} meet again.`,
    x => `${x.c.name} sees ${x.o.name} at registration and does not look away. Last time, ${x.o.first} ${x.why}.`,
    x => `A year has passed, and ${x.c.first} has not forgiven ${x.o.name}.`,
    x => `${x.o.name} is back. So is ${x.c.name}, and so is the grudge.`,
    x => `${x.c.name} and ${x.o.name} end up in the same registration queue. Neither says a word.`,
    x => `"You again." ${x.c.name} has been waiting a year to see ${x.o.name}.`
  ], k)({c, o, why: g.why}), [c.id, o.id]); } }));
  setupCrushers(S);
  setupBonds(S);
  setupSecrets(S);
  setupTheme(S);
}
function chronicle(S){
  useLineup(S);
  const C = S.candidates, m = cmap(S), N = C.length, sx = k => S.seed + ':chron:' + k;
  const pk = (arr, k) => arr[nhash(sx(k)) % arr.length];
  const ret = C.filter(c => c.attempts && c.attempts.length > 1).length, fams = (S.alliances || []).filter(A => A.family).length;
  const route = PHASES.filter(p => !p.final && !p.zevil).map(p => p.name);
  const hx = PHASES.filter(p => p.ex && p.ex.license), cruel = PHASES.filter(p => p.ex && p.ex.style === 'Cruel');
  const paras = [];
  paras.push([
    pk([`The ${ordinal(S.edition)} Hunter Exam opened with ${N.toLocaleString('en-US')} applicants`, `${N.toLocaleString('en-US')} hopefuls registered for the ${ordinal(S.edition)} Hunter Exam`, `The ${ordinal(S.edition)} edition began with ${N.toLocaleString('en-US')} names on the list`], 'o1') +
      (ret ? `, ${ret} of them back for another try` : '') + (fams ? ` and ${fams} famil${fams === 1 ? 'y' : 'ies'} registering together` : '') + '.',
    pk([`The route ran through ${route.slice(0, -1).join(', ')} and ${route.slice(-1)}.`, `This year's trials: ${route.join(', ')}.`, `The examiners had prepared ${route.length} trials before the island: ${route.join(', ')}.`], 'o2'),
    hx.length ? pk([`${andList(hx.map(p => p.ex.name))} returned as ${hx.length === 1 ? 'an examiner' : 'examiners'}, years after earning ${hx.length === 1 ? PR(hx[0].ex).their + ' own license' : 'their own licenses'}.`, `Licensed Hunters came back to judge: ${hx.map(p => `${p.ex.name} ran the ${p.name}`).join('; ')}.`], 'o3') : '',
    cruel.length ? pk([`${cruel[0].ex.name} made the ${cruel[0].name} a nightmare.`, `Candidates would later curse ${cruel[0].ex.name}'s ${cruel[0].name}.`], 'o4') : ''
  ].filter(Boolean).join(' '));
  const cuts = S.stats.filter(s => s.before && !PHASES[s.p].final && !PHASES[s.p].zevil).map(s => ({s, r: 1 - s.after / s.before})).sort((a, b) => b.r - a.r);
  const surprise = S.log.filter(e => e.type === 'elim' && /Surprise exit|Few saw it coming|favourites are not safe|Gasps from the crowd|had the talent/.test(e.text))[0];
  const leaders = C.filter(c => c.nick && c.nickEd === S.edition && c.nickKind === 'ace').slice(0, 2);
  const p2 = [];
  if(cuts[0]) p2.push(pk([`The ${PHASES[cuts[0].s.p].name} was the great filter: ${cuts[0].s.before - cuts[0].s.after} of ${cuts[0].s.before} went home there.`, `No trial cut deeper than the ${PHASES[cuts[0].s.p].name}, where ${Math.round(cuts[0].r * 100)}% of the field fell.`, `The ${PHASES[cuts[0].s.p].name} broke the most hopes — ${cuts[0].s.before - cuts[0].s.after} candidates in one go.`], 'c1'));
  if(surprise){ const c = m[surprise.ids[0]]; if(c) p2.push(pk([`Among them was ${c.name}, a favourite few expected to fall so early.`, `The biggest shock was ${c.name}, gone ${atPhase(PHASES[c.out].name)}.`, `Even ${c.name}, one of the strongest applicants, did not survive ${thePhase(PHASES[c.out].name)}.`], 'c2')); }
  if(leaders.length) p2.push(pk([`Meanwhile ${andList(leaders.map(c => `${c.name} ("${c.nick}")`))} made a name early.`, `Some made reputations instead: ${leaders.map(c => `${c.first}, now "${c.nick}"`).join(', ')}.`], 'c3'));
  if(p2.length) paras.push(p2.join(' '));
  const AL = (S.alliances || []).filter(A => A.ever.length >= 2);
  const aName = A => (A.family ? 'The ' : '') + A.name;
  const topA = AL.slice().sort((a, b) => (b.saves || 0) - (a.saves || 0))[0];
  const betr = S.log.filter(e => e.type === 'betray');
  const famOut = AL.filter(A => A.family && A.ever.every(id => m[id] && !['Active','Approved','Finalist'].includes(m[id].status)));
  const p3 = [];
  if(AL.length) p3.push(pk([`${AL.length} alliances formed along the way.`, `Strangers became allies ${AL.length} times over.`, `By the end, ${AL.length} alliances had come and gone.`], 'a1'));
  if(topA && topA.saves) p3.push(pk([`${aName(topA)} carried its members through ${topA.saves} near-failures.`, `None did more for each other than ${aName(topA).replace(/^The /, 'the ')}, with ${topA.saves} saves between them.`, `${aName(topA)} became the exam's safety net — ${topA.saves} times a member was pulled back from the brink.`], 'a2'));
  if(betr.length){ const b = betr[0]; const h = m[b.ids[0]], v = m[b.ids[1]]; if(h && v) p3.push(pk([`But trust had limits: ${h.name} betrayed ${v.name}${betr.length > 1 ? `, and ${betr.length - 1} more betrayal${betr.length > 2 ? 's' : ''} followed` : ''}.`, `The betrayal everyone talked about: ${h.name} turning on ${v.name}.`, `${v.name} learned the hard way that ${h.first} could not be trusted.`], 'a3')); }
  if(famOut.length) p3.push(pk([`The ${famOut[0].name} came together and left together, every member eliminated.`, `No member of the ${famOut[0].name} made it to the end.`], 'a4'));
  if(p3.length) paras.push(p3.join(' '));
  const zi = PHASES.findIndex(p => p.zevil), zs = S.stats.find(s => s.p === zi);
  if(zs){
    const haul = S.log.find(e => e.p === zi && /Top badge haul/.test(e.text)), deaths = C.filter(c => c.status === 'Deceased' && c.out === zi), ghosts = C.filter(c => c.kills && c.out !== zi && c.status !== 'Disqualified' && deaths.some(d => d.killedBy === c.id));
    const z = [pk([`${zs.before} candidates landed on Zevil Island; ${zs.after} left it with enough points.`, `Zevil Island took ${zs.before} in and let ${zs.after} out.`, `Seven days on the island cut the field from ${zs.before} to ${zs.after}.`], 'z1')];
    if(haul){ const c = m[haul.ids[0]]; if(c) z.push(pk([`${c.name} hunted best, ending with ${c.badges.length} badges.`, `Nobody collected more than ${c.name}.`], 'z2')); }
    if(deaths.length) z.push(pk([`${deaths.length} never came back from the island.`, `The island claimed ${deaths.length === 1 ? 'one life' : deaths.length + ' lives'}.`], 'z3'));
    if(ghosts.length) z.push(pk([`${ghosts[0].name} killed there and was never caught.`, `At least one killer, ${ghosts[0].name}, walked off the island unpunished.`], 'z4'));
    paras.push(z.join(' '));
  }
  const hunters = C.filter(c => c.status === 'Approved'), fi = PHASES.findIndex(p => p.final), fs = S.stats.find(s => s.p === fi);
  const lastLoser = S.bracket && S.bracket.eliminated ? m[S.bracket.eliminated] : null;
  const under = hunters.slice().sort((a, b) => total(a) - total(b))[0];
  const f = [];
  if(fs) f.push(pk([`${fs.before} reached the Final Tournament.`, `The Final Tournament opened with ${fs.before} finalists.`, `${fs.before} names were left for the last stage.`], 'f1'));
  if(hunters.length) f.push(pk([`${hunters.length} earned a license: ${andList(hunters.map(c => `${c.name}${c.career ? ` (${c.career})` : ''}`))}.`, `The new Hunters: ${andList(hunters.map(c => c.name))}.`, `${hunters.length === 1 ? 'Only one' : hunters.length} walked out as Hunter${hunters.length === 1 ? '' : 's'}: ${andList(hunters.map(c => c.name))}.`], 'f2'));
  else f.push(pk(['Nobody earned a license this year.', 'The licenses stayed in the drawer — no new Hunters.'], 'f2b'));
  if(under && hunters.length > 2) f.push(pk([`Few would have bet on ${under.name} at the start.`, `${under.name} was the least likely of them on paper — and did it anyway.`, `The biggest surprise of all: ${under.name}.`], 'f3'));
  if(lastLoser) f.push(pk([`${lastLoser.name} lost the very last match and went home with nothing.`, `For ${lastLoser.name}, one bout separated a life from a license — and ${PR(lastLoser).they} lost it.`, `${lastLoser.name} came closest of all those who failed.`], 'f4'));
  paras.push(f.join(' '));
  return paras;
}

