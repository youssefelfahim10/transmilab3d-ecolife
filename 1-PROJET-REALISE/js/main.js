/* ============================================================================
 * main.js — Amorçage : rendu Three.js (PBR + environnement d'atelier), boucle, picking, caméras
 * ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Module1 } from './module1BVM.js';
import { Module2, Module3 } from './modules23.js';
import { SectionView } from './sectionView.js';
import { WorkshopAudio } from './audio.js';
import { initUI } from './ui.js';
import { applySpread } from './groups.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#gl'), viewport = $('#stage'); // la scène 3D (sur téléphone, les blocs d'information sont sous la scène, jamais dessus)

/* ------------------------------ rendu ------------------------------ */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);                 // le dégradé du thème (CSS) se voit à travers le canvas
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;        // HDRI neutre « studio d'atelier »
scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x1b2129, 0.45));
const sun = new THREE.DirectionalLight(0xffffff, 1.25); sun.position.set(30, 50, 40); scene.add(sun);
const rim = new THREE.DirectionalLight(0x88aaff, 0.5); rim.position.set(-30, 10, -30); scene.add(rim);
let grid = null;
function makeGrid(light) {
  if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
  grid = new THREE.GridHelper(120, 48, light ? 0x7f93a8 : 0x24303d, light ? 0x9fb0c2 : 0x18212b);
  grid.position.set(10, -24, 0); scene.add(grid);
}

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 2; controls.maxDistance = 160;
const labelRenderer = new CSS2DRenderer({ element: $('#labelLayer') });
labelRenderer.domElement.style.pointerEvents = 'none';

const section = new SectionView(renderer, scene);

/* ------------------------------ application ------------------------------ */
const app = {
  renderer, scene, camera, controls, section,
  modules: {}, module: null, selected: null, hover: null, alerts: new Set(), pickMode: false,
  hidden: new Set(), dim: new Set(), solo: null, scalpel: false, activeGroup: null,
  opts: { ssp: true, xray: false, lub: false, rotHL: false, housingOpacity: 0.22, labelMode: 'main' },
  audio: new WorkshopAudio(), loupeKey: null, tween: null, ui: null,
};
app.setTheme = (t) => {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('tl3d_theme', t); } catch (e) { /* stockage indisponible */ }
  makeGrid(t === 'light');
  $('#btnTheme').textContent = t === 'light' ? '🌙 Sombre' : '☀ Clair';
  app.theme = t;
};
window.__app = app;                                    // utile pour les tests / la démonstration

app.ui = initUI(app);
app.setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
$('#btnTheme').addEventListener('click', () => app.setTheme(app.theme === 'light' ? 'dark' : 'light'));

app.setTimeScale = (v) => { app.module.sim.timeScale = v; $('#timeScale').value = String(v); };

app.makeModule = (id) => {
  if (app.modules[id]) return app.modules[id];
  const m = id === 'bvm' ? new Module1() : id === 'bva' ? new Module2() : new Module3();
  // étiquettes 3D interactives
  for (const p of Object.values(m.parts)) {
    if (!p.label) continue;
    const div = document.createElement('div');
    div.className = 'lbl'; div.textContent = p.label.text;
    div.addEventListener('click', (e) => { e.stopPropagation(); app.onPartClick(p.id); });
    const o = new CSS2DObject(div);
    m.root.add(o); p.labelObj = o; p.labelEl = div;          // enfant de la racine : ne tourne pas avec la pièce
  }
  section.register(m.root);
  app.modules[id] = m;
  return m;
};

