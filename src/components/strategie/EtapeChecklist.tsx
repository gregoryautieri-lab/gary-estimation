// ============================================
// Composant Checklist Prochaines Étapes
// ============================================

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EtapeChecklistProps {
  etapes: string[];
  cochees: string[];
  onToggle: (etape: string) => void;
}

export const ETAPES_PROCHAINES = [
  'Envoyer le récapitulatif par email',
  'Planifier le rendez-vous de signature mandat',
  'Commander les photos professionnelles',
  'Préparer les documents techniques',
  'Coordonner avec l\'acheteur (si applicable)',
  'Créer la fiche bien dans le CRM'
];

export function EtapeChecklist({ etapes, cochees, onToggle }: EtapeChecklistProps) {
  return (
    <div className="space-y-3">
      {etapes.map((etape, index) => {
        const isChecked = cochees.includes(etape);
        return (
          <div 
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              isChecked 
                ? "bg-emerald-50 border-emerald-200" 
                : "bg-card border-border"
            )}
          >
            <Checkbox
              id={`etape-${index}`}
              checked={isChecked}
              onCheckedChange={() => onToggle(etape)}
              className={cn(isChecked && "border-emerald-500 bg-emerald-500")}
            />
            <Label 
              htmlFor={`etape-${index}`}
              className={cn(
                "text-sm cursor-pointer flex-1",
                isChecked && "text-emerald-700 line-through"
              )}
            >
              {etape}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
