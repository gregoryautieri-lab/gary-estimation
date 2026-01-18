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
  sante: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  nature: '<path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 20v0H10v0A6.5 6.5 0 0 1 7 8h0a5 5 0 0 1 10 0Z"/><path d="m14 14-2 2"/>',
  // États
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
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
  // Timeline & Stratégie
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  alertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
  // Contact
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
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
  
  // === PAGE QUI EST GARY ===
  css += '.gary-page { min-height: 277mm; background: #ffffff; padding: 0; display: flex; flex-direction: column; }';
  css += '.gary-header { background: #1a2e35; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FF4539; }';
  css += '.header-date { font-size: 10px; color: rgba(255,255,255,0.7); }';
  css += '.gary-content { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; }';
  css += '.gary-title { font-size: 22px; font-weight: 300; color: #1a2e35; text-align: center; margin-bottom: 6px; letter-spacing: -0.5px; }';
  css += '.gary-intro { font-size: 10px; color: #64748b; text-align: center; line-height: 1.6; max-width: 440px; margin: 0 auto 24px; }';
  css += '.gary-divider { width: 50px; height: 2px; background: #FF4539; margin: 0 auto 24px; }';
  css += '.gary-section { margin-bottom: 20px; }';
  css += '.gary-section-title { font-size: 11px; font-weight: 700; color: #1a2e35; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 8px; }';
  css += '.gary-section-title::before { content: ""; width: 3px; height: 14px; background: #FF4539; border-radius: 2px; }';
  css += '.gary-text { font-size: 9.5px; color: #374151; line-height: 1.65; }';
  css += '.gary-text p { margin-bottom: 8px; }';
  css += '.gary-text strong { color: #1a2e35; font-weight: 600; }';
  css += '.gary-principles { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 8px; }';
  css += '.gary-principle { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 10px 14px; border-radius: 0 6px 6px 0; }';
  css += '.gary-principle-title { font-size: 10px; font-weight: 600; color: #1a2e35; margin-bottom: 3px; }';
  css += '.gary-principle-text { font-size: 9px; color: #64748b; line-height: 1.5; }';
  css += '.gary-roles { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }';
  css += '.gary-role { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 9px; color: #374151; display: flex; align-items: center; gap: 6px; }';
  css += '.gary-role-icon { color: #FF4539; }';
  css += '.gary-note { background: #fffbeb; border-left: 3px solid #fbbf24; padding: 12px 14px; border-radius: 0 6px 6px 0; margin-top: 16px; }';
  css += '.gary-note-text { font-size: 9px; color: #78350f; line-height: 1.5; font-style: italic; }';
  css += '.gary-conclusion { text-align: center; margin-top: auto; padding-top: 16px; border-top: 1px solid #e2e8f0; }';
  css += '.gary-conclusion-text { font-size: 10px; color: #1a2e35; font-weight: 500; line-height: 1.6; }';
  css += '.gary-footer { background: #1a2e35; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 3px solid #FF4539; }';
  css += '.gary-footer-text { font-size: 8px; color: rgba(255,255,255,0.5); }';
  
  // === PAGE CARACTÉRISTIQUES (header/footer génériques) ===
  css += '.header { background: #1a2e35; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FF4539; }';
  css += '.footer { background: #1a2e35; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 3px solid #FF4539; position: absolute; bottom: 0; left: 0; right: 0; }';
  css += '.footer-ref { font-size: 8px; color: rgba(255,255,255,0.5); }';
  css += '.footer-slogan { font-size: 10px; color: white; font-weight: 600; font-style: italic; }';
  
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

// ==================== GÉNÉRATION PAGE QUI EST GARY ====================
function generateGaryPage(estimation: EstimationData): string {
  const identification = estimation.identification as any || {};
  const projetPostVente = identification.projetPostVente || {};
  
  // Calculer niveau de contrainte pour affichage conditionnel
  const hasProjetAchat = projetPostVente.nature === 'achat';
  const avancement = projetPostVente.avancement || '';
  let niveauContrainte = 0;
  if (hasProjetAchat) {
    if (avancement === 'acte_programme') niveauContrainte = 5;
    else if (avancement === 'compromis_signe') niveauContrainte = 4;
    else if (avancement === 'offre_deposee') niveauContrainte = 3;
    else if (avancement === 'bien_identifie') niveauContrainte = 2;
    else if (avancement === 'recherche') niveauContrainte = 1;
  }
  
  let html = '';
  
  html += '<div class="page gary-page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="gary-header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
  html += '<div class="header-date">Qui est GARY</div>';
  html += '</div>';
  
  // Content
  html += '<div class="gary-content">';
  
  // Titre et intro
  html += '<div class="gary-title">Une autre façon de penser la vente immobilière</div>';
  html += '<div class="gary-intro">Vendre un bien, ce n\'est pas publier une annonce. C\'est une séquence de décisions qui engagent l\'image du bien sur le marché. Chaque exposition laisse une trace. Chaque silence aussi.</div>';
  html += '<div class="gary-divider"></div>';
  
  // Section : Ce que nous croyons
  html += '<div class="gary-section">';
  html += '<div class="gary-section-title">Ce que nous croyons</div>';
  html += '<div class="gary-principles">';
  
  html += '<div class="gary-principle">';
  html += '<div class="gary-principle-title">Une vente est une orchestration, pas une diffusion</div>';
  html += '<div class="gary-principle-text">Le marché ne réagit pas aux intentions. Il réagit aux signaux. Le prix affiché, le moment choisi, le canal utilisé — tout parle. Notre rôle est de maîtriser ce que le marché entend.</div>';
  html += '</div>';
  
  html += '<div class="gary-principle">';
  html += '<div class="gary-principle-title">Chaque bien dispose d\'un capital d\'attention limité</div>';
  html += '<div class="gary-principle-text">Un bien trop exposé perd son pouvoir d\'attraction. Un bien mal positionné au départ se retrouve en négociation défensive. La première impression conditionne toute la suite.</div>';
  html += '</div>';
  
  html += '<div class="gary-principle">';
  html += '<div class="gary-principle-title">Le timing compte autant que le prix</div>';
  html += '<div class="gary-principle-text">Deux stratégies identiques, lancées à deux semaines d\'écart, peuvent produire des résultats opposés. Le contexte change. Les acheteurs aussi. La méthode doit s\'adapter en permanence.</div>';
  html += '</div>';
  
  html += '</div>'; // gary-principles
  html += '</div>'; // gary-section
  
  // Section : Notre approche
  html += '<div class="gary-section">';
  html += '<div class="gary-section-title">Notre approche</div>';
  html += '<div class="gary-text">';
  html += '<p>Il n\'existe pas de recette universelle. Plusieurs chemins de vente sont toujours possibles. Le bon choix dépend du bien, du moment, du contexte, et surtout des retours réels du marché.</p>';
  html += '<p>Une stratégie qui semblait évidente au départ peut devoir évoluer après les premiers signaux. <strong>C\'est pourquoi nous ne figeons jamais un plan. Nous le pilotons.</strong></p>';
  html += '</div>';
  html += '</div>';
  
  // Section : Ce que nous faisons
  html += '<div class="gary-section">';
  html += '<div class="gary-section-title">Ce que nous faisons</div>';
  html += '<div class="gary-roles">';
  html += `<div class="gary-role"><span class="gary-role-icon">${ico('compass', 12, '#FF4539')}</span>Lire et interpréter les signaux du marché</div>`;
  html += `<div class="gary-role"><span class="gary-role-icon">${ico('target', 12, '#FF4539')}</span>Arbitrer entre exposition et retenue</div>`;
  html += `<div class="gary-role"><span class="gary-role-icon">${ico('edit', 12, '#FF4539')}</span>Adapter le discours aux réactions observées</div>`;
  html += `<div class="gary-role"><span class="gary-role-icon">${ico('eye', 12, '#FF4539')}</span>Protéger l'image du bien dans la durée</div>`;
  html += `<div class="gary-role"><span class="gary-role-icon">${ico('check', 12, '#FF4539')}</span>Sécuriser vos décisions à chaque étape</div>`;
  
  // Niveau 3 : Argument "Pilotage transition" si projet d'achat détecté
  if (hasProjetAchat && niveauContrainte > 0) {
    html += `<div class="gary-role"><span class="gary-role-icon">${ico('refresh', 12, '#FF4539')}</span>Synchroniser vente et projets personnels</div>`;
  }
  html += '</div>';
  html += '<div class="gary-text" style="margin-top:10px;font-style:italic;color:#64748b;">Nous ne sommes pas des diffuseurs. Nous sommes des pilotes.</div>';
  html += '</div>';
  
  // Note
  html += '<div class="gary-note">';
  html += '<div class="gary-note-text">Cette page ne remplace pas un échange. Elle ne donne pas de stratégie clé en main. Chaque stratégie se construit à partir du bien réel, de son contexte, et des signaux observés sur le terrain.</div>';
  html += '</div>';
  
  // Conclusion
  html += '<div class="gary-conclusion">';
  html += '<div class="gary-conclusion-text">Une bonne stratégie ne se choisit pas sur le papier.<br/>Elle se construit dans le temps, avec méthode et discernement.</div>';
  html += '</div>';
  
  html += '</div>'; // gary-content
  
  // Footer
  html += '<div class="gary-footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += '<div class="gary-footer-text">gary.ch</div>';
  html += '</div>';
  
  html += '</div>'; // page gary
  
  return html;
}

