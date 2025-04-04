import { useEffect, useState } from "react";
import { Game, GameStatus, GameMode } from "@/types/game";
import PlayerList from "./PlayerList";
import ClueInput from "./ClueInput";
import GuessInput from "./GuessInput";
import WordDisplay from "./WordDisplay";
import RoundResults from "./RoundResults";
import GameControls from "./GameControls";
import PartialResults from "./PartialResults";
import IRLGameRoom from "./IRLGameRoom";
import { getClueStatuses } from "@/lib/supabase";

interface GameRoomProps {
  game: Game;
  currentPlayerId: string | null;
  onSubmitClue: (clue: string) => void;
  onSubmitGuess: (guess: string) => void;
  onStartRound: () => void;
  onMarkClueWritten?: () => void;
  onUpdateGuessResult?: (isCorrect: boolean) => void;
  onUpdateClueStatus?: (status: 'unique' | 'duplicate') => void;
  clueStatuses?: any[];
  getPlayerClueStatus?: (playerId: string) => 'unique' | 'duplicate' | null;
  areAllClueStatusesSelected?: () => boolean;
}

const GameRoom = ({ 
  game, 
  currentPlayerId, 
  onSubmitClue, 
  onSubmitGuess, 
  onStartRound,
  onMarkClueWritten,
  onUpdateGuessResult,
  onUpdateClueStatus,
  getPlayerClueStatus,
  areAllClueStatusesSelected
}: GameRoomProps) => {
  const [clueStatuses, setClueStatuses] = useState<any[]>([]);
  
  useEffect(() => {
    console.log("GameRoom rendering with mode:", game.mode);
  }, [game.mode]);
  
  useEffect(() => {
    const loadClueStatuses = async () => {
      if (game.current_round) {
        try {
          const statuses = await getClueStatuses(game.id, game.current_round.roundNumber);
          setClueStatuses(statuses);
        } catch (err) {
          console.error("Error loading clue statuses:", err);
        }
      }
    };
    
    loadClueStatuses();
  }, [game.id, game.current_round]);
  
  if (game.mode === GameMode.IRL) {
    console.log("Rendering IRL Game Room");
    return (
      <IRLGameRoom
        game={game}
        currentPlayerId={currentPlayerId}
        onMarkClueWritten={onMarkClueWritten || (() => {})}
        onUpdateGuessResult={onUpdateGuessResult || (() => {})}
        onStartRound={onStartRound}
        onUpdateClueStatus={onUpdateClueStatus || (() => {})}
        getPlayerClueStatus={getPlayerClueStatus || (() => null)}
        areAllClueStatusesSelected={areAllClueStatusesSelected || (() => false)}
        clueStatuses={clueStatuses}
      />
    );
  }
  
  console.log("Rendering Online Game Room");
  const currentPlayer = game.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayerId === game.host_id;
  const isGuesser = currentPlayer?.isGuesser || false;
  
  useEffect(() => {
    const checkAllCluesSubmitted = () => {
      if (game.status === GameStatus.SUBMITTING_CLUES && game.current_round) {
        const nonGuessers = game.players.filter(p => !p.isGuesser);
        const allCluesSubmitted = nonGuessers.length === game.current_round.clues.length;
        
        if (allCluesSubmitted && isHost) {
          setTimeout(() => {
            // This would automatically filter clues in a real app
            // For the demo, we rely on the filtering in gameUtils
          }, 1000);
        }
      }
    };
    
    checkAllCluesSubmitted();
  }, [game.status, game.current_round, game.players, isHost]);
  
  const renderGameContent = () => {
    switch (game.status) {
      case GameStatus.LOBBY:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">In Attesa di Iniziare</h2>
            <p className="text-game-muted">
              {isHost 
                ? "Clicca 'Inizia Gioco' quando tutti sono pronti." 
                : "In attesa che l'host inizi il gioco..."}
            </p>
          </div>
        );
        
      case GameStatus.SUBMITTING_CLUES:
        if (!game.current_round) return null;
        return (
          <div className="max-w-md mx-auto">
            <WordDisplay 
              word={game.current_round.secretWord}
              isGuesser={isGuesser} 
            />
            
            {!isGuesser && (
              <ClueInput 
                onSubmitClue={onSubmitClue} 
                secretWord={game.current_round.secretWord}
              />
            )}
            
            {isGuesser && (
              <div className="bg-game-card border-game-border rounded-lg p-6 shadow-md text-center">
                <h3 className="text-xl font-medium mb-2">Sei l'indovino!</h3>
                <p className="text-game-muted">
                  Attendi mentre gli altri giocatori inviano i loro indizi per aiutarti a indovinare la parola segreta.
                </p>
              </div>
            )}
          </div>
        );
        
      case GameStatus.REVIEWING_CLUES:
        return (
          <div className="text-center py-12 animate-pulse-light">
            <h2 className="text-2xl font-bold mb-4">Elaborazione Indizi</h2>
            <p className="text-game-muted">
              Filtraggio indizi duplicati e non validi...
            </p>
          </div>
        );
        
      case GameStatus.GUESSING:
        if (!game.current_round) return null;
        return (
          <div className="max-w-md mx-auto">
            <WordDisplay 
              word={game.current_round.secretWord}
              isGuesser={isGuesser} 
            />
            
            {isGuesser ? (
              <GuessInput 
                onSubmitGuess={onSubmitGuess} 
                clues={game.current_round.clues}
              />
            ) : (
              <div className="bg-game-card border-game-border rounded-lg p-6 shadow-md text-center">
                <h3 className="text-xl font-medium mb-2">In attesa della risposta</h3>
                <p className="text-game-muted">
                  {game.current_round.guesserName} sta pensando alla risposta utilizzando i vostri indizi...
                </p>
              </div>
            )}
          </div>
        );
        
      case GameStatus.ROUND_RESULT:
        if (!game.current_round) return null;
        return (
          <RoundResults 
            round={game.current_round}
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
        <PlayerList 
          players={game.players} 
          currentPlayerId={currentPlayerId}
          game={game}
          clueStatuses={getPlayerClueStatus}
        />
      </div>
      
      {game.status !== GameStatus.ROUND_RESULT && game.rounds.some(r => r.completed) && (
        <div className="mb-6">
          <PartialResults game={game} />
        </div>
      )}
      
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
