// ============================================
// Timeline Visuelle Mode Présentation
// ============================================

import React from 'react';
import { Clock, CheckCircle2, Circle, ArrowRight, Sparkles, Lock, Megaphone, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TypeMiseEnVente } from '@/types/estimation';
import { format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Phase {
  nom: string;
  icon: React.ReactNode;
  duree: string;
  dateDebut: Date;
  dateFin: Date;
}

interface PresentationTimelineProps {
  phases: Phase[];
  typeMiseEnVente: TypeMiseEnVente;
  capitalVisibilite: {
    value?: number;
    label: string;
    color: string;
  };
  isLuxe?: boolean;
}
    label: string;
    color: string;
  };
  isLuxe?: boolean;
}

const TYPE_LABELS: Record<TypeMiseEnVente, { label: string; icon: React.ReactNode; description: string }> = {
  offmarket: { 
    label: 'Off-Market', 
    icon: <Lock className="h-5 w-5" />,
    description: 'Vente confidentielle auprès de notre réseau exclusif'
  },
  comingsoon: { 
    label: 'Coming Soon', 
    icon: <Megaphone className="h-5 w-5" />,
    description: 'Création d\'attente avant mise en ligne publique'
  },
  public: { 
    label: 'Public', 
    icon: <Globe className="h-5 w-5" />,
    description: 'Visibilité maximale sur tous les portails'
  }
};

const getPhaseStatus = (phase: Phase): 'completed' | 'active' | 'upcoming' => {
  const now = new Date();
  if (isBefore(phase.dateFin, now)) return 'completed';
  if (isAfter(phase.dateDebut, now)) return 'upcoming';
  return 'active';
};

export function PresentationTimeline({ 
  phases, 
  typeMiseEnVente,
  capitalVisibilite,
  isLuxe = false 
}: PresentationTimelineProps) {
  const typeInfo = TYPE_LABELS[typeMiseEnVente];
  const dateDebut = phases[0]?.dateDebut;
  const dateFin = phases[phases.length - 1]?.dateFin;

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header stratégie */}
        <div className="text-center space-y-4">
          <div className={cn(
            "inline-flex items-center gap-3 px-6 py-3 rounded-2xl",
            isLuxe 
              ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300" 
              : "bg-primary/20 text-primary"
          )}>
            {typeInfo.icon}
            <span className="text-xl font-bold">{typeInfo.label}</span>
          </div>
          <p className="text-white/70 text-lg">{typeInfo.description}</p>
        </div>

        {/* Capital Visibilité */}
        <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-white/60 text-sm font-medium mb-3">Capital Visibilité</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  isLuxe ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-primary to-primary/60"
                )}
                style={{ width: `${capitalVisibilite.value}%` }}
              />
            </div>
            <span className={cn(
              "text-2xl font-bold",
              isLuxe ? "text-amber-400" : "text-primary"
            )}>
              {capitalVisibilite.value}%
            </span>
          </div>
          <p className="text-white/50 text-sm mt-2">{capitalVisibilite.label}</p>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendrier de vente
          </h3>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/20" />

            {/* Phases */}
            <div className="space-y-6">
              {phases.map((phase, idx) => {
                const status = getPhaseStatus(phase);
                
                return (
                  <div key={idx} className="relative flex gap-4 pl-4">
                    {/* Indicateur */}
                    <div className={cn(
                      "relative z-10 flex items-center justify-center h-12 w-12 rounded-full shrink-0 transition-all",
                      status === 'completed' && "bg-emerald-500 text-white",
                      status === 'active' && (isLuxe ? "bg-amber-500 text-white animate-pulse" : "bg-primary text-white animate-pulse"),
                      status === 'upcoming' && "bg-white/10 text-white/60"
                    )}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <span className="text-lg">{phase.icon}</span>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className={cn(
                      "flex-1 bg-white/5 rounded-xl p-4 backdrop-blur-sm transition-all",
                      status === 'active' && "bg-white/10 ring-2",
                      status === 'active' && (isLuxe ? "ring-amber-500/50" : "ring-primary/50")
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={cn(
                          "font-semibold text-lg",
                          status === 'completed' && "text-emerald-400",
                          status === 'active' && (isLuxe ? "text-amber-400" : "text-primary"),
                          status === 'upcoming' && "text-white/60"
                        )}>
                          {phase.nom}
                        </h4>
                        <Badge variant="secondary" className="bg-white/10 text-white/80 border-0">
                          {phase.duree}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <span>{format(phase.dateDebut, 'd MMM', { locale: fr })}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{format(phase.dateFin, 'd MMM yyyy', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dates récap */}
        {dateDebut && dateFin && (
          <div className="flex justify-between bg-white/5 rounded-xl p-4 backdrop-blur-sm">
            <div>
              <p className="text-white/50 text-sm">Début</p>
              <p className="text-white font-semibold">
                {format(dateDebut, 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-sm">Fin estimée</p>
              <p className={cn(
                "font-semibold",
                isLuxe ? "text-amber-400" : "text-primary"
              )}>
                {format(dateFin, 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
