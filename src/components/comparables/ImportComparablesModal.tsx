import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Loader2, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCommunes } from '@/hooks/useCommunes';
import { supabase } from '@/integrations/supabase/client';
import { ImportFilters, ImportFiltersState } from './ImportFilters';
import { EstimationSelectCard } from './EstimationSelectCard';

interface ImportComparablesModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EstimationRow {
  id: string;
  type_bien: string | null;
  localite: string | null;
  prix_final: number | null;
  caracteristiques: any;
  statut: string;
  adresse: string | null;
  updated_at: string;
}

const PAGE_SIZE = 50;

export default function ImportComparablesModal({
  projectId,
  open,
  onClose,
  onSuccess,
}: ImportComparablesModalProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { communes, loading: loadingCommunes } = useCommunes();

  // État
  const [estimations, setEstimations] = useState<EstimationRow[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filtres
  const [filters, setFilters] = useState<ImportFiltersState>({
    commune: '',
    prixMin: null,
    prixMax: null,
    typeBien: [],
    statut: 'tous',
  });

  // Debounce pour les filtres prix
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1); // Reset page on filter change
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Fetch linked estimation IDs
  const fetchLinkedIds = useCallback(async () => {
    const { data, error } = await supabase
      .from('project_comparables_links')
      .select('estimation_id')
      .eq('project_id', projectId);

    if (!error && data) {
      setLinkedIds(new Set(data.map(l => l.estimation_id)));
    }
  }, [projectId]);

  // Fetch estimations with filters
  const fetchEstimations = useCallback(async () => {
    setLoading(true);

    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      
      let query = supabase
        .from('estimations')
        .select('id, type_bien, localite, prix_final, caracteristiques, statut, adresse, updated_at', { count: 'exact' });

      // Filtre statut (optionnel - RLS gère la visibilité)
      if (debouncedFilters.statut === 'vendus') {
        query = query.eq('statut', 'mandat_signe');
      } else if (debouncedFilters.statut === 'en_vente') {
        query = query.eq('statut', 'presentee');
      }
      // "tous" = pas de filtre statut, RLS s'occupe de la visibilité

      // Filtre commune
      if (debouncedFilters.commune) {
        query = query.eq('localite', debouncedFilters.commune);
      }

      // Filtre prix
      if (debouncedFilters.prixMin) {
        query = query.gte('prix_final', debouncedFilters.prixMin);
      }
      if (debouncedFilters.prixMax) {
        query = query.lte('prix_final', debouncedFilters.prixMax);
      }

      // Filtre type bien
      if (debouncedFilters.typeBien.length > 0) {
        query = query.in('type_bien', debouncedFilters.typeBien as ('appartement' | 'commercial' | 'immeuble' | 'maison' | 'terrain')[]);
      }

      // Tri et pagination
      query = query
        .order('updated_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching estimations:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les estimations',
          variant: 'destructive',
        });
        return;
      }

      setEstimations(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedFilters, toast]);

  // Charger données à l'ouverture
  useEffect(() => {
    if (open) {
      fetchLinkedIds();
      fetchEstimations();
      setSelectedIds(new Set()); // Reset sélection
    }
  }, [open, fetchLinkedIds, fetchEstimations]);

  // Toggle sélection
  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Tout sélectionner (non liés uniquement)
  const handleSelectAll = () => {
    const selectableIds = estimations
      .filter(e => !linkedIds.has(e.id))
      .map(e => e.id);
    
    const allSelected = selectableIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      // Désélectionner tout
      setSelectedIds(prev => {
        const next = new Set(prev);
        selectableIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Sélectionner tout
      setSelectedIds(prev => {
        const next = new Set(prev);
        selectableIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Nombre de sélectionnables sur la page courante
  const selectableOnPage = useMemo(() => 
    estimations.filter(e => !linkedIds.has(e.id)),
    [estimations, linkedIds]
  );

  const allOnPageSelected = selectableOnPage.length > 0 && 
    selectableOnPage.every(e => selectedIds.has(e.id));

  // Ajouter les comparables sélectionnés
  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;

    setSubmitting(true);

    try {
      const linksToInsert = Array.from(selectedIds).map(estimationId => ({
        project_id: projectId,
        estimation_id: estimationId,
        selected_by_user: true,
      }));

      const { error } = await supabase
        .from('project_comparables_links')
        .insert(linksToInsert);

      if (error) {
        // Vérifier si c'est une erreur de doublon
        if (error.code === '23505') {
          toast({
            title: 'Attention',
            description: 'Certains comparables étaient déjà liés',
            variant: 'default',
          });
        } else {
          throw error;
        }
      }

      toast({
        title: 'Succès',
        description: `${selectedIds.size} comparable${selectedIds.size > 1 ? 's' : ''} ajouté${selectedIds.size > 1 ? 's' : ''} !`,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding comparables:', err);
      toast({
        title: 'Erreur',
        description: 'Échec de l\'ajout, réessayez',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className={
          isMobile 
            ? "w-full h-full max-w-none max-h-none m-0 rounded-none flex flex-col" 
            : "max-w-4xl max-h-[90vh] flex flex-col"
        }
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importer comparables existants
          </DialogTitle>
        </DialogHeader>

        <div className={`flex-1 overflow-hidden flex ${isMobile ? 'flex-col' : 'gap-4'}`}>
          {/* Filtres */}
          <div className={isMobile ? 'flex-shrink-0' : 'w-72 flex-shrink-0 overflow-y-auto'}>
            <ImportFilters
              filters={filters}
              onFiltersChange={setFilters}
              communes={communes}
              loadingCommunes={loadingCommunes}
              resultCount={totalCount}
            />
          </div>

          {/* Liste des estimations */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Checkbox "Tout sélectionner" */}
            {selectableOnPage.length > 0 && (
              <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  Tout sélectionner ({selectableOnPage.length} disponible{selectableOnPage.length > 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Chargement des estimations...</span>
                </div>
              ) : estimations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="font-medium">Aucune estimation trouvée</p>
                  <p className="text-sm mt-1">Modifiez vos filtres de recherche.</p>
                </div>
              ) : (
                estimations.map((estimation) => (
                  <EstimationSelectCard
                    key={estimation.id}
                    estimation={estimation}
                    isSelected={selectedIds.has(estimation.id)}
                    isLinked={linkedIds.has(estimation.id)}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-3 border-t bg-muted/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedIds.size === 0 || submitting}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Ajouter {selectedIds.size > 0 ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? 's' : ''}` : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
