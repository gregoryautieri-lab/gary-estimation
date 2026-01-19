// ============================================
// Écran 8 : Objectif de Valorisation (Prix)
// ============================================

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp,
  Building2, 
  TrendingUp, 
  Landmark,
  Home,
  Car,
  Warehouse,
  MapPin,
  Box,
  Hammer,
  Plus,
  Target,
  Sparkles,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstimationCalcul } from '@/hooks/useEstimationCalcul';
import type { Caracteristiques, PreEstimation, AnalyseTerrain, TypeMiseEnVente } from '@/types/estimation';

interface PresentationPrixProps {
  caracteristiques: Caracteristiques;
  preEstimation: PreEstimation;
  analyseTerrain?: AnalyseTerrain;
  typeBien: string;
  typeMiseEnVente?: TypeMiseEnVente;
  totalVenale?: number;
  isLuxe?: boolean;
}

// Formateur de prix CHF
function formatCHF(value: number): string {
  if (!value || value === 0) return '—';
  return new Intl.NumberFormat('fr-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace(/\s/g, "'");
}

// Arrondir à 5000
function roundTo5000(value: number): number {
  return Math.round(value / 5000) * 5000;
}

// Ligne de détail valorisation
function DetailLine({ 
  icon: Icon, 
  label, 
  quantity, 
  unitPrice, 
  total,
  isNegative = false
}: { 
  icon?: React.ElementType;
  label: string;
  quantity?: string;
  unitPrice?: string;
  total: number;
  isNegative?: boolean;
}) {
  if (total === 0) return null;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-white/40" />}
        <span className="text-sm text-white/70">{label}</span>
        {quantity && unitPrice && (
          <span className="text-xs text-white/40">
            ({quantity} × {unitPrice})
          </span>
        )}
      </div>
      <span className={cn(
        "text-sm font-medium",
        isNegative ? "text-orange-400" : "text-white"
      )}>
        {isNegative ? '-' : '+'} CHF {formatCHF(Math.abs(total))}
      </span>
    </div>
  );
}

// Labels selon trajectoire
const TRAJECTOIRE_LABELS: Record<string, string> = {
  offmarket: 'Prix de lancement Off-Market',
  comingsoon: 'Prix de lancement Coming Soon',
  public: 'Prix de lancement Public',
};

const TRAJECTOIRE_NOMS: Record<string, string> = {
  offmarket: 'Off-Market',
  comingsoon: 'Coming Soon',
  public: 'Public',
};

