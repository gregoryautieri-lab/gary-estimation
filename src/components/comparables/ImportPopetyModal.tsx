import { useState, useCallback } from 'react';
import { FileSpreadsheet, Loader2, Check, X, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';

interface ParsedTransaction {
  date: string | null;
  typeBien: 'appartement' | 'maison' | null;
  prix: number | null;
  acheteurs: string | null;
  vendeurs: string | null;
  adresse: string | null;
  codePostal: string | null;
  localite: string | null;
  surfaceParcelle: number | null;
  parcelles: string | null;
  // UI state
  selected?: boolean;
  importing?: boolean;
  imported?: boolean;
  error?: string;
  isGary?: boolean;
}

interface ImportPopetyModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function formatPrice(price: number | null): string {
  if (!price) return '-';
  return new Intl.NumberFormat('fr-CH', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' CHF';
}

export function ImportPopetyModal({
  projectId,
  open,
  onClose,
  onSuccess,
}: ImportPopetyModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [parsing, setParsing] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setStep('upload');
    setTransactions([]);
    onClose();
  };

  // Process file (shared between input and drop)
  const processFile = useCallback(async (file: File) => {
    // Check file type
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Format non supporté. Utilisez .xlsx, .xls ou .csv');
      return;
    }

    setParsing(true);
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // Parse with SheetJS (client-side)
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to text for AI parsing
      const rawText = XLSX.utils.sheet_to_csv(sheet, { FS: '\t', RS: '\n' });

      // Limit text size for API
      const truncatedText = rawText.slice(0, 30000);

      // Call edge function for AI parsing
      const { data: result, error } = await supabase.functions.invoke('import-popety', {
        body: { rawText: truncatedText },
      });

      if (error) {
        console.error('Import function error:', error);
        toast.error('Erreur lors de l\'analyse du fichier');
        return;
      }

      if (!result?.success) {
        toast.error(result?.error || 'Erreur inconnue');
        return;
      }

      // Mark all as selected by default
      const txs = (result.transactions || []).map((tx: ParsedTransaction) => ({
        ...tx,
        selected: true,
        isGary: false,
      }));

      setTransactions(txs);
      setStep('preview');
      toast.success(`${txs.length} transaction(s) détectée(s)`);
    } catch (err) {
      console.error('File parse error:', err);
      toast.error('Erreur de lecture du fichier');
    } finally {
      setParsing(false);
    }
  }, []);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // Toggle selection
  const toggleSelection = (index: number) => {
    setTransactions(prev => prev.map((tx, i) => 
      i === index ? { ...tx, selected: !tx.selected } : tx
    ));
  };

  // Toggle all
  const toggleAll = (selected: boolean) => {
    setTransactions(prev => prev.map(tx => ({ ...tx, selected })));
  };

  // Toggle GARY status
  const toggleGary = (index: number) => {
    setTransactions(prev => prev.map((tx, i) => 
      i === index ? { ...tx, isGary: !tx.isGary } : tx
    ));
  };

  // Geocode address
  const geocodeAddress = async (address: string, localite: string | null): Promise<{ lat: number; lng: number } | null> => {
    try {
      const fullAddress = `${address}, ${localite || ''}, Suisse`.trim();
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { 
          action: 'geocode',
          address: fullAddress 
        },
      });

      if (!error && data?.success && data?.location) {
        return data.location;
      }
    } catch (e) {
      console.warn('Geocoding failed:', e);
    }
    return null;
  };

  // Import selected transactions
  const handleImport = async () => {
    if (!user?.id) return;

    const selected = transactions.filter(tx => tx.selected);
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins une transaction');
      return;
    }

    setImporting(true);
    setStep('importing');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (!tx.selected) continue;

      // Update UI
      setTransactions(prev => prev.map((t, idx) => 
        idx === i ? { ...t, importing: true } : t
      ));

      try {
        // Geocode address
        let lat: number | null = null;
        let lng: number | null = null;
        
        if (tx.adresse) {
          const coords = await geocodeAddress(tx.adresse, tx.localite);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }

        // Insert comparable
        const insertData: any = {
          user_id: user.id,
          statut_marche: 'vendu',
          source: tx.isGary ? 'gary_vendu' : 'popety',
          adresse: tx.adresse,
          localite: tx.localite,
          code_postal: tx.codePostal,
          prix: tx.prix,
          type_bien: tx.typeBien,
          date_vente: tx.date ? new Date(tx.date).toISOString() : null,
          acheteurs: tx.acheteurs,
          vendeurs: tx.vendeurs,
          notes: tx.parcelles ? `Parcelle(s): ${tx.parcelles}` : null,
          latitude: lat,
          longitude: lng,
        };

        // Add surface parcelle for maisons
        if (tx.typeBien === 'maison' && tx.surfaceParcelle) {
          insertData.surface_parcelle = tx.surfaceParcelle;
        }

        const { data: comparable, error: insertError } = await supabase
          .from('comparables')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Link to project
        const { error: linkError } = await supabase
          .from('project_comparables_links')
          .insert({
            project_id: projectId,
            comparable_id: comparable.id,
            selected_by_user: true,
          });

        if (linkError) throw linkError;

        // Update UI success
        setTransactions(prev => prev.map((t, idx) => 
          idx === i ? { ...t, importing: false, imported: true } : t
        ));
        successCount++;

      } catch (err) {
        console.error('Import error for transaction:', err);
        setTransactions(prev => prev.map((t, idx) => 
          idx === i ? { ...t, importing: false, error: 'Échec' } : t
        ));
        errorCount++;
      }
    }

    setImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} transaction(s) importée(s)`);
      onSuccess();
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} échec(s) d'import`);
    }
  };

  const selectedCount = transactions.filter(tx => tx.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col overflow-hidden min-h-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer des transactions (Popety)
          </DialogTitle>
          <DialogDescription>
            Importez un fichier Excel de transactions immobilières pour les ajouter comme comparables.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div 
            className="py-8"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyse du fichier en cours...</p>
                  <p className="text-xs text-muted-foreground">L'IA extrait les transactions</p>
                </div>
              ) : (
                <>
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-foreground font-medium mb-2">
                    Glissez un fichier Excel ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formats supportés: .xlsx, .xls, .csv
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="popety-file-input"
                  />
                  <Button asChild>
                    <label htmlFor="popety-file-input" className="cursor-pointer">
                      Choisir un fichier
                    </label>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {(step === 'preview' || step === 'importing') && (
          <>
            {/* Header with selection controls */}
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedCount === transactions.length && transactions.length > 0}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                  disabled={step === 'importing'}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedCount} / {transactions.length} sélectionné(s)
                </span>
              </div>
              <Badge variant="secondary">{transactions.length} transaction(s)</Badge>
            </div>

            {/* Transaction list */}
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              <div className="space-y-3 py-4">
                {transactions.map((tx, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      tx.imported ? 'bg-green-50 dark:bg-green-950/20 border-green-200' :
                      tx.error ? 'bg-destructive/10 border-destructive/30' :
                      tx.selected ? 'border-primary/50' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={tx.selected}
                        onCheckedChange={() => toggleSelection(index)}
                        disabled={step === 'importing' || tx.imported}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Price + Type */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg">
                            {formatPrice(tx.prix)}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {tx.typeBien || 'Inconnu'}
                          </Badge>
                          {tx.isGary && (
                            <Badge className="bg-primary text-primary-foreground">
                              GARY
                            </Badge>
                          )}
                        </div>

                        {/* Address */}
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {tx.adresse || 'Adresse non extraite'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.codePostal} {tx.localite}
                        </p>

                        {/* Details row */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          {tx.date && (
                            <span>📅 {new Date(tx.date).toLocaleDateString('fr-CH')}</span>
                          )}
                          {tx.surfaceParcelle && (
                            <span>📐 Parcelle: {tx.surfaceParcelle} m²</span>
                          )}
                          {tx.vendeurs && (
                            <span className="truncate max-w-[200px]">
                              Vendeur: {tx.vendeurs}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status / GARY toggle */}
                      <div className="flex flex-col items-end gap-2">
                        {tx.importing && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                        {tx.imported && (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                        {tx.error && (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                        {!tx.importing && !tx.imported && !tx.error && (
                          <Select
                            value={tx.isGary ? 'gary' : 'externe'}
                            onValueChange={(v) => {
                              if (v === 'gary') {
                                setTransactions(prev => prev.map((t, i) => 
                                  i === index ? { ...t, isGary: true } : t
                                ));
                              } else {
                                setTransactions(prev => prev.map((t, i) => 
                                  i === index ? { ...t, isGary: false } : t
                                ));
                              }
                            }}
                            disabled={step === 'importing'}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="externe">Externe</SelectItem>
                              <SelectItem value="gary">GARY vendu</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setStep('upload')}
                disabled={importing}
              >
                Nouveau fichier
              </Button>
              <Button 
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  `Importer ${selectedCount} transaction(s)`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
