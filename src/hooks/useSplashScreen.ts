import { useState } from 'react';
import { Opponent } from '@/types/game';

export const useSplashScreen = () => {
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const [splashOpponent, setSplashOpponent] = useState<Opponent | null>(null);
  const [splashCompleted, setSplashCompleted] = useState(false);

  const showBattleSplash = (opponent: Opponent, onSplashComplete?: () => void) => {
    setSplashOpponent(opponent);
    setShowSplashScreen(true);
    setSplashCompleted(false);
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setShowSplashScreen(false);
      setSplashOpponent(null);
      setSplashCompleted(true);
      if (onSplashComplete) {
        onSplashComplete();
      }
    }, 2000);
  };

  return {
    showSplashScreen,
    splashOpponent,
    splashCompleted,
    showBattleSplash
  };
};