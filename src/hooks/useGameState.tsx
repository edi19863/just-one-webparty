import { useState, useEffect, useCallback, useRef } from 'react';
import { Game, GameStatus, GameMode } from '@/types/game';
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
  const lastUpdateTimeRef = useRef<number>(0);

  // Load game from Supabase
  const loadGameState = useCallback(async (gameId: string) => {
    setLoading(true);
    try {
      console.log(`Loading game with ID: ${gameId}`);
      const game = await getGameById(gameId);
      if (game) {
        console.log('Game loaded:', game);
        setGameState(game);
        lastUpdateTimeRef.current = Date.now();
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
  const createGame = useCallback(async (nickname: string, mode: GameMode = GameMode.ONLINE) => {
    const id = gameUtils.generatePlayerId();
    setPlayerId(id);
    
    const newGame = gameUtils.createNewGame(id, nickname, mode);
    
    // Save game to Supabase
    const savedGame = await createGameInDb(newGame);
    if (savedGame) {
      console.log('Game created:', savedGame);
      
      setGameState(savedGame);
      lastUpdateTimeRef.current = Date.now();
      
      toast({
        title: 'Partita Creata!',
        description: `Il codice della tua partita è ${savedGame.code}`,
      });
      
      return { gameId: savedGame.id, playerId: id, gameCode: savedGame.code };
    } else {
      toast({
        title: 'Errore',
        description: 'Impossibile creare la partita',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Join an existing game
  const joinGame = useCallback(async (code: string, nickname: string) => {
    try {
      console.log(`Attempting to join game with code: ${code}`);
      // Find game by code in Supabase
      const game = await getGameByCode(code);
      
      if (!game) {
        console.error('Game not found with code:', code);
        setError('Game not found');
        toast({
          title: 'Errore',
          description: 'Game not found with that code',
          variant: 'destructive',
        });
        return null;
      }
      
      console.log('Found game:', game);
      
      // Add player to game
      const { game: updatedGame, playerId: newPlayerId } = gameUtils.addPlayerToGame(game, nickname);
      setPlayerId(newPlayerId);
      
      // Update game in Supabase
      const savedGame = await updateGameInDb(updatedGame);
      if (savedGame) {
        console.log('Joined game:', savedGame);
        setGameState(savedGame);
        lastUpdateTimeRef.current = Date.now();
        
        toast({
          title: 'Joined Game',
          description: `You've joined the game as ${nickname}`,
        });
        
        return { gameId: savedGame.id, playerId: newPlayerId };
      } else {
        console.error('Failed to update game after joining');
        toast({
          title: 'Errore',
          description: 'Failed to join game',
          variant: 'destructive',
        });
        return null;
      }
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Error joining game');
      toast({
        title: 'Errore',
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
      lastUpdateTimeRef.current = Date.now();
      
      sonnerToast.success(`Round ${savedGame.rounds.length} has begun!`);
    } else {
      toast({
        title: 'Errore',
        description: 'Impossibile avviare la partita',
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
      lastUpdateTimeRef.current = Date.now();
      
      sonnerToast.success('Il tuo indizio è stato registrato');
      
      // If all clues are in, filter duplicates
      if (savedGame.status === GameStatus.REVIEWING_CLUES) {
        setTimeout(async () => {
          const filteredGame = gameUtils.filterClues(savedGame);
          const savedFilteredGame = await updateGameInDb(filteredGame);
          
          if (savedFilteredGame) {
            console.log('Clues filtered:', savedFilteredGame);
            setGameState(savedFilteredGame);
            lastUpdateTimeRef.current = Date.now();
            
            sonnerToast.success('Duplicate clues have been filtered out');
          }
        }, 1000);
      }
    } else {
      toast({
        title: 'Errore',
        description: 'Impossibile registrare l\'indizio',
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
      lastUpdateTimeRef.current = Date.now();
      
      if (savedGame.current_round?.correct) {
        sonnerToast.success('Risposta corretta!');
      } else {
        sonnerToast.error(`Risposta errata. La parola era "${savedGame.current_round?.secretWord}"`);
      }
    } else {
      toast({
        title: 'Errore',
        description: 'Impossibile registrare la risposta',
        variant: 'destructive',
      });
    }
  }, [gameState, playerId, toast]);

  // Mark clue as written (for IRL mode)
  const markClueWritten = useCallback(async () => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.markClueWritten(gameState, playerId);
    const savedGame = await updateGameInDb(updatedGame);
    
    if (savedGame) {
      console.log('Clue marked as written:', savedGame);
      setGameState(savedGame);
      lastUpdateTimeRef.current = Date.now();
      
      sonnerToast.success('Il tuo indizio è stato registrato');
    } else {
      toast({
        title: 'Errore',
        description: 'Impossibile registrare l\'indizio',
        variant: 'destructive',
      });
    }
  }, [gameState, playerId, toast]);

  // Update guess result (for IRL mode)
  const updateGuessResult = useCallback(async (isCorrect: boolean) => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.updateIRLGuessResult(gameState, isCorrect);
    const savedGame = await updateGameInDb(updatedGame);
    
    if (savedGame) {
      console.log('Guess result updated:', savedGame);
      setGameState(savedGame);
      lastUpdateTimeRef.current = Date.now();
      
      if (isCorrect) {
        sonnerToast.success('Risposta corretta!');
      } else {
        sonnerToast.error('Risposta errata');
      }
    } else {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare il risultato',
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

  // Poll for game updates as a fallback mechanism
  useEffect(() => {
    let pollInterval: number | undefined;
    
    if (gameState?.id && !pollInterval) {
      pollInterval = window.setInterval(async () => {
        // Only poll if it's been more than 5 seconds since our last update
        const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
        if (timeSinceLastUpdate > 5000) {
          console.log('Polling for game updates...');
          const updatedGame = await getGameById(gameState.id);
          if (updatedGame) {
            const updatedAt = new Date(updatedGame.updated_at).getTime();
            const currentUpdatedAt = gameState ? new Date(gameState.updated_at).getTime() : 0;
            
            if (updatedAt > currentUpdatedAt) {
              console.log('Game updated via polling:', updatedGame);
              setGameState(updatedGame);
              lastUpdateTimeRef.current = Date.now();
            }
          }
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [gameState?.id]);

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
            lastUpdateTimeRef.current = Date.now();
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
    markClueWritten,
    updateGuessResult,
    leaveGame
  };
};
