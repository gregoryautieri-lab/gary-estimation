import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle, MapPin, Loader2, ExternalLink, Link, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ProjectData } from '@/hooks/useProjectDetail';
import { scrapeComparableUrl, detectSourceFromUrl } from '@/lib/api/comparables';

// NPA coordinates fallback for commune center
const NPA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "1200": { lat: 46.2044, lng: 6.1432 },
  "1201": { lat: 46.2088, lng: 6.1420 },
  "1202": { lat: 46.2155, lng: 6.1296 },
  "1203": { lat: 46.2180, lng: 6.1180 },
  "1204": { lat: 46.2000, lng: 6.1450 },
  "1205": { lat: 46.1920, lng: 6.1400 },
  "1206": { lat: 46.1900, lng: 6.1600 },
  "1207": { lat: 46.1950, lng: 6.1750 },
  "1208": { lat: 46.1880, lng: 6.1650 },
  "1209": { lat: 46.2250, lng: 6.1100 },
  "1212": { lat: 46.1870, lng: 6.1250 },
  "1213": { lat: 46.1750, lng: 6.1350 },
  "1214": { lat: 46.1800, lng: 6.0950 },
  "1215": { lat: 46.2000, lng: 6.0800 },
  "1216": { lat: 46.1950, lng: 6.0600 },
  "1217": { lat: 46.2000, lng: 6.0400 },
  "1218": { lat: 46.1870, lng: 6.1150 },
  "1219": { lat: 46.2150, lng: 6.1050 },
  "1220": { lat: 46.2200, lng: 6.0800 },
  "1222": { lat: 46.2050, lng: 6.0500 },
  "1223": { lat: 46.2120, lng: 6.1850 },
  "1224": { lat: 46.1800, lng: 6.1800 },
  "1225": { lat: 46.1850, lng: 6.2000 },
  "1226": { lat: 46.1900, lng: 6.2100 },
  "1227": { lat: 46.1700, lng: 6.1550 },
  "1228": { lat: 46.1650, lng: 6.1400 },
  "1231": { lat: 46.1550, lng: 6.1200 },
  "1232": { lat: 46.1500, lng: 6.1050 },
  "1233": { lat: 46.1400, lng: 6.0900 },
  "1234": { lat: 46.1600, lng: 6.0700 },
  "1236": { lat: 46.1350, lng: 6.1200 },
  "1237": { lat: 46.1200, lng: 6.1100 },
  "1239": { lat: 46.1100, lng: 6.0900 },
  "1241": { lat: 46.2400, lng: 6.0600 },
  "1242": { lat: 46.2300, lng: 6.0400 },
  "1243": { lat: 46.2100, lng: 6.0200 },
  "1244": { lat: 46.1900, lng: 6.2300 },
  "1245": { lat: 46.2000, lng: 6.2400 },
  "1246": { lat: 46.2100, lng: 6.2550 },
  "1247": { lat: 46.2200, lng: 6.2700 },
  "1248": { lat: 46.2300, lng: 6.2900 },
  "1251": { lat: 46.1300, lng: 6.0650 },
  "1252": { lat: 46.1400, lng: 6.0500 },
  "1253": { lat: 46.1550, lng: 6.0350 },
  "1254": { lat: 46.1650, lng: 6.0200 },
  "1255": { lat: 46.1750, lng: 6.0100 },
  "1256": { lat: 46.1600, lng: 5.9950 },
  "1257": { lat: 46.1450, lng: 5.9800 },
  "1258": { lat: 46.1300, lng: 5.9650 },
  "1260": { lat: 46.3833, lng: 6.2333 },
  "1196": { lat: 46.2900, lng: 6.1700 },
  "1197": { lat: 46.3100, lng: 6.1900 },
  "1180": { lat: 46.4600, lng: 6.3800 },
  "1110": { lat: 46.5110, lng: 6.4990 },
};

interface AddManualComparableModalProps {
  projectId: string;
  project: ProjectData | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DuplicateMatch {
  id: string;
  adresse: string;
  localite: string;
  prix: number | null;
  surface: number | null;
}

interface FormData {
  adresse: string;
  codePostal: string;
  localite: string;
  typeBien: string;
  prix: string;
  surface: string;
  surfaceParcelle: string;
  pieces: string;
  statutMarche: 'vendu' | 'en_vente';
  strategieDiffusion: string;
  dateVente: string;
  notes: string;
  urlSource: string;
  acheteurs: string;
  vendeurs: string;
}

const TYPE_BIEN_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
];

const STRATEGIE_OPTIONS = [
  { value: 'non_specifie', label: 'Non spécifié' },
  { value: 'off_market', label: 'Off-market' },
  { value: 'coming_soon', label: 'Coming soon' },
  { value: 'public', label: 'Public' },
];

