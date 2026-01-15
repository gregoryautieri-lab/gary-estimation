// ============================================
// GARY - Types TypeScript pour les Estimations
// ============================================

// Enums
export type EstimationStatus = 'brouillon' | 'en_cours' | 'termine' | 'archive' | 'vendu';
export type TypeBien = 'appartement' | 'maison' | 'terrain' | 'immeuble' | 'commercial';
export type TypeMiseEnVente = 'offmarket' | 'comingsoon' | 'public';
export type NiveauContrainte = 'faible' | 'moyenne' | 'forte' | 'critique';
export type NiveauCoordination = 'legere' | 'active' | 'achat_souhaite' | 'achat_envisageable' | 'vente_seule';

// ============================================
// Courtiers GARY
// ============================================

export interface CourtierGARY {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  initiales: string;
  avatar?: string;
  signature?: string;
}

export const COURTIERS_GARY: CourtierGARY[] = [
  { id: 'gc', nom: 'Courtier', prenom: 'Grégory', email: 'gregory@gary.ch', telephone: '+41 22 700 50 00', initiales: 'GC' },
  { id: 'ab', nom: 'Broker', prenom: 'Antoine', email: 'antoine@gary.ch', telephone: '+41 22 700 50 01', initiales: 'AB' },
  { id: 'sb', nom: 'Broker', prenom: 'Sophie', email: 'sophie@gary.ch', telephone: '+41 22 700 50 02', initiales: 'SB' },
  { id: 'ml', nom: 'Leroy', prenom: 'Marc', email: 'marc@gary.ch', telephone: '+41 22 700 50 03', initiales: 'ML' },
  { id: 'cp', nom: 'Petit', prenom: 'Claire', email: 'claire@gary.ch', telephone: '+41 22 700 50 04', initiales: 'CP' },
];

// ============================================
// Module 1 : Identification
// ============================================

export interface Vendeur {
  nom: string;
  prenom?: string;
  telephone: string;
  telephoneSecondaire?: string;
  email: string;
  situation: string;
  nationalite?: string;
  dateNaissance?: string;
  profession?: string;
}

export interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  mapType: "hybrid" | "satellite" | "roadmap";
  markerPosition: { lat: number; lng: number };
}

export interface Adresse {
  rue: string;
  numero?: string;
  codePostal: string;
  localite: string;
  canton?: string;
  pays?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string; // Google Places ID
  loading?: boolean;
  mapState?: MapState; // État de la carte Google Maps
  cadastreZoom?: number; // Niveau de zoom cadastre Swisstopo
}

export interface Contexte {
  motifVente: string;
  motifDetail?: string; // Détail libre du motif
  horizon: string;
  prixAttendu: string;
  statutOccupation: string;
  finBailMois: string;
  finBailAnnee: string;
  confidentialite: string; // 'normale' | 'discrete' | 'confidentielle'
  prioriteVendeur: string; // 'prixMax' | 'rapidite' | 'equilibre'
  urgence?: boolean;
  commentaireContexte?: string;
}

export interface PortailDiffusion {
  nom: string;
  actif: boolean;
}

export interface Historique {
  dejaDiffuse: boolean;
  duree: string; // 'moins1mois' | '1-3mois' | '3-6mois' | '6-12mois' | 'plus12mois'
  prixAffiche: string;
  prixInitial?: string;
  typeDiffusion: string; // 'discrete' | 'moderee' | 'massive'
  portails: string[]; // 'immoscout' | 'homegate' | 'acheterlouer' | 'anibis' | 'immostreet' | 'autres'
  raisonEchec: string[];
  raisonEchecDetail?: string;
  agencePrecedente?: string;
  dateRetrait?: string;
  visitesPrecedentes?: number;
  offresRecues?: string;
}

export type TypeProximite = 'transport_bus' | 'transport_tram' | 'ecole' | 'commerce' | 'sante' | 'nature';

export interface Proximite {
  type: TypeProximite;
  icone: string;
  libelle: string;
  distance: string;
  tempsMarche?: string;
}

export interface Financier {
  dateAchat: string;
  prixAchat: string;
  prixAchatM2?: string; // Calculé automatiquement
  ceduleHypothecaire: string;
  montantHypotheque?: string;
  tauxHypotheque?: string;
  valeurLocative: string;
  chargesAnnuelles?: string;
  impotFoncier?: string;
}

export interface ProjetPostVente {
  nature: string; // 'achat' | 'location' | 'depart' | 'autre' | 'non_concerne'
  natureDetail?: string;
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
  budgetProjetSuivant?: string;
  regionRecherche?: string;
  criteresRecherche?: string;
  commentaireProjet?: string;
}

