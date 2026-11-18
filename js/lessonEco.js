/* ============================================================================
 * lessonEco.js — Parcours guidé « du moteur arrêté au 6ᵉ rapport » (ZF EcoLife 2)
 *
 * Principe pédagogique : UNE idée par étape, dans l'ordre réel de la chaîne :
 *   moteur → pompe → pression PHD → convertisseur → calculateur + électrovannes → pistons
 *   → éléments (A, B, D, E, F) → trains épicycloïdaux → sortie → roues (+ pontage, ralentisseur, arrêt).
 * Chaque étape : un texte simple, 2-3 « regardez », des boutons d'action qui PILOTENT la simulation,
 * des mesures en direct, une mini-question, et un encart « pour aller plus loin » (ingénieurs).
 * ========================================================================== */
import { IRATIO } from './ecoSim.js';

const f1 = (x) => (+x || 0).toFixed(1).replace('.', ',');
const f0 = (x) => Math.round(+x || 0);
const f2 = (x) => (+x || 0).toFixed(2).replace('.', ',');
const CV = ['cv-impulseur', 'cv-turbine', 'cv-reacteur', 'cv-roue-libre'];
const PUMP = ['pompe-corps', 'pompe-rotor-int', 'pompe-rotor-ext', 'cv-impulseur'];
const TRAINS = ['p1-soleil', 'p2-soleil', 'p3-soleil', 'p1-porte', 'p2-porte', 'p3-porte', 'p1-couronne', 'p2-couronne', 'p3-couronne'];

/** Mesures affichées en direct : [libellé, valeur, unité, état optionnel ('ok'|'bad'|'')] */
const L = {
  base: (s) => [['Moteur', f0(s.engineRpm), 'tr/min'], ['PHD', f1(s.p.phd), 'bar'], ['Rapport', s.gear === 'R' ? 'AR' : s.gear, '']],
  conv: (s) => [['Moteur', f0(s.engineRpm), 'tr/min'], ['Turbine', f0(s.n.turb), 'tr/min'], ['SR', f2(s.SR), '']],
  el: (s) => [['A', f1(s.p.pa || 0), 'bar', s.lv.a > 0.95 ? 'ok' : ''], ['F', f1(s.p.pf || 0), 'bar', s.lv.f > 0.95 ? 'ok' : ''], ['Pistons A / F', `${f0(s.lv.a * 100)} / ${f0(s.lv.f * 100)}`, '%']],
  trains: (s) => [['Arbre soleil S1/S2', f0(s.n.ss), 'tr/min'], ['Tambour X1 (frein F)', f0(s.n.x1), 'tr/min', Math.abs(s.n.x1) < 5 ? 'ok' : ''], ['Sortie', f0(s.n.out), 'tr/min'], ['Vitesse', f0(s.v), 'km/h']],
  shift: (s) => [['A', `${f0(s.lv.a * 100)} %`, ''], ['F', `${f0(s.lv.f * 100)} %`, ''], ['E', `${f0(s.lv.e * 100)} %`, ''], ['Rapport', s.gear, '']],
  ratio: (s) => [['Rapport', s.gear === 'R' ? 'AR' : s.gear, ''], ['i', typeof s.gear === 'number' ? f1(IRATIO[s.gear]).replace('.', ',') : '—', ''], ['Sortie', f0(s.n.out), 'tr/min'], ['Vitesse', f0(s.v), 'km/h']],
  wk: (s) => [['Pontage WK', f0(s.lu * 100), '%', s.lu > 0.9 ? 'ok' : ''], ['SR', f2(s.SR), ''], ['Moteur', f0(s.engineRpm), 'tr/min'], ['Turbine', f0(s.n.turb), 'tr/min']],
  ret: (s) => [['Couple ralentisseur', f0(s.ret.torque), 'N·m'], ['Remplissage', f0(s.ret.fill * 100), '%'], ['Huile', f0(s.oilT), '°C', s.oilT > 130 ? 'bad' : ''], ['Vitesse', f0(s.v), 'km/h']],
  stop: (s) => [['Moteur', f0(s.engineRpm), 'tr/min'], ['PHD', f1(s.p.phd), 'bar', s.p.phd >= 1.5 ? 'ok' : 'bad'], ['Accumulateur', f0(s.accu * 100), '%']],
};

