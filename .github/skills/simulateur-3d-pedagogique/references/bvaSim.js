/* ============================================================================
 * bvaSim.js — MODULE 2 : moteur physique d'une boîte automatique 6 rapports « type Lepelletier »
 *   (train simple réducteur + train Ravigneaux, 3 embrayages A-B-E, 2 freins C-D, convertisseur de couple à pontage).
 *
 *  Tableau d'engagement (classique pour cette architecture) :
 *      1 : A + D    2 : A + C    3 : A + B    4 : A + E    5 : B + E    6 : C + E    AR : B + D
 *  Les rapports sont CALCULÉS par les équations de Willis à partir des nombres de dents ci-dessous
 *  (valeurs génériques, choisies pour retrouver les rapports usuels de ce type de boîte : 4,19 · 2,34 · 1,51 · 1,14 · 0,87 · 0,69 · AR −3,40).
 *  Modèle PÉDAGOGIQUE : couples, pressions et temporisations sont des ordres de grandeur, pas des données constructeur.
 * ========================================================================== */
import { torqueCurve, WHEEL_R, VIS_SCALE, REDLINE_RPM } from './kinematics.js';
import { TAU } from './layout.js';

/** Nombres de dents (multiples de 3 pour l'assemblage à 3 satellites) */
export const Z = { s1: 57, r1: 111, p1: 27, s3: 48, s4: 39, R: 108, pl: 30, ps: 18 };
export const IFD = 3.7;                      // rapport de pont générique
const ETA = 0.9;                             // rendement global de la chaîne cinématique
const K = Z.r1 / (Z.r1 + Z.s1);              // n_réduit / n_entrée (train simple : couronne entraînée, soleil fixe)

export const EL = ['a', 'b', 'c', 'd', 'e'];
export const EL_INFO = {
  a: { n: 'A', kind: 'Embrayage', role: 'relie le train réducteur au petit planétaire S4', cap: 1.0 },
  b: { n: 'B', kind: 'Embrayage', role: 'relie le train réducteur au grand planétaire S3', cap: 1.0 },
  e: { n: 'E', kind: 'Embrayage', role: 'relie l\'arbre de turbine au porte-satellites du Ravigneaux', cap: 1.0 },
  c: { n: 'C', kind: 'Frein', role: 'bloque le grand planétaire S3 sur le carter', cap: 1.0 },
  d: { n: 'D', kind: 'Frein', role: 'bloque le porte-satellites du Ravigneaux sur le carter', cap: 1.0 },
};
export const TABLE = { P: [], N: [], 1: ['a', 'd'], 2: ['a', 'c'], 3: ['a', 'b'], 4: ['a', 'e'], 5: ['b', 'e'], 6: ['c', 'e'], R: ['b', 'd'] };
export const GEARS_FWD = [1, 2, 3, 4, 5, 6];

/** Vitesses des nœuds du train, en multiples du régime de turbine (n_entrée = 1) pour le rapport g */
export function solveGear(g) {
  const nr = K, { s3: Z3, s4: Z4, R: ZR } = Z;
  let s3 = 0, s4 = 0, c = 0, r = 0;
  switch (g) {
    case 1: s4 = nr; c = 0; r = (Z4 / ZR) * nr; s3 = (-ZR * r) / Z3; break;
    case 2: s4 = nr; s3 = 0; r = (nr * Z4 * (Z3 + ZR)) / (ZR * (Z3 + Z4)); c = (r * ZR) / (Z3 + ZR); break;
    case 3: s3 = s4 = c = r = nr; break;
    case 4: s4 = nr; c = 1; r = 1 + (Z4 / ZR) * (nr - 1); s3 = ((Z3 + ZR) * c - ZR * r) / Z3; break;
    case 5: s3 = nr; c = 1; r = ((Z3 + ZR) - Z3 * nr) / ZR; s4 = c + ((r - c) * ZR) / Z4; break;
    case 6: s3 = 0; c = 1; r = (Z3 + ZR) / ZR; s4 = c + ((r - c) * ZR) / Z4; break;
    case 'R': s3 = nr; c = 0; r = (-Z3 * nr) / ZR; s4 = (r * ZR) / Z4; break;
    default: break;                       // P / N : sortie libre
  }
  return { red: nr, s3, s4, c, r };
}
/** Rapport de réduction i = n_entrée / n_sortie */
export const ratioOf = (g) => { const r = solveGear(g).r; return r ? 1 / r : 0; };
export const IRATIO = {}; [...GEARS_FWD, 'R'].forEach((g) => { IRATIO[g] = ratioOf(g); });

