// Recherche de nombres de dents (multiples de 3 pour l'assemblage à 3 satellites) donnant les rapports d'une boîte 6 rapports de type Lepelletier
const T = [4.171, 2.340, 1.521, 1.143, 0.867, 0.691], TR = -3.403;
function ratios(p) {
  const { Zs1, Zr1, Z3, Z4, ZR } = p, k = Zr1 / (Zr1 + Zs1), f = 1 / k;
  const r = [f * ZR / Z4, f * ZR * (Z3 + Z4) / (Z4 * (Z3 + ZR)), f, 1 / (1 - (Z4 / ZR) * (1 - k)), 1 / (1 + (Z3 / ZR) * (1 - k)), ZR / (Z3 + ZR)];
  return { r, R: -ZR / (Z3 * k) };
}
let best = [];
for (let Zs1 = 30; Zs1 <= 60; Zs1 += 3) for (let Zr1 = 66; Zr1 <= 120; Zr1 += 3) {
  if ((Zr1 - Zs1) % 2) continue;
  for (let ZR = 72; ZR <= 108; ZR += 3) for (let Z3 = 30; Z3 <= 54; Z3 += 3) {
    if ((ZR - Z3) % 2) continue;
    for (let Z4 = 24; Z4 <= 42; Z4 += 3) {
      const { r, R } = ratios({ Zs1, Zr1, Z3, Z4, ZR });
      let e = 0; r.forEach((x, i) => { e = Math.max(e, Math.abs(x / T[i] - 1)); }); e = Math.max(e, Math.abs(R / TR - 1));
      // géométrie du Ravigneaux : planètes longs (ZR-Z3)/2, courts : cherche Zps valide
      const Zpl = (ZR - Z3) / 2;
      for (let Zps = 14; Zps <= 34; Zps++) {
        const Rc = (Z3 + Zpl) / 2, Rs = (Z4 + Zps) / 2, d = (Zps + Zpl) / 2;
        if (d < Math.abs(Rc - Rs) + 1 || d > Rc + Rs - 1) continue;
        const cosd = (Rc * Rc + Rs * Rs - d * d) / (2 * Rc * Rs); const ang = Math.acos(cosd) * 180 / Math.PI;
        if (ang < 25 || ang > 70) continue;           // les 2 planètes d'une paire ne doivent pas se superposer avec les autres paires
        best.push({ e, Zs1, Zr1, Z3, Z4, ZR, Zpl, Zps, ang, Zp1: (Zr1 - Zs1) / 2 });
      }
    }
  }
}
best.sort((a, b) => a.e - b.e);
for (const b of best.slice(0, 8)) { const x = ratios(b); console.log(JSON.stringify(b), x.r.map((v) => v.toFixed(3)).join(' '), x.R.toFixed(3)); }