app.setModule = (id) => {
  if (app.module && app.module.id === id) return;
  if (app.module) {
    applySpread(app.module, null, 0);
    for (const p of Object.values(app.module.parts)) p.group.visible = true;
    scene.remove(app.module.root);
    for (const p of Object.values(app.module.parts)) if (p.labelEl) p.labelEl.remove();   // CSS2DRenderer ne nettoie pas les descendants
  }
  app.loupeKey = null;
  const m = app.makeModule(id);
  app.module = m; scene.add(m.root);
  app.selected = null; app.hover = null;
  section.setEnabled(false); $('#secOn').checked = false;
  document.querySelectorAll('#moduleTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.module === id));
  app.ui.onModule();
  app.flyToView('global', true);
  if (id === 'bva') app.ui.axialCut();                  // une boîte automatique se lit en coupe axiale (tambours, pistons, trains)
};

/* ------------------------------ caméra ------------------------------ */
/** Vue avec cadrage automatique : la boîte (fitW × fitH unités) tient toujours dans la fenêtre, quelle que soit sa forme (bureau, téléphone) */
const fitView = (v) => {
  if (!v.fitW) return v;
  const half = Math.tan((camera.fov * Math.PI) / 360), d = Math.max(v.fitW / 2 / (half * camera.aspect), v.fitH / 2 / half);
  const dir = v.pos.clone().sub(v.target).normalize();
  return { target: v.target, pos: v.target.clone().add(dir.multiplyScalar(Math.min(150, d))) };
};
app.flyTo = (view, instant = false) => {
  if (!view) return;
  view = fitView(view);
  if (instant) { camera.position.copy(view.pos); controls.target.copy(view.target); controls.update(); return; }
  app.tween = { t: 0, dur: 0.9, p0: camera.position.clone(), t0: controls.target.clone(), p1: view.pos.clone(), t1: view.target.clone() };
};
app.flyToView = (name, instant) => { const v = app.module.views(); app.flyTo(v[name], instant); };
app.focusPart = (id) => {
  const p = app.module.parts[id]; if (!p) return;
  const box = new THREE.Box3().setFromObject(p.group), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const dir = camera.position.clone().sub(controls.target).normalize();
  app.flyTo({ target: c, pos: c.clone().add(dir.multiplyScalar(Math.max(s.x, s.y, s.z) * 2.4 + 6)) });
};

app.focusIds = (ids) => {
  const box = new THREE.Box3();
  for (const id of ids) { const p = app.module.parts[id]; if (p) box.union(new THREE.Box3().setFromObject(p.group)); }
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const dir = camera.position.clone().sub(controls.target).normalize();
  app.flyTo({ target: c, pos: c.clone().add(dir.multiplyScalar(Math.max(s.x, s.y, s.z) * 2.2 + 8)) });
};

app.loupe = (key) => {
  const m = app.module; if (m.id !== 'bvm') return;
  app.loupeKey = key;
  app.ui.axialCut();
  app.setTimeScale(0.1);
  app.flyTo(m.views().loupe[key]);
  app.ui.toast(`Loupe synchro ${key === 12 ? '1/2' : key === 34 ? '3/4' : '5'} — ralenti × 0,1, coupe axiale. Passez un rapport sur le levier.`, 4200);
};
app.loupeOff = (silent) => {
  if (!app.loupeKey && silent) return;
  app.loupeKey = null;
  if (silent) return;
  app.setTimeScale(1);
  app.flyToView('global');
};

/* ------------------------------ sélection / picking ------------------------------ */
app.select = (id) => {
  app.selected = id;
  for (const p of Object.values(app.module.parts)) if (p.labelEl) p.labelEl.classList.toggle('sel', p.id === id);
  if (id) { if (app.ui.tab !== 'part') app.ui.prevTab = app.ui.tab; app.ui.showTab('part'); }
  else if (app.ui.tab === 'part') app.ui.renderPart(null);
  app.ui.renderTree();
};
app.onPartClick = (id) => {
  if (app.scalpel) { app.ui.hidePart(id); return; }
  if (app.pickMode) { app.ui.onPick(id); app.selected = id; app.ui.showTab('diag'); }
  else app.select(id);
};

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(ev) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const m = app.module, hits = ray.intersectObjects(m.root.children, true);
  for (const h of hits) {
    const o = h.object;
    if (o.userData.noPick || o.userData.stencil || o.userData.ghost) continue;
    let vis = true; for (let q = o; q; q = q.parent) if (q.visible === false) { vis = false; break; }
    if (!vis) continue;
    const pid = o.userData.partId; if (!pid) continue;
    const part = m.parts[pid];
    if (part.housing && app.opts.housingOpacity < 0.5) continue;
    if (app.dim.has(pid)) continue;
    if (section.enabled && section.plane.distanceToPoint(h.point) < 0) continue;
    return pid;
  }
  return null;
}
let down = null, hoverT = 0;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5; down = null;
  if (moved) return;
  const id = pick(e);
  if (id) app.onPartClick(id); else if (!app.pickMode) app.select(null);
});
canvas.addEventListener('pointermove', (e) => {
  const now = performance.now();
  if (down || now - hoverT < 70) return;
  hoverT = now;
  app.hover = pick(e);
  canvas.style.cursor = app.hover ? 'pointer' : app.pickMode ? 'crosshair' : 'grab';
});
canvas.addEventListener('pointerleave', () => { app.hover = null; });

/* ------------------------------ taille ------------------------------ */
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);

/* ------------------------------ libellés visibles ------------------------------ */
const MAIN_LABELS = new Set(['arbre-primaire', 'arbre-secondaire', 'pignon-attaque', 'couronne', 'boitier-diff', 'baladeur-12', 'baladeur-34', 'baladeur-5',
  'pignon-ar-baladeur', 'volant-moteur', 'disque-embrayage', 'rlt-prim-av', 'carter-meca', 'fourchette-12', 'p-3', 's-3', 'satellites']);
