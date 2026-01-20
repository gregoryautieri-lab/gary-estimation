import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ArrowLeft, Filter, Save, MapPin, Loader2, Building2, Home, Ruler, DoorOpen } from 'lucide-react';
import { MultiSelectCommunes } from '@/components/ui/multi-select-communes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types de bien disponibles (doit correspondre à l'enum type_bien en base)
const TYPE_BIEN_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison / Villa' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'immeuble', label: 'Immeuble' },
];

// Configuration des statuts
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  mandat_signe: { label: 'Vendu', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  presentee: { label: 'En vente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
  en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  termine: { label: 'Terminé', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
};

const TYPE_BIEN_ICONS: Record<string, React.ReactNode> = {
  appartement: <Building2 className="h-4 w-4" />,
  maison: <Home className="h-4 w-4" />,
  terrain: <MapPin className="h-4 w-4" />,
  commercial: <Building2 className="h-4 w-4" />,
  immeuble: <Building2 className="h-4 w-4" />,
};

interface ExploreFilters {
  communes: string[];
  prixMin: number | null;
  prixMax: number | null;
  typeBien: string[];
}

interface ComparableResult {
  id: string;
  adresse: string;
  localite: string;
  prixFinal: number | null;
  typeBien: string;
  statut: string;
  surface: number | null;
  pieces: number | null;
}

export default function ComparablesExplore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Initialiser les filtres depuis les params URL si présents
  const [filters, setFilters] = useState<ExploreFilters>(() => {
    const communesParam = searchParams.get('communes');
    return {
      communes: communesParam ? communesParam.split(',') : [],
      prixMin: searchParams.get('prixMin') ? Number(searchParams.get('prixMin')) : null,
      prixMax: searchParams.get('prixMax') ? Number(searchParams.get('prixMax')) : null,
      typeBien: searchParams.get('types') ? searchParams.get('types')!.split(',') : ['appartement', 'maison'],
    };
  });
  
  const [results, setResults] = useState<ComparableResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  // Rechercher les estimations quand les filtres changent
  useEffect(() => {
    const searchEstimations = async () => {
      if (filters.communes.length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from('estimations')
          .select('id, adresse, localite, prix_final, type_bien, statut, caracteristiques');

        // Filtre communes
        query = query.in('localite', filters.communes);

        // Filtre prix
        if (filters.prixMin) {
          query = query.gte('prix_final', filters.prixMin);
        }
        if (filters.prixMax) {
          query = query.lte('prix_final', filters.prixMax);
        }

        // Filtre type de bien
        if (filters.typeBien.length > 0) {
          query = query.in('type_bien', filters.typeBien as any);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Search error:', error);
          toast.error('Erreur lors de la recherche');
          return;
        }

        // Transformer les résultats
        const transformed: ComparableResult[] = (data || []).map((est) => {
          const carac = est.caracteristiques as any;
          
          return {
            id: est.id,
            adresse: est.adresse || 'Adresse inconnue',
            localite: est.localite || 'Commune inconnue',
            prixFinal: est.prix_final,
            typeBien: est.type_bien || 'inconnu',
            statut: est.statut,
            surface: parseFloat(carac?.surfacePPE || carac?.surfaceHabitableMaison || '0') || null,
            pieces: parseFloat(carac?.nombrePieces || '0') || null,
          };
        });

        setResults(transformed);
      } catch (err) {
        console.error('Unexpected error:', err);
        toast.error('Erreur lors de la recherche');
      } finally {
        setLoading(false);
      }
    };

    // Debounce la recherche
    const timer = setTimeout(searchEstimations, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Séparer les résultats par statut
  const { vendus, enVente, autres } = useMemo(() => {
    const vendus: ComparableResult[] = [];
    const enVente: ComparableResult[] = [];
    const autres: ComparableResult[] = [];

    results.forEach((r) => {
      if (r.statut === 'mandat_signe') {
        vendus.push(r);
      } else if (r.statut === 'presentee') {
        enVente.push(r);
      } else {
        autres.push(r);
      }
    });

    return { vendus, enVente, autres };
  }, [results]);

  // Créer un projet avec ces critères - navigue vers NewProject avec params
  const handleCreateProject = () => {
    const params = new URLSearchParams();
    if (filters.communes.length > 0) {
      params.set('communes', filters.communes.join(','));
    }
    if (filters.prixMin) {
      params.set('prixMin', filters.prixMin.toString());
    }
    if (filters.prixMax) {
      params.set('prixMax', filters.prixMax.toString());
    }
    if (filters.typeBien.length > 0) {
      params.set('types', filters.typeBien.join(','));
    }
    
    navigate(`/comparables/nouveau?${params.toString()}`);
  };

  const updateFilter = <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const parseNumber = (value: string): number | null => {
    const num = value.replace(/[^\d]/g, '');
    return num ? parseInt(num, 10) : null;
  };

  const formatNumber = (value: number | null): string => {
    return value ? value.toLocaleString('fr-CH') : '';
  };

  const formatPrice = (price: number | null): string => {
    if (!price) return '—';
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Composant carte de résultat
  const ResultCard = ({ item }: { item: ComparableResult }) => {
    const statusConfig = STATUS_CONFIG[item.statut] || STATUS_CONFIG.brouillon;
    const icon = TYPE_BIEN_ICONS[item.typeBien] || <Building2 className="h-4 w-4" />;
    
    return (
      <div
        className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => navigate(`/estimation/${item.id}/overview`)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <span className="font-medium">{item.localite}</span>
          </div>
          <Badge className={cn("text-xs shrink-0", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
        
        <p className="text-lg font-semibold text-primary mb-2">
          {formatPrice(item.prixFinal)}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          {item.surface && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {item.surface} m²
            </span>
          )}
          {item.pieces && (
            <span className="flex items-center gap-1">
              <DoorOpen className="h-3.5 w-3.5" />
              {item.pieces} p
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground truncate">
          <MapPin className="h-3.5 w-3.5 inline mr-1" />
          {item.adresse}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/comparables')}
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Exploration</h1>
            <p className="text-xs text-muted-foreground">
              {results.length} bien{results.length !== 1 ? 's' : ''} trouvé{results.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton créer projet */}
          {filters.communes.length > 0 && (
            <Button
              size="sm"
              onClick={handleCreateProject}
            >
              <Save className="h-4 w-4 mr-2" />
              Créer projet
            </Button>
          )}

          {/* Bouton filtres */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Communes */}
                <div className="space-y-2">
                  <Label>Communes *</Label>
                  <MultiSelectCommunes
                    value={filters.communes}
                    onChange={(v) => updateFilter('communes', v)}
                    placeholder="Sélectionner des communes..."
                  />
                </div>

                {/* Prix */}
                <div className="space-y-2">
                  <Label>Fourchette de prix (CHF)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Min"
                      value={formatNumber(filters.prixMin)}
                      onChange={(e) => updateFilter('prixMin', parseNumber(e.target.value))}
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Max"
                      value={formatNumber(filters.prixMax)}
                      onChange={(e) => updateFilter('prixMax', parseNumber(e.target.value))}
                    />
                  </div>
                </div>

                {/* Types de bien */}
                <div className="space-y-2">
                  <Label>Types de bien</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_BIEN_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`explore-type-${option.value}`}
                          checked={filters.typeBien.includes(option.value)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...filters.typeBien, option.value]
                              : filters.typeBien.filter((v) => v !== option.value);
                            updateFilter('typeBien', newValue);
                          }}
                        />
                        <label
                          htmlFor={`explore-type-${option.value}`}
                          className="text-sm leading-none cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vendus</span>
                    <Badge variant="secondary">{vendus.length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">En vente</span>
                    <Badge variant="outline">{enVente.length}</Badge>
                  </div>
                  {autres.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Autres</span>
                      <Badge variant="outline">{autres.length}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-8">
        {filters.communes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
            <div className="text-center space-y-4 max-w-sm">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="font-medium text-foreground">Sélectionnez des communes</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ouvrez les filtres et choisissez les communes à explorer.
                </p>
              </div>
              <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Ouvrir les filtres
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
            <div className="text-center space-y-4">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="font-medium text-foreground">Aucun résultat</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Modifiez vos critères de recherche.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Vendus */}
            {vendus.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Vendus ({vendus.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {vendus.map((item) => (
                    <ResultCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* En vente */}
            {enVente.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  En vente ({enVente.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {enVente.map((item) => (
                    <ResultCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Autres */}
            {autres.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Autres ({autres.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {autres.map((item) => (
                    <ResultCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
