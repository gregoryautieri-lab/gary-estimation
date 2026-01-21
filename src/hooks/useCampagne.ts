import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Campagne, Mission } from '@/types/prospection';

interface UseCampagneResult {
  campagne: Campagne | null;
  missions: Mission[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCampagne(campagneId: string | undefined): UseCampagneResult {
  const queryClient = useQueryClient();

  // Requête parallèle 1: Campagne
  const campagneQuery = useQuery({
    queryKey: ['campagne', campagneId],
    queryFn: async (): Promise<Campagne | null> => {
      if (!campagneId) return null;

      const { data, error } = await supabase
        .from('campagnes')
        .select('*')
        .eq('id', campagneId)
        .single();

      if (error) throw error;
      return data as Campagne;
    },
    enabled: !!campagneId,
  });

  // Requête parallèle 2: Missions de la campagne
  const missionsQuery = useQuery({
    queryKey: ['campagne_missions', campagneId],
    queryFn: async (): Promise<Mission[]> => {
      if (!campagneId) return [];

      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('campagne_id', campagneId)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []) as Mission[];
    },
    enabled: !!campagneId,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['campagne', campagneId] });
    queryClient.invalidateQueries({ queryKey: ['campagne_missions', campagneId] });
  };

  return {
    campagne: campagneQuery.data || null,
    missions: missionsQuery.data || [],
    isLoading: campagneQuery.isLoading || missionsQuery.isLoading,
    error: campagneQuery.error || missionsQuery.error,
    refetch,
  };
}
