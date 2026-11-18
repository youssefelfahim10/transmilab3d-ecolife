/* ============================================================================
 * partsData.js — Fiche technique « Théorie -> Diagnostic terrain » de chaque pièce
 * 4 volets : Rôle cinématique · Contrôle et métrologie · Symptômes client · Remontage
 * NB : valeurs pédagogiques génériques — toujours se référer à la documentation constructeur.
 * ========================================================================== */
import { GEAR_PAIRS, REV, FD, DIFF, IB, IR, IP, PAIR, SPLINE_Z } from './layout.js';

const fr = (x, d = 3) => x.toFixed(d).replace('.', ',');
const ORD = { 1: '1ère', 2: '2ème', 3: '3ème', 4: '4ème', 5: '5ème' };
const OIL = 'Huile de boîte préconisée (type 75W-80, norme API GL-4) : ne PAS utiliser de GL-5 (additifs soufrés EP) qui attaque le laiton des anneaux de synchro.';

export const CAT = {
  carter: 'Carters & étanchéité', arbre: 'Arbres', pignon: 'Pignons & couple conique', synchro: 'Synchroniseurs',
  commande: 'Commande (fourchettes)', roulement: 'Roulements & joints', pont: 'Différentiel & transmission', embrayage: 'Embrayage',
  ar: 'Marche arrière', bva: 'Boîte automatique', convertisseur: 'Convertisseur de couple', hydraulique: 'Hydraulique & commande', dct: 'Double embrayage', autre: 'Divers',
};

export const PART_INFO = {};
export const def = (id, o) => { PART_INFO[id] = { id, ...o }; };

/* ------------------------------ Carters ------------------------------ */
def('carter-emb', {
  name: 'Carter d\'embrayage', mat: 'Fonte d\'aluminium sablée', cat: 'carter',
  role: ['Loge l\'embrayage, le couple conique (pignon d\'attaque + couronne) et le différentiel.', 'Reprend les efforts axiaux et radiaux des roulements de pont et assure l\'étanchéité côté moteur.'],
  metro: ['Planéité du plan de joint : écart ≤ 0,05 mm (règle + jeu de cales).', 'Alésages de roulements : pas d\'ovalisation, pas de rotation de la cuvette de roulement.', 'Filetages des vis de fixation : contrôle visuel + essai au calibre.'],
  symp: ['Fuite d\'huile au plan de joint ou aux spi de transmission.', 'Hurlement de pont si le réglage de précharge des roulements est faussé.'],
  remontage: ['Plans de joint dégraissés, pâte d\'étanchéité préconisée en cordon continu.', 'Goupilles de centrage en place ; serrer en croix au couple (≈ 25 Nm, valeur indicative).', 'Remplir par le bouchon de niveau jusqu\'au débordement.'],
});
def('cloison', {
  name: 'Cloison / palier intermédiaire', mat: 'Fonte d\'aluminium', cat: 'carter',
  role: ['Supporte les roulements avant du primaire et du secondaire ainsi que la cuvette du roulement droit de différentiel.', 'Sépare le compartiment d\'embrayage du carter mécanisme.'],
  metro: ['Alésages des roulements AV : ovalisation ≤ 0,02 mm, état de surface.', 'Vérifier la présence des circlips / cales de réglage de jeu axial.'],
  symp: ['Bruit de roulement permanent, jeu axial excessif des arbres.'],
  remontage: ['Respecter le sens des roulements (face ouverte côté pignons).', 'Réglage du jeu axial des arbres par cales selon la procédure constructeur.'],
});
def('carter-meca', {
  name: 'Carter mécanisme', mat: 'Fonte d\'aluminium sablée (couleur #a8b0b8)', cat: 'carter',
  role: ['Enveloppe les trains de pignons et sert de réservoir d\'huile de lubrification (barbotage).', 'Supporte les axes de fourchettes et le roulement arrière des arbres.'],
  metro: ['Fissures aux bossages (ressuage si doute).', 'Planéité du plan de joint arrière : ≤ 0,05 mm.', 'Propreté des canaux de graissage et de l\'aimant de récupération des limailles.'],
  symp: ['Fuite d\'huile, limaille importante sur l\'aimant = usure interne anormale.', 'Surchauffe si niveau d\'huile insuffisant.'],
  remontage: ['Remonter l\'axe de renvoi AR et les axes de fourchettes AVANT de refermer.', 'Pâte d\'étanchéité neuve, serrage en croix (≈ 25 Nm indicatif).', 'Niveau d\'huile au bouchon de remplissage ; boîte à plat.'],
});
def('couvercle-ar', {
  name: 'Couvercle arrière (cache de 5ème)', mat: 'Fonte d\'aluminium', cat: 'carter',
  role: ['Ferme le carter et donne accès au synchroniseur de 5ème et aux roulements arrière.', 'Porte le bouchon de remplissage et le reniflard sur certains modèles.'],
  metro: ['Planéité du plan de joint, état des taraudages.'],
  symp: ['Suintement d\'huile arrière, reniflard obstrué = surpression et fuites aux spi.'],
  remontage: ['Joint / pâte neufs, serrage en croix.', 'Contrôler le jeu axial de l\'arbre primaire après pose (selon procédure).'],
});
def('joint-ar', {
  name: 'Joint de couvercle', mat: 'Élastomère noir mat', cat: 'carter',
  role: ['Étanchéité statique entre carter et couvercle.'], metro: ['Remplacement systématique : pièce non réutilisable.'],
  symp: ['Suintement d\'huile arrière.'], remontage: ['Surfaces propres et sèches, ne pas l\'enduire de graisse sauf préconisation.'],
});

