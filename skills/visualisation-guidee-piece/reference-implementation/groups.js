/* ============================================================================
 * groups.js — Groupes fonctionnels (« décortiquer ») : isoler un ensemble de pièces et l'écarter
 *  ids  : pièces propres au groupe (liste de l'arbre)
 *  ctx  : pièces de contexte rendues avec le groupe lors de l'isolement (ex. pignons fous d'un synchro)
 *  spread : décalages (à 100 %) pour écarter les pièces ; sinon écartement radial automatique
 * ========================================================================== */
import * as THREE from 'three';

const SYNC_NAME = { 12: '1/2', 34: '3/4', 5: '5ème' };

function syncGroup(key) {
  const gears = key === 12 ? [1, 2] : key === 34 ? [3, 4] : [5];
  const ids = [`moyeu-${key}`, `baladeur-${key}`, `clavettes-${key}`, `ressorts-${key}`, `circlip-moyeu-${key}`, `cale-${key}`, ...gears.map((g) => `bague-${g}`)];
  const ctx = [...gears.flatMap((g) => [`s-${g}`, `aiguilles-${g}`]), `fourchette-${key}`, `axe-fourchette-${key}`, 'arbre-secondaire'];
  const spread = {
    [`baladeur-${key}`]: [0, 6, 0], [`fourchette-${key}`]: [0, 6, 0],
    [`clavettes-${key}`]: [0, 0, 5], [`ressorts-${key}`]: [0, 0, -5],
    [`circlip-moyeu-${key}`]: [2.6, 0, 0], [`cale-${key}`]: [-2.6, 0, 0],
  };
  gears.forEach((g, i) => {
    const sgn = key === 5 ? -1 : i === 0 ? -1 : 1;
    spread[`s-${g}`] = [sgn * 6.2, 0, 0]; spread[`aiguilles-${g}`] = [sgn * 6.2, 0, 0]; spread[`bague-${g}`] = [sgn * 3.3, 0, 0];
  });
  return { id: `sync${key}`, icon: '⚙', name: `Synchroniseur ${SYNC_NAME[key]}`, ids, ctx, spread,
    hint: 'Écartez : anneaux laiton, pignons fous, baladeur (haut), clavettes (avant), ressorts (arrière).' };
}

export function groupsBVM() {
  return [
    { id: 'embrayage', icon: '⛭', name: 'Embrayage', ids: ['volant-moteur', 'disque-embrayage', 'mecanisme-embrayage'], ctx: ['arbre-primaire'] },
    { id: 'primaire', icon: '━', name: 'Arbre primaire & pignons fixes', ids: ['arbre-primaire', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'rlt-prim-av', 'rlt-prim-ar', 'spi-primaire', 'circlip-prim-ar', 'cale-prim-ar'], ctx: [] },
    { id: 'secondaire', icon: '━', name: 'Arbre secondaire creux', ids: ['arbre-secondaire', 'pignon-attaque', 'rlt-sec-av', 'rlt-sec-ar', 'circlip-sec-ar', 'cale-sec-ar'], ctx: [] },
    { id: 'fous', icon: '◎', name: 'Pignons fous & cages à aiguilles', ids: [1, 2, 3, 4, 5].flatMap((k) => [`s-${k}`, `aiguilles-${k}`]), ctx: ['arbre-secondaire'] },
    syncGroup(12), syncGroup(34), syncGroup(5),
    { id: 'commande', icon: '✥', name: 'Commande : fourchettes & axes', ids: ['fourchette-12', 'fourchette-34', 'fourchette-5', 'fourchette-ar', 'axe-fourchette-12', 'axe-fourchette-34', 'axe-fourchette-5'], ctx: ['baladeur-12', 'baladeur-34', 'baladeur-5'] },
    { id: 'ar', icon: '⟲', name: 'Marche arrière', ids: ['p-AR', 'pignon-ar-baladeur', 'arbre-renvoi'], ctx: ['baladeur-12'] },
    { id: 'pont', icon: '◐', name: 'Pont & différentiel', ids: ['couronne', 'boitier-diff', 'satellites', 'axe-satellites', 'planetaire-g', 'planetaire-d', 'arbre-transm-g', 'arbre-transm-d', 'rlt-diff-g', 'rlt-diff-d', 'spi-diff-g', 'spi-diff-d'], ctx: ['pignon-attaque'] },
    { id: 'carters', icon: '▢', name: 'Carters & étanchéité', ids: ['carter-emb', 'cloison', 'carter-meca', 'couvercle-ar', 'joint-ar'], ctx: [] },
  ];
}