const fr = (x, d = 3) => x.toFixed(d).replace('.', ',');
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const approach = (x, t, s) => (x < t ? Math.min(t, x + s) : Math.max(t, x - s));
export const gearName = (g) => (g === 'R' ? 'AR' : g === 'N' ? 'N' : g === 'P' ? 'P' : `${g}`);

/** Temporisations d'un changement de rapport (s, simulées) */
const T = { fill: 0.22, torque: 0.45, inertia: 0.55, release: 0.35, dwell: 1.1 };
/** Capacité de couple de chaque élément (fraction du couple turbine maxi ×) — marge nominale ≈ 1,6 */
const CAP0 = 2.6;
const SR_CP = 0.86;                          // point d'accouplement du convertisseur (le stator se libère)
const stallRpm = 2450;                       // régime de calage nominal (test de calage)

export class BvaSim {
  constructor() { this.reset(); }
  reset() {
    this.sel = 'N';                // position du sélecteur : P R N D
    this.mode = 'auto';            // 'auto' (D) ou 'manual' (rapport maintenu)
    this.gear = 'N';               // rapport effectivement engagé
    this.engineRpm = 800; this.load = 'accel'; this.brake = false;
    this.lv = { a: 0, b: 0, c: 0, d: 0, e: 0 };        // pression effective / capacité de chaque élément (0..1)
    this.cmd = { a: 0, b: 0, c: 0, d: 0, e: 0 };       // commande des électrovannes (calculateur)
    this.fill = { a: 0, b: 0, c: 0, d: 0, e: 0 };      // course du piston (remplissage)
    this.slipEl = { a: 0, b: 0, c: 0, d: 0, e: 0 };
    this.lu = 0; this.SR = 0.98; this.stator = 'locked';
    this.n = { eng: 800, turb: 784, red: 0, s3: 0, s4: 0, c: 0, r: 0, stator: 0 };
    this.ang = { eng: 0, turb: 0, red: 0, s3: 0, s4: 0, c: 0, r: 0, stator: 0, lu: 0 };
    this.v = 0; this.slip = 0; this.shudder = 0; this.phase = 0; this.shift = null; this.dwell = 9;
    this.oilT = 82; this.pLine = 4.5; this.events = []; this.timeScale = 1; this.visMul = 1;
    this.clutchPedal = false; this.clutch = 1; this.turn = 0; this.autoWarm = false;
    this.noise = { bearing: 0, grind: 0 }; this.faults = {}; this.sync = {};
    this.tt = 0; this.lastLu = 0; this.stall = false; this.rpmDisp = 800; this.nOutExp = 0; this.nOut = 0; this.tTurb = 0;
  }
  get gears() { return ['P', 'R', 'N', 'D', ...GEARS_FWD]; }

