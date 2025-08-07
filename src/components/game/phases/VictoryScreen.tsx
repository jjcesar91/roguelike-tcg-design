import React from 'react';
import { Button } from '@/components/ui/button';

interface VictoryScreenProps {
  onRestart: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ onRestart }) => {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <h1 className="text-4xl font-bold game-title">Victory!</h1>
      <p className="text-xl">Congratulations! You have conquered all challenges!</p>
      <Button onClick={onRestart} size="lg">
        Play Again
      </Button>
    </div>
  );
};