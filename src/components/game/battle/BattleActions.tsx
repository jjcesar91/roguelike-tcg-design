import React from 'react';
import { BattleState } from '@/types/game/GameState';
import { Button } from '@/components/ui/button';

interface BattleActionsProps {
  battleState: BattleState;
  onEndTurn: () => void;
}

export const BattleActions: React.FC<BattleActionsProps> = ({
  battleState,
  onEndTurn
}) => {
  return (
    <div className="flex justify-center gap-4">
      <Button 
        onClick={onEndTurn} 
        disabled={battleState.turn !== 'player'}
        variant={battleState.turn === 'player' ? 'default' : 'secondary'}
      >
        {battleState.turn === 'player' ? 'End Turn' : 'Opponent Turn...'}
      </Button>
    </div>
  );
};