export const LESSON = [
  /* 0 ----------------------------------------------------------------------------------------------- */
  {
    t: 'La boîte en un coup d\'œil', view: 'global', tab: 'tools', focus: [],
    setup: ({ sim, ui }) => { sim.forceGear('N', 620); ui.setEngine(false); },
    text: 'Cette boîte automatique <b>ZF EcoLife 2</b> équipe des bus et cars. Elle fait trois choses : <b>relier</b> le moteur aux roues sans caler, <b>démultiplier</b> le couple (6 rapports + marche arrière) et <b>se commander toute seule</b> grâce à l\'huile sous pression.',
    look: ['À gauche : le <b>convertisseur</b> (relie le moteur sans embrayage à pédale).', 'Au centre : <b>3 trains épicycloïdaux</b> + <b>2 embrayages</b> (A, B) + <b>3 freins</b> (D, E, F).', 'En bas : le <b>bloc hydraulique</b> (cerveau de la boîte).'],
    live: L.base,
    quiz: { q: 'Qu\'est-ce qui relie le moteur à la boîte ?', opts: ['Un embrayage à disque et pédale', 'Un convertisseur de couple', 'Un différentiel'], ok: 1, why: 'Le convertisseur transmet le couple par l\'huile : pas de pédale, pas de calage à l\'arrêt.' },
  },
  /* 1 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Moteur arrêté : tout est à zéro', view: 'hydro', tab: 'hydro', focus: [],
    setup: ({ sim, ui }) => { sim.forceGear('N', 620); ui.setEngine(false); },
    text: 'Sans moteur, la <b>pompe</b> est arrêtée, donc il n\'y a <b>aucune pression</b>. Sans pression, aucun piston ne peut serrer un embrayage ou un frein : la boîte est « morte ».',
    look: ['Sur le schéma hydraulique : tous les blocs sont <b>gris</b> (au repos).', 'Les jauges PHD, A8, D6… retombent vers <b>0 bar</b>.'],
    live: L.base,
    deep: 'À l\'arrêt, l\'accumulateur et le clapet anti-retour (29) maintiennent PHD quelques secondes — étudié à la dernière étape (AIS).',
  },
  /* 2 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Démarrage : la pompe se met à tourner', view: 'conv', tab: 'hydro', focus: PUMP,
    setup: ({ sim, ui }) => { sim.forceGear('N', 620); ui.setEngine(true); },
    text: 'Le moteur démarre et tourne au ralenti (≈ 620 tr/min). La <b>pompe à huile</b> est entraînée <b>directement par le moyeu du convertisseur</b> : dès que le moteur tourne, la pompe tourne.',
    look: ['3D : la pompe (pignon intérieur + rotor extérieur) en surbrillance.', 'Schéma : l\'huile monte du carter, passe la crépine puis la pompe.'],
    live: L.base,
    quiz: { q: 'Qui entraîne la pompe ?', opts: ['La sortie de boîte (roues)', 'Le moyeu du convertisseur (moteur)', 'Un moteur électrique'], ok: 1, why: 'Donc pas de moteur = pas de pression = pas de remorquage rapide sans précaution.' },
  },
  /* 3 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Réguler la pression : PHD ≈ 10-12 bar', view: 'hydro', tab: 'hydro', focus: ['bloc-hydraulique', 'ev-rhd', 'soupape-6'],
    setup: ({ sim, ui }) => { sim.forceGear('N', 700); ui.setEngine(true); },
    acts: [{ label: 'Moteur au ralenti', run: ({ sim }) => { sim.engineRpm = 650; } }, { label: 'Moteur à 1 800 tr/min', run: ({ sim }) => { sim.engineRpm = 1800; } }],
    text: 'Plus le moteur tourne vite, plus la pompe débite — mais la boîte ne veut qu\'<b>une pression stable</b>. La <b>soupape principale (6)</b>, pilotée par l\'électrovanne <b>Y13 (RHD)</b>, laisse passer le surplus vers le convertisseur et la lubrification.',
    look: ['Changez le régime : la jauge <b>PHD reste dans 10 – 12 bar</b>.', 'Sur le schéma : le trait orange = pression de commande (PHD).'],
    live: L.base,
    quiz: { q: 'Le régime moteur double. La pression PHD…', opts: ['double aussi', 'reste ≈ constante (régulée)', 'tombe à zéro'], ok: 1, why: 'La régulation garantit la même force de serrage sur les embrayages quel que soit le régime.' },
    deep: 'Mesure atelier : PHD à la prise dédiée (10 – 12 bar au ralenti N, huile 50-65 °C). Un PHD bas peut venir de la pompe, du filtre (Δp > 0,8 bar) ou du régulateur Y13.',
  },
  /* 4 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Le convertisseur : on transmet par l\'huile', view: 'conv', tab: 'tools', focus: CV,
    setup: ({ sim, ui }) => { sim.forceGear('N', 900); ui.setEngine(true); },
    acts: [{ label: 'Moteur à 1 800 tr/min', run: ({ sim }) => { sim.engineRpm = 1800; } }, { label: 'Ralenti', run: ({ sim }) => { sim.engineRpm = 650; } }],
    text: 'Imaginez deux ventilateurs face à face : le premier (la <b>roue-pompe</b>, côté moteur) souffle l\'huile sur le second (la <b>turbine</b>, côté boîte). Entre les deux, le <b>réacteur</b> redirige l\'huile et <b>multiplie le couple</b> au démarrage.',
    look: ['Roue-pompe (impulseur) = moteur ; turbine = entrée de boîte.', 'En N, la turbine suit le moteur de près : <b>SR ≈ 0,98</b>.', 'Le réacteur est bloqué par une <b>roue libre</b> : il se libère quand la turbine rattrape le moteur.'],
    live: L.conv,
    quiz: { q: 'SR = 0,98 signifie…', opts: ['la turbine tourne à 98 % du régime moteur', 'la pression est de 98 bar', 'le pontage est fermé à 98 %'], ok: 0, why: 'SR (speed ratio) = régime turbine ÷ régime moteur. SR = 1 → plus de patinage (pontage fermé).' },
    deep: 'Couple turbine = k × couple pompe ; k ≈ 2 au calage (SR = 0, réacteur bloqué) et k = 1 au point d\'accouplement (réacteur libre). Le rendement vaut k × SR.',
  },
  /* 5 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Point mort N : aucun élément fermé', view: 'global', tab: 'tools', focus: [],
    setup: ({ sim, ui }) => { sim.forceGear('N', 900); ui.setEngine(true); ui.setBrake(false); },
    text: 'Le moteur tourne, le convertisseur entraîne la turbine… et pourtant les roues ne tournent pas. Pourquoi ? Parce qu\'<b>aucun des 5 éléments (A, B, D, E, F) n\'est serré</b> : la sortie des trains est libre.',
    look: ['<b>Tableau d\'engagement</b> (panneau de gauche) : aucune pastille en N.', 'Bandeau du haut : « Aucun élément fermé → sortie libre → roues ».'],
    live: (s) => [['Moteur', f0(s.engineRpm), 'tr/min'], ['Éléments serrés', ['a', 'b', 'd', 'e', 'f'].filter((k) => s.lv[k] > 0.5).length, '/ 5'], ['Vitesse', f0(s.v), 'km/h']],
    quiz: { q: 'En N le moteur tourne. Pourquoi les roues ne tournent pas ?', opts: ['Le convertisseur est bloqué', 'Aucun élément A/B/D/E/F n\'est serré', 'La pompe est arrêtée'], ok: 1, why: 'Chaque rapport = exactement 2 éléments serrés ; en N il y en a zéro.' },
  },
  /* 6 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Sélection D : le calculateur commande 2 éléments', view: 'hydro', tab: 'hydro', ts: 0.5, focus: ['ev-a', 'ev-f', 'piston-a', 'piston-f1', 'piston-f2', 'emb-a', 'frein-f'],
    setup: ({ sim, ui }) => { sim.forceGear('N', 900); ui.setEngine(true); ui.setBrake(true); },
    acts: [{ label: '▶ Engager D (pied sur le frein)', run: ({ ui }) => ui.requestGear('D') }, { label: '↺ Revenir en N', run: ({ ui }) => ui.requestGear('N') }],
    text: 'Vous passez en <b>D</b>. Le calculateur (TCU) alimente deux <b>électrovannes</b> : <b>Y11</b> (embrayage A) et <b>Y16</b> (frein F). Chaque électrovanne règle une pression qui pousse un <b>piston</b> : d\'abord il se <b>remplit</b>, puis il <b>serre</b> les disques.',
    look: ['Schéma : les blocs <b>A</b> et <b>F</b> passent au vert (commandés) puis orange (sous pression).', 'Bandeau 3D : les 3 phases — remplissage, transfert de couple, fin.', 'La vitesse est ralentie (×0,5) pour bien suivre.'],
    live: L.el,
    quiz: { q: 'Pourquoi faut-il 2 éléments pour un rapport ?', opts: ['Un transmet l\'entrée, l\'autre immobilise un train (réaction)', 'Pour doubler la pression', 'Pour refroidir l\'huile'], ok: 0, why: 'Un train épicycloïdal ne démultiplie que si un de ses 3 éléments est entraîné, un autre est retenu, le 3ᵉ est la sortie.' },
  },
  /* 7 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Calage : pied sur le frein, le convertisseur patine', view: 'conv', tab: 'tools', focus: CV,
    setup: ({ sim, ui }) => { sim.forceGear(1, 1200); ui.setEngine(true); ui.setBrake(true); },
    acts: [{ label: 'Accélérer à 2 000 tr/min', run: ({ sim }) => { sim.engineRpm = 2000; } }, { label: 'Ralenti', run: ({ sim }) => { sim.engineRpm = 700; } }],
    text: 'Rapport engagé, véhicule retenu par le frein : la turbine est <b>bloquée à 0 tr/min</b> et le moteur tourne quand même. Le convertisseur <b>patine</b> : toute la puissance se transforme en <b>chaleur dans l\'huile</b>. C\'est le « test de calage » : à ne pas tenir plus de ~10 s.',
    look: ['<b>SR ≈ 0</b> : la turbine est arrêtée.', 'La température d\'huile <b>monte</b> (accélérez pour l\'accentuer).'],
    live: (s) => [['Moteur', f0(s.engineRpm), 'tr/min'], ['Turbine', f0(s.n.turb), 'tr/min'], ['SR', f2(s.SR), ''], ['Huile', f0(s.oilT), '°C', s.oilT > 130 ? 'bad' : '']],
    deep: 'Au calage le régime moteur est comparé à une valeur constructeur : trop bas = moteur ou convertisseur faible (réacteur qui patine) ; trop haut = élément qui glisse.',
  },
  /* 8 ----------------------------------------------------------------------------------------------- */
  {
    t: 'On démarre en 1ʳᵉ : A + F', view: 'trains', tab: 'tools', focus: ['arbre-soleil', 'emb-a', 'frein-f', 'tambour-x1', 'p1-soleil', 'p2-soleil'],
    setup: ({ sim, ui }) => { sim.forceGear(1, 1800); ui.setEngine(true); ui.setBrake(false); sim.load = 'accel'; },
    text: 'Pied levé sur le frein : le véhicule démarre. <b>A</b> relie la turbine à l\'<b>arbre de soleil</b> commun des trains 1 et 2. <b>F</b> immobilise le <b>tambour X1</b>. Résultat : les trains se comportent en <b>réducteur</b> — la sortie tourne <b>3,36 fois moins vite</b> que la turbine avec <b>3,36 fois plus de couple</b>.',
    look: ['Panneau de gauche : la ligne <b>1</b> du tableau (pastilles A et F).', 'Mesures : arbre soleil rapide, <b>tambour X1 = 0</b>, sortie lente.'],
    live: L.trains,
    quiz: { q: 'En 1ʳᵉ, i = 3,36. La sortie tourne…', opts: ['3,36 fois plus vite que l\'entrée', '3,36 fois moins vite que l\'entrée', 'à la même vitesse'], ok: 1, why: 'Démultiplication : vitesse ÷ 3,36, couple × 3,36 — idéal pour décoller un véhicule de plusieurs tonnes.' },
  },
  /* 9 ----------------------------------------------------------------------------------------------- */
  {
    t: 'Trains épicycloïdaux : qui tourne, qui est bloqué ?', view: 'trains', tab: 'tools', focus: TRAINS,
    setup: ({ sim, ui }) => { sim.forceGear(1, 1800); ui.setEngine(true); ui.setBrake(false); sim.load = 'accel'; },
    text: 'Un train épicycloïdal a <b>3 pièces</b> : un <b>soleil</b> au centre, des <b>satellites</b> sur un <b>porte-satellites</b>, et une <b>couronne</b> dentée à l\'intérieur. Selon celle qu\'on <b>entraîne</b>, celle qu\'on <b>retient</b> et celle qui est la <b>sortie</b>, on obtient un rapport différent. Ici trois trains se partagent le travail.',
    look: ['Vue en coupe : les <b>satellites</b> tournent sur eux-mêmes ET autour du soleil.', 'Mesures : le tambour X1 est à <b>0</b> (retenu par F), l\'arbre soleil tourne vite.'],
    live: L.trains,
    deep: 'Équation de Willis, pour chaque train : n_soleil + ρ·n_couronne = (1 + ρ)·n_porte, avec ρ = Zcouronne / Zsoleil. Trains 1 et 2 : Zs = 66, Zr = 156 (ρ ≈ 2,36) ; train 3 : Zs = 74, Zr = 122 (ρ ≈ 1,65). Ces nombres de dents sont déduits des rapports du tableau ZF (écart < 0,1 %) : ils ne proviennent pas du schéma constructeur.',
  },
  /* 10 ---------------------------------------------------------------------------------------------- */
  {
    t: 'Passage 1 → 2 sans à-coup', view: 'hydro', tab: 'hydro', ts: 0.4, focus: ['frein-f', 'frein-e', 'piston-f1', 'piston-e', 'ev-f', 'ev-e'],
    setup: ({ sim, ui }) => { sim.forceGear(1, 2200); ui.setEngine(true); ui.setBrake(false); sim.load = 'accel'; sim.mode = 'manual'; },
    acts: [{ label: '▶ Passer en 2ᵉ', run: ({ ui }) => ui.requestGear(2) }, { label: '↺ Recommencer en 1ʳᵉ', run: ({ sim }) => { sim.forceGear(1, 2200); sim.mode = 'manual'; } }],
    text: 'De 1ʳᵉ (A+F) à 2ᵉ (A+E) : <b>A reste serré</b>, on <b>relâche F</b> pendant qu\'on <b>serre E</b>. C\'est un passage <b>« embrayage sur embrayage »</b> : les deux se chevauchent un instant, donc pas de trou de couple ni d\'à-coup. La scène est ralentie (×0,4).',
    look: ['Schéma : F descend (vidange) pendant que E monte (remplissage).', 'Le régime moteur <b>chute</b> en fin de changement : c\'est la phase d\'inertie.'],
    live: L.shift,
    quiz: { q: 'Au passage 1 → 2, que font les éléments ?', opts: ['A et F se relâchent, E se serre', 'A reste, F se relâche, E se serre', 'Tout se relâche puis tout se serre'], ok: 1, why: 'Un seul élément change de côté : c\'est ce qui rend le passage doux.' },
    deep: 'Séquence ZF : (1) remplissage rapide du piston de E, (2) transfert de couple : p(F) baisse pendant que p(E) monte, (3) phase d\'inertie : le régime passe de la valeur 1ʳᵉ à la valeur 2ᵉ, (4) pleine pression sur E. Un E trop mou → patinage → huile brûlée, symptôme « passage long / à-coup ».',
  },
  /* 11 ---------------------------------------------------------------------------------------------- */
  {
    t: 'Rapports 2, 3 et 4 : on monte', view: 'emb', tab: 'tools', focus: ['emb-a', 'emb-b', 'frein-d', 'frein-e'],
    setup: ({ sim, ui }) => { sim.forceGear(2, 1800); ui.setEngine(true); ui.setBrake(false); },
    acts: [2, 3, 4].map((g) => ({ label: `Rapport ${g}`, run: ({ sim }) => { sim.forceGear(g, 1800); } })),
    text: 'Chaque rapport = <b>2 éléments</b> : <b>2ᵉ = A + E</b>, <b>3ᵉ = A + D</b>, <b>4ᵉ = A + B</b>. En 4ᵉ, A et B serrés <b>bloquent</b> les trains : l\'entrée = la sortie, c\'est la <b>prise directe</b> (i = 1,00).',
    look: ['Cliquez 2 / 3 / 4 : regardez les pastilles du tableau et les disques qui s\'allument.', '4ᵉ : <b>i = 1,00</b>, tout le train tourne d\'un bloc.'],
    live: L.ratio,
    quiz: { q: 'En 4ᵉ (A + B), le rapport est…', opts: ['1,98', '1,00 (prise directe)', '0,70'], ok: 1, why: 'A et B relient l\'entrée à deux éléments du train : il se bloque, tout tourne ensemble.' },
    note: 'Ici le rapport est affiché directement (sans la phase de passage) pour isoler les éléments serrés.',
  },
  /* 12 ---------------------------------------------------------------------------------------------- */
  {
    t: 'Rapports 5 et 6 : surmultipliées', view: 'trains', tab: 'tools', focus: ['emb-b', 'frein-d', 'frein-e'],
    setup: ({ sim, ui }) => { sim.forceGear(5, 1500); ui.setEngine(true); ui.setBrake(false); },
    acts: [5, 6].map((g) => ({ label: `Rapport ${g}`, run: ({ sim }) => { sim.forceGear(g, 1500); } })),
    text: '<b>5ᵉ = B + D</b> (i = 0,70) et <b>6ᵉ = B + E</b> (i = 0,59). La sortie tourne <b>plus vite</b> que l\'entrée : le moteur peut <b>baisser son régime</b> sur route — moins de bruit et de consommation. Le couple à la sortie est plus faible : c\'est le prix à payer.',
    look: ['A est <b>relâché</b> ; B est serré dans les deux rapports.', 'Comparez la vitesse de sortie en 5ᵉ et 6ᵉ pour le même régime moteur.'],
    live: L.ratio,
  },
  /* 13 ---------------------------------------------------------------------------------------------- */
  {
    t: 'Le pontage WK : fin du patinage', view: 'conv', tab: 'hydro', focus: ['cv-wk', 'cv-turbine', 'ev-wk'],
    setup: ({ sim, ui }) => { sim.forceGear(6, 1500); ui.setEngine(true); ui.setBrake(false); sim.load = 'stab'; document.querySelectorAll('input[name=load]').forEach((r) => { r.checked = r.value === 'stab'; }); },
    acts: [{ label: 'Pontage Auto', run: ({ sim }) => { sim.wkMode = 'auto'; const e = document.getElementById('wkMode'); if (e) e.value = 'auto'; } }, { label: 'Forcer OUVERT', run: ({ sim }) => { sim.wkMode = 'open'; const e = document.getElementById('wkMode'); if (e) e.value = 'open'; } }],
    text: 'À vitesse stabilisée, le convertisseur n\'a plus besoin de multiplier le couple : il ne ferait que <b>chauffer</b>. Le calculateur commande l\'électrovanne <b>WK</b> : un piston plaque un disque et <b>relie mécaniquement le moteur à la turbine</b>. Plus de glissement : <b>SR = 1,00</b>.',
    look: ['Attendez quelques secondes : <b>WK monte à 100 %</b>.', 'Cliquez « Forcer OUVERT » : SR redescend sous 1, le convertisseur patine à nouveau.'],
    live: L.wk,
    quiz: { q: 'Pontage fermé : le convertisseur…', opts: ['multiplie le couple ×2', 'transmet directement, sans patinage', 'est vidé de son huile'], ok: 1, why: 'On économise du carburant et on évite d\'échauffer l\'huile. Il s\'ouvre en cas de rétrogradage ou de démarrage.' },
  },
  /* 14 ---------------------------------------------------------------------------------------------- */
  {
    t: 'Le ralentisseur : freiner sans les freins', view: 'ret', tab: 'hydro', focus: ['ret-rotor', 'ret-stator', 'ret-huile', 'ev-ret'],
    setup: ({ sim, ui }) => { sim.forceGear(6, 1500); ui.setEngine(true); ui.setBrake(false); sim.load = 'decel'; document.querySelectorAll('input[name=load]').forEach((r) => { r.checked = r.value === 'decel'; }); },
    acts: [{ label: '▶ Ralentisseur 100 %', run: ({ ui }) => ui.setRetarder(100) }, { label: 'Relâcher', run: ({ ui }) => ui.setRetarder(0) }],
    text: 'Dans une longue descente, les freins de service chaufferaient. Le <b>ralentisseur</b> est une petite turbine-frein : un <b>rotor</b> (lié à l\'arbre) brasse de l\'huile contre un <b>stator</b> fixe. Plus on le remplit d\'huile (pression sur l\'électrovanne), plus il <b>freine</b>. Toute l\'énergie part en chaleur dans l\'huile, refroidie par l\'échangeur.',
    look: ['Schéma : le bloc ralentisseur se remplit (%) ; le couple apparaît.', 'Surveillez la <b>température d\'huile</b> : l\'échangeur la limite.'],
    live: L.ret,
    deep: 'Le couple de freinage varie à peu près avec le carré du régime (C ∝ n²) : très efficace à haute vitesse, faible à basse vitesse — d\'où l\'usage combiné avec les freins de service.',
  },
  /* 15 ---------------------------------------------------------------------------------------------- */
  {
    t: 'Arrêt moteur : la pression tient (AIS)', view: 'hydro', tab: 'hydro', focus: ['accu-12', 'clapet-29'],
    setup: ({ sim, ui }) => { sim.forceGear('N', 700); ui.setEngine(true); ui.setRetarder(0); sim.load = 'accel'; document.querySelectorAll('input[name=load]').forEach((r) => { r.checked = r.value === 'accel'; }); },
    acts: [{ label: '■ Couper le moteur', run: ({ ui }) => ui.setEngine(false) }, { label: '▶ Redémarrer', run: ({ ui }) => ui.setEngine(true) }],
    text: 'Au feu rouge, le moteur peut s\'arrêter (<b>Stop &amp; Start / AIS</b>). Sans pompe, la pression devrait tomber… mais un <b>accumulateur</b> et un <b>clapet anti-retour</b> la retiennent : au redémarrage la boîte est <b>immédiatement prête</b>, sans à-coup.',
    look: ['Coupez le moteur : PHD <b>baisse lentement</b>.', 'Règle atelier ZF : <b>≥ 1,5 bar encore présent après 20 s</b>, sinon accumulateur ou clapet à contrôler.'],
    live: L.stop,
    quiz: { q: 'PHD < 1,5 bar 20 s après l\'arrêt moteur. Suspect n°1 ?', opts: ['L\'accumulateur ou le clapet anti-retour', 'Le convertisseur', 'Le rapport de 6ᵉ'], ok: 0, why: 'Ces deux pièces assurent le maintien en pression à l\'arrêt.' },
  },
  /* 16 ---------------------------------------------------------------------------------------------- */
  {
    t: 'Bilan : la chaîne complète', view: 'global', tab: 'tools', focus: [],
    setup: ({ sim, ui }) => { sim.forceGear(1, 1800); ui.setEngine(true); ui.setBrake(false); sim.load = 'accel'; },
    text: 'Vous avez suivi toute la chaîne, <b>dans l\'ordre</b> : <b>moteur → pompe → PHD régulée → calculateur + électrovannes → pistons → éléments A·B·D·E·F → trains épicycloïdaux → sortie → roues</b>, avec en plus le convertisseur (pontage WK), le ralentisseur et le maintien de pression à l\'arrêt.',
    look: ['<b>Panne ?</b> Remontez la chaîne : commande (Y), pression (bar), élément (patinage), résultat (rapport).', 'Chaque rapport en panne partage <b>un élément commun</b> : c\'est lui le suspect.'],
    live: L.base,
    final: true,
    note: 'Limites du modèle : géométrie simplifiée ; liaisons internes des trains reconstruites à partir des rapports ZF (écart < 0,1 %), à valider avec le schéma constructeur.',
  },
];

