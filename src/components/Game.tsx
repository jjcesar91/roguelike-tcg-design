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
import { OpponentCardPreview } from './game/battle/OpponentCardPreview';
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
    updateOpponentCardPreview,
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
    splashCompleted,
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
      console.log('🚀 handleClassSelect called with:', playerClass);
      const { player, opponent, battleState } = GameEngine.startGame(playerClass);
      console.log('📋 GameEngine.startGame result:', { player, opponent, battleState: { ...battleState, turn: battleState.turn } });
      
      const newGameState = startGame(playerClass, opponent);
      console.log('📋 useGameState.startGame result:', { 
        gamePhase: newGameState.gamePhase, 
        player: newGameState.player, 
        opponent: newGameState.currentOpponent,
        battleState: { ...newGameState.battleState, turn: newGameState.battleState?.turn }
      });
      
      setSelectedClass(playerClass);
      
      // Show splash screen with scroll callback
      showBattleSplash(opponent, () => {
        console.log('🎬 Splash screen callback triggered');
        // Scroll to top after splash screen completes
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Check if opponent has ambush and goes first
        setTimeout(() => {
          console.log('⏰ Ambush check timeout triggered');
          // Use the current game state from ref instead of captured battleState
          const currentState = gameStateRef.current;
          console.log('📋 Current state in timeout:', { 
            gamePhase: currentState.gamePhase, 
            player: currentState.player, 
            opponent: currentState.currentOpponent,
            battleState: { ...currentState.battleState, turn: currentState.battleState?.turn }
          });
          
          if (currentState.battleState && currentState.battleState.turn === 'opponent') {
            console.log('Opponent has ambush - triggering first turn');
            playOpponentTurn();
          } else {
            console.log('No ambush detected or missing battle state');
          }
        }, 500); // Small delay after splash screen
      });
      
      // Force a re-render by logging immediately after
      setTimeout(() => {
        console.log('📋 Game state after 100ms delay:', gameState);
        console.log('Current game phase after update:', gameState.gamePhase);
        console.log('Current opponent after update:', gameState.currentOpponent);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in handleClassSelect:', error);
    }
  };

  // Simplified, sequential opponent turn without nested setTimeout chains
  const playOpponentTurn = async () => {
    const current = gameStateRef.current;
    if (!current.battleState || !current.player || !current.currentOpponent) return;

    // Draw 3 for opponent at start of their first turn (ambush or regular)
    const { drawCardsWithMinionEffects, formatLogText } = await import('@/lib/gameUtils');
    const bs = { ...current.battleState };
    const pl = { ...current.player };
    const op = { ...current.currentOpponent };

    const draw = drawCardsWithMinionEffects(
      bs.opponentDeck,
      bs.opponentDiscardPile,
      3,
      'opponent',
      pl.class,
      op.name
    );
    bs.opponentHand = [...bs.opponentHand, ...draw.drawnCards];
    bs.opponentDeck = draw.updatedDeck;
    bs.opponentDiscardPile = draw.updatedDiscardPile;
    bs.battleLog = [...bs.battleLog, formatLogText('Opponent draws 3 cards...', pl.class, op.name), ...draw.minionDamageLog];

    updateBattleState(bs);
    updateOpponent(op);

    // Play all playable cards in order with small UI delays
    const playable = () => bs.opponentHand.filter(c => !c.unplayable && c.cost <= bs.opponentEnergy);
    while (playable().length) {
      const card = playable()[0];
      updateOpponentCardPreview(card, true);
      await new Promise(r => setTimeout(r, 800));
      updateOpponentCardPreview(null, false);

      const { opponentPlayCard } = await import('@/lib/gameUtils');
      const res = opponentPlayCard(op, pl, bs, card);
      const mergedLog = [...res.newBattleState.battleLog, ...res.log];
      updatePlayer(res.newPlayer);
      updateOpponent(res.newOpponent);
      updateBattleState({ ...res.newBattleState, battleLog: mergedLog });

      // Victory/defeat checks
      if (GameEngine.checkVictory(res.newPlayer, res.newOpponent)) { handleVictory(); return; }
      if (GameEngine.checkDefeat(res.newPlayer)) { handleDefeat(); return; }

      // small pause between cards
      await new Promise(r => setTimeout(r, 400));
    }

    // End opponent turn when no cards playable
    const end = GameEngine.endTurn(gameStateRef.current.battleState!, gameStateRef.current.player!, gameStateRef.current.currentOpponent!);
    updateBattleState(end.newBattleState);
    updatePlayer(end.newPlayer);
    updateOpponent(end.newOpponent);
  };

  
  const handleCardPlay = (card: any) => {
    console.log('=== GAME COMPONENT CARD PLAY DEBUG ===');
    console.log('Card being played:', card);
    console.log('Card name:', card.name);
    console.log('Card ID:', card.id);
    console.log('Card cost:', card.cost);
    console.log('Current game state:', gameState);
    
    if (!gameState.player || !gameState.currentOpponent || !gameState.battleState) {
      console.log('❌ Missing required game state for card play');
      return;
    }

    console.log('✅ Game state valid, calling GameEngine.playCard...');
    const result = GameEngine.playCard(card, gameState.player, gameState.currentOpponent, gameState.battleState);
    console.log('GameEngine.playCard result:', result);
    
    updatePlayer(result.newPlayer);
    updateOpponent(result.newOpponent);
    updateBattleState(result.newBattleState);

    // Check for victory or defeat
    if (GameEngine.checkVictory(result.newPlayer, result.newOpponent)) {
      console.log('🎉 Victory detected!');
      handleVictory();
    } else if (GameEngine.checkDefeat(result.newPlayer)) {
      console.log('💀 Defeat detected!');
      handleDefeat();
    }
    console.log('=== GAME COMPONENT CARD PLAY COMPLETE ===');
  };

  const handleEndTurn = () => {
    console.log('handleEndTurn called');
    if (!gameState.battleState || !gameState.player || !gameState.currentOpponent) return;

    const { newBattleState, newPlayer, newOpponent, isOpponentTurn } = GameEngine.endTurn(
      gameState.battleState, 
      gameState.player, 
      gameState.currentOpponent
    );
    
    console.log('After endTurn, new turn:', newBattleState.turn);
    
    updateBattleState(newBattleState);
    updatePlayer(newPlayer);
    updateOpponent(newOpponent);
    
    if (isOpponentTurn) {
      console.log('Setting up opponent turn...');
      // Use the unified opponent turn runner
      setTimeout(() => {
        playOpponentTurn();
      }, 300);
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
      <div className="container mx-auto p-4 max-w-[720px]">
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
        
        {/* Opponent Card Preview */}
        <OpponentCardPreview 
          card={gameState.opponentCardPreview.card}
          isVisible={gameState.opponentCardPreview.isVisible}
          onHide={() => updateOpponentCardPreview(null, false)}
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
            splashCompleted={splashCompleted}
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