// ============================================
// GARY Stratégie - Logique Métier Complète
// Hook principal pour le calcul de la stratégie
// ============================================

import { useMemo } from 'react';
import { 
  Identification, 
  Caracteristiques, 
  AnalyseTerrain, 
  PreEstimation,
  StrategiePitch,
  PhaseDurees 
} from '@/types/estimation';
import { addWeeks, format, parseISO, differenceInWeeks, nextMonday, startOfMonth, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================
// Types
// ============================================

export interface CapitalVisibilite {
  pourcentage: number;
  label: 'intact' | 'entame' | 'faible';
  color: 'green' | 'yellow' | 'red';
  pauseRecalibrage: number; // semaines
  message: string;
}

export interface PhaseInfo {
  nom: string;
  icon: string;
  duree: number; // semaines
  description: string;
  objectif: string;
  canaux: string[];
  dateDebut: Date;
  dateFin: Date;
}

export interface AlerteCourtier {
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  actions?: string[];
}

export interface Canal {
  id: string;
  icon: string;
  label: string;
  desc: string;
  status: 'active' | 'reserve' | 'excluded';
  locked: boolean;
}

export interface PitchGenere {
  intro: string;
  descriptionBien: string;
  pointsAttention: string;
  recalibrage: string;
  strategie: string;
  timing: string;
  projetPostVente: string;
  crossSelling: string;
  closing: string;
  complet: string;
}

// ============================================
// Calcul Capital-Visibilité
// ============================================

export const getCapitalVisibilite = (identification: Identification | null): CapitalVisibilite => {
  if (!identification?.historique?.dejaDiffuse) {
    return { 
      pourcentage: 100, 
      label: 'intact', 
      color: 'green', 
      pauseRecalibrage: 0,
      message: "Le bien n'a jamais été diffusé — Capital-visibilité intact."
    };
  }
  
  const duree = identification.historique.duree;
  const typeDiffusion = identification.historique.typeDiffusion;
  
  const mapping: Record<string, { pct: number; pause: number }> = {
    'moins1mois': { pct: 85, pause: 1 },
    '1-3mois': { pct: 70, pause: 2 },
    '3-6mois': { pct: 50, pause: 3 },
    '6-12mois': { pct: 30, pause: 4 },
    'plus12mois': { pct: 30, pause: 5 }
  };
  
  let data = mapping[duree] || { pct: 100, pause: 0 };
  
  // Ajustement selon type de diffusion
  if (typeDiffusion === 'massive') {
    data = { pct: Math.max(20, data.pct - 15), pause: data.pause + 1 };
  } else if (typeDiffusion === 'discrete') {
    data = { pct: Math.min(100, data.pct + 10), pause: Math.max(0, data.pause - 1) };
  }
  
  let label: 'intact' | 'entame' | 'faible' = 'intact';
  let color: 'green' | 'yellow' | 'red' = 'green';
  let message = '';
  
  if (data.pct >= 70) {
    label = 'intact';
    color = 'green';
    message = "Capital-visibilité préservé — diffusion standard possible.";
  } else if (data.pct >= 40) {
    label = 'entame';
    color = 'yellow';
    message = `Capital-visibilité entamé — pause recalibrage de ${data.pause} semaine(s) recommandée.`;
  } else {
    label = 'faible';
    color = 'red';
    message = `Capital-visibilité faible — pause recalibrage de ${data.pause} semaine(s) obligatoire + repositionnement prix.`;
  }
  
  return {
    pourcentage: data.pct,
    label,
    color,
    pauseRecalibrage: data.pause,
    message
  };
};

// ============================================
// Calcul Niveau de Contrainte
// ============================================

export const getNiveauContrainte = (projetPostVente: Identification['projetPostVente'] | null): number => {
  if (!projetPostVente || projetPostVente.nature !== 'achat') return 0;
  
  const mapping: Record<string, number> = {
    'pas_commence': 0,
    'recherche': 1,          // Contrainte FAIBLE
    'bien_identifie': 2,     // Contrainte MOYENNE
    'offre_deposee': 3,      // Contrainte ÉLEVÉE
    'compromis_signe': 4,    // Contrainte FORTE
    'acte_programme': 5      // Contrainte CRITIQUE
  };
  
  return mapping[projetPostVente.avancement] || 0;
};

export const getContrainteLabel = (niveau: number): string => {
  const labels: Record<number, string> = {
    0: 'Aucune contrainte',
    1: 'Contrainte faible',
    2: 'Contrainte moyenne',
    3: 'Contrainte élevée',
    4: 'Contrainte forte',
    5: 'Contrainte critique'
  };
  return labels[niveau] || 'Aucune contrainte';
};

// ============================================
// Ajustement des Phases
// ============================================

interface AjustementPhases {
  phase0: number;
  phase1: number;
  phase2: number;
  phase3: number;
  recommandation: string;
  alerteCourtier: AlerteCourtier | null;
  alertesSupplementaires: AlerteCourtier[];
}

export const getAjustementPhases = (
  niveauContrainte: number,
  tolerances: { venteLongue: boolean; venteRapide: boolean },
  flexibilite: string,
  capitalVisibilite: CapitalVisibilite,
  identification: Identification | null
): AjustementPhases => {
  const ajustement: AjustementPhases = {
    phase0: 0,
    phase1: 0,
    phase2: 0,
    phase3: 0,
    recommandation: '',
    alerteCourtier: null,
    alertesSupplementaires: []
  };

  // ================================================
  // ALERTE 1: Capital-visibilité critique
  // ================================================
  if (capitalVisibilite.label === 'faible') {
    ajustement.alerteCourtier = {
      type: 'critical',
      title: '🔴 Capital-visibilité critique',
      message: `Le bien a été surexposé. Une pause de ${capitalVisibilite.pauseRecalibrage} semaine(s) est intégrée + repositionnement prix nécessaire.`,
      actions: ['Proposer baisse de prix', 'Rafraîchir visuels', 'Attendre avant diffusion']
    };
  }

  // ================================================
  // ALERTE 2: Historique échec diffusion (3+ mois)
  // ================================================
  const historique = identification?.historique;
  if (historique?.dejaDiffuse && 
      ['3-6mois', '6-12mois', 'plus12mois'].includes(historique.duree)) {
    ajustement.alertesSupplementaires.push({
      type: 'warning',
      title: '⚠️ Historique diffusion défavorable',
      message: `Bien déjà diffusé ${historique.duree.replace('-', ' à ')} — acheteurs actifs l'ont probablement vu.`,
      actions: [
        'Renouveler les visuels (photos, vidéo)',
        'Repositionner le prix si nécessaire',
        'Nouvelle approche marketing'
      ]
    });
  }

  // ================================================
  // ALERTE 3: Projet achat en cours SANS coordination
  // ================================================
  const projetPostVente = identification?.projetPostVente;
  if (projetPostVente?.nature === 'achat' && 
      projetPostVente.avancement !== 'pas_commence' &&
      projetPostVente.niveauCoordination === 'vente_seule') {
    ajustement.alertesSupplementaires.push({
      type: 'warning',
      title: '🟠 Coordination non souhaitée',
      message: 'Le vendeur a un projet achat mais ne souhaite pas notre accompagnement côté achat.',
      actions: [
        'Rester disponible pour coordonner si besoin',
        'S\'assurer que le timing est réaliste'
      ]
    });
  }

  // ================================================
  // ALERTE 4: Timing serré (vente + achat < 3 mois)
  // ================================================
  if (projetPostVente?.nature === 'achat' && 
      projetPostVente.dateCible) {
    const dateCible = new Date(projetPostVente.dateCible);
    const maintenant = new Date();
    const moisRestants = (dateCible.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (moisRestants < 3 && moisRestants > 0) {
      ajustement.alertesSupplementaires.push({
        type: 'critical',
        title: '⚡ Timing très serré',
        message: `Moins de ${Math.ceil(moisRestants)} mois pour vendre ET acheter — risque de stress élevé.`,
        actions: [
          'Valider si le vendeur accepte une solution transitoire',
          'Envisager pont bancaire si non vendu à temps',
          'Accélérer la stratégie de diffusion'
        ]
      });
    }
  }

  // ================================================
  // ALERTE 5: Pas de tolérance au décalage + contrainte forte
  // ================================================
  if (projetPostVente?.accepteDecalage === 'non' && niveauContrainte >= 3) {
    ajustement.alertesSupplementaires.push({
      type: 'critical',
      title: '🔴 Aucune flexibilité',
      message: 'Le vendeur ne peut pas décaler son projet achat — pression maximum sur la vente.',
      actions: [
        'S\'assurer que le prix est réaliste',
        'Prévoir plan B (location transitoire, famille)',
        'Communiquer les risques clairement'
      ]
    });
  }

  // ================================================
  // ALERTE 6: Confidentialité demandée mais bien déjà exposé
  // ================================================
  if (identification?.contexte?.confidentialite === 'confidentielle' && 
      historique?.dejaDiffuse && 
      historique.typeDiffusion !== 'discrete') {
    ajustement.alertesSupplementaires.push({
      type: 'info',
      title: 'ℹ️ Confidentialité tardive',
      message: 'Le vendeur souhaite une diffusion confidentielle mais le bien a déjà été exposé publiquement.',
      actions: [
        'Expliquer les limites de la confidentialité',
        'Suggérer off-market avec nouveau positionnement'
      ]
    });
  }

  // ================================================
  // ALERTE 7: Prix attendu irréaliste (si renseigné)
  // ================================================
  // Note: Cette alerte devrait être calculée ailleurs avec les données de preEstimation

  // ================================================
  // AJUSTEMENTS PHASES selon contrainte
  // ================================================
  if (niveauContrainte >= 4 && !ajustement.alerteCourtier) {
    // Contrainte FORTE ou CRITIQUE
    if (flexibilite === 'faible') {
      ajustement.phase1 = -2;
      ajustement.phase2 = -1;
      ajustement.recommandation = 'Timeline serrée — phases raccourcies automatiquement';
      ajustement.alerteCourtier = {
        type: 'critical',
        title: '⚠️ Calendrier sous tension',
        message: niveauContrainte === 5 
          ? 'Acte programmé côté achat — vente impérative avant date butoir.'
          : 'Compromis signé côté achat — coordination étroite requise.',
        actions: ['Prioriser visites', 'Anticiper négociations', 'Préparer plan B']
      };
    } else {
      ajustement.phase1 = -1;
      ajustement.recommandation = 'Phases raccourcies conseillées';
      if (!ajustement.alerteCourtier) {
        ajustement.alerteCourtier = {
          type: 'warning',
          title: '🟡 Contrainte élevée',
          message: 'Projet achat avancé — rester vigilant sur le timing.',
          actions: ['Suivre l\'avancement achat', 'Préparer accélération si besoin']
        };
      }
    }
  } else if (niveauContrainte === 3) {
    if (tolerances.venteRapide) {
      ajustement.phase1 = -1;
      ajustement.recommandation = 'Accélération possible si besoin';
    }
    if (!ajustement.alerteCourtier) {
      ajustement.alerteCourtier = {
        type: 'warning',
        title: '🟡 Offre déposée côté achat',
        message: 'L\'offre peut être acceptée à tout moment — rester agile.',
        actions: ['Suivre négociation achat', 'Préparer diffusion accélérée']
      };
    }
  } else if (niveauContrainte === 2) {
    if (!ajustement.alerteCourtier) {
      ajustement.alerteCourtier = {
        type: 'info',
        title: 'ℹ️ Bien identifié côté achat',
        message: 'Le vendeur a un bien en vue — surveiller l\'évolution.',
        actions: ['Proposer coordination GARY']
      };
    }
  } else if (niveauContrainte === 1) {
    if (tolerances.venteLongue) {
      ajustement.phase1 = 1;
      ajustement.recommandation = 'Off-market prolongé conseillé — plus de temps pour le meilleur prix';
    }
  } else if (niveauContrainte === 0 && tolerances.venteLongue && !ajustement.alerteCourtier) {
    ajustement.phase1 = 2;
    ajustement.recommandation = 'Aucune contrainte — phase off-market étendue pour maximiser le prix';
    ajustement.alerteCourtier = {
      type: 'success',
      title: '✅ Contexte favorable',
      message: 'Pas de contrainte temporelle — nous pouvons prendre le temps de bien faire.',
      actions: ['Maximiser la préparation', 'Viser le prix optimal']
    };
  }

  return ajustement;
};

// ============================================
// Calcul Automatique des Phases depuis date idéale
// ============================================

interface PhasesCalculees {
  phase0: number;
  phase1: number;
  phase2: number;
  phase3: number;
  isUrgent: boolean;
  message: string;
}

export const calculerPhasesDepuisDateIdeale = (
  dateDebut: string,
  dateVenteIdeale: string,
  pauseRecalibrage: number
): PhasesCalculees => {
  if (!dateDebut || !dateVenteIdeale) {
    return {
      phase0: 1 + pauseRecalibrage,
      phase1: 3,
      phase2: 2,
      phase3: 10,
      isUrgent: false,
      message: 'Durées par défaut'
    };
  }
  
  const debut = parseISO(dateDebut);
  const venteIdeale = startOfMonth(parseISO(dateVenteIdeale + '-01'));
  const semainesDisponibles = differenceInWeeks(venteIdeale, debut);
  
  const MIN_PHASE0 = 1;
  const MIN_PHASE1 = 1;
  const MIN_PHASE2 = 1;
  const MIN_PHASE3 = 4;
  const MAX_PHASE1 = 26; // 6 mois max
  
  let phase0 = MIN_PHASE0 + pauseRecalibrage;
  const disponibleApresPrepa = Math.max(6, semainesDisponibles - phase0);
  
  let phase1: number, phase2: number, phase3: number;
  let message: string;
  let isUrgent = false;
  
  if (disponibleApresPrepa < 8) {
    // TRÈS URGENT (< 2 mois)
    phase1 = MIN_PHASE1;
    phase2 = MIN_PHASE2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
    message = '⚡ Timeline très serrée — diffusion accélérée';
    isUrgent = true;
  } else if (disponibleApresPrepa <= 12) {
    // COURT (2-3 mois)
    phase1 = 2;
    phase2 = 2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
    message = '⏱️ Timeline courte — phases condensées';
  } else if (disponibleApresPrepa <= 20) {
    // MOYEN (3-5 mois)
    phase1 = Math.min(6, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 2) * 0.4));
    phase2 = 2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
    message = '✓ Timeline équilibrée';
  } else if (disponibleApresPrepa <= 30) {
    // LONG (5-7 mois)
    phase1 = Math.min(12, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 3) * 0.5));
    phase2 = 3;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
    message = '🎯 Timeline confortable — off-market étendu';
  } else {
    // TRÈS LONG (> 7 mois)
    phase1 = MAX_PHASE1;
    phase2 = 4;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
    message = '🏆 Timeline longue — maximum d\'opportunités off-market';
  }
  
  return {
    phase0: Math.max(MIN_PHASE0, phase0),
    phase1: Math.max(MIN_PHASE1, Math.min(MAX_PHASE1, phase1)),
    phase2: Math.max(MIN_PHASE2, phase2),
    phase3: Math.max(MIN_PHASE3, phase3),
    isUrgent,
    message
  };
};

