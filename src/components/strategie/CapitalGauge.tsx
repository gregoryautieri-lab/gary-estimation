// ============================================
// Composant Jauge Capital-Visibilité
// ============================================

import { cn } from '@/lib/utils';
import { AlertTriangle, Info } from 'lucide-react';

interface CapitalGaugeProps {
  pourcentage: number;
  label: 'intact' | 'entame' | 'faible';
  color: 'green' | 'yellow' | 'red';
  pauseRecalibrage: number;
}

const LABELS: Record<string, string> = {
  intact: 'Capital intact',
  entame: 'Capital entamé',
  faible: 'Capital faible'
};

export function CapitalGauge({ pourcentage, label, color, pauseRecalibrage }: CapitalGaugeProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Jauge circulaire */}
        <div 
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg",
            color === 'green' && "bg-gradient-to-br from-emerald-500 to-emerald-400",
            color === 'yellow' && "bg-gradient-to-br from-amber-500 to-amber-400",
            color === 'red' && "bg-gradient-to-br from-red-500 to-red-400"
          )}
        >
          {pourcentage}%
        </div>
        
        {/* Label et description */}
        <div className="flex-1">
          <h4 className={cn(
            "font-semibold text-lg",
            color === 'green' && "text-emerald-600",
            color === 'yellow' && "text-amber-600",
            color === 'red' && "text-red-600"
          )}>
            {LABELS[label]}
          </h4>
          <p className="text-sm text-muted-foreground">
            {color === 'green' && "Le bien n'a pas été exposé récemment"}
            {color === 'yellow' && "Le bien a déjà été vu par le marché"}
            {color === 'red' && "Le bien a été longuement exposé"}
          </p>
        </div>
      </div>
      
      {/* Alerte pause recalibrage */}
      {pauseRecalibrage > 0 && (
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg",
          color === 'red' ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
        )}>
          <AlertTriangle className={cn(
            "h-5 w-5 mt-0.5 shrink-0",
            color === 'red' ? "text-red-500" : "text-amber-500"
          )} />
          <div>
            <p className={cn(
              "text-sm font-medium",
              color === 'red' ? "text-red-700" : "text-amber-700"
            )}>
              Pause de recalibrage recommandée : {pauseRecalibrage} semaine{pauseRecalibrage > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cette pause permet de repositionner le bien avec une nouvelle stratégie.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
