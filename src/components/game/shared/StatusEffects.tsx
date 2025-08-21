import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, AlertTriangle, TrendingUp, Target, Droplets, Shield } from 'lucide-react';
import { StatusEffectModal } from '@/components/game/modals/StatusEffectModal';
import { getStatusDisplayDuration } from '@/lib/gameUtils';
import { ModType } from "@/content/modules/mods";

interface StatusEffectsProps {
  effects: any[];
  showTitle?: boolean;
  title?: string;
  isOpponent?: boolean;
}

export const StatusEffects: React.FC<StatusEffectsProps> = ({
  effects,
  showTitle = false,
  title,
  isOpponent = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState<{
    type: string;
    value?: number;
    duration?: number;
  } | null>(null);

  if (effects.length === 0) return null;
  
  const getStatusBadgeStyle = (effectType: string) => {
    switch (effectType) {
      case 'weak':
        return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 cursor-pointer';
      case 'vulnerable':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 cursor-pointer';
      case 'strength':
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 cursor-pointer';
      case 'dexterity':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer';
      case 'bleeding':
        return 'bg-red-200 text-red-900 border-red-400 hover:bg-red-300 cursor-pointer';
      case 'evasive':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 cursor-pointer';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 cursor-pointer';
    }
  };
  
  const handleBadgeClick = (effect: any) => {
    setSelectedStatus({
      type: effect.type,
      value: effect.value,
      duration: effect.duration > 0 ? getStatusDisplayDuration(effect.type, effect.duration) : undefined
    });
  };
  
  return (
    <>
      <div className={`mt-2 ${isOpponent ? 'text-right' : 'text-left'}`}>
        <div className={`flex ${isOpponent ? 'flex-col items-end' : 'flex-col items-start'} gap-1`}>
          {effects.map((effect, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className={`text-xs font-medium ${getStatusBadgeStyle(effect.type)}`}
              onClick={() => handleBadgeClick(effect)}
            >
              {effect.type === ModType.WEAK && <TrendingDown className="w-3 h-3 mr-1" />}
              {effect.type === ModType.VULNERABLE && <AlertTriangle className="w-3 h-3 mr-1" />}
              {effect.type === ModType.STRENGTH && <TrendingUp className="w-3 h-3 mr-1" />}
              {effect.type === ModType.DEXTERITY && <Target className="w-3 h-3 mr-1" />}
              {effect.type === ModType.BLEEDING && <Droplets className="w-3 h-3 mr-1" />}
              {effect.type === ModType.EVASIVE && <Shield className="w-3 h-3 mr-1" />}
              {effect.type} {effect.type === ModType.BLEEDING ? effect.value : effect.type === ModType.EVASIVE ? effect.value : `(${getStatusDisplayDuration(effect.type, effect.duration)})`}
            </Badge>
          ))}
        </div>
      </div>

      {selectedStatus && (
        <StatusEffectModal
          isOpen={!!selectedStatus}
          onOpenChange={(open) => !open && setSelectedStatus(null)}
          statusType={selectedStatus.type}
          statusValue={selectedStatus.value}
          statusDuration={selectedStatus.duration}
        />
      )}
    </>
  );
};