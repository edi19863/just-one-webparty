
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
  const isHost = currentPlayerId === game.host_id;
  
  const copyGameCode = () => {
    navigator.clipboard.writeText(game.code);
    setCopied(true);
    toast({
      title: "Codice copiato!",
      description: "Condividi questo codice con i tuoi amici per farli partecipare.",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-game-text">Lobby di gioco</h1>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-sm text-game-text mb-1">Condividi questo codice con gli amici</p>
              <div className="game-code text-4xl">{game.code}</div>
            </div>
            <Button 
              variant="outline" 
              className="ml-2 flex items-center gap-2 border-game-border text-game-text hover:bg-game-primary/20"
              onClick={copyGameCode}
            >
              <Share2 size={16} />
              {copied ? "Copiato!" : "Copia"}
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
              Inizia partita
            </Button>
          ) : (
            <p className="text-game-text italic">In attesa che l'host avvii la partita...</p>
          )}
          
          {game.players.length < 2 && (
            <p className="text-game-error mt-2 text-sm">
              Servono almeno 2 giocatori per iniziare
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
