/* ============================================================================
 * lessonUI.js — Contrôleur du parcours guidé (carte « Étape n / N » dans le panneau gauche)
 *   - applique l'état de simulation, la vue caméra, l'onglet et la mise en évidence de chaque étape
 *   - boutons d'action, mini-question avec correction, mesures en direct, navigation
 * ========================================================================== */
import { LESSONS } from './lessons.js';

const $ = (s, r = document) => r.querySelector(s);

export function initLesson(app, ui) {
  const cur = () => LESSONS[app.module.id];           // leçon du module affiché (ou undefined)
  const steps = () => cur().steps, autoOf = (i) => (cur().auto || {})[i] || [];
  const card = $('#lesson'), launcher = $('#btnLesson');
  const st = { on: false, i: 0, answered: {}, auto: false, timers: [] };
  app.lessonFocus = new Set();

  const render = () => {
    const s = steps()[st.i], n = steps().length;
    $('#lsStep').textContent = `Étape ${st.i + 1} / ${n}`;
    $('#lsProg').style.width = `${((st.i + 1) / n) * 100}%`;
    $('#lsTitle').textContent = s.t;
    $('#lsText').innerHTML = s.text;
    $('#lsLook').innerHTML = (s.look || []).map((x) => `<li>${x}</li>`).join('');
    $('#lsLookWrap').classList.toggle('hidden', !(s.look && s.look.length));
    const acts = $('#lsActs'); acts.innerHTML = '';
    (s.acts || []).forEach((a) => {
      const b = document.createElement('button'); b.className = 'btn small primary'; b.textContent = a.label;
      b.addEventListener('click', () => a.run({ sim: app.module.sim, ui, app }));
      acts.appendChild(b);
    });
    acts.classList.toggle('hidden', !(s.acts && s.acts.length));
    /* mini-question */
    const qz = $('#lsQuiz'); qz.innerHTML = '';
    if (s.quiz) {
      const q = s.quiz, done = st.answered[st.i];
      qz.innerHTML = `<div class="ls-q"><b>🧠 ${q.q}</b></div>`;
      const opts = document.createElement('div'); opts.className = 'ls-opts';
      q.opts.forEach((o, k) => {
        const b = document.createElement('button'); b.className = 'btn small ls-opt'; b.textContent = o;
        if (done !== undefined) { b.disabled = true; if (k === q.ok) b.classList.add('good'); else if (k === done) b.classList.add('bad'); }
        b.addEventListener('click', () => { st.answered[st.i] = k; render(); });
        opts.appendChild(b);
      });
      qz.appendChild(opts);
      if (done !== undefined) qz.insertAdjacentHTML('beforeend', `<p class="ls-why ${done === q.ok ? 'good' : 'bad'}">${done === q.ok ? '✔ Bravo. ' : '✘ Pas tout à fait. '}${q.why}</p>`);
    }
    $('#lsDeep').classList.toggle('hidden', !s.deep);
    $('#lsDeepBody').innerHTML = s.deep || '';
    $('#lsNote').innerHTML = s.note || ''; $('#lsNote').classList.toggle('hidden', !s.note);
    $('#lsPrev').disabled = st.i === 0;
    $('#lsNext').textContent = st.i === n - 1 ? '↺ Recommencer' : 'Suivant →';
    $('#lsFinal').classList.toggle('hidden', !s.final);
    live(app.module.sim);
  };

  /** Applique l'état de simulation + caméra + onglet + pièces en évidence */
  const apply = () => {
    const s = steps()[st.i], sim = app.module.sim;
    cur().reset?.({ sim, ui, app });
    s.setup({ sim, ui, app });
    if (s.ts) app.setTimeScale(s.ts);
    app.lessonFocus = new Set(s.focus || []);
    app.flyToView(s.view || 'global');
    if (s.tab) ui.showTab(s.tab);
    render();
    card.scrollIntoView({ block: 'nearest' });
  };

  const live = (sim) => {
    if (!st.on) return;
    const s = steps()[st.i]; if (!s.live) return;
    $('#lsLive').innerHTML = s.live(sim).map(([l, v, u, c]) => `<div class="lsm ${c || ''}"><small>${l}</small><b>${v}</b>${u ? `<em>${u}</em>` : ''}</div>`).join('');
  };
  ui.lessonUpdate = live;

  const start = () => {
    if (!cur()) return;
    st.on = true; st.i = 0; st.answered = {};
    card.classList.remove('hidden'); launcher.classList.add('hidden'); $('#btnAutoLesson').classList.add('hidden');
    ui.clearIsolation?.();
    apply();
  };
  const stop = () => {
    stopAuto(); st.on = false; app.lessonFocus = new Set(); card.classList.add('hidden');
    if (cur()) { launcher.classList.remove('hidden'); $('#btnAutoLesson').classList.remove('hidden'); }
    const sim = app.module.sim; app.setTimeScale(1); if (sim.engineOn === false) ui.setEngine(true);
    ui.setRetarder(0); ui.setBrake(false);
  };
  ui.lessonStop = stop;
  ui.lessonActive = () => st.on;


  /* ------------------------------------------------------------ démonstration automatique */
  const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const clearTimers = () => { st.timers.forEach(clearTimeout); st.timers = []; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* voix indisponible */ } const t = $('#lsTimer'); if (t) { t.style.transition = 'none'; t.style.width = '0%'; } };
  const setPlayUi = () => { $('#lsPlay').textContent = st.auto ? '⏸ Pause' : '▶ Lecture auto'; $('#lsTimerWrap').classList.toggle('hidden', !st.auto); };
  const stopAuto = () => { st.auto = false; clearTimers(); setPlayUi(); };
  /** Durée minimale d'affichage d'une étape : temps de lecture du texte, ou dernière action + 6 s */
  const dwell = (i) => {
    const s = steps()[i], words = plain(s.text + ' ' + (s.look || []).join(' ')).split(' ').length;
    const acts = autoOf(i), last = acts.length ? acts[acts.length - 1].t + 6000 : 0;
    return Math.max(9000, words * 330, last);
  };
  const playStep = () => {
    if (!st.auto) return;
    clearTimers();
    const i = st.i, s = steps()[i], ms = dwell(i);
    autoOf(i).forEach((a) => st.timers.push(setTimeout(() => a.run({ sim: app.module.sim, ui, app }), a.t)));
    if (s.quiz) st.timers.push(setTimeout(() => { st.answered[i] = s.quiz.ok; render(); }, Math.min(ms * 0.75, ms - 2500)));   // la bonne réponse s'affiche en fin d'étape
    const t = $('#lsTimer'); if (t) { t.style.transition = 'none'; t.style.width = '0%'; void t.offsetWidth; t.style.transition = `width ${ms}ms linear`; t.style.width = '100%'; }
    let voiceDone = true;
    if ($('#lsVoice').checked && 'speechSynthesis' in window) {
      voiceDone = false;
      const u = new SpeechSynthesisUtterance(`${s.t}. ${plain(s.text)}`); u.lang = 'fr-FR'; u.rate = 0.95;
      u.onend = () => { voiceDone = true; tryNext(); }; u.onerror = () => { voiceDone = true; tryNext(); };
      window.speechSynthesis.speak(u);
    }
    let timeDone = false;
    const tryNext = () => { if (!st.auto || !timeDone || !voiceDone) return; next(); };
    st.timers.push(setTimeout(() => { timeDone = true; tryNext(); }, ms));
  };
  const next = () => {
    if (st.i < steps().length - 1) { st.i++; apply(); playStep(); }
    else { stopAuto(); }        // fin du parcours : on s'arrête sur le bilan
  };
  const startAuto = () => { st.auto = true; setPlayUi(); playStep(); };
  $('#lsPlay').addEventListener('click', () => { if (st.auto) stopAuto(); else startAuto(); });
  $('#btnAutoLesson').addEventListener('click', () => { start(); startAuto(); });

  launcher.addEventListener('click', start);
  $('#lsClose').addEventListener('click', stop);
  $('#lsPrev').addEventListener('click', () => { stopAuto(); if (st.i > 0) { st.i--; apply(); } });
  $('#lsNext').addEventListener('click', () => { stopAuto(); if (st.i < steps().length - 1) { st.i++; apply(); } else { st.i = 0; st.answered = {}; apply(); } });
  $('#lsToDiag')?.addEventListener('click', () => { stop(); ui.showTab('diag'); });
  /* navigation clavier : flèches quand le focus n'est pas dans un champ */
  window.addEventListener('keydown', (e) => {
    if (!st.on || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && st.i < steps().length - 1) { stopAuto(); st.i++; apply(); } else if (e.key === 'ArrowLeft' && st.i > 0) { stopAuto(); st.i--; apply(); }
  });
  /** À appeler quand on change de module : quitte la leçon et montre/masque le lanceur */
  ui.lessonModule = () => {
    const has = !!cur();
    if (st.on) { stopAuto(); st.on = false; app.lessonFocus = new Set(); card.classList.add('hidden'); }
    launcher.classList.toggle('hidden', !has); $('#btnAutoLesson').classList.toggle('hidden', !has);
    if (has) { const sm = launcher.querySelector('small'); if (sm) sm.textContent = `${steps().length} étapes · questions · simulation animée`; }
  };
}
