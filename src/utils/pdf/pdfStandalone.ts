/**
 * GARY PDF Standalone Generator
 * 
 * Générateur PDF autonome et complet basé sur le code source GARY.
 * Ce fichier contient toute l'intelligence métier, les styles CSS et
 * la génération HTML pour un PDF haute qualité.
 * 
 * @version 2.0
 * @author GARY Team
 */

import { EstimationData, COURTIERS_GARY } from '@/types/estimation';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// CONSTANTES GARY
// ============================================

const GARY_TEL = '+41 22 700 50 00';
const GARY_ADDRESS = 'Rue du Rhône 14, 1204 Genève';

const STATS_MARKETING = {
  vues: '6.6M+',
  communaute: '40K+',
  note: '5.0★',
  delai: '3.5 mois'
};

// ============================================
// LOGOS SVG (inline)
// ============================================

const logoWhite = '<svg viewBox="0 0 1372 309"><g fill="#FFFFFF"><path d="M12,156.2C12,72.9,73.2,9.4,162.1,9.4c58.5,0,102.7,25.5,127,62l-42.8,27.8c-15.7-26.5-44.7-44.1-84.2-44.1c-57.8,0-96.3,43.4-96.3,101.1c0,58.1,38.6,101.9,96.3,101.9c47.2,0,81-26.3,89.6-68.5h-92.5v-43.9h151c0,93.3-57.2,157.4-148.1,157.4C73.2,303,12,239.5,12,156.2z"/><path d="M505.7,15.2h57l114.6,282.1h-53.5L594.4,223H474l-29.4,74.3h-53.3L505.7,15.2z M577.9,178.5L534.3,67.7l-43.8,110.7H577.9z"/><path d="M787.6,15.2h100.4c69.1,0,101.1,32.2,101.1,80.2c0,40.1-26.1,71-76,77.3l110.3,124.5h-63.1L854.7,175.8h-16.5v121.5h-50.7V15.2z M883.7,134.1c34.7,0,51.4-13.2,51.4-38.2c0-24.9-16.7-38.2-51.4-38.2h-45.5v76.4H883.7z"/><path d="M1192.1,177.1l-112.3-162h56.6l81.2,119.5l81.2-119.5h56.4l-112.4,162v120.1h-50.7V177.1z"/></g></svg>';

const logoRed = '<svg viewBox="0 0 1372 309"><g fill="#FF4539"><path d="M12,156.2C12,72.9,73.2,9.4,162.1,9.4c58.5,0,102.7,25.5,127,62l-42.8,27.8c-15.7-26.5-44.7-44.1-84.2-44.1c-57.8,0-96.3,43.4-96.3,101.1c0,58.1,38.6,101.9,96.3,101.9c47.2,0,81-26.3,89.6-68.5h-92.5v-43.9h151c0,93.3-57.2,157.4-148.1,157.4C73.2,303,12,239.5,12,156.2z"/><path d="M505.7,15.2h57l114.6,282.1h-53.5L594.4,223H474l-29.4,74.3h-53.3L505.7,15.2z M577.9,178.5L534.3,67.7l-43.8,110.7H577.9z"/><path d="M787.6,15.2h100.4c69.1,0,101.1,32.2,101.1,80.2c0,40.1-26.1,71-76,77.3l110.3,124.5h-63.1L854.7,175.8h-16.5v121.5h-50.7V15.2z M883.7,134.1c34.7,0,51.4-13.2,51.4-38.2c0-24.9-16.7-38.2-51.4-38.2h-45.5v76.4H883.7z"/><path d="M1192.1,177.1l-112.3-162h56.6l81.2,119.5l81.2-119.5h56.4l-112.4,162v120.1h-50.7V177.1z"/></g></svg>';

// ============================================
// ICÔNES SVG (Lucide-like)
// ============================================

const iconPaths: Record<string, string> = {
  surface: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
  pieces: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  chambres: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  etage: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  construction: '<path d="M2 20h20"/><path d="M5 20V8.5l6-4.5 6 4.5V20"/><path d="M5 8.5h12"/>',
  tree: '<path d="M12 22v-7"/><path d="M9 9l3-7 3 7"/><path d="M4 14l8-5 8 5"/>',
  parking: '<circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trendingUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  trendingDown: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
};

function ico(name: string, size: number = 20, color: string = '#64748b'): string {
  const path = iconPaths[name] || iconPaths.circle;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

// ============================================
// LABELS & MAPPINGS
// ============================================

const motifLabels: Record<string, string> = {
  vente_classique: 'Vente classique',
  succession: 'Succession',
  divorce: 'Divorce',
  demenagement: 'Déménagement',
  investissement: 'Investissement',
  agrandissement: 'Agrandissement famille',
  retraite: 'Retraite',
  difficultes_financieres: 'Difficultés financières',
  expatriation: 'Expatriation',
  autre: 'Autre'
};

const horizonLabels: Record<string, string> = {
  urgent: '< 3 mois',
  standard: '3-6 mois',
  flexible: '6-12 mois',
  exploration: '> 12 mois'
};

const dureeLabels: Record<string, string> = {
  moins1mois: '< 1 mois',
  '1-3mois': '1-3 mois',
  '3-6mois': '3-6 mois',
  '6-12mois': '6-12 mois',
  plus12mois: '> 12 mois'
};

const typeDiffusionLabels: Record<string, string> = {
  discrete: 'Discrète',
  moderee: 'Modérée',
  massive: 'Massive'
};

const portailsLabels: Record<string, string> = {
  immoscout: 'Immoscout',
  homegate: 'Homegate',
  acheterlouer: 'Acheter-Louer',
  anibis: 'Anibis',
  immostreet: 'ImmoStreet',
  autres: 'Autres'
};

const raisonEchecLabels: Record<string, string> = {
  prix: 'Prix trop élevé',
  photos: 'Mauvaises photos',
  timing: 'Mauvais timing',
  etatbien: 'État du bien',
  vendeur: 'Vendeur pas prêt',
  agence: 'Mauvais suivi agence',
  marche: 'Marché difficile',
  autre: 'Autre'
};

const buanderieLabels: Record<string, string> = {
  privee: 'Privée',
  commune: 'Commune',
  aucune: 'Aucune'
};

const chauffageLabels: Record<string, string> = {
  pac: 'PAC',
  gaz: 'Gaz',
  mazout: 'Mazout',
  pellets: 'Pellets',
  electrique: 'Électrique',
  cad: 'CAD',
  geothermie: 'Géothermie',
  autre: 'Autre'
};

const diffusionLabels: Record<string, string> = {
  sol: 'Au sol',
  radiateur: 'Radiateurs',
  convecteur: 'Convecteurs',
  poele: 'Poêle',
  cheminee: 'Cheminée',
  plafond: 'Plafond'
};

const vueLabels: Record<string, string> = {
  degagee: 'Dégagée',
  lac: 'Lac',
  montagne: 'Montagne',
  campagne: 'Campagne',
  jardin: 'Jardin',
  urbaine: 'Urbaine',
  vis_a_vis: 'Vis-à-vis'
};

const nuisanceLabels: Record<string, string> = {
  bruit_rue: 'Bruit de rue',
  bruit_voisins: 'Bruit voisins',
  vis_a_vis: 'Vis-à-vis',
  odeurs: 'Odeurs',
  pollution: 'Pollution',
  autre: 'Autre'
};

const espaceLabels: Record<string, string> = {
  garage: 'Garage',
  atelier: 'Atelier',
  dependance: 'Dépendance',
  pool_house: 'Pool house',
  local_technique: 'Local technique'
};

const sousTypeLabels: Record<string, string> = {
  standard: 'Standard',
  attique: 'Attique',
  duplex: 'Duplex',
  triplex: 'Triplex',
  loft: 'Loft',
  penthouse: 'Penthouse',
  villa: 'Villa individuelle',
  villa_mitoyenne: 'Villa mitoyenne',
  villa_jumelle: 'Villa jumelle',
  propriete: 'Propriété',
  chalet: 'Chalet',
  ferme: 'Ferme'
};

// ============================================
// UTILITAIRES
// ============================================

function val(v: unknown): string {
  if (v === null || v === undefined || v === '') return '–';
  return String(v);
}

function formatPrice(amount: number): string {
  if (!amount || isNaN(amount)) return '–';
  return amount.toLocaleString('fr-CH') + ' CHF';
}

function formatPriceShort(amount: number): string {
  if (!amount || isNaN(amount)) return '–';
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(2).replace('.', ',') + ' M';
  }
  return amount.toLocaleString('fr-CH');
}

function arrondir5000(val: number): number {
  return Math.ceil(val / 5000) * 5000;
}

