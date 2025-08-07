export const GAME_PHASES = {
  CLASS_SELECTION: 'class-selection' as const,
  BATTLE: 'battle' as const,
  CARD_SELECTION: 'card-selection' as const,
  PASSIVE_SELECTION: 'passive-selection' as const,
  VICTORY: 'victory' as const,
  DEFEAT: 'defeat' as const,
} as const;

export const PLAYER_CLASSES = {
  WARRIOR: 'warrior' as const,
  ROGUE: 'rogue' as const,
  WIZARD: 'wizard' as const,
} as const;

export const DIFFICULTY_LEVELS = {
  BASIC: 'basic' as const,
  MEDIUM: 'medium' as const,
  BOSS: 'boss' as const,
} as const;