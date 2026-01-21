import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Etudiant {
  id: string;
  user_id: string | null;
  prenom: string;
  nom: string | null;
  email: string | null;
  tel: string | null;
  salaire_horaire: number;
  actif: boolean;
}

export function useCurrentEtudiant() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current_etudiant', user?.id],
    queryFn: async (): Promise<Etudiant | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('etudiants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as Etudiant;
    },
    enabled: !!user?.id,
  });
}
