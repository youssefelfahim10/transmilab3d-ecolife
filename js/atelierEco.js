/* ============================================================================
 * atelierEco.js — Cas pratiques de diagnostic du MODULE 2 (ZF EcoLife 2) + mesures « en direct » aux points de mesure ZF
 *  Les cas reprennent la logique du manuel ZF (chapitre « Raisonner face à un symptôme ») :
 *    plusieurs engagements perturbés → alimentation commune · un élément commun aux rapports en défaut → chaîne de cet élément ·
 *    délai de ralentisseur → accumulateur · échauffement au ralentisseur → refroidissement · glissement moteur/turbine → WK, A8.
 *  Séparer COMMANDE, PRESSION et RÉSULTAT : une bobine correcte ne prouve ni le tiroir, ni la pression, ni le couple.
 *  Valeurs de contrôle ZF (huile 50-65 °C, N, WK ouvert) ; autres valeurs = ordres de grandeur pédagogiques.
 * ========================================================================== */
import { ntcR, EL_INFO } from './ecoSim.js';

const OIL = 'Huile ZF selon la liste TE-ML 20 en vigueur. Niveau déterminant : jauge à 90 °C dans le carter, sélecteur N (15 à 20 s à 1 200-1 500 tr/min puis ≥ 2 min au ralenti) ; ne pas confondre avec le contrôle hydraulique à 50-65 °C.';
const CTL = (label, neuf, limite, mesure, unit, sens, note) => ({ label, neuf, limite, mesure, unit, sens, note });
const LIVE = { live: true };

