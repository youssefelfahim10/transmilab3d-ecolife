/* ============================================================================
 * atelierScenarios.js — Cas pratiques de diagnostic guidé (système d'indices à 3 niveaux)
 *   Niveau 1 : Ordre de Réparation (plainte client, conditions d'apparition)
 *   Niveau 2 : Aide à l'observation 3D (outils du simulateur à utiliser)
 *   Niveau 3 : Expertise (pièce usée en rouge, explication physique, pièces à remplacer, chiffrage)
 * Les valeurs de métrologie / temps / prix sont PÉDAGOGIQUES et indicatives.
 * ========================================================================== */

const OIL_NOTE = 'Huile boîte 75W-80 API GL-4 (≈ 2,0 L, valeur indicative) — jamais de GL-5 : additifs EP soufrés corrosifs pour le laiton des anneaux.';

export const SCENARIOS = [
  /* ====================================================================== A */
  {
    id: 'A',
    title: 'La 2ème craque au rétrogradage à froid',
    short: 'Craquement 3→2 à froid',
    or: {
      client: '« Quand je rétrograde de 3ème en 2ème, le matin à froid, ça craque. Quand la boîte est chaude, c\'est beaucoup moins net. Les autres rapports passent bien. »',
      vehicule: 'Berline compacte, boîte BVM 5 rapports, 142 000 km, huile jamais changée depuis 90 000 km.',
      conditions: 'Régime ≈ 3 000 tr/min · rétrogradage 3→2 · huile de boîte < 30 °C',
    },
    setup: { oilT: 20, rpm: 3000, gear: 3, hintTools: 'Température d\'huile réglée à 20 °C, boîte en 3ème.' },
    faults: { wornCone: { gear: 2, mu: 0.5 } },
    alertIds: ['bague-2'],
    culprits: { main: ['bague-2'], accept: ['bague-2'], related: ['s-2', 'clavettes-12', 'baladeur-12', 'ressorts-12', 'moyeu-12'] },
    related_msg: 'Cette pièce peut être contrôlée mais elle n\'est pas la cause première : le non-freinage du pignon fou vient du CÔNE DE FRICTION de l\'anneau de synchro de 2ème (laiton). Le pignon fou de 2ème n\'est à changer que si son cône mâle est rayé.',
    hints: [
      {
        title: 'Niveau 1 — Ordre de Réparation',
        body: 'Plainte client : craquement à la rétrogradation 3→2 UNIQUEMENT à froid ; l\'anomalie s\'atténue à chaud. Autres rapports normaux. Pas de bruit au point mort, pas de saut de vitesse.\nQuestion à vous poser : quelle fonction du synchroniseur n\'est plus assurée, et pourquoi l\'huile froide aggrave-t-elle le défaut ?',
      },
      {
        title: 'Niveau 2 — Aide à l\'observation 3D',
        body: 'Réglez l\'huile à 20 °C (curseur « Température d\'huile »), engagez la 3ème, puis cliquez « 🔍 Loupe 1/2 » (ralenti ×0,1) et passez en 2ème sur le levier en H.\nActivez le mode « Rayons X ». Observez le pignon fou de 2ème (GRIS) pendant la phase 2 : l\'écart de régime Δ (en haut) ne s\'annule pas, le cône laiton « glisse » sans freiner le pignon. Le baladeur est bloqué puis force le passage : CRAQUEMENT.',
      },
      {
        title: 'Niveau 3 — Expertise et chiffrage',
        body: 'Pièce identifiée (colorée en ROUGE d\'alerte) : ANNEAU DE SYNCHRO DE 2ème (laiton).\nExplication physique : les rainures du cône sont usées → le film d\'huile n\'est plus évacué → coefficient de frottement μ effondré. Le couple de synchronisation C = μ·F·R_moy/sin α est insuffisant : le pignon fou ne ralentit/accélère pas assez vite. À froid l\'huile est visqueuse (film plus épais) : μ_eff chute encore (≈ ×0,45) et le temps de synchro dépasse le temps de poussée du conducteur → le baladeur force l\'anneau bloqué : craquement.\nPièces à remplacer : kit synchro de 2ème (anneau laiton + 3 clavettes + 2 ressorts), circlip de moyeu 1/2 neuf, cale à ajuster, huile de boîte, pâte d\'étanchéité ; contrôler cône du pignon fou de 2ème et chanfreins du baladeur 1/2.\nOrdre de grandeur (indicatif) : MO ≈ 3,5–4,5 h · kit synchro ≈ 40–90 € HT · huile ≈ 25 € HT.',
      },
    ],
    protocole: [
      { t: 'Préparer et sécuriser', d: 'Véhicule sur pont, batterie débranchée, boîte au point mort. Vidange de la boîte (huile usagée → collecte déchets).' },
      { t: 'Déposer / ouvrir la boîte', d: 'Suivre la gamme constructeur (dépose groupe moto-propulseur ou boîte seule). Ouvrir carter mécanisme et couvercle arrière.' },
      { t: 'Métrologie de l\'anneau de 2ème', d: 'Mesurer à la cale d\'épaisseur le jeu axial anneau / cône du pignon fou, anneau plaqué : neuf 1,2 mm — limite d\'usure 0,5 mm. Mesuré ici ≈ 0,3 mm → HORS TOLÉRANCE : remplacement obligatoire.', ctl: { label: 'Jeu anneau / cône de 2ème', neuf: 1.2, limite: 0.5, mesure: 0.3, unit: 'mm', sens: 'min' } },
      { t: 'Contrôles associés', d: 'Cône mâle du pignon fou de 2ème : rayures, bleuissement ? Chanfreins des dents de crabotage et du baladeur 1/2 intacts ? Jeu axial du pignon fou 0,10–0,30 mm.', ctl: { label: 'Jeu axial pignon fou 2ème', neuf: 0.2, limite: 0.3, mesure: 0.22, unit: 'mm', sens: 'max' } },
      { t: 'Remplacer le kit synchro 2ème', d: 'Anneau laiton + 3 clavettes + 2 ressorts annulaires, circlip de moyeu neuf. Tremper les pièces dans l\'huile de boîte avant pose.' },
      { t: 'Remontage — précautions', d: 'Respecter le sens du baladeur et du moyeu ; aligner les 3 encoches de l\'anneau avec les clavettes ; ressorts décalés de 120° ; circlip assis dans sa gorge ; ajuster la cale pour 0,10–0,30 mm de jeu axial.' },
      { t: 'Couples de serrage (indicatifs)', d: 'Vis de carter M8 : 25 Nm en croix ; bouchons de vidange et de niveau : 25–30 Nm. Vérifier la gamme du modèle.' },
      { t: 'Remplissage et essai', d: OIL_NOTE + ' Essai routier : rétrograder 3→2 et 2→1 à froid puis à chaud ; contrôle d\'étanchéité.' },
    ],
  },

  /* ====================================================================== B */
  {
    id: 'B',
    title: 'La 3ème saute en décélération (frein moteur)',
    short: '3ème qui saute en décélération',
    or: {
      client: '« Quand je lève le pied en 3ème, surtout en descente, le levier ressort tout seul et la vitesse saute au point mort. En accélération ça tient. »',
      vehicule: 'Monospace, boîte BVM 5 rapports, 188 000 km, utilisation familiale lourde.',
      conditions: '3ème engagée · levier relâché · décélération (frein moteur) · régime ≈ 2 500 tr/min',
    },
    setup: { oilT: 80, rpm: 2500, gear: 3, load: 'accel', hintTools: 'Huile à 80 °C, 3ème engagée, en accélération.' },
    faults: { wornDog: 3 },
    alertIds: ['baladeur-34', 's-3'],
    culprits: { main: ['baladeur-34', 's-3'], accept: ['baladeur-34', 's-3'], related: ['moyeu-34', 'circlip-moyeu-34', 'cale-34', 'fourchette-34'] },
    related_msg: 'Ce composant participe au jeu axial ou à la commande, mais la cause première est l\'USURE DES DENTS DE CRABOTAGE EN DÉPOUILLE du baladeur 3/4 et de la couronne de crabotage du pignon fou de 3ème.',
    hints: [
      {
        title: 'Niveau 1 — Ordre de Réparation',
        body: 'Plainte client : la 3ème « saute » au lever de pied (frein moteur) ; en accélération la vitesse reste enclenchée. Aucun bruit particulier. Les autres rapports sont corrects.\nQuestion à vous poser : qu\'est-ce qui change dans les efforts sur les dents quand le couple s\'inverse ?',
      },
      {
        title: 'Niveau 2 — Aide à l\'observation 3D',
        body: 'Engagez la 3ème (accélération : tout tient). Puis choisissez « Décélération (frein moteur) » et cliquez « 🔍 Loupe 3/4 ». Observez le baladeur 3/4 : il oscille axialement (jeu), puis est repoussé vers le point mort, la fourchette suit. Activez la coupe (axe Z) pour voir l\'engagement des crabots.',
      },
      {
        title: 'Niveau 3 — Expertise et chiffrage',
        body: 'Pièces identifiées (ROUGE d\'alerte) : DENTS DE CRABOTAGE du pignon fou de 3ème et DENTURE INTÉRIEURE du baladeur 3/4 usées en dépouille.\nExplication physique : les flancs de crabotage sont taillés avec une légère dépouille (contre-dépouille) pour que l\'effort axial maintienne le baladeur ENGAGÉ sous couple moteur. Usés, les flancs deviennent obliques dans l\'autre sens : en décélération (couple inversé) la composante axiale F_ax = F_t·tan β repousse le baladeur vers le neutre ; le jeu axial excessif (cale / circlip) laisse le baladeur partir : la vitesse saute.\nPièces à remplacer : baladeur 3/4 + pignon fou de 3ème (avec cage à aiguilles), kit synchro 3/4 (2 anneaux, clavettes, ressorts), circlip de moyeu, cale ; contrôler fourchette 3/4 (patins) et gorge du baladeur.\nOrdre de grandeur (indicatif) : MO ≈ 4,5–5,5 h · pièces ≈ 180–350 € HT.',
      },
    ],
    protocole: [
      { t: 'Préparer et sécuriser', d: 'Pont élévateur, batterie débranchée, vidange de la boîte. Repérer l\'ordre de démontage (photos).' },
      { t: 'Ouvrir la boîte', d: 'Déposer boîte, couvercle arrière, axes et fourchettes puis carter mécanisme selon la gamme.' },
      { t: 'Métrologie des crabots', d: 'Mesurer la dépouille résiduelle des dents de crabotage au projecteur de profil : neuf ≈ 3°, usé ≈ 0° (indicatif). Dents « bec arrondi » = remplacement.', ctl: { label: 'Dépouille des crabots 3ème', neuf: 3.0, limite: 1.0, mesure: 0.2, unit: '°', sens: 'min' } },
      { t: 'Jeu axial', d: 'Mesurer le jeu axial du baladeur / pignon fou de 3ème à la jauge : maxi 0,30 mm. Constaté 0,55 mm → excessif.', ctl: { label: 'Jeu axial pignon fou 3ème', neuf: 0.2, limite: 0.3, mesure: 0.55, unit: 'mm', sens: 'max' } },
      { t: 'Remplacer les pièces d\'usure', d: 'Baladeur 3/4 + pignon fou 3ème (et cage à aiguilles) + kit synchro 3/4 ; circlip de moyeu neuf ; vérifier le pignon fixe de 3ème (écaillage).' },
      { t: 'Remontage — précautions', d: 'Sens de montage du baladeur 3/4 (gorge / chanfreins) ; ajuster la cale pour un jeu axial de 0,10–0,30 mm ; fourchette 3/4 : jeu patin/gorge contrôlé.' },
      { t: 'Couples de serrage (indicatifs)', d: 'Vis de carter 25 Nm en croix ; bouchons 25–30 Nm.' },
      { t: 'Essai', d: OIL_NOTE + ' Essai : 3ème enclenchée, lever de pied en côte descendante, vérifier le maintien de la vitesse.' },
    ],
  },

  /* ====================================================================== C */
  {
    id: 'C',
    title: 'Bruit de roulement au point mort, disparaît en débrayant',
    short: 'Bruit au point mort pédale relâchée',
    or: {
      client: '« Au ralenti, boîte au point mort, j\'entends un ronronnement / sifflement permanent. Dès que j\'appuie sur la pédale d\'embrayage, il disparaît. »',
      vehicule: 'Citadine diesel, boîte BVM 5 rapports, 210 000 km, nombreux démarrages courte distance.',
      conditions: 'Point mort · pédale d\'embrayage RELÂCHÉE · bruit proportionnel au régime moteur · disparaît pédale enfoncée',
    },
    setup: { oilT: 70, rpm: 1500, gear: 'N', hintTools: 'Point mort, pédale relâchée. Activez le son d\'atelier pour entendre le roulement.' },
    faults: { wornPrimBearing: true },
    alertIds: ['rlt-prim-av'],
    culprits: { main: ['rlt-prim-av'], accept: ['rlt-prim-av', 'rlt-prim-ar'], related: ['arbre-primaire', 'spi-primaire', 'disque-embrayage'] },
    related_msg: 'Cette pièce tourne bien avec l\'arbre primaire au point mort mais n\'est pas la source du bruit de roulement : cherchez un ROULEMENT de l\'arbre primaire.',
    hints: [
      {
        title: 'Niveau 1 — Ordre de Réparation',
        body: 'Plainte client : bruit permanent au point mort, pédale relâchée ; il disparaît pédale enfoncée. Aucun défaut de passage de rapports.\nQuestion à vous poser : qu\'est-ce qui tourne au point mort quand l\'embrayage est embrayé, et qui ne tourne plus quand on débraye ?',
      },
      {
        title: 'Niveau 2 — Aide à l\'observation 3D',
        body: 'Boîte au point mort, pédale relâchée : activez « Surligner les parties en rotation » et observez que l\'ARBRE PRIMAIRE et tous ses pignons fixes (et les pignons fous du secondaire qu\'ils entraînent) tournent à vide, alors que le secondaire/pont est à l\'arrêt. Appuyez ensuite sur « Pédale d\'embrayage » : l\'arbre primaire ralentit et s\'arrête, le bruit disparaît.',
      },
      {
        title: 'Niveau 3 — Expertise et chiffrage',
        body: 'Pièce identifiée (ROUGE d\'alerte) : ROULEMENT D\'ARBRE PRIMAIRE (côté embrayage).\nExplication physique : au point mort, pédale relâchée, seul l\'arbre primaire (et le disque d\'embrayage) tourne à N_moteur ; ses roulements sont donc les seuls organes de boîte sollicités en rotation. Pédale enfoncée, le primaire se désolidarise du moteur et s\'arrête : le bruit disparaît. Piste/billes écaillées → sifflement croissant avec le régime.\nPièces à remplacer : roulement d\'arbre primaire (et son jumeau si usé), spi d\'arbre primaire, circlip, joint de couvercle ; huile de boîte. Contrôler butée d\'embrayage et portée de l\'arbre.\nOrdre de grandeur (indicatif) : MO ≈ 3,5–4,5 h · pièces ≈ 60–150 € HT.',
      },
    ],
    protocole: [
      { t: 'Préparer', d: 'Confirmer le diagnostic au stéthoscope : bruit maxi sur la zone carter d\'embrayage, point mort pédale relâchée.' },
      { t: 'Déposer la boîte', d: 'Déposer boîte ; déposer le mécanisme d\'embrayage pour accéder à l\'arbre primaire.' },
      { t: 'Métrologie du roulement', d: 'Jeu radial au comparateur, bague extérieure bloquée : neuf ≤ 0,02 mm, limite 0,05 mm. Mesuré ≈ 0,12 mm + points durs à la rotation → remplacer.', ctl: { label: 'Jeu radial roulement primaire', neuf: 0.02, limite: 0.05, mesure: 0.12, unit: 'mm', sens: 'max' } },
      { t: 'Extraction / pose', d: 'Extraire à l\'extracteur à griffes (appui sur la bague montée). Poser le roulement neuf en chauffant la bague intérieure (≈ 120 °C) ou à la presse sur la bague montée UNIQUEMENT.' },
      { t: 'Spi et joints', d: 'Spi d\'arbre primaire neuf, lèvre huilée, pose à la douille. Joint / pâte d\'étanchéité neufs.' },
      { t: 'Jeu axial', d: 'Régler le jeu axial de l\'arbre primaire à la cale (≈ 0,05–0,10 mm, indicatif).' },
      { t: 'Couples de serrage (indicatifs)', d: 'Vis de carter 25 Nm en croix ; vis de mécanisme d\'embrayage selon constructeur (≈ 20 Nm).' },
      { t: 'Remplissage et essai', d: OIL_NOTE + ' Essai : point mort pédale relâchée, absence de bruit ; contrôle de fuite au spi.' },
    ],
  },
];