/* ------------------------------ Arbres ------------------------------ */
def('arbre-primaire', {
  name: 'Arbre primaire', mat: 'Acier cémenté trempé (rectifié)', cat: 'arbre',
  role: ['Reçoit le couple moteur par le disque d\'embrayage (cannelures d\'entrée).', 'Porte les pignons FIXES de 1ère, 2ème, 3ème, 4ème, 5ème et de marche arrière : il tourne dès que l\'embrayage est embrayé, même au point mort.'],
  metro: ['Faux-rond ≤ 0,03 mm entre pointes (comparateur).', 'Cannelures d\'entrée : pas de jeu angulaire perceptible du disque, pas d\'usure en « pied de dent ».', 'Portées de roulements : Ø et état de surface, pas de bleuissement.'],
  symp: ['Claquement au ralenti pédale relâchée = cannelures / roulement usés.', 'Bruit permanent au point mort qui DISPARAÎT en débrayant = roulement d\'arbre primaire.', 'Vibrations à l\'embrayage.'],
  remontage: ['Graisse spéciale sur cannelures (pas sur la garniture !).', 'Spi d\'arbre primaire neuf, lèvre huilée, pose à la douille.', 'Régler le jeu axial par la cale (≈ 0,05–0,10 mm indicatif).'],
});
def('arbre-secondaire', {
  name: 'Arbre secondaire creux lubrifié', mat: 'Acier cémenté trempé, alésage Ø11 mm', cat: 'arbre',
  role: ['Porte les pignons FOUS (1ère à 5ème) sur cages à aiguilles, les moyeux de synchro et le pignon d\'attaque du pont.', 'Son alésage central amène l\'huile par perçages radiaux (flux BLEU) sous chaque cage à aiguilles.'],
  metro: ['Faux-rond ≤ 0,03 mm ; Ø des portées d\'aiguilles (limite d\'usure typiquement 0,01 mm).', 'Perçages de graissage libres : passage d\'un fil calibré.', 'Cannelures de moyeux sans matage.'],
  symp: ['Pignon fou grippé / bruit de ferraille à chaud = manque de lubrification (alésage obstrué).', 'Craquements de passage de rapports si moyeu desserré.'],
  remontage: ['Remonter dans l\'ordre inverse du démontage : pignon, aiguilles huilées, anneau, moyeu, baladeur, circlip.', 'Circlips neufs, cales de calage mesurées (jeu axial pignon fou 0,10–0,30 mm indicatif).', OIL],
});

