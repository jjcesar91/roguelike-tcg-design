import { Card, PlayerClass, OpponentType, CardType } from '@/types/game';

// Base card definitions for each player class.  Adding new cards is as simple
// as appending to the appropriate array here.
export const playerCards: Record<PlayerClass, Card[]> = {
  warrior: [
    {
      id: 'warrior_strike',
      name: 'Strike',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: 'warrior',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'warrior_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: 'warrior',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'warrior_bash',
      name: 'Bash',
      description: 'Deal 8 damage. Apply 2 vulnerable.',
      cost: 2,
      attack: 8,
      effect: 'Apply 2 vulnerable',
      class: 'warrior',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'warrior_riposte',
      name: 'Riposte',
      description: 'Deal 8 damage + your current block',
      cost: 2,
      attack: 8,
      effect: 'Damage + current block',
      class: 'warrior',
      rarity: 'rare',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'warrior_shield_up',
      name: 'shield Up',
      description: 'Gain 8 block. Next turn, you don\'t lose block at the end of enemy turn',
      cost: 1,
      defense: 8,
      effect: 'Persistent block',
      class: 'warrior',
      rarity: 'rare',
      types: [CardType.SKILL]
    },
    {
      id: 'warrior_press_the_attack',
      name: 'press the Attack',
      description: 'Deal 12 damage',
      cost: 3,
      attack: 12,
      class: 'warrior',
      rarity: 'rare',
      types: [CardType.MELEE, CardType.ATTACK]
    }
  ],
  rogue: [
    {
      id: 'rogue_strike',
      name: 'Strike',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: 'rogue',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'rogue_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: 'rogue',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'rogue_backstab',
      name: 'backstab',
      description: 'Deal 10 damage. Costs 0 if this is the first card played.',
      cost: 1,
      attack: 10,
      effect: 'Free on first play',
      class: 'rogue',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'rogue_poison',
      name: 'Poison',
      description: 'Apply 3 poison',
      cost: 1,
      effect: 'Apply 3 poison',
      class: 'rogue',
      rarity: 'rare',
      types: [CardType.SKILL]
    },
    {
      id: 'rogue_dagger_throw',
      name: 'dagger Throw',
      description: 'Deal 4 damage. Draw 1 card.',
      cost: 0,
      attack: 4,
      effect: 'Draw 1 card',
      class: 'rogue',
      rarity: 'rare',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'rogue_stealth',
      name: 'stealth',
      description: 'Gain 15 block. Become invisible until next turn.',
      cost: 2,
      defense: 15,
      effect: 'Invisibility',
      class: 'rogue',
      rarity: 'rare',
      types: [CardType.SKILL]
    }
  ],
  wizard: [
    {
      id: 'wizard_strike',
      name: 'Strike',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: 'wizard',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'wizard_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: 'wizard',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'wizard_zap',
      name: 'Zap',
      description: 'Deal 8 lightning damage',
      cost: 1,
      attack: 8,
      effect: 'Lightning damage',
      class: 'wizard',
      rarity: 'common',
      types: [CardType.ATTACK]
    },
    {
      id: 'wizard_fireball',
      name: 'fireball',
      description: 'Deal 14 damage',
      cost: 2,
      attack: 14,
      class: 'wizard',
      rarity: 'rare',
      types: [CardType.ATTACK]
    },
    {
      id: 'wizard_frost_shield',
      name: 'frost Shield',
      description: 'Gain 10 block. Freeze enemy for 1 turn.',
      cost: 2,
      defense: 10,
      effect: 'Freeze enemy',
      class: 'wizard',
      rarity: 'rare',
      types: [CardType.SKILL]
    },
    {
      id: 'wizard_arcane_power',
      name: 'arcane Power',
      description: 'Gain 2 energy. Your next spell costs 0.',
      cost: 1,
      effect: 'Energy bonus + next spell free',
      class: 'wizard',
      rarity: 'rare',
      types: [CardType.POWER]
    }
  ]
};