/** Évalue le choix de l'élève « Cliquer sur la pièce défectueuse » */
export function checkDiagnosis(sc, partId, info) {
  const name = info ? info.name : partId;
  if (sc.culprits.accept.includes(partId)) {
    const complete = sc.culprits.main.length > 1
      ? ' Pensez aussi à contrôler les autres pièces usées associées (voir niveau 3).' : '';
    return { ok: true, level: 'ok', msg: `✔ Diagnostic VALIDÉ — « ${name} » est bien en cause.${complete} Passez au protocole de réparation atelier.` };
  }
  if (sc.culprits.related.includes(partId)) return { ok: false, level: 'near', msg: `⚠ « ${name} » : proche, mais pas la cause première. ${sc.related_msg}` };
  return { ok: false, level: 'bad', msg: `✖ « ${name} » n'explique pas ce symptôme. Relisez l'ordre de réparation et demandez un indice.` };
}


/* ============================================================================
 * Démarche « Chercher la panne » : reproduire → observer → hypothèses → mesurer → désigner
 * ========================================================================== */
const CTL = (label, neuf, limite, mesure, unit, sens, note) => ({ label, neuf, limite, mesure, unit, sens, note });

Object.assign(SCENARIOS.find((s) => s.id === 'A'), {
  demo: { label: '▶ Reproduire : rétrograder 3ème → 2ème', action: 'gear2' },
  observe: [
    { t: 'Zoomer sur le synchroniseur 1/2 au ralenti', act: 'loupe12' },
    { t: 'Activer les Rayons X pour voir le pignon fou de 2ème (gris)', act: 'xray' },
    { t: 'Regarder Δ (écart de régime) : il ne tombe pas à zéro', act: null },
  ],
  hypotheses: [
    { t: 'Anneau de synchro de 2ème : cône de friction usé', ok: true, why: 'Oui : le cône n\'a plus assez de pouvoir de synchronisation, surtout à froid (huile visqueuse).' },
    { t: 'Dents de crabotage de la 2ème usées en dépouille', ok: false, why: 'Ce défaut ferait SAUTER la vitesse en décélération, pas craquer le passage.' },
    { t: 'Roulement d\'arbre primaire usé', ok: false, why: 'Un roulement fait du bruit en rotation, pas un craquement au passage de rapport.' },
    { t: 'Embrayage qui ne débraye pas complètement', ok: false, why: 'Cela toucherait TOUS les rapports et ne dépendrait pas de la température d\'huile.' },
    { t: 'Niveau d\'huile trop haut', ok: false, why: 'Un excès d\'huile provoque échauffement et fuites, pas un craquement localisé sur la 2ème.' },
  ],
  mesures: {
    'bague-2': CTL('Jeu anneau / cône de 2ème', 1.2, 0.5, 0.3, 'mm', 'min', 'Cône aplani, rainures d\'évacuation d\'huile effacées.'),
    'bague-1': CTL('Jeu anneau / cône de 1ère', 1.2, 0.5, 0.95, 'mm', 'min'),
    's-2': CTL('Usure radiale du cône mâle de 2ème', 0, 0.05, 0.01, 'mm', 'max'),
    'baladeur-12': CTL('Usure des chanfreins de denture', 0, 0.4, 0.15, 'mm', 'max'),
    'cale-12': CTL('Jeu axial du pignon fou de 2ème', 0.2, 0.3, 0.22, 'mm', 'max'),
    'fourchette-12': CTL('Jeu patin / gorge', 0.3, 0.6, 0.42, 'mm', 'max'),
    'moyeu-12': CTL('Jeu angulaire des cannelures', 0.1, 0.3, 0.12, 'mm', 'max'),
  },
});
Object.assign(SCENARIOS.find((s) => s.id === 'B'), {
  demo: { label: '▶ Reproduire : lever le pied en 3ème (frein moteur)', action: 'decel' },
  observe: [
    { t: 'Zoomer sur le synchroniseur 3/4 au ralenti', act: 'loupe34' },
    { t: 'Comparer : en accélération la 3ème tient, en frein moteur elle ressort', act: null },
    { t: 'Observer la fourchette 3/4 (verte) : elle suit le baladeur', act: null },
  ],
  hypotheses: [
    { t: 'Dents de crabotage usées en dépouille + jeu axial', ok: true, why: 'Oui : sous couple inversé, les flancs usés repoussent le baladeur vers le neutre.' },
    { t: 'Anneau de synchro de 3ème usé', ok: false, why: 'Il ferait craquer le passage de la 3ème, pas sauter la vitesse une fois engagée.' },
    { t: 'Roulement d\'arbre primaire usé', ok: false, why: 'Il fait du bruit, il ne désengage pas une vitesse.' },
    { t: 'Câble de commande de boîte déréglé', ok: false, why: 'Un câble déréglé gêne la sélection ; il ne dépend pas du sens du couple.' },
    { t: 'Huile de boîte trop épaisse', ok: false, why: 'L\'huile n\'a aucun effet sur le maintien axial d\'un baladeur.' },
  ],
  mesures: {
    'baladeur-34': CTL('Dépouille des dents du baladeur 3/4', 3.0, 1.0, 0.2, '°', 'min', 'Becs arrondis : plus de dépouille.'),
    's-3': CTL('Dépouille des crabots du pignon fou de 3ème', 3.0, 1.0, 0.4, '°', 'min', 'Flancs matés, dépouille perdue.'),
    'circlip-moyeu-34': CTL('Jeu axial moyeu 3/4', 0.1, 0.3, 0.55, 'mm', 'max', 'Jeu excessif qui amplifie le défaut.'),
    'cale-34': CTL('Jeu axial pignon fou 3ème', 0.2, 0.3, 0.55, 'mm', 'max'),
    'bague-3': CTL('Jeu anneau / cône de 3ème', 1.2, 0.5, 0.9, 'mm', 'min'),
    'bague-4': CTL('Jeu anneau / cône de 4ème', 1.2, 0.5, 0.88, 'mm', 'min'),
    'fourchette-34': CTL('Jeu patin / gorge', 0.3, 0.6, 0.45, 'mm', 'max'),
    'moyeu-34': CTL('Jeu angulaire des cannelures', 0.1, 0.3, 0.14, 'mm', 'max'),
  },
});
Object.assign(SCENARIOS.find((s) => s.id === 'C'), {
  demo: { label: '▶ Reproduire : appuyer puis relâcher la pédale', action: 'pedal' },
  observe: [
    { t: 'Surligner les parties en rotation : seul le primaire tourne', act: 'rotHL' },
    { t: 'Activer le son d\'atelier pour entendre le roulement', act: 'sound' },
    { t: 'Pédale enfoncée : l\'arbre primaire s\'arrête, le bruit disparaît', act: null },
  ],
  hypotheses: [
    { t: 'Roulement d\'arbre primaire usé', ok: true, why: 'Oui : c\'est le seul organe de boîte qui tourne au point mort pédale relâchée.' },
    { t: 'Anneau de synchro usé', ok: false, why: 'Un anneau ne fait pas de bruit en rotation et ne tourne pas "en charge" au point mort.' },
    { t: 'Spi de différentiel qui fuit', ok: false, why: 'Une fuite fait des gouttes, pas un sifflement lié au régime.' },
    { t: 'Pignon de 5ème piqué', ok: false, why: 'Il ferait du bruit EN CHARGE, boîte engagée, pas au point mort.' },
    { t: 'Disque d\'embrayage qui patine', ok: false, why: 'Le patinage se voit en accélération (régime qui monte) et ne fait pas de sifflement.' },
  ],
  mesures: {
    'rlt-prim-av': CTL('Jeu radial du roulement primaire AV', 0.02, 0.05, 0.12, 'mm', 'max', 'Points durs à la rotation, bague écaillée.'),
    'rlt-prim-ar': CTL('Jeu radial du roulement primaire AR', 0.02, 0.05, 0.03, 'mm', 'max'),
    'arbre-primaire': CTL('Faux-rond entre pointes', 0.01, 0.03, 0.015, 'mm', 'max'),
    'disque-embrayage': CTL('Épaisseur de garniture', 8.5, 6.0, 7.4, 'mm', 'min'),
    'rlt-sec-av': CTL('Jeu axial du roulement secondaire AV', 0.02, 0.06, 0.03, 'mm', 'max'),
  },
});

