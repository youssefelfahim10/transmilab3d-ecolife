/* ============================================================================
 * module2Eco.js — MODULE 2 : ZF EcoLife 2 (6 AP xx20 B) — modèle 3D
 *  Disposition inspirée de la coupe ZF (fig. 7) : amortisseur + convertisseur à pontage WK · pompe · ralentisseur primaire ·
 *  trains 3, 1, 2 avec embrayages A-B emboîtés et freins D-E-F · sortie · bloc hydraulique (8 régulateurs) sous la mécanique · échangeur.
 *  Cinématique : ecoSim.js (liaisons reconstituées pour retrouver exactement les rapports ZF).
 *  Schéma fonctionnel : implantation axiale simplifiée, pas à l'échelle.
 * ========================================================================== */
import * as THREE from 'three';
import { BaseModule, discStack, setStack } from './moduleBase.js';
import * as G from './gearsBuilder.js';
import { meshPhase, TAU } from './layout.js';
import { SSP } from './materials.js';
import { EcoSim, PGS, TABLE, EL } from './ecoSim.js';
import { groupsEco } from './groups.js';
import './ecoParts.js';

export { EcoSim, TABLE as BVA_TABLE };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pr = (z, m) => (z * m) / 2;
const wrap = (a) => ((a % TAU) + TAU) % TAU;

/* ---- implantation axiale (1 unité = 10 mm) ---- */
const XF = 1.2, XC = 10.0, RC = 10.2, RHO = 4.2, TH = 0.4;                // convertisseur
const XR = 21.0, RCR = 9.6, RHOR = 2.8;                                    // ralentisseur
const X3 = 28.0, X1 = 40.2, X2 = 46.6;                                     // centres des trains 3, 1, 2
const XAB = 34.6;                                                          // embrayages A / B emboîtés
const XP = { d1: 25.4, d2: 30.6, e: 37.8, f1: 44.0, f2: 49.2, a: 32.3, b: 32.9 };
const P3 = PGS.p3, P1 = PGS.p1, P2 = PGS.p2;
const orbit = (p) => ((p.zs + p.zp) * p.m) / 2;

const halfTorus = (xc, rc, rho, th, side) => {
  const pts = [], n = 22;
  for (let i = 0; i <= n; i++) { const b = (Math.PI * i) / n; pts.push([xc + side * rho * Math.sin(b), rc + rho * Math.cos(b)]); }
  for (let i = n; i >= 0; i--) { const b = (Math.PI * i) / n; pts.push([xc + side * (rho - th) * Math.sin(b), rc + (rho - th) * Math.cos(b)]); }
  return G.latheX(pts, 72);
};
const fullTorus = (xc, rc, r) => { const pts = []; for (let i = 0; i < 28; i++) { const b = (TAU * i) / 28; pts.push([xc + r * Math.sin(b), rc + r * Math.cos(b)]); } return G.latheX(pts, 56); };
const bladeGeo = (rho, th, side, thick = 0.1) => {
  const rr = rho - th - 0.06, sh = new THREE.Shape(), n = 14;
  for (let i = 0; i <= n; i++) { const b = (Math.PI * i) / n; const x = side * rr * Math.sin(b), y = rr * Math.cos(b); i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -thick / 2); return g;
};
const ringMatrices = (n, r, x = 0, tiltDeg = 0, phase = 0) => {
  const out = [], m = new THREE.Matrix4(), q = new THREE.Matrix4(), t = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const a = phase + (i * TAU) / n; m.makeRotationX(a); t.makeTranslation(x, r, 0); q.makeRotationY((tiltDeg * Math.PI) / 180); out.push(m.clone().multiply(t).multiply(q)); }
  return out;
};
const washer = (rIn, rOut, x0, x1) => G.tubeX(rIn, rOut, x0, x1, 64);
const tube = (rIn, rOut, x0, x1) => G.tubeX(rIn, rOut, x0, x1, 72);
const orbitGroup = (part, r, angle, fn) => { const g = new THREE.Group(); g.position.set(0, r * Math.cos(angle), r * Math.sin(angle)); part.group.add(g); fn(g); };
const cyl = (r, h, ax = 'y') => { const g = new THREE.CylinderGeometry(r, r, h, 20); if (ax === 'z') g.rotateX(Math.PI / 2); if (ax === 'x') g.rotateZ(Math.PI / 2); return g; };

export class Module2 extends BaseModule {
  constructor() {
    super('bva', 'Module 2 · ZF EcoLife 2 (6 AP xx20 B)');
    this.sim = new EcoSim();
    this.gearList = ['R', 'N', 'D', 1, 2, 3, 4, 5, 6];
    this.groups = groupsEco();
    this.build();
    this.makePlan();
  }

