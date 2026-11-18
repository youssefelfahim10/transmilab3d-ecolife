// TransmiLab 3D — présentation PowerPoint cinématique (pptxgenjs). Les animations/transitions sont ajoutées ensuite par postprocess.py
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require('/root/.claude/skills/synced/f113ce90-930c-4ec5-91d1-6af117412af3_6874fc67-3572-4b3e-adc8-0f72dbc04f39/pptx/scripts/apply_theme.js');

const STATS = JSON.parse(fs.readFileSync('stats.json', 'utf8'));   // chiffres réels extraits du simulateur
const HAS = (f) => fs.existsSync(f);
const B64 = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');   // pochette des vidéos

/* ---------------------------------------------------------------- thème */
const THEME = {
  name: 'TransmiLab Futur',
  headFontFace: 'Arial', bodyFontFace: 'Calibri',
  colors: {
    dk1: '070B11', lt1: 'F2F6FA', dk2: '121C28', lt2: '9DB0C3',
    accent1: 'FF6A00', accent2: '00E5FF', accent3: '2ECC71', accent4: '2F8CFF', accent5: 'FFB020', accent6: 'FF3B3B',
    hlink: '00E5FF', folHlink: '9DB0C3',
  },
};
const HEX = { orange: 'FF6A00', cyan: '00E5FF', green: '2ECC71', blue: '2F8CFF', red: 'FF3B3B', amber: 'FFB020', light: 'F2F6FA', muted: '9DB0C3', panel: '121C28', bg: '070B11' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';                                   // 13.333 x 7.5
pres.title = 'TransmiLab 3D — Apprendre et diagnostiquer une boîte de vitesses';
pres.author = 'TransmiLab 3D';
pres.subject = 'Simulateur 3D pour la formation en maintenance automobile';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const LIGHT = C.background1, MUTED = C.background2, CYAN = C.accent2, ORANGE = C.accent1, PANEL = C.text2, GREEN = C.accent3, RED = C.accent6, BLUE = C.accent4, AMBER = C.accent5;

/* ---------------------------------------------------------------- gabarits (layouts) */
const FOOT = { x: 0.6, y: 7.05, w: 8, h: 0.3, fontSize: 10, color: MUTED, margin: 0, charSpacing: 2 };
const NUM = { x: 12.0, y: 7.05, w: 0.75, h: 0.3, fontSize: 10, color: MUTED, align: 'right', margin: 0 };
function master(name, bg, extra = []) {
  pres.defineSlideMaster({
    title: name, background: { path: bg }, margin: [0.5, 0.6, 0.6, 0.6],
    objects: [{ text: { text: 'TRANSMILAB 3D  ·  APPRENDRE & DIAGNOSTIQUER', options: FOOT } }, ...extra],
    slideNumber: NUM,
  });
}
const PH_TITLE = { name: 'title', type: 'title', x: 0.6, y: 0.62, w: 12.1, h: 0.85, fontSize: 34, bold: true, color: LIGHT, fontFace: 'Arial', margin: 0, valign: 'top', align: 'left' };
const PH_TAG = { name: 'tag', type: 'body', x: 0.6, y: 0.3, w: 9, h: 0.3, fontSize: 12, bold: true, color: CYAN, charSpacing: 4, margin: 0 };
pres.defineSlideMaster({
  title: 'CONTENT', background: { path: 'img/bg_content.jpeg' }, margin: [0.5, 0.6, 0.6, 0.6],
  objects: [{ text: { text: 'TRANSMILAB 3D  ·  APPRENDRE & DIAGNOSTIQUER', options: FOOT } },
    { placeholder: { options: PH_TAG, text: '' } }, { placeholder: { options: PH_TITLE, text: '' } }],
  slideNumber: NUM,
});
pres.defineSlideMaster({
  title: 'DIAG', background: { path: 'img/bg_diag.jpeg' }, margin: [0.5, 0.6, 0.6, 0.6],
  objects: [{ text: { text: 'TRANSMILAB 3D  ·  APPRENDRE & DIAGNOSTIQUER', options: FOOT } },
    { placeholder: { options: { ...PH_TAG, color: AMBER }, text: '' } }, { placeholder: { options: PH_TITLE, text: '' } }],
  slideNumber: NUM,
});
pres.defineSlideMaster({
  title: 'TITLE', background: { path: 'img/bg_title.jpeg' }, margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: 'tag', type: 'body', x: 0.8, y: 1.55, w: 6.2, h: 0.4, fontSize: 13, bold: true, color: CYAN, charSpacing: 5, margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.0, w: 6.3, h: 1.5, fontSize: 54, bold: true, color: LIGHT, fontFace: 'Arial', margin: 0, valign: 'top', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 3.7, w: 5.9, h: 1.5, fontSize: 20, color: MUTED, margin: 0, valign: 'top', align: 'left' }, text: '' } }],
});
pres.defineSlideMaster({
  title: 'TITLE_L', background: { path: 'img/bg_title.jpeg' }, margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: 'tag', type: 'body', x: 0.8, y: 1.55, w: 6.2, h: 0.4, fontSize: 13, bold: true, color: CYAN, charSpacing: 5, margin: 0, align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.0, w: 6.1, h: 1.5, fontSize: 40, bold: true, color: LIGHT, fontFace: 'Arial', margin: 0, valign: 'top', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 3.7, w: 5.9, h: 1.5, fontSize: 20, color: MUTED, margin: 0, valign: 'top', align: 'left' }, text: '' } }],
});
pres.defineSlideMaster({
  title: 'SECTION', background: { path: 'img/bg_section.jpeg' }, margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { text: { text: 'TRANSMILAB 3D  ·  APPRENDRE & DIAGNOSTIQUER', options: FOOT } },
    { placeholder: { options: { name: 'tag', type: 'body', x: 0.9, y: 2.15, w: 8, h: 0.4, fontSize: 14, bold: true, color: CYAN, charSpacing: 6, margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.9, y: 2.6, w: 7.6, h: 1.3, fontSize: 54, bold: true, color: LIGHT, fontFace: 'Arial', margin: 0, valign: 'top', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.9, y: 4.05, w: 7.0, h: 1.3, fontSize: 22, color: MUTED, margin: 0, valign: 'top', align: 'left' }, text: '' } }],
  slideNumber: NUM,
});
pres.defineSlideMaster({
  title: 'FULL', background: { path: 'img/bg_content.jpeg' }, margin: [0.5, 0.6, 0.6, 0.6],
  objects: [{ text: { text: 'TRANSMILAB 3D  ·  APPRENDRE & DIAGNOSTIQUER', options: FOOT } }],
  slideNumber: NUM,
});

/* ---------------------------------------------------------------- plan d'animation (lu par postprocess.py) */
const PLAN = {};          // n° de diapo -> { transition, anim:[{name, fx, delay}] }
const NAMES = {};
const SECTIONS = new Set();
function newSlide(layout, section, transition) {
  if (!SECTIONS.has(section)) { pres.addSection({ title: section }); SECTIONS.add(section); }
  const s = pres.addSlide({ masterName: layout, sectionTitle: section });
  const n = pres.slides.length;
  PLAN[n] = { transition, anim: [] }; NAMES[n] = 0;
  s._n = n;
  return s;
}
/** objectName unique + enregistrement de l'effet d'entrée */
function fx(s, effect, delay = 0) {
  const n = s._n; const name = `A${n}_${++NAMES[n]}`;
  if (effect) PLAN[n].anim.push({ name, fx: effect, delay });
  return name;
}

/* ---------------------------------------------------------------- briques graphiques */
function glass(s, x, y, w, h, { effect = 'fade', delay = 0, tint = 22, line = true } = {}) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12, fill: { color: PANEL, transparency: tint },
    line: line ? { color: CYAN, width: 0.75, transparency: 65 } : { type: 'none' }, objectName: fx(s, effect, delay),
  });
}
function brackets(s, x, y, w, h, col = CYAN, effect = null, delay = 0) {
  const L = 0.32, t = 0.035; const nm = (e) => fx(s, e ? 'fade' : null, delay);
  const add = (ax, ay, aw, ah) => s.addShape(pres.ShapeType.rect, { x: ax, y: ay, w: aw, h: ah, fill: { color: col }, line: { type: 'none' }, objectName: nm(effect) });
  const m = 0.06;
  add(x - m, y - m, L, t); add(x - m, y - m, t, L);
  add(x + w + m - L, y - m, L, t); add(x + w + m - t, y - m, t, L);
  add(x - m, y + h + m - t, L, t); add(x - m, y + h + m - L, t, L);
  add(x + w + m - L, y + h + m - t, L, t); add(x + w + m - t, y + h + m - L, t, L);
}
function pic(s, path, x, y, w, h, { effect = 'fade', delay = 0, frame = true, alt = '' } = {}) {
  s.addImage({ path, x, y, w, h, sizing: { type: 'cover', w, h }, objectName: fx(s, effect, delay), altText: alt || 'Capture du simulateur TransmiLab 3D' });
  if (frame) brackets(s, x, y, w, h);
}
function icon(s, name, color, x, y, size, { effect = null, delay = 0 } = {}) {
  s.addImage({ path: `icons/${name}_${color}.png`, x, y, w: size, h: size, objectName: fx(s, effect, delay), altText: '' });
}
function dot(s, x, y, d, color, txt, { effect = 'fade', delay = 0, fs = 16 } = {}) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color }, line: { type: 'none' }, objectName: fx(s, effect, delay) });
  if (txt !== undefined) s.addText(String(txt), { x, y, w: d, h: d, align: 'center', valign: 'middle', fontSize: fs, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: fx(s, effect, delay) });
}
function text(s, t, x, y, w, h, o = {}) {
  const { effect = 'fade', delay = 0, ...rest } = o;
  s.addText(t, { x, y, w, h, margin: 0, color: LIGHT, fontSize: 16, valign: 'top', isTextBox: true, objectName: fx(s, effect, delay), ...rest });
}
function heading(s, tag, title) { s.addText(tag, { placeholder: 'tag' }); s.addText(title, { placeholder: 'title' }); }
function kpi(s, value, label, x, y, w, color = ORANGE, delay = 0) {
  glass(s, x, y, w, 1.35, { effect: 'fly', delay });
  text(s, value, x + 0.15, y + 0.12, w - 0.3, 0.7, { fontSize: 38, bold: true, color, fontFace: 'Arial', align: 'center', effect: 'fade', delay: delay + 100 });
  text(s, label, x + 0.15, y + 0.85, w - 0.3, 0.4, { fontSize: 13, color: MUTED, align: 'center', effect: 'fade', delay: delay + 100 });
}
const N = (a) => a.toFixed(2).replace('.', ',');

