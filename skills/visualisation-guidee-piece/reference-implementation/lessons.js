/* ============================================================================
 * lessons.js — REGISTRE des parcours guidés : un par module (clé = id du module).
 *   steps : tableau d'étapes   auto : scénario de la démonstration automatique   reset : remise à zéro avant chaque étape
 * Pour ajouter une pièce / un ensemble : créer js/lesson<Nom>.js (voir skills/visualisation-guidee-piece) puis l'inscrire ici.
 * ========================================================================== */
import { LESSON as ECO_STEPS, AUTO as ECO_AUTO, resetEco } from './lessonEco.js';

export const LESSONS = {
  bva: { steps: ECO_STEPS, auto: ECO_AUTO, reset: resetEco },
};
