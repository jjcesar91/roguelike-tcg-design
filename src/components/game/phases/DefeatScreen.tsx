import React from 'react';
import { Button } from '@/components/ui/button';

interface DefeatScreenProps {
  onRestart: () => void;
}

export const DefeatScreen: React.FC<DefeatScreenProps> = ({ onRestart }) => {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">💀</div>
      <h1 className="text-4xl font-bold game-title">Defeat</h1>
      <p className="text-xl">You have been defeated. Better luck next time!</p>
      <Button onClick={onRestart} size="lg" className="custom-hover">
        Try Again
      </Button>
    </div>
  );
};