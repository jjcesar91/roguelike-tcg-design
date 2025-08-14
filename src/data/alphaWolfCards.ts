import { Card, CardType } from '@/types/game';

export const alphaWolfCards: Card[] = [
  {
    id: 'alpha_claws',
    name: 'Alpha Claws',
    description: 'Deal 7 damage',
    cost: 1,
    attack: 7,
    class: 'beast',
    rarity: 'common',
    types: [CardType.MELEE, CardType.ATTACK]
  },
  {
    id: 'vicious_bite',
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
    id: 'terrifying_howl',
    name: 'Terrifying Howl',
    description: 'Apply 2 weak to player',
    cost: 2,
    effect: 'Apply 2 weak',
    class: 'beast',
    rarity: 'rare',
    types: [CardType.SKILL]
  },
  {
    id: 'call_pack',
    name: 'Call the Pack',
    description: 'Add 2 Wolf minion cards to player discard pile',
    cost: 2,
    effect: 'Shuffle wolf minions',
    class: 'beast',
    rarity: 'rare',
    types: [CardType.SKILL]
  },
  {
    id: 'killing_instinct',
    name: 'Killing Instinct',
    description: 'Deal 10 damage. If the target is bleeding, deals 15 instead.',
    cost: 2,
    attack: 10,
    effect: 'Bonus damage vs bleeding',
    class: 'beast',
    rarity: 'common',
    types: [CardType.MELEE, CardType.ATTACK]
  }
];