
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, GameMode, MarbleType, Player, GameSettings } from './types';
import Overlay from './components/Overlay';
import GameScene from './components/GameScene';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: GameMode.EASY,
    musicVolume: 0.5,
    sfxVolume: 0.8,
  });
  
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1', type: MarbleType.RAINBOW, score: 0, hasReachedGill: false, lastDistanceToGill: Infinity },
    { id: 2, name: 'AI Opponent', type: MarbleType.BLACK, score: 0, hasReachedGill: false, lastDistanceToGill: Infinity }
  ]);
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);

  const startGame = useCallback((mode: GameMode) => {
    setSettings(prev => ({ ...prev, difficulty: mode }));
    setGameState(GameState.TOSS_PHASE);
    // Reset players for a new game
    setPlayers(p => p.map(player => ({ ...player, hasReachedGill: false, lastDistanceToGill: Infinity })));
    setWinner(null);
  }, []);

  const handleTossComplete = useCallback((distances: number[]) => {
    // Who is closer to the gill starts first
    const p1Dist = distances[0];
    const p2Dist = distances[1];
    
    setPlayers(prev => [
      { ...prev[0], lastDistanceToGill: p1Dist },
      { ...prev[1], lastDistanceToGill: p2Dist }
    ]);

    if (p1Dist <= p2Dist) {
      setCurrentPlayerIndex(0);
    } else {
      setCurrentPlayerIndex(1);
    }
    
    setGameState(GameState.PLAYING);
  }, []);

  const handleGameOver = useCallback((winningPlayerId: number) => {
    const win = players.find(p => p.id === winningPlayerId);
    if (win) {
      setWinner(win);
      setGameState(GameState.GAME_OVER);
    }
  }, [players]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* 3D Content Container */}
      <div className="absolute inset-0 z-0">
        <GameScene 
          gameState={gameState}
          settings={settings}
          onTossComplete={handleTossComplete}
          onGameOver={handleGameOver}
          currentPlayerIndex={currentPlayerIndex}
          setCurrentPlayerIndex={setCurrentPlayerIndex}
          players={players}
          setPlayers={setPlayers}
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Overlay 
          gameState={gameState}
          setGameState={setGameState}
          settings={settings}
          setSettings={setSettings}
          onStartGame={startGame}
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          winner={winner}
        />
      </div>
    </div>
  );
};

export default App;
