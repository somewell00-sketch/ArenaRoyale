/* ===== Chronicles: cases before the Association, schools of Nen, and what the returned come back to =====
   All three run once a year from hunterYear(), after the world's own turn and before politics,
   and keep their state in WORLD.cases, WORLD.schools and a few fields on each Hunter. */
const CH_HIST = 6;
const chNote = (o, ed, t) => { (o.hist = o.hist || []).push({ed, t}); if(o.hist.length > CH_HIST) o.hist = o.hist.slice(-CH_HIST); };
const chFirst = h => h.first || h.name.split(' ')[0];
const chAct = () => HUNTERS.filter(h => hActive(h) && !h.legacy);
const chY = n => n === 1 ? 'a year' : n + ' years';

/* ---------- 1. Cases: an accusation, an investigation, a trial, a verdict, and sometimes the truth years later ---------- */
// truth is decided when the case opens and never shown; evidence drifts towards it, a verdict may still get it wrong
const CASE_K = {
  bribe: {sev: 2, what: 'taking bribes', open: ['{n} is accused of taking bribes from a shipping cartel in {pl}. The Association opens a case.', 'A ledger found in {pl} lists payments to {n}. The Association opens a case.']},
  info: {sev: 2, what: 'selling Hunter-only information', open: ['{n} is accused of selling Hunter-only files to a broker in {pl}. The Association opens a case.', 'Restricted maps turn up at an auction in {pl}. They are traced back to {n}.']},
  force: {sev: 1, what: 'excessive force', open: ['Half a district in {pl} is rubble after {n}\'s last mission. The Association wants to know why.', 'Witnesses in {pl} say {n} kept fighting long after the target surrendered. A case is opened.']},
  fraud: {sev: 3, what: 'rigging the exam', open: ['Candidates from the {e} exam swear {n} let a favourite through the {ph}. The Association opens a case against its own examiner.', 'An anonymous letter accuses {n}, examiner of the {ph} in the {e} exam, of selling the answers.']},
  negl: {sev: 2, what: 'negligence as an examiner', open: ['The families of those who died in {cat} accuse {n}, an examiner that year, of negligence. The Association opens a case.']},
  collusion: {sev: 3, what: 'letting a Blacklist target go', open: ['{w} slipped away from {n} once too often. The Association asks whether it was an accident.', 'A Blacklist informant claims {n} was paid to lose {w}\'s trail. A case is opened.']},
  abandon: {sev: 2, what: 'abandoning teammates on the Dark Continent', open: ['The families of the Hunters lost on the Dark Continent accuse {n}, who led the expedition, of leaving them behind.']}
};
const CASE_OPEN_MAX = 4, CASE_KEEP = 60;
const caseOf = h => (WORLD.cases || []).find(c => c.lic === h.license && (c.st === 'open' || c.st === 'trial' || c.st === 'paused'));
const caseFill = (t, h, x) => pro(t.replace(/\{n\}/g, h.name).replace(/\{pl\}/g, x.pl || pickR(PLACES)).replace(/\{w\}/g, x.w || 'the target').replace(/\{e\}/g, x.e || 'last').replace(/\{ph\}/g, x.ph || 'trial').replace(/\{cat\}/g, (x.cat || 'the disaster').toLowerCase()), h);
function openCase(h, k, ed, add, x){
  x = x || {}; WORLD.cases = WORLD.cases || [];
  if(!h || !hActive(h) || h.legacy || caseOf(h) || WORLD.cases.filter(c => c.st === 'open' || c.st === 'trial').length >= CASE_OPEN_MAX) return null;
  const K = CASE_K[k], truth = x.truth != null ? x.truth : Math.random() < (x.acc ? 0.3 : k === 'collusion' ? 0.4 : 0.55);
  const c = {id: 'C' + (++WORLD.seq), lic: h.license, name: h.name, k, ed, st: 'open', y: 0, truth, ev: Math.round(truth ? 15 + Math.random() * 15 : 5 + Math.random() * 15), acc: x.acc ? x.acc.license : null, inv: null, wit: []};
  const t = caseFill(pickR(K.open), h, x) + (x.acc ? ` The accusation comes from ${x.acc.name}.` : '');
  WORLD.cases.push(c); WORLD.caseN = (WORLD.caseN || 0) + 1; chNote(c, ed, t); add(h, 'case', t, 6 + K.sev, x.acc);
  return c;
}
// a scandal in the field: some of them become cases (called from the year of each Hunter)
function scandalCase(h, ed, add){
  if(Math.random() >= 0.07) return false;
  const byCid = cid => HUNTERS.find(x => x.cid === cid), riv = (h.rivals || []).map(byCid).filter(o => o && hActive(o));
  const acc = riv.length && Math.random() < Math.min(0.9, 0.4 * (1 + 2 * RX(h, 'a19'))) ? pickR(riv) : null;
  return !!openCase(h, pickR(['bribe', 'info', 'force', 'force']), ed, add, {acc});
}
// how a case weighs on a Hunter: votes, seats
const caseW = (h, ed) => { if(caseOf(h)) return 0.35; if(h.guiltyEd && !h.rehab && ed - h.guiltyEd < 25) return 0.2; if(h.clearedEd && ed - h.clearedEd < 10) return 1.15; return 1; };
function caseSeat(h, ed){
  if(!h) return null;
  if(h.guiltyEd === ed){ const c = (WORLD.cases || []).filter(x => x.lic === h.license && x.verdict === 'guilty').pop(); return `is removed after being found guilty of ${c ? CASE_K[c.k].what : 'misconduct'}`; }
  const c = caseOf(h); if(c && c.st !== 'paused' && c.ev >= 55 && !c.pressed && Math.random() < 0.35){ c.pressed = ed; return `steps down while the case against ${PR(h).them} is heard`; }
  return null;
}
function casesYear(prev, ed, add, items){
  const C = WORLD.cases = WORLD.cases || [], act = chAct();
  // cases that grow out of what happened this year
  if(prev.cat && prev.cat.ex && prev.cat.stage === 'done' && !prev.cat.sued){ prev.cat.sued = true;
    const live = prev.cat.ex.filter(x => !x.died).map(x => hLic(x.license)).filter(h => h && hActive(h));
    if(live.length && Math.random() < 0.35) openCase(pickR(live), 'negl', ed, add, {cat: prev.cat.name}); }
  (prev.phaseSpec || []).forEach(sp => { if(!sp.ex || !sp.ex.license) return; const h = hLic(sp.ex.license);
    if(h && Math.random() < 0.005 * (sp.ex.style === 'Lenient' ? 2.5 : sp.ex.style === 'Unpredictable' ? 1.5 : 1)) openCase(h, 'fraud', ed, add, {e: ordinal(prev.edition), ph: PHASE_DEFS[sp.id].name}); });
  // the cases under way
  C.filter(c => c.st === 'open' || c.st === 'trial').forEach(c => {
    const h = hLic(c.lic); if(!h) { c.st = 'dropped'; c.end = ed; return; }
    const W = CASE_K[c.k];
    if(!c.post && h.status === 'Missing'){ c.st = 'paused'; chNote(c, ed, `${h.name} goes missing. The case waits.`); return; }
    if(!c.post && h.status === 'Deceased'){ c.st = 'dropped'; c.end = ed; const t = `The case against ${h.name} for ${W.what} dies with ${PR(h).them}. ${c.ev >= 50 ? 'Most people think it would have ended badly.' : 'Nobody will ever know.'}`; chNote(c, ed, t); items.push({lic: h.license, name: h.name, kind: 'case', text: t, rank: 5}); return; }
    c.y++;
    if(c.st === 'trial'){ caseVerdict(c, h, ed, add, items); return; }
    // the investigator
    let inv = c.inv && hLic(c.inv);
    if(c.inv && !(inv && hActive(inv))){ c.inv = null; inv = null; chNote(c, ed, 'The investigation stalls.'); }
    if(!inv && !c.post){ const P = act.filter(x => x !== h && hStars(x) >= 1 && /^(Crime|Blacklist|Head)/.test(x.career || '') && x.license !== h.spouse && !(h.bonds || []).some(b => b.id === x.cid));
      inv = P.length ? pickR(P) : null; if(inv){ c.inv = inv.license; add(inv, 'case', `${inv.name} is assigned to investigate ${h.name} for ${W.what}.`, 4, h); } }
    const sk = inv ? careerSkill(inv) / 100 : 0.4;
    c.ev += (c.truth ? 6 + Math.random() * 20 * sk : (Math.random() < 0.5 ? -6 : Math.random() * 7)) * (inv && RX(inv, 'a2') ? 1 + 0.5 * RX(inv, 'a2') : 1);
    if(inv && RX(inv, 'a2') && c.y === 1) add(inv, 'relic', `${inv.name} opens the Veiled Ledger. A name is already written in it.`, 4, h);
    // witnesses: friends speak for the accused, rivals against
    if(!c.post && Math.random() < 0.35){
      const friend = [hLic(h.spouse)].concat((h.bonds || []).map(b => HUNTERS.find(x => x.cid === b.id))).filter(o => o && hActive(o) && !c.wit.includes(o.license));
      const foe = (h.rivals || []).map(cid => HUNTERS.find(x => x.cid === cid)).filter(o => o && hActive(o) && !c.wit.includes(o.license));
      const o = foe.length && (Math.random() < 0.5 || !friend.length) ? pickR(foe) : friend.length ? pickR(friend) : null;
      if(o){ const forH = !foe.includes(o); c.wit.push(o.license); c.ev += forH ? -9 : 10;
        add(o, 'case', forH ? pickR([`${o.name} testifies for ${h.name} at the inquiry. It takes all afternoon.`, `${o.name} swears ${h.name} was with ${PR(o).them} that night. The inquiry takes note.`]) : pickR([`${o.name}, an old rival, testifies against ${h.name}.`, `${o.name} gives the inquiry a statement about ${h.name}. It is not kind.`]), 4, h); }
    }
    c.ev = Math.round(clamp(c.ev, 0, 100));
    if(c.ev >= 65 || c.y >= 3 + nhash(c.id) % 2){
      if(c.ev < 25){ c.st = 'dropped'; c.end = ed; c.verdict = 'dropped'; const t = `The case against ${h.name} for ${W.what} is dropped for lack of evidence.`; chNote(c, ed, t); add(h, 'case', t, 5); return; }
      c.st = 'trial'; const t = pickR([`The trial of ${h.name} for ${W.what} opens before the Association's council.`, `${h.name} goes on trial for ${W.what}. The gallery is full.`]); chNote(c, ed, t); add(h, 'case', t, 6);
    } else if(c.y > 1) chNote(c, ed, pickR(['The investigation goes on.', 'New statements are taken.', 'The file grows thicker.']));
  });
  // closed cases come back: new evidence, an heir who will not let it go
  C.filter(c => (c.st === 'guilty' || c.st === 'cleared' || c.st === 'dropped') && ed - c.end >= 3 && !c.reEd).forEach(c => {
    const wrong = (c.verdict === 'guilty') !== c.truth;
    if(Math.random() >= (wrong ? 0.015 : 0.003)) return;
    const h = hLic(c.lic); if(!h) return;
    const kin = (WORLD.heirs || []).filter(k => k.parents.includes(h.license)).map(k => HUNTERS.find(x => x.cid === k.cid)).filter(x => x && hActive(x));
    const by = kin.length && Math.random() < 0.6 ? pickR(kin) : null;
    caseReopen(c, h, ed, add, by, by ? `${by.name}, ${h.name}'s ${by.gender === 'Male' ? 'son' : by.gender === 'Female' ? 'daughter' : 'child'}, finds what the inquiry missed` : pickR(['A box of letters turns up in an estate sale', 'A deathbed confession reaches the Association', 'An old investigator\'s notebook is found in the archive']));
  });
  // a sentence served, a name restored
  act.forEach(h => {
    if(h.susp && h.susp === ed - 1) add(h, 'case', `${h.name}'s suspension is over. ${PR(h).They} ${PR(h).are} back in the field.`, 4);
    if(h.guiltyEd && !h.rehab && ed - h.guiltyEd >= 8 && hStars(h) >= 1 && Math.random() < 0.05){ h.rehab = ed; add(h, 'case', `${ed - h.guiltyEd} years after the verdict, the Association quietly restores ${h.name}'s standing. Most people have forgotten. ${h.name} has not.`, 5); }
  });
  // the docket stays short: closed cases that were judged rightly go first
  if(C.length > CASE_KEEP){ const closed = C.filter(c => c.end != null).sort((a, b) => ((a.verdict === 'guilty') === a.truth ? 0 : 1) - ((b.verdict === 'guilty') === b.truth ? 0 : 1) || a.end - b.end);
    const drop = new Set(closed.slice(0, C.length - CASE_KEEP)); WORLD.cases = C.filter(c => !drop.has(c)); }
}
function caseReopen(c, h, ed, add, by, how){
  c.reEd = ed; c.st = 'trial'; c.post = h.status !== 'Active Hunter'; c.ev = c.truth ? 80 : 15; c.re = (c.re || 0) + 1;
  const t = `${how}: ${ed - c.ed} years on, the case against ${h.name} for ${CASE_K[c.k].what} is reopened.`;
  chNote(c, ed, t); add(h, 'case', t, 8, by || undefined);
}
function caseVerdict(c, h, ed, add, items){
  const W = CASE_K[c.k], live = h.status === 'Active Hunter', acc = c.acc && hLic(c.acc);
  const sc = Math.max(RX(h, 'a11'), RX(hLic(c.inv), 'a11')), mask = live && !c.post && RX(h, 'a18') && !((WORLD.relics.a18.used || {})[h.license]);
  if(mask && Math.random() < 0.6){ (WORLD.relics.a18.used = WORLD.relics.a18.used || {})[h.license] = ed; c.st = 'dropped'; c.verdict = 'dropped'; c.end = ed; const t = `On the day of the verdict, the witnesses against ${h.name} cannot agree what ${PR(h).they} look${PR(h).s} like. The case against ${PR(h).them} is dropped. Somebody mentions a white mask.`; chNote(c, ed, t); add(h, 'relic', t, 7); return; }
  const guilty = sc && Math.random() < 0.9 ? c.truth : Math.random() < clamp((c.ev - 25) / 55, 0.05, 0.95), was = c.verdict;
  if(sc) add(RX(h, 'a11') ? h : hLic(c.inv), 'relic', `The Honest Scales tilt before the council speaks.`, 5);
  c.verdict = guilty ? 'guilty' : 'cleared'; c.st = c.verdict; c.end = ed; const V = WORLD.caseV = WORLD.caseV || {}; V[c.verdict] = (V[c.verdict] || 0) + 1;
  let t;
  if(c.post || !live){
    // judged again after the fact: the record changes, the person cannot
    if(guilty && was !== 'guilty'){ h.tarnished = ed; t = `The truth comes out ${ed - c.ed} years late: ${h.name} was guilty of ${W.what}. ${h.memorial ? `Someone leaves a note on ${PR(h).their} ${h.memorial.k} in ${h.memorial.pl}.` : 'The Association amends the record.'}`; }
    else if(!guilty && was === 'guilty'){ h.clearedEd = ed; delete h.guiltyEd; t = `${h.name} is cleared of ${W.what}, ${ed - c.ed} years after the verdict that ${live ? 'ended' : 'stained'} ${PR(h).their} career. ${h.status === 'Deceased' ? 'The Association apologises to an empty chair.' : `${PR(h).They} ${PR(h).are} not there to hear it.`}`; }
    else t = guilty ? `The second trial of ${h.name} reaches the same verdict as the first.` : `The second inquiry into ${h.name} finds nothing new. The old verdict stands.`;
    if(c.verdict !== was && was && was !== 'dropped'){ const inv = c.inv && hLic(c.inv); if(inv && inv.status !== 'Deceased') add(inv, 'case', `The case ${inv.name} built against ${h.name} is overturned.`, 4, h); }
  } else if(guilty){
    h.guiltyEd = ed; delete h.rehab;
    const sev = W.sev + (W.sev >= 3 && Math.random() < 0.5 ? 1 : 0);
    if(sev >= 4){ h.revoked = ed; h.status = 'Retired'; h.retEd = ed; retireRec(h, ed, 'license revoked'); h.rp = Math.max(0, (h.rp || 0) - 150);
      t = `Guilty: ${h.name} loses the Hunter License for ${W.what}. ${pickR(['The card is cut in half in front of the council.', 'It is the first revocation in years.', `${PR(h).They} walk${PR(h).s} out without a word.`])}`; }
    else if(sev >= 2){ const yrs = sev === 3 ? 3 : 2; h.susp = ed + yrs; h.rp = Math.max(0, (h.rp || 0) - (sev === 3 ? 120 : 70)); t = `Guilty of ${W.what}: ${h.name} is suspended for ${yrs} years.`; }
    else { h.rp = Math.max(0, (h.rp || 0) - 40); t = `Guilty of ${W.what}: ${h.name} is fined and reprimanded.`; }
    if(acc && hActive(acc)){ acc.rp = (acc.rp || 0) + 20; }
    const sp = hLic(h.spouse); if(sp && sp.status !== 'Deceased' && Math.random() < 0.5) add(sp, 'wed', `${sp.name} stands beside ${h.name} through the verdict.`, 3, h);
  } else {
    h.clearedEd = ed; h.rp = (h.rp || 0) + 25;
    t = c.re ? `At the second trial, ${h.name} is cleared of ${W.what} again.` : pickR([`Cleared: the council finds ${h.name} not guilty of ${W.what}.`, `${h.name} walks out of the trial cleared of ${W.what}.`]);
    if(acc && hActive(acc)){ acc.rp = Math.max(0, (acc.rp || 0) - 30); t += ` ${acc.name}'s accusation falls apart.`; }
  }
  chNote(c, ed, t); add(h, 'case', t, guilty ? 8 : 6, acc && !c.post ? acc : undefined);
}
// the docket, for the World page
function docketHtml(){
  const C = WORLD.cases || []; if(!C.length) return '';
  const hl = c => { const h = hLic(c.lic); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : esc(c.name); };
  const open = C.filter(c => c.st === 'open' || c.st === 'trial' || c.st === 'paused').slice(-6).reverse();
  const notable = C.filter(c => c.end != null && (c.re || c.verdict === 'guilty')).sort((a, b) => b.end - a.end).slice(0, 5);
  const ST = {open: 'Under investigation', trial: 'On trial', paused: 'Accused is missing', guilty: 'Guilty', cleared: 'Cleared', dropped: 'Dropped'};
  const row = c => `<div class="mk-r"><i>§</i><span><b>${hl(c)}</b> <small>${esc(CASE_K[c.k].what)} · since the ${ordinal(c.ed)} · ${ST[c.st]}${c.re ? ` · reopened in the ${ordinal(c.reEd)}` : ''}${c.end != null ? ` · ${ordinal(c.end)}` : ''}</small></span></div>`;
  return `<div class="marks"><div class="mk"><div class="section-h">Before the council</div>${open.length ? open.map(row).join('') : '<p class="muted" style="margin:0;font-size:13px">No open cases.</p>'}</div>${notable.length ? `<div class="mk"><div class="section-h">Verdicts</div>${notable.map(row).join('')}</div>` : ''}</div>`;
}

