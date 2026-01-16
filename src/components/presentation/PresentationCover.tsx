// ============================================
// Couverture Plein Écran Mode Présentation
// ============================================

import React from 'react';
import { ChevronDown, MapPin, Home, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Photo } from '@/types/estimation';

interface PresentationCoverProps {
  photos: Photo[];
  adresse: string;
  localite: string;
  typeBien: string;
  surface: number;
  prixFinal: number;
  isLuxe?: boolean;
  onNext: () => void;
}

const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Villa / Maison',
  terrain: 'Terrain',
  immeuble: 'Immeuble',
  commercial: 'Local commercial'
};

export function PresentationCover({
  photos,
  adresse,
  localite,
  typeBien,
  surface,
  prixFinal,
  isLuxe = false,
  onNext
}: PresentationCoverProps) {
  // Utiliser la photo principale ou la première
  const coverPhoto = photos.find(p => p.favori) || photos[0];
  const backgroundUrl = coverPhoto?.storageUrl || coverPhoto?.dataUrl;
  const typeBienLabel = TYPE_BIEN_LABELS[typeBien] || typeBien;

  return (
    <div 
      className="h-full relative overflow-hidden cursor-pointer"
      onClick={onNext}
    >
      {/* Background image */}
      {backgroundUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        </div>
      ) : (
        <div className={cn(
          "absolute inset-0",
          isLuxe 
            ? "bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900"
            : "bg-gradient-to-br from-gray-900 to-gray-800"
        )} />
      )}

      {/* Logo GARY */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <div className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-sm",
          isLuxe 
            ? "bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300" 
            : "bg-white/10 text-white"
        )}>
          {isLuxe && <Sparkles className="h-5 w-5" />}
          <span className="font-bold text-xl tracking-wide">GARY</span>
          <span className="text-white/60 text-sm">Immobilier</span>
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 z-10">
        {/* Badge type bien */}
        <Badge 
          variant="secondary" 
          className={cn(
            "mb-4 text-sm px-4 py-1",
            isLuxe 
              ? "bg-amber-500/30 text-amber-300 border-amber-500/30"
              : "bg-white/20 text-white border-white/20"
          )}
        >
          <Home className="h-4 w-4 mr-2" />
          {typeBienLabel} • {surface > 0 ? `${surface} m²` : ''}
        </Badge>

        {/* Adresse */}
        <h1 className={cn(
          "text-3xl md:text-5xl font-bold text-center text-white mb-2",
          isLuxe && "bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent"
        )}>
          {adresse || 'Votre bien'}
        </h1>

        {/* Localité */}
        <div className="flex items-center gap-2 text-white/70 text-lg mb-6">
          <MapPin className="h-5 w-5" />
          <span>{localite}</span>
        </div>

        {/* Prix */}
        <div className={cn(
          "px-8 py-4 rounded-2xl backdrop-blur-md mb-8",
          isLuxe 
            ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30"
            : "bg-white/10 border border-white/20"
        )}>
          <p className="text-white/50 text-sm text-center mb-1">Estimation</p>
          <p className={cn(
            "text-3xl md:text-4xl font-bold text-center",
            isLuxe 
              ? "bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"
              : "text-white"
          )}>
            CHF {prixFinal.toLocaleString('fr-CH')}
          </p>
        </div>
      </div>

      {/* Swipe indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-white/50 animate-bounce">
        <span className="text-sm mb-2">Swipe pour découvrir</span>
        <ChevronDown className="h-6 w-6" />
      </div>
    </div>
  );
}
