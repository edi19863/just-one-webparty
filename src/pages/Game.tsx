
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameState } from "@/hooks/useGameState";
import Header from "@/components/Header";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";
import { GameStatus } from "@/types/game";
import { toast } from "sonner";

const Game = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Get the stored player ID for this specific game
  const storedPlayerId = gameId ? localStorage.getItem(`player_id_${gameId}`) : null;
  
  const {
    gameState,
    playerId,
    currentPlayer,
    loading,
    error,
    leaveGame,
    startRound,
    submitClue,
    submitGuess
  } = useGameState({
    gameId,
    playerId: storedPlayerId || undefined,
  });

  // Handle initial load
  useEffect(() => {
    if (!initialLoadComplete && !loading) {
      console.log("Initial game load complete:", gameState?.id);
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
          console.log(`Loading attempt ${newCount}...`);
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
      console.log(`Saving player ID ${playerId} for game ${gameId}`);
      localStorage.setItem(`player_id_${gameId}`, playerId);
      localStorage.setItem("current_game_id", gameId);
    }
  }, [gameId, playerId]);
  
  // Handle errors
  useEffect(() => {
    if (error && initialLoadComplete) {
      console.error("Game error:", error);
      
      // Clear localStorage for this game to prevent loop
      if (gameId) {
        console.log(`Clearing localStorage for game ${gameId} due to error`);
        localStorage.removeItem(`player_id_${gameId}`);
        localStorage.removeItem("current_game_id");
      }
      
      toast.error("Error loading game - returning to home");
      
      // Give a brief moment to see the toast before navigating
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    }
  }, [error, navigate, initialLoadComplete, gameId]);
  
  // Check if player exists in the game
  useEffect(() => {
    if (initialLoadComplete && !loading && gameState && playerId && !currentPlayer) {
      console.log("Player not found in game:", playerId);
      
      // Clear localStorage for this game
      if (gameId) {
        localStorage.removeItem(`player_id_${gameId}`);
      }
      localStorage.removeItem("current_game_id");
      
      toast.error("You're no longer part of this game");
      navigate("/", { replace: true });
    }
  }, [loading, gameState, playerId, currentPlayer, gameId, navigate, initialLoadComplete]);

  // Handle too many load attempts
  useEffect(() => {
    if (loadAttempts >= 10 && loading) {
      console.error("Too many load attempts, assuming game is inaccessible");
      
      // Clear localStorage to break potential loops
      if (gameId) {
        localStorage.removeItem(`player_id_${gameId}`);
      }
      localStorage.removeItem("current_game_id");
      
      toast.error("Unable to load game after multiple attempts");
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
          <h2 className="text-2xl font-bold animate-pulse-light">Loading game... ({loadAttempts})</h2>
        </div>
      </div>
    );
  }
  
  if (!gameState) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-error mb-4">Game not found</h2>
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
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!playerId || !currentPlayer) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-error mb-4">You're not part of this game</h2>
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
            Back to Home
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
        />
      )}
    </div>
  );
};

export default Game;
