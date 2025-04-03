
import { useEffect, useState } from "react";
import { Game, GameStatus } from "@/types/game";
import PlayerList from "./PlayerList";
import IRLGuesserView from "./IRLGuesserView";
import IRLClueWriterView from "./IRLClueWriterView";
import RoundResults from "./RoundResults";
import GameControls from "./GameControls";
import PartialResults from "./PartialResults";

interface IRLGameRoomProps {
  game: Game;
  currentPlayerId: string | null;
  onMarkClueWritten: () => void;
  onUpdateGuessResult: (isCorrect: boolean) => void;
  onStartRound: () => void;
}

const IRLGameRoom = ({
  game,
  currentPlayerId,
  onMarkClueWritten,
  onUpdateGuessResult,
  onStartRound
}: IRLGameRoomProps) => {
  const currentPlayer = game.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayerId === game.host_id;
  const isGuesser = currentPlayer?.isGuesser || false;
  const [allCluesStatusSelected, setAllCluesStatusSelected] = useState(false);
  
  // Check if the current player has submitted their clue in the current round
  const hasSubmittedClue = game.current_round?.clues.some(
    clue => clue.playerId === currentPlayerId
  ) || false;
  
  // Check if all players have selected a status for their clues
  useEffect(() => {
    if (game.status !== GameStatus.REVIEWING_CLUES && 
        game.status !== GameStatus.GUESSING) {
      setAllCluesStatusSelected(false);
      return;
    }
    
    if (!game.current_round) {
      setAllCluesStatusSelected(false);
      return;
    }
    
    // Get all non-guesser players
    const nonGuesserPlayers = game.players.filter(
      player => player.id !== game.current_round?.guesserId
    );
    
    // Check if at least one player has marked their clue status
    // This is a simplification - ideally we'd check each player's status
    const storageKey = `clue_status_${game.current_round.roundNumber}`;
    const hasStatus = localStorage.getItem(storageKey) !== null;
    
    setAllCluesStatusSelected(hasStatus);
  }, [game.status, game.current_round, game.players]);
  
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
            <p className="mt-4 p-4 bg-yellow-800/30 text-yellow-200 rounded-md">
              Modalità IRL: Tutti i giocatori possono vedere la parola segreta tranne l'indovino.
              Gli indizi vengono scritti sulla lavagna digitale e mostrati fisicamente all'indovino.
            </p>
          </div>
        );
        
      case GameStatus.SUBMITTING_CLUES:
      case GameStatus.REVIEWING_CLUES:
      case GameStatus.GUESSING:
        if (!game.current_round) return null;
        
        if (isGuesser) {
          return (
            <IRLGuesserView 
              round={game.current_round}
              status={game.status}
              onUpdateGuessResult={onUpdateGuessResult}
              allCluesStatusSelected={allCluesStatusSelected}
            />
          );
        } else {
          return (
            <IRLClueWriterView 
              round={game.current_round}
              status={game.status}
              onMarkClueWritten={onMarkClueWritten}
              hasSubmitted={hasSubmittedClue}
            />
          );
        }
        
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
  
  // Clear clue statuses when a new round starts
  useEffect(() => {
    if (game.status === GameStatus.ROUND_RESULT) {
      // When a round ends, we prepare for the next round by clearing status
      const roundNumber = game.current_round?.roundNumber;
      if (roundNumber) {
        localStorage.removeItem(`clue_status_${roundNumber}`);
      }
    }
  }, [game.status, game.current_round]);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <PlayerList 
          players={game.players} 
          currentPlayerId={currentPlayerId}
          game={game} 
        />
      </div>
      
      {/* Mostra i risultati parziali se ci sono turni completati e non siamo nella schermata del risultato */}
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

export default IRLGameRoom;
