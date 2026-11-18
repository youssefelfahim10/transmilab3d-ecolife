# Prompt maître — créer une visualisation guidée comme TransmiLab 3D / EcoLife 2

À utiliser dans **GitHub Copilot (mode agent)**, **LibreChat** (agent « Concepteur TransmiLab ») ou **Claude**, avec les 5 skills installés.
Remplacer tout ce qui est entre `[[doubles crochets]]`.

## Mode d'emploi (5 règles)
1. **Joindre le document constructeur** (PDF/DOCX) avant le premier message. Sans lui, tout sera « inspiré » et l'assistant doit le dire.
2. **Une phase par message** (voir C). Ne pas demander « tout » d'un coup : les erreurs s'accumulent.
3. **Exiger une preuve** à chaque phase : test Node, test navigateur, capture, ou valeur comparée au manuel.
4. **Relire les limites** : tout ce qui est « déduit / reconstruit / simplifié » doit être listé.
5. **Valider avec le formateur** avant de diffuser (le schéma cinématique, les valeurs, le vocabulaire).

---

## A. Prompt court (30 secondes)
```
Utilise le skill visualisation-guidee-piece. Pièce : [[nom de la pièce]]. Public : [[élèves techniciens / techniciens / ingénieurs]].
Document de référence joint : [[nom du fichier]]. Je veux présenter l'ensemble, visualiser chaque sous-ensemble et son influence
sur la chaîne de fonctionnement, animer le circuit, et avoir un parcours guidé pas à pas du mouvement 0 à la fin avec démonstration
automatique. Commence par l'extraction du document (docs/extraction.md) : liste ce qui est DONNÉ (avec la page) et ce que tu devras DÉDUIRE.
```

## B. Prompt complet
```
RÔLE
Tu es Directeur Technique en ingénierie [[automobile / poids lourds / énergie]] et architecte Senior WebGL / Three.js.

OBJECTIF
Créer « [[Nom du projet]] » : un simulateur 3D interactif de [[la pièce / l'ensemble]] pour [[public et niveau]].
Règle d'or : chaque concept théorique est relié à une réalité d'atelier (diagnostic, bruit, usure, mesure, démontage / remontage).

CE QUE LE FORMATEUR DEMANDE (à reprendre mot pour mot)
« [[présenter l'ensemble ; visualiser chaque sous-ensemble (ex. convertisseur, blocs hydrauliques, freins, trains) ;
  toute la chaîne à visualiser ; montrer chaque élément et son influence sur la chaîne de fonctionnement]] »

DOCUMENTS DE RÉFÉRENCE (joints)
- [[manuel technique, réf. + édition]]
- [[schéma hydraulique / électrique avec repères]]
- [[tableau d'engagement / de fonctionnement]]
- [[valeurs de contrôle et conditions de mesure]]
- [[exemples de pannes du manuel]]
Tout chiffre doit citer sa page [DOC p. n]. Ce qui n'est pas dans les documents est « déduit » ou « simplifié » et doit être signalé.

LIVRABLES
1. Simulation physique exacte (rapports / états calculés, pannes = paramètres) — js/<nom>Sim.js
2. Modèle 3D procédural en coupe + vue éclatée + groupes « décortiquer » — js/<nom>Module.js
3. Fiches de chaque pièce (rôle · contrôle · symptôme · remontage, avec source) — js/<nom>Parts.js
4. Schéma fonctionnel animé et cliquable (hydraulique / électrique / flux) avec jauges et plages du manuel
5. Parcours guidé en [[15-20]] étapes du mouvement 0 à la fin, une idée par étape, mesure en direct, mini-question, encart « pour aller plus loin »
6. Démonstration automatique (la simulation se lance et s'explique seule, pause, voix optionnelle)
7. [[5 à 7]] cas pratiques de panne avec raisonnement commande → pression → élément → résultat
8. Charte graphique OMNIplus ON (cyan #00ADEE, bleu nuit #041E42), thème clair par défaut + sombre, mobile 390 px sans chevauchement
9. Livraison : fichier HTML autonome, README avec LIMITES HONNÊTES, dépôt Git

MÉTHODE (obligatoire)
- Suis le skill visualisation-guidee-piece, étapes 0 à 10, dans l'ordre. Une phase à la fois : annonce ce que tu fais, fais-le, prouve-le, attends ma validation.
- Phase 3 : valide le moteur en Node AVANT toute 3D (écart < 0,1 % avec le tableau du manuel).
- Génère le squelette avec scripts/scaffold.py puis remplace le contenu d'exemple.
- Teste avec scripts/smoke_test.cjs (parcours complet, 0 erreur JS) + captures clair/sombre, bureau et téléphone.

CONTRAINTES
- Géométrie 100 % procédurale (aucun modèle importé), solides fermés (coupe avec bouchage), couleurs SSP : orange couple/pression, bleu lubrification, vert commande, gris pièce folle, rouge défaut.
- Code en JavaScript ES modules (Three.js r160+), commenté en français, vocabulaire exact de l'atelier.
- Pas de valeur sans source ; pas de reconstruction présentée comme une donnée constructeur.

PREMIÈRE ACTION
Lis les documents joints et produis docs/extraction.md : composants (repère + page), états / tableau d'engagement, valeurs de contrôle (plage + conditions),
règles de diagnostic, pannes du manuel ; puis liste « DONNÉ » vs « À DÉDUIRE ». Arrête-toi là et attends ma validation.
```

