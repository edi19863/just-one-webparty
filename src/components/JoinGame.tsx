
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

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
      const result = await onJoinGame(gameCode.trim(), nickname.trim());
      if (result) {
        navigate(`/game/${result.gameId}`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  // Auto-format game code to uppercase
  const handleGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameCode(e.target.value.toUpperCase());
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
              <Input
                id="gameCode"
                placeholder="Enter 5-character code"
                value={gameCode}
                onChange={handleGameCodeChange}
                required
                className="game-input text-center uppercase tracking-wider"
                maxLength={5}
              />
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
            disabled={isJoining || !gameCode.trim() || !nickname.trim()}
          >
            {isJoining ? "Joining..." : "Join Game"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinGame;
