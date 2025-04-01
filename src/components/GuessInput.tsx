
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clue } from "@/types/game";

interface GuessInputProps {
  onSubmitGuess: (guess: string) => void;
  clues: Clue[];
}

const GuessInput = ({ onSubmitGuess, clues }: GuessInputProps) => {
  const [guess, setGuess] = useState("");
  const validClues = clues.filter(clue => !clue.filtered);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onSubmitGuess(guess);
    }
  };
  
  return (
    <Card className="bg-game-card border-game-border">
      <CardHeader>
        <CardTitle>Fai la Tua Ipotesi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-game-border">
            <h4 className="font-medium mb-3">Indizi dagli altri giocatori:</h4>
            {validClues.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {validClues.map((clue) => (
                  <div 
                    key={clue.playerId} 
                    className="bg-gray-700 px-3 py-1 rounded-full border border-gray-600 shadow-sm"
                  >
                    {clue.word}
                    <span className="text-xs text-game-muted ml-1">
                      ({clue.playerName})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-game-muted italic">
                Nessun indizio valido è stato inviato.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="guess" className="text-sm font-medium">
              La Tua Ipotesi
            </label>
            <Input
              id="guess"
              placeholder="Qual è la parola segreta?"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="game-input"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          className="game-button-accent w-full"
          disabled={!guess.trim()}
        >
          Invia Ipotesi
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GuessInput;
