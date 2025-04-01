
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface JoinGameProps {
  onJoinGame: (code: string, nickname: string) => Promise<{ gameId: string; playerId: string; } | null>;
}

const JoinGame = ({ onJoinGame }: JoinGameProps) => {
  const [gameCode, setGameCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameCode.trim() || !nickname.trim()) return;
    
    setIsJoining(true);
    try {
      console.log("Joining game with code:", gameCode.trim());
      const result = await onJoinGame(gameCode.trim(), nickname.trim());
      
      if (result) {
        console.log("Successfully joined game:", result.gameId);
        
        // Ensure localStorage is set before navigating
        localStorage.setItem("current_game_id", result.gameId);
        localStorage.setItem(`player_id_${result.gameId}`, result.playerId);
        
        toast.success(`Joined the game!`);
        
        // Add a small delay before navigating to ensure data is stored
        setTimeout(() => {
          console.log("Navigating to joined game:", result.gameId);
          navigate(`/game/${result.gameId}`);
        }, 200);
      } else {
        toast.error("Failed to join game. Please check your code and try again.");
      }
    } catch (err) {
      console.error("Error joining game:", err);
      toast.error("Error joining game. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Join Existing Game</CardTitle>
        <CardDescription>
          Enter a game code to join an existing game
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="gameCode" className="text-sm font-medium">
                Game Code
              </label>
              <InputOTP 
                maxLength={5}
                value={gameCode}
                onChange={setGameCode}
                className="flex justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="uppercase" />
                  <InputOTPSlot index={1} className="uppercase" />
                  <InputOTPSlot index={2} className="uppercase" />
                  <InputOTPSlot index={3} className="uppercase" />
                  <InputOTPSlot index={4} className="uppercase" />
                </InputOTPGroup>
              </InputOTP>
            </div>
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
            className="game-button-secondary w-full"
            disabled={isJoining || gameCode.length < 5 || !nickname.trim()}
          >
            {isJoining ? "Joining..." : "Join Game"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinGame;
