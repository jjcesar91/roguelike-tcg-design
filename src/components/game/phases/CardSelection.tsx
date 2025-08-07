import React from 'react';
import { Card } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnergyCost } from '@/components/game/shared/EnergyCost';
import { CardTypes } from '@/components/game/shared/CardTypes';

interface CardSelectionProps {
  player: any;
  availableCards: Card[];
  selectedCard: string | null;
  selectedReplaceCard: string | null;
  onCardSelect: (cardId: string) => void;
  onReplaceCardSelect: (cardId: string) => void;
  onConfirm: () => void;
}

export const CardSelection: React.FC<CardSelectionProps> = ({
  player,
  availableCards,
  selectedCard,
  selectedReplaceCard,
  onCardSelect,
  onReplaceCardSelect,
  onConfirm
}) => {
  const uniqueCards = Array.from(new Set(player.deck.cards.map(card => card.id)))
    .map(id => player.deck.cards.find(card => card.id === id)!);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold game-title">Choose a New Card</h2>
        <p className="text-muted-foreground mt-2">Select a new card to add to your deck</p>
      </div>
      
      {/* Available Cards */}
      <div>
        <h3 className="text-lg font-semibold card-title mb-4">Available Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableCards.map((card, index) => (
            <CardComponent 
              key={index} 
              className={`cursor-pointer hover:shadow-md transition-all custom-hover ${
                selectedCard === card.id ? 'ring-2 ring-primary scale-105' : ''
              }`}
              onClick={() => onCardSelect(card.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {card.name}
                    <CardTypes types={card.types} />
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <EnergyCost cost={card.cost} />
                    <Badge variant={card.rarity === 'rare' ? 'default' : 'secondary'}>
                      {card.rarity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-3">{card.description}</CardDescription>
                {card.effect && (
                  <div className="text-xs text-muted-foreground italic">
                    Effect: {card.effect}
                  </div>
                )}
              </CardContent>
            </CardComponent>
          ))}
        </div>
      </div>
      
      {/* Current Deck - Cards to Replace */}
      {selectedCard && (
        <div>
          <h3 className="text-lg font-semibold card-title mb-4">Choose Card to Replace</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select one of your current cards to replace. All 3 copies will be removed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {uniqueCards.map((card, index) => (
              <CardComponent 
                key={index} 
                className={`cursor-pointer hover:shadow-md transition-all custom-hover ${
                  selectedReplaceCard === card.id ? 'ring-2 ring-destructive scale-105' : ''
                }`}
                onClick={() => onReplaceCardSelect(card.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {card.name}
                      <CardTypes types={card.types} />
                    </CardTitle>
                    <EnergyCost cost={card.cost} />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-3">{card.description}</CardDescription>
                  {card.effect && (
                    <div className="text-xs text-muted-foreground italic">
                      Effect: {card.effect}
                    </div>
                  )}
                </CardContent>
              </CardComponent>
            ))}
          </div>
        </div>
      )}
      
      {/* Confirm Button */}
      {selectedCard && selectedReplaceCard && (
        <div className="flex justify-center">
          <Button 
            onClick={onConfirm}
            size="lg"
            className="custom-hover"
          >
            Confirm Selection
          </Button>
        </div>
      )}
    </div>
  );
};