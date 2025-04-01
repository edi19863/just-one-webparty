
import { Card, CardContent } from "@/components/ui/card";

interface WordDisplayProps {
  word: string;
  isGuesser?: boolean;
}

const WordDisplay = ({ word, isGuesser = false }: WordDisplayProps) => {
  return (
    <Card className="bg-game-card border-game-border mb-6">
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
        <h3 className="font-medium text-lg mb-2">
          {isGuesser ? "Sei l'indovino di questo turno" : "La parola segreta è:"}
        </h3>
        
        {isGuesser ? (
          <div className="text-3xl font-bold mt-2 text-game-primary">
            ? ? ?
          </div>
        ) : (
          <div className="text-4xl font-bold tracking-wider mt-2 text-game-primary animate-pulse-light">
            {word}
          </div>
        )}
        
        {isGuesser ? (
          <p className="text-sm text-game-muted mt-3">
            Gli altri giocatori ti stanno dando indizi
          </p>
        ) : (
          <p className="text-sm text-game-muted mt-3">
            Dai un indizio di una parola per aiutare l'indovino
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WordDisplay;
