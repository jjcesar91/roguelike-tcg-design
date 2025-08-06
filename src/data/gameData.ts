import { Card, Passive, Opponent, PlayerClass, OpponentType } from '@/types/game';

// Player Class Cards
export const playerCards: Record<PlayerClass, Card[]> = {
  warrior: [
    {
      id: 'warrior_strike',
      name: 'Strike',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: 'warrior',
      rarity: 'common'
    },
    {
      id: 'warrior_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: 'warrior',
      rarity: 'common'
    },
    {
      id: 'warrior_bash',
      name: 'Bash',
      description: 'Deal 8 damage. Apply 2 vulnerable.',
      cost: 2,
      attack: 8,
      effect: 'Apply 2 vulnerable',
      class: 'warrior',
      rarity: 'common'
    },
    {
      id: 'warrior_riposte',
      name: 'Riposte',
      description: 'Deal 8 damage + your current block',
      cost: 2,
      attack: 8,
      effect: 'Damage + current block',
      class: 'warrior',
      rarity: 'rare'
    },
    {
      id: 'warrior_shield_up',
      name: 'Shield Up',
      description: 'Gain 8 block. Next turn, you don\'t lose block at the end of enemy turn',
      cost: 1,
      defense: 8,
      effect: 'Persistent block',
      class: 'warrior',
      rarity: 'rare'
    },
    {
      id: 'warrior_press_the_attack',
      name: 'Press the Attack',
      description: 'Deal 12 damage',
      cost: 3,
      attack: 12,
      class: 'warrior',
      rarity: 'rare'
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
      rarity: 'common'
    },
    {
      id: 'rogue_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: 'rogue',
      rarity: 'common'
    },
    {
      id: 'rogue_backstab',
      name: 'Backstab',
      description: 'Deal 10 damage. Costs 0 if this is the first card played.',
      cost: 1,
      attack: 10,
      effect: 'Free on first play',
      class: 'rogue',
      rarity: 'common'
    },
    {
      id: 'rogue_poison',
      name: 'Poison',
      description: 'Apply 3 poison',
      cost: 1,
      effect: 'Apply 3 poison',
      class: 'rogue',
      rarity: 'rare'
    },
    {
      id: 'rogue_dagger_throw',
      name: 'Dagger Throw',
      description: 'Deal 4 damage. Draw 1 card.',
      cost: 0,
      attack: 4,
      effect: 'Draw 1 card',
      class: 'rogue',
      rarity: 'rare'
    },
    {
      id: 'rogue_stealth',
      name: 'Stealth',
      description: 'Gain 15 block. Become invisible until next turn.',
      cost: 2,
      defense: 15,
      effect: 'Invisibility',
      class: 'rogue',
      rarity: 'rare'
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
      rarity: 'common'
    },
    {
      id: 'wizard_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: 'wizard',
      rarity: 'common'
    },
    {
      id: 'wizard_zap',
      name: 'Zap',
      description: 'Deal 8 lightning damage',
      cost: 1,
      attack: 8,
      effect: 'Lightning damage',
      class: 'wizard',
      rarity: 'common'
    },
    {
      id: 'wizard_fireball',
      name: 'Fireball',
      description: 'Deal 14 damage',
      cost: 2,
      attack: 14,
      class: 'wizard',
      rarity: 'rare'
    },
    {
      id: 'wizard_frost_shield',
      name: 'Frost Shield',
      description: 'Gain 10 block. Freeze enemy for 1 turn.',
      cost: 2,
      defense: 10,
      effect: 'Freeze enemy',
      class: 'wizard',
      rarity: 'rare'
    },
    {
      id: 'wizard_arcane_power',
      name: 'Arcane Power',
      description: 'Gain 2 energy. Your next spell costs 0.',
      cost: 1,
      effect: 'Energy bonus + next spell free',
      class: 'wizard',
      rarity: 'rare'
    }
  ]
};

// Opponent Cards
export const opponentCards: Record<OpponentType, Card[]> = {
  beast: [
    {
      id: 'beast_claw',
      name: 'Sharp Claws',
      description: 'Deal 7 damage',
      cost: 1,
      attack: 7,
      class: 'beast',
      rarity: 'common'
    },
    {
      id: 'beast_bite',
      name: 'Vicious Bite',
      description: 'Deal 10 damage. Take 2 damage.',
      cost: 2,
      attack: 10,
      effect: 'Self damage',
      class: 'beast',
      rarity: 'common'
    },
    {
      id: 'beast_howl',
      name: 'Terrifying Howl',
      description: 'Apply 2 weak to player',
      cost: 1,
      effect: 'Apply 2 weak',
      class: 'beast',
      rarity: 'rare'
    }
  ],
  monster: [
    {
      id: 'monster_slam',
      name: 'Slam',
      description: 'Deal 8 damage',
      cost: 2,
      attack: 8,
      class: 'monster',
      rarity: 'common'
    },
    {
      id: 'monster_roar',
      name: 'Monster Roar',
      description: 'Gain 6 block. Deal 4 damage',
      cost: 2,
      attack: 4,
      defense: 6,
      class: 'monster',
      rarity: 'common'
    },
    {
      id: 'monster_rage',
      name: 'Enrage',
      description: 'Deal 12 damage. Lose 3 health',
      cost: 1,
      attack: 12,
      effect: 'Self damage',
      class: 'monster',
      rarity: 'rare'
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
      rarity: 'common'
    },
    {
      id: 'undead_curse',
      name: 'Death Curse',
      description: 'Apply 3 poison',
      cost: 2,
      effect: 'Apply 3 poison',
      class: 'undead',
      rarity: 'common'
    },
    {
      id: 'undead_summon',
      name: 'Raise Dead',
      description: 'Summon 2 skeletons (6 damage each)',
      cost: 3,
      attack: 12,
      effect: 'Summon minions',
      class: 'undead',
      rarity: 'rare'
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
      rarity: 'common'
    },
    {
      id: 'enemy_warrior_shield',
      name: 'Iron Shield',
      description: 'Gain 8 block',
      cost: 1,
      defense: 8,
      class: 'warrior',
      rarity: 'common'
    },
    {
      id: 'enemy_warrior_whirlwind',
      name: 'Whirlwind',
      description: 'Deal 5 damage to all enemies',
      cost: 2,
      attack: 5,
      effect: 'AoE damage',
      class: 'warrior',
      rarity: 'rare'
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
      rarity: 'common'
    },
    {
      id: 'enemy_rogue_poison',
      name: 'Poison Blade',
      description: 'Deal 4 damage. Apply 2 poison',
      cost: 1,
      attack: 4,
      effect: 'Apply 2 poison',
      class: 'rogue',
      rarity: 'common'
    },
    {
      id: 'enemy_rogue_shadow',
      name: 'Shadow Strike',
      description: 'Deal 12 damage',
      cost: 2,
      attack: 12,
      class: 'rogue',
      rarity: 'rare'
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
      rarity: 'common'
    },
    {
      id: 'enemy_wizard_shield',
      name: 'Magic Barrier',
      description: 'Gain 7 block',
      cost: 1,
      defense: 7,
      class: 'wizard',
      rarity: 'common'
    },
    {
      id: 'enemy_wizard_bolt',
      name: 'Lightning Bolt',
      description: 'Deal 11 damage',
      cost: 2,
      attack: 11,
      class: 'wizard',
      rarity: 'rare'
    }
  ]
};

