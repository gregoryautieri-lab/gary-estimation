// ============================================
// Composant Timeline Graphique
// Affichage visuel des 4 phases avec progression
// ============================================

import { cn } from '@/lib/utils';
import { format, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface Phase {
  nom: string;
  icon: string;
  duree: number;
  description: string;
  objectif: string;
  canaux: string[];
  dateDebut: Date;
  dateFin: Date;
}

interface TimelineGraphProps {
  phases: Phase[];
  dateFinEstimee: Date | null;
  isUrgent?: boolean;
  pauseRecalibrage?: number;
  typeMiseEnVente: 'offmarket' | 'comingsoon' | 'public';
}

const getPhaseStatus = (phase: Phase): 'completed' | 'active' | 'upcoming' => {
  const today = new Date();
  if (isAfter(today, phase.dateFin)) return 'completed';
  if (isBefore(today, phase.dateDebut)) return 'upcoming';
  return 'active';
};

const getProgressPercentage = (phases: Phase[]): number => {
  if (phases.length === 0) return 0;
  
  const today = new Date();
  const startDate = phases[0].dateDebut;
  const endDate = phases[phases.length - 1].dateFin;
  
  if (isBefore(today, startDate)) return 0;
  if (isAfter(today, endDate)) return 100;
  
  const totalDays = differenceInDays(endDate, startDate);
  const elapsedDays = differenceInDays(today, startDate);
  
  return Math.round((elapsedDays / totalDays) * 100);
};

const getPhaseColor = (index: number, status: 'completed' | 'active' | 'upcoming'): string => {
  const colors = [
    { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-700' },
    { bg: 'bg-primary', border: 'border-primary', text: 'text-primary' },
    { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-700' },
    { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-700' }
  ];
  
  const color = colors[index] || colors[0];
  
  if (status === 'completed') {
    return 'bg-emerald-500 border-emerald-500 text-emerald-700';
  }
  if (status === 'active') {
    return `${color.bg} ${color.border} ${color.text}`;
  }
  return 'bg-muted border-muted-foreground/30 text-muted-foreground';
};

export function TimelineGraph({ 
  phases, 
  dateFinEstimee, 
  isUrgent = false,
  pauseRecalibrage = 0,
  typeMiseEnVente
}: TimelineGraphProps) {
  if (phases.length === 0) return null;

  const progress = getProgressPercentage(phases);
  const totalWeeks = phases.reduce((sum, p) => sum + p.duree, 0);
  const dateDebut = phases[0].dateDebut;
  const dateFin = phases[phases.length - 1].dateFin;
  
  const typeLabels = {
    offmarket: { label: 'Off-Market', color: 'bg-purple-100 text-purple-700' },
    comingsoon: { label: 'Coming Soon', color: 'bg-amber-100 text-amber-700' },
    public: { label: 'Public Direct', color: 'bg-blue-100 text-blue-700' }
  };
  
  return (
    <div className="space-y-4">
      {/* Header avec infos clés */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            typeLabels[typeMiseEnVente].color
          )}>
            {typeLabels[typeMiseEnVente].label}
          </span>
          {isUrgent && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Urgent
            </span>
          )}
          {pauseRecalibrage > 0 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              +{pauseRecalibrage}s pause
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {totalWeeks} semaines au total
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        {/* Marqueurs de phases */}
        {phases.slice(0, -1).map((_, idx) => {
          const phasesBeforeWidth = phases
            .slice(0, idx + 1)
            .reduce((sum, p) => sum + p.duree, 0);
          const position = (phasesBeforeWidth / totalWeeks) * 100;
          return (
            <div 
              key={idx}
              className="absolute top-0 bottom-0 w-0.5 bg-background/50"
              style={{ left: `${position}%` }}
            />
          );
        })}
      </div>

      {/* Timeline horizontale avec phases */}
      <div className="relative py-4">
        {/* Ligne de connexion */}
        <div className="absolute top-8 left-8 right-8 h-1 bg-gradient-to-r from-slate-300 via-primary/50 to-emerald-300 rounded-full" />
        
        {/* Phases */}
        <div className="relative grid" style={{ gridTemplateColumns: phases.map(p => `${p.duree}fr`).join(' ') }}>
          {phases.map((phase, idx) => {
            const status = getPhaseStatus(phase);
            
            return (
              <div key={idx} className="flex flex-col items-center relative px-2">
                {/* Point de la timeline */}
                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-full border-3 flex items-center justify-center bg-background shadow-md",
                  status === 'completed' ? 'border-emerald-500 bg-emerald-50' : 
                  status === 'active' ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 bg-muted/50'
                )}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : status === 'active' ? (
                    <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </div>
                
                {/* Contenu phase */}
                <div className="mt-3 text-center w-full">
                  <p className="text-2xl mb-1">{phase.icon}</p>
                  <p className={cn(
                    "text-xs font-bold leading-tight",
                    status === 'completed' ? 'text-emerald-600' :
                    status === 'active' ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {phase.nom}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                    {phase.duree} sem.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(phase.dateDebut, 'd MMM', { locale: fr })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dates de début et fin */}
      <div className="flex justify-between items-center pt-2 border-t border-dashed">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Début:</span>
          <span className="font-medium">{format(dateDebut, 'd MMMM yyyy', { locale: fr })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-emerald-600" />
          <span className="text-muted-foreground">Fin estimée:</span>
          <span className="font-medium text-emerald-600">
            {dateFinEstimee ? format(dateFinEstimee, 'd MMMM yyyy', { locale: fr }) : format(dateFin, 'd MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Message progression */}
      {progress > 0 && progress < 100 && (
        <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded-lg py-2">
          📊 Progression: {progress}% de la timeline écoulée
        </div>
      )}
    </div>
  );
}
