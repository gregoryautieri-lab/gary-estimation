/**
 * Fonctions utilitaires de formatage pour le PDF GARY
 * Extraites du fichier source original
 */

/**
 * Retourne la valeur ou '-' si vide/null/undefined
 */
export function val(v: unknown): string {
  return v ? String(v) : '-';
}

/**
 * Formate un prix en CHF suisse (ex: 1'250'000 CHF)
 */
export function formatPrice(amount: number): string {
  if (!amount || isNaN(amount)) return '-';
  return amount.toLocaleString('fr-CH') + ' CHF';
}

/**
 * Formate un prix sans le suffixe CHF
 */
export function formatPriceShort(amount: number): string {
  if (!amount || isNaN(amount)) return '-';
  return amount.toLocaleString('fr-CH');
}

/**
 * Formate une date au format suisse (ex: 15.01.2025)
 */
export function formatDateCH(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-CH');
}

/**
 * Formate une heure au format suisse (ex: 14:30)
 */
export function formatTimeCH(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Arrondit un nombre au multiple de 5000 supérieur
 */
export function roundTo5000(value: number): number {
  return Math.ceil(value / 5000) * 5000;
}

/**
 * Parse un nombre depuis une string (gère les formats suisses)
 */
export function parseNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  // Supprime les séparateurs de milliers et remplace virgule par point
  const cleaned = value.replace(/[']/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Calcule le prochain lundi à partir d'une date
 */
export function getNextMonday(fromDate?: Date): Date {
  const date = fromDate ? new Date(fromDate) : new Date();
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

/**
 * Ajoute des semaines à une date
 */
export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

/**
 * Formate une date au format "semaine du DD/MM"
 */
export function formatWeekOf(date: Date): string {
  return 'Semaine du ' + date.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit' });
}

/**
 * Labels pour les portails immobiliers
 */
export const portailsLabels: Record<string, string> = {
  immoscout: 'Immoscout',
  homegate: 'Homegate',
  acheterlouer: 'Acheter-Louer',
  anibis: 'Anibis',
  immostreet: 'ImmoStreet',
  autres: 'Autres'
};

/**
 * Labels pour les durées de diffusion
 */
export const dureeLabels: Record<string, string> = {
  'moins1mois': '< 1 mois',
  '1-3mois': '1-3 mois',
  '3-6mois': '3-6 mois',
  '6-12mois': '6-12 mois',
  'plus12mois': '> 12 mois'
};

/**
 * Labels pour les types de diffusion
 */
export const typeDiffusionLabels: Record<string, string> = {
  discrete: 'Discrète',
  moderee: 'Modérée',
  massive: 'Massive'
};

/**
 * Labels pour les raisons d'échec
 */
export const raisonEchecLabels: Record<string, string> = {
  prix: 'Prix trop élevé',
  photos: 'Mauvaises photos',
  timing: 'Mauvais timing',
  etatbien: 'État du bien',
  vendeur: 'Vendeur pas prêt',
  agence: 'Mauvais suivi agence',
  marche: 'Marché difficile',
  autre: 'Autre'
};

/**
 * Labels pour les nuisances
 */
export const nuisanceLabels: Record<string, string> = {
  bruit_route: 'Bruit routier',
  bruit_avion: 'Bruit aérien',
  bruit_train: 'Bruit ferroviaire',
  bruit_voisins: 'Voisinage bruyant',
  vis_a_vis: 'Vis-à-vis',
  pollution: 'Pollution',
  odeurs: 'Odeurs',
  antenne: 'Antenne/pylône',
  chantier: 'Chantier à proximité',
  autre: 'Autre nuisance'
};

/**
 * Labels pour les rénovations
 */
export const renoLabels: Record<string, string> = {
  cuisine: 'Cuisine',
  sdb: 'Salle de bain',
  sols: 'Sols',
  fenetres: 'Fenêtres',
  chauffage: 'Chauffage',
  electrique: 'Électricité',
  facade: 'Façade',
  toiture: 'Toiture',
  isolation: 'Isolation'
};

/**
 * Labels pour les travaux à prévoir
 */
export const travLabels: Record<string, string> = {
  cuisine: 'Cuisine à refaire',
  sdb: 'SDB à refaire',
  sols: 'Sols à refaire',
  peinture: 'Peinture',
  fenetres: 'Fenêtres à changer',
  chauffage: 'Chauffage à remplacer',
  electrique: 'Mise aux normes élec.',
  toiture: 'Toiture à refaire',
  facade: 'Ravalement façade'
};