const _v = new THREE.Vector3();
let exclusion = [], exclFrame = 0;
function refreshExclusion() {
  const vr = viewport.getBoundingClientRect();
  exclusion = [];
  document.querySelectorAll('#hudTop .coach, #hudTop .phase:not(.hidden), #hudTop .flowbar:not(.hidden), #hudTop .toast.on, #hudTop .pick-hint:not(.hidden), #hudBottom > *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) exclusion.push({ x0: r.left - vr.left - 6, x1: r.right - vr.left + 6, y0: r.top - vr.top - 6, y1: r.bottom - vr.top + 6 });
  });
}
const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
/** Étiquettes : priorité (sélection > alerte > principales > autres), placement glouton SANS chevauchement
 *  ni avec les autres étiquettes, ni avec les blocs d'information (coach, phase, télémétrie…). */
function updateLabels() {
  const m = app.module, mode = app.opts.labelMode;
  if (exclFrame++ % 2 === 0) refreshExclusion();
  const W = viewport.clientWidth, H = viewport.clientHeight;
  const hubX = app.loupeKey ? { 12: 8.05, 34: 16.15, 5: 24.25 }[app.loupeKey] : null;
  const cands = [];
  for (const p of Object.values(m.parts)) {
    if (!p.labelObj) continue;
    const hidden = app.hidden.has(p.id);
    let vis = mode === 'all' || (mode === 'main' && (m.id !== 'bvm' || MAIN_LABELS.has(p.id)));
    if (app.solo) vis = mode !== 'off' && app.solo.has(p.id);
    if (hubX !== null) vis = mode !== 'off' && Math.abs(p.base.x - hubX) < 4.4 && !p.housing && p.base.y < 0 && p.base.z > -1;
    const sel = app.selected === p.id, flagged = p.labelEl.classList.contains('warn') || app.alerts.has(p.id);
    if ((sel || flagged) && !hidden && mode !== 'off') vis = true;
    if (!vis || hidden) { p.labelObj.visible = false; continue; }
    const b = p.base, e = p.explode, l = p.local, o = p.label.off;
    p.labelObj.position.set(b.x + p.slide + e.x + l.x + o[0], b.y + e.y + l.y + o[1], b.z + e.z + l.z + o[2]);
    cands.push({ p, pri: sel ? 100 : flagged ? 90 : app.solo ? 60 : MAIN_LABELS.has(p.id) ? 50 : 10 });
  }
  cands.sort((a, b) => b.pri - a.pri);
  const placed = [];
  for (const c of cands) {
    p_loop: {
      const p = c.p;
      p.labelObj.updateWorldMatrix(true, false);
      p.labelObj.getWorldPosition(_v); _v.project(camera);
      if (_v.z > 1 || Math.abs(_v.x) > 0.97 || Math.abs(_v.y) > 0.97) { p.labelObj.visible = false; break p_loop; }
      const px = (_v.x * 0.5 + 0.5) * W, py = (-_v.y * 0.5 + 0.5) * H, w = p.label.text.length * 6.4 + 16;
      const r = { x0: px - w / 2 - 3, x1: px + w / 2 + 3, y0: py - 12, y1: py + 12 };
      if (exclusion.some((q) => hit(r, q)) || placed.some((q) => hit(r, q))) { p.labelObj.visible = false; break p_loop; }
      placed.push(r); p.labelObj.visible = true;
    }
  }
}

/* ------------------------------ boucle ------------------------------ */
let lastT = performance.now();
function frame() {
  requestAnimationFrame(frame);
  const nowT = performance.now();
  const dt = Math.min((nowT - lastT) / 1000, 0.05); lastT = nowT;
  const m = app.module; if (!m) return;
  const sim = m.sim, sdt = dt * sim.timeScale;
  sim.update(sdt);
  for (const e of sim.events) app.ui.handleEvent(e);
  app.audio.update(sim);
  m.pose(sim, sdt);
  for (const p of Object.values(m.parts)) p.group.visible = !app.hidden.has(p.id);
  m.style(sim, { time: performance.now() / 1000, selected: app.selected, hover: app.hover, alerts: app.alerts, focus: app.lessonFocus, dim: app.dim, ...app.opts });
  if (app.tween) {
    const t = app.tween; t.t += dt / t.dur;
    const u = Math.min(1, t.t), e = u * u * (3 - 2 * u);
    camera.position.lerpVectors(t.p0, t.p1, e); controls.target.lerpVectors(t.t0, t.t1, e);
    if (u >= 1) app.tween = null;
  }
  controls.update();
  camera.updateMatrixWorld();
  updateLabels();                       // après la caméra : positions d'écran exactes de CETTE image
  app.ui.update(sim, performance.now());
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

resize();
app.setModule('bvm');
frame();
document.body.dataset.ready = '1';
app.ui.maybeTour();