/** MODULE 2 — ZF EcoLife 2 : groupes fonctionnels (isoler / écarter) */
export function groupsEco() {
  const sat = (k, n) => Array.from({ length: n }, (_, i) => `${k}-sat-${i + 1}`);
  const REG = ['ev-rhd', 'ev-ret', 'ev-wk', 'ev-a', 'ev-b', 'ev-d', 'ev-e', 'ev-f'];
  return [
    { id: 'conv', icon: '◎', name: 'Convertisseur + pontage WK', ids: ['cv-flasque', 'cv-capot', 'cv-amortisseur', 'cv-wk', 'cv-turbine', 'cv-reacteur', 'cv-roue-libre', 'cv-impulseur'], ctx: ['arbre-entree', 'arbre-reacteur'],
      spread: { 'cv-flasque': [-9, 0, 0], 'cv-capot': [-6, 0, 0], 'cv-wk': [-4, 0, 0], 'cv-amortisseur': [-2, 0, 0], 'cv-turbine': [-0.5, 0, 0], 'cv-reacteur': [0, 0, 8], 'cv-roue-libre': [0, 0, -8], 'cv-impulseur': [4, 0, 0] },
      hint: 'Écartez : plateau, capot, pontage WK, amortisseur, turbine, réacteur (+ roue libre), roue-pompe.' },
    { id: 'pompe', icon: '◐', name: 'Pompe hydraulique (2) + filtres', ids: ['pompe-corps', 'pompe-rotor-int', 'pompe-rotor-ext', 'filtre-1', 'filtre-3'], ctx: ['cv-impulseur'] },
    { id: 'ret', icon: '⏱', name: 'Ralentisseur primaire (3)', ids: ['ret-rotor', 'ret-stator', 'ret-huile', 'accu-12'], ctx: ['arbre-entree'],
      spread: { 'ret-rotor': [-6, 0, 0], 'ret-stator': [6, 0, 0], 'ret-huile': [0, 0, 0] } },
    { id: 'p3', icon: '☼', name: 'Train 3 (entrée) + frein D', ids: ['p3-soleil', ...sat('p3', 4), 'p3-porte', 'p3-couronne', 'frein-d', 'piston-d1', 'piston-d2'], ctx: ['arbre-entree'] },
    { id: 'emb', icon: '⛭', name: 'Embrayages A et B (emboîtés)', ids: ['emb-a', 'emb-b', 'piston-a', 'piston-b'], ctx: ['arbre-entree', 'arbre-soleil', 'p1-porte'],
      spread: { 'emb-a': [0, 0, -7], 'piston-a': [0, 0, -7], 'emb-b': [0, 0, 7], 'piston-b': [0, 0, 7] } },
    { id: 'p1', icon: '☼', name: 'Train 1 + frein E', ids: ['p1-soleil', ...sat('p1', 3), 'p1-porte', 'p1-couronne', 'frein-e', 'piston-e', 'tambour-x2'], ctx: ['arbre-soleil'] },
    { id: 'p2', icon: '✺', name: 'Train 2 (sortie) + frein F', ids: ['p2-soleil', ...sat('p2', 3), 'p2-porte', 'p2-couronne', 'frein-f', 'piston-f1', 'piston-f2', 'tambour-x1'], ctx: ['arbre-soleil', 'arbre-sortie'] },
    { id: 'hydro', icon: '💧', name: 'Bloc hydraulique et régulateurs (8)', ids: ['bloc-hydraulique', ...REG, 'connecteur-x4', 'carter-huile'], ctx: [] },
    { id: 'valves', icon: '⚙', name: 'Soupapes, valves et clapets', ids: ['soupape-6', 'soupape-7', 'soupape-8', 'soupape-9', 'valve-14', 'valve-kuv-13', 'valve-21', 'valve-22', 'bypass-filtre-4', 'bypass-31', 'clapet-29', 'charge-pompe-24'], ctx: ['bloc-hydraulique'] },
    { id: 'mesure', icon: '🔬', name: 'Points de mesure et capteurs', ids: ['prise-phd', 'prise-pvf', 'prise-a8', 'prise-d6', 'prise-d8', 'capteur-b12', 'capteur-b11', 'sonde-carter', 'sonde-ret'], ctx: ['bloc-hydraulique'] },
    { id: 'therm', icon: '🌡', name: 'Refroidissement', ids: ['echangeur'], ctx: ['valve-14', 'bypass-31'] },
    { id: 'arbres', icon: '━', name: 'Arbres', ids: ['arbre-entree', 'arbre-reacteur', 'arbre-soleil', 'arbre-sortie'], ctx: [] },
    { id: 'carter', icon: '▢', name: 'Carters', ids: ['carter-eco', 'carter-convertisseur'], ctx: [] },
  ];
}

