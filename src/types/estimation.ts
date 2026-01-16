// ============================================
// GARY - Types TypeScript pour les Estimations
// ============================================

// Enums
export type EstimationStatus = 
  | 'brouillon'           // Draft en cours de saisie
  | 'en_cours'            // En cours de finalisation
  | 'a_presenter'         // Prête à présenter
  | 'presentee'           // Présentée au client
  | 'reflexion'           // Client réfléchit
  | 'negociation'         // Négociation prix/conditions
  | 'accord_oral'         // Accord de principe
  | 'en_signature'        // Documents en cours de signature
  | 'mandat_signe'        // Mandat signé, devient actif
  | 'perdu'               // Opportunité perdue
  | 'termine'             // Legacy - mapped to presentee
  | 'archive'             // Archivé
  | 'vendu';              // Legacy - mapped to mandat_signe

export type TypeBien = 'appartement' | 'maison' | 'terrain' | 'immeuble' | 'commercial';
export type TypeMiseEnVente = 'offmarket' | 'comingsoon' | 'public';
export type NiveauContrainte = 'faible' | 'moyenne' | 'forte' | 'critique';
export type NiveauCoordination = 'legere' | 'active' | 'achat_souhaite' | 'achat_envisageable' | 'vente_seule';

// ============================================
// Status Configuration
// ============================================

export interface StatusConfig {
  label: string;
  shortLabel: string;
  color: string;       // Tailwind color class
  bgColor: string;     // Background color class
  icon: string;        // Lucide icon name
  order: number;       // Pipeline order
  isActive: boolean;   // Show in pipeline
  category: 'draft' | 'active' | 'won' | 'lost';
}

export const STATUS_CONFIG: Record<EstimationStatus, StatusConfig> = {
  brouillon: {
    label: 'Brouillon',
    shortLabel: 'Brouillon',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'FileEdit',
    order: 0,
    isActive: false,
    category: 'draft'
  },
  en_cours: {
    label: 'En cours',
    shortLabel: 'En cours',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'Loader',
    order: 1,
    isActive: true,
    category: 'draft'
  },
  a_presenter: {
    label: 'À présenter',
    shortLabel: 'À présenter',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    icon: 'Send',
    order: 2,
    isActive: true,
    category: 'active'
  },
  presentee: {
    label: 'Présentée',
    shortLabel: 'Présentée',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: 'Eye',
    order: 3,
    isActive: true,
    category: 'active'
  },
  reflexion: {
    label: 'En réflexion',
    shortLabel: 'Réflexion',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: 'Clock',
    order: 4,
    isActive: true,
    category: 'active'
  },
  negociation: {
    label: 'En négociation',
    shortLabel: 'Négo',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'MessageSquare',
    order: 5,
    isActive: true,
    category: 'active'
  },
  accord_oral: {
    label: 'Accord oral',
    shortLabel: 'Accord',
    color: 'text-lime-600',
    bgColor: 'bg-lime-100',
    icon: 'ThumbsUp',
    order: 6,
    isActive: true,
    category: 'active'
  },
  en_signature: {
    label: 'En signature',
    shortLabel: 'Signature',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: 'PenTool',
    order: 7,
    isActive: true,
    category: 'active'
  },
  mandat_signe: {
    label: 'Mandat signé',
    shortLabel: 'Signé ✓',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle',
    order: 8,
    isActive: true,
    category: 'won'
  },
  perdu: {
    label: 'Perdu',
    shortLabel: 'Perdu',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
    order: 9,
    isActive: true,
    category: 'lost'
  },
  termine: {
    label: 'Terminé (legacy)',
    shortLabel: 'Terminé',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: 'Check',
    order: 10,
    isActive: false,
    category: 'won'
  },
  archive: {
    label: 'Archivé',
    shortLabel: 'Archivé',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    icon: 'Archive',
    order: 11,
    isActive: false,
    category: 'lost'
  },
  vendu: {
    label: 'Vendu (legacy)',
    shortLabel: 'Vendu',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'Trophy',
    order: 12,
    isActive: false,
    category: 'won'
  }
};

export interface StatusTransition {
  from: EstimationStatus;
  to: EstimationStatus[];
  requiresComment?: boolean;
}

