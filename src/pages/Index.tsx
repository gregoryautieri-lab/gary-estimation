import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LogOut, 
  Plus, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ChevronRight,
  MapPin,
  Calendar,
  Zap
} from "lucide-react";
import type { EstimationData } from '@/types/estimation';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  onClick?: () => void;
}

const StatCard = ({ icon, value, label, color, onClick }: StatCardProps) => (
  <button 
    onClick={onClick}
    className={`bg-card border border-border rounded-xl p-4 text-left transition-all hover:border-primary/50 active:scale-[0.98] ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  </button>
);

const RecentEstimationCard = ({ estimation, onClick }: { estimation: EstimationData; onClick: () => void }) => {
  const vendeur = estimation.vendeurNom || estimation.identification?.vendeur?.nom || 'Sans nom';
  const adresse = estimation.adresse || estimation.identification?.adresse?.rue || '';
  const localite = estimation.localite || estimation.identification?.adresse?.localite || '';
  const date = estimation.updatedAt 
    ? new Date(estimation.updatedAt).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' })
    : '';

  const statusColors: Record<string, string> = {
    brouillon: 'bg-muted text-muted-foreground',
    en_cours: 'bg-amber-100 text-amber-700',
    termine: 'bg-emerald-100 text-emerald-700',
    archive: 'bg-slate-100 text-slate-500'
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-xl p-3 text-left transition-all hover:border-primary/50 active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[estimation.statut] || statusColors.brouillon}`}>
              {estimation.statut === 'en_cours' ? 'En cours' : estimation.statut}
            </span>
            <span className="text-xs text-muted-foreground truncate">{vendeur}</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate mt-1">
            {adresse || localite || 'Adresse non renseignée'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{date}</span>
            {estimation.prixFinal && (
              <>
                <span>•</span>
                <span className="font-medium text-foreground">{formatPriceCHF(estimation.prixFinal)}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { fetchEstimations, createEstimation, loading } = useEstimationPersistence();
  const [estimations, setEstimations] = useState<EstimationData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoadingData(true);
    const data = await fetchEstimations();
    setEstimations(data);
    setLoadingData(false);
  };

  const handleNewEstimation = async () => {
    const created = await createEstimation({ statut: 'brouillon' });
    if (created?.id) {
      navigate(`/estimation/${created.id}/1`);
    }
  };

  // Stats calculées
  const stats = {
    total: estimations.length,
    brouillons: estimations.filter(e => e.statut === 'brouillon').length,
    enCours: estimations.filter(e => e.statut === 'en_cours').length,
    termines: estimations.filter(e => e.statut === 'termine').length,
    volumeTotal: estimations
      .filter(e => e.statut === 'termine' && e.prixFinal)
      .reduce((sum, e) => sum + (e.prixFinal || 0), 0)
  };

  // 5 dernières estimations modifiées
  const recentEstimations = [...estimations]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 5);

  // Nom utilisateur
  const userName = user?.email?.split('@')[0] || 'Courtier';
  const greeting = new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

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
        <div className="space-y-6">
          {/* Welcome */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {greeting}, {userName} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Votre tableau de bord GARY
              </p>
            </div>
            <Button onClick={handleNewEstimation} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle
            </Button>
          </div>

          {/* Stats Grid */}
          {loadingData ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<FileText className="h-5 w-5 text-primary" />}
                value={stats.total}
                label="Total estimations"
                color="bg-primary/10"
                onClick={() => navigate('/estimations')}
              />
              <StatCard
                icon={<Clock className="h-5 w-5 text-amber-600" />}
                value={stats.enCours}
                label="En cours"
                color="bg-amber-100"
                onClick={() => navigate('/estimations')}
              />
              <StatCard
                icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
                value={stats.termines}
                label="Terminées"
                color="bg-emerald-100"
                onClick={() => navigate('/estimations')}
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
                value={stats.volumeTotal > 0 ? `${(stats.volumeTotal / 1000000).toFixed(1)}M` : '—'}
                label="Volume terminé"
                color="bg-blue-100"
              />
            </div>
          )}

          {/* Recent Estimations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Récentes</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={() => navigate('/estimations')}
              >
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {loadingData ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : recentEstimations.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Aucune estimation pour le moment
                </p>
                <Button onClick={handleNewEstimation} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma première
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentEstimations.map(estimation => (
                  <RecentEstimationCard
                    key={estimation.id}
                    estimation={estimation}
                    onClick={() => navigate(`/estimation/${estimation.id}/1`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="font-semibold text-foreground mb-3">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={handleNewEstimation}
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm">Nouvelle estimation</span>
              </Button>
              <Button 
                variant="default" 
                className="h-auto py-4 flex-col gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => navigate('/estimation-express')}
              >
                <Zap className="h-5 w-5" />
                <span className="text-sm">Estimation Express</span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
