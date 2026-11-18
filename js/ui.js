/* ============================================================================
 * ui.js — Interface TransmiLab 3D
 *   Gauche  : piloter la boîte (levier en H, pédale, moteur, charge, huile)
 *   Droite  : 🔬 Décortiquer (arbre des pièces, isoler/masquer/écarter, éclaté, coupe, loupe)
 *             📋 Fiche pièce (rôle · métrologie · symptômes · remontage + contrôle)
 *             🩺 Chercher la panne (démarche guidée : reproduire → observer → hypothèse → mesurer → désigner → réparer)
 *   Centre  : bandeau « Que faire ? » (coach), phases du passage, télémétrie
 * ========================================================================== */
import { SCENARIOS, checkDiagnosis, measurePart } from './atelierScenarios.js';
import { SCENARIOS_ECO, liveMeasure } from './atelierEco.js';
import { EcoSim, TABLE as BVA_ENG, EL_INFO, IRATIO as BVA_I, ZF_RATIO } from './ecoSim.js';
import { createHydro } from './hydroDiagram.js';
import { initLesson } from './lessonUI.js';
import { PART_INFO, CAT } from './partsData.js';
import { FD, IP, GEAR_PAIRS, REV, IR, SYNC_OF } from './layout.js';
import { ratioText } from './kinematics.js';
import { applySpread } from './groups.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fr = (x, d = 3) => x.toFixed(d).replace('.', ',');
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const GATE = { 1: [40, 28], 2: [40, 132], 3: [110, 28], 4: [110, 132], 5: [180, 28], R: [180, 132], N: [110, 80] };

const SUB_TEXT = {
  declutch: 'La pédale est enfoncée : le plateau recule, le disque est libéré — le flux moteur est COUPÉ.',
  withdraw: 'La fourchette ramène le baladeur au point mort : les crabots se dégagent.',
  approach: 'La fourchette pousse le baladeur ; les 3 clavettes entraînent l\'anneau laiton vers le cône du pignon fou.',
  friction: 'Le cône laiton frotte sur le pignon fou et l\'accélère / le freine. L\'anneau est INDEXÉ : ses dents d\'arrêt bloquent le baladeur tant que les vitesses diffèrent.',
  crunch: '⚠ Le cône n\'a pas assez de pouvoir de synchronisation : le baladeur force le passage → CRAQUEMENT.',
  unlock: 'Vitesses égalisées : l\'anneau se dégage, le baladeur peut franchir ses dents d\'arrêt.',
  engage: 'Le baladeur franchit l\'anneau et s\'engrène sur la couronne de crabotage du pignon fou.',
  clutchIn: 'On embraye : le couple passe — flux ORANGE du moteur aux roues.',
  waitStop: 'Marche arrière sans synchroniseur : on attend l\'arrêt des pignons.',
  idlerIn: 'Le baladeur d\'AR coulisse et s\'engrène sur la couronne du baladeur 1/2.',
};

const TOUR = [
  { t: '👋 Bienvenue dans TransmiLab 3D', b: 'Un atelier virtuel pour comprendre <b>comment la puissance passe du moteur aux roues</b>, pourquoi une boîte craque, et comment la réparer.<br><br>L\'écran est simple : <b>à gauche</b> vous pilotez, <b>à droite</b> vous analysez.' },
  { t: '🎮 À gauche : je pilote', b: 'Cliquez une position du <b>levier en H</b> pour passer une vitesse. Observez les 3 phases : débrayage, synchronisation, crabotage.<br><br>Réglez le régime, la charge (accélération / frein moteur) et la température d\'huile.' },
  { t: '🔬 Décortiquer', b: 'Dans la liste des pièces : <b>isolez</b> un groupe (ex. synchro 1/2), <b>écartez</b> ses pièces avec le curseur, <b>masquez</b> ce qui gêne, ou activez le <b>mode scalpel</b> (clic = masquer).<br><br>Vue éclatée, coupe en 1 clic et zoom au ralenti sont dans le même onglet.' },
  { t: '🩺 Chercher la panne', b: 'Choisissez un cas : une démarche en étapes vous guide — <b>reproduire</b> le défaut, <b>observer</b>, poser une <b>hypothèse</b>, <b>mesurer</b> les pièces suspectes, <b>désigner</b> la pièce, puis suivre le protocole de <b>réparation</b>.<br><br>Un clic sur n\'importe quelle pièce ouvre sa <b>fiche</b> (rôle, métrologie, symptômes, remontage).' },
];

