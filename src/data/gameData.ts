import { Card, Passive, Opponent, PlayerClass, OpponentType, CardType } from '@/types/game';
import { Swords, Skull, Zap, VenetianMask } from 'lucide-react';

// Player Classes Configuration
export const playerClasses: Record<PlayerClass, {
  id: PlayerClass;
  name: string;
  portrait: string;
  icon: React.ComponentType<any>;
  description: string;
  startingCards: string[];
  health: number;
  energy: number;
  available: boolean;
}> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    portrait: "https://i.imgur.com/ccO2ryT.png",
    icon: Swords,
    description: 'Master of combat and defense',
    startingCards: ['Strike', 'Defend', 'Bash'],
    health: 75,
    energy: 3,
    available: true
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    portrait: "https://i.imgur.com/ft260IB.png",
    icon: VenetianMask,
    description: 'Swift and deadly assassin',
    startingCards: ['Strike', 'Defend', 'Backstab'],
    health: 70,
    energy: 3,
    available: false
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    portrait: "https://i.imgur.com/OGJGXCc.png",
    icon: Zap,
    description: 'Wielder of arcane powers',
    startingCards: ['Strike', 'Defend', 'Zap'],
    health: 65,
    energy: 3,
    available: false
  }
};

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

// Opponent Cards
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
      description: 'Shuffle 2 \'Wolf\' unplayable minion cards in the player deck with \'Deal 5 damage when drawn\'',
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

// Passives
export const passives: Record<PlayerClass, Passive[]> = {
  warrior: [
    {
      id: 'warrior_berserker',
      name: 'berserker Rage',
      description: 'Deal 2 extra damage when below 50% health',
      class: 'warrior',
      effect: 'damage_bonus_low_health'
    },
    {
      id: 'warrior_iron_skin',
      name: 'iron Skin',
      description: 'Gain 3 extra block from all block cards',
      class: 'warrior',
      effect: 'extra_block'
    },
    {
      id: 'warrior_weapon_master',
      name: 'weapon Master',
      description: 'Attack cards cost 1 less energy',
      class: 'warrior',
      effect: 'attack_cost_reduction'
    }
  ],
  rogue: [
    {
      id: 'rogue_poison_master',
      name: 'poison Master',
      description: 'Poison effects last 1 extra turn',
      class: 'rogue',
      effect: 'poison_duration_bonus'
    },
    {
      id: 'rogue_shadow_dancer',
      name: 'shadow Dancer',
      description: 'Start each turn with 1 extra energy',
      class: 'rogue',
      effect: 'extra_energy'
    },
    {
      id: 'rogue_deadly_precision',
      name: 'deadly Precision',
      description: 'First card each turn costs 0',
      class: 'rogue',
      effect: 'first_card_free'
    }
  ],
  wizard: [
    {
      id: 'wizard_arcane_mastery',
      name: 'arcane Mastery',
      description: 'Spell cards deal 3 extra damage',
      class: 'wizard',
      effect: 'spell_damage_bonus'
    },
    {
      id: 'wizard_mana_efficiency',
      name: 'mana Efficiency',
      description: 'Start each turn with 4 energy instead of 3',
      class: 'wizard',
      effect: 'max_energy_bonus'
    },
    {
      id: 'wizard_elemental_focus',
      name: 'elemental Focus',
      description: 'Every 3rd spell costs 0',
      class: 'wizard',
      effect: 'every_third_spell_free'
    }
  ]
};

