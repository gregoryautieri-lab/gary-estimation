/**
 * Export centralisé des générateurs de pages PDF GARY
 */

export { getPdfStyles } from './pdfStyles';
export { generateCoverPage } from './pageCover';
export { generateGaryPage } from './pageGary';
export { generateCaracteristiquesPage } from './pageCaracteristiques';
export { generateStrategiePage } from './pageStrategie';
export { generateComparablesSection, generateComparablesAnnexePage } from './pageComparables';
export { generatePhotosPages, generateMapPage } from './pagePhotos';
export type { PhotoItem } from './pagePhotos';
export { generateAnnexeTechnique1, generateAnnexeTechnique2 } from './pageAnnexeTechnique';
