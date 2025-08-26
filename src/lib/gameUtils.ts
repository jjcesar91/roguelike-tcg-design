import { dbg } from '@/lib/debug';
import { BattleState, Card, CardType, Deck, DrawModification, Rarity, GameState, Turn, Opponent, Player, PlayerClass, OpponentType, DrawModType, Difficulty, TriggerPhase, Passive, CardTrigger } from '@/types/game';
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

const BASE_DRAW = 5;

/**
 * Compute the number of cards to draw for a given side, applying draw modifications.
 */
export function computeDrawCountForSide(
  side: 'player' | 'opponent',
  state: BattleState,
  opponent?: Opponent
): number {
  const base = BASE_DRAW;

  dbg(`Computing draw count for side: ${side}, base: ${base}`);
  dbg('Opponent cardsDrawn:', opponent?.cardsDrawn);
  // Choose base draw
  const effectiveBase =
    side === 'opponent'
      ? (typeof opponent?.cardsDrawn === 'number' && Number.isFinite(opponent.cardsDrawn)
          ? opponent.cardsDrawn
          : (state as any)?.opponentCardsDrawn ?? base) 
      : base;

  dbg(`Effective base draw for ${side}: ${effectiveBase}`);

  const mods =
    side === 'player'
      ? (state.playerDrawModifications || [])
      : (state.opponentDrawModifications || []);

  return calculateModifiedDrawCount(effectiveBase, mods);
}
export const getDrawCountForSide = computeDrawCountForSide;

type ModSide = 'player' | 'opponent';

function resolveModEffectParams(base: any, mod: ActiveMod, side: ModSide): any {
  if (!base) return base;
  const p = { ...base };
  if (p.amountFromModStacks) p.amount = mod.stacks;
  if (p.target === 'self') p.target = side;
  if (p.target === 'opponent') p.target = side === 'player' ? 'opponent' : 'player';
  return p;
}

/**
 * Execute all MOD effects for a given side and trigger phase.
 * Builds a pseudo-card so the standard effect runner can mutate attack/params.
 */
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
        effects: [{ ...eff, params }],
        trigger: CardTrigger.ONPLAY
      };
      runCardEffects(pseudo, { side, player, opponent, state, log }, log);
    }
  }
}

/**
 * Run all effects for a phase for a given side (mods, then passives).
 * Used by GameEngine.startTurn as a dynamic import fallback.
 */
export function runPhaseForSide(
  phase: TriggerPhase,
  ctx: { side: 'player' | 'opponent'; state: BattleState; player: Player; opponent: Opponent; log?: string[]; card?: Card }
) {
  const { side, state, player, opponent, log } = ctx;
  const sink = log || (state?.battleLog || []);

  if (phase === TriggerPhase.BEFOREDRAW) {
    return triggerBeforeDraw(side, state, player, opponent, sink);
  }

  // For all other phases, run mod effects first, then passives
  runModEffectsForPhase(side, state, player, opponent, phase, sink);
  runTriggeredEffectsForPhase(phase, side, state, player, opponent, sink);
}

// Back-compat aliases so the dynamic import can find any of these names.
export const runPhase = runPhaseForSide;
export const runTriggeredPhase = runPhaseForSide;
export const runTriggeredEffects = runPhaseForSide;

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

  const cls = gameData.playerClasses[playerClass];
  if (!cls) {
    dbg('Unknown playerClass, falling back to defaults:', playerClass);
  }

  // Build a lookup of card templates for this class
  const classPool = playerCards[playerClass] || [];
  const byId = new Map(classPool.map(c => [c.id, c]));

  // Map startingDeck IDs -> card templates (keeping repeats for multiple copies)
  const startIds = cls?.startingDeck || [];
  const startCards: Card[] = [];
  for (const id of startIds) {
    const tpl = byId.get(id);
    if (!tpl) {
      dbg(`⚠️ startingDeck id "${id}" not found in playerCards[${playerClass}]`);
      continue;
    }
    startCards.push(tpl);
  }

  // Create the deck from explicit list (each entry is one copy)
  // If your createDeck clones + assigns unique ids, pass count = 1
  const deck = createDeck(startCards, 1);

  return {
    class: playerClass,
    health: cls?.health ?? 50,
    maxHealth: cls?.health ?? 50,
    energy: cls?.energy ?? 3,
    maxEnergy: cls?.energy ?? 3,
    deck,
    passives: [],
    level: 1,
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
    opponentEnergy: opponent.maxEnergy,
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

  return provisionalState;
}