/* ---------- 2. Schools of Nen: masters, students, succession, schisms ---------- */
const SCH_IMG = {Enhancement: ['Iron', 'Stone', 'Oak', 'Anvil', 'Mountain', 'Ox'], Transmutation: ['Silk', 'Ash', 'Mercury', 'Ember', 'Smoke', 'Glass'], Emission: ['Arrow', 'Lantern', 'Comet', 'Thunder', 'Echo', 'Kite'], Conjuration: ['Ink', 'Mirror', 'Loom', 'Key', 'Paper', 'Bell'], Manipulation: ['String', 'Tide', 'Compass', 'Chain', 'Shepherd', 'Needle'], Specialization: ['Eclipse', 'Veil', 'Riddle', 'Moth', 'Dream', 'Thirteenth Hour']};
const SCH_ADJ = ['Hollow', 'Quiet', 'Patient', 'Burning', 'Still', 'Broken', 'Silent', 'Hundred-Year', 'Crooked', 'Lantern-Lit'];
const SCH_NUM = ['Three', 'Five', 'Seven', 'Nine', 'Twelve'];
const SCH_PRE = ['True', 'Reformed', 'Northern', 'Southern', 'Second', 'New', 'Free', 'Old'];
const SCH_PR = {   // principles: what the school teaches, and the two attributes its students grow
  Enhancement: [['Strike once, and mean it.', ['strength', 'combat']], ['The body is the first technique.', ['endurance', 'strength']], ['Stand where you are. Make them come to you.', ['courage', 'endurance']]],
  Transmutation: [['Your aura is a material. Learn its grain.', ['agility', 'perception']], ['Change the shape of the fight before you change your own.', ['strategy', 'agility']], ['Nothing that bends ever breaks.', ['agility', 'endurance']]],
  Emission: [['Distance is a kind of armour.', ['perception', 'speed']], ['Send it, and let it go.', ['determination', 'perception']], ['What leaves you should never come back empty.', ['strategy', 'perception']]],
  Conjuration: [['Make a thing so well you forget you made it.', ['intelligence', 'determination']], ['One object, a whole life.', ['determination', 'intelligence']], ['Every rule you write is a door you can close.', ['strategy', 'intelligence']]],
  Manipulation: [['Take the strings before they know there are strings.', ['strategy', 'intelligence']], ['Command the field, not the fighter.', ['strategy', 'teamwork']], ['Patience is a leash.', ['perception', 'determination']]],
  Specialization: [['There is no school for what you are. This is one anyway.', ['determination', 'perception']], ['Learn everything, then forget the order.', ['intelligence', 'courage']], ['A gift unshared is half a gift.', ['charisma', 'teamwork']]]
};
const SCH_OPEN_MAX = 14, SCH_KEEP_CLOSED = 25, SCH_PUPILS = 4;
const schOf = id => id ? (WORLD.schools || []).find(s => s.id === id) || null : null;
const schHead = s => s && s.heads.length && s.heads[s.heads.length - 1].to == null ? s.heads[s.heads.length - 1] : null;
const schPlace = pl => { let s = String(pl || '').replace(/^the /, ''); if(/ of /.test(s)) s = s.split(' of ').pop(); s = s.replace(/^the /, '').replace(/ (City|Province|Republic|Kingdom|Union)$/, ''); const caps = s.split(' ').filter(w => /^[A-Z]/.test(w)).join(' '); return caps || s; };
function schName(f, cat, home, taken){
  const sur = f.name.split(' ').slice(-1)[0], I = pickR(SCH_IMG[cat] || SCH_IMG.Specialization);
  for(let t = 0; t < 12; t++){
    const r = Math.random();
    const n = r < 0.3 ? pickR([`${sur}-ryū`, `the ${sur} School`, `the House of ${sur}`])
      : r < 0.7 ? pickR([`the ${pickR(SCH_ADJ)} ${I} School`, `the School of the ${pickR(SCH_ADJ)} ${I}`, `the ${pickR(SCH_NUM)} ${I} Gates`, `the ${I} Gate`])
      : `the ${schPlace(home)} ${pickR(['Style', 'Way', 'Breath', 'Stillness', 'Hand'])}`;
    if(!taken.has(n)) return n;
  }
  return `the ${sur} School of ${schPlace(home)}`;
}
// a branch is named after the ROOT school, never after its parent, so names never nest ("the X line of the Y line of…");
// a branch of a branch also leans towards a name of its own (Moreira-ryū), keeping only the link to where it all began
const schBranchName = (s, taken, f) => {
  let root = s, g = 0; while(root.parent && g++ < 8){ const p = schOf(root.parent); if(!p) break; root = p; }
  const strip = n => n.replace(/^the /, '').replace(/^.+? line of (the )?/, '').replace(new RegExp('^(' + SCH_PRE.join('|') + ') '), '');
  const base = strip(root.name), words = new Set(base.split(/[ -]/)), pre = SCH_PRE.filter(p => !words.has(p));
  const sur = f.name.split(' ').slice(-1)[0], rootN = /^[A-Z]/.test(base) && !/^the /.test(root.name) ? base : 'the ' + base;
  const deep = !!s.parent;   // the parent is itself a branch
  const opts = deep ? [`${sur}-ryū`, `the ${sur} School`, `the ${pickR(pre)} ${base}`, `the ${sur} line of ${rootN}`] : [`the ${pickR(pre)} ${base}`, `the ${pickR(pre)} ${base}`, `the ${sur} line of ${rootN}`];
  for(let t = 0; t < 12; t++){ const n = pickR(opts); if(!taken.has(n)) return n; }
  return `the ${sur} School of ${schPlace(f.home || s.home)}`;
};
// the category a school pushes its students towards: one of the two neighbours of its own Nen, picked by its principle
function schLean(s){ const i = NEN_CATS.indexOf(s.cat), nb = [NEN_CATS[(i + 5) % 6], NEN_CATS[(i + 1) % 6]], pi = Math.max(0, (SCH_PR[s.cat] || []).findIndex(p => p[0] === s.pr[0])); return nb[pi % 2]; }
// training leaves the school's mark on a student's Nen: a couple of points a year towards what the school values
function schMark(h, s){
  if(!h.nen || !h.nen.efficiency) return;
  const lean = h.nen.category !== s.cat && !(s.cat === 'Specialization') ? s.cat : (s.lean || (s.lean = schLean(s)));
  if(lean === h.nen.category) return;
  const base = nenEfficiency(h.nen.category)[lean]; if(!base) return;   // Specialization stays closed to those not born to it
  const now = h.nen.efficiency[lean] ?? base, cap = Math.min(95, base + 12); if(now >= cap) return;
  const v = Math.min(2, cap - now); h.nen.efficiency[lean] = now + v;
  h.nen.sch = h.nen.sch && h.nen.sch.id === s.id ? {id: s.id, k: lean, v: h.nen.sch.v + v} : {id: s.id, k: lean, v};
}
function schFound(m, ed, add, items, parent){
  WORLD.schools = WORLD.schools || [];
  const cat = parent ? parent.cat : m.nen.category, taken = new Set(WORLD.schools.map(s => s.name)), home = homeOf(m);
  const used = parent ? parent.pr[0] : null, prs = (SCH_PR[cat] || SCH_PR.Specialization).filter(p => p[0] !== used);
  const s = {id: 'N' + (++WORLD.seq), name: parent ? schBranchName(parent, taken, m) : schName(m, cat, home, taken), cat, pr: pickR(prs), founder: m.license, fName: m.name, ed, home, heads: [{lic: m.license, name: m.name, from: ed}], st: 'open', parent: parent ? parent.id : null, rival: parent ? parent.id : null, dead: 0, peak: 0, wins: 0};
  s.lean = schLean(s); WORLD.schools.push(s); m.school = s.id;
  return s;
}
function schoolsYear(ed, add, items){
  if(!WORLD.schNameFix){ WORLD.schNameFix = 1; (WORLD.schools || []).forEach(x => { x.name = x.name.replace(/^(the \S+ line of )(?:.*? line of )+/i, '$1'); }); }   // older saves: "the X line of the Y line of Z" becomes "the X line of Z"
  const S0 = WORLD.schools = WORLD.schools || [], act = chAct(), byLic = new Map(HUNTERS.map(h => [h.license, h]));
  const pupils = new Map(); act.forEach(h => { if(h.master) (pupils.get(h.master) || pupils.set(h.master, []).get(h.master)).push(h); });
  const free = m => (pupils.get(m.license) || []).filter(p => ed - (p.mEd || ed) <= 3).length < SCH_PUPILS;
  const canTeach = m => m && hActive(m) && !m.legacy && hStars(m) >= 1 && hunterAge(m) >= 28 && m.nen && m.nen.category && !(m.susp >= ed) && !(WORLD.exped && m.exped === WORLD.exped.id);
  // the dojo's own: pupils who came to the exam from a school go back to it
  act.filter(h => h.dojo && !h.master && ed - h.edition <= 1 && h.edition <= ed).forEach(h => { if(dojoReturn(h, ed, add, act)) (pupils.get(h.master) || pupils.set(h.master, []).get(h.master)).push(h); });
  // 🥋 new Hunters look for a master: same Nen first, a parent if they can, a school's name helps
  act.filter(h => !h.master && h.nen && h.nen.category && ed - h.edition <= 1 && h.edition <= ed && !h.pro && hunterAge(h) < 40).forEach(h => {
    const par = (h.heirOf || []).concat(h.hParent ? [h.hParent] : []).map(l => byLic.get(l)).filter(m => canTeach(m) && free(m));
    let m = par.length && Math.random() < 0.5 ? pickR(par) : null;
    if(!m){ if(Math.random() >= 0.3) return;
      const P = act.filter(x => x !== h && canTeach(x) && free(x));
      const w = x => (x.nen.category === h.nen.category ? 4 : 0.4) * (1 + hStars(x)) ** 2 * (1 + (x.rp || 0) / 1500) * (x.school ? 1.5 : 1) * (schHead(schOf(x.school)) && schHead(schOf(x.school)).lic === x.license ? 1.5 : 1) * (homeOf(x) === homeOf(h) ? 1.5 : 1) * (x.career === h.career ? 1.4 : 1) * relTeach(x);
      m = P.length ? wpickM(P, w) : null; }
    if(!m) return;
    const s = schOf(m.school), sOpen = s && s.st !== 'closed';
    h.master = m.license; h.mEd = ed; if(sOpen) h.school = s.id; m.pupilsN = (m.pupilsN || 0) + 1;
    (pupils.get(m.license) || pupils.set(m.license, []).get(m.license)).push(h);
    const kin = par.includes(m);
    add(h, 'pupil', kin ? `${h.name} trains under ${PR(h).their} own parent, ${m.name}${sOpen ? `, in the ways of ${s.name}` : ''}.` : `${h.name} becomes ${m.name}'s student${sOpen ? ` at ${s.name}` : ''}.`, sOpen ? 3 : 2, m);
  });
  // what the school teaches shows in its students, over their first three years
  act.forEach(h => { if(!h.master || !h.attrs || ed - (h.mEd || ed) > 3 || ed === h.mEd || Math.random() >= 0.45) return;
    const s = schOf(h.school), m = byLic.get(h.master), k = s ? pickR(s.pr[1]) : m && m.attrs ? Object.entries(m.attrs).sort((a, b) => b[1] - a[1])[0][0] : null;
    if(k && h.attrs[k] != null) h.attrs[k] = Math.min(99, h.attrs[k] + 1 + (m && RX(m, 'a5') && Math.random() < RX(m, 'a5') ? 1 : 0)); if(s) schMark(h, s); });
  // students of the same master, training in the same years: they get to know each other, for better or worse
  pupils.forEach((L, ml) => { const T = L.filter(p => hActive(p) && ed - (p.mEd || ed) <= 3); const m = byLic.get(ml);
    for(let i = 0; i < T.length; i++) for(let j = i + 1; j < T.length; j++){ const a = T[i], b = T[j];
      tieUp(a, b);   // years in the same dojo count, like years of shared contracts (and can end in a wedding)
      const bonded = (a.bonds || []).some(x => x.id === b.cid), rivals = (a.rivals || []).includes(b.cid), r = Math.random();
      if(!bonded && !rivals && r < 0.06){ (a.bonds = a.bonds || []).push({id: b.cid, name: b.name, ed}); (b.bonds = b.bonds || []).push({id: a.cid, name: a.name, ed});
        add(a, 'bond', pickR([`${a.name} and ${b.name}, both students of ${m ? m.name : 'the same master'}, swear to watch each other's backs. They mean it.`, `Years of sparring under ${m ? m.name : 'the same master'} leave ${a.name} and ${b.name} closer than family.`]), 6, b); }
      else if(!bonded && !rivals && r < 0.10){ [[a, b], [b, a]].forEach(([x, y]) => { (x.rivals = x.rivals || []).push(y.cid); (x.rivalWhy = x.rivalWhy || {})[y.cid] = `${m ? m.name + "'s" : 'the master\'s'} favour`; });
        add(a, 'rival', pickR([`${a.name} and ${b.name} compete for ${m ? m.name + "'s" : 'their master\'s'} approval in every lesson. Neither ever gets it first.`, `${m ? m.name : 'Their master'} praises ${b.name} in front of ${a.name} once too often. The rivalry starts that day.`]), 5, b); }
    } });
  // ⛩ a master with enough students founds a school; a star of another school may leave to found a rival
  const openN = () => S0.filter(s => s.st !== 'closed').length;
  act.forEach(m => { if(!canTeach(m) || (m.pupilsN || 0) < 3 || openN() >= SCH_OPEN_MAX) return;
    const s = schOf(m.school), head = s && schHead(s) && schHead(s).lic === m.license;
    if(head) return;
    if(!s || s.st === 'closed'){ if(hStars(m) < 2 || (m.pupilsN || 0) < 4 || Math.random() >= 0.2) return;
      const n = schFound(m, ed, add, items); (pupils.get(m.license) || []).forEach(p => p.school = n.id);
      const t = `${m.name} founds ${n.name} in ${n.home}. Its first principle: "${n.pr[0]}"`; chNote(n, ed, t); add(m, 'school', t, 7); }
    else if(hStars(m) >= 3 && (m.pupilsN || 0) >= 4 && Math.random() < 0.04){
      const n = schFound(m, ed, add, items, s); n.rival = s.id; s.rival = n.id; n.split = 'left';
      (pupils.get(m.license) || []).forEach(p => p.school = n.id);
      const t = `${m.name} walks out of ${s.name} with ${PR(m).their} own students and founds ${n.name}. "${n.pr[0]}"`; chNote(n, ed, t); chNote(s, ed, t); add(m, 'school', t, 8); }
  });
  // succession: when a master is gone, the school passes on, or breaks in two
  S0.filter(s => s.st !== 'closed').forEach(s => {
    const members = act.filter(x => x.school === s.id); s.peak = Math.max(s.peak || 0, members.length);
    const hd = schHead(s), hh = hd && byLic.get(hd.lic);
    if(hd && hh && hActive(hh) && !(hh.susp >= ed)) return;
    if(s.st === 'dormant'){
      if(members.length){ const a = members.sort((x, y) => (y.rp || 0) + hStars(y) * 300 - (x.rp || 0) - hStars(x) * 300)[0]; s.st = 'open'; s.heads.push({lic: a.license, name: a.name, from: ed});
        const t = `${a.name} reopens the dojo of ${s.name} in ${s.home}, ${chY(ed - s.dorm)} after it fell quiet.`; chNote(s, ed, t); add(a, 'school', t, 6); }
      else if(ed - s.dorm >= 20){ s.st = 'closed'; s.end = ed; const t = `The last of ${s.name} is gone. The old dojo in ${s.home} becomes ${pickR(['a tea house', 'a school for children', 'a warehouse', 'a shrine nobody visits', 'a bakery'])}.`; chNote(s, ed, t); items.push({lic: '', name: '', kind: 'school', text: capS(t), rank: 5}); }
      return;
    }
    if(hd){ hd.to = ed; }
    const gone = hh ? (hh.status === 'Deceased' ? 'death' : hh.status === 'Missing' ? 'disappearance' : hh.revoked ? 'disgrace' : 'retirement') : 'death';
    const direct = members.filter(x => hd && x.master === hd.lic), pool = (direct.length ? direct : members).sort((x, y) => (y.rp || 0) + hStars(y) * 300 - (x.rp || 0) - hStars(x) * 300);
    if(!pool.length){ s.st = 'dormant'; s.dorm = ed; const t = `With ${hh ? hh.name : 'its master'} gone and no student left in the field, ${s.name} falls quiet.`; chNote(s, ed, t); items.push({lic: '', name: '', kind: 'school', text: capS(t), rank: 4}); return; }
    const a = pool[0], b = pool[1];
    if(b && hStars(b) >= 1 && (b.rp || 0) >= 0.7 * (a.rp || 0) && openN() < SCH_OPEN_MAX + 2 && Math.random() < 0.5 * relSchism(hh)){
      s.heads.push({lic: a.license, name: a.name, from: ed});
      const n = schFound(b, ed, add, items, s); n.split = 'succession'; s.rival = n.id;
      const go = members.filter(x => x !== a && x !== b && (x.master === b.license || Math.random() < 0.3)); go.forEach(x => x.school = n.id);
      [[a, b], [b, a]].forEach(([x, y]) => { if(!(x.rivals || []).includes(y.cid)){ (x.rivals = x.rivals || []).push(y.cid); (x.rivalWhy = x.rivalWhy || {})[y.cid] = `the succession of ${s.name}`; } });
      const t = `${hh ? hh.name + '\'s ' + gone : 'The loss of its master'} splits ${s.name}. ${a.name} keeps the dojo in ${s.home}; ${b.name} walks out with ${go.length || 'no'} student${go.length === 1 ? '' : 's'} and founds ${n.name}.`;
      chNote(s, ed, t); chNote(n, ed, t); add(a, 'school', t, 8, b);
    } else {
      s.heads.push({lic: a.license, name: a.name, from: ed});
      const t = `${a.name} succeeds ${hh ? hh.name : 'the old master'} as master of ${s.name}${hd && a.master !== hd.lic ? ', though not one of ' + (hh ? PR(hh).their : 'the master\'s') + ' own students' : ''}.`;
      chNote(s, ed, t); add(a, 'school', t, 6, hh || undefined);
    }
  });
  // schools in the field: the fallen are counted; a dead master is mourned by students
  HUNTERS.filter(h => h.status === 'Deceased' && h.diedEd === ed && h.school).forEach(h => { const s = schOf(h.school); if(s) s.dead = (s.dead || 0) + 1;
    (pupils.get(h.license) || []).slice(0, 2).forEach(p => add(p, 'school', pickR([`${p.name} buries ${PR(p).their} master, ${h.name}.`, `${p.name} keeps ${h.name}'s training weights. ${PR(p).They} will not let anyone else lift them.`]), 5, h)); });
  // rival schools test each other
  S0.filter(s => s.st === 'open' && s.rival && s.id < s.rival).forEach(s => { const t = schOf(s.rival); if(!t || t.st !== 'open' || Math.random() >= 0.15) return;
    const A = act.filter(x => x.school === s.id && !(x.susp >= ed)), B = act.filter(x => x.school === t.id && !(x.susp >= ed)); if(!A.length || !B.length) return;
    const a = pickR(A), b = pickR(B), sc = x => careerSkill(x) + hStars(x) * 12 + Math.random() * 40, aw = sc(a) >= sc(b), W = aw ? a : b, L = aw ? b : a, WS = aw ? s : t, LS = aw ? t : s;
    WS.wins = (WS.wins || 0) + 1; W.rp = (W.rp || 0) + 15;
    const tx = `${a.name} of ${s.name} and ${b.name} of ${t.name} meet in a duel in ${pickR(PLACES)}. ${W.name} wins; ${WS.name} claims the argument, for now.`; add(W, 'school', tx, 5, L); });
  // closed schools are forgotten in time; the founder's own blood can open the door again
  S0.filter(s => s.st === 'closed').forEach(s => { if(Math.random() >= 0.03) return;
    const kin = act.find(x => !x.school && x.nen && x.nen.category === s.cat && hStars(x) >= 1 && ((x.heirOf || []).includes(s.founder) || x.hParent === s.founder)); if(!kin) return;
    s.st = 'open'; delete s.end; s.heads.push({lic: kin.license, name: kin.name, from: ed}); kin.school = s.id;
    const t = `${kin.name}, ${s.fName}'s child, reopens ${s.name} in ${s.home}. The principle is the same: "${s.pr[0]}"`; chNote(s, ed, t); add(kin, 'school', t, 7); });
  const closed = S0.filter(s => s.st === 'closed').sort((a, b) => a.end - b.end);
  if(closed.length > SCH_KEEP_CLOSED){ const drop = new Set(closed.slice(0, closed.length - SCH_KEEP_CLOSED).map(s => s.id)); WORLD.schools = S0.filter(s => !drop.has(s.id)); }
}
// World page: a table of schools, and a popup for each
function schoolsHtml(){
  const L = (WORLD.schools || []).filter(s => s.st !== 'closed' || (s.end && S.edition - s.end < 30));
  if(!L.length) return '';
  const hl = l => { const h = hLic(l); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : '—'; };
  const ord = {open: 0, dormant: 1, closed: 2}, rows = L.slice().sort((a, b) => ord[a.st] - ord[b.st] || a.ed - b.ed);
  const top = s => HUNTERS.filter(h => h.school === s.id && hActive(h) && !(schHead(s) && schHead(s).lic === h.license)).sort((a, b) => hStars(b) - hStars(a) || (b.rp || 0) - (a.rp || 0)).slice(0, 3);
  return `<div><div class="section-h">Schools of Nen</div><div class="tablebox"><table class="hatable sch-t"><thead><tr><th>School</th><th>Founder</th><th>Founded</th><th>Master</th><th>Leading students</th></tr></thead><tbody>
    ${rows.map(s => { const hd = schHead(s), T = top(s); return `<tr data-school="${s.id}" class="${s.st}"><td>${schoolCrest(s, 40)}<b>${esc(capS(s.name))}</b>${s.parent ? ' <span class="muted" title="Branch">⑂</span>' : ''}<br><small class="muted">${nenChip(s.cat)}${s.st !== 'open' ? ` · ${s.st}` : ''}</small></td><td>${hl(s.founder)}</td><td>${ordinal(s.ed)}</td><td>${hd ? hl(hd.lic) : '<span class="muted">—</span>'}</td><td>${T.length ? T.map(h => hl(h.license) + (hStars(h) ? ` <span class="stars">${starStr(hStars(h))}</span>` : '')).join(', ') : '<span class="muted">—</span>'}</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
}
function openSchool(id){
  const s = schOf(id); if(!s) return;
  const hl = (l, n) => { const h = hLic(l); return h ? `<a data-hunter="${esc(h.license)}">${esc(h.name)}</a>` : esc(n || '—'); };
  const all = HUNTERS.filter(h => h.school === s.id), live = all.filter(hActive), st = live.length ? (live.reduce((a, h) => a + hStars(h), 0) / live.length).toFixed(1) : '—';
  const kids = (WORLD.schools || []).filter(x => x.parent === s.id), par = schOf(s.parent), riv = schOf(s.rival);
  const top = live.slice().sort((a, b) => hStars(b) - hStars(a) || (b.rp || 0) - (a.rp || 0)).slice(0, 6);
  showModal(`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(capS(s.name))}">
    <div class="sheet-head"><div class="sch-head">${schoolCrest(s, 120)}<div><div class="meta">School of Nen · ${nenChip(s.cat)}</div><div class="sh-t"><h2>${esc(capS(s.name))}</h2></div><div class="meta">Founded by ${hl(s.founder, s.fName)} in ${esc(s.home)}, after the ${ordinal(s.ed)} exam${par ? ` · a branch of <a data-school="${par.id}">${esc(par.name)}</a>` : ''}</div></div></div>
      <div style="display:flex;gap:8px;align-items:center"><button class="btn" id="mClose">Close</button></div></div>
    <p class="sch-pr">“${esc(s.pr[0])}”<small>Students grow in ${s.pr[1].map(k => ATTR_LABEL[k]).join(' and ')}</small></p>
    <div class="hcard"><div><small>Status</small><b>${s.st === 'open' ? 'Teaching' : s.st === 'dormant' ? 'Dormant' : 'Closed'}</b></div><div><small>In the field</small><b>${live.length}</b></div><div><small>Students, all time</small><b>${all.length}</b></div><div><small>Average rank</small><b>${st}</b></div><div><small>Fallen in the field</small><b>${s.dead || 0}</b></div><div><small>Peak</small><b>${s.peak || live.length}</b></div><div><small>Sent to the exam</small><b>${s.sent || 0}${s.sent ? ` · ${s.passed || 0} licensed (${Math.round((s.passed || 0) / s.sent * 100)}%)` : ''}</b></div><div><small>Branches</small><b>${kids.length ? kids.map(k => `<a data-school="${k.id}">${esc(k.name)}</a>`).join(', ') : '—'}</b></div><div><small>Rival</small><b>${riv ? `<a data-school="${riv.id}">${esc(riv.name)}</a>${s.wins ? ` · ${s.wins} duel${s.wins === 1 ? '' : 's'} won` : ''}` : '—'}</b></div></div>
    <div><div class="section-h">Masters</div><div class="sch-line">${s.heads.map((x, i) => `<span><small>${i ? ordinal(i + 1) : 'Founder'}</small>${hl(x.lic, x.name)} <span class="muted">${ordinal(x.from)}–${x.to != null ? ordinal(x.to) : 'today'}</span></span>`).join('')}</div></div>
    ${top.length ? `<div><div class="section-h">Leading students</div><div class="sch-line">${top.map(h => `<span>${hl(h.license)} ${hStars(h) ? `<span class="stars">${starStr(hStars(h))}</span>` : ''}<small>${esc((h.career || '').replace(' Hunter', ''))}${h.master ? ` · under ${hLic(h.master) ? esc(hLic(h.master).name) : '—'}` : ''}</small></span>`).join('')}</div></div>` : ''}
    ${(s.hist || []).length ? `<div><div class="section-h">History</div><div class="bulletin">${s.hist.slice().reverse().map(x => `<div class="bl school"><i>⛩</i><span><span class="muted">${ordinal(x.ed)}</span> ${autoLink(esc(x.t))}</span></div>`).join('')}</div></div>` : ''}
  </div>`);
}
// on a Hunter's profile: who taught them, whom they taught
function schoolRowHtml(h){
  const m = hLic(h.master), s = schOf(h.school), P = HUNTERS.filter(x => x.master === h.license);
  if(!m && !s && !P.length) return '';
  const hl = x => `<a data-hunter="${esc(x.license)}">${esc(x.name)}</a>`;
  return `<div><div class="section-h">Nen lineage</div>${m ? `<p class="h-fam"><span>⛩</span> Trained by ${hl(m)}${h.mEd ? ` <span class="muted">from the ${ordinal(h.mEd)}</span>` : ''}</p>` : ''}${s ? `<p class="h-fam"><span>⛩</span> ${schHead(s) && schHead(s).lic === h.license ? 'Master of' : s.founder === h.license ? 'Founder of' : 'Student of'} ${schoolCrest(s, 22)} <a class="golink" data-school="${s.id}" title="Open the school">${esc(capS(s.name))} ›</a></p>` : ''}${P.length ? `<p class="h-fam"><span>⛩</span> Students: ${P.slice(0, 8).map(hl).join(', ')}${P.length > 8 ? ` and ${P.length - 8} more` : ''}</p>` : ''}</div>`;
}
// capture phase: a school link inside a Hunter's row opens the school, not the Hunter
document.addEventListener('click', e => { const s = e.target.closest('[data-school]'), h = e.target.closest('[data-hunter]'); if(s && (!h || h.contains(s))){ e.preventDefault(); e.stopPropagation(); openSchool(s.dataset.school); } }, true);

