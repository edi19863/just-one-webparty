
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ClueInputProps {
  onSubmitClue: (clue: string) => void;
  secretWord: string;
}

const ClueInput = ({ onSubmitClue, secretWord }: ClueInputProps) => {
  const [clue, setClue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  const validateClue = (input: string): boolean => {
    const trimmedClue = input.trim();
    
    if (!trimmedClue) {
      setError("Clue cannot be empty");
      return false;
    }
    
    if (trimmedClue.toLowerCase() === secretWord.toLowerCase()) {
      setError("Clue cannot be the secret word");
      return false;
    }
    
    if (trimmedClue.split(/\s+/).length > 1) {
      setError("Clue must be a single word");
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateClue(clue)) {
      onSubmitClue(clue);
      setSubmitted(true);
    }
  };
  
  if (submitted) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6 text-center">
          <h3 className="text-xl font-medium text-game-secondary mb-2">
            Clue Submitted!
          </h3>
          <p className="text-gray-600">
            Waiting for other players to submit their clues...
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Submit Your Clue</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="clue" className="text-sm font-medium">
                Your One-Word Clue
              </label>
              <Input
                id="clue"
                placeholder="Enter a single word"
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                className="game-input"
              />
              
              {error && (
                <div className="flex items-center text-game-error text-sm mt-1">
                  <AlertCircle size={16} className="mr-1" /> {error}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="font-medium">Rules:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Must be a single word</li>
                <li>Cannot be the secret word</li>
                <li>Cannot be a proper noun or abbreviation</li>
                <li>Identical clues will be removed</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="game-button-secondary w-full"
            disabled={!clue.trim()}
          >
            Submit Clue
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ClueInput;
