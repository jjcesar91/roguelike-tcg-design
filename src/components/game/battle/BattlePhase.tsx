import React from 'react';
import { Player, Opponent, BattleState, Card } from '@/types/game';
import { BattleHeader } from './BattleHeader';
import { BattleLog } from './BattleLog';
import { PlayerHUD } from './PlayerHUD';

interface BattlePhaseProps {
  player: Player;
  opponent: Opponent;
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

export const BattlePhase: React.FC<BattlePhaseProps> = ({
  player,
  opponent,
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
  return (
    <div className="space-y-6">
      {/* Player HUD - Fixed Position */}
      <PlayerHUD 
        player={player}
        battleState={battleState}
        showDeckModal={showDeckModal}
        showDiscardModal={showDiscardModal}
        onDeckModalChange={onDeckModalChange}
        onDiscardModalChange={onDiscardModalChange}
        onCardPlay={onCardPlay}
        onEndTurn={onEndTurn}
        canPlayCard={canPlayCard}
        splashCompleted={splashCompleted}
      />
      
      {/* Battle Header */}
      <BattleHeader 
        player={player}
        opponent={opponent}
        battleState={battleState}
      />
      
      {/* Battle Log */}
      <BattleLog battleState={battleState} />
    </div>
  );
};