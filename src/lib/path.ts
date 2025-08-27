// src/lib/path.ts

import { EncounterType, DifficultyLevel, PathEncounter, GamePath } from '@/types/path';
import { Opponent } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

// Generate a new path with N encounters, always starting with a battle of difficulty 1
export function generateGamePath(encounterCount: number): GamePath {
  const encounters: PathEncounter[] = [];
  // First encounter: always battle, difficulty 1
  encounters.push({
    id: uuidv4(),
    type: EncounterType.BATTLE,
    difficulty: DifficultyLevel.D1,
  });
  // Next encounters: for now, only battles, increasing difficulty
  for (let i = 2; i <= encounterCount; i++) {
    encounters.push({
      id: uuidv4(),
      type: EncounterType.BATTLE,
      difficulty: i as DifficultyLevel,
    });
  }
  return {
    encounters,
    current: 0,
  };
}

// Get next two encounter choices (for now, just next two battles)
export function getNextEncounterChoices(path: GamePath): PathEncounter[] {
  const idx = path.current + 1;
  return path.encounters.slice(idx, idx + 2);
}

// Mark encounter as completed and advance
export function completeEncounter(path: GamePath): GamePath {
  return {
    ...path,
    current: Math.min(path.current + 1, path.encounters.length - 1),
  };
}
