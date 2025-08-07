import { PlayerClass, Player, Opponent, BattleState, Card } from '@/types/game/GameState';
import { ClassHandler } from '../handlers/ClassHandler';
import { BattleHandler } from '../handlers/BattleHandler';
import { SelectionHandler } from '../handlers/SelectionHandler';
import { getRandomPassives, checkVictory, checkDefeat } from '@/lib/gameUtils';

export class GameEngine {
  static startGame(playerClass: PlayerClass) {
    const { player, opponent, battleState } = ClassHandler.handleClassSelect(playerClass);
    return { player, opponent, battleState };
  }

  static playCard(card: Card, player: Player, opponent: Opponent, battleState: BattleState) {
    return BattleHandler.handleCardPlay(card, player, opponent, battleState);
  }

  static endTurn(battleState: BattleState, player: Player, opponent: Opponent) {
    return BattleHandler.handleEndTurn(battleState, player, opponent);
  }

  static opponentTurn(opponent: Opponent, player: Player, battleState: BattleState) {
    return BattleHandler.handleOpponentTurn(opponent, player, battleState);
  }

  static selectCard(card: Card, player: Player, replaceCardId: string) {
    return SelectionHandler.handleCardSelect(card, player, replaceCardId);
  }

  static selectPassive(player: Player, passive: any) {
    return SelectionHandler.handlePassiveSelect(player, passive);
  }

  static getAvailableCards(playerClass: string, count: number = 3) {
    return SelectionHandler.getAvailableCards(playerClass, count);
  }

  static getAvailablePassives(playerClass: string, count: number = 3) {
    return getRandomPassives(playerClass as any, count);
  }

  static checkVictory(player: Player, opponent: Opponent) {
    return checkVictory(player, opponent);
  }

  static checkDefeat(player: Player) {
    return checkDefeat(player);
  }

  static canPlayCard(card: Card, player: Player, battleState: BattleState) {
    return BattleHandler.canPlayCard(card, player, battleState);
  }
}