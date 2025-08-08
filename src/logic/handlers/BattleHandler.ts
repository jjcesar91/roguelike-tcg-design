import { Card, Player, Opponent, BattleState } from '@/types/game';
import { playCard, opponentPlayCard, endTurn, checkVictory, checkDefeat, canPlayCard as canPlayCardUtil } from '@/lib/gameUtils';

export class BattleHandler {
  static handleCardPlay(card: Card, player: Player, opponent: Opponent, battleState: BattleState) {
    const result = playCard(card, player, opponent, battleState);
    
    const newBattleState = {
      ...result.newBattleState,
      battleLog: [...result.newBattleState.battleLog, ...result.log]
    };

    return {
      newPlayer: result.newPlayer,
      newOpponent: result.newOpponent,
      newBattleState
    };
  }

  static handleEndTurn(battleState: BattleState, player: Player, opponent: Opponent) {
    console.log('handleEndTurn called');
    
    const { newBattleState, newPlayer, newOpponent } = endTurn(battleState, player, opponent);
    console.log('After endTurn, new turn:', newBattleState.turn);
    
    return {
      newBattleState,
      newPlayer,
      newOpponent,
      isOpponentTurn: newBattleState.turn === 'opponent'
    };
  }

  static handleOpponentTurn(opponent: Opponent, player: Player, battleState: BattleState) {
    console.log('Calling opponentPlayCard...');
    const result = opponentPlayCard(opponent, player, battleState);
    console.log('opponentPlayCard result:', result);
    
    let updatedBattleState = {
      ...result.newBattleState,
      battleLog: [...result.newBattleState.battleLog, ...result.log]
    };

    // After opponent plays, automatically end their turn and go back to player
    console.log('Ending opponent turn...');
    const { newBattleState: finalBattleState, newPlayer: finalPlayer, newOpponent: finalOpponent } = endTurn(updatedBattleState, result.newPlayer, result.newOpponent);
    console.log('After ending opponent turn, new turn:', finalBattleState.turn);

    return {
      newPlayer: finalPlayer,
      newOpponent: finalOpponent,
      newBattleState: finalBattleState,
      isVictory: checkVictory(finalPlayer, finalOpponent),
      isDefeat: checkDefeat(finalPlayer)
    };
  }

  static canPlayCard(card: Card, player: Player, battleState: BattleState) {
    return canPlayCardUtil(card, player, battleState.playerEnergy, battleState);
  }
}