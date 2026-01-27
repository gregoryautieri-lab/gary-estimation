import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths } from 'date-fns';

export interface CommuneHistoryStats {
  derniere_distribution: string | null;
  total_courriers_12_mois: number;
  total_courriers_all_time: number;
  nb_campagnes: number;
}

export interface CommuneHistoryCampagne {
  id: string;
  code: string | null;
  type_message: string | null;
  support_nom: string;
  nb_courriers: number;
  nb_flyers: number;
  date_debut: string | null;
  secteurs: string[] | null;
}

export interface CommuneHistoryData {
  stats: CommuneHistoryStats;
  campagnes: CommuneHistoryCampagne[];
}

interface UseCommuneHistoryReturn {
  data: CommuneHistoryData | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook pour récupérer l'historique des campagnes d'une commune
 * Affiche les stats et les dernières campagnes pour éviter la sur-distribution
 */
export function useCommuneHistory(commune: string | null): UseCommuneHistoryReturn {
  const query = useQuery({
    queryKey: ['commune-history', commune],
    queryFn: async (): Promise<CommuneHistoryData> => {
      if (!commune) {
        return {
          stats: {
            derniere_distribution: null,
            total_courriers_12_mois: 0,
            total_courriers_all_time: 0,
            nb_campagnes: 0,
          },
          campagnes: [],
        };
      }

      // Date il y a 12 mois
      const date12MonthsAgo = subMonths(new Date(), 12).toISOString();

      // Récupérer toutes les campagnes de cette commune (non archivées)
      const { data: campagnesData, error } = await supabase
        .from('campagnes')
        .select(`
          id,
          code,
          type_message,
          nb_courriers,
          nb_flyers,
          date_debut,
          secteurs,
          supports_prospection!inner(nom)
        `)
        .eq('commune', commune)
        .is('archived_at', null)
        .order('date_debut', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const campagnes = campagnesData || [];

      // Calculer les stats
      let total_courriers_all_time = 0;
      let total_courriers_12_mois = 0;
      let derniere_distribution: string | null = null;

      campagnes.forEach((c) => {
        const courriers = c.nb_courriers + c.nb_flyers;
        total_courriers_all_time += courriers;

        // Vérifier si dans les 12 derniers mois
        if (c.date_debut && c.date_debut >= date12MonthsAgo.split('T')[0]) {
          total_courriers_12_mois += courriers;
        }

        // Dernière distribution = première campagne avec une date (liste déjà triée DESC)
        if (!derniere_distribution && c.date_debut) {
          derniere_distribution = c.date_debut;
        }
      });

      // Formater les campagnes pour l'affichage
      const formattedCampagnes: CommuneHistoryCampagne[] = campagnes.slice(0, 5).map((c) => ({
        id: c.id,
        code: c.code,
        type_message: c.type_message,
        support_nom: (c.supports_prospection as any)?.nom || 'Inconnu',
        nb_courriers: c.nb_courriers,
        nb_flyers: c.nb_flyers,
        date_debut: c.date_debut,
        secteurs: c.secteurs,
      }));

      return {
        stats: {
          derniere_distribution,
          total_courriers_12_mois,
          total_courriers_all_time,
          nb_campagnes: campagnes.length,
        },
        campagnes: formattedCampagnes,
      };
    },
    enabled: !!commune,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
