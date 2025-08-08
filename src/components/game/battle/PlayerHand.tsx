import React, { useState } from 'react';
import { Player, BattleState, Card } from '@/types/game';
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnergyCost } from '@/components/game/shared/EnergyCost';
import { CardTypes } from '@/components/game/shared/CardTypes';
import { CardEffectText } from '@/components/game/shared/CardEffectText';

interface PlayerHandProps {
  player: Player;
  battleState: BattleState;
  onCardPlay: (card: Card) => void;
  canPlayCard: (card: Card) => boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  battleState,
  onCardPlay,
  canPlayCard
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleCardClick = (card: Card) => {
    if (!isModalOpen && battleState.turn === 'player' && canPlayCard(card)) {
      onCardPlay(card);
    }
  };
  return (
    <div>
      <h3 className="text-xl font-semibold card-title mb-4">Your Hand ({battleState.playerHand.length}/5)</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {battleState.playerHand.map((card, index) => (
          <CardComponent 
            key={index} 
            className={`cursor-pointer hover:shadow-md transition-all custom-hover ${
              !canPlayCard(card) || isModalOpen ? 'opacity-50' : ''
            } ${battleState.turn === 'player' && !isModalOpen ? 'hover:scale-105' : ''}`}
            onClick={() => handleCardClick(card)}
          >
            <CardHeader className="pb-1">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{card.name}</CardTitle>
                <EnergyCost cost={card.cost} card={card} player={player} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTypes 
                types={card.types} 
                className="mb-2" 
                onModalOpenChange={setIsModalOpen}
              />
              <CardEffectText description={card.description} className="text-sm gothic-text" />
            </CardContent>
          </CardComponent>
        ))}
      </div>
    </div>
  );
};