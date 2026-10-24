/* ===== The Chairman, the Vice-Chairman and the Zodiac ===== */
const ZSIGNS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Sheep','Monkey','Rooster','Dog','Boar'];
const ZKANJI = {Rat:'鼠', Ox:'牛', Tiger:'虎', Rabbit:'兔', Dragon:'龍', Snake:'蛇', Horse:'馬', Sheep:'羊', Monkey:'猴', Rooster:'雞', Dog:'狗', Boar:'豬'};
const hLic = l => l ? HUNTERS.find(h => h.license === l) : null;
const zodOf = h => h ? (Object.entries(WORLD.zodiac || {}).find(([, l]) => l === h.license) || [])[0] || null : null;   // a Zodiac seat, even when the Chairman or the Vice also holds one
const roleFull = h => { const r = roleOf(h), z = zodOf(h); return r && z && !r.startsWith('Zodiac') ? `${r} and the ${z} of the Zodiac` : r && r.startsWith('Zodiac') ? `the ${z} of the Zodiac` : r; };
const council = () => new Set([WORLD.chair && WORLD.chair.lic, WORLD.vice].concat(Object.values(WORLD.zodiac || {})).filter(Boolean));
const roleOf = h => !h ? null : WORLD.chair && WORLD.chair.lic === h.license ? 'Chairman' : WORLD.vice === h.license ? 'Vice-Chairman' : (Object.entries(WORLD.zodiac || {}).find(([, l]) => l === h.license) || [])[0] ? 'Zodiac · ' + Object.entries(WORLD.zodiac).find(([, l]) => l === h.license)[0] : null;
const seatSince = (k, ed) => { WORLD.since = WORLD.since || {}; WORLD.since[k] = ed; };
const chairTerm = (lic, ed) => { WORLD.chairHist = WORLD.chairHist || []; const last = WORLD.chairHist[WORLD.chairHist.length - 1]; if(last && !last.to && last.lic === lic) return;   // re-elected: same term continues
  if(last && !last.to) last.to = ed; WORLD.chairHist.push({lic, from: ed}); };
