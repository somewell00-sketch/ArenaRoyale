/* ---------- professional Hunters, careers between exams, ranks ---------- */
let BULLETINS = [];
// long-running stories between exams: wanted criminals and their hunters, expeditions, crises, avengers
const worldFix = w => { ((w || {}).newPlaces || []).forEach(p => { if(typeof PLACES !== 'undefined' && !PLACES.includes(p)) PLACES.push(p); }); w = worldFix0(w); try{ const t = (w.chairHist || []).slice(-1)[0]; if(w.chair && t && !t.to && t.lic === w.chair.lic && t.from < w.chair.since){ w.chair.since = t.from; w.chair.how = String(w.chair.how || '').replace(/^elected/, 're-elected'); } }catch(e){} return w; };
const worldFix0 = w => Object.assign({cases: [], schools: [], wanted: [], hunts: [], exped: null, crisis: null, avengers: [], seq: 0, chair: null, vice: null, zodiac: {}, elections: []}, w || {});
let WORLD = worldFix();
// nicknames outside the exam: veterans and regional Hunters arrive with one now and then, and a big deed can earn one later
const CAREER_NICK = {Blacklist: ['the Bounty', 'Warrant', 'Manhunter'], Treasure: ['Old Maps', 'Gold Tooth', 'X-Marks'], Beast: ['Beastfriend', 'the Keeper', 'Muzzle'], Gourmet: ['Spoon', 'the Palate', 'Second Helping'], Ruins: ['Dusty', 'Old Stones', 'the Digger'],
  Sea: ['Saltwater', 'Barnacle', 'the Tide'], Virus: ['Doc', 'Quarantine', 'the Needle'], Lost: ['Finder', 'Breadcrumbs', 'Lantern'], Crime: ['the Detective', 'Fingerprint', 'Alibi'], Jackpot: ['Lucky Seven', 'Dice', 'High Roller'], Music: ['Tuning Fork', 'Encore', 'Hum'], Head: ['the Recruiter', 'Talent Scout', 'the Eye']};
const nickTaken = () => new Set(HUNTERS.filter(x => x.nick && hActive(x)).map(x => x.nick));
function vetNick(h){
  if(h.nick || h.nickChecked || !(h.pro || h.regional)) return; h.nickChecked = 1; if(nhash(h.license + ':vnk') % 100 >= 30) return;
  const P = PR(h), first = h.name.split(' ')[0], cr = (h.career || '').replace(' Hunter', ''), taken = nickTaken();
  const L = nameNick({first, name: h.name, a: h.attrs || {}, age: h.age, id: h.license, gender: h.gender});
  (CAREER_NICK[cr] || []).forEach(n => L.push([n, `what everyone in the ${cr.toLowerCase()} trade calls ${P.them}`]));
  const ok = L.filter(x => !taken.has(x[0])); if(!ok.length) return; const pick = ok[nhash(h.license + ':vp') % ok.length];
  h.nick = pick[0]; h.nickWhy = pick[1]; h.nickEd = h.edition;
}
// a big deed (a capture, a discovery, coming back from the Dark Continent) can give a name to a Hunter who has none
function deedNick(h, pool, why){
  if(!h || h.nick || !hActive(h) || Math.random() > 0.35) return '';
  const taken = nickTaken(), ok = pool.filter(n => !taken.has(n)); if(!ok.length) return '';
  const n = pickR(ok), P = PR(h); h.nick = n; h.nickWhy = why; h.nickEd = S.edition;
  return ' ' + pickR([`The papers have a name for ${h.name.split(' ')[0]} now: "${n}".`, `People have started calling ${P.them} "${n}".`, `${h.name.split(' ')[0]} has a nickname now, whether ${P.they} like${P.s} it or not: "${n}".`]);
}
// older saves printed the Hatsu's description ("Feather Edge Grounding") where its name ("Solar Omen") belongs
function hatsuNameFix(){ try{ HUNTERS.forEach(vetNick); }catch(e){} try{ const fix = (t, x) => x && x.nen && x.nen.hatsu && x.nen.hatsu.alias && x.nen.hatsu.name && t.includes(x.nen.hatsu.name) ? t.split(x.nen.hatsu.name).join(x.nen.hatsu.alias) : t;
  HUNTERS.forEach(x => (x.log || []).forEach(e => { e.text = fix(e.text, x); }));
  BULLETINS.forEach(b => (b.items || []).forEach(it => { const x = it.lic && hLic(it.lic); if(x) it.text = fix(it.text, x); })); }catch(e){} }
