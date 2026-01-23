import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const QUERY_KEY = ['paies'];

export type PaieStatut = 'brouillon' | 'validee' | 'payee';

export interface Paie {
  id: string;
  etudiant_id: string;
  periode: string;
  date_debut: string;
  date_fin: string;
  total_missions: number;
  total_heures: number;
  salaire_horaire: number;
  montant_total: number;
  statut: PaieStatut;
  missions_ids: string[];
  notes: string | null;
  date_validation: string | null;
  date_paiement: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaieFormData {
  etudiant_id: string;
  periode: string;
  date_debut: string;
  date_fin: string;
  total_missions: number;
  total_heures: number;
  salaire_horaire: number;
  montant_total: number;
  statut?: PaieStatut;
  missions_ids: string[];
  notes?: string;
}

interface UsePaiesOptions {
  periode?: string;
  etudiant_id?: string;
  statut?: PaieStatut;
}

export function usePaies(options: UsePaiesOptions = {}) {
  const queryClient = useQueryClient();

  // Query paies with optional filters
  const {
    data: paies = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...QUERY_KEY, options],
    queryFn: async () => {
      let query = supabase
        .from('paies')
        .select('*')
        .order('periode', { ascending: false });

      if (options.periode) {
        query = query.eq('periode', options.periode);
      }
      if (options.etudiant_id) {
        query = query.eq('etudiant_id', options.etudiant_id);
      }
      if (options.statut) {
        query = query.eq('statut', options.statut);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Paie[];
    }
  });

  // Create paie (figer)
  const createMutation = useMutation({
    mutationFn: async (formData: PaieFormData) => {
      const { data, error } = await supabase
        .from('paies')
        .insert({
          ...formData,
          statut: formData.statut || 'brouillon'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Paie figée');
    },
    onError: (error) => {
      console.error('Error creating paie:', error);
      toast.error('Erreur lors de la création de la paie');
    }
  });

  // Update paie
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: Partial<PaieFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('paies')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      console.error('Error updating paie:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  });

  // Delete paie
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('paies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Paie supprimée');
    },
    onError: (error) => {
      console.error('Error deleting paie:', error);
      toast.error('Erreur lors de la suppression');
    }
  });

  // Valider paie
  const validerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('paies')
        .update({
          statut: 'validee',
          date_validation: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Paie validée');
    },
    onError: (error) => {
      console.error('Error validating paie:', error);
      toast.error('Erreur lors de la validation');
    }
  });

  // Marquer payée
  const marquerPayeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('paies')
        .update({
          statut: 'payee',
          date_paiement: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Paie marquée comme payée');
    },
    onError: (error) => {
      console.error('Error marking paie as paid:', error);
      toast.error('Erreur lors du marquage');
    }
  });

  return {
    paies,
    isLoading,
    error,
    refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    valider: validerMutation.mutateAsync,
    marquerPayee: marquerPayeeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isValidating: validerMutation.isPending,
    isMarkingPaid: marquerPayeeMutation.isPending
  };
}
