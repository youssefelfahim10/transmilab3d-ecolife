/* ============================================================================
 * kinematics.js — Moteur physique / cinématique du Module 1 (BVM 5 + AR + pont)
 *  - Rapports calculés EXCLUSIVEMENT à partir des nombres de dents réels.
 *  - Contrôleur de passage de vitesses en 3 phases :
 *      Phase 1 : débrayage (coupure du flux moteur) + désengagement
 *      Phase 2 : fourchette -> contact cône laiton / cône du pignon fou
 *                -> égalisation des vitesses (synchronisation, anneau bloqué)
 *      Phase 3 : franchissement de l'anneau -> crabotage -> embrayage (couple)
 *  - Pannes d'atelier injectables (cône usé, crabots usés, roulement HS).
 *  Convention de signe : n > 0 = sens moteur. En marche avant le secondaire
 *  tourne en sens inverse du primaire (1 engrènement), la couronne dans le
 *  sens moteur (2e engrènement), les roues avancent.
 * ========================================================================== */
import {
  GEAR_PAIRS, REV, FD, DIFF, IB, IR, IP, SYN, SYNC_OF, SPLINE_PITCH, PHASE, AXIS, TAU,
} from './layout.js';

export const WHEEL_R = 0.317;            // rayon sous charge, 195/65 R15 (m)
export const ETA_BVM = 0.96;             // rendement BVM
export const IDLE_RPM = 800;
export const REDLINE_RPM = 6500;
export const VIS_SCALE = 0.012;          // rotation visuelle ralentie (stroboscopie) : 1 tr/min -> 0,012 tr/min affiché

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const approach = (x, target, step) => (x < target ? Math.min(target, x + step) : Math.max(target, x - step));
const wrapPM = (a, period) => { let r = ((a % period) + period) % period; if (r > period / 2) r -= period; return r; };

/* ---- Courbe de couple moteur essence 1.6 (Nm) ---- */
const CURVE = [[800, 85], [1500, 120], [2500, 138], [4000, 150], [5500, 142], [6500, 118]];
export function torqueCurve(rpm) {
  if (rpm <= CURVE[0][0]) return CURVE[0][1];
  for (let i = 1; i < CURVE.length; i++) {
    if (rpm <= CURVE[i][0]) {
      const [x0, y0] = CURVE[i - 1], [x1, y1] = CURVE[i];
      return y0 + ((y1 - y0) * (rpm - x0)) / (x1 - x0);
    }
  }
  return CURVE[CURVE.length - 1][1];
}

/* ---- Rapports ---- */
export function ibOf(g) { return g === 'R' ? IR : g === 'N' ? 0 : IB[g]; }
/** n_secondaire = n_primaire × k(g) */
export function kOf(g) { return g === 'R' ? 1 / IR : -1 / IB[g]; }
export function ratioText(g) {
  if (g === 'N') return { frac: '—', value: '—', num: 0, den: 0 };
  if (g === 'R') return { frac: `${REV.Zring}/${REV.Zr}`, value: IR.toFixed(3).replace('.', ','), num: REV.Zring, den: REV.Zr };
  const { Zp, Zs } = GEAR_PAIRS[g];
  return { frac: `${Zs}/${Zp}`, value: IB[g].toFixed(3).replace('.', ','), num: Zs, den: Zp };
}

/* ---- Temporisations de la séquence de passage (secondes simulées) ---- */
const T = {
  declutch: 0.45, withdraw: 0.35, approach: 0.25, blockMax: 1.3, unlock: 0.2,
  engage: 0.45, clutchIn: 0.6, idler: 0.5, drag: 1.4, crunch: 0.85,
  tau0: 0.12,        // constante de temps de synchro NEUVE à chaud
  eps: 25,           // tr/min : seuil d'égalisation
};

export const PHASE_TEXT = {
  0: 'Repos', 1: 'PHASE 1 · Débrayage — coupure du flux moteur',
  2: 'PHASE 2 · Synchronisation — cône laiton / pignon fou',
  3: 'PHASE 3 · Crabotage du baladeur — embrayage, passage du couple',
};

export class GearboxSim {
  constructor() { this.reset(); }

