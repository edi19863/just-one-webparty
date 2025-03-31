
import { useEffect } from "react";
import { Game, GameStatus } from "@/types/game";
import PlayerList from "./PlayerList";
import ClueInput from "./ClueInput";
import GuessInput from "./GuessInput";
import WordDisplay from "./WordDisplay";
import RoundResults from "./RoundResults";
import GameControls from "./GameControls";

interface GameRoomProps {
  game: Game;
  currentPlayerId: string | null;
  onSubmitClue: (clue: string) => void;
  onSubmitGuess: (guess: string) => void;
  onStartRound: () => void;
}

const GameRoom = ({ game, currentPlayerId, onSubmitClue, onSubmitGuess, onStartRound }: GameRoomProps) => {
  const currentPlayer = game.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayerId === game.host_id; // Changed from hostId to host_id
  const isGuesser = currentPlayer?.isGuesser || false;
  
  // Handle case where we have a current round but need to filter clues
  useEffect(() => {
    const checkAllCluesSubmitted = () => {
      if (game.status === GameStatus.SUBMITTING_CLUES && game.current_round) { // Changed from currentRound to current_round
        const nonGuessers = game.players.filter(p => !p.isGuesser);
        const allCluesSubmitted = nonGuessers.length === game.current_round.clues.length; // Changed from currentRound to current_round
        
        if (allCluesSubmitted && isHost) {
          // Small delay to allow animation
          setTimeout(() => {
            // This would automatically filter clues in a real app
            // For the demo, we rely on the filtering in gameUtils
          }, 1000);
        }
      }
    };
    
    checkAllCluesSubmitted();
  }, [game.status, game.current_round, game.players, isHost]); // Changed from currentRound to current_round
  
  const renderGameContent = () => {
    switch (game.status) {
      case GameStatus.LOBBY:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Waiting to Start</h2>
            <p className="text-gray-600">
              {isHost 
                ? "Click 'Start Game' when everyone is ready to begin." 
                : "Waiting for the host to start the game..."}
            </p>
          </div>
        );
        
      case GameStatus.SUBMITTING_CLUES:
        if (!game.current_round) return null; // Changed from currentRound to current_round
        return (
          <div className="max-w-md mx-auto">
            <WordDisplay 
              word={game.current_round.secretWord} // Changed from currentRound to current_round
              isGuesser={isGuesser} 
            />
            
            {!isGuesser && (
              <ClueInput 
                onSubmitClue={onSubmitClue} 
                secretWord={game.current_round.secretWord} // Changed from currentRound to current_round
              />
            )}
            
            {isGuesser && (
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <h3 className="text-xl font-medium mb-2">You're the guesser!</h3>
                <p className="text-gray-600">
                  Wait while other players submit their clues to help you guess the secret word.
                </p>
              </div>
            )}
          </div>
        );
        
      case GameStatus.REVIEWING_CLUES:
        return (
          <div className="text-center py-12 animate-pulse-light">
            <h2 className="text-2xl font-bold mb-4">Processing Clues</h2>
            <p className="text-gray-600">
              Filtering duplicate and invalid clues...
            </p>
          </div>
        );
        
      case GameStatus.GUESSING:
        if (!game.current_round) return null; // Changed from currentRound to current_round
        return (
          <div className="max-w-md mx-auto">
            <WordDisplay 
              word={game.current_round.secretWord} // Changed from currentRound to current_round
              isGuesser={isGuesser} 
            />
            
            {isGuesser ? (
              <GuessInput 
                onSubmitGuess={onSubmitGuess} 
                clues={game.current_round.clues} // Changed from currentRound to current_round
              />
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <h3 className="text-xl font-medium mb-2">Waiting for guess</h3>
                <p className="text-gray-600">
                  {game.current_round.guesserName} is thinking of the answer using your clues... // Changed from currentRound to current_round
                </p>
              </div>
            )}
          </div>
        );
        
      case GameStatus.ROUND_RESULT:
        if (!game.current_round) return null; // Changed from currentRound to current_round
        return (
          <RoundResults 
            round={game.current_round} // Changed from currentRound to current_round
            onStartNextRound={onStartRound}
            isHost={isHost}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <PlayerList players={game.players} currentPlayerId={currentPlayerId} />
      </div>
      
      <div className="mt-8">
        {renderGameContent()}
      </div>
      
      <GameControls 
        game={game}
        isHost={isHost}
        onStartNextRound={onStartRound}
      />
    </div>
  );
};

export default GameRoom;
