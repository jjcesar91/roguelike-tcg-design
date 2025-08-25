'use client';

import React, { useCallback } from 'react';
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
import { GamePhase, PlayerClass, Difficulty, Turn } from '@/types/game';
import { OpponentAI } from '@/logic/game/OpponentAI';
import { playerClasses } from '@/data/gameData';

export default function Game() {
  const {
    gameState,
    gameStateRef,
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

  // Small helpers & timing constants
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const PREVIEW_DELAY = 800;
  const BETWEEN_CARDS_DELAY = 400;

  const startBattleWithSplash = (difficulty?: Difficulty) => {
    // Create the battle via centralized engine and use the returned values
    const { player, opponent, battleState} = GameEngine.createBattle(gameStateRef.current.player!, difficulty);

    if (!opponent || !battleState) {
      dbg('❌ After createBattle, opponent/battleState missing');
      return;
    }

    updatePlayer(player);
    updateOpponent(opponent);
    updateBattleState(battleState);

    showBattleSplash(opponent, async () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const st = gameStateRef.current;
        const p = st?.player;
        const o = st?.currentOpponent;
        const bs = st?.battleState;
        if (!p || !o || !bs) return;

        // Re-read state after engine hooks
        const turn = st.battleState?.turn;

        // Start-of-turn pipeline for the side who begins
        if (turn === Turn.OPPONENT || turn === Turn.PLAYER) {
          const side = turn === Turn.OPPONENT ? 'opponent' : 'player';
          try {
            const started = GameEngine.startTurn?.(side, st.player!, st.currentOpponent!, st.battleState!);
            if (started?.battleState) {
              updateBattleState(started.battleState);
              updatePlayer(started.player ?? st.player!);
              updateOpponent(started.opponent ?? st.currentOpponent!);
            }
          } catch (err) {
            dbg(`startTurn(${side}) at battle begin failed:`, err as any);
          }
        }

        // If opponent starts, immediately trigger AI loop
        if (turn === Turn.OPPONENT) {
          dbg('Opponent starts — triggering AI turn');
          playOpponentTurn();
        }
      } catch (e) {
        dbg('battleBegin error:', e as any);
      }
    });
  };

  const handleClassSelect = (playerClass: PlayerClass) => {
    try {
      dbg('🚀 handleClassSelect called with:', playerClass);

      // 1) Initialize the run (player only)
      const init = GameEngine.initRun(playerClass);
      updatePlayer(init.player);
      setSelectedClass(playerClass);

      // 2) Start the first battle at BASIC difficulty via centralized flow
      startBattleWithSplash(Difficulty.BASIC);
    } catch (error) {
      console.error('❌ Error in handleClassSelect:', error);
    }
  };

  // Simplified, sequential opponent turn without nested setTimeout chains
  const playOpponentTurn = useCallback(async () => {
    const current = gameStateRef.current;
    if (!current.battleState || !current.player || !current.currentOpponent) return;

    // Local working copies
    let bs = { ...current.battleState };
    let pl = { ...current.player };
    let op = { ...current.currentOpponent };

    // Instantiate unified opponent AI
    const ai = new OpponentAI();

    // Loop until no playable cards
    while (true) {
      const plays = ai.decidePlays(bs.opponentHand, bs.opponentEnergy, bs, op, pl);
      if (!plays || plays.length === 0) break;

      // Always play cards one by one, recomputing after each play
      const card = plays[0];

      // Show preview for the chosen card
      updateOpponentCardPreview(card, true);
      await sleep(PREVIEW_DELAY);
      updateOpponentCardPreview(null, false);

      // Execute the card through the shared engine path
      const res = GameEngine.playCard(card, pl, op, bs);

      // Normalize and persist returned state
      bs = res.newBattleState ?? bs;
      pl = res.newPlayer ?? pl;
      op = res.newOpponent ?? op;

      updateBattleState(bs);
      updatePlayer(pl);
      updateOpponent(op);

      // Victory/defeat checks
      if (GameEngine.checkVictory(pl, op)) { handleVictory(); return; }
      if (GameEngine.checkDefeat(pl)) { handleDefeat(); return; }

      await sleep(BETWEEN_CARDS_DELAY);
    }

    // End opponent turn when no cards are left to play
    const end = await GameEngine.endTurn(bs, pl, op);
    bs = end.newBattleState;
    pl = end.newPlayer;
    op = end.newOpponent;
    updateBattleState(bs);
    updatePlayer(pl);
    updateOpponent(op);

    // Immediately start the player's next turn (no extra draws elsewhere).
    try {
      const startedNext = await (GameEngine as any).startTurn?.('player', pl, op, bs);
      if (startedNext && startedNext.battleState) {
        bs = startedNext.battleState;
        pl = startedNext.player ?? pl;
        op = startedNext.opponent ?? op;
        updateBattleState(bs);
        updatePlayer(pl);
        updateOpponent(op);
      }
    } catch (err) {
      dbg('startTurn(player) after opponent endTurn failed:', err as any);
    }
  }, [gameStateRef, updateBattleState, updateOpponent, updateOpponentCardPreview, updatePlayer, handleVictory, handleDefeat]);

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

  const handleEndTurn = async () => {
    dbg('handleEndTurn called');
    if (!gameState.battleState || !gameState.player || !gameState.currentOpponent) return;

    const { newBattleState, newPlayer, newOpponent, isOpponentTurn } = await GameEngine.endTurn(
      gameState.battleState,
      gameState.player,
      gameState.currentOpponent
    );

    dbg('After endTurn, new turn:', newBattleState.turn);

    updateBattleState(newBattleState);
    updatePlayer(newPlayer);
    updateOpponent(newOpponent);

    if (isOpponentTurn) {
      // Prepare the opponent's start-of-turn (draws + triggers), then run the AI loop.
      try {
        const started = await (GameEngine as any).startTurn?.('opponent', newPlayer, newOpponent, newBattleState);
        if (started && started.battleState) {
          updateBattleState(started.battleState);
          updatePlayer(started.player ?? newPlayer);
          updateOpponent(started.opponent ?? newOpponent);
        }
      } catch (err) {
        dbg('startTurn(opponent) after player endTurn failed:', err as any);
      }
      setTimeout(() => {
        playOpponentTurn();
      }, 300);
    }
  };

  const handleCardSelect = (card: any) => {
    if (!gameState.player || !selectedReplaceCard) return;

    const { newPlayer } = GameEngine.selectCard(
      card,
      gameState.player,
      selectedReplaceCard
    );

    updatePlayer(newPlayer);

    setAvailableCards([]);
    setAvailablePassives([]);

    setSelectedCard(null);
    setSelectedReplaceCard(null);

    // Start the next battle using centralized flow (difficulty inferred from state)
    startBattleWithSplash();
  };

  const handlePassiveSelect = (passive: any) => {
    if (!gameState.player) return;

    const { newPlayer, availableCards } = GameEngine.selectPassive(gameState.player, passive);

    updatePlayer(newPlayer);
    setGamePhase(GamePhase.CARD_SELECTION);
    setAvailableCards(availableCards);
    setAvailablePassives([]);

    setSelectedPassive(null);

    // Start the next battle using centralized flow (difficulty inferred from state)
    startBattleWithSplash();
  };

  const handleRestart = () => {
    restartGame();
    resetSelections();
  };

  const handleStartingSplashComplete = () => {
    setGamePhase(GamePhase.CLASS_SELECTION);
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
          isVisible={gameState.gamePhase === GamePhase.STARTING_SPLASH}
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
        {gameState.gamePhase === GamePhase.CLASS_SELECTION && (
          <ClassSelection
            onClassSelect={handleClassSelect}
            availableClasses={Object.keys(playerClasses) as PlayerClass[]}
          />
        )}

        {gameState.gamePhase === GamePhase.BATTLE && gameState.player && gameState.currentOpponent && gameState.battleState && (
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

        {gameState.gamePhase === GamePhase.CARD_SELECTION && gameState.player && (
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

        {gameState.gamePhase === GamePhase.PASSIVE_SELECTION && gameState.player && (
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

        {gameState.gamePhase === GamePhase.VICTORY && (
          <VictoryScreen onRestart={handleRestart} />
        )}

        {gameState.gamePhase === GamePhase.DEFEAT && (
          <DefeatScreen onRestart={handleRestart} />
        )}
      </div>
    </TooltipProvider>
  );
}