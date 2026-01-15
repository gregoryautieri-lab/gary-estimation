// ============================================
// Composant Jauge Capital-Visibilité Avancée
// Avec logique d'épuisement dynamique
// ============================================

import { cn } from '@/lib/utils';
import { AlertTriangle, Eye, EyeOff, TrendingDown, RefreshCw, Calendar, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CapitalGaugeAdvancedProps {
  pourcentage: number;
  label: 'intact' | 'entame' | 'faible';
  color: 'green' | 'yellow' | 'red';
  pauseRecalibrage: number;
  message: string;
  // Nouvelles props pour l'épuisement dynamique
  historiqueDiffusion?: {
    dejaDiffuse: boolean;
    duree?: string;
    typeDiffusion?: string;
    dateRetrait?: string;
  };
  onRecalibrageClick?: () => void;
}

// Fonction pour calculer l'épuisement depuis la date de retrait
const getEpuisementDepuisRetrait = (dateRetrait?: string): { joursSansExposition: number; recuperation: number } => {
  if (!dateRetrait) return { joursSansExposition: 0, recuperation: 0 };
  
  const retrait = new Date(dateRetrait);
  const maintenant = new Date();
  const joursSansExposition = Math.floor((maintenant.getTime() - retrait.getTime()) / (1000 * 60 * 60 * 24));
  
  // Récupération: 2% par semaine sans exposition, max 20%
  const semainesSansExposition = Math.floor(joursSansExposition / 7);
  const recuperation = Math.min(20, semainesSansExposition * 2);
  
  return { joursSansExposition, recuperation };
};

const CONFIG: Record<string, { 
  label: string; 
  labelLong: string;
  icon: React.ReactNode;
  description: string;
  bgClass: string;
  textClass: string;
  progressClass: string;
  gradient: string;
  recommandations: string[];
}> = {
  green: {
    label: 'Capital intact',
    labelLong: 'Capital-visibilité intact',
    icon: <Eye className="h-5 w-5" />,
    description: "Le bien n'a pas été exposé récemment. Toutes les stratégies sont possibles.",
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    progressClass: '[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400',
    gradient: 'from-emerald-500 to-emerald-400',
    recommandations: [
      '✅ Off-market premium recommandé',
      '✅ Coming soon avec teasing possible',
      '✅ Prix ambitieux envisageable'
    ]
  },
  yellow: {
    label: 'Capital entamé',
    labelLong: 'Capital-visibilité partiellement entamé',
    icon: <TrendingDown className="h-5 w-5" />,
    description: "Le bien a déjà été vu par une partie du marché. Stratégie adaptée nécessaire.",
    bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-600 dark:text-amber-400',
    progressClass: '[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-400',
    gradient: 'from-amber-500 to-amber-400',
    recommandations: [
      '⚠️ Pause recalibrage recommandée',
      '⚠️ Rafraîchir visuels avant relance',
      '⚠️ Considérer ajustement prix'
    ]
  },
  red: {
    label: 'Capital faible',
    labelLong: 'Capital-visibilité épuisé',
    icon: <EyeOff className="h-5 w-5" />,
    description: "Le bien a été longuement exposé. Repositionnement obligatoire.",
    bgClass: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    textClass: 'text-red-600 dark:text-red-400',
    progressClass: '[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-red-400',
    gradient: 'from-red-500 to-red-400',
    recommandations: [
      '🔴 Pause recalibrage obligatoire',
      '🔴 Nouveaux visuels indispensables',
      '🔴 Repositionnement prix nécessaire',
      '🔴 Nouvelle approche marketing'
    ]
  }
};

export function CapitalGaugeAdvanced({ 
  pourcentage, 
  label, 
  color, 
  pauseRecalibrage,
  message,
  historiqueDiffusion,
  onRecalibrageClick
}: CapitalGaugeAdvancedProps) {
  const config = CONFIG[color];
  const { joursSansExposition, recuperation } = getEpuisementDepuisRetrait(historiqueDiffusion?.dateRetrait);
  
  // Pourcentage effectif avec récupération
  const pourcentageEffectif = Math.min(100, pourcentage + recuperation);
  
  return (
    <div className="space-y-4">
      {/* Card principale */}
      <div className={cn(
        "rounded-xl border-2 overflow-hidden",
        config.bgClass
      )}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={config.textClass}>{config.icon}</span>
              <div>
                <h4 className={cn("font-semibold", config.textClass)}>
                  {config.label}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={cn("text-3xl font-bold", config.textClass)}>
                {pourcentageEffectif}%
              </span>
              {recuperation > 0 && (
                <p className="text-xs text-emerald-600">
                  +{recuperation}% récupéré
                </p>
              )}
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="relative">
            <Progress 
              value={pourcentageEffectif} 
              className={cn("h-4 bg-white/50 dark:bg-black/20", config.progressClass)}
            />
            {/* Marqueurs de seuils */}
            <div className="absolute top-0 left-[40%] w-px h-4 bg-amber-400/50" />
            <div className="absolute top-0 left-[70%] w-px h-4 bg-emerald-400/50" />
          </div>
          
          {/* Légende seuils */}
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Faible</span>
            <span className="ml-[35%]">Entamé</span>
            <span>Intact</span>
          </div>
        </div>
        
        {/* Info récupération */}
        {joursSansExposition > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
              <Calendar className="h-3 w-3" />
              <span>
                {joursSansExposition} jours sans exposition 
                {recuperation > 0 && ` → +${recuperation}% récupéré`}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">
                      Le capital-visibilité se régénère à raison de 2% par semaine sans exposition, 
                      jusqu'à un maximum de 20%.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
        
        {/* Recommandations */}
        <div className="px-4 pb-4">
          <div className="space-y-1">
            {config.recommandations.map((rec, idx) => (
              <p key={idx} className="text-xs">
                {rec}
              </p>
            ))}
          </div>
        </div>
      </div>
      
      {/* Alerte pause recalibrage */}
      {pauseRecalibrage > 0 && (
        <div className={cn(
          "flex items-start gap-3 p-4 rounded-xl border",
          color === 'red' 
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" 
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
        )}>
          <AlertTriangle className={cn(
            "h-5 w-5 mt-0.5 shrink-0",
            color === 'red' ? "text-red-500" : "text-amber-500"
          )} />
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              color === 'red' ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
            )}>
              Pause de recalibrage : {pauseRecalibrage} semaine{pauseRecalibrage > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cette pause est intégrée à la Phase 0 et permet de repositionner le bien 
              avec une nouvelle stratégie avant de le remettre sur le marché.
            </p>
            
            {/* Actions recommandées pendant la pause */}
            <div className="mt-3 space-y-1 text-xs">
              <p className="font-medium text-muted-foreground">Pendant cette pause :</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                <li>Nouvelles photos professionnelles</li>
                <li>Vidéo immersive / visite virtuelle</li>
                <li>Home staging si nécessaire</li>
                <li>Révision du prix si besoin</li>
              </ul>
            </div>
            
            {onRecalibrageClick && (
              <button
                onClick={onRecalibrageClick}
                className={cn(
                  "mt-3 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                  color === 'red' 
                    ? "bg-red-100 hover:bg-red-200 text-red-700" 
                    : "bg-amber-100 hover:bg-amber-200 text-amber-700"
                )}
              >
                <RefreshCw className="h-3 w-3" />
                Planifier le recalibrage
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Message contextuel */}
      {message && (
        <p className="text-xs text-muted-foreground text-center italic">
          {message}
        </p>
      )}
    </div>
  );
}
