'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Player, Opponent, GameState, PlayerClass, BattleState, CardType } from '@/types/game';
import { createPlayer, getRandomOpponent, initializeBattle, playCard, opponentPlayCard, endTurn, getRandomCards, getRandomPassives, replaceCardInDeck, checkVictory, checkDefeat, drawCardsWithReshuffle, getCardCost, canPlayCard as canPlayCardUtil } from '@/lib/gameUtils';
import { Button } from '@/components/ui/button';
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, Shield, Zap, Crown, Skull, Swords, TrendingDown, AlertTriangle, TrendingUp, Target, Archive, Layers, Star, Zap as Bolt, Hand } from 'lucide-react';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>({
    player: null,
    currentOpponent: null,
    gamePhase: 'class-selection',
    availableCards: [],
    availablePassives: [],
    battleState: null
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedReplaceCard, setSelectedReplaceCard] = useState<string | null>(null);
  const [selectedPassive, setSelectedPassive] = useState<string | null>(null);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const [splashOpponent, setSplashOpponent] = useState<Opponent | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Add useEffect to monitor game state changes
  useEffect(() => {
    console.log('Game state changed:', gameState);
    console.log('Current game phase:', gameState.gamePhase);
  }, [gameState]);

  const showBattleSplash = (opponent: Opponent) => {
    setSplashOpponent(opponent);
    setShowSplashScreen(true);
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setShowSplashScreen(false);
      setSplashOpponent(null);
    }, 2000);
  };

  const handleClassSelect = (playerClass: PlayerClass) => {
    console.log('handleClassSelect called with:', playerClass);
    try {
      const player = createPlayer(playerClass);
      console.log('Player created:', player);
      console.log('Player level:', player.level);
      
      const opponent = getRandomOpponent('basic');
      console.log('Opponent created:', opponent);
      console.log('Opponent difficulty:', opponent.difficulty);
      console.log('Opponent name:', opponent.name);
      
      const battleState = initializeBattle(player, opponent);
      console.log('Battle state created:', battleState);

      // Draw 3 cards for player's first turn using proper draw mechanics
      const updatedBattleState = { ...battleState };
      const drawResult = drawCardsWithReshuffle(
        updatedBattleState.playerDeck, 
        updatedBattleState.playerDiscardPile, 
        3
      );
      updatedBattleState.playerHand = drawResult.drawnCards;
      updatedBattleState.playerDeck = drawResult.updatedDeck;
      updatedBattleState.playerDiscardPile = drawResult.updatedDiscardPile;

      const newGameState = {
        player,
        currentOpponent: opponent,
        gamePhase: 'battle' as const,
        availableCards: [],
        availablePassives: [],
        battleState: updatedBattleState
      };
      
      console.log('About to set game state to:', newGameState);
      console.log('Opponent in new game state:', newGameState.currentOpponent);
      console.log('Opponent difficulty in new game state:', newGameState.currentOpponent?.difficulty);
      
      setGameState(newGameState);
      setSelectedClass(playerClass);
      
      // Show splash screen
      showBattleSplash(opponent);
      
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

  const handleCardPlay = (card: Card) => {
    if (!gameState.player || !gameState.currentOpponent || !gameState.battleState) return;

    const result = playCard(card, gameState.player, gameState.currentOpponent, gameState.battleState);
    
    const newBattleState = {
      ...result.newBattleState,
      battleLog: [...result.newBattleState.battleLog, ...result.log]
    };

    setGameState(prev => ({
      ...prev,
      player: result.newPlayer,
      currentOpponent: result.newOpponent,
      battleState: newBattleState
    }));

    // Check for victory or defeat
    if (checkVictory(result.newPlayer, result.newOpponent)) {
      handleVictory();
    } else if (checkDefeat(result.newPlayer)) {
      handleDefeat();
    }
  };

  const handleEndTurn = () => {
    console.log('handleEndTurn called');
    if (!gameState.battleState || !gameState.player || !gameState.currentOpponent) return;

    let newBattleState = endTurn(gameState.battleState);
    console.log('After endTurn, new turn:', newBattleState.turn);
    
    if (newBattleState.turn === 'opponent') {
      console.log('Setting up opponent turn...');
      // First, update the state to show it's opponent's turn
      setGameState(prev => ({
        ...prev,
        battleState: newBattleState
      }));

      // Then, after a short delay, have the opponent play their card
      console.log('Setting timeout for opponent play...');
      setTimeout(() => {
        console.log('Timeout callback executed');
        // Use the ref to get the current state
        const currentState = gameStateRef.current;
        console.log('Current state from ref:', currentState);
        if (!currentState.battleState || !currentState.player || !currentState.currentOpponent) {
          console.log('Missing required state, returning');
          return;
        }

        console.log('Calling opponentPlayCard...');
        const result = opponentPlayCard(currentState.currentOpponent, currentState.player, currentState.battleState);
        console.log('opponentPlayCard result:', result);
        
        let updatedBattleState = {
          ...result.newBattleState,
          battleLog: [...result.newBattleState.battleLog, ...result.log]
        };

        // After opponent plays, automatically end their turn and go back to player
        console.log('Ending opponent turn...');
        updatedBattleState = endTurn(updatedBattleState);
        console.log('After ending opponent turn, new turn:', updatedBattleState.turn);

        console.log('Updating game state...');
        setGameState(prev => ({
          ...prev,
          player: result.newPlayer,
          currentOpponent: result.newOpponent,
          battleState: updatedBattleState
        }));

        // Check for victory or defeat
        if (checkVictory(result.newPlayer, result.newOpponent)) {
          console.log('Victory detected!');
          handleVictory();
        } else if (checkDefeat(result.newPlayer)) {
          console.log('Defeat detected!');
          handleDefeat();
        }
      }, 1000); // 1 second delay for better UX
    } else {
      console.log('Player turn, updating battle state');
      setGameState(prev => ({
        ...prev,
        battleState: newBattleState
      }));
    }
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

  const handleCardSelect = (card: Card) => {
    if (!gameState.player || !selectedReplaceCard) return;

    const newPlayer = replaceCardInDeck(gameState.player, selectedReplaceCard, card);
    
    // Get next opponent based on the current player level (from game state, not newPlayer)
    let difficulty: 'basic' | 'medium' | 'boss';
    if (gameState.player.level === 2) {
      difficulty = 'medium';      // After beating level 1 (now level 2), fight medium opponent
    } else if (gameState.player.level === 3) {
      difficulty = 'boss';        // After beating level 2 (now level 3), fight boss opponent
    } else {
      difficulty = 'boss';        // fallback
    }
    
    console.log(`Player level: ${gameState.player.level}, selecting opponent difficulty: ${difficulty}`);
    
    const opponent = getRandomOpponent(difficulty);
    const battleState = initializeBattle(newPlayer, opponent);
    
    // Draw 3 cards for player's first turn using proper draw mechanics
    const updatedBattleState = { ...battleState };
    const drawResult = drawCardsWithReshuffle(
      updatedBattleState.playerDeck, 
      updatedBattleState.playerDiscardPile, 
      3
    );
    updatedBattleState.playerHand = drawResult.drawnCards;
    updatedBattleState.playerDeck = drawResult.updatedDeck;
    updatedBattleState.playerDiscardPile = drawResult.updatedDiscardPile;

    setGameState(prev => ({
      ...prev,
      player: newPlayer,
      currentOpponent: opponent,
      gamePhase: 'battle',
      battleState: updatedBattleState,
      availableCards: [],
      availablePassives: []
    }));

    setSelectedCard(null);
    setSelectedReplaceCard(null);
    
    // Show splash screen
    showBattleSplash(opponent);
  };

  const handlePassiveSelect = (passive: any) => {
    if (!gameState.player) return;

    const newPlayer = {
      ...gameState.player,
      passives: [...gameState.player.passives, passive]
    };

    const availableCards = getRandomCards(gameState.player.class, 3);

    setGameState(prev => ({
      ...prev,
      player: newPlayer,
      gamePhase: 'card-selection',
      availableCards,
      availablePassives: []
    }));

    setSelectedPassive(null);
  };

  const handleRestart = () => {
    setGameState({
      player: null,
      currentOpponent: null,
      gamePhase: 'class-selection',
      availableCards: [],
      availablePassives: [],
      battleState: null
    });
    setSelectedClass(null);
    setSelectedCard(null);
    setSelectedReplaceCard(null);
    setSelectedPassive(null);
  };

  // Add portrait mappings
  const playerPortraits = {
    warrior: "https://i.imgur.com/UDCcD6u.png",
    rogue: "https://i.imgur.com/dR6vXfK.png",
    wizard: "https://i.imgur.com/ti7tvRs.png"
  };

  const opponentPortraits = {
    'goblin Warrior': "https://i.imgur.com/oC9kaes.png",
    'alpha Wolf': "https://i.imgur.com/By58IEi.png",
    'skeleton Lord': "https://i.imgur.com/k14VZr1.png",
    'bandit Leader': "https://i.imgur.com/VmoKR49.png",
    'ancient Dragon': "https://i.imgur.com/701zzec.png",
    'lich King': "https://i.imgur.com/tGEbCEd.png"
  };

  const renderClassSelection = () => (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold text-center game-title">Choose Your Class</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['warrior', 'rogue', 'wizard'] as PlayerClass[]).map((playerClass) => (
          <button
            key={playerClass}
            onClick={() => {
              if (playerClass === 'warrior') {
                console.log('Button clicked for:', playerClass);
                handleClassSelect(playerClass);
              }
            }}
            disabled={playerClass !== 'warrior'}
            className={`p-4 border-2 rounded-lg transition-colors ${
              playerClass === 'warrior' 
                ? 'border-amber-700 hover:border-amber-800 hover:bg-amber-100 cursor-pointer' 
                : 'border-amber-400 bg-background opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              {/* Class Portrait */}
              <div className="mb-4 flex justify-center">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-background flex items-center justify-center">
                  {playerClass === 'warrior' && (
                    <img 
                      src="https://i.imgur.com/UDCcD6u.png" 
                      alt="Warrior Portrait" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Swords className="w-16 h-16" /></div>';
                      }}
                    />
                  )}
                  {playerClass === 'rogue' && (
                    <img 
                      src="https://i.imgur.com/dR6vXfK.png" 
                      alt="Rogue Portrait" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Skull className="w-16 h-16" /></div>';
                      }}
                    />
                  )}
                  {playerClass === 'wizard' && (
                    <img 
                      src="https://i.imgur.com/ti7tvRs.png" 
                      alt="Wizard Portrait" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Zap className="w-16 h-16" /></div>';
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="capitalize flex items-center justify-center gap-2 text-xl font-bold mb-2">
                {playerClass === 'warrior' && <Swords className="w-6 h-6" />}
                {playerClass === 'rogue' && <Skull className="w-6 h-6" />}
                {playerClass === 'wizard' && <Zap className="w-6 h-6" />}
                {playerClass}
                {playerClass !== 'warrior' && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Coming soon</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {playerClass === 'warrior' && 'Master of combat and defense'}
                {playerClass === 'rogue' && 'Swift and deadly assassin'}
                {playerClass === 'wizard' && 'Wielder of arcane powers'}
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold card-title">Starting Cards:</h4>
                <div className="space-y-1">
                  <div className="text-sm">• Strike - Deal 6 damage</div>
                  <div className="text-sm">• Defend - Gain 5 block</div>
                  <div className="text-sm">• {playerClass === 'warrior' && 'Bash - Deal 8 damage'}
                    {playerClass === 'rogue' && 'Backstab - Deal 10 damage'}
                    {playerClass === 'wizard' && 'Zap - Deal 8 damage'}
                  </div>
                </div>
              </div>
              {playerClass !== 'warrior' && (
                <div className="mt-4 text-xs text-red-600 font-semibold">
                  This class is not available yet
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="text-center text-sm text-muted-foreground mt-4">
        Currently only Warrior class is available. More classes coming soon!
      </div>
    </div>
  );

  const renderBattle = () => {
    if (!gameState.player || !gameState.currentOpponent || !gameState.battleState) return null;

    const { player, currentOpponent, battleState } = gameState;

    return (
      <div className="space-y-6">
        {/* Battle Header */}
        <div className="flex flex-row justify-between items-start w-full">
          {/* Player Stats - Left Aligned */}
          <div className="text-left">
            {/* Player Portrait */}
            <div className="mb-2 flex justify-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center">
                <img 
                  src={playerPortraits[player.class]} 
                  alt={`${player.class} Portrait`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallbackIcon = player.class === 'warrior' ? <Swords className="w-8 h-8" /> : 
                                       player.class === 'rogue' ? <Skull className="w-8 h-8" /> : 
                                       <Zap className="w-8 h-8" />;
                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400"></div>`;
                  }}
                />
              </div>
            </div>
            <div className="font-semibold card-title capitalize flex items-center gap-2">
              {player.class === 'warrior' && <Swords className="w-5 h-5" />}
              {player.class === 'rogue' && <Skull className="w-5 h-5" />}
              {player.class === 'wizard' && <Zap className="w-5 h-5" />}
              {player.class}
              <Badge variant="outline" className="text-xs">Level {player.level}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span>{player.health}/{player.maxHealth}</span>
            </div>
            <Progress value={(player.health / player.maxHealth) * 100} className="w-24" />
            {battleState.playerBlock > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600">{battleState.playerBlock} Block</span>
              </div>
            )}
            {renderStatusEffects(battleState.playerStatusEffects, true, "Player Effects")}
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: battleState.playerEnergy }, (_, i) => (
                <Zap key={i} className="w-4 h-4 text-blue-500" />
              ))}
            </div>
          </div>

          {/* VS - Center */}
          <div className="text-2xl font-bold fantasy-text flex items-center">Vs</div>

          {/* Monster Stats - Right Aligned */}
          <div className="text-right">
            {/* Opponent Portrait */}
            <div className="mb-2 flex justify-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center">
                <img 
                  src={opponentPortraits[currentOpponent.name as keyof typeof opponentPortraits]} 
                  alt={`${currentOpponent.name} Portrait`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Skull className="w-8 h-8" /></div>';
                  }}
                />
              </div>
            </div>
            <div className="font-semibold card-title">{currentOpponent.name}</div>
            <div className="flex items-center justify-end gap-2">
              <span>{currentOpponent.health}/{currentOpponent.maxHealth}</span>
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <Progress value={(currentOpponent.health / currentOpponent.maxHealth) * 100} className="w-24 ml-auto" />
            {battleState.opponentBlock > 0 && (
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-sm text-blue-600">{battleState.opponentBlock} Block</span>
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
            )}
            {renderStatusEffects(battleState.opponentStatusEffects, false)}
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="w-full bg-muted border border-border rounded-lg p-4">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm font-medium">
              {battleState.turn === 'player' ? 'Your turn - Play cards!' : `${currentOpponent.name}'s turn`}
            </div>
            <div className="flex gap-2">
              <Dialog open={showDeckModal} onOpenChange={setShowDeckModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Deck ({battleState.playerDeck.cards.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Your Deck</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{battleState.playerDeck.cards.length} cards remaining</p>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {battleState.playerDeck.cards.map((card, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded">
                          {card.name} ({card.cost}) - {card.effect}
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showDiscardModal} onOpenChange={setShowDiscardModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    Discard ({battleState.playerDiscardPile.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Your Discard Pile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{battleState.playerDiscardPile.length} cards discarded</p>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {battleState.playerDiscardPile.map((card, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded">
                          {card.name} ({card.cost}) - {card.effect}
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-muted p-4 rounded-lg max-h-32 overflow-y-auto">
          {battleState.battleLog.slice(-5).map((log, index) => (
            <div key={index} className="text-sm">{log}</div>
          ))}
        </div>

        {/* Player Hand */}
        <div>
          <h3 className="text-lg font-semibold card-title mb-4">Your Hand ({battleState.playerHand.length}/5)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {battleState.playerHand.map((card, index) => (
              <CardComponent 
                key={index} 
                className={`cursor-pointer hover:shadow-md transition-all ${
                  !canPlayCardUtil(card, player, battleState.playerEnergy) ? 'opacity-50' : ''
                } ${battleState.turn === 'player' ? 'hover:scale-105' : ''}`}
                onClick={() => battleState.turn === 'player' && canPlayCardUtil(card, player, battleState.playerEnergy) && handleCardPlay(card)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm">{card.name}</CardTitle>
                    {renderEnergyCost(card.cost, card, player)}
                  </div>
                </CardHeader>
                <CardContent>
                  {renderCardTypes(card.types)}
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                </CardContent>
              </CardComponent>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={handleEndTurn} 
            disabled={battleState.turn !== 'player'}
            variant={battleState.turn === 'player' ? 'default' : 'secondary'}
          >
            {battleState.turn === 'player' ? 'End Turn' : 'Opponent Turn...'}
          </Button>
        </div>
      </div>
    );
  };

  const renderCardSelection = () => {
    if (!gameState.player) return null;

    const uniqueCards = Array.from(new Set(gameState.player.deck.cards.map(card => card.id)))
      .map(id => gameState.player!.deck.cards.find(card => card.id === id)!);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold game-title">Choose a New Card</h2>
          <p className="text-muted-foreground mt-2">Select a new card to add to your deck</p>
        </div>
        
        {/* Available Cards */}
        <div>
          <h3 className="text-lg font-semibold card-title mb-4">Available Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameState.availableCards.map((card, index) => (
              <CardComponent 
                key={index} 
                className={`cursor-pointer hover:shadow-md transition-all ${
                  selectedCard === card.id ? 'ring-2 ring-primary scale-105' : ''
                }`}
                onClick={() => setSelectedCard(card.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {card.name}
                      {renderCardTypes(card.types)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {renderEnergyCost(card.cost)}
                      <Badge variant={card.rarity === 'rare' ? 'default' : 'secondary'}>
                        {card.rarity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-3">{card.description}</CardDescription>
                  {card.effect && (
                    <div className="text-xs text-muted-foreground italic">
                      Effect: {card.effect}
                    </div>
                  )}
                </CardContent>
              </CardComponent>
            ))}
          </div>
        </div>

        {/* Current Deck - Cards to Replace */}
        {selectedCard && (
          <div>
            <h3 className="text-lg font-semibold card-title mb-4">Choose Card to Replace</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select one of your current cards to replace. All 3 copies will be removed.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {uniqueCards.map((card, index) => (
                <CardComponent 
                  key={index} 
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    selectedReplaceCard === card.id ? 'ring-2 ring-destructive scale-105' : ''
                  }`}
                  onClick={() => setSelectedReplaceCard(card.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      {renderEnergyCost(card.cost)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">{card.description}</CardDescription>
                    {card.effect && (
                      <div className="text-xs text-muted-foreground italic">
                        Effect: {card.effect}
                      </div>
                    )}
                  </CardContent>
                </CardComponent>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {selectedCard && selectedReplaceCard && (
          <div className="flex justify-center">
            <Button 
              onClick={() => {
                const card = gameState.availableCards.find(c => c.id === selectedCard);
                if (card) handleCardSelect(card);
              }}
              size="lg"
            >
              Confirm Selection
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderPassiveSelection = () => {
    if (!gameState.player) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold game-title">Choose a Passive Ability</h2>
          <p className="text-muted-foreground mt-2">
            Select a permanent passive ability that will enhance your deck
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameState.availablePassives.map((passive, index) => (
            <CardComponent 
              key={index} 
              className={`cursor-pointer hover:shadow-md transition-all ${
                selectedPassive === passive.id ? 'ring-2 ring-primary scale-105' : ''
              }`}
              onClick={() => setSelectedPassive(passive.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  {passive.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-3">{passive.description}</CardDescription>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {passive.class}
                  </Badge>
                  <Badge variant="secondary">Passive</Badge>
                </div>
              </CardContent>
            </CardComponent>
          ))}
        </div>

        {selectedPassive && (
          <div className="flex justify-center">
            <Button 
              onClick={() => {
                const passive = gameState.availablePassives.find(p => p.id === selectedPassive);
                if (passive) handlePassiveSelect(passive);
              }}
              size="lg"
            >
              Confirm Selection
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderVictory = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <h1 className="text-4xl font-bold game-title">Victory!</h1>
      <p className="text-xl">Congratulations! You have conquered all challenges!</p>
      <Button onClick={handleRestart} size="lg">
        Play Again
      </Button>
    </div>
  );

  const renderDefeat = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl">💀</div>
      <h1 className="text-4xl font-bold game-title">Defeat</h1>
      <p className="text-xl">You have been defeated. Better luck next time!</p>
      <Button onClick={handleRestart} size="lg">
        Try Again
      </Button>
    </div>
  );

  const renderStatusEffects = (effects: any[], showTitle: boolean = true, title?: string) => {
    if (effects.length === 0) return null;

    return (
      <div className="mt-2">
        {showTitle && title && (
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">{title}</h4>
        )}
        <div className="flex flex-wrap gap-1">
          {effects.map((effect, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {effect.type === 'weak' && <TrendingDown className="w-3 h-3 mr-1" />}
              {effect.type === 'vulnerable' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {effect.type === 'strength' && <TrendingUp className="w-3 h-3 mr-1" />}
              {effect.type === 'dexterity' && <Target className="w-3 h-3 mr-1" />}
              {effect.type} {effect.value} ({effect.duration - 1})
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderCardTypes = (types: CardType[] | undefined) => {
    if (!types || types.length === 0) return null;

    const getTypeColor = (type: CardType) => {
      switch (type) {
        case CardType.MELEE:
          return 'bg-red-800 text-red-100 border-red-900';
        case CardType.ATTACK:
          return 'bg-orange-800 text-orange-100 border-orange-900';
        case CardType.SKILL:
          return 'bg-blue-800 text-blue-100 border-blue-900';
        case CardType.POWER:
          return 'bg-purple-800 text-purple-100 border-purple-900';
        case CardType.CURSE:
          return 'bg-amber-800 text-amber-100 border-amber-900';
        default:
          return 'bg-amber-800 text-amber-100 border-amber-900';
      }
    };

    const getTypeIcon = (type: CardType) => {
      switch (type) {
        case CardType.MELEE:
          return <Hand className="w-3 h-3" />;
        case CardType.ATTACK:
          return <Swords className="w-3 h-3" />;
        case CardType.SKILL:
          return <Star className="w-3 h-3" />;
        case CardType.POWER:
          return <Crown className="w-3 h-3" />;
        case CardType.CURSE:
          return <Skull className="w-3 h-3" />;
        default:
          return null;
      }
    };

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {types.map((type, index) => (
          <Tooltip key={index}>
            <TooltipTrigger>
              <div className={`p-1 rounded ${getTypeColor(type)} cursor-help`}>
                {getTypeIcon(type)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="capitalize">{type}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  };

  const renderEnergyCost = (cost: number, card?: Card, player?: Player) => {
    // If card and player are provided, calculate the discounted cost
    const actualCost = card && player ? getCardCost(card, player) : cost;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: actualCost }, (_, i) => (
          <Zap key={i} className="w-3 h-3 text-blue-500" />
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Splash Screen */}
        {showSplashScreen && splashOpponent && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-500">
            <div className="text-center space-y-6">
              {/* Opponent Portrait */}
              <div className="flex justify-center">
                <div className="w-48 h-48 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center border-4 border-amber-700">
                  <img 
                    src={opponentPortraits[splashOpponent.name]} 
                    alt={`${splashOpponent.name} Portrait`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Skull className="w-24 h-24" /></div>';
                    }}
                  />
                </div>
              </div>
              
              {/* Opponent Name */}
              <h1 className="text-4xl font-bold game-title text-amber-100">
                {splashOpponent.name}
              </h1>
              
              {/* Difficulty Level */}
              <div className="flex justify-center">
                <Badge 
                  variant="outline" 
                  className={`
                    text-lg px-6 py-3 border-2 font-bold
                    ${splashOpponent.difficulty === 'basic' ? 'border-green-500 text-green-300' : ''}
                    ${splashOpponent.difficulty === 'medium' ? 'border-yellow-500 text-yellow-300' : ''}
                    ${splashOpponent.difficulty === 'boss' ? 'border-red-500 text-red-300' : ''}
                  `}
                >
                  {splashOpponent.difficulty === 'basic' && 'EASY'}
                  {splashOpponent.difficulty === 'medium' && 'MEDIUM'}
                  {splashOpponent.difficulty === 'boss' && 'BOSS'}
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        {gameState.gamePhase === 'class-selection' && renderClassSelection()}
        {gameState.gamePhase === 'battle' && renderBattle()}
        {gameState.gamePhase === 'card-selection' && renderCardSelection()}
        {gameState.gamePhase === 'passive-selection' && renderPassiveSelection()}
        {gameState.gamePhase === 'victory' && renderVictory()}
        {gameState.gamePhase === 'defeat' && renderDefeat()}
      </div>
    </TooltipProvider>
  );
}