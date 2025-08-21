import { BattleState, Card, CardType, Opponent, Player } from '@/types/game';
import { ModType } from "@/content/modules/mods";

/**
 * Unified opponent AI for deciding which cards to play each turn.
 *
 * The AI follows a three step process:
 *  1. It first checks for cards with enabling conditions and plays any card
 *     whose enabling condition is satisfied.  Enabling conditions
 *     determine whether a card can be played at all.  If no enabling
 *     condition is defined for a card, it is considered always playable.
 *  2. If no enabling‑condition cards are present, it greedily selects
 *     combinations of cards to maximise the number of cards played,
 *     given the available energy.  Cards are sorted by cost (low to high)
 *     and by intrinsic priority (non‑attack > attack with effect > plain
 *     attack).  It picks cards until energy runs out.
 *  3. Finally, the selected cards are ordered by priority so that more
 *     interesting effects happen before plain damage.
 *
 * In addition to enabling conditions, the AI supports empowering conditions
 * that increase a card's priority when satisfied.  Empowering conditions
 * do not block a card from being played; they only boost its ranking.
 *
 * To customise behaviour for specific opponents, extend this class and
 * override the `enablingConditions` and `empoweringConditions` maps or
 * override `cardPriority` for bespoke ordering.
 */
export class OpponentAI {
  /**
   * Mapping of card id to a function returning true if the card can be
   * played.  If the function returns false, the card will not be
   * considered for play this turn.  Use this for cards like Booby
   * Trap that are only usable when certain combat history exists.
   */
  protected enablingConditions: Record<string, (state: BattleState, opponent: Opponent, player: Player) => boolean> = {
    // Goblin Booby Trap: can only be played if last turn damage was prevented by Evasive
    'goblin_booby_trap': (state: BattleState) => {
      return state.battleLog.some(entry => entry.includes("'s Evasive prevented") && entry.includes('from'));
    }
  };

  /**
   * Mapping of card id to a function returning true if the card should
   * receive a priority boost.  Empowering conditions do not block
   * playing a card but will raise its priority relative to others.
   */
  protected empoweringConditions: Record<string, (state: BattleState, opponent: Opponent, player: Player) => boolean> = {
    // Beast Killing Instinct: deals bonus when the player is bleeding
    'beast_hunters_instinct': (state: BattleState) => {
      return state.playerStatusEffects.some(effect => effect.type === ModType.BLEEDING && effect.value > 0);
    },
    // Rogue Backstab: highest priority if this is the first card played by the opponent this turn
    'rogue_backstab': (state: BattleState) => {
      return state.opponentPlayedCards.length === 0;
    },
    // Wizard Arcane Power: prioritise if opponent has spell cards in hand (by effect containing 'spell')
    'wizard_arcane_power': (state: BattleState, opponent: Opponent) => {
      return state.opponentHand.some(c => {
        const hasSpellEffect = c.effect?.toLowerCase().includes('spell');
        return hasSpellEffect;
      });
    }
  };

  /**
   * Decide which cards to play given the current hand, energy and combat state.
   * Returns an ordered list of cards to play.  You should re‑invoke this
   * method after each card is played since the battle state and energy
   * will change.
   */
  public decidePlays(
    hand: Card[],
    energy: number,
    state: BattleState,
    opponent: Opponent,
    player: Player
  ): Card[] {
    // Filter out unplayable cards by cost and unplayable flag
    let playable = hand.filter(c => !c.unplayable && c.cost <= energy);
    if (playable.length === 0) return [];

    // Exclude cards whose enabling condition is not met
    playable = playable.filter(card => {
      const cond = this.enablingConditions[card.id];
      return !cond || cond(state, opponent, player);
    });
    if (playable.length === 0) return [];

    // Step 1: pick cards satisfying empowering conditions
    const empowered = playable.filter(card => {
      const cond = this.empoweringConditions[card.id];
      return cond && cond(state, opponent, player);
    });
    if (empowered.length > 0) {
      // Return empowered cards sorted by priority
      return empowered.sort((a, b) => {
        const pa = this.cardPriority(a);
        const pb = this.cardPriority(b);
        // Higher priority first; tie break by lower cost
        return pb - pa || a.cost - b.cost;
      });
    }

    // Step 2: greedily choose as many cards as possible based on cost and priority
    // Sort cards by cost ascending then by priority descending
    const sorted = [...playable].sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      // When costs are equal, prefer higher priority
      return this.cardPriority(b) - this.cardPriority(a);
    });
    const chosen: Card[] = [];
    let remaining = energy;
    for (const card of sorted) {
      if (card.cost <= remaining) {
        chosen.push(card);
        remaining -= card.cost;
      }
    }
    if (chosen.length === 0) return [];

    // Step 3: sort chosen cards by priority (descending) then by cost (ascending)
    return chosen.sort((a, b) => {
      const pa = this.cardPriority(a);
      const pb = this.cardPriority(b);
      return pb - pa || a.cost - b.cost;
    });
  }

  /**
   * Determine the intrinsic priority of a card based on its type and effect.
   * Higher values indicate the card should be played earlier.
   */
  protected cardPriority(card: Card): number {
    const types = card.types || [];
    const isAttack = types.includes(CardType.ATTACK);
    const hasEffect = !!card.effect && card.effect.trim().length > 0;
    if (!isAttack) return 3;        // Non‑attack cards (skills, powers) highest priority
    if (hasEffect) return 2;        // Attack cards with effects next
    return 1;                       // Plain attack cards lowest
  }
}