export const SCENARIOS_ECO = [
  /* ====================================================================== A */
  {
    id: 'A', title: 'La 2ème et la 6ème patinent', short: '2ème et 6ème perturbées',
    or: { client: '« La boîte passe mal ou patine en 2ème et en 6ème : le moteur monte sans que le bus accélère. La 1ère, la 3ème, la 4ème et la 5ème sont normales. »', vehicule: 'Autobus urbain, boîte automatique ZF EcoLife 6 AP xx20 B, 410 000 km.', conditions: 'D automatique · accélération · rapports 2 et 6 · huile chaude' },
    setup: { oilT: 80, rpm: 1500, gear: 2, load: 'accel', hintTools: '2ème maintenue, accélération. Regardez le patinage et le tableau d\'engagement.' },
    faults: { leak: { e: 0.95 } }, alertIds: ['piston-e'],
    culprits: { main: ['piston-e'], accept: ['piston-e'], related: ['frein-e', 'ev-e', 'tambour-x2', 'bloc-hydraulique', 'p1-couronne', 'prise-phd'] },
    related_msg: 'Cet organe appartient à la chaîne de E, mais commande électrique et PHD sont corrects : la pression n\'arrive pas à serrer le pack à cause de la fuite interne du PISTON de E.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : patinage en 2ème et en 6ème uniquement ; 1, 3, 4, 5 normaux ; aucun défaut majeur.\nQuestion à vous poser : quel élément est fermé à la fois en 2ème et en 6ème, et dans aucun des rapports sains ?' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Tableau d\'engagement : 2 = A + E ; 6 = B + E. E est le seul élément commun aux deux rapports en défaut (A est sain : 1, 3, 4 passent ; B est sain : 4 et 5 passent).\n« Essai des rapports » : seuls 2 et 6 patinent. Mesurez ensuite la chaîne de E : bobine Y15, pression PHD, pression au piston E.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : PISTON du frein E (joints de piston).\nExplication (manuel ZF) : E est commun aux rapports 2 et 6 ; cela justifie d\'étudier la chaîne de E mais ne prouve pas que l\'électrovanne 19 est défectueuse. Ici la bobine Y15 est à 12 Ω et PHD est normale ; la pression au piston de E n\'atteint pas la valeur de commande : fuite interne. F ≈ Δp × S : sans pression utile, le frein ne retient pas le tambour X2, le régime s\'emballe.\nPièces : joints de piston de E, disques si échauffés, huile + filtre.\nOrdre de grandeur (indicatif) : MO ≈ 8–12 h · joints ≈ 40–120 € HT · huile ≈ 100–180 € HT.' },
    ],
    protocole: [
      { t: 'Identifier et sauvegarder', d: 'Relever le type exact, le numéro de nomenclature et de série de la boîte et du calculateur. Lire et sauvegarder la mémoire de défauts AVANT effacement (ZF Testman).' },
      { t: 'Contrôle électrique de E (Y15)', d: 'Moteur et contact coupés, calculateur hors courant : 10 à 14 Ω à 20 °C entre VP1 (X4 broche 3) et commande (X4 broche 24). Mesuré ≈ 12 Ω : la bobine est conforme — cela ne prouve pas le serrage.', ctl: { label: 'Résistance de la bobine Y15', neuf: 12, limite: 14, mesure: 12.1, unit: 'Ω', sens: 'max' } },
      { t: 'Contrôle hydraulique : PHD', d: 'Huile 50-65 °C, N, WK ouvert : PHD de 8 à 12 bar à 620 tr/min. Mesuré ≈ 10 bar : l\'alimentation commune est correcte.', ctl: { label: 'PHD à 620 tr/min', neuf: 10, limite: 8, mesure: 10, unit: 'bar', sens: 'min' } },
      { t: 'Pression au piston de E', d: 'Commande de E établie : la pression doit approcher PHD. Mesuré ≈ 0,5 bar → fuite interne du piston.', ctl: { label: 'Pression au piston de E commandé', neuf: 10, limite: 8, mesure: 0.5, unit: 'bar', sens: 'min' } },
      { t: 'Ouvrir la boîte', d: 'Respecter les délais de dépressurisation (3 min moteur arrêté, huile chaude). Dépose du bloc hydraulique puis du frein E selon la procédure ZF.' },
      { t: 'Remplacer les joints du piston de E', d: 'Joints neufs huilés, lèvres côté pression ; contrôler disques (garniture neuve 1,9 mm / limite 1,5 mm, indicatif) et cannelures du carter.' },
      { t: 'Remontage', d: 'Billes et ressorts du bloc à leur place, serrage selon la gamme ZF ; adaptation / apprentissage avec l\'outil.' },
      { t: 'Remplissage, niveau, essai', d: OIL + ' Essai : 1→6 et 6→1, vérifier absence de patinage en 2ème et 6ème.' },
    ],
    demo: { label: '▶ Reproduire : accélérer en 2ème', action: 'ecoAccel' },
    observe: [
      { t: 'Lancer l\'« Essai des rapports » : quels rapports patinent ?', act: 'bvaScan' },
      { t: 'Ouvrir le tableau d\'engagement : cherchez l\'élément commun', act: 'bvaTable' },
      { t: 'Voir le schéma hydraulique : quelle branche mène à E ?', act: 'hydro' },
    ],
    hypotheses: [
      { t: 'Chaîne du frein E : fuite au piston', ok: true, why: 'Oui : E est le seul élément commun à 2 et 6 ; commande et PHD sont corrects, la pression n\'arrive pas au piston.' },
      { t: 'Pompe à huile usée', ok: false, why: 'Une PHD faible toucherait plusieurs rapports (surtout à chaud), pas seulement 2 et 6.' },
      { t: 'Embrayage A usé', ok: false, why: 'A est fermé en 1, 2, 3 et 4 : la 1ère, la 3ème et la 4ème passent normalement.' },
      { t: 'Convertisseur / pontage WK défaillant', ok: false, why: 'Un défaut de convertisseur ne dépend pas du rapport engagé.' },
      { t: 'Filtre à pression colmaté', ok: false, why: 'Il fait chuter PHD et perturbe plusieurs engagements ; ici PHD est normale.' },
    ],
    mesures: { 'piston-e': LIVE, 'ev-e': LIVE, 'prise-phd': LIVE, 'frein-e': CTL('Épaisseur d\'un disque garni de E', 1.9, 1.5, 1.7, 'mm', 'min'), 'emb-a': CTL('Épaisseur d\'un disque garni de A', 1.9, 1.5, 1.85, 'mm', 'min'), 'emb-b': CTL('Épaisseur d\'un disque garni de B', 1.9, 1.5, 1.8, 'mm', 'min'), 'prise-pvf': LIVE },
    retenir: 'Un élément commun aux rapports en défaut oriente vers la chaîne de cet élément. Séparer COMMANDE (bobine), PRESSION (piston) et RÉSULTAT (disques) : une résistance correcte ne prouve pas le serrage. Ici : fuite interne du piston de E.',
  },

  /* ====================================================================== B */
  {
    id: 'B', title: 'Plusieurs engagements perturbés, surtout à chaud', short: 'Alimentation commune',
    or: { client: '« Les passages sont mous ou durs, ça patine à fond de charge, surtout boîte chaude et régime élevé. Ça touche plusieurs rapports. »', vehicule: 'Autobus de ligne, ZF EcoLife 6 AP xx20 B, 520 000 km, dernière vidange il y a 3 ans.', conditions: 'Charge élevée · huile chaude · régime ≈ 1 500 tr/min' },
    setup: { oilT: 95, rpm: 1500, gear: 1, load: 'accel', hintTools: '1ère, accélération. Comparez PHD et PVF (schéma hydraulique).' },
    faults: { filterClog: 0.95 }, alertIds: ['filtre-3'],
    culprits: { main: ['filtre-3'], accept: ['filtre-3'], related: ['bypass-filtre-4', 'pompe-corps', 'filtre-1', 'soupape-6', 'ev-rhd', 'prise-pvf', 'prise-phd'] },
    related_msg: 'Cet organe participe à l\'alimentation commune, mais la mesure de PVF − PHD désigne le FILTRE À PRESSION (3) : c\'est lui qui retient la pression.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : plusieurs engagements perturbés, surtout à chaud et sous charge.\nQuestion : quelle fonction est commune à TOUS les éléments ? (manuel ZF : alimentation commune → niveau, aspiration 1, pompe 2, filtre 3, régulation 5/6).' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Schéma hydraulique : tout part de PHD. Placez la boîte en N à 620 tr/min et comparez PHD et PVF (prises 1 et 3 du schéma). ZF : Δp = PVF − PHD doit être < 0,8 bar à 620 tr/min, N, 50-65 °C.\nLe bypass 4 s\'ouvre quand Δp devient trop élevé.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : FILTRE À PRESSION (3).\nExplication : colmaté, il crée une perte de charge ; PVF reste correcte mais PHD chute (ici ≈ 6 bar à 620 tr/min pour 8 à 12 attendus). Capacité de couple ∝ pression − précharge : tous les éléments patinent sous forte demande. Le bypass 4 dérive de l\'huile vers le graissage sans résoudre la chute de PHD.\nRésultat : Δp ≈ 1,0 bar (> 0,8). Exemple ZF : PHD = 10 et PVF = 11 → 1 bar → non conforme (le résultat porte sur la différence).\nPièces : filtre à pression, joint, filtre d\'aspiration, huile.\nOrdre de grandeur (indicatif) : MO ≈ 4–6 h · filtres ≈ 60–150 € HT.' },
    ],
    protocole: [
      { t: 'Préparer', d: 'Huile 50-65 °C, boîte montée, frein de stationnement serré, sélecteur N, WK ouvert. Adaptateurs et protections ZF ; respecter les délais de dépressurisation.' },
      { t: 'Mesurer PHD et PVF à 620 tr/min', d: 'PHD attendue 8 à 12 bar ; mesuré ≈ 6 bar. PVF ≈ 7 bar.', ctl: { label: 'PHD à 620 tr/min', neuf: 10, limite: 8, mesure: 5.9, unit: 'bar', sens: 'min' } },
      { t: 'Calculer la perte de pression du filtre', d: 'Δp = PVF − PHD, limite ZF 0,8 bar à 620 tr/min. Mesuré ≈ 1,0 bar → hors tolérance.', ctl: { label: 'Δp du filtre à pression (PVF − PHD)', neuf: 0.3, limite: 0.8, mesure: 1.0, unit: 'bar', sens: 'max' } },
      { t: 'Contrôler l\'aspiration et la pompe', d: 'Niveau d\'huile et filtre d\'aspiration 1 : pas d\'aspiration d\'air ni de cavitation. La pompe n\'est pas en cause tant que PVF est correcte.' },
      { t: 'Ouvrir et remplacer', d: 'Après dépressurisation : filtre à pression 3 et son joint ; contrôle visuel du bypass 4.' },
      { t: 'Rechercher la cause du colmatage', d: 'Limaille, particules : contrôler les disques et la pompe pour ne pas recolmater.' },
      { t: 'Remplissage et niveau', d: OIL },
      { t: 'Essai', d: 'Reprise de la mesure PHD / PVF puis essai routier : passages francs, plus de patinage à chaud.' },
    ],
    demo: { label: '▶ Reproduire : 1ère, forte charge', action: 'ecoAccel' },
    observe: [
      { t: 'Voir le schéma hydraulique : PHD alimente tous les éléments', act: 'hydro' },
      { t: 'Lancer l\'« Essai des rapports » : plusieurs rapports sont touchés', act: 'bvaScan' },
      { t: 'Afficher les mesures avancées : PHD', act: 'tele' },
    ],
    hypotheses: [
      { t: 'Filtre à pression (3) colmaté', ok: true, why: 'Oui : Δp = PVF − PHD > 0,8 bar et PHD basse ; tous les éléments manquent de pression.' },
      { t: 'Piston d\'un seul élément qui fuit', ok: false, why: 'Il ne toucherait que les rapports de cet élément (voir le cas A).' },
      { t: 'Bobine d\'un régulateur coupée', ok: false, why: 'Elle donnerait un défaut et perturberait des rapports précis.' },
      { t: 'Pontage WK qui glisse', ok: false, why: 'Le glissement WK concerne l\'écart moteur/turbine à vitesse stabilisée, pas la fermeture des éléments.' },
      { t: 'Capteur de régime turbine B12', ok: false, why: 'Un capteur donne une information fausse mais ne fait pas chuter la pression hydraulique.' },
    ],
    mesures: { 'prise-pvf': LIVE, 'prise-phd': LIVE, 'filtre-1': CTL('Aspiration : dépression à la pompe', 0.1, 0.4, 0.15, 'bar', 'max'), 'pompe-corps': CTL('Jeu axial des rotors de pompe', 0.04, 0.08, 0.05, 'mm', 'max'), 'ev-rhd': LIVE, 'carter-huile': CTL('Limaille sur l\'aimant', 0, 50, 90, 'mg', 'max', 'Conséquence : particules qui colmatent le filtre.') },
    retenir: 'Plusieurs engagements perturbés = alimentation commune (niveau, aspiration 1, pompe 2, filtre 3, régulation 5/6). La différence PVF − PHD isole le filtre : elle doit rester < 0,8 bar à 620 tr/min.',
  },

  /* ====================================================================== C */
  {
    id: 'C', title: 'Le ralentisseur est lent à réagir', short: 'Délai de ralentisseur',
    or: { client: '« Quand j\'actionne le ralentisseur, il met plusieurs secondes à freiner ; ensuite l\'effet est correct. »', vehicule: 'Autobus de ligne en zone vallonnée, ZF EcoLife 6 AP xx20 B, 380 000 km.', conditions: 'Décélération · ralentisseur demandé · 4ème · 1 800 tr/min' },
    setup: { oilT: 85, rpm: 1800, gear: 4, load: 'decel', hintTools: '4ème en décélération. Demandez le ralentisseur et comparez le délai.' },
    faults: { accuBad: 1 }, alertIds: ['accu-12'],
    culprits: { main: ['accu-12'], accept: ['accu-12'], related: ['ev-ret', 'ret-huile', 'bloc-hydraulique', 'clapet-29', 'valve-kuv-13'] },
    related_msg: 'Cet organe intervient dans la commande du ralentisseur, mais le délai avec effet final correct désigne l\'ACCUMULATEUR (12) : il n\'accélère plus le remplissage.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : délai à l\'application du ralentisseur, effet final présent.\nQuestion : quelle pièce raccourcit le délai de remplissage sans changer l\'effet final ?' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Demandez le ralentisseur (curseur) et regardez « Ralentisseur N·m » : le couple monte lentement puis atteint la valeur normale. Au schéma : accumulateur 12 relié par R4 ; le diaphragme freine sa recharge.\nTest ZF de maintien de PHD à l\'arrêt (≥ 1,5 bar 20 s) : l\'accumulateur y participe.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : ACCUMULATEUR (12).\nExplication (ZF) : moteur en marche, il se charge par R4 pendant la traction ; à la demande, la valve 11 remplit le ralentisseur, R4 chute et le ressort restitue le volume stocké : réponse plus rapide. Hors service, le remplissage dépend du seul débit de pompe : délai, mais effet final identique.\nLe maintien de PHD à l\'arrêt peut aussi chuter (accumulateur, clapet 29 ou fuite interne : le résultat n\'indique pas à lui seul la pièce).\nPièces : accumulateur 12 (ressort, diaphragme, piston), joints.\nOrdre de grandeur (indicatif) : MO ≈ 3–5 h · pièces ≈ 80–200 € HT.' },
    ],
    protocole: [
      { t: 'Préparer', d: 'Sauvegarder les défauts ; relever la sonde de température du ralentisseur (CTN).' },
      { t: 'Contrôle électrique du régulateur 10 (Y19)', d: '10 à 14 Ω (VP1 X4 3 / commande X4 8) : conforme.', ctl: { label: 'Résistance de la bobine Y19', neuf: 12, limite: 14, mesure: 12.0, unit: 'Ω', sens: 'max' } },
      { t: 'Contrôler PHD', d: 'PHD correcte à 620 et 2 200 tr/min : pas d\'alimentation commune défaillante.', ctl: { label: 'PHD à 620 tr/min', neuf: 10, limite: 8, mesure: 9.9, unit: 'bar', sens: 'min' } },
      { t: 'Maintien de PHD après arrêt', d: '≥ 1,5 bar vingt secondes après le régime turbine nul. Mesuré ≈ 1,0 bar : maintien insuffisant (accumulateur ou clapet 29).', ctl: { label: 'PHD 20 s après arrêt', neuf: 3, limite: 1.5, mesure: 1.0, unit: 'bar', sens: 'min' } },
      { t: 'Ouvrir et contrôler l\'accumulateur 12', d: 'Après dépressurisation : ressort, diaphragme, piston ; recharge par R4.' },
      { t: 'Remplacer', d: 'Accumulateur (ou ses joints) ; vérifier le clapet 29.' },
      { t: 'Remplissage et niveau', d: OIL },
      { t: 'Essai', d: 'Ralentisseur demandé à 1 800 tr/min : délai normal, effet identique.' },
    ],
    demo: { label: '▶ Reproduire : demander le ralentisseur', action: 'ecoRet' },
    observe: [
      { t: 'Afficher les mesures avancées : couple du ralentisseur', act: 'tele' },
      { t: 'Voir le schéma hydraulique : accumulateur 12 et liaison R4', act: 'hydro' },
      { t: 'Voir le ralentisseur en 3D (huile qui se remplit)', act: 'ecoRetView' },
    ],
    hypotheses: [
      { t: 'Accumulateur 12 hors service', ok: true, why: 'Oui : le délai disparaît quand le ressort restitue son volume ; effet final identique.' },
      { t: 'Ralentisseur sans huile (niveau très bas)', ok: false, why: 'Un manque d\'huile réduit ou supprime l\'EFFET, pas seulement le délai.' },
      { t: 'Bobine du régulateur 10 coupée', ok: false, why: 'Le ralentisseur ne réagirait pas du tout ; ici l\'effet final est présent.' },
      { t: 'Filtre à pression colmaté', ok: false, why: 'PHD serait basse et les rapports perturbés ; ce n\'est pas le cas ici.' },
      { t: 'Échangeur colmaté', ok: false, why: 'Il provoque un échauffement du ralentisseur, pas un délai à l\'application.' },
    ],
    mesures: { 'accu-12': CTL('Pression de précharge de l\'accumulateur', 3, 1.5, 0.8, 'bar', 'min', 'Ressort affaissé / diaphragme fatigué.'), 'ev-ret': LIVE, 'prise-phd': LIVE, 'ret-huile': CTL('Niveau d\'huile (jauge à 90 °C)', 100, 90, 98, '%', 'min'), 'clapet-29': CTL('Étanchéité du clapet anti-retour', 100, 80, 95, '%', 'min'), 'sonde-ret': LIVE },
    retenir: 'Délai à l\'application mais effet final présent : accumulateur 12 / liaison R4 / pilotage 10-11. Effet réduit ou absent : plutôt niveau d\'huile ou régulation. Le ralentisseur transforme l\'énergie en chaleur ; il ne maintient pas à l\'arrêt.',
  },

  /* ====================================================================== D */
  {
    id: 'D', title: 'Ça chauffe, surtout au ralentisseur', short: 'Échauffement au ralentisseur',
    or: { client: '« En descente, avec le ralentisseur, la température de boîte monte très vite et le ralentisseur est limité. En traction normale, ça va. »', vehicule: 'Autobus de montagne, ZF EcoLife 6 AP xx20 B, 450 000 km.', conditions: 'Descente prolongée · ralentisseur 100 % · 4ème · 1 800 tr/min' },
    setup: { oilT: 85, rpm: 1800, gear: 4, load: 'decel', hintTools: 'Ralentisseur à 100 % en descente : surveillez les températures.' },
    faults: { exchClog: 0.85 }, alertIds: ['echangeur'],
    culprits: { main: ['echangeur'], accept: ['echangeur'], related: ['bypass-31', 'valve-14', 'valve-kuv-13', 'soupape-8', 'sonde-ret', 'prise-d6', 'prise-d8'] },
    related_msg: 'Cet organe participe au chemin thermique, mais la perte de charge et la température pointent l\'ÉCHANGEUR (26 / 27) : le bypass 31 laisse passer de l\'huile non refroidie.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : échauffement rapide au ralentisseur ; en traction, normal.\nQuestion : quels deux chemins d\'huile existent en ralentissement ? (ZF : boîte mécanique et ralentisseur).' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Ralentisseur à 100 % : la valve 14 commute (KUV 13) ; le débit du ralentisseur passe par l\'échangeur 27. Comparez D6 (aval échangeur ralentisseur) et D8 (graissage) aux valeurs ZF et surveillez la sonde du ralentisseur.\nUne pression de graissage présente n\'est pas la preuve que toute l\'huile traverse l\'échangeur.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : ÉCHANGEUR (26 / 27), côté huile colmaté.\nExplication : P = C × ω ; 1 000 N·m à 2 000 tr/min ≈ 209 kW doivent être évacués. Si l\'échangeur est restreint, D6 et D8 baissent, le bypass 31 s\'ouvre (D7 − D8 trop élevée) et une partie du débit rejoint D8 sans être refroidie : la température monte vite. D8 correcte n\'exclut pas le refroidissement ; il faut aussi examiner le débit d\'huile, l\'échangeur et le circuit de liquide.\nPièces : échangeur (huile / liquide), purge du circuit de refroidissement.\nOrdre de grandeur (indicatif) : MO ≈ 4–7 h · échangeur ≈ 350–900 € HT.' },
    ],
    protocole: [
      { t: 'Préparer', d: 'Contrôler d\'abord le niveau d\'huile (jauge à 90 °C) : un niveau bas réduit l\'effet du ralentisseur ; un niveau haut provoque surchauffe et rejet par le reniflard.', ctl: { label: 'Niveau d\'huile (jauge à 90 °C)', neuf: 100, limite: 90, mesure: 98, unit: '%', sens: 'min' } },
      { t: 'Mesurer D6 et D8', d: 'À 2 200 tr/min : D6 de 3 à 5 bar, D8 de 1,6 à 3 bar. Mesuré D6 ≈ 2,1 et D8 ≈ 1,2 : trop bas.', ctl: { label: 'D6 à 2 200 tr/min', neuf: 4, limite: 3, mesure: 2.1, unit: 'bar', sens: 'min' } },
      { t: 'Contrôler les sondes', d: 'Comparer la résistance de la sonde du ralentisseur à sa courbe (80 °C ≈ 11,84 kΩ ; 100 °C ≈ 6,283 kΩ).' },
      { t: 'Perte de charge de l\'échangeur', d: 'Côté huile : neuf ≈ 0,6 bar, limite 1,5 bar. Mesuré ≈ 2,6 bar → colmaté.', ctl: { label: 'Perte de charge côté huile de l\'échangeur', neuf: 0.6, limite: 1.5, mesure: 2.6, unit: 'bar', sens: 'max' } },
      { t: 'Circuit de liquide', d: 'Débit et purge du côté liquide de refroidissement : le côté liquide dépend de l\'installation du véhicule.' },
      { t: 'Remplacer l\'échangeur', d: 'Joints neufs ; rincer le circuit d\'huile.' },
      { t: 'Remplissage et niveau', d: OIL },
      { t: 'Essai', d: 'Ralentisseur prolongé : températures stabilisées, D6 / D8 conformes.' },
    ],
    demo: { label: '▶ Reproduire : ralentisseur 100 % en descente', action: 'ecoRet' },
    observe: [
      { t: 'Afficher les mesures avancées : huile carter', act: 'tele' },
      { t: 'Voir le schéma hydraulique : valve 14, échangeurs 26/27, bypass 31', act: 'hydro' },
      { t: 'Voir l\'échangeur en 3D (il rougit quand l\'huile chauffe)', act: 'ecoHydroView' },
    ],
    hypotheses: [
      { t: 'Échangeur colmaté (côté huile)', ok: true, why: 'Oui : D6 et D8 baissent, le bypass 31 s\'ouvre, l\'huile non refroidie rejoint le graissage.' },
      { t: 'Pompe à huile usée', ok: false, why: 'Une pompe usée ferait chuter PHD (autres rapports perturbés) ; ici PHD est normale.' },
      { t: 'Filtre à pression colmaté', ok: false, why: 'Il fait chuter PHD ; ce n\'est pas le cas.' },
      { t: 'Régulateur du ralentisseur (10) défaillant', ok: false, why: 'Le ralentisseur ne réagirait pas ou mal ; ici il freine, c\'est l\'évacuation de la chaleur qui manque.' },
      { t: 'WK qui glisse', ok: false, why: 'Cela concerne l\'écart moteur/turbine à vitesse stabilisée, pas le ralentissement.' },
    ],
    mesures: { 'prise-d6': LIVE, 'prise-d8': LIVE, 'sonde-ret': LIVE, 'sonde-carter': LIVE, 'echangeur': CTL('Perte de charge côté huile', 0.6, 1.5, 2.6, 'bar', 'max', 'Échangeur partiellement colmaté.'), 'bypass-31': CTL('Ouverture du bypass 31 (D7 − D8)', 0, 1, 1.9, 'bar', 'max', 'Le bypass s\'ouvre : huile non refroidie.'), 'prise-phd': LIVE },
    retenir: 'Échauffement surtout au ralentisseur : circulation dédiée, commutation 13/14, échange thermique côté huile ET côté liquide. D8 correcte n\'exclut pas le refroidissement : le bypass 31 peut laisser passer de l\'huile sans traverser l\'échangeur.',
  },

  /* ====================================================================== E */
  {
    id: 'E', title: 'Le moteur tourne plus vite que la turbine à vitesse stabilisée', short: 'Glissement WK',
    or: { client: '« À vitesse stabilisée, le régime moteur reste haut et la consommation a augmenté. La boîte chauffe. Les passages de rapports sont normaux. »', vehicule: 'Autobus interurbain, ZF EcoLife 6 AP xx20 B, 330 000 km.', conditions: '5ème · vitesse stabilisée · ≈ 1 500 tr/min · huile chaude' },
    setup: { oilT: 90, rpm: 1500, gear: 5, load: 'stab', hintTools: '5ème stabilisée : WK commandé fermé. Comparez régime moteur et régime turbine.' },
    faults: { a8Low: 0.65 }, alertIds: ['soupape-8'],
    culprits: { main: ['soupape-8'], accept: ['soupape-8'], related: ['cv-wk', 'ev-wk', 'soupape-7', 'valve-14', 'prise-a8'] },
    related_msg: 'Cet organe intervient dans le pontage, mais A8 est TROP BASSE : la contre-pression de la soupape 8 n\'est pas maintenue.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : régime moteur élevé à vitesse stabilisée, consommation en hausse, échauffement ; passages normaux.\nQuestion : un écart moteur/turbine est-il toujours un défaut ? (ZF : il peut être normal si WK est volontairement ouvert.)' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Rapport 5, charge stabilisée : le calculateur commande WK fermé (« Convertisseur » devrait passer à WK FERMÉ). Regardez « Glissement WK » et comparez régimes moteur et turbine B12. Au schéma : la pression A8 agit sur le régulateur WK 15 ; la soupape 8 crée la contre-pression.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : SOUPAPE DE CONTRE-PRESSION (8).\nExplication : la pression interne A8 agit aussi sur le régulateur WK 15 et sur le piston de pontage ; F ≈ Δp × S. Avec A8 trop basse (≈ 3,5 bar au lieu de 4,5 à 6,5), l\'effort de pontage chute : WK glisse, l\'écart de régime apparaît, la chaleur augmente. La bobine Y17 est conforme et PHD correcte : seule A8 est basse.\nPièces : soupape 8 (ressort, tiroir), bloc hydraulique si usé.\nOrdre de grandeur (indicatif) : MO ≈ 6–9 h · pièces ≈ 80–250 € HT.' },
    ],
    protocole: [
      { t: 'Identifier l\'état demandé', d: 'Relever avec l\'outil l\'état commandé de WK, les régimes B12 / moteur et la température : un écart n\'est un défaut que si WK est commandé fermé.' },
      { t: 'Contrôle électrique de WK (Y17)', d: '10 à 14 Ω (VP2 X4 5 / commande X4 9) : conforme.', ctl: { label: 'Résistance de la bobine Y17', neuf: 12, limite: 14, mesure: 12.2, unit: 'Ω', sens: 'max' } },
      { t: 'Mesurer PHD', d: 'PHD correcte : la commande est alimentée.', ctl: { label: 'PHD à 2 200 tr/min', neuf: 11, limite: 10, mesure: 10.9, unit: 'bar', sens: 'min' } },
      { t: 'Mesurer A8', d: 'ZF : 4,5 à 6,5 bar à 620 tr/min ; 5 à 6,5 bar à 2 200 tr/min. Mesuré ≈ 3,5 bar.', ctl: { label: 'A8 à 2 200 tr/min', neuf: 5.8, limite: 5, mesure: 3.5, unit: 'bar', sens: 'min' } },
      { t: 'Ouvrir et contrôler la soupape 8', d: 'Après dépressurisation : tiroir, ressort, siège.' },
      { t: 'Remplacer', d: 'Soupape de contre-pression 8 ; joints ; contrôle de la soupape 7.' },
      { t: 'Remplissage et niveau', d: OIL },
      { t: 'Essai', d: 'Vitesse stabilisée : WK fermé sans glissement ; régimes moteur / turbine égaux.' },
    ],
    demo: { label: '▶ Reproduire : vitesse stabilisée en 5ème', action: 'ecoCruise' },
    observe: [
      { t: 'Afficher les mesures avancées : glissement WK et régimes', act: 'tele' },
      { t: 'Voir le schéma hydraulique : A8 → régulateur WK 15', act: 'hydro' },
      { t: 'Voir le convertisseur en 3D (pontage orange)', act: 'bvaConv' },
    ],
    hypotheses: [
      { t: 'Contre-pression A8 trop basse (soupape 8)', ok: true, why: 'Oui : A8 agit sur le régulateur et le piston de WK ; trop basse, l\'effort de pontage chute.' },
      { t: 'Embrayage B qui patine', ok: false, why: 'Un élément qui patine ferait monter le régime sans accélération en charge ; ici c\'est le convertisseur qui glisse.' },
      { t: 'Bobine du régulateur WK coupée', ok: false, why: 'Elle serait hors plage (10-14 Ω) et donnerait un défaut ; ici elle est à 12 Ω.' },
      { t: 'Pompe à huile usée', ok: false, why: 'PHD serait basse et les rapports perturbés.' },
      { t: 'Capteur de régime turbine B12', ok: false, why: 'Un capteur faux n\'explique pas l\'échauffement ni la consommation.' },
    ],
    mesures: { 'prise-a8': LIVE, 'prise-phd': LIVE, 'ev-wk': LIVE, 'cv-wk': CTL('Épaisseur de la garniture du pontage', 0.9, 0.5, 0.8, 'mm', 'min'), 'soupape-7': CTL('Pression d\'ouverture de la soupape 7', 6.5, 5.5, 6.4, 'bar', 'min'), 'capteur-b12': LIVE },
    retenir: 'Un écart moteur/turbine s\'interprète avec l\'état commandé de WK. WK fermé qui glisse : régulation 15 et pression A8 (soupape 8). La commande électrique correcte ne compense pas une pression d\'appui insuffisante.',
  },

  /* ====================================================================== F */
  {
    id: 'F', title: 'Seule la 6ème fonctionne', short: 'A, WK, D, F ensemble',
    or: { client: '« Le bus ne démarre pas : ni D ni R. Mais quand le calculateur est en secours, il se traîne en 6ème. Plusieurs défauts apparaissent en même temps. »', vehicule: 'Autobus urbain, ZF EcoLife 6 AP xx20 B, 280 000 km, faisceau réparé récemment.', conditions: 'D / R au départ arrêté · défauts A, WK, D et F simultanés' },
    setup: { oilT: 75, rpm: 1500, gear: 1, load: 'accel', hintTools: '1ère engagée : aucun entraînement. Regardez les éléments commandés.' },
    faults: { vp2: 1 }, alertIds: ['connecteur-x4'],
    culprits: { main: ['connecteur-x4'], accept: ['connecteur-x4'], related: ['ev-a', 'ev-wk', 'ev-d', 'ev-f', 'bloc-hydraulique'] },
    related_msg: 'Chaque bobine est conforme : le défaut est COMMUN. Quatre régulateurs partagent VP2 (broche 5 de X4) : c\'est l\'alimentation ou la liaison commune qui est coupée.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : ni D ni R ; seule la 6ème fonctionne en secours ; plusieurs défauts simultanés.\nQuestion : des défauts simultanés sont-ils forcément quatre pièces en panne ?' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Tableau d\'engagement : A est fermé en 1, 2, 3, 4 ; D en 3, 5, R ; F en 1, R. Seule la 6ème (B + E) n\'utilise ni A, ni D, ni F. « Essai des rapports » : seul le 6 passe. Manuel ZF : A, WK, D et F partagent VP2 ; B, RHD, E et le ralentisseur partagent VP1.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : CONNECTEUR X4 / alimentation VP2 (broche 5).\nExplication (ZF) : plusieurs défauts du même groupe orientent vers une alimentation ou une liaison commune, avant de conclure à plusieurs bobines défectueuses. Ici A, WK, D et F sont coupés ensemble ; les résistances des bobines sont conformes (10 à 14 Ω) ; la tension sur la broche 5 est nulle.\nLe brochage X4 n\'est pas à transposer à une autre version de faisceau.\nPièces : cosse / faisceau / connecteur selon la mesure.\nOrdre de grandeur (indicatif) : MO ≈ 2–4 h · faisceau ≈ 100–400 € HT.' },
    ],
    protocole: [
      { t: 'Sauvegarder les défauts', d: 'Lire la mémoire de défauts : A, WK, D, F ensemble. Ne pas effacer avant relevé.' },
      { t: 'Mesurer les bobines (hors tension)', d: 'Contact coupé, calculateur hors courant : A (Y11), WK (Y17), D (Y14), F (Y16) : 10 à 14 Ω. Mesuré ≈ 12 Ω partout : les bobines sont conformes.', ctl: { label: 'Résistance de la bobine Y11 (A)', neuf: 12, limite: 14, mesure: 12.0, unit: 'Ω', sens: 'max' } },
      { t: 'Chercher le point commun', d: 'A, WK, D, F : VP2 (broche 5). B, RHD, E, ralentisseur : VP1 (broche 3).' },
      { t: 'Contrôler VP2', d: 'Tension d\'alimentation au connecteur X4 broche 5, contact mis (valeur nominale du véhicule, indicative). Mesuré 0 V : alimentation coupée.', ctl: { label: 'Tension VP2 (X4 broche 5)', neuf: 24, limite: 20, mesure: 0, unit: 'V', sens: 'min' } },
      { t: 'Remonter la liaison', d: 'Faisceau, cosses, connecteur : continuité, corrosion, serrage ; schéma véhicule applicable.' },
      { t: 'Réparer', d: 'Remise en état du faisceau / connecteur ; ne pas transposer un brochage à une autre version.' },
      { t: 'Effacer et vérifier', d: 'Effacer les défauts après sauvegarde, vérifier les 8 régulateurs.' },
      { t: 'Essai', d: 'D et R au départ arrêté, 1→6 ; essai de calage conforme.' },
    ],
    demo: { label: '▶ Reproduire : sélectionner D au départ arrêté', action: 'ecoLaunch' },
    observe: [
      { t: 'Ouvrir le tableau d\'engagement : quels rapports n\'utilisent ni A, ni D, ni F ?', act: 'bvaTable' },
      { t: 'Lancer l\'« Essai des rapports » : seul le 6 passe', act: 'bvaScan' },
      { t: 'Voir les régulateurs en 3D (verts quand commandés)', act: 'ecoHydroView' },
    ],
    hypotheses: [
      { t: 'Alimentation commune VP2 coupée (X4 broche 5)', ok: true, why: 'Oui : A, WK, D, F partagent VP2 ; leurs bobines sont conformes, la tension est nulle.' },
      { t: 'Quatre régulateurs hors service', ok: false, why: 'Quatre bobines défectueuses à la fois sont improbables ; elles mesurent 12 Ω.' },
      { t: 'Pompe à huile HS', ok: false, why: 'La 6ème (B + E) fonctionne : l\'alimentation hydraulique existe.' },
      { t: 'Convertisseur défaillant', ok: false, why: 'Il n\'explique pas le choix précis des rapports qui passent.' },
      { t: 'Capteur B11 faux', ok: false, why: 'Il ne coupe pas la commande de quatre éléments.' },
    ],
    mesures: { 'connecteur-x4': CTL('Tension VP2 (X4 broche 5)', 24, 20, 0, 'V', 'min', 'Alimentation commune coupée.'), 'ev-a': LIVE, 'ev-wk': LIVE, 'ev-d': LIVE, 'ev-f': LIVE, 'ev-b': LIVE, 'ev-e': LIVE },
    retenir: 'Plusieurs défauts du même groupe d\'alimentation (A, WK, D, F = VP2 ; B, RHD, E, ralentisseur = VP1) orientent d\'abord vers l\'alimentation ou la liaison commune, avant de conclure à plusieurs bobines défectueuses.',
  },

  /* ====================================================================== G */
  {
    id: 'G', title: 'La pression s\'effondre à l\'arrêt moteur', short: 'Maintien de PHD',
    or: { client: '« Après un arrêt, au redémarrage, la boîte met du temps à engager. Le contrôle de maintien de pression est mauvais. »', vehicule: 'Autobus urbain, ZF EcoLife 6 AP xx20 B, 600 000 km.', conditions: 'Moteur arrêté · 20 s · contrôle du maintien de PHD' },
    setup: { oilT: 60, rpm: 620, gear: 'N', load: 'accel', hintTools: 'Neutre à 620 tr/min, huile 50-65 °C : prêt pour le test de maintien.' },
    faults: { checkValve: 1 }, alertIds: ['clapet-29'],
    culprits: { main: ['clapet-29'], accept: ['clapet-29'], related: ['accu-12', 'soupape-6', 'pompe-corps', 'bloc-hydraulique'] },
    related_msg: 'Cet organe intervient dans le maintien de PHD, mais la vidange rapide vers la pompe désigne le CLAPET ANTI-RETOUR (29) qui n\'étanche plus.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : engagement lent après un arrêt.\nQuestion : que se passe-t-il à PHD quand le moteur s\'arrête, et qu\'est-ce qui la retient ?' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Procédure ZF : faire tourner ≥ 20 s à ≈ 620 tr/min en N, arrêter le moteur, attendre le régime turbine nul puis chronométrer ; après 20 s PHD ≥ 1,5 bar. Utilisez le bouton « Arrêter le moteur », attendez 20 s et lisez la prise PHD.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : CLAPET ANTI-RETOUR (29).\nExplication (ZF) : le clapet 29 empêche la vidange du canal de pression principale vers la pompe à l\'arrêt ; l\'accumulateur 12 compense ensuite les fuites internes. Si le clapet fuit, PHD s\'effondre en quelques secondes. ZF précise qu\'un résultat insuffisant oriente vers le maintien de pression (accumulateur, clapet 29, fuite interne) sans désigner à lui seul la pièce.\nPièces : clapet 29 (bille / ressort / siège), bloc hydraulique si usé.\nOrdre de grandeur (indicatif) : MO ≈ 5–8 h · pièces ≈ 50–200 € HT.' },
    ],
    protocole: [
      { t: 'Préparer', d: 'Huile 50-65 °C, moteur ≥ 20 s à ≈ 620 tr/min, sélecteur N, WK ouvert.' },
      { t: 'Mesure de maintien', d: 'Arrêter le moteur, attendre turbine = 0, démarrer le chronomètre : après 20 s, PHD ≥ 1,5 bar. Mesuré ≈ 0 bar.', ctl: { label: 'PHD 20 s après l\'arrêt', neuf: 3, limite: 1.5, mesure: 0, unit: 'bar', sens: 'min' } },
      { t: 'Exclure l\'accumulateur', d: 'Précharge et ressort de l\'accumulateur 12 corrects.', ctl: { label: 'Précharge de l\'accumulateur', neuf: 3, limite: 1.5, mesure: 2.8, unit: 'bar', sens: 'min' } },
      { t: 'Dépressuriser et ouvrir', d: 'Attendre 3 minutes moteur arrêté (huile chaude), outillage et protections ZF.' },
      { t: 'Contrôler le clapet 29', d: 'Bille, siège, ressort : fuite visible.' },
      { t: 'Remplacer', d: 'Clapet 29 neuf, plan de joint propre, serrage ZF.' },
      { t: 'Remplissage et niveau', d: OIL },
      { t: 'Essai', d: 'Reprendre le test de maintien : PHD ≥ 1,5 bar après 20 s.' },
    ],
    demo: { label: '▶ Reproduire : arrêter le moteur', action: 'ecoStop' },
    observe: [
      { t: 'Arrêter le moteur puis attendre 20 s : lire la prise PHD', act: 'ecoStop' },
      { t: 'Voir le schéma hydraulique : clapet 29 et accumulateur 12', act: 'hydro' },
      { t: 'Afficher les mesures avancées : PHD', act: 'tele' },
    ],
    hypotheses: [
      { t: 'Clapet anti-retour (29) qui fuit', ok: true, why: 'Oui : PHD se vide vers la pompe dès l\'arrêt, l\'accumulateur ne peut plus la soutenir.' },
      { t: 'Filtre à pression colmaté', ok: false, why: 'Il baisse PHD moteur en marche (Δp > 0,8 bar) ; ici PHD est correcte moteur tournant.' },
      { t: 'Bobine du régulateur RHD coupée', ok: false, why: 'Elle agit moteur en marche sur la pression pilote, pas sur le maintien à l\'arrêt.' },
      { t: 'Embrayage A usé', ok: false, why: 'Il n\'a aucun rôle dans le maintien de la pression principale.' },
      { t: 'Capteur B12', ok: false, why: 'Il fournit le régime turbine (début du chronométrage) mais ne fait pas chuter PHD.' },
    ],
    mesures: { 'prise-phd': LIVE, 'clapet-29': CTL('Étanchéité du clapet 29', 100, 80, 5, '%', 'min', 'La bille ne ferme plus : retour par la pompe.'), 'accu-12': CTL('Précharge de l\'accumulateur', 3, 1.5, 2.8, 'bar', 'min'), 'bloc-hydraulique': CTL('Fuite interne du bloc (à l\'arrêt)', 0.2, 0.6, 0.3, 'bar/10 s', 'max'), 'soupape-6': CTL('Étanchéité de la soupape principale', 100, 80, 96, '%', 'min') },
    retenir: 'À l\'arrêt, le clapet 29 empêche le retour de PHD vers la pompe et l\'accumulateur 12 compense les fuites : PHD ≥ 1,5 bar 20 s après turbine nulle. Un résultat insuffisant oriente vers le maintien (accumulateur, clapet 29, fuite) sans désigner seul la pièce.',
  },
];

