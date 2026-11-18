/* ============================================================================
 * modules23.js — MODULE 3 : Boîte robotisée à double embrayage (DSG / DCT, arbres concentriques)
 *                (le MODULE 2, boîte automatique, est dans module2BVA.js)
 *  Bases fonctionnelles : géométrie 3D, cinématique exacte (Willis / rapports de dents),
 *  sélection de pièces, vue éclatée, coupe, coloration SSP (pression hydraulique = orange).
 * ========================================================================== */
import * as THREE from 'three';
import { BaseModule, discStack, setStack } from './moduleBase.js';
import * as G from './gearsBuilder.js';
import { meshPhase, TAU } from './layout.js';
import { SSP } from './materials.js';
import { WHEEL_R, torqueCurve, IDLE_RPM, REDLINE_RPM, VIS_SCALE } from './kinematics.js';
import { def, CAT } from './partsData.js';
import { groupsDCT } from './groups.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const approach = (x, t, s) => (x < t ? Math.min(t, x + s) : Math.max(t, x - s));
const fr = (x, d = 3) => x.toFixed(d).replace('.', ',');

export { Module2, BVA_TABLE } from './module2Eco.js';      // MODULE 2 (ZF EcoLife 2) : voir module2Eco.js / ecoSim.js

/* =========================================================================
 *  MODULE 3 — DCT 6 rapports : arbres primaires concentriques + 2 embrayages
 * ======================================================================= */
const A3 = 6.0, PY = 3.0, SY = -3.0, IFD3 = 3.9;
const DCT_Z = { 1: [13, 45], 2: [22, 45], 3: [33, 45], 4: [44, 45], 5: [50, 41], 6: [55, 37] };
const DCT_X = { 1: 18.0, 2: 6.0, 3: 22.0, 4: 10.0, 5: 25.5, 6: 13.5 };
const DCT_SYNC = { 1: { k: 's13', d: -1 }, 3: { k: 's13', d: 1 }, 2: { k: 's24', d: -1 }, 4: { k: 's24', d: 1 }, 6: { k: 's6', d: -1 }, 5: { k: 's5', d: -1 } };
const DCT_HUB = { s24: 8.0, s6: 15.3, s13: 20.0, s5: 27.3 };
export const DCT_IB = {}; for (const k in DCT_Z) DCT_IB[k] = DCT_Z[k][1] / DCT_Z[k][0];
const shaftOf = (g) => (g % 2 ? 'A' : 'B');

