import { dbg } from '@/lib/debug';
import { BattleState, Card, CardType, Deck, DrawModification, Rarity, GameState, Turn, Opponent, Player, PlayerClass, OpponentType, DrawModType, Difficulty, TriggerPhase, Passive } from '@/types/game';
import { ActiveMod, MOD_DEFS, ModType } from "@/content/modules/mods";
import { MOD_DEFAULT_EFFECTS } from "@/content/modules/mods";
import { EffectInstance } from "@/content/modules/effects";
import { EffectCode } from "@/content/modules/effects";
import * as gameData from '@/data/gameData';
import { runCardEffects } from '@/content/modules/effects';
import { consumeModStacks } from '@/logic/core/StatusManager';


dbg('gameUtils.ts loaded');
dbg('gameData import:', gameData);
dbg('playerCards:', gameData.playerCards);
dbg('opponents:', gameData.opponents);
dbg('passives:', gameData.passives);

// Use the imported data
const playerCards = gameData.playerCards;
const opponents = gameData.opponents;
const passives = gameData.passives;

function performDraw(
  side: 'player' | 'opponent',
  state: BattleState,
  player: Player,
  opponent: Opponent,
  logSink: string[],
  opts?: { handLimit?: number }
) {
  const baseDrawCount = 3;
  const isPlayer = side === 'player';
  const mods = isPlayer ? state.playerDrawModifications : state.opponentDrawModifications;

  const cardsToDraw = calculateModifiedDrawCount(baseDrawCount, mods);
  const drawModificationLog = formatDrawModificationLog(mods, baseDrawCount);

  const deck = isPlayer ? state.playerDeck : state.opponentDeck;
  const discard = isPlayer ? state.playerDiscardPile : state.opponentDiscardPile;

  const drawResult = drawCardsWithMinionEffects(
    deck,
    discard,
    cardsToDraw,
    side,
    player.class,
    opponent.name
  );

  if (isPlayer) {
    state.playerHand = [...state.playerHand, ...drawResult.drawnCards];
    state.playerDeck = drawResult.updatedDeck;
    state.playerDiscardPile = drawResult.updatedDiscardPile;
  } else {
    state.opponentHand = [...state.opponentHand, ...drawResult.drawnCards];
    state.opponentDeck = drawResult.updatedDeck;
    state.opponentDiscardPile = drawResult.updatedDiscardPile;
  }

  if (drawModificationLog) {
    logSink.push(formatLogText(drawModificationLog, player.class, opponent.name));
  }

  // Apply Wolf minion damage if any
  if (drawResult.minionDamageLog.length > 0) {
    const wolfDamage = drawResult.minionDamageLog.length * 5;
    if (isPlayer) {
      player.health = Math.max(0, player.health - wolfDamage);
    } else {
      opponent.health = Math.max(0, opponent.health - wolfDamage);
    }
  }
  logSink.push(...drawResult.minionDamageLog);

  // Enforce hand size limit if provided
  const handLimit = opts?.handLimit;
  if (typeof handLimit === 'number') {
    const hand = isPlayer ? state.playerHand : state.opponentHand;
    if (hand.length > handLimit) {
      const excess = hand.length - handLimit;
      const overflow = hand.splice(handLimit, excess);

      // Add non-volatile cards to discard pile
      const nonVolatile = overflow.filter(card =>
        !card.types || !card.types.includes(CardType.VOLATILE)
      );
      if (isPlayer) {
        state.playerDiscardPile = [...state.playerDiscardPile, ...nonVolatile];
      } else {
        state.opponentDiscardPile = [...state.opponentDiscardPile, ...nonVolatile];
      }

      // Burn volatile cards from overflow
      const volatile = overflow.filter(card =>
        card.types && card.types.includes(CardType.VOLATILE)
      );
      if (volatile.length > 0) {
        logSink.push(formatLogText(
          `${isPlayer ? player.class : opponent.name} burned ${volatile.length} volatile card(s) from hand overflow.`,
          player.class,
          opponent.name
        ));
      }
    }
  }
}



type ModSide = 'player' | 'opponent';

function resolveModEffectParams(base: any, mod: ActiveMod, side: ModSide): any {
  if (!base) return base;
  const p = { ...base };
  if (p.amountFromModStacks) p.amount = mod.stacks;
  if (p.target === 'self') p.target = side;
  if (p.target === 'opponent') p.target = side === 'player' ? 'opponent' : 'player';
  return p;
}

function runModEffectsForPhase(
  side: ModSide,
  state: BattleState,
  player: Player,
  opponent: Opponent,
  phase: TriggerPhase,
  log: string[],
) {
  const mods: ActiveMod[] = side === 'player' ? (state.playerMods || []) : (state.opponentMods || []);
  for (const mod of mods) {
    const effects = mod.effects || [];
    for (const eff of effects) {
      if (eff.trigger !== phase) continue;
      const params = resolveModEffectParams(eff.params, mod, side);
      const pseudo: Card & { effects: EffectInstance[] } = {
        id: `mod:${mod.type}:${Date.now()}`,
        name: `[MOD] ${mod.type}`,
        description: '',
        cost: 0,
        class: player.class,
        rarity: Rarity.COMMON,
        types: [],
        effects: [ { ...eff, params } ],
      };
      runCardEffects(pseudo, { side, player, opponent, state, log }, log);
    }
  }
}

export function createDeck(cards: Card[], copies: number = 3): Deck {
  const deck: Card[] = [];
  cards.forEach(card => {
    for (let i = 0; i < copies; i++) {
      deck.push({ ...card });
    }
  });
  return {
    cards: shuffleDeck(deck),
    discardPile: []
  };
}


export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createPlayer(playerClass: PlayerClass): Player {
  dbg('Creating player for class:', playerClass);
  dbg('Available playerCards:', Object.keys(playerCards));
  dbg('playerCards[playerClass]:', playerCards[playerClass]);
  
  const classCards = playerCards[playerClass].slice(0, 3); // First 3 cards
  dbg('Class cards selected:', classCards);
  
  const deck = createDeck(classCards, 3);
  dbg('Deck created:', deck);

  return {
    class: playerClass,
    health: 50,
    maxHealth: 50,
    energy: 3,
    maxEnergy: 3,
    deck,
    passives: [],
    level: 1
  };
}

