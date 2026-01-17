/**
 * Page Comparables : Analyse de marché et comparables
 * Génère le HTML pour la section comparables
 */

import { EstimationData } from '@/types/estimation';
import { ico } from '../pdfIcons';
import { getLogo } from '../pdfLogos';
import { formatPrice, val } from '../pdfFormatters';

interface PageComparablesConfig {
  pageNum: number;
  totalPages: number;
  refId: string;
  isAnnexe?: boolean;
}

/**
 * Génère la section comparables (intégrée ou en annexe)
 */
export function generateComparablesSection(
  data: EstimationData,
  totalVenaleArrondi: number,
  isAnnexe: boolean = false
): string {
  const preEstimation = data.preEstimation || {};
  const comparablesVendus = ((preEstimation as any).comparablesVendus || []).slice(0, 6);
  const comparablesEnVente = ((preEstimation as any).comparablesEnVente || []).slice(0, 6);
  const totalComparables = comparablesVendus.length + comparablesEnVente.length;
  
  if (totalComparables === 0) {
    return '';
  }
  
  // Mode annexe si plus de 7 comparables
  const comparablesEnAnnexe = totalComparables > 7 && !isAnnexe;
  
  let html = '<div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:10px;font-weight:700;color:#1a2e35;margin-bottom:12px;display:flex;align-items:center;gap:6px;">' + ico('chart', 14, '#1a2e35') + 'Analyse de marché</div>';
  
  // Préparer les prix pour le graphique
  const allPrices: {prix: number; type: string}[] = [];
  
  comparablesVendus.forEach((c: any) => {
    const prix = parseFloat((c.prix || '').replace(/[^\d]/g, ''));
    if (prix > 0) allPrices.push({prix, type: 'vendu'});
  });
  
  comparablesEnVente.forEach((c: any) => {
    const prix = parseFloat((c.prix || '').replace(/[^\d]/g, ''));
    if (prix > 0) allPrices.push({prix, type: 'envente'});
  });
  
  // Ajouter l'estimation
  if (totalVenaleArrondi > 0) {
    allPrices.push({prix: totalVenaleArrondi, type: 'estimation'});
  }
  
  // Graphique de positionnement
  if (allPrices.length > 1) {
    const minPrix = Math.min(...allPrices.map(p => p.prix));
    const maxPrix = Math.max(...allPrices.map(p => p.prix));
    const range = maxPrix - minPrix || 1;
    
    html += '<div style="background:#f8fafc;border-radius:6px;padding:10px 12px;margin-bottom:8px;">';
    
    if (totalComparables > 7) {
      // Mode heatmap pour beaucoup de comparables
      html += generateHeatmapChart(allPrices, minPrix, maxPrix, range, totalVenaleArrondi);
    } else {
      // Mode points standard
      html += generatePointsChart(allPrices, minPrix, range);
    }
    
    html += '</div>';
  }
  
  // Détails comparables ou message annexe
  if (comparablesEnAnnexe) {
    html += '<div style="background:#f8fafc;border-radius:6px;padding:12px 16px;text-align:center;margin-top:8px;">';
    html += '<div style="font-size:9px;color:#6b7280;">';
    html += 'Détail des ' + totalComparables + ' comparables en annexe';
    html += '</div>';
    html += '</div>';
  } else {
    html += generateComparablesDetails(comparablesVendus, comparablesEnVente);
  }
  
  // Positionnement du bien
  const identification = data.identification as any || {};
  const adresse = identification.adresse || {};
  html += '<div style="margin-top:8px;background:linear-gradient(135deg,#fff5f4 0%,#ffffff 100%);border:1px solid #FF4539;border-radius:6px;padding:8px 10px;text-align:center;">';
  html += '<div style="font-size:7px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Votre bien</div>';
  html += '<div style="font-size:9px;font-weight:600;color:#1a2e35;">' + val(adresse.rue) + (adresse.numero ? ' ' + adresse.numero : '') + '</div>';
  html += '<div style="font-size:12px;font-weight:700;color:#FF4539;margin-top:2px;">' + formatPrice(totalVenaleArrondi) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

function generateHeatmapChart(allPrices: any[], minPrix: number, maxPrix: number, range: number, prixEstimation: number): string {
  let html = '';
  
  html += '<div style="display:flex;justify-content:space-between;font-size:7px;color:#6b7280;margin-bottom:6px;">';
  html += '<span>' + (minPrix / 1000000).toFixed(2) + 'M</span><span>' + (maxPrix / 1000000).toFixed(2) + 'M</span>';
  html += '</div>';
  
  // Créer 10 buckets
  const buckets: {vendus: number; envente: number; total: number}[] = [];
  for (let b = 0; b < 10; b++) {
    buckets.push({ vendus: 0, envente: 0, total: 0 });
  }
  const bucketSize = range / 10;
  
  // Remplir les buckets
  allPrices.forEach((item) => {
    if (item.type === 'estimation') return;
    const bucketIdx = Math.min(9, Math.floor((item.prix - minPrix) / bucketSize));
    buckets[bucketIdx].total++;
    if (item.type === 'vendu') buckets[bucketIdx].vendus++;
    else buckets[bucketIdx].envente++;
  });
  
  const maxVendus = Math.max(...buckets.map(b => b.vendus)) || 1;
  const maxEnVente = Math.max(...buckets.map(b => b.envente)) || 1;
  
  // Position estimation
  const estPos = ((prixEstimation - minPrix) / range) * 100;
  
  html += '<div style="position:relative;">';
  
  // Barre vendus (verte)
  html += '<div style="display:flex;gap:2px;margin-bottom:2px;">';
  buckets.forEach((bucket) => {
    const intensity = bucket.vendus / maxVendus;
    const bgColor = bucket.vendus === 0 ? '#f0fdf4' : 'rgba(16,185,129,' + (0.2 + intensity * 0.6) + ')';
    html += '<div style="flex:1;height:18px;background:' + bgColor + ';border-radius:3px;display:flex;align-items:center;justify-content:center;">';
    if (bucket.vendus > 0) {
      html += '<span style="font-size:7px;color:#065f46;font-weight:600;">' + bucket.vendus + '</span>';
    }
    html += '</div>';
  });
  html += '</div>';
  
  // Barre en vente (grise)
  html += '<div style="display:flex;gap:2px;">';
  buckets.forEach((bucket) => {
    const intensity = bucket.envente / maxEnVente;
    const bgColor = bucket.envente === 0 ? '#f9fafb' : 'rgba(107,114,128,' + (0.15 + intensity * 0.5) + ')';
    html += '<div style="flex:1;height:18px;background:' + bgColor + ';border-radius:3px;display:flex;align-items:center;justify-content:center;">';
    if (bucket.envente > 0) {
      html += '<span style="font-size:7px;color:#374151;font-weight:600;">' + bucket.envente + '</span>';
    }
    html += '</div>';
  });
  html += '</div>';
  
  // Étoile estimation
  html += '<div style="position:absolute;left:' + estPos + '%;top:50%;transform:translate(-50%,-50%);z-index:10;">';
  html += '<div style="width:22px;height:22px;background:#FA4238;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.2);">';
  html += '<span style="color:white;font-size:11px;">★</span>';
  html += '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Légende
  html += '<div style="display:flex;justify-content:center;gap:12px;font-size:7px;margin-top:6px;">';
  html += '<span style="color:#10b981;">✓ Vendus</span>';
  html += '<span style="color:#6b7280;">○ En vente</span>';
  html += '<span style="color:#FA4238;">★ Votre bien</span>';
  html += '</div>';
  
  return html;
}

function generatePointsChart(allPrices: any[], minPrix: number, range: number): string {
  let html = '';
  
  html += '<div style="display:flex;justify-content:space-between;font-size:7px;color:#6b7280;margin-bottom:6px;">';
  html += '<span>Prix bas</span><span>Prix haut</span>';
  html += '</div>';
  
  html += '<div style="position:relative;height:36px;background:linear-gradient(90deg,#e5e7eb 0%,#f3f4f6 100%);border-radius:12px;margin-bottom:6px;">';
  
  allPrices.forEach((item) => {
    const pos = ((item.prix - minPrix) / range) * 85 + 7;
    const color = item.type === 'estimation' ? '#FF4539' : (item.type === 'vendu' ? '#10b981' : '#6b7280');
    const symbol = item.type === 'estimation' ? '★' : (item.type === 'vendu' ? '✓' : '○');
    const size = item.type === 'estimation' ? '12px' : '10px';
    
    html += '<div style="position:absolute;left:' + pos + '%;top:6px;transform:translateX(-50%);text-align:center;">';
    html += '<div style="font-size:' + size + ';color:' + color + ';font-weight:bold;">' + symbol + '</div>';
    html += '<div style="font-size:7px;color:' + color + ';margin-top:1px;white-space:nowrap;">' + (item.prix / 1000000).toFixed(2) + 'M</div>';
    html += '</div>';
  });
  
  html += '</div>';
  
  html += '<div style="display:flex;justify-content:center;gap:12px;font-size:7px;">';
  html += '<span style="color:#10b981;">✓ Vendu</span>';
  html += '<span style="color:#6b7280;">○ En vente</span>';
  html += '<span style="color:#FF4539;">★ Votre bien</span>';
  html += '</div>';
  
  return html;
}

function generateComparablesDetails(comparablesVendus: any[], comparablesEnVente: any[]): string {
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
  
  // Colonne vendus
  if (comparablesVendus.length > 0) {
    html += '<div>';
    html += '<div style="font-size:8px;font-weight:600;color:#10b981;margin-bottom:6px;display:flex;align-items:center;gap:3px;">✓ Transactions récentes</div>';
    comparablesVendus.forEach((c: any) => {
      const garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;background:#FA4238;color:white;border-radius:50%;font-size:8px;font-weight:700;margin-left:4px;">G</span>' : '';
      const typeMaisonLabels: Record<string, string> = {
        'individuelle': 'Maison individuelle',
        'jumelee': 'Maison jumelée',
        'mitoyenne': 'Maison mitoyenne',
        'contigue': 'Maison contiguë'
      };
      const typeMaisonLabel = typeMaisonLabels[c.typeMaison] || '';
      
      html += '<div style="background:' + (c.isGary ? '#fff5f4' : '#f0fdf4') + ';border-radius:4px;padding:6px 8px;margin-bottom:4px;border-left:2px solid ' + (c.isGary ? '#FA4238' : '#10b981') + ';">';
      html += '<div style="font-size:8px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">' + (c.adresse || '-') + garyBadge + '</div>';
      html += '<div style="font-size:9px;color:' + (c.isGary ? '#FA4238' : '#10b981') + ';font-weight:600;">' + formatComparablePrix(c.prix) + '</div>';
      
      const details: string[] = [];
      if (c.surface) details.push(c.surface);
      if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
      if (typeMaisonLabel) details.push(typeMaisonLabel);
      if (c.dateVente) details.push(c.dateVente);
      if (c.commentaire) details.push(c.commentaire);
      
      if (details.length > 0) {
        html += '<div style="font-size:7px;color:#6b7280;margin-top:1px;">' + details.join(' • ') + '</div>';
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
      const typeMaisonLabels: Record<string, string> = {
        'individuelle': 'Maison individuelle',
        'jumelee': 'Maison jumelée',
        'mitoyenne': 'Maison mitoyenne',
        'contigue': 'Maison contiguë'
      };
      const typeMaisonLabel = typeMaisonLabels[c.typeMaison] || '';
      
      html += '<div style="background:' + (c.isGary ? '#fff5f4' : '#f9fafb') + ';border-radius:4px;padding:6px 8px;margin-bottom:4px;border-left:2px solid ' + (c.isGary ? '#FA4238' : '#9ca3af') + ';">';
      html += '<div style="font-size:8px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">' + (c.adresse || '-') + garyBadge + '</div>';
      html += '<div style="font-size:9px;color:' + (c.isGary ? '#FA4238' : '#6b7280') + ';font-weight:600;">' + formatComparablePrix(c.prix) + '</div>';
      
      const details: string[] = [];
      if (c.surface) details.push(c.surface);
      if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
      if (typeMaisonLabel) details.push(typeMaisonLabel);
      if (c.dureeEnVente) details.push('Depuis ' + c.dureeEnVente);
      if (c.commentaire) details.push(c.commentaire);
      
      if (details.length > 0) {
        html += '<div style="font-size:7px;color:#6b7280;margin-top:1px;">' + details.join(' • ') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

function formatComparablePrix(prixStr: string): string {
  const p = parseFloat((prixStr || '').replace(/[^\d]/g, ''));
  if (p > 0) return formatPrice(p);
  return prixStr || '-';
}

/**
 * Génère la page annexe comparables complète
 */
export function generateComparablesAnnexePage(
  data: EstimationData,
  config: PageComparablesConfig
): string {
  const preEstimation = data.preEstimation || {};
  const comparablesVendus = (preEstimation as any).comparablesVendus || [];
  const comparablesEnVente = (preEstimation as any).comparablesEnVente || [];
  const totalComparables = comparablesVendus.length + comparablesEnVente.length;
  
  if (totalComparables <= 7) {
    return '';
  }
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + getLogo('white', 28) + '</div>';
  html += '<div class="header-date">Annexe Comparables</div>';
  html += '</div>';
  
  html += '<div style="padding:16px 24px;">';
  html += '<div style="font-size:12px;font-weight:700;color:#1a2e35;margin-bottom:16px;">Détail des ' + totalComparables + ' comparables de marché</div>';
  
  // Section Vendus
  if (comparablesVendus.length > 0) {
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:10px;font-weight:600;color:#10b981;margin-bottom:8px;display:flex;align-items:center;gap:4px;">✓ Transactions récentes (' + comparablesVendus.length + ')</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
    comparablesVendus.forEach((c: any) => {
      html += generateComparableCard(c, 'vendu');
    });
    html += '</div>';
    html += '</div>';
  }
  
  // Section En vente
  if (comparablesEnVente.length > 0) {
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:8px;display:flex;align-items:center;gap:4px;">○ Actuellement en vente (' + comparablesEnVente.length + ')</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
    comparablesEnVente.forEach((c: any) => {
      html += generateComparableCard(c, 'envente');
    });
    html += '</div>';
    html += '</div>';
  }
  
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + getLogo('white', 18) + '</div>';
  html += '<div class="footer-ref">Page ' + config.pageNum + '/' + config.totalPages + ' • Annexe Comparables</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

function generateComparableCard(c: any, type: 'vendu' | 'envente'): string {
  const garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;background:#FA4238;color:white;border-radius:50%;font-size:7px;font-weight:700;margin-left:3px;">G</span>' : '';
  const typeMaisonLabels: Record<string, string> = {
    'individuelle': 'Maison individuelle',
    'jumelee': 'Maison jumelée',
    'mitoyenne': 'Maison mitoyenne',
    'contigue': 'Maison contiguë'
  };
  const typeMaisonLabel = typeMaisonLabels[c.typeMaison] || '';
  
  const bgColor = c.isGary ? '#fff5f4' : (type === 'vendu' ? '#f0fdf4' : '#f9fafb');
  const borderColor = c.isGary ? '#FA4238' : (type === 'vendu' ? '#10b981' : '#9ca3af');
  const priceColor = c.isGary ? '#FA4238' : (type === 'vendu' ? '#10b981' : '#6b7280');
  
  let html = '<div style="background:' + bgColor + ';border-radius:4px;padding:5px 7px;border-left:2px solid ' + borderColor + ';">';
  html += '<div style="font-size:7px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">' + (c.adresse || '-') + garyBadge + '</div>';
  html += '<div style="font-size:8px;color:' + priceColor + ';font-weight:600;">' + formatComparablePrix(c.prix) + '</div>';
  
  const details: string[] = [];
  if (c.surface) details.push(c.surface);
  if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
  if (typeMaisonLabel) details.push(typeMaisonLabel);
  if (type === 'vendu' && c.dateVente) details.push(c.dateVente);
  if (type === 'envente' && c.dureeEnVente) details.push('Depuis ' + c.dureeEnVente);
  if (c.commentaire) details.push(c.commentaire);
  
  if (details.length > 0) {
    html += '<div style="font-size:6px;color:#6b7280;margin-top:1px;">' + details.join(' • ') + '</div>';
  }
  
  html += '</div>';
  
  return html;
}
