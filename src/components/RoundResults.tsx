
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
    <div className="bg-game-card border-game-border rounded-lg shadow-md p-4 md:p-6 max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">Risultato Turno {round.roundNumber}</h2>
      
      {/* Responsive result section */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6 mt-4">
        <div className="text-center px-4 py-3 md:px-8 md:py-4 rounded-lg border-2 border-game-border bg-gray-800 w-full md:w-auto">
          <div className="text-sm font-medium text-game-muted mb-1">Parola Segreta</div>
          <div className="text-2xl md:text-3xl font-bold text-game-secondary">{round.secretWord}</div>
        </div>
        
        <div className="flex items-center justify-center my-2 md:mx-4">
          {round.correct ? (
            <Check size={32} className="text-game-success" />
          ) : (
            <X size={32} className="text-game-error" />
          )}
        </div>
        
        <div className="text-center px-4 py-3 md:px-8 md:py-4 rounded-lg border-2 border-game-border bg-gray-800 w-full md:w-auto">
          <div className="text-sm font-medium text-game-muted mb-1">Risposta</div>
          <div className="text-2xl md:text-3xl font-bold text-game-accent">{round.guess}</div>
        </div>
      </div>
      
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg font-medium mb-2 md:mb-3">Indizi Validi:</h3>
        <div className="flex flex-wrap gap-2">
          {validClues.length > 0 ? (
            validClues.map((clue) => (
              <div 
                key={clue.playerId} 
                className="bg-gray-800 px-3 py-2 rounded-md border border-gray-700 text-sm md:text-base"
              >
                <span className="font-medium">{clue.word}</span>
                <span className="text-xs text-game-muted block">
                  da {clue.playerName}
                </span>
              </div>
            ))
          ) : (
            <p className="text-game-muted italic">Nessun indizio valido è stato inviato.</p>
          )}
        </div>
      </div>
      
      {filteredClues.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-lg font-medium mb-2 md:mb-3">Indizi Filtrati:</h3>
          <div className="flex flex-wrap gap-2">
            {filteredClues.map((clue) => (
              <div 
                key={clue.playerId} 
                className="bg-gray-900 px-3 py-2 rounded-md border border-gray-700 text-game-muted text-sm md:text-base"
              >
                <span className="font-medium">{clue.word}</span>
                <span className="text-xs text-game-muted block">
                  da {clue.playerName}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-game-muted mt-2">
            Questi indizi sono stati filtrati perché erano duplicati o corrispondevano alla parola segreta.
          </p>
        </div>
      )}
      
      <div className="flex justify-center mt-4 md:mt-6">
        {isHost ? (
          <Button 
            onClick={onStartNextRound} 
            className="game-button-primary w-full md:w-auto"
          >
            Inizia Prossimo Turno
          </Button>
        ) : (
          <p className="italic text-game-muted text-center">
            In attesa che l'host inizi il prossimo turno...
          </p>
        )}
      </div>
    </div>
  );
};

export default RoundResults;
