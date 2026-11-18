// Test de fumée d'un module : charge l'app, sélectionne le module, déroule TOUT le parcours guidé, relève les erreurs JS.
// Usage : NODE_PATH=$(npm root -g) node smoke_test.cjs http://localhost:8765/index.html <id_module> [captures_dir]
// (Playwright + Chromium préinstallés ; rendu logiciel LENT → clics via evaluate, pas de locator.click sous charge)
const { chromium } = require('playwright');
(async () => {
  const [url, id, out] = [process.argv[2], process.argv[3], process.argv[4]];
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.addInitScript(() => { try { localStorage.setItem('tl3d_tour_v2', '1'); } catch (e) {} });
  await p.goto(url); await p.waitForTimeout(1500);
  await p.evaluate((id) => document.querySelector(`[data-module="${id}"]`).click(), id); await p.waitForTimeout(2500);
  const n = await p.evaluate(() => { const b = document.querySelector('#btnLesson'); if (!b || b.classList.contains('hidden')) return 0; b.click(); return +document.querySelector('#lsStep').textContent.split('/')[1]; });
  console.log('étapes du parcours :', n);
  for (let i = 0; i < n; i++) {
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => ({ t: document.querySelector('#lsTitle').textContent, live: document.querySelector('#lsLive').textContent.replace(/\s+/g, ' ').slice(0, 90) }));
    console.log(i + 1, r.t, '|', r.live);
    if (out && (i === 0 || i === n - 1)) await p.screenshot({ path: `${out}/smoke_${id}_${i + 1}.png` });
    if (i < n - 1) await p.evaluate(() => document.querySelector('#lsNext').click());
  }
  console.log('ERREURS :', JSON.stringify(errs.slice(0, 8))); await b.close(); process.exit(errs.length ? 1 : 0);
})();
