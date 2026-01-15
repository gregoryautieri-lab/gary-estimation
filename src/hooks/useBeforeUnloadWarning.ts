import { useEffect } from 'react';

const PENDING_SYNC_KEY = 'gary_pending_sync';

/**
 * Hook pour avertir l'utilisateur avant de quitter si des données non synchronisées
 */
export function useBeforeUnloadWarning(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const pendingSync = localStorage.getItem(PENDING_SYNC_KEY);
      const pendingItems = pendingSync ? JSON.parse(pendingSync) : [];
      
      if (pendingItems.length > 0) {
        e.preventDefault();
        // Chrome requiert returnValue
        e.returnValue = 'Modifications non synchronisées. Quitter quand même ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);
}

/**
 * Vérifier si des données sont en attente de sync
 */
export function hasPendingSync(): boolean {
  const pendingSync = localStorage.getItem(PENDING_SYNC_KEY);
  const pendingItems = pendingSync ? JSON.parse(pendingSync) : [];
  return pendingItems.length > 0;
}

/**
 * Obtenir le nombre d'items en attente
 */
export function getPendingSyncCount(): number {
  const pendingSync = localStorage.getItem(PENDING_SYNC_KEY);
  const pendingItems = pendingSync ? JSON.parse(pendingSync) : [];
  return pendingItems.length;
}
