import { dbg } from '@/lib/debug';
import { Card, Player } from '@/types/game';
import { replaceCardInDeck, getRandomOpponent, initializeBattle, drawCardsWithReshuffle, getRandomCards } from '@/lib/gameUtils';
import { getLevelConfig } from '@/logic/game/progression';

export class SelectionHandler {
  static handleCardSelect(card: Card, player: Player, replaceCardId: string) {
    const newPlayer = replaceCardInDeck(player, replaceCardId, card);
    
    // Get next opponent based on the current player level (from game state, not newPlayer)
    let difficulty: 'basic' | 'medium' | 'boss';
    if (player.level === 2) {
      difficulty = 'medium';      // After beating level 1 (now level 2), fight medium opponent
    } else if (player.level === 3) {
      difficulty = 'boss';        // After beating level 2 (now level 3), fight boss opponent
    } else {
      difficulty = 'boss';        // fallback
    }
    
    dbg(`Player level: ${player.level}, selecting opponent difficulty: ${difficulty}`);
    
    const opponent = getRandomOpponent(getLevelConfig(updatedPlayer.level)?.difficulty || 'basic');
    const battleState = initializeBattle(newPlayer, opponent);
    
    // Draw 3 cards for player's first turn using proper draw mechanics
    const updatedBattleState = { ...battleState };
    const drawResult = drawCardsWithReshuffle(
      updatedBattleState.playerDeck, 
      updatedBattleState.playerDiscardPile, 
      3
    );
    updatedBattleState.playerHand = drawResult.drawnCards;
    updatedBattleState.playerDeck = drawResult.updatedDeck;
    updatedBattleState.playerDiscardPile = drawResult.updatedDiscardPile;

    return {
      newPlayer,
      opponent,
      battleState: updatedBattleState
    };
  }

  static handlePassiveSelect(player: Player, passive: any) {
    const newPlayer = {
      ...player,
      passives: [...player.passives, passive]
    };

    const availableCards = getRandomCards(player.class, 3);

    return {
      newPlayer,
      availableCards
    };
  }

  static getAvailableCards(playerClass: string, count: number = 3) {
    return getRandomCards(playerClass as any, count);
  }
}