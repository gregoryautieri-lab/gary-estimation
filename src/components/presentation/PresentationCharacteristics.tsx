// ============================================
// Écran 2 : Fiche Technique du Bien
// Présentation exhaustive des caractéristiques
// ============================================

import React from 'react';
import { 
  Home, 
  BedDouble, 
  Bath, 
  Maximize, 
  Calendar,
  Compass,
  Eye,
  Check,
  X,
  Thermometer,
  Layers,
  Car,
  TreePine,
  Waves,
  Building2,
  Gauge
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Caracteristiques, Identification } from '@/types/estimation';

interface PresentationCharacteristicsProps {
  identification: Identification;
  caracteristiques: Caracteristiques;
  isLuxe?: boolean;
}

// Helper pour parser les valeurs numériques
const parseNum = (val: string | number | undefined): number => {
  if (typeof val === 'number') return val;
  return parseFloat(String(val || '0')) || 0;
};

// Labels exposition
const EXPOSITION_LABELS: Record<string, string> = {
  nord: 'N', sud: 'S', est: 'E', ouest: 'O',
  'nord-est': 'NE', 'nord-ouest': 'NO', 'sud-est': 'SE', 'sud-ouest': 'SO'
};

// Labels vue
const VUE_LABELS: Record<string, string> = {
  degagee: 'Vue dégagée',
  lac: 'Vue lac',
  montagne: 'Vue montagne',
  verdure: 'Vue verdure',
  ville: 'Vue ville',
  partielle: 'Vue partielle'
};

// Labels chauffage
const CHAUFFAGE_LABELS: Record<string, string> = {
  gaz: 'Gaz', mazout: 'Mazout', pac: 'PAC', electrique: 'Électrique',
  pellets: 'Pellets', bois: 'Bois', sol: 'Sol', cad: 'CAD'
};

// Labels vitrage
const VITRAGE_LABELS: Record<string, string> = {
  simple: 'Simple', double: 'Double', triple: 'Triple'
};

