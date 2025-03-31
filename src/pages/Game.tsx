
import { useEffect } from "react";
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
  const savedPlayerId = localStorage.getItem(`player_id_${gameId}`);
  
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
    playerId: savedPlayerId || undefined,
  });

  // Save player ID to localStorage whenever it changes
  useEffect(() => {
    if (gameId && playerId) {
      localStorage.setItem(`player_id_${gameId}`, playerId);
      localStorage.setItem("current_game_id", gameId);
    }
  }, [gameId, playerId]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Error loading game");
      navigate("/", { replace: true });
    }
  }, [error, navigate]);
  
  // Check if player exists in the game
  useEffect(() => {
    if (!loading && gameState && playerId && !currentPlayer) {
      toast.error("You're no longer part of this game");
      localStorage.removeItem(`player_id_${gameId}`);
      localStorage.removeItem("current_game_id");
      navigate("/", { replace: true });
    }
  }, [loading, gameState, playerId, currentPlayer, gameId, navigate]);
  
  const handleLeaveGame = () => {
    localStorage.removeItem(`player_id_${gameId}`);
    localStorage.removeItem("current_game_id");
    leaveGame();
    navigate("/", { replace: true });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold animate-pulse-light">Loading game...</h2>
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
            onClick={() => navigate("/")} 
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
            onClick={() => navigate("/")} 
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
