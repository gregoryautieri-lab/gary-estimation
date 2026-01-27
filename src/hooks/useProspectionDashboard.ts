import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, startOfWeek, endOfWeek, isBefore, parseISO, format, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type CampagneStatut = Database['public']['Enums']['campagne_statut'];
type MissionStatut = Database['public']['Enums']['mission_statut'];
type PaieStatut = Database['public']['Enums']['paie_statut'];

export type DashboardPeriod = 'month' | '3months' | '6months' | 'year';

interface CampagneRow {
  id: string;
  statut: CampagneStatut;
  type_message: string | null;
  support_id: string;
  commune: string;
  nb_courriers: number;
  cout_total: number;
  created_at: string;
  courtier_id: string;
}

interface MissionRow {
  id: string;
  statut: MissionStatut;
  date: string;
  courriers_distribues: number | null;
  strava_validated: boolean;
  campagne_id: string;
}

interface PaieRow {
  id: string;
  statut: PaieStatut;
  montant_total: number;
  date_debut: string;
  date_fin: string;
}

interface SupportRow {
  id: string;
  nom: string;
}

export interface DashboardKpis {
  // Campagnes
  campagnesActives: number;
  campagnesCeMois: number;
  tauxCompletion: number;
  // Missions
  missionsCetteSemaine: number;
  missionsAValider: number;
  missionsEnRetard: number;
  // Volume & Coûts
  courriersDistribuesCeMois: number;
  courriersVsMoisDernier: number; // pourcentage
  coutTotalCeMois: number;
}

export interface VolumeParMois {
  mois: string;
  count: number;
}

export interface RepartitionSupport {
  name: string;
  value: number;
}

export interface RepartitionMessage {
  name: string;
  value: number;
}

export interface PerformanceCommune {
  commune: string;
  count: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  volumeParMois: VolumeParMois[];
  repartitionSupport: RepartitionSupport[];
  repartitionMessage: RepartitionMessage[];
  performanceCommune: PerformanceCommune[];
}

interface UseProspectionDashboardOptions {
  period?: DashboardPeriod;
  courtierId?: string | null;
}

function getPeriodStartDate(period: DashboardPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'month':
      return startOfMonth(now);
    case '3months':
      return startOfMonth(subMonths(now, 2));
    case '6months':
      return startOfMonth(subMonths(now, 5));
    case 'year':
      return startOfYear(now);
    default:
      return startOfMonth(now);
  }
}

