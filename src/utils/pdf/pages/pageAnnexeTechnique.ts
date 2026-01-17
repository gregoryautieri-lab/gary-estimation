/**
 * Pages Annexe Technique : Détails complets du bien
 * Génère les 2 pages d'annexe technique
 */

import { EstimationData } from '@/types/estimation';
import { ico } from '../pdfIcons';
import { getLogo } from '../pdfLogos';
import { nuisanceLabels, dureeLabels, typeDiffusionLabels, raisonEchecLabels } from '../pdfFormatters';

interface PageAnnexeConfig {
  pageNum1: number;
  pageNum2: number;
  totalPages: number;
  refId: string;
}

/**
 * Génère la page Annexe Technique 1/2
 */
export function generateAnnexeTechnique1(
  data: EstimationData,
  config: PageAnnexeConfig
): string {
  const caracteristiques = data.caracteristiques || {};
  const carac = caracteristiques as any;
  const isAppartement = data.typeBien === 'appartement';
  const isMaison = data.typeBien === 'maison';
  
  const annexeVal = (v: any, suffix: string = ''): string => {
    if (v === undefined || v === null || v === '') return '—';
    return String(v) + suffix;
  };
  
  const buanderieLabels: Record<string, string> = {
    privee: 'Privée', commune: 'Commune', aucune: 'Aucune'
  };
  
  const espaceLabels: Record<string, string> = {
    piscine: 'Piscine', jacuzzi: 'Jacuzzi', sauna: 'Sauna',
    fitness: 'Fitness', cave_vin: 'Cave à vin', atelier: 'Atelier',
    bureau: 'Bureau', dependance: 'Dépendance'
  };
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + getLogo('white', 28) + '</div>';
  html += '<div class="header-date">Annexe Technique (1/2)</div>';
  html += '</div>';
  
  // Section Identification
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('home', 12, '#FF4539') + ' Identification</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Type</div><div class="annexe-item-value">' + (isAppartement ? 'Appartement' : (isMaison ? 'Maison' : '—')) + '</div></div>';
  if (isAppartement) {
    html += '<div class="annexe-item"><div class="annexe-item-label">Sous-type</div><div class="annexe-item-value">' + annexeVal(carac.sousType) + '</div></div>';
  }
  if (isMaison) {
    html += '<div class="annexe-item"><div class="annexe-item-label">Type maison</div><div class="annexe-item-value">' + annexeVal(carac.sousType) + '</div></div>';
  }
  html += '<div class="annexe-item"><div class="annexe-item-label">Standing</div><div class="annexe-item-value">' + annexeVal(carac.standing) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Construction</div><div class="annexe-item-value">' + annexeVal(carac.anneeConstruction) + '</div></div>';
  html += '</div>';
  if (carac.anneeRenovation) {
    html += '<div class="annexe-grid" style="margin-top:6px;"><div class="annexe-item"><div class="annexe-item-label">Rénovation</div><div class="annexe-item-value">' + carac.anneeRenovation + '</div></div></div>';
  }
  html += '</div>';
  
  // Section Surfaces
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('surface', 12, '#FF4539') + ' Surfaces</div>';
  html += '<div class="annexe-grid">';
  
  if (isAppartement) {
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface PPE</div><div class="annexe-item-value">' + annexeVal(carac.surfacePPE, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface non hab.</div><div class="annexe-item-value">' + annexeVal(carac.surfaceNonHabitable, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Balcon</div><div class="annexe-item-value">' + annexeVal(carac.surfaceBalcon, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Terrasse</div><div class="annexe-item-value">' + annexeVal(carac.surfaceTerrasse, ' m²') + '</div></div>';
  } else if (isMaison) {
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface habitable</div><div class="annexe-item-value">' + annexeVal(carac.surfaceHabitableMaison, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface terrain</div><div class="annexe-item-value">' + annexeVal(carac.surfaceTerrain, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Surface utile</div><div class="annexe-item-value">' + annexeVal(carac.surfaceUtile, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Cubage</div><div class="annexe-item-value">' + annexeVal(carac.cubageManuel, ' m³') + '</div></div>';
  }
  html += '</div>';
  
  if (isAppartement) {
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Jardin</div><div class="annexe-item-value">' + annexeVal(carac.surfaceJardin, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Loggia</div><div class="annexe-item-value">' + annexeVal(carac.surfaceLoggia, ' m²') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Véranda</div><div class="annexe-item-value">' + annexeVal(carac.surfaceVeranda, ' m²') + '</div></div>';
    html += '</div>';
  }
  html += '</div>';
  
  // Section Pièces & Configuration
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('chambres', 12, '#FF4539') + ' Pièces & Configuration</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Nombre de pièces</div><div class="annexe-item-value">' + annexeVal(carac.nombrePieces) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Chambres</div><div class="annexe-item-value">' + annexeVal(carac.nombreChambres) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Salles de bain</div><div class="annexe-item-value">' + annexeVal(carac.nombreSDB) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">WC</div><div class="annexe-item-value">' + annexeVal(carac.nombreWC) + '</div></div>';
  html += '</div>';
  
  if (isAppartement) {
    const formatEtage = (val: any) => {
      if (val === undefined || val === null || val === '') return '—';
      if (val === 0 || val === '0') return 'RDC';
      if (val === 1 || val === '1') return '1er';
      return val + 'e';
    };
    let etageText = formatEtage(carac.etage);
    if (carac.etageHaut) etageText += ' au ' + formatEtage(carac.etageHaut);
    
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Étage</div><div class="annexe-item-value">' + etageText + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Étages immeuble</div><div class="annexe-item-value">' + annexeVal(carac.nombreEtagesImmeuble) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Ascenseur</div><div class="annexe-item-value">' + (carac.ascenseur === 'oui' ? 'Oui' : (carac.ascenseur === 'non' ? 'Non' : '—')) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Dernier étage</div><div class="annexe-item-value">' + (carac.dernierEtage ? 'Oui' : 'Non') + '</div></div>';
    html += '</div>';
  }
  
  // Exposition et vue
  const expositionText = (carac.exposition || []).length > 0 ? carac.exposition.join(', ') : '—';
  html += '<div class="annexe-grid-2" style="margin-top:6px;">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Exposition</div><div class="annexe-item-value">' + expositionText + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Vue</div><div class="annexe-item-value">' + annexeVal(carac.vue) + '</div></div>';
  html += '</div>';
  html += '</div>';
  
  // Section Énergie & Charges
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('zap', 12, '#FF4539') + ' Énergie & Charges</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">CECB</div><div class="annexe-item-value">' + annexeVal(carac.cecb) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Vitrage</div><div class="annexe-item-value">' + annexeVal(carac.vitrage) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Chauffage</div><div class="annexe-item-value">' + annexeVal(carac.chauffage) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Charges mensuelles</div><div class="annexe-item-value">' + annexeVal(carac.chargesMensuelles, ' CHF') + '</div></div>';
  html += '</div>';
  
  // Diffusion chaleur
  const diffusionArr = isAppartement ? (carac.diffusion || []) : (carac.diffusionMaison || []);
  if (diffusionArr.length > 0) {
    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Diffusion : </span>';
    diffusionArr.forEach((d: string) => { html += '<span class="annexe-chip">' + d + '</span> '; });
    html += '</div>';
  }
  html += '</div>';
  
  // Section Annexes & Stationnement
  html += '<div class="annexe-section">';
  html += '<div class="annexe-title">' + ico('parking', 12, '#FF4539') + ' Annexes & Stationnement</div>';
  html += '<div class="annexe-grid">';
  html += '<div class="annexe-item"><div class="annexe-item-label">Parking intérieur</div><div class="annexe-item-value">' + annexeVal(carac.parkingInterieur) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Parking extérieur</div><div class="annexe-item-value">' + annexeVal(carac.parkingExterieur) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Place couverte</div><div class="annexe-item-value">' + annexeVal(carac.parkingCouverte) + '</div></div>';
  html += '<div class="annexe-item"><div class="annexe-item-label">Box</div><div class="annexe-item-value">' + annexeVal(carac.box) + '</div></div>';
  html += '</div>';
  
  if (isAppartement) {
    html += '<div class="annexe-grid" style="margin-top:6px;">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Cave</div><div class="annexe-item-value">' + (carac.cave === true ? 'Oui' : (carac.cave === false ? 'Non' : '—')) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Buanderie</div><div class="annexe-item-value">' + annexeVal(buanderieLabels[carac.buanderie]) + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Piscine</div><div class="annexe-item-value">' + (carac.piscine ? 'Oui' : 'Non') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Autres</div><div class="annexe-item-value">' + annexeVal(carac.autresAnnexes) + '</div></div>';
    html += '</div>';
  }
  
  // Espaces maison
  if (isMaison && (carac.espacesMaison || []).length > 0) {
    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Espaces : </span>';
    carac.espacesMaison.forEach((e: string) => {
      html += '<span class="annexe-chip">' + (espaceLabels[e] || e) + '</span> ';
    });
    html += '</div>';
  }
  html += '</div>';
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + getLogo('white', 18) + '</div>';
  html += '<div class="footer-ref">Page ' + config.pageNum1 + '/' + config.totalPages + ' • Annexe Technique (1/2)</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

/**
 * Génère la page Annexe Technique 2/2
 */
export function generateAnnexeTechnique2(
  data: EstimationData,
  config: PageAnnexeConfig
): string {
  const analyseTerrain = data.analyseTerrain as any || {};
  const identification = data.identification as any || {};
  const historique = identification.historique || {};
  const analyse = analyseTerrain;
  const hist = historique;
  
  const renderEtatDots = (value: any): string => {
    const v = parseInt(value) || 0;
    let dots = '';
    for (let i = 1; i <= 5; i++) {
      const color = i <= v ? '#1a2e35' : '#e5e7eb';
      dots += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + color + ';margin-right:2px;"></span>';
    }
    return '<div class="annexe-item-value" style="display:flex;align-items:center;">' + dots + '</div>';
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
  html += '<div>' + getLogo('white', 28) + '</div>';
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
      pf.forEach((p: string) => { html += '<span class="annexe-chip positive">' + cleanEmoji(p) + '</span> '; });
      html += '</div>';
    }
    if (pfaibles.length > 0) {
      html += '<div><span style="font-size:8px;color:#991b1b;font-weight:600;">POINTS FAIBLES : </span>';
      pfaibles.forEach((p: string) => { html += '<span class="annexe-chip negative">' + cleanEmoji(p) + '</span> '; });
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
    nuisances.forEach((n: string) => { html += '<span class="annexe-chip negative">' + (nuisanceLabels[n] || n) + '</span> '; });
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
  if (hist.dejaDiffuse) {
    html += '<div class="annexe-section">';
    html += '<div class="annexe-title">' + ico('clock', 12, '#FF4539') + ' Historique de diffusion</div>';
    html += '<div class="annexe-grid">';
    html += '<div class="annexe-item"><div class="annexe-item-label">Durée</div><div class="annexe-item-value">' + (dureeLabels[hist.duree] || '—') + '</div></div>';
    html += '<div class="annexe-item"><div class="annexe-item-label">Type diffusion</div><div class="annexe-item-value">' + (typeDiffusionLabels[hist.typeDiffusion] || '—') + '</div></div>';
    html += '</div>';
    
    // Portails utilisés
    const portailsUtilises = hist.portails || [];
    if (portailsUtilises.length > 0) {
      const portailsLbl: Record<string, string> = {
        'immoscout': 'Immoscout', 'homegate': 'Homegate', 'acheterlouer': 'Acheter-Louer',
        'anibis': 'Anibis', 'immostreet': 'ImmoStreet', 'autres': 'Autres'
      };
      html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Portails utilisés : </span>';
      portailsUtilises.forEach((p: string) => { html += '<span class="annexe-chip">' + (portailsLbl[p] || p) + '</span> '; });
      html += '</div>';
    }
    
    // Raisons échec
    const raisonsEchec = hist.raisonEchec || [];
    if (raisonsEchec.length > 0) {
      html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#991b1b;">Raisons échec perçues : </span>';
      raisonsEchec.forEach((r: string) => { html += '<span class="annexe-chip negative">' + (raisonEchecLabels[r] || r) + '</span> '; });
      html += '</div>';
    }
    html += '</div>';
  }
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + getLogo('white', 18) + '</div>';
  html += '<div class="footer-ref">Page ' + config.pageNum2 + '/' + config.totalPages + ' • Annexe Technique (2/2)</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}
