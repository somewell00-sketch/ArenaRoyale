const KEY = 'hxsim-v1';
const MAX_LICENSES = 12;
const randomApplicants = () => 300 + Math.floor(Math.random() * 1701); // 300–2,000
let S = null, HISTORY = [], HUNTERS = [], HA_SEQ = 0, resetArmed = false, selPhase = null;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const fmt = n => n.toLocaleString('en-US');
// strip numeric scores from older saved records
const clean = t => String(t).replace(/ \(#\d+\)/g, '').replace(/\s*\((team \d+, )?score [^)]*\)/g, m => /team (\d+)/.test(m) ? ` (team ${m.match(/team (\d+)/)[1]})` : '').replace(/:\s*passed \(\d+ \/ \d+\)/, ': passed').replace(/\s*\(\d+ (\/|vs) \d+\)/g, '').replace(/ with a score of \d+/, ' at the front of the pack').replace(/ \(fatigue \d+\)/, '').replace(/ [^ .]+ would not have made it alone\./, '');

/* ---------- persistence: IndexedDB first (no 5 MB cap), browser storage as fallback ---------- */
const DB_NAME = 'hxsim', DB_STORE = 'kv';
let DB = null, saveTimer = null;
function idbOpen(){ return new Promise(res => { try{ if(!window.indexedDB) return res(null); const r = indexedDB.open(DB_NAME, 1); r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE); r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null); }catch(e){ res(null); } }); }
function idbGet(k){ return new Promise(res => { try{ const q = DB.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }catch(e){ res(undefined); } }); }
function idbPut(k, v){ return new Promise(res => { try{ const tx = DB.transaction(DB_STORE, 'readwrite'); tx.objectStore(DB_STORE).put(v, k); tx.oncomplete = () => res(true); tx.onerror = () => res(false); tx.onabort = () => res(false); }catch(e){ res(false); } }); }
function setSaveState(ok, msg){ const el = $('saveState'); if(el){ el.textContent = msg; el.className = 'savest ' + (ok ? 'ok' : 'bad'); el.title = ok ? '' : 'Your progress could not be stored in this browser. Keep this tab open, or free up browser storage.'; } }
function save(){ registerHunters(); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 200); }
async function flush(){
  clearTimeout(saveTimer); saveTimer = null;
  const data = {v:2, S, HISTORY, HUNTERS, HA_SEQ, FAV, BULLETINS, WORLD, SCOUT, MENTOR};
  if(DB){
    if(await idbPut('state', data)){ setSaveState(true, 'Saved'); try{ localStorage.removeItem(KEY); }catch(e){} return; }
  }
  try{ localStorage.setItem(KEY, JSON.stringify(data)); setSaveState(true, 'Saved'); return; }catch(e){}
  // last resort: drop the detailed snapshots of older editions, keep everything else
  try{ localStorage.setItem(KEY, JSON.stringify({...data, HISTORY: HISTORY.map((r, i) => i < HISTORY.length - 3 ? {...r, snap: null} : r)})); setSaveState(true, 'Saved (older archives trimmed)'); }
  catch(e){ setSaveState(false, 'Not saved — browser storage full'); }
}
window.addEventListener('pagehide', () => { if(saveTimer) flush(); });
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden' && saveTimer) flush(); });
async function load(){
  DB = await idbOpen();
  let d = DB ? await idbGet('state') : null;
  if(!d){ try{ d = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){ d = null; } }
  if(!(d && d.S)) return false;
  S = d.S; if(!S.started && !S.special) S.config.licenses = MAX_LICENSES;
  HISTORY = d.HISTORY || []; HUNTERS = d.HUNTERS || []; FAV = d.FAV || {}; SCOUT = scoutFix(d.SCOUT); MENTOR = mentorFix(d.MENTOR);
  // slim older saves: the attempt in progress needs no snapshot, Hunter records need no route lists
  (S.candidates || []).forEach(c => { const at = c.attempts && c.attempts[c.attempts.length - 1]; if(at && at.edition === S.edition){ delete at.start; delete at.ids; delete at.passedIds; } });
  HUNTERS.forEach(h => (h.history || []).forEach(x => { delete x.ids; delete x.passedIds; delete x.start; }));
  try{ HISTORY.forEach((r, i) => { if(r.snap && i < HISTORY.length - 25) r.snap = null; }); compactHunters(d.S ? d.S.edition : 0); }catch(e){} BULLETINS = d.BULLETINS || []; WORLD = worldFix(d.WORLD); HA_SEQ = d.HA_SEQ || HUNTERS.length; backfillLegacy(); hatsuNameFix();
  HUNTERS.forEach(h => { // migrate older sequential IDs to edition + registration number
    const at = (h.history || []).find(x => x.edition === h.edition);
    const reg = at ? at.reg : (h.legacy ? +h.cid.split('-')[2] : null);
    if(reg) h.license = licenseId(h.edition, reg);
    if(!h.career && h.attrs) h.career = hunterCareer({id: h.cid, a: h.attrs, nen: h.nen});
  });
  return true;
}
// every 25th exam is the Jubilee, every 100th the centenary
const specialOf = ed => ed % 100 === 0 ? 'centenary' : ed % 25 === 0 ? 'jubilee' : null;
const examName = (S0) => S0.special === 'centenary' ? `the ${ordinal(S0.edition)} Hunter Exam — the Centenary` : S0.special === 'jubilee' ? `the ${ordinal(S0.edition)} Hunter Exam — the Jubilee` : `the ${ordinal(S0.edition)} Hunter Exam`;
function specialOpen(N){
  const ch = CHAIR ? 'Chairman ' + CHAIR.name : 'The Chairman';
  if(N.special === 'jubilee'){
    log(N, 0, 'major', `The Jubilee. Every twenty-five years the Association opens its gates wider: four brackets, up to 48 licenses, and a shorter road. ${fmt(N.candidates.length)} applicants came, and everyone knows why.`, []);
    const g = (N.phaseSpec || []).find(sp => sp.ex && sp.ex.legend); if(g) log(N, 0, 'story', `${g.ex.name}, a former Chairman, comes out of retirement from politics to examine the ${PHASE_DEFS[g.id].name}.`, []);
  } else {
    log(N, 0, 'major', `The Centenary. ${ch} opens the ${ordinal(N.edition)} Hunter Exam in person: twice the usual crowd, the road of the very first exam, and the Zodiac as examiners. Only twelve licenses at most, and the best four new Hunters will fight for the Centennial Star.`, []);
    // amnesty: those once thrown out for killing come back with a clean record
    const am = N.candidates.filter(c => c.dqKill); am.forEach(c => { c.amnesty = true; delete c.dqKill; });
    if(am.length) log(N, 0, 'story', `By centennial amnesty, ${am.length === 1 ? am[0].name + ', once disqualified for killing, returns' : am.length + ' candidates once disqualified for killing return'} with a clean record.`, am.map(c => c.id));
  }
}
function fresh(edition, prev){
  const pool = HUNTERS.filter(h => !h.legacy && hActive(h)).map(h => ({license:h.license, cid:h.cid, name:h.name, career:h.career, edition:h.pro ? 0 : h.edition, attrs:h.attrs, status:h.status}));
  ensureChair(edition);
  const cr = WORLD.crisis && WORLD.crisis.ed === edition - 1 ? CRISES[WORLD.crisis.k] : null;
  const special = specialOf(edition);
  // the Jubilee hands one phase to a former Chairman; the centenary puts the Chairman, the Vice and the Zodiac in charge of the phases
  const pick = h => ({license:h.license, cid:h.cid, name:h.name, career:h.career, edition:h.pro ? 0 : h.edition, attrs:h.attrs, status:h.status});
  let legends = [];
  if(special === 'centenary') legends = [hLic(WORLD.chair && WORLD.chair.lic), hLic(WORLD.vice), ...ZSIGNS.map(z => hLic((WORLD.zodiac || {})[z]))].filter((h, i, A) => h && hActive(h) && A.indexOf(h) === i).map(h => ({...pick(h), role: roleOf(h)})).sort(() => Math.random() - 0.5);
  else if(special === 'jubilee'){ const ex = HUNTERS.filter(h => hActive(h) && (h.pastRoles || []).some(r => r.r === 'Chairman')); if(ex.length) legends = [{...pick(pickR(ex)), role: 'Former Chairman'}]; }
  const apps = randomApplicants() * (special === 'centenary' ? 2 : special === 'jubilee' ? 1.5 : 1);
  const N = newState(edition, Math.round(apps), special === 'jubilee' ? 48 : MAX_LICENSES, prev, {catastrophe: CAT_NEXT || (special !== 'centenary' && Math.random() < 0.02), hunters: pool, special, legends, theme: special === 'jubilee' ? 'jubilee' : cr && Math.random() < 0.65 ? cr.theme : null});
  CAT_NEXT = false; if($('bCat')) $('bCat').textContent = 'Test a catastrophe';
  const n0 = N.log.length; if(special) specialOpen(N);
  // the centenary opens by remembering the Centennial Stars who came before
  if(special === 'centenary'){
    const past = HUNTERS.filter(h => h.starCup === 'champion' && h.edition < edition).sort((a, b) => b.edition - a.edition).slice(0, 5);
    if(past.length){
      const fate = h => h.status === 'Deceased' ? `fell at ${hunterAge(h)}` : h.status === 'Missing' ? 'missing' : h.status === 'Retired' ? 'retired' : `still active${hStars(h) ? ', ' + starStr(hStars(h)) : ''}`;
      log(N, 0, 'major', `Before the first trial, the examiners read out the names of the Centennial Stars who came before: ${andList(past.map(h => `${h.name} (${ordinal(h.edition)}, ${fate(h)})`))}. ${past.some(h => h.status === 'Deceased') ? 'For the fallen, the hall stands in silence.' : 'Every one of them is still out there.'}`, []);
    }
  }
  if(special) N.log.slice(n0).forEach(e => { e.sp = 1; });   // the special exam's own opening leads the first trial's report
  if(WORLD.origin && !WORLD.origin.told && WORLD.origin.ed === edition){ WORLD.origin.told = true; log(N, 0, 'major', WORLD.origin.exam, []); }
  if(cr) log(N, 0, 'story', cr.after, []);
  applyAvengers(N);
  // Hunters chosen as examiners get the duty on their record
  (N.phaseSpec || []).forEach(sp => { if(!sp.ex || !sp.ex.license) return; const h = HUNTERS.find(x => x.license === sp.ex.license); if(h){ h.examined = (h.examined || []).filter(x => x.edition !== edition).concat([{edition, phase: PHASE_DEFS[sp.id].name, style: sp.ex.style}]); } });
  return N;
}
// a new world does not start empty: 20–40 quiet years of Association life run first (no exams, just politics, careers and the world),
// then an origin event explains why the records begin where they do
function newWorld(){
  const ed = 41 + Math.floor(Math.random() * 460), N = 20 + Math.floor(Math.random() * 21), ed0 = ed - N;
  ensurePros(ed0);
  for(let e = ed0; e < ed; e++){
    S = {edition: e, candidates: [], log: [], stats: [], phaseSpec: [], config: {}, finished: true, started: true};
    try { hunterYear(S); } catch(err){ console.error('prehistory', e, err); }
  }
  BULLETINS = BULLETINS.slice(-3);
  WORLD.recordsFrom = ed; WORLD.preYears = N;
  originEvent(ed);
  S = fresh(ed);
}
const ORIGINS = ['fire', 'dark', 'schism', 'massacre', 'exped'];
// what individual veterans did when it happened: [text, condition]
const ORIGIN_PART = {
  fire: [[h => `${h.name} carried boxes of records out of the burning archive until {their} hands blistered.`], [h => `${h.name} was the first Hunter to reach the archive that night. {They} still dream{s} about the smoke.`],
    [h => `${h.name} was questioned for weeks about the Archive Fire. Nothing was ever proven.`], [h => `${h.name} lost every record of {their} own exam in the fire, and likes it that way.`],
    [(h, c) => `${h.name} tracked the arsonists of the Archive Fire across three countries, and lost them.`], [h => `${h.name} helped rebuild the Association's records from memory, one Hunter at a time.`]],
  dark: [[(h, c) => `${h.name} spent the Dark Years searching for the vanished Chairman ${c.ch}. {They} never found a trace.`, c => c.ch], [h => `${h.name} kept taking jobs through the Dark Years, as if nothing had changed.`],
    [(h, c) => `${h.name} stood beside ${c.vice} through the Dark Years, holding the Association together.`, c => c.vice], [h => `${h.name} handed back {their} license during the Dark Years, and only took it back when the records restarted.`],
    [h => `${h.name} openly called for a new election during the Dark Years, and made enemies doing it.`]],
  schism: [[(h, c) => `${h.name} fought on ${c.rebel}'s side during the Schism.`, c => c.rebel], [(h, c) => `${h.name} stayed loyal to Chairman ${c.ch} through the Schism.`, c => c.ch],
    [h => `${h.name} switched sides in the middle of the Schism. Neither side has forgiven {them}.`], [h => `${h.name} carried messages between the two factions until the truce was signed.`],
    [h => `${h.name} refused to pick a side in the Schism and was distrusted by both.`]],
  massacre: [[(h, c) => `${h.name} survived the ambush that killed half the Zodiac. {They} {were} in the next room.`], [(h, c) => `${h.name} arrived minutes too late to stop the Massacre.`],
    [(h, c) => `${h.name} has sworn to bring in ${c.troupe || 'the killers of the Zodiac'}.`], [h => `${h.name} stood guard at the funerals of the murdered Zodiac.`], [(h, c) => `${h.name} once trained one of the members of ${c.troupe || 'the troupe'}. {They} {have} not said a word since.`]],
  exped: [[h => `${h.name} trained the expedition team before they left for the Dark Continent.`], [h => `${h.name} waited at the port every season for the expedition to come back.`],
    [h => `${h.name} was turned down for the expedition at the last minute. {They} still think{s} about it.`], [h => `${h.name} is one of the few who has read the sealed files from the expedition.`], [h => `${h.name} helped carry the survivors off the ship when the expedition came home.`]]
};
function originEvent(ed, skip){
  skip = skip || []; const opts = ORIGINS.filter(x => !skip.includes(x)), k = opts.length ? pickR(opts) : 'fire', last = ed - 1, items = [], B = BULLETINS[BULLETINS.length - 1] || (BULLETINS.push({edition: last, items: []}), BULLETINS[BULLETINS.length - 1]);
  const ch = hLic(WORLD.chair && WORLD.chair.lic), vice = hLic(WORLD.vice), act = HUNTERS.filter(h => hActive(h) && !h.legacy);
  const say = (text, h, o, rank) => items.push({lic: h ? h.license : '', name: h ? h.name : '', kind: 'origin', text, rank: rank || 20, o: o ? {lic: o.license, name: o.name} : undefined});
  const note = (h, text) => (h.log = h.log || []).push({ed: last, text});
  let exam = '';
  if(k === 'fire'){
    say(`The Archive Fire. Someone set the Association's central archive alight; decades of exam records are ash. Every license is reissued, and the records start over with the ${ordinal(ed)} Hunter Exam.`);
    const old = ZSIGNS.map(z => hLic((WORLD.zodiac || {})[z])).filter(Boolean);
    const zc = fillZodiac(last, null, 0); trackRoles(last);
    B.items = B.items.filter(it => it.kind !== 'zodiac'); WORLD.stay = {};   // the old Zodiac's comings and goings no longer matter
    say(`${ch ? 'Chairman ' + ch.name : 'The Chairman'} dissolves the Zodiac, saying the fire happened on its watch. A new twelve is named: ${zc.named.map(([z, h]) => `${h.name} (${z})`).join(', ')}.`, ch, null, 19);
    old.forEach(h => note(h, `${h.name} lost ${pro('{their}', h)} Zodiac seat after the Archive Fire.`));
    exam = `The first Hunter Exam since the Archive Fire. Whatever happened at the exams before this one now lives only in people's memories.`;
  } else if(k === 'dark'){
    // the Chairman vanished some time after taking office; everything he "did" after that never happened
    if(!ch || WORLD.chair.since > last - 3) return originEvent(ed, skip.concat(k));
    const gone = WORLD.chair.since + 1 + Math.floor(Math.random() * (last - 2 - WORLD.chair.since)), yrs = last - gone + 1;
    ch.status = 'Missing'; ch.missEd = gone;
    const after = x => x.ed >= gone && x.text.includes(ch.name);
    ch.log = (ch.log || []).filter(x => x.ed < gone);
    HUNTERS.forEach(h => { if(h !== ch && h.log) h.log = h.log.filter(x => !after(x)); });
    BULLETINS.forEach(b => { if(b.edition >= gone) b.items = b.items.filter(it => !it.text.includes(ch.name) && it.lic !== ch.license); });
    note(ch, `${ch.name} vanished while Chairman, after the ${ordinal(gone)} exam.`);
    say(`The Dark Years. Chairman ${ch.name} vanished ${yrs} year${yrs === 1 ? '' : 's'} ago, and the Association has drifted ever since: no elections, no reforms, half the Zodiac barely speaking to the other half.`, ch);
    const vSince = (WORLD.since || {}).vice;
    if(vice) say(vSince && vSince >= gone ? `The Zodiac chose ${vice.name} to stand in as Vice-Chairman. ${pro('{They}', vice)} {have} held things together, without the authority to change anything, and promise${pro('{s}', vice)} an election as soon as this year's exam is over.`.replace('{have}', pro('{have}', vice)) : `Vice-Chairman ${vice.name} has held things together, without the authority to change anything. ${pro('{They}', vice)} promise${pro('{s}', vice)} an election as soon as this year's exam is over.`, vice, null, 19);
    exam = `The first exam of a new era, everyone hopes: after this year, the Association finally votes for a new Chairman.`;
  } else if(k === 'schism'){
    const rebel = act.filter(h => hStars(h) >= 2 && !council().has(h.license)).sort((a, b) => (b.rp || 0) - (a.rp || 0))[0];
    if(rebel && ch){
      (rebel.rivals = rebel.rivals || []).push(ch.cid); (ch.rivals = ch.rivals || []).push(rebel.cid);
      const camp = act.filter(h => h !== rebel && h.career === rebel.career).slice(0, 12);
      camp.forEach(h => (h.bonds = h.bonds || []).push({id: rebel.cid, name: rebel.name, ed: last}));
      say(WORLD.chair.since <= last - 3 ? `The Schism is over, officially. For years ${rebel.name} led half the Association in open revolt against Chairman ${ch.name}; the two sides signed a truce last winter.` : `The Schism is over, officially. For years ${rebel.name} led half the Association in open revolt against its leadership; Chairman ${ch.name}, barely in office, signed a truce with ${pro('{them}', rebel)} last winter.`, rebel, ch);
      const half = ZSIGNS.slice().sort(() => Math.random() - 0.5).slice(0, 6), taken = council();
      half.forEach(z => { const nz = zPick(rebel, z, taken); if(nz){ WORLD.zodiac[z] = nz.license; seatSince(z, last); taken.add(nz.license); } if(WORLD.stay) delete WORLD.stay[z]; }); trackRoles(last);
      B.items = B.items.filter(it => !(it.kind === 'zodiac' && half.some(z => new RegExp(`\\b${z}\\b`).test(it.text))));
      say(`Under the truce, ${rebel.name}'s faction names six of the twelve Zodiac seats. Nobody expects the peace to be quiet.`, rebel, null, 19);
      note(rebel, `${rebel.name} led the faction that split from the Association, and signed the truce that ended the Schism.`);
      exam = `The first exam since the Schism ended. Examiners from both sides are watching each other as much as the candidates.`;
    } else return originEvent(ed, skip.concat(k));
  } else if(k === 'massacre'){
    const pl = pickR(PLACES), troupe = pickR(['the Hollow Choir', 'the Nine Lanterns', 'the Red Ferrymen', 'the Silent Circus', 'the Black Orchard', 'the Glass Wolves']);
    const victims = ZSIGNS.map(z => [z, hLic((WORLD.zodiac || {})[z])]).filter(([z, h]) => h && hActive(h)).sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));
    victims.forEach(([z, h]) => { if(WORLD.stay) delete WORLD.stay[z]; B.items = B.items.filter(it => !(it.kind === 'zodiac' && it.text.includes(h.name) && /asks to leave|one more year/.test(it.text))); h.status = 'Deceased'; h.diedEd = last; h.killedBy = troupe; note(h, `${h.name}, the Zodiac's ${z}, was killed by ${troupe} in ${pl}.`); });
    WORLD.wanted.push({id: 'W' + (++WORLD.seq), name: troupe.replace(/^the /, 'The '), gender: 'x', nick: 'the Zodiac killers', danger: 3, from: last, status: 'wanted', kills: victims.length});
    say(`The Massacre at ${pl}. ${troupe.replace(/^the /, 'The ')} ambushed a meeting of the Zodiac: ${victims.map(([z, h]) => `${h.name} (${z})`).join(', ')} are dead. The Association's records of the years before were lost in the chaos.`);
    say(`${troupe.replace(/^the /, 'The ')} go straight to the top of the Blacklist. ${ch ? 'Chairman ' + ch.name : 'The Chairman'} will fill the empty seats after the exam.`, ch, null, 19);
    exam = `The first exam since the Massacre at ${pl}. ${victims.length} Zodiac seats stand empty, and every candidate knows it.`;
  } else {
    const team = act.filter(h => hStars(h) >= 1).sort(() => Math.random() - 0.5).slice(0, 6);
    if(team.length < 4) return originEvent(ed, skip.concat(k));
    const yrs = 6 + Math.floor(Math.random() * 10), dead = team.slice(0, 2), lost = team[2], back = team.slice(3);
    dead.forEach(h => { h.status = 'Deceased'; h.diedEd = last; note(h, `${h.name} died on the Dark Continent, ${yrs} years into the expedition.`); });
    lost.status = 'Missing'; lost.missEd = last; lost.lostIn = 'X0'; note(lost, `${lost.name} was lost on the Dark Continent.`);
    back.forEach(h => { h.rp = (h.rp || 0) + 300; note(h, `${h.name} came back from ${yrs} years on the Dark Continent.`); });
    WORLD.lostExp = {id: 'X0', ed: last, names: [lost.name]};
    say(`The Return. After ${yrs} years on the Dark Continent, ${andList(back.map(h => h.name))} come home. ${dead.map(h => h.name).join(' and ')} do not; ${lost.name} is missing.`, back[0], dead[0]);
    say(`The Association seals everything the expedition brought back, and starts its records over: whatever came before is now classified.`, null, null, 19);
    exam = `The first exam since the expedition returned. Half the applicants say they came because of the stories.`;
  }
  // some of the Hunters who were there remember their part in it
  const ctx = {rebel: null, troupe: null, ch: ch && ch.name, vice: vice && vice.name};
  if(k === 'schism') ctx.rebel = (items[0].name || '');
  if(k === 'massacre') ctx.troupe = (WORLD.wanted[WORLD.wanted.length - 1] || {}).name;
  const P = ORIGIN_PART[k] || [], who = act.filter(h => hActive(h) && h.edition < ed && !items.some(it => it.lic === h.license)).sort(() => Math.random() - 0.5).slice(0, Math.round(act.length * (0.08 + Math.random() * 0.06)));
  who.forEach(h => { const line = pickR(P.filter(f => f.length < 2 || f[1](ctx))); if(line){ const pl = pickR(PLACES); h.originNote = pro(line[0](h, ctx, pl), h); h.origin = k; } });
  WORLD.origin = {k, ed, exam, lines: items.map(it => it.text), years: WORLD.preYears || 0};
  B.items = items.map((it, i) => ({...it, i: -100 + i})).concat(B.items);
}