export function initUI(app) {
  const ui = { app, diag: null, tab: 'tools', partTab: 'role', open: new Set(), telMore: false, query: '' };
  const scList = () => (app.module.id === 'bva' ? SCENARIOS_ECO : SCENARIOS);
  const newDiag = (sc = null) => ({ sc, view: 0, level: 0, pick: false, ok: false, fb: null, done: {}, carnet: [], hyp: null, hypFb: null, reproduced: false, observed: {} });
  ui.diag = newDiag();
  let dragging = null;

  /* =================================================================== levier en H */
  const gate = $('#gate');
  gate.innerHTML = `<svg viewBox="0 0 220 160" role="group" aria-label="Levier de vitesses en H">
    <path class="rail" d="M40 28V132M110 28V132M180 28V132M40 80H180"/>
    ${Object.entries(GATE).map(([g, [x, y]]) => `<g class="pos" data-g="${g}" tabindex="0" role="button" aria-label="${g === 'R' ? 'Marche arrière' : g === 'N' ? 'Point mort' : 'Rapport ' + g}"><circle cx="${x}" cy="${y}" r="16"/><text x="${x}" y="${y}">${g === 'R' ? 'AR' : g}</text></g>`).join('')}
    <circle class="knob" id="knob" cx="110" cy="80" r="7"/></svg>`;
  $$('#gate .pos').forEach((el) => {
    const go = () => ui.requestGear(el.dataset.g === 'R' || el.dataset.g === 'N' ? el.dataset.g : +el.dataset.g);
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  ui.requestGear = (g) => {
    const sim = app.module.sim;
    const ok = sim.requestGear(g);
    if (ok && app.audio.on) app.audio.burst(150, 0.08, 0.3, 'lowpass');
    for (const e of sim.events) ui.handleEvent(e);
    sim.events.length = 0;
  };

  /* =================================================================== pédale, temps, moteur */
  const btnClutch = $('#btnClutch');
  ui.toggleClutch = (force) => {
    const sim = app.module.sim;
    sim.clutchPedal = force === undefined ? !sim.clutchPedal : force;
    btnClutch.setAttribute('aria-pressed', sim.clutchPedal);
    btnClutch.querySelector('b').textContent = sim.clutchPedal ? 'ENFONCÉE' : 'relâchée';
  };
  btnClutch.addEventListener('click', () => ui.toggleClutch());
  $('#timeScale').addEventListener('change', (e) => app.setTimeScale(+e.target.value));
  $('#visSpeed').addEventListener('input', (e) => { app.module.sim.visMul = +e.target.value / 100; $('#visVal').textContent = `${e.target.value} %`; });

  const rpm = $('#rpm'), oil = $('#oilT');
  const bindDrag = (el) => { el.addEventListener('pointerdown', () => { dragging = el; }); el.addEventListener('pointerup', () => { dragging = null; }); el.addEventListener('blur', () => { dragging = null; }); };
  rpm.addEventListener('input', () => { app.module.sim.engineRpm = +rpm.value; $('#rpmVal').textContent = `${rpm.value} tr/min`; });
  bindDrag(rpm); bindDrag(oil);
  $$('input[name=load]').forEach((r) => r.addEventListener('change', () => { app.module.sim.load = r.value; }));
  oil.addEventListener('input', () => { app.module.sim.oilT = +oil.value; $('#oilVal').textContent = `${oil.value} °C`; });
  $('#btnCold').addEventListener('click', () => { app.module.sim.oilT = 20; app.module.sim.autoWarm = false; $('#autoWarm').checked = false; });
  $('#btnHot').addEventListener('click', () => { app.module.sim.oilT = 85; app.module.sim.autoWarm = false; $('#autoWarm').checked = false; });
  $('#autoWarm').addEventListener('change', (e) => { app.module.sim.autoWarm = e.target.checked; });
  const turn = $('#turn');
  turn.addEventListener('input', () => { app.module.sim.turn = +turn.value / 100; $('#turnVal').textContent = `${turn.value} %`; });

  /* =================================================================== coupe, éclaté, loupe, affichage */
  const S = () => app.section;
  const syncSection = () => { const v = Math.round(S().getAmount() * 100); $('#secAmt').value = Math.max(0, Math.min(100, v)); $('#secVal').textContent = `${v} %`; };
  $('#secOn').addEventListener('change', (e) => { S().setEnabled(e.target.checked); if (e.target.checked && S().getAmount() < 0.02) { S().setAmount(0.6); syncSection(); } });
  $('#secAxis').addEventListener('change', (e) => { S().setAxis(e.target.value); S().setAmount(+$('#secAmt').value / 100); });
  $('#secAmt').addEventListener('input', (e) => { if (!$('#secOn').checked) { $('#secOn').checked = true; S().setEnabled(true); } S().setAmount(+e.target.value / 100); $('#secVal').textContent = `${e.target.value} %`; });
  $('#secFlip').addEventListener('change', (e) => { S().setFlip(e.target.checked); S().setAmount(+$('#secAmt').value / 100); });
  $('#secCaps').addEventListener('change', (e) => S().setCaps(e.target.checked));
  ui.axialCut = () => {
    $('#secAxis').value = 'z'; $('#secFlip').checked = false;
    S().setAxis('z'); S().setFlip(false); S().setEnabled(true); S().setPos(0);
    $('#secOn').checked = true; syncSection();
  };
  $('#btnAxial').addEventListener('click', () => {
    if ($('#secOn').checked) { S().setEnabled(false); $('#secOn').checked = false; $('#btnAxial').textContent = '✂ Coupe axiale en 1 clic'; }
    else { ui.axialCut(); $('#btnAxial').textContent = '✖ Retirer la coupe'; }
  });

  let explTimer = null;
  const setExpl = (v) => {
    $('#expl').value = v; $('#explVal').textContent = `${Math.round(v)} %`;
    const info = app.module.setExplode(v / 100);
    $('#explLabel').textContent = info.index < 0 ? info.label : `Étape ${info.index + 1}/${info.total} — ${info.label}`;
  };
  const stopExpl = () => { if (explTimer) { cancelAnimationFrame(explTimer); explTimer = null; } $('#btnExplPlay').textContent = '▶ Lecture auto'; };
  const animExpl = (to, dur) => {
    stopExpl();
    const from = +$('#expl').value, t0 = performance.now();
    $('#btnExplPlay').textContent = '⏸ Pause';
    const tick = (t) => {
      const u = Math.min(1, (t - t0) / (dur * Math.abs(to - from) / 100));
      setExpl(from + (to - from) * u);
      if (u < 1) explTimer = requestAnimationFrame(tick); else stopExpl();
    };
    explTimer = requestAnimationFrame(tick);
  };
  $('#expl').addEventListener('input', (e) => { stopExpl(); setExpl(+e.target.value); });
  $('#btnExplPlay').addEventListener('click', () => { if (explTimer) stopExpl(); else animExpl(100, 24000); });
  $('#btnExplReset').addEventListener('click', () => animExpl(0, 5000));
  ui.resetExplode = () => { stopExpl(); setExpl(0); };

  $$('[data-loupe]').forEach((b) => b.addEventListener('click', () => app.loupe(+b.dataset.loupe)));
  $('#btnLoupeOff').addEventListener('click', () => app.loupeOff());
  $('#btnViewDiff').addEventListener('click', () => app.flyToView('diff'));
  $('#btnViewClutch').addEventListener('click', () => app.flyToView('clutch'));

  $('#housing').addEventListener('input', (e) => { app.opts.housingOpacity = +e.target.value / 100; $('#housingVal').textContent = `${e.target.value} %`; });
  $('#ssp').addEventListener('change', (e) => { app.opts.ssp = e.target.checked; });
  $('#labelMode').addEventListener('change', (e) => { app.opts.labelMode = e.target.value; });
  $('#xray').addEventListener('change', (e) => { app.opts.xray = e.target.checked; });
  $('#lub').addEventListener('change', (e) => { app.opts.lub = e.target.checked; if (app.module.oil) app.module.oil.on = e.target.checked; });
  $('#rotHL').addEventListener('change', (e) => { app.opts.rotHL = e.target.checked; });
  $('#sound').addEventListener('change', (e) => { if (e.target.checked) { if (!app.audio.enable()) { e.target.checked = false; ui.toast('Audio indisponible sur ce navigateur'); } } else app.audio.disable(); });

  /* =================================================================== aide, tour, plein écran */
  $('#btnHelp').addEventListener('click', () => $('#helpModal').classList.remove('hidden'));
  $('#helpClose').addEventListener('click', () => $('#helpModal').classList.add('hidden'));
  $('#helpModal').addEventListener('click', (e) => { if (e.target.id === 'helpModal') $('#helpModal').classList.add('hidden'); });
  $('#btnFull').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); });
  $$('#moduleTabs .tab').forEach((t) => t.addEventListener('click', () => app.setModule(t.dataset.module)));

  let tourI = 0;
  const renderTour = () => {
    $('#tourBody').innerHTML = `<h2>${TOUR[tourI].t}</h2><p>${TOUR[tourI].b}</p>`;
    $('#tourDots').innerHTML = TOUR.map((_, i) => `<i class="${i === tourI ? 'on' : ''}"></i>`).join('');
    $('#tourPrev').style.visibility = tourI ? 'visible' : 'hidden';
    $('#tourNext').textContent = tourI === TOUR.length - 1 ? 'C\'est parti ✔' : 'Suivant →';
  };
  ui.openTour = () => { tourI = 0; renderTour(); $('#tourModal').classList.remove('hidden'); };
  const closeTour = () => { $('#tourModal').classList.add('hidden'); try { localStorage.setItem('tl3d_tour_v2', '1'); } catch (e) { /* stockage indisponible */ } };
  $('#btnTour').addEventListener('click', ui.openTour);
  $('#tourClose').addEventListener('click', closeTour);
  $('#tourPrev').addEventListener('click', () => { tourI = Math.max(0, tourI - 1); renderTour(); });
  $('#tourNext').addEventListener('click', () => { if (tourI >= TOUR.length - 1) closeTour(); else { tourI++; renderTour(); } });
  ui.maybeTour = () => { try { if (!localStorage.getItem('tl3d_tour_v2')) ui.openTour(); } catch (e) { /* ignore */ } };

  window.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { closeTour(); $('#helpModal').classList.add('hidden'); ui.setPick(false); ui.setScalpel(false); app.select(null); return; }
    if ((tag === 'input' && e.target.type !== 'checkbox' && e.target.type !== 'radio') || tag === 'select' || tag === 'textarea') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' && tag !== 'button') { e.preventDefault(); ui.toggleClutch(); return; }
    const k = e.key.toLowerCase();
    const list = app.module.gearList.map(String);
    if (k === '0' || k === 'n') ui.requestGear('N');
    else if (k === 'p' && list.includes('P')) ui.requestGear('P');
    else if (k === 'd' && list.includes('D')) ui.requestGear('D');
    else if (k === 'r' && list.includes('R')) ui.requestGear('R');
    else if (/^[1-6]$/.test(k) && list.includes(k)) ui.requestGear(+k);
    else if (k === 'l') { const sel = $('#labelMode'); sel.selectedIndex = (sel.selectedIndex + 1) % 3; app.opts.labelMode = sel.value; }
  });

  /* =================================================================== toasts, coach */
  let toastT = null;
  ui.toast = (msg, ms = 3200) => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); };
  ui.flash = (txt) => { const f = $('#flash'); f.textContent = txt; f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 650); };
  ui.handleEvent = (e) => {
    if (e.type === 'crunch') { ui.flash('CRAC !'); ui.toast(`Craquement au passage de la ${e.gear === 1 ? '1ère' : e.gear + 'ème'} : synchronisation insuffisante.`); }
    else if (e.type === 'jump') { ui.flash('SAUTE !'); ui.toast('La vitesse a sauté au point mort (jeu axial + crabots usés).'); }
    else if (e.type === 'refus') ui.toast(e.msg, 4500);
    else if (e.type === 'slip') { ui.flash('PATINAGE !'); ui.toast('Un élément patine : le moteur monte en régime mais la voiture ne suit pas. Regardez le tableau d\'engagement.', 4200); }
  };
  ui.setCoach = (html) => { $('#coach').innerHTML = html ? `<span>💡</span><div>${html}</div>` : ''; $('#coach').classList.toggle('hidden', !html); };
  ui.coach = () => {
    const d = ui.diag;
    if (ui.lessonActive && ui.lessonActive()) return ui.setCoach('<b>Parcours guidé</b> : suivez l\'étape affichée en haut du panneau de gauche (touches ← →).');
    if (ui.tab === 'diag') {
      if (!d.sc) return ui.setCoach('Choisissez un <b>cas pratique</b> dans la liste à droite pour commencer.');
      const st = ui.currentStep();
      return ui.setCoach(st.coaches[d.view === null || d.view === undefined ? st.cur : d.view]);
    }
    if (ui.tab === 'part') return ui.setCoach(app.selected ? `Fiche de « <b>${esc((PART_INFO[app.selected] || {}).name || app.selected)}</b> ». Isolez, masquez ou contrôlez la pièce avec les boutons.` : 'Cliquez une pièce dans la vue 3D ou dans la liste pour ouvrir sa fiche.');
    if (app.solo) return ui.setCoach('Groupe isolé. Utilisez <b>Écarter les pièces</b> pour le décortiquer, cliquez une pièce pour sa fiche.');
    return ui.setCoach('<b>Décortiquer</b> : ouvrez un groupe et cliquez <b>Décortiquer</b>, ou cliquez directement une pièce dans la 3D.');
  };

  /* =================================================================== télémétrie */
  const tel = $('#telemetry');
  ui.buildTelemetry = () => {
    const m = app.module;
    let cards;
    if (m.id === 'bvm') cards = [['rpm', 'Régime moteur', 'tr/min'], ['torque', 'Couple moteur', 'Nm'], ['gear', 'Rapport', ''], ['ratio', 'Z mené / Z menant', ''], ['v', 'Vitesse', 'km/h'], ['oil', 'Huile', '°C'],
      ['ip', 'Rapport de pont', '', 1], ['nw', 'Régime roues', 'tr/min', 1], ['tw', 'Couple roues', 'Nm', 1], ['delta', 'Écart de synchro', 'tr/min', 2]];
    else cards = m.sim.tele().map((r, i) => [`t${i}`, r[0], r[2] || '', i > 4 ? 1 : 0]);
    tel.innerHTML = cards.map(([id, l, u, adv]) => `<div class="tcard" id="tc-${id}" data-adv="${adv || 0}"><small>${l}</small><b id="tv-${id}">–</b><em id="tu-${id}">${u}</em></div>`).join('');
    ui.applyTelMore();
  };
  ui.applyTelMore = () => {
    $$('.tcard', tel).forEach((c) => { c.hidden = c.dataset.adv === '2' ? true : (c.dataset.adv === '1' && !ui.telMore); });
    $('#btnTelMore').textContent = ui.telMore ? '− mesures' : '+ mesures';
  };
  $('#btnTelMore').addEventListener('click', () => { ui.telMore = !ui.telMore; ui.applyTelMore(); });
  const setT = (id, v, u) => { const b = $(`#tv-${id}`); if (b) b.textContent = v; if (u !== undefined) { const e = $(`#tu-${id}`); if (e) e.textContent = u; } };
  let lastTel = 0;
  ui.update = (sim, now) => {
    const m = app.module;
    if (m.id === 'bvm') {
      const g = sim.shift ? sim.shift.to : sim.gear;
      const [x, y] = GATE[g] || GATE.N;
      const k = $('#knob'); k.setAttribute('cx', x); k.setAttribute('cy', y);
      $$('#gate .pos').forEach((p) => p.classList.toggle('on', p.dataset.g === String(sim.gear)));
    } else if (m.id === 'bva') {
      $$('#gearBtns button').forEach((b) => { const g = b.dataset.g; b.classList.toggle('on', g === 'D' ? sim.sel === 'D' && sim.mode === 'auto' : /^[1-6]$/.test(g) ? sim.mode === 'manual' && String(sim.gear) === g : sim.sel === g); });
      ui.updateBvaTable(sim);
    } else $$('#gearBtns button').forEach((b) => b.classList.toggle('on', b.dataset.g === String(sim.gear)));
    if (dragging !== rpm) { rpm.value = Math.round(sim.engineRpm / 50) * 50; $('#rpmVal').textContent = `${Math.round(sim.engineRpm)} tr/min`; }
    if (m.id === 'bvm' && dragging !== oil) { oil.value = Math.round(sim.oilT); $('#oilVal').textContent = `${Math.round(sim.oilT)} °C`; }
    ui.updatePhase(sim);
    if (now - lastTel < 90) return;
    lastTel = now;
    ui.updateFlow(sim);
    if (ui.lessonUpdate) ui.lessonUpdate(sim);
    if (ui.tab === 'hydro' && m.id === 'bva' && ui.hydro) ui.hydro.update(sim);
    if (m.id === 'bvm') {
      const t = sim.telemetry;
      setT('rpm', Math.round(t.rpm)); setT('torque', Math.round(t.torque));
      setT('gear', t.gear === 'R' ? 'AR' : t.gear);
      setT('ratio', t.gear === 'N' ? '—' : `${t.ratio.frac} = ${t.ratio.value}`);
      setT('ip', `${FD.Zcrown}/${FD.Zpin} = ${fr(IP)}`);
      setT('v', Math.round(t.v)); setT('nw', Math.round(Math.abs(t.nWheels))); setT('tw', Math.round(t.wheelTorque));
      setT('oil', Math.round(t.oilT));
      $('#tc-oil').classList.toggle('cold', t.oilT < 40); $('#tc-oil').classList.toggle('hot', t.oilT > 85);
      $('#tc-torque').classList.toggle('cold', t.torque < 0);
      const d = $('#tc-delta'), info = sim.syncInfo();
      d.hidden = !(info && (info.sub === 'friction' || info.sub === 'crunch'));
      if (!d.hidden) { setT('delta', Math.round(Math.abs(sim.delta))); d.classList.toggle('bad', info.sub === 'crunch'); }
    } else {
      const rows = sim.tele();
      if (rows.length !== $$('.tcard', tel).length) ui.buildTelemetry();
      rows.forEach((r, i) => setT(`t${i}`, r[1], r[2]));
    }
  };

  /* =================================================================== chemin du couple (explication en clair) */
  const ORD = { 1: '1ère', 2: '2ème', 3: '3ème', 4: '4ème', 5: '5ème' };
  let lastFlow = '';
  $('#flowOn').addEventListener('change', (e) => { $('#flowBar').classList.toggle('hidden', !e.target.checked); lastFlow = ''; });
  ui.updateFlow = (sim) => {
    const m = app.module; let chips = [], text = '';
    if (m.id === 'bvm') {
      const g = sim.gear, fl = sim.flow(), on = fl.level > 0.25, t = sim.telemetry;
      const key = typeof g === 'number' ? SYNC_OF[g].key : g === 'R' ? 12 : null, kn = key === 12 ? '1/2' : key === 34 ? '3/4' : key === 5 ? '5' : '';
      const rows = [['Moteur', true], ['Embrayage', sim.clutch > 0.5], ['Arbre primaire', Math.abs(sim.nP) > 60]];
      if (g === 'R') rows.push(['Pignon AR', on], ['Baladeur AR', on], [`Synchro ${kn}`, on]);
      else if (typeof g === 'number') rows.push([`Pignon fixe ${g}`, on], [`Pignon fou ${g}`, on], [`Synchro ${kn}`, on]);
      else rows.push(['Pignons fous (à vide)', Math.abs(sim.nP) > 60]);
      rows.push(['Arbre secondaire', on], [`Pont ${FD.Zcrown}/${FD.Zpin}`, on], ['Roues', on]);
      chips = rows;
      if (sim.shift) text = 'Passage de rapport en cours : suivez les 3 phases dans le bandeau.';
      else if (g === 'N') text = Math.abs(sim.nP) > 60 ? "<b>Point mort</b> : l'arbre primaire tourne, mais aucun pignon n'est relié à l'arbre secondaire → <b>aucun couple aux roues</b>." : "<b>Point mort, pédale enfoncée</b> : plus rien n'est entraîné par le moteur.";
      else if (sim.clutch < 0.5) text = "<b>Pédale enfoncée</b> : le disque est libéré, le moteur n'entraîne plus la boîte (le couple est coupé).";
      else if (g === 'R') text = `<b>Marche arrière</b> : le baladeur d'AR inverse le sens (${REV.Zring}/${REV.Zr} = ${IR.toFixed(2).replace('.', ',')}), puis le pont divise encore par ${IP.toFixed(2).replace('.', ',')}. ${Math.round(t.rpm)} tr/min moteur → ${Math.round(Math.abs(t.nWheels))} tr/min aux roues.`;
      else { const { Zp, Zs } = GEAR_PAIRS[g]; const r = ratioText(g);
        text = `<b>${ORD[g]}</b> : le pignon fixe de <b>${Zp} dents</b> entraîne le pignon fou de <b>${Zs} dents</b> → régime ÷ ${r.value}. Le pont (${FD.Zcrown}/${FD.Zpin}) divise encore ÷ ${IP.toFixed(2).replace('.', ',')}. <b>${Math.round(t.rpm)} tr/min</b> moteur → <b>${Math.round(Math.abs(t.nWheels))} tr/min</b> aux roues = <b>${Math.round(Math.abs(t.v))} km/h</b>.`; }
    } else if (typeof sim.explain === 'function') {            // tout module fournissant explain() → { chips:[[libellé, actif]], text }
      const ex = sim.explain(); chips = ex.chips; text = ex.text;
    } else {
      const g = sim.gear;
      text = g === 'N' ? '<b>Point mort</b> : aucun embrayage ne transmet de couple.' : `<b>Rapport ${g}</b> engagé sur l'arbre ${g % 2 ? 'intérieur (embrayage C1, rapports impairs)' : 'creux (embrayage C2, rapports pairs)'}. Le rapport suivant est <b>présélectionné</b> sur l'autre arbre : le passage ne coupe jamais le couple.`;
    }
    const html = chips.map(([k, on]) => `<span class="chip-n ${on ? 'on' : 'off'}">${esc(k)}</span>`).join('<span class="arrow">→</span>');
    const sig = html + text;
    if (sig === lastFlow) return;
    lastFlow = sig;
    $('#flowChips').innerHTML = html; $('#flowChips').classList.toggle('hidden', !chips.length);
    $('#flowText').innerHTML = text;
  };

  const banner = $('#phaseBanner');
  ui.updatePhase = (sim) => {
    const ph = sim.phase || 0;
    banner.classList.toggle('hidden', ph === 0);
    if (!ph) return;
    const labels = app.module.id === 'bva' ? ['1 · Remplissage du piston', '2 · Transfert de couple', '3 · Changement de régime'] : ['1 · Débrayage', '2 · Synchronisation', '3 · Crabotage + embrayage'];
    $$('.phase-steps span', banner).forEach((s) => { const p = +s.dataset.p; s.textContent = labels[p - 1]; s.classList.toggle('on', p === ph); s.classList.toggle('done', p < ph); });
    let txt = '', prog = ph / 3;
    if (app.module.id === 'bvm') {
      const sh = sim.shift, info = sim.syncInfo ? sim.syncInfo() : null;
      txt = sh ? (SUB_TEXT[sh.sub] || '') : '';
      if (info && sh.sub === 'friction') { txt += `\nÉcart Δ = ${Math.round(Math.abs(sim.delta))} tr/min · pouvoir de synchro μ = ${fr(info.mu, 2)}`; prog = Math.min(1, info.tf / info.tMax) * 0.6 + 0.2; }
      else if (sh && sh.sub === 'engage') prog = 0.7; else if (sh && sh.sub === 'clutchIn') prog = 0.85 + 0.15 * sim.clutch;
    } else if (app.module.id === 'bva') {
      const sh = sim.shift, on = sh ? sh.on.map((x) => EL_INFO[x].n).join('+') || '—' : '—', off = sh ? sh.off.map((x) => EL_INFO[x].n).join('+') || '—' : '—';
      txt = !sh ? '' : ph === 1 ? `Le piston de ${on} se remplit d'huile : course à vide, aucun couple transmis.` : ph === 2 ? `Recouvrement : ${off} se relâche pendant que ${on} s'applique. Le couple n'est jamais coupé.` : 'Phase d\'inertie : le régime moteur rejoint celui du nouveau rapport ; la vitesse du véhicule ne change pas.';
      prog = !sh ? 0 : ph === 1 ? 0.2 : ph === 2 ? 0.2 + 0.4 * Math.min(1, sh.t / 0.45) : 0.6 + 0.4 * Math.min(1, sh.t / 0.55);
    } else txt = ph === 1 ? 'Changement de rapport en cours…' : ph === 2 ? 'Présélection du rapport suivant sur l\'arbre libre (embrayage de cet arbre ouvert).' : 'Recouvrement : un embrayage s\'ouvre pendant que l\'autre se ferme — couple continu.';
    $('#phaseText').textContent = txt; $('#phaseText').style.whiteSpace = 'pre-line';
    $('#phaseBar').style.width = `${Math.round(prog * 100)}%`;
  };

  /* =================================================================== onglets droite */
  ui.showTab = (name) => {
    ui.tab = name;
    for (const [k, id] of [['tools', 'Tools'], ['part', 'Part'], ['hydro', 'Hydro'], ['diag', 'Diag']]) {
      $(`#pane${id}`).classList.toggle('hidden', name !== k);
      $(`#tab${id}`).classList.toggle('active', name === k);
    }
    if (name === 'hydro' && !ui.hydro) ui.hydro = createHydro($('#paneHydro'), app);
    if (name === 'hydro') ui.hydro.update(app.module.sim);
    if (name === 'diag') ui.renderDiag();
    if (name === 'part') ui.renderPart(app.selected);
    ui.coach();
  };
  $('#tabTools').addEventListener('click', () => ui.showTab('tools'));
  $('#tabPart').addEventListener('click', () => ui.showTab('part'));
  $('#tabDiag').addEventListener('click', () => ui.showTab('diag'));
  $('#tabHydro').addEventListener('click', () => ui.showTab('hydro'));

  /* =================================================================== DÉCORTIQUER : arbre, isoler, masquer, écarter */
  const pname = (id) => (PART_INFO[id] && PART_INFO[id].name) || id;
  const groupOf = (id) => app.module.groups.find((g) => g.ids.includes(id));
  ui.hideStack = [];

  ui.refreshDim = () => {
    app.dim = new Set();
    if (app.solo) for (const id of Object.keys(app.module.parts)) if (!app.solo.has(id)) app.dim.add(id);
  };
  ui.hidePart = (id) => { if (!app.hidden.has(id)) { app.hidden.add(id); ui.hideStack.push(id); } if (app.selected === id) app.select(null); ui.renderTree(); ui.renderPartIfOpen(); };
  ui.showPart = (id) => { app.hidden.delete(id); ui.hideStack = ui.hideStack.filter((x) => x !== id); ui.renderTree(); ui.renderPartIfOpen(); };
  ui.showAll = () => { app.hidden.clear(); ui.hideStack = []; ui.clearIsolation(); ui.renderTree(); ui.renderPartIfOpen(); };
  ui.undoHide = () => { const id = ui.hideStack.pop(); if (id) { app.hidden.delete(id); ui.renderTree(); ui.renderPartIfOpen(); } };
  ui.renderPartIfOpen = () => { if (ui.tab === 'part') ui.renderPart(app.selected); };

  ui.isolateIds = (ids, groupObj) => {
    app.solo = new Set(ids.filter((id) => app.module.parts[id]));
    for (const id of app.solo) app.hidden.delete(id);
    ui.refreshDim();
    app.activeGroup = groupObj || null;
    ui.updateGroupBar();
    ui.coach();
  };
  ui.isolatePart = (id) => { const g = groupOf(id); ui.isolateIds([id], null); app.focusIds([id]); app.activeGroup = null; ui.updateGroupBar(); void g; };
  ui.isolateGroup = (gid) => {
    const g = app.module.groups.find((x) => x.id === gid); if (!g) return;
    ui.isolateIds([...g.ids, ...(g.ctx || [])], g);
    $('#spread').value = 0; $('#spreadVal').textContent = '0 %';
    applySpread(app.module, g, 0);
    app.focusIds(g.ids);
    ui.renderTree();
  };
  ui.clearIsolation = () => {
    app.solo = null; app.dim = new Set(); app.activeGroup = null;
    applySpread(app.module, null, 0);
    $('#spread').value = 0; $('#spreadVal').textContent = '0 %';
    ui.updateGroupBar(); ui.coach(); ui.renderTree();
  };
  ui.updateGroupBar = () => {
    const g = app.activeGroup, bar = $('#groupBar');
    bar.classList.toggle('hidden', !app.solo);
    $('#gbName').textContent = g ? `Groupe : ${g.name}` : 'Pièce isolée';
    $('#gbHint').textContent = g ? (g.hint || 'Les pièces s\'écartent depuis le centre du groupe.') : 'Les autres pièces sont estompées. Cliquez « Boîte entière » pour revenir.';
    $('#spread').closest('.slider').classList.toggle('hidden', !g);
  };
  $('#btnGroupBack').addEventListener('click', () => { ui.clearIsolation(); app.flyToView('global'); });
  $('#spread').addEventListener('input', (e) => { $('#spreadVal').textContent = `${e.target.value} %`; if (app.activeGroup) applySpread(app.module, app.activeGroup, +e.target.value / 100); });

  ui.setScalpel = (on) => {
    app.scalpel = on;
    $('#btnScalpel').setAttribute('aria-pressed', on);
    $('#scalpelHint').classList.toggle('hidden', !on);
    if (on) ui.setPick(false);
  };
  $('#btnScalpel').addEventListener('click', () => ui.setScalpel(!app.scalpel));
  $('#btnShowAll').addEventListener('click', () => ui.showAll());
  $('#btnUndoHide').addEventListener('click', () => ui.undoHide());
  $('#partSearch').addEventListener('input', (e) => { ui.query = e.target.value.trim().toLowerCase(); ui.renderTree(); });

  ui.renderTree = () => {
    const tree = $('#partTree'), q = ui.query, m = app.module;
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const qn = norm(q);
    const match = (id) => !qn || norm(pname(id)).includes(qn) || norm(id).includes(qn);
    let h = '';
    for (const g of m.groups) {
      const ids = g.ids.filter((id) => m.parts[id] && match(id));
      if (!ids.length) continue;
      const open = ui.open.has(g.id) || !!qn;
      const hiddenN = ids.filter((id) => app.hidden.has(id)).length;
      h += `<div class="grp ${app.activeGroup === g ? 'on' : ''}"><div class="grp-h">
        <button class="caret" data-open="${g.id}" aria-label="Déplier">${open ? '▾' : '▸'}</button>
        <span class="gn" data-open="${g.id}">${g.icon} ${esc(g.name)}</span>
        <span class="cnt">${ids.length}${hiddenN ? ` · ${hiddenN} masquée(s)` : ''}</span>
        <button class="btn small iso" data-iso="${g.id}" title="Isoler ce groupe et l'écarter">Décortiquer</button></div>`;
      if (open) {
        h += '<ul class="grp-l">' + ids.map((id) => `<li class="${app.selected === id ? 'sel' : ''} ${app.hidden.has(id) ? 'off' : ''}" data-p="${id}">
          <button class="eye" data-eye="${id}" title="${app.hidden.has(id) ? 'Réafficher' : 'Masquer'}" aria-label="${app.hidden.has(id) ? 'Réafficher' : 'Masquer'}">${app.hidden.has(id) ? '🚫' : '👁'}</button>
          <span class="pn">${esc(pname(id))}</span></li>`).join('') + '</ul>';
      }
      h += '</div>';
    }
    tree.innerHTML = h || '<div class="empty small">Aucune pièce ne correspond.</div>';
    $$('[data-open]', tree).forEach((b) => b.addEventListener('click', () => { const id = b.dataset.open; if (ui.open.has(id)) ui.open.delete(id); else ui.open.add(id); ui.renderTree(); }));
    $$('[data-iso]', tree).forEach((b) => b.addEventListener('click', () => ui.isolateGroup(b.dataset.iso)));
    $$('[data-eye]', tree).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const id = b.dataset.eye; if (app.hidden.has(id)) ui.showPart(id); else ui.hidePart(id); }));
    $$('li[data-p]', tree).forEach((li) => li.addEventListener('click', () => { if (!app.hidden.has(li.dataset.p)) app.select(li.dataset.p); }));
  };

  /* =================================================================== FICHE PIÈCE */
  const list = (a) => `<ul>${(a || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const PILLS = [['role', '🧭 Rôle'], ['metro', '📏 Contrôle'], ['symp', '🔊 Symptômes'], ['remontage', '🔧 Remontage']];

  function gauge(c) {
    const max = Math.max(c.neuf, c.limite, c.mesure) * 1.35 || 1, pct = (v) => Math.min(100, (v / max) * 100);
    const bad = c.sens === 'min' ? c.mesure < c.limite : c.mesure > c.limite;
    return `<div class="gauge ${c.sens}" style="--lim:${pct(c.limite)}%"><div class="g-bar"><i class="mk neuf" style="left:${pct(c.neuf)}%"></i><i class="mk lim" style="left:${pct(c.limite)}%"></i><i class="mk mes" style="left:${pct(c.mesure)}%"></i></div>
      <div class="g-leg"><span>${esc(c.label)}</span><span style="color:#2ecc71">neuf ${fr(c.neuf, 2)} ${c.unit}</span><span style="color:#f5b400">limite ${fr(c.limite, 2)}</span><span style="color:#00e5ff">mesuré ${fr(c.mesure, 2)}</span></div>
      <div class="verdict" style="color:${bad ? '#ff6b6b' : '#2ecc71'}">${bad ? '✖ Hors tolérance' : '✔ Dans la tolérance'}${c.note && bad ? ' — ' + esc(c.note) : ''}</div></div>`;
  }

  ui.renderPart = (id) => {
    const pane = $('#panePart');
    $('#right').scrollTop = 0;
    if (!id) { pane.innerHTML = '<div class="empty">👆 Cliquez une pièce dans la vue 3D ou dans la liste <b>Décortiquer</b>.<br><br>Vous obtiendrez son rôle, comment la contrôler, les symptômes de panne et les points de remontage.</div>'; return; }
    const i = PART_INFO[id] || { name: id, mat: '—', cat: 'autre', role: ['Fiche non renseignée.'], metro: [], symp: [], remontage: [] };
    const hidden = app.hidden.has(id), isolated = app.solo && app.solo.size === 1 && app.solo.has(id), g = groupOf(id);
    const clair = (i.role[0] || '').split(/(?<=[.!?])\s/)[0];
    const meas = ui.lastMeasure && ui.lastMeasure.id === id ? ui.lastMeasure.res : null;
    const back = ui.prevTab === 'diag' ? '← Retour à la panne' : '← Liste des pièces';
    pane.innerHTML = `<button class="btn small ghost" id="aBack">${back}</button><h3>${esc(i.name)}</h3>
      <div><span class="chip">${esc(CAT[i.cat] || 'Pièce')}</span><span class="chip">${esc(i.mat)}</span></div>
      <div class="clair"><b>En clair :</b> ${esc(clair)}</div>
      <div class="actions">
        <button class="btn small" id="aFocus">🎯 Centrer</button>
        <button class="btn small ${isolated ? 'toggle' : ''}" aria-pressed="${!!isolated}" id="aIso">👁 ${isolated ? 'Tout afficher' : 'Isoler'}</button>
        <button class="btn small" id="aHide">${hidden ? '↶ Réafficher' : '🚫 Masquer'}</button>
        ${g ? '<button class="btn small" id="aGroup">⚙ Son groupe</button>' : ''}
        <button class="btn small primary" id="aMeasure">🔬 Contrôler</button>
      </div>
      <div id="measureOut">${meas ? measureHtml(meas) : ''}</div>
      <div class="pills">${PILLS.map(([k, l]) => `<button class="pill ${ui.partTab === k ? 'on' : ''}" data-pill="${k}">${l}</button>`).join('')}</div>
      <div class="card pillbody">${list(i[ui.partTab])}</div>
      <p class="hint nm">Repères pédagogiques : se référer à la documentation constructeur pour les valeurs exactes.</p>`;
    $$('[data-pill]', pane).forEach((b) => b.addEventListener('click', () => { ui.partTab = b.dataset.pill; ui.renderPart(id); }));
    $('#aBack', pane).addEventListener('click', () => ui.showTab(ui.prevTab === 'diag' ? 'diag' : 'tools'));
    $('#aFocus', pane).addEventListener('click', () => app.focusPart(id));
    $('#aIso', pane).addEventListener('click', () => { if (isolated) ui.clearIsolation(); else ui.isolatePart(id); ui.renderPart(id); });
    $('#aHide', pane).addEventListener('click', () => { if (hidden) ui.showPart(id); else ui.hidePart(id); });
    $('#aGroup', pane)?.addEventListener('click', () => { ui.showTab('tools'); ui.isolateGroup(g.id); });
    $('#aMeasure', pane).addEventListener('click', () => ui.measure(id));
  };
  const measureHtml = (r) => r.generic
    ? `<div class="measure ${r.bad ? 'bad' : 'ok'}"><b>🔬 Contrôle</b><p>${esc(r.text)}</p></div>`
    : `<div class="measure ${r.bad ? 'bad' : 'ok'}"><b>🔬 Contrôle : ${esc(r.label)}</b>${gauge(r)}</div>`;

  /** « Contrôler » : relevé de mesure de la pièce selon le cas en cours (carnet de mesures) */
  ui.measure = (id) => {
    const res = (app.module.id === 'bva' && liveMeasure(app.module.sim, id)) || measurePart(ui.diag.sc, id);
    ui.lastMeasure = { id, res };
    if (ui.diag.sc) {
      ui.diag.carnet = ui.diag.carnet.filter((c) => c.id !== id);
      ui.diag.carnet.push({ id, name: pname(id), res });
      const p = app.module.parts[id];
      if (p && p.labelEl) p.labelEl.classList.toggle('warn', !!res.bad);
    }
    if (ui.tab === 'diag') { app.selected = id; app.focusPart(id); ui.renderDiag(); } else ui.renderPart(id);
    ui.coach();
  };

  /* =================================================================== CHERCHER LA PANNE : démarche guidée */
  ui.setPick = (on) => {
    ui.diag.pick = on; app.pickMode = on;
    $('#pickHint').classList.toggle('hidden', !on);
    $('#gl').classList.toggle('pick', on);
    if (on) ui.setScalpel(false);
  };

  const STEPS = ['Reproduire', 'Observer', 'Hypothèse', 'Mesurer', 'Désigner', 'Réparer'];
  ui.currentStep = () => {
    const d = ui.diag, sc = d.sc;
    const done = [d.reproduced, Object.keys(d.observed).length > 0, d.hyp !== null, d.carnet.length > 0, d.ok, d.ok && Object.values(d.done).filter(Boolean).length >= sc.protocole.length];
    const idx = done.findIndex((x) => !x);
    const cur = idx < 0 ? STEPS.length - 1 : idx;
    const coaches = [
      `<b>Étape 1/6</b> — Cliquez « ${esc(sc.demo.label)} » pour reproduire le défaut sur la boîte.`,
      '<b>Étape 2/6</b> — Observez la boîte : faites les actions proposées (zoom, rayons X…) puis regardez la 3D.',
      '<b>Étape 3/6</b> — Quelle est la cause la plus probable ? Choisissez une hypothèse.',
      '<b>Étape 4/6</b> — Cliquez une pièce suspecte puis <b>Contrôler</b> : comparez la mesure à la limite.',
      '<b>Étape 5/6</b> — Cliquez « Désigner la pièce défectueuse » puis la pièce en 3D.',
      '<b>Étape 6/6</b> — Suivez le protocole de réparation et cochez chaque étape.',
    ];
    const coach = coaches[cur];
    return { done, cur, coach, coaches };
  };

  ui.renderDiag = () => {
    const pane = $('#paneDiag'), d = ui.diag, m = app.module;
    if (m.id === 'dct') {
      const txt = {
        dct: ['Double embrayage à arbres concentriques', 'Les rapports IMPAIRS passent par l\'arbre intérieur (C1), les PAIRS par l\'arbre creux (C2). Le calculateur PRÉSÉLECTIONNE le rapport suivant sur l\'arbre libre ; le passage est un recouvrement des deux embrayages : couple continu.', 'Cas pratiques à venir : à-coups à basse vitesse (adaptation des points de léchage), défaut de présélection.'],
      }[m.id];
      pane.innerHTML = `<h3>${txt[0]}</h3><div class="card"><h4>Principe</h4><p>${esc(txt[1])}</p></div><div class="card"><h4>À venir</h4><p>${esc(txt[2])}</p></div>
        <p class="hint">Le Module 1 (BVM) contient les 3 cas pratiques complets.</p>`;
      return;
    }
    if (!d.sc) {
      pane.innerHTML = `<h3>Chercher la panne</h3>
        <p class="lead">Choisissez un cas. La boîte est placée dans les conditions de la panne, puis <b>6 petites étapes</b> vous guident.</p>
        <div class="scn">${scList().map((s) => `<button data-sc="${s.id}"><b>${s.id}</b><span>${esc(s.title)}</span></button>`).join('')}</div>`;
      $$('[data-sc]', pane).forEach((b) => b.addEventListener('click', () => ui.selectScenario(b.dataset.sc)));
      return;
    }
    const sc = d.sc, st = ui.currentStep();
    const view = d.view === null || d.view === undefined ? st.cur : d.view;
    const unlocked = (i) => i < 5 || d.ok;
    let h = `<div class="casehead"><span><b>Cas ${sc.id}</b> · ${esc(sc.title)}</span><button class="btn small ghost" id="btnReset">Changer de cas</button></div>`;
    h += `<div class="steps">${STEPS.map((x, i) => `<button data-view="${i}" class="${st.done[i] ? 'done' : ''} ${i === view ? 'view' : ''}"><i>${st.done[i] ? '✓' : i + 1}</i>${x}</button>`).join('')}</div>`;
    h += `<details class="card or" ${view === 0 ? 'open' : ''}><summary>📄 Ordre de réparation : « ${esc(sc.or.client.replace(/[«»"]/g, '').slice(0, 70))}… »</summary>
      <div class="or-line"><small>Client</small><span>${esc(sc.or.client)}</span></div>
      <div class="or-line"><small>Véhicule</small><span>${esc(sc.or.vehicule)}</span></div>
      <div class="or-line"><small>Conditions</small><span>${esc(sc.or.conditions)}</span></div></details>`;

    h += '<div class="card step cur">';
    if (view === 0) {
      h += `<h4><i>1</i> Reproduire le défaut</h4><p class="lead">Voyez la panne se produire sur la boîte.</p>
        <button class="btn block primary" id="btnDemo">${esc(sc.demo.label)}</button>
        <button class="btn block ghost" id="btnSetup">↻ Replacer la boîte en situation</button>`;
    } else if (view === 1) {
      h += `<h4><i>2</i> Observer</h4><p class="lead">Faites ces actions, puis regardez la vue 3D.</p><ul class="obs">${sc.observe.map((o, i) => `<li>${o.act ? `<button class="btn small" data-obs="${i}">Faire</button>` : '<span class="dot">👁</span>'}<span>${esc(o.t)}</span>${d.observed[i] ? ' ✓' : ''}</li>`).join('')}</ul>${m.id === 'bva' ? ui.scanHtml() : ''}`;
    } else if (view === 2) {
      h += `<h4><i>3</i> Quelle est la cause la plus probable ?</h4><p class="lead">Cliquez votre hypothèse : on vous explique tout de suite.</p>
        <div class="hyp">${sc.hypotheses.map((x, i) => `<label class="${d.hyp === i ? (x.ok ? 'ok' : 'bad') : ''}"><input type="radio" name="hyp" value="${i}" ${d.hyp === i ? 'checked' : ''}><span>${esc(x.t)}</span></label>`).join('')}</div>
        ${d.hyp !== null ? `<div class="fb ${sc.hypotheses[d.hyp].ok ? 'ok' : 'bad'}">${sc.hypotheses[d.hyp].ok ? '✔ ' : '✖ '}${esc(sc.hypotheses[d.hyp].why)}</div>` : ''}`;
    } else if (view === 3) {
      const ids = Object.keys(sc.mesures);
      h += `<h4><i>4</i> Mesurer les pièces suspectes</h4><p class="lead">Touchez une pièce pour la contrôler : comparez la mesure à la limite.</p>
        <div class="suspects">${ids.map((id) => { const c = d.carnet.find((x) => x.id === id); return `<button class="btn small ${c ? (c.res.bad ? 'bad' : 'ok') : ''}" data-meas="${id}">${c ? (c.res.bad ? '✖ ' : '✔ ') : '🔬 '}${esc(pname(id))}</button>`; }).join('')}</div>
        <p class="hint nm">Vous pouvez aussi cliquer une pièce dans la vue 3D puis « Contrôler ».</p>
        ${ui.lastMeasure && d.carnet.some((c) => c.id === ui.lastMeasure.id) ? `<div class="measure-title">${esc(pname(ui.lastMeasure.id))}</div>${measureHtml(ui.lastMeasure.res)}` : ''}`;
    } else if (view === 4) {
      h += `<h4><i>5</i> Désigner la pièce défectueuse</h4><p class="lead">Choisissez une pièce mesurée hors tolérance, ou cliquez-la en 3D.</p>
        ${d.carnet.length ? `<ul class="carnet">${d.carnet.map((c) => `<li class="${c.res.bad ? 'bad' : 'ok'}"><b>${esc(c.name)}</b><span>${c.res.generic ? 'conforme' : `${fr(c.res.mesure, 2)} ${c.res.unit} (lim. ${fr(c.res.limite, 2)})`}</span><button class="btn small" data-designate="${c.id}">Désigner</button></li>`).join('')}</ul>` : '<div class="empty small">Mesurez d\'abord quelques pièces (étape 4).</div>'}
        <button class="btn block ${d.pick ? 'primary' : ''}" id="btnPick">${d.pick ? '🎯 Cliquez maintenant la pièce en 3D…' : '🎯 Désigner en cliquant dans la 3D'}</button>
        ${d.fb ? `<div class="fb ${d.fb.level}">${esc(d.fb.msg)}</div>` : ''}`;
    } else if (!unlocked(view)) {
      h += '<h4><i>6</i> Réparer</h4><div class="empty small">🔒 Désignez d\'abord la pièce défectueuse (étape 5).</div>';
    } else {
      h += `<h4><i>6</i> Réparer — protocole atelier</h4>
        <div class="retenir"><b>À retenir</b> ${esc(sc.retenir || '')}</div>
        <ol class="proto">${sc.protocole.map((p, i) => `<li><label><input type="checkbox" data-step="${i}" ${d.done[i] ? 'checked' : ''}><b>${i + 1}. ${esc(p.t)}</b></label><p>${esc(p.d)}</p>${p.ctl ? gauge({ ...p.ctl, bad: false }) : ''}</li>`).join('')}</ol>
        <p class="hint nm">Valeurs indicatives. Toujours appliquer la gamme constructeur.</p>`;
    }
    h += '</div>';
    h += `<div class="stepnav"><button class="btn" id="btnPrev" ${view === 0 ? 'disabled' : ''}>← Précédent</button>
      <button class="btn ${st.done[view] ? 'primary' : ''}" id="btnNext" ${view >= 5 ? 'disabled' : ''}>Suivant →</button></div>`;
    h += `<details class="card hints" ${d.level ? 'open' : ''}><summary>💡 Besoin d'aide ? (${d.level}/3 indices)</summary><button class="btn block" id="btnHint" ${d.level >= 3 ? 'disabled' : ''}>Demander un indice</button>
      ${[...Array(d.level)].map((_, i) => `<div class="hint-box l${i + 1}"><b>${esc(sc.hints[i].title)}</b>${esc(sc.hints[i].body)}</div>`).join('')}</details>`;
    pane.innerHTML = h;
    const go = (v) => { d.view = Math.max(0, Math.min(5, v)); ui.renderDiag(); ui.coach(); $('#right').scrollTop = 0; };
    $$('[data-view]', pane).forEach((b) => b.addEventListener('click', () => go(+b.dataset.view)));
    $('#btnPrev', pane)?.addEventListener('click', () => go(view - 1));
    $('#btnNext', pane)?.addEventListener('click', () => go(view + 1));
    $('#btnSetup', pane)?.addEventListener('click', () => ui.applySetup());
    $('#btnDemo', pane)?.addEventListener('click', () => ui.runDemo());
    $$('[data-obs]', pane).forEach((b) => b.addEventListener('click', () => ui.doObserve(+b.dataset.obs)));
    $$('input[name=hyp]', pane).forEach((r) => r.addEventListener('change', () => { ui.diag.hyp = +r.value; ui.renderDiag(); ui.coach(); }));
    $$('[data-meas]', pane).forEach((b) => b.addEventListener('click', () => ui.measure(b.dataset.meas)));
    $$('[data-designate]', pane).forEach((b) => b.addEventListener('click', () => { app.selected = b.dataset.designate; ui.onPick(b.dataset.designate); }));
    $('#btnPick', pane)?.addEventListener('click', () => { ui.setPick(!ui.diag.pick); ui.renderDiag(); });
    $('#btnHint', pane)?.addEventListener('click', () => ui.askHint());
    $('#btnReset', pane)?.addEventListener('click', () => ui.selectScenario(null));
    $$('[data-step]', pane).forEach((c) => c.addEventListener('change', () => { ui.diag.done[c.dataset.step] = c.checked; ui.renderDiag(); ui.coach(); }));
  };

  ui.selectScenario = (id) => {
    const sim = app.module.sim;
    if (!id) { ui.setPick(false); }
    ui.setPick(false);
    if (app.solo) ui.clearIsolation();            // repartir d'une boîte entière
    app.alerts = new Set();
    $$('.lbl.warn').forEach((l) => l.classList.remove('warn'));
    ui.lastMeasure = null;
    ui.scan = null;
    if (!id) { sim.faults = {}; ui.diag = newDiag(); ui.renderDiag(); ui.coach(); return; }
    ui.diag = newDiag(scList().find((s) => s.id === id));
    sim.faults = { ...ui.diag.sc.faults };
    ui.applySetup();
    ui.renderDiag(); ui.coach();
  };
  ui.applySetup = (quiet) => {
    const sc = ui.diag.sc, sim = app.module.sim; if (!sc) return;
    const s = sc.setup;
    app.loupeOff(true);
    sim.autoWarm = false; $('#autoWarm').checked = false;
    sim.oilT = s.oilT; sim.load = s.load || 'accel';
    $$('input[name=load]').forEach((r) => { r.checked = r.value === sim.load; });
    sim.forceGear(s.gear, s.rpm);
    ui.toggleClutch(false);
    app.setTimeScale(1);
    if (!quiet) ui.toast(`Cas ${sc.id} : ${s.hintTools}`, 4800);
  };
  ui.runDemo = () => {
    const d = ui.diag, sim = app.module.sim; if (!d.sc) return;
    ui.applySetup(true);
    const a = d.sc.demo.action;
    if (a === 'ecoAccel') { setTimeout(() => ui.toast('Accélération : surveillez le régime moteur et le patinage (+ mesures).', 4000), 300); }
    else if (a === 'ecoLaunch') { sim.forceGear('N', 900); setTimeout(() => { sim.engineRpm = 1500; ui.requestGear('D'); ui.toast('N → D, accélérateur enfoncé : surveillez les éléments commandés.', 4600); }, 700); }
    else if (a === 'ecoCruise') { ui.toast('Vitesse stabilisée : le pontage WK se ferme dans un instant…', 4000); }
    else if (a === 'ecoRet') { ui.setRetarder(100); ui.toast('Ralentisseur à 100 % : surveillez le couple et les températures.', 4000); }
    else if (a === 'ecoStop') { ui.setEngine(false); ui.showTab('hydro'); ui.toast('Moteur arrêté : attendez 20 s puis lisez PHD (≥ 1,5 bar).', 5000); }
    else if (a === 'gear2') setTimeout(() => ui.requestGear(2), 400);
    else if (a === 'decel') { sim.load = 'decel'; $$('input[name=load]').forEach((r) => { r.checked = r.value === 'decel'; }); ui.toast('Frein moteur : surveillez le baladeur 3/4…', 4000); }
    else if (a === 'pedal') { ui.toggleClutch(false); setTimeout(() => ui.toggleClutch(true), 2800); setTimeout(() => ui.toggleClutch(false), 7500); ui.toast('Pédale relâchée, puis enfoncée dans 3 s, puis relâchée.', 4000); }
    d.reproduced = true; d.view = 1; ui.renderDiag(); ui.coach();
  };
  ui.doObserve = (i) => {
    const d = ui.diag, o = d.sc.observe[i];
    if (o.act === 'bvaScan') ui.scanGears();
    else if (o.act === 'hydro') ui.showTab('hydro');
    else if (o.act === 'ecoRetView') app.flyToView('ret');
    else if (o.act === 'ecoHydroView') app.flyToView('hydro');
    else if (o.act === 'ecoStop') ui.setEngine(false);
    else if (o.act === 'bvaTable') { $('#secShift').open = true; $('#bvaTable').scrollIntoView({ block: 'center' }); ui.toast('Tableau d\'engagement : cherchez l\'élément commun aux rapports en panne.', 3800); }
    else if (o.act === 'tele') { ui.telMore = true; ui.applyTelMore(); }
    else if (o.act === 'bvaConv') { app.flyToView('conv'); }
    else if (o.act === 'loupe12') app.loupe(12);
    else if (o.act === 'loupe34') app.loupe(34);
    else if (o.act === 'xray') { $('#xray').checked = true; app.opts.xray = true; }
    else if (o.act === 'rotHL') { $('#rotHL').checked = true; app.opts.rotHL = true; }
    else if (o.act === 'sound') { const c = $('#sound'); if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('change')); } }
    d.observed[i] = true; ui.renderDiag(); ui.coach();
  };
  ui.askHint = () => {
    const d = ui.diag; if (!d.sc || d.level >= 3) return;
    d.level++;
    if (d.level === 3) app.alerts = new Set(d.sc.alertIds);
    ui.renderDiag();
  };
  ui.onPick = (partId) => {
    const d = ui.diag; if (!d.sc) { ui.toast('Choisissez d\'abord un cas pratique.'); return; }
    d.fb = checkDiagnosis(d.sc, partId, PART_INFO[partId]);
    if (d.fb.ok) { d.ok = true; d.view = 5; ui.setPick(false); app.alerts = new Set(d.sc.alertIds); }
    ui.renderDiag(); ui.coach();
  };

  /* =================================================================== BOÎTE AUTOMATIQUE : tableau d'engagement, frein, essai des rapports */
  const BVA_ROWS = [1, 2, 3, 4, 5, 6, 'R'], EL_COLS = ['a', 'b', 'd', 'e', 'f'];
  ui.renderBvaTable = () => {
    const box = $('#bvaTable'); if (!box) return;
    box.innerHTML = `<table><caption>Tableau d'engagement <small>(● = élément appliqué)</small></caption>
      <thead><tr><th>Rapport</th>${EL_COLS.map((e) => `<th title="${EL_INFO[e].kind} ${EL_INFO[e].n} : ${EL_INFO[e].role}">${EL_INFO[e].n}<small>${e === 'a' || e === 'b' ? 'emb.' : 'frein'}</small></th>`).join('')}<th>i</th></tr></thead>
      <tbody>${BVA_ROWS.map((g) => `<tr data-g="${g}" tabindex="0" role="button" aria-label="Rapport ${g}"><th>${g === 'R' ? 'AR' : g}</th>${EL_COLS.map((e) => `<td data-e="${e}">${BVA_ENG[g].includes(e) ? '●' : ''}</td>`).join('')}<td class="i">${fr(BVA_I[g], 2)}</td></tr>`).join('')}</tbody></table>
      <p class="hint nm">Cliquez une ligne pour engager ce rapport. Un rapport = 2 éléments appliqués.</p>`;
    $$('tr[data-g]', box).forEach((r) => { const go = () => ui.requestGear(r.dataset.g === 'R' ? 'R' : +r.dataset.g); r.addEventListener('click', go); r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
    ui.bvaTabKey = '';
  };
  ui.updateBvaTable = (sim) => {
    const box = $('#bvaTable'); if (!box || !box.firstChild) return;
    const key = `${sim.gear}|${sim.shift ? sim.shift.to : ''}|${EL_ORDER.map((e) => (sim.slipEl[e] > 0.15 ? 1 : 0) + '' + (sim.lv[e] > 0.5 ? 1 : 0)).join('')}`;
    if (key === ui.bvaTabKey) return; ui.bvaTabKey = key;
    $$('tr[data-g]', box).forEach((r) => {
      const g = r.dataset.g === 'R' ? 'R' : +r.dataset.g;
      r.classList.toggle('cur', sim.gear === g); r.classList.toggle('next', !!sim.shift && sim.shift.to === g && sim.gear !== g);
      $$('td[data-e]', r).forEach((c) => { const e = c.dataset.e, on = BVA_ENG[g].includes(e); c.classList.toggle('lit', on && sim.gear === g && sim.lv[e] > 0.5); c.classList.toggle('slip', on && sim.gear === g && sim.slipEl[e] > 0.15); });
    });
  };
  const EL_ORDER = ['a', 'b', 'd', 'e', 'f'];
  ui.setBrake = (on) => {
    const sim = app.module.sim; if (sim.brake === undefined) return;
    sim.brake = on; const b = $('#btnBrake'); if (b) { b.setAttribute('aria-pressed', on); b.querySelector('b').textContent = on ? 'OUI' : 'non'; }
  };
  $('#btnBrake')?.addEventListener('click', () => ui.setBrake(!app.module.sim.brake));
  $$('[data-bview]').forEach((b) => b.addEventListener('click', () => app.flyToView(b.dataset.bview)));
  ui.setEngine = (on) => { const sim = app.module.sim; if (sim.engineOn === undefined) return; sim.engineOn = on; const b = $('#btnEngine'); if (b) { b.setAttribute('aria-pressed', !on); b.querySelector('b').textContent = on ? 'en marche' : 'ARRÊTÉ'; } if (on) sim.engineRpm = Math.max(sim.engineRpm, 620); };
  $('#btnEngine')?.addEventListener('click', () => ui.setEngine(!app.module.sim.engineOn));
  ui.setRetarder = (v) => { const sim = app.module.sim; if (sim.retDemand === undefined) return; sim.retDemand = v / 100; $('#retDem').value = v; $('#retVal').textContent = `${Math.round(v)} %`; };
  $('#retDem')?.addEventListener('input', (e) => ui.setRetarder(+e.target.value));
  $('#wkMode')?.addEventListener('change', (e) => { app.module.sim.wkMode = e.target.value; });
  $('#aisMode')?.addEventListener('change', (e) => { app.module.sim.aisOpt = e.target.value; });
  /** « Essai des rapports » : on simule chaque rapport sur une boîte de copie (mêmes pannes) et on lit le patinage — sans toucher à la boîte affichée */
  ui.scanGears = () => {
    const live = app.module.sim, s = new EcoSim(); s.faults = { ...live.faults }; s.oilT = live.oilT;
    const rows = [];
    for (const g of [1, 2, 3, 4, 5, 6, 'R']) {
      s.faults = { ...live.faults }; s.oilT = 85; s.forceGear(g, g === 'R' ? 1200 : 1500); s.load = 'accel';
      for (let t = 0; t < 2.2; t += 0.02) s.update(0.02);
      rows.push({ g, slip: Math.round(s.slip * 100), v: Math.round(Math.abs(s.v)), rpm: Math.round(s.engineRpm) });
    }
    ui.scan = rows; ui.diag.observed = ui.diag.observed || {};
    const i = ui.diag.sc ? ui.diag.sc.observe.findIndex((o) => o.act === 'bvaScan') : -1; if (i >= 0) ui.diag.observed[i] = true;
    ui.renderDiag(); ui.coach();
    const bad = rows.filter((r) => r.slip > 25).map((r) => (r.g === 'R' ? 'AR' : r.g));
    ui.toast(bad.length ? `Essai des rapports : patinage sur ${bad.join(', ')}` : 'Essai des rapports : aucun patinage', 5000);
  };
  ui.scanHtml = () => {
    if (!ui.scan) return '';
    return `<div class="scan"><b>Essai des rapports</b> (accélération, boîte chaude, simulé)<table><thead><tr><th>Rapport</th><th>Patinage</th><th>Vitesse</th><th>Régime</th></tr></thead><tbody>${ui.scan.map((r) => `<tr class="${r.slip > 25 ? 'bad' : 'ok'}"><th>${r.g === 'R' ? 'AR' : r.g}</th><td>${r.slip} %</td><td>${r.v} km/h</td><td>${r.rpm}</td></tr>`).join('')}</tbody></table><p class="hint nm">Un rapport qui patine = au moins un de ses 2 éléments est en cause. Cherchez l'élément commun aux rapports en rouge.</p></div>`;
  };

  /* =================================================================== changement de module */
  ui.onModule = () => {
    const m = app.module, bvm = m.id === 'bvm';
    $$('.mod1only').forEach((e) => e.classList.toggle('hidden', !bvm));
    $('#gateWrap').classList.toggle('hidden', !bvm);
    const gb = $('#gearBtns');
    gb.classList.toggle('hidden', bvm);
    gb.innerHTML = bvm ? '' : m.gearList.map((g) => `<button class="btn" data-g="${g}">${g === 'R' ? 'AR' : g}</button>`).join('');
    $$('button', gb).forEach((b) => b.addEventListener('click', () => ui.requestGear(/^[PRND]$/.test(b.dataset.g) ? b.dataset.g : +b.dataset.g)));
    $$('.mod2only').forEach((e) => e.classList.toggle('hidden', m.id !== 'bva'));
    ui.renderBvaTable(); ui.setBrake(false);
    const bus = m.id === 'bva'; rpm.min = bus ? 600 : 800; rpm.max = bus ? 2400 : 6500; rpm.step = bus ? 20 : 50;
    if (bus) { ui.setEngine(true); ui.setRetarder(0); $('#wkMode').value = 'auto'; $('#aisMode').value = 'on'; }
    $('#tabHydro').classList.toggle('hidden', !bus); ui.hydro = null; $('#paneHydro').innerHTML = '';
    if (ui.lessonModule) ui.lessonModule(bus);
    $('#secLoupe').classList.toggle('hidden', !bvm);
    $('#btnClutch').closest('.row').classList.toggle('hidden', !bvm);          // pas de pédale sur BVA / DCT
    $('#rpm').value = m.sim.engineRpm; $('#rpmVal').textContent = `${m.sim.engineRpm} tr/min`;
    $$('input[name=load]').forEach((r) => { r.checked = r.value === m.sim.load; });
    ui.toggleClutch(m.sim.clutchPedal);
    ui.resetExplode();
    $('#timeScale').value = String(m.sim.timeScale);
    $('#btnAxial').textContent = '✂ Coupe axiale en 1 clic';
    ui.buildTelemetry();
    ui.diag = newDiag(); ui.setPick(false); ui.setScalpel(false);
    ui.hideStack = []; ui.open = new Set(); ui.query = ''; $('#partSearch').value = ''; ui.lastMeasure = null;
    ui.scan = null; const hg = $('#hintGear'); if (hg) hg.classList.toggle('hidden', m.id === 'bva');
    app.alerts = new Set();
    app.hidden = new Set(); app.dim = new Set(); app.solo = null; app.activeGroup = null;
    ui.updateGroupBar();
    ui.renderTree(); ui.renderDiag(); ui.renderPart(app.selected);
    ui.showTab('tools');
  };

  initLesson(app, ui);
  return ui;
}
