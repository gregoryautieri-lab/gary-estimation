/**
 * Générateur PDF principal GARY
 * Assemble toutes les pages et gère la logique d'orchestration
 */

import { EstimationData } from '@/types/estimation';
import {
  val,
  formatPrice,
  formatDateCH,
  getNextMonday,
  addWeeks,
  roundTo5000
} from './pdfFormatters';
import {
  calculateCapitalVisibilite,
  calculateLuxMode,
  getLuxCopy,
  calculateSurfaces,
  calculateValeurs,
  calculateNiveauContrainte,
  calculatePauseRecalibrage
} from './pdfCalculs';
import {
  getPdfStyles,
  generateCoverPage,
  generateGaryPage,
  generateCaracteristiquesPage,
  generateStrategiePage,
  generateComparablesSection,
  generateComparablesAnnexePage,
  generatePhotosPages,
  generateMapPage,
  generateAnnexeTechnique1,
  generateAnnexeTechnique2
} from './pages';

// ==================== TYPES ====================

interface PhaseDurees {
  phase0: number;
  phase1: number;
  phase2: number;
  phase3: number;
}

interface PDFGeneratorOptions {
  openInNewWindow?: boolean;
  returnHtml?: boolean;
}

// ==================== CALCULS PHASES AUTO ====================

/**
 * Calcule automatiquement les durées de phases selon une durée totale cible
 */
export function calculerPhasesAuto(
  dureeTotal: number,
  pauseRecalibrage: number = 0
): PhaseDurees {
  const MIN_TOTAL = 6;
  const duree = Math.max(MIN_TOTAL, dureeTotal);
  
  const MIN_PHASE0 = 1;
  const MIN_PHASE1 = 1;
  const MIN_PHASE2 = 1;
  const MIN_PHASE3 = 4;
  const MAX_PHASE1 = 26;
  
  const phase0 = MIN_PHASE0 + pauseRecalibrage;
  let phase1: number;
  let phase2: number;
  let phase3: number;
  
  const disponibleApresPrepa = duree - phase0;
  
  if (disponibleApresPrepa < 6) {
    phase1 = MIN_PHASE1;
    phase2 = MIN_PHASE2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else if (disponibleApresPrepa <= 12) {
    phase1 = 2;
    phase2 = 2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else if (disponibleApresPrepa <= 20) {
    phase1 = Math.min(6, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 2) * 0.4));
    phase2 = 2;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else if (disponibleApresPrepa <= 30) {
    phase1 = Math.min(12, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 3) * 0.5));
    phase2 = 3;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else if (disponibleApresPrepa <= 40) {
    phase1 = Math.min(20, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 3) * 0.55));
    phase2 = 3;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  } else {
    phase1 = MAX_PHASE1;
    phase2 = 4;
    phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
  }
  
  return {
    phase0: Math.max(MIN_PHASE0, phase0),
    phase1: Math.max(MIN_PHASE1, Math.min(MAX_PHASE1, phase1)),
    phase2: Math.max(MIN_PHASE2, phase2),
    phase3: Math.max(MIN_PHASE3, phase3)
  };
}

/**
 * Calcule la durée totale en semaines jusqu'à une date cible
 */
export function getDureeJusquaDate(dateDebut: Date, dateVenteIdeale: string): number | null {
  if (!dateVenteIdeale) return null;
  
  // dateVenteIdeale est au format "YYYY-MM"
  const parts = dateVenteIdeale.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const dateFinMois = new Date(year, month, 0); // Dernier jour du mois
  
  const diffMs = dateFinMois.getTime() - dateDebut.getTime();
  return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
}

/**
 * Calcule les ajustements de phase selon le projet post-vente
 */
