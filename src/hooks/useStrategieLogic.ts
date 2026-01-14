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
}

export const getAjustementPhases = (
  niveauContrainte: number,
  tolerances: { venteLongue: boolean; venteRapide: boolean },
  flexibilite: string,
  capitalVisibilite: CapitalVisibilite
): AjustementPhases => {
  const ajustement: AjustementPhases = {
    phase0: 0,
    phase1: 0,
    phase2: 0,
    phase3: 0,
    recommandation: '',
    alerteCourtier: null
  };

  // Alertes selon capital-visibilité
  if (capitalVisibilite.label === 'faible') {
    ajustement.alerteCourtier = {
      type: 'critical',
      title: '🔴 Capital-visibilité critique',
      message: `Le bien a été surexposé. Une pause de ${capitalVisibilite.pauseRecalibrage} semaine(s) est intégrée + repositionnement prix nécessaire.`,
      actions: ['Proposer baisse de prix', 'Rafraîchir visuels', 'Attendre avant diffusion']
    };
    return ajustement;
  }

  if (niveauContrainte >= 4) {
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
      ajustement.alerteCourtier = {
        type: 'warning',
        title: '🟡 Contrainte élevée',
        message: 'Projet achat avancé — rester vigilant sur le timing.',
        actions: ['Suivre l\'avancement achat', 'Préparer accélération si besoin']
      };
    }
  } else if (niveauContrainte === 3) {
    if (tolerances.venteRapide) {
      ajustement.phase1 = -1;
      ajustement.recommandation = 'Accélération possible si besoin';
    }
    ajustement.alerteCourtier = {
      type: 'warning',
      title: '🟡 Offre déposée côté achat',
      message: 'L\'offre peut être acceptée à tout moment — rester agile.',
      actions: ['Suivre négociation achat', 'Préparer diffusion accélérée']
    };
  } else if (niveauContrainte === 2) {
    ajustement.alerteCourtier = {
      type: 'info',
      title: 'ℹ️ Bien identifié côté achat',
      message: 'Le vendeur a un bien en vue — surveiller l\'évolution.',
      actions: ['Proposer coordination GARY']
    };
  } else if (niveauContrainte === 1) {
    if (tolerances.venteLongue) {
      ajustement.phase1 = 1;
      ajustement.recommandation = 'Off-market prolongé conseillé — plus de temps pour le meilleur prix';
    }
  } else if (niveauContrainte === 0 && tolerances.venteLongue) {
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
// Calcul des Dates des Phases
// ============================================

export const calculerDatesPhases = (
  dateDebut: string,
  phaseDurees: PhaseDurees
): PhaseInfo[] => {
  if (!dateDebut) return [];
  
  let currentDate = parseISO(dateDebut);
  // Toujours démarrer un lundi
  currentDate = nextMonday(currentDate);
  
  const phases: PhaseInfo[] = [];
  
  // Phase 0 : Préparation
  const phase0End = addWeeks(currentDate, phaseDurees.phase0);
  phases.push({
    nom: 'Préparation',
    icon: '🎬',
    duree: phaseDurees.phase0,
    description: 'Photos, vidéo, rédaction annonce',
    objectif: 'Préparer tous les supports de communication',
    canaux: [],
    dateDebut: currentDate,
    dateFin: phase0End
  });
  
  // Phase 1 : Off-Market
  const phase1Start = phase0End;
  const phase1End = addWeeks(phase1Start, phaseDurees.phase1);
  phases.push({
    nom: 'Off-Market',
    icon: '🔒',
    duree: phaseDurees.phase1,
    description: 'Diffusion confidentielle réseau qualifié',
    objectif: 'Tester le prix et générer des offres premium',
    canaux: ['Base acheteurs GARY', 'Réseau courtiers partenaires'],
    dateDebut: phase1Start,
    dateFin: phase1End
  });
  
  // Phase 2 : Coming Soon
  const phase2Start = phase1End;
  const phase2End = addWeeks(phase2Start, phaseDurees.phase2);
  phases.push({
    nom: 'Coming Soon',
    icon: '⏳',
    duree: phaseDurees.phase2,
    description: 'Création de l\'attente avant mise en ligne',
    objectif: 'Construire l\'intérêt et qualifier les acheteurs',
    canaux: ['Réseaux sociaux GARY', 'Newsletter', 'Vitrine agence'],
    dateDebut: phase2Start,
    dateFin: phase2End
  });
  
  // Phase 3 : Public
  const phase3Start = phase2End;
  const phase3End = addWeeks(phase3Start, phaseDurees.phase3);
  phases.push({
    nom: 'Public',
    icon: '🌐',
    duree: phaseDurees.phase3,
    description: 'Visibilité maximale sur tous les portails',
    objectif: 'Maximiser l\'exposition si nécessaire',
    canaux: ['Immoscout', 'Homegate', 'Acheter-Louer', 'Site GARY'],
    dateDebut: phase3Start,
    dateFin: phase3End
  });
  
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
    { id: 'photos', label: 'Photos professionnelles', checked: true, isDefault: true },
    { id: 'redaction', label: 'Rédaction annonce', checked: true, isDefault: true },
    { id: 'dossier', label: 'Préparation dossier technique', checked: true, isDefault: true }
  ];
  
  if (isMaison) {
    actions.push({ id: 'drone', label: 'Drone / Vue aérienne', checked: true, isDefault: true });
  }
  
  actions.push({ id: 'visite360', label: 'Visite virtuelle 360°', checked: false, isDefault: true });
  
  if (hasLuxe) {
    actions.push({ id: 'homestaging', label: 'Home staging virtuel', checked: false, isDefault: true });
    actions.push({ id: 'brochure', label: 'Brochure luxe', checked: false, isDefault: true });
  }
  
  actions.push({ id: 'plans', label: 'Refaire les plans (optionnel)', checked: false, isDefault: true });
  
  return actions;
};

