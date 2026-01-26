// ============================================
// Écran 1 : Couverture du Bien
// Impact visuel immédiat, fond sombre sans photo
// ============================================

import React from 'react';
import { ChevronRight, Home, BedDouble, Maximize, Layers, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Caracteristiques, Identification } from '@/types/estimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PresentationCoverProps {
  identification: Identification;
  caracteristiques: Caracteristiques;
  isLuxe?: boolean;
  onNext: () => void;
  courtierNom?: string;
}

// Labels lisibles pour les sous-types (clés = valeurs stockées en DB)
const SOUS_TYPE_LABELS: Record<string, string> = {
  // Appartements
  standard: 'Appartement',
  duplex: 'Duplex',
  attique: 'Attique',
  loft: 'Loft',
  studio: 'Studio',
  penthouse: 'Penthouse',
  rez_jardin: 'Rez-de-jardin',
  hotel_particulier: 'Hôtel particulier',
  // Maisons - clés exactes du formulaire Module2
  villa: 'Villa individuelle',
  villa_mitoyenne: 'Villa mitoyenne',
  villa_jumelee: 'Villa jumelée',
  chalet: 'Chalet',
  fermette: 'Fermette',
  maison_village: 'Maison de village',
};

// Fallback par type de bien
const TYPE_BIEN_FALLBACK: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Villa',
  terrain: 'Terrain',
  immeuble: 'Immeuble',
  commercial: 'Local commercial'
};

export function PresentationCover({
  identification,
  caracteristiques,
  isLuxe = false,
  onNext,
  courtierNom
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
  
  // Label du type de bien : sous-type exact ou fallback
  const typeLabel = sousType && SOUS_TYPE_LABELS[sousType] 
    ? SOUS_TYPE_LABELS[sousType] 
    : TYPE_BIEN_FALLBACK[typeBien] || 'Bien immobilier';
  
  // Date du jour
  const dateEstimation = format(new Date(), "d MMMM yyyy", { locale: fr });
  
  // Surface terrain pour maisons
  const surfaceTerrainRaw = caracteristiques?.surfaceTerrain;
  const surfaceTerrain = typeof surfaceTerrainRaw === 'number' ? surfaceTerrainRaw : parseFloat(String(surfaceTerrainRaw || '0'));

  // 4ème métrique : Étage pour appartements, Terrain pour maisons
  const isMaison = typeBien === 'maison' || typeBien === 'terrain';
  
  const fourthMetric = isMaison
    ? {
        icon: TreePine,
        value: surfaceTerrain > 0 ? `${surfaceTerrain}` : '-',
        unit: 'm²',
        label: 'Terrain'
      }
    : {
        icon: Layers,
        value: getEtageLabel(),
        unit: '',
        label: 'Étage'
      };

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
    fourthMetric
  ];

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center px-6 cursor-pointer relative"
      style={{ backgroundColor: '#1a2e35' }}
      onClick={onNext}
    >
      {/* Logo GARY - position absolue en haut à gauche */}
      <div className="absolute top-6 left-6 z-20">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">GARY</span>
        </div>
      </div>

      {/* Badge Type de Bien - sous-type exact */}
      <div className="mb-8">
        <span 
          className={cn(
            "text-xs tracking-[0.25em] uppercase font-medium",
            isLuxe ? "text-amber-400" : "text-white/60"
          )}
        >
          {typeLabel}
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
      
      {/* Nom du courtier */}
      {courtierNom && (
        <div className="absolute bottom-20 left-0 right-0 text-center z-20">
          <p className="text-white/60 text-sm">Votre conseiller</p>
          <p className="text-white font-semibold text-lg">{courtierNom}</p>
        </div>
      )}
      
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
