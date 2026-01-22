import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MissionStatut } from '@/types/prospection';

export interface PlanningMission {
  id: string;
  date: string;
  statut: MissionStatut;
  courriers_prevu: number;
  courriers_distribues: number | null;
  secteur_nom: string | null;
  etudiant_id: string | null;
  courtier_id: string | null;
  etudiant: {
    id: string;
    prenom: string;
    nom: string | null;
  } | null;
  campagne: {
    id: string;
    code: string;
    commune: string;
  } | null;
}

interface UsePlanningMissionsOptions {
  weekStart: Date;
}

export function usePlanningMissions({ weekStart }: UsePlanningMissionsOptions) {
  const debutSemaine = format(startOfWeek(weekStart, { locale: fr, weekStartsOn: 1 }), 'yyyy-MM-dd');
  const finSemaine = format(endOfWeek(weekStart, { locale: fr, weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['planning-missions', debutSemaine, finSemaine],
    queryFn: async (): Promise<PlanningMission[]> => {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          id, date, statut, courriers_prevu, courriers_distribues,
          secteur_nom, etudiant_id, courtier_id,
          etudiant:etudiants(id, prenom, nom),
          campagne:campagnes(id, code, commune)
        `)
        .gte('date', debutSemaine)
        .lte('date', finSemaine)
        .order('date');

      if (error) throw error;
      
      // Transform the data to match our interface (handle array returns from joins)
      return (data || []).map((mission: any) => ({
        ...mission,
        etudiant: Array.isArray(mission.etudiant) ? mission.etudiant[0] || null : mission.etudiant,
        campagne: Array.isArray(mission.campagne) ? mission.campagne[0] || null : mission.campagne,
      }));
    },
  });
}