function parseNum(v: string | number | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-CH');
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// CALCULS MÉTIER
// ============================================

interface CalculsResult {
  // Surfaces
  surfacePPE: number;
  surfaceNonHab: number;
  surfaceBalcon: number;
  surfaceTerrasse: number;
  surfaceJardin: number;
  surfacePonderee: number;
  surfaceTerrain: number;
  surfaceUtile: number;
  surfaceHabMaison: number;
  cubage: number;
  surfaceAuSol: number;
  surfaceAmenagement: number;
  surfacePrincipale: number;
  
  // Valeurs
  valeurSurface: number;
  valeurPlaceInt: number;
  valeurPlaceExt: number;
  valeurBox: number;
  valeurCave: number;
  valeurLignesSupp: number;
  valeurTerrain: number;
  valeurCubage: number;
  valeurAmenagement: number;
  valeurAnnexes: number;
  totalVenale: number;
  totalVenaleArrondi: number;
  
  // Rendement
  loyerMensuel: number;
  loyerNet: number;
  loyerAnnuel: number;
  tauxCapi: number;
  valeurRendement: number;
  valeurGage: number;
  valeurGageArrondi: number;
  
  // Prix
  prixEntre: number;
  prixEt: number;
  prixMiseEnVente: number;
  
  // Annexes
  nbPlaceInt: number;
  nbPlaceExt: number;
  nbBox: number;
  hasCave: number;
}

function calculerValeurs(data: EstimationData): CalculsResult {
  const carac = data.caracteristiques || {} as EstimationData['caracteristiques'];
  const pre = data.preEstimation || {} as EstimationData['preEstimation'];
  const isAppartement = carac?.typeBien === 'appartement';
  
  // Surfaces
  const surfacePPE = parseNum(carac?.surfacePPE);
  const surfaceNonHab = parseNum(carac?.surfaceNonHabitable);
  const surfaceBalcon = parseNum(carac?.surfaceBalcon);
  const surfaceTerrasse = parseNum(carac?.surfaceTerrasse);
  const surfaceJardin = parseNum(carac?.surfaceJardin);
  const surfacePonderee = surfacePPE + (surfaceNonHab * 0.5) + (surfaceBalcon * 0.5) + (surfaceTerrasse * 0.33) + (surfaceJardin * 0.1);
  const surfaceTerrain = parseNum(carac?.surfaceTerrain);
  const surfaceUtile = parseNum(carac?.surfaceUtile);
  const surfaceHabMaison = parseNum(carac?.surfaceHabitableMaison);
  const nbNiveaux = parseInt(carac?.nombreNiveaux || '') || 1;
  const cubage = parseNum(pre?.cubageManuel) || (surfaceUtile * 3.1);
  const surfaceAuSol = nbNiveaux > 0 ? surfaceHabMaison / nbNiveaux : 0;
  const surfaceAmenagement = Math.max(0, surfaceTerrain - surfaceAuSol);
  const surfacePrincipale = isAppartement ? surfacePonderee : surfaceHabMaison;
  
  // Annexes
  const nbPlaceInt = parseInt(carac?.parkingInterieur || '') || 0;
  const nbPlaceExt = parseInt(carac?.parkingExterieur || '') || 0;
  const nbBox = parseInt(carac?.box || '') || 0;
  const hasCave = carac?.cave ? 1 : 0;
  
  // Prix unitaires
  const prixM2 = parseNum(pre?.prixM2);
  const tauxVetuste = parseNum(pre?.tauxVetuste);
  const prixM2Ajuste = prixM2 * (1 - tauxVetuste / 100);
  const prixPlaceInt = parseNum(pre?.prixPlaceInt);
  const prixPlaceExt = parseNum(pre?.prixPlaceExt);
  const prixBox = parseNum(pre?.prixBox);
  const prixCave = parseNum(pre?.prixCave);
  const prixM2Terrain = parseNum(pre?.prixM2Terrain);
  const prixM3 = parseNum(pre?.prixM3);
  const tauxVetusteMaison = parseNum(pre?.tauxVetusteMaison);
  const prixM3Ajuste = prixM3 * (1 - tauxVetusteMaison / 100);
  const prixM2Amenagement = parseNum(pre?.prixM2Amenagement);
  
  // Valeurs calculées
  const valeurSurface = surfacePonderee * prixM2Ajuste;
  const valeurPlaceInt = nbPlaceInt * prixPlaceInt;
  const valeurPlaceExt = nbPlaceExt * prixPlaceExt;
  const valeurBox = nbBox * prixBox;
  const valeurCave = hasCave * prixCave;
  const valeurLignesSupp = (pre.lignesSupp || []).reduce((sum: number, l: { prix?: string }) => sum + parseNum(l.prix), 0);
  
  const valeurTerrain = surfaceTerrain * prixM2Terrain;
  const valeurCubage = cubage * prixM3Ajuste;
  const valeurAmenagement = surfaceAmenagement * prixM2Amenagement;
  const valeurAnnexes = (pre.annexes || []).reduce((sum: number, a: { prix?: string }) => sum + parseNum(a.prix), 0);
  
  const totalVenaleAppart = valeurSurface + valeurPlaceInt + valeurPlaceExt + valeurBox + valeurCave + valeurLignesSupp;
  const totalVenaleMaison = valeurTerrain + valeurCubage + valeurAmenagement + valeurAnnexes;
  const totalVenale = isAppartement ? totalVenaleAppart : totalVenaleMaison;
  const totalVenaleArrondi = arrondir5000(totalVenale);
  
  // Rendement
  const loyerMensuel = parseNum(pre.loyerMensuel);
  const loyerNet = loyerMensuel * 0.9;
  const loyerAnnuel = loyerNet * 12;
  const tauxCapi = (parseNum(pre.tauxCapitalisation) || 2.5) / 100;
  const valeurRendement = tauxCapi > 0 ? arrondir5000(loyerAnnuel / tauxCapi) : 0;
  const valeurGage = (2 * totalVenale + valeurRendement) / 3;
  const valeurGageArrondi = arrondir5000(valeurGage);
  
  // Prix
  const prixEntre = arrondir5000(totalVenale * 0.97);
  const prixEt = arrondir5000(totalVenale * 1.03);
  
  const typeMV = pre.typeMiseEnVente || 'public';
  const pourcOffmarket = parseNum(pre.pourcOffmarket) || 15;
  const pourcComingsoon = parseNum(pre.pourcComingsoon) || 10;
  const pourcPublic = parseNum(pre.pourcPublic) || 6;
  const coefMV = typeMV === 'offmarket' ? (1 + pourcOffmarket / 100) : (typeMV === 'comingsoon' ? (1 + pourcComingsoon / 100) : (1 + pourcPublic / 100));
  const prixMiseEnVente = arrondir5000(totalVenale * coefMV);
  
  return {
    surfacePPE,
    surfaceNonHab,
    surfaceBalcon,
    surfaceTerrasse,
    surfaceJardin,
    surfacePonderee,
    surfaceTerrain,
    surfaceUtile,
    surfaceHabMaison,
    cubage,
    surfaceAuSol,
    surfaceAmenagement,
    surfacePrincipale,
    valeurSurface,
    valeurPlaceInt,
    valeurPlaceExt,
    valeurBox,
    valeurCave,
    valeurLignesSupp,
    valeurTerrain,
    valeurCubage,
    valeurAmenagement,
    valeurAnnexes,
    totalVenale,
    totalVenaleArrondi,
    loyerMensuel,
    loyerNet,
    loyerAnnuel,
    tauxCapi,
    valeurRendement,
    valeurGage,
    valeurGageArrondi,
    prixEntre,
    prixEt,
    prixMiseEnVente,
    nbPlaceInt,
    nbPlaceExt,
    nbBox,
    hasCave
  };
}

interface CapitalVisibilite {
  capitalPct: number;
  capitalAlerts: Array<{ type: string; msg: string }>;
  pauseRecommandee: boolean;
}

function calculerCapitalVisibilite(data: EstimationData, totalVenale: number): CapitalVisibilite {
  const historique = data.identification?.historique;
  let capitalPct = 100;
  const capitalAlerts: Array<{ type: string; msg: string }> = [];
  let pauseRecommandee = false;
  
  if (historique?.dejaDiffuse) {
    // Impact de la durée
    let dureeImpact = 0;
    const duree = historique.duree || '';
    if (duree === 'moins1mois') dureeImpact = 5;
    else if (duree === '1-3mois') dureeImpact = 15;
    else if (duree === '3-6mois') dureeImpact = 30;
    else if (duree === '6-12mois') dureeImpact = 50;
    else if (duree === 'plus12mois') dureeImpact = 65;
    
    // Impact du type de diffusion
    let diffusionImpact = 0;
    const typeDiff = historique.typeDiffusion || '';
    if (typeDiff === 'discrete') diffusionImpact = 5;
    else if (typeDiff === 'moderee') diffusionImpact = 15;
    else if (typeDiff === 'massive') diffusionImpact = 30;
    
    capitalPct = 100 - dureeImpact - diffusionImpact;
    
    // Bonus si diffusion discrète longue
    if (typeDiff === 'discrete' && dureeImpact > 15) {
      capitalPct += 10;
    }
    
    // Malus si diffusion massive longue
    if (typeDiff === 'massive' && ['3-6mois', '6-12mois', 'plus12mois'].includes(duree)) {
      capitalPct -= 10;
    }
    
    capitalPct = Math.max(10, Math.min(100, capitalPct));
    
    if (capitalPct < 40) {
      pauseRecommandee = true;
      capitalAlerts.push({ type: 'critical', msg: 'Pause commerciale de 2-3 semaines recommandée avant toute nouvelle action' });
      capitalAlerts.push({ type: 'info', msg: 'Réinventer l\'objet : nouvelles photos, vidéo, brochure repensée' });
    }
    
    // Vérifier écart de prix
    const prixAfficheNum = parseNum(historique.prixAffiche);
    if (prixAfficheNum > 0 && totalVenale > 0) {
      const ecartPrix = ((prixAfficheNum - totalVenale) / totalVenale) * 100;
      if (ecartPrix > 30) {
        capitalAlerts.push({ type: 'warning', msg: `Prix affiché précédemment (${prixAfficheNum.toLocaleString('fr-CH')} CHF) supérieur de ${ecartPrix.toFixed(0)}% à notre estimation. Repositionnement prix nécessaire.` });
      } else if (ecartPrix > 10) {
        capitalAlerts.push({ type: 'info', msg: `Prix affiché précédemment légèrement au-dessus de notre estimation (${ecartPrix.toFixed(0)}%)` });
      }
    }
    
    // Portails utilisés
    const portailsUtilises = historique.portails || [];
    if (portailsUtilises.length > 0) {
      const portailsStr = portailsUtilises.map(p => portailsLabels[p] || p).join(', ');
      capitalAlerts.push({ type: 'info', msg: `Portails déjà utilisés : ${portailsStr}` });
    }
  }
  
  return { capitalPct, capitalAlerts, pauseRecommandee };
}

interface LuxMode {
  luxScore: number;
  luxMode: boolean;
}

function calculerLuxMode(data: EstimationData, totalVenaleArrondi: number): LuxMode {
  const carac = data.caracteristiques;
  const contexte = data.identification?.contexte;
  const historique = data.identification?.historique;
  const isAppartement = carac?.typeBien === 'appartement';
  const isMaison = carac?.typeBien === 'maison';
  
  let luxScore = 0;
  
  // Type de bien premium
  const sousType = carac?.sousType || '';
  const sousTypePremium = ['attique', 'penthouse', 'loft', 'duplex'].includes(sousType);
  const sousTypeMaisonPremium = ['villa', 'propriete', 'chalet'].includes(sousType);
  if (sousTypePremium) luxScore += 15;
  if (sousTypeMaisonPremium) luxScore += 12;
  if (carac?.dernierEtage && isAppartement) luxScore += 8;
  
  // Surfaces hors norme
  const surfacePonderee = parseNum(carac?.surfacePPE) + (parseNum(carac?.surfaceNonHabitable) * 0.5);
  const surfaceHabMaison = parseNum(carac?.surfaceHabitableMaison);
  const surfaceHab = isAppartement ? surfacePonderee : surfaceHabMaison;
  if (surfaceHab > 300) luxScore += 15;
  else if (surfaceHab > 200) luxScore += 10;
  else if (surfaceHab > 150) luxScore += 5;
  
  // Terrain (maison)
  const surfaceTerrain = parseNum(carac?.surfaceTerrain);
  if (isMaison && surfaceTerrain > 3000) luxScore += 15;
  else if (isMaison && surfaceTerrain > 1500) luxScore += 10;
  else if (isMaison && surfaceTerrain > 800) luxScore += 5;
  
  // Annexes premium
  if (carac?.piscine) luxScore += 12;
  const annexesPremium = (carac?.annexesAppart || []).filter(a => 
    ['piscine_int', 'piscine_ext', 'hammam', 'sauna', 'jacuzzi'].includes(a)
  );
  luxScore += annexesPremium.length * 5;
  
  // Contexte vendeur
  const confidentialite = contexte?.confidentialite || '';
  if (confidentialite === 'confidentielle') luxScore += 12;
  else if (confidentialite === 'discrete') luxScore += 8;
  if (contexte?.horizon === 'flexible') luxScore += 5;
  if (contexte?.prioriteVendeur === 'prixMax') luxScore += 5;
  
  // Bien déjà exposé + volonté de protéger
  if (historique?.dejaDiffuse && confidentialite !== 'normale') luxScore += 8;
  
  // Valeur vénale
  if (totalVenaleArrondi > 10000000) luxScore += 20;
  else if (totalVenaleArrondi > 5000000) luxScore += 15;
  else if (totalVenaleArrondi > 3000000) luxScore += 10;
  else if (totalVenaleArrondi > 2000000) luxScore += 5;
  
  const luxMode = luxScore >= 35;
  
  return { luxScore, luxMode };
}

interface LuxCopy {
  pageTitle: string;
  headerTitle: string;
  timeline: string;
  diffusion: string;
  visibilite: string;
  capitalLabel: string;
  accelerer: string;
  introPhrase: string;
  disclaimerPhrase: string;
  recalibrageTitle: string;
  recalibragePhrase: string;
}

function getCopy(isLux: boolean): LuxCopy {
  return {
    pageTitle: isLux ? 'Scénarios de gouvernance' : 'Trajectoires de vente',
    headerTitle: isLux ? 'Scénarios de gouvernance' : 'Trajectoires de vente',
    timeline: isLux ? 'Cycle de maturation' : 'Timeline de diffusion',
    diffusion: isLux ? 'Exposition maîtrisée' : 'Diffusion',
    visibilite: isLux ? 'Portée contrôlée' : 'Visibilité',
    capitalLabel: isLux ? 'Capital de portée' : 'Capital-Visibilité',
    accelerer: isLux ? 'Arbitrer le tempo' : 'Accélérer',
    introPhrase: isLux 
      ? 'Chaque bien d\'exception appelle une gouvernance sur mesure. Le choix du scénario dépend de votre tempo, vos exigences et votre vision.'
      : 'Chaque bien peut être vendu selon différentes trajectoires. Le choix du point de départ stratégique dépend de votre contexte, vos priorités et votre horizon temporel.',
    disclaimerPhrase: isLux
      ? 'Dans ce segment, la retenue et la sélectivité font partie de la stratégie. Un objectif de valeur reflète le positionnement stratégique, pas une promesse de marché.'
      : 'Un objectif de valeur n\'est pas une promesse. Il dépend des signaux du marché, du rythme de diffusion et du pilotage dans le temps. Le point de départ stratégique est réversible – vous pouvez changer de trajectoire selon les retours observés.',
    recalibrageTitle: isLux ? 'Recalibrage nécessaire' : 'Recommandations',
    recalibragePhrase: isLux 
      ? 'Avant d\'amplifier, on stabilise le message et on évite les signaux contradictoires.'
      : ''
  };
}

// ============================================
// NIVEAU CONTRAINTE (Projet post-vente)
// ============================================

function calculerNiveauContrainte(data: EstimationData): number {
  const projetPV = data.identification?.projetPostVente;
  const hasProjetAchat = projetPV?.nature === 'achat';
  const avancement = projetPV?.avancement || '';
  
  if (!hasProjetAchat) return 0;
  
  if (avancement === 'acte_programme') return 5;
  if (avancement === 'compromis_signe') return 4;
  if (avancement === 'offre_deposee') return 3;
  if (avancement === 'bien_identifie') return 2;
  if (avancement === 'recherche') return 1;
  
  return 0;
}

// ============================================
// STYLES CSS COMPLETS
// ============================================

function getStyles(): string {
  return `
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a2e35;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0 auto;
      background: white;
      position: relative;
      page-break-after: always;
      overflow: hidden;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .header {
      background: #1a2e35;
      color: white;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-date {
      font-size: 11px;
      opacity: 0.8;
    }
    
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #1a2e35;
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
    }
    
    .footer-ref {
      opacity: 0.7;
    }
    
    .footer-slogan {
      font-style: italic;
      opacity: 0.8;
    }
    
    /* Annexe styles */
    .annexe-section {
      padding: 10px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .annexe-title {
      font-size: 10px;
      font-weight: 600;
      color: #1a2e35;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .annexe-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    
    .annexe-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    
    .annexe-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .annexe-item {
      background: #f9fafb;
      border-radius: 4px;
      padding: 8px 10px;
    }
    
    .annexe-item-label {
      font-size: 8px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    
    .annexe-item-value {
      font-size: 12px;
      font-weight: 600;
      color: #1a2e35;
    }
    
    .annexe-chip {
      display: inline-block;
      padding: 3px 8px;
      background: #e5e7eb;
      border-radius: 4px;
      font-size: 9px;
      color: #4b5563;
      margin: 2px;
    }
    
    .annexe-chip.positive {
      background: #d1fae5;
      color: #065f46;
    }
    
    .annexe-chip.negative {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .annexe-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    /* Photos grid */
    .photos-grid-pdf {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 16px 24px;
    }
    
    .photo-cell {
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 6px;
      background: #f3f4f6;
    }
    
    .photo-cell img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .page {
        page-break-after: always;
      }
      
      .no-print {
        display: none !important;
      }
    }
  `;
}

// ============================================
// GÉNÉRATION DES PAGES
// ============================================

function generatePage1Cover(data: EstimationData, calculs: CalculsResult, dateStr: string, _heureStr: string, totalPages: number): string {
  const identification = data.identification;
  const bien = identification?.adresse;
  const vendeur = identification?.vendeur;
  const carac = data.caracteristiques;
  const isAppartement = carac?.typeBien === 'appartement';
  const typeBien = isAppartement ? 'Appartement' : (carac?.typeBien === 'maison' ? 'Maison' : '–');
  
  let html = '<div class="page">';
  
  // Hero banner avec stats marketing
  html += '<div style="background:linear-gradient(135deg, #1a2e35 0%, #2d4a54 100%);color:white;padding:40px 24px 30px;position:relative;">';
  html += '<div style="position:absolute;top:20px;right:24px;opacity:0.15;">' + logoWhite.replace('viewBox', 'style="height:60px;width:auto;" viewBox') + '</div>';
  
  // Stats en haut
  html += '<div style="display:flex;justify-content:space-between;margin-bottom:30px;">';
  html += '<div style="text-align:center;flex:1;"><div style="font-size:20px;font-weight:700;">' + STATS_MARKETING.vues + '</div><div style="font-size:9px;opacity:0.7;">vues/an</div></div>';
  html += '<div style="text-align:center;flex:1;"><div style="font-size:20px;font-weight:700;">' + STATS_MARKETING.communaute + '</div><div style="font-size:9px;opacity:0.7;">communauté</div></div>';
  html += '<div style="text-align:center;flex:1;"><div style="font-size:20px;font-weight:700;">' + STATS_MARKETING.note + '</div><div style="font-size:9px;opacity:0.7;">satisfaction</div></div>';
  html += '<div style="text-align:center;flex:1;"><div style="font-size:20px;font-weight:700;">' + STATS_MARKETING.delai + '</div><div style="font-size:9px;opacity:0.7;">délai moyen</div></div>';
  html += '</div>';
  
  // Logo et titre
  html += '<div style="text-align:center;margin-bottom:20px;">' + logoWhite.replace('viewBox', 'style="height:48px;width:auto;" viewBox') + '</div>';
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;opacity:0.7;margin-bottom:8px;">Dossier d\'estimation</div>';
  html += '<div style="font-size:28px;font-weight:300;letter-spacing:-0.5px;">' + val(bien.rue) + '</div>';
  html += '<div style="font-size:14px;opacity:0.8;margin-top:6px;">' + val(bien.codePostal) + ' ' + val(bien.localite) + '</div>';
  html += '</div>';
  
  // Réseaux sociaux
  html += '<div style="display:flex;justify-content:center;gap:16px;margin-top:20px;">';
  ['instagram', 'facebook', 'linkedin', 'youtube'].forEach(social => {
    html += '<div style="opacity:0.6;">' + ico(social, 18, '#ffffff') + '</div>';
  });
  html += '</div>';
  
  html += '</div>'; // fin hero
  
  // Section informations vendeur
  html += '<div style="padding:20px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
  html += '<div>';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Préparé pour</div>';
  html += '<div style="font-size:16px;font-weight:600;color:#1a2e35;margin-top:4px;">' + val(vendeur.prenom) + ' ' + val(vendeur.nom) + '</div>';
  html += '</div>';
  html += '<div style="text-align:right;">';
  html += '<div style="font-size:9px;color:#6b7280;">Généré le</div>';
  html += '<div style="font-size:12px;color:#1a2e35;font-weight:500;">' + dateStr + '</div>';
  html += '</div>';
  html += '</div></div>';
  
  // Tags contexte
  const contexte = identification?.contexte;
  const ctxItems: Array<{ icon: string; text: string }> = [];
  
  if (contexte?.motifVente) ctxItems.push({ icon: 'target', text: motifLabels[contexte.motifVente] || contexte.motifVente });
  if (contexte?.horizon) ctxItems.push({ icon: 'clock', text: horizonLabels[contexte.horizon] || contexte.horizon });
  if (contexte?.confidentialite === 'discrete') ctxItems.push({ icon: 'eye', text: 'Vente discrète' });
  else if (contexte?.confidentialite === 'confidentielle') ctxItems.push({ icon: 'lock', text: 'Off-market' });
  if (contexte?.prioriteVendeur === 'prixMax') ctxItems.push({ icon: 'trendingUp', text: 'Priorité prix' });
  else if (contexte?.prioriteVendeur === 'venteRapide') ctxItems.push({ icon: 'zap', text: 'Priorité rapidité' });
  if (carac?.dernierEtage) ctxItems.push({ icon: 'mountain', text: 'Dernier étage' });
  
  if (ctxItems.length > 0) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 24px;background:#fafafa;border-bottom:1px solid #e5e7eb;">';
    ctxItems.forEach(item => {
      html += '<span style="font-size:11px;padding:6px 12px;background:white;border-radius:6px;border:1px solid #e5e7eb;display:flex;align-items:center;gap:6px;color:#374151;">' + ico(item.icon, 14, '#6b7280') + item.text + '</span>';
    });
    html += '</div>';
  }
  
  // Métriques principales
  html += '<div style="display:flex;background:white;border-bottom:1px solid #e5e7eb;">';
  
  html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
  html += '<div>' + ico('surface', 20, '#9ca3af') + '</div>';
  html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + calculs.surfacePrincipale.toFixed(0) + '</div>';
  html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">m² ' + (isAppartement ? 'pondérés' : 'habitables') + '</div></div>';
  html += '</div></div>';
  
  html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
  html += '<div>' + ico('pieces', 20, '#9ca3af') + '</div>';
  html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac?.nombrePieces) + '</div>';
  html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">pièces</div></div>';
  html += '</div></div>';
  
  html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
  html += '<div>' + ico('chambres', 20, '#9ca3af') + '</div>';
  html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac?.nombreChambres) + '</div>';
  html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">chambres</div></div>';
  html += '</div></div>';
  
  if (isAppartement) {
    html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
    html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
    html += '<div>' + ico('etage', 20, '#9ca3af') + '</div>';
    html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac?.etage) + '</div>';
    html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">étage</div></div>';
    html += '</div></div>';
  } else {
    html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
    html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
    html += '<div>' + ico('tree', 20, '#9ca3af') + '</div>';
    html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + calculs.surfaceTerrain.toFixed(0) + '</div>';
    html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">m² terrain</div></div>';
    html += '</div></div>';
  }
  
  html += '<div style="flex:1;padding:12px 8px;text-align:center;">';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
  html += '<div>' + ico('construction', 20, '#9ca3af') + '</div>';
  html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac?.anneeConstruction) + '</div>';
  html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">construction</div></div>';
  html += '</div></div>';
  
  html += '</div>';
  
  // Section type bien
  html += '<div style="padding:20px 24px;background:white;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
  html += '<div>';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Type de bien</div>';
  html += '<div style="font-size:18px;font-weight:600;color:#1a2e35;margin-top:4px;">' + typeBien + (carac?.sousType ? ' • ' + (sousTypeLabels[carac.sousType] || carac.sousType) : '') + '</div>';
  html += '</div>';
  html += '<div style="text-align:right;">';
  html += '<div style="font-size:9px;color:#6b7280;">Réf. interne</div>';
  html += '<div style="font-size:12px;color:#1a2e35;font-weight:500;">' + (data.id?.slice(0, 8) || 'GARY-XXX') + '</div>';
  html += '</div>';
  html += '</div></div>';
  
  // Prix synthèse
  html += '<div style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;">';
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Estimation de valeur</div>';
  html += '<div style="font-size:28px;font-weight:300;color:#1a2e35;letter-spacing:-1px;">' + formatPrice(calculs.totalVenaleArrondi) + '</div>';
  html += '<div style="font-size:11px;color:#6b7280;margin-top:6px;">Fourchette : ' + formatPrice(calculs.prixEntre) + ' – ' + formatPrice(calculs.prixEt) + '</div>';
  html += '</div></div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page 1/' + totalPages + ' • Dossier d\'estimation</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
