import { dbg } from '@/lib/debug';
import { PlayerClass, Player, Opponent } from '@/types/game';
import { createPlayer, getRandomOpponent, initializeBattle, drawCardsWithReshuffle } from '@/lib/gameUtils';
import { BattleHandler } from '../handlers/BattleHandler';

export class ClassHandler {
  static handleClassSelect(playerClass: PlayerClass) {
    dbg('handleClassSelect called with:', playerClass);
    
    const player = createPlayer(playerClass);
    dbg('Player created:', player);
    dbg('Player level:', player.level);
    
    const opponent = getRandomOpponent('basic');
    dbg('Opponent created:', opponent);
    dbg('Opponent difficulty:', opponent.difficulty);
    dbg('Opponent name:', opponent.name);
    
    const battleState = initializeBattle(player, opponent);
    dbg('Battle state created:', battleState);
    dbg('First turn:', battleState.turn);
    dbg('Player hand from initializeBattle:', battleState.playerHand);
    dbg('Player hand length from initializeBattle:', battleState.playerHand.length);

    // If opponent has ambush and goes first, don't draw player cards yet
    // The opponent will play their turn first
    let updatedBattleState = { ...battleState };
    
    if (battleState.turn === 'player') {
      // Normal case: player goes first, draw 3 cards
      dbg('Normal case - player goes first, drawing 3 cards');
      const drawResult = drawCardsWithReshuffle(
        updatedBattleState.playerDeck, 
        updatedBattleState.playerDiscardPile, 
        3
      );
      updatedBattleState.playerHand = drawResult.drawnCards;
      updatedBattleState.playerDeck = drawResult.updatedDeck;
      updatedBattleState.playerDiscardPile = drawResult.updatedDiscardPile;
      dbg('Player hand after drawing:', updatedBattleState.playerHand);
    } else {
      // Ambush case: opponent goes first, player starts with empty hand
      dbg('Ambush activated - opponent goes first, player hand should be empty');
      dbg('Player hand in ambush case:', updatedBattleState.playerHand);
    }

    dbg('Final player hand being returned:', updatedBattleState.playerHand);
    dbg('Final player hand length:', updatedBattleState.playerHand.length);

    return {
      player,
      opponent,
      battleState: updatedBattleState
    };
  }
}