/* ------------------------------ Pignons (gabarits) ------------------------------ */
for (const k of [1, 2, 3, 4, 5]) {
  const { Zp, Zs } = GEAR_PAIRS[k];
  const pr = PAIR[k];
  def(`p-${k}`, {
    name: `Pignon fixe de ${ORD[k]} (primaire)`, mat: 'Acier cémenté trempé, denture hélicoïdale (hélice ≈ 22°)', cat: 'pignon',
    role: [`Pignon MENANT de ${ORD[k]} : Z = ${Zp} dents, solidaire de l'arbre primaire (rayon primitif ${fr(pr.rp * 10, 1)} mm).`, `Rapport ${ORD[k]} : i = Z_mené/Z_menant = ${Zs}/${Zp} = ${fr(IB[k])}. Les dents sont toujours en prise avec le pignon fou ${k}.`],
    metro: ['Piqûres (pitting) et écaillage sur les flancs : examen visuel à la loupe.', 'Jeu entre dents (jeu de fonctionnement) : comparateur sur le flanc, ≈ 0,08–0,15 mm indicatif.', 'Contrôle de l\'empreinte de contact au bleu de Prusse.'],
    symp: [k <= 2 ? 'Sifflement / hurlement sous charge en 1ère-2ème = denture fatiguée (efforts maxi).' : 'Ronronnement sous charge, devient sifflement en prise directe.', 'Limaille brillante sur l\'aimant du carter.'],
    remontage: ['Toujours remplacer la PAIRE de pignons (menant + mené) pour conserver l\'engrènement.', 'Pignon claveté / fretté : chauffer à ≈ 150 °C, respecter le sens (face de référence).', 'Contrôler le jeu axial et la position axiale (calage).'],
  });
  const side = k === 1 || k === 3 || k === 5 ? 'à droite' : 'à gauche';
  def(`s-${k}`, {
    name: `Pignon fou de ${ORD[k]} (secondaire)`, mat: 'Acier cémenté trempé ; cône mâle + couronne de crabotage', cat: 'pignon',
    role: [`Pignon MENÉ de ${ORD[k]} : Z = ${Zs} dents, monté FOU sur cage à aiguilles (gris = rotation libre sans couple, tant que le baladeur n'est pas crabotté).`, `Il porte le cône mâle de friction (laiton en contact), et la couronne de crabotage (${SPLINE_Z} dents) du côté du moyeu (${side} du pignon).`],
    metro: ['Jeu axial pignon fou / cale : 0,10–0,30 mm (indicatif).', 'Cône : pas de rayures profondes, ni bleuissement (échauffement).', 'Dents de crabotage : chanfrein d\'entrée intact, dépouille conservée (pas de « bec arrondi »).', 'Alésage : jeu radial avec la cage à aiguilles ≈ 0,01–0,03 mm.'],
    symp: ['Craquement au passage de la vitesse = cône / anneau usés.', 'Vitesse qui saute en décélération = dents de crabotage usées en dépouille.', 'Bruit de ferraille / grippage de cage = manque d\'huile.'],
    remontage: ['Aiguilles huilées à l\'huile de boîte, cage non déformée.', 'Contrôler le sens (cône côté synchro).', OIL],
  });
  def(`aiguilles-${k}`, {
    name: `Cage à aiguilles de ${ORD[k]}`, mat: 'Acier à roulement (chrome 100Cr6)', cat: 'roulement',
    role: [`Permet la rotation libre du pignon fou ${k} sur l'arbre secondaire. Les aiguilles (InstancedMesh) tournent à (ω_arbre·r_int + ω_pignon·r_ext)/(r_int + r_ext).`],
    metro: ['Aiguilles : pas de méplats ni écaillage ; cage non cassée.', 'Piste sur l\'arbre : polie, sans empreintes.'],
    symp: ['Ferraillement et échauffement du pignon fou, limaille métallique dans l\'huile.'],
    remontage: ['Remplacer cage ET aiguilles ensemble ; huiler abondamment avant la pose.'],
  });
}
def('p-AR', {
  name: 'Pignon de marche arrière (primaire)', mat: 'Acier cémenté trempé, denture DROITE', cat: 'ar',
  role: [`Z = ${REV.Zr} dents, solidaire de l'arbre primaire. Entraîne le baladeur d'AR (Z = ${REV.Zi}) qui inverse le sens de rotation.`, `Rapport d'AR : i_R = ${REV.Zring}/${REV.Zr} = ${fr(IR)}.`],
  metro: ['Dents droites : état des flancs, jeu entre dents avec le baladeur.'],
  symp: ['Grondement caractéristique en marche arrière (denture droite, pas de recouvrement).'],
  remontage: ['Contrôle de la largeur de prise du baladeur d\'AR au remontage.'],
});
def('pignon-ar-baladeur', {
  name: 'Baladeur de marche arrière (pignon de renvoi)', mat: 'Acier cémenté trempé', cat: 'ar',
  role: [`Pignon intermédiaire Z = ${REV.Zi} coulissant sur l'arbre de renvoi : en prise permanente avec le pignon d'AR du primaire, il vient s'engrener sur la couronne d'AR (Z = ${REV.Zring}) du baladeur 1/2 → sens du couple inversé.`, 'Aucun synchroniseur sur l\'AR : on l\'engage véhicule arrêté, pignons à l\'arrêt.'],
  metro: ['Chanfreins de dents (entrée d\'engrènement) non matés.', 'Jeu de la douille / de l\'axe de renvoi.'],
  symp: ['Craquement en passant la MAR = engagement en mouvement ou chanfreins matés.'],
  remontage: ['Respecter le sens (collerette côté fourchette).', 'Attendre l\'arrêt des pignons (pédale enfoncée 2–3 s) avant d\'engager.'],
});
def('arbre-renvoi', {
  name: 'Arbre de renvoi de marche arrière', mat: 'Acier trempé rectifié', cat: 'ar',
  role: ['Axe fixe sur lequel coulisse et tourne le baladeur d\'AR.'],
  metro: ['Ø de la portée : jeu avec le baladeur ≈ 0,03–0,06 mm.', 'Pas de rayures.'], symp: ['Jeu excessif : bruit de ferraille en AR.'],
  remontage: ['Blocage axial par vis-frein ou circlip selon le modèle.'],
});