  build() {
    const P = (id, x, y, z, label, o) => this.mk(id, x, y, z, label, o);

    /* ===================================================== CONVERTISSEUR + PONTAGE WK + AMORTISSEUR */
    const fl = P('cv-flasque', XF, 0, 0, ['Plateau d\'entrée + couronne de démarreur (11)', [0, 17.6, 0]]);
    fl.mesh(G.latheX([[-0.15, 3.0], [0.15, 3.0], [0.15, 14.6], [-0.15, 14.6]], 64), 'steel');
    fl.mesh(G.involuteGear({ Z: 140, pitchR: 14.9, width: 0.8, boreR: 14.4, web: false }), 'steel');
    const cap = P('cv-capot', 0, 0, 0, ['Capot de convertisseur (1)', [8, 17.0, 0]], { housing: true });
    cap.mesh(G.latheX([[2.4, 0], [2.4, 13.6], [3.4, 15.2], [14.2, 15.2], [14.2, 14.8], [3.6, 14.8], [3.0, 13.4], [3.0, 0]], 80), 'steel');
    const imp = P('cv-impulseur', 0, 0, 0, ['Roue-pompe du convertisseur', [13.0, 16.2, 0]]);
    imp.mesh(halfTorus(XC, RC, RHO, TH, +1), 'steel'); imp.mesh(tube(14.4, 14.8, XC, 14.2), 'steel');
    imp.mesh(G.latheX([[XC + 0.05, 6.0], [XC + 0.05, 5.6], [XC + 1.8, 5.2], [XC + 1.8, 4.0]], 60), 'steel');
    imp.mesh(tube(4.0, 5.2, XC + 1.8, 17.0), 'steel');
    imp.instanced(bladeGeo(RHO, TH, +1), ringMatrices(40, RC, XC, 28), 'steel');
    const tur = P('cv-turbine', 0, 0, 0, ['Turbine', [6.6, 16.2, 0]]);
    tur.mesh(halfTorus(XC, RC, RHO, TH, -1), 'steel');
    tur.mesh(G.latheX([[XC - 0.05, 6.0], [XC - 0.05, 5.6], [XC - 2.2, 2.4], [XC - 2.2, 1.9]], 60), 'steel');
    tur.mesh(tube(1.6, 2.4, 4.4, XC - 2.2), 'steel');
    tur.instanced(bladeGeo(RHO, TH, -1), ringMatrices(36, RC, XC, -28), 'steel');
    const sta = P('cv-reacteur', 0, 0, 0, ['Réacteur (stator)', [XC, 11.8, 0]]);
    sta.mesh(tube(5.55, 5.85, XC - 1.0, XC + 1.0), 'alu'); sta.mesh(tube(8.55, 8.85, XC - 1.0, XC + 1.0), 'alu');
    sta.mesh(G.latheX([[XC - 0.35, 3.7], [XC + 0.35, 3.7], [XC + 0.35, 5.6], [XC - 0.35, 5.6]], 48), 'alu');
    sta.mesh(tube(3.5, 3.7, XC - 1.2, XC + 1.2), 'alu');
    sta.instanced(new THREE.BoxGeometry(1.9, 2.8, 0.12), ringMatrices(20, 7.2, XC, 32), 'alu');
    const owc = P('cv-roue-libre', 0, 0, 0, ['Roue libre du réacteur', [XC, 5.4, 0]]);
    owc.mesh(tube(2.95, 3.2, XC - 1.2, XC + 1.2), 'chrome'); owc.mesh(tube(3.5, 3.6, XC - 1.2, XC + 1.2), 'chrome');
    owc.instanced(new THREE.BoxGeometry(1.7, 0.36, 0.22), ringMatrices(22, 3.35, XC, 25), 'brass');
    const wk = P('cv-wk', 4.0, 0, 0, ['Embrayage de pontage WK (30)', [0, 14.4, 0]]);
    wk.mesh(tube(2.4, 13.2, -0.25, 0.25), 'steel'); wk.mesh(tube(11.2, 13.2, -0.5, -0.25), 'friction'); wk.mesh(G.sealGeo(2.4, 2.9, 0.4), 'rubber');
    const dp = P('cv-amortisseur', 4.9, 0, 0, ['Amortisseur de torsion (10)', [0, 10.8, 0]]);
    dp.mesh(tube(2.4, 9.0, -0.15, 0.15), 'steel'); dp.mesh(tube(9.2, 9.5, -0.15, 0.15), 'steel');
    dp.instanced(cyl(0.45, 2.6, 'z'), ringMatrices(8, 8.2, 0, 0, 0.2), 'brass');

    /* ===================================================== POMPE (2) */
    const pc = P('pompe-corps', 15.0, 0, 0, ['Pompe hydraulique (2)', [0, 11.8, 0]]);
    pc.mesh(tube(10.3, 11.3, -1.2, 1.2), 'alu'); pc.mesh(tube(5.4, 11.3, 1.2, 1.7), 'alu'); pc.mesh(tube(5.4, 11.3, -1.7, -1.2), 'alu');
    const cres = new THREE.BoxGeometry(2.2, 1.4, 3.0); cres.translate(0, -8.4, 0); pc.mesh(cres, 'alu');
    P('pompe-rotor-int', 15.0, 0, 0, ['Pompe — pignon intérieur', [0, 7.4, 0]]).mesh(G.involuteGear({ Z: 24, pitchR: 6.4, width: 2.2, boreR: 5.25, web: false }), 'steel');
    P('pompe-rotor-ext', 15.0, 0.8, 0, null).mesh(G.splineRing({ Z: 30, rBase: 8.67, rTip: 7.47, width: 2.2, plainR: 9.4, hTip: 0.2, hBase: 0.28 }), 'steel');

    /* ===================================================== ARBRES */
    const ae = P('arbre-entree', 0, 0, 0, ['Arbre de turbine (entrée de boîte)', [20, 3.4, 0]]);
    ae.mesh(G.cylX(1.6, 4.4, 36.0, 32), 'steel');
    ae.mesh(washer(1.6, 8.5, 32.0, 32.3), 'steel'); ae.mesh(tube(8.3, 8.5, 32.3, 36.0), 'steel');       // moyeux de A et B
    const ar = P('arbre-reacteur', 0, 0, 0, ['Arbre de réacteur (fixe)', [14, 4.2, 0]]);
    ar.mesh(tube(2.2, 3.0, 8.5, 17.6), 'steel');
    const as = P('arbre-soleil', 0, 0, 0, ['Arbre de soleil commun S1/S2', [43.5, 3.6, 0]]);
    as.mesh(tube(2.0, 2.6, 36.2, 48.4), 'steel');
    as.mesh(washer(2.0, 8.2, 36.2, 36.5), 'steel'); as.mesh(tube(7.9, 8.2, 33.0, 36.5), 'steel');        // tambour de A
    const ao = P('arbre-sortie', 0, 0, 0, ['Arbre de sortie + bride (6)', [55.5, 6.2, 0]]);
    ao.mesh(tube(2.0, 3.0, 48.7, 57.0), 'steel'); ao.mesh(washer(3.0, 7.4, 54.4, 56.4), 'steel');

    /* ===================================================== RALENTISSEUR PRIMAIRE (3) */
    const rr = P('ret-rotor', 0, 0, 0, ['Ralentisseur — rotor', [18.6, 14.2, 0]]);
    rr.mesh(halfTorus(XR, RCR, RHOR, 0.35, -1), 'steel'); rr.mesh(tube(1.6, 2.6, 17.8, 19.2), 'steel'); rr.mesh(washer(2.6, 6.8, 18.2, 18.5), 'steel');
    rr.instanced(bladeGeo(RHOR, 0.35, -1), ringMatrices(32, RCR, XR, -24), 'steel');
    const rs = P('ret-stator', 0, 0, 0, ['Ralentisseur — stator (fixe)', [24.0, 14.2, 0]]);
    rs.mesh(halfTorus(XR, RCR, RHOR, 0.35, +1), 'alu'); rs.mesh(tube(12.3, 12.7, XR, 23.8), 'alu'); rs.mesh(washer(12.3, 14.8, 23.8, 24.5), 'alu');
    rs.instanced(bladeGeo(RHOR, 0.35, +1), ringMatrices(30, RCR, XR, 24), 'alu');
    const ro = P('ret-huile', 0, 0, 0, ['Huile du ralentisseur (remplissage)', [21, 8.2, 0]]);
    ro.mesh(fullTorus(XR, RCR, RHOR - 0.5), 'oil', { noCap: true });

    /* ===================================================== TRAIN 3 (soleil = entrée) + frein D */
    const ths3 = [0.5, 0.5 + TAU / 4, 0.5 + TAU / 2, 0.5 + (3 * TAU) / 4];
    this.t3 = { th: ths3, ph: ths3.map((t) => meshPhase(0, P3.zs, P3.zp, t)) }; this.t3.phR = wrap((Math.PI - (ths3[0] - this.t3.ph[0]) * P3.zp) / P3.zr + ths3[0]);
    P('p3-soleil', X3, 0, 0, ['Train 3 — soleil (entrée)', [0, 7.4, 0]]).mesh(G.involuteGear({ Z: P3.zs, pitchR: pr(P3.zs, P3.m), width: 3.8, boreR: 1.6, web: true }), 'steel');
    ths3.forEach((t, i) => P(`p3-sat-${i + 1}`, X3, orbit(P3) * Math.cos(t), orbit(P3) * Math.sin(t), i === 0 ? ['Train 3 — satellites (×4)', [0, 4.6, 0]] : null).mesh(G.involuteGear({ Z: P3.zp, pitchR: pr(P3.zp, P3.m), width: 3.8, boreR: 0.5 }), 'steel'));
    const c3 = P('p3-porte', 0, 0, 0, ['Train 3 — porte-satellites', [X3, -12.8, 0]]);
    c3.mesh(washer(2.6, 9.8, 25.9, 26.2), 'steel'); c3.mesh(washer(2.6, 9.8, 29.8, 30.1), 'steel');
    ths3.forEach((t) => orbitGroup(c3, orbit(P3), t, (g) => c3.mesh(G.cylX(0.45, 25.9, 30.1, 14), 'steel', { parent: g })));
    const r3 = P('p3-couronne', X3, 0, 0, ['Train 3 — couronne (freinée par D)', [-4, 13.6, 0]]);
    r3.mesh(G.splineRing({ Z: P3.zr, rBase: pr(P3.zr, P3.m) + 0.21, rTip: pr(P3.zr, P3.m) - 0.17, width: 3.8, plainR: 11.0, hTip: 0.2, hBase: 0.28, phase: this.t3.phR }), 'steel');
    r3.mesh(tube(11.0, 11.6, -1.9, 1.9), 'steel');
    const dx = (id, n, x, o, lab) => { const p = P(id, x, 0, 0, [n, lab]); discStack(p, o); return p; };
    dx('frein-d', 'Frein D (couronne du train 3)', X3, { rA: 11.7, rB: 12.0, rC: 13.3, rD: 13.6, n: 3, gapOpen: 0.5, gapClosed: 0.37 }, [0, 15.6, 0]);

    /* ===================================================== EMBRAYAGES A (intérieur) / B (extérieur) emboîtés */
    dx('emb-a', 'Embrayage A (turbine → arbre de soleil)', XAB, { rA: 5.2, rB: 5.5, rC: 7.4, rD: 7.7, n: 4, gapOpen: 0.5, gapClosed: 0.37 }, [0, 6.8, 0]);
    dx('emb-b', 'Embrayage B (turbine → tambour X1)', XAB, { rA: 8.6, rB: 8.9, rC: 10.0, rD: 10.3, n: 3, gapOpen: 0.5, gapClosed: 0.37 }, [0, 11.2, 0]);

    /* ===================================================== TRAIN 1 + frein E */
    const ths1 = [0.2, 0.2 + TAU / 3, 0.2 + (2 * TAU) / 3];
    this.t1 = { th: ths1, ph: ths1.map((t) => meshPhase(0, P1.zs, P1.zp, t)) }; this.t1.phR = wrap((Math.PI - (ths1[0] - this.t1.ph[0]) * P1.zp) / P1.zr + ths1[0]);
    P('p1-soleil', X1, 0, 0, ['Train 1 — soleil', [0, 5.2, 0]]).mesh(G.involuteGear({ Z: P1.zs, pitchR: pr(P1.zs, P1.m), width: 3.6, boreR: 2.6, web: true }), 'steel');
    ths1.forEach((t, i) => P(`p1-sat-${i + 1}`, X1, orbit(P1) * Math.cos(t), orbit(P1) * Math.sin(t), i === 0 ? ['Train 1 — satellites (×3)', [0, 4.6, 0]] : null).mesh(G.involuteGear({ Z: P1.zp, pitchR: pr(P1.zp, P1.m), width: 3.6, boreR: 0.5 }), 'steel'));
    const c1 = P('p1-porte', 0, 0, 0, ['Train 1 — porte-satellites', [X1 - 1, -11.6, 0]]);
    c1.mesh(washer(3.0, 10.8, 38.0, 38.3), 'steel'); c1.mesh(washer(3.0, 10.8, 42.0, 42.3), 'steel');
    ths1.forEach((t) => orbitGroup(c1, orbit(P1), t, (g) => c1.mesh(G.cylX(0.5, 38.0, 42.3, 14), 'steel', { parent: g })));
    c1.mesh(tube(10.5, 10.8, 33.0, 38.0), 'steel');                                                   // tambour de sortie de B
    const r1 = P('p1-couronne', X1, 0, 0, ['Train 1 — couronne (freinée par E)', [0, 13.6, 0]]);
    r1.mesh(G.splineRing({ Z: P1.zr, rBase: pr(P1.zr, P1.m) + 0.19, rTip: pr(P1.zr, P1.m) - 0.15, width: 3.6, plainR: 11.0, hTip: 0.2, hBase: 0.28, phase: this.t1.phR }), 'steel');
    r1.mesh(tube(11.0, 11.6, -1.8, 1.8), 'steel');
    dx('frein-e', 'Frein E (tambour couronne 1 / porte-satellites 3)', X1, { rA: 11.7, rB: 12.0, rC: 13.3, rD: 13.6, n: 3, gapOpen: 0.5, gapClosed: 0.37 }, [0, 15.6, 0]);
    const dxr = P('tambour-x2', 0, 0, 0, ['Tambour X2 (couronne 1 + porte-satellites 3)', [34.2, 12.6, 0]]);
    dxr.mesh(tube(11.0, 11.6, 30.1, 38.4), 'steel');

    /* ===================================================== TRAIN 2 (sortie = porte-satellites) + frein F */
    const ths2 = [0.9, 0.9 + TAU / 3, 0.9 + (2 * TAU) / 3];
    this.t2 = { th: ths2, ph: ths2.map((t) => meshPhase(0, P2.zs, P2.zp, t)) }; this.t2.phR = wrap((Math.PI - (ths2[0] - this.t2.ph[0]) * P2.zp) / P2.zr + ths2[0]);
    P('p2-soleil', X2, 0, 0, ['Train 2 — soleil', [0, 5.2, 0]]).mesh(G.involuteGear({ Z: P2.zs, pitchR: pr(P2.zs, P2.m), width: 3.6, boreR: 2.6, web: true }), 'steel');
    ths2.forEach((t, i) => P(`p2-sat-${i + 1}`, X2, orbit(P2) * Math.cos(t), orbit(P2) * Math.sin(t), i === 0 ? ['Train 2 — satellites (×3)', [0, 4.6, 0]] : null).mesh(G.involuteGear({ Z: P2.zp, pitchR: pr(P2.zp, P2.m), width: 3.6, boreR: 0.5 }), 'steel'));
    const c2 = P('p2-porte', 0, 0, 0, ['Train 2 — porte-satellites (SORTIE)', [X2 + 2, -11.6, 0]]);
    c2.mesh(washer(3.0, 10.8, 44.4, 44.7), 'steel'); c2.mesh(washer(3.0, 10.8, 48.4, 48.7), 'steel');
    ths2.forEach((t) => orbitGroup(c2, orbit(P2), t, (g) => c2.mesh(G.cylX(0.5, 44.4, 48.7, 14), 'steel', { parent: g })));
    const r2 = P('p2-couronne', X2, 0, 0, ['Train 2 — couronne (freinée par F)', [0, 13.6, 0]]);
    r2.mesh(G.splineRing({ Z: P2.zr, rBase: pr(P2.zr, P2.m) + 0.19, rTip: pr(P2.zr, P2.m) - 0.15, width: 3.6, plainR: 11.0, hTip: 0.2, hBase: 0.28, phase: this.t2.phR }), 'steel');
    r2.mesh(tube(11.0, 11.6, -1.8, 1.8), 'steel');
    dx('frein-f', 'Frein F (tambour porte-satellites 1 / couronne 2)', X2, { rA: 11.7, rB: 12.0, rC: 13.3, rD: 13.6, n: 3, gapOpen: 0.5, gapClosed: 0.37 }, [0, 15.6, 0]);
    const dxx = P('tambour-x1', 0, 0, 0, ['Tambour X1 (porte-satellites 1 + couronne 2)', [43.2, 12.6, 0]]);
    dxx.mesh(washer(7.5, 11.0, 42.0, 42.3), 'steel'); dxx.mesh(tube(10.6, 11.0, 42.0, 44.8), 'steel');

    /* ===================================================== PISTONS */
    const piston = (id, name, x, rIn, rOut, lab) => { const p = P(id, x, 0, 0, lab ? [name, lab] : null); p.mesh(tube(rIn, rOut, -0.25, 0.25), 'steel'); p.mesh(tube(rIn - 0.02, rIn + 0.14, -0.3, 0.3), 'rubber'); p.mesh(tube(rOut - 0.14, rOut + 0.02, -0.3, 0.3), 'rubber'); return p; };
    piston('piston-a', 'Piston de A', XP.a, 5.0, 7.8, null); piston('piston-b', 'Piston de B', XP.b, 8.5, 10.4, null);
    piston('piston-d1', 'Piston de D — surface D1', XP.d1, 11.8, 13.5, ['Piston D1', [0, 17.8, 0]]); piston('piston-d2', 'Piston de D — surface D2', XP.d2, 11.8, 13.5, null);
    piston('piston-e', 'Piston de E', XP.e, 11.8, 13.5, null);
    piston('piston-f1', 'Piston de F — surface F1', XP.f1, 11.8, 13.5, null); piston('piston-f2', 'Piston de F — surface F2', XP.f2, 11.8, 13.5, ['Piston F2', [0, 17.8, 0]]);

    /* ===================================================== BLOC HYDRAULIQUE (8) + régulateurs + soupapes */
    const vb = P('bloc-hydraulique', 36.0, -17.6, 0, ['Bloc hydraulique (8)', [0, -23.8, 0]]); vb.mesh(new THREE.BoxGeometry(30, 1.6, 11), 'alu');
    const REG = [['ev-rhd', 'Régulateur RHD (5) · Y13', 24.0], ['ev-ret', 'Régulateur ralentisseur (10) · Y19', 27.2], ['ev-wk', 'Régulateur WK (15) · Y17', 30.4], ['ev-a', 'Régulateur A (16) · Y11', 33.6],
      ['ev-b', 'Régulateur B (17) · Y12', 36.8], ['ev-d', 'Régulateur D (18) · Y14', 40.0], ['ev-e', 'Régulateur E (19) · Y15', 43.2], ['ev-f', 'Régulateur F (20) · Y16', 46.4]];
    REG.forEach(([id, n, x], i) => { const e = P(id, x, -19.7, i % 2 ? 2.7 : -2.7, [n, [0, -2.4, 0]]); e.mesh(cyl(0.65, 2.0), 'steel'); e.mesh(cyl(0.34, 0.6), 'rubber', { pos: [0, -1.2, 0] }); });
    const VAL = [['soupape-6', 'Soupape principale (6)', 22.5], ['soupape-7', 'Soupape de sécurité convertisseur (7)', 25.0], ['soupape-8', 'Soupape de contre-pression (8)', 27.5], ['soupape-9', 'Soupape de graissage (9)', 30.0],
      ['valve-14', 'Valve de commutation du refroidissement (14)', 32.5], ['valve-kuv-13', 'Valve KUV (13)', 35.0], ['valve-21', 'Valve F1/F2 (21)', 37.5], ['valve-22', 'Valve D1/D2 (22)', 40.0],
      ['bypass-filtre-4', 'Bypass de filtre (4)', 42.5], ['bypass-31', 'Bypass d\'échangeur (31)', 45.0], ['clapet-29', 'Clapet anti-retour (29)', 47.5], ['charge-pompe-24', 'Chargement de pompe (24)', 49.5]];
    VAL.forEach(([id, n, x], i) => { const s = i % 2 ? 1 : -1; const v = P(id, x, -17.6, s * 6.3, [n, [0, -3.2 + (i % 4) * -0.01, s * 1.2]]); v.mesh(cyl(0.55, 2.4, 'z'), 'steel'); v.mesh(cyl(0.7, 0.5, 'z'), 'brass', { pos: [0, 0, s * 1.2] }); });
    const PORTS = [['prise-phd', 'Prise PHD (pression principale)', 25.0], ['prise-pvf', 'Prise PVF (amont filtre 3)', 28.0], ['prise-a8', 'Prise A8 (aval convertisseur)', 31.0], ['prise-d6', 'Prise D6 (aval échangeur ralentisseur)', 34.0], ['prise-d8', 'Prise D8 (lubrification)', 37.0]];
    PORTS.forEach(([id, n, x]) => { const q = P(id, x, -17.6, 5.9, [n, [0, -4.0, 2.4]]); q.mesh(cyl(0.4, 1.4, 'z'), 'chrome'); q.mesh(cyl(0.6, 0.35, 'z'), 'rubber', { pos: [0, 0, 0.6] }); });
    const f1 = P('filtre-1', 18.5, -19.6, 0, ['Filtre d\'aspiration (1)', [0, -23.4, 0]]); f1.mesh(new THREE.BoxGeometry(3.4, 1.4, 3.6), 'rubber');
    const f3 = P('filtre-3', 21.2, -19.2, 0, ['Filtre à pression (3)', [0, -22.6, 0]]); f3.mesh(cyl(1.5, 2.4), 'steel'); f3.mesh(cyl(1.0, 2.6), 'friction');
    const ac = P('accu-12', 24.0, -21.0, -4.2, ['Accumulateur (12)', [0, -3.4, 0]]); ac.mesh(cyl(1.7, 4.4), 'steel'); ac.mesh(cyl(0.9, 3.0), 'brass', { pos: [0, 0.3, 0] });
    const ex = P('echangeur', 54.0, -20.6, 0, ['Échangeur (26 boîte + 27 ralentisseur)', [0, -4.4, 0]]); ex.mesh(new THREE.BoxGeometry(8.4, 5.2, 11), 'steel');
    for (let i = 0; i < 8; i++) ex.mesh(new THREE.BoxGeometry(0.12, 4.6, 10.4), 'alu', { pos: [-3.5 + i, 0, 0] });
    const sc = P('capteur-b12', 19.5, 16.0, 0, ['Capteur de régime turbine B12', [0, 2.6, 0]]); sc.mesh(cyl(0.6, 1.8), 'rubber'); sc.mesh(cyl(0.45, 0.5), 'chrome', { pos: [0, -1.0, 0] });
    const so = P('capteur-b11', 52.4, 16.0, 0, ['Capteur de régime sortie B11', [0, 2.6, 0]]); so.mesh(cyl(0.6, 1.8), 'rubber'); so.mesh(cyl(0.45, 0.5), 'chrome', { pos: [0, -1.0, 0] });
    const nc = P('sonde-carter', 29.0, -18.6, 3.6, ['Sonde de température du carter', [0, -2.8, 2.6]]); nc.mesh(cyl(0.4, 1.4), 'chrome');
    const nr = P('sonde-ret', 22.4, 13.4, 0, ['Sonde de température du ralentisseur', [0, 2.6, 0]]); nr.mesh(cyl(0.4, 1.6), 'chrome');
    const x4 = P('connecteur-x4', 46.0, -17.6, 6.9, ['Connecteur de boîte X4', [0, -3.4, 2.6]]); x4.mesh(new THREE.BoxGeometry(3.2, 2.0, 1.6), 'rubber'); x4.mesh(new THREE.BoxGeometry(2.6, 1.4, 0.3), 'chrome', { pos: [0, 0, 0.9] });

    /* ===================================================== CARTERS */
    this.mk('carter-eco', 0, 0, 0, ['Carter de boîte', [38, 17.0, 0]], { housing: true }).mesh(G.hullTube({ circles: [{ y: 0, z: 0, r: 15.2 }], wall: 0.5, x0: 14.4, x1: 58.6 }), 'alu');
    this.mk('carter-convertisseur', 0, 0, 0, ['Cloche de convertisseur', [4, 18.6, 0]], { housing: true }).mesh(G.hullTube({ circles: [{ y: 0, z: 0, r: 16.4 }], wall: 0.5, x0: -0.8, x1: 14.6 }), 'alu');
    const pan = P('carter-huile', 36.0, -22.0, 0, ['Carter d\'huile', [0, -3.0, 0]], { housing: true });
    pan.mesh(new THREE.BoxGeometry(40, 0.4, 14), 'alu', { pos: [0, -1.6, 0] });
    for (const sz of [-1, 1]) pan.mesh(new THREE.BoxGeometry(40, 3.4, 0.4), 'alu', { pos: [0, 0.1, sz * 6.8] });
    for (const sx of [-1, 1]) pan.mesh(new THREE.BoxGeometry(0.4, 3.4, 14), 'alu', { pos: [sx * 19.8, 0.1, 0] });
  }