/* ================================================================ 1. TITRE */
{
  const s = newSlide('TITLE', 'Ouverture', { k: 'fadeblack' });
  s.addText('SIMULATEUR 3D · MAINTENANCE AUTO', { placeholder: 'tag' });
  s.addText('TransmiLab 3D', { placeholder: 'title' });
  s.addText('Comprendre, décortiquer, diagnostiquer : la boîte de vitesses comme si vous l\'aviez entre les mains', { placeholder: 'body' });
  pic(s, 'img/hero_box2.jpeg', 7.0, 1.2, 5.9, 3.32, { effect: 'zoom', delay: 300, alt: 'Boîte de vitesses 3D en transparence, flux de couple en orange' });
  const chips = [['FaGraduationCap', 'Bac Pro · BTS MV · CQP'], ['FaCube', `${STATS.parts} pièces en 3D`], ['FaStethoscope', '6 pannes guidées']];
  chips.forEach(([ic, t], i) => {
    const x = 0.8 + i * 4.05, y = 5.75;
    glass(s, x, y, 3.75, 0.8, { effect: 'fly', delay: 900 + i * 250 });
    icon(s, ic, 'cyan', x + 0.22, y + 0.2, 0.4, { effect: 'fade', delay: 1000 + i * 250 });
    text(s, t, x + 0.8, y + 0.2, 2.8, 0.4, { fontSize: 16, bold: true, valign: 'middle', effect: 'fade', delay: 1000 + i * 250 });
  });
  s.addNotes('Ouverture. TransmiLab 3D est un atelier virtuel : on voit l\'intérieur d\'une boîte de vitesses, on la fait fonctionner, on la démonte à l\'écran et on cherche une panne comme à l\'atelier. Cette présentation suit le même chemin que l\'élève : découvrir, décortiquer, diagnostiquer, puis mettre en œuvre en classe.');
}

/* ================================================================ 2. PARCOURS */
{
  const s = newSlide('CONTENT', 'Ouverture', { k: 'pan' });
  heading(s, 'LE PARCOURS', 'Un parcours en 3 temps, du plus simple au plus fin');
  const cols = [
    ['01', 'DÉCOUVRIR', 'FaRoute', 'cyan', 'Suivre le couple du moteur aux roues. Les rapports, en vrai : des dents, des divisions.', '≈ 10 min'],
    ['02', 'DÉCORTIQUER', 'FaLayerGroup', 'orange', 'Isoler, écarter, couper, éclater. Chaque pièce a sa fiche : rôle, contrôle, symptômes, remontage.', '≈ 25 min'],
    ['03', 'DIAGNOSTIQUER', 'FaStethoscope', 'cyan', 'Reproduire la panne, observer, mesurer, désigner la pièce, réparer. Une étape à la fois.', '≈ 40 min'],
  ];
  cols.forEach(([n, t, ic, col, d, dur], i) => {
    const x = 0.6 + i * 4.1, y = 1.85, w = 3.85, h = 4.0;
    glass(s, x, y, w, h, { effect: 'fly', delay: 200 + i * 300 });
    text(s, n, x + 0.3, y + 0.25, 1.5, 0.8, { fontSize: 44, bold: true, color: col === 'orange' ? ORANGE : CYAN, fontFace: 'Arial', delay: 350 + i * 300 });
    icon(s, ic, col, x + w - 1.05, y + 0.3, 0.7, { effect: 'fade', delay: 350 + i * 300 });
    text(s, t, x + 0.3, y + 1.35, w - 0.6, 0.5, { fontSize: 22, bold: true, fontFace: 'Arial', delay: 450 + i * 300 });
    text(s, d, x + 0.3, y + 2.0, w - 0.6, 1.4, { fontSize: 16, color: MUTED, delay: 500 + i * 300 });
    glass(s, x + 0.3, y + 3.3, 1.5, 0.4, { effect: 'fade', delay: 600 + i * 300, tint: 0 });
    text(s, dur, x + 0.3, y + 3.3, 1.5, 0.4, { fontSize: 13, bold: true, color: AMBER, align: 'center', valign: 'middle', delay: 600 + i * 300 });
  });
  glass(s, 0.6, 6.1, 12.1, 0.7, { effect: 'fade', delay: 1500 });
  icon(s, 'FaUsers', 'orange', 0.85, 6.25, 0.4, { effect: 'fade', delay: 1600 });
  text(s, '04  Mettre en œuvre en classe : séance type de 90 minutes, parcours par niveau, partage par simple lien', 1.45, 6.1, 11.0, 0.7, { fontSize: 16, bold: true, valign: 'middle', delay: 1600 });
  s.addNotes('Le fil conducteur. Trois temps, du plus simple au plus fin, avec des durées indicatives. Le quatrième bloc est pour l\'enseignant : comment l\'utiliser en séance.');
}

/* ================================================================ 3. POURQUOI */
{
  const s = newSlide('CONTENT', 'Ouverture', { k: 'pan' });
  heading(s, 'POURQUOI', 'Voir l\'intérieur change tout');
  const probs = [['FaEye', 'Une boîte fermée, on ne voit rien', 'Le couple, les pignons, les synchros restent invisibles.'],
    ['FaBook', 'La théorie reste abstraite', 'Rapports, Z mené / Z menant : sans image, ça ne s\'accroche pas.'],
    ['FaWrench', 'Les pannes réelles sont rares', 'Longues et coûteuses à reproduire avec des élèves.']];
  text(s, 'AUJOURD\'HUI', 0.6, 1.75, 5, 0.3, { fontSize: 12, bold: true, color: AMBER, charSpacing: 4 });
  probs.forEach(([ic, t, d], i) => {
    const y = 2.2 + i * 1.5;
    glass(s, 0.6, y, 6.1, 1.3, { effect: 'fly', delay: 200 + i * 250 });
    icon(s, ic, 'orange', 0.85, y + 0.38, 0.55, { effect: 'fade', delay: 300 + i * 250 });
    text(s, t, 1.7, y + 0.2, 4.8, 0.4, { fontSize: 18, bold: true, delay: 300 + i * 250 });
    text(s, d, 1.7, y + 0.65, 4.8, 0.6, { fontSize: 14, color: MUTED, delay: 300 + i * 250 });
  });
  text(s, 'AVEC TRANSMILAB 3D', 7.2, 1.75, 5.5, 0.3, { fontSize: 12, bold: true, color: CYAN, charSpacing: 4, delay: 600 });
  const k = [[`${STATS.parts}`, 'pièces modélisées en 3D', ORANGE], ['3', 'modules : BVM · BVA · DCT', CYAN], ['6', 'pannes d\'atelier guidées', CYAN], [`${STATS.steps}`, 'étapes de démontage', ORANGE]];
  k.forEach(([v, l, c], i) => kpi(s, v, l, 7.2 + (i % 2) * 2.85, 2.2 + Math.floor(i / 2) * 1.6, 2.65, c, 700 + i * 200));
  glass(s, 7.2, 5.5, 5.5, 1.1, { effect: 'fade', delay: 1700, tint: 8 });
  text(s, 'Rapports calculés avec les nombres de dents réels : aucune animation « approximative ».', 7.45, 5.65, 5.0, 0.8, { fontSize: 15, bold: true, valign: 'middle', delay: 1800 });
  s.addNotes('Trois freins connus : on ne voit rien, la théorie est abstraite, les pannes sont rares. La réponse : un simulateur précis. Insister sur la précision : les vitesses angulaires viennent des nombres de dents réels, pas d\'une animation de principe.');
}

