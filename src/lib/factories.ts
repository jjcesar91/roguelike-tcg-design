import { Card, Opponent, Passive, PlayerClass, OpponentType, CardType } from '@/types/game'

export function createCard(init: Partial<Card> & Pick<Card,'id'|'name'|'class'>): Card {
  return {
    description: '',
    cost: 1,
    rarity: 'common',
    types: [],
    ...init,
  } as Card;
}

export function createOpponent(init: Partial<Opponent> & Pick<Opponent,'id'|'name'|'type'>): Opponent {
  return {
    health: init.maxHealth ?? 30,
    maxHealth: init.maxHealth ?? 30,
    portrait: '',
    deck: { cards: [], discardPile: [] },
    difficulty: 'basic',
    ...init,
  } as Opponent;
}

export function ensureTypes(...ts: CardType[]): CardType[] { return ts }
