// --- Structured Card Effects System --------------------------------------------------
// Temporary in-file registry. Move to its own module (e.g. lib/effectsRegistry.ts) once
// all cards are migrated to structured effects.

export interface EffectContext {
    sourceCard: Card;
    side: 'player' | 'opponent';
    player: Player;
    opponent: Opponent;
    state: BattleState;
    log: string[];
}
export enum EffectCode {
    // ---- Card / general effects ----
    add_card_to_opp_pile = 'add_card_to_opp_pile',
    add_card_to_self_pile = 'add_card_to_self_pile',
    apply_mod = 'apply_mod',
    /** @deprecated legacy alias; use apply_mod */
    apply_status = 'apply_status',
    remove_mod = 'remove_mod',
    deal_damage = 'deal_damage',
    damage_status_mod = 'damage_status_mod',
    draw_mod = 'draw_mod',

    // ---- Damage/block/evade related effects ----
    damage_mod = 'damage_mod',
    block_mod = 'block_mod',
    evade = 'evade',

    // ---- Passive-related effects ----
    damage_bonus_low_health = 'damage_bonus_low_health',
    block_bonus_flat = 'block_bonus_flat',
    cost_mod = 'cost_mod',
    mod_duration_bonus = 'mod_duration_bonus',
    gain_energy = 'gain_energy',
    first_card_free = 'first_card_free',
    damage_bonus_by_type = 'damage_bonus_by_type',
    set_turn_energy = 'set_turn_energy',
    every_third_type_free = 'every_third_type_free',
    ambush = 'ambush',
    add_card_to_hand = 'add_card_to_hand'
}
export interface EffectInstance {
    code: EffectCode;
    params?: any;
    trigger?: TriggerPhase;
}
// ------------------------------------------------------------------------------------

