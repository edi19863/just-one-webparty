
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameStatus, Round, ClueStatus } from "@/types/game";
import { CheckCircle, Eraser, Check, X } from "lucide-react";

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
  const [clueStatuses, setClueStatuses] = useState<ClueStatus[]>([]);
  const [cluePreview, setCluePreview] = useState<string | null>(null);
  
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

  // Initialize clue statuses when round changes or status changes to reviewing clues
  useEffect(() => {
    if (status === GameStatus.REVIEWING_CLUES && round.clues.length > 0) {
      const initialStatuses = round.clues.map(clue => ({
        playerId: clue.playerId,
        playerName: clue.playerName,
        status: 'undecided' as const
      }));
      setClueStatuses(initialStatuses);
    }
  }, [status, round.clues]);
  
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
    
    // Update the preview after each drawing action
    if (canvasRef.current) {
      setCluePreview(canvasRef.current.toDataURL("image/png"));
    }
  };
  
  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
    
    // Save final preview
    if (canvasRef.current) {
      setCluePreview(canvasRef.current.toDataURL("image/png"));
    }
  };
  
  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Clear the preview as well
    setCluePreview(null);
  };
  
  const handleMarkClueWritten = async () => {
    // Save the preview before submitting
    if (canvasRef.current) {
      setCluePreview(canvasRef.current.toDataURL("image/png"));
    }
    
    setSubmitting(true);
    try {
      await onMarkClueWritten();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleClueStatus = (playerId: string, newStatus: 'unique' | 'duplicate') => {
    setClueStatuses(prev => 
      prev.map(clueStatus => 
        clueStatus.playerId === playerId
          ? { ...clueStatus, status: newStatus }
          : clueStatus
      )
    );
  };

  const renderClueStatusButtons = () => {
    if (clueStatuses.length === 0) return null;

    return (
      <div className="space-y-4 mt-4">
        {clueStatuses.map((clueStatus) => (
          <div key={clueStatus.playerId} className="flex items-center justify-between border p-3 rounded-lg bg-game-card/40">
            <div className="font-medium">{clueStatus.playerName}</div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleClueStatus(clueStatus.playerId, 'unique')}
                className={`${
                  clueStatus.status === 'unique' 
                    ? 'bg-green-800/20 text-green-500' 
                    : 'text-gray-400'
                } hover:bg-green-800/30 hover:text-green-500`}
              >
                <Check className="mr-1 h-4 w-4" />
                Unico
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleClueStatus(clueStatus.playerId, 'duplicate')}
                className={`${
                  clueStatus.status === 'duplicate' 
                    ? 'bg-red-800/20 text-red-500' 
                    : 'text-gray-400'
                } hover:bg-red-800/30 hover:text-red-500`}
              >
                <X className="mr-1 h-4 w-4" />
                Multiplo
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
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
              {cluePreview ? (
                <div className="relative border-2 border-gray-500 rounded-lg overflow-hidden bg-white">
                  <img
                    src={cluePreview}
                    alt="Tuo indizio"
                    className="w-full h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="relative border-2 border-gray-500 rounded-lg overflow-hidden bg-white">
                  <div className="w-full h-64 flex items-center justify-center text-gray-400">
                    Nessuna anteprima disponibile
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center py-3">
              <h3 className="text-xl font-bold mb-2">Confronto Indizi</h3>
              <div className="p-4 bg-game-card border-game-border rounded-md">
                <p>
                  Tutti i giocatori hanno scritto i loro indizi!
                </p>
                <p className="mt-3">
                  Confrontate gli indizi tra voi e indicate quali sono unici e quali sono duplicati:
                </p>
                {renderClueStatusButtons()}
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
              {cluePreview ? (
                <div className="relative border-2 border-gray-500 rounded-lg overflow-hidden bg-white">
                  <img
                    src={cluePreview}
                    alt="Tuo indizio"
                    className="w-full h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="relative border-2 border-gray-500 rounded-lg overflow-hidden bg-white">
                  <div className="w-full h-64 flex items-center justify-center text-gray-400">
                    Nessuna anteprima disponibile
                  </div>
                </div>
              )}
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