/* ================================================================ 4. L'OUTIL EN UN COUP D'ŒIL */
{
  const s = newSlide('CONTENT', 'Ouverture', { k: 'flythrough' });
  heading(s, 'L\'OUTIL', 'Trois zones, une logique simple');
  pic(s, 'img/ui_full.jpeg', 0.6, 1.65, 8.5, 4.78, { effect: 'zoom', delay: 150, alt: 'Interface du simulateur : pilotage à gauche, vue 3D au centre, analyse à droite' });
  const z = [['1', 'À gauche : je pilote', 'Levier en H, pédale, régime, charge, température d\'huile.', ORANGE],
    ['2', 'Au centre : je vois', 'La boîte en 3D, le chemin du couple expliqué en clair, la télémétrie.', CYAN],
    ['3', 'À droite : j\'analyse', 'Décortiquer · Fiche pièce · Chercher la panne.', ORANGE]];
  z.forEach(([n, t, d, c], i) => {
    const y = 1.65 + i * 1.65;
    glass(s, 9.5, y, 3.25, 1.5, { effect: 'fly', delay: 600 + i * 300 });
    dot(s, 9.7, y + 0.2, 0.5, c, n, { delay: 700 + i * 300, fs: 18 });
    text(s, t, 10.35, y + 0.2, 2.3, 0.5, { fontSize: 15, bold: true, valign: 'middle', delay: 700 + i * 300 });
    text(s, d, 9.7, y + 0.8, 2.9, 0.65, { fontSize: 12, color: MUTED, delay: 700 + i * 300 });
  });
  s.addNotes('Une seule règle à retenir : à gauche je pilote, au centre je vois, à droite j\'analyse. Le bandeau « Que faire ? » en haut de la vue indique toujours la prochaine action, et une visite guidée de 4 écrans s\'ouvre à la première utilisation.');
}

/* ================================================================ 5. EN MOUVEMENT (vidéo plein cadre) */
{
  const s = newSlide('FULL', 'Ouverture', { k: 'fade' });
  if (HAS('vid/orbit.mp4')) s.addMedia({ type: 'video', path: 'vid/orbit.mp4', cover: B64('img/hero_box2.jpeg'), x: 0, y: 0, w: 13.333, h: 7.5 });
  else s.addImage({ path: 'img/hero_box2.jpeg', x: 0, y: 0, w: 13.333, h: 7.5, sizing: { type: 'cover', w: 13.333, h: 7.5 } });
  glass(s, 0.6, 6.15, 6.6, 0.75, { effect: 'fade', delay: 500, tint: 10 });
  text(s, 'Regardez-la fonctionner : cliquez la vidéo', 0.85, 6.15, 6.2, 0.75, { fontSize: 18, bold: true, valign: 'middle', delay: 600 });
  s.addNotes('Moment « cinéma » : la boîte en rotation, couple actif en orange, pignons fous en gris. Cliquer sur la vidéo pour la lancer. Laisser tourner 5 secondes sans parler.');
}

/* ================================================================ 6. SECTION DÉCOUVRIR */
{
  const s = newSlide('SECTION', '1 · Découvrir', { k: 'vortex' });
  s.addText('CHAPITRE 01', { placeholder: 'tag' });
  s.addText('Découvrir', { placeholder: 'title' });
  s.addText('Du moteur aux roues : suivre le couple, comprendre les rapports', { placeholder: 'body' });
  if (HAS('img/hero_gears.jpeg')) pic(s, 'img/hero_gears.jpeg', 9.0, 1.4, 3.8, 4.5, { effect: 'zoom', delay: 300, alt: 'Engrènement hélicoïdal en gros plan' });
  s.addNotes('Chapitre 1. Objectif : que chaque élève sache dire par où passe la puissance et ce que fait un rapport.');
}

/* ================================================================ 7. CHEMIN DE LA PUISSANCE */
{
  const s = newSlide('CONTENT', '1 · Découvrir', { k: 'pan' });
  heading(s, 'DÉCOUVRIR', 'Le chemin de la puissance, en clair');
  pic(s, 'img/hero_box2.jpeg', 0.6, 1.6, 7.3, 4.1, { effect: 'zoom', delay: 150, alt: 'Boîte en 3ème : chemin du couple en orange' });
  glass(s, 8.25, 1.6, 4.5, 4.1, { effect: 'fly', delay: 500 });
  text(s, 'LIRE LES COULEURS', 8.5, 1.8, 4, 0.3, { fontSize: 12, bold: true, color: CYAN, charSpacing: 3, delay: 600 });
  const L = [[HEX.orange, 'Orange', 'le couple passe ici'], [HEX.muted, 'Gris', 'pignon fou : il tourne à vide'], [HEX.green, 'Vert', 'fourchette active'], [HEX.blue, 'Bleu', 'huile de lubrification'], [HEX.red, 'Rouge', 'pièce défectueuse']];
  L.forEach(([c, t, d], i) => {
    const y = 2.3 + i * 0.66;
    s.addShape(pres.ShapeType.ellipse, { x: 8.5, y: y + 0.08, w: 0.3, h: 0.3, fill: { color: c }, line: { type: 'none' }, objectName: fx(s, 'fade', 700 + i * 150) });
    text(s, [{ text: t + '  ', options: { bold: true } }, { text: d, options: { color: MUTED } }], 9.0, y, 3.6, 0.45, { fontSize: 15, valign: 'middle', delay: 700 + i * 150 });
  });
  const chain = ['Moteur', 'Embrayage', 'Arbre primaire', 'Pignon fixe', 'Pignon fou', 'Synchro', 'Arbre second.', 'Pont', 'Roues'];
  const cw = 1.2, gap = 0.16, x0 = 0.6;
  chain.forEach((t, i) => {
    const x = x0 + i * (cw + gap);
    s.addShape(pres.ShapeType.roundRect, { x, y: 5.95, w: cw, h: 0.5, rectRadius: 0.25, fill: { color: i % 2 ? ORANGE : ORANGE }, line: { type: 'none' }, objectName: fx(s, 'fly', 1100 + i * 180) });
    text(s, t, x, 5.95, cw, 0.5, { fontSize: 11, bold: true, color: C.text1, align: 'center', valign: 'middle', delay: 1100 + i * 180 });
  });
  text(s, 'Exemple en 3ème : pignon fixe de 28 dents → pignon fou de 37 dents (÷ 1,321), puis pont 62/15 (÷ 4,133) : 3000 tr/min moteur → 549 tr/min aux roues = 66 km/h', 0.6, 6.55, 12.1, 0.45, { fontSize: 13, color: MUTED, delay: 2900 });
  s.addNotes('Le « chemin du couple » s\'affiche dans l\'outil sous forme de maillons qui s\'allument. Lire l\'exemple chiffré : ce sont exactement les valeurs affichées à l\'écran en 3ème à 3000 tr/min.');
}

/* ================================================================ 8. RAPPORTS */
{
  const s = newSlide('CONTENT', '1 · Découvrir', { k: 'conveyor' });
  heading(s, 'DÉCOUVRIR', 'Les rapports : des dents, pas de la magie');
  const rows = STATS.gears;
  const hdr = ['Rapport', 'Dents (menant → mené)', 'i = Z mené / Z menant', 'Vitesse à 3000 tr/min'];
  const head = hdr.map((t) => ({ text: t, options: { bold: true, color: C.text1, fill: { color: CYAN }, fontSize: 13, align: 'center', valign: 'middle' } }));
  const body = rows.map((r, i) => [r.name, `${r.zp} → ${r.zs}`, r.iTxt, `${r.kmh} km/h`].map((t, j) => ({
    text: t, options: { color: LIGHT, fill: { color: PANEL, transparency: i % 2 ? 10 : 30 }, fontSize: 14, align: j === 0 ? 'left' : 'center', valign: 'middle', bold: j === 0 },
  })));
  s.addTable([head, ...body], { x: 0.6, y: 1.7, w: 6.9, colW: [1.2, 1.9, 1.9, 1.9], rowH: 0.52, border: { type: 'solid', pt: 0.5, color: '2A3A4A' }, objectName: fx(s, 'fade', 200) });
  text(s, `Rapport de pont : 62 / 15 = ${(62 / 15).toFixed(3).replace('.', ',')}   ·   N roues = N moteur / (i boîte × i pont)`, 0.6, 5.65, 6.9, 0.7, { fontSize: 15, bold: true, color: CYAN, delay: 900 });
  const labels = rows.map((r) => r.name), vals = rows.map((r) => Math.abs(r.kmhNum));
  s.addChart(pres.charts.BAR, [{ name: 'Vitesse (km/h)', labels, values: vals }], {
    x: 7.9, y: 1.6, w: 4.9, h: 4.6, barDir: 'col', chartColors: [HEX.orange], showTitle: true, title: 'Vitesse à 3000 tr/min (km/h)', titleColor: HEX.light, titleFontSize: 14, titleFontFace: '+mn-lt',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: HEX.light, dataLabelFontSize: 12, dataLabelFontFace: '+mn-lt',
    catAxisLabelColor: HEX.muted, catAxisLabelFontSize: 12, catAxisLabelFontFace: '+mn-lt', valAxisLabelColor: HEX.muted, valAxisLabelFontSize: 11, valAxisLabelFontFace: '+mn-lt',
    valGridLine: { color: '2A3A4A', size: 0.5 }, catGridLine: { style: 'none' }, showLegend: false, valAxisHidden: false, barGapWidthPct: 45, objectName: fx(s, 'wipe', 600),
  });
  s.addNotes('Chaque rapport est un simple rapport de dents. À régime constant, plus le rapport est « long », plus la vitesse du véhicule est grande. La marche arrière est la plus « courte » après la 1ère : 44/12. Faire le calcul d\'une ligne au tableau avec les élèves.');
}

