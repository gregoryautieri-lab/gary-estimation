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
  const analyseTerrain = data.analyse_terrain || {};
  const preEstimation = data.pre_estimation || {};
  
  const bien = identification.bien || {};
  const carac = caracteristiques;
  const analyse = analyseTerrain;
  
  const isAppartement = data.type_bien === 'appartement';
  const isMaison = data.type_bien === 'maison';
  
  // Calculs surfaces
  const surfaces = calculateSurfaces(carac, preEstimation, isAppartement, isMaison);
  const valeurs = calculateValeurs(surfaces, carac, preEstimation, isAppartement, isMaison);
  
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
  const vueArr = carac.vue || [];
  const vueDisplay = Array.isArray(vueArr) && vueArr.length > 0 
    ? vueArr.map((v: string) => vueLabels[v] || v).join(', ')
    : '—';
  
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
    html += generateMaisonGrid(carac, surfaces, vueDisplay, chaufLabels, diffMap);
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

function generateMaisonGrid(carac: any, surfaces: any, vueDisplay: string, chaufLabels: Record<string, string>, diffMap: Record<string, string>): string {
  let html = '';
  
  // Ligne 1 - Surfaces
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface habitable</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceHabitableMaison || '—') + ' m²</div></div>';
  html += '<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:10px;border-left:3px solid #111827;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface terrain</div><div style="font-size:15px;font-weight:700;color:#111827;">' + surfaces.surfaceTerrain.toFixed(0) + ' m²</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Niveaux</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.nombreNiveaux || '—') + '</div></div>';
  html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Cubage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + surfaces.cubage.toFixed(0) + ' m³</div></div>';
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
    cuisine: 'Cuisine', salles_eau: 'Salles eau', menuiseries: 'Fenêtres', finitions: 'Finitions'
  };
  const travLabels: Record<string, string> = {
    toiture: 'Toiture', facade: 'Façade', fenetres: 'Fenêtres', chauffage: 'Chauffage',
    electrique: 'Électricité', plomberie: 'Plomberie', cuisine: 'Cuisine', sdb: 'SDB',
    sols: 'Sols', isolation: 'Isolation', peinture: 'Peinture', jardin: 'Extérieurs'
  };
  
  const renoArr = carac.typeRenovation || [];
  const travArr = carac.travauxRecents || [];
  
  if (!carac.anneeRenovation && renoArr.length === 0 && travArr.length === 0) {
    return '';
  }
  
  let html = '<div style="padding:12px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('refresh', 14, '#6b7280') + 'Rénovations & Travaux</div>';
  if (carac.anneeRenovation) {
    html += '<div style="font-size:10px;color:#374151;font-weight:600;">Rénové en ' + carac.anneeRenovation + '</div>';
  }
  html += '</div>';
  
  if (renoArr.length > 0 || travArr.length > 0) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
    for (const ri of renoArr) {
      html += '<span style="background:white;color:#374151;padding:4px 10px;border-radius:4px;font-size:9px;border:1px solid #e5e7eb;">' + (renoLabels[ri] || ri) + '</span>';
    }
    for (const ti of travArr) {
      html += '<span style="background:white;color:#374151;padding:4px 10px;border-radius:4px;font-size:9px;border:1px solid #e5e7eb;">' + (travLabels[ti] || ti) + '</span>';
    }
    html += '</div>';
  }
  html += '</div>';
  
  return html;
}

