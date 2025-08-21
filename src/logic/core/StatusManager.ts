import { ModType } from "@/content/modules/mods";
import type { ActiveMod as StatusEffect } from "@/content/modules/mods";

/**
 * Centralized status logic: stacking, duration, consume events.
 * Aligns with MOD_DEFS semantics (stacks + duration per mod).
 */
export default class StatusManager {
  /**
   * Clamp stacks to MOD_DEFS.maxStacks for the given effect type.
   */
  static cap(effect: StatusEffect): StatusEffect {
    const { MOD_DEFS } = require("@/content/modules/mods");
    const def = MOD_DEFS[effect.type];
    const max = def?.maxStacks ?? Number.MAX_SAFE_INTEGER;
    return { ...effect, stacks: Math.min(max, Math.max(0, effect.stacks)) };
  }

  /**
   * Add or reapply a status effect.
   * - stackMode 'add': stacks += value
   * - stackMode 'replace': stacks = value
   * Duration is set/refresh based on provided duration; caller should pass the intended
   * remaining duration (use MOD_DEFS[type].defaultDuration if you want the default).
   */
  static add(
    effects: StatusEffect[],
    type: StatusEffect["type"],
    value: number,
    duration: number
  ): StatusEffect[] {
    const { MOD_DEFS } = require("@/content/modules/mods");
    const def = MOD_DEFS[type];
    const next = effects.map(e => ({ ...e }));
    const idx = next.findIndex(e => e.type === type);

    if (idx >= 0) {
      const cur = next[idx];
      const stacks =
        def?.stackMode === "replace" ? value : cur.stacks + value;
      next[idx] = this.cap({
        ...cur,
        stacks,
        duration, // refresh duration on reapply (explicit policy)
      });
    } else {
      next.push(
        this.cap({
          type,
          stacks: value,
          duration,
        } as StatusEffect)
      );
    }
    return next;
  }

  /**
   * Decrement duration for all effects by 1.
   * Remove any whose duration drops to 0 or less.
   */
  static tick(effects: StatusEffect[]): StatusEffect[] {
    return effects
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0)
      .map(e => this.cap(e));
  }

  /**
   * Consume a single stack of EVASIVE (if present). Does not change duration.
   * Remove the effect if stacks reach 0.
   */
  static consumeEvasive(effects: StatusEffect[]): StatusEffect[] {
    const next = effects.map(e => ({ ...e }));
    const idx = next.findIndex(e => e.type === ModType.EVASIVE);
    if (idx >= 0 && next[idx].stacks > 0) {
      next[idx].stacks -= 1;
      if (next[idx].stacks <= 0) next.splice(idx, 1);
      else next[idx] = this.cap(next[idx]);
    }
    return next;
  }
}
