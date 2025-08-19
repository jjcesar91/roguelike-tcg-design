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

export enum ModType {
  BLEEDING = 'bleeding',
  DEXTERITY = 'dexterity',
  EVASIVE = 'evasive',
  STRENGTH = 'strength',
  VULNERABLE = 'vulnerable',
  WEAK = 'weak',
  HANDHEX = 'handhex'
}

export const MOD_DEFS: Record<ModType, {
  maxStacks: number;
  defaultDuration: number;   // applyMod can use this if caller omits duration
  stackMode: 'add' | 'replace'; // how stacks behave on reapply
}> = {
  [ModType.BLEEDING]:  { maxStacks: 5, defaultDuration: 2, stackMode: 'add' },
  [ModType.EVASIVE]:   { maxStacks: 3, defaultDuration: 2, stackMode: 'add' },
  [ModType.WEAK]:      { maxStacks: 1, defaultDuration: 2, stackMode: 'replace' },
  [ModType.VULNERABLE]:{ maxStacks: 1, defaultDuration: 2, stackMode: 'replace' },
  [ModType.STRENGTH]:  { maxStacks: 99, defaultDuration: 2, stackMode: 'add' },
  [ModType.DEXTERITY]: { maxStacks: 99, defaultDuration: 2, stackMode: 'add' },
  [ModType.HANDHEX]:   { maxStacks: 99, defaultDuration: 1, stackMode: 'add' },
};

export enum TriggerPhase {
  BEFOREDRAW = 'beforeDraw',
  STARTOFTURN = 'startOfTurn',
  ONCARDRAW = 'onCardDraw',
  ONCARDPLAY = 'onCardPlay',
  ONTARGET = 'onTargetSelected',
  ENDOFTURN = 'endOfTurn'
};

export enum EffectCode {
  // ---- Card / general effects ----
  add_card_to_opp_pile = 'add_card_to_opp_pile',
  add_card_to_self_pile = 'add_card_to_self_pile',
  apply_mod = 'apply_mod',
  /** @deprecated legacy alias; use apply_mod */
  apply_status = 'apply_status',
  remove_mod = 'remove_mod',
  deal_damage = 'deal_damage',
  damage_status_mod = 'damage_status_mod',
  draw_mod = 'draw_mod',

  // ---- Passive-related effects ----
  damage_bonus_low_health = 'damage_bonus_low_health',
  block_bonus_flat = 'block_bonus_flat',
  cost_mod = 'cost_mod',
  mod_duration_bonus = 'mod_duration_bonus',
  gain_energy = 'gain_energy',
  first_card_free = 'first_card_free',
  damage_bonus_by_type = 'damage_bonus_by_type',
  set_turn_energy = 'set_turn_energy',
  every_third_type_free = 'every_third_type_free',
  ambush = 'ambush',
  add_card_to_hand = 'add_card_to_hand',
}

export interface EffectInstance {
  code: EffectCode;
  params?: any; 
  trigger?: TriggerPhase;
}

export interface EffectContext {
  sourceCard: Card;
  side: 'player' | 'opponent'; 
  player: Player;
  opponent: Opponent;
  state: BattleState;
  log: string[];
}

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

export interface Opponent {
  id: string;
  name: string;
  type: OpponentType;
  health: number;
  maxHealth: number;
  portrait: string;
  deck: Deck;
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

export type StatusEffect = ActiveMod;
export interface ActiveMod {
  type: ModType;         // e.g., BLEEDING, EVASIVE, HANDHEX, …
  stacks: number;        // how many stacks (always clamped by MOD_DEFS.maxStacks)
  duration: number;      // remaining turns (always decremented by a single tick fn)
  effects?: EffectInstance[]; // optional phase-bound effects (e.g., “deal bleed dmg on start”)
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
  startingCards: string[];
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