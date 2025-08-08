import { PlayerClass, Player, Opponent } from '@/types/game';
import { createPlayer, getRandomOpponent, initializeBattle, drawCardsWithReshuffle } from '@/lib/gameUtils';
import { BattleHandler } from '../handlers/BattleHandler';

export class ClassHandler {
  static handleClassSelect(playerClass: PlayerClass) {
    console.log('handleClassSelect called with:', playerClass);
    
    const player = createPlayer(playerClass);
    console.log('Player created:', player);
    console.log('Player level:', player.level);
    
    const opponent = getRandomOpponent('basic');
    console.log('Opponent created:', opponent);
    console.log('Opponent difficulty:', opponent.difficulty);
    console.log('Opponent name:', opponent.name);
    
    const battleState = initializeBattle(player, opponent);
    console.log('Battle state created:', battleState);
    console.log('First turn:', battleState.turn);
    console.log('Player hand from initializeBattle:', battleState.playerHand);
    console.log('Player hand length from initializeBattle:', battleState.playerHand.length);

    // If opponent has ambush and goes first, don't draw player cards yet
    // The opponent will play their turn first
    let updatedBattleState = { ...battleState };
    
    if (battleState.turn === 'player') {
      // Normal case: player goes first, draw 3 cards
      console.log('Normal case - player goes first, drawing 3 cards');
      const drawResult = drawCardsWithReshuffle(
        updatedBattleState.playerDeck, 
        updatedBattleState.playerDiscardPile, 
        3
      );
      updatedBattleState.playerHand = drawResult.drawnCards;
      updatedBattleState.playerDeck = drawResult.updatedDeck;
      updatedBattleState.playerDiscardPile = drawResult.updatedDiscardPile;
      console.log('Player hand after drawing:', updatedBattleState.playerHand);
    } else {
      // Ambush case: opponent goes first, player starts with empty hand
      console.log('Ambush activated - opponent goes first, player hand should be empty');
      console.log('Player hand in ambush case:', updatedBattleState.playerHand);
    }

    console.log('Final player hand being returned:', updatedBattleState.playerHand);
    console.log('Final player hand length:', updatedBattleState.playerHand.length);

    return {
      player,
      opponent,
      battleState: updatedBattleState
    };
  }
}