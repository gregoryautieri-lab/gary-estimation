import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ArrowLeft, Filter, Save, MapPin, Loader2 } from 'lucide-react';
import { MultiSelectCommunes } from '@/components/ui/multi-select-communes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types de bien disponibles
const TYPE_BIEN_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'villa', label: 'Villa' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'immeuble', label: 'Immeuble' },
];

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
  lat?: number;
  lng?: number;
}

export default function ComparablesExplore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState<ExploreFilters>({
    communes: [],
    prixMin: null,
    prixMax: null,
    typeBien: ['appartement', 'maison', 'villa'],
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
          .select('id, adresse, localite, prix_final, type_bien, statut, caracteristiques, identification');

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
          const ident = est.identification as any;
          
          return {
            id: est.id,
            adresse: est.adresse || ident?.adresseComplete || 'Adresse inconnue',
            localite: est.localite || 'Commune inconnue',
            prixFinal: est.prix_final,
            typeBien: est.type_bien || 'inconnu',
            statut: est.statut,
            surface: parseFloat(carac?.surfacePPE || carac?.surfaceHabitableMaison || '0') || null,
            pieces: parseFloat(carac?.nombrePieces || '0') || null,
            lat: ident?.latitude,
            lng: ident?.longitude,
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
  const { vendus, enVente } = useMemo(() => {
    const vendus: ComparableResult[] = [];
    const enVente: ComparableResult[] = [];

    results.forEach((r) => {
      if (r.statut === 'mandat_signe') {
        vendus.push(r);
      } else if (r.statut === 'presentee') {
        enVente.push(r);
      }
    });

    return { vendus, enVente };
  }, [results]);

  // Créer un projet avec ces critères
  const handleCreateProject = async () => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (filters.communes.length === 0) {
      toast.error('Sélectionnez au moins une commune');
      return;
    }

    setCreatingProject(true);
    try {
      // Récupérer le nom du courtier
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      // Générer un nom de projet basé sur les filtres
      const projectName = filters.communes.length === 1 
        ? `${filters.communes[0]}${filters.prixMin || filters.prixMax ? ` ${(filters.prixMin ? filters.prixMin / 1000000 : 0).toFixed(1)}-${(filters.prixMax ? filters.prixMax / 1000000 : '∞')}M` : ''}`
        : `${filters.communes.length} communes`;

      const { data: newProject, error } = await supabase
        .from('projects_comparables')
        .insert({
          user_id: user.id,
          courtier_name: profile?.full_name || user.email,
          project_name: projectName,
          communes: filters.communes,
          prix_min: filters.prixMin,
          prix_max: filters.prixMax,
          type_bien: filters.typeBien,
          statut_filter: 'tous',
          last_search_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !newProject) {
        console.error('Error creating project:', error);
        toast.error('Erreur lors de la création');
        return;
      }

      // Lier les résultats actuels au projet
      if (results.length > 0) {
        const linksToInsert = results.map((r) => ({
          project_id: newProject.id,
          estimation_id: r.id,
          selected_by_user: false,
        }));

        await supabase.from('project_comparables_links').insert(linksToInsert);
      }

      toast.success(`Projet "${projectName}" créé avec ${results.length} comparables !`);
      navigate(`/comparables/${newProject.id}`);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erreur lors de la création');
    } finally {
      setCreatingProject(false);
    }
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
              disabled={creatingProject}
            >
              {creatingProject ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
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
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative">
        {filters.communes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-sm">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="font-medium text-foreground">Sélectionnez des communes</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ouvrez les filtres et choisissez les communes à explorer sur la carte.
                </p>
              </div>
              <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Ouvrir les filtres
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
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
          <div className="h-[calc(100vh-60px)]">
            <ComparablesMap
              principalAdresse={filters.communes.join(', ')}
              principalCommune={filters.communes[0]}
              vendus={vendus.map((v) => ({
                adresse: v.adresse,
                commune: v.localite,
                prix: v.prixFinal?.toString() || '',
                prixM2: v.surface ? ((v.prixFinal || 0) / v.surface).toFixed(0) : '',
                lat: v.lat,
                lng: v.lng,
              }))}
              enVente={enVente.map((v) => ({
                adresse: v.adresse,
                commune: v.localite,
                prix: v.prixFinal?.toString() || '',
                prixM2: v.surface ? ((v.prixFinal || 0) / v.surface).toFixed(0) : '',
                lat: v.lat,
                lng: v.lng,
              }))}
            />
          </div>
        )}
      </main>
    </div>
  );
}
