import { useMemo } from 'react';
import type { EstimationStatus } from '@/types/estimation';

/**
 * Statuts qui verrouillent l'estimation en lecture seule
 * Basé sur EstimationStatus = 'brouillon' | 'en_cours' | 'termine' | 'archive' | 'vendu'
 */
const LOCKED_STATUTS: EstimationStatus[] = [
  'termine',
  'archive',
  'vendu'
];

/**
 * Hook pour gérer le verrouillage des estimations
 * Une estimation avec un statut "terminé", "archivé" ou "vendu" ne peut plus être modifiée par un courtier
 */
export function useEstimationLock(
  statut: EstimationStatus | string | undefined,
  isAdmin: boolean = false
) {
  const isLocked = useMemo(() => {
    // Les admins peuvent toujours modifier
    if (isAdmin) return false;
    
    // Si pas de statut, pas verrouillé
    if (!statut) return false;
    
    return LOCKED_STATUTS.includes(statut as EstimationStatus);
  }, [statut, isAdmin]);

  const lockMessage = useMemo(() => {
    if (!isLocked) return null;
    
    const statutLabel = getStatutLabel(statut as EstimationStatus);
    return `Cette estimation est verrouillée (statut: ${statutLabel}). Dupliquez-la pour la modifier.`;
  }, [isLocked, statut]);

  const canChangeStatut = useMemo(() => {
    // Les admins peuvent toujours changer
    if (isAdmin) return true;
    
    // Brouillon et en_cours peuvent être modifiés
    if (statut === 'brouillon' || statut === 'en_cours') return true;
    
    return false;
  }, [statut, isAdmin]);

  return { 
    isLocked, 
    lockMessage, 
    canChangeStatut 
  };
}

/**
 * Labels français pour les statuts
 */
function getStatutLabel(statut: EstimationStatus): string {
  // Import from STATUS_CONFIG for consistency
  const labels: Partial<Record<EstimationStatus, string>> = {
    'brouillon': 'Brouillon',
    'en_cours': 'En cours',
    'a_presenter': 'À présenter',
    'presentee': 'Présentée',
    'reflexion': 'En réflexion',
    'negociation': 'En négociation',
    'accord_oral': 'Accord oral',
    'en_signature': 'En signature',
    'mandat_signe': 'Mandat signé',
    'perdu': 'Perdu',
    'termine': 'Terminé',
    'archive': 'Archivé',
    'vendu': 'Vendu'
  };
  return labels[statut] || statut;
}

export { getStatutLabel };
