import React from 'react';
import { PlayerClass } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card as CardComponent, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { playerClasses } from '@/data/gameData';

interface ClassSelectionProps {
  onClassSelect: (playerClass: PlayerClass) => void;
  availableClasses: PlayerClass[];
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({
  onClassSelect,
  availableClasses
}) => {
  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold text-center game-title">Choose Your Class</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availableClasses.map((playerClass) => {
          const classData = playerClasses[playerClass];
          const ClassIcon = classData.icon;
          
          return (
            <button
              key={playerClass}
              onClick={() => {
                if (classData.available) {
                  console.log('Button clicked for:', playerClass);
                  onClassSelect(playerClass);
                }
              }}
              disabled={!classData.available}
              className={`p-4 border-2 rounded-lg transition-colors ${
                classData.available 
                  ? 'border-amber-700 hover:border-amber-800 hover:bg-amber-100 cursor-pointer' 
                  : 'border-amber-400 bg-background opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="text-center">
                {/* Class Portrait */}
                <div className="mb-4 flex justify-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-background flex items-center justify-center">
                    <img 
                      src={classData.portrait} 
                      alt={`${classData.name} Portrait`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400"></div>`;
                      }}
                    />
                  </div>
                </div>
                <div className="capitalize flex items-center justify-center gap-2 text-xl font-bold mb-2">
                  <ClassIcon className="w-6 h-6" />
                  {classData.name}
                  {!classData.available && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Coming soon</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {classData.description}
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold card-title">Starting Cards:</h4>
                  <div className="space-y-1">
                    {classData.startingCards.map((card, index) => (
                      <div key={index} className="text-sm">• {card}</div>
                    ))}
                  </div>
                </div>
                {!classData.available && (
                  <div className="mt-4 text-xs text-red-600 font-semibold">
                    This class is not available yet
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-center text-sm text-muted-foreground mt-4">
        Currently only Warrior class is available. More classes coming soon!
      </div>
    </div>
  );
};