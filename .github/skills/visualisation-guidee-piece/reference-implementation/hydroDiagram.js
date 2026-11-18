/* ============================================================================
 * hydroDiagram.js — Schéma hydraulique FONCTIONNEL interactif de la ZF EcoLife 2 (redessiné, non à l'échelle)
 *  Repères = ceux du schéma ZF 4188.700.001 (1 filtre d'aspiration · 2 pompe · 3 filtre à pression · 4 bypass · 5/6 RHD / soupape principale ·
 *  7/8 sécurité / contre-pression convertisseur · 9 graissage · 10/11/12 ralentisseur / accumulateur · 13/14 KUV / commutation ·
 *  15 WK · 16/17 A et B · 18/19/20 D, E, F · 21/22 valves F1/F2 et D1/D2 · 24 chargement de pompe · 26/27 échangeurs · 29 clapet · 31 bypass).
 *  Couleurs : bleu = alimentation / action · orange pointillé = pilotage · vert = retour / refroidissement · gris = au repos · rouge = anomalie.
 *  Chaque bloc est cliquable : il sélectionne la pièce 3D correspondante et ouvre sa fiche.
 * ========================================================================== */
import { EL_INFO } from './ecoSim.js';

const W = 350;
/* [id, repère ZF, libellé, x, y, w, h, pièce 3D] */
const NODES = [
  ['tank', '', 'Carter d\'huile', 170, 16, 110, 22, 'carter-huile'],
  ['f1', '1', 'Filtre aspiration', 170, 60, 110, 22, 'filtre-1'],
  ['pump', '2', 'Pompe', 170, 104, 110, 22, 'pompe-corps'],
  ['c24', '24', 'Chargement', 52, 104, 84, 22, 'charge-pompe-24'],
  ['v29', '29', 'Clapet', 170, 146, 110, 22, 'clapet-29'],
  ['f3', '3', 'Filtre pression', 170, 188, 110, 22, 'filtre-3'],
  ['b4', '4', 'Bypass', 290, 188, 80, 22, 'bypass-filtre-4'],
  ['rhd', '5', 'RHD · Y13', 50, 262, 84, 24, 'ev-rhd'],
  ['v6', '6', 'Soupape princ.', 170, 262, 100, 24, 'soupape-6'],
  ['ra', '16', 'A · Y11', 28, 322, 52, 24, 'ev-a'], ['rb', '17', 'B · Y12', 86, 322, 52, 24, 'ev-b'], ['rd', '18', 'D · Y14', 144, 322, 52, 24, 'ev-d'],
  ['re', '19', 'E · Y15', 202, 322, 52, 24, 'ev-e'], ['rf', '20', 'F · Y16', 260, 322, 52, 24, 'ev-f'], ['rwk', '15', 'WK · Y17', 318, 322, 52, 24, 'ev-wk'],
  ['v22', '22', 'D1/D2', 144, 358, 52, 20, 'valve-22'], ['v21', '21', 'F1/F2', 260, 358, 52, 20, 'valve-21'],
  ['ea', 'A', 'embrayage', 28, 398, 52, 26, 'emb-a'], ['eb', 'B', 'embrayage', 86, 398, 52, 26, 'emb-b'], ['ed', 'D', 'frein D1+D2', 144, 398, 52, 26, 'frein-d'],
  ['ee', 'E', 'frein', 202, 398, 52, 26, 'frein-e'], ['ef', 'F', 'frein F1+F2', 260, 398, 52, 26, 'frein-f'], ['ewk', '30', 'pontage WK', 318, 398, 52, 26, 'cv-wk'],
  ['v7', '7', 'Sécurité', 52, 470, 84, 24, 'soupape-7'],
  ['conv', '', 'Convertisseur', 170, 470, 100, 30, 'cv-turbine'],
  ['v8', '8', 'Contre-pression', 290, 470, 84, 24, 'soupape-8'],
  ['v14', '14', 'Commutation', 170, 540, 100, 24, 'valve-14'],
  ['x27', '27', 'Échangeur ralent.', 60, 584, 100, 22, 'echangeur'],
  ['x26', '26', 'Échangeur boîte', 170, 628, 100, 22, 'echangeur'],
  ['b31', '31', 'Bypass', 290, 628, 76, 22, 'bypass-31'],
  ['v9', '9', 'Graissage', 170, 672, 100, 22, 'soupape-9'],
  ['kuv', '13', 'KUV', 290, 584, 60, 22, 'valve-kuv-13'],
  ['r10', '10', 'Ralent. · Y19', 60, 736, 100, 24, 'ev-ret'],
  ['r11', '11', 'Soupape', 170, 736, 70, 24, 'ev-ret'],
  ['ret', '25', 'Ralentisseur', 262, 736, 100, 24, 'ret-rotor'],
  ['acc', '12', 'Accumulateur', 170, 786, 100, 22, 'accu-12'],
];
/* [id, type, points] — type : press (bleu) · pilot (orange pointillé) · ret (vert) */
const EDGES = [
  ['e_tank', 'press', [[170, 27], [170, 49]]], ['e_f1', 'press', [[170, 71], [170, 93]]], ['e_pump', 'press', [[170, 115], [170, 135]]], ['e_v29', 'press', [[170, 157], [170, 177]]],
  ['e_f3', 'press', [[170, 199], [170, 232]]], ['e_b4', 'ret', [[170, 168], [250, 168], [250, 188]]], ['e_b4b', 'ret', [[290, 199], [290, 214], [340, 214], [340, 700], [170, 700], [170, 683]]],
  ['e_c24', 'ret', [[94, 104], [115, 104]]],
  ['bus', 'press', [[10, 232], [330, 232]]],
  ['d_rhd', 'press', [[50, 232], [50, 250]]], ['d_v6', 'press', [[170, 232], [170, 250]]], ['p_rhd', 'pilot', [[92, 262], [120, 262]]],
  ['d_a', 'press', [[28, 232], [28, 310]]], ['d_b', 'press', [[86, 232], [86, 310]]], ['d_d', 'press', [[144, 232], [144, 310]]], ['d_e', 'press', [[202, 232], [202, 310]]], ['d_f', 'press', [[260, 232], [260, 310]]], ['d_wk', 'press', [[318, 232], [318, 310]]],
  ['o_a', 'press', [[28, 334], [28, 385]]], ['o_b', 'press', [[86, 334], [86, 385]]], ['o_d', 'press', [[144, 334], [144, 348]]], ['o_d2', 'press', [[144, 368], [144, 385]]], ['o_e', 'press', [[202, 334], [202, 385]]], ['o_f', 'press', [[260, 334], [260, 348]]], ['o_f2', 'press', [[260, 368], [260, 385]]], ['o_wk', 'press', [[318, 334], [318, 385]]],
  ['c_d2', 'press', [[170, 274], [170, 455]]], ['c_a8', 'press', [[220, 470], [248, 470]]], ['c_d4', 'ret', [[290, 482], [290, 515], [170, 515], [170, 528]]],
  ['c_v7', 'ret', [[136, 470], [120, 470]]], ['c_v7r', 'ret', [[52, 458], [52, 430], [8, 430], [8, 104], [10, 104]]],
  ['k_14a', 'ret', [[170, 552], [170, 570], [60, 570], [60, 573]]], ['k_14b', 'ret', [[60, 595], [60, 612], [140, 612], [140, 617]]], ['k_x26', 'ret', [[170, 639], [170, 661]]], ['k_31', 'ret', [[250, 628], [215, 628]]],
  ['k_14c', 'ret', [[170, 552], [170, 617]]],
  ['p_kuv', 'pilot', [[290, 573], [290, 552], [220, 552]]], ['p_rr3', 'pilot', [[110, 736], [135, 736]]],
  ['r_ret', 'press', [[205, 736], [212, 736]]], ['r_acc', 'press', [[170, 748], [170, 775]]],
  ['d_r10', 'press', [[60, 232], [60, 724]]],
];
const NODEMAP = Object.fromEntries(NODES.map((n) => [n[0], n]));

