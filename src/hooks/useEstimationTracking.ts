import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { ModificationEntry, EstimationVersion, EstimationData } from '@/types/estimation';
import type { Json } from '@/integrations/supabase/types';

interface UseEstimationTrackingOptions {
  debounceMs?: number;
  silentMode?: boolean;
}

export function useEstimationTracking(
  estimationId: string | undefined,
  options: UseEstimationTrackingOptions = {}
) {
  const { debounceMs = 1000, silentMode = true } = options;
  const { user } = useAuth();
  const pendingChanges = useRef<Map<string, { oldValue: unknown; newValue: unknown; module: string }>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Flush les changements en attente vers la DB
  const flushChanges = useCallback(async () => {
    if (!estimationId || !user || pendingChanges.current.size === 0) return;

    const changes = Array.from(pendingChanges.current.entries());
    pendingChanges.current.clear();

    try {
      const entries = changes.map(([key, change]) => {
        const [module, field] = key.split('.');
        return {
          estimation_id: estimationId,
          user_id: user.id,
          user_name: user.email || 'Inconnu',
          module: module || change.module,
          field: field || key,
          old_value: change.oldValue as Json,
          new_value: change.newValue as Json,
          action: 'update'
        };
      });

      const { error } = await supabase
        .from('estimation_modifications')
        .insert(entries);

      if (error) {
        console.error('❌ [Tracking] Erreur sauvegarde modifications:', error);
      } else {
        console.log(`📝 [Tracking] ${entries.length} modification(s) enregistrée(s)`);
      }
    } catch (err) {
      console.error('❌ [Tracking] Exception:', err);
    }
  }, [estimationId, user]);

  // Track une modification individuelle
  const trackChange = useCallback((
    module: string,
    field: string,
    oldValue: unknown,
    newValue: unknown
  ) => {
    if (!estimationId || !user) return;

    // Ignorer si pas de changement réel
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

    const key = `${module}.${field}`;
    
    // Si déjà une modif pour ce champ, conserver l'ancienne valeur originale
    const existing = pendingChanges.current.get(key);
    pendingChanges.current.set(key, {
      module,
      oldValue: existing?.oldValue ?? oldValue,
      newValue
    });

    // Debounce le flush
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(flushChanges, debounceMs);
  }, [estimationId, user, debounceMs, flushChanges]);

  // Créer une version/snapshot
  const createVersion = useCallback(async (
    snapshot: Partial<EstimationData>,
    label?: string
  ): Promise<number | null> => {
    if (!estimationId || !user) {
      toast.error('Impossible de créer une version');
      return null;
    }

    try {
      // Récupérer le dernier numéro de version
      const { data: lastVersion } = await supabase
        .from('estimation_versions')
        .select('version_number')
        .eq('estimation_id', estimationId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newVersionNumber = (lastVersion?.version_number || 0) + 1;

      const { error } = await supabase
        .from('estimation_versions')
        .insert([{
          estimation_id: estimationId,
          version_number: newVersionNumber,
          created_by: user.email || 'Inconnu',
          created_by_id: user.id,
          label: label || `Version ${newVersionNumber}`,
          snapshot: snapshot as unknown as Json
        }]);

      if (error) {
        console.error('❌ [Tracking] Erreur création version:', error);
        toast.error('Erreur lors de la création de version');
        return null;
      }

      if (!silentMode) {
        toast.success(`📸 Version ${newVersionNumber} créée`);
      }
      console.log(`📸 [Tracking] Version ${newVersionNumber} créée: "${label}"`);
      return newVersionNumber;
    } catch (err) {
      console.error('❌ [Tracking] Exception création version:', err);
      toast.error('Erreur lors de la création de version');
      return null;
    }
  }, [estimationId, user, silentMode]);

  // Récupérer l'historique des modifications
  const fetchModifications = useCallback(async (
    options?: { module?: string; limit?: number }
  ): Promise<ModificationEntry[]> => {
    if (!estimationId) return [];

    try {
      let query = supabase
        .from('estimation_modifications')
        .select('*')
        .eq('estimation_id', estimationId)
        .order('timestamp', { ascending: false });

      if (options?.module) {
        query = query.eq('module', options.module);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [Tracking] Erreur fetch modifications:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        userId: row.user_id,
        userName: row.user_name,
        module: row.module,
        field: row.field,
        oldValue: row.old_value,
        newValue: row.new_value,
        action: row.action as 'create' | 'update' | 'delete'
      }));
    } catch (err) {
      console.error('❌ [Tracking] Exception fetch modifications:', err);
      return [];
    }
  }, [estimationId]);

  // Récupérer les versions
  const fetchVersions = useCallback(async (): Promise<EstimationVersion[]> => {
    if (!estimationId) return [];

    try {
      const { data, error } = await supabase
        .from('estimation_versions')
        .select('*')
        .eq('estimation_id', estimationId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('❌ [Tracking] Erreur fetch versions:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        estimationId: row.estimation_id,
        versionNumber: row.version_number,
        createdAt: row.created_at,
        createdBy: row.created_by,
        createdById: row.created_by_id,
        label: row.label,
        snapshot: row.snapshot as Partial<EstimationData>
      }));
    } catch (err) {
      console.error('❌ [Tracking] Exception fetch versions:', err);
      return [];
    }
  }, [estimationId]);

  // Récupérer une version spécifique
  const fetchVersion = useCallback(async (
    versionNumber: number
  ): Promise<EstimationVersion | null> => {
    if (!estimationId) return null;

    try {
      const { data, error } = await supabase
        .from('estimation_versions')
        .select('*')
        .eq('estimation_id', estimationId)
        .eq('version_number', versionNumber)
        .maybeSingle();

      if (error || !data) {
        console.error('❌ [Tracking] Version non trouvée:', error);
        return null;
      }

      return {
        id: data.id,
        estimationId: data.estimation_id,
        versionNumber: data.version_number,
        createdAt: data.created_at,
        createdBy: data.created_by,
        createdById: data.created_by_id,
        label: data.label,
        snapshot: data.snapshot as Partial<EstimationData>
      };
    } catch (err) {
      console.error('❌ [Tracking] Exception fetch version:', err);
      return null;
    }
  }, [estimationId]);

  return {
    trackChange,
    createVersion,
    fetchModifications,
    fetchVersions,
    fetchVersion,
    flushChanges
  };
}
