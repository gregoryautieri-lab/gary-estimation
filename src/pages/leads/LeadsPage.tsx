import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Inbox, Plus, Search, Eye, Package, Smartphone, Phone, 
  Users, Handshake, Globe, Calendar, HelpCircle, BarChart3, Trash2, Loader2
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomNav } from '@/components/gary/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLeads, useLeadsStats, useCourtiers, LeadsFilters } from '@/hooks/useLeads';
import { LEAD_STATUT_OPTIONS, LEAD_STATUT_CONFIG, normalizeLeadStatut } from '@/types/leads';
import { cn } from '@/lib/utils';
import { LeadRappelsBanner } from '@/components/leads/LeadRappelsBanner';
import { LeadsSummary } from '@/components/leads/LeadsSummary';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { useQueryClient } from '@tanstack/react-query';

// Icônes par source
const SOURCE_ICONS: Record<string, React.ReactNode> = {
  boitage: <Package className="h-4 w-4" />,
  reseaux_sociaux: <Smartphone className="h-4 w-4" />,
  telephone: <Phone className="h-4 w-4" />,
  recommandation: <Users className="h-4 w-4" />,
  partenariat: <Handshake className="h-4 w-4" />,
  site_web: <Globe className="h-4 w-4" />,
  salon: <Calendar className="h-4 w-4" />,
  autre: <HelpCircle className="h-4 w-4" />,
};

// Couleurs statut depuis la config centralisée
const getStatutColor = (statut: string): string => {
  const normalized = normalizeLeadStatut(statut);
  return LEAD_STATUT_CONFIG[normalized]?.color || 'bg-gray-500';
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const [showStats, setShowStats] = useState(false);
  const [filters, setFilters] = useState<LeadsFilters>({
    statut: 'tous',
    courtier: 'tous',
    periode: 'tout',
    search: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: leads = [], isLoading } = useLeads(filters);
  const { data: stats } = useLeadsStats();
  const { data: courtiers = [] } = useCourtiers();

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // D'abord, délier les estimations liées à ce lead
      const { error: unlinkError } = await supabase
        .from('estimations')
        .update({ lead_id: null })
        .eq('lead_id', deleteTarget.id);
      
      if (unlinkError) {
        console.error('Erreur déliaison estimations:', unlinkError);
        // Continue anyway - there might not be any linked estimations
      }

      // Ensuite, supprimer le lead
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', deleteTarget.id);
      
      if (error) throw error;
      
      toast.success('Lead supprimé');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    } catch (error) {
      console.error('Erreur suppression lead:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const updateFilter = (key: keyof LeadsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRowClick = (leadId: string) => {
    navigate(`/leads/${leadId}`);
  };

  const getRappelStyle = (rappelDate: string | null) => {
    if (!rappelDate) return '';
    const date = startOfDay(new Date(rappelDate));
    const today = startOfDay(new Date());
    
    if (isBefore(date, today)) {
      return 'bg-red-100 text-red-800';
    }
    if (isToday(date)) {
      return 'bg-orange-100 text-orange-800';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              Inbox Leads
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gérez vos leads entrants
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showStats ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </Button>
            <Button onClick={() => navigate('/leads/new')} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Statistiques (toggle) */}
        {showStats && <LeadsSummary />}
        {/* Filtres */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={filters.statut} onValueChange={(v) => updateFilter('statut', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="nouveau">Nouveau</SelectItem>
              <SelectItem value="contacte">Contacté</SelectItem>
              <SelectItem value="rdv_planifie">RDV planifié</SelectItem>
              <SelectItem value="converti">Converti</SelectItem>
              <SelectItem value="perdu">Perdu</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.courtier} onValueChange={(v) => updateFilter('courtier', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Courtier" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="tous">Tous les courtiers</SelectItem>
              {courtiers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.periode} onValueChange={(v) => updateFilter('periode', v as LeadsFilters['periode'])}>
            <SelectTrigger>
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="tout">Toute période</SelectItem>
              <SelectItem value="semaine">Cette semaine</SelectItem>
              <SelectItem value="mois">Ce mois</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <p className="text-sm text-muted-foreground">À traiter</p>
              </div>
              <p className="text-2xl font-bold">{stats?.aTraiter ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <p className="text-sm text-muted-foreground">RDV planifiés</p>
              </div>
              <p className="text-2xl font-bold">{stats?.rdvPlanifies ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-sm text-muted-foreground">Convertis</p>
              </div>
              <p className="text-2xl font-bold">{stats?.convertis ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Rappels Banner */}
        <LeadRappelsBanner />

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Statut</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Assigné à</TableHead>
                <TableHead className="hidden lg:table-cell">Rappel</TableHead>
                <TableHead className="hidden sm:table-cell">Créé</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun lead trouvé
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(lead.id)}
                  >
                    <TableCell>
                      <span 
                        className={cn(
                          "w-3 h-3 rounded-full inline-block",
                          getStatutColor(lead.statut)
                        )}
                        title={LEAD_STATUT_CONFIG[normalizeLeadStatut(lead.statut)]?.label}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.prenom} {lead.nom}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {SOURCE_ICONS[lead.source]}
                        <span className="text-sm capitalize">{lead.source.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {lead.type_demande === 'estimation' ? 'Estimation' : 'À qualifier'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {lead.assigned_user?.full_name || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {lead.rappel_date ? (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          getRappelStyle(lead.rappel_date)
                        )}>
                          {format(new Date(lead.rappel_date), 'dd/MM/yyyy')}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(lead.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ id: lead.id, name: `${lead.prenom || ''} ${lead.nom}`.trim() });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Dialog suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lead ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le lead <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
