import jsPDF from "jspdf";
import { EstimationData, PDFConfig, Photo, PHOTO_CATEGORIES, getCategorieConfig, COURTIERS_GARY, getCourtierById } from "@/types/estimation";
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

// Charger une image depuis URL et retourner en base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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

  // ========== CORRECTION #4: Timeline détaillée avec dates et prix ==========
  if (finalConfig.inclureTimeline && estimation.strategiePitch) {
    if (yPos > 160) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(GARY_DARK);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Stratégie de mise en vente", marginLeft, yPos);
    yPos += 10;

    const strat = estimation.strategiePitch;
    
    // Date de lancement
    if (strat.dateDebut) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Lancement prévu: ${format(new Date(strat.dateDebut), "dd MMMM yyyy", { locale: fr })}`, marginLeft, yPos);
      yPos += 10;
    }

    // Récupérer les durées et pourcentages
    const durees = strat.phaseDurees || { phase0: 2, phase1: 2, phase2: 2, phase3: 4 };
    const prixBase = prixMax;
    const pourcOffmarket = estimation.preEstimation?.pourcOffmarket || 15;
    const pourcComingsoon = estimation.preEstimation?.pourcComingsoon || 10;
    const pourcPublic = estimation.preEstimation?.pourcPublic || 6;

    // Tableau phases avec couleurs
    const phases = [
      { 
        nom: "Phase 0 - Préparation", 
        duree: durees.phase0, 
        prix: null as number | null,
        desc: "Photos, home staging, dossier",
        bgColor: [243, 244, 246] as [number, number, number],
        textColor: [75, 85, 99] as [number, number, number]
      },
      { 
        nom: "Phase 1 - Off-Market", 
        duree: durees.phase1, 
        prix: prixBase > 0 ? prixBase * (1 + pourcOffmarket / 100) : null,
        desc: `Prix premium (+${pourcOffmarket}%)`,
        bgColor: [254, 226, 226] as [number, number, number],
        textColor: [185, 28, 28] as [number, number, number]
      },
      { 
        nom: "Phase 2 - Coming Soon", 
        duree: durees.phase2, 
        prix: prixBase > 0 ? prixBase * (1 + pourcComingsoon / 100) : null,
        desc: `Prix attractif (+${pourcComingsoon}%)`,
        bgColor: [254, 243, 199] as [number, number, number],
        textColor: [180, 83, 9] as [number, number, number]
      },
      { 
        nom: "Phase 3 - Public", 
        duree: durees.phase3, 
        prix: prixBase > 0 ? prixBase * (1 + pourcPublic / 100) : null,
        desc: `Prix marché (+${pourcPublic}%)`,
        bgColor: [220, 252, 231] as [number, number, number],
        textColor: [21, 128, 61] as [number, number, number]
      }
    ];

    phases.forEach((phase) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Rectangle de fond coloré
      doc.setFillColor(...phase.bgColor);
      doc.roundedRect(marginLeft, yPos, contentWidth, 20, 2, 2, "F");

      yPos += 7;

      // Nom phase
      doc.setTextColor(...phase.textColor);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(phase.nom, marginLeft + 5, yPos);

      // Durée à droite
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${phase.duree} sem.`, pageWidth - marginRight - 20, yPos);

      yPos += 6;

      // Description et prix
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      let descLine = phase.desc;
      if (phase.prix) {
        descLine += ` → ${formatPrix(phase.prix)}`;
      }
      doc.text(descLine, marginLeft + 5, yPos);

      yPos += 12;
    });

    yPos += 5;
  }

  // ========== Pitch (si configuré) ==========
  const pitchText = estimation.strategiePitch?.pitchCustom || estimation.strategiePitch?.pitchGenere?.pitchComplet;
  if (finalConfig.inclurePitch && pitchText) {
    if (yPos > 180) {
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

  // ========== CORRECTION #1: Photos avec images réelles ==========
  const photos = Array.isArray(estimation.photos) ? estimation.photos : estimation.photos?.items || [];
  if (finalConfig.inclurePhotos && photos.length > 0) {
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
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      const catConfig = getCategorieConfig(group.category);
      
      // Header de catégorie
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(GARY_DARK);
      doc.text(`${catConfig.emoji} ${catConfig.label}`, marginLeft, yPos);
      yPos += 8;

      // Dimensions photo constantes
      const imgWidth = (contentWidth / 2) - 5;
      const imgHeight = 50;

      // Afficher photos (2 par ligne)
      let col = 0;
      for (const photo of group.photos) {
        if (col === 0 && yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        const xPos = col === 0 ? marginLeft : marginLeft + contentWidth / 2 + 5;

        // Cadre photo avec fond gris clair
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(xPos, yPos, imgWidth, imgHeight, 2, 2, "FD");

        // Essayer d'afficher l'image si URL disponible
        const imageUrl = photo.storageUrl || photo.dataUrl;
        if (imageUrl) {
          try {
            const base64 = await loadImageAsBase64(imageUrl);
            if (base64) {
              doc.addImage(base64, 'JPEG', xPos + 2, yPos + 2, imgWidth - 4, imgHeight - 4);
            } else {
              // Placeholder si chargement échoue
              doc.setFontSize(8);
              doc.setTextColor(150, 150, 150);
              doc.text("Image", xPos + imgWidth / 2, yPos + imgHeight / 2, { align: "center" });
            }
          } catch {
            // Placeholder si erreur
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Image", xPos + imgWidth / 2, yPos + imgHeight / 2, { align: "center" });
          }
        } else {
          // Placeholder si pas d'URL
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("Photo", xPos + imgWidth / 2, yPos + imgHeight / 2, { align: "center" });
        }

        // Badges en haut
        if (photo.favori) {
          doc.setFillColor(255, 215, 0);
          doc.circle(xPos + imgWidth - 6, yPos + 6, 4, 'F');
        }
        if (photo.defaut) {
          doc.setFillColor(239, 68, 68);
          doc.circle(xPos + 6, yPos + 6, 4, 'F');
        }

        // Titre sous la photo
        doc.setFontSize(9);
        doc.setTextColor(GARY_DARK);
        doc.setFont("helvetica", "bold");
        const titre = photo.titre || `Photo ${group.photos.indexOf(photo) + 1}`;
        const titreLines = doc.splitTextToSize(titre, imgWidth - 4);
        doc.text(titreLines[0] || titre, xPos + 2, yPos + imgHeight + 5);

        col = col === 0 ? 1 : 0;
        if (col === 0) {
          yPos += imgHeight + 12;
        }
      }

      if (col === 1) {
        yPos += imgHeight + 12;
      }
      yPos += 5;
    }

    // Résumé des défauts si présents
    const defauts = photos.filter(p => p.defaut);
    if (defauts.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(254, 226, 226);
      doc.roundedRect(marginLeft, yPos, contentWidth, 8 + defauts.length * 6, 2, 2, "F");
      
      yPos += 6;
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Points d'attention relevés", marginLeft + 5, yPos);
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

  // ========== CORRECTION #3: Coordonnées courtier ==========
  doc.addPage();
  yPos = 20;

  doc.setTextColor(GARY_DARK);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Votre conseiller GARY", marginLeft, yPos);
  yPos += 15;

  // Encadré contact courtier
  doc.setDrawColor(250, 66, 56);
  doc.setLineWidth(1);
  doc.roundedRect(marginLeft, yPos, contentWidth, 55, 3, 3);

  yPos += 12;

  // Récupérer le courtier assigné
  const courtierId = estimation.identification?.courtierAssigne;
  const courtier = courtierId ? getCourtierById(courtierId) : null;
  const courtierNom = courtier?.nom || "GARY Courtiers Immobiliers";

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(250, 66, 56);
  doc.text(courtierNom, marginLeft + 10, yPos);
  yPos += 12;

  // Contact
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  const email = courtier?.email || "contact@gary-immobilier.ch";
  const telephone = courtier?.telephone || "+41 22 552 22 22";

  doc.text(`Tel: ${telephone}`, marginLeft + 10, yPos);
  yPos += 8;

  doc.text(`Email: ${email}`, marginLeft + 10, yPos);
  yPos += 8;

  doc.text("Web: www.gary-immobilier.ch", marginLeft + 10, yPos);
  yPos += 20;

  // Message de clôture
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  const closingText = "Je reste à votre entière disposition pour toute question ou pour planifier la signature du mandat.";
  const closingLines = doc.splitTextToSize(closingText, contentWidth - 20);
  doc.text(closingLines, marginLeft + 10, yPos);

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
