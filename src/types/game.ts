import { EffectInstance } from "@/content/modules/effects";
import { ActiveMod } from "@/content/modules/mods";

export enum CardType {
  MELEE = 'melee',
  ATTACK = 'attack',
  SKILL = 'skill',
  POWER = 'power',
  CURSE = 'curse',
  RANGED = 'ranged',
  MINION = 'minion',
  VOLATILE = 'volatile',
  DEFENSE = 'defense',
  SPELL = 'spell',
}

export enum TriggerPhase {
  BATTLEBEGIN = 'battleBegin',
  BEFOREDRAW = 'beforeDraw',
  STARTOFTURN = 'startOfTurn',
  ONCARDRAW = 'onCardDraw',
  ONCARDPLAY = 'onCardPlay',
  ONDAMAGEDEALING = 'onDamageDealing',
  ONDAMAGEINCOMING = 'onDamageIncoming',
  ONTARGET = 'onTargetSelected',
  ENDOFTURN = 'endOfTurn'
};

export enum DrawModType {
  ADD = 'add',
  SUBTRACT = 'subtract',
  SET = 'set',
}

export enum PlayerClass {
  WARRIOR = 'warrior',
  ROGUE = 'rogue',
  WIZARD = 'wizard',
}

export enum OpponentType {
  BEAST = 'beast',
  MONSTER = 'monster',
  GOBLIN = 'goblin',
  UNDEAD = 'undead',
  WARRIOR = 'warrior',
  ROGUE = 'rogue',
  WIZARD = 'wizard',
}

export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  SPECIAL = 'special',
}

export interface Card {
  id: string;
  name: string;
  description: string;
  cost: number;
  attack?: number;
  defense?: number;
  effects?: EffectInstance[]; 
  related_cards?: Card[];
  class: PlayerClass | OpponentType;
  rarity: Rarity;
  types?: CardType[];
  unplayable?: boolean;
}

export interface Passive {
  id: string;
  name: string;
  description?: string;
  effects: EffectInstance[]; // effect-driven, con trigger opzionale
  owner?: 'player' | 'opponent'; // opzionale, solo per tooling/UX
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

export enum Difficulty {
  BASIC = 'basic',
  MEDIUM = 'medium',
  BOSS = 'boss',
}

const ORDER: Difficulty[] = [
  Difficulty.BASIC,
  Difficulty.MEDIUM,
  Difficulty.BOSS,
];

export namespace Difficulty {
  export function next(d: Difficulty): Difficulty | null {
    const i = ORDER.indexOf(d);
    return ORDER[i + 1] ?? null; // or ORDER[0] for wrap-around
  }
}

export interface Opponent {
  id: string;
  name: string;
  type: OpponentType;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  portrait: string;
  deck: Deck;
  cardsDrawn: number;
  difficulty: Difficulty;
  passives?: Passive[];
}

export enum GamePhase {
  STARTING_SPLASH = 'starting-splash',
  CLASS_SELECTION = 'class-selection',
  BATTLE = 'battle',
  CARD_SELECTION = 'card-selection',
  PASSIVE_SELECTION = 'passive-selection',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
}

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

export interface DrawModification {
  type: DrawModType;
  value: number;
  source: string; // Card name or effect source
  duration: number; // Number of turns this effect lasts (0 = permanent for this battle)
}

export enum Turn {
  PLAYER = 'player',
  OPPONENT = 'opponent',
}

export interface BattleState {
  playerHand: Card[];
  playerEnergy: number;
  opponentEnergy: number;
  opponentHand: Card[];
  turn: Turn;
  playerPlayedCards: Card[];
  opponentPlayedCards: Card[];
  playerDiscardPile: Card[];
  opponentDiscardPile: Card[];
  playerDeck: Deck;
  opponentDeck: Deck;
  playerBlock: number;
  opponentBlock: number;
  playerMods: ActiveMod[];
  opponentMods: ActiveMod[];  
  playerPersistentBlock: boolean;
  playerDrawModifications: DrawModification[];
  opponentDrawModifications: DrawModification[];
  battleLog: string[];
}

export interface PlayerClassData {
  id: PlayerClass;
  name: string;
  portrait: string;
  icon: React.ComponentType<any>;
  description: string;
  startingDeck: string[];
  health: number;
  energy: number;
  available: boolean;
}

export enum IntentType {
  ATTACK = 'attack',
  BLOCK = 'block',
  BUFF = 'buff',
  DEBUFF = 'debuff',
}

export interface Intent {
  type: IntentType;
  value: number;
  description: string;
}

export interface CardChoice {
  card: Card;
  replaceCardId: string;
}