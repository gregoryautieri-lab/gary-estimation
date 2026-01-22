import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, User } from 'lucide-react';
import type { PlanningMission } from '@/hooks/usePlanningMissions';
import type { MissionStatut } from '@/types/prospection';

interface MissionPlanningCardProps {
  mission: PlanningMission;
}

const statutConfig: Record<MissionStatut, { label: string; className: string }> = {
  prevue: { label: 'Prévue', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  en_cours: { label: 'En cours', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  terminee: { label: 'Terminée', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  annulee: { label: 'Annulée', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
};

export function MissionPlanningCard({ mission }: MissionPlanningCardProps) {
  const config = statutConfig[mission.statut] || statutConfig.prevue;

  const getAssigneeName = (): string => {
    if (mission.etudiant) {
      return mission.etudiant.prenom + (mission.etudiant.nom ? ` ${mission.etudiant.nom.charAt(0)}.` : '');
    }
    if (mission.courtier_id) {
      return 'Courtier';
    }
    return 'Non assigné';
  };

  const courriersText = mission.statut === 'terminee' && mission.courriers_distribues !== null
    ? `${mission.courriers_distribues}/${mission.courriers_prevu}`
    : `${mission.courriers_prevu}`;

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        {/* Statut badge */}
        <Badge variant="secondary" className={config.className}>
          {config.label}
        </Badge>

        {/* Assigné */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{getAssigneeName()}</span>
        </div>

        {/* Commune */}
        {mission.campagne && (
          <div className="text-sm font-medium truncate">
            {mission.campagne.commune}
          </div>
        )}

        {/* Courriers */}
        <div className="flex items-center gap-1.5 text-sm">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{courriersText} courriers</span>
        </div>

        {/* Secteur si défini */}
        {mission.secteur_nom && (
          <div className="text-xs text-muted-foreground truncate">
            {mission.secteur_nom}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
