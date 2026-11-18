/* ============================================================================
 * __FILE__Parts.js — FICHES « théorie → diagnostic terrain » de chaque pièce
 *  Une fiche = role (1-3 phrases) · metro (contrôles + valeurs) · symp (symptômes de panne) · remontage (conseils).
 *  Toute valeur chiffrée doit citer sa source [DOC p. n] ; sinon l'écrire « ordre de grandeur ».
 * ========================================================================== */
import { def } from './partsData.js';

const D = (id, name, cat, mat, role, metro, symp, remontage) => def(id, { name, cat, mat, role, metro, symp, remontage });

D('arbre', 'Arbre d\'entrée', 'arbre', 'Acier cémenté',
  ['Transmet le couple de la source vers les éléments de la boîte.'],
  ['Cannelures : jeu, usure (contrôle visuel + jauge).'],
  ['Bruit de cliquetis en charge ; jeu angulaire.'],
  ['Remplacer les joints à chaque dépose ; respecter le couple de serrage constructeur.']);
D('pignon-1', 'Pignon', 'pignon', 'Acier cémenté trempé',
  ['Engrène avec son pignon conjugué : rapport = Z mené / Z menant.'],
  ['Écaillage, empreinte de contact, jeu de denture.'],
  ['Sifflement (denture), grondement (roulement).'],
  ['Appairer les pignons par jeu ; huile de montage.']);
D('emb-a', 'Embrayage A', 'embrayage', 'Disques garnis + lames acier',
  ['Relie l\'entrée à l\'élément suivant quand son piston est sous pression.'],
  ['Nombre de disques, épaisseur, jeu de fonctionnement.'],
  ['Patinage : régime qui monte sans la vitesse ; odeur d\'huile brûlée.'],
  ['Disques trempés à l\'huile avant montage ; ordre garni/lisse à respecter.']);
D('piston-a', 'Piston de l\'embrayage A', 'embrayage', 'Aluminium + joints',
  ['Poussé par la pression d\'huile, il comprime le paquet de disques.'],
  ['Étanchéité des joints ; course du piston.'],
  ['Fuite → pression qui ne monte pas → patinage.'],
  ['Joints neufs, lèvres orientées côté pression.']);
D('carter', 'Carter', 'carter', 'Fonte d\'aluminium',
  ['Supporte les arbres, contient l\'huile.'],
  ['Planéité des plans de joint, portées de roulements.'],
  ['Fuite d\'huile, bruit de roulement.'],
  ['Pâte à joint selon notice ; couples de serrage en croix.']);
