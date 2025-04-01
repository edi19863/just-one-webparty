
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CreateGameProps {
  onCreateGame: (nickname: string) => Promise<{ gameId: string; playerId: string; gameCode: string } | null>;
}

const CreateGame = ({ onCreateGame }: CreateGameProps) => {
  const [nickname, setNickname] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    
    setIsCreating(true);
    try {
      const result = await onCreateGame(nickname.trim());
      if (result) {
        console.log("Game created successfully with ID:", result.gameId);
        
        // Ensure localStorage is set before navigating
        localStorage.setItem("current_game_id", result.gameId);
        localStorage.setItem(`player_id_${result.gameId}`, result.playerId);
        
        toast.success(`Game created! Your code is ${result.gameCode}`);
        
        // Add a small delay before navigating to ensure data is stored
        setTimeout(() => {
          console.log("Navigating to game:", result.gameId);
          navigate(`/game/${result.gameId}`);
        }, 200);
      } else {
        console.error("Failed to create game - no result returned");
        toast.error("Failed to create game. Please try again.");
      }
    } catch (err) {
      console.error("Error in create game form:", err);
      toast.error("Error creating game. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Create New Game</CardTitle>
        <CardDescription>
          Start a new game and invite friends to play
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                Your Nickname
              </label>
              <Input
                id="nickname"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="game-input"
                maxLength={20}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="game-button-primary w-full"
            disabled={isCreating || !nickname.trim()}
          >
            {isCreating ? "Creating..." : "Create Game"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateGame;
