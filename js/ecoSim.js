/* ============================================================================
 * ecoSim.js — MODULE 2 : ZF EcoLife 2 (6 AP xx20 B) — moteur de simulation
 *  Référence : manuel « ZF EcoLife 2 — chemin fonctionnel de la puissance » (réf. ZF 4188.751.201, éd. 2019-11)
 *     rapports  1 : 3,364 (A+F) · 2 : 1,975 (A+E) · 3 : 1,444 (A+D) · 4 : 1,000 (A+B) · 5 : 0,696 (B+D) · 6 : 0,587 (B+E) · AR : 3,769 (D+F)
 *     convertisseur + pontage WK · ralentisseur primaire · éléments A, B (embrayages) D, E, F (freins) · AIS
 *     points de mesure PHD · PVF · A8 · D6 · D8, régulateurs (bobines 10-14 Ω), sondes CTN, maintien de PHD à l'arrêt
 *  LIAISONS CINÉMATIQUES : le manuel ne donne pas le schéma cinématique. Les 3 trains simples ci-dessous sont reconstitués pour
 *  retrouver EXACTEMENT les 7 rapports ZF (nombres de dents génériques) : à valider avec le schéma ZF.
 *  Modèle PÉDAGOGIQUE : pressions, couples, durées = ordres de grandeur ; ne remplace pas la documentation ZF à jour.
 * ========================================================================== */
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const approach = (x, t, s) => (x < t ? Math.min(t, x + s) : Math.max(t, x - s));
const fr = (x, d = 2) => x.toFixed(d).replace('.', ',');
export const VIS = 0.012;                       // rotation affichée ralentie (stroboscopie)

/* ---- trains épicycloïdaux : nombres de dents (génériques), n satellites, module visuel ---- */
export const PGS = {
  p1: { zs: 66, zr: 156, zp: 45, n: 3, m: 0.135 },
  p2: { zs: 66, zr: 156, zp: 45, n: 3, m: 0.135 },
  p3: { zs: 74, zr: 122, zp: 24, n: 4, m: 0.1705 },
};
const RHO = { p1: PGS.p1.zr / PGS.p1.zs, p2: PGS.p2.zr / PGS.p2.zs, p3: PGS.p3.zr / PGS.p3.zs };

/* ---- éléments de friction ---- */
export const EL = ['a', 'b', 'd', 'e', 'f'];
export const EL_INFO = {
  a: { n: 'A', kind: 'Embrayage', role: 'relie l\'arbre de turbine à l\'arbre de soleil commun aux trains 1 et 2', coil: 'Y11' },
  b: { n: 'B', kind: 'Embrayage', role: 'relie l\'arbre de turbine au tambour « porte-satellites 1 / couronne 2 »', coil: 'Y12' },
  d: { n: 'D', kind: 'Frein', role: 'immobilise la couronne du train 3 (surfaces D1 + D2)', coil: 'Y14' },
  e: { n: 'E', kind: 'Frein', role: 'immobilise le tambour « couronne 1 / porte-satellites 3 »', coil: 'Y15' },
  f: { n: 'F', kind: 'Frein', role: 'immobilise le tambour « porte-satellites 1 / couronne 2 » (surfaces F1 + F2)', coil: 'Y16' },
};
export const TABLE = { N: [], 1: ['a', 'f'], 2: ['a', 'e'], 3: ['a', 'd'], 4: ['a', 'b'], 5: ['b', 'd'], 6: ['b', 'e'], R: ['d', 'f'] };
export const ZF_RATIO = { 1: 3.364, 2: 1.975, 3: 1.444, 4: 1.0, 5: 0.696, 6: 0.587, R: -3.769 };
export const GEARS_FWD = [1, 2, 3, 4, 5, 6];

