# Guide — reproduire la visualisation guidée TransmiLab 3D pour une autre pièce

> Document unique (Markdown) généré à partir du skill `visualisation-guidee-piece`. Il contient la méthode, les contrats du code, l'écriture d'un parcours guidé, la charte OMNIplus ON et les pièges. Les fichiers de code sont dans le dossier `visualisation-guidee-piece/` du kit.

## Contenu du kit
- `visualisation-guidee-piece/SKILL.md` : le skill (à déposer dans `~/.claude/skills/` ou à importer).
- `visualisation-guidee-piece/templates/` : modèles de code **testés** (sim, module 3D, fiches, parcours, CSS, carte HTML).
- `visualisation-guidee-piece/reference-implementation/` : le code réel de la ZF EcoLife 2.
- `visualisation-guidee-piece/scripts/` : `scaffold.py` (génère + branche un module), `smoke_test.cjs` (déroule le parcours en navigateur), `build-standalone.sh`, recherche de topologies de trains.
- `socle/` : l'application complète (js/, css/, index.html, vendor/ Three.js) pour repartir d'un projet qui fonctionne.

## Démarrage en 3 commandes
```bash
python3 visualisation-guidee-piece/scripts/scaffold.py --root socle --id pompe --class Pompe --title "Pompe à engrenages" --wire
cd socle && python3 -m http.server 8765
NODE_PATH=$(npm root -g) node ../visualisation-guidee-piece/scripts/smoke_test.cjs http://localhost:8765/index.html pompe
```
Le module créé charge, s'anime (arbre, pignon, embrayage à disques), se coupe, s'éclate et déroule son parcours ; remplacer ensuite le contenu d'exemple par la vraie pièce.

---

# 1. Skill
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


---

# 2. Méthode

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


---

# 3. Contrats du code

## Simulation (`<nom>Sim.js`)
| Membre | Rôle |
|---|---|
| `update(dt)` | avance d'un pas ; `dt` est déjà × `timeScale` |
| `timeScale` | ralenti global (0.4 = passage de rapport) |
| `events[]` | `{type:'refus'|'slip'|'shift-start', msg}` vidés par main.js vers `ui.handleEvent` |
| `explain()` | `{chips:[[libellé, actif]], text:'HTML'}` → bandeau « chemin du couple » (ui.updateFlow l'utilise pour tout module qui l'expose) |
| `tele()` | `[[libellé, valeur, unité], …]` cartes de télémétrie (5 premières visibles). **Obligatoire** : `ui.js` l'appelle à chaque trame |
| `flow()` | `{level 0..1}` intensité du flux (coloration SSP) |
| `ang{}` | angles intégrés (rad), lus par `pose()` |
| `forceGear(g, rpm)` / `requestGear(g)` | placement instantané / demande (machine à états) |
| `lv{}, cmd{}, slipEl{}, p{}` | niveau de serrage, commande, patinage, pressions (bar) — lus par `style()`, schéma, mesures |

## Module 3D (`BaseModule`)
`id`, `title`, `sim`, `gearList`, `groups`, `root`, `parts`, `explodePlan` ; méthodes `build()`, `makePlan()`, `pose(sim,dt)`, `style(sim,o)`, `views()`.
- `mk(id,x,y,z,[texte,[dx,dy,dz]], {housing})` crée une `Part` ; `Part.mesh(geo, 'steel'|'alu'|'friction'|'oil'…)`, `Part.instanced(geo, matrices, kind)`.
- `discStack(part,{rA,rB,rC,rD,n,gapOpen,gapClosed})` + `setStack(part, 0..1)` : embrayage/frein multidisque instancié.
- `styleGeneric(o, hook)` : survol / sélection / alerte / rayons X ; le `hook(part, st)` pose `st.emissive/ei/tint/opacity`. `o.focus` = ids mis en évidence par le parcours.
- `views()` : `{ global:{target,pos,fitW,fitH}, <autres vues>…, loupe:{}, diff:null }` ; les boutons `data-bview` et les étapes (`view:`) lisent ces clés.

