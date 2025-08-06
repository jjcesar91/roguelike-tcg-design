'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Player, Opponent, GameState, PlayerClass, BattleState } from '@/types/game';
import { createPlayer, getRandomOpponent, initializeBattle, playCard, opponentPlayCard, endTurn, getRandomCards, getRandomPassives, replaceCardInDeck, checkVictory, checkDefeat, drawCardsWithReshuffle } from '@/lib/gameUtils';
import { Button } from '@/components/ui/button';
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Shield, Zap, Crown, Skull, Swords, TrendingDown, AlertTriangle, TrendingUp, Target } from 'lucide-react';

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

  // Add useEffect to monitor game state changes
  useEffect(() => {
    console.log('Game state changed:', gameState);
    console.log('Current game phase:', gameState.gamePhase);
  }, [gameState]);

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

  const renderClassSelection = () => (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold text-center">Choose Your Class</h1>
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
                ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer' 
                : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <div className="capitalize flex items-center justify-center gap-2 text-xl font-bold mb-2">
                {playerClass === 'warrior' && <Swords className="w-6 h-6" />}
                {playerClass === 'rogue' && <Skull className="w-6 h-6" />}
                {playerClass === 'wizard' && <Zap className="w-6 h-6" />}
                {playerClass}
                {playerClass !== 'warrior' && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Coming Soon</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {playerClass === 'warrior' && 'Master of combat and defense'}
                {playerClass === 'rogue' && 'Swift and deadly assassin'}
                {playerClass === 'wizard' && 'Wielder of arcane powers'}
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold">Starting Cards:</h4>
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-semibold capitalize flex items-center gap-2">
                {player.class === 'warrior' && <Swords className="w-5 h-5" />}
                {player.class === 'rogue' && <Skull className="w-5 h-5" />}
                {player.class === 'wizard' && <Zap className="w-5 h-5" />}
                {player.class}
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
              {renderStatusEffects(battleState.playerStatusEffects, "Player Effects")}
            </div>
            <div className="text-2xl font-bold">VS</div>
            <div className="text-center">
              <div className="font-semibold">{currentOpponent.name}</div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>{currentOpponent.health}/{currentOpponent.maxHealth}</span>
              </div>
              <Progress value={(currentOpponent.health / currentOpponent.maxHealth) * 100} className="w-24" />
              {battleState.opponentBlock > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600">{battleState.opponentBlock} Block</span>
                </div>
              )}
              {renderStatusEffects(battleState.opponentStatusEffects, "Opponent Effects")}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>{battleState.playerEnergy} Energy</span>
            </div>
            <Badge variant="outline">Level {player.level}</Badge>
          </div>
        </div>

        {/* Turn Indicator */}
        <Alert>
          <AlertDescription>
            {battleState.turn === 'player' ? 'Your turn - Play cards!' : `${currentOpponent.name}'s turn`}
          </AlertDescription>
        </Alert>

        {/* Battle Log */}
        <div className="bg-muted p-4 rounded-lg max-h-32 overflow-y-auto">
          {battleState.battleLog.slice(-5).map((log, index) => (
            <div key={index} className="text-sm">{log}</div>
          ))}
        </div>

        {/* Player Hand */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Hand ({battleState.playerHand.length}/5)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {battleState.playerHand.map((card, index) => (
              <CardComponent 
                key={index} 
                className={`cursor-pointer hover:shadow-md transition-all ${
                  !canPlayCard(card, player, battleState.playerEnergy) ? 'opacity-50' : ''
                } ${battleState.turn === 'player' ? 'hover:scale-105' : ''}`}
                onClick={() => battleState.turn === 'player' && canPlayCard(card, player, battleState.playerEnergy) && handleCardPlay(card)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm">{card.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">{card.cost}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                  {card.attack && (
                    <div className="flex items-center gap-1 mt-2">
                      <Swords className="w-3 h-3 text-red-500" />
                      <span className="text-xs">{card.attack}</span>
                    </div>
                  )}
                  {card.defense && (
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-blue-500" />
                      <span className="text-xs">{card.defense}</span>
                    </div>
                  )}
                </CardContent>
              </CardComponent>
            ))}
          </div>
        </div>

        {/* Deck and Discard Pile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Your Discard Pile</h4>
            <p className="text-sm text-muted-foreground">{battleState.playerDiscardPile.length} cards discarded</p>
            {battleState.playerDiscardPile.length > 0 && (
              <div className="mt-2 space-y-1">
                {battleState.playerDiscardPile.slice(-3).map((card, index) => (
                  <div key={index} className="text-xs">
                    {card.name} ({card.cost})
                  </div>
                ))}
                {battleState.playerDiscardPile.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    ...and {battleState.playerDiscardPile.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Your Deck</h4>
            <p className="text-sm text-muted-foreground">{battleState.playerDeck.cards.length} cards remaining</p>
            {battleState.playerDeck.cards.length > 0 && (
              <div className="mt-2 space-y-1">
                {battleState.playerDeck.cards.slice(-3).map((card, index) => (
                  <div key={index} className="text-xs">
                    {card.name} ({card.cost})
                  </div>
                ))}
                {battleState.playerDeck.cards.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    ...and {battleState.playerDeck.cards.length - 3} more
                  </div>
                )}
              </div>
            )}
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
          <h2 className="text-2xl font-bold">Choose a New Card</h2>
          <p className="text-muted-foreground mt-2">Select a new card to add to your deck</p>
        </div>
        
        {/* Available Cards */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Cards</h3>
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
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{card.cost}</Badge>
                      <Badge variant={card.rarity === 'rare' ? 'default' : 'secondary'}>
                        {card.rarity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-3">{card.description}</CardDescription>
                  <div className="space-y-2">
                    {card.attack && (
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium">{card.attack} Damage</span>
                      </div>
                    )}
                    {card.defense && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">{card.defense} Block</span>
                      </div>
                    )}
                    {card.effect && (
                      <div className="text-xs text-muted-foreground italic">
                        Effect: {card.effect}
                      </div>
                    )}
                  </div>
                </CardContent>
              </CardComponent>
            ))}
          </div>
        </div>

        {/* Current Deck - Cards to Replace */}
        {selectedCard && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Card to Replace</h3>
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
                      <Badge variant="outline">{card.cost}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">{card.description}</CardDescription>
                    <div className="space-y-2">
                      {card.attack && (
                        <div className="flex items-center gap-2">
                          <Swords className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium">{card.attack} Damage</span>
                        </div>
                      )}
                      {card.defense && (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">{card.defense} Block</span>
                        </div>
                      )}
                      {card.effect && (
                        <div className="text-xs text-muted-foreground italic">
                          Effect: {card.effect}
                        </div>
                      )}
                    </div>
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
          <h2 className="text-2xl font-bold">Choose a Passive Ability</h2>
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
      <h1 className="text-4xl font-bold">Victory!</h1>
      <p className="text-xl">Congratulations! You have conquered all challenges!</p>
      <Button onClick={handleRestart} size="lg">
        Play Again
      </Button>
    </div>
  );

  const renderDefeat = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl">💀</div>
      <h1 className="text-4xl font-bold">Defeat</h1>
      <p className="text-xl">You have been defeated. Better luck next time!</p>
      <Button onClick={handleRestart} size="lg">
        Try Again
      </Button>
    </div>
  );

  const canPlayCard = (card: Card, player: Player, energy: number) => {
    return energy >= card.cost;
  };

  const renderStatusEffects = (effects: any[], title: string) => {
    if (effects.length === 0) return null;

    return (
      <div className="mt-2">
        <h4 className="text-xs font-semibold text-muted-foreground mb-1">{title}</h4>
        <div className="flex flex-wrap gap-1">
          {effects.map((effect, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {effect.type === 'weak' && <TrendingDown className="w-3 h-3 mr-1" />}
              {effect.type === 'vulnerable' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {effect.type === 'strength' && <TrendingUp className="w-3 h-3 mr-1" />}
              {effect.type === 'dexterity' && <Target className="w-3 h-3 mr-1" />}
              {effect.type} {effect.value} ({effect.duration})
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {gameState.gamePhase === 'class-selection' && renderClassSelection()}
      {gameState.gamePhase === 'battle' && renderBattle()}
      {gameState.gamePhase === 'card-selection' && renderCardSelection()}
      {gameState.gamePhase === 'passive-selection' && renderPassiveSelection()}
      {gameState.gamePhase === 'victory' && renderVictory()}
      {gameState.gamePhase === 'defeat' && renderDefeat()}
    </div>
  );
}