export function PresentationCharacteristics({
  identification,
  caracteristiques,
  isLuxe = false
}: PresentationCharacteristicsProps) {
  const typeBien = caracteristiques?.typeBien || 'appartement';
  const isMaison = typeBien === 'maison';
  
  // Adresse
  const rue = identification?.adresse?.rue || '';
  const codePostal = identification?.adresse?.codePostal || '';
  const localite = identification?.adresse?.localite || '';
  const adresseComplete = `${rue}${codePostal || localite ? ', ' : ''}${codePostal} ${localite}`.trim();
  
  // Header data
  const anneeConstruction = caracteristiques?.anneeConstruction;
  const sousType = caracteristiques?.sousType || '';
  
  // Métriques principales
  const surface = isMaison 
    ? parseNum(caracteristiques?.surfaceHabitableMaison) 
    : parseNum(caracteristiques?.surfacePPE);
  const nombrePieces = parseNum(caracteristiques?.nombrePieces);
  const nombreChambres = parseNum(caracteristiques?.nombreChambres);
  const nombreSDB = parseNum(caracteristiques?.nombreSDB);
  
  // Surfaces détaillées
  const surfaceBalcon = parseNum(caracteristiques?.surfaceBalcon);
  const surfaceTerrasse = parseNum(caracteristiques?.surfaceTerrasse);
  const surfaceJardin = parseNum(caracteristiques?.surfaceJardin);
  const cave = caracteristiques?.cave;
  
  // Config appartement
  const etage = parseNum(caracteristiques?.etage);
  const nombreEtagesImmeuble = parseNum(caracteristiques?.nombreEtagesImmeuble);
  const ascenseur = caracteristiques?.ascenseur === 'oui' || caracteristiques?.ascenseur === 'true' || (caracteristiques?.ascenseur as unknown) === true;
  const dernierEtage = caracteristiques?.dernierEtage;
  
  // Config maison
  const nombreNiveaux = parseNum(caracteristiques?.nombreNiveaux);
  const surfaceTerrain = parseNum(caracteristiques?.surfaceTerrain);
  const piscine = caracteristiques?.piscine;
  
  // Équipements techniques
  const chauffage = caracteristiques?.chauffage || '';
  const vitrage = caracteristiques?.vitrage || '';
  const cecb = caracteristiques?.cecb || '';
  const chargesMensuelles = parseNum(caracteristiques?.chargesMensuelles);
  
  // Exposition & Vue
  const exposition = caracteristiques?.exposition || [];
  const vue = caracteristiques?.vue || '';
  
  // Stationnement
  const parkingInterieur = parseNum(caracteristiques?.parkingInterieur);
  const parkingExterieur = parseNum(caracteristiques?.parkingExterieur);
  const box = parseNum(caracteristiques?.box);
  const hasParking = parkingInterieur > 0 || parkingExterieur > 0 || box > 0;

  // Surfaces à afficher (filtrées)
  const surfacesDetails = [
    { label: 'Balcon', value: surfaceBalcon, unit: 'm²' },
    { label: 'Terrasse', value: surfaceTerrasse, unit: 'm²' },
    { label: 'Jardin', value: surfaceJardin, unit: 'm²' },
    { label: 'Cave', value: cave ? 'Oui' : null, unit: '' }
  ].filter(s => s.value && s.value !== 'Non');

  return (
    <div 
      className="h-full w-full overflow-auto"
      style={{ backgroundColor: '#1a2e35' }}
    >
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        
        {/* 1. Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className={cn(
              "text-2xl md:text-3xl font-bold mb-1",
              isLuxe ? "text-amber-300" : "text-white"
            )}>
              {adresseComplete || 'Adresse non renseignée'}
            </h1>
            {sousType && (
              <p className="text-white/50 text-sm uppercase tracking-wide">{sousType}</p>
            )}
          </div>
          {anneeConstruction && (
            <div className="text-right">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                isLuxe ? "bg-amber-500/10" : "bg-white/5"
              )}>
                <Calendar className={cn("h-4 w-4", isLuxe ? "text-amber-400" : "text-white/50")} />
                <span className="text-white font-medium">{anneeConstruction}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Métriques principales - 4 cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Maximize, value: surface, unit: 'm²', label: 'Surface' },
            { icon: Home, value: nombrePieces, unit: 'pcs', label: 'Pièces' },
            { icon: BedDouble, value: nombreChambres, unit: '', label: 'Chambres' },
            { icon: Bath, value: nombreSDB, unit: '', label: 'SDB' }
          ].map((metric, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex flex-col items-center justify-center py-4 px-2 rounded-xl",
                isLuxe 
                  ? "bg-amber-500/10 border border-amber-500/20" 
                  : "bg-white/5 border border-white/10"
              )}
            >
              <metric.icon className={cn("h-5 w-5 mb-2", isLuxe ? "text-amber-400" : "text-white/40")} />
              <div className="flex items-baseline gap-0.5">
                <span className={cn("text-xl font-bold", isLuxe ? "text-amber-300" : "text-white")}>
                  {metric.value > 0 ? metric.value : '-'}
                </span>
                {metric.unit && <span className="text-xs text-white/40">{metric.unit}</span>}
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wide mt-1">{metric.label}</span>
            </div>
          ))}
        </div>

        {/* 3. Surfaces détaillées - grille 2x2 */}
        {surfacesDetails.length > 0 && (
          <div>
            <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">Surfaces annexes</h3>
            <div className="grid grid-cols-2 gap-3">
              {surfacesDetails.map((item, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex justify-between items-center px-4 py-3 rounded-lg",
                    isLuxe ? "bg-amber-500/5 border border-amber-500/10" : "bg-white/5 border border-white/5"
                  )}
                >
                  <span className="text-white/70">{item.label}</span>
                  <span className="text-white font-medium">
                    {typeof item.value === 'number' ? `${item.value} ${item.unit}` : item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Config Immeuble (appartement) ou Config Maison */}
        <div>
          <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">
            {isMaison ? 'Configuration' : 'Configuration immeuble'}
          </h3>
          <div className="space-y-2">
            {isMaison ? (
              // Config Maison
              <>
                {nombreNiveaux > 0 && (
                  <ConfigRow icon={<Layers className="h-4 w-4" />} label="Niveaux" value={`${nombreNiveaux}`} isLuxe={isLuxe} />
                )}
                {surfaceTerrain > 0 && (
                  <ConfigRow icon={<TreePine className="h-4 w-4" />} label="Surface terrain" value={`${surfaceTerrain} m²`} isLuxe={isLuxe} />
                )}
                <ConfigRow 
                  icon={<Waves className="h-4 w-4" />} 
                  label="Piscine" 
                  value={piscine} 
                  isBoolean 
                  isLuxe={isLuxe} 
                />
              </>
            ) : (
              // Config Appartement
              <>
                {(etage > 0 || etage === 0) && nombreEtagesImmeuble > 0 && (
                  <ConfigRow 
                    icon={<Building2 className="h-4 w-4" />} 
                    label="Étage" 
                    value={`${etage === 0 ? 'RDC' : etage + 'e'} sur ${nombreEtagesImmeuble} étages`} 
                    isLuxe={isLuxe} 
                  />
                )}
                <ConfigRow 
                  icon={<Layers className="h-4 w-4" />} 
                  label="Ascenseur" 
                  value={ascenseur} 
                  isBoolean 
                  isLuxe={isLuxe} 
                />
                <ConfigRow 
                  icon={<Eye className="h-4 w-4" />} 
                  label="Dernier étage" 
                  value={dernierEtage} 
                  isBoolean 
                  isLuxe={isLuxe} 
                />
              </>
            )}
          </div>
        </div>

        {/* 5. Équipements techniques */}
        {(chauffage || vitrage || cecb || chargesMensuelles > 0) && (
          <div>
            <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">Équipements</h3>
            <div className="grid grid-cols-2 gap-3">
              {chauffage && (
                <TechCard 
                  icon={<Thermometer className="h-4 w-4" />} 
                  label="Chauffage" 
                  value={CHAUFFAGE_LABELS[chauffage] || chauffage} 
                  isLuxe={isLuxe} 
                />
              )}
              {vitrage && (
                <TechCard 
                  icon={<Layers className="h-4 w-4" />} 
                  label="Vitrage" 
                  value={VITRAGE_LABELS[vitrage] || vitrage} 
                  isLuxe={isLuxe} 
                />
              )}
              {cecb && (
                <TechCard 
                  icon={<Gauge className="h-4 w-4" />} 
                  label="CECB" 
                  value={cecb.toUpperCase()} 
                  isLuxe={isLuxe} 
                />
              )}
              {chargesMensuelles > 0 && (
                <TechCard 
                  icon={<Home className="h-4 w-4" />} 
                  label="Charges" 
                  value={`CHF ${chargesMensuelles}/mois`} 
                  isLuxe={isLuxe} 
                />
              )}
            </div>
          </div>
        )}

        {/* 6. Exposition & Vue */}
        {(exposition.length > 0 || vue) && (
          <div>
            <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">Exposition & Vue</h3>
            <div className="flex flex-wrap gap-4">
              {/* Exposition cardinale */}
              {exposition.length > 0 && (
                <div className="flex items-center gap-2">
                  <Compass className={cn("h-5 w-5", isLuxe ? "text-amber-400" : "text-white/50")} />
                  <div className="flex gap-1">
                    {['nord', 'est', 'sud', 'ouest'].map(dir => {
                      const isActive = exposition.includes(dir);
                      return (
                        <span 
                          key={dir}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                            isActive 
                              ? isLuxe 
                                ? "bg-amber-500/30 text-amber-300 border border-amber-500/50" 
                                : "bg-primary/30 text-primary border border-primary/50"
                              : "bg-white/5 text-white/30 border border-white/10"
                          )}
                        >
                          {EXPOSITION_LABELS[dir]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Vue */}
              {vue && (
                <Badge 
                  variant="secondary"
                  className={cn(
                    "px-3 py-1.5",
                    isLuxe 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
                      : "bg-white/10 text-white border-white/20"
                  )}
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  {VUE_LABELS[vue] || vue}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 7. Stationnement */}
        {hasParking && (
          <div>
            <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">Stationnement</h3>
            <div className="flex flex-wrap gap-2">
              {parkingInterieur > 0 && (
                <ParkingBadge label="Intérieur" count={parkingInterieur} isLuxe={isLuxe} />
              )}
              {parkingExterieur > 0 && (
                <ParkingBadge label="Extérieur" count={parkingExterieur} isLuxe={isLuxe} />
              )}
              {box > 0 && (
                <ParkingBadge label="Box" count={box} isLuxe={isLuxe} />
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

// Composant ligne de config (check/cross)
function ConfigRow({ 
  icon, 
  label, 
  value, 
  isBoolean = false,
  isLuxe = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | boolean | undefined; 
  isBoolean?: boolean;
  isLuxe?: boolean;
}) {
  const isTrue = value === true || value === 'oui';
  const isFalse = value === false || value === 'non' || value === undefined;
  
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 rounded-lg",
      isLuxe ? "bg-amber-500/5 border border-amber-500/10" : "bg-white/5 border border-white/5"
    )}>
      <div className="flex items-center gap-3">
        <span className={isLuxe ? "text-amber-400" : "text-white/50"}>{icon}</span>
        <span className="text-white/70">{label}</span>
      </div>
      {isBoolean ? (
        isTrue ? (
          <Check className="h-5 w-5 text-green-400" />
        ) : (
          <X className="h-5 w-5 text-white/30" />
        )
      ) : (
        <span className="text-white font-medium">{value || '-'}</span>
      )}
    </div>
  );
}

// Composant carte technique
function TechCard({ 
  icon, 
  label, 
  value,
  isLuxe = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  isLuxe?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg",
      isLuxe ? "bg-amber-500/5 border border-amber-500/10" : "bg-white/5 border border-white/5"
    )}>
      <span className={isLuxe ? "text-amber-400" : "text-white/50"}>{icon}</span>
      <div>
        <p className="text-white/40 text-xs">{label}</p>
        <p className="text-white font-medium">{value}</p>
      </div>
    </div>
  );
}

// Composant badge parking
function ParkingBadge({ 
  label, 
  count,
  isLuxe = false 
}: { 
  label: string; 
  count: number;
  isLuxe?: boolean;
}) {
  return (
    <Badge 
      variant="secondary"
      className={cn(
        "px-3 py-1.5",
        isLuxe 
          ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
          : "bg-white/10 text-white border-white/20"
      )}
    >
      <Car className="h-3 w-3 mr-1.5" />
      {label} × {count}
    </Badge>
  );
}
