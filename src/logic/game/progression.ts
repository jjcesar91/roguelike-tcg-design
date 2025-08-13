export type Difficulty = 'basic' | 'medium' | 'boss';
export type RewardKind = 'card' | 'passive' | null;

export interface LevelConfig {
  level: number;
  difficulty: Difficulty;
  reward: RewardKind;
}

export const progression: LevelConfig[] = [
  { level: 1, difficulty: 'basic',  reward: 'card'    },
  { level: 2, difficulty: 'medium', reward: 'passive' },
  { level: 3, difficulty: 'boss',   reward: null      },
];

export function getLevelConfig(level: number): LevelConfig | undefined {
  return progression.find(l => l.level === level);
}
