
import { Game, GameStatus, Player, Round, Clue, GameMode, IRLStatus } from "@/types/game";
import { checkWordSimilarity } from "./wordUtils";

// Generate a random 5-character alphanumeric code
export const generateGameCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar characters like 0, O, 1, I
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Generate a random player ID
export const generatePlayerId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create a new game with the given host player
export const createNewGame = (hostId: string, hostNickname: string, mode: GameMode = GameMode.ONLINE): Game => {
  const code = generateGameCode();
  const host: Player = {
    id: hostId,
    nickname: hostNickname,
    isHost: true,
    isGuesser: false
  };

  return {
    id: generatePlayerId(),
    code: code,
    host_id: hostId,
    status: GameStatus.LOBBY,
    mode: mode, // This won't be stored in the database, but used client-side
    players: [host],
    current_round: null,
    rounds: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Add a player to the game
export const addPlayerToGame = (game: Game, nickname: string): { game: Game, playerId: string } => {
  const playerId = generatePlayerId();
  const player: Player = {
    id: playerId,
    nickname,
    isHost: false,
    isGuesser: false
  };

  const updatedGame = {
    ...game,
    players: [...game.players, player],
    updated_at: new Date().toISOString()
  };

  return { game: updatedGame, playerId };
};

// Start a new round
export const startNewRound = (game: Game): Game => {
  // Words for the game in Italian
  const words = [
    "MELA", "SPIAGGIA", "SEDIA", "DANZA", "AQUILA", "FIORE", "CHITARRA", "MIELE", 
    "ISOLA", "GIUNGLA", "BOLLITORE", "LIMONE", "MONTAGNA", "ROMANZO", "OCEANO", 
    "PIANOFORTE", "TRAPUNTA", "FIUME", "TRAMONTO", "TIGRE", "OMBRELLO", "VIOLINO", 
    "FINESTRA", "XILOFONO", "GIALLO", "ZEBRA", "PALLONCINO", "MACCHINA", "DELFINO",
    "FORESTA", "GIARDINO", "MARTELLO", "GIACCA", "CUCINA", "COMPUTER", "MAGNETE",
    "AGO", "ARANCIA", "MATITA", "RAZZO", "PANINO", "TARTARUGA", "VULCANO", 
    "PIZZA", "GELATO", "CAFFÈ", "PASTA", "VINO", "FORMAGGIO", "BICICLETTA", 
    "CINEMA", "TEATRO", "MUSICA", "LIBRO", "TAVOLO", "PENNA", "CAMICIA", "SCARPA"
  ];
  
  // Determine the guesser - rotate through players
  let nextGuesserIndex = 0;
  const lastRound = game.rounds.length > 0 ? game.rounds[game.rounds.length - 1] : null;
  
  if (lastRound) {
    // Find the index of the last guesser
    const lastGuesserIndex = game.players.findIndex(p => p.id === lastRound.guesserId);
    // Get the next player as guesser (wrap around if needed)
    nextGuesserIndex = (lastGuesserIndex + 1) % game.players.length;
  }

  const guesser = game.players[nextGuesserIndex];
  
  // Pick a random word
  const randomWord = words[Math.floor(Math.random() * words.length)];
  
  const roundNumber = game.rounds.length + 1;
  
  const newRound: Round = {
    roundNumber,
    secretWord: randomWord,
    guesserId: guesser.id,
    guesserName: guesser.nickname,
    clues: [],
    guess: null,
    correct: null,
    completed: false
  };
  
  // Update player roles
  const updatedPlayers = game.players.map(player => ({
    ...player,
    isGuesser: player.id === guesser.id
  }));
  
  // Set appropriate status based on game mode
  const newStatus = game.mode === GameMode.ONLINE ? 
    GameStatus.SUBMITTING_CLUES : 
    GameStatus.SUBMITTING_CLUES; // In IRL mode, we still use the same status
  
  return {
    ...game,
    players: updatedPlayers,
    status: newStatus,
    current_round: newRound,
    rounds: [...game.rounds, newRound],
    updated_at: new Date().toISOString()
  };
};

// Add a clue from a player
export const addClue = (game: Game, playerId: string, word: string): Game => {
  if (!game.current_round) return game;
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) return game;
  
  const clue: Clue = {
    playerId,
    playerName: player.nickname,
    word: word.toUpperCase().trim(),
    filtered: false
  };
  
  const updatedRound = {
    ...game.current_round,
    clues: [...game.current_round.clues, clue]
  };
  
  // Check if all non-guessers have submitted clues
  const nonGuessers = game.players.filter(p => !p.isGuesser);
  const allCluesSubmitted = nonGuessers.length === updatedRound.clues.length;
  
  const updatedStatus = allCluesSubmitted ? GameStatus.REVIEWING_CLUES : game.status;
  
  // Update the rounds array as well
  const updatedRounds = game.rounds.map(round => 
    round.roundNumber === updatedRound.roundNumber ? updatedRound : round
  );
  
  return {
    ...game,
    status: updatedStatus,
    current_round: updatedRound,
    rounds: updatedRounds,
    updated_at: new Date().toISOString()
  };
};

// Mark a clue as written (for IRL mode)
export const markClueWritten = (game: Game, playerId: string): Game => {
  if (!game.current_round) return game;
  
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.isGuesser) return game;
  
  // Create an empty clue to mark that this player has written their clue
  const clue: Clue = {
    playerId,
    playerName: player.nickname,
    word: "IRL_CLUE", // Not actually used in IRL mode
    filtered: false
  };
  
  // Check if player has already submitted a clue
  const existingClueIndex = game.current_round.clues.findIndex(c => c.playerId === playerId);
  let updatedClues = [...game.current_round.clues];
  
  if (existingClueIndex >= 0) {
    // Replace existing clue
    updatedClues[existingClueIndex] = clue;
  } else {
    // Add new clue
    updatedClues = [...updatedClues, clue];
  }
  
  const updatedRound = {
    ...game.current_round,
    clues: updatedClues
  };
  
  // Check if all non-guessers have submitted clues
  const nonGuessers = game.players.filter(p => !p.isGuesser);
  const allCluesSubmitted = nonGuessers.length === updatedRound.clues.length;
  
  // In IRL mode, once all clues are submitted, we move to comparing clues status
  let updatedStatus = game.status;
  if (game.mode === GameMode.IRL && allCluesSubmitted) {
    updatedStatus = GameStatus.REVIEWING_CLUES;
  } else if (game.mode === GameMode.ONLINE && allCluesSubmitted) {
    updatedStatus = GameStatus.REVIEWING_CLUES;
  }
  
  // Update the rounds array as well
  const updatedRounds = game.rounds.map(round => 
    round.roundNumber === updatedRound.roundNumber ? updatedRound : round
  );
  
  return {
    ...game,
    status: updatedStatus,
    current_round: updatedRound,
    rounds: updatedRounds,
    updated_at: new Date().toISOString()
  };
};

