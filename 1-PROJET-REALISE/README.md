> 📌 **Partie 1 — le projet réalisé.** Ce dossier contient l'application. Pour savoir *comment elle a été réalisée* (méthode, skills, prompts, documents), voir [`../2-COMMENT-REALISE/`](../2-COMMENT-REALISE/README.md). Version prête à ouvrir : [`livrables/TransmiLab3D_EcoLife.html`](livrables/TransmiLab3D_EcoLife.html) (un seul fichier, double-clic).

# TransmiLab 3D — Simulateur de boîtes de vitesses (formation maintenance auto)

Outil interactif Three.js (r187, PBR + HDRI d'atelier) qui relie la **cinématique théorique** à la **réalité d'atelier** :
démontage, métrologie, diagnostic de pannes, réparation. Conçu selon `CLAUDE.md` et `SKILLS.md`.

## Lancer

| Besoin | Commande |
|---|---|
| **Le plus simple** : un seul fichier, sans serveur | double-cliquer `dist/transmilab3d.html` |
| Version développement (modules ES) | `./serve.sh` puis ouvrir <http://localhost:8080> |
| Regénérer le monofichier | `./tools/build-standalone.sh` |

Three.js est **vendorisé** (`vendor/three/`) : aucune connexion Internet nécessaire.

## Déployer un lien partageable (Vercel)

Le site est **100 % statique** (aucun serveur, aucune clé, aucune donnée collectée). `vercel.json` publie le dossier `dist/`.

```bash
./tools/build-standalone.sh     # régénère dist/index.html
npx vercel deploy dist --prod   # ou : importer le dépôt dans Vercel (aucune commande de build à saisir)
```

## Utilisation en 30 secondes

- **À gauche : je pilote** (levier en H, pédale, régime, charge, huile).
- **À droite : j'analyse**, en 3 onglets :
  - 🔬 **Décortiquer** : arbre des pièces avec recherche · **isoler** un groupe et **écarter** ses pièces ·
    👁 masquer / réafficher · ✂ **mode scalpel** (clic = masquer) · vue éclatée · coupe en 1 clic · zoom synchro.
  - 📋 **Fiche pièce** : « en clair », rôle, contrôle, symptômes, remontage · **🔬 Contrôler** (mesure simulée).
  - 🩺 **Chercher la panne** : démarche en 6 étapes (reproduire → observer → hypothèse → mesurer → désigner → réparer).
- Un bandeau **« Que faire ? »** indique la prochaine action ; une **visite guidée** s'affiche à la 1ère ouverture.
- **Chemin du couple** (bandeau sous le coach) : moteur → embrayage → arbre primaire → pignon fixe → pignon fou → synchro →
  secondaire → pont → roues, avec une phrase en clair et les vrais calculs (ex. « 28 dents → 37 dents, régime ÷ 1,321 »).
- **Mode clair / sombre** : bouton ☀/🌙 en haut à droite ; le thème du système est détecté au premier chargement, puis mémorisé.
- **Aucun chevauchement** : les blocs d'information sont empilés (jamais superposés) et les étiquettes 3D se placent
  automatiquement sans se recouvrir (priorité à la pièce sélectionnée, puis aux pièces suspectes).
- **Chercher la panne, une étape à la fois** : reproduire → observer → hypothèse → mesurer → désigner → réparer ;
  boutons Précédent / Suivant, pièces suspectes à toucher, « À retenir » en fin de réparation.

## Architecture

```
index.html            squelette : barre de modules, panneau d'outils (gauche), viewport, diagnostic (droite)
css/style.css         thème sombre « Atelier Pro »
js/
  layout.js           implantation géométrique + nombres de dents réels + déphasages d'engrènement (source unique)
  kinematics.js       MOTEUR PHYSIQUE : rapports Z mené/Z menant, régimes, séquence de passage en 3 phases,
                      dynamique de synchronisation, pannes injectables, télémétrie
  gearsBuilder.js     GÉNÉRATION PROCÉDURALE : développante de cercle (droit/hélicoïdal), cannelures chanfreinées,
                      solides de révolution fermés, roulements (InstancedMesh), carters, fourchettes, pignons coniques
  materials.js        matériaux PBR (acier cémenté, laiton, fonte alu, élastomère) + codes couleurs SSP
  partBase.js         classe Part (pièce sélectionnable, style, glissement, rotation)
  module1BVM.js       MODULE 1 complet (80 pièces), rig d'animation, vue éclatée, coloration SSP
  ecoSim.js           MODULE 2 — MOTEUR PHYSIQUE de la ZF EcoLife 2 (6 AP xx20 B) : 3 trains simples (Willis), embrayages A/B,
                      freins D/E/F, convertisseur + roue libre + pontage WK, ralentisseur, pression PHD / A8 / D6 / D8,
                      passages embrayage-sur-embrayage, AIS (accumulateur + clapet), thermique, sondes, pannes
  module2Eco.js       MODULE 2 — modèle 3D (≈ 90 pièces) : convertisseur, pompe, ralentisseur, 3 trains, A/B, D/E/F,
                      bloc hydraulique, valves, points de mesure ; coloration SSP ; vues caméra ; mise en évidence
  ecoParts.js         fiches des pièces du Module 2 (rôle · métrologie · symptômes · remontage, repères [ZF p.])
  atelierEco.js       7 cas pratiques EcoLife (A à G) + mesures en direct aux prises ZF
  hydroDiagram.js     schéma hydraulique interactif (SVG) animé par la simulation, jauges avec plages ZF
  lessonEco.js        PARCOURS GUIDÉ : 17 étapes « du moteur arrêté au 6ᵉ rapport » (textes, questions, mesures)
  lessonUI.js         contrôleur du parcours (carte d'étape, caméra, onglet, pièces en surbrillance, quiz)
  (hérités, inutilisés : bvaSim.js, module2BVA.js, bvaParts.js, atelierBVA.js — ancienne version type Lepelletier)
  modules23.js        MODULE 3 (DCT, arbres concentriques) — base fonctionnelle
  moduleBase.js       socle commun modules 2/3 (disques multidisques instanciés, style, éclaté)
  sectionView.js      plan de coupe dynamique + BOUCHAGE hachuré par stencil buffer (une couleur par matière)
  atelierScenarios.js 3 pannes d'atelier : OR, indices à 3 niveaux, pièces coupables, protocole de réparation
  partsData.js        fiches « rôle · métrologie · symptômes · remontage » de chaque pièce
  groups.js           groupes fonctionnels (isoler / écarter) pour les 3 modules
  ui.js               levier en H, télémétrie, onglets Décortiquer / Fiche / Panne, visite guidée
  audio.js            son d'atelier synthétisé (moteur, roulement HS, craquement)
  main.js             rendu, boucle, picking, caméras, étiquettes 3D
```

## Correspondance avec le cahier des charges

1. **Modules** : onglets *Module 1* (BVM 5 + AR + différentiel, complet), *Module 2* (**ZF EcoLife 2 — boîte automatique 6 rapports pour bus** :
   convertisseur de couple + pontage WK, pompe, ralentisseur, 3 trains épicycloïdaux, embrayages A-B, freins D-E-F,
   bloc hydraulique à régulateurs, circuit complet animé), *Module 3*
   (DCT 6 rapports, arbres primaires concentriques, double embrayage, présélection + recouvrement — base fonctionnelle).
   **Module 2** : tableau d'engagement (1 = A+F · 2 = A+E · 3 = A+D · 4 = A+B · 5 = B+D · 6 = B+E · AR = D+F), rapports
   calculés avec les dents (3,36 · 1,98 · 1,44 · 1,00 · 0,70 · 0,59 · AR −3,77 ; écart avec le tableau ZF < 0,1 %), passage par recouvrement en 3 phases
   (remplissage du piston → transfert de couple → phase d'inertie), position P / R / N / D + rapports maintenus,
   lois de passage automatiques, test de calage (pied sur le frein), protections (P et AR refusés en roulant,
   rétrogradage refusé en sur-régime), **3 pannes guidées** (embrayage B usé · piston du frein D qui fuit · broutement du pontage)
   avec un « Essai des rapports » simulé qui montre quels rapports patinent.
2. **Module 1 / précision mécanique** : rapports calculés uniquement avec les dents réelles
   (1ère 41/11 · 2ème 39/19 · 3ème 37/28 · 4ème 36/37 · 5ème 31/40 · AR 44/12 · pont 62/15), entraxe constant
   (module de taille variable par paire). Synchros Borg-Warner détaillés : moyeu cannelé, baladeur à denture
   intérieure chanfreinée + gorge, **3 clavettes**, **2 ressorts annulaires**, **anneau laiton** (cône interne,
   dents d'arrêt, encoches), pignon fou sur cage à aiguilles (cône mâle + couronne de crabotage), circlip, cale.
   **Passage de rapport en 3 phases** : ① débrayage ② fourchette → cône → égalisation des vitesses (anneau indexé,
   baladeur bloqué) ③ franchissement de l'anneau → crabotage → embrayage (flux **orange**).
3. **Outils** : coupe dynamique (3 plans, inversion, bouchage hachuré), vue éclatée progressive (29 étapes dans l'ordre
   de démontage, avec circlips, cales, roulements), **Loupe synchro** (caméra dédiée + coupe axiale + ralenti ×0,1),
   télémétrie (régime 800–6500, couple, rapport, Z mené/Z menant, rapport de pont, vitesse, régime et couple roues,
   température d'huile, Δ de synchro).
4. **Diagnostic** : pannes A, B, C avec « Demander un indice » (3 niveaux), « Cliquer sur la pièce défectueuse »,
   puis protocole de réparation (jauges de métrologie neuf / limite / mesuré, couples, précautions).
5. **Ergonomie** : étiquettes 3D (Aucune / Principales / Toutes), fiche complète au clic sur n'importe quelle pièce,
   Rayons X, codes SSP (rouge-orange = couple, bleu = lubrification, vert = fourchette active, gris = pignon fou).

## Pour la panne A (fonctionnement du modèle)

Pouvoir de synchronisation `μ_eff = μ_santé × f(T_huile)` ; temps de synchro `t = τ·ln(Δ₀/ε)`, `τ = τ₀/μ_eff`.
Si `t` dépasse le temps de poussée (1,3 s), le baladeur force l'anneau bloqué → **craquement**. Cône usé (μ = 0,5) +
huile à 20 °C ⇒ craque ; même cône à 85 °C ⇒ passe ; cône sain à froid ⇒ passe (vérifié par simulation).

## Parcours guidé (Module 2) et charte graphique

- **Parcours guidé** : bouton « 🎓 Parcours guidé » en haut du panneau gauche du Module 2. 17 étapes dans l'ordre réel de la chaîne
  (moteur arrêté → pompe → pression PHD → convertisseur → point mort → sélection D → calage → 1ʳᵉ → trains épicycloïdaux →
  passage 1→2 au ralenti → rapports 2-6 → pontage WK → ralentisseur → arrêt moteur/AIS → bilan). Chaque étape : texte simple,
  « Regardez », boutons qui pilotent la simulation, mesures en direct, mini-question corrigée, encart « Pour aller plus loin ».
  Navigation : boutons ou touches ← →.
- **Démonstration automatique** : bouton « ▶ Démonstration automatique » (ou « ▶ Lecture auto » dans la carte) : la simulation se déroule seule
  (engagement de D, 1ʳᵉ, passage 1→2 au ralenti, rapports, pontage WK, ralentisseur, arrêt moteur) pendant que chaque étape s'explique ;
  pause possible, lecture vocale optionnelle (voix du navigateur). Durée ≈ 7 à 8 minutes.
- **Charte** : palette relevée sur le portail OMNIplus ON (cyan `#00ADEE`, bleu nuit `#041E42`, gris-bleu `#627389`,
  fond `#F0F2F4`, coins 4 px). Thème **clair par défaut**, thème sombre bleu nuit. La police DaimlerCS (propriétaire) n'est pas
  embarquée (police système). Les couleurs de fonction (pression orange, lubrification bleue, défaut rouge) restent celles de la norme SSP.
  Le logo OMNIplus n'est pas reproduit.

## Raccourcis

`0`/`N` point mort · `1`…`5`, `R` rapports · `Espace` pédale d'embrayage · `L` étiquettes · `Échap` quitter la sélection.
Module 2 : `P` `R` `N` `D` (sélecteur) · `1`…`6` pour maintenir un rapport · `←` `→` dans le parcours guidé.

## Hypothèses et limites (à connaître avant la mise en main)

- **Valeurs pédagogiques** : métrologie, couples de serrage, durées et prix sont des ordres de grandeur génériques,
  *pas* des données PSA/Renault. Toujours renvoyer les élèves à la documentation constructeur.
- Nombres de dents réalistes mais **inspirés** (non copiés) des BE4 / JC5 ; géométrie simplifiée (pas de dépouilles réelles,
  pas de lamages, pas de carter de fonderie détaillé : enveloppe convexe creuse).
- Le baladeur d'AR reste en prise permanente avec le pignon d'AR du primaire (denture large) ; seule sa prise sur la
  couronne du baladeur 1/2 est commandée. Pas de synchroniseur d'AR : l'AR n'est autorisée qu'à l'arrêt.
- **Module 2 (ZF EcoLife 2)** : rapports, pressions (PHD 10-12 bar, A8, D6, D8), plages de mesure, règles de
  diagnostic (élément commun, Δp filtre < 0,8 bar, PHD ≥ 1,5 bar après 20 s) et repères hydrauliques viennent du
  *manuel technique ZF EcoLife 2* fourni. En revanche : (1) les **liaisons internes des trois trains** sont
  RECONSTRUITES par calcul pour retrouver le tableau de rapports ZF (le schéma cinématique constructeur n'était pas
  disponible) — à valider avec le formateur ; (2) nombres de dents déduits (trains 1-2 : 66/156, train 3 : 74/122) ;
  (3) implantation axiale SIMPLIFIÉE ; (4) dynamique de pression, de patinage et de température = ordres de grandeur ;
  (5) pas de pilotage CAN ni de calculateur détaillé.
- Module 3 : 6 rapports AV, sans AR, baladeurs sans anneaux détaillés ni fourchettes ; cas pratiques à écrire.
- Rotation affichée volontairement ralentie (stroboscopie à 3000 tr/min) : les **rapports de vitesses restent exacts**.
- Testé dans Chromium (rendu logiciel) ; non testé sur tablette/tactile ni Safari. Charge ≈ 0,7 M triangles
  (≈ 2 M avec bouchage de coupe actif) : prévoir un GPU récent pour une fluidité maximale avec la coupe.
