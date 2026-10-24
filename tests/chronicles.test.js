// 300 years of world: cases reach verdicts, schools are founded and pass from master to student, the returned come back to something.
const assert = require('assert'), {openGame, runExams} = require('./lib');
const YEARS = +(process.env.YEARS || 300);
(async () => {
  const {browser, page, errors} = await openGame();
  for(let i = 0; i < YEARS / 10; i++) await runExams(page, 10);
  const r = await page.evaluate(() => {
    const C = WORLD.cases || [], Sc = WORLD.schools || [], logs = HUNTERS.flatMap(h => (h.log || []).map(x => x.text));
    const gens = s => s.heads.length, has = re => logs.filter(t => re.test(t)).length;
    const badRef = HUNTERS.filter(h => h.school && !Sc.some(s => s.id === h.school) && !(Sc.length >= 25)).length;
    return {
      cases: WORLD.caseN || C.length, guilty: (WORLD.caseV || {}).guilty || 0, cleared: (WORLD.caseV || {}).cleared || 0, dropped: C.filter(c => c.verdict === 'dropped').length,
      reopened: C.filter(c => c.re).length, wrongNow: C.filter(c => c.end != null && (c.verdict === 'guilty') !== c.truth).length, revoked: HUNTERS.filter(h => h.revoked).length,
      schools: Sc.length, open: Sc.filter(s => s.st === 'open').length, branches: Sc.filter(s => s.parent).length, maxMasters: Math.max(0, ...Sc.map(gens)),
      pupils: HUNTERS.filter(h => h.master).length, schoolDuels: has(/meet in a duel in/), badRef,
      returns: has(/comes home|walks back into the Association|hands .* back to|keeps .* that .* lost by vanishing|married to/), letGo: has(/take off the ring|takes off the ring/),
      relics: (() => { const R = Object.values(WORLD.relics || {}); return {known: R.filter(r => r.st !== 'hidden').length, held: R.filter(r => r.st === 'held').length, multi: R.filter(r => (r.n || 0) >= 3).length, maxOwners: Math.max(0, ...R.map(r => r.n || 0)), st: R.reduce((a, r) => (a[r.st] = (a[r.st] || 0) + 1, a), {}), fakes: (WORLD.fakes || []).length, lines: has(/Ferryman|Waking Horn|Turning Coin|Twin Rings|Honest Scales|Constellation|Do Not|Moon-Pale|One-Wick|Reins/)}; })(),
      sample: {relic: Object.values(WORLD.relics || {}).sort((a, b) => (b.n || 0) - (a.n || 0))[0], relicLines: logs.filter(t => /Ferryman|Waking Horn|Turning Coin|Twin Rings|Honest Scales|Constellation|"Do Not"|Moon-Pale|One-Wick|Reins|forger|Copy|auction/.test(t)).slice(0, 12), school: Sc.filter(s => s.heads.length >= 3)[0], names: Sc.map(s => s.name), cases: C.filter(c => c.re).slice(0, 2).map(c => c.hist), ret: logs.filter(t => /comes home|walks back|hands .* back|lost by vanishing|married to|stopped waiting/.test(t)).slice(0, 6)},
      dojo: (() => { const Sc = WORLD.schools || []; return {sent: Sc.reduce((a, s) => a + (s.sent || 0), 0), licensed: HUNTERS.filter(h => h.dojo).length, nen: HUNTERS.filter(h => h.dojoNen).length}; })(),
      yearly: (WORLD.yearly || []).length, statsDrawn: (() => { try { return statsHtml().includes('Statistics') && relicsHtml().includes('Relics') && schoolsHtml().length > 0; } catch(e){ return String(e); } })(),
      saveKB: Math.round(JSON.stringify({WORLD, HUNTERS}).length / 1024)
    };
  });
  await browser.close();
  const {sample, ...m} = r; console.log(`chronicles (${YEARS} yrs):`, JSON.stringify(m)); if(process.env.SAMPLE) console.log(JSON.stringify(sample, null, 1));
  assert.deepStrictEqual(errors, [], errors.slice(0, 3).join(' | '));
  assert.ok(r.guilty + r.cleared >= 3, 'cases reach verdicts');
  assert.ok(r.schools >= 3, 'schools are founded');
  assert.ok(r.maxMasters >= 2, 'a school passes to a second master');
  assert.strictEqual(r.badRef, 0, 'every Hunter points at a known school');
  assert.ok(r.relics.known >= 10, 'relics are found');
  assert.ok(r.relics.multi >= 2, 'relics change hands');
  assert.ok(r.yearly >= YEARS - 1, 'one statistics row a year');
  assert.strictEqual(r.statsDrawn, true, 'World and History sections draw');
  assert.ok(r.dojo.sent > 0 && r.dojo.licensed > 0, 'schools send candidates and some pass');
})().catch(e => { console.error(e.message); process.exit(1); });
