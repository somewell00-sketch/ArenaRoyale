// 200 years of world: every family tie shown on one Hunter's profile is shown, the other way round, on the relative's.
const assert = require('assert'), {openGame, runExams} = require('./lib');
(async () => {
  const {browser, page, errors} = await openGame();
  for(let i = 0; i < 20; i++) await runExams(page, 10);
  const r = await page.evaluate(() => {
    const cls = r => /grand(father|mother|parent)/.test(r) ? 'GP' : /father|mother|^parent/.test(r) ? 'P' : /uncle|aunt|parent's/.test(r) ? 'U' : /brother|sister|sibling/.test(r) ? 'S' : /grand(son|daughter|child)/.test(r) ? 'GC' : /son|daughter|child/.test(r) ? 'C' : '?';
    const inv = {P: 'C', C: 'P', GP: 'GC', GC: 'GP', S: 'S'};
    let rel = 0, miss = []; HUNTERS.forEach(h => lineage(h.license, h.cid).forEach(x => { const c = cls(x.rel); if(!x.h || !inv[c]) return; rel++;
      if(!lineage(x.h.license, x.h.cid).some(y => y.h && y.h.license === h.license && cls(y.rel) === inv[c])) miss.push(`${h.name} → ${x.rel} ${x.h.name}`); }));
    let kidMissing = 0; (WORLD.heirs || []).forEach(k => k.parents.forEach(l => { const p = hLic(l); if(p && !lineage(l, p.cid).some(x => x.k === k || (x.h && k.cid && x.h.cid === k.cid))) kidMissing++; }));
    return {rel, miss, kidMissing};
  });
  await browser.close();
  assert.deepStrictEqual(errors, []); assert.strictEqual(r.miss.length, 0, r.miss.slice(0, 5).join('; ')); assert.strictEqual(r.kidMissing, 0);
  console.log(`family: ${r.rel} ties checked both ways`);
})().catch(e => { console.error(e.message); process.exit(1); });
