/* ===== Relics: thirty-four objects that outlive their owners =====
   Twenty-two come back from the Dark Continent, twelve come out of the ruins of the old world (the Constellation).
   Each has a gift and a price. The gift and the price change numbers the world already rolls every year
   (contracts, deaths, votes, crises...), and the year writes a line whenever one of them shows. */
const RELICS = [
  {id: 'a0', arc: '0', fam: 'dc', nen: 'Transmutation', name: 'the Unlaced Sandal', look: 'A traveller\'s sandal with no laces. It has never worn through.', gift: 'Takes contracts far above rank, and pulls them off more often.', cost: 'Its owners have a way of walking off the map.'},
  {id: 'a1', arc: 'I', fam: 'dc', nen: 'Conjuration', name: 'the Four-Pocket Satchel', look: 'A leather satchel with four pockets: a cup, a blade, a rod and a coin, none of which can be taken out.', gift: 'Every contract goes a little better.', cost: 'Thieves can smell it.'},
  {id: 'a2', arc: 'II', fam: 'dc', nen: 'Specialization', name: 'the Veiled Ledger', look: 'A ledger whose pages fill with names nobody wrote.', gift: 'In an investigation, the evidence finds its owner.', cost: 'Its owner knows too much, and is accused more often.'},
  {id: 'a3', arc: 'III', fam: 'dc', nen: 'Enhancement', name: 'the Orchard Seed', look: 'A seed the size of a fist. Wherever it is kept, things grow.', gift: 'Its owner\'s hometown prospers; the family grows.', cost: 'Its owner stops wanting to leave home.'},
  {id: 'a4', arc: 'IV', fam: 'dc', nen: 'Manipulation', name: 'the Iron Seal', look: 'A seal of black iron. Whatever it is pressed into, people obey.', gift: 'Votes follow it.', cost: 'So do enemies.'},
  {id: 'a5', arc: 'V', fam: 'dc', nen: 'Emission', name: 'the Teaching Bell', look: 'A small bronze bell. Students hear it from three valleys away.', gift: 'Students come, and learn faster.', cost: 'Schools quarrel over who rings it next.'},
  {id: 'a6', arc: 'VI', fam: 'dc', nen: 'Conjuration', name: 'the Twin Rings', look: 'Two rings that are warm when they are apart and cold when they are together.', gift: 'Two people who each wear one tend to find each other.', cost: 'If one of them is already married, they find each other anyway.'},
  {id: 'a7', arc: 'VII', fam: 'dc', nen: 'Manipulation', name: 'the Black-and-White Reins', look: 'Reins of one black strap and one white, for a team of two that is never there.', gift: 'An expedition that carries it loses fewer people.', cost: 'Its owner always goes on the next one.'},
  {id: 'a8', arc: 'VIII', fam: 'dc', nen: 'Enhancement', name: 'the Gentle Muzzle', look: 'A muzzle of soft leather, sized for something much bigger than a lion.', gift: 'Beasts calm down around it.', cost: 'People do not.'},
  {id: 'a9', arc: 'IX', fam: 'dc', nen: 'Emission', name: 'the One-Wick Lantern', look: 'A lantern with one wick that never shortens.', gift: 'Those lost to its owner find their way back.', cost: 'Its light is for one person. Its owners live alone.'},
  {id: 'a10', arc: 'X', fam: 'dc', nen: 'Specialization', name: 'the Turning Coin', look: 'A coin that is still spinning when you look away.', gift: 'Some years, everything goes right.', cost: 'Some years, nothing does.'},
  {id: 'a11', arc: 'XI', fam: 'dc', nen: 'Manipulation', name: 'the Honest Scales', look: 'A pair of brass scales that tilt before anything is put on them.', gift: 'In any case it touches, the verdict tends to be the truth.', cost: 'Including the truth about its owner.'},
  {id: 'a12', arc: 'XII', fam: 'dc', nen: 'Emission', name: 'the Upside-Down Compass', look: 'A compass that points at whatever its owner has not found yet.', gift: 'Its owners find places nobody has named.', cost: 'Sometimes they find no way back.'},
  {id: 'a13', arc: 'XIII', fam: 'dc', nen: 'Specialization', name: 'the Ferryman\'s Coin', look: 'An old coin worn smooth on one side by a thumb that is not human.', gift: 'Its owner walks away, once, from what should have killed them.', cost: 'Someone close pays the fare instead. Then the coin moves on.'},
  {id: 'a14', arc: 'XIV', fam: 'dc', nen: 'Transmutation', name: 'the Two Cups', look: 'Two clay cups. Water poured from one to the other comes out warmer.', gift: 'Wounds close; old grudges cool.', cost: 'Its owner burns less brightly.'},
  {id: 'a15', arc: 'XV', fam: 'dc', nen: 'Manipulation', name: 'the Gilded Chain', look: 'A short gold chain with an open link that will not close.', gift: 'Money and votes.', cost: 'Inquiries.'},
  {id: 'a16', arc: 'XVI', fam: 'dc', nen: 'Enhancement', name: 'the Ever-Warm Stone', look: 'A grey stone that is always warm. It is kept in cold rooms. It is still warm.', gift: 'Aura burns hotter near it; Hatsu grows.', cost: 'Sometimes the place around it catches fire, one way or another.'},
  {id: 'a17', arc: 'XVII', fam: 'dc', nen: 'Conjuration', name: 'the "Do Not" Jar', look: 'A sealed jar of river water. The label says: "Do not."', gift: 'Opened, it ends a plague.', cost: 'Whoever opens it pays.'},
  {id: 'a18', arc: 'XVIII', fam: 'dc', nen: 'Transmutation', name: 'the Moon-Pale Mask', look: 'A white mask that looks like whoever is not wearing it.', gift: 'Its owner slips out of one hunt, or one trial.', cost: 'Copies of everything follow it around.'},
  {id: 'a19', arc: 'XIX', fam: 'dc', nen: 'Emission', name: 'the Child\'s Kite', look: 'A paper kite that flies on still days.', gift: 'Fame finds its owner, and a name.', cost: 'So does envy.'},
  {id: 'a20', arc: 'XX', fam: 'dc', nen: 'Emission', name: 'the Waking Horn', look: 'A horn with no mouthpiece. Some people hear it anyway.', gift: 'Blown once, it calls back the lost, or reopens what was closed.', cost: 'Nobody controls who answers.'},
  {id: 'a21', arc: 'XXI', fam: 'dc', nen: 'Conjuration', name: 'the Ring-Map', look: 'A map drawn on the inside of a ring of bone. It is the whole world, and it is not finished.', gift: 'Expeditions that carry it reach what they set out for.', cost: 'Its owner never rests.'},
  {id: 's1', arc: 'Aries', fam: 'old', nen: 'Enhancement', name: 'the Ram\'s-Horn Gauntlet', look: 'A gauntlet of curled horn, scratched by a thousand first blows.', gift: 'Combat +8; duels go its way.', cost: 'Its owner is challenged twice as often.'},
  {id: 's2', arc: 'Taurus', fam: 'old', nen: 'Enhancement', name: 'the Bronze Herd-Bell', look: 'A heavy bronze bell for the lead animal of a herd that is long gone.', gift: 'Endurance +8; never laid up by injury.', cost: 'It does not know how to retreat.'},
  {id: 's3', arc: 'Gemini', fam: 'old', nen: 'Transmutation', name: 'the Mirror-Twin Locket', look: 'A locket with a mirror on both inner faces.', gift: 'Work in pairs goes better.', cost: 'The closest partner tends to become a rival.'},
  {id: 's4', arc: 'Cancer', fam: 'old', nen: 'Conjuration', name: 'the Crab-Shell Helm', look: 'A helm made from the shell of a crab the size of a cart.', gift: 'When the hometown suffers, its owner pulls it back up.', cost: 'Its owner stays close to home, and earns less.'},
  {id: 's5', arc: 'Leo', fam: 'old', nen: 'Emission', name: 'the Sunmane Banner', look: 'A banner of red-gold cloth that is never quite still.', gift: 'Charisma +10; people vote for it.', cost: 'Its owner reaches too high, too often.'},
  {id: 's6', arc: 'Virgo', fam: 'old', nen: 'Conjuration', name: 'the Harvest Sickle', look: 'A small sickle that has never been sharpened and has never been dull.', gift: 'Food work goes well; it can end a famine.', cost: 'Its owner never thinks the work is good enough.'},
  {id: 's7', arc: 'Libra', fam: 'old', nen: 'Manipulation', name: 'the Envoy\'s Sash', look: 'A grey sash worn by envoys of a kingdom nobody remembers.', gift: 'It can end a war; votes lean towards it.', cost: 'A neutral party is always suspected of something.'},
  {id: 's8', arc: 'Scorpio', fam: 'old', nen: 'Transmutation', name: 'the Sting Hairpin', look: 'A black hairpin with a hooked tip.', gift: 'Hunts end in capture more often.', cost: 'Its owner dies more often too.'},
  {id: 's9', arc: 'Sagittarius', fam: 'old', nen: 'Emission', name: 'the Centaur\'s Bow', look: 'A short bow strung with something that hums.', gift: 'Captures from a distance, without the risk.', cost: 'Its owner never stays long enough to marry.'},
  {id: 's10', arc: 'Capricorn', fam: 'old', nen: 'Enhancement', name: 'the Goat-Fish Anchor', look: 'A small anchor with a goat\'s head on the shank.', gift: 'Stars come sooner.', cost: 'Its owner retires late, and dies in the field after fifty-five.'},
  {id: 's11', arc: 'Aquarius', fam: 'old', nen: 'Specialization', name: 'the Water-Bearer\'s Ewer', look: 'A clay ewer that is never empty and never full.', gift: 'New ideas: Hatsu grows, students come.', cost: 'New ideas split schools.'},
  {id: 's12', arc: 'Pisces', fam: 'old', nen: 'Manipulation', name: 'the Two-Fish Net', look: 'A fishing net woven in two colours that never cross.', gift: 'The sea is kind; some nights it sends a warning dream.', cost: 'Some nights the sea keeps its owner.'}
];
const RDEF = Object.fromEntries(RELICS.map(r => [r.id, r]));
const RSIGNS = RELICS.filter(r => r.fam === 'old').map(r => r.id);
Object.assign(CASE_K, {
  theft: {sev: 2, what: 'stealing a relic', open: ['{n} is accused of stealing {w}. The Association opens a case.']},
  forgery: {sev: 2, what: 'selling a forged relic', open: ['{n} is accused of passing off a forgery of {w} as the real thing.']}
});
let RH = new Map(), REL_ED = 0, REL_LANTERN = new Set();
const relsOf = () => WORLD.relics || (WORLD.relics = {});
function relIndex(){ RH = new Map(); Object.entries(WORLD.relics || {}).forEach(([id, r]) => { if(r.st !== 'held' || r.swap) return; [r.holder, r.holder2].forEach(l => { if(l) (RH.get(l) || RH.set(l, new Set()).get(l)).add(id); }); }); }
// how strongly a Hunter holds a relic: half the first year, all of it after five; more with the matching Nen
function RX(h, id){
  if(!h || !RH.size) return 0; const s = RH.get(h.license); if(!s || !s.has(id)) return 0;
  const r = WORLD.relics[id], y = (REL_ED || S.edition) - (r.since ?? REL_ED);
  return Math.min(1, 0.5 + 0.1 * Math.max(0, y)) * (h.nen && h.nen.category === RDEF[id].nen ? 1.25 : 1);
}
const relConst = h => { const s = h && RH.get(h.license); return s ? RSIGNS.filter(id => s.has(id)).length : 0; };
// the hooks: each one returns a number the world multiplies or adds
const relOk = (h, area) => !RH.has(h.license) ? 0 : 0.10 * RX(h, 'a0') + 0.10 * RX(h, 'a1') + 0.08 * RX(h, 'a16') + (area === 'Beast' ? 0.15 * RX(h, 'a8') : 0) + (area === 'Gourmet' ? 0.15 * RX(h, 's6') : 0) + (area === 'Sea' ? 0.15 * RX(h, 's12') : 0) + (relConst(h) >= 3 ? 0.05 : 0);
const relFail = h => 1 + 0.5 * RX(h, 's6');
const relReach = h => 1 + 2 * RX(h, 'a0') + 2 * RX(h, 's5');
const relMiss = h => 1 + 2 * RX(h, 'a0') + RX(h, 'a12') + 2 * RX(h, 's12');
const relRisk = (h, age) => (1 + 0.3 * RX(h, 's8')) * (age >= 55 ? 1 + 0.3 * RX(h, 's10') : 1);
const relRetire = h => RX(h, 'a21') ? 0 : 1 - 0.5 * RX(h, 's10');
const relNoInj = h => RX(h, 'a14') > 0 || RX(h, 's2') > 0;
const relScandal = h => 1 + RX(h, 'a15') + RX(h, 'a2');
const relNen = h => 1 + RX(h, 'a16') + RX(h, 's11');
const relMissions = h => RX(h, 'a3') ? -1 : 0;
const relReachDie = h => 1 + RX(h, 's2');
const relDuo = h => 1 + 0.5 * RX(h, 's3');
const relVote = h => (1 + 0.8 * RX(h, 'a4')) * (1 + 0.5 * RX(h, 'a15')) * (1 + 0.3 * RX(h, 's5')) * (1 + 0.2 * RX(h, 's7'));
const relRank = h => 1 - 0.2 * RX(h, 's10');
const relMarry = h => (1 - 0.6 * RX(h, 'a9')) * (1 - 0.5 * RX(h, 's9'));
const relKids = (a, b) => 1 + Math.max(RX(a, 'a3'), RX(b, 'a3'));
const relCap = h => 0.15 * RX(h, 's8') + 0.2 * RX(h, 's9');
const relHuntDie = h => 1 + 0.3 * RX(h, 's8');
const relDisc = h => (1 + 4 * RX(h, 'a12')) * (1 + 2 * RX(h, 'a21'));
const relDuel = (a, b) => Math.min(3, (1 + RX(a, 'a8') + RX(a, 's1')) * (1 + RX(b, 'a8') + RX(b, 's1')));
const relFade = (a, b) => 1 + 2 * Math.max(RX(a, 'a14'), RX(b, 'a14'));
const relTeach = h => (1 + RX(h, 'a5')) * (1 + 0.5 * RX(h, 's11'));
const relSchism = h => h ? Math.min(1.8, (1 + RX(h, 'a5')) * (1 + RX(h, 's11'))) : 1;
const relExpLoss = team => { const p = Math.max(0, ...team.map(h => RX(h, 'a7'))); return 1 - 0.5 * Math.min(1, p); };
const relDuelWin = h => 20 * RX(h, 's1');
function relReturnP(h){
  const r = (WORLD.relics || {}).a9, L = r && r.st === 'held' && !r.swap && hLic(r.holder);
  if(!L || !hActive(L) || L === h) return 0.07;
  const linked = L.spouse === h.license || h.spouse === L.license || (L.bonds || []).some(b => b.id === h.cid) || h.master === L.license || L.master === h.license || (h.school && h.school === L.school) || (WORLD.heirs || []).some(k => (k.cid === h.cid && k.parents.includes(L.license)) || (k.cid === L.cid && k.parents.includes(h.license)));
  if(!linked) return 0.07; REL_LANTERN.add(h.license); return 0.07 + 0.13 * RX(L, 'a9');
}
// a death that does not happen: the Ferryman's Coin, a dream from the Two-Fish Net, the Mask in a hunt
function relicSaves(h, ed, add, why){
  if(!h || !RH.has(h.license)) return false;
  const used = (id) => { const r = WORLD.relics[id]; r.used = r.used || {}; if(r.used[h.license]) return true; r.used[h.license] = ed; return false; };
  if(h.dream === ed){ delete h.dream; add(h, 'relic', pro(`${h.name} dreamt of deep water the night before and turned back at the last moment. The others did not. {They} keep{s} the Two-Fish Net under {their} pillow now.`, h), 7); return true; }
  if(why === 'hunt' && RX(h, 'a18') && !used('a18')){ add(h, 'relic', pro(`${h.name} should have died in that ambush. Behind the Moon-Pale Mask, the killer saw somebody else.`, h), 7); return true; }
  if(RX(h, 'a13') && !used('a13')){
    const near = [hLic(h.spouse)].concat((h.bonds || []).map(b => HUNTERS.find(x => x.cid === b.id)), HUNTERS.filter(x => x.master === h.license)).filter(o => o && o.status !== 'Deceased' && o !== h);
    const v = near.length ? pickR(near) : null, pl = pickR(PLACES);
    if(v){ v.status = 'Deceased'; v.diedEd = ed; (v.log = v.log || []).push({ed, k: 'death', text: `${v.name} died in ${PR(v).their} sleep, the same night ${h.name} walked out of ${pl}.`}); }
    add(h, 'relic', pro(`${h.name} walks away from what should have killed {them} in ${pl}.${v ? ` That night, ${v.name} dies in ${PR(v).their} sleep.` : ' That night, a stranger in the next town dies in their sleep.'} In the morning the Ferryman's Coin is gone from {their} pocket.`, h), 10, v || undefined);
    if(v && v.status === 'Deceased') try { mournFor(v, ed, add, h); } catch(e){}
    relLose(WORLD.relics.a13, ed, pickR(PLACES), null);
    return true;
  }
  return false;
}