export function calculerAjustementsProjet(
  hasProjetAchat: boolean,
  niveauContrainte: number,
  flexibilite: string,
  toleranceVenteRapide: boolean,
  toleranceVenteLongue: boolean
): { phase0: number; phase1: number; phase2: number; phase3: number } {
  let ajustPhase0 = 0;
  let ajustPhase1 = 0;
  let ajustPhase2 = 0;
  let ajustPhase3 = 0;
  
  if (hasProjetAchat && niveauContrainte > 0) {
    // Contrainte CRITIQUE ou FORTE
    if (niveauContrainte >= 4) {
      if (flexibilite === 'faible') {
        ajustPhase1 = -2;
        ajustPhase2 = -1;
      } else {
        ajustPhase1 = -1;
      }
    }
    // Contrainte ÉLEVÉE
    else if (niveauContrainte === 3) {
      if (toleranceVenteRapide) {
        ajustPhase1 = -1;
      }
    }
    // Contrainte FAIBLE (recherche active)
    else if (niveauContrainte === 1) {
      if (toleranceVenteLongue) {
        ajustPhase1 = 1; // Off-market prolongé
      }
    }
  }
  
  return {
    phase0: ajustPhase0,
    phase1: ajustPhase1,
    phase2: ajustPhase2,
    phase3: ajustPhase3
  };
}

// ==================== ASSEMBLAGE DONNÉES ====================

interface PreparedPDFData {
  // Données de base
  dateNow: Date;
  dateStr: string;
  heureStr: string;
  refId: string;
  
  // Type de bien
  typeBien: string;
  isAppartement: boolean;
  isMaison: boolean;
  
  // Surfaces calculées
  surfaces: ReturnType<typeof calculateSurfaces>;
  
  // Valeurs calculées
  valeurs: ReturnType<typeof calculateValeurs>;
  
  // Capital visibilité
  capitalResult: ReturnType<typeof calculateCapitalVisibilite>;
  
  // Mode luxe
  luxResult: ReturnType<typeof calculateLuxMode>;
  luxCopy: ReturnType<typeof getLuxCopy>;
  
  // Contraintes projet
  niveauContrainte: number;
  hasProjetAchat: boolean;
  
  // Phases
  phaseDurees: PhaseDurees;
  pauseRecalibrage: number;
  
  // Pagination
  totalPages: number;
  photoPagesCount: number;
  comparablesEnAnnexe: boolean;
}

/**
 * Prépare toutes les données nécessaires pour le PDF
 */
