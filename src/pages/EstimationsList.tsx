import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Plus, 
  MapPin, 
  Calendar, 
  ChevronRight,
  Search,
  FileText,
  Filter,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { EstimationData } from '@/types/estimation';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';
import { toast } from 'sonner';

// Types
type SortField = 'date' | 'nom' | 'prix' | 'statut';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'tous' | 'brouillon' | 'en_cours' | 'termine' | 'archive';

const statusLabels: Record<string, { label: string; color: string; bgClass: string }> = {
  brouillon: { label: 'Brouillon', color: 'text-muted-foreground', bgClass: 'bg-muted' },
  en_cours: { label: 'En cours', color: 'text-amber-700', bgClass: 'bg-amber-100' },
  termine: { label: 'Terminé', color: 'text-emerald-700', bgClass: 'bg-emerald-100' },
  archive: { label: 'Archivé', color: 'text-slate-500', bgClass: 'bg-slate-100' }
};

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'nom', label: 'Nom' },
  { value: 'prix', label: 'Prix' },
  { value: 'statut', label: 'Statut' }
];

interface EstimationCardProps {
  estimation: EstimationData;
  onClick: () => void;
  onStatusChange: (newStatus: string) => void;
  isUpdating: boolean;
}

const EstimationCard = ({ estimation, onClick, onStatusChange, isUpdating }: EstimationCardProps) => {
  const [editingStatus, setEditingStatus] = useState(false);
  const status = statusLabels[estimation.statut] || statusLabels.brouillon;
  const vendeur = estimation.vendeurNom || estimation.identification?.vendeur?.nom || 'Sans nom';
  const adresse = estimation.adresse || estimation.identification?.adresse?.rue || '';
  const localite = estimation.localite || estimation.identification?.adresse?.localite || '';
  const date = estimation.updatedAt 
    ? new Date(estimation.updatedAt).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' })
    : '';

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStatus(true);
  };

  const handleStatusSelect = (newStatus: string) => {
    setEditingStatus(false);
    if (newStatus !== estimation.statut) {
      onStatusChange(newStatus);
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-xl p-4 text-left transition-all hover:border-primary/50 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {editingStatus ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {Object.entries(statusLabels).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusSelect(key)}
                    className={`text-xs font-medium px-2 py-0.5 rounded transition-all ${val.bgClass} ${val.color} ${
                      estimation.statut === key ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
                <button 
                  onClick={() => setEditingStatus(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleStatusClick}
                disabled={isUpdating}
                className={`text-xs font-medium px-2 py-0.5 rounded transition-all hover:ring-2 hover:ring-primary/50 ${status.bgClass} ${status.color}`}
              >
                {isUpdating ? '...' : status.label}
              </button>
            )}
            {estimation.typeBien && (
              <span className="text-xs text-muted-foreground capitalize">
                {estimation.typeBien}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground truncate">{vendeur}</h3>
          {(adresse || localite) && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {adresse}{adresse && localite ? ', ' : ''}{localite}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {date}
              </span>
            )}
            {estimation.prixFinal && (
              <span className="font-medium text-foreground">
                {formatPriceCHF(estimation.prixFinal)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
};

const EstimationsList = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { fetchEstimations, createEstimation, updateEstimation, loading } = useEstimationPersistence();
  const [estimations, setEstimations] = useState<EstimationData[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadEstimations();
  }, []);

  const loadEstimations = async () => {
    const data = await fetchEstimations();
    setEstimations(data);
  };

  const handleNewEstimation = async () => {
    const created = await createEstimation({ statut: 'brouillon' });
    if (created?.id) {
      navigate(`/estimation/${created.id}/1`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateEstimation(id, { statut: newStatus as any });
      setEstimations(prev => 
        prev.map(e => e.id === id ? { ...e, statut: newStatus as any } : e)
      );
      toast.success(`Statut mis à jour`);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtrage et tri
  const processedEstimations = useMemo(() => {
    let result = [...estimations];
    
    // Filtre par statut
    if (statusFilter !== 'tous') {
      result = result.filter(e => e.statut === statusFilter);
    }
    
    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(est => {
        const vendeur = est.vendeurNom || est.identification?.vendeur?.nom || '';
        const adresse = est.adresse || est.identification?.adresse?.rue || '';
        const localite = est.localite || est.identification?.adresse?.localite || '';
        return (
          vendeur.toLowerCase().includes(searchLower) ||
          adresse.toLowerCase().includes(searchLower) ||
          localite.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
          break;
        case 'nom':
          const nomA = a.vendeurNom || a.identification?.vendeur?.nom || '';
          const nomB = b.vendeurNom || b.identification?.vendeur?.nom || '';
          comparison = nomA.localeCompare(nomB);
          break;
        case 'prix':
          comparison = (a.prixFinal || 0) - (b.prixFinal || 0);
          break;
        case 'statut':
          const statusOrder = { brouillon: 0, en_cours: 1, termine: 2, archive: 3 };
          comparison = (statusOrder[a.statut] || 0) - (statusOrder[b.statut] || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [estimations, statusFilter, search, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => ({
    total: estimations.length,
    brouillons: estimations.filter(e => e.statut === 'brouillon').length,
    enCours: estimations.filter(e => e.statut === 'en_cours').length,
    termines: estimations.filter(e => e.statut === 'termine').length
  }), [estimations]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-2">
          <GaryLogo className="h-6 text-primary" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          aria-label="Se déconnecter"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-24">
        <div className="space-y-4">
          {/* Title & Stats */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Mes Estimations</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {stats.total} total
                </Badge>
                {stats.brouillons > 0 && (
                  <Badge variant="secondary" className="text-xs bg-muted">
                    {stats.brouillons} brouillon{stats.brouillons > 1 ? 's' : ''}
                  </Badge>
                )}
                {stats.enCours > 0 && (
                  <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                    {stats.enCours} en cours
                  </Badge>
                )}
                {stats.termines > 0 && (
                  <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {stats.termines} terminé{stats.termines > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={handleNewEstimation} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, adresse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filtre statut */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="brouillon">Brouillons</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminés</SelectItem>
                  <SelectItem value="archive">Archivés</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Tri */}
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger className="w-[120px] h-9">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Ordre */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
              
              {/* Clear filters */}
              {(statusFilter !== 'tous' || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-muted-foreground"
                  onClick={() => {
                    setStatusFilter('tous');
                    setSearch('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Results count */}
          {(statusFilter !== 'tous' || search) && (
            <p className="text-sm text-muted-foreground">
              {processedEstimations.length} résultat{processedEstimations.length > 1 ? 's' : ''}
              {statusFilter !== 'tous' && ` • Filtre: ${statusLabels[statusFilter]?.label}`}
            </p>
          )}

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : processedEstimations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {search || statusFilter !== 'tous' ? 'Aucun résultat' : 'Aucune estimation'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== 'tous' 
                  ? 'Modifiez vos filtres' 
                  : 'Créez votre première estimation'}
              </p>
              {!search && statusFilter === 'tous' && (
                <Button onClick={handleNewEstimation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle estimation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {processedEstimations.map(estimation => (
                <EstimationCard
                  key={estimation.id}
                  estimation={estimation}
                  onClick={() => navigate(`/estimation/${estimation.id}/1`)}
                  onStatusChange={(status) => handleStatusChange(estimation.id, status)}
                  isUpdating={updatingId === estimation.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default EstimationsList;
