# Documents à mettre en place pour créer une visualisation comme celle-ci

## 1. Documents À FOURNIR (matière première)
| # | Document | Pourquoi | Obligatoire | Exemple EcoLife 2 |
|---|---|---|---|---|
| 1 | **Manuel technique constructeur** (PDF/DOCX, édition précisée) | source de toutes les valeurs et du vocabulaire | OUI | Manuel technique ZF EcoLife 2 FR (réf. ZF 4188.751.201) |
| 2 | **Schéma cinématique / coupe mécanique** | topologie réelle (qui est relié à quoi) | OUI (sinon reconstruit par calcul et à valider) | coupe ZF fig. 7 ; schéma cinématique **non disponible** → reconstruit |
| 3 | **Tableau d'engagement / de fonctionnement** | états et éléments appliqués ; rapports | OUI | 1 = A+F … 6 = B+E, AR = D+F ; rapports 3,36 … 0,59 |
| 4 | **Schéma hydraulique / électrique avec repères** | circuit animé, repères des prises de mesure | OUI pour un circuit | schéma ZF 4188.700.001 (repères 1 à 31) |
| 5 | **Valeurs de contrôle + conditions de mesure** | jauges et plages ok/bad | OUI | PHD 10-12 bar, A8, D6, D8 ; huile 50-65 °C, N, WK ouvert |
| 6 | **Règles et exemples de diagnostic** | cas pratiques réalistes | OUI | élément commun, Δp filtre < 0,8 bar, PHD ≥ 1,5 bar après 20 s |
| 7 | **Liste des composants avec repères et pages** | fiches des pièces | recommandé | tables du manuel |
| 8 | **Retour du formateur** (cahier des charges oral) | ce qu'il faut montrer en priorité | OUI | « présenter la boîte, convertisseur, blocs hydrauliques, freins, trains, influence de chaque élément » |
| 9 | **Public et niveau** | ton, profondeur, encarts « ingénieurs » | OUI | élèves techniciens → ingénieurs |
| 10 | **Charte graphique** | cohérence visuelle | optionnel | OMNIplus ON : cyan #00ADEE, bleu nuit #041E42 |
| 11 | **Photos / vidéos d'atelier** | réalisme, vérification de la coupe | optionnel | — |

> Plus le document 2 (schéma cinématique) est fourni, plus la simulation est « officielle ». Sans lui, demander au formateur le PDF de réparation niveau 1/2 pour **valider** la reconstruction.

## 2. Documents du PROJET à créer (modèles dans `docs/modeles/`)
| Fichier | Contenu | Modèle |
|---|---|---|
| `AGENTS.md` ou `.github/copilot-instructions.md` (ou `CLAUDE.md`) | identité, stack, précision, couleurs, règles de code | `modeles/AGENTS.modele.md` |
| `docs/cahier-des-charges.md` | public, demandes du formateur, livrables, critères | `modeles/cahier-des-charges.md` |
| `docs/extraction.md` | composants, états, valeurs, règles, **donné vs déduit** | `modeles/extraction.md` |
| `docs/plan-parcours.md` | les N étapes (titre, idée, vue, mesure, question) | `modeles/plan-parcours.md` |
| `docs/recette.md` | checklist de validation (tests, captures, limites) | `modeles/recette.md` |
| `docs/glossaire.md` | vocabulaire d'atelier + définitions courtes | à tenir à jour |
| `README.md` | usage en 30 s, **limites honnêtes**, raccourcis | existant |

## 3. Arborescence conseillée
```
projet/
├─ AGENTS.md  (+ .github/copilot-instructions.md)
├─ .github/skills/…            ← les 5 skills
├─ docs/
│  ├─ sources/                 ← PDF/DOCX constructeur (ne pas modifier)
│  ├─ extraction.md · cahier-des-charges.md · plan-parcours.md · recette.md · glossaire.md
├─ js/  css/  vendor/  index.html  tools/
└─ README.md
```

## 4. Ordre de mise en place (1 journée de cadrage, puis itérations)
1. Rassembler les documents 1 à 9 → `docs/sources/`.
2. Écrire le cahier des charges avec le formateur (modèle fourni) — 30 min.
3. Installer les skills + `AGENTS.md`.
4. Lancer le **prompt maître** (A ou B), phase 0 → 1, valider `extraction.md` avec le formateur.
5. Phases 2 → 3 (moteur + test Node) : **ne pas passer à la 3D tant que les écarts ne sont pas < 0,1 %**.
6. Phases 4 → 8, une par message.
7. Phases 9 → 10, recette (`docs/recette.md`), démonstration au formateur.

## 5. Ce qui fait la différence (leçons du projet)
- Le formateur a refusé un premier modèle « un seul train » : une **vraie** boîte automatique a convertisseur, plusieurs trains, freins, bloc hydraulique. Demander dès le début ce qu'il veut **voir**.
- Les chiffres du manuel rendent l'outil crédible ; ce qui est reconstruit doit être **écrit** partout où il apparaît.
- Un parcours **pas à pas** (cause → effet, mesure en direct) vaut mieux qu'une interface riche : l'élève ne doit jamais se demander quoi regarder.