export function AddManualComparableModal({
  projectId,
  project,
  open,
  onClose,
  onSuccess,
}: AddManualComparableModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [coordinatesFallback, setCoordinatesFallback] = useState(false); // true if using NPA fallback
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    adresse: '',
    codePostal: '',
    localite: '',
    typeBien: '',
    prix: '',
    surface: '',
    surfaceParcelle: '',
    pieces: '',
    statutMarche: 'en_vente',
    strategieDiffusion: '',
    dateVente: '',
    notes: '',
    urlSource: '',
    acheteurs: '',
    vendeurs: '',
  });

  // Pre-fill from project
  useEffect(() => {
    if (open && project) {
      setFormData(prev => ({
        ...prev,
        localite: project.communes[0] || '',
        typeBien: project.typeBien[0] || '',
        prix: project.prixMin ? String(project.prixMin) : '',
      }));
      setDuplicates([]);
      setCoordinates(null);
      setCoordinatesFallback(false);
      setScrapedImages([]);
    }
  }, [open, project]);

  // Normalize address for comparison
  const normalizeAddress = (addr: string, loc: string): string => {
    return `${addr.toLowerCase().trim()}_${loc.toLowerCase().trim()}`.replace(/\s+/g, '');
  };

  // Debounced duplicate check
  useEffect(() => {
    if (!open || !formData.adresse || !formData.localite) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        // Search in comparables table first
        const { data: existingComparables } = await supabase
          .from('comparables')
          .select('id, adresse, localite, prix, surface')
          .ilike('adresse', `%${formData.adresse.trim()}%`)
          .ilike('localite', `%${formData.localite.trim()}%`)
          .limit(5);

        // Also search in estimations
        const { data: existingEstimations } = await supabase
          .from('estimations')
          .select('id, adresse, localite, prix_final')
          .ilike('adresse', `%${formData.adresse.trim()}%`)
          .ilike('localite', `%${formData.localite.trim()}%`)
          .limit(5);

        const matches: DuplicateMatch[] = [];
        
        if (existingComparables) {
          matches.push(...existingComparables.map(c => ({
            id: c.id,
            adresse: c.adresse || '',
            localite: c.localite || '',
            prix: c.prix ? Number(c.prix) : null,
            surface: c.surface ? Number(c.surface) : null,
          })));
        }
        
        if (existingEstimations) {
          matches.push(...existingEstimations.map(e => ({
            id: e.id,
            adresse: e.adresse || '',
            localite: e.localite || '',
            prix: e.prix_final ? Number(e.prix_final) : null,
            surface: null,
          })));
        }

        setDuplicates(matches);
      } catch (err) {
        console.error('Duplicate check error:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [open, formData.adresse, formData.localite]);

  // Scrape URL when entered
  const handleScrapeUrl = useCallback(async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    
    setScraping(true);
    try {
      const result = await scrapeComparableUrl(url);
      
      if (result.success && result.data) {
        const scraped = result.data;
        
        // Auto-fill form with scraped data
        setFormData(prev => ({
          ...prev,
          adresse: scraped.adresse || prev.adresse,
          prix: scraped.prix?.replace(/[^\d]/g, '') || prev.prix,
          surface: scraped.surface?.replace(/[^\d.,]/g, '').replace(',', '.') || prev.surface,
          pieces: scraped.nombrePieces?.replace(/[^\d.,]/g, '').replace(',', '.') || prev.pieces,
          typeBien: scraped.typeBien?.toLowerCase() === 'maison' ? 'maison' : 
                    scraped.typeBien?.toLowerCase() === 'terrain' ? 'terrain' : 
                    prev.typeBien || 'appartement',
        }));
        
        // Store scraped images
        if (scraped.images && scraped.images.length > 0) {
          setScrapedImages(scraped.images);
        }
        
        toast.success(`Données extraites de ${scraped.source || detectSourceFromUrl(url)}`);
      } else if (result.fallback) {
        toast.info('Scraping limité - remplissez les champs manuellement');
      } else {
        toast.error('Impossible d\'extraire les données');
      }
    } catch (err) {
      console.error('Scrape error:', err);
      toast.error('Erreur lors de l\'extraction');
    } finally {
      setScraping(false);
    }
  }, []);

  // Geocode address (with NPA fallback)
  const handleGeocode = useCallback(async () => {
    // If we have an address, try exact geocoding
    if (formData.adresse && formData.localite) {
      setGeocoding(true);
      setCoordinatesFallback(false);
      try {
        const { data, error } = await supabase.functions.invoke('google-places', {
          body: {
            action: 'geocode',
            address: `${formData.adresse}, ${formData.codePostal} ${formData.localite}, Suisse`,
          },
        });

        if (!error && data?.success && data?.location) {
          setCoordinates(data.location);
          toast.success('Adresse géolocalisée');
          setGeocoding(false);
          return;
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
      setGeocoding(false);
    }
    
    // Fallback: use NPA coordinates for commune center
    if (formData.codePostal && NPA_COORDINATES[formData.codePostal]) {
      setCoordinates(NPA_COORDINATES[formData.codePostal]);
      setCoordinatesFallback(true);
      toast.success('Position au centre de la commune (NPA)');
      return;
    }
    
    // Try geocoding just the locality
    if (formData.localite) {
      setGeocoding(true);
      try {
        const { data, error } = await supabase.functions.invoke('google-places', {
          body: {
            action: 'geocode',
            address: `${formData.codePostal || ''} ${formData.localite}, Suisse`,
          },
        });

        if (!error && data?.success && data?.location) {
          setCoordinates(data.location);
          setCoordinatesFallback(true);
          toast.success('Position au centre de la commune');
          setGeocoding(false);
          return;
        }
      } catch (err) {
        console.error('Geocoding locality error:', err);
      }
      setGeocoding(false);
    }
    
    toast.error('Impossible de géolocaliser - renseignez le NPA ou la localité');
  }, [formData.adresse, formData.codePostal, formData.localite]);

  // Submit form
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    // Adresse peut être vide si on a au moins la localité (pour biens "en vente" sans adresse exacte)
    if (!formData.localite) {
      toast.error('La localité est obligatoire');
      return;
    }

    setLoading(true);
    try {
      // 1. Insert into comparables table
      const insertData: any = {
        user_id: user.id,
        adresse: formData.adresse.trim() || `${formData.localite} (centre)`, // Fallback if no address
        code_postal: formData.codePostal.trim() || null,
        localite: formData.localite.trim(),
        statut_marche: formData.statutMarche,
        source: formData.urlSource ? detectSourceFromUrl(formData.urlSource) : 'manual',
      };
      
      // Add optional fields
      if (formData.typeBien) insertData.type_bien = formData.typeBien;
      if (formData.prix) insertData.prix = parseFloat(formData.prix);
      if (formData.surface) insertData.surface = parseFloat(formData.surface);
      if (formData.surfaceParcelle) insertData.surface_parcelle = parseFloat(formData.surfaceParcelle);
      if (formData.pieces) insertData.pieces = parseFloat(formData.pieces);
      if (formData.strategieDiffusion && formData.strategieDiffusion !== 'non_specifie') insertData.strategie_diffusion = formData.strategieDiffusion;
      if (formData.dateVente) insertData.date_vente = new Date(formData.dateVente).toISOString();
      if (coordinates?.lat) insertData.latitude = coordinates.lat;
      if (coordinates?.lng) insertData.longitude = coordinates.lng;
      if (formData.urlSource.trim()) insertData.url_source = formData.urlSource.trim();
      if (formData.notes.trim()) insertData.notes = formData.notes.trim();
      if (scrapedImages.length > 0) insertData.images = scrapedImages;
      if (formData.acheteurs.trim()) insertData.acheteurs = formData.acheteurs.trim();
      if (formData.vendeurs.trim()) insertData.vendeurs = formData.vendeurs.trim();

      const { data: newComparable, error: insertError } = await supabase
        .from('comparables')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Impossible de créer le comparable');
        return;
      }

      // 2. Link to project
      const { error: linkError } = await supabase
        .from('project_comparables_links')
        .insert({
          project_id: projectId,
          comparable_id: newComparable.id,
          selected_by_user: true,
        });

      if (linkError) {
        console.error('Link error:', linkError);
        toast.error('Comparable créé mais non lié au projet');
        return;
      }

      toast.success('Comparable ajouté au projet');
      onSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPrice = (value: string) => {
    const num = parseInt(value.replace(/\D/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('fr-CH');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un comparable externe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Duplicate Warning */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {duplicates.length} doublon{duplicates.length > 1 ? 's' : ''} potentiel{duplicates.length > 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 space-y-1">
                    {duplicates.slice(0, 3).map(d => (
                      <p key={d.id} className="text-xs text-amber-700 dark:text-amber-300">
                        • {d.adresse}, {d.localite} 
                        {d.prix && ` — ${d.prix.toLocaleString('fr-CH')} CHF`}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="adresse">Adresse (optionnel pour "en vente")</Label>
              <div className="relative">
                <Input
                  id="adresse"
                  placeholder="Rue et numéro (ou vide si inconnu)"
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                />
                {checkingDuplicates && (
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="codePostal">NPA</Label>
                <Input
                  id="codePostal"
                  placeholder="1200"
                  value={formData.codePostal}
                  onChange={(e) => handleInputChange('codePostal', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="localite">Localité *</Label>
                <Input
                  id="localite"
                  placeholder="Genève"
                  value={formData.localite}
                  onChange={(e) => handleInputChange('localite', e.target.value)}
                />
              </div>
            </div>

            {/* Geocode button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeocode}
              disabled={geocoding || (!formData.localite && !formData.codePostal)}
              className="w-full"
            >
              {geocoding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {coordinates 
                ? coordinatesFallback 
                  ? 'Position commune ✓' 
                  : 'Géolocalisé ✓' 
                : 'Géolocaliser l\'adresse'}
            </Button>
            {coordinatesFallback && coordinates && (
              <p className="text-xs text-amber-600 text-center">
                📍 Position au centre de la commune (pas d'adresse exacte)
              </p>
            )}
          </div>

          {/* Characteristics Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="typeBien">Type de bien</Label>
                <Select
                  value={formData.typeBien}
                  onValueChange={(v) => handleInputChange('typeBien', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_BIEN_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statutMarche">Statut marché *</Label>
                <Select
                  value={formData.statutMarche}
                  onValueChange={(v) => handleInputChange('statutMarche', v as 'vendu' | 'en_vente')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_vente">En vente</SelectItem>
                    <SelectItem value="vendu">Vendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={`grid gap-3 ${formData.typeBien === 'maison' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
              <div>
                <Label htmlFor="prix">Prix (CHF)</Label>
                <Input
                  id="prix"
                  type="text"
                  inputMode="numeric"
                  placeholder="1'500'000"
                  value={formData.prix}
                  onChange={(e) => handleInputChange('prix', e.target.value.replace(/[^\d]/g, ''))}
                />
              </div>
              <div>
                <Label htmlFor="surface">Surface m²</Label>
                <Input
                  id="surface"
                  type="number"
                  placeholder="120"
                  value={formData.surface}
                  onChange={(e) => handleInputChange('surface', e.target.value)}
                />
              </div>
              {formData.typeBien === 'maison' && (
                <div>
                  <Label htmlFor="surfaceParcelle">Parcelle m²</Label>
                  <Input
                    id="surfaceParcelle"
                    type="number"
                    placeholder="800"
                    value={formData.surfaceParcelle}
                    onChange={(e) => handleInputChange('surfaceParcelle', e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="pieces">Pièces</Label>
                <Input
                  id="pieces"
                  type="number"
                  step="0.5"
                  placeholder="4.5"
                  value={formData.pieces}
                  onChange={(e) => handleInputChange('pieces', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="strategieDiffusion">Stratégie</Label>
                <Select
                  value={formData.strategieDiffusion}
                  onValueChange={(v) => handleInputChange('strategieDiffusion', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non spécifié" />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.statutMarche === 'vendu' && (
                <div>
                  <Label htmlFor="dateVente">Date de vente</Label>
                  <Input
                    id="dateVente"
                    type="date"
                    value={formData.dateVente}
                    onChange={(e) => handleInputChange('dateVente', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Acheteurs / Vendeurs (pour transactions) */}
            {formData.statutMarche === 'vendu' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vendeurs">Vendeur(s)</Label>
                  <Input
                    id="vendeurs"
                    placeholder="Nom du vendeur"
                    value={formData.vendeurs}
                    onChange={(e) => handleInputChange('vendeurs', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="acheteurs">Acheteur(s)</Label>
                  <Input
                    id="acheteurs"
                    placeholder="Nom de l'acheteur"
                    value={formData.acheteurs}
                    onChange={(e) => handleInputChange('acheteurs', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional Section */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor="urlSource">URL source (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  id="urlSource"
                  type="url"
                  placeholder="https://immoscout24.ch/..."
                  value={formData.urlSource}
                  onChange={(e) => handleInputChange('urlSource', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleScrapeUrl(formData.urlSource)}
                  disabled={scraping || !formData.urlSource || !formData.urlSource.startsWith('http')}
                  title="Extraire les données de l'annonce"
                >
                  {scraping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {scraping && (
                <p className="text-xs text-muted-foreground mt-1 animate-pulse">
                  ⏳ Extraction des données en cours...
                </p>
              )}
            </div>
            
            {/* Scraped images preview */}
            {scrapedImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  {scrapedImages.length} photo{scrapedImages.length > 1 ? 's' : ''} trouvée{scrapedImages.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {scrapedImages.slice(0, 4).map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-14 h-14 object-cover rounded-md border flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ))}
                  {scrapedImages.length > 4 && (
                    <div className="w-14 h-14 bg-muted rounded-md border flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                      +{scrapedImages.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Observations, infos supplémentaires..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.localite}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