export function useProspectionDashboard(options: UseProspectionDashboardOptions = {}) {
  const { period = 'month', courtierId = null } = options;

  const query = useQuery({
    queryKey: ['prospection-dashboard', period, courtierId],
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date();
      const periodStart = getPeriodStartDate(period);
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = startOfMonth(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Fetch all data in parallel
      let campagnesQuery = supabase
        .from('campagnes')
        .select('id, statut, type_message, support_id, commune, nb_courriers, cout_total, created_at, courtier_id')
        .is('archived_at', null);

      let missionsQuery = supabase
        .from('missions')
        .select('id, statut, date, courriers_distribues, strava_validated, campagne_id');

      let paiesQuery = supabase
        .from('paies')
        .select('id, statut, montant_total, date_debut, date_fin');

      const supportsQuery = supabase
        .from('supports_prospection')
        .select('id, nom');

      if (courtierId) {
        campagnesQuery = campagnesQuery.eq('courtier_id', courtierId);
      }

      const [campagnesRes, missionsRes, paiesRes, supportsRes] = await Promise.all([
        campagnesQuery,
        missionsQuery,
        paiesQuery,
        supportsQuery,
      ]);

      if (campagnesRes.error) throw campagnesRes.error;
      if (missionsRes.error) throw missionsRes.error;
      if (paiesRes.error) throw paiesRes.error;
      if (supportsRes.error) throw supportsRes.error;

      const campagnes = (campagnesRes.data || []) as CampagneRow[];
      let missions = (missionsRes.data || []) as MissionRow[];
      const paies = (paiesRes.data || []) as PaieRow[];
      const supports = (supportsRes.data || []) as SupportRow[];

      // Filter missions by courtier's campagnes if needed
      if (courtierId) {
        const courtierCampagneIds = new Set(campagnes.map(c => c.id));
        missions = missions.filter(m => courtierCampagneIds.has(m.campagne_id));
      }

      // Create support lookup
      const supportMap = new Map(supports.map(s => [s.id, s.nom]));

      // ===== KPIs =====

      // Campagnes actives (en_cours)
      const campagnesActives = campagnes.filter(c => c.statut === 'en_cours').length;

      // Campagnes ce mois
      const campagnesCeMois = campagnes.filter(c => 
        new Date(c.created_at) >= thisMonthStart
      ).length;

      // Taux complétion
      const totalCampagnes = campagnes.length;
      const campagnesTerminees = campagnes.filter(c => c.statut === 'terminee').length;
      const tauxCompletion = totalCampagnes > 0 
        ? Math.round((campagnesTerminees / totalCampagnes) * 100)
        : 0;

      // Missions cette semaine
      const missionsCetteSemaine = missions.filter(m => {
        const mDate = parseISO(m.date);
        return mDate >= weekStart && mDate <= weekEnd;
      }).length;

      // Missions à valider (terminées mais pas strava_validated)
      const missionsAValider = missions.filter(m => 
        m.statut === 'terminee' && !m.strava_validated
      ).length;

      // Missions en retard (date passée et statut prevue)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const missionsEnRetard = missions.filter(m => {
        const mDate = parseISO(m.date);
        return m.statut === 'prevue' && isBefore(mDate, today);
      }).length;

      // Courriers distribués ce mois (missions terminées)
      const missionsTermineesCeMois = missions.filter(m => {
        const mDate = parseISO(m.date);
        return m.statut === 'terminee' && mDate >= thisMonthStart;
      });
      const courriersDistribuesCeMois = missionsTermineesCeMois.reduce(
        (sum, m) => sum + (m.courriers_distribues || 0), 0
      );

      // Courriers mois dernier
      const missionsTermineesMoisDernier = missions.filter(m => {
        const mDate = parseISO(m.date);
        return m.statut === 'terminee' && mDate >= lastMonthStart && mDate < lastMonthEnd;
      });
      const courriersMoisDernier = missionsTermineesMoisDernier.reduce(
        (sum, m) => sum + (m.courriers_distribues || 0), 0
      );

      // % variation
      const courriersVsMoisDernier = courriersMoisDernier > 0
        ? Math.round(((courriersDistribuesCeMois - courriersMoisDernier) / courriersMoisDernier) * 100)
        : courriersDistribuesCeMois > 0 ? 100 : 0;

      // Coût total ce mois (campagnes + paies validées)
      const campagnesCoutCeMois = campagnes
        .filter(c => new Date(c.created_at) >= thisMonthStart)
        .reduce((sum, c) => sum + c.cout_total, 0);
      
      const paiesValideesCeMois = paies
        .filter(p => {
          const pEnd = parseISO(p.date_fin);
          return (p.statut === 'validee' || p.statut === 'payee') && pEnd >= thisMonthStart;
        })
        .reduce((sum, p) => sum + p.montant_total, 0);

      const coutTotalCeMois = campagnesCoutCeMois + paiesValideesCeMois;

      // ===== Charts Data =====

      // Filtrer par période pour les graphiques
      const campagnesPeriod = campagnes.filter(c => 
        new Date(c.created_at) >= periodStart
      );
      const missionsPeriod = missions.filter(m => {
        const mDate = parseISO(m.date);
        return mDate >= periodStart && m.statut === 'terminee';
      });

      // Volume par mois (6 derniers mois)
      const volumeMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const key = format(monthDate, 'MMM yy', { locale: fr });
        volumeMap.set(key, 0);
      }

      missions.filter(m => m.statut === 'terminee').forEach(m => {
        const mDate = parseISO(m.date);
        if (mDate >= subMonths(now, 6)) {
          const key = format(mDate, 'MMM yy', { locale: fr });
          if (volumeMap.has(key)) {
            volumeMap.set(key, volumeMap.get(key)! + (m.courriers_distribues || 0));
          }
        }
      });

      const volumeParMois: VolumeParMois[] = Array.from(volumeMap.entries()).map(
        ([mois, count]) => ({ mois, count })
      );

      // Répartition par support
      const supportCount = new Map<string, number>();
      campagnesPeriod.forEach(c => {
        const supportName = supportMap.get(c.support_id) || 'Inconnu';
        supportCount.set(supportName, (supportCount.get(supportName) || 0) + c.nb_courriers);
      });

      const repartitionSupport: RepartitionSupport[] = Array.from(supportCount.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Répartition par type de message
      const messageCount = new Map<string, number>();
      campagnesPeriod.forEach(c => {
        const msgType = c.type_message || 'Non défini';
        messageCount.set(msgType, (messageCount.get(msgType) || 0) + 1);
      });

      const TYPE_MESSAGE_LABELS: Record<string, string> = {
        'nous_avons_vendu': 'Nous avons vendu',
        'sous_offre': 'Sous offre',
        'vendu_en_jours': 'Vendu en X jours',
        'recherche_acheteur': 'Recherche acheteur',
        'recherche_bien': 'Recherche bien',
        'proposition_estimation': 'Proposition estimation',
        'nouveau_courtier': 'Nouveau courtier',
        'evenement': 'Événement',
        'message_saisonnier': 'Message saisonnier',
        'autre': 'Autre',
      };

      const repartitionMessage: RepartitionMessage[] = Array.from(messageCount.entries())
        .map(([key, value]) => ({ 
          name: TYPE_MESSAGE_LABELS[key] || key, 
          value 
        }))
        .sort((a, b) => b.value - a.value);

      // Performance par commune (Top 10)
      const communeCount = new Map<string, number>();
      missionsPeriod.forEach(m => {
        const campagne = campagnes.find(c => c.id === m.campagne_id);
        if (campagne) {
          const commune = campagne.commune;
          communeCount.set(commune, (communeCount.get(commune) || 0) + (m.courriers_distribues || 0));
        }
      });

      const performanceCommune: PerformanceCommune[] = Array.from(communeCount.entries())
        .map(([commune, count]) => ({ commune, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        kpis: {
          campagnesActives,
          campagnesCeMois,
          tauxCompletion,
          missionsCetteSemaine,
          missionsAValider,
          missionsEnRetard,
          courriersDistribuesCeMois,
          courriersVsMoisDernier,
          coutTotalCeMois,
        },
        volumeParMois,
        repartitionSupport,
        repartitionMessage,
        performanceCommune,
      };
    },
    staleTime: 30000, // 30 secondes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
