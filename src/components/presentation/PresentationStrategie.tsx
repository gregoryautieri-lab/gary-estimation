// ============================================
// Écran 7 : Stratégie & Proposition commerciale
// REFONTE MAJEURE selon philosophie GARY
// - 1 seule carte scénario (point de départ)
// - Prix en CHF uniquement (pas de %)
// - Détail stratégique complet
// - Capital-Visibilité avec jauge
// - Phases conditionnelles grisées
// - Section "Valeur à préserver"
// ============================================

import React from 'react';
import { 
  Lock, Megaphone, Globe, 
  Eye, EyeOff, Users, AlertTriangle, Image, Target, MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Identification, 
  Caracteristiques, 
  PreEstimation, 
  StrategiePitch
} from '@/types/estimation';
import type { LucideIcon } from 'lucide-react';

interface PresentationStrategieProps {
  identification: Identification;
  caracteristiques: Caracteristiques;
  preEstimation: PreEstimation;
  strategie: StrategiePitch;
  totalVenale: number;
  courtierTelephone?: string;
  capitalVisibilite?: number;
  isLuxe?: boolean;
}

// Configuration des trajectoires (données complètes)
interface TrajectoireConfig {
  id: string;
  nom: string;
  icon: LucideIcon;
  intention: string;
  intentionLux: string;
  exposition: string;
  pression: string;
  garyPilote: string;
  conditions: string[];
  pilotageCoordonne: boolean;
  pourcDefaut: number;
}

const TRAJECTOIRES: Record<string, TrajectoireConfig> = {
  offmarket: {
    id: 'offmarket',
    nom: 'Off-Market',
    icon: Lock,
    intention: 'Vendre avant l\'exposition publique',
    intentionLux: 'Transaction privée entre acquéreurs qualifiés',
    exposition: 'Confidentielle et sélective',
    pression: 'Pression créée par la rareté',
    garyPilote: 'Sélection manuelle des contacts',
    conditions: ['Cercle restreint d\'acheteurs qualifiés', 'Aucune trace publique', 'Retours confidentiels'],
    pilotageCoordonne: true,
    pourcDefaut: 15,
  },
  comingsoon: {
    id: 'comingsoon',
    nom: 'Coming Soon',
    icon: Megaphone,
    intention: 'Créer l\'attente avant mise en ligne',
    intentionLux: 'Création de l\'attente sur le marché premium',
    exposition: 'Teasing maîtrisé',
    pression: 'Désir par anticipation',
    garyPilote: 'Campagne séquencée avant lancement',
    conditions: ['Communication maîtrisée', 'Liste d\'attente', 'Teasing ciblé'],
    pilotageCoordonne: true,
    pourcDefaut: 10,
  },
  public: {
    id: 'public',
    nom: 'Public',
    icon: Globe,
    intention: 'Maximiser la visibilité immédiate',
    intentionLux: 'Exposition maximale maîtrisée',
    exposition: 'Tous canaux activés',
    pression: 'Concurrence ouverte',
    garyPilote: 'Diffusion multi-portails + réseaux',
    conditions: ['Diffusion large', 'Portails immobiliers', 'Visibilité maximale'],
    pilotageCoordonne: false,
    pourcDefaut: 6,
  },
};

// Helper arrondi
const arrondir5000 = (val: number) => Math.ceil(val / 5000) * 5000;

// Format prix CHF
const formatCHF = (val: number) => `CHF ${val.toLocaleString('fr-CH')}`;

// Phases selon point de départ
interface SequencePhase {
  id: string;
  label: string;
  active: boolean;
}

const getSequencePhases = (startType: string): SequencePhase[] => {
  if (startType === 'offmarket') {
    return [
      { id: 'offmarket', label: 'Point de départ', active: true },
      { id: 'comingsoon', label: 'Activable', active: false },
      { id: 'public', label: 'Si besoin', active: false },
    ];
  }
  if (startType === 'comingsoon') {
    return [
      { id: 'comingsoon', label: 'Point de départ', active: true },
      { id: 'public', label: 'Si besoin', active: false },
    ];
  }
  return [
    { id: 'public', label: 'Point de départ', active: true },
  ];
};

