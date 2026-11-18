# TransmiLab 3D — Simulation ZF EcoLife 2

Simulateur 3D pédagogique de boîtes de vitesses pour la formation technique (de l'élève technicien à l'ingénieur) : boîte manuelle, **boîte automatique ZF EcoLife 2** (convertisseur, ralentisseur, embrayages, freins, trains épicycloïdaux, circuit hydraulique animé), double embrayage (base).

Ce dépôt est organisé en **deux parties** : *ce qui a été réalisé*, et *comment ça a été réalisé* (pour le refaire sur une autre pièce).

| | Partie | Contenu | Pour qui |
|---|---|---|---|
| 🛠 | **[`1-PROJET-REALISE/`](1-PROJET-REALISE/README.md)** | l'application (code, styles, Three.js embarqué), le fichier HTML prêt à ouvrir | élèves, formateurs, développeurs du projet |
| 📚 | **[`2-COMMENT-REALISE/`](2-COMMENT-REALISE/README.md)** | méthode, skills, prompts, documents à fournir, modèles, journal, présentation | quiconque veut **reproduire** la démarche |
| ⚙ | `.github/skills/` · `AGENTS.md` · `CLAUDE.md` · `.github/copilot-instructions.md` | les 5 skills et les règles de projet **à la racine** (là où GitHub Copilot / Claude Code les cherchent) | outils d'IA |

## Démarrage en 30 secondes
- **Voir le résultat** : ouvrir `1-PROJET-REALISE/livrables/TransmiLab3D_EcoLife.html`, onglet *Module 2*, bouton **« ▶ Démonstration automatique »** (ou « 🎓 Parcours guidé »).
- **Lancer depuis les sources** : `cd 1-PROJET-REALISE && python3 -m http.server 8765` puis `http://localhost:8765/index.html`.
- **Refaire pour une autre pièce** : lire `2-COMMENT-REALISE/README.md`, puis utiliser le prompt de `2-COMMENT-REALISE/03-prompts/PROMPT-MAITRE.md`.

## Honnêteté : ce qui est donné, ce qui est reconstruit
- Rapports (3,36 · 1,98 · 1,44 · 1,00 · 0,70 · 0,59 · AR −3,77), pressions (PHD 10–12 bar…), plages de mesure et règles de diagnostic viennent du **manuel technique ZF EcoLife 2** fourni (le manuel lui-même n'est **pas** dans ce dépôt).
- Les **liaisons internes des trois trains épicycloïdaux** sont **reconstruites par calcul** pour retrouver le tableau de rapports ZF (écart 0,06 %) : le schéma cinématique constructeur n'était pas disponible. **À valider avec le formateur.**
- Nombres de dents déduits ; implantation axiale simplifiée ; dynamique de pression / patinage / température = ordres de grandeur.
- Design : palette relevée sur le portail OMNIplus ON ; le logo et la police DaimlerCS ne sont pas reproduits.
