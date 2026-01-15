// ============================================
// Composant Récapitulatif Express Enrichi
// Avec date fin estimée, durée totale, alertes
// ============================================

import { cn } from '@/lib/utils';
import { MapPin, Calendar, Tag, Home, Maximize, Star, Clock, AlertTriangle, Sparkles, Trophy } from 'lucide-react';
import { TypeMiseEnVente } from '@/types/estimation';

interface RecapExpressProps {
  adresse: string;
  localite: string;
  prixAffiche: number;
  typeMiseEnVente: TypeMiseEnVente;
  dateDebut: string;
  // Props enrichies
  typeBien?: string;
  surface?: number;
  pointsForts?: string[];
  // Nouvelles props Sprint 4a
  dateFinEstimee?: string;
  dureeTotale?: number; // En semaines
  niveauContrainte?: number; // 0-5
  isLuxe?: boolean;
  contrainteAlerte?: string;
}

const TYPE_LABELS: Record<TypeMiseEnVente, { label: string; color: string; icon: string }> = {
  offmarket: { label: 'Off-Market', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: '🔒' },
  comingsoon: { label: 'Coming Soon', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: '⏳' },
  public: { label: 'Public', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: '🌐' }
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
  pointsForts = [],
  dateFinEstimee,
  dureeTotale,
  niveauContrainte = 0,
  isLuxe = false,
  contrainteAlerte
}: RecapExpressProps) {
  const typeInfo = TYPE_LABELS[typeMiseEnVente];
  const typeBienLabel = typeBien ? TYPE_BIEN_LABELS[typeBien] || typeBien : null;
  const top3PointsForts = pointsForts.slice(0, 3);
  
  // Couleur de contrainte
  const contrainteColor = niveauContrainte >= 4 ? 'text-red-600' 
    : niveauContrainte >= 2 ? 'text-amber-600' 
    : 'text-emerald-600';
  
  return (
    <div className={cn(
      "rounded-xl p-4 space-y-3 border-2",
      isLuxe 
        ? "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-300 dark:border-amber-700"
        : "bg-gradient-to-br from-background to-muted/30 border-border"
    )}>
      {/* Badge Luxe si applicable */}
      {isLuxe && (
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <Sparkles className="h-3 w-3" />
            ULTRA-LUXE
          </span>
        </div>
      )}
      
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
              <span className="text-sm font-medium text-foreground">
                {isLuxe ? (typeBien === 'maison' ? "Propriété d'exception" : 'Propriété') : typeBienLabel}
              </span>
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
      
      {/* Prix + Badge stratégie */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-primary" />
          <span className={cn(
            "text-xl font-bold",
            isLuxe ? "text-amber-700 dark:text-amber-400" : "text-primary"
          )}>
            {prixAffiche > 0 
              ? `CHF ${prixAffiche.toLocaleString('fr-CH')}`
              : 'Prix à définir'
            }
          </span>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1",
          typeInfo.color
        )}>
          <span>{typeInfo.icon}</span>
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
                className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Dates & Durée */}
      <div className="grid grid-cols-2 gap-2">
        {dateDebut && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground">Début: </span>
              <span className="font-medium text-foreground">{dateDebut}</span>
            </div>
          </div>
        )}
        
        {dateFinEstimee && (
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-muted-foreground">Objectif: </span>
              <span className="font-medium text-emerald-600">{dateFinEstimee}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Durée totale */}
      {dureeTotale && dureeTotale > 0 && (
        <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Durée totale estimée: </span>
          <span className="font-bold text-foreground">{dureeTotale} semaines</span>
          <span className="text-muted-foreground">({Math.round(dureeTotale / 4.3)} mois)</span>
        </div>
      )}
      
      {/* Alerte contrainte si niveau élevé */}
      {niveauContrainte >= 3 && contrainteAlerte && (
        <div className={cn(
          "flex items-start gap-2 p-3 rounded-lg border",
          niveauContrainte >= 4 
            ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        )}>
          <AlertTriangle className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            niveauContrainte >= 4 ? "text-red-500" : "text-amber-500"
          )} />
          <p className={cn(
            "text-xs",
            niveauContrainte >= 4 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {contrainteAlerte}
          </p>
        </div>
      )}
    </div>
  );
}
