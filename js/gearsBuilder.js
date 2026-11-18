/* ============================================================================
 * gearsBuilder.js — Génération procédurale de la géométrie mécanique
 *  - Engrenages à développante de cercle (droits ou hélicoïdaux : torsion = angle d'hélice)
 *  - Cannelures / crabots chanfreinés (moyeu, baladeur, couronne de crabotage, dents d'arrêt)
 *  - Solides de révolution fermés (arbres, cônes, bagues, carters) -> bouchage de coupe fiable
 *  - Roulements : billes / aiguilles / rouleaux via InstancedMesh
 *  - Pignons coniques (différentiel) avec dentures instanciées
 *  Axe de toutes les pièces = X. Les solides sont toujours des maillages FERMÉS
 *  (condition du bouchage par stencil des plans de coupe).
 * ========================================================================== */
import * as THREE from 'three';

const TAU = Math.PI * 2;

/* ---------------------------------------------------------------------------
 * Tampon de triangles avec normales explicites (orientation auto selon la normale)
 * ------------------------------------------------------------------------- */
class TriBuf {
  constructor() { this.p = []; this.n = []; }
  tri(a, b, c, na, nb, nc) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * cx + cy * cy + cz * cz < 1e-14) return;
    const d = cx * (na[0] + nb[0] + nc[0]) + cy * (na[1] + nb[1] + nc[1]) + cz * (na[2] + nb[2] + nc[2]);
    if (d < 0) { const t = b; b = c; c = t; const tn = nb; nb = nc; nc = tn; }
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.n.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
  }
  quad(a, b, c, d, na, nb, nc, nd) { this.tri(a, b, c, na, nb, nc); this.tri(a, c, d, na, nc, nd); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

/* ---------------------------------------------------------------------------
 * Solide de révolution autour de X. profile = [[x, r], ...] polygone fermé.
 * ------------------------------------------------------------------------- */
export function latheX(profile, seg = 40) {
  let P = [];
  for (const p of profile) {
    const l = P[P.length - 1];
    if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 1e-6) P.push([p[0], p[1]]);
  }
  if (P.length > 2 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 1e-6) P.pop();
  let area = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1]; }
  if (area < 0) P.reverse();
  const n = P.length, E = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const dx = b[0] - a[0], dr = b[1] - a[1], L = Math.hypot(dx, dr) || 1;
    E.push([dr / L, -dx / L]);
  }
  const sm = (j) => {
    const e0 = E[(j - 1 + n) % n], e1 = E[j % n];
    if (e0[0] * e1[0] + e0[1] * e1[1] > 0.82) {
      const x = e0[0] + e1[0], r = e0[1] + e1[1], L = Math.hypot(x, r) || 1;
      return [x / L, r / L];
    }
    return null;
  };
  const tb = new TriBuf();
  const cs = [], sn = [];
  for (let j = 0; j <= seg; j++) { cs.push(Math.cos((j / seg) * TAU)); sn.push(Math.sin((j / seg) * TAU)); }
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const n0 = sm(i) || E[i], n1 = sm((i + 1) % n) || E[i];
    for (let j = 0; j < seg; j++) {
      const c0 = cs[j], s0 = sn[j], c1 = cs[j + 1], s1 = sn[j + 1];
      tb.quad(
        [a[0], a[1] * c0, a[1] * s0], [a[0], a[1] * c1, a[1] * s1], [b[0], b[1] * c1, b[1] * s1], [b[0], b[1] * c0, b[1] * s0],
        [n0[0], n0[1] * c0, n0[1] * s0], [n0[0], n0[1] * c1, n0[1] * s1], [n1[0], n1[1] * c1, n1[1] * s1], [n1[0], n1[1] * c0, n1[1] * s0],
      );
    }
  }
  return tb.geo();
}

