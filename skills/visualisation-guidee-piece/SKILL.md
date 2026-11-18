---
name: visualisation-guidee-piece
description: Reproduire la visualisation pédagogique TransmiLab 3D (simulation physique + modèle 3D en coupe + schéma hydraulique animé + parcours guidé pas à pas avec démonstration automatique, questions et lecture vocale, charte OMNIplus ON) pour UNE AUTRE PIÈCE OU ENSEMBLE — pompe, différentiel, turbo, embrayage, boîte robotisée, frein, circuit hydraulique, borne de recharge, tout mécanisme dont on veut montrer « chaque élément et son influence sur la chaîne de fonctionnement ». Utiliser dès que l'utilisateur demande de refaire / décliner / réutiliser le simulateur, d'ajouter un module, de partir d'un manuel technique pour construire une visualisation guidée, ou un parcours « du zéro à la fin », même s'il ne dit ni Three.js ni skill.
---

# Visualisation guidée d'une pièce (méthode TransmiLab 3D)

Ce skill capitalise le projet **ZF EcoLife 2** (boîte automatique de bus). Il donne la **méthode**, les **contrats** du code et des **modèles qui fonctionnent** pour décliner la même visualisation sur une autre pièce. Il complète `simulateur-3d-pedagogique` (géométrie, coupe, livraison), `diagnostic-pedagogique-ux` (pannes) et `capture-webgl-headless` (tests).

## Ce que l'élève doit pouvoir faire (cahier des charges réel du formateur)
1. **Présenter** la pièce entière, puis **visualiser chaque sous-ensemble** (ex. convertisseur, blocs hydrauliques, freins, trains).
2. Voir **l'influence de chaque élément sur la chaîne de fonctionnement** : cause → effet, avec mesures en direct.
3. Suivre un **parcours guidé du mouvement 0 à la fin**, pas à pas ; ou lancer une **démonstration automatique** qui s'explique seule.
4. **Diagnostiquer** : pannes injectables, mesures aux points de test, raisonnement commande → pression → élément → résultat.

## Pipeline (dans cet ordre — détail : `references/methode.md`)
| # | Étape | Livrable | Garde-fou |
|---|---|---|---|
| 0 | Cadrer : public, document de référence, ce qui doit être exact | `CLAUDE.md` du projet | Poser ≤ 4 questions ; demander le **document constructeur** |
| 1 | Extraire du document : composants, tableau d'états, valeurs, repères, règles de diagnostic | `docs/extraction.md` | Citer la page de chaque valeur ; marquer ce qui est **déduit** |
| 2 | Moteur de simulation | `js/<nom>Sim.js` | Une seule table de constantes ; rapports **calculés** ; pannes = paramètres |
| 3 | Valider le moteur **en Node, avant la 3D** | script de test | Comparer au tableau constructeur (écart < 0,1 %) |
| 4 | Modèle 3D procédural + vue éclatée + groupes | `js/<nom>Module.js` | Géométrie lue dans la table de constantes ; solides fermés (coupe) |
| 5 | Fiches des pièces | `js/<nom>Parts.js` | Rôle · contrôle · symptôme · remontage, avec source |
| 6 | Schéma fonctionnel animé (hydraulique, électrique, flux) | `js/<nom>Diagram.js` | Chaque bloc cliquable → pièce 3D |
| 7 | Parcours guidé + démonstration auto | `js/lesson<Nom>.js` | 1 idée / étape ; mini-question ; « Regardez » |
| 8 | Cas pratiques de panne | `js/atelier<Nom>.js` | Au moins 5 ; chacun avec chaîne de raisonnement |
| 9 | Charte graphique + tests (bureau, téléphone, clair, sombre) | captures | 0 chevauchement ; 0 erreur JS |
| 10 | Livraison : HTML autonome, README, dépôt Git, présentation | `dist/`, bundle | Dire les **limites** (reconstruit / simplifié) |

## Démarrage rapide (nouvelle pièce)
```bash
python3 scripts/scaffold.py --root /chemin/projet --id pompe --class Pompe --title "Pompe à engrenages" --wire
python3 -m http.server 8765            # dans le projet
NODE_PATH=$(npm root -g) node scripts/smoke_test.cjs http://localhost:8765/index.html pompe ./captures
```
`scaffold.py` crée 4 fichiers à partir de `templates/` (sim, module 3D, fiches, parcours), les branche (`main.js`, `lessons.js`, onglet) et refuse d'écraser un fichier existant. Le module généré **charge, anime, se coupe, s'éclate et déroule son parcours** tel quel ; il reste à remplacer le contenu d'exemple (arbre, pignon, embrayage A, carter) par la vraie pièce.

## Fichiers du kit
- `references/methode.md` — la méthode complète, étape par étape, avec les leçons apprises.
- `references/contrat-module.md` — interfaces exactes sim / module 3D / UI (ce que `main.js` et `ui.js` attendent).
- `references/parcours-guide.md` — écrire un parcours clair : structure d'une étape, ton, démonstration auto, voix.
- `references/charte-omniplus.md` — palette, jetons CSS clair/sombre, règles de contraste.
- `references/pieges.md` — erreurs déjà commises et leur correction.
- `templates/` — `sim`, `module`, `parts`, `lesson` (JS), `theme-omniplus.css`, `lesson-card.css/.html`.
- `reference-implementation/` — le code RÉEL de l'EcoLife 2 (sim 403 l., module 3D, fiches, 7 cas, schéma hydraulique, parcours 17 étapes, contrôleur).
- `scripts/` — `scaffold.py`, `smoke_test.cjs`, `build-standalone.sh`, `topo_trains.py` (recherche de topologies de trains épicycloïdaux), `fit_dents.py` (ajustement des nombres de dents).

## Règles non négociables
- **Honnêteté** : tout ce qui est reconstruit, simplifié ou déduit est écrit dans le README **et** rappelé dans l'étape concernée (`note`). Ne jamais présenter une reconstruction comme une donnée constructeur.
- **Cause → effet** : l'ordre des étapes suit le trajet réel (énergie, pression, couple), jamais l'ordre du catalogue.
- **Une idée par étape**, vocabulaire de l'atelier, un chiffre mesurable à l'écran.
- **Couleurs de fonction** (norme SSP : orange couple/pression, bleu lubrification, vert commande, gris pièce folle, rouge défaut) séparées de la **charte** (OMNIplus ON) : ne pas les mélanger.
- **Tester pour de vrai** (Chromium headless) avant de dire « ça marche » : parcours complet, 0 erreur JS, mobile 390 px sans défilement horizontal.