/* ------------------------------ Synchroniseurs ------------------------------ */
const SYN_NAME = { 12: '1/2', 34: '3/4', 5: '5ème' };
for (const key of [12, 34, 5]) {
  const n = SYN_NAME[key];
  const ex = key === 12 ? ' Sa périphérie porte aussi la couronne d\'AR (Z = 44, denture droite).' : '';
  def(`moyeu-${key}`, {
    name: `Moyeu de synchroniseur ${n}`, mat: 'Acier fritté / forgé, cannelé', cat: 'synchro',
    role: ['Solidaire de l\'arbre secondaire (cannelures + circlip) : transmet le couple du baladeur à l\'arbre quand la vitesse est crabottée.', 'Trois logements reçoivent les clavettes de verrouillage.'],
    metro: ['Cannelures extérieures : jeu angulaire avec le baladeur ≤ 0,3 mm.', 'Logements de clavettes : pas d\'ovalisation.'],
    symp: ['Claquement à la prise du couple si cannelures usées.'], remontage: ['Sens de montage (côté plus long vers le pignon concerné).', 'Circlip de retenue neuf, calage axial.'],
  });
  def(`baladeur-${key}`, {
    name: `Baladeur ${n} (manchon coulissant)`, mat: 'Acier, denture intérieure chanfreinée', cat: 'synchro',
    role: ['Coulisse sur le moyeu sous l\'action de la fourchette (gorge extérieure). Sa denture intérieure s\'engrène successivement sur les dents d\'arrêt de l\'anneau puis sur la couronne de crabotage du pignon fou.' + ex],
    metro: ['Chanfreins d\'entrée de denture : pas de becs arrondis (usure en dépouille).', 'Gorge de fourchette : usure ≤ 0,2 mm ; jeu fourchette / gorge ≈ 0,3–0,6 mm.', 'Coulisse libre sans point dur sur le moyeu.'],
    symp: ['Vitesse qui SAUTE en décélération = denture usée en dépouille + jeu axial.', 'Point dur au levier, vitesse qui « accroche ».'],
    remontage: ['Sens de montage du baladeur : gorge / repère côté indiqué par le constructeur (chanfreins asymétriques).', 'Huile de boîte sur les pièces coulissantes.', OIL],
  });
  def(`clavettes-${key}`, {
    name: `Clavettes de verrouillage ${n} (×3)`, mat: 'Acier trempé', cat: 'synchro',
    role: ['Trois clavettes à 120° poussées par les ressorts annulaires contre la gorge du baladeur. Elles entraînent l\'anneau de synchro vers le cône dès que le baladeur bouge (phase 2), puis s\'effacent quand le baladeur franchit l\'anneau (phase 3).'],
    metro: ['Longueur et épaisseur : pas d\'usure du bec de verrouillage.', 'Absence de jeu excessif dans les encoches de l\'anneau (jeu d\'indexage ≈ 0,5–1,0 mm).'],
    symp: ['Passage dur ou craquement par non-décrochage de l\'anneau.'], remontage: ['Remplacer les 3 clavettes ET les 2 ressorts : toujours en kit.', 'Poser les ressorts avec leurs extrémités décalées de 120°.'],
  });
  def(`ressorts-${key}`, {
    name: `Ressorts annulaires ${n} (×2)`, mat: 'Acier à ressort', cat: 'synchro',
    role: ['Maintiennent les clavettes appliquées vers l\'extérieur dans la gorge du baladeur (détente de verrouillage).'],
    metro: ['Pas de fatigue : mesure du diamètre libre selon la gamme.'], symp: ['Passage flou, craquement léger.'],
    remontage: ['Toujours remplacés avec le kit synchro.'],
  });
  def(`circlip-moyeu-${key}`, {
    name: `Circlip de moyeu ${n}`, mat: 'Acier à ressort', cat: 'synchro',
    role: ['Arrête axialement le moyeu de synchro sur l\'arbre secondaire.'],
    metro: ['Épaisseur calibrée : choisir parmi la série pour supprimer le jeu axial du moyeu (≤ 0,05 mm).'],
    symp: ['Jeu axial du moyeu : claquement, vitesse qui saute.'], remontage: ['Circlip NEUF à chaque démontage ; ouverture minimale à la pince, gorge propre.'],
  });
  def(`cale-${key}`, {
    name: `Rondelle de calage ${n}`, mat: 'Acier', cat: 'synchro',
    role: ['Rattrape le jeu axial du moyeu et centre le baladeur entre les deux pignons.'],
    metro: ['Mesure du jeu axial à la jauge, choix de l\'épaisseur de cale.'], symp: ['Jeu axial = vitesse qui saute.'], remontage: ['Mesurer, jamais « à l\'œil ».'],
  });
}
for (const k of [1, 2, 3, 4, 5]) {
  def(`bague-${k}`, {
    name: `Anneau de synchro de ${ORD[k]} (laiton)`, mat: 'Laiton / bronze (#d4af37), cône intérieur + dents d\'arrêt', cat: 'synchro',
    role: ['Anneau de synchronisation : son cône interne vient frotter sur le cône mâle du pignon fou. Le frottement égalise les vitesses (phase 2) ; ses dents d\'arrêt chanfreinées BLOQUENT le baladeur tant que les vitesses sont différentes (indexage ±), puis le libèrent (phase 3).'],
    metro: ['Mesure du jeu axial anneau / cône du pignon à la cale d\'épaisseur : valeur NEUVE 1,2 mm — limite d\'usure 0,5 mm.', 'Rainures de cône (évacuation du film d\'huile) encore visibles ; dents d\'arrêt non arrondies.', 'Surface de friction : pas de brillance excessive (glaçage) ni rayures.'],
    symp: ['Craquement au passage de la vitesse, surtout à froid et en rétrogradage.', 'Passage dur au levier, vitesse qui ne « rentre » qu\'en force.', 'Éventuellement vitesse qui saute si l\'anneau est trop usé (jeu).'],
    remontage: ['Remplacer l\'anneau AVEC le kit synchro ; toujours tremper les pièces dans l\'huile de boîte.', 'Les 3 encoches face aux clavettes (ergots alignés).', OIL],
  });
}

