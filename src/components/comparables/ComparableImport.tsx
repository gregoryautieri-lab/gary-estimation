import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Comparable, TypeBien } from '@/types/estimation';
import { 
  ClipboardPaste, 
  Building2, 
  Search, 
  Loader2, 
  ExternalLink,
  MapPin,
  Home,
  Banknote,
  Ruler,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';

interface ComparableImportProps {
  type: 'vendu' | 'enVente';
  onImport: (comparable: Comparable) => void;
  estimationId?: string;
  currentZone?: string; // Code postal ou commune pour filtrer
  currentType?: TypeBien; // Type de bien pour filtrer
}

interface ParsedAnnonce {
  adresse: string;
  prix: string;
  surface: string;
  nombrePieces: string;
  typeBien: string;
  source: string;
  lien: string;
}

interface GaryComparable {
  id: string;
  adresse: string;
  localite: string;
  codePostal: string;
  prix: number;
  surface: number;
  nombrePieces: string;
  typeBien: TypeBien;
  dateVente?: string;
  courtier: string;
}

export function ComparableImport({ 
  type, 
  onImport, 
  estimationId,
  currentZone,
  currentType 
}: ComparableImportProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'gary'>('url');
  
  // État pour import URL
  const [url, setUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedAnnonce | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // État pour recherche GARY
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<TypeBien | ''>('');
  const [searchPriceMin, setSearchPriceMin] = useState('');
  const [searchPriceMax, setSearchPriceMax] = useState('');
  const [searching, setSearching] = useState(false);
  const [garyResults, setGaryResults] = useState<GaryComparable[]>([]);

  const handleParseUrl = async () => {
    if (!url.trim()) {
      toast.error('Veuillez coller une URL');
      return;
    }

    setParsing(true);
    setParseError(null);
    setParsedData(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-annonce', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (data?.success && data.data) {
        setParsedData(data.data);
        toast.success('Annonce analysée avec succès');
      } else {
        setParseError(data?.error || 'Impossible de parser cette annonce');
      }
    } catch (err) {
      console.error('Erreur parsing:', err);
      setParseError('Erreur lors de l\'analyse de l\'annonce');
    } finally {
      setParsing(false);
    }
  };

  const handleImportParsed = () => {
    if (!parsedData) return;

    const comparable: Comparable = {
      adresse: parsedData.adresse,
      prix: parsedData.prix,
      surface: parsedData.surface,
      nombrePieces: parsedData.nombrePieces,
      typeBien: parsedData.typeBien as TypeBien,
      lien: parsedData.lien,
      source: parsedData.source,
      commentaire: `Importé depuis ${parsedData.source}`,
      isGary: false,
    };

    onImport(comparable);
    toast.success('Comparable importé');
    handleClose();
  };

  const handleSearchGary = async () => {
    setSearching(true);
    setGaryResults([]);

    try {
      // Recherche dans les mandats vendus GARY
      let query = supabase
        .from('estimations')
        .select('id, adresse, localite, code_postal, prix_final, caracteristiques, type_bien, updated_at, courtier_id')
        .eq('statut', 'mandat_signe')
        .not('prix_final', 'is', null);

      // Filtres
      if (searchQuery) {
        query = query.or(`adresse.ilike.%${searchQuery}%,localite.ilike.%${searchQuery}%`);
      }
      if (searchType) {
        query = query.eq('type_bien', searchType);
      }
      if (searchPriceMin) {
        query = query.gte('prix_final', parseInt(searchPriceMin));
      }
      if (searchPriceMax) {
        query = query.lte('prix_final', parseInt(searchPriceMax));
      }

      // Exclure l'estimation courante
      if (estimationId) {
        query = query.neq('id', estimationId);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      const results: GaryComparable[] = (data || []).map(est => ({
        id: est.id,
        adresse: est.adresse || 'Adresse non renseignée',
        localite: est.localite || '',
        codePostal: est.code_postal || '',
        prix: est.prix_final || 0,
        surface: parseFloat((est.caracteristiques as any)?.surfacePPE || 
                           (est.caracteristiques as any)?.surfaceHabitableMaison || '0'),
        nombrePieces: (est.caracteristiques as any)?.nombrePieces || '',
        typeBien: est.type_bien as TypeBien || 'appartement',
        dateVente: est.updated_at,
        courtier: est.courtier_id,
      }));

      setGaryResults(results);

      if (results.length === 0) {
        toast.info('Aucun mandat GARY correspondant trouvé');
      }
    } catch (err) {
      console.error('Erreur recherche GARY:', err);
      toast.error('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  const handleImportGary = (gary: GaryComparable) => {
    const fullAddress = gary.codePostal 
      ? `${gary.adresse}, ${gary.codePostal} ${gary.localite}`
      : `${gary.adresse}, ${gary.localite}`;

    const comparable: Comparable = {
      adresse: fullAddress,
      prix: gary.prix.toString(),
      surface: gary.surface.toString(),
      nombrePieces: gary.nombrePieces,
      typeBien: gary.typeBien,
      dateVente: gary.dateVente ? new Date(gary.dateVente).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' }) : undefined,
      source: 'GARY',
      commentaire: 'Mandat GARY vendu',
      isGary: true,
    };

    onImport(comparable);
    toast.success('Comparable GARY importé');
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setUrl('');
    setParsedData(null);
    setParseError(null);
    setSearchQuery('');
    setGaryResults([]);
  };

  const content = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'gary')} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="url" className="flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4" />
          Coller URL
        </TabsTrigger>
        <TabsTrigger value="gary" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Mandats GARY
        </TabsTrigger>
      </TabsList>

      {/* Import depuis URL */}
      <TabsContent value="url" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>URL de l'annonce</Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.immoscout24.ch/..."
              className="flex-1"
            />
            <Button onClick={handleParseUrl} disabled={parsing}>
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyser'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Fonctionne avec ImmoScout24, Homegate, Acheter-Louer, Newhome...
          </p>
        </div>

        {parseError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{parseError}</span>
          </div>
        )}

        {parsedData && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Données extraites</span>
              <Badge variant="outline">{parsedData.source}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{parsedData.adresse || 'Non trouvée'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>{parsedData.prix ? formatPriceCHF(parseInt(parsedData.prix)) : 'Non trouvé'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span>{parsedData.surface ? `${parsedData.surface} m²` : 'Non trouvée'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>{parsedData.nombrePieces ? `${parsedData.nombrePieces} pièces` : 'Non trouvé'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleImportParsed} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Importer ce comparable
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={parsedData.lien} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {/* Recherche dans mandats GARY */}
      <TabsContent value="gary" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Localité ou adresse..."
              className="flex-1"
            />
            <Button onClick={handleSearchGary} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as TypeBien | '')}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Tout type</option>
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
            </select>
            <Input
              type="number"
              value={searchPriceMin}
              onChange={(e) => setSearchPriceMin(e.target.value)}
              placeholder="Prix min"
            />
            <Input
              type="number"
              value={searchPriceMax}
              onChange={(e) => setSearchPriceMax(e.target.value)}
              placeholder="Prix max"
            />
          </div>
        </div>

        {searching && (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!searching && garyResults.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {garyResults.map((gary) => (
              <div
                key={gary.id}
                onClick={() => handleImportGary(gary)}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {gary.adresse}
                      </span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        GARY
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {gary.codePostal} {gary.localite}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {formatPriceCHF(gary.prix)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {gary.surface > 0 && `${gary.surface} m² • `}
                      {gary.nombrePieces && `${gary.nombrePieces} pcs`}
                    </div>
                  </div>
                </div>
                {gary.dateVente && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    Vendu {new Date(gary.dateVente).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!searching && garyResults.length === 0 && activeTab === 'gary' && (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Recherchez dans les mandats GARY vendus</p>
            <p className="text-sm">Ces biens seront marqués d'un badge GARY</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  const triggerButton = (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setOpen(true)}
      className="gap-2"
    >
      <ClipboardPaste className="h-4 w-4" />
      Import intelligent
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                Importer un comparable {type === 'vendu' ? 'vendu' : 'en vente'}
              </DrawerTitle>
              <DrawerDescription>
                Collez une URL d'annonce ou recherchez dans les mandats GARY
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {triggerButton}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Importer un comparable {type === 'vendu' ? 'vendu' : 'en vente'}
            </DialogTitle>
            <DialogDescription>
              Collez une URL d'annonce ou recherchez dans les mandats GARY
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}