// ============================================
// Calcul des Dates des Phases selon typeMiseEnVente
// ============================================

interface PhaseConfig {
  nom: string;
  icon: string;
  description: string;
  objectif: string;
  canaux: string[];
}

const getPhaseConfigs = (typeMiseEnVente: 'offmarket' | 'comingsoon' | 'public'): PhaseConfig[] => {
  // Phase 0 est toujours la même
  const phase0: PhaseConfig = {
    nom: 'Préparation',
    icon: '🎬',
    description: 'Photos, vidéo, rédaction annonce',
    objectif: 'Préparer tous les supports de communication',
    canaux: []
  };

  switch (typeMiseEnVente) {
    case 'offmarket':
      return [
        phase0,
        {
          nom: 'Off-Market',
          icon: '🔒',
          description: 'Diffusion confidentielle réseau qualifié',
          objectif: 'Tester le prix et générer des offres premium',
          canaux: ['Base acheteurs GARY', 'Réseau courtiers partenaires']
        },
        {
          nom: 'Off-Market +',
          icon: '🤝',
          description: 'Extension réseau élargi si nécessaire',
          objectif: 'Maintenir la confidentialité avec plus de reach',
          canaux: ['Partenaires privilégiés', 'Clients VIP']
        },
        {
          nom: 'Public (si besoin)',
          icon: '🌐',
          description: 'Ouverture portails uniquement si pas de vente',
          objectif: 'Maximiser l\'exposition en dernier recours',
          canaux: ['Immoscout', 'Homegate', 'Site GARY']
        }
      ];

    case 'comingsoon':
      return [
        phase0,
        {
          nom: 'Teasing',
          icon: '⏳',
          description: 'Annonce imminente, création de l\'attente',
          objectif: 'Construire l\'intérêt avant mise en ligne',
          canaux: ['Réseaux sociaux GARY', 'Newsletter', 'Vitrine agence']
        },
        {
          nom: 'Coming Soon',
          icon: '🚀',
          description: 'Prise de rendez-vous avant publication',
          objectif: 'Qualifier les acheteurs sérieux',
          canaux: ['Base acheteurs GARY', 'Réseaux sociaux']
        },
        {
          nom: 'Public',
          icon: '🌐',
          description: 'Visibilité maximale sur tous les portails',
          objectif: 'Maximiser l\'exposition',
          canaux: ['Immoscout', 'Homegate', 'Acheter-Louer', 'Site GARY']
        }
      ];

    case 'public':
    default:
      return [
        phase0,
        {
          nom: 'Soft Launch',
          icon: '📢',
          description: 'Mise en ligne ciblée',
          objectif: 'Test de réception du marché',
          canaux: ['Site GARY', 'Base acheteurs']
        },
        {
          nom: 'Full Launch',
          icon: '🚀',
          description: 'Diffusion large sur tous les canaux',
          objectif: 'Maximiser la visibilité immédiatement',
          canaux: ['Immoscout', 'Homegate', 'Acheter-Louer', 'Réseaux sociaux']
        },
        {
          nom: 'Boost',
          icon: '⚡',
          description: 'Relances et actions supplémentaires',
          objectif: 'Maintenir l\'intérêt et finaliser la vente',
          canaux: ['Publicités ciblées', 'Relances base acheteurs']
        }
      ];
  }
};

