import { PlayerClass, Passive, OpponentPassive } from '@/types/game';

// Base passive abilities for each player class.  These were previously
// defined in gameData.ts and have been moved here for easier extension.
export const passives: Record<PlayerClass, Passive[]> = {
  warrior: [
    {
      id: 'warrior_berserker',
      name: 'berserker Rage',
      description: 'Deal 2 extra damage when below 50% health',
      class: PlayerClass.WARRIOR,
      effect: 'damage_bonus_low_health'
    },
    {
      id: 'warrior_iron_skin',
      name: 'iron Skin',
      description: 'Gain 3 extra block from all block cards',
      class: PlayerClass.WARRIOR,
      effect: 'extra_block'
    },
    {
      id: 'warrior_weapon_master',
      name: 'weapon Master',
      description: 'Attack cards cost 1 less energy',
      class: PlayerClass.WARRIOR,
      effect: 'attack_cost_reduction'
    }
  ],
  rogue: [
    {
      id: 'rogue_poison_master',
      name: 'poison Master',
      description: 'Poison effects last 1 extra turn',
      class: PlayerClass.ROGUE,
      effect: 'poison_duration_bonus'
    },
    {
      id: 'rogue_shadow_dancer',
      name: 'shadow Dancer',
      description: 'Start each turn with 1 extra energy',
      class: PlayerClass.ROGUE,
      effect: 'extra_energy'
    },
    {
      id: 'rogue_deadly_precision',
      name: 'deadly Precision',
      description: 'First card each turn costs 0',
      class: PlayerClass.ROGUE,
      effect: 'first_card_free'
    }
  ],
  wizard: [
    {
      id: 'wizard_arcane_mastery',
      name: 'arcane Mastery',
      description: 'Spell cards deal 3 extra damage',
      class: PlayerClass.WIZARD,
      effect: 'spell_damage_bonus'
    },
    {
      id: 'wizard_mana_efficiency',
      name: 'mana Efficiency',
      description: 'Start each turn with 4 energy instead of 3',
      class: PlayerClass.WIZARD,
      effect: 'max_energy_bonus'
    },
    {
      id: 'wizard_elemental_focus',
      name: 'elemental Focus',
      description: 'Every 3rd spell costs 0',
      class: PlayerClass.WIZARD,
      effect: 'every_third_spell_free'
    }
  ]
};

// Passive abilities for opponents, keyed by opponent id.  These remain
// unchanged from the original gameData.ts definitions.
export const opponentPassives: Record<string, OpponentPassive[]> = {
  wolf: [
    {
      id: 'wolf_ambush',
      name: 'Ambush',
      description: 'You play first in battle',
      effect: 'opponent_goes_first'
    }
  ],
  goblin: [
    {
      id: 'goblin_coward',
      name: 'Coward',
      description: 'When your turn starts, if you have less than 50% health, add a volatile free Cower in your hand.',
      effect: 'start_of_turn_coward'
    }
  ]
};

// Legacy export kept for backward compatibility.  It contains no entries by
// default; to add new passives simply append to the structures above.
export const extraPassives: any[] = [];