/* ---------- moving a relic around ---------- */
const RHOW = {found: 'found it', inherited: 'inherited it', gift: 'was given it', stolen: 'stole it', bought: 'bought it', awarded: 'was lent it by the council', recovered: 'recovered it', records: 'held it before the records', taken: 'took it'};
function relNote(r, ed, t){ chNote(r, ed, capS(t)); }
function relSetHolder(r, h, ed, how){
  relDrop(r, ed);
  r.st = 'held'; r.holder = h.license; r.since = ed; delete r.loc; delete r.w; delete r.vaultEd; delete r.sealEd;
  (r.owners = r.owners || []).push({lic: h.license, name: h.name, from: ed, how}); r.n = (r.n || 0) + 1;
  if(r.owners.length > 10) r.owners = r.owners.slice(-10);
  const def = RDEF[r.id], mod = {s1: ['combat', 8], s2: ['endurance', 8], s5: ['charisma', 10]}[r.id];
  if(mod && h.attrs && h.attrs[mod[0]] != null){ const v = Math.min(mod[1], 99 - h.attrs[mod[0]]); h.attrs[mod[0]] += v; r.mod = {lic: h.license, k: mod[0], v}; }
  if(r.id === 'a19' && !h.nick){ const taken = nickTaken(), n = ['Kite', 'Sunny', 'the Bright One', 'Highwind', 'Daylight'].find(x => !taken.has(x)); if(n){ h.nick = n; h.nickWhy = `after ${def.name}`; h.nickEd = ed; } }
  relIndex();
}
// the current owner lets go (the record of who held it stays)
function relDrop(r, ed){
  const o = (r.owners || [])[r.owners ? r.owners.length - 1 : 0]; if(o && o.to == null && r.holder) o.to = ed;
  if(r.mod){ const h = hLic(r.mod.lic); if(h && h.attrs) h.attrs[r.mod.k] = Math.max(1, h.attrs[r.mod.k] - r.mod.v); delete r.mod; }
  r.holder = null; delete r.holder2; delete r.swap; relIndex();
}
function relLose(r, ed, loc, text){ relDrop(r, ed); r.st = 'lost'; r.loc = loc; if(text) relNote(r, ed, text); }
function relVault(r, ed, text){ relDrop(r, ed); r.st = 'vault'; r.vaultEd = ed; if(text) relNote(r, ed, text); }
function relSeal(r, ed, text){ relDrop(r, ed); r.st = 'sealed'; r.sealEd = ed; if(text) relNote(r, ed, text); }
function relOutlaw(r, ed, w, text){ relDrop(r, ed); r.st = 'outlaw'; r.w = w.id; w.relic = r.id; w.danger = Math.min(4, (w.danger || 1) + 1); if(text) relNote(r, ed, text); }
const relItem = (items, t, rank, h) => items.push({lic: h ? h.license : '', name: h ? h.name : '', kind: 'relic', text: capS(t), rank: rank || 6});
function relHeir(h){
  const kids = (WORLD.heirs || []).filter(k => k.parents.includes(h.license)).map(k => HUNTERS.find(x => x.cid === k.cid)).filter(x => x && hActive(x));
  const sp = hLic(h.spouse), studs = HUNTERS.filter(x => x.master === h.license && hActive(x)), bonds = (h.bonds || []).map(b => HUNTERS.find(x => x.cid === b.id)).filter(x => x && hActive(x));
  return kids.length ? [pickR(kids), 'child'] : sp && hActive(sp) ? [sp, 'spouse'] : studs.length ? [pickR(studs), 'student'] : bonds.length ? [pickR(bonds), 'friend'] : [null, null];
}
function relInherit(r, h, ed, add, items, why){
  const D = RDEF[r.id], [o, rel] = relHeir(h);
  if(r.swap){ const f = (WORLD.fakes || []).find(x => x.id === r.swap.fake); if(o && f && Math.random() < 0.3){ relExpose(r, f, ed, add, items, o); return; } }
  if(o){ const sw = r.swap; relSetHolder(r, o, ed, 'inherited'); if(sw){ r.swap = sw; const f = (WORLD.fakes || []).find(x => x.id === sw.fake); if(f) f.holder = o.license; relIndex(); } const t = `${o.name}, ${h.name}'s ${rel}, inherits ${D.name}.`; relNote(r, ed, t); add(o, 'relic', capS(why ? `${why} ${t}` : t), 6, h); return; }
  if(Math.random() < 0.4){ relVault(r, ed, `With nobody to leave it to, ${h.name}'s ${D.name.replace(/^the /, '')} goes to the Association's vault.`); relItem(items, `${D.name} goes into the Association's vault after ${h.name}'s death.`, 5); }
  else { const pl = pickR(PLACES); relLose(r, ed, pl, `${D.name} is not among ${h.name}'s things. The last anyone saw of it was in ${pl}.`); relItem(items, `${D.name} disappears after ${h.name}'s death. The last anyone saw of it was in ${pl}.`, 6); }
}
function relRival(a, b, why){ [[a, b], [b, a]].forEach(([x, y]) => { if(!(x.rivals || []).includes(y.cid)){ (x.rivals = x.rivals || []).push(y.cid); (x.rivalWhy = x.rivalWhy || {})[y.cid] = why; } }); }

