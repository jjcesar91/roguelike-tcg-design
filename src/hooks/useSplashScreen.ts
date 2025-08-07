import { useState } from 'react';
import { Opponent } from '@/types/game';

export const useSplashScreen = () => {
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const [splashOpponent, setSplashOpponent] = useState<Opponent | null>(null);

  const showBattleSplash = (opponent: Opponent, onSplashComplete?: () => void) => {
    setSplashOpponent(opponent);
    setShowSplashScreen(true);
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setShowSplashScreen(false);
      setSplashOpponent(null);
      if (onSplashComplete) {
        onSplashComplete();
      }
    }, 2000);
  };

  return {
    showSplashScreen,
    splashOpponent,
    showBattleSplash
  };
};