import { Card, PlayerClass, Opponent } from '@/types/game'
import { EffectCode } from '../../content/modules/effects'
import { opponents as allOpponents, playerCards, playerClasses } from '@/data/gameData'
import Character from '../core/Character'

/**
 * Lightweight orchestration for battle setup/flow.
 * Non-breaking: existing GameEngine methods can keep working;
 * this provides an OOP alternative consumers can migrate to.
 */
export class BattleEngine {
  player: Character
  opponent: Opponent
  turn: 'player' | 'opponent'
  log: string[] = []

  private constructor(player: Character, opponent: Opponent, turn: 'player'|'opponent') {
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

    const opponent: Opponent = {
      id: baseOpp.id,
      name: baseOpp.name,
      type: baseOpp.type,
      health: baseOpp.health,
      maxHealth: baseOpp.maxHealth ?? baseOpp.health,
      energy: 2,
      maxEnergy: 2,
      portrait: baseOpp.portrait,
      deck: { cards: oppDeck, discardPile: [] },
      difficulty: baseOpp.difficulty,
      passives: baseOpp.passives ?? [],
    }

    // Determine first turn (ambush check by passive effect code)
    const ambush =
      Array.isArray(baseOpp.passives) &&
      baseOpp.passives.some(p => p.effects?.some(e => e.code === EffectCode.ambush));
    const engine = new BattleEngine(player, opponent, ambush ? 'opponent' : 'player')

    if (engine.turn === 'player') {
      // Initial draws should be handled by the engine flow.
    } else {
      // opponent draws on their first turn in the UI flow
    }

    engine.log.push('Battle started.')
    return engine
  }
}
