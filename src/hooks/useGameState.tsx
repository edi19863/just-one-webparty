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
  updateClueStatus,
  getClueStatuses,
  clearClueStatuses,
  subscribeToGame,
  subscribeToClueStatuses
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
  const [clueStatuses, setClueStatuses] = useState<any[]>([]);
  const { toast } = useToast();
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const statusChannelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

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

  const createGame = useCallback(async (nickname: string, mode: GameMode = GameMode.IRL) => {
    const id = gameUtils.generatePlayerId();
    setPlayerId(id);
    
    const newGame = gameUtils.createNewGame(id, nickname, mode);
    
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

  const joinGame = useCallback(async (code: string, nickname: string) => {
    try {
      console.log(`Attempting to join game with code: ${code}`);
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
      
      const { game: updatedGame, playerId: newPlayerId } = gameUtils.addPlayerToGame(game, nickname);
      setPlayerId(newPlayerId);
      
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

  const startRound = useCallback(async () => {
    if (!gameState) return;
    
    if (gameState.current_round) {
      await clearClueStatuses(gameState.id, gameState.current_round.roundNumber);
    }
    
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

  const submitClue = useCallback(async (word: string) => {
    if (!gameState || !playerId) return;
    
    const updatedGame = gameUtils.addClue(gameState, playerId, word);
    const savedGame = await updateGameInDb(updatedGame);
    
    if (savedGame) {
      console.log('Clue submitted:', savedGame);
      setGameState(savedGame);
      lastUpdateTimeRef.current = Date.now();
      
      sonnerToast.success('Il tuo indizio è stato registrato');
      
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

  const leaveGame = useCallback(async () => {
    if (!gameState || !playerId) return;
    
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

  const updatePlayerClueStatus = useCallback(async (status: 'unique' | 'duplicate') => {
    if (!gameState || !playerId || !gameState.current_round) return;
    
    const result = await updateClueStatus(
      gameState.id,
      gameState.current_round.roundNumber,
      playerId,
      status
    );
    
    if (result) {
      await loadClueStatuses();
      return true;
    }
    
    return false;
  }, [gameState, playerId, loadClueStatuses]);

  const loadClueStatuses = useCallback(async () => {
    if (!gameState || !gameState.current_round) return;
    
    const statuses = await getClueStatuses(gameState.id, gameState.current_round.roundNumber);
    console.log('Loaded clue statuses:', statuses);
    setClueStatuses(statuses);
  }, [gameState]);

  useEffect(() => {
    let pollInterval: number | undefined;
    
    if (gameState?.id && !pollInterval) {
      pollInterval = window.setInterval(async () => {
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
      }, 5000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [gameState?.id]);

  useEffect(() => {
    if (gameState?.id) {
      if (supabaseChannelRef.current) {
        try {
          console.log("Removing existing game channel before creating a new one");
          supabase.removeChannel(supabaseChannelRef.current);
          supabaseChannelRef.current = null;
        } catch (err) {
          console.error("Error removing existing channel:", err);
        }
      }
      
      const channel = subscribeToGame(gameState.id, (updatedGame) => {
        console.log('Real-time update received:', updatedGame);
        setGameState((currentGameState) => {
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
          try {
            console.log("Removing game channel during cleanup");
            supabase.removeChannel(supabaseChannelRef.current);
            supabaseChannelRef.current = null;
          } catch (err) {
            console.error("Error removing channel during cleanup:", err);
          }
        }
      };
    }
  }, [gameState?.id]);

  useEffect(() => {
    if (options?.gameId) {
      loadGameState(options.gameId);
    } else {
      setLoading(false);
    }
  }, [options?.gameId, loadGameState]);

  useEffect(() => {
    if (!gameState?.id || !gameState.current_round) return;
    
    if (statusChannelRef.current) {
      try {
        console.log("Removing existing status channel before creating a new one");
        supabase.removeChannel(statusChannelRef.current);
        statusChannelRef.current = null;
      } catch (err) {
        console.error("Error removing existing status channel:", err);
      }
    }
    
    const channel = subscribeToClueStatuses(gameState.id, async () => {
      await loadClueStatuses();
    });
    
    statusChannelRef.current = channel;
    
    loadClueStatuses();
    
    return () => {
      if (statusChannelRef.current) {
        try {
          console.log("Removing status channel during cleanup");
          supabase.removeChannel(statusChannelRef.current);
          statusChannelRef.current = null;
        } catch (err) {
          console.error("Error removing status channel during cleanup:", err);
        }
      }
    };
  }, [gameState?.id, gameState?.current_round?.roundNumber, loadClueStatuses]);

  const currentPlayer = gameState?.players.find(p => p.id === playerId) || null;

  const getPlayerClueStatus = useCallback((playerId: string) => {
    if (!clueStatuses.length) return null;
    
    const playerStatus = clueStatuses.find(status => status.player_id === playerId);
    return playerStatus ? playerStatus.status : null;
  }, [clueStatuses]);

  const areAllClueStatusesSelected = useCallback(() => {
    if (!gameState || !gameState.current_round || !clueStatuses.length) return false;

    const clueSubmitters = gameState.current_round.clues
      .map(clue => clue.playerId)
      .filter(id => id !== gameState.current_round?.guesserId);

    return clueSubmitters.every(submitterId => 
      clueStatuses.some(status => 
        status.player_id === submitterId && 
        (status.status === 'unique' || status.status === 'duplicate')
      )
    );
  }, [gameState, clueStatuses]);

  return {
    gameState,
    playerId,
    currentPlayer,
    loading,
    error,
    clueStatuses,
    createGame,
    joinGame,
    startRound,
    submitClue,
    submitGuess,
    markClueWritten,
    updateGuessResult,
    updatePlayerClueStatus,
    getPlayerClueStatus,
    areAllClueStatusesSelected,
    leaveGame
  };
};