export function getRandomOpponent(difficulty: Difficulty): Opponent {
  dbg('Getting random opponent for difficulty:', difficulty);
  dbg('Available opponents:', opponents);
  const availableOpponents = opponents.filter(opp => opp.difficulty === difficulty);
  dbg('Available opponents for difficulty:', availableOpponents);
  const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
  dbg('Selected opponent:', randomOpponent);
  dbg('Opponent deck:', randomOpponent.deck);
  dbg('Opponent deck cards:', randomOpponent.deck?.cards);
  
  return {
    ...randomOpponent,
    deck: {
      cards: shuffleDeck([...randomOpponent.deck.cards]),
      discardPile: []
    }
  };
}

export function initializeBattle(player: Player, opponent: Opponent): BattleState {
  dbg('Initializing battle...');
  dbg('Player:', player);
  dbg('Player deck:', player.deck);
  dbg('Player deck cards:', player.deck?.cards);
  dbg('Opponent:', opponent);
  dbg('Opponent deck:', opponent.deck);
  dbg('Opponent deck cards:', opponent.deck?.cards);
  dbg('Opponent passives:', opponent.passives);

  // Create copies of decks for battle
  const playerDeckCopy = {
    cards: [...player.deck.cards],
    discardPile: [...player.deck.discardPile]
  };
  const opponentDeckCopy = {
    cards: [...opponent.deck.cards],
    discardPile: [...opponent.deck.discardPile]
  };

  dbg('Player deck copy:', playerDeckCopy);
  dbg('Opponent deck copy:', opponentDeckCopy);
  dbg('Opponent deck copy cards length:', opponentDeckCopy.cards.length);
  dbg('Opponent deck copy cards:', opponentDeckCopy.cards);

  // Check if opponent has ambush passive
  const hasAmbush = Array.isArray(opponent.passives) && opponent.passives.some(p => (p.effects || []).some(e => e.code === EffectCode.ambush));
  dbg('Opponent has ambush:', hasAmbush);

  // Determine who goes first
  const firstTurn = hasAmbush ? Turn.OPPONENT : Turn.PLAYER;
  dbg('First turn:', firstTurn);
  const openingSide: 'player' | 'opponent' = firstTurn === Turn.PLAYER ? 'player' : 'opponent';

  // --- NEW LOGIC: Create battleLog and provisional state before any draws ---
  // Create battle log with appropriate message based on who goes first
  const battleLog: string[] = [
    formatLogText('Battle started!', player.class, opponent.name),
    formatLogText(`${player.class} vs ${opponent.name}`, player.class, opponent.name)
  ];

  if (hasAmbush) {
    battleLog.push(formatLogText(`${opponent.name} uses Ambush and strikes first!`, player.class, opponent.name));
  }

  // Provisional battle state so beforeDraw can add cards (e.g., Coward) before any draws
  const provisionalState: BattleState = {
    playerHand: [],
    playerEnergy: player.maxEnergy,
    opponentEnergy: 2,
    opponentHand: [],
    turn: firstTurn,
    playerPlayedCards: [],
    opponentPlayedCards: [],
    playerDiscardPile: [],
    opponentDiscardPile: [],
    playerDeck: playerDeckCopy,
    opponentDeck: opponentDeckCopy,
    playerBlock: 0,
    opponentBlock: 0,
    playerMods: [],
    opponentMods: [],
    playerPersistentBlock: false,
    playerDrawModifications: [],
    opponentDrawModifications: [],
    battleLog
  };

  // --- BEFORE DRAW phase ---
  triggerBeforeDraw(
    openingSide,
    provisionalState,
    player,
    opponent,
    provisionalState.battleLog
  );

  // Perform opening draw for the side who starts
  performDraw(openingSide, provisionalState, player, opponent, provisionalState.battleLog);

  return provisionalState;
}

export function calculateCardDamage(card: Card, player: Player): number {
  return card.attack || 0;
}

export function calculateRiposteDamage(card: Card, player: Player, battleState: BattleState): number {
  return (card.attack || 0) + (battleState.playerBlock || 0);
}

export function calculateCardBlock(card: Card, player: Player): number {
  return card.defense || 0;
}

export function getCardCost(card: Card, player: Player): number {
  return card.cost;
}

export function calculateDamageWithStatusEffects(
  damage: number,
  attackerMods: ActiveMod[],
  defenderMods: ActiveMod[],
  ctx: {
    card?: Card;
    state: BattleState;
    player: Player;
    opponent: Opponent;
    side: 'player' | 'opponent';
    log?: string[];
  }
): { finalDamage: number; evaded: boolean; consumedEvasive: boolean } {
  const { card, state, player, opponent, side, log } = ctx;

  // 1) Build a single pseudo card that carries the working damage value.
  //    All onDamageDealing / onDamageIncoming effects will mutate this `attack`.
  const pseudo: Card & { effects: EffectInstance[] } = {
    id: `dmg:${Date.now()}`,
    name: '[Damage Pipeline]',
    description: '',
    cost: 0,
    class: player.class,
    rarity: Rarity.COMMON,
    types: card?.types ? [...(card.types || [])] : [],
    attack: Math.max(0, damage),
    effects: [],
  };

  // Helpers to collect effects from passives/mods for a specific side & phase
  const collectPassiveEffects = (owner: 'player' | 'opponent', phase: TriggerPhase): EffectInstance[] => {
    const list = (owner === 'player' ? player.passives : opponent.passives) || [];
    return list.flatMap(p => (p.effects || []).filter(e => e.trigger === phase));
  };

  const collectModEffects = (owner: 'player' | 'opponent', phase: TriggerPhase): EffectInstance[] => {
    const mods = owner === 'player' ? (state.playerMods || []) : (state.opponentMods || []);
    const out: EffectInstance[] = [];
    for (const m of mods) {
      for (const eff of (m.effects || [])) {
        if (eff.trigger !== phase) continue;
        // Normalize params relative to owner side (self/opponent & stack-derivation)
        const params = resolveModEffectParams(eff.params, m, owner);
        out.push({ ...eff, params });
      }
    }
    return out;
  };

  // 2) Gather effects in the correct order:
  //    a) Attacker ONDAMAGEDEALING (passives + mods)
  //    b) Defender ONDAMAGEINCOMING (passives + mods)
  const dealingEffects: EffectInstance[] = [
    ...collectPassiveEffects(side, TriggerPhase.ONDAMAGEDEALING),
    ...collectModEffects(side, TriggerPhase.ONDAMAGEDEALING),
  ];

  const defenderSide: 'player' | 'opponent' = side === 'player' ? 'opponent' : 'player';
  const incomingEffects: EffectInstance[] = [
    ...collectPassiveEffects(defenderSide, TriggerPhase.ONDAMAGEINCOMING),
    ...collectModEffects(defenderSide, TriggerPhase.ONDAMAGEINCOMING),
  ];

  // 3) Run effects over the single pseudo card so they can mutate `attack`.
  //    We run in two passes to preserve intuitive ordering.
  if (dealingEffects.length) {
    pseudo.effects = dealingEffects.map(e => ({ ...e }));
    runCardEffects(pseudo, { side, player, opponent, state, log: log || [] }, log || []);
  }

  if (incomingEffects.length) {
    pseudo.effects = incomingEffects.map(e => ({ ...e }));
    // Note: for incoming we still use the attacker's `side` in context so handlers can
    // resolve targets relative to the same action; targeting inside params was already
    // normalized for mods via resolveModEffectParams.
    runCardEffects(pseudo, { side, player, opponent, state, log: log || [] }, log || []);
  }

  // 4) Finalize
  const final = Math.max(0, pseudo.attack || 0);
  const evaded = final === 0; // any ONDAMAGEINCOMING effect (e.g., `evade`) can zero the hit

  // We let resolveAndApplyDamage handle Evasive stack consumption consistently to avoid double-consume.
  return { finalDamage: final, evaded, consumedEvasive: false };
}