export function calculateCardDamage(card: Card, player: Player): number {
  return card.attack || 0;
}

export function calculateRiposteDamage(card: Card, player: Player, battleState: BattleState): number {
  return (card.attack || 0) + (battleState.playerBlock || 0);
}

export function calculateCardBlock(card: Card): number {
  return card.defense || 0;
}

export function getCardCost(card: Card): number {
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
    trigger: CardTrigger.ONPLAY
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

// Tick down mod durations, respecting noDecayOnTick property in MOD_DEFS.
export function tickMods(mods: ActiveMod[] = []): ActiveMod[] {
  return (mods || [])
    .map((m) => {
      const def = MOD_DEFS[m.type];
      if (def?.noDecayOnTick) {
        // Do not decrement duration for non-decaying mods
        return m;
      }
      const nextDuration = Math.max(0, (m.duration ?? 0) - 1);
      return { ...m, duration: nextDuration };
    })
    .filter((m) => {
      const def = MOD_DEFS[m.type];
      // Non-decaying mods are never auto-removed by tick (only stacks reaching 0 removes them)
      if (def?.noDecayOnTick) return m.stacks > 0;
      // For normal mods, remove when duration hits 0 or stacks are 0
      return (m.duration ?? 0) > 0 && m.stacks > 0;
    });
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
      trigger: CardTrigger.ONPLAY
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

/**
 * Discard the entire hand for a side into its discard pile.
 * Volatile cards are burned (removed from game) instead of being discarded.
 * Mutates the provided BattleState in-place and optionally logs actions.
 */
export function discardHandForSide(
  side: 'player' | 'opponent',
  battleState: BattleState,
  player: Player,
  opponent: Opponent,
  log: string[] = battleState?.battleLog ?? []
): { discarded: number; burned: number } {
  const isPlayer = side === 'player';
  const handKey: 'playerHand' | 'opponentHand' = isPlayer ? 'playerHand' : 'opponentHand';
  const discardKey: 'playerDiscardPile' | 'opponentDiscardPile' = isPlayer ? 'playerDiscardPile' : 'opponentDiscardPile';

  const hand = battleState[handKey] || [];
  if (!hand.length) return { discarded: 0, burned: 0 };

  // Partition cards into volatile and non-volatile
  const volatile: Card[] = [];
  const nonVolatile: Card[] = [];
  for (const c of hand) {
    if (c.types && c.types.includes(CardType.VOLATILE)) volatile.push(c);
    else nonVolatile.push(c);
  }

  // Discard non-volatile
  battleState[discardKey] = [...battleState[discardKey], ...nonVolatile];

  dbg('cards discarded: ', nonVolatile);
  // Clear hand
  battleState[handKey] = [];
  dbg('cards burned: ', volatile);

  // Logs
  const who = isPlayer ? player.class : opponent.name;
  if (nonVolatile.length > 0) {
    log.push(formatLogText(`${who} discards ${nonVolatile.length} card(s)`, player.class, opponent.name));
  }
  if (volatile.length > 0) {
    log.push(formatLogText(`${who} burned ${volatile.length} volatile card(s)`, player.class, opponent.name));
  }

  return { discarded: nonVolatile.length, burned: volatile.length };
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

export function canPlayCard(card: Card, energy: number, battleState?: BattleState): boolean {
  // Unplayable cards cannot be played
  if (card.unplayable) {
    return false;
  }
  
  // Check energy cost
  const cost = getCardCost(card);
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
  dbg(`${side === 'player' ? 'Player' : 'Opponent'} is attempting to play a card...`);
  const isPlayer = side === 'player';

  let newPlayer = { ...player };
  let newOpponent = { ...opponent };

  // Deep-clone only the arrays we mutate
  const newBattleState: BattleState = {
    ...battleState,
    playerHand: [...battleState.playerHand],
    opponentHand: [...battleState.opponentHand],
    playerDiscardPile: [...battleState.playerDiscardPile],
    opponentDiscardPile: [...battleState.opponentDiscardPile],
    playerPlayedCards: [...battleState.playerPlayedCards],
    opponentPlayedCards: [...battleState.opponentPlayedCards],
  };

  const hand = isPlayer ? newBattleState.playerHand : newBattleState.opponentHand;
  const discardKey = isPlayer ? 'playerDiscardPile' : 'opponentDiscardPile';
  const playedKey  = isPlayer ? 'playerPlayedCards' : 'opponentPlayedCards';

  const wasFirst = newBattleState[playedKey].length === 0;

  dbg(`${isPlayer ? 'Player' : 'Opponent'} is playing card:`, card);
  dbg('Current hand:', hand);
  dbg('Current energy:', isPlayer ? newBattleState.playerEnergy : newBattleState.opponentEnergy);
  dbg('Was first card this turn:', wasFirst);

  // 1) Remove from hand (if there) and pre-discard unless VOLATILE
  let playedCard = card;
  const idx = hand.findIndex(c => c.id === card.id);
  dbg('Card index in hand:', idx);
  if (idx >= 0) {
    const [removed] = hand.splice(idx, 1);
    playedCard = removed ?? card;
    dbg('Removed card from hand:', removed);
    dbg('Updated hand after removal:', hand);

    const isVolatile = !!playedCard.types?.includes(CardType.VOLATILE);
    if (!isVolatile) {
      newBattleState[discardKey] = [...newBattleState[discardKey], playedCard];
      dbg('Card added to discard pile:', newBattleState[discardKey]);
    } else {
      log.push(
        formatLogText(
          `${isPlayer ? newPlayer.class : newOpponent.name}'s ${playedCard.name} was burned and removed from game!`,
          newPlayer.class, newOpponent.name, playedCard.name
        )
      );
      dbg('Card is volatile and removed from game:', playedCard);
    }
  } else {
    // If you *don’t* want to allow out-of-hand plays, bail here:
    // log.push(`Tried to play ${card.name} but it wasn't in hand.`);
    // return { newPlayer, newOpponent, newBattleState };
    dbg('Card not found in hand, proceeding with provided card object:', card);
  }

  // 2) Pay energy (effects run later)
  let costToPay = getCardCost(playedCard);
  if (wasFirst) {
    if (isPlayer && (newBattleState as any).__firstCardFreePlayer) {
      costToPay = 0; (newBattleState as any).__firstCardFreePlayer = false;
    }
    if (!isPlayer && (newBattleState as any).__firstCardFreeOpponent) {
      costToPay = 0; (newBattleState as any).__firstCardFreeOpponent = false;
    }
  }
  if (isPlayer) newBattleState.playerEnergy = Math.max(0, newBattleState.playerEnergy - costToPay);
  else newBattleState.opponentEnergy = Math.max(0, newBattleState.opponentEnergy - costToPay);

  // Push to played stack
  newBattleState[playedKey] = [...newBattleState[playedKey], playedCard];

  // 3) ATTACK (damage first)
  let damageLanded = false;
  if (playedCard.attack && playedCard.attack > 0) {
    const dmgRes = resolveAndApplyDamage({
      side,
      source: 'attack',
      baseDamage: playedCard.attack || 0,
      card: playedCard,
      state: newBattleState,
      player: newPlayer,
      opponent: newOpponent,
      log,
    }) as any;
    dbg('Damage resolution result:', dmgRes);

    // Prefer a returned flag if you add one; fallback to log sniffing
    damageLanded = dmgRes.dealt > 0;
  }

  // 5) Effects (only if no attack OR attack actually landed)
  dbg('Running card effects for:', playedCard.name);
  const canRunEffects = !(playedCard.attack && playedCard.attack > 0) || damageLanded;
  dbg('Can run effects (no attack or attack landed):', canRunEffects);
  if (canRunEffects && (playedCard as any).effects) {
    dbg('Card has effects, executing:', (playedCard as any).effects);
    runCardEffects(
      playedCard as Card & { effects?: EffectInstance[] },
      { side, player: newPlayer, opponent: newOpponent, state: newBattleState, log },
      log
    );
  }

  // 6) DEFENSE
  if (playedCard.defense && playedCard.defense > 0) {
    const block = calculateCardBlock(playedCard);
    if (isPlayer) {
      newBattleState.playerBlock += block;
      log.push(formatLogText(`Player gains ${block} block from ${playedCard.name}`, newPlayer.class, newOpponent.name, playedCard.name));
    } else {
      newBattleState.opponentBlock += block;
      log.push(formatLogText(`${newOpponent.name} gains ${block} block with ${playedCard.name}`, newPlayer.class, newOpponent.name, playedCard.name));
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

  const side = battleState.turn === 'player' ? 'player' : 'opponent';
  dbg('Current turn side:', side);

  // Choose actor + energy based on side
  const energy = side === 'player' ? battleState.playerEnergy : battleState.opponentEnergy;
  dbg(`=== PLAY CARD: ${side} plays ${card.name} (cost ${card.cost}, has ${energy} energy) ===`);

  if (!canPlayCard(card, energy, battleState)) {
    return {
      newPlayer: player,
      newOpponent: opponent,
      newBattleState: battleState,
      log: [formatLogText('Not enough energy or card conditions not met!', player.class, opponent.name)],
    };
  }
  dbg(`✅ Card is playable: ${card.name}`);

  const { newPlayer, newOpponent, newBattleState } =
    playOneCard(side, card, player, opponent, battleState, log);

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
    : currentOpponent.maxEnergy;

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



// Internal: original deck-based implementation
function drawHandDeckInternal(
  deck: Deck,
  discardPile: Card[],
  state: BattleState,
  numCards: number = 1,
  side: 'player' | 'opponent' = 'player',
  ctx?: { player?: Player; opponent?: Opponent; log?: string[] }
): { drawnCards: Card[], updatedDeck: Deck, updatedDiscardPile: Card[], minionDamageLog: string[] } {
  const drawnCards: Card[] = [];
  let currentDeck = { ...deck };
  let currentDiscardPile = [...discardPile];
  const minionDamageLog: string[] = [];

  for (let i = 0; i < numCards; i++) {
    if (currentDeck.cards.length === 0) {
      if (currentDiscardPile.length > 0) {
        currentDeck.cards = shuffleDeck([...currentDiscardPile]);
        currentDiscardPile = [];
        dbg(`${side === 'player' ? 'Player' : 'Opponent'} deck empty — reshuffled ${side === 'player' ? 'player' : 'opponent'} discard pile back into deck`);
      } else {
        dbg(`${side === 'player' ? 'Player' : 'Opponent'} has no cards left to draw`);
        break;
      }
    }

    const drawnCard = currentDeck.cards.shift()!;
    drawnCards.push(drawnCard);

    // Execute ONDRAW triggers immediately if present
    if ((drawnCard as any).trigger === CardTrigger.ONDRAW && (drawnCard as any).effects?.length) {
      const player = ctx?.player;
      const opponent = ctx?.opponent;
      const logSink = ctx?.log ?? [];

      if (state && player && opponent) {
        try {
          runCardEffects(
            drawnCard as Card & { effects?: EffectInstance[] },
            { side, state, player, opponent, log: logSink },
            logSink
          );
          dbg(`Executed ONDRAW effects for card: ${drawnCard.name}`);
        } catch (e) {
          dbg('Error executing ONDRAW effects for', drawnCard.name, e as any);
        }
      }
    }
  }

  return {
    drawnCards,
    updatedDeck: currentDeck,
    updatedDiscardPile: currentDiscardPile,
    minionDamageLog
  };
}

// Router that supports both the side-based signature expected by GameEngine and the legacy deck-based signature.
export function drawHand(...args: any[]): any {
  // Side-based: (side, drawCount, battleState)
  if (typeof args[0] === 'string' && (args[0] === 'player' || args[0] === 'opponent')) {
    const side = args[0] as 'player' | 'opponent';
    const drawCount: number = (args[1] as number) ?? 1;
    const state: BattleState = args[2] as BattleState;
    const isPlayer = side === 'player';
    const deckKey = isPlayer ? 'playerDeck' : 'opponentDeck';
    const discardKey = isPlayer ? 'playerDiscardPile' : 'opponentDiscardPile';
    const handKey = isPlayer ? 'playerHand' : 'opponentHand';
    const who = isPlayer ? 'Player' : (args[3]?.opponentName || (state as any)?.opponentName || 'Opponent');

    const res = drawHandDeckInternal(
      state[deckKey],
      state[discardKey],
      state,
      drawCount,
      side,
      args[3] // pass optional context: { player, opponent, log }
    );

    // Commit results to state
    state[deckKey] = res.updatedDeck;
    state[discardKey] = res.updatedDiscardPile;
    (state as any)[handKey].push(...res.drawnCards);

    // Append minion damage logs, if we have a battle log
    if (Array.isArray(res.minionDamageLog) && res.minionDamageLog.length && state?.battleLog) {
      state.battleLog.push(...res.minionDamageLog);
    }
    // Return just the drawn cards like GameEngine expects
    return res.drawnCards;
  }

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