import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { supabase } from '@/integrations/supabase/client';
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
  X,
  TrendingUp,
  Trash2,
  Archive,
  Presentation,
  CalendarDays
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
import { User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { EstimationData, EstimationStatus } from '@/types/estimation';
import { STATUS_CONFIG } from '@/types/estimation';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';
import { toast } from 'sonner';
import { ExportPDFButton } from '@/components/estimation/ExportPDFButton';
import { calculatePriorityScore, PriorityScore } from '@/lib/priorityScore';
import { PriorityBadge, PriorityIndicator } from '@/components/gary/PriorityBadge';

// Types
type SortField = 'priorite' | 'date' | 'nom' | 'prix' | 'statut';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'tous' | EstimationStatus;
type PeriodFilter = 'tous' | 'today' | 'week' | 'month' | '30days' | '90days';

// Options de période
const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'tous', label: 'Toutes les périodes' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: '30days', label: '30 derniers jours' },
  { value: '90days', label: '90 derniers jours' },
];

// Fonction pour obtenir la date de début selon le filtre période
const getPeriodStartDate = (period: PeriodFilter): Date | null => {
  if (period === 'tous') return null;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return today;
    case 'week':
      // Lundi de la semaine en cours
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0
      return new Date(today.getTime() - diff * 24 * 60 * 60 * 1000);
    case 'month':
      // 1er du mois en cours
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case '30days':
      return new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90days':
      return new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

// ============================================
// Détection des estimations dormantes
// ============================================
interface DormantInfo {
  isDormant: boolean;
  level: 'warning' | 'urgent' | null;
  label: string | null;
  daysSinceUpdate: number;
}

const getDormantInfo = (estimation: EstimationData): DormantInfo => {
  if (!estimation.updatedAt) {
    return { isDormant: false, level: null, label: null, daysSinceUpdate: 0 };
  }
  
  const now = new Date();
  const updatedAt = new Date(estimation.updatedAt);
  const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Règles de dormance selon le statut
  if (estimation.statut === 'validee' && daysSinceUpdate >= 3) {
    return { 
      isDormant: true, 
      level: 'warning', 
      label: `En attente ${daysSinceUpdate}j`,
      daysSinceUpdate 
    };
  }
  
  if (estimation.statut === 'presentee' && daysSinceUpdate >= 7) {
    return { 
      isDormant: true, 
      level: 'urgent', 
      label: `Sans nouvelle ${daysSinceUpdate}j`,
      daysSinceUpdate 
    };
  }
  
  if (estimation.statut === 'negociation' && daysSinceUpdate >= 14) {
    return { 
      isDormant: true, 
      level: 'urgent', 
      label: `Bloquée ${daysSinceUpdate}j`,
      daysSinceUpdate 
    };
  }
  
  return { isDormant: false, level: null, label: null, daysSinceUpdate };
};

// Utilise STATUS_CONFIG pour les labels
const getStatusLabel = (status: string) => {
  const config = STATUS_CONFIG[status as EstimationStatus];
  return config || { label: status, color: 'gray', icon: 'Circle' };
};

const sortOptions: { value: SortField; label: string; icon?: string }[] = [
  { value: 'priorite', label: 'Priorité', icon: '🎯' },
  { value: 'date', label: 'Date' },
  { value: 'nom', label: 'Nom' },
  { value: 'prix', label: 'Prix' },
  { value: 'statut', label: 'Statut' }
];
// Status color mapping for quick editing - 7 statuts simplifiés
const statusColorMap: Record<string, { bgClass: string; color: string }> = {
  brouillon: { bgClass: 'bg-muted', color: 'text-muted-foreground' },
  validee: { bgClass: 'bg-indigo-100', color: 'text-indigo-700' },
  presentee: { bgClass: 'bg-purple-100', color: 'text-purple-700' },
  negociation: { bgClass: 'bg-orange-100', color: 'text-orange-700' },
  mandat_signe: { bgClass: 'bg-emerald-100', color: 'text-emerald-700' },
  perdu: { bgClass: 'bg-red-100', color: 'text-red-700' },
  archive: { bgClass: 'bg-slate-100', color: 'text-slate-500' }
};

// Quick status options for inline editing (7 statuts simplifiés)
const quickStatusOptions: EstimationStatus[] = [
  'brouillon', 'validee', 'presentee', 'negociation'
];

interface EstimationCardProps {
  estimation: EstimationData;
  priority: PriorityScore;
  onClick: () => void;
  onStatusChange: (newStatus: string) => void;
  onDelete: () => void;
  onArchive: () => void;
  onOpenPresentation: () => void;
  isUpdating: boolean;
}

const EstimationCard = ({ estimation, priority, onClick, onStatusChange, onDelete, onArchive, onOpenPresentation, isUpdating }: EstimationCardProps) => {
  const [editingStatus, setEditingStatus] = useState(false);
  const statusConfig = getStatusLabel(estimation.statut);
  const colorConfig = statusColorMap[estimation.statut] || statusColorMap.brouillon;
  const dormantInfo = getDormantInfo(estimation);
  const vendeur = estimation.vendeurNom || estimation.identification?.vendeur?.nom || 'Sans nom';
  const adresse = estimation.adresse || estimation.identification?.adresse?.rue || '';
  const localite = estimation.localite || estimation.identification?.adresse?.localite || '';
  const date = estimation.updatedAt 
    ? new Date(estimation.updatedAt).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' })
    : '';

  const isBrouillon = estimation.statut === 'brouillon';
  const isArchived = estimation.statut === 'archive';

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
    <div className="w-full bg-card border border-border rounded-lg p-3 text-left transition-all hover:border-primary/50 flex items-start gap-2">
      {/* Priority indicator */}
      <PriorityIndicator priority={priority} className="mt-1 shrink-0" />
      
      {/* Main content - clickable */}
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {editingStatus ? (
            <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
              {quickStatusOptions.map((key) => {
                const cfg = getStatusLabel(key);
                const clr = statusColorMap[key] || statusColorMap.brouillon;
                return (
                  <button
                    key={key}
                    onClick={() => handleStatusSelect(key)}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-all ${clr.bgClass} ${clr.color} ${
                      estimation.statut === key ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
              <button 
                onClick={() => setEditingStatus(false)}
                className="p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStatusClick}
              disabled={isUpdating}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-all hover:ring-2 hover:ring-primary/50 ${colorConfig.bgClass} ${colorConfig.color}`}
            >
              {isUpdating ? '...' : statusConfig.label}
            </button>
          )}
          {estimation.typeBien && (
            <span className="text-[10px] text-muted-foreground capitalize">
              {estimation.typeBien}
            </span>
          )}
          {/* Priority badge */}
          <PriorityBadge priority={priority} size="sm" />
          {/* Dormant badge */}
          {dormantInfo.isDormant && (
            <span 
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                dormantInfo.level === 'urgent' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}
              title={`Dernière mise à jour il y a ${dormantInfo.daysSinceUpdate} jours`}
            >
              ⏰ {dormantInfo.label}
            </span>
          )}
        </div>
        <h3 className="font-medium text-sm text-foreground truncate">{vendeur}</h3>
        {(adresse || localite) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {adresse}{adresse && localite ? ', ' : ''}{localite}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          {date && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {date}
            </span>
          )}
          {estimation.prixFinal && (
            <span className="font-medium text-foreground text-xs">
              {formatPriceCHF(estimation.prixFinal)}
            </span>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Bouton Présentation - disponible dès qu'on a un prix */}
        {estimation.prixFinal && (
          <button
            onClick={e => { e.stopPropagation(); onOpenPresentation(); }}
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
            title="Ouvrir la présentation client"
          >
            <Presentation className="h-3.5 w-3.5" />
          </button>
        )}
        
        {/* Delete button for brouillons */}
        {isBrouillon && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le brouillon "{vendeur}" sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* Archive button for non-brouillons (except already archived) */}
        {!isBrouillon && !isArchived && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                title="Archiver"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archiver cette estimation ?</AlertDialogTitle>
                <AlertDialogDescription>
                  L'estimation "{vendeur}" sera archivée. Vous pourrez toujours la consulter dans les archives.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onArchive}
                  className="bg-amber-500 text-white hover:bg-amber-600"
                >
                  Archiver
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

// Type pour les courtiers
interface CourtierOption {
  id: string;
  full_name: string;
}

const EstimationsList = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { fetchEstimations, createEstimation, updateEstimation, deleteEstimation, loading } = useEstimationPersistence();
  const [estimations, setEstimations] = useState<EstimationData[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');
  const [courtierFilter, setCourtierFilter] = useState<string>('tous');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('tous');
  const [showDormantOnly, setShowDormantOnly] = useState(false);
  const [courtiers, setCourtiers] = useState<CourtierOption[]>([]);
  const [sortField, setSortField] = useState<SortField>('priorite');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Charger les courtiers pour le filtre admin
  useEffect(() => {
    const loadCourtiers = async () => {
      if (!isAdmin) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      
      if (!error && data) {
        // Filtrer ceux qui ont le rôle courtier ou admin
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['courtier', 'admin']);
        
        const courtierUserIds = new Set(rolesData?.map(r => r.user_id) || []);
        const filteredCourtiers = data
          .filter(p => courtierUserIds.has(p.user_id) && p.full_name)
          .map(p => ({ id: p.user_id, full_name: p.full_name! }));
        
        setCourtiers(filteredCourtiers);
      }
    };
    
    loadCourtiers();
  }, [isAdmin]);

  useEffect(() => {
    if (user) {
      loadEstimations();
    }
  }, [user]);

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

  const handleDelete = async (id: string) => {
    const success = await deleteEstimation(id);
    if (success) {
      setEstimations(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleArchive = async (id: string) => {
    await handleStatusChange(id, 'archive');
  };

  // Filtrage et tri
  const processedEstimations = useMemo(() => {
    let result = [...estimations];
    
    // Filtre par statut
    if (statusFilter !== 'tous') {
      result = result.filter(e => e.statut === statusFilter);
    }
    
    // Filtre par courtier (admin uniquement)
    if (isAdmin && courtierFilter !== 'tous') {
      result = result.filter(e => e.courtierId === courtierFilter);
    }
    
    // Filtre par période (sur createdAt)
    const periodStartDate = getPeriodStartDate(periodFilter);
    if (periodStartDate) {
      result = result.filter(e => {
        if (!e.createdAt) return false;
        const createdDate = new Date(e.createdAt);
        return createdDate >= periodStartDate;
      });
    }
    
    // Filtre dormantes uniquement
    if (showDormantOnly) {
      result = result.filter(e => getDormantInfo(e).isDormant);
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
        case 'priorite':
          const priorityA = calculatePriorityScore(a).total;
          const priorityB = calculatePriorityScore(b).total;
          comparison = priorityA - priorityB;
          break;
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
          const statusOrder: Record<string, number> = { 
            brouillon: 0, en_cours: 1, a_presenter: 2, presentee: 3, 
            reflexion: 4, negociation: 5, accord_oral: 6, en_signature: 7,
            mandat_signe: 8, termine: 9, perdu: 10, archive: 11 
          };
          comparison = (statusOrder[a.statut] || 0) - (statusOrder[b.statut] || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [estimations, statusFilter, courtierFilter, periodFilter, showDormantOnly, isAdmin, search, sortField, sortOrder]);

  // Stats - 7 statuts simplifiés
  const stats = useMemo(() => ({
    total: estimations.length,
    brouillons: estimations.filter(e => e.statut === 'brouillon').length,
    validees: estimations.filter(e => e.statut === 'validee').length,
    mandats: estimations.filter(e => e.statut === 'mandat_signe').length
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-foreground">Mes Estimations</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {stats.total} total
                </Badge>
                {stats.brouillons > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted">
                    {stats.brouillons} brouillon{stats.brouillons > 1 ? 's' : ''}
                  </Badge>
                )}
                {stats.validees > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                    {stats.validees} validée{stats.validees > 1 ? 's' : ''}
                  </Badge>
                )}
                {stats.mandats > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {stats.mandats} mandat{stats.mandats > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={handleNewEstimation} disabled={loading} size="sm" className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nouvelle
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, adresse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Filtre statut */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[120px] h-7 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous" className="text-xs">Tous</SelectItem>
                  <SelectItem value="brouillon" className="text-xs">Brouillons</SelectItem>
                  <SelectItem value="validee" className="text-xs">Validées</SelectItem>
                  <SelectItem value="presentee" className="text-xs">Présentées</SelectItem>
                  <SelectItem value="negociation" className="text-xs">Négociation</SelectItem>
                  <SelectItem value="mandat_signe" className="text-xs">Mandats signés</SelectItem>
                  <SelectItem value="perdu" className="text-xs">Perdues</SelectItem>
                  <SelectItem value="archive" className="text-xs">Archivées</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filtre par courtier - Admin uniquement */}
              {isAdmin && courtiers.length > 0 && (
                <Select value={courtierFilter} onValueChange={setCourtierFilter}>
                  <SelectTrigger className="w-[140px] h-7 text-xs">
                    <User className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Courtier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous" className="text-xs">Tous les courtiers</SelectItem>
                    {courtiers.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Filtre par période */}
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[140px] h-7 text-xs">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Tri */}
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger className="w-[100px] h-7 text-xs">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Toggle dormantes */}
              <Button
                variant={showDormantOnly ? "default" : "outline"}
                size="sm"
                className={`h-7 px-2 text-xs ${showDormantOnly ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                onClick={() => setShowDormantOnly(!showDormantOnly)}
                title="Afficher uniquement les estimations en attente de suivi"
              >
                ⏰ Dormantes
              </Button>
              
              {/* Ordre */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
              
              {/* Clear filters */}
              {(statusFilter !== 'tous' || search || courtierFilter !== 'tous' || periodFilter !== 'tous' || showDormantOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-muted-foreground"
                  onClick={() => {
                    setStatusFilter('tous');
                    setCourtierFilter('tous');
                    setPeriodFilter('tous');
                    setShowDormantOnly(false);
                    setSearch('');
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Results count */}
          {(statusFilter !== 'tous' || search || courtierFilter !== 'tous' || periodFilter !== 'tous' || showDormantOnly) && (
            <p className="text-xs text-muted-foreground">
              {processedEstimations.length} résultat{processedEstimations.length > 1 ? 's' : ''}
              {statusFilter !== 'tous' && ` • Filtre: ${getStatusLabel(statusFilter).label}`}
              {courtierFilter !== 'tous' && ` • Courtier: ${courtiers.find(c => c.id === courtierFilter)?.full_name}`}
              {periodFilter !== 'tous' && ` • ${periodOptions.find(p => p.value === periodFilter)?.label}`}
              {showDormantOnly && ` • Dormantes uniquement`}
            </p>
          )}

          {/* List */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : processedEstimations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm text-foreground mb-0.5">
                {search || statusFilter !== 'tous' ? 'Aucun résultat' : 'Aucune estimation'}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
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
              {processedEstimations.map(estimation => {
                const priority = calculatePriorityScore(estimation);
                return (
                  <EstimationCard
                    key={estimation.id}
                    estimation={estimation}
                    priority={priority}
                    onClick={() => navigate(`/estimation/${estimation.id}/overview`)}
                    onStatusChange={(status) => handleStatusChange(estimation.id, status)}
                    onDelete={() => handleDelete(estimation.id)}
                    onArchive={() => handleArchive(estimation.id)}
                    onOpenPresentation={() => navigate(`/estimation/${estimation.id}/presentation`)}
                    isUpdating={updatingId === estimation.id}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default EstimationsList;
