/* ============================================================================
 * audio.js — Son d'atelier synthétisé (Web Audio) : moteur, roulement HS, craquement de synchro
 * Activé uniquement sur action de l'utilisateur (politique d'autoplay des navigateurs).
 * ========================================================================== */
export class WorkshopAudio {
  constructor() { this.ctx = null; this.on = false; }

  enable() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.5; this.master.connect(c.destination);
      // moteur : dent de scie filtrée
      this.eng = c.createOscillator(); this.eng.type = 'sawtooth';
      this.engF = c.createBiquadFilter(); this.engF.type = 'lowpass'; this.engF.frequency.value = 400;
      this.engG = c.createGain(); this.engG.gain.value = 0.0;
      this.eng.connect(this.engF).connect(this.engG).connect(this.master); this.eng.start();
      // roulement : sinus aigu modulé
      this.whine = c.createOscillator(); this.whine.type = 'triangle';
      this.whineG = c.createGain(); this.whineG.gain.value = 0;
      this.whine.connect(this.whineG).connect(this.master); this.whine.start();
      // bruit blanc (craquement)
      const len = c.sampleRate * 1.0, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    this.ctx.resume();
    this.on = true;
    return true;
  }
  disable() { this.on = false; if (this.ctx) { this.engG.gain.value = 0; this.whineG.gain.value = 0; } }

  burst(freq, dur, gain, type = 'bandpass') {
    if (!this.on) return;
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 1.2;
    const g = c.createGain(); g.gain.setValueAtTime(gain, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(f).connect(g).connect(this.master); src.start(); src.stop(c.currentTime + dur);
  }

  update(sim) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.eng.frequency.setTargetAtTime(Math.max(25, sim.engineRpm / 60 * 2), t, 0.05);
    this.engF.frequency.setTargetAtTime(250 + sim.engineRpm * 0.12, t, 0.05);
    this.engG.gain.setTargetAtTime(0.045 + (sim.engineRpm / 6500) * 0.05, t, 0.1);
    const b = sim.noise ? sim.noise.bearing : 0;
    this.whine.frequency.setTargetAtTime(520 + Math.abs(sim.nP || 0) * 0.45, t, 0.08);
    this.whineG.gain.setTargetAtTime(b * 0.06, t, 0.08);
    for (const e of sim.events || []) {
      if (e.type === 'crunch') { this.burst(1800, 0.7, 0.9); this.burst(700, 0.5, 0.7); }
      if (e.type === 'engaged') this.burst(200, 0.12, 0.5, 'lowpass');
      if (e.type === 'jump') this.burst(300, 0.18, 0.7, 'lowpass');
    }
  }
}
