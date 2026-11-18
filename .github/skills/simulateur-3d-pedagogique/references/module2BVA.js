/* ============================================================================
 * module2BVA.js — MODULE 2 : boîte automatique 6 rapports « type Lepelletier »
 *   convertisseur de couple (impulseur, turbine, stator + roue libre, pontage + amortisseur) · pompe à huile ·
 *   train simple réducteur · train Ravigneaux · embrayages A, B, E · freins C, D (pistons hydrauliques) ·
 *   sortie + parking · bloc hydraulique (électrovannes) · carters.
 *  Cinématique : bvaSim.js (équations de Willis avec les nombres de dents réels du modèle).
 *  Implantation axiale SIMPLIFIÉE (schéma fonctionnel) : une boîte réelle est plus compacte (tambours imbriqués).
 * ========================================================================== */
import * as THREE from 'three';
import { BaseModule, discStack, setStack } from './moduleBase.js';
import * as G from './gearsBuilder.js';
import { meshPhase, TAU } from './layout.js';
import { SSP } from './materials.js';
import { Z, TABLE, EL_INFO, EL, BvaSim } from './bvaSim.js';
import { groupsBVA } from './groups.js';
import './bvaParts.js';

export { BvaSim, TABLE as BVA_TABLE };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const M = 0.15;                                   // module visuel des trains (1,5 mm)
const pr = (z) => (z * M) / 2;                     // rayon primitif
const wrap = (a) => ((a % TAU) + TAU) % TAU;

/* ---- implantation axiale (1 unité = 10 mm) ---- */
const X = {
  flex: -24.3, ps: -2.6, rvL: 15.2, rvR: 18.3, rvLong: 16.7,
  a: 3.4, b: 7.4, c: 10.8, d: 11.6, e: 22.0,
  pa: 1.5, pb: 5.5, pc: 12.9, pd: 9.9, pe: 23.8,
};
const XC = -13.2, RC = 8.6, RHO = 3.6, TH = 0.35;           // méridienne du tore du convertisseur
const R_PS = pr(Z.s1) + pr(Z.p1);                             // rayon d'orbite, train réducteur
const R_LONG = pr(Z.s3) + pr(Z.pl), R_SHORT = pr(Z.s4) + pr(Z.ps), DLT = Math.acos((R_LONG ** 2 + R_SHORT ** 2 - (pr(Z.ps) + pr(Z.pl)) ** 2) / (2 * R_LONG * R_SHORT));

