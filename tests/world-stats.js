// Not a pass/fail test: 100 years of world, then the numbers worth watching when balancing.
const {openGame, runExams} = require('./lib');
(async () => {
  const {browser, page, errors} = await openGame();
  await page.evaluate(() => { window.D = 0; window.AY = 0; });
  for(let i = 0; i < 100; i++) await page.evaluate(() => { while(!S.finished) runFav(); AY += HUNTERS.filter(h => hActive(h) && !h.legacy).length; const d0 = HUNTERS.filter(h => h.status === 'Deceased').length; registerHunters(); document.getElementById('bNext').onclick(); D += HUNTERS.filter(h => h.status === 'Deceased').length - d0; });
  const r = await page.evaluate(() => { const act = HUNTERS.filter(h => hActive(h) && !h.legacy);
    return {active: act.length, stars: [0, 1, 2, 3].map(s => act.filter(h => hStars(h) === s).length), deathRate: (D / AY * 100).toFixed(2) + '% a year', nicknamed: (HUNTERS.filter(h => h.nick).length / HUNTERS.length * 100).toFixed(0) + '%', heirs: (WORLD.heirs || []).length}; });
  await browser.close(); console.log(r, errors.length ? errors : 'no errors');
})();
