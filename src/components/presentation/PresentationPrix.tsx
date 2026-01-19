// ============================================
// Écran 5 : Prix et justification
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
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstimationCalcul } from '@/hooks/useEstimationCalcul';
import type { Caracteristiques, PreEstimation } from '@/types/estimation';

interface PresentationPrixProps {
  caracteristiques: Caracteristiques;
  preEstimation: PreEstimation;
  typeBien: string;
}

// Formateur de prix CHF
function formatCHF(value: number): string {
  if (!value || value === 0) return '—';
  return value.toLocaleString('fr-CH');
}

// Card pour les 3 valeurs
function ValueCard({ 
  icon: Icon, 
  label, 
  value, 
  sublabel,
  accent = false 
}: { 
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center p-4 rounded-xl backdrop-blur-sm",
      accent 
        ? "bg-primary/20 border border-primary/30" 
        : "bg-white/5 border border-white/10"
    )}>
      <Icon className={cn(
        "h-5 w-5 mb-2",
        accent ? "text-primary" : "text-white/60"
      )} />
      <p className="text-xs text-white/50 uppercase tracking-wide mb-1">{label}</p>
      <p className={cn(
        "text-lg font-bold",
        accent ? "text-primary" : "text-white"
      )}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-white/40 mt-1">{sublabel}</p>
      )}
    </div>
  );
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

export function PresentationPrix({ 
  caracteristiques, 
  preEstimation,
  typeBien 
}: PresentationPrixProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Calculs via le hook
  const calcul = useEstimationCalcul(caracteristiques, preEstimation);
  
  const isAppartement = typeBien === 'appartement';
  const isMaison = typeBien === 'maison';
  
  // Prix au m² (ou m³ pour maison)
  const prixUnitaire = isAppartement 
    ? calcul.prixM2Ajuste 
    : calcul.prixM3Ajuste;
  const unitLabel = isAppartement ? 'm²' : 'm³';
  
  // Taux de rendement
  const tauxRendement = preEstimation.tauxCapitalisation || 3.5;
  const loyerMensuel = parseFloat(preEstimation.loyerMensuel || '0');
  const hasRendement = loyerMensuel > 0;

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Hero Prix - Fourchette avec animation fade-in */}
        <div className="text-center py-8 animate-fade-in">
          <p className="text-white/50 text-sm mb-4 uppercase tracking-widest">
            Estimation de valeur
          </p>
          
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-4xl md:text-5xl font-bold text-primary">
              CHF {formatCHF(calcul.prixEntreCalcule)}
            </span>
            <span className="text-2xl md:text-3xl text-white/40">—</span>
            <span className="text-4xl md:text-5xl font-bold text-primary">
              {formatCHF(calcul.prixEtCalcule)}
            </span>
          </div>
          
          {/* Prix au m² */}
          {prixUnitaire > 0 && (
            <p className="text-white/40 mt-4 text-lg">
              soit CHF {formatCHF(prixUnitaire)} / {unitLabel}
            </p>
          )}
        </div>

        {/* Les 3 valeurs */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <ValueCard
            icon={Building2}
            label="Vénale"
            value={`CHF ${formatCHF(calcul.totalVenaleArrondi)}`}
            sublabel="Base de calcul"
            accent
          />
          <ValueCard
            icon={TrendingUp}
            label="Rendement"
            value={hasRendement ? `CHF ${formatCHF(calcul.valeurRendement)}` : 'N/A'}
            sublabel={hasRendement ? `Taux ${tauxRendement}%` : 'Pas de loyer'}
          />
          <ValueCard
            icon={Landmark}
            label="Gage"
            value={`CHF ${formatCHF(calcul.valeurGageArrondi)}`}
            sublabel="Réf. bancaire"
          />
        </div>

        {/* Accordéon détail valorisation */}
        <div 
          className="bg-white/5 rounded-xl overflow-hidden animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <button
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <span className="text-white font-medium">Voir le détail du calcul</span>
            {isDetailOpen ? (
              <ChevronUp className="h-5 w-5 text-white/60" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white/60" />
            )}
          </button>
          
          {isDetailOpen && (
            <div className="px-4 pb-4 space-y-1 animate-fade-in">
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
                <span className="text-white font-semibold">Total valeur vénale</span>
                <span className="text-xl font-bold text-primary">
                  CHF {formatCHF(calcul.totalVenaleArrondi)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rendement locatif (si loyer renseigné) */}
        {hasRendement && (
          <div 
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Potentiel locatif
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/50 text-xs uppercase">Loyer mensuel</p>
                <p className="text-white text-lg font-semibold">
                  CHF {formatCHF(loyerMensuel)}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase">Rendement brut</p>
                <p className="text-emerald-400 text-lg font-semibold">
                  {tauxRendement}%
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
