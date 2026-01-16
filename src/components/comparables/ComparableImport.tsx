import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Comparable, TypeBien } from '@/types/estimation';
import { 
  Link2, 
  Building2, 
  Search, 
  Loader2, 
  Calendar,
  CheckCircle2,
  Sparkles,
  MapPin,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';
import { scrapeComparableUrl, detectSourceFromUrl, findNearbyGaryComparables, geocodeAddress, calculatePrixM2 } from '@/lib/api/comparables';
import { formatDistance, getDistanceFromReference } from '@/lib/geoDistance';

interface ComparableImportProps {
  type: 'vendu' | 'enVente';
  onImport: (comparable: Comparable) => void;
  estimationId?: string;
  currentZone?: string;
  currentType?: TypeBien;
  currentPrix?: number;
  currentCoordinates?: { lat: number; lng: number } | null;
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
  coordinates?: { lat: number; lng: number };
  distance?: number;
}

export function ComparableImport({ 
  type, 
  onImport, 
  estimationId,
  currentZone,
  currentType,
  currentPrix,
  currentCoordinates,
}: ComparableImportProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'gary' | 'suggestions'>('url');
  
  // État pour import URL avec scraping
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<{
    adresse?: string;
    prix?: string;
    surface?: string;
    nombrePieces?: string;
    typeBien?: string;
    source?: string;
  } | null>(null);
  
  // État pour recherche GARY
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<TypeBien | ''>('');
  const [searchPriceMin, setSearchPriceMin] = useState('');
  const [searchPriceMax, setSearchPriceMax] = useState('');
  const [searching, setSearching] = useState(false);
  const [garyResults, setGaryResults] = useState<GaryComparable[]>([]);

  // Suggestions automatiques
  const [suggestions, setSuggestions] = useState<Comparable[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Charger les suggestions automatiquement à l'ouverture
  useEffect(() => {
    if (open && activeTab === 'suggestions' && suggestions.length === 0) {
      loadSuggestions();
    }
  }, [open, activeTab]);

  const loadSuggestions = async () => {
    if (!currentZone && !currentType) return;
    
    setLoadingSuggestions(true);
    try {
      const prixRange = currentPrix ? {
        prixMin: Math.round(currentPrix * 0.7),
        prixMax: Math.round(currentPrix * 1.3),
      } : {};

      const results = await findNearbyGaryComparables({
        localite: currentZone,
        typeBien: currentType,
        excludeId: estimationId,
        limit: 8,
        ...prixRange,
      });

      // Calculer les distances si on a les coordonnées du bien principal
      const withDistances = results.map(comp => {
        const distance = getDistanceFromReference(currentCoordinates, comp.coordinates);
        return {
          ...comp,
          distance: distance ? formatDistance(distance) : undefined,
        };
      });

      setSuggestions(withDistances as any);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Scraper une URL
  const handleScrapeUrl = async () => {
    if (!url.trim()) {
      toast.error('Veuillez coller une URL');
      return;
    }

    // Valider que c'est une URL
    try {
      new URL(url.trim());
    } catch {
      toast.error('URL invalide');
      return;
    }

    setScraping(true);
    setScrapedData(null);

    try {
      const result = await scrapeComparableUrl(url.trim());
      
      if (result.success && result.data) {
        setScrapedData(result.data);
        toast.success('Données extraites avec succès !');
      } else if (result.fallback) {
        // Firecrawl non disponible ou erreur, mode manuel
        setScrapedData({
          source: detectSourceFromUrl(url.trim()),
        });
        toast.info('Extraction automatique indisponible - remplissez manuellement');
      } else {
        toast.error(result.error || 'Erreur de scraping');
      }
    } catch (err) {
      console.error('Scrape error:', err);
      setScrapedData({
        source: detectSourceFromUrl(url.trim()),
      });
      toast.info('Extraction non disponible - remplissez manuellement');
    } finally {
      setScraping(false);
    }
  };

  // Importer depuis URL (avec ou sans données scrapées)
  const handleImportUrl = async () => {
    const source = scrapedData?.source || detectSourceFromUrl(url.trim());
    
    // Géocoder l'adresse si disponible
    let coordinates: { lat: number; lng: number } | undefined;
    if (scrapedData?.adresse) {
      const geocoded = await geocodeAddress(scrapedData.adresse);
      if (geocoded) {
        coordinates = geocoded;
      }
    }

    // Calculer la distance si possible
    let commentaire = scrapedData?.adresse 
      ? `Importé depuis ${source}` 
      : `Lien ${source} - à compléter`;

    if (coordinates && currentCoordinates) {
      const distance = getDistanceFromReference(currentCoordinates, coordinates);
      if (distance !== null) {
        commentaire += ` • ${formatDistance(distance)} du bien`;
      }
    }

    const comparable: Comparable = {
      adresse: scrapedData?.adresse || '',
      prix: scrapedData?.prix || '',
      surface: scrapedData?.surface || '',
      nombrePieces: scrapedData?.nombrePieces || '',
      typeBien: scrapedData?.typeBien as TypeBien || undefined,
      lien: url.trim(),
      source: source,
      commentaire,
      isGary: false,
      coordinates,
      prixM2: calculatePrixM2(scrapedData?.prix || '', scrapedData?.surface || ''),
    };

    onImport(comparable);
    
    if (scrapedData?.prix && scrapedData?.surface) {
      toast.success('Comparable importé avec toutes les données !');
    } else {
      toast.success(`Lien ${source} ajouté — complétez les informations`);
    }
    handleClose();
  };

  const handleSearchGary = async () => {
    setSearching(true);
    setGaryResults([]);

    try {
      let query = supabase
        .from('estimations')
        .select('id, adresse, localite, code_postal, prix_final, caracteristiques, type_bien, updated_at, courtier_id, identification')
        .eq('statut', 'mandat_signe')
        .not('prix_final', 'is', null);

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

      if (estimationId) {
        query = query.neq('id', estimationId);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      const results: GaryComparable[] = (data || []).map(est => {
        const ident = est.identification as any;
        const coords = ident?.adresse?.coordinates;
        const distance = currentCoordinates && coords 
          ? getDistanceFromReference(currentCoordinates, coords)
          : null;

        return {
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
          coordinates: coords,
          distance: distance !== null ? distance : undefined,
        };
      });

      // Trier par distance si disponible
      results.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
      });

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

    let commentaire = 'Mandat GARY vendu';
    if (gary.distance !== undefined) {
      commentaire += ` • ${formatDistance(gary.distance)} du bien`;
    }

    const comparable: Comparable = {
      adresse: fullAddress,
      prix: gary.prix.toString(),
      surface: gary.surface.toString(),
      nombrePieces: gary.nombrePieces,
      typeBien: gary.typeBien,
      dateVente: gary.dateVente ? new Date(gary.dateVente).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' }) : undefined,
      source: 'GARY',
      commentaire,
      isGary: true,
      coordinates: gary.coordinates,
      prixM2: gary.surface > 0 ? Math.round(gary.prix / gary.surface).toString() : '',
    };

    onImport(comparable);
    toast.success('Comparable GARY importé');
    handleClose();
  };

  const handleImportSuggestion = (suggestion: Comparable) => {
    onImport(suggestion);
    toast.success('Suggestion importée');
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setUrl('');
    setScrapedData(null);
    setSearchQuery('');
    setGaryResults([]);
  };

  const content = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'gary' | 'suggestions')} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs">
          <Link2 className="h-3.5 w-3.5" />
          URL
        </TabsTrigger>
        <TabsTrigger value="gary" className="flex items-center gap-1.5 text-xs">
          <Building2 className="h-3.5 w-3.5" />
          GARY
        </TabsTrigger>
        <TabsTrigger value="suggestions" className="flex items-center gap-1.5 text-xs">
          <Lightbulb className="h-3.5 w-3.5" />
          Suggestions
        </TabsTrigger>
      </TabsList>

      {/* Import depuis URL avec scraping intelligent */}
      <TabsContent value="url" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Lien de l'annonce</Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.immoscout24.ch/..."
              className="flex-1"
            />
            <Button 
              onClick={handleScrapeUrl} 
              disabled={scraping || !url.trim()}
              variant="secondary"
              size="icon"
            >
              {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cliquez sur ✨ pour extraire automatiquement les données
          </p>
        </div>

        {/* Données extraites */}
        {scrapedData && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {scrapedData.source || 'Web'}
              </Badge>
              {scrapedData.prix && (
                <span className="font-bold text-primary">
                  {formatPriceCHF(parseFloat(scrapedData.prix))}
                </span>
              )}
            </div>

            {scrapedData.adresse && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{scrapedData.adresse}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {scrapedData.surface && <span>{scrapedData.surface} m²</span>}
              {scrapedData.nombrePieces && <span>• {scrapedData.nombrePieces} pièces</span>}
              {scrapedData.typeBien && <span>• {scrapedData.typeBien}</span>}
            </div>

            {!scrapedData.prix && !scrapedData.surface && (
              <p className="text-xs text-amber-600">
                ⚠️ Extraction partielle — vous pourrez compléter après import
              </p>
            )}
          </div>
        )}

        <Button 
          onClick={handleImportUrl} 
          className="w-full" 
          disabled={!url.trim()}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {scrapedData?.prix ? 'Importer ce comparable' : 'Ajouter le lien'}
        </Button>
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
                      <Badge variant="secondary" className="bg-primary/10 text-primary shrink-0">
                        GARY
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {gary.codePostal} {gary.localite}
                    </div>
                    {gary.distance !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <MapPin className="h-3 w-3" />
                        {formatDistance(gary.distance)} du bien
                      </div>
                    )}
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

      {/* Suggestions automatiques */}
      <TabsContent value="suggestions" className="space-y-4 mt-4">
        {loadingSuggestions && (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!loadingSuggestions && suggestions.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2">
              Comparables GARY proches de votre bien ({currentZone || 'zone non définie'})
            </p>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id || index}
                onClick={() => handleImportSuggestion(suggestion)}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-sm">
                        {suggestion.adresse}
                      </span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary shrink-0 text-xs">
                        GARY
                      </Badge>
                    </div>
                    {(suggestion as any).distance && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <MapPin className="h-3 w-3" />
                        {(suggestion as any).distance}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-sm">
                      {formatPriceCHF(parseFloat(suggestion.prix))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.surface && `${suggestion.surface} m²`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingSuggestions && suggestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune suggestion disponible</p>
            <p className="text-sm mt-1">
              {!currentZone && !currentType 
                ? 'Renseignez la localité et le type de bien pour voir des suggestions'
                : 'Pas de comparables GARY dans cette zone'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={loadSuggestions}
            >
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
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
      <Link2 className="h-4 w-4" />
      Ajouter
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
                Ajouter un comparable {type === 'vendu' ? 'vendu' : 'en vente'}
              </DrawerTitle>
              <DrawerDescription>
                Scrapez une URL, recherchez GARY ou voyez les suggestions
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
              Ajouter un comparable {type === 'vendu' ? 'vendu' : 'en vente'}
            </DialogTitle>
            <DialogDescription>
              Scrapez une URL, recherchez GARY ou voyez les suggestions
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}