export interface Identification {
  vendeur: Vendeur;
  adresse: Adresse;
  contexte: Contexte;
  historique: Historique;
  proximites: Proximite[];
  financier: Financier;
  projetPostVente: ProjetPostVente;
  courtierAssigne?: string; // ID du courtier GARY
  dateRdvEstimation?: string;
  sourceContact?: string; // Comment le vendeur nous a trouvé
}

// ============================================
// Module 2 : Caractéristiques
// ============================================

export interface NiveauMaison {
  id: string;
  label: string;
  description: string;
  surface?: string;
  pieces?: string[];
}

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
  quotePart?: string;
  chargesPPE?: string;
  
  // Surfaces Maison
  surfaceHabitableMaison: string;
  surfaceUtile: string;
  surfaceTerrain: string;
  surfaceTerrasse2?: string;
  empriseSol?: string;
  
  // Infos parcelle Maison
  numeroParcelle: string;
  zone: string;
  indice?: string; // IUS/IOS
  servitudes?: string;
  
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
  niveauxMaison: NiveauMaison[]; // Niveaux détaillés avec surfaces
  chauffage: string;
  diffusionMaison: string[];
  
  // Commun
  exposition: string[];
  vue: string;
  vueDetail?: string;
  anneeConstruction: string;
  anneeRenovation: string;
  typeRenovation: string[];
  travauxRecents: string[];
  travauxPrevus?: string[];
  cecb: string;
  cecbChaleur?: string;
  vitrage: string;
  chargesMensuelles: string;
  
  // Annexes parking
  parkingInterieur: string;
  parkingCouverte: string;
  parkingExterieur: string;
  box: string;
  prixParkingInt?: string;
  prixParkingExt?: string;
  prixBox?: string;
  
  // Annexes appart
  cave: boolean;
  piscine: boolean;
  caveVin: boolean;
  fitness: boolean;
  buanderie: string;
  autresAnnexes: string;
  
  // Espaces maison
  espacesMaison: string[];
  
  // Nuisances (environnement)
  nuisances: string[];
  nuisanceDetail?: string;
  
  // Données supplémentaires
  styleArchitectural?: string;
  materiauConstruction?: string;
  toiture?: string;
  jardinAmenage?: boolean;
  jardinPaysager?: boolean;
  piscineType?: string;
  dependances?: string;
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
  etatPlomberie?: string;
  etatIsolation?: string;
  etatFacade?: string;
  etatToiture?: string;
  
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
  nuisanceDetail?: string;
  
  // Objections et notes
  objectionsAcheteurs: string;
  notesLibres: string;
  
  // Impression générale (1-5)
  impressionGenerale: number;
  
  // Travaux estimés
  travauxEstimes?: string;
  montantTravauxEstime?: string;
  urgenceTravaux?: 'aucune' | 'souhaitables' | 'necessaires' | 'urgents';
  
  // Potentiel
  potentielAmelioration?: string;
  potentielAgrandissement?: boolean;
  potentielDivision?: boolean;
}

// ============================================
// Module 4 : Photos
// ============================================

export interface Photo {
  id: string;
  dataUrl: string;
  storageUrl?: string; // URL Supabase Storage
  thumbnailUrl?: string;
  nom: string;
  date: string;
  uploaded: boolean;
  uploading?: boolean;
  driveUrl?: string;
  categorie?: 'exterieur' | 'sejour' | 'cuisine' | 'chambre' | 'sdb' | 'autre' | 'vue' | 'parking';
  ordre?: number;
  favori?: boolean;
}

export interface Photos {
  items: Photo[];
  syncStatus?: 'synced' | 'pending' | 'error';
  lastSyncDate?: string;
}

// ============================================
// Module 5 : Pré-estimation
// ============================================

export interface LigneSupp {
  id?: string;
  libelle: string;
  prix: string;
}

export interface Annexe {
  id?: string;
  libelle: string;
  prix: string;
}

export interface Comparable {
  id?: string;
  adresse: string;
  prix: string;
  prixM2?: string;
  surface: string;
  dateVente?: string;
  dureeEnVente?: string;
  commentaire: string;
  source?: string; // GARY, Wüest, public
  isGary?: boolean; // Badge GARY
  typeBien?: TypeBien;
  nombrePieces?: string;
  lien?: string;
  coordinates?: { lat: number; lng: number }; // Coordonnées GPS pour la carte
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
  
  // Gage
  valeurGage?: string;
  tauxGage?: number; // Défaut: 80%
  
