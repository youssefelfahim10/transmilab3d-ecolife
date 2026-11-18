// Séquences animées image par image (déterministes) -> frames JPG -> mp4 (ffmpeg)
const fs = require('fs');
const { execSync } = require('child_process');
const { open, cam, freeze, frame } = require('./lib.cjs');
const ROOT = __dirname + '/vid/';
fs.mkdirSync(ROOT, { recursive: true });
process.on('unhandledRejection', (e) => { console.log('UNHANDLED', e && e.message); process.exit(1); });

async function ondemand(page) {
  await page.evaluate(() => { const r = __app.renderer, orig = r.render.bind(r); window.__want = true; r.render = (a, b) => { if (window.__want) orig(a, b); }; });
}
async function grab(page, dir, i) {
  await page.evaluate(() => { window.__want = true; });
  await frame(page);
  await page.evaluate(() => { window.__want = false; });
  const b = await page.evaluate(() => { const r = document.querySelector('#viewport').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 88, clip: b, timeout: 180000 });
}
function encode(dir, out, fps) {
  execSync(`ffmpeg -y -loglevel error -framerate ${fps} -i ${dir}/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${out}`);
  console.log('mp4', out);
}

(async () => {
  const which = process.argv[2] || 'all';
  // ---------------- 1. orbite autour de la boîte ----------------
  if (which === 'all' || which === 'orbit') {
    const { browser, page } = await open({ w: 1280, h: 720, hero: true });
    await freeze(page); await ondemand(page);
    await page.evaluate(() => { const a = __app; a.opts.labelMode = 'off'; a.module.sim.forceGear(3, 3600); });
    const dir = ROOT + 'orbit'; fs.mkdirSync(dir, { recursive: true });
    const N = 60, r = 74, cx = 10, cz = 2;
    for (let i = 0; i < N; i++) {
      const th = ((-40 + (i / (N - 1)) * 85) * Math.PI) / 180;
      const y = 26 + 8 * Math.sin((i / N) * Math.PI);
      await page.evaluate(([x, yy, z]) => { const s = __app.module.sim; for (let k = 0; k < 3; k++) s.update(0.03); }, [0, 0, 0]);
      await cam(page, [cx + r * Math.sin(th), y, cz + r * Math.cos(th)], [9, 0, 2]);
      await grab(page, dir, i);
    }
    encode(dir, ROOT + 'orbit.mp4', 15);
    await browser.close();
  }
  // ---------------- 2. passage de vitesse (3 phases) en loupe ----------------
  if (which === 'all' || which === 'shift') {
    const { browser, page } = await open({ w: 1280, h: 720, hero: true, hud: true });
    await freeze(page); await ondemand(page);
    await page.evaluate(() => {
      const a = __app, s = a.module.sim; s.reset(); s.oilT = 85; s.forceGear(1, 2800); a.opts.labelMode = 'main';
      a.loupe(12); s.timeScale = 0; a.tween = null; a.flyTo(a.module.views().loupe[12], true); document.querySelector('#toast').classList.remove('on'); s.requestGear(2);
    });
    const dir = ROOT + 'shift'; fs.mkdirSync(dir, { recursive: true });
    let i = 0, guard = 0;
    while (guard++ < 400) {
      const done = await page.evaluate(() => { const s = __app.module.sim; s.update(0.05); return !s.shift; });
      await grab(page, dir, i++);
      if (done && i > 20) break;
    }
    for (let k = 0; k < 8; k++) { await page.evaluate(() => __app.module.sim.update(0.05)); await grab(page, dir, i++); }
    encode(dir, ROOT + 'shift.mp4', 18);
    await browser.close();
  }
  // ---------------- 3. panne A : craquement à froid ----------------
  if (which === 'all' || which === 'crunch') {
    const { browser, page } = await open({ w: 1280, h: 720, hero: true, hud: true });
    await freeze(page); await ondemand(page);
    await page.evaluate(() => {
      const a = __app, s = a.module.sim; s.reset(); s.faults = { wornCone: { gear: 2, mu: 0.5 } }; s.oilT = 20; s.forceGear(3, 3000); a.opts.labelMode = 'main';
      a.alerts = new Set(['bague-2']); a.loupe(12); s.timeScale = 0; a.tween = null; a.flyTo(a.module.views().loupe[12], true); document.querySelector('#toast').classList.remove('on'); s.requestGear(2);
    });
    const dir = ROOT + 'crunch'; fs.mkdirSync(dir, { recursive: true });
    let i = 0, guard = 0, flashed = false, fl = 0;
    while (guard++ < 500) {
      const st = await page.evaluate(() => { const s = __app.module.sim; s.update(0.06); return { done: !s.shift, sub: s.shift && s.shift.sub }; });
      if (st.sub === 'crunch' && !flashed) { flashed = true; fl = 6; await page.evaluate(() => { const f = document.querySelector('#flash'); f.textContent = 'CRAC !'; f.classList.add('on'); }); }
      if (fl > 0 && --fl === 0) await page.evaluate(() => document.querySelector('#flash').classList.remove('on'));
      await grab(page, dir, i++);
      if (st.done && i > 20) break;
    }
    for (let k = 0; k < 8; k++) { await page.evaluate(() => __app.module.sim.update(0.06)); await grab(page, dir, i++); }
    encode(dir, ROOT + 'crunch.mp4', 16);
    await browser.close();
  }
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
