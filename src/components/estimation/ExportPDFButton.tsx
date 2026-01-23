import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { generatePDFHtml } from "@/utils/pdf/pdfHtmlGenerator";
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
      await generatePDFHtml(estimation, {
        inclurePhotos: config?.inclurePhotos ?? true,
        inclureCarte: config?.inclureCarte ?? true
      });
      toast.success("PDF généré ! Utilisez l'impression pour sauvegarder.");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={exporting}
      onClick={handleDownload}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      Export PDF
    </Button>
  );
}
