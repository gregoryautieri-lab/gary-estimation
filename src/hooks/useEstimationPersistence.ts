import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { 
  EstimationData, 
  EstimationStatus,
  TypeBien,
  Identification,
  Caracteristiques,
  AnalyseTerrain,
  PreEstimation,
  StrategiePitch,
  Photos,
  Timeline
} from '@/types/estimation';
import { 
  defaultIdentification as defIdent,
  defaultCaracteristiques as defCarac,
  defaultAnalyseTerrain as defAnalyse,
  defaultPreEstimation as defPre,
  defaultStrategiePitch as defStrat,
  defaultTimeline as defTime,
  defaultPhotos as defPhotos
} from '@/types/estimation';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// ============================================
// Conversion DB -> App (avec fallback aux defaults)
// ============================================
function rowToEstimation(row: {
  id: string;
  courtier_id: string;
  statut: string;
  type_bien: string | null;
  adresse: string | null;
  code_postal: string | null;
  localite: string | null;
  prix_final: number | null;
  prix_min: number | null;
  prix_max: number | null;
  vendeur_nom: string | null;
  vendeur_email: string | null;
  vendeur_telephone: string | null;
  identification: Json;
  caracteristiques: Json;
  analyse_terrain: Json;
  pre_estimation: Json;
  strategie: Json;
  historique: Json;
  timeline: Json;
  comparables: Json;
  photos: Json;
  etapes_completees: string[] | null;
  notes_libres: string | null;
  created_at: string;
  updated_at: string;
}): EstimationData {
  // Deep merge pour identification avec adresse imbriquée
  const identificationFromDb = row.identification as object || {};
  const mergedIdentification = {
    ...defIdent,
    ...identificationFromDb,
    adresse: {
      ...defIdent.adresse,
      ...((identificationFromDb as any).adresse || {})
    },
    vendeur: {
      ...defIdent.vendeur,
      ...((identificationFromDb as any).vendeur || {})
    },
    contexte: {
      ...defIdent.contexte,
      ...((identificationFromDb as any).contexte || {})
    },
    historique: {
      ...defIdent.historique,
      ...((identificationFromDb as any).historique || {})
    },
    financier: {
      ...defIdent.financier,
      ...((identificationFromDb as any).financier || {})
    },
    projetPostVente: {
      ...defIdent.projetPostVente,
      ...((identificationFromDb as any).projetPostVente || {})
    }
  } as Identification;

  return {
    id: row.id,
    courtierId: row.courtier_id,
    statut: row.statut as EstimationStatus,
    typeBien: (row.type_bien as TypeBien) || undefined,
    adresse: row.adresse || undefined,
    codePostal: row.code_postal || undefined,
    localite: row.localite || undefined,
    prixFinal: row.prix_final || undefined,
    prixMin: row.prix_min || undefined,
    prixMax: row.prix_max || undefined,
    vendeurNom: row.vendeur_nom || undefined,
    vendeurEmail: row.vendeur_email || undefined,
    vendeurTelephone: row.vendeur_telephone || undefined,
    identification: mergedIdentification,
    caracteristiques: { 
      ...defCarac, 
      ...(row.caracteristiques as object || {}),
      // CORRECTION Prompt 2 : Forcer typeBien depuis la colonne type_bien
      typeBien: row.type_bien || (row.caracteristiques as any)?.typeBien || ''
    } as Caracteristiques,
    analyseTerrain: { ...defAnalyse, ...(row.analyse_terrain as object || {}) } as AnalyseTerrain,
    preEstimation: { ...defPre, ...(row.pre_estimation as object || {}) } as PreEstimation,
    strategiePitch: { ...defStrat, ...(row.strategie as object || {}) } as StrategiePitch,
    photos: (row.photos as object as Photos) || { items: [] },
    timeline: { ...defTime, ...(row.timeline as object || {}) } as Timeline,
    etapesCompletees: row.etapes_completees || [],
    notesLibres: row.notes_libres || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ============================================
// Conversion App -> DB
// ============================================
type InsertData = {
  courtier_id: string;
  statut: EstimationStatus;
  type_bien: TypeBien | null;
  adresse: string | null;
  code_postal: string | null;
  localite: string | null;
  prix_final: number | null;
  prix_min: number | null;
  prix_max: number | null;
  vendeur_nom: string | null;
  vendeur_email: string | null;
  vendeur_telephone: string | null;
  identification: Json;
  caracteristiques: Json;
  analyse_terrain: Json;
  pre_estimation: Json;
  strategie: Json;
  historique: Json;
  timeline: Json;
  comparables: Json;
  photos: Json;
  etapes_completees: string[];
  notes_libres: string | null;
};

function estimationToInsert(data: Partial<EstimationData>, userId: string): InsertData {
  return {
    courtier_id: userId,
    statut: data.statut || 'brouillon',
    type_bien: data.typeBien || null,
    adresse: data.adresse || null,
    code_postal: data.codePostal || null,
    localite: data.localite || null,
    prix_final: data.prixFinal || null,
    prix_min: data.prixMin || null,
    prix_max: data.prixMax || null,
    vendeur_nom: data.vendeurNom || null,
    vendeur_email: data.vendeurEmail || null,
    vendeur_telephone: data.vendeurTelephone || null,
    identification: (data.identification || defIdent) as unknown as Json,
    caracteristiques: (data.caracteristiques || defCarac) as unknown as Json,
    analyse_terrain: (data.analyseTerrain || defAnalyse) as unknown as Json,
    pre_estimation: (data.preEstimation || defPre) as unknown as Json,
    strategie: (data.strategiePitch || defStrat) as unknown as Json,
    historique: {} as Json,
    timeline: (data.timeline || defTime) as unknown as Json,
    comparables: { vendus: [], enVente: [] } as unknown as Json,
    photos: (data.photos || defPhotos) as unknown as Json,
    etapes_completees: data.etapesCompletees || [],
    notes_libres: data.notesLibres || null
  };
}

function estimationToUpdate(data: Partial<EstimationData>) {
  const update: Record<string, unknown> = {};

  if (data.statut !== undefined) update.statut = data.statut;
  if (data.typeBien !== undefined) update.type_bien = data.typeBien;
  if (data.adresse !== undefined) update.adresse = data.adresse;
  if (data.codePostal !== undefined) update.code_postal = data.codePostal;
  if (data.localite !== undefined) update.localite = data.localite;
  if (data.prixFinal !== undefined) update.prix_final = data.prixFinal;
  if (data.prixMin !== undefined) update.prix_min = data.prixMin;
  if (data.prixMax !== undefined) update.prix_max = data.prixMax;
  if (data.vendeurNom !== undefined) update.vendeur_nom = data.vendeurNom;
  if (data.vendeurEmail !== undefined) update.vendeur_email = data.vendeurEmail;
  if (data.vendeurTelephone !== undefined) update.vendeur_telephone = data.vendeurTelephone;
  if (data.identification !== undefined) update.identification = data.identification as unknown as Json;
  if (data.caracteristiques !== undefined) {
    update.caracteristiques = data.caracteristiques as unknown as Json;
    // CORRECTION Prompt 2 : Propager typeBien vers la colonne type_bien
    if (data.caracteristiques.typeBien) {
      update.type_bien = data.caracteristiques.typeBien;
    }
  }
  if (data.analyseTerrain !== undefined) update.analyse_terrain = data.analyseTerrain as unknown as Json;
  if (data.preEstimation !== undefined) update.pre_estimation = data.preEstimation as unknown as Json;
  if (data.strategiePitch !== undefined) update.strategie = data.strategiePitch as unknown as Json;
  if (data.photos !== undefined) update.photos = data.photos as unknown as Json;
  if (data.timeline !== undefined) update.timeline = data.timeline as unknown as Json;
  if (data.etapesCompletees !== undefined) update.etapes_completees = data.etapesCompletees;
  if (data.notesLibres !== undefined) update.notes_libres = data.notesLibres;

  return update;
}

// ============================================
// Hook de persistence
// ============================================
export function useEstimationPersistence() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer toutes les estimations du courtier
  const fetchEstimations = useCallback(async (): Promise<EstimationData[]> => {
    console.log('📋 [fetchEstimations] Début, user:', user?.id, user?.email);
    
    if (!user) {
      console.log('❌ [fetchEstimations] Pas d\'utilisateur connecté');
      setError('Utilisateur non connecté');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [fetchEstimations] Requête Supabase...');
      const { data, error: fetchError } = await supabase
        .from('estimations')
        .select('*')
        .order('updated_at', { ascending: false });

      console.log('📊 [fetchEstimations] Réponse:', { 
        count: data?.length, 
        error: fetchError?.message,
        firstItem: data?.[0]?.id 
      });

      if (fetchError) throw fetchError;

      const mapped = (data || []).map(row => rowToEstimation(row as Parameters<typeof rowToEstimation>[0]));
      console.log('✅ [fetchEstimations] Mapped:', mapped.length, 'estimations');
      return mapped;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement';
      console.error('❌ [fetchEstimations] Erreur:', message);
      setError(message);
      toast.error('Erreur de chargement des estimations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Récupérer une estimation par ID
  const fetchEstimation = useCallback(async (id: string): Promise<EstimationData | null> => {
    if (!user) {
      setError('Utilisateur non connecté');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('estimations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return rowToEstimation(data as Parameters<typeof rowToEstimation>[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(message);
      toast.error('Estimation introuvable');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Créer une nouvelle estimation
  const createEstimation = useCallback(async (
    data: Partial<EstimationData>
  ): Promise<EstimationData | null> => {
    if (!user) {
      setError('Utilisateur non connecté');
      toast.error('Veuillez vous connecter');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const insertData = estimationToInsert(data, user.id);
      
      const { data: created, error: createError } = await supabase
        .from('estimations')
        .insert([insertData] as any)
        .select()
        .single();

      if (createError) throw createError;

      toast.success('Estimation créée');
      return rowToEstimation(created as Parameters<typeof rowToEstimation>[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de création';
      setError(message);
      toast.error('Erreur lors de la création');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mettre à jour une estimation
  const updateEstimation = useCallback(async (
    id: string,
    data: Partial<EstimationData>,
    silent = false
  ): Promise<EstimationData | null> => {
    if (!user) {
      setError('Utilisateur non connecté');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = estimationToUpdate(data);
      
      const { data: updated, error: updateError } = await supabase
        .from('estimations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (!silent) {
        toast.success('Estimation sauvegardée');
      }
      return rowToEstimation(updated as Parameters<typeof rowToEstimation>[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(message);
      toast.error('Erreur lors de la sauvegarde');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Supprimer une estimation
  const deleteEstimation = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('estimations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Estimation supprimée');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de suppression';
      setError(message);
      toast.error('Erreur lors de la suppression');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Dupliquer une estimation
  const duplicateEstimation = useCallback(async (id: string): Promise<EstimationData | null> => {
    const original = await fetchEstimation(id);
    if (!original) return null;

    // Créer une copie sans l'ID
    const copy: Partial<EstimationData> = {
      ...original,
      id: undefined,
      statut: 'brouillon',
      vendeurNom: original.vendeurNom ? `${original.vendeurNom} (copie)` : 'Copie'
    };

    const created = await createEstimation(copy);
    if (created) {
      toast.success('Estimation dupliquée');
    }
    return created;
  }, [fetchEstimation, createEstimation]);

  return {
    loading,
    error,
    fetchEstimations,
    fetchEstimation,
    createEstimation,
    updateEstimation,
    deleteEstimation,
    duplicateEstimation
  };
}
