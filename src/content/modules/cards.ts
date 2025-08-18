import { Card, PlayerClass, OpponentType, CardType, Rarity, EffectCode, StatusType } from '@/types/game';

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
      class: PlayerClass.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'warrior_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'warrior_bash',
      name: 'Bash',
      description: 'Deal 8 damage. Apply 2 vulnerable.',
      cost: 2,
      attack: 8,
      effects: [
        { code: EffectCode.apply_status, params: { target: 'opponent', status: 'vulnerable', amount: 2 } }
      ],
      class: PlayerClass.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'warrior_riposte',
      name: 'Riposte',
      description: 'Deal 8 damage + your current block',
      cost: 2,
      attack: 8,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'warrior_shield_up',
      name: 'shield Up',
      description: 'Gain 8 block. Next turn, you don\'t lose block at the end of enemy turn',
      cost: 1,
      defense: 8,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.RARE,
      types: [CardType.SKILL]
    },
    {
      id: 'warrior_press_the_attack',
      name: 'press the Attack',
      description: 'Deal 12 damage',
      cost: 3,
      attack: 12,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.RARE,
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
      class: PlayerClass.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'rogue_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: PlayerClass.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'rogue_backstab',
      name: 'backstab',
      description: 'Deal 10 damage. Costs 0 if this is the first card played.',
      cost: 1,
      attack: 10,
      class: PlayerClass.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'rogue_poison',
      name: 'Poison',
      description: 'Apply 3 poison',
      cost: 1,
      effects: [
        { code: EffectCode.apply_status, params: { target: 'opponent', status: 'poison', amount: 3 } }
      ],
      class: PlayerClass.ROGUE,
      rarity: Rarity.RARE,
      types: [CardType.SKILL]
    },
    {
      id: 'rogue_dagger_throw',
      name: 'dagger Throw',
      description: 'Deal 4 damage. Draw 1 card.',
      cost: 0,
      attack: 4,
      class: PlayerClass.ROGUE,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'rogue_stealth',
      name: 'stealth',
      description: 'Gain 15 block. Become invisible until next turn.',
      cost: 2,
      defense: 15,
      effects: [
        { code: EffectCode.apply_status, params: { target: 'self', status: 'invisible', amount: 1 } }
      ],
      class: PlayerClass.ROGUE,
      rarity: Rarity.RARE,
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
      class: PlayerClass.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'wizard_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: PlayerClass.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'wizard_zap',
      name: 'Zap',
      description: 'Deal 8 lightning damage',
      cost: 1,
      attack: 8,
      class: PlayerClass.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.ATTACK]
    },
    {
      id: 'wizard_fireball',
      name: 'fireball',
      description: 'Deal 14 damage',
      cost: 2,
      attack: 14,
      class: PlayerClass.WIZARD,
      rarity: Rarity.RARE,
      types: [CardType.ATTACK]
    },
    {
      id: 'wizard_frost_shield',
      name: 'frost Shield',
      description: 'Gain 10 block. Freeze enemy for 1 turn.',
      cost: 2,
      defense: 10,
      effects: [
        { code: EffectCode.apply_status, params: { target: 'opponent', status: 'frozen', amount: 1 } }
      ],
      class: PlayerClass.WIZARD,
      rarity: Rarity.RARE,
      types: [CardType.SKILL]
    },
    {
      id: 'wizard_arcane_power',
      name: 'arcane Power',
      description: 'Gain 2 energy. Your next spell costs 0.',
      cost: 1,
      class: PlayerClass.WIZARD,
      rarity: Rarity.RARE,
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
      class: OpponentType.BEAST,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_bite',
      name: 'Vicious Bite',
      description: 'Deal 5 damage. Apply bleed 2.',
      cost: 1,
      attack: 5,
      effects: [
        { code: EffectCode.apply_status, params: { target: 'player', status: 'bleed', amount: 2 } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_howl',
      name: 'Terrifying Howl',
      description: 'Apply 2 weak to player',
      cost: 2,
      effects: [
        { code: EffectCode.apply_status, params: { target: 'player', status: 'weak', amount: 2 } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.RARE,
      types: [CardType.SKILL]
    },
    {
      id: 'beast_pack_mentality',
      name: 'Call the Pack',
      description: "Add 2 'Wolf' unplayable minion cards to the player discard pile with \'Deal 5 damage when drawn\')",
      cost: 2,
      related_cards: [
        {
          id: 'beast_wolf_minion_template',
          name: 'Wolf',
          description: 'Deal 5 damage to owner when drawn.',
          cost: 0,
          attack: 5,
          effects: [
            { code: EffectCode.deal_damage, params: { target: 'player', amount: 5 } }
          ],
          class: OpponentType.BEAST,
          rarity: Rarity.SPECIAL,
          types: [CardType.MINION],
          unplayable: true
        }
      ],
      effects: [
        { code: EffectCode.add_card_to_opp_pile, params: { index: 0, count: 2 } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.RARE,
      types: [CardType.SKILL]
    },
    {
      id: 'beast_feral_rage',
      name: 'Feral Rage',
      description: 'Deal 12 damage. Lose 3 health',
      cost: 1,
      attack: 12,
      class: OpponentType.BEAST,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_alpha_presence',
      name: 'Alpha Presence',
      description: 'Gain 8 block. All beast cards cost 1 less this turn',
      cost: 2,
      defense: 8,
      class: OpponentType.BEAST,
      rarity: Rarity.RARE,
      types: [CardType.SKILL]
    },
    {
      id: 'beast_hunters_instinct',
      name: 'Killing Instinct',
      description: 'Deal 10 damage. If the target is bleeding, deals 15 instead.',
      cost: 2,
      attack: 10,
      effects: [
        { code: EffectCode.damage_status_mod, params: { amount: 5, status: StatusType.BLEEDING, target: 'player' } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_maul',
      name: 'Brutal Maul',
      description: 'Deal 15 damage',
      cost: 3,
      attack: 15,
      class: OpponentType.BEAST,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'beast_wolf_minion',
      name: 'Wolf',
      description: 'Unplayable minion. Deal 5 damage to player when drawn.',
      cost: 0,
      attack: 5,
      class: OpponentType.BEAST,
      rarity: Rarity.SPECIAL,
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
      effects: [
        { code: EffectCode.draw_mod, params: { amount: -1, target: 'player', duration: 1 } }
      ],
      class: OpponentType.MONSTER,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'goblin_slingshot',
      name: 'Slingshot',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: OpponentType.MONSTER,
      rarity: Rarity.COMMON,
      types: [CardType.RANGED, CardType.ATTACK]
    },
    {
      id: 'goblin_bite',
      name: 'Bite',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: OpponentType.MONSTER,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'goblin_cower',
      name: 'Cower',
      description: 'Gain 1 Evasive',
      cost: 2,
      effects: [
        { code: EffectCode.gain_evasive_self, params: { amount: 1 } }
      ],
      class: OpponentType.MONSTER,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'goblin_booby_trap',
      name: 'Booby Trap',
      description: 'If last turn prevented damage from an attack, deal 10 damage',
      cost: 2,
      attack: 10,
      class: OpponentType.MONSTER,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'goblin_cower_volatile',
      name: 'Cower',
      description: 'Gain 1 Evasive. Volatile.',
      cost: 2,
      effects: [
        { code: EffectCode.gain_evasive_self, params: { amount: 1 } }
      ],
      class: OpponentType.MONSTER,
      rarity: Rarity.COMMON,
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
      class: OpponentType.UNDEAD,
      rarity: Rarity.COMMON,
      types: [CardType.ATTACK]
    },
    {
      id: 'undead_curse',
      name: 'Death Curse',
      description: 'Apply 3 poison',
      cost: 2,
      effects: [
        { code: EffectCode.apply_status, params: { target: 'player', status: 'poison', amount: 3 } }
      ],
      class: OpponentType.UNDEAD,
      rarity: Rarity.COMMON,
      types: [CardType.CURSE]
    },
    {
      id: 'undead_summon',
      name: 'Raise Dead',
      description: 'Summon 2 skeletons (6 damage each)',
      cost: 3,
      attack: 12,
      class: OpponentType.UNDEAD,
      rarity: Rarity.RARE,
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
      class: OpponentType.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'enemy_warrior_shield',
      name: 'Iron Shield',
      description: 'Gain 8 block',
      cost: 1,
      defense: 8,
      class: OpponentType.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'enemy_warrior_whirlwind',
      name: 'Whirlwind',
      description: 'Deal 5 damage to all enemies',
      cost: 2,
      attack: 5,
      class: OpponentType.WARRIOR,
      rarity: Rarity.RARE,
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
      class: OpponentType.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'enemy_rogue_poison',
      name: 'Poison Blade',
      description: 'Deal 4 damage. Apply 2 poison',
      cost: 1,
      attack: 4,
      class: OpponentType.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK]
    },
    {
      id: 'enemy_rogue_shadow',
      name: 'Shadow Strike',
      description: 'Deal 12 damage',
      cost: 2,
      attack: 12,
      class: OpponentType.ROGUE,
      rarity: Rarity.RARE,
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
      class: OpponentType.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.ATTACK]
    },
    {
      id: 'enemy_wizard_shield',
      name: 'Magic Barrier',
      description: 'Gain 7 block',
      cost: 1,
      defense: 7,
      class: OpponentType.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL]
    },
    {
      id: 'enemy_wizard_bolt',
      name: 'Lightning Bolt',
      description: 'Deal 11 damage',
      cost: 2,
      attack: 11,
      class: OpponentType.WIZARD,
      rarity: Rarity.RARE,
      types: [CardType.ATTACK]
    }
  ]
};

// Legacy export kept for backward compatibility.  It contains no entries by
// default; to add new cards simply push into the structures above.
export const extraCards: any[] = [];
