// ============================================
// Hook de verrouillage amélioré avec duplication
// Version simplifiée: 7 statuts
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EstimationStatus, EstimationData } from '@/types/estimation';
import type { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Statuts qui verrouillent l'estimation en lecture seule
 */
const LOCKED_STATUTS: EstimationStatus[] = [
  'mandat_signe',
  'archive'
];

/**
 * Statuts possibles selon le statut actuel (transitions autorisées)
 * 7 statuts: brouillon, validee, presentee, negociation, mandat_signe, perdu, archive
 */
const TRANSITIONS_AUTORISEES: Record<EstimationStatus, EstimationStatus[]> = {
  'brouillon': ['validee', 'archive'],
  'validee': ['presentee', 'brouillon', 'archive'],
  'presentee': ['negociation', 'perdu', 'archive'],
  'negociation': ['mandat_signe', 'perdu', 'presentee'],
  'mandat_signe': ['archive'],
  'perdu': ['archive', 'presentee'],
  'archive': []
};

export interface LockState {
  isLocked: boolean;
  lockMessage: string | null;
  lockReason: EstimationStatus | null;
  canChangeStatut: boolean;
  allowedTransitions: EstimationStatus[];
}

export interface DuplicateResult {
  success: boolean;
  newId?: string;
  error?: string;
}

/**
 * Hook pour gérer le verrouillage des estimations avec duplication
 */
export function useEstimationLockEnhanced(
  statut: EstimationStatus | string | undefined,
  isAdmin: boolean = false
) {
  const navigate = useNavigate();
  const [duplicating, setDuplicating] = useState(false);

  const lockState = useMemo((): LockState => {
    // Si pas de statut, pas verrouillé
    if (!statut) {
      return {
        isLocked: false,
        lockMessage: null,
        lockReason: null,
        canChangeStatut: true,
        allowedTransitions: ['brouillon', 'validee', 'archive']
      };
    }

    const currentStatut = statut as EstimationStatus;
    const isLocked = !isAdmin && LOCKED_STATUTS.includes(currentStatut);

    // Transitions possibles
    let allowedTransitions = TRANSITIONS_AUTORISEES[currentStatut] || [];
    if (isAdmin) {
      // Admin peut tout faire
      const allStatuts: EstimationStatus[] = ['brouillon', 'validee', 'presentee', 'negociation', 'mandat_signe', 'perdu', 'archive'];
      allowedTransitions = allStatuts.filter(s => s !== currentStatut);
    }

    return {
      isLocked,
      lockMessage: isLocked ? getLockMessage(currentStatut) : null,
      lockReason: isLocked ? currentStatut : null,
      canChangeStatut: isAdmin || currentStatut === 'brouillon' || currentStatut === 'validee',
      allowedTransitions
    };
  }, [statut, isAdmin]);

  /**
   * Dupliquer une estimation
   */
  const duplicateEstimation = useCallback(async (
    estimationId: string,
    estimationData: Partial<EstimationData>
  ): Promise<DuplicateResult> => {
    setDuplicating(true);

    try {
      // Récupérer l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non authentifié');
      }

      // Préparer les données dupliquées
      const now = new Date().toISOString();
      const duplicatedData = {
        courtier_id: user.id,
        statut: 'brouillon' as const,
        adresse: estimationData.identification?.adresse 
          ? `${estimationData.identification.adresse.rue || ''} ${estimationData.identification.adresse.numero || ''} (copie)`.trim()
          : 'Copie estimation',
        code_postal: estimationData.identification?.adresse?.codePostal || null,
        localite: estimationData.identification?.adresse?.localite || null,
        vendeur_nom: estimationData.identification?.vendeur?.nom 
          ? `${estimationData.identification.vendeur.nom} (copie)`
          : null,
        vendeur_email: estimationData.identification?.vendeur?.email || null,
        vendeur_telephone: estimationData.identification?.vendeur?.telephone || null,
        type_bien: estimationData.caracteristiques?.typeBien || null,
        identification: (estimationData.identification || null) as unknown as Json,
        caracteristiques: (estimationData.caracteristiques || null) as unknown as Json,
        analyse_terrain: (estimationData.analyseTerrain || null) as unknown as Json,
        pre_estimation: (estimationData.preEstimation || null) as unknown as Json,
        strategie: null as unknown as Json,
        photos: null as unknown as Json,
        comparables: (estimationData.preEstimation?.comparablesVendus || null) as unknown as Json,
        notes_libres: estimationData.notesLibres 
          ? `[Copié le ${new Date().toLocaleDateString('fr-CH')}]\n\n${estimationData.notesLibres}`
          : `Copié depuis l'estimation ${estimationId}`,
        historique: {
          duplicatedFrom: estimationId,
          duplicatedAt: now,
          originalStatut: statut
        } as unknown as Json,
        created_at: now,
        updated_at: now
      };

      // Insérer la nouvelle estimation
      const { data: newEstimation, error } = await supabase
        .from('estimations')
        .insert([duplicatedData])
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Estimation dupliquée avec succès');
      
      setDuplicating(false);
      return { success: true, newId: newEstimation.id };

    } catch (error: any) {
      console.error('Erreur duplication:', error);
      toast.error(`Erreur lors de la duplication: ${error.message}`);
      setDuplicating(false);
      return { success: false, error: error.message };
    }
  }, [statut]);

  /**
   * Dupliquer et naviguer vers la nouvelle estimation
   */
  const duplicateAndNavigate = useCallback(async (
    estimationId: string,
    estimationData: Partial<EstimationData>
  ) => {
    const result = await duplicateEstimation(estimationId, estimationData);
    if (result.success && result.newId) {
      navigate(`/estimation/${result.newId}/1`);
    }
    return result;
  }, [duplicateEstimation, navigate]);

  /**
   * Changer le statut d'une estimation
   */
  const changeStatut = useCallback(async (
    estimationId: string,
    newStatut: EstimationStatus
  ): Promise<boolean> => {
    if (!lockState.allowedTransitions.includes(newStatut)) {
      toast.error(`Transition vers "${getStatutLabel(newStatut)}" non autorisée`);
      return false;
    }

    try {
      const { error } = await supabase
        .from('estimations')
        .update({ 
          statut: newStatut,
          updated_at: new Date().toISOString()
        })
        .eq('id', estimationId);

      if (error) throw error;

      toast.success(`Statut changé en "${getStatutLabel(newStatut)}"`);
      return true;

    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      return false;
    }
  }, [lockState.allowedTransitions]);

  return { 
    ...lockState,
    duplicating,
    duplicateEstimation,
    duplicateAndNavigate,
    changeStatut
  };
}

