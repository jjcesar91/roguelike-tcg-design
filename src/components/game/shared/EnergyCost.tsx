import React from 'react';
import { Card, Player } from '@/types/game';
import { Diamond } from 'lucide-react';
import { getCardCost } from '@/lib/gameUtils';

interface EnergyCostProps {
  cost: number;
  card?: Card;
  player?: Player;
}

export const EnergyCost: React.FC<EnergyCostProps> = ({ 
  cost, 
  card, 
  player 
}) => {
  // If card and player are provided, calculate the discounted cost
  const actualCost = card && player ? getCardCost(card, player) : cost;
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: actualCost }, (_, i) => (
        <div key={i} className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
          <Diamond className="w-1.5 h-1.5 text-white" />
        </div>
      ))}
    </div>
  );
};