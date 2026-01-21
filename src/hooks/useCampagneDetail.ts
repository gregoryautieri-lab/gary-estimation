import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Campagne, Mission, CampagneStatut, SupportProspection } from '@/types/prospection';

interface MissionEnriched extends Mission {
  etudiant_name?: string | null;
  courtier_name?: string | null;
}

interface CampagneEnriched extends Campagne {
  courtier_name?: string | null;
  courtier_email?: string | null;
}

interface UseCampagneDetailResult {
  campagne: CampagneEnriched | null;
  missions: MissionEnriched[];
  support: SupportProspection | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateStatut: (statut: CampagneStatut) => void;
  isUpdatingStatut: boolean;
}

export function useCampagneDetail(campagneId: string | undefined): UseCampagneDetailResult {
  const queryClient = useQueryClient();

  // Requête principale: Campagne + Missions + Support + Noms
  const query = useQuery({
    queryKey: ['campagne_detail', campagneId],
    queryFn: async () => {
      if (!campagneId) return { campagne: null, missions: [], support: null };

      // 1. Récupérer la campagne
      const { data: campagneData, error: campagneError } = await supabase
        .from('campagnes')
        .select('*')
        .eq('id', campagneId)
        .single();

      if (campagneError) throw campagneError;
      if (!campagneData) return { campagne: null, missions: [], support: null };

      // 2. Récupérer les missions de la campagne
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .eq('campagne_id', campagneId)
        .order('date', { ascending: true });

      if (missionsError) throw missionsError;

      // 3. Récupérer le support
      const { data: supportData } = await supabase
        .from('supports_prospection')
        .select('*')
        .eq('id', campagneData.support_id)
        .single();

      // 4. Récupérer le profil du courtier
      const { data: courtierProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', campagneData.courtier_id)
        .single();

      // 5. Récupérer les noms des étudiants et courtiers des missions
      const etudiantIds = [...new Set((missionsData || []).map(m => m.etudiant_id).filter(Boolean))];
      const missionCourtierIds = [...new Set((missionsData || []).map(m => m.courtier_id).filter(Boolean))];

      let etudiantsMap = new Map<string, string>();
      let courtiersMap = new Map<string, string>();

      if (etudiantIds.length > 0) {
        const { data: etudiantsData } = await supabase
          .from('etudiants')
          .select('id, prenom, nom')
          .in('id', etudiantIds as string[]);

        if (etudiantsData) {
          etudiantsMap = new Map(
            etudiantsData.map(e => [e.id, `${e.prenom}${e.nom ? ' ' + e.nom : ''}`])
          );
        }
      }

      if (missionCourtierIds.length > 0) {
        const { data: courtiersData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', missionCourtierIds as string[]);

        if (courtiersData) {
          courtiersMap = new Map(
            courtiersData.map(c => [c.user_id, c.full_name || ''])
          );
        }
      }

      // Enrichir les missions
      const enrichedMissions: MissionEnriched[] = (missionsData || []).map(m => ({
        ...m,
        etudiant_name: m.etudiant_id ? etudiantsMap.get(m.etudiant_id) || null : null,
        courtier_name: m.courtier_id ? courtiersMap.get(m.courtier_id) || null : null,
      }));

      // Enrichir la campagne
      const enrichedCampagne: CampagneEnriched = {
        ...campagneData,
        courtier_name: courtierProfile?.full_name || null,
        courtier_email: courtierProfile?.email || null,
      };

      return {
        campagne: enrichedCampagne,
        missions: enrichedMissions,
        support: supportData || null,
      };
    },
    enabled: !!campagneId,
  });

  // Mutation pour changer le statut
  const updateStatutMutation = useMutation({
    mutationFn: async (statut: CampagneStatut) => {
      if (!campagneId) throw new Error('ID campagne manquant');
      
      const { data, error } = await supabase
        .from('campagnes')
        .update({ statut })
        .eq('id', campagneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campagne_detail', campagneId] });
      queryClient.invalidateQueries({ queryKey: ['campagnes'] });
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['campagne_detail', campagneId] });
  };

  return {
    campagne: query.data?.campagne || null,
    missions: query.data?.missions || [],
    support: query.data?.support || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch,
    updateStatut: updateStatutMutation.mutate,
    isUpdatingStatut: updateStatutMutation.isPending,
  };
}
