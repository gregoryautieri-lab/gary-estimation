// ============================================
// Composant Card de Phase
// ============================================

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PhaseCardProps {
  nom: string;
  icon: string;
  duree: number;
  dateDebut: Date;
  dateFin: Date;
  isActive?: boolean;
  isFirst?: boolean;
  onDureeChange?: (delta: number) => void;
  editable?: boolean;
}

export function PhaseCard({ 
  nom, 
  icon, 
  duree, 
  dateDebut, 
  dateFin,
  isActive = false,
  isFirst = false,
  onDureeChange,
  editable = false
}: PhaseCardProps) {
  const dateDebutFormat = format(dateDebut, 'd MMM', { locale: fr });
  const dateFinFormat = format(dateFin, 'd MMM', { locale: fr });
  
  return (
    <div 
      className={cn(
        "relative border-2 rounded-xl p-4 text-center transition-all min-w-[140px]",
        isActive 
          ? "border-primary bg-primary/5 shadow-md" 
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      {/* Badge Phase active */}
      {isActive && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
          ACTIF
        </div>
      )}
      
      {/* Icon */}
      <div className="text-2xl mb-2">{icon}</div>
      
      {/* Nom */}
      <h4 className={cn(
        "font-bold text-sm",
        isActive ? "text-primary" : "text-foreground"
      )}>
        {nom}
      </h4>
      
      {/* Durée avec +/- */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {editable && onDureeChange && (
          <button 
            onClick={() => onDureeChange(-1)}
            className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs hover:bg-muted/80"
            disabled={duree <= 1}
          >
            −
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          {duree} sem.
        </span>
        {editable && onDureeChange && (
          <button 
            onClick={() => onDureeChange(1)}
            className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs hover:bg-muted/80"
          >
            +
          </button>
        )}
      </div>
      
      {/* Dates */}
      <p className={cn(
        "text-[11px] font-medium mt-1",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {dateDebutFormat} → {dateFinFormat}
      </p>
    </div>
  );
}