/* ---------- where relics come from ---------- */
function relInit(ed, items){
  const R = relsOf(); RELICS.forEach(d => { if(!R[d.id]) R[d.id] = {id: d.id, st: 'hidden'}; });
  if(WORLD.relicInit) return; WORLD.relicInit = ed;
  const vets = chAct().filter(h => hStars(h) >= 1).sort((a, b) => (b.rp || 0) - (a.rp || 0)).slice(0, 40);
  RELICS.slice().sort(() => Math.random() - 0.5).slice(0, 4).forEach(d => { const h = vets.length ? vets.splice(Math.floor(Math.random() * vets.length), 1)[0] : null; const r = R[d.id];
    r.found = {ed, by: h ? h.name : null, how: 'before the records'};
    if(h){ relSetHolder(r, h, ed, 'records'); relNote(r, ed, `${h.name} has carried ${d.name} for as long as anyone can remember.`); }
    else relVault(r, ed, `${d.name} has been in the Association's vault for as long as anyone can remember.`); });
  relIndex();
}
function relFind(id, h, ed, add, items, how, keep){
  const r = WORLD.relics[id], D = RDEF[id]; r.found = r.found || {ed, by: h.name, lic: h.license, how};
  const first = r.st === 'hidden';
  if(keep){ relSetHolder(r, h, ed, first ? 'found' : 'recovered'); }
  else relVault(r, ed);
  const t = first ? `${h.name} ${how}: ${D.name}. ${D.look}${keep ? '' : ' The Association locks it in the vault.'}` : `${h.name} recovers ${D.name}${r.loc ? ` in ${r.loc}` : ''}.${keep ? '' : ' It goes back to the vault.'}`;
  relNote(r, ed, t); add(h, 'relic', t, first ? 9 : 7);
  if(first){ const n = deedNick(h, ['Relic-Hand', 'the Finder', 'Old Things'], `for finding ${D.name}`); if(n) (h.log[h.log.length - 1] || {}).text += n; }
}
// the Dark Continent: a returning expedition may bring an arcanum home (called from worldStart)
function relicFromExped(E, live, ed, add, items){
  const rn = live.find(h => RX(h, 'a7')); if(rn && !E.lost.length) add(rn, 'relic', `Nobody was lost on the Dark Continent this time. ${rn.name} held the Black-and-White Reins the whole way.`, 6);
  if(E.rescue || !live.length) return false;
  const map = live.find(h => RX(h, 'a21')), hidden = RELICS.filter(d => d.fam === 'dc' && relsOf()[d.id] && relsOf()[d.id].st === 'hidden');
  if(!hidden.length || Math.random() >= (map ? 1 : 0.55)) return false;
  const h = map || pickR(live), d = pickR(hidden);
  relFind(d.id, h, ed, add, items, 'brings back from the Dark Continent', Math.random() < 0.5);
  if(map) add(map, 'relic', `The Ring-Map took them exactly where they meant to go.`, 5);
  return true;
}
// a place newly found may hide one of the Constellation (called from maybeDiscover)
function relicFromRuins(h, ed, add, items, place){
  const hidden = RSIGNS.filter(id => relsOf()[id] && relsOf()[id].st === 'hidden'); if(!hidden.length) return false;
  relFind(pickR(hidden), h, ed, add, items || [], place ? `digs it out of ${place}` : 'finds it in ruins nobody had opened', Math.random() < 0.65);
  return true;
}

