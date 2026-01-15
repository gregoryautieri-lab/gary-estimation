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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';

interface ComparableImportProps {
  type: 'vendu' | 'enVente';
  onImport: (comparable: Comparable) => void;
  estimationId?: string;
  currentZone?: string;
  currentType?: TypeBien;
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
}: ComparableImportProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'gary'>('url');
  
  // État pour import URL simplifié
  const [url, setUrl] = useState('');
  
  // État pour recherche GARY
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<TypeBien | ''>('');
  const [searchPriceMin, setSearchPriceMin] = useState('');
  const [searchPriceMax, setSearchPriceMax] = useState('');
  const [searching, setSearching] = useState(false);
  const [garyResults, setGaryResults] = useState<GaryComparable[]>([]);

  // Détecter la source depuis l'URL
  const getSourceFromUrl = (urlStr: string): string => {
    if (urlStr.includes('immoscout24')) return 'ImmoScout';
    if (urlStr.includes('homegate')) return 'Homegate';
    if (urlStr.includes('immobilier.ch')) return 'Immobilier.ch';
    if (urlStr.includes('acheter-louer')) return 'Acheter-Louer';
    if (urlStr.includes('newhome')) return 'Newhome';
    return 'Web';
  };

  const handleImportUrl = () => {
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

    const source = getSourceFromUrl(url.trim());

    const comparable: Comparable = {
      adresse: '',
      prix: '',
      surface: '',
      nombrePieces: '',
      lien: url.trim(),
      source: source,
      commentaire: `Importé depuis ${source}`,
      isGary: false,
    };

    onImport(comparable);
    toast.success(`Lien ${source} ajouté — complétez les informations`);
    handleClose();
  };

  const handleSearchGary = async () => {
    setSearching(true);
    setGaryResults([]);

    try {
      let query = supabase
        .from('estimations')
        .select('id, adresse, localite, code_postal, prix_final, caracteristiques, type_bien, updated_at, courtier_id')
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
    setSearchQuery('');
    setGaryResults([]);
  };

  const content = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'gary')} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="url" className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Coller lien
        </TabsTrigger>
        <TabsTrigger value="gary" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Mandats GARY
        </TabsTrigger>
      </TabsList>

      {/* Import depuis URL - SIMPLIFIÉ */}
      <TabsContent value="url" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Lien de l'annonce</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.immoscout24.ch/..."
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Collez le lien pour le sauvegarder. Vous remplirez les détails manuellement.
          </p>
        </div>

        <Button onClick={handleImportUrl} className="w-full" disabled={!url.trim()}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Ajouter ce comparable
        </Button>

        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          Le lien sera sauvegardé et accessible via l'icône 🔗
        </div>
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
      <Link2 className="h-4 w-4" />
      Ajouter lien
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
                Collez un lien ou recherchez dans les mandats GARY
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
              Collez un lien ou recherchez dans les mandats GARY
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}
