import { PlayerClass, Passive, CardType, TriggerPhase } from '@/types/game';
import { ModType } from "./mods";
import { EffectCode } from "./effects";

// Effect-driven passives. Each passive is a bundle of EffectInstances that may
// optionally include a `trigger` phase. This removes hard-coded conditionals.

export const passives: Record<PlayerClass, Passive[]> = {
  warrior: [
    {
      id: 'warrior_berserker',
      name: 'Berserker Rage',
      description: 'Deal +2 damage while below 50% health.',
      effects: [
        {
          code: EffectCode.damage_bonus_low_health,
          trigger: TriggerPhase.ONDAMAGEDEALING,
          params: {
            threshold: 0.5,
            bonus: 2,
            appliesToTypes: [CardType.ATTACK, CardType.MELEE]
          }
        }
      ]
    },
    {
      id: 'warrior_iron_skin',
      name: 'Iron Skin',
      description: 'Gain +3 block from all block cards.',
      effects: [
        {
          code: EffectCode.block_bonus_flat,
          trigger: TriggerPhase.ONCARDPLAY,
          params: {
            bonus: 3,
            appliesToDefense: true
          }
        }
      ]
    },
    {
      id: 'warrior_weapon_master',
      name: 'Weapon Master',
      description: 'Attack cards cost 1 less energy.',
      effects: [
        {
          code: EffectCode.cost_mod,
          trigger: TriggerPhase.ONCARDPLAY,
          params: {
            amount: -1,
            minimum: 0,
            appliesToTypes: [CardType.ATTACK, CardType.MELEE]
          }
        }
      ]
    }
  ],
  rogue: [
    {
      id: 'rogue_shadow_dancer',
      name: 'Shadow Dancer',
      description: 'Start each turn with +1 energy.',
      effects: [
        {
          code: EffectCode.gain_energy,
          trigger: TriggerPhase.STARTOFTURN,
          params: { amount: 1, target: 'player' }
        }
      ]
    },
    {
      id: 'rogue_deadly_precision',
      name: 'Deadly Precision',
      description: 'The first card each turn costs 0.',
      effects: [
        {
          code: EffectCode.first_card_free,
          trigger: TriggerPhase.BEFOREDRAW,
          params: { side: 'player' }
        }
      ]
    }
  ],
  wizard: [
    {
      id: 'wizard_arcane_mastery',
      name: 'Arcane Mastery',
      description: 'Spell cards deal +3 damage.',
      effects: [
        {
          code: EffectCode.damage_bonus_by_type,
          trigger: TriggerPhase.ONDAMAGEDEALING,
          params: {
            bonus: 3,
            appliesToTypes: [CardType.SPELL]
          }
        }
      ]
    },
    {
      id: 'wizard_mana_efficiency',
      name: 'Mana Efficiency',
      description: 'Start each turn with 4 energy instead of 3.',
      effects: [
        {
          code: EffectCode.set_turn_energy,
          trigger: TriggerPhase.BEFOREDRAW,
          params: { amount: 4, target: 'player' }
        }
      ]
    },
    {
      id: 'wizard_elemental_focus',
      name: 'Elemental Focus',
      description: 'Every 3rd spell costs 0.',
      effects: [
        {
          code: EffectCode.every_third_type_free,
          trigger: TriggerPhase.ONCARDPLAY,
          params: { count: 3, appliesToTypes: [CardType.SPELL] }
        }
      ]
    }
  ]
};

// Opponent-side passives (same Passive type). These were previously defined in the same
// list; split out for clarity but still use the *same* Passive model and `effects[]`.
export const opponentPassives: Record<string, Passive> = {
  wolf_ambush: {
    id: 'wolf_ambush',
    name: 'Ambush',
    description: 'This enemy plays first in battle.',
    effects: [
      {
        code: EffectCode.ambush,
        trigger: TriggerPhase.BATTLEBEGIN
      }
    ]
  },
  goblin_coward: {
    id: 'goblin_coward',
    name: 'Coward',
    description: 'At the start of its turn, if below 50% health, add a free Volatile Cower to hand.',
    effects: [
      {
        code: EffectCode.add_card_to_hand,
        trigger: TriggerPhase.BEFOREDRAW,
        params: {
          card: {
            id: 'goblin_cower_volatile_template',
            name: 'Cower',
            description: 'Gain 1 Evasive. Volatile.',
            cost: 0,
            types: [CardType.SKILL, CardType.VOLATILE],
            effects: [
              { code: EffectCode.apply_mod, params: { type: ModType.EVASIVE, stacks: 1, duration: 1, target: 'self' } }
            ]
          },
          ownerBelowHealthPct: 0.5
        }
      }
    ]
  }
};

// Legacy export kept for backward compatibility (no entries by default)
export const extraPassives: any[] = [];