/**
 * Unified damage resolution & application.
 * Use this whenever a card or an effect deals damage.
 *
 * It handles:
 *  - Status/mod interactions (weak, vulnerable, strength, bleeding, evasive)
 *  - Block absorption & health reduction
 *  - Logging & evasive stack consumption
 *
 * It is side-agnostic and works for both player and opponent.
 */
export function resolveAndApplyDamage(opts: {
  side: 'player' | 'opponent';         // who is dealing the damage
  source: 'attack' | 'effect';         // just for log clarity
  baseDamage: number;                  // pre-mod, pre-block
  card?: Card;                         // optional: card causing the damage
  state: BattleState;                  // current battle state (mutated in-place for perf, but returned too)
  player: Player;                      // current player (mutated in-place)
  opponent: Opponent;                  // current opponent (mutated in-place)
  log: string[];                       // battle log sink
}): {
  newState: BattleState;
  newPlayer: Player;
  newOpponent: Opponent;
  dealt: number;                       // damage that actually hit HP (after block)
  blocked: number;                     // amount absorbed by block
  evaded: boolean;                     // true if Evasive cancelled the hit
  consumedEvasive: boolean;            // if an evasive stack was consumed
  brokeBlock: boolean;                 // true if block was present and reduced to 0
} {
  const {
    side, source, baseDamage, card,
    state, player, opponent, log
  } = opts;

  // Early exit: nothing to do
  if (baseDamage <= 0) {
    return {
      newState: state,
      newPlayer: player,
      newOpponent: opponent,
      dealt: 0,
      blocked: 0,
      evaded: false,
      consumedEvasive: false,
      brokeBlock: false
    };
  }

  const isPlayer = side === 'player';
  const attackerName = isPlayer ? 'Player' : opponent.name;
  const defenderName = isPlayer ? opponent.name : player.class;

  // Pull mods for both sides
  const attackerMods = isPlayer ? (state.playerMods || []) : (state.opponentMods || []);
  const defenderMods = isPlayer ? (state.opponentMods || []) : (state.playerMods || []);

  // Compute pre-block damage considering mods, passives, etc.
  const { finalDamage, evaded, consumedEvasive } = calculateDamageWithStatusEffects(
    baseDamage,
    attackerMods,
    defenderMods,
    { card, state, player, opponent, side, log }
  );

  // If evaded, consume a stack and log
  if (evaded) {
    if (isPlayer) {
      state.opponentMods = consumeModStacks(state.opponentMods || [], ModType.EVASIVE, 1);
      log.push(formatLogText(`${defenderName}'s Evasive prevented damage from ${attackerName}'s ${card?.name || source}`, player.class, opponent.name, card?.name || ''));
    } else {
      state.playerMods = consumeModStacks(state.playerMods || [], ModType.EVASIVE, 1);
      log.push(formatLogText(`${defenderName}'s Evasive prevented damage from ${attackerName}'s ${card?.name || source}`, player.class, opponent.name, card?.name || ''));
    }
    return {
      newState: state,
      newPlayer: player,
      newOpponent: opponent,
      dealt: 0,
      blocked: 0,
      evaded: true,
      consumedEvasive: consumedEvasive,
      brokeBlock: false
    };
  }

  // --- MOD DAMAGE: bypass block logic for mod-originated damage ---
  const isModDamage = !!(card && typeof card.id === 'string' && card.id.startsWith('mod:'));
  if (isModDamage) {
    const pending = Math.max(0, finalDamage);
    if (pending > 0) {
      if (isPlayer) {
        opponent.health = Math.max(0, opponent.health - pending);
      } else {
        player.health = Math.max(0, player.health - pending);
      }
      const who = isPlayer ? 'Player' : opponent.name;
      const tgt = isPlayer ? opponent.name : player.class;
      log.push(formatLogText(`${who} deals ${pending} direct damage to ${tgt} with ${card?.name || source} (ignores block)`, player.class, opponent.name, card?.name || ''));
    }
    return {
      newState: state,
      newPlayer: player,
      newOpponent: opponent,
      dealt: Math.max(0, finalDamage),
      blocked: 0,
      evaded: false,
      consumedEvasive: false,
      brokeBlock: false,
    };
  }

  let pending = Math.max(0, finalDamage);
  let blocked = 0;
  let dealt = 0;
  let brokeBlock = false;

  // Determine defender block key & current block
  const blockKey = (isPlayer ? 'opponentBlock' : 'playerBlock') as 'playerBlock' | 'opponentBlock';
  let defenderBlock = state[blockKey] || 0;

  // Apply to block first
  if (defenderBlock > 0 && pending > 0) {
    const absorbed = Math.min(defenderBlock, pending);
    defenderBlock -= absorbed;
    pending -= absorbed;
    blocked += absorbed;

    // Logging for block hits
    if (absorbed > 0) {
      const who = isPlayer ? 'Player' : opponent.name;
      const tgt = isPlayer ? `${opponent.name}'s` : `${player.class}'s`;
      log.push(formatLogText(`${who} deals ${absorbed} damage to ${tgt} block with ${card?.name || source}`, player.class, opponent.name, card?.name || ''));
    }

    // Did we break block?
    if (defenderBlock === 0 && (state[blockKey] || 0) > 0 && pending > 0) {
      brokeBlock = true;
      const who = isPlayer ? 'Player' : opponent.name;
      const tgt = isPlayer ? opponent.name : player.class;
      // Add a "breaks block" log when block reaches zero and there is spillover
      log.push(formatLogText(`${who} breaks ${tgt}'s block`, player.class, opponent.name, card?.name || ''));
    }
  }

  // Commit updated block back to state
  state[blockKey] = defenderBlock;

  // Spill to HP
  if (pending > 0) {
    if (isPlayer) {
      opponent.health = Math.max(0, opponent.health - pending);
    } else {
      player.health = Math.max(0, player.health - pending);
    }
    dealt = pending;

    const who = isPlayer ? 'Player' : opponent.name;
    const tgt = isPlayer ? opponent.name : player.class;
    log.push(formatLogText(`${who} deals ${pending} damage to ${tgt} with ${card?.name || source}`, player.class, opponent.name, card?.name || ''));
  }

  return {
    newState: state,
    newPlayer: player,
    newOpponent: opponent,
    dealt,
    blocked,
    evaded: false,
    consumedEvasive: false,
    brokeBlock
  };
}

