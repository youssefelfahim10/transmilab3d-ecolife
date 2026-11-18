# Mettre les skills TransmiLab 3D sur GitHub Copilot ou LibreChat

> **Dans CE dépôt, l'installation Copilot est déjà faite** : les 5 skills sont dans `.github/skills/` et les règles du projet dans `AGENTS.md` et `.github/copilot-instructions.md` (racine). Les fichiers `.skill` à importer dans LibreChat sont dans `2-COMMENT-REALISE/02-skills/importables/`. Les sections ci-dessous décrivent le **paquet autonome** à copier dans un autre dépôt.


**Réponse courte : oui.** Ces skills sont au format **Agent Skills** (`SKILL.md` + dossiers `references/`, `scripts/`, `templates/`), un **standard ouvert** (agentskills.io) que GitHub Copilot et LibreChat lisent tous les deux. Vérifié dans leurs documentations officielles (VS Code « Use Agent Skills », GitHub Docs « Add agent skills », LibreChat « Skills »).

> ⚠ **Je n'ai pas pu tester dans votre Copilot ni votre LibreChat** : seule la conformité au format est vérifiée. Faites la petite vérification indiquée plus bas.

## Ce que contient ce dossier

| Dossier | Usage |
|---|---|
| `copilot/.github/skills/` | les 5 skills prêts pour Copilot (projet) |
| `copilot/.github/copilot-instructions.md` + `copilot/AGENTS.md` | règles du projet (équivalent de CLAUDE.md) |
| `copilot/installer_perso.sh` | installe les skills pour votre compte (`~/.copilot/skills/`) |
| `librechat/skills/*.skill` | les 5 skills à importer dans LibreChat |
| `librechat/prompt-agent-concepteur.md` | instructions pour un agent LibreChat dédié |
| `projet/` | l'application TransmiLab 3D complète (point de départ) |
| `docs-a-mettre-en-place/` | **PROMPT-MAITRE.md** (le prompt à utiliser), **DOCUMENTS-A-PREPARER.md** (les documents à fournir / créer) et `modeles/` (cahier des charges, extraction, plan du parcours, recette, AGENTS) |

Les 5 skills :

- `simulateur-3d-pedagogique` : géométrie, coupe, livraison ;
- `diagnostic-pedagogique-ux` : décortiquer et chercher la panne ;
- `visualisation-guidee-piece` : **refaire la visualisation pour une autre pièce** (modèles + `scaffold.py`) ;
- `capture-webgl-headless` : tests navigateur ;
- `pptx-cinematique-depuis-app` : présentation.

## A. GitHub Copilot (recommandé : c'est lui qui peut tout reproduire)

Fonctionne avec Copilot dans **VS Code (mode agent)**, **Copilot CLI**, le **Copilot cloud agent** et l'app Copilot.

1. **Dans votre dépôt** (par exemple le Git d'entreprise `Simulation-EcoLife`) : copier `copilot/.github/` à la racine, ce qui donne `.github/skills/<nom>/SKILL.md`. Tous les collègues qui ouvrent le dépôt en bénéficient.
   **Pour vous seul** : `bash copilot/installer_perso.sh` (copie dans `~/.copilot/skills/`).
2. Copier aussi `projet/` (l'application) dans le dépôt si ce n'est pas déjà fait.
3. **Vérifier** : nouvelle conversation Copilot en **mode Agent**, taper `/` : les 5 skills apparaissent. Les lancer, par exemple `/visualisation-guidee-piece Crée un module pour <ma pièce> à partir du manuel joint`.
4. Prérequis des scripts, dans votre terminal : Python 3, Node.js, et pour les tests `npm i -D playwright && npx playwright install chromium`.

Règles de format respectées (docs VS Code) : `name` = nom du dossier, minuscules/chiffres/tirets, ≤ 64 caractères ; `description` ≤ 1 024 caractères (les nôtres : 522 à 775).

## B. LibreChat

1. Panneau latéral **Skills → « + » → Upload a skill**, puis choisir un fichier `.skill` de `librechat/skills/` (un par un). Si « Skills » est absent, votre administrateur l'a désactivé (capacité `skills`).
2. Créer un **Agent** (Agent Builder), coller `librechat/prompt-agent-concepteur.md` dans les instructions, puis section **Skills = Selected** et ajouter les 5 skills (un agent ciblé choisit mieux qu'un agent à 40 skills).
3. Utilisation : taper `$` dans le chat pour choisir un skill, ou laisser l'agent le choisir d'après sa description.
4. Limites de taille respectées (50 Mo / 500 fichiers / 10 Mo par fichier ; chaque paquet fait moins de 150 Ko).
5. Joindre le **manuel constructeur** à la conversation (File Search / File Context) : c'est lui qui donne les valeurs exactes.

## Ce qui ne sera PAS identique

- **Accès aux fichiers et au terminal.** Ici, l'assistant écrit dans le projet, lance un serveur, pilote Chromium et corrige selon les erreurs. **Copilot en mode agent** sait le faire (édition, terminal). **LibreChat** non par défaut : il produit le code dans le chat, **vous** l'enregistrez et lancez `smoke_test.cjs`, puis collez les erreurs. Un serveur MCP « système de fichiers » peut y remédier (non testé). Les scripts d'un skill ne tournent dans LibreChat que si « Run Code » est actif, dans un bac à sable où Playwright/Chromium n'est probablement pas disponible.
- **Le modèle.** La qualité (géométrie 3D, cohérence des 17 étapes) dépend du modèle choisi : un petit modèle fera plus d'erreurs. Utiliser le plus capable disponible et garder `smoke_test.cjs` comme arbitre.
- **Noms de fichiers.** L'équivalent de `CLAUDE.md` est `.github/copilot-instructions.md` / `AGENTS.md` (fournis). Aucun outil propre à Claude n'est requis par les skills.
- **Sécurité.** Les skills contiennent des scripts (`scaffold.py`, `smoke_test.cjs`, `build-standalone.sh`) : les relire avant de les exécuter. Vérifier aussi la politique de votre entreprise sur les outils d'IA autorisés et sur le partage de documents constructeur.

## Prompt de démarrage conseillé (Copilot ou LibreChat)

> Utilise le skill visualisation-guidee-piece. Pièce : <nom>. Public : élèves techniciens et ingénieurs. Document de référence : <PDF joint>. Je veux : présentation de l'ensemble, visualisation de chaque sous-ensemble et de son influence sur la chaîne de fonctionnement, circuit à animer, parcours guidé pas à pas du mouvement 0 à la fin avec démonstration automatique. Commence par l'extraction du document (`docs/extraction.md`), liste les valeurs données et celles que tu devras déduire, puis génère le module avec `scaffold.py`.