/* ================================================================ 9. CE QU'IL Y A DANS LA BOÎTE */
{
  const s = newSlide('CONTENT', '1 · Découvrir', { k: 'pan' });
  heading(s, 'DÉCOUVRIR', 'Trois ensembles à retenir');
  const it = [['FaArrowRight', 'orange', 'Arbre primaire', 'Reçoit le couple du moteur par le disque d\'embrayage. Ses pignons sont fixes : il tourne dès que l\'embrayage est embrayé.'],
    ['FaCogs', 'cyan', 'Arbre secondaire creux', 'Porte les pignons fous et les synchroniseurs. Son alésage amène l\'huile sous chaque cage à aiguilles.'],
    ['FaCog', 'orange', 'Pont et différentiel', 'Couple conique 62/15, boîtier, satellites et planétaires : il répartit le mouvement entre les deux roues.']];
  it.forEach(([ic, col, t, d], i) => {
    const y = 1.7 + i * 1.7;
    glass(s, 0.6, y, 6.6, 1.5, { effect: 'fly', delay: 200 + i * 300 });
    icon(s, ic, col, 0.85, y + 0.45, 0.6, { effect: 'fade', delay: 300 + i * 300 });
    text(s, t, 1.75, y + 0.15, 5.2, 0.45, { fontSize: 19, bold: true, delay: 300 + i * 300 });
    text(s, d, 1.75, y + 0.62, 5.2, 0.85, { fontSize: 14, color: MUTED, delay: 300 + i * 300 });
  });
  pic(s, 'img/hero_sync_iso.jpeg', 7.6, 1.7, 5.15, 2.9, { effect: 'zoom', delay: 700, alt: 'Synchroniseur et pignons fous' });
  pic(s, 'img/hero_diff.jpeg', 7.6, 4.85, 5.15, 1.9, { effect: 'zoom', delay: 1000, alt: 'Pont et différentiel' });
  s.addNotes('Les trois ensembles. Demander aux élèves : quel arbre tourne au point mort pédale relâchée ? Réponse : le primaire. Cette question revient dans le cas pratique C.');
}

/* ================================================================ 10. SECTION DÉCORTIQUER */
{
  const s = newSlide('SECTION', '2 · Décortiquer', { k: 'vortex' });
  s.addText('CHAPITRE 02', { placeholder: 'tag' });
  s.addText('Décortiquer', { placeholder: 'title' });
  s.addText('Voir chaque pièce, comprendre le passage de vitesse, ouvrir la boîte', { placeholder: 'body' });
  pic(s, 'img/hero_explode_a.jpeg', 9.0, 1.4, 3.8, 4.5, { effect: 'zoom', delay: 300, alt: 'Vue éclatée de la boîte' });
  s.addNotes('Chapitre 2. On passe de « ça tourne » à « voici pourquoi ça passe ».');
}

/* ================================================================ 11. 3 PHASES */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'ferris' });
  heading(s, 'DÉCORTIQUER', 'Un passage de vitesse, en 3 phases');
  const ph = [['ph1', '1', 'Débrayage', 'Le plateau recule, le disque est libéré : le flux moteur est coupé.', ORANGE],
    ['ph2', '2', 'Synchronisation', 'Le cône laiton frotte sur le pignon fou. L\'anneau bloque le baladeur tant que les vitesses diffèrent.', CYAN],
    ['ph3', '3', 'Crabotage + embrayage', 'Le baladeur franchit l\'anneau, s\'engrène sur les crabots. On embraye : le couple repasse.', ORANGE]];
  ph.forEach(([img, n, t, d, c], i) => {
    const x = 0.6 + i * 4.1, w = 3.95;
    pic(s, `img/${img}.jpeg`, x, 1.65, w, 2.3, { effect: 'fly', delay: 200 + i * 400, alt: `Phase ${n} du passage de vitesse` });
    dot(s, x, 4.2, 0.55, c, n, { delay: 400 + i * 400, fs: 18 });
    text(s, t, x + 0.7, 4.2, w - 0.7, 0.55, { fontSize: 19, bold: true, valign: 'middle', delay: 400 + i * 400 });
    text(s, d, x, 4.95, w, 1.5, { fontSize: 15, color: MUTED, delay: 500 + i * 400 });
  });
  s.addNotes('Les trois phases telles que l\'élève les voit dans l\'outil, avec le bandeau de phase qui explique chaque instant. Phase 2 : insister sur le mot « indexée » : l\'anneau bloque le baladeur tant que les vitesses ne sont pas égales.');
}

/* ================================================================ 12. VIDÉO PASSAGE */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'flythrough' });
  heading(s, 'DÉCORTIQUER', 'Le passage, au ralenti, sous la loupe');
  if (HAS('vid/shift.mp4')) s.addMedia({ type: 'video', path: 'vid/shift.mp4', cover: B64('img/ph2.jpeg'), x: 0.6, y: 1.6, w: 8.4, h: 4.725 });
  else s.addImage({ path: 'img/ph2.jpeg', x: 0.6, y: 1.6, w: 8.4, h: 4.725 });
  brackets(s, 0.6, 1.6, 8.4, 4.725);
  const t = [['FaSearch', 'Loupe synchro', 'Caméra dédiée, coupe axiale, ralenti ×0,1.'], ['FaTachometerAlt', 'Écart Δ visible', 'On voit l\'écart de régime tomber à zéro.'], ['FaCog', 'Anneau indexé', 'Il tourne de quelques degrés et bloque le baladeur.']];
  t.forEach(([ic, a, b], i) => {
    const y = 1.6 + i * 1.6;
    glass(s, 9.35, y, 3.4, 1.45, { effect: 'fly', delay: 400 + i * 300 });
    icon(s, ic, 'cyan', 9.55, y + 0.2, 0.45, { effect: 'fade', delay: 500 + i * 300 });
    text(s, a, 10.15, y + 0.2, 2.5, 0.45, { fontSize: 16, bold: true, valign: 'middle', delay: 500 + i * 300 });
    text(s, b, 9.55, y + 0.8, 3.05, 0.6, { fontSize: 13, color: MUTED, delay: 500 + i * 300 });
  });
  s.addNotes('Cliquer la vidéo. Ce que l\'on voit : le baladeur avance, les clavettes poussent l\'anneau laiton, le cône frotte, puis le baladeur franchit l\'anneau. Dans l\'outil, tout cela se déclenche en passant simplement une vitesse sur le levier.');
}

/* ================================================================ 13. SYNCHRO DÉCORTIQUÉ */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'pan' });
  heading(s, 'DÉCORTIQUER', 'Le synchroniseur, pièce par pièce');
  pic(s, 'img/hero_sync_spread.jpeg', 0.6, 1.6, 7.7, 4.33, { effect: 'zoom', delay: 150, alt: 'Synchroniseur 1/2 isolé et écarté' });
  const P = [['Anneau laiton', 'cône de friction + dents d\'arrêt'], ['3 clavettes', 'entraînent l\'anneau vers le cône'], ['2 ressorts annulaires', 'maintiennent les clavettes'],
    ['Baladeur + fourchette', 'denture intérieure chanfreinée'], ['Moyeu cannelé', 'solidaire de l\'arbre secondaire'], ['Pignon fou', 'cône mâle + couronne de crabotage']];
  P.forEach(([a, b], i) => {
    const y = 1.6 + i * 0.72;
    dot(s, 8.65, y + 0.04, 0.44, i % 2 ? CYAN : ORANGE, i + 1, { delay: 500 + i * 250, fs: 14 });
    text(s, [{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { color: MUTED, fontSize: 13 } }], 9.25, y, 3.5, 0.65, { fontSize: 15, delay: 500 + i * 250 });
  });
  glass(s, 0.6, 6.15, 12.1, 0.7, { effect: 'fade', delay: 2200, tint: 8 });
  text(s, 'Dans l\'outil : « Décortiquer » sur le groupe, puis le curseur « Écarter les pièces ».', 0.85, 6.15, 11.6, 0.7, { fontSize: 16, bold: true, valign: 'middle', delay: 2300 });
  s.addNotes('Capture du mode « Décortiquer » : le groupe synchroniseur 1/2 est isolé, les autres pièces sont estompées, et le curseur écarte les pièces depuis leur centre. Faire nommer chaque pièce par les élèves avant d\'afficher la légende.');
}

