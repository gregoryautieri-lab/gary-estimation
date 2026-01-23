import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, formatBytes } from '@/utils/imageCompression';
import { useNetworkStatus } from './useNetworkStatus';

interface QueuedPhoto {
  id: string;
  file: File;
  estimationId: string;
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  localPreview: string;
  originalSize: number;
  compressedSize?: number;
  addedAt: Date;
}

interface PhotoQueueState {
  queue: QueuedPhoto[];
  isProcessing: boolean;
  totalPending: number;
  totalSize: number;
}

/**
 * Hook pour gérer une queue d'upload de photos en background
 * Compression automatique + retry si erreur
 */
export function usePhotoQueue(estimationId: string) {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [state, setState] = useState<PhotoQueueState>({
    queue: [],
    isProcessing: false,
    totalPending: 0,
    totalSize: 0
  });
  
  const processingRef = useRef(false);
  const queueRef = useRef<QueuedPhoto[]>([]);

  // Mettre à jour la ref quand le state change
  useEffect(() => {
    queueRef.current = state.queue;
  }, [state.queue]);

  // Ajouter des photos à la queue
  const addToQueue = useCallback(async (files: File[]): Promise<QueuedPhoto[]> => {
    const newItems: QueuedPhoto[] = [];

    for (const file of files) {
      // Créer preview locale immédiate
      const localPreview = URL.createObjectURL(file);
      
      const item: QueuedPhoto = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        file,
        estimationId,
        status: 'pending',
        progress: 0,
        localPreview,
        originalSize: file.size,
        addedAt: new Date()
      };
      
      newItems.push(item);
    }

    setState(prev => {
      const updatedQueue = [...prev.queue, ...newItems];
      return {
        ...prev,
        queue: updatedQueue,
        totalPending: updatedQueue.filter(q => q.status === 'pending' || q.status === 'compressing' || q.status === 'uploading').length,
        totalSize: updatedQueue.reduce((acc, q) => acc + (q.compressedSize || q.originalSize), 0)
      };
    });

    // Déclencher le processing si pas déjà en cours
    if (!processingRef.current && isOnline) {
      processQueue();
    }

    return newItems;
  }, [estimationId, isOnline]);

  // Mettre à jour un item dans la queue
  const updateQueueItem = useCallback((id: string, updates: Partial<QueuedPhoto>) => {
    setState(prev => {
      const updatedQueue = prev.queue.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      return {
        ...prev,
        queue: updatedQueue,
        totalPending: updatedQueue.filter(q => q.status === 'pending' || q.status === 'compressing' || q.status === 'uploading').length
      };
    });
  }, []);

  // Supprimer un item de la queue
  const removeFromQueue = useCallback((id: string) => {
    setState(prev => {
      const item = prev.queue.find(q => q.id === id);
      if (item?.localPreview) {
        URL.revokeObjectURL(item.localPreview);
      }
      const updatedQueue = prev.queue.filter(q => q.id !== id);
      return {
        ...prev,
        queue: updatedQueue,
        totalPending: updatedQueue.filter(q => q.status === 'pending' || q.status === 'compressing' || q.status === 'uploading').length
      };
    });
  }, []);

  // Traiter la queue
  const processQueue = useCallback(async () => {
    if (processingRef.current || !isOnline) return;
    
    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true }));

    while (true) {
      const pendingItem = queueRef.current.find(item => item.status === 'pending');
      if (!pendingItem) break;

      // 1. Compression
      updateQueueItem(pendingItem.id, { status: 'compressing', progress: 10 });
      
      try {
        const compressedFile = await compressImage(pendingItem.file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85
        });

        updateQueueItem(pendingItem.id, { 
          status: 'uploading', 
          progress: 30,
          compressedSize: compressedFile.size
        });

        // 2. Upload vers Supabase Storage
        const fileName = `${estimationId}/${Date.now()}-${pendingItem.id}.jpg`;
        
        const { error } = await supabase.storage
          .from('estimation-photos')
          .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('estimation-photos')
          .getPublicUrl(fileName);

        updateQueueItem(pendingItem.id, { 
          status: 'done', 
          progress: 100 
        });

      } catch (error: any) {
        console.error('[PhotoQueue] Erreur upload:', error);
        updateQueueItem(pendingItem.id, { 
          status: 'error', 
          progress: 0,
          error: error.message || 'Erreur inconnue'
        });
      }
    }

    processingRef.current = false;
    setState(prev => ({ ...prev, isProcessing: false }));
  }, [isOnline, estimationId, updateQueueItem]);

  // Reprendre le traitement quand on revient en ligne
  useEffect(() => {
    if (isOnline && !processingRef.current) {
      const hasPending = queueRef.current.some(item => item.status === 'pending');
      if (hasPending) {
        processQueue();
      }
    }
  }, [isOnline, processQueue]);

  // Retry les erreurs
  const retryErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.map(item => 
        item.status === 'error' ? { ...item, status: 'pending' as const, error: undefined } : item
      )
    }));
    
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Nettoyer les previews au démontage
  useEffect(() => {
    return () => {
      queueRef.current.forEach(item => {
        if (item.localPreview) {
          URL.revokeObjectURL(item.localPreview);
        }
      });
    };
  }, []);

  return {
    ...state,
    addToQueue,
    removeFromQueue,
    retryErrors,
    isOnline,
    isSlowConnection
  };
}
