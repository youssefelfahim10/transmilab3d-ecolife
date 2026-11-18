# Méthode — de la documentation constructeur à la visualisation guidée

Retour d'expérience du projet ZF EcoLife 2 (manuel technique FR, ~100 p.).

## 0. Cadrer
Poser au plus 4 questions : public (élèves, techniciens, ingénieurs — prévoir un encart « pour aller plus loin »), document de référence, ce qui doit être **exact** (rapports, pressions, repères), livraison (HTML autonome, Git d'entreprise, projecteur). Écrire un `CLAUDE.md` (identité, stack, règles). Demander **le document constructeur** : sans lui, tout est « inspiré » et le dire.

## 1. Extraire le document (docx / pdf)
- `pandoc doc.docx -t markdown --extract-media=media` ou `pdftotext -layout`. Lire les **figures** : coupe mécanique, schéma hydraulique (repères numérotés), tableau d'engagement, tableaux de valeurs.
- Produire `docs/extraction.md` : liste des composants (avec repère et page), états/tableau d'engagement, valeurs de contrôle (plage, conditions : température, régime, mode), règles de diagnostic, exemples de pannes du manuel.
- **Séparer** ce qui est *donné* (page citée) de ce qui est *déduit* (ex. nombres de dents). Les déductions deviennent des `note` dans le parcours et des « limites » dans le README.

## 2. Moteur de simulation (`<nom>Sim.js`)
- **Une table de constantes exportée** (dents, surfaces, pressions) lue par la sim, la 3D et les fiches.
- Les **rapports sont calculés** à partir de la géométrie (Willis pour les trains : `S + ρ·R = (1+ρ)·C`, ρ = Zr/Zs). Si la topologie n'est pas donnée : la **rechercher** par force brute (`scripts/topo_trains.py`) contre le tableau de rapports du constructeur, vérifier l'unicité de la famille de solutions, **le dire**.
- États : machine à états des commandes (remplissage → transfert → inertie pour un passage embrayage-sur-embrayage ; un seul élément change entre états consécutifs).
- Pression/débit/thermique : modèles **simples calibrés sur les plages du manuel** (ex. PHD 10–12 bar), jamais de physique inventée sans dire que c'est un ordre de grandeur.
- **Pannes = paramètres** (`faults = { fuite, usure, colmatage… }`) qui modifient capacité, pression, température ; le rendu ne contient aucun cas spécial.
- Conservation : à la fermeture d'un pontage, conserver la **vitesse** (c'est le régime qui change). Après un saut d'état, réinitialiser tous les états visuels.

## 3. Valider en Node AVANT la 3D
Script qui exécute `update()` en boucle : placer chaque état, comparer aux valeurs du manuel (rapports, plages de pression, exemples de diagnostic du manuel). Seuil : écart < 0,1 % sur les rapports. Ce test a détecté : emballement thermique du ralentisseur, colmatage sans effet, conservation de vitesse.

## 4. Modèle 3D (`<nom>Module.js`)
Unité 1 = 10 mm, axe X. Helpers : `latheX` (révolutions), `involuteGear`, `splineRing`, `tubeX/cylX`, `hullTube` (carter creux), `bearingGeo`, `InstancedMesh` pour billes/disques/dents répétées. **Solides fermés** (la coupe bouche par stencil). Engrènement visuel : `meshPhase` ; couronne : phase calculée pour que les dents s'imbriquent (`(Zs+Zr)/N` entier). `pose()` n'écrit que `rotX/slide/base`. `style()` applique les couleurs SSP et la surbrillance du parcours (`o.focus`).
Vue éclatée : étapes dans l'**ordre de démontage atelier**. Groupes « décortiquer » : un groupe = un sous-ensemble fonctionnel que l'élève veut présenter (ex. convertisseur, ralentisseur, frein D…).

## 5. Fiches (`<nom>Parts.js`)
Pour chaque pièce : rôle, contrôle/métrologie (valeur + source), symptômes, remontage. Une valeur sans source = « ordre de grandeur ».

## 6. Schéma fonctionnel animé
SVG (viewBox fixe, `text-anchor: middle`), nœuds cliquables liés aux pièces 3D, liaisons colorées par nature (pression orange, pilotage vert tireté, retour bleu), jauges avec **plage du manuel** et état ok/bad. Mise à jour toutes les ~90 ms depuis la sim.

## 7. Parcours guidé — voir `parcours-guide.md`.

## 8. Cas pratiques de panne
7 cas EcoLife (A→G) : chacun = symptôme client, reproduction (`setup`), observations possibles, mesures (`liveMeasure`), hypothèses, pièce coupable, réparation. Pédagogie : raisonner **commande → pression → résultat**, éliminer par l'élément commun (tableau d'engagement), 3 niveaux d'indices.

## 9. Charte et tests
Charte : `charte-omniplus.md`. Tests : Chromium headless (swiftshader), parcours complet via `smoke_test.cjs`, captures clair/sombre, bureau + téléphone 390 px, `scrollWidth == clientWidth`.

## 10. Livraison
`build-standalone.sh` → `dist/<nom>.html` (un seul fichier, ~1 Mo, hors ligne). README : usage en 30 s, **limites honnêtes**, raccourcis. Dépôt Git : `.gitignore` des livrables lourds ; si le serveur impose un jeton personnel (PAT), le demander via un formulaire sécurisé — jamais en clair dans le chat — ou fournir un `git bundle` + commandes de push.