/**
 * Labels français pour les 7 statuts
 */
export function getStatutLabel(statut: EstimationStatus): string {
  const labels: Record<EstimationStatus, string> = {
    'brouillon': 'Brouillon',
    'validee': 'Validée',
    'presentee': 'Présentée',
    'negociation': 'En négociation',
    'mandat_signe': 'Mandat signé',
    'perdu': 'Perdu',
    'archive': 'Archivé'
  };
  return labels[statut] || statut;
}

/**
 * Message de verrouillage selon le statut
 */
function getLockMessage(statut: EstimationStatus): string {
  switch (statut) {
    case 'mandat_signe':
      return 'Ce bien a un mandat signé. L\'estimation est en lecture seule.';
    case 'archive':
      return 'Cette estimation est archivée. Dupliquez-la pour créer une nouvelle version.';
    default:
      return 'Cette estimation est verrouillée.';
  }
}

/**
 * Couleurs des badges statut
 */
export function getStatutColor(statut: EstimationStatus): string {
  const colors: Record<EstimationStatus, string> = {
    'brouillon': 'bg-gray-100 text-gray-700 border-gray-300',
    'validee': 'bg-indigo-100 text-indigo-700 border-indigo-300',
    'presentee': 'bg-purple-100 text-purple-700 border-purple-300',
    'negociation': 'bg-orange-100 text-orange-700 border-orange-300',
    'mandat_signe': 'bg-green-100 text-green-700 border-green-300',
    'perdu': 'bg-red-100 text-red-700 border-red-300',
    'archive': 'bg-slate-100 text-slate-700 border-slate-300'
  };
  return colors[statut] || 'bg-gray-100 text-gray-700 border-gray-300';
}

/**
 * Icônes des statuts
 */
export function getStatutIcon(statut: EstimationStatus): string {
  const icons: Record<EstimationStatus, string> = {
    'brouillon': '📝',
    'validee': '✅',
    'presentee': '👁️',
    'negociation': '💬',
    'mandat_signe': '🏆',
    'perdu': '❌',
    'archive': '📦'
  };
  return icons[statut] || '📄';
}
