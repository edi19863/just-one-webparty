
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { checkWordSimilarity } from "@/utils/wordUtils";

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
      setError("L'indizio non può essere vuoto");
      return false;
    }
    
    if (trimmedClue.toLowerCase() === secretWord.toLowerCase()) {
      setError("L'indizio non può essere la parola segreta");
      return false;
    }
    
    if (trimmedClue.split(/\s+/).length > 1) {
      setError("L'indizio deve essere una singola parola");
      return false;
    }
    
    // Controlla se l'indizio ha la stessa radice o desinenza della parola segreta
    if (checkWordSimilarity(trimmedClue, secretWord)) {
      setError("L'indizio non può avere la stessa radice o desinenza della parola segreta");
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
      <Card className="bg-game-card border-game-border">
        <CardContent className="pt-6 text-center">
          <h3 className="text-xl font-medium text-game-secondary mb-2">
            Indizio Inviato!
          </h3>
          <p className="text-game-muted">
            In attesa che gli altri giocatori inviino i loro indizi...
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-game-card border-game-border">
      <CardHeader>
        <CardTitle>Invia il Tuo Indizio</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="clue" className="text-sm font-medium">
                Il Tuo Indizio (Una Parola)
              </label>
              <Input
                id="clue"
                placeholder="Inserisci una singola parola"
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
            
            <div className="text-sm text-game-muted">
              <p className="font-medium">Regole:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Deve essere una singola parola</li>
                <li>Non può essere la parola segreta</li>
                <li>Non può avere la stessa radice o desinenza della parola segreta</li>
                <li>Non può essere un nome proprio o un'abbreviazione</li>
                <li>Indizi identici verranno rimossi</li>
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
            Invia Indizio
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ClueInput;