/* ---- groupes d'arbres : 0 arbre de soleil (S1,S2) · 1 tambour X1 (C1,R2) · 2 tambour X2 (R1,C3) · 3 SORTIE (C2) · 4 ENTRÉE (S3) · 5 couronne 3 (R3) ---- */
function gauss(A, b) {
  const n = b.length; A = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
  }
  return A.map((r, i) => r[n] / r[i]);
}
/** vitesses des 6 groupes pour les éléments fermés (entrée = 1) */
export function solveEls(els) {
  const rows = [], rhs = [];
  const eq = (c) => { const r = [0, 0, 0, 0, 0, 0]; for (const [k, v] of Object.entries(c)) r[+k] += v; rows.push(r); };
  eq({ 0: 1, 2: RHO.p1, 1: -(1 + RHO.p1) }); rhs.push(0);          // Willis train 1 : S1 + ρ1 R1 = (1+ρ1) C1
  eq({ 0: 1, 1: RHO.p2, 3: -(1 + RHO.p2) }); rhs.push(0);          // train 2 : S2 + ρ2 R2 = (1+ρ2) C2
  eq({ 4: 1, 5: RHO.p3, 2: -(1 + RHO.p3) }); rhs.push(0);          // train 3 : S3 + ρ3 R3 = (1+ρ3) C3
  eq({ 4: 1 }); rhs.push(1);                                        // entrée
  for (const e of els) {
    if (e === 'a') { eq({ 4: 1, 0: -1 }); rhs.push(0); }
    else if (e === 'b') { eq({ 4: 1, 1: -1 }); rhs.push(0); }
    else if (e === 'd') { eq({ 5: 1 }); rhs.push(0); }
    else if (e === 'e') { eq({ 2: 1 }); rhs.push(0); }
    else if (e === 'f') { eq({ 1: 1 }); rhs.push(0); }
  }
  if (rows.length !== 6) return null;
  const x = gauss(rows, rhs);
  return x && { ss: x[0], x1: x[1], x2: x[2], out: x[3], inp: x[4], r3: x[5] };
}
export function solveGear(g) {
  if (g === 'N') return { ss: 0, x1: 0, x2: 0, out: 0, inp: 1, r3: -1 / RHO.p3 };      // neutre : seul le train 3 tourne à vide
  return solveEls(TABLE[g]);
}
export const IRATIO = {}; [...GEARS_FWD, 'R'].forEach((g) => { const s = solveGear(g); IRATIO[g] = 1 / s.out; });
export const gearName = (g) => (g === 'R' ? 'AR' : g === 'N' ? 'N' : `${g}`);

/* ---- moteur diesel de bus (courbe générique) + limite de couple de la boîte (6 AP 1620 B : 1 600 N·m) ---- */
export const TORQUE_LIMIT = 1600;
const CURVE = [[0, 0], [400, 300], [600, 560], [800, 760], [1000, 900], [1200, 1000], [1500, 1000], [1800, 950], [2000, 900], [2200, 830], [2400, 740]];
export function engineCurve(rpm) {
  if (rpm <= CURVE[0][0]) return CURVE[0][1];
  for (let i = 1; i < CURVE.length; i++) if (rpm <= CURVE[i][0]) { const [x0, y0] = CURVE[i - 1], [x1, y1] = CURVE[i]; return y0 + ((y1 - y0) * (rpm - x0)) / (x1 - x0); }
  return CURVE[CURVE.length - 1][1];
}
export const IFD = 5.0, WHEEL_R = 0.5;          // pont de bus générique ; rayon sous charge 0,5 m
export const IDLE = 620;

/* ---- sondes CTN (valeurs nominales arrondies, manuel ZF §25) : T(°C) -> R(kΩ) ---- */
const NTC = {
  ret: [[20, 123.8], [40, 51.88], [80, 11.84], [100, 6.283]],
  carter: [[20, 62.383], [40, 26.713], [80, 6.337], [100, 3.426]],
};
export function ntcR(kind, T) {
  const t = NTC[kind]; if (T <= t[0][0]) return t[0][1] * Math.exp((Math.log(t[1][1] / t[0][1]) * (T - t[0][0])) / (t[1][0] - t[0][0]));
  for (let i = 1; i < t.length; i++) if (T <= t[i][0]) { const [x0, y0] = t[i - 1], [x1, y1] = t[i]; return Math.exp(Math.log(y0) + ((Math.log(y1) - Math.log(y0)) * (T - x0)) / (x1 - x0)); }
  const [x0, y0] = t[t.length - 2], [x1, y1] = t[t.length - 1];
  return Math.exp(Math.log(y1) + ((Math.log(y1) - Math.log(y0)) * (T - x1)) / (x1 - x0));
}

/* ---- AIS (Automatic Idle Shift), tableau ZF : O = appliqué, X = fermé ---- */
export const AIS_TABLE = [
  ['AIS rapport 1', 'O', '—', 'X'], ['AIS rapport 2 (version spéciale)', 'O', 'X', '—'],
  ['AIS optimisé rapport 1', '—', '—', 'X'], ['AIS optimisé rapport 2 (version spéciale)', '—', 'X', '—'], ['NB : disponibilité du neutre', '—', '—', 'X'],
];

/* ---- points de mesure ZF (huile 50-65 °C, N, WK ouvert) : plages de contrôle ---- */
export const CHECKS = {
  phd: { n: 'PHD', f: 'pression principale', lo: [8, 10], hi: [12, 12], pts: [620, 2200] },
  a8: { n: 'A8', f: 'aval convertisseur', lo: [4.5, 5], hi: [6.5, 6.5] },
  d6: { n: 'D6', f: 'aval échangeur ralentisseur', lo: [0.8, 3], hi: [3, 5] },
  d8: { n: 'D8', f: 'lubrification', lo: [0.4, 1.6], hi: [1.5, 3] },
};
const lerp = (a, b, t) => a + (b - a) * t;
const rpmT = (rpm) => clamp((rpm - 620) / (2200 - 620), 0, 1.4);

