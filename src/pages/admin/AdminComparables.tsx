import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Trash2, ExternalLink, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Comparable {
  id: string;
  adresse: string | null;
  localite: string | null;
  code_postal: string | null;
  type_bien: string | null;
  surface: number | null;
  pieces: number | null;
  prix: number | null;
  statut_marche: string;
  source: string | null;
  url_source: string | null;
  created_at: string;
  user_id: string;
  profile?: { full_name: string | null };
}

export default function AdminComparables() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  // Fetch all comparables
  useEffect(() => {
    const fetchComparables = async () => {
      if (!user || !isAdmin) return;

      setLoading(true);
      try {
        // Récupérer les comparables
        const { data, error } = await supabase
          .from('comparables')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComparables(data || []);
      } catch (err) {
        console.error('Error fetching comparables:', err);
        toast.error('Erreur lors du chargement des comparables');
      } finally {
        setLoading(false);
      }
    };

    fetchComparables();
  }, [user, isAdmin]);

  // Filtered comparables
  const filtered = useMemo(() => {
    if (!search) return comparables;
    const searchLower = search.toLowerCase();
    return comparables.filter(c =>
      c.adresse?.toLowerCase().includes(searchLower) ||
      c.localite?.toLowerCase().includes(searchLower) ||
      c.code_postal?.includes(search) ||
      c.source?.toLowerCase().includes(searchLower)
    );
  }, [comparables, search]);

  // Selection handlers
  const toggleSelect = (id: string) => {
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('comparables')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      setComparables(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} comparable(s) supprimé(s)`);
    } catch (err) {
      console.error('Error deleting comparables:', err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatPrice = (prix: number | null) => {
    if (!prix) return '-';
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      maximumFractionDigits: 0,
    }).format(prix);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GaryLogo className="h-6 text-primary" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-24">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Gestion des Comparables
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {comparables.length} comparable(s) au total
            </p>
          </div>

          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par adresse, localité, source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {/* Table */}
          {!loading && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filtered.length > 0 && selectedIds.size === filtered.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Surface</TableHead>
                      <TableHead className="text-right">Pièces</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Aucun comparable trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((c) => (
                        <TableRow key={c.id} className={selectedIds.has(c.id) ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(c.id)}
                              onCheckedChange={() => toggleSelect(c.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{c.adresse || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {[c.code_postal, c.localite].filter(Boolean).join(' ')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {c.type_bien || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {c.surface ? `${c.surface} m²` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {c.pieces || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(c.prix)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={c.statut_marche === 'vendu' ? 'default' : 'secondary'}
                              className={c.statut_marche === 'vendu' ? 'bg-green-600' : ''}
                            >
                              {c.statut_marche === 'vendu' ? 'Vendu' : 'En vente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {c.source || 'manual'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(c.created_at), 'dd/MM/yy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            {c.url_source && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <a href={c.url_source} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <BottomNav />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les comparables ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer {selectedIds.size} comparable(s).
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
