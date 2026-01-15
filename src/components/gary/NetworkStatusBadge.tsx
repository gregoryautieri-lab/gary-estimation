import { useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertCircle, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineSync, SyncStatus } from '@/hooks/useOfflineSync';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NetworkStatusBadgeProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Badge de statut réseau affiché en permanence
 * Montre online/offline + nombre de modifications en attente
 */
export function NetworkStatusBadge({ className, showDetails = false }: NetworkStatusBadgeProps) {
  const { isOnline, syncStatus, pendingCount, lastSyncTime, forceSync } = useOfflineSync();
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleForceSync = async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    await forceSync();
    setSyncing(false);
  };

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        label: 'Hors ligne',
        sublabel: pendingCount > 0 ? `${pendingCount} en attente` : undefined,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        pulseColor: 'bg-destructive'
      };
    }

    switch (syncStatus) {
      case 'synced':
        return {
          icon: Check,
          label: 'En ligne',
          sublabel: 'Synchronisé',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800',
          pulseColor: 'bg-green-500'
        };
      case 'pending':
        return {
          icon: Cloud,
          label: 'En ligne',
          sublabel: `${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente`,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
          pulseColor: 'bg-amber-500'
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          label: 'Synchronisation...',
          sublabel: undefined,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          pulseColor: 'bg-blue-500',
          animate: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Erreur de sync',
          sublabel: 'Réessayer',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-800',
          pulseColor: 'bg-red-500'
        };
      default:
        return {
          icon: Cloud,
          label: 'En ligne',
          sublabel: undefined,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          pulseColor: 'bg-muted-foreground'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const showSyncButton = isOnline && (syncStatus === 'pending' || syncStatus === 'error') && pendingCount > 0;

  return (
    <div className={cn('relative', className)}>
      {/* Badge principal */}
      <button
        onClick={() => showDetails && setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all',
          config.bgColor,
          config.borderColor,
          config.color,
          showDetails && 'cursor-pointer hover:opacity-80'
        )}
      >
        {/* Point lumineux animé */}
        <span className="relative flex h-2 w-2">
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            config.pulseColor,
            isOnline && syncStatus === 'synced' && 'animate-none'
          )} />
          <span className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            config.pulseColor
          )} />
        </span>

        {/* Icône connexion */}
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        )}

        {/* Icône statut */}
        <Icon className={cn(
          'w-3.5 h-3.5',
          config.animate && 'animate-spin'
        )} />

        {/* Label */}
        <span className="hidden sm:inline">
          {!isOnline ? 'Hors ligne' : pendingCount > 0 ? `${pendingCount} en attente` : 'Sync'}
        </span>

        {/* Badge count sur mobile */}
        {pendingCount > 0 && (
          <Badge 
            variant="destructive" 
            className="sm:hidden h-4 w-4 p-0 flex items-center justify-center text-[10px]"
          >
            {pendingCount}
          </Badge>
        )}

        {/* Chevron si expandable */}
        {showDetails && (
          expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Panneau étendu */}
      {showDetails && expanded && (
        <div className={cn(
          'absolute top-full right-0 mt-2 w-72 rounded-lg border shadow-lg z-50',
          'bg-background p-3 space-y-3'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn('w-4 h-4', config.color)} />
              <span className="font-medium">{config.label}</span>
            </div>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Statut détaillé */}
          {config.sublabel && (
            <p className="text-sm text-muted-foreground">{config.sublabel}</p>
          )}

          {/* Dernière sync */}
          {lastSyncTime && (
            <p className="text-xs text-muted-foreground">
              Dernière synchronisation : {formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: fr })}
            </p>
          )}

          {/* Bouton sync */}
          {showSyncButton && (
            <Button 
              onClick={handleForceSync} 
              disabled={syncing}
              size="sm" 
              className="w-full"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Synchroniser maintenant
                </>
              )}
            </Button>
          )}

          {/* Message offline */}
          {!isOnline && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Les modifications sont sauvegardées localement et seront synchronisées automatiquement à la reconnexion.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
