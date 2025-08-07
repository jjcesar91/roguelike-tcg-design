import React from 'react';
import { BattleState } from '@/types/game/GameState';

interface BattleLogProps {
  battleState: BattleState;
}

export const BattleLog: React.FC<BattleLogProps> = ({ battleState }) => {
  return (
    <div className="bg-muted p-4 rounded-lg max-h-32 overflow-y-auto">
      {battleState.battleLog.slice(-5).map((log, index) => (
        <div key={index} className="text-sm">{log}</div>
      ))}
    </div>
  );
};