export const STATUS_TRANSITIONS: StatusTransition[] = [
  { from: 'brouillon', to: ['en_cours', 'archive'] },
  { from: 'en_cours', to: ['a_presenter', 'brouillon', 'archive'] },
  { from: 'a_presenter', to: ['presentee', 'en_cours', 'archive'] },
  { from: 'presentee', to: ['reflexion', 'negociation', 'accord_oral', 'perdu'] },
  { from: 'reflexion', to: ['negociation', 'accord_oral', 'perdu', 'presentee'] },
  { from: 'negociation', to: ['accord_oral', 'reflexion', 'perdu'], requiresComment: true },
  { from: 'accord_oral', to: ['en_signature', 'negociation', 'perdu'] },
  { from: 'en_signature', to: ['mandat_signe', 'negociation', 'perdu'] },
  { from: 'mandat_signe', to: ['archive'] },
  { from: 'perdu', to: ['archive', 'reflexion'], requiresComment: true },
  { from: 'termine', to: ['presentee', 'archive'] },
  { from: 'archive', to: [] },
  { from: 'vendu', to: ['mandat_signe', 'archive'] }
];

// Helper pour obtenir les transitions autorisées
export function getAllowedTransitions(currentStatus: EstimationStatus): EstimationStatus[] {
  const transition = STATUS_TRANSITIONS.find(t => t.from === currentStatus);
  return transition?.to || [];
}

// Helper pour vérifier si un commentaire est requis
export function isCommentRequired(from: EstimationStatus, to: EstimationStatus): boolean {
  const transition = STATUS_TRANSITIONS.find(t => t.from === from);
  return transition?.requiresComment === true && (to === 'perdu' || from === 'perdu');
}

// Historique des statuts
export interface StatusHistoryEntry {
  id: string;
  status: EstimationStatus;
  previousStatus?: EstimationStatus;
  timestamp: string;
  userId: string;
  userName: string;
  comment?: string;
  durationInPreviousStatus?: number; // En jours
}

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

export interface CadastreData {
  numeroParcelle: string;
  surfaceParcelle: number;
  zone: string;
  zoneDetail?: string;
  commune: string;
  canton: string;
  source: 'sitg' | 'swisstopo' | 'asitvd' | 'unknown';
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
  cadastreData?: CadastreData; // Données cadastre récupérées automatiquement
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

// Transports publics détaillés (pour PDF)
export interface TransportArret {
  nom: string;
  distance: string;
  tempsMarche: string;
  mode: 'bus' | 'tram' | 'bus_tram';
}

export interface TransportGare {
  nom: string;
  distance: string;
  tempsMarche: string;
}

export interface Transports {
  arret?: TransportArret;
  gare?: TransportGare;
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

// Critères d'achat structurés (pour matching automatique)
export interface CriteresAchat {
  actif: boolean;                    // Le client cherche activement ?
  zones: string[];                   // Communes recherchées (ex: ["Genève", "Carouge"])
  typeRecherche: 'Appartement' | 'Maison' | 'Les deux' | '';
  piecesMin: number;                 // Minimum de pièces (ex: 3.5)
  surfaceMin?: number;               // Minimum m² (optionnel)
  budgetMin: number;                 // Budget minimum (ex: 1000000)
  budgetMax: number;                 // Budget maximum (ex: 1500000)
  flexibiliteBudget?: number;        // % de flexibilité (ex: 10 = +/- 10%)
  dateExpiration?: string;           // Jusqu'à quand valide (ISO date)
  urgence?: 'haute' | 'moyenne' | 'basse';
  commentaire?: string;              // Notes libres si besoin
}

export const defaultCriteresAchat: CriteresAchat = {
  actif: true,
  zones: [],
  typeRecherche: '',
  piecesMin: 0,
  surfaceMin: undefined,
  budgetMin: 0,
  budgetMax: 0,
  flexibiliteBudget: 10,
  dateExpiration: '',
  urgence: 'moyenne',
  commentaire: ''
};

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
  
  // NOUVEAU : Critères structurés pour matching
  criteresAchat?: CriteresAchat;
  
  // DEPRECATED (garder pour compatibilité mais ne plus utiliser)
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
  transports?: Transports; // Transports publics détaillés
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
  