/* ---------- the year of the relics ---------- */
function relicsStart(ed){
  REL_ED = ed; REL_LANTERN = new Set(); relInit(ed, []); relIndex();
  const n = (WORLD.relics || {}).s12; if(n && n.st === 'held' && !n.swap){ const h = hLic(n.holder); if(h && hActive(h) && Math.random() < 0.05 * Math.max(0.5, RX(h, 's12'))) h.dream = ed; }
}
function relicsYear(prev, ed, add, items){
  const R = relsOf(); if(!WORLD.relicInit) relInit(ed, items);
  const act = chAct();
  // the people holding them: dead, missing, retired, disgraced
  Object.values(R).forEach(r => {
    if(r.st === 'missing'){ const h = hLic(r.holder); if(h && hActive(h)){ r.st = 'held'; relNote(r, ed, `${h.name} comes back, and so does ${RDEF[r.id].name}.`); relIndex(); } else if(!h || h.status === 'Deceased'){ r.st = 'held'; relLose(r, ed, h && h.lostIn ? 'the Dark Continent' : pickR(PLACES), `${RDEF[r.id].name} was lost with ${h ? h.name : 'its owner'}.`); } return; }
    if(r.st !== 'held') return;
    if(r.holder2){ const h2 = hLic(r.holder2); if(!h2 || h2.status === 'Deceased'){ delete r.holder2; relNote(r, ed, `One of the Twin Rings comes back to ${hLic(r.holder) ? hLic(r.holder).name : 'its pair'}.`); relIndex(); } }
    const h = hLic(r.holder); if(!h){ relLose(r, ed, pickR(PLACES)); return; }
    if(h.status === 'Deceased') relInherit(r, h, ed, add, items);
    else if(h.status === 'Missing'){ r.st = 'missing'; relNote(r, ed, `${RDEF[r.id].name} goes missing with ${h.name}.`); relIndex(); }
    else if(h.revoked === ed){ relVault(r, ed, `The council confiscates ${RDEF[r.id].name} along with ${h.name}'s license.`); add(h, 'relic', `The council confiscates ${RDEF[r.id].name} along with the license.`, 6); }
    else if(h.status === 'Retired' && Math.random() < 0.2){ const [o, rel] = relHeir(h); if(o){ relSetHolder(r, o, ed, 'gift'); const t = `${h.name}, retired now, gives ${RDEF[r.id].name} to ${PR(h).their} ${rel}, ${o.name}.`; relNote(r, ed, t); add(o, 'relic', t, 5, h); } else relVault(r, ed, `${h.name} hands ${RDEF[r.id].name} to the Association before retiring.`); }
  });
  relIndex();
  // what the year does with each relic in someone's hands
  const own = id => { const r = R[id]; return r && r.st === 'held' && !r.swap ? hLic(r.holder) : null; };
  const live = id => { const h = own(id); return h && hActive(h) ? h : null; };
  let h;
  // rp: the Coin turns, the Chain gilds, the Cups and the Helm temper
  act.forEach(x => { if(!RH.has(x.license)) return; const base = (x.rpH || []).slice(-1)[0], gain = (x.rp || 0) - (base ?? x.rp); if(!(gain > 0)) return;
    let m = (1 + 0.15 * RX(x, 'a15')) * (1 + 0.1 * RX(x, 'a19')) * (1 - 0.15 * RX(x, 'a14')) * (1 - 0.2 * RX(x, 's4'));
    if(RX(x, 'a10')){ const up = Math.random() < 0.5, k = RX(x, 'a10') * Math.random(); m *= up ? 1 + k : 1 - 0.5 * k; if(k > 0.6) add(x, 'relic', up ? `The Turning Coin lands right for ${x.name} all year. Every door opens.` : `The Turning Coin lands wrong for ${x.name} all year. Nothing ${PR(x).they} touch${PR(x).es} works.`, 4); }
    x.rp = Math.max(0, Math.round((x.rp || 0) + gain * (m - 1))); });
  if((h = live('a1')) && Math.random() < 0.04) relSteal(R.a1, h, ed, add, items, 'The Four-Pocket Satchel is gone from');
  if((h = live('a4')) && Math.random() < 0.05){ const o = pickR(act.filter(x => x !== h && hStars(x) >= 1 && !(h.rivals || []).includes(x.cid))); if(o){ relRival(h, o, 'the Iron Seal'); add(h, 'relic', `${o.name} refuses to bow to the Iron Seal, and says so in front of everyone. ${h.name} will not forget it.`, 5, o); } }
  if((h = live('s3')) && Math.random() < 0.05){ const top = Object.entries(h.ties || {}).sort((a, b) => b[1] - a[1]).map(([l]) => hLic(l)).find(o => o && hActive(o) && !(h.rivals || []).includes(o.cid)); if(top){ relRival(h, top, 'the Mirror-Twin Locket'); add(h, 'relic', `${h.name} and ${top.name} have worked side by side for years. This year they look in the Mirror-Twin Locket and see rivals.`, 5, top); } }
  if((h = live('a3')) && Math.random() < 0.1){ const pl = homeOf(h), p = plState(pl); if(!p || p.st === 'peace'){ const t = `Orchards bloom out of season in ${pl}, where ${h.name} keeps the Orchard Seed. The town is booming.`; setPlace(pl, 'boom', ed, capS(t)); add(h, 'relic', capS(t), 5); } }
  if((h = own('a16')) && !WORLD.crisis && Math.random() < 0.03){ const pl = homeOf(h), k = pickR(Object.keys(CRISES)), len = pickR([1, 2, 2, 3]);
    WORLD.crisis = {k, ed, start: ed, until: ed + len - 1, pl}; const tx = capS(pickR(CRISES[k].start).replace('{pl}', pl)); setPlace(pl, CRISIS_ST[k], ed, tx);
    relItem(items, tx, 10); add(h, 'relic', `People in ${pl} say it started the week ${h.name} brought the Ever-Warm Stone home.`, 7);
    if(Math.random() < 0.3){ relSeal(R.a16, ed, `The council seals the Ever-Warm Stone after ${CRISES[k].name} in ${pl}.`); add(h, 'relic', `The council takes the Ever-Warm Stone from ${h.name} and seals it.`, 6); } }
  const C = WORLD.crisis, ends = (id, k, t) => { const x = live(id), r = R[id]; if(!x || !C || C.k !== k || C.until <= ed || (r.used || {})[x.license] || Math.random() >= 0.5) return null; (r.used = r.used || {})[x.license] = ed; C.until = ed; add(x, 'relic', t(x), 9); return x; };
  const jar = ends('a17', 'plague', x => `${x.name} opens the "Do Not" Jar in ${C.pl}. By morning the Grey Fever is breaking.`);
  if(jar){ if(Math.random() < 0.5){ jar.status = 'Deceased'; jar.diedEd = ed; add(jar, 'death', `${jar.name} dies a week after opening the jar. The label was right.`, 9); mournFor(jar, ed, add); } relSeal(R.a17, ed, 'The empty jar fills itself again overnight. The council seals it.'); }
  ends('a8', 'beasts', x => `${x.name} walks into ${C.pl} with the Gentle Muzzle and comes out leading the thing that started the stampede.`);
  ends('s6', 'famine', x => `${x.name} cuts the first field in ${C.pl} with the Harvest Sickle. It grows back by morning. The famine is over.`);
  ends('s7', 'war', x => `${x.name} crosses the front at ${C.pl} wearing the Envoy's Sash. Both sides sit down to talk.`);
  if((h = live('s7')) && Math.random() < 0.02){ const w = (WORLD.wanted || []).filter(x => x.status === 'wanted'); if(w.length) openCase(h, 'collusion', ed, add, {w: pickR(w).name}); }
  if((h = live('s4')) && Math.random() < 0.3){ const pl = homeOf(h), p = plState(pl); if(p && ['war', 'plague', 'beasts', 'storms', 'famine', 'gangs', 'ruins', 'drought'].includes(p.st) && !(C && (C.pl === pl || C.pl2 === pl))){ const t = `${h.name} goes home to ${pl} wearing the Crab-Shell Helm and does not leave until the town is standing again.`; setPlace(pl, p.st === 'ruins' ? 'rebuilding' : 'peace', ed, capS(t)); h.rp = (h.rp || 0) + 40; add(h, 'relic', capS(t), 6); } }
  // the Twin Rings
  const rg = R.a6; if(rg && rg.st === 'held' && !rg.swap){ const a = hLic(rg.holder), b = hLic(rg.holder2);
    if(a && hActive(a) && !b && Math.random() < 0.15){ const pool = [hLic(a.spouse)].concat((a.bonds || []).map(x => HUNTERS.find(y => y.cid === x.id)), act.filter(x => x !== a && Math.abs(hunterAge(x) - hunterAge(a)) <= 12)).filter(x => x && hActive(x) && x !== a);
      const o = pool[0] && Math.random() < 0.5 ? pool[0] : pickR(pool); if(o){ rg.holder2 = o.license; relIndex(); const t = `${a.name} gives one of the Twin Rings to ${o.name}.`; relNote(rg, ed, t); add(a, 'relic', t, 5, o); } }
    else if(a && b && hActive(a) && hActive(b) && a.spouse !== b.license){
      if(!a.spouse && !b.spouse && hunterAge(a) >= 18 && hunterAge(b) >= 18 && Math.random() < 0.15 * Math.max(RX(a, 'a6'), RX(b, 'a6'))){ a.spouse = b.license; b.spouse = a.license; a.wedEd = b.wedEd = ed; const t = `${a.name} and ${b.name}, each wearing one of the Twin Rings, are married in ${pickR(PLACES)}. The rings are cold for the first time.`; relNote(rg, ed, t); add(a, 'wed', t, 8, b); }
      else if((a.spouse || b.spouse) && Math.random() < 0.05){ relRival(a, b, 'the Twin Rings'); const m = a.spouse ? a : b, sp = hLic(m.spouse); if(sp && sp !== a && sp !== b) relRival(sp, m === a ? b : a, 'the Twin Rings'); add(a, 'relic', `The Twin Rings will not stay cold. ${a.name} and ${b.name} stop pretending; ${sp ? sp.name : 'somebody'} finds out.`, 7, b); } } }
  // the Horn: once per owner
  if((h = live('a20')) && !((R.a20.used || {})[h.license]) && Math.random() < 0.06){ (R.a20.used = R.a20.used || {})[h.license] = ed;
    const capd = (WORLD.wanted || []).filter(w => w.status === 'captured'), miss = HUNTERS.filter(x => x.status === 'Missing' && !x.legacy);
    if((Math.random() < 0.3 || !miss.length) && capd.length){ const w = pickR(capd); w.status = 'wanted'; w.from = ed; add(h, 'relic', `${h.name} blows the Waking Horn. Something answers: ${w.name}${w.nick ? ` ("${w.nick}")` : ''} breaks out of Association custody that night.`, 9); }
    else if(miss.length){ const m = pickR(miss), since = m.missEd ?? m.diedEd, lost0 = m.lostIn; m.status = 'Active Hunter'; delete m.diedEd; delete m.lostIn; delete m.missEd; add(h, 'relic', `${h.name} blows the Waking Horn. Weeks later, ${m.name} walks out of the fog, missing for ${chY(ed - (since ?? ed))}.`, 10, m); afterReturn(m, ed, add, since, lost0); }
    else add(h, 'relic', `${h.name} blows the Waking Horn. Nothing answers. That is worse.`, 5); }
  // the Constellation: three signs make a collector; six make a legend, and every collector wants them
  act.forEach(x => { const n = relConst(x); if(n >= 6 && !x.constLegend){ x.constLegend = ed; if(!x.nick){ x.nick = 'the Constellation'; x.nickWhy = `for holding ${n} of the twelve`; x.nickEd = ed; } add(x, 'relic', `${x.name} now holds ${n} of the twelve signs of the Constellation. The collectors of the world take notice.`, 9); }
    if(n >= 6 && Math.random() < 0.15){ const id = pickR(RSIGNS.filter(i => R[i].holder === x.license)); if(Math.random() < 0.5) relSteal(R[id], x, ed, add, items, `Collectors take ${RDEF[id].name} from`); else add(x, 'relic', `Collectors try for ${x.name}'s Constellation and fail. Two of them are in custody.`, 5); } });
  // thieves
  Object.values(R).forEach(r => { if(r.st !== 'held' || r.id === 'a1') return; const x = hLic(r.holder); if(x && hActive(x) && Math.random() < 0.01) relSteal(r, x, ed, add, items); });
  // relics nobody holds: lost, in the vault, sealed, or in outlaw hands
  Object.values(R).forEach(r => { const D = RDEF[r.id];
    if(r.st === 'lost' && Math.random() < 0.03){ const f = pickR(act.filter(x => /^(Treasure|Lost|Ruins)/.test(x.career || ''))); if(f) relFind(r.id, f, ed, add, items, 'recovers', Math.random() < 0.6); }
    else if(r.st === 'vault'){ if(Math.random() < 0.03){ const o = act.filter(x => !RH.has(x.license) && hStars(x) >= 2).sort((a, b) => (b.rp || 0) - (a.rp || 0))[0]; if(o){ relSetHolder(r, o, ed, 'awarded'); const t = `The council lends ${D.name} from the vault to ${o.name}.`; relNote(r, ed, t); add(o, 'relic', t, 6); } }
      else if(Math.random() < 0.015){ const w = pickR((WORLD.wanted || []).filter(x => x.status === 'wanted' && !x.relic)); if(w){ relOutlaw(r, ed, w, `${D.name} is stolen from the Association's vault.`); relItem(items, `${D.name} is stolen from the Association's vault. The Blacklist says ${w.name}${w.nick ? ` ("${w.nick}")` : ''} has it now.`, 9); } } }
    else if(r.st === 'sealed' && ed - (r.sealEd || ed) >= 30 && Math.random() < 0.02){
      const o = act.filter(x => !RH.has(x.license) && hStars(x) >= 2).sort((a, b) => (b.rp || 0) - (a.rp || 0))[0];
      if(WORLD.crisis && o){ relSetHolder(r, o, ed, 'awarded'); const t = `With ${CRISES[WORLD.crisis.k].name} spreading, the council breaks the seal on ${D.name} and gives it to ${o.name}.`; relNote(r, ed, t); add(o, 'relic', t, 8); }
      else { const pl = pickR(PLACES); relLose(r, ed, pl, `The seal on ${D.name} is found broken. The relic is gone.`); relItem(items, `The seal on ${D.name} is found broken, ${ed - r.sealEd} years after it was set. The relic is gone.`, 8); } }
    else if(r.st === 'outlaw'){ const w = (WORLD.wanted || []).find(x => x.id === r.w);
      if(!w || w.status === 'captured'){ const by = w && w.by && HUNTERS.find(x => x.name === w.by && hActive(x)); if(by){ by.rp = (by.rp || 0) + 40; } if(w) delete w.relic; relVault(r, ed, `${D.name} is recovered${w ? ` when ${w.name} is caught` : ''}${by ? ` by ${by.name}` : ''}, and goes back to the vault.`); if(by) add(by, 'relic', `${by.name} brings back ${D.name} along with ${w.name}.`, 7); } }
  });
  // still to be found: signs in the ruins of the old world, the odd arcanum far from the Dark Continent
  if(Math.random() < 0.04){ const f = pickR(act.filter(x => /^(Treasure|Ruins)/.test(x.career || ''))); if(f) relicFromRuins(f, ed, add, items); }
  if(Math.random() < 0.005){ const hid = RELICS.filter(d => d.fam === 'dc' && R[d.id].st === 'hidden'), f = pickR(act.filter(x => /^(Lost|Treasure)/.test(x.career || ''))); if(hid.length && f) relFind(pickR(hid).id, f, ed, add, items, 'buys from a sailor who swears it washed up from the Dark Continent', true); }
  fakesYear(ed, add, items);
  relIndex();
}
function relSteal(r, h, ed, add, items, lead){
  const D = RDEF[r.id], w = pickR((WORLD.wanted || []).filter(x => x.status === 'wanted' && !x.relic)), riv = (h.rivals || []).map(c => HUNTERS.find(x => x.cid === c)).filter(o => o && hActive(o));
  if(riv.length && Math.random() < 0.4){ const o = pickR(riv); relSetHolder(r, o, ed, 'stolen'); const t = `${lead || `${D.name} is stolen from`} ${h.name}. Everyone suspects ${o.name}.`; relNote(r, ed, t); add(h, 'relic', t, 7, o); openCase(o, 'theft', ed, add, {w: D.name, truth: Math.random() < 0.8, acc: h}); }
  else if(w){ relOutlaw(r, ed, w, `${D.name} is stolen from ${h.name}.`); add(h, 'relic', `${lead || `${D.name} is stolen from`} ${h.name}. Word is that ${w.name}${w.nick ? ` ("${w.nick}")` : ''} has it now.`, 7); }
}

