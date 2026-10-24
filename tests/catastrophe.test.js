// A forced catastrophe ends the exam, licenses its heroes, and the next exam opens remembering it.
const assert = require('assert'), {openGame} = require('./lib');
(async () => {
  const {browser, page, errors} = await openGame({fast: false});
  const r = await page.evaluate(() => { document.getElementById('bCat').click(); document.getElementById('bAll').click();
    const C = S.cat, heroes = S.candidates.filter(c => c.status === 'Approved').length; selPhase = C.p; render(); showTab('phase');
    const page = !!document.querySelector('.cat-ban'); document.getElementById('bNext').onclick();
    return {stage: C.stage, heroes, ids: C.heroes.length, page, memory: S.log.some(e => /A year after/.test(e.text))}; });
  await browser.close();
  assert.deepStrictEqual(errors, []); assert.strictEqual(r.stage, 'done'); assert.strictEqual(r.heroes, r.ids); assert.ok(r.page); assert.ok(r.memory);
  console.log(`catastrophe: ${r.heroes} licensed, page drawn, remembered next year`);
})().catch(e => { console.error(e.message); process.exit(1); });
