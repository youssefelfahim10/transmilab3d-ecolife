const { open, cam, advance, freeze, snap, frame } = require('./lib.cjs');
const OUT = __dirname + '/img/';
process.on('unhandledRejection', (e) => { console.log('UNHANDLED', e && e.message); process.exit(1); });
const noRender = (page) => page.evaluate(() => { __app.renderer.render = () => {}; });

(async () => {
  // ---- panneaux (rendu 3D coupé : seule l'interface HTML change) ----
  let { browser, page } = await open({ w: 1440, h: 900 });
  await freeze(page);
  await page.evaluate(() => { const a = __app; a.module.sim.forceGear(3, 2500); a.flyToView('global', true); });
  await frame(page); await noRender(page);
  await page.evaluate(() => { const ui = __app.ui; ui.showTab('diag'); ui.selectScenario('A'); ui.runDemo(); __app.module.sim.timeScale = 0; });
  await page.evaluate(() => { const ui = __app.ui; ui.diag.view = 2; ui.diag.hyp = 0; ui.renderDiag(); });
  await snap(page, OUT + 'ui_diag3.png', '#right');
  await page.evaluate(() => { const ui = __app.ui; ui.diag.view = 3; ui.measure('bague-1'); ui.measure('cale-12'); ui.measure('bague-2'); ui.renderDiag(); });
  await snap(page, OUT + 'ui_diag4.png', '#right');
  await page.evaluate(() => { const ui = __app.ui; ui.onPick('bague-2'); ui.diag.view = 5; ui.renderDiag(); });
  await snap(page, OUT + 'ui_diag6.png', '#right');
  await page.evaluate(() => { const ui = __app.ui; __app.selected = 'bague-2'; ui.measure('bague-2'); ui.showTab('part'); ui.renderPart('bague-2'); });
  await snap(page, OUT + 'ui_fiche.png', '#right');
  await browser.close();

  // ---- thème clair (une seule image complète) ----
  ({ browser, page } = await open({ w: 1600, h: 900, theme: 'light' }));
  await freeze(page);
  await page.evaluate(() => { const a = __app; a.module.sim.forceGear(3, 2500); a.opts.labelMode = 'main'; a.flyToView('global', true); });
  await advance(page, 0.4);
  await snap(page, OUT + 'ui_light.png', 'body');
  await browser.close();

  // ---- 3 phases (loupe synchro 1/2) ----
  ({ browser, page } = await open({ w: 1280, h: 720, hero: true, hud: true }));
  await freeze(page);
  await page.evaluate(() => {
    const a = __app, s = a.module.sim;
    s.reset(); s.oilT = 85; s.forceGear(1, 2800); a.opts.labelMode = 'main';
    a.loupe(12); s.timeScale = 0; a.flyTo(a.module.views().loupe[12], true);
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => { __app.module.sim.requestGear(2); });
  const stepTo = (cond) => page.evaluate((c) => { const s = __app.module.sim; let n = 0; const f = new Function('s', 'return ' + c); while (!f(s) && n < 3000) { s.update(0.02); n++; } return n; }, cond);
  await stepTo("s.shift && s.shift.sub==='declutch' && s.clutch<0.45");
  await snap(page, OUT + 'ph1.png');
  await stepTo("s.shift && s.shift.sub==='friction' && s.shift.tf>0.1");
  await snap(page, OUT + 'ph2.png');
  await stepTo("s.shift && s.shift.sub==='engage' && Math.abs(s.slide[12])>0.5");
  await snap(page, OUT + 'ph3.png');

  // ---- Panne A ----
  await page.evaluate(() => {
    const s = __app.module.sim; s.reset(); s.faults = { wornCone: { gear: 2, mu: 0.5 } }; s.oilT = 20; s.forceGear(3, 3000); s.timeScale = 0;
    __app.alerts = new Set(['bague-2']); __app.flyTo(__app.module.views().loupe[12], true); s.requestGear(2);
  });
  await stepTo("s.shift && s.shift.sub==='crunch' && s.sync[12].shake>0");
  await page.evaluate(() => { const f = document.querySelector('#flash'); f.textContent = 'CRAC !'; f.classList.add('on'); });
  await snap(page, OUT + 'pa_crunch.png');
  await page.evaluate(() => document.querySelector('#flash').classList.remove('on'));

  // ---- Panne B ----
  await page.evaluate(() => {
    const a = __app, s = a.module.sim; s.reset(); s.faults = { wornDog: 3 }; s.oilT = 80; s.forceGear(3, 2500); s.load = 'decel'; s.timeScale = 0;
    a.alerts = new Set(['baladeur-34', 's-3']); a.loupe(34); s.timeScale = 0; a.flyTo(a.module.views().loupe[34], true);
  });
  await stepTo("s.pop && s.pop.t>0.1");
  await page.evaluate(() => { const f = document.querySelector('#flash'); f.textContent = 'SAUTE !'; f.classList.add('on'); });
  await snap(page, OUT + 'pb_jump.png');
  await browser.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
