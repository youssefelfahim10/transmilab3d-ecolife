# SKILLS.md - Compétences Pédagogiques et Atelier Terrain

## Compétence 1 : Génération de Géométrie Mécanique Procédurale
Savoir générer mathématiquement en Three.js :
- **Engrenages hélicoïdaux :** Profil en développante de cercle extrudé avec torsion (`twist` de 20° à 30°), chanfreins d'entrée de crabots.
- **Ensemble de synchronisation Borg-Warner :**
  1. Moyeu cannelé solidaire de l'arbre secondaire.
  2. Baladeur à denture intérieure avec gorge pour fourchette.
  3. 3 clavettes de verrouillage + 2 ressorts annulaires.
  4. Anneau de synchro en laiton avec cône de friction interne et dents d'arrêt.
  5. Pignon fou monté sur cage à aiguilles avec cône mâle et couronne de crabotage.
- **Train épicycloïdal (BVA) :** Planétaire central, porte-satellites avec 3 ou 4 satellites, couronne extérieure à denture interne, embrayages multidisques (disques garnis + disques lisses).

## Compétence 2 : Traduction "Théorie -> Diagnostic Terrain"
Pour chaque pièce sélectionnée par l'étudiant, générer automatiquement une fiche structurée en 4 volets :
1. **Rôle cinématique :** Fonction dans la chaîne de traction.
2. **Contrôle et Métrologie (Atelier) :** Comment contrôler la pièce au démontage (ex: *Mesure du jeu axial entre l'anneau de synchro et le cône du pignon à la cale d'épaisseur : valeur neuve 1,2 mm, limite d'usure 0,5 mm*).
3. **Symptômes client en cas de défaillance :** Bruit, ressenti au levier, comportement routier (ex: *Craquement au passage 2->3 à froid, vitesse qui saute en décélération*).
4. **Points critiques au remontage :** Sens de montage du baladeur, couple de serrage, huiles préconisées (API GL-4 vs GL-5 et attaque du laiton).

## Compétence 3 : Création de Scénarios de Diagnostic Guidé (Indices)
Concevoir des études de cas interactives avec un système d'indices à 3 niveaux :
- **Niveau 1 (Ordre de Réparation - OR) :** Plainte du client et conditions d'apparition (régime, température, rapport).
- **Niveau 2 (Aide à l'observation 3D) :** Consigne pour utiliser les outils du simulateur (ex: *"Activez le mode Rayons X, engagez la 3ème et observez le glissement entre le cône laiton et le pignon fou"*).
- **Niveau 3 (Expertise et Chiffrage) :** Identification visuelle de la pièce usée (coloration rouge d'alerte), explication physique de la panne et liste des pièces à remplacer lors de l'intervention (kit synchro, roulements, joints spi).

## Compétence 4 : Tableaux de Bord Télémétriques et Calculs
Implémenter le calcul temps réel des grandeurs physiques :
- Rapport de boîte : $i_b = \frac{Z_{mené}}{Z_{menant}}$
- Rapport de pont (différentiel) : $i_p = \frac{Z_{couronne}}{Z_{pignon\_attaque}}$
- Régime de sortie (roues) : $N_{roues} = \frac{N_{moteur}}{i_b \times i_p}$
- Couple transmis aux roues : $C_{roues} = C_{moteur} \times i_b \times i_p \times \eta$ (avec rendement $\eta = 0.96$ en BVM et $0.88$ en BVA).
