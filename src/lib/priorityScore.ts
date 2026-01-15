import type { EstimationData, EstimationStatus } from '@/types/estimation';
import { calculateModuleCompletion } from './completionScore';

export interface PriorityScore {
  total: number;              // 0-100
  breakdown: {
    urgence: number;          // 0-30 pts
    montant: number;          // 0-25 pts
    anciennete: number;       // 0-20 pts
    completion: number;       // 0-15 pts
    engagement: number;       // 0-10 pts
  };
  level: 'critical' | 'high' | 'medium' | 'low';
}

export interface PriorityLevelConfig {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  icon: string;
}

export const PRIORITY_LEVELS: Record<PriorityScore['level'], PriorityLevelConfig> = {
  critical: {
    label: 'Critique',
    color: 'text-red-700',
    bgClass: 'bg-red-100',
    borderClass: 'border-red-300',
    icon: '🔴'
  },
  high: {
    label: 'Haute',
    color: 'text-orange-700',
    bgClass: 'bg-orange-100',
    borderClass: 'border-orange-300',
    icon: '🟠'
  },
  medium: {
    label: 'Moyenne',
    color: 'text-yellow-700',
    bgClass: 'bg-yellow-100',
    borderClass: 'border-yellow-300',
    icon: '🟡'
  },
  low: {
    label: 'Basse',
    color: 'text-green-700',
    bgClass: 'bg-green-100',
    borderClass: 'border-green-300',
    icon: '🟢'
  }
};

/**
 * Calcule le score d'urgence basé sur l'horizon de vente
 * Max: 30 points
 */
function calculateUrgenceScore(estimation: EstimationData): number {
  const horizon = estimation.identification?.contexte?.horizon;
  
  if (!horizon) return 0;
  
  switch (horizon) {
    case 'urgent_immediate':
    case 'urgent':
      return 30;
    case 'moins_1_mois':
    case '1_mois':
      return 25;
    case '1_3_mois':
    case 'court_terme':
      return 18;
    case '3_6_mois':
    case 'moyen_terme':
      return 10;
    case '6_12_mois':
    case 'long_terme':
      return 5;
    case 'plus_12_mois':
    case 'exploration':
    case 'indefini':
      return 2;
    default:
      return 0;
  }
}

/**
 * Calcule le score basé sur le montant estimé de la commission
 * Max: 25 points
 */
function calculateMontantScore(estimation: EstimationData): number {
  // Utilise le prix final ou le prix estimé
  const prix = estimation.prixFinal 
    || parseFloat(estimation.preEstimation?.prixRecommande || '0')
    || parseFloat(estimation.preEstimation?.prixEt || '0')
    || estimation.prixMax 
    || 0;
  
  // Commission hypothétique à 3%
  const commission = prix * 0.03;
  
  if (commission >= 50000) return 25;
  if (commission >= 30000) return 20;
  if (commission >= 20000) return 16;
  if (commission >= 15000) return 12;
  if (commission >= 10000) return 8;
  if (commission >= 5000) return 5;
  return 2;
}

/**
 * Calcule le score d'ancienneté - plus c'est vieux, plus c'est urgent
 * Max: 20 points
 */
function calculateAncienneteScore(estimation: EstimationData): number {
  const createdAt = estimation.createdAt;
  if (!createdAt) return 0;
  
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceCreation > 21) return 20;
  if (daysSinceCreation > 14) return 16;
  if (daysSinceCreation > 7) return 12;
  if (daysSinceCreation > 3) return 8;
  if (daysSinceCreation > 1) return 4;
  return 2;
}

/**
 * Calcule le score de complétion - dossiers complets = priorité
 * Max: 15 points
 */
function calculateCompletionScore(estimation: EstimationData): number {
  const completion = calculateModuleCompletion(estimation);
  return Math.round(completion.total * 0.15);
}

/**
 * Calcule le score d'engagement client basé sur le statut
 * Max: 10 points
 */
function calculateEngagementScore(estimation: EstimationData): number {
  const statut = estimation.statut as EstimationStatus;
  
  switch (statut) {
    case 'en_signature':
      return 10;
    case 'accord_oral':
      return 9;
    case 'negociation':
      return 7;
    case 'reflexion':
      return 5;
    case 'presentee':
      return 4;
    case 'a_presenter':
      return 3;
    case 'en_cours':
      return 2;
    case 'brouillon':
      return 1;
    default:
      return 0;
  }
}

/**
 * Calcule le score de priorité global
 */
export function calculatePriorityScore(estimation: EstimationData): PriorityScore {
  // Skip pour statuts terminaux
  const skipStatuts: EstimationStatus[] = ['mandat_signe', 'perdu', 'archive', 'termine'];
  if (skipStatuts.includes(estimation.statut as EstimationStatus)) {
    return {
      total: 0,
      breakdown: {
        urgence: 0,
        montant: 0,
        anciennete: 0,
        completion: 0,
        engagement: 0
      },
      level: 'low'
    };
  }
  
  const urgence = calculateUrgenceScore(estimation);
  const montant = calculateMontantScore(estimation);
  const anciennete = calculateAncienneteScore(estimation);
  const completion = calculateCompletionScore(estimation);
  const engagement = calculateEngagementScore(estimation);
  
  const total = urgence + montant + anciennete + completion + engagement;
  
  let level: PriorityScore['level'];
  if (total >= 80) level = 'critical';
  else if (total >= 60) level = 'high';
  else if (total >= 40) level = 'medium';
  else level = 'low';
  
  return {
    total,
    breakdown: { urgence, montant, anciennete, completion, engagement },
    level
  };
}

/**
 * Retourne la config visuelle pour un niveau de priorité
 */
export function getPriorityLevelConfig(level: PriorityScore['level']): PriorityLevelConfig {
  return PRIORITY_LEVELS[level];
}

/**
 * Retourne une description textuelle du breakdown
 */
export function getPriorityBreakdownDescription(breakdown: PriorityScore['breakdown']): string[] {
  const descriptions: string[] = [];
  
  if (breakdown.urgence >= 25) {
    descriptions.push('⏰ Échéance urgente');
  } else if (breakdown.urgence >= 15) {
    descriptions.push('📅 Échéance proche');
  }
  
  if (breakdown.montant >= 20) {
    descriptions.push('💰 Commission importante');
  } else if (breakdown.montant >= 10) {
    descriptions.push('💵 Commission moyenne');
  }
  
  if (breakdown.anciennete >= 16) {
    descriptions.push('⚠️ Dossier ancien');
  } else if (breakdown.anciennete >= 10) {
    descriptions.push('📋 En attente depuis +7j');
  }
  
  if (breakdown.completion >= 12) {
    descriptions.push('✅ Dossier quasi-complet');
  }
  
  if (breakdown.engagement >= 7) {
    descriptions.push('🤝 Client très engagé');
  } else if (breakdown.engagement >= 4) {
    descriptions.push('👤 Client en réflexion');
  }
  
  return descriptions;
}

/**
 * Trie les estimations par score de priorité décroissant
 */
export function sortByPriority(estimations: EstimationData[]): EstimationData[] {
  return [...estimations].sort((a, b) => {
    const scoreA = calculatePriorityScore(a).total;
    const scoreB = calculatePriorityScore(b).total;
    return scoreB - scoreA;
  });
}
