/* ============================================================================
 * __FILE__Sim.js — MOTEUR PHYSIQUE de « __TITLE__ »
 *  Contrat attendu par main.js / ui.js :
 *    update(dt)   avance la simulation (dt déjà multiplié par timeScale par main.js)
 *    events[]     messages poussés vers l'UI : { type:'refus'|'slip'|'shift-start', msg? }
 *    timeScale    facteur de ralenti (1 = temps réel)
 *    explain()    { chips:[[libellé, actif?]], text:'HTML' }  → bandeau « chemin du couple / du flux »
 *    flow()       { level 0..1 }  intensité du flux principal (coloration SSP)
 *    tele()       [[libellé, valeur, unité], …]  cartes de télémétrie (les 5 premières visibles, les suivantes en « + mesures »)
 *    ang{}        angles intégrés (rad) lus par pose() du module 3D
 *  RÈGLE : aucune valeur « magique » dupliquée — les nombres (dents, surfaces, pressions) vivent dans UNE table exportée.
 * ========================================================================== */
export const ELEMENTS = ['a', 'b'];                         // TODO : éléments commandés (embrayages, freins, vannes, pistons…)
export const TABLE = { N: [], 1: ['a'], 2: ['b'] };         // TODO : état → éléments appliqués (tableau d'engagement)
export const RATIO = { 1: 3.0, 2: 1.5 };                    // TODO : rapports CALCULÉS depuis la géométrie, pas saisis

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const TAU = Math.PI * 2;

export class __CLASS__Sim {
  constructor() { this.reset(); }
  reset() {
    this.gear = 'N'; this.engineOn = true; this.engineRpm = 800; this.load = 'accel'; this.brake = false;
    this.timeScale = 1; this.events = [];
    this.cmd = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));       // commande calculateur (0/1)
    this.lv = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));        // niveau de serrage réel (0..1)
    this.slipEl = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));    // patinage (0..1)
    this.p = { main: 10 };                                             // pressions (bar)
    this.oilT = 70; this.v = 0; this.n = { in: 0, out: 0 };           // régimes (tr/min)
    this.ang = { in: 0, out: 0 };                                      // angles pour l'animation
    this.faults = {};                                                  // PANNES = paramètres de la sim, jamais des cas spéciaux du rendu
  }

  /* ---------------- pilotage ---------------- */
  say(msg) { this.events.push({ type: 'refus', msg }); return false; }
  requestGear(g) {
    if (!(g in TABLE)) return this.say(`État « ${g} » inconnu.`);
    this.gear = g; return true;                                        // TODO : machine à états (remplissage → transfert → inertie)
  }
  forceGear(g, rpm) {                                                  // placement instantané (démos, essais, tests)
    this.gear = g; this.engineRpm = rpm; this.engineOn = true; this.brake = false;
    for (const e of ELEMENTS) { const on = (TABLE[g] || []).includes(e); this.lv[e] = this.cmd[e] = on ? 1 : 0; }
    this.update(0); this.events.length = 0;
  }

  /* ---------------- dynamique ---------------- */
  update(dt) {
    const run = this.engineOn && this.engineRpm > 250;
    this.p.main = run ? 10 + 0.4 * clamp((this.engineRpm - 650) / 1500, 0, 1) : Math.max(0, this.p.main - 3 * dt);
    for (const e of ELEMENTS) {
      this.cmd[e] = run && (TABLE[this.gear] || []).includes(e) ? 1 : 0;
      this.lv[e] += clamp(this.cmd[e] - this.lv[e], -3 * dt, 3 * dt);   // remplissage progressif du piston
    }
    const i = RATIO[this.gear] || 0;
    this.n.in = run ? this.engineRpm : 0;
    this.n.out = i && this.lv[(TABLE[this.gear] || [])[0]] > 0.95 ? this.n.in / i : 0;
    this.ang.in += (this.n.in * TAU / 60) * dt * 0.05;                 // rotation ralentie (stroboscopie) — les RAPPORTS restent exacts
    this.ang.out += (this.n.out * TAU / 60) * dt * 0.05;
  }

  /* ---------------- pédagogie ---------------- */
  explain() {
    const on = (TABLE[this.gear] || []).length > 0;
    return { chips: [['Entrée', this.n.in > 20], ['Éléments serrés', on], ['Sortie', this.n.out > 20]],
      text: on ? `<b>État ${this.gear}</b> : éléments ${(TABLE[this.gear] || []).join(' + ').toUpperCase()} serrés.` : '<b>Point mort</b> : aucun élément serré, rien n\'est transmis.' };
  }
  flow() { return { level: clamp(Math.abs(this.n.out) / 1500, 0, 1) }; }
  tele() {
    return [
      ['Régime entrée', Math.round(this.n.in), 'tr/min'],
      ['État', this.gear, ''],
      ['Régime sortie', Math.round(this.n.out), 'tr/min'],
      ['Pression', this.p.main.toFixed(1).replace('.', ','), 'bar'],
      ['Température huile', Math.round(this.oilT), '°C'],
      ['Rapport i', RATIO[this.gear] ? RATIO[this.gear].toFixed(2).replace('.', ',') : '—', ''],     // cartes suivantes = « + mesures »
    ];
  }
}