  // Précision cubage SIA (optionnel)
  surfaceSousSol?: string; // Auto-calculé: utile - habitable, modifiable
  hauteurSousPlafond?: string; // Défaut 2.7m
  hauteurSousSol?: string; // Défaut 2.4m
  comblesType?: 'non_amenageables' | 'amenageables' | 'deja_amenages' | '';
  
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
  
  // Annexes luxe appartement (piscine_int, hammam, sauna, jacuzzi, etc.)
  annexesAppart: string[];
  
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

export type PhotoCategorie = 
  | 'exterieur' 
  | 'sejour' 
  | 'cuisine' 
  | 'chambre' 
  | 'sdb' 
  | 'autre' 
  | 'vue' 
  | 'parking'
  | 'salon'
  | 'bureau'
  | 'cave'
  | 'grenier'
  | 'jardin'
  | 'terrasse'
  | 'balcon'
  | 'entree'
  | 'couloir'
  | 'defaut'; // Photo montrant un défaut

export interface PhotoCategorieConfig {
  value: PhotoCategorie;
  label: string;
  emoji: string;
  order: number;
}

export const PHOTO_CATEGORIES: PhotoCategorieConfig[] = [
  { value: 'exterieur', label: 'Extérieur', emoji: '🏠', order: 1 },
  { value: 'entree', label: 'Entrée', emoji: '🚪', order: 2 },
  { value: 'sejour', label: 'Séjour', emoji: '🛋️', order: 3 },
  { value: 'salon', label: 'Salon', emoji: '🪑', order: 4 },
  { value: 'cuisine', label: 'Cuisine', emoji: '🍳', order: 5 },
  { value: 'chambre', label: 'Chambre', emoji: '🛏️', order: 6 },
  { value: 'bureau', label: 'Bureau', emoji: '💼', order: 7 },
  { value: 'sdb', label: 'Salle de bain', emoji: '🚿', order: 8 },
  { value: 'couloir', label: 'Couloir', emoji: '🚶', order: 9 },
  { value: 'balcon', label: 'Balcon', emoji: '🌿', order: 10 },
  { value: 'terrasse', label: 'Terrasse', emoji: '☀️', order: 11 },
  { value: 'jardin', label: 'Jardin', emoji: '🌳', order: 12 },
  { value: 'vue', label: 'Vue', emoji: '🌄', order: 13 },
  { value: 'parking', label: 'Parking', emoji: '🚗', order: 14 },
  { value: 'cave', label: 'Cave', emoji: '📦', order: 15 },
  { value: 'grenier', label: 'Grenier', emoji: '🏚️', order: 16 },
  { value: 'defaut', label: 'Défaut', emoji: '⚠️', order: 17 },
  { value: 'autre', label: 'Autre', emoji: '📷', order: 18 },
];

export function getCategorieConfig(categorie?: PhotoCategorie): PhotoCategorieConfig {
  return PHOTO_CATEGORIES.find(c => c.value === categorie) || PHOTO_CATEGORIES[PHOTO_CATEGORIES.length - 1];
}

// Suggestions de titres par catégorie
export const TITRE_SUGGESTIONS: Record<PhotoCategorie, string[]> = {
  exterieur: ['Façade principale', 'Façade arrière', 'Vue d\'ensemble', 'Entrée immeuble'],
  entree: ['Hall d\'entrée', 'Porte d\'entrée', 'Dégagement entrée', 'Vestibule'],
  sejour: ['Séjour lumineux', 'Espace de vie', 'Double séjour', 'Séjour avec cheminée'],
  salon: ['Salon spacieux', 'Coin salon', 'Salon double exposition', 'Salon avec vue'],
  cuisine: ['Cuisine équipée', 'Cuisine ouverte', 'Coin repas', 'Cuisine rénovée', 'Cuisine Miele/Siemens'],
  chambre: ['Chambre parentale', 'Chambre enfant', 'Chambre avec dressing', 'Suite parentale'],
  bureau: ['Bureau lumineux', 'Espace de travail', 'Bureau avec rangements', 'Home office'],
  sdb: ['Salle de bain moderne', 'Salle d\'eau', 'Salle de bain rénovée', 'Baignoire balnéo'],
  couloir: ['Couloir de distribution', 'Dégagement', 'Couloir avec rangements'],
  balcon: ['Balcon ensoleillé', 'Balcon couvert', 'Loggia', 'Balcon avec vue'],
  terrasse: ['Terrasse plein sud', 'Terrasse panoramique', 'Rooftop', 'Terrasse aménagée'],
  jardin: ['Jardin arboré', 'Jardin privatif', 'Jardin paysager', 'Jardin avec piscine'],
  vue: ['Vue dégagée', 'Vue panoramique', 'Vue sur le lac', 'Vue sur les Alpes', 'Vue sur le jardin'],
  parking: ['Place de parking', 'Box fermé', 'Garage privé', 'Parking souterrain'],
  cave: ['Cave privative', 'Local de stockage', 'Cave à vin', 'Grande cave'],
  grenier: ['Grenier aménageable', 'Combles', 'Espace sous toiture', 'Grenier isolé'],
  defaut: ['Fissure à traiter', 'Humidité visible', 'Travaux à prévoir', 'Point à surveiller'],
  autre: ['Photo du bien', 'Détail intérieur', 'Vue complémentaire'],
};

export function getTitreSuggestions(categorie?: PhotoCategorie): string[] {
  if (!categorie) return TITRE_SUGGESTIONS.autre;
  return TITRE_SUGGESTIONS[categorie] || TITRE_SUGGESTIONS.autre;
}

export interface Photo {
  id: string;
  dataUrl: string;
  storageUrl?: string; // URL Supabase Storage publique
  storagePath?: string; // Chemin dans le bucket (pour suppression)
  thumbnailUrl?: string;
  nom: string;
  date: string;
  uploaded: boolean;
  uploading?: boolean;
  driveUrl?: string;
  categorie?: PhotoCategorie;
  ordre?: number;
  favori?: boolean;
  tailleFichier?: number; // Taille en bytes
  dimensionsOriginales?: { width: number; height: number };
  
