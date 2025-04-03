
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameState } from "@/hooks/useGameState";
import Header from "@/components/Header";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";
import { GameStatus, GameMode } from "@/types/game";
import { toast } from "sonner";
import { initializeSupabaseTables } from "@/lib/supabase";

const Game = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Get the stored player ID for this specific game
  const storedPlayerId = gameId ? localStorage.getItem(`player_id_${gameId}`) : null;
  
  // Initialize Supabase tables
  useEffect(() => {
    const init = async () => {
      await initializeSupabaseTables();
    };
    init();
  }, []);
  
  const {
    gameState,
    playerId,
    currentPlayer,
    loading,
    error,
    leaveGame,
    startRound,
    submitClue,
    submitGuess,
    markClueWritten,
    updateGuessResult,
    updatePlayerClueStatus,
    getPlayerClueStatus,
    areAllClueStatusesSelected
  } = useGameState({
    gameId,
    playerId: storedPlayerId || undefined,
  });

  // Handle initial load
  useEffect(() => {
    if (!initialLoadComplete && !loading) {
      console.log("Caricamento iniziale del gioco completato:", gameState?.id);
      setInitialLoadComplete(true);
    }
  }, [loading, initialLoadComplete, gameState]);

  // Monitor load attempts
  useEffect(() => {
    let loadInterval: number | undefined;
    
    if (loading) {
      loadInterval = window.setInterval(() => {
        setLoadAttempts(prev => {
          const newCount = prev + 1;
          console.log(`Tentativo di caricamento ${newCount}...`);
          return newCount;
        });
      }, 1000);
    } else if (loadInterval) {
      clearInterval(loadInterval);
    }
    
    return () => {
      if (loadInterval) clearInterval(loadInterval);
    };
  }, [loading]);

  // Save player ID to localStorage whenever it changes
  useEffect(() => {
    if (gameId && playerId) {
      console.log(`Salvataggio ID giocatore ${playerId} per il gioco ${gameId}`);
      localStorage.setItem(`player_id_${gameId}`, playerId);
      localStorage.setItem("current_game_id", gameId);
    }
  }, [gameId, playerId]);
  
  // Handle errors
  useEffect(() => {
    if (error && initialLoadComplete) {
      console.error("Errore di gioco:", error);
      
      // Clear localStorage for this game to prevent loop
      if (gameId) {
        console.log(`Pulizia localStorage per il gioco ${gameId} a causa di un errore`);
        localStorage.removeItem(`player_id_${gameId}`);
        localStorage.removeItem("current_game_id");
      }
      
      toast.error("Errore nel caricamento del gioco - ritorno alla home");
      
      // Give a brief moment to see the toast before navigating
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    }
  }, [error, navigate, initialLoadComplete, gameId]);
  
  // Check if player exists in the game
  useEffect(() => {
    if (initialLoadComplete && !loading && gameState && playerId && !currentPlayer) {
      console.log("Giocatore non trovato nel gioco:", playerId);
      
      // Clear localStorage for this game
      if (gameId) {
        localStorage.removeItem(`player_id_${gameId}`);
      }
      localStorage.removeItem("current_game_id");
      
      toast.error("Non fai più parte di questo gioco");
      navigate("/", { replace: true });
    }
  }, [loading, gameState, playerId, currentPlayer, gameId, navigate, initialLoadComplete]);

  // Handle too many load attempts
  useEffect(() => {
    if (loadAttempts >= 10 && loading) {
      console.error("Troppi tentativi di caricamento, il gioco sembra inaccessibile");
      
      // Clear localStorage to break potential loops
      if (gameId) {
        localStorage.removeItem(`player_id_${gameId}`);
      }
      localStorage.removeItem("current_game_id");
      
      toast.error("Impossibile caricare il gioco dopo numerosi tentativi");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    }
  }, [loadAttempts, gameId, navigate, loading]);
  
  const handleLeaveGame = () => {
    if (gameId) {
      localStorage.removeItem(`player_id_${gameId}`);
    }
    localStorage.removeItem("current_game_id");
    leaveGame();
    navigate("/", { replace: true });
  };
  
  if (loading && loadAttempts < 10) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold animate-pulse-light">Caricamento gioco... ({loadAttempts})</h2>
        </div>
      </div>
    );
  }
  
  if (!gameState) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-error mb-4">Gioco non trovato</h2>
          <button 
            onClick={() => {
              // Clear localStorage before returning to home
              if (gameId) {
                localStorage.removeItem(`player_id_${gameId}`);
              }
              localStorage.removeItem("current_game_id");
              navigate("/");
            }} 
            className="game-button-primary"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  if (!playerId || !currentPlayer) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-error mb-4">Non fai parte di questo gioco</h2>
          <button 
            onClick={() => {
              // Clear localStorage before returning to home
              if (gameId) {
                localStorage.removeItem(`player_id_${gameId}`);
              }
              localStorage.removeItem("current_game_id");
              navigate("/");
            }} 
            className="game-button-primary"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-game-background">
      <Header gameCode={gameState?.code} onLeaveGame={handleLeaveGame} />
      
      {gameState?.status === GameStatus.LOBBY ? (
        <Lobby 
          game={gameState} 
          currentPlayerId={playerId} 
          onStartGame={startRound} 
        />
      ) : (
        <GameRoom 
          game={gameState}
          currentPlayerId={playerId}
          onSubmitClue={submitClue}
          onSubmitGuess={submitGuess}
          onStartRound={startRound}
          onMarkClueWritten={markClueWritten}
          onUpdateGuessResult={updateGuessResult}
        />
      )}
    </div>
  );
};

export default Game;