// Apply or refresh a mod in a fully generic way:
export function applyMod(mods: ActiveMod[], type: ModType, stacksDelta = 1, duration?: number, effects?: EffectInstance[]): ActiveMod[] {
  const def = MOD_DEFS[type];
  const d = duration ?? def.defaultDuration;
  const next = [...mods];
  const i = next.findIndex(m => m.type === type);

  if (i >= 0) {
    const current = next[i];
    const newStacks = def.stackMode === 'add'
      ? Math.min(def.maxStacks, current.stacks + stacksDelta)
      : Math.min(def.maxStacks, stacksDelta);

    next[i] = {
      ...current,
      stacks: newStacks,
      duration: d,        // refresh duration on reapply (consistent & simple)
      effects: effects ?? current.effects ?? MOD_DEFAULT_EFFECTS[type]
    };
  } else {
    next.push({
      type,
      stacks: Math.min(def.maxStacks, Math.max(0, stacksDelta)),
      duration: d,
      effects: effects ?? MOD_DEFAULT_EFFECTS[type]
    });
  }
  return next;
}

// Decrement duration and remove expired — no special-cases needed.
export function tickMods(mods: ActiveMod[]): ActiveMod[] {
  return mods
    .map(m => ({ ...m, duration: Math.max(0, m.duration - 1) }))
    .filter(m => m.duration > 0 && m.stacks > 0);
}

export function shuffleCardsIntoDeck(deck: Deck, cardsToAdd: Card[]): Deck {
  // Create a new deck with the additional cards shuffled in
  const allCards = [...deck.cards, ...cardsToAdd];
  const shuffledCards = shuffleDeck(allCards);
  
  return {
    cards: shuffledCards,
    discardPile: [...deck.discardPile]
  };
}

function convertDuration(description: string, keyword: string): string {
  const regex = new RegExp(`Apply (\\d+) ${keyword}`, 'i');
  const match = description.match(regex);

  if (match) {
    const totalTurns = parseInt(match[1], 10);
    const playerTurns = Math.ceil(totalTurns / 2); // convert to player turns
    return description.replace(regex, `Apply ${playerTurns} ${keyword}`);
  }

  return description;
}

export function formatCardDescription(description: string): string {
  if (!description) return '';

  const keywords = ['weak', 'vulnerable', 'strength', 'dexterity'];
  let formatted = description;

  keywords.forEach(keyword => {
    formatted = convertDuration(formatted, keyword);
  });

  return formatted;
}

export function getStatusDisplayDuration(effectType: string, duration: number): number {
  // Convert total duration to player turns for display
  return Math.ceil(duration / 2);
}

export function getActualDurationFromDisplay(displayDuration: number): number {
  // Convert displayed player turns back to actual total duration
  return displayDuration * 2;
}

export function addDrawModification(
  modifications: DrawModification[],
  type: DrawModType,
  value: number,
  source: string,
  duration: number
): DrawModification[] {
  const newModifications = [...modifications];
  
  // Special handling for Dirty Trick - allow stacking
  if (source === 'Dirty Trick') {
    // For Dirty Trick, we add multiple modifications instead of overwriting
    newModifications.push({
      type,
      value,
      source,
      duration
    });
    return newModifications;
  }
  
  // Check if there's already a modification from the same source (for non-Dirty Trick cards)
  const existingIndex = newModifications.findIndex(mod => mod.source === source);
  
  if (existingIndex !== -1) {
    // Update existing modification
    newModifications[existingIndex] = {
      type,
      value,
      source,
      duration
    };
  } else {
    // Add new modification
    newModifications.push({
      type,
      value,
      source,
      duration
    });
  }
  
  return newModifications;
}

function runTriggeredEffectsForPhase(
  phase: TriggerPhase,
  side: 'player' | 'opponent',
  state: BattleState,
  player: Player,
  opponent: Opponent,
  log: string[],
) {
  const playerSidePassives = Array.isArray(player.passives) ? player.passives : [];
  const opponentSidePassives = Array.isArray(opponent.passives) ? opponent.passives : [];

  const pick = (effects?: EffectInstance[]) => (effects || []).filter(e => e.trigger === phase);

  const bundles: EffectInstance[] = [
    ...playerSidePassives.flatMap(p => pick(p.effects)),
    ...opponentSidePassives.flatMap(p => pick(p.effects)),
  ];

  for (const eff of bundles) {
    const pseudo: Card & { effects: EffectInstance[] } = {
      id: `phase:${phase}:${Date.now()}`,
      name: `Phase:${phase}`,
      description: '',
      cost: 0,
      class: player.class,
      rarity: Rarity.COMMON,
      types: [],
      effects: [eff],
    };
    runCardEffects(pseudo, { side, player, opponent, state, log }, log);
  }
}

