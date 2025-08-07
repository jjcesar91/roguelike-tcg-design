import React from 'react';
import { PlayerClass } from '@/types/game/GameState';
import { Button } from '@/components/ui/button';
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, Skull, Zap } from 'lucide-react';

interface ClassSelectionProps {
  onClassSelect: (playerClass: PlayerClass) => void;
  availableClasses: PlayerClass[];
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({
  onClassSelect,
  availableClasses
}) => {
  const playerPortraits = {
    warrior: "https://i.imgur.com/UDCcD6u.png",
    rogue: "https://i.imgur.com/dR6vXfK.png",
    wizard: "https://i.imgur.com/ti7tvRs.png"
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold text-center game-title">Choose Your Class</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availableClasses.map((playerClass) => (
          <button
            key={playerClass}
            onClick={() => {
              if (playerClass === 'warrior') {
                console.log('Button clicked for:', playerClass);
                onClassSelect(playerClass);
              }
            }}
            disabled={playerClass !== 'warrior'}
            className={`p-4 border-2 rounded-lg transition-colors ${
              playerClass === 'warrior' 
                ? 'border-amber-700 hover:border-amber-800 hover:bg-amber-100 cursor-pointer' 
                : 'border-amber-400 bg-background opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              {/* Class Portrait */}
              <div className="mb-4 flex justify-center">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-background flex items-center justify-center">
                  {playerClass === 'warrior' && (
                    <img 
                      src={playerPortraits.warrior} 
                      alt="Warrior Portrait" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Swords className="w-16 h-16" /></div>';
                      }}
                    />
                  )}
                  {playerClass === 'rogue' && (
                    <img 
                      src={playerPortraits.rogue} 
                      alt="Rogue Portrait" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Skull className="w-16 h-16" /></div>';
                      }}
                    />
                  )}
                  {playerClass === 'wizard' && (
                    <img 
                      src={playerPortraits.wizard} 
                      alt="Wizard Portrait" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Zap className="w-16 h-16" /></div>';
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="capitalize flex items-center justify-center gap-2 text-xl font-bold mb-2">
                {playerClass === 'warrior' && <Swords className="w-6 h-6" />}
                {playerClass === 'rogue' && <Skull className="w-6 h-6" />}
                {playerClass === 'wizard' && <Zap className="w-6 h-6" />}
                {playerClass}
                {playerClass !== 'warrior' && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Coming soon</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {playerClass === 'warrior' && 'Master of combat and defense'}
                {playerClass === 'rogue' && 'Swift and deadly assassin'}
                {playerClass === 'wizard' && 'Wielder of arcane powers'}
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold card-title">Starting Cards:</h4>
                <div className="space-y-1">
                  <div className="text-sm">• Strike - Deal 6 damage</div>
                  <div className="text-sm">• Defend - Gain 5 block</div>
                  <div className="text-sm">• {playerClass === 'warrior' && 'Bash - Deal 8 damage'}
                    {playerClass === 'rogue' && 'Backstab - Deal 10 damage'}
                    {playerClass === 'wizard' && 'Zap - Deal 8 damage'}
                  </div>
                </div>
              </div>
              {playerClass !== 'warrior' && (
                <div className="mt-4 text-xs text-red-600 font-semibold">
                  This class is not available yet
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="text-center text-sm text-muted-foreground mt-4">
        Currently only Warrior class is available. More classes coming soon!
      </div>
    </div>
  );
};