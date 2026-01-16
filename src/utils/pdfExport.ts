import jsPDF from "jspdf";
import { EstimationData, PDFConfig, Photo, PHOTO_CATEGORIES, getCategorieConfig, COURTIERS_GARY, getCourtierById } from "@/types/estimation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ============================================
// Utilitaire d'export PDF pour les estimations GARY
// Version 2.0 - Style "On pilote, vous décidez"
// ============================================

const GARY_RED = "#FA4238";
const GARY_DARK = "#1a2e35";
const GARY_SLOGAN = "On pilote, vous decidez.";

// Chiffres de crédibilité GARY (à mettre à jour régulièrement)
const GARY_STATS = {
  vues2025: "6.6M+",
  communaute: "40K+",
  noteGoogle: "5.0",
  nbAvis: 91,
  delaiMoyenMois: 3.5
};

interface GeneratePDFOptions {
  estimation: EstimationData;
  config?: Partial<PDFConfig>;
}

// ============================================
// CONTEXTE PDF PARTAGÉ
// ============================================
interface PDFContext {
  doc: jsPDF;
  estimation: EstimationData;
  config: PDFConfig;
  pageWidth: number;
  pageHeight: number;
  marginLeft: number;
  marginRight: number;
  contentWidth: number;
}

// ============================================
// INTERFACES POUR PDF INTELLIGENT
// ============================================

interface PDFIcons {
  surface: string;
  pieces: string;
  chambres: string;
  etage: string;
  terrain: string;
  construction: string;
  luminosite: string;
  calme: string;
  volumes: string;
  bus: string;
  train: string;
  ecole: string;
  commerce: string;
  sante: string;
  nature: string;
  checkCircle: string;
  alertCircle: string;
  info: string;
  shield: string;
  users: string;
  star: string;
  edit: string;
  refresh: string;
  xCircle: string;
  sparkles: string;
  target: string;
  trendingUp: string;
  flame: string;
  lock: string;
  clock: string;
  rocket: string;
  globe: string;
  megaphone: string;
  heart: string;
  camera: string;
  video: string;
  share: string;
  mapPin: string;
  user: string;
  phone: string;
  mail: string;
  check: string;
  x: string;
  minus: string;
  circle: string;
  arrowRight: string;
  file: string;
  home: string;
  key: string;
  eye: string;
  zap: string;
  mountain: string;
  tree: string;
  [key: string]: string;
}

interface PDFHelpers {
  formatPrice: (n: number | null | undefined) => string;
  ico: (name: string, size?: number, color?: string) => string;
  val: (v: any, suffix?: string) => string;
  cleanEmoji: (text: string) => string;
  safeText: (doc: jsPDF, text: string, x: number, y: number, options?: any) => void;
}

// ============================================
// FONCTION ICO - GÉNÉRATION ICÔNES SVG
// ============================================

const createIco = (): PDFHelpers['ico'] => {
  const icons: PDFIcons = {
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
    sante: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/>',
    nature: '<path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9Z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9Z"/><path d="M12 13V2"/><path d="M9 5.5c.78-.78 2.22-.78 3 0 .78.78.78 2.22 0 3-.78.78-2.22.78-3 0-.78-.78-.78-2.22 0-3Z"/>',
    
    // États
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    alertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
    
    // Timeline/Stratégie
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    megaphone: '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    
    // Canaux
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    video: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    
    // Autres
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    circle: '<circle cx="12" cy="12" r="10"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    key: '<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    tree: '<path d="M12 2v20"/><path d="m15 5-3 3-3-3"/><path d="m18 9-3 3-3-3"/><path d="m21 13-3 3-3-3"/>'
  };

  return (name: string, size: number = 20, color: string = '#64748b'): string => {
    const path = icons[name] || icons.circle;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  };
};

// ============================================
// HELPERS PDF INTELLIGENTS
// ============================================

const createHelpers = (): PDFHelpers => {
  const ico = createIco();
  
  return {
    formatPrice: (n: number | null | undefined): string => {
      if (!n || isNaN(n)) return "—";
      return Math.round(n).toLocaleString('fr-CH') + " CHF";
    },
    
    ico,
    
    val: (v: any, suffix: string = ''): string => {
      if (v === undefined || v === null || v === '') return '—';
      return v + suffix;
    },
    
    cleanEmoji: (text: string): string => {
      return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    },
    
    safeText: (doc: jsPDF, text: string, x: number, y: number, options: any = {}): void => {
      try {
        const cleanedText = (text || '').toString().replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
        const sanitized = sanitizeText(cleanedText);
        if (options.align) {
          doc.text(sanitized, x, y, { align: options.align });
        } else {
          doc.text(sanitized, x, y);
        }
      } catch (e) {
        console.warn('safeText error:', e);
      }
    }
  };
};

function createPDFContext(doc: jsPDF, estimation: EstimationData, config: PDFConfig): PDFContext {
  return {
    doc,
    estimation,
    config,
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    marginLeft: 20,
    marginRight: 20,
    contentWidth: doc.internal.pageSize.getWidth() - 40
  };
}