export function groupsBVA() {
  const E = ['a', 'b', 'c', 'd', 'e'];
  return [
    { id: 'conv', icon: '◎', name: 'Convertisseur de couple', ids: ['cv-flexplate', 'cv-capot', 'cv-impulseur', 'cv-turbine', 'cv-stator', 'cv-roue-libre', 'cv-pontage', 'cv-amortisseur'], ctx: ['arbre-turbine', 'arbre-stator'],
      spread: { 'cv-flexplate': [-8, 0, 0], 'cv-capot': [-5, 0, 0], 'cv-amortisseur': [-4, 0, 0], 'cv-pontage': [-3, 0, 0], 'cv-turbine': [-1, 0, 0], 'cv-stator': [0, 0, 7], 'cv-roue-libre': [0, 0, -7], 'cv-impulseur': [4, 0, 0] },
      hint: 'Écartez : capot, pontage, amortisseur, turbine, stator (+ roue libre) et impulseur.' },
    { id: 'pompe', icon: '◐', name: 'Pompe à huile', ids: ['pompe-corps', 'pompe-rotor-int', 'pompe-rotor-ext'], ctx: ['cv-impulseur'] },
    { id: 'ps', icon: '☼', name: 'Train réducteur (simple)', ids: ['ps-soleil', 'ps-sat-1', 'ps-sat-2', 'ps-sat-3', 'ps-porte', 'ps-couronne'], ctx: ['arbre-turbine'] },
    { id: 'rv', icon: '✺', name: 'Train Ravigneaux', ids: ['rv-s3', 'rv-s4', 'rv-long-1', 'rv-long-2', 'rv-long-3', 'rv-court-1', 'rv-court-2', 'rv-court-3', 'rv-porte', 'rv-couronne'], ctx: ['arbre-s3', 'arbre-s4', 'arbre-turbine'] },
    { id: 'emb', icon: '⛭', name: 'Embrayages A · B · E', ids: ['emb-a', 'emb-b', 'emb-e', 'piston-a', 'piston-b', 'piston-e'], ctx: ['ps-porte', 'arbre-s3', 'arbre-s4', 'arbre-turbine', 'rv-porte'] },
    { id: 'freins', icon: '■', name: 'Freins C · D', ids: ['frein-c', 'frein-d', 'piston-c', 'piston-d'], ctx: ['arbre-s3', 'rv-porte'] },
    { id: 'hydro', icon: '💧', name: 'Hydraulique (bloc, électrovannes)', ids: ['bloc-hydraulique', ...E.map((k) => `ev-${k}`), 'ev-pontage', 'ev-pression', ...E.map((k) => `conduite-${k}`), 'conduite-pontage', 'filtre', 'carter-huile'], ctx: [] },
    { id: 'arbres', icon: '━', name: 'Arbres concentriques', ids: ['arbre-turbine', 'arbre-stator', 'arbre-s3', 'arbre-s4'], ctx: [] },
    { id: 'sortie', icon: '⚙', name: 'Sortie & parking', ids: ['arbre-sortie', 'roue-parking', 'cliquet'], ctx: ['rv-couronne'] },
    { id: 'carter', icon: '▢', name: 'Carters', ids: ['carter-bva', 'carter-convertisseur'], ctx: [] },
  ];
}

export function groupsDCT() {
  const N = [1, 2, 3, 4, 5, 6];
  return [
    { id: 'dbl', icon: '⛭', name: 'Double embrayage', ids: ['dct-volant', 'dct-tambour', 'dct-c1-pack', 'dct-c2-pack', 'dct-moyeu-c1', 'dct-moyeu-c2'], ctx: [] },
    { id: 'arbres', icon: '◎', name: 'Arbres concentriques & pignons menants', ids: ['arbre-prim-int', 'arbre-prim-ext', ...N.map((k) => `dct-p${k}`)], ctx: [] },
    { id: 'sortie', icon: '⚙', name: 'Arbre de sortie & synchros', ids: ['arbre-sortie-dct', 'dct-pignon-sortie', ...N.map((k) => `dct-s${k}`), ...['s24', 's6', 's13', 's5'].flatMap((k) => [`dct-h-${k}`, `dct-b-${k}`])], ctx: [] },
    { id: 'carter', icon: '▢', name: 'Carter', ids: ['carter-dct'], ctx: [] },
  ];
}

/** Applique l'écartement t (0..1) du groupe : décalage explicite ou radial automatique */
export function applySpread(module, group, t) {
  for (const p of Object.values(module.parts)) p.local.set(0, 0, 0);
  if (group && t > 0) {
    const ids = group.ids.filter((id) => module.parts[id]);
    if (group.spread) {
      for (const [id, v] of Object.entries(group.spread)) if (module.parts[id]) module.parts[id].local.set(v[0] * t, v[1] * t, v[2] * t);
    } else {
      const c = new THREE.Vector3();
      ids.forEach((id) => c.add(module.parts[id].base));
      c.multiplyScalar(1 / Math.max(1, ids.length));
      for (const id of ids) {
        const d = module.parts[id].base.clone().sub(c);
        if (d.lengthSq() < 1e-3) d.set(0, 1, 0);
        d.normalize();
        module.parts[id].local.copy(d.multiplyScalar(7 * t));
      }
    }
  }
  for (const p of Object.values(module.parts)) p.apply();
}