// ==================== GÉNÉRATION PAGE CARACTÉRISTIQUES ====================
function generateCaracteristiquesPage(estimation: EstimationData): string {
  const identification = estimation.identification as any || {};
  const caracteristiques = estimation.caracteristiques as any || {};
  const analyseTerrain = estimation.analyseTerrain as any || {};
  
  const bien = identification.bien || {};
  const contexte = identification.contexte || {};
  const carac = caracteristiques;
  const analyse = analyseTerrain;
  const proximites = identification.proximites || [];
  
  const isAppartement = estimation.typeBien === 'appartement';
  
  // Calculs surfaces
  const surfacePPE = parseNum(carac.surfacePPE);
  const surfaceNonHab = parseNum(carac.surfaceNonHabitable);
  const surfaceBalcon = parseNum(carac.surfaceBalcon);
  const surfaceTerrasse = parseNum(carac.surfaceTerrasse);
  const surfaceJardin = parseNum(carac.surfaceJardin);
  const surfacePonderee = surfacePPE + (surfaceNonHab * 0.5) + (surfaceBalcon * 0.5) + (surfaceTerrasse * 0.33) + (surfaceJardin * 0.1);
  const surfaceTerrain = parseNum(carac.surfaceTerrain);
  const surfaceHabMaison = parseNum(carac.surfaceHabitableMaison);
  const surfacePrincipale = isAppartement ? surfacePonderee : surfaceHabMaison;
  
  // Parkings
  const nbPlaceInt = parseInt(carac.parkingInterieur) || 0;
  const nbPlaceExt = parseInt(carac.parkingExterieur) || 0;
  const nbBox = parseInt(carac.box) || 0;
  
  // Labels
  const vueLabels: Record<string,string> = {degagee: 'Dégagée', lac: 'Lac', montagne: 'Montagne', campagne: 'Campagne', jardin: 'Jardin', urbaine: 'Urbaine', vis_a_vis: 'Vis-à-vis'};
  const diffLabels: Record<string,string> = {sol: 'Au sol', radiateur: 'Radiateurs', convecteur: 'Convecteurs', poele: 'Poêle', cheminee: 'Cheminée', plafond: 'Plafond'};
  const chaufLabels: Record<string,string> = {pac: 'PAC', gaz: 'Gaz', mazout: 'Mazout', pellets: 'Pellets', electrique: 'Électrique', cad: 'CAD', geothermie: 'Géothermie', autre: 'Autre'};
  const renoLabels: Record<string,string> = {moins10ans: '< 10 ans', structure: 'Structure', technique: 'Technique', cuisine: 'Cuisine', salles_eau: 'Salles eau', menuiseries: 'Fenêtres', finitions: 'Finitions'};
  const travLabels: Record<string,string> = {toiture: 'Toiture', facade: 'Façade', fenetres: 'Fenêtres', chauffage: 'Chauffage', electrique: 'Électricité', plomberie: 'Plomberie', cuisine: 'Cuisine', sdb: 'SDB', sols: 'Sols', isolation: 'Isolation', peinture: 'Peinture', jardin: 'Extérieurs'};
  const proxIcons: Record<string,string> = {'🚌': 'bus', '🚃': 'train', '🏫': 'ecole', '🛒': 'commerce', '🥬': 'commerce', '🏥': 'sante', '🌳': 'nature'};
  
  const vueDisplay = vueLabels[carac.vue] || carac.vue || '–';
  
  let html = '';
  html += '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
  html += '<div class="header-date">Caractéristiques du bien</div>';
  html += '</div>';
  
  // Contexte de vente (tags)
  const ctxItems: {icon: string, text: string}[] = [];
  const statutOcc = contexte.statutOccupation;
  if (statutOcc === 'libre') ctxItems.push({icon: 'key', text: 'Libre'});
  else if (statutOcc === 'loue') {
    const finBail = contexte.finBailMois && contexte.finBailAnnee ? `${contexte.finBailMois}/${contexte.finBailAnnee}` : '';
    ctxItems.push({icon: 'file', text: 'Loué' + (finBail ? ` (fin ${finBail})` : '')});
  }
  else if (statutOcc === 'occupeProprietaire') ctxItems.push({icon: 'home', text: 'Occupé propriétaire'});
  
  if (contexte.confidentialite === 'discrete') ctxItems.push({icon: 'eye', text: 'Vente discrète'});
  else if (contexte.confidentialite === 'confidentielle') ctxItems.push({icon: 'lock', text: 'Off-market'});
  
  if (contexte.prioriteVendeur === 'prixMax') ctxItems.push({icon: 'trendingUp', text: 'Priorité prix'});
  else if (contexte.prioriteVendeur === 'venteRapide') ctxItems.push({icon: 'zap', text: 'Priorité rapidité'});
  
  if (carac.dernierEtage) ctxItems.push({icon: 'mountain', text: 'Dernier étage'});
  
  if (ctxItems.length > 0) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 24px;background:#fafafa;border-bottom:1px solid #e5e7eb;">';
    ctxItems.forEach(item => {
      html += `<span style="font-size:11px;padding:6px 12px;background:white;border-radius:6px;border:1px solid #e5e7eb;display:flex;align-items:center;gap:6px;color:#374151;">${ico(item.icon, 14, '#6b7280')}${item.text}</span>`;
    });
    html += '</div>';
  }
  
  // Métriques principales
  html += '<div style="display:flex;background:white;border-bottom:1px solid #e5e7eb;">';
  html += `<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;"><div style="display:flex;align-items:center;justify-content:center;gap:10px;"><div>${ico('surface', 20, '#9ca3af')}</div><div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">${surfacePrincipale.toFixed(0)}</div><div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">m² ${isAppartement ? 'pondérés' : 'habitables'}</div></div></div></div>`;
  html += `<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;"><div style="display:flex;align-items:center;justify-content:center;gap:10px;"><div>${ico('pieces', 20, '#9ca3af')}</div><div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">${val(carac.nombrePieces)}</div><div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">pièces</div></div></div></div>`;
  html += `<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;"><div style="display:flex;align-items:center;justify-content:center;gap:10px;"><div>${ico('chambres', 20, '#9ca3af')}</div><div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">${val(carac.nombreChambres)}</div><div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">chambres</div></div></div></div>`;
  
  if (isAppartement) {
    html += `<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;"><div style="display:flex;align-items:center;justify-content:center;gap:10px;"><div>${ico('etage', 20, '#9ca3af')}</div><div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">${val(carac.etage)}</div><div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">étage</div></div></div></div>`;
  } else {
    html += `<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;"><div style="display:flex;align-items:center;justify-content:center;gap:10px;"><div>${ico('tree', 20, '#9ca3af')}</div><div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">${surfaceTerrain.toFixed(0)}</div><div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">m² terrain</div></div></div></div>`;
  }
  html += `<div style="flex:1;padding:12px 8px;text-align:center;"><div style="display:flex;align-items:center;justify-content:center;gap:10px;"><div>${ico('construction', 20, '#9ca3af')}</div><div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">${val(carac.anneeConstruction)}</div><div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">construction</div></div></div></div>`;
  html += '</div>';
  
  // Caractéristiques détaillées
  html += '<div style="padding:20px 24px;background:white;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;font-weight:600;">Caractéristiques détaillées</div>';
  
  const gridItem = (label: string, value: string, highlight: boolean = false) => {
    const bg = highlight ? 'background:#fafafa;border-left:3px solid #111827;' : 'background:white;';
    const color = highlight ? 'color:#111827;' : 'color:#1a2e35;';
    return `<div style="${bg}border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">${label}</div><div style="font-size:15px;font-weight:700;${color}">${value}</div></div>`;
  };
  
  if (isAppartement) {
    const diffList = (carac.diffusion || []) as string[];
    const diffDisplay = diffList.length > 0 ? diffList.map(d => diffLabels[d] || d).join(', ') : '–';
    const expoDisplay = ((carac.exposition || []) as string[]).join(', ') || '–';
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
    html += gridItem('Surface PPE', `${surfacePPE.toFixed(0)} m²`);
    html += gridItem('Surface pondérée', `${surfacePonderee.toFixed(1)} m²`, true);
    html += gridItem('Étage', `${val(carac.etage)} / ${val(carac.nombreEtagesImmeuble)}`);
    html += gridItem('Ascenseur', carac.ascenseur === 'oui' ? 'Oui' : (carac.ascenseur === 'non' ? 'Non' : '–'));
    html += '</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
    html += gridItem('Balcon', carac.surfaceBalcon ? `${carac.surfaceBalcon} m²` : '–');
    html += gridItem('Terrasse', carac.surfaceTerrasse ? `${carac.surfaceTerrasse} m²` : '–');
    html += gridItem('Salles de bain', val(carac.nombreSDB) || '–');
    html += gridItem('WC', val(carac.nombreWC) || '–');
    html += '</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
    html += gridItem('Diffusion chaleur', diffDisplay);
    html += gridItem('Exposition', expoDisplay);
    html += gridItem('Vue', vueDisplay);
    html += gridItem('CECB', val(carac.cecb) || '–');
    html += '</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
    html += gridItem('Parking int.', nbPlaceInt ? String(nbPlaceInt) : '–');
    html += gridItem('Parking ext.', nbPlaceExt ? String(nbPlaceExt) : '–');
    html += gridItem('Box', nbBox ? String(nbBox) : '–');
    html += gridItem('Charges', carac.chargesMensuelles ? `${carac.chargesMensuelles} CHF` : '–');
    html += '</div>';
  } else {
    // Maison
    const cubage = surfaceHabMaison * 3;
    const diffMaison = carac.diffusionMaison;
    let diffMaisonDisplay = '–';
    if (diffMaison) {
      if (Array.isArray(diffMaison)) {
        diffMaisonDisplay = diffMaison.map(d => diffLabels[d] || d).join(', ') || '–';
      } else {
        diffMaisonDisplay = diffLabels[diffMaison] || diffMaison;
      }
    }
    const chaufDisplay = chaufLabels[carac.chauffage] || carac.chauffage || '–';
    const expoDisplay = ((carac.exposition || []) as string[]).join(', ') || '–';
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
    html += gridItem('Surface habitable', `${val(carac.surfaceHabitableMaison)} m²`);
    html += gridItem('Surface terrain', `${surfaceTerrain.toFixed(0)} m²`, true);
    html += gridItem('Niveaux', val(carac.nombreNiveaux) || '–');
    html += gridItem('Cubage', `${cubage.toFixed(0)} m³`);
    html += '</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
    html += gridItem('Salles de bain', val(carac.nombreSDB) || '–');
    html += gridItem('WC', val(carac.nombreWC) || '–');
    html += gridItem('Chauffage', chaufDisplay);
    html += gridItem('Diffusion', diffMaisonDisplay);
    html += '</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
    html += gridItem('Exposition', expoDisplay);
    html += gridItem('Vue', vueDisplay);
    html += gridItem('CECB', val(carac.cecb) || '–');
    html += gridItem('Construction', val(carac.anneeConstruction) || '–');
    html += '</div>';
    
    const pkgCouvert = parseInt(carac.parkingCouverte) || 0;
    const pkgExtMaison = parseInt(carac.parkingExterieur) || 0;
    const pkgGarage = parseInt(carac.box) || 0;
    
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
    html += gridItem('Parking couvert', pkgCouvert ? String(pkgCouvert) : '–');
    html += gridItem('Parking ext.', pkgExtMaison ? String(pkgExtMaison) : '–');
    html += gridItem('Garage', pkgGarage ? String(pkgGarage) : '–');
    html += gridItem('Zone', val(carac.zone) || '–');
    html += '</div>';
  }
  html += '</div>';
  
  // Rénovations & Travaux
  const renoArr = (carac.typeRenovation || []) as string[];
  const travArr = (carac.travauxRecents || []) as string[];
  if (carac.anneeRenovation || renoArr.length > 0 || travArr.length > 0) {
    html += '<div style="padding:12px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
    html += `<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;display:flex;align-items:center;gap:6px;">${ico('refresh', 14, '#6b7280')}Rénovations & Travaux</div>`;
    if (carac.anneeRenovation) {
      html += `<div style="font-size:10px;color:#374151;font-weight:600;">Rénové en ${carac.anneeRenovation}</div>`;
    }
    html += '</div>';
    if (renoArr.length > 0 || travArr.length > 0) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      renoArr.forEach(r => {
        html += `<span style="background:white;color:#374151;padding:4px 10px;border-radius:4px;font-size:9px;border:1px solid #e5e7eb;">${renoLabels[r] || r}</span>`;
      });
      travArr.forEach(t => {
        html += `<span style="background:white;color:#374151;padding:4px 10px;border-radius:4px;font-size:9px;border:1px solid #e5e7eb;">${travLabels[t] || t}</span>`;
      });
      html += '</div>';
    }
    html += '</div>';
  }
  
  // État du bien
  html += '<div style="padding:16px 24px;background:#fafafa;border-top:1px solid #e5e7eb;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">État du bien</div>';
  html += '<div style="font-size:8px;color:#9ca3af;display:flex;gap:12px;">';
  html += `<span style="display:flex;align-items:center;gap:4px;">${ico('sparkles', 12, '#3b82f6')}Neuf</span>`;
  html += `<span style="display:flex;align-items:center;gap:4px;">${ico('checkCircle', 12, '#10b981')}Bon</span>`;
  html += `<span style="display:flex;align-items:center;gap:4px;">${ico('refresh', 12, '#f59e0b')}À rafraîchir</span>`;
  html += `<span style="display:flex;align-items:center;gap:4px;">${ico('xCircle', 12, '#ef4444')}À refaire</span>`;
  html += '</div></div>';
  
  html += '<div style="display:flex;gap:6px;margin-bottom:12px;">';
  const etats = [
    {l:'Cuisine',v:analyse.etatCuisine},
    {l:'Salle de bain',v:analyse.etatSDB},
    {l:'Sols',v:analyse.etatSols},
    {l:'Murs',v:analyse.etatMurs},
    {l:'Menuiseries',v:analyse.etatMenuiseries},
    {l:'Électricité',v:analyse.etatElectricite}
  ];
  etats.forEach(e => {
    const icoName = e.v === 'neuf' ? 'sparkles' : (e.v === 'bon' ? 'checkCircle' : (e.v === 'rafraichir' ? 'refresh' : (e.v === 'refaire' ? 'xCircle' : 'minus')));
    const icoColor = e.v === 'neuf' ? '#3b82f6' : (e.v === 'bon' ? '#10b981' : (e.v === 'rafraichir' ? '#f59e0b' : (e.v === 'refaire' ? '#ef4444' : '#d1d5db')));
    html += `<div style="flex:1;text-align:center;padding:10px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;"><div style="margin-bottom:4px;">${ico(icoName, 18, icoColor)}</div><div style="font-size:8px;color:#6b7280;font-weight:500;">${e.l}</div></div>`;
  });
  html += '</div>';
  
  // Ambiance
  html += '<div style="display:flex;gap:10px;">';
  [{l:'Luminosité',v:analyse.luminosite||0,icoName:'luminosite'},{l:'Calme',v:analyse.calme||0,icoName:'calme'},{l:'Volumes',v:analyse.volumes||0,icoName:'volumes'}].forEach(a => {
    html += '<div style="flex:1;background:white;border-radius:6px;padding:10px;border:1px solid #e5e7eb;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
    html += `<span style="font-size:10px;color:#6b7280;font-weight:500;display:flex;align-items:center;gap:6px;">${ico(a.icoName, 14, '#9ca3af')}${a.l}</span>`;
    html += `<span style="font-size:11px;font-weight:600;color:#111827;">${a.v}/5</span>`;
    html += '</div>';
    html += `<div style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;"><div style="height:100%;width:${a.v*20}%;background:#111827;border-radius:2px;"></div></div></div>`;
  });
  html += '</div></div>';
  
  // Proximités
  const proxFilled = (proximites as any[]).filter(p => p.libelle && p.distance).slice(0, 6);
  html += '<div style="padding:16px 24px;background:white;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;">Proximités & Commodités</div>';
  if (proxFilled.length > 0) {
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
    proxFilled.forEach((p: any) => {
      const distStr = String(p.distance);
      const distDisplay = distStr + (distStr && !distStr.endsWith('m') && !distStr.endsWith('km') ? 'm' : '');
      const proxIcoName = proxIcons[p.icone] || 'mapPin';
      html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #e5e7eb;border-radius:6px;"><div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#f9fafb;border-radius:6px;">${ico(proxIcoName, 18, '#6b7280')}</div><div style="flex:1;min-width:0;"><div style="font-size:10px;color:#374151;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.libelle}</div><div style="font-size:12px;font-weight:700;color:#111827;">${distDisplay}</div></div></div>`;
    });
    html += '</div>';
  } else {
    html += '<div style="color:#9ca3af;font-style:italic;text-align:center;padding:12px;">Aucune proximité renseignée</div>';
  }
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += `<div class="footer-ref">Page 1/X • ${val(bien.adresse || estimation.adresse)}</div>`;
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  
  return html;
}

