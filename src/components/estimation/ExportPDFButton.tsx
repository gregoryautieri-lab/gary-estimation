import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Download, Share2, Loader2 } from "lucide-react";
import { downloadEstimationPDF, getEstimationPDFBlob } from "@/utils/pdfExport";
import { EstimationData, PDFConfig } from "@/types/estimation";
import { toast } from "sonner";

interface ExportPDFButtonProps {
  estimation: EstimationData;
  config?: Partial<PDFConfig>;
  className?: string;
}

export function ExportPDFButton({ estimation, config, className }: ExportPDFButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    setExporting(true);
    try {
      await downloadEstimationPDF({ estimation, config });
      toast.success("PDF téléchargé !");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast.error("Le partage n'est pas supporté sur ce navigateur");
      return;
    }

    setExporting(true);
    try {
      const blob = await getEstimationPDFBlob({ estimation, config });
      const file = new File(
        [blob],
        `estimation-${estimation.id?.slice(0, 8) || "export"}.pdf`,
        { type: "application/pdf" }
      );

      await navigator.share({
        title: "Estimation GARY",
        text: `Estimation pour ${estimation.identification?.adresse?.rue || "Bien immobilier"}`,
        files: [file],
      });
      toast.success("Document partagé !");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing PDF:", error);
        toast.error("Erreur lors du partage");
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Export PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && navigator.share && (
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
