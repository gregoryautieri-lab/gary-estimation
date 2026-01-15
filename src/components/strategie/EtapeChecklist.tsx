// ============================================
// Composant Liste Prochaines Étapes (IMPOSÉES)
// Ce sont des étapes fixes, pas des checkboxes
// ============================================

import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface EtapeChecklistProps {
  etapes: string[];
  cochees: string[];
  onToggle: (etape: string) => void;
}

// Étapes IMPOSÉES dans l'ordre
export const ETAPES_PROCHAINES = [
  'Envoyer le récapitulatif par email au vendeur',
  'Planifier le rendez-vous de signature du mandat',
  'Fixer le prix de mise en vente définitif',
  'Commander les photos professionnelles',
  'Préparer les documents techniques complets',
  'Créer la fiche bien dans le CRM GARY'
];

export function EtapeChecklist({ etapes, cochees, onToggle }: EtapeChecklistProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        ℹ️ Ces étapes sont à réaliser dans l'ordre après la visite d'estimation.
      </p>
      {etapes.map((etape, index) => {
        const isChecked = cochees.includes(etape);
        const isPreviousChecked = index === 0 || cochees.includes(etapes[index - 1]);
        const isActive = isPreviousChecked && !isChecked;
        
        return (
          <div 
            key={index}
            onClick={() => isPreviousChecked && onToggle(etape)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              isChecked 
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" 
                : isActive
                  ? "bg-primary/5 border-primary/30 cursor-pointer hover:bg-primary/10"
                  : "bg-muted/30 border-border opacity-60",
              isPreviousChecked && "cursor-pointer"
            )}
          >
            <div className="flex items-center justify-center w-6 h-6">
              {isChecked ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : isActive ? (
                <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-primary" />
                </div>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded",
                isChecked 
                  ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
                  : "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </span>
              <span className={cn(
                "text-sm flex-1",
                isChecked 
                  ? "text-emerald-700 dark:text-emerald-300 line-through" 
                  : isActive 
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
              )}>
                {etape}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
