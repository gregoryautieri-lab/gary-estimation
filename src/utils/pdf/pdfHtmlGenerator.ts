/**
 * GARY PDF Generator - HTML/CSS based (html2pdf.js style)
 * Page 1: Couverture
 */

import { EstimationData } from "@/types/estimation";

// ==================== LOGOS SVG ====================
export const logoWhite = '<svg viewBox="0 0 1372 309"><g fill="#FFFFFF"><path d="M12,156.2C12,72.9,73.2,9.4,162.1,9.4c58.5,0,102.7,25.5,127,62l-42.8,27.8c-15.7-26.5-44.7-44.1-84.2-44.1c-57.8,0-96.3,43.4-96.3,101.1c0,58.1,38.6,101.9,96.3,101.9c47.2,0,81-26.3,89.6-68.5h-92.5v-43.9h151c0,93.3-57.2,157.4-148.1,157.4C73.2,303,12,239.5,12,156.2z"/><path d="M505.7,15.2h57l114.6,282.1h-53.5L594.4,223H474l-29.4,74.3h-53.3L505.7,15.2z M577.9,178.5L534.3,67.7l-43.8,110.7H577.9z"/><path d="M787.6,15.2h100.4c69.1,0,101.1,32.2,101.1,80.2c0,40.1-26.1,71-76,77.3l110.3,124.5h-63.1L854.7,175.8h-16.5v121.5h-50.7V15.2z M883.7,134.1c34.7,0,51.4-13.2,51.4-38.2c0-24.9-16.7-38.2-51.4-38.2h-45.5v76.4H883.7z"/><path d="M1192.1,177.1l-112.3-162h56.6l81.2,119.5l81.2-119.5h56.4l-112.4,162v120.1h-50.7V177.1z"/></g></svg>';

export const logoRed = '<svg viewBox="0 0 1372 309"><g fill="#FF4539"><path d="M12,156.2C12,72.9,73.2,9.4,162.1,9.4c58.5,0,102.7,25.5,127,62l-42.8,27.8c-15.7-26.5-44.7-44.1-84.2-44.1c-57.8,0-96.3,43.4-96.3,101.1c0,58.1,38.6,101.9,96.3,101.9c47.2,0,81-26.3,89.6-68.5h-92.5v-43.9h151c0,93.3-57.2,157.4-148.1,157.4C73.2,303,12,239.5,12,156.2z"/><path d="M505.7,15.2h57l114.6,282.1h-53.5L594.4,223H474l-29.4,74.3h-53.3L505.7,15.2z M577.9,178.5L534.3,67.7l-43.8,110.7H577.9z"/><path d="M787.6,15.2h100.4c69.1,0,101.1,32.2,101.1,80.2c0,40.1-26.1,71-76,77.3l110.3,124.5h-63.1L854.7,175.8h-16.5v121.5h-50.7V15.2z M883.7,134.1c34.7,0,51.4-13.2,51.4-38.2c0-24.9-16.7-38.2-51.4-38.2h-45.5v76.4H883.7z"/><path d="M1192.1,177.1l-112.3-162h56.6l81.2,119.5l81.2-119.5h56.4l-112.4,162v120.1h-50.7V177.1z"/></g></svg>';

// ==================== ICÔNES SVG ====================
const iconPaths: Record<string, string> = {
  // Métriques bien
  surface: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
  pieces: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  chambres: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  etage: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  terrain: '<path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z"/><circle cx="12" cy="10" r="3"/>',
  construction: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  // Ambiance
  luminosite: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  calme: '<path d="M18 8a6 6 0 0 0-12 0c0 7 6 13 6 13s6-6 6-13Z"/><circle cx="12" cy="8" r="2"/>',
  volumes: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  // Proximités
  bus: '<path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M18 18H6a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  train: '<path d="M8 3h8l4 6v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9l4-6Z"/><path d="M10 19v3"/><path d="M14 19v3"/><path d="M9 3v6"/><path d="M15 3v6"/><path d="M4 9h16"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
  ecole: '<path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>',
  commerce: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  // États
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  // Navigation
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  parking: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  bath: '<path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="7" y1="19" x2="7" y2="21"/><line x1="17" y1="19" x2="17" y2="21"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  tree: '<path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 20v0H10v0A6.5 6.5 0 0 1 7 8h0a5 5 0 0 1 10 0Z"/><path d="m14 14-2 2"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  trendingUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
  // Réseaux sociaux
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
};

