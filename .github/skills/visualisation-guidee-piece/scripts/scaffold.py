#!/usr/bin/env python3
"""Crée un NOUVEAU module de visualisation guidée (sim + 3D + fiches + parcours) dans un projet TransmiLab 3D.

Usage :
  python3 scaffold.py --root /chemin/projet --id pompe --class Pompe --title "Pompe à engrenages" [--wire]

Génère  js/<id>Sim.js · js/<id>Module.js · js/<id>Parts.js · js/lesson<Class>.js
Avec --wire : branche automatiquement le module (main.js, lessons.js, onglet dans index.html). Sans --wire : affiche les 4 modifications à faire.
"""
import argparse, pathlib, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('--root', required=True); ap.add_argument('--id', required=True)
ap.add_argument('--class', dest='cls', required=True); ap.add_argument('--title', required=True)
ap.add_argument('--wire', action='store_true')
a = ap.parse_args()
if not re.fullmatch(r'[a-z][a-z0-9]*', a.id): sys.exit('--id : minuscules/chiffres, sans tiret (ex. pompe)')
if not re.fullmatch(r'[A-Z][A-Za-z0-9]*', a.cls): sys.exit('--class : CamelCase (ex. Pompe)')

root = pathlib.Path(a.root); tpl = pathlib.Path(__file__).resolve().parent.parent / 'templates'
file = a.id + "Module"
names = {'sim.template.js': f'js/{a.id}ModuleSim.js', 'module.template.js': f'js/{a.id}Module.js',
         'parts.template.js': f'js/{a.id}ModuleParts.js', 'lesson.template.js': f'js/lesson{a.cls}.js'}
rep = {'__ID__': a.id, '__CLASS__': a.cls, '__TITLE__': a.title, '__FILE__': file}
for src, dst in names.items():
    out = root / dst
    if out.exists(): sys.exit(f'REFUS : {dst} existe déjà (ne rien écraser).')
    out.write_text((tpl / src).read_text(encoding='utf-8'), encoding='utf-8')
    txt = out.read_text(encoding='utf-8')
    for k, v in rep.items(): txt = txt.replace(k, v)
    out.write_text(txt, encoding='utf-8')
    print('créé', dst)

steps = f"""
CÂBLAGE (4 modifications) :
 1. js/main.js      : import {{ {a.cls} }} from './{file}.js';  et dans la création du module :  id === '{a.id}' ? new {a.cls}() :  (avant le cas par défaut)
 2. js/lessons.js   : import {{ LESSON as {a.cls}_S, AUTO as {a.cls}_A, reset{a.cls} }} from './lesson{a.cls}.js';  puis  {a.id}: {{ steps: {a.cls}_S, auto: {a.cls}_A, reset: reset{a.cls} }}
 3. index.html      : <button class="tab" data-module="{a.id}"><b>Module 4</b><span>{a.title}</span></button>  dans #moduleTabs
 4. (facultatif) js/groups.js / ui.js : rien d'autre n'est requis — l'UI lit sim.explain() et module.groups.
"""
if not a.wire:
    print(steps); sys.exit(0)

def patch(path, fn):
    p = root / path; s = p.read_text(encoding='utf-8'); n = fn(s)
    if n == s: sys.exit(f'câblage impossible dans {path} (motif introuvable) : faire la modification à la main.')
    p.write_text(n, encoding='utf-8'); print('câblé', path)

patch('js/main.js', lambda s: s.replace("import { Module2, Module3 } from './modules23.js';", f"import {{ Module2, Module3 }} from './modules23.js';\nimport {{ {a.cls} }} from './{file}.js';", 1)
      .replace("id === 'bva' ? new Module2() :", f"id === 'bva' ? new Module2() : id === '{a.id}' ? new {a.cls}() :", 1))
patch('js/lessons.js', lambda s: s.replace("\nexport const LESSONS = {", f"\nimport {{ LESSON as {a.cls}_S, AUTO as {a.cls}_A, reset{a.cls} }} from './lesson{a.cls}.js';\n\nexport const LESSONS = {{\n  {a.id}: {{ steps: {a.cls}_S, auto: {a.cls}_A, reset: reset{a.cls} }},", 1))
patch('index.html', lambda s: re.sub(r'(<button class="tab" data-module="dct">.*?</button>)', lambda m: m.group(1) + f'\n    <button class="tab" data-module="{a.id}"><b>Module 4</b><span>{a.title}</span></button>', s, count=1, flags=re.S))
print('\nTerminé. Lancer un serveur statique (python3 -m http.server) puis scripts/smoke_test.cjs.')
