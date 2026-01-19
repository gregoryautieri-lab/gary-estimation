// ============================================
// Écran 4 : État du bien et ses atouts
// Jauges visuelles + Points forts/faibles + Impression générale
// ============================================

import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Star, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AnalyseTerrain, Caracteristiques } from '@/types/estimation';

interface PresentationConditionProps {
  analyseTerrain: AnalyseTerrain;
  caracteristiques: Caracteristiques;
  isLuxe?: boolean;
}

// Configuration des jauges d'état
const ETAT_ITEMS = [
  { key: 'etatCuisine', label: 'Cuisine' },
  { key: 'etatSDB', label: 'Salles de bain' },
  { key: 'etatSols', label: 'Sols' },
  { key: 'etatMurs', label: 'Murs / Peinture' },
  { key: 'etatMenuiseries', label: 'Menuiseries' },
  { key: 'etatElectricite', label: 'Électricité' },
  { key: 'etatPlomberie', label: 'Plomberie' },
  { key: 'etatIsolation', label: 'Isolation' },
] as const;

// Composant jauge visuelle (ronds pleins/vides)
function RatingGauge({ value, max = 5, isLuxe }: { value: number; max?: number; isLuxe: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition-colors",
            i < value
              ? isLuxe ? "bg-amber-400" : "bg-primary"
              : "bg-white/20"
          )}
        />
      ))}
      <span className="text-white/40 text-xs ml-2">({value}/{max})</span>
    </div>
  );
}

// Composant chip pour points forts/faibles
function Chip({ 
  label, 
  variant 
}: { 
  label: string; 
  variant: 'success' | 'warning' 
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
        variant === 'success' 
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
      )}
    >
      {label}
    </span>
  );
}

export function PresentationCondition({
  analyseTerrain,
  caracteristiques,
  isLuxe = false
}: PresentationConditionProps) {
  // Toggle pour masquer les points d'attention
  const [showPointsFaibles, setShowPointsFaibles] = useState(true);

  // Filtrer les jauges avec une valeur
  const etatItems = ETAT_ITEMS.filter(item => {
    const value = analyseTerrain[item.key as keyof AnalyseTerrain];
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    return typeof numValue === 'number' && numValue >= 1;
  }).map(item => {
    const value = analyseTerrain[item.key as keyof AnalyseTerrain];
    return {
      ...item,
      value: typeof value === 'string' ? parseInt(value, 10) : (value as number) || 0
    };
  });

  // Points forts (tableau + custom)
  const pointsForts = [
    ...(analyseTerrain.pointsForts || []),
    ...(analyseTerrain.pointFortCustom ? [analyseTerrain.pointFortCustom] : [])
  ].filter(Boolean);

  // Points faibles (tableau + custom)
  const pointsFaibles = [
    ...(analyseTerrain.pointsFaibles || []),
    ...(analyseTerrain.pointFaibleCustom ? [analyseTerrain.pointFaibleCustom] : [])
  ].filter(Boolean);

  // Rénovations récentes
  const travauxRecents = caracteristiques.travauxRecents || [];

  // Impression générale
  const impressionGenerale = analyseTerrain.impressionGenerale || 0;
  const notesLibres = analyseTerrain.notesLibres || '';

  return (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{ backgroundColor: '#1a2e35' }}
    >
      {/* Header avec titre */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className={cn(
          "text-2xl font-bold mb-1",
          isLuxe ? "text-amber-300" : "text-white"
        )}>
          État du bien
        </h1>
        <p className="text-white/50 text-sm">
          Observations lors de la visite
        </p>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-auto px-6 pb-6 space-y-6">
        
        {/* 1. Jauges d'état (grille 2 colonnes) */}
        {etatItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide">
              Notes de visite
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {etatItems.map(item => (
                <div 
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <span className="text-white/80 text-sm">{item.label}</span>
                  <RatingGauge value={item.value} isLuxe={isLuxe} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Points forts (chips vertes) */}
        {pointsForts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className={cn("h-4 w-4", isLuxe ? "text-amber-400" : "text-emerald-400")} />
              <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide">
                Points forts
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {pointsForts.map((point, idx) => (
                <Chip key={idx} label={point} variant="success" />
              ))}
            </div>
          </div>
        )}

        {/* 3. Points d'attention (chips oranges) avec toggle */}
        {pointsFaibles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide">
                  Points d'attention
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white hover:bg-white/10 h-8 px-2"
                onClick={() => setShowPointsFaibles(!showPointsFaibles)}
              >
                {showPointsFaibles ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" />
                    <span className="text-xs">Masquer</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" />
                    <span className="text-xs">Afficher</span>
                  </>
                )}
              </Button>
            </div>
            {showPointsFaibles && (
              <div className="flex flex-wrap gap-2">
                {pointsFaibles.map((point, idx) => (
                  <Chip key={idx} label={point} variant="warning" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Rénovations récentes */}
        {travauxRecents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className={cn("h-4 w-4", isLuxe ? "text-amber-400" : "text-primary")} />
              <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide">
                Rénovations récentes
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {travauxRecents.map((travail, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-white/10 text-white/70 border border-white/10"
                >
                  {travail}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5. Impression générale */}
        {impressionGenerale > 0 && (
          <div className={cn(
            "p-4 rounded-xl",
            isLuxe 
              ? "bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20"
              : "bg-white/5 border border-white/10"
          )}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide">
                Impression générale
              </h2>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5 transition-colors",
                      i < impressionGenerale
                        ? isLuxe ? "text-amber-400 fill-amber-400" : "text-primary fill-primary"
                        : "text-white/20"
                    )}
                  />
                ))}
                <span className={cn(
                  "ml-2 text-lg font-bold",
                  isLuxe ? "text-amber-300" : "text-white"
                )}>
                  {impressionGenerale}/5
                </span>
              </div>
            </div>
            {notesLibres && (
              <p className="text-white/70 text-sm leading-relaxed">
                {notesLibres}
              </p>
            )}
          </div>
        )}

        {/* Message si aucune donnée */}
        {etatItems.length === 0 && pointsForts.length === 0 && impressionGenerale === 0 && (
          <div className={cn(
            "p-6 rounded-xl text-center",
            isLuxe 
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-white/5 border border-white/10"
          )}>
            <p className="text-white/50">
              Aucune observation terrain renseignée
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}
