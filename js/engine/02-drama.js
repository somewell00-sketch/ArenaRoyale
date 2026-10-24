/* ===== Drama: set pieces, injuries, debts, promises, rookie crushers ===== */
const injPen = c => c.injury ? c.injury.pen : 0;
const dmod = c => (c.pmod || 0) - injPen(c);
function dlog(S, p, type, text, ids, dr){ if(type === 'story'){ text = storyLine(S, text, ids); if(text === null) return; } const e = {p, type, text: chairT(proIds(S, text, ids)), ids: ids || [], d: ordOnly(S, type, ids), dr}; if(MATCH_TAG) e.mt = MATCH_TAG; S.log.push(e); if(typeof castNote === 'function') castNote(S, e); }
const gNames = arr => arr.length <= 3 ? andList(arr.map(c => c.name)) : arr.slice(0, 3).map(c => c.name).join(', ') + (arr.length === 4 ? ' and one other' : ` and ${arr.length - 3} others`);
const INJURIES = ['twisted ankle','cracked rib','sprained wrist','wrenched shoulder','gashed leg','swollen knee','mild concussion','burned hand','torn hamstring','dislocated finger'];
function injure(S, c, p, rng, sev){
  if(!c || c.injury) return null;
  c.injury = {w: INJURIES[Math.floor(rng() * INJURIES.length)], pen: sev || 3 + Math.floor(rng() * 4), left: 2 + Math.floor(rng() * 2), p, from: PHASES[p].name};
  c.notes.push({p, text:`Picked up a ${c.injury.w}`});
  return c.injury;
}
function owe(S, d, c, p){ if(d && c && d !== c && !d.debt) d.debt = {to: c.id, name: c.name, p, from: PHASES[p].name}; }