/** Cylindre plein / tube le long de X */
export const cylX = (r, x0, x1, seg = 32) => latheX([[x0, 0], [x1, 0], [x1, r], [x0, r]], seg);
export const tubeX = (rIn, rOut, x0, x1, seg = 40) => latheX([[x0, rIn], [x1, rIn], [x1, rOut], [x0, rOut]], seg);
/** Anneau à chanfreins (bague, cale) */
export function washerX(rIn, rOut, x0, x1, c = 0.04, seg = 40) {
  return latheX([[x0 + c, rIn], [x1 - c, rIn], [x1, rIn + c], [x1, rOut - c], [x1 - c, rOut], [x0 + c, rOut], [x0, rOut - c], [x0, rIn + c]], seg);
}

/* ---------------------------------------------------------------------------
 * Anneau denté générique (dents extérieures OU intérieures), tranches axiales
 * pts    : [{t, r}] contour polaire croissant en t (fermé)
 * slices : [{x, rot, h}]  h = facteur de hauteur de dent (chanfrein), rot = torsion
 * ------------------------------------------------------------------------- */
export function toothedRing({ pts, plainR, baseR, slices }) {
  const K = pts.length, tb = new TriBuf();
  const outer = pts.reduce((s, p) => s + p.r, 0) / K > plainR;
  const sgn = outer ? 1 : -1;
  const rows = slices.map((s) => {
    const top = [], plain = [];
    for (let i = 0; i < K; i++) {
      const r = baseR + (pts[i].r - baseR) * (s.h === undefined ? 1 : s.h);
      const a = pts[i].t + s.rot;
      top.push([s.x, r * Math.cos(a), r * Math.sin(a)]);
      plain.push([s.x, plainR * Math.cos(a), plainR * Math.sin(a)]);
    }
    const seg = [];
    for (let i = 0; i < K; i++) {
      const A = top[i], B = top[(i + 1) % K];
      const ty = B[1] - A[1], tz = B[2] - A[2], L = Math.hypot(ty, tz) || 1;
      seg.push([(tz / L) * sgn, (-ty / L) * sgn]);
    }
    const vn = [];
    for (let i = 0; i < K; i++) {
      const e0 = seg[(i - 1 + K) % K], e1 = seg[i];
      if (e0[0] * e1[0] + e0[1] * e1[1] > 0.8) {
        const y = e0[0] + e1[0], z = e0[1] + e1[1], L = Math.hypot(y, z) || 1;
        vn.push([y / L, z / L]);
      } else vn.push(null);
    }
    return { top, plain, seg, vn };
  });
  const N3 = (v) => [0, v[0], v[1]];
  const pn = (P) => { const l = Math.hypot(P[1], P[2]) || 1; return [0, (-sgn * P[1]) / l, (-sgn * P[2]) / l]; };
  for (let s = 0; s < rows.length - 1; s++) {
    const R0 = rows[s], R1 = rows[s + 1];
    for (let i = 0; i < K; i++) {
      const i2 = (i + 1) % K;
      const n0 = N3(R0.vn[i] || R0.seg[i]), n1 = N3(R0.vn[i2] || R0.seg[i]);
      tb.quad(R0.top[i], R0.top[i2], R1.top[i2], R1.top[i], n0, n1, n1, n0);
      tb.quad(R0.plain[i], R0.plain[i2], R1.plain[i2], R1.plain[i],
        pn(R0.plain[i]), pn(R0.plain[i2]), pn(R1.plain[i2]), pn(R1.plain[i]));
    }
  }
  [0, rows.length - 1].forEach((s, idx) => {
    const R = rows[s], nx = idx === 0 ? [-1, 0, 0] : [1, 0, 0];
    for (let i = 0; i < K; i++) {
      const i2 = (i + 1) % K;
      tb.quad(R.top[i], R.top[i2], R.plain[i2], R.plain[i], nx, nx, nx, nx);
    }
  });
  return tb.geo();
}

/* ---------------------------------------------------------------------------
 * Engrenage à développante de cercle (axe X, centré sur x = 0)
 *  helixDeg : angle d'hélice (20–30° pour les pignons de boîte), hand = ±1
 * ------------------------------------------------------------------------- */
