import React, { useEffect, useState } from 'react';

interface StartingSplashScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const StartingSplashScreen: React.FC<StartingSplashScreenProps> = ({
  isVisible,
  onComplete
}) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Start fading after 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1500);

    // Complete after 2 seconds total
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full h-full flex items-center justify-center p-8">
        <img 
          src="https://i.imgur.com/qESwpq9.png" 
          alt="Game Splash Art" 
          className="max-w-full max-h-full object-contain"
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh'
          }}
        />
      </div>
    </div>
  );
};