  makePlan() {
    const hyd = ['ev-rhd', 'ev-ret', 'ev-wk', 'ev-a', 'ev-b', 'ev-d', 'ev-e', 'ev-f', 'soupape-6', 'soupape-7', 'soupape-8', 'soupape-9', 'valve-14', 'valve-kuv-13', 'valve-21', 'valve-22', 'bypass-filtre-4', 'bypass-31', 'clapet-29', 'charge-pompe-24', 'prise-phd', 'prise-pvf', 'prise-a8', 'prise-d6', 'prise-d8', 'connecteur-x4', 'sonde-carter'];
    this.step('Déposer la cloche et le carter de boîte', [{ id: 'carter-convertisseur', v: [-10, 0, 26] }, { id: 'carter-eco', v: [0, 0, 34] }]);
    this.step('Déposer le carter d\'huile, le filtre et le bloc hydraulique', [{ id: 'carter-huile', v: [0, -18, 0] }, { id: 'filtre-1', v: [0, -12, 0] }, { id: 'filtre-3', v: [0, -12, 0] }, { id: 'accu-12', v: [0, -12, -6] }, { id: 'bloc-hydraulique', v: [0, -9, 0] }, ...hyd.map((id) => ({ id, v: [0, -9, 0] }))]);
    this.step('Déposer l\'échangeur et les capteurs', [{ id: 'echangeur', v: [10, -6, 0] }, { id: 'capteur-b12', v: [0, 8, 0] }, { id: 'capteur-b11', v: [0, 8, 0] }, { id: 'sonde-ret', v: [0, 8, 0] }]);
    this.step('Déposer la sortie', [{ id: 'arbre-sortie', v: [16, 0, 0] }]);
    this.step('Déposer le frein F et le train 2', [{ id: 'piston-f2', v: [10, 0, 0] }, { id: 'frein-f', v: [0, 0, 16] }, { id: 'piston-f1', v: [-6, 0, 0] }, { id: 'p2-couronne', v: [8, 0, 0] }, { id: 'p2-porte', v: [14, 0, 0] }, ...[1, 2, 3].map((i) => ({ id: `p2-sat-${i}`, v: [10, 0, 10] })), { id: 'p2-soleil', v: [6, 0, 0] }, { id: 'tambour-x1', v: [-6, 0, 0] }]);
    this.step('Déposer le frein E et le train 1', [{ id: 'piston-e', v: [-8, 0, 0] }, { id: 'frein-e', v: [0, 0, -16] }, { id: 'p1-couronne', v: [6, 0, 0] }, { id: 'p1-porte', v: [-5, 0, 0] }, ...[1, 2, 3].map((i) => ({ id: `p1-sat-${i}`, v: [0, 0, 10] })), { id: 'p1-soleil', v: [4, 0, 0] }, { id: 'tambour-x2', v: [0, 0, 20] }]);
    this.step('Déposer les embrayages A et B', [{ id: 'piston-b', v: [0, 0, 16] }, { id: 'emb-b', v: [0, 0, 14] }, { id: 'piston-a', v: [0, 0, -14] }, { id: 'emb-a', v: [0, 0, -12] }, { id: 'arbre-soleil', v: [10, 0, 0] }]);
    this.step('Déposer le frein D et le train 3', [{ id: 'piston-d2', v: [8, 0, 0] }, { id: 'frein-d', v: [0, 0, 16] }, { id: 'piston-d1', v: [-6, 0, 0] }, { id: 'p3-couronne', v: [4, 0, 0] }, { id: 'p3-porte', v: [-4, 0, 0] }, ...[1, 2, 3, 4].map((i) => ({ id: `p3-sat-${i}`, v: [0, 0, 10] })), { id: 'p3-soleil', v: [-6, 0, 0] }, { id: 'arbre-entree', v: [0, 0, -0.01] }]);
    this.step('Déposer le ralentisseur', [{ id: 'ret-stator', v: [8, 0, 0] }, { id: 'ret-huile', v: [0, 0, 0] }, { id: 'ret-rotor', v: [-6, 0, 0] }]);
    this.step('Déposer la pompe', [{ id: 'pompe-corps', v: [4, 0, 0] }, { id: 'pompe-rotor-int', v: [-4, 0, 10] }, { id: 'pompe-rotor-ext', v: [-4, 0, -10] }, { id: 'arbre-reacteur', v: [0, 0, -12] }]);
    this.step('Séparer le convertisseur', [{ id: 'cv-capot', v: [-12, 0, 0] }, { id: 'cv-flasque', v: [-20, 0, 0] }, { id: 'cv-wk', v: [-10, 0, 0] }, { id: 'cv-amortisseur', v: [-7, 0, 0] }, { id: 'cv-turbine', v: [-4, 0, 0] }, { id: 'cv-reacteur', v: [0, 0, 9] }, { id: 'cv-roue-libre', v: [0, 0, -9] }, { id: 'cv-impulseur', v: [5, 0, 0] }]);
  }

