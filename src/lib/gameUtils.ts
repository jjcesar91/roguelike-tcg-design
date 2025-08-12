import { dbg } from '@/lib/debug';
import { Card, Player, Opponent, BattleState, PlayerClass, GameState, Deck, CardType, DrawModification } from '@/types/game';
import * as gameData from '@/data/gameData';

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

export function getRandomOpponent(difficulty: 'basic' | 'medium' | 'boss'): Opponent {
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
  dbg('Opponent passive:', opponent.passive);
  
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
  const hasAmbush = opponent.passive && opponent.passive.effect === 'opponent_goes_first';
  dbg('Opponent has ambush:', hasAmbush);
  
  // Determine who goes first
  const firstTurn = hasAmbush ? 'opponent' : 'player';
  dbg('First turn:', firstTurn);
  
  // Draw initial hands
  const playerHand: Card[] = [];
  let opponentHand: Card[] = [];
  let opponentDrawResult: any = { drawnCards: [], minionDamageLog: [] };
  
  if (hasAmbush) {
    // For ambush, opponent starts with empty hand and will draw during their turn
    opponentHand = [];
  } else {
    // Normal case: opponent draws initial 3 cards
    opponentDrawResult = drawCardsWithMinionEffects(opponentDeckCopy, [], 3, 'opponent', player.class, opponent.name);
    opponentHand = opponentDrawResult.drawnCards;
  }
  
  // Create battle log with appropriate message based on who goes first
  const battleLog: string[] = [
    formatLogText('Battle started!', player.class, opponent.name), 
    formatLogText(`${player.class} vs ${opponent.name}`, player.class, opponent.name)
  ];
  
  if (hasAmbush) {
    battleLog.push(formatLogText(`${opponent.name} uses Ambush and strikes first!`, player.class, opponent.name));
  } else {
    battleLog.push(formatLogText('Player draws 3 cards...', player.class, opponent.name));
    // Add minion damage log if any (for normal case)
    battleLog.push(...opponentDrawResult.minionDamageLog);
  }
  
  return {
    playerHand,
    playerEnergy: player.maxEnergy,
    opponentEnergy: 2, // Opponent always has 2 energy
    opponentHand,
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
        if (card.effect?.includes('spell') || card.class === 'wizard') {
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
  const evasiveEffect = defenderStatusEffects.find(effect => effect.type === 'evasive');
  if (evasiveEffect && evasiveEffect.value > 0 && card && (card.types?.includes('melee') || card.types?.includes('attack'))) {
    // Evasive prevents all damage from this attack and consumes 1 stack
    evaded = true;
    finalDamage = 0;
    consumeEvasive = true;
  }
  
  if (!evaded) {
    // Apply Weak effect (reduces damage by 50% if present, does not stack, only for Attack cards)
    const weakEffect = attackerStatusEffects.find(effect => effect.type === 'weak');
    if (weakEffect && card && card.types && card.types.includes('attack')) {
      finalDamage = Math.floor(finalDamage * 0.5);
    }
    
    // Apply Vulnerable effect (increases damage taken by 50% if present)
    const vulnerableEffect = defenderStatusEffects.find(effect => effect.type === 'vulnerable');
    if (vulnerableEffect) {
      finalDamage = Math.floor(finalDamage * 1.5);
    }
    
    // Apply Strength effect (increases damage dealt by 3 per stack)
    const strengthEffect = attackerStatusEffects.find(effect => effect.type === 'strength');
    if (strengthEffect) {
      finalDamage += strengthEffect.value * 3;
    }
    
    // Apply Bleeding effect (reduces damage dealt by 1 per stack for attack cards)
    const bleedingEffect = attackerStatusEffects.find(effect => effect.type === 'bleeding');
    if (bleedingEffect) {
      finalDamage = Math.max(0, finalDamage - bleedingEffect.value);
    }
  }
  
  return { finalDamage: Math.max(0, finalDamage), evaded, consumeEvasive };
}

export function applyStatusEffect(targetEffects: any[], effectType: string, value: number, duration: number): any[] {
  const newEffects = [...targetEffects];
  const existingEffect = newEffects.find(effect => effect.type === effectType);
  
  if (existingEffect) {
    if (effectType === 'bleeding') {
      // Bleeding stacks up to 5 maximum
      existingEffect.value = Math.min(5, existingEffect.value + value);
      // Bleeding doesn't use duration, but we'll keep it for consistency
      existingEffect.duration = duration;
    } else if (effectType === 'evasive') {
      // Evasive stacks up to 3 maximum
      existingEffect.value = Math.min(3, existingEffect.value + value);
      // Evasive doesn't use duration for consumption, but we'll keep it for consistency
      existingEffect.duration = duration;
    } else if (effectType === 'weak') {
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
      value: effectType === 'bleeding' ? Math.min(5, value) : effectType === 'evasive' ? Math.min(3, value) : value,
      duration: duration
    });
  }
  
  return newEffects;
}

export function updateStatusEffects(effects: any[]): any[] {
  return effects
    .map(effect => {
      // Bleeding doesn't decrease over time and has max stack of 5
      if (effect.type === 'bleeding') {
        return {
          ...effect,
          value: Math.min(5, effect.value) // Cap bleeding at 5 stacks
        };
      }
      // Evasive doesn't decrease over time and has max stack of 3
      if (effect.type === 'evasive') {
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
    .filter(effect => effect.type === 'bleeding' || effect.type === 'evasive' || effect.duration > 0);
}

export function consumeEvasiveStack(targetEffects: any[]): any[] {
  const evasiveEffect = targetEffects.find(effect => effect.type === 'evasive');
  
  if (evasiveEffect && evasiveEffect.value > 0) {
    // Decrease the Evasive stack by 1
    evasiveEffect.value -= 1;
    
    // If Evasive reaches 0, remove the effect entirely
    if (evasiveEffect.value === 0) {
      return targetEffects.filter(effect => effect.type !== 'evasive');
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

export function createWolfMinionCards(): Card[] {
  dbg('=== CREATE WOLF MINION CARDS DEBUG ===');
  // Create 2 Wolf minion cards
  const wolfMinions = [
    {
      id: 'beast_wolf_minion_1',
      name: 'Wolf',
      description: 'Unplayable minion. Deal 5 damage to player when drawn.',
      cost: 0,
      attack: 5,
      effect: 'Deal damage when drawn',
      class: 'beast',
      rarity: 'special',
      types: [CardType.MINION],
      unplayable: true
    },
    {
      id: 'beast_wolf_minion_2',
      name: 'Wolf',
      description: 'Unplayable minion. Deal 5 damage to player when drawn.',
      cost: 0,
      attack: 5,
      effect: 'Deal damage when drawn',
      class: 'beast',
      rarity: 'special',
      types: [CardType.MINION],
      unplayable: true
    }
  ];
  dbg('Created wolf minions:', wolfMinions);
  dbg('=== CREATE WOLF MINION CARDS COMPLETE ===');
  return wolfMinions;
}

export function formatCardDescription(description: string): string {
  // Handle undefined or empty description
  if (!description) {
    return '';
  }
  
  // Remove "Unplayable minion. " prefix from minion card descriptions
  const minionPrefixMatch = description.match(/^Unplayable minion\. (.+)$/);
  if (minionPrefixMatch) {
    description = minionPrefixMatch[1];
  }
  
  // Convert "Apply X weak" to "Apply Y weak" where Y is the number of player turns
  const weakMatch = description.match(/Apply (\d+) weak/i);
  if (weakMatch) {
    const totalTurns = parseInt(weakMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2); // Convert to player turns (round up)
    return description.replace(/Apply (\d+) weak/i, `Apply ${playerTurns} weak`);
  }
  
  // Convert "Apply X vulnerable" to "Apply Y vulnerable" 
  const vulnerableMatch = description.match(/Apply (\d+) vulnerable/i);
  if (vulnerableMatch) {
    const totalTurns = parseInt(vulnerableMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2);
    return description.replace(/Apply (\d+) vulnerable/i, `Apply ${playerTurns} vulnerable`);
  }
  
  // Convert "Apply X strength" to "Apply Y strength"
  const strengthMatch = description.match(/Apply (\d+) strength/i);
  if (strengthMatch) {
    const totalTurns = parseInt(strengthMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2);
    return description.replace(/Apply (\d+) strength/i, `Apply ${playerTurns} strength`);
  }
  
  // Convert "Apply X dexterity" to "Apply Y dexterity"
  const dexterityMatch = description.match(/Apply (\d+) dexterity/i);
  if (dexterityMatch) {
    const totalTurns = parseInt(dexterityMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2);
    return description.replace(/Apply (\d+) dexterity/i, `Apply ${playerTurns} dexterity`);
  }
  
  return description;
}

export function formatCardEffect(effectText: string): string {
  // Convert "Apply X weak" to "Apply Y weak" where Y is the number of player turns
  const weakMatch = effectText.match(/Apply (\d+) weak/i);
  if (weakMatch) {
    const totalTurns = parseInt(weakMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2); // Convert to player turns (round up)
    return effectText.replace(/Apply (\d+) weak/i, `Apply ${playerTurns} weak`);
  }
  
  // Convert "Apply X vulnerable" to "Apply Y vulnerable" 
  const vulnerableMatch = effectText.match(/Apply (\d+) vulnerable/i);
  if (vulnerableMatch) {
    const totalTurns = parseInt(vulnerableMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2);
    return effectText.replace(/Apply (\d+) vulnerable/i, `Apply ${playerTurns} vulnerable`);
  }
  
  // Convert "Apply X strength" to "Apply Y strength"
  const strengthMatch = effectText.match(/Apply (\d+) strength/i);
  if (strengthMatch) {
    const totalTurns = parseInt(strengthMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2);
    return effectText.replace(/Apply (\d+) strength/i, `Apply ${playerTurns} strength`);
  }
  
  // Convert "Apply X dexterity" to "Apply Y dexterity"
  const dexterityMatch = effectText.match(/Apply (\d+) dexterity/i);
  if (dexterityMatch) {
    const totalTurns = parseInt(dexterityMatch[1]);
    const playerTurns = Math.ceil(totalTurns / 2);
    return effectText.replace(/Apply (\d+) dexterity/i, `Apply ${playerTurns} dexterity`);
  }
  
  return effectText;
}

export function getStatusDisplayDuration(effectType: string, duration: number): number {
  // Convert total duration to player turns for display
  return Math.ceil(duration / 2);
}

export function getActualDurationFromDisplay(displayDuration: number): number {
  // Convert displayed player turns back to actual total duration
  return displayDuration * 2;
}

export function parseCardEffect(effectText: string): { type: string; value: number; target: string } | null {
  const weakMatch = effectText.match(/Apply (\d+) weak/i);
  const vulnerableMatch = effectText.match(/Apply (\d+) vulnerable/i);
  const strengthMatch = effectText.match(/Apply (\d+) strength/i);
  const dexterityMatch = effectText.match(/Apply (\d+) dexterity/i);
  const bleedMatch = effectText.match(/Apply bleed (\d+)/i);
  
  if (weakMatch) {
    return { type: 'weak', value: parseInt(weakMatch[1]), target: 'opponent' };
  }
  if (vulnerableMatch) {
    return { type: 'vulnerable', value: parseInt(vulnerableMatch[1]), target: 'opponent' };
  }
  if (strengthMatch) {
    return { type: 'strength', value: parseInt(strengthMatch[1]), target: 'player' };
  }
  if (dexterityMatch) {
    return { type: 'dexterity', value: parseInt(dexterityMatch[1]), target: 'player' };
  }
  if (bleedMatch) {
    return { type: 'bleeding', value: parseInt(bleedMatch[1]), target: 'opponent' };
  }
  
  return null;
}

export function parseFormattedCardEffect(effectText: string): { type: string; value: number; target: string } | null {
  // Parse the formatted effect text (which shows display durations)
  const formattedEffectText = formatCardEffect(effectText);
  return parseCardEffect(formattedEffectText);
}

export function hasSpecialEffect(card: Card): boolean {
  return card.effect === 'Damage + current block' || card.effect === 'Persistent block' || card.effect === 'Bonus damage vs bleeding';
}

export function calculateKillingInstinctDamage(card: Card, player: Player, battleState: BattleState): number {
  let damage = card.attack || 0;
  
  // Check if target is bleeding and apply bonus damage
  const bleedingEffect = battleState.opponentStatusEffects.find(effect => effect.type === 'bleeding');
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
        if (card.effect?.includes('spell') || card.class === 'wizard') {
          damage += 3;
        }
        break;
    }
  });

  return damage;
}

export function addDrawModification(
  modifications: DrawModification[],
  type: 'add' | 'subtract' | 'set',
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

export function triggerStartOfTurnEffects(character: Player | Opponent, battleState: BattleState, turnOwner: 'player' | 'opponent'): string[] {
  const log: string[] = [];
  
  // Clear Evasive stacks at the start of the turn
  const targetEffects = turnOwner === 'player' ? battleState.playerStatusEffects : battleState.opponentStatusEffects;
  const evasiveEffect = targetEffects.find(effect => effect.type === 'evasive');
  
  if (evasiveEffect && evasiveEffect.value > 0) {
    const evasiveCount = evasiveEffect.value;
    // Remove all Evasive stacks
    const updatedEffects = targetEffects.filter(effect => effect.type !== 'evasive');
    
    if (turnOwner === 'player') {
      battleState.playerStatusEffects = updatedEffects;
    } else {
      battleState.opponentStatusEffects = updatedEffects;
    }
    
    log.push(formatLogText(`${turnOwner === 'player' ? character.class : character.name} lost ${evasiveCount} Evasive at start of turn.`, 
      turnOwner === 'player' ? character.class : character.name, 
      turnOwner === 'player' ? character.name : character.class));
  }
  
  // Check if character has the Coward passive and it's their turn
  if (character.passive && character.passive.effect === 'start_of_turn_coward' && turnOwner === 'opponent') {
    const healthPercentage = character.health / character.maxHealth;
    
    if (healthPercentage < 0.5) {
      // Create volatile Cower card and add to hand
      const volatileCowerCard = {
        id: 'goblin_cower_volatile',
        name: 'Cower',
        description: 'Gain 1 Evasive. Volatile.',
        cost: 0,
        effect: 'Gain 1 Evasive',
        class: 'monster',
        rarity: 'common',
        types: [CardType.SKILL, CardType.VOLATILE]
      };
      
      battleState.opponentHand.push(volatileCowerCard);
      log.push(formatLogText(`${character.name}'s Coward passive triggers! Added volatile Cower to hand.`, 
        turnOwner === 'player' ? character.class : character.name, 
        turnOwner === 'player' ? character.name : character.class));
    }
  }
  
  return log;
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
  const setModifications = modifications.filter(mod => mod.type === 'set');
  if (setModifications.length > 0) {
    // Use the most recent set modification (last in array)
    modifiedCount = setModifications[setModifications.length - 1].value;
  }
  
  // Then process 'add' modifications
  modifications
    .filter(mod => mod.type === 'add')
    .forEach(mod => {
      modifiedCount += mod.value;
    });
  
  // Finally process 'subtract' modifications
  modifications
    .filter(mod => mod.type === 'subtract')
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
        if (card.effect?.includes('spell') || card.class === 'wizard') {
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
export function formatLogText(text: string, playerClass: string = 'warrior', opponentName: string = 'Alpha Wolf', cardName: string = ''): string {
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

export function playCard(
  card: Card, 
  player: Player, 
  opponent: Opponent, 
  battleState: BattleState
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState; log: string[] } {
  const log: string[] = [];
  const cost = getCardCost(card, player);
  
  // Special handling for Call the Pack - handle it immediately and directly
  dbg('=== CALL THE PACK DEBUG ===');
  dbg('Card being played:', card);
  dbg('Card name:', card.name);
  dbg('Card ID:', card.id);
  dbg('Card name lowercase:', card.name?.toLowerCase());
  dbg('Includes "call the pack":', card.name?.toLowerCase().includes('call the pack'));
  dbg('ID check - call_pack:', card.id === 'call_pack');
  dbg('ID check - beast_pack_mentality:', card.id === 'beast_pack_mentality');
  
  if ((card.name && card.name.toLowerCase().includes('call the pack')) || 
      (card.id && (card.id === 'call_pack' || card.id === 'beast_pack_mentality'))) {
    
    dbg('✅ CALL THE PACK CARD DETECTED! Processing directly...');
    
    // Remove card from hand
    const cardIndex = battleState.playerHand.findIndex(c => c.id === card.id);
    dbg('Card index in hand:', cardIndex);
    if (cardIndex !== -1) {
      dbg('Removing card from hand at index:', cardIndex);
      battleState.playerHand.splice(cardIndex, 1);
    }
    
    // Add Wolf minions to player's discard pile
    dbg('Creating Wolf minions...');
    const wolfMinions = createWolfMinionCards();
    dbg('Wolf minions created:', wolfMinions);
    
    const newBattleState = {
      ...battleState,
      playerHand: [...battleState.playerHand],
      playerDiscardPile: [...battleState.playerDiscardPile, ...wolfMinions], // Only add Wolf minions for player's Call the Pack
      playerEnergy: battleState.playerEnergy - cost,
      playerPlayedCards: [...battleState.playerPlayedCards, card]
    };
    
    dbg('New battle state discard pile:', newBattleState.playerDiscardPile);
    dbg('Discard pile length:', newBattleState.playerDiscardPile.length);
    
    log.push(formatLogText(`Player added 2 Wolf to their discard pile`, player.class, opponent.name, card.name));
    
    dbg('=== CALL THE PACK PROCESSING COMPLETE ===');
    return { 
      newPlayer: player, 
      newOpponent: opponent, 
      newBattleState, 
      log 
    };
  }
  dbg('❌ CALL THE PACK CARD NOT DETECTED, continuing with normal processing...');
  
  if (!canPlayCard(card, player, battleState.playerEnergy, battleState)) {
    return { newPlayer: player, newOpponent: opponent, newBattleState: battleState, log: [formatLogText('Not enough energy or card conditions not met!', player.class, opponent.name)] };
  }

  let newPlayer = { ...player };
  let newOpponent = { ...opponent };
  const newBattleState = { ...battleState };

  // Remove the specific card instance from hand and add to discard pile
  // Find the index of the card to remove (first occurrence)
  const cardIndex = newBattleState.playerHand.findIndex(c => c.id === card.id);
  if (cardIndex !== -1) {
    // Remove the card at the specific index
    const [removedCard] = newBattleState.playerHand.splice(cardIndex, 1);
    
    // Check if card is volatile (burned when played - doesn't go to discard)
    const isVolatile = removedCard.types && removedCard.types.includes(CardType.VOLATILE);
    if (!isVolatile) {
      newBattleState.playerDiscardPile = [...newBattleState.playerDiscardPile, removedCard];
    } else {
      log.push(formatLogText(`${player.class}'s ${removedCard.name} was burned and removed from game!`, player.class, opponent.name, removedCard.name));
    }
  }
  
  newBattleState.playerEnergy -= cost;
  newBattleState.playerPlayedCards.push(card);

  // Apply card effects
  let wasDamageBlocked = false;
  if (card.attack) {
    let baseDamage;
    if (card.effect === 'Damage + current block') {
      baseDamage = calculateRiposteDamage(card, player, newBattleState);
    } else if (card.effect === 'Bonus damage vs bleeding') {
      baseDamage = calculateKillingInstinctDamage(card, player, newBattleState);
    } else {
      baseDamage = calculateCardDamage(card, player);
    }
    
    const damageResult = calculateDamageWithStatusEffects(
      baseDamage, 
      newBattleState.playerStatusEffects, 
      newBattleState.opponentStatusEffects,
      card
    );
    
    // Check if the attack was evaded
    if (damageResult.evaded) {
      const evasiveMessage = formatLogText(`${opponent.name}'s Evasive prevented damage from player's ${card.name}`, player.class, opponent.name, card.name);
      dbg('=== EVASIVE DEBUG ===');
      dbg('Raw message:', `${opponent.name}'s Evasive prevented damage from player's ${card.name}`);
      dbg('Formatted message:', evasiveMessage);
      dbg('Player class:', player.class);
      dbg('Opponent name:', opponent.name);
      dbg('Card name:', card.name);
      dbg('Contains target pattern?', evasiveMessage.includes("'s Evasive prevented damage from"));
      dbg('About to push to battle log');
      dbg('=== END EVASIVE DEBUG ===');
      log.push(evasiveMessage);
      // Consume one Evasive stack
      newBattleState.opponentStatusEffects = consumeEvasiveStack(newBattleState.opponentStatusEffects);
    } else {
      // Apply damage to opponent's block first, then health
      if (newBattleState.opponentBlock > 0) {
        if (newBattleState.opponentBlock >= damageResult.finalDamage) {
          newBattleState.opponentBlock -= damageResult.finalDamage;
          log.push(formatLogText(`Player deals ${damageResult.finalDamage} damage to ${opponent.name}'s block with ${card.name}`, player.class, opponent.name, card.name));
          wasDamageBlocked = true;
        } else {
          const remainingDamage = damageResult.finalDamage - newBattleState.opponentBlock;
          newBattleState.opponentBlock = 0;
          newOpponent.health = Math.max(0, newOpponent.health - remainingDamage);
          log.push(formatLogText(`Player breaks ${opponent.name}'s block and deals ${remainingDamage} damage with ${card.name}`, player.class, opponent.name, card.name));
        }
      } else {
        newOpponent.health = Math.max(0, newOpponent.health - damageResult.finalDamage);
        log.push(formatLogText(`Player deals ${damageResult.finalDamage} damage with ${card.name}`, player.class, opponent.name, card.name));
      }
    }
  }

  if (card.defense) {
    const block = calculateCardBlock(card, player);
    newBattleState.playerBlock += block;
    log.push(formatLogText(`Player gains ${block} block from ${card.name}`, player.class, opponent.name, card.name));
    
    // Handle Shield Up persistent block effect
    if (card.effect === 'Persistent block') {
      newBattleState.playerPersistentBlock = true;
      log.push(formatLogText(`Player's block will persist through next turn`, player.class, opponent.name, card.name));
    }
  }

  // Apply special effects
  if (card.effect) {
    const parsedEffect = parseCardEffect(card.effect);
    const formattedParsedEffect = parseFormattedCardEffect(card.effect);
    if (parsedEffect && formattedParsedEffect) {
      // Check if card is an attack type and damage was completely blocked
      const isAttackCard = card.types && card.types.includes('attack');
      if (isAttackCard && wasDamageBlocked) {
        log.push(formatLogText(`${card.name}'s effect was blocked! No ${parsedEffect.type} applied.`, player.class, opponent.name, card.name));
      } else {
        if (parsedEffect.target === 'opponent') {
          // For duration-based effects (weak, vulnerable, strength, dexterity), use the parsed value as actual duration
          let actualDuration = parsedEffect.value;
          
          newBattleState.opponentStatusEffects = applyStatusEffect(
            newBattleState.opponentStatusEffects, 
            parsedEffect.type, 
            parsedEffect.value, 
            actualDuration
          );
          // Use the formatted effect value for logging (matches card display)
          log.push(formatLogText(`Player applied ${formattedParsedEffect.value} ${formattedParsedEffect.type} to ${opponent.name} with ${card.name}`, player.class, opponent.name, card.name));
        } else if (parsedEffect.target === 'player') {
          // For duration-based effects (weak, vulnerable, strength, dexterity), use the parsed value as actual duration
          let actualDuration = parsedEffect.value;
          
          newBattleState.playerStatusEffects = applyStatusEffect(
            newBattleState.playerStatusEffects, 
            parsedEffect.type, 
            parsedEffect.value, 
            actualDuration
          );
          // Use the formatted effect value for logging (matches card display)
          log.push(formatLogText(`Player applied ${formattedParsedEffect.value} ${formattedParsedEffect.type} to player with ${card.name}`, player.class, opponent.name, card.name));
        }
      }
    } else {
      // Handle special effects that don't follow the "Apply X" pattern
      // Only log if something actually happens or if it's a visible effect
      let shouldLog = false;
      let logMessage = '';
      
      if (card.effect === 'Bonus damage vs bleeding') {
        // This effect is already handled in damage calculation, no need for additional log
        shouldLog = false;
      } else if (card.effect === 'Damage + current block') {
        // This effect is already handled in damage calculation, no need for additional log
        shouldLog = false;
      } else if (card.effect === 'Persistent block') {
        // This is handled in the defense section, no need for additional log
        shouldLog = false;
      } else if (card.effect === 'Self damage for power' || card.effect === 'Self damage') {
        // Self damage effects
        const selfDamage = 3; // Default self damage amount
        newPlayer.health = Math.max(0, newPlayer.health - selfDamage);
        shouldLog = true;
        logMessage = `Player takes ${selfDamage} self damage from ${card.name}`;
      } else if ((card.name && card.name.toLowerCase().includes('call the pack')) || (card.id && (card.id === 'call_pack' || card.id === 'beast_pack_mentality'))) {
        dbg('🔄 FALLBACK CALL THE PACK HANDLING - This should NOT be reached if direct handling worked!');
        dbg('Card being processed in fallback:', card);
        // Special handling for Call the Pack - check by card name directly
        shouldLog = true;
        // Create Wolf minion cards and add them to player's discard pile
        const wolfMinions = createWolfMinionCards();
        dbg('Wolf minions created in fallback:', wolfMinions);
        newBattleState.playerDiscardPile = [...newBattleState.playerDiscardPile, ...wolfMinions];
        dbg('Updated discard pile in fallback:', newBattleState.playerDiscardPile);
        logMessage = `Player added 2 Wolf to their discard pile (FALLBACK)`;
      } else if (card.effect.includes('shuffle') || card.effect.includes('summon') || card.effect.includes('minion')) {
        // Other deck manipulation or summoning effects
        shouldLog = true;
        logMessage = `Player: ${card.name} - ${card.effect}`;
      } else {
        // For other unknown effects, log them for debugging/visibility
        shouldLog = true;
        logMessage = `Player: ${card.name} - ${card.effect}`;
      }
      
      if (shouldLog) {
        log.push(formatLogText(logMessage, player.class, opponent.name, card.name));
      }
    }
  }

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
  
  let newPlayer = { ...player };
  let newOpponent = { ...opponent };
  let newBattleState = { ...battleState };
  
  // Check if the card is Call the Pack
  if ((cardToPlay.name && cardToPlay.name.toLowerCase().includes('call the pack')) || 
      (cardToPlay.id && (cardToPlay.id === 'call_pack' || cardToPlay.id === 'beast_pack_mentality'))) {
    dbg('✅ SINGLE CARD: CALL THE PACK DETECTED!');
    
    // Remove card from opponent hand
    const cardIndex = newBattleState.opponentHand.findIndex(c => c.id === cardToPlay.id);
    if (cardIndex !== -1) {
      newBattleState.opponentHand.splice(cardIndex, 1);
    }
    
    // Add Wolf minions to player's discard pile
    const wolfMinions = createWolfMinionCards();
    newBattleState.playerDiscardPile = [...newBattleState.playerDiscardPile, ...wolfMinions];
    newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, cardToPlay];
    newBattleState.opponentEnergy = remainingEnergy - cardToPlay.cost;
    newBattleState.opponentPlayedCards = [...newBattleState.opponentPlayedCards, cardToPlay];
    
    const playerClassName = player.class.charAt(0).toUpperCase() + player.class.slice(1);
    log.push(formatLogText(`${opponent.name} added 2 Wolf to ${playerClassName} discard pile`, player.class, opponent.name, cardToPlay.name));
    
    return { newPlayer, newOpponent, newBattleState, log };
  }
  
  // Normal card processing for non-Call the Pack cards
  dbg('🎮 Processing normal card:', cardToPlay.name);
  
  // Remove the card from opponent's hand and add to discard pile
  const cardIndex = newBattleState.opponentHand.findIndex(c => c.id === cardToPlay.id);
  if (cardIndex !== -1) {
    const [removedCard] = newBattleState.opponentHand.splice(cardIndex, 1);
    
    // Check if card is volatile (burned when played - doesn't go to discard)
    const isVolatile = removedCard.types && removedCard.types.includes(CardType.VOLATILE);
    if (!isVolatile) {
      newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, removedCard];
    } else {
      log.push(formatLogText(`${opponent.name}'s ${removedCard.name} was burned and removed from game!`, newPlayer.class, newOpponent.name, removedCard.name));
    }
  }
  
  // Deduct energy cost from opponent's energy
  newBattleState.opponentEnergy -= cardToPlay.cost;
  newBattleState.opponentPlayedCards.push(cardToPlay);
  
  // Apply card effects
  if (cardToPlay.attack) {
    let baseDamage = cardToPlay.attack;
    
    const damageResult = calculateDamageWithStatusEffects(
      baseDamage, 
      newBattleState.opponentStatusEffects, 
      newBattleState.playerStatusEffects,
      cardToPlay
    );
    
    if (damageResult.evaded) {
      const evasiveMessage = formatLogText(`${newPlayer.class}'s Evasive prevented damage from ${newOpponent.name}'s ${cardToPlay.name}`, newPlayer.class, newOpponent.name, cardToPlay.name);
      log.push(evasiveMessage);
    } else {
      const totalDamage = damageResult.finalDamage;
      
      // Apply damage to player's block first, then health
      if (newBattleState.playerBlock >= totalDamage) {
        newBattleState.playerBlock -= totalDamage;
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} dealt ${totalDamage} damage to ${newPlayer.class}'s block`, newPlayer.class, newOpponent.name, cardToPlay.name));
      } else {
        const remainingDamage = totalDamage - newBattleState.playerBlock;
        newPlayer.health = Math.max(0, newPlayer.health - remainingDamage);
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} broke ${newPlayer.class}'s block and dealt ${remainingDamage} damage`, newPlayer.class, newOpponent.name, cardToPlay.name));
        newBattleState.playerBlock = 0;
      }
    }
  }
  
  if (cardToPlay.defense) {
    newBattleState.opponentBlock += cardToPlay.defense;
    log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} gained ${cardToPlay.defense} block`, newPlayer.class, newOpponent.name, cardToPlay.name));
  }
  
  // Apply card-specific effects
  if (cardToPlay.effect) {
    switch (cardToPlay.effect) {
      case 'Apply 2 weak':
        newBattleState.playerStatusEffects.push({
          type: 'weak',
          value: 2,
          duration: 2
        });
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} applied 2 weak to ${newPlayer.class}`, newPlayer.class, newOpponent.name, cardToPlay.name));
        break;
      case 'Apply 1 vulnerable':
        newBattleState.playerStatusEffects.push({
          type: 'vulnerable',
          value: 1,
          duration: 3
        });
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} applied 1 vulnerable to ${newPlayer.class}`, newPlayer.class, newOpponent.name, cardToPlay.name));
        break;
      case 'Apply bleed 2':
        newBattleState.playerStatusEffects.push({
          type: 'bleeding',
          value: 2,
          duration: 1 // Bleeding doesn't use duration for stacking, but we'll set it
        });
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} applied 2 bleeding to ${newPlayer.class}`, newPlayer.class, newOpponent.name, cardToPlay.name));
        break;
      // Add more effects as needed
    }
  }
  
  dbg('✅ Single card play complete:', cardToPlay.name);
  return { newPlayer, newOpponent, newBattleState, log };
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
        const bleedingEffect = currentBattleState.playerStatusEffects.find(effect => effect.type === 'bleeding');
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
          c.class === 'wizard' && c.types && (c.types.includes('attack') || c.effect?.includes('spell'))
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
    if (card.types && !card.types.includes('attack')) {
      priority += 400;
    }
    
    // 5: Attack card with effect - MEDIUM-LOW PRIORITY
    if (card.types && card.types.includes('attack') && card.effect && card.effect !== '') {
      priority += 200;
    }
    
    // 6: Simple damage attack card - LOWEST PRIORITY
    if (card.types && card.types.includes('attack') && (!card.effect || card.effect === '')) {
      priority += 0; // Base priority, no bonus
    }
    
    // Additional modifiers for better decision making
    // Special cards (rare) get high priority
    if (card.rarity === 'rare' || card.rarity === 'special') {
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
      
      // Remove the card from hand and add to discard pile (unless it's volatile)
      const cardIndex = currentBattleState.opponentHand.findIndex(c => c.id === cardToPlay.id);
      if (cardIndex !== -1) {
        const [removedCard] = currentBattleState.opponentHand.splice(cardIndex, 1);
        
        // Check if card is volatile (burned when played - doesn't go to discard)
        const isVolatile = removedCard.types && removedCard.types.includes(CardType.VOLATILE);
        if (!isVolatile) {
          currentBattleState.opponentDiscardPile = [...currentBattleState.opponentDiscardPile, removedCard];
        } else {
          dbg(`Volatile card ${removedCard.name} was burned and removed from game`);
        }
      }
      
      currentBattleState.opponentPlayedCards.push(cardToPlay);
      remainingEnergy -= cardToPlay.cost;
      
      // Apply card effects (same logic as before, but using current state)
      let wasDamageBlocked = false;
      if (cardToPlay.attack) {
        let baseDamage;
        if (cardToPlay.effect === 'Bonus damage vs bleeding') {
          const bleedingEffect = currentBattleState.playerStatusEffects.find(effect => effect.type === 'bleeding');
          if (bleedingEffect && bleedingEffect.value > 0) {
            baseDamage = 15;
          } else {
            baseDamage = cardToPlay.attack || 0;
          }
        } else {
          baseDamage = cardToPlay.attack || 0;
        }
        
        const damageResult = calculateDamageWithStatusEffects(
          baseDamage, 
          currentBattleState.opponentStatusEffects, 
          currentBattleState.playerStatusEffects,
          cardToPlay
        );
        
        // Check if the attack was evaded
        if (damageResult.evaded) {
          log.push(formatLogText(`Player's Evasive prevented damage from ${opponent.name}'s ${cardToPlay.name}`, player.class, opponent.name, cardToPlay.name));
          // Consume one Evasive stack
          currentBattleState.playerStatusEffects = consumeEvasiveStack(currentBattleState.playerStatusEffects);
        } else {
          // Apply damage to player's block first, then health
          if (currentBattleState.playerBlock > 0) {
            if (currentBattleState.playerBlock >= damageResult.finalDamage) {
              currentBattleState.playerBlock -= damageResult.finalDamage;
              log.push(formatLogText(`${opponent.name} deals ${damageResult.finalDamage} damage to player's block with ${cardToPlay.name}`, player.class, opponent.name, cardToPlay.name));
              wasDamageBlocked = true;
            } else {
              const remainingDamage = damageResult.finalDamage - currentBattleState.playerBlock;
              currentBattleState.playerBlock = 0;
              currentPlayer.health = Math.max(0, currentPlayer.health - remainingDamage);
              log.push(formatLogText(`${opponent.name} breaks player's block and deals ${remainingDamage} damage with ${cardToPlay.name}`, player.class, opponent.name, cardToPlay.name));
            }
          } else {
            currentPlayer.health = Math.max(0, currentPlayer.health - damageResult.finalDamage);
            log.push(formatLogText(`${opponent.name} deals ${damageResult.finalDamage} damage with ${cardToPlay.name}`, player.class, opponent.name, cardToPlay.name));
          }
        }
      }

      if (cardToPlay.defense) {
        const block = cardToPlay.defense;
        currentBattleState.opponentBlock += block;
        log.push(formatLogText(`${opponent.name} gains ${block} block with ${cardToPlay.name}`, player.class, opponent.name, cardToPlay.name));
      }

      // Apply special effects
      if (cardToPlay.effect) {
        const parsedEffect = parseCardEffect(cardToPlay.effect);
        const formattedParsedEffect = parseFormattedCardEffect(cardToPlay.effect);
        if (parsedEffect && formattedParsedEffect) {
          const isAttackCard = cardToPlay.types && cardToPlay.types.includes('attack');
          if (isAttackCard && wasDamageBlocked) {
            log.push(formatLogText(`${opponent.name}'s ${cardToPlay.name} effect was blocked! No ${parsedEffect.type} applied.`, player.class, opponent.name, cardToPlay.name));
          } else {
            if (parsedEffect.target === 'opponent') {
              // For duration-based effects (weak, vulnerable, strength, dexterity), use the parsed value as actual duration
              let actualDuration = parsedEffect.value;
              
              currentBattleState.playerStatusEffects = applyStatusEffect(
                currentBattleState.playerStatusEffects, 
                parsedEffect.type, 
                parsedEffect.value, 
                actualDuration
              );
              log.push(formatLogText(`${opponent.name} applied ${formattedParsedEffect.value} ${formattedParsedEffect.type} to player with ${cardToPlay.name}`, player.class, opponent.name, cardToPlay.name));
            } else if (parsedEffect.target === 'player') {
              // For duration-based effects (weak, vulnerable, strength, dexterity), use the parsed value as actual duration
              let actualDuration = parsedEffect.value;
              
              currentBattleState.opponentStatusEffects = applyStatusEffect(
                currentBattleState.opponentStatusEffects, 
                parsedEffect.type, 
                parsedEffect.value, 
                actualDuration
              );
              log.push(formatLogText(`${opponent.name} applied ${formattedParsedEffect.value} ${formattedParsedEffect.type} to ${opponent.name} with ${cardToPlay.name}`, player.class, opponent.name, cardToPlay.name));
            }
          }
        } else {
          let shouldLog = false;
          let logMessage = '';
          
          if (cardToPlay.effect === 'Bonus damage vs bleeding') {
            shouldLog = false;
          } else if (cardToPlay.effect === 'Damage + current block') {
            shouldLog = false;
          } else if (cardToPlay.effect === 'Persistent block') {
            shouldLog = false;
          } else if (cardToPlay.effect === 'Self damage for power' || cardToPlay.effect === 'Self damage') {
            const selfDamage = 3;
            currentOpponent.health = Math.max(0, currentOpponent.health - selfDamage);
            shouldLog = true;
            logMessage = `${opponent.name} takes ${selfDamage} self damage from ${cardToPlay.name}`;
          } else if (cardToPlay.effect === 'Gain 1 Evasive') {
            // Cower effect - add Evasive status effect
            currentBattleState.opponentStatusEffects = applyStatusEffect(
              currentBattleState.opponentStatusEffects,
              'evasive',
              1,
              3 // Evasive lasts for 3 turns if not consumed
            );
            shouldLog = true;
            logMessage = `${opponent.name} gained 1 Evasive from ${cardToPlay.name}`;
          } else if (cardToPlay.effect === 'If last turn prevented damage from an attack, deal 10 damage') {
            // Booby Trap effect - check if damage was prevented last turn
            const lastTurnDamagePrevented = currentBattleState.battleLog.some(logEntry => 
              logEntry.includes("'s Evasive prevented") && logEntry.includes("from")
            );
            
            if (lastTurnDamagePrevented) {
              // Deal 10 damage
              currentPlayer.health = Math.max(0, currentPlayer.health - 10);
              shouldLog = true;
              logMessage = `${opponent.name}'s Booby Trap deals 10 damage! (Damage was prevented last turn)`;
            } else {
              // No damage dealt, but card still played
              shouldLog = true;
              logMessage = `${opponent.name}'s Booby Trap failed! (No damage prevented last turn)`;
            }
          } else if (cardToPlay.effect === 'Next turn player draw one card less') {
            // Dirty Trick effect - add draw modification
            currentBattleState.playerDrawModifications = addDrawModification(
              currentBattleState.playerDrawModifications,
              'subtract',
              1,
              cardToPlay.name,
              1 // Lasts for 1 turn (next player turn)
            );
            shouldLog = true;
            logMessage = `${opponent.name} used Dirty Trick! Player will draw one less card next turn`;
          } else if (cardToPlay.effect.includes('shuffle') || cardToPlay.effect.includes('summon') || cardToPlay.effect.includes('minion')) {
            shouldLog = true;
            if (cardToPlay.name === 'Call the Pack') {
              const wolfMinions = createWolfMinionCards();
              // Add to player's discard pile, not deck
              currentBattleState.playerDiscardPile = [...currentBattleState.playerDiscardPile, ...wolfMinions];
              const playerClassName = player.class.charAt(0).toUpperCase() + player.class.slice(1);
              logMessage = `${opponent.name} added 2 Wolf to ${playerClassName} discard pile`;
            } else {
              logMessage = `${opponent.name}: ${cardToPlay.name} - ${cardToPlay.effect}`;
            }
          } else {
            shouldLog = true;
            logMessage = `${opponent.name}: ${cardToPlay.name} - ${cardToPlay.effect}`;
          }
          
          if (shouldLog) {
            log.push(formatLogText(logMessage, player.class, opponent.name, cardToPlay.name));
          }
        }
      }
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
  dbg('=== PLAY OPPONENT CARD START ===');
  dbg('playOpponentCard called');
  dbg('Card to play:', cardToPlay.name);
  
  const log: string[] = [];
  let newPlayer = { ...player };
  let newOpponent = { ...opponent };
  let newBattleState = { ...battleState };
  
  // Remove the card from opponent's hand and add to discard pile
  const cardIndex = newBattleState.opponentHand.findIndex(c => c.id === cardToPlay.id);
  if (cardIndex !== -1) {
    const [removedCard] = newBattleState.opponentHand.splice(cardIndex, 1);
    
    // Check if card is volatile (burned when played - doesn't go to discard)
    const isVolatile = removedCard.types && removedCard.types.includes(CardType.VOLATILE);
    if (!isVolatile) {
      newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, removedCard];
    } else {
      log.push(formatLogText(`${opponent.name}'s ${removedCard.name} was burned and removed from game!`, newPlayer.class, newOpponent.name, removedCard.name));
    }
  }
  
  // Deduct energy cost from opponent's energy
  newBattleState.opponentEnergy -= cardToPlay.cost;
  newBattleState.opponentPlayedCards.push(cardToPlay);
  
  // Apply card effects
  if (cardToPlay.attack) {
    let baseDamage = cardToPlay.attack;
    
    const damageResult = calculateDamageWithStatusEffects(
      baseDamage, 
      newBattleState.opponentStatusEffects, 
      newBattleState.playerStatusEffects,
      cardToPlay
    );
    
    if (damageResult.evaded) {
      const evasiveMessage = formatLogText(`${newPlayer.class}'s Evasive prevented damage from ${newOpponent.name}'s ${cardToPlay.name}`, newPlayer.class, newOpponent.name, cardToPlay.name);
      log.push(evasiveMessage);
    } else {
      const totalDamage = damageResult.finalDamage;
      
      // Apply damage to player's block first, then health
      if (newBattleState.playerBlock >= totalDamage) {
        newBattleState.playerBlock -= totalDamage;
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} dealt ${totalDamage} damage to ${newPlayer.class}'s block`, newPlayer.class, newOpponent.name, cardToPlay.name));
      } else {
        const remainingDamage = totalDamage - newBattleState.playerBlock;
        newPlayer.health = Math.max(0, newPlayer.health - remainingDamage);
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} broke ${newPlayer.class}'s block and dealt ${remainingDamage} damage`, newPlayer.class, newOpponent.name, cardToPlay.name));
        newBattleState.playerBlock = 0;
      }
    }
  }
  
  if (cardToPlay.defense) {
    newBattleState.opponentBlock += cardToPlay.defense;
    log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} gained ${cardToPlay.defense} block`, newPlayer.class, newOpponent.name, cardToPlay.name));
  }
  
  // Apply card-specific effects
  if (cardToPlay.effect) {
    switch (cardToPlay.effect) {
      case 'Apply 2 weak':
        newBattleState.playerStatusEffects.push({
          type: 'weak',
          value: 2,
          duration: 2
        });
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} applied 2 weak to ${newPlayer.class}`, newPlayer.class, newOpponent.name, cardToPlay.name));
        break;
      case 'Apply 1 vulnerable':
        newBattleState.playerStatusEffects.push({
          type: 'vulnerable',
          value: 1,
          duration: 3
        });
        log.push(formatLogText(`${newOpponent.name}'s ${cardToPlay.name} applied 1 vulnerable to ${newPlayer.class}`, newPlayer.class, newOpponent.name, cardToPlay.name));
        break;
      // Add more effects as needed
    }
  }
  
  dbg('=== PLAY OPPONENT CARD END ===');
  dbg('Final player health:', newPlayer.health);
  dbg('Final opponent health:', newOpponent.health);
  dbg('Final player block:', newBattleState.playerBlock);
  dbg('Final opponent block:', newBattleState.opponentBlock);
  dbg('Battle log entries:', log);
  
  return { newPlayer, newOpponent, newBattleState, log };
}

