import { Card, Player, Opponent, BattleState, PlayerClass, GameState, Deck } from '@/types/game';
import * as gameData from '@/data/gameData';

console.log('gameUtils.ts loaded');
console.log('gameData import:', gameData);
console.log('playerCards:', gameData.playerCards);
console.log('opponents:', gameData.opponents);
console.log('passives:', gameData.passives);

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
  console.log('Creating player for class:', playerClass);
  console.log('Available playerCards:', Object.keys(playerCards));
  console.log('playerCards[playerClass]:', playerCards[playerClass]);
  
  const classCards = playerCards[playerClass].slice(0, 3); // First 3 cards
  console.log('Class cards selected:', classCards);
  
  const deck = createDeck(classCards, 3);
  console.log('Deck created:', deck);

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
  console.log('Getting random opponent for difficulty:', difficulty);
  console.log('Available opponents:', opponents);
  const availableOpponents = opponents.filter(opp => opp.difficulty === difficulty);
  console.log('Available opponents for difficulty:', availableOpponents);
  const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
  console.log('Selected opponent:', randomOpponent);
  console.log('Opponent deck:', randomOpponent.deck);
  console.log('Opponent deck cards:', randomOpponent.deck?.cards);
  
  return {
    ...randomOpponent,
    deck: {
      cards: shuffleDeck([...randomOpponent.deck.cards]),
      discardPile: []
    }
  };
}

