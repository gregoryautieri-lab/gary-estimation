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

  let yPos = 0;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Prix calculés une seule fois
  const prixMin = estimation.prixMin || parseFloat(estimation.preEstimation?.prixEntre || "0") || 0;
  const prixMax = estimation.prixMax || parseFloat(estimation.preEstimation?.prixEt || "0") || 0;
  const prixText = `${formatPrix(prixMin)} - ${formatPrix(prixMax)}`;
  const adresse = estimation.identification?.adresse;

  // ========================================
  // PAGE 1 : COUVERTURE PREMIUM
  // ========================================

  // Fond bicolore
  doc.setFillColor(250, 66, 56); // GARY_RED
  doc.rect(0, 0, pageWidth, pageHeight / 2, "F");

  doc.setFillColor(26, 46, 53); // GARY_DARK
  doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2, "F");

  // Logo GARY centré
  yPos = 55;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.text("GARY", pageWidth / 2, yPos, { align: "center" });

  yPos += 12;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Courtiers Immobiliers", pageWidth / 2, yPos, { align: "center" });

  // Ligne séparation
  yPos += 12;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);

  // Titre document
  yPos += 20;
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("Estimation", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;
  doc.text("Immobilière", pageWidth / 2, yPos, { align: "center" });

  // Adresse du bien
  yPos += 18;
  if (adresse) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(adresse.rue || "", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    doc.text(`${adresse.codePostal || ""} ${adresse.localite || ""}`, pageWidth / 2, yPos, { align: "center" });
  }

  // Prix estimé (dans partie sombre)
  yPos = pageHeight / 2 + 35;
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text("Estimation de prix", pageWidth / 2, yPos, { align: "center" });

  yPos += 12;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(prixText, pageWidth / 2, yPos, { align: "center" });

  // Date et référence en bas
  yPos = pageHeight - 28;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(format(new Date(), "dd MMMM yyyy", { locale: fr }), pageWidth / 2, yPos, { align: "center" });

  yPos += 7;
  doc.setFontSize(9);
  doc.text(`Référence: ${estimation.id?.slice(0, 8) || "N/A"}`, pageWidth / 2, yPos, { align: "center" });

  // ========================================
  // PAGE 2 : À L'ATTENTION DE
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
    doc.text("À l'attention de", marginLeft, yPos);
    yPos += 10;
    
    doc.setFontSize(16);
    doc.setTextColor(250, 66, 56);
    doc.text(`Madame, Monsieur ${nomComplet}`, marginLeft, yPos);
    yPos += 18;
  }

  // Message personnalisé
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const introText = nomComplet
    ? `Suite à notre entretien et à la visite de votre bien situé ${adresse?.rue ? 'au ' + adresse.rue : 'à ' + (adresse?.localite || '')}, nous avons le plaisir de vous transmettre notre estimation détaillée.`
    : `Nous avons le plaisir de vous transmettre l'estimation détaillée du bien situé ${adresse?.rue ? 'au ' + adresse.rue : 'à ' + (adresse?.localite || '')}.`;

  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginLeft, yPos);
  yPos += introLines.length * 6 + 12;

  doc.text("Ce document reprend :", marginLeft, yPos);
  yPos += 8;

  const sections = [
    "L'estimation de prix basée sur notre analyse du marché",
    "Les caractéristiques détaillées de votre bien",
    "Les comparables de référence",
    "Notre stratégie de mise en vente personnalisée",
    "Les prochaines étapes pour concrétiser ce projet"
  ];

  doc.setFontSize(10);
  sections.forEach(section => {
    doc.setTextColor(34, 197, 94);
    doc.text("✓", marginLeft + 3, yPos);
    doc.setTextColor(GARY_DARK);
    doc.text(section, marginLeft + 10, yPos);
    yPos += 7;
  });

  yPos += 12;

  // Message de confiance
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  const closingIntro = "Nous restons à votre entière disposition pour échanger sur cette estimation et répondre à toutes vos questions.";
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

  // Titre section
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Détail de l'estimation", marginLeft, yPos);
  yPos += 12;

  // ========== Encadré Prix ==========
  doc.setFillColor(250, 66, 56);
  doc.roundedRect(marginLeft, yPos, contentWidth, 32, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("FOURCHETTE DE PRIX RECOMMANDÉE", marginLeft + 10, yPos + 10);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(prixText, marginLeft + 10, yPos + 24);

  yPos += 40;

  // ========== AMÉLIORATION #1: Justification détaillée du prix ==========
  const preEst = estimation.preEstimation;
  const carac = estimation.caracteristiques;
  const typeBien = carac?.typeBien;
  const isAppart = typeBien?.toLowerCase().includes('appartement');

  if (preEst) {
    doc.setTextColor(GARY_DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Détail de l'estimation", marginLeft, yPos);
    yPos += 8;

    // Si appartement : décomposition avec prix au m²
    if (isAppart) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);

      const prixM2 = parseFloat(preEst.prixM2 || "0");
      const surface = parseFloat(carac?.surfacePPE || "0");
      
      if (prixM2 > 0 && surface > 0) {
        const valeurBase = prixM2 * surface;
        
        doc.text("Prix au m² marché:", marginLeft + 5, yPos);
        doc.text(`${formatPrix(prixM2)} × ${surface} m²`, marginLeft + 85, yPos);
        doc.setFont("helvetica", "bold");
        doc.text(`= ${formatPrix(valeurBase)}`, marginLeft + 145, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 6;

        // Vétusté
        const tauxVetusteVal = preEst.tauxVetuste;
        const tauxVetuste = typeof tauxVetusteVal === 'number' ? tauxVetusteVal : parseFloat(String(tauxVetusteVal || "0"));
        if (tauxVetuste > 0) {
          const reductionVetuste = valeurBase * (tauxVetuste / 100);
          doc.text(`Travaux à prévoir (${tauxVetuste}%):`, marginLeft + 5, yPos);
          doc.setTextColor(220, 38, 38);
          doc.text(`- ${formatPrix(reductionVetuste)}`, marginLeft + 145, yPos);
          doc.setTextColor(80, 80, 80);
          yPos += 6;
        }

        // Parking intérieur
        const prixPlaceInt = parseFloat(preEst.prixPlaceInt || "0");
        if (prixPlaceInt > 0) {
          doc.text("Place parking intérieure:", marginLeft + 5, yPos);
          doc.setTextColor(34, 197, 94);
          doc.text(`+ ${formatPrix(prixPlaceInt)}`, marginLeft + 145, yPos);
          doc.setTextColor(80, 80, 80);
          yPos += 6;
        }

        // Cave
        const prixCave = parseFloat(preEst.prixCave || "0");
        if (prixCave > 0) {
          doc.text("Cave:", marginLeft + 5, yPos);
          doc.setTextColor(34, 197, 94);
          doc.text(`+ ${formatPrix(prixCave)}`, marginLeft + 145, yPos);
          doc.setTextColor(80, 80, 80);
          yPos += 6;
        }

        // Lignes supplémentaires
        const lignesSupp = preEst.lignesSupp || [];
        lignesSupp.forEach((ligne: { libelle?: string; prix?: string }) => {
          const prix = parseFloat(ligne.prix || "0");
          if (prix !== 0) {
            doc.text(`${ligne.libelle || 'Ajustement'}:`, marginLeft + 5, yPos);
            if (prix > 0) {
              doc.setTextColor(34, 197, 94);
              doc.text(`+ ${formatPrix(prix)}`, marginLeft + 145, yPos);
            } else {
              doc.setTextColor(220, 38, 38);
              doc.text(`${formatPrix(prix)}`, marginLeft + 145, yPos);
            }
            doc.setTextColor(80, 80, 80);
            yPos += 6;
          }
        });

        // Ligne de séparation
        yPos += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft + 90, yPos, marginLeft + contentWidth, yPos);
        yPos += 5;

        // Total
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Valeur estimée:", marginLeft + 5, yPos);
        doc.setTextColor(250, 66, 56);
        const prixRecommande = parseFloat(preEst.prixRecommande || preEst.prixEt || "0");
        doc.text(`${formatPrix(prixRecommande)}`, marginLeft + 145, yPos);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        yPos += 10;
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

  // ========== Caractéristiques principales ==========
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Caractéristiques du bien", marginLeft, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);

  const caracInfo = estimation.caracteristiques;
  if (caracInfo) {
    const caracteristiques = [
      { label: "Type de bien", value: caracInfo.typeBien || "-" },
      { label: "Surface habitable", value: `${caracInfo.surfacePPE || caracInfo.surfaceHabitableMaison || "-"} m²` },
      { label: "Pièces", value: caracInfo.nombrePieces || "-" },
      { label: "Chambres", value: caracInfo.nombreChambres || "-" },
      { label: "Salles de bain", value: caracInfo.nombreSDB || "-" },
      { label: "Étage", value: caracInfo.etage || "-" },
      { label: "Année de construction", value: caracInfo.anneeConstruction || "-" },
      { label: "Style", value: caracInfo.styleArchitectural || "-" },
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

  // ========== AMÉLIORATION #2: Contexte de vente ==========
  const contexte = estimation.identification?.contexte;
  if (contexte && (contexte.motifVente || contexte.horizon || contexte.prioriteVendeur)) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(GARY_DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Contexte de vente", marginLeft, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    // Motif
    if (contexte.motifVente) {
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
      
      doc.setFont("helvetica", "bold");
      doc.text("Motif:", marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(motifsLabels[contexte.motifVente] || contexte.motifVente, marginLeft + 22, yPos);
      yPos += 6;
    }

    // Horizon
    if (contexte.horizon) {
      const horizonsLabels: Record<string, string> = {
        urgent: "Urgent (< 3 mois)",
        court: "Court terme (3-6 mois)",
        moyen: "Moyen terme (6-12 mois)",
        long: "Long terme (> 12 mois)",
        flexible: "Flexible"
      };

      doc.setFont("helvetica", "bold");
      doc.text("Horizon:", marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(horizonsLabels[contexte.horizon] || contexte.horizon, marginLeft + 25, yPos);
      yPos += 6;
    }

    // Priorité
    if (contexte.prioriteVendeur) {
      const prioriteLabels: Record<string, string> = {
        prixMax: "Maximiser le prix de vente",
        rapidite: "Vendre rapidement",
        equilibre: "Équilibre prix / délai"
      };

      doc.setFont("helvetica", "bold");
      doc.text("Priorité:", marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(prioriteLabels[contexte.prioriteVendeur] || contexte.prioriteVendeur, marginLeft + 25, yPos);
      yPos += 6;
    }

    yPos += 5;
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

  // ========== AMÉLIORATION #3: Proximités et cadre de vie ==========
  const proximites = estimation.identification?.proximites;
  if (proximites && Array.isArray(proximites) && proximites.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(GARY_DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Proximités", marginLeft, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    // Grouper par type
    const transports = proximites.filter((p: { type: string }) => p.type?.includes('transport'));
    const ecoles = proximites.filter((p: { type: string }) => p.type === 'ecole');
    const commerces = proximites.filter((p: { type: string }) => p.type === 'commerce');
    const autres = proximites.filter((p: { type: string }) => !['transport_bus', 'transport_tram', 'ecole', 'commerce'].includes(p.type));

    // Transports
    if (transports.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Transports:", marginLeft, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 5;

      transports.slice(0, 3).forEach((transport: { libelle?: string; distance?: string }) => {
        doc.text(`• ${transport.libelle || 'Transport'} - ${transport.distance || ''}`, marginLeft + 5, yPos);
        yPos += 5;
      });
      yPos += 2;
    }

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

  // ========== Prochaines étapes ==========
  doc.addPage();
  yPos = 25;

  doc.setTextColor(GARY_DARK);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Prochaines étapes", marginLeft, yPos);
  yPos += 12;

  // Encadré calendrier prévisionnel
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(marginLeft, yPos, contentWidth, 45, 3, 3, "F");

  yPos += 8;
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.setFont("helvetica", "bold");
  doc.text("Calendrier prévisionnel", marginLeft + 10, yPos);
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
    { date: format(today, "dd.MM.yyyy"), label: "Remise de l'estimation", statut: "✓" },
    { date: format(datePresentation, "dd.MM.yyyy"), label: "Présentation du mandat et signature", statut: "→" },
    { date: format(dateLancement, "dd.MM.yyyy"), label: "Lancement de la mise en vente", statut: "○" }
  ];

  etapesCalendrier.forEach(etape => {
    doc.setFont("helvetica", "bold");
    doc.text(etape.statut, marginLeft + 12, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(etape.date, marginLeft + 22, yPos);
    doc.text(etape.label, marginLeft + 50, yPos);
    yPos += 6;
  });

  yPos += 12;

  // Checklist actions vendeur
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Actions à préparer de votre côté", marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  const actionsVendeur = [
    "Rassembler les documents (acte de propriété, règlement PPE, plans...)",
    "Préparer une liste des travaux effectués ces dernières années",
    "Anticiper les questions techniques (chauffage, isolation, toiture...)",
    "Réfléchir à votre projet post-vente (timing, budget, critères)"
  ];

  actionsVendeur.forEach(action => {
    doc.setDrawColor(150, 150, 150);
    doc.rect(marginLeft + 3, yPos - 3, 3, 3);
    doc.text(action, marginLeft + 10, yPos);
    yPos += 6;
  });

  yPos += 8;

  // Checklist actions courtier
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Ce que nous préparons", marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  const actionsCourtier = [
    "Rédaction du mandat de courtage personnalisé",
    "Préparation du dossier de vente complet",
    "Planning des photos et visites professionnelles",
    "Mise en place de la stratégie de diffusion"
  ];

  actionsCourtier.forEach(action => {
    doc.setFillColor(34, 197, 94);
    doc.rect(marginLeft + 3, yPos - 3, 3, 3, "F");
    doc.text(action, marginLeft + 10, yPos);
    yPos += 6;
  });

  yPos += 15;

  // ========== Page contact courtier améliorée ==========
  doc.addPage();
  yPos = 30;

  // Titre
  doc.setTextColor(GARY_DARK);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Restons en contact", marginLeft, yPos);
  yPos += 15;

  // Encadré courtier
  const encadreWidth = (contentWidth / 2) - 5;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginLeft, yPos, encadreWidth, 70, 3, 3, "F");

  let contactY = yPos + 10;

  // Nom courtier
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(250, 66, 56);
  doc.text("Votre conseiller GARY", marginLeft + 10, contactY);
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
  doc.text(courtierNomComplet, marginLeft + 10, contactY);
  contactY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(telephoneCourtier, marginLeft + 10, contactY);
  contactY += 6;
  doc.text(emailCourtier, marginLeft + 10, contactY);
  contactY += 6;
  doc.text("www.gary-immobilier.ch", marginLeft + 10, contactY);

  // Encadré disponibilité
  const encadreX = marginLeft + encadreWidth + 10;

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(encadreX, yPos, encadreWidth, 70, 3, 3, "F");

  contactY = yPos + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
  doc.text("Disponibilité", encadreX + 10, contactY);
  contactY += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  doc.text("Lundi - Vendredi", encadreX + 10, contactY);
  contactY += 5;
  doc.text("8h00 - 19h00", encadreX + 10, contactY);
  contactY += 8;
  doc.text("Samedi", encadreX + 10, contactY);
  contactY += 5;
  doc.text("9h00 - 17h00", encadreX + 10, contactY);

  yPos += 85;

  // Message personnalisé
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const messageContact = "Pour fixer un rendez-vous de signature du mandat ou pour toute question, n'hésitez pas à me contacter par téléphone ou email. Je me ferai un plaisir de vous accompagner dans votre projet.";

  const messageContactLines = doc.splitTextToSize(messageContact, contentWidth);
  doc.text(messageContactLines, marginLeft, yPos);

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
    
    // Footer droit: Contact (pas sur page de garde)
    if (i > 1) {
      doc.text("contact@gary-immobilier.ch", pageWidth - marginRight, footerY + 1, { align: "right" });
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
