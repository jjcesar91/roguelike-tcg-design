// src/types/path.ts

import { Opponent, Card, PlayerClass } from './game';

export enum EncounterType {
  BATTLE = 'battle',
  CAMP = 'camp',
  EVENT = 'event',
  MERCHANT = 'merchant',
  BOSS = 'boss',
}

export enum DifficultyLevel {
  D1 = 1,
  D2 = 2,
  D3 = 3,
  D4 = 4,
  D5 = 5,
  D6 = 6,
  D7 = 7,
  D8 = 8,
  D9 = 9,
  D10 = 10,
}

export interface PathEncounter {
  id: string;
  type: EncounterType;
  difficulty: DifficultyLevel;
  opponentId?: string; // Only for battle/boss
}

export interface GamePath {
  encounters: PathEncounter[];
  current: number; // index of current encounter
}

export interface CardRewardChoice {
  card: Card;
}

export interface PathState {
  path: GamePath;
  completedEncounters: PathEncounter[];
  nextChoices: PathEncounter[];
  rewardChoices: CardRewardChoice[];
}
