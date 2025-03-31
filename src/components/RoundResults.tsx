
import { Button } from "@/components/ui/button";
import { Round } from "@/types/game";
import { Check, X } from "lucide-react";

interface RoundResultsProps {
  round: Round;
  onStartNextRound: () => void;
  isHost: boolean;
}

const RoundResults = ({ round, onStartNextRound, isHost }: RoundResultsProps) => {
  const validClues = round.clues.filter(clue => !clue.filtered);
  const filteredClues = round.clues.filter(clue => clue.filtered);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Round {round.roundNumber} Results</h2>
      
      <div className="flex items-center justify-center mb-8 mt-4">
        <div className="text-center px-8 py-4 rounded-lg border-2 bg-gray-50">
          <div className="text-sm font-medium text-gray-500 mb-1">Secret Word</div>
          <div className="text-3xl font-bold">{round.secretWord}</div>
        </div>
        
        <div className="flex items-center justify-center mx-8">
          {round.correct ? (
            <Check size={36} className="text-green-500" />
          ) : (
            <X size={36} className="text-red-500" />
          )}
        </div>
        
        <div className="text-center px-8 py-4 rounded-lg border-2 bg-gray-50">
          <div className="text-sm font-medium text-gray-500 mb-1">Guess</div>
          <div className="text-3xl font-bold">{round.guess}</div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Valid Clues:</h3>
        <div className="flex flex-wrap gap-2">
          {validClues.length > 0 ? (
            validClues.map((clue) => (
              <div 
                key={clue.playerId} 
                className="bg-white px-4 py-2 rounded-md border border-gray-200"
              >
                <span className="font-medium">{clue.word}</span>
                <span className="text-xs text-gray-500 block">
                  from {clue.playerName}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No valid clues were submitted.</p>
          )}
        </div>
      </div>
      
      {filteredClues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Filtered Clues:</h3>
          <div className="flex flex-wrap gap-2">
            {filteredClues.map((clue) => (
              <div 
                key={clue.playerId} 
                className="bg-gray-100 px-4 py-2 rounded-md border border-gray-200 text-gray-500"
              >
                <span className="font-medium">{clue.word}</span>
                <span className="text-xs text-gray-500 block">
                  from {clue.playerName}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These clues were filtered out because they were duplicates or matched the secret word.
          </p>
        </div>
      )}
      
      <div className="flex justify-center mt-6">
        {isHost ? (
          <Button 
            onClick={onStartNextRound} 
            className="game-button-primary"
          >
            Start Next Round
          </Button>
        ) : (
          <p className="italic text-gray-500">
            Waiting for host to start next round...
          </p>
        )}
      </div>
    </div>
  );
};

export default RoundResults;