  /* ----------------------------------------------------------------------- pilotage */
  say(msg) { this.events.push({ type: 'refus', msg }); return false; }
  requestGear(g) {
    if (this.shift && this.shift.kind !== 'release') return false;
    const vAbs = Math.abs(this.v);
    if (g === 'P') { if (vAbs > 3) return this.say('Position P refusée : le véhicule roule. Le calculateur protège le cliquet de parking.'); this.sel = 'P'; this.mode = 'auto'; return this.goto('P'); }
    if (g === 'N') { this.sel = 'N'; this.mode = 'auto'; return this.goto('N'); }
    if (g === 'R') { if (vAbs > 5) return this.say('Marche arrière refusée : le véhicule roule (protection du calculateur).'); this.sel = 'R'; this.mode = 'auto'; return this.goto('R'); }
    if (g === 'D') { this.sel = 'D'; this.mode = 'auto'; if (this.gear === 'P' || this.gear === 'N' || this.gear === 'R') return this.goto(1); return true; }
    if (typeof g === 'number') {
      if (vAbs > 2 && (this.gear === 'R')) return this.say('Sélection refusée : inversion de marche en roulant.');
      const nxt = this.engineRpm * (IRATIO[g] / (typeof this.gear === 'number' ? IRATIO[this.gear] : IRATIO[1]));
      if (typeof this.gear === 'number' && g < this.gear && nxt > REDLINE_RPM * 0.97) return this.say(`Rétrogradage refusé : le moteur passerait à ${Math.round(nxt)} tr/min (protection contre le sur-régime).`);
      this.sel = 'D'; this.mode = 'manual'; return this.goto(g);
    }
    return false;
  }
  /** Position forcée (cas pratiques, tests) — régime moteur imposé */
  forceGear(g, rpm) {
    this.shift = null; this.phase = 0; this.dwell = 9;
    if (g === 'N' || g === 'P' || g === 'R') { this.sel = g; this.mode = 'auto'; } else { this.sel = 'D'; this.mode = 'manual'; }
    this.gear = g; this.engineRpm = rpm;
    for (const e of EL) { const on = TABLE[g].includes(e); this.lv[e] = on ? 1 : 0; this.cmd[e] = on ? 1 : 0; this.fill[e] = on ? 1 : 0; }
    this.brake = false; this.SR = g === 'N' || g === 'P' ? 0.98 : this.targetSR(); this.lu = 0; this.stator = this.SR < SR_CP ? 'locked' : 'free';
    this.applyFaultsToLv();
    this.update(0);
    this.events.length = 0;
  }
  goto(g) {
    if (g === this.gear) return false;
    const to = TABLE[g], from = TABLE[this.gear];
    const off = from.filter((e) => !to.includes(e)), on = to.filter((e) => !from.includes(e));
    const nOut0 = this.nOut;
    this.shift = { from: this.gear, to: g, t: 0, ph: 1, off, on, nOut0, rpm0: this.engineRpm, kind: typeof g === 'number' && typeof this.gear === 'number' ? 'clutch' : (g === 'N' || g === 'P') ? 'release' : 'engage', SR0: this.SR };
    this.phase = this.shift.kind === 'release' ? 0 : 1;
    this.events.push({ type: 'shift-start', to: g });
    return true;
  }

  /* ----------------------------------------------------------------------- modèle du convertisseur */
  lockupAllowed() {
    const g = this.gear;
    if (this.sel !== 'D' || typeof g !== 'number' || g < 3 || this.brake || this.shift) return false;
    if (this.oilT < 45 || this.dwell < 0.9 || this.faults.noLockup) return false;
    const r = this.engineRpm;
    // pontage : charge légère / stabilisée, ou accélération modérée dans les rapports hauts ; ouvert en forte accélération et dans les rapports bas
    return r > 1100 && r < 5600 && (this.load !== 'accel' || (g >= 5 && r > 1700 && r < 3200));
  }
  targetSR() {
    if (this.gear === 'N' || this.gear === 'P') return 0.98;
    if (this.brake) return 0;
    if (this.lu > 0.9) return 1;
    if (this.load === 'decel') return 1.03;
    if (this.load === 'stab') return 0.95;
    return 0.8 + 0.14 * clamp((this.engineRpm - 1000) / 2500, 0, 1);
  }
  torqueRatio() { return this.lu > 0.9 ? 1 : this.SR >= SR_CP ? 1 : 1 + 1.05 * (1 - this.SR / SR_CP); }
  engineTorque() { const c = torqueCurve(Math.max(800, this.engineRpm)); return this.load === 'accel' ? c : this.load === 'stab' ? 0.3 * c : -(18 + 0.0045 * this.engineRpm); }

