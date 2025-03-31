
import { Player } from "@/types/game";
import { Crown, User } from "lucide-react";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string | null;
}

const PlayerList = ({ players, currentPlayerId }: PlayerListProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-bold text-lg mb-3">Players ({players.length})</h3>
      <ul className="space-y-2">
        {players.map((player) => (
          <li 
            key={player.id} 
            className={`flex items-center py-2 px-3 rounded-md ${
              player.isGuesser 
                ? 'bg-amber-100 border border-amber-200' 
                : player.id === currentPlayerId 
                  ? 'bg-blue-50 border border-blue-100' 
                  : 'bg-gray-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
              ${player.isHost ? 'bg-game-primary text-white' : 'bg-gray-200'}`}>
              {player.isHost ? <Crown size={16} /> : <User size={16} />}
            </div>
            <span className="font-medium flex-1">
              {player.nickname}
              {player.id === currentPlayerId && " (You)"}
            </span>
            <div className="flex items-center">
              {player.isHost && (
                <span className="text-xs px-2 py-1 bg-game-primary text-white rounded-full mr-2">
                  Host
                </span>
              )}
              {player.isGuesser && (
                <span className="text-xs px-2 py-1 bg-game-accent text-white rounded-full">
                  Guesser
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
