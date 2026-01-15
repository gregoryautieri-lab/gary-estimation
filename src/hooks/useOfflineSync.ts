import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EstimationData } from '@/types/estimation';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

const STORAGE_PREFIX = 'gary_estimation_';
const PENDING_SYNC_KEY = 'gary_pending_sync';

interface StoredEstimation {
  data: Partial<EstimationData>;
  savedAt: string;
  synced: boolean;
}

/**
 * Hook pour gérer le mode offline-first
 * Sauvegarde d'abord en localStorage, puis synchronise avec Supabase
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Mettre à jour le compteur de pending
  const updatePendingCount = useCallback(() => {
    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    setPendingCount(pending.length);
    if (pending.length > 0 && syncStatus === 'synced') {
      setSyncStatus('pending');
    } else if (pending.length === 0 && syncStatus === 'pending') {
      setSyncStatus('synced');
    }
  }, [syncStatus]);

  // Sauvegarder localement (toujours appelé en premier)
  const saveLocal = useCallback((estimationId: string, data: Partial<EstimationData>) => {
    const key = `${STORAGE_PREFIX}${estimationId}`;
    const stored: StoredEstimation = {
      data: { ...data, id: estimationId },
      savedAt: new Date().toISOString(),
      synced: false
    };
    
    localStorage.setItem(key, JSON.stringify(stored));
    
    // Ajouter à la liste des pending si pas déjà présent
    const pending: string[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    if (!pending.includes(estimationId)) {
      pending.push(estimationId);
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    }
    
    updatePendingCount();
    setSyncStatus('pending');
    
    return stored;
  }, [updatePendingCount]);

  // Récupérer depuis le localStorage
  const getLocal = useCallback((estimationId: string): StoredEstimation | null => {
    const key = `${STORAGE_PREFIX}${estimationId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as StoredEstimation;
    } catch {
      return null;
    }
  }, []);

  // Marquer comme synchronisé
  const markAsSynced = useCallback((estimationId: string) => {
    const key = `${STORAGE_PREFIX}${estimationId}`;
    const stored = getLocal(estimationId);
    
    if (stored) {
      stored.synced = true;
      localStorage.setItem(key, JSON.stringify(stored));
    }
    
    // Retirer de pending
    const pending: string[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    const newPending = pending.filter(id => id !== estimationId);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(newPending));
    
    updatePendingCount();
  }, [getLocal, updatePendingCount]);

  // Synchroniser avec Supabase
  const syncToServer = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      setSyncStatus('offline');
      return false;
    }

    const pending: string[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    if (pending.length === 0) {
      setSyncStatus('synced');
      return true;
    }

    setSyncStatus('syncing');
    let allSuccess = true;

    for (const estimationId of pending) {
      const stored = getLocal(estimationId);
      if (!stored?.data) continue;

      try {
        // Convertir pour Supabase
        const updateData: Record<string, unknown> = {};
        const data = stored.data;
        
        if (data.statut !== undefined) updateData.statut = data.statut;
        if (data.typeBien !== undefined) updateData.type_bien = data.typeBien;
        if (data.adresse !== undefined) updateData.adresse = data.adresse;
        if (data.codePostal !== undefined) updateData.code_postal = data.codePostal;
        if (data.localite !== undefined) updateData.localite = data.localite;
        if (data.prixFinal !== undefined) updateData.prix_final = data.prixFinal;
        if (data.prixMin !== undefined) updateData.prix_min = data.prixMin;
        if (data.prixMax !== undefined) updateData.prix_max = data.prixMax;
        if (data.vendeurNom !== undefined) updateData.vendeur_nom = data.vendeurNom;
        if (data.vendeurEmail !== undefined) updateData.vendeur_email = data.vendeurEmail;
        if (data.vendeurTelephone !== undefined) updateData.vendeur_telephone = data.vendeurTelephone;
        if (data.identification !== undefined) updateData.identification = data.identification;
        if (data.caracteristiques !== undefined) updateData.caracteristiques = data.caracteristiques;
        if (data.analyseTerrain !== undefined) updateData.analyse_terrain = data.analyseTerrain;
        if (data.preEstimation !== undefined) updateData.pre_estimation = data.preEstimation;
        if (data.strategiePitch !== undefined) updateData.strategie = data.strategiePitch;
        if (data.photos !== undefined) updateData.photos = data.photos;
        if (data.timeline !== undefined) updateData.timeline = data.timeline;
        if (data.etapesCompletees !== undefined) updateData.etapes_completees = data.etapesCompletees;
        if (data.notesLibres !== undefined) updateData.notes_libres = data.notesLibres;

        const { error } = await supabase
          .from('estimations')
          .update(updateData)
          .eq('id', estimationId);

        if (error) {
          console.error('Sync failed for', estimationId, error);
          allSuccess = false;
        } else {
          markAsSynced(estimationId);
        }
      } catch (error) {
        console.error('Sync error for', estimationId, error);
        allSuccess = false;
      }
    }

    if (allSuccess) {
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('error');
    }

    return allSuccess;
  }, [isOnline, getLocal, markAsSynced]);

  // Forcer une synchronisation manuelle
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      return false;
    }
    return syncToServer();
  }, [isOnline, syncToServer]);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('pending');
      // Auto-sync après 1 seconde de reconnexion
      setTimeout(() => syncToServer(), 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier le pending count au démarrage
    updatePendingCount();

    // Sync automatique toutes les 30 secondes si online et pending
    const syncInterval = setInterval(() => {
      if (navigator.onLine && pendingCount > 0) {
        syncToServer();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [syncToServer, updatePendingCount, pendingCount]);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncTime,
    saveLocal,
    getLocal,
    markAsSynced,
    syncToServer,
    forceSync
  };
}