export function ico(name: string, size: number = 20, color: string = '#64748b'): string {
  const path = iconPaths[name] || '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">${path}</svg>`;
}

// ==================== UTILITAIRES ====================
export function val(v: any): string {
  return v || '–';
}

export function formatPrice(n: number): string {
  if (!n) return '–';
  return n.toLocaleString('fr-CH') + ' CHF';
}

export function parseNum(v: any): number {
  return parseFloat(v) || 0;
}

// ==================== STYLES CSS ====================
function getStyles(): string {
  let css = '';
  
  // Reset & Base
  css += '*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }';
  css += '@page { size: A4; margin: 6mm 8mm; }';
  css += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a2e35; background: #fff; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }';
  css += '.page { width: 100%; max-width: 190mm; margin: 0 auto; position: relative; min-height: 277mm; padding-bottom: 40px; }';
  
  // === PAGE COUVERTURE ===
  css += '.cover { min-height: 277mm; display: flex; flex-direction: column; background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 50%, #243b48 100%); }';
  css += '.cover::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }';
  css += '.cover-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 30px; text-align: center; position: relative; }';
  css += '.cover-logo { position: relative; margin-bottom: 30px; }';
  css += '.cover-logo svg { height: 60px; width: auto; }';
  css += '.cover-title { font-size: 28px; font-weight: 300; color: white; margin-bottom: 8px; position: relative; }';
  css += '.cover-subtitle { font-size: 16px; font-style: italic; color: rgba(255,255,255,0.7); margin-bottom: 40px; position: relative; }';
  css += '.cover-divider { width: 60px; height: 2px; background: #FF4539; margin: 0 auto 40px; position: relative; }';
  css += '.cover-stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 40px; position: relative; }';
  css += '.cover-stat { text-align: center; color: white; }';
  css += '.cover-stat-value { font-size: 28px; font-weight: 800; margin-bottom: 4px; }';
  css += '.cover-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }';
  css += '.cover-social { display: flex; justify-content: center; gap: 20px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); position: relative; }';
  css += '.cover-social-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.6); font-size: 11px; }';
  
  // Section bien
  css += '.cover-bien { padding: 30px; position: relative; border-top: 1px solid rgba(255,255,255,0.1); }';
  css += '.cover-bien-type { color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; margin-bottom: 10px; text-align: center; }';
  css += '.cover-address { text-align: center; margin-bottom: 25px; }';
  css += '.cover-address-main { font-size: 26px; font-weight: 700; color: white; margin-bottom: 5px; }';
  css += '.cover-address-city { font-size: 14px; color: rgba(255,255,255,0.7); }';
  css += '.cover-address-bar { width: 40px; height: 3px; background: #FF4539; margin: 15px auto 0; }';
  css += '.cover-metrics { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }';
  css += '.cover-metric { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 15px 25px; text-align: center; min-width: 100px; }';
  css += '.cover-metric-value { font-size: 24px; font-weight: 800; color: white; }';
  css += '.cover-metric-unit { font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.6); }';
  css += '.cover-metric-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); margin-top: 5px; }';
  css += '.cover-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin-top: 15px; }';
  css += '.cover-tag { background: transparent; border: none; color: rgba(255,255,255,0.6); padding: 0; font-size: 10px; font-weight: 400; letter-spacing: 0.3px; display: flex; align-items: center; gap: 5px; }';
  
  // Print
  css += '@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
  
  return css;
}

