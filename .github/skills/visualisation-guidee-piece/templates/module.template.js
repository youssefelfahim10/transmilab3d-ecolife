/* ============================================================================
 * __FILE__.js — MODULE « __TITLE__ » : assemblage 3D (géométrie 100 % procédurale)
 *  Unité : 1 = 10 mm · axe de rotation = X · hauteur = Y.
 *  Interface exigée par main.js / ui.js : root, parts, sim, pose(sim,dt), style(sim,o), setExplode(p), views(), explodePlan, groups
 * ========================================================================== */
import * as THREE from 'three';
import { BaseModule, discStack, setStack } from './moduleBase.js';
import * as G from './gearsBuilder.js';
import { SSP } from './materials.js';
import { __CLASS__Sim, TABLE } from './__FILE__Sim.js';
import './__FILE__Parts.js';

export { __CLASS__Sim, TABLE };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export class __CLASS__ extends BaseModule {
  constructor() {
    super('__ID__', '__TITLE__');
    this.sim = new __CLASS__Sim();
    this.gearList = ['N', 1, 2];                                       // boutons de la colonne gauche
    this.groups = [                                                    // groupes « décortiquer » (isoler / écarter)
      { id: 'arbres', icon: '━', name: 'Arbres', ids: ['arbre'], ctx: [] },
      { id: 'emb', icon: '⛭', name: 'Embrayage A', ids: ['emb-a', 'piston-a'], ctx: ['arbre'] },
      { id: 'carter', icon: '▢', name: 'Carter', ids: ['carter'], ctx: [] },
    ];
    this.build();
    this.makePlan();
  }

  build() {
    const P = (id, x, y, z, label, o) => this.mk(id, x, y, z, label, o);          // label = [texte, [dx,dy,dz]] ou null
    /* 1. arbre (solide de révolution plein) */
    P('arbre', 0, 0, 0, ['Arbre d\'entrée', [30, 4, 0]]).mesh(G.cylX(1.6, 0, 44, 32), 'steel');
    /* 2. pignon (développante réelle : Z dents, rayon primitif) */
    P('pignon-1', 10, 0, 0, ['Pignon', [0, 7.5, 0]]).mesh(G.involuteGear({ Z: 30, pitchR: 6, width: 2.5, boreR: 1.6, web: true }), 'steel');
    /* 3. embrayage multidisque (disques garnis / lisses en InstancedMesh) + piston */
    const c = P('emb-a', 24, 0, 0, ['Embrayage A', [0, 8.5, 0]]); discStack(c, { rA: 5.2, rB: 5.5, rC: 7.4, rD: 7.7, n: 4, gapOpen: 0.5, gapClosed: 0.37 });
    P('piston-a', 21.5, 0, 0, null).mesh(G.tubeX(4.6, 7.6, -0.3, 0.3, 48), 'steel');
    /* 4. carter (enveloppe creuse → coupe avec bouchage) */
    this.mk('carter', 0, 0, 0, ['Carter', [22, 12.5, 0]], { housing: true }).mesh(G.hullTube({ circles: [{ y: 0, z: 0, r: 10 }], wall: 0.5, x0: -2, x1: 46 }), 'alu');
  }

  /** Vue éclatée : étapes dans l'ORDRE DE DÉMONTAGE ATELIER ; v = vecteur de déplacement à 100 % de l'étape */
  makePlan() {
    this.step('Déposer le carter', [{ id: 'carter', v: [0, 0, 30] }]);
    this.step('Déposer l\'embrayage A', [{ id: 'piston-a', v: [-8, 0, 0] }, { id: 'emb-a', v: [0, 0, 14] }]);
    this.step('Déposer le pignon et l\'arbre', [{ id: 'pignon-1', v: [0, 10, 0] }, { id: 'arbre', v: [0, -8, 0] }]);
  }

  /** Animation : n'écrire QUE rotX / slide / base, puis apply() — jamais de logique de simulation ici */
  pose(sim, dt) {
    const p = this.parts, L = sim.lv;
    p['arbre'].rotX = sim.ang.in; p['pignon-1'].rotX = sim.ang.in;
    setStack(p['emb-a'], L.a);                                        // 0 = ouvert, 1 = serré
    p['emb-a'].rig.gI.rotation.x = sim.ang.in; p['emb-a'].rig.gO.rotation.x = sim.ang.out;
    p['piston-a'].slide = 0.62 * L.a;
    for (const id in p) p[id].apply();
  }

  /** Couleurs normalisées SSP : orange = couple/pression · bleu = lubrification · vert = commande · gris = pièce folle · rouge = défaut */
  style(sim, o) {
    this.styleGeneric(o, (part, st) => {
      if (o.focus && o.focus.has(part.id)) { st.emissive = 0x2f9bff; st.ei = 0.45 + 0.3 * Math.sin(o.time * 5); return; }   // pièce citée par le parcours guidé
      if (part.id === 'emb-a') {
        const l = sim.lv.a, sl = sim.slipEl.a;
        if (sl > 0.12) { st.emissive = SSP.alerte; st.ei = 0.35 + 0.6 * sl; } else if (l > 0.04) { st.emissive = SSP.couple; st.ei = 0.25 + l * 0.9; }
      }
    });
  }

  views() {                                                           // clés lues par les boutons de vue et par les étapes du parcours
    return { global: { target: V3(22, 0, 0), pos: V3(22, 20, 70), fitW: 56, fitH: 30 }, loupe: {}, diff: null };
  }
}
