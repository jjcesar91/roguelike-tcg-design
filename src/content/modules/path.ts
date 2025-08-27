// src/content/modules/path.ts

import { EncounterType, DifficultyLevel, PathEncounter, GamePath } from '@/types/path';
import { OpponentType, Difficulty } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';



export const DarkForestPath: GamePath = {
  encounters: Array.from({ length: 10 }, (_, i) => ({
    id: uuidv4(),
    type: EncounterType.BATTLE,
    difficulty: (i + 1) as DifficultyLevel,
  })),
  current: 0,
};

export function getOpponentsByDifficulty(difficulty: DifficultyLevel) {
  // Mappa DifficultyLevel numerico a Difficulty stringa
  let diff: Difficulty | undefined;
  if (difficulty === DifficultyLevel.D1) diff = Difficulty.BASIC;
  else if (difficulty === DifficultyLevel.D5) diff = Difficulty.MEDIUM;
  else if (difficulty === DifficultyLevel.D10) diff = Difficulty.BOSS;
  else diff = undefined;

  // Prendi tutti gli avversari dal gameData
  const allOpponents = require('@/data/gameData').getAllOpponents();
  if (!diff) return [];
  return allOpponents.filter((o: any) => o.difficulty === diff);
}
