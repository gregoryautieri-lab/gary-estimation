// ============================================
// Écran 4 : État du bien et ses atouts
// Jauges visuelles + Points forts/faibles formatés + Impression générale
// ============================================

import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Star, Wrench, AlertTriangle, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AnalyseTerrain, Caracteristiques } from '@/types/estimation';

interface PresentationConditionProps {
  analyseTerrain: AnalyseTerrain;
  caracteristiques: Caracteristiques;
  isLuxe?: boolean;
}

// ============================================
// Mapping des tags vers labels français lisibles
// ============================================

const TAGS_LABELS: Record<string, string> = {
  // Points forts
  lumineux: 'Lumineux',
  luminosite: 'Lumineux',
  renove_recemment: 'Rénové récemment',
  beaux_volumes: 'Beaux volumes',
  calme: 'Calme',
  vue: 'Belle vue',
  vue_lac: 'Vue lac',
  vue_montagne: 'Vue montagne',
  vue_degagee: 'Vue dégagée',
  jardin: 'Jardin',
  terrasse: 'Terrasse',
  balcon: 'Balcon',
  parking: 'Parking',
  garage: 'Garage',
  cave: 'Cave',
  emplacement: 'Bon emplacement',
  transports: 'Proche transports',
  ecoles: 'Proche écoles',
  commerces: 'Proche commerces',
  standing: 'Standing',
  charme: 'Charme',
  cachet: 'Cachet',
  moderne: 'Moderne',
  fonctionnel: 'Fonctionnel',
  bien_entretenu: 'Bien entretenu',
  piscine: 'Piscine',
  ascenseur: 'Ascenseur',
  securise: 'Sécurisé',
  
  // Points faibles / attention
  travaux_a_prevoir: 'Travaux à prévoir',
  rafraichissement: 'Rafraîchissement conseillé',
  nuisances: 'Nuisances potentielles',
  vis_a_vis: 'Vis-à-vis',
  etage_bas: 'Étage bas',
  sans_ascenseur: 'Sans ascenseur',
  charges_elevees: 'Charges élevées',
  ancien: 'Construction ancienne',
  sombre: 'Manque de luminosité',
  petit: 'Surface limitée',
  bruyant: 'Nuisances sonores',
};

// Mapping pour les rénovations
const RENOVATIONS_LABELS: Record<string, string> = {
  structure: 'Structure',
  technique: 'Installations techniques',
  cuisine: 'Cuisine',
  salles_eau: 'Salles d\'eau',
  menuiseries: 'Menuiseries',
  finitions: 'Finitions',
  toiture: 'Toiture',
  facade: 'Façade',
  chauffage: 'Chauffage',
  electricite: 'Électricité',
  plomberie: 'Plomberie',
  isolation: 'Isolation',
};

// Fonction pour formater un tag
function formatTag(tag: string): string {
  // Vérifier d'abord dans le mapping
  if (TAGS_LABELS[tag]) return TAGS_LABELS[tag];
  if (RENOVATIONS_LABELS[tag]) return RENOVATIONS_LABELS[tag];
  
  // Fallback : transformer snake_case en texte lisible
  return tag
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
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

  // Rénovations récentes (depuis caracteristiques.typeRenovation)
  const travauxRecents = caracteristiques.travauxRecents || [];
  const typeRenovation = caracteristiques.typeRenovation || [];
  const allRenovations = [...new Set([...travauxRecents, ...typeRenovation])];

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
        
        {/* 1. Impression générale en haut */}
        {impressionGenerale > 0 && (
          <div className={cn(
            "p-4 rounded-xl",
            isLuxe 
              ? "bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20"
              : "bg-white/5 border border-white/10"
          )}>
            <div className="flex items-center justify-between">
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
          </div>
        )}

        {/* 2. Jauges d'état (grille 2 colonnes) */}
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

        {/* 3. Points forts (badges verts) */}
        {pointsForts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-400" />
              <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide">
                Points forts
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {pointsForts.map((point, idx) => (
                <Badge 
                  key={idx}
                  className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
                >
                  {formatTag(point)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 4. Points d'attention (badges oranges) avec toggle */}
        {pointsFaibles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
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
                  <Badge 
                    key={idx}
                    className="bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
                  >
                    {formatTag(point)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Rénovations récentes */}
        {allRenovations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className={cn("h-4 w-4", isLuxe ? "text-amber-400" : "text-primary")} />
              <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide">
                Rénovations récentes
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allRenovations.map((travail, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-white/5 text-white/70 border-white/20 hover:bg-white/10"
                >
                  {formatTag(travail)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 6. Note du courtier (notesLibres) */}
        {notesLibres && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-white/70 text-sm italic leading-relaxed">
              {notesLibres}
            </p>
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