const T = { fill: 0.25, torque: 0.45, inertia: 0.6, dwell: 1.2 };
const CAP = 1.8;                                   // capacité nominale des éléments (× couple turbine maxi)

export class EcoSim {
  constructor() { this.reset(); }
  reset() {
    this.sel = 'N'; this.mode = 'auto'; this.gear = 'N';
    this.engineRpm = IDLE; this.engineOn = true; this.load = 'accel'; this.brake = false; this.wkMode = 'auto'; this.aisOpt = 'std';
    this.lv = { a: 0, b: 0, d: 0, e: 0, f: 0 };
    this.cmd = { a: 0, b: 0, d: 0, e: 0, f: 0, wk: 0, ret: 0 };
    this.fill = { a: 0, b: 0, d: 0, e: 0, f: 0 };
    this.sl2 = { d: 0, f: 0 };                        // surfaces D2 / F2 actives
    this.slipEl = { a: 0, b: 0, d: 0, e: 0, f: 0 };
    this.lu = 0; this.SR = 0.98; this.stator = 'locked'; this.wkSlip = 0;
    this.ret = { demand: 0, fill: 0, torque: 0, power: 0 }; this.retDemand = 0;
    this.n = { eng: IDLE, turb: IDLE * 0.98, ss: 0, x1: 0, x2: 0, out: 0, r3: 0, stator: 0, ret: 0 };
    this.ang = { eng: 0, turb: 0, ss: 0, x1: 0, x2: 0, out: 0, r3: 0, stator: 0, ret: 0, pump: 0 };
    this.v = 0; this.slip = 0; this.phase = 0; this.shift = null; this.dwell = 9; this.tt = 0;
    this.oilT = 70; this.retT = 60; this.pLevel = 1;
    this.p = { phd: 10, pvf: 10.3, a8: 5.5, d6: 1.9, d8: 1.0, wk: 0, r3: 0, ra: 0, rhd: 0 };
    this.hold = 0; this.stopT = 0; this.accu = 1;
    this.events = []; this.timeScale = 1; this.visMul = 1;
    this.clutchPedal = false; this.clutch = 1; this.turn = 0; this.autoWarm = false; this.noise = { bearing: 0, grind: 0 };
    this.faults = {}; this.sync = {}; this.nOut = 0; this.tTurb = 0; this.rpmDisp = IDLE; this.ais = false; this.cool = 'traction';
  }
  get gears() { return ['R', 'N', 'D', 1, 2, 3, 4, 5, 6]; }

  /* ----------------------------------------------------------------------- pilotage */
  say(msg) { this.events.push({ type: 'refus', msg }); return false; }
  requestGear(g) {
    if (this.shift && this.shift.kind !== 'release') return false;
    const vAbs = Math.abs(this.v);
    if (g === 'N') { this.sel = 'N'; this.mode = 'auto'; return this.goto('N'); }
    if (g === 'R') { if (vAbs > 3) return this.say('Marche arrière refusée : le véhicule roule (protection du calculateur).'); this.sel = 'R'; this.mode = 'auto'; return this.goto('R'); }
    if (g === 'D') { this.sel = 'D'; this.mode = 'auto'; if (this.gear === 'N' || this.gear === 'R') return this.goto(1); return true; }
    if (typeof g === 'number') {
      const cur = typeof this.gear === 'number' ? this.gear : 1;
      if (this.gear === 'R' && vAbs > 1) return this.say('Sélection refusée : inversion de marche en roulant.');
      const nxt = this.engineRpm * (IRATIO[g] / IRATIO[cur]);
      if (g < cur && nxt > 2300) return this.say(`Rétrogradage refusé : le moteur passerait à ${Math.round(nxt)} tr/min (protection contre le sur-régime).`);
      this.sel = 'D'; this.mode = 'manual'; return this.goto(g);
    }
    return false;
  }
  forceGear(g, rpm) {
    this.shift = null; this.phase = 0; this.dwell = 9; this.engineOn = true; this.stopT = 0;
    this.sel = g === 'N' || g === 'R' ? g : 'D'; this.mode = g === 'N' || g === 'R' ? 'auto' : 'manual';
    this.gear = g; this.engineRpm = rpm; this.brake = false;
    for (const e of EL) { const on = TABLE[g].includes(e); this.lv[e] = on ? 1 : 0; this.cmd[e] = on ? 1 : 0; this.fill[e] = on ? 1 : 0; }
    this.SR = g === 'N' ? 0.98 : this.targetSR(); this.lu = 0; this.ret.fill = 0; this.ret.demand = 0;
    this.applyFaultsToLv(); this.update(0); this.events.length = 0;
  }
  goto(g) {
    if (g === this.gear) return false;
    const to = TABLE[g], from = TABLE[this.gear];
    const off = from.filter((e) => !to.includes(e)), on = to.filter((e) => !from.includes(e));
    this.shift = { from: this.gear, to: g, t: 0, ph: 1, off, on, nOut0: this.nOut, kind: typeof g === 'number' && typeof this.gear === 'number' ? 'clutch' : g === 'N' ? 'release' : 'engage' };
    this.phase = this.shift.kind === 'release' ? 0 : 1;
    this.events.push({ type: 'shift-start', to: g });
    return true;
  }

