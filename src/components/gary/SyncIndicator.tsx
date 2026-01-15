import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncIndicatorProps {
  status: SyncStatus;
  pendingCount: number;
  isOnline: boolean;
  onForceSync?: () => void;
  className?: string;
}

/**
 * Indicateur visuel du statut de synchronisation
 * Affiche l'état de connexion et le nombre de modifications en attente
 */
export function SyncIndicator({
  status,
  pendingCount,
  isOnline,
  onForceSync,
  className
}: SyncIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: Check,
          label: 'Synchronisé',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          icon: Cloud,
          label: `${pendingCount} en attente`,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          label: 'Synchronisation...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          animate: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Erreur de sync',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'offline':
        return {
          icon: CloudOff,
          label: 'Hors ligne',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
      default:
        return {
          icon: Cloud,
          label: 'Inconnu',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium transition-all',
              config.bgColor,
              config.borderColor,
              config.color,
              className
            )}
          >
            {/* Indicateur de connexion */}
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            
            {/* Icône de statut */}
            <Icon 
              className={cn(
                'w-3.5 h-3.5',
                config.animate && 'animate-spin'
              )} 
            />
            
            {/* Label court sur mobile, complet sur desktop */}
            <span className="hidden sm:inline">{config.label}</span>
            
            {/* Badge count si pending */}
            {status === 'pending' && pendingCount > 0 && (
              <span className="sm:hidden bg-amber-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm">
            <p className="font-medium">{config.label}</p>
            {!isOnline && (
              <p className="text-muted-foreground mt-1">
                Les modifications sont sauvegardées localement et seront synchronisées à la reconnexion.
              </p>
            )}
            {status === 'pending' && isOnline && onForceSync && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto mt-1"
                onClick={onForceSync}
              >
                Synchroniser maintenant
              </Button>
            )}
            {status === 'error' && (
              <p className="text-red-600 mt-1">
                Une erreur est survenue. Réessayez plus tard.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