// set pieces: a = main subject, b = second person, g = group. [attr, 1] picks from the top of the field, [attr, 0] from the bottom
const SP = {
  sea:[
    {g:['courage',0], gs:[3,7], mg:-4, fat:8, dr:4, t:o => `A rogue wave sweeps the deck. ${o.g} spend the rest of the night bailing water, shaking.`},
    {a:['perception',1], ma:6, dr:3, t:o => `${o.a.name} spots the reef before the lookout does. The captain makes a note of the name.`},
    {a:['agility',0], b:['courage',1], ma:0, mb:4, debt:'a>b', dr:7, t:o => `${o.a.name} goes overboard in the storm. ${o.b.name} dives in after ${PR(o.a).them} without a second thought.`},
    {a:['strategy',1], b:null, ma:3, mb:-5, gr:'b>a', dr:3, t:o => `Below deck, ${o.a.name} cleans out ${o.b.name} at cards, rations and all.`}
  ],
  quiz:[
    {a:['intelligence',1], ma:5, dr:3, t:o => `${o.a.name} answers before the old woman has finished the question, and somehow gets it right.`},
    {a:['teamwork',0], ma:-6, dr:3, t:o => `${o.a.name} argues with the old woman. Loudly. Her men take notes.`},
    {a:null, b:null, ma:-4, mb:-4, dr:4, t:o => `${o.a.name} whispers the answer to ${o.b.name}. The old woman hears every word.`},
    {g:null, gs:[3,6], mg:-3, dr:2, t:o => `A group decides to answer together. ${o.g} are sent the long way round.`}
  ],
  disguise:[
    {a:['perception',1], ma:6, g:null, gs:[2,4], mg:2, dr:4, t:o => `${o.a.name} notices that one guide's shadow falls the wrong way and calls out the Kiriko. ${o.g} follow ${o.a.first} instead.`},
    {a:['perception',0], b:null, ma:-8, dr:6, t:o => `A Kiriko wearing ${o.b.name}'s face leads ${o.a.name} deep into the forest.`},
    {a:['strategy',1], ma:3, dr:2, t:o => `${o.a.name} refuses to follow anyone and walks alone, by the stars.`},
    {g:['perception',0], gs:[3,6], mg:-5, dr:5, t:o => `A smiling guide leads ${o.n} candidates into the trees: ${o.g}. Not all of them find the way back.`}
  ],
  nighttrain:[
    {a:['strength',1], b:['courage',1], ma:4, mb:4, dr:5, t:o => `Bandits board at midnight. ${o.a.name} holds the carriage door shut while ${o.b.name} wakes the others.`},
    {a:['perception',1], ma:6, dr:4, t:o => `${o.a.name} works out that the conductor is the examiner and quietly buys him a drink.`},
    {a:['strategy',0], ma:-6, dr:3, t:o => `${o.a.name} loses a small fortune at the card table in the dining car.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `The train brakes hard on a curve. ${o.a.name} is thrown across the carriage and lands badly.`}
  ],
  cliffpath:[
    {a:['courage',1], ma:3, g:null, gs:[3,6], mg:2, dr:4, t:o => `${o.a.name} crosses the rope bridge first, then goes back to tie a safety line for ${o.g}.`},
    {a:['agility',0], ma:-6, inj:'a', dr:6, t:o => `A ledge crumbles under ${o.a.name}. ${PR(o.a).They} hang${PR(o.a).s} on, but not without cost.`},
    {a:['courage',0], b:['charisma',1], ma:4, debt:'a>b', dr:5, t:o => `${o.a.name} freezes halfway up. ${o.b.name} talks ${PR(o.a).them} up the last stretch, one hold at a time.`},
    {a:['courage',1], b:null, ma:-3, mb:2, inj:'a', debt:'b>a', dr:7, t:o => `Falling rocks. ${o.a.name} shoves ${o.b.name} out of the way and takes the hit.`}
  ],
  marathon:[
    {a:['speed',1], ma:4, g:null, gs:[3,6], mg:-3, fat:10, dr:4, t:o => `${o.a.name} sets an impossible pace at the front. ${o.g} try to follow and pay for it later.`},
    {g:['endurance',0], gs:[4,8], mg:-5, dr:4, t:o => `The examiner speeds up without warning. ${o.g} fall off the back almost at once.`},
    {a:['teamwork',1], b:['endurance',0], ma:-2, mb:5, debt:'b>a', dr:5, t:o => `${o.a.name} hands ${PR(o.a).their} last water to ${o.b.name}, who is about to collapse.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `${o.a.name} trips in the dark and keeps running on it.`},
    {a:['determination',1], b:null, mb:3, dr:3, t:o => `${o.a.name} counts the steps out loud for twenty kilometres. It drives ${o.b.name} mad, and keeps ${o.b.first} going.`}
  ],
  stairs:[
    {a:['strength',1], ma:5, dr:3, t:o => `${o.a.name} takes the stairs three at a time and is soon out of sight.`},
    {a:['endurance',0], ma:-4, inj:'a', dr:5, t:o => `${o.a.name}'s knee buckles somewhere around step four thousand.`},
    {a:['strength',1], b:['endurance',0], ma:-3, mb:6, debt:'b>a', dr:7, t:o => `${o.a.name} carries ${o.b.name} the last two hundred steps.`},
    {g:null, gs:[4,8], mg:3, dr:2, t:o => `Someone starts singing. Soon ${o.g} are climbing to the rhythm.`}
  ],
  wetlands:[
    {g:['perception',0], gs:[3,7], mg:-6, dr:6, t:o => `A fake examiner appears in the mist. ${o.g} follow it into the swamp.`},
    {a:['perception',1], ma:4, g:null, gs:[3,6], mg:2, dr:4, t:o => `${o.a.name} recognises the real examiner by the smell of his gloves and shouts it to ${o.g}.`},
    {a:null, ma:-4, inj:'a', dr:5, t:o => `Something in the reeds bites ${o.a.name}. The leg swells by the hour.`},
    {a:['agility',0], b:['courage',1], ma:3, debt:'a>b', dr:6, t:o => `${o.a.name} sinks to the waist in mud. ${o.b.name} wades in to pull ${PR(o.a).them} out.`},
    {a:['perception',1], ma:3, dr:2, t:o => `Man-eating flowers line the path. ${o.a.name} walks past them without a second look.`}
  ],
  desert:[
    {g:['perception',0], gs:[3,7], mg:-5, dr:5, t:o => `A sandstorm blots out the sun for three hours. ${o.g} lose the trail.`},
    {a:['perception',1], b:null, ma:4, mb:4, dr:4, t:o => `${o.a.name} finds a hidden oasis and shares it with one person only: ${o.b.name}.`},
    {a:['strategy',0], ma:-6, dr:4, t:o => `${o.a.name} drinks the last of ${PR(o.a).their} water by noon.`},
    {a:['intelligence',0], b:['teamwork',1], ma:2, debt:'a>b', dr:5, t:o => `${o.a.name} chases a mirage for an hour. ${o.b.name} goes after ${PR(o.a).them} and drags ${PR(o.a).them} back.`}
  ],
  nighthunt:[
    {a:['perception',1], ma:5, dr:3, t:o => `The lanterns go out. ${o.a.name} keeps running by sound alone.`},
    {g:['courage',0], gs:[3,7], mg:-5, dr:5, t:o => `Something howls in the trees. ${o.g} stop dead.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `${o.a.name} falls into a hunter's pit and climbs out hurt.`},
    {a:null, b:'ally', ma:3, mb:3, dr:3, t:o => `${o.a.name} and ${o.b.name} run back to back through the darkest stretch.`}
  ],
  mountain:[
    {g:null, gs:[3,6], mg:-5, fat:10, dr:6, t:o => `An avalanche roars down the north face. ${o.g} are buried up to the shoulders.`},
    {a:['strength',1], b:null, ma:4, mb:4, dr:4, t:o => `${o.a.name} ropes up with ${o.b.name} on the ice wall. Neither would have made it alone.`},
    {a:null, ma:-4, inj:'a', dr:4, t:o => `${o.a.name} loses a glove to the wind. The fingers stop working before the summit.`},
    {a:['agility',0], b:['strength',1], ma:2, debt:'a>b', dr:6, t:o => `${o.a.name} slips on the ice. The rope holds, barely. ${o.b.name} was on the other end.`}
  ],
  capture:[
    {a:['courage',1], ma:5, dr:4, t:o => `A Great Stamp charges straight at ${o.a.name}. ${o.a.first} does not move, and the beast swerves.`},
    {a:['strength',1], b:null, mb:5, debt:'b>a', dr:4, t:o => `${o.a.name} brings the first Stamp down, then goes to help ${o.b.name} with ${PR(o.b).theirs}.`},
    {a:['agility',0], ma:-4, inj:'a', dr:6, t:o => `${o.a.name} is caught by a tusk.`},
    {g:null, gs:[3,7], mg:-3, dr:4, t:o => `The herd stampedes. ${o.g} scatter into the trees.`}
  ],
  cooking:[
    {a:['perception',1], ma:7, dr:4, t:o => `${o.a.name} cooks the examiner's grandmother's recipe without knowing it. The examiner goes very quiet.`},
    {a:['agility',0], ma:-6, dr:4, t:o => `${o.a.name} sets ${PR(o.a).their} own station on fire.`},
    {a:['strategy',1], b:null, ma:3, mb:-5, gr:'b>a', dr:6, t:o => `${o.a.name} steals ${o.b.name}'s ingredients when no one is looking.`},
    {a:['charisma',1], g:null, gs:[2,5], mg:3, dr:3, t:o => `${o.a.name} shares the secret of the sauce with ${o.g}.`}
  ],
  egg:[
    {a:['courage',1], ma:4, dr:4, t:o => `${o.a.name} jumps first. The others watch the wind take ${PR(o.a).them}, and the web catch ${PR(o.a).them}.`},
    {a:['courage',0], ma:-6, dr:4, t:o => `${o.a.name} stands at the edge for an hour.`},
    {a:['perception',1], b:null, mb:5, debt:'b>a', dr:5, t:o => `${o.a.name} times the updraft perfectly and comes back with two eggs, one for ${o.b.name}.`},
    {a:null, ma:-4, inj:'a', dr:6, t:o => `A thread snaps under ${o.a.name}.`}
  ],
  auction:[
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} spots a forgery the auctioneer missed.`},
    {a:null, b:null, ma:-4, mb:-4, gr:'mut', dr:5, t:o => `${o.a.name} and ${o.b.name} get into a bidding war that empties both purses.`},
    {a:['charisma',1], ma:5, dr:4, t:o => `${o.a.name} bluffs the whole table with an empty purse.`},
    {a:['intelligence',0], ma:-5, dr:3, t:o => `${o.a.name} buys a cursed vase. It is the only thing ${PR(o.a).they} own${PR(o.a).s} now.`}
  ],
  beast:[
    {a:['charisma',1], ma:6, dr:4, t:o => `The beast bows its head to ${o.a.name}.`},
    {a:['agility',0], ma:-4, inj:'a', dr:5, t:o => `${o.a.name} is thrown and kicked.`},
    {a:null, b:null, mb:4, debt:'b>a', dr:4, t:o => `${o.a.name} calms ${o.b.name}'s beast with a single whistle.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The beasts break loose. ${o.g} spend the afternoon chasing them.`}
  ],
  treasure:[
    {a:['intelligence',1], ma:6, dr:3, t:o => `${o.a.name} realises the map is upside down.`},
    {a:['perception',0], ma:-5, dr:3, t:o => `${o.a.name} digs for six hours in the wrong place.`},
    {a:['perception',1], b:null, ma:2, mb:2, gr:'mut', dr:5, t:o => `${o.a.name} and ${o.b.name} reach the same cache at the same moment. Words are exchanged.`},
    {a:['strategy',1], ma:2, g:null, gs:[3,5], mg:-4, gr:'g>a', dr:6, t:o => `${o.a.name} sells false directions to ${o.g}.`}
  ],
  tower:[
    {a:null, ma:4, dr:4, t:o => `A trapdoor drops ${o.a.name} into a room no one else has found, straight onto a shortcut.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `${o.a.name} falls through a false floor and lands hard.`},
    {a:['intelligence',1], ma:5, dr:3, t:o => `${o.a.name} picks a sealed door's lock with a hairpin.`},
    {a:['teamwork',0], ma:3, dr:4, t:o => `Two doors: "pass together" or "pass alone". ${o.a.name} picks alone without hesitating.`}
  ],
  maze:[
    {a:['intelligence',1], ma:5, dr:3, t:o => `${o.a.name} chalks every wall ${PR(o.a).they} pass${PR(o.a).es}. It saves ${PR(o.a).their} team hours.`},
    {a:null, ma:-4, dr:5, t:o => `The walls move in the night. ${o.a.name} wakes up alone.`},
    {a:['perception',1], ma:5, dr:4, t:o => `${o.a.name} hears water behind a wall and finds the hidden channel.`}
  ],
  raft:[
    {a:['strength',0], b:['courage',1], ma:3, debt:'a>b', dr:6, t:o => `The raft hits a rock. ${o.a.name} goes into the rapids; ${o.b.name} dives after ${PR(o.a).them}.`},
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} reads the river like a map.`},
    {a:['teamwork',0], ma:-4, dr:3, t:o => `${o.a.name} loses the paddle, then ${PR(o.a).their} temper.`},
    {a:['courage',1], ma:4, dr:4, t:o => `A waterfall. ${o.a.name} counts to three and jumps first; the rest follow.`}
  ],
  prisoner:[
    {a:['determination',1], ma:3, dr:3, t:o => `A prisoner offers ${o.a.name} a deal: lose on purpose and both get a shorter sentence. ${o.a.first} laughs.`},
    {a:['courage',0], ma:-4, dr:4, t:o => `${o.a.name} is shaken before the match. The prisoner already knows ${PR(o.a).their} name.`},
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} studies every match from the gallery and learns the prisoners' tells.`}
  ],
  guardians:[
    {a:['intelligence',1], ma:5, dr:4, t:o => `${o.a.name} answers the Sphinx's riddle with a riddle of ${PR(o.a).their} own.`},
    {a:['courage',0], ma:-4, dr:3, t:o => `${o.a.name} hesitates at the guardian's gate and loses an hour.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `A guardian's blow catches ${o.a.name} square in the ribs.`}
  ],
  bandits:[
    {a:['charisma',1], ma:5, dr:4, t:o => `${o.a.name} pays the bandit toll with a joke. The bandit laughs and waves ${PR(o.a).them} through.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `A bandit's knife catches ${o.a.name}'s arm.`},
    {a:null, ma:3, dr:4, t:o => `${o.a.name} recognises one of the bandits: an old neighbour from home.`}
  ],
  zevil:[
    {a:['strategy',1], ma:4, dr:4, t:o => `${o.a.name} sets a snare on the beach path and waits.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `A snake bites ${o.a.name} in the dark.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} spends a whole day on the cliffs, watching where everyone sleeps.`}
  ]
};
function spPick(rng, pool, spec, used, ofA, flat){
  let arr = pool.filter(c => !used.has(c.id));
  if(spec === 'ally') arr = ofA ? alliesOf(S_CUR, ofA).filter(c => !used.has(c.id)) : [];
  if(!arr.length) return null;
  if(Array.isArray(spec)){
    const [k, hi] = spec, n = Math.max(3, Math.ceil(arr.length * 0.25));
    arr = arr.slice().sort((x, y) => hi ? y.a[k] - x.a[k] : x.a[k] - y.a[k]).slice(0, n);
  }
  if(flat) return arr[Math.floor(rng() * arr.length)];
  const tot = arr.reduce((s, c) => s + spW(c), 0); let r = rng() * tot;
  for(const c of arr){ r -= spW(c); if(r <= 0) return c; }
  return arr[arr.length - 1];
}
let S_CUR = null;
// events that only happen under a given theme of the year (same format as the phase set pieces, plus a few extra effects)
const TEV = {
  blood:[
    {a:['strategy',1], kill:'a', killP:0.3, why:'executed by the examiner for cheating', dr:9, t:o => `${o.ex} catches ${o.a.name} cheating. What happens next, nobody in ${o.ph} will forget.`},
    {a:['combat',1], b:null, mb:-6, inj:'b', kill:'b', killP:0.18, why:'killed in a fight the examiner refused to stop', dr:8, t:o => `${o.a.name} and ${o.b.name} come to blows. ${o.ex} watches and does nothing to stop it.`},
    {g:['determination',0], gs:[3,6], out:'g', why:'gave up after seeing what this exam does to people', dr:6, t:o => `After what they have seen, ${o.g} walk up to the examiner and quit.`}
  ],
  storm:[
    {a:null, ma:-6, inj:'a', dr:6, t:o => `Lightning strikes a few metres from ${o.a.name}. ${PR(o.a).They} get${PR(o.a).s} up, but something is wrong with ${PR(o.a).their} arm.`},
    {g:null, gs:[4,8], mg:-4, fat:10, dr:5, t:o => `A flash flood cuts the route in two. ${o.g} end up on the wrong side and lose hours.`},
    {g:null, gs:[3,5], ally:'g', mg:2, dr:5, t:o => `${o.g} wait out the worst of the storm in the same cave. By morning they are a team.`}
  ],
  whim:[
    {a:null, ma:30, dr:6, t:o => `The Chairman rolls his dice and points at ${o.a.name}: "You may skip this one." Nobody argues.`},
    {g:null, gs:[4,8], mg:-3, dr:4, t:o => `Halfway through ${o.ph}, the Chairman swaps the examiner for another. The new one changes the rules. ${o.g} were following the old ones.`},
    {a:null, ma:8, dr:4, t:o => `The Chairman tosses a coin to ${o.a.name}. Heads: a head start. It lands heads.`}
  ],
  jubilee:[
    {a:null, ma:7, dr:4, t:o => `${o.ex} sees ${o.a.name} make a mistake that should end ${PR(o.a).their} exam, and looks the other way. It is a festive year.`},
    {g:null, gs:[5,10], mg:2, fat:-20, dr:4, t:o => `A banquet table appears at the side of the route. ${o.g} eat well and feel brand new.`},
    {a:['perception',0], ma:6, dr:3, t:o => `${o.ex} quietly gives ${o.a.name} a hint about ${o.ph}.`}
  ],
  rookie:[
    {a:null, who:'vet', ma:-7, dr:5, t:o => `${o.a.name} takes the route ${PR(o.a).they} remember${PR(o.a).s} from previous years. It no longer exists.`},
    {a:['perception',1], who:'new', ma:7, dr:4, t:o => `First-timer ${o.a.name} finds a new path nobody has ever used before.`}
  ],
  oldguard:[
    {a:null, b:null, who:'vet', ma:-4, mb:-4, gr:'mut', dr:5, t:o => `${o.a.name} and ${o.b.name} recognise each other from an old exam and spend ${o.ph} getting in each other's way.`},
    {a:null, who:'vet', ma:5, dr:3, t:o => `${o.a.name} has seen this trick before and walks straight past it.`}
  ],
  silence:[
    {a:['courage',0], ma:-6, dr:5, t:o => `${o.a.name} calls for help in ${o.ph}. Everyone hears. Nobody comes.`},
    {a:null, leave:'a', dr:5, t:o => `${o.a.name} stops trusting ${PR(o.a).their} own allies and walks away from them.`}
  ],
  friendship:[
    {a:null, b:null, ma:4, mb:4, bond:true, dr:6, t:o => `${o.a.name} and ${o.b.name}, two strangers, save each other twice in the same afternoon.`},
    {g:null, gs:[4,6], ally:'g', mg:2, dr:5, t:o => `Around one campfire, ${o.g} decide to go the rest of the way together.`}
  ],
  shadows:[
    {a:['charisma',1], b:null, ma:3, mb:-5, gr:'b>a', dr:5, t:o => `${o.a.name} has been signing in under ${o.b.name}'s number. ${o.b.first} only finds out when the examiner calls the wrong name.`},
    {a:['strategy',1], out:'a', why:'exposed as an impostor and removed from the exam', dr:6, t:o => `The real owner of ${o.a.name}'s registration number turns up at the gate. The impostor is escorted out.`},
    {secret:true, dr:7, t:() => ''}
  ],
  wild:[
    {g:null, gs:[3,6], mg:-4, inj:'g0', dr:6, t:o => `Something attacks the camp during the night. ${o.g} wake up bleeding.`},
    {a:null, ma:-5, inj:'a', dr:5, t:o => `${o.a.name} brushes against a thorn bush. The scratch turns black within the hour.`},
    {a:null, ma:2, dr:3, t:o => `A small wild animal starts following ${o.a.name} through ${o.ph} and refuses to leave.`}
  ]
};
// more set pieces for every trial: a good moment, a setback that does not eliminate, plain colour, and two people at once
const SP_MORE = {
  sea:[
    {a:['strength',1], ma:4, dr:3, t:o => `${o.a.name} takes a turn at the pumps and does not stop for four hours. The crew start calling ${PR(o.a).them} "deckhand".`},
    {a:['endurance',0], ma:-4, dr:3, t:o => `${o.a.name} is seasick from the first wave to the last. ${PR(o.a).They} arrive${PR(o.a).s} green and furious.`},
    {a:['intelligence',1], ma:5, dr:3, t:o => `${o.a.name} reads the captain's chart upside down from across the cabin and notices the course is wrong.`},
    {a:null, dr:2, t:o => `A pod of dolphins races the ship for an hour. ${o.a.name} is the only one who does not look away.`},
    {a:['charisma',1], b:null, ma:2, mb:2, dr:3, t:o => `${o.a.name} and ${o.b.name} trade stories in the hold until the storm passes. Neither tells the whole truth.`},
    {a:['perception',0], ma:-5, dr:4, t:o => `${o.a.name} sleeps through the call to change course and wakes up on the wrong side of the ship, holding the wrong rope.`},
    {g:['endurance',1], gs:[3,5], mg:3, dr:3, t:o => `The captain needs hands on the rigging. ${o.g} climb without being asked.`},
    {a:['courage',1], b:['courage',0], ma:3, mb:-2, gr:'b>a', dr:4, t:o => `${o.a.name} laughs at ${o.b.name} for clinging to the mast. ${o.b.first} will remember the laugh.`},
    {a:null, ma:-3, inj:'a', dr:5, t:o => `A loose barrel rolls across the deck and catches ${o.a.name} at the knee.`}
  ],
  quiz:[
    {a:['strategy',1], ma:5, dr:3, t:o => `${o.a.name} realises the right answer is to say nothing, and stands perfectly still.`},
    {a:['charisma',0], ma:-4, dr:3, t:o => `${o.a.name} answers honestly and immediately regrets it.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} watches the old woman's hands instead of her face, and knows which questions are traps.`},
    {a:null, dr:2, t:o => `The old woman asks ${o.a.name} a question nobody else is asked. Nobody hears the answer.`},
    {a:['determination',1], ma:3, dr:3, t:o => `${o.a.name} is sent back to the start for a wrong answer, and walks the whole way again without complaint.`},
    {a:['intelligence',0], b:['intelligence',1], ma:-3, mb:2, dr:3, t:o => `${o.a.name} copies ${o.b.name}'s answer. It was a different question.`},
    {g:['teamwork',1], gs:[3,5], mg:2, dr:3, t:o => `${o.g} work out that the questions are about loyalty, not knowledge. They answer as one.`},
    {a:['courage',0], ma:-5, dr:4, t:o => `${o.a.name} freezes when the old woman's men surround ${PR(o.a).them}, and the silence counts as an answer.`},
    {a:['charisma',1], b:null, mb:3, debt:'b>a', dr:4, t:o => `${o.a.name} quietly tells ${o.b.name} that the question is a trick. ${o.b.first} owes ${PR(o.a).them} one.`}
  ],
  disguise:[
    {a:['intelligence',1], ma:5, dr:3, t:o => `${o.a.name} asks every guide the same question twice. Only one gives the same answer.`},
    {a:['charisma',0], ma:-4, dr:3, t:o => `${o.a.name} is fooled by a Kiriko wearing the face of ${PR(o.a).their} own mother. It takes an hour to stop shaking.`},
    {a:['courage',1], b:null, ma:3, mb:3, bond:true, dr:5, t:o => `${o.a.name} and ${o.b.name} agree on a password nobody else knows. It works twice.`},
    {a:null, dr:2, t:o => `A Kiriko waves at ${o.a.name} from a branch. ${o.a.first} waves back. Neither is sure why.`},
    {a:['perception',1], b:['perception',0], ma:2, mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} grabs ${o.b.name}'s arm a step before ${PR(o.b).they} follow${PR(o.b).s} a false guide into the fog.`},
    {g:['strategy',0], gs:[3,6], mg:-4, dr:4, t:o => `Two guides point in opposite directions. ${o.g} split the difference and walk into a ravine.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} marks every tree ${PR(o.a).they} pass${PR(o.a).es}. When the guides change, the marks do not.`},
    {a:['agility',0], ma:-3, inj:'a', dr:4, t:o => `${o.a.name} runs from something that turns out to be a tree. The tree wins.`}
  ],
  nighttrain:[
    {a:['charisma',1], ma:4, dr:3, t:o => `${o.a.name} charms the cook into an extra meal and a rumour about the next stop.`},
    {a:['perception',0], ma:-4, dr:3, t:o => `${o.a.name} falls asleep at the wrong stop and has to run two stations to catch up.`},
    {a:['agility',1], ma:5, dr:4, t:o => `${o.a.name} climbs onto the roof of the moving train to skip three locked carriages.`},
    {a:null, dr:2, t:o => `A child on the platform asks ${o.a.name} for an autograph. ${o.a.first} signs it, confused.`},
    {a:null, b:null, ma:2, mb:2, bond:true, dr:4, t:o => `${o.a.name} and ${o.b.name} share the last bunk, back to back, and never speak of it again.`},
    {a:['strategy',1], b:null, ma:4, mb:-4, gr:'b>a', dr:5, t:o => `${o.a.name} swaps tickets with ${o.b.name} while ${PR(o.b).they} sleep${PR(o.b).s}. ${o.b.first}'s ticket was for the wrong train.`},
    {g:null, gs:[3,6], mg:-3, fat:8, dr:3, t:o => `The heating breaks in the last carriage. ${o.g} spend the night shivering.`},
    {a:['intelligence',1], ma:4, dr:3, t:o => `${o.a.name} works out the timetable is a code, and the code says where the exam really ends.`}
  ],
  cliffpath:[
    {a:['agility',1], ma:5, dr:3, t:o => `${o.a.name} skips a whole switchback by jumping it. The examiner writes something down.`},
    {a:['endurance',0], ma:-4, dr:3, t:o => `${o.a.name} stops to rest on every ledge. Every ledge is a little longer.`},
    {a:null, dr:2, t:o => `An eagle lands on the rock beside ${o.a.name} and stares. ${o.a.first} stares back until it leaves.`},
    {a:['teamwork',1], g:null, gs:[2,4], ma:2, mg:3, dr:4, t:o => `${o.a.name} passes ${PR(o.a).their} rope down to ${o.g}, one by one.`},
    {a:['strength',1], b:['strength',0], mb:4, debt:'b>a', dr:5, t:o => `${o.b.name} slips. ${o.a.name} catches ${PR(o.b).them} by the collar with one hand.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} spots which handholds are fresh and which have been loosened on purpose.`},
    {g:['courage',0], gs:[3,5], mg:-4, dr:4, t:o => `Wind howls through the narrowest stretch. ${o.g} cling to the rock and wait it out.`},
    {a:['courage',1], b:null, ma:3, mb:-3, gr:'b>a', dr:4, t:o => `${o.a.name} overtakes ${o.b.name} on a ledge where nobody should overtake anybody.`}
  ],
  marathon:[
    {a:['endurance',1], ma:5, dr:3, t:o => `At the fortieth kilometre, ${o.a.name} is still breathing through the nose.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} notices the examiner's footprints always lean left before a turn, and runs the turns first.`},
    {a:null, dr:2, t:o => `${o.a.name} hums the same song for six hours. By the end, half the tunnel knows the words.`},
    {a:['speed',0], ma:-5, dr:4, t:o => `${o.a.name} loses a shoe in the dark and runs the last stretch with one bare foot.`},
    {a:['charisma',1], g:null, gs:[3,6], mg:3, dr:3, t:o => `${o.a.name} keeps a group going with terrible jokes: ${o.g}. Nobody laughs, everyone keeps running.`},
    {a:['strategy',1], b:null, ma:3, mb:-3, gr:'b>a', dr:4, t:o => `${o.a.name} drafts behind ${o.b.name} for an hour, then sprints past.`},
    {g:null, gs:[4,8], mg:-3, fat:10, dr:3, t:o => `The tunnel floods ankle-deep. ${o.g} slow to a walk.`},
    {a:['determination',0], ma:-4, dr:3, t:o => `${o.a.name} sits down "for a second" and loses ten minutes.`}
  ],
  stairs:[
    {a:['endurance',1], ma:5, dr:3, t:o => `${o.a.name} reaches the top before anyone else, then goes back down to count the steps for fun.`},
    {a:['determination',1], ma:4, dr:3, t:o => `${o.a.name} does not look up once. Just the next step, then the next.`},
    {a:null, dr:2, t:o => `${o.a.name} finds a name carved into step two thousand, and a date from forty years ago.`},
    {a:['speed',0], ma:-4, dr:3, t:o => `${o.a.name} starts too fast and spends the middle third on ${PR(o.a).their} hands and knees.`},
    {a:['teamwork',1], b:null, ma:2, mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} paces ${o.b.name} up the steepest flight, one step at a time, out loud.`},
    {g:['endurance',0], gs:[4,8], mg:-4, fat:8, dr:3, t:o => `The stairs get steeper without warning. ${o.g} sit down and do not get up for a while.`},
    {a:null, b:null, mb:-3, gr:'b>a', dr:4, t:o => `${o.a.name} takes ${o.b.name}'s spot on the only shaded landing and refuses to move.`},
    {a:['strength',0], ma:-3, inj:'a', dr:4, t:o => `${o.a.name}'s calf cramps so hard ${PR(o.a).they} shout${PR(o.a).s}. Everyone below hears it.`}
  ],
  wetlands:[
    {a:['agility',1], ma:5, dr:3, t:o => `${o.a.name} crosses the bog stepping only on roots. Not a drop of mud on ${PR(o.a).their} boots.`},
    {a:['endurance',0], ma:-4, fat:6, dr:3, t:o => `${o.a.name} loses a boot to the swamp, then the other one, then ${PR(o.a).their} temper.`},
    {a:null, dr:2, t:o => `A frog the size of a dog watches ${o.a.name} pass. It blinks first.`},
    {a:['strategy',1], g:null, gs:[2,5], ma:3, mg:2, dr:4, t:o => `${o.a.name} ties ${o.g} together with a rope so nobody gets lost in the mist.`},
    {a:['perception',0], b:['perception',1], ma:-3, mb:2, debt:'a>b', dr:5, t:o => `${o.a.name} is about to eat a berry. ${o.b.name} slaps it out of ${PR(o.a).their} hand. It was not a berry.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The mist thickens until nobody can see their own feet. ${o.g} stop and wait for it to lift.`},
    {a:['courage',1], ma:4, dr:3, t:o => `${o.a.name} walks straight through a cloud of swamp insects without slowing down. The bites come later.`},
    {a:null, b:null, ma:-2, mb:-2, gr:'mut', dr:4, t:o => `${o.a.name} and ${o.b.name} argue over which examiner is real. They are both wrong.`}
  ],
  desert:[
    {a:['endurance',1], ma:5, dr:3, t:o => `${o.a.name} walks through the hottest hour like it is a spring morning.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} follows a line of beetles to the only shade for miles.`},
    {a:null, dr:2, t:o => `A lizard follows ${o.a.name} for a day. ${o.a.first} names it, then pretends not to care when it leaves.`},
    {a:['endurance',0], ma:-4, fat:8, dr:3, t:o => `${o.a.name}'s lips crack by noon. By evening ${PR(o.a).they} can barely talk.`},
    {a:['strategy',1], b:null, ma:3, mb:-3, gr:'b>a', dr:4, t:o => `${o.a.name} trades ${o.b.name} a map for half ${PR(o.b).their} water. The map is wrong.`},
    {a:['teamwork',1], g:null, gs:[3,5], mg:3, dr:4, t:o => `${o.a.name} rigs a sail from ${PR(o.a).their} cloak for shade and lets ${o.g} share it.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The night is freezing. ${o.g} huddle together and get no sleep at all.`},
    {a:['intelligence',1], ma:4, dr:3, t:o => `${o.a.name} navigates by the stars and is the first to see the oasis at dawn.`}
  ],
  nighthunt:[
    {a:['agility',1], ma:5, dr:3, t:o => `${o.a.name} moves through the trees so quietly the owls do not stop calling.`},
    {a:['courage',0], ma:-4, dr:3, t:o => `${o.a.name} hears ${PR(o.a).their} own heartbeat and is sure it is something else.`},
    {a:null, dr:2, t:o => `Fireflies gather around ${o.a.name}, lighting the way. ${o.a.first} pretends this happens all the time.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} smears mud on ${PR(o.a).their} face and waits for the hunters to pass.`},
    {a:['perception',1], b:null, mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} whistles a warning just before ${o.b.name} walks into a snare.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `Something big moves in the dark. ${o.g} freeze in place for an hour.`},
    {a:null, ma:-3, inj:'a', dr:4, t:o => `A branch whips back into ${o.a.name}'s face. The eye swells shut.`},
    {a:null, b:null, ma:2, mb:2, bond:true, dr:4, t:o => `${o.a.name} and ${o.b.name} hide in the same hollow tree and whisper until dawn.`}
  ],
  mountain:[
    {a:['endurance',1], ma:5, dr:3, t:o => `Above the clouds, ${o.a.name} is the only one still talking.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} takes the long ridge instead of the short couloir. ${PR(o.a).They} arrive${PR(o.a).s} first, and dry.`},
    {a:null, dr:2, t:o => `${o.a.name} finds an old Hunter's ice axe frozen into the rock, and leaves it there.`},
    {a:['endurance',0], ma:-4, fat:8, dr:3, t:o => `The thin air gets to ${o.a.name}. Every step takes three breaths.`},
    {a:['teamwork',1], g:null, gs:[2,4], mg:3, dr:4, t:o => `${o.a.name} breaks trail through deep snow so ${o.g} can walk in the footsteps.`},
    {a:['courage',0], ma:-4, dr:3, t:o => `${o.a.name} looks down from the ice wall. That is a mistake.`},
    {a:['perception',1], b:null, mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} hears the snow crack and pulls ${o.b.name} back just in time.`},
    {g:['endurance',0], gs:[3,5], mg:-3, fat:8, dr:3, t:o => `A blizzard pins ${o.g} to a ledge for half a day.`}
  ],
  capture:[
    {a:['agility',1], ma:5, dr:3, t:o => `${o.a.name} jumps onto a Great Stamp's back and rides it until it gives up.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} lures a Stamp into a ditch with a single fruit and a lot of patience.`},
    {a:null, dr:2, t:o => `A baby Stamp follows ${o.a.name} everywhere. ${o.a.first} does not have the heart to catch it.`},
    {a:['strength',0], ma:-4, dr:3, t:o => `${o.a.name} grabs a Stamp by the tail. It goes about as well as you would expect.`},
    {a:['courage',1], b:['courage',0], mb:3, debt:'b>a', dr:5, t:o => `${o.a.name} steps between ${o.b.name} and a charging bull Stamp, and waves ${PR(o.a).their} jacket until it turns.`},
    {g:['strategy',1], gs:[3,5], mg:3, ally:'g', dr:4, t:o => `${o.g} agree to herd a Stamp together and split it. Surprisingly, they do.`},
    {a:null, b:null, mb:-4, gr:'b>a', dr:4, t:o => `${o.a.name} takes the Stamp ${o.b.name} had been chasing for an hour.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The Stamps go into the river. ${o.g} go in after them.`}
  ],
  cooking:[
    {a:['intelligence',1], ma:5, dr:3, t:o => `${o.a.name} cooks something nobody has ever heard of. The examiner asks for the recipe.`},
    {a:['strategy',0], ma:-4, dr:3, t:o => `${o.a.name} serves the dish before tasting it. The examiner tastes it for ${PR(o.a).them}.`},
    {a:null, dr:2, t:o => `${o.a.name} names ${PR(o.a).their} dish after a grandmother. The examiner nods, slowly.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} notices the examiner salts everything, and adds less salt.`},
    {a:['teamwork',1], b:null, mb:4, debt:'b>a', dr:4, t:o => `${o.a.name} lends ${o.b.name} ${PR(o.a).their} last clean pan.`},
    {a:['charisma',1], ma:3, dr:3, t:o => `${o.a.name} serves ${PR(o.a).their} dish with a story. The story does most of the work.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The fire pits run out of wood. ${o.g} cook over embers.`},
    {a:null, ma:-3, inj:'a', dr:4, t:o => `${o.a.name} burns ${PR(o.a).their} hand on the pot handle and keeps cooking with the other.`}
  ],
  egg:[
    {a:['agility',1], ma:5, dr:3, t:o => `${o.a.name} jumps, grabs two eggs on the way down, and comes back up the same thread.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} watches the wind for an hour before jumping, then picks the one moment it stops.`},
    {a:null, dr:2, t:o => `${o.a.name} boils ${PR(o.a).their} egg in a hot spring and eats it on the cliff edge, legs dangling.`},
    {a:['strength',0], ma:-4, dr:3, t:o => `${o.a.name} catches the thread but cannot climb back up. The way down is longer.`},
    {a:['courage',1], b:['courage',0], mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} jumps holding ${o.b.name}'s hand. ${o.b.first} would never have jumped alone.`},
    {g:['courage',0], gs:[3,5], mg:-3, dr:3, t:o => `${o.g} stand at the edge, waiting for someone else to go first. Nobody does.`},
    {a:null, b:null, ma:-2, mb:-2, gr:'mut', dr:4, t:o => `${o.a.name} and ${o.b.name} reach for the same thread. Neither lets go first.`},
    {a:['strategy',1], ma:3, dr:3, t:o => `${o.a.name} ties a second line around ${PR(o.a).their} waist before jumping. Just in case.`}
  ],
  auction:[
    {a:['intelligence',1], ma:5, dr:3, t:o => `${o.a.name} works out the auctioneer's tell: he blinks before every fake.`},
    {a:['charisma',0], ma:-4, dr:3, t:o => `${o.a.name} bids against ${PR(o.a).themselves} twice before noticing.`},
    {a:null, dr:2, t:o => `${o.a.name} buys a box of old buttons nobody wanted, and smiles about it all day.`},
    {a:['strategy',1], b:null, ma:4, mb:-4, gr:'b>a', dr:5, t:o => `${o.a.name} pretends to want what ${o.b.name} wants, driving the price up until ${o.b.first} runs out of money.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} spots the real treasure in a lot of rubbish and buys the whole lot.`},
    {g:['charisma',1], gs:[2,4], mg:3, ally:'g', dr:4, t:o => `${o.g} pool their money for one big lot.`},
    {a:['intelligence',0], b:null, mb:3, dr:3, t:o => `${o.a.name} sells ${o.b.name} a fake for twice its price. ${o.b.first} resells it for three times.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `The bidding goes wild for a painting of a cat. ${o.g} spend far too much.`}
  ],
  beast:[
    {a:['courage',1], ma:5, dr:3, t:o => `${o.a.name} sits down in front of the beast and waits. After an hour, it lies down too.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} notices the beast is limping and takes the thorn out first.`},
    {a:null, dr:2, t:o => `The beast sneezes on ${o.a.name}. Twice.`},
    {a:['charisma',0], ma:-4, dr:3, t:o => `${o.a.name} tries to stare the beast down. The beast wins.`},
    {a:['teamwork',1], b:null, mb:4, debt:'b>a', dr:4, t:o => `${o.a.name} holds the rope while ${o.b.name} gets close enough to touch the beast's nose.`},
    {g:null, gs:[3,5], mg:-3, dr:3, t:o => `A beast escapes its pen. ${o.g} lose an hour getting it back.`},
    {a:['strength',1], ma:3, dr:3, t:o => `${o.a.name} lifts a fallen log off a beast's leg. The beast follows ${PR(o.a).them} after that.`},
    {a:null, ma:-3, inj:'a', dr:4, t:o => `A beast steps on ${o.a.name}'s foot. On purpose, probably.`}
  ],
  treasure:[
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} notices a stone that is too clean, and finds the cache underneath.`},
    {a:['endurance',0], ma:-4, dr:3, t:o => `${o.a.name} digs until ${PR(o.a).their} hands blister, two metres from the treasure.`},
    {a:null, dr:2, t:o => `${o.a.name} finds a note in the cache from a candidate twenty years ago: "Good luck."`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} follows the other candidates instead of the map. It works.`},
    {a:['teamwork',1], b:null, ma:2, mb:3, bond:true, dr:5, t:o => `${o.a.name} and ${o.b.name} solve the last clue together, then argue happily about who solved it.`},
    {g:['intelligence',0], gs:[3,5], mg:-3, dr:3, t:o => `${o.g} follow a map drawn by a joker. It leads to a sign that says "No".`},
    {a:null, b:null, ma:3, mb:-4, gr:'b>a', dr:4, t:o => `${o.a.name} digs up ${o.b.name}'s cache while ${o.b.first} is fetching water.`},
    {a:['intelligence',1], ma:4, dr:3, t:o => `${o.a.name} realises the riddle is a recipe, and the recipe is a map.`}
  ],
  tower:[
    {a:['agility',1], ma:5, dr:3, t:o => `${o.a.name} climbs down the outside of the tower until the birds attack. Then ${PR(o.a).they} climb${PR(o.a).s} back in, faster.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} reads every warning plaque twice. Two of them were the way out.`},
    {a:null, dr:2, t:o => `${o.a.name} finds a room full of candidates' names scratched into the walls, and adds ${PR(o.a).their} own.`},
    {a:['teamwork',0], ma:-4, dr:4, t:o => `${o.a.name} votes against the team on every door. The team stops asking.`},
    {a:['courage',1], b:null, mb:3, debt:'b>a', dr:5, t:o => `${o.a.name} goes first through a door marked "death". It was not death. ${o.b.name} follows.`},
    {g:null, gs:[3,5], mg:-3, dr:3, t:o => `A ceiling lowers slowly. ${o.g} spend an hour crawling.`},
    {a:['intelligence',0], ma:-3, dr:3, t:o => `${o.a.name} solves a puzzle the long way. There was a short way.`},
    {a:null, b:null, ma:2, mb:2, bond:true, dr:4, t:o => `${o.a.name} and ${o.b.name} are locked in the same cell for a day, and come out friends.`}
  ],
  maze:[
    {a:['strategy',1], ma:5, dr:3, t:o => `${o.a.name} keeps one hand on the right-hand wall and never lets go. It takes forever, and it works.`},
    {a:['perception',0], ma:-4, dr:3, t:o => `${o.a.name} walks past the same broken lantern four times.`},
    {a:null, dr:2, t:o => `${o.a.name} hears someone singing on the other side of the wall. It never gets closer.`},
    {a:['courage',1], ma:4, dr:3, t:o => `${o.a.name} takes the dark passage nobody else will take. It is the short one.`},
    {a:['teamwork',1], b:null, mb:4, debt:'b>a', dr:4, t:o => `${o.a.name} finds ${o.b.name} sitting alone in a dead end and walks ${PR(o.b).them} out.`},
    {g:null, gs:[3,5], mg:-3, fat:6, dr:3, t:o => `The torches go out all at once. ${o.g} wait in the dark.`},
    {a:['intelligence',1], ma:4, dr:3, t:o => `${o.a.name} realises the maze is drawn on the ceiling, in the dust.`},
    {a:null, b:null, ma:-2, mb:-2, gr:'mut', dr:4, t:o => `${o.a.name} and ${o.b.name} both claim to know the way. Both take the team the wrong way.`}
  ],
  raft:[
    {a:['strength',1], ma:5, dr:3, t:o => `${o.a.name} paddles alone through a whole stretch while the others bail.`},
    {a:['agility',0], ma:-4, dr:3, t:o => `${o.a.name} falls in at the calmest part of the river. Everyone sees.`},
    {a:null, dr:2, t:o => `A fisherman on the bank waves at ${o.a.name}'s raft and shouts something about the next bend. Nobody hears it.`},
    {a:['intelligence',1], ma:4, dr:3, t:o => `${o.a.name} reads the foam and steers around the hidden rock.`},
    {a:['teamwork',1], b:null, mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} grabs ${o.b.name} by the life jacket at the edge of a waterfall.`},
    {g:null, gs:[3,5], mg:-3, fat:6, dr:3, t:o => `A raft splits in two. ${o.g} finish the stretch swimming.`},
    {a:['courage',1], ma:3, dr:3, t:o => `${o.a.name} stands at the front through the rapids, shouting directions nobody else could see.`},
    {a:null, b:null, ma:-2, mb:-2, gr:'mut', dr:4, t:o => `${o.a.name} and ${o.b.name} paddle in opposite directions for a full minute.`}
  ],
  prisoner:[
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} reads the prisoner's file before the match. The prisoner does not like that.`},
    {a:['charisma',1], ma:3, dr:3, t:o => `${o.a.name} talks to the prisoner before the match like an old friend. The prisoner hesitates for one round too long.`},
    {a:null, dr:2, t:o => `A prisoner asks ${o.a.name} what the weather is like outside. ${o.a.first} describes it in great detail.`},
    {a:['determination',0], ma:-4, dr:3, t:o => `${o.a.name} watches the first match and wants to go home.`},
    {a:['perception',1], b:null, mb:3, debt:'b>a', dr:4, t:o => `${o.a.name} tells ${o.b.name} the prisoner's weak side. It helps.`},
    {a:['courage',1], ma:4, dr:3, t:o => `${o.a.name} volunteers to go first. The rest of the team breathes out.`}
  ],
  guardians:[
    {a:['strength',1], ma:4, dr:3, t:o => `${o.a.name} pushes open a guardian's gate meant for three people.`},
    {a:['charisma',1], ma:4, dr:3, t:o => `${o.a.name} bows to the guardian. The guardian bows back, and steps aside a little.`},
    {a:null, dr:2, t:o => `The guardian asks ${o.a.name}'s name, then writes it down very slowly.`},
    {a:['strategy',0], ma:-4, dr:3, t:o => `${o.a.name} picks the gate with the smallest guardian. It was the worst choice.`},
    {a:['perception',1], b:null, mb:3, debt:'b>a', dr:4, t:o => `${o.a.name} warns ${o.b.name} about the guardian's left hook just in time.`},
    {a:['courage',1], ma:3, dr:3, t:o => `${o.a.name} walks up to the biggest guardian and asks for a fair fight.`}
  ],
  bandits:[
    {a:['strength',1], ma:4, dr:3, t:o => `${o.a.name} lifts the bandits' barricade off the road and walks through.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} pays the toll in counterfeit coins. The bandits do not notice until later.`},
    {a:null, dr:2, t:o => `A bandit and ${o.a.name} discover they are from the same village. They talk about home for an hour.`},
    {a:['charisma',0], ma:-4, dr:3, t:o => `${o.a.name} argues with the bandit chief about the price. The price goes up.`},
    {a:['courage',1], b:null, mb:3, debt:'b>a', dr:4, t:o => `${o.a.name} draws the bandits away so ${o.b.name} can slip past.`},
    {a:['perception',1], ma:3, dr:3, t:o => `${o.a.name} spots the ambush from the birds rising out of the trees.`}
  ],
  centennial:[
    {a:['determination',1], ma:5, dr:3, t:o => `${o.a.name} reads every name carved on the hundred stairs on the way up, out loud.`},
    {a:['endurance',0], ma:-4, fat:8, dr:3, t:o => `Halfway up the old passage, ${o.a.name} has to stop and breathe for a long time.`},
    {a:null, dr:2, t:o => `${o.a.name} finds the name of a Hunter ${PR(o.a).they} admire${PR(o.a).s} carved into the stone, and touches it for luck.`},
    {a:['courage',1], b:null, mb:4, debt:'b>a', dr:5, t:o => `Dust falls from the ceiling. ${o.a.name} pulls ${o.b.name} through the gap before the stones settle.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} notices the oldest stairs are the safest, and walks only on those.`},
    {g:null, gs:[3,6], mg:-3, dr:3, t:o => `A section of the passage collapses behind them. ${o.g} have to find another way round.`}
  ],
  zevil:[
    {a:['agility',1], ma:4, dr:3, t:o => `${o.a.name} sleeps in the treetops every night. Nobody finds ${PR(o.a).them}.`},
    {a:['endurance',0], ma:-3, dr:3, t:o => `${o.a.name} eats a fruit nobody else would touch and spends a day regretting it.`},
    {a:null, dr:2, t:o => `${o.a.name} carves a calendar into a rock on the beach and crosses off each day.`},
    {a:['charisma',1], b:null, ma:2, mb:2, dr:4, t:o => `${o.a.name} and ${o.b.name} agree not to hunt each other. It is the only promise kept on the island.`},
    {a:['perception',1], ma:4, dr:3, t:o => `${o.a.name} finds the stream where everyone drinks, and watches it from the rocks.`},
    {a:['strategy',0], ma:-3, dr:3, t:o => `${o.a.name} lights a fire on the second night. Everyone knows where ${PR(o.a).they} sleep${PR(o.a).s} now.`}
  ]
};
Object.entries(SP_MORE).forEach(([k, v]) => { SP[k] = (SP[k] || []).concat(v); });
// who a set piece is about: the ones worth following; an ordinary applicant only once they are doing well, or late in the exam
let SP_LATE = false, SP_TOP = new Set();
const spNotable = c => c.tier === 'Skilled' || c.tier === 'Elite' || (c.attempts || []).length > 1 || !!(c.nick || c.heir || c.hParent || c.fam || c.secret) || (c.grudges || []).length > 0 || (c.bonds || []).length > 0;
const spW = c => (spNotable(c) ? (c.tier === 'Elite' || c.tier === 'Skilled' ? 4 : 3) : c.tier === 'Trained' ? 1 : SP_LATE ? 1 : SP_TOP.has(c.id) ? 2 : 0.12) * (typeof castW === 'function' ? castW(c) : 1);
// more of the year's own events, so a theme does not tell the same three stories every time
const TEV_MORE = {
  blood:[
    {a:['courage',0], ma:-5, dr:5, t:o => `${o.ex} makes ${o.a.name} watch what happens to the last candidate who complained. ${o.a.first} stops complaining.`},
    {a:['combat',1], b:null, ma:4, mb:-4, gr:'b>a', inj:'b', dr:6, t:o => `${o.ex} hands ${o.a.name} a stick and points at ${o.b.name}. "Show me."`},
    {g:null, gs:[3,6], mg:-3, dr:4, t:o => `The examiners stop handing out water in ${o.ph}. ${o.g} learn to ration fast.`}
  ],
  storm:[
    {a:['perception',1], ma:5, dr:4, t:o => `${o.a.name} reads the clouds and moves camp an hour before the storm hits the old one.`},
    {g:null, gs:[3,6], mg:-3, fat:8, dr:4, t:o => `The rain does not stop for two days. ${o.g} have not been dry since the start of ${o.ph}.`},
    {a:null, b:null, ma:2, mb:2, bond:true, dr:5, t:o => `${o.a.name} and ${o.b.name} share a single tarp through the worst night of the storm.`}
  ],
  whim:[
    {g:null, gs:[4,8], mg:2, dr:4, t:o => `The Chairman declares everyone born in an odd-numbered month gets a head start. ${o.g} cannot believe their luck.`},
    {a:null, ma:-5, dr:5, t:o => `The Chairman decides ${o.a.name}'s shoes are "too loud" and confiscates them for ${o.ph}.`},
    {a:['charisma',1], ma:5, dr:4, t:o => `${o.a.name} beats the Chairman at rock-paper-scissors. The Chairman insists on best of seven, and still loses.`}
  ],
  jubilee:[
    {a:null, dr:3, t:o => `Fireworks go off over ${o.ph}. ${o.a.name} stops to watch, and does not regret it.`},
    {g:null, gs:[3,6], mg:2, ally:'g', dr:4, t:o => `A band plays at the side of the route. ${o.g} end up dancing together, and walk on together.`},
    {a:['perception',1], ma:5, dr:3, t:o => `${o.a.name} finds a golden ticket hidden in the banners: a free pass through one obstacle.`}
  ],
  rookie:[
    {a:null, who:'new', ma:6, dr:4, t:o => `First-timer ${o.a.name} asks the obvious question nobody else thought to ask, and saves a whole day.`},
    {a:null, who:'vet', ma:-5, dr:4, t:o => `${o.a.name}'s notes from previous exams are useless this year. ${PR(o.a).They} throw${PR(o.a).s} them in the river.`},
    {a:null, b:null, who:'new', ma:3, mb:3, bond:true, dr:5, t:o => `Two first-timers, ${o.a.name} and ${o.b.name}, decide they will make it together or not at all.`}
  ],
  oldguard:[
    {a:null, who:'vet', ma:5, dr:4, t:o => `${o.a.name} spots an examiner ${PR(o.a).they} beat in a duel years ago. The examiner spots ${PR(o.a).them} too.`},
    {a:null, b:null, who:'vet', ma:2, mb:2, dr:4, t:o => `${o.a.name} and ${o.b.name} share a flask and stories of the exams they failed together.`},
    {a:null, who:'new', ma:-4, dr:3, t:o => `The veterans close ranks. First-timer ${o.a.name} is left out of every conversation.`}
  ],
  silence:[
    {a:['teamwork',1], ma:-4, dr:4, t:o => `${o.a.name} offers to share food. Nobody takes it. Nobody trusts a gift this year.`},
    {a:null, b:'ally', ma:-3, mb:-3, gr:'mut', dr:6, t:o => `${o.a.name} and ${o.b.name} catch each other going through the other's bag. Neither says anything.`},
    {a:['strategy',1], ma:4, dr:3, t:o => `${o.a.name} trusts nobody, tells nobody anything, and does fine.`}
  ],
  friendship:[
    {a:null, b:null, ma:3, mb:3, bond:true, dr:6, t:o => `${o.a.name} and ${o.b.name} discover they were born on the same day, in the same town. They do not leave each other's side after that.`},
    {g:null, gs:[4,7], mg:2, ally:'g', dr:5, t:o => `A stranger's birthday. ${o.g} sing for someone they met that morning.`},
    {a:['teamwork',1], b:['courage',0], mb:4, debt:'b>a', dr:5, t:o => `${o.a.name} sits with ${o.b.name} all night when ${o.b.first} cannot stop shaking.`}
  ],
  shadows:[
    {a:['perception',1], b:null, ma:4, mb:-4, gr:'b>a', dr:5, t:o => `${o.a.name} notices ${o.b.name} writes with the wrong hand. ${o.b.first} has some explaining to do.`},
    {secret:true, dr:7, t:() => ''},
    {a:null, dr:3, t:o => `A note in ${o.a.name}'s pocket: "I know who you are." ${o.a.first} has no idea who wrote it.`}
  ],
  wild:[
    {a:['courage',1], ma:5, dr:4, t:o => `A beast takes ${o.a.name}'s pack. ${o.a.name} takes it back.`},
    {g:null, gs:[3,6], mg:-3, inj:'g0', dr:5, t:o => `Something big walks through the camp at night. ${o.g} pretend to be asleep until it is gone.`},
    {a:null, dr:3, t:o => `A bird lands on ${o.a.name}'s shoulder and stays there for the rest of ${o.ph}.`}
  ]
};
Object.entries(TEV_MORE).forEach(([k, v]) => { TEV[k] = (TEV[k] || []).concat(v); });
function runSetPiece(S, ph, p, rng, active, e, used){
  if(e.secret){
    const c = active.find(x => x.secret && !x.secret.revealed && !used.has(x.id)); if(!c) return false;
    used.add(c.id); revealSecret(S, c, p, rng); return true;
  }
  const pool0 = e.who === 'vet' ? active.filter(c => (c.attempts || []).length > 1) : e.who === 'new' ? active.filter(c => (c.attempts || []).length <= 1) : active;
  const pool = S._castOnly ? pool0.filter(c => (S.castNow || []).includes(c.id)) : pool0;   // one scene a trial goes to the cast
  const needsAlly = e.b === 'ally';
  let a = null, b = null, g = [];
  if('a' in e){ a = needsAlly ? spPick(rng, pool.filter(c => alliesOf(S, c).length), e.a, used) : spPick(rng, pool, e.a, used); if(!a) return false; used.add(a.id); }
  if('b' in e){ b = spPick(rng, e.who === 'vet' ? pool : active, e.b, used, a); if(!b) return false; used.add(b.id); }
  if('g' in e){
    const want = e.gs[0] + Math.floor(rng() * (e.gs[1] - e.gs[0] + 1));
    for(let i = 0; i < want; i++){ const x = spPick(rng, active, e.g, used, null, true); if(!x) break; used.add(x.id); g.push(x); }
    if(g.length < 2) return false;
  }
  const exName = ph.ex ? ph.ex.name : 'The examiner';
  const text = e.t({a, b, g: gNames(g), n: g.length, ph: thePhase(ph.name), ex: exName}) + (typeof castCallback === 'function' ? castCallback(S, p, rng, a, b) : '');
  dlog(S, p, 'event', text, [a, b].filter(Boolean).map(c => c.id).concat(g.slice(0, 6).map(c => c.id)), e.dr);
  if(a) a.notes.push({p, text});
  if(b) b.notes.push({p, text});
  if(e.ma && a) a.pmod = (a.pmod || 0) + e.ma;
  if(e.mb && b) b.pmod = (b.pmod || 0) + e.mb;
  if(e.mg) g.forEach(c => c.pmod = (c.pmod || 0) + e.mg);
  if(e.fat) g.forEach(c => c.fatigue = clamp(c.fatigue + e.fat, 0, 100));
  if(e.inj === 'a') injure(S, a, p, rng); else if(e.inj === 'b') injure(S, b, p, rng); else if(e.inj === 'g0') injure(S, g[0], p, rng);
  if(e.debt === 'a>b') owe(S, a, b, p); else if(e.debt === 'b>a') owe(S, b, a, p);
  if(e.gr === 'b>a') addGrudge(b, a, `crossed {them} in the ${ph.name}`);
  else if(e.gr === 'mut'){ addGrudge(a, b, `clashed with {them} in the ${ph.name}`); addGrudge(b, a, `clashed with {them} in the ${ph.name}`); }
  else if(e.gr === 'g>a') g.forEach(c => addGrudge(c, a, `sold {them} false directions in the ${ph.name}`));
  if(e.ally === 'g') for(let i = 1; i < g.length; i++) formAlliance(S, p, g[0], g[i], 'after the storm', rng);
  if(e.leave === 'a' && a.alliance) leaveAlliance(S, a, p, `${a.name} leaves ${PR(a).their} alliance.`, 'split');
  if(e.bond && a && b && !bonded(a, b) && Math.abs(a.age - b.age) <= 4 && rng() < 0.5){ makeBond(S, p, a, b); dlog(S, p, 'bond', vpick(S, T_BOND, a.id + b.id)({a, b}), [a.id, b.id], 7); }
  if(e.out){ (e.out === 'g' ? g : [a]).forEach(c => { c.status = 'Eliminated'; c.out = p; c.reason = `${ph.name}: ${e.why}`; if(e.out === 'a') c.noReturn = true; }); }
  if(e.kill){ const v = e.kill === 'a' ? a : b; if(v && rng() < e.killP){ v.status = 'Deceased'; v.out = p; v.reason = `${ph.name}: ${e.why}`; v.notes.push({p, text: `Died: ${e.why}`}); lastWords(S, p, v, e.kill === 'b' ? a : null); } }
  return true;
}
function setPieces(S, ph, p, rng, active){
  const bank = SP[ph.id]; if(active.length < 4) return;
  S_CUR = S;
  SP_LATE = p >= PHASES.length - 3;
  SP_TOP = new Set(); for(let q = p - 1; q >= 0; q--){ const id = PHASES[q].id, sc = active.filter(c => c.scores && c.scores[id] != null); if(sc.length < active.length / 2) continue; sc.sort((x, y) => y.scores[id] - x.scores[id]).slice(0, Math.ceil(sc.length * 0.1)).forEach(c => SP_TOP.add(c.id)); break; }
  const used = new Set();
  // the theme of the year takes over one slot most of the time
  const tev = TEV[S.theme];
  let themed = 0;
  if(tev && rng() < 0.65){ for(const e of rng.shuffle(tev.slice())){ if(runSetPiece(S, ph, p, rng, active.filter(c => c.status === 'Active'), e, used)){ themed = 1; break; } } }
  if(!bank) return;
  const r = rng(), k = 2 + (r < 0.55 ? 1 : 0) + (r < 0.2 ? 1 : 0) + (THEME === 'storm' ? 1 : 0) - themed;
  let done = 0;
  { const want = (S.castNow || []).length >= 4 ? 2 : (S.castNow || []).length ? 1 : 0; let got = 0;   // two scenes a trial go to the cast (one when it is small); they count toward the usual number
    if(want) for(const e of rng.shuffle(bank.slice()).slice(0, 10)){ S._castOnly = true; let ok = false; try { ok = runSetPiece(S, ph, p, rng, active.filter(c => c.status === 'Active'), e, used); } finally { S._castOnly = false; } if(ok){ done++; if(++got >= want) break; } } }
  for(const e of rng.shuffle(bank.slice())){
    if(done >= k) break;
    if(runSetPiece(S, ph, p, rng, active.filter(c => c.status === 'Active'), e, used)) done++;
  }
}

