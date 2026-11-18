/* ============================================================================
 * lesson__CLASS__.js — PARCOURS GUIDÉ de « __TITLE__ »
 *  Principe : UNE idée par étape, dans l'ordre réel de la chaîne (de la cause vers l'effet). Voir references/parcours-guide.md.
 *  Une étape :
 *    t        titre court (≤ 8 mots)           text   HTML simple (≤ 60 mots, gras sur les mots-clés)
 *    look     2-3 puces « Regardez » (sur quoi poser les yeux)
 *    view     clé de views() du module         tab    'tools' | 'part' | 'hydro' | 'diag'
 *    focus    ids de pièces mises en surbrillance   ts   facteur de ralenti (0.4 pour un passage de rapport)
 *    setup    ({sim,ui,app}) état de départ    acts   boutons [{label, run}]   live(sim) → [[libellé, valeur, unité, 'ok'|'bad'|'']]
 *    quiz     { q, opts:[…], ok:index, why }   deep   encart « pour aller plus loin » (ingénieurs, formules)   note   limite à rappeler
 * ========================================================================== */
const f0 = (x) => Math.round(+x || 0);
const f1 = (x) => (+x || 0).toFixed(1).replace('.', ',');

export const LESSON = [
  {
    t: 'La pièce en un coup d\'œil', view: 'global', tab: 'tools', focus: [],
    setup: ({ sim, ui }) => { sim.forceGear('N', 800); },
    text: 'Cette pièce sert à <b>…</b> (rôle en une phrase). Elle comprend <b>…</b>, <b>…</b> et <b>…</b>.',
    look: ['À gauche : …', 'Au centre : …'],
    live: (s) => [['Régime', f0(s.engineRpm), 'tr/min'], ['Pression', f1(s.p.main), 'bar'], ['État', s.gear, '']],
    quiz: { q: 'Quel est le rôle principal de … ?', opts: ['Réponse A', 'Réponse B', 'Réponse C'], ok: 1, why: 'Explication courte de la bonne réponse.' },
  },
  {
    t: 'On engage l\'élément A', view: 'global', tab: 'tools', ts: 0.5, focus: ['emb-a', 'piston-a'],
    setup: ({ sim }) => { sim.forceGear('N', 1200); },
    acts: [{ label: '▶ Engager', run: ({ ui }) => ui.requestGear(1) }, { label: '↺ Revenir au neutre', run: ({ ui }) => ui.requestGear('N') }],
    text: 'La pression pousse le <b>piston</b> : les disques se <b>serrent</b> et transmettent le couple.',
    look: ['Les disques se rapprochent.', 'La pression monte dans la mesure en direct.'],
    live: (s) => [['A', f0(s.lv.a * 100), '%', s.lv.a > 0.95 ? 'ok' : ''], ['Pression', f1(s.p.main), 'bar']],
    deep: 'Capacité de couple d\'un embrayage multidisque : C = μ · n · Rmoy · F, avec n = nombre de surfaces frottantes.',
  },
  // … une étape par maillon de la chaîne (cause → effet) …
];

/** Démonstration AUTOMATIQUE : actions chronométrées (t en ms après l'arrivée sur l'étape), par numéro d'étape (0 = première) */
export const AUTO = {
  1: [{ t: 2500, run: ({ ui }) => ui.requestGear(1) }],
};

/** Remise à zéro des commandes avant CHAQUE étape (propre au module) */
export const reset__CLASS__ = ({ sim, ui, app }) => {
  app.setTimeScale(1); sim.load = 'accel'; sim.brake = false;
};
