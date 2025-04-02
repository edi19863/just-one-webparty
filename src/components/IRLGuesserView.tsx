
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameStatus, Round } from "@/types/game";
import { CheckCircle, XCircle } from "lucide-react";

interface IRLGuesserViewProps {
  round: Round;
  status: GameStatus;
  onUpdateGuessResult: (isCorrect: boolean) => void;
}

const IRLGuesserView = ({ round, status, onUpdateGuessResult }: IRLGuesserViewProps) => {
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmitResult = async (isCorrect: boolean) => {
    setSubmitting(true);
    try {
      await onUpdateGuessResult(isCorrect);
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderGuessButtons = () => {
    return (
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Button
          className="p-6 h-auto flex flex-col items-center bg-green-900 hover:bg-green-800 text-green-300 rounded-xl"
          onClick={() => handleSubmitResult(true)}
          disabled={submitting}
        >
          <CheckCircle size={48} className="mb-2" />
          <span className="text-xl font-bold">INDOVINATO!</span>
        </Button>
        
        <Button
          className="p-6 h-auto flex flex-col items-center bg-red-900 hover:bg-red-800 text-red-300 rounded-xl"
          onClick={() => handleSubmitResult(false)}
          disabled={submitting}
        >
          <XCircle size={48} className="mb-2" />
          <span className="text-xl font-bold">PERSO</span>
        </Button>
      </div>
    );
  };
  
  const renderContent = () => {
    switch (status) {
      case GameStatus.SUBMITTING_CLUES:
        return (
          <div className="text-center py-8 space-y-4">
            <div className="text-3xl font-bold text-yellow-300 animate-pulse">
              ATTENDI GLI INDIZI
            </div>
            <p className="text-lg">
              Gli altri giocatori stanno scrivendo i loro indizi.
              <br />Non guardare i loro schermi!
            </p>
          </div>
        );
      
      case GameStatus.REVIEWING_CLUES:
        return (
          <div className="text-center py-8 space-y-4">
            <div className="text-3xl font-bold text-yellow-300">
              CONFRONTO INDIZI
            </div>
            <p className="text-lg">
              I giocatori stanno comparando gli indizi e rimuovendo i duplicati.
              <br />Continua a non guardare i loro schermi!
            </p>
          </div>
        );
        
      case GameStatus.GUESSING:
        return (
          <div className="space-y-8">
            <div className="text-center py-6">
              <h3 className="text-2xl font-bold mb-3">È il tuo turno di indovinare!</h3>
              <p className="text-lg">
                Gli altri giocatori ti mostreranno ora i loro indizi.
                <br />Dopo aver fatto il tuo tentativo, indica il risultato:
              </p>
            </div>
            
            {renderGuessButtons()}
          </div>
        );
        
      default:
        return <div>Stato sconosciuto</div>;
    }
  };
  
  return (
    <Card className="bg-game-card border-game-border">
      <CardHeader>
        <CardTitle className="text-center text-xl">Sei l'Indovino</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default IRLGuesserView;
