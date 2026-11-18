---
name: simulateur-3d-pedagogique
description: Construire un simulateur 3D interactif (Three.js, WebGL) pour la formation technique et professionnelle — boîte de vitesses, moteur, circuit hydraulique, pompe, réducteur, tout mécanisme à pièces mobiles — avec cinématique exacte, géométrie procédurale (engrenages en développante, révolutions, roulements instanciés), coupe avec bouchage hachuré, vue éclatée, couleurs SSP, pannes injectables, et livraison en un seul fichier HTML / lien Vercel. À utiliser dès que l'utilisateur parle de simulateur 3D, maquette interactive, jumeau numérique pédagogique, démonstrateur WebGL/Three.js, "TransmiLab", cinématique animée de pièces, plan de coupe, vue éclatée, ou veut un outil visuel pour des apprenants (Bac Pro, BTS, CQP, école d'ingénieurs), même s'il ne dit pas "Three.js".
---

# Simulateur 3D pédagogique (Three.js)

> **Version la plus récente (ZF EcoLife 2, parcours guidé pas à pas, démonstration automatique, charte OMNIplus ON, modèles + `scaffold.py`) : voir le skill `visualisation-guidee-piece`.** Ce skill-ci reste la référence pour la géométrie, la coupe et la livraison.

Retour d'expérience du projet **TransmiLab 3D** (BVM 5+AR+différentiel, 80 pièces, 3 pannes d'atelier). Le but : relier chaque concept théorique à une réalité d'atelier (bruit, usure, métrologie, démontage). Le code de référence se trouve dans `references/` ; ne le recopier que si le mécanisme est proche, sinon s'en inspirer.

## Étape 0 — Cadrer (poser les questions utiles, pas plus de 4)
Public et niveau · mécanisme et nombre de modules · ce qui doit être exact (rapports, jeux, couples) · livraison (fichier unique hors ligne, lien Vercel, projecteur de salle). Écrire un `CLAUDE.md` (identité, stack, précision, règles de code) et un `SKILLS.md` à la racine : voir `references/CLAUDE.exemple.md`.

## Architecture modulaire (stricte)
```
js/layout.js        SOURCE UNIQUE : entraxes, nombres de dents, déphasages (1 unité = 10 mm)
js/kinematics.js    moteur physique : rapports Z mené/Z menant, régimes, machine à états, pannes
js/gearsBuilder.js  géométrie procédurale (aucune importation de modèle)
js/materials.js     PBR par matière + codes couleur SSP + styles de bouchage
js/partBase.js      classe Part : base/slide/explode/local, styles, groupes
js/moduleN*.js      assemblage des pièces + rig d'animation + plan d'éclatement + groupes
js/sectionView.js   coupe + bouchage stencil
js/atelierScenarios.js, partsData.js   pannes et fiches (voir skill diagnostic-pedagogique-ux)
js/ui.js, main.js   interface, rendu, picking, étiquettes
```
Règle : la **géométrie lit `layout.js`**, la **cinématique lit `layout.js`**, jamais de nombre magique dupliqué.

## Règles de précision (ce qui évite 90 % des bugs)
- Vitesses angulaires **uniquement** par rapports de dents réels. Un affichage ralenti (stroboscopie) est permis, jamais un rapport approximé.
- Engrènement visuel : déphasage `meshPhase(φA, ZA, ZB, α)` pour que les dents s'imbriquent ; recaler (« trim ») les dentures de crabotage et la marche arrière.
- Entraxe constant → module variable par paire de dents ; calculer le module, ne pas le fixer.
- Géométrie : contours de dents par anneaux polaires (`toothedRing`), solides de révolution `latheX` avec **sens d'enroulement auto** (tester la normale, inverser si besoin), cannelures chanfreinées, voiles ajourés, roulements en `InstancedMesh` (billes/aiguilles), dentures coniques instanciées, carter par enveloppe convexe creuse (`ExtrudeGeometry`).
- Matériaux : acier cémenté `metalness .85 / roughness .25`, laiton `#d4af37 .9/.3`, fonte alu `#a8b0b8 .6/.6`, élastomère `roughness .85`. Environnement : `RoomEnvironment` + PMREM neutre.
- Couleurs SSP (VAG) : orange/rouge = couple, bleu = lubrification, vert = commande/fourchette, gris = pièce folle. Les appliquer par émissif/teinte réversible dans `Part.style`.

## Machine à états de manœuvre (exemple synchro)
`débrayage → retrait → approche → friction → (craquement) → déverrouillage → crabotage → réembrayage`. Constante de synchronisation `τ = τ0 / μ_eff`, `μ_eff = μ_santé × f(T_huile)` ; si le temps requis dépasse le temps de poussée → craquement. Les pannes sont des **paramètres de la sim** (`faults = { wornCone:{gear,mu}, … }`), pas des cas spéciaux dans le rendu. Après un saut/éjection, **réinitialiser tous les états visuels** (bug vécu : baladeur non remis à zéro).