  /* ----------------------------------------------------------------------- éléments */
  health(e) { return this.faults.health && this.faults.health[e] !== undefined ? this.faults.health[e] : 1; }
  /** Fuite hydraulique (joint de piston, tiroir…) : fraction de la pression perdue */
  leak(e) { return this.faults.leak && this.faults.leak[e] ? this.faults.leak[e] : 0; }
  stuckOff(e) { return !!(this.faults.stuckOff && this.faults.stuckOff.includes(e)); }
  applyFaultsToLv() { for (const e of EL) { const cap = 1 - this.leak(e); this.lv[e] = Math.min(this.lv[e], cap); if (this.stuckOff(e)) this.lv[e] = 0; } }
  /** Couple requis sur les éléments, en proportion de la capacité nominale */
  weight(g) { return typeof g === 'number' || g === 'R' ? Math.max(1.0, Math.abs(IRATIO[g]) / 2.0) : 0; }

  update(dt) {
    this.events.length = 0;
    this.tt += dt; this.dwell += dt;
    const g = this.gear, sh = this.shift;

    /* ---- consignes des électrovannes (calculateur) */
    const target = sh ? (sh.kind === 'release' ? [] : TABLE[sh.to]) : TABLE[g];
    const eng = sh && sh.kind !== 'release' ? new Set([...TABLE[sh.from], ...TABLE[sh.to]]) : new Set(target);
    for (const e of EL) this.cmd[e] = eng.has(e) && !(sh && sh.off.includes(e) && sh.ph >= 2) ? 1 : 0;

    /* ---- séquence de changement de rapport : remplissage -> transfert de couple -> phase d'inertie */
    let ratioBlend = null;
    if (sh) {
      sh.t += dt;
      const fillT = T.fill * (this.faults.slowFill && sh.on.some((e) => this.faults.slowFill.includes(e)) ? 2.2 : 1);
      if (sh.kind === 'release') {
        for (const e of EL) this.lv[e] = approach(this.lv[e], 0, dt / T.release);
        if (EL.every((e) => this.lv[e] <= 0.001)) { this.gear = sh.to; this.shift = null; this.phase = 0; this.dwell = 0; }
      } else if (sh.ph === 1) {
        this.phase = 1;
        for (const e of sh.on) this.fill[e] = clamp(sh.t / fillT, 0, 1);
        if (sh.t >= fillT) { sh.ph = 2; sh.t = 0; }
      } else if (sh.ph === 2) {
        this.phase = 2;
        const u = clamp(sh.t / T.torque, 0, 1);
        for (const e of sh.on) this.lv[e] = smooth(u) * (1 - this.leak(e));
        for (const e of sh.off) this.lv[e] = 1 - smooth(clamp(u * 1.25, 0, 1));
        if (u >= 1) { sh.ph = 3; sh.t = 0; sh.nOut0 = this.nOut; sh.rpm0 = this.engineRpm; for (const e of sh.off) this.fill[e] = 0; }
      } else if (sh.kind === 'clutch') {
        this.phase = 3;
        const u = clamp(sh.t / T.inertia, 0, 1);
        const rf = solveGear(sh.from).r, rt = solveGear(sh.to).r;
        ratioBlend = rf + (rt - rf) * smooth(u);
        if (u >= 1) { this.gear = sh.to; this.shift = null; this.phase = 0; this.dwell = 0; ratioBlend = null; }
      } else {                                       // engagement depuis N / P : le convertisseur « prend » la charge
        this.phase = 3;
        if (sh.t >= 0.35) { this.gear = sh.to; this.shift = null; this.phase = 0; this.dwell = 0; }
      }
    } else {
      for (const e of EL) { const want = TABLE[g].includes(e) ? 1 : 0; this.lv[e] = approach(this.lv[e], want * (1 - this.leak(e)), dt / 0.25); if (!want) this.fill[e] = approach(this.fill[e], 0, dt / 0.3); else this.fill[e] = 1; }
    }
    for (const e of EL) { if (this.stuckOff(e)) { this.lv[e] = 0; this.fill[e] = Math.min(this.fill[e], 0.0); } }

    /* ---- lois de passage (D, mode automatique) : montée si le régime dépasse le seuil, descente s'il est trop bas */
    if (this.sel === 'D' && this.mode === 'auto' && !this.shift && this.dwell > T.dwell && typeof this.gear === 'number' && !this.brake) {
      const up = this.load === 'accel' ? 3700 : this.load === 'stab' ? 2400 : 2100, dn = this.load === 'accel' ? 1500 : 1000;
      if (this.engineRpm > up && this.gear < 6) this.goto(this.gear + 1);
      else if (this.engineRpm < dn && this.gear > 1) this.goto(this.gear - 1);
    }

    /* ---- convertisseur : pontage et rapport de vitesses SR */
    const wantLU = this.lockupAllowed() ? 1 : 0;
    this.lu = approach(this.lu, wantLU, dt / (wantLU ? 0.8 : 0.25));
    const nT0 = this.SR * this.engineRpm;
    const tgt = this.targetSR();
    const tau = this.lu > 0.5 ? 0.2 : (this.brake || this.SR < 0.3) ? 1.1 : 0.7;
    this.SR += (tgt - this.SR) * (1 - Math.exp(-dt / tau));
    if (!this.shift && !this.brake && (this.lu > 0.002 || this.lastLu > 0.002)) {
      // pendant la fermeture / ouverture du pontage, la VITESSE du véhicule est conservée : c'est le régime moteur qui change
      this.engineRpm = clamp(nT0 / Math.max(0.6, this.SR), 600, REDLINE_RPM);
    }
    this.lastLu = this.lu;
    this.stator = this.lu > 0.9 || this.SR >= SR_CP ? 'free' : 'locked';

    /* ---- patinage des éléments (capacité vs couple à transmettre) */
    const gNow = this.gear, eff = sh && sh.ph >= 3 ? sh.to : gNow;
    const tTurb = Math.abs(this.engineTorque()) * (this.load === 'decel' ? 0.6 : 1) * this.torqueRatio();
    this.tTurb = this.engineTorque() * this.torqueRatio();
    const tempF = this.oilT > 120 ? 0.75 : this.oilT < 30 ? 0.9 : 1;
    const pF = clamp(this.faults.pressure === undefined ? 1 : this.faults.pressure, 0.2, 1);
    const maxT = 150;
    let slip = 0;
    for (const e of EL) this.slipEl[e] = 0;
    if (!this.shift || (this.shift.ph >= 3)) {
      for (const e of TABLE[eff]) {
        const cap = Math.max(1e-3, this.lv[e] * CAP0 * this.health(e) * tempF * pF) * maxT;
        const req = tTurb * this.weight(eff) * (this.load === 'stab' ? 1.1 : 1) + (this.load === 'decel' ? 6 : 0);
        let s = clamp((req / cap - 1) * 1.8, 0, 1);
        if (this.lv[e] < 0.08) s = 1;
        this.slipEl[e] = s; slip = Math.max(slip, s);
      }
    }
    this.slip += (slip - this.slip) * (1 - Math.exp(-dt / 0.12));
    const gOK = typeof eff === 'number' || eff === 'R';

    /* ---- régime moteur : test de calage (frein appuyé) et phase d'inertie */
    if (gOK && this.brake) { const cap = stallRpm + this.slip * 2800; if (this.engineRpm > cap) this.engineRpm = cap; }
    let nT = this.SR * this.engineRpm;
    let nOutExp, r;
    if (ratioBlend !== null) {
      r = ratioBlend; nOutExp = this.shift.nOut0; nT = Math.abs(nOutExp / r);
      this.engineRpm = Math.max(600, Math.min(REDLINE_RPM, nT / Math.max(0.5, this.SR)));
    } else {
      r = solveGear(eff).r;
      nOutExp = gOK ? nT * r : 0;
    }
    if (this.gear === 'P') nOutExp = 0;
    if (gOK && this.brake) nOutExp = 0;
    if (gOK && this.brake) nT = 0;
    this.nOutExp = nOutExp;
    const nOut = nOutExp * (1 - 0.9 * this.slip);
    this.nOut = nOut;
    this.v = (nOut / IFD) * TAU * WHEEL_R * 0.06;
    // régime moteur AFFICHÉ : broutement du pontage (vibration à 7 Hz) et emballement du moteur si patinage
    this.shudder = 0;
    if (this.faults.lockupBad && this.lu > 0.15 && this.load === 'stab') this.shudder = Math.sin(this.tt * 44);
    this.rpmDisp = this.engineRpm * (1 + 0.1 * this.slip) + 70 * this.shudder;

    /* ---- vitesses de rotation des nœuds (pour l'animation) */
    const co = ratioBlend !== null ? this.blendCo(this.shift.from, this.shift.to, (ratioBlend - solveGear(this.shift.from).r) / (solveGear(this.shift.to).r - solveGear(this.shift.from).r || 1)) : solveGear(eff);
    const fr_ = 1 - 0.9 * this.slip;
    const N = this.n;
    N.eng = this.engineRpm; N.turb = nT || (this.brake ? 0 : this.SR * this.engineRpm);
    if (!gOK) N.turb = this.SR * this.engineRpm;
    N.red = N.turb * K;
    if (gOK) {
      N.s3 = N.turb * co.s3 * fr_ * (this.brake ? 0 : 1); N.s4 = N.turb * co.s4 * fr_ * (this.brake ? 0 : 1); N.c = N.turb * co.c * fr_ * (this.brake ? 0 : 1); N.r = nOut;
      if (this.brake) { N.s3 = N.s4 = N.c = 0; }
    } else { N.s3 = N.s4 = N.c = 0; N.r = 0; }
    N.stator = this.stator === 'free' ? Math.min(this.engineRpm, N.turb) * 0.9 : 0;

    /* ---- chaleur : le patinage échauffe l'huile */
    const dT = this.slip * 5 + (this.lu > 0.1 && this.faults.lockupBad ? 0.6 : 0) + (this.engineRpm > 3500 ? 0.15 : 0) - (this.oilT - 82) / 80;
    this.oilT = clamp(this.oilT + dT * dt, 30, 165);
    this.pLine = this.linePressure();

    const k = VIS_SCALE * (this.visMul || 1) * (TAU / 60) * dt;
    for (const id of ['eng', 'turb', 'red', 's3', 's4', 'c', 'r', 'stator']) this.ang[id] += N[id] * k;
    this.ang.lu += (N.turb) * k;
    if (this.slip > 0.4 && !this._slipEv) { this._slipEv = true; this.events.push({ type: 'slip' }); }
    if (this.slip < 0.15) this._slipEv = false;
  }
  blendCo(a, b, u) { const A = solveGear(a), B = solveGear(b), o = {}; u = clamp(u, 0, 1); for (const k in A) o[k] = A[k] + (B[k] - A[k]) * u; return o; }
  linePressure() {
    const base = this.gear === 'N' || this.gear === 'P' ? 4.5 : 5.5 + 5.5 * clamp(Math.abs(this.engineTorque()) / 150, 0, 1);
    return base * (this.faults.pressure === undefined ? 1 : this.faults.pressure) * (this.oilT > 135 ? 0.9 : 1);
  }

