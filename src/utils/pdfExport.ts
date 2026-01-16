import jsPDF from "jspdf";
import { EstimationData, PDFConfig, Photo, PHOTO_CATEGORIES, getCategorieConfig } from "@/types/estimation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ============================================
// Utilitaire d'export PDF pour les estimations
// ============================================

const GARY_RED = "#FA4238";
const GARY_DARK = "#1a2e35";

interface GeneratePDFOptions {
  estimation: EstimationData;
  config?: Partial<PDFConfig>;
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

// Format prix CHF
const formatPrix = (prix: number): string => {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(prix);
};

// Génère le PDF de l'estimation
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

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ========== En-tête GARY ==========
  doc.setFillColor(GARY_RED);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("GARY", marginLeft, 18);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Courtiers Immobiliers", marginLeft, 28);

  // Date et référence
  doc.setFontSize(10);
  doc.text(
    format(new Date(), "dd MMMM yyyy", { locale: fr }),
    pageWidth - marginRight,
    18,
    { align: "right" }
  );
  doc.text(`Réf: ${estimation.id?.slice(0, 8) || "N/A"}`, pageWidth - marginRight, 25, {
    align: "right",
  });

  yPos = 50;

  // ========== Titre du document ==========
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Estimation Immobilière", marginLeft, yPos);
  yPos += 12;

  // ========== Adresse du bien ==========
  const adresse = estimation.identification?.adresse;
  if (adresse) {
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    const adresseComplete = `${adresse.rue || ""}, ${adresse.codePostal || ""} ${adresse.localite || ""}`;
    doc.text(adresseComplete, marginLeft, yPos);
    yPos += 15;
  }

  // ========== Encadré Prix ==========
  doc.setFillColor(250, 66, 56);
  doc.roundedRect(marginLeft, yPos, contentWidth, 35, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("ESTIMATION DE PRIX", marginLeft + 10, yPos + 12);

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const prixMin = estimation.prixMin || parseFloat(estimation.preEstimation?.prixEntre || "0") || 0;
  const prixMax = estimation.prixMax || parseFloat(estimation.preEstimation?.prixEt || "0") || 0;
  const prixText = `${formatPrix(prixMin)} - ${formatPrix(prixMax)}`;
  doc.text(prixText, marginLeft + 10, yPos + 28);

  yPos += 45;

  // ========== Caractéristiques principales ==========
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Caractéristiques du bien", marginLeft, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);

  const carac = estimation.caracteristiques;
  if (carac) {
    const caracteristiques = [
      { label: "Type de bien", value: carac.typeBien || "-" },
      { label: "Surface habitable", value: `${carac.surfacePPE || carac.surfaceHabitableMaison || "-"} m²` },
      { label: "Pièces", value: carac.nombrePieces || "-" },
      { label: "Chambres", value: carac.nombreChambres || "-" },
      { label: "Salles de bain", value: carac.nombreSDB || "-" },
      { label: "Étage", value: carac.etage || "-" },
      { label: "Année de construction", value: carac.anneeConstruction || "-" },
      { label: "Style", value: carac.styleArchitectural || "-" },
    ];

    caracteristiques.forEach((item, idx) => {
      const col = idx % 2 === 0 ? marginLeft : marginLeft + contentWidth / 2;
      if (idx % 2 === 0 && idx > 0) yPos += 7;
      doc.setFont("helvetica", "bold");
      doc.text(`${item.label}:`, col, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(String(item.value), col + 45, yPos);
    });
    yPos += 15;
  }

  // ========== Points forts ==========
  const pointsForts = estimation.analyseTerrain?.pointsForts;
  if (pointsForts && pointsForts.length > 0) {
    doc.setTextColor(GARY_DARK);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Points forts", marginLeft, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);

    pointsForts.forEach((point) => {
      doc.text(`• ${point}`, marginLeft + 5, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // ========== Timeline (si configuré) ==========
  if (finalConfig.inclureTimeline && estimation.strategiePitch) {
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(GARY_DARK);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Stratégie de mise en vente", marginLeft, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const strat = estimation.strategiePitch;
    if (strat.dateDebut) {
      doc.text(`Date de lancement prévue: ${format(new Date(strat.dateDebut), "dd MMMM yyyy", { locale: fr })}`, marginLeft, yPos);
      yPos += 7;
    }

    const phases = ["Phase 0 - Préparation", "Phase 1 - Off-Market", "Phase 2 - Coming Soon", "Phase 3 - Public"];
    phases.forEach((phase) => {
      doc.text(`• ${phase}`, marginLeft + 5, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // ========== Pitch (si configuré) ==========
  const pitchText = estimation.strategiePitch?.pitchCustom || estimation.strategiePitch?.pitchGenere?.pitchComplet;
  if (finalConfig.inclurePitch && pitchText) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(GARY_DARK);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Notre recommandation", marginLeft, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    // Split long text into lines
    const lines = doc.splitTextToSize(pitchText, contentWidth);
    doc.text(lines, marginLeft, yPos);
    yPos += lines.length * 5;
  }

  // ========== Photos groupées par catégorie ==========
  const photos = Array.isArray(estimation.photos) ? estimation.photos : estimation.photos?.items || [];
  if (finalConfig.inclurePhotos && photos.length > 0) {
    // Nouvelle page pour les photos
    doc.addPage();
    yPos = 20;

    doc.setTextColor(GARY_DARK);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Galerie Photos", marginLeft, yPos);
    yPos += 10;

    // Grouper les photos par catégorie
    const groupedPhotos = groupPhotosByCategory(photos);
    
    for (const group of groupedPhotos) {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      const catConfig = getCategorieConfig(group.category);
      
      // Header de catégorie
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(GARY_DARK);
      doc.text(`${catConfig.emoji} ${catConfig.label} (${group.photos.length})`, marginLeft, yPos);
      yPos += 8;

      // Liste des photos avec légendes
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);

      group.photos.forEach((photo, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const titre = photo.titre || `Photo ${idx + 1}`;
        const defautBadge = photo.defaut ? " ⚠️" : "";
        const favoriBadge = photo.favori ? " ⭐" : "";
        
        doc.text(`• ${titre}${favoriBadge}${defautBadge}`, marginLeft + 5, yPos);
        
        if (photo.description) {
          yPos += 5;
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          const descLines = doc.splitTextToSize(photo.description, contentWidth - 15);
          doc.text(descLines, marginLeft + 10, yPos);
          yPos += descLines.length * 4;
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
        }
        
        yPos += 6;
      });

      yPos += 5;
    }

    // Résumé des défauts si présents
    const defauts = photos.filter(p => p.defaut);
    if (defauts.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(254, 226, 226); // Light red background
      doc.roundedRect(marginLeft, yPos, contentWidth, 8 + defauts.length * 6, 2, 2, "F");
      
      yPos += 6;
      doc.setTextColor(185, 28, 28); // Red text
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("⚠️ Points d'attention relevés", marginLeft + 5, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      defauts.forEach((photo) => {
        doc.text(`• ${photo.titre || 'Défaut à signaler'}`, marginLeft + 8, yPos);
        yPos += 5;
      });
      yPos += 5;
    }
  }

  // ========== Pied de page ==========
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `GARY Courtiers Immobiliers | Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      "Document généré automatiquement - Estimation non contractuelle",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: "center" }
    );
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
