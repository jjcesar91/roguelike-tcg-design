import React from 'react';
import { BattleState } from '@/types/game';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Layers, Archive } from 'lucide-react';

interface TurnIndicatorProps {
  battleState: BattleState;
  opponentName: string;
  showDeckModal: boolean;
  showDiscardModal: boolean;
  onDeckModalChange: (open: boolean) => void;
  onDiscardModalChange: (open: boolean) => void;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  battleState,
  opponentName,
  showDeckModal,
  showDiscardModal,
  onDeckModalChange,
  onDiscardModalChange
}) => {
  return (
    <div className="w-full bg-muted border border-border rounded-lg p-4">
      <div className="flex justify-between items-center w-full">
        <div className="text-sm font-medium">
          {battleState.turn === 'player' ? 'Your turn - Play cards!' : `${opponentName}'s turn`}
        </div>
        <div className="flex gap-2">
          <Dialog open={showDeckModal} onOpenChange={onDeckModalChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Deck ({battleState.playerDeck.cards.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Your Deck</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{battleState.playerDeck.cards.length} cards remaining</p>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {battleState.playerDeck.cards.map((card, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {card.name} ({card.cost}) - {card.effect}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showDiscardModal} onOpenChange={onDiscardModalChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
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
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {card.name} ({card.cost}) - {card.effect}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};