/* ================================================================ 14. OUTILS DÉCORTIQUER */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'pan' });
  heading(s, 'DÉCORTIQUER', 'Six outils, aucun mode d\'emploi');
  const T = [['FaSearch', 'Chercher', 'Arbre des pièces avec recherche'], ['FaLayerGroup', 'Isoler', 'Un groupe, les autres s\'estompent'], ['FaExpandArrowsAlt', 'Écarter', 'Curseur d\'écartement du groupe'],
    ['FaCut', 'Masquer', 'Œil ou mode scalpel (clic = masquer)'], ['FaCube', 'Vue éclatée', `${STATS.steps} étapes, ordre de démontage`], ['FaSlidersH', 'Coupe', 'Axiale en un clic, hachures par matière']];
  T.forEach(([ic, a, b], i) => {
    const x = 0.6 + (i % 2) * 4.3, y = 1.7 + Math.floor(i / 2) * 1.7;
    glass(s, x, y, 4.1, 1.5, { effect: 'fly', delay: 200 + i * 220 });
    icon(s, ic, i % 2 ? 'cyan' : 'orange', x + 0.25, y + 0.4, 0.65, { effect: 'fade', delay: 300 + i * 220 });
    text(s, a, x + 1.15, y + 0.3, 2.8, 0.45, { fontSize: 19, bold: true, delay: 300 + i * 220 });
    text(s, b, x + 1.15, y + 0.8, 2.8, 0.6, { fontSize: 14, color: MUTED, delay: 300 + i * 220 });
  });
  pic(s, 'img/ui_tree.png', 9.75, 1.55, 3.0, 5.2, { effect: 'zoom', delay: 700, alt: 'Onglet Décortiquer : arbre des pièces et barre de groupe' });
  s.addNotes('Les six outils de l\'onglet Décortiquer. Aucune formation nécessaire : chaque bouton dit ce qu\'il fait, et le bandeau « Que faire ? » guide.');
}

/* ================================================================ 15. VOIR À L'INTÉRIEUR */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'pan' });
  heading(s, 'DÉCORTIQUER', 'Ouvrir la boîte : coupe et vue éclatée');
  pic(s, 'img/hero_cut.jpeg', 0.6, 1.65, 6.0, 3.9, { effect: 'fly', delay: 200, alt: 'Coupe axiale avec hachures par matière' });
  pic(s, 'img/hero_explode.jpeg', 6.75, 1.65, 6.0, 3.9, { effect: 'fly', delay: 500, alt: 'Vue éclatée progressive' });
  [[0.6, 'Coupe axiale', 'Hachures : acier, laiton, alu. Les clavettes et l\'anneau apparaissent en section.', 'FaSlidersH'], [6.75, 'Vue éclatée', 'Ordre exact de démontage, circlips, cales et roulements compris.', 'FaExpandArrowsAlt']].forEach(([x, t, d, ic], i) => {
    icon(s, ic, 'cyan', x, 5.85, 0.5, { effect: 'fade', delay: 800 + i * 300 });
    text(s, t, x + 0.7, 5.8, 5.2, 0.4, { fontSize: 18, bold: true, delay: 800 + i * 300 });
    text(s, d, x + 0.7, 6.22, 5.2, 0.6, { fontSize: 14, color: MUTED, delay: 800 + i * 300 });
  });
  s.addNotes('Deux façons de voir l\'intérieur. La coupe : un plan que l\'on déplace, avec des hachures différentes selon la matière. La vue éclatée : un curseur de 0 à 100 % qui retire les pièces dans l\'ordre du démontage atelier.');
}

/* ================================================================ 16. FICHE PIÈCE */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'pan' });
  heading(s, 'DÉCORTIQUER', 'Un clic sur une pièce : sa fiche complète');
  pic(s, 'img/ui_fiche.png', 0.6, 1.5, 2.55, 5.3, { effect: 'zoom', delay: 150, alt: 'Fiche pièce : anneau de synchro, contrôle et métrologie' });
  const V = [['FaRoute', 'Rôle cinématique', 'À quoi sert la pièce dans la chaîne de traction.', 'cyan'], ['FaRuler', 'Contrôle et métrologie', 'Comment la mesurer au démontage, valeur neuve, limite d\'usure.', 'orange'],
    ['FaVolumeUp', 'Symptômes client', 'Bruit, ressenti au levier, comportement routier.', 'cyan'], ['FaWrench', 'Remontage', 'Sens, calage, couples, bonne huile (GL-4, pas GL-5).', 'orange']];
  V.forEach(([ic, t, d, c], i) => {
    const x = 3.6 + (i % 2) * 4.65, y = 1.6 + Math.floor(i / 2) * 2.1;
    glass(s, x, y, 4.45, 1.9, { effect: 'fly', delay: 300 + i * 250 });
    icon(s, ic, c, x + 0.25, y + 0.25, 0.55, { effect: 'fade', delay: 400 + i * 250 });
    text(s, t, x + 1.0, y + 0.28, 3.3, 0.5, { fontSize: 17, bold: true, valign: 'middle', delay: 400 + i * 250 });
    text(s, d, x + 0.25, y + 0.95, 4.0, 0.9, { fontSize: 14, color: MUTED, delay: 400 + i * 250 });
  });
  glass(s, 3.6, 5.95, 9.1, 0.85, { effect: 'fade', delay: 1500, tint: 8 });
  icon(s, 'FaMicroscope', 'orange', 3.85, 6.1, 0.5, { effect: 'fade', delay: 1600 });
  text(s, 'Bouton « Contrôler » : une mesure simulée, comparée à la valeur neuve et à la limite.', 4.55, 5.95, 8.0, 0.85, { fontSize: 15, bold: true, valign: 'middle', delay: 1600 });
  s.addNotes('Chaque pièce a la même fiche en quatre volets, avec une phrase « en clair » en tête. Le bouton Contrôler fait le lien avec le diagnostic : c\'est ainsi que l\'élève relève des mesures.');
}

/* ================================================================ 17. MODULES 2 ET 3 */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'ferris' });
  heading(s, 'DÉCORTIQUER', 'Et aussi : boîte automatique et double embrayage');
  [['img/hero_bva_cut.jpeg', 'Module 2 · BVA 6 rapports', ['Convertisseur + pontage, pompe, 2 trains (réducteur + Ravigneaux)', '3 embrayages A-B-E, 2 freins C-D : tableau d\'engagement', 'Bloc hydraulique et 3 pannes guidées']],
    ['img/hero_dct.jpeg', 'Module 3 · DCT (base fonctionnelle)', ['Arbres primaires concentriques (impairs / pairs)', 'Rapport suivant présélectionné', 'Recouvrement des 2 embrayages : couple continu']]].forEach(([img, t, b], i) => {
    const x = 0.6 + i * 6.25;
    pic(s, img, x, 1.6, 5.85, 3.3, { effect: 'fly', delay: 200 + i * 400, alt: t });
    text(s, t, x, 5.15, 5.85, 0.45, { fontSize: 20, bold: true, color: i ? CYAN : ORANGE, delay: 500 + i * 400 });
    text(s, b.map((x2, k) => ({ text: x2, options: { bullet: true, breakLine: k < 2, paraSpaceAfter: 4 } })), x, 5.65, 5.85, 1.25, { fontSize: 14, color: MUTED, delay: 600 + i * 400 });
  });
  s.addNotes('Les modules 2 et 3 ont la même interface et les mêmes outils de décorticage. Le module 2 est maintenant une vraie boîte automatique à 6 rapports, avec ses trois pannes guidées ; le module 3 (double embrayage) reste une base fonctionnelle, sans cas pratique pour l\'instant.');
}

/* ================================================================ 17b. MODULE 2 : LIRE UNE BOÎTE AUTOMATIQUE */
{
  const s = newSlide('CONTENT', '2 · Décortiquer', { k: 'flythrough' });
  heading(s, 'MODULE 2 · BOÎTE AUTOMATIQUE', 'Lire une boîte automatique : un seul tableau');
  pic(s, 'img/hero_bva_trains.jpeg', 0.6, 1.6, 6.9, 3.88, { effect: 'zoom', delay: 200, alt: 'Coupe de la boîte automatique : trains épicycloïdaux, embrayages sous pression en orange' });
  pic(s, 'img/ui_bva_table.png', 7.85, 1.6, 4.9, 3.88, { effect: 'fly', delay: 500, alt: 'Tableau d\'engagement : 3ème = embrayages A et B' });
  const k = [['FaCogs', 'Convertisseur', 'Multiplie le couple au démarrage (≈ ×2), puis se verrouille (pontage).'],
    ['FaProjectDiagram', 'Deux trains', 'Un réducteur + un Ravigneaux : 6 rapports calculés avec les dents.'],
    ['FaTint', 'Hydraulique', 'Des électrovannes envoient l\'huile aux pistons : orange = sous pression.']];
  k.forEach(([ic, t, d], i) => {
    const x = 0.6 + i * 4.1, y = 5.7;
    glass(s, x, y, 3.95, 1.2, { effect: 'fade', delay: 900 + i * 250 });
    icon(s, ic, i === 1 ? 'cyan' : 'orange', x + 0.2, y + 0.18, 0.42, { effect: 'fade', delay: 1000 + i * 250 });
    text(s, t, x + 0.8, y + 0.12, 3.0, 0.35, { fontSize: 15, bold: true, delay: 1000 + i * 250 });
    text(s, d, x + 0.8, y + 0.5, 3.05, 0.68, { fontSize: 11.5, color: MUTED, delay: 1000 + i * 250 });
  });
  s.addNotes('Module 2. Le tableau d\'engagement est la clé : chaque rapport est obtenu en appliquant exactement deux éléments parmi trois embrayages (A, B, E) et deux freins (C, D). En 3ème, A et B ; en marche arrière, B et D. Les rapports sont calculés à partir des nombres de dents de deux trains épicycloïdaux, avec les équations de Willis : 4,19 · 2,34 · 1,51 · 1,14 · 0,87 · 0,69 et AR −3,40. Les nombres de dents sont génériques, choisis pour retrouver les rapports usuels de ce type de boîte, pas ceux d\'un modèle précis. L\'implantation axiale est simplifiée : une boîte réelle est plus compacte.');
}