function addFooter(doc: jsPDF, currentPage: number, totalPages: number, estimationId?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerY = doc.internal.pageSize.getHeight() - 12;
  
  if (currentPage > 1) {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(20, footerY - 3, pageWidth - 20, footerY - 3);
    
    doc.setFontSize(8);
    doc.setTextColor(26, 46, 53);
    doc.setFont("helvetica", "bold");
    doc.text("GARY", 20, footerY + 1);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Courtiers Immobiliers", 32, footerY + 1);
  }
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Page ${currentPage}/${totalPages}`, pageWidth / 2, footerY + 1, { align: "center" });
  
  if (currentPage > 1) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("On pilote, vous decidez.", pageWidth - 20, footerY + 1, { align: "right" });
  }
  
  if (currentPage === totalPages) {
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    
    const disclaimerText = "Estimation non contractuelle etablie selon les donnees fournies et l'etat apparent du bien. Validite : 3 mois. Document confidentiel.";
    doc.text(disclaimerText, pageWidth / 2, footerY + 5, { align: "center" });
  }
}

function addFootersToAllPages(doc: jsPDF, estimationId?: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount, estimationId);
  }
}

const defaultConfig: PDFConfig = {
  inclurePhotos: true,
  inclureCarte: false,
  inclureComparables: true,
  inclureTimeline: true,
  inclurePitch: true,
  formatCouverture: "standard",
  langue: "fr",
};

// ============================================
// FONCTION CRITIQUE : Normalise le texte pour jsPDF
// Évite les problèmes d'encodage avec Helvetica
// ============================================
function sanitizeText(text: string): string {
  if (!text) return "";
  
  // Remplace les caractères problématiques par leurs équivalents ASCII
  return text
    // Guillemets et apostrophes
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    // Tirets spéciaux
    .replace(/[–—]/g, "-")
    // Espaces insécables
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    // Points de suspension
    .replace(/…/g, "...")
    // Fractions
    .replace(/½/g, "1/2")
    .replace(/¼/g, "1/4")
    .replace(/¾/g, "3/4")
    // Symboles monétaires (garder CHF)
    .replace(/€/g, "EUR")
    // Flèches
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↑/g, "^")
    .replace(/↓/g, "v");
}

// Wrapper sécurisé pour doc.text qui réinitialise la police
function safeText(doc: jsPDF, text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }) {
  const sanitized = sanitizeText(text);
  doc.text(sanitized, x, y, options);
}

// Format prix CHF - version sécurisée
const formatPrix = (prix: number): string => {
  // Formater avec apostrophe comme séparateur de milliers (style suisse)
  const formatted = Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return formatted + " CHF";
};

// Espacements standard pour cohérence
const SPACE = {
  afterSectionHeader: 10,
  betweenItems: 6,
  afterBlock: 12,
  beforeNewSection: 18,
  lineHeight: 5
};

// Affiche un header de section avec ligne décorative rouge
function addSectionHeader(
  doc: jsPDF,
  title: string,
  yPos: number,
  marginLeft: number
): number {
  // Ligne décorative rouge
  doc.setDrawColor(250, 66, 56); // GARY_RED
  doc.setLineWidth(2);
  doc.line(marginLeft, yPos, marginLeft + 30, yPos);
  
  // Titre section - réinitialiser la police proprement
  doc.setTextColor(26, 46, 53); // GARY_DARK
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  safeText(doc, title, marginLeft, yPos + 8);
  
  return yPos + 16;
}

// Charger et COMPRESSER une image depuis URL (max 800px, JPEG 70%)
async function loadImageAsBase64(url: string, maxWidth: number = 800): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    
    // Créer une image pour compression
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Canvas pour compression
        const canvas = document.createElement('canvas');
        
        // Calculer nouvelles dimensions (max 800px de large)
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner image redimensionnée
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en base64 avec compression JPEG 70%
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        // Nettoyer
        URL.revokeObjectURL(objectUrl);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

// Sélectionne les meilleures photos pour le PDF (max N photos)
function selectionnerMeilleuresPhotos(photos: Photo[], max: number): Photo[] {
  if (photos.length <= max) return photos;
  
  // Priorité 1 : Photos favorites
  const favorites = photos.filter(p => p.favori);
  
  if (favorites.length >= max) {
    return favorites.slice(0, max);
  }
  
  // Compléter avec les autres par catégorie prioritaire
  const nonFavorites = photos.filter(p => !p.favori);
  const selected: Photo[] = [...favorites];
  
  // Prendre 1 photo de chaque catégorie prioritaire
  const categories = ['facade', 'salon', 'cuisine', 'chambre', 'sdb', 'jardin', 'vue', 'autre'];
  
  for (const cat of categories) {
    if (selected.length >= max) break;
    const photoCategorie = nonFavorites.find(p => p.categorie === cat && !selected.includes(p));
    if (photoCategorie) selected.push(photoCategorie);
  }
  
  // Si encore pas assez, prendre les premières restantes
  if (selected.length < max) {
    const reste = nonFavorites
      .filter(p => !selected.includes(p))
      .slice(0, max - selected.length);
    selected.push(...reste);
  }
  
  return selected;
}

// ============================================
// RENDER : COVER PAGE (Style Founex)
// ============================================
async function renderCoverPage(ctx: PDFContext): Promise<void> {
  const { doc, estimation, pageWidth, pageHeight, marginLeft } = ctx;
  const centerX = pageWidth / 2;
  let yPos = 0;

  // Photo de fond pleine page avec overlay gradient
  const photosRaw = estimation.photos;
  const photosArray: Photo[] = Array.isArray(photosRaw) 
    ? photosRaw 
    : (photosRaw && typeof photosRaw === 'object' ? Object.values(photosRaw) : []);
  const coverPhoto = photosArray.find(p => p.favori) || photosArray[0];
  const coverPhotoUrl = coverPhoto?.storageUrl || coverPhoto?.dataUrl;
  
  if (coverPhotoUrl) {
    try {
      doc.addImage(coverPhotoUrl, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      doc.setFillColor(20, 30, 35);
      doc.rect(0, 0, pageWidth, 60, "F");
      doc.rect(0, pageHeight - 80, pageWidth, 80, "F");
    } catch (e) {
      doc.setFillColor(26, 46, 53);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
    }
  } else {
    doc.setFillColor(26, 46, 53);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  }

  // === HEADER : Titre en 2 lignes (style Founex) ===
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  safeText(doc, "Votre strategie de vente", marginLeft, 25);
  
  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  safeText(doc, "sur mesure", marginLeft, 42);
  
  // === STATS GARY (seulement 2 stats) ===
  const statsRightX = pageWidth - ctx.marginRight;
  const statsTopY = 18;
  const statLineHeight = 14;
  
  const mainStats = [
    { value: GARY_STATS.vues2025, label: "VUES EN 2025" },
    { value: `${GARY_STATS.noteGoogle} ★`, label: `(${GARY_STATS.nbAvis} AVIS) GOOGLE` }
  ];
  
  mainStats.forEach((stat, idx) => {
    const yLine = statsTopY + (idx * statLineHeight);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    safeText(doc, stat.value, statsRightX, yLine, { align: "right" });
    
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    safeText(doc, stat.label, statsRightX - 25, yLine, { align: "right" });
  });

  // === BADGE TYPE DE BIEN (centré) ===
  yPos = 100;
  
  const caracCover = estimation.caracteristiques;
  const typeBienCover = caracCover?.typeBien || estimation.typeBien || "bien";
  const sousTypeCover = caracCover?.sousType || "";
  
  const typeClean = typeBienCover.toUpperCase().replace(/_/g, " ");
  const sousTypeClean = sousTypeCover.toUpperCase().replace(/_/g, " ");
  
  const addLetterSpacing = (text: string) => text.split("").join(" ");
  let badgeLabel = addLetterSpacing(typeClean);
  if (sousTypeClean) {
    badgeLabel += "  •  " + addLetterSpacing(sousTypeClean);
  }
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const badgeTextWidth = doc.getTextWidth(badgeLabel) * 0.35;
  const badgePadding = 12;
  const badgeWidth = badgeTextWidth + badgePadding * 2;
  
  doc.setFillColor(40, 60, 70);
  doc.roundedRect(centerX - badgeWidth / 2, yPos, badgeWidth, 10, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  safeText(doc, badgeLabel, centerX, yPos + 7, { align: "center" });

  // === ADRESSE DU BIEN (centrée, grande) ===
  const adresse = estimation.identification?.adresse;
  yPos += 22;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  safeText(doc, adresse?.rue || "", centerX, yPos, { align: "center" });
  
  yPos += 12;
  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  safeText(doc, `${adresse?.codePostal || ""} ${adresse?.localite || ""}`, centerX, yPos, { align: "center" });

  // === TABLEAU RÉSUMÉ DU BIEN (centré) ===
  yPos += 25;
  
  const surfaceHabCover = parseFloat(caracCover?.surfaceHabitableMaison || caracCover?.surfacePPE || "0") || 0;
  const nbChambresCover = parseInt(caracCover?.nombreChambres || "0") || 0;
  const nbSdbCover = parseInt(caracCover?.nombreSDB || "0") || 0;
  const surfaceExtCover = (parseFloat(caracCover?.surfaceBalcon || "0") || 0) + 
                          (parseFloat(caracCover?.surfaceTerrasse || "0") || 0) + 
                          (parseFloat(caracCover?.surfaceJardin || "0") || 0);
  
  const tableWidth = 160;
  const tableLeft = centerX - tableWidth / 2;
  const colWidthCover = tableWidth / 4;
  
  const tableData = [
    { value: `${surfaceHabCover}`, unit: "m²", label: "SURFACE" },
    { value: `${nbChambresCover}`, unit: "", label: "CHAMBRES" },
    { value: `${nbSdbCover}`, unit: "", label: "SDB" },
    { value: `${surfaceExtCover}`, unit: "m²", label: "EXTERIEUR" }
  ];
  
  doc.setFillColor(30, 50, 60);
  doc.roundedRect(tableLeft, yPos, tableWidth, 30, 4, 4, "F");
  
  tableData.forEach((col, idx) => {
    const xPos = tableLeft + (idx * colWidthCover) + colWidthCover / 2;
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const valueText = col.unit ? `${col.value} ${col.unit}` : col.value;
    safeText(doc, valueText, xPos, yPos + 13, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    safeText(doc, col.label, xPos, yPos + 23, { align: "center" });
    
    if (idx < tableData.length - 1) {
      doc.setDrawColor(60, 80, 90);
      doc.setLineWidth(0.3);
      doc.line(tableLeft + (idx + 1) * colWidthCover, yPos + 6, tableLeft + (idx + 1) * colWidthCover, yPos + 24);
    }
  });

  // === POINTS FORTS (liste verticale avec puces rouges) ===
  yPos += 45;
  
  const pointsFortsCover = estimation.analyseTerrain?.pointsForts || [];
  
  if (pointsFortsCover.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const displayPoints = pointsFortsCover.slice(0, 4);
    const lineHeight = 10;
    const listStartY = yPos;
    
    displayPoints.forEach((point, idx) => {
      const pointY = listStartY + (idx * lineHeight);
      
      doc.setFillColor(250, 66, 56);
      doc.rect(centerX - 60, pointY - 3, 4, 4, "F");
      
      doc.setTextColor(255, 255, 255);
      safeText(doc, point, centerX - 52, pointY);
    });
  }
  
  // Footer cover géré par addFootersToAllPages
}

// ============================================
// PAGE MÉTHODOLOGIE D'ESTIMATION
// ============================================

async function renderMethodologyPage(ctx: PDFContext): Promise<void> {
  const { doc, estimation, pageWidth, pageHeight } = ctx;
  const helpers = createHelpers();
  const { formatPrice } = helpers;

  // Données estimation (with any type for flexibility)
  const pre: any = estimation.preEstimation || {};
  const carac: any = estimation.caracteristiques || {};
  const isAppartement = carac.typeBien === 'appartement';

  // Calculs de base
  const surfacePonderee = isAppartement ? (parseFloat(carac.surfacePPE || '0') || 0) : 0;
  const surfaceTerrain = parseFloat(carac.surfaceTerrain || '0') || 0;
  const surfaceHabMaison = parseFloat(carac.surfaceHabitableMaison || '0') || 0;
  const cubage = parseFloat(pre.cubageManuel || '0') || (surfaceHabMaison * 3.1);

  const nbPlaceInt = parseInt(carac.parkingInterieur || '0') || 0;
  const nbPlaceExt = parseInt(carac.parkingExterieur || '0') || 0;
  const nbBox = parseInt(carac.box || '0') || 0;
  const hasCave = carac.cave === true ? 1 : 0;

  // Prix unitaires
  const prixM2 = parseFloat(pre.prixM2 || '0') || 0;
  const prixM2Terrain = parseFloat(pre.prixM2Terrain || '0') || 0;
  const prixM3 = parseFloat(pre.prixM3 || '0') || 0;
  const prixM2Amenagement = parseFloat(pre.prixM2Amenagement || '0') || 0;
  const prixPlaceInt = parseFloat(pre.prixPlaceInt || '0') || 0;
  const prixPlaceExt = parseFloat(pre.prixPlaceExt || '0') || 0;
  const prixBox = parseFloat(pre.prixBox || '0') || 0;
  const prixCave = parseFloat(pre.prixCave || '0') || 0;

  // Valeurs calculées
  const valeurSurface = surfacePonderee * prixM2;
  const valeurTerrain = surfaceTerrain * prixM2Terrain;
  const valeurCubage = cubage * prixM3;
  const valeurPlaceInt = nbPlaceInt * prixPlaceInt;
  const valeurPlaceExt = nbPlaceExt * prixPlaceExt;
  const valeurBox = nbBox * prixBox;
  const valeurCave = hasCave * prixCave;

  // Aménagements extérieurs (maisons)
  const nbNiveaux = parseInt(carac.nombreNiveaux || '1') || 1;
  const surfaceAuSol = nbNiveaux > 0 ? surfaceHabMaison / nbNiveaux : 0;
  const surfaceAmenagement = Math.max(0, surfaceTerrain - surfaceAuSol);
  const valeurAmenagement = surfaceAmenagement * prixM2Amenagement;

  // Lignes supplémentaires
  const lignesSuppList = pre.lignesSupp || [];
  const valeurLignesSupp = lignesSuppList.reduce((sum: number, l: any) => sum + (parseFloat(l.prix) || 0), 0);

  // Annexes (maisons)
  const annexesList = pre.annexes || [];
  const valeurAnnexes = annexesList.reduce((sum: number, a: any) => sum + (parseFloat(a.prix) || 0), 0);

  // Total vénale
  const totalVenale = isAppartement
    ? valeurSurface + valeurPlaceInt + valeurPlaceExt + valeurBox + valeurCave + valeurLignesSupp
    : valeurTerrain + valeurCubage + valeurAmenagement + valeurAnnexes;

  const totalVenaleArrondi = Math.ceil(totalVenale / 5000) * 5000;

  // Fourchette de négociation
  const prixEntre = Math.ceil(totalVenaleArrondi * 0.97 / 5000) * 5000;
  const prixEt = Math.ceil(totalVenaleArrondi * 1.03 / 5000) * 5000;

  // Valeur rendement
  const loyerMensuel = parseFloat(pre.loyerActuelMensuel || '0') || 0;
  const loyerAnnuel = loyerMensuel * 12;
  const tauxCapi = (parseFloat(pre.tauxCapitalisation || '2.5') || 2.5) / 100;
  const valeurRendement = tauxCapi > 0 ? Math.ceil((loyerAnnuel / tauxCapi) / 5000) * 5000 : 0;

  // Valeur de gage
  const valeurGage = (2 * totalVenaleArrondi + valeurRendement) / 3;
  const valeurGageArrondi = Math.ceil(valeurGage / 5000) * 5000;

  // Nouvelle page
  doc.addPage();

  // Header
  doc.setFillColor(26, 46, 53);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GARY', 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Annexe : Methodologie', pageWidth - 20, 25, { align: 'right' });

  let yPos = 50;

  // Fourchette de négociation
  doc.setFillColor(248, 250, 252);
  doc.rect(0, yPos, pageWidth, 20, 'F');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('FOURCHETTE', pageWidth / 2 - 60, yPos + 12);
  doc.setFontSize(14);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPrice(prixEntre), pageWidth / 2 - 20, yPos + 12);
  doc.setFontSize(12);
  doc.setTextColor(209, 213, 219);
  doc.text('->', pageWidth / 2 + 25, yPos + 12);
  doc.setFontSize(14);
  doc.setTextColor(26, 46, 53);
  doc.text(formatPrice(prixEt), pageWidth / 2 + 35, yPos + 12);

  yPos += 25;

  // Les 3 valeurs - Grille compacte
  doc.setFillColor(255, 255, 255);
  doc.rect(0, yPos, pageWidth, 50, 'F');

  const cardWidth = (pageWidth - 60) / 3;
  const cardX = [20, 20 + cardWidth + 10, 20 + 2 * cardWidth + 20];

  // Valeur Vénale
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(cardX[0], yPos + 10, cardWidth, 35, 3, 3, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(cardX[0], yPos + 10, cardWidth, 35, 3, 3, 'S');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('VENALE', cardX[0] + cardWidth / 2, yPos + 20, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPrice(totalVenaleArrondi), cardX[0] + cardWidth / 2, yPos + 30, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text('Base de calcul', cardX[0] + cardWidth / 2, yPos + 38, { align: 'center' });

  // Valeur Rendement
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(cardX[1], yPos + 10, cardWidth, 35, 3, 3, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(cardX[1], yPos + 10, cardWidth, 35, 3, 3, 'S');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('RENDEMENT', cardX[1] + cardWidth / 2, yPos + 20, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPrice(valeurRendement), cardX[1] + cardWidth / 2, yPos + 30, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  const tauxText = `Taux ${(tauxCapi * 100).toFixed(1)}% - ${formatPrice(loyerMensuel)}/mois`;
  doc.text(tauxText, cardX[1] + cardWidth / 2, yPos + 38, { align: 'center' });

  // Valeur de Gage
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(cardX[2], yPos + 10, cardWidth, 35, 3, 3, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(cardX[2], yPos + 10, cardWidth, 35, 3, 3, 'S');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('GAGE', cardX[2] + cardWidth / 2, yPos + 20, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPrice(valeurGageArrondi), cardX[2] + cardWidth / 2, yPos + 30, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text('Ref. bancaire', cardX[2] + cardWidth / 2, yPos + 38, { align: 'center' });

  yPos += 60;

  // Tableau détaillé du calcul
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAIL DU CALCUL', 20, yPos);

  yPos += 8;

  // En-tête tableau
  doc.setFillColor(26, 46, 53);
  doc.rect(20, yPos, pageWidth - 40, 12, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ELEMENT', 25, yPos + 8);
  doc.text('QUANTITE', pageWidth / 2 - 30, yPos + 8, { align: 'center' });
  doc.text('PRIX UNITAIRE', pageWidth / 2 + 20, yPos + 8, { align: 'center' });
  doc.text('MONTANT', pageWidth - 30, yPos + 8, { align: 'right' });

  yPos += 12;

  // Lignes du tableau
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let rowIndex = 0;

  const addTableRow = (label: string, quantity: string, unitPrice: string, amount: number, isTotal: boolean = false) => {
    if (isTotal) {
      doc.setFillColor(26, 46, 53);
      doc.rect(20, yPos, pageWidth - 40, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPos + 8);
      doc.setTextColor(255, 69, 57);
      doc.text(formatPrice(amount), pageWidth - 30, yPos + 8, { align: 'right' });
    } else {
      doc.setFillColor(rowIndex % 2 === 0 ? 249 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 251 : 255);
      doc.rect(20, yPos, pageWidth - 40, 10, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(20, yPos + 10, pageWidth - 20, yPos + 10);
      doc.setTextColor(26, 46, 53);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 25, yPos + 7);
      doc.text(quantity, pageWidth / 2 - 30, yPos + 7, { align: 'center' });
      doc.text(unitPrice, pageWidth / 2 + 20, yPos + 7, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatPrice(amount), pageWidth - 30, yPos + 7, { align: 'right' });
      rowIndex++;
    }
    yPos += isTotal ? 12 : 10;
  };

  if (isAppartement) {
    // APPARTEMENT
    addTableRow('Surface ponderee', `${surfacePonderee.toFixed(1)} m2`, formatPrice(prixM2), valeurSurface);
    if (nbPlaceInt > 0) addTableRow('Places interieures', nbPlaceInt.toString(), formatPrice(prixPlaceInt), valeurPlaceInt);
    if (nbPlaceExt > 0) addTableRow('Places exterieures', nbPlaceExt.toString(), formatPrice(prixPlaceExt), valeurPlaceExt);
    if (nbBox > 0) addTableRow('Box ferme', nbBox.toString(), formatPrice(prixBox), valeurBox);
    if (hasCave > 0) addTableRow('Cave', '1', formatPrice(prixCave), valeurCave);

    lignesSuppList.forEach((l: any) => {
      if (l.libelle && l.prix) {
        addTableRow(l.libelle, '-', '-', parseFloat(l.prix));
      }
    });
  } else {
    // MAISON
    addTableRow('Terrain', `${surfaceTerrain.toFixed(0)} m2`, formatPrice(prixM2Terrain), valeurTerrain);
    addTableRow('Cubage construction', `${cubage.toFixed(0)} m3`, formatPrice(prixM3), valeurCubage);
    if (surfaceAmenagement > 0) {
      addTableRow('Amenagements ext.', `${surfaceAmenagement.toFixed(0)} m2`, formatPrice(prixM2Amenagement), valeurAmenagement);
    }

    annexesList.forEach((a: any) => {
      if (a.libelle && a.prix) {
        addTableRow(a.libelle, '-', '-', parseFloat(a.prix));
      }
    });
  }

  // Total
  addTableRow('VALEUR VENALE TOTALE', '', '', totalVenaleArrondi, true);

  yPos += 5;

  // Section comparables (simplifié pour ce prompt)
  const comparablesVendus = pre.comparablesVendus || [];
  const comparablesEnVente = pre.comparablesEnVente || [];

  if (comparablesVendus.length > 0 || comparablesEnVente.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('POSITIONNEMENT MARCHE', 20, yPos);
    yPos += 10;

    // Liste simple des comparables
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    if (comparablesVendus.length > 0) {
      doc.text('Transactions recentes', 20, yPos);
      yPos += 8;

      comparablesVendus.forEach((c: any) => {
        doc.setFontSize(8);
        doc.setTextColor(26, 46, 53);
        doc.setFont('helvetica', 'normal');
        doc.text(`- ${c.adresse || '-'}`, 25, yPos);
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text(c.prix || '-', pageWidth - 30, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    yPos += 5;

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'bold');
    if (comparablesEnVente.length > 0) {
      doc.text('Actuellement en vente', 20, yPos);
      yPos += 8;

      comparablesEnVente.forEach((c: any) => {
        doc.setFontSize(8);
        doc.setTextColor(26, 46, 53);
        doc.setFont('helvetica', 'normal');
        doc.text(`- ${c.adresse || '-'}`, 25, yPos);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'bold');
        doc.text(c.prix || '-', pageWidth - 30, yPos, { align: 'right' });
        yPos += 6;
      });
    }
  }
}

// ============================================
// PAGE ANNEXE TECHNIQUE 1/2
// ============================================
async function renderAnnexeTechnique1(ctx: PDFContext): Promise<void> {
  const { doc, estimation, pageWidth, pageHeight } = ctx;
  const helpers = createHelpers();
  const { formatPrice, ico, val } = helpers;

  // Données
  const vendeur = estimation.identification as any || {};
  const bien = estimation.identification as any || {};
  const carac = estimation.caracteristiques as any || {};
  const isAppartement = carac.typeBien === 'appartement';
  const isMaison = carac.typeBien === 'maison';

  // Helper pour afficher une valeur ou tiret
  const annexeVal = (v: any, suffix: string = ''): string => {
    if (v === undefined || v === null || v === '') return '-';
    return v + suffix;
  };

  // Nouvelle page
  doc.addPage();

  // Header
  doc.setFillColor(26, 46, 53);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GARY', 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Annexe Technique (1/2)', pageWidth - 20, 25, { align: 'right' });

  let yPos = 50;

  // === SECTION CONTACT VENDEUR ===
  doc.setFontSize(9);
  doc.setTextColor(255, 69, 57);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTACT VENDEUR', 20, yPos);
  yPos += 10;

  // Grid 3 colonnes
  const colWidth = (pageWidth - 60) / 3;

  // Nom
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, colWidth, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('NOM', 25, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  const nomComplet = [vendeur.vendeurNom, vendeur.vendeurPrenom].filter(Boolean).join(' ') || estimation.vendeurNom || '-';
  doc.text(annexeVal(nomComplet), 25, yPos + 15);

  // Téléphone
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30 + colWidth, yPos, colWidth, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('TELEPHONE', 35 + colWidth, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(vendeur.vendeurTelephone || estimation.vendeurTelephone), 35 + colWidth, yPos + 15);

  // Email
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40 + 2 * colWidth, yPos, colWidth, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('EMAIL', 45 + 2 * colWidth, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(vendeur.vendeurEmail || estimation.vendeurEmail), 45 + 2 * colWidth, yPos + 15);

  yPos += 30;

  // === SECTION ADRESSE CADASTRE ===
  doc.setFontSize(9);
  doc.setTextColor(255, 69, 57);
  doc.setFont('helvetica', 'bold');
  doc.text('ADRESSE & CADASTRE', 20, yPos);
  yPos += 10;

  // Grid 4 colonnes
  const col4Width = (pageWidth - 70) / 4;

  // Adresse complète - FIX
  const adresseText = (() => {
    const raw = bien.adresse || estimation.adresse;
    if (!raw) return '-';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
      return raw.rue || raw.adresse || String(raw) || '-';
    }
    return '-';
  })();
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, pageWidth - 40, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('ADRESSE', 25, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(adresseText, 25, yPos + 15);

  yPos += 25;

  // EGID, Parcelle, Zone, Niveaux
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('EGID', 25, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.egid), 25, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30 + col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('N PARCELLE', 35 + col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.numeroParcelle), 35 + col4Width, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40 + 2 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('ZONE', 45 + 2 * col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.zone), 45 + 2 * col4Width, yPos + 15);

  if (isMaison) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(50 + 3 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('NIVEAUX', 55 + 3 * col4Width, yPos + 8);
    doc.setFontSize(9);
    doc.setTextColor(26, 46, 53);
    doc.setFont('helvetica', 'bold');
    doc.text(annexeVal(carac.nombreNiveaux), 55 + 3 * col4Width, yPos + 15);
  }

  yPos += 30;

  // === SECTION CONFIGURATION ===
  doc.setFontSize(9);
  doc.setTextColor(255, 69, 57);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIGURATION', 20, yPos);
  yPos += 10;

  // Grid 4 colonnes: Pièces, Chambres, SDB, WC
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('PIECES', 25, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.nombrePieces), 25, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30 + col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('CHAMBRES', 35 + col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.nombreChambres), 35 + col4Width, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40 + 2 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('SALLES DE BAIN', 45 + 2 * col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.nombreSDB), 45 + 2 * col4Width, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(50 + 3 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('WC SEPARES', 55 + 3 * col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.nombreWC), 55 + 3 * col4Width, yPos + 15);

  yPos += 30;

  // === SECTION ÉTAGE (appartement) ===
  if (isAppartement) {
    doc.setFontSize(9);
    doc.setTextColor(255, 69, 57);
    doc.setFont('helvetica', 'bold');
    doc.text('ETAGE & IMMEUBLE', 20, yPos);
    yPos += 10;

    // Format étage
    const formatEtage = (val: any): string => {
      if (val === undefined || val === '') return '-';
      if (val == 0) return 'RDC';
      if (val == -1) return 'Sous-sol';
      if (val === 'rez-inf') return 'Rez-inferieur';
      if (val === 'rez-sup') return 'Rez-superieur';
      return val + 'e';
    };

    let etageText = formatEtage(carac.etage);
    if (carac.etageHaut) etageText += ' au ' + formatEtage(carac.etageHaut);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, yPos, col4Width, 20, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('ETAGE', 25, yPos + 8);
    doc.setFontSize(9);
    doc.setTextColor(26, 46, 53);
    doc.setFont('helvetica', 'bold');
    doc.text(etageText, 25, yPos + 15);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(30 + col4Width, yPos, col4Width, 20, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('ETAGES IMMEUBLE', 35 + col4Width, yPos + 8);
    doc.setFontSize(9);
    doc.setTextColor(26, 46, 53);
    doc.setFont('helvetica', 'bold');
    doc.text(annexeVal(carac.nombreEtagesImmeuble), 35 + col4Width, yPos + 15);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(40 + 2 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('ASCENSEUR', 45 + 2 * col4Width, yPos + 8);
    doc.setFontSize(9);
    doc.setTextColor(26, 46, 53);
    doc.setFont('helvetica', 'bold');
    const ascenseurText = carac.ascenseur === true ? 'Oui' : (carac.ascenseur === false ? 'Non' : '-');
    doc.text(ascenseurText, 45 + 2 * col4Width, yPos + 15);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(50 + 3 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('DERNIER ETAGE', 55 + 3 * col4Width, yPos + 8);
    doc.setFontSize(9);
    doc.setTextColor(26, 46, 53);
    doc.setFont('helvetica', 'bold');
    doc.text(carac.dernierEtage ? 'Oui' : 'Non', 55 + 3 * col4Width, yPos + 15);

    yPos += 30;
  }

  // === SECTION EXPOSITION & VUE ===
  doc.setFontSize(9);
  doc.setTextColor(255, 69, 57);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPOSITION & VUE', 20, yPos);
  yPos += 10;

  const col2Width = (pageWidth - 50) / 2;

  const expositionText = (carac.exposition || []).length > 0 ? carac.exposition.join(', ') : '-';

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, col2Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('EXPOSITION', 25, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(expositionText, 25, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30 + col2Width, yPos, col2Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('VUE', 35 + col2Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.vue), 35 + col2Width, yPos + 15);

  yPos += 30;

  // === SECTION ÉNERGIE & CHARGES ===
  doc.setFontSize(9);
  doc.setTextColor(255, 69, 57);
  doc.setFont('helvetica', 'bold');
  doc.text('ENERGIE & CHARGES', 20, yPos);
  yPos += 10;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('CECB', 25, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.cecb), 25, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30 + col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('VITRAGE', 35 + col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.vitrage), 35 + col4Width, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40 + 2 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('CHAUFFAGE', 45 + 2 * col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.chauffage), 45 + 2 * col4Width, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(50 + 3 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('CHARGES/MOIS', 55 + 3 * col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.chargesMensuelles, ' CHF'), 55 + 3 * col4Width, yPos + 15);

  yPos += 30;

  // === SECTION ANNEXES & STATIONNEMENT ===
  doc.setFontSize(9);
  doc.setTextColor(255, 69, 57);
  doc.setFont('helvetica', 'bold');
  doc.text('ANNEXES & STATIONNEMENT', 20, yPos);
  yPos += 10;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('PARKING INT.', 25, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.parkingInterieur ?? 0), 25, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30 + col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('PARKING EXT.', 35 + col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.parkingExterieur ?? 0), 35 + col4Width, yPos + 15);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40 + 2 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('BOX', 45 + 2 * col4Width, yPos + 8);
  doc.setFontSize(9);
  doc.setTextColor(26, 46, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(annexeVal(carac.box ?? 0), 45 + 2 * col4Width, yPos + 15);

  if (isAppartement) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(50 + 3 * col4Width, yPos, col4Width, 20, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('CAVE', 55 + 3 * col4Width, yPos + 8);
    doc.setFontSize(9);
    doc.setTextColor(26, 46, 53);
    doc.setFont('helvetica', 'bold');
    const caveText = carac.cave === true ? 'Oui' : (carac.cave === false ? 'Non' : '-');
    doc.text(caveText, 55 + 3 * col4Width, yPos + 15);
  }
}

// ============================================
// FONCTION PRINCIPALE : Génère le PDF
// ============================================
export async function generateEstimationPDF({
  estimation,
  config = {},
}: GeneratePDFOptions): Promise<jsPDF> {
  const finalConfig = { ...defaultConfig, ...config };
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Créer contexte partagé
  const ctx = createPDFContext(doc, estimation, finalConfig);
  
  // Variables locales pour compatibilité avec code existant
  let yPos = 0;
  const pageWidth = ctx.pageWidth;
  const pageHeight = ctx.pageHeight;
  const marginLeft = ctx.marginLeft;
  const marginRight = ctx.marginRight;
  const contentWidth = ctx.contentWidth;

  // Prix calculés une seule fois
  const prixMin = estimation.prixMin || parseFloat(estimation.preEstimation?.prixEntre || "0") || 0;
  const prixMax = estimation.prixMax || parseFloat(estimation.preEstimation?.prixEt || "0") || 0;
  const prixText = `${formatPrix(prixMin)} - ${formatPrix(prixMax)}`;
  const adresse = estimation.identification?.adresse;

  // ========================================
  // PAGE 1 : COUVERTURE PREMIUM (modulaire)
  // ========================================
  await renderCoverPage(ctx);

  // ========================================
  // PAGE 2 : MÉTHODOLOGIE D'ESTIMATION (modulaire)
  // ========================================
  await renderMethodologyPage(ctx);

  // ========================================
  // PAGE 3 : ANNEXE TECHNIQUE 1/2 (modulaire)
  // ========================================
  await renderAnnexeTechnique1(ctx);

  // ========================================
  // PAGE 2 : QUI EST GARY (Philosophie)
  // ========================================
  doc.addPage();
  yPos = 25;
  // ========================================
  // PAGE 2 : QUI EST GARY (Philosophie)
  // ========================================
  doc.addPage();
  yPos = 25;

  // Titre principal
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GARY_DARK);
  safeText(doc, "Qui est GARY", marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  safeText(doc, "Une autre facon de penser la vente immobiliere", marginLeft, yPos);
  yPos += 15;

  // Texte philosophie
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const philoIntro = sanitizeText("Vendre un bien, ce n'est pas publier une annonce. C'est une sequence de decisions qui engagent l'image du bien sur le marche. Chaque exposition laisse une trace. Chaque silence aussi.");
  const philoLines = doc.splitTextToSize(philoIntro, contentWidth);
  doc.text(philoLines, marginLeft, yPos);
  yPos += philoLines.length * 5 + 8;

  // Section "CE QUE NOUS CROYONS"
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GARY_RED);
  safeText(doc, "CE QUE NOUS CROYONS", marginLeft, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const croyances = [
    "Une vente est une orchestration, pas une diffusion.",
    "Chaque bien dispose d'un capital d'attention limite. Un bien trop expose perd son pouvoir d'attraction.",
    "Le timing compte autant que le prix."
  ];

  croyances.forEach(c => {
    const lines = doc.splitTextToSize(sanitizeText(c), contentWidth - 5);
    doc.text(lines, marginLeft + 3, yPos);
    yPos += lines.length * 4 + 3;
  });
  yPos += 5;

  // Section "CE QUE NOUS FAISONS"
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GARY_RED);
  safeText(doc, "CE QUE NOUS FAISONS", marginLeft, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const actions = [
    "Lire et interpreter les signaux du marche",
    "Arbitrer entre exposition et retenue",
    "Adapter le discours aux reactions observees",
    "Proteger l'image du bien dans la duree",
    "Securiser vos decisions a chaque etape"
  ];

  actions.forEach(a => {
    doc.setFillColor(250, 66, 56);
    doc.circle(marginLeft + 4, yPos - 1.5, 1.5, 'F');
    safeText(doc, a, marginLeft + 10, yPos);
    yPos += 5;
  });
  yPos += 8;

  // Bloc slogan + stats
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginLeft, yPos, contentWidth, 40, 3, 3, "F");

  // Slogan centré
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GARY_DARK);
  safeText(doc, "Nous ne sommes pas des diffuseurs.", marginLeft + contentWidth / 2, yPos + 10, { align: "center" });
  safeText(doc, "Nous sommes des pilotes.", marginLeft + contentWidth / 2, yPos + 18, { align: "center" });

  // Stats en bas du bloc
  const statsY = yPos + 30;
  const statWidth = contentWidth / 5;
  
  const statsDisplay = [
    { value: GARY_STATS.vues2025, label: "Vues 2025" },
    { value: GARY_STATS.communaute, label: "Communaute" },
    { value: `${GARY_STATS.noteGoogle} ★`, label: `(${GARY_STATS.nbAvis} avis)` },
    { value: `${GARY_STATS.delaiMoyenMois}`, label: "mois en moy." }
  ];

  statsDisplay.forEach((stat, idx) => {
    const xPos = marginLeft + 15 + (idx * statWidth);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GARY_RED);
    safeText(doc, stat.value, xPos, statsY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    safeText(doc, stat.label, xPos, statsY + 5);
  });

  yPos += 50;

  // ========================================
  // PAGE 3 : À L'ATTENTION DE
  // ========================================
  doc.addPage();
  yPos = 35;

  const vendeur = estimation.identification?.vendeur;
  const nomComplet = vendeur?.nom 
    ? `${vendeur.prenom ? vendeur.prenom + ' ' : ''}${vendeur.nom}`
    : null;

  if (nomComplet) {
    doc.setTextColor(GARY_DARK);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    safeText(doc, "A l'attention de", marginLeft, yPos);
    yPos += 10;
    
    doc.setFontSize(16);
    doc.setTextColor(250, 66, 56);
    safeText(doc, `Madame, Monsieur ${nomComplet}`, marginLeft, yPos);
    yPos += 18;
  }

  // Message personnalisé
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const introText = sanitizeText(nomComplet
    ? `Suite a notre entretien et a la visite de votre bien situe ${adresse?.rue ? 'au ' + adresse.rue : 'a ' + (adresse?.localite || '')}, nous avons le plaisir de vous transmettre notre estimation detaillee.`
    : `Nous avons le plaisir de vous transmettre l'estimation detaillee du bien situe ${adresse?.rue ? 'au ' + adresse.rue : 'a ' + (adresse?.localite || '')}.`);

  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginLeft, yPos);
  yPos += introLines.length * 6 + 12;

  safeText(doc, "Ce document reprend :", marginLeft, yPos);
  yPos += 8;

  const sections = [
    "L'estimation de prix basee sur notre analyse du marche",
    "Les caracteristiques detaillees de votre bien",
    "Les comparables de reference",
    "Notre strategie de mise en vente personnalisee",
    "Les prochaines etapes pour concretiser ce projet"
  ];

  doc.setFontSize(10);
  sections.forEach(section => {
    doc.setFillColor(34, 197, 94);
    doc.circle(marginLeft + 4, yPos - 1.5, 1.5, 'F');
    doc.setTextColor(GARY_DARK);
    safeText(doc, section, marginLeft + 10, yPos);
    yPos += 7;
  });

  yPos += 12;

  // Message de confiance
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  const closingIntro = sanitizeText("Nous restons a votre entiere disposition pour echanger sur cette estimation et repondre a toutes vos questions.");
  const closingIntroLines = doc.splitTextToSize(closingIntro, contentWidth);
  doc.text(closingIntroLines, marginLeft, yPos);
  yPos += closingIntroLines.length * 5 + 15;

  // Ligne séparation
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);

  // ========================================
  // PAGE 3+ : CONTENU DÉTAILLÉ
  // ========================================
  doc.addPage();
  yPos = 20;

  // Titre section avec style
  yPos = addSectionHeader(doc, "Détail de l'estimation", yPos, marginLeft);

  // ========== Encadré Prix avec ombre ==========
  // Ombre portée
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(marginLeft + 2, yPos + 2, contentWidth, 40, 4, 4, "F");

  // Fond rouge principal
  doc.setFillColor(250, 66, 56); // GARY_RED
  doc.roundedRect(marginLeft, yPos, contentWidth, 40, 4, 4, "F");

  // Barre verticale blanche décorative
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft + 8, yPos + 8, 4, 24, "F");

  // Label
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  safeText(doc, "FOURCHETTE DE PRIX RECOMMANDEE", marginLeft + 20, yPos + 16);

  // Prix
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  const prixDisplayText = prixMin > 0 && prixMax > 0 
    ? `${formatPrix(prixMin)} - ${formatPrix(prixMax)}`
    : "Prix a determiner";
  safeText(doc, prixDisplayText, marginLeft + 20, yPos + 34);

  yPos += 50 + SPACE.afterBlock;

  // ========== LES 3 VALEURS : Vénale, Rendement, Gage ==========
  const preEst = estimation.preEstimation;
  const carac = estimation.caracteristiques;
  const typeBien = carac?.typeBien;
  const isAppart = typeBien?.toLowerCase().includes('appartement');

  // Calcul des 3 valeurs
  const valeurVenale = prixMax;
  const loyerMensuelCalc = parseFloat(preEst?.loyerMensuel || "0");
  const tauxCapitalisation = preEst?.tauxCapitalisation || 3.5;
  const valeurRendement = loyerMensuelCalc > 0 ? Math.round((loyerMensuelCalc * 12) / (tauxCapitalisation / 100)) : 0;
  const tauxGage = preEst?.tauxGage || 80;
  const valeurGage = Math.round(valeurVenale * (tauxGage / 100));

  // Afficher les 3 valeurs côte à côte
  if (valeurVenale > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GARY_DARK);
    safeText(doc, "Fourchette de valeur", marginLeft, yPos);
    
    // Afficher la fourchette à droite
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    safeText(doc, `${formatPrix(prixMin)} -> ${formatPrix(prixMax)}`, pageWidth - marginRight, yPos, { align: "right" });
    yPos += 12;

    // Bloc gris avec les 3 valeurs
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginLeft, yPos, contentWidth, 28, 3, 3, "F");

    const colWidth3Val = contentWidth / 3;
    const valeursY = yPos + 10;

    // Valeur Vénale
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    safeText(doc, "VENALE", marginLeft + colWidth3Val / 2, valeursY - 3, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor(GARY_DARK);
    safeText(doc, formatPrix(valeurVenale), marginLeft + colWidth3Val / 2, valeursY + 8, { align: "center" });

    // Valeur Rendement
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    safeText(doc, "RENDEMENT", marginLeft + colWidth3Val + colWidth3Val / 2, valeursY - 3, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor(GARY_DARK);
    if (valeurRendement > 0) {
      safeText(doc, formatPrix(valeurRendement), marginLeft + colWidth3Val + colWidth3Val / 2, valeursY + 8, { align: "center" });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      safeText(doc, "N/A", marginLeft + colWidth3Val + colWidth3Val / 2, valeursY + 8, { align: "center" });
    }

    // Valeur Gage
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    safeText(doc, "GAGE", marginLeft + 2 * colWidth3Val + colWidth3Val / 2, valeursY - 3, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor(GARY_DARK);
    safeText(doc, formatPrix(valeurGage), marginLeft + 2 * colWidth3Val + colWidth3Val / 2, valeursY + 8, { align: "center" });

    yPos += 35;

    // Légende sous les valeurs
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    if (valeurRendement > 0) {
      safeText(doc, `Base: Taux ${tauxCapitalisation}% - ${formatPrix(loyerMensuelCalc)}/mois`, marginLeft + colWidth3Val + colWidth3Val / 2, yPos - 2, { align: "center" });
    }
    safeText(doc, "Ref. bancaire", marginLeft + 2 * colWidth3Val + colWidth3Val / 2, yPos - 2, { align: "center" });
    yPos += 8;
  }

  // ========== DÉTAIL DU CALCUL (tableau ligne par ligne) ==========
  if (preEst) {
    doc.setTextColor(GARY_DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    safeText(doc, "DETAIL DU CALCUL", marginLeft, yPos);
    yPos += 10;

    // Tableau avec fond alternating
    doc.setFontSize(9);
    let rowIndex = 0;

    const addCalcRow = (element: string, quantite: string, prixUnit: string, montant: string, isPositive: boolean = true) => {
      // Fond alterné
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginLeft, yPos - 4, contentWidth, 8, "F");
      }
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      safeText(doc, element, marginLeft + 3, yPos);
      safeText(doc, quantite, marginLeft + 60, yPos);
      safeText(doc, prixUnit, marginLeft + 95, yPos);
      
      doc.setFont("helvetica", "bold");
      if (isPositive) {
        doc.setTextColor(34, 100, 60);
      } else {
        doc.setTextColor(200, 50, 50);
      }
      safeText(doc, montant, pageWidth - marginRight - 5, yPos, { align: "right" });
      
      yPos += 8;
      rowIndex++;
    };

    // Si appartement : décomposition avec prix au m²
    if (isAppart) {
      const prixM2 = parseFloat(preEst.prixM2 || "0");
      const surface = parseFloat(carac?.surfacePPE || "0");
      
      if (prixM2 > 0 && surface > 0) {
        const valeurBase = prixM2 * surface;
        addCalcRow("Surface ponderee", `${surface} m²`, `${formatPrix(prixM2)}`, formatPrix(valeurBase));

        // Parking intérieur
        const prixPlaceInt = parseFloat(preEst.prixPlaceInt || "0");
        if (prixPlaceInt > 0) {
          const nbPlacesInt = parseInt(carac?.parkingInterieur || "1");
          addCalcRow("Places interieures", String(nbPlacesInt), `${formatPrix(prixPlaceInt)}`, formatPrix(prixPlaceInt * nbPlacesInt));
        }

        // Parking extérieur
        const prixPlaceExt = parseFloat(preEst.prixPlaceExt || "0");
        if (prixPlaceExt > 0) {
          const nbPlacesExt = parseInt(carac?.parkingExterieur || "1");
          addCalcRow("Places exterieures", String(nbPlacesExt), `${formatPrix(prixPlaceExt)}`, formatPrix(prixPlaceExt * nbPlacesExt));
        }

        // Cave
        const prixCave = parseFloat(preEst.prixCave || "0");
        if (prixCave > 0) {
          addCalcRow("Cave", "1", `${formatPrix(prixCave)}`, formatPrix(prixCave));
        }

        // Lignes supplémentaires
        const lignesSupp = preEst.lignesSupp || [];
        lignesSupp.forEach((ligne: { libelle?: string; prix?: string }) => {
          const prix = parseFloat(ligne.prix || "0");
          if (prix !== 0) {
            addCalcRow(ligne.libelle || 'Ajustement', "-", "-", formatPrix(Math.abs(prix)), prix > 0);
          }
        });

        // Vétusté (déduction)
        const tauxVetusteVal = preEst.tauxVetuste;
        const tauxVetuste = typeof tauxVetusteVal === 'number' ? tauxVetusteVal : parseFloat(String(tauxVetusteVal || "0"));
        if (tauxVetuste > 0) {
          const reductionVetuste = valeurBase * (tauxVetuste / 100);
          addCalcRow(`Vetuste (${tauxVetuste}%)`, "-", "-", `-${formatPrix(reductionVetuste)}`, false);
        }
      }
    }

    // Si maison : cubage SIA
    if (!isAppart && typeBien?.toLowerCase().includes('maison')) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);

      const prixM3 = parseFloat(preEst.prixM3 || "0");
      const cubage = parseFloat(preEst.cubageManuel || preEst.cubageTheorique || "0");

      if (prixM3 > 0 && cubage > 0) {
        const valeurCubage = prixM3 * cubage;
        
        doc.text("Prix au m³ (SIA):", marginLeft + 5, yPos);
        doc.text(`${formatPrix(prixM3)} × ${Math.round(cubage)} m³`, marginLeft + 85, yPos);
        doc.setFont("helvetica", "bold");
        doc.text(`= ${formatPrix(valeurCubage)}`, marginLeft + 145, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 6;
      }

      // Terrain
      const prixM2Terrain = parseFloat(preEst.prixM2Terrain || "0");
      const surfaceTerrain = parseFloat(carac?.surfaceTerrain || "0");
      
      if (prixM2Terrain > 0 && surfaceTerrain > 0) {
        const valeurTerrain = prixM2Terrain * surfaceTerrain;
        doc.text("Terrain:", marginLeft + 5, yPos);
        doc.text(`${formatPrix(prixM2Terrain)}/m² × ${Math.round(surfaceTerrain)} m²`, marginLeft + 85, yPos);
        doc.setTextColor(34, 197, 94);
        doc.text(`+ ${formatPrix(valeurTerrain)}`, marginLeft + 145, yPos);
        doc.setTextColor(80, 80, 80);
        yPos += 6;
      }

      // Annexes maison
      const annexes = preEst.annexes || [];
      annexes.forEach((annexe: { libelle?: string; prix?: string }) => {
        const prix = parseFloat(annexe.prix || "0");
        if (prix > 0) {
          doc.text(`${annexe.libelle || 'Annexe'}:`, marginLeft + 5, yPos);
          doc.setTextColor(34, 197, 94);
          doc.text(`+ ${formatPrix(prix)}`, marginLeft + 145, yPos);
          doc.setTextColor(80, 80, 80);
          yPos += 6;
        }
      });

      yPos += 5;
    }

    // Note justification si présente
    if (preEst.justificationPrix) {
      doc.setFillColor(248, 250, 252);
      const justifLines = doc.splitTextToSize(preEst.justificationPrix, contentWidth - 20);
      const boxHeight = 10 + (justifLines.length * 5);
      
      doc.roundedRect(marginLeft, yPos, contentWidth, boxHeight, 2, 2, "F");
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text(justifLines, marginLeft + 10, yPos);
      yPos += (justifLines.length * 5) + 6;
    }

    yPos += 5;
  }

  // ========== Caractéristiques en 2 colonnes avec fond ==========
  yPos = addSectionHeader(doc, "Caractéristiques du bien", yPos, marginLeft);

  const caracInfo = estimation.caracteristiques;
  if (caracInfo) {
    // Fond gris clair
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginLeft, yPos, contentWidth, 38, 3, 3, "F");
    
    const typeBienLabel = caracInfo.typeBien === 'appartement' ? 'Appartement' : 
                          caracInfo.typeBien === 'maison' ? 'Maison' : 
                          caracInfo.typeBien || '-';
    
    const surface = caracInfo.typeBien === 'appartement' 
      ? caracInfo.surfacePPE 
      : caracInfo.surfaceHabitableMaison;

    const caracteristiques = [
      { label: "Type de bien", value: typeBienLabel },
      { label: "Surface habitable", value: surface ? `${surface} m²` : "-" },
      { label: "Pièces", value: caracInfo.nombrePieces || "-" },
      { label: "Chambres", value: caracInfo.nombreChambres || "-" },
      { label: "Salles de bain", value: caracInfo.nombreSDB || "-" },
      { label: "Étage", value: caracInfo.etage || "-" },
      { label: "Année", value: caracInfo.anneeConstruction || "-" },
      { label: "Style", value: caracInfo.styleArchitectural || "-" },
    ];

    // Affichage 2 colonnes
    const colWidthCarac = contentWidth / 2;
    const startY = yPos + 8;
    
    caracteristiques.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPos = marginLeft + 10 + (col * colWidthCarac);
      const itemY = startY + (row * 7);
      
      // Label en gras gris
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${item.label}:`, xPos, itemY);
      
      // Valeur en normal noir
      doc.setFont("helvetica", "normal");
      doc.setTextColor(26, 46, 53);
      doc.text(String(item.value), xPos + 42, itemY);
    });
    
    yPos += 38 + SPACE.afterBlock;
  }

  // ========== Contexte de vente structuré ==========
  const contexte = estimation.identification?.contexte;
  if (contexte && (contexte.motifVente || contexte.horizon || contexte.prioriteVendeur)) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSectionHeader(doc, "Contexte de vente", yPos, marginLeft);

    // Fond gris clair
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginLeft, yPos, contentWidth, 24, 2, 2, "F");
    
    const motifsLabels: Record<string, string> = {
      mutation: "Mutation professionnelle",
      separation: "Séparation / Divorce",
      succession: "Succession",
      investissement: "Réalisation investissement",
      agrandissement: "Recherche plus grand",
      reduction: "Recherche plus petit",
      retraite: "Départ à la retraite",
      liquidites: "Besoin de liquidités",
      autre: "Autre motif"
    };

    const horizonsLabels: Record<string, string> = {
      urgent: "Urgent (< 3 mois)",
      court: "Court terme (3-6 mois)",
      moyen: "Moyen terme (6-12 mois)",
      long: "Long terme (> 12 mois)",
      flexible: "Flexible"
    };

    const prioriteLabels: Record<string, string> = {
      prixMax: "Maximiser le prix",
      rapidite: "Vendre rapidement",
      equilibre: "Équilibre prix/délai"
    };

    const infos = [
      { label: "Motif", value: contexte.motifVente ? motifsLabels[contexte.motifVente] || contexte.motifVente : "-" },
      { label: "Horizon", value: contexte.horizon ? horizonsLabels[contexte.horizon] || contexte.horizon : "-" },
      { label: "Priorité", value: contexte.prioriteVendeur ? prioriteLabels[contexte.prioriteVendeur] || contexte.prioriteVendeur : "-" },
    ];
    
    const startY = yPos + 8;
    infos.forEach((info, idx) => {
      const xPos = marginLeft + 10 + (idx * (contentWidth / 3));
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${info.label}:`, xPos, startY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(26, 46, 53);
      const valueLines = doc.splitTextToSize(info.value, (contentWidth / 3) - 15);
      doc.text(valueLines[0] || "-", xPos, startY + 6);
    });
    
    yPos += 24 + SPACE.afterBlock;
  }

  // ========== Historique de diffusion ==========
  const historique = estimation.identification?.historique;
  if (historique?.dejaDiffuse) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    const dureeLabels: Record<string, string> = {
      "moins1mois": "Moins d'un mois",
      "1-3mois": "1 à 3 mois",
      "3-6mois": "3 à 6 mois",
      "6-12mois": "6 à 12 mois",
      "plus12mois": "Plus de 12 mois"
    };

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(marginLeft, yPos, contentWidth, 28, 2, 2, "F");
    
    yPos += 7;
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bien déjà mis en vente", marginLeft + 5, yPos);
    yPos += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    let infoLine = "";
    if (historique.duree) {
      infoLine += `Durée: ${dureeLabels[historique.duree] || historique.duree}`;
    }
    if (historique.prixAffiche) {
      infoLine += infoLine ? ` | ` : "";
      infoLine += `Prix affiché: ${formatPrix(parseFloat(historique.prixAffiche))}`;
    }
    if (infoLine) {
      doc.text(infoLine, marginLeft + 8, yPos);
    }

    yPos += 15;
  }

  // ========== AMÉLIORATION #4: Informations financières ==========
  const financier = estimation.identification?.financier;
  if (financier && (financier.chargesAnnuelles || financier.valeurLocative)) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(GARY_DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Informations financières", marginLeft, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    // Charges annuelles
    const charges = parseFloat(financier.chargesAnnuelles || "0");
    if (charges > 0) {
      doc.text("Charges annuelles (PPE):", marginLeft, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrix(charges), marginLeft + 70, yPos);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`(${formatPrix(Math.round(charges / 12))}/mois)`, marginLeft + 115, yPos);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      yPos += 6;
    }

    // Valeur locative officielle
    const valeurLoc = parseFloat(financier.valeurLocative || "0");
    if (valeurLoc > 0) {
      doc.text("Valeur locative officielle:", marginLeft, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(formatPrix(valeurLoc), marginLeft + 70, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 6;
    }

    // Loyer potentiel + rendement
    const loyerMensuel = parseFloat(estimation.preEstimation?.loyerMensuel || "0");
    if (loyerMensuel > 0) {
      const loyerAnnuel = loyerMensuel * 12;
      doc.text("Potentiel locatif:", marginLeft, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text(`${formatPrix(loyerMensuel)}/mois`, marginLeft + 70, yPos);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`(${formatPrix(loyerAnnuel)}/an)`, marginLeft + 125, yPos);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      yPos += 6;

      // Rendement si prix connu
      const prix = prixMax;
      if (prix > 0) {
        const rendement = (loyerAnnuel / prix) * 100;
        doc.text("Rendement brut estimé:", marginLeft, yPos);
        doc.setFont("helvetica", "bold");
        if (rendement >= 4) {
          doc.setTextColor(34, 197, 94);
        } else if (rendement >= 3) {
          doc.setTextColor(251, 146, 60);
        } else {
          doc.setTextColor(239, 68, 68);
        }
        doc.text(`${rendement.toFixed(2)}%`, marginLeft + 70, yPos);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        yPos += 6;
      }
    }

    yPos += 8;
  }

  // ========== Points forts avec style ==========
  const pointsFortsSection = estimation.analyseTerrain?.pointsForts;
  if (pointsFortsSection && pointsFortsSection.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos = addSectionHeader(doc, "Points forts", yPos, marginLeft);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    // Afficher en 2 colonnes si plus de 4 points
    if (pointsFortsSection.length > 4) {
      const colWidthPts = contentWidth / 2;
      pointsFortsSection.forEach((point, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const xPos = marginLeft + (col * colWidthPts);
        const itemY = yPos + (row * SPACE.betweenItems);
        
        doc.setFillColor(34, 197, 94);
        doc.circle(xPos + 3, itemY - 1.5, 1.5, 'F');
        doc.text(point, xPos + 8, itemY);
      });
      yPos += Math.ceil(pointsFortsSection.length / 2) * SPACE.betweenItems;
    } else {
      pointsFortsSection.forEach((point) => {
        doc.setFillColor(34, 197, 94);
        doc.circle(marginLeft + 3, yPos - 1.5, 1.5, 'F');
        doc.text(point, marginLeft + 8, yPos);
        yPos += SPACE.betweenItems;
      });
    }
    yPos += SPACE.afterBlock;
  }

  // ========== Proximités avec style ==========
  const proximites = estimation.identification?.proximites;
  if (proximites && Array.isArray(proximites) && proximites.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSectionHeader(doc, "Proximités", yPos, marginLeft);

    // Grouper par type
    const transports = proximites.filter((p: { type: string }) => p.type?.includes('transport'));
    const ecoles = proximites.filter((p: { type: string }) => p.type === 'ecole');
    const commerces = proximites.filter((p: { type: string }) => p.type === 'commerce');
    const autres = proximites.filter((p: { type: string }) => !['transport_bus', 'transport_tram', 'ecole', 'commerce'].includes(p.type));

    const renderProxGroup = (items: Array<{ libelle?: string; distance?: string }>, label: string) => {
      if (items.length === 0) return;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(26, 46, 53);
      doc.text(label, marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      yPos += 5;

      items.slice(0, 3).forEach((item) => {
        doc.setFillColor(100, 100, 100);
        doc.circle(marginLeft + 5, yPos - 1, 1, 'F');
        doc.text(`${item.libelle || '-'} - ${item.distance || ''}`, marginLeft + 10, yPos);
        yPos += SPACE.lineHeight;
      });
      yPos += 3;
    };

    renderProxGroup(transports, "Transports");
    renderProxGroup(ecoles, "Ecoles");
    renderProxGroup(commerces, "Commerces");
    renderProxGroup(autres, "Autres");

    yPos += SPACE.afterBlock;

    // Écoles
    if (ecoles.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Écoles:", marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 5;

      ecoles.slice(0, 3).forEach((ecole: { libelle?: string; distance?: string }) => {
        doc.text(`• ${ecole.libelle || 'École'} - ${ecole.distance || ''}`, marginLeft + 5, yPos);
        yPos += 5;
      });
      yPos += 2;
    }

    // Commerces
    if (commerces.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Commerces:", marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 5;

      commerces.slice(0, 3).forEach((commerce: { libelle?: string; distance?: string }) => {
        doc.text(`• ${commerce.libelle || 'Commerce'} - ${commerce.distance || ''}`, marginLeft + 5, yPos);
        yPos += 5;
      });
      yPos += 2;
    }

    // Autres (santé, nature, etc.)
    if (autres.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Autres:", marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 5;

      autres.slice(0, 3).forEach((autre: { libelle?: string; distance?: string }) => {
        doc.text(`• ${autre.libelle || 'Proximité'} - ${autre.distance || ''}`, marginLeft + 5, yPos);
        yPos += 5;
      });
      yPos += 2;
    }

    yPos += 5;
  }

  // ========== CORRECTION #2: Comparables marché ==========
  if (finalConfig.inclureComparables) {
    const comparablesVendus = estimation.preEstimation?.comparablesVendus || [];
    const comparablesEnVente = estimation.preEstimation?.comparablesEnVente || [];
    const hasComparables = comparablesVendus.length > 0 || comparablesEnVente.length > 0;

    if (hasComparables) {
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }

      doc.setTextColor(GARY_DARK);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Analyse du marché", marginLeft, yPos);
      yPos += 10;

      // Comparables vendus
      if (comparablesVendus.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(34, 197, 94);
        doc.setFont("helvetica", "bold");
        doc.text("Biens vendus récemment", marginLeft, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");

        comparablesVendus.slice(0, 3).forEach((comp) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          const prix = parseFloat(comp.prix) || 0;
          const surface = parseFloat(comp.surface) || 0;
          const prixM2 = surface > 0 ? Math.round(prix / surface) : 0;

          doc.setFont("helvetica", "bold");
          doc.text(`• ${comp.adresse || 'Adresse non renseignée'}`, marginLeft + 3, yPos);
          yPos += 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          
          let infoLine = `  ${formatPrix(prix)}`;
          if (surface > 0) infoLine += ` | ${surface} m²`;
          if (prixM2 > 0) infoLine += ` | ${formatPrix(prixM2)}/m²`;
          doc.text(infoLine, marginLeft + 5, yPos);
          yPos += 5;

          if (comp.dateVente) {
            doc.setTextColor(120, 120, 120);
            doc.text(`  Vendu: ${comp.dateVente}`, marginLeft + 5, yPos);
            doc.setTextColor(80, 80, 80);
            yPos += 4;
          }

          doc.setFontSize(10);
          yPos += 3;
        });

        yPos += 5;
      }

      // Comparables en vente
      if (comparablesEnVente.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(59, 130, 246);
        doc.setFont("helvetica", "bold");
        doc.text("Biens actuellement en vente", marginLeft, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");

        comparablesEnVente.slice(0, 3).forEach((comp) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          const prix = parseFloat(comp.prix) || 0;
          const surface = parseFloat(comp.surface) || 0;
          const prixM2 = surface > 0 ? Math.round(prix / surface) : 0;

          doc.setFont("helvetica", "bold");
          doc.text(`• ${comp.adresse || 'Adresse non renseignée'}`, marginLeft + 3, yPos);
          yPos += 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          
          let infoLine = `  ${formatPrix(prix)}`;
          if (surface > 0) infoLine += ` | ${surface} m²`;
          if (prixM2 > 0) infoLine += ` | ${formatPrix(prixM2)}/m²`;
          doc.text(infoLine, marginLeft + 5, yPos);
          yPos += 5;

          if (comp.dureeEnVente) {
            doc.setTextColor(120, 120, 120);
            doc.text(`  En vente depuis: ${comp.dureeEnVente}`, marginLeft + 5, yPos);
            doc.setTextColor(80, 80, 80);
            yPos += 4;
          }

          doc.setFontSize(10);
          yPos += 3;
        });

        yPos += 10;
      }
    }
  }

  // ========== TRAJECTOIRES DE VENTE (style GARY premium) ==========
  if (finalConfig.inclureTimeline && estimation.strategiePitch) {
    doc.addPage();
    yPos = 25;

    // Titre principal
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GARY_DARK);
    safeText(doc, "Trajectoires de vente", marginLeft, yPos);
    yPos += 15;

    const strat = estimation.strategiePitch;
    const historique = estimation.identification?.historique;
    
    // ========== CAPITAL-VISIBILITÉ (si bien déjà diffusé) ==========
    if (historique?.dejaDiffuse) {
      // Calculer le capital consommé (estimation basée sur durée)
      const dureeLabels: Record<string, number> = {
        "moins1mois": 10,
        "1-3mois": 25,
        "3-6mois": 50,
        "6-12mois": 75,
        "plus12mois": 90
      };
      const capitalConsomme = dureeLabels[historique.duree || "moins1mois"] || 20;
      const capitalRestant = 100 - capitalConsomme;

      // Encadré Capital-Visibilité
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(marginLeft, yPos, contentWidth, 35, 3, 3, "F");

      // Label
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      safeText(doc, "CAPITAL-VISIBILITE", marginLeft + 10, yPos + 10);

      // Jauge
      const jaugeX = marginLeft + 90;
      const jaugeWidth = 80;
      const jaugeHeight = 8;
      const jaugeY = yPos + 6;

      // Fond gris
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(jaugeX, jaugeY, jaugeWidth, jaugeHeight, 2, 2, "F");

      // Portion consommée (rouge/orange)
      if (capitalConsomme > 0) {
        doc.setFillColor(239, 68, 68);
        const consumedWidth = (capitalConsomme / 100) * jaugeWidth;
        doc.roundedRect(jaugeX, jaugeY, consumedWidth, jaugeHeight, 2, 2, "F");
      }

      // Pourcentage
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      safeText(doc, `${capitalConsomme}% consomme`, jaugeX + jaugeWidth + 8, yPos + 12);

      // Message "Déjà diffusé"
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 113, 108);
      safeText(doc, "Deja diffuse", marginLeft + 10, yPos + 22);

      // Recommandation
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      if (capitalConsomme > 50) {
        safeText(doc, "Recommandation: Pause commerciale + reinvention de l'objet", marginLeft + 10, yPos + 30);
      } else {
        safeText(doc, "Recommandation: Repositionnement strategique possible", marginLeft + 10, yPos + 30);
      }

      yPos += 42;
    }

    // ========== PLANIFICATION PRÉVISIONNELLE ==========
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GARY_DARK);
    safeText(doc, "PLANIFICATION PREVISIONNELLE", marginLeft, yPos);
    yPos += 10;

    // Récupérer les durées et calculer les dates
    const durees = strat.phaseDurees || { phase0: 2, phase1: 2, phase2: 2, phase3: 4 };
    const dateDebut = strat.dateDebut ? new Date(strat.dateDebut) : new Date();
    
    const datePhase0 = new Date(dateDebut);
    const datePhase1 = new Date(dateDebut);
    datePhase1.setDate(datePhase1.getDate() + (durees.phase0 || 2) * 7);
    const datePhase2 = new Date(datePhase1);
    datePhase2.setDate(datePhase2.getDate() + (durees.phase1 || 2) * 7);
    const datePhase3 = new Date(datePhase2);
    datePhase3.setDate(datePhase3.getDate() + (durees.phase2 || 2) * 7);

    // Ligne de timeline visuelle
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginLeft, yPos, contentWidth, 25, 2, 2, "F");

    const colWidth4 = contentWidth / 4;
    const timelineY = yPos + 8;

    const timelinePhases = [
      { label: "Prepa.", date: format(datePhase0, "dd MMM", { locale: fr }), duree: `${durees.phase0 || 2} sem.` },
      { label: "Off-market", date: format(datePhase1, "dd MMM", { locale: fr }), duree: `${durees.phase1 || 2} sem.` },
      { label: "Coming soon", date: format(datePhase2, "dd MMM", { locale: fr }), duree: `${durees.phase2 || 2} sem.` },
      { label: "Public", date: format(datePhase3, "dd MMM", { locale: fr }), duree: `~${durees.phase3 || 4} sem.` }
    ];

    timelinePhases.forEach((p, idx) => {
      const xPos = marginLeft + 10 + (idx * colWidth4);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      safeText(doc, p.label, xPos, timelineY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(GARY_DARK);
      doc.setFontSize(9);
      safeText(doc, p.date, xPos, timelineY + 6);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      safeText(doc, p.duree, xPos, timelineY + 12);
    });

    yPos += 32;

    // Estimation vente
    const dureeTotal = (durees.phase0 || 2) + (durees.phase1 || 2) + (durees.phase2 || 2) + (durees.phase3 || 4);
    const dateVenteEstimee = new Date(dateDebut);
    dateVenteEstimee.setDate(dateVenteEstimee.getDate() + dureeTotal * 7);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    safeText(doc, `Vente estimee : ${format(dateVenteEstimee, "dd MMMM yyyy", { locale: fr })}`, marginLeft, yPos);
    yPos += 15;

    // ========== 3 COLONNES : Off-Market / Coming Soon / Public ==========
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(GARY_DARK);
    safeText(doc, "CHOISISSEZ VOTRE POINT DE DEPART", marginLeft, yPos);
    yPos += 10;

    const prixBase = prixMax;
    const pourcOffmarket = estimation.preEstimation?.pourcOffmarket || 15;
    const pourcComingsoon = estimation.preEstimation?.pourcComingsoon || 10;
    const pourcPublic = estimation.preEstimation?.pourcPublic || 6;

    const colWidth3 = (contentWidth - 10) / 3;
    const colonnes = [
      {
        titre: "Off-Market",
        sousTitre: "POINT DE DEPART STRATEGIQUE",
        objectif: "Tester la demande en toute discretion",
        conditions: ["Cercle restreint d'acheteurs", "Aucune trace publique", "Retours confidentiels"],
        prix: prixBase > 0 ? prixBase * (1 + pourcOffmarket / 100) : 0,
        pourcentage: `Venale +${pourcOffmarket}%`,
        bgColor: [254, 226, 226] as [number, number, number],
        headerColor: [185, 28, 28] as [number, number, number]
      },
      {
        titre: "Coming Soon",
        sousTitre: "ACTIVABLE",
        objectif: "Creer l'anticipation et la tension",
        conditions: ["Communication maitrisee", "Liste d'attente", "Teasing cible"],
        prix: prixBase > 0 ? prixBase * (1 + pourcComingsoon / 100) : 0,
        pourcentage: `Venale +${pourcComingsoon}%`,
        bgColor: [254, 243, 199] as [number, number, number],
        headerColor: [180, 83, 9] as [number, number, number]
      },
      {
        titre: "Public",
        sousTitre: "CONDITIONNEL",
        objectif: "Maximiser l'exposition",
        conditions: ["Diffusion large", "Portails immobiliers", "Visibilite maximale"],
        prix: prixBase > 0 ? prixBase * (1 + pourcPublic / 100) : 0,
        pourcentage: `Venale +${pourcPublic}%`,
        bgColor: [220, 252, 231] as [number, number, number],
        headerColor: [21, 128, 61] as [number, number, number]
      }
    ];

    colonnes.forEach((col, idx) => {
      const xPos = marginLeft + (idx * (colWidth3 + 5));
      const cardHeight = 70;

      // Fond coloré
      doc.setFillColor(...col.bgColor);
      doc.roundedRect(xPos, yPos, colWidth3, cardHeight, 3, 3, "F");

      // Header
      let cardY = yPos + 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...col.headerColor);
      safeText(doc, col.titre, xPos + 5, cardY);
      cardY += 5;

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      safeText(doc, col.sousTitre, xPos + 5, cardY);
      cardY += 8;

      // Objectif
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      safeText(doc, "OBJECTIF", xPos + 5, cardY);
      cardY += 5;
      doc.setFont("helvetica", "normal");
      const objLines = doc.splitTextToSize(col.objectif, colWidth3 - 10);
      doc.text(objLines, xPos + 5, cardY);
      cardY += objLines.length * 4 + 4;

      // Prix en bas
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...col.headerColor);
      if (col.prix > 0) {
        safeText(doc, formatPrix(col.prix), xPos + 5, yPos + cardHeight - 12);
      }
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      safeText(doc, col.pourcentage, xPos + 5, yPos + cardHeight - 6);
    });

    yPos += 80;

    // Note de bas
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    const noteText = "Un objectif de valeur n'est pas une promesse. Il depend des signaux du marche et du pilotage dans le temps.";
    const noteLines = doc.splitTextToSize(noteText, contentWidth);
    doc.text(noteLines, marginLeft, yPos);
    yPos += noteLines.length * 4 + 10;
  }

  // ========== Pitch (si configuré) ==========
  const pitchText = estimation.strategiePitch?.pitchCustom || estimation.strategiePitch?.pitchGenere?.pitchComplet;
  if (finalConfig.inclurePitch && pitchText) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSectionHeader(doc, "Notre recommandation", yPos, marginLeft);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    // Split long text into lines - sanitize text
    const sanitizedPitch = sanitizeText(pitchText);
    const lines = doc.splitTextToSize(sanitizedPitch, contentWidth);
    doc.text(lines, marginLeft, yPos);
    yPos += lines.length * 5;
  }

  // ========== Prochaines etapes avec style ==========
  doc.addPage();
  yPos = 25;

  yPos = addSectionHeader(doc, "Prochaines etapes", yPos, marginLeft);

  // Encadre calendrier previsionnel
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(marginLeft, yPos, contentWidth, 45, 3, 3, "F");

  yPos += 8;
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.setFont("helvetica", "bold");
  safeText(doc, "Calendrier previsionnel", marginLeft + 10, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  // Dates calculées
  const today = new Date();
  const datePresentation = new Date(today);
  datePresentation.setDate(today.getDate() + 5);
  const dateLancement = estimation.strategiePitch?.dateDebut 
    ? new Date(estimation.strategiePitch.dateDebut)
    : new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);

  const etapesCalendrier = [
    { date: format(today, "dd.MM.yyyy"), label: "Remise de l'estimation", statut: "OK", done: true },
    { date: format(datePresentation, "dd.MM.yyyy"), label: "Presentation du mandat et signature", statut: ">", done: false },
    { date: format(dateLancement, "dd.MM.yyyy"), label: "Lancement de la mise en vente", statut: "o", done: false }
  ];

  etapesCalendrier.forEach(etape => {
    // Indicateur visuel (cercle coloré)
    if (etape.done) {
      doc.setFillColor(34, 197, 94);
      doc.circle(marginLeft + 14, yPos - 1.5, 2.5, 'F');
    } else {
      doc.setDrawColor(150, 150, 150);
      doc.circle(marginLeft + 14, yPos - 1.5, 2.5);
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    safeText(doc, etape.date, marginLeft + 22, yPos);
    safeText(doc, etape.label, marginLeft + 50, yPos);
    yPos += 6;
  });

  yPos += 12;

  // Checklist actions vendeur
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  safeText(doc, "Actions a preparer de votre cote", marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  const actionsVendeur = [
    "Rassembler les documents (acte de propriete, reglement PPE, plans...)",
    "Preparer une liste des travaux effectues ces dernieres annees",
    "Anticiper les questions techniques (chauffage, isolation, toiture...)",
    "Reflechir a votre projet post-vente (timing, budget, criteres)"
  ];

  actionsVendeur.forEach(action => {
    doc.setDrawColor(150, 150, 150);
    doc.rect(marginLeft + 3, yPos - 3, 3, 3);
    safeText(doc, action, marginLeft + 10, yPos);
    yPos += 6;
  });

  yPos += 8;

  // Checklist actions courtier
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  safeText(doc, "Ce que nous preparons", marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  const actionsCourtier = [
    "Redaction du mandat de courtage personnalise",
    "Preparation du dossier de vente complet",
    "Planning des photos et visites professionnelles",
    "Mise en place de la strategie de diffusion"
  ];

  actionsCourtier.forEach(action => {
    doc.setFillColor(34, 197, 94);
    doc.rect(marginLeft + 3, yPos - 3, 3, 3, "F");
    safeText(doc, action, marginLeft + 10, yPos);
    yPos += 6;
  });

  yPos += 15;

  // ========== Page contact courtier avec style ==========
  doc.addPage();
  yPos = 30;

  yPos = addSectionHeader(doc, "Restons en contact", yPos, marginLeft);

  // Encadre courtier
  const encadreWidth = (contentWidth / 2) - 5;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginLeft, yPos, encadreWidth, 70, 3, 3, "F");

  let contactY = yPos + 10;

  // Nom courtier
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(250, 66, 56);
  safeText(doc, "Votre conseiller GARY", marginLeft + 10, contactY);
  contactY += 12;

  // Récupérer le courtier assigné
  const courtierId = estimation.identification?.courtierAssigne;
  const courtier = courtierId ? getCourtierById(courtierId) : null;
  const courtierNomComplet = courtier 
    ? `${courtier.prenom || ''} ${courtier.nom || ''}`.trim()
    : "GARY Immobilier";
  const emailCourtier = courtier?.email || "contact@gary-immobilier.ch";
  const telephoneCourtier = courtier?.telephone || "+41 22 552 22 22";

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GARY_DARK);
  safeText(doc, courtierNomComplet, marginLeft + 10, contactY);
  contactY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  safeText(doc, telephoneCourtier, marginLeft + 10, contactY);
  contactY += 6;
  safeText(doc, emailCourtier, marginLeft + 10, contactY);
  contactY += 6;
  safeText(doc, "www.gary-immobilier.ch", marginLeft + 10, contactY);

  // Encadre disponibilite
  const encadreX = marginLeft + encadreWidth + 10;

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(encadreX, yPos, encadreWidth, 70, 3, 3, "F");

  contactY = yPos + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
  safeText(doc, "Disponibilite", encadreX + 10, contactY);
  contactY += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  safeText(doc, "Lundi - Vendredi", encadreX + 10, contactY);
  contactY += 5;
  safeText(doc, "8h00 - 19h00", encadreX + 10, contactY);
  contactY += 8;
  safeText(doc, "Samedi", encadreX + 10, contactY);
  contactY += 5;
  safeText(doc, "9h00 - 17h00", encadreX + 10, contactY);

  yPos += 85;

  // Message personnalise
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const messageContact = sanitizeText("Pour fixer un rendez-vous de signature du mandat ou pour toute question, n'hesitez pas a me contacter par telephone ou email. Je me ferai un plaisir de vous accompagner dans votre projet.");

  const messageContactLines = doc.splitTextToSize(messageContact, contentWidth);
  doc.text(messageContactLines, marginLeft, yPos);

  // ================================================================
  // ANNEXE PHOTOGRAPHIQUE (A LA FIN DU DOCUMENT - MAX 50 PHOTOS)
  // ================================================================
  const allPhotos = Array.isArray(estimation.photos) ? estimation.photos : estimation.photos?.items || [];
  
  if (finalConfig.inclurePhotos && allPhotos.length > 0) {
    // Page de separation ANNEXE PHOTOGRAPHIQUE
    doc.addPage();
    yPos = 80;
    
    // Titre "ANNEXE PHOTOGRAPHIQUE" centre
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 46, 53); // GARY_DARK
    safeText(doc, "ANNEXE", pageWidth / 2, yPos, { align: "center" });
    yPos += 16;
    safeText(doc, "PHOTOGRAPHIQUE", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 25;
    
    // Ligne decorative rouge
    doc.setDrawColor(250, 66, 56); // GARY_RED
    doc.setLineWidth(3);
    const lineWidth = 80;
    doc.line(
      pageWidth / 2 - lineWidth / 2,
      yPos,
      pageWidth / 2 + lineWidth / 2,
      yPos
    );
    
    yPos += 20;
    
    // Nombre total de photos
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const photosCount = allPhotos.length;
    const displayCount = Math.min(photosCount, 50);
    safeText(doc, 
      `${displayCount} photo${displayCount > 1 ? 's' : ''} du bien`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    );
    
    // Message si plus de 50 photos
    if (photosCount > 50) {
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(239, 68, 68);
      safeText(doc, 
        `(${photosCount} photos disponibles, affichage limite a 50 pour le PDF)`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
    }
    
    // Nouvelle page pour commencer les photos
    doc.addPage();
    yPos = 20;
    
    // Limiter à 50 photos maximum
    const photosToDisplay = allPhotos.slice(0, 50);
    
    // Grouper par catégorie
    const groupedPhotos = groupPhotosByCategory(photosToDisplay);
    
    // Dimensions constantes
    const imgWidth = (contentWidth / 2) - 5;
    const imgHeight = 60;
    
    // Compteur photos par page (max 4)
    let photosOnCurrentPage = 0;
    
    for (const group of groupedPhotos) {
      // Header catégorie (si nécessaire nouvelle page)
      if (yPos > 220 || photosOnCurrentPage >= 4) {
        doc.addPage();
        yPos = 20;
        photosOnCurrentPage = 0;
      }
      
      // Titre categorie (SANS EMOJI)
      const catConfig = getCategorieConfig(group.category);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 46, 53);
      safeText(doc, catConfig.label, marginLeft, yPos);
      yPos += 10;
      
      // Afficher photos de la catégorie
      let col = 0;
      
      for (const photo of group.photos) {
        // Nouvelle page si 4 photos déjà affichées
        if (photosOnCurrentPage >= 4) {
          doc.addPage();
          yPos = 20;
          photosOnCurrentPage = 0;
          col = 0;
        }
        
        const xPos = col === 0 ? marginLeft : marginLeft + contentWidth / 2 + 5;
        
        // Cadre photo avec fond gris clair
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(xPos, yPos, imgWidth, imgHeight, 3, 3, "FD");
        
        // Charger et afficher image
        const imageUrl = photo.storageUrl || photo.dataUrl;
        if (imageUrl) {
          try {
            const base64 = await loadImageAsBase64(imageUrl);
            if (base64) {
              doc.addImage(base64, 'JPEG', xPos + 2, yPos + 2, imgWidth - 4, imgHeight - 4);
            } else {
              // Placeholder si échec chargement
              doc.setFontSize(9);
              doc.setTextColor(150, 150, 150);
              doc.text("Image non disponible", xPos + imgWidth / 2, yPos + imgHeight / 2, { align: "center" });
            }
          } catch {
            // Placeholder erreur
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text("Erreur chargement", xPos + imgWidth / 2, yPos + imgHeight / 2, { align: "center" });
          }
        } else {
          // Placeholder pas d'URL
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text("Photo", xPos + imgWidth / 2, yPos + imgHeight / 2, { align: "center" });
        }
        
        // Badges (cercles colorés)
        if (photo.favori) {
          doc.setFillColor(255, 215, 0); // Or
          doc.circle(xPos + imgWidth - 8, yPos + 8, 5, 'F');
          // Étoile
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text("*", xPos + imgWidth - 8, yPos + 10, { align: "center" });
        }
        if (photo.defaut) {
          doc.setFillColor(239, 68, 68); // Rouge
          doc.circle(xPos + 8, yPos + 8, 5, 'F');
          // Point d'exclamation
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text("!", xPos + 8, yPos + 10, { align: "center" });
        }
        
        // Titre photo (sous l'image)
        doc.setFontSize(9);
        doc.setTextColor(26, 46, 53);
        doc.setFont("helvetica", "normal");
        const titre = photo.titre || `Photo ${photosToDisplay.indexOf(photo) + 1}`;
        const titreShort = titre.length > 35 ? titre.substring(0, 32) + '...' : titre;
        doc.text(titreShort, xPos + 2, yPos + imgHeight + 6);
        
        // Passer à la colonne suivante ou nouvelle ligne
        col = col === 0 ? 1 : 0;
        photosOnCurrentPage++;
        
        if (col === 0) {
          // On a rempli une ligne complète (2 photos)
          yPos += imgHeight + 18;
        }
      }
      
      // Si on termine sur col=1, passer à la ligne
      if (col === 1) {
        yPos += imgHeight + 18;
        col = 0;
      }
      
      // Espacement entre catégories
      yPos += 8;
    }
    
    // Note finale si photos défauts présentes
    const photosDefauts = photosToDisplay.filter(p => p.defaut);
    if (photosDefauts.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos += 10;
      
      // Encadré rouge clair
      const boxHeight = 16 + (photosDefauts.length * 6);
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(marginLeft, yPos, contentWidth, boxHeight, 3, 3, "F");
      
      yPos += 10;
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Points d'attention identifiés", marginLeft + 8, yPos);
      yPos += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      photosDefauts.forEach((photo) => {
        const titre = photo.titre || "Point à noter";
        doc.text(`• ${titre}`, marginLeft + 12, yPos);
        yPos += 6;
      });
    }
  }

  // ========== Pied de page enrichi ==========
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    const footerY = doc.internal.pageSize.getHeight() - 12;
    
    // Ligne séparation (pas sur page de garde)
    if (i > 1) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, footerY - 3, pageWidth - marginRight, footerY - 3);
    }
    
    // Footer gauche: Logo + nom (pas sur page 1)
    if (i > 1) {
      doc.setFontSize(8);
      doc.setTextColor(GARY_DARK);
      doc.setFont("helvetica", "bold");
      doc.text("GARY", marginLeft, footerY + 1);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text("Courtiers Immobiliers", marginLeft + 12, footerY + 1);
    }
    
    // Footer centre: Numéro page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i}/${pageCount}`, pageWidth / 2, footerY + 1, { align: "center" });
    
    // Footer droit: Slogan GARY (pas sur page de garde)
    if (i > 1) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(GARY_SLOGAN, pageWidth - marginRight, footerY + 1, { align: "right" });
    }
    
    // Disclaimer (uniquement dernière page)
    if (i === pageCount) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      
      const disclaimerText = "Estimation non contractuelle établie selon les données fournies et l'état apparent du bien. Validité : 3 mois. Document confidentiel.";
      
      doc.text(disclaimerText, pageWidth / 2, footerY + 5, { align: "center" });
    }
  }

  return doc;
}

