/* ============================================================================
 * atelierBVA.js — Cas pratiques de diagnostic du MODULE 2 (boîte automatique 6 rapports)
 *  Même structure que atelierScenarios.js (BVM) : 3 niveaux d'indice, étapes, mesures, protocole de réparation.
 *  Idée directrice : le TABLEAU D'ENGAGEMENT est la clé du diagnostic —
 *      on repère quels rapports sont touchés, puis on cherche l'élément (embrayage / frein) COMMUN à ces rapports.
 *  Valeurs de métrologie / pressions / durées / prix : ORDRES DE GRANDEUR pédagogiques.
 * ========================================================================== */

const ATF = 'Huile ATF de la spécification constructeur EXACTE (≈ 7 L en remplissage complet, valeur indicative) — niveau à la température prescrite, moteur tournant, sélecteur passé sur toutes les positions.';
const CTL = (label, neuf, limite, mesure, unit, sens, note) => ({ label, neuf, limite, mesure, unit, sens, note });

export const SCENARIOS_BVA = [
  /* ====================================================================== A */
  {
    id: 'A',
    title: 'Le moteur s\'emballe en 3ème, 5ème et en marche arrière',
    short: 'Patinage 3ème / 5ème / AR',
    or: {
      client: '« Quand je passe la 3ème, le moteur monte dans les tours mais la voiture n\'accélère pas, puis ça accroche d\'un coup. Pareil en 5ème, et la marche arrière avance à peine. La 1ère, la 2ème, la 4ème et la 6ème sont normales. Ça sent le brûlé. »',
      vehicule: 'Berline 2.0 diesel, boîte automatique 6 rapports, 187 000 km, huile jamais changée.',
      conditions: 'Sélecteur sur D · accélération · 3ème (ou 5ème, ou AR) · huile chaude ≈ 95 °C',
    },
    setup: { oilT: 95, rpm: 3000, gear: 3, load: 'accel', hintTools: '3ème maintenue, accélération. Regardez le régime moteur et le patinage (+ mesures).' },
    faults: { health: { b: 0.28 } },
    alertIds: ['emb-b'],
    culprits: { main: ['emb-b'], accept: ['emb-b'], related: ['piston-b', 'ev-b', 'arbre-s3', 'ps-porte', 'filtre', 'carter-huile', 'conduite-b'] },
    related_msg: 'Ce composant fait partie du circuit de B, mais la cause première est l\'USURE DES DISQUES GARNIS de l\'EMBRAYAGE B (le seul élément commun aux rapports 3, 5 et AR).',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : emballement du moteur et accrochage tardif en 3ème, en 5ème et en marche arrière. 1ère, 2ème, 4ème et 6ème normales ; odeur d\'huile brûlée.\nQuestion à vous poser : ces trois rapports ont-ils un élément de commande en commun, que n\'ont pas les rapports sains ?' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Ouvrez le tableau d\'engagement (panneau de gauche) : 3 = A+B, 5 = B+E, AR = B+D. Lancez « Essai des rapports » : seuls 3, 5 et AR patinent.\nÉlimination : A est sain (1, 2, 4 passent), D est sain (1 passe), E est sain (4 et 6 passent), C est sain (2 et 6 passent). Il reste B. Activez les Rayons X : le pack B clignote en rouge.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : EMBRAYAGE B — disques garnis usés.\nExplication physique : le couple transmis par un multidisque vaut C = μ · F · R_moy · n (μ coefficient de friction, F force du piston, n nombre de surfaces). Les garnitures amincies et glacées font chuter μ et le piston arrive en fin de course : la capacité de couple devient inférieure au couple moteur × rapport. L\'embrayage patine : l\'énergie se dissipe en chaleur (huile brûlée, noire), le régime moteur monte sans que la vitesse suive.\nPièces à remplacer : kit disques de B (garnis + lisses), joints de piston, ressort de rappel si affaissé ; vidange complète, filtre neuf ; contrôler cannelures du tambour et état du carter d\'huile (limaille) ; adaptation par outil de diagnostic.\nOrdre de grandeur (indicatif) : MO ≈ 6–9 h · kit disques ≈ 120–300 € HT · huile + filtre ≈ 70–110 € HT.' },
    ],
    protocole: [
      { t: 'Préparer et sécuriser', d: 'Véhicule sur pont, batterie débranchée, boîte tiédie (< 40 °C avant dépose). Lecture des défauts (patinage, rapport de sortie) avant intervention.' },
      { t: 'Déposer et ouvrir la boîte', d: 'Selon la gamme : dépose de la boîte, du convertisseur (à rincer ou à échanger), du carter d\'huile, du bloc hydraulique, de la pompe puis des tambours.' },
      { t: 'Métrologie des disques de B', d: 'Épaisseur d\'un disque garni : neuf 1,9 mm — limite 1,5 mm. Mesuré ≈ 1,05 mm, garniture brûlée → HORS TOLÉRANCE : remplacement du jeu complet.', ctl: { label: 'Épaisseur d\'un disque garni de B', neuf: 1.9, limite: 1.5, mesure: 1.05, unit: 'mm', sens: 'min' } },
      { t: 'Jeu de pack', d: 'Piston plaqué, jeu mesuré à la jauge d\'épaisseur : neuf 1,2 mm — limite 2,2 mm. Mesuré ≈ 3,1 mm → course excessive (usure cumulée).', ctl: { label: 'Jeu de pack de B', neuf: 1.2, limite: 2.2, mesure: 3.1, unit: 'mm', sens: 'max' } },
      { t: 'Remplacer le kit', d: 'Disques garnis + lisses trempés dans l\'ATF avant pose, alternance garni/lisse respectée, joints de piston neufs, ressort de rappel vérifié, cale de jeu ajustée.' },
      { t: 'Hydraulique et filtre', d: 'Rincer le circuit, nettoyer le bloc hydraulique et l\'aimant, filtre neuf ; contrôler le refroidisseur d\'huile (débit) avant remontage.' },
      { t: 'Remontage — précautions', d: 'Segments d\'arbre neufs, billes / ressorts du bloc à leur place d\'origine, vis du bloc serrées en spirale au couple (indicatif ≈ 8-10 Nm).' },
      { t: 'Remplissage, apprentissage, essai', d: ATF + ' Effacer les adaptations puis faire l\'apprentissage ; essai : 1→6 et AR, test de calage de contrôle, aucun emballement.' },
    ],
    demo: { label: '▶ Reproduire : accélérer en 3ème', action: 'bvaAccel' },
    observe: [
      { t: 'Lancer l\'« Essai des rapports » : quels rapports patinent ?', act: 'bvaScan' },
      { t: 'Activer les Rayons X : l\'élément qui patine clignote en rouge', act: 'xray' },
      { t: 'Afficher les mesures avancées : patinage, huile, couple aux roues', act: 'tele' },
    ],
    hypotheses: [
      { t: 'Disques garnis de l\'embrayage B usés', ok: true, why: 'Oui : B est le seul élément commun aux rapports qui patinent (3 = A+B, 5 = B+E, AR = B+D).' },
      { t: 'Pompe à huile usée (pression de ligne faible)', ok: false, why: 'Une pression de ligne basse ferait patiner TOUS les rapports, surtout à chaud, pas seulement 3, 5 et AR.' },
      { t: 'Embrayage A usé', ok: false, why: 'A est appliqué en 1, 2, 3 et 4 : or la 1, la 2 et la 4 sont normales.' },
      { t: 'Convertisseur de couple défectueux', ok: false, why: 'Un convertisseur défectueux perturberait tous les rapports et le démarrage, pas seulement trois rapports précis.' },
      { t: 'Électrovanne de pontage coincée', ok: false, why: 'Elle agit sur le pontage (3ème et plus, à vitesse stabilisée), pas sur la marche arrière à l\'arrêt.' },
    ],
    mesures: {
      'emb-b': CTL('Épaisseur d\'un disque garni de B', 1.9, 1.5, 1.05, 'mm', 'min', 'Garniture amincie, glacée, odeur de brûlé.'),
      'piston-b': CTL('Course du piston de B (jeu de pack)', 1.2, 2.2, 3.1, 'mm', 'max', 'Course excessive : conséquence de l\'usure des disques.'),
      'emb-a': CTL('Épaisseur d\'un disque garni de A', 1.9, 1.5, 1.8, 'mm', 'min'),
      'emb-e': CTL('Épaisseur d\'un disque garni de E', 1.9, 1.5, 1.75, 'mm', 'min'),
      'frein-c': CTL('Épaisseur d\'un disque garni de C', 1.9, 1.5, 1.8, 'mm', 'min'),
      'frein-d': CTL('Épaisseur d\'un disque garni de D', 1.9, 1.5, 1.7, 'mm', 'min'),
      'ev-b': CTL('Résistance de la bobine de l\'électrovanne B', 5.0, 6.0, 5.1, 'Ω', 'max'),
      'bloc-hydraulique': CTL('Pression de ligne à 3000 tr/min', 10.0, 8.0, 9.6, 'bar', 'min'),
      'carter-huile': CTL('Débris de friction sur l\'aimant', 0, 50, 180, 'mg', 'max', 'Conséquence du patinage, pas la cause.'),
      'filtre': CTL('Perte de charge du filtre', 0.1, 0.4, 0.2, 'bar', 'max'),
    },
    retenir: 'Le tableau d\'engagement est la clé : les rapports en panne partagent un élément commun, les rapports sains l\'innocentent. Ici 3, 5 et AR partagent B. Un multidisque transmet C = μ·F·R·n : garnitures usées + piston en fin de course = patinage, chaleur, huile brûlée. Remède : kit disques de B, vidange complète, filtre, adaptation.',
  },

  /* ====================================================================== B */
  {
    id: 'B',
    title: 'Pas de 1ère ni de marche arrière',
    short: 'Pas de 1ère ni d\'AR',
    or: {
      client: '« En D comme en R, le moteur monte mais la voiture ne bouge pas, ou à peine. Si je passe en manuel sur la 2, ça roule normalement et les vitesses suivantes passent. Le calculateur n\'affiche rien. »',
      vehicule: 'Monospace 1.6 HDi, boîte automatique 6 rapports, 164 000 km, vidange non faite.',
      conditions: 'Sélecteur sur D ou R au départ arrêté · régime ≈ 2500 tr/min · huile chaude',
    },
    setup: { oilT: 85, rpm: 2500, gear: 1, load: 'accel', hintTools: '1ère engagée : la voiture ne démarre pas (régime élevé, vitesse nulle).' },
    faults: { leak: { d: 0.96 } },
    alertIds: ['piston-d'],
    culprits: { main: ['piston-d'], accept: ['piston-d'], related: ['frein-d', 'ev-d', 'conduite-d', 'bloc-hydraulique', 'rv-porte'] },
    related_msg: 'Cet organe fait partie de la chaîne de commande de D, mais les mesures montrent que la commande ET la pression en amont sont correctes : la pression disparaît AU PISTON (fuite des joints).',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : aucune motricité en D (1ère) ni en R, mais la 2ème maintenue en manuel fonctionne ensuite normalement. Aucun code défaut.\nQuestion à vous poser : quel élément est appliqué en 1ère ET en marche arrière, et n\'est PAS utilisé en 2ème, 3ème, 4ème, 5ème, 6ème ?' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Tableau d\'engagement : 1 = A+D, AR = B+D. D est commun et seulement là. Lancez « Essai des rapports » : 1 et AR ne donnent aucune vitesse (patinage 100 %).\nPassez en 1ère : l\'électrovanne D s\'allume en VERT (commandée) et le canal D passe en orange… mais pas le piston : mesurez la pression ELEC → CANAL → PISTON.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : PISTON du frein D — joints d\'étanchéité (lèvres coupées).\nExplication physique : le frein D est appliqué par la force F = p·S exercée par le piston sur le pack. La pression de ligne et le canal d\'alimentation sont corrects (≈ 9 bar), mais le joint fuit : la pression au piston reste à ≈ 1 bar, la force est insuffisante, D ne bloque plus le porte-satellites du Ravigneaux → 1ère et AR impossibles. Les autres rapports n\'utilisent pas D : ils fonctionnent.\nPièces à remplacer : joints de piston de D (jeu complet), joints de canal, huile + filtre ; contrôler état des disques (surchauffe) et cannelures du carter.\nOrdre de grandeur (indicatif) : MO ≈ 6–8 h · joints ≈ 30–80 € HT · huile + filtre ≈ 70–110 € HT.' },
    ],
    protocole: [
      { t: 'Préparer et sécuriser', d: 'Pont élévateur, batterie débranchée, lecture des défauts. Prise de pression en place avant dépose (prise de test du frein D).' },
      { t: 'Contrôle hydraulique avant dépose', d: 'Pression à la prise de D, commandée : neuf 9 bar — limite 7 bar. Mesuré ≈ 0,8 bar alors que la pression de ligne est correcte → fuite en aval du bloc.', ctl: { label: 'Pression au piston D (commandé)', neuf: 9.0, limite: 7.0, mesure: 0.8, unit: 'bar', sens: 'min' } },
      { t: 'Contrôle électrique', d: 'Résistance de l\'électrovanne D : 5,0 Ω ± 0,5 à froid. Mesuré 5,1 Ω, signal MLI présent → l\'électrovanne n\'est pas en cause.', ctl: { label: 'Résistance de l\'électrovanne D', neuf: 5.0, limite: 6.0, mesure: 5.1, unit: 'Ω', sens: 'max' } },
      { t: 'Ouvrir la boîte', d: 'Dépose de la boîte, du carter d\'huile, du bloc hydraulique, puis du frein D (circlip, pack, piston).' },
      { t: 'Remplacer les joints de piston', d: 'Lèvres coupées / durcies : jeu de joints complet, piston sans rayure ; huiler à l\'ATF, lèvres du côté pression, introduire sans cisailler.' },
      { t: 'Contrôle du pack D', d: 'Disques garnis : épaisseur neuf 1,9 mm — limite 1,5 mm ; remplacer s\'ils ont chauffé par le patinage.', ctl: { label: 'Épaisseur d\'un disque garni de D', neuf: 1.9, limite: 1.5, mesure: 1.7, unit: 'mm', sens: 'min' } },
      { t: 'Remontage — précautions', d: 'Bloc hydraulique : billes / ressorts à leur place, serrage en spirale (≈ 8-10 Nm indicatif), joints de canaux neufs.' },
      { t: 'Remplissage, apprentissage, essai', d: ATF + ' Essai : D et R au départ arrêté, test de calage (régime ≈ 2400 tr/min), passages 1→2.' },
    ],
    demo: { label: '▶ Reproduire : passer N → D au départ arrêté', action: 'bvaLaunch' },
    observe: [
      { t: 'Ouvrir le tableau d\'engagement : quel élément est commun à 1 et AR ?', act: 'bvaTable' },
      { t: 'Lancer l\'« Essai des rapports » : seuls 1 et AR sont sans vitesse', act: 'bvaScan' },
      { t: 'Regarder le frein D : commande verte, mais pas d\'orange au piston', act: 'xray' },
    ],
    hypotheses: [
      { t: 'Fuite d\'étanchéité au piston du frein D', ok: true, why: 'Oui : commande OK, pression de ligne OK, mais la pression n\'arrive pas au piston → fuite aux joints.' },
      { t: 'Électrovanne D coupée (bobine HS)', ok: false, why: 'Une bobine coupée donnerait un code défaut et une résistance infinie ; ici la bobine est à 5,1 Ω et la commande est bien envoyée.' },
      { t: 'Pompe à huile usée', ok: false, why: 'Une pression de ligne basse toucherait tous les rapports, pas seulement 1 et AR.' },
      { t: 'Convertisseur de couple défectueux', ok: false, why: 'La 2ème fonctionne : le convertisseur transmet bien le couple.' },
      { t: 'Embrayage A usé', ok: false, why: 'A est appliqué en 2, 3 et 4 qui fonctionnent ; l\'usure de A ne supprimerait pas la marche arrière.' },
    ],
    mesures: {
      'piston-d': CTL('Pression au piston D (commandé)', 9.0, 7.0, 0.8, 'bar', 'min', 'La pression ne se maintient pas : fuite aux joints.'),
      'ev-d': CTL('Résistance de l\'électrovanne D', 5.0, 6.0, 5.1, 'Ω', 'max'),
      'conduite-d': CTL('Pression dans le canal D (amont)', 9.0, 7.0, 9.2, 'bar', 'min'),
      'bloc-hydraulique': CTL('Pression de ligne à 2500 tr/min', 10.0, 8.0, 9.7, 'bar', 'min'),
      'frein-d': CTL('Épaisseur d\'un disque garni de D', 1.9, 1.5, 1.7, 'mm', 'min'),
      'emb-a': CTL('Épaisseur d\'un disque garni de A', 1.9, 1.5, 1.85, 'mm', 'min'),
      'emb-b': CTL('Épaisseur d\'un disque garni de B', 1.9, 1.5, 1.8, 'mm', 'min'),
      'ev-b': CTL('Résistance de l\'électrovanne B', 5.0, 6.0, 5.0, 'Ω', 'max'),
      'filtre': CTL('Perte de charge du filtre', 0.1, 0.4, 0.15, 'bar', 'max'),
    },
    retenir: 'Deux rapports en panne (1 et AR) : on cherche ce qu\'ils ont en commun, ici le frein D. Puis on suit la chaîne ordinateur → électrovanne → canal → piston : commande OK et pression en amont OK, mais pression nulle au piston = fuite aux joints du piston. Remède : joints de piston de D, huile, filtre.',
  },

  /* ====================================================================== C */
  {
    id: 'C',
    title: 'Ça broute à vitesse stabilisée (pontage)',
    short: 'Broutement au pontage',
    or: {
      client: '« Vers 60-80 km/h, à vitesse stabilisée, la voiture vibre comme sur des bandes sonores. Si j\'accélère franchement ou que je freine, la vibration disparaît. Au démarrage et en accélération, rien. »',
      vehicule: 'SUV 2.2 diesel, boîte automatique 6 rapports, 142 000 km, ATF d\'origine jamais renouvelée.',
      conditions: '5ème · vitesse stabilisée (charge légère) · ≈ 2200 tr/min · huile chaude',
    },
    setup: { oilT: 90, rpm: 2200, gear: 5, load: 'stab', hintTools: '5ème stabilisée : le pontage se ferme, le régime moteur oscille.' },
    faults: { lockupBad: true },
    alertIds: ['cv-pontage'],
    culprits: { main: ['cv-pontage'], accept: ['cv-pontage'], related: ['ev-pontage', 'cv-amortisseur', 'carter-huile', 'conduite-pontage', 'cv-capot', 'cv-turbine'] },
    related_msg: 'Cet organe fait partie de la chaîne du pontage, mais la cause première est l\'USURE / le GLAÇAGE DE LA GARNITURE du piston de pontage qui accroche et glisse de façon irrégulière.',
    hints: [
      { title: 'Niveau 1 — Ordre de Réparation', body: 'Plainte client : vibration à vitesse stabilisée (50-80 km/h), qui disparaît dès qu\'on accélère fort ou qu\'on freine. Rien au démarrage ni dans les rapports bas.\nQuestion à vous poser : qu\'est-ce qui change quand on accélère fort ou qu\'on freine ? Quel organe de la chaîne cesse alors d\'agir ?' },
      { title: 'Niveau 2 — Aide à l\'observation 3D', body: 'Rapport 5 en « Stabilisé » : regardez la télémétrie (+ mesures) : « Convertisseur » passe à PONTÉ et le régime moteur oscille de ±70 tr/min environ. En « Accélération » à bas régime le pontage s\'ouvre : l\'oscillation disparaît.\nZoom conv (bouton « Voir le convertisseur ») : le piston de pontage (orange) vibre contre le capot.' },
      { title: 'Niveau 3 — Expertise et chiffrage', body: 'Pièce identifiée (ROUGE d\'alerte) : GARNITURE DU PISTON DE PONTAGE (convertisseur).\nExplication physique : le pontage est piloté en glissement modulé (≈ 30-60 tr/min) pour amortir les à-coups. Avec une garniture glacée et de l\'huile dégradée, le coefficient de friction ne se maintient pas : le couple transmis varie en « stick-slip » (adhérence puis glissement) à plusieurs hertz : c\'est le BROUTEMENT. Il apparaît seulement quand le pontage est fermé (vitesse stabilisée) et disparaît pontage ouvert.\nPièces à remplacer : convertisseur de couple (échange standard : on ne le démonte pas), vidange complète + rinçage, filtre, nettoyage du refroidisseur ; contrôler l\'électrovanne de pontage.\nOrdre de grandeur (indicatif) : MO ≈ 5–7 h · convertisseur ≈ 300–600 € HT · huile + filtre ≈ 70–110 € HT.' },
    ],
    protocole: [
      { t: 'Préparer et sécuriser', d: 'Essai routier avec valise : confirmer que le broutement apparaît pontage fermé (état du pontage, glissement de pontage mesuré).' },
      { t: 'Contrôles préalables', d: 'Niveau et état de l\'ATF (couleur, odeur, particules), résistance de l\'électrovanne de pontage : 5,0 Ω ± 0,5. Mesuré 5,2 Ω → conforme.', ctl: { label: 'Résistance de l\'électrovanne de pontage', neuf: 5.0, limite: 6.0, mesure: 5.2, unit: 'Ω', sens: 'max' } },
      { t: 'Contrôle du convertisseur déposé', d: 'Garniture du pontage : épaisseur neuf 0,9 mm — limite 0,5 mm. Estimée ≈ 0,3 mm, surface glacée et bleuie → HORS TOLÉRANCE : convertisseur à remplacer (échange standard).', ctl: { label: 'Épaisseur de la garniture de pontage', neuf: 0.9, limite: 0.5, mesure: 0.3, unit: 'mm', sens: 'min' } },
      { t: 'Contrôle de l\'amortisseur de torsion', d: 'Jeu angulaire du moyeu : neuf 8° — limite 14°. Mesuré ≈ 9° → conforme.', ctl: { label: 'Jeu angulaire de l\'amortisseur', neuf: 8, limite: 14, mesure: 9, unit: '°', sens: 'max' } },
      { t: 'Rinçage et circuit d\'huile', d: 'Vidange totale, rinçage du circuit, remplacement du filtre, nettoyage ou remplacement du refroidisseur (débris de friction).' },
      { t: 'Pose du convertisseur', d: 'Remplir le convertisseur neuf, vérifier l\'enfoncement complet (jeu axial à la cloche), vis du plateau neuves au couple.' },
      { t: 'Remplissage, apprentissage, essai', d: ATF + ' Adaptation du pontage par outil de diagnostic ; essai à vitesse stabilisée 50-80 km/h : plus de broutement.' },
    ],
    demo: { label: '▶ Reproduire : vitesse stabilisée en 5ème', action: 'bvaCruise' },
    observe: [
      { t: 'Afficher les mesures avancées : le convertisseur passe à PONTÉ', act: 'tele' },
      { t: 'Voir le convertisseur : le piston de pontage vibre', act: 'bvaConv' },
      { t: 'Comparer : en « Accélération » à bas régime le pontage s\'ouvre, la vibration cesse', act: null },
    ],
    hypotheses: [
      { t: 'Garniture du pontage glacée / usée (broutement)', ok: true, why: 'Oui : le broutement apparaît pontage fermé et disparaît pontage ouvert.' },
      { t: 'Embrayage E qui patine', ok: false, why: 'Un embrayage qui patine fait monter le régime sans accélération (emballement), il ne fait pas vibrer à vitesse stabilisée.' },
      { t: 'Roulement de roue usé', ok: false, why: 'Il varie avec la vitesse du véhicule, pas avec l\'état du pontage, et ne disparaît pas en accélérant.' },
      { t: 'Roue libre du stator qui glisse', ok: false, why: 'Elle agit au démarrage (multiplication de couple) : défaut de démarrage mou, pas de vibration à 70 km/h.' },
      { t: 'Pompe à huile usée', ok: false, why: 'Elle provoquerait des patinages en charge et des passages mous, pas une vibration pontage fermé.' },
    ],
    mesures: {
      'cv-pontage': CTL('Épaisseur de la garniture de pontage', 0.9, 0.5, 0.3, 'mm', 'min', 'Garniture glacée, bleuie : adhérence irrégulière.'),
      'ev-pontage': CTL('Résistance de l\'électrovanne de pontage', 5.0, 6.0, 5.2, 'Ω', 'max'),
      'cv-amortisseur': CTL('Jeu angulaire de l\'amortisseur', 8, 14, 9, '°', 'max'),
      'carter-huile': CTL('Débris de friction sur l\'aimant', 0, 50, 140, 'mg', 'max', 'Conséquence de l\'usure de la garniture.'),
      'emb-e': CTL('Épaisseur d\'un disque garni de E', 1.9, 1.5, 1.8, 'mm', 'min'),
      'cv-roue-libre': CTL('Blocage de la roue libre (couple d\'essai)', 25, 15, 24, 'N·m', 'min'),
      'bloc-hydraulique': CTL('Pression de ligne en 5ème stabilisée', 6.5, 5.0, 6.2, 'bar', 'min'),
    },
    retenir: 'Un broutement qui n\'apparaît qu\'à vitesse stabilisée et disparaît en accélérant fort ou en freinant vient du PONTAGE du convertisseur (fermé = vibration, ouvert = rien). Garniture glacée + huile dégradée = stick-slip. Remède : convertisseur échangé, rinçage, filtre, ATF, adaptation.',
  },
];