/* ================================================================ 18. SECTION DIAGNOSTIQUER */
{
  const s = newSlide('SECTION', '3 · Diagnostiquer', { k: 'vortex' });
  s.addText('CHAPITRE 03', { placeholder: 'tag' });
  s.addText('Diagnostiquer', { placeholder: 'title' });
  s.addText('Chercher la panne comme à l\'atelier : reproduire, observer, mesurer, décider', { placeholder: 'body' });
  pic(s, 'img/hero_rot.jpeg', 9.0, 1.4, 3.8, 4.5, { effect: 'zoom', delay: 300, alt: 'Panne : seul l\'arbre primaire tourne au point mort' });
  s.addNotes('Chapitre 3. Le cœur pédagogique : l\'élève devient technicien.');
}

/* ================================================================ 19. DÉMARCHE 6 ÉTAPES */
{
  const s = newSlide('DIAG', '3 · Diagnostiquer', { k: 'pan' });
  heading(s, 'DIAGNOSTIQUER', 'Une démarche en 6 étapes, une à la fois');
  const E = [['FaPlay', 'Reproduire', 'Un bouton lance la panne'], ['FaEye', 'Observer', 'Zoom, rayons X, ce qui tourne'], ['FaBrain', 'Hypothèse', 'Choisir, avec explication'],
    ['FaMicroscope', 'Mesurer', 'Pièces suspectes à toucher'], ['FaBullseye', 'Désigner', 'La pièce défectueuse'], ['FaWrench', 'Réparer', 'Protocole atelier']];
  E.forEach(([ic, t, d], i) => {
    const x = 0.6 + i * 2.05, y = 1.75, w = 1.9;
    glass(s, x, y, w, 2.5, { effect: 'fly', delay: 200 + i * 280 });
    dot(s, x + 0.65, y + 0.2, 0.6, i === 5 ? GREEN : CYAN, i + 1, { delay: 300 + i * 280, fs: 20 });
    icon(s, ic, 'white', x + 0.7, y + 0.95, 0.5, { effect: 'fade', delay: 350 + i * 280 });
    text(s, t, x + 0.1, y + 1.55, w - 0.2, 0.4, { fontSize: 16, bold: true, align: 'center', delay: 350 + i * 280 });
    text(s, d, x + 0.15, y + 1.95, w - 0.3, 0.5, { fontSize: 12, color: MUTED, align: 'center', delay: 350 + i * 280 });
  });
  pic(s, 'img/ui_diag3.png', 0.6, 4.5, 2.2, 2.3, { effect: 'fade', delay: 2000, alt: 'Étape hypothèse' });
  pic(s, 'img/ui_diag4.png', 3.05, 4.5, 2.2, 2.3, { effect: 'fade', delay: 2200, alt: 'Étape mesurer' });
  text(s, [{ text: 'Précédent / Suivant à chaque étape.', options: { bold: true, breakLine: true } }, { text: 'Trois niveaux d\'indices : l\'OR, l\'aide à l\'observation 3D, l\'expertise avec chiffrage.', options: { color: MUTED } }], 5.65, 4.55, 7.1, 1.3, { fontSize: 17, delay: 2400 });
  glass(s, 5.65, 5.85, 7.1, 0.95, { effect: 'fade', delay: 2600, tint: 8 });
  text(s, 'L\'élève comprend POURQUOI les autres hypothèses sont fausses.', 5.9, 5.85, 6.6, 0.95, { fontSize: 16, bold: true, color: AMBER, valign: 'middle', delay: 2700 });
  s.addNotes('La démarche en six étapes. Une seule étape est affichée à la fois : c\'est ce qui rend l\'outil simple pour tous les niveaux. L\'élève peut toujours demander un indice, au nombre de trois.');
}

/* ================================================================ 20-22. LES 3 PANNES */
function panne(letter, title, img, video, symptome, cause, preuve, notes) {
  const s = newSlide('DIAG', '3 · Diagnostiquer', { k: 'flash' });
  heading(s, `CAS ${letter}`, title);
  const IW = 6.6, IH = 3.71;
  if (video && HAS(video)) s.addMedia({ type: 'video', path: video, cover: B64(img), x: 0.6, y: 1.65, w: IW, h: IH });
  else s.addImage({ path: img, x: 0.6, y: 1.65, w: IW, h: IH, sizing: { type: 'cover', w: IW, h: IH } });
  brackets(s, 0.6, 1.65, IW, IH, AMBER);
  [['FaVolumeUp', 'Symptôme', symptome, AMBER], ['FaBrain', 'Cause', cause, CYAN], ['FaRuler', 'Preuve mesurée', preuve, ORANGE]].forEach(([ic, a, b2, c], i) => {
    const y = 1.65 + i * 1.4;
    glass(s, 7.55, y, 5.2, 1.27, { effect: 'fly', delay: 400 + i * 350 });
    icon(s, ic, i === 1 ? 'cyan' : 'orange', 7.75, y + 0.15, 0.4, { effect: 'fade', delay: 500 + i * 350 });
    text(s, a.toUpperCase(), 8.35, y + 0.12, 4.3, 0.3, { fontSize: 12, bold: true, color: c, charSpacing: 3, delay: 500 + i * 350 });
    text(s, b2, 8.35, y + 0.42, 4.3, 0.82, { fontSize: 13, delay: 500 + i * 350 });
  });
  glass(s, 0.6, 5.95, 12.15, 0.9, { effect: 'fade', delay: 1700, tint: 8 });
  icon(s, 'FaLightbulb', 'orange', 0.85, 6.15, 0.5, { effect: 'fade', delay: 1800 });
  text(s, notes.retenir, 1.6, 5.95, 11.0, 0.9, { fontSize: 15, bold: true, valign: 'middle', delay: 1800 });
  s.addNotes(notes.script);
  return s;
}
panne('A', 'La 2ème craque au rétrogradage, à froid', 'img/pa_crunch.jpeg', 'vid/crunch.mp4',
  '« Quand je rétrograde de 3ème en 2ème le matin, ça craque. À chaud, beaucoup moins. »',
  'Cône de l\'anneau de synchro de 2ème usé : le pignon fou n\'est plus freiné assez vite, surtout huile froide.',
  'Jeu anneau / cône : 0,3 mm mesuré pour 1,2 mm neuf et 0,5 mm de limite : hors tolérance.',
  { retenir: 'À retenir : un synchro doit égaliser les vitesses AVANT le crabotage. Remède : kit synchro + huile GL-4 (jamais GL-5 : elle attaque le laiton).',
    script: 'Cas A. Reproduire : l\'outil place la boîte en 3ème, huile à 20 °C, et rétrograde en 2ème. Observer : le pignon fou gris ne ralentit pas, l\'écart Δ ne tombe pas à zéro, le baladeur force : craquement. Mesure : 0,3 mm contre 0,5 mm de limite. Le même cône à 85 °C passe, le cône sain à froid passe : seule la combinaison usure + froid craque.' });
panne('B', 'La 3ème saute en décélération', 'img/pb_jump.jpeg', null,
  '« Quand je lève le pied en 3ème, surtout en descente, le levier ressort tout seul. »',
  'Dents de crabotage usées en dépouille + jeu axial : sous couple inversé, le baladeur est repoussé vers le neutre.',
  'Dépouille du baladeur 3/4 : 0,2° pour 3° neuf et 1° de limite. Jeu axial 0,55 mm pour 0,30 mm maxi.',
  { retenir: 'À retenir : la dépouille des crabots « tire » le baladeur dans l\'engagement sous couple moteur. Usée, elle fait l\'inverse en frein moteur.',
    script: 'Cas B. En accélération la 3ème tient. En frein moteur, le baladeur oscille puis ressort : la vitesse saute. Les pièces fautives : baladeur 3/4 et pignon fou de 3ème, plus le jeu axial du moyeu.' });
panne('C', 'Bruit au point mort, il disparaît en débrayant', 'img/hero_rot.jpeg', null,
  '« Au ralenti, au point mort, j\'entends un sifflement. Dès que j\'appuie sur la pédale, il disparaît. »',
  'Roulement d\'arbre primaire usé : au point mort pédale relâchée, seul l\'arbre primaire tourne.',
  'Jeu radial du roulement avant : 0,12 mm pour 0,02 mm neuf et 0,05 mm de limite.',
  { retenir: 'À retenir : ce qui disparaît quand on débraye est lié à l\'arbre primaire. Remède : roulement + spi neufs, jeu axial réglé.',
    script: 'Cas C. Activer « Surligner ce qui tourne » : en jaune, seul le primaire et ses pignons tournent. Pédale enfoncée, tout s\'arrête et le bruit disparaît. Le roulement avant est la pièce désignée.' });