export class DctSim {
  constructor() { this.reset(); }
  reset() {
    this.gear = 'N'; this.engineRpm = IDLE_RPM; this.v = 0; this.load = 'accel';
    this.cl = { A: 0, B: 0 };                    // niveaux d'embrayage (1 = fermé, couple transmis)
    this.eng = { A: null, B: null };             // rapport engagé (sleeve) sur chaque arbre
    this.sl = { s13: 0, s24: 0, s6: 0, s5: 0 };
    this.queue = []; this.seq = null; this.phase = 0; this.events = []; this.timeScale = 1;
    this.ang = { E: 0, A: 0, B: 0, O: 0 }; this.n = { A: 0, B: 0, O: 0 };
    this.oilT = 80; this.turn = 0; this.clutchPedal = false; this.clutch = 1; this.noise = { bearing: 0, grind: 0 }; this.faults = {}; this.sync = {};
    this.preselected = null; this.u = 0;
  }
  get gears() { return ['N', 1, 2, 3, 4, 5, 6]; }
  requestGear(g) {
    if (this.seq || g === this.gear) return false;
    if (g === 'N') { this.queue = [{ t: 'N' }]; }
    else if (this.gear === 'N' || shaftOf(g) !== shaftOf(this.gear)) this.queue = [{ t: g }];
    else this.queue = [{ t: this.gear + (g > this.gear ? 1 : -1) }, { t: g }];
    this.next();
    return true;
  }
  next() {
    const q = this.queue.shift(); if (!q) { this.seq = null; return; }
    this.seq = { t: q.t, sub: 'free', time: 0, from: this.gear };
    this.phase = 1;
    this.events.push({ type: 'shift-start', to: q.t });
  }
  slideTo(key, target, dt, rate = 0.7 / 0.45) { this.sl[key] = approach(this.sl[key], target, rate * dt); return this.sl[key] === target; }
  engageGear(g, dt) { if (g === null) return true; const s = DCT_SYNC[g]; return this.slideTo(s.k, s.d * 0.7, dt); }
  releaseGear(g, dt) { if (g === null) return true; return this.slideTo(DCT_SYNC[g].k, 0, dt); }
  vFromRpm(rpm, g) { return ((rpm / DCT_IB[g]) / IFD3) * TAU * WHEEL_R * 0.06; }
  update(dt) {
    this.events.length = 0;
    const s = this.seq;
    if (s) {
      s.time += dt;
      const t = s.t;
      if (t === 'N') {
        this.phase = 1;
        this.cl.A = approach(this.cl.A, 0, dt / 0.4); this.cl.B = approach(this.cl.B, 0, dt / 0.4);
        const ok = [this.releaseGear(this.eng.A, dt), this.releaseGear(this.eng.B, dt)];
        if (ok[0] && ok[1] && this.cl.A === 0 && this.cl.B === 0) { this.eng.A = this.eng.B = null; this.gear = 'N'; this.seq = null; this.phase = 0; }
      } else {
        const X = shaftOf(t), Y = X === 'A' ? 'B' : 'A';
        if (s.sub === 'free') {                         // la voie cible doit être libre
          this.phase = 1;
          if (this.eng[X] !== null && this.eng[X] !== t) { if (this.releaseGear(this.eng[X], dt)) { this.eng[X] = null; } }
          else s.sub = 'preselect';
        } else if (s.sub === 'preselect') {              // Phase 2 : présélection sur l'arbre libre, embrayage ouvert
          this.phase = 2;
          if (this.engageGear(t, dt)) { this.eng[X] = t; s.sub = 'cross'; s.u = 0; s.nOut = this.nOut(); s.rpm0 = this.engineRpm; s.tv = this.v; s.old = this.gear; }
        } else if (s.sub === 'cross') {                  // Phase 3 : recouvrement (un embrayage s'ouvre pendant que l'autre se ferme)
          this.phase = 3;
          s.u = Math.min(1, s.u + dt / 0.7);
          this.cl[X] = s.u; this.cl[Y] = 1 - s.u;
          if (s.old === 'N') this.cl[Y] = 0;
          const nOutHold = s.old === 'N' ? 0 : s.nOut;
          const rpmNew = s.old === 'N' ? Math.max(IDLE_RPM, s.rpm0) : clamp(nOutHold * DCT_IB[t], IDLE_RPM, REDLINE_RPM);
          this.engineRpm = s.rpm0 + (rpmNew - s.rpm0) * s.u;
          this.v = s.tv;
          if (s.u >= 1) { this.gear = t; s.sub = 'rel'; }
        } else if (s.sub === 'rel') {
          const old = s.old;
          const done = old === 'N' || old === t ? true : this.releaseGear(old, dt);
          if (done) { if (old !== 'N' && old !== t) this.eng[shaftOf(old)] = null; this.seq = null; this.phase = 0; if (this.queue.length) this.next(); }
        }
      }
    } else {                                              // régime établi : le moteur impose sa vitesse
      if (this.gear !== 'N') { this.v = this.vFromRpm(this.engineRpm, this.gear); const Xs = shaftOf(this.gear); this.cl[Xs] = 1; this.cl[Xs === 'A' ? 'B' : 'A'] = 0; }
      else { this.v = Math.max(0, this.v - 2 * dt); this.cl.A = this.cl.B = 0; }
      // présélection automatique du rapport suivant sur l'autre arbre
      if (this.gear !== 'N' && !this.queue.length) {
        const nx = this.gear < 6 ? this.gear + 1 : this.gear - 1, Y = shaftOf(nx);
        if (this.eng[Y] !== nx) { if (this.eng[Y] !== null) { if (this.releaseGear(this.eng[Y], dt)) this.eng[Y] = null; } else if (this.engageGear(nx, dt)) this.eng[Y] = nx; }
        this.phase = 0;
      }
    }
    // vitesses d'arbres
    const nO = this.nOut();
    const spd = (X) => { const g = this.eng[X]; return g !== null ? nO * DCT_IB[g] : this.engineRpm * this.cl[X]; };
    let nA = spd('A'), nB = spd('B');
    const Xa = this.gear !== 'N' ? shaftOf(this.gear) : null;
    if (Xa && !this.seq) { if (Xa === 'A') nA = this.engineRpm; else nB = this.engineRpm; }
    this.n = { A: nA, B: nB, O: -nO };
    const k = VIS_SCALE * (this.visMul || 1) * (TAU / 60) * dt;
    this.ang.A += nA * k; this.ang.B += nB * k; this.ang.O += this.n.O * k; this.ang.E += this.engineRpm * k;
  }
  nOut() { const nw = (this.v / 3.6 / (TAU * WHEEL_R)) * 60; return nw * IFD3; }
  flow() { const a = Math.max(this.cl.A, this.cl.B); return { level: this.gear === 'N' ? 0 : a, sign: this.load === 'decel' ? -1 : 1 }; }
  engineTorque() { const c = torqueCurve(this.engineRpm); return this.load === 'accel' ? c : this.load === 'stab' ? 0.3 * c : -(18 + 0.0045 * this.engineRpm); }
  tele() {
    const g = this.gear, ib = g === 'N' ? 0 : DCT_IB[g];
    const pre = this.eng.A !== null && this.eng.A !== g ? this.eng.A : this.eng.B !== null && this.eng.B !== g ? this.eng.B : null;
    return [
      ['Régime moteur', Math.round(this.engineRpm), 'tr/min'],
      ['Rapport engagé', g, ''],
      ['Rapport présélectionné', pre === null ? '—' : pre, ''],
      ['Rapport Z_mené/Z_menant', g === 'N' ? '—' : `${DCT_Z[g][1]}/${DCT_Z[g][0]} = ${fr(ib)}`, ''],
      ['Vitesse véhicule', this.v.toFixed(0), 'km/h'],
      ['Couple moteur', Math.round(this.engineTorque()), 'Nm'],
      ['Embrayage C1 (impairs) / C2 (pairs)', `${Math.round(this.cl.A * 100)} % / ${Math.round(this.cl.B * 100)} %`, ''],
    ];
  }
}