  /* ----------------------------------------------------------------------- explication en clair */
  flow() {
    const e = this.gear === 'N' || this.gear === 'P' ? 0 : Math.max(...TABLE[typeof this.gear === 'number' || this.gear === 'R' ? this.gear : 1].map((x) => this.lv[x]), 0);
    return { level: e, sign: this.load === 'decel' ? -1 : 1 };
  }
  explain() {
    const g = this.gear, sh = this.shift;
    const nm = (x) => EL_INFO[x].n;
    const rows = [['Moteur', true], ['Convertisseur', true]];
    const on = (typeof g === 'number' || g === 'R') && Math.abs(this.n.turb) > 20;
    let text = '';
    if (g === 'P' || g === 'N') {
      rows.push(['Arbre de turbine', true], ['Train réducteur', true], ['Embrayages ouverts', false], ['Roues', false]);
      text = g === 'P' ? '<b>P (parking)</b> : aucun élément appliqué, la sortie est bloquée par le <b>cliquet de parking</b> sur la roue crantée.'
        : '<b>N (point mort)</b> : aucun embrayage ni frein n\'est appliqué. Le convertisseur entraîne la turbine, mais le train de sortie est libre : <b>aucun couple aux roues</b>.';
      if (sh) text = 'Passage au rapport demandé : les éléments se remplissent d\'huile sous pression…';
    } else {
      const els = TABLE[g];
      rows.push(['Arbre de turbine', on], ['Train réducteur (×' + fr(K, 3) + ')', on], [els.map(nm).join(' + '), on], ['Ravigneaux', on], ['Sortie', on], ['Roues', on]);
      const i = IRATIO[g];
      const ctl = els.map((x) => `<b>${nm(x)}</b> (${EL_INFO[x].kind.toLowerCase()}) ${EL_INFO[x].role}`).join(' ; ');
      const lu = this.lu > 0.9 ? ' Le <b>pontage</b> est fermé : plus de glissement dans le convertisseur.' : '';
      text = g === 'R'
        ? `<b>Marche arrière</b> : ${ctl}. Rapport i = <b>${fr(i, 2)}</b> (négatif : la couronne tourne à l'envers).`
        : `<b>${g === 1 ? '1ère' : g + 'ème'}</b> : ${ctl}. Rapport <b>i = ${fr(i, 3)}</b> (calculé avec les dents : ${this.ratioFormula(g)}).${lu}`;
      if (sh && sh.kind !== 'release') text = `<b>Passage ${gearName(sh.from)} → ${gearName(sh.to)}</b> : ${sh.off.map((x) => nm(x)).join('+') || '—'} se relâche pendant que ${sh.on.map((x) => nm(x)).join('+') || '—'} s'applique. Les deux se recouvrent un instant pour ne jamais couper le couple.`;
      if (this.slip > 0.25) text += ` <b style="color:var(--bad-txt)">Patinage ${Math.round(this.slip * 100)} %</b> : le moteur monte en régime mais la voiture ne suit pas.`;
    }
    return { chips: rows, text };
  }
  ratioFormula(g) {
    const f = (a, b) => `${a}/${b}`;
    switch (g) {
      case 1: return `(${Z.r1}+${Z.s1})/${Z.r1} × ${Z.R}/${Z.s4}`;
      case 2: return `${fr((Z.r1 + Z.s1) / Z.r1, 3)} × ${Z.R}(${Z.s3}+${Z.s4}) / ${Z.s4}(${Z.s3}+${Z.R})`;
      case 3: return `(${Z.r1}+${Z.s1})/${Z.r1} = prise du train réducteur, Ravigneaux verrouillé`;
      case 4: return `moyenne pondérée entre l'entrée (E) et la vitesse réduite (A)`;
      case 5: return `moyenne pondérée entre l'entrée (E) et la vitesse réduite (B)`;
      case 6: return `${f(Z.R, Z.s3 + Z.R)} : porte-satellites à la vitesse d'entrée, S3 fixe`;
      case 'R': return `−${f(Z.R, Z.s3)} × (${Z.r1}+${Z.s1})/${Z.r1}`;
      default: return '';
    }
  }
  tele() {
    const g = this.gear, i = IRATIO[g];
    const els = TABLE[g] || [];
    const press = els.length ? els.map((e) => `${EL_INFO[e].n} ${(this.pLine * this.lv[e]).toFixed(0)}`).join(' · ') : '—';
    return [
      ['Régime moteur', Math.round(this.rpmDisp), 'tr/min'],
      ['Rapport', `${this.sel === 'D' ? (this.mode === 'auto' ? 'D ' : 'D·manuel ') : ''}${gearName(g)}`, ''],
      ['Vitesse', Math.abs(this.v).toFixed(0), 'km/h'],
      ['Convertisseur', this.lu > 0.9 ? 'PONTÉ' : `SR ${fr(this.SR, 2)}`, this.lu > 0.9 ? '' : (this.stator === 'locked' ? 'stator bloqué' : 'stator libre')],
      ['Éléments appliqués (bar)', press, ''],
      ['Couple moteur', Math.round(this.engineTorque()), 'Nm'],
      ['Rapport i', i ? fr(i, 3) : '—', ''],
      ['Régime turbine', Math.round(this.n.turb), 'tr/min'],
      ['Pression de ligne', this.pLine.toFixed(1).replace('.', ','), 'bar'],
      ['Huile', Math.round(this.oilT), '°C'],
      ['Patinage', Math.round(this.slip * 100), '%'],
      ['Couple aux roues', i ? Math.round(this.engineTorque() * this.torqueRatio() * Math.abs(i) * IFD * ETA * (1 - this.slip)) : 0, 'Nm'],
    ];
  }
}
