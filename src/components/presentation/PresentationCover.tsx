// ============================================
// Écran 1 : Couverture du Bien
// Impact visuel immédiat, fond sombre sans photo
// ============================================

import React from 'react';
import { ChevronRight, Home, BedDouble, Maximize, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Caracteristiques, Identification } from '@/types/estimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PresentationCoverProps {
  identification: Identification;
  caracteristiques: Caracteristiques;
  isLuxe?: boolean;
  onNext: () => void;
}

// Labels pour les types de bien
const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'APPARTEMENT',
  maison: 'MAISON',
  terrain: 'TERRAIN',
  immeuble: 'IMMEUBLE',
  commercial: 'COMMERCIAL'
};

// Labels pour les sous-types
const SOUS_TYPE_LABELS: Record<string, string> = {
  standard: 'STANDARD',
  duplex: 'DUPLEX',
  attique: 'ATTIQUE',
  loft: 'LOFT',
  studio: 'STUDIO',
  villa: 'VILLA',
  villa_individuelle: 'VILLA INDIVIDUELLE',
  villa_mitoyenne: 'VILLA MITOYENNE',
  villa_jumelle: 'VILLA JUMELLE',
  ferme: 'FERME',
  chalet: 'CHALET'
};

export function PresentationCover({
  identification,
  caracteristiques,
  isLuxe = false,
  onNext
}: PresentationCoverProps) {
  // Extraire les données
  const typeBien = caracteristiques?.typeBien || 'appartement';
  const sousType = caracteristiques?.sousType || '';
  const rue = identification?.adresse?.rue || 'Adresse non renseignée';
  const codePostal = identification?.adresse?.codePostal || '';
  const localite = identification?.adresse?.localite || '';
  
  // Surface selon le type
  const surfaceRaw = typeBien === 'maison' 
    ? caracteristiques?.surfaceHabitableMaison 
    : caracteristiques?.surfacePPE;
  const surfaceValue = typeof surfaceRaw === 'number' ? surfaceRaw : parseFloat(String(surfaceRaw || '0'));
  
  // Métriques
  const nombrePiecesRaw = caracteristiques?.nombrePieces;
  const nombrePieces = typeof nombrePiecesRaw === 'number' ? nombrePiecesRaw : parseFloat(String(nombrePiecesRaw || '0'));
  
  const nombreChambresRaw = caracteristiques?.nombreChambres;
  const nombreChambres = typeof nombreChambresRaw === 'number' ? nombreChambresRaw : parseFloat(String(nombreChambresRaw || '0'));
  
  const etageRaw = caracteristiques?.etage;
  const etage = typeof etageRaw === 'number' ? etageRaw : (etageRaw ? parseFloat(String(etageRaw)) : null);
  
  // Formatage étage
  const getEtageLabel = () => {
    if (typeBien === 'maison' || typeBien === 'terrain') return 'Terrain';
    if (etage === 0) return 'RDC';
    if (etage === undefined || etage === null || isNaN(etage)) return '-';
    return `${etage}e`;
  };
  
  // Badge type
  const typeBienLabel = TYPE_BIEN_LABELS[typeBien] || typeBien.toUpperCase();
  const sousTypeLabel = sousType ? SOUS_TYPE_LABELS[sousType] || sousType.toUpperCase() : '';
  const badgeText = sousTypeLabel ? `${typeBienLabel} • ${sousTypeLabel}` : typeBienLabel;
  
  // Date du jour
  const dateEstimation = format(new Date(), "d MMMM yyyy", { locale: fr });
  
  // Métriques cards
  const metrics = [
    {
      icon: Maximize,
      value: surfaceValue > 0 ? `${surfaceValue}` : '-',
      unit: 'm²',
      label: 'Surface'
    },
    {
      icon: Home,
      value: nombrePieces > 0 ? `${nombrePieces}` : '-',
      unit: 'pcs',
      label: 'Pièces'
    },
    {
      icon: BedDouble,
      value: nombreChambres > 0 ? `${nombreChambres}` : '-',
      unit: '',
      label: 'Chambres'
    },
    {
      icon: Layers,
      value: getEtageLabel(),
      unit: '',
      label: 'Étage'
    }
  ];

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center px-6 cursor-pointer"
      style={{ backgroundColor: '#1a2e35' }}
      onClick={onNext}
    >
      {/* Badge Type de Bien */}
      <div className="mb-8">
        <span 
          className={cn(
            "text-xs tracking-[0.25em] uppercase font-medium",
            isLuxe ? "text-amber-400" : "text-white/60"
          )}
        >
          {badgeText}
        </span>
      </div>
      
      {/* Adresse Principale */}
      <div className="text-center mb-10">
        <h1 
          className={cn(
            "text-3xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight",
            isLuxe 
              ? "bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent" 
              : "text-white"
          )}
        >
          {rue}
        </h1>
        <p className="text-lg md:text-xl text-white/50">
          {codePostal} {localite}
        </p>
      </div>
      
      {/* Métriques Hero - 4 Cards */}
      <div className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-lg mb-12">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className={cn(
              "flex flex-col items-center justify-center py-4 px-2 rounded-xl",
              isLuxe 
                ? "bg-amber-500/10 border border-amber-500/20" 
                : "bg-white/5 border border-white/10"
            )}
          >
            <metric.icon 
              className={cn(
                "h-5 w-5 mb-2",
                isLuxe ? "text-amber-400" : "text-white/40"
              )} 
            />
            <div className="flex items-baseline gap-0.5">
              <span 
                className={cn(
                  "text-xl md:text-2xl font-bold",
                  isLuxe ? "text-amber-300" : "text-white"
                )}
              >
                {metric.value}
              </span>
              {metric.unit && (
                <span className="text-xs text-white/40">{metric.unit}</span>
              )}
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-wide mt-1">
              {metric.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Date Estimation */}
      <p className="text-sm text-white/30 mb-8">
        Estimation du {dateEstimation}
      </p>
      
      {/* Indicateur Navigation */}
      <div 
        className={cn(
          "absolute bottom-8 right-8 flex items-center gap-2 text-sm",
          isLuxe ? "text-amber-400" : "text-white/50"
        )}
      >
        <span>Découvrir</span>
        <ChevronRight className="h-5 w-5 animate-pulse" />
      </div>
    </div>
  );
}
