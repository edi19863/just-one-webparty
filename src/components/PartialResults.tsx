
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Game, Round } from "@/types/game";
import { useIsMobile } from "@/hooks/use-mobile";

interface PartialResultsProps {
  game: Game;
}

const PartialResults = ({ game }: PartialResultsProps) => {
  const isMobile = useIsMobile();
  
  // Mostra solo i turni completati (non quello corrente)
  const completedRounds = game.rounds.filter(round => round.completed);
  
  if (completedRounds.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-game-card border-game-border mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg">Punteggio Parziale</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {isMobile ? (
            // Vista mobile: layout a carte
            <div className="px-2 py-1">
              {completedRounds.map((round) => (
                <div 
                  key={round.roundNumber} 
                  className="border-b border-game-border py-2 last:border-0"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Turno {round.roundNumber}</span>
                    <span className="text-right">
                      {round.correct ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-900 text-green-300">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900 text-red-300">✗</span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-game-muted">Parola:</span>
                      <div className="font-medium">{round.secretWord}</div>
                    </div>
                    <div>
                      <span className="text-game-muted">Indovino:</span>
                      <div>{round.guesserName}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-game-muted">Risposta:</span>
                      <div>{round.guess}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Vista desktop: tabella
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
          )}
        </div>
        
        <div className="py-3 px-4 border-t border-game-border">
          <div className="flex flex-wrap justify-between items-center gap-2">
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
