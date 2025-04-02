
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateGame from "@/components/CreateGame";
import JoinGame from "@/components/JoinGame";
import { useGameState } from "@/hooks/useGameState";
import { toast } from "sonner";
import { GameMode } from "@/types/game";

const Index = () => {
  const { createGame, joinGame } = useGameState();
  const navigate = useNavigate();
  const [checkingExistingGame, setCheckingExistingGame] = useState(true);
  
  // Verifica se abbiamo una partita in corso e reindirizza ad essa
  useEffect(() => {
    const checkExistingGame = async () => {
      try {
        const savedGameId = localStorage.getItem("current_game_id");
        
        if (savedGameId) {
          const savedPlayerId = localStorage.getItem(`player_id_${savedGameId}`);
          
          if (savedPlayerId) {
            console.log(`Partita esistente trovata: ${savedGameId} con giocatore: ${savedPlayerId}`);
            // Non è necessario verificare la partita qui - Game.tsx se ne occuperà
            // Reindirizza semplicemente alla pagina della partita
            navigate(`/game/${savedGameId}`);
            return;
          } else {
            // ID giocatore non trovato, cancella ID partita
            localStorage.removeItem("current_game_id");
          }
        }
      } catch (err) {
        console.error("Errore nel controllo della partita esistente:", err);
        // Cancella lo storage potenzialmente corrotto
        localStorage.removeItem("current_game_id");
      } finally {
        setCheckingExistingGame(false);
      }
    };
    
    checkExistingGame();
  }, [navigate]);
  
  const handleCreateGame = async (nickname: string, mode: GameMode) => {
    try {
      console.log(`Creazione nuova partita con nickname: ${nickname}, modalità: ${mode}`);
      const result = await createGame(nickname, mode);
      
      if (result) {
        console.log(`Partita creata con ID: ${result.gameId}, codice: ${result.gameCode}`);
        return result;
      } else {
        console.error("Creazione partita fallita - nessun risultato restituito");
        toast.error("Impossibile creare la partita. Riprova.");
      }
      return null;
    } catch (err) {
      console.error("Errore durante la creazione della partita:", err);
      toast.error("Impossibile creare la partita. Riprova.");
      return null;
    }
  };
  
  const handleJoinGame = async (code: string, nickname: string) => {
    try {
      console.log("Partecipazione alla partita con codice:", code);
      const result = await joinGame(code, nickname);
      
      if (result) {
        console.log(`Partecipazione alla partita con ID: ${result.gameId}`);
        return result;
      }
      return null;
    } catch (err) {
      console.error("Errore durante la partecipazione alla partita:", err);
      toast.error("Impossibile partecipare alla partita. Controlla il codice e riprova.");
      return null;
    }
  };

  if (checkingExistingGame) {
    return (
      <div className="min-h-screen bg-game-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-text animate-pulse-light">Caricamento...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-game-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-game-primary mb-4">Just One</h1>
          <p className="text-xl text-game-text">
            Il divertente gioco di parole multiplayer per giocare con gli amici!
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <CreateGame onCreateGame={handleCreateGame} />
          <JoinGame onJoinGame={handleJoinGame} />
        </div>
        
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4 text-game-text">Come si gioca</h2>
          <ol className="text-left space-y-3 text-game-text pl-6 list-decimal">
            <li>Un giocatore viene selezionato casualmente come indovino ad ogni turno.</li>
            <li>Tutti gli altri giocatori vedono una parola segreta che l'indovino deve scoprire.</li>
            <li>Ogni giocatore non indovino invia un indizio di una parola per aiutare l'indovino.</li>
            <li>Gli indizi identici o simili vengono automaticamente filtrati.</li>
            <li>L'indovino vede gli indizi rimanenti e fa un tentativo.</li>
            <li>Si ottengono punti per le risposte corrette!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Index;
