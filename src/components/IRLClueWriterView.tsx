
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameStatus, Round } from "@/types/game";
import { CheckCircle, Eraser } from "lucide-react";

interface IRLClueWriterViewProps {
  round: Round;
  status: GameStatus;
  onMarkClueWritten: () => void;
  hasSubmitted: boolean;
}

const IRLClueWriterView = ({ round, status, onMarkClueWritten, hasSubmitted }: IRLClueWriterViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Set drawing style
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    
    // Fill background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setContext(ctx);
    
    // Adjust canvas size on window resize
    const handleResize = () => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      
      const currentRect = currentCanvas.getBoundingClientRect();
      const currentImageData = ctx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
      
      currentCanvas.width = currentRect.width;
      currentCanvas.height = currentRect.height;
      
      // Restore drawing style
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
      
      // Restore image data
      ctx.putImageData(currentImageData, 0, 0);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    context.beginPath();
    
    // Get coordinates
    let x: number, y: number;
    
    if ('touches' in e) {
      // Touch event
      const rect = canvasRef.current!.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    context.moveTo(x, y);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    // Prevent scrolling when drawing on mobile
    if ('touches' in e) {
      e.preventDefault();
    }
    
    // Get coordinates
    let x: number, y: number;
    
    if ('touches' in e) {
      // Touch event
      const rect = canvasRef.current!.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    context.lineTo(x, y);
    context.stroke();
  };
  
  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };
  
  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  
  const handleMarkClueWritten = async () => {
    setSubmitting(true);
    try {
      await onMarkClueWritten();
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case GameStatus.SUBMITTING_CLUES:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-800/30 text-yellow-200 p-3 rounded-md text-center">
              <p>Parola segreta:</p>
              <p className="text-2xl font-bold mt-1">{round.secretWord}</p>
              <p className="mt-2 text-sm">Non mostrare il tuo schermo all'indovino! ({round.guesserName})</p>
            </div>
            
            <div className="text-center">
              <p className="mb-2">Scrivi il tuo indizio sulla lavagna:</p>
              <div className="relative border-2 border-gray-500 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="touch-none w-full h-64"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>
            
            {hasSubmitted ? (
              <div className="flex items-center justify-center p-3 bg-green-800/20 rounded-md">
                <CheckCircle size={20} className="mr-2 text-green-500" />
                <p>Indizio registrato. Attendi gli altri giocatori.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center"
                  onClick={clearCanvas}
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Cancella
                </Button>
                
                <Button
                  type="button"
                  className="game-button-primary"
                  onClick={handleMarkClueWritten}
                  disabled={submitting}
                >
                  Indizio Scritto
                </Button>
              </div>
            )}
          </div>
        );
      
      case GameStatus.REVIEWING_CLUES:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-800/30 text-yellow-200 p-3 rounded-md text-center">
              <p>Parola segreta:</p>
              <p className="text-2xl font-bold mt-1">{round.secretWord}</p>
              <p className="mt-2 text-sm">Non mostrare il tuo schermo all'indovino! ({round.guesserName})</p>
            </div>
            
            <div className="text-center">
              <p className="mb-2">Il tuo indizio:</p>
              <div className="relative border-2 border-gray-500 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="touch-none w-full h-64 pointer-events-none"
                />
              </div>
            </div>
            
            <div className="text-center py-3">
              <h3 className="text-xl font-bold mb-2">Confronto Indizi</h3>
              <div className="p-4 bg-game-card border-game-border rounded-md">
                <p>
                  Tutti i giocatori hanno scritto i loro indizi!
                </p>
                <p className="mt-3">
                  Per favore confrontate gli indizi tra voi e rimuovete eventuali parole duplicate o simili.
                </p>
              </div>
            </div>
          </div>
        );
        
      case GameStatus.GUESSING:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-800/30 text-yellow-200 p-3 rounded-md text-center">
              <p>Parola segreta:</p>
              <p className="text-2xl font-bold mt-1">{round.secretWord}</p>
              <p className="mt-2 text-sm">Non mostrare il tuo schermo all'indovino! ({round.guesserName})</p>
            </div>
            
            <div className="text-center">
              <p className="mb-2">Il tuo indizio:</p>
              <div className="relative border-2 border-gray-500 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="touch-none w-full h-64 pointer-events-none"
                />
              </div>
            </div>
            
            <div className="text-center py-3">
              <h3 className="text-xl font-bold mb-2">Fase di Indovinello</h3>
              <p>
                Mostrate i vostri indizi all'indovino e lasciate che provi a indovinare la parola segreta.
              </p>
              <p className="mt-3">
                L'indovino ({round.guesserName}) indicherà se ha indovinato o meno.
              </p>
            </div>
          </div>
        );
        
      default:
        return <div>Stato sconosciuto</div>;
    }
  };
  
  return (
    <Card className="bg-game-card border-game-border">
      <CardHeader>
        <CardTitle className="text-center text-xl">Suggerisci un Indizio</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default IRLClueWriterView;
