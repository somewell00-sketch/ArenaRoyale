// Plays 25 exams through the real buttons and draws every screen on the way; any page error fails the test.
const assert = require('assert'), {openGame} = require('./lib');
(async () => {
  const {browser, page, errors} = await openGame({fast: false});
  await page.evaluate(() => { for(let i = 0; i < 25; i++){ document.getElementById('bAll').click(); PHASES.forEach((ph, j) => { selPhase = j; render(); showTab('phase'); }); ['log', 'results', 'alliances', 'hunters', 'world', 'history'].forEach(t => showTab(t)); document.getElementById('bNext').onclick(); } });
  await browser.close();
  assert.deepStrictEqual(errors, [], 'page errors: ' + errors.join(' | '));
  console.log('smoke: 25 exams, no errors');
})().catch(e => { console.error(e.message); process.exit(1); });