// ============================================
// Génération du Pitch Complet (Logique GARY)
// ============================================

const reformulerPointFaible = (point: string): string => {
  const lower = point.toLowerCase();
  
  if (lower.includes("travaux") || lower.includes("rénover") || lower.includes("vétuste")) {
    return "le potentiel de personnalisation est un atout pour les acheteurs qui souhaitent créer leur propre espace";
  }
  if (lower.includes("vis-à-vis") || lower.includes("vue")) {
    return "nous mettrons en valeur les autres orientations et l'intimité du logement";
  }
  if (lower.includes("charges") || lower.includes("ppf")) {
    return "les charges reflètent des prestations de qualité et un entretien régulier de l'immeuble";
  }
  if (lower.includes("bruit") || lower.includes("nuisance") || lower.includes("sonore")) {
    return "nous ciblerons les profils adaptés au dynamisme du quartier";
  }
  if (lower.includes("parking") || lower.includes("place")) {
    return "nous mettrons en avant les transports à proximité et les solutions de stationnement alternatives";
  }
  if (lower.includes("ascenseur")) {
    return "l'absence d'ascenseur attire les acheteurs sportifs et réduit les charges";
  }
  if (lower.includes("sombre") || lower.includes("luminosité")) {
    return "nous optimiserons la mise en valeur photographique et proposerons des solutions de home staging";
  }
  if (lower.includes("cuisine") || lower.includes("sdb") || lower.includes("salle de bain")) {
    return "le potentiel de rénovation permet aux acheteurs de personnaliser selon leurs goûts";
  }
  
  return "nous saurons le présenter avec transparence tout en mettant l'accent sur les atouts du bien";
};