export function drawCardsWithMinionEffects(
  deck: Deck, 
  discardPile: Card[], 
  numCards: number = 1,
  targetPlayer: 'player' | 'opponent' = 'player',
  playerClass: string = 'warrior',
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
    if (drawnCard.name === 'Wolf' && drawnCard.effect === 'Deal damage when drawn') {
      // Wolf minion deals damage when drawn
      const damage = drawnCard.attack || 5;
      minionDamageLog.push(formatLogText(
        `${targetPlayer === 'player' ? playerClass : opponentName} drew Wolf and takes ${damage} damage`,
        playerClass,
        opponentName
      ));
      
      // Add the Wolf minion to hand as an unplayable card
      drawnCards.push(drawnCard);
    } else {
      // Normal card - add to hand
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
        class: 'warrior' as PlayerClass, 
        rarity: 'common' 
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
  playerClass: string = 'warrior',
  opponentName: string = 'Alpha Wolf'
): { newHealth: number; logMessages: string[] } {
  const logMessages: string[] = [];
  let newHealth = targetHealth;
  
  const bleedingEffect = targetEffects.find(effect => effect.type === 'bleeding');
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
  
  if (newBattleState.turn === 'player') {
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
    
    // Update status effects (reduce duration)
    newBattleState.playerStatusEffects = updateStatusEffects(newBattleState.playerStatusEffects);
    newBattleState.opponentStatusEffects = updateStatusEffects(newBattleState.opponentStatusEffects);
    
    // Update draw modifications (reduce duration) - AFTER player turn
    newBattleState.playerDrawModifications = updateDrawModifications(newBattleState.playerDrawModifications);
    newBattleState.opponentDrawModifications = updateDrawModifications(newBattleState.opponentDrawModifications);
    
    // Reset played cards for the next turn
    newBattleState.playerPlayedCards = [];
    
    newBattleState.turn = 'opponent';
    
    // Reset opponent energy at start of their turn
    newBattleState.opponentEnergy = 2;
    
    // Start of opponent turn - trigger start of turn effects
    const startOfTurnLog = triggerStartOfTurnEffects(newOpponent, newBattleState, 'opponent');
    log.push(...startOfTurnLog);
    
    // Store cards added during start of turn effects (these should be kept)
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
    // Clear opponent's hand first, but preserve cards added during start of turn effects
    const previousHandCards = newBattleState.opponentHand.filter(card => 
      !startOfTurnAddedCards.some(startCard => startCard.id === card.id)
    );
    newBattleState.opponentHand = [...startOfTurnAddedCards]; // Keep start of turn cards
    
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
    
    // Update status effects (reduce duration)
    newBattleState.playerStatusEffects = updateStatusEffects(newBattleState.playerStatusEffects);
    newBattleState.opponentStatusEffects = updateStatusEffects(newBattleState.opponentStatusEffects);
    
    // DON'T update draw modifications here - we want them to persist for the player's draw phase
    
    // Reset played cards for the next turn
    newBattleState.opponentPlayedCards = [];
    
    newBattleState.turn = 'player';
    newBattleState.playerEnergy = 3; // Reset energy
    
    // Start of player turn - trigger start of turn effects
    const startOfTurnLog = triggerStartOfTurnEffects(newPlayer, newBattleState, 'player');
    log.push(...startOfTurnLog);
    
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