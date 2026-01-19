// ============================================
// Écran 5 : Qui est GARY - Philosophie & Différenciation
// Objectif : Créer la confiance avant de parler marché/stratégie
// ============================================

import React from 'react';
import { Shield, TrendingUp, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresentationGaryProps {
  isLuxe?: boolean;
}

export function PresentationGary({ isLuxe = false }: PresentationGaryProps) {
  // 3 convictions GARY - ton institutionnel
  const convictions = [
    {
      icon: Shield,
      title: 'Le capital-visibilité est précieux',
      description: 'Chaque bien dispose d\'un capital d\'attention limité. Une surexposition diminue la valeur perçue. GARY préserve ce capital par une diffusion maîtrisée.',
    },
    {
      icon: TrendingUp,
      title: 'La diffusion séquencée protège la valeur',
      description: 'GARY déploie une stratégie en phases : réseau privé d\'abord, portails ensuite. Chaque étape a un objectif de prix spécifique.',
    },
    {
      icon: Users,
      title: 'Le vendeur garde le contrôle',
      description: 'GARY pilote la commercialisation, mais chaque décision importante est validée avec vous. Vous restez maître du calendrier et des choix.',
    },
  ];

  // Ce que GARY ne fait pas
  const antiPractices = [
    'Pas de multi-diffusion sauvage sur tous les portails dès J+1',
    'Pas de bradage pour "vendre vite"',
    'Pas de visites touristes non qualifiées',
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div 
          className="text-center space-y-3 animate-fade-in"
          style={{ animationDelay: '0ms' }}
        >
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold",
            isLuxe ? "text-amber-100" : "text-white"
          )}>
            {isLuxe ? 'Notre approche' : 'Qui est GARY ?'}
          </h1>
          
          <p className="text-white/60 text-base md:text-lg">
            {isLuxe 
              ? 'L\'excellence au service de votre patrimoine'
              : 'Une approche différente de l\'immobilier genevois'
            }
          </p>
        </div>

        {/* Introduction */}
        <div 
          className={cn(
            "rounded-xl p-5 md:p-6 text-center animate-fade-in",
            isLuxe 
              ? "bg-amber-900/20 border border-amber-500/20" 
              : "bg-white/5 border border-white/10"
          )}
          style={{ animationDelay: '100ms' }}
        >
          <p className="text-white/80 leading-relaxed text-sm md:text-base">
            {isLuxe 
              ? 'GARY accompagne les propriétaires de biens d\'exception avec une conviction : le capital-visibilité de votre bien est un actif précieux qui mérite une gouvernance sur mesure.'
              : 'GARY est une agence immobilière indépendante spécialisée dans l\'accompagnement premium des propriétaires genevois. Notre approche repose sur une conviction : le capital-visibilité d\'un bien est précieux et doit être protégé.'
            }
          </p>
        </div>

        {/* 3 Convictions */}
        <div className="space-y-4">
          <h2 
            className="text-base md:text-lg font-semibold text-white/80 text-center animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            {isLuxe ? 'Nos engagements' : 'Les 3 convictions GARY'}
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {convictions.map((conviction, index) => {
              const IconComponent = conviction.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl p-5 transition-all animate-fade-in",
                    isLuxe 
                      ? "bg-gradient-to-br from-amber-900/30 to-amber-900/10 border border-amber-500/20 hover:border-amber-500/40" 
                      : "bg-[#f9fafb]/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
                  )}
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  {/* Icon */}
                  <div className={cn(
                    "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center mb-4",
                    isLuxe 
                      ? "bg-amber-500/20" 
                      : "bg-primary/20"
                  )}>
                    <IconComponent className={cn(
                      "h-5 w-5 md:h-6 md:w-6",
                      isLuxe ? "text-amber-400" : "text-primary"
                    )} />
                  </div>
                  
                  {/* Title */}
                  <h3 className={cn(
                    "font-semibold text-base md:text-lg mb-2",
                    isLuxe ? "text-amber-100" : "text-white"
                  )}>
                    {conviction.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                    {conviction.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ce que GARY ne fait pas */}
        <div 
          className="space-y-3 animate-fade-in"
          style={{ animationDelay: '600ms' }}
        >
          <h2 className="text-sm md:text-base font-medium text-white/50 text-center">
            Ce que GARY ne fait pas
          </h2>
          
          <div className={cn(
            "rounded-xl p-4 md:p-5",
            isLuxe 
              ? "bg-red-900/10 border border-red-500/10" 
              : "bg-white/5 border border-white/5"
          )}>
            <ul className="space-y-2 md:space-y-3">
              {antiPractices.map((practice, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 text-white/60 text-xs md:text-sm"
                >
                  <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Slogan footer */}
        <div 
          className="text-center pt-4 md:pt-6 animate-fade-in"
          style={{ animationDelay: '700ms' }}
        >
          <p className={cn(
            "text-lg md:text-xl font-medium italic",
            isLuxe ? "text-amber-400" : "text-primary"
          )}>
            "On pilote, vous décidez."
          </p>
        </div>
      </div>
    </div>
  );
}
