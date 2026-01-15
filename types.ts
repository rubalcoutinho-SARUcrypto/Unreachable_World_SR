
export enum GameMode {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum GameState {
  START = 'START',
  SETTINGS = 'SETTINGS',
  MODE_SELECT = 'MODE_SELECT',
  TOSS_PHASE = 'TOSS_PHASE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum MarbleType {
  RAINBOW = 'RAINBOW',
  BLACK = 'BLACK'
}

export interface Player {
  id: number;
  name: string;
  type: MarbleType;
  score: number;
  hasReachedGill: boolean;
  lastDistanceToGill: number;
}

export interface GameSettings {
  difficulty: GameMode;
  musicVolume: number;
  sfxVolume: number;
}