  /* ----------------------------------------------------------------------- défauts */
  health(e) { return this.faults.health && this.faults.health[e] !== undefined ? this.faults.health[e] : 1; }
  leak(e) { return this.faults.leak && this.faults.leak[e] ? this.faults.leak[e] : 0; }
  noVP2(e) { return (!!this.faults.vp2 && ['a', 'd', 'f', 'wk'].includes(e)) || (!!this.faults.vp1 && ['b', 'e'].includes(e)); }
  applyFaultsToLv() { for (const e of EL) { this.lv[e] = Math.min(this.lv[e], 1 - this.leak(e)); if (this.noVP2(e)) this.lv[e] = 0; } }

  /* ----------------------------------------------------------------------- convertisseur, pontage */
  wkCommanded() {
    if (this.wkMode === 'open') return false;
    if (this.wkMode === 'closed') return typeof this.gear === 'number' && !this.brake && this.engineRpm > 700;
    const g = this.gear;
    if (typeof g !== 'number' || g < 3 || this.brake || this.shift || this.dwell < 1.0) return false;
    if (this.oilT < 45 || this.faults.noWK) return false;
    const r = this.engineRpm;
    return r > 950 && r < 2300 && (this.load !== 'accel' || (g >= 4 && r > 1100 && r < 1900));
  }
  targetSR() {
    if (this.gear === 'N') return 0.98;
    if (this.brake) return 0;
    if (this.lu > 0.9) return 1;
    if (this.load === 'decel') return 1.03;
    if (this.load === 'stab') return 0.95;
    return 0.8 + 0.14 * clamp((this.engineRpm - 800) / 1400, 0, 1);
  }
  torqueRatio() { return this.lu > 0.9 ? 1 : this.SR >= 0.86 ? 1 : 1 + 1.15 * (1 - this.SR / 0.86); }
  engineTorque() {
    if (!this.engineOn) return 0;
    const c = engineCurve(Math.max(300, this.engineRpm));
    return this.load === 'accel' ? c : this.load === 'stab' ? 0.35 * c : -(80 + 0.05 * this.engineRpm);
  }
  weight(g) { return typeof g === 'number' || g === 'R' ? Math.max(1.0, Math.abs(IRATIO[g]) / 2.0) : 0; }

