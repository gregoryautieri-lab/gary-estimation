// Types pour le module Inbox Leads

export interface Partner {
  id: string;
  created_at: string;
  updated_at: string;
  societe: string;
  nom: string | null;
  type: 'banque' | 'notaire' | 'avocat' | 'architecte' | 'courtier_ext' | 'regie' | 'promoteur' | 'autre' | null;
  contact_nom: string | null;
  contact_role: string | null;
  contact_email: string | null;
  contact_tel: string | null;
  retro_default_type: 'pourcentage' | 'fixe' | 'aucune' | null;
  retro_default_valeur: number | null;
  notes: string | null;
  is_active: boolean;
}

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  source: 'boitage' | 'reseaux_sociaux' | 'telephone' | 'recommandation' | 'partenariat' | 'site_web' | 'salon' | 'autre';
  source_detail: string | null;
  partner_id: string | null;
  partner?: Partner;
  campagne_id: string | null;
  campagne?: { code: string; commune: string };
  retro_type: 'pourcentage' | 'fixe' | null;
  retro_valeur: number | null;
  recommande_par: string | null;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  type_demande: 'estimation' | 'a_qualifier';
  statut: 'nouveau' | 'en_cours' | 'converti' | 'perdu';
  perdu_raison: string | null;
  assigned_to: string | null;
  assigned_user?: { full_name: string | null; email: string | null };
  rappel_date: string | null;
  estimation_id: string | null;
  converti_at: string | null;
  bien_adresse: string | null;
  bien_npa: string | null;
  bien_localite: string | null;
  bien_type: 'appartement' | 'villa' | 'immeuble' | 'terrain' | 'commercial' | 'autre' | null;
  notes: string | null;
  created_by: string | null;
}

// Type aliases pour les enums
export type LeadSource = Lead['source'];
export type LeadStatut = Lead['statut'];
export type LeadTypeDemande = Lead['type_demande'];
export type PartnerType = NonNullable<Partner['type']>;
export type RetroType = NonNullable<Partner['retro_default_type']>;
export type BienType = NonNullable<Lead['bien_type']>;

// Options pour les selects
export const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'boitage', label: 'Boîtage' },
  { value: 'reseaux_sociaux', label: 'Réseaux sociaux' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'recommandation', label: 'Recommandation' },
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'site_web', label: 'Site web' },
  { value: 'salon', label: 'Salon' },
  { value: 'autre', label: 'Autre' },
];

export const LEAD_STATUT_OPTIONS: { value: LeadStatut; label: string; color: string }[] = [
  { value: 'nouveau', label: 'Nouveau', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'converti', label: 'Converti', color: 'bg-green-100 text-green-800' },
  { value: 'perdu', label: 'Perdu', color: 'bg-red-100 text-red-800' },
];

export const LEAD_TYPE_DEMANDE_OPTIONS: { value: LeadTypeDemande; label: string }[] = [
  { value: 'estimation', label: 'Estimation' },
  { value: 'a_qualifier', label: 'À qualifier' },
];

export const PARTNER_TYPE_OPTIONS: { value: PartnerType; label: string }[] = [
  { value: 'banque', label: 'Banque' },
  { value: 'notaire', label: 'Notaire' },
  { value: 'avocat', label: 'Avocat' },
  { value: 'architecte', label: 'Architecte' },
  { value: 'courtier_ext', label: 'Courtier externe' },
  { value: 'regie', label: 'Régie' },
  { value: 'promoteur', label: 'Promoteur' },
  { value: 'autre', label: 'Autre' },
];

export const RETRO_TYPE_OPTIONS: { value: RetroType; label: string }[] = [
  { value: 'pourcentage', label: 'Pourcentage' },
  { value: 'fixe', label: 'Montant fixe' },
  { value: 'aucune', label: 'Aucune' },
];

export const BIEN_TYPE_OPTIONS: { value: BienType; label: string }[] = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'immeuble', label: 'Immeuble' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'autre', label: 'Autre' },
];