export function createHydro(root, app) {
  const H = 820;
  const nodeSvg = ([id, no, lab, x, y, w, h]) => `<g class="hy-node" data-n="${id}" tabindex="0" role="button" aria-label="${lab}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="5"/><text class="hy-no" x="${x - w / 2 + 4}" y="${y - h / 2 + 10}">${no}</text><text class="hy-lab" x="${x}" y="${y + 1}">${lab}</text><text class="hy-val" x="${x}" y="${y + h / 2 - 3}" id="hv-${id}"></text></g>`;
  const edgeSvg = ([id, t, pts]) => `<polyline class="hy-edge ${t}" id="he-${id}" points="${pts.map((p) => p.join(',')).join(' ')}"/>`;
  root.innerHTML = `<div class="hy-gauges" id="hyGauges"></div>
    <svg viewBox="0 0 ${W} ${H}" class="hy-svg" role="img" aria-label="Schéma hydraulique fonctionnel de la ZF EcoLife 2">
      <text class="hy-h" x="170" y="5">ALIMENTATION</text><text class="hy-h" x="170" y="228">RÉSEAU PHD · RÉGULATEURS · ÉLÉMENTS</text>
      <text class="hy-h" x="170" y="445">CONVERTISSEUR</text><text class="hy-h" x="170" y="516">REFROIDISSEMENT · GRAISSAGE</text><text class="hy-h" x="170" y="710">RALENTISSEUR</text>
      ${EDGES.map(edgeSvg).join('')}${NODES.map(nodeSvg).join('')}
      <text class="hy-note" x="170" y="${H - 6}">Schéma fonctionnel, non à l'échelle · repères ZF 4188.700.001</text></svg>
    <div class="hy-legend"><i class="c-press"></i> pression · <i class="c-pilot"></i> pilotage · <i class="c-ret"></i> retour / refroidissement · <i class="c-idle"></i> au repos · <i class="c-bad"></i> anomalie</div>
    <div class="hy-info" id="hyInfo">Cliquez un bloc : la pièce s'illumine en 3D et sa fiche s'ouvre.</div>`;
  const q = (sel) => root.querySelector(sel);
  root.querySelectorAll('.hy-node').forEach((g) => {
    const go = () => { const n = NODEMAP[g.dataset.n]; const part = n[7]; q('#hyInfo').innerHTML = `<b>${n[1] ? n[1] + ' · ' : ''}${n[2]}</b> — pièce 3D : ${part}`; if (part && app.module.parts[part]) app.onPartClick(part); };
    g.addEventListener('click', go); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  const E = Object.fromEntries(EDGES.map((e) => [e[0], q(`#he-${e[0]}`)]));
  const Nd = Object.fromEntries(NODES.map((n) => [n[0], q(`[data-n="${n[0]}"]`)]));
  const V = Object.fromEntries(NODES.map((n) => [n[0], q(`#hv-${n[0]}`)]));
  const f1 = (x) => x.toFixed(1).replace('.', ',');
  const setE = (id, lvl, warn) => { const el = E[id]; if (!el) return; el.classList.toggle('on', lvl > 0.04); el.classList.toggle('warn', !!warn); el.style.strokeOpacity = lvl > 0.04 ? 0.35 + 0.65 * Math.min(1, lvl) : ''; };
  const setN = (id, st, txt) => { const g = Nd[id]; if (!g) return; g.classList.toggle('on', st === 'on'); g.classList.toggle('cmd', st === 'cmd'); g.classList.toggle('warn', st === 'warn'); if (V[id]) V[id].textContent = txt || ''; };

  const range = (v, lo, hi) => (v < lo ? 'bad' : v > hi ? 'bad' : 'ok');
  return {
    update(sim) {
      const run = sim.run, f = sim.faults, p = sim.p;
      const ph = run ? 1 : Math.min(1, p.phd / 8);
      /* alimentation */
      setN('tank', '', ''); setN('f1', run ? 'on' : '', ''); setN('pump', run ? 'on' : '', run ? `${Math.round(sim.engineRpm)} tr/min` : 'arrêtée');
      setN('v29', sim.engineOn ? 'on' : (p.phd > 1 ? 'on' : ''), sim.engineOn ? 'ouvert' : (f.checkValve ? 'FUITE' : 'ferme')); if (!sim.engineOn && f.checkValve) Nd.v29.classList.add('warn');
      setN('f3', run ? 'on' : '', `Δp ${f1(sim.dpFilter || 0)} bar`); if ((sim.dpFilter || 0) > 0.8) Nd.f3.classList.add('warn');
      setN('b4', sim.bypass4 ? 'warn' : '', sim.bypass4 ? 'OUVERT' : 'fermé');
      setN('c24', run ? 'on' : '', run ? 'A3 → A2' : '');
      ['e_tank', 'e_f1', 'e_pump', 'e_v29'].forEach((id) => setE(id, run ? 1 : 0)); setE('e_f3', ph); setE('e_b4', sim.bypass4 ? 1 : 0, true); setE('e_b4b', sim.bypass4 ? 1 : 0, true); setE('e_c24', run ? 0.5 : 0);
      setE('bus', ph); setE('d_rhd', ph); setE('d_v6', ph); setE('p_rhd', run ? 1 : 0);
      setN('rhd', run ? 'cmd' : '', `pilote`); setN('v6', run ? 'on' : '', `PHD ${f1(p.phd)} bar`);
      /* éléments */
      const reg = { a: 'ra', b: 'rb', d: 'rd', e: 're', f: 'rf' }, el = { a: 'ea', b: 'eb', d: 'ed', e: 'ee', f: 'ef' };
      for (const k of ['a', 'b', 'd', 'e', 'f']) {
        const c = sim.cmd[k] > 0.5, lv = sim.lv[k], sl = sim.slipEl[k];
        setN(reg[k], c ? 'cmd' : '', c ? `${f1(p.phd)} bar` : ''); setE('d_' + k, ph * (c ? 1 : 0.15));
        setN(el[k], sl > 0.15 ? 'warn' : lv > 0.04 ? 'on' : '', `${f1(p['p' + k] || 0)} bar`);
        if (k === 'd') { setE('o_d', lv); setE('o_d2', lv * sim.sl2.d); } else if (k === 'f') { setE('o_f', lv); setE('o_f2', lv * sim.sl2.f); } else setE('o_' + k, lv, sl > 0.15);
      }
      setN('v22', sim.sl2.d > 0.5 ? 'on' : '', sim.sl2.d > 0.5 ? 'D2 actif' : 'D1'); setN('v21', sim.sl2.f > 0.5 ? 'on' : '', sim.sl2.f > 0.5 ? 'F2 actif (AR)' : 'F1');
      setN('rwk', sim.cmd.wk > 0.5 ? 'cmd' : '', sim.cmd.wk > 0.5 ? 'fermé' : ''); setE('d_wk', ph * (sim.cmd.wk > 0.5 ? 1 : 0.15)); setN('ewk', sim.lu > 0.05 ? 'on' : '', `WK ${Math.round(sim.lu * 100)} %`); setE('o_wk', sim.lu, sim.wkSlip > 0.1);
      /* convertisseur et refroidissement */
      setN('conv', run ? 'on' : '', `SR ${f1(sim.SR).replace(',', ',')}`);
      setN('v7', run ? 'on' : '', 'D2'); setN('v8', f.a8Low ? 'warn' : run ? 'on' : '', `A8 ${f1(p.a8)} bar`);
      setE('c_d2', ph); setE('c_a8', run ? 1 : 0, !!f.a8Low); setE('c_d4', run ? 1 : 0); setE('c_v7', run ? 0.4 : 0); setE('c_v7r', run ? 0.4 : 0);
      const ret = sim.cool === 'retarder';
      setN('v14', run ? 'on' : '', ret ? 'RALENTISSEUR' : 'traction'); setN('x27', ret || run ? 'on' : '', `D6 ${f1(p.d6)} bar`); setN('x26', run ? 'on' : '', `${Math.round(sim.oilT)} °C`);
      if ((f.exchClog || 0) > 0.3) { Nd.x26.classList.add('warn'); Nd.x27.classList.add('warn'); }
      setN('b31', sim.bypass31 ? 'warn' : '', sim.bypass31 ? 'OUVERT' : 'fermé'); setN('v9', run ? 'on' : '', `D8 ${f1(p.d8)} bar`); setN('kuv', ret ? 'cmd' : run ? 'on' : '', ret ? 'coupe pHD' : 'pHD → 14');
      ['k_14a', 'k_14b', 'k_14c', 'k_x26'].forEach((id) => setE(id, run ? 1 : 0)); setE('k_31', sim.bypass31 ? 1 : 0, true); setE('p_kuv', ret ? 1 : 0);
      /* ralentisseur */
      setN('r10', sim.cmd.ret > 0.05 ? 'cmd' : '', sim.cmd.ret > 0.05 ? `${Math.round(sim.cmd.ret * 100)} %` : ''); setN('r11', sim.ret.fill > 0.05 ? 'on' : '', `pR3 ${f1(p.r3)} bar`); setN('ret', sim.ret.fill > 0.05 ? 'on' : '', `${Math.round(sim.ret.torque)} N·m`);
      setN('acc', f.accuBad ? 'warn' : run ? 'on' : '', `charge ${Math.round(sim.accu * 100)} %`);
      setE('d_r10', sim.cmd.ret > 0.05 ? ph : 0); setE('p_rr3', sim.cmd.ret > 0.05 ? 1 : 0); setE('r_ret', sim.ret.fill, false); setE('r_acc', sim.accu * (run ? 1 : 0.3), !!f.accuBad);
      /* manomètres */
      const near = sim.engineRpm < 1400 ? 0 : 1;
      const R = [['PHD', p.phd, near ? 10 : 8, 12], ['PVF − PHD', sim.dpFilter || 0, 0, 0.8], ['A8', p.a8, near ? 5 : 4.5, 6.5], ['D6', p.d6, near ? 3 : 0.8, near ? 5 : 3], ['D8', p.d8, near ? 1.6 : 0.4, near ? 3 : 1.5]];
      q('#hyGauges').innerHTML = R.map(([n, v, lo, hi]) => `<div class="hyg ${run || n === 'PHD' ? range(v, lo, hi) : 'idle'}"><small>${n}</small><b>${f1(v)}</b><em>bar</em><i>${f1(lo)}–${f1(hi)}</i></div>`).join('') + `<div class="hy-cond">Plages ZF : huile 50-65 °C, N, WK ouvert, ${near ? '2 200' : '620'} tr/min (ici ${Math.round(sim.engineRpm)} tr/min, ${Math.round(sim.oilT)} °C).</div>`;
    },
  };
}
void EL_INFO;