  reset() {
    this.gear = 'N';
    this.engineRpm = IDLE_RPM;
    this.v = 0;                         // km/h signé
    this.nP = IDLE_RPM;                 // régime arbre primaire
    this.clutchPedal = false;           // true = pédale enfoncée par l'élève
    this.clutch = 1;                    // 1 = embrayé (pédale relâchée)
    this.load = 'accel';                // accel | stab | decel
    this.oilT = 22;
    this.autoWarm = false;
    this.turn = 0;                      // -1..1 (virage : différentiel)
    this.slide = { 12: 0, 34: 0, 5: 0 };            // position du baladeur (unités 10 mm)
    this.idler = 0;                     // 0 neutre .. 1 engagé (baladeur d'AR)
    this.sync = {};
    for (const k of [12, 34, 5]) this.sync[k] = { dir: 0, contact: 0, idx: 0, heat: 0, shake: 0, pressed: false };
    this.shift = null;
    this.phase = 0;
    this.faults = {};
    this.events = [];
    this.jumpT = 0;
    this.pop = null;
    this.delta = 0;                     // écart de régime à synchroniser (tr/min)
    this.ang = { P: 0, S: 0, E: 0, C: 0, L: 0, R: 0, sat: 0, trim: 0 };
    this.trimTarget = 0;
    this.noise = { bearing: 0, grind: 0 };
    this.timeScale = 1;
  }

  /* ----------------------- grandeurs dérivées ----------------------- */
  nWheels() { return (this.v / 3.6 / (TAU * WHEEL_R)) * 60; }
  nSec() { return -this.nWheels() * IP; }
  vFromNp(g, nP) { const nS = nP * kOf(g); const nw = -nS / IP; return nw * TAU * WHEEL_R * 0.06; }
  nGear(k) { return -this.nP * (GEAR_PAIRS[k].Zp / GEAR_PAIRS[k].Zs); }     // vitesse du pignon fou k (menée par le primaire)
  tempFactor() { return clamp(0.45 + (0.55 * (this.oilT - 20)) / 60, 0.45, 1.0); }
  muEff(g) {
    const wc = this.faults.wornCone;
    const health = wc && wc.gear === g ? wc.mu : 1;
    return health * this.tempFactor();
  }
  engineTorque() {
    const c = torqueCurve(this.engineRpm);
    if (this.load === 'accel') return c;
    if (this.load === 'stab') return 0.3 * c;
    return -(18 + 0.0045 * this.engineRpm);          // frein moteur
  }
  /** niveau de flux de couple 0..1 (et signe) pour la coloration SSP */
  flow() {
    const engaged = this.gear !== 'N' && (!this.shift || this.shift.sub === 'clutchIn');
    const level = engaged ? clamp((this.clutch - 0.05) / 0.9, 0, 1) : 0;
    return { level, sign: this.load === 'decel' ? -1 : 1 };
  }
  get telemetry() {
    const g = this.gear;
    const ib = ibOf(g), ratio = ratioText(g);
    const nw = this.nWheels();
    const torque = this.engineTorque();
    const eng = g !== 'N' && this.clutch > 0.9;
    return {
      gear: g, ratio, ib, ip: IP,
      rpm: this.engineRpm, torque,
      nWheels: nw,
      wheelTorque: eng ? torque * ib * IP * ETA_BVM : 0,
      v: this.v, oilT: this.oilT, nP: this.nP, nS: this.nSec(), clutch: this.clutch,
    };
  }

  /** Positionne directement la boîte sur un rapport (mise en situation des cas pratiques) */
  forceGear(g, rpm) {
    this.shift = null; this.pop = null; this.phase = 0; this.clutch = 1; this.jumpT = 0;
    this.slide = { 12: 0, 34: 0, 5: 0 }; this.idler = 0;
    for (const k of [12, 34, 5]) Object.assign(this.sync[k], { dir: 0, contact: 0, idx: 0, heat: 0, shake: 0, pressed: false });
    this.engineRpm = rpm || this.engineRpm;
    this.gear = g;
    if (typeof g === 'number') { this.setSleeve(g, SYN.mFull); this.nP = this.engineRpm; this.v = this.vFromNp(g, this.nP); }
    else if (g === 'R') { this.idler = 1; this.nP = this.engineRpm; this.v = this.vFromNp('R', this.nP); }
    else { this.v = 0; this.nP = this.engineRpm; }
  }

  /* ----------------------- commandes ----------------------- */
  requestGear(to) {
    if (this.shift || to === this.gear || this.pop) return false;
    if (to === 'R' && Math.abs(this.v) > 3) {
      this.events.push({ type: 'refus', msg: 'Marche arrière impossible en roulant : pas de synchroniseur sur l\'AR. Arrêter le véhicule (v < 3 km/h).' });
      return false;
    }
    this.shift = { to, from: this.gear, sub: 'declutch', t: 0 };
    this.phase = 1;
    this.events.push({ type: 'shift-start', from: this.gear, to });
    return true;
  }