export const generatePitch = (
  identification: Identification | null,
  caracteristiques: Caracteristiques | null,
  analyseTerrain: AnalyseTerrain | null,
  preEstimation: PreEstimation | null,
  dateDebutFormate: string,
  phases: PhaseInfo[]
): PitchGenere => {
  const vendeurNom = identification?.vendeur?.nom || "Madame, Monsieur";
  const vendeurPrenom = vendeurNom.split(' ')[0] || vendeurNom;
  const motifVente = identification?.contexte?.motifVente;
  const priorite = identification?.contexte?.prioriteVendeur;
  const horizon = identification?.contexte?.horizon;
  const typeBien = caracteristiques?.typeBien === 'appartement' ? "appartement" : "maison";
  const pointsForts = analyseTerrain?.pointsForts || [];
  const pointsFaibles = analyseTerrain?.pointsFaibles || [];
  const prixEntre = preEstimation?.prixEntre || '';
  const prixEt = preEstimation?.prixEt || '';
  const projetPostVente = identification?.projetPostVente;
  const capitalVis = getCapitalVisibilite(identification);
  
  // 1. ACCROCHE PERSONNALISÉE SELON MOTIF
  let intro = "";
  switch(motifVente) {
    case 'succession':
      intro = `${vendeurPrenom}, je comprends que cette période est particulière. Au-delà de la transaction, mon rôle est de vous accompagner sereinement dans cette transition, en prenant le temps qu'il faut.`;
      break;
    case 'separation':
    case 'divorce':
      intro = `${vendeurPrenom}, merci pour votre confiance dans ce contexte délicat. Je m'engage à garantir une vente efficace et discrète, où chacun trouve son compte.`;
      break;
    case 'mutation':
    case 'demenagement':
      intro = `${vendeurPrenom}, votre nouveau projet de vie mérite une vente bien orchestrée. Je m'engage à coordonner le timing pour que tout s'enchaîne naturellement avec votre déménagement.`;
      break;
    case 'retraite':
      intro = `${vendeurPrenom}, ce nouveau chapitre de votre vie mérite toute notre attention. Nous allons prendre le temps de bien faire les choses ensemble.`;
      break;
    case 'investissement':
      intro = `${vendeurPrenom}, en tant qu'investisseur, vous savez que le timing et le prix sont cruciaux. Notre approche data-driven va vous permettre d'optimiser cette transaction.`;
      break;
    case 'agrandissement':
      intro = `${vendeurPrenom}, votre famille s'agrandit et c'est une belle nouvelle. Nous allons organiser la vente pour qu'elle finance sereinement votre nouveau projet.`;
      break;
    default:
      intro = `${vendeurPrenom}, merci pour votre confiance. Je suis ravi de vous accompagner dans ce projet et de mettre mon expertise à votre service.`;
  }
  
  // 2. DESCRIPTION DU BIEN AVEC POINTS FORTS
  let descriptionBien = `Votre ${typeBien} présente de réels atouts.`;
  if (pointsForts.length >= 3) {
    descriptionBien = `Votre ${typeBien} présente de réels atouts : ${pointsForts.slice(0, 3).join(', ')}.`;
  } else if (pointsForts.length > 0) {
    descriptionBien = `Votre ${typeBien} présente de réels atouts : ${pointsForts.join(', ')}.`;
  }
  
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
  
  // 5. STRATÉGIE SELON PRIORITÉ
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
  
  // 6. TIMING
  let timing = "";
  if (dateDebutFormate && phases.length > 0) {
    const dateFinEstimee = phases[phases.length - 1]?.dateFin;
    const moisFin = dateFinEstimee ? format(dateFinEstimee, 'MMMM yyyy', { locale: fr }) : '';
    timing = `Nous pouvons démarrer la commercialisation dès le ${dateDebutFormate}.`;
    if (moisFin) {
      timing += ` Avec notre méthodologie en 4 phases, nous visons une signature d'ici ${moisFin}.`;
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
  
  // 7. PROJET POST-VENTE (CROSS-SELLING COORDINATION)
  let projetPostVenteText = "";
  let crossSelling = "";
  
  if (projetPostVente?.nature === 'achat') {
    const avancement = projetPostVente.avancement;
    const coordination = projetPostVente.niveauCoordination;
    
    if (coordination === 'achat_souhaite' || coordination === 'achat_envisageable') {
      crossSelling = "Si vous le souhaitez, notre équipe peut également vous accompagner dans votre recherche de bien. Cela nous permet de coordonner parfaitement les deux opérations.";
    }
    
    switch(avancement) {
      case 'bien_identifie':
      case 'offre_deposee':
        projetPostVenteText = "Vous avez un projet d'achat en parallèle — nous allons synchroniser les deux opérations pour éviter tout stress.";
        break;
      case 'compromis_signe':
        projetPostVenteText = "Avec un compromis signé côté achat, nous avons une deadline claire. Je vais adapter notre stratégie pour sécuriser la vente dans les temps.";
        break;
      case 'acte_programme':
        projetPostVenteText = "L'acte étant programmé, nous devons impérativement vendre avant cette date. Je mets tout en œuvre pour y parvenir.";
        break;
    }
    
    if (projetPostVente.accepteDecalage === 'non') {
      projetPostVenteText += " Je note que vous ne souhaitez pas décaler le projet d'achat — nous en tenons compte.";
    }
  } else if (projetPostVente?.nature === 'location') {
    projetPostVenteText = "Pour votre projet de location après la vente, notre équipe peut vous accompagner dans la recherche si vous le souhaitez.";
    crossSelling = "GARY Immobilier propose également un service de gestion locative si cela peut vous intéresser.";
  }
  
  // 8. PRIX
  let prixInfo = "";
  if (prixEntre && prixEt) {
    prixInfo = `Je vous propose une estimation entre CHF ${parseInt(prixEntre).toLocaleString('fr-CH')} et CHF ${parseInt(prixEt).toLocaleString('fr-CH')}.`;
  }
  
  // 9. CLOSING
  const closing = `Les prochaines étapes sont simples : je vous envoie le récapitulatif complet par email dans les 48h. Dès votre validation, nous lançons les premières actions — photos professionnelles et préparation de l'annonce.

Y a-t-il des questions que vous aimeriez me poser ?`;
  
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
    return getAjustementPhases(niveauContrainte, tolerances, flexibilite, capitalVisibilite);
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
    return calculerDatesPhases(dateDebut, phaseDurees);
  }, [strategiePitch?.dateDebut, phaseDurees]);
  
  const dateDebutFormate = useMemo(() => {
    if (phases.length > 0 && phases[0].dateDebut) {
      return format(phases[0].dateDebut, 'd MMMM yyyy', { locale: fr });
    }
    return '';
  }, [phases]);
  
  const pitch = useMemo(() => 
    generatePitch(identification, caracteristiques, analyseTerrain, preEstimation, dateDebutFormate, phases),
    [identification, caracteristiques, analyseTerrain, preEstimation, dateDebutFormate, phases]
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
