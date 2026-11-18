# Écrire un parcours guidé clair (0 → fin)

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
