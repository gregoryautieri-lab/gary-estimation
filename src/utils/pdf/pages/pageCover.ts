/**
 * Page Couverture du PDF GARY
 * Exactement comme le fichier source original
 */

import { ico, getLogo, val } from '../index';

interface CoverPageData {
  typeBien: string;
  isAppartement: boolean;
  sousType?: string;
  adresse?: string;
  codePostal?: string;
  localite?: string;
  surfacePrincipale: number;
  nbPieces?: number | string;
  anneeConstruction?: number | string;
  etage?: number | string;
  nbEtages?: number | string;
}

// Mapping des sous-types pour un affichage propre
const SOUS_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  duplex: 'Duplex',
  attique: 'Attique',
  loft: 'Loft',
  studio: 'Studio',
  villa: 'Villa',
  villa_individuelle: 'Villa Individuelle',
  villa_mitoyenne: 'Villa Mitoyenne',
  villa_jumelle: 'Villa Jumelle',
  ferme: 'Ferme',
  chalet: 'Chalet'
};

function formatSousType(sousType?: string): string {
  if (!sousType) return '';
  return SOUS_TYPE_LABELS[sousType] || sousType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function generateCoverPage(data: CoverPageData): string {
  let html = '';

  html += '<div class="page cover">';

  // Hero section avec stats GARY
  html += '<div class="cover-hero">';
  html += '<div class="cover-logo">' + getLogo('red', 60) + '</div>';
  html += '<div class="cover-title">Votre stratégie de vente</div>';
  html += '<div class="cover-subtitle">sur mesure</div>';
  html += '<div class="cover-divider"></div>';

  // Stats marketing
  html += '<div class="cover-stats">';
  html += '<div class="cover-stat"><div class="cover-stat-value">6.6M+</div><div class="cover-stat-label">Vues en 2025</div></div>';
  html += '<div class="cover-stat"><div class="cover-stat-value">40K+</div><div class="cover-stat-label">Communauté</div></div>';
  html += '<div class="cover-stat"><div class="cover-stat-value">5.0 ★</div><div class="cover-stat-label">(91 avis) Google</div></div>';
  html += '<div class="cover-stat"><div class="cover-stat-value">3.5</div><div class="cover-stat-label">Mois en moyenne</div></div>';
  html += '</div>';

  // Réseaux sociaux
  html += '<div class="cover-social">';
  html += '<div class="cover-social-item">' + ico('instagram', 14, 'rgba(255,255,255,0.7)') + ' 33K</div>';
  html += '<div class="cover-social-item">' + ico('linkedin', 14, 'rgba(255,255,255,0.7)') + ' 3.4K</div>';
  html += '<div class="cover-social-item">' + ico('tiktok', 14, 'rgba(255,255,255,0.7)') + ' 4.6K</div>';
  html += '</div>';
  html += '</div>';

  // Section bien - design unifié sombre
  html += '<div class="cover-bien">';

  // Type de bien avec sous-type formaté
  const sousTypeLabel = formatSousType(data.sousType);
  html += '<div class="cover-bien-type">' + ico(data.isAppartement ? 'building' : 'home', 16, 'rgba(255,255,255,0.6)') + ' ' + data.typeBien + (sousTypeLabel ? ' • ' + sousTypeLabel : '') + '</div>';

  // Adresse
  html += '<div class="cover-address">';
  html += '<div class="cover-address-main">' + val(data.adresse) + '</div>';
  html += '<div class="cover-address-city">' + val(data.codePostal) + ' ' + val(data.localite) + '</div>';
  html += '<div class="cover-address-bar"></div>';
  html += '</div>';

  // Métriques clés
  html += '<div class="cover-metrics">';
  html += '<div class="cover-metric"><div class="cover-metric-value">' + (data.surfacePrincipale > 0 ? Math.round(data.surfacePrincipale) : '-') + '<span class="cover-metric-unit"> m²</span></div><div class="cover-metric-label">Surface</div></div>';
  html += '<div class="cover-metric"><div class="cover-metric-value">' + val(data.nbPieces) + '<span class="cover-metric-unit"> pcs</span></div><div class="cover-metric-label">Pièces</div></div>';
  html += '<div class="cover-metric"><div class="cover-metric-value">' + val(data.anneeConstruction) + '</div><div class="cover-metric-label">Construction</div></div>';
  html += '</div>';

  // Tags compacts
  html += '<div class="cover-tags">';
  if (data.isAppartement && data.etage) {
    html += '<span class="cover-tag">' + ico('etage', 12, 'rgba(255,255,255,0.5)') + ' ' + data.etage + (data.nbEtages ? '/' + data.nbEtages : '') + 'e étage</span>';
  }
  html += '</div>';

  html += '</div>';
  html += '</div>';

  return html;
}
