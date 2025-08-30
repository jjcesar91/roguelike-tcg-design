// src/content/modules/path.ts

import { EncounterType, DifficultyLevel } from '@/types/path';
import { OpponentType, Difficulty } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';




// Classe Encounter
export class Encounter {
  id: string;
  type: EncounterType;
  difficultyLevel?: DifficultyLevel;
  eventId?: string;
  pathStepMin: number;
  pathStepMax: number;
  constructor(params: {
    id: string;
    type: EncounterType;
    difficultyLevel?: DifficultyLevel;
    eventId?: string;
    pathStepMin: number;
    pathStepMax: number;
  }) {
    this.id = params.id;
    this.type = params.type;
    this.difficultyLevel = params.difficultyLevel;
    this.eventId = params.eventId;
    this.pathStepMin = params.pathStepMin;
    this.pathStepMax = params.pathStepMax;
  }
}

// Oggetto path "Dark Forest"
export const DarkForestPath = {
  description: "Dark Forest",
  subtitle: "Act I",
  thumbnail: "https://i.imgur.com/7Uw1qdd.png",
  encounters: [
    new Encounter({
      id: 'lesser_battle',
      type: EncounterType.BATTLE,
      difficultyLevel: DifficultyLevel.D1,
      pathStepMin: 1,
      pathStepMax: 3
    }),
    new Encounter({
      id: 'lost_child',
      type: EncounterType.EVENT,
      eventId: 'lost_child',
      pathStepMin: 1,
      pathStepMax: 5
    })
    // Aggiungi altri encounter qui...
  ]
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
