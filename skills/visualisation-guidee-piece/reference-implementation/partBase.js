/* ============================================================================
 * partBase.js — Classe Part : une pièce sélectionnable (groupe 3D + matériaux propres)
 *  - position = base + glissement axial + décalage de vue éclatée
 *  - rotation autour de l'axe X de l'arbre (rotX)
 *  - style (coloration SSP, alerte, sélection, rayons X) appliqué sur ses matériaux
 * ========================================================================== */
import * as THREE from 'three';
import { makeMaterial } from './materials.js';

const _c = new THREE.Color();

export class Part {
  constructor(id, x = 0, y = 0, z = 0, opts = {}) {
    this.id = id;
    this.group = new THREE.Group();
    this.group.name = id;
    this.group.userData.partId = id;
    this.base = new THREE.Vector3(x, y, z);
    this.slide = 0;
    this.explode = new THREE.Vector3();
    this.local = new THREE.Vector3();          // écartement local d'un groupe (mode « décortiquer »)
    this.rotX = 0;
    this.mats = new Map();
    this.meshes = [];
    this.label = opts.label || null;          // { text, off:[x,y,z] }
    this.housing = !!opts.housing;
    this.rig = {};
    this.styleKey = '';
    this.apply();
  }

  mat(kind) {
    let m = this.mats.get(kind);
    if (!m) { m = makeMaterial(kind); m.userData.part = this.id; this.mats.set(kind, m); }
    return m;
  }

  _reg(mesh, kind, o) {
    mesh.userData.partId = this.id;
    mesh.userData.kind = kind;
    if (o.noCap) mesh.userData.noCap = true;
    if (o.noPick) mesh.userData.noPick = true;
    if (o.pos) mesh.position.set(o.pos[0], o.pos[1], o.pos[2]);
    (o.parent || this.group).add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  mesh(geo, kind = 'steel', o = {}) {
    return this._reg(new THREE.Mesh(geo, this.mat(kind)), kind, o);
  }

  instanced(geo, matrices, kind = 'steel', o = {}) {
    const im = new THREE.InstancedMesh(geo, this.mat(kind), matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.frustumCulled = false;
    im.userData.instanced = true;
    return this._reg(im, kind, { noCap: true, ...o });
  }

  /** Volume « fantôme » : n'écrit que le stencil (bouchage des éléments roulants) */
  ghost(geo, kind = 'chrome', o = {}) {
    const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const me = new THREE.Mesh(geo, mat);
    me.userData.ghost = true;
    me.raycast = () => {};
    return this._reg(me, kind, { noPick: true, ...o });
  }

  apply() {
    const b = this.base, e = this.explode, l = this.local;
    this.group.position.set(b.x + this.slide + e.x + l.x, b.y + e.y + l.y, b.z + e.z + l.z);
    this.group.rotation.x = this.rotX;
  }

  materials() { return [...this.mats.values()]; }

  /**
   * st = { emissive: hex|null, ei, tint: hex|null, tintAmt, opacity }
   * Valeurs par défaut : couleurs de base de la matière.
   */
  setStyle(st) {
    const key = `${st.emissive}|${st.ei?.toFixed(2)}|${st.tint}|${st.tintAmt?.toFixed(2)}|${st.opacity?.toFixed(2)}`;
    if (key === this.styleKey) return;
    this.styleKey = key;
    const op = st.opacity === undefined ? 1 : st.opacity;
    for (const m of this.mats.values()) {
      const b = m.userData.base;
      m.color.copy(b.color);
      if (st.tint != null && st.tintAmt > 0) m.color.lerp(_c.set(st.tint), st.tintAmt);
      if (st.emissive != null && st.ei > 0) { m.emissive.set(st.emissive); m.emissiveIntensity = st.ei; }
      else { m.emissive.copy(b.emissive); m.emissiveIntensity = b.ei; }
      const transparent = op < 0.999;
      if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
      m.opacity = op;
      m.depthWrite = !transparent || op > 0.6;
    }
  }
}
