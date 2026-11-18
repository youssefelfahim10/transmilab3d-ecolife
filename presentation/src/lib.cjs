// Utilitaires communs pour piloter le simulateur TransmiLab 3D en mode "prise de vue"
const { chromium } = require('playwright');
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'];

async function open({ w = 1920, h = 1080, dsf = 1, theme = 'dark', hero = false, hud = false } = {}) {
  const browser = await chromium.launch({ args: ARGS });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript((t) => { try { localStorage.setItem('tl3d_tour_v2', '1'); localStorage.setItem('tl3d_theme', t); } catch (e) {} }, theme);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto('http://localhost:8765/index.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 90000 });
  if (hero) {
    // plein cadre : on retire barre, panneaux ; HUD au choix
    await page.addStyleTag({ content: `#topbar,#left,#right{display:none!important} #app{grid-template-columns:1fr!important;height:100vh!important;display:block!important} #viewport{height:100vh!important}
      ${hud ? '' : '#hudTop,#hudBottom{display:none!important}'} #labelLayer{${hud ? '' : 'display:none'}}` });
    await page.waitForTimeout(600);
  }
  return { browser, page };
}
const frame = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
async function cam(page, pos, target) {
  await page.evaluate(([p, t]) => { const a = __app; a.tween = null; a.camera.position.set(...p); a.controls.target.set(...t); a.controls.update(); }, [pos, target]);
}
async function advance(page, sec, step = 0.02) {
  await page.evaluate(([s, st]) => { const sim = __app.module.sim; let t = 0; while (t < s) { sim.update(st); t += st; } }, [sec, step]);
}
async function freeze(page) { await page.evaluate(() => { __app.module.sim.timeScale = 0; }); }
async function snap(page, path, sel = '#viewport') {
  await frame(page); await page.waitForTimeout(250); await frame(page);
  const b = await page.evaluate((q) => { const r = document.querySelector(q).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, sel);
  await page.screenshot({ path, clip: b, timeout: 180000, animations: 'allow' });
  console.log('ok', path);
}
module.exports = { open, frame, cam, advance, freeze, snap };
