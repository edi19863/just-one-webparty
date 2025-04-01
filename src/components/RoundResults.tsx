
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
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">Round {round.roundNumber} Results</h2>
      
      {/* Responsive result section */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6 mt-4">
        <div className="text-center px-4 py-3 md:px-8 md:py-4 rounded-lg border-2 bg-gray-50 w-full md:w-auto">
          <div className="text-sm font-medium text-gray-500 mb-1">Secret Word</div>
          <div className="text-2xl md:text-3xl font-bold">{round.secretWord}</div>
        </div>
        
        <div className="flex items-center justify-center my-2 md:mx-4">
          {round.correct ? (
            <Check size={32} className="text-green-500" />
          ) : (
            <X size={32} className="text-red-500" />
          )}
        </div>
        
        <div className="text-center px-4 py-3 md:px-8 md:py-4 rounded-lg border-2 bg-gray-50 w-full md:w-auto">
          <div className="text-sm font-medium text-gray-500 mb-1">Guess</div>
          <div className="text-2xl md:text-3xl font-bold">{round.guess}</div>
        </div>
      </div>
      
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg font-medium mb-2 md:mb-3">Valid Clues:</h3>
        <div className="flex flex-wrap gap-2">
          {validClues.length > 0 ? (
            validClues.map((clue) => (
              <div 
                key={clue.playerId} 
                className="bg-white px-3 py-2 rounded-md border border-gray-200 text-sm md:text-base"
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
        <div className="mb-4 md:mb-6">
          <h3 className="text-lg font-medium mb-2 md:mb-3">Filtered Clues:</h3>
          <div className="flex flex-wrap gap-2">
            {filteredClues.map((clue) => (
              <div 
                key={clue.playerId} 
                className="bg-gray-100 px-3 py-2 rounded-md border border-gray-200 text-gray-500 text-sm md:text-base"
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
      
      <div className="flex justify-center mt-4 md:mt-6">
        {isHost ? (
          <Button 
            onClick={onStartNextRound} 
            className="game-button-primary w-full md:w-auto"
          >
            Start Next Round
          </Button>
        ) : (
          <p className="italic text-gray-500 text-center">
            Waiting for host to start next round...
          </p>
        )}
      </div>
    </div>
  );
};

export default RoundResults;
