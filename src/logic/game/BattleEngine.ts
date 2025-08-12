import { Card, PlayerClass } from '@/types/game'
import { opponents as allOpponents, playerCards, playerClasses } from '@/data/gameData'
import Character from '../core/Character'

/**
 * Lightweight orchestration for battle setup/flow.
 * Non-breaking: existing GameEngine methods can keep working;
 * this provides an OOP alternative consumers can migrate to.
 */
export class BattleEngine {
  player: Character
  opponent: Character
  turn: 'player' | 'opponent'
  log: string[] = []

  private constructor(player: Character, opponent: Character, turn: 'player'|'opponent') {
    this.player = player
    this.opponent = opponent
    this.turn = turn
  }

  static startBattle(playerClass: PlayerClass, difficulty: 'basic' | 'medium' | 'boss' = 'basic'): BattleEngine {
    const classCards = playerCards[playerClass].slice(0, 3)
    const playerDeck: Card[] = []
    classCards.forEach(c => { for (let i = 0; i < 3; i++) playerDeck.push({ ...c }) })
    const classCfg = playerClasses[playerClass]

    const player = new Character({
      classOrType: playerClass,
      health: classCfg.health,
      energy: classCfg.energy,
      deckCards: playerDeck,
      name: playerClass,
    })

    const candidates = allOpponents.filter(o => o.difficulty === difficulty)
    const baseOpp = candidates[Math.floor(Math.random() * candidates.length)]
    const oppDeck: Card[] = baseOpp.deck.cards.map(c => ({ ...c }))

    const opponent = new Character({
      classOrType: baseOpp.type,
      health: baseOpp.health,
      maxHealth: baseOpp.maxHealth,
      energy: 2,
      deckCards: oppDeck,
      name: baseOpp.name,
      passives: baseOpp.passive ? [baseOpp.passive as any] : []
    })

    // Determine first turn (simple ambush check by passive id/effect)
    const ambush = baseOpp.passive && baseOpp.passive.effect === 'opponent_goes_first'
    const engine = new BattleEngine(player, opponent, ambush ? 'opponent' : 'player')

    if (engine.turn === 'player') {
      engine.player.draw(3)
    } else {
      // opponent draws on their first turn in the UI flow
    }

    engine.log.push('Battle started.')
    return engine
  }
}
