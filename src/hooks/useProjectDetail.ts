import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Table des coordonnées moyennes par NPA (Genève + Vaud limitrophe)
const NPA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Genève ville
  "1200": { lat: 46.2044, lng: 6.1432 },
  "1201": { lat: 46.2088, lng: 6.1420 },
  "1202": { lat: 46.2155, lng: 6.1296 },
  "1203": { lat: 46.2180, lng: 6.1180 },
  "1204": { lat: 46.2000, lng: 6.1450 },
  "1205": { lat: 46.1920, lng: 6.1400 },
  "1206": { lat: 46.1900, lng: 6.1600 },
  "1207": { lat: 46.1950, lng: 6.1750 },
  "1208": { lat: 46.1880, lng: 6.1650 },
  "1209": { lat: 46.2250, lng: 6.1100 },
  // Rive gauche
  "1212": { lat: 46.1870, lng: 6.1250 },
  "1213": { lat: 46.1750, lng: 6.1350 },
  "1214": { lat: 46.1800, lng: 6.0950 },
  "1215": { lat: 46.2000, lng: 6.0800 },
  "1216": { lat: 46.1950, lng: 6.0600 },
  "1217": { lat: 46.2000, lng: 6.0400 },
  "1218": { lat: 46.1870, lng: 6.1150 },
  "1219": { lat: 46.2150, lng: 6.1050 },
  "1220": { lat: 46.2200, lng: 6.0800 },
  "1222": { lat: 46.2050, lng: 6.0500 },
  "1223": { lat: 46.2120, lng: 6.1850 },
  "1224": { lat: 46.1800, lng: 6.1800 },
  "1225": { lat: 46.1850, lng: 6.2000 },
  "1226": { lat: 46.1900, lng: 6.2100 },
  "1227": { lat: 46.1700, lng: 6.1550 },
  "1228": { lat: 46.1650, lng: 6.1400 },
  // Communes genevoises
  "1231": { lat: 46.1550, lng: 6.1200 },
  "1232": { lat: 46.1500, lng: 6.1050 },
  "1233": { lat: 46.1400, lng: 6.0900 },
  "1234": { lat: 46.1600, lng: 6.0700 },
  "1236": { lat: 46.1350, lng: 6.1200 },
  "1237": { lat: 46.1200, lng: 6.1100 },
  "1239": { lat: 46.1100, lng: 6.0900 },
  "1241": { lat: 46.2400, lng: 6.0600 },
  "1242": { lat: 46.2300, lng: 6.0400 },
  "1243": { lat: 46.2100, lng: 6.0200 },
  "1244": { lat: 46.1900, lng: 6.2300 },
  "1245": { lat: 46.2000, lng: 6.2400 },
  "1246": { lat: 46.2100, lng: 6.2550 },
  "1247": { lat: 46.2200, lng: 6.2700 },
  "1248": { lat: 46.2300, lng: 6.2900 },
  "1251": { lat: 46.1300, lng: 6.0650 },
  "1252": { lat: 46.1400, lng: 6.0500 },
  "1253": { lat: 46.1550, lng: 6.0350 },
  "1254": { lat: 46.1650, lng: 6.0200 },
  "1255": { lat: 46.1750, lng: 6.0100 },
  "1256": { lat: 46.1600, lng: 5.9950 },
  "1257": { lat: 46.1450, lng: 5.9800 },
  "1258": { lat: 46.1300, lng: 5.9650 },
  // Vaud limitrophe
  "1260": { lat: 46.3833, lng: 6.2333 },
  "1196": { lat: 46.2900, lng: 6.1700 },
  "1197": { lat: 46.3100, lng: 6.1900 },
  "1180": { lat: 46.4600, lng: 6.3800 },
  "1110": { lat: 46.5110, lng: 6.4990 },
};

