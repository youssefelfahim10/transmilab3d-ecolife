/* ============================================================================
 * layout.js — Implantation géométrique du Module 1 (BVM 5 rapports + AR + pont)
 * Source UNIQUE de vérité partagée par kinematics.js (physique) et le builder 3D.
 * Unité 3D : 1 unité = 10 mm.  Axe X = axe des arbres (X<0 : côté embrayage).
 * Repère angulaire : un point d'un pignon est à (y, z) = (r·cos ω, r·sin ω) ;
 * une rotation autour de +X augmente ω.
 * ========================================================================== */

export const TAU = Math.PI * 2;

/* ---- Nombres de dents réels (rapport i = Z_mené / Z_menant) ---- */
export const GEAR_PAIRS = {
  1: { Zp: 11, Zs: 41 },   // 3,727
  2: { Zp: 19, Zs: 39 },   // 2,053
  3: { Zp: 28, Zs: 37 },   // 1,321
  4: { Zp: 37, Zs: 36 },   // 0,973
  5: { Zp: 40, Zs: 31 },   // 0,775
};
export const REV = { Zr: 12, Zi: 18, Zring: 44 };     // AR : pignon primaire / baladeur / couronne du baladeur 1-2
export const FD = { Zpin: 15, Zcrown: 62 };           // couple conique (hélicoïdal) du pont : 4,133
export const DIFF = { Zplan: 14, Zsat: 10 };         // planétaires / satellites (coniques)
export const SPLINE_Z = 24;                           // cannelures moyeu / baladeur / crabots
export const SPLINE_PITCH = TAU / SPLINE_Z;

/* ---- Entraxes (1 unité = 10 mm) ---- */
export const A = 7.0;                                 // primaire <-> secondaire : 70 mm
export const AXIS = { P: { y: 3.5, z: 0 }, S: { y: -3.5, z: 0 } };

/* Arbre de renvoi (AR) : position résolue par intersection de cercles (engrènement double) */
const rR = REV.Zr * 0.1, rI = REV.Zi * 0.1, rRing = REV.Zring * 0.1;   // module 2 mm
{
  const dIP = rR + rI, dIS = rRing + rI;
  const t = (A * A + dIP * dIP - dIS * dIS) / (2 * A);
  const h = Math.sqrt(dIP * dIP - t * t);
  AXIS.I = { y: AXIS.P.y - t, z: -h };                // côté arrière (z<0)
}
/* Différentiel : au 1/8 avant-bas, à l'entraxe pignon/couronne */
export const FD_MODULE = 0.25;                         // 2,5 mm
export const R_PIN = FD.Zpin * FD_MODULE / 2;
export const R_CROWN = FD.Zcrown * FD_MODULE / 2;
export const FD_CENTER_DIST = R_PIN + R_CROWN;
export const FD_ANGLE = (125 * Math.PI) / 180;
AXIS.D = {
  y: AXIS.S.y + FD_CENTER_DIST * Math.cos(FD_ANGLE),
  z: AXIS.S.z + FD_CENTER_DIST * Math.sin(FD_ANGLE),
};

/* ---- Pitch radii de chaque paire (module variable : entraxe constant) ---- */
export const PAIR = {};
for (const k of [1, 2, 3, 4, 5]) {
  const { Zp, Zs } = GEAR_PAIRS[k];
  const sum = Zp + Zs;
  PAIR[k] = { rp: (A * Zp) / sum, rs: (A * Zs) / sum, m: (2 * A) / sum };
}