export function mergeGeos(list) {
  let n = 0;
  for (const g of list) n += g.attributes.position.array.length;
  const p = new Float32Array(n), nr = new Float32Array(n);
  let o = 0;
  for (const g of list) { p.set(g.attributes.position.array, o); nr.set(g.attributes.normal.array, o); o += g.attributes.position.array.length; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(p, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}

export function involuteGear({ Z, pitchR, width, boreR, helixDeg = 0, hand = 1, phase = 0, layers = 6, pressureDeg = 20, web = true }) {
  const m = (2 * pitchR) / Z, ha = m, hf = 1.25 * m;
  const rf = pitchR - hf, ra = pitchR + ha;
  const al = (pressureDeg * Math.PI) / 180, rb = pitchR * Math.cos(al);
  const inv = (a) => Math.tan(a) - a;
  const half = (r) => {
    const rr = Math.max(r, rb);
    return Math.PI / (2 * Z) + inv(al) - inv(Math.acos(Math.min(1, rb / rr)));
  };
  const p = TAU / Z, n = 5, pts = [];
  for (let k = 0; k < Z; k++) {
    const c = phase + k * p;
    for (let j = 0; j <= n; j++) { const r = rf + ((ra - rf) * j) / n; pts.push({ t: c - half(r), r }); }
    pts.push({ t: c, r: ra });
    for (let j = n; j >= 0; j--) { const r = rf + ((ra - rf) * j) / n; pts.push({ t: c + half(r), r }); }
    const hr = half(rf), gap = p - 2 * hr;
    pts.push({ t: c + hr + gap / 3, r: rf }, { t: c + hr + (2 * gap) / 3, r: rf });
  }
  const spur = helixDeg === 0;
  const L = spur ? 1 : layers;
  const twist = spur ? 0 : (width * Math.tan((helixDeg * Math.PI) / 180)) / pitchR;
  const slices = [];
  for (let i = 0; i <= L; i++) {
    const u = i / L - 0.5;
    slices.push({ x: u * width, rot: hand * twist * u, h: 1 });
  }
  // Voile : jante sous la denture + voile mince + moyeu (comme un vrai pignon forgé) quand la place le permet
  const rimIn = rf - Math.max(0.4, 0.14 * pitchR), hubR = boreR + 0.5;
  let geo;
  if (web && rimIn - hubR > 0.5 && width > 0.6) {
    const t = Math.min(0.5, width * 0.35), w = width / 2;
    const rim = toothedRing({ pts, plainR: rimIn, baseR: rf, slices });
    const hub = latheX([[-w, boreR], [w, boreR], [w, hubR], [t / 2, hubR], [t / 2, rimIn + 0.05], [-t / 2, rimIn + 0.05], [-t / 2, hubR], [-w, hubR]], 48);
    geo = mergeGeos([rim, hub]);
  } else geo = toothedRing({ pts, plainR: boreR, baseR: rf, slices });
  geo.userData = { rf, ra, rb, m };
  return geo;
}

/* ---------------------------------------------------------------------------
 * Cannelure / crabots chanfreinés (moyeu, baladeur à denture intérieure, dents d'arrêt)
 *  rBase  : rayon du fond de denture ; rTip : sommet (rTip<rBase => denture INTÉRIEURE)
 *  chamfer: 'none' | 'both' | '-' | '+'   (chanfrein d'entrée de crabot)
 * ------------------------------------------------------------------------- */
export function splineRing({
  Z = 24, rBase, rTip, width, plainR, phase = 0, chamfer = 'none', cLen = 0.16, cScale = 0.35,
  skip = [], hTip = 0.2, hBase = 0.27,
}) {
  const p = TAU / Z, pts = [];
  for (let k = 0; k < Z; k++) {
    const c = phase + k * p;
    if (skip.includes(k)) { pts.push({ t: c, r: rBase }); continue; }
    pts.push({ t: c - hBase * p, r: rBase }, { t: c - hTip * p, r: rTip }, { t: c + hTip * p, r: rTip }, { t: c + hBase * p, r: rBase });
    pts.push({ t: c + p / 2, r: rBase });
  }
  const w = width / 2, cl = Math.min(cLen, width * 0.4);
  const lo = chamfer === 'both' || chamfer === '-', hi = chamfer === 'both' || chamfer === '+';
  const slices = [{ x: -w, rot: 0, h: lo ? cScale : 1 }];
  if (lo) slices.push({ x: -w + cl, rot: 0, h: 1 });
  if (hi) slices.push({ x: w - cl, rot: 0, h: 1 });
  slices.push({ x: w, rot: 0, h: hi ? cScale : 1 });
  return toothedRing({ pts, plainR, baseR: rBase, slices });
}

/* ---------------------------------------------------------------------------
 * Enveloppes de carter : coque creuse (extrusion de l'enveloppe convexe de cercles)
 * ------------------------------------------------------------------------- */
function hull2D(points) {
  const P = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop();
  return lo.concat(up);
}
function circleHull(circles, seg = 48) {
  const pts = [];
  for (const c of circles) for (let i = 0; i < seg; i++) { const a = (i / seg) * TAU; pts.push([c.y + c.r * Math.cos(a), c.z + c.r * Math.sin(a)]); }
  return hull2D(pts);
}
const BASIS_YZX = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
function extrudeX(shape, x0, x1) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false, curveSegments: 12, steps: 1 });
  g.applyMatrix4(BASIS_YZX);
  g.translate(x0, 0, 0);
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}
/** Carter : tube creux (enveloppe convexe de cercles, épaisseur wall) entre x0 et x1 */
export function hullTube({ circles, wall, x0, x1 }) {
  const outer = circleHull(circles);
  const inner = circleHull(circles.map((c) => ({ ...c, r: c.r - wall })));
  const shape = new THREE.Shape(outer.map((p) => new THREE.Vector2(p[0], p[1])));
  shape.holes.push(new THREE.Path(inner.map((p) => new THREE.Vector2(p[0], p[1]))));
  return extrudeX(shape, x0, x1);
}
/** Plaque (cloison / couvercle) avec alésages */
export function hullPlate({ circles, x0, x1, holes = [] }) {
  const outer = circleHull(circles);
  const shape = new THREE.Shape(outer.map((p) => new THREE.Vector2(p[0], p[1])));
  for (const h of holes) {
    const path = new THREE.Path();
    path.absarc(h.y, h.z, h.r, 0, TAU, true);
    shape.holes.push(path);
  }
  return extrudeX(shape, x0, x1);
}

