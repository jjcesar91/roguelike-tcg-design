import React from 'react';
import { Hand, Swords, Star, Crown, Skull } from 'lucide-react';
import { CardType } from '@/types/game';

interface CardTypesProps {
  types: CardType[] | undefined;
}

export const CardTypes: React.FC<CardTypesProps> = ({ types }) => {
  if (!types || types.length === 0) return null;
  
  const getTypeColor = (type: CardType) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'melee':
        return 'bg-red-800 text-red-100 border-red-900';
      case 'attack':
        return 'bg-orange-800 text-orange-100 border-orange-900';
      case 'skill':
        return 'bg-blue-800 text-blue-100 border-blue-900';
      case 'power':
        return 'bg-purple-800 text-purple-100 border-purple-900';
      case 'curse':
        return 'bg-amber-800 text-amber-100 border-amber-900';
      default:
        return 'bg-gray-800 text-gray-100 border-gray-900';
    }
  };
  
  const getTypeIcon = (type: CardType) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'melee':
        return <Hand className="w-4 h-4" strokeWidth={2} />;
      case 'attack':
        return <Swords className="w-4 h-4" strokeWidth={2} />;
      case 'skill':
        return <Star className="w-4 h-4" strokeWidth={2} />;
      case 'power':
        return <Crown className="w-4 h-4" strokeWidth={2} />;
      case 'curse':
        return <Skull className="w-4 h-4" strokeWidth={2} />;
      default:
        return <span className="text-xs font-bold">?</span>;
    }
  };
  
  return (
    <div className="flex flex-wrap gap-1 mt-2" title={types.join(', ')}>
      {types.map((type, index) => (
        <div 
          key={index}
          className={`p-1 rounded ${getTypeColor(type)} border flex items-center justify-center`}
          style={{ minWidth: '20px', minHeight: '20px' }}
        >
          {getTypeIcon(type)}
        </div>
      ))}
    </div>
  );
};