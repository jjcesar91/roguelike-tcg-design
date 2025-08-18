import { dbg } from '@/lib/debug';
import { Card, Player, Opponent, BattleState, Turn } from '@/types/game';
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
    dbg('handleEndTurn called');
    
    const { newBattleState, newPlayer, newOpponent } = endTurn(battleState, player, opponent);
    dbg('After endTurn, new turn:', newBattleState.turn);
    
    return {
      newBattleState,
      newPlayer,
      newOpponent,
      isOpponentTurn: newBattleState.turn === Turn.OPPONENT
    };
  }

  static handleOpponentTurn(opponent: Opponent, player: Player, battleState: BattleState) {
    dbg('Starting opponent turn with sequential card playing...');
    
    // Return immediately with the initial state - the actual card playing will be handled sequentially
    return {
      newPlayer: player,
      newOpponent: opponent,
      newBattleState: battleState,
      isVictory: false,
      isDefeat: false,
      startOpponentTurn: true
    };
  }

  static handleOpponentPlayCard(
    opponent: Opponent, 
    player: Player, 
    battleState: BattleState, 
    cardIndex: number = 0
  ) {
    dbg(`handleOpponentPlayCard called for card index ${cardIndex}`);
    
    // Get the opponent's playable cards
    const playableCards = battleState.opponentHand.filter(card => {
      return this.canOpponentPlayCard(card, battleState);
    });

    if (cardIndex >= playableCards.length) {
      // No more cards to play, end the turn
      dbg('No more cards to play, ending opponent turn');
      const { newBattleState: finalBattleState, newPlayer: finalPlayer, newOpponent: finalOpponent } = endTurn(battleState, player, opponent);
      
      return {
        newPlayer: finalPlayer,
        newOpponent: finalOpponent,
        newBattleState: finalBattleState,
        isVictory: checkVictory(finalPlayer, finalOpponent),
        isDefeat: checkDefeat(finalPlayer),
        shouldContinue: false
      };
    }

    const cardToPlay = playableCards[cardIndex];
    dbg('Playing opponent card:', cardToPlay.name);

    // Show card preview state
    const previewState = {
      card: cardToPlay,
      isVisible: true
    };

    // Actually play the card after a delay
    setTimeout(() => {
      // This will be handled by the component state management
      dbg('Card preview finished, actually playing the card');
    }, 1500);

    // For now, return the current state with the card preview
    // The actual card playing logic will be handled by the component
    return {
      newPlayer: player,
      newOpponent: opponent,
      newBattleState: battleState,
      isVictory: false,
      isDefeat: false,
      shouldContinue: true,
      nextCardIndex: cardIndex + 1,
      opponentCardPreview: previewState
    };
  }

  static canPlayCard(card: Card, player: Player, battleState: BattleState) {
    return canPlayCardUtil(card, player, battleState.playerEnergy, battleState);
  }

  static canOpponentPlayCard(card: Card, battleState: BattleState) {
    return !card.unplayable && card.cost <= battleState.opponentEnergy;
  }
}