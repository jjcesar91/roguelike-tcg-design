import { dbg } from '@/lib/debug';
import { BattleState, Card, CardType, Deck, DrawModification, Rarity, GameState, Turn, Opponent, Player, PlayerClass, OpponentType, StatusType, DrawModType, Difficulty, EffectInstance, EffectCode, StatusEffect } from '@/types/game';
import * as gameData from '@/data/gameData';
import { runCardEffects } from '@/content/modules/effects';

dbg('gameUtils.ts loaded');
dbg('gameData import:', gameData);
dbg('playerCards:', gameData.playerCards);
dbg('opponents:', gameData.opponents);
dbg('passives:', gameData.passives);

// Use the imported data
const playerCards = gameData.playerCards;
const opponents = gameData.opponents;
const passives = gameData.passives;

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
  const hasAmbush = Array.isArray(opponent.passives) && opponent.passives.some(p => p.effect === 'opponent_goes_first');
  dbg('Opponent has ambush:', hasAmbush);

  // Determine who goes first
  const firstTurn = hasAmbush ? Turn.OPPONENT : Turn.PLAYER;
  dbg('First turn:', firstTurn);

  // --- NEW LOGIC: Create battleLog and provisional state before any draws ---
  // Create battle log with appropriate message based on who goes first
  const battleLog: string[] = [
    formatLogText('Battle started!', player.class, opponent.name),
    formatLogText(`${player.class} vs ${opponent.name}`, player.class, opponent.name)
  ];

  if (hasAmbush) {
    battleLog.push(formatLogText(`${opponent.name} uses Ambush and strikes first!`, player.class, opponent.name));
  } else {
    battleLog.push(formatLogText('Player draws 3 cards...', player.class, opponent.name));
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
    playerStatusEffects: [],
    opponentStatusEffects: [],
    playerPersistentBlock: false,
    playerDrawModifications: [],
    opponentDrawModifications: [],
    battleLog
  };

  // --- BEFORE DRAW phase ---
  triggerBeforeDraw(
    firstTurn === Turn.PLAYER ? 'player' : 'opponent',
    provisionalState,
    player,
    opponent,
    provisionalState.battleLog
  );

  // Now perform initial draws according to ambush rules
  if (!hasAmbush) {
    // Normal case: opponent prepares an initial hand of 3
    const opponentDrawResult = drawCardsWithMinionEffects(
      provisionalState.opponentDeck,
      provisionalState.opponentDiscardPile,
      3,
      'opponent',
      player.class,
      opponent.name
    );
    provisionalState.opponentHand = [
      ...provisionalState.opponentHand, // keep any cards injected by beforeDraw (e.g., Coward)
      ...opponentDrawResult.drawnCards
    ];
    provisionalState.opponentDeck = opponentDrawResult.updatedDeck;
    provisionalState.opponentDiscardPile = opponentDrawResult.updatedDiscardPile;
    // Add minion damage log if any (for normal case)
    provisionalState.battleLog.push(...opponentDrawResult.minionDamageLog);
  }

  return provisionalState;
}

export function calculateCardDamage(card: Card, player: Player): number {
  let damage = card.attack || 0;

  // Apply passive effects
  player.passives.forEach(passive => {
    switch (passive.effect) {
      case 'damage_bonus_low_health':
        if (player.health < player.maxHealth / 2) {
          damage += 2;
        }
        break;
      case 'spell_damage_bonus':
        // Bonus ai maghi senza affidarsi a stringhe nell'effetto
        if (card.class === PlayerClass.WIZARD) {
          damage += 3;
        }
        break;
    }
  });

  return damage;
}

export function calculateDamageWithStatusEffects(damage: number, attackerStatusEffects: any[], defenderStatusEffects: any[], card?: Card): { finalDamage: number; evaded: boolean; consumeEvasive: boolean } {
  let finalDamage = damage;
  let evaded = false;
  let consumeEvasive = false;
  
  // Apply Evasive effect (prevents next damage from Melee/Attack cards)
  const evasiveEffect = defenderStatusEffects.find(effect => effect.type === StatusType.EVASIVE);
  if (evasiveEffect && evasiveEffect.value > 0 && card && (card.types?.includes(CardType.MELEE) || card.types?.includes(CardType.ATTACK))) {
    // Evasive prevents all damage from this attack and consumes 1 stack
    evaded = true;
    finalDamage = 0;
    consumeEvasive = true;
  }
  
  if (!evaded) {
    // Apply Weak effect (reduces damage by 50% if present, does not stack, only for Attack cards)
    const weakEffect = attackerStatusEffects.find(effect => effect.type === StatusType.WEAK);
    if (weakEffect && card && card.types && card.types.includes(CardType.ATTACK)) {
      finalDamage = Math.floor(finalDamage * 0.5);
    }
    
    // Apply Vulnerable effect (increases damage taken by 50% if present)
    const vulnerableEffect = defenderStatusEffects.find(effect => effect.type === StatusType.VULNERABLE);
    if (vulnerableEffect) {
      finalDamage = Math.floor(finalDamage * 1.5);
    }
    
    // Apply Strength effect (increases damage dealt by 3 per stack)
    const strengthEffect = attackerStatusEffects.find(effect => effect.type === StatusType.STRENGTH);
    if (strengthEffect) {
      finalDamage += strengthEffect.value * 3;
    }
    
    // Apply Bleeding effect (reduces damage dealt by 1 per stack for attack cards)
    const bleedingEffect = attackerStatusEffects.find(effect => effect.type === StatusType.BLEEDING);
    if (bleedingEffect) {
      finalDamage = Math.max(0, finalDamage - bleedingEffect.value);
    }
  }
  
  return { finalDamage: Math.max(0, finalDamage), evaded, consumeEvasive };
}

