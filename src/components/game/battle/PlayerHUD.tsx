import React, { useState, useEffect } from 'react';
import { Player, BattleState, Card } from '@/types/game';
import { Progress } from '@/components/ui/progress';
import { Heart, Diamond, BookOpen, Trash2, Flag, Hand, Swords, Star, Crown, Skull, User, CircleDotDashed, Hourglass } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CardEffectText } from '@/components/game/shared/CardEffectText';
import { playerClasses } from '@/data/gameData';

interface PlayerHUDProps {
  player: Player;
  battleState: BattleState;
  showDeckModal: boolean;
  showDiscardModal: boolean;
  onDeckModalChange: (open: boolean) => void;
  onDiscardModalChange: (open: boolean) => void;
  onCardPlay: (card: Card) => void;
  onEndTurn: () => void;
  canPlayCard: (card: Card) => boolean;
  splashCompleted: boolean;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  player,
  battleState,
  showDeckModal,
  showDiscardModal,
  onDeckModalChange,
  onDiscardModalChange,
  onCardPlay,
  onEndTurn,
  canPlayCard,
  splashCompleted
}) => {
  const playerClassData = playerClasses[player.class];
  const PlayerIcon = playerClassData.icon;
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  // Start animations after splash completes
  useEffect(() => {
    if (splashCompleted && !animationStarted) {
      setAnimationStarted(true);
    }
  }, [splashCompleted, animationStarted]);

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  const handlePlayCard = () => {
    if (selectedCard) {
      onCardPlay(selectedCard);
      setSelectedCard(null);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'melee':
        return <Hand className="w-4 h-4 text-red-300" strokeWidth={2} />;
      case 'attack':
        return <Swords className="w-4 h-4 text-orange-300" strokeWidth={2} />;
      case 'skill':
        return <Star className="w-4 h-4 text-green-300" strokeWidth={2} />;
      case 'power':
        return <Crown className="w-4 h-4 text-purple-300" strokeWidth={2} />;
      case 'curse':
        return <Skull className="w-4 h-4 text-amber-300" strokeWidth={2} />;
      case 'minion':
        return <User className="w-4 h-4 text-yellow-300" strokeWidth={2} />;
      case 'volatile':
        return <CircleDotDashed className="w-4 h-4 text-yellow-400" strokeWidth={2} />;
      default:
        return <Star className="w-4 h-4 text-gray-300" strokeWidth={2} />;
    }
  };

  const getTypeStyle = (type: string) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'melee':
        return 'bg-red-800/50 border-red-700';
      case 'attack':
        return 'bg-orange-800/50 border-orange-700';
      case 'skill':
        return 'bg-green-800/50 border-green-700';
      case 'power':
        return 'bg-purple-800/50 border-purple-700';
      case 'curse':
        return 'bg-amber-800/50 border-amber-700';
      case 'minion':
        return 'bg-yellow-800/50 border-yellow-700';
      case 'volatile':
        return 'bg-yellow-600/50 border-yellow-700';
      default:
        return 'bg-gray-800/50 border-gray-700';
    }
  };

  return (
    <>
      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes cardEnterFlip {
          0% {
            opacity: 0;
            transform: translateX(200px) rotateY(180deg);
          }
          50% {
            opacity: 0.7;
            transform: translateX(100px) rotateY(90deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotateY(0deg);
          }
        }
      `}</style>
      
      {/* Constrained HUD Container */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="max-w-[720px] mx-auto h-full relative">
          {/* Player Portrait and Health Circle */}
          <div className="absolute bottom-0 left-4 z-50 flex items-end gap-3 pointer-events-auto mb-[-15px]">
            <div className="flex items-center gap-2">
              {/* Player Portrait - Increased by 1.3x */}
              <div className="w-[83.2px] h-[83.2px] rounded-full overflow-visible bg-transparent flex items-center justify-center border-2 border-gray-600 relative">
                <img 
                  src={playerClassData.portrait} 
                  alt={`${playerClassData.name} Portrait`} 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 rounded-full"><PlayerIcon className="w-10 h-10" /></div>`;
                  }}
                />
                
                {/* Health Points Circle - Overlay on bottom right of portrait */}
                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[43.2px] h-[43.2px] rounded-full bg-red-900/80 border-2 border-red-700 flex items-center justify-center z-20 shadow-lg">
                  <div className="flex flex-col items-center">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] text-white font-bold gothic-text leading-none">
                      {player.health}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Cards Display - Centered and Overlapping */}
          <div className="absolute bottom-[50px] left-1/2 transform -translate-x-1/2 flex items-end z-20 pointer-events-auto mb-[-35px]">
            {battleState.playerHand.map((card, index) => {
              return (
                <div 
                  key={`${card.id}`} 
                  className="flex flex-col bg-gradient-to-b from-gray-800/95 to-gray-900/98 backdrop-blur-sm rounded border border-gray-700/70 p-1 min-w-[96px] max-w-[96px] hover:from-gray-700/95 hover:to-gray-800/98 cursor-pointer transition-all shadow-lg relative overflow-hidden"
                  style={{ 
                    marginLeft: index === 0 ? '0px' : '-30px',
                    zIndex: 20 - index,
                    animation: animationStarted ? `cardEnterFlip 0.8s ease-out forwards` : 'none',
                    animationDelay: animationStarted ? `${index * 0.5}s` : '0s',
                    opacity: animationStarted ? 0 : 1,
                    transform: animationStarted ? 'translateX(200px) rotateY(180deg)' : 'translateX(0) rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden'
                  }}
                  onClick={() => handleCardClick(card)}
                >
                  {/* Dark parchment texture overlay */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjMiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjI1Ii8+PC9zdmc+')] opacity-40 pointer-events-none"></div>
                  
                  {/* Card Image Container - Square */}
                  <div className="relative w-full aspect-square bg-gradient-to-b from-gray-700/60 to-gray-800/40 rounded border border-gray-600/50 mb-1 overflow-hidden">
                    <div className="text-gray-600/80 text-[9px] text-center leading-none absolute inset-0 flex items-center justify-center">
                      Card
                    </div>
                    
                    {/* Energy Icons Overlay - Top Right Corner */}
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      {Array.from({ length: card.cost }, (_, i) => (
                        <div key={i} className="w-3 h-3 rounded-full bg-gradient-to-b from-green-500 to-green-700 border border-green-600 flex items-center justify-center shadow-sm">
                          <Diamond className="w-1.5 h-1.5 text-white" />
                        </div>
                      ))}
                    </div>
                    
                    {/* Dark stain */}
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-950/40 rounded-full blur-sm"></div>
                  </div>
                  
                  {/* Card Name - Below Image, Capital Letters */}
                  <div className="text-[9px] text-gray-300 font-bold uppercase text-center leading-tight relative z-10 px-1 mb-0.5">
                    {card.name}
                  </div>
                  
                  {/* Card Description - Fixed 5 Lines */}
                  <div className="text-[7px] text-gray-400/80 text-center leading-[1.1] relative z-10 px-1 h-[35px] overflow-hidden">
                    <div className="line-clamp-5">
                      {card.description}
                    </div>
                  </div>
                  
                  {/* Worn edges effect */}
                  <div className="absolute inset-0 border border-gray-900/40 rounded pointer-events-none"></div>
                </div>
              );
            })}
          </div>

          {/* Deck and Discard Icons */}
          <div className="absolute bottom-0 right-4 z-50 flex flex-col gap-2 items-end pointer-events-auto mb-[-15px]">
            {/* Deck and Discard Icons - Circular and Stacked */}
            <div className="flex flex-col gap-2">
              {/* Discard Icon - Dark Parchment Style */}
              <button
                onClick={() => onDiscardModalChange(!showDiscardModal)}
                className="relative w-12 h-12 rounded-full bg-gradient-to-b from-gray-800/95 to-gray-900/98 backdrop-blur-sm border-2 border-gray-700/70 hover:from-gray-700/95 hover:to-gray-800/98 transition-all flex items-center justify-center shadow-lg overflow-visible"
              >
                {/* Dark parchment texture overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjMiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjI1Ii8+PC9zdmc+')] opacity-40 pointer-events-none"></div>
                
                <Trash2 className="w-5 h-5 text-gray-300 relative z-10" />
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-800 flex items-center justify-center shadow-sm z-20">
                  <span className="text-[8px] text-gray-200 font-bold">
                    {battleState.playerDiscardPile.length}
                  </span>
                </span>
                
                {/* Worn edges effect */}
                <div className="absolute inset-0 border border-gray-900/40 rounded-full pointer-events-none"></div>
              </button>
              
              {/* Deck Icon - Dark Parchment Style */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeckModalChange(!showDeckModal);
                }}
                className="relative w-12 h-12 rounded-full bg-gradient-to-b from-gray-800/95 to-gray-900/98 backdrop-blur-sm border-2 border-gray-700/70 hover:from-gray-700/95 hover:to-gray-800/98 transition-all flex items-center justify-center shadow-lg overflow-visible"
              >
                {/* Dark parchment texture overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjMiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjI1Ii8+PC9zdmc+')] opacity-40 pointer-events-none"></div>
                
                <BookOpen className="w-5 h-5 text-gray-300 relative z-10" />
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-800 flex items-center justify-center shadow-sm z-20">
                  <span className="text-[8px] text-gray-200 font-bold">
                    {battleState.playerDeck.cards.length}
                  </span>
                </span>
                
                {/* Worn edges effect */}
                <div className="absolute inset-0 border border-gray-900/40 rounded-full pointer-events-none"></div>
              </button>
            </div>
            
            {/* End Turn Button - Dark Fantasy Themed */}
            <button
              onClick={onEndTurn}
              disabled={battleState.turn !== 'player'}
              className={`relative w-[83.2px] h-[83.2px] rounded-full bg-gradient-to-b border-2 transition-all duration-300 shadow-lg flex items-center justify-center group ${
                battleState.turn === 'player'
                  ? 'from-gray-800 to-gray-900 border-gray-700 hover:from-gray-700 hover:to-gray-800'
                  : 'from-gray-900 to-gray-950 border-gray-800 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Dark fantasy background texture */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/30 rounded-full"></div>
              
              {/* Metallic ring effect */}
              <div className="absolute inset-1 rounded-full border border-gray-600/50 shadow-inner"></div>
              
              {/* Blood splatter accent */}
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-800/60 rounded-full blur-sm"></div>
              <div className="absolute bottom-3 left-3 w-2 h-2 bg-red-700/40 rounded-full blur-sm"></div>
              
              {/* Central icon with glow effect */}
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative">
                  <Hourglass className={`w-10 h-10 transition-colors duration-300 drop-shadow-lg ${
                    battleState.turn === 'player'
                      ? 'text-gray-400 group-hover:text-gray-300'
                      : 'text-gray-600'
                  }`} />
                  {/* Subtle glow effect */}
                  <div className={`absolute inset-0 rounded-full blur-md transition-colors duration-300 ${
                    battleState.turn === 'player'
                      ? 'bg-gray-600/20 group-hover:bg-gray-500/30'
                      : 'bg-gray-600/10'
                  }`}></div>
                </div>
              </div>
              
              {/* Hover effects */}
              {battleState.turn === 'player' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-gray-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 rounded-full border border-gray-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </>
              )}
              
              {/* Active/pulse effect */}
              {battleState.turn === 'player' && (
                <div className="absolute inset-0 rounded-full bg-gray-600/5 animate-pulse"></div>
              )}
              
              {/* Scratches and wear texture */}
              <div className="absolute top-1 left-4 w-6 h-0.5 bg-gray-600/30 rotate-12"></div>
              <div className="absolute bottom-2 right-3 w-4 h-0.5 bg-gray-600/20 -rotate-6"></div>
            </button>
          </div>

          {/* Dark Energy Bar at Very Bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-b from-gray-800/90 to-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 pointer-events-auto mb-[-25px]">
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2">
                {Array.from({ length: battleState.playerEnergy }, (_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-b from-green-500 to-green-700 border border-green-600 flex items-center justify-center shadow-lg">
                    <Diamond className="w-3 h-3 text-white" />
                  </div>
                ))}
                {battleState.playerEnergy === 0 && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center">
                    <Diamond className="w-3 h-3 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Preview */}
      {selectedCard && (
        <>
          {/* Backdrop - closes preview when clicked */}
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedCard(null)}
          />
          
          {/* Preview Card */}
          <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div 
              className="relative bg-gray-900 border border-gray-700 rounded-lg p-6 w-80 mx-4 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ aspectRatio: '3/2' }}
            >
              <div className="flex flex-col h-full">
                {/* Card Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-200 truncate">{selectedCard.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {Array.from({ length: selectedCard.cost }, (_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-gradient-to-b from-green-500 to-green-700 border border-green-600 flex items-center justify-center shadow-lg">
                          <Diamond className="w-2 h-2 text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Card Type Badges */}
                  <div className="flex flex-wrap gap-1">
                    {selectedCard.types?.map((type, index) => (
                      <div 
                        key={index} 
                        className={`p-1.5 rounded border flex items-center justify-center ${getTypeStyle(type)}`}
                        style={{ minWidth: '28px', minHeight: '28px' }}
                      >
                        {getTypeIcon(type)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Image Container - Square */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded border border-gray-700/50 mb-3 overflow-hidden flex-shrink-0">
                  <div className="text-gray-600/80 text-sm text-center leading-none absolute inset-0 flex items-center justify-center">
                    Card Image
                  </div>
                  
                  {/* Dark stain */}
                  <div className="absolute bottom-2 right-2 w-3 h-3 bg-gray-950/40 rounded-full blur-sm"></div>
                </div>

                {/* Card Description */}
                <div className="flex-1 mb-3 min-h-0">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <CardEffectText description={selectedCard.description || ''} />
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-2 left-2 w-2 h-2 bg-gray-700/40 rounded-full blur-sm"></div>
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-gray-600/30 rounded-full blur-sm"></div>
              <div className="absolute inset-0 rounded-lg border border-gray-600/20 pointer-events-none"></div>
            </div>
            
            {/* Play Card Button - Outside Preview */}
            <button
              onClick={handlePlayCard}
              disabled={!canPlayCard(selectedCard)}
              className={`mt-4 px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 pointer-events-auto ${
                canPlayCard(selectedCard)
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              Play Card
            </button>
          </div>
        </>
      )}

      {/* Deck Modal */}
      <Dialog open={showDeckModal} onOpenChange={onDeckModalChange}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-200 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-200">Deck ({battleState.playerDeck.cards.length} cards)</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            {battleState.playerDeck.cards.map((card, index) => (
              <div key={`${card.id}-${index}`} className="bg-gray-800 border border-gray-700 rounded p-3">
                <h4 className="font-semibold text-gray-200 mb-1">{card.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: card.cost }, (_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gradient-to-b from-green-500 to-green-700 border border-green-600 flex items-center justify-center">
                      <Diamond className="w-1 h-1 text-white" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  <CardEffectText description={card.description} />
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard Modal */}
      <Dialog open={showDiscardModal} onOpenChange={onDiscardModalChange}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-200 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-200">Discard Pile ({battleState.playerDiscardPile.length} cards)</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            {battleState.playerDiscardPile.map((card, index) => (
              <div key={`${card.id}-${index}`} className="bg-gray-800 border border-gray-700 rounded p-3">
                <h4 className="font-semibold text-gray-200 mb-1">{card.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: card.cost }, (_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gradient-to-b from-green-500 to-green-700 border border-green-600 flex items-center justify-center">
                      <Diamond className="w-1 h-1 text-white" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  <CardEffectText description={card.description} />
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};