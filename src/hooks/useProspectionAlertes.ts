import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, isBefore, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export type AlerteType = 'courriers_non_assignes' | 'mission_sans_assigne' | 'a_relancer' | 'campagne_en_retard';
export type AlerteNiveau = 'rouge' | 'orange' | 'jaune';

export interface Alerte {
  id: string;
  type: AlerteType;
  niveau: AlerteNiveau;
  message: string;
  campagneId?: string;
  missionId?: string;
}

export function useProspectionAlertes() {
  return useQuery({
    queryKey: ['prospection-alertes'],
    queryFn: async (): Promise<Alerte[]> => {
      const { data: campagnes, error } = await supabase
        .from('campagnes')
        .select(`
          id, code, commune, nb_courriers, statut, date_fin,
          missions:missions(id, courriers_prevu, statut, date, etudiant_id, courtier_id, etudiant:etudiants(prenom))
        `)
        .in('statut', ['planifiee', 'en_cours']);

      if (error) throw error;

      const alertes: Alerte[] = [];
      const hier = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      campagnes?.forEach((c: any) => {
        const missions = c.missions || [];
        
        // 1. Courriers non assignés (rouge)
        const totalPrevu = missions.reduce((sum: number, m: any) => sum + (m.courriers_prevu || 0), 0);
        const reste = c.nb_courriers - totalPrevu;
        
        if (reste > 0) {
          alertes.push({
            id: `non-assigne-${c.id}`,
            type: 'courriers_non_assignes',
            niveau: 'rouge',
            message: `${reste} courriers non assignés (${c.commune})`,
            campagneId: c.id,
          });
        }

        missions.forEach((m: any) => {
          // 2. Mission sans assigné (jaune)
          if (!m.etudiant_id && !m.courtier_id) {
            alertes.push({
              id: `sans-assigne-${m.id}`,
              type: 'mission_sans_assigne',
              niveau: 'jaune',
              message: `Mission du ${m.date} sans assigné (${c.commune})`,
              missionId: m.id,
              campagneId: c.id,
            });
          }

          // 3. Mission à relancer (orange) - date passée et toujours "prevue"
          if (m.date < hier && m.statut === 'prevue' && (m.etudiant_id || m.courtier_id)) {
            const etudiantData = Array.isArray(m.etudiant) ? m.etudiant[0] : m.etudiant;
            const assigneName = etudiantData?.prenom || 'le courtier';
            alertes.push({
              id: `relancer-${m.id}`,
              type: 'a_relancer',
              niveau: 'orange',
              message: `Relancer ${assigneName} - mission du ${m.date} (${c.commune})`,
              missionId: m.id,
              campagneId: c.id,
          });
          }
        });

        // 4. Campagne en retard (rouge) - date_fin passée et campagne non terminée
        if (c.date_fin) {
          const dateFin = parseISO(c.date_fin);
          const aujourdhui = startOfDay(new Date());
          
          if (isBefore(dateFin, aujourdhui)) {
            alertes.push({
              id: `retard-${c.id}`,
              type: 'campagne_en_retard',
              niveau: 'rouge',
              message: `Campagne ${c.commune} en retard (deadline: ${format(dateFin, 'd MMM', { locale: fr })})`,
              campagneId: c.id,
            });
          }
        }
      });

      // Trier: rouge en premier, puis orange, puis jaune
      const ordre: Record<AlerteNiveau, number> = { rouge: 0, orange: 1, jaune: 2 };
      alertes.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);

      return alertes;
    },
    refetchInterval: 60000,
  });
}