  // Fourchette
  prixEntre: string;
  prixEt: string;
  prixRecommande?: string;
  
  // Type mise en vente
  typeMiseEnVente: TypeMiseEnVente;
  
  // Pourcentages personnalisables
  pourcOffmarket: number; // Défaut: 15
  pourcComingsoon: number; // Défaut: 10
  pourcPublic: number; // Défaut: 6
  
  // Comparables marché
  comparablesVendus: Comparable[];
  comparablesEnVente: Comparable[];
  
  // Justification et notes
  justificationPrix?: string;
  notesEstimation?: string;
  
  // Valeurs calculées (lecture seule, recalculées à chaque affichage)
  surfacePonderee?: string;
  cubageTheorique?: string;
  valeurVenale?: string;
  valeurRendement?: string;
  valeurGageCalculee?: string;
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

export interface Phase0Action {
  id: string;
  label: string;
  completed: boolean;
  dateCompletion?: string;
  responsable?: string;
  notes?: string;
}

export interface PhaseTimeline {
  phase: number;
  nom: string;
  dateDebut: string;
  dateFin: string;
  dureeSemaines: number;
  actionsClefs?: string[];
  completee?: boolean;
}

export interface CanalDiffusion {
  id: string;
  nom: string;
  actif: boolean;
  priorite?: number;
  dateActivation?: string;
  notes?: string;
}

export interface LevierMarketing {
  id: string;
  nom: string;
  actif: boolean;
  cout?: string;
  responsable?: string;
  dateRealisation?: string;
}

export interface EtapeProchaine {
  id: string;
  label: string;
  completed: boolean;
  dateLimite?: string;
  responsable?: string;
}

export interface PitchGenere {
  accroche: string;
  reformulationFaibles: string[];
  recalibrage: string;
  transitionPostVente: string;
  crossSelling: string;
  horizonTemporel: string;
  engagement: string;
  prochainRdv: string;
  pitchComplet: string;
}

export interface StrategiePitch {
  canauxActifs: string[];
  canauxDetails?: CanalDiffusion[];
  leviers: string[];
  leviersDetails?: LevierMarketing[];
  notesStrategie: string;
  etapesCochees: string[];
  etapesDetails?: EtapeProchaine[];
  dateRdvRemise: string;
  dateDebut: string;
  dateVenteIdeale: string;
  phaseDurees: PhaseDurees;
  phasesTimeline?: PhaseTimeline[];
  phase0Actions: string[];
  phase0ActionsDetails?: Phase0Action[];
  pitchCustom?: string;
  pitchGenere?: PitchGenere;
  capitalVisibilite?: number;
  alertesCourtier?: string[];
  pauseRecommandee?: boolean;
}

// ============================================
// Timeline
// ============================================

export interface Timeline {
  dateDebut: string;
  dateVenteIdeale: string;
  phaseDurees: PhaseDurees;
  phase0Actions: string[];
  phasesCalculees?: PhaseTimeline[];
  dureeTotale?: number; // En semaines
  dateFinEstimee?: string;
}

// ============================================
// Capital-Visibilité
// ============================================

export interface CapitalVisibiliteAlert {
  type: 'critical' | 'warning' | 'info' | 'success';
  title?: string;
  msg: string;
  actions?: string[];
}

export interface CapitalVisibilite {
  pourcentage: number;
  alerts: CapitalVisibiliteAlert[];
  pauseRecommandee: boolean;
  niveauContrainte?: NiveauContrainte;
  recommandations?: string[];
}

// ============================================
// LuxMode (calcul automatique)
// ============================================

export interface LuxMode {
  score: number;
  isLux: boolean;
  criteres?: string[];
}

// ============================================
// Alertes Courtier
// ============================================

export interface AlerteCourtier {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  actions?: string[];
  source: 'capital' | 'contrainte' | 'timing' | 'prix' | 'coordination';
  dateCreation: string;
  lue?: boolean;
}

// ============================================
// Export PDF
// ============================================

export interface PDFConfig {
  inclurePhotos: boolean;
  inclureCarte: boolean;
  inclureComparables: boolean;
  inclureTimeline: boolean;
  inclurePitch: boolean;
  formatCouverture: 'standard' | 'premium' | 'luxe';
  langue: 'fr' | 'en' | 'de';
}

// ============================================
// Métadonnées & Audit
// ============================================

export interface ModificationAudit {
  date: string;
  userId: string;
  userName?: string;
  action: string;
  details?: string;
}

export interface EstimationMetadata {
  versionApp: string;
  tempsSaisie?: number; // En minutes
  dernierModificateur?: string;
  historiqueModifications?: ModificationAudit[];
  verrouille?: boolean;
  dateVerrouillage?: string;
  motifVerrouillage?: string;
}

// ============================================
// Estimation complète
// ============================================

export interface EstimationData {
  id?: string;
  courtierId?: string;
  courtierNom?: string;
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
  vendeurPrenom?: string;
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
  