/* ================================================================ 22b. BOÎTE AUTOMATIQUE : L'ÉLÉMENT COMMUN */
{
  const s = newSlide('DIAG', '3 · Diagnostiquer', { k: 'ripple' });
  heading(s, 'BOÎTE AUTOMATIQUE · 3 NOUVEAUX CAS', 'Trouver l\'élément commun aux rapports en panne');
  pic(s, 'img/ui_bva_scan.png', 0.6, 1.6, 3.9, 4.9, { effect: 'fly', delay: 200, alt: 'Essai des rapports, cas A : 3, 5 et AR patinent' });
  pic(s, 'img/ui_bva_scanB.png', 4.75, 1.6, 3.9, 4.9, { effect: 'fly', delay: 450, alt: 'Essai des rapports, cas B : 1 et AR sans vitesse' });
  const C3 = [['A', 'Emballement en 3ème, 5ème et AR', 'Rapports touchés : 3 = A+B, 5 = B+E, AR = B+D. Élément commun : l\'embrayage B (disques usés).'],
    ['B', 'Pas de 1ère ni de marche arrière', '1 = A+D, AR = B+D. Élément commun : le frein D. Commande et pression de ligne OK : fuite au piston.'],
    ['C', 'Broutement à vitesse stabilisée', 'Il n\'apparaît que pontage fermé : la garniture du pontage du convertisseur.']];
  C3.forEach(([l, t, d], i) => {
    const x = 8.95, y = 1.6 + i * 1.65;
    glass(s, x, y, 3.8, 1.5, { effect: 'fly', delay: 700 + i * 350 });
    dot(s, x + 0.15, y + 0.15, 0.45, AMBER, l, { delay: 800 + i * 350, fs: 16 });
    text(s, t, x + 0.7, y + 0.12, 2.95, 0.5, { fontSize: 13, bold: true, delay: 800 + i * 350 });
    text(s, d, x + 0.15, y + 0.68, 3.5, 0.8, { fontSize: 10.5, color: MUTED, delay: 800 + i * 350 });
  });
  glass(s, 0.6, 6.6, 12.15, 0.5, { effect: 'fade', delay: 1900, tint: 8 });
  text(s, 'L\'« Essai des rapports » simule chaque rapport : on lit lesquels patinent, on cherche l\'élément qu\'ils ont en commun.', 0.85, 6.6, 11.7, 0.5, { fontSize: 13, bold: true, color: AMBER, valign: 'middle', delay: 2000 });
  s.addNotes('Les trois cas de la boîte automatique. Cas A : l\'essai des rapports montre 3, 5 et marche arrière qui patinent, 1, 2, 4 et 6 sains ; le tableau d\'engagement désigne l\'embrayage B. Cas B : 1 et marche arrière sans entraînement ; le frein D est le seul élément commun ; la commande électrique et la pression de ligne sont bonnes, la pression n\'arrive pas au piston : fuite aux joints. Cas C : broutement à vitesse stabilisée, seulement pontage fermé : garniture du pontage glacée. Valeurs de mesure indicatives : toujours la documentation constructeur.');
}

/* ================================================================ 23. MESURER */
{
  const s = newSlide('DIAG', '3 · Diagnostiquer', { k: 'pan' });
  heading(s, 'DIAGNOSTIQUER', 'Mesurer, comparer, décider');
  s.addChart(pres.charts.BAR, [{ name: 'Jeu anneau / cône (mm)', labels: ['Valeur neuve', 'Limite d\'usure', 'Mesuré'], values: [1.2, 0.5, 0.3] }], {
    x: 0.6, y: 1.6, w: 6.4, h: 4.6, barDir: 'col', chartColors: [HEX.green, HEX.amber, HEX.red], showTitle: true, title: 'Jeu anneau / cône de 2ème (mm)', titleColor: HEX.light, titleFontSize: 14, titleFontFace: '+mn-lt',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: HEX.light, dataLabelFontSize: 14, dataLabelFontFace: '+mn-lt', dataLabelFormatCode: '0.0',
    catAxisLabelColor: HEX.muted, catAxisLabelFontSize: 12, catAxisLabelFontFace: '+mn-lt', valAxisLabelColor: HEX.muted, valAxisLabelFontSize: 11, valAxisLabelFontFace: '+mn-lt',
    valGridLine: { color: '2A3A4A', size: 0.5 }, catGridLine: { style: 'none' }, showLegend: false, barGapWidthPct: 50, invertedColors: [HEX.green, HEX.amber, HEX.red], objectName: fx(s, 'wipe', 200),
  });
  const R = [['Plus petit que la limite = usé', 'Pour un jeu qui doit rester grand (cône), mesuré < limite : on remplace.'], ['Plus grand que la limite = usé', 'Pour un jeu qui ne doit pas grandir (jeu axial), mesuré > limite : on remplace.'], ['Le carnet de mesures', 'Chaque mesure est notée : on élimine, on désigne.']];
  R.forEach(([a, b], i) => {
    const y = 1.65 + i * 1.5;
    glass(s, 7.4, y, 5.35, 1.35, { effect: 'fly', delay: 500 + i * 300 });
    dot(s, 7.6, y + 0.4, 0.5, i === 2 ? CYAN : AMBER, i + 1, { delay: 600 + i * 300, fs: 16 });
    text(s, a, 8.3, y + 0.15, 4.35, 0.45, { fontSize: 16, bold: true, delay: 600 + i * 300 });
    text(s, b, 8.3, y + 0.6, 4.35, 0.7, { fontSize: 13, color: MUTED, delay: 600 + i * 300 });
  });
  s.addNotes('La mesure est le juge de paix. Dans l\'outil, chaque pièce suspecte se contrôle d\'un clic : jauge verte, orange ou rouge, et verdict. Valeurs indicatives : toujours se référer à la documentation constructeur.');
}

/* ================================================================ 24. RÉPARATION */
{
  const s = newSlide('DIAG', '3 · Diagnostiquer', { k: 'pan' });
  heading(s, 'DIAGNOSTIQUER', 'De la panne à la réparation');
  const st = ['Sécuriser et vidanger', 'Déposer et ouvrir la boîte', 'Métrologie des pièces', 'Contrôles associés', 'Remplacer le kit', 'Remontage : sens et calage', 'Couples de serrage', 'Huile GL-4 et essai'];
  st.forEach((t, i) => {
    const x = 0.6 + (i % 2) * 3.85, y = 1.65 + Math.floor(i / 2) * 1.2;
    glass(s, x, y, 3.65, 1.0, { effect: 'fly', delay: 150 + i * 160 });
    dot(s, x + 0.2, y + 0.25, 0.5, i === 7 ? GREEN : CYAN, i + 1, { delay: 250 + i * 160, fs: 15 });
    text(s, t, x + 0.9, y, 2.65, 1.0, { fontSize: 15, bold: true, valign: 'middle', delay: 250 + i * 160 });
  });
  pic(s, 'img/ui_diag6.png', 8.45, 1.5, 2.25, 4.6, { effect: 'zoom', delay: 900, alt: 'Étape réparer : à retenir et protocole' });
  glass(s, 10.9, 1.5, 1.85, 4.6, { effect: 'fade', delay: 1100, tint: 10 });
  icon(s, 'FaOilCan', 'cyan', 11.2, 1.8, 0.6, { effect: 'fade', delay: 1200 });
  text(s, 'GL-4 ≠ GL-5', 10.95, 2.6, 1.75, 0.4, { fontSize: 14, bold: true, color: AMBER, align: 'center', delay: 1250 });
  text(s, 'Les additifs de la GL-5 attaquent le laiton des anneaux de synchro.', 11.0, 3.1, 1.65, 2.8, { fontSize: 12, color: MUTED, align: 'center', delay: 1300 });
  s.addNotes('Le protocole de réparation, avec les valeurs de métrologie en jauge. Insister sur la précaution huile : GL-4 pour boîte à synchros laiton, jamais GL-5. Valeurs de couple indicatives.');
}

/* ================================================================ 25. SECTION METTRE EN ŒUVRE */
{
  const s = newSlide('SECTION', '4 · Mettre en œuvre', { k: 'vortex' });
  s.addText('CHAPITRE 04', { placeholder: 'tag' });
  s.addText('Mettre en œuvre', { placeholder: 'title' });
  s.addText('Pour l\'enseignant : niveaux, séance type, partage', { placeholder: 'body' });
  pic(s, 'img/hero_oil.jpeg', 9.0, 1.4, 3.8, 4.5, { effect: 'zoom', delay: 300, alt: 'Lubrification en bleu dans l\'arbre secondaire creux' });
  s.addNotes('Chapitre 4. Comment l\'utiliser concrètement, du Bac Pro au CQP.');
}