// Opponent Passives
export const opponentPassives: Record<string, OpponentPassive[]> = {
  wolf: [
    {
      id: 'wolf_ambush',
      name: 'Ambush',
      description: 'I play first in battle',
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

// Opponents
export const opponents: Opponent[] = [
  {
    id: 'goblin',
    name: 'goblin Hunter',
    type: 'monster',
    health: 30,
    maxHealth: 30,
    portrait: "https://i.imgur.com/tN5et02.jpeg",
    deck: {
      cards: [
        ...opponentCards.monster.slice(0, 1), // Dirty Trick (copy 1)
        ...opponentCards.monster.slice(0, 1), // Dirty Trick (copy 2)
        ...opponentCards.monster.slice(1, 2), // Slingshot (copy 1)
        ...opponentCards.monster.slice(1, 2), // Slingshot (copy 2)
        ...opponentCards.monster.slice(2, 3), // Bite (copy 1)
        ...opponentCards.monster.slice(2, 3), // Bite (copy 2)
        ...opponentCards.monster.slice(3, 4), // Cower (copy 1)
        ...opponentCards.monster.slice(3, 4), // Cower (copy 2)
        ...opponentCards.monster.slice(4, 5), // Booby Trap (copy 1)
        ...opponentCards.monster.slice(4, 5), // Booby Trap (copy 2)
      ],
      discardPile: []
    },
    passive: opponentPassives.goblin[0],
    difficulty: 'basic'
  },
  {
    id: 'wolf',
    name: 'Alpha Wolf',
    type: 'beast',
    health: 42,
    maxHealth: 42,
    portrait: "https://i.imgur.com/0TFnwFH.png",
    deck: {
      cards: [
        ...opponentCards.beast.slice(0, 1), // Alpha Claws
        ...opponentCards.beast.slice(0, 1), // Alpha Claws (2nd copy)
        ...opponentCards.beast.slice(1, 2), // Vicious Bite
        ...opponentCards.beast.slice(1, 2), // Vicious Bite (2nd copy)
        ...opponentCards.beast.slice(2, 3), // Terrifying Howl
        ...opponentCards.beast.slice(2, 3), // Terrifying Howl (2nd copy)
        ...opponentCards.beast.slice(3, 4), // Call the Pack
        ...opponentCards.beast.slice(3, 4), // Call the Pack (2nd copy)
        ...opponentCards.beast.slice(6, 7), // Killing Instinct (fixed index!)
        ...opponentCards.beast.slice(6, 7), // Killing Instinct (2nd copy)
      ],
      discardPile: []
    },
    passive: opponentPassives.wolf[0],
    difficulty: 'basic'
  },
  {
    id: 'skeleton',
    name: 'skeleton Lord',
    type: 'undead',
    health: 40,
    maxHealth: 40,
    portrait: "https://i.imgur.com/E36FymH.jpeg",
    deck: {
      cards: [
        ...opponentCards.undead.slice(0, 2),
        ...opponentCards.undead.slice(2, 3)
      ],
      discardPile: []
    },
    difficulty: 'medium'
  },
  {
    id: 'bandit',
    name: 'bandit Leader',
    type: 'rogue',
    health: 45,
    maxHealth: 45,
    portrait: "https://i.imgur.com/dXzCZbO.jpeg",
    deck: {
      cards: [
        ...opponentCards.rogue.slice(0, 2),
        ...opponentCards.rogue.slice(2, 3)
      ],
      discardPile: []
    },
    difficulty: 'medium'
  },
  {
    id: 'dragon',
    name: 'ancient Dragon',
    type: 'monster',
    health: 60,
    maxHealth: 60,
    portrait: "https://i.imgur.com/BM04nJa.png",
    deck: {
      cards: [
        ...opponentCards.monster.slice(0, 2),
        ...opponentCards.monster.slice(2, 3)
      ],
      discardPile: []
    },
    difficulty: 'boss'
  },
  {
    id: 'lich',
    name: 'lich King',
    type: 'undead',
    health: 65,
    maxHealth: 65,
    portrait: "https://i.imgur.com/P1VfO0A.jpeg",
    deck: {
      cards: [
        ...opponentCards.undead.slice(0, 2),
        ...opponentCards.undead.slice(2, 3)
      ],
      discardPile: []
    },
    difficulty: 'boss'
  }
];