/** Scénario de la DÉMONSTRATION AUTOMATIQUE : actions chronométrées (t en ms après l'arrivée sur l'étape), par numéro d'étape (0 = première).
 *  Les étapes sans action restent affichées le temps de lire (ou d'entendre) le texte. */
export const AUTO = {
  3: [{ t: 3000, run: ({ sim }) => { sim.engineRpm = 1800; } }, { t: 9000, run: ({ sim }) => { sim.engineRpm = 650; } }],
  4: [{ t: 3500, run: ({ sim }) => { sim.engineRpm = 1800; } }, { t: 10000, run: ({ sim }) => { sim.engineRpm = 650; } }],
  6: [{ t: 2500, run: ({ ui }) => ui.requestGear('D') }],
  7: [{ t: 3000, run: ({ sim }) => { sim.engineRpm = 2000; } }],
  10: [{ t: 5000, run: ({ ui }) => ui.requestGear(2) }],
  11: [{ t: 1000, run: ({ sim }) => { sim.forceGear(2, 1800); } }, { t: 7000, run: ({ sim }) => { sim.forceGear(3, 1800); } }, { t: 13000, run: ({ sim }) => { sim.forceGear(4, 1800); } }],
  12: [{ t: 1000, run: ({ sim }) => { sim.forceGear(5, 1500); } }, { t: 8000, run: ({ sim }) => { sim.forceGear(6, 1500); } }],
  13: [{ t: 11000, run: ({ sim }) => { sim.wkMode = 'open'; const e = document.getElementById('wkMode'); if (e) e.value = 'open'; } }, { t: 19000, run: ({ sim }) => { sim.wkMode = 'auto'; const e = document.getElementById('wkMode'); if (e) e.value = 'auto'; } }],
  14: [{ t: 2500, run: ({ ui }) => ui.setRetarder(100) }, { t: 15000, run: ({ ui }) => ui.setRetarder(0) }],
  15: [{ t: 3000, run: ({ ui }) => ui.setEngine(false) }, { t: 26000, run: ({ ui }) => ui.setEngine(true) }],
};