/* ------------------------------ Fourchettes ------------------------------ */
for (const key of [12, 34, 5]) {
  def(`fourchette-${key}`, {
    name: `Fourchette de commande ${SYN_NAME[key]}`, mat: 'Acier + patins en bronze/PA', cat: 'commande',
    role: ['VERT : commande mécanique. Transforme le déplacement du levier (câbles / tringles) en translation du baladeur par appui dans sa gorge.'],
    metro: ['Épaisseur des patins ≥ limite constructeur ; jeu patin / gorge ≈ 0,3–0,6 mm.', 'Pas de voile de la fourchette (équerrage sur marbre).'],
    symp: ['Vitesse qui sort / passage imprécis = patins usés, jeu axial.'], remontage: ['Graisser légèrement l\'axe ; contrôler le verrouillage (interlock / billes) avant fermeture du carter.'],
  });
  def(`axe-fourchette-${key}`, {
    name: `Axe de fourchette ${SYN_NAME[key]}`, mat: 'Acier trempé rectifié', cat: 'commande',
    role: ['Guide la fourchette en translation et porte les crans de verrouillage de vitesse (billes + ressort).'],
    metro: ['Rectitude et état de surface ; jeu fourchette / axe ≈ 0,05 mm.'], symp: ['Point dur, vitesse qui sort.'], remontage: ['Respecter les billes d\'interlock : un seul axe mobile à la fois.'],
  });
}
def('fourchette-ar', {
  name: 'Fourchette de marche arrière', mat: 'Acier', cat: 'commande',
  role: ['Fait coulisser le baladeur d\'AR sur son axe de renvoi.'], metro: ['Jeu patin / gorge.'], symp: ['AR qui sort ou ne rentre pas.'], remontage: ['Contrôler le verrouillage d\'AR (impossible en roulant).'],
});

