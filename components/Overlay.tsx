
import React from 'react';
import { GameState, GameMode, GameSettings, Player, MarbleType } from '../types';

interface OverlayProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onStartGame: (mode: GameMode) => void;
  players: Player[];
  currentPlayerIndex: number;
  winner: Player | null;
}

const Overlay: React.FC<OverlayProps> = ({ 
  gameState, 
  setGameState, 
  settings, 
  setSettings, 
  onStartGame, 
  players, 
  currentPlayerIndex,
  winner 
}) => {
  const renderScreen = () => {
    switch (gameState) {
      case GameState.START:
        return (
          <div className="flex flex-col items-center justify-center h-full pointer-events-auto bg-black/60 backdrop-blur-sm">
            <h1 className="text-7xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-blue-400 animate-pulse">
              BLACK MARBLE MASTER
            </h1>
            <p className="text-gray-400 mb-12 text-lg uppercase tracking-widest">Master the Floating Desk</p>
            
            <div className="flex flex-col gap-4 w-64">
              <button 
                onClick={() => setGameState(GameState.MODE_SELECT)}
                className="py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                ENTER THE ARENA
              </button>
              <button 
                onClick={() => setGameState(GameState.SETTINGS)}
                className="py-4 border border-white/20 text-white rounded-full hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                SETTINGS
              </button>
            </div>
          </div>
        );

      case GameState.MODE_SELECT:
        return (
          <div className="flex flex-col items-center justify-center h-full pointer-events-auto bg-black/80">
            <h2 className="text-4xl font-light mb-12 tracking-[0.3em]">SELECT INTENSITY</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full px-4">
              {[GameMode.EASY, GameMode.MEDIUM, GameMode.HARD].map(mode => (
                <button 
                  key={mode}
                  onClick={() => onStartGame(mode)}
                  className="group relative h-64 border border-white/10 rounded-2xl overflow-hidden hover:border-white/50 transition-all flex flex-col items-center justify-center bg-zinc-900/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                  <span className="relative text-2xl font-bold tracking-widest">{mode}</span>
                  <p className="relative text-xs text-gray-500 mt-2">
                    {mode === GameMode.EASY ? 'Larger Gill • Lower Friction' : 
                     mode === GameMode.MEDIUM ? 'Standard Play • Fair AI' : 
                     'Tiny Gill • High Stakes'}
                  </p>
                </button>
              ))}
            </div>
            <button onClick={() => setGameState(GameState.START)} className="mt-12 text-gray-500 hover:text-white transition-colors">GO BACK</button>
          </div>
        );

      case GameState.SETTINGS:
        return (
          <div className="flex flex-col items-center justify-center h-full pointer-events-auto bg-zinc-900">
            <div className="w-full max-w-md p-8 bg-black rounded-3xl border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-widest">Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-2">Music Volume</label>
                  <input 
                    type="range" 
                    value={settings.musicVolume * 100} 
                    onChange={(e) => setSettings(s => ({ ...s, musicVolume: parseInt(e.target.value) / 100 }))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-2">SFX Volume</label>
                  <input 
                    type="range" 
                    value={settings.sfxVolume * 100} 
                    onChange={(e) => setSettings(s => ({ ...s, sfxVolume: parseInt(e.target.value) / 100 }))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              <button 
                onClick={() => setGameState(GameState.START)}
                className="mt-12 w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all"
              >
                SAVE & EXIT
              </button>
            </div>
          </div>
        );

      case GameState.TOSS_PHASE:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-20">
            <div className="bg-black/50 border border-white/10 px-8 py-4 rounded-full backdrop-blur-md">
              <h3 className="text-xl font-bold tracking-widest animate-pulse">TOSS PHASE</h3>
              <p className="text-xs text-gray-400 text-center uppercase mt-1">Flick towards the Gill to decide who goes first</p>
            </div>
          </div>
        );

      case GameState.PLAYING:
        const current = players[currentPlayerIndex];
        return (
          <div className="absolute inset-0 flex flex-col pointer-events-none">
            {/* Top HUD */}
            <div className="p-8 flex justify-between items-start">
              <div className="flex gap-4">
                {players.map((p, i) => (
                  <div 
                    key={p.id} 
                    className={`px-6 py-3 rounded-2xl border transition-all ${
                      currentPlayerIndex === i ? 'bg-white text-black border-white scale-110 shadow-lg' : 'bg-black/40 text-white border-white/10'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-60">Player {i+1}</div>
                    <div className="text-lg font-black flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${p.type === MarbleType.RAINBOW ? 'bg-gradient-to-tr from-red-500 via-green-500 to-blue-500' : 'bg-zinc-700 shadow-inner'}`}></div>
                      {p.name}
                    </div>
                    {p.hasReachedGill && <div className="text-[10px] text-green-500 font-bold">GILL SECURED</div>}
                  </div>
                ))}
              </div>
              
              <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="text-xs uppercase text-gray-500">Difficulty</div>
                <div className="font-bold text-lg">{settings.difficulty}</div>
              </div>
            </div>

            {/* Hint */}
            <div className="mt-auto mb-12 flex justify-center">
              <div className="bg-white/10 backdrop-blur-xl px-12 py-6 rounded-3xl border border-white/5 max-w-md text-center">
                <p className="text-lg font-light leading-relaxed">
                  {current.hasReachedGill 
                    ? `TARGET: Strike the opponent's marble!` 
                    : `TARGET: Land in the center hole (Gill)!`}
                </p>
                <p className="text-xs text-gray-500 uppercase mt-2">Click and drag from your marble to aim and shoot</p>
              </div>
            </div>
          </div>
        );

      case GameState.GAME_OVER:
        return (
          <div className="flex flex-col items-center justify-center h-full pointer-events-auto bg-black/90 backdrop-blur-lg">
            <h2 className="text-8xl font-black mb-4 italic tracking-tighter">VICTORY</h2>
            <div className={`text-4xl font-bold mb-12 ${winner?.type === MarbleType.RAINBOW ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-green-400 to-blue-400' : 'text-zinc-400'}`}>
              {winner?.name}
            </div>
            
            <div className="flex gap-6">
              <button 
                onClick={() => onStartGame(settings.difficulty)}
                className="px-12 py-5 bg-white text-black font-bold rounded-full hover:scale-110 transition-all"
              >
                PLAY AGAIN
              </button>
              <button 
                onClick={() => setGameState(GameState.START)}
                className="px-12 py-5 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full relative">
      {renderScreen()}
    </div>
  );
};

export default Overlay;
