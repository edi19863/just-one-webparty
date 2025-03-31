
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
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Make Your Guess</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Clues from other players:</h4>
            {validClues.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {validClues.map((clue) => (
                  <div 
                    key={clue.playerId} 
                    className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm"
                  >
                    {clue.word}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No valid clues were submitted.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="guess" className="text-sm font-medium">
              Your Guess
            </label>
            <Input
              id="guess"
              placeholder="What's the secret word?"
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
          Submit Guess
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GuessInput;