/* ---------- fakes: copies at auction, swaps in the night, a forgery good enough to end up in a museum ---------- */
const FORGER = ['Ilse Marrow', 'the Copyist', 'Old Venn', 'the Glassblower of Rokario', 'Teodor Quill', 'the Twins of Port Vesko', 'Madame Ashgrove'];
function fakesYear(ed, add, items){
  const F = WORLD.fakes = WORLD.fakes || [], R = WORLD.relics, act = chAct(), out = F.filter(f => f.st === 'out');
  const maskOut = R.a18 && R.a18.st !== 'hidden';
  Object.values(R).filter(r => r.st !== 'hidden').forEach(r => {
    if(out.length >= 6 || Math.random() >= 0.006 * (maskOut ? 2 : 1)) return;
    const D = RDEF[r.id], by = pickR(FORGER), pl = pickR(PLACES), f = {id: 'F' + (++WORLD.seq), of: r.id, by, ed, st: 'out', pl};
    const victim = r.st === 'held' && !r.swap && hLic(r.holder);
    if(victim && hActive(victim) && Math.random() < 0.35){
      // the swap: the owner wakes up holding a copy, and does not know it
      const w = pickR((WORLD.wanted || []).filter(x => x.status === 'wanted' && !x.relic));
      if(!w) return;
      f.holder = victim.license; f.swap = true; r.swap = {fake: f.id, ed, w: w.id}; F.push(f); out.push(f); relIndex();
      relNote(r, ed, `Somebody visits ${victim.name}'s rooms in ${pl} while ${PR(victim).they} ${PR(victim).are} away. Nothing seems to be missing.`);
      return;
    }
    const buyer = pickR(act.filter(x => /^(Jackpot|Treasure)/.test(x.career || '') || hStars(x) >= 2));
    if(buyer){ f.holder = buyer.license; F.push(f); out.push(f); add(buyer, 'relic', `${buyer.name} buys ${D.name} at an auction in ${pl}. It is the second one on the market this decade.`, 4); }
  });
  F.filter(f => f.st === 'out').forEach(f => {
    const r = R[f.of], D = RDEF[f.of], hold = hLic(f.holder);
    if(f.swap){ if(Math.random() < 0.05){ const ap = pickR(act.filter(x => /^(Treasure|Ruins)/.test(x.career || '') && x !== hold)); relExpose(r, f, ed, add, items, ap || hold); } return; }
    if(Math.random() < 0.06){ const ap = pickR(act.filter(x => /^(Treasure|Ruins)/.test(x.career || '') && x !== hold));
      f.st = 'exposed'; f.exEd = ed;
      if(ap){ ap.rp = (ap.rp || 0) + 20; const t = `${ap.name} examines ${hold ? hold.name + '\'s' : 'a'} ${D.name.replace(/^the /, '')} and finds the forger's mark: ${f.by}.`; add(ap, 'relic', t + deedNick(ap, ['the Appraiser', 'Loupe', 'True-Eye'], 'for spotting forgeries'), 5, hold || undefined); }
      if(hold && hActive(hold) && Math.random() < 0.25) openCase(hold, 'forgery', ed, add, {w: D.name});
    } else if(ed - f.ed >= 40){ f.st = 'museum'; f.mEd = ed; const pl = pickR(PLACES); relItem(items, `A ${D.name.replace(/^the /, '')} goes on display in a museum in ${pl}. It is a forgery by ${f.by}, ${ed - f.ed} years old, and half the visitors think it is the real one.`, 5); }
  });
  const done = F.filter(f => f.st !== 'out'); if(F.length > 30){ const drop = new Set(done.slice(0, F.length - 30)); WORLD.fakes = F.filter(f => !drop.has(f)); }
}
function relExpose(r, f, ed, add, items, by){
  const D = RDEF[r.id], hold = hLic(f.holder), w = (WORLD.wanted || []).find(x => x.id === (r.swap && r.swap.w));
  f.st = 'exposed'; f.exEd = ed; const since = r.swap ? r.swap.ed : ed;
  delete r.swap; relIndex();
  if(w && w.status === 'wanted'){ relOutlaw(r, ed, w); } else relLose(r, ed, pickR(PLACES));
  const t = `${by ? by.name : 'An appraiser'} looks closely at ${hold ? hold.name + '\'s' : 'the'} ${D.name.replace(/^the /, '')}: it is a copy by ${f.by}. The real one was taken ${ed - since ? chY(ed - since) + ' ago' : 'only weeks ago'}${w ? `, and the Blacklist says ${w.name} has it` : ''}.`;
  relNote(r, ed, t); if(by) add(by, 'relic', t, 8, hold && hold !== by ? hold : undefined); else relItem(items, t, 8);
}