// ==================== PAGE 4: TRAJECTOIRES DE VENTE ====================
function generateTrajectoiresPage(estimation: EstimationData): string {
  const identification = estimation.identification as any || {};
  const historique = identification.historique || {};
  const contexte = identification.contexte || {};
  const carac = estimation.caracteristiques as any || {};
  const pre = (estimation as any).preEstimation || (estimation as any).pre_estimation || {};
  const strat = (estimation as any).strategie || {};
  const bien = identification.bien || {};
  
  const isAppartement = (estimation as any).typeBien === 'appartement' || (estimation as any).type_bien === 'appartement';
  const isMaison = (estimation as any).typeBien === 'maison' || (estimation as any).type_bien === 'maison';
  
  // === CALCULS SURFACES & VALEURS ===
  const surfacePPE = parseNum(carac.surfacePPE);
  const surfaceNonHab = parseNum(carac.surfaceNonHabitable);
  const surfaceBalcon = parseNum(carac.surfaceBalcon);
  const surfaceTerrasse = parseNum(carac.surfaceTerrasse);
  const surfaceJardin = parseNum(carac.surfaceJardin);
  const surfacePonderee = surfacePPE + (surfaceNonHab * 0.5) + (surfaceBalcon * 0.5) + (surfaceTerrasse * 0.33) + (surfaceJardin * 0.1);
  const surfaceTerrain = parseNum(carac.surfaceTerrain);
  const surfaceHabMaison = parseNum(carac.surfaceHabitableMaison);
  
  // Calculs valeurs
  const nbPlaceInt = parseInt(carac.parkingInterieur) || 0;
  const nbPlaceExt = parseInt(carac.parkingExterieur) || 0;
  const nbBox = parseInt(carac.box) || 0;
  const hasCave = carac.cave ? 1 : 0;
  
  const prixM2 = parseNum(pre.prixM2);
  const tauxVetuste = parseNum(pre.tauxVetuste);
  const prixM2Ajuste = prixM2 * (1 - tauxVetuste / 100);
  const prixPlaceInt = parseNum(pre.prixPlaceInt);
  const prixPlaceExt = parseNum(pre.prixPlaceExt);
  const prixBox = parseNum(pre.prixBox);
  const prixCave = parseNum(pre.prixCave);
  const prixM2Terrain = parseNum(pre.prixM2Terrain);
  const prixM3 = parseNum(pre.prixM3);
  const tauxVetusteMaison = parseNum(pre.tauxVetusteMaison);
  const prixM3Ajuste = prixM3 * (1 - tauxVetusteMaison / 100);
  const prixM2Amenagement = parseNum(pre.prixM2Amenagement);
  
  const surfaceUtile = parseNum(carac.surfaceUtile);
  const cubage = parseNum(pre.cubageManuel) || (surfaceUtile * 3.1);
  const nbNiveaux = parseInt(carac.nombreNiveaux) || 1;
  const surfaceAuSol = nbNiveaux > 0 ? surfaceHabMaison / nbNiveaux : 0;
  const surfaceAmenagement = Math.max(0, surfaceTerrain - surfaceAuSol);
  
  const valeurSurface = surfacePonderee * prixM2Ajuste;
  const valeurPlaceInt = nbPlaceInt * prixPlaceInt;
  const valeurPlaceExt = nbPlaceExt * prixPlaceExt;
  const valeurBox = nbBox * prixBox;
  const valeurCave = hasCave * prixCave;
  const valeurLignesSupp = (pre.lignesSupp || []).reduce((sum: number, l: any) => sum + (parseFloat(l.prix) || 0), 0);
  
  const valeurTerrain = surfaceTerrain * prixM2Terrain;
  const valeurCubage = cubage * prixM3Ajuste;
  const valeurAmenagement = surfaceAmenagement * prixM2Amenagement;
  const valeurAnnexes = (pre.annexes || []).reduce((sum: number, a: any) => sum + (parseFloat(a.prix) || 0), 0);
  
  const totalVenaleAppart = valeurSurface + valeurPlaceInt + valeurPlaceExt + valeurBox + valeurCave + valeurLignesSupp;
  const totalVenaleMaison = valeurTerrain + valeurCubage + valeurAmenagement + valeurAnnexes;
  const totalVenale = isAppartement ? totalVenaleAppart : totalVenaleMaison;
  const totalVenaleArrondi = Math.ceil(totalVenale / 5000) * 5000;
  
  // === PROJET POST-VENTE ===
  const projetPV = identification.projetPostVente || {};
  const hasProjetAchat = projetPV.nature === 'achat';
  const avancement = projetPV.avancement || '';
  let niveauContrainte = 0;
  if (hasProjetAchat) {
    if (avancement === 'acte_programme') niveauContrainte = 5;
    else if (avancement === 'compromis_signe') niveauContrainte = 4;
    else if (avancement === 'offre_deposee') niveauContrainte = 3;
    else if (avancement === 'bien_identifie') niveauContrainte = 2;
    else if (avancement === 'recherche') niveauContrainte = 1;
  }
  
  // === CAPITAL-VISIBILITÉ ===
  let capitalPct = 100;
  const capitalAlerts: Array<{type: string, msg: string}> = [];
  let pauseRecommandee = false;
  
  if (historique.dejaDiffuse) {
    let dureeImpact = 0;
    if (historique.duree === 'moins1mois') dureeImpact = 5;
    else if (historique.duree === '1-3mois') dureeImpact = 15;
    else if (historique.duree === '3-6mois') dureeImpact = 30;
    else if (historique.duree === '6-12mois') dureeImpact = 50;
    else if (historique.duree === 'plus12mois') dureeImpact = 65;
    
    let diffusionImpact = 0;
    if (historique.typeDiffusion === 'discrete') diffusionImpact = 5;
    else if (historique.typeDiffusion === 'moderee') diffusionImpact = 15;
    else if (historique.typeDiffusion === 'massive') diffusionImpact = 30;
    
    capitalPct = 100 - dureeImpact - diffusionImpact;
    
    if (historique.typeDiffusion === 'discrete' && dureeImpact > 15) capitalPct += 10;
    if (historique.typeDiffusion === 'massive' && ['3-6mois', '6-12mois', 'plus12mois'].includes(historique.duree)) capitalPct -= 10;
    
    capitalPct = Math.max(10, Math.min(100, capitalPct));
    
    if (capitalPct < 40) {
      pauseRecommandee = true;
      capitalAlerts.push({type: 'critical', msg: 'Pause commerciale de 2-3 semaines recommandée avant toute nouvelle action'});
      capitalAlerts.push({type: 'info', msg: 'Réinventer l\'objet : nouvelles photos, vidéo, brochure repensée'});
    }
    
    const prixAfficheNum = parseFloat(historique.prixAffiche) || 0;
    if (prixAfficheNum > 0 && totalVenale > 0) {
      const ecartPrix = ((prixAfficheNum - totalVenale) / totalVenale) * 100;
      if (ecartPrix > 30) {
        capitalAlerts.push({type: 'warning', msg: `Prix affiché précédemment (${prixAfficheNum.toLocaleString('fr-CH')} CHF) supérieur de ${ecartPrix.toFixed(0)}% à notre estimation. Repositionnement prix nécessaire.`});
      } else if (ecartPrix > 10) {
        capitalAlerts.push({type: 'info', msg: `Prix affiché précédemment légèrement au-dessus de notre estimation (${ecartPrix.toFixed(0)}%)`});
      }
    }
  }
  
  // === LUXMODE ===
  let luxScore = 0;
  const sousTypePremium = ['attique', 'penthouse', 'loft', 'duplex'].includes(carac.sousType);
  const sousTypeMaisonPremium = ['villa', 'propriete', 'chalet'].includes(carac.sousType);
  if (sousTypePremium) luxScore += 15;
  if (sousTypeMaisonPremium) luxScore += 12;
  if (carac.dernierEtage && isAppartement) luxScore += 8;
  
  const surfaceHab = isAppartement ? surfacePonderee : surfaceHabMaison;
  if (surfaceHab > 300) luxScore += 15;
  else if (surfaceHab > 200) luxScore += 10;
  else if (surfaceHab > 150) luxScore += 5;
  
  if (isMaison && surfaceTerrain > 3000) luxScore += 15;
  else if (isMaison && surfaceTerrain > 1500) luxScore += 10;
  else if (isMaison && surfaceTerrain > 800) luxScore += 5;
  
  if (carac.piscine) luxScore += 12;
  
  if (contexte.confidentialite === 'confidentielle') luxScore += 12;
  else if (contexte.confidentialite === 'discrete') luxScore += 8;
  if (contexte.horizon === 'flexible') luxScore += 5;
  if (contexte.prioriteVendeur === 'prixMax') luxScore += 5;
  
  if (historique.dejaDiffuse && contexte.confidentialite !== 'normale') luxScore += 8;
  
  if (totalVenaleArrondi > 10000000) luxScore += 20;
  else if (totalVenaleArrondi > 5000000) luxScore += 15;
  else if (totalVenaleArrondi > 3000000) luxScore += 10;
  else if (totalVenaleArrondi > 2000000) luxScore += 5;
  
  const luxMode = luxScore >= 35;
  
  // === VOCABULAIRE ADAPTATIF ===
  const copy = {
    pageTitle: luxMode ? 'Scénarios de gouvernance' : 'Trajectoires de vente',
    headerTitle: luxMode ? 'Scénarios de gouvernance' : 'Trajectoires de vente',
    introPhrase: luxMode 
      ? 'Chaque bien d\'exception appelle une gouvernance sur mesure. Le choix du scénario dépend de votre tempo, vos exigences et votre vision.'
      : 'Chaque bien peut être vendu selon différentes trajectoires. Le choix du point de départ stratégique dépend de votre contexte, vos priorités et votre horizon temporel.',
    disclaimerPhrase: luxMode
      ? 'Dans ce segment, la retenue et la sélectivité font partie de la stratégie. Un objectif de valeur reflète le positionnement stratégique, pas une promesse de marché.'
      : 'Un objectif de valeur n\'est pas une promesse. Il dépend des signaux du marché, du rythme de diffusion et du pilotage dans le temps. Le point de départ stratégique est réversible — vous pouvez changer de trajectoire selon les retours observés.',
    capitalLabel: luxMode ? 'Capital de portée' : 'Capital-Visibilité',
    recalibrageTitle: luxMode ? 'Recalibrage nécessaire' : 'Recommandations',
    recalibragePhrase: luxMode 
      ? 'Avant d\'amplifier, on stabilise le message et on évite les signaux contradictoires.'
      : ''
  };
  
  // === CALCUL PHASES ===
  const typeMV = pre.typeMiseEnVente || 'public';
  
  let pauseRecalibrage = 0;
  if (historique.dejaDiffuse) {
    const dureeDiffusion = historique.duree || '';
    if (dureeDiffusion === 'moins1mois') pauseRecalibrage = 1;
    else if (dureeDiffusion === '1-3mois') pauseRecalibrage = 2;
    else if (dureeDiffusion === '3-6mois') pauseRecalibrage = 3;
    else if (dureeDiffusion === '6-12mois') pauseRecalibrage = 4;
    else if (dureeDiffusion === 'plus12mois') pauseRecalibrage = 5;
    else pauseRecalibrage = 2;
  }
  
  const phaseDureesBase = strat.phaseDurees || { phase0: 1, phase1: 3, phase2: 2, phase3: 10 };
  const phaseDurees = {
    phase0: Math.max(1, (phaseDureesBase.phase0 || 1) + pauseRecalibrage),
    phase1: Math.max(1, phaseDureesBase.phase1 || 3),
    phase2: Math.max(1, phaseDureesBase.phase2 || 2),
    phase3: Math.max(4, phaseDureesBase.phase3 || 10)
  };
  
  // Dates
  const getNextMonday = (fromDate?: Date) => {
    const date = new Date(fromDate || new Date());
    const day = date.getDay();
    const daysUntilMonday = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
    date.setDate(date.getDate() + daysUntilMonday);
    return date;
  };
  
  const formatDateFR = (date: Date) => {
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${date.getDate()} ${mois[date.getMonth()]}`;
  };
  
  const addWeeks = (date: Date, weeks: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
  };
  
  const dateDebut = strat.dateDebut ? new Date(strat.dateDebut) : getNextMonday();
  const phase0Start = dateDebut;
  const phase0End = addWeeks(phase0Start, phaseDurees.phase0);
  const phase1Start = phase0End;
  const phase1End = addWeeks(phase1Start, phaseDurees.phase1);
  const phase2Start = phase1End;
  const phase2End = addWeeks(phase2Start, phaseDurees.phase2);
  const phase3Start = phase2End;
  const phase3End = addWeeks(phase3Start, phaseDurees.phase3);
  
  const phase1Active = (typeMV === 'offmarket');
  const phase2Active = (typeMV === 'offmarket' || typeMV === 'comingsoon');
  const phase2StartActif = phase1Active ? phase1End : phase0End;
  const phase3StartActif = phase2Active ? addWeeks(phase2StartActif, phaseDurees.phase2) : phase0End;
  
  const dateVenteEstimee = typeMV === 'offmarket' ? phase3End : (typeMV === 'comingsoon' ? addWeeks(phase0Start, phaseDurees.phase0 + phaseDurees.phase2 + phaseDurees.phase3) : addWeeks(phase0Start, phaseDurees.phase0 + phaseDurees.phase3));
  
  // === TRAJECTOIRES (enrichies pour mode LUX et standard) ===
  const trajectoires = [
    {
      id: 'offmarket',
      nom: 'Off-Market',
      icon: 'lock',
      objectif: 'Tester la demande en toute discrétion, sans exposition publique',
      objectifLux: 'Valider l\'intérêt sans créer de trace publique',
      conditions: ['Cercle restreint d\'acheteurs qualifiés', 'Aucune trace publique', 'Retours confidentiels'],
      typeExposition: 'Cercle restreint',
      typePression: 'Aucun signal public',
      priseEnCharge: 'GARY sélectionne et approche les acquéreurs qualifiés',
      pourc: pre.pourcOffmarket ?? 15
    },
    {
      id: 'comingsoon',
      nom: luxMode ? 'Lancement maîtrisé' : 'Coming Soon',
      icon: 'clock',
      objectif: 'Créer l\'anticipation et générer une première tension',
      objectifLux: 'Orchestrer l\'anticipation avec un récit maîtrisé',
      conditions: ['Communication maîtrisée', 'Liste d\'attente', 'Teasing ciblé'],
      typeExposition: 'Anticipation contrôlée',
      typePression: 'Pression relationnelle ciblée',
      priseEnCharge: 'GARY construit le récit et gère le tempo de révélation',
      pourc: pre.pourcComingsoon ?? 10
    },
    {
      id: 'public',
      nom: 'Marché Public',
      icon: 'globe',
      objectif: luxMode ? 'Arbitrer le tempo et amplifier si nécessaire' : 'Maximiser l\'exposition et accélérer la transaction',
      objectifLux: 'Amplification assumée selon les signaux observés',
      conditions: luxMode ? ['Portée contrôlée', 'Portails sélectifs', 'Rareté maîtrisée'] : ['Diffusion large', 'Portails immobiliers', 'Visibilité maximale'],
      typeExposition: 'Amplification assumée',
      typePression: 'Rareté maîtrisée',
      priseEnCharge: 'GARY pilote l\'exposition et filtre les demandes',
      pourc: pre.pourcPublic ?? 6
    }
  ];
  
  const getStatut = (trajId: string) => {
    // Cas bien déjà exposé + luxMode : logique spéciale
    if (luxMode && historique.dejaDiffuse) {
      if (trajId === 'offmarket') return {label: 'Conditionnel', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
      if (trajId === 'comingsoon' || trajId === typeMV) return {label: 'Point de départ stratégique', style: 'background:#1a2e35;color:white;'};
      if (trajId === 'public') return {label: 'Activable', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
    }
    // Cas standard
    if (trajId === typeMV) return {label: 'Point de départ stratégique', style: 'background:#1a2e35;color:white;'};
    if (trajId === 'public' && typeMV === 'offmarket') return {label: 'Conditionnel', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
    return {label: 'Activable', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
  };
  
  // === GÉNÉRATION HTML ===
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
  html += `<div class="header-date">${copy.headerTitle}</div>`;
  html += '</div>';
  
  // Intro
  html += '<div style="padding:12px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
  html += `<div style="font-size:10px;color:#4b5563;line-height:1.5;text-align:center;">${copy.introPhrase}</div>`;
  
  if (hasProjetAchat && niveauContrainte > 0) {
    let phraseTransition = '';
    if (niveauContrainte >= 4) {
      phraseTransition = 'Cette trajectoire a été calibrée pour s\'harmoniser avec vos projets personnels et vous garantir une transition sereine.';
    } else if (niveauContrainte >= 2) {
      phraseTransition = 'Le rythme proposé vous laisse la maîtrise du calendrier tout en maximisant vos opportunités.';
    } else {
      phraseTransition = 'Cette approche préserve votre flexibilité pour concrétiser sereinement vos projets.';
    }
    html += `<div style="font-size:9px;color:#0369a1;line-height:1.4;text-align:center;margin-top:8px;font-style:italic;">${phraseTransition}</div>`;
  }
  html += '</div>';
  
  // Timeline
  html += '<div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">';
  html += `<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;display:flex;align-items:center;gap:5px;">${ico('calendar', 12, '#9ca3af')}Planning prévisionnel</div>`;
  html += '<div style="display:flex;gap:6px;">';
  
  // Phase 0
  const phase0Label = pauseRecalibrage > 0 ? 'Prépa. & Recalibrage' : 'Préparation';
  html += `<div style="flex:1;text-align:center;padding:8px 4px;background:linear-gradient(135deg,#fff5f4 0%,#ffffff 100%);border-radius:6px;border:2px solid #FF4539;">`;
  html += `<div style="margin-bottom:2px;">${ico('camera', 16, '#FF4539')}</div>`;
  html += `<div style="font-size:9px;font-weight:600;color:#1a2e35;">${phase0Label}</div>`;
  html += `<div style="font-size:7px;color:#6b7280;margin-top:2px;">${formatDateFR(phase0Start)}</div>`;
  html += `<div style="font-size:7px;color:#6b7280;">${phaseDurees.phase0} sem.</div>`;
  html += '</div>';
  
  // Phase 1
  if (phase1Active) {
    html += `<div style="flex:1;text-align:center;padding:8px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">`;
    html += `<div style="margin-bottom:2px;">${ico('key', 16, '#6b7280')}</div>`;
    html += `<div style="font-size:9px;font-weight:600;color:#1a2e35;">Off-market</div>`;
    html += `<div style="font-size:7px;color:#6b7280;margin-top:2px;">${formatDateFR(phase1Start)}</div>`;
    html += `<div style="font-size:7px;color:#6b7280;">${phaseDurees.phase1} sem.</div>`;
    html += '</div>';
  } else {
    html += `<div style="flex:1;text-align:center;padding:8px 4px;background:#f9fafb;border-radius:6px;border:1px dashed #e5e7eb;opacity:0.5;">`;
    html += `<div style="margin-bottom:2px;">${ico('key', 16, '#d1d5db')}</div>`;
    html += `<div style="font-size:9px;font-weight:600;color:#9ca3af;">Off-market</div>`;
    html += `<div style="font-size:7px;color:#d1d5db;margin-top:2px;">–</div>`;
    html += `<div style="font-size:7px;color:#d1d5db;">Optionnel</div>`;
    html += '</div>';
  }
  
  // Phase 2
  if (phase2Active) {
    html += `<div style="flex:1;text-align:center;padding:8px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">`;
    html += `<div style="margin-bottom:2px;">${ico('clock', 16, '#6b7280')}</div>`;
    html += `<div style="font-size:9px;font-weight:600;color:#1a2e35;">Coming soon</div>`;
    html += `<div style="font-size:7px;color:#6b7280;margin-top:2px;">${formatDateFR(phase2StartActif)}</div>`;
    html += `<div style="font-size:7px;color:#6b7280;">${phaseDurees.phase2} sem.</div>`;
    html += '</div>';
  } else {
    html += `<div style="flex:1;text-align:center;padding:8px 4px;background:#f9fafb;border-radius:6px;border:1px dashed #e5e7eb;opacity:0.5;">`;
    html += `<div style="margin-bottom:2px;">${ico('clock', 16, '#d1d5db')}</div>`;
    html += `<div style="font-size:9px;font-weight:600;color:#9ca3af;">Coming soon</div>`;
    html += `<div style="font-size:7px;color:#d1d5db;margin-top:2px;">–</div>`;
    html += `<div style="font-size:7px;color:#d1d5db;">Optionnel</div>`;
    html += '</div>';
  }
  
  // Phase 3
  html += `<div style="flex:1;text-align:center;padding:8px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">`;
  html += `<div style="margin-bottom:2px;">${ico('globe', 16, '#6b7280')}</div>`;
  html += `<div style="font-size:9px;font-weight:600;color:#1a2e35;">Public</div>`;
  html += `<div style="font-size:7px;color:#6b7280;margin-top:2px;">${formatDateFR(phase3StartActif)}</div>`;
  html += `<div style="font-size:7px;color:#6b7280;">~${phaseDurees.phase3} sem.</div>`;
  html += '</div>';
  
  html += '</div>'; // flex
  
  // Date vente estimée
  html += `<div style="text-align:center;margin-top:10px;font-size:9px;color:#6b7280;">${ico('calendar', 12, '#6b7280')} Vente estimée : <strong style="color:#1a2e35;">${formatDateFR(dateVenteEstimee)} ${dateVenteEstimee.getFullYear()}</strong></div>`;
  
  // Note recalibrage
  if (pauseRecalibrage > 0) {
    html += `<div style="text-align:center;margin-top:8px;padding:8px 12px;background:#fef3c7;border-radius:4px;font-size:8px;color:#92400e;">${ico('refresh', 12, '#92400e')} <strong>Phase de recalibrage marché (${pauseRecalibrage} sem.)</strong> — Le bien ayant déjà été exposé, cette période permet au marché de se renouveler et de repartir avec un positionnement optimal.</div>`;
  }
  
  html += '</div>'; // timeline section
  
  // === B. PASSAGE ENTRE PHASES (si projet d'achat détecté) ===
  if (hasProjetAchat && niveauContrainte > 0) {
    html += '<div style="padding:10px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
    html += '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-left:3px solid #0284c7;border-radius:6px;padding:10px 14px;">';
    html += `<div style="font-size:8px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:5px;">${ico('refresh', 10, '#0284c7')}Passage entre phases</div>`;
    html += `<div style="font-size:9px;color:#1e40af;line-height:1.5;margin-bottom:6px;font-weight:500;">Chaque transition s'active lorsque deux conditions sont réunies :</div>`;
    html += '<div style="display:flex;gap:12px;">';
    html += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#475569;">${ico('trendingUp', 10, '#0284c7')}Signaux marché suffisants</div>`;
    html += `<div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#475569;">${ico('checkCircle', 10, '#0284c7')}Contexte favorable</div>`;
    html += '</div>';
    html += '<div style="font-size:8px;color:#64748b;font-style:italic;margin-top:6px;">Le rythme reste piloté, jamais subi.</div>';
    html += '</div></div>';
  }
  
  // Trajectoires - Section principale
  html += '<div style="padding:12px 24px;background:#f8fafc;">';
  html += `<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:5px;">${ico('compass', 12, '#9ca3af')}${luxMode ? 'Choisissez votre scénario' : 'Choisissez votre point de départ'}</div>`;
  
  // === A. PHRASE POINT DE DÉPART STRATÉGIQUE (si projet d'achat détecté) ===
  if (hasProjetAchat && niveauContrainte > 0) {
    let phrasePointDepart = '';
    if (niveauContrainte >= 4) {
      phrasePointDepart = 'La trajectoire recommandée privilégie la maîtrise du calendrier avant toute intensification de l\'exposition.';
    } else if (niveauContrainte >= 2) {
      phrasePointDepart = 'La séquence proposée préserve une marge d\'ajustement temporelle en début de commercialisation.';
    } else {
      phrasePointDepart = 'Cette approche vous laisse le temps d\'observer les premiers signaux avant d\'élargir la diffusion.';
    }
    html += `<div style="font-size:8px;color:#64748b;font-style:italic;text-align:center;margin-bottom:10px;line-height:1.4;">${phrasePointDepart}</div>`;
  }
  
  html += '<div style="display:flex;gap:10px;">';
  
  trajectoires.forEach((traj) => {
    const statut = getStatut(traj.id);
    const isPointDepart = statut.label === 'Point de départ stratégique';
    const objectifValeur = Math.round(totalVenaleArrondi * (1 + traj.pourc / 100) / 5000) * 5000;
    
    html += `<div style="flex:1;background:white;border-radius:6px;border:${isPointDepart ? '2px solid #1a2e35' : '1px solid #e5e7eb'};overflow:hidden;">`;
    
    // Header trajectoire - compact
    html += `<div style="padding:10px;text-align:center;background:${isPointDepart ? '#1a2e35' : '#f9fafb'};border-bottom:1px solid #e5e7eb;">`;
    html += `<div style="margin-bottom:4px;">${ico(traj.icon, 18, isPointDepart ? 'rgba(255,255,255,0.8)' : '#9ca3af')}</div>`;
    html += `<div style="font-size:11px;font-weight:600;color:${isPointDepart ? 'white' : '#1a2e35'};">${traj.nom}</div>`;
    html += `<div style="margin-top:4px;display:inline-block;padding:2px 6px;border-radius:3px;font-size:7px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;${statut.style}">${statut.label}</div>`;
    html += '</div>';
    
    if (luxMode) {
      // MODE LUXE : 5 lignes structurées - compact
      // 1. Intention
      html += '<div style="padding:6px 10px;background:white;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Intention</div>';
      html += `<div style="font-size:8px;color:#4b5563;line-height:1.3;">${traj.objectifLux || traj.objectif}</div>`;
      html += '</div>';
      
      // 2. Type d'exposition
      html += '<div style="padding:6px 10px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Exposition</div>';
      html += `<div style="font-size:8px;color:#4b5563;">${traj.typeExposition}</div>`;
      html += '</div>';
      
      // 3. Type de pression (pression inversée)
      html += '<div style="padding:6px 10px;background:white;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Pression</div>';
      html += `<div style="font-size:8px;color:#4b5563;font-style:italic;">${traj.typePression}</div>`;
      html += '</div>';
      
      // 4. Prise en charge GARY
      html += '<div style="padding:6px 10px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">GARY pilote</div>';
      html += `<div style="font-size:8px;color:#4b5563;line-height:1.3;">${traj.priseEnCharge}</div>`;
      html += '</div>';
      
      // 5. Objectif de valeur + condition
      html += '<div style="padding:8px 10px;background:white;text-align:center;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;font-weight:600;">Objectif de valeur</div>';
      html += `<div style="font-size:14px;font-weight:400;color:${isPointDepart ? '#FF4539' : '#1a2e35'};">${formatPrice(objectifValeur)}</div>`;
      html += '<div style="font-size:6px;color:#9ca3af;margin-top:2px;line-height:1.2;">Atteignable si conditions respectées</div>';
      html += '</div>';
    } else {
      // MODE STANDARD
      // Objectif
      html += '<div style="padding:10px 12px;background:white;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:3px;font-weight:600;">Objectif</div>';
      html += `<div style="font-size:9px;color:#4b5563;line-height:1.4;">${traj.objectif}</div>`;
      html += '</div>';
      
      // Conditions
      html += '<div style="padding:10px 12px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:4px;font-weight:600;">Conditions</div>';
      traj.conditions.forEach((c: string) => {
        html += `<div style="font-size:9px;color:#4b5563;padding:2px 0;display:flex;align-items:center;gap:4px;">${ico('check', 10, '#9ca3af')}${c}</div>`;
      });
      html += '</div>';
      
      // Objectif de valeur
      html += '<div style="padding:12px;background:white;text-align:center;">';
      html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:4px;font-weight:600;">Objectif de valeur</div>';
      html += `<div style="font-size:16px;font-weight:400;color:${isPointDepart ? '#FF4539' : '#1a2e35'};">${formatPrice(objectifValeur)}</div>`;
      html += `<div style="font-size:8px;color:#9ca3af;margin-top:2px;">Vénale +${traj.pourc}%</div>`;
      html += '</div>';
    }
    
    html += '</div>';
  });
  
  html += '</div></div>';
  
  // Capital-Visibilité
  const capColor = capitalPct >= 70 ? '#1a2e35' : (capitalPct >= 50 ? '#64748b' : '#94a3b8');
  html += '<div style="padding:10px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:flex;align-items:center;gap:12px;">';
  html += `<div style="display:flex;align-items:center;gap:6px;">${ico('eye', 14, '#9ca3af')}<span style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:600;">${copy.capitalLabel}</span></div>`;
  html += `<div style="flex:1;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:${capitalPct}%;height:100%;background:${capColor};border-radius:3px;"></div></div>`;
  html += `<div style="font-size:11px;font-weight:500;color:${capColor};">${capitalPct}%</div>`;
  if (historique.dejaDiffuse) {
    html += `<div style="display:flex;align-items:center;gap:3px;padding:3px 6px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;">${ico('alertCircle', 10, '#6b7280')}<span style="font-size:7px;color:#6b7280;">Déjà diffusé</span></div>`;
  }
  html += '</div></div>';
  
  // Alertes (avec phrase LUX si applicable)
  if (capitalAlerts.length > 0 || (luxMode && historique.dejaDiffuse)) {
    html += '<div style="padding:10px 24px;background:white;border-top:1px solid #e5e7eb;">';
    html += `<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:6px;">${ico('alertCircle', 12, '#9ca3af')}${copy.recalibrageTitle}</div>`;
    // Phrase spécifique luxMode bien déjà exposé
    if (luxMode && historique.dejaDiffuse && copy.recalibragePhrase) {
      html += '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:6px;">';
      html += `<span style="font-size:9px;color:#4b5563;line-height:1.4;font-style:italic;">${copy.recalibragePhrase}</span>`;
      html += '</div>';
    }
    capitalAlerts.forEach((alert) => {
      const alertIco = alert.type === 'critical' ? 'xCircle' : (alert.type === 'warning' ? 'alertCircle' : 'circle');
      html += `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:6px 10px;margin-bottom:4px;display:flex;align-items:center;gap:6px;">${ico(alertIco, 12, '#6b7280')}<span style="font-size:9px;color:#4b5563;line-height:1.3;">${alert.msg}</span></div>`;
    });
    html += '</div>';
  }
  
  // Bloc "Valeur à préserver" (luxMode uniquement) - compact
  if (luxMode) {
    html += '<div style="padding:10px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;">';
    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;">';
    html += `<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:6px;">${ico('shield', 12, '#9ca3af')}Valeur à préserver</div>`;
    const valeurItems = [
      {icon: 'star', text: 'Image du bien'},
      {icon: 'lock', text: 'Discrétion et maîtrise de l\'information'},
      {icon: 'users', text: 'Sélectivité des visites'},
      {icon: 'edit', text: 'Cohérence du récit'}
    ];
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">';
    valeurItems.forEach((item) => {
      html += '<div style="display:flex;align-items:center;gap:5px;padding:4px 8px;background:#f9fafb;border-radius:4px;">';
      html += ico(item.icon, 10, '#9ca3af');
      html += `<span style="font-size:8px;color:#4b5563;">${item.text}</span>`;
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="font-size:8px;color:#6b7280;font-style:italic;text-align:center;line-height:1.3;">Dans ce segment, la stratégie protège autant la valeur que la confidentialité.</div>';
    html += '</div></div>';
  }
  
  // Disclaimer (adapté luxMode) - compact
  html += '<div style="padding:10px 24px;background:#f8fafc;">';
  html += `<div style="background:white;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;">${ico('info', 14, '#9ca3af')}<div style="font-size:8px;color:#6b7280;line-height:1.4;font-style:italic;">${copy.disclaimerPhrase}</div></div>`;
  html += '</div>';
  
  // === C. CADRE DE PILOTAGE (si projet d'achat détecté) ===
  if (hasProjetAchat && niveauContrainte > 0) {
    html += '<div style="padding:8px 24px;background:#f8fafc;">';
    html += '<div style="background:#f8fafc;border-left:3px solid #FF4539;border-radius:4px;padding:10px 14px;">';
    html += `<div style="font-size:8px;color:#FF4539;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:600;">Cadre de pilotage</div>`;
    html += '<div style="font-size:8px;color:#4b5563;line-height:1.5;">La stratégie proposée est conçue pour rester <strong>réversible et ajustable</strong> dans le temps. Elle s\'adapte à l\'évolution du marché et de votre situation personnelle, sans jamais exposer vos contraintes.</div>';
    html += '</div></div>';
  }
  
  // Footer
  html += '<div class="footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += `<div class="footer-ref">Page 2/X • ${copy.pageTitle}</div>`;
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  
  return html;
}

// ==================== PAGE 5: PLAN D'ACTION ====================
// Constantes GARY
const GARY_TEL = '+41 22 552 00 00';
const COURTIERS = [
  { id: 'david', nom: 'David Fuss', initiales: 'DF', email: 'david@gary.ch' },
  { id: 'maxime', nom: 'Maxime Jaquet', initiales: 'MJ', email: 'maxime@gary.ch' },
  { id: 'julien', nom: 'Julien Favre', initiales: 'JF', email: 'julien@gary.ch' },
  { id: 'amelie', nom: 'Amélie Dupont', initiales: 'AD', email: 'amelie@gary.ch' },
];

function generatePlanActionPage(estimation: EstimationData): string {
  const identification = estimation.identification as any || {};
  const historique = identification.historique || {};
  const analyse = (estimation as any).analyseTerrain || (estimation as any).analyse_terrain || {};
  const strat = (estimation as any).strategie || {};
  const pre = (estimation as any).preEstimation || (estimation as any).pre_estimation || {};
  
  const dateNow = new Date();
  const dateStr = dateNow.toLocaleDateString('fr-CH');
  const heureStr = dateNow.toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'});
  
  // === CAPITAL-VISIBILITÉ (calcul simplifié) ===
  let capitalPct = 100;
  if (historique.dejaDiffuse) {
    let dureeImpact = 0;
    if (historique.duree === 'moins1mois') dureeImpact = 5;
    else if (historique.duree === '1-3mois') dureeImpact = 15;
    else if (historique.duree === '3-6mois') dureeImpact = 30;
    else if (historique.duree === '6-12mois') dureeImpact = 50;
    else if (historique.duree === 'plus12mois') dureeImpact = 65;
    
    let diffusionImpact = 0;
    if (historique.typeDiffusion === 'discrete') diffusionImpact = 5;
    else if (historique.typeDiffusion === 'moderee') diffusionImpact = 15;
    else if (historique.typeDiffusion === 'massive') diffusionImpact = 30;
    
    capitalPct = 100 - dureeImpact - diffusionImpact;
    if (historique.typeDiffusion === 'discrete' && dureeImpact > 15) capitalPct += 10;
    if (historique.typeDiffusion === 'massive' && ['3-6mois', '6-12mois', 'plus12mois'].includes(historique.duree)) capitalPct -= 10;
    capitalPct = Math.max(10, Math.min(100, capitalPct));
  }
  
  // === ÉTAPES ===
  const etapes = [
    { label: 'Validation du mandat et des conditions' },
    { label: 'Préparation (photos, brochure, annonce)' },
    { label: 'Lancement de la commercialisation' },
    { label: 'Suivi des visites et retours marché' },
    { label: 'Négociation et accompagnement jusqu\'à l\'acte' },
    { label: 'Coordination notaire et remise des clés' }
  ];
  
  // === COURTIER ===
  const courtierData = COURTIERS.find(c => c.id === identification.courtier);
  const courtierNom = courtierData ? courtierData.nom : 'Votre courtier GARY';
  const courtierInitiales = courtierData ? courtierData.initiales : 'GA';
  const courtierEmail = courtierData ? courtierData.email : 'contact@gary.ch';
  
  // === GÉNÉRATION HTML ===
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
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
  html += `<div style="margin:0 auto 8px;">${ico('checkCircle', 28, '#1a2e35')}</div>`;
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
    html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6;">`;
    html += ico('check', 12, '#1a2e35');
    html += `<span style="font-size:10px;color:#1a2e35;">${a}</span>`;
    html += '</div>';
  });
  html += '</div></div>';
  
  // Bloc Pilotage partagé (droite - moins mis en avant)
  html += '<div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;opacity:0.75;">';
  html += '<div style="padding:20px 16px 12px;text-align:center;background:#fafafa;">';
  html += `<div style="margin:0 auto 8px;">${ico('share', 28, '#9ca3af')}</div>`;
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
    html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6;">`;
    html += ico(p.ok ? 'circle' : 'x', 12, '#9ca3af');
    html += `<span style="font-size:10px;color:#6b7280;">${p.text}</span>`;
    html += '</div>';
  });
  html += '</div></div>';
  
  html += '</div>'; // fin flex
  
  // Phrase dynamique selon contexte
  let phraseMandat = '';
  if (!historique.dejaDiffuse) {
    phraseMandat = 'Pour votre situation : le pilotage coordonné vous permet de <strong>maximiser vos chances dès le départ</strong> avec une stratégie cohérente.';
  } else if (capitalPct > 40) {
    phraseMandat = 'Pour votre situation : le pilotage coordonné vous permet de <strong>corriger le tir efficacement</strong> et de relancer avec une approche maîtrisée.';
  } else {
    phraseMandat = 'Pour votre situation : le pilotage coordonné vous permet de <strong>repartir proprement</strong>, sans hériter des erreurs passées.';
  }
  html += `<div style="margin-top:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;text-align:center;">`;
  html += `<span style="font-size:10px;color:#4b5563;line-height:1.5;">${phraseMandat}</span>`;
  html += '</div>';
  
  // Légende
  html += '<div style="margin-top:10px;display:flex;justify-content:center;gap:20px;">';
  html += `<div style="display:flex;align-items:center;gap:5px;">${ico('check', 10, '#1a2e35')}<span style="font-size:8px;color:#6b7280;">Optimal</span></div>`;
  html += `<div style="display:flex;align-items:center;gap:5px;">${ico('circle', 10, '#9ca3af')}<span style="font-size:8px;color:#6b7280;">Possible</span></div>`;
  html += `<div style="display:flex;align-items:center;gap:5px;">${ico('x', 10, '#9ca3af')}<span style="font-size:8px;color:#6b7280;">Difficile</span></div>`;
  html += '</div>';
  
  html += '</div>'; // fin section pilotage
  
  // Plan d'action - Prochaines étapes
  html += '<div style="padding:16px 24px;background:#f8fafc;">';
  html += `<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:6px;">${ico('list', 14, '#9ca3af')}Prochaines étapes</div>`;
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
  etapes.forEach((e, i) => {
    html += `<div style="display:flex;align-items:center;gap:10px;background:white;border-radius:6px;padding:10px;border:1px solid #e5e7eb;">`;
    html += `<div style="width:24px;height:24px;background:#1a2e35;border-radius:50%;color:white;font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</div>`;
    html += `<div style="font-size:9px;color:#4b5563;line-height:1.3;font-weight:500;">${e.label}</div>`;
    html += '</div>';
  });
  html += '</div></div>';
  
  // Notes si présentes
  if (analyse.notesLibres || strat.notesStrategie) {
    html += '<div style="margin:0 24px 12px;background:#f9fafb;border:1px solid #e5e7eb;padding:12px 16px;border-radius:6px;">';
    html += `<div style="font-size:9px;font-weight:600;color:#6b7280;margin-bottom:6px;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:0.5px;">${ico('edit', 12, '#9ca3af')}Notes</div>`;
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
  html += `<div style="width:40px;height:40px;border-radius:50%;background:#1a2e35;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:500;">${courtierInitiales}</div>`;
  html += '<div>';
  html += `<div style="font-size:13px;font-weight:600;color:#1a2e35;">${courtierNom}</div>`;
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Conseiller immobilier GARY</div>';
  html += '</div></div>';
  html += '<div style="text-align:right;">';
  html += '<div style="font-size:10px;color:#1a2e35;font-weight:500;">Fait à Genève</div>';
  html += `<div style="font-size:9px;color:#6b7280;">Le ${dateStr}</div>`;
  html += '</div></div>';
  
  // Coordonnées et signature sur une ligne
  html += '<div style="display:flex;gap:20px;align-items:flex-end;">';
  html += '<div style="flex:1;background:#f9fafb;border-radius:6px;padding:10px;">';
  html += '<div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;">';
  html += `<div style="display:flex;align-items:center;gap:6px;">${ico('phone', 14, '#9ca3af')}<span style="font-size:10px;color:#4b5563;font-weight:500;">${GARY_TEL}</span></div>`;
  html += `<div style="display:flex;align-items:center;gap:6px;">${ico('mail', 14, '#9ca3af')}<span style="font-size:10px;color:#4b5563;font-weight:500;">${courtierEmail}</span></div>`;
  html += `<div style="display:flex;align-items:center;gap:6px;">${ico('globe', 14, '#9ca3af')}<span style="font-size:10px;color:#4b5563;font-weight:500;">gary.ch</span></div>`;
  html += '</div></div>';
  html += '<div style="width:160px;">';
  html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;">Signature</div>';
  html += '<div style="border-bottom:1px solid #1a2e35;height:36px;"></div>';
  html += '</div>';
  html += '</div></div>';
  
  // Footer
  html += '<div class="footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += `<div class="footer-ref">Page 3/X • ${dateStr} • ${heureStr}</div>`;
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  
  return html;
}

