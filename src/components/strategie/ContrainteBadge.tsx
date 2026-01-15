// ============================================
// Badge Niveau de Contrainte Vendeur
// ============================================

import { cn } from '@/lib/utils';
import { AlertCircle, Clock, AlertTriangle, Zap, Flame } from 'lucide-react';

interface ContrainteBadgeProps {
  niveau: number;
  label: string;
  showDetails?: boolean;
}

const CONFIG: Record<number, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ReactNode;
  shortLabel: string;
}> = {
  0: {
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: <Clock className="h-4 w-4" />,
    shortLabel: 'Aucune'
  },
  1: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: <Clock className="h-4 w-4" />,
    shortLabel: 'Faible'
  },
  2: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: <AlertCircle className="h-4 w-4" />,
    shortLabel: 'Moyenne'
  },
  3: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <AlertTriangle className="h-4 w-4" />,
    shortLabel: 'Élevée'
  },
  4: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <Zap className="h-4 w-4" />,
    shortLabel: 'Forte'
  },
  5: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: <Flame className="h-4 w-4" />,
    shortLabel: 'Critique'
  }
};

const DETAILS: Record<number, string> = {
  0: 'Pas de projet achat en cours',
  1: 'Recherche en cours — flexibilité maximale',
  2: 'Bien identifié — à surveiller',
  3: 'Offre déposée — rester agile',
  4: 'Compromis signé — coordination requise',
  5: 'Acte programmé — vente impérative'
};

export function ContrainteBadge({ niveau, label, showDetails = true }: ContrainteBadgeProps) {
  const config = CONFIG[niveau] || CONFIG[0];
  
  return (
    <div className="space-y-2">
      {/* Badge principal */}
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm",
        config.bgColor,
        config.borderColor,
        config.color
      )}>
        {config.icon}
        <span>Contrainte {config.shortLabel}</span>
      </div>
      
      {/* Détail explicatif */}
      {showDetails && niveau > 0 && (
        <p className="text-xs text-muted-foreground pl-1">
          {DETAILS[niveau]}
        </p>
      )}
    </div>
  );
}
