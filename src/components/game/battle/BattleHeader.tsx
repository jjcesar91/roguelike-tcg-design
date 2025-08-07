import React from 'react';
import { Player, Opponent, BattleState } from '@/types/game';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Zap, Skull } from 'lucide-react';
import { StatusEffects } from '@/components/game/shared/StatusEffects';
import { playerClasses } from '@/data/gameData';

interface BattleHeaderProps {
  player: Player;
  opponent: Opponent;
  battleState: BattleState;
}

export const BattleHeader: React.FC<BattleHeaderProps> = ({
  player,
  opponent,
  battleState
}) => {
  const playerClassData = playerClasses[player.class];
  const PlayerIcon = playerClassData.icon;

  return (
    <div className="flex flex-row justify-between items-start w-full relative">
      {/* Player Stats - Left Aligned */}
      <div className="flex-1 text-left pr-8">
        {/* Player Portrait */}
        <div className="mb-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center border-2 border-amber-200">
            <img 
              src={playerClassData.portrait} 
              alt={`${playerClassData.name} Portrait`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400"><PlayerIcon className="w-10 h-10" /></div>`;
              }}
            />
          </div>
        </div>
        <div className="font-semibold card-title capitalize flex items-center gap-2 mb-2">
          <PlayerIcon className="w-5 h-5" />
          {playerClassData.name}
          <Badge variant="outline" className="text-xs">Level {player.level}</Badge>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-sm">{player.health}/{player.maxHealth}</span>
        </div>
        <Progress value={(player.health / player.maxHealth) * 100} className="w-28 h-2 mb-2" />
        {battleState.playerBlock > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600">{battleState.playerBlock} Block</span>
          </div>
        )}
        <StatusEffects 
          effects={battleState.playerStatusEffects} 
          showTitle={true} 
          title="Player Effects" 
        />
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: battleState.playerEnergy }, (_, i) => (
            <Zap key={i} className="w-4 h-4 text-blue-500" />
          ))}
        </div>
      </div>
      
      {/* VS - Center */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-3xl font-bold fantasy-text text-amber-700 bg-amber-100 px-4 py-2 rounded-full border-2 border-amber-300">
          Vs
        </div>
      </div>
      
      {/* Monster Stats - Right Aligned */}
      <div className="flex-1 text-right pl-8">
        {/* Opponent Portrait */}
        <div className="mb-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center border-2 border-amber-200 ml-auto">
            <img 
              src={opponent.portrait} 
              alt={`${opponent.name} Portrait`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Skull className="w-10 h-10" /></div>';
              }}
            />
          </div>
        </div>
        <div className="font-semibold card-title mb-2">{opponent.name}</div>
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-sm">{opponent.health}/{opponent.maxHealth}</span>
          <Heart className="w-4 h-4 text-red-500" />
        </div>
        <Progress value={(opponent.health / opponent.maxHealth) * 100} className="w-28 h-2 mb-2 ml-auto" />
        {battleState.opponentBlock > 0 && (
          <div className="flex items-center justify-end gap-2 mb-2">
            <span className="text-sm text-blue-600">{battleState.opponentBlock} Block</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
        )}
        <StatusEffects effects={battleState.opponentStatusEffects} showTitle={false} />
      </div>
    </div>
  );
};