// ============================================
// Écran 5 : Notre Approche - Philosophie adaptative
// Objectif : Créer la confiance avec un message adapté au contexte vendeur
// ============================================

import React from 'react';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  X, 
  EyeOff, 
  Zap, 
  Clock, 
  Home,
  Lock,
  Sparkles,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Identification, PreEstimation, TypeMiseEnVente } from '@/types/estimation';

interface PresentationGaryProps {
  isLuxe?: boolean;
  identification?: Identification;
  preEstimation?: PreEstimation;
}

export function PresentationGary({ 
  isLuxe = false,
  identification,
  preEstimation
}: PresentationGaryProps) {
  
  // ============ DÉTECTION DU CONTEXTE ============
  const historique = identification?.historique;
  const contexte = identification?.contexte;
  const projetPostVente = identification?.projetPostVente;
  const typeMiseEnVente: TypeMiseEnVente = preEstimation?.typeMiseEnVente || 'public';
  
  // Flags contextuels
  const isConfidentiel = typeMiseEnVente === 'offmarket';
  const isComingSoon = typeMiseEnVente === 'comingsoon';
  const isUrgent = contexte?.horizon === 'urgent' || contexte?.urgence === true;
  const dejaDiffuse = historique?.dejaDiffuse === true;
  const hasProjetAchat = projetPostVente?.nature === 'achat' || 
    projetPostVente?.niveauCoordination === 'achat_souhaite' || 
    projetPostVente?.niveauCoordination === 'active';
  
  // ============ TITRE & SOUS-TITRE ADAPTATIFS ============
  const getHeaderContent = () => {
    if (isLuxe) {
      return {
        title: 'Notre approche',
        subtitle: 'L\'excellence au service de votre patrimoine'
      };
    }
    if (isConfidentiel) {
      return {
        title: 'Notre approche confidentielle',
        subtitle: 'Discrétion et efficacité pour votre projet'
      };
    }
    if (dejaDiffuse) {
      return {
        title: 'Une nouvelle approche',
        subtitle: 'Reconstruire la valeur perçue de votre bien'
      };
    }
    return {
      title: 'Notre approche',
      subtitle: 'Une stratégie sur mesure pour votre vente'
    };
  };
  
  const headerContent = getHeaderContent();
  
  // ============ 3 PILIERS ADAPTATIFS ============
  const getPillars = () => {
    // Pilier 1 : Discrétion / Protection
    const pillar1 = isConfidentiel ? {
      icon: EyeOff,
      title: 'Discrétion totale',
      description: 'Votre bien reste invisible du grand public. Nous activons uniquement notre réseau privé d\'acquéreurs qualifiés et de partenaires de confiance.'
    } : {
      icon: Shield,
      title: 'Le capital-visibilité est précieux',
      description: 'Chaque bien dispose d\'un capital d\'attention limité. Une surexposition diminue la valeur perçue. GARY préserve ce capital par une diffusion maîtrisée.'
    };
    
    // Pilier 2 : Réactivité / Méthode
    const pillar2 = isUrgent ? {
      icon: Zap,
      title: 'Réactivité immédiate',
      description: 'Dans votre situation, le temps compte. Notre process accéléré mobilise notre réseau dès la signature pour obtenir des offres qualifiées rapidement.'
    } : {
      icon: TrendingUp,
      title: 'La diffusion séquencée protège la valeur',
      description: 'GARY déploie une stratégie en phases : réseau privé d\'abord, portails ensuite. Chaque étape a un objectif de prix spécifique.'
    };
    
    // Pilier 3 : Coordination / Contrôle
    const pillar3 = hasProjetAchat ? {
      icon: Clock,
      title: 'Coordination vente-achat',
      description: 'GARY synchronise le calendrier de votre vente avec votre projet d\'acquisition. Un seul interlocuteur pour piloter les deux opérations sereinement.'
    } : {
      icon: Users,
      title: 'Le vendeur garde le contrôle',
      description: 'GARY pilote la commercialisation, mais chaque décision importante est validée avec vous. Vous restez maître du calendrier et des choix.'
    };
    
    return [pillar1, pillar2, pillar3];
  };
  
  const pillars = getPillars();
  
  // ============ ANTI-PRATIQUES (compact) ============
  const antiPractices = [
    'Multi-diffusion sauvage',
    'Bradage pour "vendre vite"',
    'Visites non qualifiées',
  ];
  
  // ============ STRATÉGIE RECOMMANDÉE ============
  const getStrategyRecommendation = () => {
    if (isConfidentiel) {
      return {
        icon: Lock,
        label: 'Off-Market',
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        description: 'Diffusion confidentielle via notre réseau privé'
      };
    }
    if (isComingSoon) {
      return {
        icon: Sparkles,
        label: 'Coming Soon',
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        description: 'Créer l\'attente avant la mise en ligne'
      };
    }
    return {
      icon: Globe,
      label: 'Diffusion progressive',
      color: 'bg-primary/20 text-primary border-primary/30',
      description: 'Stratégie en 3 phases pour maximiser la valeur'
    };
  };
  
  const strategyReco = getStrategyRecommendation();

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div 
          className="text-center space-y-3 animate-fade-in"
          style={{ animationDelay: '0ms' }}
        >
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold",
            isLuxe ? "text-amber-100" : "text-white"
          )}>
            {headerContent.title}
          </h1>
          
          <p className="text-white/60 text-base md:text-lg">
            {headerContent.subtitle}
          </p>
        </div>

        {/* Introduction contextuelle */}
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
            {dejaDiffuse 
              ? 'Votre bien a déjà été exposé au marché. Notre mission : reconstruire son attractivité par une approche différenciante et un repositionnement stratégique.'
              : isLuxe 
                ? 'GARY accompagne les propriétaires de biens d\'exception avec une conviction : le capital-visibilité de votre bien est un actif précieux qui mérite une gouvernance sur mesure.'
                : 'GARY est une agence immobilière indépendante spécialisée dans l\'accompagnement premium des propriétaires genevois. Notre approche repose sur une conviction : le capital-visibilité d\'un bien est précieux et doit être protégé.'
            }
          </p>
        </div>

        {/* 3 Piliers adaptatifs */}
        <div className="space-y-4">
          <h2 
            className="text-base md:text-lg font-semibold text-white/80 text-center animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            {isLuxe ? 'Nos engagements' : 'Les 3 piliers de notre approche'}
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar, index) => {
              const IconComponent = pillar.icon;
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
                    {pillar.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ce que GARY ne fait pas - Version compacte */}
        <div 
          className="flex flex-wrap items-center justify-center gap-2 animate-fade-in"
          style={{ animationDelay: '600ms' }}
        >
          <span className="text-white/40 text-xs md:text-sm mr-2">Ce que GARY ne fait pas :</span>
          {antiPractices.map((practice, index) => (
            <Badge 
              key={index}
              variant="outline"
              className="bg-red-900/10 border-red-500/20 text-red-300/80 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              {practice}
            </Badge>
          ))}
        </div>

        {/* Bloc transition vers stratégie */}
        <div 
          className={cn(
            "rounded-xl p-4 md:p-5 flex items-center gap-4 animate-fade-in",
            strategyReco.color.includes('purple') 
              ? "bg-purple-900/20 border border-purple-500/20"
              : strategyReco.color.includes('blue')
                ? "bg-blue-900/20 border border-blue-500/20"
                : isLuxe 
                  ? "bg-amber-900/20 border border-amber-500/20"
                  : "bg-primary/10 border border-primary/20"
          )}
          style={{ animationDelay: '700ms' }}
        >
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
            strategyReco.color.includes('purple') 
              ? "bg-purple-500/20"
              : strategyReco.color.includes('blue')
                ? "bg-blue-500/20"
                : isLuxe 
                  ? "bg-amber-500/20"
                  : "bg-primary/20"
          )}>
            <strategyReco.icon className={cn(
              "h-6 w-6",
              strategyReco.color.includes('purple') 
                ? "text-purple-400"
                : strategyReco.color.includes('blue')
                  ? "text-blue-400"
                  : isLuxe 
                    ? "text-amber-400"
                    : "text-primary"
            )} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/50 text-xs">Stratégie recommandée :</span>
              <Badge 
                variant="outline"
                className={cn("text-xs", strategyReco.color)}
              >
                {strategyReco.label}
              </Badge>
            </div>
            <p className="text-white/70 text-sm">
              {strategyReco.description}
            </p>
          </div>
        </div>

        {/* Slogan footer */}
        <div 
          className="text-center pt-2 md:pt-4 animate-fade-in"
          style={{ animationDelay: '800ms' }}
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