/* ------------------------------ Roulements & spi ------------------------------ */
const BRG = (name, role, extra = {}) => ({
  name, mat: 'Acier à roulement 100Cr6', cat: 'roulement', role,
  metro: ['Jeu axial / radial : au comparateur, bague bloquée (≤ 0,05 mm).', 'Rotation douce sans point dur ni bruit (à la main, huilé).', 'Pistes : pas de piqûres ni de marquage.'],
  symp: ['Sifflement / grondement continu proportionnel à la vitesse de rotation de l\'arbre.', 'Bruit permanent au point mort pédale relâchée qui disparaît en débrayant = roulement d\'arbre primaire.'],
  remontage: ['Chauffer la bague intérieure (≈ 120 °C) ou presser sur la bague montée uniquement.', 'Jamais de frappe sur les éléments roulants ; bague extérieure freinée au circlip.'], ...extra,
});
def('rlt-prim-av', BRG('Roulement d\'arbre primaire AV (à billes)', ['Guide l\'arbre primaire dans la cloison. Tourne à la vitesse du moteur dès que l\'embrayage est embrayé — même en neutre.']));
def('rlt-prim-ar', BRG('Roulement d\'arbre primaire AR (à billes)', ['Reprend les efforts radiaux de l\'extrémité du primaire côté couvercle.']));
def('rlt-sec-av', BRG('Roulement de secondaire AV (à rouleaux coniques)', ['Reprend les efforts radiaux ET axiaux des pignons hélicoïdaux du secondaire et du couple conique.']));
def('rlt-sec-ar', BRG('Roulement de secondaire AR', ['Guide l\'extrémité du secondaire.']));
def('rlt-diff-g', BRG('Roulement de différentiel G (à rouleaux coniques)', ['Supporte le boîtier de différentiel côté embrayage ; son précharge règle la position de la couronne.']));
def('rlt-diff-d', BRG('Roulement de différentiel D (à rouleaux coniques)', ['Supporte le boîtier de différentiel côté boîte ; réglage de précharge par cale.']));
const SEAL = (name, role) => ({
  name, mat: 'Élastomère noir mat (FKM/NBR) + armature acier', cat: 'roulement', role,
  metro: ['Lèvre souple, sans durcissement ni stries ; portée de l\'arbre non rayée (rugosité Ra ≤ 0,4 µm).'],
  symp: ['Fuite d\'huile sur le disque d\'embrayage (patinage, graisse) ou sur la transmission (gouttes sous le véhicule).'],
  remontage: ['Spi neuf à la douille adaptée, ressort de lèvre côté huile, lèvre huilée.', 'Ne jamais toucher la lèvre avec un outil tranchant.'],
});
def('spi-primaire', SEAL('Spi d\'arbre primaire', ['Étanchéité dynamique entre carter et arbre primaire côté embrayage.']));
def('spi-diff-g', SEAL('Spi de sortie de différentiel G', ['Étanchéité de la sortie de transmission gauche.']));
def('spi-diff-d', SEAL('Spi de sortie de différentiel D', ['Étanchéité de la sortie de transmission droite.']));
for (const [id, nm] of [['circlip-prim-ar', 'Circlip de roulement primaire AR'], ['circlip-sec-ar', 'Circlip de roulement secondaire AR']]) {
  def(id, { name: nm, mat: 'Acier à ressort', cat: 'roulement', role: ['Arrête axialement la bague extérieure du roulement dans son logement.'], metro: ['Gorge propre, circlip non déformé.'], symp: ['Jeu axial d\'arbre.'], remontage: ['Circlip neuf ; vérifier qu\'il est bien assis dans la gorge.'] });
}
for (const [id, nm] of [['cale-prim-ar', 'Cale de réglage primaire AR'], ['cale-sec-ar', 'Cale de réglage secondaire AR']]) {
  def(id, { name: nm, mat: 'Acier', cat: 'roulement', role: ['Rattrape le jeu axial de l\'arbre dans le carter.'], metro: ['Mesure du jeu axial, choix d\'épaisseur de cale.'], symp: ['Jeu axial, bruit de claquement.'], remontage: ['Mesurer avant de choisir la cale.'] });
}