export const calculerDatesPhases = (
  dateDebut: string,
  phaseDurees: PhaseDurees,
  typeMiseEnVente: 'offmarket' | 'comingsoon' | 'public' = 'public'
): PhaseInfo[] => {
  if (!dateDebut) return [];
  
  let currentDate = parseISO(dateDebut);
  // Toujours démarrer un lundi
  currentDate = nextMonday(currentDate);
  
  const phaseConfigs = getPhaseConfigs(typeMiseEnVente);
  const durees = [phaseDurees.phase0, phaseDurees.phase1, phaseDurees.phase2, phaseDurees.phase3];
  
  const phases: PhaseInfo[] = [];
  
  for (let i = 0; i < phaseConfigs.length; i++) {
    const config = phaseConfigs[i];
    const duree = durees[i] || 1;
    const phaseEnd = addWeeks(currentDate, duree);
    
    phases.push({
      ...config,
      duree,
      dateDebut: currentDate,
      dateFin: phaseEnd
    });
    
    currentDate = phaseEnd;
  }
  
  return phases;
};

// ============================================
// Canaux de Diffusion
// ============================================

export const getCanaux = (
  typeMiseEnVente: 'offmarket' | 'comingsoon' | 'public',
  isMaison: boolean
): Canal[] => {
  const wantsDiscreet = typeMiseEnVente === 'offmarket';
  
  return [
    { 
      id: 'reseau', 
      icon: '🤝', 
      label: 'Réseau privé GARY', 
      desc: 'Acheteurs qualifiés',
      status: 'active',
      locked: true
    },
    { 
      id: 'photo', 
      icon: '📸', 
      label: 'Photo narrative', 
      desc: 'Images qui racontent',
      status: 'active',
      locked: true
    },
    { 
      id: 'video', 
      icon: '🎬', 
      label: 'Vidéo', 
      desc: isMaison ? 'Valorisation volumes' : 'Teaser ou visite',
      status: wantsDiscreet ? 'reserve' : 'active',
      locked: false
    },
    { 
      id: 'reseaux', 
      icon: '📱', 
      label: 'Réseaux sociaux', 
      desc: 'Diffusion ciblée',
      status: wantsDiscreet ? 'excluded' : 'reserve',
      locked: false
    },
    { 
      id: 'portails', 
      icon: '🌐', 
      label: 'Portails immobiliers', 
      desc: 'Visibilité large',
      status: wantsDiscreet ? 'excluded' : 'reserve',
      locked: false
    },
    { 
      id: 'local', 
      icon: '✉️', 
      label: 'Approche locale', 
      desc: 'Lettres ciblées',
      status: (isMaison || wantsDiscreet) ? 'active' : 'reserve',
      locked: false
    }
  ];
};

