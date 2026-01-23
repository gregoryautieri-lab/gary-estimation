// =============================================
// MODULE PROSPECTION - Types TypeScript
// =============================================

// ============ ÉNUMÉRATIONS ============

export type CampagneStatut = 'brouillon' | 'planifiee' | 'en_cours' | 'terminee';

export type MissionStatut = 'prevue' | 'en_cours' | 'terminee' | 'annulee';

export type TypeBienProspection = 'PPE' | 'Villa' | 'Mixte';

// ============ INTERFACES PRINCIPALES ============

export interface SupportProspection {
  id: string;
  nom: string;
  tarif_unitaire: number;
  description: string | null;
  actif: boolean;
  ordre: number;
  created_at: string;
  updated_at: string;
}

export interface Etudiant {
  id: string;
  user_id: string | null;
  prenom: string;
  nom: string | null;
  tel: string | null;
  email: string | null;
  salaire_horaire: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campagne {
  id: string;
  code: string;
  courtier_id: string;
  support_id: string;
  commune: string;
  secteurs: string[] | null;
  type_bien: TypeBienProspection;
  nb_courriers: number;
  nb_flyers: number;
  cout_unitaire_courrier: number | null;
  cout_unitaire_flyer: number;
  cout_total: number;
  uniqode_id: string | null;
  qr_destination_url: string | null;
  qr_image_url: string | null;
  scans_count: number;
  date_debut: string | null;
  date_fin: string | null;
  statut: CampagneStatut;
  nb_prospects: number;
  nb_estimations: number;
  nb_mandats: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Champs d'archivage (soft delete)
  archived_at: string | null;
  archived_by: string | null;
  // Champs de jointure optionnels
  courtier_name?: string;
  courtier_email?: string;
  support?: SupportProspection;
}

export interface Mission {
  id: string;
  campagne_id: string;
  etudiant_id: string | null;
  courtier_id: string | null;
  date: string;
  secteur_nom: string | null;
  zone_image_url: string | null;
  zone_geojson: any | null;
  courriers_prevu: number;
  statut: MissionStatut;
  courriers_distribues: number | null;
  strava_screenshot_url: string | null;
  strava_screenshots: string[] | null;
  strava_temps: string | null;
  strava_distance_km: number | null;
  strava_vitesse_moy: number | null;
  strava_validated: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Champs de jointure optionnels
  campagne?: Campagne;
  etudiant?: Etudiant;
  courtier_name?: string;
}

// ============ INTERFACES UTILITAIRES ============

export interface StravaData {
  valid?: boolean;
  temps?: string;
  distance_km?: number;
  vitesse_moy_kmh?: number;
  vitesse_moy?: number; // Alias pour compatibilité hooks
  date?: string;
}

export type SupportProspectionFormData = Omit<SupportProspection, 'id' | 'created_at' | 'updated_at'>;

export interface CampagneStats {
  cout_par_scan: number | null;
  cout_par_prospect: number | null;
  cout_par_estimation: number | null;
  taux_scan_prospect: number;
  taux_prospect_estimation: number;
  taux_estimation_mandat: number;
}

// ============ INTERFACES FILTRES ============

export interface CampagneFilters {
  statut: CampagneStatut | null;
  courtier_id: string | null;
  support_id: string | null;
  date_debut: string | null;
  date_fin: string | null;
}

export interface MissionFilters {
  campagne_id: string | null;
  etudiant_id: string | null;
  courtier_id: string | null;
  statut: MissionStatut | null;
  date_debut: string | null;
  date_fin: string | null;
}

// ============ TYPES FORMULAIRES ============

export type SupportFormData = Omit<SupportProspection, 'id' | 'created_at' | 'updated_at'>;

export type EtudiantFormData = Omit<Etudiant, 'id' | 'created_at' | 'updated_at'>;

export type CampagneFormData = Omit<
  Campagne,
  | 'id'
  | 'code'
  | 'cout_total'
  | 'scans_count'
  | 'nb_prospects'
  | 'nb_estimations'
  | 'nb_mandats'
  | 'created_at'
  | 'updated_at'
  | 'courtier_name'
  | 'courtier_email'
  | 'support'
>;

export type MissionFormData = Omit<
  Mission,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'campagne'
  | 'etudiant'
  | 'courtier_name'
>;

// ============ TYPES POUR MUTATIONS ÉTUDIANT ============

export interface MissionEtudiantUpdate {
  statut?: MissionStatut;
  courriers_distribues?: number;
  strava_screenshot_url?: string;
  strava_screenshots?: string[];
  strava_temps?: string;
  strava_distance_km?: number;
  strava_vitesse_moy?: number;
  strava_validated?: boolean;
  notes?: string;
}

// ============ CONSTANTES ============

export const CAMPAGNE_STATUT_LABELS: Record<CampagneStatut, string> = {
  brouillon: 'Brouillon',
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
};

export const MISSION_STATUT_LABELS: Record<MissionStatut, string> = {
  prevue: 'Prévue',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const TYPE_BIEN_PROSPECTION_LABELS: Record<TypeBienProspection, string> = {
  PPE: 'PPE',
  Villa: 'Villa',
  Mixte: 'Mixte',
};

export const CAMPAGNE_STATUT_COLORS: Record<CampagneStatut, string> = {
  brouillon: 'bg-gray-100 text-gray-700',
  planifiee: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-amber-100 text-amber-700',
  terminee: 'bg-green-100 text-green-700',
};

export const MISSION_STATUT_COLORS: Record<MissionStatut, string> = {
  prevue: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-amber-100 text-amber-700',
  terminee: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
};

// ============ VALEURS PAR DÉFAUT ============

export const defaultCampagneFormData: Partial<CampagneFormData> = {
  type_bien: 'Mixte',
  nb_courriers: 0,
  nb_flyers: 0,
  cout_unitaire_flyer: 0.09,
  statut: 'brouillon',
};

export const defaultMissionFormData: Partial<MissionFormData> = {
  courriers_prevu: 0,
  statut: 'prevue',
  strava_validated: false,
};

export const defaultEtudiantFormData: Partial<EtudiantFormData> = {
  salaire_horaire: 18.00,
  actif: true,
};

export const defaultSupportFormData: Partial<SupportFormData> = {
  actif: true,
  ordre: 0,
};