export function applyStatusEffect(
  targetEffects: any[],
  effectType: StatusType,
  value: number,
  duration: number
): any[] {
  const newEffects = [...targetEffects];
  const existingEffect = newEffects.find(effect => effect.type === effectType);

  if (existingEffect) {
    if (effectType === StatusType.BLEEDING) {
      // Bleeding stacks up to 5 maximum
      existingEffect.value = Math.min(5, existingEffect.value + value);
      existingEffect.duration = duration;
    } else if (effectType === StatusType.EVASIVE) {
      // Evasive stacks up to 3 maximum
      existingEffect.value = Math.min(3, existingEffect.value + value);
      existingEffect.duration = duration;
    } else if (effectType === StatusType.WEAK) {
      // Weak does not stack, only refresh duration
      existingEffect.duration = duration;
    } else {
      // Other effects stack and reset duration
      existingEffect.value += value;
      existingEffect.duration = duration;
    }
  } else {
    // Add new effect
    newEffects.push({
      type: effectType,
      value:
        effectType === StatusType.BLEEDING
          ? Math.min(5, value)
          : effectType === StatusType.EVASIVE
          ? Math.min(3, value)
          : value,
      duration
    });
  }

  return newEffects;
}

export function updateStatusEffects(effects: any[]): any[] {
  return effects
    .map(effect => {
      // Bleeding doesn't decrease over time and has max stack of 5
      if (effect.type === StatusType.BLEEDING) {
        return {
          ...effect,
          value: Math.min(5, effect.value) // Cap bleeding at 5 stacks
        };
      }
      // Evasive doesn't decrease over time and has max stack of 3
      if (effect.type === StatusType.EVASIVE) {
        return {
          ...effect,
          value: Math.min(3, effect.value) // Cap evasive at 3 stacks
        };
      }
      // Other effects decrease duration and get removed if duration reaches 0
      return {
        ...effect,
        duration: effect.duration - 1
      };
    })
    .filter(effect => effect.type === StatusType.BLEEDING || effect.type === StatusType.EVASIVE || effect.duration > 0);
}

