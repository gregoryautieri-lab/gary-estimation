import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const POLLING_INTERVAL = 60000; // 60 secondes

export function useNewLeadsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      if (!user?.id) {
        setCount(0);
        setLoading(false);
        return;
      }

      try {
        // Compte les leads "nouveau" assignés à l'utilisateur OU non assignés
        const { count: newCount, error } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'nouveau')
          .or(`assigned_to.eq.${user.id},assigned_to.is.null`);

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
  }, [user?.id]);

  return { count, loading };
}
