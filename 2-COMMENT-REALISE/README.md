# Partie 2 — Comment ça a été réalisé (et comment le refaire)

Tout ce qu'il faut pour **reproduire la même visualisation pour une autre pièce**, avec GitHub Copilot, LibreChat ou Claude.

## Lire dans cet ordre
| # | Dossier | Contenu | Quand |
|---|---|---|---|
| 1 | [`06-journal/`](06-journal/JOURNAL-DE-REALISATION.md) | **ce qui s'est passé** : étapes, décisions, erreurs, tests, limites | pour comprendre la démarche |
| 2 | [`01-methode/`](01-methode/GUIDE-REPRODUIRE-UNE-PIECE.md) | guide unique : méthode en 10 étapes, contrats du code, écriture d'un parcours, charte, pièges | avant de commencer |
| 3 | [`04-documents-a-fournir/`](04-documents-a-fournir/DOCUMENTS-A-PREPARER.md) | les documents à rassembler + **modèles à remplir** (cahier des charges, extraction, plan du parcours, recette) | **préparation** |
| 4 | [`03-prompts/`](03-prompts/PROMPT-MAITRE.md) | **le prompt à utiliser** : court, complet, par phase, de contrôle | **lancement** |
| 5 | [`02-skills/`](02-skills/SKILLS.md) | les 5 skills (sources dans `../.github/skills/`) + fichiers `.skill` à importer | installation |
| 6 | [`05-portage-copilot-librechat/`](05-portage-copilot-librechat/LISEZ-MOI.md) | mettre les skills sur Copilot / LibreChat, prompt d'agent, limites | installation |
| 7 | [`07-presentation/`](07-presentation/LISEZ-MOI.md) | scripts de la présentation PowerPoint cinématique | si besoin d'un diaporama |

## Les 5 skills (dans `.github/skills/`)
| Skill | Rôle |
|---|---|
| `visualisation-guidee-piece` | **refaire la visualisation pour une autre pièce** : méthode, modèles testés, `scaffold.py`, `smoke_test.cjs`, prompts |
| `simulateur-3d-pedagogique` | géométrie procédurale, coupe avec bouchage, vue éclatée, livraison monofichier |
| `diagnostic-pedagogique-ux` | « décortiquer » + « chercher la panne » en 6 étapes |
| `capture-webgl-headless` | tester / capturer une application WebGL avec Chromium headless |
| `pptx-cinematique-depuis-app` | présentation PowerPoint cinématique à partir de l'application |

## Reproduire en 5 gestes
1. Rassembler les documents (`04-…`) dans un nouveau dossier `docs/sources/`.
2. Copier ce dépôt (ou `.github/` + `1-PROJET-REALISE/`) comme point de départ.
3. Ouvrir Copilot en **mode Agent** (VS Code) et taper `/` : les skills apparaissent.
4. Coller le prompt de `03-prompts/PROMPT-MAITRE.md` (variables `[[…]]` remplies), joindre le manuel.
5. Avancer **une phase par message**, exiger la preuve (test Node, test navigateur, capture), valider avec le formateur.

## Limites à connaître
Ces skills sont au format standard Agent Skills (vérifié dans les documentations de Copilot et LibreChat) mais **non testés dans un Copilot / LibreChat réel** ; LibreChat n'accède pas au disque ni au navigateur par défaut. Voir `05-portage-copilot-librechat/LISEZ-MOI.md`.