function preparePDFData(data: EstimationData): PreparedPDFData {
  const dateNow = new Date();
  const dateStr = formatDateCH(dateNow);
  const heureStr = dateNow.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
  const refId = data.id?.slice(0, 8).toUpperCase() || 'DRAFT';
  
  // Extraction données (utilise les noms de propriétés corrects de EstimationData)
  const identification = (data.identification || {}) as any;
  const caracteristiques = (data.caracteristiques || {}) as any;
  const preEstimation = (data.preEstimation || {}) as any;
  const analyseTerrain = (data.analyseTerrain || {}) as any;
  const historique = identification?.historique || {};
  const photos = (data.photos || {}) as any;
  
  // Type de bien
  const typeBienRaw = data.typeBien || 'appartement';
  const isAppartement = typeBienRaw === 'appartement';
  const isMaison = typeBienRaw === 'maison';
  const typeBien = isAppartement ? 'Appartement' : (isMaison ? 'Maison' : '-');
  
  // Calcul surfaces
  const surfaces = calculateSurfaces(caracteristiques, preEstimation, isAppartement);
  
  // Surface habitable pour luxMode
  const surfaceHab = isAppartement ? surfaces.surfacePonderee : surfaces.surfaceHabMaison;
  const surfaceTerrain = surfaces.surfaceTerrain;
  
  // Calcul valeurs
  const valeurs = calculateValeurs(surfaces, caracteristiques, preEstimation, isAppartement);
  
  // Calcul capital visibilité
  const capitalResult = calculateCapitalVisibilite(historique, valeurs.totalVenaleArrondi);
  
  // Calcul mode luxe (8 arguments)
  const luxResult = calculateLuxMode(
    caracteristiques,
    identification?.contexte || {},
    historique,
    isAppartement,
    isMaison,
    surfaceHab,
    surfaceTerrain,
    valeurs.totalVenaleArrondi
  );
  const luxCopy = getLuxCopy(luxResult.luxMode);
  
  // Contraintes projet
  const projetPV = identification?.projetPostVente || {};
  const hasProjetAchat = projetPV.nature === 'achat';
  const niveauContrainte = calculateNiveauContrainte(projetPV);
  
  // Pause recalibrage
  const pauseRecalibrage = calculatePauseRecalibrage(historique);
  
  // Ajustements projet
  const ajustements = calculerAjustementsProjet(
    hasProjetAchat,
    niveauContrainte,
    projetPV.flexibilite || '',
    projetPV.toleranceVenteRapide || false,
    projetPV.toleranceVenteLongue || false
  );
  
  // Phases de base
  const strategiePitch = (data.strategiePitch || {}) as any;
  const phaseDureesBase = strategiePitch.phaseDurees || { phase0: 1, phase1: 3, phase2: 2, phase3: 10 };
  
  // Date de début
  const dateDebut = strategiePitch.dateDebut ? new Date(strategiePitch.dateDebut) : getNextMonday();
  const dateVenteIdeale = strategiePitch.dateVenteIdeale || '';
  const hasDateAchatFixe = hasProjetAchat && niveauContrainte >= 4;
  const useAutoCalcul = dateVenteIdeale && !hasDateAchatFixe;
  
  // Calcul phases finales
  let phaseDurees: PhaseDurees;
  
  if (useAutoCalcul) {
    const dureeTotal = getDureeJusquaDate(dateDebut, dateVenteIdeale);
    if (dureeTotal !== null) {
      phaseDurees = calculerPhasesAuto(dureeTotal, pauseRecalibrage);
    } else {
      phaseDurees = {
        phase0: Math.max(1, (phaseDureesBase.phase0 || 1) + pauseRecalibrage + ajustements.phase0),
        phase1: Math.max(1, (phaseDureesBase.phase1 || 3) + ajustements.phase1),
        phase2: Math.max(1, (phaseDureesBase.phase2 || 2) + ajustements.phase2),
        phase3: Math.max(4, (phaseDureesBase.phase3 || 10) + ajustements.phase3)
      };
    }
  } else {
    phaseDurees = {
      phase0: Math.max(1, (phaseDureesBase.phase0 || 1) + pauseRecalibrage + ajustements.phase0),
      phase1: Math.max(1, (phaseDureesBase.phase1 || 3) + ajustements.phase1),
      phase2: Math.max(1, (phaseDureesBase.phase2 || 2) + ajustements.phase2),
      phase3: Math.max(4, (phaseDureesBase.phase3 || 10) + ajustements.phase3)
    };
  }
  
  // Pagination
  const photoItems = photos?.items || [];
  const photosCount = photoItems.length;
  const photoPagesCount = photosCount > 0 ? Math.ceil(photosCount / 9) : 0;
  
  const compVendus = preEstimation?.comparablesVendus || [];
  const compEnVente = preEstimation?.comparablesEnVente || [];
  const comparablesEnAnnexe = compVendus.length > 7 || compEnVente.length > 7;
  
  // Pages de base: Couverture + Qui est GARY + Caractéristiques + Stratégie + Annexe Tech 1 + Annexe Tech 2 = 6
  const totalPages = 6 + (comparablesEnAnnexe ? 1 : 0) + photoPagesCount;
  
  return {
    dateNow,
    dateStr,
    heureStr,
    refId,
    typeBien,
    isAppartement,
    isMaison,
    surfaces,
    valeurs,
    capitalResult,
    luxResult,
    luxCopy,
    niveauContrainte,
    hasProjetAchat,
    phaseDurees,
    pauseRecalibrage,
    totalPages,
    photoPagesCount,
    comparablesEnAnnexe
  };
}

// ==================== GÉNÉRATION PDF ====================

/**
 * Génère le PDF complet GARY
 */