## Coupe avec bouchage (stencil)
Voir `references/sectionView.js` : `renderer.localClippingEnabled = true`, deux passes stencil invisibles par matière (faces arrière +1, avant −1), plan hachuré par matière là où le compteur ≠ 0. Les solides doivent être **fermés**. Prévoir ≈ 2× les triangles quand la coupe est active.

## Boîte automatique (trains épicycloïdaux, embrayages, freins, convertisseur) — retour d'expérience
Un formateur a (à juste titre) refusé une « BVA » à un seul train : une vraie boîte automatique a un convertisseur, plusieurs trains, un bloc hydraulique. Ce qui a fonctionné (`references/bvaSim.js`, `references/atelierBVA.js`) :
- **Architecture type Lepelletier** (train simple réducteur + Ravigneaux, embrayages A-B-E, freins C-D) : tableau d'engagement `1 A+D · 2 A+C · 3 A+B · 4 A+E · 5 B+E · 6 C+E · AR B+D`. Les rapports sont **calculés** (Willis) à partir de nombres de dents chercher par script (multiples de 3 pour 3 satellites, ratio cible ±0,5 %), jamais saisis. Dire clairement que les dents sont génériques.
- **Équations** : simple (soleil fixe, couronne en entrée) `n_réduit = n_in·Zr/(Zr+Zs)` ; Ravigneaux `Z3·ω3 + ZR·ωR = (Z3+ZR)·ωC` et `ωR = ωC + (Z4/ZR)(ω4 − ωC)`. Les relations restent valides pendant les mélanges de rapports (linéaires) → les angles intégrés restent cohérents, les dents engrènent toujours.
- **Passage clutch-to-clutch** : remplissage du piston → transfert de couple (recouvrement) → phase d'inertie (régime moteur change, vitesse véhicule constante). Un seul élément change entre rapports consécutifs.
- **Convertisseur** : rapport SR, multiplication ≈ ×2 au calage, stator bloqué par la roue libre jusqu'à SR ≈ 0,86, pontage ; à la fermeture du pontage conserver la VITESSE (c'est le régime qui baisse).
- **Pannes comme paramètres** : `health` (usure d'un élément), `leak` (fuite au piston), `stuckOff`, `lockupBad`, `pressure`. Capacité d'un élément vs couple à transmettre → patinage, chaleur d'huile, emballement du régime.
- **« Essai des rapports »** : simuler chaque rapport sur une COPIE de la sim (mêmes pannes) puis lire le patinage : montre quels rapports sont touchés et permet le diagnostic par élimination.
- Implantation axiale en schéma fonctionnel (concentriques S3/S4/arbre de turbine) ; l'écrire dans les limites.

## Interface (résumé ; détail dans le skill diagnostic-pedagogique-ux)
Pilotage à gauche, analyse à droite, bandeau « Que faire ? », HUD **en flux** (jamais en `position:absolute` superposé), étiquettes 3D désencombrées en JS, thèmes clair/sombre par variables CSS.

## Livraison
1. Vendoriser Three.js (`three.module.js`, `three.core.js`, OrbitControls, RoomEnvironment, CSS2DRenderer) + importmap → fonctionne hors ligne.
2. `scripts/build-standalone.sh` : esbuild (alias `three`, IIFE) + inline CSS/JS → `dist/<nom>.html` et `dist/index.html` (~800 Ko).
3. Vercel : `scripts/vercel.json` (statique, `outputDirectory: dist`, aucune commande de build). **Demander la confirmation de l'utilisateur avant tout déploiement public.**
4. README : usage en 30 s, limites (valeurs pédagogiques ≠ données constructeur), raccourcis clavier.

## Tests
Chromium headless (swiftshader) : voir le skill `capture-webgl-headless`. Exposer `window.__app` (renderer, camera, module, sim) et `document.body.dataset.ready='1'`. Contrôler : `node --input-type=module --check js/ui.js` (les `\'` dans des heredocs Python cassent les chaînes JS : préférer des guillemets doubles), sim figée (`timeScale=0`) puis pas à pas, recherche automatisée de chevauchements d'UI dans les deux thèmes.

## Pièges rencontrés
- Éléments `locator.screenshot` qui time-out sous WebGL logiciel → `page.screenshot({clip})`.
- Ne pas promettre de perfs GPU : annoncer ≈ 0,7 M triangles (≈ 2 M avec coupe).
- Nombres de dents « inspirés » de boîtes réelles, pas copiés : le dire dans le README.
