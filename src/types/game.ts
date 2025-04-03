
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

export interface ClueStatus {
  playerId: string;
  playerName: string;
  status: 'unique' | 'duplicate' | 'undecided';
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

export enum GameMode {
  IRL = 'irl',
  ONLINE = 'online'
}

export interface Game {
  id: string;
  code: string;
  host_id: string;
  status: GameStatus;
  mode: GameMode;
  players: Player[];
  current_round: Round | null;
  rounds: Round[];
  created_at: string;
  updated_at: string;
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

// Stati specifici per la modalità IRL
export enum IRLStatus {
  WAITING_FOR_CLUES = 'waiting_for_clues',
  COMPARING_CLUES = 'comparing_clues',
  WAITING_FOR_GUESS = 'waiting_for_guess'
}
