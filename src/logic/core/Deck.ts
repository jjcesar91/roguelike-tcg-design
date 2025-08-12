import { Card } from '@/types/game';

/**
 * Deck encapsulates draw/discard/shuffle behaviour.
 * Keeps the logic in one place so game loops stay simple.
 */
export default class Deck {
  cards: Card[];
  discardPile: Card[];

  constructor(cards: Card[] = [], discardPile: Card[] = []) {
    this.cards = [...cards];
    this.discardPile = [...discardPile];
  }

  static shuffle(arr: Card[]): Card[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  draw(n = 1): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < n; i++) {
      if (this.cards.length === 0 && this.discardPile.length > 0) {
        this.cards = Deck.shuffle(this.discardPile);
        this.discardPile = [];
      }
      const c = this.cards.shift();
      if (!c) break;
      drawn.push(c);
    }
    return drawn;
  }

  discard(cards: Card[]) {
    this.discardPile.push(...cards);
  }

  addToTop(cards: Card[]) {
    this.cards = [...cards, ...this.cards];
  }

  addToBottom(cards: Card[]) {
    this.cards.push(...cards);
  }
}
