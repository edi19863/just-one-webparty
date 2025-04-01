
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Game, Round } from "@/types/game";

interface PartialResultsProps {
  game: Game;
}

const PartialResults = ({ game }: PartialResultsProps) => {
  // Mostra solo i turni completati (non quello corrente)
  const completedRounds = game.rounds.filter(round => round.completed);
  
  if (completedRounds.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-game-card border-game-border mb-6">
      <CardHeader>
        <CardTitle className="text-center">Punteggio Parziale</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-game-border text-sm text-game-muted">
                <th className="py-2 px-4 text-left">Turno</th>
                <th className="py-2 px-4 text-left">Parola</th>
                <th className="py-2 px-4 text-left">Indovino</th>
                <th className="py-2 px-4 text-left">Risposta</th>
                <th className="py-2 px-4 text-center">Risultato</th>
              </tr>
            </thead>
            <tbody>
              {completedRounds.map((round) => (
                <tr key={round.roundNumber} className="border-b border-game-border hover:bg-gray-800">
                  <td className="py-2 px-4">{round.roundNumber}</td>
                  <td className="py-2 px-4 font-medium">{round.secretWord}</td>
                  <td className="py-2 px-4">{round.guesserName}</td>
                  <td className="py-2 px-4">{round.guess}</td>
                  <td className="py-2 px-4 text-center">
                    {round.correct ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-900 text-green-300">✓</span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900 text-red-300">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="py-3 px-4 border-t border-game-border">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-game-muted">Totale turni:</span> {completedRounds.length}
            </div>
            <div className="text-sm">
              <span className="text-game-muted">Indovinati:</span> {completedRounds.filter(r => r.correct).length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartialResults;
