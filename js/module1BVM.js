/* ============================================================================
 * module1BVM.js — MODULE 1 : Boîte de vitesses manuelle 5 rapports + AR + différentiel
 *                 (type traction avant PSA BE4 / Renault JC5)
 *  - Construction procédurale de toutes les pièces (arbres, pignons, synchros, pont…)
 *  - Rig d'animation piloté par GearboxSim (rotations exactes, courses de baladeurs…)
 *  - Plan de vue éclatée dans l'ordre de démontage atelier
 *  - Coloration normalisée SSP (couple = orange, lubrification = bleu, commande = vert, gris = fou)
 * ========================================================================== */
import * as THREE from 'three';
import {
  GEAR_PAIRS, REV, FD, DIFF, SPLINE_Z, SPLINE_PITCH, A, AXIS, PAIR, X, SYN, SYNC_OF, SYNC_KEYS,
  PHASE, R_PIN, R_CROWN, TAU,
} from './layout.js';
import { Part } from './partBase.js';
import * as G from './gearsBuilder.js';
import { SSP } from './materials.js';
import { GearboxSim } from './kinematics.js';
import { groupsBVM } from './groups.js';

const { P, S, I, D } = AXIS;
const SKIP_HUB = SYN.keyTeeth;                       // dents supprimées sur le moyeu / anneau
const SKIP_SLEEVE = [23, 0, 7, 8, 15, 16];            // baladeur : logements des clavettes
const GROOVE = { 12: 0.725, 34: 0, 5: 0 };            // position de la gorge de fourchette / centre du baladeur
const RAIL_ANGLE = { 12: 115, 34: 135, 5: 155 };      // direction des axes de fourchettes (°, plan y-z)
const RAIL_R = 5.6;
const coneR = (d) => 2.38 - 0.12 * (d - 0.55);        // rayon du cône mâle du pignon fou (d = distance à la face)
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (t) => t * t * (3 - 2 * t);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export class Module1 {
  constructor() {
    this.id = 'bvm';
    this.title = 'Module 1 · BVM 5 rapports + AR + différentiel';
    this.root = new THREE.Group();
    this.root.name = 'module1';
    this.parts = {};
    this.sim = new GearboxSim();
    this.gearList = ['N', 1, 2, 3, 4, 5, 'R'];
    this.groups = groupsBVM();
    this.build();
    this.buildOil();
    this.explodePlan = this.makeExplodePlan();
  }

  add(part) { this.parts[part.id] = part; this.root.add(part.group); return part; }
  mk(id, x, y, z, label) { return this.add(new Part(id, x, y, z, { label: label ? { text: label[0], off: label[1] } : null })); }

  /* ====================================================================== */
  build() {
    this.buildShafts();
    this.buildGears();
    this.buildSynchros();
    this.buildForks();
    this.buildReverse();
    this.buildBearings();
    this.buildFinalDrive();
    this.buildClutch();
    this.buildHousings();
    this.buildMisc();
  }

  /* ---------------------------- arbres ---------------------------- */
  buildShafts() {
    const p = this.mk('arbre-primaire', 0, P.y, 0, ['Arbre primaire', [-6.4, 1.8, 0]]);
    p.mesh(G.latheX([[X.primStart, 0], [X.primStart, 0.85], [-4.5, 0.85], [-4.5, 1.0], [4.1, 1.0], [4.1, 1.1],
      [25.9, 1.1], [25.9, 1.0], [27.7, 1.0], [27.7, 0.85], [X.shaftEnd, 0.85], [X.shaftEnd, 0]], 40), 'steel');
    p.mesh(G.splineRing({ Z: 20, rBase: 0.85, rTip: 1.05, width: 3.2, plainR: 0.5, chamfer: 'both', cLen: 0.2 }), 'steel', { pos: [-6.4, 0, 0] });

    // Arbre secondaire CREUX lubrifié (alésage Ø11 mm pour l'huile)
    const s = this.mk('arbre-secondaire', 0, S.y, 0, ['Arbre secondaire (creux, lubrifié)', [15.5, -2.2, 0]]);
    s.mesh(G.latheX([[X.secStart, 0.55], [X.secStart, 1.3], [2.45, 1.3], [2.45, 1.5], [4.15, 1.5], [4.15, 1.6], [25.9, 1.6],
      [25.9, 1.5], [X.shaftEnd, 1.5], [X.shaftEnd, 0.55]], 44), 'steel');
  }

  /* ---------------------------- pignons ---------------------------- */
  buildGears() {
    for (const k of [1, 2, 3, 4, 5]) {
      const { Zp, Zs } = GEAR_PAIRS[k], pr = PAIR[k];
      // Pignon FIXE du primaire (taillé dans la masse / claveté) — hélicoïdal main +
      const p = this.mk(`p-${k}`, X.g[k], P.y, 0, [`Pignon fixe ${k}`, [0, pr.rp + 0.7, 0]]);
      p.mesh(G.involuteGear({ Z: Zp, pitchR: pr.rp, width: X.gW, boreR: 0.9, helixDeg: 22, hand: +1, layers: 6 }), 'steel');

      // Pignon FOU du secondaire (Z mené) sur cage à aiguilles, avec cône mâle + crabots
      const { side } = SYNC_OF[k];
      const s = this.mk(`s-${k}`, X.g[k], S.y, 0, [`Pignon fou ${k}`, [0, -(pr.rs + 0.7), 0]]);
      s.mesh(G.involuteGear({ Z: Zs, pitchR: pr.rs, width: X.gW, boreR: SYN.boreGear, helixDeg: 22, hand: -1, layers: 6 }), 'steel');
      const dogC = side * (X.gW / 2 + SYN.dogLen / 2);
      s.mesh(G.splineRing({ Z: SPLINE_Z, rBase: SYN.splRoot, rTip: SYN.splTip, width: SYN.dogLen, plainR: SYN.boreGear,
        chamfer: side > 0 ? '+' : '-', cLen: 0.2, cScale: 0.4 }), 'steel', { pos: [dogC, 0, 0] });
      const x1 = side * (X.gW / 2 + SYN.dogLen), x2 = side * (X.gW / 2 + SYN.dogLen + SYN.coneLen);
      s.mesh(G.latheX([[x1, SYN.boreGear], [x1, coneR(SYN.dogLen)], [x2, coneR(SYN.dogLen + SYN.coneLen)], [x2, SYN.boreGear]], 44), 'steel');

      // Cage à aiguilles (aiguilles instanciées) entre arbre et pignon fou
      const n = this.mk(`aiguilles-${k}`, X.g[k], S.y, 0, null);
      const b = G.bearingGeo({ rIn: SYN.shaftR, rOut: SYN.boreGear, width: 1.5, type: 'needle', n: 34, races: false });
      const cage = new THREE.Group(); n.group.add(cage);
      n.instanced(b.elemGeo, b.matrices, 'chrome', { parent: cage });
      n.ghost(b.ghost, 'chrome');
      n.rig = { cage, rIn: SYN.shaftR, rOut: SYN.boreGear };
    }
    // Pignon de marche arrière du primaire : denture DROITE (grondement caractéristique de l'AR)
    const span = X.rpinSpan, rc = (span[0] + span[1]) / 2;
    const r = this.mk('p-AR', rc, P.y, 0, ['Pignon AR (primaire)', [0, 2.3, 0]]);
    r.mesh(G.involuteGear({ Z: REV.Zr, pitchR: REV.Zr * 0.1, width: span[1] - span[0], boreR: 0.8, helixDeg: 0 }), 'steel');
  }

  /* ---------------------------- synchroniseurs (Borg-Warner) ---------------------------- */
  buildSynchros() {
    for (const key of SYNC_KEYS) {
      const hx = X.hub[key];
      // 1. Moyeu cannelé solidaire de l'arbre secondaire
      const hub = this.mk(`moyeu-${key}`, hx, S.y, 0, [`Moyeu ${this.sname(key)}`, [0, -3.4, 0]]);
      hub.mesh(G.splineRing({ Z: SPLINE_Z, rBase: SYN.splRoot, rTip: SYN.splTip, width: X.hubW, plainR: 1.5, skip: SKIP_HUB }), 'steel');

      // 2. Baladeur à denture intérieure avec gorge de fourchette (chanfreins d'entrée)
      const sl = this.mk(`baladeur-${key}`, hx, S.y, 0, [`Baladeur ${this.sname(key)}`, [0, 3.9, 0]]);
      const w = X.sleeveW;
      sl.mesh(G.splineRing({ Z: SPLINE_Z, rBase: 2.94, rTip: SYN.splRoot + 0.02, width: w, plainR: SYN.sleeveGroove, phase: SPLINE_PITCH / 2,
        skip: SKIP_SLEEVE, chamfer: 'both', cLen: 0.22, cScale: 0.5 }), 'steel');
      const fl = (a, b) => sl.mesh(G.tubeX(SYN.sleeveGroove, SYN.sleeveOuter, a, b, 48), 'steel');
      if (key === 12) {
        fl(-1.05, -0.35); fl(0.35, 0.5); fl(0.95, 1.05);
        // couronne d'AR taillée sur le baladeur 1/2 (denture droite Z=44) : l'AR engrène ici
        sl.mesh(G.involuteGear({ Z: REV.Zring, pitchR: REV.Zring * 0.1, width: 0.7, boreR: 3.3, helixDeg: 0, phase: PHASE.ring }), 'steel');
      } else { fl(-1.05, -0.3); fl(0.3, 1.05); }

      // 3. Trois clavettes de verrouillage (loquets)
      const kc = this.mk(`clavettes-${key}`, hx, S.y, 0, [`Clavettes ${this.sname(key)}`, [0, 3.2, 1.5]]);
      kc.rig.keys = [];
      for (const a of SYN.keyAngles) {
        const g = new THREE.Group();
        g.rotation.x = a;
        g.position.set(0, 2.75 * Math.cos(a), 2.75 * Math.sin(a));
        kc.group.add(g);
        kc.mesh(new THREE.BoxGeometry(2.1, 0.3, 0.6), 'steel', { parent: g });
        kc.mesh(new THREE.BoxGeometry(0.5, 0.14, 0.5), 'steel', { parent: g, pos: [0, 0.2, 0] });
        kc.rig.keys.push({ g, a });
      }
      // 4. Deux ressorts annulaires (sous les clavettes)
      const rs = this.mk(`ressorts-${key}`, hx, S.y, 0, null);
      rs.mesh(G.circlipGeo(2.5, 0.07, 0.9), 'steel', { pos: [-0.8, 0, 0], noCap: true });
      rs.mesh(G.circlipGeo(2.5, 0.07, 0.9), 'steel', { pos: [0.8, 0, 0], noCap: true });
      // Circlip d'arrêt de moyeu + cale (rondelle de calage)
      const cc = this.mk(`circlip-moyeu-${key}`, hx + 0.9, S.y, 0, null);
      cc.mesh(G.circlipGeo(1.72, 0.09, 0.92), 'steel', { noCap: true });
      const cl = this.mk(`cale-${key}`, hx - 0.84, S.y, 0, null);
      cl.mesh(G.washerX(1.62, 2.2, -0.05, 0.05, 0.015, 40), 'steel');
    }
    // 5. Anneaux de synchro en laiton : cône de friction interne + dents d'arrêt chanfreinées + encoches de clavettes
    for (const k of [1, 2, 3, 4, 5]) {
      const { key, side } = SYNC_OF[k];
      const xRest = X.g[k] + side * (X.gW / 2 + 1.05);
      const r = this.mk(`bague-${k}`, xRest, S.y, 0, [`Anneau laiton ${k}`, [0, -3.5, 1.2]]);
      const e0 = 0, e1 = 0.5, d0 = 0.64;
      const rin = (e) => coneR(d0 + e) + 0.01;
      r.mesh(G.latheX([[side * (e0 - 0.25), rin(e0)], [side * (e1 - 0.25), rin(e1)], [side * (e1 - 0.25), SYN.ringOuter], [side * (e0 - 0.25), SYN.ringOuter]], 44), 'brass');
      r.mesh(G.splineRing({ Z: SPLINE_Z, rBase: 2.6, rTip: SYN.splTip, width: 0.3, plainR: 2.4, skip: SKIP_HUB, chamfer: 'both', cLen: 0.1, cScale: 0.3 }), 'brass', { pos: [side * 0.1, 0, 0] });
    }
  }
  sname(key) { return key === 12 ? '1/2' : key === 34 ? '3/4' : '5'; }

  /* ---------------------------- fourchettes / axes ---------------------------- */
  buildForks() {
    for (const key of SYNC_KEYS) {
      const psi = (RAIL_ANGLE[key] * Math.PI) / 180;
      const hx = X.hub[key];
      const ry = S.y + RAIL_R * Math.cos(psi), rz = RAIL_R * Math.sin(psi);
      // Axe de fourchette (fixe)
      const x0 = key === 5 ? hx - 1.9 : hx - 2.1, x1 = key === 5 ? hx + 2.0 : hx + 2.1;
      const ax = this.mk(`axe-fourchette-${key}`, 0, ry, rz, null);
      ax.mesh(G.cylX(0.3, x0, x1, 20), 'steel');
      // Fourchette : arc en C dans la gorge du baladeur + bras + coulisseau
      const f = this.mk(`fourchette-${key}`, hx + GROOVE[key], S.y, 0, [`Fourchette ${this.sname(key)}`, [0, RAIL_R * Math.cos(psi) + 0.3, RAIL_R * Math.sin(psi)]]);
      const fp = G.forkParts({ Ri: 3.2, Ro: 3.75, thick: 0.34, spanDeg: 215, armR: RAIL_R });
      f.mesh(fp.ring, 'steel'); f.mesh(fp.arm, 'steel'); f.mesh(fp.boss, 'steel');
      f.rotX = psi;
    }
  }

  /* ---------------------------- marche arrière ---------------------------- */
  buildReverse() {
    const idl = this.mk('pignon-ar-baladeur', X.idlerNeutral, I.y, I.z, ['Baladeur AR', [0, 2.4, 0]]);
    idl.mesh(G.involuteGear({ Z: REV.Zi, pitchR: REV.Zi * 0.1, width: X.idlerW, boreR: 0.6, helixDeg: 0 }), 'steel');
    idl.mesh(G.tubeX(0.6, 1.25, 0.5, 1.1, 40), 'steel');
    const ax = this.mk('arbre-renvoi', 0, I.y, I.z, ['Arbre de renvoi AR', [6, 0.9, 0]]);
    ax.mesh(G.cylX(0.55, 5.5, 12.0, 24), 'steel');
    const f = this.mk('fourchette-ar', X.idlerNeutral + 0.8, I.y, I.z, null);
    const fp = G.forkParts({ Ri: 1.3, Ro: 1.75, thick: 0.34, spanDeg: 200, armR: 2.55, armW: 0.5 });
    f.mesh(fp.ring, 'steel'); f.mesh(fp.arm, 'steel'); f.mesh(fp.boss, 'steel');
    f.rotX = -Math.PI / 2;
  }

  /* ---------------------------- roulements / spi ---------------------------- */
  buildBearings() {
    const mkB = (id, x, y, z, o, label) => {
      const p = this.mk(id, x, y, z, label);
      const b = G.bearingGeo(o);
      const innerG = new THREE.Group(), cageG = new THREE.Group();
      p.group.add(innerG, cageG);
      p.mesh(b.inner, 'chrome', { parent: innerG });
      p.mesh(b.outer, 'chrome');
      p.instanced(b.elemGeo, b.matrices, 'chrome', { parent: cageG });
      p.ghost(b.ghost, 'chrome');
      p.rig = { innerG, cageG, frac: b.r0 / (b.r0 + b.r1) };
      return p;
    };
    mkB('rlt-prim-av', X.bearingFront, P.y, 0, { rIn: 1.0, rOut: 2.4, width: 1.3, type: 'ball', n: 11 }, ['Roulement primaire AV', [0, 2.7, 0]]);
    mkB('rlt-sec-av', X.bearingFront, S.y, 0, { rIn: 1.5, rOut: 2.9, width: 1.7, type: 'roller', n: 17 }, ['Roulement secondaire AV', [0, -3.2, 0]]);
    mkB('rlt-prim-ar', X.bearingRear, P.y, 0, { rIn: 1.0, rOut: 2.3, width: 1.3, type: 'ball', n: 11 }, ['Roulement primaire AR', [0, 2.6, 0]]);
    mkB('rlt-sec-ar', X.bearingRear, S.y, 0, { rIn: 1.5, rOut: 2.8, width: 1.5, type: 'ball', n: 12 }, ['Roulement secondaire AR', [0, -3.1, 0]]);
    mkB('rlt-diff-g', X.diff.bearL, D.y, D.z, { rIn: 1.5, rOut: 2.6, width: 1.3, type: 'roller', n: 16 }, ['Roulement diff. G', [0, 2.9, 0]]);
    mkB('rlt-diff-d', X.diff.bearR, D.y, D.z, { rIn: 1.5, rOut: 2.6, width: 1.3, type: 'roller', n: 16 }, ['Roulement diff. D', [0, 2.9, 0]]);
    // circlips + cales de réglage des roulements arrière
    for (const [id, y, r] of [['prim-ar', P.y, 1.12], ['sec-ar', S.y, 1.62]]) {
      this.mk(`circlip-${id}`, X.bearingRear + 0.95, y, 0).mesh(G.circlipGeo(r, 0.09, 0.92), 'steel', { noCap: true });
      this.mk(`cale-${id}`, X.bearingRear - 0.85, y, 0).mesh(G.washerX(r - 0.05, r + 0.55, -0.05, 0.05, 0.015, 36), 'steel');
    }
    // Spi : élastomère noir mat
    this.mk('spi-primaire', -3.2, P.y, 0, ['Spi d\'arbre primaire', [0, 2.3, 0]]).mesh(G.sealGeo(1.0, 2.0), 'rubber');
    this.mk('spi-diff-g', -4.6, D.y, D.z, null).mesh(G.sealGeo(0.6, 1.7), 'rubber');
    this.mk('spi-diff-d', 4.8, D.y, D.z, null).mesh(G.sealGeo(0.6, 1.7), 'rubber');
  }

  /* ---------------------------- couple conique + différentiel ---------------------------- */
  buildFinalDrive() {
    const pin = this.mk('pignon-attaque', X.pin, S.y, 0, ['Pignon d\'attaque', [0, -2.7, 0]]);
    pin.mesh(G.involuteGear({ Z: FD.Zpin, pitchR: R_PIN, width: X.pinW, boreR: 1.3, helixDeg: 22, hand: +1, layers: 6 }), 'steel');
    const cr = this.mk('couronne', X.pin, D.y, D.z, ['Couronne de pont', [0, 8.4, 0]]);
    cr.mesh(G.involuteGear({ Z: FD.Zcrown, pitchR: R_CROWN, width: 1.8, boreR: 3.3, helixDeg: 22, hand: -1, layers: 6 }), 'steel');

    // Boîtier de différentiel : coque creuse de révolution
    const O = X.diff.O;
    const bx = this.mk('boitier-diff', O, D.y, D.z, ['Boîtier de différentiel', [0, 3.9, 0]]);
    bx.mesh(G.latheX([
      [-3.6, 1.2], [-3.6, 1.5], [-2.1, 1.5], [-1.7, 2.6], [-1.2, 3.2], [-0.4, 3.5], [1.0, 3.5], [1.6, 3.3], [2.0, 2.6], [2.3, 1.6], [3.8, 1.5], [3.8, 1.2],
      [2.0, 1.2], [1.95, 2.3], [1.5, 2.95], [1.0, 3.15], [-0.4, 3.15], [-1.1, 2.9], [-1.5, 2.4], [-1.85, 1.3],
    ], 56), 'alu');

    // Satellites (coniques Z=10) sur l'axe de satellites, planétaires (Z=14) sur les arbres de transmission
    const dp = Math.atan2(DIFF.Zplan, DIFF.Zsat) * 180 / Math.PI;      // 54,46°
    const ds = 90 - dp;
    const pl = G.bevelGear({ Z: DIFF.Zplan, pitchR: 1.55, deltaDeg: dp, bore: 0.58, hubR: 0.9, hubLen: 0.45, toothH: 0.3 });
    const sa = G.bevelGear({ Z: DIFF.Zsat, pitchR: pl.L * Math.sin(ds * Math.PI / 180), deltaDeg: ds, bore: 0.28, hubR: 0.55, hubLen: 0.3, toothH: 0.3 });
    for (const [side, id, lab] of [[-1, 'planetaire-g', 'Planétaire G'], [1, 'planetaire-d', 'Planétaire D']]) {
      const p = this.mk(id, O, D.y, D.z, [lab, [side * 1.4, 2.3, 0]]);
      const g = new THREE.Group();
      if (side < 0) g.rotation.y = Math.PI;
      p.group.add(g);
      p.mesh(pl.body, 'steel', { parent: g });
      p.instanced(pl.tooth, pl.matrices, 'steel', { parent: g });
    }
    const sat = this.mk('satellites', O, D.y, D.z, ['Satellites', [0, 0, 2.6]]);
    sat.rig.spin = [];
    for (const sgn of [1, -1]) {
      const orient = new THREE.Group(); orient.rotation.z = sgn * Math.PI / 2;
      const spin = new THREE.Group(); orient.add(spin); sat.group.add(orient);
      sat.mesh(sa.body, 'steel', { parent: spin });
      sat.instanced(sa.tooth, sa.matrices, 'steel', { parent: spin });
      sat.rig.spin.push({ spin, sgn });
    }
    const axe = this.mk('axe-satellites', O, D.y, D.z, null);
    axe.mesh(G.cylX(0.28, -2.15, 2.15, 20), 'steel', { parent: (() => { const g = new THREE.Group(); g.rotation.z = Math.PI / 2; axe.group.add(g); return g; })() });

    // Arbres de transmission (cardans) — cannelés dans les planétaires
    this.mk('arbre-transm-g', 0, D.y, D.z, ['Arbre de transmission G', [-5.5, 1.3, 0]]).mesh(G.cylX(0.58, -8.2, O - 0.75, 24), 'steel');
    this.mk('arbre-transm-d', 0, D.y, D.z, ['Arbre de transmission D', [5.5, 1.3, 0]]).mesh(G.cylX(0.58, O + 0.75, 6.4, 24), 'steel');
  }

  /* ---------------------------- embrayage ---------------------------- */
  buildClutch() {
    const vol = this.mk('volant-moteur', 0, P.y, 0, ['Volant moteur', [-8.5, 10.5, 0]]);
    vol.mesh(G.latheX([[-9.4, 0.6], [-9.4, 10.2], [-7.7, 10.2], [-7.7, 0.6]], 64), 'steel');
    const dq = this.mk('disque-embrayage', 0, P.y, 0, ['Disque d\'embrayage', [-6.7, 9.4, 0]]);
    dq.mesh(G.tubeX(0.85, 2.2, -7.8, -5.9, 32), 'steel');
    dq.mesh(G.tubeX(2.2, 5.6, -7.1, -6.8, 56), 'steel');
    dq.mesh(G.tubeX(5.5, 9.0, -7.5, -6.4, 64), 'friction');
    const mec = this.mk('mecanisme-embrayage', 0, P.y, 0, ['Mécanisme d\'embrayage', [-4.8, 10.6, 0]]);
    mec.mesh(G.tubeX(5.5, 9.2, -6.3, -5.6, 64), 'steel');
    mec.mesh(G.latheX([[-6.4, 9.5], [-6.4, 10.1], [-3.5, 10.1], [-3.5, 3.2], [-3.8, 3.2], [-3.8, 9.5]], 64), 'steel');
  }

  /* ---------------------------- carters ---------------------------- */
  buildHousings() {
    const bell = [{ y: P.y, z: 0, r: 12.2 }, { y: S.y, z: 0, r: 9.4 }, { y: D.y, z: D.z, r: R_CROWN + 1.6 }];
    const meca = [{ y: P.y, z: 0, r: 5.0 }, { y: S.y, z: 0, r: 6.7 }, { y: I.y, z: I.z, r: 3.6 }];
    const ce = new Part('carter-emb', 0, 0, 0, { housing: true, label: { text: 'Carter d\'embrayage', off: [-6, -17, 4] } });
    ce.mesh(G.hullTube({ circles: bell, wall: 0.5, x0: -10, x1: X.wall[0] }), 'alu');
    this.add(ce);
    const cl = new Part('cloison', 0, 0, 0, { housing: true, label: { text: 'Cloison / palier', off: [3.3, -9, 7.8] } });
    cl.mesh(G.hullPlate({ circles: bell, x0: X.wall[0], x1: X.wall[1], holes: [
      { y: P.y, z: 0, r: 2.42 }, { y: S.y, z: 0, r: 2.92 }, { y: D.y, z: D.z, r: 2.62 }] }), 'alu');
    this.add(cl);
    const cm = new Part('carter-meca', 0, 0, 0, { housing: true, label: { text: 'Carter mécanisme (fonte alu)', off: [14, 7, 0] } });
    cm.mesh(G.hullTube({ circles: meca, wall: 0.5, x0: X.wall[1], x1: X.caseEnd }), 'alu');
    this.add(cm);
    const cv = new Part('couvercle-ar', 0, 0, 0, { housing: true, label: { text: 'Couvercle arrière', off: [X.coverEnd, 0, 0] } });
    cv.mesh(G.hullPlate({ circles: meca, x0: X.caseEnd, x1: X.coverEnd }), 'alu');
    this.add(cv);
    // joint papier / pâte d'étanchéité (élastomère)
    const jt = new Part('joint-ar', 0, 0, 0);
    jt.mesh(G.hullPlate({ circles: meca, x0: X.caseEnd - 0.04, x1: X.caseEnd }), 'rubber', { noPick: true });
    this.add(jt);
  }

  buildMisc() { /* réservé : bouchon de vidange, reniflard… */ }

  /* ---------------------------- lubrification (particules d'huile instanciées) ---------------------------- */
  buildOil() {
    this.oil = { N: 160, items: [], on: false };
    const geo = new THREE.SphereGeometry(0.11, 8, 6);
    const mat = new THREE.MeshStandardMaterial({ color: SSP.lub, emissive: SSP.lub, emissiveIntensity: 0.9, roughness: 0.2 });
    const im = new THREE.InstancedMesh(geo, mat, this.oil.N);
    im.frustumCulled = false; im.visible = false; im.userData.noPick = true; im.userData.noCap = true;
    this.root.add(im);
    this.oil.mesh = im;
    const gx = [1, 2, 3, 4, 5].map((k) => X.g[k]);
    for (let i = 0; i < this.oil.N; i++) {
      this.oil.items.push({ u: Math.random(), gi: i % 5, ang: Math.random() * TAU, x: gx[i % 5] });
    }
  }
  updateOil(sim, dt, on) {
    const o = this.oil;
    o.mesh.visible = on;
    if (!on) return;
    const m4 = new THREE.Matrix4();
    const speed = 0.35 + Math.min(1, Math.abs(sim.nSec()) / 800) * 0.9 + Math.min(1, Math.abs(sim.nP) / 3000) * 0.5;
    o.items.forEach((it, i) => {
      it.u += dt * speed * 0.35;
      if (it.u > 1) { it.u -= 1; it.ang = Math.random() * TAU; }
      const split = 0.62;
      let x, r;
      if (it.u < split) { const t = it.u / split; x = 27.4 + (it.x - 27.4) * t; r = 0.28; }
      else { const t = (it.u - split) / (1 - split); x = it.x; r = 0.45 + t * (SYN.boreGear - 0.45) * 1.0; }
      const a = it.ang + (it.u < split ? it.u * 6 : 0);
      m4.makeTranslation(x, S.y + r * Math.cos(a), r * Math.sin(a));
      o.mesh.setMatrixAt(i, m4);
    });
    o.mesh.instanceMatrix.needsUpdate = true;
  }

  /* ====================================================================== */
  /*   ANIMATION : pose de chaque pièce à partir de l'état du simulateur     */
  /* ====================================================================== */
  pose(sim, dt) {
    const a = sim.ang, th = a.P + a.trim, p = this.parts;
    const set = (id, rot) => { p[id].rotX = rot; };
    // --- arbre primaire et pignons fixes
    set('arbre-primaire', th);
    for (const k of [1, 2, 3, 4, 5]) {
      const { Zp, Zs } = GEAR_PAIRS[k];
      set(`p-${k}`, PHASE.prim + th);
      const g = PHASE.sec[k] - (Zp / Zs) * th;
      set(`s-${k}`, g);
      const rg = p[`aiguilles-${k}`].rig;
      rg.cage.rotation.x = (a.S * rg.rIn + g * rg.rOut) / (rg.rIn + rg.rOut);
    }
    set('p-AR', PHASE.prim + th);
    // --- secondaire, pignon d'attaque
    set('arbre-secondaire', a.S);
    set('pignon-attaque', a.S + PHASE.pin);
    // --- AR : baladeur en prise permanente avec le pignon AR du primaire
    const idl = p['pignon-ar-baladeur'];
    idl.rotX = PHASE.idler - (REV.Zr / REV.Zi) * th;
    idl.slide = (X.idlerEngaged - X.idlerNeutral) * sim.idler;
    p['fourchette-ar'].slide = idl.slide;
    // --- synchroniseurs
    for (const key of SYNC_KEYS) {
      const sy = sim.sync[key], sl = sim.slide[key], m = Math.abs(sl);
      const jit = sy.shake ? (Math.random() - 0.5) * 0.07 * sy.shake : 0;
      p[`baladeur-${key}`].slide = sl + jit;
      p[`baladeur-${key}`].rotX = a.S + (sy.shake ? jit * 0.4 : 0);
      p[`moyeu-${key}`].rotX = a.S;
      p[`circlip-moyeu-${key}`].rotX = a.S;
      p[`cale-${key}`].rotX = a.S;
      p[`ressorts-${key}`].rotX = a.S;
      const kc = p[`clavettes-${key}`];
      kc.rotX = a.S;
      kc.slide = sy.dir * sy.contact;
      const dep = clamp((m - SYN.mBlock) / (SYN.mFull - SYN.mBlock), 0, 1) * 0.2;
      for (const kk of kc.rig.keys) kk.g.position.set(0, (2.75 - dep) * Math.cos(kk.a), (2.75 - dep) * Math.sin(kk.a));
      p[`fourchette-${key}`].slide = sl + jit;
    }
    for (const k of [1, 2, 3, 4, 5]) {
      const { key, dir } = SYNC_OF[k];
      const sy = sim.sync[key], mine = sy.dir === dir;
      const r = p[`bague-${k}`];
      r.slide = mine ? dir * sy.contact : 0;
      r.rotX = a.S + (mine ? sy.idx : 0);
      r.heat = mine ? sy.heat : 0;
    }
    // --- roulements
    for (const id of ['rlt-prim-av', 'rlt-prim-ar']) this.spinBearing(p[id], th);
    for (const id of ['rlt-sec-av', 'rlt-sec-ar']) this.spinBearing(p[id], a.S);
    for (const id of ['rlt-diff-g', 'rlt-diff-d']) this.spinBearing(p[id], a.C);
    if (sim.noise.bearing > 0) {                       // roulement HS : vibration visible
      const j = sim.noise.bearing * 0.05;
      for (const id of ['rlt-prim-av', 'rlt-prim-ar']) p[id].rig.innerG.position.set(0, (Math.random() - 0.5) * j, (Math.random() - 0.5) * j);
    } else for (const id of ['rlt-prim-av', 'rlt-prim-ar']) p[id].rig.innerG.position.set(0, 0, 0);
    // --- pont
    set('couronne', PHASE.crown + a.C);
    set('boitier-diff', a.C); set('axe-satellites', a.C);
    set('satellites', a.C);
    for (const s of p.satellites.rig.spin) s.spin.rotation.x = s.sgn * a.sat;
    set('planetaire-g', a.L); set('planetaire-d', a.R);
    set('arbre-transm-g', a.L); set('arbre-transm-d', a.R);
    // --- embrayage : plateau mobile (débrayage = plateau qui recule)
    set('volant-moteur', a.E); set('mecanisme-embrayage', a.E); set('disque-embrayage', th);
    p['mecanisme-embrayage'].slide = (1 - sim.clutch) * 0.6;
    for (const id in p) p[id].apply();
    this.updateOil(sim, dt || 0.016, this.oil.on);
  }
  spinBearing(part, theta) {
    part.rig.innerG.rotation.x = theta;
    part.rig.cageG.rotation.x = theta * part.rig.frac;
  }

  /* ====================================================================== */
  /*   COLORATION SSP + états (alerte, sélection, rayons X…)                 */
  /* ====================================================================== */
  flowIds(g) {
    const common = ['volant-moteur', 'disque-embrayage', 'mecanisme-embrayage', 'arbre-primaire'];
    const tail = ['arbre-secondaire', 'pignon-attaque', 'couronne', 'boitier-diff', 'satellites', 'axe-satellites',
      'planetaire-g', 'planetaire-d', 'arbre-transm-g', 'arbre-transm-d'];
    if (g === 'R') return new Set([...common, 'p-AR', 'pignon-ar-baladeur', 'baladeur-12', 'moyeu-12', ...tail]);
    if (g === 'N') return new Set();
    const s = SYNC_OF[g];
    return new Set([...common, `p-${g}`, `s-${g}`, `baladeur-${s.key}`, `moyeu-${s.key}`, ...tail]);
  }

  style(sim, o) {
    const flow = sim.flow(), ids = flow.level > 0 ? this.flowIds(sim.gear) : new Set();
    const t = o.time;
    for (const id in this.parts) {
      const part = this.parts[id];
      const st = { emissive: null, ei: 0, tint: null, tintAmt: 0, opacity: 1 };
      const selected = o.selected === id, hover = o.hover === id, alert = o.alerts && o.alerts.has(id);
      if (part.housing) st.opacity = o.xray ? Math.min(o.housingOpacity, 0.08) : o.housingOpacity;
      else if (o.xray && !selected && !alert && !(o.ssp && ids.has(id))) st.opacity = 0.2;
      if (o.ssp) {
        if (ids.has(id)) {
          st.emissive = flow.sign < 0 ? 0xff2a00 : SSP.couple;
          st.ei = (0.28 + 0.5 * flow.level) * (0.85 + 0.15 * Math.sin(t * 6 + (id.length)));
        } else if (/^s-\d$/.test(id)) { st.tint = SSP.fou; st.tintAmt = 0.78; }
        if (id.startsWith('fourchette-') || id.startsWith('axe-fourchette')) {
          const key = id.split('-').pop();
          const act = key !== 'ar' && key !== 'axe' && Math.abs(sim.slide[key]) > 0.02;
          const actAR = key === 'ar' && sim.idler > 0.02;
          if (act || actAR) { st.emissive = SSP.commande; st.ei = 0.75; } else { st.tint = SSP.commande; st.tintAmt = 0.18; }
        }
        if (id.startsWith('bague-') && part.heat > 0) { st.emissive = 0xff4a00; st.ei = 0.4 + part.heat * 1.1; }
      }
      if (o.rotHL && !st.emissive && this.rotRpm(id, sim) > 30) { st.emissive = 0xffd400; st.ei = 0.4; }
      if (o.lub && (id.startsWith('aiguilles-') || id === 'arbre-secondaire')) { st.tint = SSP.lub; st.tintAmt = 0.45; st.emissive = SSP.lub; st.ei = 0.35; }
      if (alert) { st.emissive = SSP.alerte; st.ei = 0.55 + 0.45 * Math.sin(t * 5) ** 2; st.opacity = 1; }
      if (hover) { st.emissive = SSP.select; st.ei = 0.35; st.opacity = Math.max(st.opacity, part.housing ? st.opacity : 0.9); }
      if (selected) { st.emissive = SSP.select; st.ei = 0.85; if (!part.housing) st.opacity = 1; }
      if (o.dim && o.dim.has(id) && !selected) { st.opacity = 0.06; st.emissive = null; st.ei = 0; st.tintAmt = 0; }
      part.setStyle(st);
    }
  }

  /** régime de rotation (tr/min, valeur absolue) de chaque pièce — « Surligner les parties en rotation » */
  rotRpm(id, sim) {
    const nP = Math.abs(sim.nP), nS = Math.abs(sim.nSec()), nw = Math.abs(sim.nWheels());
    if (id === 'volant-moteur' || id === 'mecanisme-embrayage') return sim.engineRpm;
    if (id === 'disque-embrayage' || id === 'arbre-primaire' || /^p-/.test(id) || /^rlt-prim/.test(id)) return nP;
    const m = /^s-(\d)$|^aiguilles-(\d)$/.exec(id);
    if (m) { const k = +(m[1] || m[2]); return (nP * GEAR_PAIRS[k].Zp) / GEAR_PAIRS[k].Zs; }
    if (id === 'pignon-ar-baladeur') return (nP * REV.Zr) / REV.Zi;
    if (/^(arbre-secondaire|pignon-attaque|moyeu-|baladeur-|clavettes-|ressorts-|circlip-moyeu|cale-\d|bague-|rlt-sec)/.test(id)) return nS;
    if (/^(couronne|boitier-diff|satellites|axe-satellites|planetaire|arbre-transm|rlt-diff)/.test(id)) return nw;
    return 0;
  }

  /* ====================================================================== */
  /*   VUE ÉCLATÉE : ordre de démontage atelier                              */
  /* ====================================================================== */
  makeExplodePlan() {
    const plan = [];
    const step = (label, entries, info) => plan.push({ label, entries, info });
    step('Déposer les arbres de transmission et les spi de différentiel', [
      { id: 'arbre-transm-g', v: [-6, 0, 0] }, { id: 'arbre-transm-d', v: [8, 0, 0] },
      { id: 'spi-diff-g', v: [-5, 0, 0] }, { id: 'spi-diff-d', v: [6, 0, 0] }]);
    step('Séparer la boîte du moteur : mécanisme, disque d\'embrayage, volant', [
      { id: 'mecanisme-embrayage', v: [-10, 0, 0] }, { id: 'disque-embrayage', v: [-17, 0, 0] }, { id: 'volant-moteur', v: [-24, 0, 0] }]);
    step('Déposer le couvercle arrière (cache de 5ème) et son joint', [
      { id: 'couvercle-ar', v: [40, 0, 0] }, { id: 'joint-ar', v: [34, 0, 0] }]);
    const fk = [];
    for (const key of SYNC_KEYS) {
      const psi = (RAIL_ANGLE[key] * Math.PI) / 180;
      fk.push({ id: `fourchette-${key}`, v: [0, 9 * Math.cos(psi), 9 * Math.sin(psi)] }, { id: `axe-fourchette-${key}`, v: [14, 0, 0] });
    }
    step('Déposer les axes et fourchettes de commande (1/2, 3/4, 5ème)', fk);
    step('Déposer le baladeur de marche arrière, sa fourchette et l\'axe de renvoi', [
      { id: 'pignon-ar-baladeur', v: [0, 0, -9] }, { id: 'fourchette-ar', v: [0, 0, -9] }, { id: 'arbre-renvoi', v: [16, 0, 0] }]);
    step('Déposer le carter mécanisme (fonte d\'aluminium)', [{ id: 'carter-meca', v: [30, 0, 0] }]);
    step('Déposer circlip, cale et roulement arrière du primaire', [
      { id: 'circlip-prim-ar', v: [16, 0, 0] }, { id: 'cale-prim-ar', v: [13, 0, 0] }, { id: 'rlt-prim-ar', v: [10, 0, 0] }]);
    step('Extraire l\'arbre primaire complet (pignons fixes + roulement AV)', [
      ...['arbre-primaire', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-AR', 'rlt-prim-av'].map((id) => ({ id, v: [0, 17, 0] }))]);
    // Pile du secondaire : démontage de l'arrière vers l'avant, chaque groupe écarté d'un cran
    const stack = [
      ['Déposer circlip, cale et roulement arrière du secondaire', ['rlt-sec-ar', 'circlip-sec-ar', 'cale-sec-ar']],
      ['Déposer le circlip de moyeu de 5ème', ['circlip-moyeu-5']],
      ['Déposer baladeur, moyeu, clavettes et ressorts de 5ème', ['baladeur-5', 'moyeu-5', 'clavettes-5', 'ressorts-5', 'cale-5']],
      ['Déposer l\'anneau de synchro de 5ème (laiton)', ['bague-5']],
      ['Déposer le pignon fou de 5ème et sa cage à aiguilles', ['s-5', 'aiguilles-5']],
      ['Déposer le pignon fou de 4ème et sa cage à aiguilles', ['s-4', 'aiguilles-4']],
      ['Déposer l\'anneau de synchro de 4ème', ['bague-4']],
      ['Déposer le circlip de moyeu 3/4', ['circlip-moyeu-34']],
      ['Déposer baladeur, moyeu, clavettes et ressorts 3/4', ['baladeur-34', 'moyeu-34', 'clavettes-34', 'ressorts-34', 'cale-34']],
      ['Déposer l\'anneau de synchro de 3ème', ['bague-3']],
      ['Déposer le pignon fou de 3ème et sa cage à aiguilles', ['s-3', 'aiguilles-3']],
      ['Déposer le pignon fou de 2ème et sa cage à aiguilles', ['s-2', 'aiguilles-2']],
      ['Déposer l\'anneau de synchro de 2ème', ['bague-2']],
      ['Déposer le circlip de moyeu 1/2', ['circlip-moyeu-12']],
      ['Déposer baladeur (couronne AR), moyeu, clavettes et ressorts 1/2', ['baladeur-12', 'moyeu-12', 'clavettes-12', 'ressorts-12', 'cale-12']],
      ['Déposer l\'anneau de synchro de 1ère', ['bague-1']],
      ['Déposer le pignon fou de 1ère et sa cage à aiguilles', ['s-1', 'aiguilles-1']],
    ];
    const Gn = stack.length, dlt = 1.7;
    stack.forEach(([label, ids], i) => step(label, ids.map((id) => ({ id, v: [(Gn - i) * dlt, 0, 0] }))));
    step('Extraire l\'arbre secondaire creux avec le pignon d\'attaque et son roulement AV', [
      ...['arbre-secondaire', 'pignon-attaque', 'rlt-sec-av'].map((id) => ({ id, v: [0, -15, 0] }))]);
    step('Extraire le pont : boîtier de différentiel, couronne et roulements', [
      ...['boitier-diff', 'couronne', 'rlt-diff-g', 'rlt-diff-d', 'satellites', 'axe-satellites', 'planetaire-g', 'planetaire-d']
        .map((id) => ({ id, v: [0, 0, 13] }))]);
    step('Déposer la couronne (6 vis à tête hexagonale, freinées)', [{ id: 'couronne', v: [9, 0, 0] }]);
    step('Ouvrir le boîtier : axe, satellites, planétaires', [
      { id: 'axe-satellites', v: [0, 0, 8] }, { id: 'satellites', v: [0, 0, 8] },
      { id: 'planetaire-g', v: [-6, 0, 0] }, { id: 'planetaire-d', v: [6, 0, 0] },
      { id: 'rlt-diff-g', v: [-3, 0, 0] }, { id: 'rlt-diff-d', v: [3, 0, 0] }]);
    return plan;
  }

  setExplode(p) {
    const N = this.explodePlan.length;
    for (const id in this.parts) this.parts[id].explode.set(0, 0, 0);
    this.explodePlan.forEach((st, i) => {
      const t = smooth(clamp(p * N - i, 0, 1));
      if (t <= 0) return;
      for (const e of st.entries) this.parts[e.id].explode.x += e.v[0] * t, this.parts[e.id].explode.y += e.v[1] * t, this.parts[e.id].explode.z += e.v[2] * t;
    });
    for (const id in this.parts) this.parts[id].apply();
    const idx = clamp(Math.floor(p * N - 1e-6), 0, N - 1);
    return { index: p <= 0 ? -1 : idx, total: N, label: p <= 0 ? 'Boîte assemblée' : this.explodePlan[idx].label };
  }

  /* ---- vues caméra prédéfinies ---- */
  views() {
    const hub = (k) => V3(X.hub[k], S.y, 0);
    return {
      global: { target: V3(9, 0, 2), pos: V3(30, 34, 80) },
      loupe: {
        12: { target: hub(12).add(V3(0, 2.2, 0)), pos: V3(X.hub[12] + 2.5, S.y + 5.5, 17) },
        34: { target: hub(34).add(V3(0, 2.2, 0)), pos: V3(X.hub[34] + 2.5, S.y + 5.5, 17) },
        5: { target: hub(5).add(V3(0, 2.2, 0)), pos: V3(X.hub[5] + 2, S.y + 5.5, 17) },
      },
      diff: { target: V3(0.5, D.y, D.z), pos: V3(14, D.y + 10, D.z + 18) },
      clutch: { target: V3(-6, P.y, 0), pos: V3(-18, 14, 24) },
    };
  }
  loupeTarget(gear) { return gear === 'N' ? 12 : gear === 'R' ? 12 : SYNC_OF[gear].key; }
}
