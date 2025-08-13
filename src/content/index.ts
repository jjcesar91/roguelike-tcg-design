// Drop-in extension registry. Re-export definitions and extension arrays from your modules here.
// Core definitions
export { playerClasses } from './modules/classes';
export { playerCards, opponentCards } from './modules/cards';
export { passives, opponentPassives } from './modules/passives';
export { opponents } from './modules/opponents';
// Legacy extension arrays retained for backwards compatibility.  These are
// empty by default but allow external modules to push new entries.
export { extraCards } from './modules/cards';
export { extraOpponents } from './modules/opponents';
export { extraPassives } from './modules/passives';
export { extraClasses } from './modules/classes';
