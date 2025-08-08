import React from 'react';
import { BattleState } from '@/types/game';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Layers, Archive, Flag } from 'lucide-react';
import { CardEffectText } from '@/components/game/shared/CardEffectText';

interface TurnIndicatorProps {
  battleState: BattleState;
  opponentName: string;
  showDeckModal: boolean;
  showDiscardModal: boolean;
  onDeckModalChange: (open: boolean) => void;
  onDiscardModalChange: (open: boolean) => void;
  onEndTurn: () => void;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  battleState,
  opponentName,
  showDeckModal,
  showDiscardModal,
  onDeckModalChange,
  onDiscardModalChange,
  onEndTurn
}) => {
  return (
    <div className="w-full bg-muted border border-border rounded-lg p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
        <div className="text-base font-medium gothic-text w-full sm:w-auto text-left sm:text-left">
          {battleState.turn === 'player' ? 'Your turn - Play cards!' : `${opponentName}'s turn`}
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <Dialog open={showDeckModal} onOpenChange={onDeckModalChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 custom-hover-light">
                <Layers className="w-4 h-4" />
                Deck ({battleState.playerDeck.cards.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Your Deck</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground">{battleState.playerDeck.cards.length} cards remaining</p>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {battleState.playerDeck.cards.map((card, index) => (
                    <div key={index} className="text-base p-2 bg-muted rounded gothic-text">
                      {card.name} ({card.cost}) - <CardEffectText description={card.description} />
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showDiscardModal} onOpenChange={onDiscardModalChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 custom-hover-light">
                <Archive className="w-4 h-4" />
                Discard ({battleState.playerDiscardPile.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Your Discard Pile</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{battleState.playerDiscardPile.length} cards discarded</p>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {battleState.playerDiscardPile.map((card, index) => (
                    <div key={index} className="text-base p-2 bg-muted rounded gothic-text">
                      {card.name} ({card.cost}) - <CardEffectText description={card.description} />
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {battleState.turn === 'player' && (
            <Button 
              onClick={onEndTurn}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Flag className="w-4 h-4" />
              End Turn
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};