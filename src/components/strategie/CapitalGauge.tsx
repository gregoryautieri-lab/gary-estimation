// ============================================
// Composant Jauge Capital-Visibilité (Barre)
// ============================================

import { cn } from '@/lib/utils';
import { AlertTriangle, Eye, EyeOff, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CapitalGaugeProps {
  pourcentage: number;
  label: 'intact' | 'entame' | 'faible';
  color: 'green' | 'yellow' | 'red';
  pauseRecalibrage: number;
}

const CONFIG: Record<string, { 
  label: string; 
  icon: React.ReactNode;
  description: string;
  bgClass: string;
  textClass: string;
  progressClass: string;
}> = {
  green: {
    label: 'Capital intact',
    icon: <Eye className="h-5 w-5" />,
    description: "Le bien n'a pas été exposé récemment",
    bgClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-600',
    progressClass: '[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400'
  },
  yellow: {
    label: 'Capital entamé',
    icon: <TrendingDown className="h-5 w-5" />,
    description: "Le bien a déjà été vu par le marché",
    bgClass: 'bg-amber-50 border-amber-200',
    textClass: 'text-amber-600',
    progressClass: '[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-400'
  },
  red: {
    label: 'Capital faible',
    icon: <EyeOff className="h-5 w-5" />,
    description: "Le bien a été longuement exposé",
    bgClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-600',
    progressClass: '[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-red-400'
  }
};

export function CapitalGauge({ pourcentage, label, color, pauseRecalibrage }: CapitalGaugeProps) {
  const config = CONFIG[color];
  
  return (
    <div className="space-y-4">
      {/* Header avec icône et label */}
      <div className={cn(
        "p-4 rounded-xl border",
        config.bgClass
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={config.textClass}>{config.icon}</span>
            <h4 className={cn("font-semibold", config.textClass)}>
              {config.label}
            </h4>
          </div>
          <span className={cn("text-2xl font-bold", config.textClass)}>
            {pourcentage}%
          </span>
        </div>
        
        {/* Barre de progression */}
        <Progress 
          value={pourcentage} 
          className={cn("h-3 bg-white/50", config.progressClass)}
        />
        
        <p className="text-xs text-muted-foreground mt-2">
          {config.description}
        </p>
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
              Pause de recalibrage : {pauseRecalibrage} semaine{pauseRecalibrage > 1 ? 's' : ''}
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