/* ------------------------------ Pont ------------------------------ */
def('pignon-attaque', {
  name: 'Pignon d\'attaque (secondaire)', mat: 'Acier cémenté trempé, hélicoïdal', cat: 'pignon',
  role: [`Taillé dans l'arbre secondaire : Z = ${FD.Zpin}. Rapport de pont i_p = Z_couronne/Z_pignon = ${FD.Zcrown}/${FD.Zpin} = ${fr(IP)}.`],
  metro: ['Empreinte de contact avec la couronne au bleu de Prusse.', 'Jeu à la denture ≈ 0,10–0,20 mm.'],
  symp: ['Hurlement de pont accélération / décélération = usure ou précharge de roulements.'],
  remontage: ['Couple conique : toujours remplacé EN PAIRE avec la couronne (appairé).'],
});
def('couronne', {
  name: 'Couronne de pont', mat: 'Acier cémenté trempé, hélicoïdal', cat: 'pignon',
  role: [`Z = ${FD.Zcrown}. Réduit une dernière fois : N_roues = N_moteur / (i_b × i_p).`, 'Boulonnée sur le boîtier de différentiel.'],
  metro: ['Voile de couronne ≤ 0,05 mm.', 'Flancs : écaillage, piqûres.'], symp: ['Hurlement / sifflement en charge.'],
  remontage: ['Vis de couronne NEUVES (freinées), serrage en croix au couple + angle (valeur constructeur).', 'Chauffer ou presser selon gamme.'],
});
def('boitier-diff', {
  name: 'Boîtier de différentiel', mat: 'Fonte', cat: 'pont',
  role: ['Entraîné par la couronne ; il porte l\'axe de satellites. En ligne droite il tourne d\'un bloc avec les planétaires ; en virage, les satellites tournent sur leur axe (compensation de vitesse).'],
  metro: ['Portées de roulements : état, cote ; alésage de l\'axe de satellites : usure.'], symp: ['Claquement au lâcher / reprise d\'accélérateur, bruit en virage serré.'],
  remontage: ['Rondelles de friction neuves derrière satellites et planétaires ; jeu d\'entre dents planétaires/satellites 0,05–0,15 mm.'],
});
def('satellites', {
  name: 'Satellites (×2)', mat: 'Acier cémenté trempé (coniques)', cat: 'pont',
  role: [`Z = ${DIFF.Zsat} dents. Libres sur l'axe de satellites : en virage ils tournent à ω_sat = (ω_G − ω_D)/2 × Z_plan/Z_sat par rapport au boîtier.`],
  metro: ['Jeu satellite / axe, flancs de denture.'], symp: ['Bruit en virage (cliquetis) = satellites ou axe usés.'], remontage: ['Rondelles de friction neuves ; axe frein-goupille.'],
});
def('axe-satellites', {
  name: 'Axe de satellites', mat: 'Acier trempé', cat: 'pont', role: ['Supporte les satellites ; fixé au boîtier (goupille).'],
  metro: ['Ø usé / ovalisé ?'], symp: ['Cliquetis en virage.'], remontage: ['Goupille neuve.'],
});
for (const [id, nm] of [['planetaire-g', 'Planétaire gauche'], ['planetaire-d', 'Planétaire droit']]) {
  def(id, {
    name: nm, mat: 'Acier cémenté trempé (conique)', cat: 'pont',
    role: [`Z = ${DIFF.Zplan}. Cannelé sur l'arbre de transmission : il tourne à la vitesse de la roue correspondante.`],
    metro: ['Cannelures sans jeu ; faces d\'appui (rondelles de friction).'], symp: ['Bruit en virage, jeu aux cannelures = claquement transmission.'], remontage: ['Rondelle de friction neuve, jeu axial réglé.'],
  });
}
def('arbre-transm-g', { name: 'Arbre de transmission gauche', mat: 'Acier', cat: 'pont', role: ['Transmet le mouvement du planétaire G à la roue (via cardan).'], metro: ['Cannelures, portée de spi non rayée.'], symp: ['Claquement, fuite spi.'], remontage: ['Graisser les cannelures, circlip de blocage neuf.'] });
def('arbre-transm-d', { name: 'Arbre de transmission droit', mat: 'Acier', cat: 'pont', role: ['Transmet le mouvement du planétaire D à la roue.'], metro: ['Cannelures, portée de spi.'], symp: ['Claquement, fuite spi.'], remontage: ['Graisser les cannelures, circlip neuf.'] });

