import Deck from './Deck'
import StatusManager from './StatusManager'
import { Card, Passive, PlayerClass, OpponentType, StatusEffect } from '@/types/game'

/**
 * Minimal character model (player/opponent) used by BattleEngine.
 * Keeps battle state cohesive and easy to extend.
 */
export default class Character {
  name?: string
  classOrType: PlayerClass | OpponentType
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
  deck: Deck
  hand: Card[] = []
  passives: Passive[] = []
  statuses: StatusEffect[] = []
  block: number = 0

  constructor(opts: {
    classOrType: PlayerClass | OpponentType
    health: number
    maxHealth?: number
    energy: number
    maxEnergy?: number
    deckCards: Card[]
    name?: string
    passives?: Passive[]
  }) {
    this.classOrType = opts.classOrType
    this.health = opts.health
    this.maxHealth = opts.maxHealth ?? opts.health
    this.energy = opts.energy
    this.maxEnergy = opts.maxEnergy ?? opts.energy
    this.deck = new Deck(opts.deckCards)
    this.name = opts.name
    this.passives = opts.passives ?? []
  }

  draw(n = 1) { this.hand.push(...this.deck.draw(n)) }
  discardAll() { this.deck.discard(this.hand.splice(0)) }
  takeDamage(n: number) {
    const blocked = Math.max(0, Math.min(this.block, n))
    const dmg = Math.max(0, n - blocked)
    this.block = Math.max(0, this.block - n)
    this.health = Math.max(0, this.health - dmg)
    return { blocked, dmg }
  }

  addStatus(type: StatusEffect['type'], value: number, duration: number) {
    this.statuses = StatusManager.add(this.statuses, type, value, duration)
  }

  tickStatuses() {
    this.statuses = StatusManager.tick(this.statuses)
  }

  consumeEvasive() {
    this.statuses = StatusManager.consumeEvasive(this.statuses)
  }
}
