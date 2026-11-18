---
name: diagnostic-pedagogique-ux
description: Concevoir l'expérience d'apprentissage et de diagnostic d'un outil interactif pour apprenants — "décortiquer" un système (arbre des pièces, isoler, écarter, masquer, mode scalpel, fiche pièce, mesure simulée), "chercher la panne" en démarche guidée à 6 étapes (reproduire, observer, hypothèse, mesurer, désigner, réparer) avec indices à 3 niveaux, bandeau coach "Que faire ?", visite guidée, thème clair/sombre, et zéro chevauchement d'interface. À utiliser pour tout simulateur, outil de formation, atelier virtuel, quiz de diagnostic, ou quand l'utilisateur demande clarté, simplicité, lisibilité, "pas de chevauchement", mode light/dark, "rendre la compréhension très simple", même hors Three.js.
---

# UX pédagogique : décortiquer + diagnostiquer, en clair

Principe directeur donné par l'utilisateur : **clarté et simplicité d'usage avant tout**, compréhension et diagnostic « très simples », **aucun chevauchement**, **mode clair ET sombre**. Chaque écran répond à « Que fais-je maintenant ? ».

## 1. Disposition
- 3 zones : **je pilote** (gauche), **je regarde** (centre), **j'analyse** (droite, onglets : 🔬 Décortiquer · 📋 Fiche pièce · 🩺 Chercher la panne).
- **Bandeau coach** « Que faire ? » toujours visible : une phrase, une action suivante.
- **HUD en flux** (flex/grid, empilé), jamais en `position:absolute` qui se recouvre. Test automatique : pour chaque bloc visible, comparer les `getBoundingClientRect()` deux à deux (clair + sombre, plusieurs tailles de fenêtre) ; viser 0 intersection.
- **Étiquettes 3D (CSS2DRenderer)** : algorithme de désencombrement en JS — trier par priorité (sélection > pièces suspectes > principales), placer, repousser/masquer celles qui touchent une déjà placée.
- Thème : variables CSS (`--bg`, `--panel`, `--ink`, `--accent`…), détection `prefers-color-scheme` au 1er chargement, bascule ☀/🌙 mémorisée (`localStorage` dans un try/catch), canvas à fond transparent pour hériter du thème. Vérifier contraste dans les deux thèmes.

## 2. Décortiquer
- **Arbre des pièces** avec recherche ; groupes fonctionnels (ex. « chaîne de 3ᵉ », « synchroniseur 1/2 », « différentiel »).
- **Isoler** un groupe (le reste en fantôme) + **Écarter** (les pièces du groupe s'espacent selon leur axe).
- 👁 masquer/réafficher · ✂ **mode scalpel** (un clic = masquer) · **vue éclatée progressive** dans l'ordre réel de démontage (étapes numérotées) · coupe en 1 clic · loupe sur la zone clé.
- **Fiche pièce** : « en clair » (1 phrase), rôle, contrôle/métrologie, symptômes d'usure, remontage + bouton **🔬 Contrôler** (mesure simulée → jauge neuf / limite / mesuré).
- **Chemin du couple** (ou du flux) : chaîne cliquable « moteur → … → roues » avec phrase en clair et le vrai calcul (« 28 dents → 37 dents, régime ÷ 1,321 »).

## 3. Chercher la panne — assistant une étape à la fois
Étapes : **Reproduire → Observer → Hypothèse → Mesurer → Désigner → Réparer**. Boutons Précédent/Suivant, une seule étape affichée.
- Données d'un scénario (voir `references/atelierScenarios.exemple.js`) : symptôme client, conditions de reproduction (ex. huile froide, 2ᵉ rapport), `demo` rejouable, `observe` (ce qu'on voit/entend), `hypotheses` (QCM avec bonne réponse + explication), `mesures` (valeurs simulées par pièce), pièces coupables, **3 niveaux d'indice** (orientation → zone → pièce), `protocole` de réparation (couples, précautions), `retenir` (3 points « À retenir »).
- Étape « Désigner » : l'apprenant **clique sur la pièce** en 3D ; `checkDiagnosis` répond par un feedback pédagogique (pas seulement vrai/faux : pourquoi une pièce voisine n'est pas la cause).
- Prévoir un **carnet de mesures** qui garde ce qui a été relevé.
- Au moins 3 scénarios de nature différente (usure progressive, défaut intermittent, défaut de lubrification/roulement) ; panne = paramètre de la simulation, jamais un trucage visuel.

## 4. Première utilisation
Visite guidée en 5–6 bulles (mémorisée), raccourcis clavier affichés, bouton « Recommencer ». Textes en vocabulaire de métier + traduction simple entre parenthèses.

## 5. Garde-fous honnêtes
Valeurs de métrologie/couples = ordres de grandeur pédagogiques ; renvoyer à la documentation constructeur. Ne jamais prétendre à une validation officielle.

## 6. Checklist de recette
☐ aucun chevauchement (test auto, 2 thèmes) ☐ chaque écran a sa phrase « Que faire ? » ☐ un clic pour isoler/écarter/masquer/couper ☐ 3 pannes jouables de bout en bout ☐ indices en 3 niveaux ☐ fiche sur toutes les pièces ☐ lisible sur projecteur (police ≥ 14 px, contraste AA).