/* ---------- World page: the Atlas of relics, and a popup for each ---------- */
const RST = {held: 'Held', lost: 'Lost', vault: 'In the vault', sealed: 'Sealed', outlaw: 'In outlaw hands', missing: 'Missing with its owner'};
function relWhere(r){
  const hl = l => { const h = hLic(l); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—'; };
  if(r.st === 'held' || r.st === 'missing') return `${r.st === 'missing' ? 'missing with ' : ''}${hl(r.holder)}${r.holder2 ? ` and ${hl(r.holder2)}` : ''} · since the ${ordinal(r.since)}`;
  if(r.st === 'lost') return `last seen in ${esc(r.loc || 'nowhere anyone knows')}`;
  if(r.st === 'outlaw'){ const w = (WORLD.wanted || []).find(x => x.id === r.w); return w ? `with ${esc(w.name)}${w.nick ? ` “${esc(w.nick)}”` : ''}` : 'with the Blacklist'; }
  if(r.st === 'sealed') return `sealed since the ${ordinal(r.sealEd || 0)}`;
  if(r.st === 'vault') return `in the Association's vault`;
  return '';
}
function relicsHtml(){
  const R = WORLD.relics || {}, known = RELICS.filter(d => R[d.id] && R[d.id].st !== 'hidden'), hid = RELICS.length - known.length;
  if(!known.length) return '';
  const card = d => { const r = R[d.id]; return `<button type="button" class="rl rl-${r.st}" data-relic="${d.id}">${relicIcon(d.id, 34)}<small>${d.fam === 'dc' ? 'Dark Continent' : 'Constellation'}</small><b>${esc(capS(d.name))}</b><span class="rl-st">${RST[r.st] || ''}</span><span class="rl-w">${relWhere(r)}</span><em>${r.n || 0} owner${r.n === 1 ? '' : 's'}</em></button>`; };
  return `<div><div class="section-h">Relics</div><div class="rl-grid">${known.map(card).join('')}${hid ? `<div class="rl unknown"><b>${hid}</b><span>${hid === 1 ? 'relic is' : 'relics are'} still only stories</span></div>` : ''}</div></div>`;
}
function openRelic(id){
  const d = RDEF[id], r = (WORLD.relics || {})[id]; if(!d || !r || r.st === 'hidden') return;
  const hl = (l, n) => { const h = hLic(l); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : esc(n || '—'); };
  const fakes = (WORLD.fakes || []).filter(f => f.of === id && f.st !== 'out');
  const yrs = o => (o.to ?? S.edition) - o.from;
  showModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(capS(d.name))}">
    <div class="sheet-head"><div class="sch-head"><span class="rl-pop-ic">${relicIcon(id, 66)}</span><div><div class="meta">Relic · ${d.fam === 'dc' ? 'from the Dark Continent' : 'one of the twelve of the Constellation'}</div><div class="sh-t"><h2>${esc(capS(d.name))}</h2></div><div class="meta">${esc(d.look)}</div></div></div>
      <div style="display:flex;gap:8px;align-items:center"><button class="btn" id="mClose">Close</button></div></div>
    <div class="rl-gc"><div><small>What it gives</small><p>${esc(d.gift)}</p></div><div><small>What it takes</small><p>${esc(d.cost)}</p></div></div>
    <div class="hcard"><div><small>Status</small><b>${RST[r.st] || '—'}</b></div><div><small>Where</small><b style="font-weight:400;font-size:13px">${relWhere(r)}</b></div><div><small>Owners</small><b>${r.n || 0}</b></div><div><small>First found</small><b style="font-weight:400;font-size:13px">${r.found ? `${r.found.by ? hl(r.found.lic, r.found.by) + ', ' : ''}${esc(r.found.how)}${r.found.how === 'before the records' ? '' : ` · ${ordinal(r.found.ed)}`}` : '—'}</b></div><div><small>Forgeries caught</small><b>${fakes.length}</b></div></div>
    ${(r.owners || []).length ? `<div><div class="section-h">Hands it passed through</div><div class="sch-line">${r.owners.map(o => `<span>${hl(o.lic, o.name)}<small>${esc(RHOW[o.how] || o.how)} · ${ordinal(o.from)}${o.to != null ? '–' + ordinal(o.to) : '–today'} · ${yrs(o)} yr${yrs(o) === 1 ? '' : 's'}</small></span>`).join('')}</div>${r.n > r.owners.length ? `<p class="muted" style="margin:6px 0 0;font-size:12px">and ${r.n - r.owners.length} earlier owner${r.n - r.owners.length === 1 ? '' : 's'}</p>` : ''}</div>` : ''}
    ${(r.hist || []).length ? `<div><div class="section-h">History</div><div class="bulletin">${r.hist.slice().reverse().map(x => `<div class="bl relic"><i>⚱</i><span><span class="muted">${ordinal(x.ed)}</span> ${autoLink(esc(x.t))}</span></div>`).join('')}</div></div>` : ''}
    ${fakes.length ? `<div><div class="section-h">Forgeries</div><div class="bulletin">${fakes.slice(-5).reverse().map(f => `<div class="bl relic"><i>≈</i><span>By ${esc(f.by)}, made around the ${ordinal(f.ed)} · ${f.st === 'museum' ? `in a museum since the ${ordinal(f.mEd)}` : `exposed in the ${ordinal(f.exEd)}`}</span></div>`).join('')}</div></div>` : ''}
  </div>`);
}
function relicRowHtml(h){
  const R = WORLD.relics || {}, now = RELICS.filter(d => R[d.id] && (R[d.id].st === 'held' || R[d.id].st === 'missing') && (R[d.id].holder === h.license || R[d.id].holder2 === h.license));
  const once = RELICS.filter(d => R[d.id] && !now.includes(d) && (R[d.id].owners || []).some(o => o.lic === h.license));
  if(!now.length && !once.length) return '';
  const a = d => `${relicIcon(d.id, 20)} <a class="golink" data-relic="${d.id}" title="Open the relic">${esc(capS(d.name))} ›</a>`;
  return `<div><div class="section-h">Relics</div>${now.length ? `<p class="h-fam"><span>⚱</span> Holds ${now.map(a).join(', ')}</p>` : ''}${once.length ? `<p class="h-fam"><span>⚱</span> Once held ${once.map(a).join(', ')}</p>` : ''}</div>`;
}
document.addEventListener('click', e => { const r = e.target.closest('[data-relic]'), h = e.target.closest('[data-hunter]'); if(r && (!h || h.contains(r))){ e.preventDefault(); e.stopPropagation(); openRelic(r.dataset.relic); } }, true);