/* ---- géométries utilitaires ---- */
const halfTorus = (side) => {                     // side = -1 : turbine (côté moteur) ; +1 : impulseur
  const pts = [], n = 20;
  for (let i = 0; i <= n; i++) { const b = (Math.PI * i) / n; pts.push([XC + side * RHO * Math.sin(b), RC + RHO * Math.cos(b)]); }
  for (let i = n; i >= 0; i--) { const b = (Math.PI * i) / n; pts.push([XC + side * (RHO - TH) * Math.sin(b), RC + (RHO - TH) * Math.cos(b)]); }
  return G.latheX(pts, 64);
};
const bladeGeo = (side, thick = 0.1) => {         // aube : demi-disque dans le plan (x, r), épaisseur tangentielle
  const rr = RHO - TH - 0.06, sh = new THREE.Shape(), n = 14;
  for (let i = 0; i <= n; i++) { const b = (Math.PI * i) / n; const x = side * rr * Math.sin(b), y = rr * Math.cos(b); i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -thick / 2);
  return g;
};
const ringMatrices = (n, r, x = 0, tiltDeg = 0, phase = 0) => {
  const out = [], m = new THREE.Matrix4(), q = new THREE.Matrix4(), t = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = phase + (i * TAU) / n;
    m.makeRotationX(a); t.makeTranslation(x, r, 0); q.makeRotationY((tiltDeg * Math.PI) / 180);
    out.push(m.clone().multiply(t).multiply(q));
  }
  return out;
};
const washer = (rIn, rOut, x0, x1) => G.tubeX(rIn, rOut, x0, x1, 64);
const orbitGroup = (part, r, angle, fn) => { const g = new THREE.Group(); g.position.set(0, r * Math.cos(angle), r * Math.sin(angle)); part.group.add(g); fn(g); };
const dmin = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Module2 extends BaseModule {
  constructor() {
    super('bva', 'Module 2 · BVA 6 rapports (type Lepelletier)');
    this.sim = new BvaSim();
    this.gearList = ['P', 'R', 'N', 'D', 1, 2, 3, 4, 5, 6];
    this.groups = groupsBVA();
    this.build();
    this.makePlan();
  }

  build() {
    const P = (id, x, y, z, label, o) => this.mk(id, x, y, z, label, o);

    /* ===================================================== CONVERTISSEUR */
    const flex = P('cv-flexplate', X.flex, 0, 0, ['Plateau moteur + couronne de démarreur', [0, 14.6, 0]]);
    flex.mesh(G.latheX([[-0.15, 3.0], [0.15, 3.0], [0.15, 13.2], [-0.15, 13.2]], 64), 'steel');
    flex.mesh(G.involuteGear({ Z: 120, pitchR: 13.6, width: 0.8, boreR: 13.0, web: false }), 'steel');

    const cover = P('cv-capot', 0, 0, 0, ['Capot de convertisseur', [-16, 13.8, 0]], { housing: true });
    cover.mesh(G.latheX([[-23.0, 0], [-23.0, 11.0], [-21.9, 12.9], [-9.6, 12.9], [-9.6, 12.5], [-21.7, 12.5], [-22.6, 11.1], [-22.6, 0]], 72), 'steel');

    const imp = P('cv-impulseur', 0, 0, 0, ['Impulseur (pompe)', [-9.8, 13.0, 0]]);
    imp.mesh(halfTorus(+1), 'steel');
    imp.mesh(G.tubeX(12.2, 12.5, XC, -9.6, 64), 'steel');
    imp.mesh(G.latheX([[XC + 0.05, 5.0], [XC + 0.05, 4.65], [XC + 1.7, 3.9], [XC + 1.7, 3.2]], 56), 'steel');
    imp.mesh(G.tubeX(3.2, 3.9, XC + 1.7, -6.0, 56), 'steel');
    imp.instanced(bladeGeo(+1), ringMatrices(36, RC, XC, 28), 'steel');

    const tur = P('cv-turbine', 0, 0, 0, ['Turbine', [-17.2, 13.2, 0]]);
    tur.mesh(halfTorus(-1), 'steel');
    tur.mesh(G.latheX([[XC - 0.05, 5.0], [XC - 0.05, 4.65], [XC - 1.9, 1.9], [XC - 1.9, 1.3]], 56), 'steel');
    tur.mesh(G.tubeX(0.9, 1.7, -21.8, XC - 1.9, 40), 'steel');
    tur.instanced(bladeGeo(-1), ringMatrices(32, RC, XC, -28), 'steel');

    const sta = P('cv-stator', 0, 0, 0, ['Stator (réacteur)', [XC, 8.8, 0]]);
    sta.mesh(G.tubeX(4.85, 5.15, XC - 0.9, XC + 0.9, 56), 'alu');
    sta.mesh(G.tubeX(6.75, 7.05, XC - 0.9, XC + 0.9, 56), 'alu');
    sta.mesh(G.latheX([[XC - 0.3, 3.3], [XC + 0.3, 3.3], [XC + 0.3, 4.9], [XC - 0.3, 4.9]], 48), 'alu');
    sta.mesh(G.tubeX(3.05, 3.3, -13.95, -12.45, 40), 'alu');
    const sg = new THREE.BoxGeometry(1.7, 1.75, 0.12); sta.instanced(sg, ringMatrices(18, 6.0, XC, 32), 'alu');

    const owc = P('cv-roue-libre', 0, 0, 0, ['Roue libre du stator', [-13.2, 4.6, 0]]);
    owc.mesh(G.tubeX(2.45, 2.75, -13.95, -12.45, 40), 'chrome');
    owc.mesh(G.tubeX(3.0, 3.1, -13.95, -12.45, 40), 'chrome');
    owc.instanced(new THREE.BoxGeometry(1.5, 0.34, 0.2), ringMatrices(20, 2.88, -13.2, 25), 'brass');

    const lock = P('cv-pontage', -21.0, 0, 0, ['Embrayage de pontage (lock-up)', [0, 12.4, 0]]);
    lock.mesh(G.tubeX(1.8, 11.4, -0.25, 0.25, 64), 'steel');
    lock.mesh(G.tubeX(9.4, 11.4, -0.5, -0.25, 64), 'friction');
    lock.mesh(G.sealGeo(1.8, 2.3, 0.4), 'rubber');

    const damp = P('cv-amortisseur', -19.0, 0, 0, ['Amortisseur de torsion', [0, 10.4, 0]]);
    damp.mesh(G.tubeX(1.8, 7.8, -0.15, 0.15, 56), 'steel');
    damp.mesh(G.tubeX(9.5, 9.8, -0.15, 0.15, 56), 'steel');
    const spring = new THREE.CylinderGeometry(0.42, 0.42, 2.4, 14); spring.rotateX(Math.PI / 2);
    damp.instanced(spring, ringMatrices(6, 8.65, 0, 0, 0.2), 'brass');

    /* ===================================================== POMPE À HUILE */
    const pc = P('pompe-corps', -6.8, 0, 0, ['Pompe à huile — corps', [0, 8.6, 0]]);
    pc.mesh(G.tubeX(7.35, 8.0, -1.1, 1.1, 64), 'alu');
    pc.mesh(G.tubeX(2.45, 8.0, 1.1, 1.5, 64), 'alu');
    pc.mesh(G.tubeX(4.0, 8.0, -1.4, -1.1, 64), 'alu');
    const cres = new THREE.BoxGeometry(2.0, 1.2, 2.6); cres.translate(0, -6.1, 0); pc.mesh(cres, 'alu');
    const pri = P('pompe-rotor-int', -6.8, 0, 0, ['Pompe — pignon intérieur', [0, 5.6, 0]]);
    pri.mesh(G.involuteGear({ Z: 24, pitchR: 5.0, width: 2.0, boreR: 3.9, web: false }), 'steel');
    const pre = P('pompe-rotor-ext', -6.8, 0.65, 0, ['Pompe — couronne extérieure', [0, 7.9, 0]]);
    pre.mesh(G.splineRing({ Z: 30, rBase: 6.77, rTip: 5.83, width: 2.0, plainR: 7.25, hTip: 0.2, hBase: 0.28 }), 'steel');

    /* ===================================================== ARBRES */
    const at = P('arbre-turbine', 0, 0, 0, ['Arbre de turbine (entrée)', [1.5, 2.2, 0]]);
    at.mesh(G.cylX(0.88, -19.0, 22.4, 32), 'steel');
    at.mesh(G.latheX([[20.45, 0.88], [20.75, 0.88], [20.75, 4.8], [20.45, 4.8]], 56), 'steel');       // moyeu de l'embrayage E
    const ast = P('arbre-stator', 0, 0, 0, ['Arbre de stator (fixe)', [-9.5, 3.0, 0]]);
    ast.mesh(G.tubeX(1.6, 2.4, -14.0, -5.4, 40), 'steel');
    const a3 = P('arbre-s3', 0, 0, 0, ['Arbre du grand planétaire S3', [11.5, 3.9, 0]]);
    a3.mesh(G.tubeX(2.72, 3.05, 6.0, 14.2, 48), 'steel');
    a3.mesh(G.latheX([[9.25, 3.05], [9.55, 3.05], [9.55, 4.8], [9.25, 4.8]], 56), 'steel');          // moyeu de B
    a3.mesh(G.latheX([[12.5, 3.05], [12.8, 3.05], [12.8, 4.95], [12.5, 4.95]], 56), 'steel');        // moyeu de C
    const a4 = P('arbre-s4', 0, 0, 0, ['Arbre du petit planétaire S4', [8.5, 2.2, 0]]);
    a4.mesh(G.tubeX(1.5, 1.9, 2.6, 17.2, 40), 'steel');
    a4.mesh(G.latheX([[5.15, 1.9], [5.45, 1.9], [5.45, 4.3], [5.15, 4.3]], 56), 'steel');            // moyeu de A
    const out = P('arbre-sortie', 0, 0, 0, ['Arbre de sortie (vers le pont)', [30, 3.4, 0]]);
    out.mesh(G.tubeX(1.6, 2.6, 24.4, 33.5, 40), 'steel');

    /* ===================================================== TRAIN SIMPLE RÉDUCTEUR */
    const sun1 = P('ps-soleil', X.ps, 0, 0, ['Soleil fixe (réducteur)', [-1.5, 5.6, 0]]);
    sun1.mesh(G.involuteGear({ Z: Z.s1, pitchR: pr(Z.s1), width: 2.4, boreR: 3.0, web: false }), 'steel');
    sun1.mesh(G.tubeX(2.45, 3.0, -4.2, -1.2, 40), 'steel');
    const ths1 = [0.4, 0.4 + TAU / 3, 0.4 + (2 * TAU) / 3];
    this.ps = { th: ths1, phS: ths1.map((t) => meshPhase(0, Z.s1, Z.p1, t)) };
    this.ps.phR = wrap((Math.PI - (ths1[0] - this.ps.phS[0]) * Z.p1) / Z.r1 + ths1[0]);
    ths1.forEach((t, i) => {
      const s = P(`ps-sat-${i + 1}`, X.ps, R_PS * Math.cos(t), R_PS * Math.sin(t), i === 0 ? ['Satellites du réducteur (×3)', [0, 9.3, 0]] : null);
      s.mesh(G.involuteGear({ Z: Z.p1, pitchR: pr(Z.p1), width: 2.4, boreR: 0.5 }), 'steel');
    });
    const car1 = P('ps-porte', 0, 0, 0, ['Porte-satellites du réducteur (sortie vitesse réduite)', [4.5, 10.2, 0]]);
    car1.mesh(washer(2.2, 7.0, -1.35, -0.95), 'steel');
    car1.mesh(washer(2.2, 7.0, -4.1, -3.85), 'steel');
    ths1.forEach((t) => orbitGroup(car1, R_PS, t, (g) => car1.mesh(G.cylX(0.4, -4.1, -0.95, 14), 'steel', { parent: g })));
    car1.mesh(G.tubeX(1.0, 1.6, -0.95, 0.5, 40), 'steel');
    car1.mesh(washer(1.0, 9.2, 0.3, 0.7), 'steel');
    car1.mesh(G.tubeX(8.7, 9.2, 0.3, 10.2, 72), 'steel');                      // tambour d'entrée de A et B (vitesse réduite)
    const ring1 = P('ps-couronne', X.ps, 0, 0, ['Couronne du réducteur (entrée)', [-4.4, 10.4, 0]]);
    ring1.mesh(G.splineRing({ Z: Z.r1, rBase: pr(Z.r1) + 0.19, rTip: pr(Z.r1) - 0.15, width: 2.4, plainR: 8.9, hTip: 0.2, hBase: 0.28, phase: this.ps.phR }), 'steel');
    ring1.mesh(G.tubeX(8.5, 8.9, -2.2, -1.2, 72), 'steel');
    ring1.mesh(washer(1.9, 8.9, -2.2, -1.9), 'steel');
    ring1.mesh(G.tubeX(0.88, 1.9, -3.0, -1.9, 40), 'steel');

    /* ===================================================== TRAIN RAVIGNEAUX */
    const ths = [0.9, 0.9 + TAU / 3, 0.9 + (2 * TAU) / 3];
    const rv = { th: ths };
    rv.phL = ths.map((t) => meshPhase(0, Z.s3, Z.pl, t));
    rv.phR = wrap((Math.PI - (ths[0] - rv.phL[0]) * Z.pl) / Z.R + ths[0]);
    rv.alS = ths.map((t) => t + DLT);
    rv.phS = ths.map((t, i) => {
      const L = [R_LONG * Math.cos(t), R_LONG * Math.sin(t)], S = [R_SHORT * Math.cos(rv.alS[i]), R_SHORT * Math.sin(rv.alS[i])];
      return meshPhase(rv.phL[i], Z.pl, Z.ps, Math.atan2(S[1] - L[1], S[0] - L[0]));
    });
    rv.ph4 = wrap(rv.alS[0] - (Math.PI - (rv.alS[0] + Math.PI - rv.phS[0]) * Z.ps) / Z.s4);
    this.rv = rv;
    const s3 = P('rv-s3', X.rvL, 0, 0, ['Grand planétaire S3', [0, 5.6, 0]]);
    s3.mesh(G.involuteGear({ Z: Z.s3, pitchR: pr(Z.s3), width: 2.8, boreR: 2.7, web: false }), 'steel');
    const s4 = P('rv-s4', X.rvR, 0, 0, ['Petit planétaire S4', [0, 4.6, 0]]);
    s4.mesh(G.involuteGear({ Z: Z.s4, pitchR: pr(Z.s4), width: 2.6, boreR: 1.9, web: false, phase: rv.ph4 }), 'steel');
    ths.forEach((t, i) => {
      const L = P(`rv-long-${i + 1}`, X.rvLong, R_LONG * Math.cos(t), R_LONG * Math.sin(t), i === 0 ? ['Satellites longs (×3)', [0, 9.6, 0]] : null);
      L.mesh(G.involuteGear({ Z: Z.pl, pitchR: pr(Z.pl), width: 5.8, boreR: 0.55 }), 'steel');
      const S = P(`rv-court-${i + 1}`, X.rvR, R_SHORT * Math.cos(rv.alS[i]), R_SHORT * Math.sin(rv.alS[i]), i === 0 ? ['Satellites courts (×3)', [0, 7.0, 0]] : null);
      S.mesh(G.involuteGear({ Z: Z.ps, pitchR: pr(Z.ps), width: 2.6, boreR: 0.4 }), 'steel');
    });
    const cr = P('rv-porte', 0, 0, 0, ['Porte-satellites du Ravigneaux', [17, -9.6, 0]]);
    cr.mesh(washer(3.3, 8.9, 13.1, 13.5), 'steel');
    cr.mesh(washer(1.3, 7.2, 19.9, 20.3), 'steel');
    cr.mesh(G.tubeX(8.6, 9.0, 10.5, 13.5, 72), 'steel');                         // tambour du frein D
    cr.mesh(G.tubeX(7.05, 7.4, 20.3, 23.6, 72), 'steel');                        // tambour de l'embrayage E
    ths.forEach((t, i) => {
      orbitGroup(cr, R_LONG, t, (g) => cr.mesh(G.cylX(0.5, 13.1, 20.3, 16), 'steel', { parent: g }));
      orbitGroup(cr, R_SHORT, rv.alS[i], (g) => cr.mesh(G.cylX(0.4, 17.0, 20.3, 16), 'steel', { parent: g }));
    });
    const rr = P('rv-couronne', X.rvL, 0, 0, ['Couronne du Ravigneaux (sortie)', [3, 9.6, 0]]);
    rr.mesh(G.splineRing({ Z: Z.R, rBase: pr(Z.R) + 0.19, rTip: pr(Z.R) - 0.15, width: 2.8, plainR: 8.7, hTip: 0.2, hBase: 0.28, phase: rv.phR }), 'steel');
    rr.mesh(G.tubeX(8.7, 9.05, 1.4, 9.4, 72), 'steel');                         // tambour de sortie
    rr.mesh(washer(2.6, 9.05, 9.2, 9.6), 'steel');
    const park = P('roue-parking', 28.5, 0, 0, ['Roue de parking (crantée)', [0, 6.3, 0]]);
    park.mesh(G.involuteGear({ Z: 32, pitchR: 4.8, width: 1.2, boreR: 2.6, web: false }), 'steel');
    const pawl = P('cliquet', 28.5, 6.9, 0, ['Cliquet de parking', [0, 9.0, 0]]);
    pawl.mesh(new THREE.BoxGeometry(0.9, 1.9, 0.8), 'steel');
    pawl.mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 16).rotateX(Math.PI / 2), 'steel', { pos: [0, 0.9, 0] });

    /* ===================================================== EMBRAYAGES A, B, E · FREINS C, D (+ pistons) */
    const pack = (id, name, x, o, lab) => { const p = P(id, x, 0, 0, [name, lab]); discStack(p, o); return p; };
    pack('emb-a', 'Embrayage A (vitesse réduite → S4)', X.a, { rA: 4.4, rB: 4.7, rC: 8.1, rD: 8.5, n: 4, gapOpen: 0.5, gapClosed: 0.37 }, [0, 10.8, 0]);
    pack('emb-b', 'Embrayage B (vitesse réduite → S3)', X.b, { rA: 4.6, rB: 4.9, rC: 8.1, rD: 8.5, n: 4, gapOpen: 0.5, gapClosed: 0.37 }, [0, 11.4, 0]);
    pack('frein-c', 'Frein C (bloque S3)', X.c, { rA: 5.0, rB: 5.3, rC: 6.9, rD: 7.3, n: 3, gapOpen: 0.5, gapClosed: 0.37 }, [0, 8.0, 0]);
    pack('frein-d', 'Frein D (bloque le porte-satellites)', X.d, { rA: 9.0, rB: 9.3, rC: 10.2, rD: 10.5, n: 3, gapOpen: 0.5, gapClosed: 0.37 }, [0, 12.4, 0]);
    pack('emb-e', 'Embrayage E (entrée → porte-satellites)', X.e, { rA: 4.9, rB: 5.2, rC: 6.6, rD: 7.0, n: 3, gapOpen: 0.5, gapClosed: 0.37 }, [0, 8.6, 0]);
    const piston = (id, name, x, rIn, rOut, lab) => {
      const p = P(id, x, 0, 0, lab ? [name, lab] : null);
      p.mesh(G.tubeX(rIn, rOut, -0.25, 0.25, 64), 'steel');
      p.mesh(G.tubeX(rIn - 0.02, rIn + 0.14, -0.3, 0.3, 64), 'rubber');
      p.mesh(G.tubeX(rOut - 0.14, rOut + 0.02, -0.3, 0.3, 64), 'rubber');
      return p;
    };
    piston('piston-a', 'Piston de A', X.pa, 4.5, 8.4, null); piston('piston-b', 'Piston de B', X.pb, 4.7, 8.4, null);
    piston('piston-c', 'Piston de C', X.pc, 5.1, 7.2, null); piston('piston-d', 'Piston de D', X.pd, 9.1, 10.4, [0, 11.4, 0]);
    piston('piston-e', 'Piston de E', X.pe, 5.0, 6.9, null);

    /* ===================================================== HYDRAULIQUE */
    const vb = P('bloc-hydraulique', 13.5, -12.0, 0, ['Bloc hydraulique (électrovannes)', [0, -15.2, 0]]);
    vb.mesh(new THREE.BoxGeometry(19, 1.4, 9.6), 'alu');
    const evs = { a: X.a, b: X.b, c: X.c, d: X.d, e: X.e, pontage: 1.5, pression: -4.0 };
    Object.entries(evs).forEach(([k, x], i) => {
      const nm = k === 'pontage' ? 'Électrovanne de pontage' : k === 'pression' ? 'Électrovanne de pression de ligne' : `Électrovanne ${k.toUpperCase()}`;
      const ev = P(`ev-${k}`, x, -13.0, (i % 2 ? 2.8 : -2.8), [nm, [0, -2.0, 0]]);
      ev.mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 20), 'steel');
      ev.mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 14), 'rubber', { pos: [0, -1.0, 0] });
    });
    const feed = { a: X.a, b: X.b, c: X.c, d: X.d, e: X.e }, rOut = { a: 8.5, b: 8.5, c: 7.3, d: 10.5, e: 7.0 };
    Object.entries(feed).forEach(([k, x]) => {
      const L = 11.3 - rOut[k], c = P(`conduite-${k}`, x, -(11.3 + rOut[k]) / 2, 0, null);
      c.mesh(new THREE.CylinderGeometry(0.2, 0.2, L, 12), 'steel');
    });
    const cp = P('conduite-pontage', -1.0, -11.6, -3.0, null);
    cp.mesh(new THREE.CylinderGeometry(0.2, 0.2, 13.0, 12).rotateZ(Math.PI / 2), 'steel');
    const fil = P('filtre', 8.0, -14.8, 0, ['Filtre à huile (crépine)', [0, -17.2, 0]]);
    fil.mesh(new THREE.BoxGeometry(6.4, 1.0, 5.6), 'rubber');
    fil.mesh(new THREE.BoxGeometry(5.6, 0.5, 4.8), 'friction', { pos: [0, 0.6, 0] });
    const pan = P('carter-huile', 13.5, -15.9, 0, ['Carter d\'huile', [-5, -18.4, 0]], { housing: true });
    pan.mesh(new THREE.BoxGeometry(21, 0.4, 13), 'alu', { pos: [0, -1.4, 0] });
    for (const sz of [-1, 1]) pan.mesh(new THREE.BoxGeometry(21, 3.0, 0.4), 'alu', { pos: [0, 0.1, sz * 6.3] });
    for (const sx of [-1, 1]) pan.mesh(new THREE.BoxGeometry(0.4, 3.0, 13), 'alu', { pos: [sx * 10.3, 0.1, 0] });

    /* ===================================================== CARTERS */
    this.mk('carter-bva', 0, 0, 0, ['Carter de boîte', [20, 12.2, 0]], { housing: true })
      .mesh(G.hullTube({ circles: [{ y: 0, z: 0, r: 11.0 }], wall: 0.45, x0: -7.8, x1: 34 }), 'alu');
    this.mk('carter-convertisseur', 0, 0, 0, ['Cloche de convertisseur', [-16, 15.8, 0]], { housing: true })
      .mesh(G.hullTube({ circles: [{ y: 0, z: 0, r: 14.2 }], wall: 0.45, x0: -25.2, x1: -7.6 }), 'alu');
  }

  makePlan() {
    this.step('Déposer la cloche et le carter de boîte', [{ id: 'carter-convertisseur', v: [-8, 0, 26] }, { id: 'carter-bva', v: [0, 0, 30] }]);
    this.step('Déposer le carter d\'huile, le filtre et le bloc hydraulique', [{ id: 'carter-huile', v: [0, -16, 0] }, { id: 'filtre', v: [0, -11, 0] }, { id: 'bloc-hydraulique', v: [0, -8, 0] },
      ...['a', 'b', 'c', 'd', 'e', 'pontage', 'pression'].map((k) => ({ id: `ev-${k}`, v: [0, -8, 0] })), ...['a', 'b', 'c', 'd', 'e', 'pontage'].map((k) => ({ id: `conduite-${k}`, v: [0, -8, 0] }))]);
    this.step('Déposer le parking et l\'arbre de sortie', [{ id: 'cliquet', v: [0, 8, 0] }, { id: 'roue-parking', v: [14, 0, 0] }, { id: 'arbre-sortie', v: [20, 0, 0] }]);
    this.step('Déposer l\'embrayage E et son piston', [{ id: 'piston-e', v: [16, 0, 0] }, { id: 'emb-e', v: [14, 0, 0] }, { id: 'arbre-turbine', v: [0, 0, -0.01] }]);
    this.step('Déposer la couronne et le Ravigneaux', [{ id: 'rv-couronne', v: [10, 0, 0] }, { id: 'rv-porte', v: [12, 0, 0] },
      ...[1, 2, 3].flatMap((i) => [{ id: `rv-long-${i}`, v: [8, 0, 0] }, { id: `rv-court-${i}`, v: [8, 0, 0] }]), { id: 'rv-s4', v: [14, 0, 0] }, { id: 'rv-s3', v: [6, 0, 0] }]);
    this.step('Déposer les freins C et D', [{ id: 'piston-d', v: [-6, 0, 0] }, { id: 'frein-d', v: [0, 0, 14] }, { id: 'piston-c', v: [8, 0, 0] }, { id: 'frein-c', v: [0, 0, -14] }]);
    this.step('Déposer l\'embrayage B et l\'arbre de S3', [{ id: 'piston-b', v: [0, 0, 16] }, { id: 'emb-b', v: [0, 0, 14] }, { id: 'arbre-s3', v: [0, 0, -10] }]);
    this.step('Déposer l\'embrayage A et l\'arbre de S4', [{ id: 'piston-a', v: [0, 0, 18] }, { id: 'emb-a', v: [0, 0, 16] }, { id: 'arbre-s4', v: [0, 0, -14] }]);
    this.step('Déposer le train réducteur et la pompe', [{ id: 'ps-couronne', v: [-10, 0, 0] }, { id: 'ps-porte', v: [8, 0, 0] },
      ...[1, 2, 3].map((i) => ({ id: `ps-sat-${i}`, v: [0, 0, 10] })), { id: 'ps-soleil', v: [-6, 0, 0] }, { id: 'pompe-rotor-int', v: [-8, 0, 8] }, { id: 'pompe-rotor-ext', v: [-8, 0, -8] }, { id: 'pompe-corps', v: [-6, 0, 0] }]);
    this.step('Séparer le convertisseur', [{ id: 'cv-capot', v: [-12, 0, 0] }, { id: 'cv-flexplate', v: [-18, 0, 0] }, { id: 'cv-pontage', v: [-10, 0, 0] }, { id: 'cv-amortisseur', v: [-8, 0, 0] },
      { id: 'cv-turbine', v: [-6, 0, 0] }, { id: 'cv-stator', v: [0, 0, 8] }, { id: 'cv-roue-libre', v: [0, 0, -8] }, { id: 'cv-impulseur', v: [6, 0, 0] }, { id: 'arbre-stator', v: [0, 0, -10] }]);
  }

  /* ------------------------------------------------------------------ animation */
  pose(sim, dt) {
    const a = sim.ang, p = this.parts;
    const eng = a.eng, turb = a.turb;
    p['cv-flexplate'].rotX = eng; p['cv-capot'].rotX = eng; p['cv-impulseur'].rotX = eng; p['pompe-rotor-int'].rotX = eng; p['pompe-rotor-ext'].rotX = (eng * 24) / 30;
    p['cv-turbine'].rotX = turb; p['arbre-turbine'].rotX = turb; p['cv-amortisseur'].rotX = turb;
    p['cv-pontage'].rotX = turb; p['cv-pontage'].slide = -1.25 * sim.lu + 0.04 * sim.shudder;
    p['cv-stator'].rotX = a.stator; p['cv-roue-libre'].rotX = a.stator;
    // train réducteur : soleil fixe, couronne = turbine, porte-satellites = vitesse réduite
    p['ps-couronne'].rotX = turb; p['ps-porte'].rotX = a.red; p['ps-soleil'].rotX = 0;
    this.ps.th.forEach((t0, i) => {
      const s = p[`ps-sat-${i + 1}`], th = t0 + a.red;
      s.base.set(X.ps, R_PS * Math.cos(th), R_PS * Math.sin(th));
      s.rotX = this.ps.phS[i] + a.red * (1 + Z.s1 / Z.p1);
    });
    // Ravigneaux
    p['rv-s3'].rotX = a.s3; p['rv-s4'].rotX = a.s4; p['arbre-s3'].rotX = a.s3; p['arbre-s4'].rotX = a.s4;
    p['rv-porte'].rotX = a.c; p['rv-couronne'].rotX = a.r; p['arbre-sortie'].rotX = a.r; p['roue-parking'].rotX = a.r;
    this.rv.th.forEach((t0, i) => {
      const L = p[`rv-long-${i + 1}`], S = p[`rv-court-${i + 1}`];
      const tl = t0 + a.c, ts = this.rv.alS[i] + a.c;
      L.base.set(X.rvLong, R_LONG * Math.cos(tl), R_LONG * Math.sin(tl));
      L.rotX = this.rv.phL[i] + a.c - (a.s3 - a.c) * (Z.s3 / Z.pl);
      S.base.set(X.rvR, R_SHORT * Math.cos(ts), R_SHORT * Math.sin(ts));
      S.rotX = this.rv.phS[i] + a.c - (a.s4 - a.c) * (Z.s4 / Z.ps);
    });
    // éléments de commande : (disques lisses = côté « tambour/carter », garnis = côté « moyeu »)
    const L = sim.lv, F = sim.fill;
    const set = (id, lvl, inner, outer) => { const q = p[id]; setStack(q, lvl); q.rig.gI.rotation.x = inner; q.rig.gO.rotation.x = outer; };
    set('emb-a', L.a, a.s4, a.red); set('emb-b', L.b, a.s3, a.red); set('frein-c', L.c, a.s3, 0); set('frein-d', L.d, a.c, 0); set('emb-e', L.e, a.turb, a.c);
    const pis = (id, e, side, rot) => { const q = p[id]; q.slide = side * 0.62 * Math.max(F[e], L[e]); q.rotX = rot; };
    pis('piston-a', 'a', 1, a.red); pis('piston-b', 'b', 1, a.red); pis('piston-c', 'c', -1, 0); pis('piston-d', 'd', 1, 0); pis('piston-e', 'e', -1, a.c);
    // parking : le cliquet s'engage sur la roue crantée en position P
    p['cliquet'].base.y = sim.gear === 'P' ? 5.9 : 7.1;
    for (const id in p) p[id].apply();
  }

  /* ------------------------------------------------------------------ couleurs normalisées */
  style(sim, o) {
    const g = sim.gear, drive = typeof g === 'number' || g === 'R';
    const act = new Set(drive || sim.shift ? [...(TABLE[g] || []), ...(sim.shift ? [...TABLE[sim.shift.to], ...TABLE[sim.shift.from]] : [])] : []);
    const path = new Set();
    if (drive && Math.abs(sim.n.turb) > 20) {
      ['cv-flexplate', 'cv-capot', 'cv-impulseur', 'cv-turbine', 'arbre-turbine', 'ps-couronne', 'ps-porte', 'rv-porte', 'rv-couronne', 'arbre-sortie', 'roue-parking']
        .forEach((x) => path.add(x));
      [1, 2, 3].forEach((i) => { path.add(`ps-sat-${i}`); path.add(`rv-long-${i}`); path.add(`rv-court-${i}`); });
      if (act.has('a')) { path.add('arbre-s4'); path.add('rv-s4'); }
      if (act.has('b')) { path.add('arbre-s3'); path.add('rv-s3'); }
      if (act.has('c')) { path.add('arbre-s3'); path.add('rv-s3'); }
    }
    const idle = new Set(['arbre-turbine', 'ps-couronne', 'cv-turbine']);
    this.styleGeneric(o, (part, st) => {
      const id = part.id;
      if (/^(emb|frein)-[a-e]$/.test(id)) {
        const k = id.slice(-1), lvl = sim.lv[k], sl = sim.slipEl[k];
        if (sl > 0.12) { st.emissive = SSP.alerte; st.ei = 0.35 + 0.6 * sl * (0.6 + 0.4 * Math.sin(o.time * 14)); }
        else if (lvl > 0.04) { st.emissive = SSP.couple; st.ei = 0.25 + lvl * 0.9; }
        else if (o.ssp && (k === 'c' || k === 'd')) { st.tint = SSP.fou; st.tintAmt = 0.15; }
      } else if (/^piston-[a-e]$/.test(id)) {
        const k = id.slice(-1), lvl = Math.max(sim.lv[k], sim.fill[k] * 0.6);
        if (lvl > 0.04) { st.emissive = SSP.couple; st.ei = 0.2 + lvl * 0.7; }
      } else if (/^conduite-[a-e]$/.test(id)) {
        const k = id.slice(-1), lvl = sim.lv[k];
        if (lvl > 0.04) { st.emissive = SSP.couple; st.ei = 0.5 + lvl * 0.9; } else if (o.ssp) { st.emissive = SSP.lub; st.ei = 0.35; }
      } else if (id === 'conduite-pontage') {
        if (sim.lu > 0.04) { st.emissive = SSP.couple; st.ei = 0.5 + sim.lu * 0.9; } else if (o.ssp) { st.emissive = SSP.lub; st.ei = 0.35; }
      } else if (/^ev-[a-e]$/.test(id)) {
        if (sim.cmd[id.slice(-1)] > 0.5) { st.emissive = SSP.commande; st.ei = 0.7; }
      } else if (id === 'ev-pontage') { if (sim.lu > 0.05) { st.emissive = SSP.commande; st.ei = 0.7; } }
      else if (id === 'ev-pression') { st.emissive = SSP.commande; st.ei = 0.25 + 0.5 * Math.min(1, sim.pLine / 12); }
      else if (id === 'cv-pontage') {
        if (sim.lu > 0.05) { st.emissive = SSP.couple; st.ei = 0.3 + 0.8 * sim.lu; }
      } else if (id === 'cv-roue-libre') {
        if (sim.stator === 'locked') { st.emissive = SSP.couple; st.ei = 0.6; } else if (o.ssp) { st.tint = SSP.fou; st.tintAmt = 0.6; }
      } else if (id === 'cv-stator') {
        if (o.ssp) { if (sim.stator === 'locked') { st.tint = SSP.couple; st.tintAmt = 0.25; } else { st.tint = SSP.fou; st.tintAmt = 0.5; } }
      } else if (o.ssp && sim.flow().level > 0.05 && path.has(id)) { st.emissive = sim.load === 'decel' ? 0xff2a00 : SSP.couple; st.ei = 0.05 + 0.13 * sim.flow().level; }
      else if (o.ssp && !drive && idle.has(id)) { st.tint = SSP.fou; st.tintAmt = 0.5; }
      if (id === 'rv-porte' && o.ssp && sim.lv.d > 0.5) { st.tint = SSP.fou; st.tintAmt = 0.15; }
    });
  }

  views() {
    return {
      global: { target: V3(4, 8, 0), pos: V3(12, 30, 90), fitW: 74, fitH: 46 },
      loupe: {}, diff: null,
      conv: { target: V3(-14, 2, 0), pos: V3(-10, 14, 40) },
      trains: { target: V3(8, 2, 0), pos: V3(9, 16, 44) },
      emb: { target: V3(8, 2, 0), pos: V3(9, 14, 34) },
      hydro: { target: V3(10, -6, 0), pos: V3(12, 2, 40) },
      clutch: { target: V3(8, 3, 0), pos: V3(10, 20, 40) },
    };
  }
}
