import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const POLLING_INTERVAL = 60000; // 60 secondes

export function useNewLeadsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const { count: newCount, error } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'nouveau');

        if (error) {
          console.error('Erreur fetch leads count:', error);
          return;
        }

        if (mounted) {
          setCount(newCount || 0);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur useNewLeadsCount:', err);
      }
    };

    // Fetch initial
    fetchCount();

    // Polling toutes les 60s
    const interval = setInterval(fetchCount, POLLING_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { count, loading };
}
