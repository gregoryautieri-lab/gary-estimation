import { ChevronLeft, LayoutDashboard } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NetworkStatusBadge } from './NetworkStatusBadge';

interface ModuleHeaderProps {
  moduleNumber: number;
  title: string;
  subtitle?: string;
  backPath?: string;
  onBack?: () => void;
  showSyncIndicator?: boolean;
  showOverviewButton?: boolean;
}

export const ModuleHeader = ({ 
  moduleNumber, 
  title, 
  subtitle, 
  backPath,
  onBack,
  showSyncIndicator = true,
  showOverviewButton = true
}: ModuleHeaderProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              MODULE {moduleNumber}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        
        {/* Bouton Vue d'ensemble */}
        {showOverviewButton && id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/estimation/${id}/overview`)}
            className="shrink-0 gap-1.5"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">360°</span>
          </Button>
        )}
        
        {/* Indicateur de synchronisation */}
        {showSyncIndicator && (
          <NetworkStatusBadge showDetails />
        )}
      </div>
    </div>
  );
};
