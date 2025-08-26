import { Card, PlayerClass, OpponentType, CardType, Rarity, CardTrigger } from '@/types/game';
import { ModType } from "./mods";
import { EffectCode } from "./effects";


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
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'warrior_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'warrior_bash',
      name: 'Bash',
      description: 'Deal 8 damage. Apply 2 vulnerable.',
      cost: 2,
      attack: 8,
      effects: [
        { code: EffectCode.apply_mod, params: { target: 'opponent', type: ModType.VULNERABLE, stacks: 4 } }
      ],
      class: PlayerClass.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'warrior_riposte',
      name: 'Riposte',
      description: 'Deal 8 damage + your current block',
      cost: 2,
      attack: 8,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'warrior_shield_up',
      name: 'shield Up',
      description: 'Gain 8 block. Next turn, you don\'t lose block at the end of enemy turn',
      cost: 1,
      defense: 8,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.RARE,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'warrior_press_the_attack',
      name: 'press the Attack',
      description: 'Deal 12 damage',
      cost: 3,
      attack: 12,
      class: PlayerClass.WARRIOR,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'rogue_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: PlayerClass.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'rogue_backstab',
      name: 'backstab',
      description: 'Deal 10 damage. Costs 0 if this is the first card played.',
      cost: 1,
      attack: 10,
      class: PlayerClass.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'rogue_poison',
      name: 'Poison',
      description: 'Apply 3 bleeding',
      cost: 1,
      effects: [
        { code: EffectCode.apply_mod, params: { target: 'opponent', type: ModType.BLEEDING, stacks: 3 } }
      ],
      class: PlayerClass.ROGUE,
      rarity: Rarity.RARE,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'rogue_dagger_throw',
      name: 'dagger Throw',
      description: 'Deal 4 damage. Draw 1 card.',
      cost: 0,
      attack: 4,
      class: PlayerClass.ROGUE,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'wizard_defend',
      name: 'Defend',
      description: 'Gain 5 block',
      cost: 1,
      defense: 5,
      class: PlayerClass.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'wizard_zap',
      name: 'Zap',
      description: 'Deal 8 lightning damage',
      cost: 1,
      attack: 8,
      class: PlayerClass.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'wizard_fireball',
      name: 'fireball',
      description: 'Deal 14 damage',
      cost: 2,
      attack: 14,
      class: PlayerClass.WIZARD,
      rarity: Rarity.RARE,
      types: [CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'wizard_frost_shield',
      name: 'frost Shield',
      description: 'Gain 10 block. Freeze enemy for 1 turn.',
      cost: 2,
      defense: 10,
      effects: [
        { code: EffectCode.apply_mod, params: { target: 'opponent', type: ModType.WEAK, stacks: 1 } }
      ],
      class: PlayerClass.WIZARD,
      rarity: Rarity.RARE,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'wizard_arcane_power',
      name: 'arcane Power',
      description: 'Gain 2 energy. Your next spell costs 0.',
      cost: 1,
      class: PlayerClass.WIZARD,
      rarity: Rarity.RARE,
      types: [CardType.POWER],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'beast_bite',
      name: 'Vicious Bite',
      description: 'Deal 5 damage. Apply bleed 2.',
      cost: 1,
      attack: 5,
      effects: [
        { code: EffectCode.apply_mod, params: { target: 'player', type: ModType.BLEEDING, stacks: 2 } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'beast_howl',
      name: 'Terrifying Howl',
      description: 'Apply 2 weak to player',
      cost: 2,
      effects: [
        { code: EffectCode.apply_mod, params: { target: 'player', type: ModType.WEAK, stacks: 2 } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.RARE,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
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
          unplayable: true,
          trigger: CardTrigger.ONDRAW,
        }
      ],
      effects: [
        { code: EffectCode.add_card_to_opp_pile, params: { index: 0, count: 2 } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.RARE,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'beast_hunters_instinct',
      name: 'Killing Instinct',
      description: 'Deal 10 damage. If the target is bleeding, deals 15 instead.',
      cost: 2,
      attack: 10,
      effects: [
        { code: EffectCode.damage_status_mod, params: { amount: 5, status: ModType.BLEEDING, target: 'player' } }
      ],
      class: OpponentType.BEAST,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    }
  ],
  goblin: [
    {
      id: 'goblin_dirty_trick',
      name: 'Dirty Trick',
      description: 'Next turn player draw one card less',
      cost: 1,
      effects: [
        { code: EffectCode.draw_mod, params: { amount: -1, target: 'player', duration: 1 } }
      ],
      class: OpponentType.GOBLIN,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'goblin_slingshot',
      name: 'Slingshot',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: OpponentType.GOBLIN,
      rarity: Rarity.COMMON,
      types: [CardType.RANGED, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'goblin_bite',
      name: 'Bite',
      description: 'Deal 6 damage',
      cost: 1,
      attack: 6,
      class: OpponentType.GOBLIN,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'goblin_cower',
      name: 'Cower',
      description: 'Gain 1 Evasive',
      cost: 2,
      effects: [
        { code: EffectCode.apply_mod, params: { target: 'self', type: ModType.EVASIVE, stacks: 1 } }
      ],
      class: OpponentType.GOBLIN,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'goblin_booby_trap',
      name: 'Booby Trap',
      description: 'If last turn prevented damage from an attack, deal 10 damage',
      cost: 2,
      attack: 10,
      class: OpponentType.GOBLIN,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'undead_curse',
      name: 'Death Curse',
      description: 'Apply 3 poison',
      cost: 2,
      effects: [
        { code: EffectCode.apply_mod, params: { target: 'player', type: ModType.BLEEDING, stacks: 3 } }
      ],
      class: OpponentType.UNDEAD,
      rarity: Rarity.COMMON,
      types: [CardType.CURSE],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'undead_summon',
      name: 'Raise Dead',
      description: 'Summon 2 skeletons (6 damage each)',
      cost: 3,
      attack: 12,
      class: OpponentType.UNDEAD,
      rarity: Rarity.RARE,
      types: [CardType.POWER],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'enemy_warrior_shield',
      name: 'Iron Shield',
      description: 'Gain 8 block',
      cost: 1,
      defense: 8,
      class: OpponentType.WARRIOR,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'enemy_warrior_whirlwind',
      name: 'Whirlwind',
      description: 'Deal 5 damage to all enemies',
      cost: 2,
      attack: 5,
      class: OpponentType.WARRIOR,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'enemy_rogue_poison',
      name: 'Poison Blade',
      description: 'Deal 4 damage. Apply 2 poison',
      cost: 1,
      attack: 4,
      class: OpponentType.ROGUE,
      rarity: Rarity.COMMON,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'enemy_rogue_shadow',
      name: 'Shadow Strike',
      description: 'Deal 12 damage',
      cost: 2,
      attack: 12,
      class: OpponentType.ROGUE,
      rarity: Rarity.RARE,
      types: [CardType.MELEE, CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
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
      types: [CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'enemy_wizard_shield',
      name: 'Magic Barrier',
      description: 'Gain 7 block',
      cost: 1,
      defense: 7,
      class: OpponentType.WIZARD,
      rarity: Rarity.COMMON,
      types: [CardType.SKILL],
      trigger: CardTrigger.ONPLAY,
    },
    {
      id: 'enemy_wizard_bolt',
      name: 'Lightning Bolt',
      description: 'Deal 11 damage',
      cost: 2,
      attack: 11,
      class: OpponentType.WIZARD,
      rarity: Rarity.RARE,
      types: [CardType.ATTACK],
      trigger: CardTrigger.ONPLAY,
    }
  ],
  [OpponentType.MONSTER]: []
};

// Legacy export kept for backward compatibility.  It contains no entries by
// default; to add new cards simply push into the structures above.
export const extraCards: any[] = [];
