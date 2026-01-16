// ============================================
// Caractéristiques du Bien Mode Présentation
// ============================================

import React from 'react';
import { Home, BedDouble, Bath, Layers, Compass, Star, CheckCircle2, Maximize } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Photo, Caracteristiques } from '@/types/estimation';

interface PresentationCharacteristicsProps {
  photos: Photo[];
  caracteristiques: Caracteristiques;
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

const EXPOSITION_LABELS: Record<string, string> = {
  nord: 'Nord',
  sud: 'Sud',
  est: 'Est',
  ouest: 'Ouest',
  'nord-est': 'Nord-Est',
  'nord-ouest': 'Nord-Ouest',
  'sud-est': 'Sud-Est',
  'sud-ouest': 'Sud-Ouest'
};

export function PresentationCharacteristics({
  photos,
  caracteristiques,
  pointsForts,
  isLuxe = false
}: PresentationCharacteristicsProps) {
  const typeBien = caracteristiques?.typeBien || 'appartement';
  const typeBienLabel = TYPE_BIEN_LABELS[typeBien] || typeBien;
  
  // Calcul des surfaces selon le type
  const surfaceRaw = typeBien === 'maison'
    ? caracteristiques?.surfaceHabitableMaison
    : caracteristiques?.surfacePPE;
  const surface = typeof surfaceRaw === 'number' ? surfaceRaw : parseFloat(String(surfaceRaw || '0'));
  
  const nbPiecesRaw = caracteristiques?.nombrePieces;
  const nbPieces = typeof nbPiecesRaw === 'number' ? nbPiecesRaw : parseFloat(String(nbPiecesRaw || '0'));
  
  const nbChambresRaw = caracteristiques?.nombreChambres;
  const nbChambres = typeof nbChambresRaw === 'number' ? nbChambresRaw : parseFloat(String(nbChambresRaw || '0'));
  
  const nbSdbRaw = caracteristiques?.nombreSDB;
  const nbSdb = typeof nbSdbRaw === 'number' ? nbSdbRaw : parseFloat(String(nbSdbRaw || '0'));
  
  const etageRaw = caracteristiques?.etage;
  const etage = etageRaw ? (typeof etageRaw === 'number' ? etageRaw : parseInt(String(etageRaw), 10)) : null;
  
  const exposition = caracteristiques?.exposition;
  const expositionLabel = Array.isArray(exposition) && exposition.length > 0 
    ? exposition.map(e => EXPOSITION_LABELS[e] || e).join(', ')
    : null;
  
  const anneeConstruction = caracteristiques?.anneeConstruction;

  // Photo principale pour le fond
  const coverPhoto = photos.find(p => p.favori) || photos[0];

  const specs = [
    { icon: <Maximize className="h-5 w-5" />, label: 'Surface', value: surface > 0 ? `${surface} m²` : null },
    { icon: <Home className="h-5 w-5" />, label: 'Pièces', value: nbPieces > 0 ? `${nbPieces} pièces` : null },
    { icon: <BedDouble className="h-5 w-5" />, label: 'Chambres', value: nbChambres > 0 ? `${nbChambres}` : null },
    { icon: <Bath className="h-5 w-5" />, label: 'Salles de bain', value: nbSdb > 0 ? `${nbSdb}` : null },
    { icon: <Layers className="h-5 w-5" />, label: 'Étage', value: etage !== null && !isNaN(etage) ? (etage === 0 ? 'RDC' : `${etage}ème`) : null },
    { icon: <Compass className="h-5 w-5" />, label: 'Exposition', value: expositionLabel }
  ].filter(s => s.value);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Photo section */}
      <div className="h-1/2 lg:h-full lg:w-1/2 relative">
        {coverPhoto ? (
          <img
            src={coverPhoto.storageUrl || coverPhoto.dataUrl}
            alt="Photo du bien"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={cn(
            "absolute inset-0",
            isLuxe 
              ? "bg-gradient-to-br from-gray-800 to-amber-900/30"
              : "bg-gradient-to-br from-gray-800 to-gray-700"
          )} />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/80 hidden lg:block" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/80 lg:hidden" />
      </div>

      {/* Info section */}
      <div className="h-1/2 lg:h-full lg:w-1/2 bg-gray-900 p-6 md:p-8 overflow-auto flex flex-col justify-center">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-sm",
                isLuxe 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-primary/20 text-primary border-primary/30"
              )}
            >
              {typeBienLabel}
            </Badge>
            {anneeConstruction && (
              <p className="text-white/50 text-sm">Construit en {anneeConstruction}</p>
            )}
          </div>

          {/* Caractéristiques grid */}
          <div className="grid grid-cols-2 gap-4">
            {specs.map((spec, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl",
                  isLuxe 
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-white/5 border border-white/10"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  isLuxe ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                )}>
                  {spec.icon}
                </div>
                <div>
                  <p className="text-white/50 text-xs">{spec.label}</p>
                  <p className="text-white font-semibold">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Points forts */}
          {pointsForts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Star className={cn("h-5 w-5", isLuxe ? "text-amber-400" : "text-primary")} />
                Points forts
              </h3>
              <div className="flex flex-wrap gap-2">
                {pointsForts.slice(0, 5).map((point, idx) => (
                  <Badge 
                    key={idx}
                    variant="secondary"
                    className={cn(
                      "text-sm py-1 px-3",
                      isLuxe
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        : "bg-white/10 text-white border-white/20"
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {point}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
