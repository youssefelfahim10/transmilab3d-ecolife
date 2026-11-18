// Images du Module 2 (boîte automatique 6 rapports) pour la présentation — captures du VRAI simulateur
const fs = require('fs');
const { open, freeze, frame, advance } = require('./lib.cjs');
const OUT = __dirname + '/img/';
fs.mkdirSync(OUT, { recursive: true });
process.on('unhandledRejection', (e) => { console.log('UNHANDLED', e && e.message); process.exit(1); });

async function grabVp(page, path) {
  await frame(page); await page.waitForTimeout(300); await frame(page);
  const b = await page.evaluate(() => { const r = document.querySelector('#viewport').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  await page.screenshot({ path, clip: b, timeout: 240000, animations: 'allow' });
  console.log('ok', path);
}
async function grabEl(page, sel, path, pad = 6) {
  const b = await page.evaluate(([q, p]) => { const r = document.querySelector(q).getBoundingClientRect(); return { x: Math.max(0, r.x - p), y: Math.max(0, r.y - p), width: r.width + 2 * p, height: r.height + 2 * p }; }, [sel, pad]);
  await page.screenshot({ path, clip: b, timeout: 120000 });
  console.log('ok', path);
}

(async () => {
  // ---------- rendus 3D plein cadre ----------
  let { browser, page } = await open({ w: 1600, h: 900, hero: true });
  await page.evaluate(() => { __app.setModule('bva'); const a = __app, s = a.module.sim; a.opts.labelMode = 'off'; s.forceGear(3, 2800); s.timeScale = 0; a.opts.housingOpacity = 0.14; });
  await advance(page, 0.6);
  await page.evaluate(() => { __app.tween = null; __app.flyToView('global', true); });
  await grabVp(page, OUT + 'hero_bva_cut.png');
  await page.evaluate(() => { __app.tween = null; __app.flyToView('conv', true); });
  await grabVp(page, OUT + 'hero_bva_conv.png');
  await page.evaluate(() => { __app.tween = null; __app.flyToView('trains', true); });
  await grabVp(page, OUT + 'hero_bva_trains.png');
  // 3ème sous pression, puis cas A : l'embrayage B patine (rouge)
  await page.evaluate(() => { const a = __app, s = a.module.sim; s.faults = { health: { b: 0.28 } }; s.forceGear(3, 3000); a.alerts = new Set(['emb-b']); a.opts.xray = false; });
  await advance(page, 1.2);
  await page.evaluate(() => { __app.tween = null; __app.flyToView('emb', true); });
  await grabVp(page, OUT + 'hero_bva_slip.png');
  // sans coupe : boîte entière, vue extérieure avec vue éclatée partielle
  await page.evaluate(() => { const a = __app; a.alerts = new Set(); a.module.sim.faults = {}; a.module.sim.forceGear(4, 2600); a.section.setEnabled(false); document.querySelector('#secOn').checked = false; a.module.setExplode(0.55); a.opts.housingOpacity = 0.05; });
  await page.evaluate(() => { __app.tween = null; const a = __app; a.camera.position.set(60, 46, 120); a.controls.target.set(6, 0, 0); a.controls.update(); });
  await grabVp(page, OUT + 'hero_bva_explode.png');
  await browser.close();

  // ---------- interface (panneaux) ----------
  ({ browser, page } = await open({ w: 1440, h: 900 }));
  await page.evaluate(() => { const r = __app.renderer; __app.setModule('bva'); __app.module.sim.forceGear(3, 2600); __app.module.sim.timeScale = 0; document.querySelector('#secOn').click(); r.render = () => {}; });
  await page.waitForTimeout(800);
  await grabEl(page, '#secShift', OUT + 'ui_bva_shift.png');
  await grabEl(page, '#bvaTable', OUT + 'ui_bva_table.png', 8);
  await page.click('#tabDiag'); await page.click('[data-sc="A"]');
  await page.click('#btnDemo');
  const n = (await page.$$('[data-obs]')).length;
  await page.click('[data-obs="0"]');
  await page.waitForTimeout(400);
  await grabEl(page, '#right', OUT + 'ui_bva_scan.png', 0);
  await page.evaluate(() => { __app.ui.selectScenario(null); __app.ui.selectScenario('B'); });
  await page.click('#btnDemo'); await page.click('[data-obs="1"]');
  await page.waitForTimeout(400);
  await grabEl(page, '#right', OUT + 'ui_bva_scanB.png', 0);
  await page.click('#tabTools');
  await page.waitForTimeout(300);
  await grabEl(page, '#flowBar', OUT + 'ui_bva_flow.png', 4);
  console.log('obs', n);
  await browser.close();
})().catch((e) => { console.log('ERR', e.message.slice(0, 300)); process.exit(1); });
