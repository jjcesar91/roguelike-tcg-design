import { StatusEffect, ModType } from '@/types/game';

/**
 * Centralized status logic: stacking, duration, consume events.
 */
export default class StatusManager {
  static cap(effect: StatusEffect): StatusEffect {
    if (effect.type === ModType.BLEEDING) return { ...effect, value: Math.min(5, effect.value) };
    if (effect.type === ModType.EVASIVE) return { ...effect, value: Math.min(3, effect.value) };
    return effect;
  }

  static add(effects: StatusEffect[], type: StatusEffect['type'], value: number, duration: number): StatusEffect[] {
    const next = effects.map(e => ({ ...e }));
    const idx = next.findIndex(e => e.type === type);
    if (idx >= 0) {
      const cur = next[idx];
      if (type === 'weak') {
        next[idx] = this.cap({ ...cur, duration });
      } else if (type === 'bleeding' || type === 'evasive') {
        next[idx] = this.cap({ ...cur, value: cur.value + value, duration });
      } else {
        next[idx] = this.cap({ ...cur, value: cur.value + value, duration });
      }
    } else {
      next.push(this.cap({ type, value, duration } as StatusEffect));
    }
    return next;
  }

  static tick(effects: StatusEffect[]): StatusEffect[] {
    return effects
      .map(e => {
        if (e.type === ModType.BLEEDING || e.type === ModType.EVASIVE) return this.cap(e);
        return { ...e, duration: e.duration - 1 };
      })
      .filter(e => e.type === ModType.BLEEDING || e.type === ModType.EVASIVE || e.duration > 0);
  }

  static consumeEvasive(effects: StatusEffect[]): StatusEffect[] {
    const next = effects.map(e => ({ ...e }));
    const idx = next.findIndex(e => e.type === ModType.EVASIVE);
    if (idx >= 0 && next[idx].value > 0) {
      next[idx].value -= 1;
      if (next[idx].value <= 0) next.splice(idx, 1);
    }
    return next;
  }
}