// ==================== GÉNÉRATION PAGE COUVERTURE ====================
function generateCoverPage(estimation: EstimationData): string {
  const identification = estimation.identification as any || {};
  const caracteristiques = estimation.caracteristiques as any || {};
  const analyseTerrain = estimation.analyseTerrain as any || {};
  
  const vendeur = identification.vendeur || {};
  const bien = identification.bien || {};
  const carac = caracteristiques;
  
  const isAppartement = estimation.typeBien === 'appartement';
  const isMaison = estimation.typeBien === 'maison';
  const typeBien = isAppartement ? 'Appartement' : (isMaison ? 'Maison' : val(estimation.typeBien));
  // Calculs surfaces
  const surfacePPE = parseNum(carac.surfacePPE);
  const surfaceNonHab = parseNum(carac.surfaceNonHabitable);
  const surfaceBalcon = parseNum(carac.surfaceBalcon);
  const surfaceTerrasse = parseNum(carac.surfaceTerrasse);
  const surfaceJardin = parseNum(carac.surfaceJardin);
  const surfacePonderee = surfacePPE + (surfaceNonHab * 0.5) + (surfaceBalcon * 0.5) + (surfaceTerrasse * 0.33) + (surfaceJardin * 0.1);
  const surfaceTerrain = parseNum(carac.surfaceTerrain);
  const surfaceHabMaison = parseNum(carac.surfaceHabitableMaison);
  
  let html = '';
  
  html += '<div class="page cover">';
  
  // Hero section avec stats GARY
  html += '<div class="cover-hero">';
  html += `<div class="cover-logo">${logoRed.replace('viewBox', 'style="height:60px;width:auto;" viewBox')}</div>`;
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
  html += `<div class="cover-social-item">${ico('instagram', 14, 'rgba(255,255,255,0.7)')} 33K</div>`;
  html += `<div class="cover-social-item">${ico('linkedin', 14, 'rgba(255,255,255,0.7)')} 3.4K</div>`;
  html += `<div class="cover-social-item">${ico('tiktok', 14, 'rgba(255,255,255,0.7)')} 4.6K</div>`;
  html += '</div>';
  html += '</div>';
  
  // Section bien
  html += '<div class="cover-bien">';
  
  // Type de bien
  const sousType = carac.sousType ? ` • ${carac.sousType}` : '';
  html += `<div class="cover-bien-type">${ico(isAppartement ? 'building' : 'home', 16, 'rgba(255,255,255,0.6)')} ${typeBien}${sousType}</div>`;
  
  // Adresse
  html += '<div class="cover-address">';
  html += `<div class="cover-address-main">${val(bien.adresse || estimation.adresse)}</div>`;
  html += `<div class="cover-address-city">${val(bien.codePostal || estimation.codePostal)} ${val(bien.localite || estimation.localite)}</div>`;
  html += '<div class="cover-address-bar"></div>';
  html += '</div>';
  
  // Métriques du bien
  html += '<div class="cover-metrics">';
  if (isAppartement) {
    const surfaceDisplay = surfacePonderee > 0 ? surfacePonderee.toFixed(0) : surfacePPE.toFixed(0);
    html += `<div class="cover-metric"><div class="cover-metric-value">${surfaceDisplay}<span class="cover-metric-unit"> m²</span></div><div class="cover-metric-label">Surface</div></div>`;
    html += `<div class="cover-metric"><div class="cover-metric-value">${val(carac.nombreChambres)}</div><div class="cover-metric-label">Chambres</div></div>`;
    html += `<div class="cover-metric"><div class="cover-metric-value">${val(carac.nombreSDB)}</div><div class="cover-metric-label">SDB</div></div>`;
    const exterieur = surfaceBalcon + surfaceTerrasse;
    if (exterieur > 0) {
      html += `<div class="cover-metric"><div class="cover-metric-value">${exterieur.toFixed(0)}<span class="cover-metric-unit"> m²</span></div><div class="cover-metric-label">Extérieur</div></div>`;
    }
  } else {
    html += `<div class="cover-metric"><div class="cover-metric-value">${surfaceHabMaison.toFixed(0)}<span class="cover-metric-unit"> m²</span></div><div class="cover-metric-label">Habitable</div></div>`;
    html += `<div class="cover-metric"><div class="cover-metric-value">${surfaceTerrain.toFixed(0)}<span class="cover-metric-unit"> m²</span></div><div class="cover-metric-label">Terrain</div></div>`;
    html += `<div class="cover-metric"><div class="cover-metric-value">${val(carac.nombreChambres)}</div><div class="cover-metric-label">Chambres</div></div>`;
    if (carac.anneeConstruction) {
      html += `<div class="cover-metric"><div class="cover-metric-value">${carac.anneeConstruction}</div><div class="cover-metric-label">Année</div></div>`;
    }
  }
  html += '</div>';
  
  // Tags (points forts + dernier étage)
  const allTags: string[] = [];
  
  if (carac.dernierEtage) {
    allTags.push(`<span style="display:inline-flex;align-items:center;gap:4px;">${ico('mountain', 14, 'rgba(255,255,255,0.5)')} Dernier étage</span>`);
  }
  
  const pointsForts = ((analyseTerrain.pointsForts || []) as string[]).filter(p => p);
  const emojiToIcon: Record<string, string> = {
    '☀️': 'luminosite', '🗝️': 'mountain', '😌': 'calme', '🳳': 'home',
    '🚿': 'bath', '🪵': 'volumes', '🌳': 'tree', '🚗': 'parking',
    '🏠': 'home', '📍': 'mapPin', '🚆': 'train', '🫐': 'ecole',
    '✔': 'check'
  };
  
  pointsForts.forEach((p: string) => {
    let iconName = 'check';
    let textOnly = p;
    for (const emoji in emojiToIcon) {
      if (p.indexOf(emoji) === 0) {
        iconName = emojiToIcon[emoji];
        textOnly = p.replace(emoji, '').trim();
        break;
      }
    }
    allTags.push(`<span style="display:inline-flex;align-items:center;gap:5px;">${ico(iconName, 14, 'rgba(255,255,255,0.5)')} ${textOnly}</span>`);
  });
  
  // Max 4 tags
  const displayTags = allTags.slice(0, 4);
  
  if (displayTags.length > 0) {
    html += '<div class="cover-tags">';
    displayTags.forEach(tag => {
      html += `<div class="cover-tag">${tag}</div>`;
    });
    html += '</div>';
  }
  
  html += '</div>'; // cover-bien
  html += '</div>'; // page cover
  
  return html;
}

// ==================== GÉNÉRATION HTML COMPLÈTE ====================
export interface PDFGeneratorOptions {
  inclurePhotos?: boolean;
  inclureCarte?: boolean;
  onProgress?: (message: string, percent: number) => void;
}

export async function generatePDFHtml(
  estimation: EstimationData,
  options: PDFGeneratorOptions = {}
): Promise<void> {
  const { onProgress } = options;
  
  onProgress?.('Génération de la couverture...', 10);
  
  const vendeur = (estimation.identification as any)?.vendeur || {};
  
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
  html += `<title>GARY - Estimation ${val(vendeur.nom)}</title>`;
  html += `<style>${getStyles()}</style>`;
  html += '</head><body>';
  
  // Page 1: Couverture
  html += generateCoverPage(estimation);
  
  html += '</body></html>';
  
  onProgress?.('Ouverture de la fenêtre d\'impression...', 90);
  
  // Ouvrir dans une nouvelle fenêtre pour impression
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Attendre le chargement puis ouvrir le dialog d'impression
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
  
  onProgress?.('PDF prêt !', 100);
}