export function PresentationPrix({ 
  caracteristiques, 
  preEstimation,
  analyseTerrain,
  typeBien,
  typeMiseEnVente = 'public',
  totalVenale = 0,
  isLuxe = false
}: PresentationPrixProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Calculs via le hook
  const calcul = useEstimationCalcul(caracteristiques, preEstimation);
  
  const isAppartement = typeBien === 'appartement';
  const isMaison = typeBien === 'maison';
  
  // Pourcentages par trajectoire
  const pourcOffmarket = preEstimation?.pourcOffmarket ?? 15;
  const pourcComingsoon = preEstimation?.pourcComingsoon ?? 10;
  const pourcPublic = preEstimation?.pourcPublic ?? 6;
  
  // Prix de base (valeur vénale)
  const basePrice = totalVenale > 0 ? totalVenale : calcul.totalVenaleArrondi;
  
  // Prix hero selon trajectoire sélectionnée
  const pourcentageObjectif = 
    typeMiseEnVente === 'offmarket' ? pourcOffmarket :
    typeMiseEnVente === 'comingsoon' ? pourcComingsoon : pourcPublic;
  
  const prixHero = roundTo5000(basePrice * (1 + pourcentageObjectif / 100));
  
  // Fourchette de négociation (prix hero = prix affiché, vente attendue = -0% à -5%)
  const prixVenteMin = roundTo5000(prixHero * 0.95);
  const prixVenteMax = prixHero;
  
  // Prix au m² (ou m³ pour maison)
  const prixUnitaire = isAppartement 
    ? calcul.prixM2Ajuste 
    : calcul.prixM3Ajuste;
  const unitLabel = isAppartement ? 'm²' : 'm³';
  
  // Points forts du bien (depuis analyseTerrain)
  const pointsForts: string[] = [];
  
  // Récupérer depuis analyseTerrain
  if (analyseTerrain?.pointsForts && Array.isArray(analyseTerrain.pointsForts)) {
    pointsForts.push(...analyseTerrain.pointsForts.slice(0, 5));
  }
  
  // Fallback avec des points génériques si rien
  if (pointsForts.length === 0) {
    if (caracteristiques?.vue) pointsForts.push(`Vue ${caracteristiques.vue}`);
    if (caracteristiques?.piscine) pointsForts.push('Piscine');
    if (caracteristiques?.parkingInterieur && parseInt(caracteristiques.parkingInterieur) > 0) {
      pointsForts.push('Parking intérieur');
    }
    if (caracteristiques?.cave) pointsForts.push('Cave privative');
    if (caracteristiques?.fitness) pointsForts.push('Salle de fitness');
  }

  // Label trajectoire
  const labelTrajectoire = TRAJECTOIRE_LABELS[typeMiseEnVente] || TRAJECTOIRE_LABELS.public;
  const nomTrajectoire = TRAJECTOIRE_NOMS[typeMiseEnVente] || TRAJECTOIRE_NOMS.public;

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Titre */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {isLuxe ? 'Objectif de Valorisation' : 'Notre Recommandation'}
          </h1>
          <p className="text-white/60 mt-2">
            {isLuxe ? 'Positionnement stratégique' : 'Basée sur notre analyse complète'}
          </p>
        </div>
        
        {/* Hero Prix avec label trajectoire */}
        <div className="text-center py-8 md:py-12 animate-fade-in">
          {/* Label trajectoire */}
          <p className="text-white/50 text-sm md:text-base mb-4">
            {labelTrajectoire}
          </p>
          
          {/* Prix Hero principal */}
          <div className="mb-4">
            <span className={cn(
              "text-5xl md:text-6xl lg:text-7xl font-bold",
              isLuxe ? "text-amber-400" : "text-primary"
            )}>
              CHF {formatCHF(prixHero)}
            </span>
          </div>
          
          {/* Prix au m² */}
          {prixUnitaire > 0 && (
            <p className="text-white/40 text-base md:text-lg">
              soit CHF {formatCHF(prixUnitaire)} / {unitLabel}
            </p>
          )}
        </div>

        {/* Fourchette de négociation */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <p className="text-white/60 text-sm text-center mb-3">
            Fourchette de négociation attendue
          </p>
          
          {/* Barre visuelle */}
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden max-w-md mx-auto">
            <div 
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                isLuxe ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-primary to-primary/70"
              )}
              style={{ width: '95%' }}
            />
            {/* Curseur à 95% (position du prix affiché) */}
            <div 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow-lg",
                isLuxe ? "bg-amber-400" : "bg-primary"
              )}
              style={{ left: 'calc(95% - 10px)' }}
            />
          </div>
          
          {/* Labels min/max */}
          <div className="flex justify-between text-xs text-white/40 mt-2 max-w-md mx-auto">
            <span>CHF {formatCHF(prixVenteMin)}</span>
            <span>CHF {formatCHF(prixVenteMax)}</span>
          </div>
          
          {/* Texte explicatif */}
          <p className="text-center text-white/50 text-xs md:text-sm italic mt-4">
            Prix affiché : CHF {formatCHF(prixHero)} • Prix de vente attendu : CHF {formatCHF(prixVenteMin)} à {formatCHF(prixVenteMax)}
          </p>
        </div>

        {/* Card Rappel Trajectoire */}
        <div 
          className="animate-fade-in rounded-xl p-5 bg-white/5 border border-white/10"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
              isLuxe ? "bg-amber-500/20" : "bg-primary/20"
            )}>
              <Target className={cn(
                "h-5 w-5",
                isLuxe ? "text-amber-400" : "text-primary"
              )} />
            </div>
            <div>
              <p className="text-white font-medium">
                Point de départ recommandé : <span className={isLuxe ? "text-amber-400" : "text-primary"}>{nomTrajectoire}</span>
              </p>
              <p className="text-white/60 text-sm mt-1">
                Objectif de valorisation : <span className="font-semibold text-white">+{pourcentageObjectif}%</span> par rapport à la valeur de base
              </p>
            </div>
          </div>
        </div>

        {/* Points forts / Atouts */}
        {pointsForts.length > 0 && (
          <div 
            className="animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              {isLuxe ? 'Éléments de valeur' : 'Atouts qui justifient cette valorisation'}
            </h2>
            <div className="space-y-2">
              {pointsForts.map((point, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                >
                  <Check className={cn(
                    "h-4 w-4 shrink-0",
                    isLuxe ? "text-amber-400" : "text-primary"
                  )} />
                  <span className="text-white/80 text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accordéon détail valorisation */}
        <div 
          className="animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <button
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            className="w-full flex items-center justify-center gap-2 py-3 text-white/50 hover:text-white/70 transition-colors group"
          >
            <span className="text-sm underline-offset-4 group-hover:underline">
              {isDetailOpen ? 'Masquer le détail' : 'Voir le détail du calcul'}
            </span>
            {isDetailOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {isDetailOpen && (
            <div className="mt-4 p-4 rounded-xl bg-white/5 space-y-1 animate-fade-in">
              {isAppartement ? (
                <>
                  {/* Détail Appartement */}
                  <DetailLine
                    icon={Home}
                    label="Surface pondérée"
                    quantity={`${calcul.surfacePonderee.toFixed(1)} m²`}
                    unitPrice={`CHF ${formatCHF(calcul.prixM2Ajuste)}`}
                    total={calcul.valeurSurface}
                  />
                  {calcul.nbPlaceInt > 0 && (
                    <DetailLine
                      icon={Car}
                      label="Parking intérieur"
                      quantity={`${calcul.nbPlaceInt}`}
                      unitPrice={`CHF ${formatCHF(parseFloat(preEstimation.prixPlaceInt || '50000'))}`}
                      total={calcul.valeurPlaceInt}
                    />
                  )}
                  {calcul.nbPlaceExt > 0 && (
                    <DetailLine
                      icon={Car}
                      label="Parking extérieur"
                      quantity={`${calcul.nbPlaceExt}`}
                      unitPrice={`CHF ${formatCHF(parseFloat(preEstimation.prixPlaceExt || '25000'))}`}
                      total={calcul.valeurPlaceExt}
                    />
                  )}
                  {calcul.nbBox > 0 && (
                    <DetailLine
                      icon={Warehouse}
                      label="Box / Garage"
                      quantity={`${calcul.nbBox}`}
                      unitPrice={`CHF ${formatCHF(parseFloat(preEstimation.prixBox || '60000'))}`}
                      total={calcul.valeurBox}
                    />
                  )}
                  {calcul.hasCave && (
                    <DetailLine
                      icon={Box}
                      label="Cave"
                      total={calcul.valeurCave}
                    />
                  )}
                  {calcul.valeurLignesSupp !== 0 && (
                    <DetailLine
                      icon={Plus}
                      label="Ajustements"
                      total={calcul.valeurLignesSupp}
                      isNegative={calcul.valeurLignesSupp < 0}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Détail Maison */}
                  <DetailLine
                    icon={MapPin}
                    label="Terrain"
                    quantity={`${caracteristiques.surfaceTerrain || 0} m²`}
                    unitPrice={`CHF ${formatCHF(parseFloat(preEstimation.prixM2Terrain || '0'))}`}
                    total={calcul.valeurTerrain}
                  />
                  <DetailLine
                    icon={Home}
                    label="Cubage SIA"
                    quantity={`${calcul.cubage.toFixed(0)} m³`}
                    unitPrice={`CHF ${formatCHF(calcul.prixM3Ajuste)}`}
                    total={calcul.valeurCubage}
                  />
                  {calcul.valeurAmenagement > 0 && (
                    <DetailLine
                      icon={Hammer}
                      label="Aménagements"
                      total={calcul.valeurAmenagement}
                    />
                  )}
                  {calcul.valeurAnnexes > 0 && (
                    <DetailLine
                      icon={Warehouse}
                      label="Annexes"
                      total={calcul.valeurAnnexes}
                    />
                  )}
                </>
              )}
              
              {/* Total */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/20">
                <span className="text-white font-semibold">Valeur vénale de base</span>
                <span className={cn(
                  "text-xl font-bold",
                  isLuxe ? "text-amber-400" : "text-primary"
                )}>
                  CHF {formatCHF(calcul.totalVenaleArrondi)}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
