
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateGame from "@/components/CreateGame";
import JoinGame from "@/components/JoinGame";
import { useGameState } from "@/hooks/useGameState";

const Index = () => {
  const { createGame, joinGame } = useGameState();
  const navigate = useNavigate();
  
  // Check if we have an ongoing game and redirect to it
  useEffect(() => {
    const checkExistingGame = () => {
      const savedGameId = localStorage.getItem("current_game_id");
      const savedPlayerId = localStorage.getItem("current_player_id");
      
      if (savedGameId && savedPlayerId) {
        navigate(`/game/${savedGameId}`);
      }
    };
    
    checkExistingGame();
  }, [navigate]);
  
  const handleCreateGame = async (nickname: string) => {
    const result = await createGame(nickname);
    if (result) {
      localStorage.setItem("current_game_id", result.gameId);
      localStorage.setItem("current_player_id", result.playerId);
      return result;
    }
    return null;
  };
  
  const handleJoinGame = async (code: string, nickname: string) => {
    const result = await joinGame(code, nickname);
    if (result) {
      localStorage.setItem("current_game_id", result.gameId);
      localStorage.setItem("current_player_id", result.playerId);
      return result;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-game-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-game-primary mb-4">Just One</h1>
          <p className="text-xl text-gray-600">
            The fun multiplayer word-guessing party game!
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <CreateGame onCreateGame={handleCreateGame} />
          <JoinGame onJoinGame={handleJoinGame} />
        </div>
        
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
          <ol className="text-left space-y-3 text-gray-700 list-decimal pl-6">
            <li>One player is randomly selected as the guesser each round.</li>
            <li>All other players see a secret word that the guesser must discover.</li>
            <li>Each non-guessing player submits a one-word clue to help the guesser.</li>
            <li>Identical or similar clues are automatically filtered out.</li>
            <li>The guesser sees the remaining clues and makes a guess.</li>
            <li>Points are scored for correct guesses!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Index;
