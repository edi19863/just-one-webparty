
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeaderProps {
  gameCode?: string;
  onLeaveGame?: () => void;
}

const Header = ({ gameCode, onLeaveGame }: HeaderProps) => {
  return (
    <header className="bg-game-card border-b border-game-border py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-game-primary">Just One</Link>
        
        <div className="flex items-center gap-4">
          {gameCode && (
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium text-game-text">Codice Partita:</span>
              <span className="game-code">{gameCode}</span>
            </div>
          )}
          
          {onLeaveGame && (
            <Button 
              variant="outline" 
              onClick={onLeaveGame}
              className="text-game-text hover:text-game-error border-game-border hover:border-game-error"
            >
              Abbandona
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