  /* ------------------------------------------------------------------ animation */
  pose(sim, dt) {
    const a = sim.ang, p = this.parts;
    const eng = a.eng, turb = a.turb;
    p['cv-flasque'].rotX = eng; p['cv-capot'].rotX = eng; p['cv-impulseur'].rotX = eng; p['pompe-rotor-int'].rotX = eng; p['pompe-rotor-ext'].rotX = (eng * 24) / 30;
    for (const id of ['cv-turbine', 'cv-amortisseur', 'arbre-entree', 'ret-rotor', 'p3-soleil']) p[id].rotX = turb;
    p['cv-wk'].rotX = turb; p['cv-wk'].slide = -0.45 * sim.lu;
    p['cv-reacteur'].rotX = a.stator; p['cv-roue-libre'].rotX = a.stator;
    p['arbre-soleil'].rotX = a.ss; p['p1-soleil'].rotX = a.ss; p['p2-soleil'].rotX = a.ss;
    p['p1-porte'].rotX = a.x1; p['p2-couronne'].rotX = a.x1; p['tambour-x1'].rotX = a.x1;
    p['p1-couronne'].rotX = a.x2; p['p3-porte'].rotX = a.x2; p['tambour-x2'].rotX = a.x2;
    p['p2-porte'].rotX = a.out; p['arbre-sortie'].rotX = a.out; p['p3-couronne'].rotX = a.r3;
    const sets = [['p3', this.t3, P3, X3, a.turb, a.x2], ['p1', this.t1, P1, X1, a.ss, a.x1], ['p2', this.t2, P2, X2, a.ss, a.out]];
    for (const [k, T, pg, xc, aS, aC] of sets) {
      T.th.forEach((t0, i) => { const s = p[`${k}-sat-${i + 1}`], th = t0 + aC; s.base.set(xc, orbit(pg) * Math.cos(th), orbit(pg) * Math.sin(th)); s.rotX = T.ph[i] + aC - (aS - aC) * (pg.zs / pg.zp); });
    }
    const L = sim.lv, F = sim.fill, S2 = sim.sl2;
    const set = (id, lvl, inner, outer) => { const q = p[id]; setStack(q, lvl); q.rig.gI.rotation.x = inner; q.rig.gO.rotation.x = outer; };
    set('emb-a', L.a, a.turb, a.ss); set('emb-b', L.b, a.turb, a.x1); set('frein-d', L.d, a.r3, 0); set('frein-e', L.e, a.x2, 0); set('frein-f', L.f, a.x1, 0);
    const pis = (id, lvl, fill, side, rot) => { const q = p[id]; q.slide = side * 0.62 * Math.max(fill, lvl); q.rotX = rot; };
    pis('piston-a', L.a, F.a, 1, a.turb); pis('piston-b', L.b, F.b, 1, a.turb); pis('piston-d1', L.d, F.d, 1, 0); pis('piston-d2', L.d * S2.d, F.d * S2.d, -1, 0);
    pis('piston-e', L.e, F.e, 1, 0); pis('piston-f1', L.f, F.f, 1, 0); pis('piston-f2', L.f * S2.f, F.f * S2.f, -1, 0);
    p['ret-huile'].rotX = sim.ang.ret * 0.2;
    for (const id in p) p[id].apply();
  }