  // Annotations (NOUVEAU)
  titre?: string;             // Ex: "Cuisine équipée"
  description?: string;       // Ex: "État impeccable, rénovée en 2022"
  defaut?: boolean;           // Si c'est une photo de défaut à noter
  uploadedAt?: string;        // ISO timestamp
  uploadedBy?: string;        // ID ou nom du courtier
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
  surfaceParcelle?: string; // Pour maisons - surface terrain
  typeMaison?: string; // individuelle, mitoyenne, jumelle
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
  valeurLocativeEstimee?: string; // Valeur locative annuelle estimée (si pas de loyer mensuel)
  tauxCapitalisation: number; // Défaut: 3.5%
  tauxChargesLocatives?: number; // Défaut: 10% (déduction charges)
  
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

// Entrée de modification individuelle (pour tracking détaillé)
export interface ModificationEntry {
  id: string;                    // UUID
  timestamp: string;             // ISO datetime
  userId: string;                // ID utilisateur
  userName: string;              // "Grégory Courtier"
  module: string;                // 'identification' | 'caracteristiques' | etc.
  field: string;                 // Champ modifié (ex: 'prixRecommande')
  oldValue: unknown;             // Ancienne valeur
  newValue: unknown;             // Nouvelle valeur
  action: 'create' | 'update' | 'delete';
}

// Version/Snapshot d'une estimation
export interface EstimationVersion {
  id?: string;
  estimationId: string;
  versionNumber: number;         // 1, 2, 3...
  createdAt: string;
  createdBy: string;
  createdById?: string;
  label?: string;                // "Version présentée client"
  snapshot: Partial<EstimationData>; // État complet à ce moment
}

export interface EstimationMetadata {
  versionApp: string;
  tempsSaisie?: number; // En minutes
  dernierModificateur?: string;
  historiqueModifications?: ModificationAudit[];
  verrouille?: boolean;
  dateVerrouillage?: string;
  motifVerrouillage?: string;
  // Versioning
  currentVersion?: number;
  lastVersionDate?: string;
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
  criteresAchat: undefined,
  // DEPRECATED fields
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
  // Précision cubage SIA
  surfaceSousSol: '',
  hauteurSousPlafond: '',
  hauteurSousSol: '',
  comblesType: '',
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
  annexesAppart: [],
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
  valeurLocativeEstimee: '',
  tauxCapitalisation: 3.5,
  tauxChargesLocatives: 10,
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
