import { AlertTriangle, Image, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/utils/imageCompression';

interface QueuedPhoto {
  id: string;
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  localPreview: string;
  originalSize: number;
  compressedSize?: number;
}

interface PhotoQueuePanelProps {
  queue: QueuedPhoto[];
  isProcessing: boolean;
  isOnline: boolean;
  isSlowConnection: boolean;
  onRetry?: () => void;
  onRemove?: (id: string) => void;
  className?: string;
}

/**
 * Panneau affichant la queue d'upload des photos
 * Montre la progression et les erreurs
 */
export function PhotoQueuePanel({
  queue,
  isProcessing,
  isOnline,
  isSlowConnection,
  onRetry,
  onRemove,
  className
}: PhotoQueuePanelProps) {
  const pendingItems = queue.filter(q => q.status !== 'done');
  const errorItems = queue.filter(q => q.status === 'error');
  const processingItems = queue.filter(q => q.status === 'compressing' || q.status === 'uploading');

  // Ne rien afficher si pas d'items en attente
  if (pendingItems.length === 0) return null;

  const totalOriginalSize = pendingItems.reduce((acc, q) => acc + q.originalSize, 0);
  const totalCompressedSize = pendingItems.reduce((acc, q) => acc + (q.compressedSize || q.originalSize), 0);
  const compressionRatio = totalOriginalSize > 0 
    ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100) 
    : 0;

  return (
    <div className={cn(
      'bg-background border rounded-lg shadow-lg overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            Upload photos
          </span>
          {isProcessing && (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {pendingItems.length} en attente
        </div>
      </div>

      {/* Alerte connexion lente */}
      {isSlowConnection && (
        <div className="bg-amber-50 dark:bg-amber-950/30 px-3 py-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          Connexion lente détectée. L'upload peut prendre plus de temps.
        </div>
      )}

      {/* Alerte offline */}
      {!isOnline && (
        <div className="bg-destructive/10 px-3 py-2 flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="w-3.5 h-3.5" />
          Hors ligne. Les photos seront uploadées à la reconnexion.
        </div>
      )}

      {/* Statistiques compression */}
      {compressionRatio > 0 && (
        <div className="px-3 py-2 bg-green-50 dark:bg-green-950/30 text-xs text-green-700 dark:text-green-300">
          📦 Compression: {formatBytes(totalOriginalSize)} → {formatBytes(totalCompressedSize)} 
          <span className="font-medium ml-1">(-{compressionRatio}%)</span>
        </div>
      )}

      {/* Liste des items */}
      <div className="max-h-40 overflow-y-auto">
        {processingItems.map(item => (
          <div key={item.id} className="px-3 py-2 border-b last:border-0 flex items-center gap-3">
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={item.localPreview} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground truncate">
                  {item.status === 'compressing' ? 'Compression...' : 'Upload...'}
                </span>
                <span className="font-medium">{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-1.5" />
            </div>
          </div>
        ))}

        {/* Erreurs */}
        {errorItems.map(item => (
          <div key={item.id} className="px-3 py-2 border-b last:border-0 flex items-center gap-3 bg-red-50 dark:bg-red-950/30">
            <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 relative">
              <img 
                src={item.localPreview} 
                alt="" 
                className="w-full h-full object-cover opacity-50"
              />
              <XCircle className="absolute inset-0 m-auto w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-destructive truncate">
                {item.error || 'Erreur upload'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      {(errorItems.length > 0 && onRetry) && (
        <div className="px-3 py-2 border-t bg-muted/30">
          <Button 
            onClick={onRetry} 
            size="sm" 
            variant="outline" 
            className="w-full"
            disabled={!isOnline}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Réessayer ({errorItems.length})
          </Button>
        </div>
      )}
    </div>
  );
}
