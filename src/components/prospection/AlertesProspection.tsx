import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Alerte, AlerteNiveau } from '@/hooks/useProspectionAlertes';

interface AlertesProspectionProps {
  alertes: Alerte[];
  isLoading: boolean;
}

const niveauConfig: Record<AlerteNiveau, { 
  bg: string; 
  border: string; 
  text: string;
  icon: typeof AlertTriangle;
}> = {
  rouge: { 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    text: 'text-red-800',
    icon: AlertTriangle,
  },
  orange: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-200', 
    text: 'text-orange-800',
    icon: AlertCircle,
  },
  jaune: { 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-200', 
    text: 'text-yellow-800',
    icon: Info,
  },
};

export function AlertesProspection({ alertes, isLoading }: AlertesProspectionProps) {
  const navigate = useNavigate();

  if (isLoading || alertes.length === 0) {
    return null;
  }

  const alertesToShow = alertes.slice(0, 3);
  const remaining = alertes.length - 3;

  const handleVoir = (alerte: Alerte) => {
    if (alerte.campagneId) {
      navigate(`/campagnes/${alerte.campagneId}`);
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {alertesToShow.map((alerte) => {
        const config = niveauConfig[alerte.niveau];
        const Icon = config.icon;

        return (
          <div
            key={alerte.id}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${config.bg} ${config.border}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className={`h-5 w-5 flex-shrink-0 ${config.text}`} />
              <span className={`text-sm font-medium truncate ${config.text}`}>
                {alerte.message}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoir(alerte)}
              className={`flex-shrink-0 ${config.text} hover:${config.bg}`}
            >
              Voir
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        );
      })}

      {remaining > 0 && (
        <p className="text-sm text-muted-foreground text-center py-1">
          et {remaining} autre{remaining > 1 ? 's' : ''} alerte{remaining > 1 ? 's' : ''}...
        </p>
      )}
    </div>
  );
}
