
import { Player } from "@/types/game";
import { Crown, User, Check, Clock, Eye } from "lucide-react";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string | null;
  game: any; // Using any because we need just specific parts
}

const PlayerList = ({ players, currentPlayerId, game }: PlayerListProps) => {
  
  const getPlayerStatus = (playerId: string) => {
    if (!game || !game.current_round) {
      return null;
    }
    
    // Check if player is guesser
    if (game.current_round.guesserId === playerId) {
      return {
        text: "Indovino",
        color: "bg-amber-900/70",
        icon: <Eye size={14} className="mr-1" />
      };
    }
    
    // For non-guessers, check clue submission status
    const hasSubmittedClue = game.current_round.clues.some(
      (clue: any) => clue.playerId === playerId
    );
    
    if (hasSubmittedClue) {
      // In reviewing or guessing phase, check if they've marked their clue status
      const clueStatus = localStorage.getItem(`clue_status_${game.current_round.roundNumber}`);
      
      if ((game.status === "reviewing_clues" || game.status === "guessing") && playerId === currentPlayerId) {
        if (clueStatus === "unique") {
          return {
            text: "Indizio unico",
            color: "bg-green-900/70",
            icon: <Check size={14} className="mr-1" />
          };
        }
        if (clueStatus === "duplicate") {
          return {
            text: "Indizio multiplo",
            color: "bg-red-900/70",
            icon: <Check size={14} className="mr-1" />
          };
        }
      }
      
      return {
        text: "Indizio inviato",
        color: "bg-blue-900/70",
        icon: <Check size={14} className="mr-1" />
      };
    }
    
    return {
      text: "In attesa...",
      color: "bg-gray-800/70",
      icon: <Clock size={14} className="mr-1" />
    };
  };
  
  return (
    <div className="bg-game-card rounded-lg shadow-sm p-4 border border-game-border">
      <h3 className="font-bold text-lg mb-3 text-game-text">Giocatori ({players.length})</h3>
      <ul className="space-y-2">
        {players.map((player) => {
          const status = getPlayerStatus(player.id);
          
          return (
            <li 
              key={player.id} 
              className={`flex items-center py-2 px-3 rounded-md ${
                player.isGuesser 
                  ? 'bg-amber-900/70 border border-amber-700' 
                  : player.id === currentPlayerId 
                    ? 'bg-game-primary/20 border border-game-primary/50' 
                    : status?.color || 'bg-gray-800/70 border border-gray-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                ${player.isHost ? 'bg-game-primary text-white' : 'bg-gray-700'}`}>
                {player.isHost ? <Crown size={16} /> : <User size={16} />}
              </div>
              <span className="font-medium flex-1 text-game-text">
                {player.nickname}
                {player.id === currentPlayerId && " (Tu)"}
              </span>
              <div className="flex items-center flex-wrap justify-end">
                {player.isHost && (
                  <span className="text-xs px-2 py-1 bg-game-primary text-white rounded-full mr-2">
                    Host
                  </span>
                )}
                {player.isGuesser && (
                  <span className="text-xs px-2 py-1 bg-game-accent text-white rounded-full mr-2">
                    Indovino
                  </span>
                )}
                {status && !player.isGuesser && (
                  <span className="text-xs px-2 py-1 bg-gray-800 text-white rounded-full flex items-center">
                    {status.icon} {status.text}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlayerList;