// ==================== PAGE 6: MÉTHODOLOGIE D'ESTIMATION ====================
function generateMethodologiePage(estimation: EstimationData, pageNum: number = 6, totalPages: number = 9): string {
  const identification = estimation.identification as any || {};
  const bien = identification.bien || {};
  const carac = (estimation as any).caracteristiques || {};
  const pre = (estimation as any).preEstimation || (estimation as any).pre_estimation || {};
  
  const dateNow = new Date();
  const dateStr = dateNow.toLocaleDateString('fr-CH');
  
  // Type de bien
  const isAppartement = bien.type === 'appartement' || carac.typeBien === 'appartement';
  const isMaison = bien.type === 'maison' || carac.typeBien === 'maison';
  
  // === CALCULS SURFACES APPARTEMENT ===
  const surfacePPE = parseFloat(carac.surfacePPE) || 0;
  const surfaceNonHab = parseFloat(carac.surfaceNonHabitable) || 0;
  const surfaceBalcon = parseFloat(carac.surfaceBalcon) || 0;
  const surfaceTerrasse = parseFloat(carac.surfaceTerrasse) || 0;
  const surfaceJardin = parseFloat(carac.surfaceJardin) || 0;
  const surfacePonderee = surfacePPE + (surfaceNonHab * 0.5) + (surfaceBalcon * 0.5) + (surfaceTerrasse * 0.33) + (surfaceJardin * 0.1);
  
  // === CALCULS MAISON ===
  const surfaceTerrain = parseFloat(carac.surfaceTerrain) || 0;
  const surfaceUtile = parseFloat(carac.surfaceUtile) || 0;
  const hauteurSousPlafond = parseFloat(carac.hauteurSousPlafond) || 2.5;
  const cubage = surfaceUtile * hauteurSousPlafond;
  const surfaceAmenagement = parseFloat(carac.surfaceAmenagement) || Math.max(0, surfaceTerrain - 200);
  
  // === VALEURS PRÉ-ESTIMATION ===
  const prixM2 = parseFloat(pre.prixM2) || 15000;
  const valeurSurface = surfacePonderee * prixM2;
  
  const nbPlaceInt = parseInt(carac.parkingInterieur) || 0;
  const nbPlaceExt = parseInt(carac.parkingExterieur) || 0;
  const nbBox = parseInt(carac.boxFerme) || 0;
  const hasCave = carac.cave === true || carac.cave === 'oui';
  
  const prixPlaceInt = parseFloat(pre.prixPlaceInterieur) || 50000;
  const prixPlaceExt = parseFloat(pre.prixPlaceExterieur) || 30000;
  const prixBox = parseFloat(pre.prixBox) || 60000;
  const prixCave = parseFloat(pre.prixCave) || 15000;
  
  const valeurPlaceInt = nbPlaceInt * prixPlaceInt;
  const valeurPlaceExt = nbPlaceExt * prixPlaceExt;
  const valeurBox = nbBox * prixBox;
  const valeurCave = hasCave ? prixCave : 0;
  
  // Maison
  const prixM2Terrain = parseFloat(pre.prixM2Terrain) || 2000;
  const prixM3 = parseFloat(pre.prixM3) || 800;
  const prixM2Amenagement = parseFloat(pre.prixM2Amenagement) || 150;
  
  const valeurTerrain = surfaceTerrain * prixM2Terrain;
  const valeurCubage = cubage * prixM3;
  const valeurAmenagement = surfaceAmenagement * prixM2Amenagement;
  
  // Lignes supplémentaires
  const lignesSupp = pre.lignesSupp || [];
  let valeurLignesSupp = 0;
  lignesSupp.forEach((l: any) => {
    if (l && l.prix) valeurLignesSupp += parseFloat(l.prix) || 0;
  });
  
  // Annexes maison
  const annexes = pre.annexes || [];
  let valeurAnnexes = 0;
  annexes.forEach((a: any) => {
    if (a && a.prix) valeurAnnexes += parseFloat(a.prix) || 0;
  });
  
  // Total vénale
  let totalVenale = 0;
  if (isAppartement) {
    totalVenale = valeurSurface + valeurPlaceInt + valeurPlaceExt + valeurBox + valeurCave + valeurLignesSupp;
  } else {
    totalVenale = valeurTerrain + valeurCubage + valeurAmenagement + valeurAnnexes;
  }
  const totalVenaleArrondi = Math.round(totalVenale / 5000) * 5000;
  
  // Fourchette
  const prixEntre = Math.round(totalVenaleArrondi * 0.97 / 5000) * 5000;
  const prixEt = Math.round(totalVenaleArrondi * 1.03 / 5000) * 5000;
  
  // Valeur rendement
  const loyerMensuel = parseFloat(pre.loyerMensuel) || 0;
  const loyerAnnuel = loyerMensuel * 12;
  const tauxCapitalisation = parseFloat(pre.tauxCapitalisation) || 2.5;
  const valeurRendement = loyerAnnuel > 0 ? Math.round((loyerAnnuel / (tauxCapitalisation / 100)) / 5000) * 5000 : 0;
  
  // Valeur de gage (65% vénale)
  const valeurGage = Math.round(totalVenaleArrondi * 0.65 / 5000) * 5000;
  const valeurGageArrondi = valeurGage;
  
  // === COMPARABLES ===
  const comparablesVendus = pre.comparablesVendus || [];
  const comparablesEnVente = pre.comparablesEnVente || [];
  const totalComparables = comparablesVendus.length + comparablesEnVente.length;
  const comparablesEnAnnexe = totalComparables > 7;
  const hasComparables = totalComparables > 0;
  
  // Fonction formatPrice locale
  const formatPriceLocal = (num: number): string => {
    if (!num && num !== 0) return '-';
    return num.toLocaleString('fr-CH') + ' CHF';
  };
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
  html += '<div class="header-date">Annexe : Méthodologie</div>';
  html += '</div>';
  
  // Fourchette de négociation
  html += '<div style="background:#f8fafc;padding:12px 30px;display:flex;justify-content:center;align-items:center;gap:30px;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:flex;align-items:center;gap:8px;">';
  html += '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Fourchette</span>';
  html += `<span style="font-size:16px;font-weight:300;color:#1a2e35;">${formatPriceLocal(prixEntre)}</span>`;
  html += '<span style="color:#d1d5db;font-size:14px;">→</span>';
  html += `<span style="font-size:16px;font-weight:300;color:#1a2e35;">${formatPriceLocal(prixEt)}</span>`;
  html += '</div>';
  html += '</div>';
  
  // Les 3 valeurs - Grille compacte
  html += '<div style="padding:16px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">';
  
  // Valeur Vénale
  html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">${ico('target', 14, '#9ca3af')}<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Vénale</span></div>`;
  html += `<div style="font-size:18px;font-weight:400;color:#1a2e35;">${formatPriceLocal(totalVenaleArrondi)}</div>`;
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Base de calcul</div>';
  html += '</div>';
  
  // Valeur Rendement
  html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">${ico('trendingUp', 14, '#9ca3af')}<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Rendement</span></div>`;
  html += `<div style="font-size:18px;font-weight:400;color:#1a2e35;">${valeurRendement > 0 ? formatPriceLocal(valeurRendement) : '-'}</div>`;
  html += `<div style="font-size:9px;color:#9ca3af;margin-top:4px;">${loyerMensuel > 0 ? `Taux ${tauxCapitalisation.toFixed(1)}% • ${formatPriceLocal(loyerMensuel)}/mois` : 'Non renseigné'}</div>`;
  html += '</div>';
  
  // Valeur de Gage
  html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">${ico('lock', 14, '#9ca3af')}<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Gage</span></div>`;
  html += `<div style="font-size:18px;font-weight:400;color:#1a2e35;">${formatPriceLocal(valeurGageArrondi)}</div>`;
  html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Réf. bancaire</div>';
  html += '</div>';
  
  html += '</div></div>';
  
  // Détail du calcul - Tableau compact
  html += '<div style="padding:12px 24px;background:#f8fafc;">';
  html += '<div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;">Détail du calcul</div>';
  html += '<div style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.04);">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
  html += '<tr style="background:linear-gradient(135deg,#1a2e35 0%,#2c3e50 100%);color:white;">';
  html += '<th style="padding:10px 14px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Élément</th>';
  html += '<th style="padding:10px 14px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Quantité</th>';
  html += '<th style="padding:10px 14px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Prix unitaire</th>';
  html += '<th style="padding:10px 14px;text-align:right;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Montant</th>';
  html += '</tr>';
  
  if (isAppartement) {
    html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Surface pondérée</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${surfacePonderee.toFixed(1)} m²</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixM2)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurSurface)}</td></tr>`;
    if (nbPlaceInt) html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Places intérieures</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${nbPlaceInt}</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixPlaceInt)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurPlaceInt)}</td></tr>`;
    if (nbPlaceExt) html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Places extérieures</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${nbPlaceExt}</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixPlaceExt)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurPlaceExt)}</td></tr>`;
    if (nbBox) html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Box fermé</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${nbBox}</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixBox)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurBox)}</td></tr>`;
    if (hasCave) html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Cave</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">1</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixCave)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurCave)}</td></tr>`;
    lignesSupp.forEach((l: any) => {
      if (l && l.libelle && l.prix) {
        html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">${l.libelle}</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">—</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">—</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(parseFloat(l.prix))}</td></tr>`;
      }
    });
  } else {
    html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Terrain</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${surfaceTerrain.toFixed(0)} m²</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixM2Terrain)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurTerrain)}</td></tr>`;
    html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Cubage construction</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${cubage.toFixed(0)} m³</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixM3)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurCubage)}</td></tr>`;
    html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Aménagements ext.</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${surfaceAmenagement.toFixed(0)} m²</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">${formatPriceLocal(prixM2Amenagement)}</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(valeurAmenagement)}</td></tr>`;
    annexes.forEach((a: any) => {
      if (a && a.libelle && a.prix) {
        html += `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">${a.libelle}</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">—</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">—</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">${formatPriceLocal(parseFloat(a.prix))}</td></tr>`;
      }
    });
  }
  html += `<tr style="background:#1a2e35;color:white;"><td colspan="3" style="padding:12px 14px;font-weight:600;font-size:11px;letter-spacing:0.5px;">VALEUR VÉNALE TOTALE</td><td style="padding:12px 14px;text-align:right;font-weight:600;font-size:14px;color:#FF4539;">${formatPriceLocal(totalVenaleArrondi)}</td></tr>`;
  html += '</table></div></div>';
  
  // === SECTION COMPARABLES MARCHÉ ===
  if (hasComparables) {
    html += '<div style="padding:16px 24px;background:white;">';
    html += `<div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;display:flex;align-items:center;gap:5px;">${ico('trendingUp', 12, '#9ca3af')}Positionnement marché</div>`;
    
    // Collecter tous les prix pour l'échelle
    const allPrices: {prix: number, type: string, data?: any}[] = [];
    allPrices.push({ prix: totalVenaleArrondi, type: 'estimation' });
    
    comparablesVendus.forEach((c: any) => {
      const p = parseFloat((c.prix || '').toString().replace(/[^\d]/g, ''));
      if (p > 0) allPrices.push({ prix: p, type: 'vendu', data: c });
    });
    comparablesEnVente.forEach((c: any) => {
      const p = parseFloat((c.prix || '').toString().replace(/[^\d]/g, ''));
      if (p > 0) allPrices.push({ prix: p, type: 'envente', data: c });
    });
    
    allPrices.sort((a, b) => a.prix - b.prix);
    
    // Échelle visuelle
    if (allPrices.length > 1) {
      const minPrix = allPrices[0].prix;
      const maxPrix = allPrices[allPrices.length - 1].prix;
      const range = maxPrix - minPrix || 1;
      
      html += '<div style="background:#f8fafc;border-radius:6px;padding:10px 12px;margin-bottom:8px;">';
      
      if (totalComparables > 7) {
        // Mode heatmap
        html += '<div style="display:flex;justify-content:space-between;font-size:7px;color:#6b7280;margin-bottom:6px;">';
        html += `<span>${(minPrix / 1000000).toFixed(2)}M</span><span>${(maxPrix / 1000000).toFixed(2)}M</span>`;
        html += '</div>';
        
        const buckets: {vendus: number, envente: number, total: number}[] = [];
        for (let b = 0; b < 10; b++) {
          buckets.push({ vendus: 0, envente: 0, total: 0 });
        }
        const bucketSize = range / 10;
        
        allPrices.forEach(item => {
          if (item.type === 'estimation') return;
          const bucketIdx = Math.min(9, Math.floor((item.prix - minPrix) / bucketSize));
          buckets[bucketIdx].total++;
          if (item.type === 'vendu') buckets[bucketIdx].vendus++;
          else buckets[bucketIdx].envente++;
        });
        
        const maxVendus = Math.max(...buckets.map(b => b.vendus)) || 1;
        const maxEnVente = Math.max(...buckets.map(b => b.envente)) || 1;
        const estPos = ((totalVenaleArrondi - minPrix) / range) * 100;
        
        html += '<div style="position:relative;">';
        
        // Barre vendus
        html += '<div style="display:flex;gap:2px;margin-bottom:2px;">';
        buckets.forEach(bucket => {
          const intensity = bucket.vendus / maxVendus;
          const bgColor = bucket.vendus === 0 ? '#f0fdf4' : `rgba(16,185,129,${0.2 + intensity * 0.6})`;
          html += `<div style="flex:1;height:18px;background:${bgColor};border-radius:3px;display:flex;align-items:center;justify-content:center;">`;
          if (bucket.vendus > 0) {
            html += `<span style="font-size:7px;color:#065f46;font-weight:600;">${bucket.vendus}</span>`;
          }
          html += '</div>';
        });
        html += '</div>';
        
        // Barre en vente
        html += '<div style="display:flex;gap:2px;">';
        buckets.forEach(bucket => {
          const intensity = bucket.envente / maxEnVente;
          const bgColor = bucket.envente === 0 ? '#f9fafb' : `rgba(107,114,128,${0.15 + intensity * 0.5})`;
          html += `<div style="flex:1;height:18px;background:${bgColor};border-radius:3px;display:flex;align-items:center;justify-content:center;">`;
          if (bucket.envente > 0) {
            html += `<span style="font-size:7px;color:#374151;font-weight:600;">${bucket.envente}</span>`;
          }
          html += '</div>';
        });
        html += '</div>';
        
        // Étoile estimation
        html += `<div style="position:absolute;left:${estPos}%;top:50%;transform:translate(-50%,-50%);z-index:10;">`;
        html += '<div style="width:22px;height:22px;background:#FA4238;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.2);">';
        html += '<span style="color:white;font-size:11px;">★</span>';
        html += '</div></div>';
        
        html += '</div>';
        
        // Légende
        html += '<div style="display:flex;justify-content:center;gap:12px;font-size:7px;margin-top:6px;">';
        html += '<span style="color:#10b981;">✓ Vendus</span>';
        html += '<span style="color:#6b7280;">○ En vente</span>';
        html += '<span style="color:#FA4238;">★ Votre bien</span>';
        html += '</div>';
      } else {
        // Mode points standard
        html += '<div style="display:flex;justify-content:space-between;font-size:7px;color:#6b7280;margin-bottom:6px;">';
        html += '<span>Prix bas</span><span>Prix haut</span>';
        html += '</div>';
        
        html += '<div style="position:relative;height:36px;background:linear-gradient(90deg,#e5e7eb 0%,#f3f4f6 100%);border-radius:12px;margin-bottom:6px;">';
        
        allPrices.forEach(item => {
          const pos = ((item.prix - minPrix) / range) * 85 + 7;
          const color = item.type === 'estimation' ? '#FF4539' : (item.type === 'vendu' ? '#10b981' : '#6b7280');
          const symbol = item.type === 'estimation' ? '★' : (item.type === 'vendu' ? '✓' : '○');
          const size = item.type === 'estimation' ? '12px' : '10px';
          
          html += `<div style="position:absolute;left:${pos}%;top:6px;transform:translateX(-50%);text-align:center;">`;
          html += `<div style="font-size:${size};color:${color};font-weight:bold;">${symbol}</div>`;
          html += `<div style="font-size:7px;color:${color};margin-top:1px;white-space:nowrap;">${(item.prix / 1000000).toFixed(2)}M</div>`;
          html += '</div>';
        });
        
        html += '</div>';
        
        html += '<div style="display:flex;justify-content:center;gap:12px;font-size:7px;">';
        html += '<span style="color:#10b981;">✓ Vendu</span>';
        html += '<span style="color:#6b7280;">○ En vente</span>';
        html += '<span style="color:#FF4539;">★ Votre bien</span>';
        html += '</div>';
      }
      html += '</div>';
    }
    
    // Détails comparables OU message annexe
    if (comparablesEnAnnexe) {
      html += '<div style="background:#f8fafc;border-radius:6px;padding:12px 16px;text-align:center;margin-top:8px;">';
      html += `<div style="font-size:9px;color:#6b7280;">Détail des ${totalComparables} comparables en annexe</div>`;
      html += '</div>';
    } else {
      // Mode normal - afficher les détails
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
      
      // Colonne vendus
      if (comparablesVendus.length > 0) {
        html += '<div>';
        html += '<div style="font-size:8px;font-weight:600;color:#10b981;margin-bottom:6px;display:flex;align-items:center;gap:3px;">✓ Transactions récentes</div>';
        comparablesVendus.forEach((c: any) => {
          const garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;background:#FA4238;color:white;border-radius:50%;font-size:8px;font-weight:700;margin-left:4px;">G</span>' : '';
          const typeMaisonLabels: Record<string, string> = {'individuelle': 'Maison individuelle', 'jumelee': 'Maison jumelée', 'mitoyenne': 'Maison mitoyenne', 'contigue': 'Maison contiguë'};
          const typeMaisonLabel = typeMaisonLabels[c.typeMaison] || '';
          html += `<div style="background:${c.isGary ? '#fff5f4' : '#f0fdf4'};border-radius:4px;padding:6px 8px;margin-bottom:4px;border-left:2px solid ${c.isGary ? '#FA4538' : '#10b981'};">`;
          html += `<div style="font-size:8px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">${c.adresse || '-'}${garyBadge}</div>`;
          const prixNum = parseFloat((c.prix || '').toString().replace(/[^\d]/g, ''));
          html += `<div style="font-size:9px;color:${c.isGary ? '#FA4539' : '#10b981'};font-weight:600;">${prixNum > 0 ? formatPriceLocal(prixNum) : c.prix || '-'}</div>`;
          const details: string[] = [];
          if (c.surface) details.push(c.surface);
          if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
          if (typeMaisonLabel) details.push(typeMaisonLabel);
          if (c.dateVente) details.push(c.dateVente);
          if (c.commentaire) details.push(c.commentaire);
          if (details.length > 0) {
            html += `<div style="font-size:7px;color:#6b7280;margin-top:1px;">${details.join(' • ')}</div>`;
          }
          html += '</div>';
        });
        html += '</div>';
      }
      
      // Colonne en vente
      if (comparablesEnVente.length > 0) {
        html += '<div>';
        html += '<div style="font-size:8px;font-weight:600;color:#6b7280;margin-bottom:6px;display:flex;align-items:center;gap:3px;">○ Actuellement en vente</div>';
        comparablesEnVente.forEach((c: any) => {
          const garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;background:#FA4238;color:white;border-radius:50%;font-size:8px;font-weight:700;margin-left:4px;">G</span>' : '';
          const typeMaisonLabels: Record<string, string> = {'individuelle': 'Maison individuelle', 'jumelee': 'Maison jumelée', 'mitoyenne': 'Maison mitoyenne', 'contigue': 'Maison contiguë'};
          const typeMaisonLabel = typeMaisonLabels[c.typeMaison] || '';
          html += `<div style="background:${c.isGary ? '#fff5f4' : '#f9fafb'};border-radius:4px;padding:6px 8px;margin-bottom:4px;border-left:2px solid ${c.isGary ? '#FA4538' : '#9ca3af'};">`;
          html += `<div style="font-size:8px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">${c.adresse || '-'}${garyBadge}</div>`;
          const prixNum = parseFloat((c.prix || '').toString().replace(/[^\d]/g, ''));
          html += `<div style="font-size:9px;color:${c.isGary ? '#FA4539' : '#6b7280'};font-weight:600;">${prixNum > 0 ? formatPriceLocal(prixNum) : c.prix || '-'}</div>`;
          const details: string[] = [];
          if (c.surface) details.push(c.surface);
          if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
          if (typeMaisonLabel) details.push(typeMaisonLabel);
          if (c.dureeEnVente) details.push('Depuis ' + c.dureeEnVente);
          if (c.commentaire) details.push(c.commentaire);
          if (details.length > 0) {
            html += `<div style="font-size:7px;color:#6b7280;margin-top:1px;">${details.join(' • ')}</div>`;
          }
          html += '</div>';
        });
        html += '</div>';
      }
      
      html += '</div>';
    }
    
    // Positionnement du bien
    html += '<div style="margin-top:8px;background:linear-gradient(135deg,#fff5f4 0%,#ffffff 100%);border:1px solid #FF4539;border-radius:6px;padding:8px 10px;text-align:center;">';
    html += '<div style="font-size:7px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Votre bien</div>';
    html += `<div style="font-size:9px;font-weight:600;color:#1a2e35;">${val(bien.adresse)}</div>`;
    html += `<div style="font-size:12px;font-weight:700;color:#FF4539;margin-top:2px;">${formatPriceLocal(totalVenaleArrondi)}</div>`;
    html += '</div>';
    
    html += '</div>'; // section comparables
  }
  
  // Footer
  html += '<div class="footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += `<div class="footer-ref">Page ${pageNum}/${totalPages} • Réf: EST-${dateNow.getTime().toString().slice(-8)}</div>`;
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // page
  
  return html;
}

