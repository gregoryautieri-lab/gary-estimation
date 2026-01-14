// ============================================
// GARY Stratégie - Logique Métier
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
import { addWeeks, format, parseISO, differenceInWeeks, nextMonday, isBefore, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================
// Types
// ============================================

export interface CapitalVisibilite {
  pourcentage: number;
  label: 'intact' | 'entame' | 'faible';
  color: 'green' | 'yellow' | 'red';
  pauseRecalibrage: number; // semaines
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
  type: 'warning' | 'critical' | 'info';
  message: string;
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
  strategie: string;
  timing: string;
  closing: string;
  complet: string;
}

// ============================================
// Calcul Capital-Visibilité
// ============================================

export const getCapitalVisibilite = (identification: Identification | null): CapitalVisibilite => {
  if (!identification?.historique?.dejaDiffuse) {
    return { pourcentage: 100, label: 'intact', color: 'green', pauseRecalibrage: 0 };
  }
  
  const duree = identification.historique.duree;
  
  const mapping: Record<string, { pct: number; pause: number }> = {
    'moins1mois': { pct: 85, pause: 1 },
    '1-3mois': { pct: 70, pause: 2 },
    '3-6mois': { pct: 50, pause: 3 },
    '6-12mois': { pct: 30, pause: 4 },
    'plus12mois': { pct: 30, pause: 5 }
  };
  
  const data = mapping[duree] || { pct: 100, pause: 0 };
  
  let label: 'intact' | 'entame' | 'faible' = 'intact';
  let color: 'green' | 'yellow' | 'red' = 'green';
  
  if (data.pct >= 70) {
    label = 'intact';
    color = 'green';
  } else if (data.pct >= 40) {
    label = 'entame';
    color = 'yellow';
  } else {
    label = 'faible';
    color = 'red';
  }
  
  return {
    pourcentage: data.pct,
    label,
    color,
    pauseRecalibrage: data.pause
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
  flexibilite: string
): AjustementPhases => {
  const ajustement: AjustementPhases = {
    phase0: 0,
    phase1: 0,
    phase2: 0,
    phase3: 0,
    recommandation: '',
    alerteCourtier: null
  };

  if (niveauContrainte >= 4) {
    // Contrainte FORTE ou CRITIQUE
    if (flexibilite === 'faible') {
      ajustement.phase1 = -2;
      ajustement.phase2 = -1;
      ajustement.recommandation = 'Timeline serrée recommandée';
      ajustement.alerteCourtier = {
        type: 'critical',
        message: '⚠️ Contrainte forte — Calendrier à surveiller'
      };
    } else {
      ajustement.phase1 = -1;
      ajustement.recommandation = 'Phases raccourcies conseillées';
      ajustement.alerteCourtier = {
        type: 'warning',
        message: '🟡 Contrainte élevée — Rester vigilant'
      };
    }
  } else if (niveauContrainte === 3) {
    if (tolerances.venteRapide) {
      ajustement.phase1 = -1;
      ajustement.recommandation = 'Accélération possible si besoin';
    }
    ajustement.alerteCourtier = {
      type: 'warning',
      message: '🟡 Offre déposée côté achat — Rester agile'
    };
  } else if (niveauContrainte === 2) {
    ajustement.alerteCourtier = {
      type: 'info',
      message: '🟡 Bien identifié côté achat — Rester agile'
    };
  } else if (niveauContrainte === 1) {
    if (tolerances.venteLongue) {
      ajustement.phase1 = 1;
      ajustement.recommandation = 'Off-market prolongé conseillé';
    }
  }

  return ajustement;
};

// ============================================
// Calcul Automatique des Phases
// ============================================

interface PhasesCalculees {
  phase0: number;
  phase1: number;
  phase2: number;
  phase3: number;
  isUrgent: boolean;
}

export const calculerPhasesAuto = (
  dureeTotaleDisponible: number,
  pauseRecalibrage: number
): PhasesCalculees => {
  const MIN_TOTAL = 6;
  const duree = Math.max(MIN_TOTAL, dureeTotaleDisponible);
  
  const MIN_PHASE0 = 1;
  const MIN_PHASE1 = 1;
  const MIN_PHASE2 = 1;
  const MIN_PHASE3 = 4;
  const MAX_PHASE1 = 26; // 6 mois max
  
  let phase0 = MIN_PHASE0 + pauseRecalibrage;
  let phase1: number, phase2: number, phase3: number;
  
  const disponibleApresPrepa = duree - phase0;
  
  if (disponibleApresPrepa < 6) {
    // TRÈS URGENT
    phase1 = MIN_PHASE1;
    phase2 = MIN_PHASE2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else if (disponibleApresPrepa <= 12) {
    // COURT (8-12 sem)
    phase1 = 2;
    phase2 = 2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else if (disponibleApresPrepa <= 20) {
    // MOYEN (12-20 sem)
    phase1 = Math.min(6, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 2) * 0.4));
    phase2 = 2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else if (disponibleApresPrepa <= 30) {
    // LONG (20-30 sem)
    phase1 = Math.min(12, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 3) * 0.5));
    phase2 = 3;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else {
    // TRÈS LONG (>30 sem)
    phase1 = MAX_PHASE1;
    phase2 = 4;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  }
  
  return {
    phase0: Math.max(MIN_PHASE0, phase0),
    phase1: Math.max(MIN_PHASE1, Math.min(MAX_PHASE1, phase1)),
    phase2: Math.max(MIN_PHASE2, phase2),
    phase3: Math.max(MIN_PHASE3, phase3),
    isUrgent: dureeTotaleDisponible < 8
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

export const getActionsPhase0 = (isMaison: boolean, hasLuxe: boolean): string[] => {
  const actions = [
    'Photos professionnelles',
    'Rédaction annonce',
    'Préparation dossier technique'
  ];
  
  if (isMaison) {
    actions.push('Drone / Vue aérienne');
  }
  
  actions.push('Visite virtuelle 360°');
  
  if (hasLuxe) {
    actions.push('Home staging virtuel');
    actions.push('Brochure luxe');
  }
  
  actions.push('Refaire les plans (optionnel)');
  
  return actions;
};

// ============================================
// Génération du Pitch
// ============================================

export const generatePitch = (
  identification: Identification | null,
  caracteristiques: Caracteristiques | null,
  analyseTerrain: AnalyseTerrain | null,
  preEstimation: PreEstimation | null,
  dateDebutFormate: string
): PitchGenere => {
  const vendeurNom = identification?.vendeur?.nom || "Madame, Monsieur";
  const motifVente = identification?.contexte?.motifVente;
  const priorite = identification?.contexte?.prioriteVendeur;
  const typeBien = caracteristiques?.typeBien === 'appartement' ? "appartement" : "maison";
  const pointsForts = analyseTerrain?.pointsForts || [];
  const pointsFaibles = analyseTerrain?.pointsFaibles || [];
  const prixEntre = preEstimation?.prixEntre || '';
  const prixEt = preEstimation?.prixEt || '';
  
  // 1. ACCROCHE
  let intro = "";
  switch(motifVente) {
    case 'succession':
      intro = `${vendeurNom}, je comprends que cette période est particulière. Au-delà de la transaction, je suis là pour vous accompagner sereinement dans cette transition.`;
      break;
    case 'separation':
    case 'divorce':
      intro = `${vendeurNom}, merci pour votre confiance dans ce contexte délicat. Mon rôle est de vous garantir une vente efficace et discrète.`;
      break;
    case 'mutation':
    case 'demenagement':
      intro = `${vendeurNom}, votre nouveau projet de vie mérite une vente bien orchestrée. Je m'engage à coordonner le timing pour que tout s'enchaîne naturellement.`;
      break;
    case 'retraite':
      intro = `${vendeurNom}, ce nouveau chapitre de votre vie mérite toute notre attention. Je m'engage à vous accompagner avec sérénité.`;
      break;
    default:
      intro = `${vendeurNom}, merci pour votre confiance. Je suis ravi de vous accompagner dans ce projet.`;
  }
  
  // 2. DESCRIPTION DU BIEN
  let descriptionBien = `Votre ${typeBien} présente de réels atouts.`;
  if (pointsForts.length >= 3) {
    descriptionBien = `Votre ${typeBien} présente de réels atouts : ${pointsForts.slice(0, 3).join(', ')}.`;
  } else if (pointsForts.length > 0) {
    descriptionBien = `Votre ${typeBien} présente de réels atouts : ${pointsForts.join(', ')}.`;
  }
  
  // 3. POINTS D'ATTENTION
  let pointsAttention = "";
  if (pointsFaibles.length > 0) {
    const reformulations = pointsFaibles.slice(0, 2).map(p => {
      if (p.toLowerCase().includes("travaux")) return "le potentiel de personnalisation est un atout pour certains acheteurs";
      if (p.toLowerCase().includes("vis-à-vis")) return "nous valoriserons les autres orientations";
      if (p.toLowerCase().includes("charges")) return "les charges reflètent des prestations de qualité";
      if (p.toLowerCase().includes("bruit") || p.toLowerCase().includes("nuisance")) return "nous ciblerons les profils adaptés au quartier";
      return "nous saurons le présenter avec transparence";
    });
    pointsAttention = `Concernant les points d'attention, ${reformulations[0]}.`;
  }
  
  // 4. STRATÉGIE
  let strategie = "";
  switch(priorite) {
    case 'prixMax':
      strategie = "Votre priorité est d'obtenir le meilleur prix : nous positionnons le bien avec ambition et prenons le temps nécessaire.";
      break;
    case 'rapidite':
      strategie = "Votre priorité est la rapidité : nous maximisons la visibilité dès le départ pour accélérer la vente.";
      break;
    default:
      strategie = "Notre approche équilibrée vise le meilleur prix dans un délai raisonnable.";
  }
  
  // 5. TIMING
  let timing = "";
  if (dateDebutFormate) {
    timing = `Nous pouvons démarrer la commercialisation dès le ${dateDebutFormate}.`;
  }
  
  // Prix
  let prixInfo = "";
  if (prixEntre && prixEt) {
    prixInfo = ` Je vous propose une estimation entre CHF ${parseInt(prixEntre).toLocaleString('fr-CH')} et CHF ${parseInt(prixEt).toLocaleString('fr-CH')}.`;
  }
  
  // 6. CLOSING
  const closing = "Je vous envoie le récapitulatif complet par email. Dès votre validation, nous lançons les premières actions.";
  
  const complet = `${intro}\n\n${descriptionBien}${prixInfo}\n\n${pointsAttention ? pointsAttention + '\n\n' : ''}${strategie} ${timing}\n\n${closing}`;
  
  return {
    intro,
    descriptionBien,
    pointsAttention,
    strategie,
    timing,
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
  
  const ajustementPhases = useMemo(() => {
    const tolerances = {
      venteLongue: identification?.projetPostVente?.toleranceVenteLongue || false,
      venteRapide: identification?.projetPostVente?.toleranceVenteRapide || false
    };
    const flexibilite = identification?.projetPostVente?.flexibilite || 'moyenne';
    return getAjustementPhases(niveauContrainte, tolerances, flexibilite);
  }, [niveauContrainte, identification]);
  
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
  
  const phaseDurees = useMemo(() => {
    const basePhases = strategiePitch?.phaseDurees || {
      phase0: 1,
      phase1: 3,
      phase2: 2,
      phase3: 10
    };
    
    // Ajouter pause recalibrage à phase 0
    const phase0Ajuste = basePhases.phase0 + capitalVisibilite.pauseRecalibrage;
    
    return {
      phase0: phase0Ajuste,
      phase1: Math.max(1, basePhases.phase1 + ajustementPhases.phase1),
      phase2: Math.max(1, basePhases.phase2 + ajustementPhases.phase2),
      phase3: Math.max(4, basePhases.phase3 + ajustementPhases.phase3)
    };
  }, [strategiePitch, capitalVisibilite, ajustementPhases]);
  
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
    generatePitch(identification, caracteristiques, analyseTerrain, preEstimation, dateDebutFormate),
    [identification, caracteristiques, analyseTerrain, preEstimation, dateDebutFormate]
  );
  
  return {
    capitalVisibilite,
    niveauContrainte,
    ajustementPhases,
    canaux,
    actionsPhase0,
    phaseDurees,
    phases,
    pitch,
    isMaison,
    typeMiseEnVente,
    dateDebutFormate
  };
};
