import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MapPin,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Mission, MissionStatut } from '@/types/prospection';

interface MissionCardProps {
  mission: Mission;
  campagneCode?: string;
  commune?: string;
}

const statutConfig: Record<MissionStatut, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  prevue: { label: 'Prévue', variant: 'default' },
  en_cours: { label: 'En cours', variant: 'secondary' },
  terminee: { label: 'Terminée', variant: 'outline' },
  annulee: { label: 'Annulée', variant: 'destructive' },
};

export function MissionCard({ mission, campagneCode, commune }: MissionCardProps) {
  const navigate = useNavigate();

  const config = statutConfig[mission.statut] || statutConfig.prevue;

  // Indicateur Strava
  const renderStravaIndicator = () => {
    if (mission.strava_validated) {
      return (
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs">Validé</span>
        </div>
      );
    }
    if (mission.strava_screenshot_url) {
      return (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Clock className="h-4 w-4" />
          <span className="text-xs">En attente</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs">Strava requis</span>
      </div>
    );
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
      onClick={() => navigate(`/etudiant/mission/${mission.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Code campagne */}
            {campagneCode && (
              <p className="font-semibold text-base truncate">{campagneCode}</p>
            )}

            {/* Commune et secteur */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {commune || 'Non défini'}
                {mission.secteur_nom && ` • ${mission.secteur_nom}`}
              </span>
            </div>

            {/* Date */}
            <p className="text-sm text-muted-foreground">
              {format(new Date(mission.date), 'EEEE d MMMM', { locale: fr })}
            </p>

            {/* Courriers */}
            <div className="flex items-center gap-1.5 text-sm">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>{mission.courriers_prevu} courriers à distribuer</span>
            </div>

            {/* Strava indicator */}
            {renderStravaIndicator()}
          </div>

          {/* Right side: badge + chevron */}
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={config.variant}
              className={cn(
                mission.statut === 'prevue' && 'bg-blue-500 hover:bg-blue-600 text-white',
                mission.statut === 'en_cours' && 'bg-amber-500 hover:bg-amber-600 text-white',
                mission.statut === 'terminee' && 'bg-emerald-500 hover:bg-emerald-600 text-white',
                mission.statut === 'annulee' && 'bg-gray-400 hover:bg-gray-500 text-white'
              )}
            >
              {config.label}
            </Badge>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
