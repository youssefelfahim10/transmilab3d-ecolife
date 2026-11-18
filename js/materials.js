/* ============================================================================
 * materials.js — Matériaux PBR réalistes + codes couleurs normalisés (SSP VAG)
 * ========================================================================== */
import * as THREE from 'three';

/** Codes couleurs normalisés */
export const SSP = {
  couple: 0xff6a00,      // Rouge / Orange : flux de couple actif, haute pression
  lub: 0x2f8cff,         // Bleu : lubrification / pression de retour
  commande: 0x2ecc71,    // Vert : commande mécanique / fourchettes actives
  fou: 0x7b8088,         // Gris : pièces folles
  alerte: 0xff2d2d,      // Rouge d'alerte : pièce usée
  select: 0x00e5ff,      // Cyan : sélection / survol
};

const SPEC = {
  // Pignons, arbres : acier cémenté trempé
  steel: { color: 0xb9bfc7, metalness: 0.85, roughness: 0.25 },
  chrome: { color: 0xdfe4ea, metalness: 0.95, roughness: 0.18 },       // billes, aiguilles, bagues de roulement
  // Anneaux de synchronisation : laiton / bronze
  brass: { color: 0xd4af37, metalness: 0.9, roughness: 0.3 },
  // Carter : fonte d'aluminium sablée
  alu: { color: 0xa8b0b8, metalness: 0.6, roughness: 0.6 },
  // Joints et spi : élastomère noir mat
  rubber: { color: 0x151515, metalness: 0.0, roughness: 0.85 },
  // Garnitures de disque d'embrayage
  friction: { color: 0x5b4636, metalness: 0.1, roughness: 0.9 },
  // Pièces de rechange / outils
  oil: { color: 0x2f8cff, metalness: 0.0, roughness: 0.2, emissive: 0x1a60cc, emissiveIntensity: 0.9 },
};

/** Couleurs de coupe (bouchage visuel des sections) par famille de matière */
export const CAP_STYLE = {
  steel: { bg: '#b9c6d3', line: '#35424f', angle: 45 },
  chrome: { bg: '#d3dde6', line: '#44505c', angle: 45 },
  brass: { bg: '#e9bc3c', line: '#6b4e08', angle: -45 },
  alu: { bg: '#8fc4e8', line: '#24506b', angle: 0 },
  rubber: { bg: '#3c3c3c', line: '#161616', angle: 90 },
  friction: { bg: '#8a6a52', line: '#3a2a1e', angle: 90 },
};

export function makeMaterial(kind) {
  const s = SPEC[kind] || SPEC.steel;
  const m = new THREE.MeshStandardMaterial({ ...s });
  m.userData.kind = kind;
  m.userData.base = {
    color: m.color.clone(),
    emissive: m.emissive.clone(),
    ei: m.emissiveIntensity,
  };
  return m;
}
