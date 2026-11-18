#!/usr/bin/env bash
# Lance un petit serveur local (les modules ES exigent http://, pas file://). Puis ouvrir http://localhost:8080
cd "$(dirname "$0")" && python3 -m http.server 8080
