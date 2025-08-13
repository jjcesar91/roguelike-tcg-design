import { Opponent } from '@/types/game';
import { opponentCards } from './cards';
import { opponentPassives } from './passives';

// Base opponent definitions.  All core opponents are declared here so they can
// be extended or modified without touching gameData.ts.  To add new
// opponents simply append to this array.
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
        ...opponentCards.monster.slice(4, 5)  // Booby Trap (copy 2)
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
        ...opponentCards.beast.slice(6, 7)  // Killing Instinct (2nd copy)
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

// Legacy export kept for backward compatibility.  It contains no entries by
// default; to add new opponents simply append to the array above.
export const extraOpponents: any[] = [];
