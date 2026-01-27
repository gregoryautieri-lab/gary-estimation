import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCampagnes } from '@/hooks/useCampagnes';
import { useSupportsProspection } from '@/hooks/useSupportsProspection';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { CampagneFormModal } from '@/components/prospection/CampagneFormModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  LogOut,
  Plus,
  FileText,
  QrCode,
  Mail,
  Wallet,
  ChevronRight,
  RefreshCw,
  Megaphone,
  Settings2,
  CalendarDays,
  BarChart3,
  Archive,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import type { Campagne, CampagneStatut } from '@/types/prospection';
import { CAMPAGNE_STATUT_LABELS, CAMPAGNE_STATUT_COLORS } from '@/types/prospection';
import { getTypeMessageLabel } from '@/constants/typeMessageOptions';

// Types pour les filtres
type PeriodFilter = 'month' | '3months' | 'year' | 'all';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'month', label: 'Ce mois' },
  { value: '3months', label: '3 derniers mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'all', label: 'Tout' },
];

// Helper pour calculer les dates de filtre
function getDateFilter(period: PeriodFilter): string | null {
  const now = new Date();
  switch (period) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case '3months':
      return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    case 'year':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return null;
  }
}

// Composant carte de statistique
function StatCard({ icon: Icon, label, value, className }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant ligne de campagne
function CampagneRow({ 
  campagne, 
  onClick, 
  canArchive,
  canRestore,
  onArchiveClick,
  onRestoreClick,
}: { 
  campagne: Campagne & { archived_at?: string | null }; 
  onClick: () => void;
  canArchive: boolean;
  canRestore: boolean;
  onArchiveClick: (e: React.MouseEvent) => void;
  onRestoreClick: (e: React.MouseEvent) => void;
}) {
  const isArchived = !!campagne.archived_at;
  const statusColor = CAMPAGNE_STATUT_COLORS[campagne.statut] || 'bg-gray-100 text-gray-700';
  const initials = campagne.courtier_name 
    ? campagne.courtier_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  // Calcul si la campagne est en retard
  const isEnRetard = !isArchived && campagne.date_fin && 
    campagne.statut !== 'terminee' && 
    isBefore(parseISO(campagne.date_fin), startOfDay(new Date()));

  return (
    <div className={`w-full bg-card border border-border rounded-lg p-3 text-left transition-all hover:border-primary/50 flex items-center gap-3 ${isArchived ? 'opacity-60' : ''}`}>
      {/* Zone cliquable pour navigation */}
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`font-mono font-semibold text-sm ${isArchived ? 'text-muted-foreground' : 'text-primary'}`}>
            {campagne.code}
          </span>
          {isArchived ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Archivée
            </Badge>
          ) : (
            <Badge className={`text-[10px] px-1.5 py-0 ${statusColor}`}>
              {CAMPAGNE_STATUT_LABELS[campagne.statut]}
            </Badge>
          )}
          {isEnRetard && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/50 text-destructive bg-destructive/10 font-medium">
              En retard
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground truncate">
          {campagne.commune}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {campagne.type_bien}
          </Badge>
          {campagne.type_message && (
            <Badge variant="secondary" className="text-[10px] truncate max-w-[120px]">
              <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
              {getTypeMessageLabel(campagne.type_message)}
            </Badge>
          )}
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {campagne.nb_courriers}
          </span>
          <span className="flex items-center gap-1">
            <QrCode className="h-3 w-3" />
            {campagne.scans_count}
          </span>
        </div>
      </button>

      {/* Courtier */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-muted">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Bouton restaurer (pour les archivées) */}
      {isArchived && canRestore && (
        <button
          onClick={onRestoreClick}
          className="p-2 rounded-md text-primary hover:bg-primary/10 transition-colors shrink-0"
          aria-label="Restaurer la campagne"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}

      {/* Bouton archiver (pour les actives) */}
      {!isArchived && canArchive && (
        <button
          onClick={onArchiveClick}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Archiver la campagne"
        >
          <Archive className="h-4 w-4" />
        </button>
      )}

      <button onClick={onClick} className="shrink-0">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

// Composant skeleton pour le chargement
function CampagneSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}

export default function Campagnes() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useUserRole();
  
  const canViewAll = isAdmin;
  const canCreate = true; // All users with access can create
  const canAccessAdmin = true; // Tous peuvent accéder en lecture

  // États des filtres
  const [statusFilter, setStatusFilter] = useState<CampagneStatut | 'tous'>('tous');
  const [courtierFilter, setCourtierFilter] = useState<string>('tous');
  const [supportFilter, setSupportFilter] = useState<string>('tous');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // État pour l'archivage
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [campagneToArchive, setCampagneToArchive] = useState<Campagne | null>(null);
  const [missionsCount, setMissionsCount] = useState<number>(0);
  const [isArchiving, setIsArchiving] = useState(false);

  // Récupérer les supports
  const { supports, isLoading: supportsLoading } = useSupportsProspection();

  // Récupérer les courtiers (profils) pour le filtre
  const { data: courtiers = [], isLoading: courtiersLoading } = useQuery({
    queryKey: ['courtiers_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: canViewAll,
  });

  // Récupérer les campagnes avec les filtres côté serveur
  const campagnesOptions = useMemo(() => {
    const opts: { courtier_id?: string; statut?: CampagneStatut | CampagneStatut[]; includeArchived?: boolean } = {};
    
    // Si courtier standard, filtrer par son ID
    if (!canViewAll && user?.id) {
      opts.courtier_id = user.id;
    } else if (courtierFilter !== 'tous') {
      opts.courtier_id = courtierFilter;
    }

    if (statusFilter !== 'tous') {
      opts.statut = statusFilter;
    }

    // Inclure les archivées si demandé
    opts.includeArchived = showArchived;

    return opts;
  }, [canViewAll, user?.id, courtierFilter, statusFilter, showArchived]);

  const { campagnes, isLoading: campagnesLoading, error, refetch, archive, restore, isArchiving: hookIsArchiving, isRestoring } = useCampagnes(campagnesOptions);

  // Filtrage côté client (support, période)
  const filteredCampagnes = useMemo(() => {
    let result = [...campagnes];

    // Filtre par support
    if (supportFilter !== 'tous') {
      result = result.filter(c => c.support_id === supportFilter);
    }

    // Filtre par période
    const dateFilter = getDateFilter(periodFilter);
    if (dateFilter) {
      result = result.filter(c => c.created_at >= dateFilter);
    }

    // Tri par date de création décroissante
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [campagnes, supportFilter, periodFilter]);

  // Statistiques agrégées
  const stats = useMemo(() => {
    return {
      count: filteredCampagnes.length,
      totalCourriers: filteredCampagnes.reduce((sum, c) => sum + c.nb_courriers, 0),
      totalScans: filteredCampagnes.reduce((sum, c) => sum + c.scans_count, 0),
      totalCout: filteredCampagnes.reduce((sum, c) => sum + c.cout_total, 0),
    };
  }, [filteredCampagnes]);

  const isLoading = campagnesLoading || supportsLoading || rolesLoading;

  // Fonction pour gérer le clic sur le bouton archivage
  const handleArchiveClick = async (e: React.MouseEvent, campagne: Campagne) => {
    e.stopPropagation();
    
    // Fetch le nombre de missions
    const { count } = await supabase
      .from('missions')
      .select('*', { count: 'exact', head: true })
      .eq('campagne_id', campagne.id);
    
    setMissionsCount(count || 0);
    setCampagneToArchive(campagne);
    setArchiveDialogOpen(true);
  };

  // Fonction pour confirmer l'archivage
  const handleConfirmArchive = async () => {
    if (!campagneToArchive) return;
    
    setIsArchiving(true);
    archive(campagneToArchive.id);
    setIsArchiving(false);
    setArchiveDialogOpen(false);
    setCampagneToArchive(null);
  };

  // Fonction pour restaurer une campagne
  const handleRestore = (e: React.MouseEvent, campagne: Campagne) => {
    e.stopPropagation();
    restore(campagne.id);
  };

  // Vérifie si l'utilisateur peut archiver/restaurer une campagne
  const canManageCampagne = (campagne: Campagne) => {
    return isAdmin || campagne.courtier_id === user?.id;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-2">
          <GaryLogo className="h-6 text-primary" />
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-24 space-y-4">
        {/* Titre et boutons */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Prospection</h1>
            <p className="text-sm text-muted-foreground">
              {filteredCampagnes.length} campagne{filteredCampagnes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton Dashboard */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/prospection/dashboard')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </Button>
            {/* Bouton Planning */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/prospection/planning')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Planning
            </Button>
            {/* Bouton Salaires - Admin only */}
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/salaires')}
              >
                <Wallet className="h-4 w-4 mr-1" />
                Salaires
              </Button>
            )}
            {canAccessAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/prospection')}
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Admin
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => setModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle
              </Button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {/* Statut */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CampagneStatut | 'tous')}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous statuts</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="planifiee">Planifiée</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="terminee">Terminée</SelectItem>
            </SelectContent>
          </Select>

          {/* Courtier (admin/back_office/responsable seulement) */}
          {canViewAll && (
            <Select
              value={courtierFilter}
              onValueChange={setCourtierFilter}
              disabled={courtiersLoading}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Courtier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous courtiers</SelectItem>
                {courtiers.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.full_name || 'Sans nom'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Support */}
          <Select
            value={supportFilter}
            onValueChange={setSupportFilter}
            disabled={supportsLoading}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Support" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous supports</SelectItem>
              {supports.filter(s => s.actif).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Période */}
          <Select
            value={periodFilter}
            onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Toggle Archivées */}
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archivées
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={FileText} label="Campagnes" value={stats.count} />
          <StatCard icon={Mail} label="Courriers" value={stats.totalCourriers.toLocaleString('fr-CH')} />
          <StatCard icon={QrCode} label="Scans QR" value={stats.totalScans.toLocaleString('fr-CH')} />
          <StatCard 
            icon={Wallet} 
            label="Coût total" 
            value={`${stats.totalCout.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF`} 
          />
        </div>

        {/* Liste des campagnes */}
        <div className="space-y-2">
          {isLoading ? (
            <>
              <CampagneSkeleton />
              <CampagneSkeleton />
              <CampagneSkeleton />
            </>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-destructive mb-3">Erreur lors du chargement</p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : filteredCampagnes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Megaphone className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">Aucune campagne</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {statusFilter !== 'tous' || supportFilter !== 'tous' || periodFilter !== 'all'
                    ? 'Aucune campagne ne correspond à vos filtres.'
                    : 'Créez votre première campagne de prospection.'}
                </p>
                {canCreate && (
                  <Button onClick={() => setModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une campagne
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredCampagnes.map((campagne) => (
              <CampagneRow
                key={campagne.id}
                campagne={campagne as Campagne & { archived_at?: string | null }}
                onClick={() => navigate(`/campagnes/${campagne.id}`)}
                canArchive={canManageCampagne(campagne)}
                canRestore={canManageCampagne(campagne)}
                onArchiveClick={(e) => handleArchiveClick(e, campagne)}
                onRestoreClick={(e) => handleRestore(e, campagne)}
              />
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modal de création */}
      <CampagneFormModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Dialog de confirmation d'archivage */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              {missionsCount > 0 ? (
                <>
                  La campagne <strong>{campagneToArchive?.code}</strong> et ses{' '}
                  <strong>{missionsCount} mission(s)</strong> seront archivées.
                  <br />
                  <span className="text-muted-foreground">Vous pourrez la restaurer ultérieurement.</span>
                </>
              ) : (
                <>
                  La campagne <strong>{campagneToArchive?.code}</strong> sera archivée.
                  <br />
                  <span className="text-muted-foreground">Vous pourrez la restaurer ultérieurement.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving || hookIsArchiving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmArchive}
              disabled={isArchiving || hookIsArchiving}
            >
              {isArchiving || hookIsArchiving ? 'Archivage...' : 'Archiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