// ==================== PAGE 7: ANNEXE TECHNIQUE (1/2) ====================
function generateAnnexeTechnique1Page(estimation: EstimationData, pageNum: number = 7, totalPages: number = 9): string {
  const identification = estimation.identification as any || {};
  const vendeur = identification.vendeur || {};
  const bien = identification.bien || {};
  const contexte = identification.contexte || {};
  const carac = (estimation as any).caracteristiques || {};
  
  const isAppartement = bien.type === 'appartement' || carac.typeBien === 'appartement';
  const isMaison = bien.type === 'maison' || carac.typeBien === 'maison';
  
  // Calcul surface pondérée
  const surfacePPE = parseFloat(carac.surfacePPE) || 0;
  const surfaceNonHab = parseFloat(carac.surfaceNonHabitable) || 0;
  const surfaceBalcon = parseFloat(carac.surfaceBalcon) || 0;
  const surfaceTerrasse = parseFloat(carac.surfaceTerrasse) || 0;
  const surfaceJardin = parseFloat(carac.surfaceJardin) || 0;
  const surfacePonderee = surfacePPE + (surfaceNonHab * 0.5) + (surfaceBalcon * 0.5) + (surfaceTerrasse * 0.33) + (surfaceJardin * 0.1);
  
  // Helper pour valeur ou tiret
  const annexeVal = (v: any, suffix?: string): string => {
    if (v === undefined || v === null || v === '') return '—';
    return v + (suffix || '');
  };
  
  // Labels
  const sousTypeLabels: Record<string, string> = {
    'standard': 'Standard', 'standing': 'Standing', 'attique': 'Attique', 
    'duplex': 'Duplex/Triplex', 'sousplex': 'Sousplex', 'loft': 'Loft', 
    'studio': 'Studio', 'rez_jardin': 'Rez-jardin', 'hotel_particulier': 'Hôtel particulier',
    'villa_individuelle': 'Villa individuelle', 'villa_mitoyenne': 'Villa mitoyenne',
    'villa_jumelee': 'Villa jumelée', 'maison_village': 'Maison de village',
    'chalet': 'Chalet', 'ferme_rustico': 'Ferme/Rustico', 'maison_architecte': "Maison d'architecte",
    'chateau': 'Château', 'pied_dans_eau': 'Pied dans l\'eau'
  };
  
  const zoneLabels: Record<string, string> = {
    '5': 'Zone 5 (Villa)', '4BP': 'Zone 4B protégée', '4B': 'Zone 4B', 
    '4A': 'Zone 4A', '3': 'Zone 3', '2': 'Zone 2', '1': 'Zone 1',
    'ZD': 'Zone développement', 'agricole': 'Agricole', 'industrielle': 'Industrielle', 'autre': 'Autre'
  };
  
  const buanderieLabels: Record<string, string> = { 'privee': 'Privée', 'commune': 'Commune', 'aucune': 'Aucune' };
  
  const motifLabels: Record<string, string> = {
    'succession': 'Succession', 'divorce': 'Divorce', 'demenagement': 'Déménagement',
    'agrandissement': 'Agrandissement', 'reduction': 'Réduction surface', 
    'investissement': 'Investissement', 'financier': 'Raisons financières',
    'travail': 'Mutation professionnelle', 'retraite': 'Retraite', 'autre': 'Autre'
  };
  
  const prioriteLabels: Record<string, string> = {
    'rapidite': 'Rapidité', 'prixMax': 'Prix maximum', 'equilibre': 'Équilibre', 'discretion': 'Discrétion'
  };
  
  const confidentLabels: Record<string, string> = {
    'normale': 'Normale', 'discrete': 'Discrète', 'confidentielle': 'Confidentielle'
  };
  
  const espaceLabels: Record<string, string> = {
    'cave': 'Cave', 'buanderie': 'Buanderie', 'local_tech': 'Local technique', 
    'salle_jeux': 'Salle de jeux', 'home_cinema': 'Home cinéma', 'cellier': 'Cellier',
    'abri_pc': 'Abri PC', 'chambre_ss': 'Chambre SS', 'sdb_ss': 'SDB SS', 'wc_ss': 'WC SS',
    'bureau': 'Bureau', 'studio': 'Studio indép.', 'spa': 'Spa/Wellness', 'sauna': 'Sauna',
    'hammam': 'Hammam', 'piscine_int': 'Piscine int.', 'piscine_ext': 'Piscine ext.',
    'dressing': 'Dressing', 'bibliotheque': 'Bibliothèque', 'atelier': 'Atelier',
    'local_ski': 'Local ski', 'cabanon': 'Cabanon', 'pool_house': 'Pool house',
    'dependance': 'Dépendance', 'conciergerie': 'Conciergerie'
  };
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
  html += '<div class="header-date">Annexe Technique (1/2)</div>';
  html += '</div>';
  
  // Styles spécifiques annexe
  html += '<style>';
  html += '.annexe-section { padding: 10px 24px; border-bottom: 1px solid #e5e7eb; }';
  html += '.annexe-section:last-of-type { border-bottom: none; }';
  html += '.annexe-title { font-size: 10px; font-weight: 700; color: #FF4539; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }';
  html += '.annexe-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }';
  html += '.annexe-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }';
  html += '.annexe-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }';
  html += '.annexe-item { background: #f8fafc; border-radius: 4px; padding: 6px 8px; }';
  html += '.annexe-item-label { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }';
  html += '.annexe-item-value { font-size: 10px; color: #1a2e35; font-weight: 600; }';
  html += '.annexe-row { display: flex; gap: 8px; flex-wrap: wrap; }';
  html += '.annexe-chip { background: #e5e7eb; color: #4b5563; padding: 3px 8px; border-radius: 10px; font-size: 8px; }';
  html += '.annexe-chip.positive { background: #d1fae5; color: #065f46; }';
  html += '.annexe-chip.negative { background: #fee2e2; color: #991b1b; }';
  html += '.annexe-prox { display: flex; align-items: center; gap: 6px; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }';
  html += '.annexe-prox:last-child { border-bottom: none; }';
  html += '</style>';
  
  // === SECTION VENDEUR ===
  html += '<div class="annexe-section">';
  html += `<div class="annexe-title">${ico('user', 12, '#FF4539')} Contact Vendeur</div>`;
  html += '<div class="annexe-grid-3">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Nom</div><div class="annexe-item-value">${annexeVal(vendeur.nom)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Téléphone</div><div class="annexe-item-value">${annexeVal(vendeur.telephone)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Email</div><div class="annexe-item-value">${annexeVal(vendeur.email)}</div></div>`;
  html += '</div></div>';
  
  // === SECTION ADRESSE ===
  html += '<div class="annexe-section">';
  html += `<div class="annexe-title">${ico('mapPin', 12, '#FF4539')} Localisation</div>`;
  html += '<div class="annexe-grid-3">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Adresse</div><div class="annexe-item-value">${annexeVal(bien.adresse)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Code postal</div><div class="annexe-item-value">${annexeVal(bien.codePostal)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Localité</div><div class="annexe-item-value">${annexeVal(bien.localite)}</div></div>`;
  html += '</div></div>';
  
  // === SECTION CONTEXTE ===
  html += '<div class="annexe-section">';
  html += `<div class="annexe-title">${ico('info', 12, '#FF4539')} Contexte de vente</div>`;
  html += '<div class="annexe-grid">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Motif</div><div class="annexe-item-value">${annexeVal(motifLabels[contexte.motifVente])}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Horizon</div><div class="annexe-item-value">${annexeVal(contexte.horizon)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Priorité</div><div class="annexe-item-value">${annexeVal(prioriteLabels[contexte.prioriteVendeur])}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Confidentialité</div><div class="annexe-item-value">${annexeVal(confidentLabels[contexte.confidentialite])}</div></div>`;
  html += '</div>';
  // Occupation
  const occupationText = contexte.statutOccupation === 'libre' ? 'Libre' : 
    (contexte.statutOccupation === 'loue' ? 'Loué' + (contexte.finBailMois && contexte.finBailAnnee ? ' (fin: ' + contexte.finBailMois + '/' + contexte.finBailAnnee + ')' : '') : '—');
  html += '<div class="annexe-grid-2" style="margin-top:6px;">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Occupation</div><div class="annexe-item-value">${occupationText}</div></div>`;
  html += '</div></div>';
  
  // === SECTION PROXIMITÉS ===
  const proximites = identification.proximites || [];
  const proxFiltrees = proximites.filter((p: any) => p.libelle);
  if (proxFiltrees.length > 0) {
    html += '<div class="annexe-section">';
    html += `<div class="annexe-title">${ico('mapPin', 12, '#FF4539')} Proximités</div>`;
    proxFiltrees.forEach((p: any) => {
      html += '<div class="annexe-prox">';
      html += `<span style="font-size:14px;">${p.icone || '📍'}</span>`;
      html += `<span style="font-size:9px;color:#1a2e35;flex:1;">${p.libelle}</span>`;
      if (p.distance) html += `<span style="font-size:9px;color:#6b7280;">${p.distance} m</span>`;
      html += '</div>';
    });
    html += '</div>';
  }
  
  // === SECTION CARACTÉRISTIQUES ===
  html += '<div class="annexe-section">';
  html += `<div class="annexe-title">${ico('home', 12, '#FF4539')} Caractéristiques du bien</div>`;
  
  // Type et sous-type
  html += '<div class="annexe-grid">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Type</div><div class="annexe-item-value">${isAppartement ? 'Appartement' : (isMaison ? 'Maison' : '—')}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Sous-type</div><div class="annexe-item-value">${annexeVal(sousTypeLabels[carac.sousType])}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Année construction</div><div class="annexe-item-value">${annexeVal(carac.anneeConstruction)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Rénovation</div><div class="annexe-item-value">${annexeVal(carac.anneeRenovation)}</div></div>`;
  html += '</div>';
  
  // Surfaces selon type
  html += '<div class="annexe-grid" style="margin-top:6px;">';
  if (isAppartement) {
    html += `<div class="annexe-item"><div class="annexe-item-label">Surface PPE</div><div class="annexe-item-value">${annexeVal(carac.surfacePPE, ' m²')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Sous-sol hab.</div><div class="annexe-item-value">${annexeVal(carac.surfaceNonHabitable, ' m²')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Balcon</div><div class="annexe-item-value">${annexeVal(carac.surfaceBalcon, ' m²')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Terrasse</div><div class="annexe-item-value">${annexeVal(carac.surfaceTerrasse, ' m²')}</div></div>`;
    html += '</div><div class="annexe-grid" style="margin-top:6px;">';
    html += `<div class="annexe-item"><div class="annexe-item-label">Jardin privatif</div><div class="annexe-item-value">${annexeVal(carac.surfaceJardin, ' m²')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">N° lot PPE</div><div class="annexe-item-value">${annexeVal(carac.numeroLotPPE)}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Fonds rénovation</div><div class="annexe-item-value">${annexeVal(carac.fondRenovation, ' CHF')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Surface pondérée</div><div class="annexe-item-value">${surfacePonderee.toFixed(1)} m²</div></div>`;
  } else if (isMaison) {
    html += `<div class="annexe-item"><div class="annexe-item-label">Surface habitable</div><div class="annexe-item-value">${annexeVal(carac.surfaceHabitableMaison, ' m²')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Surface utile</div><div class="annexe-item-value">${annexeVal(carac.surfaceUtile, ' m²')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Surface terrain</div><div class="annexe-item-value">${annexeVal(carac.surfaceTerrain, ' m²')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">N° parcelle</div><div class="annexe-item-value">${annexeVal(carac.numeroParcelle)}</div></div>`;
    html += '</div><div class="annexe-grid" style="margin-top:6px;">';
    html += `<div class="annexe-item"><div class="annexe-item-label">Zone</div><div class="annexe-item-value">${annexeVal(zoneLabels[carac.zone])}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Niveaux</div><div class="annexe-item-value">${annexeVal(carac.nombreNiveaux)}</div></div>`;
  }
  html += '</div>';
  
  // Configuration
  html += '<div class="annexe-grid" style="margin-top:6px;">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Pièces</div><div class="annexe-item-value">${annexeVal(carac.nombrePieces)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Chambres</div><div class="annexe-item-value">${annexeVal(carac.nombreChambres)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Salles de bain</div><div class="annexe-item-value">${annexeVal(carac.nombreSDB)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">WC séparés</div><div class="annexe-item-value">${annexeVal(carac.nombreWC)}</div></div>`;
  html += '</div>';
  
  // Étage (appartement)
  if (isAppartement) {
    const formatEtage = (val: any): string => {
      if (val === undefined || val === '') return '—';
      if (val == 0) return 'RDC';
      if (val == -1) return 'Sous-sol';
      if (val === 'rez-inf') return 'Rez-inférieur';
      if (val === 'rez-sup') return 'Rez-supérieur';
      return val + 'e';
    };
    let etageText = formatEtage(carac.etage);
    if (carac.etageHaut) etageText += ' au ' + formatEtage(carac.etageHaut);
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += `<div class="annexe-item"><div class="annexe-item-label">Étage</div><div class="annexe-item-value">${etageText}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Étages immeuble</div><div class="annexe-item-value">${annexeVal(carac.nombreEtagesImmeuble)}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Ascenseur</div><div class="annexe-item-value">${carac.ascenseur === true ? 'Oui' : (carac.ascenseur === false ? 'Non' : '—')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Dernier étage</div><div class="annexe-item-value">${carac.dernierEtage ? 'Oui' : 'Non'}</div></div>`;
    html += '</div>';
  }
  
  // Exposition et vue
  const expositionText = (carac.exposition || []).length > 0 ? carac.exposition.join(', ') : '—';
  html += '<div class="annexe-grid-2" style="margin-top:6px;">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Exposition</div><div class="annexe-item-value">${expositionText}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Vue</div><div class="annexe-item-value">${annexeVal(carac.vue)}</div></div>`;
  html += '</div>';
  
  html += '</div>'; // fin section caractéristiques
  
  // === SECTION ÉNERGIE & CHARGES ===
  html += '<div class="annexe-section">';
  html += `<div class="annexe-title">${ico('zap', 12, '#FF4539')} Énergie & Charges</div>`;
  html += '<div class="annexe-grid">';
  html += `<div class="annexe-item"><div class="annexe-item-label">CECB</div><div class="annexe-item-value">${annexeVal(carac.cecb)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Vitrage</div><div class="annexe-item-value">${annexeVal(carac.vitrage)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Chauffage</div><div class="annexe-item-value">${annexeVal(carac.chauffage)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Charges mensuelles</div><div class="annexe-item-value">${annexeVal(carac.chargesMensuelles, ' CHF')}</div></div>`;
  html += '</div>';
  // Diffusion chaleur
  const diffusionArr = isAppartement ? (carac.diffusion || []) : (carac.diffusionMaison || []);
  if (diffusionArr.length > 0) {
    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Diffusion : </span>';
    diffusionArr.forEach((d: string) => { html += `<span class="annexe-chip">${d}</span> `; });
    html += '</div>';
  }
  html += '</div>';
  
  // === SECTION ANNEXES & STATIONNEMENT ===
  html += '<div class="annexe-section">';
  html += `<div class="annexe-title">${ico('car', 12, '#FF4539')} Annexes & Stationnement</div>`;
  html += '<div class="annexe-grid">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Parking intérieur</div><div class="annexe-item-value">${annexeVal(carac.parkingInterieur)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Parking extérieur</div><div class="annexe-item-value">${annexeVal(carac.parkingExterieur)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Place couverte</div><div class="annexe-item-value">${annexeVal(carac.parkingCouverte)}</div></div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Box</div><div class="annexe-item-value">${annexeVal(carac.box)}</div></div>`;
  html += '</div>';
  
  if (isAppartement) {
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += `<div class="annexe-item"><div class="annexe-item-label">Cave</div><div class="annexe-item-value">${carac.cave === true ? 'Oui' : (carac.cave === false ? 'Non' : '—')}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Buanderie</div><div class="annexe-item-value">${annexeVal(buanderieLabels[carac.buanderie])}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Piscine</div><div class="annexe-item-value">${carac.piscine ? 'Oui' : 'Non'}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Autres</div><div class="annexe-item-value">${annexeVal(carac.autresAnnexes)}</div></div>`;
    html += '</div>';
  }
  
  // Espaces maison
  if (isMaison && (carac.espacesMaison || []).length > 0) {
    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Espaces : </span>';
    carac.espacesMaison.forEach((e: string) => { 
      html += `<span class="annexe-chip">${espaceLabels[e] || e}</span> `; 
    });
    html += '</div>';
  }
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += `<div class="footer-ref">Page ${pageNum}/${totalPages} • Annexe Technique (1/2)</div>`;
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // fin page
  
  return html;
}

