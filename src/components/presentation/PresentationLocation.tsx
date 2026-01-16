// ============================================
// Localisation Plein Écran Mode Présentation
// ============================================

import React from 'react';
import { MapPin, Navigation, Train, ShoppingBag, School, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PresentationMap } from './PresentationMap';
import type { Proximite } from '@/types/estimation';

interface PresentationLocationProps {
  coordinates: { lat: number; lng: number } | null;
  adresse: string;
  localite: string;
  proximites?: Proximite[];
  isLuxe?: boolean;
}

const PROXIMITE_ICONS: Record<string, React.ReactNode> = {
  transports: <Train className="h-5 w-5" />,
  commerces: <ShoppingBag className="h-5 w-5" />,
  ecoles: <School className="h-5 w-5" />,
  ville: <Building2 className="h-5 w-5" />
};

const PROXIMITE_LABELS: Record<string, string> = {
  transports: 'Transports publics',
  commerces: 'Commerces',
  ecoles: 'Écoles',
  ville: 'Centre-ville'
};

export function PresentationLocation({
  coordinates,
  adresse,
  localite,
  proximites = [],
  isLuxe = false
}: PresentationLocationProps) {
  // Filtrer les proximités valides (utilise libelle au lieu de description)
  const validProximites = proximites.filter(p => p.distance || p.libelle);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Map section - prend plus de place */}
      <div className="h-2/3 lg:h-full lg:w-2/3 relative">
        <PresentationMap 
          coordinates={coordinates}
          adresse={adresse}
          localite={localite}
        />
      </div>

      {/* Info section */}
      <div className="h-1/3 lg:h-full lg:w-1/3 bg-gray-900 p-6 overflow-auto flex flex-col justify-center">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full",
              isLuxe 
                ? "bg-amber-500/20 text-amber-400"
                : "bg-primary/20 text-primary"
            )}>
              <MapPin className="h-5 w-5" />
              <span className="font-semibold">Localisation</span>
            </div>
            
            <h2 className="text-white text-xl font-semibold">{adresse}</h2>
            <p className="text-white/60">{localite}</p>
          </div>

          {/* Proximités */}
          {validProximites.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wide">
                À proximité
              </h3>
              
              <div className="space-y-2">
                {validProximites.map((prox, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      isLuxe 
                        ? "bg-amber-500/10 border border-amber-500/20"
                        : "bg-white/5 border border-white/10"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      isLuxe ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                    )}>
                      {PROXIMITE_ICONS[prox.type] || <Navigation className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">
                        {PROXIMITE_LABELS[prox.type] || prox.type}
                      </p>
                      {prox.distance && (
                        <p className="text-white/50 text-xs">
                          {prox.distance}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to action */}
          <div className={cn(
            "p-4 rounded-xl text-center",
            isLuxe 
              ? "bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20"
              : "bg-white/5 border border-white/10"
          )}>
            <p className="text-white/70 text-sm">
              Quartier recherché avec excellent accès
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
