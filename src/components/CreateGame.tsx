
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
        console.log("Partita creata con successo con ID:", result.gameId);
        
        // Memorizza i dati nel localStorage prima di navigare
        localStorage.setItem("current_game_id", result.gameId);
        localStorage.setItem(`player_id_${result.gameId}`, result.playerId);
        
        toast.success(`Partita creata! Il tuo codice è ${result.gameCode}`);
        
        // Piccolo ritardo prima di navigare per assicurarsi che i dati siano memorizzati
        setTimeout(() => {
          console.log("Navigazione alla partita:", result.gameId);
          navigate(`/game/${result.gameId}`);
        }, 200);
      } else {
        console.error("Impossibile creare la partita - nessun risultato restituito");
        toast.error("Impossibile creare la partita. Riprova.");
      }
    } catch (err) {
      console.error("Errore nel modulo di creazione partita:", err);
      toast.error("Errore durante la creazione della partita. Riprova.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Crea Nuova Partita</CardTitle>
        <CardDescription>
          Crea una nuova partita e invita amici a giocare
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
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
            className="game-button-primary w-full"
            disabled={isCreating || !nickname.trim()}
          >
            {isCreating ? "Creazione..." : "Crea Partita"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateGame;
