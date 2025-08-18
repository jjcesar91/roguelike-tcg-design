import { PlayerClass } from '@/types/game';
import { Swords, VenetianMask, Zap } from 'lucide-react';

// Core player class definitions with stats, portraits and starting cards.
// These were previously defined in src/data/gameData.ts and have been moved
// here so that new classes can be added by simply editing this module.
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
    id: PlayerClass.WARRIOR,
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
    id: PlayerClass.ROGUE,
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
    id: PlayerClass.WIZARD,
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

// Legacy export kept for backward compatibility.  It contains no entries by
// default; to add new classes simply extend the playerClasses object above.
export const extraClasses: any[] = [];