export function consumeEvasiveStack(targetEffects: any[]): any[] {
  const evasiveEffect = targetEffects.find(effect => effect.type === StatusType.EVASIVE);
  
  if (evasiveEffect && evasiveEffect.value > 0) {
    // Decrease the Evasive stack by 1
    evasiveEffect.value -= 1;
    
    // If Evasive reaches 0, remove the effect entirely
    if (evasiveEffect.value === 0) {
      return targetEffects.filter(effect => effect.type !== StatusType.EVASIVE);
    }
  }
  
  return targetEffects;
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

export function calculateKillingInstinctDamage(card: Card, player: Player, battleState: BattleState): number {
  let damage = card.attack || 0;
  
  // Check if target is bleeding and apply bonus damage
  const bleedingEffect = battleState.opponentStatusEffects.find(effect => effect.type === StatusType.BLEEDING);
  if (bleedingEffect && bleedingEffect.value > 0) {
    damage = 15; // Deal 15 damage instead of base 10 if target is bleeding
  }
  
  // Apply passive effects
  player.passives.forEach(passive => {
    switch (passive.effect) {
      case 'damage_bonus_low_health':
        if (player.health < player.maxHealth / 2) {
          damage += 2;
        }
        break;
      case 'spell_damage_bonus':
        if (card.class === PlayerClass.WIZARD) {
          damage += 3;
        }
        break;
    }
  });

  return damage;
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

export function triggerBeforeDraw(
  side: 'player' | 'opponent',
  battleState: BattleState,
  player: Player,
  opponent: Opponent,
  log: string[]
) {
  // 1) PASSIVES: scan both sides for beforeDraw triggers
  const applyBeforeDrawPassives = (who: 'player' | 'opponent') => {
    const actor = who === 'player' ? player : opponent;
    const oppName = opponent.name;
    const pClass = player.class;

    // NOTE: both players and opponents can have multiple passives now
    const passives = Array.isArray((actor as any).passives) ? (actor as any).passives : [];

    for (const p of passives) {
      switch (p.effect) {
        case 'start_of_turn_coward': {
          // Only triggers for opponent below 50% HP, adds a volatile Cower card
          if (who === 'opponent') {
            const hpPct = opponent.health / opponent.maxHealth;
            if (hpPct < 0.5) {
              const volatileCowerCard: Card = {
                id: `goblin_cower_volatile_${Date.now()}`,
                name: 'Cower',
                description: 'Gain 1 Evasive. Volatile.',
                cost: 0,
                class: OpponentType.MONSTER,
                rarity: Rarity.COMMON,
                types: [CardType.SKILL, CardType.VOLATILE],
                effects: [
                  { code: EffectCode.gain_evasive_self, params: { amount: 1 } }
                ],
                unplayable: false
              };
              battleState.opponentHand.push(volatileCowerCard);
              log.push(
                formatLogText(
                  `${opponent.name}'s Coward passive triggers! Added volatile Cower to hand.`,
                  pClass,
                  oppName
                )
              );
            }
          }
          break;
        }

        // Add other passives that should trigger at beforeDraw here
        // case 'some_before_draw_passive': { ...; break; }
      }
    }
  };

  // Run passives for both sides
  applyBeforeDrawPassives('player');
  applyBeforeDrawPassives('opponent');

  // 2) STATUSES: decrement duration on both sides (remove expired)
  const tickStatuses = (effects: StatusEffect[]) =>
    effects
      .map(e => ({
        ...e,
        // only decrement if it actually has a duration counter
        duration: typeof e.duration === 'number' ? Math.max(0, e.duration - 1) : e.duration
      }))
      // keep if no duration (undefined), or duration > 0, or it’s a special “persistent while value>0” kind
      .filter(e =>
        typeof e.duration !== 'number' || e.duration > 0 || e.type === StatusType.BLEEDING || e.type === StatusType.EVASIVE
      );

  battleState.playerStatusEffects   = tickStatuses(battleState.playerStatusEffects);
  battleState.opponentStatusEffects = tickStatuses(battleState.opponentStatusEffects);
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
  let modifiedCount = baseDrawCount;
  
  // Process 'set' modifications first (they override base value)
  const setModifications = modifications.filter(mod => mod.type === DrawModType.SET);
  if (setModifications.length > 0) {
    // Use the most recent set modification (last in array)
    modifiedCount = setModifications[setModifications.length - 1].value;
  }
  
  // Then process 'add' modifications
  modifications
    .filter(mod => mod.type === DrawModType.ADD)
    .forEach(mod => {
      modifiedCount += mod.value;
    });
  
  // Finally process 'subtract' modifications
  modifications
    .filter(mod => mod.type === DrawModType.SUBTRACT)
    .forEach(mod => {
      modifiedCount = Math.max(0, modifiedCount - mod.value); // Don't go below 0
    });
  
  const finalCount = Math.max(0, modifiedCount); // Ensure we never return negative draw count
  return finalCount;
}

export function formatDrawModificationLog(modifications: DrawModification[], baseDrawCount: number): string {
  if (modifications.length === 0) {
    return '';
  }
  
  const finalCount = calculateModifiedDrawCount(baseDrawCount, modifications);
  
  if (finalCount === baseDrawCount) {
    return '';
  }
  
  // Don't log Dirty Trick modifications - they're already logged separately
  const hasDirtyTrick = modifications.some(mod => mod.source === 'Dirty Trick');
  if (hasDirtyTrick) {
    return '';
  }
  
  const activeSources = modifications.map(mod => mod.source).join(', ');
  
  if (finalCount > baseDrawCount) {
    return `Draw modifications (${activeSources}): Drawing ${finalCount} cards instead of ${baseDrawCount}`;
  } else {
    return `Draw modifications (${activeSources}): Drawing ${finalCount} cards instead of ${baseDrawCount}`;
  }
}

export function calculateRiposteDamage(card: Card, player: Player, battleState: BattleState): number {
  let damage = card.attack || 0;
  
  // Add current block to damage
  damage += battleState.playerBlock;
  
  // Apply passive effects
  player.passives.forEach(passive => {
    switch (passive.effect) {
      case 'damage_bonus_low_health':
        if (player.health < player.maxHealth / 2) {
          damage += 2;
        }
        break;
      case 'spell_damage_bonus':
        if (card.class === PlayerClass.WIZARD) {
          damage += 3;
        }
        break;
    }
  });

  return damage;
}

export function calculateCardBlock(card: Card, player: Player): number {
  let block = card.defense || 0;
  
  // Apply passive effects
  player.passives.forEach(passive => {
    if (passive.effect === 'extra_block') {
      block += 3;
    }
  });

  return block;
}

export function getCardCost(card: Card, player: Player): number {
  let cost = card.cost;
  
  // Apply passive effects
  player.passives.forEach(passive => {
    switch (passive.effect) {
      case 'attack_cost_reduction':
        if (card.attack) {
          cost = Math.max(0, cost - 1);
        }
        break;
    }
  });

  return cost;
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

  // 2) Deduct energy and push to played stack
  if (isPlayer) {
    newBattleState.playerEnergy -= getCardCost(card, newPlayer);
  } else {
    newBattleState.opponentEnergy -= card.cost;
  }
  (newBattleState[played] as Card[]).push(card);

  // 3) Run effects BEFORE damage so they can modify attack/defense
  runCardEffects(
    card as Card & { effects?: EffectInstance[] },
    { side, player: newPlayer, opponent: newOpponent, state: newBattleState, log },
    log
  );

  // 4) Apply ATTACK (damage last)
  if (card.attack) {
    let pendingDamage = Math.max(0, card.attack || 0);
    const defenderSE = isPlayer ? newBattleState.opponentStatusEffects : newBattleState.playerStatusEffects;
    const isAttackCard = card.types?.includes(CardType.MELEE) || card.types?.includes(CardType.ATTACK);
    const evasive = defenderSE.find(e => e.type === StatusType.EVASIVE && e.value > 0);
    if (isAttackCard && evasive && pendingDamage > 0) {
      if (isPlayer) {
        log.push(formatLogText(`${newOpponent.name}'s Evasive prevented damage from player's ${card.name}`, newPlayer.class, newOpponent.name, card.name));
        newBattleState.opponentStatusEffects = consumeEvasiveStack(newBattleState.opponentStatusEffects);
      } else {
        log.push(formatLogText(`${newPlayer.class}'s Evasive prevented damage from ${newOpponent.name}'s ${card.name}`, newPlayer.class, newOpponent.name, card.name));
        newBattleState.playerStatusEffects = consumeEvasiveStack(newBattleState.playerStatusEffects);
      }
      pendingDamage = 0;
    }

    if (pendingDamage > 0) {
      if (isPlayer) {
        // apply to opponent
        if (newBattleState.opponentBlock > 0) {
          if (newBattleState.opponentBlock >= pendingDamage) {
            newBattleState.opponentBlock -= pendingDamage;
            log.push(formatLogText(`Player deals ${pendingDamage} damage to ${newOpponent.name}'s block with ${card.name}`, newPlayer.class, newOpponent.name, card.name));
            pendingDamage = 0;
          } else {
            const through = pendingDamage - newBattleState.opponentBlock;
            newBattleState.opponentBlock = 0;
            newOpponent.health = Math.max(0, newOpponent.health - through);
            log.push(formatLogText(`Player breaks ${newOpponent.name}'s block and deals ${through} damage with ${card.name}`, newPlayer.class, newOpponent.name, card.name));
            pendingDamage = 0;
          }
        } else {
          newOpponent.health = Math.max(0, newOpponent.health - pendingDamage);
          log.push(formatLogText(`Player deals ${pendingDamage} damage with ${card.name}`, newPlayer.class, newOpponent.name, card.name));
          pendingDamage = 0;
        }
      } else {
        // apply to player
        if (newBattleState.playerBlock > 0) {
          if (newBattleState.playerBlock >= pendingDamage) {
            newBattleState.playerBlock -= pendingDamage;
            log.push(formatLogText(`${newOpponent.name} deals ${pendingDamage} damage to ${newPlayer.class}'s block with ${card.name}`, newPlayer.class, newOpponent.name, card.name));
            pendingDamage = 0;
          } else {
            const through = pendingDamage - newBattleState.playerBlock;
            newBattleState.playerBlock = 0;
            newPlayer.health = Math.max(0, newPlayer.health - through);
            log.push(formatLogText(`${newOpponent.name} breaks ${newPlayer.class}'s block and deals ${through} damage with ${card.name}`, newPlayer.class, newOpponent.name, card.name));
            pendingDamage = 0;
          }
        } else {
          newPlayer.health = Math.max(0, newPlayer.health - pendingDamage);
          log.push(formatLogText(`${newOpponent.name} deals ${pendingDamage} damage with ${card.name}`, newPlayer.class, newOpponent.name, card.name));
          pendingDamage = 0;
        }
      }
    }
  }

  // 5) Apply DEFENSE
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
  dbg('=== OPPONENT PLAY CARD FUNCTION CALLED ===');
  dbg('This is the CORRECT function with Call the Pack handling!');
  dbg('Specific card to play:', specificCard?.name);
  
  const log: string[] = [];
  let currentPlayer = { ...player };
  let currentOpponent = { ...opponent };
  let currentBattleState = { ...battleState };
  let remainingEnergy = 2; // Opponent has 2 energy
  
  // Get the opponent's playable cards
  const playableCards = currentBattleState.opponentHand.filter(card => {
    return !card.unplayable && card.cost <= remainingEnergy;
  });
  
  // If a specific card is provided, use that one instead of prioritizing
  let cardToPlay: Card | undefined;
  
  if (specificCard) {
    // Verify the specific card is actually playable
    cardToPlay = playableCards.find(card => card.id === specificCard.id);
    dbg('Looking for specific card:', specificCard.name, 'Found:', cardToPlay?.name);
  }
  
  // If no specific card or specific card not found, use prioritization logic
  if (!cardToPlay) {
    dbg('=== OPPONENT CALL THE PACK DEBUG ===');
    dbg('Playable cards:', playableCards.map(c => ({ name: c.name, id: c.id })));
    
    cardToPlay = playableCards.find(card => {
      dbg('Checking card:', card.name, card.id);
      dbg('Name includes "call the pack":', card.name?.toLowerCase().includes('call the pack'));
      dbg('ID matches call_pack:', card.id === 'call_pack');
      dbg('ID matches beast_pack_mentality:', card.id === 'beast_pack_mentality');
      return (card.name && card.name.toLowerCase().includes('call the pack')) || 
             (card.id && (card.id === 'call_pack' || card.id === 'beast_pack_mentality'));
    });
    
    dbg('Call the Pack card found:', cardToPlay);
    
    // If no Call the Pack card, just play the first playable card
    if (!cardToPlay && playableCards.length > 0) {
      cardToPlay = playableCards[0];
      dbg('No Call the Pack found, playing first card:', cardToPlay.name);
    }
  }
  
  // If no card can be played, return current state
  if (!cardToPlay) {
    dbg('No card to play, returning current state');
    return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
  }
  
  // Since this is the AI combination mode (no specific card), play using combination logic
  dbg('🤖 AI combination mode - playing optimal combinations...');
  const lastTurnDamagePrevented = currentBattleState.battleLog.some(logEntry => 
    logEntry.includes("'s Evasive prevented") && logEntry.includes("from")
  );
  
  dbg('=== BOOBY TRAP DEBUG ===');
  dbg('Last turn damage prevented:', lastTurnDamagePrevented);
  dbg('Total battle log entries:', currentBattleState.battleLog.length);
  dbg('Battle log entries:', currentBattleState.battleLog);
  dbg('Checking for Evasive logs:', currentBattleState.battleLog.filter(log => log.includes('Evasive')));
  dbg('Looking for patterns: "' + "'s Evasive prevented" + '" and "' + "from" + '"');
  dbg('Direct string check results:');
  currentBattleState.battleLog.forEach((log, index) => {
    const hasEvasive = log.includes("'s Evasive prevented") && log.includes("from");
    dbg(`[${index}]: "${log}" -> contains patterns: ${hasEvasive}`);
  });
  dbg('=== END BOOBY TRAP DEBUG ===');
  
  // If a specific card is provided, play just that card (respect the component's choice)
  if (specificCard) {
    dbg('🎯 Playing specific card as requested by component:', specificCard.name);
    
    // Verify the specific card is actually playable
    const foundCard = playableCards.find(card => card.id === specificCard.id);
    if (!foundCard) {
      dbg('❌ Specific card not found in playable cards:', specificCard.name);
      return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
    }
    
    if (foundCard.cost > remainingEnergy) {
      dbg('❌ Not enough energy for specific card:', foundCard.name, 'Cost:', foundCard.cost, 'Energy:', remainingEnergy);
      return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
    }
    
    dbg('✅ Playing specific card:', foundCard.name);
    
    // Play just this one card
    return playSingleOpponentCard(foundCard, currentOpponent, currentPlayer, currentBattleState, remainingEnergy, log);
  }
  
  // If no specific card, use AI combination logic for full turn
  dbg('🤖 No specific card provided, using AI combination logic...');
  
  // Function to calculate combination score (prefers multiple cards)
  const calculateCombinationScore = (cards: Card[], totalCost: number): number => {
    let score = 0;
    
    // Strongly prefer combinations with multiple cards
    if (cards.length > 1) {
      score += 1000; // Huge bonus for playing multiple cards
    }
    
    // Add individual card priorities
    cards.forEach(card => {
      score += getCardPriority(card);
    });
    
    // Bonus for using more energy (efficiency)
    score += totalCost * 10;
    
    // Bonus for having diverse card types
    const uniqueTypes = new Set(cards.flatMap(card => card.types || []));
    if (uniqueTypes.size > 1) {
      score += 50;
    }
    
    return score;
  };
  
  // Get all playable cards (cost <= remaining energy and meets play conditions)
  const getPlayableCards = (hand: Card[], energy: number) => {
    return hand.filter(card => 
      card.cost <= energy && 
      !card.unplayable && 
      canPlayCardWithConditions(card, currentBattleState, lastTurnDamagePrevented)
    );
  };
  
  // Function to get card priority score
  const getCardPriority = (card: Card): number => {
    // Higher score = higher priority
    let priority = 0;
    
    // 1: Special condition cards when conditions are met - ULTRA HIGH PRIORITY (almost mandatory)
    if (battleState) {
      // Check if damage was prevented last turn (look for Evasive logs in battleLog)
      const lastTurnDamagePrevented = battleState.battleLog.some(logEntry => 
        logEntry.includes("'s Evasive prevented") && logEntry.includes("from")
      );
      
      // Booby Trap - ultra high priority if condition met
      if (card.id === 'goblin_booby_trap' && lastTurnDamagePrevented) {
        priority += 2000; // Ultra high priority - almost mandatory
      }
      
      // Killing Instinct - ultra high priority if target is bleeding
      if (card.id === 'beast_hunters_instinct') {
        const bleedingEffect = currentBattleState.playerStatusEffects.find(effect => effect.type === StatusType.BLEEDING);
        if (bleedingEffect && bleedingEffect.value > 0) {
          priority += 2000; // Ultra high priority - almost mandatory
        }
      }
      
      // Rogue Backstab - ultra high priority if it's the first card
      if (card.id === 'rogue_backstab' && currentBattleState.opponentPlayedCards.length === 0) {
        priority += 2000; // Ultra high priority when condition met
      }
      
      // Wizard Arcane Power - high priority if player has spell cards
      if (card.id === 'wizard_arcane_power') {
        const hasSpellCards = currentBattleState.opponentHand.some(c => 
          c.class === PlayerClass.WIZARD && c.types && c.types.includes(CardType.ATTACK)
        );
        if (hasSpellCards) {
          priority += 1500; // Very high priority when useful
        }
      }
    }
    
    // 2: Volatile card - HIGH PRIORITY (but conditional for Goblin Hunter)
    if (card.types && card.types.includes(CardType.VOLATILE)) {
      // For Cower cards, only prioritize if health is low
      if (card.id === 'goblin_cower_volatile') {
        const opponentHealthPercent = currentOpponent.health / currentOpponent.maxHealth;
        if (opponentHealthPercent < 0.5) {
          priority += 1000; // High priority when health is low
        } else {
          priority += 200; // Low priority when health is high
        }
      } else {
        priority += 800; // Normal volatile priority for other cards
      }
    }
    
    // 3: More card possible (cards that enable multi-card plays) - MEDIUM-HIGH PRIORITY
    if (card.cost <= 1) {
      priority += 600; // Low cost cards enable playing more cards
    }
    
    // 4: Non attack cards - MEDIUM PRIORITY
    if (card.types && !card.types.includes(CardType.ATTACK)) {
      priority += 400;
    }
    
    // 5: Attack card with effect - MEDIUM-LOW PRIORITY
    if (card.types && card.types.includes(CardType.ATTACK) && card.effects && card.effects.length > 0) {
      priority += 200;
    }
    
    // 6: Simple damage attack card - LOWEST PRIORITY
    if (card.types && card.types.includes(CardType.ATTACK) && (!card.effects || card.effects.length === 0)) {
      priority += 0;
    }
    
    // Additional modifiers for better decision making
    // Special cards (rare) get high priority
    if (card.rarity === Rarity.RARE || card.rarity === Rarity.SPECIAL) {
      priority += 50;
    }
    
    // Goblin Hunter specific adjustments
    if (card.id === 'goblin_cower') {
      const opponentHealthPercent = currentOpponent.health / currentOpponent.maxHealth;
      if (opponentHealthPercent < 0.3) {
        priority += 600; // High priority when health is very low
      } else if (opponentHealthPercent < 0.5) {
        priority += 300; // Medium priority when health is low
      } else {
        priority += 100; // Low priority when health is high
      }
    }
    
    // Lower cost cards get slight priority (for playing more cards)
    priority += (3 - card.cost) * 5;
    
    return priority;
  };
  
  // Sort cards by priority (highest first)
  const sortCardsByPriority = (cards: Card[]) => {
    return [...cards].sort((a, b) => getCardPriority(b) - getCardPriority(a));
  };
  
  // Try to find the best combination for the entire turn (maximize multi-card plays)
  const findBestTurnCombination = () => {
    const playableCards = getPlayableCards(currentBattleState.opponentHand, remainingEnergy);
    
    if (playableCards.length === 0) {
      return { combination: [], energyUsed: 0 };
    }
    
    const sortedCards = sortCardsByPriority(playableCards);
    let bestCombination: Card[] = [];
    let bestEnergyUsed = 0;
    let bestScore = 0;
    
    // Try two-card combinations first (STRONGLY PREFERRED)
    for (let i = 0; i < sortedCards.length; i++) {
      for (let j = i + 1; j < sortedCards.length; j++) {
        const totalCost = sortedCards[i].cost + sortedCards[j].cost;
        if (totalCost <= remainingEnergy) {
          const combinationScore = calculateCombinationScore([sortedCards[i], sortedCards[j]], totalCost);
          if (combinationScore > bestScore) {
            bestCombination = [sortedCards[i], sortedCards[j]];
            bestEnergyUsed = totalCost;
            bestScore = combinationScore;
          }
        }
      }
    }
    
    // Only try single cards if no two-card combination found
    if (bestCombination.length === 0) {
      for (const card of sortedCards) {
        if (card.cost <= remainingEnergy) {
          const combinationScore = calculateCombinationScore([card], card.cost);
          if (combinationScore > bestScore) {
            bestCombination = [card];
            bestEnergyUsed = card.cost;
            bestScore = combinationScore;
          }
        }
      }
    }
    
    return { combination: bestCombination, energyUsed: bestEnergyUsed };
  };
  
  // Play cards in optimal combinations
  while (remainingEnergy > 0) {
    const { combination, energyUsed } = findBestTurnCombination();
    
    if (combination.length === 0) {
      dbg('No more playable cards with remaining energy:', remainingEnergy);
      break;
    }
    
    dbg('Playing combination:', combination.map(c => c.name), 'Energy used:', energyUsed);
    
    // Play the selected combination
    for (const cardToPlay of combination) {
      dbg('Playing card:', cardToPlay);
      const result = playOneCard('opponent', cardToPlay, currentPlayer, currentOpponent, currentBattleState, log);
      currentPlayer = result.newPlayer;
      currentOpponent = result.newOpponent;
      currentBattleState = result.newBattleState;
      // Update remainingEnergy from battle state to stay in sync with helper deductions
      remainingEnergy = currentBattleState.opponentEnergy;
    }
  }
  
  if (log.length === 0) {
    log.push(formatLogText('Opponent skips turn', player.class, opponent.name));
  }
  
  return { newPlayer: currentPlayer, newOpponent: currentOpponent, newBattleState: currentBattleState, log };
}

export function playOpponentCard(
  opponent: Opponent, 
  player: Player, 
  battleState: BattleState,
  cardToPlay: Card
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState; log: string[] } {
  const log: string[] = [];
  return playSingleOpponentCard(cardToPlay, opponent, player, battleState, battleState.opponentEnergy, log);
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

export function applyBleedingDamage(
  targetEffects: any[], 
  targetHealth: number, 
  targetName: string, 
  isPlayer: boolean,
  playerClass: PlayerClass = PlayerClass.WARRIOR,
  opponentName: string = 'Alpha Wolf'
): { newHealth: number; logMessages: string[] } {
  const logMessages: string[] = [];
  let newHealth = targetHealth;
  
  const bleedingEffect = targetEffects.find(effect => effect.type === StatusType.BLEEDING);
  if (bleedingEffect && bleedingEffect.value > 0) {
    const damage = bleedingEffect.value;
    newHealth = Math.max(0, targetHealth - damage);
    
    if (isPlayer) {
      logMessages.push(formatLogText(`${playerClass} takes ${damage} bleeding damage`, playerClass, opponentName));
    } else {
      logMessages.push(formatLogText(`${opponentName} takes ${damage} bleeding damage`, playerClass, opponentName));
    }
  }
  
  return { newHealth, logMessages };
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

    // Start of opponent turn - apply bleeding damage to opponent
    const opponentBleedingResult = applyBleedingDamage(
      newBattleState.opponentStatusEffects,
      newOpponent.health,
      newOpponent.name,
      false,
      newPlayer.class,
      newOpponent.name
    );
    newOpponent.health = opponentBleedingResult.newHealth;
    log.push(...opponentBleedingResult.logMessages);

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

    // Calculate modified draw count based on active modifications
    const baseDrawCount = 3;
    const cardsToDraw = calculateModifiedDrawCount(baseDrawCount, newBattleState.opponentDrawModifications);

    const drawResult = drawCardsWithMinionEffects(
      newBattleState.opponentDeck,
      newBattleState.opponentDiscardPile,
      cardsToDraw,
      'opponent',
      newPlayer.class,
      newOpponent.name
    );
    newBattleState.opponentHand = [...newBattleState.opponentHand, ...drawResult.drawnCards];
    newBattleState.opponentDeck = drawResult.updatedDeck;
    newBattleState.opponentDiscardPile = drawResult.updatedDiscardPile;

    // Enforce hand size limit for opponent (max 7 cards)
    if (newBattleState.opponentHand.length > 7) {
      const excessCards = newBattleState.opponentHand.length - 7;
      const cardsToDiscard = newBattleState.opponentHand.splice(7, excessCards);
      newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, ...cardsToDiscard];

      // Burn volatile cards that were discarded
      const opponentOverflowVolatileCardsBurned = cardsToDiscard.filter(card =>
        card.types && card.types.includes(CardType.VOLATILE)
      );

      if (opponentOverflowVolatileCardsBurned.length > 0) {
        log.push(formatLogText(`${newOpponent.name} burned ${opponentOverflowVolatileCardsBurned.length} volatile card(s) from hand overflow.`, newPlayer.class, newOpponent.name));
      }

      // Note: Non-volatile discarded cards are not logged for opponent
    }

    // Apply damage from Wolf minions if any
    if (drawResult.minionDamageLog.length > 0) {
      // Calculate total damage from Wolf minions
      const wolfDamage = drawResult.minionDamageLog.length * 5; // Each Wolf deals 5 damage
      newOpponent.health = Math.max(0, newOpponent.health - wolfDamage);
    }

    log.push(...drawResult.minionDamageLog);

    dbg(`Opponent drew ${drawResult.drawnCards.length} cards`);
  } else {
    // End of opponent turn - discard all cards in hand and reset block
    const cardsToDiscard = [...newBattleState.opponentHand];
    newBattleState.opponentHand = [];
    newBattleState.opponentBlock = 0; // Reset opponent block at end of turn

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

    // Handle persistent block - only reset if Shield Up wasn't played
    if (!newBattleState.playerPersistentBlock) {
      newBattleState.playerBlock = 0; // Reset player block at start of new player turn
    } else {
      log.push(formatLogText('Player\'s block persists due to Shield Up effect', newPlayer.class, newOpponent.name));
      newBattleState.playerPersistentBlock = false; // Reset the flag for next time
    }

    // Start of player turn - apply bleeding damage to player
    const playerBleedingResult = applyBleedingDamage(
      newBattleState.playerStatusEffects,
      newPlayer.health,
      newPlayer.class,
      true,
      newPlayer.class,
      newOpponent.name
    );
    newPlayer.health = playerBleedingResult.newHealth;
    log.push(...playerBleedingResult.logMessages);

    // Start of player turn - draw cards with proper reshuffle logic
    // Calculate modified draw count based on active modifications
    const baseDrawCount = 3;
    const cardsToDraw = calculateModifiedDrawCount(baseDrawCount, newBattleState.playerDrawModifications);

    // Generate log message for draw modifications if any
    const drawModificationLog = formatDrawModificationLog(newBattleState.playerDrawModifications, baseDrawCount);

    const drawResult = drawCardsWithMinionEffects(
      newBattleState.playerDeck,
      newBattleState.playerDiscardPile,
      cardsToDraw,
      'player',
      newPlayer.class,
      newOpponent.name
    );
    newBattleState.playerHand = [...newBattleState.playerHand, ...drawResult.drawnCards];
    newBattleState.playerDeck = drawResult.updatedDeck;
    newBattleState.playerDiscardPile = drawResult.updatedDiscardPile;

    // Add draw modification log if there were any active modifications
    if (drawModificationLog) {
      log.push(formatLogText(drawModificationLog, newPlayer.class, newOpponent.name));
    }

    // Apply damage from Wolf minions if any
    if (drawResult.minionDamageLog.length > 0) {
      // Calculate total damage from Wolf minions
      const wolfDamage = drawResult.minionDamageLog.length * 5; // Each Wolf deals 5 damage
      newPlayer.health = Math.max(0, newPlayer.health - wolfDamage);
    }

    log.push(...drawResult.minionDamageLog);

    dbg(`Player drew ${drawResult.drawnCards.length} cards`);

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

export function getRandomPassives(playerClass: PlayerClass, count: number = 3): any[] {
  const classPassives = passives[playerClass];
  const selectedPassives: any[] = [];

  for (let i = 0; i < count && i < classPassives.length; i++) {
    const randomIndex = Math.floor(Math.random() * classPassives.length);
    selectedPassives.push(classPassives[randomIndex]);
    classPassives.splice(randomIndex, 1);
  }

  return selectedPassives;
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