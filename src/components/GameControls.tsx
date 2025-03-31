
import { Button } from "@/components/ui/button";
import { Game } from "@/types/game";

interface GameControlsProps {
  game: Game;
  isHost: boolean;
  onStartNextRound: () => void;
}

const GameControls = ({ game, isHost, onStartNextRound }: GameControlsProps) => {
  if (!isHost) return null;
  
  return (
    <div className="fixed bottom-4 right-4">
      <Button 
        onClick={onStartNextRound}
        className="game-button-primary"
      >
        {game.rounds.length > 0 ? "Start Next Round" : "Start Game"}
      </Button>
    </div>
  );
};

export default GameControls;