  /* ----------------------------------------------------------------------- hydraulique (valeurs ZF §22) */
  updateHydraulics(dt) {
    const f = this.faults, rt = rpmT(this.engineRpm), run = this.engineOn && this.engineRpm > 250;
    const lowOil = clamp(f.oilLevel === undefined ? 1 : f.oilLevel, 0, 1);
    const pumpK = (f.pumpWear === undefined ? 1 : f.pumpWear) * (0.6 + 0.4 * lowOil);
    const cold = this.oilT < 40 ? 0.4 : 0;
    let phd = (lerp(9.9, 11.1, rt) + (this.load === 'accel' && typeof this.gear === 'number' ? 0.4 : 0) + cold) * (f.phdLow === undefined ? 1 : f.phdLow) * clamp(0.55 + 0.45 * pumpK, 0.3, 1.05);
    const clog = f.filterClog || 0; phd *= 1 - 0.45 * clog;               // filtre colmaté : la pression disponible chute sous demande
    const dpF = (0.25 + 0.2 * rt + 1.1 * clog) * (0.8 + 0.2 * rt);
    this.stopT = run ? 0 : this.stopT + dt;
    if (run) { this.hold = phd; this.accu = approach(this.accu, f.accuBad ? 0.1 : 1, dt / 4); }
    else {
      const leakTau = f.checkValve ? 3.5 : f.accuBad ? 9 : 28;          // clapet 29 / accumulateur : maintien de PHD à l'arrêt
      this.hold = Math.max(0, this.hold * Math.exp(-dt / leakTau) - dt * 0.01);
    }
    this.p.phd = run ? phd : this.hold;
    this.p.pvf = this.p.phd + (run ? dpF : 0.05 * clog);
    this.dpFilter = run ? dpF : 0;
    const wkOpen = this.lu < 0.5;
    this.p.a8 = run ? lerp(5.5, 5.8, rt) * (f.a8Low || 1) * (wkOpen ? 1 : 1.04) : 0;
    const exch = 1 - 0.85 * (f.exchClog || 0);
    this.p.d6 = run ? lerp(1.9, 4.0, rt) * (0.4 + 0.6 * exch) * (this.cool === 'retarder' ? 1.15 : 1) : 0;
    this.p.d8 = run ? lerp(1.0, 2.3, rt) * (0.55 + 0.45 * exch) * (0.7 + 0.3 * lowOil) : 0;
    this.bypass4 = clog > 0.45; this.bypass31 = (f.exchClog || 0) > 0.4;
    this.run = run; this.pumpQ = run ? this.engineRpm * pumpK : 0;
    /* pressions de commande des éléments */
    for (const e of EL) this.p['p' + e] = this.p.phd * this.lv[e] * (e === 'a' || e === 'd' || e === 'f' ? 1 : 1);
    this.p.pwk = this.p.phd * this.lu;
    /* ralentisseur : régulateurs 10 / 11, accumulateur 12 */
    const dem = this.engineOn ? this.retDemand : 0;
    this.p.rr3 = this.p.phd * dem * (f.vp1 ? 0 : 1); this.p.r3 = this.p.rr3 * 0.95;
    this.cool = this.p.rr3 > 3 ? 'retarder' : 'traction';       // KUV 13 : commutation de la valve 14
  }