// Fonction helper pour grouper les photos par catégorie
function groupPhotosByCategory(photos: Photo[]): { category: Photo['categorie']; photos: Photo[] }[] {
  const groups = new Map<Photo['categorie'], Photo[]>();
  
  // Initialiser les groupes dans l'ordre des catégories
  PHOTO_CATEGORIES.forEach(cat => {
    groups.set(cat.value, []);
  });
  
  // Répartir les photos
  photos.forEach(photo => {
    const cat = photo.categorie || 'autre';
    if (!groups.has(cat)) {
      groups.set(cat, []);
    }
    groups.get(cat)!.push(photo);
  });
  
  // Retourner uniquement les groupes non vides, triés par ordre de catégorie
  return Array.from(groups.entries())
    .filter(([_, photos]) => photos.length > 0)
    .map(([category, photos]) => ({
      category,
      photos: photos.sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    }));
}

// Télécharge le PDF
export async function downloadEstimationPDF(options: GeneratePDFOptions): Promise<void> {
  const doc = await generateEstimationPDF(options);
  const fileName = `estimation-${options.estimation.id?.slice(0, 8) || "export"}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

// Génère un blob PDF pour partage
export async function getEstimationPDFBlob(options: GeneratePDFOptions): Promise<Blob> {
  const doc = await generateEstimationPDF(options);
  return doc.output("blob");
}