// ============================================
// Actions Phase 0
// ============================================

export interface ActionPhase0 {
  id: string;
  label: string;
  checked: boolean;
  isDefault: boolean;
}

export const getActionsPhase0 = (isMaison: boolean, hasLuxe: boolean): ActionPhase0[] => {
  const actions: ActionPhase0[] = [
    // Actions OBLIGATOIRES dans l'ordre
    { id: 'fixation_prix', label: 'Fixation du prix de mise en vente', checked: false, isDefault: true },
    { id: 'mandat', label: 'Signature du mandat', checked: false, isDefault: true },
    { id: 'photos', label: 'Photos professionnelles', checked: false, isDefault: true },
    { id: 'plans', label: 'Plans 2D/3D', checked: false, isDefault: true },
    { id: 'dossier', label: 'Préparation dossier technique', checked: false, isDefault: true },
    { id: 'redaction', label: 'Rédaction annonce', checked: false, isDefault: true },
    { id: 'visite360', label: 'Visite virtuelle 360°', checked: false, isDefault: true }
  ];
  
  if (isMaison) {
    actions.push({ id: 'drone', label: 'Drone / Vue aérienne', checked: false, isDefault: true });
  }
  
  if (hasLuxe) {
    actions.push({ id: 'homestaging', label: 'Home staging virtuel', checked: false, isDefault: true });
    actions.push({ id: 'brochure', label: 'Brochure luxe', checked: false, isDefault: true });
  }
  
  return actions;
};

// ============================================
// Génération du Pitch Complet (Logique GARY)
// ============================================