export function triggerBeforeDraw(
  side: 'player' | 'opponent',
  battleState: BattleState,
  player: Player,
  opponent: Opponent,
  log: string[]
) {
  // Tick Mods
  battleState.playerMods = tickMods(battleState.playerMods || []);
  battleState.opponentMods = tickMods(battleState.opponentMods || []);

  // --- Start-of-turn housekeeping now lives here ---
  if (side === 'player') {
    // Player block handling (Shield Up persistence)
    if (!battleState.playerPersistentBlock) {
      battleState.playerBlock = 0;
    } else {
      log.push(formatLogText("Player's block persists due to Shield Up effect", player.class, opponent.name));
      battleState.playerPersistentBlock = false; // consume persistence
    }
  } else {
    // Opponent block resets at the start of its turn
    battleState.opponentBlock = 0;
  }

  // Run mod effects for BEFOREDRAW phase
  runModEffectsForPhase(side, battleState, player, opponent, TriggerPhase.BEFOREDRAW, log);

  // Trigger effects bound to BEFOREDRAW (passives only)
  runTriggeredEffectsForPhase(TriggerPhase.BEFOREDRAW, side, battleState, player, opponent, log);
}

export function updateDrawModifications(modifications: DrawModification[]): DrawModification[] {
  const updated = modifications
    .map(mod => ({
      ...mod,
      duration: mod.duration > 0 ? mod.duration - 1 : mod.duration
    }))
    .filter(mod => mod.duration !== 0); // Remove modifications that have expired (duration was 1 and became 0)
  return updated;
}

export function calculateModifiedDrawCount(baseDrawCount: number, modifications: DrawModification[]): number {
  if (!modifications || modifications.length === 0) return Math.max(0, baseDrawCount);

  let setValue: number | null = null;
  let add = 0;
  let subtract = 0;

  for (const mod of modifications) {
    switch (mod.type) {
      case DrawModType.SET:
        setValue = mod.value; // last SET wins
        break;
      case DrawModType.ADD:
        add += mod.value;
        break;
      case DrawModType.SUBTRACT:
        subtract += mod.value;
        break;
    }
  }

  let result = (setValue !== null ? setValue : baseDrawCount) + add - subtract;
  return Math.max(0, result);
}

export function formatDrawModificationLog(modifications: DrawModification[], baseDrawCount: number): string {
  if (!modifications || modifications.length === 0) return '';

  // Don't log Dirty Trick modifications - they're already logged separately
  if (modifications.some(mod => mod.source === 'Dirty Trick')) return '';

  const finalCount = calculateModifiedDrawCount(baseDrawCount, modifications);
  if (finalCount === baseDrawCount) return '';

  const activeSources = modifications.map(mod => mod.source).join(', ');
  return `Draw modifications (${activeSources}): Drawing ${finalCount} cards instead of ${baseDrawCount}`;
}

// Helper function to format log text with bold keywords and card names
export function formatLogText(text: string, playerClass: PlayerClass = PlayerClass.WARRIOR, opponentName: string = 'Alpha Wolf', cardName: string = ''): string {
  // Keywords to bold
  const keywords = ['damage', 'block', 'bleeding', 'weak', 'vulnerable', 'strength', 'dexterity', 'applied', 'deals', 'gains', 'breaks'];
  const cardNames = ['Alpha Claws', 'Vicious Bite', 'Terrifying Howl', 'Call the Pack', 'Killing Instinct', 'Strike', 'Defend', 'Bash', 'Riposte', 'Shield Up', 'Press the Attack'];
  
  let formattedText = text;
  
  // Replace "player" with player class name (capitalized)
  const playerClassName = playerClass.charAt(0).toUpperCase() + playerClass.slice(1);
  formattedText = formattedText.replace(/\bplayer\b/g, playerClassName);
  
  // Bold card names
  cardNames.forEach(card => {
    const regex = new RegExp(`\\b${card}\\b`, 'gi');
    formattedText = formattedText.replace(regex, `**${card}**`);
  });
  
  // Bold keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formattedText = formattedText.replace(regex, `**${keyword}**`);
  });
  
  // Bold opponent name
  if (opponentName) {
    const opponentRegex = new RegExp(`\\b${opponentName}\\b`, 'gi');
    formattedText = formattedText.replace(opponentRegex, `**${opponentName}**`);
  }
  
  // Bold player class name
  const playerClassRegex = new RegExp(`\\b${playerClassName}\\b`, 'gi');
  formattedText = formattedText.replace(playerClassRegex, `**${playerClassName}**`);
  
  return formattedText;
}

export function canPlayCard(card: Card, player: Player, energy: number, battleState?: BattleState): boolean {
  // Unplayable cards cannot be played
  if (card.unplayable) {
    return false;
  }
  
  // Check energy cost
  const cost = getCardCost(card, player);
  if (energy < cost) {
    return false;
  }
  
  // Check card play conditions if battleState is provided
  if (battleState) {
    // Check if damage was prevented last turn (look for Evasive logs in battleLog)
    const lastTurnDamagePrevented = battleState.battleLog.some(logEntry => 
      logEntry.includes("'s Evasive prevented") && logEntry.includes("from")
    );
    
    return canPlayCardWithConditions(card, battleState, lastTurnDamagePrevented);
  }
  
  return true;
}

