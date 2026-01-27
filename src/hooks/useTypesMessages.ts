import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TypeMessage {
  id: string;
  groupe: string;
  valeur: string;
  label: string;
  ordre: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypeMessageInput {
  groupe: string;
  valeur: string;
  label: string;
  ordre?: number;
  actif?: boolean;
}

export function useTypesMessages() {
  const queryClient = useQueryClient();

  // Fetch all types
  const { data: typesMessages = [], isLoading } = useQuery({
    queryKey: ['types-messages-prospection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('types_messages_prospection')
        .select('*')
        .order('ordre', { ascending: true });

      if (error) throw error;
      return data as TypeMessage[];
    },
  });

  // Create
  const createMutation = useMutation({
    mutationFn: async (input: TypeMessageInput) => {
      // Get max ordre for the groupe
      const maxOrdre = typesMessages
        .filter(t => t.groupe === input.groupe)
        .reduce((max, t) => Math.max(max, t.ordre), 0);

      const { data, error } = await supabase
        .from('types_messages_prospection')
        .insert({
          ...input,
          ordre: input.ordre ?? maxOrdre + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-messages-prospection'] });
      toast({ title: 'Type de message ajouté' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<TypeMessage> & { id: string }) => {
      const { data, error } = await supabase
        .from('types_messages_prospection')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-messages-prospection'] });
      toast({ title: 'Type de message modifié' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('types_messages_prospection')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-messages-prospection'] });
      toast({ title: 'Type de message supprimé' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle actif
  const toggleActif = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase
        .from('types_messages_prospection')
        .update({ actif })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-messages-prospection'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Group by groupe for display
  const groupedTypes = typesMessages.reduce((acc, type) => {
    if (!acc[type.groupe]) {
      acc[type.groupe] = [];
    }
    acc[type.groupe].push(type);
    return acc;
  }, {} as Record<string, TypeMessage[]>);

  return {
    typesMessages,
    groupedTypes,
    isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    toggleActif: toggleActif.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Helper pour obtenir le label d'une valeur (utilise les données dynamiques)
export function getTypeMessageLabelFromList(
  typesMessages: TypeMessage[],
  value: string | null | undefined
): string {
  if (!value) return '—';
  const type = typesMessages.find(t => t.valeur === value);
  return type?.label || value;
}
