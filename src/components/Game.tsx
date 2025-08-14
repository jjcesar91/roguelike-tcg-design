'use client';

import React from 'react';
import { dbg } from '@/lib/debug';
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
import { OpponentAI } from '@/logic/game/OpponentAI';
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
      dbg('🚀 handleClassSelect called with:', playerClass);
      const { player, opponent, battleState } = GameEngine.startGame(playerClass);
      dbg('📋 GameEngine.startGame result:', { player, opponent, battleState: { ...battleState, turn: battleState.turn } });
      
      const newGameState = startGame(playerClass, opponent);
      dbg('📋 useGameState.startGame result:', { 
        gamePhase: newGameState.gamePhase, 
        player: newGameState.player, 
        opponent: newGameState.currentOpponent,
        battleState: { ...newGameState.battleState, turn: newGameState.battleState?.turn }
      });
      
      setSelectedClass(playerClass);
      
      // Show splash screen with scroll callback
      showBattleSplash(opponent, () => {
        dbg('🎬 Splash screen callback triggered');
        // Scroll to top after splash screen completes
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Check if opponent has ambush and goes first
        setTimeout(() => {
          dbg('⏰ Ambush check timeout triggered');
          // Use the current game state from ref instead of captured battleState
          const currentState = gameStateRef.current;
          dbg('📋 Current state in timeout:', { 
            gamePhase: currentState.gamePhase, 
            player: currentState.player, 
            opponent: currentState.currentOpponent,
            battleState: { ...currentState.battleState, turn: currentState.battleState?.turn }
          });
          
          if (currentState.battleState && currentState.battleState.turn === 'opponent') {
            dbg('Opponent has ambush - triggering first turn');
            playOpponentTurn();
          } else {
            dbg('No ambush detected or missing battle state');
          }
        }, 500); // Small delay after splash screen
      });
      
      // Force a re-render by logging immediately after
      setTimeout(() => {
        dbg('📋 Game state after 100ms delay:', gameState);
        dbg('Current game phase after update:', gameState.gamePhase);
        dbg('Current opponent after update:', gameState.currentOpponent);
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
    const { drawCardsWithMinionEffects, formatLogText, opponentPlayCard } = await import('@/lib/gameUtils');
    // Make local copies of battle state, player and opponent to mutate through the turn
    let bs = { ...current.battleState };
    let pl = { ...current.player };
    let op = { ...current.currentOpponent };

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
    // Update state after drawing cards
    updateBattleState(bs);
    updateOpponent(op);

    // Instantiate unified opponent AI
    const ai = new OpponentAI();

    // Loop until no playable cards
    while (true) {
      // Determine next set of cards to play based on current state
      const plays = ai.decidePlays(bs.opponentHand, bs.opponentEnergy, bs, op, pl);
      if (!plays || plays.length === 0) {
        break;
      }
      // Always play cards one by one, recomputing after each play
      const card = plays[0];
      // Show preview for the chosen card
      updateOpponentCardPreview(card, true);
      await new Promise(r => setTimeout(r, 800));
      updateOpponentCardPreview(null, false);
      // Play the specific card
      const res = opponentPlayCard(op, pl, bs, card);
      // Merge logs: append our AI log entries
      const mergedLog = [...res.newBattleState.battleLog, ...res.log];
      bs = { ...res.newBattleState, battleLog: mergedLog };
      pl = res.newPlayer;
      op = res.newOpponent;
      // Update React state
      updateBattleState(bs);
      updatePlayer(pl);
      updateOpponent(op);

      // Check for victory or defeat
      if (GameEngine.checkVictory(pl, op)) {
        handleVictory();
        return;
      }
      if (GameEngine.checkDefeat(pl)) {
        handleDefeat();
        return;
      }
      // small pause between cards
      await new Promise(r => setTimeout(r, 400));
    }
    // End opponent turn when no cards are left to play
    const end = GameEngine.endTurn(bs, pl, op);
    updateBattleState(end.newBattleState);
    updatePlayer(end.newPlayer);
    updateOpponent(end.newOpponent);
  };

  
  const handleCardPlay = (card: any) => {
    dbg('=== GAME COMPONENT CARD PLAY DEBUG ===');
    dbg('Card being played:', card);
    dbg('Card name:', card.name);
    dbg('Card ID:', card.id);
    dbg('Card cost:', card.cost);
    dbg('Current game state:', gameState);
    
    if (!gameState.player || !gameState.currentOpponent || !gameState.battleState) {
      dbg('❌ Missing required game state for card play');
      return;
    }

    dbg('✅ Game state valid, calling GameEngine.playCard...');
    const result = GameEngine.playCard(card, gameState.player, gameState.currentOpponent, gameState.battleState);
    dbg('GameEngine.playCard result:', result);
    
    updatePlayer(result.newPlayer);
    updateOpponent(result.newOpponent);
    updateBattleState(result.newBattleState);

    // Check for victory or defeat
    if (GameEngine.checkVictory(result.newPlayer, result.newOpponent)) {
      dbg('🎉 Victory detected!');
      handleVictory();
    } else if (GameEngine.checkDefeat(result.newPlayer)) {
      dbg('💀 Defeat detected!');
      handleDefeat();
    }
    dbg('=== GAME COMPONENT CARD PLAY COMPLETE ===');
  };

  const handleEndTurn = () => {
    dbg('handleEndTurn called');
    if (!gameState.battleState || !gameState.player || !gameState.currentOpponent) return;

    const { newBattleState, newPlayer, newOpponent, isOpponentTurn } = GameEngine.endTurn(
      gameState.battleState, 
      gameState.player, 
      gameState.currentOpponent
    );
    
    dbg('After endTurn, new turn:', newBattleState.turn);
    
    updateBattleState(newBattleState);
    updatePlayer(newPlayer);
    updateOpponent(newOpponent);
    
    if (isOpponentTurn) {
      dbg('Setting up opponent turn...');
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