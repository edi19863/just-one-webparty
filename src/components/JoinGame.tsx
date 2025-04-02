
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface JoinGameProps {
  onJoinGame: (code: string, nickname: string) => Promise<{ gameId: string; playerId: string } | null>;
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
        // Memorizza i dati nel localStorage prima di navigare
        localStorage.setItem("current_game_id", result.gameId);
        localStorage.setItem(`player_id_${result.gameId}`, result.playerId);
        
        toast.success(`Ti sei unito alla partita!`);
        
        // Piccolo ritardo prima di navigare per assicurarsi che i dati siano memorizzati
        setTimeout(() => {
          navigate(`/game/${result.gameId}`);
        }, 200);
      } else {
        toast.error("Impossibile partecipare. Controlla il codice e riprova.");
      }
    } catch (err) {
      console.error("Errore nel modulo di partecipazione:", err);
      toast.error("Errore durante la partecipazione alla partita. Riprova.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Partecipa a una Partita Online</CardTitle>
        <CardDescription>
          Unisciti a una partita esistente usando il codice
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="game-code" className="text-sm font-medium">
                Codice Partita
              </label>
              <Input
                id="game-code"
                placeholder="Inserisci codice partita"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                required
                className="game-input"
                maxLength={5}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="nickname-join" className="text-sm font-medium">
                Il tuo Nickname
              </label>
              <Input
                id="nickname-join"
                placeholder="Inserisci il tuo nickname"
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
            disabled={isJoining || !gameCode.trim() || !nickname.trim()}
          >
            {isJoining ? "Partecipazione..." : "Partecipa alla Partita"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinGame;
