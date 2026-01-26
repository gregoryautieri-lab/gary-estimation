/**
 * Page 2 : Caractéristiques du bien
 * Génère le HTML pour la page des caractéristiques détaillées
 */

import { EstimationData } from '@/types/estimation';
import { ico } from '../pdfIcons';
import { getLogo } from '../pdfLogos';
import { val, formatPrice } from '../pdfFormatters';
import { calculateSurfaces, calculateValeurs } from '../pdfCalculs';

interface PageCaracteristiquesConfig {
  pageNum: number;
  totalPages: number;
  refId: string;
}

/**
 * Génère la page des caractéristiques du bien
 */
export function generateCaracteristiquesPage(
  data: EstimationData,
  config: PageCaracteristiquesConfig
): string {
  const identification = data.identification || {};
  const caracteristiques = data.caracteristiques || {};
  const analyseTerrain = data.analyseTerrain || {};
  const preEstimation = data.preEstimation || {};
  
  const carac = caracteristiques as any;
  const analyse = analyseTerrain as any;
  
  const isAppartement = data.typeBien === 'appartement';
  const isMaison = data.typeBien === 'maison';
  
  // Calculs surfaces
  const surfaces = calculateSurfaces(carac, preEstimation, isAppartement);
  const valeurs = calculateValeurs(surfaces, carac, preEstimation, isAppartement);
  
  // Labels chauffage et diffusion
  const chaufLabels: Record<string, string> = {
    pac: 'PAC', gaz: 'Gaz', mazout: 'Mazout', pellets: 'Pellets',
    electrique: 'Électrique', cad: 'CAD', geothermie: 'Géothermie', autre: 'Autre'
  };
  const diffMap: Record<string, string> = {
    sol: 'Au sol', radiateur: 'Radiateurs', convecteur: 'Convecteurs',
    poele: 'Poêle', cheminee: 'Cheminée', plafond: 'Plafond'
  };
  
  // Vue
  const vueLabels: Record<string, string> = {
    lac: 'Lac', montagne: 'Montagne', ville: 'Ville', campagne: 'Campagne',
    jardin: 'Jardin', parc: 'Parc', degagee: 'Dégagée', vis_a_vis: 'Vis-à-vis'
  };
  const vueStr = carac.vue || '';
  const vueDisplay = vueStr ? (vueLabels[vueStr] || vueStr) : '—';
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + getLogo('white', 28) + '</div>';
  html += '<div class="header-date">Caractéristiques</div>';
  html += '</div>';
  
  // Titre section
  html += '<div style="padding:16px 24px 8px;">';
  html += '<div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;display:flex;align-items:center;gap:6px;">' + ico('home', 12, '#9ca3af') + 'Détail du bien</div>';
  html += '</div>';
  
  // Grilles caractéristiques selon type
  html += '<div style="padding:0 24px;">';
  
  if (isAppartement) {
    html += generateAppartementGrid(carac, surfaces, vueDisplay, chaufLabels, diffMap);
  } else if (isMaison) {
    html += generateMaisonGrid(carac, surfaces, vueDisplay, chaufLabels, diffMap, preEstimation);
  }
  
  html += '</div>';
  
  // Section Rénovations & Travaux
  html += generateRenovationsSection(carac);
  
  // État du bien
  html += generateEtatSection(analyse);
  
  // Proximités
  html += generateProximitesSection(identification);
  
  // Arguments de vente
  html += generateArgumentsSection(analyse);
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + getLogo('white', 18) + '</div>';
  html += '<div class="footer-ref">Page ' + config.pageNum + '/' + config.totalPages + ' • Réf: ' + config.refId + '</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

function generateAppartementGrid(carac: any, surfaces: any, vueDisplay: string, chaufLabels: Record<string, string>, diffMap: Record<string, string>): string {
  let html = '';
  
  // Ligne 1 - Surfaces
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
  html += '<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:10px;border-left:3px solid #FF4539;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface PPE</div><div style="font-size:15px;font-weight:700;color:#FF4539;">' + surfaces.surfacePPE.toFixed(0) + ' m²</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface non hab.</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceNonHabitable || '—') + ' m²</div></div>';
  html += '<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:10px;border-left:3px solid #111827;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surf. pondérée</div><div style="font-size:15px;font-weight:700;color:#111827;">' + surfaces.surfacePonderee.toFixed(0) + ' m²</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Pièces</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.nombrePieces || '—') + '</div></div>';
  html += '</div>';
  
  // Ligne 2 - Extérieurs
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Balcon</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceBalcon || '—') + ' m²</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Terrasse</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceTerrasse || '—') + ' m²</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Jardin</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceJardin || '—') + ' m²</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Loggia</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceLoggia || '—') + ' m²</div></div>';
  html += '</div>';
  
  // Ligne 3 - Équipements
  const chaufDisplay = chaufLabels[carac.chauffage] || carac.chauffage || '—';
  const diffArr = carac.diffusion || [];
  const diffDisplay = Array.isArray(diffArr) && diffArr.length > 0 
    ? diffArr.map((d: string) => diffMap[d] || d).join(', ')
    : '—';
  
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Salles de bain</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.nombreSDB || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">WC</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.nombreWC || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Chauffage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + chaufDisplay + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Diffusion</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + diffDisplay + '</div></div>';
  html += '</div>';
  
  // Ligne 4 - Infos immeuble
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Étage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.etage || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Exposition</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + ((carac.exposition || []).join(', ') || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Vue</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + vueDisplay + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Construction</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.anneeConstruction || '—') + '</div></div>';
  html += '</div>';
  
  return html;
}

