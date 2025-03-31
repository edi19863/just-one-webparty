
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
  host_id: string;  // Changed from hostId to host_id to match Supabase column
  status: GameStatus;
  players: Player[];
  current_round: Round | null;  // Changed from currentRound to current_round
  rounds: Round[];
  created_at: string; // ISO string format for timestamp without timezone
  updated_at: string; // ISO string format for timestamp without timezone
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