function generateEtatSection(analyse: any): string {
  let html = '<div style="padding:16px 24px;background:#fafafa;border-top:1px solid #e5e7eb;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">État du bien</div>';
  html += '<div style="font-size:8px;color:#9ca3af;display:flex;gap:12px;">';
  html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('sparkles', 12, '#3b82f6') + 'Neuf</span>';
  html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('checkCircle', 12, '#10b981') + 'Bon</span>';
  html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('refresh', 12, '#f59e0b') + 'À rafraîchir</span>';
  html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('xCircle', 12, '#ef4444') + 'À refaire</span>';
  html += '</div></div>';
  
  // États
  html += '<div style="display:flex;gap:6px;margin-bottom:12px;">';
  const etats = [
    {l: 'Cuisine', v: analyse.etatCuisine},
    {l: 'Salle de bain', v: analyse.etatSDB},
    {l: 'Sols', v: analyse.etatSols},
    {l: 'Murs', v: analyse.etatMurs},
    {l: 'Menuiseries', v: analyse.etatMenuiseries},
    {l: 'Électricité', v: analyse.etatElectricite}
  ];
  
  etats.forEach((e) => {
    const icoName = e.v === 'neuf' ? 'sparkles' : (e.v === 'bon' ? 'checkCircle' : (e.v === 'rafraichir' ? 'refresh' : (e.v === 'refaire' ? 'xCircle' : 'minus')));
    const icoColor = e.v === 'neuf' ? '#3b82f6' : (e.v === 'bon' ? '#10b981' : (e.v === 'rafraichir' ? '#f59e0b' : (e.v === 'refaire' ? '#ef4444' : '#d1d5db')));
    html += '<div style="flex:1;text-align:center;padding:10px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">';
    html += '<div style="margin-bottom:4px;">' + ico(icoName, 18, icoColor) + '</div>';
    html += '<div style="font-size:8px;color:#6b7280;font-weight:500;">' + e.l + '</div>';
    html += '</div>';
  });
  html += '</div>';
  
  // Ambiance
  html += '<div style="display:flex;gap:10px;">';
  const ambiances = [
    {l: 'Luminosité', v: analyse.luminosite || 0, icoName: 'luminosite'},
    {l: 'Calme', v: analyse.calme || 0, icoName: 'calme'},
    {l: 'Volumes', v: analyse.volumes || 0, icoName: 'volumes'}
  ];
  
  ambiances.forEach((a) => {
    html += '<div style="flex:1;background:white;border-radius:6px;padding:10px;border:1px solid #e5e7eb;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
    html += '<span style="font-size:10px;color:#6b7280;font-weight:500;display:flex;align-items:center;gap:6px;">' + ico(a.icoName, 14, '#9ca3af') + a.l + '</span>';
    html += '<span style="font-size:11px;font-weight:600;color:#111827;">' + a.v + '/5</span>';
    html += '</div>';
    html += '<div style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;">';
    html += '<div style="height:100%;width:' + (a.v * 20) + '%;background:#111827;border-radius:2px;"></div>';
    html += '</div></div>';
  });
  html += '</div></div>';
  
  return html;
}

function generateProximitesSection(identification: any): string {
  const proximites = identification?.proximites || [];
  const proxFilled = proximites.filter((p: any) => p.libelle && p.distance).slice(0, 6);
  const proxIcons: Record<string, string> = {
    '🚌': 'bus', '🚃': 'train', '🏫': 'ecole', '🛒': 'commerce', '🏥': 'sante', '🌳': 'nature'
  };
  
  let html = '<div style="padding:16px 24px;background:white;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;">Proximités & Commodités</div>';
  
  if (proxFilled.length > 0) {
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
    proxFilled.forEach((p: any) => {
      const distStr = String(p.distance);
      const distDisplay = distStr + (distStr && !distStr.endsWith('m') && !distStr.endsWith('km') ? 'm' : '');
      const proxIcoName = proxIcons[p.icone] || 'mapPin';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #e5e7eb;border-radius:6px;">';
      html += '<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#f9fafb;border-radius:6px;">' + ico(proxIcoName, 18, '#6b7280') + '</div>';
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:10px;color:#374151;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.libelle + '</div>';
      html += '<div style="font-size:12px;font-weight:700;color:#111827;">' + distDisplay + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  } else {
    html += '<div style="color:#94a3b8;font-style:italic;font-size:9px;text-align:center;padding:20px;">Aucune proximité renseignée</div>';
  }
  
  html += '</div>';
  
  return html;
}

function generateArgumentsSection(analyse: any): string {
  const pointsForts = analyse.pointsForts || [];
  
  if (pointsForts.length === 0) {
    return '';
  }
  
  // Prendre les 4 premiers arguments
  const topArguments = pointsForts.slice(0, 4);
  
  let html = '<div style="padding:14px 16px;background:linear-gradient(135deg, #1a2e35 0%, #2c3e50 50%, #34495e 100%);margin:12px 16px;border-radius:12px;box-shadow:0 4px 15px rgba(26,46,53,0.3);position:relative;overflow:hidden;">';
  html += '<div style="content:\'\';position:absolute;top:-50%;right:-50%;width:100%;height:100%;background:radial-gradient(circle, rgba(255,69,57,0.1) 0%, transparent 70%);"></div>';
  html += '<div style="font-size:10px;font-weight:700;color:white;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;position:relative;">✨ Arguments de vente</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;position:relative;">';
  
  topArguments.forEach((arg: string) => {
    const cleanArg = arg.replace(/^[^\s]+\s/, ''); // Remove emoji
    html += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:10px;display:flex;align-items:flex-start;gap:10px;border:1px solid rgba(255,255,255,0.1);">';
    html += '<div style="font-size:16px;background:rgba(255,69,57,0.2);width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;">✓</div>';
    html += '<div style="font-size:10px;color:white;line-height:1.4;font-weight:500;">' + cleanArg + '</div>';
    html += '</div>';
  });
  
  html += '</div></div>';
  
  return html;
}
