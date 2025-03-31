import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameState } from "@/hooks/useGameState";
import Header from "@/components/Header";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";
import { GameStatus } from "@/types/game";

const Game = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const savedPlayerId = localStorage.getItem("current_player_id");
  
  const {
    gameState,
    playerId,
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
  
  useEffect(() => {
    if (error) {
      navigate("/", { replace: true });
    }
  }, [error, navigate]);
  
  const handleLeaveGame = () => {
    localStorage.removeItem("current_game_id");
    localStorage.removeItem("current_player_id");
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
  
  if (!gameState || !playerId) {
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