/* ================================================================ 26. PARCOURS PAR NIVEAU */
{
  const s = newSlide('CONTENT', '4 · Mettre en œuvre', { k: 'pan' });
  heading(s, 'METTRE EN ŒUVRE', 'Un même outil, trois niveaux d\'exigence');
  const H = ['Niveau', 'Objectif', 'Dans l\'outil', 'Productions'].map((t) => ({ text: t, options: { bold: true, color: C.text1, fill: { color: CYAN }, fontSize: 14, valign: 'middle' } }));
  const rows = [
    ['Bac Pro', 'Nommer les pièces, suivre le couple, passer les rapports', 'Chemin du couple, fiche pièce, vue éclatée', 'Schéma annoté, légende des couleurs'],
    ['BTS MV', 'Calculer les rapports, expliquer la synchro, diagnostiquer', 'Rapports, loupe synchro, démarche en 6 étapes', 'Calcul N roues, compte rendu de diagnostic'],
    ['CQP', 'Décider d\'une réparation, chiffrer, argumenter', 'Mesures, protocole, indice niveau 3', 'Ordre de réparation chiffré, conseil client'],
  ].map((r, i) => r.map((t, j) => ({ text: t, options: { color: LIGHT, fill: { color: PANEL, transparency: i % 2 ? 10 : 30 }, fontSize: 14, valign: 'middle', bold: j === 0 } })));
  s.addTable([H, ...rows], { x: 0.6, y: 1.7, w: 12.1, colW: [1.4, 3.7, 3.6, 3.4], rowH: [0.55, 1.1, 1.1, 1.1], border: { type: 'solid', pt: 0.5, color: '2A3A4A' }, objectName: fx(s, 'fade', 200) });
  glass(s, 0.6, 5.95, 12.1, 0.85, { effect: 'fly', delay: 1200, tint: 8 });
  icon(s, 'FaGraduationCap', 'orange', 0.85, 6.12, 0.5, { effect: 'fade', delay: 1300 });
  text(s, 'Même vocabulaire, même outil : l\'élève progresse en changeant d\'onglet, pas d\'application.', 1.6, 5.95, 11.0, 0.85, { fontSize: 16, bold: true, valign: 'middle', delay: 1300 });
  s.addNotes('Une proposition de progression. À adapter aux référentiels et au niveau réel de la classe.');
}

/* ================================================================ 27. SÉANCE TYPE */
{
  const s = newSlide('CONTENT', '4 · Mettre en œuvre', { k: 'conveyor' });
  heading(s, 'METTRE EN ŒUVRE', 'Une séance type de 90 minutes');
  const seg = [['10 min', 'Découvrir', 'Chemin du couple, rapports', 10, 'cyan'], ['25 min', 'Décortiquer', 'Synchro, fiches, éclaté', 25, 'orange'], ['40 min', 'Diagnostiquer', 'Un cas A, B ou C', 40, 'cyan'], ['15 min', 'Bilan', '« À retenir » + fiche', 15, 'orange']];
  let x = 0.6; const total = 12.1, gap = 0.12, avail = total - gap * 3;
  seg.forEach(([d, t, sub, m, c], i) => {
    const w = 2.0 + (m / 90) * (avail - 8.0);
    glass(s, x, 1.9, w, 2.6, { effect: 'wipe', delay: 200 + i * 350 });
    text(s, d, x + 0.15, 2.05, w - 0.3, 0.6, { fontSize: m < 20 ? 20 : 30, bold: true, color: c === 'orange' ? ORANGE : CYAN, fontFace: 'Arial', delay: 400 + i * 350 });
    text(s, t, x + 0.15, 2.8, w - 0.3, 0.5, { fontSize: m < 20 ? 14 : 18, bold: true, delay: 400 + i * 350 });
    text(s, sub, x + 0.15, 3.35, w - 0.3, 1.0, { fontSize: 12, color: MUTED, delay: 400 + i * 350 });
    x += w + gap;
  });
  const tips = [['FaUsers', 'En binôme', 'Un élève pilote, l\'autre lit l\'ordre de réparation.'], ['FaFlag', 'Évaluer', 'Carnet de mesures et pièce désignée comme traces.'], ['FaClock', 'Rythme', 'Utiliser les indices comme filet de sécurité.']];
  tips.forEach(([ic, a, b], i) => {
    const xx = 0.6 + i * 4.1;
    glass(s, xx, 4.85, 3.95, 1.9, { effect: 'fly', delay: 1700 + i * 250 });
    icon(s, ic, 'cyan', xx + 0.25, 5.05, 0.5, { effect: 'fade', delay: 1800 + i * 250 });
    text(s, a, xx + 0.95, 5.05, 2.8, 0.5, { fontSize: 17, bold: true, valign: 'middle', delay: 1800 + i * 250 });
    text(s, b, xx + 0.25, 5.75, 3.5, 0.9, { fontSize: 14, color: MUTED, delay: 1800 + i * 250 });
  });
  s.addNotes('Proposition de séance de 90 minutes, durées indicatives. Les traces à évaluer : le carnet de mesures, la pièce désignée, l\'hypothèse retenue.');
}

/* ================================================================ 28. PARTAGE */
{
  const s = newSlide('CONTENT', '4 · Mettre en œuvre', { k: 'pan' });
  heading(s, 'METTRE EN ŒUVRE', 'Un simple lien, clair ou sombre');
  pic(s, 'img/ui_light.jpeg', 0.6, 1.6, 7.6, 4.28, { effect: 'zoom', delay: 150, alt: 'Interface en mode clair' });
  const F = [['FaLink', 'Un lien à partager', 'Aucune installation : le navigateur suffit.'], ['FaSun', 'Mode clair ou sombre', 'Au choix, mémorisé.'], ['FaRocket', 'Visite guidée', '4 écrans à la première ouverture.'], ['FaDesktop', 'Ordinateur récent', 'Carte graphique conseillée pour la coupe.']];
  F.forEach(([ic, a, b], i) => {
    const y = 1.6 + i * 1.12;
    glass(s, 8.55, y, 4.2, 1.0, { effect: 'fly', delay: 400 + i * 250 });
    icon(s, ic, i % 2 ? 'orange' : 'cyan', 8.75, y + 0.25, 0.5, { effect: 'fade', delay: 500 + i * 250 });
    text(s, [{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { color: MUTED, fontSize: 12 } }], 9.45, y + 0.08, 3.2, 0.9, { fontSize: 15, valign: 'middle', delay: 500 + i * 250 });
  });
  glass(s, 0.6, 6.15, 12.15, 0.7, { effect: 'fade', delay: 1700, tint: 8 });
  text(s, 'Simulateur : fichier unique transmilab3d.html (double-clic, hors ligne) · lien Vercel possible', 0.85, 6.15, 11.7, 0.7, { fontSize: 16, bold: true, color: AMBER, valign: 'middle', delay: 1800 });
  s.addNotes('Le site est statique : aucun serveur, aucun compte, aucune donnée collectée. Le simulateur se lance en double-cliquant sur transmilab3d.html (un seul fichier, sans Internet) ; il peut aussi être publié sur un lien partageable.');
}

/* ================================================================ 29. CONCLUSION */
{
  const s = newSlide('TITLE_L', 'Conclusion', { k: 'ripple' });
  s.addText('EN RÉSUMÉ', { placeholder: 'tag' });
  s.addText('Voir, comprendre, décider', { placeholder: 'title' });
  s.addText('Du moteur aux roues, de la pièce à la panne : un seul outil, pour tous les niveaux', { placeholder: 'body' });
  pic(s, 'img/hero_box2.jpeg', 7.0, 1.2, 5.9, 3.32, { effect: 'zoom', delay: 300, alt: 'Boîte de vitesses 3D' });
  const M = [['FaRoute', 'Découvrir', 'le chemin du couple'], ['FaLayerGroup', 'Décortiquer', 'pièce par pièce'], ['FaStethoscope', 'Diagnostiquer', 'une étape à la fois']];
  M.forEach(([ic, a, b], i) => {
    const x = 0.8 + i * 4.05, y = 5.6;
    glass(s, x, y, 3.75, 1.05, { effect: 'fly', delay: 900 + i * 250 });
    icon(s, ic, i === 1 ? 'orange' : 'cyan', x + 0.22, y + 0.28, 0.5, { effect: 'fade', delay: 1000 + i * 250 });
    text(s, [{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { color: MUTED, fontSize: 13 } }], x + 0.9, y + 0.1, 2.75, 0.85, { fontSize: 17, valign: 'middle', delay: 1000 + i * 250 });
  });
  s.addNotes('Conclusion en trois mots : voir, comprendre, décider. Prochaines étapes possibles : cas pratiques pour le double embrayage, d\'autres architectures de boîte automatique, grille d\'évaluation, déploiement du lien pour les collègues.');
}

/* ---------------------------------------------------------------- écriture */
(async () => {
  await pres.writeFile({ fileName: 'raw.pptx' });
  await applyTheme('raw.pptx', THEME);
  fs.writeFileSync('plan.json', JSON.stringify(PLAN, null, 1));
  console.log('slides:', pres.slides.length);
})();
