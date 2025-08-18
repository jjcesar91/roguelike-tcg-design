// --- Structured Card Effects System --------------------------------------------------
// Temporary in-file registry. Move to its own module (e.g. lib/effectsRegistry.ts) once
// all cards are migrated to structured effects.

import { addDrawModification, applyStatusEffect, formatLogText } from "@/lib/gameUtils";
import { Card, DrawModType, EffectCode, EffectContext, EffectInstance, StatusType } from "@/types/game";


function ensureArray<T>(x: T | T[] | undefined): T[] { return Array.isArray(x) ? x : x ? [x] : []; }

const EFFECTS: Record<EffectCode, (ctx: EffectContext, params?: any) => void> = {
  // Add cards to the opposite side's discard pile
  add_card_to_opp_pile: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const index: number = params?.index ?? 0;
    const count: number = params?.count ?? 1;

    const pool = Array.isArray(sourceCard.related_cards) ? sourceCard.related_cards : [];
    const template = pool[index];
    if (!template) return;

    // Create shallow copies so each inserted card is an independent instance
    const cardsToAdd: Card[] = Array.from({ length: count }, (_, i) => ({
      ...template,
      // ensure unique ids to avoid collisions in piles if needed
      id: `${template.id}__copy_${Date.now()}_${i}`,
    }));

    if (side === 'player') {
      state.opponentDiscardPile = [...state.opponentDiscardPile, ...cardsToAdd];
      log.push(formatLogText(`Player added ${cardsToAdd.length} card(s) to ${opponent.name}'s discard`, player.class, opponent.name, sourceCard.name));
    } else {
      state.playerDiscardPile = [...state.playerDiscardPile, ...cardsToAdd];
      log.push(formatLogText(`${opponent.name} added ${cardsToAdd.length} card(s) to player's discard`, player.class, opponent.name, sourceCard.name));
    }
  },

  // Apply status to a target
  apply_status: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');
    const type: StatusType = params?.type;
    const value: number = params?.value ?? 1;
    const duration: number = params?.duration ?? value;
    if (!type) return;

    if (target === 'player') {
      state.playerStatusEffects = applyStatusEffect(state.playerStatusEffects, type, value, duration);
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} applied ${value} ${type} to player`, player.class, opponent.name, sourceCard.name));
    } else {
      state.opponentStatusEffects = applyStatusEffect(state.opponentStatusEffects, type, value, duration);
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} applied ${value} ${type} to ${opponent.name}`, player.class, opponent.name, sourceCard.name));
    }
  },

  // Convenience: gain evasive on self
  gain_evasive_self: (ctx, params) => {
    const { state, side } = ctx;
    const duration: number = params?.duration ?? 3;
    if (side === 'player') {
      state.playerStatusEffects = applyStatusEffect(state.playerStatusEffects, StatusType.EVASIVE, 1, duration);
    } else {
      state.opponentStatusEffects = applyStatusEffect(state.opponentStatusEffects, StatusType.EVASIVE, 1, duration);
    }
  },

  // Apply a status that modifies future draws for a duration
  draw_mod: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const amount: number = params?.amount ?? 0; // positive -> add draws, negative -> subtract
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');
    const duration: number = params?.duration ?? 1;

    if (!amount || duration <= 0) return;

    if (target === 'player') {
      state.playerStatusEffects = applyStatusEffect(state.playerStatusEffects, StatusType.HANDHEX, amount, duration);
      const verb = amount > 0 ? 'increases' : 'reduces';
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} ${verb} player's draws by ${Math.abs(amount)} for ${duration} turn(s)`, player.class, opponent.name, sourceCard.name));
    } else {
      state.opponentStatusEffects = applyStatusEffect(state.opponentStatusEffects, StatusType.HANDHEX, amount, duration);
      const verb = amount > 0 ? 'increases' : 'reduces';
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} ${verb} ${opponent.name}'s draws by ${Math.abs(amount)} for ${duration} turn(s)`, player.class, opponent.name, sourceCard.name));
    }
  },

  // Deal direct damage to player or opponent
  deal_damage: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    let amount: number = params?.amount ?? 0;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');
    if (amount <= 0) return;

    if (target === 'player') {
      // Apply to player's block first
      if (state.playerBlock > 0) {
        const absorbed = Math.min(state.playerBlock, amount);
        state.playerBlock -= absorbed;
        amount -= absorbed;
        if (absorbed > 0) {
          log.push(formatLogText(`${sourceCard.name} dealt ${absorbed} to player's block`, player.class, opponent.name, sourceCard.name));
        }
      }
      if (amount > 0) {
        player.health = Math.max(0, player.health - amount);
        log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} dealt ${amount} damage to player`, player.class, opponent.name, sourceCard.name));
      }
    } else {
      // Apply to opponent's block first
      if (state.opponentBlock > 0) {
        const absorbed = Math.min(state.opponentBlock, amount);
        state.opponentBlock -= absorbed;
        amount -= absorbed;
        if (absorbed > 0) {
          log.push(formatLogText(`${sourceCard.name} dealt ${absorbed} to ${opponent.name}'s block`, player.class, opponent.name, sourceCard.name));
        }
      }
      if (amount > 0) {
        opponent.health = Math.max(0, opponent.health - amount);
        log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} dealt ${amount} damage to ${opponent.name}`, player.class, opponent.name, sourceCard.name));
      }
    }
  },

  // Bonus damage if target has a specific status (e.g., +5 if bleeding)
  damage_status_mod: (ctx, params) => {
    const { state, side, sourceCard } = ctx;
    const bonus: number = params?.amount ?? 0;
    const status: StatusType | undefined = params?.status;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');

    if (!status || bonus <= 0) return;

    const hasStatus = target === 'player'
      ? state.playerStatusEffects.some(se => se.type === status && se.value > 0)
      : state.opponentStatusEffects.some(se => se.type === status && se.value > 0);

    if (!hasStatus) return;

    // OPTION B: mutate the source card's base attack before damage is calculated
    sourceCard.attack = (sourceCard.attack || 0) + bonus;
  },
};

export function runCardEffects(sourceCard: Card & { effects?: EffectInstance[] }, ctxBase: Omit<EffectContext, 'sourceCard'>, log: string[]): boolean {
  const effects = ensureArray(sourceCard.effects);
  if (!effects.length) return false;
  const ctx: EffectContext = { ...ctxBase, sourceCard } as EffectContext;
  for (const e of effects) {
    const handler = EFFECTS[e.code as EffectCode];
    if (handler) {
      handler(ctx, e.params);
    }
  }
  return true;
}
// ------------------------------------------------------------------------------------