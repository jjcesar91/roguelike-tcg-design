import React, { useEffect, useState } from 'react';

interface StartingSplashScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const StartingSplashScreen: React.FC<StartingSplashScreenProps> = ({
  isVisible,
  onComplete
}) => {
  const [showTap, setShowTap] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    // Dopo 1.5s mostra il tap
    const tapTimer = setTimeout(() => {
      setShowTap(true);
      setCanContinue(true);
    }, 1500);
    return () => {
      clearTimeout(tapTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleContinue = () => {
    if (canContinue) {
      setShowTap(false);
      setCanContinue(false);
      onComplete();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-[60] transition-opacity duration-500"
      onClick={handleContinue}
      style={{ cursor: canContinue ? 'pointer' : 'default' }}
    >
      <div className="w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-12 relative">
        <img
          src="https://i.imgur.com/f8z9ye7.jpeg"
          alt="Game Splash Art"
          className="max-w-full max-h-full object-contain transform scale-90 md:scale-100 lg:scale-110"
          style={{
            maxWidth: '95vw',
            maxHeight: '95vh'
          }}
        />
        {showTap && (
          <div className="absolute bottom-10 left-0 w-full flex justify-center">
            <span className="text-2xl md:text-3xl text-amber-200 animate-pulse font-bold drop-shadow-lg select-none pointer-events-none">
              Tap to continue
            </span>
          </div>
        )}
      </div>
    </div>
  );
};