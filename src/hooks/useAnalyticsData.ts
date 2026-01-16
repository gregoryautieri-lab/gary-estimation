import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EstimationStatus = Database['public']['Enums']['estimation_status'];
type TypeBien = Database['public']['Enums']['type_bien'];

export interface EstimationRow {
  id: string;
  courtier_id: string;
  statut: EstimationStatus;
  type_bien: TypeBien | null;
  localite: string | null;
  prix_final: number | null;
  created_at: string;
  updated_at: string;
  etapes_completees: string[] | null;
}

export interface CourtierPerformance {
  courtierId: string;
  courtierName: string;
  estimations: number;
  mandats: number;
  tauxConversion: number;
  caMoyen: number;
  delaiMoyen: number; // en jours
}

export interface FunnelStep {
  label: string;
  count: number;
  percentage: number;
  statuses: EstimationStatus[];
}

export interface ModuleTime {
  module: number;
  label: string;
  avgMinutes: number;
}

export interface TypeBienStats {
  type: string;
  count: number;
  percentage: number;
  prixMoyen: number;
}

export interface ZoneStats {
  localite: string;
  count: number;
  percentage: number;
}

export interface AbandonStats {
  module: number;
  label: string;
  abandonCount: number;
  abandonPercentage: number;
}

export interface AnalyticsData {
  // Vue d'ensemble
  totalEstimations7j: number;
  totalEstimations30j: number;
  totalEstimationsAnnee: number;
  tauxConversionGlobal: number;
  delaiMoyenSignature: number;
  caPrevisionnel: number;
  
  // Performance par courtier
  courtierPerformances: CourtierPerformance[];
  
  // Funnel
  funnelSteps: FunnelStep[];
  
  // Temps par module (estimé)
  modulesTimes: ModuleTime[];
  
  // Types de biens
  typesBienStats: TypeBienStats[];
  
  // Zones géographiques
  zonesStats: ZoneStats[];
  
  // Taux d'abandon
  abandonStats: AbandonStats[];
  
  // Données brutes pour graphiques
  estimationsParMois: { mois: string; count: number }[];
  
  // Raw data pour export
  rawEstimations: EstimationRow[];
}

export type PeriodFilter = '7j' | '30j' | 'annee';

const FUNNEL_CONFIG: { label: string; statuses: EstimationStatus[] }[] = [
  { label: 'Estimations créées', statuses: ['brouillon', 'en_cours', 'termine', 'a_presenter', 'presentee', 'reflexion', 'negociation', 'accord_oral', 'en_signature', 'mandat_signe', 'perdu', 'archive'] },
  { label: 'Présentées', statuses: ['presentee', 'reflexion', 'negociation', 'accord_oral', 'en_signature', 'mandat_signe'] },
  { label: 'En négociation', statuses: ['negociation', 'accord_oral', 'en_signature', 'mandat_signe'] },
  { label: 'Accord oral', statuses: ['accord_oral', 'en_signature', 'mandat_signe'] },
  { label: 'Mandats signés', statuses: ['mandat_signe'] },
];

const COMMISSION_RATE = 0.03; // 3% de commission estimée