  // Alertes
  alertes?: AlerteCourtier[];
  
  // Métadonnées
  metadata?: EstimationMetadata;
  etapesCompletees: string[];
  notesLibres?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Statuts spéciaux
  dupliqueeDeId?: string;
  archiveeDate?: string;
  vendueDate?: string;
  venduePrix?: number;
}

// ============================================
// Valeurs par défaut
// ============================================

export const defaultVendeur: Vendeur = {
  nom: '',
  prenom: '',
  telephone: '',
  telephoneSecondaire: '',
  email: '',
  situation: '',
  nationalite: '',
  profession: ''
};

export const defaultAdresse: Adresse = {
  rue: '',
  numero: '',
  codePostal: '',
  localite: '',
  canton: '',
  pays: 'Suisse'
};

export const defaultContexte: Contexte = {
  motifVente: '',
  motifDetail: '',
  horizon: '',
  prixAttendu: '',
  statutOccupation: '',
  finBailMois: '',
  finBailAnnee: '',
  confidentialite: 'normale',
  prioriteVendeur: 'equilibre',
  urgence: false,
  commentaireContexte: ''
};

export const defaultHistorique: Historique = {
  dejaDiffuse: false,
  duree: '',
  prixAffiche: '',
  prixInitial: '',
  typeDiffusion: '',
  portails: [],
  raisonEchec: [],
  raisonEchecDetail: '',
  agencePrecedente: '',
  dateRetrait: '',
  visitesPrecedentes: undefined,
  offresRecues: ''
};

export const defaultProximites: Proximite[] = [
  { type: 'transport_bus', icone: '🚌', libelle: '', distance: '', tempsMarche: '' },
  { type: 'transport_tram', icone: '🚃', libelle: '', distance: '', tempsMarche: '' },
  { type: 'ecole', icone: '🏫', libelle: '', distance: '', tempsMarche: '' },
  { type: 'commerce', icone: '🛒', libelle: '', distance: '', tempsMarche: '' },
  { type: 'sante', icone: '🏥', libelle: '', distance: '', tempsMarche: '' },
  { type: 'nature', icone: '🌳', libelle: '', distance: '', tempsMarche: '' }
];

export const defaultFinancier: Financier = {
  dateAchat: '',
  prixAchat: '',
  prixAchatM2: '',
  ceduleHypothecaire: '',
  montantHypotheque: '',
  tauxHypotheque: '',
  valeurLocative: '',
  chargesAnnuelles: '',
  impotFoncier: ''
};

export const defaultProjetPostVente: ProjetPostVente = {
  nature: '',
  natureDetail: '',
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
  niveauCoordination: '',
  budgetProjetSuivant: '',
  regionRecherche: '',
  criteresRecherche: '',
  commentaireProjet: ''
};

export const defaultIdentification: Identification = {
  vendeur: defaultVendeur,
  adresse: defaultAdresse,
  contexte: defaultContexte,
  historique: defaultHistorique,
  proximites: defaultProximites,
  financier: defaultFinancier,
  projetPostVente: defaultProjetPostVente,
  courtierAssigne: '',
  dateRdvEstimation: '',
  sourceContact: ''
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
  quotePart: '',
  chargesPPE: '',
  surfaceHabitableMaison: '',
  surfaceUtile: '',
  surfaceTerrain: '',
  surfaceTerrasse2: '',
  empriseSol: '',
  numeroParcelle: '',
  zone: '',
  indice: '',
  servitudes: '',
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
  niveauxMaison: [],
  chauffage: '',
  diffusionMaison: [],
  exposition: [],
  vue: '',
  vueDetail: '',
  anneeConstruction: '',
  anneeRenovation: '',
  typeRenovation: [],
  travauxRecents: [],
  travauxPrevus: [],
  cecb: '',
  cecbChaleur: '',
  vitrage: '',
  chargesMensuelles: '',
  parkingInterieur: '',
  parkingCouverte: '',
  parkingExterieur: '',
  box: '',
  prixParkingInt: '',
  prixParkingExt: '',
  prixBox: '',
  cave: false,
  piscine: false,
  caveVin: false,
  fitness: false,
  buanderie: '',
  autresAnnexes: '',
  espacesMaison: [],
  nuisances: [],
  nuisanceDetail: '',
  styleArchitectural: '',
  materiauConstruction: '',
  toiture: '',
  jardinAmenage: false,
  jardinPaysager: false,
  piscineType: '',
  dependances: ''
};

export const defaultAnalyseTerrain: AnalyseTerrain = {
  etatCuisine: '',
  etatSDB: '',
  etatSols: '',
  etatMurs: '',
  etatMenuiseries: '',
  etatElectricite: '',
  etatPlomberie: '',
  etatIsolation: '',
  etatFacade: '',
  etatToiture: '',
  luminosite: 0,
  calme: 0,
  volumes: 0,
  pointsForts: [],
  pointsFaibles: [],
  pointFortCustom: '',
  pointFaibleCustom: '',
  nuisances: [],
  nuisanceDetail: '',
  objectionsAcheteurs: '',
  notesLibres: '',
  impressionGenerale: 0,
  travauxEstimes: '',
  montantTravauxEstime: '',
  urgenceTravaux: undefined,
  potentielAmelioration: '',
  potentielAgrandissement: false,
  potentielDivision: false
};

export const defaultPhotos: Photos = {
  items: [],
  syncStatus: 'synced',
  lastSyncDate: ''
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
  valeurGage: '',
  tauxGage: 80,
  prixEntre: '',
  prixEt: '',
  prixRecommande: '',
  typeMiseEnVente: 'public',
  pourcOffmarket: 15,
  pourcComingsoon: 10,
  pourcPublic: 6,
  comparablesVendus: [],
  comparablesEnVente: [],
  justificationPrix: '',
  notesEstimation: ''
};

export const defaultPhaseDurees: PhaseDurees = {
  phase0: 1,
  phase1: 3,
  phase2: 2,
  phase3: 10
};

export const defaultStrategiePitch: StrategiePitch = {
  canauxActifs: ['reseau', 'photo'],
  canauxDetails: [],
  leviers: [],
  leviersDetails: [],
  notesStrategie: '',
  etapesCochees: [],
  etapesDetails: [],
  dateRdvRemise: '',
  dateDebut: '',
  dateVenteIdeale: '',
  phaseDurees: defaultPhaseDurees,
  phasesTimeline: [],
  phase0Actions: [],
  phase0ActionsDetails: [],
  pitchCustom: '',
  pitchGenere: undefined,
  capitalVisibilite: 100,
  alertesCourtier: [],
  pauseRecommandee: false
};

export const defaultTimeline: Timeline = {
  dateDebut: '',
  dateVenteIdeale: '',
  phaseDurees: defaultPhaseDurees,
  phase0Actions: [],
  phasesCalculees: [],
  dureeTotale: undefined,
  dateFinEstimee: ''
};

export const defaultEstimation: EstimationData = {
  statut: 'brouillon',
  identification: defaultIdentification,
  caracteristiques: defaultCaracteristiques,
  analyseTerrain: defaultAnalyseTerrain,
  preEstimation: defaultPreEstimation,
  strategiePitch: defaultStrategiePitch,
  photos: defaultPhotos,
  timeline: defaultTimeline,
  alertes: [],
  metadata: {
    versionApp: '1.0.0',
    tempsSaisie: 0,
    historiqueModifications: []
  },
  etapesCompletees: []
};

// ============================================
// Helpers & Utilitaires
// ============================================

export function getCourtierById(id: string): CourtierGARY | undefined {
  return COURTIERS_GARY.find(c => c.id === id);
}

export function getDefaultProximiteByType(type: TypeProximite): Proximite {
  const defaults: Record<TypeProximite, { icone: string; libelle: string }> = {
    transport_bus: { icone: '🚌', libelle: 'Arrêt de bus' },
    transport_tram: { icone: '🚃', libelle: 'Arrêt de tram' },
    ecole: { icone: '🏫', libelle: 'École' },
    commerce: { icone: '🛒', libelle: 'Commerces' },
    sante: { icone: '🏥', libelle: 'Pharmacie/Médecin' },
    nature: { icone: '🌳', libelle: 'Parc/Nature' }
  };
  return {
    type,
    icone: defaults[type].icone,
    libelle: defaults[type].libelle,
    distance: '',
    tempsMarche: ''
  };
}

export function isEstimationComplete(estimation: EstimationData): boolean {
  return estimation.etapesCompletees.length >= 5;
}

export function getEstimationProgress(estimation: EstimationData): number {
  return Math.round((estimation.etapesCompletees.length / 5) * 100);
}