export interface ProjectData {
  id: string;
  projectName: string;
  communes: string[];
  prixMin: number | null;
  prixMax: number | null;
  typeBien: string[];
  surfaceMin: number | null;
  surfaceMax: number | null;
  piecesMin: number | null;
  piecesMax: number | null;
  statutFilter: 'tous' | 'vendus' | 'en_vente';
  nbComparables: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComparableData {
  linkId: string;
  // Either estimation or comparable (external)
  estimationId: string | null;
  comparableId: string | null;
  sourceType: 'gary' | 'external';
  selectedByUser: boolean;
  notes: string | null;
  createdAt: string;
  // Common data
  adresse: string | null;
  localite: string | null;
  codePostal: string | null;
  prixFinal: number | null;
  typeBien: string | null;
  statut: string;
  statutMarche: 'vendu' | 'en_vente' | null; // For external comparables
  strategieDiffusion: string | null;
  surface: number | null;
  pieces: number | null;
  updatedAt: string;
  dateVente: string | null;
  urlSource: string | null;
  source: string | null; // 'manual', 'immoscout', etc.
  // Geocoding
  coordinates: { lat: number; lng: number } | null;
  geocodingStatus: 'pending' | 'found' | 'fallback' | 'missing';
  // Images
  images: string[] | null;
}

export function useProjectDetail(projectId: string | undefined) {
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [comparables, setComparables] = useState<ComparableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load project and comparables
  const loadProject = useCallback(async () => {
    if (!projectId || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects_comparables')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (projectError) {
        console.error('Project fetch error:', projectError);
        setError('Impossible de charger le projet');
        setLoading(false);
        return;
      }

      if (!projectData) {
        setError('Projet non trouvé');
        setLoading(false);
        return;
      }

      setProject({
        id: projectData.id,
        projectName: projectData.project_name,
        communes: projectData.communes || [],
        prixMin: projectData.prix_min,
        prixMax: projectData.prix_max,
        typeBien: projectData.type_bien || [],
        surfaceMin: projectData.surface_min,
        surfaceMax: projectData.surface_max,
        piecesMin: projectData.pieces_min,
        piecesMax: projectData.pieces_max,
        statutFilter: projectData.statut_filter || 'tous',
        nbComparables: projectData.nb_comparables || 0,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at,
      });

      // 2. Fetch links (with both estimation_id and comparable_id)
      const { data: linksData, error: linksError } = await supabase
        .from('project_comparables_links')
        .select('id, created_at, selected_by_user, notes, estimation_id, comparable_id')
        .eq('project_id', projectId);

      if (linksError) {
        console.error('Links fetch error:', linksError);
        setComparables([]);
        setLoading(false);
        return;
      }

      if (!linksData || linksData.length === 0) {
        setComparables([]);
        setLoading(false);
        return;
      }

      // 3a. Fetch estimation details for GARY comparables
      const estimationIds = linksData
        .filter(l => l.estimation_id)
        .map(l => l.estimation_id!);
      
      let estimationsMap = new Map<string, any>();
      if (estimationIds.length > 0) {
        const { data: estimationsData, error: estimationsError } = await supabase
          .from('estimations')
          .select('id, adresse, localite, code_postal, prix_final, type_bien, statut, caracteristiques, identification, updated_at')
          .in('id', estimationIds);

        if (estimationsError) {
          console.error('Estimations fetch error:', estimationsError);
        }
        estimationsMap = new Map((estimationsData || []).map(e => [e.id, e]));
      }

      // 3b. Fetch external comparables
      const comparableIds = linksData
        .filter(l => l.comparable_id)
        .map(l => l.comparable_id!);
      
      let comparablesMap = new Map<string, any>();
      if (comparableIds.length > 0) {
        const { data: comparablesData, error: comparablesError } = await supabase
          .from('comparables')
          .select('*')
          .in('id', comparableIds);

        if (comparablesError) {
          console.error('Comparables fetch error:', comparablesError);
        }
        comparablesMap = new Map((comparablesData || []).map(c => [c.id, c]));
      }

      // 4. Map data together
      const mappedComparables: ComparableData[] = linksData.map(link => {
        // GARY estimation
        if (link.estimation_id) {
          const est = estimationsMap.get(link.estimation_id);
          const carac = est?.caracteristiques as any;
          const ident = est?.identification as any;
          
          const surface = parseFloat(carac?.surfacePPE || carac?.surfaceHabitableMaison || '0') || null;
          const pieces = parseFloat(carac?.nombrePieces || '0') || null;
          const storedCoords = ident?.adresse?.coordinates;
          
          // Map estimation status to market status
          const statutMarche = est?.statut === 'mandat_signe' ? 'vendu' as const : 'en_vente' as const;
          
          return {
            linkId: link.id,
            estimationId: link.estimation_id,
            comparableId: null,
            sourceType: 'gary' as const,
            selectedByUser: link.selected_by_user || false,
            notes: link.notes,
            createdAt: link.created_at,
            adresse: est?.adresse || null,
            localite: est?.localite || null,
            codePostal: est?.code_postal || null,
            prixFinal: est?.prix_final ? Number(est.prix_final) : null,
            typeBien: est?.type_bien || null,
            statut: est?.statut || 'brouillon',
            statutMarche,
            strategieDiffusion: null,
            surface,
            pieces,
            updatedAt: est?.updated_at || link.created_at,
            dateVente: null,
            urlSource: null,
            source: 'gary',
            coordinates: storedCoords || null,
            geocodingStatus: storedCoords ? 'found' as const : 'pending' as const,
            images: null, // GARY estimations have photos in their own structure
          };
        }
        
        // External comparable
        const comp = comparablesMap.get(link.comparable_id!);
        const hasCoords = comp?.latitude && comp?.longitude;
        
        return {
          linkId: link.id,
          estimationId: null,
          comparableId: link.comparable_id,
          sourceType: 'external' as const,
          selectedByUser: link.selected_by_user || false,
          notes: link.notes || comp?.notes || null,
          createdAt: link.created_at,
          adresse: comp?.adresse || null,
          localite: comp?.localite || null,
          codePostal: comp?.code_postal || null,
          prixFinal: comp?.prix ? Number(comp.prix) : null,
          typeBien: comp?.type_bien || null,
          statut: comp?.statut_marche === 'vendu' ? 'mandat_signe' : 'presentee',
          statutMarche: comp?.statut_marche || 'en_vente',
          strategieDiffusion: comp?.strategie_diffusion || null,
          surface: comp?.surface ? Number(comp.surface) : null,
          pieces: comp?.pieces ? Number(comp.pieces) : null,
          updatedAt: comp?.updated_at || link.created_at,
          dateVente: comp?.date_vente || null,
          urlSource: comp?.url_source || null,
          source: comp?.source || 'manual',
          coordinates: hasCoords ? { lat: Number(comp.latitude), lng: Number(comp.longitude) } : null,
          geocodingStatus: hasCoords ? 'found' as const : 'pending' as const,
          images: comp?.images || null,
        };
      });

      setComparables(mappedComparables);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.id]);

  // Geocode comparables that don't have coordinates
  const geocodeComparables = useCallback(async () => {
    const toGeocode = comparables.filter(c => c.geocodingStatus === 'pending');
    if (toGeocode.length === 0) return;

    const updated = [...comparables];

    for (const comp of toGeocode) {
      const idx = updated.findIndex(c => c.linkId === comp.linkId);
      if (idx === -1) continue;

      // Strategy 1: Try edge function geocoding
      if (comp.adresse) {
        try {
          const { data, error } = await supabase.functions.invoke('google-places', {
            body: { 
              action: 'geocode',
              address: `${comp.adresse}, ${comp.localite || ''}, Suisse`
            },
          });

          if (!error && data?.success && data?.location) {
            updated[idx] = {
              ...updated[idx],
              coordinates: data.location,
              geocodingStatus: 'found',
            };
            continue;
          }
        } catch (e) {
          console.warn('Geocoding API error:', e);
        }
      }

      // Strategy 2: Fallback to NPA coordinates
      if (comp.codePostal && NPA_COORDINATES[comp.codePostal]) {
        updated[idx] = {
          ...updated[idx],
          coordinates: NPA_COORDINATES[comp.codePostal],
          geocodingStatus: 'fallback',
        };
        continue;
      }

      // Strategy 3: No coordinates available
      updated[idx] = {
        ...updated[idx],
        geocodingStatus: 'missing',
      };
    }

    setComparables(updated);
  }, [comparables]);

  // Remove a comparable link
  const removeComparable = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('project_comparables_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        toast.error('Impossible de retirer le comparable');
        return false;
      }

      setComparables(prev => prev.filter(c => c.linkId !== linkId));
      toast.success('Comparable retiré du projet');
      return true;
    } catch (err) {
      console.error('Remove error:', err);
      toast.error('Erreur lors du retrait');
      return false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Trigger geocoding when comparables loaded
  useEffect(() => {
    if (comparables.some(c => c.geocodingStatus === 'pending')) {
      geocodeComparables();
    }
  }, [comparables.length]);

  return {
    project,
    comparables,
    loading,
    error,
    reload: loadProject,
    removeComparable,
  };
}