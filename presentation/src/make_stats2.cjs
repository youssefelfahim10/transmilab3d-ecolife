// Chiffres réels pris dans le simulateur : pièces des 3 modules, étapes d'éclaté du Module 1, rapports (BVM et BVA)
const fs = require('fs');
const { open } = require('./lib.cjs');
(async () => {
  const { browser, page } = await open({ w: 800, h: 600 });
  const s = await page.evaluate(async () => {
    const bvm = __app.modules.bvm, bva = __app.makeModule('bva'), dct = __app.makeModule('dct');
    const { IRATIO } = await import('/js/bvaSim.js');
    return { partsBvm: Object.keys(bvm.parts).length, partsBva: Object.keys(bva.parts).length, partsDct: Object.keys(dct.parts).length, steps: bvm.explodePlan.length, groups: bvm.groups.length, bva: IRATIO };
  });
  await browser.close();
  const old = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  const out = { ...old, parts: s.partsBvm + s.partsBva + s.partsDct, partsBvm: s.partsBvm, partsBva: s.partsBva, partsDct: s.partsDct, steps: s.steps, groups: s.groups, bva: s.bva };
  fs.writeFileSync('stats.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ parts: out.parts, bvm: out.partsBvm, bva: out.partsBva, dct: out.partsDct, steps: out.steps }));
})();
