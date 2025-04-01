
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
      console.log("Partecipazione alla partita con codice:", gameCode.trim());
      const result = await onJoinGame(gameCode.trim(), nickname.trim());
      
      if (result) {
        console.log("Partecipazione alla partita completata con successo:", result.gameId);
        
        // Memorizza i dati nel localStorage prima di navigare
        localStorage.setItem("current_game_id", result.gameId);
        localStorage.setItem(`player_id_${result.gameId}`, result.playerId);
        
        toast.success(`Partita raggiunta con successo!`);
        
        // Piccolo ritardo prima di navigare per assicurarsi che i dati siano memorizzati
        setTimeout(() => {
          console.log("Navigazione alla partita:", result.gameId);
          navigate(`/game/${result.gameId}`);
        }, 200);
      } else {
        toast.error("Impossibile partecipare alla partita. Verifica il codice e riprova.");
      }
    } catch (err) {
      console.error("Errore durante la partecipazione alla partita:", err);
      toast.error("Errore durante la partecipazione alla partita. Riprova.");
    } finally {
      setIsJoining(false);
    }
  };

  // Funzione per gestire i cambiamenti di input e forzare maiuscolo
  const handleGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Converti in maiuscolo e limita a 5 caratteri
    const value = e.target.value.toUpperCase().slice(0, 5);
    setGameCode(value);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Partecipa a una Partita</CardTitle>
        <CardDescription>
          Inserisci un codice per partecipare a una partita esistente
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="gameCode" className="text-sm font-medium">
                Codice Partita
              </label>
              <Input
                id="gameCode"
                placeholder="Inserisci codice di 5 caratteri"
                value={gameCode}
                onChange={handleGameCodeChange}
                className="text-center text-lg font-mono uppercase tracking-wider"
                maxLength={5}
                pattern="[A-Z0-9]{5}"
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                5 caratteri, solo lettere e numeri
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                Il Tuo Nickname
              </label>
              <Input
                id="nickname"
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
            className="game-button-secondary w-full"
            disabled={isJoining || gameCode.length < 5 || !nickname.trim()}
          >
            {isJoining ? "Partecipazione..." : "Partecipa"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinGame;
