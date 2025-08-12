import React, { useEffect } from 'react';
import { Card } from '@/types/game';
import { CardEffectText } from '@/components/game/shared/CardEffectText';
import { Hand, Swords, Star, Crown, Skull, User, CircleDotDashed } from 'lucide-react';

interface OpponentCardPreviewProps {
  card: Card | null;
  isVisible: boolean;
  onHide: () => void;
}

export const OpponentCardPreview: React.FC<OpponentCardPreviewProps> = ({
  card,
  isVisible,
  onHide
}) => {
  useEffect(() => {
    if (isVisible && card) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, card, onHide]);

  if (!isVisible || !card) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'melee':
        return <Hand className="w-6 h-6 text-red-300" strokeWidth={2} />;
      case 'attack':
        return <Swords className="w-6 h-6 text-orange-300" strokeWidth={2} />;
      case 'skill':
        return <Star className="w-6 h-6 text-green-300" strokeWidth={2} />;
      case 'power':
        return <Crown className="w-6 h-6 text-purple-300" strokeWidth={2} />;
      case 'curse':
        return <Skull className="w-6 h-6 text-amber-300" strokeWidth={2} />;
      case 'minion':
        return <User className="w-6 h-6 text-yellow-300" strokeWidth={2} />;
      case 'volatile':
        return <CircleDotDashed className="w-6 h-6 text-yellow-400" strokeWidth={2} />;
      default:
        return <Star className="w-6 h-6 text-gray-300" strokeWidth={2} />;
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
        @keyframes opponentCardSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translateY(0) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes opponentCardSlideOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
        }

        .opponent-card-enter {
          animation: opponentCardSlideIn 0.4s ease-out forwards;
        }

        .opponent-card-exit {
          animation: opponentCardSlideOut 0.3s ease-in forwards;
        }
      `}</style>

      {/* Opponent Card Preview Overlay */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none">
        <div className="relative mt-20 transform transition-all duration-300">
          <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-red-700 rounded-lg p-6 w-80 shadow-2xl opponent-card-enter">
            {/* Card Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-red-400 truncate">{card.name}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {Array.from({ length: card.cost }, (_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Card Type Badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {card.types?.map((type, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded border flex items-center justify-center ${getTypeStyle(type)}`}
                    style={{ minWidth: '32px', minHeight: '32px' }}
                  >
                    {getTypeIcon(type)}
                  </div>
                ))}
              </div>
            </div>

            {/* Card Image */}
            <div className="w-full h-24 bg-gradient-to-br from-red-900/50 to-gray-800 rounded-lg mb-4 flex items-center justify-center border border-red-800/50">
              <div className="text-red-400 text-sm font-bold">
                OPPONENT CARD
              </div>
            </div>

            {/* Card Description */}
            <div className="mb-4">
              <p className="text-sm text-red-300 leading-relaxed">
                <CardEffectText description={card.description || ''} />
              </p>
            </div>

            {/* "Opponent Played" Label */}
            <div className="text-center">
              <span className="text-xs text-red-500 font-bold tracking-wider uppercase">
                Opponent Played This Card
              </span>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-red-600/40 rounded-full blur-sm"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-red-500/30 rounded-full blur-sm"></div>
            <div className="absolute inset-0 rounded-lg border border-red-600/20 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </>
  );
};