/* ---------- 3. Coming back: the seat someone else holds, the spouse who stopped waiting, what they saw ---------- */
// the waiting ends: after seven years, a spouse may let go (and the missing Hunter may come back to find it so)
function waitingYear(ed, add){
  HUNTERS.filter(h => h.status === 'Missing' && h.spouse).forEach(h => {
    const sp = hLic(h.spouse), since = h.missEd ?? h.diedEd ?? ed;
    if(!sp || sp.spouse !== h.license || sp.status === 'Deceased' || ed - since < 7 || Math.random() >= 0.06) return;
    sp.spouse = null; sp.waited = h.license;
    add(sp, 'wed', pro(`${sp.name} has waited ${ed - since} years for ${h.name}. {They} take{s} off the ring.`, sp), 5, h);
  });
}
function afterReturn(h, ed, add, since, lostIn){
  const yrs = Math.max(1, ed - (since ?? ed)), Y = chY(yrs), P = PR(h), f = t => pro(t, h);
  if(typeof REL_LANTERN !== 'undefined' && REL_LANTERN.has(h.license)){ const L = hLic((WORLD.relics.a9 || {}).holder); if(L) add(h, 'relic', `${h.name} says ${P.they} followed a light the whole way home. ${L.name} had kept the One-Wick Lantern burning.`, 7, L); }
  // 1. the seat: someone else sits in it now
  const lost = (h.pastRoles || []).filter(r => r.to != null && since != null && r.to >= since && r.to <= ed).pop();
  if(lost){
    const r = lost.r, curL = r === 'Chairman' ? WORLD.chair && WORLD.chair.lic : r === 'Vice-Chairman' ? WORLD.vice : (WORLD.zodiac || {})[r], cur = hLic(curL);
    const seat = r === 'Chairman' ? 'the chairmanship' : r === 'Vice-Chairman' ? 'the Vice-Chairmanship' : `the ${r} seat`;
    if(r === 'Chairman' && cur && cur !== h){
      if(Math.random() < 0.5){ WORLD.claim = {lic: h.license, ed}; h.claimEd = ed; add(h, 'election', f(`${h.name} walks back into the Association ${Y} after vanishing and asks for the chairmanship back. ${cur.name} says no.`), 9, cur); }
      else add(h, 'election', f(`${h.name} finds ${cur.name} in {their} old office, and lets ${PR(cur).them} keep it.`), 7, cur);
    } else if(r !== 'Chairman'){
      const x = Math.random();
      if(!cur || x < 0.35){ if(r === 'Vice-Chairman') WORLD.vice = h.license; else WORLD.zodiac[r] = h.license; seatSince(r === 'Vice-Chairman' ? 'vice' : r, ed);
        add(h, 'zodiac', cur ? `${cur.name} hands ${seat} back to ${h.name}. "It was always yours."` : `${h.name} takes back ${seat}, which nobody had dared to fill.`, 8, cur || undefined); }
      else if(x < 0.75){ [[h, cur], [cur, h]].forEach(([a, b]) => { if(!(a.rivals || []).includes(b.cid)){ (a.rivals = a.rivals || []).push(b.cid); (a.rivalWhy = a.rivalWhy || {})[b.cid] = seat; } });
        add(h, 'zodiac', `${cur.name} keeps ${seat} that ${h.name} lost by vanishing. They have not spoken since.`, 7, cur); }
      else add(h, 'zodiac', f(`${h.name} does not ask for ${seat} back. ${cur.name} has earned it, {they} say{s}.`), 5, cur);
    }
  }
  // 2. the spouse
  const sp = hLic(h.spouse);
  if(sp){
    if(sp.status === 'Deceased'){ h.spouse = null; h.widowOf = sp.license; h.widowEd = ed; add(h, 'wed', f(`${h.name} comes home ${Y} too late: ${sp.name} died in the ${ordinal(sp.diedEd ?? ed)}.`), 8, sp); }
    else if(sp.spouse === h.license) add(h, 'wed', `${sp.name} never stopped waiting. After ${Y}, ${h.name} comes home.`, 8, sp);
    else { h.spouse = null; h.exSpouse = sp.license; const np = hLic(sp.spouse);
      if(np && np.status !== 'Deceased'){ const x = Math.random();
        if(x < 0.15){ np.spouse = null; np.exSpouse = sp.license; sp.spouse = h.license; h.spouse = sp.license; delete h.exSpouse; add(h, 'wed', `${sp.name} leaves ${np.name} the week ${h.name} comes back. Nobody in ${pickR(PLACES)} talks about anything else.`, 9, sp); }
        else if(x < 0.35){ if(!(h.rivals || []).includes(np.cid)){ (h.rivals = h.rivals || []).push(np.cid); (h.rivalWhy = h.rivalWhy || {})[np.cid] = 'a marriage'; } add(h, 'wed', `${h.name} comes back to find ${sp.name} married to ${np.name}, and does not take it well.`, 8, np); }
        else add(h, 'wed', f(`${h.name} comes back to find ${sp.name} married to ${np.name}. {They} wish{es} them well, and mostly mean{s} it.`), 7, sp); }
      else add(h, 'wed', `${sp.name} had stopped waiting for ${h.name}. They meet once, for coffee, and part as strangers.`, 6, sp); }
  }
  // 3. children who grew up meanwhile
  const kid = (WORLD.heirs || []).filter(k => k.parents.includes(h.license) && since != null && k.born < since).map(k => ({k, H: HUNTERS.find(x => x.cid === k.cid)}))[0];
  if(kid){ const g = kid.k.gender === 'Male' ? 'son' : kid.k.gender === 'Female' ? 'daughter' : 'child';
    add(h, 'wed', kid.H && kid.H.edition >= since ? f(`${h.name} meets {their} ${g} again: ${kid.H.name}, a licensed Hunter now, licensed in the ${ordinal(kid.H.edition)} while {their} parent was gone.`) : f(`${h.name}'s ${g} ${kid.k.first} was ${Math.max(0, since - kid.k.born)} when {they} disappeared. ${kid.k.first} is ${ed - kid.k.born} now.`), 6); }
  // 4. what they bring back
  const own = (WORLD.cases || []).find(c => c.lic === h.license && c.st === 'paused');
  if(own){ own.st = 'open'; chNote(own, ed, `${h.name} is back. The case resumes.`); add(h, 'case', f(`With ${h.name} back, the case against {them} for ${CASE_K[own.k].what} resumes.`), 7); }
  else { const wrong = (WORLD.cases || []).filter(c => c.end != null && !c.reEd && c.lic !== h.license && (c.verdict === 'guilty') !== c.truth);
    const w = (WORLD.wanted || []).filter(x => x.status === 'wanted');
    if(wrong.length && Math.random() < 0.4){ const c = pickR(wrong), a = hLic(c.lic); if(a) caseReopen(c, a, ed, add, h, `${h.name} comes back with something the inquiry never heard`); }
    else if(w.length && Math.random() < 0.35){ const x = pickR(w); x.tip = ed; add(h, 'hunt', f(`${h.name} spent part of those years close to ${x.name}'s people, and tells the Association where to look.`), 6); }
    else if(lostIn){ const left = HUNTERS.filter(o => o !== h && o.status === 'Missing' && o.lostIn === lostIn); if(left.length && !WORLD.lostExp){ WORLD.lostExp = {id: lostIn, ed, names: left.map(o => o.name).slice(0, 4)}; add(h, 'exped', f(`${h.name} swears ${andList(left.slice(0, 3).map(o => o.name))} ${left.length === 1 ? 'was' : 'were'} alive when {they} last saw them. The Association starts planning a rescue.`), 8); } } }
  // 5. fitting back in
  const x = Math.random();
  if(yrs >= 5 && x < 0.12){ h.status = 'Retired'; h.retEd = ed; retireRec(h, ed, 'after coming back'); add(h, 'retire', f(`${h.name} tries the field again for a season, and stops. "Everything moved while I was gone."`), 6); }
  else if(yrs >= 12 && x < 0.4) add(h, 'missing', f(`The Association tests ${h.name}'s aura three times before it believes {them}. {They} pass all three.`), 4);
  else if(yrs >= 3 && x < 0.6){ const n = deedNick(h, ['the Returned', 'Second Life', 'Long Way Home', 'Lazarus', 'Back-Again'], `for coming back after ${Y}`); if(n) add(h, 'missing', `${h.name} is not quite the Hunter who left.${n}`, 4); }
}