/* rookie crushers: veterans (2+ attempts) with the Schemer trait who come back to ruin first-timers. Max 3 per exam. */
const T_CRUSH_WARN = [
  o => `Veterans warn the newcomers about ${o.c.name}, here for attempt ${o.n}: a known rookie crusher. Do not accept the drinks.`,
  o => `${o.c.name} is back for attempt ${o.n}, smiling at every first-timer. The veterans know better.`,
  o => `"Stay away from ${o.c.first}," a veteran mutters. ${o.c.name} has crushed rookies before and is back for more.`
];
const T_SAB = [
  o => `${o.c.name} offers ${o.v.name} a "special" energy drink. ${o.v.first} feels sick within the hour.`,
  o => `${o.c.name} gives ${o.v.name} friendly directions. The wrong ones.`,
  o => `${o.c.name} spends an hour telling ${o.v.name} horror stories about ${thePhase(o.ph)}. ${o.v.first} goes in shaking.`,
  o => `${o.c.name} "accidentally" spills ${o.v.name}'s water.`,
  o => `${o.c.name} warns ${o.v.name} that someone is out to get ${PR(o.v).them}. It is a lie, and it works.`,
  o => `${o.c.name} loosens the straps on ${o.v.name}'s pack while pretending to help.`
];
const T_SAB_TEAM = [o => `${o.c.name} joins ${o.v.name}'s team and quietly votes against every door.`, o => `${o.c.name} "remembers" a route for ${o.v.name}'s team. It is a dead end.`];
const T_SAB_COOK = [o => `${o.c.name} swaps the salt for sugar at ${o.v.name}'s station.`];
const T_SAB_SEEN = [
  o => `${o.c.name} offers ${o.v.name} a drink. ${o.v.first} smiles, takes it, and pours it into the dirt.`,
  o => `${o.v.name} sees straight through ${o.c.name}'s friendly act.`,
  o => `${o.c.name} tries the usual trick on ${o.v.name}, but ${o.v.first} has heard the stories.`
];
const T_SAB_AFTER = [
  o => `${o.v.name} never recovered from ${o.c.name}'s "help". Another rookie crushed.`,
  o => `${o.c.name} watches ${o.v.name} leave the exam and smiles.`,
  o => `${o.v.name} is out, and ${o.c.name} quietly crosses another name off a list.`
];

