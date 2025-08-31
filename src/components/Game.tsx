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
import MainMenuView from './game/shared/MainMenuView';
import { PathSplashScreen } from './game/shared/PathSplashScreen';
import { OpponentCardPreview } from './game/battle/OpponentCardPreview';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GamePhase, PlayerClass, Difficulty, Turn, Player, Opponent } from '@/types/game';
import { DarkForestPath, getOpponentsByDifficulty } from '@/content/modules/path';
import { DifficultyLevel, EncounterType } from '@/types/path';
import { OpponentAI } from '@/logic/game/OpponentAI';
import { playerClasses } from '@/data/gameData';
import { db } from '@/lib/db';

export default function Game() {
  // TUTTI GLI HOOK DEVONO ESSERE QUI, PRIMA DI QUALSIASI RETURN
  // Stato per splash, menu, selezione classe e path
  const [showSplash, setShowSplash] = React.useState(true);
  const [showMainMenu, setShowMainMenu] = React.useState(false);
  const [showClassSelection, setShowClassSelection] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState(DarkForestPath);
  const [showPathSplash, setShowPathSplash] = React.useState(false);

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

  // Tutte le callback e useCallback DOPO gli hook
  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowMainMenu(true);
  };
  const handleNewGame = () => {
    setShowMainMenu(false);
    setShowClassSelection(true);
  };
  const handleClassSelect = (playerClass: PlayerClass) => {
    try {
      dbg('🚀 handleClassSelect called with:', playerClass);
      // 1) Initialize the run (player only)
      const init = GameEngine.initRun(playerClass);
      updatePlayer(init.player);
      setSelectedClass(playerClass);
      setCurrentPath({ ...DarkForestPath });
      setShowClassSelection(false);
      // Salta la StartingSplashScreen dopo la selezione della classe
      setShowSplash(false);
      setShowMainMenu(false);
      setShowPathSplash(true);
    } catch (error) {
      console.error('❌ Error in handleClassSelect:', error);
    }
  };

  // Gestione view unica tramite variabile
  let view: React.ReactNode = null;
  if (showSplash) {
    view = <StartingSplashScreen isVisible={showSplash} onComplete={handleSplashComplete} />;
  } else if (showMainMenu) {
    view = <MainMenuView onNewGame={handleNewGame} />;
  } else if (showClassSelection) {
    view = (
      <ClassSelection
        onClassSelect={handleClassSelect}
        availableClasses={Object.keys(playerClasses) as PlayerClass[]}
      />
    );
  }
  


  // ...existing code...

  // (già dichiarato sopra per il main menu)

  const pickBattleEncounterByPathStep = (pathStep: number) => {
    // Trova un encounter di battaglia valido per questo step
    const battleEncounter = DarkForestPath.encounters.find(
      (e: any) => (e.type === 'battle' || e.type === EncounterType.BATTLE) && 
      e.pathStepMin === pathStep
    );

    if (!battleEncounter) throw new Error(`No battle encounter found for path step ${pathStep}`);

    // Prendi la difficoltà dell'encounter e scegli un avversario casuale
    const difficulty = battleEncounter.difficultyLevel || DifficultyLevel.D1;
    const opponents = getOpponentsByDifficulty(difficulty);
    if (!opponents.length) throw new Error(`No opponents found for difficulty ${difficulty}`);

    // Scegli un avversario casuale tra quelli disponibili
    const randomIndex = Math.floor(Math.random() * opponents.length);
    return opponents[randomIndex];
  };

  // Avvia la prima encounter dopo il tap sulla path splash
  const handlePathSplashComplete = async () => {
    setShowPathSplash(false);
    
    // Scegli il primo avversario (pathStep = 1)
    const opponent = pickBattleEncounterByPathStep(1);
    if (!opponent) throw new Error('Failed to pick opponent for first battle');

    // Crea la battaglia con l'opponent selezionato
    const { battleState } = GameEngine.createBattle(gameStateRef.current.player!, opponent);
    updateOpponent(opponent);
    updateBattleState(battleState);

    // Vai direttamente alla schermata di battaglia
    setGamePhase(GamePhase.BATTLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const st = gameStateRef.current;
      const p = st?.player;
      const o = st?.currentOpponent;
      const bs = st?.battleState;
      dbg('After starting first battle, state is:', st);
      dbg('Player:', p);
      dbg('Opponent:', o);
      dbg('BattleState:', bs);
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
        try { await playOpponentTurn(); } catch (e) { dbg('AI loop error:', e); }
      }
    } catch (e) {
      dbg('battleBegin error:', e as any);
    }
  };

  // Small helpers & timing constants
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const PREVIEW_DELAY = 800;
  const BETWEEN_CARDS_DELAY = 400;

  const startBattleWithSplash = async (player: Player, pathStep: number = 2) => {
    // Get next opponent from path
    const opponent = pickBattleEncounterByPathStep(pathStep);
    if (!opponent) {
      dbg('❌ Failed to pick opponent for next battle');
      return;
    }

    // Create the battle via centralized engine
    const {battleState} = GameEngine.createBattle(player!, opponent);
    if (!battleState) {
      dbg('❌ Failed to create battle state');
      return;
    }

    updatePlayer(player);
    updateOpponent(opponent);
    updateBattleState(battleState);

    // Vai direttamente alla schermata di battaglia
    setGamePhase(GamePhase.BATTLE);
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
        // Avvia l'AI in modo asincrono senza bloccare il render
        (async () => { try { await playOpponentTurn(); } catch (e) { dbg('AI loop error:', e); } })();
      }
    } catch (e) {
      dbg('battleBegin error:', e as any);
    }
  };

  // Funzione normale, non più useCallback
  async function playOpponentTurn() {
    const current = gameStateRef.current;
    if (!current.battleState || !current.player || !current.currentOpponent) return;

    // Local working copies
    let bs = { ...current.battleState };
    let pl = { ...current.player };
    let op = { ...current.currentOpponent };

    // Instantiate unified opponent AI
    const ai = new OpponentAI();
    let iters = 0;
    const MAX_ITERS = 50;

    while (iters++ < MAX_ITERS) {
      dbg('Opponent AI deciding plays...');
      dbg('Opponent energy:', bs.opponentEnergy);
      dbg('Opponent hand:', bs.opponentHand.map(c => c.name).join(', '));
      const plays = ai.decidePlays(bs.opponentHand, bs.opponentEnergy, bs, op, pl);
      if (!plays || plays.length === 0) break;

      dbg(`Opponent AI decided to play ${plays.length} card(s):`, plays.map(c => c.name).join(', '));

      // Always play cards one by one, recomputing after each play
      const card = plays[0];

      // Show preview for the chosen card, ensure it always clears
      try {
        updateOpponentCardPreview(card, true);
        await sleep(PREVIEW_DELAY);
      } finally {
        updateOpponentCardPreview(null, false);
      }

      // Snapshot to detect stalls
      const beforeEnergy = bs.opponentEnergy;
      const beforeHand = bs.opponentHand.length;

      // Execute the card through the shared engine path (OPPONENT side)
      const res = GameEngine.playCard(card, pl, op, bs);

      // Normalize and persist returned state
      bs = res.newBattleState ?? bs;
      pl = res.newPlayer ?? pl;
      op = res.newOpponent ?? op;

      updateBattleState(bs);
      updatePlayer(pl);
      updateOpponent(op);

      // If no progress was made (same energy and hand size), break to avoid infinite loop
      if (bs.opponentEnergy === beforeEnergy && bs.opponentHand.length === beforeHand) {
        dbg('No progress (opponent hand & energy unchanged) — breaking AI loop');
        break;
      }

      // Victory/defeat checks
      if (GameEngine.checkVictory(pl, op)) { handleVictory(); return; }
      if (GameEngine.checkDefeat(pl)) { handleDefeat(); return; }

      await sleep(BETWEEN_CARDS_DELAY);
    }

    dbg('Opponent AI turn complete after', iters, 'iterations');

    const newTurn = endTurn();

    dbg('After opponent turn, new turn is:', newTurn?.newBattleState.turn);

    startNextTurn(newTurn!);

    dbg('=== OPPONENT TURN COMPLETE ===');
  }

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

  const endTurn = () => {

    dbg('=== GAME COMPONENT END TURN DEBUG ===');
    dbg('Current game state at endTurn:', gameStateRef);
    if (!gameStateRef.current.battleState || !gameStateRef.current.player || !gameStateRef.current.currentOpponent) return;
    dbg('Current turn:', gameStateRef.current.battleState.turn);

    const { newBattleState, newPlayer, newOpponent, isOpponentTurn } = GameEngine.endTurn(
      gameStateRef.current.battleState,
      gameStateRef.current.player,
      gameStateRef.current.currentOpponent
    );

    dbg('After endTurn, new turn:', newBattleState.turn);

    updateBattleState(newBattleState);
    updatePlayer(newPlayer);
    updateOpponent(newOpponent);

    return { newBattleState, newPlayer, newOpponent, isOpponentTurn };

  }

  const startNextTurn = (newTurn: any) => {
    if (newTurn.newBattleState.turn === Turn.OPPONENT) {
      // Replenish opponent energy to max before start-of-turn triggers
      try {
        const bsWithEnergy = { ...newTurn.newBattleState } as any;
        const opp = newTurn.newOpponent as Opponent;
        const maxOppEnergy = opp.maxEnergy;
  
        if (typeof maxOppEnergy === 'number' && Number.isFinite(maxOppEnergy)) {
          bsWithEnergy.opponentEnergy = maxOppEnergy;
          dbg('Replenished opponent energy to', maxOppEnergy);
          updateBattleState(bsWithEnergy);
        }
  
        const started = GameEngine.startTurn?.(
          'opponent',
          newTurn.newPlayer,
          newTurn.newOpponent,
          bsWithEnergy
        );
        if (started?.battleState) {
          updateBattleState(started.battleState);
          updatePlayer(started.player ?? newTurn.newPlayer);
          updateOpponent(started.opponent ?? newTurn.newOpponent);
        }
      } catch (err) {
        dbg('startTurn(opponent) after player endTurn failed:', err as any);
      }
      setTimeout(() => {
        playOpponentTurn();
      }, 300);
    } else {
      // Replenish player energy to max before start-of-turn triggers
      try {
        const bsWithEnergy = { ...newTurn.newBattleState } as any;
        const ply = newTurn.newPlayer as Player;
        const maxPlayerEnergy = ply.maxEnergy;
  
        if (typeof maxPlayerEnergy === 'number' && Number.isFinite(maxPlayerEnergy)) {
          bsWithEnergy.playerEnergy = maxPlayerEnergy;
          dbg('Replenished player energy to', maxPlayerEnergy);
          updateBattleState(bsWithEnergy);
        }
  
        const started = GameEngine.startTurn?.(
          'player',
          newTurn.newPlayer,
          newTurn.newOpponent,
          bsWithEnergy
        );
        if (started?.battleState) {
          updateBattleState(started.battleState);
          updatePlayer(started.player ?? newTurn.newPlayer);
          updateOpponent(started.opponent ?? newTurn.newOpponent);
        }
      } catch (err) {
        dbg('startTurn(player) after opponent endTurn failed:', err as any);
      }
    }
  };
  

  const handleEndTurn = async () => {
    dbg('handleEndTurn called');

    const newTurn = endTurn();
    startNextTurn(newTurn!);

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

    // Start the next battle using next path step
    startBattleWithSplash(newPlayer, 2);
  };

  const handlePassiveSelect = (passive: any) => {
    if (!gameState.player) return;

    const { newPlayer, availableCards } = GameEngine.selectPassive(gameState.player, passive);

    updatePlayer(newPlayer);
    setGamePhase(GamePhase.CARD_SELECTION);
    setAvailableCards(availableCards);
    setAvailablePassives([]);

    setSelectedPassive(null);

    // Start the next battle using next path step
    startBattleWithSplash(newPlayer, 2);
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
    return GameEngine.canPlayCard(card, gameState.battleState);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 max-w-[720px]">
        {/* View condizionale splash/menu/class selection */}
        {view}

        {/* Path Splash Screen */}
        {showPathSplash && (
          <PathSplashScreen
            isVisible={showPathSplash}
            thumbnail={DarkForestPath.thumbnail}
            title={DarkForestPath.description}
            subtitle={DarkForestPath.subtitle}
            onComplete={handlePathSplashComplete}
          />
        )}

        {/* Splash Screen (battle) */}
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