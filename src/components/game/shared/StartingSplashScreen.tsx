import React, { useEffect, useState } from 'react';
import IntroComics from './IntroComics';

interface StartingSplashScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const StartingSplashScreen: React.FC<StartingSplashScreenProps> = ({
  isVisible,
  onComplete
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [showComics, setShowComics] = useState(false);
  const [blackOpacity, setBlackOpacity] = useState(0); // 0 = trasparente, 1 = nero pieno

  useEffect(() => {
    if (!isVisible) return;
    setShowIntro(true);
    setShowComics(false);
    setBlackOpacity(0);

    // 1. Mostra logo per 1.2s
    const logoTimer = setTimeout(() => {
      // 2. Fade in nero sopra il logo (0.7s)
      setBlackOpacity(1);
      // Dopo fade in nero, nascondi logo e mostra i fumetti
      setTimeout(() => {
        setShowIntro(false);
        setShowComics(true);
      }, 700);
    }, 800);

    return () => {
      clearTimeout(logoTimer);
    };
  }, [isVisible]);

  const handleComicsComplete = () => {
    setShowComics(false);
    onComplete();
  };

  if (!isVisible) return null;

  // Fase 1: logo intro con overlay nero che sfuma sopra
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[90]">
        <div className="absolute inset-0 bg-black flex items-center justify-center z-[91]">
          <img
            src="/rekode.png"
            alt="Rekode Logo"
            style={{ width: '50vw', maxWidth: 400, minWidth: 120 }}
            className="transition-all duration-700"
          />
        </div>
        <div
          className="absolute inset-0 z-[92] bg-black transition-opacity duration-700"
          style={{ opacity: blackOpacity, pointerEvents: 'none' }}
        />
      </div>
    );
  }

  // Fase 2: Mostra i fumetti
  if (showComics) {
    return <IntroComics onComplete={handleComicsComplete} />;
  }

  // Fase 3: Fine della sequenza, passa al menu principale
  return null;
};