/* ============================================================================
 * moduleBase.js — Socle commun des modules 2 (BVA) et 3 (DCT)
 *  Interface attendue par main.js / ui.js :
 *    root, parts, sim, pose(sim, dt), style(sim, opts), setExplode(p), views(), explodePlan
 * ========================================================================== */
import * as THREE from 'three';
import { Part } from './partBase.js';
import { SSP } from './materials.js';
import { tubeX } from './gearsBuilder.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (t) => t * t * (3 - 2 * t);

export class BaseModule {
  constructor(id, title) {
    this.id = id; this.title = title;
    this.root = new THREE.Group(); this.root.name = id;
    this.parts = {};
    this.explodePlan = [];
    this.groups = [];
  }
  add(part) { this.parts[part.id] = part; this.root.add(part.group); return part; }
  mk(id, x, y, z, label, opts = {}) {
    return this.add(new Part(id, x, y, z, { label: label ? { text: label[0], off: label[1] } : null, ...opts }));
  }
  step(label, entries) { this.explodePlan.push({ label, entries }); }

  setExplode(p) {
    const N = this.explodePlan.length;
    for (const id in this.parts) this.parts[id].explode.set(0, 0, 0);
    this.explodePlan.forEach((st, i) => {
      const t = smooth(clamp(p * N - i, 0, 1));
      if (t <= 0) return;
      for (const e of st.entries) {
        const pt = this.parts[e.id]; if (!pt) continue;
        pt.explode.x += e.v[0] * t; pt.explode.y += e.v[1] * t; pt.explode.z += e.v[2] * t;
      }
    });
    for (const id in this.parts) this.parts[id].apply();
    const idx = clamp(Math.floor(p * N - 1e-6), 0, N - 1);
    return { index: p <= 0 ? -1 : idx, total: N, label: p <= 0 ? 'Assemblé' : this.explodePlan[idx].label };
  }

  /** Style générique : survol / sélection / alerte / rayons X + crochet spécifique au module */
  styleGeneric(o, hook) {
    for (const id in this.parts) {
      const part = this.parts[id];
      const st = { emissive: null, ei: 0, tint: null, tintAmt: 0, opacity: 1 };
      const selected = o.selected === id, hover = o.hover === id, alert = o.alerts && o.alerts.has(id);
      if (part.housing) st.opacity = o.xray ? Math.min(o.housingOpacity, 0.08) : o.housingOpacity;
      if (hook) hook(part, st);
      if (o.xray && !part.housing && !selected && !alert && !st.emissive) st.opacity = 0.22;
      if (alert) { st.emissive = SSP.alerte; st.ei = 0.55 + 0.45 * Math.sin(o.time * 5) ** 2; st.opacity = 1; }
      if (hover) { st.emissive = SSP.select; st.ei = 0.35; }
      if (selected) { st.emissive = SSP.select; st.ei = 0.85; if (!part.housing) st.opacity = 1; }
      if (o.dim && o.dim.has(id) && !selected) { st.opacity = 0.06; st.emissive = null; st.ei = 0; st.tintAmt = 0; }
      part.setStyle(st);
    }
  }
}

/** Empilement de disques multidisques (garnis / lisses) en InstancedMesh, avec compression */
export function discStack(part, { rA, rB, rC, rD, n = 5, thick = 0.16, gapOpen = 0.55, gapClosed = 0.36 }) {
  const fricGeo = tubeGeo(rA, rC, thick), steelGeo = tubeGeo(rB, rD, thick);
  const gI = new THREE.Group(), gO = new THREE.Group();
  part.group.add(gI, gO);
  const fric = part.instanced(fricGeo, new Array(n).fill(new THREE.Matrix4()), 'friction', { parent: gI });
  const steel = part.instanced(steelGeo, new Array(n).fill(new THREE.Matrix4()), 'steel', { parent: gO });
  part.rig = { gI, gO, fric, steel, n, gapOpen, gapClosed };
  setStack(part, 0);
  return part;
}
const tubeGeo = (ri, ro, t) => tubeX(ri, ro, -t / 2, t / 2, 48);

export function setStack(part, level) {
  const r = part.rig, m = new THREE.Matrix4();
  const gap = r.gapOpen + (r.gapClosed - r.gapOpen) * level;
  for (let i = 0; i < r.n; i++) {
    m.makeTranslation((i - (r.n - 1) / 2) * gap * 2, 0, 0); r.fric.setMatrixAt(i, m);
    m.makeTranslation((i - (r.n - 1) / 2) * gap * 2 + gap, 0, 0); r.steel.setMatrixAt(i, m);
  }
  r.fric.instanceMatrix.needsUpdate = true; r.steel.instanceMatrix.needsUpdate = true;
}
