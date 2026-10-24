// Every theme's own trial can be drawn and run to the end of an exam.
const assert = require('assert'), {openGame} = require('./lib');
(async () => {
  const {browser, page, errors} = await openGame();
  const r = await page.evaluate(() => { const out = {};
    for(const [th, id] of Object.entries(THEME_TRIAL)){ let N = null; for(let t = 0; t < 60 && !N; t++){ const n = newState(5, 600, 12, null, {theme: th}); if(n.phaseSpec.some(x => x.id === id)) N = n; }
      if(!N){ out[th] = 'never drawn'; continue; } while(!N.finished) runPhase(N); useLineup(N); out[th] = PHASES.find(x => x.id === id).name; }
    return out; });
  await browser.close();
  assert.deepStrictEqual(errors, []); Object.entries(r).forEach(([k, v]) => assert.notStrictEqual(v, 'never drawn', k));
  console.log('themed trials:', Object.values(r).join(', '));
})().catch(e => { console.error(e.message); process.exit(1); });
