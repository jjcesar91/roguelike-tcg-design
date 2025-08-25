import { PlayerClass, Player, Opponent, BattleState, Card, TriggerPhase, Turn, Difficulty } from '@/types/game';
import { BattleHandler } from '../handlers/BattleHandler';
import { SelectionHandler } from '../handlers/SelectionHandler';
import { createPlayer, getRandomPassives, getRandomOpponent, initializeBattle, runPhaseForSide, computeDrawCountForSide, drawCardsWithMinionEffects, formatLogText, checkVictory, checkDefeat } from '@/lib/gameUtils';
import { EffectInstance, EffectCode } from '@/content/modules/effects';
import { BattleEngine } from './BattleEngine';

/**
 * GameEngine – single orchestration surface.
 *
 * Goals of this refactor:
 * 1) Avoid duplicating bootstrapping logic between hooks and handlers.
 * 2) Introduce explicit lifecycle entry points: init run, create battle, run turns.
 * 3) Keep current API surface working (back-compat wrappers) while we migrate callers.
 */
export class GameEngine {
  // =============================
  // NEW LIFECYCLE ENTRY POINTS
  // =============================

  /**
   * Initialize a new run/session right after class selection.
   * NOTE: For now we reuse ClassHandler.handleClassSelect to avoid breaking flow
   * and immediately return the opponent/battle too. In next steps we will
   * swap this to a true "player-only" bootstrap in ClassHandler and let
   * `createBattle` handle opponent selection.
   */
  static initRun(playerClass: PlayerClass) {
    const player = createPlayer(playerClass);
    return { player };
  }

  /**
   * Centralized battle creation. Given the current run state (player, difficulty),
   * pick an opponent for that difficulty and initialize the battle scene.
   *
   * While we migrate, this delegates to the OOP BattleEngine to avoid logic duplication.
   */
  static createBattle(player: Player, difficulty: Difficulty = Difficulty.BASIC) {
    const opponent: Opponent = getRandomOpponent(difficulty);
    const battleState: BattleState = initializeBattle(player, opponent);
    return this.battleBegin(player,opponent,battleState);
  }

  /**
   * Run the standard battle-begin trigger sweep (e.g., ambush / turn order).
   * Exposed for the upcoming centralized flow; safe no-op wrapper if unused.
   */
  static battleBegin(player: Player, opponent: Opponent, battleState: BattleState) {
    const playerEffects: EffectInstance[] = [];
    const opponentEffects: EffectInstance[] = [];

    // Collect player passive effects with trigger BATTLEBEGIN
    for (const passive of player.passives) {
      if (passive.effects) {
        for (const effect of passive.effects) {
          if (effect.trigger === TriggerPhase.BATTLEBEGIN) {
            playerEffects.push(effect);
          }
        }
      }
    }

    // Collect opponent passive effects with trigger BATTLEBEGIN
    for (const passive of opponent.passives ?? []) {
      if (passive.effects) {
        for (const effect of passive.effects) {
          if (effect.trigger === TriggerPhase.BATTLEBEGIN) {
            opponentEffects.push(effect);
          }
        }
      }
    }

    // Collect playerMods effects with trigger BATTLEBEGIN
    if (battleState.playerMods) {
      for (const mod of battleState.playerMods) {
        if (mod.effects) {
          for (const effect of mod.effects) {
            if (effect.trigger === TriggerPhase.BATTLEBEGIN) {
              playerEffects.push(effect);
            }
          }
        }
      }
    }

    // Collect opponentMods effects with trigger BATTLEBEGIN
    if (battleState.opponentMods) {
      for (const mod of battleState.opponentMods) {
        if (mod.effects) {
          for (const effect of mod.effects) {
            if (effect.trigger === TriggerPhase.BATTLEBEGIN) {
              opponentEffects.push(effect);
            }
          }
        }
      }
    }

    const playerHasAmbush = playerEffects.some(e => e.code === EffectCode.ambush);
    const opponentHasAmbush = opponentEffects.some(e => e.code === EffectCode.ambush);

    if (playerHasAmbush && !opponentHasAmbush) {
      battleState.turn = Turn.PLAYER;
    } else if (!playerHasAmbush && opponentHasAmbush) {
      battleState.turn = Turn.OPPONENT;
    } else if (playerHasAmbush && opponentHasAmbush) {
      // Opponent wins tie
      battleState.turn = Turn.OPPONENT;
    }

    return { player, opponent, battleState };
  }

  static beginBattleTriggers(player: Player, opponent: Opponent, battleState: BattleState) {
    return GameEngine.battleBegin(player, opponent, battleState);
  }