// Filter duplicate clues and clues with similar roots/endings
export const filterClues = (game: Game): Game => {
  if (!game.current_round) return game;
  
  // Group clues by lowercase word
  const clueGroups = new Map<string, Clue[]>();
  
  game.current_round.clues.forEach(clue => {
    const lowerWord = clue.word.toLowerCase();
    if (!clueGroups.has(lowerWord)) {
      clueGroups.set(lowerWord, []);
    }
    clueGroups.get(lowerWord)?.push(clue);
  });
  
  // Mark duplicates and similar words as filtered
  const filteredClues = game.current_round.clues.map(clue => {
    const group = clueGroups.get(clue.word.toLowerCase()) || [];
    
    // Check if it's a duplicate or matches the secret word or has similar root/ending to secret word
    const isDuplicate = group.length > 1;
    const matchesSecretWord = clue.word.toLowerCase() === game.current_round!.secretWord.toLowerCase();
    const hasSimilarRootOrEnding = checkWordSimilarity(clue.word, game.current_round!.secretWord);
    
    return {
      ...clue,
      filtered: isDuplicate || matchesSecretWord || hasSimilarRootOrEnding
    };
  });
  
  const updatedRound = {
    ...game.current_round,
    clues: filteredClues
  };
  
  // Update the rounds array as well
  const updatedRounds = game.rounds.map(round => 
    round.roundNumber === updatedRound.roundNumber ? updatedRound : round
  );
  
  return {
    ...game,
    status: GameStatus.GUESSING,
    current_round: updatedRound,
    rounds: updatedRounds,
    updated_at: new Date().toISOString()
  };
};

// Submit a guess
export const submitGuess = (game: Game, guess: string): Game => {
  if (!game.current_round) return game;
  
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedSecretWord = game.current_round.secretWord.toLowerCase();
  
  const isCorrect = normalizedGuess === normalizedSecretWord;
  
  const updatedRound = {
    ...game.current_round,
    guess,
    correct: isCorrect,
    completed: true
  };
  
  // Update the rounds array as well
  const updatedRounds = game.rounds.map(round => 
    round.roundNumber === updatedRound.roundNumber ? updatedRound : round
  );
  
  return {
    ...game,
    status: GameStatus.ROUND_RESULT,
    current_round: updatedRound,
    rounds: updatedRounds,
    updated_at: new Date().toISOString()
  };
};

// Update guess result for IRL mode
export const updateIRLGuessResult = (game: Game, isCorrect: boolean): Game => {
  if (!game.current_round || game.mode !== GameMode.IRL) return game;
  
  const updatedRound = {
    ...game.current_round,
    guess: isCorrect ? game.current_round.secretWord : "Risposta errata",
    correct: isCorrect,
    completed: true
  };
  
  // Update the rounds array as well
  const updatedRounds = game.rounds.map(round => 
    round.roundNumber === updatedRound.roundNumber ? updatedRound : round
  );
  
  return {
    ...game,
    status: GameStatus.ROUND_RESULT,
    current_round: updatedRound,
    rounds: updatedRounds,
    updated_at: new Date().toISOString()
  };
};

// Remove a player from the game
export const removePlayerFromGame = (game: Game, playerId: string): Game => {
  const updatedPlayers = game.players.filter(p => p.id !== playerId);
  
  // If the host is leaving, assign a new host
  let updatedHostId = game.host_id;
  if (playerId === game.host_id) {
    if (updatedPlayers.length > 0) {
      const newHost = updatedPlayers[0];
      updatedHostId = newHost.id;
      updatedPlayers[0] = {
        ...newHost,
        isHost: true
      };
    }
  }
  
  return {
    ...game,
    host_id: updatedHostId,
    players: updatedPlayers,
    updated_at: new Date().toISOString()
  };
};