// Table de reformulation intelligente des points faibles
const REFORMULATIONS_POINTS_FAIBLES: Record<string, string> = {
  // Travaux / Rénovation
  "travaux": "le potentiel de personnalisation est un atout pour les acheteurs qui souhaitent créer leur propre espace",
  "rénover": "le potentiel de personnalisation est un atout pour les acheteurs qui souhaitent créer leur propre espace",
  "vétuste": "le potentiel de personnalisation est un atout pour les acheteurs qui souhaitent créer leur propre espace",
  "ancien": "le charme de l'ancien se marie parfaitement avec un projet de rénovation personnalisée",
  
  // Vue / Vis-à-vis
  "vis-à-vis": "nous mettrons en valeur les autres orientations et l'intimité du logement",
  "vue": "nous mettrons en valeur l'environnement immédiat et le potentiel d'aménagement",
  "sans vue": "nous valoriserons le calme et l'intimité qu'offre cette configuration",
  
  // Charges
  "charges": "les charges reflètent des prestations de qualité et un entretien régulier de l'immeuble",
  "ppf": "le fonds de rénovation bien géré témoigne d'une copropriété sérieuse",
  
  // Bruit / Nuisances
  "bruit": "nous ciblerons les profils adaptés au dynamisme du quartier",
  "nuisance": "nous ciblerons les profils adaptés au dynamisme du quartier",
  "sonore": "nous ciblerons les profils adaptés au dynamisme du quartier",
  "train": "la proximité des transports est un atout pour de nombreux acheteurs actifs",
  "route": "l'accessibilité en voiture est un vrai plus pour les familles motorisées",
  
  // Parking
  "parking": "nous mettrons en avant les transports à proximité et les solutions de stationnement alternatives",
  "place": "nous mettrons en avant les transports à proximité et les possibilités de location de places",
  "garage": "nous mettrons en avant les solutions de stationnement à proximité",
  
  // Ascenseur
  "ascenseur": "l'absence d'ascenseur attire les acheteurs sportifs et réduit les charges",
  
  // Luminosité
  "sombre": "nous optimiserons la mise en valeur photographique et proposerons des solutions de home staging",
  "luminosité": "nous optimiserons la mise en valeur photographique avec un éclairage professionnel",
  "orienté nord": "la fraîcheur en été est un avantage apprécié des acquéreurs sensibles à la chaleur",
  
  // Cuisine / SDB
  "cuisine": "le potentiel de rénovation permet aux acheteurs de personnaliser selon leurs goûts",
  "sdb": "le potentiel de rénovation permet aux acheteurs de personnaliser selon leurs goûts",
  "salle de bain": "le potentiel de rénovation permet aux acheteurs de créer leur espace bien-être",
  
  // Autres
  "petit": "la surface optimisée permet des charges réduites et un entretien facilité",
  "étroit": "nous mettrons en valeur l'optimisation de l'espace",
  "rez-de-chaussée": "l'accès de plain-pied est un atout pour les familles et personnes à mobilité réduite",
  "sous-sol": "cet espace complémentaire offre de nombreuses possibilités d'aménagement"
};