function playOneCard(
  side: 'player' | 'opponent',
  card: Card,
  player: Player,
  opponent: Opponent,
  battleState: BattleState,
  log: string[]
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState } {
  const isPlayer = side === 'player';

  let newPlayer = { ...player };
  let newOpponent = { ...opponent };
  const newBattleState = { ...battleState };

  // 1) Remove the card from the correct hand and place in discard unless volatile
  const hand = isPlayer ? newBattleState.playerHand : newBattleState.opponentHand;
  const discard = isPlayer ? 'playerDiscardPile' : 'opponentDiscardPile' as const;
  const played = isPlayer ? 'playerPlayedCards' : 'opponentPlayedCards' as const;

  // Track if this is the first card played this turn
  const wasFirst = (isPlayer ? newBattleState.playerPlayedCards.length : newBattleState.opponentPlayedCards.length) === 0;

  const idx = hand.findIndex(c => c.id === card.id);
  if (idx !== -1) {
    const [removed] = hand.splice(idx, 1);
    const isVolatile = !!removed.types?.includes(CardType.VOLATILE);
    if (!isVolatile) {
      (newBattleState[discard] as Card[]) = [...(newBattleState[discard] as Card[]), removed];
    } else {
      log.push(formatLogText(`${isPlayer ? newPlayer.class : newOpponent.name}'s ${removed.name} was burned and removed from game!`, newPlayer.class, newOpponent.name, removed.name));
    }
  }

  // 2) Energy deduction (effects are run later, after damage)
  let costToPay = getCardCost(card, newPlayer);
  if (isPlayer && (newBattleState as any).__firstCardFreePlayer && wasFirst) {
    costToPay = 0; (newBattleState as any).__firstCardFreePlayer = false;
  }
  if (!isPlayer && (newBattleState as any).__firstCardFreeOpponent && wasFirst) {
    costToPay = 0; (newBattleState as any).__firstCardFreeOpponent = false;
  }
  if (isPlayer) newBattleState.playerEnergy -= costToPay; else newBattleState.opponentEnergy -= costToPay;

  // Push to played stack now
  (isPlayer ? newBattleState.playerPlayedCards : newBattleState.opponentPlayedCards).push(card);

  // 3) Apply ATTACK (damage last) via unified resolver
  if (card.attack && card.attack > 0) {
    resolveAndApplyDamage({
      side,
      source: 'attack',
      baseDamage: card.attack || 0,
      card,
      state: newBattleState,
      player: newPlayer,
      opponent: newOpponent,
      log,
    });
  }

  // 5) Now run the card's effects, but only if either the card has no attack
  //    or its attack actually dealt damage (not fully evaded/zeroed).
  {
    const hasAttack = !!(card.attack && card.attack > 0);
    let canRunEffects = !hasAttack; // if no attack, always run effects

    if (hasAttack) {
      // Check the last damage resolution outcome from the log/state we just produced.
      // We use a conservative rule: if damage was evaded or reduced to exactly 0, skip effects.
      // Since resolveAndApplyDamage already handled logs and state, we infer from HP/block change via a flag.
      // To keep it robust, recompute one-shot eligibility based on most recent entry:
      const lastLog = log[log.length - 1] || '';
      const evadedHit = /Evasive prevented damage/.test(lastLog);
      const zeroedHit = /deals 0 damage/.test(lastLog);
      canRunEffects = !(evadedHit || zeroedHit);
    }

    if (canRunEffects) {
      runCardEffects(
        card as Card & { effects?: EffectInstance[] },
        { side, player: newPlayer, opponent: newOpponent, state: newBattleState, log },
        log
      );
    } else {
      // Optional: diagnostic log to explain skipped effects due to no damage landing
      // log.push(formatLogText(`${isPlayer ? newPlayer.class : newOpponent.name}'s ${card.name} effects did not trigger because the attack dealt no damage`, newPlayer.class, newOpponent.name, card.name));
    }
  }

  // 6) Apply DEFENSE
  if (card.defense) {
    const block = isPlayer ? calculateCardBlock(card, newPlayer) : (card.defense || 0);
    if (isPlayer) {
      newBattleState.playerBlock += block;
      log.push(formatLogText(`Player gains ${block} block from ${card.name}`, newPlayer.class, newOpponent.name, card.name));
    } else {
      newBattleState.opponentBlock += block;
      log.push(formatLogText(`${newOpponent.name} gains ${block} block with ${card.name}`, newPlayer.class, newOpponent.name, card.name));
    }
  }

  return { newPlayer, newOpponent, newBattleState };
}

export function playCard(
  card: Card,
  player: Player,
  opponent: Opponent,
  battleState: BattleState
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState; log: string[] } {
  const log: string[] = [];
  const cost = getCardCost(card, player);

  if (!canPlayCard(card, player, battleState.playerEnergy, battleState)) {
    return { newPlayer: player, newOpponent: opponent, newBattleState: battleState, log: [formatLogText('Not enough energy or card conditions not met!', player.class, opponent.name)] };
  }

  const { newPlayer, newOpponent, newBattleState } = playOneCard('player', card, player, opponent, battleState, log);
  return { newPlayer, newOpponent, newBattleState, log };
}

// Helper function to play a single opponent card
function playSingleOpponentCard(
  cardToPlay: Card,
  opponent: Opponent,
  player: Player,
  battleState: BattleState,
  remainingEnergy: number,
  log: string[]
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState; log: string[] } {
  dbg('🎮 Playing single opponent card:', cardToPlay.name);
  const logRef = log || [];
  const { newPlayer, newOpponent, newBattleState } = playOneCard('opponent', cardToPlay, player, opponent, battleState, logRef);
  dbg('✅ Single card play complete:', cardToPlay.name);
  return { newPlayer, newOpponent, newBattleState, log: logRef };
}

export function opponentPlayCard(
  opponent: Opponent, 
  player: Player, 
  battleState: BattleState,
  specificCard?: Card  // Optional parameter to play a specific card
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState; log: string[] } {
  dbg('=== OPPONENT PLAY CARD (EXECUTION ONLY) ===');
  const log: string[] = [];

  // Copy inputs to avoid accidental external mutation; playOneCard mutates provided copies.
  let currentPlayer = { ...player };
  let currentOpponent = { ...opponent };
  let currentBattleState = { ...battleState };

  // Opponent energy should already be set by turn flow; default to 2 as a fallback.
  const remainingEnergy = typeof currentBattleState.opponentEnergy === 'number'
    ? currentBattleState.opponentEnergy
    : 2;

  // If no specific card is provided, this function does NOT decide what to play anymore.
  // Higher-level AI (OpponentAI.decidePlays) must choose the card and pass it here.
  if (!specificCard) {
    dbg('No specific card supplied to opponentPlayCard; skipping (decision lives in OpponentAI.decidePlays).');
    return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
  }

  // Verify the specific card is actually in hand and playable with current conditions/energy
  const handCard = currentBattleState.opponentHand.find(c => c.id === specificCard.id);
  if (!handCard) {
    dbg('Specified card not found in opponent hand:', specificCard.name);
    return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
  }
  if (handCard.unplayable || handCard.cost > remainingEnergy) {
    dbg('Specified card is not playable due to flags or energy:', handCard.name);
    return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
  }

  // Respect any card-specific play conditions (e.g., Booby Trap, Backstab, etc.)
  const lastTurnDamagePrevented = currentBattleState.battleLog.some(entry =>
    entry.includes("'s Evasive prevented") && entry.includes('from')
  );
  if (!canPlayCardWithConditions(handCard, currentBattleState, lastTurnDamagePrevented)) {
    dbg('Specified card fails conditional checks:', handCard.name);
    return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
  }

  // Play exactly this one card; all effect resolution and logging are handled by playOneCard
  dbg('Playing specified card from OpponentAI:', handCard.name);
  const { newPlayer, newOpponent, newBattleState, log: playLog } = playSingleOpponentCard(
    handCard,
    currentOpponent,
    currentPlayer,
    currentBattleState,
    remainingEnergy,
    log
  );

  return { newPlayer, newOpponent, newBattleState, log: playLog };
}