html += '</div>'; // page
  return html;
}

// ============================================
// PAGE 2 : QUI EST GARY
// ============================================

function generatePage2Gary(
  dateStr: string,
  totalPages: number
): string {
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">Qui est GARY ?</div>';
  html += '</div>';
  
  // Hero section avec logo
  html += '<div style="padding:30px 24px;background:white;text-align:center;">';
  html += '<div style="margin-bottom:20px;">' + logoRed.replace('viewBox', 'style="height:60px;width:auto;" viewBox') + '</div>';
  html += '<div style="font-size:14px;color:#1a2e35;font-weight:600;margin-bottom:8px;">Agence immobilière premium à Genève</div>';
  html += '<div style="font-size:10px;color:#6b7280;line-height:1.6;max-width:450px;margin:0 auto;">';
  html += 'GARY accompagne vendeurs et acquéreurs avec une approche sur-mesure, ';
  html += 'combinant expertise locale, outils technologiques et service personnalisé.';
  html += '</div>';
  html += '</div>';
  
  // Section valeurs
  html += '<div style="padding:20px 24px;background:#f8fafc;">';
  html += '<div style="font-size:10px;color:#1a2e35;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;text-align:center;">Nos engagements</div>';
  
  html += '<div style="display:flex;gap:16px;">';
  
  // Engagement 1
  html += '<div style="flex:1;background:white;border-radius:8px;padding:16px;text-align:center;border:1px solid #e5e7eb;">';
  html += '<div style="margin-bottom:8px;">' + ico('shield', 28, '#1a2e35') + '</div>';
  html += '<div style="font-size:11px;font-weight:600;color:#1a2e35;margin-bottom:4px;">Transparence</div>';
  html += '<div style="font-size:9px;color:#6b7280;line-height:1.4;">Méthodologie claire, pas de promesses exagérées</div>';
  html += '</div>';
  
  // Engagement 2
  html += '<div style="flex:1;background:white;border-radius:8px;padding:16px;text-align:center;border:1px solid #e5e7eb;">';
  html += '<div style="margin-bottom:8px;">' + ico('users', 28, '#1a2e35') + '</div>';
  html += '<div style="font-size:11px;font-weight:600;color:#1a2e35;margin-bottom:4px;">Accompagnement</div>';
  html += '<div style="font-size:9px;color:#6b7280;line-height:1.4;">Suivi personnalisé à chaque étape</div>';
  html += '</div>';
  
  // Engagement 3
  html += '<div style="flex:1;background:white;border-radius:8px;padding:16px;text-align:center;border:1px solid #e5e7eb;">';
  html += '<div style="margin-bottom:8px;">' + ico('compass', 28, '#1a2e35') + '</div>';
  html += '<div style="font-size:11px;font-weight:600;color:#1a2e35;margin-bottom:4px;">Stratégie</div>';
  html += '<div style="font-size:9px;color:#6b7280;line-height:1.4;">Pilotage adaptatif selon le marché</div>';
  html += '</div>';
  
  html += '</div>'; // fin flex
  html += '</div>'; // fin section valeurs
  
  // Section chiffres clés
  html += '<div style="padding:20px 24px;background:white;">';
  html += '<div style="font-size:10px;color:#1a2e35;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;text-align:center;">En chiffres</div>';
  
  html += '<div style="display:flex;gap:12px;">';
  
  const chiffres = [
    { value: '80+', label: 'Transactions 2025', icon: 'checkCircle' },
    { value: '3.5', label: 'Mois en moyenne', icon: 'clock' },
    { value: '95%', label: 'Satisfaction client', icon: 'star' },
    { value: '6.6M+', label: 'Vues annuelles', icon: 'eye' }
  ];
  
  chiffres.forEach(c => {
    html += '<div style="flex:1;text-align:center;padding:12px;background:#f8fafc;border-radius:6px;">';
    html += '<div style="margin-bottom:6px;">' + ico(c.icon, 20, '#9ca3af') + '</div>';
    html += '<div style="font-size:18px;font-weight:600;color:#1a2e35;">' + c.value + '</div>';
    html += '<div style="font-size:8px;color:#6b7280;margin-top:2px;">' + c.label + '</div>';
    html += '</div>';
  });
  
  html += '</div>'; // fin flex chiffres
  html += '</div>'; // fin section chiffres
  
  // Section approche
  html += '<div style="padding:16px 24px;background:#f8fafc;">';
  html += '<div style="font-size:10px;color:#1a2e35;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;text-align:center;">Notre approche</div>';
  html += '<div style="font-size:9px;color:#4b5563;line-height:1.6;text-align:center;max-width:500px;margin:0 auto;">';
  html += 'Nous croyons que chaque bien mérite une stratégie unique. ';
  html += 'Plutôt que d\'imposer une méthode standard, nous adaptons notre approche à votre situation, ';
  html += 'vos priorités et votre horizon temporel. Vous gardez le contrôle des décisions, ';
  html += 'nous assurons le pilotage stratégique et opérationnel.';
  html += '</div>';
  html += '</div>';
  
  // Contact
  html += '<div style="padding:16px 24px;background:#1a2e35;">';
  html += '<div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;">';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('phone', 16, '#ffffff') + '<span style="font-size:10px;color:white;">' + GARY_TEL + '</span></div>';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('mail', 16, '#ffffff') + '<span style="font-size:10px;color:white;">contact@gary.ch</span></div>';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('globe', 16, '#ffffff') + '<span style="font-size:10px;color:white;">www.gary.ch</span></div>';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('mapPin', 16, '#ffffff') + '<span style="font-size:10px;color:white;">' + GARY_ADDRESS + '</span></div>';
  html += '</div>';
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page 2/' + totalPages + ' • Qui est GARY</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

// ============================================
// PAGE 3 : STRATÉGIE
// ============================================

function generatePage3Strategie(
  data: EstimationData, 
  calculs: CalculsResult, 
  capitalVis: CapitalVisibilite, 
  luxModeData: LuxMode,
  totalPages: number
): string {
  const copy = getCopy(luxModeData.luxMode);
  const pre = data.preEstimation;
  const projetPV = data.identification?.projetPostVente;
  const hasProjetAchat = projetPV?.nature === 'achat';
  const niveauContrainte = calculerNiveauContrainte(data);
  
  // Pourcentages dynamiques
  const pourcOffmarket = parseNum(pre?.pourcOffmarket) || 15;
  const pourcComingsoon = parseNum(pre?.pourcComingsoon) || 10;
  const pourcPublic = parseNum(pre?.pourcPublic) || 6;
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">' + copy.headerTitle + '</div>';
  html += '</div>';
  
  // Introduction
  html += '<div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="font-size:10px;color:#4b5563;line-height:1.5;text-align:center;font-style:italic;">' + copy.introPhrase + '</div>';
  html += '</div>';
  
  // Les 3 trajectoires
  html += '<div style="padding:16px 24px;background:white;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;text-align:center;">' + copy.pageTitle + '</div>';
  
  html += '<div style="display:flex;gap:12px;">';
  
  // Trajectoire 1 : Off-market
  const prixOffmarket = arrondir5000(calculs.totalVenale * (1 + pourcOffmarket / 100));
  html += '<div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">';
  html += '<div style="background:#f9fafb;padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="font-size:11px;font-weight:600;color:#1a2e35;">Off-market</div>';
  html += '<div style="font-size:8px;color:#6b7280;margin-top:2px;">Confidentiel</div>';
  html += '</div>';
  html += '<div style="padding:12px;text-align:center;">';
  html += '<div style="font-size:16px;font-weight:600;color:#1a2e35;">' + formatPriceShort(prixOffmarket) + '</div>';
  html += '<div style="font-size:8px;color:#6b7280;margin-top:4px;">+' + pourcOffmarket + '% valeur vénale</div>';
  html += '<div style="margin-top:8px;font-size:9px;color:#4b5563;line-height:1.4;">Réseau privé GARY uniquement. Aucune visibilité publique.</div>';
  html += '</div></div>';
  
  // Trajectoire 2 : Coming soon
  const prixComingsoon = arrondir5000(calculs.totalVenale * (1 + pourcComingsoon / 100));
  html += '<div style="flex:1;border:2px solid #1a2e35;border-radius:8px;overflow:hidden;position:relative;">';
  html += '<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);background:#1a2e35;color:white;font-size:7px;font-weight:600;padding:2px 8px;border-radius:0 0 4px 4px;text-transform:uppercase;">Recommandé</div>';
  html += '<div style="background:#1a2e35;color:white;padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="font-size:11px;font-weight:600;">Coming soon</div>';
  html += '<div style="font-size:8px;opacity:0.8;margin-top:2px;">Teasing maîtrisé</div>';
  html += '</div>';
  html += '<div style="padding:12px;text-align:center;">';
  html += '<div style="font-size:16px;font-weight:600;color:#1a2e35;">' + formatPriceShort(prixComingsoon) + '</div>';
  html += '<div style="font-size:8px;color:#6b7280;margin-top:4px;">+' + pourcComingsoon + '% valeur vénale</div>';
  html += '<div style="margin-top:8px;font-size:9px;color:#4b5563;line-height:1.4;">Exposition progressive. Création d\'attente avant mise en ligne.</div>';
  html += '</div></div>';
  
  // Trajectoire 3 : Public
  const prixPublic = arrondir5000(calculs.totalVenale * (1 + pourcPublic / 100));
  html += '<div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">';
  html += '<div style="background:#f9fafb;padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="font-size:11px;font-weight:600;color:#1a2e35;">Public</div>';
  html += '<div style="font-size:8px;color:#6b7280;margin-top:2px;">Visibilité maximale</div>';
  html += '</div>';
  html += '<div style="padding:12px;text-align:center;">';
  html += '<div style="font-size:16px;font-weight:600;color:#1a2e35;">' + formatPriceShort(prixPublic) + '</div>';
  html += '<div style="font-size:8px;color:#6b7280;margin-top:4px;">+' + pourcPublic + '% valeur vénale</div>';
  html += '<div style="margin-top:8px;font-size:9px;color:#4b5563;line-height:1.4;">Tous portails. Exposition immédiate et large.</div>';
  html += '</div></div>';
  
  html += '</div>'; // fin flex
  html += '</div>'; // fin section trajectoires
  
  // Capital-Visibilité
  html += '<div style="padding:12px 24px;background:#f8fafc;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('shield', 14, '#9ca3af') + copy.capitalLabel + '</div>';
  html += '<div style="background:white;border-radius:8px;padding:12px;border:1px solid #e5e7eb;">';
  
  // Jauge
  const capitalColor = capitalVis.capitalPct > 60 ? '#10b981' : (capitalVis.capitalPct > 30 ? '#f59e0b' : '#ef4444');
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">';
  html += '<div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">';
  html += '<div style="width:' + capitalVis.capitalPct + '%;height:100%;background:' + capitalColor + ';border-radius:4px;"></div>';
  html += '</div>';
  html += '<div style="font-size:14px;font-weight:600;color:' + capitalColor + ';">' + capitalVis.capitalPct + '%</div>';
  html += '</div>';
  
  // Alertes
  if (capitalVis.capitalAlerts.length > 0) {
    capitalVis.capitalAlerts.slice(0, 3).forEach(alert => {
      const alertColor = alert.type === 'critical' ? '#ef4444' : (alert.type === 'warning' ? '#f59e0b' : '#6b7280');
      const alertIcon = alert.type === 'critical' ? 'alert' : (alert.type === 'warning' ? 'info' : 'info');
      html += '<div style="display:flex;align-items:flex-start;gap:6px;padding:6px 0;border-top:1px solid #f3f4f6;">';
      html += ico(alertIcon, 12, alertColor);
      html += '<span style="font-size:9px;color:#4b5563;line-height:1.3;">' + alert.msg + '</span>';
      html += '</div>';
    });
  }
  
  html += '</div></div>';
  
  // LuxMode indicator (si applicable)
  if (luxModeData.luxMode) {
    html += '<div style="padding:8px 24px;background:#f8fafc;">';
    html += '<div style="background:linear-gradient(135deg, #1a2e35 0%, #2d4a54 100%);border-radius:6px;padding:10px 14px;color:white;">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
    html += ico('award', 14, '#ffffff');
    html += '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Mode Premium</span>';
    html += '</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    const luxItems = [
      { icon: 'shield', text: 'Confidentialité renforcée' },
      { icon: 'users', text: 'Réseau qualifié' },
      { icon: 'compass', text: 'Approche sur-mesure' }
    ];
    luxItems.forEach(item => {
      html += '<div style="display:flex;align-items:center;gap:4px;">';
      html += ico(item.icon, 10, '#9ca3af');
      html += '<span style="font-size:8px;color:#4b5563;">' + item.text + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="font-size:8px;color:#6b7280;font-style:italic;text-align:center;line-height:1.3;">Dans ce segment, la stratégie protège autant la valeur que la confidentialité.</div>';
    html += '</div></div>';
  }
  
  // Disclaimer
  html += '<div style="padding:10px 24px;background:#f8fafc;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;">';
  html += ico('info', 14, '#9ca3af');
  html += '<div style="font-size:8px;color:#6b7280;line-height:1.4;font-style:italic;">' + copy.disclaimerPhrase + '</div>';
  html += '</div></div>';
  
  // Cadre de pilotage (si projet d'achat)
  if (hasProjetAchat && niveauContrainte > 0) {
    html += '<div style="padding:8px 24px;background:#f8fafc;">';
    html += '<div style="background:#f8fafc;border-left:3px solid #FF4539;border-radius:4px;padding:10px 14px;">';
    html += '<div style="font-size:8px;color:#FF4539;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:600;">Cadre de pilotage</div>';
    html += '<div style="font-size:8px;color:#4b5563;line-height:1.5;">La stratégie proposée est conçue pour rester <strong>réversible et ajustable</strong> dans le temps. Elle s\'adapte à l\'évolution du marché et de votre situation personnelle, sans jamais exposer vos contraintes.</div>';
    html += '</div></div>';
  }
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page 3/' + totalPages + ' • ' + copy.pageTitle + '</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

function generatePage4PlanAction(
  data: EstimationData, 
  calculs: CalculsResult, 
  capitalVis: CapitalVisibilite,
  dateStr: string, 
  _heureStr: string, 
  totalPages: number
): string {
  const identification = data.identification;
  const historique = identification?.historique;
  const analyse = data.analyseTerrain;
  const strat = data.strategiePitch;
  
  // Courtier
  const courtierData = COURTIERS_GARY.find(c => c.id === identification?.courtierAssigne);
  const courtierNom = courtierData ? `${courtierData.prenom} ${courtierData.nom}` : 'Votre courtier GARY';
  const courtierInitiales = courtierData ? courtierData.initiales : 'GA';
  const courtierEmail = courtierData ? courtierData.email : 'contact@gary.ch';
  
  // Étapes prochaines
  const etapes = [
    { label: 'Validation du prix de mise en vente' },
    { label: 'Signature du mandat' },
    { label: 'Préparation visuelle (photos, vidéo)' },
    { label: 'Rédaction annonce' },
    { label: 'Lancement phase 1' },
    { label: 'Suivi & reporting' }
  ];
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">Plan d\'action</div>';
  html += '</div>';
  
  // Section Pilotage coordonné vs Pilotage partagé
  html += '<div style="padding:20px 24px;background:white;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;font-weight:600;text-align:center;">Vous restez décideur, on s\'occupe du reste</div>';
  
  html += '<div style="display:flex;gap:16px;">';
  
  // Bloc Pilotage coordonné (gauche - recommandé)
  html += '<div style="flex:1;border:1px solid #1a2e35;border-radius:8px;overflow:hidden;position:relative;">';
  html += '<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);background:#1a2e35;color:white;font-size:8px;font-weight:600;padding:3px 10px;border-radius:0 0 4px 4px;text-transform:uppercase;letter-spacing:0.5px;">Recommandé</div>';
  html += '<div style="padding:20px 16px 12px;text-align:center;background:#f9fafb;">';
  html += '<div style="margin:0 auto 8px;">' + ico('checkCircle', 28, '#1a2e35') + '</div>';
  html += '<div style="font-size:13px;font-weight:600;color:#1a2e35;">GARY s\'occupe de tout</div>';
  html += '<div style="font-size:9px;color:#6b7280;margin-top:2px;">Pilotage coordonné</div>';
  html += '</div>';
  html += '<div style="padding:12px 16px;background:white;">';
  
  const avantagesCoord = [
    'Ajustements <strong>immédiats</strong>',
    'Message <strong>cohérent</strong> partout',
    'Séquence <strong>maîtrisée</strong>',
    'Réactivité <strong>en temps réel</strong>',
    'Repartir à zéro <strong>possible</strong>'
  ];
  avantagesCoord.forEach(a => {
    html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6;">';
    html += ico('check', 12, '#1a2e35');
    html += '<span style="font-size:10px;color:#1a2e35;">' + a + '</span>';
    html += '</div>';
  });
  html += '</div></div>';
  
  // Bloc Pilotage partagé (droite)
  html += '<div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;opacity:0.75;">';
  html += '<div style="padding:20px 16px 12px;text-align:center;background:#fafafa;">';
  html += '<div style="margin:0 auto 8px;">' + ico('share', 28, '#9ca3af') + '</div>';
  html += '<div style="font-size:13px;font-weight:600;color:#6b7280;">Pilotage partagé</div>';
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:2px;">Plusieurs intervenants</div>';
  html += '</div>';
  html += '<div style="padding:12px 16px;background:white;">';
  
  const pointsPartage = [
    { ok: true, text: 'Coordination <strong>plus longue</strong>' },
    { ok: true, text: 'Messages <strong>parfois différents</strong>' },
    { ok: true, text: 'Séquence <strong>moins prévisible</strong>' },
    { ok: true, text: 'Ajustements <strong>plus lents</strong>' },
    { ok: false, text: 'Repartir à zéro <strong>difficile</strong>' }
  ];
  pointsPartage.forEach(p => {
    html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6;">';
    html += ico(p.ok ? 'circle' : 'x', 12, '#9ca3af');
    html += '<span style="font-size:10px;color:#6b7280;">' + p.text + '</span>';
    html += '</div>';
  });
  html += '</div></div>';
  
  html += '</div>'; // fin flex
  
  // Phrase dynamique selon contexte
  let phraseMandat = '';
  if (!historique.dejaDiffuse) {
    phraseMandat = 'Pour votre situation : le pilotage coordonné vous permet de <strong>maximiser vos chances dès le départ</strong> avec une stratégie cohérente.';
  } else if (capitalVis.capitalPct > 40) {
    phraseMandat = 'Pour votre situation : le pilotage coordonné vous permet de <strong>corriger le tir efficacement</strong> et de relancer avec une approche maîtrisée.';
  } else {
    phraseMandat = 'Pour votre situation : le pilotage coordonné vous permet de <strong>repartir proprement</strong>, sans hériter des erreurs passées.';
  }
  html += '<div style="margin-top:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;text-align:center;">';
  html += '<span style="font-size:10px;color:#4b5563;line-height:1.5;">' + phraseMandat + '</span>';
  html += '</div>';
  
  // Légende
  html += '<div style="margin-top:10px;display:flex;justify-content:center;gap:20px;">';
  html += '<div style="display:flex;align-items:center;gap:5px;">' + ico('check', 10, '#1a2e35') + '<span style="font-size:8px;color:#6b7280;">Optimal</span></div>';
  html += '<div style="display:flex;align-items:center;gap:5px;">' + ico('circle', 10, '#9ca3af') + '<span style="font-size:8px;color:#6b7280;">Possible</span></div>';
  html += '<div style="display:flex;align-items:center;gap:5px;">' + ico('x', 10, '#9ca3af') + '<span style="font-size:8px;color:#6b7280;">Difficile</span></div>';
  html += '</div>';
  
  html += '</div>'; // fin section pilotage
  
  // Plan d'action (étapes)
  html += '<div style="padding:16px 24px;background:#f8fafc;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('list', 14, '#9ca3af') + 'Prochaines étapes</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
  etapes.forEach((e, i) => {
    html += '<div style="display:flex;align-items:center;gap:10px;background:white;border-radius:6px;padding:10px;border:1px solid #e5e7eb;">';
    html += '<div style="width:24px;height:24px;background:#1a2e35;border-radius:50%;color:white;font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + (i + 1) + '</div>';
    html += '<div style="font-size:9px;color:#4b5563;line-height:1.3;font-weight:500;">' + e.label + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  
  // Notes si présentes
  if (analyse.notesLibres || strat.notesStrategie) {
    html += '<div style="margin:0 24px 12px;background:#f9fafb;border:1px solid #e5e7eb;padding:12px 16px;border-radius:6px;">';
    html += '<div style="font-size:9px;font-weight:600;color:#6b7280;margin-bottom:6px;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:0.5px;">' + ico('edit', 12, '#9ca3af') + 'Notes</div>';
    html += '<div style="font-size:10px;color:#4b5563;line-height:1.5;">';
    if (analyse.notesLibres) html += analyse.notesLibres;
    if (analyse.notesLibres && strat.notesStrategie) html += '<br><br>';
    if (strat.notesStrategie) html += strat.notesStrategie;
    html += '</div></div>';
  }
  
  // Section Signature
  html += '<div style="margin:12px 24px;padding:16px;background:white;border-radius:8px;border:1px solid #e5e7eb;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">';
  html += '<div style="display:flex;align-items:center;gap:12px;">';
  html += '<div style="width:40px;height:40px;border-radius:50%;background:#1a2e35;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:500;">' + courtierInitiales + '</div>';
  html += '<div>';
  html += '<div style="font-size:13px;font-weight:600;color:#1a2e35;">' + courtierNom + '</div>';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Conseiller immobilier GARY</div>';
  html += '</div></div>';
  html += '<div style="text-align:right;">';
  html += '<div style="font-size:10px;color:#1a2e35;font-weight:500;">Fait à Genève</div>';
  html += '<div style="font-size:9px;color:#6b7280;">Le ' + dateStr + '</div>';
  html += '</div></div>';
  
  // Coordonnées et signature
  html += '<div style="display:flex;gap:20px;align-items:flex-end;">';
  html += '<div style="flex:1;background:#f9fafb;border-radius:6px;padding:10px;">';
  html += '<div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;">';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('phone', 14, '#9ca3af') + '<span style="font-size:10px;color:#4b5563;font-weight:500;">' + GARY_TEL + '</span></div>';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('mail', 14, '#9ca3af') + '<span style="font-size:10px;color:#4b5563;font-weight:500;">' + courtierEmail + '</span></div>';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('globe', 14, '#9ca3af') + '<span style="font-size:10px;color:#4b5563;font-weight:500;">gary.ch</span></div>';
  html += '</div></div>';
  html += '<div style="width:160px;">';
  html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;">Signature</div>';
  html += '<div style="border-bottom:1px solid #1a2e35;height:36px;"></div>';
  html += '</div>';
  html += '</div></div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page 4/' + totalPages + ' • ' + dateStr + '</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

function generatePage5Methodologie(
  data: EstimationData,
  calculs: CalculsResult,
  dateStr: string,
  totalPages: number
): string {
  const pre = data.preEstimation;
  const carac = data.caracteristiques;
  const isAppartement = carac?.typeBien === 'appartement';
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">Annexe : Méthodologie</div>';
  html += '</div>';
  
  // Fourchette de négociation
  html += '<div style="background:#f8fafc;padding:12px 30px;display:flex;justify-content:center;align-items:center;gap:30px;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:flex;align-items:center;gap:8px;">';
  html += '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Fourchette</span>';
  html += '<span style="font-size:16px;font-weight:300;color:#1a2e35;">' + formatPrice(calculs.prixEntre) + '</span>';
  html += '<span style="color:#d1d5db;font-size:14px;">→</span>';
  html += '<span style="font-size:16px;font-weight:300;color:#1a2e35;">' + formatPrice(calculs.prixEt) + '</span>';
  html += '</div>';
  html += '</div>';
  
  // Les 3 valeurs
  html += '<div style="padding:16px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">';
  
  // Valeur Vénale
  html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">' + ico('target', 14, '#9ca3af') + '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Vénale</span></div>';
  html += '<div style="font-size:18px;font-weight:400;color:#1a2e35;">' + formatPrice(calculs.totalVenaleArrondi) + '</div>';
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Base de calcul</div>';
  html += '</div>';
  
  // Valeur Rendement
  html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">' + ico('trendingUp', 14, '#9ca3af') + '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Rendement</span></div>';
  html += '<div style="font-size:18px;font-weight:400;color:#1a2e35;">' + formatPrice(calculs.valeurRendement) + '</div>';
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Taux ' + (parseNum(pre.tauxCapitalisation) || 2.5).toFixed(1) + '% • ' + formatPrice(calculs.loyerMensuel) + '/mois</div>';
  html += '</div>';
  
  // Valeur de Gage
  html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">' + ico('lock', 14, '#9ca3af') + '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Gage</span></div>';
  html += '<div style="font-size:18px;font-weight:400;color:#1a2e35;">' + formatPrice(calculs.valeurGageArrondi) + '</div>';
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">⅔ vénale + ⅓ rendement</div>';
  html += '</div>';
  
  html += '</div></div>';
  
  // Détail du calcul
  html += '<div style="padding:16px 24px;background:#f8fafc;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:600;">Détail du calcul</div>';
  
  if (isAppartement) {
    // Tableau appartement
    html += '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">Surface pondérée</td><td style="text-align:right;font-weight:500;">' + calculs.surfacePonderee.toFixed(1) + ' m²</td></tr>';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">Prix/m² (après vétusté)</td><td style="text-align:right;font-weight:500;">' + formatPrice(parseNum(pre.prixM2) * (1 - parseNum(pre.tauxVetuste) / 100)) + '</td></tr>';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">= Valeur surface</td><td style="text-align:right;font-weight:600;">' + formatPrice(calculs.valeurSurface) + '</td></tr>';
    
    if (calculs.nbPlaceInt > 0) {
      html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ ' + calculs.nbPlaceInt + ' place(s) int.</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurPlaceInt) + '</td></tr>';
    }
    if (calculs.nbPlaceExt > 0) {
      html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ ' + calculs.nbPlaceExt + ' place(s) ext.</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurPlaceExt) + '</td></tr>';
    }
    if (calculs.nbBox > 0) {
      html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ ' + calculs.nbBox + ' box</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurBox) + '</td></tr>';
    }
    if (calculs.hasCave > 0) {
      html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ Cave</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurCave) + '</td></tr>';
    }
    if (calculs.valeurLignesSupp > 0) {
      html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ Autres</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurLignesSupp) + '</td></tr>';
    }
    
    html += '<tr style="background:#1a2e35;color:white;"><td style="padding:8px;font-weight:600;">TOTAL VÉNALE</td><td style="text-align:right;font-weight:700;padding:8px;">' + formatPrice(calculs.totalVenaleArrondi) + '</td></tr>';
    html += '</table>';
  } else {
    // Tableau maison
    html += '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">Surface terrain</td><td style="text-align:right;font-weight:500;">' + calculs.surfaceTerrain.toFixed(0) + ' m²</td></tr>';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">Prix/m² terrain</td><td style="text-align:right;font-weight:500;">' + formatPrice(parseNum(pre.prixM2Terrain)) + '</td></tr>';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">= Valeur terrain</td><td style="text-align:right;font-weight:600;">' + formatPrice(calculs.valeurTerrain) + '</td></tr>';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">Cubage SIA</td><td style="text-align:right;font-weight:500;">' + calculs.cubage.toFixed(0) + ' m³</td></tr>';
    html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ Valeur cubage</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurCubage) + '</td></tr>';
    
    if (calculs.valeurAmenagement > 0) {
      html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ Aménagement ext.</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurAmenagement) + '</td></tr>';
    }
    if (calculs.valeurAnnexes > 0) {
      html += '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 0;color:#6b7280;">+ Annexes</td><td style="text-align:right;font-weight:500;">' + formatPrice(calculs.valeurAnnexes) + '</td></tr>';
    }
    
    html += '<tr style="background:#1a2e35;color:white;"><td style="padding:8px;font-weight:600;">TOTAL VÉNALE</td><td style="text-align:right;font-weight:700;padding:8px;">' + formatPrice(calculs.totalVenaleArrondi) + '</td></tr>';
    html += '</table>';
  }
  
  html += '</div>';
  
  // Section comparables
  const comparablesVendus = (pre as any)?.comparablesVendus || [];
  const comparablesEnVente = (pre as any)?.comparablesEnVente || [];
  
  if (comparablesVendus.length > 0 || comparablesEnVente.length > 0) {
    html += '<div style="padding:16px 24px;background:white;border-top:1px solid #e5e7eb;">';
    html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:600;">Positionnement marché</div>';
    
    // Comparables vendus
    if (comparablesVendus.length > 0) {
      html += '<div style="margin-bottom:12px;">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">';
      html += ico('checkCircle', 12, '#10b981');
      html += '<span style="font-size:9px;color:#10b981;font-weight:600;">TRANSACTIONS RÉCENTES</span>';
      html += '</div>';
      
      comparablesVendus.forEach((comp: any) => {
        html += '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f0fdf4;border-left:2px solid #10b981;margin-bottom:4px;border-radius:0 4px 4px 0;">';
        html += '<span style="font-size:9px;color:#065f46;">' + (comp.adresse || '—') + '</span>';
        html += '<span style="font-size:9px;font-weight:600;color:#10b981;">' + (comp.prix || '—') + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    // Comparables en vente
    if (comparablesEnVente.length > 0) {
      html += '<div>';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">';
      html += ico('circle', 12, '#6b7280');
      html += '<span style="font-size:9px;color:#6b7280;font-weight:600;">ACTUELLEMENT EN VENTE</span>';
      html += '</div>';
      
      comparablesEnVente.forEach((comp: any) => {
        html += '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:#f9fafb;border-left:2px solid #9ca3af;margin-bottom:4px;border-radius:0 4px 4px 0;">';
        html += '<span style="font-size:9px;color:#4b5563;">' + (comp.adresse || '—') + '</span>';
        html += '<span style="font-size:9px;font-weight:600;color:#6b7280;">' + (comp.prix || '—') + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
  }
  
  // Note méthodologie
  html += '<div style="padding:12px 24px;background:white;">';
  html += '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;">';
  html += '<div style="font-size:9px;font-weight:600;color:#6b7280;margin-bottom:6px;text-transform:uppercase;">Note méthodologique</div>';
  html += '<div style="font-size:9px;color:#4b5563;line-height:1.5;">';
  html += 'Cette estimation repose sur une analyse comparative de marché (ACM) combinée à une approche par le rendement. ';
  html += 'Les valeurs sont indicatives et peuvent varier selon les conditions de marché au moment de la vente. ';
  html += 'La fourchette proposée intègre une marge de négociation standard de ±3%.';
  html += '</div></div></div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page 5/' + totalPages + ' • Méthodologie</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

function generatePageAnnexeTechnique1(
  data: EstimationData,
  calculs: CalculsResult,
  pageNum: number,
  totalPages: number
): string {
  const identification = data.identification;
  const bien = identification?.adresse;
  const vendeur = identification?.vendeur;
  const carac = data.caracteristiques;
  const isAppartement = carac?.typeBien === 'appartement';
  
  const annexeVal = (v: unknown, suffix: string = ''): string => {
    if (v === null || v === undefined || v === '' || v === 0) return '–';
    return String(v) + suffix;
  };
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">Annexe Technique (1/2)</div>';
  html += '</div>';
  
  // Section Identification
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('home', 12, '#FF4539') + ' Identification</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Adresse</div><div class="annexe-item-value">' + val(bien.rue) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Code postal</div><div class="annexe-item-value">' + val(bien.codePostal) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Localité</div><div class="annexe-item-value">' + val(bien.localite) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Vendeur</div><div class="annexe-item-value">' + val(vendeur.prenom) + ' ' + val(vendeur.nom) + '</div></div>';
  html += '</div></div>';
  
  // Section Surfaces
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('surface', 12, '#FF4539') + ' Surfaces</div>';
  
  if (isAppartement) {
    html += '<div class="annexe-grid">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface PPE</div><div class="annexe-item-value">' + annexeVal(carac?.surfacePPE, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface pondérée</div><div class="annexe-item-value">' + calculs.surfacePonderee.toFixed(1) + ' m²</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Balcon</div><div class="annexe-item-value">' + annexeVal(carac?.surfaceBalcon, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Terrasse</div><div class="annexe-item-value">' + annexeVal(carac?.surfaceTerrasse, ' m²') + '</div></div>';
    html += '</div>';
  } else {
    html += '<div class="annexe-grid">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface habitable</div><div class="annexe-item-value">' + annexeVal(carac?.surfaceHabitableMaison, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface terrain</div><div class="annexe-item-value">' + calculs.surfaceTerrain.toFixed(0) + ' m²</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface utile</div><div class="annexe-item-value">' + annexeVal(carac?.surfaceUtile, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Cubage SIA</div><div class="annexe-item-value">' + calculs.cubage.toFixed(0) + ' m³</div></div>';
    html += '</div>';
  }
  html += '</div>';
  
  // Section Pièces & Configuration
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('pieces', 12, '#FF4539') + ' Pièces & Configuration</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Nombre de pièces</div><div class="annexe-item-value">' + annexeVal(carac?.nombrePieces) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Chambres</div><div class="annexe-item-value">' + annexeVal(carac?.nombreChambres) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Salles de bain</div><div class="annexe-item-value">' + annexeVal(carac?.nombreSDB) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">WC</div><div class="annexe-item-value">' + annexeVal(carac?.nombreWC) + '</div></div>';
  html += '</div>';
  
  if (isAppartement) {
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Étage</div><div class="annexe-item-value">' + annexeVal(carac?.etage) + '/' + annexeVal(carac?.nombreEtagesImmeuble) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Ascenseur</div><div class="annexe-item-value">' + (carac?.ascenseur === 'oui' ? 'Oui' : (carac?.ascenseur === 'non' ? 'Non' : '–')) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Dernier étage</div><div class="annexe-item-value">' + (carac?.dernierEtage ? 'Oui' : 'Non') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Sous-type</div><div class="annexe-item-value">' + annexeVal(sousTypeLabels[carac?.sousType || ''] || carac?.sousType) + '</div></div>';
    html += '</div>';
  } else {
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Niveaux</div><div class="annexe-item-value">' + annexeVal(carac?.nombreNiveaux) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Sous-type</div><div class="annexe-item-value">' + annexeVal(sousTypeLabels[carac?.sousType || ''] || carac?.sousType) + '</div></div>';
    html += '</div>';
  }
  
  // Exposition et vue
  const expositionText = (carac?.exposition || []).length > 0 ? carac!.exposition.join(', ') : '–';
  html += '<div class="annexe-grid-2" style="margin-top:6px;">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Exposition</div><div class="annexe-item-value">' + expositionText + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Vue</div><div class="annexe-item-value">' + annexeVal(vueLabels[carac?.vue || ''] || carac?.vue) + '</div></div>';
  html += '</div>';
  
  html += '</div>'; // fin section
  
  // Section Énergie & Charges
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('zap', 12, '#FF4539') + ' Énergie & Charges</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">CECB</div><div class="annexe-item-value">' + annexeVal(carac?.cecb) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Vitrage</div><div class="annexe-item-value">' + annexeVal(carac?.vitrage) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Chauffage</div><div class="annexe-item-value">' + annexeVal(chauffageLabels[carac?.chauffage || ''] || carac?.chauffage) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Charges mensuelles</div><div class="annexe-item-value">' + annexeVal(carac?.chargesMensuelles, ' CHF') + '</div></div>';
  html += '</div>';
  
  // Diffusion chaleur
  const diffusionArr = isAppartement ? (carac?.diffusion || []) : (carac?.diffusionMaison || []);
  if (diffusionArr.length > 0) {
    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Diffusion : </span>';
    diffusionArr.forEach(d => { html += '<span class="annexe-chip">' + (diffusionLabels[d] || d) + '</span> '; });
    html += '</div>';
  }
  html += '</div>';
  
  // Section Annexes & Stationnement
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('parking', 12, '#FF4539') + ' Annexes & Stationnement</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Parking intérieur</div><div class="annexe-item-value">' + annexeVal(carac?.parkingInterieur) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Parking extérieur</div><div class="annexe-item-value">' + annexeVal(carac?.parkingExterieur) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Place couverte</div><div class="annexe-item-value">' + annexeVal(carac?.parkingCouverte) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Box</div><div class="annexe-item-value">' + annexeVal(carac?.box) + '</div></div>';
  html += '</div>';
  
  if (isAppartement) {
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Cave</div><div class="annexe-item-value">' + (carac?.cave === true ? 'Oui' : (carac?.cave === false ? 'Non' : '–')) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Buanderie</div><div class="annexe-item-value">' + annexeVal(buanderieLabels[carac?.buanderie || '']) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Piscine</div><div class="annexe-item-value">' + (carac?.piscine ? 'Oui' : 'Non') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Autres</div><div class="annexe-item-value">' + annexeVal(carac?.autresAnnexes) + '</div></div>';
    html += '</div>';
  }
  
  // Espaces maison
  if (!isAppartement && (carac?.espacesMaison || []).length > 0) {
    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Espaces : </span>';
    (carac!.espacesMaison || []).forEach(e => { 
      html += '<span class="annexe-chip">' + (espaceLabels[e] || e) + '</span> '; 
    });
    html += '</div>';
  }
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page ' + pageNum + '/' + totalPages + ' • Annexe Technique (1/2)</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

function generatePageAnnexeTechnique2(
  data: EstimationData,
  pageNum: number,
  totalPages: number
): string {
  const identification = data.identification;
  const historique = identification?.historique;
  const analyse = data.analyseTerrain;
  
  const renderEtatDots = (value: number | string | undefined): string => {
    const num = typeof value === 'number' ? value : (parseInt(String(value)) || 0);
    let dots = '';
    for (let i = 1; i <= 5; i++) {
      const color = i <= num ? (num >= 4 ? '#10b981' : (num >= 2 ? '#f59e0b' : '#ef4444')) : '#e5e7eb';
      dots += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:2px;"></span>`;
    }
    return `<div class="annexe-item-value">${dots}</div>`;
  };
  
  const cleanEmoji = (str: string): string => {
    if (!str) return str;
    const idx = str.indexOf(' ');
    if (idx > 0 && idx <= 6) {
      return str.substring(idx + 1);
    }
    return str;
  };
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">Annexe Technique (2/2)</div>';
  html += '</div>';
  
  // Section État du bien
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('eye', 12, '#FF4539') + ' État du bien (observation visite)</div>';
  html += '<div class="annexe-grid-3">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Cuisine</div>' + renderEtatDots(analyse.etatCuisine) + '</div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Salles d\'eau</div>' + renderEtatDots(analyse.etatSDB) + '</div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Sols</div>' + renderEtatDots(analyse.etatSols) + '</div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Murs/Peintures</div>' + renderEtatDots(analyse.etatMurs) + '</div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Menuiseries</div>' + renderEtatDots(analyse.etatMenuiseries) + '</div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Électricité</div>' + renderEtatDots(analyse.etatElectricite) + '</div>';
  html += '</div>';
  html += '<div class="annexe-grid-3" style="margin-top:6px;">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Luminosité</div>' + renderEtatDots(analyse.luminosite) + '</div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Calme</div>' + renderEtatDots(analyse.calme) + '</div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Volumes</div>' + renderEtatDots(analyse.volumes) + '</div>';
  html += '</div>';
  html += '<div class="annexe-grid-3" style="margin-top:6px;">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Impression générale</div>' + renderEtatDots(analyse.impressionGenerale) + '</div>';
  html += '</div>';
  html += '</div>';
  
  // Section Points forts / faibles
  const pf = analyse.pointsForts || [];
  const pfaibles = analyse.pointsFaibles || [];
  
  if (pf.length > 0 || pfaibles.length > 0) {
    html += '<div class="annexe-section">';
    html += '<div class="annexe-title">' + ico('list', 12, '#FF4539') + ' Points forts & faibles</div>';
    if (pf.length > 0) {
      html += '<div style="margin-bottom:6px;"><span style="font-size:8px;color:#065f46;font-weight:600;">POINTS FORTS : </span>';
      pf.forEach(p => { html += '<span class="annexe-chip positive">' + cleanEmoji(p) + '</span> '; });
      html += '</div>';
    }
    if (pfaibles.length > 0) {
      html += '<div><span style="font-size:8px;color:#991b1b;font-weight:600;">POINTS FAIBLES : </span>';
      pfaibles.forEach(p => { html += '<span class="annexe-chip negative">' + cleanEmoji(p) + '</span> '; });
      html += '</div>';
    }
    html += '</div>';
  }
  
  // Section Nuisances
  const nuisances = analyse.nuisances || [];
  if (nuisances.length > 0) {
    html += '<div class="annexe-section">';
    html += '<div class="annexe-title">' + ico('alert', 12, '#FF4539') + ' Nuisances identifiées</div>';
    html += '<div class="annexe-row">';
    nuisances.forEach(n => { html += '<span class="annexe-chip negative">' + (nuisanceLabels[n] || n) + '</span> '; });
    html += '</div></div>';
  }
  
  // Section Objections acheteurs
  if (analyse.objectionsAcheteurs) {
    html += '<div class="annexe-section">';
    html += '<div class="annexe-title">' + ico('alert', 12, '#FF4539') + ' Objections acheteurs anticipées</div>';
    html += '<div style="font-size:9px;color:#4b5563;line-height:1.4;">' + analyse.objectionsAcheteurs + '</div>';
    html += '</div>';
  }
  
  // Section Historique diffusion
  if (historique.dejaDiffuse) {
    html += '<div class="annexe-section">';
    html += '<div class="annexe-title">' + ico('clock', 12, '#FF4539') + ' Historique de diffusion</div>';
    html += '<div class="annexe-grid">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Durée</div><div class="annexe-item-value">' + (dureeLabels[historique.duree || ''] || '–') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Type diffusion</div><div class="annexe-item-value">' + (typeDiffusionLabels[historique.typeDiffusion || ''] || '–') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Prix affiché</div><div class="annexe-item-value">' + (historique.prixAffiche ? formatPrice(parseNum(historique.prixAffiche)) : '–') + '</div></div>';
    html += '</div>';
    
    // Portails utilisés
    const portailsUtilises = historique.portails || [];
    if (portailsUtilises.length > 0) {
      html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Portails utilisés : </span>';
      portailsUtilises.forEach(p => { html += '<span class="annexe-chip">' + (portailsLabels[p] || p) + '</span> '; });
      html += '</div>';
    }
    
    // Raisons échec
    const raisonsEchec = historique.raisonEchec || [];
    if (raisonsEchec.length > 0) {
      html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#991b1b;">Raisons échec perçues : </span>';
      raisonsEchec.forEach(r => { html += '<span class="annexe-chip negative">' + (raisonEchecLabels[r] || r) + '</span> '; });
      html += '</div>';
    }
    html += '</div>';
  }
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page ' + pageNum + '/' + totalPages + ' • Annexe Technique (2/2)</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

interface PhotoItem {
  dataUrl: string;
  category?: string;
  label?: string;
}

function generatePagePhotos(
  photos: PhotoItem[],
  pageIndex: number,
  photoPagesCount: number,
  pageNum: number,
  totalPages: number
): string {
  const startIdx = pageIndex * 9;
  const endIdx = Math.min(startIdx + 9, photos.length);
  const pagePhotos = photos.slice(startIdx, endIdx);
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">Annexe photos' + (photoPagesCount > 1 ? ' (' + (pageIndex + 1) + '/' + photoPagesCount + ')' : '') + '</div>';
  html += '</div>';
  
  // Grille de photos
  html += '<div class="photos-grid-pdf">';
  pagePhotos.forEach(photo => {
    html += '<div class="photo-cell">';
    html += '<img src="' + photo.dataUrl + '" alt="Photo" />';
    html += '</div>';
  });
  
  // Remplir les cellules vides
  const emptyCells = 9 - pagePhotos.length;
  for (let ec = 0; ec < emptyCells; ec++) {
    html += '<div class="photo-cell" style="background:#f8fafc;"></div>';
  }
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page ' + pageNum + '/' + totalPages + ' • Annexe photos</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

async function generatePageMap(
  data: EstimationData,
  pageNum: number,
  totalPages: number,
  googleMapsKey?: string
): Promise<string> {
  const identification = data.identification;
  const bien = identification?.adresse;
  const coords = bien?.coordinates;
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
  html += '<div class="header-date">Annexe cartographie</div>';
  html += '</div>';
  
  // Adresse
  html += '<div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:flex;align-items:center;gap:10px;">';
  html += ico('mapPin', 20, '#1a2e35');
  html += '<div>';
  html += '<div style="font-size:14px;font-weight:600;color:#1a2e35;">' + val(bien.rue) + '</div>';
  html += '<div style="font-size:11px;color:#6b7280;">' + val(bien.codePostal) + ' ' + val(bien.localite) + '</div>';
  html += '</div></div></div>';
  
  // Récupérer mapState sauvegardé si disponible
  const savedMapState = (bien as any)?.mapState;
  const mapZoom = savedMapState?.zoom || 18;
  const mapType = savedMapState?.mapType || 'satellite';
  const markerPos = savedMapState?.markerPosition || coords;
  const mapCenter = savedMapState?.center || coords;
  
  // Carte Google (static) — taille max 640px côté API, on utilise scale=2 pour la netteté
  if (coords && coords.lat && coords.lng && googleMapsKey) {
    const centerLat = mapCenter?.lat || coords.lat;
    const centerLng = mapCenter?.lng || coords.lng;
    const markerLat = markerPos?.lat || coords.lat;
    const markerLng = markerPos?.lng || coords.lng;
    
    // Construire l'URL avec les paramètres sauvegardés
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${Math.min(mapZoom, 20)}&size=640x400&scale=2&format=png&maptype=${mapType}&markers=color:red%7C${markerLat},${markerLng}&key=${googleMapsKey}`;
    
    html += '<div style="padding:16px 24px 8px;">';
    html += '<div style="font-size:9px;color:#6b7280;margin:0 0 8px 0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Vue satellite</div>';
    html += '<img src="' + mapUrl + '" style="width:100%;border-radius:8px;border:1px solid #e5e7eb;" alt="Carte satellite" crossorigin="anonymous" />';
    html += '</div>';
    
    // Coordonnées
    html += '<div style="padding:4px 24px 12px;text-align:center;">';
    html += '<span style="font-size:8px;color:#9ca3af;">Coordonnées : ' + coords.lat.toFixed(6) + ', ' + coords.lng.toFixed(6) + '</span>';
    html += '</div>';
  } else if (coords && coords.lat && coords.lng) {
    // Si pas de clé Google mais coordonnées disponibles
    html += '<div style="padding:16px 24px;text-align:center;background:#f9fafb;border-radius:8px;margin:16px 24px;">';
    html += '<div style="font-size:11px;color:#6b7280;">Carte satellite non disponible</div>';
    html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Coordonnées : ' + coords.lat.toFixed(6) + ', ' + coords.lng.toFixed(6) + '</div>';
    html += '</div>';
  } else {
    html += '<div style="padding:40px 24px;text-align:center;background:#f9fafb;">';
    html += '<div style="color:#9ca3af;">' + ico('mapPin', 48, '#d1d5db') + '</div>';
    html += '<div style="font-size:12px;color:#6b7280;margin-top:12px;">Carte non disponible</div>';
    html += '<div style="font-size:10px;color:#9ca3af;margin-top:4px;">Coordonnées GPS non renseignées</div>';
    html += '</div>';
  }
  
  // Carte cadastre (Swisstopo WMTS) — utilise le même système de tuiles que Leaflet
  if (coords && coords.lat && coords.lng) {
    // Zoom 19 comme dans CadastreMap.tsx
    const zoom = 19;
    const n = Math.pow(2, zoom);
    
    // Conversion lat/lng vers tuile XY (Web Mercator / EPSG:3857)
    const xtile = Math.floor(((coords.lng + 180) / 360) * n);
    const latRad = (coords.lat * Math.PI) / 180;
    const ytile = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    
    // Calculer la position du marqueur dans la grille
    const xFrac = (((coords.lng + 180) / 360) * n) - xtile;
    const yFrac = (((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n) - ytile;
    
    // Position du marqueur en % dans la grille 3x3 (tuile centrale = 33-66%)
    const markerLeftPct = ((1 + xFrac) / 3) * 100;
    const markerTopPct = ((1 + yFrac) / 3) * 100;

    const cadastreBase = 'https://wmts.geo.admin.ch/1.0.0/ch.kantone.cadastralwebmap-farbe/default/current/3857';

    html += '<div style="padding:0 24px 16px;">';
    html += '<div style="font-size:9px;color:#6b7280;margin:0 0 8px 0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Plan cadastral (parcelles)</div>';
    html += '<div style="position:relative;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;height:260px;background:#f0f4f0;">';
    html += '<div style="display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:repeat(3, 1fr);width:100%;height:100%;">';

    // Grille 3x3 centrée sur la tuile contenant le point
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = xtile + dx;
        const y = ytile + dy;
        const tileUrl = `${cadastreBase}/${zoom}/${x}/${y}.png`;
        html += '<img src="' + tileUrl + '" style="width:100%;height:100%;object-fit:cover;display:block;" alt="" crossorigin="anonymous" />';
      }
    }

    html += '</div>'; // grid
    // Marqueur positionné précisément
    html += '<div style="position:absolute;left:' + markerLeftPct.toFixed(2) + '%;top:' + markerTopPct.toFixed(2) + '%;transform:translate(-50%,-50%);width:16px;height:16px;background:#FA4238;border:3px solid #ffffff;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>';
    html += '</div>'; // map container
    html += '</div>'; // padding
  }
  
  // Section transports (si données proximités disponibles)
  const proximitesArray = (data.identification as any)?.proximites || [];
  
  // Trouver les transports dans le tableau
  const arret = proximitesArray.find((p: any) => p.type === 'transport_bus' && p.libelle);
  const gare = proximitesArray.find((p: any) => (p.type === 'transport_tram' || p.type === 'gare') && p.libelle);
  
  if (arret || gare) {
    html += '<div style="padding:14px 24px;background:white;border-top:1px solid #e5e7eb;">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">';
    html += ico('clock', 14, '#FF4539');
    html += '<span style="font-size:10px;color:#1a2e35;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Transports à proximité</span>';
    html += '</div>';
    
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    
    // Arrêt bus/tram
    if (arret) {
      const arretDistance = arret.distance || '—';
      const arretTemps = arret.tempsMarche || '—';
      
      html += '<div style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);border:1px solid #e2e8f0;border-radius:6px;padding:12px;">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
      html += '<div style="width:28px;height:28px;background:white;border-radius:6px;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;">';
      html += ico('bus', 16, '#1a2e35');
      html += '</div>';
      html += '<div>';
      html += '<div style="font-size:7px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Arrêt bus / tram</div>';
      html += '<div style="font-size:10px;font-weight:600;color:#1a2e35;margin-top:2px;">' + (arret.libelle || '—') + '</div>';
      html += '</div></div>';
      html += '<div style="font-size:9px;color:#64748b;display:flex;align-items:center;gap:6px;">';
      html += '<span>' + arretDistance + '</span>';
      html += '<span style="background:#FA4238;color:white;padding:2px 6px;border-radius:8px;font-size:8px;font-weight:600;">' + arretTemps + '</span>';
      html += '</div>';
      html += '</div>';
    } else {
      html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;color:#94a3b8;font-size:9px;text-align:center;">Aucun arrêt à proximité</div>';
    }
    
    // Gare/Tram
    if (gare) {
      const gareDistance = gare.distance || '—';
      const gareTemps = gare.tempsMarche || '—';
      const gareType = gare.type === 'gare' ? 'Gare ferroviaire' : 'Tram / Train';
      
      html += '<div style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);border:1px solid #e2e8f0;border-radius:6px;padding:12px;">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
      html += '<div style="width:28px;height:28px;background:white;border-radius:6px;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;">';
      html += ico('train', 16, '#1a2e35');
      html += '</div>';
      html += '<div>';
      html += '<div style="font-size:7px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">' + gareType + '</div>';
      html += '<div style="font-size:10px;font-weight:600;color:#1a2e35;margin-top:2px;">' + (gare.libelle || '—') + '</div>';
      html += '</div></div>';
      html += '<div style="font-size:9px;color:#64748b;display:flex;align-items:center;gap:6px;">';
      html += '<span>' + gareDistance + '</span>';
      html += '<span style="background:#FA4238;color:white;padding:2px 6px;border-radius:8px;font-size:8px;font-weight:600;">' + gareTemps + '</span>';
      html += '</div>';
      html += '</div>';
    } else {
      html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;color:#94a3b8;font-size:9px;text-align:center;">Aucune gare à proximité</div>';
    }
    
    html += '</div>'; // fin grid
    html += '</div>'; // fin section transports
  }
  
  // Disclaimer
  html += '<div style="padding:12px 24px;background:#f8fafc;">';
  html += '<div style="font-size:8px;color:#9ca3af;text-align:center;font-style:italic;">';
  html += 'Cette carte est fournie à titre indicatif. Les limites de propriété exactes doivent être vérifiées au registre foncier.';
  html += '</div></div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
  html += '<div class="footer-ref">Page ' + pageNum + '/' + totalPages + ' • Cartographie</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  return html;
}

// ============================================
// FETCH PHOTOS (Supabase Storage → Base64)
// ============================================

async function fetchPhotosAsBase64(data: EstimationData): Promise<PhotoItem[]> {
  const photos = data.photos?.items || [];
  const photoItems: PhotoItem[] = [];
  
  for (const photo of photos) {
    try {
      // Si déjà en base64
      if (photo.dataUrl && photo.dataUrl.startsWith('data:')) {
        photoItems.push({
          dataUrl: photo.dataUrl,
          category: photo.categorie,
          label: photo.titre || photo.nom
        });
        continue;
      }
      
      // Si URL Supabase Storage
      if (photo.storageUrl) {
        const response = await fetch(photo.storageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          photoItems.push({
            dataUrl,
            category: photo.categorie,
            label: photo.titre || photo.nom
          });
        }
      }
    } catch (error) {
      console.warn('Erreur chargement photo:', error);
    }
  }
  
  return photoItems;
}

// ============================================
// FETCH GOOGLE MAPS KEY
// ============================================

async function fetchGoogleMapsKey(): Promise<string | undefined> {
  try {
    const { data, error } = await supabase.functions.invoke('get-maps-key');
    if (error) throw error;
    return data?.key;
  } catch (error) {
    console.warn('Erreur récupération clé Google Maps:', error);
    return undefined;
  }
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

export interface PDFStandaloneOptions {
  inclurePhotos?: boolean;
  inclureCarte?: boolean;
  onProgress?: (message: string, percent: number) => void;
}

export async function generatePDFStandalone(
  data: EstimationData,
  options: PDFStandaloneOptions = {}
): Promise<void> {
  const { 
    inclurePhotos = true, 
    inclureCarte = true,
    onProgress 
  } = options;
  
  const notify = (msg: string, pct: number) => {
    if (onProgress) onProgress(msg, pct);
    console.log(`[PDF] ${msg} (${pct}%)`);
  };
  
  try {
    notify('Préparation des données...', 5);
    
    const dateNow = new Date();
    const dateStr = formatDate(dateNow);
    const heureStr = formatTime(dateNow);
    
    // Calculs métier
    const calculs = calculerValeurs(data);
    const capitalVis = calculerCapitalVisibilite(data, calculs.totalVenale);
    const luxModeData = calculerLuxMode(data, calculs.totalVenaleArrondi);
    
    notify('Chargement des photos...', 15);
    
    // Charger photos si demandé
    let photoItems: PhotoItem[] = [];
    if (inclurePhotos) {
      photoItems = await fetchPhotosAsBase64(data);
    }
    const photoPagesCount = Math.ceil(photoItems.length / 9);
    
    notify('Récupération de la clé Google Maps...', 25);
    
    // Récupérer clé Google Maps si carte demandée
    let googleMapsKey: string | undefined;
    if (inclureCarte) {
      googleMapsKey = await fetchGoogleMapsKey();
    }
    
    // Calculer nombre total de pages
    let totalPages = 7; // Pages de base (1-5 + 2 annexes techniques)
    if (photoItems.length > 0) totalPages += photoPagesCount;
    if (inclureCarte && data.identification?.adresse?.coordinates) totalPages += 1;
    
    notify('Génération des pages...', 35);
    
    // Générer le HTML
    let html = '<!DOCTYPE html><html><head>';
    html += '<meta charset="UTF-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    html += '<title>Estimation GARY - ' + (data.identification?.adresse?.rue || 'Export') + '</title>';
    html += '<style>' + getStyles() + '</style>';
    html += '</head><body>';
    
    // Page 1 : Couverture
    notify('Génération page 1 (Couverture)...', 40);
    html += generatePage1Cover(data, calculs, dateStr, heureStr, totalPages);
    
    // Page 2 : Qui est GARY
    notify('Génération page 2 (Qui est GARY)...', 45);
    html += generatePage2Gary(dateStr, totalPages);
    
    // Page 3 : Stratégie / Trajectoires
    notify('Génération page 3 (Stratégie)...', 50);
    html += generatePage3Strategie(data, calculs, capitalVis, luxModeData, totalPages);
    
    // Page 4 : Plan d'action
    notify('Génération page 4 (Plan d\'action)...', 55);
    html += generatePage4PlanAction(data, calculs, capitalVis, dateStr, heureStr, totalPages);
    
    // Page 5 : Méthodologie
    notify('Génération page 5 (Méthodologie)...', 60);
    html += generatePage5Methodologie(data, calculs, dateStr, totalPages);
    
    // Page 6-7 : Annexes techniques
    notify('Génération annexes techniques...', 65);
    html += generatePageAnnexeTechnique1(data, calculs, 6, totalPages);
    html += generatePageAnnexeTechnique2(data, 7, totalPages);
    
    // Pages photos
    let currentPage = 8;
    if (photoItems.length > 0) {
      notify('Génération pages photos...', 75);
      for (let i = 0; i < photoPagesCount; i++) {
        html += generatePagePhotos(photoItems, i, photoPagesCount, currentPage, totalPages);
        currentPage++;
      }
    }
    
    // Page carte
    if (inclureCarte && data.identification?.adresse?.coordinates) {
      notify('Génération page carte...', 85);
      html += await generatePageMap(data, currentPage, totalPages, googleMapsKey);
    }
    
    html += '</body></html>';
    
    notify('Ouverture fenêtre d\'impression...', 95);
    
    // Ouvrir dans une nouvelle fenêtre et imprimer
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les bloqueurs de popups.');
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Attendre le chargement des images puis imprimer
    printWindow.onload = () => {
      const images = Array.from(printWindow.document.images || []);
      const waitForOne = (img: HTMLImageElement) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            });

      Promise.all(images.map(waitForOne)).then(() => {
        setTimeout(() => {
          printWindow.print();
          notify('PDF prêt !', 100);
        }, 300);
      });
    };
    
  } catch (error) {
    console.error('[PDF] Erreur génération:', error);
    throw error;
  }
}

// Export par défaut
export default generatePDFStandalone;
