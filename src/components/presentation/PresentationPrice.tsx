// ============================================
// Affichage Prix avec Animation
// ============================================

import React, { useState, useEffect } from 'react';
import { Tag, Home, Maximize, Star, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PresentationPriceProps {
  prixMin: number;
  prixMax: number;
  prixFinal: number;
  typeBien: string;
  surface: number;
  pointsForts: string[];
  isLuxe?: boolean;
}

const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Villa / Maison',
  terrain: 'Terrain',
  immeuble: 'Immeuble',
  commercial: 'Local commercial'
};

function AnimatedPrice({ value, isLuxe }: { value: number; isLuxe?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={cn(
      "text-5xl md:text-6xl font-bold tabular-nums",
      isLuxe 
        ? "bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent" 
        : "text-white"
    )}>
      CHF {displayValue.toLocaleString('fr-CH')}
    </span>
  );
}

export function PresentationPrice({ 
  prixMin, 
  prixMax, 
  prixFinal,
  typeBien,
  surface,
  pointsForts,
  isLuxe = false 
}: PresentationPriceProps) {
  const prixM2 = surface > 0 ? Math.round(prixFinal / surface) : 0;
  const typeBienLabel = TYPE_BIEN_LABELS[typeBien] || typeBien;

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Type de bien */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-white/60">
            <Home className="h-5 w-5" />
            <span className="text-lg">{typeBienLabel}</span>
            {surface > 0 && (
              <>
                <span>•</span>
                <Maximize className="h-4 w-4" />
                <span>{surface} m²</span>
              </>
            )}
          </div>
        </div>

        {/* Prix principal animé */}
        <div className="text-center py-8">
          <p className="text-white/50 text-sm mb-2 uppercase tracking-wide">
            Prix de vente recommandé
          </p>
          <AnimatedPrice value={prixFinal} isLuxe={isLuxe} />
          
          {prixM2 > 0 && (
            <p className="text-white/40 mt-4 text-lg">
              soit CHF {prixM2.toLocaleString('fr-CH')} / m²
            </p>
          )}
        </div>

        {/* Fourchette */}
        {prixMin > 0 && prixMax > 0 && (
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-white/60 text-sm font-medium mb-4 text-center">
              Fourchette d'estimation
            </h3>
            
            <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
              {/* Barre de fourchette */}
              <div 
                className={cn(
                  "absolute h-full rounded-full",
                  isLuxe 
                    ? "bg-gradient-to-r from-amber-400/60 to-amber-600/60" 
                    : "bg-gradient-to-r from-primary/40 to-primary/60"
                )}
                style={{ 
                  left: '20%',
                  right: '20%',
                }}
              />
              {/* Marker prix recommandé */}
              <div 
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg",
                  isLuxe ? "bg-amber-500" : "bg-primary"
                )}
                style={{ left: 'calc(50% - 8px)' }}
              />
            </div>

            <div className="flex justify-between mt-4 text-sm">
              <div>
                <p className="text-white/40">Minimum</p>
                <p className="text-white font-semibold">
                  CHF {prixMin.toLocaleString('fr-CH')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/40">Maximum</p>
                <p className="text-white font-semibold">
                  CHF {prixMax.toLocaleString('fr-CH')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Points forts */}
        {pointsForts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold flex items-center gap-2 justify-center">
              <Star className="h-5 w-5 text-amber-400" />
              Points forts du bien
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pointsForts.slice(0, 6).map((point, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 bg-white/5 rounded-xl p-4 backdrop-blur-sm",
                    isLuxe && "border border-amber-500/20"
                  )}
                >
                  <CheckCircle2 className={cn(
                    "h-5 w-5 shrink-0",
                    isLuxe ? "text-amber-400" : "text-emerald-400"
                  )} />
                  <span className="text-white text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicateur tendance */}
        <div className={cn(
          "flex items-center justify-center gap-3 py-4 rounded-xl",
          isLuxe 
            ? "bg-amber-500/10 text-amber-400" 
            : "bg-emerald-500/10 text-emerald-400"
        )}>
          <TrendingUp className="h-5 w-5" />
          <span className="font-medium">Marché genevois favorable</span>
        </div>
      </div>
    </div>
  );
}
