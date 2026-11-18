/* ============================================================================
 * lessonUI.js — Contrôleur du parcours guidé (carte « Étape n / N » dans le panneau gauche)
 *   - applique l'état de simulation, la vue caméra, l'onglet et la mise en évidence de chaque étape
 *   - boutons d'action, mini-question avec correction, mesures en direct, navigation
 * ========================================================================== */
import { LESSON } from './lessonEco.js';

const $ = (s, r = document) => r.querySelector(s);

export function initLesson(app, ui) {
  const card = $('#lesson'), launcher = $('#btnLesson');
  const st = { on: false, i: 0, answered: {} };
  app.lessonFocus = new Set();

  /** Remet les commandes dans un état neutre avant d'appliquer l'étape */
  const base = () => {
    const sim = app.module.sim;
    ui.setRetarder(0); sim.wkMode = 'auto'; const w = $('#wkMode'); if (w) w.value = 'auto';
    ui.setBrake(false); app.setTimeScale(1);
    sim.load = 'accel'; document.querySelectorAll('input[name=load]').forEach((r) => { r.checked = r.value === 'accel'; });
    sim.mode = 'auto';
  };

  const render = () => {
    const s = LESSON[st.i], n = LESSON.length;
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
    const s = LESSON[st.i], sim = app.module.sim;
    base();
    app.module.resetPose?.();
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
    const s = LESSON[st.i]; if (!s.live) return;
    $('#lsLive').innerHTML = s.live(sim).map(([l, v, u, c]) => `<div class="lsm ${c || ''}"><small>${l}</small><b>${v}</b>${u ? `<em>${u}</em>` : ''}</div>`).join('');
  };
  ui.lessonUpdate = live;

  const start = () => {
    if (app.module.id !== 'bva') return;
    st.on = true; st.i = 0; st.answered = {};
    card.classList.remove('hidden'); launcher.classList.add('hidden');
    ui.clearIsolation?.();
    apply();
  };
  const stop = () => {
    st.on = false; app.lessonFocus = new Set(); card.classList.add('hidden');
    if (app.module.id === 'bva') launcher.classList.remove('hidden');
    const sim = app.module.sim; app.setTimeScale(1); if (sim.engineOn === false) ui.setEngine(true);
    ui.setRetarder(0); ui.setBrake(false);
  };
  ui.lessonStop = stop;
  ui.lessonActive = () => st.on;

  launcher.addEventListener('click', start);
  $('#lsClose').addEventListener('click', stop);
  $('#lsPrev').addEventListener('click', () => { if (st.i > 0) { st.i--; apply(); } });
  $('#lsNext').addEventListener('click', () => { if (st.i < LESSON.length - 1) { st.i++; apply(); } else { st.i = 0; st.answered = {}; apply(); } });
  $('#lsToDiag')?.addEventListener('click', () => { stop(); ui.showTab('diag'); });
  /* navigation clavier : flèches quand le focus n'est pas dans un champ */
  window.addEventListener('keydown', (e) => {
    if (!st.on || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && st.i < LESSON.length - 1) { st.i++; apply(); } else if (e.key === 'ArrowLeft' && st.i > 0) { st.i--; apply(); }
  });
  /** À appeler quand on change de module : quitte la leçon et montre/masque le lanceur */
  ui.lessonModule = (isBus) => {
    if (st.on) { st.on = false; app.lessonFocus = new Set(); card.classList.add('hidden'); }
    launcher.classList.toggle('hidden', !isBus);
  };
}
