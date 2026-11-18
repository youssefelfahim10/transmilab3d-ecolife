# Contrats du code (ce que main.js et ui.js attendent)

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
