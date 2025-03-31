
export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isGuesser: boolean;
}

export interface Clue {
  playerId: string;
  playerName: string;
  word: string;
  filtered: boolean;
}

export interface Round {
  roundNumber: number;
  secretWord: string;
  guesserId: string;
  guesserName: string;
  clues: Clue[];
  guess: string | null;
  correct: boolean | null;
  completed: boolean;
}

export interface Game {
  id: string;
  code: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  currentRound: Round | null;
  rounds: Round[];
  createdAt: number;
  updatedAt: number;
}

export enum GameStatus {
  LOBBY = 'lobby',
  SELECTING_WORD = 'selecting_word',
  SUBMITTING_CLUES = 'submitting_clues',
  REVIEWING_CLUES = 'reviewing_clues',
  GUESSING = 'guessing',
  ROUND_RESULT = 'round_result',
  GAME_OVER = 'game_over'
}