  /**
   * Unified start-of-turn pipeline used by BOTH sides.
   * Steps:
   *  1) BEFOREDRAW triggers (mods+passives on the active side)
   *  2) Draw N cards (respect draw-mod helpers when available)
   *  3) ONCARDRAW per drawn card
   *  4) STARTOFTURN triggers
   */
  static startTurn(
    side: 'player' | 'opponent',
    player: Player,
    opponent: Opponent,
    battleState: BattleState
  ) {
    // 1) BEFOREDRAW
    runPhaseForSide?.(TriggerPhase.BEFOREDRAW, {
      side,
      state: battleState,
      player,
      opponent,
      log: battleState?.battleLog ?? [],
    });

    // 2) Draw cards (respect draw-mod helpers)
    const drawCount: number = (typeof computeDrawCountForSide === 'function'
      ? computeDrawCountForSide(side, battleState)
      : 3) | 0;

    let drawn: Card[] = [];
    if (typeof drawCardsWithMinionEffects === 'function') {
      // unified util: draw based on active side and battle state
      const res = drawCardsWithMinionEffects(side, drawCount, battleState);
      drawn = res.drawnCards ?? [];
      // util is expected to update battleState's decks/hand, but ensure hand push as fallback
      if (!res.appliedToState) {
        const handKey = side === 'player' ? 'playerHand' : 'opponentHand';
        battleState[handKey].push(...drawn);
      }
      // append any minion damage logs it produced
      if (Array.isArray(res.minionDamageLog) && res.minionDamageLog.length) {
        battleState.battleLog.push(...res.minionDamageLog);
      }
      // if util returned updated state fragments, merge them conservatively
      if (res.updatedDeck) {
        const deckKey = side === 'player' ? 'playerDeck' : 'opponentDeck';
        battleState[deckKey] = res.updatedDeck;
      }
      if (res.updatedDiscardPile) {
        const pileKey = side === 'player' ? 'playerDiscardPile' : 'opponentDiscardPile';
        battleState[pileKey] = res.updatedDiscardPile;
      }
    } else {
      // Minimal fallback draw (no reshuffle/edge cases).
      const handKey = side === 'player' ? 'playerHand' : 'opponentHand';
      const deckKey = side === 'player' ? 'playerDeck' : 'opponentDeck';
      const deck: Card[] = battleState[deckKey]?.cards ?? [];
      const take = Math.min(drawCount, deck.length);
      drawn = deck.splice(0, take);
      battleState[handKey].push(...drawn);
      if (formatLogText) {
        const who = side === 'player' ? 'Player' : opponent.name;
        battleState.battleLog.push(formatLogText(`${who} drew ${drawn.length} card(s)`, player.class, opponent.name, ''));
      }
    }

    // 3) ONCARDRAW per card
    if (Array.isArray(drawn) && drawn.length && typeof runPhaseForSide === 'function') {
      for (const card of drawn) {
        runPhaseForSide(TriggerPhase.ONCARDRAW, {
          side,
          state: battleState,
          player,
          opponent,
          card,
          log: battleState?.battleLog ?? [],
        });
      }
    }

    // 4) STARTOFTURN
    runPhaseForSide?.(TriggerPhase.STARTOFTURN, {
      side,
      state: battleState,
      player,
      opponent,
      log: battleState?.battleLog ?? [],
    });

    return { player, opponent, battleState };
  }

  // =============================
  // EXISTING API (Back-compat)
  // =============================


  static playCard(card: Card, player: Player, opponent: Opponent, battleState: BattleState) {
    return BattleHandler.handleCardPlay(card, player, opponent, battleState);
  }

  static endTurn(battleState: BattleState, player: Player, opponent: Opponent) {
    if (typeof runPhaseForSide === 'function') {
      const endingSide: 'player' | 'opponent' = battleState.turn === Turn.PLAYER ? 'player' : 'opponent';
      runPhaseForSide(TriggerPhase.ENDOFTURN, {
        side: endingSide,
        state: battleState,
        player,
        opponent,
        log: battleState?.battleLog ?? [],
      });
    }

    // Flip turn.
    const nextSide: 'player' | 'opponent' = battleState.turn === Turn.PLAYER ? 'opponent' : 'player';
    battleState.turn = nextSide === 'player' ? Turn.PLAYER : Turn.OPPONENT;

    // Let the caller decide whether to immediately start the next side's turn
    // (e.g., Game.tsx can call GameEngine.startTurn(nextSide, ...)).
    const isOpponentTurn = nextSide === 'opponent';

    return {
      newBattleState: battleState,
      newPlayer: player,
      newOpponent: opponent,
      isOpponentTurn,
      nextSide,
    };
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

  static canPlayCard(card: Card, battleState: BattleState) {
    return BattleHandler.canPlayCard(card, battleState);
  }

}