// Valeur à préserver items
const VALEUR_A_PRESERVER = [
  { icon: Image, label: 'Image du bien' },
  { icon: EyeOff, label: 'Discrétion' },
  { icon: Target, label: 'Sélectivité' },
  { icon: MessageSquare, label: 'Cohérence' },
];

export function PresentationStrategie({
  identification,
  caracteristiques,
  preEstimation,
  strategie,
  totalVenale,
  courtierTelephone,
  capitalVisibilite: capitalVisibiliteProp,
  isLuxe = false,
}: PresentationStrategieProps) {
  // Capital visibilité - utiliser la prop si fournie, sinon lire depuis strategie
  const capitalVisibilite = capitalVisibiliteProp !== undefined 
    ? capitalVisibiliteProp 
    : (strategie?.capitalVisibilite ?? 100);
  
  // Détection si bien déjà diffusé
  const historique = identification?.historique || {};
  const dejaDiffuse = (historique as { dejaDiffuse?: boolean }).dejaDiffuse === true;
  
  // Type de mise en vente
  const typeMV = preEstimation?.typeMiseEnVente || 'offmarket';
  
  // Pourcentages (lire depuis preEstimation ou utiliser défauts)
  const pourcOffmarket = preEstimation?.pourcOffmarket ?? TRAJECTOIRES.offmarket.pourcDefaut;
  const pourcComingsoon = preEstimation?.pourcComingsoon ?? TRAJECTOIRES.comingsoon.pourcDefaut;
  const pourcPublic = preEstimation?.pourcPublic ?? TRAJECTOIRES.public.pourcDefaut;
  
  // Prix par trajectoire (en CHF, pas de %)
  const getPrixTrajectoire = (trajId: string): number => {
    const pourc = trajId === 'offmarket' 
      ? pourcOffmarket
      : trajId === 'comingsoon'
      ? pourcComingsoon
      : pourcPublic;
    
    return arrondir5000(totalVenale * (1 + pourc / 100));
  };
  
  // Séquence des phases
  const sequencePhases = getSequencePhases(typeMV);
  
  // Config du scénario principal
  const mainConfig = TRAJECTOIRES[typeMV] || TRAJECTOIRES.offmarket;
  const MainIcon = mainConfig.icon;
  const prixObjectif = getPrixTrajectoire(typeMV);

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Titre */}
        <div className="text-center space-y-2">
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold",
            isLuxe ? "text-amber-100" : "text-white"
          )}>
            {isLuxe ? 'Votre scénario de gouvernance' : 'Votre stratégie de vente'}
          </h1>
          <p className="text-white/60">
            {isLuxe ? 'Un accompagnement sur mesure' : 'Plan d\'action personnalisé'}
          </p>
        </div>

        {/* Capital-Visibilité */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-white/60" />
              <span className="text-sm text-white/60 uppercase tracking-wide font-semibold">
                Capital-Visibilité
              </span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              capitalVisibilite >= 70 ? "text-emerald-400" :
              capitalVisibilite >= 40 ? "text-orange-400" : "text-red-400"
            )}>
              {capitalVisibilite}%
            </span>
          </div>
          
          {/* Jauge */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                capitalVisibilite >= 70 ? "bg-emerald-500" :
                capitalVisibilite >= 40 ? "bg-orange-500" : "bg-red-500"
              )}
              style={{ width: `${capitalVisibilite}%` }}
            />
          </div>
          
          {/* Message selon niveau */}
          <p className="text-white/50 text-sm">
            {capitalVisibilite >= 70 
              ? "Votre bien part avec un capital-visibilité préservé."
              : capitalVisibilite >= 40
              ? "Une exposition antérieure a consommé une partie du capital."
              : "Une phase de recalibrage sera nécessaire."
            }
          </p>
          
          {/* Badge déjà diffusé */}
          {dejaDiffuse && (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Déjà diffusé
            </Badge>
          )}
        </div>

        {/* Scénario principal - UNE SEULE CARTE */}
        <div className={cn(
          "rounded-xl overflow-hidden",
          isLuxe 
            ? "border-2 border-amber-500/50" 
            : "border-2 border-primary/50"
        )}>
          {/* Header */}
          <div className={cn(
            "p-4 flex items-center justify-between",
            isLuxe ? "bg-amber-500/20" : "bg-primary/20"
          )}>
            <div className="flex items-center gap-3">
              <MainIcon className={cn(
                "h-6 w-6",
                isLuxe ? "text-amber-400" : "text-primary"
              )} />
              <span className="text-white font-bold text-lg">{mainConfig.nom}</span>
            </div>
            <Badge className={cn(
              isLuxe 
                ? "bg-amber-500 text-white" 
                : "bg-primary text-white"
            )}>
              Point de départ
            </Badge>
          </div>
          
          {/* Contenu détaillé */}
          <div className="p-4 space-y-4 bg-white/5">
            {/* Intention */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Intention</p>
              <p className="text-white">
                {isLuxe ? mainConfig.intentionLux : mainConfig.intention}
              </p>
            </div>
            
            {/* Exposition */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Exposition</p>
              <p className="text-white">{mainConfig.exposition}</p>
            </div>
            
            {/* Pression */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Pression</p>
              <p className="text-white italic">{mainConfig.pression}</p>
            </div>
            
            {/* GARY pilote */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">GARY pilote</p>
              <p className="text-white">{mainConfig.garyPilote}</p>
              {mainConfig.pilotageCoordonne && (
                <div className="flex items-center gap-2 mt-2 text-white/70">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Pilotage coordonné requis</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Prix objectif */}
          <div className={cn(
            "p-4 text-center",
            isLuxe ? "bg-amber-500/10" : "bg-primary/10"
          )}>
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
              Objectif de valeur
            </p>
            <p className={cn(
              "text-2xl font-bold",
              isLuxe ? "text-amber-400" : "text-primary"
            )}>
              {formatCHF(prixObjectif)}
            </p>
            <p className="text-white/40 text-xs mt-1">
              Atteignable si conditions respectées
            </p>
          </div>
        </div>

        {/* Phases conditionnelles (grisées) */}
        {sequencePhases.filter(p => !p.active).length > 0 && (
          <div className="space-y-3">
            <p className="text-white/50 text-sm">Phases activables si nécessaire :</p>
            <div className="flex gap-3">
              {sequencePhases.filter(p => !p.active).map((phase) => {
                const config = TRAJECTOIRES[phase.id];
                if (!config) return null;
                const prixPhase = getPrixTrajectoire(phase.id);
                const PhaseIcon = config.icon;
                
                return (
                  <div 
                    key={phase.id}
                    className="flex-1 p-4 rounded-lg bg-white/5 opacity-60 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <PhaseIcon className="h-4 w-4 text-white/50" />
                      <span className="text-white/70 font-medium">{config.nom}</span>
                    </div>
                    <Badge variant="outline" className="text-white/40 border-white/20 text-xs mb-2">
                      {phase.label}
                    </Badge>
                    <p className="text-white/50 text-sm">
                      {formatCHF(prixPhase)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Valeur à préserver */}
        <div className="space-y-3">
          <p className="text-white/50 text-sm uppercase tracking-wide text-center">
            Valeur à préserver
          </p>
          <div className="grid grid-cols-4 gap-3">
            {VALEUR_A_PRESERVER.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-white/5 text-center"
                >
                  <ItemIcon className={cn(
                    "h-5 w-5 mx-auto mb-1",
                    isLuxe ? "text-amber-400/70" : "text-white/50"
                  )} />
                  <p className="text-white/60 text-xs">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pilotage coordonné */}
        <div className={cn(
          "rounded-xl p-5 md:p-6 border-l-4",
          isLuxe 
            ? "bg-amber-900/20 border-amber-500" 
            : "bg-white/5 border-primary"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              isLuxe ? "bg-amber-500/20" : "bg-primary/20"
            )}>
              <Users className={cn(
                "h-5 w-5",
                isLuxe ? "text-amber-400" : "text-primary"
              )} />
            </div>
            <h3 className={cn(
              "text-lg md:text-xl font-semibold",
              isLuxe ? "text-amber-100" : "text-white"
            )}>
              Pilotage Coordonné
            </h3>
          </div>
          
          <p className="text-white/70 text-sm md:text-base leading-relaxed">
            Vous restez maître des décisions. GARY pilote la commercialisation au quotidien, mais{' '}
            <span className="text-white font-medium">chaque passage de phase est validé ensemble</span>. 
            <span className="text-white font-medium"> Vous gardez le contrôle</span> du calendrier et des choix stratégiques.
          </p>
        </div>

      </div>
    </div>
  );
}
