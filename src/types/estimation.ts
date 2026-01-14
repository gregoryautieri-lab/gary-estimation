// ============================================
// GARY - Types TypeScript pour les Estimations
// ============================================

// Enums
export type EstimationStatus = 'brouillon' | 'en_cours' | 'termine' | 'archive';
export type TypeBien = 'appartement' | 'maison' | 'terrain' | 'immeuble' | 'commercial';
export type TypeMiseEnVente = 'offmarket' | 'comingsoon' | 'public';

// ============================================
// Module 1 : Identification
// ============================================

export interface Vendeur {
  nom: string;
  telephone: string;
  email: string;
  situation: string;
}

export interface Adresse {
  rue: string;
  codePostal: string;
  localite: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  loading?: boolean;
}

export interface Contexte {
  motifVente: string;
  horizon: string;
  prixAttendu: string;
  statutOccupation: string;
  finBailMois: string;
  finBailAnnee: string;
  confidentialite: string; // 'normale' | 'discrete' | 'confidentielle'
  prioriteVendeur: string; // 'prixMax' | 'rapidite' | 'equilibre'
}

export interface Historique {
  dejaDiffuse: boolean;
  duree: string; // 'moins1mois' | '1-3mois' | '3-6mois' | '6-12mois' | 'plus12mois'
  prixAffiche: string;
  typeDiffusion: string; // 'discrete' | 'moderee' | 'massive'
  portails: string[]; // 'immoscout' | 'homegate' | 'acheterlouer' | 'anibis' | 'immostreet' | 'autres'
  raisonEchec: string[];
}

export interface Proximite {
  icone: string;
  libelle: string;
  distance: string;
}

export interface Financier {
  dateAchat: string;
  prixAchat: string;
  ceduleHypothecaire: string;
  valeurLocative: string;
}

export interface ProjetPostVente {
  nature: string; // 'achat' | 'location' | 'depart' | 'autre' | 'non_concerne'
  avancement: string; // 'pas_commence' | 'recherche' | 'bien_identifie' | 'offre_deposee' | 'compromis_signe' | 'acte_programme'
  dateCible: string;
  dateButoir: string;
  flexibilite: string; // 'faible' | 'moyenne' | 'elevee'
  accepteDecalage: string; // 'oui' | 'non'
  accepteTransitoire: string; // 'oui' | 'non' | 'dernier_recours'
  toleranceVenteLongue: boolean;
  toleranceVenteRapide: boolean;
  toleranceInaction: boolean;
  toleranceRetrait: boolean;
  niveauCoordination: string; // 'legere' | 'active' | 'achat_souhaite' | 'achat_envisageable' | 'vente_seule'
}

export interface Identification {
  vendeur: Vendeur;
  adresse: Adresse;
  contexte: Contexte;
  historique: Historique;
  proximites: Proximite[];
  financier: Financier;
  projetPostVente: ProjetPostVente;
}

// ============================================
// Module 2 : Caractéristiques
// ============================================

export interface NiveauCustom {
  label: string;
  description: string;
}

export interface Caracteristiques {
  typeBien: TypeBien | '';
  sousType: string;
  
  // Surfaces Appartement
  surfacePPE: string;
  surfaceNonHabitable: string;
  surfaceBalcon: string;
  surfaceTerrasse: string;
  surfaceJardin: string;
  
  // Infos PPE Appartement
  numeroLotPPE: string;
  fondRenovation: string;
  
  // Surfaces Maison
  surfaceHabitableMaison: string;
  surfaceUtile: string;
  surfaceTerrain: string;
  
  // Infos parcelle Maison
  numeroParcelle: string;
  zone: string;
  
  // Configuration commune
  nombrePieces: string;
  nombreChambres: string;
  nombreSDB: string;
  nombreWC: string;
  
  // Spécifique Appartement
  etage: string;
  etageHaut: string;
  nombreEtagesImmeuble: string;
  ascenseur: string;
  dernierEtage: boolean;
  diffusion: string[]; // Diffusion chaleur
  
  // Spécifique Maison
  nombreNiveaux: string;
  repartitionSoussol: string;
  repartitionNiveaux: string[];
  niveauxCustom: NiveauCustom[];
  chauffage: string;
  diffusionMaison: string[];
  
  // Commun
  exposition: string[];
  vue: string;
  anneeConstruction: string;
  anneeRenovation: string;
  typeRenovation: string[];
  travauxRecents: string[];
  cecb: string;
  vitrage: string;
  chargesMensuelles: string;
  
  // Annexes parking
  parkingInterieur: string;
  parkingCouverte: string;
  parkingExterieur: string;
  box: string;
  
  // Annexes appart
  cave: boolean;
  piscine: boolean;
  caveVin: boolean;
  fitness: boolean;
  buanderie: string;
  autresAnnexes: string;
  
  // Espaces maison
  espacesMaison: string[];
}

// ============================================
// Module 3 : Analyse Terrain
// ============================================