  /* ----------------------- pas de simulation ----------------------- */
  update(dt) {
    this.events.length = 0;
    if (this.autoWarm) this.oilT = Math.min(95, this.oilT + (95 - this.oilT) * dt / 60);
    if (this.shift) this.stepShift(dt); else this.stepSteady(dt);
    this.noise.bearing = this.faults.wornPrimBearing ? clamp(Math.abs(this.nP) / 2500, 0, 1) * (this.nP > 120 ? 1 : 0) : 0;
    // alignement angulaire progressif (indexage / mise en phase des dentures)
    const rate = 5.5;
    this.ang.trim += clamp(this.trimTarget - this.ang.trim, -rate * dt, rate * dt);
    this.integrate(dt);
  }

  freeNp(dt) { this.nP += (-this.nP / T.drag) * dt; }

  /** couplage moteur <-> véhicule lorsque l'embrayage se ferme, boîte engagée */
  couple(dt) {
    const g = this.gear;
    const nPg = this.nSec() / kOf(g);
    const nT = clamp(Math.max(nPg, IDLE_RPM), IDLE_RPM, REDLINE_RPM);
    const k = Math.min(1, dt * 9 * this.clutch);
    this.engineRpm += (nT - this.engineRpm) * k;
    const vT = this.vFromNp(g, nT);
    this.v += (vT - this.v) * k;
    this.nP = this.nSec() / kOf(g);
  }

  setSleeve(g, m) {
    const s = SYNC_OF[g];
    this.slide[s.key] = s.dir * m;
  }

  stepSteady(dt) {
    this.clutch = approach(this.clutch, this.clutchPedal ? 0 : 1, dt / 0.25);
    const g = this.gear;
    // ---- panne B : la vitesse saute en décélération ----
    if (this.pop) {
      this.pop.t += dt;
      const m = Math.max(0, SYN.mFull * (1 - this.pop.t / 0.28));
      this.setSleeve(this.pop.g, m);
      if (m <= SYN.mBlock * 0.55) { /* crabots dégagés */ }
      if (m <= 0) {
        this.pop = null; this.gear = 'N'; this.jumpT = 0;
        this.setSleeve(g, 0);
        this.events.push({ type: 'jump' });
        return;
      }
    }
    if (g === 'N') {
      this.v = Math.sign(this.v) * Math.max(0, Math.abs(this.v) - 2.2 * dt);        // roue libre
      if (this.clutch > 0.98) this.nP += (this.engineRpm - this.nP) * Math.min(1, dt * 12);
      else this.nP += ((this.clutch * 9 * (this.engineRpm - this.nP)) - this.nP / T.drag) * dt;
      this.nP = clamp(this.nP, 0, REDLINE_RPM);
      return;
    }
    if (this.pop) {                                    // la boîte se désengage : le primaire n'est plus lié
      this.nP += (this.engineRpm - this.nP) * Math.min(1, dt * 9);
      return;
    }
    if (this.clutch > 0.985) {                         // couplé : le moteur impose sa vitesse
      this.nP = this.engineRpm;
      this.v = this.vFromNp(g, this.nP);
    } else if (this.clutch > 0.4) {
      this.couple(dt);
    } else {                                           // débrayé en prise : le véhicule entraîne le primaire
      this.v = Math.sign(this.v) * Math.max(0, Math.abs(this.v) - 0.6 * dt);
      this.nP = this.nSec() / kOf(g);
    }
    // jeu axial + usure en dépouille : saut de vitesse en décélération
    if (typeof g === 'number' && this.faults.wornDog === g && this.load === 'decel' && this.clutch > 0.95) {
      this.jumpT += dt;
      const osc = 0.5 + 0.5 * Math.sin(this.jumpT * 38);
      const m = SYN.mFull - 0.05 - 0.085 * Math.min(1, this.jumpT / 1.0) * osc;
      this.setSleeve(g, m);
      if (this.jumpT > 1.25) this.pop = { g, t: 0 };
    } else if (typeof g === 'number') {
      this.jumpT = Math.max(0, this.jumpT - dt * 2);
      this.setSleeve(g, SYN.mFull);
    }
  }