  /* ------------------------------------------------------------------ couleurs normalisées */
  style(sim, o) {
    const g = sim.gear, drive = (typeof g === 'number' || g === 'R') && Math.abs(sim.n.turb) > 15 && !sim.brake;
    const mv = (v) => Math.abs(v) > 4;
    const path = new Set();
    if (drive) {
      ['cv-flasque', 'cv-capot', 'cv-impulseur', 'cv-turbine', 'cv-amortisseur', 'arbre-entree', 'p3-soleil'].forEach((x) => path.add(x));
      if (mv(sim.n.ss)) ['arbre-soleil', 'p1-soleil', 'p2-soleil'].forEach((x) => path.add(x));
      if (mv(sim.n.x1)) ['tambour-x1', 'p1-porte', 'p2-couronne'].forEach((x) => path.add(x));
      if (mv(sim.n.x2)) ['tambour-x2', 'p1-couronne', 'p3-porte'].forEach((x) => path.add(x));
      if (mv(sim.n.r3)) path.add('p3-couronne');
      if (mv(sim.n.out)) ['p2-porte', 'arbre-sortie'].forEach((x) => path.add(x));
      [1, 2, 3].forEach((i) => { path.add(`p1-sat-${i}`); path.add(`p2-sat-${i}`); }); [1, 2, 3, 4].forEach((i) => path.add(`p3-sat-${i}`));
    }
    const idle = new Set(['arbre-entree', 'cv-turbine', 'p3-soleil', 'ret-rotor']);
    const lvl = sim.flow().level;
    this.styleGeneric(o, (part, st) => {
      const id = part.id;
      if (o.focus && o.focus.has(id)) { st.emissive = 0x2f9bff; st.ei = 0.45 + 0.3 * Math.sin(o.time * 5); return; }   // pièce mise en évidence par le parcours guidé
      if (/^(emb|frein)-[abdef]$/.test(id)) {
        const k = id.slice(-1), l = sim.lv[k], sl = sim.slipEl[k];
        if (sl > 0.12) { st.emissive = SSP.alerte; st.ei = 0.35 + 0.6 * sl * (0.6 + 0.4 * Math.sin(o.time * 14)); }
        else if (l > 0.04) { st.emissive = SSP.couple; st.ei = 0.25 + l * 0.9; }
      } else if (/^piston-[abdef]\d?$/.test(id)) {
        const k = id[7], s2 = id.endsWith('2') ? sim.sl2[k] || 0 : 1, l = Math.max(sim.lv[k], sim.fill[k] * 0.6) * s2;
        if (l > 0.04) { st.emissive = SSP.couple; st.ei = 0.2 + l * 0.7; }
      } else if (/^ev-[abdef]$/.test(id)) { if (sim.cmd[id.slice(-1)] > 0.5) { st.emissive = SSP.commande; st.ei = 0.7; } }
      else if (id === 'ev-wk') { if (sim.cmd.wk > 0.5) { st.emissive = SSP.commande; st.ei = 0.7; } }
      else if (id === 'ev-ret') { if (sim.cmd.ret > 0.05) { st.emissive = SSP.commande; st.ei = 0.5 + 0.4 * sim.cmd.ret; } }
      else if (id === 'ev-rhd') { st.emissive = SSP.commande; st.ei = 0.25 + 0.4 * Math.min(1, sim.p.phd / 12); }
      else if (id === 'cv-wk') { if (sim.lu > 0.05) { st.emissive = SSP.couple; st.ei = 0.3 + 0.8 * sim.lu; } }
      else if (id === 'cv-roue-libre') { if (sim.stator === 'locked') { st.emissive = SSP.couple; st.ei = 0.6; } else if (o.ssp) { st.tint = SSP.fou; st.tintAmt = 0.6; } }
      else if (id === 'cv-reacteur') { if (o.ssp) { st.tint = sim.stator === 'locked' ? SSP.couple : SSP.fou; st.tintAmt = sim.stator === 'locked' ? 0.25 : 0.5; } }
      else if (id === 'ret-huile') { st.opacity = Math.min(0.85, 0.05 + 0.85 * sim.ret.fill); st.emissive = SSP.lub; st.ei = 0.4; }
      else if (id === 'ret-rotor' && sim.ret.fill > 0.1) { st.emissive = 0xff7a2a; st.ei = 0.15 + 0.6 * sim.ret.fill; }
      else if (id === 'accu-12') { st.emissive = SSP.lub; st.ei = 0.15 + 0.35 * sim.accu; }
      else if (/^prise-/.test(id)) { st.emissive = SSP.lub; st.ei = 0.4; }
      else if (id === 'bypass-filtre-4' && sim.bypass4) { st.emissive = SSP.alerte; st.ei = 0.6; }
      else if (id === 'bypass-31' && sim.bypass31) { st.emissive = SSP.alerte; st.ei = 0.6; }
      else if (id === 'valve-14') { if (sim.cool === 'retarder') { st.emissive = SSP.commande; st.ei = 0.5; } }
      else if (id === 'echangeur' && sim.oilT > 110) { st.emissive = SSP.alerte; st.ei = 0.2 + Math.min(0.6, (sim.oilT - 110) / 50); }
      else if (o.ssp && lvl > 0.05 && path.has(id)) { st.emissive = sim.load === 'decel' ? 0xff2a00 : SSP.couple; st.ei = 0.05 + 0.13 * lvl; }
      else if (o.ssp && !drive && idle.has(id) && sim.engineOn) { st.tint = SSP.fou; st.tintAmt = 0.5; }
    });
  }

  views() {
    return {
      global: { target: V3(28, 0, 0), pos: V3(28, 30, 96), fitW: 64, fitH: 44 },
      loupe: {}, diff: null,
      conv: { target: V3(8, 2, 0), pos: V3(8, 14, 44) },
      ret: { target: V3(21, 2, 0), pos: V3(21, 14, 40) },
      trains: { target: V3(39, 2, 0), pos: V3(39, 16, 54) },
      emb: { target: V3(35, 2, 0), pos: V3(35, 12, 38) },
      hydro: { target: V3(36, -14, 0), pos: V3(36, -2, 52) },
      clutch: { target: V3(35, 2, 0), pos: V3(35, 12, 38) },
    };
  }
}
