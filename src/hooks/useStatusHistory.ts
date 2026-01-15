import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { EstimationStatus, StatusHistoryEntry } from '@/types/estimation';

interface UseStatusHistoryOptions {
  onStatusChange?: (newStatus: EstimationStatus) => void;
}

export function useStatusHistory(
  estimationId: string | undefined,
  options: UseStatusHistoryOptions = {}
) {
  const { user } = useAuth();

  /**
   * Change le statut d'une estimation avec tracking de l'historique
   */
  const changeStatus = useCallback(async (
    newStatus: EstimationStatus,
    currentStatus: EstimationStatus,
    comment?: string
  ): Promise<boolean> => {
    if (!estimationId || !user) {
      toast.error('Impossible de changer le statut');
      return false;
    }

    try {
      // Récupérer la dernière entrée d'historique pour calculer la durée
      const { data: lastHistory } = await supabase
        .from('estimation_status_history')
        .select('timestamp')
        .eq('estimation_id', estimationId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calculer la durée dans le statut précédent
      let durationInPreviousStatus: number | undefined;
      if (lastHistory?.timestamp) {
        const lastChange = new Date(lastHistory.timestamp);
        const now = new Date();
        durationInPreviousStatus = Math.floor(
          (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // Insérer l'entrée d'historique
      const { error: historyError } = await supabase
        .from('estimation_status_history')
        .insert({
          estimation_id: estimationId,
          status: newStatus,
          previous_status: currentStatus,
          user_id: user.id,
          user_name: user.email || 'Inconnu',
          comment: comment || null,
          duration_in_previous_status: durationInPreviousStatus || null
        });

      if (historyError) {
        console.error('❌ [StatusHistory] Erreur ajout historique:', historyError);
      }

      // Mettre à jour le statut de l'estimation
      // Cast nécessaire car les nouveaux enum values ne sont pas encore dans les types générés
      const { error: updateError } = await supabase
        .from('estimations')
        .update({ statut: newStatus as 'brouillon' | 'en_cours' | 'termine' | 'archive' })
        .eq('id', estimationId);

      if (updateError) {
        console.error('❌ [StatusHistory] Erreur update statut:', updateError);
        toast.error('Erreur lors du changement de statut');
        return false;
      }

      console.log(`✅ [StatusHistory] Statut changé: ${currentStatus} → ${newStatus}`);
      toast.success(`Statut changé: ${newStatus}`);
      
      options.onStatusChange?.(newStatus);
      return true;
    } catch (err) {
      console.error('❌ [StatusHistory] Exception:', err);
      toast.error('Erreur lors du changement de statut');
      return false;
    }
  }, [estimationId, user, options]);

  /**
   * Récupère l'historique des statuts d'une estimation
   */
  const fetchStatusHistory = useCallback(async (): Promise<StatusHistoryEntry[]> => {
    if (!estimationId) return [];

    try {
      const { data, error } = await supabase
        .from('estimation_status_history')
        .select('*')
        .eq('estimation_id', estimationId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ [StatusHistory] Erreur fetch:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        status: row.status as EstimationStatus,
        previousStatus: row.previous_status as EstimationStatus | undefined,
        timestamp: row.timestamp,
        userId: row.user_id || '',
        userName: row.user_name || 'Inconnu',
        comment: row.comment || undefined,
        durationInPreviousStatus: row.duration_in_previous_status || undefined
      }));
    } catch (err) {
      console.error('❌ [StatusHistory] Exception fetch:', err);
      return [];
    }
  }, [estimationId]);

  /**
   * Calcule la durée moyenne par statut (en jours)
   */
  const calculateAverageDurations = useCallback(async (): Promise<Record<EstimationStatus, number>> => {
    const history = await fetchStatusHistory();
    
    const durations: Partial<Record<EstimationStatus, number[]>> = {};
    
    history.forEach(entry => {
      if (entry.previousStatus && entry.durationInPreviousStatus !== undefined) {
        if (!durations[entry.previousStatus]) {
          durations[entry.previousStatus] = [];
        }
        durations[entry.previousStatus]!.push(entry.durationInPreviousStatus);
      }
    });

    const averages: Partial<Record<EstimationStatus, number>> = {};
    Object.entries(durations).forEach(([status, days]) => {
      if (days && days.length > 0) {
        averages[status as EstimationStatus] = Math.round(
          days.reduce((a, b) => a + b, 0) / days.length
        );
      }
    });

    return averages as Record<EstimationStatus, number>;
  }, [fetchStatusHistory]);

  return {
    changeStatus,
    fetchStatusHistory,
    calculateAverageDurations
  };
}
