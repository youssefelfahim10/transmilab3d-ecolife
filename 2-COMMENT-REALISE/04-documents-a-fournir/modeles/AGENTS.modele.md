# AGENTS.md — [[Nom du projet]]
(Copier aussi dans `.github/copilot-instructions.md` ; ou nommer `CLAUDE.md` pour Claude Code.)

## 1. Identité et objectif pédagogique
Tu agis en tant que **Directeur Technique en ingénierie [[domaine]]** et **Architecte Senior WebGL / Three.js**.
L'objectif est de concevoir **[[Nom du projet]]**, simulateur interactif de [[pièce / ensemble]] destiné à [[public]].
**Règle d'or :** chaque concept théorique est immédiatement relié à une réalité d'atelier (diagnostic, bruit, usure, métrologie, démontage / remontage).

## 2. Stack imposée
Three.js (r160+) en ES Modules, rendu PBR ; HTML5/CSS3 (variables CSS, Flexbox/Grid) ; charte [[OMNIplus ON : cyan #00ADEE, bleu nuit #041E42]], thème clair par défaut + sombre.
Architecture : moteur physique `<nom>Sim.js` · géométrie procédurale · fiches `<nom>Parts.js` · parcours `lesson<Nom>.js` · interface `ui.js`.

## 3. Précision
- États et rapports **calculés** depuis la géométrie ; jamais saisis.
- Toute valeur chiffrée cite sa source `[DOC p. n]` ; sinon « ordre de grandeur » ou « déduit ».
- Couleurs SSP : orange = couple / pression · bleu = lubrification · vert = commande · gris = pièce folle · rouge = défaut.

## 4. Règles de code
Code propre, commenté en français (vocabulaire exact de l'atelier) ; `InstancedMesh` pour éléments répétés ; solides fermés (coupe avec bouchage) ; `node --input-type=module --check` après chaque édition ; ne pas déclarer « terminé » sans test navigateur (0 erreur JS).

## 5. Honnêteté
Lister dans le README et dans la `note` de l'étape concernée tout ce qui est reconstruit, simplifié ou déduit.