const setChair = () => { const c = WORLD.chair && hLic(WORLD.chair.lic), v = hLic(WORLD.vice); CHAIR = c && !hActive(c) && v && hActive(v) ? {name: v.name, gender: v.gender, title: 'Acting Chairman'} : c ? {name: c.name, gender: c.gender} : null; };   // a vanished Chairman is stood in for by the Vice
const usable = h => h && hActive(h) && !h.legacy && !(WORLD.exped && h.exped === WORLD.exped.id);
// the Chairman picks people they trust: same field, bonds, and the strongest
// each seat of the Zodiac looks for its own kind of Hunter: three abilities and two or three fields
const ZPROF = {
  Rat: {a: ['intelligence', 'perception', 'strategy'], c: ['Virus', 'Crime', 'Treasure']},
  Ox: {a: ['endurance', 'strength', 'determination'], c: ['Head', 'Lost', 'Ruins']},
  Tiger: {a: ['combat', 'courage', 'strength'], c: ['Blacklist', 'Crime']},
  Rabbit: {a: ['speed', 'agility', 'perception'], c: ['Lost', 'Beast']},
  Dragon: {a: ['courage', 'determination', 'combat'], c: ['Blacklist', 'Head', 'Sea']},
  Snake: {a: ['strategy', 'intelligence', 'charisma'], c: ['Crime', 'Jackpot', 'Virus']},
  Horse: {a: ['speed', 'endurance', 'courage'], c: ['Lost', 'Sea', 'Treasure']},
  Sheep: {a: ['teamwork', 'charisma', 'intelligence'], c: ['Gourmet', 'Music', 'Head']},
  Monkey: {a: ['agility', 'intelligence', 'perception'], c: ['Treasure', 'Ruins', 'Jackpot']},
  Rooster: {a: ['perception', 'strategy', 'determination'], c: ['Music', 'Gourmet', 'Head']},
  Dog: {a: ['teamwork', 'perception', 'determination'], c: ['Blacklist', 'Lost', 'Beast']},
  Boar: {a: ['strength', 'endurance', 'courage'], c: ['Beast', 'Gourmet', 'Sea']}
};
// appointments favour Hunters in their twenties and thirties; the chance falls after 40
// a very few Hunters age far more slowly (a Nen vow, an old bloodline, nobody is sure): every age rule sees them at 40% of their years
const effAge = (h, a) => h && h.longlived ? a * 0.4 : a;
const ageW = h => { const a = effAge(h, hunterAge(h)); return a < 18 ? 0.4 : a < 20 ? 0.9 : a <= 30 ? 1.4 : a <= 40 ? 1 : a <= 50 ? 0.55 : a <= 60 ? 0.3 : a <= 70 ? 0.12 : a <= 80 ? 0.05 : 0.02; };
const zFit = (h, z) => { const P = ZPROF[z]; if(!P) return 60; return h.attrs ? P.a.reduce((s, k) => s + (h.attrs[k] || 50), 0) / 3 : 60; };
const zCareer = (h, z) => ZPROF[z] && ZPROF[z].c.includes((h.career || '').replace(' Hunter', ''));
// anyone who matches the seat can be named: the right field or the right abilities; stars help, but are not required
function zPick(ch, z, taken){
  const pool = HUNTERS.filter(h => usable(h) && !taken.has(h.license) && (zCareer(h, z) || zFit(h, z) >= 74));
  if(!pool.length) return null;
  return wpickM(pool, h => (zFit(h, z) / 65) ** 6 * (zCareer(h, z) ? 2.5 : 1) * (1 + hStars(h)) ** 0.9 * ageW(h)
    * (ch && (ch.bonds || []).some(b => b.id === h.cid) ? 3 : 1) * (ch && (ch.rivals || []).includes(h.cid) ? 0 : 1));
}
// the Vice-Chairman is a choice with a reason: an ally, continuity, a deal with a close rival, or a surprise
function pickVice(win, second, last, cur){
  const pool = HUNTERS.filter(h => usable(h) && h !== win), fin = last && last.top && last.valid ? last : null;
  const share = l => fin ? ((fin.top.find(x => x.l === l) || {v: 0}).v / fin.valid) : 0;
  const close = second && second !== win && fin && share(win.license) - share(second.license) < 0.10;
  const bonded = new Set((win.bonds || []).map(b => b.id));
  const ally = pool.filter(h => hStars(h) >= 1 && (h.license === win.spouse || bonded.has(h.cid) || ((win.ties || {})[h.license] || 0) >= 2)).sort((a, b) => ((b.license === win.spouse) * 9 + bonded.has(b.cid) * 4 + ((win.ties || {})[b.license] || 0)) - ((a.license === win.spouse) * 9 + bonded.has(a.cid) * 4 + ((win.ties || {})[a.license] || 0)))[0];
  const keep = cur && usable(cur) && cur !== win && cur !== second ? cur : null;
  const outsider = pickR(pool.filter(h => hStars(h) <= 2 && ((h.attrs && h.attrs.charisma) || 50) >= 72).concat([null]));
  const opts = [ally && ['ally', 50], keep && ['keep', 20], close && ['deal', 15], outsider && ['out', 8], ['trust', 22]].filter(Boolean);
  const k = opts.length ? wpickM(opts, x => x[1])[0] : 'trust';
  if(k === 'deal'){ if(Math.random() < 0.3){ const v = ally || keep || trusted(win, pool.filter(h => hStars(h) >= 2)); return {vice: v, why: v ? 'after the runner-up said no' : '', refused: second}; }
    return {vice: second, why: 'a gesture to heal a close vote'}; }
  if(k === 'ally') return {vice: ally, why: ally.license === win.spouse ? 'married to the new Chairman' : bonded.has(ally.cid) ? `a partner since the ${ordinal(win.edition)} exam` : 'years of working side by side'};
  if(k === 'keep') return {vice: keep, why: 'kept on: nobody knows the paperwork better'};
  if(k === 'out') return {vice: outsider, why: `an outsider: ${hStars(outsider) ? starStr(hStars(outsider)) : 'no stars'}, no faction`};
  const v = trusted(win, pool.filter(h => hStars(h) >= 2)); return {vice: v, why: v ? (v.career && v.career === win.career ? `a fellow ${v.career}` : 'a safe pair of hands') : ''};
}
function trusted(ch, pool){
  return wpickM(pool, h => ageW(h) * (1 + hStars(h)) ** 2 * (1 + (h.rp || 0) / 800) * (ch && h.career === ch.career ? 1.5 : 1) * (ch && (ch.bonds || []).some(b => b.id === h.cid) ? 4 : 1) * (ch && (ch.rivals || []).includes(h.cid) ? 0 : 1));
}
const wpickM = (arr, w) => { let tot = 0; const ws = arr.map(x => { const v = Math.max(0, w(x)); tot += v; return v; }); let r = Math.random() * tot; for(let i = 0; i < arr.length; i++){ r -= ws[i]; if(r < 0) return arr[i]; } return arr[0]; };
function fillZodiac(ed, add, keep){
  const ch = hLic(WORLD.chair && WORLD.chair.lic), taken = new Set([WORLD.chair && WORLD.chair.lic, WORLD.vice]), named = [], kept = [];
  ZSIGNS.forEach(z => {
    const cur = hLic(WORLD.zodiac[z]);
    if(usable(cur) && !taken.has(cur.license) && Math.random() < keep){ taken.add(cur.license); kept.push(z); return; }
    const pick = zPick(ch, z, taken);
    WORLD.zodiac[z] = pick ? pick.license : null; if(pick){ taken.add(pick.license); named.push([z, pick]); seatSince(z, ed); }
  });
  return {named, kept};
}
function ensureChair(ed){
  if(WORLD.chair && hLic(WORLD.chair.lic)){ setChair(); return; }
  const pool = HUNTERS.filter(h => usable(h) && hStars(h) >= 3).sort((a, b) => (b.rp || 0) - (a.rp || 0));
  if(!pool.length){ CHAIR = null; return; }
  const c = pool.find(h => hunterAge(h) >= 45) || pool[0];
  WORLD.chair = {lic: c.license, since: ed, how: 'in office when the records began'}; chairTerm(c.license, ed);
  const v = trusted(c, pool.filter(h => h !== c)); WORLD.vice = v ? v.license : null; seatSince('vice', ed);
  WORLD.zodiac = {}; fillZodiac(ed, null, 0);
  setChair();
}
// an election by the anime's rules: everyone votes and can be voted for; 95% turnout or the vote is void; over 50% wins, otherwise the leaders go to another round
function runElection(ed, reason, add, items){
  const voters = HUNTERS.filter(h => hActive(h) && !h.legacy), away = voters.filter(h => WORLD.exped && h.exped === WORLD.exped.id).length;
  const zod = new Set(Object.values(WORLD.zodiac || {})), inc = WORLD.chair && hLic(WORLD.chair.lic);
  // a magnetic personality can carry a Hunter with few or no stars into contention
  const cha = h => (h.attrs && h.attrs.charisma) || 50, star = h => cha(h) >= 90 && hStars(h) <= 1 ? 8 + (cha(h) - 90) * 1.2 : 1;
  const base = h => (1 + hStars(h)) ** 2.2 * star(h) * (1 + (h.rp || 0) / 600) * (cha(h) / 55) ** 2 * (WORLD.vice === h.license ? 6 : 1) * (zod.has(h.license) ? 3 : 1) * (inc === h && hActive(h) ? 4 : 1) * (Math.random() < 0.02 ? 6 : 1) * caseW(h, ed) * (h.claimEd === ed ? 3 : 1) * relVote(h);
  const bw = new Map(voters.map(h => [h.license, base(h)]));
  const rounds = []; let cands = voters.slice(), winner = null, n = 0;
  while(!winner && n < 12){
    n++;
    const turnout = Math.min(0.995, 0.935 + Math.random() * 0.06 - away / voters.length);
    if(turnout < 0.95){ rounds.push({n, void: true, turnout}); continue; }
    const votes = new Map(); let blank = 0;
    voters.forEach(v => {
      if(Math.random() > turnout) return;
      if(Math.random() < 0.02){ blank++; return; }
      const bonds = new Set((v.bonds || []).map(b => b.id)), riv = new Set(v.rivals || []);
      const c = wpickM(cands, h => bw.get(h.license) * (h.career === v.career ? 1.4 : 1) * (bonds.has(h.cid) ? 5 : 1) * (riv.has(h.cid) ? 0 : 1) * (h === v ? 0.3 : 1));
      votes.set(c.license, (votes.get(c.license) || 0) + 1);
    });
    const valid = [...votes.values()].reduce((a, b) => a + b, 0), top = [...votes.entries()].sort((a, b) => b[1] - a[1]);
    const share = top.length ? top[0][1] / valid : 0;
    const next = cands.length > 16 ? 16 : Math.max(2, Math.floor(cands.length / 2));
    rounds.push({n, turnout, valid, blank, top: top.slice(0, 8).map(([l, v]) => ({l, v})), adv: share > 0.5 ? 0 : next});
    if(share > 0.5) winner = hLic(top[0][0]);
    else cands = top.slice(0, next).map(([l]) => hLic(l));
  }
  if(!winner) winner = cands[0];
  const prev = WORLD.chair ? WORLD.chair.lic : null, last = rounds[rounds.length - 1];
  const second = last.top && last.top[1] ? hLic(last.top[1].l) : null;
  const again = prev === winner.license && WORLD.chair && WORLD.chair.since != null, prevSince = WORLD.chair ? WORLD.chair.since : ed;
  WORLD.chair = {lic: winner.license, since: again ? WORLD.chair.since : ed, how: `${again ? 're-elected' : 'elected'} in round ${rounds.length}`, prevLic: prev}; chairTerm(winner.license, ed);
  const { vice, why: viceWhy, refused } = pickVice(winner, second, last, WORLD.vice && hLic(WORLD.vice));
  WORLD.vice = vice ? vice.license : null; seatSince('vice', ed);
  const zc = fillZodiac(ed, add, prev === winner.license ? 0.85 : 0.5);
  WORLD.elections.push({ed, reason, rounds, winner: winner.license, vice: WORLD.vice, viceWhy, refused: refused ? refused.license : null, prev, kept: zc.kept.length});
  if(refused) add(refused, 'rival', `${refused.name} turns down the Vice-Chairmanship ${winner.name} offers after the vote. "I did not run to be second."`, 6, winner);
  if(WORLD.elections.length > 10) WORLD.elections = WORLD.elections.slice(-10);
  setChair();
  const lastOk = rounds.slice().reverse().find(r => !r.void && r.top), wv = lastOk ? (lastOk.top.find(x => x.l === winner.license) || {v: 0}).v : 0, pct = lastOk ? Math.round(wv / lastOk.valid * 100) : 0, voids = rounds.filter(r => r.void).length;
  items.push({lic: '', name: '', kind: 'election', text: `${reason} Every Hunter is a voter and a candidate.`, rank: 10});
  // the crowd favourite: a low-ranked Hunter who made it deep into the vote on charisma alone
  const fav = rounds.filter(r => !r.void && r.top).flatMap(r => r.top.slice(0, 3)).map(x => hLic(x.l)).find(h => h && hStars(h) <= 1 && cha(h) >= 90);
  if(fav) add(fav, 'election', fav === winner ? `${fav.name}, ${hStars(fav) ? 'a one-star Hunter' : 'a Hunter without a single star'}, wins the chairmanship on charisma and nerve. The old guard is stunned.` : pickR([`${fav.name}, ${hStars(fav) ? 'a one-star Hunter' : 'a Hunter with no stars at all'}, finishes among the leaders on charisma alone. Nobody saw it coming.`, `The surprise of the vote: ${fav.name}, ${hStars(fav) ? 'one star' : 'no stars'}, but a following no veteran can match.`, `${fav.name} never led a famous hunt, but half the Association knows ${pro('{their}', fav)} name. ${pro('{They}', fav)} ${pro('{are}', fav)} a real contender.`]), 9);
  { const ER = WORLD.elections[WORLD.elections.length - 1]; ER.named = zc.named.map(([z, h]) => ({z, l: h.license})); if(fav) ER.fav = fav.license; }   // kept for the Herald's election special
  if(rounds.length > 1) items.push({lic: '', name: '', kind: 'election', text: `${rounds.length} rounds of voting${voids ? `, ${voids} of them void for turnout under 95%` : ''}. ${rounds.filter(r => !r.void && r.adv).length ? `Nobody reached a majority until round ${rounds.length}.` : ''}`, rank: 9});
  { const P = prev && prev !== winner.license && hLic(prev); if(P && P.status !== 'Deceased') chairLeft(P, winner, ed, ed - prevSince, P.status === 'Missing' ? 'miss' : /abdicates/.test(reason) ? 'abd' : /renew/.test(reason) ? 'lost' : 'ret'); }
  add(winner, 'election', `${winner.name} ${pct > 50 ? `is ${again ? 're-elected' : 'elected'} Chairman of the Hunter Association with ${pct}% of the vote` : `is named Chairman of the Hunter Association after ${rounds.length} inconclusive rounds, as the last candidate standing`}${vice ? `, and names ${vice.name} Vice-Chairman${viceWhy ? ` (${viceWhy})` : ''}` : ''}.`, 11, vice || undefined);
  if(zc.named.length) items.push({lic: zc.named[0][1].license, name: zc.named[0][1].name, kind: 'zodiac', text: `The new Zodiac: ${zc.named.map(([z, h]) => `${h.name} (${z})`).join(', ')}${zc.kept.length ? `. ${zc.kept.length} kept their seat${zc.kept.length > 1 ? 's' : ''}` : ''}.`, rank: 8});
}
// the outgoing Chairman's own line: how the chairmanship ended
function chairLeft(P, W, ed, Y, how){
  const yrs = `${Y} year${Y === 1 ? '' : 's'}`, wn = W ? W.name : 'a successor';
  const T = how === 'lost' ? [`${P.name} calls an election to renew the mandate and loses it to ${wn}, after ${yrs} as Chairman.`, `After ${yrs} in office, ${P.name} asks the Association for another term. It chooses ${wn} instead.`]
    : how === 'abd' ? [`${P.name} abdicates the chairmanship after ${yrs}. ${wn} takes the seal.`, `${P.name} walks away from the chairmanship after ${yrs}, without a word of explanation. ${wn} succeeds ${pro('{them}', P)}.`]
    : how === 'miss' ? [`While ${P.name} is missing, the Association elects ${wn} in ${pro('{their}', P)} place. ${yrs} as Chairman end without a farewell.`, `The Association stops waiting for ${P.name}: ${wn} is elected Chairman. ${pro('{Their}', P)} office is cleared, ${pro('{their}', P)} coat left on the hook.`]
    : how === 'ret' ? [`${P.name} hands the chairmanship to ${wn} after ${yrs} in office.`, `${yrs} as Chairman end quietly: ${P.name} retires, and ${wn} is elected.`]
    : [`${P.name} leaves the chairmanship after ${yrs}. ${wn} succeeds ${pro('{them}', P)}.`];
  (P.log = P.log || []).push({ed, k: 'election', cl: 1, text: pickR(T)});
}
// who held which seat, and when: every change leaves a "former" record on the Hunter
function trackRoles(ed){
  if(!WORLD.chair) return;
  const now = {Chairman: WORLD.chair.lic, 'Vice-Chairman': WORLD.vice}; ZSIGNS.forEach(z => now[z] = (WORLD.zodiac || {})[z] || null);
  const hold = WORLD.seatHold = WORLD.seatHold || null, S2 = WORLD.since || {};
  rolesReady();
  const next = {}, ch = hLic(WORLD.chair.lic);
  Object.entries(now).forEach(([r, lic]) => { const was = hold && hold[r]; if(was && was.lic && was.lic !== lic){ const h = hLic(was.lic); if(h) (h.pastRoles = h.pastRoles || []).push({r, from: was.from, to: ed}); } });
  Object.entries(now).forEach(([r, lic]) => {
    const was = hold && hold[r];
    // the new holder's own career line, in place of the Association notice
    if(hold && lic && (!was || was.lic !== lic) && r !== 'Chairman'){
      const h = hLic(lic);
      if(h){
        h.log = (h.log || []).filter(x => !(x.ed === ed && x.text.includes(h.name) && !x.text.startsWith(h.name) && /Zodiac|Vice-Chairman/.test(x.text)));
        const fromZ = (h.pastRoles || []).find(x => x.to === ed && x.r !== r);
        h.log.push({ed, k: 'zodiac', text: `${h.name} ${r === 'Vice-Chairman' ? 'becomes Vice-Chairman of the Hunter Association' : `becomes the ${r} of the Zodiac`}${ch && ch !== h ? `, named by Chairman ${ch.name}` : ''}${fromZ ? `, leaving the ${fromZ.r === 'Chairman' ? 'chairmanship' : fromZ.r === 'Vice-Chairman' ? 'Vice-Chairmanship' : fromZ.r + ' seat'}` : ''}.`});
      }
    }
    next[r] = lic ? (was && was.lic === lic ? was : {lic, from: r === 'Chairman' ? WORLD.chair.since : r === 'Vice-Chairman' ? (S2.vice || ed) : (S2[r] || ed)}) : null;
  });
  WORLD.seatHold = next;
}
function rolesReady(){
  if(WORLD.chair && !WORLD.rolesBF3){ WORLD.rolesBF3 = true; const H = WORLD.chairHist || [];
    H.forEach((x, i) => { const P = hLic(x.lic); if(!x.to || !P || (P.diedEd != null && P.diedEd <= x.to) || (P.log || []).some(e => e.ed === x.to && (e.cl || /chairmanship|as Chairman|another term/.test(e.text)))) return; const N = H[i + 1] && hLic(H[i + 1].lic); chairLeft(P, N, x.to, x.to - x.from, ''); P.log.sort((a, b) => (a.ed || 0) - (b.ed || 0)); }); }
  if(!WORLD.chair || (WORLD.rolesBF && WORLD.rolesBF2)) return;
  if(!WORLD.rolesBF){   // older saves: past Chairmen are already on record
    WORLD.rolesBF = true;
    (WORLD.chairHist || []).filter(x => x.to).forEach(x => { const h = hLic(x.lic); if(h && !(h.pastRoles || []).some(r => r.r === 'Chairman' && r.from === x.from)) (h.pastRoles = h.pastRoles || []).push({r: 'Chairman', from: x.from, to: x.to}); });
  }
  if(!WORLD.rolesBF2){ WORLD.rolesBF2 = true; const now = {Chairman: WORLD.chair.lic, 'Vice-Chairman': WORLD.vice}; ZSIGNS.forEach(z => now[z] = (WORLD.zodiac || {})[z] || null); backfillRoles(now); }
}
// saves from before roles were tracked: rebuild past seats from the Hunters' own records and recent bulletins
function backfillRoles(now){
  const byName = new Map(HUNTERS.map(h => [h.name, h])), ev = new Map();
  const push = (name, ed, k, r) => { const h = byName.get(name); if(!h || ed == null) return; if(!ev.has(h)) ev.set(h, []); ev.get(h).push({ed, k, r}); };
  const scan = (text, ed) => {
    let m;
    if((m = text.match(/^Zodiac, the (\w+): (.+?) (?:steps down|gives up|resigns|retires|dies|goes missing|leaves|keeps|gave|is replaced|loses|is thanked)[^;]*; Chairman .+? names (.+?) in .+?'s place\.$/))){ push(m[2], ed, 'end', m[1]); push(m[3], ed, 'start', m[1]); }
    else if((m = text.match(/^(.+?) takes the empty (\w+) seat in the Zodiac/))) push(m[1], ed, 'start', m[2]);
    else if((m = text.match(/^(.+?) .*, leaving the (\w+) seat of the Zodiac empty/))) push(m[1], ed, 'end', m[2]);
    if((m = text.match(/names (.+?) Vice-Chairman/))) push(m[1], ed, 'start', 'Vice-Chairman');
    if((m = text.match(/^(.+?) steps down as Vice-Chairman/))) push(m[1], ed, 'end', 'Vice-Chairman');
    if((m = text.match(/^The new Zodiac: (.+?)(?:\. \d+ kept|\.$)/))) m[1].split(', ').forEach(x => { const q = x.match(/^(.+) \((\w+)\)$/); if(q) push(q[1], ed, 'start', q[2]); });
  };
  const seen = new Set();
  HUNTERS.forEach(h => (h.log || []).forEach(x => { const k = x.ed + '|' + x.text; if(!seen.has(k)){ seen.add(k); scan(x.text, x.ed); } }));
  (BULLETINS || []).forEach(b => (b.items || []).forEach(it => { const k = b.edition + '|' + it.text; if(!seen.has(k)){ seen.add(k); scan(it.text, b.edition); } }));
  ev.forEach((list, h) => {
    list.sort((a, b) => a.ed - b.ed || (a.k === 'end' ? -1 : 1));
    const open = {};
    list.forEach(e => {
      if(e.k === 'start'){ if(open[e.r] == null) open[e.r] = e.ed; }
      else { const from = open[e.r]; delete open[e.r]; if(!(h.pastRoles || []).some(x => x.r === e.r && x.to === e.ed)) (h.pastRoles = h.pastRoles || []).push({r: e.r, from: from ?? null, to: e.ed}); }
    });
    // still "open" but no longer in that seat: they left at some point the records lost
    Object.entries(open).forEach(([r, from]) => { if(now[r] !== h.license && !(h.pastRoles || []).some(x => x.r === r && x.from === from)) (h.pastRoles = h.pastRoles || []).push({r, from, to: null}); });
  });
}
const yrs = x => x.from != null && x.to != null ? (x.from === x.to ? ordinal(x.from) : `${ordinal(x.from)}–${ordinal(x.to)}`) : x.from != null ? `from the ${ordinal(x.from)}` : x.to != null ? `until the ${ordinal(x.to)}` : 'dates lost';
const ROLE_SHORT = r => r === 'Chairman' ? 'Chairman' : r === 'Vice-Chairman' ? 'Vice-Chairman' : r;
// "Former Monkey", "Former Vice-Chairman ×2" — the current seat is not a former one
// career lines: what kind of event each one is (older saves are read from the text)
const CAREER_IC = {relic:'⚱', case:'§', school:'⛩', pupil:'⛩', wed:'⚭', reunion:'⇄', memorial:'❖', zodiac:'✧', chair:'♛', elder:'✪', election:'⚖', promo:'★', nen:'✦', exped:'▲', rival:'⚔', bond:'∞', death:'✝', missing:'?', retire:'◐', avenge:'✝', epilogue:'✓', debut:'+', duty:'◆', award:'✪', scandal:'!', hunt:'⌖', crisis:'⚠', regional:'⌂', origin:'◉'};
function careerKind(x){
  const t = x.text || '';
  if(/\ban Elder\b|Elder of the Association/.test(t)) return 'elder';
  let k = x.k;
  const role = /\bZodiac\b|Vice-Chairman|\b(Rat|Ox|Tiger|Rabbit|Dragon|Snake|Horse|Sheep|Monkey|Rooster|Dog|Boar) seat\b|reshuffle/.test(t) || /becomes Chairman|elected Chairman|named Chairman|as Chairman/.test(t);
  if(k === 'job' || k === 'life' || k === 'fail'){   // ordinary work: only the big markers count
    k = /Dark Continent/.test(t) ? 'exped' : role ? 'zodiac' : /★|\bstars?\b \(|promoted to|earns? (a|its|their|his|her) (first |second |third )?star/i.test(t) ? 'promo' : k;
  } else if(!k){                                      // older saves: read the text
    k = /Dark Continent|expedition/i.test(t) ? 'exped' : role ? 'zodiac'
      : /\belection|\bvotes?\b|ballot|candidacy/i.test(t) ? 'election'
      : /★|promoted to|earns? (a|its|their|his|her) (first |second |third )?star/i.test(t) ? 'promo'
      : new RegExp('^\\S+ \\S+ (dies|died|is killed|was killed)').test(t) ? 'death' : /\bmissing\b/.test(t) ? 'missing'
      : /\bretire/i.test(t) ? 'retire'
      : /\bNen\b|Hatsu|\bVow\b|technique/.test(t) ? 'nen'
      : /\brival|\bduel\b|grudge/i.test(t) ? 'rival' : 'job';
  }
  if((k === 'zodiac' || k === 'election') && /\b(becomes|elected|named) Chairman\b|is elected Chairman|Chairman of the Hunter Association|Vice-Chairman/.test(t) && !/of the Zodiac/.test(t)) k = 'chair';
  return k;
}
// a Hunter's career, one block per year; older years fold away
function careerHtml(h){
  const groups = [];
  (h.log || []).slice().reverse().forEach(x => { const g = groups[groups.length - 1]; if(g && g.ed === x.ed) g.list.push(x); else groups.push({ed: x.ed, list: [x]}); });
  const line = x => { const k = careerKind(x), txt = x.text.startsWith(h.name + ' ') && !x.text.startsWith(h.name + ' and ') ? x.text.slice(h.name.length + 1) : x.text;
    return `<div class="bl ${k}"><i>${CAREER_IC[k] || '·'}</i><span>${esc(txt.charAt(0).toUpperCase() + txt.slice(1))}</span></div>`; };
  const block = g => `<div class="cy"><div class="cy-h">After the ${ordinal(g.ed)}</div>${g.list.map(line).join('')}</div>`;
  const KEEP = 5, recent = groups.slice(0, KEEP), older = groups.slice(KEEP);
  return recent.map(block).join('') + (older.length ? `<details class="cy-old"><summary>Earlier years · ${older.length}</summary>${older.map(block).join('')}</details>` : '');
}
const isElder = h => !!h.elder || postCount(h) >= 3;
const specialTags = h => [isElder(h) ? 'Elder of the Association' : null, h.scouted ? 'Scouted by you' : null, h.mentored ? 'Trained by you' : null, h.longlived ? 'Long-lived' : null, (h.retHist || []).length ? 'Returned' : null, h.starCup === 'champion' ? '★ Centennial Star' : null, h.special === 'centenary' ? 'Centennial' : h.special === 'jubilee' ? 'Jubilee' : null, h.catTag ? `✚ ${h.catTag}` : null, h.regional ? 'Regional' : null].filter(Boolean);
function pastTags(h){
  rolesReady();
  const cur = roleOf(h), curR = cur ? (cur.startsWith('Zodiac') ? cur.split(' · ')[1] : cur) : null, n = {};
  (h.pastRoles || []).forEach(x => { n[x.r] = (n[x.r] || 0) + 1; });
  const order = r => r === 'Chairman' ? 0 : r === 'Vice-Chairman' ? 1 : 2;
  const last = r => Math.max(...(h.pastRoles || []).filter(x => x.r === r).map(x => x.to ?? x.from ?? 0));
  return Object.keys(n).sort((a, b) => last(b) - last(a) || order(a) - order(b)).map(r => ({r, n: n[r], cur: r === curR, label: `Former ${ROLE_SHORT(r)}${n[r] > 1 ? ' ×' + n[r] : ''}`}));
}
function politicsYear(ed, add, items){ politicsCore(ed, add, items); trackRoles(ed); elders(ed, add); }
// three posts or more (Chairman, Vice-Chairman, Zodiac seats, repeats included) make an Elder of the Association
const postCount = h => (h.pastRoles || []).length + (roleOf(h) ? 1 : 0);
function elders(ed, add){
  const quiet = !WORLD.elderBF; WORLD.elderBF = 1;   // older saves: recognise who already qualifies, without a flood of news
  HUNTERS.forEach(h => {
    if(h.elder || !hActive(h) || postCount(h) < 3) return;
    h.elder = ed; if(quiet || !add) return;
    const posts = postCount(h), ch = hLic(WORLD.chair && WORLD.chair.lic);
    add(h, 'award', pickR([
      `${h.name} is named an Elder of the Association after holding ${posts} posts at the top of it. ${ch && ch !== h ? `Chairman ${ch.name} hands over the seal in person.` : 'The ceremony is short. The applause is not.'}`,
      `The Association recognises ${h.name} as an Elder: ${posts} posts, and still not done.`,
      `${h.name} becomes an Elder of the Association. Few people alive have sat at that table in so many chairs.`,
      `A rare title for a rare career: ${h.name}, ${posts} posts in the Association's leadership, is now an Elder.`]), 9);
  });
}
function politicsCore(ed, add, items){
  ensureChair(ed);
  const ch = hLic(WORLD.chair && WORLD.chair.lic); if(!ch) return;
  let reason = null;
  const chq = hActive(ch) ? caseSeat(ch, ed) : null, cl = WORLD.claim && WORLD.claim.ed === ed && hLic(WORLD.claim.lic);
  if(!hActive(ch) && ch.revoked === ed) reason = `Chairman ${ch.name} loses the Hunter License by verdict of the council. An election is called.`;
  else if(chq) reason = `Chairman ${ch.name} ${chq}. An election is called.`;
  else if(cl && hActive(cl) && cl !== ch) reason = `${cl.name}, the Chairman who vanished, comes back and demands the seat. An election is called.`;
  else if(!hActive(ch)) reason = ch.status === 'Deceased' ? `Chairman ${ch.name} has died. An election is called.` : ch.status === 'Missing' ? (WORLD.origin && WORLD.origin.k === 'dark' && !WORLD.origin.voted ? (WORLD.origin.voted = true, `After the Dark Years, the Association declares Chairman ${ch.name} lost and calls its first election in a generation.`) : `Chairman ${ch.name} has gone missing. After months of waiting, an election is called.`) : `Chairman ${ch.name} retires. An election is called.`;
  else if(Math.random() < 0.035){ reason = `Chairman ${ch.name} abdicates without warning. An election is called.`; ch.wasChair = ed; }
  else if(Math.random() < 0.05 + (ed - WORLD.chair.since) * 0.004){ reason = `Chairman ${ch.name} calls a new election to renew the mandate.`; }
  if(reason){ runElection(ed, reason, add, items); return; }
  // the Vice and the Zodiac come and go
  const v = hLic(WORLD.vice);
  const vq = usable(v) ? caseSeat(v, ed) : null;
  if(!usable(v) || vq || Math.random() < 0.03){ const nv = trusted(ch, HUNTERS.filter(h => usable(h) && hStars(h) >= 2 && h !== ch && !caseOf(h))); if(v && usable(v)) add(v, 'zodiac', vq ? `${v.name} ${vq} as Vice-Chairman.` : `${v.name} steps down as Vice-Chairman.`, 6); WORLD.vice = nv ? nv.license : null; seatSince('vice', ed); if(nv) add(nv, 'zodiac', `Chairman ${ch.name} names ${nv.name} Vice-Chairman.`, 7); }
  WORLD.stay = WORLD.stay || {};
  const fresh = ed - WORLD.chair.since === 1 && /^elected/.test(WORLD.chair.how || '') && WORLD.chair.lic !== WORLD.chair.prevLic;   // a new Chairman's first year: a few seats change hands
  const purge = fresh && Math.random() < 0.45 ? new Set(ZSIGNS.filter(z => usable(hLic(WORLD.zodiac[z]))).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3))) : new Set();
  ZSIGNS.forEach(z => {
    const cur = hLic(WORLD.zodiac[z]);
    let quit = false, qwhy = null;
    if(usable(cur)){
      const tenure = ed - ((WORLD.since || {})[z] || ed), age = hunterAge(cur);
      const cq = caseSeat(cur, ed);
      if(cq){ quit = true; qwhy = cq; }
      else if(WORLD.stay[z] === cur.license){ quit = true; qwhy = pickR(['keeps the promise of one more year, and not a day longer', 'gave the Chairman the extra year and now walks away']); delete WORLD.stay[z]; }
      else if(purge.has(z)){ quit = true; qwhy = pickR([`is replaced as the new Chairman reshapes the Zodiac`, `loses the seat in the new Chairman's first reshuffle`, `is thanked for ${PR(cur).their} service and let go by the new Chairman`]); }
      else if(tenure >= 1 && Math.random() < Math.min(0.9, 0.19 + tenure * 0.01 + Math.max(0, effAge(cur, age) - 65) * 0.01)){   // a desk job: 20% after the first year, +1% each year after
        if(Math.random() < 0.25){ WORLD.stay[z] = cur.license; add(cur, 'zodiac', `${cur.name} asks to leave the ${z} seat. Chairman ${ch.name} asks for one more year, and ${cur.name.split(' ')[0]} agrees.`, 5); return; }
        quit = true;
        const R = [[`steps down after ${tenure} year${tenure === 1 ? '' : 's'}, saying ${PR(cur).they} ${PR(cur).are} tired`, tenure >= 6 ? 3 : 0.5], [`retires from the Zodiac at ${age}`, age >= 60 ? 4 : 0], [`resigns after a public clash with Chairman ${ch.name}`, (ch.rivals || []).includes(cur.cid) ? 5 : 1], [`resigns as a scandal breaks around ${PR(cur).their} last mission`, 0.6], [`gives up the seat to go back to the field`, 2], [`leaves to take care of ${PR(cur).their} family`, 1], [`resigns in protest at the last election`, (WORLD.elections || []).some(e => e.ed >= ed - 2) ? 1.5 : 0], [`steps down, saying the work is elsewhere`, 1]];
        qwhy = wpickM(R, r => r[1])[0];
      }
      if(!quit) return;
    }
    const why = !cur ? null : quit ? qwhy : cur.revoked === ed ? 'loses the Hunter License by verdict of the council' : cur.status === 'Deceased' ? (cur.killedBy && cur.diedEd >= ed - 1 ? `was killed by ${cur.killedBy}` : 'dies') : cur.status === 'Missing' ? 'goes missing' : cur.status === 'Retired' ? 'retires' : 'leaves for the Dark Continent';
    const nz = zPick(ch, z, council()); WORLD.zodiac[z] = nz ? nz.license : null; if(nz) seatSince(z, ed);
    if(nz) add(nz, 'zodiac', cur ? `Zodiac, the ${z}: ${cur.name} ${why}; Chairman ${ch.name} names ${nz.name} in ${cur.name.split(' ')[0]}'s place.` : `${nz.name} takes the empty ${z} seat in the Zodiac.`, 7, cur || undefined);
    else if(cur) add(cur, 'zodiac', `${cur.name} ${why}, leaving the ${z} seat of the Zodiac empty.`, 6);
  });
}
function keepHtml(h){
  const K = h.keep; if(!K) return '';
  const who = x => { const hh = HUNTERS.find(y => y.cid === x.id); return hh ? `<a data-hunter="${esc(hh.license)}">${esc(x.name.split(' ')[0])}</a>` : esc(x.name.split(' ')[0]); };
  // the bio was written on licensing day; the age in it would be out of date, so it is taken out
  const bio = (K.bio || '').replace(/\ban? \d+-year-old (\w)/g, (m, c) => (/[aeiou]/i.test(c) ? 'an ' : 'a ') + c).replace(/\bis \d+ and (an?) /g, 'is $1 ').replace(/,? (?:at|aged) \d+(?=[,.])/g, '');
  const bg = `<div class="kp-bg">${bio ? `<p>${esc(bio)}</p>` : ''}${K.fam ? `<div class="kp-row"><small>Family</small><span>${esc(K.fam.name)}${K.fam.kin.length ? ' · ' + K.fam.kin.map(x => `${esc(x.rel)} ${who(x)}`).join(', ') : ''}</span></div>` : ''}</div>`;
  const ex = K.ex && K.ex.length ? `<ol class="kp-ex">${K.ex.map((x, i) => `<li>${i === 0 || K.ex[i - 1].ph !== x.ph ? `<small>${esc(x.ph)}</small>` : ''}<span>${autoLink(esc(x.t), h.cid)}</span></li>`).join('')}</ol>` : '<p class="muted" style="font-size:13px">A quiet exam, by all accounts.</p>';
  return `<div class="kp"><div><div class="section-h">Background</div>${bg}</div><div><div class="section-h">The ${ordinal(K.ed)} exam</div>${ex}</div></div>`;
}
function retireBanner(h){
  const now = h.status === 'Retired' ? (h.retire || (h.retEd ? {ed: h.retEd} : null)) : null, past = h.retHist || [];
  if(!now && !past.length) return '';
  const line = r => `Retired${r.age ? ` at ${r.age}` : ''}${r.ed ? `, after the ${ordinal(r.ed)}` : ''}${r.why && r.why !== 'of age' ? ` · ${r.why}` : ''}`;
  return `<div class="rolebanner past"><small>${now ? 'Retired' : 'Career'}</small>${now ? `<div class="rb-l">${esc(line(now))}</div>` : ''}${past.map(r => `<div class="rb-l muted">${esc(line(r))}${r.back ? ` — came out of retirement after the ${ordinal(r.back)}` : ''}</div>`).join('')}</div>`;
}
function roleBanner(h){
  rolesReady();
  const S2 = WORLD.since || {}, cur = roleOf(h), lines = [];
  const terms = (WORLD.chairHist || []).filter(x => x.lic === h.license);
  const past = terms.filter(x => x.to).map(x => `${ordinal(x.from)}–${ordinal(x.to)}`);
  const pastOther = (h.pastRoles || []).filter(x => x.r !== 'Chairman');
  const votes = (WORLD.elections || []).map(e => { const best = e.rounds.filter(r => !r.void).map(r => { const x = (r.top || []).find(y => y.l === h.license); return x ? x.v / r.valid : 0; }); const m = Math.max(0, ...best); return m ? {ed: e.ed, m, won: e.winner === h.license} : null; }).filter(Boolean);
  if(!cur && !past.length && !votes.length && !pastOther.length) return '';
  let k = 'past', kj = '', title = '', sub = '';
  if(cur === 'Chairman'){ k = 'chair'; kj = '会長'; title = 'Chairman of the Hunter Association'; sub = `In office since the ${ordinal(WORLD.chair.since)} exam · ${esc(WORLD.chair.how || '')}`; }
  else if(cur === 'Vice-Chairman'){ k = 'vice'; kj = '副会長'; title = 'Vice-Chairman of the Hunter Association'; sub = S2.vice ? `Named after the ${ordinal(S2.vice)} exam` : ''; }
  else if(cur){ const z = cur.split(' · ')[1]; k = 'zod'; kj = ZKANJI[z]; title = `The ${z} of the Zodiac`; sub = (S2[z] ? `Holds the ${z} seat since the ${ordinal(S2[z])} exam` : 'One of the twelve'); }
  const zAlso = (cur === 'Chairman' || cur === 'Vice-Chairman') && zodOf(h);
  if(cur === 'Vice-Chairman' && CHAIR && CHAIR.title) sub = (sub ? sub + ' · ' : '') + 'Acting Chairman while the Chairman is missing';
  if(cur && !hActive(h)) sub = (sub ? sub + ' · ' : '') + (h.status === 'Missing' ? `missing since the ${ordinal(h.missEd || 0)}` : h.status === 'Deceased' ? 'died in office' : esc(h.status.toLowerCase()));
  // every former seat on its own line, most recent first; elections below a dotted rule
  const formers = terms.filter(x => x.to).map(x => ({r: 'Chairman', from: x.from, to: x.to})).concat(pastOther)
    .sort((a, b) => ((b.to ?? b.from ?? 0) - (a.to ?? a.from ?? 0)));
  formers.forEach(x => lines.push(`Former ${x.r === 'Chairman' || x.r === 'Vice-Chairman' ? x.r : x.r + ' of the Zodiac'} (${yrs(x)})`));
  if(votes.length) lines.push('\u0001Elections: ' + votes.slice(-3).map(v => `${ordinal(v.ed)} — ${v.won ? 'won' : `best round ${(v.m * 100).toFixed(1)}%`}`).join(' · '));
  const ln = (l, mu) => l.startsWith('\u0001') ? `<div class="rb-l rb-el${mu ? ' muted' : ''}">${esc(l.slice(1))}</div>` : `<div class="rb-l${mu ? ' muted' : ''}">${esc(l)}</div>`;
  if(!cur) return `<div class="rolebanner past"><small>Association politics</small>${lines.map(l => ln(l)).join('')}</div>`;
  return `<div class="rolebanner ${k}"><span class="kj" aria-hidden="true">${kj}</span><small>${k === 'zod' ? 'Zodiac' : 'Hunter Association'}</small><b>${title}</b>${sub ? `<div class="rb-l">${sub}</div>` : ''}${zAlso ? `<div class="rb-l rb-also"><i>${ZKANJI[zAlso]}</i><span>Also the ${zAlso} of the Zodiac${S2[zAlso] ? ` · seat held since the ${ordinal(S2[zAlso])}` : ''}</span></div>` : ''}${lines.map(l => ln(l, true)).join('')}</div>`;
}
const CC_OPEN = new Set();
function councilHtml(){
  if(!WORLD.chair) return '';
  const hb = l => { const h = hLic(l); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a> <span class="stars" style="font-size:11px">${starStr(hStars(h))}</span>` : '<span class="muted">vacant</span>'; };
  const E = WORLD.elections[WORLD.elections.length - 1];
  rolesReady();
  // past holders of a seat, most recent first
  const seatHist = seat => (seat === 'Chairman' ? (WORLD.chairHist || []).filter(x => x.to).map(x => ({lic: x.lic, from: x.from, to: x.to}))
      : HUNTERS.flatMap(h => (h.pastRoles || []).filter(r => r.r === seat).map(r => ({lic: h.license, from: r.from, to: r.to}))))
    .sort((a, b) => (b.to ?? b.from ?? 0) - (a.to ?? a.from ?? 0));
  const past = seat => { const L = seatHist(seat); if(!L.length) return '';
    return `<button class="cc-h" data-seathist="${seat}" aria-expanded="${CC_OPEN.has(seat)}">${L.length} before</button><div class="cc-past"${CC_OPEN.has(seat) ? '' : ' hidden'}>${L.map(x => { const h = hLic(x.lic); return `<div>${h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—'} <span>${yrs(x)}${h && !hActive(h) ? ' · ' + esc(h.status.toLowerCase()) : ''}</span></div>`; }).join('')}</div>`; };
  const yrsIn = s => { if(s == null) return ''; const n = Math.max(0, S.edition - s); return n ? `(${n} yr${n === 1 ? '' : 's'})` : '(new)'; };
  const card = (k, kj, role, l, note, seat) => { let h = hLic(l);
    // a seat whose holder is dead or missing reads as vacant until it is filled
    if(h && !hActive(h)){ note = h.status === 'Missing' ? `${esc(h.name)} missing since the ${ordinal(h.missEd || WORLD.chair.since)}` : `${esc(h.name)} ${h.status === 'Deceased' ? 'died' : h.status.toLowerCase()}`; h = null; }
    return `<div class="cc ${k}"${h ? ` data-hunter="${esc(h.license)}"` : ''}><span class="kj" aria-hidden="true">${kj}</span><small>${role}${note ? (note.startsWith('(') ? ' ' : ' · ') + note : ''}</small>${h ? `<b>${esc(h.name)}</b><span class="cc-sub"><span class="stars">${starStr(hStars(h))}</span> ${esc((h.career || '').replace(' Hunter', ''))} · ${hunterAge(h)}</span>` : '<b class="muted">Vacant</b>'}${seat ? past(seat) : ''}</div>`; };
  const rnd = r => r.void ? `<div class="el-r void"><b>Round ${r.n}</b> · turnout ${(r.turnout * 100).toFixed(1)}% — void, under 95%. The vote is held again.</div>`
    : `<div class="el-r"><b>Round ${r.n}</b> · turnout ${(r.turnout * 100).toFixed(1)}% · ${fmt(r.valid)} valid votes${r.blank ? ` · ${r.blank} blank` : ''}${r.adv ? ` · no majority, top ${r.adv} go on` : ' · majority reached'}
      <div class="el-bars">${r.top.slice(0, r.adv ? Math.min(8, r.adv) : 4).map((x, i) => `<div><span>${hb(x.l)}</span><i style="width:${Math.max(2, x.v / r.valid * 100)}%"></i><em>${fmt(x.v)} · ${(x.v / r.valid * 100).toFixed(1)}%</em></div>`).join('')}</div></div>`;
  return `<div><div class="section-h">Chairman & Zodiac</div>
    <div class="council">${card('chair', '会長', 'Chairman', WORLD.chair.lic, `since the ${ordinal(WORLD.chair.since)} ${yrsIn(WORLD.chair.since)}`, 'Chairman')}${card('vice', '副会長', 'Vice-Chairman', WORLD.vice, CHAIR && CHAIR.title ? 'acting Chairman' : yrsIn((WORLD.since || {}).vice), 'Vice-Chairman')}</div>
    <div class="zgrid">${ZSIGNS.map(z => card('zod', ZKANJI[z], 'The ' + z, WORLD.zodiac[z], yrsIn((WORLD.since || {})[z]), z)).join('')}</div>
    ${E ? `<details class="elec"><summary>Last election · after the ${ordinal(E.ed)} exam · ${E.rounds.length} round${E.rounds.length > 1 ? 's' : ''}</summary><p class="muted" style="font-size:12.5px;margin:6px 0">Every licensed Hunter votes and can be voted for. A round needs 95% turnout to count; a candidate needs more than half the valid votes.</p>${E.rounds.map(rnd).join('')}</details>` : '<p class="muted" style="font-size:12.5px">No election has been held since the records began.</p>'}
    ${WORLD.elections.length > 1 ? `<p class="muted" style="font-size:12px;margin:6px 0 0">Earlier Chairmen: ${WORLD.elections.slice(0, -1).reverse().map(e => { const h = hLic(e.winner); return h ? `${esc(h.name)} (${ordinal(e.ed)})` : ''; }).filter(Boolean).join(' · ')}</p>` : ''}</div>`;
}
// one year of Hunter careers, between the end of one exam and the start of the next
// reputation earned over the last ten years (older saves count everything until the history fills up)
const rpRecent = h => (h.rp || 0) - (h.rpH && h.rpH.length >= 10 ? h.rpH[0] : 0);
function hunterYear(prev){
  const items = [], ed = prev.edition, nextEd = ed + 1;
  const add = (h, kind, text, rank, o) => { text = String(text).replace(/\.\.$/, '.'); items.push({lic: h.license, name: h.name, kind, text, rank: rank || 0, o: o ? {lic: o.license, name: o.name} : undefined}); (h.log = h.log || []).push({ed, text, k: kind}); if(o) (o.log = o.log || []).push({ed, text, k: kind}); if(o && ['job', 'epilogue', 'reunion'].includes(kind)) tieUp(h, o); };
  const busy = new Set();
  relicsStart(ed);
  const W = worldStart(prev, ed, add, busy, items);
  placesYear(ed, add, items);
  // examiner duty in the exam that just finished
  (prev.phaseSpec || []).forEach(sp => { if(sp.ex && sp.ex.license){ const h = HUNTERS.find(x => x.license === sp.ex.license); if(h) add(h, 'duty', `${h.name} served as examiner for the ${PHASE_DEFS[sp.id].name} in the ${ordinal(ed)} Hunter Exam.`, 1); } });
  // the Association keeps its numbers up: when the roster thins, Hunters take fewer risks, retire later, and some come back
  const nAct = HUNTERS.filter(h => hActive(h) && !h.legacy).length, thin = Math.max(0.15, Math.min(1, (nAct - 480) / 220));
  if(nAct < 540) HUNTERS.filter(h => h.status === 'Retired' && !h.legacy && !h.licSold && hunterAge(h) < 66 && h.retEd !== ed).forEach(h => {
    if(Math.random() < (540 - nAct) / 540 * 0.25){ h.status = 'Active Hunter'; h.unretired = (h.unretired || 0) + 1; if(h.retire) h.retire.back = ed; (h.retHist = h.retHist || []).push(h.retire || {ed: h.retEd, back: ed}); h.retire = null;
      add(h, 'retire', pickR([`${h.name} comes out of retirement. The Association needs people, and ${pro('{they} {were}', h)} bored anyway.`, `${h.name} is back on active duty at ${hunterAge(h)}. "Somebody has to train these kids."`, `Retirement did not suit ${h.name}. ${pro('{They} {have}', h)} renewed ${pro('{their}', h)} license.`, `${h.name} answers the Association's call for experienced Hunters and returns to the field.`]), 5); }
  });
  if(!WORLD.longBF){ WORLD.longBF = true; HUNTERS.filter(h => !h.legacy && h.status !== 'Deceased' && hunterAge(h) > 95).forEach(h => { h.longlived = true; }); }
  // quietly, in the background: retired Hunters die off — 1% the first year, 2% the next, and so on; the long-missing are declared dead
  HUNTERS.forEach(h => {
    if(h.legacy) return;
    if(h.status === 'Retired'){
      const since = (h.retire && h.retire.ed) ?? h.retEd ?? (h.retEd = ed);
      const yrs = Math.max(1, ed - since + 1), a = h.age + Math.max(0, ed + 1 - h.edition);
      if(Math.random() < Math.min(0.95, yrs * (h.longlived ? 0.003 : 0.01) + Math.max(0, effAge(h, a) - 85) * 0.03)){ h.status = 'Deceased'; h.diedEd = ed; (h.log = h.log || []).push({ed, k: 'death', text: pro(pickR([`${h.name} died in retirement, at ${a}.`, `${h.name} died at ${a}, ${yrs} year${yrs === 1 ? '' : 's'} after hanging up the license.`, `${h.name} died peacefully at ${a}, far from the field.`]), h)}); }
    } else if(h.status === 'Missing'){
      const since = h.missEd ?? h.diedEd; if(since != null && ed - since >= 30){ h.status = 'Deceased'; h.diedEd = ed; delete h.missEd; (h.log = h.log || []).push({ed, k: 'death', text: `After ${ed - since} years missing, ${h.name} is declared dead by the Association.`}); }
    }
  });
  // the missing: now and then one is found — alive, or not
  HUNTERS.filter(h => h.status === 'Missing' && !h.legacy && !(WORLD.exped && WORLD.exped.rescue && h.lostIn === WORLD.exped.rescue)).forEach(h => {
    if(h.missEd == null && h.diedEd == null) h.missEd = ed - 3;   // older saves never recorded when
    const since = h.missEd ?? h.diedEd ?? ed, yrs = Math.max(1, ed - since);
    if(since >= ed || Math.random() >= relReturnP(h)) return;
    const dc = !!h.lostIn, pl = dc ? 'the Dark Continent' : pickR(PLACES), Y = yrs === 1 ? 'a year' : yrs + ' years';
    const f = (s, x) => pro(s, h);
    if(Math.random() < (dc ? 0.35 : 0.55) - Math.min(0.25, yrs * 0.02)){
      const lostIn0 = h.lostIn; h.status = 'Active Hunter'; delete h.diedEd; delete h.lostIn; delete h.missEd; h.rp = (h.rp || 0) + 60;
      add(h, 'missing', f(pickR(dc ? [
        `${h.name} walks into a harbour on the coast, alone, ${Y} after vanishing on the Dark Continent. {They} will not say how {they} got back.`,
        `A fishing boat picks up ${h.name} drifting off the Begerosse Sea, ${Y} after the expedition lost {them}. {They} {are} thinner, quieter, and alive.`,
        `${h.name} is back from the Dark Continent after ${Y}. {Their} hair has gone white. {They} {are} ${hunterAge(h)}.`
      ] : [
        `${h.name} turns up in ${pl}, ${Y} after going missing, with no memory of where {they} {have} been.`,
        `${h.name} is found alive in ${pl}, ${Y} later, held prisoner by a smuggling ring. {They} {are} back on duty within the month.`,
        `After ${Y} of silence, ${h.name} walks into an Association office in ${pl} and asks if {their} license is still valid. It is.`,
        `${h.name} had been living under another name in ${pl} for ${Y}, deep undercover. Nobody had been told.`,
        `A rescue team finds ${h.name} in ${pl}, ${Y} after {they} vanished. {They} had been waiting for them.`
      ])), 9);
      afterReturn(h, ed, add, since, lostIn0);
    } else {
      h.status = 'Deceased'; h.diedEd = ed; delete h.missEd;
      add(h, 'death', f(pickR(dc ? [
        `A later crew finds ${h.name}'s journal on the Dark Continent, ${Y} after {they} vanished. The last page is dated a week after {they} went missing.`,
        `${h.name}'s Hunter License is found on the Dark Continent, ${Y} on, next to remains nobody can identify for certain. The Association declares {them} dead.`
      ] : [
        `${h.name}'s remains are found in ${pl}, ${Y} after {they} went missing. {They} died where {they} {were} last seen.`,
        `A search party in ${pl} finds ${h.name}'s license and a camp that had been empty for ${Y}. The search is over.`,
        `${h.name}, missing for ${Y}, is identified among the victims of a collapse in ${pl}.`,
        `After ${Y}, the Association closes ${h.name}'s file. A body found in ${pl} has been identified.`,
        `${h.name}'s last letter reaches the Association ${Y} late, from ${pl}. It explains everything, except how to bring {them} home.`
      ])), 8);
      mournFor(h, ed, add);
    }
  });
  { const nx = specialOf(nextEd); if(nx) items.push({lic: '', name: '', kind: 'election', rank: 4, text: nx === 'jubilee' ? `The Association announces that the ${ordinal(nextEd)} Hunter Exam will be a Jubilee: four brackets and up to 48 licenses. Applications are already pouring in.` : `The ${ordinal(nextEd)} Hunter Exam will be the Centenary. ${CHAIR ? 'Chairman ' + CHAIR.name : 'The Chairman'} promises the hardest exam in a hundred years, and a star for the best of the new Hunters.`}); }
  HUNTERS.filter(h => hActive(h) && !h.legacy && h.edition <= ed).forEach(h => {
    h.rp = h.rp || 0;
    if(h.special === 'jubilee' && ed - h.edition < 5) h.rp = Math.max(0, h.rp - 12);   // "a Jubilee Hunter": the old guard is slow to trust them
    if(h.special === 'jubilee' && h.edition === ed && Math.random() < 0.08) add(h, 'debut', pickR([`Some veterans refuse to work with ${h.name}. "A Jubilee license," one of them says, as if that settles it.`, `${h.name} hears the words "Jubilee Hunter" behind ${pro('{their}', h)} back for the first time. ${pro('{They}', h)} decide${pro('{s}', h)} to prove them wrong.`]), 3);
    const before = hStars(h), sk = careerSkill(h), area = (h.career || 'Head Hunter').replace(' Hunter', '');
    const ageNow = h.age + Math.max(0, nextEd - h.edition);
    if(h.edition === ed){
      add(h, 'debut', fillH(pickR(DEBUT), h, {c: h.career || 'Hunter'}), 1);
      const mate = (h.bonds || []).map(b => HUNTERS.find(x => x.cid === b.id)).find(x => x && x.edition === ed && x.cid > h.cid);
      if(mate){ add(h, 'epilogue', `${h.name} and ${mate.name}, inseparable since the exam, set out together as a team.`, 7); (mate.log = mate.log || []).push({ed, k: 'bond', text: `${mate.name} set out together with ${h.name}.`}); }
    }
    if(h.motive !== undefined && h.motive !== null && !h.motiveDone && RESOLVE[h.motive] && Math.random() < (h.edition === ed ? 0.1 : 0.15)){ h.motiveDone = ed; add(h, 'epilogue', pro(RESOLVE[h.motive].replace('{n}', h.name), h), 6); }
    (h.rpH = h.rpH || []).push(h.rp || 0); if(h.rpH.length > 10) h.rpH.shift();   // reputation at the start of each of the last 10 years
    growAttrs(h, ageNow);
    if(h.exped === WORLD.exped?.id && WORLD.exped) return;   // away on the expedition this year
    if(h.susp && h.susp >= ed) return;   // suspended by the council: no contracts this year
    const hot = W.crisis && W.crisis.areas.includes(area);
    const risk = (0.01 + (['Blacklist','Crime','Virus'].includes(area) ? 0.012 : 0) - before * 0.002) * (hot ? 1.8 : 1) * thin * relRisk(h, ageNow);
    if(Math.random() < risk && !relicSaves(h, ed, add, 'field')){ const D = deathOf(h, ed, ageNow, area, hot); h.status = 'Deceased'; h.diedEd = ed; add(h, 'death', D.t, D.rank || 9, D.o); mournFor(h, ed, add, D.o); return; }
    if(Math.random() < 0.004 * thin * relMiss(h)){ h.status = 'Missing'; h.missEd = ed; add(h, 'missing', fillH(pickR(MISSING), h), 8); return; }
    if(effAge(h, ageNow) > 85 && Math.random() < (effAge(h, ageNow) - 85) * 0.012){ h.status = 'Deceased'; h.diedEd = ed; const st = before ? ', a ' + starStr(before) + ' Hunter to the end' : '';
      // lines that make a claim are only used when the record backs it up
      const mates = h.pro ? [] : HUNTERS.filter(x => x !== h && !x.pro && x.edition === h.edition), gone = mates.filter(x => x.status === 'Deceased').length;
      const taught = (h.log || []).some(x => /apprentice|taught|teaching|students|school/.test(x.text));
      add(h, 'death', pickR([`${h.name} died peacefully at ${ageNow}${st}.`, `${h.name} died at ${ageNow}, in ${pro('{their}', h)} own bed, which surprised everyone who knew ${pro('{them}', h)}${st}.`, `${h.name}, ${ageNow}, died between two pages of the memoir ${pro('{they} {were}', h)} writing.`]
        .concat(mates.length >= 2 && gone / mates.length >= 0.75 ? [`${h.name} died at ${ageNow}. ${pro('{They}', h)} had outlived ${gone === mates.length ? 'everyone' : `${gone} of the ${mates.length} others`} from the ${ordinal(h.edition)} exam.`] : [])
        .concat(taught ? [`${h.name} died at ${ageNow}, still answering letters from Hunters ${pro('{they}', h)} had trained${st}.`] : [])), 8); mournFor(h, ed, add); return; }
    if(effAge(h, ageNow) >= 60 && Math.random() < relRetire(h) * 0.08 * Math.max(0.55, thin) * (h.unretired ? 2 : 1)){ h.status = 'Retired'; h.retEd = ed; retireRec(h, ed, 'of age'); add(h, 'retire', fillH(pickR(RETIRE), h, {age: ageNow, st: before ? ' as a ' + starStr(before) + ' Hunter' : ''}), 6); return; }
    // a few leave young: an injury, a family, a scandal, a loss
    if(ageNow < 60 && Math.random() < 0.003 * Math.max(0.55, thin)){
      const pl = pickR(PLACES), lostB = (h.bonds || []).map(b => HUNTERS.find(x => x.cid === b.id)).find(x => x && x.status === 'Deceased');
      const R = [[`a career-ending injury in ${pl}`, `${h.name} retires at ${ageNow} after a career-ending injury in ${pl}.`, 3], ['burnout', `${h.name} retires at ${ageNow}. "I'm tired," is all ${pro('{they}', h)} will say.`, 3],
        ['to raise a family', `${h.name} hands back the license at ${ageNow} to raise a family.`, 2], [`to take over the family business in ${pl}`, `${h.name} retires at ${ageNow} to run the family business in ${pl}.`, 2],
        ['after a scandal', `${h.name} retires at ${ageNow} as a scandal closes in. The Association does not ask ${pro('{them}', h)} to stay.`, 1], ['having lost faith in the Association', `${h.name} quits at ${ageNow}, saying the Association is no longer what ${pro('{they}', h)} signed up for.`, (WORLD.elections || []).some(e => e.ed >= ed - 1) ? 2 : 0.5],
        ...(lostB ? [[`after losing ${lostB.name}`, `${h.name} retires at ${ageNow}. Without ${lostB.name}, the work means nothing.`, 4]] : [])];
      const r = wpickM(R, x => x[2]); h.status = 'Retired'; h.retEd = ed; retireRec(h, ed, r[0]); add(h, 'retire', r[1], 6); return;
    }
    // a year off the field: suspensions and injuries cost the missions
    if(Math.random() < 0.015 * relScandal(h)){ if(scandalCase(h, ed, add)) return; add(h, 'scandal', fillH(pickR(SCANDAL), h), 5); h.rp = Math.max(0, h.rp - 20); return; }
    if(!relNoInj(h) && Math.random() < 0.04){ add(h, 'fail', fillH(pickR(['{n} spent most of the year recovering from injuries taken in {pl}.','{n} was badly hurt in {pl} and missed the whole season.','{n} lost an eye in {pl}, and came back sharper.']), h), 3); h.rp += 3; return; }
    if(Math.random() < 0.14){ const t = lifePick(h); if(t) add(h, 'life', fillH(t, h), 2); }
    if(Math.random() < 0.06 * relNen(h) && h.nen && h.nen.hatsu && h.nen.hatsu.name) add(h, 'nen', fillH(pickR(NEN_EV).replace(/\{tech\}/g, pickR(['Ko', 'Ken', 'Ryu', 'En', 'Gyo', 'Shu', 'In'])).replace(/\{cat\}/g, h.nen.category), h, {h: h.nen.hatsu.alias || h.nen.hatsu.name}), 3);
    const missions = Math.max(1, relMissions(h) + (busy.has(h.license) ? 1 : hot ? 2 + (Math.random() < 0.4 ? 1 : 0) : Math.random() < 0.45 ? 2 : 1));
    if(hot && Math.random() < 0.12) add(h, 'crisis', fillH(pickR(W.crisis.hero), h, {pl: WORLD.crisis.pl2 && Math.random() < 0.4 ? WORLD.crisis.pl2 : WORLD.crisis.pl}), 5);
    // contracts come by rank: mostly at their own, often below, and about one in twenty (a natural 20) above it
    const bold = ['Daredevil', 'Thrill-seeker', 'Berserker'].includes(h.trait) || h.prodigy || (h.avenge && !h.avenge.done);
    let fell = false;
    for(let i = 0; i < missions; i++){
      const roll = Math.random(), reachP = 0.05 * (bold ? 1.6 : 1) * relReach(h);
      let tier = before; if(before < 3 && roll < reachP) tier = Math.min(3, before + (Math.random() < 0.1 ? 2 : 1)); else if(before > 0 && roll < reachP + 0.4) tier = Math.floor(Math.random() * before);
      const gap = Math.max(0, tier - before), MT = (MISSIONS[area] || MISSIONS.Head)[tier];
      const okP = clamp(0.45 + (sk - 60) / 80 + before * 0.05 - gap * 0.2 + (tier < before ? 0.12 : 0) + relOk(h, area), 0.12, 0.97), ok = Math.random() < 1 - (1 - okP) * relFail(h), pl = pickPlace(area);
      if(gap){
        const rs = starStr(tier), cur0 = before ? starStr(before) + ' Hunter' : 'unranked Hunter', cur = (before ? 'a ' : 'an ') + cur0, X = {pl, rs, cur, cur0};
        const fill = t => fillH(t.replace(/\{rs\}/g, rs).replace(/\{cur0\}/g, cur0).replace(/\{cur\}/g, cur), h, X);
        if(ok){
          const job = fillH(pickR(MT), h, {pl}); h.rp += Math.round(Math.max(10, 25 + (sk - 55) * 0.8 + Math.random() * 30) * TIER_MULT[tier] * 2.5);
          X.job = job; add(h, 'job', fill(pickR(REACH_OK)), 6 + tier);
          if(Math.random() < 0.25){ const act = HUNTERS.filter(x => hActive(x) && !x.legacy), room = Math.round(act.length * STAR_SHARE[tier]) - act.filter(x => hStars(x) >= tier).length;
            if(room > 0){ h.st = tier; h.lastPromo = ed; h.rp = Math.max(h.rp, RANK_AT[tier]); add(h, 'promo', pickR([`The Association promotes ${h.name} on the spot: ${rs}.`, `After that contract, nobody argues: ${h.name} is a ${rs} Hunter now.`]), 8 + tier); }
            else { h.fast = ed; add(h, 'promo', `There is no open ${rs} seat for ${h.name} yet, but after that contract ${pro('{they} {are}', h)} first in line.`, 5); } }
        } else {
          const r = Math.random();
          if(r < 0.05 * gap * (hot ? 1.5 : 1) * relReachDie(h) && !relicSaves(h, ed, add, 'reach')){ h.status = 'Deceased'; h.diedEd = ed; add(h, 'death', fill(pickR(REACH_DIE)), 10); mournFor(h, ed, add); fell = true; break; }
          else if(r < 0.45){ h.rp += 5; add(h, 'fail', fill(pickR(REACH_HURT)), 4); }
          else { h.rp += 10; add(h, 'fail', fill(pickR(REACH_BACK)), 3); }
        }
        continue;
      }
      if(ok){
        const gain = Math.max(10, Math.round((25 + (sk - 55) * 0.8 + Math.random() * 30) * TIER_MULT[tier])), job = pickR(MT);
        // now and then a Hunter of the same field joins in, or gets in the way
        const peer = Math.random() < 0.12 * relDuo(h) ? pickR(HUNTERS.filter(x => x !== h && hActive(x) && !x.legacy && x.edition <= ed && (x.career || '') === (h.career || '') && !busy.has(x.license)) .concat([null])) : null;
        if(peer && Math.random() < 0.6 && !/^was /.test(job)){ busy.add(peer.license); peer.rp = (peer.rp || 0) + Math.round(gain / 2); h.rp += gain; add(h, 'job', fillH(pickR(DUO), h, {o: peer.name, job: toBase(job.replace(/\{pl\}/g, plText(pl)))}) + '.', gain / 18, peer); }
        else if(peer){ busy.add(peer.license); h.rp += gain; add(h, 'rival', fillH(pickR(RIVAL), h, {o: peer.name, pl}), 3, peer); }
        else { h.rp += gain; add(h, 'job', `${h.name} ${fillH(job, h, {pl})}.`, gain / 20); maybeDiscover(h, ed, add, job); }
      }
      else { h.rp += 5; if(Math.random() < 0.35) add(h, 'fail', `${h.name} ${fillH(pickR(JOB_FAIL), h, {pl})}.`, 1); }
    }
    if(fell) return;
    if(before >= 1 && Math.random() < 0.03) add(h, 'award', fillH(pickR(AWARD), h), 5);
    // once in a long while, a single feat skips the queue entirely
    if(before < 3 && h.edition < ed && Math.random() < 0.001){ const to = Math.random() < 0.4 ? 3 : Math.min(3, before + 2); h.st = to; h.lastPromo = ed; h.rp = Math.max(h.rp, RANK_AT[to]); add(h, 'promo', pickR([`In a rare move, the Association promotes ${h.name} straight to ${starStr(to)} after what happened in ${pickR(PLACES)}.`, `Skipping the usual ranks, ${h.name} becomes a ${starStr(to)} Hunter overnight. The Association will only say it was earned in ${pickR(PLACES)}.`, `It almost never happens: ${h.name} jumps straight to ${starStr(to)}.`]), 10); }
  });
  worldTies(ed, add, items);
  worldEnd(prev, ed, add, items, W);
  chroniclesYear(prev, ed, add, items);   // cases, schools, the ones who stopped waiting
  politicsYear(ed, add, items);
  regionalYear(ed, items);
  // promotions: earned points open the door, but only while there is room at that rank
  calibrateStars();
  // prodigies take the fast road (still a chance each year, not a guarantee)
  HUNTERS.filter(h => h.prodigy && hActive(h) && !h.legacy && h.lastPromo !== ed).forEach(h => {
    const y = ed - h.edition, s = hStars(h), to = s === 0 && y >= 1 && Math.random() < 0.7 ? 1 : s === 1 && y >= 3 && Math.random() < 0.35 ? 2 : s === 2 && y >= 6 && Math.random() < 0.2 ? 3 : 0;
    if(!to) return;
    h.st = to; h.lastPromo = ed; h.rp = Math.max(h.rp || 0, RANK_AT[to]);
    add(h, 'promo', pickR(to === 1 ? [`Barely a year into the license, ${h.name} earns a first star. The Association has its eye on ${pro('{them}', h)}.`, `${h.name}, licensed only last year, is already a ★ Hunter.`]
      : to === 2 ? [`${y} years in, ${h.name} is a ★★ Hunter. Nobody from ${pro('{their}', h)} class has moved this fast.`, `${h.name} earns a second star at ${hunterAge(h)}. The veterans have stopped joking about ${pro('{them}', h)}.`]
      : [`${h.name} becomes a ★★★ Hunter only ${y} years after the license — one of the fastest climbs on record.`, `Three stars at ${hunterAge(h)}: ${h.name} has arrived.`]), 8 + to);
  });
  const pool = HUNTERS.filter(h => hActive(h) && !h.legacy), N = pool.length;
  [3, 2, 1].forEach(st => {
    const room = Math.round(N * STAR_SHARE[st]) - pool.filter(h => hStars(h) >= st).length;
    if(room <= 0) return;
    pool.filter(h => hStars(h) === st - 1 && ((h.rp || 0) >= RANK_AT[st] * relRank(h) || h.fast === ed - 1) && h.edition < ed && h.lastPromo !== ed)
      .sort((a, b) => (b.fast === ed - 1 ? 1e7 : 0) + (b.rp || 0) - (a.fast === ed - 1 ? 1e7 : 0) - (a.rp || 0)).slice(0, Math.min(room, Math.max(1, Math.ceil(N * (st === 1 ? 0.12 : 0.03)))))
      .forEach(h => { h.st = st; h.lastPromo = ed;
        // only claimed when it is true: nobody in the same field holds that rank at a younger age
        const youngest = h.career && hunterAge(h) < 30 && pool.every(x => x === h || x.career !== h.career || hStars(x) < st || hunterAge(x) > hunterAge(h));
        add(h, 'promo', youngest && Math.random() < 0.6 ? `${h.name} becomes a ${starStr(st)} Hunter at ${hunterAge(h)}, the youngest ${h.career} at that rank.` : fillH(pickR(PROMO), h, {st: starStr(st), nth: ['first','second','third'][st - 1]}), 7 + st); });
  });
  // a fallen Centennial Star gets the Association's own notice
  if(!WORLD.cupBF){ WORLD.cupBF = 1; HUNTERS.forEach(h => { if(h.starCup === 'champion' && h.status === 'Deceased') h.cupMourned = h.diedEd ?? ed; }); }
  HUNTERS.filter(h => h.starCup === 'champion' && h.status === 'Deceased' && !h.cupMourned).forEach(h => {
    h.cupMourned = ed; const age = hunterAge(h), nth = ordinal(h.edition);
    items.push({lic: h.license, name: h.name, kind: 'death', rank: 12, text: pickR([
      `The Centennial Star of the ${nth} exam has fallen. ${h.name} was ${age}. Every Association office flies its flag at half-mast.`,
      `${h.name}, who won the Centennial Star at the ${nth} exam, is dead at ${age}. The star goes back to the Association's vault, to wait for the next centenary.`,
      `Flags at half-mast across the Association: ${h.name}, the Centennial Star of the ${nth}, has died at ${age}.`,
      `A hundred exams produced one ${h.name}. The Centennial Star of the ${nth} is gone, at ${age}, and the Association observes a minute of silence.`])});
  });
  try { statsYear(prev, ed, items); } catch(e){ console.error(e); }
  const STORY = ['wed','reunion','memorial','crisis','hunt','exped','bond','rival','election','zodiac','regional','case','school','relic'];   // ongoing stories are always kept
  items.forEach((it, i) => { it.i = i; });   // remember the order things happened in
  const srt = items.sort((x, y) => y.rank - x.rank), keep = srt.slice(0, 30).concat(srt.slice(30).filter(i => STORY.includes(i.kind))), rest = srt.slice(30).filter(i => ['life','nen','job','fail','award','scandal'].includes(i.kind));
  for(let i = rest.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  BULLETINS.push({edition: ed, items: keep.concat(rest.slice(0, 15))});
  if(BULLETINS.length > 12) BULLETINS = BULLETINS.slice(-12);
  HUNTERS.forEach(h => { if(h.log && h.log.length > 30) h.log = trimLog(h.log, 30); });
  compactHunters(ed);
}
// the save stays light: Hunters out of the field drop what only the living use, and the long dead keep a short record
// trim a career log, but never lose the milestones: seats held and lost, weddings
const LOG_KEY = new Set(['election', 'zodiac', 'wed']);
function trimLog(L, n){
  if(L.length <= n) return L;
  const key = L.map((e, i) => i).filter(i => LOG_KEY.has(L[i].k) || L[i].cl).slice(-Math.floor(n / 2)), ks = new Set(key);
  const rest = L.map((e, i) => i).filter(i => !ks.has(i)).slice(-(n - key.length));
  return key.concat(rest).sort((a, b) => a - b).map(i => L[i]);
}
function compactHunters(ed){
  HUNTERS.forEach(h => {
    if(hActive(h)) return;
    delete h.ties; delete h.rpH;
    if(h.status === 'Deceased' && h.diedEd != null && ed - h.diedEd >= 15 && !isFav(h.cid) && !(WORLD.memorials || []).some(m => m.lic === h.license)){
      if(h.log && h.log.length > 8) h.log = trimLog(h.log, 8);
      delete h.attrs0;
    }
  });
}

// the Atlas: what the world looks like right now, and what happened to it
function atlasHtml(){
  const P = WORLD.places || {}, C = WORLD.crisis, ED = S.edition;
  const stLabel = st => ({war: 'At war', plague: 'Quarantine', beasts: 'Overrun by beasts', storms: 'Storms', boom: 'Booming', famine: 'Famine', gangs: 'Gang rule', ruins: 'In ruins', rebuilding: 'Rebuilding', festival: 'Festival', drought: 'Drought'})[st] || st;
  const bad = st => ['war', 'plague', 'beasts', 'storms', 'famine', 'gangs', 'ruins', 'drought'].includes(st);
  const now = Object.entries(P).filter(([, p]) => p.st !== 'peace').sort((a, b) => (b[1].since || 0) - (a[1].since || 0));
  const seenH = new Set(), hist = Object.entries(P).flatMap(([pl, p]) => p.hist.map(x => ({pl, ...x}))).sort((a, b) => b.ed - a.ed).filter(x => { const k = x.ed + x.text; if(seenH.has(k)) return false; seenH.add(k); return true; }).slice(0, 8);
  const found = Object.entries(P).filter(([, p]) => p.found).sort((a, b) => b[1].found.ed - a[1].found.ed);
  const mem = (WORLD.memorials || []).slice(-6).reverse();
  if(!now.length && !hist.length && !C && !mem.length) return '';
  const cr = C ? `<div class="atl-cr"><b>${esc(CRISES[C.k].name.replace(/^the /, 'The '))}</b><span>${esc(C.pl)}${C.pl2 ? ' and ' + esc(C.pl2) : ''}</span><small>Year ${Math.max(1, ED - (C.start ?? C.ed) + (S.finished ? 1 : 0))}</small></div>` : '';
  return `<div><div class="section-h">Regions</div><div class="atlas">
    <div>${cr}${now.length ? `<div class="atl-now">${now.map(([pl, p]) => `<div><span class="atl-st ${bad(p.st) ? 'bad' : 'good'}">${stLabel(p.st)}</span><b>${esc(capS(pl))}</b><small>since the ${ordinal(p.since || ED)}</small></div>`).join('')}</div>` : '<p class="muted" style="margin:0">Everywhere is quiet, for now.</p>'}</div>
    <div>${hist.length ? `<div class="atl-h">${hist.map(x => `<div><small>${ordinal(x.ed)}</small><span>${esc(x.text)}</span></div>`).join('')}</div>` : ''}
</div>
  </div></div>`;
}
// ---- World: the Hunter Herald, the Blacklist, the Dark Continent, the places, and where it all began
let wdYear = null;
function originHtml(){
  const O = WORLD.origin, pre = O ? (WORLD.chairHist || []).filter(x => x.from < O.ed) : [];
  return O && O.lines ? `<div class="wd-origin"><div class="section-h">Before the records</div><div class="bulletin">${O.lines.map(l => `<div class="bl origin"><i>◉</i><span>${autoLink(esc(l))}</span></div>`).join('')}</div>${pre.length ? `<p class="muted" style="margin:8px 0 0;font-size:12.5px">Chairmen before the records: ${pre.map(x => { const h = hLic(x.lic); return `${h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—'} (${ordinal(x.from)}–${x.to ? ordinal(x.to) : 'today'})`; }).join(', ')}.</p>` : ''}</div>` : '';
}
// what Hunters left on the map: places they found, and the places that remember them
function marksHtml(){
  const P = WORLD.places || {}, found = Object.entries(P).filter(([, p]) => p.found).sort((a, b) => b[1].found.ed - a[1].found.ed).slice(0, 8), mem = (WORLD.memorials || []).slice(-8).reverse();
  if(!found.length && !mem.length) return '';
  const hl = (name, lic) => { const h = lic ? hLic(lic) : HUNTERS.find(x => x.name === name); return h ? `<a data-hunter="${esc(h.license)}">${esc(name)}</a>` : esc(name); };
  const MI = {statue: '♜', memorial: '❖', garden: '❀', plaque: '▭'};
  return `<div class="marks">${found.length ? `<div class="mk"><div class="section-h">Discoveries</div>${found.map(([pl, p]) => `<div class="mk-r"><i>⌖</i><span><b>${esc(capS(pl))}</b><small>found by ${hl(p.found.by)} · ${ordinal(p.found.ed)}</small></span></div>`).join('')}</div>` : ''}
    ${mem.length ? `<div class="mk"><div class="section-h">Memorials</div>${mem.map(m => `<div class="mk-r"><i>${MI[m.k] || '❖'}</i><span><b>The ${esc(m.k)} of ${hl(m.name, m.lic)}</b><small>${esc(m.pl)} · ${ordinal(m.ed)}</small></span></div>`).join('')}</div>` : ''}</div>`;
}
function wantedHtml(){
  const W = WORLD, hb = l => { const h = HUNTERS.find(x => x.license === l); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—'; };
  const wanted = (W.wanted || []).filter(w => w.status === 'wanted').slice(-8).reverse(), caught = (W.wanted || []).filter(w => w.status === 'captured').slice(-3).reverse();
  if(!wanted.length && !caught.length) return '';
  const tilt = w => ((nhash(w.id) % 7) - 3) * 0.6;
  const card = (w, done) => { const x = !done && (W.hunts || []).find(y => y.w === w.id && !y.done);
    return `<div class="wp${done ? ' caught' : ''}" style="--r:${tilt(w)}deg"><small>Wanted</small><b>${esc(w.name)}</b>${w.nick ? `<i>“${esc(w.nick)}”</i>` : ''}<span class="wp-d" title="Danger">${'☠'.repeat(w.danger || 1)}</span>
      <p>${done ? `Caught by ${esc(w.by || 'a Hunter')}` : x ? `Hunted by ${hb(x.lic)} · ${x.year + 1} yr${x.year ? 's' : ''}` : 'No Hunter on the case'}${w.kills ? ` · ${w.kills} Hunter${w.kills > 1 ? 's' : ''} killed` : ''}${w.cid ? '<br>former candidate' : ''}</p>${done ? '<em class="wp-stamp">Captured</em>' : ''}</div>`; };
  return `<div><div class="section-h">Blacklist</div><div class="wanted">${wanted.map(w => card(w)).join('')}${caught.map(w => card(w, true)).join('')}</div></div>`;
}
function dcHtml(){
  const E = WORLD.exped; const hb = l => { const h = HUNTERS.find(x => x.license === l); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—'; };
  return `<div class="dc"><div class="section-h">Dark Continent</div>${E ? `<p class="dc-y">${E.rescue ? 'Rescue expedition · ' : ''}Year <b>${E.year + 1}</b> of ${Math.max(E.len || 3, E.year + 1)}${E.goal ? ` · sent ${esc(E.goal)}` : ''}</p><div class="dc-team">${E.members.map(l => { const h = HUNTERS.find(x => x.license === l), ok = h && hActive(h); return `<span class="${ok ? '' : 'lost'}"><i>${ok ? '▲' : '✝'}</i>${hb(l)}${h && !ok ? ` <small>${esc(h.status.toLowerCase())}</small>` : ''}</span>`; }).join('')}</div>` : '<p class="muted" style="margin:0;font-size:13px">No expedition is out. The last one is still talked about.</p>'}</div>`;
}
function renderWorld(){
  const el = $('pane-world'), n = BULLETINS.length, i = wdYear == null ? n - 1 : clamp(wdYear, 0, n - 1), b = BULLETINS[i];
  const herald = b ? `<div class="herald"><div class="hd-mast"><button type="button" class="hd-nav" data-wdy="${i - 1}" ${i > 0 ? '' : 'disabled'} aria-label="Earlier issue">‹</button><div><b>The Hunter Herald</b><small>No. ${b.edition} · the year after the ${ordinal(b.edition)} exam${i < n - 1 ? ' · <span class="hd-old">back issue</span>' : ''}</small></div><button type="button" class="hd-nav" data-wdy="${i + 1}" ${i < n - 1 ? '' : 'disabled'} aria-label="Later issue">›</button></div>${bulletinHtml(b)}</div>`
    : '<div class="herald"><div class="hd-mast"><span></span><div><b>The Hunter Herald</b><small>The first issue comes out after the first exam</small></div><span></span></div></div>';
  el.innerHTML = `${pageHead('Beyond the exam', 'World', '#e0703a')}${advanceBarHtml()}${herald}<div class="wd-two">${wantedHtml() || '<div><div class="section-h">Blacklist</div><p class="muted" style="margin:0">Nobody is wanted right now.</p></div>'}${dcHtml()}</div>${atlasHtml() || '<div><div class="section-h">Regions</div><p class="muted" style="margin:0">Everywhere is quiet, for now.</p></div>'}${marksHtml()}${relicsHtml()}${schoolsHtml()}${docketHtml()}${originHtml()}`;
  el.querySelectorAll('[data-wdy]').forEach(x => x.onclick = () => { wdYear = +x.dataset.wdy; renderWorld(); });
}
document.addEventListener('click', e => { const g = e.target.closest('[data-gosec]'); if(g){ showTab(g.dataset.gosec); window.scrollTo(0, 0); } });
function bulletinHtml(b){
  if(!b) return '';
  const ic = {relic:'⚱', case:'§', school:'⛩', pupil:'⛩', wed:'⚭', reunion:'⇄', memorial:'❖', origin:'◉', regional:'⌂', election:'⚖', zodiac:'✧', death:'✝', missing:'?', retire:'◐', promo:'★', job:'·', fail:'·', duty:'◆', debut:'+', epilogue:'✓', life:'♦', nen:'✦', scandal:'!', award:'✪', rival:'⚔', hunt:'⌖', exped:'▲', bond:'∞', crisis:'⚠', avenge:'✝', place:'◈'};
  const BRIEF = ['job', 'life', 'fail', 'nen'];
  const oldK = it => /election is called|new election|abdicates/.test(it.text) ? 0 : /rounds of voting/.test(it.text) ? 1 : /elected Chairman/.test(it.text) ? 2 : it.kind === 'zodiac' && /new Zodiac/.test(it.text) ? 3 : 4;   // bulletins saved before the order was kept
  const ix = new Map(b.items.map((it, i) => [it, it.i ?? (oldK(it) * 1000 + i)])), byTime = (x, y) => ix.get(x) - ix.get(y), byRank = (x, y) => y.rank - x.rank;
  const items = b.items.slice();
  // mourning lines travel with the obituary they belong to
  const dead = items.filter(it => (it.kind === 'death' || it.kind === 'missing' || it.kind === 'avenge') && !(hLic(it.lic) && hActive(hLic(it.lic))));
  const deadLic = new Set(dead.map(it => it.lic));
  const mourn = items.filter(it => it.kind === 'bond' && it.o && deadLic.has(it.o.lic));
  const used = new Set(mourn);
  // an election year gets its own special; its loose lines are folded into it
  const EL = (WORLD.elections || []).find(e => e.ed === b.edition && hLic(e.winner));
  if(EL) items.forEach(it => { if(it.kind === 'election' || (it.kind === 'zodiac' && /^The new Zodiac/.test(it.text))) used.add(it); });
  // the first sentence carries the news; the rest is detail
  const split = it => { const html = linkHunter(it), m = html.match(/^(.+?[.!?]["”]?)(\s+)(.+)$/s); return m ? `${m[1]} <span class="bn-more">${m[3]}</span>` : html; };
  const row = it => `<div class="bl ${it.kind}"><i>${ic[it.kind] || '·'}</i><span>${split(it)}</span></div>`;
  const facts = h => h ? [hunterAge(h) + (h.status === 'Deceased' ? ' ✝' : ''), starStr(hStars(h)), (h.career || '').replace(' Hunter', '')].filter(Boolean).join(' · ') : '';
  // what someone is remembered for, from their own record
  const memory = h => {
    if(!h) return '';
    if(h.starCup === 'champion') return `Centennial Star of the ${ordinal(h.edition)} exam`;
    const pr = (h.pastRoles || []).slice().sort((a, b) => (b.to || 0) - (a.to || 0))[0], cur = roleOf(h);
    if(cur){ const t = roleFull(h); return t.charAt(0).toUpperCase() + t.slice(1); }
    if(pr) return `Former ${pr.r === 'Chairman' || pr.r === 'Vice-Chairman' ? pr.r : pr.r + ' of the Zodiac'}`;
    const best = (h.log || []).slice().reverse().find(x => ['award', 'hunt', 'exped', 'epilogue', 'elder'].includes(careerKind(x)));
    if(best){ const t = best.text.startsWith(h.name + ' ') ? best.text.slice(h.name.length + 1) : best.text; return t.charAt(0).toUpperCase() + t.slice(1); }
    return h.pro ? 'A veteran from before the records' : `Licensed at the ${ordinal(h.edition)} exam`;
  };
  // 1 · the headline: the biggest story that is not routine
  const lead = items.filter(it => !used.has(it) && !BRIEF.includes(it.kind) && !['bond', 'death', 'missing', 'avenge', 'promo'].includes(it.kind)).sort(byRank)[0];
  if(lead) used.add(lead);
  const sec = (title, list, body) => list.length ? `<section class="bn-sec"><h5>${title}</h5>${body || list.map(row).join('')}</section>` : '';
  const take = f => { const l = items.filter(it => !used.has(it) && f(it)); l.forEach(it => used.add(it)); return l; };
  const assoc = take(it => ['origin', 'election', 'zodiac', 'regional'].includes(it.kind) || (it.kind === 'award' && /Elder/.test(it.text))).sort(byTime);
  const world = take(it => ['exped', 'crisis', 'hunt', 'place'].includes(it.kind)).sort(byTime);
  // a crisis produces many similar reports: the first few stay, the rest fold away
  const crisisMore = world.filter(it => it.kind === 'crisis').slice(4); const worldShown = world.filter(it => !crisisMore.includes(it));
  // a Hunter who turns up alive is good news, not a loss
  const lost = take(it => ['death', 'missing', 'avenge'].includes(it.kind) && !(hLic(it.lic) && hActive(hLic(it.lic)))).sort(byRank);
  const promo = take(it => it.kind === 'promo').sort(byRank);
  // two stories from the same mould: the same closing line ("Neither remembers what the fight was about."), or the same sentence with other names
  const mould = t => { const ss = String(t).match(/[^.!?]+[.!?]+["”]?/g) || [String(t)]; return (ss.length > 1 ? ss[ss.length - 1] : ss[0]).replace(/[A-Z][\w'’-]+(?: [A-Z][\w'’-]+)*/g, 'N').replace(/\d+/g, '#').trim(); };
  const seenM = new Set(), dupes = new Set();
  const lives = take(it => !BRIEF.includes(it.kind)).sort(byRank).filter(it => { const k = mould(it.text); if(seenM.has(k)){ dupes.add(it); used.delete(it); return false; } seenM.add(k); return true; }).slice(0, 10);
  const brief = take(it => BRIEF.includes(it.kind) || dupes.has(it)).sort(byRank);   // a second story from the same mould goes to the brief
  // losses read as a running list: who, age and rank, what happened, and (when there is one) the office they held
  const obit = it => { const h = hLic(it.lic), ms = mourn.filter(m => m.o.lic === it.lic);
    const role = h ? (h.starCup === 'champion' ? `Centennial Star of the ${ordinal(h.edition)}` : (() => { const pr = (h.pastRoles || []).slice().sort((a, b) => (b.to || 0) - (a.to || 0))[0], cur = roleOf(h); return cur ? roleFull(h) : pr ? `former ${pr.r === 'Chairman' || pr.r === 'Vice-Chairman' ? pr.r : pr.r + ' of the Zodiac'}` : ''; })()) : '';
    let body = it.text.startsWith(it.name + ' ') ? it.text.slice(it.name.length + 1) : it.text;
    if(it.name && body.startsWith(it.name)) body = it.name.split(' ')[0] + body.slice(it.name.length);   // "Darius Azoulay's remains…" → "Darius's remains…"
    const facts = h && it.kind !== 'missing' ? [hunterAge(h), starStr(hStars(h))].filter(Boolean).join(' · ') : '';   // age only for the dead
    return `<div class="bl ${it.kind}"><i>${it.kind === 'missing' ? '?' : '✝'}</i><span><b>${it.lic ? `<a data-hunter="${esc(it.lic)}">${esc(it.name)}</a>` : esc(it.name)}</b>${facts ? ` <small class="bn-f">${esc(facts)}</small>` : ''}${role ? ` <small class="bn-role">${esc(role.charAt(0).toUpperCase() + role.slice(1))}</small>` : ''} <span class="bn-more">— ${esc(body)}</span>${ms.map(m => ` <span class="bn-mourn">${linkHunter(m)}</span>`).join('')}</span></div>`; };
  const prom = it => { const h = hLic(it.lic), st = h ? hStars(h) : 0;
    return `<div class="bn-promo s${st}"><span class="stars">${starStr(st)}</span><span>${split(it)}</span></div>`; };
  return `<div class="bn">
    ${EL ? electionHtml(EL) : ''}
    ${lead ? `<div class="bn-lead ${lead.kind}"><i>${ic[lead.kind] || '·'}</i><div>${split(lead)}</div></div>` : ''}
    ${sec('The Association', assoc, zodiacFold(assoc, row))}
    ${sec('The world', world, worldShown.map(row).join('') + (crisisMore.length ? `<details class="bn-brief"><summary>${crisisMore.length} more reports from the crisis</summary><div class="bulletin">${crisisMore.map(row).join('')}</div></details>` : ''))}
    ${sec(lost.some(it => it.kind === 'missing') ? 'Lost and missing' : 'Losses', lost, lost.map(obit).join(''))}
    ${sec('Promotions', promo, `<div class="bn-promos">${promo.filter(it => (hLic(it.lic) ? hStars(hLic(it.lic)) : 1) >= 2).map(prom).join('')}</div>${promo.some(it => (hLic(it.lic) ? hStars(hLic(it.lic)) : 1) < 2) ? `<div class="bn-firsts">${promo.filter(it => (hLic(it.lic) ? hStars(hLic(it.lic)) : 1) < 2).map(prom).join('')}</div>` : ''}`)}
    ${sec('Lives and careers', lives)}
    ${brief.length ? `<details class="bn-brief"><summary>In brief · ${brief.length} more ${brief.length === 1 ? 'story' : 'stories'}</summary><div class="bulletin">${brief.map(row).join('')}</div></details>` : ''}
  </div>`;
}
// several Zodiac seats changing in one year read as one block: the sign, who comes in, who leaves and why
function zodiacFold(assoc, row){
  const re = /^Zodiac, the (\w+): (.+?) ((?:steps down|gives up|resigns|retires|dies|goes missing|leaves|keeps|gave|is replaced|loses|is thanked|was killed)[^;]*); Chairman (.+?) names (.+?) in .+?'s place\.$/;
  const Z = assoc.filter(it => it.kind === 'zodiac' && re.test(it.text));
  if(Z.length < 2) return assoc.map(row).join('');
  const ch = Z[0].text.match(re)[4], lk = n => { const h = HUNTERS.find(x => x.name === n); return h ? `<a data-hunter="${esc(h.license)}">${esc(n)}</a>` : esc(n); };
  const rows = Z.map(it => { const m = it.text.match(re); return `<div class="bn-zrow"><small>${esc(m[1])}</small><span>${lk(m[5])} <span class="bn-more">in place of ${lk(m[2])}, who ${esc(m[3])}</span></span></div>`; }).join('');
  const block = `<div class="bl zodiac"><i>${(typeof CAREER_IC !== 'undefined' && CAREER_IC.zodiac) || '·'}</i><span>Chairman ${lk(ch)} fills ${Z.length} seats of the Zodiac.<div class="bn-zod">${rows}</div></span></div>`;
  let out = '', put = false; assoc.forEach(it => { if(Z.includes(it)){ if(!put){ out += block; put = true; } } else out += row(it); });
  return out;
}
// the Herald's election special: who won, by how much, how long it took, and the council that came out of it
function electionHtml(E){
  const H = l => hLic(l), A = h => h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—', last = h => h ? esc(h.name.split(' ').slice(-1)[0]) : '?';
  const W = H(E.winner), V = E.vice && H(E.vice), P = E.prev && H(E.prev), again = E.prev === E.winner;
  const ok = (E.rounds || []).filter(r => !r.void && r.top && r.valid), fin = ok[ok.length - 1], voids = (E.rounds || []).length - ok.length;
  const row = (x, win) => { const h = H(x.l), pc = Math.round(x.v / fin.valid * 100); return `<div class="elx-row${win ? ' win' : ''}"><span class="elx-n">${A(h)}</span><span class="elx-bar"><i style="width:${pc}%"></i></span><b>${pc}%</b><small>${fmt(x.v)} votes</small></div>`; };
  const top = fin ? fin.top.slice(0, 2) : [], wx = fin && fin.top.find(x => x.l === E.winner);
  const res = fin ? (wx ? [wx].concat(top.filter(x => x.l !== E.winner).slice(0, 1)) : top) : [];
  const chips = (E.rounds || []).map(r => r.void ? `<span class="er v" title="Void: turnout under 95%">R${r.n} · void ${Math.round(r.turnout * 100)}%</span>` : `<span class="er${r === fin ? ' f' : ''}" title="${r.top.slice(0, 3).map(x => `${H(x.l) ? H(x.l).name : '?'}: ${Math.round(x.v / r.valid * 100)}%`).join(' · ')}">R${r.n} · ${last(H(r.top[0].l))} ${Math.round(r.top[0].v / r.valid * 100)}%</span>`).join('');
  const named = (E.named || []).map(x => ({z: x.z, h: H(x.l)})).filter(x => x.h);
  return `<div class="elx"><div class="elx-h"><span class="elx-tag">⚖ Election special</span><b>${A(W)} ${again ? 'is re-elected Chairman' : 'is the new Chairman'}</b>${P && !again ? `<small>succeeding ${A(P)}</small>` : ''}</div>
    ${E.reason ? `<p class="elx-why">${esc(E.reason)}</p>` : ''}
    ${fin ? `<div class="elx-res">${res.map((x, i) => row(x, x.l === E.winner)).join('')}<small class="elx-sum">${wx && wx.v / fin.valid > 0.5 ? `Decided in round ${E.rounds.length}` : `No majority: named after ${E.rounds.length} rounds, the last candidate standing`}${voids ? ` · ${voids} round${voids > 1 ? 's' : ''} void for turnout` : ''} · ${Math.round(fin.turnout * 100)}% turnout · ${fmt(fin.valid)} valid votes</small></div>` : ''}
    ${E.rounds && E.rounds.length > 1 ? `<div class="elx-rounds">${chips}</div>` : ''}
    <div class="elx-council">${V ? `<div><small>Vice-Chairman</small>${A(V)}${E.viceWhy ? `<span class="elx-why2">${esc(E.viceWhy)}</span>` : ''}</div>` : ''}${E.refused && H(E.refused) ? `<div><small>Turned it down</small>${A(H(E.refused))}</div>` : ''}${named.length ? `<div class="wide"><small>New Zodiac</small><span class="elx-z">${named.map(x => `<span><i>${ZKANJI[x.z] || ''}</i>${A(x.h)} <em>${esc(x.z)}</em></span>`).join('')}</span></div>` : ''}${E.kept != null ? `<div><small>Kept their seats</small><b>${E.kept} of 12</b></div>` : ''}${E.fav && H(E.fav) ? `<div><small>Crowd favourite</small>${A(H(E.fav))}</div>` : ''}</div></div>`;
}
// now and then the Herald prints the nickname the way the papers do: Kira "Kiki" Celik
const nickName = (lic, name, key) => { const h = hLic(lic); if(!h || !h.nick || nhash(key + lic) % 5 > 1) return esc(name); const p = name.split(' '); return p.length > 1 ? `${esc(p[0])} “${esc(h.nick)}” ${esc(p.slice(1).join(' '))}` : `${esc(name)} “${esc(h.nick)}”`; };
const linkHunter = it => { if(!it.name) return esc(it.text); let t = esc(it.text).replace(esc(it.name), '\u0001'); if(it.o) t = t.replace(esc(it.o.name), '\u0002'); return t.replace('\u0001', `<a data-hunter="${esc(it.lic)}">${nickName(it.lic, it.name, it.text)}</a>`).replace('\u0002', it.o ? `<a data-hunter="${esc(it.o.lic)}">${nickName(it.o.lic, it.o.name, it.text)}</a>` : ''); };

