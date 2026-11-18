---
name: pptx-cinematique-depuis-app
description: Produire une présentation PowerPoint (.pptx) futuriste, cinématique et très structurée à partir d'une application ou d'un site (captures et vidéos réelles de l'app, pas de maquettes) — transitions p14 (vortex, flythrough, conveyor, ripple, pan…), animations d'entrée en cascade (fondu, balayage, vol, zoom), diapos pédagogiques tous niveaux, notes de l'orateur, version manuelle et version auto-défilante, QA par rendu LibreOffice. À utiliser quand l'utilisateur veut un PPT/PPTX "cinématique", "futuriste", "déroulant", avec animations et transitions, pour présenter un outil, un simulateur ou un projet web, ou demande de l'intégrer visuellement dans un diaporama, même si pptxgenjs n'est pas cité.
---

# PPTX cinématique à partir d'une application

Pipeline éprouvé sur TransmiLab 3D (29 diapos, 29 transitions, 436 effets d'entrée, 3 vidéos, 29 notes, validation OK). Lire d'abord le skill `anthropic-skills:pptx` pour les bases ; celui-ci ajoute ce qui manque : **animations/transitions natives** et **médias réels**.

## Pipeline
1. **Plan** (Étape 0) : 20–30 diapos en 6–8 sections (Accroche → Pourquoi → Découverte → Fonctionnement → Outils → Diagnostic/Usage → Résultats → Conclusion/Prochaines étapes). 1 idée par diapo, un titre qui énonce le message, une phrase « À retenir ». Public mixte : un niveau « simple » (image + 1 phrase) et un niveau « expert » (chiffres réels) sur la même diapo.
2. **Captures réelles** avec le skill `capture-webgl-headless` : héros plein cadre (thème sombre), vues UI recadrées (panneaux), clair/sombre, 2–3 vidéos courtes (image par image → ffmpeg). Récupérer les **chiffres depuis l'app** (`make_stats.cjs` : nb de pièces, rapports calculés), ne rien inventer.
3. **Fonds & icônes** : `scripts/make_bg.py` (dégradés + grilles « futuristes ») et `scripts/make_icons.js` (icônes SVG→PNG). Fonds en `.jpeg` (voir pièges).
4. **Construction pptxgenjs** : `references/build.exemple.js` (thème, layouts/placeholders, sections, `addNotes`, `addMedia` vidéo). Écrire dans `build.js` un `plan.json` : `{ "<n° diapo>": { transition:{k}, anim:[{name,fx,delay}] } }` (voir `references/plan.exemple.json`). **Nommer chaque objet** (`objectName`) : c'est la clé de l'animation.
5. **Post-traitement** `scripts/postprocess.py raw.pptx` (python-pptx + lxml) : injecte `p:transition` avec `mc:AlternateContent` (p14 + secours standard) et `p:timing` (entrées en cascade, `bldLst`). Produit la version manuelle et la version auto (`advTm` 8–11 s).
6. **Validation** : `python /mnt/skills/public/pptx/scripts/office/validate.py <deck>.pptx` puis rendu LibreOffice → PDF → JPG (`qa/`), inspection visuelle de chaque diapo.
7. **Livraison** : .pptx manuel + .pptx auto + `LISEZ-MOI.md` (ouvrir en mode diaporama F5 ; transitions p14 = PowerPoint 2010+, Keynote/LibreOffice utilisent le secours ; vidéo à lire dans PowerPoint).

## Direction artistique « futuriste »
Fond quasi noir bleuté, accents cyan/ambre, titres larges alignés à gauche, cartes à bords fins, chiffres géants, une seule image héroïque par diapo, rythme : fadeblack (début de section) · vortex/ripple (révélations) · flythrough (zoom sur l'app) · conveyor/pan (suites). Pas plus de 3 effets d'entrée par diapo en cascade (delay croissant 0–1800 ms).

## Mécanique des animations (cf. postprocess.py)
- Presets : fondu `10/0`, balayage `22/8` + `wipe(left)`, vol `2/4` (ppt_x/ppt_y), zoom `53/16` (ppt_w/ppt_h) ; chaque effet = `p:par` `presetClass="entr" nodeType="withEffect"` + `set style.visibility`.
- Départ **automatique** : `cond delay="indefinite"` + `cond evt="onBegin"` sur le `tn val="2"` ; effets au même niveau, `stCondLst delay` échelonnés.
- `bldLst` : `bldP` pour les `sp`, `bldGraphic` pour les `graphicFrame` ; images/`pic` sans entrée dans `bldLst`.
- Transition : `<mc:AlternateContent>` avec `mc:Choice Requires="p14"` + `mc:Fallback` ; placer juste après `clrMapOvr`, puis `p:timing` après la transition.

## Pièges rencontrés (tous résolus)
- `pptxgenjs` : `addSection` **avant** les diapos ; `applyTheme` demande `NODE_PATH=…/node_modules` pour trouver jszip.
- Images `.jpg` non déclarées dans `[Content_Types]` après python-pptx → **utiliser `.jpeg`**.
- Couverture vidéo : doit être un **data URI base64** (helper `B64()`).
- Titres centrés qui chevauchent l'image, cartes recouvrant la barre « À retenir », titres de conclusion qui passent à la ligne → placeholders **alignés à gauche**, layout `TITLE_L`, largeur minimale de segments, vérification visuelle systématique.
- Fichier lourd (~8 Mo) à cause des vidéos : prévenir l'utilisateur avant envoi par e-mail (limite 40 Mo Resend, 25 Mo Gmail).
- Les liens à insérer après déploiement (ex. Vercel) : prévoir une diapo avec un **placeholder explicite** et le signaler dans le message final.
