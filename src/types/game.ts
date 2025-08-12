export enum CardType {
  MELEE = 'melee',
  ATTACK = 'attack',
  SKILL = 'skill',
  POWER = 'power',
  CURSE = 'curse',
  MINION = 'minion',
  VOLATILE = 'volatile'
}

export interface Card {
  id: string;
  name: string;
  description: string;
  cost: number;
  attack?: number;
  defense?: number;
  effect?: string;
  class: PlayerClass | OpponentType;
  rarity: 'common' | 'rare' | 'epic' | 'special';
  types?: CardType[];
  unplayable?: boolean;
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  class: PlayerClass;
  effect: string;
}

export interface OpponentPassive {
  id: string;
  name: string;
  description: string;
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
  portrait: string;
  deck: Deck;
  difficulty: 'basic' | 'medium' | 'boss';
  passive?: OpponentPassive;
}

export type GamePhase = 
  | 'starting-splash'
  | 'class-selection'
  | 'battle'
  | 'card-selection'
  | 'passive-selection'
  | 'victory'
  | 'defeat';

export interface GameState {
  player: Player | null;
  currentOpponent: Opponent | null;
  gamePhase: GamePhase;
  availableCards: Card[];
  availablePassives: Passive[];
  battleState: BattleState | null;
  opponentCardPreview: {
    card: Card | null;
    isVisible: boolean;
  };
}

export interface StatusEffect {
  type: 'weak' | 'vulnerable' | 'strength' | 'dexterity' | 'bleeding' | 'evasive';
  value: number;
  duration: number;
}

export interface DrawModification {
  type: 'add' | 'subtract' | 'set';
  value: number;
  source: string; // Card name or effect source
  duration: number; // Number of turns this effect lasts (0 = permanent for this battle)
}

export interface BattleState {
  playerHand: Card[];
  playerEnergy: number;
  opponentEnergy: number;
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
  playerDrawModifications: DrawModification[];
  opponentDrawModifications: DrawModification[];
  battleLog: string[];
}

export type PlayerClass = 'warrior' | 'rogue' | 'wizard';
export type OpponentType = 'beast' | 'monster' | 'undead' | 'warrior' | 'rogue' | 'wizard';

export interface PlayerClassData {
  id: PlayerClass;
  name: string;
  portrait: string;
  icon: React.ComponentType<any>;
  description: string;
  startingCards: string[];
  health: number;
  energy: number;
  available: boolean;
}

export interface Intent {
  type: 'attack' | 'block' | 'buff' | 'debuff';
  value: number;
  description: string;
}

export interface CardChoice {
  card: Card;
  replaceCardId: string;
}