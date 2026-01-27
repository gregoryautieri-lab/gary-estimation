import { useCommuneHistory } from '@/hooks/useCommuneHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Mail, Hash, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CommuneHistoryPanelProps {
  commune: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-CH');
}

export function CommuneHistoryPanel({ commune }: CommuneHistoryPanelProps) {
  const { data, isLoading, error } = useCommuneHistory(commune);

  if (!commune) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-4 text-center text-sm text-destructive">
          Erreur lors du chargement de l'historique
        </CardContent>
      </Card>
    );
  }

  if (!data || data.stats.nb_campagnes === 0) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          <MapPin className="h-5 w-5 mx-auto mb-2 opacity-50" />
          Aucune campagne précédente dans cette commune
        </CardContent>
      </Card>
    );
  }

  const { stats, campagnes } = data;

  // Calculer le délai depuis la dernière distribution
  const daysSinceLastDistribution = stats.derniere_distribution
    ? differenceInDays(new Date(), parseISO(stats.derniere_distribution))
    : null;

  // Alerte si distribution récente (< 30 jours)
  const isRecentDistribution = daysSinceLastDistribution !== null && daysSinceLastDistribution < 30;

  return (
    <Card className={isRecentDistribution ? 'border-warning bg-warning/5' : 'border-dashed'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Historique — {commune}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Alerte distribution récente */}
        {isRecentDistribution && (
          <div className="flex items-center gap-2 text-xs text-warning-foreground bg-warning/20 rounded-md p-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Distribution il y a {daysSinceLastDistribution} jour{daysSinceLastDistribution !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">{formatNumber(stats.total_courriers_12_mois)}</div>
            <div className="text-xs text-muted-foreground">12 derniers mois</div>
          </div>
          <div>
            <div className="text-lg font-bold">{stats.nb_campagnes}</div>
            <div className="text-xs text-muted-foreground">Campagnes</div>
          </div>
          <div>
            <div className="text-lg font-bold">{formatDate(stats.derniere_distribution)}</div>
            <div className="text-xs text-muted-foreground">Dernière</div>
          </div>
        </div>

        <Separator />

        {/* Dernières campagnes */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Dernières campagnes :</div>
          {campagnes.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2 text-xs bg-muted/50 rounded-md p-2"
            >
              <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                {c.code || '—'}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.type_message || 'Non défini'}</div>
                <div className="text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(c.date_debut)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {formatNumber(c.nb_courriers + c.nb_flyers)}
                  </span>
                  <span className="text-[10px] opacity-75">{c.support_nom}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
