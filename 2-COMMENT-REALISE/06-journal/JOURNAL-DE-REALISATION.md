# Journal de réalisation — ce qui s'est réellement passé

Récit honnête du projet, dans l'ordre. Il sert à comprendre **pourquoi** la méthode (`01-methode/`) est celle-là, et quelles erreurs éviter.

## Phase 1 — Le simulateur de départ (TransmiLab 3D)
- **Besoin** : un simulateur 3D interactif de boîtes de vitesses pour des élèves en maintenance automobile.
- **Réalisé** : Module 1 (boîte manuelle 5 rapports + marche arrière + différentiel, ≈ 80 pièces, 3 pannes guidées), base du Module 3 (double embrayage), coupe avec bouchage, vue éclatée, couleurs SSP, thèmes clair/sombre.
- **Méthode** : `CLAUDE.md` (identité, stack, précision) puis architecture modulaire : moteur physique, géométrie procédurale, fiches, scénarios, interface.
- **Livrables dérivés** : présentation PowerPoint cinématique (31 slides), 4 skills réutilisables, envoi par mail et dépôt sur Drive.

## Phase 2 — Premier Module 2 « boîte automatique » (rejeté)
- Première version : boîte automatique générique de type Lepelletier (un train réducteur + un Ravigneaux), tableau d'engagement calculé par Willis.
- **Retour d'un formateur** : « c'est une boîte mécanique, il peut représenter un pignon, mais pour une boîte auto c'est plus complexe à cause des freins et des trains épicycloïdaux ».
- **Enseignement** : demander dès le début **ce que le formateur veut voir**, et partir d'un **document constructeur** réel plutôt que d'une architecture « inspirée ».

## Phase 3 — Reprise à partir du manuel ZF EcoLife 2
- **Demande du formateur** : présenter la boîte, visualiser le convertisseur, les blocs hydrauliques, toute la chaîne, les freins, les trains épicycloïdaux, et montrer **chaque élément et son influence sur la chaîne**.
- **Extraction du manuel** (DOCX) : composants et repères, tableau d'engagement (1 = A+F … 6 = B+E, AR = D+F), schéma hydraulique (repères 1 à 31), valeurs de contrôle, règles de diagnostic.
- **Problème** : le **schéma cinématique** (qui est relié à quoi dans les trois trains) n'était pas dans le document.
- **Solution (et limite)** : recherche par force brute des topologies à 3 trains simples compatibles avec le tableau de rapports ZF ; famille de solutions unique retenue ; les rapports calculés retombent à **0,06 %** du tableau. C'est une **reconstruction**, signalée comme telle partout, à **valider avec le formateur**.
- **Moteur de simulation** (`ecoSim.js`) validé **en Node avant la 3D** : calage, passage 1→2 embrayage sur embrayage, pontage WK, ralentisseur, maintien de PHD à l'arrêt, règles du manuel (élément commun, Δp filtre < 0,8 bar, PHD ≥ 1,5 bar après 20 s).
- **Erreurs rencontrées** : emballement thermique du ralentisseur (coefficients recalibrés) ; filtre colmaté sans effet (formule de capacité changée) ; conservation de la vitesse à la fermeture du pontage.
- **Modèle 3D** (`module2Eco.js`, ≈ 90 pièces), **fiches** (`ecoParts.js`), **7 cas pratiques** (`atelierEco.js`), **schéma hydraulique animé** (`hydroDiagram.js`).

## Phase 4 — Clarté pédagogique
- **Demande** : « très clair, que les élèves comprennent étape par étape, du mouvement 0 à la fin, avec la simulation de la chaîne hydraulique, bien présenté, simple et guidé ».
- **Réalisé** : parcours guidé de **17 étapes** (une idée par étape, mesures en direct, mini-questions corrigées, encart « pour aller plus loin »), puis **démonstration automatique** (la simulation se lance et s'explique seule ; pause ; voix optionnelle).
- **Tests** : parcours déroulé en entier dans Chromium headless, 0 erreur JavaScript ; démonstration auto vérifiée sur les 4 premières étapes (une étape ≈ 20 s) ; la voix n'a **pas** pu être testée (pas de son dans l'environnement).

## Phase 5 — Charte graphique OMNIplus ON
- Palette relevée sur le portail OMNIplus ON (cyan #00ADEE, bleu nuit #041E42, gris-bleu #627389, fond #F0F2F4, coins 4 px). Thème clair par défaut, sombre en bleu nuit.
- Logo non reproduit ; police DaimlerCS (propriétaire) remplacée par une police système.
- Contrôlé : bureau et téléphone 390 px, clair et sombre, aucun chevauchement ni défilement horizontal.
- **Piège** : le texte accent cyan sur fond blanc a un mauvais contraste → cyan en fond / trait, bleu foncé (#00709E) pour le texte.

## Phase 6 — Rendre la méthode réutilisable
- Refactorisation : le contrôleur du parcours devient **générique** (registre `lessons.js`), l'interface accepte tout module qui fournit `explain()` et `tele()`.
- Skill `visualisation-guidee-piece` : méthode en 10 étapes, contrats du code, modèles (`sim`, `module`, `parts`, `lesson`), `scaffold.py`, `smoke_test.cjs`.
- **Test du kit** : un module d'essai « Pompe » généré par `scaffold.py`, branché automatiquement, parcours déroulé dans Chromium : le test a révélé une **fonction manquante dans le modèle** (`tele()`), corrigée avant livraison.
- Portage Copilot / LibreChat : format Agent Skills vérifié dans les documentations officielles ; **non testé** dans un Copilot / LibreChat réel.
- Prompt maître, liste des documents à fournir, modèles (cahier des charges, extraction, plan du parcours, recette).

## Livraison et difficultés de diffusion
- **Lien Vercel temporaire** : fonctionne mais expire ; l'utilisateur n'en veut pas → fichiers livrés directement (HTML autonome).
- **Mobile** : un premier affichage chevauchait (HUD en `position:absolute`) → refonte en flux (`#stage`).
- **Git d'entreprise** (`git.t3.daimlertruck.com`) : hôte débloqué dans l'environnement, mais le serveur refuse les mots de passe (jeton personnel exigé, non fourni) → **push non fait** ; un `git bundle` a été remis.
- **Dépôt personnel GitHub** : ce dépôt.

## Ce qui reste à faire
1. **Valider la cinématique** avec le formateur (schéma cinématique ou PDF de réparation niveau 1/2) → remplacer la reconstruction.
2. **Refaire la présentation PowerPoint** : elle montre encore l'ancienne boîte (type Lepelletier).
3. Faire citer à **chaque étape sa page du manuel** (aujourd'hui seules les fiches de pièces citent les pages).
4. Tester la **voix** et la démonstration automatique sur les 17 étapes sur un vrai poste ; tester sur un téléphone réel.
5. Tester les skills dans un **vrai Copilot / LibreChat**.
6. Pousser vers le **Git d'entreprise** (jeton personnel requis).

## Tests effectués (preuves)
| Test | Résultat |
|---|---|
| Moteur EcoLife en Node : rapports vs tableau ZF | écart ≤ 0,06 % |
| Parcours guidé, 17 étapes, Chromium headless | 0 erreur JS |
| Interactions (bouton d'action, question, sortie) | OK |
| Démonstration automatique, 4 premières étapes + pause | OK, 0 erreur |
| Mobile 390 px | `scrollWidth == clientWidth` |
| Module généré par `scaffold.py` (« Pompe ») | charge, anime, parcours OK, 0 erreur (après correction de `tele()`) |
| HTML autonome (file://) | parcours chargé, thème clair, 0 erreur |