// ==================== PAGE 8: ANNEXE TECHNIQUE (2/2) ====================
function generateAnnexeTechnique2Page(estimation: EstimationData, pageNum: number = 8, totalPages: number = 9): string {
  const identification = estimation.identification as any || {};
  const historique = identification.historique || {};
  const analyse = (estimation as any).analyseTerrain || (estimation as any).analyse_terrain || {};
  
  // Helper pour dots d'état
  const renderEtatDots = (value: any): string => {
    const etatMapping: Record<string, number> = { 'neuf': 4, 'bon': 3, 'rafraichir': 2, 'refaire': 1 };
    const numValue = typeof value === 'string' ? (etatMapping[value] || 0) : (value || 0);
    let dots = '';
    for (let i = 1; i <= 5; i++) {
      dots += `<div class="etat-dot${i <= numValue ? ' filled' : ''}"></div>`;
    }
    return `<div class="etat-dots">${dots}</div>`;
  };
  
  // Fonction pour retirer les emojis
  const cleanEmoji = (str: string): string => {
    if (!str) return str;
    const idx = str.indexOf(' ');
    if (idx > 0 && idx <= 6) {
      return str.substring(idx + 1);
    }
    return str;
  };
  
  // Labels nuisances
  const nuisanceLabels: Record<string, string> = {
    'bruit_route': 'Bruit route', 'bruit_train': 'Bruit train', 'bruit_avion': 'Bruit avion',
    'bruit_voisins': 'Bruit voisins', 'vis_a_vis': 'Vis-à-vis', 'odeurs': 'Odeurs',
    'antenne': 'Antenne/Pylône', 'ligne_ht': 'Ligne HT', 'zone_inondable': 'Zone inondable',
    'servitude': 'Servitude', 'chantier': 'Chantier proche', 'autre': 'Autre'
  };
  
  // Helper pour valeur ou tiret
  const annexeVal = (v: any): string => {
    if (v === undefined || v === null || v === '') return '—';
    return v.toString();
  };
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
  html += '<div class="header-date">Annexe Technique (2/2)</div>';
  html += '</div>';
  
  // Styles dots
  html += '<style>';
  html += '.etat-dots { display: flex; gap: 3px; align-items: center; }';
  html += '.etat-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; }';
  html += '.etat-dot.filled { background: #1a2e35; }';
  html += '</style>';
  
  // === SECTION ÉTAT DU BIEN ===
  html += '<div class="annexe-section">';
  html += `<div class="annexe-title">${ico('eye', 12, '#FF4539')} État du bien (observation visite)</div>`;
  html += '<div class="annexe-grid-3">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Cuisine</div>${renderEtatDots(analyse.etatCuisine)}</div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Salles d'eau</div>${renderEtatDots(analyse.etatSDB)}</div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Sols</div>${renderEtatDots(analyse.etatSols)}</div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Murs/Peintures</div>${renderEtatDots(analyse.etatMurs)}</div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Menuiseries</div>${renderEtatDots(analyse.etatMenuiseries)}</div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Électricité</div>${renderEtatDots(analyse.etatElectricite)}</div>`;
  html += '</div>';
  html += '<div class="annexe-grid-3" style="margin-top:6px;">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Luminosité</div>${renderEtatDots(analyse.luminosite)}</div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Calme</div>${renderEtatDots(analyse.calme)}</div>`;
  html += `<div class="annexe-item"><div class="annexe-item-label">Volumes</div>${renderEtatDots(analyse.volumes)}</div>`;
  html += '</div>';
  html += '<div class="annexe-grid-3" style="margin-top:6px;">';
  html += `<div class="annexe-item"><div class="annexe-item-label">Impression générale</div>${renderEtatDots(analyse.impressionGenerale)}</div>`;
  html += '</div>';
  html += '</div>';
  
  // === SECTION POINTS FORTS / FAIBLES ===
  const pf = analyse.pointsForts || [];
  const pfaibles = analyse.pointsFaibles || [];
  
  if (pf.length > 0 || pfaibles.length > 0) {
    html += '<div class="annexe-section">';
    html += `<div class="annexe-title">${ico('list', 12, '#FF4539')} Points forts & faibles</div>`;
    if (pf.length > 0) {
      html += '<div style="margin-bottom:6px;"><span style="font-size:8px;color:#065f46;font-weight:600;">POINTS FORTS : </span>';
      pf.forEach((p: string) => { html += `<span class="annexe-chip positive">${cleanEmoji(p)}</span> `; });
      html += '</div>';
    }
    if (pfaibles.length > 0) {
      html += '<div><span style="font-size:8px;color:#991b1b;font-weight:600;">POINTS FAIBLES : </span>';
      pfaibles.forEach((p: string) => { html += `<span class="annexe-chip negative">${cleanEmoji(p)}</span> `; });
      html += '</div>';
    }
    html += '</div>';
  }
  
  // === SECTION NUISANCES ===
  const nuisances = analyse.nuisances || [];
  if (nuisances.length > 0) {
    html += '<div class="annexe-section">';
    html += `<div class="annexe-title">${ico('alertTriangle', 12, '#FF4539')} Nuisances identifiées</div>`;
    html += '<div class="annexe-row">';
    nuisances.forEach((n: string) => { html += `<span class="annexe-chip negative">${nuisanceLabels[n] || n}</span> `; });
    html += '</div></div>';
  }
  
  // === SECTION OBJECTIONS ACHETEURS ===
  if (analyse.objectionsAcheteurs) {
    html += '<div class="annexe-section">';
    html += `<div class="annexe-title">${ico('alertTriangle', 12, '#FF4539')} Objections acheteurs anticipées</div>`;
    html += `<div style="font-size:9px;color:#4b5563;line-height:1.4;">${analyse.objectionsAcheteurs}</div>`;
    html += '</div>';
  }
  
  // === SECTION HISTORIQUE DIFFUSION ===
  if (historique.dejaDiffuse) {
    html += '<div class="annexe-section">';
    html += `<div class="annexe-title">${ico('clock', 12, '#FF4539')} Historique de diffusion</div>`;
    const dureeLabels: Record<string, string> = {'moins1mois': '< 1 mois', '1-3mois': '1-3 mois', '3-6mois': '3-6 mois', '6-12mois': '6-12 mois', 'plus12mois': '> 12 mois'};
    const typeDiffLabels: Record<string, string> = {'discrete': 'Discrète', 'moderee': 'Modérée', 'massive': 'Massive'};
    html += '<div class="annexe-grid">';
    html += `<div class="annexe-item"><div class="annexe-item-label">Durée</div><div class="annexe-item-value">${annexeVal(dureeLabels[historique.duree])}</div></div>`;
    html += `<div class="annexe-item"><div class="annexe-item-label">Type diffusion</div><div class="annexe-item-value">${annexeVal(typeDiffLabels[historique.typeDiffusion])}</div></div>`;
    html += '</div>';
    // Portails utilisés
    const portailsUtilises = historique.portails || [];
    if (portailsUtilises.length > 0) {
      const portailsLbl: Record<string, string> = {'immoscout': 'Immoscout', 'homegate': 'Homegate', 'acheterlouer': 'Acheter-Louer', 'anibis': 'Anibis', 'immostreet': 'ImmoStreet', 'autres': 'Autres'};
      html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Portails utilisés : </span>';
      portailsUtilises.forEach((p: string) => { html += `<span class="annexe-chip">${portailsLbl[p] || p}</span> `; });
      html += '</div>';
    }
    // Raisons échec
    const raisonsEchec = historique.raisonEchec || [];
    if (raisonsEchec.length > 0) {
      const raisonLbl: Record<string, string> = {'prix': 'Prix trop élevé', 'photos': 'Mauvaises photos', 'timing': 'Mauvais timing', 'etatbien': 'État du bien', 'vendeur': 'Vendeur pas prêt', 'agence': 'Mauvais suivi agence', 'marche': 'Marché difficile', 'autre': 'Autre'};
      html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#991b1b;">Raisons échec perçues : </span>';
      raisonsEchec.forEach((r: string) => { html += `<span class="annexe-chip negative">${raisonLbl[r] || r}</span> `; });
      html += '</div>';
    }
    html += '</div>';
  }
  
  // Footer
  html += '<div class="footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += `<div class="footer-ref">Page ${pageNum}/${totalPages} • Annexe Technique (2/2)</div>`;
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // fin page
  
  return html;
}

