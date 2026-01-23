import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number; // ms
  onSave: () => Promise<void>;
  enabled?: boolean;
}

/**
 * Hook d'autosave avec debounce pour éviter les conflits DB
 * lors de frappes rapides.
 * 
 * FIX: Utilise un ref pour onSave afin d'exécuter toujours la dernière
 * version de la fonction (évite les sauvegardes avec état "stale").
 */
export function useAutoSave({ delay = 2000, onSave, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // FIX: Toujours utiliser la dernière version de onSave
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const scheduleSave = useCallback(() => {
    if (!enabled || isSavingRef.current) return;

    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Planifier la sauvegarde avec la dernière version de onSave
    timeoutRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        await onSaveRef.current(); // Utilise le ref, pas la closure
      } catch (error) {
        console.error('[AutoSave] Erreur:', error);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }, delay);
  }, [delay, enabled]);

  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const forceSave = useCallback(async () => {
    cancelSave();
    if (!enabled || isSavingRef.current) return;
    
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await onSaveRef.current(); // Utilise le ref
    } catch (error) {
      console.error('[AutoSave] Erreur sauvegarde forcée:', error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [enabled, cancelSave]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { scheduleSave, cancelSave, forceSave, isSaving };
}
