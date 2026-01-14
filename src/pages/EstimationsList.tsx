import { useEffect, useState } from 'react';
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
  FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { EstimationData } from '@/types/estimation';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';

const statusLabels: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
  en_cours: { label: 'En cours', color: 'bg-warning/20 text-warning' },
  termine: { label: 'Terminé', color: 'bg-success/20 text-success' },
  archive: { label: 'Archivé', color: 'bg-muted text-muted-foreground' }
};

const EstimationCard = ({ estimation, onClick }: { estimation: EstimationData; onClick: () => void }) => {
  const status = statusLabels[estimation.statut] || statusLabels.brouillon;
  const vendeur = estimation.vendeurNom || estimation.identification?.vendeur?.nom || 'Sans nom';
  const adresse = estimation.adresse || estimation.identification?.adresse?.rue || '';
  const localite = estimation.localite || estimation.identification?.adresse?.localite || '';
  const date = estimation.updatedAt 
    ? new Date(estimation.updatedAt).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' })
    : '';

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-xl p-4 text-left transition-all hover:border-primary/50 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.color}`}>
              {status.label}
            </span>
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
  const { fetchEstimations, createEstimation, loading } = useEstimationPersistence();
  const [estimations, setEstimations] = useState<EstimationData[]>([]);
  const [search, setSearch] = useState('');

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

  const filteredEstimations = estimations.filter(est => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const vendeur = est.vendeurNom || est.identification?.vendeur?.nom || '';
    const adresse = est.adresse || est.identification?.adresse?.rue || '';
    const localite = est.localite || est.identification?.adresse?.localite || '';
    return (
      vendeur.toLowerCase().includes(searchLower) ||
      adresse.toLowerCase().includes(searchLower) ||
      localite.toLowerCase().includes(searchLower)
    );
  });

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
          {/* Title & New button */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Mes Estimations</h1>
              <p className="text-sm text-muted-foreground">
                {estimations.length} estimation{estimations.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={handleNewEstimation} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : filteredEstimations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {search ? 'Aucun résultat' : 'Aucune estimation'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? 'Modifiez votre recherche' : 'Créez votre première estimation'}
              </p>
              {!search && (
                <Button onClick={handleNewEstimation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle estimation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEstimations.map(estimation => (
                <EstimationCard
                  key={estimation.id}
                  estimation={estimation}
                  onClick={() => navigate(`/estimation/${estimation.id}/1`)}
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
