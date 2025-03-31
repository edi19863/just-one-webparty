
import { Card, CardContent } from "@/components/ui/card";

interface WordDisplayProps {
  word: string;
  isGuesser?: boolean;
}

const WordDisplay = ({ word, isGuesser = false }: WordDisplayProps) => {
  return (
    <Card className="bg-white mb-6">
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
        <h3 className="font-medium text-lg mb-2">
          {isGuesser ? "You are the guesser for this round" : "The secret word is:"}
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
          <p className="text-sm text-gray-600 mt-3">
            Other players are giving you clues
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-3">
            Give a one-word clue to help the guesser
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WordDisplay;
