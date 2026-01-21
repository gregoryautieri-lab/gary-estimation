import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Mission, MissionFormData, MissionStatut } from '@/types/prospection';

const QUERY_KEY = ['missions'];

interface UseMissionsOptions {
  campagne_id?: string;
  etudiant_id?: string;
  statut?: MissionStatut | MissionStatut[];
  date_from?: string;
  date_to?: string;
}

export function useMissions(options: UseMissionsOptions = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEY, options],
    queryFn: async (): Promise<Mission[]> => {
      let queryBuilder = supabase
        .from('missions')
        .select('*')
        .order('date', { ascending: false });

      if (options.campagne_id) {
        queryBuilder = queryBuilder.eq('campagne_id', options.campagne_id);
      }

      if (options.etudiant_id) {
        queryBuilder = queryBuilder.eq('etudiant_id', options.etudiant_id);
      }

      if (options.statut) {
        if (Array.isArray(options.statut)) {
          queryBuilder = queryBuilder.in('statut', options.statut);
        } else {
          queryBuilder = queryBuilder.eq('statut', options.statut);
        }
      }

      if (options.date_from) {
        queryBuilder = queryBuilder.gte('date', options.date_from);
      }

      if (options.date_to) {
        queryBuilder = queryBuilder.lte('date', options.date_to);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return (data || []) as Mission[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: MissionFormData) => {
      const { data, error } = await supabase
        .from('missions')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Mission créée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: Partial<MissionFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('missions')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Mission mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Mission supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: MissionStatut }) => {
      const { data, error } = await supabase
        .from('missions')
        .update({ statut })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const validateStrava = useMutation({
    mutationFn: async ({ id, strava_validated }: { id: string; strava_validated: boolean }) => {
      const { data, error } = await supabase
        .from('missions')
        .update({ strava_validated })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(variables.strava_validated ? 'Strava validé' : 'Validation retirée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    missions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    updateStatut: updateStatut.mutate,
    validateStrava: validateStrava.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
