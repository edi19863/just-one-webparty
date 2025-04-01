
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateGame from "@/components/CreateGame";
import JoinGame from "@/components/JoinGame";
import { useGameState } from "@/hooks/useGameState";
import { toast } from "sonner";

const Index = () => {
  const { createGame, joinGame } = useGameState();
  const navigate = useNavigate();
  const [checkingExistingGame, setCheckingExistingGame] = useState(true);
  
  // Check if we have an ongoing game and redirect to it
  useEffect(() => {
    const checkExistingGame = async () => {
      try {
        const savedGameId = localStorage.getItem("current_game_id");
        
        if (savedGameId) {
          const savedPlayerId = localStorage.getItem(`player_id_${savedGameId}`);
          
          if (savedPlayerId) {
            console.log(`Found existing game: ${savedGameId} with player: ${savedPlayerId}`);
            
            // Try to check if the game exists before redirecting
            try {
              // We'll just check if navigation should happen - the actual game loading happens in Game.tsx
              navigate(`/game/${savedGameId}`);
            } catch (err) {
              console.error("Error navigating to saved game:", err);
              // If there's an error, clear the storage to prevent loops
              localStorage.removeItem(`player_id_${savedGameId}`);
              localStorage.removeItem("current_game_id");
              toast.error("Couldn't load saved game - starting fresh");
            }
            return;
          }
        }
      } catch (err) {
        console.error("Error checking for existing game:", err);
        // Clear potentially corrupted storage
        localStorage.removeItem("current_game_id");
      } finally {
        setCheckingExistingGame(false);
      }
    };
    
    checkExistingGame();
  }, [navigate]);
  
  const handleCreateGame = async (nickname: string) => {
    try {
      console.log("Creating new game with nickname:", nickname);
      const result = await createGame(nickname);
      if (result) {
        console.log("Game created successfully:", result);
        localStorage.setItem("current_game_id", result.gameId);
        localStorage.setItem(`player_id_${result.gameId}`, result.playerId);
        return result;
      }
      return null;
    } catch (err) {
      console.error("Error creating game:", err);
      toast.error("Failed to create game. Please try again.");
      return null;
    }
  };
  
  const handleJoinGame = async (code: string, nickname: string) => {
    try {
      const result = await joinGame(code, nickname);
      if (result) {
        localStorage.setItem("current_game_id", result.gameId);
        localStorage.setItem(`player_id_${result.gameId}`, result.playerId);
        return result;
      }
      return null;
    } catch (err) {
      console.error("Error joining game:", err);
      toast.error("Failed to join game. Please check your code and try again.");
      return null;
    }
  };

  if (checkingExistingGame) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold animate-pulse-light">Loading...</h2>
        </div>
      </div>
    );
  }

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
