import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMonths } from 'date-fns';

export interface ZoneData {
  id: string;
  zone_geojson: any;
  date: string;
  courriers_distribues: number | null;
  courriers_prevu: number;
  secteur_nom: string | null;
  campagne_id: string;
  campagne_code: string | null;
  campagne_commune: string;
  support_nom: string | null;
  etudiant_prenom: string | null;
  courtier_name: string | null;
  age_months: number;
  color: string;
}

export type AgeCategory = 'recent' | 'medium' | 'old' | 'very_old';

export interface ZoneFilters {
  commune: string | null;
  period: '3months' | '6months' | '1year' | 'all';
  campagne_id: string | null;
  support_id: string | null;
}

// Couleurs par ancienneté
const AGE_COLORS: Record<AgeCategory, string> = {
  recent: '#ef4444',   // Rouge - < 1 mois
  medium: '#f97316',   // Orange - 1-3 mois
  old: '#eab308',      // Jaune - 3-6 mois
  very_old: '#22c55e', // Vert - > 6 mois
};

function getAgeCategory(ageMonths: number): AgeCategory {
  if (ageMonths < 1) return 'recent';
  if (ageMonths < 3) return 'medium';
  if (ageMonths < 6) return 'old';
  return 'very_old';
}

function getColorByAge(ageMonths: number): string {
  return AGE_COLORS[getAgeCategory(ageMonths)];
}

function getPeriodMonths(period: ZoneFilters['period']): number {
  switch (period) {
    case '3months': return 3;
    case '6months': return 6;
    case '1year': return 12;
    default: return 999; // All
  }
}

export function useProspectionZones(filters: ZoneFilters) {
  return useQuery({
    queryKey: ['prospection-zones', filters],
    queryFn: async (): Promise<ZoneData[]> => {
      // Construire la requête de base
      let query = supabase
        .from('missions')
        .select(`
          id,
          zone_geojson,
          date,
          courriers_distribues,
          courriers_prevu,
          secteur_nom,
          campagne_id,
          etudiant_id,
          courtier_id,
          campagnes!fk_missions_campagne (
            code,
            commune,
            support_id,
            courtier_id,
            supports_prospection (
              nom
            )
          ),
          etudiants (
            prenom
          )
        `)
        .eq('statut', 'terminee')
        .not('zone_geojson', 'is', null)
        .order('date', { ascending: false })
        .limit(500);

      const { data: missionsData, error: missionsError } = await query;
      
      if (missionsError) throw missionsError;
      if (!missionsData || missionsData.length === 0) return [];

      // Récupérer les noms des courtiers
      const courtierIds = [
        ...new Set(
          missionsData
            .map((m: any) => m.campagnes?.courtier_id || m.courtier_id)
            .filter(Boolean)
        )
      ];

      let profilesMap = new Map<string, string>();
      if (courtierIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', courtierIds);
        
        if (profiles) {
          profiles.forEach((p) => {
            profilesMap.set(p.user_id, p.full_name || 'Inconnu');
          });
        }
      }

      const now = new Date();
      const periodMonths = getPeriodMonths(filters.period);

      // Transformer et filtrer les données
      const zones: ZoneData[] = missionsData
        .map((m: any) => {
          const campagne = m.campagnes;
          if (!campagne) return null;
          
          const missionDate = new Date(m.date);
          const ageMonths = differenceInMonths(now, missionDate);
          
          // Filtrage par période
          if (ageMonths > periodMonths) return null;
          
          // Filtrage par commune
          if (filters.commune && campagne.commune !== filters.commune) return null;
          
          // Filtrage par campagne
          if (filters.campagne_id && m.campagne_id !== filters.campagne_id) return null;
          
          // Filtrage par support
          if (filters.support_id && campagne.support_id !== filters.support_id) return null;

          const courtierId = campagne.courtier_id || m.courtier_id;

          return {
            id: m.id,
            zone_geojson: m.zone_geojson,
            date: m.date,
            courriers_distribues: m.courriers_distribues,
            courriers_prevu: m.courriers_prevu,
            secteur_nom: m.secteur_nom,
            campagne_id: m.campagne_id,
            campagne_code: campagne.code,
            campagne_commune: campagne.commune,
            support_nom: campagne.supports_prospection?.nom || null,
            etudiant_prenom: m.etudiants?.prenom || null,
            courtier_name: courtierId ? profilesMap.get(courtierId) || null : null,
            age_months: ageMonths,
            color: getColorByAge(ageMonths),
          };
        })
        .filter((z): z is ZoneData => z !== null);

      return zones;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// Liste des communes uniques pour le filtre
export function useZoneCommunes() {
  return useQuery({
    queryKey: ['zone-communes'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('campagnes')
        .select('commune')
        .not('commune', 'is', null);

      if (error) throw error;
      
      const uniqueCommunes = [...new Set((data || []).map((c) => c.commune))].sort();
      return uniqueCommunes;
    },
  });
}

// Export des constantes pour la légende
export const ZONE_AGE_LEGEND = [
  { category: 'recent' as AgeCategory, label: '< 1 mois', color: AGE_COLORS.recent, description: 'Ne pas redistribuer' },
  { category: 'medium' as AgeCategory, label: '1-3 mois', color: AGE_COLORS.medium, description: 'Récent' },
  { category: 'old' as AgeCategory, label: '3-6 mois', color: AGE_COLORS.old, description: 'Peut être redistribué' },
  { category: 'very_old' as AgeCategory, label: '> 6 mois', color: AGE_COLORS.very_old, description: 'Redistribution OK' },
];
