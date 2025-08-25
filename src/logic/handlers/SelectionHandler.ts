import { dbg } from '@/lib/debug';
import { Card, Player } from '@/types/game';
import { replaceCardInDeck, getRandomCards } from '@/lib/gameUtils';

export class SelectionHandler {
  static handleCardSelect(card: Card, player: Player, replaceCardId: string) {
    // Replace the selected card in the player's deck and return the updated player.
    const newPlayer = replaceCardInDeck(player, replaceCardId, card);

    // Post-battle flow: DO NOT start a new battle here. The UI (Game.tsx)
    // should now call GameEngine.createBattle(nextDifficulty) → splash → battleBegin → startTurn.
    dbg(`Reward applied: replaced ${replaceCardId} with ${card.id}. Player level now ${newPlayer.level}.`);

    return { newPlayer };
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