## C. Prompts par phase (un message chacun)
| Phase | Prompt à envoyer | Preuve exigée |
|---|---|---|
| 0 Cadrer | « Pose-moi au plus 4 questions utiles (public, document de référence, ce qui doit être exact, livraison), puis écris le CLAUDE.md / AGENTS.md du projet. » | fichier d'instructions |
| 1 Extraire | « Lis [[doc]] et écris docs/extraction.md avec le modèle docs/modeles/extraction.md. Cite la page de chaque valeur. » | tableaux remplis + liste « à déduire » |
| 2 Moteur | « Écris js/<nom>Sim.js selon templates/sim.template.js : une seule table de constantes, états calculés, pannes = paramètres. » | fichier + constantes sourcées |
| 3 Valider | « Écris un test Node qui place chaque état et compare aux valeurs du manuel (rapports, plages de pression, exemples de diagnostic). Montre le tableau écart/valeur. » | écarts < 0,1 % |
| 4 3D | « Génère js/<nom>Module.js : pièces, vue éclatée (ordre de démontage atelier), groupes. Lance le smoke test et montre une capture en coupe. » | capture + 0 erreur |
| 5 Fiches | « Écris js/<nom>Parts.js pour toutes les pièces : rôle, contrôle (valeur + [DOC p.]), symptôme, remontage. » | N fiches = N pièces |
| 6 Schéma | « Crée le schéma animé (SVG) : nœuds cliquables liés aux pièces 3D, liaisons colorées par nature, jauges avec plages du manuel. » | capture + clic fonctionnel |
| 7 Parcours | « Écris js/lesson<Nom>.js : [[N]] étapes selon references/parcours-guide.md, puis le scénario AUTO. Déroule tout avec smoke_test.cjs. » | log des étapes + 0 erreur |
| 8 Pannes | « Écris [[N]] cas pratiques : symptôme client, reproduction, observations, mesures, hypothèses, pièce coupable, réparation, 3 niveaux d'indices. » | cas jouables de bout en bout |
| 9 Design/tests | « Applique la charte OMNIplus ON, teste bureau + téléphone 390 px, clair + sombre : aucun chevauchement, scrollWidth = clientWidth. Montre les captures. » | 4 captures |
| 10 Livraison | « Construis le HTML autonome, mets à jour le README (limites honnêtes), prépare le dépôt Git (.gitignore, commits propres). » | fichiers + commandes |

## D. Prompts de contrôle et de correction
- **Contre le manuel** : « Relis js/<nom>Sim.js et les 17 étapes : pour chaque chiffre affiché, donne la page du manuel ou marque-le “déduit”. Liste les écarts. »
- **Clarté pédagogique** : « Relis le parcours comme un élève de [[niveau]] : quelles étapes supposent un mot non défini ? Réécris-les (≤ 60 mots, 1 idée). »
- **Chevauchement** : « Cherche tous les chevauchements d'interface (bureau + 390 px, clair + sombre) et corrige-les, avec captures avant/après. »
- **Honnêteté** : « Liste dans le README toutes les reconstructions et simplifications (topologie, nombres de dents, implantation, dynamique). »
- **Ajouter une pièce** : « Ajoute le sous-ensemble [[X]] : fiches, groupe “décortiquer”, étape du parcours, au moins 1 panne. Mets à jour le test Node. »
- **Erreur navigateur** : « Voici l'erreur de la console : [[collée]]. Trouve la cause, corrige, relance le smoke test, montre la sortie. » (indispensable avec LibreChat, qui ne voit pas votre navigateur)