const RANK_AT = [0, 120, 400, 1000];
const starsOf = rp => rp >= RANK_AT[3] ? 3 : rp >= RANK_AT[2] ? 2 : rp >= RANK_AT[1] ? 1 : 0;
const starStr = n => n ? '★'.repeat(n) : '';
// stars are scarce: roughly 10% of Hunters hold three, 20% two, 50% one; the rest are still unranked
const STAR_SHARE = [0, 0.80, 0.30, 0.10];   // share of Hunters at this many stars or more
const hStars = h => h.st !== undefined ? h.st : starsOf(h.rp || 0);
function calibrateStars(force){
  const all = HUNTERS.filter(h => !h.legacy);
  // first time only (or old saves): rank everyone by points; later arrivals start unranked or at one star
  if(!force && all.some(h => h.st !== undefined)){ all.forEach(h => { if(h.st === undefined) h.st = (h.rp || 0) >= RANK_AT[1] && !h.pro ? 0 : (h.rp || 0) >= RANK_AT[1] ? 1 : 0; }); return; }
  const ord = all.slice().sort((a, b) => (b.rp || 0) - (a.rp || 0)), N = ord.length;
  ord.forEach((h, i) => { const q = (i + 0.5) / N; h.st = q < STAR_SHARE[3] ? 3 : q < STAR_SHARE[2] ? 2 : q < STAR_SHARE[1] && (force || (h.rp || 0) >= RANK_AT[1]) ? 1 : 0; });
}
// age when the license was granted (veterans: their record age minus the years they had already served)
const apAge = h => h.pro ? Math.max(10, h.age - (h.years || 0)) : h.age;
const hActive = h => (h.status || 'Active Hunter') === 'Active Hunter';
function rnorm(){ let u = 0, v = 0; while(!u) u = Math.random(); while(!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function careerSkill(h){
  if(!h.attrs) return 55;
  const row = CAREERS.find(c => c[0] + ' Hunter' === h.career) || CAREERS[0];
  const w = row[1], tot = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.entries(w).reduce((s, [k, v]) => s + v * (h.attrs[k] || 50), 0) / tot;
}
const PRO_COUNT = 80;
function proLicense(){ const taken = new Set(HUNTERS.map(h => h.license)); let id; do { id = 'HL-' + Array.from({length:3}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') + String(Math.floor(Math.random() * 10000)).padStart(4, '0'); } while(taken.has(id)); return id; }
// ages 10–120, mostly 15–40; licensed between 10 and 32 (never older than they are now)
function proAge(){
  const r = Math.random();
  const age = r < 0.08 ? 10 + Math.floor(Math.random() * 5) : r < 0.78 ? 15 + Math.floor(Math.random() * 26) : r < 0.95 ? 41 + Math.floor(Math.random() * 30) : 71 + Math.floor(Math.random() * 50);
  const licAge = Math.min(age, 10 + Math.floor(Math.random() * 23));
  return {age, licAge, years: age - licAge};
}
// veteran professionals: licensed before the records, so their ID is letters + digits instead of an exam number
function makePros(ed, n){
  const out = [], used = new Set(HUNTERS.map(h => h.name)), usedNen = new Set();
  const careers = CAREERS.map(c => c[0]);
  for(let i = 0; i < n; i++){
    const gr = Math.random(), g = gr < 0.46 ? 'Male' : gr < 0.92 ? 'Female' : 'Non-binary', pool = g === 'Male' ? FIRST_M : g === 'Female' ? FIRST_F : FIRST_N;
    let name; do { name = pool[Math.floor(Math.random() * pool.length)] + ' ' + LAST[Math.floor(Math.random() * LAST.length)]; } while(used.has(name)); used.add(name);
    const A = proAge();
    if(A.age > 95 && Math.random() < 0.7){ const cut = A.age - (80 + Math.floor(Math.random() * 15)); A.age -= cut; A.years = Math.max(0, A.years - cut); }   // the very old are rare
    let longlived = A.age > 95 || Math.random() < 0.002;
    if(longlived && Math.random() < 0.5){ const extra = 30 + Math.floor(Math.random() * 130); A.age += extra; A.years += extra; }
    const r = Math.random(), stars = Math.min(r < 0.07 ? 3 : r < 0.32 ? 2 : r < 0.8 ? 1 : 0, A.years < 1 ? 0 : A.years < 3 ? 1 : A.years < 8 ? 2 : 3);
    const rp = stars === 3 ? 1020 + Math.floor(Math.random() * 600) : stars === 2 ? 410 + Math.floor(Math.random() * 520) : stars === 1 ? 125 + Math.floor(Math.random() * 250) : 30 + Math.floor(Math.random() * 85);
    const career = careers[i % careers.length], row = CAREERS.find(c => c[0] === career);
    const attrs = {};
    ATTRS.forEach(([k]) => { attrs[k] = Math.round(clamp(64 + stars * 5 + rnorm() * 8 + (row[1][k] ? row[1][k] * 9 : 0), 42, 99)); });
    const licAge = A.licAge, years = A.years;
    const cid = 'PRO-' + ed + '-' + (i + 1) + '-' + Math.floor(Math.random() * 1e6).toString(36);
    const nen = generateNen({seed: (Math.random() * 2 ** 31) >>> 0}, {id: cid, a: attrs}, usedNen);
    const h = {license: proLicense(), cid, name, gender: g, age: A.age, edition: ed, years, attempts: null, history: [], attrs,
      reason: `Licensed at ${licAge}, before the exam records began`, nen, career: career + ' Hunter', examined: [], registered: null, status: 'Active Hunter', pro: true, pv: 3, rp, log: [], longlived: longlived || undefined};
    out.push(h); HUNTERS.push(h); vetNick(h);
  }
  return out;
}
const retireRec = (h, ed, why) => { h.retire = {ed, age: h.age + Math.max(0, ed + 1 - h.edition), why}; };
// what a new Hunter carries from the exam into the register: a short bio, the family, where the nickname came from, and the exam in ten lines
function keepsake(c){
  try {
    const st = storyOf(c).replace(/\s+/g, ' ');
    const sent = st.match(/[^.!?]+[.!?]+/g) || [st];
    let bio = ''; for(const s of sent){ if(/registered with|clan walks past/.test(s)) continue; if((bio + s).length > 280) break; bio += s; }
    const F = familyOf(S, c);
    const fam = F ? {name: F.name, kin: S.candidates.filter(o => o !== c && o.fam === c.fam).slice(0, 5).map(o => ({id: o.id, name: o.name, rel: relWord(c, o)}))} : null;
    const P = PHASES, ex = [];
    const skip = /passed comfortably|scraped through|^After the exam|^Chose a career|^Day \d+: took badge|^Helped ally|^Registered with|^Round \d+: bye|lost to .* and moved on/;
    (c.notes || []).forEach(n => { if(skip.test(n.text) || !P[n.p]) return; const ph = P[n.p].name; const tx = n.text.replace(new RegExp('^' + ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*'), ''); ex.push({ph, t: tx.charAt(0).toUpperCase() + tx.slice(1)}); });
    return {bio: bio.trim(), fam, nick: c.nick ? {n: c.nick, why: c.nickWhy || ''} : null, ex: ex.slice(-8).map(x => ({ph: x.ph, t: x.t.slice(0, 120)})), ed: S.edition};
  } catch(e){ return null; }
}
// a few young Hunters are marked early: they can earn a star after one year, two after three, three after six
const isProdigy = (age, a) => { const avg = a ? Object.values(a).reduce((s, v) => s + v, 0) / Object.values(a).length : 55; return Math.random() < (age <= 22 ? 0.04 : 0.01) * (avg >= 68 ? 2 : avg >= 60 ? 1 : 0.4); };
// Hunters keep growing after the license: a point or two a year in what their work demands, faster when young or gifted;
// past their prime the body slows down a little
function growAttrs(h, ageNow){
  if(!h.attrs) return;
  if(!h.attrs0) h.attrs0 = {...h.attrs};
  const row = CAREERS.find(c => c[0] + ' Hunter' === h.career), w = row ? row[1] : {};
  const keys = Object.keys(h.attrs), a = effAge(h, ageNow);
  const n = (a < 25 ? 2 : a < 40 ? 1 : a < 55 ? (Math.random() < 0.5 ? 1 : 0) : 0) + (h.prodigy ? 1 : 0);
  for(let i = 0; i < n; i++){
    const k = wpickM(keys, x => (w[x] ? 3 + w[x] * 4 : 1) * (h.attrs[x] < 95 ? 1 : 0.05));
    if(k && h.attrs[k] < 99) h.attrs[k]++;
  }
  if(a >= 55 && Math.random() < Math.min(0.9, (a - 50) * 0.04)){ const k = pickR(['strength', 'speed', 'endurance', 'agility']); if(h.attrs[k] > 30) h.attrs[k]--; }
}
// regional offices license a handful of young Hunters every year, off the main exam; the numbers follow what the roster needs
const REGIONS = [['Kakin', 'KKN'], ['Yorknew City', 'YRK'], ['Padokea', 'PDK'], ['Swaldani City', 'SWD'], ['the Mimbo Republic', 'MMB'], ['Rokario', 'RKR'], ['the Ochima Union', 'OCH'], ['the Lukso Province', 'LKS'], ['the Azian highlands', 'AZN'], ['the Zaban islands', 'ZBN'], ['Dolle Harbor', 'DLH'], ['the Begerosse coast', 'BGS']];
const REGION_TARGET = 575;
function makeRegional(ed, n, reg){
  const out = [], used = new Set(HUNTERS.map(h => h.name)), taken = new Set(HUNTERS.map(h => h.license)), usedNen = new Set();
  for(let i = 0; i < n; i++){
    const gr = Math.random(), g = gr < 0.46 ? 'Male' : gr < 0.92 ? 'Female' : 'Non-binary', pool = g === 'Male' ? FIRST_M : g === 'Female' ? FIRST_F : FIRST_N;
    let name; do { name = pool[Math.floor(Math.random() * pool.length)] + ' ' + LAST[Math.floor(Math.random() * LAST.length)]; } while(used.has(name)); used.add(name);
    let lic; do { lic = reg[1] + String(Math.floor(Math.random() * 10000)).padStart(4, '0'); } while(taken.has(lic)); taken.add(lic);
    const age = 15 + Math.floor(Math.random() * 14) + (Math.random() < 0.15 ? Math.floor(Math.random() * 15) : 0);
    const row = CAREERS[Math.floor(Math.random() * CAREERS.length)], attrs = {};
    ATTRS.forEach(([k]) => { attrs[k] = Math.round(clamp(58 + rnorm() * 8 + (row[1][k] ? row[1][k] * 10 : 0), 35, 92)); });
    const cid = 'REG-' + ed + '-' + reg[1] + '-' + Math.floor(Math.random() * 1e6).toString(36);
    const nen = generateNen({seed: (Math.random() * 2 ** 31) >>> 0}, {id: cid, a: attrs}, usedNen);
    const h = {license: lic, cid, name, gender: g, age, edition: ed, years: 0, attempts: null, history: [], attrs, regional: reg[0],
      longlived: Math.random() < 0.003 || undefined, prodigy: isProdigy(age, attrs) || undefined,
      reason: `Licensed by the regional office in ${reg[0]}`, nen, career: row[0] + ' Hunter', examined: [], registered: null, status: 'Active Hunter', pv: 3, rp: 0, st: 0,
      log: [{ed, text: `${name} is licensed by the regional office in ${reg[0]}, at ${age}.`}]};
    out.push(h); HUNTERS.push(h); vetNick(h);
  }
  return out;
}
function regionalYear(ed, items){
  const nAct = HUNTERS.filter(h => hActive(h) && !h.legacy).length;
  const n = Math.max(0, Math.min(10, Math.round(6 + (REGION_TARGET - nAct) / 12 + rnorm() * 1.2)));
  if(!n) return;
  const regs = REGIONS.slice().sort(() => Math.random() - 0.5).slice(0, n >= 6 ? 3 : n >= 3 ? 2 : 1), split = regs.map(() => 0);
  for(let i = 0; i < n; i++) split[i % regs.length]++;
  const made = regs.map((r, i) => [r, makeRegional(ed, split[i], r)]);
  const first = made[0][1][0];
  items.push({lic: first.license, name: first.name, kind: 'regional', rank: 5, text: `Regional offices license ${n} new Hunter${n === 1 ? '' : 's'} this year: ${made.map(([r, hs]) => `${hs.length} in ${r[0]}`).join(', ')}. Among them, ${first.name}, ${first.age}.`});
}
// for veterans, age and edition are "as of" the edition they entered the records; hunterAge adds the years since
function ensurePros(ed){
  // a world starts with a large, established Association: 500–700 veteran Hunters (once per world)
  if(!WORLD.proN){
    const target = 500 + Math.floor(Math.random() * 201), have = HUNTERS.filter(h => h.pro).length;
    if(have < target) makePros(ed, target - have);
    WORLD.proN = target; calibrateStars(true);
  }
  const pros = HUNTERS.filter(h => h.pro);
  if(pros.length && pros.every(h => h.pv === 3)) return;
  // re-roll veterans' ages to the 10–120 spread (names, IDs, ranks and attributes stay)
  pros.filter(h => h.pv === 2).forEach(h => { const A = proAge(); h.age = A.age; h.years = A.years; h.edition = ed; h.reason = `Licensed at ${A.licAge}, before the exam records began`; h.pv = 3; });
  // older saves: give veterans letter IDs, then top the roster up
  pros.filter(h => !h.pv).forEach(h => {
    const old = h.license, cur = h.age + Math.max(0, ed - h.edition);
    h.license = proLicense(); h.years = Math.max(1, cur - h.age); h.reason = `Licensed at ${h.age}, before the exam records began`; h.age = cur; h.edition = ed; h.pv = 3;
    const swap = x => { if(x && x.license === old){ x.license = h.license; x.from = 0; } };
    if(S && S.phaseSpec) S.phaseSpec.forEach(sp => swap(sp.ex));
    HISTORY.forEach(r => r.snap && r.snap.phases.forEach(ph => swap(ph.ex)));
    BULLETINS.forEach(b => b.items.forEach(it => { if(it.lic === old) it.lic = h.license; }));
  });
  const have = HUNTERS.filter(h => h.pro).length;
  if(have < PRO_COUNT) makePros(ed, PRO_COUNT - have);
  calibrateStars();
}
const PLACES = ['Yorknew City','Swaldani City','Dolle Harbor','the Mimbo Republic','Padokea','the Begerosse Sea','the Saherta coast','Rokario','the Azian highlands','Kakin','the Lukso Province','the Nigg Desert','the Meteor Belt slums','Port Vesko','the Glass Marshes','Old Karnath','the Iron Steppe','Lake Orvelle','the Kukan\'yu Kingdom','the Greed Coast','the Zaban islands','Heavens Arena','the Ochima Union','the Black Pines','Fort Vellan','the Sunken Quarter','the Ashen Plateau','the Twelve Bridges','Mount Kirra','the Salt Flats of Ibbe','the Weeping Caves','Port Halloran','the Cloud Steppes','the Marrow Jungle','the city of Teshra'];
const PLACES_MORE = ['the canal city of Lumenhal','the mining town of Grell','the Varga Mountains','the mountain village of Orsk','the floating market of Sabu','the Thousand Lakes','the fishing village of Kett','the walled city of Aurex','the Brannock Hills','the river port of Mydal','the desert oasis of Qadesh','the Hollowpine Forest','the border town of Velt','the Crimson Steppe','the lighthouse town of Sennig','the ruins of Old Ambry','the Southern Archipelago','the tea terraces of Hoshen','the frozen port of Kalvik','the Ironroot Woods','the cliff village of Tamsa','the city of Belloria','the free city of Ostrava Minor','the salt mines of Druvan','the Bellwether Pass','the Seven Waterfalls','the hill town of Paloma','the abandoned railway town of Corrin','the marsh village of Fenwick','the Ghostlight Bay','the canyon city of Rhedd','the sky-bridge town of Altaris','the Lantern Valley','the river delta of Usk','the Obsidian Coast','the crossroads town of Margrave','the island of Pellucid','the Whitecap Fjords','the Sunken Temple of Imra','the bazaar city of Zahrim','the orchard country of Lisle','the volcano town of Cinder Rock','the port of Narrowmouth','the steppe town of Khulan','the old capital of Veridia','the Wyrmspine Ridge','the forest monastery of Sho-An','the Lowmarsh','the casino city of Aurelia','the hot springs of Yunagi','the harbour town of Brindle','the Red Rock Mesas','the Starfall Crater','the Whispering Dunes','the trade city of Hessen-Vaal','the mountain fortress of Kragh','the riverside town of Willowmere','the glacier town of Isvann','the slum district of Low Tarrow','the cathedral city of Saint Orren','the coral town of Mahina','the jungle city of Tikal-Ra','the Shattered Isles','the Painted Canyons','the moorland village of Greywater','the timber town of Ashby Hollow','the Copper Hills','the pilgrim road to Mount Selene','the ferry town of Two Rivers','the mist valley of Kirisato','the black-sand beaches of Vohr','the Clockwork Quarter of Yorknew','the farming plains of Hallow Reach','the cavern city of Undermere','the ice fields of Nordhavn','the Bramble Coast','the university town of Caelum','the desert city of Khet','the cliffside monastery of Vasht','the Gloamwood','the mountain lake of Sorrow\'s End','the port city of Calderon','the Tollgate Pass','the twin towns of Ebb and Flow','the high plateau of Tarsis','the windmill country of Haverlund','the ghost town of Prospect','the walled garden city of Ilyria','the outskirts of Heavens Arena','the archipelago of Moana Tiri','the rice terraces of Banaue-Kai','the stone circles of Dunmorrow','the dockyards of Port Vesko','the cloud forest of Yaravi'];
PLACES.push(...PLACES_MORE.filter(x => !PLACES.includes(x)));
// ---- the Dark Continent: goals, letters home, losses and what comes back
const DC_GOALS = ['to find the source of the Ivory River', 'to bring back a seed of the Thousand-Year Tree', 'to chart the coast beyond the Gate of Teeth', 'to recover the logbook of an expedition lost a century ago', 'to study the migration of the glass-winged herds', 'to find out why the compasses spin near the Hollow Mountain', 'to locate the city that appears on old maps and nowhere else', 'to bring back water from the Lake of Second Chances', 'to measure the Breathing Desert, which is larger every year', 'to follow a signal the Association has received every night for a month', 'to retrieve a cure the old texts promise and never describe', 'to see whether the Silent Forest is really silent', 'to escort a scholar who refuses to say what she is looking for', 'to find the end of the Endless Stair', 'to test a rumour of a beast that grants wishes and takes something back', 'to bury the dead of the last expedition properly'];
const DC_HAUL = ['They bring back a single seed, sealed in three boxes. Nobody is allowed to open them.', 'They bring back maps that redraw a third of what the Association thought it knew.', 'They bring back a stone that is always warm. The lab keeps it in a cold room. It is still warm.', 'They bring back a sealed jar of the river water. The label just says: "Do not."', 'They bring back recordings of a song nobody on the team remembers hearing.', 'They bring back a sample of a mould that eats aura. It is moved to the deepest vault on the first night.', 'They bring back nothing, and say that was the hardest part.', 'They bring back a feather longer than a man. The bird it came from was described as "young".', 'They bring back a book written in a language that changes every time it is opened.', 'They bring back a cure for a fever that has killed thousands in the south. The price was not discussed.', 'They bring back a map drawn by someone on the team. Nobody on the team remembers drawing it.', 'They bring back the old expedition\'s flag. It was planted much further in than anyone thought possible.'];
const DC_DEATH = [v => `Word comes back from the Dark Continent: ${v.name} is dead. The message does not say how.`, v => `${v.name} dies on the Dark Continent, holding the line while the others cross a river that was not on any map.`, v => `${v.name} eats a fruit that the team had agreed not to touch. ${PR(v).They} ${PR(v).were} dead by morning, smiling.`, v => `A storm of something that was not rain hits the expedition camp. ${v.name} is the only one outside when it starts.`, v => `${v.name} goes in first through a gate that closes behind ${PR(v).them}. The team waits three days. It does not open again.`, v => `The expedition's letter is short: ${v.name} is gone, and the team has decided not to describe what took ${PR(v).them}.`, v => `${v.name} falls ill with a fever that makes ${PR(v).them} speak in a language nobody else knows. It lasts a week. Then it stops.`, v => `${v.name} is killed by a creature the team had been tracking for a month. It was tracking them too.`, v => `${v.name} uses ${PR(v).their} Hatsu past every limit to save the camp. The camp is saved.`];
const DC_MISS = [v => `${v.name} walked away from the expedition camp one night on the Dark Continent and did not come back.`, v => `${v.name} steps into a mist bank to scout ahead. The mist is still there. ${v.name} is not.`, v => `${v.name} follows a voice that sounds like ${PR(v).their} mother. The others hold their ears and do not follow.`, v => `${v.name}'s tent is found empty and zipped shut from the inside.`, v => `${v.name} volunteers to stay behind and guard the river crossing. When the team comes back for ${PR(v).them}, the river has moved.`, v => `The expedition reports that ${v.name} "has gone ahead". They do not explain why they let ${PR(v).them}.`];
const DC_CHANGED = [h => `${h.name} refuses to talk about what they saw.`, h => `${h.name} came back with ${PR(h).their} hair gone completely white.`, h => `${h.name} now sleeps with the lights on and will not say why.`, h => `${h.name} has a new scar shaped like a handprint, and a new habit of looking over ${PR(h).their} shoulder.`, h => `${h.name} came back speaking more softly, as if something might be listening.`, h => `${h.name} keeps a jar of Dark Continent soil on ${PR(h).their} desk and talks to it.`];
const DC_LETTERS = c => [
  `A letter from the Dark Continent, signed by ${c.firsts}: "We found the first gate. It was open."`,
  `The expedition reports a creature the size of a city. Nobody at the Association sleeps well.`,
  `The expedition sends back samples of a plant that cures nothing and kills everything.`,
  `${c.yr > 1 ? 'Months' : 'Weeks'} of silence from the Dark Continent, then one word by radio: "Alive."`,
  `The expedition's maps arrive. Half of them contradict the other half.`,
  `A supply drop reaches the expedition camp. The crates come back unopened, with a note: "Do not send more people."`,
  `The expedition reports a lake that is warm in winter and empty of fish. They are not drinking from it.`,
  `${c.b ? `${c.b.name} writes home` : 'A letter arrives'}: "The stars are wrong here. We navigate by the old songs now."`,
  `The expedition finds the ruins of a camp older than the Association. The names on the tents are not in any record.`,
  `A radio burst from the Dark Continent, mostly static. The Association's analysts swear they hear laughter in it.`,
  `The expedition asks for medicine for an illness nobody can name. It goes out on the next ship.`,
  `${c.a.name} writes that the trees here grow in perfect rows, as if someone planted them. Nobody has found the gardener.`,
  `The expedition crosses a plain where it rains upward for an hour every evening. ${c.a.name} has started keeping a diary of it.`,
  `${c.a.name} reports a village of people who say they are the descendants of the first expedition. They speak a very old dialect of the Association's own language.`,
  `The expedition finds a river that flows in a circle. They spend four days trying to leave it.`,
  `${c.a.name} trades ${PR(c.a).their} watch to a creature that asked for it politely. The creature gave back a stone that tells the time better.`,
  `A letter from ${c.a.name}: "Something has been following us for a week. It walks when we walk. It stops when we stop. It has not attacked. That is the worst part."`,
  `The expedition reports a mountain that hums. Their Nen gets stronger the closer they get, and so does their headache.`,
  `${c.a.name} writes that the team's shadows have started arriving a second late.`,
  `The expedition finds an animal that copies whatever it sees. It now does a very good impression of ${c.a.name}.`,
  `The expedition reaches the edge of a forest where every bird sings the same three notes. ${c.b ? c.b.name : c.a.name} says it is a warning. Nobody knows what for.`,
  `A message from the Dark Continent, in ${c.a.name}'s handwriting, dated three weeks in the future.`,
  `The expedition reports a desert where the sand is warm, white and soft, and turns out to be ash. Nobody wants to guess from what.`,
  `${c.a.name} sends a pressed flower home with a note: "Do not smell it." The lab smells it. The lab is closed for a week.`,
  `The expedition finds a statue of a Hunter wearing the Association's crest. The face has been worn away. It is very, very old.`,
  `The expedition crosses a bridge of bone over a gorge with no bottom. ${c.a.name} counted the steps. There were more going back.`,
  `The expedition reports that it is close to what it came for. Then the radio goes quiet for a month.`,
  `${c.a.name} writes about a sea that is perfectly still and perfectly clear, and a city at the bottom of it with its lights on.`,
  `The expedition's guide, a local beast they tamed, leaves them one night. It comes back with a warning they cannot read and will not leave again.`,
  `${c.a.name} writes two letters home. One says turn back. The other says keep going. Only the second one is signed.`,
  `The expedition reports a creature that eats sound. The camp has been silent for six days. They write everything down now.`,
  `The expedition sends back a single photograph. It shows the whole team, from behind, taken by nobody.`,
  `A swarm of glowing insects settles on the camp. By morning every wound on the team has healed. ${c.a.name} has lost a whole year of memories.`,
  `The expedition finds a door standing alone in a field, with no wall around it. They decide not to knock.`
];
const JOBS = {
  Blacklist:['brought in a wanted arms dealer in {pl}','tracked a bounty across three borders to {pl}','collected the bounty on a serial poisoner hiding in {pl}','dragged a crime boss out of a fortified villa in {pl}','caught a fugitive Hunter who had gone rogue in {pl}','ended a kidnapping ring that operated out of {pl}','captured a bandit warlord in the hills near {pl}','took down a Nen-using assassin in {pl}, barely','brought back a con artist who had fooled half of {pl}','cleared an entire page of the Blacklist in one season around {pl}','arrested a smuggler-king at the docks at {pl}','talked a wanted man into surrendering in {pl}','caught a poisoner who had changed faces three times, in {pl}','brought in a deserter from a private army hiding in {pl}','tracked a bomb-maker through the sewers under {pl}','captured a slaver caravan on the road to {pl}','collected a bounty that had gone unclaimed for twenty years in {pl}','arrested a rogue Nen user terrorising {pl}','ended a hostage standoff in {pl} without a single shot','hunted down a cult leader hiding in the hills near {pl}','caught an assassin the night before the job, in {pl}','brought in a fugitive banker who had emptied half of {pl}','tracked a jewel thief across rooftops in {pl}','dragged a warlord out of his own fortress in {pl}'],
  Treasure:['recovered a lost royal crown near {pl}','opened a sealed vault beneath {pl}','found a shipwreck full of old coins off {pl}','solved a three-hundred-year-old treasure riddle in {pl}','found a sword everyone thought was a legend, buried in {pl}','outbid a crime syndicate for a cursed jewel in {pl}','dug up a buried library under {pl}','tracked a stolen painting through five owners to {pl}','found the missing half of a famous treasure map in {pl}','recovered a stolen meteorite in {pl}','opened a puzzle box no one had opened in a century, in {pl}','found the lost crown jewels of a fallen dynasty in {pl}','opened a puzzle box that had stumped scholars for a century, in {pl}','dug up a sunken temple bell off {pl}','recovered a stolen relic from a black market in {pl}','found a pirate captain\'s logbook, and his gold, near {pl}','cracked a dead king\'s cipher in {pl}','found a map tattooed on a mummy in {pl}','recovered a sword that had been missing for four hundred years, in {pl}','opened a vault built to be opened only once, beneath {pl}','traced a forger\'s fake treasure maps back to a workshop in {pl}','struck a vein of rare crystal under {pl}','found a lost library sealed inside a mountain near {pl}'],
  Beast:['catalogued a new species in the forests near {pl}','calmed a rampaging beast threatening {pl}','saved a nest of endangered birds near {pl}','tamed a giant serpent that had sunk ships near {pl}','raised an orphaned beast cub found in {pl}','stopped a poaching ring in {pl}','discovered a beast thought extinct for two hundred years in {pl}','led a herd of migrating beasts safely around {pl}','was adopted by a pack of wolves for a month in {pl}','studied a beast that can change colour at will in {pl}','returned a stolen beast egg to its nest in {pl}','studied a herd of beasts that only appear once a decade, near {pl}','rescued a stranded whale-serpent in the shallows off {pl}','tamed a wyvern that had been raiding farms near {pl}','caught a poacher ring selling rare eggs in {pl}','raised a litter of orphaned wolf-cats found in {pl}','found a breeding ground nobody knew existed, in {pl}','led a migrating herd around a dam built in its path near {pl}','calmed a beast stampede before it hit {pl}','catalogued four new insect species in a single night in {pl}','returned a stolen beast calf to its herd near {pl}','tracked a man-eater that had killed nine people in {pl}','saved a dying forest guardian in {pl}'],
  Gourmet:['cooked for a royal banquet in {pl}','found a legendary ingredient in {pl}','discovered a hidden restaurant in {pl}','won a cooking duel against a three-star chef in {pl}','invented a dish now served across {pl}','found a fruit that grows once every twelve years in {pl}','exposed a fake Gourmet Hunter selling poison in {pl}','cooked a beast nobody had ever dared to eat, in {pl}','opened a tiny restaurant in {pl} that is booked for years','rescued a recipe book from a burning monastery in {pl}','tasted every street stall in {pl} and wrote the definitive guide','found a spice that tastes different to everyone, in {pl}','cooked a dish for a dying king in {pl}, who asked for seconds','tracked a legendary fish upriver to {pl}','won a forty-hour cook-off in {pl}','discovered a cheese cave sealed for three hundred years near {pl}','tasted a fruit that only ripens under a full moon in {pl}','invented a sauce now on every table in {pl}','exposed a restaurant serving endangered beasts in {pl}','found the last farm growing an extinct grain, in {pl}','cooked for both sides of a peace treaty in {pl}','brought back an egg the size of a carriage from {pl}','recovered a stolen family recipe for a village in {pl}'],
  Ruins:['mapped an underground city beneath {pl}','deciphered an ancient tablet found near {pl}','stopped looters raiding the ruins near {pl}','found a tomb with no entrance in {pl}, and got in','proved the ruins near {pl} are older than any known civilisation','restored a temple mural in {pl}','opened a door in {pl} that had been sealed with Nen','found a lost language carved into the cliffs near {pl}','escaped a collapsing pyramid in {pl} with the artefact','mapped the catacombs under {pl} that nobody came back from','mapped a buried palace under the sands near {pl}','found a working machine in ruins older than writing, near {pl}','deciphered a language nobody has spoken in two thousand years, in {pl}','opened a sealed door in {pl} that had stopped six expeditions','restored a collapsed temple in {pl}','found a city on no map in the jungles near {pl}','stopped a treasure company from dynamiting the ruins near {pl}','escaped a ruin that rebuilt itself around {them} in {pl}','recovered tablets describing the Dark Continent from a vault in {pl}','proved that the ruins near {pl} were built by something not human','mapped a labyrinth under {pl} that changes every season','dug out a buried observatory near {pl}'],
  Sea:['charted a new trade route past {pl}','brought a crew home through a typhoon off {pl}','found a sea monster graveyard near {pl}','dove to the deepest trench off {pl}','sank a pirate fleet off {pl}','found an island that is not on any map, near {pl}','sailed alone around the coast near {pl}','rescued a whaling crew trapped in the ice off {pl}','tracked a ghost ship to {pl}','raised a sunken warship off {pl}','sailed through a storm wall that had trapped ships for a month off {pl}','found an island that moves, near {pl}','rescued the crew of a ghost ship off {pl}','charted a whirlpool everyone thought was a legend, off {pl}','sank a slaver ship off {pl}','dove for a lost bell at the bottom of the sea near {pl}','tracked a sea serpent across half the ocean to {pl}','brought a leaking ferry full of refugees safely into {pl}','found a reef city of crabs the size of houses off {pl}','recovered a sunken treasury off {pl}','captured a pirate queen in the straits near {pl}'],
  Virus:['contained an outbreak in {pl}','isolated a new strain in the labs of {pl}','got a vaccine to {pl} in time','traced a plague back to a single well in {pl}','found a cure in a plant from {pl}','quarantined a whole city district in {pl}','proved a Nen curse, not a virus, was killing people in {pl}','spent three months sealed in a lab in {pl}','stopped a stolen bioweapon from leaving {pl}','vaccinated every child in {pl}','isolated a fungus that makes people sleepwalk, in {pl}','got medicine through a quarantine line in {pl} in time','traced a fever back to a poisoned river in {pl}','found the patient zero of an outbreak in {pl}','contained a beast-borne plague in {pl}','vaccinated a whole mountain town near {pl} in one winter','discovered an antidote in the venom of a beast from {pl}','stopped a black-market lab selling a fake cure in {pl}','quarantined a ship full of sick sailors off {pl}, and lost none of them','isolated a virus that only spreads through song, in {pl}','studied a disease that turns skin to stone, in {pl}','found a cure hidden in an old herbalist\'s notes in {pl}'],
  Lost:['brought a missing expedition home from {pl}','found a lost child in the mountains near {pl}','traced a missing heir to {pl}','found a pilot missing for six years in {pl}','reunited a family separated by war in {pl}','led a rescue through an avalanche in {pl}','found a missing Hunter alive in {pl}','tracked a kidnapped prince to {pl}','found an entire village that had vanished from {pl}','brought home a climber everyone had given up on, from {pl}','found a climber missing for three years, alive, in {pl}','brought home a whole village lost in a snowstorm near {pl}','traced a kidnapped prince to {pl}','found a crashed airship and its survivors near {pl}','reunited twins separated at birth in {pl}','led a rescue through flooded caves in {pl}','found a missing Hunter in the jungles near {pl}','tracked a lost caravan across the desert to {pl}','brought back the bodies of a lost expedition from {pl}, so their families could bury them','found a child raised by beasts in the forests near {pl}','found a mapmaker who had been missing for nine years, in {pl}','brought a lost ship home through the fog around {pl}'],
  Crime:['broke a smuggling ring in {pl}','solved a decades-old murder in {pl}','caught an art thief red-handed in {pl}','went undercover in a mafia family in {pl} for a year','exposed a corrupt judge in {pl}','stopped a bank heist in {pl} from the inside','cracked a counterfeit ring in {pl}','found the mole inside the police in {pl}','solved a locked-room mystery in {pl}','brought down a human-trafficking ring in {pl}','broke a counterfeiting ring in {pl}','solved a locked-room murder in {pl}','took down a human-trafficking network in {pl}','exposed a mayor running a gang in {pl}','went undercover in a prison in {pl} for six months','caught a serial arsonist in {pl}','recovered a stolen museum collection in {pl}','cracked a blackmail ring targeting judges in {pl}','arrested a gang boss at his own wedding in {pl}','solved a kidnapping in {pl} in under a day','found the leak in the police in {pl}'],
  Jackpot:['won a fortune at the gambling dens in {pl}','bought a cursed painting cheap in {pl} and sold it for millions','struck gold in a mine near {pl}','won a racehorse in a card game in {pl}','bought a failing company in {pl} and turned it around','broke the bank at the biggest casino in {pl}','found oil under a ranch bought for nothing in {pl}','won the lottery in {pl}, twice','sold a worthless island near {pl} to a duke','won a casino in a single game of cards, in {pl}','sold a forged painting back to the forger in {pl}','bought a worthless island near {pl}, then found oil','won a beast race in {pl} on a hundred-to-one bet','struck it rich on a ship salvage off {pl}','won a duel of dice against a crime boss in {pl}','bought a haunted mansion in {pl} and sold the ghost story','broke the bank of the largest gambling hall in {pl}','won a mine in a bet in {pl}','sold a map to nowhere for a fortune in {pl}','bought up every sack of a rare spice in {pl}, and named the price','won back a village\'s land in a card game in {pl}'],
  Music:['played a sold-out concert in {pl}','recovered a stolen legendary violin in {pl}','composed a hymn for the people of {pl}','found a lost symphony manuscript in {pl}','stopped a riot in {pl} by playing','recorded the last songs of a dying tribe in {pl}','tracked down a cursed song that drives listeners mad, in {pl}','played for a king who had not smiled in years, in {pl}','discovered an instrument made of beast bone in {pl}','recovered a cursed violin from a collector in {pl}','played a lullaby that stopped a beast stampede in {pl}','found a song carved into a cave wall in {pl}','composed a march for the soldiers of {pl}','recorded the last speakers of a dying language in {pl}','played for a dying war hero in {pl}','stopped a riot in {pl} with a single song','found the composer of a famous anonymous symphony, alive, in {pl}','recovered a stolen organ, piece by piece, across {pl}','played a duet with a famous rival in {pl}','played a sold-out run of nights in {pl}'],
  Head:['recruited three rookie Hunters in {pl}','negotiated a truce between two gangs in {pl}','hunted down a Hunter-killer near {pl}','talked two countries out of a border war in {pl}','scouted a child prodigy in {pl}','ran a training camp for future candidates in {pl}','settled a feud between two Hunter families in {pl}','convinced a reclusive master in {pl} to take students','trained a class of rookie Hunters in {pl}','negotiated the release of hostages in {pl}','led a joint mission of twelve Hunters in {pl}','talked a rogue Hunter into surrendering in {pl}','ran the Association office in {pl} through a crisis','recruited a famous mercenary to the Association in {pl}','settled a border dispute in {pl} without a fight','stopped a Hunter duel in {pl} before anyone died','led the search for a missing Zodiac member in {pl}']
};
// contracts by rank: [routine, ★, ★★, ★★★]; every line follows the Hunter's name ("Kira Celik ...")
const MISSIONS = {
  Blacklist: [
    ['served a warrant on a petty smuggler in {pl}', 'tracked a pickpocket ring through the markets of {pl}', 'collected a small bounty on a horse thief near {pl}', 'escorted a prisoner across {pl} without losing the prisoner', 'chased a debt-skipper halfway across {pl} and back', 'talked a cornered burglar out of a rooftop in {pl}', 'found a bail-jumper hiding in a monastery near {pl}', 'brought in a forger who had been printing fake licenses in {pl}'],
    ['brought in a wanted arms dealer in {pl}', 'tracked a bounty across three borders to {pl}', 'cleared out a bandit camp in the hills above {pl}', 'caught a hired killer at a wedding in {pl}, between the toasts', 'broke up a slave auction in {pl} and freed everyone on the stage', 'brought back a poisoner who had changed faces twice, from {pl}', 'ran down a gang of train robbers near {pl}', 'spent three months undercover in a prison in {pl} to reach one inmate'],
    ['took down a syndicate enforcer nobody in {pl} would testify against', 'brought in a rogue Hunter who had sold out every partner they ever had in {pl}', 'cornered a Nen user who had been robbing banks in {pl} without touching the doors', 'dismantled a mercenary company that held a whole town near {pl} for ransom', 'tracked a serial killer through the sewers of {pl} for forty days', 'captured a warlord\'s right hand in {pl} and lived to collect', 'broke a hostage siege in {pl} in under an hour', 'hunted a shapeshifting assassin through {pl} by tracking the one thing it could not change: its smell'],
    ['cornered a Hunter-killer in {pl} that two other Hunters had died chasing', 'brought in a criminal so dangerous the bounty was paid in land, in {pl}', 'ended a ten-year manhunt in {pl} with a single conversation', 'captured the head of a crime family that owned half of {pl}, alone', 'walked into the hideout of a whole gang of Nen users in {pl}, and walked out with all of them', 'tracked a fugitive who could teleport, by learning where the fugitive could not go, in {pl}', 'took the bounty that had sat at the top of the Blacklist for twenty years, in {pl}', 'stopped an assassination at a summit in {pl} that would have started a war']
  ],
  Treasure: [
    ['found a dead merchant\'s strongbox in a canal in {pl}', 'appraised a cellar full of old wine in {pl}, and kept one bottle', 'dug up a smuggler\'s cache near {pl}', 'tracked down a stolen family ring in a pawnshop in {pl}', 'mapped the old tunnels under a farmhouse in {pl}', 'found a coin hoard in a collapsed chapel near {pl}', 'recovered a lost painting from a flea market in {pl}', 'opened a jammed bank vault in {pl} for a nervous manager'],
    ['recovered a lost royal crown near {pl}', 'opened a sealed vault beneath {pl}', 'found a shipwreck full of old coins off {pl}', 'solved a three-hundred-year-old treasure riddle in {pl}', 'beat three rival crews to a pirate cache near {pl}', 'recovered a museum\'s whole stolen collection from a warehouse in {pl}', 'found the second half of a torn treasure map in a library in {pl}', 'got a cursed chest open in {pl} without anyone dying, for once'],
    ['found a sword everyone thought was a legend, buried in {pl}', 'cracked a vault in {pl} built by a Nen user to open only for the dead', 'outbid a collector\'s private army for a lost reliquary in {pl}', 'found a buried city\'s treasury under the dunes near {pl}', 'pulled a treasure out of a lake in {pl} that drowns anyone who touches it', 'tracked a jewel through eleven owners and four murders to {pl}', 'mapped a labyrinth of traps beneath {pl} and came back with the map and the gold', 'recovered a king\'s ransom from a sunken airship off {pl}'],
    ['found one of the Seven Great Treasures, in a place near {pl} no map admits exists', 'opened a door in {pl} that had stayed shut for a thousand years', 'brought back an artefact from {pl} that three expeditions died looking for', 'solved the Riddle of the Nine Locks in {pl}, the one that broke a dozen Hunters', 'outplayed a whole guild of treasure thieves in {pl} with a fake map', 'found a vault in {pl} that held nothing but a letter, and the letter was worth more than gold', 'recovered a treasure guarded by a Nen beast older than the Association, near {pl}', 'found the lost hoard of a dead empire beneath {pl}, and gave half of it back to the city']
  ],
  Beast: [
    ['rescued a farmer\'s runaway cattle near {pl}', 'relocated a family of rock badgers from a schoolyard in {pl}', 'treated an injured riding bird in {pl}', 'counted migrating fish in the rivers of {pl} for the Association\'s records', 'returned an escaped circus bear to a sanctuary near {pl}', 'calmed a herd spooked by a storm near {pl}', 'tracked a poached cub to a market in {pl} and got it back', 'shooed a nest of fire wasps out of a village well near {pl}'],
    ['catalogued a new species in the forests near {pl}', 'calmed a rampaging beast threatening {pl}', 'saved a nest of endangered birds near {pl}', 'broke a poaching ring selling rare hides in {pl}', 'raised an orphaned beast cub found in {pl}', 'cured a plague killing the deer around {pl}', 'guided a herd of giant lizards around {pl} instead of through it', 'lived among a pack of wolves near {pl} for a season to learn why they were attacking'],
    ['tamed a giant serpent that had sunk ships near {pl}', 'stopped a stampede of armoured beasts before it reached {pl}', 'tracked a man-eater around {pl} for weeks and moved it somewhere it could live', 'brokered a truce between a village and a clan of talking apes near {pl}', 'found the last breeding pair of a species thought extinct, in {pl}', 'faced down a Nen beast that had made the pass near {pl} impassable', 'ran a sanctuary in {pl} through a war without losing a single animal', 'proved the monster haunting {pl} was a mother protecting her young, and protected both'],
    ['calmed a beast the size of a hill that had woken under {pl}', 'tracked a legendary beast near {pl} that had not been seen in a century', 'stopped a swarm of chimeric insects before it reached {pl}', 'befriended a sky-whale over {pl} and rode it back to the Association', 'closed a rift near {pl} that was letting creatures from the Dark Continent through', 'faced a Nen beast in {pl} that had killed four Hunters, and talked it down', 'saved an entire migrating species from a dam built across {pl}', 'brought back a beast from {pl} the scholars had called impossible']
  ],
  Gourmet: [
    ['catered a wedding in {pl} with half the ingredients missing', 'judged a village pie contest in {pl} and survived the politics', 'found the best noodle stall in {pl}, then kept it a secret', 'cooked for a whole mining camp near {pl} for a week', 'tracked down a rare spice for a restaurant in {pl}', 'taught a cooking class in {pl} that ended in a small fire', 'restored an old family recipe for a widow in {pl}', 'ate something in {pl} that nobody else would, and wrote it down'],
    ['cooked for a royal banquet in {pl}', 'found a legendary ingredient in {pl}', 'won a cooking duel against a three-star chef in {pl}', 'discovered a hidden restaurant in {pl}', 'harvested a fruit that only ripens during an eclipse, near {pl}', 'cooked a dish in {pl} that made a sworn enemy apologise', 'caught a fish in {pl} that fights back, and cooked it the same night', 'invented a dish now served across {pl}'],
    ['climbed into the nest of a giant bird near {pl} for one egg', 'cooked a poisonous beast in {pl} so that it wasn\'t poisonous anymore', 'found a fruit that grows once every hundred years, in {pl}', 'cooked for a peace summit in {pl}, and the peace held', 'ran the kitchen of a besieged city in {pl} for a whole winter', 'brought back a spice from {pl} that hadn\'t been tasted in three hundred years', 'cooked a meal in {pl} that brought a dying master chef back to the stove', 'tracked a migrating sea-cow off {pl} for its milk, and earned its trust first'],
    ['cooked the Phantom Feast, a meal from an old legend, in {pl}', 'found the Mother Spice in a cave near {pl}, the one every cuisine is supposed to descend from', 'cooked for a king and his would-be assassin at the same table in {pl}, and both left happy', 'brought back an ingredient from the edge of the Dark Continent, by way of {pl}', 'cooked a dish in {pl} that made a Nen beast lie down and sleep', 'won the Gourmet Hunters\' secret tournament in {pl}, the one with no rules', 'recreated a lost civilisation\'s last meal from bones and pottery found in {pl}', 'fed a starving city in {pl} for a month with food no one else knew was edible']
  ],
  Ruins: [
    ['surveyed a crumbling watchtower near {pl}', 'catalogued pottery from a dig near {pl}', 'cleared rubble from a temple entrance in {pl}', 'translated a merchant\'s ledger from a dead language, in {pl}', 'guided a group of students through the old city of {pl}', 'stopped a builder from paving over a burial site in {pl}', 'found a hidden room behind a bookshelf in a manor near {pl}', 'mapped the catacombs under a church in {pl}'],
    ['mapped an underground city beneath {pl}', 'deciphered an ancient tablet found near {pl}', 'stopped looters raiding the ruins near {pl}', 'found a tomb with no entrance in {pl}, and got in', 'reassembled a shattered statue in {pl} from four thousand pieces', 'found a library sealed in amber beneath {pl}', 'disarmed a temple near {pl} that was still trying to kill its visitors', 'dated the ruins near {pl} by reading the stars painted on the ceiling'],
    ['proved the ruins near {pl} are older than any known civilisation', 'woke a sleeping guardian golem in {pl}, and put it back to sleep', 'found a working machine in the ruins of {pl} nobody can explain', 'crossed a sealed valley near {pl} where the air stops sound', 'read a map carved inside a mountain near {pl} and found what it pointed to', 'saved a city of ruins near {pl} from a dam that would have drowned it', 'opened a tomb in {pl} whose curse was real, and broke it', 'found the second entrance to a ruin near {pl} that had killed everyone using the first'],
    ['found a ruin near {pl} that moves when nobody is watching', 'entered the Tower Without Doors near {pl} and came back with a page from inside', 'translated the first sentence ever written, from a stone found in {pl}', 'found an entire buried empire under {pl}, with its streets still lit', 'walked through a ruin near {pl} where time runs differently, and lost a month', 'deciphered the warnings on a vault in {pl}, and decided not to open it', 'found a ruin near {pl} built by something that was not human', 'mapped all nine levels of the Sunken Archive beneath {pl}, the first to come back from the ninth']
  ],
  Sea: [
    ['ferried medicine across a storm to an island near {pl}', 'charted a stretch of reef off {pl}', 'pulled a fishing crew out of the water off {pl}', 'hunted down a smuggler\'s skiff in the harbour of {pl}', 'repaired a lighthouse on a rock off {pl}', 'guided a lost ferry into {pl} by lamplight', 'dove for a dropped cargo crate off {pl}', 'crewed a racing yacht out of {pl}, and won'],
    ['charted a new trade route past {pl}', 'brought a crew home through a typhoon off {pl}', 'found a sea monster graveyard near {pl}', 'sank a pirate fleet off {pl}', 'found an island that is not on any map, near {pl}', 'cut a ship free from a giant squid off {pl}', 'sailed a damaged ship into {pl} with half a mast and no rudder', 'found the wreck of a lost treasure galleon off {pl}'],
    ['dove to the deepest trench off {pl}', 'broke a pirate admiral\'s blockade of {pl}', 'sailed into the whirlpool off {pl} and came out the other side', 'brought back the crew of a ghost ship off {pl}, alive', 'stopped a tidal monster from reaching {pl}', 'found the Drowned Bell off {pl} that rings before every storm', 'crossed the Dead Calm off {pl} where no wind blows, rowing', 'brokered peace between two pirate clans fighting over {pl}'],
    ['sailed past the edge of the charts beyond {pl} and came back with new ones', 'fought a sea serpent the length of a city off {pl}', 'found the island that appears once every fifty years off {pl}, and set foot on it', 'brought a whole fleet home through the Storm Wall off {pl}', 'raised a sunken fortress off {pl} from the sea floor', 'tracked the Leviathan off {pl} for a year and lived to describe it', 'sailed to the Dark Continent\'s outer shoals past {pl} and back', 'navigated a ship through the Maelstrom off {pl} by Nen alone']
  ],
  Virus: [
    ['vaccinated an entire school in {pl} in a day', 'tested the wells of a village near {pl}', 'tracked a mild fever back to a market stall in {pl}', 'helped a field hospital in {pl} through a bad season', 'catalogued fungal samples from the caves near {pl}', 'calmed a panic over a harmless rash in {pl}', 'delivered medicine through a flood to {pl}', 'cleaned up a laboratory spill in {pl} before anyone noticed'],
    ['contained an outbreak in {pl}', 'isolated a new strain in the labs of {pl}', 'got a vaccine to {pl} in time', 'traced a plague back to a single well in {pl}', 'found a cure in a plant from {pl}', 'quarantined a whole city district in {pl}', 'stopped a smuggler carrying infected animals into {pl}', 'worked forty hours straight in a fever ward in {pl}'],
    ['proved a Nen curse in {pl} was really a disease, and cured it', 'stopped a bioweapon from being sold at an auction in {pl}', 'contained a parasite in {pl} that made its hosts violent', 'found patient zero of an epidemic in a sealed village near {pl}', 'cured a sleeping sickness that had taken half of {pl}', 'destroyed a secret laboratory near {pl} breeding diseases for war', 'walked into a quarantine zone in {pl} that nobody else would enter', 'synthesised a cure in {pl} from the blood of the one survivor'],
    ['stopped a pandemic in {pl} before the world knew it had started', 'cured a plague that came back from the Dark Continent, in {pl}', 'contained a living disease in {pl} that could think', 'found the cure for a Nen-born sickness in {pl} that had no cure', 'shut down a cult in {pl} that was spreading a disease on purpose', 'sealed a cave near {pl} that breathes out a plague every century', 'saved a whole country by holding a quarantine line in {pl} for a year', 'traced a disease in {pl} back to an ancient tomb, and closed it']
  ],
  Lost: [
    ['found a lost dog in {pl}, and then its owner', 'tracked a missing hiker in the hills near {pl}', 'found a runaway teenager working on a farm near {pl}', 'returned a lost heirloom to a family in {pl}', 'found a missing clerk asleep in the archives of {pl}', 'traced a lost letter thirty years late to {pl}', 'reunited two brothers in {pl} who had not spoken in a decade', 'found a lost caravan off the road near {pl}'],
    ['brought a missing expedition home from {pl}', 'found a lost child in the mountains near {pl}', 'traced a missing heir to {pl}', 'found a pilot missing for six years in {pl}', 'reunited a family separated by war in {pl}', 'led a rescue through an avalanche near {pl}', 'found a whole village that had moved overnight, near {pl}', 'tracked down a missing witness for a trial in {pl}'],
    ['found a Hunter missing for nine years in {pl}, and brought them home', 'tracked a kidnapped prince through four countries to {pl}', 'pulled a lost team out of a cave system under {pl} after a month', 'found the survivors of a crashed airship in the jungles of {pl}', 'found a girl in {pl} that the whole world had stopped looking for', 'brought back a soldier from {pl} who had been fighting a war that ended twenty years ago', 'found a lost town near {pl} that had been hidden by a Nen barrier', 'tracked a missing Nen master to {pl} and talked them into coming home'],
    ['brought home a lost expedition from beyond {pl} that was declared dead a decade ago', 'found a whole city near {pl} that had vanished from every map in one night', 'pulled a Hunter back from the edge of the Dark Continent, by way of {pl}', 'found someone in {pl} who had been missing for fifty years and had not aged a day', 'tracked a lost child across a Nen labyrinth in {pl} that no adult could enter', 'found the missing Zodiac member everyone had given up on, in {pl}', 'rescued the crew of a ship lost inside a storm that never ends, off {pl}', 'found the way out of the Forest of No Return near {pl}, and led thirty people through it']
  ],
  Crime: [
    ['caught a shoplifter ring in {pl}', 'solved a stolen-bicycle mystery in {pl} that had become a feud', 'found an embezzler in a small bank in {pl}', 'cleared an innocent man in {pl} of a theft', 'tailed a cheating husband in {pl} and found something worse', 'testified in a trial in {pl} and changed the verdict', 'recovered stolen church bells in {pl}', 'caught a pickpocket in {pl} who turned out to be a runaway noble'],
    ['broke a smuggling ring in {pl}', 'solved a decades-old murder in {pl}', 'caught an art thief red-handed in {pl}', 'exposed a corrupt judge in {pl}', 'stopped a bank heist in {pl} from the inside', 'cracked a counterfeiting operation in the basement of a museum in {pl}', 'unmasked a serial blackmailer in high society in {pl}', 'solved a locked-room murder in {pl} in one evening'],
    ['went undercover in a mafia family in {pl} for a year', 'brought down a police chief in {pl} who ran the city\'s gangs', 'cracked a ring of Nen-user thieves in {pl} that left no trace', 'solved a string of murders in {pl} that the killer had been signing in riddles', 'exposed a minister in {pl} who had sold a whole province', 'infiltrated a secret auction in {pl} and walked out with the guest list', 'proved a famous suicide in {pl} was a murder, and named the killer', 'broke an assassination guild in {pl} by turning its youngest member'],
    ['brought down the crime lord who ran {pl} from inside a prison', 'solved the perfect crime in {pl}, the one taught in Hunter classes as unsolvable', 'exposed a conspiracy in {pl} reaching all the way into the Association', 'dismantled a criminal empire across {pl} in a single night of arrests', 'caught a thief in {pl} who could steal memories', 'unmasked the mastermind behind ten years of unsolved heists, in {pl}', 'stopped a coup in {pl} with a single piece of evidence', 'testified against the most powerful family in {pl}, and lived']
  ],
  Jackpot: [
    ['won a modest pot at a card table in {pl}', 'bought a box of old junk in {pl} with one valuable thing in it', 'bet on a racing beetle in {pl}, and won', 'flipped a run-down inn in {pl} for a profit', 'found a winning ticket on the floor in {pl}, and returned it', 'sold a fake map to a con artist in {pl}, on purpose', 'won a dance contest in {pl} for the prize money', 'collected an old debt in {pl} that everyone had written off'],
    ['won a fortune at the gambling dens in {pl}', 'bought a cursed painting cheap in {pl} and sold it for millions', 'struck gold in a mine near {pl}', 'won a racehorse in a card game in {pl}', 'bought a failing company in {pl} and turned it around', 'broke the bank at a casino in {pl} without cheating, probably', 'found an oil field under a cabbage farm near {pl}', 'invested in a strange invention in {pl} that now everyone owns'],
    ['won an island in a game of dice in {pl}', 'beat a Nen user at a game of chance in {pl} where the stakes were years of life', 'cornered the market on a spice in {pl} for exactly one week', 'bought a whole town near {pl}, then gave it to the people who lived there', 'won back a stolen fortune in {pl} at the thief\'s own table', 'bet {their} license in {pl}, and kept it', 'turned a single coin into a shipping company in {pl} within a year', 'outplayed a crime family\'s accountant in {pl} and bankrupted them legally'],
    ['won a card game in {pl} where the stakes were a whole country', 'beat the house in {pl} that nobody has ever beaten', 'found a mine near {pl} worth more than most nations', 'won a tournament in {pl} where the prize was a wish, and spent it wisely', 'bankrupted a tyrant in {pl} by buying every debt he owed', 'staked everything on one throw in {pl}, and the dice came up right', 'beat a gambler in {pl} who could see the future, by not looking', 'bought the deed to a ruin near {pl} for a song, and found a city under it']
  ],
  Music: [
    ['played a village festival in {pl}', 'tuned every piano in a school in {pl}', 'busked for a week in the squares of {pl}', 'taught a choir of miners in {pl} to sing in harmony', 'found a stolen guitar in a pawnshop in {pl}', 'played at a funeral in {pl} and nobody could stop crying', 'transcribed folk songs from grandmothers in {pl}', 'won a fiddle contest in {pl} against a goat farmer, barely'],
    ['played a sold-out concert in {pl}', 'recovered a stolen legendary violin in {pl}', 'composed a hymn for the people of {pl}', 'found a lost symphony manuscript in {pl}', 'stopped a riot in {pl} by playing', 'recorded the last songs of a dying tribe in {pl}', 'played duets with a master in {pl} who had not performed in thirty years', 'composed a march that ended a strike in {pl}'],
    ['played a melody in {pl} that put an entire army to sleep', 'found the Instrument of the Hundred Strings in a ruin near {pl}', 'broke a curse in {pl} that could only be broken by a song', 'conducted a thousand musicians at once in {pl} with Nen', 'played to a Nen beast in {pl} until it left the valley', 'reconstructed a forbidden song in {pl}, and chose not to play it', 'played at a peace treaty in {pl} and the delegates signed before the encore', 'tracked a song across {pl} that kills anyone who hears it whole'],
    ['played the Lost Requiem in {pl}, the first time in four hundred years', 'played a note in {pl} that cracked a Nen barrier no one could break', 'composed a song in {pl} that half the world now knows by heart', 'silenced a war in {pl} for one night with a single concert', 'found the voice of a singer dead three centuries, recorded in stone near {pl}', 'played to the sea off {pl} until a storm turned back', 'out-played a demon in a duel of instruments in {pl}, according to everyone there', 'wrote the anthem of a country that did not exist yet, in {pl}']
  ],
  Head: [
    ['ran an entrance seminar for candidates in {pl}', 'interviewed applicants for the Association in {pl}', 'settled a contract dispute between two Hunters in {pl}', 'gave a talk in {pl} on surviving the first exam', 'checked the license of a suspicious Hunter in {pl}', 'found a lost recruit sleeping in a station in {pl}', 'refereed a sparring tournament in {pl}', 'wrote a reference letter in {pl} that got someone a job'],
    ['recruited three rookie Hunters in {pl}', 'negotiated a truce between two gangs in {pl}', 'scouted a child prodigy in {pl}', 'ran a training camp for future candidates in {pl}', 'talked a burnt-out Hunter in {pl} out of quitting', 'matched a team of Hunters to an impossible job in {pl}, and it worked', 'trained a whole village watch in {pl} in one summer', 'mediated between the Association and a city council in {pl}'],
    ['hunted down a Hunter-killer near {pl}', 'talked two countries out of a border war in {pl}', 'rebuilt a branch of the Association in {pl} that had collapsed', 'turned a gang in {pl} into the city\'s best security company', 'trained a team in {pl} that went on to win the Centennial', 'broke up a ring selling forged licenses in {pl}', 'protected a witness against the Association itself in {pl}', 'talked a rogue Hunter in {pl} into handing back the license peacefully'],
    ['negotiated the surrender of an entire rebel army in {pl}', 'founded a school in {pl} that now trains a third of all new Hunters', 'held a summit together in {pl} when the Chairman could not', 'found and trained the next generation\'s best Hunter, a child from {pl}', 'stopped a schism in the Association at a meeting in {pl}', 'recruited a former enemy of the Association in {pl} into its ranks', 'brokered a deal in {pl} that opened a route to the Dark Continent', 'talked a Nen master in {pl} out of destroying a city, with words only']
  ]
};

const TIER_MULT = [1, 1.3, 1.6, 2];
const REACH_OK = ['Still {cur}, {n} took a {rs} contract and {job}.', 'Nobody thought {cur} could do it: {n} {job}. That was a {rs} job.', '{n} reached far above {their} rank and {job}. A {rs} contract, done.', 'The {rs} contract was not meant for {cur}. {n} took it anyway, and {job}.'];
const REACH_HURT = ['{n} took a {rs} contract in {pl}, far above {their} rank, and came back on a stretcher.', '{n} tried a {rs} job in {pl}. {They} survived it, which is the best that can be said.', '{n} went after a {rs} contract in {pl} and lost a season to the injuries.'];
const REACH_BACK = ['{n} took on a {rs} contract in {pl} and had to walk away from it. Some jobs are ranked for a reason.', '{n} learned in {pl} why {rs} contracts are ranked {rs}. {They} came back empty-handed, and alive.', '{n} got halfway through a {rs} job in {pl} before calling it off. Nobody blames {them}.'];
const REACH_DIE = ['{n} took a {rs} contract in {pl} that no {cur0} should have touched. {They} did not come back.', '{n} died in {pl}, on a {rs} job far above {their} rank. The contract is still open.', '{n} went into {pl} on a {rs} contract, alone. The Association found {their} license three weeks later.'];
const JOB_FAIL = ['came back empty-handed from {pl}','was injured on a mission in {pl}','lost the trail in {pl}','had a bad year chasing rumours around {pl}','was robbed of {their} whole fee on the road out of {pl}','spent a month in a jail in {pl} on a misunderstanding','followed a fake lead all the way to {pl}','had {their} quarry stolen by a rival Hunter in {pl}','got lost for three weeks around {pl}','lost {their} gear in a flood near {pl}','was hired for a job in {pl} that turned out to be a trap','fell ill for a whole season in {pl}','turned down a dirty job in {pl} and earned nothing'];
// life outside missions: no ranking points, just a fuller record
const LIFE = ['{n} took on a first apprentice.','{n} wrote a memoir. It sold badly, then very well.','{n} got married in a small ceremony in {pl}.','{n} became a parent.','{n} bought an old lighthouse and lives in it between missions.','{n} learned a new language in a single winter.','{n} opened a small dojo in {pl}.','{n} adopted a stray beast that refuses to leave.','{n} spent the year travelling with no mission at all.','{n} went home to {pl} for the first time in years.','{n} started teaching at a school for future Hunters.','{n} took up painting. The results are classified.','{n} moved to {pl} and nobody knows why.','{n} was spotted in Heavens Arena, fighting under a fake name.','{n} gave away most of {their} fortune.','{n} collected a lifetime of debts in {pl}.','{n} trained alone in the mountains for six months.','{n} became a local legend in {pl}.','{n} turned down a seat on a royal council in {pl}.','{n} lost a bet and spent a month working as a waiter in {pl}.','{n} published a field guide that every rookie now carries.','{n} broke a leg falling off a roof in {pl}. Nobody believes the story.'];
const NEN_EV = ['{n} refined {their} Hatsu, {h}, into something far more dangerous.','{n} found a new use for {h} that nobody expected.','{n} mastered a technique {they} had struggled with for years.','{n} finally added a new Vow to {h}, making it stronger.','{n} trained {their} Nen under a waterfall for three months.'];
const SCANDAL = ['{n} had {their} license suspended for a year after a mission in {pl} went wrong.','{n} was fined by the Association for destroying half a district in {pl}.','{n} was accused of taking bribes in {pl}. The inquiry is still open.','{n} was caught selling Hunter-only information in {pl}.','{n} started a bar fight in {pl} that made the evening news.'];
const AWARD = ['{n} received the Association\'s silver medal for service in {pl}.','{n} was named Hunter of the Year by the Hunter Herald.','{n} was invited to lecture at the Association headquarters.','{n} was given the freedom of {pl}.','{n} had a street named after {them} in {pl}.'];
const DEATHS = ['{n} was killed on a mission in {pl}.','{n} died holding a bridge in {pl} so others could escape.','{n} fell in a duel with a Blacklist target in {pl}.','{n} did not come back from the depths beneath {pl}.','{n} was poisoned at a banquet in {pl}.','{n} died saving a child from a beast attack in {pl}.','{n} was ambushed by a Hunter-killer near {pl}.'];
DEATHS.push('{n} was found in {pl} three days after the last radio call. Nobody can say what happened.', '{n} died covering the retreat of a rescue team in {pl}.', '{n} was killed by a trap that had waited a hundred years in {pl}.', '{n} lost a fight {they} should have won in {pl}. One bad step.', '{n} died in {pl}, on a job {they} had called routine.', '{n} was caught in a landslide on the road to {pl}.', '{n} drowned crossing a flooded river near {pl}.', '{n} was stabbed in a crowd in {pl}. The attacker was never found.');
// deaths that fit the work: what each kind of Hunter is most likely to die of
const DEATH_CAREER = {
  Blacklist: ['{n} finally cornered {their} target in {pl}. Only the target walked away.', '{n} was betrayed by an informant and walked into an ambush in {pl}.', '{n} brought in {their} last bounty from {pl} and died of the wounds the same night.', '{n} was killed by the bounty {they} had chased for years, in {pl}.'],
  Treasure: ['{n} triggered the last trap of a tomb in {pl}.', '{n} was buried when the ruins near {pl} collapsed around {them}.', '{n} was killed by rival treasure hunters in {pl}, over a box that turned out to be empty.', '{n} opened the vault in {pl}. What was inside did not want to be found.'],
  Beast: ['{n} was killed by the creature {they} had studied for years, in {pl}.', '{n} stepped between a mother beast and her young in {pl}. It was the last mistake {they} made.', '{n} was found in {pl}, surrounded by the animals {they} had protected. None of them had hurt {them}.', '{n} was trampled by a migrating herd in {pl} while tagging the leaders.'],
  Gourmet: ['{n} tasted a legendary ingredient in {pl}. It turned out to be legendary for a reason.', '{n} died climbing a cliff in {pl} for a mushroom that grows once a decade.', '{n} was poisoned at a cooking duel in {pl}. The rival chef has disappeared.', '{n} was eaten by the ingredient {they} {were} hunting in {pl}.'],
  Ruins: ['{n} went deeper into the ruins near {pl} than anyone before. {Their} rope was found cut.', '{n} read an inscription aloud in {pl}. The chamber sealed itself.', '{n} died in a cave-in at the dig in {pl}, after getting the whole team out first.'],
  Sea: ['{n} was lost with {their} ship in a storm off {pl}.', '{n} dived into the trench off {pl} and did not come back up.', '{n} was taken by something very large in the waters off {pl}.', '{n} went down with the ship off {pl}, last to leave and too late.'],
  Virus: ['{n} was infected by the disease {they} {were} studying in {pl}.', '{n} stayed behind in a quarantine zone in {pl} so the cure could get out. It did. {They} did not.', '{n} died in a lab accident in {pl}. The lab has been sealed.'],
  Lost: ['{n} went looking for a missing child in {pl}. The child was found. {They} {were} not, until spring.', '{n} died of exposure in {pl}, a day from rescue.', '{n} found the lost expedition in {pl} and stayed to guard the survivors. {They} died before the relief came.'],
  Crime: ['{n} was executed by the crime family {they} had been investigating in {pl}.', '{n} testified against a syndicate boss in {pl}. {They} never made it home from court.', '{n} was found in the harbour at {pl}. A message to every Hunter who might follow.', '{n} was shot by a corrupt officer in {pl}, days before the arrests.'],
  Jackpot: ['{n} lost one bet too many in {pl}, and the people {they} owed collected.', '{n} won a fortune in {pl} and did not live to spend it.', '{n} was killed over a rigged game in {pl}.'],
  Music: ['{n} was killed during a concert in {pl}, playing until the last moment.', '{n} was poisoned in {pl} by a patron who wanted a song nobody else could hear.'],
  Head: ['{n} was killed in {pl} protecting the Hunters {they} had trained.', '{n} died negotiating a ceasefire in {pl}. The ceasefire held.']
};
// a Nen ability that asked for too much
const DEATH_NEN = ['{n} pushed {h} past {their} own restriction in {pl}. The vow collected.', '{n} used {h} one time too many in {pl}. {Their} aura gave out.', '{n} died in {pl} when {h} turned on {them} in the middle of a fight.', 'In {pl}, {n} sealed a threat with {h}, at the price {they} had always known it would cost.'];
// a story more than an accident
const DEATH_ROOKIE = ['{n} died on {their} first real mission, in {pl}. The license was barely a year old.', 'Not even a year as a Hunter: {n} was killed in {pl}.', '{n} took a job far above {their} rank in {pl}. Nobody had told {them} no.'];
const DEATH_LAST = ['{n} had agreed to retire after one last job in {pl}. {They} never came back from it.', 'Weeks from retirement, {n} was killed in {pl}.', '{n} died in {pl}, on the mission {they} had promised would be {their} last.'];
const DEATH_ILL = ['{n} died of an illness picked up years ago in {pl}. {They} worked until the last week.', '{n} died in a hospital bed far from {pl}, the place {they} had always meant to go back to.', 'An old wound from {pl} finally took {n}.', '{n} died in {their} sleep at {age}. {Their} notes were open on the table.'];
const DEATH_SHIELD = ['{n} died shielding {o} from an attack in {pl}. {o} survived.', '{n} pushed {o} out of the way in {pl} and took the hit instead.', '{n} and {o} were cornered in {pl}. Only {o} came back, because {n} made sure of it.'];
const DEATH_ROLE = {
  Chairman: ['Chairman {n} was killed in {pl}, leading from the front as always.', 'Chairman {n} died in {pl}. The Association lowers its flags.'],
  'Vice-Chairman': ['Vice-Chairman {n} was killed in {pl}.', 'Vice-Chairman {n} died on a mission in {pl} that {they} refused to delegate.'],
  Zodiac: ['{n}, the Zodiac\'s {z}, was killed in {pl}. The seat sits empty at the next meeting.', '{n}, who held the {z} seat of the Zodiac, died in {pl}.', 'The Zodiac loses its {z}: {n} was killed in {pl}.']
};
const MOURN = ['{o} has not said a word since {n} died.', '{o} took leave from the Association after {n}\'s death. Nobody knows where {they} went.', '{o} swears to finish the job {n} died on.', '{o} carried {n}\'s license home to {n}\'s family personally.', '{o} wears {n}\'s old scarf now, every day.', 'At {n}\'s funeral, {o} speaks for an hour. Nobody interrupts.'];
function deathOf(h, ed, ageNow, area, hot){
  const pl = pickR(PLACES), role = roleOf(h), bonds = (h.bonds || []).map(b => HUNTERS.find(x => x.cid === b.id)).filter(x => x && hActive(x) && !(WORLD.exped && x.exped === WORLD.exped.id));
  const hatsu = h.nen && h.nen.hatsu && (h.nen.hatsu.alias || h.nen.hatsu.name), r = Math.random();
  if(role){ const k = role.startsWith('Zodiac') ? 'Zodiac' : role; return {t: fillH(pickR(DEATH_ROLE[k]).replace('{z}', role.replace('Zodiac · ', '')), h, {pl}), rank: 10}; }
  if(bonds.length && r < 0.15){ const o = pickR(bonds); return {t: fillH(pickR(DEATH_SHIELD).replace(/\{o\}/g, o.name), h, {pl}), o, rank: 10}; }
  if(h.edition >= ed - 1 && r < 0.25) return {t: fillH(pickR(DEATH_ROOKIE), h, {pl})};
  if(ageNow >= 55 && r < 0.3) return {t: fillH(pickR(DEATH_LAST), h, {pl})};
  if(ageNow >= 40 && r < 0.12) return {t: fillH(pickR(DEATH_ILL), h, {pl, age: ageNow})};
  if(hatsu && r < 0.3) return {t: fillH(pickR(DEATH_NEN), h, {pl, h: hatsu})};
  if(hot && r < 0.6) return {t: fillH(`{n} was killed in {pl} during ${CRISES[WORLD.crisis.k].name}.`, h, {pl: WORLD.crisis.pl || pl})};
  if(DEATH_CAREER[area] && r < 0.75) return {t: fillH(pickR(DEATH_CAREER[area]), h, {pl})};
  return {t: fillH(pickR(DEATHS), h, {pl})};
}
// the people left behind
function mournFor(h, ed, add, skip){
  const sp = h.spouse && HUNTERS.find(x => x.license === h.spouse);
  if(sp && sp.status !== 'Deceased'){ sp.spouse = null; sp.widowOf = h.license; sp.widowEd = ed;
    add(sp, 'wed', pro(pickR([`${sp.name} buries ${h.name}, ${pro('{their}', sp)} ${h.gender === 'Female' ? 'wife' : h.gender === 'Male' ? 'husband' : 'spouse'}. The Association sends flowers; ${sp.first || sp.name.split(' ')[0]} sends them back.`, `${sp.name} has lost ${h.name}. They were married ${ed - (h.wedEd || ed) || 'less than a'} year${ed - (h.wedEd || ed) === 1 ? '' : 's'}.`, `Widowed: ${sp.name} keeps ${h.name}'s license in a drawer and does not talk about it.`]), sp), 7, h);
    skip = skip || sp; }
  (h.bonds || []).map(b => HUNTERS.find(x => x.cid === b.id)).filter(o => o && hActive(o) && o !== skip).slice(0, 2).forEach(o => {
    const t = pro(pickR(MOURN).replace(/\{n\}/g, h.name).replace(/\{o\}/g, o.name), o);
    add(o, 'bond', t, 6, h);
  });
}
// ---- ties between Hunters: marriages, reunions, lost licenses and memorials
function tieUp(a, b){ if(!a || !b || a === b || !a.license || !b.license) return; (a.ties = a.ties || {})[b.license] = (a.ties[b.license] || 0) + 1; (b.ties = b.ties || {})[a.license] = (b.ties[a.license] || 0) + 1; }
const surname = h => (h.name || '').split(' ').slice(-1)[0];
function worldTies(ed, add, items){
  const act = HUNTERS.filter(h => hActive(h) && !h.legacy && h.edition < ed), byCid = {}, byLic = {};
  HUNTERS.forEach(h => { if(h.cid) byCid[h.cid] = h; byLic[h.license] = h; });
  // a spouse who died quietly in retirement still leaves someone behind
  HUNTERS.forEach(h => { const o = h.spouse && byLic[h.spouse]; if(o && o.status === 'Deceased' && h.status !== 'Deceased'){ h.spouse = null; h.widowOf = o.license; h.widowEd = o.diedEd ?? ed; if(hActive(h)) add(h, 'wed', `${h.name} has lost ${o.name}. They were married ${Math.max(1, (o.diedEd ?? ed) - (o.wedEd ?? ed))} years.`, 6, o); } });
  // 💍 weddings: bonds from the exam, a rescue, or years of working side by side
  const seen = new Set();
  act.forEach(h => {
    if(h.spouse || hunterAge(h) < 18) return;
    const cand = new Map();
    (h.bonds || []).forEach(b => { const o = byCid[b.id]; if(o && !b.fam) cand.set(o, (cand.get(o) || 0) + 0.012); });
    if(h.savedBy && byCid[h.savedBy]) cand.set(byCid[h.savedBy], (cand.get(byCid[h.savedBy]) || 0) + 0.008);
    Object.entries(h.ties || {}).forEach(([lic, n]) => { const o = byLic[lic]; if(o) cand.set(o, (cand.get(o) || 0) + Math.min(0.015, n * 0.003)); });
    cand.forEach((pr, o) => {
      const key = [h.license, o.license].sort().join('|'); if(seen.has(key)) return; seen.add(key);
      if(h.spouse || o.spouse || !hActive(o) || o.legacy || hunterAge(o) < 18 || Math.abs(hunterAge(o) - hunterAge(h)) > 15 || surname(o) === surname(h) || o.widowEd === ed || h.widowEd === ed) return;
      if(Math.random() >= pr * relMarry(h) * relMarry(o)) return;
      h.spouse = o.license; o.spouse = h.license; h.wedEd = o.wedEd = ed;
      const pl = pickR(PLACES), how = (h.bonds || []).some(b => b.id === o.cid) ? `inseparable since the ${ordinal(h.edition)} exam` : h.savedBy === o.cid ? `ever since ${o.name.split(' ')[0]} pulled ${h.name.split(' ')[0]} through ${h.savedIn ? thePhase(h.savedIn) : 'the exam'}` : 'after years of working side by side';
      add(h, 'wed', pickR([`${h.name} and ${o.name} marry in ${pl}, ${how}. Half the Association attends; the other half sends gifts.`, `Wedding in ${pl}: ${h.name} and ${o.name}, ${how}. The cake survives, barely.`, `${h.name} and ${o.name} are married, ${how}. They spend the honeymoon on a contract in ${pl}.`]), 6, o);
    });
  });
  // a few marriages do not last
  act.forEach(h => { const o = h.spouse && byLic[h.spouse]; if(!o || h.license > o.license || ed - (h.wedEd || ed) < 3 || Math.random() >= 0.004) return;
    h.spouse = o.spouse = null; h.exSpouse = o.license; o.exSpouse = h.license;
    add(h, 'wed', pickR([`${h.name} and ${o.name} separate, quietly. They still take the same contracts.`, `${h.name} and ${o.name} are no longer married. Neither will say why.`]), 4, o); });
  // 🧬 children: married Hunters, both alive, at a plausible age
  WORLD.heirs = WORLD.heirs || [];
  act.forEach(h => { const o = h.spouse && byLic[h.spouse]; if(!o || h.license > o.license || o.status === 'Deceased' || o.status === 'Missing') return;
    const ages = [hunterAge(h), hunterAge(o)], kids = WORLD.heirs.filter(k => k.parents.includes(h.license)).length;
    const line = WORLD.heirs.some(k => k.cid && (k.cid === h.cid || k.cid === o.cid));
    if(Math.min(...ages) < 20 || Math.max(...ages) > 46 || kids >= 3 || Math.random() >= (kids ? 0.05 : 0.09) * (line ? 1.5 : 1) * relKids(h, o)) return;
    const g = Math.random() < 0.47 ? 'Male' : Math.random() < 0.9 ? 'Female' : 'Non-binary', pool = g === 'Male' ? FIRST_M : g === 'Female' ? FIRST_F : FIRST_N;
    const first = pickR(pool), last = surname(Math.random() < 0.5 ? h : o), kid = {id: 'K' + (++WORLD.seq), first, name: `${first} ${last}`, gender: g, born: ed, parents: [h.license, o.license]};
    WORLD.heirs.push(kid);
    add(h, 'wed', `${h.name} and ${o.name} welcome a ${g === 'Male' ? 'son' : g === 'Female' ? 'daughter' : 'child'}, ${first}.`, 4, o);
  });
  // 🧬 a Hunter does not need another Hunter to start a family; a family name pushes the next one in
  const lineDepth = h => { let d = 1, cur = h, guard = 0; while(cur && guard++ < 8){ const k = (WORLD.heirs || []).find(x => x.cid && x.cid === cur.cid); if(!k) break; d++; cur = k.parents.map(l => byLic[l]).find(Boolean); } return d; };
  const CIV = ['a lighthouse keeper', 'a schoolteacher', 'a ship\'s doctor', 'a baker', 'a cartographer', 'a retired soldier', 'a musician', 'a bookseller', 'a tea merchant', 'a carpenter', 'a nurse', 'a fisher'];
  act.forEach(h => { if(h.spouse || h.status !== 'Active Hunter') return; const a = hunterAge(h); if(a < 22 || a > 45) return;
    const kids = WORLD.heirs.filter(k => k.parents.includes(h.license)).length, depth = lineDepth(h); if(kids >= 2) return;
    if(Math.random() >= 0.003 * (depth >= 2 ? 1.6 : 1) * (kids ? 0.5 : 1)) return;
    const g = Math.random() < 0.47 ? 'Male' : Math.random() < 0.9 ? 'Female' : 'Non-binary', pool = g === 'Male' ? FIRST_M : g === 'Female' ? FIRST_F : FIRST_N;
    const first = pickR(pool), kid = {id: 'K' + (++WORLD.seq), first, name: `${first} ${surname(h)}`, gender: g, born: ed, parents: [h.license], civ: pickR(CIV), line: depth};
    WORLD.heirs.push(kid);
    add(h, 'life', `${h.name} has a ${g === 'Male' ? 'son' : g === 'Female' ? 'daughter' : 'child'}, ${first}, with ${kid.civ} from ${pickR(PLACES)}.${depth >= 2 ? ` The ${surname(h)} line goes on.` : ''}`, depth >= 2 ? 6 : 4);
  });
  // 🤝 reunions: who pulled whom through the exam, years later
  act.forEach(h => {
    if(h.reunited || ed - h.edition < 2) return;
    const o = h.savedBy && byCid[h.savedBy], b = !o && (h.bonds || []).map(x => byCid[x.id]).find(x => x && !x.reunited && x.edition === h.edition);
    const m = o || b; if(!m || m.status === 'Deceased' || Math.random() >= (o ? 0.03 : 0.01)) return;
    h.reunited = ed; const pl = pickR(PLACES), Y = ed - h.edition, sav = h.savedIn ? thePhase(h.savedIn) : 'the exam';
    const F = m.name.split(' ')[0], H = h.name.split(' ')[0], tie = Math.max((h.ties || {})[m.license] || 0, (h.log || []).filter(e => e.ed > h.edition && e.text.includes(m.name)).length);
    const bitter = h.exSpouse === m.license || m.exSpouse === h.license || (h.rivals || []).includes(m.cid) || (m.rivals || []).includes(h.cid) || (h.log || []).some(e => e.k === 'rival' && e.text.includes(m.name));
    const close = !bitter && (h.spouse === m.license || (h.bonds || []).some(x => x.id === m.cid) || tie >= 2);
    const T = bitter ? [
        `${h.name} and ${m.name} meet in ${pl}. ${Y} years since ${o ? `${F} pulled ${pro('{them}', h)} through ${sav}` : 'the exam'}; it is the only thing still between them.`,
        `In ${pl}, ${m.name} needs help, and ${h.name} gives it. ${o ? 'The debt from the exam is paid.' : 'For the exam, not for now.'} They part without shaking hands.`,
        `${h.name} sees ${m.name} across a room in ${pl}, and does not cross it. ${Y} years ago it would have been different.`]
      : close ? (!hActive(m) ? [`${h.name} still visits ${m.name} every year, retired now in ${pl}. ${o ? `They never talk about ${sav}.` : 'Same table, same stories.'}`, `${h.name} brings ${F} the first contract of the year, as every year since ${m.name} retired to ${pl}.`]
        : o ? [`${Y} years since ${F} dragged ${H} through ${sav}. In ${pl} they still split every contract down the middle.`, `${H} finally repays the debt from ${sav}: an ambush in ${pl}, and ${pro('{they}', h)} get{s} there first. ${F} says they stopped counting years ago.`, `On the anniversary of the exam, ${h.name} and ${m.name} go back to ${sav}. Neither says why.`]
        : [`${Y} years since the ${ordinal(h.edition)} exam, and ${h.name} and ${m.name} have never once taken a job apart.`, `On the anniversary of the exam, ${h.name} and ${m.name} raise a glass in ${pl}. Same toast every year.`, `${h.name} and ${m.name} open an agency in ${pl}. It was always going to happen.`])
      : !hActive(m) ? [`${h.name} visits ${m.name}, retired now in ${pl}. ${Y} years ago, ${F} carried ${pro('{them}', h)} through ${sav}. They talk until morning.`]
      : o ? [`${Y} years after ${m.name} pulled ${pro('{them}', h)} through ${sav}, ${h.name} returns the favour in ${pl}: an ambush, and ${H} is there first.`, `${h.name} and ${m.name}, who met when ${F} dragged ${pro('{them}', h)} through ${sav}, open an agency together in ${pl}.`, `In ${pl}, ${h.name} recognises ${m.name} across a crowded room: the stranger who saved ${pro('{them}', h)} in ${sav}. They take the next contract together.`]
      : [`${h.name} and ${m.name}, classmates from the ${ordinal(h.edition)} exam, run into each other in ${pl}. They end up sharing a contract, then a dinner, then a plan.`, `${Y} years after the exam, ${h.name} and ${m.name} meet again in ${pl}. It feels like no time has passed.`];
    add(h, 'reunion', pro(pickR(T), h), 5, m);
  });
  // 🪪 a license is worth a fortune: some are sold, some are stolen
  act.forEach(h => {
    if(h.licStolen && !h.licBack && ed - h.licStolen >= 1 && Math.random() < 0.25){ h.licBack = ed; add(h, 'scandal', pickR([`Someone tries to enter the ${ordinal(ed + 1)} exam with ${h.name}'s stolen license. The Association catches them at the door.`, `${h.name}'s stolen license turns up in an auction in ${pickR(PLACES)}. ${pro('{They}', h)} buy{s} it back at three times the price.`, `The thief who took ${h.name}'s license is caught in ${pickR(PLACES)}. The card has been used to get into four private libraries.`]), 4); return; }
    const r = Math.random();
    if(r < 0.0006 + (hStars(h) ? 0 : 0.0006)){ h.status = 'Retired'; h.retEd = ed; h.licSold = ed; retireRec(h, ed, 'sold the license');
      add(h, 'scandal', pickR([`${h.name} sells ${pro('{their}', h)} Hunter License to pay a debt. A single card, enough to live on for the rest of ${pro('{their}', h)} life.`, `${h.name} quietly sells the license in ${pickR(PLACES)} and disappears from the Association's rolls.`, `Broke after a bad year, ${h.name} sells ${pro('{their}', h)} license. The buyer is never identified.`]), 5); }
    else if(r < 0.0016 && r >= 0.0012 && !h.licStolen){ h.licStolen = ed; add(h, 'scandal', pickR([`${h.name}'s Hunter License is stolen in ${pickR(PLACES)}. On the black market it is worth more than a mansion.`, `A pickpocket in ${pickR(PLACES)} lifts ${h.name}'s license. The Association issues a new one, and a warning.`]), 4); }
  });
  // 🏛️ memorials for the great, and the anniversaries that follow
  WORLD.memorials = WORLD.memorials || [];
  HUNTERS.filter(h => h.status === 'Deceased' && h.diedEd === ed && !h.memorial && (h.starCup === 'champion' || (h.pastRoles || []).some(x => x.r === 'Chairman') || (hStars(h) >= 3 && !h.pro && nhash(h.license + 'mem') % 4 === 0))).forEach(h => {
    const k = pickR(['statue', 'memorial', 'garden', 'plaque']), pl = h.home || pickR(PLACES); h.memorial = {ed, pl, k};
    WORLD.memorials.push({lic: h.license, name: h.name, ed, pl, k});
    items.push({lic: h.license, name: h.name, kind: 'memorial', rank: 7, text: ({statue: `A statue of ${h.name} is raised in ${pl}. The sculptor got the eyes right; everyone agrees on that.`, memorial: `A memorial to ${h.name} opens in ${pl}. Hunters leave their licenses on it for a minute, then take them back.`, garden: `A garden in ${pl} is named after ${h.name}. Nothing in it is safe to eat.`, plaque: `A bronze plaque for ${h.name} goes up in ${pl}, where ${pro('{they}', h)} grew up.`})[k]});
  });
  WORLD.memorials.forEach(m => { const y = ed - m.ed; if([10, 25, 50, 100].includes(y)) items.push({lic: m.lic, name: m.name, kind: 'memorial', rank: 4, text: `${y} years since ${m.name} died. On the eve of the ${ordinal(ed + 1)} exam, Hunters leave flowers at the ${m.k} in ${m.pl}.`}); });
}
const MISSING = ['{n} went into {pl} and has not been heard from since.','{n} sailed towards {pl} and never arrived.','{n} sent one last message from {pl}: "Found it." Then nothing.','{n} walked into the fog around {pl} and did not walk out.'];
const RETIRE = ['{n} retires at {age}{st}.','{n} hangs up the license at {age}{st} and moves to {pl}.','{n} retires at {age}{st} to grow vegetables, mostly.','{n} quietly retires at {age}{st}. A party was thrown anyway.','{n} retires at {age}{st}, leaving {their} notes to the Association.'];
const DEBUT = ['{n} begins a career as a {c}.','{n} takes {their} first job as a {c}.','{n} sets off as a {c} the day after the exam.','{n} chooses the life of a {c}.'];
const PROMO = ['{n} is promoted to {st} Hunter.','{n} earns {their} {nth} star: now a {st} Hunter.','The Association names {n} a {st} Hunter.'];
const DUO = ['{n} and {o} teamed up to {job}','{n} and {o}, an unlikely pair, worked together to {job}'];
const RIVAL = ['{n} and {o} chased the same target in {pl}. {n} got there first.','{n} beat {o} to a prize in {pl}. They are not speaking.','{n} and {o} fought a duel over a contract in {pl}. Both claim they won.','{n} saved {o}\'s life in {pl}. {o} has not said thank you.'];
// ---- more variety for the yearly career lines
NEN_EV.push(
  '{n} spent a winter alone in the mountains above {pl}, doing nothing but Ten from sunrise to sunset.',
  '{n} meditated in a cave near {pl} for forty days and came out with sharper aura.',
  '{n} finally learned {tech}, after years of getting it almost right.',
  '{n} trained {tech} with a retired master in {pl}, who called it the worst attempt in forty years, then the best.',
  '{n} broke {their} own Hatsu in a training accident in {pl}, then rebuilt {h} from scratch.',
  '{n} sparred every day for a month against a rival {cat} user in {pl}.',
  '{n} discovered that {h} works differently at night, and spent the year finding out how.',
  '{n} spent a season studying old Nen scrolls in a monastery near {pl}.',
  '{n} trained by holding Zetsu in a crowded market in {pl} for a whole week. Nobody noticed {them}. That was the point.',
  '{n} carried a boulder up and down the hills of {pl} every morning, with Ren held the whole way.',
  '{n} taught {h} to a stranger by accident, then spent the year making sure they could not use it.',
  '{n} fasted for nine days in {pl} to feel {their} aura more clearly.',
  '{n} pushed {their} En out to twenty metres, then thirty, then gave up counting.',
  '{n} lost the use of {h} for a whole season after an injury, and trained the basics like a beginner again.',
  '{n} swam against the current of a river near {pl} with Ken held, every day for two months.',
  '{n} traded techniques with a Hunter from the regional office in {pl}. Both came out better.',
  '{n} trained with weights made of {their} own aura. The weights got heavier every week.',
  '{n} sat under the falls near {pl} until the water stopped feeling cold.',
  '{n} played a hundred games of chess with Gyo active, to train {their} focus. {They} lost most of them.',
  '{n} discovered a weakness in {h} that nobody else had found, and fixed it before anyone could.',
  '{n} trained {their} Nen in the desert near {pl}, where the heat made every mistake hurt.',
  '{n} learned to keep {h} active while asleep. {Their} neighbours complained about the dreams.',
  '{n} spent the year teaching Nen to orphans in {pl}, and learned more than {they} taught.',
  '{n} perfected Ryu in a year of sparring with a {cat} specialist.',
  '{n} made a new vow over {h} at {their} mentor\'s grave.',
  '{n} trained at the top of Heavens Arena for three months, fighting only on the 200th floor.',
  '{n} studied how beasts in {pl} use their aura, and borrowed a trick or two.',
  '{n} held In for a whole year. Not even {their} closest allies knew what {h} could do now.',
  '{n} spent a month in a pitch-black cave training Gyo, until {they} could see aura better than light.',
  '{n} gave {h} a second form, smaller and faster than the first.',
  '{n} studied the {cat} masters of the past in the Association archives and rewrote {their} training from the ground up.',
  '{n} trained {their} Ko against the stone walls of a quarry near {pl}. The quarry is now a lake.',
  '{n} dropped a vow on {h} that no longer felt right, and trained twice as hard to make up for it.',
  '{n} learned to hide {their} aura so well that a Zodiac member walked past {them} in {pl} without noticing.',
  '{n} came back from a year of training in {pl} with a calmer aura and a scar {they} will not explain.'
);
SCANDAL.push(
  '{n} was caught moonlighting for a crime family in {pl}.',
  '{n} lost a fortune at the tables in {pl} and paid with Association funds. {They} paid it back. Mostly.',
  '{n} was photographed shaking hands with a Blacklist suspect in {pl}.',
  '{n} leaked the location of a protected beast in {pl}. Poachers got there first.',
  '{n} was suspended after a public duel in {pl} that left a stadium in ruins.',
  '{n} was accused of faking a rescue in {pl} for the newspapers.',
  '{n} used {their} license to skip a border queue in {pl}, and it went badly viral.',
  '{n} was sued by a museum in {pl} over a relic {they} insist was {theirs} first.',
  '{n} insulted the Chairman in an interview. The Association pretended not to notice.',
  '{n} was caught training a minor in Nen without permission in {pl}.',
  '{n} sold the rights to {their} life story twice, to two different studios.',
  '{n} let a dangerous criminal go in {pl}, saying the reward was too low.',
  '{n} was caught running an unlicensed "Hunter Exam prep school" in {pl}.'
);
AWARD.push(
  '{n} received the Association\'s gold medal after the crisis in {pl}.',
  '{n} was given an honorary doctorate by the university in {pl}.',
  '{n} had a statue unveiled in {pl}. {They} did not attend.',
  '{n} was knighted by the old royal family of {pl}.',
  '{n} was voted the most trusted Hunter in a poll in {pl}.',
  '{n} received a medal from the people of {pl}, made out of melted-down coins they collected.',
  '{n} was asked to write the Association\'s new field manual.',
  '{n} was invited to examine the next Hunter Exam, an honour {they} accepted with a grin.',
  '{n} had a newly discovered species named after {them} in {pl}.',
  '{n} was given a lifetime pass to every museum in {pl}.',
  '{n} received the Netero Prize for Hunting, the oldest award the Association gives.',
  '{n} was thanked in person by the families of everyone {they} saved in {pl}.'
);
DEATHS.push(
  '{n} was caught in a rockslide in {pl}. {Their} last message was a joke.',
  '{n} died fighting a beast nobody had ever recorded, deep in {pl}.',
  '{n} was betrayed by a client in {pl} and did not see it coming.',
  '{n} drowned crossing a flooded river near {pl}, after getting everyone else across.',
  '{n} died in a fire in {pl}, carrying the last child out.',
  '{n} was killed by a sniper in {pl} while negotiating a surrender.',
  '{n} died alone in {pl}, and was only found when {their} hawk flew home without {them}.',
  '{n} fell from a cliff near {pl} while chasing a target. The target was caught the same day.',
  '{n} died of {their} wounds on the boat home from {pl}.',
  '{n} was killed in {pl} by someone {they} had spared years before.'
);
MISSING.push(
  '{n} took a job in {pl} that paid in advance. That was the last anyone heard.',
  '{n}\'s camp in {pl} was found intact, with the fire still warm.',
  '{n} went into {pl} to look for a missing Hunter, and is now missing too.',
  '{n} boarded a train to {pl}. The train arrived. {n} did not.',
  '{n} said {they} would be back in a week from {pl}. That was a long time ago.',
  '{n} vanished in {pl} the night of the eclipse.',
  '{n}\'s license was found on a market stall in {pl}. Nobody remembers who sold it.',
  '{n} followed a map into {pl}. The map was found. {n} was not.',
  '{n} was last seen in {pl}, walking towards the sea, smiling.'
);
RETIRE.push(
  '{n} retires at {age}{st} and opens a noodle shop in {pl}.',
  '{n} retires at {age}{st} and finally reads all the books {they} bought.',
  '{n} retires at {age}{st} to train {their} grandchildren, who did not ask for it.',
  '{n} retires at {age}{st}. {Their} last report is three words long.',
  '{n} retires at {age}{st} and moves to a lighthouse near {pl}.',
  '{n} retires at {age}{st} after one last job, which, against all odds, really was the last.',
  '{n} retires at {age}{st} and writes the memoir everyone has been waiting for.',
  '{n} retires at {age}{st}. The license goes in a frame above the fireplace.',
  '{n} retires at {age}{st} and is seen at every Hunter Exam after, cheering for the youngest.'
);
DEBUT.push(
  '{n} starts out as a {c}, with no money and a lot of confidence.',
  '{n} signs on with an older crew as a {c}.',
  '{n} spends the license\'s first month figuring out how to be a {c}.',
  '{n} becomes a {c}, as {they} always said {they} would.',
  '{n} becomes a {c}. {Their} family had hoped for something safer.',
  '{n} picks the {c} path on the boat home from the exam.',
  '{n} joins an Association office in {pl} as a junior {c}.',
  '{n} becomes a {c}, mostly to prove a point to an old teacher.'
);
PROMO.push(
  '{n} is now a {st} Hunter, after a year nobody will forget.',
  'With {their} {nth} star, {n} joins the ranks of the {st} Hunters.',
  '{n} earns a {nth} star. The ceremony is short; the party is not.',
  'The Association confirms it: {n} is a {st} Hunter.',
  '{n} receives {their} {nth} star by letter. {They} read it twice.',
  '{n}\'s {nth} star comes after a decade of quiet, careful work.',
  '{n} is promoted to {st} Hunter. Rivals send flowers, mostly sincere.'
);
DUO.push(
  '{n} and {o}, old friends from the exam, set out to {job}',
  '{n} hired {o} for one job: to {job}',
  '{n} and {o} split the fee after they managed to {job}',
  '{n} and {o} argued the whole way, but still managed to {job}',
  '{n} needed a partner, and {o} was free. Together they set out to {job}',
  '{n} and {o} made a bet over who would {job}. They ended up doing it together.'
);
RIVAL.push(
  '{n} and {o} both claimed the same bounty in {pl}. The Association split it. Neither is happy.',
  '{n} outbid {o} for a rare relic at an auction in {pl}.',
  '{n} and {o} met again in {pl}, on opposite sides of the same job.',
  '{n} got to the treasure in {pl} first. {o} got to the newspapers first.',
  '{n} and {o} raced to rescue the same hostage in {pl}. They had to work together in the end.',
  '{n} bested {o} in a public sparring match in {pl}. The rematch is already scheduled.',
  '{n} and {o} competed for the same apprentice in {pl}. The apprentice chose neither.',
  '{n} tipped off the authorities before {o} could collect a bounty in {pl}.',
  '{n} and {o} spent a whole week in {pl} trying to outdo each other. The town will never be the same.'
);
MOURN.push(
  '{o} keeps {n}\'s seat empty at every Association dinner.',
  '{o} named {their} next apprentice after {n}.',
  '{o} finished the map {n} had been drawing, and signed it with both their names.',
  '{o} goes back every year to the place where {n} died.',
  '{o} took over {n}\'s unfinished contracts, one by one.',
  '{o} has not used {their} own Hatsu since {n} died.',
  '{o} paid for {n}\'s funeral and would not let anyone else help.',
  '{o} retold the story of how they met {n} in the exam to everyone at the wake.'
);
DEATH_ILL.push(
  '{n} died at {age}, after a long illness {they} never let slow {them} down.',
  '{n} spent {their} last months writing letters to everyone {they} had worked with. Then {they} died, at {age}.',
  'A fever from {pl} took {n} at {age}, years after the job that caused it.',
  '{n} died at home at {age}, with {their} license on the bedside table.'
);
DEATH_LAST.push(
  '{n} had already packed for retirement. The call from {pl} came the day before.',
  '{n} said yes to one more job in {pl}, for an old friend. It was the last.',
  '{n} died in {pl}, three days before {their} farewell party.',
  '"Just this one," {n} said about the job in {pl}. It was.'
);
DEATH_ROOKIE.push(
  '{n} died in {pl} on a mission {their} first employer lied about.',
  '{n}, barely licensed, walked into {pl} without backup. {They} did not walk out.',
  '{n}\'s first big job, in {pl}, was also {their} last.',
  'The license had not even been framed yet: {n} died in {pl}.'
);
DEATH_NEN.push(
  '{n} poured everything into one last {h} in {pl}. It was the strongest it had ever been.',
  'The vow behind {h} finally called in its debt, in {pl}. {n} paid it.',
  '{n} broke the one rule of {h} to save the others in {pl}, knowing exactly what it meant.',
  '{n} overloaded {h} in {pl}. Witnesses say the light could be seen for miles.'
);
DEATH_SHIELD.push(
  '{n} stood in front of {o} in {pl} without a second thought. {o} has had a lot of second thoughts since.',
  '{n} held the door in {pl} until {o} was through. Then it closed.',
  '{n} took the blade meant for {o} in {pl}, and smiled.',
  '{n} told {o} to run in {pl}. For once, {o} listened.'
);
JOB_FAIL.push(
  'was paid in counterfeit money after a job in {pl}',
  'missed the target in {pl} by an hour',
  'spent the whole year on a case in {pl} that went nowhere',
  'was hired, fired and hired again for the same job in {pl}',
  'had to abandon a hunt in {pl} after a sudden storm',
  'chased a legend through {pl} that turned out to be a hoax',
  'lost a client to a cheaper Hunter in {pl}',
  'was stuck in quarantine in {pl} for half the year',
  'broke an arm in {pl} and spent months healing',
  'spent the fee on repairs after a disaster in {pl}',
  'found the treasure in {pl}, then had to give it to the government'
);
LIFE.push(
  '{n} got married in {pl}. Half the guests were Hunters, and the cake did not survive.',
  '{n} adopted a beast cub nobody else wanted.',
  '{n} learned to cook, badly, then well.',
  '{n} bought a small house in {pl} and actually lived in it for a month.',
  '{n} reconciled with a sibling {they} had not spoken to in years.',
  '{n} took up painting. The paintings are worse than {their} Nen, and {they} know it.',
  '{n} became a parent.',
  '{n} visited {their} home town for the first time since the exam.',
  '{n} spent a whole year without taking a single job, and does not regret it.',
  '{n} started writing letters to the next generation of applicants.',
  '{n} learned three new languages on the road.',
  '{n} got a tattoo in {pl} to mark ten years of the license.'
);
// more small lives, so a long world does not keep telling the same few
LIFE.push(
  '{n} spent a winter as a lighthouse keeper on a rock off {pl}, and came back talking to gulls.',
  '{n} rebuilt a collapsed bridge in {pl} with {their} own hands, mostly out of spite.',
  '{n} lost a whole season to a board game tournament in {pl}, and won it.',
  '{n} was mistaken for a famous actor in {pl} and played along for a week.',
  '{n} grew a garden on the roof of an inn in {pl}. The innkeeper still waters it.',
  '{n} took a vow of silence for a month. Nobody noticed for the first two weeks.',
  '{n} carved a chess set out of beast bone and refuses to play with it.',
  '{n} judged a beauty contest for pigs in {pl}. {They} take{s} it very seriously.',
  '{n} spent the off-season copying old maps in a monastery near {pl}.',
  '{n} taught a village in {pl} to swim after the river flooded.',
  '{n} got lost on purpose in {pl} for a month, to see if {they} still could.',
  '{n} was banned from every casino in {pl}. {They} only played once.',
  '{n} delivered a baby on a stalled train outside {pl}.',
  '{n} wrote an opera about the Hunter Exam. The examiners hated it.',
  '{n} adopted a retired racing bird with a terrible temper.',
  '{n} spent the year apprenticed to a blacksmith in {pl}, just to learn something with {their} hands.',
  '{n} ran a noodle stall in {pl} for a summer, under a false name.',
  '{n} climbed the tallest peak near {pl} alone, then took the cable car down.',
  '{n} returned a library book borrowed before the exam. The fine was enormous.',
  '{n} found {their} childhood home in {pl} turned into a museum of something else entirely.',
  '{n} trained a pack of street dogs in {pl} into something close to an army.',
  '{n} lost a duel of riddles to a child in {pl}, and is still thinking about it.',
  '{n} spent a season guarding a vineyard in {pl}. The wine was worth it.',
  '{n} broke {their} own record for days without sleep, and does not recommend it.',
  '{n} was knighted by a very small kingdom near {pl} for reasons nobody can explain.',
  '{n} kept a diary of every beast {they} met that year. It is mostly drawings of teeth.',
  '{n} spent a month teaching basic Ten to orphans in {pl}, very carefully.',
  '{n} went back to the exam site as a tourist, and got lost in the same place as before.'
);
// marriages and children have their own story in the world; the generic lines would contradict it
for(let i = LIFE.length - 1; i >= 0; i--) if(/became a parent|got married/.test(LIFE[i])) LIFE.splice(i, 1);
// some lives are ordinary, some should happen to almost nobody: the rare ones are drawn less often, and once told they rest for forty years
const LIFE_RARE = /lighthouse|Heavens Arena|royal council|fortune|memoir|field guide|local legend|knighted|opera|tattoo|museum|army|delivered a baby|banned from every casino/;
function lifePick(h){
  const ed = S.edition, rest = WORLD.lifeRest = WORLD.lifeRest || {}, mine = h.lifeU = h.lifeU || [];
  const pool = LIFE.map((t, i) => [t, i]).filter(([t, i]) => !mine.includes(i) && !(LIFE_RARE.test(t) && rest[i] > ed - 40));
  if(!pool.length) return null;
  const [t, i] = wpickM(pool, ([t]) => LIFE_RARE.test(t) ? 0.3 : 1);
  mine.push(i); if(mine.length > 12) mine.shift();
  if(LIFE_RARE.test(t)) rest[i] = ed;
  return t;
}
const toBase = t => t.replace(/^(brought|tracked|collected|dragged|caught|ended|captured|took|cleared|arrested|talked|recovered|opened|found|solved|outbid|dug|catalogued|calmed|saved|tamed|raised|stopped|discovered|led|was|studied|returned|cooked|won|invented|exposed|rescued|tasted|mapped|deciphered|proved|restored|escaped|charted|dove|sank|sailed|contained|isolated|got|traced|quarantined|spent|vaccinated|reunited|went|cracked|bought|struck|broke|sold|played|composed|recorded|discovered|recruited|negotiated|hunted|scouted|ran|settled|convinced|trained)\b/, w => BASEV[w] || w);
const BASEV = {trained:'train',brought:'bring',tracked:'track',collected:'collect',dragged:'drag',caught:'catch',ended:'end',captured:'capture',took:'take',cleared:'clear',arrested:'arrest',talked:'talk',recovered:'recover',opened:'open',found:'find',solved:'solve',outbid:'outbid',dug:'dig',catalogued:'catalogue',calmed:'calm',saved:'save',tamed:'tame',raised:'raise',stopped:'stop',discovered:'discover',led:'lead',was:'be',studied:'study',returned:'return',cooked:'cook',won:'win',invented:'invent',exposed:'expose',rescued:'rescue',tasted:'taste',mapped:'map',deciphered:'decipher',proved:'prove',restored:'restore',escaped:'escape',charted:'chart',dove:'dive',sank:'sink',sailed:'sail',contained:'contain',isolated:'isolate',got:'get',traced:'trace',quarantined:'quarantine',spent:'spend',vaccinated:'vaccinate',reunited:'reunite',went:'go',cracked:'crack',bought:'buy',struck:'strike',broke:'break',sold:'sell',played:'play',composed:'compose',recorded:'record',recruited:'recruit',negotiated:'negotiate',hunted:'hunt',scouted:'scout',ran:'run',settled:'settle',convinced:'convince'};
const fillH = (t, h, x) => pro(t.replace(/\{n\}/g, h.name).replace(/\{pl\}/g, () => plText((x && x.pl) || pickR(PLACES))).replace(/\{o\}/g, (x && x.o) || '').replace(/\{h\}/g, (x && x.h) || 'their ability').replace(/\{age\}/g, (x && x.age) || '').replace(/\{st\}/g, (x && x.st) || '').replace(/\{c\}/g, (x && x.c) || 'Hunter').replace(/\{nth\}/g, (x && x.nth) || '').replace(/\{job\}/g, (x && x.job) || ''), h);
const pickR = a => a[Math.floor(Math.random() * a.length)];
// epilogues: what became of each Hunter's reason for taking the exam (same order as the motives)
const RESOLVE = ['{n} finally tracked down the Blacklist target who killed {their} brother.','{n} paid off the family debt in full.','{n} found the parent who left to become a Hunter. The reunion was complicated.','{n} entered the sealed ruins at last and came out with a discovery.',"{n}'s strict family finally admitted they were wrong.",'{n} brought the Hunter-only medicine home. {Their} sister is recovering.','{n} returned to the village a Hunter once saved, and saved it in turn.','{n} signed {their} first big sponsorship deal.','{n} hunted down the beast that destroyed the family farm.',"{n} earned a seat at the Gourmet Hunters' table.",'{n} recovered the stolen family heirloom.','{n} is, for the first time in years, not bored.','{n} collected on the bet with an old friend.','{n} never went back to the life someone else had planned for {them}.',"{n} is training a younger sibling for next year's exam.","{n}'s fighting style now has students of its own.",'{n} spent a whole year inside the forbidden archive.','{n} finally faced {their} old partner as an equal.',"{n} laid {their} license on {their} mentor's grave.",'{n} saved the orphanage from closing.','{n} crossed every border that was once closed to {them}.','{n} found proof that the legendary treasure is real.','{n} cleared the family name in front of everyone.','{n} brought down the gang that burned {their} home.','{n} keeps going further, just to see how far.','{n} went back to thank the fortune teller.',"{n}'s famous parent sent a short letter: 'Proud of you.'",'{n} found the lost expedition, alive.','{n} has not set foot in the old city since.','{n} opened a sanctuary for endangered beasts.','{n} found the Hunter who saved {them} and finally said thank you.','{n} bought back the family sword from a collector.','{n} found the truth about the village in the Hunter archives.','{n} kept the promise made to {their} mother.','{n} drove the poachers off the island for good.','{n} has not been pushed around since.','{n} was finally noticed. It was not as good as expected.','{n} rebuilt the school and taught the first class.','{n} finished {their} grandfather\'s map of the coast.','{n} found the stranger who paid the entry fee.','{n} beat the older sibling at last, in front of everyone.','{n} brought home the cure only Hunters can buy.'];
/* ===== The world between exams: crises, the Blacklist hunt, the Dark Continent, bonds, rivals, avengers ===== */
const CRISES = {
  plague:{name:'the Grey Fever', areas:['Virus','Lost'], theme:'silence', start:['The Grey Fever breaks out in {pl}. Virus Hunters are called in from every continent.'], hero:['{n} works through the Grey Fever quarantine in {pl} without sleeping.','{n} finds a sick village nobody else could reach in {pl}.'], after:'After a year of plague, candidates keep their distance from each other. Nobody shares a canteen.'},
  war:{name:'the Border War', areas:['Blacklist','Crime','Head'], theme:'blood', start:['War breaks out around {pl}. The Association declares neutrality, and nobody believes it.'], hero:['{n} gets a convoy of civilians out of {pl} under fire.','{n} slips behind the lines in {pl} to bring back a kidnapped envoy.'], after:'The war has left its mark. Some of this year\'s examiners have just come back from the front.'},
  beasts:{name:'the Great Stampede', areas:['Beast','Lost'], theme:'wild', start:['Something drives the beasts of {pl} out of the forests. Whole towns are evacuated.'], hero:['{n} turns a stampede away from {pl} with nothing but a whistle and nerve.','{n} tracks the cause of the stampede deep into {pl}.'], after:'After the Great Stampede, the exam site still smells of beasts. Some of them never went home.'},
  storms:{name:'the Year of Storms', areas:['Sea','Lost'], theme:'storm', start:['A season of storms shuts every port near {pl}. Ships disappear by the dozen.'], hero:['{n} brings a lost ship home through the storms off {pl}.','{n} pulls survivors out of the sea near {pl} for three days straight.'], after:'The storms have not fully passed. Black clouds hang over the exam site.'},
  gold:{name:'the Gold Rush', areas:['Treasure','Jackpot','Ruins'], theme:'jubilee', start:['A vein of gold is found under {pl}. Half the world rushes in.'], hero:['{n} stakes the richest claim in {pl}, and survives the people who wanted it.','{n} keeps the peace between rival prospectors in {pl}.'], after:'Money from the Gold Rush pours into the Association. This year, the gates feel a little wider.'},
  famine:{name:'the Long Famine', areas:['Gourmet','Head'], theme:'friendship', start:['Crops fail across {pl}. The Gourmet Hunters are asked to find food where there is none.'], hero:['{n} finds an edible root that feeds all of {pl} through the winter.','{n} organises a food line in {pl} that runs for months.'], after:'After the famine, the candidates are thinner, and kinder to each other.'},
  syndicate:{name:'the Syndicate Wars', areas:['Crime','Blacklist','Jackpot'], theme:'shadows', start:['The crime syndicates of {pl} go to war with each other. The streets empty at night.'], hero:['{n} brings down a syndicate boss in {pl}.','{n} goes undercover in {pl} and comes out with names.'], after:'Rumour says syndicate spies have registered for this exam. Everyone looks at everyone else.'}
};
const OUTLAW_FIRST = ['Varko','Mirela','Dax','Sefa','Ludo','Kesh','Ruta','Brann','Ivet','Corvo','Nell','Tasso','Zhen','Orla','Malik','Pell'];
const OUTLAW_TITLE = ['the Butcher of {pl}','the Smiling Knife','the Ash Widow','the Bone Collector','the Toll Man','the Lantern Killer','Nine Fingers','the Quiet Fire','the Debt Collector','the Sandman of {pl}'];
const kindName = c => c.status === 'Disqualified' && /sabotag/.test(c.reason || '') ? 'sabotage' : c.status === 'Disqualified' && /spy/.test(c.reason || '') ? 'spy' : c.kills ? 'killer' : c.nickKind === 'viper' ? 'traitor' : 'killer';
const FALL = {
  sabotage: '{x}, thrown out of the {e} Hunter Exam for sabotaging rookies, has turned to crime. A bounty is posted.',
  spy: '{x}, the syndicate spy expelled from the {e} Hunter Exam, resurfaces running a crime ring. The Association adds {them} to the Blacklist.',
  killer: '{x}, who killed during the {e} Hunter Exam and never got a license, is now wanted for murder.',
  traitor: '{x}, the traitor of the {e} Hunter Exam, sells out a whole village to bandits. The Blacklist has a new name.'
};
/* ===== Places with a memory: every place has a state that changes, and a short history ===== */
const PSTATE = {   // state → how a sentence describes the place while it lasts
  war: 'war-torn', plague: 'quarantined', beasts: 'beast-stricken', storms: 'storm-battered', boom: 'booming', famine: 'starving', gangs: 'gang-ridden',
  ruins: 'ruined', rebuilding: 'rebuilding', festival: 'festive', flood: 'flooded', drought: 'parched'
};
const CRISIS_ST = {plague: 'plague', war: 'war', beasts: 'beasts', storms: 'storms', gold: 'boom', famine: 'famine', syndicate: 'gangs'};
// the middle of a long crisis: one line a year, sometimes spreading to a second place
const CRISIS_MID = {
  plague: ['The Grey Fever reaches {pl2}. The roads between the two are closed.', 'A second wave of the Grey Fever hits {pl}. The doctors are the ones falling sick now.', 'The Grey Fever is in its {y} year. In {pl}, the bells ring for the dead every evening.'],
  war: ['The Border War spreads to {pl2}. Refugees fill the roads.', 'The front around {pl} has not moved in a year. Neither side will talk.', 'A ceasefire in {pl} lasts eleven days. The Border War goes on.'],
  beasts: ['The stampede turns towards {pl2}. The town empties in a night.', 'Whatever drove the beasts out of {pl} is still there. Nobody who went in to look has come back.', 'The beasts of {pl} have started nesting in the empty towns.'],
  storms: ['The storms move north and close the ports of {pl2}.', 'A second year of storms off {pl}. The fishing fleet has stopped going out.', 'The sky over {pl} has not cleared in a hundred days.'],
  gold: ['The Gold Rush spreads to {pl2}. A tent city grows overnight.', 'In {pl}, a claim is worth more than a life this year.', 'Gold from {pl} floods the markets. Prices are rising everywhere.'],
  famine: ['The famine reaches {pl2}. The granaries are empty.', 'A second failed harvest in {pl}. Families leave for the cities.', 'The Long Famine is in its {y} year. {pl} is living on Gourmet Hunter rations.'],
  syndicate: ['The Syndicate Wars spill into {pl2}.', 'Three syndicate bosses fall in {pl} in a single month. The fourth gets stronger.', 'In {pl}, the syndicates now collect taxes. The police pay them too.']
};
// how it ends: what the place becomes, and how the news reads
const CRISIS_END = {
  plague: [['peace', 'The Grey Fever is over. A cure from the Virus Hunters reaches {pl} just in time.'], ['rebuilding', 'The Grey Fever burns out on its own. {pl} buries its dead and opens its gates.'], ['ruins', 'The Grey Fever ends because there is nobody left in parts of {pl} to catch it.']],
  war: [['rebuilding', 'A treaty is signed. The Border War ends, and {pl} starts to rebuild.'], ['ruins', 'The Border War ends with {pl} in ruins. Nobody can say who won.'], ['peace', 'The Border War ends quietly, with both armies simply going home from {pl}.']],
  beasts: [['rebuilding', 'The cause of the stampede is found deep in {pl} and dealt with. People start to go home.'], ['peace', 'The beasts go back into the forests of {pl} as suddenly as they came out.'], ['ruins', 'The beasts keep {pl}. The towns are abandoned for good.']],
  storms: [['peace', 'The storms over {pl} finally break. The ports reopen.'], ['rebuilding', 'The storms end. {pl} counts the ships that never came back, and rebuilds the harbour.']],
  gold: [['peace', 'The gold under {pl} runs out. The rush is over as fast as it began.'], ['boom', 'The Gold Rush settles down. {pl} is rich now, and plans to stay that way.'], ['ruins', 'The mines of {pl} collapse. The Gold Rush ends in dust.']],
  famine: [['peace', 'The rains return. The Long Famine is over, and {pl} eats again.'], ['rebuilding', 'The Long Famine ends. {pl} is half as big as it was.']],
  syndicate: [['peace', 'The Syndicate Wars end with one family on top in {pl}. The streets are quiet. Too quiet.'], ['peace', 'The last syndicate boss of {pl} is behind bars. The Association takes the credit.'], ['gangs', 'The Syndicate Wars die down, but {pl} still belongs to the gangs.']]
};
// small, local turns of fortune: no crisis, but the place changes
const LOCAL_EV = [
  ['flood', 'ruins', 'A flood sweeps through {pl}. Half the town is under water.'],
  ['fire', 'ruins', 'A great fire burns through {pl} for three days.'],
  ['quake', 'ruins', 'An earthquake levels part of {pl}.'],
  ['festival', 'festival', 'The Festival of Lanterns returns to {pl} after a hundred years. Everyone is invited.'],
  ['route', 'boom', 'A new trade route opens through {pl}. Money and strangers pour in.'],
  ['drought', 'drought', 'A drought settles over {pl}. The wells are running low.']
];
const capS = s => s.replace(/(^|[.!?] )the /g, (m, a) => a + 'The ');   // a place name that starts a sentence
const plState = pl => (WORLD.places && WORLD.places[pl]) || null;
function setPlace(pl, st, ed, text){
  const P = WORLD.places = WORLD.places || {};
  const p = P[pl] = P[pl] || {st: 'peace', hist: []};
  p.st = st; p.since = ed;
  if(text) { p.hist.push({ed, text}); if(p.hist.length > 10) p.hist = p.hist.slice(-10); }
}
// sentences name places as they are right now: "the war-torn Zaban islands", "booming Kett"
const plText = pl => { const p = plState(pl); if(!p || p.st === 'peace' || !PSTATE[p.st] || Math.random() < 0.65) return pl; const a = PSTATE[p.st]; return /^the /.test(pl) ? 'the ' + a + ' ' + pl.slice(4) : a + ' ' + pl; };
// Hunters are sent where things are happening
const pickPlace = area => { const C = WORLD.crisis; if(C && CRISES[C.k] && CRISES[C.k].areas.includes(area) && Math.random() < 0.5) return Math.random() < 0.7 || !C.pl2 ? C.pl : C.pl2; return pickR(PLACES); };
const homeOf = h => h.home || (h.home = pickR(PLACES));
// a hometown in trouble shows up in its Hunters' lives
function hometownNews(pl, st, ed, add){
  const T = {war: 'is at war', plague: 'is under quarantine', beasts: 'has been overrun by beasts', storms: 'is cut off by the storms', famine: 'is starving', gangs: 'belongs to the gangs now', ruins: 'lies in ruins', boom: 'is booming', festival: 'is celebrating', drought: 'is in drought'}[st];
  if(!T) return;
  HUNTERS.filter(h => hActive(h) && !h.legacy && h.home === pl).slice(0, 2).forEach(h => {
    const good = st === 'boom' || st === 'festival';
    add(h, good ? 'life' : 'epilogue', pro(pickR(good ? [`${h.name}'s hometown, ${pl}, ${T}. {They} went back for the first time in years.`, `${h.name} sends money home to ${pl}, which ${T} for once.`]
      : [`${h.name}'s hometown, ${pl}, ${T}. {They} went back to help.`, `${h.name} spends the year in ${pl}, where {they} grew up, which ${T}.`, `${h.name} gets the family out of ${pl}, {their} hometown, which ${T}.`]), h), good ? 2 : 6);
  });
}
// the world turns: crises run their course; places fall, recover, celebrate
function placesYear(ed, add, items){
  const P = WORLD.places = WORLD.places || {};
  // recovery: ruins become rebuilding, rebuilding and passing states settle back into peace
  Object.entries(P).forEach(([pl, p]) => {
    if(WORLD.crisis && (WORLD.crisis.pl === pl || WORLD.crisis.pl2 === pl)) return;
    const yrs = ed - (p.since || ed);
    if(p.st === 'ruins' && yrs >= 2 && Math.random() < 0.35){ setPlace(pl, 'rebuilding', ed, `Rebuilding begins in ${pl}.`); items.push({lic: '', name: '', kind: 'place', text: pickR([`Rebuilding begins in ${pl}. The first new roofs go up.`, `People are moving back to ${pl}.`]), rank: 4}); }
    else if(p.st === 'rebuilding' && yrs >= 3 && Math.random() < 0.3){ setPlace(pl, 'peace', ed, capS(`${pl} is whole again.`)); items.push({lic: '', name: '', kind: 'place', text: capS(`${pl} is whole again, ${yrs} years after the work began.`), rank: 3}); }
    else if(['festival'].includes(p.st) && yrs >= 1) setPlace(pl, 'peace', ed);
    else if(['boom', 'drought', 'gangs'].includes(p.st) && yrs >= 3 && Math.random() < 0.3) setPlace(pl, 'peace', ed, p.st === 'boom' ? `The boom in ${pl} fades.` : p.st === 'drought' ? `The rains return to ${pl}.` : `The gangs lose their grip on ${pl}.`);
  });
  // now and then, something happens to a quiet place
  if(Math.random() < 0.35){
    const pl = pickR(PLACES.filter(x => !plState(x) || plState(x).st === 'peace')), ev = pickR(LOCAL_EV);
    if(pl){ const t = capS(ev[2].replace('{pl}', pl)); setPlace(pl, ev[1], ed, t); items.push({lic: '', name: '', kind: 'place', text: t, rank: 6}); hometownNews(pl, ev[1], ed, add);
      // someone from the Association goes to help
      const area = ev[1] === 'ruins' ? 'Head' : ev[1] === 'drought' ? 'Gourmet' : null;
      const h = area && pickR(HUNTERS.filter(x => hActive(x) && !x.legacy && (x.career || '').startsWith(area)));
      if(h){ h.rp = (h.rp || 0) + 30; add(h, 'epilogue', `${h.name} spends the year helping ${pl} after the ${ev[0] === 'drought' ? 'drought' : ev[0]}.`, 4); }
    }
  }
}
// discoveries: a Hunter who finds something new can leave a name on the map
function maybeDiscover(h, ed, add, job){
  // rare: a few times a century, never two in a row
  if(!/found|discovered|uncovered|mapped|dug up|opened/.test(job) || (WORLD.lastDisc && ed - WORLD.lastDisc < 8) || Math.random() > 0.004 * relDisc(h)) return;
  WORLD.lastDisc = ed;
  const last = h.name.split(' ').slice(-1)[0], kind = pickR(['Ruins', 'Rift', 'Caverns', 'Falls', 'Pass', 'Reef', 'Grotto', 'Basin', 'Spire', 'Hollow']);
  const name = pickR([`the ${last} ${kind}`, `${last}'s ${kind}`]);
  if(PLACES.includes(name)) return;
  PLACES.push(name); (WORLD.newPlaces = WORLD.newPlaces || []).push(name);
  setPlace(name, 'peace', ed, `Discovered by ${h.name} after the ${ordinal(ed)} exam.`); WORLD.places[name].found = {ed, lic: h.license, by: h.name};
  h.rp = (h.rp || 0) + 50;
  add(h, 'award', pickR([`${h.name} finds a place no map has ever shown. The Association names it ${name}.`, `A new name goes on the world map: ${name}, after the Hunter who found it, ${h.name}.`]) + deedNick(h, ['Pathfinder', 'the Cartographer', 'Blank-Map', 'Compass'], `for finding ${name}`), 8);
  if(Math.random() < 0.5) relicFromRuins(h, ed, add, null, name);
}
function worldStart(prev, ed, add, busy, items){
  const W = {crisis: null};
  const act = HUNTERS.filter(h => hActive(h) && !h.legacy);
  // former candidates who turned bad join the Blacklist
  (prev.candidates || []).filter(c => c.status !== 'Approved' && ((c.status === 'Disqualified' && /sabotag|spy/.test(c.reason || '')) || ((c.kills || ['viper', 'ghost'].includes(c.nickKind)) && c.status !== 'Disqualified'))).slice(0, 2).forEach(c => {
    if(Math.random() > 0.6 || WORLD.wanted.some(w => w.cid === c.id)) return;
    c.noReturn = true;
    const k = kindName(c), w = {id: 'W' + (++WORLD.seq), cid: c.id, name: c.name, gender: c.gender, nick: c.nick || null, danger: k === 'killer' ? 3 : k === 'sabotage' ? 1 : 2, from: prev.edition, status: 'wanted'};
    WORLD.wanted.push(w);
    items.push({lic: '', name: '', kind: 'hunt', text: pro(FALL[k].replace('{x}', w.name + (w.nick ? ` ("${w.nick}")` : '')).replace('{e}', ordinal(prev.edition)), c), rank: 7});
  });
  // the Blacklist is never empty
  while(WORLD.wanted.filter(w => w.status === 'wanted').length < 3){
    const pl = pickR(PLACES), w = {id: 'W' + (++WORLD.seq), name: `${pickR(OUTLAW_FIRST)} ${pickR(LAST)}`, gender: Math.random() < 0.5 ? 'Male' : 'Female', nick: pickR(OUTLAW_TITLE).replace('{pl}', pl), danger: 1 + Math.floor(Math.random() * 3), from: ed, status: 'wanted'};
    WORLD.wanted.push(w);
  }
  // a crisis: rare, one at a time
  // a crisis runs for one to six years: it starts, it may spread, and it ends in one of several ways
  const C0 = WORLD.crisis;
  if(C0 && C0.ed < ed && C0.until <= ed){
    const end = pickR(CRISIS_END[C0.k] || [['peace', 'The crisis in {pl} is over.']]), tx = capS(end[1].replace(/\{pl\}/g, C0.pl));
    [C0.pl, C0.pl2].filter(Boolean).forEach(p => setPlace(p, end[0], ed, tx));
    items.push({lic: '', name: '', kind: 'crisis', text: tx, rank: 9});
    const hero = pickR(act.filter(h => CRISES[C0.k].areas.some(a => (h.career || '').startsWith(a))));
    if(hero){ hero.rp = (hero.rp || 0) + 60; add(hero, 'award', `${hero.name} is honoured by the Association for ${pro('{their}', hero)} work through ${CRISES[C0.k].name} in ${C0.pl}.`, 7); }
    WORLD.crisis = null;
  }
  if(!WORLD.crisis && Math.random() < 0.16){
    const k = pickR(Object.keys(CRISES)), pl = pickR(PLACES.filter(x => !plState(x) || plState(x).st === 'peace')), len = pickR([1, 2, 2, 3, 3, 4, 5, 6]);
    WORLD.crisis = {k, ed, start: ed, until: ed + len - 1, pl};
    const tx = capS(pickR(CRISES[k].start).replace('{pl}', pl));
    setPlace(pl, CRISIS_ST[k], ed, tx); hometownNews(pl, CRISIS_ST[k], ed, add);
    items.push({lic: '', name: '', kind: 'crisis', text: tx, rank: 10});
  } else if(WORLD.crisis){
    const C = WORLD.crisis; C.ed = ed; C.start = C.start ?? ed - 1;
    const y = ed - C.start + 1, spread = !C.pl2 && Math.random() < 0.4;
    if(spread){ C.pl2 = pickR(PLACES.filter(x => x !== C.pl && (!plState(x) || plState(x).st === 'peace'))); }
    const L = (CRISIS_MID[C.k] || []).filter(s => spread ? s.includes('{pl2}') : !s.includes('{pl2}'));
    if(L.length){ const tx = capS(pickR(L).replace(/\{pl\}/g, C.pl).replace(/\{pl2\}/g, C.pl2 || C.pl).replace('{y}', ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][y - 1] || y + 'th'));
      if(spread){ setPlace(C.pl2, CRISIS_ST[C.k], ed, tx); hometownNews(C.pl2, CRISIS_ST[C.k], ed, add); } else { const p = plState(C.pl); if(p){ p.hist.push({ed, text: tx}); if(p.hist.length > 10) p.hist = p.hist.slice(-10); } }
      items.push({lic: '', name: '', kind: 'crisis', text: tx, rank: 8}); }
  }
  if(WORLD.crisis) W.crisis = CRISES[WORLD.crisis.k];
  // hunts: new contracts, then a chapter for each one under way
  const hunters = act.filter(h => (h.career || '').startsWith('Blacklist') || h.avenge);
  WORLD.wanted.filter(w => w.status === 'wanted' && !WORLD.hunts.some(x => x.w === w.id && !x.done)).forEach(w => {
    if(WORLD.hunts.filter(x => !x.done).length >= 3 || Math.random() > 0.5) return;
    const avenger = act.find(h => h.avenge && h.avenge.killer === w.name);
    const free = hunters.filter(h => !WORLD.hunts.some(x => !x.done && x.lic === h.license) && !(WORLD.exped && h.exped === WORLD.exped.id));
    const h = avenger || (free.length ? pickR(free) : null); if(!h) return;
    WORLD.hunts.push({w: w.id, lic: h.license, ed, year: 0, done: false});
    add(h, 'hunt', avenger ? `${h.name} finally takes the contract on ${w.name}, the one who killed ${h.avenge.hunter}. It is personal now.` : `${h.name} takes the Blacklist contract on ${w.name}${w.nick ? ` ("${w.nick}")` : ''}.`, 6);
  });
  WORLD.hunts.filter(x => !x.done && x.ed < ed).forEach(x => {
    const h = HUNTERS.find(y => y.license === x.lic), w = WORLD.wanted.find(y => y.id === x.w);
    if(!h || !w || !hActive(h)){ x.done = true; return; }
    busy.add(h.license); x.year++;
    const sk = careerSkill(h) / 100 + hStars(h) * 0.08 + relCap(h) / 0.35, pl = pickR(PLACES), r = Math.random();
    const capP = Math.min(0.75, 0.15 + sk * 0.35 + x.year * 0.08 - w.danger * 0.05 + (w.tip && ed - w.tip <= 3 ? 0.2 : 0)), dieP = 0.02 + w.danger * 0.025;
    if(r < dieP * relHuntDie(h) && !relicSaves(h, ed, add, 'hunt')){ x.done = true; h.status = 'Deceased'; h.diedEd = ed; h.killedBy = w.name; add(h, 'death', `${h.name} is found dead in ${pl}. ${w.name} was last seen there. The hunt is over, for now.`, 9); w.kills = (w.kills || 0) + 1; }
    else if(r < dieP + capP){ x.done = true; w.status = 'captured'; w.by = h.name; h.rp = (h.rp || 0) + 60 + w.danger * 30; add(h, 'hunt', pickR([`After ${x.year + 1} year${x.year ? 's' : ''}, ${h.name} brings ${w.name} in alive. The Blacklist is one name shorter.`, `${h.name} corners ${w.name} in ${pl}. It ends without a fight, which surprises everyone.`, `${w.name} is in Association custody. ${h.name} looks older than a year ago.`]) + (h.avenge && h.avenge.killer === w.name ? ` ${h.avenge.hunter} can rest now.` : '') + deedNick(h, ['the Hound', 'Handcuffs', 'Bring-Em-Back', 'the Warden', 'Last Call', `${w.name.split(' ')[0]}'s Bane`], `for bringing in ${w.name}`), 8); }
    else if(r < dieP + capP + 0.12 && x.year >= 2){ x.done = true; add(h, 'hunt', `${w.name} slips away from ${h.name} in ${pl} and vanishes. ${h.name} gives up the contract.`, 4); w.slips = (w.slips || 0) + 1; if(Math.random() < 0.15 + 0.1 * (w.slips - 1)) openCase(h, 'collusion', ed, add, {w: w.name}); }
    else add(h, 'hunt', pickR([`${h.name} picks up ${w.name}'s trail in ${pl}.`, `${h.name} walks into an ambush set by ${w.name} in ${pl}, and walks out of it.`, `${h.name} misses ${w.name} by a day in ${pl}.`, `A tip sends ${h.name} to ${pl}. ${w.name} was there, and left a message.`]), 4);
  });
  // the Dark Continent: a rare expedition of 3–10 Hunters, gone 2–5 years; sometimes a rescue for an earlier one
  const E = WORLD.exped, LX = WORLD.lostExp;
  const rescueGo = !E && LX && ed - LX.ed >= 1 && Math.random() < 0.25;
  if(!E && (rescueGo || Math.random() < 0.1)){
    const size = rescueGo ? 3 + Math.floor(Math.random() * 3) : pickR([3, 4, 4, 5, 5, 5, 6, 6, 7, 8, 10]);
    let team = act.filter(h => hStars(h) >= 1 && !busy.has(h.license)).sort(() => Math.random() - 0.5).slice(0, size);
    // now and then a Zodiac member leads, and gives up the seat to go
    const zl = Math.random() < 0.3 ? Object.entries(WORLD.zodiac || {}).map(([z, l]) => [z, hLic(l)]).filter(([z, h]) => h && usable(h) && !busy.has(h.license)) : [];
    const zLead = zl.length ? pickR(zl) : null;
    if(zLead){ team = [zLead[1]].concat(team.filter(h => h !== zLead[1])).slice(0, size); }
    { const rn = (WORLD.relics || {}).a7, rh = rn && rn.st === 'held' && !rn.swap && hLic(rn.holder); if(rh && hActive(rh) && !team.includes(rh) && !busy.has(rh.license) && team.length >= 2){ team = team.slice(0, Math.max(2, team.length - 1)).concat([rh]); } }
    if(team.length >= 3){
      const len = rescueGo ? 2 : pickR([2, 3, 3, 3, 4, 4, 5]);
      WORLD.exped = {id: 'X' + (++WORLD.seq), ed, year: 0, len, rescue: rescueGo ? LX.id : null, goal: rescueGo ? null : pickR(DC_GOALS), members: team.map(h => h.license), lost: []};
      team.forEach(h => h.exped = WORLD.exped.id);
      const lead = zLead ? `led by ${team[0].name}, who leaves the ${zLead[0]} seat of the Zodiac to go` : `led by ${team[0].name}`;
      items.push({lic: team[0].license, name: team[0].name, kind: 'exped', text: rescueGo
        ? `A rescue expedition sets out for the Dark Continent to look for ${LX.names.length ? andList(LX.names) : 'the lost expedition'}: ${team.length} Hunters, ${lead}, with ${andList(team.slice(1).map(h => h.name))}.`
        : `The Association sends ${team.length} Hunters to the Dark Continent ${WORLD.exped.goal}, ${lead}, with ${andList(team.slice(1).map(h => h.name))}. ${len >= 4 ? 'They are told to expect years.' : 'Nobody knows when they will be back.'}`, rank: 10, o: {lic: team[1].license, name: team[1].name}});
      if(rescueGo) WORLD.lostExp = null;
    }
  } else if(E && E.ed < ed){
    E.year++;
    const alive = E.members.map(l => HUNTERS.find(h => h.license === l)).filter(h => h && hActive(h));
    const pk = () => pickR(alive);
    if(alive.length && Math.random() < 0.35 * relExpLoss(alive)){ const v = pk(); v.lostIn = E.id; v.status = Math.random() < 0.6 ? 'Deceased' : 'Missing'; v.diedEd = ed; E.lost.push(v.license); add(v, v.status === 'Deceased' ? 'death' : 'missing', pickR(v.status === 'Deceased' ? DC_DEATH : DC_MISS)(v), 9); }
    const live = alive.filter(h => hActive(h));
    if(live.length && E.year < (E.len || 3)) { const la = pickR(live), lb = live.length > 1 ? pickR(live.filter(h => h !== la)) : null, L = DC_LETTERS({a: la, b: lb, yr: E.year, goal: E.goal, firsts: live.map(h => h.first || h.name.split(' ')[0]).join(', ')});
      E.said = E.said || []; const fresh = L.map((x, i) => i).filter(i => !E.said.includes(i)); const i = fresh.length ? pickR(fresh) : pickR(L.map((x, j) => j)); E.said.push(i); add(L[i].includes(la.name) ? la : pk(), 'exped', L[i], 7); }
    if(E.year >= (E.len || 3) || !live.length){
      live.forEach(h => { h.rp = (h.rp || 0) + 180 + 40 * ((E.len || 3) - 3); delete h.exped; });
      // a rescue may find someone who went missing
      if(E.rescue && live.length){
        const miss = HUNTERS.filter(h => h.status === 'Missing' && h.lostIn === E.rescue);
        const found = miss.length && Math.random() < 0.45 ? pickR(miss) : null;
        if(found){ const since0 = found.missEd ?? found.diedEd, lost0 = found.lostIn; found.status = 'Active Hunter'; delete found.diedEd; delete found.lostIn; delete found.missEd; found.rp = (found.rp || 0) + 120; add(found, 'exped', `The rescue expedition brings ${found.name} home from the Dark Continent, alive, years after ${PR(found).they} ${PR(found).were} given up for lost.`, 11); afterReturn(found, ed, add, since0, lost0); }
        else items.push({lic: live[0].license, name: live[0].name, kind: 'exped', text: `The rescue expedition finds the old camp on the Dark Continent, empty. Whatever happened there, nobody is coming home from it.`, rank: 8});
      }
      const missNow = E.lost.map(l => hLic(l)).filter(h => h && h.status === 'Missing');
      missNow.forEach(h => h.lostIn = E.id);
      if(!E.rescue && (missNow.length || !live.length)) WORLD.lostExp = {id: E.id, ed, names: (live.length ? missNow : E.members.map(l => hLic(l)).filter(Boolean)).map(h => h.name).slice(0, 4)};
      { const lead = hLic(E.members[0]); if(lead && live.includes(lead) && E.lost.length && !E.rescue && Math.random() < 0.25) openCase(lead, 'abandon', ed, add); }
      if(live.length){ const changed = Math.random() < 0.35 ? pickR(live) : null; const dn = pickR(live), dnT = deedNick(dn, ['Far Shore', 'the Returned', 'Came-Back', 'Other Side', 'Driftwood'], 'for coming back from the Dark Continent'); items.push({lic: live[0].license, name: live[0].name, kind: 'exped', text: `The Dark Continent expedition returns: ${andList(live.map(h => h.name))} ${live.length === 1 ? 'comes' : 'come'} home${E.lost.length ? `, ${E.lost.length} short` : ''}.${!E.rescue && !relicFromExped(E, live, ed, add, items) && Math.random() < 0.6 ? ' ' + pickR(DC_HAUL) : ''}${changed ? ' ' + pickR(DC_CHANGED)(changed) : ''}${dnT ? ` ${dn.name.split(' ')[0]} comes back with a new name: "${dn.nick}".` : ''}`, rank: 10}); if(changed && Math.random() < 0.5){ changed.status = 'Retired'; retireRec(changed, ed, 'after what they saw on the Dark Continent'); } }
      else items.push({lic: '', name: '', kind: 'exped', text: 'The Dark Continent expedition is declared lost. Nobody came back.', rank: 10});
      HUNTERS.forEach(h => { if(h.exped === E.id) delete h.exped; });
      WORLD.exped = null;
    }
  }
  return W;
}
function worldEnd(prev, ed, add, items, W){
  const act = HUNTERS.filter(h => hActive(h) && !h.legacy), byCid = {}; HUNTERS.forEach(h => byCid[h.cid] = h);
  const dead = HUNTERS.filter(h => h.status === 'Deceased' && h.diedEd === ed && !h.legacy);
  // unbreakable bonds carry on after the exam
  const seen = new Set();
  act.forEach(h => (h.bonds || []).forEach(b => {
    const o = byCid[b.id], k = [h.cid, b.id].sort().join(); if(!o || seen.has(k)) return; seen.add(k);
    if(hActive(o)){
      if(Math.random() < 0.25) add(h, 'bond', pickR([`${h.name} and ${o.name} take on a job in ${pickR(PLACES)} together, as they always do.`, `${h.name} crosses a continent to help ${o.name} with a contract nobody else would take.`, `${h.name} drops everything when ${o.name} sends word from ${pickR(PLACES)}.`, `${h.name} and ${o.name} split a reward in ${pickR(PLACES)} down to the last coin, as they swore they would.`, `${h.name} spends a week patching up ${o.name} after a job in ${pickR(PLACES)} went wrong.`, `${o.name} names ${h.name} as the one person to call if ${PR(o).they} ever go${PR(o).es} missing.`, `${h.name} and ${o.name} meet in ${pickR(PLACES)} once a year, on the anniversary of the exam.`, `${h.name} and ${o.name} are seen together in ${pickR(PLACES)}. The partnership from the exam is still going.`]), 4, o);
      else if(Math.random() < 0.06) add(h, 'bond', `${h.name} pulls ${o.name} out of a collapsing ruin in ${pickR(PLACES)}. Some debts from the exam never stop being repaid.`, 6, o);
    }
  }));
  dead.forEach(d => (d.bonds || []).forEach(b => {
    const o = byCid[b.id]; if(!o || !hActive(o)) return;
    const r = Math.random();
    if(r < 0.3){ o.status = 'Retired'; retireRec(o, ed, `after losing ${d.name}`); add(o, 'bond', `After losing ${d.name}, ${o.name} hands back the Hunter license.`, 8); }
    else if(r < 0.6 && d.career && d.career !== o.career){ o.career = d.career; add(o, 'bond', `${o.name} takes up ${d.name}'s work as a ${d.career}, to finish what they started together.`, 7); }
    else add(o, 'bond', `${o.name} visits ${d.name}'s grave in ${pickR(PLACES)}, then goes back to work.`, 5);
  }));
  // rivalries from the exam fade as lives move on; a grudge over a death never does
  const BLOOD = /kill|killed|murder|died|death|dead/i;
  const fadeSeen = new Set();
  act.forEach(h => (h.rivals || []).slice().forEach(cid => {
    const o = byCid[cid], k = [h.cid, cid].sort().join(); if(!o || fadeSeen.has(k)) return; fadeSeen.add(k);
    const why = ((h.rivalWhy || {})[cid] || '') + ' ' + ((o.rivalWhy || {})[h.cid] || ''); if(BLOOD.test(why)) return;
    const yrs = ed - Math.max(h.edition || ed, o.edition || ed), settled = [h, o].filter(x => x.spouse || WORLD.heirs.some(kk => kk.parents.includes(x.license))).length;
    const pr = 0.03 + settled * 0.02 + Math.min(0.06, yrs * 0.002) + (hunterAge(h) > 45 ? 0.02 : 0);
    if(o.status === 'Deceased'){ if(Math.random() < 0.25){ h.rivals = h.rivals.filter(x => x !== cid); add(h, 'rival', pickR([`${h.name} goes to ${o.name}'s funeral and stands at the back. The old rivalry ends there.`, `${h.name} hears that ${o.name} is dead and is surprised how little the old grudge weighs now.`]), 5, o); } return; }
    if(Math.random() >= pr * relFade(h, o)) return;
    h.rivals = h.rivals.filter(x => x !== cid); o.rivals = (o.rivals || []).filter(x => x !== h.cid);
    const kid = WORLD.heirs.find(kk => kk.born === ed && (kk.parents.includes(h.license) || kk.parents.includes(o.license))), pl = pickR(PLACES);
    add(h, 'rival', kid ? `${kid.parents.includes(h.license) ? o.name : h.name} sends flowers when ${kid.parents.includes(h.license) ? h.name : o.name}'s ${kid.gender === 'Male' ? 'son' : kid.gender === 'Female' ? 'daughter' : 'child'} is born. The rivalry from the ${ordinal(Math.max(h.edition, o.edition))} exam is over.`
      : pickR([`${yrs > 1 ? yrs + ' years' : 'A year'} after the exam, ${h.name} and ${o.name} run into each other in ${pl}. Neither remembers what the fight was about.`, `${h.name} and ${o.name}, rivals since the exam, end up on the same side of a bad night in ${pl}. They have been friends since.`, `Both licensed, both busy, both older: ${h.name} and ${o.name} let the old rivalry go without ever saying so.`]), 5, o);
  }));
  // rivalries from the exam follow them into their careers
  const rs = new Set();
  act.forEach(h => (h.rivals || []).forEach(cid => {
    const o = byCid[cid], k = [h.cid, cid].sort().join(); if(!o || !hActive(o) || rs.has(k) || Math.random() > 0.14 * relDuel(h, o)) return; rs.add(k);
    const r = Math.random(), pl = pickR(PLACES);
    if(r < 0.03){ o.status = 'Deceased'; o.diedEd = ed; add(h, 'rival', `${h.name} and ${o.name} settle their old grudge from the exam in ${pl}. Only one walks away.`, 9, o); (o.log = o.log || []).push({ed, k: 'death', text: `${o.name} dies in a duel with an old rival from the exam.`}); }
    else if(r < 0.15){ h.rivals = h.rivals.filter(x => x !== cid); o.rivals = (o.rivals || []).filter(x => x !== h.cid); add(h, 'rival', `${h.name} and ${o.name}, rivals since the exam, finally share a drink in ${pl}. Nobody saw that coming.`, 6, o); }
    else add(h, 'rival', pickR([`${h.name} and ${o.name}, rivals since the exam, race each other for a contract in ${pl}. ${h.name} wins, this time.`, `${h.name} and ${o.name} are forced to work together in ${pl}. They do not speak for three days.`, `${h.name} beats ${o.name} in a duel in ${pl}. The grudge from the exam is not over.`]), 5, o);
  }));
  // someone always wants to avenge the dead
  dead.forEach(d => { if(Math.random() < 0.45) WORLD.avengers.push({hunter: d.name, lic: d.license, last: d.name.split(' ').slice(-1)[0], killer: d.killedBy || null, ed}); });
  WORLD.avengers = WORLD.avengers.filter(a => a.ed >= ed - 2).slice(-4);
}
// a fallen Hunter's relative or friend registers for the next exam
function applyAvengers(N){
  const pool = N.candidates.filter(c => !(c.attempts && c.attempts.length > 1) && !c.fam && c.age >= 14 && c.age <= 45);
  WORLD.avengers.splice(0, 2).forEach(a => {
    if(!pool.length) return;
    const c = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const kin = Math.random() < 0.6;
    if(kin && !N.candidates.some(o => o.name === c.first + ' ' + a.last)){ c.last = a.last; c.name = c.first + ' ' + a.last; }
    const H = HUNTERS.find(x => x.license === a.lic) || {}, g = (o, m, f, x) => o.gender === 'Male' ? m : o.gender === 'Female' ? f : x;
    const k = kin ? pickR(['sib', 'child', 'niece']) : pickR(['apprentice', 'friend', 'partner']);
    // rel: who the candidate is to the Hunter; relH: who the Hunter was to the candidate
    const rel = {sib: g(c, 'younger brother', 'younger sister', 'younger sibling'), child: g(c, 'son', 'daughter', 'child'), niece: g(c, 'nephew', 'niece', "sibling's child"), apprentice: 'apprentice', friend: 'best friend', partner: 'old partner'}[k];
    const relH = {sib: g(H, 'older brother', 'older sister', 'older sibling'), child: g(H, 'father', 'mother', 'parent'), niece: g(H, 'uncle', 'aunt', "parent's sibling"), apprentice: 'teacher', friend: 'best friend', partner: 'old partner'}[k];
    c.avenge = {hunter: a.hunter, lic: a.lic, rel, relH, killer: a.killer};
    log(N, 0, 'rival', `${c.name}, ${a.hunter}'s ${rel}, registers with one purpose: ${a.killer ? `finding ${a.killer}` : `finishing what ${a.hunter} started`}.`, [c.id]);
  });
}
