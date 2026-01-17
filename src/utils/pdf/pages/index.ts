/**
 * Export centralisé des générateurs de pages PDF GARY
 */

export { getPdfStyles } from './pdfStyles';
export { generateCoverPage } from './pageCover';
export { generateGaryPage } from './pageGary';

// Les autres pages seront ajoutées dans les étapes suivantes :
// - pageSynthese.ts (page 1 - synthèse bien + prix)
// - pageCaracteristiques.ts (page 2 - détails + calculs)
// - pageStrategie.ts (page 3 - timeline + stratégie)
// - pagePhotos.ts (pages photos dynamiques)
// - pageComparables.ts (annexe comparables)