export function initializeBattle(player: Player, opponent: Opponent): BattleState {
  console.log('Initializing battle...');
  console.log('Player:', player);
  console.log('Player deck:', player.deck);
  console.log('Player deck cards:', player.deck?.cards);
  console.log('Opponent:', opponent);
  console.log('Opponent deck:', opponent.deck);
  console.log('Opponent deck cards:', opponent.deck?.cards);
  
  // Create copies of decks for battle
  const playerDeckCopy = {
    cards: [...player.deck.cards],
    discardPile: [...player.deck.discardPile]
  };
  const opponentDeckCopy = {
    cards: [...opponent.deck.cards],
    discardPile: [...opponent.deck.discardPile]
  };
  
  // Draw initial hands - player starts with empty hand, will draw 3 on first turn
  const playerHand: Card[] = [];
  const opponentHand = drawCardsWithReshuffle(opponentDeckCopy, [], 3).drawnCards;
  
  return {
    playerHand,
    playerEnergy: player.maxEnergy,
    opponentHand,
    turn: 'player',
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
    battleLog: ['Battle started!', `${player.class} vs ${opponent.name}`, 'Player draws 3 cards...']
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

export function calculateDamageWithStatusEffects(damage: number, attackerStatusEffects: any[], defenderStatusEffects: any[]): number {
  let finalDamage = damage;
  
  // Apply Weak effect (reduces damage by 25% per stack)
  const weakEffect = attackerStatusEffects.find(effect => effect.type === 'weak');
  if (weakEffect) {
    finalDamage = Math.floor(finalDamage * (1 - (0.25 * weakEffect.value)));
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
  
  return Math.max(0, finalDamage);
}

export function applyStatusEffect(targetEffects: any[], effectType: string, value: number, duration: number): any[] {
  const newEffects = [...targetEffects];
  const existingEffect = newEffects.find(effect => effect.type === effectType);
  
  if (existingEffect) {
    // Stack the effect and reset duration
    existingEffect.value += value;
    existingEffect.duration = duration;
  } else {
    // Add new effect
    newEffects.push({
      type: effectType,
      value: value,
      duration: duration
    });
  }
  
  return newEffects;
}

export function updateStatusEffects(effects: any[]): any[] {
  return effects
    .map(effect => ({
      ...effect,
      duration: effect.duration - 1
    }))
    .filter(effect => effect.duration > 0);
}

export function parseCardEffect(effectText: string): { type: string; value: number; target: string } | null {
  const weakMatch = effectText.match(/Apply (\d+) weak/i);
  const vulnerableMatch = effectText.match(/Apply (\d+) vulnerable/i);
  const strengthMatch = effectText.match(/Apply (\d+) strength/i);
  const dexterityMatch = effectText.match(/Apply (\d+) dexterity/i);
  
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
  
  return null;
}

export function hasSpecialEffect(card: Card): boolean {
  return card.effect === 'Damage + current block' || card.effect === 'Persistent block';
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

export function canPlayCard(card: Card, player: Player, energy: number): boolean {
  const cost = getCardCost(card, player);
  return energy >= cost;
}

export function playCard(
  card: Card, 
  player: Player, 
  opponent: Opponent, 
  battleState: BattleState
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState; log: string[] } {
  const log: string[] = [];
  const cost = getCardCost(card, player);
  
  if (!canPlayCard(card, player, battleState.playerEnergy)) {
    return { newPlayer: player, newOpponent: opponent, newBattleState: battleState, log: ['Not enough energy!'] };
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
    newBattleState.playerDiscardPile = [...newBattleState.playerDiscardPile, removedCard];
  }
  
  newBattleState.playerEnergy -= cost;
  newBattleState.playerPlayedCards.push(card);

  // Apply card effects
  if (card.attack) {
    let baseDamage;
    if (card.effect === 'Damage + current block') {
      baseDamage = calculateRiposteDamage(card, player, newBattleState);
    } else {
      baseDamage = calculateCardDamage(card, player);
    }
    
    const finalDamage = calculateDamageWithStatusEffects(
      baseDamage, 
      newBattleState.playerStatusEffects, 
      newBattleState.opponentStatusEffects
    );
    
    // Apply damage to opponent's block first, then health
    if (newBattleState.opponentBlock > 0) {
      if (newBattleState.opponentBlock >= finalDamage) {
        newBattleState.opponentBlock -= finalDamage;
        log.push(`Player deals ${finalDamage} damage to ${opponent.name}'s block with ${card.name}`);
      } else {
        const remainingDamage = finalDamage - newBattleState.opponentBlock;
        newBattleState.opponentBlock = 0;
        newOpponent.health = Math.max(0, newOpponent.health - remainingDamage);
        log.push(`Player breaks ${opponent.name}'s block and deals ${remainingDamage} damage with ${card.name}`);
      }
    } else {
      newOpponent.health = Math.max(0, newOpponent.health - finalDamage);
      log.push(`Player deals ${finalDamage} damage with ${card.name}`);
    }
  }

  if (card.defense) {
    const block = calculateCardBlock(card, player);
    newBattleState.playerBlock += block;
    log.push(`Player gains ${block} block from ${card.name} (total: ${newBattleState.playerBlock})`);
    
    // Handle Shield Up persistent block effect
    if (card.effect === 'Persistent block') {
      newBattleState.playerPersistentBlock = true;
      log.push(`Player's block will persist through next turn`);
    }
  }

  // Apply special effects
  if (card.effect) {
    const parsedEffect = parseCardEffect(card.effect);
    if (parsedEffect) {
      if (parsedEffect.target === 'opponent') {
        newBattleState.opponentStatusEffects = applyStatusEffect(
          newBattleState.opponentStatusEffects, 
          parsedEffect.type, 
          parsedEffect.value, 
          3 // Default duration
        );
        log.push(`Applied ${parsedEffect.value} ${parsedEffect.type} to ${opponent.name}`);
      } else if (parsedEffect.target === 'player') {
        newBattleState.playerStatusEffects = applyStatusEffect(
          newBattleState.playerStatusEffects, 
          parsedEffect.type, 
          parsedEffect.value, 
          3 // Default duration
        );
        log.push(`Applied ${parsedEffect.value} ${parsedEffect.type} to player`);
      }
    } else {
      log.push(`${card.name}: ${card.effect}`);
    }
  }

  return { newPlayer, newOpponent, newBattleState, log };
}

export function opponentPlayCard(
  opponent: Opponent, 
  player: Player, 
  battleState: BattleState
): { newPlayer: Player; newOpponent: Opponent; newBattleState: BattleState; log: string[] } {
  console.log('opponentPlayCard called');
  console.log('Opponent:', opponent);
  console.log('Player:', player);
  console.log('BattleState:', battleState);
  console.log('Opponent hand:', battleState.opponentHand);
  
  const log: string[] = [];
  const playableCards = battleState.opponentHand.filter(card => card.cost <= 3); // Simple AI
  console.log('Playable cards:', playableCards);
  
  if (playableCards.length === 0) {
    console.log('No playable cards, opponent skips turn');
    return { newPlayer: player, newOpponent: opponent, newBattleState: battleState, log: ['Opponent skips turn'] };
  }

  const card = playableCards[Math.floor(Math.random() * playableCards.length)];
  console.log('Selected card:', card);
  
  let newPlayer = { ...player };
  let newOpponent = { ...opponent };
  const newBattleState = { ...battleState };

  // Remove the specific card instance from hand and add to discard pile
  // Find the index of the card to remove (first occurrence)
  const cardIndex = newBattleState.opponentHand.findIndex(c => c.id === card.id);
  if (cardIndex !== -1) {
    // Remove the card at the specific index
    const [removedCard] = newBattleState.opponentHand.splice(cardIndex, 1);
    newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, removedCard];
  }
  
  newBattleState.opponentPlayedCards.push(card);

  // Apply card effects
  if (card.attack) {
    const finalDamage = calculateDamageWithStatusEffects(
      card.attack, 
      newBattleState.opponentStatusEffects, 
      newBattleState.playerStatusEffects
    );
    
    // Apply damage to player's block first, then health
    if (newBattleState.playerBlock > 0) {
      if (newBattleState.playerBlock >= finalDamage) {
        newBattleState.playerBlock -= finalDamage;
        log.push(`${opponent.name} deals ${finalDamage} damage to player's block with ${card.name}`);
      } else {
        const remainingDamage = finalDamage - newBattleState.playerBlock;
        newBattleState.playerBlock = 0;
        newPlayer.health = Math.max(0, newPlayer.health - remainingDamage);
        log.push(`${opponent.name} breaks player's block and deals ${remainingDamage} damage with ${card.name}`);
      }
    } else {
      newPlayer.health = Math.max(0, newPlayer.health - finalDamage);
      log.push(`${opponent.name} deals ${finalDamage} damage with ${card.name}`);
    }
  }

  if (card.defense) {
    const block = card.defense; // Opponents don't have passive effects for now
    newBattleState.opponentBlock += block;
    log.push(`${opponent.name} gains ${block} block from ${card.name} (total: ${newBattleState.opponentBlock})`);
  }

  // Apply special effects
  if (card.effect) {
    const parsedEffect = parseCardEffect(card.effect);
    if (parsedEffect) {
      if (parsedEffect.target === 'player') {
        newBattleState.playerStatusEffects = applyStatusEffect(
          newBattleState.playerStatusEffects, 
          parsedEffect.type, 
          parsedEffect.value, 
          3 // Default duration
        );
        log.push(`Applied ${parsedEffect.value} ${parsedEffect.type} to player`);
      } else if (parsedEffect.target === 'opponent') {
        newBattleState.opponentStatusEffects = applyStatusEffect(
          newBattleState.opponentStatusEffects, 
          parsedEffect.type, 
          parsedEffect.value, 
          3 // Default duration
        );
        log.push(`Applied ${parsedEffect.value} ${parsedEffect.type} to ${opponent.name}`);
      }
    } else {
      log.push(`${card.name}: ${card.effect}`);
    }
  }

  console.log('Opponent play result:', { newPlayer, newOpponent, newBattleState, log });
  return { newPlayer, newOpponent, newBattleState, log };
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
        console.log('Deck empty, shuffled discard pile back into deck');
      } else {
        console.log('No cards left to draw');
        break;
      }
    }
    
    if (currentDeck.cards.length > 0) {
      const card = currentDeck.cards.shift()!;
      drawnCards.push(card);
      console.log(`Drew card: ${card.name}`);
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

export function endTurn(battleState: BattleState): BattleState {
  const newBattleState = { ...battleState };
  const log: string[] = [];
  
  if (newBattleState.turn === 'player') {
    // End of player turn - discard all cards in hand (block persists until opponent's turn)
    newBattleState.playerDiscardPile = [...newBattleState.playerDiscardPile, ...newBattleState.playerHand];
    newBattleState.playerHand = [];
    
    // Update status effects (reduce duration)
    newBattleState.playerStatusEffects = updateStatusEffects(newBattleState.playerStatusEffects);
    newBattleState.opponentStatusEffects = updateStatusEffects(newBattleState.opponentStatusEffects);
    
    newBattleState.turn = 'opponent';
    
    // Start of opponent turn - draw 3 cards with proper reshuffle logic
    const drawResult = drawCardsWithReshuffle(
      newBattleState.opponentDeck, 
      newBattleState.opponentDiscardPile, 
      3
    );
    newBattleState.opponentHand = [...newBattleState.opponentHand, ...drawResult.drawnCards];
    newBattleState.opponentDeck = drawResult.updatedDeck;
    newBattleState.opponentDiscardPile = drawResult.updatedDiscardPile;
    
    console.log(`Opponent drew ${drawResult.drawnCards.length} cards`);
  } else {
    // End of opponent turn - discard all cards in hand and reset block
    newBattleState.opponentDiscardPile = [...newBattleState.opponentDiscardPile, ...newBattleState.opponentHand];
    newBattleState.opponentHand = [];
    newBattleState.opponentBlock = 0; // Reset opponent block at end of turn
    
    // Update status effects (reduce duration)
    newBattleState.playerStatusEffects = updateStatusEffects(newBattleState.playerStatusEffects);
    newBattleState.opponentStatusEffects = updateStatusEffects(newBattleState.opponentStatusEffects);
    
    newBattleState.turn = 'player';
    newBattleState.playerEnergy = 3; // Reset energy
    
    // Handle persistent block - only reset if Shield Up wasn't played
    if (!newBattleState.playerPersistentBlock) {
      newBattleState.playerBlock = 0; // Reset player block at start of new player turn
    } else {
      log.push('Player\'s block persists due to Shield Up effect');
      newBattleState.playerPersistentBlock = false; // Reset the flag for next time
    }
    
    // Start of player turn - draw 3 cards with proper reshuffle logic
    const drawResult = drawCardsWithReshuffle(
      newBattleState.playerDeck, 
      newBattleState.playerDiscardPile, 
      3
    );
    newBattleState.playerHand = [...newBattleState.playerHand, ...drawResult.drawnCards];
    newBattleState.playerDeck = drawResult.updatedDeck;
    newBattleState.playerDiscardPile = drawResult.updatedDiscardPile;
    
    console.log(`Player drew ${drawResult.drawnCards.length} cards`);
  }

  // Add log entries to battle log if any
  if (log.length > 0) {
    newBattleState.battleLog = [...newBattleState.battleLog, ...log];
  }

  return newBattleState;
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