  /* ----------------------- séquence de passage ----------------------- */
  stepShift(dt) {
    const sh = this.shift, to = sh.to, from = sh.from;
    sh.t += dt;
    const S = typeof to === 'number' ? SYNC_OF[to] : null;
    switch (sh.sub) {
      case 'declutch': {
        this.phase = 1;
        this.clutch = Math.max(0, this.clutch - dt / T.declutch);
        if (from !== 'N') this.nP = this.nSec() / kOf(from); else this.freeNpDeclutch(dt);
        this.v = Math.sign(this.v) * Math.max(0, Math.abs(this.v) - 0.5 * dt);
        if (this.clutch <= 0.001) { this.clutch = 0; sh.sub = 'withdraw'; sh.t = 0; sh.free = false; }
        break;
      }
      case 'withdraw': {
        this.phase = 1;
        let done = true;
        if (typeof from === 'number') {
          const s = SYNC_OF[from];
          const m = Math.max(0, Math.abs(this.slide[s.key]) - dt * SYN.mFull / T.withdraw);
          this.setSleeve(from, m);
          if (m < SYN.mFull * 0.45) sh.free = true;
          done = m <= 0;
        } else if (from === 'R') {
          this.idler = Math.max(0, this.idler - dt / T.idler);
          if (this.idler < 0.6) sh.free = true;
          done = this.idler <= 0;
        }
        if (sh.free || from === 'N') this.freeNp(dt); else this.nP = this.nSec() / kOf(from);
        this.v = Math.sign(this.v) * Math.max(0, Math.abs(this.v) - 0.5 * dt);
        if (done) {
          this.gear = 'N';
          if (to === 'N') { sh.sub = 'clutchIn'; sh.t = 0; this.phase = 3; }
          else if (to === 'R') { sh.sub = 'waitStop'; sh.t = 0; this.phase = 2; }
          else { sh.sub = 'approach'; sh.t = 0; this.phase = 2; this.sync[S.key].dir = S.dir; }
        }
        break;
      }
      /* ---- Phase 2 : approche, contact du cône, friction, blocage ---- */
      case 'approach': {
        this.phase = 2;
        const sy = this.sync[S.key];
        const m = Math.min(SYN.mContact, Math.abs(this.slide[S.key]) + dt * SYN.mContact / T.approach);
        this.setSleeve(to, m);
        sy.contact = m; sy.pressed = false; sy.idx = 0;
        this.freeNp(dt);
        if (m >= SYN.mContact) {
          sh.nStar = this.nSec() / kOf(to);
          sh.d0 = this.nP - sh.nStar;
          sh.tf = 0; sh.sub = 'friction'; sh.t = 0; sy.pressed = true;
          sh.mu = this.muEff(to);
          this.events.push({ type: 'contact', gear: to });
        }
        break;
      }
      case 'friction': {
        this.phase = 2;
        const sy = this.sync[S.key];
        sh.tf += dt;
        const tau = T.tau0 / Math.max(0.03, sh.mu);
        this.nP = sh.nStar + sh.d0 * Math.exp(-sh.tf / tau);
        this.delta = this.nP - sh.nStar;
        const m = approach(Math.abs(this.slide[S.key]), SYN.mBlock, dt * 0.1 / 0.3);
        this.setSleeve(to, m);
        sy.idx = Math.sign(this.delta || 1) * SYN.lash;          // anneau indexé (bloqué)
        sy.heat = clamp(Math.abs(this.delta) / 1500, 0, 1);
        if (Math.abs(this.delta) < T.eps) { this.nP = sh.nStar; this.delta = 0; sh.sub = 'unlock'; sh.t = 0; sh.forced = false; sy.heat = 0; }
        else if (sh.tf > T.blockMax) { sh.sub = 'crunch'; sh.t = 0; sh.dc = this.delta; this.events.push({ type: 'crunch', gear: to }); }
        break;
      }
      case 'crunch': {            // passage en force : craquement (grincement des crabots)
        this.phase = 2;
        const sy = this.sync[S.key];
        const u = clamp(sh.t / 0.5, 0, 1);
        this.nP = sh.nStar + sh.dc * (1 - u);
        this.delta = this.nP - sh.nStar;
        sy.shake = 1; sy.heat = 1;
        this.noise.grind = 1;
        this.setSleeve(to, SYN.mBlock + 0.05 * Math.sin(sh.t * 60) * (1 - u));
        if (sh.t >= T.crunch) { sy.shake = 0; this.noise.grind = 0; sh.sub = 'unlock'; sh.t = 0; sh.forced = true; sy.heat = 0; }
        break;
      }
      case 'unlock': {
        this.phase = 2;
        const sy = this.sync[S.key];
        if (!sh.trimSet) {        // mise en phase des crabots (indexage) : calcul unique
          sh.trimSet = true;
          this.trimTarget = this.ang.trim + this.forwardTrim(to);
        }
        sy.idx = approach(sy.idx, 0, dt * SYN.lash / T.unlock * 1.2);
        this.nP = sh.nStar;
        if (sh.t >= T.unlock) { sh.sub = 'engage'; sh.t = 0; sy.idx = 0; sy.pressed = false; this.phase = 3; }
        break;
      }
      case 'engage': {            // Phase 3a : franchissement de l'anneau, crabotage du baladeur
        this.phase = 3;
        const sy = this.sync[S.key];
        const m = Math.min(SYN.mFull, Math.abs(this.slide[S.key]) + dt * (SYN.mFull - SYN.mBlock) / T.engage);
        this.setSleeve(to, m);
        sy.contact = Math.max(0, sy.contact - dt * 0.5);
        this.nP = this.nSec() / kOf(to);
        if (m >= SYN.mFull) { sy.contact = 0; this.gear = to; sh.sub = 'clutchIn'; sh.t = 0; }
        break;
      }
      /* ---- Marche arrière : pas de synchro, attendre l'arrêt des pignons ---- */
      case 'waitStop': {
        this.phase = 2;
        this.freeNp(dt);
        this.v = Math.sign(this.v) * Math.max(0, Math.abs(this.v) - 1.5 * dt);
        if ((Math.abs(this.nP) < 90 && Math.abs(this.v) < 0.8) || sh.t > 3.5) {
          this.nP = 0; sh.sub = 'idlerIn'; sh.t = 0; this.trimTarget = this.ang.trim + this.reverseTrim();
        }
        break;
      }
      case 'idlerIn': {
        this.phase = 3;
        this.idler = Math.min(1, this.idler + dt / T.idler);
        this.nP = 0;
        if (this.idler >= 1) { this.gear = 'R'; sh.sub = 'clutchIn'; sh.t = 0; }
        break;
      }
      case 'clutchIn': {          // Phase 3b : embrayage, le couple passe
        this.phase = 3;
        this.clutch = Math.min(1, this.clutch + dt / T.clutchIn);
        if (this.gear === 'N') {
          this.nP += ((this.clutch * 9 * (this.engineRpm - this.nP)) - this.nP / T.drag) * dt;
          this.v = Math.sign(this.v) * Math.max(0, Math.abs(this.v) - 2.2 * dt);
        } else this.couple(dt);
        if (this.clutch >= 0.995) {
          this.clutch = 1; this.shift = null; this.phase = 0;
          this.events.push({ type: 'engaged', gear: this.gear });
        }
        break;
      }
    }
  }

