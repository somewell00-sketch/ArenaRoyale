/* ===== Alliances & cooperation ===== */
let _cm = {arr:null, map:null};
const cmap = S => { if(_cm.arr !== S.candidates){ _cm = {arr:S.candidates, map:Object.fromEntries(S.candidates.map(c => [c.id, c]))}; } return _cm.map; };
const allianceOf = (S, c) => c.alliance ? (S.alliances || []).find(a => a.id === c.alliance) : null;
const familyOf = (S, c) => c.fam ? (S.alliances || []).find(a => a.id === c.fam) : null;
const isRelative = (a, b) => !!(a.fam && a.fam === b.fam);
function alliesOf(S, c, activeOnly = true){
  const m = cmap(S), ids = new Set();
  [allianceOf(S, c), familyOf(S, c)].forEach(A => A && A.members.forEach(id => { if(id !== c.id) ids.add(id); }));
  return [...ids].map(id => m[id]).filter(o => o && (!activeOnly || o.status === 'Active' || o.status === 'Finalist'));
}
// the strongest bond two candidates share (family first)
const bondOf = (S, a, b) => isRelative(a, b) ? familyOf(S, a) : (a.alliance && a.alliance === b.alliance ? allianceOf(S, a) : null);
const AL_WORD = {sea:['Tidal','Storm','Deck','Harbor','Anchor','Saltwater','Gale','Wave'], quiz:['Riddle','Crossroads','Question','Signpost','Answer'], disguise:['Mask','Forest','Mimic','Kiriko','Masquerade'], marathon:['Tunnel','Lantern','Underground','Long Road','Footfall','Torchlight'], stairs:['Stair','Summit','Step','Climb','Thousand Steps'], wetlands:['Swamp','Mist','Marsh','Bog','Fog','Numere'], capture:['Stamp','Hunt','Tusk','Stampede','Snare'], cooking:['Kitchen','Ember','Skillet','Spice','Feast'], egg:['Ravine','Web','Cliff','Eagle','Freefall'], tower:['Tower','Trapdoor','Stairwell','Majority','Seventy-Two'], prisoner:['Cell','Shackle','Warden','Jailbreak'], nighttrain:['Night Train','Carriage','Rail','Sleeper'], cliffpath:['Cliff','Ledge','Rope Bridge'], desert:['Dune','Mirage','Sand','Oasis'], nighthunt:['Moonlit','Howling Wood','Night'], mountain:['Summit','Peak','Ice','Avalanche'], auction:['Gavel','Auction','Bid'], beast:['Beast','Mane','Saddle'], treasure:['Map','Treasure','Compass'], maze:['Labyrinth','Maze','Lantern'], guardians:['Gate','Sphinx'], raft:['River','Raft','Rapids'], bandits:['Bandit','Toll'], zevil:['Island','Badge','Jungle','Tide Pool'], final:['Arena']};
const AL_ADJ = ['Crimson','Silent','Iron','Golden','Black','White','Scarlet','Lucky','Reckless','Loyal','Hungry','Restless','Midnight','Wandering','Stubborn','Lonely','Wild','Broken','Burning','Frozen','Velvet','Rusty','Shadow','Silver','Thunder','Feral','Gentle','Lost','Hidden','Bitter','Sly','Bold','Grim','Merry','Ragged','Last','Unlikely','Odd','Sleepless','Barefoot','Painted','Howling','Quiet','Stray','Brave','Desperate','Patient','Clever','Untamed','Scrappy'];
const AL_NOUN = ['Pact','Circle','Accord','Company','Covenant','Band','Oath','League','Union','Compact','Crew','Fellowship','Gang','Family','Clan','Squad','Pack','Syndicate','Brotherhood','Sisterhood','Society','Guild','Order','Party','Troupe','Posse','Club','House','Coalition','Front','Ring','Lodge','Council','Cartel','Bunch','Tribe','Legion','Caravan','Knot','Hive','Flock','Brigade','Outfit','Collective','Kin','Table','Wolves','Ravens','Foxes','Hounds','Misfits','Strays','Survivors','Outcasts','Runners','Dreamers','Rogues'];
const AL_SIZES = {2:['Duo','Pair','Twins','Tandem'], 3:['Trio','Triad'], 4:['Quartet','Foursome'], 5:['Quintet','Five'], 6:['Sextet','Six'], 7:['Septet','Seven'], 8:['Octet','Eight']};
const AL_SIZE = AL_SIZES[2];   // alliances are always founded by two people
const SIZE_RE = new RegExp('\\b(' + Object.values(AL_SIZES).flat().join('|') + ')$');
// keep size words honest: a Duo that gains a member becomes a Trio, and so on
function sizedName(S, A, n){
  const list = AL_SIZES[Math.min(n, 8)] || AL_SIZES[8];
  let h = 0; for(const ch of A.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const taken = new Set((S.alliances || []).filter(x => x !== A).map(x => x.name));
  for(let k = 0; k < list.length; k++){ const nm = A.sizeTpl.replace('§', list[(h + k) % list.length]); if(!taken.has(nm)) return nm; }
  return null;   // every variant is taken by another group: keep the current name
}
function resizeAlliance(S, A, n){
  if(!A.sizeTpl || n < 2) return null;
  const next = sizedName(S, A, n);
  if(!next || next === A.name || SIZE_RE.exec(next)[1] === SIZE_RE.exec(A.name)[1] && (AL_SIZES[Math.min(n, 8)] || []).includes(SIZE_RE.exec(A.name)[1])) return null;
  const old = A.name; A.name = next; (A.aka = A.aka || []).push(old);
  return old;
}
const AL_SINGLE = ['Vanguard','Kinship','Ironclad','Nightjar','Lodestar','Wildfire','Hearthstone','Driftwood','Firefly','Compass','Lantern','Tempest','Bastion','Mirage','Undertow','Ember','Cinder','Bramble','Thornback','Moonrise','Daybreak','Sundown','Overture','Riptide','Keystone','Paragon','Northstar','Halcyon','Monsoon','Rookery','Wolfpack','Saltmarsh','Stormfront','Longshot','Underdogs','Hollowmere','Ashfall','Blackwater','Gallows','Nomads','Sentinels','Harbingers','Wayfarers','Starlings','Mavericks','Renegades','Ironbark','Quicksilver','Featherfall','Kingfisher','Copperhead','Whisperwind','Graveyard Shift','Second Wind','Last Light'];
const AL_PLACE = ['Ravine','Tunnels','Swamp','Tower','Storm','Mist','Stairs','Island','Lantern','Deep','Long Night','Crossroads','Seventh Door','Broken Bridge','Burning Kitchen','Silent Forest'];
function allianceName(S, p, rng, founder){
  const used = new Set((S.alliances || []).map(A => A.name));
  const W = AL_WORD[PHASES[p].id] || ['Hunter'];
  const forms = [
    () => `The ${rng.pick(W)} ${rng.pick(AL_NOUN)}`,
    () => `${rng.pick(W)} ${rng.pick(AL_NOUN)}`,
    () => `The ${rng.pick(AL_ADJ)} ${rng.pick(AL_NOUN)}`,
    () => `${rng.pick(AL_ADJ)} ${rng.pick(AL_NOUN)}`,
    () => `${rng.pick(AL_ADJ)} ${rng.pick(W)} ${rng.pick(AL_NOUN)}`,
    () => `${rng.pick(AL_NOUN)} of the ${rng.pick(AL_PLACE)}`,
    () => `The ${rng.pick(AL_ADJ)} ${rng.pick(AL_SIZE)}`,
    () => `${rng.pick(W)} ${rng.pick(AL_SIZE)}`,
    () => rng.pick(AL_SINGLE),
    () => rng.pick(AL_SINGLE),
    () => founder ? `${founder.first}'s ${rng.pick(AL_NOUN)}` : rng.pick(AL_SINGLE),
    () => founder ? `${founder.last} ${rng.pick(AL_NOUN)}` : `The ${rng.pick(AL_ADJ)} ${rng.pick(AL_NOUN)}`
  ];
  for(let t = 0; t < 60; t++){ const n = rng.pick(forms)(); if(!used.has(n)) return n; }
  for(let t = 0; t < 200; t++){ const n = `The ${rng.pick(AL_ADJ)} ${rng.pick(W)} ${rng.pick(AL_NOUN)} of the ${rng.pick(AL_PLACE)}`; if(!used.has(n)) return n; }
  return `${rng.pick(AL_ADJ)} ${rng.pick(AL_SINGLE)} ${rng.pick(AL_NOUN)}`;
}
const regBase = d => d <= 5 ? .30 : d <= 15 ? .20 : d <= 30 ? .12 : d <= 50 ? .06 : .02;
function allianceChance(a, b, w, ctx){
  if(hasGrudge(a, b) || hasGrudge(b, a)) return 0;
  let p = regBase(Math.abs(a.reg - b.reg));
  p += (a.a.charisma - 50) / 300;                                    // proposer's pitch
  p += (b.a.teamwork - 50) / 300;                                    // partner's willingness
  if(w && weighted(b, w) > weighted(a, w)) p += 0.05 * (a.a.strategy + a.a.intelligence) / 100; // a useful partner
  if(ctx && ctx.obstacle) p += 0.03;
  if(ctx && ctx.threat) p += 0.05;
  if((a.prevAllies || []).includes(b.id)) p += 0.15;                 // old allies from a previous exam
  if(a.age < 18 && b.age < 18) p += 0.25;
  if(THEME === 'friendship') p += 0.06;                            // kids stick together
  const vet = c => (c.attempts || []).length >= 3;
  if(vet(a) && vet(b)) p += 0.15; else if(vet(a) || vet(b)) p += 0.04; // old faces find each other
  return clamp(p, 0.01, 0.6);
}
function formAlliance(S, p, a, b, reason, rng, logFn){
  S.alliances = S.alliances || [];
  if(a.alliance && a.alliance === b.alliance) return false;
  if(a.alliance && b.alliance) return false;                         // both already committed elsewhere
  let A = allianceOf(S, a) || allianceOf(S, b);
  const joining = !!A;
  if(A){
    const size = A.members.filter(id => { const o = cmap(S)[id]; return o && (o.status === 'Active' || o.status === 'Finalist'); }).length;
    if(size >= 4 && rng() > 0.15) return false;                      // usually 2–4, rarely bigger
  } else {
    A = {id:'A' + (S.alliances.length + 1), name: allianceName(S, p, rng, a), members:[], ever:[], formed:p, saves:0, betrayals:0, together:0, peak:0};
    if(SIZE_RE.test(A.name)){ A.sizeTpl = A.name.replace(SIZE_RE, '§'); A.name = sizedName(S, A, 2) || A.name; }
    S.alliances.push(A);
  }
  A.joined = A.joined || {};
  [a, b].forEach(c => { if(!A.members.includes(c.id)){ A.members.push(c.id); c.alliance = A.id; A.joined[c.id] = p; } if(!A.ever.includes(c.id)) A.ever.push(c.id); });
  const n = A.members.filter(id => cmap(S)[id].status === 'Active').length;
  const was = joining ? resizeAlliance(S, A, n) : null;
  const nw = (a.alliance === A.id && A.members.indexOf(a.id) < A.members.indexOf(b.id)) ? b : a, grp = was || A.name, tail = was ? ` — the group is now ${A.name}` : ` (${n} members)`, rs = reason ? ' ' + reason : '';
  const text = joining
    ? vpick(S, [x => `${x.nw.name} joins ${x.grp}${x.rs}${x.tail}.`, x => `${x.grp} takes in a new face: ${x.nw.name} joins${x.rs}${x.tail}.`, x => `${x.nw.name} joins ${x.grp} after a short talk around the fire${x.rs}${x.tail}.`, x => `Nobody objects when ${x.nw.name} joins ${x.grp}${x.rs}${x.tail}.`, x => `${x.nw.name} joins ${x.grp}, at least for now${x.rs}${x.tail}.`], 'join' + nw.id)({nw, grp, tail, rs})
    : vpick(S, [x => `${x.a.name} and ${x.b.name} form an alliance, ${x.A}${x.r}.`, x => `${x.a.name} and ${x.b.name} shake hands and form an alliance: ${x.A}${x.r}.`, x => `After one look at the ${x.ph}, ${x.a.name} and ${x.b.name} form an alliance: ${x.A}${x.r}.`, x => `${x.a.name} and ${x.b.name} decide to form an alliance — ${x.A}${x.r}.`, x => `Two strangers, ${x.a.name} and ${x.b.name}, form an alliance: ${x.A}${x.r}.`], 'form' + a.id)({a, b, A: A.name, r: reason ? ', ' + reason : '', ph: (PHASES[p] && PHASES[p].name) || 'exam'});
  A.peak = Math.max(A.peak || 0, n);
  if(joining){ const old = nw === a ? b : a; nw.notes.push({p, text: `Joined ${A.name} with ${old.name}`}); old.notes.push({p, text: `${nw.name} joined ${A.name}`}); }   // only the newcomer joined; the member already there welcomed them
  else { a.notes.push({p, text: `Formed ${A.name} with ${b.name}`}); b.notes.push({p, text: `Formed ${A.name} with ${a.name}`}); }
  (logFn || ((t, ids) => log(S, p, 'ally', t, ids, true)))(text, [a.id, b.id]);
  return true;
}
function leaveAlliance(S, c, p, text, type, logFn){
  const A = allianceOf(S, c); if(!A) return;
  A.members = A.members.filter(id => id !== c.id); c.alliance = null;
  const n = A.members.filter(id => { const o = cmap(S)[id]; return o && o.status === 'Active'; }).length;
  const was = resizeAlliance(S, A, n);
  if(was) text = text.replace(/\.$/, '') + ` — ${was} is now ${A.name}.`;
  (logFn || ((t, ids, ty) => log(S, p, ty, t, ids, true)))(text, [c.id].concat(A.members.slice(0, 3)), type || 'split');
}
// candidates mostly meet people with nearby registration numbers; only actual meetings get an alliance roll
function allianceEncounters(S, p, rng, active){
  const ph = PHASES[p];
  const sorted = active.slice().sort((x, y) => x.reg - y.reg);
  const pos = new Map(sorted.map((c, i) => [c.id, i]));
  const ctx = {obstacle: !!ph.obstacle};
  const kids = active.filter(c => c.age < 18);
  let formed = 0;
  for(const a of rng.shuffle(active.slice())){
    if(rng() > 0.5) continue;                                         // not everyone talks to someone each phase
    const off = (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(-Math.log(1 - rng()) * 9));
    let b = sorted[pos.get(a.id) + off];
    if(a.age < 18 && kids.length > 1 && rng() < 0.7) b = kids[Math.floor(rng() * kids.length)];   // the youngest find each other in the crowd
    if(!b || b === a || b.status !== 'Active' || a.status !== 'Active') continue;
    if((a.alliance && a.alliance === b.alliance) || isRelative(a, b)) continue;
    if(rng() < allianceChance(a, b, ph.w, ctx)){
      if(formAlliance(S, p, a, b, ctx.obstacle ? `facing the ${ph.name} together` : '', rng)) formed++;
    } else if(rng() < 0.08){
      log(S, p, 'split', vpick(S, [x => `${x.b.name} turns down ${x.a.name}'s offer to team up.`, x => `${x.a.name} asks ${x.b.name} to team up. ${x.b.first} turns down the offer flat.`, x => `${x.b.name} turns down ${x.a.name} with a polite smile. Maybe next phase.`, x => `${x.b.name} turns down ${x.a.name}: "I work alone."`, x => `${x.a.name} offers ${x.b.name} a place in the group. ${x.b.first} turns down the offer.`], 'td' + b.id)({a, b}), [b.id, a.id], true);
    }
  }
  return formed;
}
// best ally lends a hand where the candidate is weaker; never guarantees success
let NOALLY = false;
function allyHelp(S, c, w){
  if(NOALLY) return null;
  let best = null, bestW = -1;
  for(const o of alliesOf(S, c)){ const v = weighted(o, w) + (bonded(o, c) ? 6 : 0); if(v > bestW){ best = o; bestW = v; } }
  if(!best) return null;
  bestW = weighted(best, w);
  const diff = bestW - weighted(c, w);
  const kin = isRelative(best, c), bond = bonded(best, c);
  const will = (best.a.teamwork + best.a.determination + best.a.courage * 0.5) / 250 + (kin ? 0.3 : 0) + (bond ? 0.45 : 0);
  let bonus = diff > 2 ? Math.min(bond ? 10 : kin ? 9 : 7, diff * (bond ? 0.45 : kin ? 0.4 : 0.3)) * (0.5 + will * 0.6) : 0;
  if(bond) bonus += 1;
  if(THEME === 'silence') bonus *= 0.5;
  if(c.fatigue > 50) bonus += 2 * will;                              // protecting an exhausted ally
  return bonus > 0.5 ? {ally: best, bonus} : null;
}
function allianceUpkeep(S, p, rng){
  for(const A of (S.alliances || [])){
    if(A.family) continue;                                           // families do not drift apart
    const m = cmap(S);
    const live = A.members.map(id => m[id]).filter(c => c && c.status === 'Active');
    if(live.length < 2) continue;
    for(const c of live){
      if(live.some(o => o !== c && bonded(o, c))) continue;   // a bonded pair never walks away from each other
      const leaveP = 0.02 + Math.max(0, c.a.strategy - c.a.teamwork) / 500 - c.a.determination / 4000 + (c.fatigue > 60 ? 0.03 : 0);
      if(rng() < Math.max(0.005, A.helped === p ? leaveP / 2 : leaveP)){
        leaveAlliance(S, c, p, vpick(S, [x => `${x.c.name} walks away from ${x.A} — it no longer serves ${PR(x.c).their} plans.`, x => `${x.c.name} leaves ${x.A} without saying goodbye.`, x => `${x.c.name} decides ${x.A} is slowing ${PR(x.c).them} down, and walks away.`, x => `${x.A} loses ${x.c.name}, who has found a better offer.`, x => `${x.c.name} quietly drifts away from ${x.A}.`], 'wa' + c.id)({c, A: A.name}), 'split');
        c.notes.push({p, text:`Left ${PR(c).their} alliance`});
      }
    }
  }
}

const T_ZHUNT = [
  o => `${o.c.name} already has ${o.pts} points — and goes back into the jungle anyway, hunting for ${o.rel} ${o.o.name}'s target.`,
  o => `Safe with ${o.pts} points, ${o.c.name} could hide until the end. Instead ${o.c.first} starts tracking the badge ${o.rel} ${o.o.name} needs.`,
  o => `"You're not done yet," ${o.c.name} tells ${o.rel} ${o.o.name}, and heads back out with ${o.pts} points to lose.`
];
const T_ZESCORT = [
  o => `${o.c.name} is safe with ${o.pts} points, but stays at ${o.rel} ${o.o.name}'s side for the rest of the island.`,
  o => `Instead of hiding, ${o.c.name} becomes ${o.rel} ${o.o.name}'s shadow — anyone hunting ${o.o.first} will have to go through ${PR(o.c).them}.`,
  o => `${o.c.name} has nothing left to win on the island and spends the days guarding ${o.rel} ${o.o.name}.`
];
const T_ZGIFT = [
  o => `${o.c.name} has points to spare and gives ${o.rel} ${o.o.name} badge ${o.b}.`,
  o => `Already safe, ${o.c.name} tosses ${o.rel} ${o.o.name} a spare badge (${o.b}). Every point counts.`
];
const T_ZGIFT3 = [
  o => `${o.c.name} has been carrying badge ${o.b} for ${o.rel} ${o.o.name} — worth 3 points to ${PR(o.o).them}, nothing ${o.c.first} still needs.`,
  o => `Already safe, ${o.c.name} hands ${o.rel} ${o.o.name} badge ${o.b}: 3 points that change everything for ${o.o.first}.`
];
const T_ZSACRIFICE = [
  o => `${o.c.name} arrived at 6 points and leaves with fewer — spent going back for ${o.o.name}. ${o.o.first} advances; ${o.c.first} does not.`,
  o => `${o.o.name} passes Zevil Island. ${o.c.name}, who risked a safe place to make that happen, is eliminated.`,
  o => `The price of ${o.o.name}'s place in the next round: ${o.c.name}'s own. ${o.c.first} gave it up helping.`
];
const T_ZBOND = [
  o => `${o.o.name} leaves Zevil Island knowing ${PR(o.o).they} owe${PR(o.o).s} it to ${o.c.name}. Something unbreakable forms between them.`,
  o => `${o.c.name} went back for ${o.o.name} when ${PR(o.c).they} didn't have to. Neither of them will forget it.`
];
function zevilPoints(S, c){
  return c.badges.reduce((s,b) => s + (b === c.id || b === c.target ? 3 : 1), 0);
}
const zevilPower = (c, rng) => weighted(c, PHASE_DEFS.zevil.w) + rng.gauss(0, 9) - c.fatigue*0.2 + (c.zxp || 0) + dmod(c) * 0.5;

function runZevil(S, ph, p, rng, active){
  const byId = Object.fromEntries(S.candidates.map(c => [c.id, c]));
  const bn = id => '#' + byId[id].reg;
  active.forEach(c => { c.badges = [c.id]; c.target = null; c.zFights = 0; c.zxp = expBonus(S, c, p) * 0.6; c.zMode = null; c.zFor = null; c.zAsked = false; c.zFell = null; c.zHelped = []; });
  const Z = S.zevil = {ids: active.map(c => c.id), targets:{}, days:[], ev:[]};
  const zlog = (day, type, text, ids, major) => { Z.ev.push({day, type, text, ids}); log(S, p, major ? 'major' : type, text, ids, !major); };
  const snap = day => Z.days.push({day, allies: Object.fromEntries(active.map(c => [c.id, alliesOf(S, c).map(o => o.id)])), hold: Object.fromEntries(active.map(c => [c.id, c.badges.slice()])), gone: Object.fromEntries(active.filter(c => c.status !== 'Active').map(c => [c.id, c.status]))});
  if(active.length === 1){
    const c = active[0];
    log(S, p, 'major', `Only ${c.name} reached Zevil Island. With no rivals to hunt, the sole candidate advances automatically.`, [c.id]);
    c.notes.push({p, text:'Advanced as the sole remaining candidate'});
    snap(0); return;
  }
  const cyc = rng.shuffle(active.slice());
  cyc.forEach((c, i) => { c.target = cyc[(i+1) % cyc.length].id; Z.targets[c.id] = c.target; });
  log(S, p, 'info', `${active.length} candidates land on Zevil Island. Each draws a secret target number.`);

  // alliances carried onto the island: a member whose target is an ally faces a conflict of interest
  const zl = (t, ids, ty) => zlog(0, ty || 'ally', t, ids);
  for(const c of rng.shuffle(active.slice())){
    const clash = alliesOf(S, c).find(o => o.id === c.target);
    if(clash && isRelative(c, clash)){
      zlog(0, 'family', `Arrival: ${c.name} draws the number of ${kinOf(c, clash)} ${clash.name} — family loyalty against the exam.`, [c.id, clash.id]);
      c.notes.push({p, text:`Drew ${kinOf(c, clash)} ${clash.name} as ${PR(c).their} secret target`});
      continue;
    }
    if(clash && c.a.teamwork < 55 && rng() < 0.6){
      leaveAlliance(S, c, p, `Arrival: ${c.name} leaves the alliance — ally ${clash.name} is ${PR(c).their} secret target.`, 'split', zl);
      c.notes.push({p, text:`Left the alliance: ${clash.name} was ${PR(c).their} target`});
    }
  }
  const allyCount = (S.alliances || []).filter(A => A.members.filter(id => active.some(c => c.id === id && c.status === 'Active')).length >= 2).length;
  if(allyCount) zlog(0, 'ally', `Arrival: ${allyCount} alliance${allyCount === 1 ? '' : 's'} from earlier phases land together.`, []);
  snap(0);

  const take = (from, to, b) => { from.badges.splice(from.badges.indexOf(b), 1); to.badges.push(b); };
  const value = (c, b) => (b === c.id || b === c.target ? 3 : 1);
  // allies still short of 6 — family and bonds first, then whoever is closest
  const zNeedy = c => alliesOf(S, c).filter(o => o.status === 'Active' && active.includes(o) && zevilPoints(S, o) < 6)
    .sort((a, b) => (+(isRelative(c, b) || bonded(c, b)) - +(isRelative(c, a) || bonded(c, a))) || zevilPoints(S, b) - zevilPoints(S, a));
  const zCare = (c, o) => (isRelative(c, o) || bonded(c, o)) ? 0.8 : clamp((c.a.teamwork - 40) / 60, 0, 0.7) * (c.a.strategy > c.a.teamwork + 15 ? 0.35 : 1);
  const zHelpNote = (c, o) => { if(!c.zHelped.includes(o.id)) c.zHelped.push(o.id); c.notes.push({p, text: c.zMode === 'escort' ? `Already safe, stayed at ${o.name}'s side on Zevil Island` : `Already safe, went back out to hunt for ${o.name}'s target`}); };

  for(let day=1; day<=7; day++){
    // allies hand over each other's target badges
    for(const c of active){
      if(c.status !== 'Active') continue;
      const al = alliesOf(S, c).find(o => (c.badges.includes(o.target) || (c.badges.includes(o.id) && o.id !== c.target)) && (isRelative(o, c) || c.a.teamwork >= 45));
      if(!al) continue;
      const tb = c.badges.includes(al.target) ? al.target : al.id;
      take(c, al, tb);
      zlog(day, isRelative(c, al) ? 'family' : 'ally', `Day ${day}: ${c.name} hands ${isRelative(c, al) ? kinOf(c, al) : 'ally'} ${al.name} badge ${bn(tb)} — ${tb === al.id ? `${PR(al).their} own badge, back where it belongs` : PR(al).their + ' target'}, worth 3 points to ${PR(al).them}.`, [c.id, al.id]);
      c.notes.push({p, text:`Day ${day}: gave ${al.name} ${tb === al.id ? PR(al).their + ' own badge back' : PR(al).their + ' target badge'}`}); al.notes.push({p, text:`Day ${day}: received ${tb === al.id ? PR(al).their + ' own badge' : PR(al).their + ' target badge'} from ${c.name}`});
    }
    // safe hunters (6+ points) who turn back to help allies still short
    for(const c of rng.shuffle(active.slice())){
      if(c.status !== 'Active' || zevilPoints(S, c) < 6) continue;
      const N = zNeedy(c);
      if(c.zFor && !N.some(o => o.id === c.zFor)){
        const o = byId[c.zFor];
        if(o.status === 'Active' && zevilPoints(S, o) >= 6 && rng() < 0.6) zlog(day, 'help', `Day ${day}: ${o.name} reaches 6 points. ${c.name} can finally stop ${c.zMode === 'escort' ? 'keeping watch' : 'hunting for ' + PR(o).them}.`, [c.id, o.id]);
        c.zFor = N.length ? N[0].id : null;
        if(!c.zFor) c.zMode = null; else zHelpNote(c, N[0]);
      }
      // a spare badge for an ally who needs it
      for(const o of N){
        if(rng() >= zCare(c, o) * 0.6) continue;
        const gifts = c.badges.filter(b => b !== c.id && zevilPoints(S, c) - value(c, b) >= 6).sort((x, y) => value(o, y) - value(o, x));
        const g = gifts[0]; if(!g) break;
        take(c, o, g);
        const kin = isRelative(c, o), rel = kin ? kinOf(c, o) : 'ally';
        zlog(day, kin ? 'family' : 'help', `Day ${day}: ` + (value(o, g) === 3 ? vpick(S, T_ZGIFT3, c.id + o.id)({c, o, b: bn(g), rel}) : vpick(S, T_ZGIFT, c.id + o.id)({c, o, b: bn(g), rel})), [c.id, o.id], value(o, g) === 3);
        c.notes.push({p, text:`Day ${day}: gave a spare badge to ${o.name}`}); o.notes.push({p, text:`Day ${day}: received badge ${bn(g)} from ${c.name}, who no longer needed it`});
        if(!c.zHelped.includes(o.id)) c.zHelped.push(o.id);
        break;
      }
      const N2 = zNeedy(c);
      if(!N2.length || c.zFor || c.zAsked) continue;
      c.zAsked = true;
      const o = N2[0];
      if(rng() >= zCare(c, o)) continue;
      c.zFor = o.id;
      c.zMode = (c.a.combat + c.a.perception) / 2 + rng.gauss(0, 8) >= c.a.teamwork - 5 ? 'hunt' : 'escort';
      const kin = isRelative(c, o), rel = kin ? kinOf(c, o) : 'ally';
      zlog(day, kin ? 'family' : 'help', `Day ${day}: ` + vpick(S, c.zMode === 'hunt' ? T_ZHUNT : T_ZESCORT, c.id)({c, o, rel, pts: zevilPoints(S, c)}), [c.id, o.id], true);
      zHelpNote(c, o);
    }
    const hunters = rng.shuffle(active.filter(c => c.status === 'Active'));
    for(const h of hunters){
      if(h.status !== 'Active') continue;
      const hPts = zevilPoints(S, h), mate = h.zFor && hPts >= 6 ? byId[h.zFor] : null, zs = h.zSt && h.zSt[day];
      if(zs === 'hide'){ h.fatigue = Math.max(0, h.fatigue - 6); continue; }  // told to lie low and guard: no hunting today
      if(mate && h.zMode === 'escort') continue;                            // stays at the ally's side
      if(hPts >= 6 && !mate && !zs && rng() < h.a.strategy/100 + 0.5) continue; // safe: lie low
      if(rng() > (h.a.perception + h.a.strategy) / 200 * (zs === 'hunt' || zs === 'revenge' ? 0.6 : zs === 'ambush' ? 0.75 : 0.4)) continue;      // found nobody today
      const hAllies = alliesOf(S, h);
      let tgt = zs === 'revenge' ? active.find(o => o !== h && o.status === 'Active' && o.badges.includes(h.id)) || null
        : zs === 'ambush' ? null
        : mate ? active.find(o => o !== h && o !== mate && o.status === 'Active' && !hAllies.includes(o) && (o.badges.includes(mate.target) || o.badges.includes(mate.id)))
        : active.find(o => o !== h && o.status === 'Active' && o.badges.includes(h.target));
      if(!tgt && hAllies.length) tgt = active.find(o => o !== h && o.status === 'Active' && !hAllies.includes(o) && hAllies.some(a => o.badges.includes(a.target))); // hunt for allies' targets too
      const ownFind = h.a.perception/100 + 0.3, infoFind = Math.min(0.3, hAllies.length * 0.12);   // allies share what they have seen
      const roll = rng();
      let prey = (tgt && roll < ownFind + infoFind) ? tgt : null;
      if(mate && !prey) continue;                                            // helpers only chase what the ally needs
      if(prey && roll >= ownFind && hAllies.length){
        const tip = hAllies[0];
        zlog(day, 'help', `Day ${day}: ally ${tip.name} tells ${h.name} where ${PR(h).their} target badge is.`, [tip.id, h.id]);
      }
      if(!prey){
        const cands = active.filter(o => o !== h && o.status === 'Active' && o.badges.length && !hAllies.includes(o));
        if(!cands.length) continue;
        prey = rng.pick(cands);
        if(prey.zSt && prey.zSt[day] === 'hide' && rng() < 0.55) continue;   // well hidden: walked right past
      }
      const foe = (h.grudges || []).map(g => byId[g.id]).find(o => o && o !== h && o.status === 'Active' && active.includes(o) && o.badges.length);
      if(foe && !mate && prey !== foe && rng() < 0.35){ prey = foe; zlog(day, 'rival', `Day ${day}: ` + vpick(S, T_HUNT_RIVAL, h.id)({h, o: foe, why: h.grudges.find(g => g.id === foe.id).why}), [h.id, foe.id]); }
      if(hAllies.includes(prey)){
        // the target badge sits with an ally: loyalty or betrayal, driven by Strategy vs Teamwork
        if(bonded(h, prey)){
          if(rng() < 0.6){ take(prey, h, h.target); zlog(day, 'bond', `Day ${day}: ${prey.name} finds out ${h.name} needs badge ${bn(h.target)} and simply hands it over.`, [prey.id, h.id]); h.notes.push({p, text:`Day ${day}: ${prey.name} gave ${PR(h).them} the target badge`}); }
          continue;
        }
        const kin = isRelative(h, prey);
        const betrayP = clamp(0.12 + (h.a.strategy - h.a.teamwork) / 150, 0.03, 0.55) * (kin ? 0.2 : 1);   // family rarely turns on family
        if(rng() < betrayP && kin){
          zlog(day, 'betray', `Day ${day}: ` + vpick(S, T_BETRAY_KIN, h.id)({h, p: prey, b: bn(h.target), f: familyOf(S, h).name}), [h.id, prey.id], true);
          addGrudge(prey, h, `betrayed ${prey.first} on Zevil Island`); giveNick(S, h, 'viper', `for betraying ${prey.name}`, p);
          h.notes.push({p, text:`Day ${day}: turned on ${kinOf(h, prey)} ${prey.name}`}); prey.notes.push({p, text:`Day ${day}: betrayed by ${kinOf(prey, h)} ${h.name}`});
          const FA = familyOf(S, h); FA.betrayals = (FA.betrayals || 0) + 1; FA.members = FA.members.filter(id => id !== h.id); h.fam = null;
        } else if(kin){
          if(rng() < 0.4) zlog(day, 'family', `Day ${day}: ${h.name} finds ${kinOf(h, prey)} ${prey.name} holding ${PR(h).their} target badge and leaves ${PR(prey).them} alone.`, [h.id, prey.id]);
          continue;
        } else if(rng() < betrayP){
          zlog(day, 'betray', `Day ${day}: ` + vpick(S, T_BETRAY, h.id)({h, p: prey, b: bn(h.target), d: day}), [h.id, prey.id], true);
          addGrudge(prey, h, `betrayed ${prey.first} on Zevil Island`); giveNick(S, h, 'viper', `for betraying ${prey.name}`, p);
          h.notes.push({p, text:`Day ${day}: betrayed ally ${prey.name}`}); prey.notes.push({p, text:`Day ${day}: betrayed by ${h.name}`});
          { const BA = allianceOf(S, h); if(BA) BA.betrayals = (BA.betrayals || 0) + 1; }
          leaveAlliance(S, h, p, `Day ${day}: ${h.name} is out of the alliance after the betrayal.`, 'split', (t, ids, ty) => zlog(day, ty, t, ids));
        } else continue;
      } else if(!prey.badges.includes(h.target) && prey.target !== h.id && h.target !== prey.id && rng() < allianceChance(h, prey, PHASES[p].w, {threat:true}) * (zs === 'ally' ? 1.4 : 0.5)){
        // under threat from everyone else, two hunters decide they are worth more together
        if(formAlliance(S, p, h, prey, 'instead of fighting', rng, (t, ids) => zlog(day, 'ally', `Day ${day}: ${t}`, ids))) continue;
      }
      if(zs === 'ally' && !prey.badges.includes(h.target) && rng() < 0.5) continue;   // out looking for friends, not for a fight
      // negotiation: offer a spare badge for the target badge
      if(prey.badges.includes(h.target) && rng() < h.a.charisma/100 * 0.8){
        const spare = h.badges.find(b => b !== h.id && b !== h.target);
        if(spare){
          const fair = value(prey, spare) >= value(prey, h.target);
          if(fair && rng() < 0.5 + prey.a.charisma/200){
            take(h, prey, spare); take(prey, h, h.target);
            zlog(day, 'trade', `Day ${day}: ${h.name} trades badge ${bn(spare)} to ${prey.name} for badge ${bn(h.target)} — no fight needed.`, [h.id, prey.id]);
            h.notes.push({p, text:`Day ${day}: traded with ${prey.name} for the target badge`}); prey.notes.push({p, text:`Day ${day}: traded a badge with ${h.name}`});
            continue;
          }
          zlog(day, 'trade', `Day ${day}: ${prey.name} refuses ${h.name}'s trade offer.`, [prey.id, h.id]);
        }
      }
      const warned = (alliesOf(S, prey).length ? 0.1 : 0) + (prey.zSt && prey.zSt[day] === 'hide' ? 0.15 : 0);   // allies warn each other; the hidden see hunters coming
      if(rng() < ((prey.a.strategy*0.5 + prey.a.speed*0.5)/100 * 0.3 + warned) * (THEME === 'blood' ? 0.5 : 1)){
        zlog(day, 'duel', `Day ${day}: ` + vpick(S, T_ESCAPE, prey.id + day)({p: prey, h}), [prey.id, h.id]);
        continue;
      }
      let hp = zevilPower(h, rng) + (zs === 'ambush' ? 4 : 0), dp = zevilPower(prey, rng) + 3 + (prey.zSt && prey.zSt[day] === 'hide' ? 5 : 0);
      const squad = hAllies.slice(0, 2);                                                   // allies move together: ambush in 2–3
      const partner = squad[0] || null;
      hp += squad.length * 6;
      const pAllies = alliesOf(S, prey).filter(o => o !== h);
      const guard = pAllies.find(o => o.zMode === 'escort' && o.zFor === prey.id && o.status === 'Active');
      if(guard) pAllies.splice(pAllies.indexOf(guard), 1), pAllies.unshift(guard);
      const helper = pAllies[0] || null;                                                    // allies always defend each other
      if(helper) dp += Math.min(12, 8 + 4 * (pAllies.length - 1)) + (guard ? 6 : 0);
      h.zFights++; prey.zFights++;
      const [win, lose] = hp >= dp ? [h, prey] : [prey, h];
      if(fatalRoll(S, rng, win, lose)){
        // the killer takes everything the victim carried
        const loot = lose.badges.splice(0);
        win.badges.push(...loot);
        const ze = {day, type:'death', text:`Fatal Duel: ${win.name} killed ${lose.name}${loot.length ? ` and took ${loot.length} badge${loot.length>1?'s':''}` : ''}`, ids:[win.id, lose.id]};
        Z.ev.push(ze);
        const caught = killOutsideFinal(S, p, rng, win, lose, `on day ${day} of Zevil Island`);
        if(caught){
          const conf = win.badges.splice(0); // confiscated: removed from play
          ze.text += `. Caught and disqualified${conf.length ? `, the badge${conf.length>1?'s':''} confiscated` : ''}.`;
        } else ze.text += '. Nobody saw it.';
        continue;
      }
      if(!lose.badges.length){ zlog(day, 'duel', `Day ${day}: ${win.name} beat ${lose.name}, who had no badges left.`, [win.id, lose.id]); continue; }
      const winAllyT = alliesOf(S, win).flatMap(o => [o.target, o.id]).find(t => lose.badges.includes(t) && t !== win.target);
      const pickB = lose.badges.includes(win.target) ? win.target : winAllyT || (lose.badges.find(b => b !== lose.id) || lose.id);
      take(lose, win, pickB);
      const how = win === h ? vpick(S, h.a.strategy > h.a.combat ? HOW_TRAP : HOW_FORCE, h.id + day) : vpick(S, HOW_COUNTER, prey.id + day);
      const score = hasGrudge(win, lose) ? vpick(S, T_SCORE, win.id) : '';
      if(pickB === lose.id || nhash(lose.id + win.id) % 10 < 3) addGrudge(lose, win, pickB === lose.id ? `took ${lose.first}'s own badge on Zevil Island` : `robbed ${lose.first} on Zevil Island`);
      const byTarget = pickB === win.target;
      const lostOwn = pickB === lose.id;
      const famHelp = helper && win === prey && isRelative(helper, prey);
      if(famHelp) zlog(day, 'family', `Day ${day}: ${helper.name} protects ${kinOf(helper, prey)} ${prey.name} from ${h.name}.`, [helper.id, prey.id, h.id]);
      const help = guard && win === prey ? ` with ${guard.name} standing guard` : helper && win === prey ? ` with help from ${pAllies.map(o => o.name).join(' and ')}` : partner && win === h ? ` in a coordinated ambush with ${squad.map(o => o.name).join(' and ')}` : '';
      win.notes.push({p, text:`Day ${day}: took badge ${bn(pickB)} from ${lose.name}${byTarget ? ' (target)' : ''}`});
      lose.notes.push({p, text:`Day ${day}: lost badge ${bn(pickB)} to ${win.name}${lostOwn ? ' (own badge)' : ''}`});
      if(lose.zFor && lose.zMode && !lose.zFell && zevilPoints(S, lose) < 6 && zevilPoints(S, lose) + value(lose, pickB) >= 6){
        const o = byId[lose.zFor]; lose.zFell = o.id;
        lose.notes.push({p, text:`Day ${day}: dropped below 6 points while helping ${o.name}`});
        zlog(day, 'help', `Day ${day}: Helping ${o.name} costs ${lose.name}: down to ${zevilPoints(S, lose)} points, ${PR(lose).they} ${PR(lose).are} no longer safe.`, [lose.id, o.id]);
      }
      zlog(day, 'duel', `Day ${day}: ${win.name} ${how} ${lose.name}${help} and took badge ${bn(pickB)}${score}${byTarget ? ' — the target badge (+3)' : pickB === winAllyT ? ' — an ally\'s target, to hand over' : lostOwn ? ` — ${lose.first}'s own badge (−3 for ${PR(lose).them})` : ''}.`, [win.id, lose.id].concat(helper && win === prey ? [helper.id] : partner && win === h ? [partner.id] : []), byTarget);
    }
    snap(day);
  }
  let best = null;
  for(const c of active){
    if(c.status !== 'Active'){ c.points = 0; continue; }
    c.points = zevilPoints(S, c);
    c.scores.zevil = c.points;
    if(!best || c.points > best.points) best = c;
    if(c.points >= 6) c.notes.push({p, text:`Finished with ${c.badges.length} badges, ${c.points} points`});
    else {
      eliminate(S, c, p, `Zevil Island: finished with ${c.points} points (6 required)${c.badges.length === 0 ? ', all badges stolen' : ''}${c.zFell ? ` after risking {their} place to help ${byId[c.zFell].name}` : ''}`);
      const own = active.find(o => o !== c && (o.badges || []).includes(c.id)), tg = c.target && byId[c.target], tgh = tg && active.find(o => (o.badges || []).includes(tg.id));
      const zs = c.zFell ? `{F} spent the last day getting ${byId[c.zFell].name} off the island, and missed {their} own boat with ${c.points} of 6 points.`
        : c.badges.length === 0 ? fallPick(S, [`{F} met the boat with empty hands. Every badge {they} had carried was in someone else's pocket.`, `By the seventh morning {F} had nothing left to show the examiners.`], c.id + p)
        : own ? fallPick(S, [`${own.name} still had {F}'s own badge when the boat came. {F} finished on ${c.points} of 6.`, `{F} spent the week hunting the badge ${own.name} had taken from {them}, and finished on ${c.points}.`], c.id + p)
        : tgh && tgh !== c ? fallPick(S, [`{F} never got close to ${tgh.name}, who held the target badge. ${c.points} of 6 points.`, `The target badge stayed with ${tgh.name} all week. {F} finished on ${c.points}.`], c.id + p)
        : `{F} finished the week on ${c.points} of 6 points.`;
      setFall(S, c, p, zs, {});
    }
  }
  // what the island leaves between helper and helped
  for(const c of active){
    for(const id of c.zHelped || []){
      const o = byId[id];
      if(o.status !== 'Active' || o.points < 6) continue;
      o.notes.push({p, text:`Left Zevil Island with 6+ points, helped by ${c.name}`});
      if(c.status === 'Eliminated' && c.zFell === o.id){
        log(S, p, 'story', vpick(S, T_ZSACRIFICE, c.id)({c, o}), [c.id, o.id], true);
        if(!bonded(c, o)) makeBond(S, p, c, o, isRelative(c, o));
      } else if(c.status === 'Active' && !bonded(c, o) && rng() < 0.3){
        makeBond(S, p, c, o, isRelative(c, o));
        log(S, p, 'bond', vpick(S, T_ZBOND, c.id + o.id)({c, o}), [c.id, o.id], true);
      }
    }
    if(c.status === 'Active' && (c.zHelped || []).some(id => byId[id].status === 'Active' && byId[id].points >= 6))
      giveNick(S, c, 'guardian', `for going back into the jungle for an ally on Zevil Island`, p, 0.3, vpick(S, ['the Shepherd', 'Guardian Angel', 'the Escort', 'Lifeline', 'the Lighthouse'], c.id + 'gd'));
  }
  // the Jubilee final seats at most 100: the weakest of those on 6+ points wait for another year
  if(S.special === 'jubilee'){
    const safe = active.filter(c => c.status === 'Active').sort((x, y) => (y.points - x.points) || (y.badges.length - x.badges.length) || (zevilPower(y, rng) - zevilPower(x, rng)));
    if(safe.length > 100){
      const cut = safe.slice(100);
      cut.forEach(c => eliminate(S, c, p, `Zevil Island: finished with ${c.points} points, but the Jubilee final only seats 100`));
      Z.ev.push({day: 7, type: 'elim', text: `${safe.length} candidates leave the island with 6 points or more, but the Jubilee final has only 100 places. The ${cut.length} lowest scorers go home.`, ids: []});
      log(S, p, 'major', `The Jubilee final has 100 places. ${cut.length} candidates who reached 6 points on Zevil Island are sent home anyway.`, []);
    }
  }
  const outN = active.filter(c => c.status === 'Eliminated' && c.out === p).length;
  if(outN) Z.ev.push({day: 7, type: 'elim', text: `Time is up. ${outN} candidate${outN === 1 ? '' : 's'} leave${outN === 1 ? 's' : ''} the island under 6 points and ${outN === 1 ? 'is' : 'are'} eliminated.`, ids:[]});
  if(best){ log(S, p, 'major', `Top badge haul: ${best.name} with ${best.badges.length} badges (${best.points} points).`, [best.id]); if(best.badges.length >= 4) giveNick(S, best, 'magpie', `for the biggest badge haul on Zevil Island`, p); }
}

const MOVES = {
  strength:['lands a heavy blow on','slams','drives a crushing punch into'],
  agility:['darts in with a flurry against','slips past and strikes','spins and kicks'],
  strategy:['feints and counters','baits an opening and hits','reads the attack and punishes'],
  combat:['lands a clean combination on','sweeps and strikes','catches with a precise strike'],
  determination:['grits through a hit and answers','refuses to back down and hammers','pushes forward into']
};
// a stance chosen before a bout: some read an opponent's style well, some badly; the numbers are never shown
const F_STANCE = {allout: {strength: -4, agility: -3, strategy: 6, combat: 1, determination: 2}, read: {strength: 3, agility: 6, strategy: -3, combat: 1, determination: 2},
  wear: {strength: 1, agility: 3, strategy: 1, combat: 5, determination: -4}, careful: {strength: 5, agility: 0, strategy: 1, combat: -3, determination: 0}};
function fight(S, A, B, p, rng){
  const pw = c => weighted(c, PHASE_DEFS.final.w) - injPen(c) * 0.6;
  const style = c => ['strength','agility','strategy','combat','determination'].sort((x,y) => c.a[y]-c.a[x])[0];
  let ha = 100, hb = 100, rounds = 0;
  const stA = A.fNow || null, stB = B.fNow || null; A.fNow = B.fNow = null;
  // a tactical surrender: no blows, nothing lost but the bout
  if(stA === 'concede' || stB === 'concede'){
    const l = stA === 'concede' ? A : B, w = l === A ? B : A;
    if(w.wins !== undefined) w.wins++; if(l.losses !== undefined) l.losses++;
    return {w, l, how: 'surrender', rounds: 0, tactical: true, ex: [{by: 'x', text: `${l.first} raises a hand before the first exchange: a tactical surrender.`, ha: 100, hb: 100}]};
  }
  const stMod = (st, opp, r) => !st || !F_STANCE[st] ? 0 : F_STANCE[st][style(opp)] + (st === 'allout' ? (r <= 4 ? 6 : -4) : st === 'read' ? (r <= 2 ? -2 : 0) : st === 'wear' ? (r <= 4 ? -2 : 4) : 0);
  const dealt = st => st === 'allout' ? 1.2 : st === 'careful' ? 0.85 : 1, taken = st => st === 'allout' ? 1.15 : st === 'careful' ? 0.8 : 1;
  const quitAt = c => 40 - c.a.determination * 0.4 + ((c === A ? stA : stB) === 'careful' ? 8 : 0); // high determination never surrenders
  const ex = [];
  let result = null;
  while(rounds < 12){
    rounds++;
    const ra = pw(A) + rng.gauss(0, 12) - A.fatigue*0.15 + stMod(stA, B, rounds), rb = pw(B) + rng.gauss(0, 12) - B.fatigue*0.15 + stMod(stB, A, rounds);
    const [att, def] = ra >= rb ? [A, B] : [B, A];
    const dmg = Math.round((6 + att.a.strength/10 + rng()*6) * dealt(att === A ? stA : stB) * taken(att === A ? stB : stA));
    if(att === A) hb -= dmg; else ha -= dmg;
    ex.push({by: att === A ? 'a' : 'b', dmg, ha: Math.max(0, Math.round(ha)), hb: Math.max(0, Math.round(hb)), text: `${att.first} ${rng.pick(MOVES[style(att)])} ${def.first}.`});
    const ko = hb <= 0 ? [A, B] : ha <= 0 ? [B, A] : null;
    if(ko){
      result = {w:ko[0], l:ko[1], how:'knockout'};
      ex.push({by:'x', text:`${ko[1].first} is down. The examiner stops the match.`, ha:Math.max(0,Math.round(ha)), hb:Math.max(0,Math.round(hb))});
      break;
    }
    if(hb < quitAt(B)){ result = {w:A, l:B, how:'surrender'}; ex.push({by:'x', text:`${B.first} raises a hand and surrenders.`, ha:Math.round(ha), hb:Math.round(hb)}); break; }
    if(ha < quitAt(A)){ result = {w:B, l:A, how:'surrender'}; ex.push({by:'x', text:`${A.first} raises a hand and surrenders.`, ha:Math.round(ha), hb:Math.round(hb)}); break; }
  }
  if(!result){
    result = ha >= hb ? {w:A, l:B, how:'judges\' decision'} : {w:B, l:A, how:'judges\' decision'};
    ex.push({by:'x', text:`Time. The judges award the match to ${result.w.first}.`, ha:Math.round(ha), hb:Math.round(hb)});
  }
  result.rounds = rounds; result.ex = ex;
  if(result.w.wins !== undefined) result.w.wins++;
  if(result.l.losses !== undefined) result.l.losses++;
  return result;
}

function makeProctor(rng){
  const a = {}; ATTRS.forEach(([k]) => a[k] = clamp(Math.round(rng.gauss(52, 6)), 1, 100));
  const nm = rng.pick(['Examiner Lippo','Examiner Satotz','Examiner Buhara','Examiner Menchi','Examiner Kurt','Examiner Ilma']);
  return {id:'examiner', name:nm, first:nm.split(' ')[1], a, fatigue:0, reg:'—'};
}

// Performance Score 0–100 from every earlier phase
function perfScore(c){
  const parts = [];
  PHASES.forEach(ph => {
    const v = c.scores[ph.id];
    if(typeof v !== 'number' || ph.final) return;
    if(ph.prisoner) parts.push(30 + v*30);
    else if(ph.zevil) parts.push(clamp(40 + (v-6)*10, 0, 100));
    else if(ph.T) parts.push(clamp(50 + (v - ph.T)*2.5, 0, 100));
  });
  return parts.length ? Math.round(parts.reduce((s,x) => s+x, 0) / parts.length) : 50;
}

function finalKill(S, p, killer, victim, where){
  victim.status = 'Deceased'; victim.out = p; victim.reason = `Final Tournament: killed by ${killer.name} in ${where}`;
  victim.killedBy = killer.id; killer.kills = (killer.kills || 0) + 1;
  victim.notes.push({p, text:`Killed by ${killer.name} in ${where}`});
  killer.status = 'Disqualified'; killer.out = p; killer.reason = `Final Tournament: killed ${victim.name} in ${where} — automatic disqualification`;
  killer.notes.push({p, text:`Killed ${victim.name} in ${where} — automatically disqualified`});
  log(S, p, 'death', `Fatal Duel: ${killer.name} killed ${victim.name} in ${where} and was disqualified on the spot.`, [killer.id, victim.id]);
  lastWords(S, p, victim, killer);
}
function runFinal(S, ph, p, rng, active){
  const L = S.config.licenses;   // up to 12 licenses, one per sign of the zodiac
  const byId = Object.fromEntries(S.candidates.map(c => [c.id, c]));
  let pool = active.slice();
  pool.forEach(c => { c.fatigue *= 0.5; c.perf = perfScore(c); c.status = 'Finalist'; c.fBout = 0; c.fNow = null; });
  pool.forEach(c => { if(c.secret && !c.secret.revealed && rng() < 0.5 && c.secret.k !== 'undercover' && c.secret.k !== 'spy') revealSecret(S, c, p, rng); });
  const B = S.bracket = {prelim:[], rounds:[], solo:null, seeds:[], eliminated:null, order:[]};
  let seq = 0;
  const rec = (m, r) => { m.a = m.A ? m.A.id : null; m.b = m.B ? m.B.id : null; if(r){ m.w = r.w.id; m.l = r.l.id; m.how = r.how; m.ex = r.ex; m.dq = r.dq ? r.dq.id : null; } m.seq = seq++; delete m.A; delete m.B; B.order.push(m.id); return m; };
  log(S, p, 'phase', `${pool.length} finalist${pool.length===1?'':'s'} reach the Final Tournament. Reverse elimination: win once and you pass; lose and you fight again. Killing an opponent means disqualification.`);

  // preliminary round: lowest performers fight, losers are out
  const G = S.config.groups || 1, cap = G > 1 ? G * (Math.floor(L / G) + 1) : L + 1;
  let pr = 1;
  while(pool.length > cap){
    const m = Math.min(pool.length - cap, Math.floor(pool.length / 2));
    const low = pool.slice().sort((x,y) => x.perf - y.perf).slice(0, 2*m);
    rng.shuffle(low);
    for(let i=0; i<m; i++){
      const A = low[2*i], Bc = low[2*i+1];
      MATCH_TAG = `P${pr}-${i+1}`;
      const r = finalFight(S, A, Bc, p, rng, {prelim: true});
      const loser = r.l, winner = r.w;
      const mm = {id:`P${pr}-${i+1}`, round:pr, A, B:Bc};
      if(!r.nokill && fatalRoll(S, rng, winner, loser)){
        finalKill(S, p, winner, loser, 'the preliminary round');
        r.dq = winner; mm.fatal = true;
      } else {
        loser.status = 'Eliminated'; loser.out = p; loser.reason = `Final Tournament: lost the preliminary round to ${winner.name} by ${r.how}`; setFall(S, loser, p, `{F} went down to ${winner.name} by ${r.how} in the preliminary bout. No second chance.`, {});
        winner.notes.push({p, text:`Preliminary round: beat ${loser.name} by ${r.how}`});
        log(S, p, 'fight', `Preliminary: ${boutLine(winner, loser, r.how, 'p')}.`, [winner.id, loser.id]);
        if(r.after) dlog(S, p, 'story', r.after, [winner.id, loser.id], 4);
        if(r.exLine) dlog(S, p, 'examiner', r.exLine, [winner.id, loser.id], 2);
      }
      B.prelim.push(rec(mm, r));
      MATCH_TAG = null;
    }
    pool = pool.filter(c => c.status === 'Finalist');
    pr++;
  }

  const bracket = (pool, T, pfx) => {
  const n = pool.length;  // one bracket: T holds its rounds, ids carry the bracket's letter
  if(n === 1){
    const c = pool[0], pc = makeProctor(rng);
    MATCH_TAG = 'EX';
    const r = fight(S, c, pc, p, rng);
    T.solo = rec({id:pfx + 'EX', A:c, B:pc, examiner: pc.name}, r);
    if(r.w === c){ c.status = 'Approved'; c.reason = `Sole finalist; defeated ${pc.name} by ${r.how}`; log(S, p, 'major', `${c.name} defeats ${pc.name} by ${r.how} and earns a Hunter License.`, [c.id]); }
    else { c.status = 'Eliminated'; c.out = p; c.reason = `Final Tournament: sole finalist, lost to ${pc.name} by ${r.how}`; log(S, p, 'elim', `${c.name} loses to ${pc.name}. No license this year.`, [c.id]); }
  } else if(n >= 2){
    // seeding: sort by performance, shuffle within tiers
    const sorted = pool.slice().sort((x,y) => y.perf - x.perf);
    const tier = Math.max(2, Math.ceil(n / 4)), seeds = [];
    for(let i=0; i<n; i += tier) seeds.push(...rng.shuffle(sorted.slice(i, i + tier)));
    T.seeds = seeds.map(c => c.id);
    const size = 2 ** Math.ceil(Math.log2(n)), byes = size - n, R = Math.log2(size);
    // weakest seeds get byes (fewer chances); the rest are paired in round 1
    const byePlayers = seeds.slice(n - byes), fighters = seeds.slice(0, n - byes);
    const pairs = byePlayers.map(c => [c, null]);
    for(let i=0; i<fighters.length; i += 2) pairs.push([fighters[i], fighters[i+1]]);
    rng.shuffle(pairs);
    // carry: entrants for each slot of the next round
    let entrants = pairs.map(x => x);
    for(let r=0; r<R; r++){
      const isRoot = r === R - 1;
      const round = [];
      const next = [];
      entrants.forEach((pair, j) => {
        const [A, Bc] = pair;
        const m = {id:`${pfx}R${r+1}-${j+1}`, round:r+1, A, B:Bc, root:isRoot};
        MATCH_TAG = m.id;
        let moving = null;
        if(A && Bc){
          const res = finalFight(S, A, Bc, p, rng, {round: r + 1, root: isRoot});
          const winner = res.w;
          if(!res.nokill && fatalRoll(S, rng, winner, res.l)){
            // strict no-killing rule: killer disqualified, victim removed; nobody advances from this match
            finalKill(S, p, winner, res.l, `round ${r+1}`);
            res.dq = winner; m.fatal = true;
            round.push(rec(m, res));
            if(isRoot) T.eliminated = null;
            next.push(null);
            return;
          }
          moving = res.l;
          winner.status = 'Approved'; winner.reason = `Won ${isRoot ? 'the final match' : 'round ' + (r+1)} against ${res.l.name} by ${res.how}`;
          winner.notes.push({p, text:`Round ${r+1}: beat ${res.l.name} by ${res.how} and passed`});
          if(moving) moving.notes.push({p, text:`Round ${r+1}: lost to ${winner.name} by ${res.how}${isRoot ? '' : ' and moved on to the next round'}`});
          log(S, p, 'fight', vpick(S, T_FINAL_WIN, winner.id)({r: r + 1, w: winner, l: res.l, how: res.how}), [winner.id, res.l.id]);
          if(res.after) dlog(S, p, 'story', res.after, [winner.id, res.l.id], isRoot ? 6 : 4);
          if(res.exLine) dlog(S, p, 'examiner', res.exLine, [winner.id, res.l.id], 2);
          if(isRoot) addGrudge(res.l, winner, `beat ${res.l.first} in the last match of the Final`);
          round.push(rec(m, res));
        } else {
          const solo = A || Bc;
          m.bye = true;
          if(solo && isRoot){
            // lone entrant at the last match (only after a disqualification): must beat an examiner
            const pc = makeProctor(rng);
            const res = fight(S, solo, pc, p, rng);
            m.examiner = pc.name; m.B = pc; m.bye = false;
            if(res.w === solo){ solo.status = 'Approved'; solo.reason = `Last entrant; defeated ${pc.name} by ${res.how}`; }
            else moving = solo;
            round.push(rec(m, res));
          } else {
            if(solo) solo.notes.push({p, text:`Round ${r+1}: bye — waits for the next round`});
            moving = solo;
            round.push(rec(m, null));
          }
        }
        if(isRoot && moving){
          moving.status = 'Eliminated'; moving.out = p;
          moving.reason = `Final Tournament: lost the last match of the bracket and was the only finalist left without a win`;
          setFall(S, moving, p, '{F} lost every bout {they} fought in the final. Of all the finalists, {they} {are} the one who leaves without a license.', {});
          T.eliminated = moving.id;
          log(S, p, 'elim', `${moving.name} loses the last match and is the one finalist who does not pass.`, [moving.id]);
          giveNick(S, moving, 'almost', 'for losing the very last match', p);
        }
        next.push(moving);
        MATCH_TAG = null;
      });
      T.rounds.push(round);
      const pairsNext = [];
      for(let j=0; j<next.length; j += 2) pairsNext.push([next[j] || null, next[j+1] || null]);
      entrants = pairsNext;
    }
  }
  };
  if(G > 1 && pool.length > G){
    // the Jubilee: four brackets side by side, one finalist falls in each
    const sorted = pool.slice().sort((x, y) => y.perf - x.perf), groups = Array.from({length: G}, () => []);
    sorted.forEach((c, i) => { const row = Math.floor(i / G), col = row % 2 ? G - 1 - (i % G) : i % G; groups[col].push(c); });
    B.groups = [];
    groups.forEach((g, i) => { const T = {name: 'Bracket ' + 'ABCD'[i], rounds: [], solo: null, seeds: [], eliminated: null, ids: g.map(c => c.id)}; log(S, p, 'info', `${T.name}: ${g.length} finalists.`); bracket(g, T, 'ABCD'[i] + '·'); B.groups.push(T); });
  } else bracket(pool, B, '');
  MATCH_TAG = null;
  S.candidates.forEach(c => { if(c.status === 'Finalist'){ c.status = 'Approved'; c.reason = c.reason || 'Passed the final tournament'; } });
  awakenHunters(S, p);
  licenseNicks(S, p);
  if(S.special === 'centenary') starCup(S, p, rng);
  const ap = S.candidates.filter(c => c.status === 'Approved').length;
  log(S, p, 'phase', `The ${S.special === 'jubilee' ? 'Jubilee exam' : S.special === 'centenary' ? 'centenary exam' : ordinal(S.edition) + ' Hunter Exam'} ends with ${ap} new Hunter${ap===1?'':'s'}.`);
}

// the Centennial Star: the four best new Hunters fight for a star, not for survival; the best may get a bye
function starCup(S, p, rng){
  const ap = S.candidates.filter(c => c.status === 'Approved').sort((x, y) => (y.perf || 0) - (x.perf || 0)).slice(0, 4);
  if(ap.length < 2){ if(ap.length === 1){ ap[0].starCup = 'champion'; S.starCup = {matches: [], champ: ap[0].id, solo: true}; log(S, p, 'major', `${ap[0].name} is the only new Hunter of the centenary and receives the Centennial Star unopposed.`, [ap[0].id]); } return; }
  const C = S.starCup = {matches: [], champ: null, seeds: ap.map(c => c.id)};
  const bout = (A, Bc, round) => { const r = fight(S, A, Bc, p, rng); C.matches.push({round, a: A.id, b: Bc.id, w: r.w.id, l: r.l.id, how: r.how, ex: r.ex, tale: boutTale(r, A, Bc, {star: true, round})}); return r; };
  log(S, p, 'major', `For the hundredth exam, the ${ap.length} best new Hunters fight once more — not for a license, but for the Centennial Star.`, ap.map(c => c.id));
  let finA, finB;
  if(ap.length === 4){ const s1 = bout(ap[0], ap[3], 'Semi-final'), s2 = bout(ap[1], ap[2], 'Semi-final'); finA = s1.w; finB = s2.w;
    log(S, p, 'fight', `Centennial Star, semi-finals: ${s1.w.name} beats ${s1.l.name} by ${s1.how}; ${s2.w.name} beats ${s2.l.name} by ${s2.how}.`, [s1.w.id, s1.l.id, s2.w.id, s2.l.id]); }
  else if(ap.length === 3){ const s = bout(ap[1], ap[2], 'Semi-final'); finA = ap[0]; finB = s.w;
    log(S, p, 'fight', `Centennial Star: ${ap[0].name} earns a bye as the best of the exam; ${s.w.name} beats ${s.l.name} by ${s.how} to meet ${PR(ap[0]).them}.`, [ap[0].id, s.w.id, s.l.id]); }
  else { finA = ap[0]; finB = ap[1]; }
  const f = bout(finA, finB, 'Final');
  C.champ = f.w.id; f.w.starCup = 'champion'; f.l.starCup = 'finalist';
  f.w.notes.push({p, text: `Won the Centennial Star, beating ${f.l.name} by ${f.how}`}); f.l.notes.push({p, text: `Lost the Centennial Star final to ${f.w.name}`});
  log(S, p, 'major', `${f.w.name} wins the Centennial Star, beating ${f.l.name} by ${f.how}. ${PR(f.w).They} begin${PR(f.w).s} ${PR(f.w).their} career with a star already on the license.`, [f.w.id, f.l.id]);
}

