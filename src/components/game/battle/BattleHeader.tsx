import React from 'react';
import { Player, Opponent, BattleState } from '@/types/game/GameState';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Zap, Swords, Skull, Zap as Bolt } from 'lucide-react';
import { StatusEffects } from '@/components/game/shared/StatusEffects';

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
  const playerPortraits = {
    warrior: "https://i.imgur.com/UDCcD6u.png",
    rogue: "https://i.imgur.com/dR6vXfK.png",
    wizard: "https://i.imgur.com/ti7tvRs.png"
  };

  const opponentPortraits = {
    'goblin Warrior': "https://i.imgur.com/oC9kaes.png",
    'alpha Wolf': "https://i.imgur.com/By58IEi.png",
    'skeleton Lord': "https://i.imgur.com/k14VZr1.png",
    'bandit Leader': "https://i.imgur.com/VmoKR49.png",
    'ancient Dragon': "https://i.imgur.com/701zzec.png",
    'lich King': "https://i.imgur.com/tGEbCEd.png"
  };

  return (
    <div className="flex flex-row justify-between items-start w-full">
      {/* Player Stats - Left Aligned */}
      <div className="text-left">
        {/* Player Portrait */}
        <div className="mb-2 flex justify-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center">
            <img 
              src={playerPortraits[player.class]} 
              alt={`${player.class} Portrait`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackIcon = player.class === 'warrior' ? <Swords className="w-8 h-8" /> : 
                                   player.class === 'rogue' ? <Skull className="w-8 h-8" /> : 
                                   <Bolt className="w-8 h-8" />;
                target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400"></div>`;
              }}
            />
          </div>
        </div>
        <div className="font-semibold card-title capitalize flex items-center gap-2">
          {player.class === 'warrior' && <Swords className="w-5 h-5" />}
          {player.class === 'rogue' && <Skull className="w-5 h-5" />}
          {player.class === 'wizard' && <Bolt className="w-5 h-5" />}
          {player.class}
          <Badge variant="outline" className="text-xs">Level {player.level}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span>{player.health}/{player.maxHealth}</span>
        </div>
        <Progress value={(player.health / player.maxHealth) * 100} className="w-24" />
        {battleState.playerBlock > 0 && (
          <div className="flex items-center gap-2 mt-1">
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
      <div className="text-2xl font-bold fantasy-text flex items-center">Vs</div>
      
      {/* Monster Stats - Right Aligned */}
      <div className="text-right">
        {/* Opponent Portrait */}
        <div className="mb-2 flex justify-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center">
            <img 
              src={opponentPortraits[opponent.name as keyof typeof opponentPortraits]} 
              alt={`${opponent.name} Portrait`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Skull className="w-8 h-8" /></div>';
              }}
            />
          </div>
        </div>
        <div className="font-semibold card-title">{opponent.name}</div>
        <div className="flex items-center justify-end gap-2">
          <span>{opponent.health}/{opponent.maxHealth}</span>
          <Heart className="w-4 h-4 text-red-500" />
        </div>
        <Progress value={(opponent.health / opponent.maxHealth) * 100} className="w-24 ml-auto" />
        {battleState.opponentBlock > 0 && (
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-sm text-blue-600">{battleState.opponentBlock} Block</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
        )}
        <StatusEffects effects={battleState.opponentStatusEffects} showTitle={false} />
      </div>
    </div>
  );
};