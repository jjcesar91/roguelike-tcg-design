import React, { useState } from 'react';

interface MainMenuViewProps {
  onNewGame: () => void;
}

const MainMenuView: React.FC<MainMenuViewProps> = ({ onNewGame }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setShowButtons(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleSettings = () => {
    setShowSettings(true);
    setTimeout(() => setShowSettings(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-end">
      {/* Background image full vertical fit */}
      <img
        src="https://i.imgur.com/LBarWii.png"
        alt="Main Menu Background"
        className="absolute inset-0 w-full h-full object-contain object-center select-none pointer-events-none"
        style={{ height: '100vh', width: '100vw', zIndex: 0 }}
        draggable={false}
      />
      {/* Pulsanti con fade-in dopo 2s */}
      <div
        className={`flex flex-col gap-4 w-full max-w-sm mb-16 px-4 z-10 transition-opacity duration-700 ${showButtons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          className="w-full py-4 rounded bg-indigo-900 text-blue-100 text-xl font-bold shadow-lg hover:bg-indigo-700 hover:text-white transition"
          onClick={onNewGame}
        >
          New Game
        </button>
        <button
          className="w-full py-4 rounded bg-slate-800 text-blue-100 text-xl font-bold shadow-lg hover:bg-indigo-700 hover:text-white transition"
          onClick={handleSettings}
        >
          Settings
        </button>
      </div>
      {showSettings && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[--card] text-[--card-foreground] px-6 py-3 rounded shadow-lg text-lg animate-fade-in-out z-[60] border border-[--border]">
          Not implemented yet.
        </div>
      )}
    </div>
  );
};

export default MainMenuView;