// Base card definitions for opponents by type.  These definitions were
// previously held in gameData.ts but live here now.  To add new opponent cards
// just append to the appropriate array.
export const opponentCards: Record<OpponentType, Card[]> = {
  beast: [
    {
      id: 'beast_claw',
      name: 'Alpha Claws',
      description: 'Deal 7 damage',
      cost: 1,
      attack: 7,
      class: 'beast',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_bite',
      name: 'Vicious Bite',
      description: 'Deal 5 damage. Apply bleed 2.',
      cost: 1,
      attack: 5,
      effect: 'Apply bleed 2',
      class: 'beast',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_howl',
      name: 'Terrifying Howl',
      description: 'Apply 2 weak to player',
      cost: 2,
      effect: 'Apply 2 weak',
      class: 'beast',
      rarity: 'rare',
      types: [CardType.SKILL]
    },
    {
      id: 'beast_pack_mentality',
      name: 'Call the Pack',
      description: 'Add 2 \'Wolf\' unplayable minion cards to the player discard pile with \'Deal 5 damage when drawn\'',
      cost: 2,
      effect: 'Shuffle wolf minions',
      class: 'beast',
      rarity: 'rare',
      types: [CardType.SKILL]
    },
    {
      id: 'beast_feral_rage',
      name: 'Feral Rage',
      description: 'Deal 12 damage. Lose 3 health',
      cost: 1,
      attack: 12,
      effect: 'Self damage for power',
      class: 'beast',
      rarity: 'rare',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_alpha_presence',
      name: 'Alpha Presence',
      description: 'Gain 8 block. All beast cards cost 1 less this turn',
      cost: 2,
      defense: 8,
      effect: 'Cost reduction for beasts',
      class: 'beast',
      rarity: 'rare',
      types: [CardType.SKILL]
    },
    {
      id: 'beast_hunters_instinct',
      name: 'Killing Instinct',
      description: 'Deal 10 damage. If the target is bleeding, deals 15 instead.',
      cost: 2,
      attack: 10,
      effect: 'Bonus damage vs bleeding',
      class: 'beast',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_maul',
      name: 'Brutal Maul',
      description: 'Deal 15 damage',
      cost: 3,
      attack: 15,
      class: 'beast',
      rarity: 'rare',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_wolf_minion',
      name: 'Wolf',
      description: 'Unplayable minion. Deal 5 damage to player when drawn.',
      cost: 0,
      attack: 5,
      effect: 'Deal damage when drawn',
      class: 'beast',
      rarity: 'special',
      types: [CardType.MINION],
      unplayable: true
    }
  ],
  monster: [
    {
      id: 'goblin_dirty_trick',
      name: 'Dirty Trick',
      description: 'Next turn player draw one card less',
      cost: 1,
      effect: 'Next turn player draw one card less',
      class: 'monster',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'goblin_slingshot',
      name: 'Slingshot',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: 'monster',
      rarity: 'common',
      types: [CardType.RANGED, CardType.ATTACK]
    },
    {
      id: 'goblin_bite',
      name: 'Bite',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: 'monster',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'goblin_cower',
      name: 'Cower',
      description: 'Gain 1 Evasive',
      cost: 2,
      effect: 'Gain 1 Evasive',
      class: 'monster',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'goblin_booby_trap',
      name: 'Booby Trap',
      description: 'If last turn prevented damage from an attack, deal 10 damage',
      cost: 2,
      attack: 10,
      effect: 'If last turn prevented damage from an attack, deal 10 damage',
      class: 'monster',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'goblin_cower_volatile',
      name: 'Cower',
      description: 'Gain 1 Evasive. Volatile.',
      cost: 2,
      effect: 'Gain 1 Evasive',
      class: 'monster',
      rarity: 'common',
      types: [CardType.SKILL, CardType.VOLATILE]
    }
  ],
  undead: [
    {
      id: 'undead_touch',
      name: 'Life Drain',
      description: 'Deal 5 damage. Heal 3 health',
      cost: 1,
      attack: 5,
      effect: 'Lifesteal',
      class: 'undead',
      rarity: 'common',
      types: [CardType.ATTACK]
    },
    {
      id: 'undead_curse',
      name: 'Death Curse',
      description: 'Apply 3 poison',
      cost: 2,
      effect: 'Apply 3 poison',
      class: 'undead',
      rarity: 'common',
      types: [CardType.CURSE]
    },
    {
      id: 'undead_summon',
      name: 'Raise Dead',
      description: 'Summon 2 skeletons (6 damage each)',
      cost: 3,
      attack: 12,
      effect: 'Summon minions',
      class: 'undead',
      rarity: 'rare',
      types: [CardType.POWER]
    }
  ],
  warrior: [
    {
      id: 'enemy_warrior_strike',
      name: 'Warrior Strike',
      description: 'Deal 7 damage',
      cost: 1,
      attack: 7,
      class: 'warrior',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'enemy_warrior_shield',
      name: 'Iron Shield',
      description: 'Gain 8 block',
      cost: 1,
      defense: 8,
      class: 'warrior',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'enemy_warrior_whirlwind',
      name: 'Whirlwind',
      description: 'Deal 5 damage to all enemies',
      cost: 2,
      attack: 5,
      effect: 'AoE damage',
      class: 'warrior',
      rarity: 'rare',
      types: [CardType.MELEE, CardType.ATTACK]
    }
  ],
  rogue: [
    {
      id: 'enemy_rogue_dagger',
      name: 'Quick Dagger',
      description: 'Deal 6 damage',
      cost: 0,
      attack: 6,
      class: 'rogue',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'enemy_rogue_poison',
      name: 'Poison Blade',
      description: 'Deal 4 damage. Apply 2 poison',
      cost: 1,
      attack: 4,
      effect: 'Apply 2 poison',
      class: 'rogue',
      rarity: 'common',
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'enemy_rogue_shadow',
      name: 'Shadow Strike',
      description: 'Deal 12 damage',
      cost: 2,
      attack: 12,
      class: 'rogue',
      rarity: 'rare',
      types: [CardType.MELEE, CardType.ATTACK]
    }
  ],
  wizard: [
    {
      id: 'enemy_wizard_missile',
      name: 'Magic Missile',
      description: 'Deal 5 damage',
      cost: 1,
      attack: 5,
      class: 'wizard',
      rarity: 'common',
      types: [CardType.ATTACK]
    },
    {
      id: 'enemy_wizard_shield',
      name: 'Magic Barrier',
      description: 'Gain 7 block',
      cost: 1,
      defense: 7,
      class: 'wizard',
      rarity: 'common',
      types: [CardType.SKILL]
    },
    {
      id: 'enemy_wizard_bolt',
      name: 'Lightning Bolt',
      description: 'Deal 11 damage',
      cost: 2,
      attack: 11,
      class: 'wizard',
      rarity: 'rare',
      types: [CardType.ATTACK]
    }
  ]
};

// Legacy export kept for backward compatibility.  It contains no entries by
// default; to add new cards simply push into the structures above.
export const extraCards: any[] = [];
