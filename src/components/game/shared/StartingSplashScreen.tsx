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
    <div className={`fixed inset-0 bg-black flex items-center justify-center z-[60] transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-12">
        <img 
          src="https://i.imgur.com/qESwpq9.png" 
          alt="Game Splash Art" 
          className="max-w-full max-h-full object-contain transform scale-90 md:scale-100 lg:scale-110"
          style={{
            maxWidth: '95vw',
            maxHeight: '95vh'
          }}
        />
      </div>
    </div>
  );
};