export function useAnalyticsData(periodFilter: PeriodFilter = '30j', courtierFilter: string | null = null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());

  const loadProfiles = useCallback(async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name');
    
    const map = new Map<string, string>();
    profilesData?.forEach(p => {
      map.set(p.user_id, p.full_name || 'Sans nom');
    });
    setProfiles(map);
    return map;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const profilesMap = await loadProfiles();

      // Calculer les dates de filtre
      const now = new Date();
      const date7j = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const date30j = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dateAnnee = new Date(now.getFullYear(), 0, 1);

      // Récupérer toutes les estimations
      let query = supabase
        .from('estimations')
        .select('id, courtier_id, statut, type_bien, localite, prix_final, created_at, updated_at, etapes_completees')
        .order('created_at', { ascending: false });

      if (courtierFilter) {
        query = query.eq('courtier_id', courtierFilter);
      }

      const { data: estimations, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const allEstimations = (estimations || []) as EstimationRow[];

      // Filtrer par période
      const filterByDate = (est: EstimationRow[], startDate: Date) => 
        est.filter(e => new Date(e.created_at) >= startDate);

      const est7j = filterByDate(allEstimations, date7j);
      const est30j = filterByDate(allEstimations, date30j);
      const estAnnee = filterByDate(allEstimations, dateAnnee);

      // Sélectionner les données selon le filtre
      let filteredEstimations: EstimationRow[];
      switch (periodFilter) {
        case '7j':
          filteredEstimations = est7j;
          break;
        case 'annee':
          filteredEstimations = estAnnee;
          break;
        default:
          filteredEstimations = est30j;
      }

      // Calcul des métriques de vue d'ensemble
      const mandatsSigns = filteredEstimations.filter(e => e.statut === 'mandat_signe');
      const tauxConversion = filteredEstimations.length > 0 
        ? (mandatsSigns.length / filteredEstimations.length) * 100 
        : 0;

      // Calcul du délai moyen (approximatif basé sur created_at -> updated_at pour mandats)
      const delais = mandatsSigns.map(e => {
        const created = new Date(e.created_at);
        const updated = new Date(e.updated_at);
        return Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });
      const delaiMoyen = delais.length > 0 
        ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) 
        : 0;

      // CA prévisionnel
      const caPrevisionnel = mandatsSigns.reduce((sum, e) => {
        return sum + (e.prix_final || 0) * COMMISSION_RATE;
      }, 0);

      // Performance par courtier
      const courtierGroups = new Map<string, EstimationRow[]>();
      filteredEstimations.forEach(e => {
        const existing = courtierGroups.get(e.courtier_id) || [];
        existing.push(e);
        courtierGroups.set(e.courtier_id, existing);
      });

      const courtierPerformances: CourtierPerformance[] = Array.from(courtierGroups.entries()).map(([courtierId, ests]) => {
        const mandats = ests.filter(e => e.statut === 'mandat_signe');
        const mandatsWithPrice = mandats.filter(e => e.prix_final);
        const caMoyen = mandatsWithPrice.length > 0
          ? Math.round(mandatsWithPrice.reduce((sum, e) => sum + (e.prix_final || 0) * COMMISSION_RATE, 0) / mandatsWithPrice.length)
          : 0;

        const delaisCourtier = mandats.map(e => {
          const created = new Date(e.created_at);
          const updated = new Date(e.updated_at);
          return Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
        const delaiMoyenCourtier = delaisCourtier.length > 0
          ? Math.round(delaisCourtier.reduce((a, b) => a + b, 0) / delaisCourtier.length)
          : 0;

        return {
          courtierId,
          courtierName: profilesMap.get(courtierId) || 'Inconnu',
          estimations: ests.length,
          mandats: mandats.length,
          tauxConversion: ests.length > 0 ? Math.round((mandats.length / ests.length) * 100) : 0,
          caMoyen,
          delaiMoyen: delaiMoyenCourtier,
        };
      }).sort((a, b) => b.mandats - a.mandats);

      // Funnel
      const totalEstimations = filteredEstimations.length;
      const funnelSteps: FunnelStep[] = FUNNEL_CONFIG.map(step => {
        const count = filteredEstimations.filter(e => step.statuses.includes(e.statut)).length;
        return {
          label: step.label,
          count,
          percentage: totalEstimations > 0 ? Math.round((count / totalEstimations) * 100) : 0,
          statuses: step.statuses,
        };
      });

      // Temps par module (estimation fictive basée sur la complexité)
      const modulesTimes: ModuleTime[] = [
        { module: 1, label: 'Identification', avgMinutes: 8 },
        { module: 2, label: 'Caractéristiques', avgMinutes: 12 },
        { module: 3, label: 'Analyse terrain', avgMinutes: 6 },
        { module: 4, label: 'Pré-estimation', avgMinutes: 15 },
        { module: 5, label: 'Stratégie', avgMinutes: 5 },
      ];

      // Types de biens
      const typeGroups = new Map<string, EstimationRow[]>();
      filteredEstimations.forEach(e => {
        const type = e.type_bien || 'non_defini';
        const existing = typeGroups.get(type) || [];
        existing.push(e);
        typeGroups.set(type, existing);
      });

      const typesBienStats: TypeBienStats[] = Array.from(typeGroups.entries())
        .map(([type, ests]) => {
          const estsWithPrice = ests.filter(e => e.prix_final);
          const prixMoyen = estsWithPrice.length > 0
            ? Math.round(estsWithPrice.reduce((sum, e) => sum + (e.prix_final || 0), 0) / estsWithPrice.length)
            : 0;

          return {
            type: type === 'appartement' ? 'Appartements' :
                  type === 'maison' ? 'Maisons' :
                  type === 'terrain' ? 'Terrains' :
                  type === 'immeuble' ? 'Immeubles' :
                  type === 'commercial' ? 'Commerciaux' : 'Non défini',
            count: ests.length,
            percentage: totalEstimations > 0 ? Math.round((ests.length / totalEstimations) * 100) : 0,
            prixMoyen,
          };
        })
        .sort((a, b) => b.count - a.count);

      // Zones géographiques
      const zoneGroups = new Map<string, number>();
      filteredEstimations.forEach(e => {
        const zone = e.localite || 'Non défini';
        zoneGroups.set(zone, (zoneGroups.get(zone) || 0) + 1);
      });

      const zonesStats: ZoneStats[] = Array.from(zoneGroups.entries())
        .map(([localite, count]) => ({
          localite,
          count,
          percentage: totalEstimations > 0 ? Math.round((count / totalEstimations) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Taux d'abandon
      const abandonStats: AbandonStats[] = [1, 2, 3, 4, 5].map(moduleNum => {
        // Estimations abandonnées à ce module = brouillon avec ce module non complété
        const brouillons = filteredEstimations.filter(e => 
          e.statut === 'brouillon' || e.statut === 'archive'
        );
        
        const abandonnes = brouillons.filter(e => {
          const etapes = e.etapes_completees || [];
          // Abandonné au module X = module X-1 complété mais pas module X
          if (moduleNum === 1) {
            return etapes.length === 0;
          }
          return etapes.includes(`module${moduleNum - 1}`) && !etapes.includes(`module${moduleNum}`);
        });

        return {
          module: moduleNum,
          label: `Module ${moduleNum}`,
          abandonCount: abandonnes.length,
          abandonPercentage: totalEstimations > 0 
            ? Math.round((abandonnes.length / totalEstimations) * 100) 
            : 0,
        };
      });

      // Estimations par mois (pour graphique)
      const monthGroups = new Map<string, number>();
      allEstimations.forEach(e => {
        const date = new Date(e.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthGroups.set(monthKey, (monthGroups.get(monthKey) || 0) + 1);
      });

      const estimationsParMois = Array.from(monthGroups.entries())
        .map(([mois, count]) => ({ mois, count }))
        .sort((a, b) => a.mois.localeCompare(b.mois))
        .slice(-12); // Derniers 12 mois

      setData({
        totalEstimations7j: est7j.length,
        totalEstimations30j: est30j.length,
        totalEstimationsAnnee: estAnnee.length,
        tauxConversionGlobal: Math.round(tauxConversion),
        delaiMoyenSignature: delaiMoyen,
        caPrevisionnel: Math.round(caPrevisionnel),
        courtierPerformances,
        funnelSteps,
        modulesTimes,
        typesBienStats,
        zonesStats,
        abandonStats,
        estimationsParMois,
        rawEstimations: filteredEstimations,
      });

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [periodFilter, courtierFilter, loadProfiles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const courtiersList = useMemo(() => {
    return Array.from(profiles.entries()).map(([id, name]) => ({ id, name }));
  }, [profiles]);

  const exportToCSV = useCallback(() => {
    if (!data) return;

    const rows: string[] = [];
    
    // Header
    rows.push('ID,Courtier,Statut,Type de bien,Localité,Prix final,Créé le,Mis à jour le');
    
    // Data rows
    data.rawEstimations.forEach(e => {
      rows.push([
        e.id,
        profiles.get(e.courtier_id) || e.courtier_id,
        e.statut,
        e.type_bien || '',
        e.localite || '',
        e.prix_final?.toString() || '',
        new Date(e.created_at).toLocaleDateString('fr-CH'),
        new Date(e.updated_at).toLocaleDateString('fr-CH'),
      ].map(val => `"${val}"`).join(','));
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${periodFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data, periodFilter, profiles]);

  return { data, loading, error, reload: loadData, exportToCSV, courtiersList };
}
