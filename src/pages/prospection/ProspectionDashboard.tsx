import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useProspectionDashboard, type DashboardPeriod } from '@/hooks/useProspectionDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { KpiCard } from '@/components/prospection/dashboard/KpiCard';
import { VolumeChart } from '@/components/prospection/dashboard/VolumeChart';
import { SupportPieChart } from '@/components/prospection/dashboard/SupportPieChart';
import { MessageTypePieChart } from '@/components/prospection/dashboard/MessageTypePieChart';
import { CommuneBarChart } from '@/components/prospection/dashboard/CommuneBarChart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LogOut,
  ArrowLeft,
  Megaphone,
  CalendarPlus,
  Percent,
  CalendarDays,
  AlertCircle,
  Clock,
  Mail,
  TrendingUp,
  Wallet,
  RefreshCw,
} from 'lucide-react';

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'month', label: 'Ce mois' },
  { value: '3months', label: '3 derniers mois' },
  { value: '6months', label: '6 derniers mois' },
  { value: 'year', label: 'Cette année' },
];

function formatCHF(value: number): string {
  return value.toLocaleString('fr-CH', { 
    style: 'currency', 
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function ProspectionDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();

  // Filtres
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [courtierId, setCourtierId] = useState<string>('tous');

  // Récupérer les courtiers pour le filtre (admin seulement)
  const { data: courtiers = [], isLoading: courtiersLoading } = useQuery({
    queryKey: ['courtiers_profiles_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Dashboard data
  const { data, isLoading, refetch } = useProspectionDashboard({
    period,
    courtierId: courtierId !== 'tous' ? courtierId : null,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campagnes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GaryLogo className="h-6 text-primary" />
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-24 space-y-4">
        {/* Titre */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-foreground">Dashboard Prospection</h1>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as DashboardPeriod)}
          >
            <SelectTrigger className="w-[150px] h-9">
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

          {isAdmin && (
            <Select
              value={courtierId}
              onValueChange={setCourtierId}
              disabled={courtiersLoading}
            >
              <SelectTrigger className="w-[150px] h-9">
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
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Ligne 1 - Campagnes */}
            <div className="grid grid-cols-3 gap-2">
              <KpiCard
                icon={Megaphone}
                label="Campagnes actives"
                value={data.kpis.campagnesActives}
              />
              <KpiCard
                icon={CalendarPlus}
                label="Campagnes ce mois"
                value={data.kpis.campagnesCeMois}
              />
              <KpiCard
                icon={Percent}
                label="Taux complétion"
                value={`${data.kpis.tauxCompletion}%`}
              />
            </div>

            {/* Ligne 2 - Missions */}
            <div className="grid grid-cols-3 gap-2">
              <KpiCard
                icon={CalendarDays}
                label="Missions cette sem."
                value={data.kpis.missionsCetteSemaine}
              />
              <KpiCard
                icon={AlertCircle}
                label="À valider"
                value={data.kpis.missionsAValider}
                className={data.kpis.missionsAValider > 0 ? 'border-warning/50' : ''}
              />
              <KpiCard
                icon={Clock}
                label="En retard"
                value={data.kpis.missionsEnRetard}
                className={data.kpis.missionsEnRetard > 0 ? 'border-destructive/50' : ''}
              />
            </div>

            {/* Ligne 3 - Volume & Coûts */}
            <div className="grid grid-cols-3 gap-2">
              <KpiCard
                icon={Mail}
                label="Courriers ce mois"
                value={data.kpis.courriersDistribuesCeMois.toLocaleString('fr-CH')}
              />
              <KpiCard
                icon={TrendingUp}
                label="vs mois dernier"
                value={`${data.kpis.courriersVsMoisDernier > 0 ? '+' : ''}${data.kpis.courriersVsMoisDernier}%`}
                trend={data.kpis.courriersVsMoisDernier > 0 ? 'up' : data.kpis.courriersVsMoisDernier < 0 ? 'down' : 'neutral'}
              />
              <KpiCard
                icon={Wallet}
                label="Coût total ce mois"
                value={formatCHF(data.kpis.coutTotalCeMois)}
              />
            </div>
          </div>
        ) : null}

        {/* Graphiques */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[250px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[250px]" />
              <Skeleton className="h-[250px]" />
            </div>
            <Skeleton className="h-[320px]" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Volume par mois */}
            <VolumeChart data={data.volumeParMois} />

            {/* Pie charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SupportPieChart data={data.repartitionSupport} />
              <MessageTypePieChart data={data.repartitionMessage} />
            </div>

            {/* Performance par commune */}
            <CommuneBarChart data={data.performanceCommune} />
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
