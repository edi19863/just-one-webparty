
import { Button } from "@/components/ui/button";
import { Game, GameStatus } from "@/types/game";

interface GameControlsProps {
  game: Game;
  isHost: boolean;
  onStartNextRound: () => void;
}

const GameControls = ({ game, isHost, onStartNextRound }: GameControlsProps) => {
  if (!isHost) return null;
  
  // Hide the button during the GUESSING and REVIEWING_CLUES phases in IRL mode 
  // Only show it in the LOBBY or ROUND_RESULT states
  const shouldShowButton = 
    game.status === GameStatus.LOBBY || 
    game.status === GameStatus.ROUND_RESULT;
  
  if (!shouldShowButton) return null;
  
  return (
    <div className="fixed bottom-4 right-4">
      <Button 
        onClick={onStartNextRound}
        className="game-button-primary"
      >
        {game.rounds.length > 0 ? "Inizia Prossimo Round" : "Inizia Gioco"}
      </Button>
    </div>
  );
};

export default GameControls;
