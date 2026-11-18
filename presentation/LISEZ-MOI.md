# Présentation TransmiLab 3D (PowerPoint)

| Fichier | Usage |
|---|---|
| `TransmiLab3D_Presentation.pptx` | Version **présentateur** : on avance au clic ; transitions et animations d'entrée automatiques sur chaque diapo (8,7 Mo). |
| `TransmiLab3D_Presentation_Auto.pptx` | Version **film / déroulante** : mêmes diapos, avance automatique (8 à 11 s par diapo). Lancer le diaporama (F5) avec « Utiliser les minutés » coché. |
| `…_Light.pptx` (×2) | Mêmes diapos, **images et vidéos recompressées (≈ 2,5 Mo)** : pour l'envoi par e-mail ou le dépôt sur un Drive. |

31 diapositives · 4 chapitres (Découvrir, Décortiquer, Diagnostiquer, Mettre en œuvre) · notes de l'orateur sur chaque diapo ·
3 vidéos issues du simulateur (cliquer dessus pour les lancer) · visuels 3D = captures réelles de TransmiLab 3D.

**Nouveau (Module 2 réaliste)** : diapo 17 (modules), diapo 18 « Lire une boîte automatique : un seul tableau »
et diapo 24 « Trouver l'élément commun aux rapports en panne » (3 nouveaux cas : embrayage B usé, frein D qui fuit,
broutement du pontage). Le Module 3 (double embrayage) reste une base fonctionnelle, sans cas pratique.

Diapo 30 : indique le fichier unique `transmilab3d.html` ; ajouter le lien Vercel définitif quand il existera.
Valeurs de métrologie / durées : repères pédagogiques à valider.

`src/` : scripts de fabrication (pptxgenjs + Python : `build.js`, `postprocess.py`, `make_light.py`, captures Playwright) —
non nécessaires pour présenter.
