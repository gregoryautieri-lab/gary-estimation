import { useMemo } from 'react';
import type { EstimationStatus } from '@/types/estimation';

/**
 * Statuts qui verrouillent l'estimation en lecture seule
 * 7 statuts simplifiés: brouillon, validee, presentee, negociation, mandat_signe, perdu, archive
 */
const LOCKED_STATUTS: EstimationStatus[] = [
  'mandat_signe',
  'archive'
];

/**
 * Hook pour gérer le verrouillage des estimations
 * Une estimation avec un statut "mandat_signe" ou "archivé" ne peut plus être modifiée par un courtier
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
    
    // Seul brouillon et validee peuvent être modifiés librement
    if (statut === 'brouillon' || statut === 'validee') return true;
    
    return false;
  }, [statut, isAdmin]);

  return { 
    isLocked, 
    lockMessage, 
    canChangeStatut 
  };
}

/**
 * Labels français pour les 7 statuts simplifiés
 */
function getStatutLabel(statut: EstimationStatus): string {
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

export { getStatutLabel };