function generateMaisonGrid(carac: any, surfaces: any, vueDisplay: string, chaufLabels: Record<string, string>, diffMap: Record<string, string>, preEstimation: any): string {
  let html = '';
  
  // Cubage : priorité cubageCalcule (UI) > cubageManuel > fallback
  const parseNum = (v: any) => parseFloat(String(v || '').replace(/[^\d.-]/g, '')) || 0;
  const cubageDisplay = parseNum(preEstimation?.cubageCalcule) || parseNum(carac?.cubageManuel) || surfaces.cubage;
  
  // Ligne 1 - Surfaces
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface habitable</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceHabitableMaison || '—') + ' m²</div></div>';
  html += '<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:10px;border-left:3px solid #111827;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface terrain</div><div style="font-size:15px;font-weight:700;color:#111827;">' + surfaces.surfaceTerrain.toFixed(0) + ' m²</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Niveaux</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.nombreNiveaux || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Cubage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + Math.round(cubageDisplay) + ' m³</div></div>';
  html += '</div>';
  
  // Ligne 2 - Équipements
  const chaufDisplay = chaufLabels[carac.chauffage] || carac.chauffage || '—';
  const diffMaisonRaw = carac.diffusionMaison;
  let diffMaisonDisplay = '—';
  if (diffMaisonRaw) {
    if (Array.isArray(diffMaisonRaw)) {
      diffMaisonDisplay = diffMaisonRaw.map((d: string) => diffMap[d] || d).join(', ') || '—';
    } else {
      diffMaisonDisplay = diffMap[diffMaisonRaw] || diffMaisonRaw;
    }
  }
  
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Salles de bain</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.nombreSDB || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">WC</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.nombreWC || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Chauffage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + chaufDisplay + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Diffusion</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + diffMaisonDisplay + '</div></div>';
  html += '</div>';
  
  // Ligne 3 - Infos supplémentaires
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Exposition</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + ((carac.exposition || []).join(', ') || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Vue</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + vueDisplay + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">CECB</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.cecb || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Construction</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.anneeConstruction || '—') + '</div></div>';
  html += '</div>';
  
  // Ligne 4 - Parkings
  const pkgCouvert = parseInt(carac.parkingCouverte) || 0;
  const pkgExtMaison = parseInt(carac.parkingExterieur) || 0;
  const pkgGarage = parseInt(carac.box) || 0;
  
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Parking couvert</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (pkgCouvert || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Parking ext.</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (pkgExtMaison || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Garage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (pkgGarage || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Zone</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.zone || '—') + '</div></div>';
  html += '</div>';
  
  // Répartition des niveaux si renseignée
  const repartitionSoussol = carac.repartitionSoussol || '';
  const repartitionNiveaux = carac.repartitionNiveaux || [];
  const niveauxCustom = carac.niveauxCustom || [];
  const hasRepartition = repartitionSoussol || repartitionNiveaux.some((r: string) => r) || niveauxCustom.length > 0;
  
  if (hasRepartition) {
    html += '<div style="margin-top:12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">';
    html += '<div style="background:#1a2e35;color:white;padding:8px 12px;font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">🏠 Répartition des niveaux</div>';
    html += '<div style="padding:0;">';
    
    if (repartitionSoussol) {
      html += '<div style="display:flex;border-bottom:1px solid #e5e7eb;">';
      html += '<div style="width:120px;padding:8px 12px;background:#f1f5f9;font-size:10px;font-weight:600;color:#64748b;">Sous-sol</div>';
      html += '<div style="flex:1;padding:8px 12px;font-size:10px;color:#1a2e35;">' + repartitionSoussol + '</div>';
      html += '</div>';
    }
    
    const nombreNiveauxPdf = parseInt(carac.nombreNiveaux) || 0;
    for (let ni = 0; ni < nombreNiveauxPdf; ni++) {
      const niveauContent = repartitionNiveaux[ni] || '';
      if (niveauContent) {
        const niveauLabel = ni === 0 ? 'Rez-de-chaussée' : (ni === 1 ? '1er étage' : ni + 'ème étage');
        html += '<div style="display:flex;border-bottom:1px solid #e5e7eb;">';
        html += '<div style="width:120px;padding:8px 12px;background:#f1f5f9;font-size:10px;font-weight:600;color:#64748b;">' + niveauLabel + '</div>';
        html += '<div style="flex:1;padding:8px 12px;font-size:10px;color:#1a2e35;">' + niveauContent + '</div>';
        html += '</div>';
      }
    }
    
    for (let ci = 0; ci < niveauxCustom.length; ci++) {
      const customNiveau = niveauxCustom[ci];
      if (customNiveau.label || customNiveau.description) {
        html += '<div style="display:flex;border-bottom:1px solid #e5e7eb;">';
        html += '<div style="width:120px;padding:8px 12px;background:#fef9c3;font-size:10px;font-weight:600;color:#92400e;">' + (customNiveau.label || 'Autre') + '</div>';
        html += '<div style="flex:1;padding:8px 12px;font-size:10px;color:#1a2e35;">' + (customNiveau.description || '—') + '</div>';
        html += '</div>';
      }
    }
    
    html += '</div></div>';
  }
  
  return html;
}

function generateRenovationsSection(carac: any): string {
  const renoLabels: Record<string, string> = {
    moins10ans: '< 10 ans', structure: 'Structure', technique: 'Technique',
    cuisine: 'Cuisine', sdb: 'Salle de bain', sols: 'Sols',
    peinture: 'Peinture', fenetres: 'Fenêtres', facade: 'Façade',
    toiture: 'Toiture', isolation: 'Isolation'
  };
  
  const travLabels: Record<string, string> = {
    rafraichir: 'Rafraîchir', renover_partiel: 'Rénovation partielle',
    renover_total: 'Rénovation totale', agrandir: 'Agrandissement',
    cuisine: 'Cuisine', sdb: 'Salle de bain', sols: 'Sols'
  };
  
  const renovations = carac.typeRenovation || [];
  const travaux = carac.travauxRecents || [];
  const travauxPrevus = carac.travauxPrevus || [];
  
  if (renovations.length === 0 && travaux.length === 0 && travauxPrevus.length === 0) {
    return '';
  }
  
  let html = '<div style="padding:12px 24px;background:#fafafa;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;">Rénovations & Travaux</div>';
  
  if (renovations.length > 0) {
    html += '<div style="margin-bottom:6px;"><span style="font-size:8px;color:#065f46;font-weight:600;">RÉNOVATIONS : </span>';
    renovations.forEach((r: string) => {
      html += '<span style="display:inline-block;padding:2px 6px;margin:1px;background:#d1fae5;color:#065f46;border-radius:3px;font-size:8px;">' + (renoLabels[r] || r) + '</span> ';
    });
    html += '</div>';
  }
  
  if (travaux.length > 0) {
    html += '<div style="margin-bottom:6px;"><span style="font-size:8px;color:#1e40af;font-weight:600;">TRAVAUX RÉCENTS : </span>';
    travaux.forEach((t: string) => {
      html += '<span style="display:inline-block;padding:2px 6px;margin:1px;background:#dbeafe;color:#1e40af;border-radius:3px;font-size:8px;">' + (travLabels[t] || t) + '</span> ';
    });
    html += '</div>';
  }
  
  if (travauxPrevus.length > 0) {
    html += '<div><span style="font-size:8px;color:#92400e;font-weight:600;">TRAVAUX À PRÉVOIR : </span>';
    travauxPrevus.forEach((t: string) => {
      html += '<span style="display:inline-block;padding:2px 6px;margin:1px;background:#fef3c7;color:#92400e;border-radius:3px;font-size:8px;">' + (travLabels[t] || t) + '</span> ';
    });
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

function generateEtatSection(analyse: any): string {
  const hasEtat = analyse.etatCuisine || analyse.etatSDB || analyse.etatSols || 
                  analyse.etatMurs || analyse.etatMenuiseries || analyse.etatElectricite;
  
  if (!hasEtat) return '';
  
  const renderDots = (val: number | string) => {
    const v = parseInt(String(val)) || 0;
    let dots = '';
    for (let i = 1; i <= 5; i++) {
      const color = i <= v ? '#1a2e35' : '#e5e7eb';
      dots += '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + color + ';margin-right:2px;"></span>';
    }
    return dots;
  };
  
  let html = '<div style="padding:12px 24px;background:white;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('eye', 12, '#9ca3af') + 'État observé</div>';
  
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
  
  if (analyse.etatCuisine) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;"><span style="font-size:9px;color:#64748b;">Cuisine</span><span>' + renderDots(analyse.etatCuisine) + '</span></div>';
  }
  if (analyse.etatSDB) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;"><span style="font-size:9px;color:#64748b;">Salle de bain</span><span>' + renderDots(analyse.etatSDB) + '</span></div>';
  }
  if (analyse.etatSols) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;"><span style="font-size:9px;color:#64748b;">Sols</span><span>' + renderDots(analyse.etatSols) + '</span></div>';
  }
  if (analyse.etatMurs) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;"><span style="font-size:9px;color:#64748b;">Murs</span><span>' + renderDots(analyse.etatMurs) + '</span></div>';
  }
  if (analyse.etatMenuiseries) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;"><span style="font-size:9px;color:#64748b;">Menuiseries</span><span>' + renderDots(analyse.etatMenuiseries) + '</span></div>';
  }
  if (analyse.etatElectricite) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;"><span style="font-size:9px;color:#64748b;">Électricité</span><span>' + renderDots(analyse.etatElectricite) + '</span></div>';
  }
  
  html += '</div></div>';
  return html;
}

