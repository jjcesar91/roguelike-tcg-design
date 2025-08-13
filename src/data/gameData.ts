import { playerClasses, playerCards, opponentCards, passives, opponentPassives, opponents } from '@/content';

// Re-export core game data definitions.  Definitions are now sourced from
// src/content/modules so that all base and custom content live in one place.
export { playerClasses, playerCards, opponentCards, passives, opponentPassives, opponents };

// Extension helper functions.  These functions are retained to preserve
// backwards compatibility with existing code that expects helper functions.
// They simply return the imported definitions without merging extras, since
// core and extra content are unified in the modules themselves.
export const getAllPlayerClasses = () => playerClasses;
export const getAllPlayerCards = () => playerCards;
export const getAllOpponents = () => opponents;
export const getAllPassives = () => passives;