  /* ----------------------------------------------------------------------- pas de simulation */
  update(dt) {
    this.events.length = 0; this.tt += dt; this.dwell += dt;
    const g = this.gear, sh = this.shift;
    /* moteur : arrêt / démarrage */
    if (!this.engineOn) this.engineRpm = Math.max(0, this.engineRpm - 900 * dt);
    else if (this.engineRpm < 300) this.engineRpm = Math.min(IDLE, this.engineRpm + 700 * dt);
    /* consignes */
    const target = sh ? (sh.kind === 'release' ? [] : TABLE[sh.to]) : TABLE[g];
    const eng = sh && sh.kind !== 'release' ? new Set([...TABLE[sh.from], ...TABLE[sh.to]]) : new Set(target);
    for (const e of EL) this.cmd[e] = eng.has(e) && !(sh && sh.off.includes(e) && sh.ph >= 2) && this.engineOn ? 1 : 0;
    this.cmd.wk = this.wkCommanded() ? 1 : 0; this.cmd.ret = this.retDemand;
    /* AIS : à l'arrêt, rapport engagé, frein appuyé -> A « appliqué » (ou non) et F fermé */
    this.ais = this.aisOpt !== 'off' && this.sel === 'D' && typeof g === 'number' && g === 1 && this.brake && Math.abs(this.v) < 1.5 && !sh;
    /* lois de passage */
    if (this.sel === 'D' && this.mode === 'auto' && !this.shift && this.dwell > T.dwell && typeof g === 'number' && !this.brake) {
      const up = this.load === 'accel' ? 2050 : this.load === 'stab' ? 1550 : 1800, dn = this.load === 'accel' ? 850 : 760;
      if (this.engineRpm > up && g < 6) this.goto(g + 1);
      else if (this.engineRpm < dn && g > 1 && this.v > 3) this.goto(g - 1);
    }
    /* séquence de passage */
    let blend = null;
    const s2 = this.shift;
    if (s2) {
      s2.t += dt;
      const fillT = T.fill * (this.faults.slowFill && s2.on.some((e) => this.faults.slowFill.includes(e)) ? 2.4 : 1);
      if (s2.kind === 'release') {
        for (const e of EL) this.lv[e] = approach(this.lv[e], 0, dt / 0.4);
        if (EL.every((e) => this.lv[e] <= 0.001)) { this.gear = s2.to; this.shift = null; this.phase = 0; this.dwell = 0; }
      } else if (s2.ph === 1) {
        this.phase = 1; for (const e of s2.on) this.fill[e] = clamp(s2.t / fillT, 0, 1);
        if (s2.t >= fillT) { s2.ph = 2; s2.t = 0; }
      } else if (s2.ph === 2) {
        this.phase = 2; const u = clamp(s2.t / T.torque, 0, 1);
        for (const e of s2.on) this.lv[e] = smooth(u) * (1 - this.leak(e));
        for (const e of s2.off) this.lv[e] = 1 - smooth(clamp(u * 1.25, 0, 1));
        if (u >= 1) { s2.ph = 3; s2.t = 0; s2.nOut0 = this.nOut; for (const e of s2.off) this.fill[e] = 0; }
      } else if (s2.kind === 'clutch') {
        this.phase = 3; const u = clamp(s2.t / T.inertia, 0, 1);
        const a = solveGear(s2.from).out, b = solveGear(s2.to).out;
        blend = { r: a + (b - a) * smooth(u), u };
        if (u >= 1) { this.gear = s2.to; this.shift = null; this.phase = 0; this.dwell = 0; blend = null; }
      } else { this.phase = 3; if (s2.t >= 0.4) { this.gear = s2.to; this.shift = null; this.phase = 0; this.dwell = 0; } }
    } else {
      for (const e of EL) { const want = TABLE[g].includes(e) ? 1 : 0; this.lv[e] = approach(this.lv[e], want * (1 - this.leak(e)), dt / 0.25); this.fill[e] = want ? 1 : approach(this.fill[e], 0, dt / 0.3); }
    }
    for (const e of EL) if (this.noVP2(e) || !this.engineOn) { this.lv[e] = this.engineOn ? 0 : Math.max(0, this.lv[e] - dt / 0.8); if (this.noVP2(e)) this.fill[e] = 0; }
    /* surfaces supplémentaires : D2 à fort couple, F2 en marche arrière (valve 21 : PF + PD) */
    const gg = sh && sh.ph >= 3 ? sh.to : g;
    this.sl2.d = approach(this.sl2.d, TABLE[gg].includes('d') && (gg === 'R' || Math.abs(this.engineTorque()) > 650 || this.sl2.d > 0.5 && Math.abs(this.engineTorque()) > 500) ? 1 : 0, dt / 0.2);
    this.sl2.f = approach(this.sl2.f, gg === 'R' ? 1 : 0, dt / 0.2);
    /* hydraulique */
    this.updateHydraulics(dt);
    /* pontage WK et convertisseur */
    const wantLU = this.cmd.wk && this.run && !this.faults.vp2 ? 1 : 0;
    const nT0 = this.SR * this.engineRpm, lu0 = this.lu;
    this.lu = approach(this.lu, wantLU, dt / (wantLU ? 0.9 : 0.3));
    const tgt = this.targetSR();
    this.SR += (tgt - this.SR) * (1 - Math.exp(-dt / (this.lu > 0.5 ? 0.2 : this.brake || this.SR < 0.3 ? 1.2 : 0.7)));
    if (!this.shift && !this.brake && this.engineOn && (this.lu > 0.002 || lu0 > 0.002)) this.engineRpm = clamp(nT0 / Math.max(0.6, this.SR), 500, 2400);
    const wkOK = this.faults.a8Low ? 0.35 : this.faults.wkLow ? 0.4 : 1;
    this.wkSlip = this.lu > 0.5 ? clamp((1 - wkOK) * 0.9 * (this.load === 'accel' ? 1 : 0.6), 0, 0.5) : 0;
    this.stator = this.lu > 0.9 || this.SR >= 0.86 ? 'free' : 'locked';
    /* patinage des éléments */
    const eff = this.shift && this.shift.ph >= 3 ? this.shift.to : this.gear;
    const tTurb = Math.abs(this.engineTorque()) * (this.load === 'decel' ? 0.6 : 1) * this.torqueRatio();
    this.tTurb = this.engineTorque() * this.torqueRatio();
    const pF = clamp((this.p.phd - 3) / 7.5, 0.05, 1.1), tempF = this.oilT > 120 ? 0.8 : 1;       // capacité ∝ (pression − précharge du ressort de rappel ≈ 3 bar)
    let slip = 0; for (const e of EL) this.slipEl[e] = 0;
    if (!this.shift || this.shift.ph >= 3) for (const e of TABLE[eff] || []) {
      const surf = (e === 'd' ? 1 + 0.9 * this.sl2.d : e === 'f' ? 1 + 0.9 * this.sl2.f : 1);
      const cap = Math.max(1e-3, this.lv[e] * CAP * this.health(e) * pF * tempF * surf) * 900;
      const req = tTurb * this.weight(eff) * 0.62 + (this.load === 'decel' ? 20 : 0);
      let s = clamp((req / cap - 1) * 1.8, 0, 1); if (this.lv[e] < 0.08) s = 1;
      this.slipEl[e] = s; slip = Math.max(slip, s);
    }
    this.slip += (slip - this.slip) * (1 - Math.exp(-dt / 0.12));
    const drive = (typeof eff === 'number' || eff === 'R') && this.engineOn;
    /* régimes : calage (frein) / phase d'inertie */
    if (drive && this.brake && !this.ais) { const cap = 1900 + this.slip * 450; if (this.engineRpm > cap) this.engineRpm = cap; }
    let nT = this.SR * this.engineRpm, r;
    if (blend) { r = blend.r; nT = Math.abs(this.shift.nOut0 / r); this.engineRpm = clamp(nT / Math.max(0.5, this.SR), 500, 2400); }
    else r = solveGear(eff === 'N' ? 'N' : eff).out;
    let nOutExp = drive ? nT * r : 0;
    if (drive && this.brake) { nOutExp = 0; nT = 0; }
    const nOut = nOutExp * (1 - 0.9 * this.slip); this.nOut = nOut; this.nOutExp = nOutExp;
    this.v = (nOut / IFD) * TAU * WHEEL_R * 0.06;
    /* ralentisseur (primaire : côté entrée de boîte) */
    const slowAccu = this.accu < 0.5 ? 2.6 : 1;
    this.ret.fill = approach(this.ret.fill, clamp(this.p.r3 / 9, 0, 1), dt / (0.35 * slowAccu * (this.p.r3 > 0.5 ? 1 : 0.6)));
    const nRet = Math.abs(nT) * (this.run ? 1 : 0);
    this.ret.torque = 1100 * this.ret.fill * Math.pow(nRet / 2000, 2) * (this.faults.oilLevel !== undefined ? clamp(this.faults.oilLevel + 0.2, 0.2, 1) : 1);
    this.ret.power = this.ret.torque * nRet * TAU / 60 / 1000;      // kW
    /* thermique */
    const cl = 1 - 0.85 * (this.faults.exchClog || 0) - (this.faults.valve14 ? 0.5 : 0);
    const heat = this.slip * 14 + (this.lu < 0.5 && drive ? (1 - this.SR) * 3 + 0.5 : 0) + this.ret.power * 0.012;
    this.oilT = clamp(this.oilT + (heat * 0.5 - (this.oilT - 72) * 0.04 * cl) * dt, 25, 175);
    this.retT = clamp(this.retT + (this.ret.power * 0.0184 - (this.retT - 60) * 0.05 * cl) * dt, 20, 170);
    this.warnHot = this.oilT > 120 || this.retT > 140;
    /* vitesses de nœuds (animation) */
    const co = blend ? blendCo(this.shift.from, this.shift.to, blend.u) : solveGear(eff === 'N' || !drive ? 'N' : eff);
    const fr_ = 1 - 0.9 * this.slip, N = this.n;
    N.eng = this.engineRpm; N.turb = drive && this.brake ? 0 : this.engineOn ? (this.lu > 0.5 ? this.engineRpm * (1 - this.wkSlip) : this.SR * this.engineRpm) : this.engineRpm;
    if (blend) N.turb = nT;
    if (drive && !this.brake) { N.ss = N.turb * co.ss * fr_; N.x1 = N.turb * co.x1 * fr_; N.x2 = N.turb * co.x2 * fr_; N.out = nOut; N.r3 = N.turb * co.r3 * fr_; }
    else { N.ss = 0; N.x1 = 0; N.x2 = 0; N.out = 0; N.r3 = N.turb * co.r3; }
    N.stator = this.stator === 'free' ? Math.min(this.engineRpm, N.turb) * 0.9 : 0; N.ret = this.run ? Math.abs(N.turb) : N.turb;
    const k = VIS * (this.visMul || 1) * (TAU / 60) * dt;
    for (const id of ['eng', 'turb', 'ss', 'x1', 'x2', 'out', 'r3', 'stator', 'ret']) this.ang[id] += N[id] * k;
    this.ang.pump += N.eng * k;
    this.rpmDisp = this.engineRpm * (1 + 0.1 * this.slip);
    if (this.slip > 0.4 && !this._ev) { this._ev = true; this.events.push({ type: 'slip' }); } if (this.slip < 0.15) this._ev = false;
  }