// Passives
export const passives: Record<PlayerClass, Passive[]> = {
  warrior: [
    {
      id: 'warrior_berserker',
      name: 'Berserker Rage',
      description: 'Deal 2 extra damage when below 50% health',
      class: 'warrior',
      effect: 'damage_bonus_low_health'
    },
    {
      id: 'warrior_iron_skin',
      name: 'Iron Skin',
      description: 'Gain 3 extra block from all block cards',
      class: 'warrior',
      effect: 'extra_block'
    },
    {
      id: 'warrior_weapon_master',
      name: 'Weapon Master',
      description: 'Attack cards cost 1 less energy',
      class: 'warrior',
      effect: 'attack_cost_reduction'
    }
  ],
  rogue: [
    {
      id: 'rogue_poison_master',
      name: 'Poison Master',
      description: 'Poison effects last 1 extra turn',
      class: 'rogue',
      effect: 'poison_duration_bonus'
    },
    {
      id: 'rogue_shadow_dancer',
      name: 'Shadow Dancer',
      description: 'Start each turn with 1 extra energy',
      class: 'rogue',
      effect: 'extra_energy'
    },
    {
      id: 'rogue_deadly_precision',
      name: 'Deadly Precision',
      description: 'First card each turn costs 0',
      class: 'rogue',
      effect: 'first_card_free'
    }
  ],
  wizard: [
    {
      id: 'wizard_arcane_mastery',
      name: 'Arcane Mastery',
      description: 'Spell cards deal 3 extra damage',
      class: 'wizard',
      effect: 'spell_damage_bonus'
    },
    {
      id: 'wizard_mana_efficiency',
      name: 'Mana Efficiency',
      description: 'Start each turn with 4 energy instead of 3',
      class: 'wizard',
      effect: 'max_energy_bonus'
    },
    {
      id: 'wizard_elemental_focus',
      name: 'Elemental Focus',
      description: 'Every 3rd spell costs 0',
      class: 'wizard',
      effect: 'every_third_spell_free'
    }
  ]
};

// Opponents
export const opponents: Opponent[] = [
  {
    id: 'goblin',
    name: 'Goblin Warrior',
    type: 'monster',
    health: 30,
    maxHealth: 30,
    deck: {
      cards: [
        ...opponentCards.monster.slice(0, 2),
        ...opponentCards.monster.slice(2, 3)
      ]
    },
    difficulty: 'basic'
  },
  {
    id: 'wolf',
    name: 'Alpha Wolf',
    type: 'beast',
    health: 35,
    maxHealth: 35,
    deck: {
      cards: [
        ...opponentCards.beast.slice(0, 2),
        ...opponentCards.beast.slice(2, 3)
      ]
    },
    difficulty: 'basic'
  },
  {
    id: 'skeleton',
    name: 'Skeleton Lord',
    type: 'undead',
    health: 40,
    maxHealth: 40,
    deck: {
      cards: [
        ...opponentCards.undead.slice(0, 2),
        ...opponentCards.undead.slice(2, 3)
      ]
    },
    difficulty: 'medium'
  },
  {
    id: 'bandit',
    name: 'Bandit Leader',
    type: 'rogue',
    health: 45,
    maxHealth: 45,
    deck: {
      cards: [
        ...opponentCards.rogue.slice(0, 2),
        ...opponentCards.rogue.slice(2, 3)
      ]
    },
    difficulty: 'medium'
  },
  {
    id: 'dragon',
    name: 'Ancient Dragon',
    type: 'monster',
    health: 60,
    maxHealth: 60,
    deck: {
      cards: [
        ...opponentCards.monster.slice(0, 2),
        ...opponentCards.monster.slice(2, 3)
      ]
    },
    difficulty: 'boss'
  },
  {
    id: 'lich',
    name: 'Lich King',
    type: 'undead',
    health: 65,
    maxHealth: 65,
    deck: {
      cards: [
        ...opponentCards.undead.slice(0, 2),
        ...opponentCards.undead.slice(2, 3)
      ]
    },
    difficulty: 'boss'
  }
];