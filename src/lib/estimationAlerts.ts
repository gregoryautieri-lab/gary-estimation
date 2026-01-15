import type { EstimationData } from '@/types/estimation';

export interface EstimationAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    route: string | null;
  };
  icon?: string;
}

/**
 * Génère les alertes contextuelles pour une estimation
 */
export function generateEstimationAlerts(estimation: EstimationData | null): EstimationAlert[] {
  if (!estimation) return [];
  
  const alerts: EstimationAlert[] = [];
  
  // 1. Alerte projet achat incomplet
  const projetPostVente = estimation.identification?.projetPostVente;
  if (projetPostVente?.nature === 'achat') {
    const criteresAchat = projetPostVente.criteresAchat;
    const isIncomplete = !criteresAchat || 
      !criteresAchat.actif ||
      criteresAchat.zones.length === 0 ||
      criteresAchat.budgetMax === 0;
    
    if (isIncomplete) {
      alerts.push({
        id: 'criteres-achat',
        type: 'warning',
        title: 'Projet d\'achat incomplet',
        message: 'Le client cherche à acheter mais les critères détaillés ne sont pas renseignés',
        action: { label: 'Compléter', route: `/estimation/${estimation.id}/1` },
        icon: '🏠'
      });
    }
  }
  
  // 2. Alerte délai serré
  const horizon = estimation.identification?.contexte?.horizon;
  if (horizon === 'urgent') {
    alerts.push({
      id: 'delai-urgent',
      type: 'critical',
      title: 'Délai très serré',
      message: 'Client veut vendre en urgence (< 1 mois)',
      action: { label: 'Prioriser', route: null },
      icon: '⏰'
    });
  } else if (horizon === 'court') {
    alerts.push({
      id: 'delai-court',
      type: 'warning',
      title: 'Délai court',
      message: 'Client souhaite vendre dans 1-3 mois',
      action: null,
      icon: '📅'
    });
  }
  
  // 3. Alerte comparables manquants
  const comparablesVendus = estimation.preEstimation?.comparablesVendus || [];
  if (comparablesVendus.length === 0 && estimation.preEstimation?.prixEntre) {
    alerts.push({
      id: 'comparables-manquants',
      type: 'info',
      title: 'Comparables manquants',
      message: 'Aucun comparable vendu renseigné pour justifier le prix',
      action: { label: 'Ajouter', route: `/estimation/${estimation.id}/4` },
      icon: '📊'
    });
  }
  
  // 4. Alerte estimation ancienne
  const createdAt = estimation.createdAt ? new Date(estimation.createdAt) : null;
  if (createdAt && estimation.statut !== 'termine' && estimation.statut !== 'archive') {
    const daysSince = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) {
      alerts.push({
        id: 'estimation-ancienne',
        type: 'warning',
        title: `En attente depuis ${daysSince} jours`,
        message: 'Penser à relancer le vendeur ou archiver',
        action: null,
        icon: '📆'
      });
    } else if (daysSince > 7) {
      alerts.push({
        id: 'estimation-relance',
        type: 'info',
        title: `Créée il y a ${daysSince} jours`,
        message: 'Suivi régulier recommandé',
        action: null,
        icon: '📋'
      });
    }
  }
  
  // 5. Alerte photos manquantes
  const photosCount = estimation.photos?.items?.length || 0;
  if (photosCount === 0 && estimation.caracteristiques?.typeBien) {
    alerts.push({
      id: 'photos-manquantes',
      type: 'info',
      title: 'Aucune photo',
      message: 'Les photos sont importantes pour l\'estimation',
      action: { label: 'Ajouter', route: `/estimation/${estimation.id}/photos` },
      icon: '📸'
    });
  }
  
  // 6. Alerte confidentialité
  if (estimation.identification?.contexte?.confidentialite === 'confidentielle') {
    alerts.push({
      id: 'confidentialite',
      type: 'info',
      title: 'Estimation confidentielle',
      message: 'Diffusion réseau uniquement, pas de portails',
      action: null,
      icon: '🔒'
    });
  }
  
  // 7. Alerte type de bien non défini
  if (!estimation.caracteristiques?.typeBien) {
    alerts.push({
      id: 'type-bien-manquant',
      type: 'warning',
      title: 'Type de bien non défini',
      message: 'Définir le type (appartement/maison) pour continuer',
      action: { label: 'Définir', route: `/estimation/${estimation.id}/2` },
      icon: '🏢'
    });
  }
  
  // 8. Alerte prix non défini
  const prixMin = parseFloat(estimation.preEstimation?.prixEntre || '0');
  const prixMax = parseFloat(estimation.preEstimation?.prixEt || '0');
  if (prixMin === 0 && prixMax === 0 && estimation.caracteristiques?.typeBien) {
    alerts.push({
      id: 'prix-manquant',
      type: 'warning',
      title: 'Prix non estimé',
      message: 'La fourchette de prix n\'est pas encore définie',
      action: { label: 'Estimer', route: `/estimation/${estimation.id}/4` },
      icon: '💰'
    });
  }
  
  // Trier par priorité (critical > warning > info)
  const priority = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => priority[a.type] - priority[b.type]);
  
  return alerts;
}

/**
 * Compte les alertes par type
 */
export function countAlertsByType(alerts: EstimationAlert[]): { critical: number; warning: number; info: number } {
  return {
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length
  };
}