export class Module3 extends BaseModule {
  constructor() {
    super('dct', 'Module 3 · Boîte robotisée à double embrayage (DSG / DCT)');
    this.sim = new DctSim();
    this.gearList = ['N', 1, 2, 3, 4, 5, 6];
    this.groups = groupsDCT();
    this.build();
    this.makePlan();
  }
  build() {
    const gW = 1.5;
    // arbres primaires CONCENTRIQUES : arbre intérieur (impairs) / arbre creux extérieur (pairs)
    this.mk('arbre-prim-int', 0, PY, 0, ['Arbre primaire intérieur (1-3-5)', [26, 1.9, 0]]).mesh(G.cylX(1.0, -5.0, 28.5, 32), 'steel');
    this.mk('arbre-prim-ext', 0, PY, 0, ['Arbre primaire creux (2-4-6)', [2.5, 2.7, 0]]).mesh(G.tubeX(1.15, 1.65, -3.0, 14.6, 40), 'steel');
    this.mk('arbre-sortie-dct', 0, SY, 0, ['Arbre de sortie', [3, -2.5, 0]]).mesh(G.cylX(1.4, 4.0, 30.5, 32), 'steel');
    // pignons
    for (const k of [1, 2, 3, 4, 5, 6]) {
      const [Zp, Zs] = DCT_Z[k], sum = Zp + Zs, rp = (A3 * Zp) / sum, rs = (A3 * Zs) / sum;
      const odd = k % 2 === 1;
      const f = this.mk(`dct-p${k}`, DCT_X[k], PY, 0, [`Pignon ${k} (${odd ? 'int.' : 'ext.'})`, [0, rp + 0.6, 0]]);
      f.mesh(G.involuteGear({ Z: Zp, pitchR: rp, width: gW, boreR: odd ? 0.8 : 1.45, helixDeg: 22, hand: 1, layers: 5 }), 'steel');
      f.ib = Zs / Zp; f.Zp = Zp; f.Zs = Zs;
      const s = this.mk(`dct-s${k}`, DCT_X[k], SY, 0, [`Pignon fou ${k}`, [0, -(rs + 0.6), 0]]);
      s.mesh(G.involuteGear({ Z: Zs, pitchR: rs, width: gW, boreR: 1.6, helixDeg: 22, hand: -1, layers: 5 }), 'steel');
      const side = -DCT_SYNC[k].d;     // collier côté synchro
      s.mesh(G.splineRing({ Z: 20, rBase: 1.9, rTip: 2.18, width: 0.45, plainR: 1.6, chamfer: side > 0 ? '+' : '-' }), 'steel', { pos: [side * (gW / 2 + 0.225), 0, 0] });
      s.phase = meshPhase(Math.PI, Zp, Zs, Math.PI);
      s.Zp = Zp; s.Zs = Zs;
    }
    // synchros : moyeu + baladeur (sans anneau détaillé dans cette base)
    for (const key of Object.keys(DCT_HUB)) {
      const x = DCT_HUB[key];
      this.mk(`dct-h-${key}`, x, SY, 0, null).mesh(G.splineRing({ Z: 20, rBase: 1.9, rTip: 2.18, width: 0.8, plainR: 1.4 }), 'steel');
      const sl = this.mk(`dct-b-${key}`, x, SY, 0, [`Baladeur ${key.slice(1)}`, [0, 3.4, 0]]);
      sl.mesh(G.splineRing({ Z: 20, rBase: 2.42, rTip: 2.2, width: 1.5, plainR: 2.7, phase: Math.PI / 20, chamfer: 'both', cLen: 0.2, cScale: 0.5 }), 'steel');
      sl.mesh(G.tubeX(2.7, 3.05, -0.75, -0.2, 40), 'steel'); sl.mesh(G.tubeX(2.7, 3.05, 0.2, 0.75, 40), 'steel');
    }
    // double embrayage concentrique (humide) : C1 (impairs, intérieur), C2 (pairs, extérieur)
    this.mk('dct-volant', 0, PY, 0, ['Volant bimasse', [-6.0, 9.5, 0]]).mesh(G.latheX([[-6.4, 0.8], [-6.4, 8.8], [-5.6, 8.8], [-5.6, 0.8]], 56), 'steel');
    this.mk('dct-tambour', -2.8, PY, 0, ['Tambour de double embrayage', [0, 9.0, 0]]).mesh(G.tubeX(7.6, 8.0, -2.4, 2.2, 56), 'steel');
    discStack(this.mk('dct-c1-pack', -2.8, PY, 0, ['Embrayage C1 (rapports impairs)', [0, 5.7, 0]]), { rA: 2.5, rB: 3.1, rC: 4.5, rD: 5.1, n: 5, gapOpen: 0.5, gapClosed: 0.34 });
    discStack(this.mk('dct-c2-pack', -2.8, PY, 0, ['Embrayage C2 (rapports pairs)', [0, 7.2, 0]]), { rA: 5.4, rB: 6.0, rC: 6.9, rD: 7.5, n: 5, gapOpen: 0.5, gapClosed: 0.34 });
    this.mk('dct-moyeu-c1', -2.8, PY, 0, null).mesh(G.tubeX(1.0, 2.4, -2.0, 1.5, 36), 'steel');
    this.mk('dct-moyeu-c2', -1.4, PY, 0, null).mesh(G.tubeX(1.65, 2.2, -1.2, 0.2, 36), 'steel');
    this.mk('dct-pignon-sortie', 29.2, SY, 0, ['Pignon de sortie (vers pont)', [0, -2.6, 0]]).mesh(G.involuteGear({ Z: 17, pitchR: 2.1, width: 1.6, boreR: 1.2, helixDeg: 22, hand: 1 }), 'steel');
    this.mk('carter-dct', 0, 0, 0, ['Carter de boîte', [14, 10, 0]], { housing: true }).mesh(
      G.hullTube({ circles: [{ y: PY, z: 0, r: 9.2 }, { y: SY, z: 0, r: 5.8 }], wall: 0.5, x0: -7.2, x1: 31.5 }), 'alu');
  }
  makePlan() {
    this.step('Séparer le carter de boîte', [{ id: 'carter-dct', v: [0, 0, 32] }]);
    this.step('Déposer le double embrayage (tambour, C1, C2)', [
      { id: 'dct-tambour', v: [-6, 0, 0] }, { id: 'dct-c2-pack', v: [-13, 0, 0] }, { id: 'dct-c1-pack', v: [-20, 0, 0] }, { id: 'dct-volant', v: [-27, 0, 0] }, { id: 'dct-moyeu-c1', v: [-11, 0, 0] }, { id: 'dct-moyeu-c2', v: [-9, 0, 0] }]);
    this.step('Extraire l\'arbre primaire creux (pairs) avec ses pignons', [
      ...[2, 4, 6].map((k) => ({ id: `dct-p${k}`, v: [0, 14, 0] })), { id: 'arbre-prim-ext', v: [0, 14, 0] }]);
    this.step('Extraire l\'arbre primaire intérieur (impairs) avec ses pignons', [
      ...[1, 3, 5].map((k) => ({ id: `dct-p${k}`, v: [0, 20, 0] })), { id: 'arbre-prim-int', v: [0, 20, 0] }]);
    this.step('Déposer les baladeurs et moyeux de synchro', Object.keys(DCT_HUB).flatMap((key, i) => [{ id: `dct-b-${key}`, v: [0, -10, 6 + i * 0] }, { id: `dct-h-${key}`, v: [0, -10, 12] }]));
    this.step('Déposer les pignons fous et l\'arbre de sortie', [...[1, 2, 3, 4, 5, 6].map((k) => ({ id: `dct-s${k}`, v: [0, -15, 0] })), { id: 'arbre-sortie-dct', v: [0, -15, 0] }, { id: 'dct-pignon-sortie', v: [0, -15, 0] }]);
  }
  pose(sim, dt) {
    const a = sim.ang, p = this.parts;
    p['arbre-prim-int'].rotX = a.A; p['arbre-prim-ext'].rotX = a.B; p['arbre-sortie-dct'].rotX = a.O;
    p['dct-volant'].rotX = a.E; p['dct-tambour'].rotX = a.E;
    p['dct-moyeu-c1'].rotX = a.A; p['dct-moyeu-c2'].rotX = a.B;
    for (const k of [1, 2, 3, 4, 5, 6]) {
      const odd = k % 2 === 1, th = odd ? a.A : a.B, f = p[`dct-p${k}`], s = p[`dct-s${k}`];
      f.rotX = Math.PI + th;
      s.rotX = s.phase - (s.Zp / s.Zs) * th;
    }
    for (const key of Object.keys(DCT_HUB)) { p[`dct-h-${key}`].rotX = a.O; p[`dct-b-${key}`].rotX = a.O; p[`dct-b-${key}`].slide = sim.sl[key]; }
    p['dct-pignon-sortie'].rotX = a.O;
    const set = (id, lvl, inner, outer) => { const q = p[id]; setStack(q, lvl); q.rig.gI.rotation.x = inner; q.rig.gO.rotation.x = outer; };
    set('dct-c1-pack', sim.cl.A, a.A, a.E); set('dct-c2-pack', sim.cl.B, a.B, a.E);
    for (const id in p) p[id].apply();
  }
  style(sim, o) {
    const f = sim.flow();
    this.styleGeneric(o, (part, st) => {
      const id = part.id;
      if (id === 'dct-c1-pack' || id === 'dct-c2-pack') {
        const lvl = id === 'dct-c1-pack' ? sim.cl.A : sim.cl.B;
        if (lvl > 0.04) { st.emissive = SSP.couple; st.ei = 0.25 + lvl * 0.9; } else if (o.ssp) { st.tint = SSP.fou; st.tintAmt = 0.6; }
      }
      if (!o.ssp) return;
      const g = sim.gear;
      if (g !== 'N' && f.level > 0.05) {
        const X = shaftOf(g), path = new Set([X === 'A' ? 'arbre-prim-int' : 'arbre-prim-ext', `dct-p${g}`, `dct-s${g}`, `dct-b-${DCT_SYNC[g].k}`, `dct-h-${DCT_SYNC[g].k}`, 'arbre-sortie-dct', 'dct-pignon-sortie', X === 'A' ? 'dct-moyeu-c1' : 'dct-moyeu-c2']);
        if (path.has(id)) { st.emissive = f.sign < 0 ? 0xff2a00 : SSP.couple; st.ei = 0.2 + 0.5 * f.level; return; }
      }
      if (/^dct-s\d$/.test(id)) { st.tint = SSP.fou; st.tintAmt = 0.7; }
    });
  }
  views() { return { global: { target: V3(11, 0, 0), pos: V3(26, 30, 62) }, loupe: {}, diff: null, clutch: { target: V3(-3, PY, 0), pos: V3(-12, 14, 22) } }; }
}

