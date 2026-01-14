// ============================================
// Composant Récapitulatif Express
// ============================================

import { cn } from '@/lib/utils';
import { MapPin, Calendar, Tag } from 'lucide-react';
import { TypeMiseEnVente } from '@/types/estimation';

interface RecapExpressProps {
  adresse: string;
  localite: string;
  prixAffiche: number;
  typeMiseEnVente: TypeMiseEnVente;
  dateDebut: string;
}

const TYPE_LABELS: Record<TypeMiseEnVente, { label: string; color: string }> = {
  offmarket: { label: 'Off-Market', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  comingsoon: { label: 'Coming Soon', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  public: { label: 'Public', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' }
};

export function RecapExpress({ 
  adresse, 
  localite, 
  prixAffiche, 
  typeMiseEnVente,
  dateDebut
}: RecapExpressProps) {
  const typeInfo = TYPE_LABELS[typeMiseEnVente];
  
  return (
    <div className="bg-gradient-to-br from-background to-muted/30 border border-border rounded-xl p-4 space-y-3">
      {/* Adresse */}
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-foreground">{adresse || 'Adresse non renseignée'}</p>
          <p className="text-sm text-muted-foreground">{localite}</p>
        </div>
      </div>
      
      {/* Prix + Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold text-primary">
            {prixAffiche > 0 
              ? `CHF ${prixAffiche.toLocaleString('fr-CH')}`
              : 'Prix à définir'
            }
          </span>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold border",
          typeInfo.color
        )}>
          {typeInfo.label}
        </span>
      </div>
      
      {/* Date de début */}
      {dateDebut && (
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            Démarrage prévu : <span className="font-medium text-foreground">{dateDebut}</span>
          </span>
        </div>
      )}
    </div>
  );
}
