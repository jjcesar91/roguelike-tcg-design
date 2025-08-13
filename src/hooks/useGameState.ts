import { useState, useEffect, useRef } from 'react';
import { GameState, PlayerClass, Player, Opponent, BattleState } from '@/types/game';
import { createPlayer, getRandomOpponent, initializeBattle, getRandomCards, getRandomPassives, replaceCardInDeck, drawCardsWithReshuffle } from '@/lib/gameUtils';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: null,
    currentOpponent: null,
    gamePhase: 'starting-splash',
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

  const startGame = (playerClass: PlayerClass, opponent: Opponent) => {
    const player = createPlayer(playerClass);
    const battleState = initializeBattle(player, opponent);
    
    // Draw 3 cards for player's first turn using proper draw mechanics
    // BUT only if it's the player's turn (no ambush)
    const updatedBattleState = { ...battleState };
    
    if (battleState.turn === 'player') {
      // Normal case: player goes first, draw 3 cards
      console.log('useGameState: Normal case - player goes first, drawing 3 cards');
      const drawResult = drawCardsWithReshuffle(
        updatedBattleState.playerDeck, 
        updatedBattleState.playerDiscardPile, 
        3
      );
      updatedBattleState.playerHand = drawResult.drawnCards;
      updatedBattleState.playerDeck = drawResult.updatedDeck;
      updatedBattleState.playerDiscardPile = drawResult.updatedDiscardPile;
    } else {
      // Ambush case: opponent goes first, player starts with empty hand
      console.log('useGameState: Ambush case - opponent goes first, player hand remains empty');
      // playerHand should already be empty from initializeBattle
    }

    const newGameState = {
      player,
      currentOpponent: opponent,
      gamePhase: 'battle' as const,
      availableCards: [],
      availablePassives: [],
      battleState: updatedBattleState,
      opponentCardPreview: {
        card: null,
        isVisible: false
      }
    };

    setGameState(newGameState);
    return newGameState;
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
      gamePhase: 'starting-splash',
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
    let nextPhase: GameState['gamePhase'] = 'card-selection';
    let availablePassives: any[] = [];

    // After beating medium opponent (when current level is 2), offer passive selection
    if (currentLevel === 2) {
      nextPhase = 'passive-selection';
      availablePassives = getRandomPassives(gameState.player.class, 3);
    }

    // After beating boss (level 3), game is complete
    if (newLevel > 3) {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'victory'
      }));
      return;
    }

    const availableCards = getRandomCards(gameState.player.class, 3);

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
      gamePhase: 'defeat'
    }));
  };

  return {
    gameState,
    gameStateRef,
    startGame,
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