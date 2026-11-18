/* ============================================================================
 * sectionView.js — Coupe dynamique (clipping plane) avec BOUCHAGE visuel des sections
 *  Technique : stencil buffer. Pour chaque solide fermé, deux passes invisibles
 *  (faces arrière = +1, faces avant = −1) ; là où le compteur ≠ 0 on est « dans la
 *  matière » : un plan hachuré (couleur propre à chaque matière) est dessiné sur
 *  le plan de coupe. Une famille de matière = un jeu de passes + un plan de bouchage.
 * ========================================================================== */
import * as THREE from 'three';
import { CAP_STYLE } from './materials.js';

const AXES = { x: [-11, 30], y: [-18, 12], z: [-9, 22] };

function hatchTexture(style) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = style.bg; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = style.line; g.lineWidth = 3;
  g.save(); g.translate(32, 32); g.rotate((style.angle * Math.PI) / 180);
  for (let i = -64; i <= 64; i += 16) { g.beginPath(); g.moveTo(-90, i); g.lineTo(90, i); g.stroke(); }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(70, 70);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class SectionView {
  constructor(renderer, scene) {
    renderer.localClippingEnabled = true;
    this.renderer = renderer;
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e5);
    this.enabled = false; this.axis = 'z'; this.pos = 0; this.flip = false; this.caps = true;
    this.stencils = [];
    this.registered = new WeakSet();
    this.root = new THREE.Group(); this.root.name = 'section-caps';
    scene.add(this.root);
    this.capMeshes = {};
    let i = 0;
    for (const kind of Object.keys(CAP_STYLE)) {
      const order = i++ + 1;
      const mat = new THREE.MeshBasicMaterial({
        map: hatchTexture(CAP_STYLE[kind]), side: THREE.DoubleSide, toneMapped: false,
        stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat);
      m.renderOrder = order + 0.1;
      m.onAfterRender = (r) => r.clearStencil();
      m.visible = false; m.userData.noPick = true; m.frustumCulled = false;
      this.root.add(m);
      this.capMeshes[kind] = { mesh: m, order };
    }
    this._backMat = {}; this._frontMat = {};
    for (const kind of Object.keys(CAP_STYLE)) {
      const base = { depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, clippingPlanes: [this.plane] };
      this._backMat[kind] = new THREE.MeshBasicMaterial({ ...base, side: THREE.BackSide, stencilFail: THREE.IncrementWrapStencilOp, stencilZFail: THREE.IncrementWrapStencilOp, stencilZPass: THREE.IncrementWrapStencilOp });
      this._frontMat[kind] = new THREE.MeshBasicMaterial({ ...base, side: THREE.FrontSide, stencilFail: THREE.DecrementWrapStencilOp, stencilZFail: THREE.DecrementWrapStencilOp, stencilZPass: THREE.DecrementWrapStencilOp });
    }
    this.update();
  }

  /** Enregistre tous les maillages d'un module : clipping + passes de bouchage */
  register(root) {
    root.traverse((o) => {
      if (!o.isMesh || this.registered.has(o) || o.userData.stencil) return;
      this.registered.add(o);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { m.clippingPlanes = [this.plane]; });
      const kind = o.userData.kind;
      if (!kind || o.userData.noCap || !this.capMeshes[kind] || o.isInstancedMesh) return;
      const order = this.capMeshes[kind].order;
      for (const mat of [this._backMat[kind], this._frontMat[kind]]) {
        const s = new THREE.Mesh(o.geometry, mat);
        s.renderOrder = order; s.userData.stencil = true; s.userData.noPick = true; s.raycast = () => {};
        s.visible = this.enabled && this.caps;
        o.add(s);
        this.stencils.push(s);
      }
    });
  }

  setEnabled(on) { this.enabled = on; this.update(); }
  setAxis(a) { this.axis = a; this.update(); }
  setFlip(f) { this.flip = f; this.update(); }
  setCaps(c) { this.caps = c; this.update(); }
  setPos(p) { this.pos = p; this.update(); }
  /** t = 0 (pas de coupe) … 1 (coupe profonde) */
  setAmount(t) { const [lo, hi] = AXES[this.axis]; this.pos = this.flip ? lo + t * (hi - lo) : hi - t * (hi - lo); this.update(); }
  getAmount() { const [lo, hi] = AXES[this.axis]; return this.flip ? (this.pos - lo) / (hi - lo) : (hi - this.pos) / (hi - lo); }
  range() { return AXES[this.axis]; }

  update() {
    const e = new THREE.Vector3(this.axis === 'x' ? 1 : 0, this.axis === 'y' ? 1 : 0, this.axis === 'z' ? 1 : 0);
    if (!this.enabled) { this.plane.set(e.clone().negate(), 1e5); }
    else if (this.flip) this.plane.set(e.clone(), -this.pos);
    else this.plane.set(e.clone().negate(), this.pos);
    const showCaps = this.enabled && this.caps;
    for (const s of this.stencils) s.visible = showCaps;
    for (const k in this.capMeshes) {
      const m = this.capMeshes[k].mesh;
      m.visible = showCaps;
      if (showCaps) {
        m.position.set(0, 0, 0);
        this.plane.coplanarPoint(m.position);
        const n = this.plane.normal;
        m.lookAt(m.position.x - n.x, m.position.y - n.y, m.position.z - n.z);
      }
    }
  }
}
