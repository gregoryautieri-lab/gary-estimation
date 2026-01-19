// ============================================
// Écran 5 : Qui est GARY - Philosophie & Différenciation
// Placeholder - Contenu à enrichir dans un prompt séparé
// ============================================

import React from 'react';
import { Shield, Eye, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresentationGaryProps {
  isLuxe?: boolean;
}

export function PresentationGary({ isLuxe = false }: PresentationGaryProps) {
  // 3 convictions GARY
  const convictions = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'Capital-visibilité précieux',
      description: 'Chaque jour de diffusion consomme du capital. Une surexposition dégrade la valeur perçue.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Diffusion séquencée',
      description: 'Une mise en marché par phases protège la valeur et crée l\'urgence.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Pilotage partagé',
      description: 'Vous restez maître des décisions. Chaque passage de phase est validé ensemble.',
    },
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {/* Logo GARY */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center",
              isLuxe ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-primary"
            )}>
              <span className="text-white font-bold text-2xl">G</span>
            </div>
          </div>
          
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold",
            isLuxe ? "text-amber-100" : "text-white"
          )}>
            {isLuxe ? 'L\'excellence GARY' : 'Qui est GARY ?'}
          </h1>
          
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            {isLuxe 
              ? 'Une approche sur mesure pour les biens d\'exception'
              : 'Une approche différente de l\'immobilier'
            }
          </p>
        </div>

        {/* Introduction */}
        <div className={cn(
          "rounded-xl p-6 text-center",
          isLuxe ? "bg-amber-900/20 border border-amber-500/20" : "bg-white/5"
        )}>
          <p className="text-white/80 leading-relaxed">
            GARY Immobilier accompagne les propriétaires genevois avec une conviction : 
            <span className={cn(
              "font-semibold",
              isLuxe ? "text-amber-400" : "text-primary"
            )}> la valeur d'un bien se protège autant qu'elle se vend</span>.
          </p>
        </div>

        {/* 3 Convictions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white text-center">
            Nos 3 convictions
          </h2>
          
          <div className="grid gap-4">
            {convictions.map((conviction, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-xl p-5 transition-all",
                  isLuxe 
                    ? "bg-gradient-to-r from-amber-900/30 to-transparent border border-amber-500/20" 
                    : "bg-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                    isLuxe ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                  )}>
                    {conviction.icon}
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-semibold text-lg mb-1",
                      isLuxe ? "text-amber-100" : "text-white"
                    )}>
                      {conviction.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {conviction.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ce que GARY ne fait pas */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white text-center">
            Ce que nous ne faisons pas
          </h2>
          
          <div className={cn(
            "rounded-xl p-5",
            isLuxe ? "bg-red-900/10 border border-red-500/20" : "bg-white/5"
          )}>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span>
                Multi-diffusion sauvage dès le premier jour
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span>
                Bradage "pour vendre vite"
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✕</span>
                Visites touristes non qualifiées
              </li>
            </ul>
          </div>
        </div>

        {/* Slogan */}
        <div className="text-center pt-4">
          <p className={cn(
            "text-xl font-medium italic",
            isLuxe ? "text-amber-400" : "text-primary"
          )}>
            "On pilote, vous décidez."
          </p>
        </div>
      </div>
    </div>
  );
}