/* ---------------------------------------------------------------------------
 * Roulement : bagues (révolution fermée) + éléments roulants instanciés
 * ------------------------------------------------------------------------- */
export function bearingGeo({ rIn, rOut, width, type = 'ball', n = 14, tIn = 0.22, tOut = 0.25, seg = 40, races = true }) {
  const w = width / 2, c = 0.05;
  if (!races) { tIn = 0; tOut = 0; }
  const innerP = [[-w + c, rIn], [w - c, rIn], [w, rIn + c], [w, rIn + tIn], [-w, rIn + tIn], [-w, rIn + c]];
  const outerP = [[-w, rOut - tOut], [w, rOut - tOut], [w, rOut - c], [w - c, rOut], [-w + c, rOut], [-w, rOut - c]];
  const r0 = rIn + tIn, r1 = rOut - tOut, rp = (r0 + r1) / 2, re = ((r1 - r0) / 2) * 0.96;
  let elemGeo;
  if (type === 'ball') elemGeo = new THREE.SphereGeometry(re, 14, 10);
  else {
    elemGeo = new THREE.CylinderGeometry(re, re, width * (type === 'needle' ? 0.9 : 0.78), 10, 1);
    elemGeo.rotateZ(Math.PI / 2);
  }
  const matrices = [], m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    m4.makeTranslation(0, rp * Math.cos(a), rp * Math.sin(a));
    matrices.push(m4.clone());
  }
  return {
    inner: races ? latheX(innerP, seg) : null, outer: races ? latheX(outerP, seg) : null, elemGeo, matrices, rp, re, r0, r1,
    ghost: tubeX(r0, r1, -w * 0.9, w * 0.9, seg),          // volume « fantôme » : bouchage de la cage
  };
}