// ==================== PAGE 9 : CARTE ====================
// Helpers pour parser les distances/temps
function parseDistance(distStr: string | undefined): number {
  if (!distStr) return 0;
  const str = String(distStr).toLowerCase();
  const numMatch = str.match(/[\d.]+/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[0]);
  if (str.includes('km')) return num * 1000;
  return num;
}

function parseTemps(tempsStr: string | undefined): number {
  if (!tempsStr) return 0;
  const numMatch = String(tempsStr).match(/\d+/);
  return numMatch ? parseInt(numMatch[0]) : 0;
}

// Variable globale pour stocker l'image Google Maps pré-chargée
let cachedGoogleMapImage: string | null = null;

export function setCachedGoogleMapImage(imageData: string | null) {
  cachedGoogleMapImage = imageData;
}

export function getCachedGoogleMapImage(): string | null {
  return cachedGoogleMapImage;
}

// ==================== GÉNÉRATION PAGES PHOTOS ====================
function generatePhotosPages(estimation: EstimationData): string {
  const photos = (estimation.photos as any) || {};
  const photoItems = photos.items || [];
  
  if (photoItems.length === 0) return '';
  
  const photosCount = photoItems.length;
  const photoPagesCount = Math.ceil(photosCount / 9);
  const dateNow = new Date();
  const dateStr = dateNow.toLocaleDateString('fr-CH');
  
  let html = '';
  
  // Style spécifique pour les grilles photos
  html += '<style>';
  html += '.photos-grid-pdf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 16px 24px; flex: 1; }';
  html += '.photo-cell { aspect-ratio: 1; overflow: hidden; border-radius: 6px; background: #f3f4f6; }';
  html += '.photo-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }';
  html += '</style>';
  
  // Générer les pages photos (9 photos par page)
  for (let pagePhotoIdx = 0; pagePhotoIdx < photoPagesCount; pagePhotoIdx++) {
    const startIdx = pagePhotoIdx * 9;
    const endIdx = Math.min(startIdx + 9, photosCount);
    const pagePhotos = photoItems.slice(startIdx, endIdx);
    
    html += '<div class="page" style="page-break-before:always;">';
    
    // Header
    html += '<div class="header">';
    html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
    html += `<div class="header-date">Annexe photos${photoPagesCount > 1 ? ` (${pagePhotoIdx + 1}/${photoPagesCount})` : ''}</div>`;
    html += '</div>';
    
    // Grille de photos
    html += '<div class="photos-grid-pdf">';
    pagePhotos.forEach((photo: any) => {
      const photoUrl = photo.storageUrl || photo.dataUrl || '';
      html += '<div class="photo-cell">';
      if (photoUrl) {
        html += `<img src="${photoUrl}" alt="${photo.titre || photo.nom || 'Photo'}" />`;
      } else {
        html += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px;">Photo non disponible</div>';
      }
      html += '</div>';
    });
    
    // Remplir les cellules vides pour garder la grille alignée
    const emptyCells = 9 - pagePhotos.length;
    for (let ec = 0; ec < emptyCells; ec++) {
      html += '<div class="photo-cell" style="background:#f8fafc;"></div>';
    }
    html += '</div>';
    
    // Footer
    html += '<div class="footer">';
    html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
    html += `<div class="footer-ref">Annexe photos${photoPagesCount > 1 ? ` (${pagePhotoIdx + 1}/${photoPagesCount})` : ''}</div>`;
    html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
    html += '</div>';
    
    html += '</div>'; // page photo
  }
  
  return html;
}

