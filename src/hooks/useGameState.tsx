
import { useState, useEffect, useCallback, useRef } from 'react';
import { Game, GameStatus } from '@/types/game';
import * as gameUtils from '@/utils/gameUtils';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { 
  supabase, 
  getGameById, 
  getGameByCode, 
  createGameInDb, 
  updateGameInDb,
  subscribeToGame 
} from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);

  // Load game from Supabase
  const loadGameState = useCallback(async (gameId: string) => {
    setLoading(true);
    try {
      const game = await getGameById(gameId);
      if (game) {
        console.log('Game loaded:', game);
        setGameState(game);
        return game;
      } else {
        console.error('Game not found with ID:', gameId);
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
    
    // Save game to Supabase
    const savedGame = await createGameInDb(newGame);
    if (savedGame) {
      console.log('Game created:', savedGame);
      setGameState(savedGame);
      
      toast({
        title: 'Game Created!',
        description: `Your game code is ${savedGame.code}`,
      });
      
      return { gameId: savedGame.id, playerId: id, gameCode: savedGame.code };
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create game',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Join an existing game
  const joinGame = useCallback(async (code: string, nickname: string) => {
    try {
      // Find game by code in Supabase
      const game = await getGameByCode(code);
      if (!game) {
        setError('Game not found');
        toast({
          title: 'Error',
          description: 'Game not found with that code',
          variant: 'destructive',
        });
        return null;
      }
      
      // Add player to game
      const { game: updatedGame, playerId: newPlayerId } = gameUtils.addPlayerToGame(game, nickname);
      setPlayerId(newPlayerId);
      
      // Update game in Supabase
      const savedGame = await updateGameInDb(updatedGame);
      if (savedGame) {
        console.log('Joined game:', savedGame);
        setGameState(savedGame);
        
        toast({
          title: 'Joined Game',
          description: `You've joined the game as ${nickname}`,
        });
        
        return { gameId: savedGame.id, playerId: newPlayerId };
      } else {
        toast({
          title: 'Error',
          description: 'Failed to join game',
          variant: 'destructive',
        });
        return null;
      }
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
  }, [toast]);

  // Start a new round
  const startRound = useCallback(async () => {
    if (!gameState) return;
    
    const updatedGame = gameUtils.startNewRound(gameState);
    const savedGame = await updateGameInDb(updatedGame);
    
    if (savedGame) {
      console.log('Round started:', savedGame);
      setGameState(savedGame);
      
      sonnerToast.success(`Round ${savedGame.rounds.length} has begun!`);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to start round',
        variant: 'destructive',
      });
    }
  }, [gameState, toast]);

  // Submit a clue
  const submitClue = useCallback(async (word: string) => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.addClue(gameState, playerId, word);
    const savedGame = await updateGameInDb(updatedGame);
    
    if (savedGame) {
      console.log('Clue submitted:', savedGame);
      setGameState(savedGame);
      
      sonnerToast.success('Your clue has been recorded');
      
      // If all clues are in, filter duplicates
      if (savedGame.status === GameStatus.REVIEWING_CLUES) {
        setTimeout(async () => {
          const filteredGame = gameUtils.filterClues(savedGame);
          const savedFilteredGame = await updateGameInDb(filteredGame);
          
          if (savedFilteredGame) {
            console.log('Clues filtered:', savedFilteredGame);
            setGameState(savedFilteredGame);
            
            sonnerToast.success('Duplicate clues have been filtered out');
          }
        }, 1000);
      }
    } else {
      toast({
        title: 'Error',
        description: 'Failed to submit clue',
        variant: 'destructive',
      });
    }
  }, [gameState, playerId, toast]);

  // Submit a guess
  const submitGuess = useCallback(async (guess: string) => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.submitGuess(gameState, guess);
    const savedGame = await updateGameInDb(updatedGame);
    
    if (savedGame) {
      console.log('Guess submitted:', savedGame);
      setGameState(savedGame);
      
      if (savedGame.current_round?.correct) {
        sonnerToast.success('Correct! Well done!');
      } else {
        sonnerToast.error(`Not quite. The word was "${savedGame.current_round?.secretWord}"`);
      }
    } else {
      toast({
        title: 'Error',
        description: 'Failed to submit guess',
        variant: 'destructive',
      });
    }
  }, [gameState, playerId, toast]);

  // Leave game
  const leaveGame = useCallback(async () => {
    if (!gameState || !playerId) return;
    
    // Clean up subscriptions
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.unsubscribe();
      supabaseChannelRef.current = null;
    }
    
    const updatedGame = gameUtils.removePlayerFromGame(gameState, playerId);
    await updateGameInDb(updatedGame);
    
    setGameState(null);
    setPlayerId(null);
    
    sonnerToast.info('You have left the game');
  }, [gameState, playerId]);

  // Set up and clean up real-time subscription
  useEffect(() => {
    if (gameState?.id) {
      // Clean up any existing subscription
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.unsubscribe();
      }
      
      // Set up new subscription
      const channel = subscribeToGame(gameState.id, (updatedGame) => {
        console.log('Real-time update received:', updatedGame);
        setGameState((currentGameState) => {
          // Only update if the game has been updated more recently
          if (!currentGameState || new Date(updatedGame.updated_at) > new Date(currentGameState.updated_at)) {
            return updatedGame;
          }
          return currentGameState;
        });
      });
      
      supabaseChannelRef.current = channel;
      
      return () => {
        if (supabaseChannelRef.current) {
          supabaseChannelRef.current.unsubscribe();
          supabaseChannelRef.current = null;
        }
      };
    }
  }, [gameState?.id]);

  // Load initial game state if gameId is provided
  useEffect(() => {
    if (options?.gameId) {
      loadGameState(options.gameId);
    } else {
      setLoading(false);
    }
  }, [options?.gameId, loadGameState]);

  // Get current player
  const currentPlayer = gameState?.players.find(p => p.id === playerId) || null;

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