/* ---------- the yearly turn ---------- */
function chroniclesYear(prev, ed, add, items){
  try { waitingYear(ed, add); } catch(e){ console.error(e); }
  try { casesYear(prev, ed, add, items); } catch(e){ console.error(e); }
  try { schoolsYear(ed, add, items); } catch(e){ console.error(e); }
  try { relicsYear(prev, ed, add, items); } catch(e){ console.error(e); }
}

/* ---------- the dojos: a school's pupils who are not Hunters yet ----------
   Some applicants come from a school. The school trains their body and mind; a few (like Wing's Zushi) already know some Nen.
   If they pass, they go straight back to the school's master; if they fail, they keep the school's name and may return. */
const DOJO_BOOST = 8;   // the school's two attributes, on top of a general +1–2
function schoolsEnter(S){
  const open = (WORLD.schools || []).filter(s => s.st === 'open'); if(!open.length) return;
  const byS = new Map(), nenKids = [];
  const tie = (c, s) => {
    c.dojo = {id: s.id, name: s.name}; s.sent = (s.sent || 0) + 1;
    // years of discipline: every attribute a little, the school's own two a lot
    Object.keys(c.a).forEach(k => { c.a[k] = Math.min(97, c.a[k] + 2 + Math.floor(Math.random() * 3)); });
    s.pr[1].forEach(k => { if(c.a[k] != null) c.a[k] = Math.min(97, c.a[k] + DOJO_BOOST + Math.floor(Math.random() * 4)); });
    if(Math.random() < 0.12){ c.dojoNen = true; ['perception', 'determination', 'combat'].forEach(k => { if(c.a[k] != null) c.a[k] = Math.min(97, c.a[k] + 3); }); nenKids.push([c, s]); }
    c.notes.unshift({p: 0, text: `Trained at ${capS(s.name)}${c.dojoNen ? ', where someone has already been teaching ' + PR(c).them + ' Nen' : ''}`});
    (byS.get(s) || byS.set(s, []).get(s)).push(c);
  };
  // returning candidates kept their school; the children of a school's people often train there
  S.candidates.filter(c => c.dojo && c.status === 'Active').forEach(c => { const s = schOf(c.dojo.id); if(s && s.st === 'open') (byS.get(s) || byS.set(s, []).get(s)).push(c); else delete c.dojo; });
  S.candidates.filter(c => c.heir && !c.dojo && c.status === 'Active').forEach(c => { const p = c.heir.parents.map(hLic).find(h => h && schOf(h.school) && schOf(h.school).st === 'open'); if(p && Math.random() < 0.7) tie(c, schOf(p.school)); });
  const free = S.candidates.filter(c => c.status === 'Active' && !c.dojo && !c.heir && c.age >= 12 && c.age <= 32 && !mtOf(c.id));
  // a dojo picks its promising pupils: the stronger tiers are chosen more often
  const tw = c => c.tier === 'Elite' ? 2 : c.tier === 'Skilled' ? 4 : c.tier === 'Trained' ? 3 : 1;
  open.forEach(s => { const r = Math.random(), n = r < 0.45 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 2 : 3;
    for(let i = 0; i < n && free.length; i++){ const c = wpickM(free, tw); free.splice(free.indexOf(c), 1); tie(c, s); } });
  // registration: each school's group, the ones who already feel aura, and rival schools face to face
  byS.forEach((L, s) => { const hd = schHead(s), H = hd && hLic(hd.lic);
    log(S, 0, 'story', `${capS(s.name)} sends ${andList(L.map(c => c.name))} to the exam.${H && hActive(H) ? pickR([` ${H.name} does not come to watch. Officially.`, ` ${H.name} sees ${L.length > 1 ? 'them' : PR(L[0]).them} off at the gate and says nothing useful.`, ` Word is ${H.name} has a bet on ${L.length > 1 ? 'one of them' : PR(L[0]).them}.`]) : ''}`, L.map(c => c.id)); });
  nenKids.forEach(([c, s]) => log(S, 0, 'event', pickR([`${c.name} sits apart at registration, breathing slowly. One of the examiners notices the aura around ${PR(c).them} and frowns: someone at ${s.name} has been teaching Nen to a candidate.`, `A cup tips over near ${c.name} without anyone touching it. ${c.first || c.name} apologises. A Hunter in the crowd recognises the habits of ${s.name}.`]), [c.id]));
  const ent = [...byS.entries()];
  ent.forEach(([s, A]) => ent.forEach(([t, B]) => { if(s.rival !== t.id || s.id > t.id) return; const a = A[0], b = B[0]; if(!a || !b) return;
    addGrudge(a, b, `trains at the rival school, ${t.name}`); addGrudge(b, a, `trains at the rival school, ${s.name}`);
    log(S, 0, 'rival', `${a.name} of ${s.name} and ${b.name} of ${t.name} spot each other at registration. Their masters never got along either.`, [a.id, b.id]); }));
}
// a licensed pupil of a dojo goes back to the school's master
function dojoReturn(h, ed, add, act){
  const s = schOf(h.dojo); if(!s) return false;
  if(!h.dojoDone){ h.dojoDone = ed; s.passed = (s.passed || 0) + 1; }
  if(s.st !== 'open') return false;
  const hd = schHead(s), H = hd && hLic(hd.lic), m = H && hActive(H) && H !== h ? H : act.find(x => x !== h && x.school === s.id && hStars(x) >= 1);
  if(!m) return false;
  h.master = m.license; h.mEd = ed; h.school = s.id; m.pupilsN = (m.pupilsN || 0) + 1;
  add(h, 'school', `${h.name} goes back to ${s.name} with a Hunter License. ${m.name} takes ${PR(h).them} on as a full student.`, 5, m);
  return true;
}