function generateMapPage(estimation: EstimationData): string {
  const identification = (estimation.identification as any) || {};
  const adresse = identification.adresse || {};
  const mapState = adresse.mapState || {};
  const coordinates = adresse.coordinates || {};
  const proximites = identification.proximites || [];
  
  // Récupérer lat/lng depuis coordinates ou mapState
  const mapLat = coordinates.lat || mapState.center?.lat;
  const mapLng = coordinates.lng || mapState.center?.lng;
  
  if (!mapLat || !mapLng) return '';
  
  const mapZoom = mapState.zoom || 18;
  const mapType = mapState.mapType || 'hybrid';
  const swissZoom = 19;
  const swissLat = mapLat;
  const swissLng = mapLng;
  
  // Calcul BBOX pour Swisstopo (format 4:3)
  const metersPerPx = 156543.03392 * Math.cos(swissLat * Math.PI / 180) / Math.pow(2, swissZoom);
  const widthDeg = (600 * metersPerPx) / 111320;
  const heightDeg = (450 * metersPerPx) / 110540;
  const bboxMinLat = swissLat - heightDeg / 2;
  const bboxMaxLat = swissLat + heightDeg / 2;
  const bboxMinLng = swissLng - widthDeg / 2;
  const bboxMaxLng = swissLng + widthDeg / 2;
  
  // URL Swisstopo
  const swisstopoUrl = `https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=false&LAYERS=ch.swisstopo.landeskarte-farbe-10,ch.kantone.cadastralwebmap-farbe&CRS=EPSG:4326&STYLES=&WIDTH=600&HEIGHT=450&BBOX=${bboxMinLat},${bboxMinLng},${bboxMaxLat},${bboxMaxLng}`;
  
  // Récupérer les données transports depuis proximites
  const busProx = proximites.find((p: any) => p.type === 'transport_bus');
  const trainProx = proximites.find((p: any) => p.type === 'transport_tram' || p.type === 'transport_train');
  
  // Construire objets arret et gare
  const arret = busProx?.libelle ? {
    nom: busProx.libelle,
    distance: parseDistance(busProx.distance),
    tempsMarche: parseTemps(busProx.tempsMarche)
  } : null;
  
  const gare = trainProx?.libelle ? {
    nom: trainProx.libelle,
    distance: parseDistance(trainProx.distance),
    temps: parseTemps(trainProx.tempsMarche),
    mode: String(trainProx.tempsMarche || '').includes('voiture') ? 'voiture' : 'pied'
  } : null;
  
  // Icônes SVG spéciales pour la carte
  const iconGlobe = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  const iconGrid = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>';
  const iconBus = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2e35" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/><path d="M5 4V2M19 4V2"/></svg>';
  const iconTrain = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2e35" stroke-width="1.5"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><path d="M8 19l-2 2M16 19l2 2"/></svg>';
  const iconClock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FA4538" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
  const iconPin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FA4538" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  
  const dateNow = new Date();
  const dateStr = dateNow.toLocaleDateString('fr-CH');
  
  // Récupérer l'image Google Maps depuis le cache (pré-chargée via static-map-proxy)
  const googleMapImage = cachedGoogleMapImage;
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox')}</div>`;
  html += `<div class="header-date">${dateStr}</div>`;
  html += '</div>';
  
  // Titre
  html += '<div style="padding:12px 24px 8px;">';
  html += `<h2 style="font-size:16px;font-weight:700;color:#1a2e35;margin:0 0 3px;display:flex;align-items:center;gap:6px;">${iconPin} Localisation du bien</h2>`;
  html += `<p style="font-size:10px;color:#64748b;margin:0;">${val(adresse.rue)} ${val(adresse.numero)}, ${val(adresse.codePostal)} ${val(adresse.localite)}</p>`;
  html += '</div>';
  
  // Cartes en vertical
  html += '<div style="padding:0 24px;display:flex;flex-direction:column;gap:8px;">';
  
  // Carte Google Maps
  html += '<div style="background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #e2e8f0;max-width:450px;margin:0 auto;">';
  html += `<div style="font-size:9px;font-weight:600;color:#64748b;margin-bottom:6px;display:flex;align-items:center;gap:6px;">${iconGlobe} Vue satellite</div>`;
  html += '<div style="width:100%;aspect-ratio:1/1;border-radius:6px;overflow:hidden;background:#e2e8f0;">';
  if (googleMapImage) {
    html += `<img src="${googleMapImage}" style="width:100%;height:100%;object-fit:cover;display:block;" />`;
  } else {
    html += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px;">Image satellite non disponible</div>';
  }
  html += '</div>';
  html += '</div>';
  
  // Carte Swisstopo
  html += '<div style="background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #e2e8f0;max-width:450px;margin:0 auto;">';
  html += `<div style="font-size:9px;font-weight:600;color:#64748b;margin-bottom:6px;display:flex;align-items:center;gap:6px;">${iconGrid} Plan cadastral officiel</div>`;
  html += '<div style="width:100%;aspect-ratio:1/1;border-radius:6px;overflow:hidden;">';
  html += `<img src="${swisstopoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`;
  html += '</div>';
  html += '</div>';
  
  html += '</div>'; // fin cartes
  
  // Section Transports
  if (arret || gare) {
    html += '<div style="padding:10px 24px 70px;margin-top:6px;">';
    html += `<div style="font-size:9px;font-weight:700;color:#FA4538;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;display:flex;align-items:center;gap:6px;">${iconClock} Transports à proximité</div>`;
    
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    
    // Arrêt bus/tram
    if (arret) {
      const arretDistance = arret.distance >= 1000 ? (arret.distance / 1000).toFixed(1) + ' km' : arret.distance + ' m';
      html += '<div style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;border-radius:6px;padding:10px;display:flex;align-items:flex-start;gap:8px;">';
      html += `<div style="width:28px;height:28px;background:white;border-radius:6px;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;flex-shrink:0;">${iconBus}</div>`;
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:7px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Arrêt bus / tram</div>';
      html += `<div style="font-size:10px;font-weight:600;color:#1a2e35;margin-bottom:3px;line-height:1.2;">${arret.nom}</div>`;
      html += `<div style="font-size:9px;color:#64748b;display:flex;align-items:center;gap:4px;">${arretDistance} <span style="background:#FA4538;color:white;padding:1px 5px;border-radius:8px;font-size:8px;font-weight:600;">~${arret.tempsMarche} min à pied</span></div>`;
      html += '</div>';
      html += '</div>';
    } else {
      html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;color:#94a3b8;font-size:9px;">Aucun arrêt à proximité</div>';
    }
    
    // Gare
    if (gare) {
      const gareDistance = gare.distance >= 1000 ? (gare.distance / 1000).toFixed(1) + ' km' : gare.distance + ' m';
      const gareTemps = gare.temps;
      const gareMode = gare.mode === 'voiture' ? 'en voiture' : 'à pied';
      html += '<div style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;border-radius:6px;padding:10px;display:flex;align-items:flex-start;gap:8px;">';
      html += `<div style="width:28px;height:28px;background:white;border-radius:6px;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;flex-shrink:0;">${iconTrain}</div>`;
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:7px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Gare ferroviaire</div>';
      html += `<div style="font-size:10px;font-weight:600;color:#1a2e35;margin-bottom:3px;line-height:1.2;">${gare.nom}</div>`;
      html += `<div style="font-size:9px;color:#64748b;display:flex;align-items:center;gap:4px;">${gareDistance} <span style="background:#FA4538;color:white;padding:1px 5px;border-radius:8px;font-size:8px;font-weight:600;">~${gareTemps} min ${gareMode}</span></div>`;
      html += '</div>';
      html += '</div>';
    } else {
      html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;color:#94a3b8;font-size:9px;">Aucune gare à proximité</div>';
    }
    
    html += '</div>'; // fin grid
    html += '</div>'; // fin section transports
  }
  
  // Footer
  html += '<div class="footer">';
  html += `<div>${logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox')}</div>`;
  html += '<div class="footer-ref">Annexe cartographie</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>'; // fin page
  
  return html;
}

// ==================== GÉNÉRATION HTML COMPLÈTE ====================
export interface PDFGeneratorOptions {
  inclurePhotos?: boolean;
  inclureCarte?: boolean;
  onProgress?: (message: string, percent: number) => void;
}

// Fonction pour pré-charger l'image Google Maps via le proxy
async function preloadGoogleMapImage(lat: number, lng: number, zoom: number, mapType: string): Promise<string | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('static-map-proxy', {
      body: {
        type: 'google',
        lat,
        lng,
        zoom: Math.min(zoom, 20),
        mapType,
        markerLat: lat,
        markerLng: lng
      }
    });
    
    if (error) {
      console.error('[PDF] Erreur static-map-proxy:', error);
      return null;
    }
    
    if (data?.image) {
      return data.image;
    }
    
    return null;
  } catch (err) {
    console.error('[PDF] Exception lors du chargement Google Maps:', err);
    return null;
  }
}

export async function generatePDFHtml(
  estimation: EstimationData,
  options: PDFGeneratorOptions = {}
): Promise<void> {
  const { onProgress } = options;
  
  onProgress?.('Génération de la couverture...', 10);
  
  const vendeur = (estimation.identification as any)?.vendeur || {};
  
  // Pré-charger l'image Google Maps si des coordonnées sont disponibles
  const adresseCheck = (estimation.identification as any)?.adresse || {};
  const coordsCheck = adresseCheck.coordinates || {};
  const mapStateCheck = adresseCheck.mapState || {};
  
  // Vérifier les données pour calcul dynamique du nombre de pages
  const photosData = (estimation.photos as any) || {};
  const photoItems = photosData.items || [];
  const hasPhotos = photoItems.length > 0;
  const photoPagesCount = hasPhotos ? Math.ceil(photoItems.length / 9) : 0;
  const hasMap = coordsCheck.lat && coordsCheck.lng;
  
  // Calcul dynamique du nombre total de pages
  // Pages fixes: Couverture(1) + GARY(2) + Caractéristiques(3) + Trajectoires(4) + PlanAction(5) + Méthodologie(6) + AnnexeTech1(7) + AnnexeTech2(8)
  let totalPages = 8;
  if (hasMap) totalPages += 1; // Page carte
  totalPages += photoPagesCount; // Pages photos
  
  if (hasMap) {
    onProgress?.('Chargement de la carte satellite...', 15);
    const mapZoom = mapStateCheck.zoom || 18;
    const mapType = mapStateCheck.mapType || 'hybrid';
    const googleMapImage = await preloadGoogleMapImage(coordsCheck.lat, coordsCheck.lng, mapZoom, mapType);
    setCachedGoogleMapImage(googleMapImage);
  } else {
    setCachedGoogleMapImage(null);
  }
  
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
  html += `<title>GARY - Estimation ${val(vendeur.nom)}</title>`;
  html += `<style>${getStyles()}</style>`;
  html += '</head><body>';
  
  // Page 1: Couverture
  html += generateCoverPage(estimation);
  
  // Page 2: Qui est GARY
  onProgress?.('Génération page GARY...', 20);
  html += generateGaryPage(estimation);
  
  // Page 3: Caractéristiques
  onProgress?.('Génération page Caractéristiques...', 30);
  html += generateCaracteristiquesPage(estimation);
  
  // Page 4: Trajectoires de vente
  onProgress?.('Génération page Trajectoires...', 40);
  html += generateTrajectoiresPage(estimation);
  
  // Page 5: Plan d'action
  onProgress?.('Génération page Plan d\'action...', 50);
  html += generatePlanActionPage(estimation);
  
  // Page 6: Méthodologie
  onProgress?.('Génération page Méthodologie...', 55);
  html += generateMethodologiePage(estimation, 6, totalPages);
  
  // Page 7: Annexe Technique 1/2
  onProgress?.('Génération page Annexe Technique 1/2...', 65);
  html += generateAnnexeTechnique1Page(estimation, 7, totalPages);
  
  // Page 8: Annexe Technique 2/2
  onProgress?.('Génération page Annexe Technique 2/2...', 75);
  html += generateAnnexeTechnique2Page(estimation, 8, totalPages);
  
  // Page 9: Carte (conditionnelle)
  if (hasMap) {
    onProgress?.('Génération page Carte...', 80);
    html += generateMapPage(estimation);
  }
  
  // Pages Photos (conditionnelles, 9 photos par page)
  if (hasPhotos) {
    onProgress?.('Génération pages Photos...', 85);
    html += generatePhotosPages(estimation);
  }
  
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
  
  // Nettoyer le cache
  setCachedGoogleMapImage(null);
}
