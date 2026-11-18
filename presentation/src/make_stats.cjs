// Chiffres réels pris dans le simulateur (nombre de pièces, étapes) + tableau des rapports calculé avec les dents réelles
const fs = require('fs');
const { open } = require('./lib.cjs');
(async () => {
  const { browser, page } = await open({ w: 800, h: 600 });
  const s = await page.evaluate(() => ({ parts: Object.keys(__app.modules.bvm.parts).length, steps: __app.modules.bvm.explodePlan.length, groups: __app.modules.bvm.groups.length }));
  await browser.close();
  const Z = { 1: [11, 41], 2: [19, 39], 3: [28, 37], 4: [37, 36], 5: [40, 31] }, R = 0.317, IP = 62 / 15;
  const name = { 1: '1ère', 2: '2ème', 3: '3ème', 4: '4ème', 5: '5ème' };
  const fr = (x, d = 3) => x.toFixed(d).replace('.', ',');
  const kmh = (i) => (3000 / (i * IP)) * 2 * Math.PI * R * 0.06;
  const gears = Object.keys(Z).map((k) => { const i = Z[k][1] / Z[k][0]; return { name: name[k], zp: Z[k][0], zs: Z[k][1], i, iTxt: fr(i), kmhNum: kmh(i), kmh: fr(kmh(i), 0) }; });
  const ir = 44 / 12;
  gears.push({ name: 'AR', zp: 12, zs: 44, i: ir, iTxt: fr(ir), kmhNum: -kmh(ir), kmh: '−' + fr(kmh(ir), 0) });
  fs.writeFileSync('stats.json', JSON.stringify({ ...s, gears }, null, 1));
  console.log(JSON.stringify({ ...s, gears: gears.map((g) => `${g.name} ${g.iTxt} ${g.kmh}`) }));
})();
