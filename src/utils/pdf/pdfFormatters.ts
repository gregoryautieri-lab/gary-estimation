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
 * Labels pour les réseaux sociaux
 */
export const reseauxSociauxLabels: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube'
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

/**
 * Labels pour les sous-types de biens
 */
export const sousTypeLabels: Record<string, string> = {
  // Appartements
  standard: 'Standard',
  studio: 'Studio',
  duplex: 'Duplex',
  attique: 'Attique',
  loft: 'Loft',
  rez_jardin: 'Rez-de-jardin',
  // Maisons
  villa_individuelle: 'Villa individuelle',
  villa_mitoyenne: 'Villa mitoyenne',
  villa_jumelle: 'Villa jumelée',
  ferme: 'Ferme',
  chalet: 'Chalet',
  maison_village: 'Maison de village'
};

/**
 * Labels pour les zones géographiques
 */
export const zoneLabels: Record<string, string> = {
  geneve_centre: 'Genève Centre',
  geneve_rive_gauche: 'Rive Gauche',
  geneve_rive_droite: 'Rive Droite',
  carouge: 'Carouge',
  champel: 'Champel',
  eaux_vives: 'Eaux-Vives',
  plainpalais: 'Plainpalais',
  servette: 'Servette',
  petit_saconnex: 'Petit-Saconnex',
  grand_saconnex: 'Grand-Saconnex',
  vernier: 'Vernier',
  meyrin: 'Meyrin',
  lancy: 'Lancy',
  onex: 'Onex',
  bernex: 'Bernex',
  confignon: 'Confignon',
  plan_les_ouates: 'Plan-les-Ouates',
  veyrier: 'Veyrier',
  troinex: 'Troinex',
  collonge_bellerive: 'Collonge-Bellerive',
  cologny: 'Cologny',
  vandoeuvres: 'Vandoeuvres',
  chene_bougeries: 'Chêne-Bougeries',
  chene_bourg: 'Chêne-Bourg',
  thonex: 'Thônex',
  presinge: 'Presinge',
  puplinge: 'Puplinge',
  jussy: 'Jussy',
  gy: 'Gy',
  hermance: 'Hermance',
  anières: 'Anières',
  corsier: 'Corsier',
  bellevue: 'Bellevue',
  genthod: 'Genthod',
  pregny_chambesy: 'Pregny-Chambésy',
  satigny: 'Satigny',
  russin: 'Russin',
  dardagny: 'Dardagny',
  aire_la_ville: 'Aire-la-Ville',
  avusy: 'Avusy',
  laconnex: 'Laconnex',
  soral: 'Soral',
  cartigny: 'Cartigny',
  perly_certoux: 'Perly-Certoux',
  bardonnex: 'Bardonnex',
  compesieres: 'Compesières',
  france_voisine: 'France voisine',
  vaud: 'Canton de Vaud',
  autre: 'Autre'
};

/**
 * Labels pour la buanderie
 */
export const buanderieLabels: Record<string, string> = {
  privee: 'Privée',
  commune: 'Commune',
  aucune: 'Aucune',
  dans_appartement: 'Dans l\'appartement'
};

/**
 * Labels pour les motifs de vente
 */
export const motifLabels: Record<string, string> = {
  demenagement: 'Déménagement',
  succession: 'Succession',
  divorce: 'Divorce/Séparation',
  investissement: 'Investissement',
  agrandissement: 'Agrandissement',
  retraite: 'Retraite',
  difficultes_financieres: 'Difficultés financières',
  changement_vie: 'Changement de vie',
  autre: 'Autre'
};

/**
 * Labels pour le type de chauffage
 */
export const chauffageLabels: Record<string, string> = {
  mazout: 'Mazout',
  gaz: 'Gaz',
  pac: 'Pompe à chaleur',
  pellets: 'Pellets',
  bois: 'Bois',
  electrique: 'Électrique',
  cad: 'CAD (chauffage à distance)',
  solaire: 'Solaire',
  mixte: 'Mixte',
  autre: 'Autre'
};

/**
 * Labels pour l'état général
 */
export const etatLabels: Record<string, string> = {
  neuf: 'Neuf',
  tres_bon: 'Très bon',
  bon: 'Bon',
  moyen: 'Moyen',
  a_renover: 'À rénover',
  a_rafraichir: 'À rafraîchir'
};

/**
 * Labels pour l'exposition/orientation
 */
export const expositionLabels: Record<string, string> = {
  nord: 'Nord',
  nord_est: 'Nord-Est',
  est: 'Est',
  sud_est: 'Sud-Est',
  sud: 'Sud',
  sud_ouest: 'Sud-Ouest',
  ouest: 'Ouest',
  nord_ouest: 'Nord-Ouest',
  traversant: 'Traversant'
};

/**
 * Labels pour le standing
 */
export const standingLabels: Record<string, string> = {
  standard: 'Standard',
  standing: 'Standing',
  luxe: 'Luxe',
  prestige: 'Prestige'
};

/**
 * Labels pour l'horizon de vente
 */
export const horizonLabels: Record<string, string> = {
  urgent: 'Urgent (< 3 mois)',
  court: 'Court terme (3-6 mois)',
  moyen: 'Moyen terme (6-12 mois)',
  long: 'Long terme (> 12 mois)',
  flexible: 'Flexible'
};

/**
 * Labels pour le type de mandat
 */
export const mandatLabels: Record<string, string> = {
  exclusif: 'Exclusif',
  semi_exclusif: 'Semi-exclusif',
  simple: 'Simple',
  recherche: 'Recherche'
};

/**
 * Labels CECB
 */
export const cecbLabels: Record<string, string> = {
  A: 'A - Très efficace',
  B: 'B - Efficace',
  C: 'C - Assez efficace',
  D: 'D - Moyen',
  E: 'E - Peu efficace',
  F: 'F - Inefficace',
  G: 'G - Très inefficace',
  inconnu: 'Non communiqué'
};
