import { EffectInstance, EffectCode } from "./effects";

export enum ModType {
  BLEEDING = 'bleeding',
  DEXTERITY = 'dexterity',
  EVASIVE = 'evasive',
  STRENGTH = 'strength',
  VULNERABLE = 'vulnerable',
  WEAK = 'weak',
  HANDHEX = 'handhex'
}
export const MOD_DEFS: Record<ModType, {
  maxStacks: number;
  defaultDuration: number; // applyMod can use this if caller omits duration
  stackMode: 'add' | 'replace'; // how stacks behave on reapply
}> = {
  [ModType.BLEEDING]: { maxStacks: 5, defaultDuration: 2, stackMode: 'add' },
  [ModType.EVASIVE]: { maxStacks: 3, defaultDuration: 2, stackMode: 'add' },
  [ModType.WEAK]: { maxStacks: 1, defaultDuration: 2, stackMode: 'replace' },
  [ModType.VULNERABLE]: { maxStacks: 1, defaultDuration: 2, stackMode: 'replace' },
  [ModType.STRENGTH]: { maxStacks: 99, defaultDuration: 2, stackMode: 'add' },
  [ModType.DEXTERITY]: { maxStacks: 99, defaultDuration: 2, stackMode: 'add' },
  [ModType.HANDHEX]: { maxStacks: 99, defaultDuration: 1, stackMode: 'add' },
};
/**
 * Default, engine-driven effects for certain mods.
 * The engine (apply_mod/applyMod) can attach these when a mod is applied
 * and the caller did not provide custom `effects` for the mod instance.
 *
 * Notes:
 * - We intentionally use string casting for `trigger` to avoid importing TriggerPhase here.
 * - `target: 'self'` means the effect applies to the owner of the mod on the active side.
 * - `amountFromModStacks: true` will be resolved by the runner to the mod's current stacks.
 */
export const MOD_DEFAULT_EFFECTS: Partial<Record<ModType, EffectInstance[]>> = {
  [ModType.BLEEDING]: [
    {
      code: EffectCode.deal_damage as any,
      params: { amountFromModStacks: true, target: 'self' },
      trigger: 'BEFOREDRAW' as any,
    },
  ],
};
export interface ActiveMod {
  type: ModType; // e.g., BLEEDING, EVASIVE, HANDHEX, …
  stacks: number; // how many stacks (always clamped by MOD_DEFS.maxStacks)
  duration: number; // remaining turns (always decremented by a single tick fn)
  effects?: EffectInstance[]; // optional phase-bound effects (e.g., “deal bleed dmg on start”)
}
export type StatusEffect = ActiveMod;


