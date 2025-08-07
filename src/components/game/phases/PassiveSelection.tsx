import React from 'react';
import { Button } from '@/components/ui/button';
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PassiveSelectionProps {
  player: any;
  availablePassives: any[];
  selectedPassive: string | null;
  onPassiveSelect: (passiveId: string) => void;
  onConfirm: () => void;
}

export const PassiveSelection: React.FC<PassiveSelectionProps> = ({
  player,
  availablePassives,
  selectedPassive,
  onPassiveSelect,
  onConfirm
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold game-title">Choose a Passive Ability</h2>
        <p className="text-muted-foreground mt-2">
          Select a permanent passive ability that will enhance your deck
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availablePassives.map((passive, index) => (
          <CardComponent 
            key={index} 
            className={`cursor-pointer hover:shadow-md transition-all ${
              selectedPassive === passive.id ? 'ring-2 ring-primary scale-105' : ''
            }`}
            onClick={() => onPassiveSelect(passive.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                {passive.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-3">{passive.description}</CardDescription>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {passive.class}
                </Badge>
                <Badge variant="secondary">Passive</Badge>
              </div>
            </CardContent>
          </CardComponent>
        ))}
      </div>
      
      {selectedPassive && (
        <div className="flex justify-center">
          <Button 
            onClick={onConfirm}
            size="lg"
          >
            Confirm Selection
          </Button>
        </div>
      )}
    </div>
  );
};