export interface AnalyseTerrain {
  // État pièce par pièce (1-5)
  etatCuisine: string;
  etatSDB: string;
  etatSols: string;
  etatMurs: string;
  etatMenuiseries: string;
  etatElectricite: string;
  
  // Ambiance (1-5)
  luminosite: number;
  calme: number;
  volumes: number;
  
  // Points forts/faibles
  pointsForts: string[];
  pointsFaibles: string[];
  pointFortCustom: string;
  pointFaibleCustom: string;
  
  // Nuisances
  nuisances: string[];
  
  // Objections et notes
  objectionsAcheteurs: string;
  notesLibres: string;
  
  // Impression générale (1-5)
  impressionGenerale: number;
}

// ============================================
// Module 4 : Photos
// ============================================

export interface Photo {
  id: string;
  dataUrl: string;
  nom: string;
  date: string;
  uploaded: boolean;
  driveUrl?: string;
}

export interface Photos {
  items: Photo[];
}

// ============================================
// Module 5 : Pré-estimation
// ============================================

export interface LigneSupp {
  libelle: string;
  prix: string;
}

export interface Annexe {
  libelle: string;
  prix: string;
}

export interface Comparable {
  adresse: string;
  prix: string;
  surface: string;
  dateVente?: string;
  dureeEnVente?: string;
  commentaire: string;
}

export interface PreEstimation {
  // Appartement - Valeur vénale
  prixM2: string;
  tauxVetuste: number; // % de réduction pour travaux (0-50)
  prixPlaceInt: string;
  prixPlaceExt: string;
  prixBox: string;
  prixCave: string;
  lignesSupp: LigneSupp[];
  
  // Maison - Valeur vénale
  prixM2Terrain: string;
  cubageManuel: string;
  prixM3: string;
  tauxVetusteMaison: number;
  prixM2Amenagement: string;
  annexes: Annexe[];
  
  // Rendement
  loyerMensuel: string;
  tauxCapitalisation: number; // Défaut: 2.5
  
  // Fourchette
  prixEntre: string;
  prixEt: string;
  
  // Type mise en vente
  typeMiseEnVente: TypeMiseEnVente;
  
  // Pourcentages personnalisables
  pourcOffmarket: number; // Défaut: 15
  pourcComingsoon: number; // Défaut: 10
  pourcPublic: number; // Défaut: 6
  
  // Comparables marché
  comparablesVendus: Comparable[];
  comparablesEnVente: Comparable[];
}

// ============================================
// Module 6 : Stratégie & Pitch
// ============================================

export interface PhaseDurees {
  phase0: number; // Préparation (semaines)
  phase1: number; // Off-market (semaines)
  phase2: number; // Coming soon (semaines)
  phase3: number; // Public (semaines)
}

export interface StrategiePitch {
  canauxActifs: string[];
  leviers: string[];
  notesStrategie: string;
  etapesCochees: string[];
  dateRdvRemise: string;
  dateDebut: string;
  dateVenteIdeale: string;
  phaseDurees: PhaseDurees;
  phase0Actions: string[];
}

// ============================================
// Timeline
// ============================================

export interface Timeline {
  dateDebut: string;
  dateVenteIdeale: string;
  phaseDurees: PhaseDurees;
  phase0Actions: string[];
}

// ============================================
// Capital-Visibilité
// ============================================

export interface CapitalVisibiliteAlert {
  type: 'critical' | 'warning' | 'info';
  msg: string;
}

export interface CapitalVisibilite {
  pourcentage: number;
  alerts: CapitalVisibiliteAlert[];
  pauseRecommandee: boolean;
}

// ============================================
// LuxMode (calcul automatique)
// ============================================

export interface LuxMode {
  score: number;
  isLux: boolean;
}

// ============================================
// Estimation complète
// ============================================

export interface EstimationData {
  id?: string;
  courtierId?: string;
  statut: EstimationStatus;
  
  // Champs clés
  typeBien?: TypeBien;
  adresse?: string;
  codePostal?: string;
  localite?: string;
  prixFinal?: number;
  prixMin?: number;
  prixMax?: number;
  
  // Vendeur
  vendeurNom?: string;
  vendeurEmail?: string;
  vendeurTelephone?: string;
  
  // Sections JSONB
  identification: Identification;
  caracteristiques: Caracteristiques;
  analyseTerrain: AnalyseTerrain;
  preEstimation: PreEstimation;
  strategiePitch: StrategiePitch;
  photos: Photos;
  timeline: Timeline;
  
