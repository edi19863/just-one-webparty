
import { Game, GameStatus, Player, Round, Clue } from "@/types/game";

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
export const createNewGame = (hostId: string, hostNickname: string): Game => {
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
    host_id: hostId, // Changed from hostId to host_id
    status: GameStatus.LOBBY,
    players: [host],
    current_round: null, // Changed from currentRound to current_round
    rounds: [],
    created_at: new Date().toISOString(), // Changed from createdAt to created_at
    updated_at: new Date().toISOString()  // Changed from updatedAt to updated_at
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
    updated_at: new Date().toISOString() // Changed from updatedAt to updated_at
  };

  return { game: updatedGame, playerId };
};

// Start a new round
export const startNewRound = (game: Game): Game => {
  // Words for the game - in a real app, you'd have a larger list or fetch from an API
  const words = [
    "APPLE", "BEACH", "CHAIR", "DANCE", "EAGLE", "FLOWER", "GUITAR", "HONEY", 
    "ISLAND", "JUNGLE", "KETTLE", "LEMON", "MOUNTAIN", "NOVEL", "OCEAN", 
    "PIANO", "QUILT", "RIVER", "SUNSET", "TIGER", "UMBRELLA", "VIOLIN", 
    "WINDOW", "XYLOPHONE", "YELLOW", "ZEBRA", "BALLOON", "CAMERA", "DOLPHIN",
    "FOREST", "GARDEN", "HAMMER", "JACKET", "KITCHEN", "LAPTOP", "MAGNET",
    "NEEDLE", "ORANGE", "PENCIL", "ROCKET", "SANDWICH", "TURTLE", "VOLCANO"
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
  
  return {
    ...game,
    players: updatedPlayers,
    status: GameStatus.SUBMITTING_CLUES,
    current_round: newRound, // Changed from currentRound to current_round
    rounds: [...game.rounds, newRound],
    updated_at: new Date().toISOString() // Changed from updatedAt to updated_at
  };
};

// Add a clue from a player
export const addClue = (game: Game, playerId: string, word: string): Game => {
  if (!game.current_round) return game; // Changed from currentRound to current_round
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) return game;
  
  const clue: Clue = {
    playerId,
    playerName: player.nickname,
    word: word.toUpperCase().trim(),
    filtered: false
  };
  
  const updatedRound = {
    ...game.current_round, // Changed from currentRound to current_round
    clues: [...game.current_round.clues, clue] // Changed from currentRound to current_round
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
    current_round: updatedRound, // Changed from currentRound to current_round
    rounds: updatedRounds,
    updated_at: new Date().toISOString() // Changed from updatedAt to updated_at
  };
};

// Filter duplicate clues
export const filterClues = (game: Game): Game => {
  if (!game.current_round) return game; // Changed from currentRound to current_round
  
  // Group clues by lowercase word
  const clueGroups = new Map<string, Clue[]>();
  
  game.current_round.clues.forEach(clue => { // Changed from currentRound to current_round
    const lowerWord = clue.word.toLowerCase();
    if (!clueGroups.has(lowerWord)) {
      clueGroups.set(lowerWord, []);
    }
    clueGroups.get(lowerWord)?.push(clue);
  });
  
  // Mark duplicates as filtered
  const filteredClues = game.current_round.clues.map(clue => { // Changed from currentRound to current_round
    const group = clueGroups.get(clue.word.toLowerCase()) || [];
    return {
      ...clue,
      filtered: group.length > 1 || clue.word.toLowerCase() === game.current_round!.secretWord.toLowerCase() // Changed from currentRound to current_round
    };
  });
  
  const updatedRound = {
    ...game.current_round, // Changed from currentRound to current_round
    clues: filteredClues
  };
  
  // Update the rounds array as well
  const updatedRounds = game.rounds.map(round => 
    round.roundNumber === updatedRound.roundNumber ? updatedRound : round
  );
  
  return {
    ...game,
    status: GameStatus.GUESSING,
    current_round: updatedRound, // Changed from currentRound to current_round
    rounds: updatedRounds,
    updated_at: new Date().toISOString() // Changed from updatedAt to updated_at
  };
};

// Submit a guess
export const submitGuess = (game: Game, guess: string): Game => {
  if (!game.current_round) return game; // Changed from currentRound to current_round
  
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedSecretWord = game.current_round.secretWord.toLowerCase(); // Changed from currentRound to current_round
  
  const isCorrect = normalizedGuess === normalizedSecretWord;
  
  const updatedRound = {
    ...game.current_round, // Changed from currentRound to current_round
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
    current_round: updatedRound, // Changed from currentRound to current_round
    rounds: updatedRounds,
    updated_at: new Date().toISOString() // Changed from updatedAt to updated_at
  };
};

// Remove a player from the game
export const removePlayerFromGame = (game: Game, playerId: string): Game => {
  const updatedPlayers = game.players.filter(p => p.id !== playerId);
  
  // If the host is leaving, assign a new host
  let updatedHostId = game.host_id; // Changed from hostId to host_id
  if (playerId === game.host_id) { // Changed from hostId to host_id
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
    host_id: updatedHostId, // Changed from hostId to host_id
    players: updatedPlayers,
    updated_at: new Date().toISOString() // Changed from updatedAt to updated_at
  };
};