function generateProximitesSection(identification: any): string {
  const proximites = identification.proximites || [];
  const transports = identification.transports || {};
  
  const hasProximites = proximites.some((p: any) => p.libelle || p.distance);
  const hasTransports = transports.arret || transports.gare;
  
  if (!hasProximites && !hasTransports) return '';
  
  let html = '<div style="padding:12px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('mapPin', 12, '#9ca3af') + 'Proximités</div>';
  
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
  
  proximites.forEach((p: any) => {
    if (p.libelle || p.distance) {
      html += '<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:white;border:1px solid #e5e7eb;border-radius:4px;">';
      html += '<span style="font-size:11px;">' + (p.icone || '📍') + '</span>';
      html += '<span style="font-size:8px;color:#1a2e35;">' + (p.libelle || p.type) + '</span>';
      if (p.distance) {
        html += '<span style="font-size:7px;color:#6b7280;">(' + p.distance + ')</span>';
      }
      html += '</div>';
    }
  });
  
  if (transports.arret) {
    const modeIcon = transports.arret.mode === 'tram' ? '🚃' : (transports.arret.mode === 'bus_tram' ? '🚌🚃' : '🚌');
    html += '<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:white;border:1px solid #e5e7eb;border-radius:4px;">';
    html += '<span style="font-size:11px;">' + modeIcon + '</span>';
    html += '<span style="font-size:8px;color:#1a2e35;">' + transports.arret.nom + '</span>';
    html += '<span style="font-size:7px;color:#6b7280;">(' + transports.arret.distance + ')</span>';
    html += '</div>';
  }
  
  if (transports.gare) {
    html += '<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:white;border:1px solid #e5e7eb;border-radius:4px;">';
    html += '<span style="font-size:11px;">🚂</span>';
    html += '<span style="font-size:8px;color:#1a2e35;">' + transports.gare.nom + '</span>';
    html += '<span style="font-size:7px;color:#6b7280;">(' + transports.gare.distance + ')</span>';
    html += '</div>';
  }
  
  html += '</div></div>';
  return html;
}

