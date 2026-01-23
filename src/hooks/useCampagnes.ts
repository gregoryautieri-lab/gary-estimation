import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { Campagne, CampagneFormData, CampagneStatut } from '@/types/prospection';

const QUERY_KEY = ['campagnes'];

interface UseCampagnesOptions {
  courtier_id?: string;
  statut?: CampagneStatut | CampagneStatut[];
  commune?: string;
  includeArchived?: boolean; // Nouveau: inclure les campagnes archivées
}

export function useCampagnes(options: UseCampagnesOptions = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [...QUERY_KEY, options],
    queryFn: async (): Promise<Campagne[]> => {
      // Requête campagnes
      let queryBuilder = supabase
        .from('campagnes')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtre archivées par défaut (sauf si explicitement demandé)
      if (!options.includeArchived) {
        queryBuilder = queryBuilder.is('archived_at', null);
      }

      if (options.courtier_id) {
        queryBuilder = queryBuilder.eq('courtier_id', options.courtier_id);
      }

      if (options.statut) {
        if (Array.isArray(options.statut)) {
          queryBuilder = queryBuilder.in('statut', options.statut);
        } else {
          queryBuilder = queryBuilder.eq('statut', options.statut);
        }
      }

      if (options.commune) {
        queryBuilder = queryBuilder.eq('commune', options.commune);
      }

      const { data: campagnesData, error: campagnesError } = await queryBuilder;

      if (campagnesError) throw campagnesError;
      if (!campagnesData || campagnesData.length === 0) return [];

      // Récupérer les IDs uniques des courtiers
      const courtierIds = [...new Set(campagnesData.map(c => c.courtier_id))];

      // Requête profiles pour récupérer les noms
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', courtierIds);

      if (profilesError) throw profilesError;

      // Créer un map pour lookup rapide
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      // Fusionner les données
      return campagnesData.map((campagne) => ({
        ...campagne,
        courtier_name: profilesMap.get(campagne.courtier_id)?.full_name || null,
        courtier_email: profilesMap.get(campagne.courtier_id)?.email || null,
      })) as Campagne[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: CampagneFormData) => {
      const { data, error } = await supabase
        .from('campagnes')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Campagne créée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: Partial<CampagneFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('campagnes')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Campagne mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  // Archive mutation (soft delete)
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campagnes')
        .update({ 
          archived_at: new Date().toISOString(),
          archived_by: user?.id || null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Campagne archivée');
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'archivage: ${error.message}`);
    },
  });

  // Restore mutation (unarchive)
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campagnes')
        .update({ 
          archived_at: null,
          archived_by: null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Campagne restaurée');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la restauration: ${error.message}`);
    },
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: CampagneStatut }) => {
      const { data, error } = await supabase
        .from('campagnes')
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

  return {
    campagnes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutate,
    archive: archiveMutation.mutate,
    restore: restoreMutation.mutate,
    updateStatut: updateStatut.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}