export function drawCardsWithMinionEffects(
  deck: Deck, 
  discardPile: Card[], 
  numCards: number = 1,
  targetPlayer: 'player' | 'opponent' = 'player',
  playerClass: PlayerClass = PlayerClass.WARRIOR,
  opponentName: string = 'Alpha Wolf'
): { drawnCards: Card[], updatedDeck: Deck, updatedDiscardPile: Card[], minionDamageLog: string[] } {
  const drawnCards: Card[] = [];
  let currentDeck = { ...deck };
  let currentDiscardPile = [...discardPile];
  const minionDamageLog: string[] = [];
  
  for (let i = 0; i < numCards; i++) {
    if (currentDeck.cards.length === 0) {
      // Shuffle discard pile back into deck
      if (currentDiscardPile.length > 0) {
        currentDeck.cards = shuffleDeck([...currentDiscardPile]);
        currentDiscardPile = [];
        dbg('Deck empty, shuffled discard pile back into deck');
      } else {
        dbg('No cards left to draw');
        break;
      }
    }
    
    const drawnCard = currentDeck.cards.shift()!;
    
    // Check if this is a Wolf minion card
    if (drawnCard.types?.includes(CardType.MINION) && drawnCard.unplayable && /wolf_minion/.test(drawnCard.id)) {
      const damage = drawnCard.attack || 5;
      minionDamageLog.push(formatLogText(
        `${targetPlayer === 'player' ? playerClass : opponentName} drew Wolf and takes ${damage} damage`,
        playerClass,
        opponentName
      ));
      drawnCards.push(drawnCard);
    } else {
      drawnCards.push(drawnCard);
    }
  }
  
  return {
    drawnCards,
    updatedDeck: currentDeck,
    updatedDiscardPile: currentDiscardPile,
    minionDamageLog
  };
}

export function drawCardsWithReshuffle(
  deck: Deck, 
  discardPile: Card[], 
  numCards: number = 1
): { drawnCards: Card[], updatedDeck: Deck, updatedDiscardPile: Card[] } {
  const drawnCards: Card[] = [];
  let currentDeck = { ...deck };
  let currentDiscardPile = [...discardPile];
  
  for (let i = 0; i < numCards; i++) {
    if (currentDeck.cards.length === 0) {
      // Shuffle discard pile back into deck
      if (currentDiscardPile.length > 0) {
        currentDeck.cards = shuffleDeck([...currentDiscardPile]);
        currentDiscardPile = [];
        dbg('Deck empty, shuffled discard pile back into deck');
      } else {
        dbg('No cards left to draw');
        break;
      }
    }
    
    if (currentDeck.cards.length > 0) {
      const card = currentDeck.cards.shift()!;
      drawnCards.push(card);
      dbg(`Drew card: ${card.name}`);
    }
  }
  
  return {
    drawnCards,
    updatedDeck: currentDeck,
    updatedDiscardPile: currentDiscardPile
  };
}

/** @deprecated Legacy stub. Use drawCardsWithMinionEffects or drawCardsWithReshuffle instead. */
// Kept temporarily for backward compatibility; prefer the deck-aware helpers.
export function drawCards(battleState: BattleState, numCards: number = 1): BattleState {
  const newBattleState = { ...battleState };
  
  // For now, we'll use a simple implementation since we don't have deck access in battle state
  // In a full implementation, we'd need to track deck state in battle
  for (let i = 0; i < numCards; i++) {
    if (newBattleState.playerHand.length < 8) { // Max hand size
      newBattleState.playerHand.push(newBattleState.playerHand[0] || { 
        id: 'placeholder', 
        name: 'Card', 
        description: 'A card', 
        cost: 1, 
        class: PlayerClass.WARRIOR,
        rarity: Rarity.COMMON
      });
    }
  }

  return newBattleState;
}