export function generatePDF(
  data: EstimationData,
  options: PDFGeneratorOptions = {}
): string | void {
  const { openInNewWindow = true, returnHtml = false } = options;
  
  // Préparer les données
  const preparedData = preparePDFData(data);
  
  // Extraction des données brutes pour les générateurs
  const identification = (data.identification || {}) as any;
  const caracteristiques = (data.caracteristiques || {}) as any;
  const preEstimation = (data.preEstimation || {}) as any;
  const analyseTerrain = (data.analyseTerrain || {}) as any;
  const photos = (data.photos || {}) as any;
  const strategiePitch = (data.strategiePitch || {}) as any;
  const bien = identification?.adresse || {};
  
  // Démarrer le HTML
  let html = '';
  html += '<!DOCTYPE html><html><head><meta charset="UTF-8">';
  html += '<title>GARY - Estimation ' + val(identification?.vendeur?.nom) + '</title>';
  html += '<style>';
  html += getPdfStyles();
  html += '</style></head><body>';
  
  // === PAGE 1: COUVERTURE ===
  html += generateCoverPage({
    typeBien: preparedData.typeBien,
    isAppartement: preparedData.isAppartement,
    sousType: caracteristiques?.sousType,
    adresse: bien?.rue || data.adresse,
    codePostal: bien?.codePostal || data.codePostal,
    localite: bien?.localite || data.localite,
    surfacePrincipale: preparedData.isAppartement 
      ? preparedData.surfaces.surfacePonderee 
      : preparedData.surfaces.surfaceHabMaison,
    nbPieces: caracteristiques?.nombrePieces,
    anneeConstruction: caracteristiques?.anneeConstruction,
    etage: caracteristiques?.etage,
    nbEtages: caracteristiques?.nombreEtagesImmeuble
  });
  
  // === PAGE 2: QUI EST GARY ===
  html += generateGaryPage({
    pageNumber: 2,
    totalPages: preparedData.totalPages
  });
  
  // === PAGE 3: CARACTÉRISTIQUES ===
  html += generateCaracteristiquesPage(data, {
    pageNum: 3,
    totalPages: preparedData.totalPages,
    refId: preparedData.refId
  });
  
  // === PAGE 4: STRATÉGIE ===
  html += generateStrategiePage(data, {
    pageNum: 4,
    totalPages: preparedData.totalPages,
    refId: preparedData.refId
  });
  
  // === PAGES 5-6: ANNEXE TECHNIQUE (passées ensemble) ===
  html += generateAnnexeTechnique1(data, {
    pageNum1: 5,
    pageNum2: 6,
    totalPages: preparedData.totalPages,
    refId: preparedData.refId
  });
  
  html += generateAnnexeTechnique2(data, {
    pageNum1: 5,
    pageNum2: 6,
    totalPages: preparedData.totalPages,
    refId: preparedData.refId
  });
  
  // === PAGES COMPARABLES (optionnel) ===
  if (preparedData.comparablesEnAnnexe) {
    html += generateComparablesAnnexePage(data, {
      pageNum: 7,
      totalPages: preparedData.totalPages,
      refId: preparedData.refId
    });
  }
  
  // === PAGES PHOTOS (optionnel) ===
  const photoItems = photos?.items || [];
  if (photoItems.length > 0) {
    const startPageNum = preparedData.comparablesEnAnnexe ? 8 : 7;
    html += generatePhotosPages(photoItems, {
      startPageNum,
      totalPages: preparedData.totalPages,
      refId: preparedData.refId
    });
  }
  
  // === PAGE CARTE (optionnel) ===
  const adresse = identification?.adresse || {};
  const hasMapCoords = adresse?.coordinates?.lat && adresse?.coordinates?.lng;
  if (hasMapCoords) {
    html += generateMapPage(data, {
      pageNum: preparedData.totalPages,
      totalPages: preparedData.totalPages,
      refId: preparedData.refId
    });
  }
  
  // Script d'impression automatique
  html += '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script>';
  html += '</body></html>';
  
  // Retourner ou ouvrir
  if (returnHtml) {
    return html;
  }
  
  if (openInNewWindow) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }
}

/**
 * Export par défaut
 */
export default generatePDF;