## UI
- Panneau gauche : pilotage (boutons d'état `gearList`, moteur, charge…) + **carte du parcours** (`#lesson`).
- Panneau droit : onglets Décortiquer / Fiche pièce / Hydraulique / Chercher la panne.
- Modules sans `explain()` retombent sur le texte du Module 3 : toujours fournir `explain()`.

## Parcours (`lessons.js`)
`LESSONS[idModule] = { steps, auto, reset }` — `lessonUI.js` est **générique** (aucun id codé en dur).


---

# 4. Parcours guidé

## Principes
1. **Ordre = trajet réel** de l'énergie : source → transmission → commande → effet. Jamais l'ordre du catalogue.
2. **Une idée par étape**, titre ≤ 8 mots, texte ≤ 60 mots, gras sur 3–5 mots-clés.
3. **Cause → effet visible** : chaque étape agit sur la sim (bouton) ET montre une mesure en direct.
4. **« Regardez »** : 2–3 puces qui disent où poser les yeux (3D, schéma, tableau).
5. **Une question par étape clé** (3 choix, une seule correcte, `why` d'une phrase). En démonstration auto, la bonne réponse s'affiche en fin d'étape.
6. **Niveaux** : le texte principal pour tous ; `deep` (repliable) pour les ingénieurs (formules, nombres de dents, normes).
7. **Honnêteté** : `note` quand une étape repose sur une reconstruction / simplification.

## Squelette type (17 étapes EcoLife)
Vue d'ensemble → tout à zéro → démarrage → régulation de la pression → organe de transmission (convertisseur) → neutre → sélection (commande des éléments) → calage → 1ʳᵉ → mécanique interne (trains) → changement 1→2 au ralenti → rapports suivants → fonctions annexes (pontage, ralentisseur) → arrêt/redémarrage (AIS) → bilan + passerelle vers le diagnostic.
Pour une autre pièce : **vue d'ensemble → état de repos → alimentation → organe principal → commande → mise en charge → régimes de fonctionnement → défauts typiques → bilan**.

## Étape (schéma)
`{ t, text, look[], view, tab, focus[], ts, setup, acts[], live, quiz, deep, note, final }` — voir `templates/lesson.template.js`.

## Démonstration automatique
`AUTO[numéroÉtape] = [{ t: ms, run: ({sim,ui,app}) => … }]`. Durée d'une étape = max(9 s, 0,33 s × nombre de mots, dernière action + 6 s). Les étapes sans action restent le temps de lire. Pause / reprise ; toute navigation manuelle arrête l'auto. Voix : `speechSynthesis` (`fr-FR`), optionnelle (case « 🔊 Voix »), l'étape suivante attend la fin de la phrase.

## Mesures en direct (`live`)
3–4 jauges maximum : `[libellé, valeur, unité, 'ok'|'bad'|'']`. Utiliser 2 décimales pour les rapports (SR 0,98 ≠ 1,0).

## Contrôle qualité d'un parcours
- Chaque étape se comprend **sans la précédente** (rappeler le mot-clé).
- Aucune étape n'affiche un chiffre sans expliquer ce qu'il mesure.
- Le test `smoke_test.cjs` déroule toutes les étapes : 0 erreur JS.


---

# 5. Charte OMNIplus ON

Palette relevée sur le portail OMNIplus ON : cyan `#00ADEE`, bleu nuit `#041E42`, gris-bleu `#627389`, accent `#3399FF`, fond `#F0F2F4`, coins 4 px. Police du portail : DaimlerCS (**propriétaire, non embarquée**) → police système neutre (`"Segoe UI","Helvetica Neue",Arial,system-ui`). Ne pas reproduire le logo.

| Jeton | Clair (par défaut) | Sombre (bleu nuit) |
|---|---|---|
| `--bg` / `--panel` | `#f0f2f4` / `#ffffff` | `#061327` / `#0b2345` |
| `--txt` / `--mut` | `#041e42` / `#566b84` | `#e6eef7` / `#9fb3cc` |
| `--acc` (accent) / `--acc2` (texte accent) | `#00adee` / `#00709e` | `#00adee` / `#6ad3f7` |
| `--on-bg` / `--on-fg` (états actifs pleins) | `#041e42` / `#ffffff` | `#00adee` / `#041e42` |
| bouton principal | fond bleu nuit, texte blanc | fond cyan, texte bleu nuit |

Règles : accent cyan en **fond** ou en **trait**, jamais en texte sur blanc (contraste 2,6:1) → `--acc2`. Liseré du bandeau : dégradé cyan → bleu nuit. Thème **clair par défaut**. Couleurs de **fonction** SSP inchangées (orange pression/couple, bleu lubrification, vert commande, gris pièce folle, rouge défaut). Intégration : `templates/theme-omniplus.css` à ajouter **en fin** de `style.css`.


---

# 6. Pièges

**Simulation** — emballement thermique du ralentisseur (recalibrer les coefficients) · colmatage de filtre sans effet (changer la formule de capacité) · à la fermeture du pontage conserver la vitesse · réinitialiser les états visuels après un saut d'état · afficher SR avec 2 décimales (0,98 et non 1,0).
**3D** — solides ouverts → coupe incorrecte ; couronne mal phasée (dents qui se traversent) → calculer la phase, vérifier `(Zs+Zr)/N` entier ; caméra en vol pendant les captures (rendu lent) → `flyToView(v, true)`.
**UI** — HUD en `position:absolute` qui chevauche → flux (`#stage`) ; onglets qui se compriment sur téléphone → `flex:1 1 100%; order:3` ; texte SVG non centré → `text-anchor: middle` ; débordement horizontal mobile → tester `scrollWidth == clientWidth`.
**Tests** — rendu logiciel LENT : `locator.click` expire → cliquer via `page.evaluate` ; ne pas lancer deux navigateurs en parallèle ; sorties de longs tests vers un fichier + surveillance, pas de `sleep` long ; `head` sur un pipe bufferise → rediriger vers un fichier.
**Outils** — heredocs Python avec `\'` cassent les chaînes JS → guillemets doubles ; `node --input-type=module --check` après chaque édition de JS.
**Livraison** — Vercel `--temporary` expire (ne pas promettre un lien durable) ; Drive : limite ~3 Mo par appel (compresser) ; Git d'entreprise : l'auth par mot de passe est refusée → **jeton personnel** demandé par formulaire sécurisé ; si refus, fournir `git bundle` + commandes.
**Contenu** — ne jamais citer une valeur sans source ; marquer clairement toute topologie reconstruite ; ne pas mélanger couleurs de fonction (SSP) et charte graphique.