function generateArgumentsSection(analyse: any): string {
  const pointsForts = analyse.pointsForts || [];
  const pointsFaibles = analyse.pointsFaibles || [];
  
  if (pointsForts.length === 0 && pointsFaibles.length === 0) return '';
  
  let html = '<div style="padding:12px 24px;background:white;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('star', 12, '#9ca3af') + 'Arguments de vente</div>';
  
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
  
  // Points forts
  if (pointsForts.length > 0) {
    html += '<div>';
    html += '<div style="font-size:8px;color:#065f46;font-weight:600;margin-bottom:4px;">✓ Points forts</div>';
    pointsForts.slice(0, 5).forEach((p: string) => {
      html += '<div style="font-size:9px;color:#1a2e35;padding:2px 0;">• ' + p.replace(/^[\p{Emoji}\s]+/u, '') + '</div>';
    });
    html += '</div>';
  }
  
  // Points faibles
  if (pointsFaibles.length > 0) {
    html += '<div>';
    html += '<div style="font-size:8px;color:#991b1b;font-weight:600;margin-bottom:4px;">✗ Points d\'attention</div>';
    pointsFaibles.slice(0, 5).forEach((p: string) => {
      html += '<div style="font-size:9px;color:#1a2e35;padding:2px 0;">• ' + p.replace(/^[\p{Emoji}\s]+/u, '') + '</div>';
    });
    html += '</div>';
  }
  
  html += '</div></div>';
  return html;
}
