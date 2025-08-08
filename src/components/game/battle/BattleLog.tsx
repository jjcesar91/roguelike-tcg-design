import React from 'react';
import { BattleState } from '@/types/game';

interface BattleLogProps {
  battleState: BattleState;
}

// Function to parse markdown-like bold text and convert to JSX
const formatBoldText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove the ** and wrap in strong tag
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-bold text-amber-700">{boldText}</strong>;
    }
    return part;
  });
};

export const BattleLog: React.FC<BattleLogProps> = ({ battleState }) => {
  // Reverse the order to show latest actions on top, and take last 10 entries
  const reversedLogs = [...battleState.battleLog].slice(-10).reverse();
  
  return (
    <div className="bg-muted p-4 rounded-lg max-h-32 overflow-y-auto">
      {reversedLogs.map((log, index) => (
        <div key={index} className="text-base gothic-text mb-1 last:mb-0">
          {formatBoldText(log)}
        </div>
      ))}
    </div>
  );
};