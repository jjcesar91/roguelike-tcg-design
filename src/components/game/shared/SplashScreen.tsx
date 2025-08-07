import React from 'react';
import { Opponent } from '@/types/game/GameState';
import { Badge } from '@/components/ui/badge';
import { Skull } from 'lucide-react';

interface SplashScreenProps {
  showSplashScreen: boolean;
  splashOpponent: Opponent | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  showSplashScreen,
  splashOpponent
}) => {
  if (!showSplashScreen || !splashOpponent) return null;

  const opponentPortraits = {
    'goblin Warrior': "https://i.imgur.com/oC9kaes.png",
    'alpha Wolf': "https://i.imgur.com/By58IEi.png",
    'skeleton Lord': "https://i.imgur.com/k14VZr1.png",
    'bandit Leader': "https://i.imgur.com/VmoKR49.png",
    'ancient Dragon': "https://i.imgur.com/701zzec.png",
    'lich King': "https://i.imgur.com/tGEbCEd.png"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-500">
      <div className="text-center space-y-6">
        {/* Opponent Portrait */}
        <div className="flex justify-center">
          <div className="w-48 h-48 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center border-4 border-amber-700">
            <img 
              src={opponentPortraits[splashOpponent.name as keyof typeof opponentPortraits]} 
              alt={`${splashOpponent.name} Portrait`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Skull className="w-24 h-24" /></div>';
              }}
            />
          </div>
        </div>
        
        {/* Opponent Name */}
        <h1 className="text-4xl font-bold game-title text-amber-100">
          {splashOpponent.name}
        </h1>
        
        {/* Difficulty Level */}
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className={`
              text-lg px-6 py-3 border-2 font-bold
              ${splashOpponent.difficulty === 'basic' ? 'border-green-500 text-green-300' : ''}
              ${splashOpponent.difficulty === 'medium' ? 'border-yellow-500 text-yellow-300' : ''}
              ${splashOpponent.difficulty === 'boss' ? 'border-red-500 text-red-300' : ''}
            `}
          >
            {splashOpponent.difficulty === 'basic' && 'EASY'}
            {splashOpponent.difficulty === 'medium' && 'MEDIUM'}
            {splashOpponent.difficulty === 'boss' && 'BOSS'}
          </Badge>
        </div>
      </div>
    </div>
  );
};