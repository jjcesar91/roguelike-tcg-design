import React, { useState } from 'react';
import { Hand, Swords, Star, Crown, Skull, User, CircleDotDashed } from 'lucide-react';
import { CardType } from '@/types/game';
import { CardTypeModal } from '@/components/game/modals/CardTypeModal';

interface CardTypesProps {
  types: CardType[] | undefined;
  className?: string;
  onModalOpenChange?: (isOpen: boolean) => void;
}

export const CardTypes: React.FC<CardTypesProps> = ({ types, className, onModalOpenChange }) => {
  const [selectedType, setSelectedType] = useState<CardType | null>(null);
  
  if (!types || types.length === 0) return null;
  
  const getTypeColor = (type: CardType) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'melee':
        return 'bg-red-800 text-red-100 border-red-900 hover:bg-red-700 cursor-pointer';
      case 'attack':
        return 'bg-orange-800 text-orange-100 border-orange-900 hover:bg-orange-700 cursor-pointer';
      case 'skill':
        return 'bg-blue-800 text-blue-100 border-blue-900 hover:bg-blue-700 cursor-pointer';
      case 'power':
        return 'bg-purple-800 text-purple-100 border-purple-900 hover:bg-purple-700 cursor-pointer';
      case 'curse':
        return 'bg-amber-800 text-amber-100 border-amber-900 hover:bg-amber-700 cursor-pointer';
      case 'minion':
        return 'bg-green-800 text-green-100 border-green-900 hover:bg-green-700 cursor-pointer';
      case 'volatile':
        return 'bg-yellow-600 text-yellow-100 border-yellow-700 hover:bg-yellow-500 cursor-pointer';
      default:
        return 'bg-gray-800 text-gray-100 border-gray-900 hover:bg-gray-700 cursor-pointer';
    }
  };
  
  const getTypeIcon = (type: CardType) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'melee':
        return <Hand className="w-6 h-6" strokeWidth={2} />;
      case 'attack':
        return <Swords className="w-6 h-6" strokeWidth={2} />;
      case 'skill':
        return <Star className="w-6 h-6" strokeWidth={2} />;
      case 'power':
        return <Crown className="w-6 h-6" strokeWidth={2} />;
      case 'curse':
        return <Skull className="w-6 h-6" strokeWidth={2} />;
      case 'minion':
        return <User className="w-6 h-6" strokeWidth={2} />;
      case 'volatile':
        return <CircleDotDashed className="w-6 h-6" strokeWidth={2} />;
      default:
        return <span className="text-sm font-bold">?</span>;
    }
  };
  
  const handleBadgeClick = (type: CardType, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedType(type);
    onModalOpenChange?.(true);
  };
  
  return (
    <>
      <div className={`flex flex-wrap gap-1 mt-2 ${className || ''}`} title={types.join(', ')}>
        {types.map((type, index) => (
          <div 
            key={index}
            className={`p-2 rounded ${getTypeColor(type)} border flex items-center justify-center transition-all hover:scale-105`}
            style={{ minWidth: '32px', minHeight: '32px' }}
            onClick={(event) => handleBadgeClick(type, event)}
          >
            {getTypeIcon(type)}
          </div>
        ))}
      </div>

      {selectedType && (
        <CardTypeModal
          isOpen={!!selectedType}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedType(null);
            }
            onModalOpenChange?.(open);
          }}
          cardType={selectedType}
        />
      )}
    </>
  );
};