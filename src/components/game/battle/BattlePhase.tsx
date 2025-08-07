import React from 'react';
import { Player, Opponent, BattleState, Card } from '@/types/game/GameState';
import { BattleHeader } from './BattleHeader';
import { TurnIndicator } from './TurnIndicator';
import { BattleLog } from './BattleLog';
import { PlayerHand } from './PlayerHand';
import { BattleActions } from './BattleActions';

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
  canPlayCard
}) => {
  return (
    <div className="space-y-6">
      {/* Battle Header */}
      <BattleHeader 
        player={player}
        opponent={opponent}
        battleState={battleState}
      />
      
      {/* Turn Indicator */}
      <TurnIndicator 
        battleState={battleState}
        opponentName={opponent.name}
        showDeckModal={showDeckModal}
        showDiscardModal={showDiscardModal}
        onDeckModalChange={onDeckModalChange}
        onDiscardModalChange={onDiscardModalChange}
      />
      
      {/* Battle Log */}
      <BattleLog battleState={battleState} />
      
      {/* Player Hand */}
      <PlayerHand 
        player={player}
        battleState={battleState}
        onCardPlay={onCardPlay}
        canPlayCard={canPlayCard}
      />
      
      {/* Action Buttons */}
      <BattleActions 
        battleState={battleState}
        onEndTurn={onEndTurn}
      />
    </div>
  );
};