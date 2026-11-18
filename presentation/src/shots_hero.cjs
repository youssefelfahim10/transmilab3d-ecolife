const fs = require('fs');
const { open, cam, advance, freeze, snap, frame } = require('./lib.cjs');
const OUT = __dirname + '/img/';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  // ---------- rendus plein cadre sans interface ----------
  let { browser, page } = await open({ hero: true });
  await freeze(page);
  await page.evaluate(() => { const a = __app; a.opts.labelMode = 'off'; a.module.sim.forceGear(3, 3000); });
  await advance(page, 0.5);
  await cam(page, [30, 34, 80], [9, 0, 2]);
  await snap(page, OUT + 'hero_box.png');
  await cam(page, [36, 20, 62], [11, -2, 2]);
  await snap(page, OUT + 'hero_box2.png');

  // coupe axiale
  await page.evaluate(() => { __app.ui.axialCut(); });
  await cam(page, [26, 14, 22], [15, -3, 0]);
  await snap(page, OUT + 'hero_cut.png');
  await page.evaluate(() => { __app.section.setEnabled(false); __app.opts.lub = true; __app.module.oil.on = true; __app.ui.axialCut(); });
  await cam(page, [20, 6, 22], [14, -3, 0]);
  await advance(page, 1.5);
  await snap(page, OUT + 'hero_oil.png');
  await page.evaluate(() => { __app.section.setEnabled(false); __app.opts.lub = false; __app.module.oil.on = false; });

  // engrènement hélicoïdal gros plan (1ère)
  await page.evaluate(() => { const a = __app; a.module.sim.forceGear(1, 2500); a.opts.housingOpacity = 0.03; });
  await cam(page, [13, 5, 16], [6.8, -3.0, 0]);
  await advance(page, 0.5);
  await snap(page, OUT + 'hero_gears.png');
  await page.evaluate(() => { __app.opts.housingOpacity = 0.22; });

  // vue éclatée 45 %
  await page.evaluate(() => { __app.module.sim.forceGear(3, 2000); __app.module.setExplode(0.45); });
  await cam(page, [40, 30, 95], [14, -2, 0]);
  await snap(page, OUT + 'hero_explode.png');
  await page.evaluate(() => { __app.module.setExplode(0.18); });
  await cam(page, [34, 26, 75], [12, -2, 0]);
  await snap(page, OUT + 'hero_explode_a.png');
  await page.evaluate(() => { __app.module.setExplode(0); });

  // synchro isolé + écarté
  await page.evaluate(() => { const a = __app; a.opts.labelMode = 'main'; a.module.sim.forceGear('N', 800); a.ui.isolateGroup('sync12'); });
  await page.evaluate(() => { document.querySelector('#labelLayer').style.display = ''; });
  await page.evaluate(() => { import('./js/groups.js').then((m) => { const g = __app.activeGroup; m.applySpread(__app.module, g, 1); }); });
  await page.waitForTimeout(500);
  await cam(page, [15, 12, 22], [8, 0, 0]);
  await snap(page, OUT + 'hero_sync_spread.png');
  await page.evaluate(() => { import('./js/groups.js').then((m) => m.applySpread(__app.module, __app.activeGroup, 0.0)); });
  await page.waitForTimeout(300);
  await cam(page, [14, 8, 17], [8, -1.5, 0]);
  await snap(page, OUT + 'hero_sync_iso.png');
  await page.evaluate(() => { __app.ui.clearIsolation(); document.querySelector('#labelLayer').style.display = 'none'; });

  // Panne C : seul le primaire tourne (point mort pédale relâchée) — rotation surlignée
  await page.evaluate(() => { const a = __app; a.opts.rotHL = true; a.module.sim.faults = { wornPrimBearing: true }; a.module.sim.forceGear('N', 1500); a.alerts = new Set(['rlt-prim-av']); });
  await advance(page, 1.0);
  await cam(page, [30, 30, 74], [9, 0, 2]);
  await snap(page, OUT + 'hero_rot.png');
  await page.evaluate(() => { __app.opts.rotHL = false; __app.alerts = new Set(); });

  // pont / différentiel
  await page.evaluate(() => { __app.module.sim.faults = {}; __app.module.sim.forceGear(3, 2500); __app.module.sim.turn = 0.6; });
  await advance(page, 0.5);
  await page.evaluate(() => { __app.flyToView('diff', true); });
  await frame(page);
  await snap(page, OUT + 'hero_diff.png');
  await browser.close();

  // ---------- module 2 et 3 ----------
  ({ browser, page } = await open({ hero: true }));
  await freeze(page);
  await page.evaluate(() => { __app.setModule('bva'); __app.opts.labelMode = 'off'; __app.module.sim.engineRpm = 2200; __app.module.sim.requestGear(2); });
  await advance(page, 3.0);
  await page.evaluate(() => { __app.ui.axialCut(); });
  await cam(page, [20, 26, 52], [-1, 0, 0]);
  await snap(page, OUT + 'hero_bva.png');
  await page.evaluate(() => { __app.section.setEnabled(false); __app.setModule('dct'); __app.opts.labelMode = 'off'; __app.module.sim.engineRpm = 2500; __app.module.sim.requestGear(1); });
  await advance(page, 3.0);
  await page.evaluate(() => { __app.module.sim.requestGear(2); });
  await advance(page, 1.2);
  await cam(page, [26, 30, 62], [11, 0, 0]);
  await snap(page, OUT + 'hero_dct.png');
  await browser.close();
})();
