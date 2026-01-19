import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Plus, MapPin, Filter, ArrowUpDown, Loader2, AlertTriangle, FolderOpen, FilePlus2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { useProjectDetail, ComparableData } from '@/hooks/useProjectDetail';
import { ProjectDetailMap } from '@/components/comparables/ProjectDetailMap';
import { ComparableListCard } from '@/components/comparables/ComparableListCard';
import ImportComparablesModal from '@/components/comparables/ImportComparablesModal';
import { AddManualComparableModal } from '@/components/comparables/AddManualComparableModal';
import { supabase } from '@/integrations/supabase/client';

type SortOption = 'recent' | 'oldest' | 'price_asc' | 'price_desc' | 'surface_asc' | 'surface_desc';
type StatusFilter = 'all' | 'mandat_signe' | 'presentee' | 'other';

function formatPrice(price: number | null): string {
  if (!price) return '-';
  return new Intl.NumberFormat('fr-CH', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const { project, comparables, loading, error, reload, removeComparable } = useProjectDetail(projectId);
  
  // UI State
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedComparableId, setSelectedComparableId] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [addManualModalOpen, setAddManualModalOpen] = useState(false);
  const [removingComparable, setRemovingComparable] = useState<ComparableData | null>(null);
  const [exporting, setExporting] = useState(false);

  // Get geolocated comparables for export
  const geolocatedComparables = useMemo(() => 
    comparables.filter(c => c.coordinates?.lat && c.coordinates?.lng),
    [comparables]
  );

  // Export map as PNG
  const handleExportMap = async () => {
    if (geolocatedComparables.length === 0) {
      toast.error("Aucun comparable géolocalisé à exporter");
      return;
    }

    setExporting(true);
    try {
      // Build markers array with colors based on status
      const markers = geolocatedComparables.map(c => {
        // Blue for sold (mandat_signe/vendu), Green for en_vente, Gray for others
        let color: "blue" | "green" | "gray" = "gray";
        if (c.sourceType === 'external') {
          // External comparables use statut_marche
          color = c.statut === 'vendu' ? 'blue' : c.statut === 'en_vente' ? 'green' : 'gray';
        } else {
          // GARY estimations use statut
          color = c.statut === 'mandat_signe' ? 'blue' : c.statut === 'presentee' ? 'green' : 'gray';
        }
        return {
          lat: c.coordinates!.lat,
          lng: c.coordinates!.lng,
          color
        };
      });

      // Calculate center (average of coordinates)
      const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;

      // Calculate optimal zoom based on bounding box
      const latitudes = markers.map(m => m.lat);
      const longitudes = markers.map(m => m.lng);
      const latDelta = Math.max(...latitudes) - Math.min(...latitudes);
      const lngDelta = Math.max(...longitudes) - Math.min(...longitudes);
      const maxDelta = Math.max(latDelta, lngDelta);

      let zoom = 13;
      if (maxDelta > 0.1) zoom = 11;
      if (maxDelta > 0.2) zoom = 10;
      if (maxDelta > 0.5) zoom = 9;
      if (maxDelta < 0.02) zoom = 14;
      if (maxDelta < 0.005) zoom = 15;

      // Call edge function
      const { data, error } = await supabase.functions.invoke('static-map-proxy', {
        body: {
          type: 'static-export',
          lat: avgLat,
          lng: avgLng,
          zoom,
          mapType: 'roadmap',
          markers
        }
      });

      if (error) throw error;
      if (!data?.image) throw new Error("Pas d'image reçue");

      // Convert base64 to blob and download
      const base64Data = data.image.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = project?.projectName?.replace(/[^a-zA-Z0-9]/g, '-') || 'carte';
      link.download = `carte-comparables-${safeName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Carte exportée avec succès !");
    } catch (err) {
      console.error('Export map error:', err);
      toast.error("Échec de l'export, réessayez.");
    } finally {
      setExporting(false);
    }
  };

  // Compute statistics
  const stats = useMemo(() => {
    if (comparables.length === 0) return null;
    
    const prices = comparables
      .map(c => c.prixFinal)
      .filter((p): p is number => p !== null && p > 0)
      .sort((a, b) => a - b);
    
    const nbVendus = comparables.filter(c => 
      c.sourceType === 'external' ? c.statutMarche === 'vendu' : c.statut === 'mandat_signe'
    ).length;
    
    const nbEnVente = comparables.filter(c => 
      c.sourceType === 'external' ? c.statutMarche === 'en_vente' : c.statut === 'presentee'
    ).length;
    
    // Median calculation
    const median = prices.length > 0 
      ? prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)]
      : null;
    
    return {
      total: comparables.length,
      nbVendus,
      nbEnVente,
      prixMedian: median,
    };
  }, [comparables]);

  // Filter and sort comparables
  const filteredComparables = useMemo(() => {
    let result = [...comparables];

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'other') {
        result = result.filter(c => c.statut !== 'mandat_signe' && c.statut !== 'presentee');
      } else {
        result = result.filter(c => c.statut === statusFilter);
      }
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        break;
      case 'price_asc':
        result.sort((a, b) => (a.prixFinal || 0) - (b.prixFinal || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.prixFinal || 0) - (a.prixFinal || 0));
        break;
      case 'surface_asc':
        result.sort((a, b) => (a.surface || 0) - (b.surface || 0));
        break;
      case 'surface_desc':
        result.sort((a, b) => (b.surface || 0) - (a.surface || 0));
        break;
    }

    return result;
  }, [comparables, sortBy, statusFilter]);

  // Handle locate comparable on map
  const handleLocate = (comparable: ComparableData) => {
    setSelectedComparableId(comparable.linkId);
    // Scroll to map
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle remove confirmation
  const handleConfirmRemove = async () => {
    if (!removingComparable) return;
    await removeComparable(removingComparable.linkId);
    setRemovingComparable(null);
  };

  // Handle view estimation details (only for GARY comparables)
  const handleViewDetails = (comparable: ComparableData) => {
    if (comparable.estimationId) {
      navigate(`/estimation/${comparable.estimationId}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-5 w-40" />
        </header>
        <main className="flex-1 p-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-80 rounded-xl mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
          <Button variant="ghost" size="icon" onClick={() => navigate('/comparables')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-foreground font-medium">Projets Comparables</span>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Projet non trouvé</h2>
            <p className="text-muted-foreground mb-4">{error || 'Ce projet n\'existe pas ou vous n\'y avez pas accès.'}</p>
            <Button onClick={() => navigate('/comparables')}>
              Retour aux projets
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate('/comparables')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{project.projectName}</h1>
          <p className="text-xs text-muted-foreground">
            {project.nbComparables} comparable{project.nbComparables !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className="flex-1">
        {/* Project Summary with Stats */}
        <div className="px-4 py-4 border-b bg-muted/30">
          {/* Criteria badges */}
          <div className="flex flex-wrap gap-2 text-sm">
            {project.communes.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {project.communes.slice(0, 2).join(', ')}
                {project.communes.length > 2 && ` +${project.communes.length - 2}`}
              </Badge>
            )}
            {(project.prixMin || project.prixMax) && (
              <Badge variant="outline">
                {project.prixMin ? formatPrice(project.prixMin) : '0'} - {project.prixMax ? formatPrice(project.prixMax) : '∞'} CHF
              </Badge>
            )}
            {project.typeBien.length > 0 && (
              <Badge variant="outline" className="capitalize">
                {project.typeBien.slice(0, 2).join(', ')}
                {project.typeBien.length > 2 && ` +${project.typeBien.length - 2}`}
              </Badge>
            )}
          </div>

          {/* Statistics row */}
          {stats && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats.total} comparable{stats.total > 1 ? 's' : ''}</span>
              {stats.prixMedian && (
                <span>• Médian: <span className="font-medium text-foreground">{formatPrice(stats.prixMedian)}</span></span>
              )}
              <span>• <span className="text-blue-600 font-medium">{stats.nbVendus}</span> vendu{stats.nbVendus > 1 ? 's' : ''}</span>
              <span>• <span className="text-green-600 font-medium">{stats.nbEnVente}</span> en vente</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setImportModalOpen(true)}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Plus className="h-4 w-4" />
              Importer GARY
            </Button>
            <Button
              onClick={() => setAddManualModalOpen(true)}
              className="flex-1 gap-2"
            >
              <FilePlus2 className="h-4 w-4" />
              Ajouter manuel
            </Button>
          </div>
        </div>

        {/* Map with Export button */}
        <div className="px-4 pt-4">
          <div className="relative">
            <ProjectDetailMap
              comparables={comparables}
              selectedComparableId={selectedComparableId}
              className="h-80 md:h-96"
            />
            {/* Export PNG button overlay with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3 gap-1.5 shadow-md bg-background/90 backdrop-blur-sm hover:bg-background"
                    onClick={handleExportMap}
                    disabled={exporting || geolocatedComparables.length === 0}
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Exporter PNG</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {geolocatedComparables.length === 0 
                    ? "Aucun comparable géolocalisé à exporter" 
                    : "Télécharger la carte en image PNG"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Comparables List */}
        <div className="px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Comparables ({filteredComparables.length})
            </h2>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récent</SelectItem>
                <SelectItem value="oldest">Plus ancien</SelectItem>
                <SelectItem value="price_desc">Prix ↓</SelectItem>
                <SelectItem value="price_asc">Prix ↑</SelectItem>
                <SelectItem value="surface_desc">Surface ↓</SelectItem>
                <SelectItem value="surface_asc">Surface ↑</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="mandat_signe">Vendus</SelectItem>
                <SelectItem value="presentee">En vente</SelectItem>
                <SelectItem value="other">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List - Enhanced empty state */}
          {filteredComparables.length === 0 ? (
            <div className="text-center py-16 px-6 bg-muted/20 rounded-2xl border border-dashed">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {comparables.length > 0 
                  ? 'Aucun résultat avec ces filtres'
                  : 'Aucun comparable dans ce projet'
                }
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {comparables.length > 0 
                  ? 'Modifiez vos critères de recherche pour voir plus de résultats.'
                  : 'Lancez une recherche automatique ou ajoutez des biens manuellement pour commencer.'
                }
              </p>
              {comparables.length === 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setImportModalOpen(true)} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Importer GARY
                  </Button>
                  <Button onClick={() => setAddManualModalOpen(true)} className="gap-2">
                    <FilePlus2 className="h-4 w-4" />
                    Ajouter manuellement
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 pb-6">
              {filteredComparables.map(comp => (
                <ComparableListCard
                  key={comp.linkId}
                  comparable={comp}
                  isHighlighted={comp.linkId === selectedComparableId}
                  onLocate={() => handleLocate(comp)}
                  onRemove={() => setRemovingComparable(comp)}
                  onViewDetails={comp.sourceType === 'gary' ? () => handleViewDetails(comp) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Import GARY Modal */}
      <ImportComparablesModal
        projectId={projectId || ''}
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          reload();
        }}
      />

      {/* Add Manual Modal */}
      <AddManualComparableModal
        projectId={projectId || ''}
        project={project}
        open={addManualModalOpen}
        onClose={() => setAddManualModalOpen(false)}
        onSuccess={() => {
          setAddManualModalOpen(false);
          reload();
        }}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removingComparable} onOpenChange={() => setRemovingComparable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce comparable ?</AlertDialogTitle>
            <AlertDialogDescription>
              {removingComparable && (
                <>
                  <span className="block font-medium text-foreground">
                    {removingComparable.typeBien} — {formatPrice(removingComparable.prixFinal)} CHF
                  </span>
                  <span className="block">{removingComparable.adresse}</span>
                </>
              )}
              <span className="block mt-2">
                Le comparable sera retiré du projet mais l'estimation restera dans le système.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}