/* =========================================================================
 *  Fiches pièces des modules 2 et 3 (volets théorie -> atelier)
 * ======================================================================= */
const FIN = (name, cat, role, metro, symp, remontage, mat = 'Acier') => ({ name, cat, mat, role, metro, symp, remontage });
const pk = (id, o) => { def(id, o); };
pk('arbre-prim-int', FIN('Arbre primaire intérieur (rapports impairs)', 'dct', ['Arbre plein relié à l\'embrayage C1 : porte les pignons de 1ère, 3ème et 5ème.'], ['Faux-rond ≤ 0,03 mm, portées de roulement.'], ['Claquements au rapport impair, vibration.'], ['Respecter le montage concentrique avec le tube.'], 'Acier cémenté'));
pk('arbre-prim-ext', FIN('Arbre primaire creux (rapports pairs)', 'dct', ['Tube relié à l\'embrayage C2 : porte les pignons de 2ème, 4ème et 6ème. L\'arbre intérieur tourne à l\'intérieur.'], ['Jeu radial entre arbres (rep. 0,02–0,05 mm).'], ['Bruit de grondement en pairs.'], ['Bagues à aiguilles entre arbres neuves.'], 'Acier cémenté'));
pk('arbre-sortie-dct', FIN('Arbre de sortie', 'dct', ['Porte les pignons fous, les moyeux et les baladeurs ; vers le pont.'], ['Faux-rond, portées d\'aiguilles.'], ['Hurlement.'], ['Aiguilles huilées.'], 'Acier cémenté'));
for (const k of [1, 2, 3, 4, 5, 6]) {
  const [Zp, Zs] = DCT_Z[k];
  pk(`dct-p${k}`, FIN(`Pignon menant de ${k}${k === 1 ? 'ère' : 'ème'}`, 'dct', [`Z = ${Zp}, solidaire de l'arbre ${k % 2 ? 'intérieur (C1)' : 'creux (C2)'}. i = ${Zs}/${Zp} = ${fr(Zs / Zp)}.`], ['Piqûres, jeu entre dents.'], ['Sifflement en charge.'], ['Remplacer en paire.'], 'Acier cémenté'));
  pk(`dct-s${k}`, FIN(`Pignon fou de ${k}${k === 1 ? 'ère' : 'ème'}`, 'dct', [`Z = ${Zs}, fou sur l'arbre de sortie (gris). Le baladeur le crabote quand le rapport est PRÉSÉLECTIONNÉ.`], ['Crabots, aiguilles.'], ['Craquements si synchro usé.'], ['Huile DCT spécifique (ne pas mélanger avec ATF/ GL4).'], 'Acier cémenté'));
}
for (const key of Object.keys(DCT_HUB)) {
  pk(`dct-h-${key}`, FIN(`Moyeu de synchro ${key.slice(1)}`, 'dct', ['Solidaire de l\'arbre de sortie.'], ['Cannelures.'], ['Claquement.'], ['Circlip neuf.'], 'Acier fritté'));
  pk(`dct-b-${key}`, FIN(`Baladeur ${key.slice(1)} (piloté par actionneur)`, 'dct', ['Commandé par un actionneur hydraulique/électrique via le calculateur : il PRÉSÉLECTIONNE le rapport suivant embrayage ouvert.'], ['Chanfreins de crabots, jeu fourchette/gorge.'], ['Défaut de passage de rapport, voyant boîte.'], ['Apprentissage des positions de fourchettes après remplacement.'], 'Acier'));
}
pk('dct-c1-pack', FIN('Embrayage C1 (rapports impairs)', 'dct', ['Embrayage humide multidisques INTÉRIEUR relié à l\'arbre plein (1-3-5).'], ['Épaisseur des garnitures, jeu du pack.'], ['À-coups au démarrage, broutage en 1ère.'], ['Apprentissage des points de léchage (adaptation).'], 'Acier + garnitures'));
pk('dct-c2-pack', FIN('Embrayage C2 (rapports pairs)', 'dct', ['Embrayage humide multidisques EXTÉRIEUR relié au tube (2-4-6).'], ['Idem C1.'], ['Secousses à 2→3, patinage.'], ['Apprentissage adaptatif.'], 'Acier + garnitures'));
pk('dct-volant', FIN('Volant bimasse', 'embrayage', ['Filtre les acyclismes moteur et entraîne le tambour de double embrayage.'], ['Jeu angulaire, voile.'], ['Claquements au ralenti.'], ['Vis neuves.'], 'Acier'));
pk('dct-tambour', FIN('Tambour de double embrayage', 'dct', ['Reçoit le couple moteur et le distribue aux deux embrayages concentriques.'], ['Voile, cannelures.'], ['Vibrations.'], ['Joints toriques neufs.'], 'Acier'));
pk('dct-moyeu-c1', FIN('Moyeu de C1', 'dct', ['Cannelé sur l\'arbre intérieur.'], ['Cannelures.'], ['Claquement.'], ['Graisse spéciale.'], 'Acier'));
pk('dct-moyeu-c2', FIN('Moyeu de C2', 'dct', ['Cannelé sur l\'arbre creux.'], ['Cannelures.'], ['Claquement.'], ['Graisse spéciale.'], 'Acier'));
pk('dct-pignon-sortie', FIN('Pignon de sortie', 'dct', ['Entraîne le couple conique du différentiel.'], ['Piqûres.'], ['Hurlement.'], ['Appairer avec la couronne.'], 'Acier cémenté'));
pk('carter-dct', FIN('Carter de boîte DCT', 'carter', ['Loge les deux arbres concentriques et l\'embrayage.'], ['Planéité.'], ['Fuite.'], ['Pâte d\'étanchéité.'], 'Fonte d\'aluminium'));
