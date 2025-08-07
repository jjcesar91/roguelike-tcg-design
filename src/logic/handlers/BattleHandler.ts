import { Card, Player, Opponent, BattleState } from '@/types/game/GameState';
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
    
    let newBattleState = endTurn(battleState);
    console.log('After endTurn, new turn:', newBattleState.turn);
    
    return {
      newBattleState,
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
    updatedBattleState = endTurn(updatedBattleState);
    console.log('After ending opponent turn, new turn:', updatedBattleState.turn);

    return {
      newPlayer: result.newPlayer,
      newOpponent: result.newOpponent,
      newBattleState: updatedBattleState,
      isVictory: checkVictory(result.newPlayer, result.newOpponent),
      isDefeat: checkDefeat(result.newPlayer)
    };
  }

  static canPlayCard(card: Card, player: Player, battleState: BattleState) {
    return canPlayCardUtil(card, player, battleState.playerEnergy);
  }
}