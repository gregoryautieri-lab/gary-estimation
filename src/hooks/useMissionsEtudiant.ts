import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Mission, MissionStatut, StravaData } from '@/types/prospection';
import { useMemo } from 'react';

const QUERY_KEY = ['missions_etudiant'];

interface UseMissionsEtudiantOptions {
  etudiant_id: string;
  statut?: MissionStatut | MissionStatut[];
}

export function useMissionsEtudiant(options: UseMissionsEtudiantOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEY, options.etudiant_id, options.statut],
    queryFn: async (): Promise<Mission[]> => {
      if (!options.etudiant_id) return [];

      let queryBuilder = supabase
        .from('missions')
        .select('*')
        .eq('etudiant_id', options.etudiant_id);

      if (options.statut) {
        if (Array.isArray(options.statut)) {
          queryBuilder = queryBuilder.in('statut', options.statut);
        } else {
          queryBuilder = queryBuilder.eq('statut', options.statut);
        }
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return (data || []) as Mission[];
    },
    enabled: !!options.etudiant_id,
  });

  // Tri côté client : missions à venir d'abord (date croissante), puis passées (date décroissante)
  const sortedMissions = useMemo(() => {
    if (!query.data) return [];

    const today = new Date().toISOString().split('T')[0];
    
    const upcoming = query.data
      .filter(m => m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const past = query.data
      .filter(m => m.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));

    return [...upcoming, ...past];
  }, [query.data]);

  // Statistiques de l'étudiant
  const stats = useMemo(() => {
    if (!query.data) return { total: 0, terminees: 0, enCours: 0, prevues: 0, totalCourriers: 0 };

    return {
      total: query.data.length,
      terminees: query.data.filter(m => m.statut === 'terminee').length,
      enCours: query.data.filter(m => m.statut === 'en_cours').length,
      prevues: query.data.filter(m => m.statut === 'prevue').length,
      totalCourriers: query.data.reduce((sum, m) => sum + (m.courriers_distribues || 0), 0),
    };
  }, [query.data]);

  // Mutation pour soumettre les données Strava
  const submitStrava = useMutation({
    mutationFn: async ({ 
      mission_id, 
      strava_data,
      screenshot_url 
    }: { 
      mission_id: string; 
      strava_data: StravaData;
      screenshot_url?: string;
    }) => {
      const updateData: Partial<Mission> = {
        strava_temps: strava_data.temps,
        strava_distance_km: strava_data.distance_km,
        strava_vitesse_moy: strava_data.vitesse_moy ?? strava_data.vitesse_moy_kmh,
        strava_screenshot_url: screenshot_url,
        statut: 'terminee' as MissionStatut,
      };

      const { data, error } = await supabase
        .from('missions')
        .update(updateData)
        .eq('id', mission_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Données Strava enregistrées');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour mettre à jour le nombre de courriers distribués
  const updateCourriersDistribues = useMutation({
    mutationFn: async ({ mission_id, courriers_distribues }: { mission_id: string; courriers_distribues: number }) => {
      const { data, error } = await supabase
        .from('missions')
        .update({ courriers_distribues })
        .eq('id', mission_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Courriers mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    missions: sortedMissions,
    allMissions: query.data || [],
    stats,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    submitStrava: submitStrava.mutateAsync,
    updateCourriersDistribues: updateCourriersDistribues.mutate,
    isSubmittingStrava: submitStrava.isPending,
  };
}
