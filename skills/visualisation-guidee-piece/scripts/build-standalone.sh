#!/usr/bin/env bash
# Génère dist/transmilab3d.html : un seul fichier (JS + CSS + Three.js inclus), ouvrable par double-clic.
# Prérequis : Node.js (npx) et Python 3.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
npx --yes esbuild@0.24.0 js/main.js --bundle --minify --format=iife --target=es2020 --legal-comments=none \
  --alias:three/addons=./vendor/three/addons --alias:three=./vendor/three/three.module.js --outfile=dist/.app.js
python3 - <<'PY'
import re
html = open('index.html', encoding='utf-8').read()
css = open('css/style.css', encoding='utf-8').read()
js = open('dist/.app.js', encoding='utf-8').read().replace('</script', '<\\/script')
html = re.sub(r'<script type="importmap">.*?</script>\s*', '', html, flags=re.S)
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script type="module" src="js/main.js"></script>', '<script>\n' + js + '\n</script>')
open('dist/transmilab3d.html', 'w', encoding='utf-8').write(html)
print('dist/transmilab3d.html généré (%d Ko)' % (len(html) // 1024))
PY
cp dist/transmilab3d.html dist/index.html   # racine du site pour Vercel / hébergement statique
rm -f dist/.app.js