/* ---- Circlip (anneau d'arrêt) / ressort annulaire : tore ouvert d'axe X ---- */
export function circlipGeo(R, tube = 0.09, arcFrac = 0.93) {
  const g = new THREE.TorusGeometry(R, tube, 8, 40, TAU * arcFrac);
  g.rotateY(Math.PI / 2);
  return g;
}
/* ---- Joint spi (lèvre) : profil en L en élastomère ---- */
export function sealGeo(rIn, rOut, width = 0.45) {
  const w = width / 2;
  return latheX([[-w, rIn + 0.06], [-w * 0.2, rIn], [w, rIn + 0.04], [w, rOut], [-w, rOut]], 40);
}

/* ---------------------------------------------------------------------------
 * Fourchette : arc en C autour de la gorge du baladeur (forme symétrique, bras vers +Y local)
 * ------------------------------------------------------------------------- */
export function forkParts({ Ri, Ro, thick, spanDeg = 215, armR, armW = 0.7 }) {
  const sh = new THREE.Shape();
  const a0 = (-spanDeg / 2) * Math.PI / 180, a1 = (spanDeg / 2) * Math.PI / 180, N = 28;
  for (let i = 0; i <= N; i++) { const a = a0 + ((a1 - a0) * i) / N; const x = Ro * Math.sin(a), y = Ro * Math.cos(a); i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / N; sh.lineTo(Ri * Math.sin(a), Ri * Math.cos(a)); }
  const ring = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 4 });
  ring.translate(0, 0, -thick / 2);
  ring.rotateY(Math.PI / 2);                              // épaisseur le long de X
  const armLen = armR - Ro + 0.25;
  const arm = new THREE.BoxGeometry(thick * 1.1, armLen, armW);
  arm.translate(0, Ro - 0.25 + armLen / 2, 0);
  const boss = new THREE.CylinderGeometry(0.5, 0.5, 1.3, 20);
  boss.rotateZ(Math.PI / 2);
  boss.translate(0, armR, 0);
  return { ring, arm, boss };
}

/* ---------------------------------------------------------------------------
 * Pignon conique (différentiel) : corps de révolution + dents instanciées
 *  Le sommet du cône est à l'origine, l'axe = +X.
 * ------------------------------------------------------------------------- */
export function bevelGear({ Z, pitchR, deltaDeg, face = 0.55, bore = 0.3, hubR = 0.9, hubLen = 0.45, toothH = 0.3 }) {
  const d = (deltaDeg * Math.PI) / 180, sd = Math.sin(d), cd = Math.cos(d);
  const L = pitchR / sd;
  const Lf = L - face * 0.7, Lb = L + face * 0.3;
  const af = Lf * cd, rf = Lf * sd, ab = Lb * cd, rb = Lb * sd;
  const body = latheX([[af, bore], [af, rf], [ab, rb], [ab, hubR], [ab + hubLen, hubR], [ab + hubLen, bore]], 36);
  const tooth = new THREE.BoxGeometry(face, toothH, (TAU * pitchR / Z) * 0.45);
  const matrices = [], Lm = L - face * 0.2 + 0.02;
  const g = new THREE.Vector3(), nn = new THREE.Vector3(), b = new THREE.Vector3(), m4 = new THREE.Matrix4();
  for (let k = 0; k < Z; k++) {
    const f = (k / Z) * TAU, cf = Math.cos(f), sf = Math.sin(f);
    g.set(cd, sd * cf, sd * sf);
    nn.set(-sd, cd * cf, cd * sf);
    b.crossVectors(g, nn);
    m4.makeBasis(g, nn, b);
    m4.setPosition(Lm * cd + nn.x * toothH * 0.4, Lm * sd * cf + nn.y * toothH * 0.4, Lm * sd * sf + nn.z * toothH * 0.4);
    matrices.push(m4.clone());
  }
  return { body, tooth, matrices, axialFront: af, axialBack: ab + hubLen, L };
}
