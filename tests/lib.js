// Shared helpers: open the game in headless Chromium, with a clean save, and collect page errors.
const path = require('path');
const {chromium} = require('playwright');
const URL = process.env.GAME_URL || 'file://' + path.join(__dirname, '..', 'index.html');
// SEED fixes Math.random inside the page (tests only), so the same world comes out on every run; SEED=0 keeps it random
const SEED = process.env.SEED === undefined ? 1 : +process.env.SEED;
async function openGame({fast = true, width = 1200, height = 900, seed = SEED} = {}){
  const browser = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {}), page = await browser.newPage({viewport: {width, height}}), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  if(seed) await page.addInitScript(s => { let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await page.goto(URL); await page.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('hxsim'); }); await page.reload(); await page.waitForTimeout(500);
  // fast mode: no saving and no drawing while many exams run back to back
  if(fast) await page.evaluate(() => { window.__render = render; save = () => {}; MT_AUTO = true; render = () => {}; renderPhase = () => {}; showTab = () => {}; });
  return {browser, page, errors};
}
// run n exams (and the years between them)
const runExams = (page, n) => page.evaluate(n => { for(let i = 0; i < n; i++){ try{ legendParents(S); }catch(e){} while(!S.finished) runFav(); registerHunters(); document.getElementById('bNext').onclick(); } }, n);
module.exports = {openGame, runExams, URL, SEED};
