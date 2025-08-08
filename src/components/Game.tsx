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
            handleOpponentFirstTurn();
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

  const handleOpponentFirstTurn = () => {
    console.log('handleOpponentFirstTurn called');
    console.log('Current gameState:', gameState);
    console.log('Current gameStateRef:', gameStateRef.current);
    
    // Always use the ref for state checking since it's more up-to-date
    const currentState = gameStateRef.current;
    if (!currentState.battleState || !currentState.player || !currentState.currentOpponent) {
      console.log('Missing required state for opponent first turn');
      console.log('currentState.battleState:', currentState.battleState);
      console.log('currentState.player:', currentState.player);
      console.log('currentState.currentOpponent:', currentState.currentOpponent);
      return;
    }

    console.log('✅ All required state is present, proceeding with opponent ambush turn...');
    console.log('Current turn:', currentState.battleState.turn);
    console.log('Player health:', currentState.player.health);
    console.log('Opponent health:', currentState.currentOpponent.health);

    // First, simulate the start of opponent turn (draw cards, apply effects)
    Promise.all([
      import('@/lib/gameUtils')
    ]).then(([gameUtils]) => {
      const { 
        drawCardsWithMinionEffects, 
        applyBleedingDamage, 
        updateStatusEffects, 
        formatLogText 
      } = gameUtils;
      
      let updatedBattleState = { ...currentState.battleState };
      let updatedPlayer = { ...currentState.player };
      let updatedOpponent = { ...currentState.currentOpponent };
      const log: string[] = [];

      // Start of opponent turn - apply bleeding damage to opponent
      const opponentBleedingResult = applyBleedingDamage(
        updatedBattleState.opponentStatusEffects,
        updatedOpponent.health,
        updatedOpponent.name,
        false,
        updatedPlayer.class,
        updatedOpponent.name
      );
      updatedOpponent.health = opponentBleedingResult.newHealth;
      log.push(...opponentBleedingResult.logMessages);

      // Start of opponent turn - draw 3 cards with proper reshuffle logic
      console.log('About to draw 3 cards for opponent...');
      console.log('Opponent deck before drawing:', updatedBattleState.opponentDeck);
      console.log('Opponent deck length:', updatedBattleState.opponentDeck.cards.length);
      
      const drawResult = drawCardsWithMinionEffects(
        updatedBattleState.opponentDeck, 
        updatedBattleState.opponentDiscardPile, 
        3,
        'opponent',
        updatedPlayer.class,
        updatedOpponent.name
      );
      
      console.log('Draw result:', drawResult);
      console.log('Cards drawn:', drawResult.drawnCards);
      console.log('Drawn card names:', drawResult.drawnCards.map(c => c.name));
      console.log('Drawn card costs:', drawResult.drawnCards.map(c => c.cost));
      console.log('Drawn card unplayable:', drawResult.drawnCards.map(c => c.unplayable));
      
      updatedBattleState.opponentHand = [...updatedBattleState.opponentHand, ...drawResult.drawnCards];
      updatedBattleState.opponentDeck = drawResult.updatedDeck;
      updatedBattleState.opponentDiscardPile = drawResult.updatedDiscardPile;
      
      log.push(formatLogText('Opponent draws 3 cards...', updatedPlayer.class, updatedOpponent.name));
      
      // Apply damage from Wolf minions if any
      if (drawResult.minionDamageLog.length > 0) {
        // Calculate total damage from Wolf minions
        const wolfDamage = drawResult.minionDamageLog.length * 5; // Each Wolf deals 5 damage
        updatedOpponent.health = Math.max(0, updatedOpponent.health - wolfDamage);
      }
      
      log.push(...drawResult.minionDamageLog);
      
      console.log(`Opponent drew ${drawResult.drawnCards.length} cards for ambush turn`);

      // Update the state with the drawn cards
      updateBattleState(updatedBattleState);
      updateOpponent(updatedOpponent);

      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        console.log('=== STATE UPDATE COMPLETED ===');
        console.log('Updated gameStateRef:', gameStateRef.current);
        
        // Now play the opponent's turn
        setTimeout(() => {
          console.log('=== STARTING OPPONENT TURN ===');
          const currentStateAfterDraw = gameStateRef.current;
          console.log('currentStateAfterDraw:', currentStateAfterDraw);
          if (currentStateAfterDraw.battleState && currentStateAfterDraw.player && currentStateAfterDraw.currentOpponent) {
            console.log('Calling opponentTurn for ambush after drawing...');
            console.log('Opponent hand before playing:', currentStateAfterDraw.battleState.opponentHand);
            console.log('Opponent hand length:', currentStateAfterDraw.battleState.opponentHand.length);
            console.log('Opponent hand details:', currentStateAfterDraw.battleState.opponentHand.map(c => ({ name: c.name, cost: c.cost, unplayable: c.unplayable })));
            
            // Check if opponent has any playable cards
            const playableCards = currentStateAfterDraw.battleState.opponentHand.filter(card => card.cost <= 2 && !card.unplayable);
            console.log('Playable cards:', playableCards.map(c => c.name));
            console.log('Playable cards count:', playableCards.length);
            console.log('All cards in hand:', currentStateAfterDraw.battleState.opponentHand.map(c => ({ name: c.name, cost: c.cost, unplayable: c.unplayable })));
            
            if (playableCards.length === 0) {
              console.log('❌ NO PLAYABLE CARDS - this is the issue!');
              console.log('Opponent hand details:', currentStateAfterDraw.battleState.opponentHand);
            } else {
              console.log('✅ Found playable cards, proceeding with turn');
            }
            
            // Use GameEngine.opponentTurn to handle the opponent's turn
            console.log('About to call GameEngine.opponentTurn...');
            try {
              const result = GameEngine.opponentTurn(
                currentStateAfterDraw.currentOpponent, 
                currentStateAfterDraw.player, 
                currentStateAfterDraw.battleState
              );
              console.log('✅ GameEngine opponentTurn completed successfully');
              console.log('GameEngine opponentTurn result:', result);
              console.log('Cards played by opponent:', result.newBattleState.opponentPlayedCards);
              console.log('Battle log after opponent turn:', result.newBattleState.battleLog);
              console.log('Turn after opponent turn:', result.newBattleState.turn);

              console.log('Updating game state...');
              updatePlayer(result.newPlayer);
              updateOpponent(result.newOpponent);
              updateBattleState(result.newBattleState);

              // The opponentTurn function already handles ending the turn, so we just need to draw player cards
              setTimeout(() => {
                const updatedState = gameStateRef.current;
                if (updatedState.battleState && updatedState.player) {
                  console.log('Drawing player initial cards after ambush...');
                  console.log('Current turn before drawing player cards:', updatedState.battleState.turn);
                  const playerDrawResult = drawCardsWithMinionEffects(
                    updatedState.battleState.playerDeck, 
                    updatedState.battleState.playerDiscardPile, 
                    3,
                    'player',
                    updatedState.player.class,
                    updatedState.currentOpponent?.name || ''
                  );
                  
                  const newBattleState = {
                    ...updatedState.battleState,
                    playerHand: playerDrawResult.drawnCards,
                    playerDeck: playerDrawResult.updatedDeck,
                    playerDiscardPile: playerDrawResult.updatedDiscardPile,
                    battleLog: [
                      ...updatedState.battleState.battleLog,
                      formatLogText('Player draws 3 cards...', updatedState.player.class, updatedState.currentOpponent?.name || ''),
                      ...playerDrawResult.minionDamageLog
                    ]
                  };
                  
                  updateBattleState(newBattleState);
                  console.log('✅ Player cards drawn after ambush turn - turn should now be player\'s');
                  console.log('Current turn after ambush:', newBattleState.turn);
                  console.log('=== OPPONENT TURN COMPLETED ===');
                }
              }, 1000);

              // Check for victory or defeat
              if (result.isVictory) {
                console.log('Victory detected!');
                handleVictory();
              } else if (result.isDefeat) {
                console.log('Defeat detected!');
                handleDefeat();
              }
            } catch (error) {
              console.error('❌ ERROR in GameEngine.opponentTurn:', error);
              console.error('Error details:', error);
            }
          } else {
            console.log('❌ Missing required state for opponent turn');
            console.log('currentStateAfterDraw.battleState:', currentStateAfterDraw.battleState);
            console.log('currentStateAfterDraw.player:', currentStateAfterDraw.player);
            console.log('currentStateAfterDraw.currentOpponent:', currentStateAfterDraw.currentOpponent);
          }
        }, 500); // Small delay to show the drawing happened
      }, 100); // Small delay to ensure state updates are processed
    });
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