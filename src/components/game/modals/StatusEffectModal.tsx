import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, AlertTriangle, TrendingUp, Target, Droplets, Shield } from 'lucide-react';

interface StatusEffectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  statusType: string;
  statusValue?: number;
  statusDuration?: number;
}

export const StatusEffectModal: React.FC<StatusEffectModalProps> = ({
  isOpen,
  onOpenChange,
  statusType,
  statusValue,
  statusDuration
}) => {
  const getStatusInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case 'weak':
        return {
          name: 'Weak',
          icon: <TrendingDown className="w-8 h-8" />,
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          description: 'Reduces damage dealt by Attack cards by 50%.',
          mechanics: [
            'Weak only affects Attack type cards',
            'Attack cards deal 50% less damage when Weak is active',
            'Weak does not stack - multiple applications refresh duration',
            'The number indicates duration (e.g., "Weak 2" lasts 2 turns)',
            'Weak affects the attacker\'s damage output',
            'Skills, Powers, and other card types are unaffected by Weak'
          ]
        };
      case 'vulnerable':
        return {
          name: 'Vulnerable',
          icon: <AlertTriangle className="w-8 h-8" />,
          color: 'bg-red-100 text-red-800 border-red-300',
          description: 'Increases damage taken by 50%.',
          mechanics: [
            'Vulnerable does not stack - multiple applications refresh duration',
            'All incoming damage is increased by 50%',
            'Duration resets when new vulnerable is applied',
            'Affects all damage types received'
          ]
        };
      case 'strength':
        return {
          name: 'Strength',
          icon: <TrendingUp className="w-8 h-8" />,
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          description: 'Increases damage dealt by 3 per stack.',
          mechanics: [
            'Each stack of strength adds +3 damage to all attacks',
            'Strength stacks additively',
            'Duration resets when new strength is applied',
            'Affects all damage-dealing cards and abilities'
          ]
        };
      case 'dexterity':
        return {
          name: 'Dexterity',
          icon: <Target className="w-8 h-8" />,
          color: 'bg-green-100 text-green-800 border-green-300',
          description: 'Increases block gained by 1 per stack.',
          mechanics: [
            'Each stack of dexterity adds +1 block to all defense cards',
            'Dexterity stacks additively',
            'Duration resets when new dexterity is applied',
            'Affects all block-gaining cards and abilities'
          ]
        };
      case 'bleeding':
        return {
          name: 'Bleeding',
          icon: <Droplets className="w-8 h-8" />,
          color: 'bg-red-200 text-red-900 border-red-400',
          description: 'Deals damage at the start of each turn.',
          mechanics: [
            'Bleeding deals damage equal to its stack count each turn',
            'Maximum of 5 bleeding stacks can be applied',
            'Bleeding does not decrease over time naturally',
            'Reduces damage dealt by 1 per stack',
            'Damage occurs at the start of the affected character\'s turn'
          ]
        };
      case 'evasive':
        return {
          name: 'Evasive',
          icon: <Shield className="w-8 h-8" />,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          description: 'Prevents the next damage from Melee or Attack type cards.',
          mechanics: [
            'Evasive prevents all damage from the next Melee or Attack card',
            'Each stack of Evasive can prevent one attack',
            'Evasive stacks up to 3 times maximum',
            'When damage is prevented, one Evasive stack is consumed',
            'Evasive is not consumed by non-attack damage (like bleeding)',
            'If Evasive reaches 0 stacks, the status effect is removed'
          ]
        };
      default:
        return {
          name: type.charAt(0).toUpperCase() + type.slice(1),
          icon: <span className="text-2xl font-bold">?</span>,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          description: 'Unknown status effect.',
          mechanics: ['No mechanics information available.']
        };
    }
  };

  const statusInfo = getStatusInfo(statusType);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 rounded-lg ${statusInfo.color}`}>
              {statusInfo.icon}
            </div>
            {statusInfo.name}
            {statusValue !== undefined && (statusType === 'bleeding' || statusType === 'evasive') && (
              <Badge variant="outline" className="ml-2">
                {statusValue} {statusType === 'evasive' ? 'stacks' : 'stacks'}
              </Badge>
            )}
            {statusDuration !== undefined && statusType !== 'bleeding' && statusType !== 'evasive' && (
              <Badge variant="outline" className="ml-2">
                {statusDuration} turns
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Description</h4>
            <p className="text-sm">{statusInfo.description}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Mechanics</h4>
            <ul className="text-sm space-y-1">
              {statusInfo.mechanics.map((mechanic, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  {mechanic}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};