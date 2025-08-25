import { useState, useEffect, useRef } from 'react';
import { GameState, PlayerClass, Player, Opponent, BattleState, GamePhase } from '@/types/game';
import { GameEngine } from '@/logic/game/GameEngine';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: null,
    currentOpponent: null,
    gamePhase: GamePhase.STARTING_SPLASH,
    availableCards: [],
    availablePassives: [],
    battleState: null,
    opponentCardPreview: {
      card: null,
      isVisible: false
    }
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Add useEffect to monitor game state changes
  useEffect(() => {
    console.log('Game state changed:', gameState);
    console.log('Current game phase:', gameState.gamePhase);
  }, [gameState]);

  const initRun = (playerClass: PlayerClass) => {
    const { player } = GameEngine.initRun(playerClass);
    const nextState: GameState = {
      ...gameStateRef.current,
      player,
      currentOpponent: null,
      battleState: null,
      gamePhase: GamePhase.BATTLE,
      availableCards: [],
      availablePassives: []
    };
    setGameState(nextState);
    gameStateRef.current = nextState;
    return nextState;
  };

  const updatePlayer = (player: Player) => {
    setGameState(prev => ({
      ...prev,
      player
    }));
  };

  const updateOpponent = (opponent: Opponent) => {
    setGameState(prev => ({
      ...prev,
      currentOpponent: opponent
    }));
  };

  const updateBattleState = (battleState: BattleState) => {
    setGameState(prev => ({
      ...prev,
      battleState
    }));
  };

  const updateOpponentCardPreview = (card: any, isVisible: boolean) => {
    setGameState(prev => ({
      ...prev,
      opponentCardPreview: {
        card,
        isVisible
      }
    }));
  };

  const setGamePhase = (phase: GameState['gamePhase']) => {
    setGameState(prev => ({
      ...prev,
      gamePhase: phase
    }));
  };

  const setAvailableCards = (cards: any[]) => {
    setGameState(prev => ({
      ...prev,
      availableCards: cards
    }));
  };

  const setAvailablePassives = (passives: any[]) => {
    setGameState(prev => ({
      ...prev,
      availablePassives: passives
    }));
  };

  const restartGame = () => {
    setGameState({
      player: null,
      currentOpponent: null,
      gamePhase: GamePhase.STARTING_SPLASH,
      availableCards: [],
      availablePassives: [],
      battleState: null,
      opponentCardPreview: {
        card: null,
        isVisible: false
      }
    });
  };

  const handleVictory = () => {
    if (!gameState.player) return;

    const currentLevel = gameState.player.level;
    const newLevel = gameState.player.level + 1;
    let nextPhase: GameState['gamePhase'] = GamePhase.CARD_SELECTION;
    let availablePassives: any[] = [];

    // After beating medium opponent (when current level is 2), offer passive selection
    if (currentLevel === 2) {
      nextPhase = GamePhase.PASSIVE_SELECTION;
      availablePassives = GameEngine.getAvailablePassives(gameState.player.class, 3);
    }

    // After beating boss (level 3), game is complete
    if (newLevel > 3) {
      setGameState(prev => ({
        ...prev,
        gamePhase: GamePhase.VICTORY
      }));
      return;
    }

    const availableCards = GameEngine.getAvailableCards(gameState.player.class, 3);

    setGameState(prev => ({
      ...prev,
      player: { ...prev.player!, level: newLevel },
      gamePhase: nextPhase,
      availableCards,
      availablePassives
    }));
  };

  const handleDefeat = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: GamePhase.DEFEAT
    }));
  };

  return {
    gameState,
    gameStateRef,
    initRun,
    updatePlayer,
    updateOpponent,
    updateBattleState,
    updateOpponentCardPreview,
    setGamePhase,
    setAvailableCards,
    setAvailablePassives,
    restartGame,
    handleVictory,
    handleDefeat
  };
};