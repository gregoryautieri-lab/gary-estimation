// ============================================
// GARY - Calculs de Rentabilité Investisseurs
// ============================================

export interface RentabiliteInputs {
  prixAchat: number;           // Prix du bien
  loyerMensuel?: number;       // Loyer mensuel actuel
  valeurLocative?: number;     // ou Valeur locative estimée (annuelle)
  tauxCharges?: number;        // Taux de charges (défaut 15%)
  chargesAnnuelles?: number;   // Charges annuelles personnalisées
  apportPersonnel?: number;    // Si financement (défaut 25%)
  tauxHypotheque?: number;     // Taux d'intérêt hypothécaire
  montantHypotheque?: number;  // Montant emprunté
}

export interface RentabiliteResult {
  loyerAnnuelBrut: number;
  chargesAnnuelles: number;
  loyerAnnuelNet: number;
  rendementBrut: number;        // %
  rendementNet: number;         // %
  tauxCapitalisation: number;   // %
  valeurCapitalisee: number;
  cashOnCash?: number;          // % (si financement)
  cashflowAnnuel?: number;
  tauxHypoActuel: number;       // Taux hypothécaire de référence suisse
  differencePoints: number;     // Écart rendement vs hypo
  ratioCouvInteret?: number;    // Ratio de couverture des intérêts
}

export interface RentabiliteLevel {
  level: 'excellent' | 'bon' | 'moyen' | 'faible';
  color: string;
  bgColor: string;
  icon: string;
  message: string;
}

// Taux hypothécaire de référence suisse (BNS - mise à jour périodique)
const TAUX_HYPO_REFERENCE = 1.75;

/**
 * Calcule tous les indicateurs de rentabilité pour un investisseur
 */
export function calculateRentabilite(inputs: RentabiliteInputs): RentabiliteResult | null {
  if (!inputs.prixAchat || inputs.prixAchat <= 0) {
    return null;
  }

  // 1. Loyer annuel brut
  let loyerAnnuelBrut = 0;
  if (inputs.loyerMensuel && inputs.loyerMensuel > 0) {
    loyerAnnuelBrut = inputs.loyerMensuel * 12;
  } else if (inputs.valeurLocative && inputs.valeurLocative > 0) {
    loyerAnnuelBrut = inputs.valeurLocative;
  }

  if (loyerAnnuelBrut <= 0) {
    return null;
  }

  // 2. Charges annuelles
  const tauxCharges = inputs.tauxCharges ?? 15;
  const chargesAnnuelles = inputs.chargesAnnuelles || (loyerAnnuelBrut * (tauxCharges / 100));

  // 3. Loyer net annuel
  const loyerAnnuelNet = loyerAnnuelBrut - chargesAnnuelles;

  // 4. Rendement brut (loyer brut / prix d'achat)
  const rendementBrut = (loyerAnnuelBrut / inputs.prixAchat) * 100;

  // 5. Rendement net (loyer net / prix d'achat)
  const rendementNet = (loyerAnnuelNet / inputs.prixAchat) * 100;

  // 6. Taux de capitalisation
  const tauxCapitalisation = rendementNet;

  // 7. Valeur capitalisée
  const valeurCapitalisee = tauxCapitalisation > 0 
    ? loyerAnnuelNet / (tauxCapitalisation / 100) 
    : 0;

  // 8. Comparaison taux hypothécaire
  const tauxHypoActuel = TAUX_HYPO_REFERENCE;
  const differencePoints = rendementNet - tauxHypoActuel;

  // 9. Cash-on-cash return (si financement)
  let cashOnCash: number | undefined;
  let cashflowAnnuel: number | undefined;
  let ratioCouvInteret: number | undefined;

  if (inputs.montantHypotheque && inputs.montantHypotheque > 0 && inputs.tauxHypotheque && inputs.tauxHypotheque > 0) {
    const chargesHypoAnnuelles = inputs.montantHypotheque * (inputs.tauxHypotheque / 100);
    cashflowAnnuel = loyerAnnuelNet - chargesHypoAnnuelles;
    ratioCouvInteret = loyerAnnuelNet / chargesHypoAnnuelles;

    if (inputs.apportPersonnel && inputs.apportPersonnel > 0) {
      cashOnCash = (cashflowAnnuel / inputs.apportPersonnel) * 100;
    }
  }

  return {
    loyerAnnuelBrut,
    chargesAnnuelles,
    loyerAnnuelNet,
    rendementBrut,
    rendementNet,
    tauxCapitalisation,
    valeurCapitalisee,
    cashOnCash,
    cashflowAnnuel,
    tauxHypoActuel,
    differencePoints,
    ratioCouvInteret
  };
}

/**
 * Détermine le niveau de rentabilité basé sur le rendement net
 */
export function getRentabiliteLevel(rendementNet: number): RentabiliteLevel {
  if (rendementNet >= 5) {
    return {
      level: 'excellent',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: '🟢',
      message: 'Excellent rendement'
    };
  } else if (rendementNet >= 3) {
    return {
      level: 'bon',
      color: 'text-lime-600 dark:text-lime-400',
      bgColor: 'bg-lime-100 dark:bg-lime-900/30',
      icon: '🟡',
      message: 'Bon rendement'
    };
  } else if (rendementNet >= 2) {
    return {
      level: 'moyen',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      icon: '🟠',
      message: 'Rendement moyen'
    };
  } else {
    return {
      level: 'faible',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: '🔴',
      message: 'Rendement faible'
    };
  }
}

/**
 * Évalue l'écart avec le taux hypothécaire
 */
export function getSpreadLevel(differencePoints: number): {
  isPositive: boolean;
  message: string;
  color: string;
} {
  if (differencePoints >= 2) {
    return {
      isPositive: true,
      message: 'Excellent spread, investissement très attractif',
      color: 'text-green-600 dark:text-green-400'
    };
  } else if (differencePoints >= 1) {
    return {
      isPositive: true,
      message: 'Spread positif, investissement intéressant',
      color: 'text-lime-600 dark:text-lime-400'
    };
  } else if (differencePoints >= 0) {
    return {
      isPositive: true,
      message: 'Spread neutre, rendement équivalent au coût de financement',
      color: 'text-amber-600 dark:text-amber-400'
    };
  } else {
    return {
      isPositive: false,
      message: 'Spread négatif, coût de financement supérieur au rendement',
      color: 'text-red-600 dark:text-red-400'
    };
  }
}

/**
 * Formate un pourcentage pour affichage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}
