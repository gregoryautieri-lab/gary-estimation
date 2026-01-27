import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface CampagneCosts {
  coutSupports: number;
  coutSalaires: number;
  coutTotal: number;
  coutUnitaire: number | null;
  courriersDistribues: number;
  totalHeures: number;
  missionsValidees: number;
}

/**
 * Convertit un temps strava (format "HH:MM:SS" ou "H:MM:SS") en heures décimales
 */
const convertTempsToHours = (temps: string | null): number => {
  if (!temps) return 0;
  const parts = temps.split(':').map(Number);
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts;
  if (isNaN(h) || isNaN(m) || isNaN(s)) return 0;
  return h + (m / 60) + (s / 3600);
};

interface MissionWithEtudiant {
  id: string;
  strava_temps: string | null;
  strava_validated: boolean;
  statut: string;
  courriers_distribues: number | null;
  etudiant_id: string | null;
}

interface Etudiant {
  id: string;
  salaire_horaire: number;
}

export function useCampagneCosts(campagneId: string | undefined) {
  // Fetch missions terminées et validées de la campagne
  const missionsQuery = useQuery({
    queryKey: ['campagne-missions-costs', campagneId],
    queryFn: async () => {
      if (!campagneId) return [];
      
      const { data, error } = await supabase
        .from('missions')
        .select('id, strava_temps, strava_validated, statut, courriers_distribues, etudiant_id')
        .eq('campagne_id', campagneId)
        .eq('statut', 'terminee')
        .eq('strava_validated', true);

      if (error) throw error;
      return (data || []) as MissionWithEtudiant[];
    },
    enabled: !!campagneId,
  });

  // Fetch les étudiants pour leurs taux horaires
  const etudiantIds = useMemo(() => {
    const ids = new Set<string>();
    (missionsQuery.data || []).forEach(m => {
      if (m.etudiant_id) ids.add(m.etudiant_id);
    });
    return Array.from(ids);
  }, [missionsQuery.data]);

  const etudiantsQuery = useQuery({
    queryKey: ['etudiants-salaires', etudiantIds],
    queryFn: async () => {
      if (etudiantIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('etudiants')
        .select('id, salaire_horaire')
        .in('id', etudiantIds);

      if (error) throw error;
      return (data || []) as Etudiant[];
    },
    enabled: etudiantIds.length > 0,
  });

  // Calculer les coûts
  const costs = useMemo((): CampagneCosts => {
    const missions = missionsQuery.data || [];
    const etudiants = etudiantsQuery.data || [];
    
    // Map etudiant_id -> salaire_horaire
    const etudiantSalaires = new Map<string, number>();
    etudiants.forEach(e => {
      etudiantSalaires.set(e.id, e.salaire_horaire);
    });

    // Calculer les coûts salaires
    let coutSalaires = 0;
    let totalHeures = 0;
    
    missions.forEach(mission => {
      if (mission.etudiant_id && mission.strava_temps) {
        const heures = convertTempsToHours(mission.strava_temps);
        const tauxHoraire = etudiantSalaires.get(mission.etudiant_id) || 18; // Défaut 18 CHF
        coutSalaires += heures * tauxHoraire;
        totalHeures += heures;
      }
    });

    // Courriers distribués
    const courriersDistribues = missions.reduce(
      (sum, m) => sum + (m.courriers_distribues || 0),
      0
    );

    // Note: Le coût des supports vient de campagne.cout_total (déjà calculé par trigger DB)
    // On le passera en prop depuis le parent

    return {
      coutSupports: 0, // Sera remplacé par la valeur réelle dans le composant
      coutSalaires: Math.round(coutSalaires * 100) / 100,
      coutTotal: 0, // Calculé avec coutSupports
      coutUnitaire: null,
      courriersDistribues,
      totalHeures: Math.round(totalHeures * 100) / 100,
      missionsValidees: missions.length,
    };
  }, [missionsQuery.data, etudiantsQuery.data]);

  return {
    ...costs,
    isLoading: missionsQuery.isLoading || etudiantsQuery.isLoading,
    error: missionsQuery.error || etudiantsQuery.error,
  };
}