export function endTurn(battleState: BattleState, player: Player, opponent: Opponent): { newBattleState: BattleState; newPlayer: Player; newOpponent: Opponent } {
  const newBattleState = { ...battleState };
  const log: string[] = [];
  let newPlayer = { ...player };
  let newOpponent = { ...opponent };
  
  if (newBattleState.turn === Turn.PLAYER) {
    // End of player turn - discard all cards in hand (block persists until opponent's turn)
    const cardsToDiscard = [...newBattleState.playerHand];
    newBattleState.playerHand = [];

    // Burn volatile cards that were discarded
    const playerVolatileCardsBurned = cardsToDiscard.filter(card =>
      card.types && card.types.includes(CardType.VOLATILE)
    );

    // Add non-volatile cards to discard pile
    const playerNonVolatileCards = cardsToDiscard.filter(card =>
      !card.types || !card.types.includes(CardType.VOLATILE)
    );
    newBattleState.playerDiscardPile = [...newBattleState.playerDiscardPile, ...playerNonVolatileCards];

    if (playerVolatileCardsBurned.length > 0) {
      log.push(formatLogText(`${newPlayer.class} burned ${playerVolatileCardsBurned.length} volatile card(s) at end of turn.`, newPlayer.class, newOpponent.name));
    }

    if (playerNonVolatileCards.length > 0) {
      // No log for discarding cards at end of turn
    }

    // (status effects duration tick now handled by triggerBeforeDraw)

    // Update draw modifications (reduce duration) - AFTER player turn
    newBattleState.playerDrawModifications = updateDrawModifications(newBattleState.playerDrawModifications);
    newBattleState.opponentDrawModifications = updateDrawModifications(newBattleState.opponentDrawModifications);

    // Reset played cards for the next turn
    newBattleState.playerPlayedCards = [];

    newBattleState.turn = Turn.OPPONENT;

    // Reset opponent energy at start of their turn
    newBattleState.opponentEnergy = 2;

    // Before opponent draw — unified beforeDraw phase
    triggerBeforeDraw(
      'opponent',
      newBattleState,
      newPlayer,
      newOpponent,
      log
    );

    // Store cards added during beforeDraw (these should be kept)
    const startOfTurnAddedCards = [...newBattleState.opponentHand];

    // Start of opponent turn - draw cards with proper reshuffle logic
    // Clear opponent's hand first, but preserve cards added during beforeDraw phase
    const previousHandCards = newBattleState.opponentHand.filter(card =>
      !startOfTurnAddedCards.some(startCard => startCard.id === card.id)
    );
    newBattleState.opponentHand = [...startOfTurnAddedCards]; // Keep beforeDraw cards

    // Discard all previous hand cards (burn volatile ones)
    const opponentPreviousVolatileCardsBurned = previousHandCards.filter(card =>
      card.types && card.types.includes(CardType.VOLATILE)
    );
    const opponentPreviousNonVolatileCards = previousHandCards.filter(card =>
      !card.types || !card.types.includes(CardType.VOLATILE)
    );
    newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, ...opponentPreviousNonVolatileCards];

    if (opponentPreviousVolatileCardsBurned.length > 0) {
      log.push(formatLogText(`${newOpponent.name} burned ${opponentPreviousVolatileCardsBurned.length} volatile card(s) from previous turn.`, newPlayer.class, newOpponent.name));
    }
    // Start-of-turn draw for opponent (with hand limit 7)
    performDraw('opponent', newBattleState, newPlayer, newOpponent, log, { handLimit: 7 });
    dbg(`Opponent drew cards`);
  } else {
    // End of opponent turn - discard all cards in hand and reset block
    const cardsToDiscard = [...newBattleState.opponentHand];
    newBattleState.opponentHand = [];
    // newBattleState.opponentBlock = 0; // Reset opponent block at end of turn (now handled in triggerBeforeDraw)

    // Burn volatile cards that were discarded
    const opponentEndTurnVolatileCardsBurned = cardsToDiscard.filter(card =>
      card.types && card.types.includes(CardType.VOLATILE)
    );

    // Add non-volatile cards to discard pile
    const opponentEndTurnNonVolatileCards = cardsToDiscard.filter(card =>
      !card.types || !card.types.includes(CardType.VOLATILE)
    );
    newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, ...opponentEndTurnNonVolatileCards];

    if (opponentEndTurnVolatileCardsBurned.length > 0) {
      log.push(formatLogText(`${newOpponent.name} burned ${opponentEndTurnVolatileCardsBurned.length} volatile card(s) at end of turn.`, newPlayer.class, newOpponent.name));
    }

    // Note: Non-volatile discarded cards are not logged for opponent

    // (status effects duration tick now handled by triggerBeforeDraw)

    // DON'T update draw modifications here - we want them to persist for the player's draw phase

    // Reset played cards for the next turn
    newBattleState.opponentPlayedCards = [];

    newBattleState.turn = Turn.PLAYER;
    newBattleState.playerEnergy = 3; // Reset energy

    // Before player draw — unified beforeDraw phase
    triggerBeforeDraw(
      'player',
      newBattleState,
      newPlayer,
      newOpponent,
      log
    );

    // Start-of-turn draw for player (no hand limit)
    performDraw('player', newBattleState, newPlayer, newOpponent, log);
    dbg(`Player drew cards`);
    // NOW update draw modifications AFTER the player has drawn their cards
    newBattleState.playerDrawModifications = updateDrawModifications(newBattleState.playerDrawModifications);
    newBattleState.opponentDrawModifications = updateDrawModifications(newBattleState.opponentDrawModifications);
  }

  // Add log entries to battle log if any
  if (log.length > 0) {
    newBattleState.battleLog = [...newBattleState.battleLog, ...log];
  }

  dbg('=== END TURN DEBUG ===');
  dbg('Final battle log length:', newBattleState.battleLog.length);
  dbg('Final battle log:', newBattleState.battleLog);
  dbg('New log entries added:', log);
  dbg('=== END TURN DEBUG ===');

  return { newBattleState, newPlayer, newOpponent };
}

export function getRandomCards(playerClass: PlayerClass, count: number = 3): Card[] {
  const classCards = playerCards[playerClass];
  const availableCards = classCards.slice(3); // Exclude starting cards
  const selectedCards: Card[] = [];

  for (let i = 0; i < count && i < availableCards.length; i++) {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    selectedCards.push(availableCards[randomIndex]);
    availableCards.splice(randomIndex, 1);
  }

  return selectedCards;
}

export function getRandomPassives(playerClass: PlayerClass, count: number = 3): Passive[] {
  const pool = [...passives[playerClass]]; // do not mutate global passives
  const selected: Passive[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }
  return selected;
}

export function replaceCardInDeck(player: Player, oldCardId: string, newCard: Card): Player {
  const newPlayer = { ...player };
  const newDeck = newPlayer.deck.cards.filter(card => card.id !== oldCardId);
  
  // Add 3 copies of the new card
  for (let i = 0; i < 3; i++) {
    newDeck.push({ ...newCard });
  }

  newPlayer.deck = {
    cards: shuffleDeck(newDeck),
    discardPile: []
  };
  
  return newPlayer;
}

export function checkVictory(player: Player, opponent: Opponent): boolean {
  return opponent.health <= 0;
}

export function checkDefeat(player: Player): boolean {
  return player.health <= 0;
}

export function canPlayCardWithConditions(card: Card, battleState: BattleState, lastTurnDamagePrevented: boolean = false): boolean {
  // Check if card has specific play conditions
  switch (card.id) {
    case 'goblin_booby_trap':
      // Booby Trap can only be played if damage was prevented last turn
      return lastTurnDamagePrevented;
    case 'rogue_backstab':
      // Backstab costs 0 if it's the first card played, but can always be played
      return true;
    default:
      // No special conditions, card can be played normally
      return true;
  }
}