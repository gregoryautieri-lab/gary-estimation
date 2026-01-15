// ============================================
// Composant Récapitulatif Express Enrichi
// ============================================

import { cn } from '@/lib/utils';
import { MapPin, Calendar, Tag, Home, Maximize, Star } from 'lucide-react';
import { TypeMiseEnVente } from '@/types/estimation';

interface RecapExpressProps {
  adresse: string;
  localite: string;
  prixAffiche: number;
  typeMiseEnVente: TypeMiseEnVente;
  dateDebut: string;
  // Nouvelles props enrichies
  typeBien?: string;
  surface?: number;
  pointsForts?: string[];
}

const TYPE_LABELS: Record<TypeMiseEnVente, { label: string; color: string }> = {
  offmarket: { label: 'Off-Market', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  comingsoon: { label: 'Coming Soon', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  public: { label: 'Public', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' }
};

const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison / Villa',
  terrain: 'Terrain',
  immeuble: 'Immeuble',
  commercial: 'Local commercial'
};

export function RecapExpress({ 
  adresse, 
  localite, 
  prixAffiche, 
  typeMiseEnVente,
  dateDebut,
  typeBien,
  surface,
  pointsForts = []
}: RecapExpressProps) {
  const typeInfo = TYPE_LABELS[typeMiseEnVente];
  const typeBienLabel = typeBien ? TYPE_BIEN_LABELS[typeBien] || typeBien : null;
  const top3PointsForts = pointsForts.slice(0, 3);
  
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
      
      {/* Type de bien + Surface */}
      {(typeBienLabel || surface) && (
        <div className="flex items-center gap-4 flex-wrap">
          {typeBienLabel && (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{typeBienLabel}</span>
            </div>
          )}
          {surface && surface > 0 && (
            <div className="flex items-center gap-2">
              <Maximize className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{surface} m²</span>
            </div>
          )}
        </div>
      )}
      
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
      
      {/* Points Forts (top 3) */}
      {top3PointsForts.length > 0 && (
        <div className="flex items-start gap-2">
          <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {top3PointsForts.map((point, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      )}
      
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