/** Résultat d'un contrôle : mesure spécifique au cas, sinon « conforme » (élimination) */
export function measurePart(sc, partId) {
  const c = sc && sc.mesures && sc.mesures[partId];
  if (!c) return { generic: true, bad: false, text: sc ? 'Contrôle visuel et cotes : conforme, aucune usure anormale relevée.' : 'Aucun cas en cours : choisissez un cas dans « Chercher la panne » pour obtenir des mesures.' };
  const bad = c.sens === 'min' ? c.mesure < c.limite : c.mesure > c.limite;
  return { ...c, bad };
}

Object.assign(SCENARIOS.find((s) => s.id === 'A'), { retenir: 'Un synchroniseur doit égaliser les vitesses AVANT le crabotage. Si le cône de l\'anneau laiton est usé, le pouvoir de synchro baisse : le pignon fou n\'est plus freiné/accéléré assez vite, surtout à froid — le baladeur force alors le passage : craquement. Remède : kit synchro + huile GL-4.' });
Object.assign(SCENARIOS.find((s) => s.id === 'B'), { retenir: 'Les crabots ont une dépouille qui « tire » le baladeur dans l\'engagement sous couple moteur. Usée, elle repousse le baladeur quand le couple s\'inverse (frein moteur). Remède : remplacer baladeur + pignon fou, et régler le jeu axial.' });
Object.assign(SCENARIOS.find((s) => s.id === 'C'), { retenir: 'Au point mort pédale relâchée, seul l\'arbre primaire tourne : le bruit qui disparaît en débrayant vient donc de ses roulements. Remède : roulement d\'arbre primaire + spi neufs, jeu axial réglé.' });