/* ------------------------------ Embrayage ------------------------------ */
def('volant-moteur', { name: 'Volant moteur', mat: 'Fonte', cat: 'embrayage', role: ['Solidaire du vilebrequin (rotation à N_moteur) ; sa face de friction reçoit le disque.'], metro: ['Voile ≤ 0,1 mm ; surface sans rayures ni points chauds.'], symp: ['Broutage au démarrage, vibrations.'], remontage: ['Vis neuves, serrage au couple + angle.'] });
def('disque-embrayage', { name: 'Disque d\'embrayage', mat: 'Acier + garnitures organiques', cat: 'embrayage', role: ['Lié aux cannelures de l\'arbre primaire ; transmet le couple moteur par frottement quand le plateau le serre.'], metro: ['Épaisseur de garniture ≥ limite ; rivets non affleurants ; voile ≤ 0,5 mm.'], symp: ['Patinage (régime monte sans accélération), broutage.'], remontage: ['Centrer au mandrin ; ne pas graisser les garnitures ; côté « moteur » repéré.'] });
def('mecanisme-embrayage', { name: 'Mécanisme d\'embrayage (plateau + diaphragme)', mat: 'Acier', cat: 'embrayage', role: ['Applique le disque contre le volant (ressort à diaphragme). Pédale enfoncée, la butée libère le plateau : le primaire se désolidarise du moteur.'], metro: ['Plan du plateau (usure ≤ 0,3 mm), doigts de diaphragme de même niveau.'], symp: ['Pédale dure, débrayage incomplet.'], remontage: ['Serrage en croix ; butée neuve.'] });
