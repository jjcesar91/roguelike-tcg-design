export interface Card {
  id: string;
  name: string;
  description: string;
  cost: number;
  attack?: number;
  defense?: number;
  effect?: string;
  class: PlayerClass | OpponentType;
  rarity: 'common' | 'rare' | 'epic';
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  class: PlayerClass;
  effect: string;
}

export interface Deck {
  cards: Card[];
  discardPile: Card[];
}

export interface Player {
  class: PlayerClass;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  deck: Deck;
  passives: Passive[];
  level: number;
}

export interface Opponent {
  id: string;
  name: string;
  type: OpponentType;
  health: number;
  maxHealth: number;
  deck: Deck;
  difficulty: 'basic' | 'medium' | 'boss';
}

export interface GameState {
  player: Player | null;
  currentOpponent: Opponent | null;
  gamePhase: 'class-selection' | 'battle' | 'card-selection' | 'passive-selection' | 'victory' | 'defeat';
  availableCards: Card[];
  availablePassives: Passive[];
  battleState: BattleState | null;
}

export interface StatusEffect {
  type: 'weak' | 'vulnerable' | 'strength' | 'dexterity';
  value: number;
  duration: number;
}

export interface BattleState {
  playerHand: Card[];
  playerEnergy: number;
  opponentHand: Card[];
  turn: 'player' | 'opponent';
  playerPlayedCards: Card[];
  opponentPlayedCards: Card[];
  playerDiscardPile: Card[];
  opponentDiscardPile: Card[];
  playerDeck: Deck;
  opponentDeck: Deck;
  playerBlock: number;
  opponentBlock: number;
  playerStatusEffects: StatusEffect[];
  opponentStatusEffects: StatusEffect[];
  playerPersistentBlock: boolean;
  battleLog: string[];
}

export type PlayerClass = 'warrior' | 'rogue' | 'wizard';
export type OpponentType = 'beast' | 'monster' | 'undead' | 'warrior' | 'rogue' | 'wizard';

export interface CardChoice {
  card: Card;
  replaceCardId: string;
}