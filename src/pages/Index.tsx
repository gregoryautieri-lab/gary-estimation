import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useProjectsComparables } from '@/hooks/useProjectsComparables';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LogOut, 
  Plus, 
  FileText, 
  Map, 
  ChevronRight,
  Zap,
  Search,
  Megaphone,
  Settings2
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  stats: { label: string; value: string | number }[];
  onClick: () => void;
  color: string;
}

const ToolCard = ({ icon, title, stats, onClick, color }: ToolCardProps) => (
  <Card 
    className="border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
    onClick={onClick}
  >
    <CardContent className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-sm text-foreground mb-1.5">{title}</h3>
      <div className="space-y-1">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{stat.label}</span>
            <span className="font-medium text-foreground">{stat.value}</span>
          </div>
        ))}
      </div>
      <Button className="w-full mt-3 h-7 text-xs" variant="outline">
        Ouvrir
      </Button>
    </CardContent>
  </Card>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isResponsableProspection, isCourtier, isBackOffice } = useUserRole();
  const { fetchEstimations, createEstimation, loading: creatingEstimation } = useEstimationPersistence();
  const { fetchProjects } = useProjectsComparables();
  
  const [loadingData, setLoadingData] = useState(true);
  const [estimationsStats, setEstimationsStats] = useState({ total: 0, enCours: 0 });
  const [comparablesStats, setComparablesStats] = useState({ projects: 0, totalComparables: 0 });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
    loadUserName();
  }, [user]);

  const loadUserName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data?.full_name) {
      setUserName(data.full_name.split(' ')[0]);
    } else {
      setUserName(user.email?.split('@')[0] || 'Courtier');
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Fetch estimations
      const estimations = await fetchEstimations();
      setEstimationsStats({
        total: estimations.length,
        enCours: estimations.filter(e => e.statut === 'en_cours').length
      });

      // Fetch projects comparables
      const projects = await fetchProjects({ archived: false });
      const totalComparables = projects.reduce((sum, p) => sum + (p.nbComparables || 0), 0);
      setComparablesStats({
        projects: projects.length,
        totalComparables
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleNewEstimation = async () => {
    const created = await createEstimation({ statut: 'brouillon' });
    if (created?.id) {
      navigate(`/estimation/${created.id}/1`);
    }
  };

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <GaryLogo className="h-6 text-primary" />
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Votre tableau de bord GARY
            </p>
          </div>

          {/* Tool Cards Grid */}
          {loadingData ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-36 rounded-lg" />
              <Skeleton className="h-36 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ToolCard
                  icon={<FileText className="h-4 w-4 text-primary" />}
                  title="Estimations"
                  stats={[
                    { label: 'Total estimations', value: estimationsStats.total },
                    { label: 'En cours', value: estimationsStats.enCours }
                  ]}
                  onClick={() => navigate('/estimations')}
                  color="bg-primary/10"
                />
                <ToolCard
                  icon={<Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                  title="Comparables"
                  stats={[
                    { label: 'Projets', value: comparablesStats.projects },
                    { label: 'Total comparables', value: comparablesStats.totalComparables }
                  ]}
                  onClick={() => navigate('/comparables')}
                  color="bg-emerald-500/10"
                />
              </div>

              {/* Prospection Card - visible pour courtiers, admins, responsables */}
              {(isAdmin || isResponsableProspection || isCourtier || isBackOffice) && (
                <Card 
                  className="border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                  onClick={() => navigate('/campagnes')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Megaphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">Prospection</h3>
                        <p className="text-sm text-muted-foreground">
                          Gérer vos campagnes de distribution
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Prospection Card - visible pour admin et responsable_prospection */}
              {(isAdmin || isResponsableProspection) && (
                <Card 
                  className="border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                  onClick={() => navigate('/admin/prospection')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Settings2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">Admin Prospection</h3>
                        <p className="text-sm text-muted-foreground">
                          Supports et étudiants
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1.5 text-xs"
                onClick={handleNewEstimation}
                disabled={creatingEstimation}
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle estimation</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1.5 text-xs"
                onClick={() => navigate('/comparables/explore')}
              >
                <Search className="h-4 w-4" />
                <span>Explorer comparables</span>
              </Button>
            </div>
          </div>


          {/* Estimation Express promo */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-amber-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground">Estimation Express</h3>
                  <p className="text-xs text-muted-foreground">
                    Calcul rapide simplifié
                  </p>
                </div>
                <Button 
                  size="sm"
                  variant="default"
                  className="bg-amber-500 hover:bg-amber-600 shrink-0 h-7 text-xs px-3"
                  onClick={() => navigate('/estimation-express')}
                >
                  Lancer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
