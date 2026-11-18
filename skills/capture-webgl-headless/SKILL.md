---
name: capture-webgl-headless
description: Piloter et photographier une application WebGL / Three.js dans Chromium headless (Playwright, rendu logiciel swiftshader) pour tester, déboguer et produire des captures haute qualité, des vidéos image par image (ffmpeg) et des chiffres réels depuis l'app. À utiliser pour tester un simulateur 3D, vérifier l'absence de chevauchement d'UI en thème clair/sombre, générer des visuels pour une présentation ou une doc, enregistrer une séquence animée déterministe, ou quand les screenshots WebGL sont lents, noirs ou expirent.
---

# Capture et test WebGL headless

Chromium et Playwright sont préinstallés (`require('playwright')`, ne pas réinstaller). Servir l'app (`python3 -m http.server 8765` dans le dossier) puis piloter avec `scripts/lib.cjs`.

## Contrat à prévoir côté app
- `window.__app` expose : `renderer, camera, controls, module (sim, parts, views()), opts, tween, flyTo()`.
- `document.body.dataset.ready = '1'` quand la scène est prête.
- `sim.timeScale` (0 = figé) et `sim.update(dt)` appelables à la main → **déterminisme** (frames reproductibles).
- Préférences UI par `localStorage` (thème, visite guidée déjà vue) → réglées via `addInitScript`.

## Recettes (scripts/)
- `lib.cjs` : `open({w,h,dsf,theme,hero,hud})` (args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --use-gl=angle`), `hero` masque barre/panneaux, `cam()`, `advance()`, `freeze()`, `snap()` (screenshot **par clip**).
- `shots_hero.cjs` : série de vues « héros » (boîte, coupe, éclaté, loupe) en clair/sombre.
- `video.cjs` : séquences image par image → `ffmpeg -framerate N -i f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart`.

## Astuces de performance (le rendu logiciel est lent)
- **Rendu à la demande** : surcharger `renderer.render` avec un drapeau `__want` ; ne le mettre à `true` que pour la frame à capturer.
- **Figer la simulation**, avancer à la main par pas de 0,03–0,06 s, caméra posée explicitement entre deux frames.
- `page.screenshot({clip})` plutôt que `locator.screenshot` (time-out). `timeout: 180000` sur les gros cadres.
- Viewport réduit pour les recadrages d'UI (script « lean ») et `renderer.render` désactivé quand seul le DOM est photographié.
- `deviceScaleFactor: 2` pour ce qu'un humain verra, `1` pour les contrôles.
- Moins d'images × fps plus bas (ex. 60 frames à 15 fps) plutôt que 1080p lourd.

## Contrôles automatiques utiles
- Erreurs : `page.on('pageerror')` ; fail si présent.
- Chevauchements d'UI : `getBoundingClientRect` de tous les blocs visibles, intersections deux à deux, en thème clair et sombre.
- Chiffres : `page.evaluate(() => Object.keys(__app.modules.x.parts).length)` pour citer des valeurs vraies dans une présentation.