/* ============================================================================
 * Mesures « en direct » : on lit la simulation, on compare à la plage ZF — les cas peuvent ainsi se contrôler comme à l'atelier
 * ========================================================================== */
const near = (rpm) => (rpm < 1400 ? 0 : 1);
const mk = (label, neuf, limite, mesure, unit, sens, note) => ({ label, neuf, limite, mesure, unit, sens, note, bad: sens === 'min' ? mesure < limite : mesure > limite });
export function liveMeasure(sim, id) {
  const rpm = sim.engineRpm, i = near(rpm), where = i === 0 ? 'à 620 tr/min' : 'à 2 200 tr/min';
  const cond = ` Conditions ZF : huile 50-65 °C, N, WK ouvert (ici ${Math.round(rpm)} tr/min, ${Math.round(sim.oilT)} °C).`;
  switch (id) {
    case 'prise-phd': {
      if (!sim.engineOn && sim.stopT > 0) return mk(`PHD ${Math.round(sim.stopT)} s après l'arrêt du moteur`, 3, 1.5, sim.p.phd, 'bar', 'min', sim.stopT < 20 ? 'Attendre 20 s après le régime turbine nul pour juger (limite ZF : ≥ 1,5 bar).' : 'Contrôle de maintien de PHD [ZF p. 120-122] : ≥ 1,5 bar à 20 s.');
      return mk(`PHD ${where}`, i ? 11 : 10, i ? 10 : 8, sim.p.phd, 'bar', 'min', 'Plage ZF : 8 à 12 bar à 620 tr/min ; 10 à 12 bar à 2 200 tr/min.' + cond);
    }
    case 'prise-pvf': return mk('Perte de pression du filtre 3 (PVF − PHD)', 0.3, 0.8, sim.dpFilter || 0, 'bar', 'max', `Limite ZF < 0,8 bar à 620 tr/min, N, 50-65 °C. PVF = ${sim.p.pvf.toFixed(1).replace('.', ',')} bar, PHD = ${sim.p.phd.toFixed(1).replace('.', ',')} bar : le résultat porte sur la différence.` + cond);
    case 'prise-a8': return mk(`A8 (aval convertisseur) ${where}`, i ? 5.8 : 5.5, i ? 5 : 4.5, sim.p.a8, 'bar', 'min', 'Plage ZF : 4,5 à 6,5 bar à 620 tr/min ; 5 à 6,5 bar à 2 200 tr/min.' + cond);
    case 'prise-d6': return mk(`D6 (aval échangeur ralentisseur) ${where}`, i ? 4 : 1.9, i ? 3 : 0.8, sim.p.d6, 'bar', 'min', 'Plage ZF : 0,8 à 3 bar à 620 tr/min ; 3 à 5 bar à 2 200 tr/min.' + cond);
    case 'prise-d8': return mk(`D8 (lubrification) ${where}`, i ? 2.3 : 1.0, i ? 1.6 : 0.4, sim.p.d8, 'bar', 'min', 'Plage ZF : 0,4 à 1,5 bar à 620 tr/min ; 1,6 à 3 bar à 2 200 tr/min. D8 correcte n\'exclut pas un défaut de refroidissement.' + cond);
    case 'sonde-carter': return { label: `Sonde du carter à ${Math.round(sim.oilT)} °C`, neuf: +ntcR('carter', sim.oilT).toFixed(2), limite: +(ntcR('carter', sim.oilT) * 1.12).toFixed(2), mesure: +ntcR('carter', sim.oilT).toFixed(2), unit: 'kΩ', sens: 'max', bad: false, note: 'CTN : la résistance diminue quand la température augmente [ZF p. 71]. 20 °C ≈ 62,383 kΩ ; 80 °C ≈ 6,337 kΩ ; 100 °C ≈ 3,426 kΩ (nominales, tolérances ZF à appliquer).' };
    case 'sonde-ret': return { label: `Sonde du ralentisseur à ${Math.round(sim.retT)} °C`, neuf: +ntcR('ret', sim.retT).toFixed(2), limite: +(ntcR('ret', sim.retT) * 1.12).toFixed(2), mesure: +ntcR('ret', sim.retT).toFixed(2), unit: 'kΩ', sens: 'max', bad: false, note: 'CTN, courbe différente de la sonde carter : 20 °C ≈ 123,8 kΩ ; 80 °C ≈ 11,84 kΩ ; 100 °C ≈ 6,283 kΩ [ZF p. 71].' };
    case 'capteur-b12': return mk('Régime turbine B12', Math.round(sim.n.turb), Math.round(sim.n.turb * 0.9), Math.round(sim.n.turb), 'tr/min', 'min', `Rapport turbine / sortie = ${sim.n.out > 5 ? (sim.n.turb / sim.n.out).toFixed(3).replace('.', ',') : '—'}. Alimentation +9 V. Avec WK ouvert, un écart avec le moteur est normal.`);
    default: break;
  }
  const m = /^ev-(a|b|d|e|f|wk|ret|rhd)$/.exec(id);
  if (m) {
    const k = m[1], vp2 = ['a', 'd', 'f', 'wk'].includes(k), cmd = k === 'wk' ? sim.cmd.wk : k === 'ret' ? sim.cmd.ret : k === 'rhd' ? 1 : sim.cmd[k];
    const r = 12 + (k.length * 0.07);
    return { label: `Résistance de la bobine ${k === 'wk' ? 'WK (Y17)' : k === 'ret' ? 'ralentisseur (Y19)' : k === 'rhd' ? 'RHD (Y13)' : `${EL_INFO[k].n} (${EL_INFO[k].coil})`}`, neuf: 12, limite: 14, mesure: +r.toFixed(1), unit: 'Ω', sens: 'max', bad: false,
      note: `ZF : 10 à 14 Ω à 20 °C (moteur et contact coupés, calculateur hors courant). Alimentation ${vp2 ? 'VP2 (X4 broche 5)' : 'VP1 (X4 broche 3)'}. Commande actuelle : ${cmd > 0.5 ? 'ALIMENTÉE' : 'repos'}. Une résistance conforme ne prouve ni le déplacement du tiroir ni la pression.` };
  }
  const q = /^piston-(a|b|d1|d2|e|f1|f2)$/.exec(id);
  if (q) {
    const k = q[1][0], on = sim.cmd[k] > 0.5 && sim.engineOn, p = sim.p['p' + k] * (q[1].length > 1 ? (sim.sl2[k] > 0.5 ? 1 : 0.0) : 1);
    return { label: `Pression au piston ${q[1].toUpperCase()}`, neuf: 10, limite: 8, mesure: +(on ? p : 0).toFixed(1), unit: 'bar', sens: 'min', bad: on && p < 8 && (q[1].length === 1 || sim.sl2[k] > 0.5),
      note: on ? `Élément ${k.toUpperCase()} commandé : la pression au piston doit approcher PHD (${sim.p.phd.toFixed(1).replace('.', ',')} bar). F ≈ Δp × S.` : `Élément ${k.toUpperCase()} non commandé dans le rapport engagé : engagez un rapport qui l'utilise.` };
  }
  return null;
}
