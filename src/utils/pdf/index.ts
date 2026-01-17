/**
 * Export centralisé des utilitaires PDF GARY
 */

// Icônes SVG
export { ico, availableIcons } from './pdfIcons';
export type { IconName } from './pdfIcons';

// Logos GARY
export { logoWhite, logoRed, getLogo } from './pdfLogos';

// Formatters
export {
  val,
  formatPrice,
  formatPriceShort,
  formatDateCH,
  formatTimeCH,
  roundTo5000,
  parseNumber,
  getNextMonday,
  addWeeks,
  formatWeekOf,
  portailsLabels,
  dureeLabels,
  typeDiffusionLabels,
  raisonEchecLabels,
  nuisanceLabels,
  renoLabels,
  travLabels,
  sousTypeLabels,
  zoneLabels,
  buanderieLabels,
  motifLabels,
  chauffageLabels,
  etatLabels,
  expositionLabels,
  standingLabels,
  horizonLabels,
  mandatLabels,
  cecbLabels
} from './pdfFormatters';

// Calculs métier
export {
  calculateCapitalVisibilite,
  calculateLuxMode,
  getLuxCopy,
  calculateSurfaces,
  calculateValeurs,
  calculateNiveauContrainte,
  calculatePauseRecalibrage
} from './pdfCalculs';

export type {
  CapitalVisibiliteResult,
  LuxModeResult,
  SurfacesCalculees,
  ValeursCalculees,
  LuxCopy
} from './pdfCalculs';

// Générateur PDF principal
export { generatePDF, calculerPhasesAuto, getDureeJusquaDate, calculerAjustementsProjet } from './pdfGenerator';
export { default as pdfGenerator } from './pdfGenerator';