import { formatLogText, applyMod, resolveAndApplyDamage } from "@/lib/gameUtils";
import { consumeModStacks } from '@/logic/core/StatusManager';
import { Card, DrawModType, CardType, BattleState, Opponent, Player, TriggerPhase } from "@/types/game";
import { ModType } from "./mods";


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

  add_card_to_hand: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'player' : 'opponent');
    const count: number = params?.count ?? 1;

    // Accept either an inline `card` template or an index into related_cards
    const pool = Array.isArray(sourceCard.related_cards) ? sourceCard.related_cards : [];
    const fromIndex: number | undefined = params?.index;
    const template: Card | undefined = params?.card ?? (typeof fromIndex === 'number' ? pool[fromIndex] : undefined);
    if (!template) return;

    const copies: Card[] = Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `${template.id}__copy_${Date.now()}_${i}`,
    }));

    if (target === 'player') {
      state.playerHand.push(...copies);
      log.push(formatLogText(`Added ${copies.length} card(s) to player's hand`, player.class, opponent.name, sourceCard.name));
    } else {
      state.opponentHand.push(...copies);
      log.push(formatLogText(`Added ${copies.length} card(s) to ${opponent.name}'s hand`, player.class, opponent.name, sourceCard.name));
    }
  },

  add_card_to_self_pile: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const index: number = params?.index ?? 0;
    const count: number = params?.count ?? 1;

    const pool = Array.isArray(sourceCard.related_cards) ? sourceCard.related_cards : [];
    const template = params?.card ?? pool[index];
    if (!template) return;

    const cardsToAdd: Card[] = Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `${template.id}__copy_${Date.now()}_${i}`,
    }));

    if (side === 'player') {
      state.playerDiscardPile = [...state.playerDiscardPile, ...cardsToAdd];
      log.push(formatLogText(`Player added ${cardsToAdd.length} card(s) to their discard`, player.class, opponent.name, sourceCard.name));
    } else {
      state.opponentDiscardPile = [...state.opponentDiscardPile, ...cardsToAdd];
      log.push(formatLogText(`${opponent.name} added ${cardsToAdd.length} card(s) to their discard`, player.class, opponent.name, sourceCard.name));
    }
  },

  apply_mod: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');
    const type: ModType = params?.type;
    const stacks: number = params?.stacks ?? params?.value ?? 1;
    const duration: number | undefined = params?.duration;
    const nestedEffects = params?.effects as EffectInstance[] | undefined;
    if (!type || stacks === 0) return;

    if (target === 'player') {
      state.playerMods = applyMod(state.playerMods, type, stacks, duration, nestedEffects);
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} applied ${Math.abs(stacks)} ${type} to player`, player.class, opponent.name, sourceCard.name));
    } else {
      state.opponentMods = applyMod(state.opponentMods, type, stacks, duration, nestedEffects);
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} applied ${Math.abs(stacks)} ${type} to ${opponent.name}`, player.class, opponent.name, sourceCard.name));
    }
  },

  // Back-compat: map old apply_status to apply_mod
  apply_status: (ctx, params) => EFFECTS.apply_mod(ctx, params),

  draw_mod: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const amount: number = params?.amount ?? 0;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');
    const duration: number = params?.duration ?? 1;
    if (!amount || duration <= 0) return;
    if (target === 'player') {
      state.playerMods = applyMod(state.playerMods, ModType.HANDHEX, amount, duration);
      const verb = amount > 0 ? 'increases' : 'reduces';
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} ${verb} player's draws by ${Math.abs(amount)} for ${duration} turn(s)`, player.class, opponent.name, sourceCard.name));
    } else {
      state.opponentMods = applyMod(state.opponentMods, ModType.HANDHEX, amount, duration);
      const verb = amount > 0 ? 'increases' : 'reduces';
      log.push(formatLogText(`${side === 'player' ? 'Player' : opponent.name} ${verb} ${opponent.name}'s draws by ${Math.abs(amount)} for ${duration} turn(s)`, player.class, opponent.name, sourceCard.name));
    }
  },

  // Deal direct damage to player or opponent (delegates to unified routine)
  deal_damage: (ctx, params) => {
    const { state, side, log, opponent, player, sourceCard } = ctx;
    const amount: number = params?.amount ?? 0;
    const explicitTarget: 'player' | 'opponent' | undefined = params?.target;
    if (amount <= 0) return;

    // The resolver always applies damage to the opposite of `side`.
    // If an effect explicitly targets the same side (self-damage/friendly fire),
    // flip the side so the resolver will hit the intended target.
    const defaultTarget: 'player' | 'opponent' = side === 'player' ? 'opponent' : 'player';
    const intendedTarget: 'player' | 'opponent' = explicitTarget ?? defaultTarget;
    const effectiveSide: 'player' | 'opponent' =
      intendedTarget === defaultTarget ? side : (side === 'player' ? 'opponent' : 'player');

    resolveAndApplyDamage({
      side: effectiveSide,
      source: 'effect',
      baseDamage: amount,
      card: sourceCard,
      state,
      player,
      opponent,
      log,
    });
  },

  // Generic damage modifier: supports flat and percent adjustments.
  // Use with TriggerPhase.ONDAMAGEDEALING (outgoing) or ONDAMAGEINCOMING (incoming).
  damage_mod: (ctx, params) => {
    const { sourceCard } = ctx;
    if (!sourceCard) return;
    const flat: number = params?.amount ?? 0; // flat add/subtract
    const percent: number = params?.percent ?? 0; // +/- percent, e.g., +50 => x1.5, -25 => x0.75

    // Percent first, then flat for deterministic stacking
    if (typeof sourceCard.attack === 'number') {
      let atk = sourceCard.attack || 0;
      if (percent) {
        atk = Math.floor(atk * (1 + percent / 100));
      }
      if (flat) {
        atk = atk + flat;
      }
      sourceCard.attack = Math.max(0, atk);
    }
  },

  // Add (or reduce) block immediately on the chosen target. Useful for ONDAMAGEINCOMING.
  // Params: { amount: number, target?: 'self'|'opponent' }
  block_mod: (ctx, params) => {
    const { state, side, player, opponent, log } = ctx;
    const amount: number = params?.amount ?? 0;
    if (!amount) return;

    // Resolve target side relative to the owner of the effect
    const t: 'player' | 'opponent' = (params?.target === 'opponent')
      ? (side === 'player' ? 'opponent' : 'player')
      : side; // default 'self'

    if (t === 'player') {
      state.playerBlock = Math.max(0, (state.playerBlock || 0) + amount);
      log.push(formatLogText(`Player ${amount >= 0 ? 'gains' : 'loses'} ${Math.abs(amount)} block`, player.class, opponent.name, ctx.sourceCard?.name));
    } else {
      state.opponentBlock = Math.max(0, (state.opponentBlock || 0) + amount);
      log.push(formatLogText(`${opponent.name} ${amount >= 0 ? 'gains' : 'loses'} ${Math.abs(amount)} block`, player.class, opponent.name, ctx.sourceCard?.name));
    }
  },

  // Evade current incoming damage by zeroing the attack; optionally consume 1 EVASIVE stack.
  // Use with TriggerPhase.ONDAMAGEINCOMING.
  // Params: { consumeStack?: boolean, target?: 'self'|'opponent' }
  evade: (ctx, params) => {
    const { state, side, player, opponent, log } = ctx;
    if (typeof ctx.sourceCard?.attack === 'number') {
      ctx.sourceCard.attack = 0;
    }

    const consume: boolean = !!params?.consumeStack;
    const t: 'player' | 'opponent' = (params?.target === 'opponent')
      ? (side === 'player' ? 'opponent' : 'player')
      : side; // default 'self'

    if (consume) {
      if (t === 'player') {
        state.playerMods = consumeModStacks(state.playerMods || [], ModType.EVASIVE, 1);
      } else {
        state.opponentMods = consumeModStacks(state.opponentMods || [], ModType.EVASIVE, 1);
      }
    }

    log.push(formatLogText(`${t === 'player' ? 'Player' : opponent.name} evaded the hit`, player.class, opponent.name, ctx.sourceCard?.name));
  },

  damage_status_mod: (ctx, params) => {
    const { state, side, sourceCard } = ctx;
    const bonus: number = params?.amount ?? 0;
    const mod: ModType | undefined = params?.status ?? params?.mod; // support old param name
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');
    if (!mod || bonus <= 0) return;
    const hasMod = target === 'player'
      ? state.playerMods.some(m => m.type === mod && m.stacks > 0)
      : state.opponentMods.some(m => m.type === mod && m.stacks > 0);
    if (!hasMod) return;
    sourceCard.attack = (sourceCard.attack || 0) + bonus;
  },

  remove_mod: (ctx, params) => {
    const { state, side } = ctx;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'opponent' : 'player');
    const type: ModType = params?.type;
    const stacks: number | undefined = params?.stacks;
    if (!type) return;
    if (target === 'player') {
      state.playerMods = typeof stacks === 'number' ? consumeModStacks(state.playerMods, type, Math.max(1, stacks)) : state.playerMods.filter(m => m.type !== type);
    } else {
      state.opponentMods = typeof stacks === 'number' ? consumeModStacks(state.opponentMods, type, Math.max(1, stacks)) : state.opponentMods.filter(m => m.type !== type);
    }
  },

  damage_bonus_low_health: (ctx, params) => {
    const { player, opponent, side, sourceCard } = ctx;
    const threshold: number = params?.threshold ?? 0.5;
    const bonus: number = params?.bonus ?? 0;
    const appliesTo: CardType[] = params?.appliesToTypes ?? [];
    if (bonus <= 0) return;
    const actor = side === 'player' ? player : opponent;
    const hpPct = actor.health / actor.maxHealth;
    const typeOk = !appliesTo?.length || appliesTo.some(t => sourceCard.types?.includes(t));
    if (hpPct < threshold && typeOk) {
      sourceCard.attack = (sourceCard.attack || 0) + bonus;
    }
  },

  block_bonus_flat: (ctx, params) => {
    const bonus: number = params?.bonus ?? 0;
    const appliesToDefense: boolean = !!params?.appliesToDefense;
    const appliesTo: CardType[] = params?.appliesToTypes ?? [];
    if (bonus <= 0) return;
    const typeOk = !appliesTo?.length || appliesTo.some(t => ctx.sourceCard.types?.includes(t));
    if (!typeOk) return;
    if (appliesToDefense || typeof ctx.sourceCard.defense === 'number') {
      ctx.sourceCard.defense = (ctx.sourceCard.defense || 0) + bonus;
    }
  },

  cost_mod: (ctx, params) => {
    const amount: number = params?.amount ?? 0;
    const minimum: number = typeof params?.minimum === 'number' ? params.minimum : 0;
    const appliesTo: CardType[] = params?.appliesToTypes ?? [];
    if (amount === 0) return;
    const ok = !appliesTo?.length || appliesTo.some(t => ctx.sourceCard.types?.includes(t));
    if (!ok) return;
    ctx.sourceCard.cost = Math.max(minimum, (ctx.sourceCard.cost || 0) + amount);
  },

  mod_duration_bonus: (ctx, params) => {
    const { state, side } = ctx;
    const type: ModType = params?.type;
    const amount: number = params?.amount ?? 0;
    const target: 'player' | 'opponent' = params?.target ?? (side === 'player' ? 'player' : 'opponent');
    if (!type || amount === 0) return;
    const mods = target === 'player' ? state.playerMods : state.opponentMods;
    const updated = mods.map(m => m.type === type ? { ...m, duration: (m.duration ?? 0) + amount } : m);
    if (target === 'player') state.playerMods = updated; else state.opponentMods = updated;
  },

  gain_energy: (ctx, params) => {
    const { state, player, opponent } = ctx;
    const target: 'player' | 'opponent' = params?.target ?? 'player';
    const amount: number = params?.amount ?? 0;
    if (amount === 0) return;
    if (target === 'player') state.playerEnergy = Math.max(0, Math.min(player.maxEnergy, state.playerEnergy + amount));
    else state.opponentEnergy = Math.max(0, state.opponentEnergy + amount);
  },

  first_card_free: (ctx, params) => {
    const { state, side } = ctx;
    const who: 'player' | 'opponent' = params?.side ?? (side === 'player' ? 'player' : 'opponent');
    // Mark on state; playOneCard can zero the cost of the first played card when this flag is present.
    if (who === 'player') (state as any).__firstCardFreePlayer = true; else (state as any).__firstCardFreeOpponent = true;
  },

  damage_bonus_by_type: (ctx, params) => {
    const bonus: number = params?.bonus ?? 0;
    const types: CardType[] = params?.appliesToTypes ?? [];
    if (bonus <= 0) return;
    if (!types?.length || types.some(t => ctx.sourceCard.types?.includes(t))) {
      ctx.sourceCard.attack = (ctx.sourceCard.attack || 0) + bonus;
    }
  },

  set_turn_energy: (ctx, params) => {
    const { state, player, opponent } = ctx;
    const target: 'player' | 'opponent' = params?.target ?? 'player';
    const amount: number = params?.amount ?? 0;
    if (target === 'player') state.playerEnergy = Math.max(0, Math.min(player.maxEnergy, amount));
    else state.opponentEnergy = Math.max(0, amount);
  },

  every_third_type_free: (ctx, params) => {
    const count: number = params?.count ?? 3;
    const types: CardType[] = params?.appliesToTypes ?? [];
    if (count <= 1) return;
    const key = `__typeCount_${(types || []).join('_')}_${ctx.side}`;
    const st = ctx.state as any;
    st[key] = (st[key] || 0) + 1;
    if (st[key] % count === 0) {
      if (!types?.length || types.some(t => ctx.sourceCard.types?.includes(t))) {
        ctx.sourceCard.cost = 0;
      }
    }
  },

  ambush: (ctx, _params) => {
    // This effect serves as a marker in passives; battle initialization can detect opponent passives
    // containing EffectCode.ambush to let the opponent start first. No runtime action needed here.
    (ctx.state as any).__ambushFlag = true;
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
