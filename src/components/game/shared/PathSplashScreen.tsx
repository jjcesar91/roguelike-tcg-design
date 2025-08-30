import React, { useEffect, useState } from 'react';

interface PathSplashScreenProps {
  isVisible: boolean;
  thumbnail: string;
  title: string;
  subtitle?: string;
  onComplete: () => void;
}

export const PathSplashScreen: React.FC<PathSplashScreenProps> = ({
  isVisible,
  thumbnail,
  title,
  subtitle,
  onComplete
}) => {
  const [showTap, setShowTap] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const tapTimer = setTimeout(() => {
      setShowTap(true);
      setCanContinue(true);
    }, 1500);
    return () => clearTimeout(tapTimer);
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
      <div className="w-full h-full flex flex-col items-center justify-center p-0 relative">
        <img
          src={thumbnail}
          alt="Path Splash Art"
          className="absolute left-1/2 top-0 -translate-x-1/2 z-0"
          style={{ height: '100vh', width: 'auto', objectFit: 'contain', maxWidth: 'none', minWidth: '0' }}
        />
        <div className="relative z-10 w-full flex flex-col items-center justify-center h-full">
          <div className="text-center mb-8 mt-16 bg-black/40 rounded-xl px-6 py-4">
            <h1 className="text-4xl md:text-5xl font-bold text-amber-200 drop-shadow-lg mb-2">{title}</h1>
            {subtitle && <h2 className="text-2xl md:text-3xl text-amber-100 drop-shadow mb-2">{subtitle}</h2>}
          </div>
        </div>
        {showTap && (
          <div className="absolute bottom-10 left-0 w-full flex justify-center z-20">
            <span className="text-2xl md:text-3xl text-amber-200 animate-pulse font-bold drop-shadow-lg select-none pointer-events-none">
              Tap to continue
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
