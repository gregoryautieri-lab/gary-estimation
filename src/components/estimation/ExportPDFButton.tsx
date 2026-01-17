import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Download, Loader2 } from "lucide-react";
import { generatePDFStandalone } from "@/utils/pdf/pdfStandalone";
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
      await generatePDFStandalone(estimation, {
        inclurePhotos: config?.inclurePhotos ?? true,
        inclureCarte: config?.inclureCarte ?? true,
        onProgress: (msg, pct) => {
          console.log(`[PDF] ${msg} (${pct}%)`);
        }
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
          Générer PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
