import { dbg } from '@/lib/debug';
import { Card, Player, Opponent, BattleState, Turn } from '@/types/game';
import { playCard, canPlayCard as canPlayCardUtil } from '@/lib/gameUtils';
import { GameEngine } from '@/logic/game/GameEngine';

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

  static async handleEndTurn(battleState: BattleState, player: Player, opponent: Opponent) {
    dbg('handleEndTurn called');

    const end = await GameEngine.endTurn(battleState, player, opponent);
    dbg('After endTurn, new turn:', end.newBattleState.turn);

    return {
      newBattleState: end.newBattleState,
      newPlayer: end.newPlayer,
      newOpponent: end.newOpponent,
      isOpponentTurn: end.isOpponentTurn
    };
  }

  static handleOpponentTurn(opponent: Opponent, player: Player, battleState: BattleState) {
    dbg('Starting opponent turn (AI-driven in component).');
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
      // No more cards to play, end the turn via centralized engine
      dbg('No more cards to play, ending opponent turn');
      const end = GameEngine.endTurn(battleState, player, opponent);
      return {
        newPlayer: end.newPlayer,
        newOpponent: end.newOpponent,
        newBattleState: end.newBattleState,
        isVictory: GameEngine.checkVictory(end.newPlayer, end.newOpponent),
        isDefeat: GameEngine.checkDefeat(end.newPlayer),
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

  static canPlayCard(card: Card, battleState: BattleState) {
    return canPlayCardUtil(card, battleState.playerEnergy, battleState);
  }

  static canOpponentPlayCard(card: Card, battleState: BattleState) {
    return !card.unplayable && card.cost <= battleState.opponentEnergy;
  }
}