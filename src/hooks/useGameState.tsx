
import { useState, useEffect, useCallback } from 'react';
import { Game, GameStatus } from '@/types/game';
import * as gameUtils from '@/utils/gameUtils';
import { useToast } from '@/components/ui/use-toast';

// In a real app, we would use Supabase for real-time capabilities
// This is a simplified version using local state for demonstration

interface UseGameStateOptions {
  gameId?: string;
  playerId?: string;
}

export const useGameState = (options?: UseGameStateOptions) => {
  const [gameState, setGameState] = useState<Game | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(options?.playerId || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // In a real app, this would be replaced with Supabase subscription
  // For demo purposes, we're using localStorage to persist game state
  const saveGameState = useCallback((game: Game) => {
    try {
      localStorage.setItem(`game_${game.id}`, JSON.stringify(game));
      // We also save by code for easy lookup
      localStorage.setItem(`game_code_${game.code}`, game.id);
    } catch (err) {
      console.error('Error saving game state:', err);
    }
  }, []);

  const loadGameState = useCallback(async (gameId: string) => {
    setLoading(true);
    try {
      const savedGame = localStorage.getItem(`game_${gameId}`);
      if (savedGame) {
        const parsedGame: Game = JSON.parse(savedGame);
        setGameState(parsedGame);
        return parsedGame;
      } else {
        setError('Game not found');
        return null;
      }
    } catch (err) {
      console.error('Error loading game state:', err);
      setError('Error loading game');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new game
  const createGame = useCallback(async (nickname: string) => {
    const id = gameUtils.generatePlayerId();
    setPlayerId(id);
    
    const newGame = gameUtils.createNewGame(id, nickname);
    setGameState(newGame);
    saveGameState(newGame);
    
    toast({
      title: 'Game Created!',
      description: `Your game code is ${newGame.code}`,
    });
    
    return { gameId: newGame.id, playerId: id, gameCode: newGame.code };
  }, [saveGameState, toast]);

  // Join an existing game
  const joinGame = useCallback(async (code: string, nickname: string) => {
    try {
      // Find game by code
      const gameId = localStorage.getItem(`game_code_${code.toUpperCase()}`);
      if (!gameId) {
        setError('Game not found');
        toast({
          title: 'Error',
          description: 'Game not found with that code',
          variant: 'destructive',
        });
        return null;
      }
      
      const game = await loadGameState(gameId);
      if (!game) return null;
      
      // Add player to game
      const { game: updatedGame, playerId: newPlayerId } = gameUtils.addPlayerToGame(game, nickname);
      setPlayerId(newPlayerId);
      setGameState(updatedGame);
      saveGameState(updatedGame);
      
      toast({
        title: 'Joined Game',
        description: `You've joined the game as ${nickname}`,
      });
      
      return { gameId: game.id, playerId: newPlayerId };
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Error joining game');
      toast({
        title: 'Error',
        description: 'Failed to join game',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadGameState, saveGameState, toast]);

  // Start a new round
  const startRound = useCallback(() => {
    if (!gameState) return;
    
    const updatedGame = gameUtils.startNewRound(gameState);
    setGameState(updatedGame);
    saveGameState(updatedGame);
    
    toast({
      title: 'Round Started',
      description: `Round ${updatedGame.rounds.length} has begun!`,
    });
  }, [gameState, saveGameState, toast]);

  // Submit a clue
  const submitClue = useCallback((word: string) => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.addClue(gameState, playerId, word);
    setGameState(updatedGame);
    saveGameState(updatedGame);
    
    toast({
      title: 'Clue Submitted',
      description: 'Your clue has been recorded',
    });
    
    // If all clues are in, filter duplicates
    if (updatedGame.status === GameStatus.REVIEWING_CLUES) {
      setTimeout(() => {
        const filteredGame = gameUtils.filterClues(updatedGame);
        setGameState(filteredGame);
        saveGameState(filteredGame);
        
        toast({
          title: 'Clues Ready',
          description: 'Duplicate clues have been filtered out',
        });
      }, 1000);
    }
  }, [gameState, playerId, saveGameState, toast]);

  // Submit a guess
  const submitGuess = useCallback((guess: string) => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.submitGuess(gameState, guess);
    setGameState(updatedGame);
    saveGameState(updatedGame);
    
    toast({
      title: 'Guess Submitted',
      description: updatedGame.currentRound?.correct 
        ? 'Correct! Well done!'
        : `Not quite. The word was "${updatedGame.currentRound?.secretWord}"`,
    });
  }, [gameState, playerId, saveGameState, toast]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.removePlayerFromGame(gameState, playerId);
    saveGameState(updatedGame);
    setGameState(null);
    setPlayerId(null);
    
    toast({
      title: 'Left Game',
      description: 'You have left the game',
    });
  }, [gameState, playerId, saveGameState, toast]);

  // Get current player
  const currentPlayer = gameState?.players.find(p => p.id === playerId) || null;

  // Load initial game state if gameId is provided
  useEffect(() => {
    if (options?.gameId) {
      loadGameState(options.gameId);
    } else {
      setLoading(false);
    }
  }, [options?.gameId, loadGameState]);

  return {
    gameState,
    playerId,
    currentPlayer,
    loading,
    error,
    createGame,
    joinGame,
    startRound,
    submitClue,
    submitGuess,
    leaveGame
  };
};
