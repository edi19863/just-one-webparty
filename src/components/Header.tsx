
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeaderProps {
  gameCode?: string;
  onLeaveGame?: () => void;
}

const Header = ({ gameCode, onLeaveGame }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-game-primary">Just One</Link>
        
        <div className="flex items-center gap-4">
          {gameCode && (
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium">Game Code:</span>
              <span className="game-code">{gameCode}</span>
            </div>
          )}
          
          {onLeaveGame && (
            <Button 
              variant="outline" 
              onClick={onLeaveGame}
              className="text-gray-600 hover:text-game-error"
            >
              Leave Game
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
