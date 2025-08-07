'use client';

import React from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useSelectionState } from '@/hooks/useSelectionState';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { useModalState } from '@/hooks/useModalState';
import { GameEngine } from '@/logic/game/GameEngine';
import { ClassSelection } from './game/phases/ClassSelection';
import { CardSelection } from './game/phases/CardSelection';
import { PassiveSelection } from './game/phases/PassiveSelection';
import { VictoryScreen } from './game/phases/VictoryScreen';
import { DefeatScreen } from './game/phases/DefeatScreen';
import { BattlePhase } from './game/battle/BattlePhase';
import { SplashScreen } from './game/shared/SplashScreen';
import { StartingSplashScreen } from './game/shared/StartingSplashScreen';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PlayerClass } from '@/types/game';
import { playerClasses } from '@/data/gameData';

export default function Game() {
  const {
    gameState,
    gameStateRef,
    startGame,
    updatePlayer,
    updateOpponent,
    updateBattleState,
    setGamePhase,
    setAvailableCards,
    setAvailablePassives,
    restartGame,
    handleVictory,
    handleDefeat
  } = useGameState();

  const {
    selectedClass,
    setSelectedClass,
    selectedCard,
    setSelectedCard,
    selectedReplaceCard,
    setSelectedReplaceCard,
    selectedPassive,
    setSelectedPassive,
    resetSelections
  } = useSelectionState();

  const {
    showSplashScreen,
    splashOpponent,
    showBattleSplash
  } = useSplashScreen();

  const {
    showDeckModal,
    showDiscardModal,
    setShowDeckModal,
    setShowDiscardModal
  } = useModalState();

  const handleClassSelect = (playerClass: PlayerClass) => {
    try {
      const { player, opponent, battleState } = GameEngine.startGame(playerClass);
      
      const newGameState = startGame(playerClass, opponent);
      
      setSelectedClass(playerClass);
      
      // Show splash screen with scroll callback
      showBattleSplash(opponent, () => {
        // Scroll to top after splash screen completes
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      
      // Force a re-render by logging immediately after
      setTimeout(() => {
        console.log('Game state after update:', gameState);
        console.log('Current game phase after update:', gameState.gamePhase);
        console.log('Current opponent after update:', gameState.currentOpponent);
      }, 100);
      
    } catch (error) {
      console.error('Error in handleClassSelect:', error);
    }
  };

  const handleCardPlay = (card: any) => {
    if (!gameState.player || !gameState.currentOpponent || !gameState.battleState) return;

    const result = GameEngine.playCard(card, gameState.player, gameState.currentOpponent, gameState.battleState);
    
    updatePlayer(result.newPlayer);
    updateOpponent(result.newOpponent);
    updateBattleState(result.newBattleState);

    // Check for victory or defeat
    if (GameEngine.checkVictory(result.newPlayer, result.newOpponent)) {
      handleVictory();
    } else if (GameEngine.checkDefeat(result.newPlayer)) {
      handleDefeat();
    }
  };

  const handleEndTurn = () => {
    console.log('handleEndTurn called');
    if (!gameState.battleState || !gameState.player || !gameState.currentOpponent) return;

    const { newBattleState, isOpponentTurn } = GameEngine.endTurn(
      gameState.battleState, 
      gameState.player, 
      gameState.currentOpponent
    );
    
    console.log('After endTurn, new turn:', newBattleState.turn);
    
    updateBattleState(newBattleState);
    
    if (isOpponentTurn) {
      console.log('Setting up opponent turn...');
      
      // Then, after a short delay, have the opponent play their card
      console.log('Setting timeout for opponent play...');
      setTimeout(() => {
        console.log('Timeout callback executed');
        
        const currentState = gameStateRef.current;
        console.log('Current state from ref:', currentState);
        if (!currentState.battleState || !currentState.player || !currentState.currentOpponent) {
          console.log('Missing required state, returning');
          return;
        }

        console.log('Calling opponentPlayCard...');
        const result = GameEngine.opponentTurn(
          currentState.currentOpponent, 
          currentState.player, 
          currentState.battleState
        );
        console.log('opponentPlayCard result:', result);

        console.log('Updating game state...');
        updatePlayer(result.newPlayer);
        updateOpponent(result.newOpponent);
        updateBattleState(result.newBattleState);

        // Check for victory or defeat
        if (result.isVictory) {
          console.log('Victory detected!');
          handleVictory();
        } else if (result.isDefeat) {
          console.log('Defeat detected!');
          handleDefeat();
        }
      }, 1000); // 1 second delay for better UX
    }
  };

  const handleCardSelect = (card: any) => {
    if (!gameState.player || !selectedReplaceCard) return;

    const { newPlayer, opponent, battleState } = GameEngine.selectCard(
      card, 
      gameState.player, 
      selectedReplaceCard
    );
    
    updatePlayer(newPlayer);
    updateOpponent(opponent);
    updateBattleState(battleState);
    setGamePhase('battle');
    setAvailableCards([]);
    setAvailablePassives([]);

    setSelectedCard(null);
    setSelectedReplaceCard(null);
    
    // Show splash screen with scroll callback
    showBattleSplash(opponent, () => {
      // Scroll to top after splash screen completes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handlePassiveSelect = (passive: any) => {
    if (!gameState.player) return;

    const { newPlayer, availableCards } = GameEngine.selectPassive(gameState.player, passive);

    updatePlayer(newPlayer);
    setGamePhase('card-selection');
    setAvailableCards(availableCards);
    setAvailablePassives([]);

    setSelectedPassive(null);
  };

  const handleRestart = () => {
    restartGame();
    resetSelections();
  };

  const handleStartingSplashComplete = () => {
    setGamePhase('class-selection');
  };

  const canPlayCard = (card: any) => {
    if (!gameState.player || !gameState.battleState) return false;
    return GameEngine.canPlayCard(card, gameState.player, gameState.battleState);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Starting Splash Screen */}
        <StartingSplashScreen 
          isVisible={gameState.gamePhase === 'starting-splash'}
          onComplete={handleStartingSplashComplete}
        />
        
        {/* Splash Screen */}
        <SplashScreen 
          showSplashScreen={showSplashScreen}
          splashOpponent={splashOpponent}
        />
        
        {/* Game Phases */}
        {gameState.gamePhase === 'class-selection' && (
          <ClassSelection 
            onClassSelect={handleClassSelect}
            availableClasses={Object.keys(playerClasses) as PlayerClass[]}
          />
        )}
        
        {gameState.gamePhase === 'battle' && gameState.player && gameState.currentOpponent && gameState.battleState && (
          <BattlePhase 
            player={gameState.player}
            opponent={gameState.currentOpponent}
            battleState={gameState.battleState}
            showDeckModal={showDeckModal}
            showDiscardModal={showDiscardModal}
            onDeckModalChange={setShowDeckModal}
            onDiscardModalChange={setShowDiscardModal}
            onCardPlay={handleCardPlay}
            onEndTurn={handleEndTurn}
            canPlayCard={canPlayCard}
          />
        )}
        
        {gameState.gamePhase === 'card-selection' && gameState.player && (
          <CardSelection 
            player={gameState.player}
            availableCards={gameState.availableCards}
            selectedCard={selectedCard}
            selectedReplaceCard={selectedReplaceCard}
            onCardSelect={setSelectedCard}
            onReplaceCardSelect={setSelectedReplaceCard}
            onConfirm={() => {
              const card = gameState.availableCards.find(c => c.id === selectedCard);
              if (card) handleCardSelect(card);
            }}
          />
        )}
        
        {gameState.gamePhase === 'passive-selection' && gameState.player && (
          <PassiveSelection 
            player={gameState.player}
            availablePassives={gameState.availablePassives}
            selectedPassive={selectedPassive}
            onPassiveSelect={setSelectedPassive}
            onConfirm={() => {
              const passive = gameState.availablePassives.find(p => p.id === selectedPassive);
              if (passive) handlePassiveSelect(passive);
            }}
          />
        )}
        
        {gameState.gamePhase === 'victory' && (
          <VictoryScreen onRestart={handleRestart} />
        )}
        
        {gameState.gamePhase === 'defeat' && (
          <DefeatScreen onRestart={handleRestart} />
        )}
      </div>
    </TooltipProvider>
  );
}