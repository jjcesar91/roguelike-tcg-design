import { useState, useEffect, useRef } from 'react';
import { GameState, PlayerClass, Player, Opponent, BattleState } from '@/types/game';
import { createPlayer, getRandomOpponent, initializeBattle, getRandomCards, getRandomPassives, replaceCardInDeck, drawCardsWithReshuffle } from '@/lib/gameUtils';
import { getLevelConfig } from '@/logic/game/progression';

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
    const levelCfg = getLevelConfig(gameStateRef.current.player?.level ?? 1);
    if (!levelCfg) {
      setGamePhase('victory');
      return;
    }
    if (levelCfg.reward === 'card') {
      setGamePhase('card-selection');
      const newCards = getRandomCards(gameStateRef.current.player?.class || 'warrior', 3);
      setAvailableCards(newCards);
    } else if (levelCfg.reward === 'passive') {
      setGamePhase('passive-selection');
      const passives = getRandomPassives(gameStateRef.current.player?.class || 'warrior', 3);
      setAvailablePassives(passives);
    } else {
      setGamePhase('victory');
    }
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