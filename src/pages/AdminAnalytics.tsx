import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/gary/BottomNav';
import { ThemeToggle } from '@/components/gary/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useUserRole } from '@/hooks/useUserRole';
import { useAnalyticsData, PeriodFilter } from '@/hooks/useAnalyticsData';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  Download,
  Target,
  DollarSign,
  Calendar,
  RefreshCw,
  Briefcase,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEffect } from 'react';

const COLORS = ['#FA4238', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const PERIOD_OPTIONS = [
  { value: '7j', label: '7 derniers jours' },
  { value: '30j', label: '30 derniers jours' },
  { value: 'annee', label: 'Année en cours' },
];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30j');
  const [courtierFilter, setCourtierFilter] = useState<string | null>(null);

  const { data, loading, error, reload, exportToCSV, courtiersList } = useAnalyticsData(
    periodFilter,
    courtierFilter
  );

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Accès refusé - Droits administrateur requis');
      navigate('/admin');
    }
  }, [isAdmin, roleLoading, navigate]);

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M CHF`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}'000 CHF`;
    }
    return `${value} CHF`;
  };

  const handleExport = () => {
    exportToCSV();
    toast.success('Export CSV téléchargé');
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:bg-white/10 h-8 w-8"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-semibold text-white">Analytics & KPIs</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={periodFilter}
            onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={courtierFilter || 'all'}
            onValueChange={(v) => setCourtierFilter(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[160px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tous les courtiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les courtiers</SelectItem>
              {courtiersList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={reload}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="outline" onClick={handleExport} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : data ? (
          <>
            {/* ============================================ */}
            {/* SECTION 1: VUE D'ENSEMBLE */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Vue d'ensemble
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {periodFilter === '7j'
                        ? data.totalEstimations7j
                        : periodFilter === 'annee'
                        ? data.totalEstimationsAnnee
                        : data.totalEstimations30j}
                    </p>
                    <p className="text-xs text-muted-foreground">Estimations créées</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                      {data.tauxConversionGlobal}%
                    </p>
                    <p className="text-xs text-muted-foreground">Taux conversion</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-500">
                      {data.delaiMoyenSignature}j
                    </p>
                    <p className="text-xs text-muted-foreground">Délai moyen</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-500">
                      {formatPrice(data.caPrevisionnel)}
                    </p>
                    <p className="text-xs text-muted-foreground">CA prévisionnel</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* SECTION 2: PERFORMANCE PAR COURTIER */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Performance par courtier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.courtierPerformances.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune donnée pour cette période
                  </p>
                ) : (
                  <>
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Courtier</TableHead>
                            <TableHead className="text-center">Estim</TableHead>
                            <TableHead className="text-center">Mandats</TableHead>
                            <TableHead className="text-center">Taux</TableHead>
                            <TableHead className="text-center">CA moy</TableHead>
                            <TableHead className="text-center">Délai</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.courtierPerformances.slice(0, 10).map((p) => (
                            <TableRow key={p.courtierId}>
                              <TableCell className="font-medium">{p.courtierName}</TableCell>
                              <TableCell className="text-center">{p.estimations}</TableCell>
                              <TableCell className="text-center">{p.mandats}</TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={p.tauxConversion >= 30 ? 'default' : 'secondary'}
                                  className={
                                    p.tauxConversion >= 30
                                      ? 'bg-emerald-500'
                                      : p.tauxConversion >= 20
                                      ? 'bg-amber-500'
                                      : ''
                                  }
                                >
                                  {p.tauxConversion}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {p.caMoyen > 0 ? formatPrice(p.caMoyen) : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {p.delaiMoyen > 0 ? `${p.delaiMoyen}j` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Bar Chart */}
                    <div className="mt-4 h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.courtierPerformances.slice(0, 6)}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis
                            dataKey="courtierName"
                            fontSize={10}
                            tickFormatter={(v) => v.split(' ')[0]}
                          />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="estimations" name="Estimations" fill="#3b82f6" />
                          <Bar dataKey="mandats" name="Mandats" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* SECTION 3: ENTONNOIR (FUNNEL) */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Entonnoir de conversion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.funnelSteps.map((step, index) => (
                  <div key={step.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {index === data.funnelSteps.length - 1 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <span className="text-muted-foreground">{index === 0 ? '├' : '├─'}</span>
                        )}
                        {step.label}
                      </span>
                      <span className="font-medium">
                        {step.percentage}% ({step.count})
                      </span>
                    </div>
                    <Progress
                      value={step.percentage}
                      className="h-2"
                      style={
                        {
                          '--progress-background': COLORS[index % COLORS.length],
                        } as React.CSSProperties
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* SECTION 4: TEMPS PAR MODULE */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Temps moyen par module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.modulesTimes.map((m) => (
                    <div key={m.module} className="flex items-center gap-3">
                      <Badge variant="outline" className="w-24 justify-center">
                        M{m.module}: {m.label}
                      </Badge>
                      <div className="flex-1">
                        <Progress
                          value={(m.avgMinutes / 20) * 100}
                          className="h-3"
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {m.avgMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* SECTION 5: TYPES DE BIENS */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Répartition par type de bien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.typesBienStats}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ type, percentage }) => `${type}: ${percentage}%`}
                          labelLine={false}
                        >
                          {data.typesBienStats.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Liste avec prix moyen */}
                  <div className="space-y-2">
                    {data.typesBienStats.map((t, index) => (
                      <div
                        key={t.type}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{t.type}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{t.percentage}%</p>
                          <p className="text-xs text-muted-foreground">
                            {t.prixMoyen > 0 ? formatPrice(t.prixMoyen) : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* SECTION 6: ZONES GÉOGRAPHIQUES */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  Top 10 communes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.zonesStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune donnée géographique
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.zonesStats.map((z, index) => (
                      <div key={z.localite} className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="w-6 h-6 rounded-full flex items-center justify-center p-0"
                        >
                          {index + 1}
                        </Badge>
                        <span className="flex-1 text-sm truncate">{z.localite}</span>
                        <div className="w-20">
                          <Progress value={z.percentage} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {z.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* SECTION 7: TAUX D'ABANDON */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Taux d'abandon par module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {data.abandonStats.map((a) => (
                    <div
                      key={a.module}
                      className="text-center p-3 bg-muted/50 rounded-lg"
                    >
                      <p className="text-lg font-bold text-destructive">
                        {a.abandonPercentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">M{a.module}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* GRAPHIQUE: ÉVOLUTION PAR MOIS */}
            {/* ============================================ */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Évolution mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.estimationsParMois}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="mois"
                        fontSize={10}
                        tickFormatter={(v) => {
                          const [year, month] = v.split('-');
                          return `${month}/${year.slice(2)}`;
                        }}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip
                        labelFormatter={(v) => {
                          const [year, month] = v.split('-');
                          const monthNames = [
                            'Jan',
                            'Fév',
                            'Mar',
                            'Avr',
                            'Mai',
                            'Juin',
                            'Juil',
                            'Août',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Déc',
                          ];
                          return `${monthNames[parseInt(month) - 1]} ${year}`;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Estimations"
                        stroke="#FA4238"
                        strokeWidth={2}
                        dot={{ fill: '#FA4238' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
