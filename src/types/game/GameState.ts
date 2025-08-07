export interface GameState {
  player: Player | null;
  currentOpponent: Opponent | null;
  gamePhase: GamePhase;
  availableCards: Card[];
  availablePassives: Passive[];
  battleState: BattleState | null;
}

export type GamePhase = 
  | 'class-selection'
  | 'battle'
  | 'card-selection'
  | 'passive-selection'
  | 'victory'
  | 'defeat';

export interface Player {
  class: PlayerClass;
  level: number;
  health: number;
  maxHealth: number;
  deck: Deck;
  passives: Passive[];
}

export interface Opponent {
  name: string;
  health: number;
  maxHealth: number;
  difficulty: 'basic' | 'medium' | 'boss';
  intent: Intent[];
}

export interface BattleState {
  turn: 'player' | 'opponent';
  playerHealth: number;
  playerMaxHealth: number;
  playerBlock: number;
  playerEnergy: number;
  playerHand: Card[];
  playerDeck: Deck;
  playerDiscardPile: Card[];
  playerStatusEffects: StatusEffect[];
  opponentHealth: number;
  opponentMaxHealth: number;
  opponentBlock: number;
  opponentStatusEffects: StatusEffect[];
  battleLog: string[];
}

export interface Deck {
  cards: Card[];
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  description: string;
  effect: string;
  types: CardType[];
  rarity: 'common' | 'rare';
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  class: string;
}

export interface StatusEffect {
  type: 'weak' | 'vulnerable' | 'strength' | 'dexterity';
  value: number;
  duration: number;
}

export interface Intent {
  type: 'attack' | 'block' | 'buff' | 'debuff';
  value: number;
  description: string;
}

export type PlayerClass = 'warrior' | 'rogue' | 'wizard';

export type CardType = 'MELEE' | 'ATTACK' | 'SKILL' | 'POWER' | 'CURSE';