  /* ----------------------------------------------------------------------- explication en clair */
  flow() { const els = TABLE[typeof this.gear === 'number' || this.gear === 'R' ? this.gear : 1] || []; return { level: this.gear === 'N' ? 0 : Math.max(...els.map((x) => this.lv[x]), 0), sign: this.load === 'decel' ? -1 : 1 }; }
  explain() {
    const g = this.gear, sh = this.shift, nm = (x) => EL_INFO[x].n;
    const rows = [['Moteur', this.engineOn], [this.lu > 0.9 ? 'WK fermé' : 'Convertisseur', true]];
    const on = (typeof g === 'number' || g === 'R') && Math.abs(this.n.turb) > 15 && !this.brake;
    let text = '';
    if (!this.engineOn) { rows.push(['Pompe arrêtée', false]); text = '<b>Moteur arrêté</b> : la pompe ne débite plus. Le clapet 29 empêche le retour par la pompe et l\'accumulateur 12 maintient un moment <b>PHD</b> (contrôle ZF : ≥ 1,5 bar 20 s après l\'arrêt).'; }
    else if (g === 'N') {
      rows.push(['Arbre de turbine', true], ['Aucun élément fermé', false], ['Sortie libre', false], ['Roues', false]);
      text = this.sel === 'N' ? '<b>N (neutre)</b> : aucun élément n\'est fermé. Le convertisseur entraîne la turbine mais la sortie est libre : <b>aucun couple aux roues</b>.' : '…';
      if (sh) text = 'Passage en cours : les pistons se remplissent d\'huile sous pression PHD…';
    } else {
      const els = TABLE[g], i = IRATIO[g];
      rows.push(['Arbre de turbine', on], [els.map(nm).join(' + '), on], ['Trains 3 · 1 · 2', on], ['Sortie', on], ['Roues', on]);
      const ctl = els.map((x) => `<b>${nm(x)}</b> (${EL_INFO[x].kind.toLowerCase()}) ${EL_INFO[x].role}`).join(' ; ');
      text = g === 'R' ? `<b>Marche arrière</b> : ${ctl}. i = <b>${fr(i, 3)}</b> (sens inversé).` : `<b>${g === 1 ? '1ère' : g + 'ème'}</b> : ${ctl}. Rapport <b>i = ${fr(i, 3)}</b> (ZF : ${fr(ZF_RATIO[g], 3)}).`;
      if (this.ais) text = `<b>AIS (mise au ralenti automatique)</b> : arrêt au feu, F fermé${this.aisOpt === 'opt' ? '' : ', A appliqué légèrement'} : le couple transmis est réduit, le moteur reste au ralenti.`;
      if (sh && sh.kind !== 'release') text = `<b>Passage ${gearName(sh.from)} → ${gearName(sh.to)}</b> : ${sh.off.map(nm).join('+') || '—'} se relâche pendant que ${sh.on.map(nm).join('+') || '—'} se ferme. Le couple n'est jamais coupé.`;
      if (this.lu > 0.9 && !sh) text += ' <b>WK fermé</b> : liaison mécanique moteur / turbine, plus de glissement hydraulique.';
      if (this.ret.fill > 0.1) text += ` <b>Ralentisseur</b> : ${Math.round(this.ret.torque)} N·m (${Math.round(this.ret.power)} kW à évacuer en chaleur).`;
      if (this.slip > 0.25) text += ` <b style="color:var(--bad-txt)">Patinage ${Math.round(this.slip * 100)} %</b>.`;
    }
    return { chips: rows, text };
  }
  tele() {
    const g = this.gear, els = TABLE[g] || [];
    const press = els.length ? els.map((e) => `${EL_INFO[e].n} ${this.p['p' + e].toFixed(1).replace('.', ',')}`).join(' · ') : '—';
    return [
      ['Régime moteur', Math.round(this.rpmDisp), 'tr/min'],
      ['Rapport', `${this.sel === 'D' ? (this.mode === 'auto' ? 'D ' : 'D·manuel ') : ''}${gearName(g)}${this.ais ? ' · AIS' : ''}`, ''],
      ['Vitesse', Math.abs(this.v).toFixed(0), 'km/h'],
      ['Convertisseur', this.lu > 0.9 ? 'WK FERMÉ' : `SR ${fr(this.SR, 2)}`, this.lu > 0.9 ? '' : this.stator === 'locked' ? 'réacteur bloqué' : 'réacteur libre'],
      ['Éléments fermés (bar)', press, ''],
      ['Couple moteur', Math.round(this.engineTorque()), 'N·m'],
      ['Rapport i', IRATIO[g] ? fr(IRATIO[g], 3) : '—', ''],
      ['Régime turbine B12', Math.round(this.n.turb), 'tr/min'],
      ['PHD', this.p.phd.toFixed(1).replace('.', ','), 'bar'],
      ['Huile carter', Math.round(this.oilT), '°C'],
      ['Patinage', Math.round(this.slip * 100), '%'],
      ['Ralentisseur', Math.round(this.ret.torque), 'N·m'],
      ['Régime sortie B11', Math.round(this.n.out), 'tr/min'],
      ['Glissement WK', Math.round((this.lu > 0.5 ? this.wkSlip : this.engineRpm > 0 ? (this.engineRpm - this.n.turb) / this.engineRpm : 0) * 100), '%'],
    ];
  }
}
function blendCo(a, b, u) { const A = solveGear(a), B = solveGear(b), o = {}; u = clamp(u, 0, 1); for (const k in A) o[k] = A[k] + (B[k] - A[k]) * u; return o; }
