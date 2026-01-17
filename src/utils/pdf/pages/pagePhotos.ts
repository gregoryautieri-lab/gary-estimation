/**
 * Pages Photos : Annexe photos du bien
 * Génère le HTML pour les pages de photos
 */

import { EstimationData } from '@/types/estimation';
import { getLogo } from '../pdfLogos';

interface PagePhotosConfig {
  startPageNum: number;
  totalPages: number;
  refId: string;
}

export interface PhotoItem {
  dataUrl: string;
  category?: string;
  label?: string;
}

/**
 * Génère les pages photos (9 photos par page)
 */
export function generatePhotosPages(
  photos: PhotoItem[],
  config: PagePhotosConfig
): string {
  if (!photos || photos.length === 0) {
    return '';
  }
  
  const photosPerPage = 9;
  const pagesCount = Math.ceil(photos.length / photosPerPage);
  
  let html = '';
  
  // Style grille photos
  html += '<style>';
  html += '.photos-grid-pdf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 16px 24px; }';
  html += '.photo-cell { aspect-ratio: 1; overflow: hidden; border-radius: 6px; background: #f3f4f6; }';
  html += '.photo-cell img { width: 100%; height: 100%; object-fit: cover; }';
  html += '</style>';
  
  // Générer les pages photos
  for (let pageIdx = 0; pageIdx < pagesCount; pageIdx++) {
    const startIdx = pageIdx * photosPerPage;
    const endIdx = Math.min(startIdx + photosPerPage, photos.length);
    const pagePhotos = photos.slice(startIdx, endIdx);
    const photoPageNum = config.startPageNum + pageIdx;
    
    html += '<div class="page" style="page-break-before:always;">';
    
    // Header
    html += '<div class="header">';
    html += '<div>' + getLogo('white', 28) + '</div>';
    html += '<div class="header-date">Annexe photos' + (pagesCount > 1 ? ' (' + (pageIdx + 1) + '/' + pagesCount + ')' : '') + '</div>';
    html += '</div>';
    
    // Grille de photos
    html += '<div class="photos-grid-pdf">';
    pagePhotos.forEach((photo) => {
      html += '<div class="photo-cell">';
      html += '<img src="' + photo.dataUrl + '" alt="Photo" />';
      html += '</div>';
    });
    
    // Remplir les cellules vides
    const emptyCells = photosPerPage - pagePhotos.length;
    for (let ec = 0; ec < emptyCells; ec++) {
      html += '<div class="photo-cell" style="background:#f8fafc;"></div>';
    }
    html += '</div>';
    
    // Footer
    html += '<div class="footer">';
    html += '<div>' + getLogo('white', 18) + '</div>';
    html += '<div class="footer-ref">Page ' + photoPageNum + '/' + config.totalPages + ' • Annexe photos</div>';
    html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
    html += '</div>';
    
    html += '</div>';
  }
  
  return html;
}

/**
 * Génère la page annexe cartographie
 */
export function generateMapPage(
  data: EstimationData,
  config: { pageNum: number; totalPages: number; refId: string }
): string {
  const bien = data.identification?.bien || {};
  
  if (!bien.mapLat || !bien.mapLng) {
    return '';
  }
  
  // Créer URL carte statique OpenStreetMap
  const lat = bien.mapLat;
  const lng = bien.mapLng;
  const zoom = 15;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + getLogo('white', 28) + '</div>';
  html += '<div class="header-date">Annexe cartographie</div>';
  html += '</div>';
  
  html += '<div style="padding:16px 24px;">';
  html += '<div style="font-size:12px;font-weight:700;color:#1a2e35;margin-bottom:12px;">📍 Localisation du bien</div>';
  
  // Adresse
  html += '<div style="margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e5e7eb;">';
  html += '<div style="font-size:11px;font-weight:600;color:#1a2e35;">' + (bien.adresse || '-') + '</div>';
  html += '<div style="font-size:10px;color:#6b7280;margin-top:2px;">' + (data.code_postal || '') + ' ' + (data.localite || '') + '</div>';
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Coordonnées : ' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</div>';
  html += '</div>';
  
  // Placeholder pour la carte (image statique)
  html += '<div style="width:100%;height:400px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #e5e7eb;">';
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:48px;margin-bottom:8px;">🗺️</div>';
  html += '<div style="font-size:11px;color:#6b7280;">Carte de localisation</div>';
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">' + (bien.adresse || '-') + '</div>';
  html += '</div>';
  html += '</div>';
  
  // Note
  html += '<div style="margin-top:12px;font-size:8px;color:#9ca3af;text-align:center;">';
  html += 'Cette carte est fournie à titre indicatif. Position approximative du bien.';
  html += '</div>';
  
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + getLogo('white', 18) + '</div>';
  html += '<div class="footer-ref">Page ' + config.pageNum + '/' + config.totalPages + ' • Annexe cartographie</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}