const reformulerPointFaible = (point: string): string => {
  const lower = point.toLowerCase();
  
  // Chercher une correspondance dans la table
  for (const [key, value] of Object.entries(REFORMULATIONS_POINTS_FAIBLES)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  
  return "nous saurons le présenter avec transparence tout en mettant l'accent sur les atouts du bien";
};

// ============================================
// FORMULATIONS PROTECTRICES (effet visible / cause invisible)
// JAMAIS exposer les contraintes d'achat au vendeur
// ============================================

interface FormulationProtectrice {
  phraseTimeline: string;    // Pour parler de la stratégie temporelle
  phraseCoordination: string; // Pour parler de la coordination sans exposer
  phraseUrgence: string;      // Si urgence sans mentionner l'achat
}

const getFormulationsProtectrices = (niveauContrainte: number): FormulationProtectrice => {
  switch (niveauContrainte) {
    case 5: // Acte programmé - CRITIQUE
      return {
        phraseTimeline: "Notre stratégie intègre votre calendrier personnel avec une timeline optimisée.",
        phraseCoordination: "Nous synchronisons parfaitement les deux volets de votre projet immobilier.",
        phraseUrgence: "Nous avons une fenêtre d'action claire qui nous permet de concentrer nos efforts."
      };
    case 4: // Compromis signé - FORTE
      return {
        phraseTimeline: "Votre planning nous guide pour calibrer précisément notre approche.",
        phraseCoordination: "La coordination de vos projets est notre priorité absolue.",
        phraseUrgence: "Nous adaptons le rythme à vos contraintes de calendrier."
      };
    case 3: // Offre déposée - ÉLEVÉE
      return {
        phraseTimeline: "Nous restons agiles pour nous adapter à l'évolution de votre situation.",
        phraseCoordination: "Notre flexibilité nous permet d'accélérer si votre situation l'exige.",
        phraseUrgence: "Nous sommes prêts à intensifier les actions si nécessaire."
      };
    case 2: // Bien identifié - MOYENNE
      return {
        phraseTimeline: "Notre approche s'adapte naturellement à l'évolution de vos projets.",
        phraseCoordination: "Nous surveillons les opportunités pour vous faire gagner du temps.",
        phraseUrgence: ""
      };
    case 1: // Recherche - FAIBLE
      return {
        phraseTimeline: "Nous avons le temps de bien faire les choses ensemble.",
        phraseCoordination: "Si vous le souhaitez, nous pouvons également vous accompagner dans vos recherches.",
        phraseUrgence: ""
      };
    default: // Aucune contrainte
      return {
        phraseTimeline: "Nous avons tout le temps nécessaire pour optimiser cette vente.",
        phraseCoordination: "",
        phraseUrgence: ""
      };
  }
};

// ============================================
// Vocabulaire Ultra-Luxe (>5M CHF)
// ============================================

const transformerVocabulaireLuxe = (texte: string, isLuxe: boolean): string => {
  if (!isLuxe) return texte;
  
  const replacements: Record<string, string> = {
    'appartement': 'propriété',
    'maison': 'propriété d\'exception',
    'bien': 'propriété',
    'salon': 'réception',
    'chambre': 'suite',
    'salle de bain': 'salle d\'eau',
    'cuisine': 'espace culinaire',
    'équipements': 'prestations',
    'finitions': 'finitions haut de gamme',
    'rénové': 'entièrement rénové avec des matériaux nobles',
    'neuf': 'neuf avec des prestations premium'
  };
  
  let result = texte;
  for (const [from, to] of Object.entries(replacements)) {
    result = result.replace(new RegExp(from, 'gi'), to);
  }
  return result;
};

export const generatePitch = (
  identification: Identification | null,
  caracteristiques: Caracteristiques | null,
  analyseTerrain: AnalyseTerrain | null,
  preEstimation: PreEstimation | null,
  dateDebutFormate: string,
  phases: PhaseInfo[],
  luxMode?: { isLux: boolean; score: number }
): PitchGenere => {
  // Utiliser le prénom en priorité, sinon le nom, sinon fallback
  const vendeurPrenom = identification?.vendeur?.prenom || identification?.vendeur?.nom?.split(' ')[0] || "";
  const vendeurNom = identification?.vendeur?.nom || "";
  // Formule d'appel : prénom si dispo, sinon "Monsieur/Madame [Nom]"
  const appelVendeur = vendeurPrenom || (vendeurNom ? `${vendeurNom}` : "Monsieur, Madame");
  const motifVente = identification?.contexte?.motifVente;
  const priorite = identification?.contexte?.prioriteVendeur;
  const horizon = identification?.contexte?.horizon;
  const isLuxe = luxMode?.isLux || false;
  const typeBienBase = caracteristiques?.typeBien === 'appartement' ? "appartement" : "maison";
  const typeBien = isLuxe ? (typeBienBase === 'appartement' ? 'propriété' : 'propriété d\'exception') : typeBienBase;
  const pointsForts = analyseTerrain?.pointsForts || [];
  const pointsFaibles = analyseTerrain?.pointsFaibles || [];
  const prixEntre = preEstimation?.prixEntre || '';
  const prixEt = preEstimation?.prixEt || '';
  const projetPostVente = identification?.projetPostVente;
  const capitalVis = getCapitalVisibilite(identification);
  const niveauContrainte = getNiveauContrainte(projetPostVente || null);
  const formulations = getFormulationsProtectrices(niveauContrainte);
  
  // 1. ACCROCHE PERSONNALISÉE SELON MOTIF
  let intro = "";
  switch(motifVente) {
    case 'succession':
      intro = `${appelVendeur}, je comprends que cette période est particulière. Au-delà de la transaction, mon rôle est de vous accompagner sereinement dans cette transition, en prenant le temps qu'il faut.`;
      break;
    case 'separation':
    case 'divorce':
      intro = `${appelVendeur}, merci pour votre confiance dans ce contexte délicat. Je m'engage à garantir une vente efficace et discrète, où chacun trouve son compte.`;
      break;
    case 'mutation':
    case 'demenagement':
      intro = `${appelVendeur}, votre nouveau projet de vie mérite une vente bien orchestrée. Je m'engage à coordonner le timing pour que tout s'enchaîne naturellement.`;
      break;
    case 'retraite':
      intro = `${appelVendeur}, ce nouveau chapitre de votre vie mérite toute notre attention. Nous allons prendre le temps de bien faire les choses ensemble.`;
      break;
    case 'investissement':
      intro = `${appelVendeur}, en tant qu'investisseur, vous savez que le timing et le prix sont cruciaux. Notre approche data-driven va vous permettre d'optimiser cette transaction.`;
      break;
    case 'agrandissement':
      intro = `${appelVendeur}, votre famille s'agrandit et c'est une belle nouvelle. Nous allons organiser la vente pour qu'elle accompagne sereinement votre projet.`;
      break;
    case 'reduction':
      intro = `${appelVendeur}, vous souhaitez un espace plus adapté à vos besoins actuels. C'est une décision sage que nous allons concrétiser ensemble.`;
      break;
    case 'financier':
      intro = `${appelVendeur}, je comprends l'importance de cette vente. Mon objectif est de vous obtenir le meilleur résultat dans les délais souhaités.`;
      break;
    case 'travail':
      intro = `${appelVendeur}, un changement professionnel ouvre de nouvelles perspectives. Nous allons synchroniser cette vente avec votre évolution.`;
      break;
    default:
      intro = `${appelVendeur}, merci pour votre confiance. Je suis ravi de vous accompagner dans ce projet et de mettre mon expertise à votre service.`;
  }
  
  // 2. DESCRIPTION DU BIEN AVEC POINTS FORTS (TOP 3)
  let descriptionBien = `Votre ${typeBien} présente de réels atouts.`;
  if (pointsForts.length >= 3) {
    descriptionBien = `Votre ${typeBien} présente de réels atouts : ${pointsForts.slice(0, 3).join(', ')}.`;
  } else if (pointsForts.length > 0) {
    descriptionBien = `Votre ${typeBien} présente de réels atouts : ${pointsForts.join(', ')}.`;
  }
  descriptionBien = transformerVocabulaireLuxe(descriptionBien, isLuxe);
  
  // 3. POINTS D'ATTENTION (REFORMULATION INTELLIGENTE)
  let pointsAttention = "";
  if (pointsFaibles.length > 0) {
    const reformulations = pointsFaibles.slice(0, 2).map(p => reformulerPointFaible(p));
    if (reformulations.length === 1) {
      pointsAttention = `Concernant les points d'attention que vous avez mentionnés, ${reformulations[0]}.`;
    } else {
      pointsAttention = `Concernant les points d'attention, ${reformulations[0]}. De plus, ${reformulations[1]}.`;
    }
  }
  
  // 4. PHRASE DE RECALIBRAGE (si capital-visibilité entamé)
  let recalibrage = "";
  if (capitalVis.label === 'entame') {
    recalibrage = `Comme le bien a déjà été exposé, nous intégrons une phase de recalibrage de ${capitalVis.pauseRecalibrage} semaine(s) pour « rafraîchir » sa présence sur le marché. C'est une étape importante pour repartir sur de bonnes bases.`;
  } else if (capitalVis.label === 'faible') {
    recalibrage = `Le bien ayant été surexposé précédemment, nous prévoyons une pause de ${capitalVis.pauseRecalibrage} semaine(s) avant relancement. Cette période nous permet de repositionner l'offre et de recréer l'intérêt. Un ajustement de prix pourrait également être pertinent.`;
  }
  
  // 5. STRATÉGIE SELON PRIORITÉ + FORMULATION PROTECTRICE
  let strategie = "";
  switch(priorite) {
    case 'prixMax':
      strategie = "Votre priorité est d'obtenir le meilleur prix : nous positionnons le bien avec ambition et prenons le temps nécessaire pour trouver l'acheteur qui paiera sa juste valeur.";
      break;
    case 'rapidite':
      strategie = "Votre priorité est la rapidité : nous maximisons la visibilité dès le départ et activons tous nos réseaux pour accélérer la vente.";
      break;
    default:
      strategie = "Notre approche équilibrée vise le meilleur prix dans un délai raisonnable — c'est généralement ce qui convient le mieux.";
  }
  
  // Ajouter la formulation protectrice si contrainte
  if (niveauContrainte >= 2 && formulations.phraseTimeline) {
    strategie += ` ${formulations.phraseTimeline}`;
  }
  
  // 6. TIMING
  let timing = "";
  if (dateDebutFormate && phases.length > 0) {
    const dateFinEstimee = phases[phases.length - 1]?.dateFin;
    const moisFin = dateFinEstimee ? format(dateFinEstimee, 'MMMM yyyy', { locale: fr }) : '';
    timing = `Nous pouvons démarrer la commercialisation dès le ${dateDebutFormate}.`;
    if (moisFin) {
      timing += ` Avec notre méthodologie en ${phases.length} phases, nous visons une signature d'ici ${moisFin}.`;
    }
  }
  
  // Horizon temporel personnalisé
  if (horizon) {
    const horizonMap: Record<string, string> = {
      '1mois': 'Vous souhaitez vendre rapidement — nous adaptons notre stratégie en conséquence.',
      '3mois': 'Un horizon de 3 mois est réaliste et nous laisse le temps de bien faire.',
      '6mois': 'Avec 6 mois devant nous, nous pouvons viser le meilleur prix.',
      '12mois': 'Cet horizon confortable nous permet une approche premium.'
    };
    if (horizonMap[horizon]) {
      timing += ` ${horizonMap[horizon]}`;
    }
  }
  
  // 7. PROJET POST-VENTE (FORMULATION PROTECTRICE - JAMAIS exposer les contraintes)
  let projetPostVenteText = "";
  let crossSelling = "";
  
  if (projetPostVente?.nature === 'achat') {
    const coordination = projetPostVente.niveauCoordination;
    
    // Cross-selling discret
    if (coordination === 'achat_souhaite' || coordination === 'achat_envisageable') {
      crossSelling = "Notre équipe peut également vous accompagner dans vos recherches si vous le souhaitez. Cela nous permet de coordonner parfaitement les opérations.";
    }
    
    // FORMULATIONS PROTECTRICES selon niveau (jamais mentionner explicitement l'achat/l'urgence)
    if (niveauContrainte >= 4) {
      // Contrainte FORTE/CRITIQUE - Formulation très neutre
      projetPostVenteText = formulations.phraseCoordination;
      if (projetPostVente.accepteDecalage === 'non' && formulations.phraseUrgence) {
        projetPostVenteText += ` ${formulations.phraseUrgence}`;
      }
    } else if (niveauContrainte >= 2) {
      // Contrainte MOYENNE/ÉLEVÉE
      projetPostVenteText = "Nous coordonnons nos actions avec votre planning personnel pour un timing optimal.";
    } else if (niveauContrainte === 1) {
      // Recherche en cours - mention légère
      projetPostVenteText = "Si un projet se concrétise de votre côté, nous nous adapterons naturellement.";
    }
    // Contrainte 0 = pas de mention du tout
  } else if (projetPostVente?.nature === 'location') {
    projetPostVenteText = "Pour votre projet de location après la vente, notre équipe peut vous accompagner dans la recherche si vous le souhaitez.";
    crossSelling = "GARY Immobilier propose également un service de gestion locative.";
  }
  
  // 8. PRIX
  let prixInfo = "";
  if (prixEntre && prixEt) {
    const prixEntreFormate = parseInt(prixEntre).toLocaleString('fr-CH');
    const prixEtFormate = parseInt(prixEt).toLocaleString('fr-CH');
    if (isLuxe) {
      prixInfo = `Au vu du standing de cette propriété, je vous propose une estimation entre CHF ${prixEntreFormate} et CHF ${prixEtFormate}.`;
    } else {
      prixInfo = `Je vous propose une estimation entre CHF ${prixEntreFormate} et CHF ${prixEtFormate}.`;
    }
  }
  
  // 9. CLOSING
  let closing = "";
  if (isLuxe) {
    closing = `Les prochaines étapes sont les suivantes : je vous adresse le dossier complet sous 48h. Après votre validation, nous lançons la préparation premium — shooting photo par notre photographe spécialisé, vidéo narrative et supports de communication sur-mesure.

Avez-vous des questions ?`;
  } else {
    closing = `Les prochaines étapes sont simples : je vous envoie le récapitulatif complet par email dans les 48h. Dès votre validation, nous lançons les premières actions — photos professionnelles et préparation de l'annonce.

Y a-t-il des questions que vous aimeriez me poser ?`;
  }
  
  // ASSEMBLAGE FINAL
  const sections = [intro];
  
  if (descriptionBien) sections.push(descriptionBien);
  if (prixInfo) sections.push(prixInfo);
  if (pointsAttention) sections.push(pointsAttention);
  if (recalibrage) sections.push(recalibrage);
  if (strategie) sections.push(strategie);
  if (timing) sections.push(timing);
  if (projetPostVenteText) sections.push(projetPostVenteText);
  if (crossSelling) sections.push(crossSelling);
  sections.push(closing);
  
  const complet = sections.join('\n\n');
  
  return {
    intro,
    descriptionBien,
    pointsAttention,
    recalibrage,
    strategie,
    timing,
    projetPostVente: projetPostVenteText,
    crossSelling,
    closing,
    complet
  };
};

// ============================================
// Hook Principal
// ============================================

export const useStrategieLogic = (
  identification: Identification | null,
  caracteristiques: Caracteristiques | null,
  analyseTerrain: AnalyseTerrain | null,
  preEstimation: PreEstimation | null,
  strategiePitch: StrategiePitch | null
) => {
  const capitalVisibilite = useMemo(() => 
    getCapitalVisibilite(identification), 
    [identification]
  );
  
  const niveauContrainte = useMemo(() => 
    getNiveauContrainte(identification?.projetPostVente || null),
    [identification]
  );
  
  const contrainteLabel = useMemo(() => 
    getContrainteLabel(niveauContrainte),
    [niveauContrainte]
  );
  
  const ajustementPhases = useMemo(() => {
    const tolerances = {
      venteLongue: identification?.projetPostVente?.toleranceVenteLongue || false,
      venteRapide: identification?.projetPostVente?.toleranceVenteRapide || false
    };
    const flexibilite = identification?.projetPostVente?.flexibilite || 'moyenne';
    return getAjustementPhases(niveauContrainte, tolerances, flexibilite, capitalVisibilite, identification);
  }, [niveauContrainte, identification, capitalVisibilite]);
  
  const isMaison = caracteristiques?.typeBien === 'maison';
  const typeMiseEnVente = preEstimation?.typeMiseEnVente || 'public';
  
  const canaux = useMemo(() => 
    getCanaux(typeMiseEnVente, isMaison),
    [typeMiseEnVente, isMaison]
  );
  
  const actionsPhase0 = useMemo(() => {
    const hasLuxe = analyseTerrain?.impressionGenerale ? analyseTerrain.impressionGenerale >= 4 : false;
    return getActionsPhase0(isMaison, hasLuxe);
  }, [isMaison, analyseTerrain]);
  
  // Calcul des phases depuis date idéale si définie
  const phasesCalculees = useMemo(() => {
    const dateDebut = strategiePitch?.dateDebut || '';
    const dateVenteIdeale = strategiePitch?.dateVenteIdeale || '';
    
    if (dateVenteIdeale) {
      return calculerPhasesDepuisDateIdeale(dateDebut, dateVenteIdeale, capitalVisibilite.pauseRecalibrage);
    }
    
    // Sinon utiliser les durées manuelles/par défaut
    const basePhases = strategiePitch?.phaseDurees || {
      phase0: 1,
      phase1: 3,
      phase2: 2,
      phase3: 10
    };
    
    return {
      phase0: basePhases.phase0 + capitalVisibilite.pauseRecalibrage,
      phase1: Math.max(1, basePhases.phase1 + ajustementPhases.phase1),
      phase2: Math.max(1, basePhases.phase2 + ajustementPhases.phase2),
      phase3: Math.max(4, basePhases.phase3 + ajustementPhases.phase3),
      isUrgent: false,
      message: ''
    };
  }, [strategiePitch, capitalVisibilite, ajustementPhases]);
  
  const phaseDurees: PhaseDurees = useMemo(() => ({
    phase0: phasesCalculees.phase0,
    phase1: phasesCalculees.phase1,
    phase2: phasesCalculees.phase2,
    phase3: phasesCalculees.phase3
  }), [phasesCalculees]);
  
  const phases = useMemo(() => {
    const dateDebut = strategiePitch?.dateDebut || '';
    return calculerDatesPhases(dateDebut, phaseDurees, typeMiseEnVente);
  }, [strategiePitch?.dateDebut, phaseDurees, typeMiseEnVente]);
  
  const dateDebutFormate = useMemo(() => {
    if (phases.length > 0 && phases[0].dateDebut) {
      return format(phases[0].dateDebut, 'd MMMM yyyy', { locale: fr });
    }
    return '';
  }, [phases]);
  
  // Calcul du mode luxe
  const totalVenale = preEstimation?.prixEntre ? parseInt(preEstimation.prixEntre) : 0;
  const isLuxeMode = totalVenale > 5000000;
  const luxMode = { isLux: isLuxeMode, score: isLuxeMode ? 50 : 0 };
  
  const pitch = useMemo(() => 
    generatePitch(identification, caracteristiques, analyseTerrain, preEstimation, dateDebutFormate, phases, luxMode),
    [identification, caracteristiques, analyseTerrain, preEstimation, dateDebutFormate, phases, luxMode]
  );
  
  return {
    capitalVisibilite,
    niveauContrainte,
    contrainteLabel,
    ajustementPhases,
    canaux,
    actionsPhase0,
    phaseDurees,
    phasesCalculees,
    phases,
    pitch,
    isMaison,
    typeMiseEnVente,
    dateDebutFormate
  };
};
