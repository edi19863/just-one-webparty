
import { Button } from "@/components/ui/button";
import { Game } from "@/types/game";
import PlayerList from "./PlayerList";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface LobbyProps {
  game: Game;
  currentPlayerId: string | null;
  onStartGame: () => void;
}

const Lobby = ({ game, currentPlayerId, onStartGame }: LobbyProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const isHost = currentPlayerId === game.host_id; // Changed from hostId to host_id
  
  const copyGameCode = () => {
    navigator.clipboard.writeText(game.code);
    setCopied(true);
    toast({
      title: "Code Copied!",
      description: "Share this code with your friends to let them join.",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Game Lobby</h1>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Share this code with friends</p>
              <div className="game-code text-4xl">{game.code}</div>
            </div>
            <Button 
              variant="outline" 
              className="ml-2 flex items-center gap-2"
              onClick={copyGameCode}
            >
              <Share2 size={16} />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
        
        <PlayerList players={game.players} currentPlayerId={currentPlayerId} />
        
        <div className="mt-8 text-center">
          {isHost ? (
            <Button 
              onClick={onStartGame} 
              className="game-button-primary"
              disabled={game.players.length < 2}
            >
              Start Game
            </Button>
          ) : (
            <p className="text-gray-600 italic">Waiting for host to start the game...</p>
          )}
          
          {game.players.length < 2 && (
            <p className="text-game-error mt-2 text-sm">
              At least 2 players are required to start
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