/* ---- Implantation axiale (centres de pignons, largeurs) ---- */
export const X = {
  pin: 0.9, pinW: 2.0,                                // pignon d'attaque intégré au secondaire
  g: { 1: 4.95, 2: 11.15, 3: 13.05, 4: 19.25, 5: 21.15 }, gW: 1.7,
  hub: { 12: 8.05, 34: 16.15, 5: 24.25 },             // centres des moyeux de synchroniseur
  hubW: 1.5, sleeveW: 2.1,
  rpin: 8.05, rpinSpan: [6.45, 10.25],                 // pignon AR du primaire (large, taille droite)
  idlerW: 1.0, idlerEngaged: 8.05, idlerNeutral: 9.75,
  wall: [2.9, 3.7], bearingFront: 3.3, bearingRear: 26.8,
  primStart: -8.6, shaftEnd: 27.9, secStart: -0.3,
  caseEnd: 27.6, coverEnd: 28.6,
  diff: { O: 0.1, bearL: -3.0, bearR: 3.2 },
};
/* côté du moyeu par rapport au pignon (+1 : le synchro est à droite du pignon) et moyeu associé */
export const SYNC_OF = {
  1: { key: 12, dir: -1, side: +1 },   // glisser vers la gauche (-X) engage la 1ère
  2: { key: 12, dir: +1, side: -1 },
  3: { key: 34, dir: -1, side: +1 },
  4: { key: 34, dir: +1, side: -1 },
  5: { key: 5, dir: -1, side: +1 },
};
export const SYNC_KEYS = [12, 34, 5];

/* ---- Cotes de synchroniseur (mm/10) ---- */
export const SYN = {
  shaftR: 1.6, boreGear: 1.88,           // rayon arbre secondaire / alésage pignon fou (cage à aiguilles 2,8 mm)
  splRoot: 2.6, splTip: 2.92,            // cannelures moyeu / crabots / baladeur
  sleeveOuter: 3.45, sleeveGroove: 3.15, // baladeur
  ringOuter: 2.62,
  dogLen: 0.55, coneLen: 0.6,            // couronne de crabotage + cône mâle du pignon
  mContact: 0.16, mBlock: 0.26, mFull: 0.62,   // courses (contact cône / blocage / crabotage complet)
  lash: (4.5 * Math.PI) / 180,           // indexage : débattement angulaire de l'anneau
  keyAngles: [0, 120, 240].map((a) => (a * Math.PI) / 180),
  keyTeeth: [0, 8, 16],                  // dents supprimées (logement des clavettes)
};

/* ---- Rotation : déphasages d'engrènement ---- */
const wrap = (a) => ((a % TAU) + TAU) % TAU;
export function dirAngle(a, b) { return Math.atan2(b.z - a.z, b.y - a.y); }
/** Phase de B pour engrener A (phase φA) ; α = angle du centre A vers le centre B */
export function meshPhase(phiA, ZA, ZB, alpha) {
  return wrap(alpha + Math.PI + (Math.PI - ZA * (phiA - alpha)) / ZB);
}
export const PHASE = {};
PHASE.alphaPS = dirAngle(AXIS.P, AXIS.S);
PHASE.prim = Math.PI;                                  // phase de base de tous les pignons du primaire
PHASE.sec = {};
for (const k of [1, 2, 3, 4, 5]) PHASE.sec[k] = meshPhase(PHASE.prim, GEAR_PAIRS[k].Zp, GEAR_PAIRS[k].Zs, PHASE.alphaPS);
PHASE.alphaPI = dirAngle(AXIS.P, AXIS.I);
PHASE.alphaIS = dirAngle(AXIS.I, AXIS.S);
PHASE.idler = meshPhase(PHASE.prim, REV.Zr, REV.Zi, PHASE.alphaPI);
PHASE.ring = meshPhase(PHASE.idler, REV.Zi, REV.Zring, PHASE.alphaIS);   // dents de la couronne AR du baladeur 1/2
PHASE.pin = 0;                                         // phase de base du secondaire / pignon d'attaque
PHASE.alphaSD = dirAngle(AXIS.S, AXIS.D);
PHASE.crown = meshPhase(PHASE.pin, FD.Zpin, FD.Zcrown, PHASE.alphaSD);

/* ---- Rapports ---- */
export const IB = { 1: 41 / 11, 2: 39 / 19, 3: 37 / 28, 4: 36 / 37, 5: 31 / 40 };
export const IR = REV.Zring / REV.Zr;
export const IP = FD.Zcrown / FD.Zpin;
