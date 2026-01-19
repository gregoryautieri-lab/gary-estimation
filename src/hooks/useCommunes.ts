import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCommunesReturn {
  communes: string[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook partagé pour récupérer les communes depuis les estimations
 * Utilisé par ProjectForm.tsx et ImportFilters.tsx
 */
export function useCommunes(): UseCommunesReturn {
  const [communes, setCommunes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCommunes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('estimations')
        .select('localite')
        .not('localite', 'is', null);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const uniqueCommunes = [...new Set(
        (data || [])
          .map(e => e.localite)
          .filter(Boolean)
      )].sort() as string[];
      
      setCommunes(uniqueCommunes);
    } catch (err) {
      console.error('Error fetching communes:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunes();
  }, []);

  return {
    communes,
    loading,
    error,
    refetch: fetchCommunes,
  };
}
