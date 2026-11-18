# Pièges rencontrés (et corrections)

**Simulation** — emballement thermique du ralentisseur (recalibrer les coefficients) · colmatage de filtre sans effet (changer la formule de capacité) · à la fermeture du pontage conserver la vitesse · réinitialiser les états visuels après un saut d'état · afficher SR avec 2 décimales (0,98 et non 1,0).
**3D** — solides ouverts → coupe incorrecte ; couronne mal phasée (dents qui se traversent) → calculer la phase, vérifier `(Zs+Zr)/N` entier ; caméra en vol pendant les captures (rendu lent) → `flyToView(v, true)`.
**UI** — HUD en `position:absolute` qui chevauche → flux (`#stage`) ; onglets qui se compriment sur téléphone → `flex:1 1 100%; order:3` ; texte SVG non centré → `text-anchor: middle` ; débordement horizontal mobile → tester `scrollWidth == clientWidth`.
**Tests** — rendu logiciel LENT : `locator.click` expire → cliquer via `page.evaluate` ; ne pas lancer deux navigateurs en parallèle ; sorties de longs tests vers un fichier + surveillance, pas de `sleep` long ; `head` sur un pipe bufferise → rediriger vers un fichier.
**Outils** — heredocs Python avec `\'` cassent les chaînes JS → guillemets doubles ; `node --input-type=module --check` après chaque édition de JS.
**Livraison** — Vercel `--temporary` expire (ne pas promettre un lien durable) ; Drive : limite ~3 Mo par appel (compresser) ; Git d'entreprise : l'auth par mot de passe est refusée → **jeton personnel** demandé par formulaire sécurisé ; si refus, fournir `git bundle` + commandes.
**Contenu** — ne jamais citer une valeur sans source ; marquer clairement toute topologie reconstruite ; ne pas mélanger couleurs de fonction (SSP) et charte graphique.
