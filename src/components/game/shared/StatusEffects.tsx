import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, AlertTriangle, TrendingUp, Target } from 'lucide-react';

interface StatusEffectsProps {
  effects: any[];
  showTitle?: boolean;
  title?: string;
}

export const StatusEffects: React.FC<StatusEffectsProps> = ({
  effects,
  showTitle = true,
  title
}) => {
  if (effects.length === 0) return null;
  
  return (
    <div className="mt-2">
      {showTitle && title && (
        <h4 className="text-xs font-semibold text-muted-foreground mb-1">{title}</h4>
      )}
      <div className="flex flex-wrap gap-1">
        {effects.map((effect, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {effect.type === 'weak' && <TrendingDown className="w-3 h-3 mr-1" />}
            {effect.type === 'vulnerable' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {effect.type === 'strength' && <TrendingUp className="w-3 h-3 mr-1" />}
            {effect.type === 'dexterity' && <Target className="w-3 h-3 mr-1" />}
            {effect.type} {effect.value} ({effect.duration - 1})
          </Badge>
        ))}
      </div>
    </div>
  );
};