  // Métadonnées
  etapesCompletees: string[];
  notesLibres?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Valeurs par défaut
// ============================================

export const defaultIdentification: Identification = {
  vendeur: { nom: '', telephone: '', email: '', situation: '' },
  adresse: { rue: '', codePostal: '', localite: '' },
  contexte: {
    motifVente: '',
    horizon: '',
    prixAttendu: '',
    statutOccupation: '',
    finBailMois: '',
    finBailAnnee: '',
    confidentialite: '',
    prioriteVendeur: ''
  },
  historique: {
    dejaDiffuse: false,
    duree: '',
    prixAffiche: '',
    typeDiffusion: '',
    portails: [],
    raisonEchec: []
  },
  proximites: [
    { icone: '🚌', libelle: '', distance: '' },
    { icone: '🚃', libelle: '', distance: '' },
    { icone: '🏫', libelle: '', distance: '' },
    { icone: '🛒', libelle: '', distance: '' },
    { icone: '🏥', libelle: '', distance: '' },
    { icone: '🌳', libelle: '', distance: '' }
  ],
  financier: { dateAchat: '', prixAchat: '', ceduleHypothecaire: '', valeurLocative: '' },
  projetPostVente: {
    nature: '',
    avancement: '',
    dateCible: '',
    dateButoir: '',
    flexibilite: '',
    accepteDecalage: '',
    accepteTransitoire: '',
    toleranceVenteLongue: false,
    toleranceVenteRapide: false,
    toleranceInaction: false,
    toleranceRetrait: false,
    niveauCoordination: ''
  }
};

export const defaultCaracteristiques: Caracteristiques = {
  typeBien: '',
  sousType: '',
  surfacePPE: '',
  surfaceNonHabitable: '',
  surfaceBalcon: '',
  surfaceTerrasse: '',
  surfaceJardin: '',
  numeroLotPPE: '',
  fondRenovation: '',
  surfaceHabitableMaison: '',
  surfaceUtile: '',
  surfaceTerrain: '',
  numeroParcelle: '',
  zone: '',
  nombrePieces: '',
  nombreChambres: '',
  nombreSDB: '',
  nombreWC: '',
  etage: '',
  etageHaut: '',
  nombreEtagesImmeuble: '',
  ascenseur: '',
  dernierEtage: false,
  diffusion: [],
  nombreNiveaux: '',
  repartitionSoussol: '',
  repartitionNiveaux: [],
  niveauxCustom: [],
  chauffage: '',
  diffusionMaison: [],
  exposition: [],
  vue: '',
  anneeConstruction: '',
  anneeRenovation: '',
  typeRenovation: [],
  travauxRecents: [],
  cecb: '',
  vitrage: '',
  chargesMensuelles: '',
  parkingInterieur: '',
  parkingCouverte: '',
  parkingExterieur: '',
  box: '',
  cave: false,
  piscine: false,
  caveVin: false,
  fitness: false,
  buanderie: '',
  autresAnnexes: '',
  espacesMaison: []
};

export const defaultAnalyseTerrain: AnalyseTerrain = {
  etatCuisine: '',
  etatSDB: '',
  etatSols: '',
  etatMurs: '',
  etatMenuiseries: '',
  etatElectricite: '',
  luminosite: 0,
  calme: 0,
  volumes: 0,
  pointsForts: [],
  pointsFaibles: [],
  pointFortCustom: '',
  pointFaibleCustom: '',
  nuisances: [],
  objectionsAcheteurs: '',
  notesLibres: '',
  impressionGenerale: 0
};

export const defaultPreEstimation: PreEstimation = {
  prixM2: '',
  tauxVetuste: 0,
  prixPlaceInt: '',
  prixPlaceExt: '',
  prixBox: '',
  prixCave: '',
  lignesSupp: [],
  prixM2Terrain: '',
  cubageManuel: '',
  prixM3: '',
  tauxVetusteMaison: 0,
  prixM2Amenagement: '',
  annexes: [],
  loyerMensuel: '',
  tauxCapitalisation: 2.5,
  prixEntre: '',
  prixEt: '',
  typeMiseEnVente: 'public',
  pourcOffmarket: 15,
  pourcComingsoon: 10,
  pourcPublic: 6,
  comparablesVendus: [],
  comparablesEnVente: []
};

export const defaultStrategiePitch: StrategiePitch = {
  canauxActifs: ['reseau', 'photo'],
  leviers: [],
  notesStrategie: '',
  etapesCochees: [],
  dateRdvRemise: '',
  dateDebut: '',
  dateVenteIdeale: '',
  phaseDurees: {
    phase0: 1,
    phase1: 3,
    phase2: 2,
    phase3: 10
  },
  phase0Actions: []
};

export const defaultTimeline: Timeline = {
  dateDebut: '',
  dateVenteIdeale: '',
  phaseDurees: {
    phase0: 1,
    phase1: 3,
    phase2: 2,
    phase3: 10
  },
  phase0Actions: []
};

export const defaultEstimation: EstimationData = {
  statut: 'brouillon',
  identification: defaultIdentification,
  caracteristiques: defaultCaracteristiques,
  analyseTerrain: defaultAnalyseTerrain,
  preEstimation: defaultPreEstimation,
  strategiePitch: defaultStrategiePitch,
  photos: { items: [] },
  timeline: defaultTimeline,
  etapesCompletees: []
};