  freeNpDeclutch(dt) { this.nP += ((this.clutch * 9 * (this.engineRpm - this.nP)) - this.nP / T.drag) * dt; }

  /* ----------------------- mise en phase des dentures ----------------------- */
  forwardTrim(k) {
    const { Zp, Zs } = GEAR_PAIRS[k];
    const phiG = PHASE.sec[k] - (Zp / Zs) * (this.ang.P + this.ang.trim);
    const phiS = PHASE.pin + this.ang.S;
    const rel = wrapPM(phiG - phiS, SPLINE_PITCH);
    return rel * (Zs / Zp);
  }
  reverseTrim() {
    const phiI = PHASE.idler - (REV.Zr / REV.Zi) * (this.ang.P + this.ang.trim);
    const phiRing = PHASE.ring + this.ang.S;
    const E = REV.Zring * (phiRing - PHASE.alphaIS - Math.PI) + REV.Zi * (phiI - PHASE.alphaIS) - Math.PI;
    return wrapPM(E / REV.Zr, TAU / REV.Zr);
  }

  /* ----------------------- intégration des angles (visuels) ----------------------- */
  integrate(dt) {
    const k = VIS_SCALE * (this.visMul || 1) * (TAU / 60) * dt;
    const a = this.ang;
    const nw = this.nWheels();
    a.P += this.nP * k;
    a.S += this.nSec() * k;
    a.E += this.engineRpm * k;
    a.C += nw * k;
    const nL = nw * (1 + 0.25 * this.turn), nR = nw * (1 - 0.25 * this.turn);
    a.L += nL * k; a.R += nR * k;
    a.sat += ((nL - nR) / 2) * (DIFF.Zplan / DIFF.Zsat) * k;
  }

  /* états annexes pour l'UI / les pannes */
  syncInfo() {
    const s = this.shift;
    if (!s || typeof s.to !== 'number') return null;
    return { gear: s.to, sub: s.sub, delta: this.delta, mu: s.mu, tf: s.tf || 0, tMax: T.blockMax, forced: s.forced };
  }
}
