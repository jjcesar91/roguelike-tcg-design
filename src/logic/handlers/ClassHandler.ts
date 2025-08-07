import { PlayerClass, Player, Opponent } from '@/types/game/GameState';
import { createPlayer, getRandomOpponent, initializeBattle, drawCardsWithReshuffle } from '@/lib/gameUtils';

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
      player,
      opponent,
      battleState: updatedBattleState
    };
  }
}