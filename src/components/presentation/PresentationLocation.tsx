// ============================================
// Écran 3 : Localisation et Proximités
// Google Maps Satellite + Adresse + Cadastre + Proximités scrollables
// ============================================

import React from 'react';
import { 
  MapPin, 
  Bus, 
  GraduationCap, 
  ShoppingBag, 
  TreePine,
  Loader2,
  Train,
  Car,
  Footprints
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PresentationLocationMap } from '@/components/presentation/PresentationLocationMap';
import type { Identification } from '@/types/estimation';

interface PresentationLocationProps {
  identification: Identification;
  isLuxe?: boolean;
  googleMapsApiKey?: string | null;
  googleMapsLoading?: boolean;
}

// Type pour une proximité
interface Proximite {
  type?: string;
  libelle?: string;
  distance?: string;
  tempsMarche?: string;
  icone?: string;
}

// ============================================
// Helpers pour calcul temps de trajet
// ============================================

function getTempsTrajet(distanceMeters: number): { temps: string; mode: 'pied' | 'voiture' } {
  if (distanceMeters < 1000) {
    // À pied : environ 80m/min = 4.8 km/h
    const minutes = Math.max(1, Math.round(distanceMeters / 80));
    return { temps: `${minutes} min`, mode: 'pied' };
  } else {
    // En voiture : environ 30 km/h en ville
    const minutes = Math.max(1, Math.round((distanceMeters / 1000) / 30 * 60));
    return { temps: `${minutes} min`, mode: 'voiture' };
  }
}

function parseDistance(distance: string | number | undefined): number {
  if (!distance) return 0;
  const distStr = String(distance).toLowerCase().trim();
  
  if (distStr.includes('km')) {
    return parseFloat(distStr) * 1000;
  } else if (distStr.includes('m')) {
    return parseFloat(distStr) || 0;
  } else {
    // Nombre brut, supposé en mètres
    return parseFloat(distStr) || 0;
  }
}

function formatDistanceAvecTemps(distance: string | number | undefined, tempsExistant?: string): string {
  // Si on a déjà un temps formaté, l'utiliser
  if (tempsExistant && tempsExistant.trim()) {
    const distMeters = parseDistance(distance);
    if (distMeters === 0) return tempsExistant;
    
    const distanceFormatee = distMeters >= 1000 
      ? `${(distMeters / 1000).toFixed(1)} km`
      : `${Math.round(distMeters)} m`;
    
    return `${distanceFormatee} • ${tempsExistant}`;
  }
  
  // Sinon calculer
  const distMeters = parseDistance(distance);
  if (distMeters === 0) return '—';
  
  const { temps, mode } = getTempsTrajet(distMeters);
  
  const distanceFormatee = distMeters >= 1000 
    ? `${(distMeters / 1000).toFixed(1)} km`
    : `${Math.round(distMeters)} m`;
  
  const modeLabel = mode === 'pied' ? 'à pied' : 'voiture';
  return `${distanceFormatee} • ${temps} (${modeLabel})`;
}

// ============================================
// Icônes par type de proximité
// ============================================

function getProximiteIcon(type?: string): React.ReactNode {
  const iconClass = "h-4 w-4";
  switch (type?.toLowerCase()) {
    case 'transport_bus':
    case 'transport':
      return <Bus className={iconClass} />;
    case 'transport_tram':
    case 'transport_train':
      return <Train className={iconClass} />;
    case 'ecole':
      return <GraduationCap className={iconClass} />;
    case 'commerce':
      return <ShoppingBag className={iconClass} />;
    case 'nature':
      return <TreePine className={iconClass} />;
    default:
      return <MapPin className={iconClass} />;
  }
}

function getModeIcon(mode: 'pied' | 'voiture'): React.ReactNode {
  const iconClass = "h-3 w-3";
  return mode === 'pied' 
    ? <Footprints className={iconClass} /> 
    : <Car className={iconClass} />;
}

// ============================================
// Composant ProximiteItem
// ============================================

function ProximiteItem({ proximite, isLuxe }: { proximite: Proximite; isLuxe: boolean }) {
  const distanceAvecTemps = formatDistanceAvecTemps(proximite.distance, proximite.tempsMarche);
  const hasContent = proximite.libelle?.trim() || distanceAvecTemps !== '—';
  
  if (!hasContent) return null;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className={cn(
        "p-2 rounded-lg shrink-0",
        isLuxe ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
      )}>
        {getProximiteIcon(proximite.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">
          {proximite.libelle || proximite.type || 'Point d\'intérêt'}
        </p>
        <p className="text-white/50 text-sm">{distanceAvecTemps}</p>
      </div>
    </div>
  );
}

// ============================================
// Composant Principal
// ============================================

export function PresentationLocation({
  identification,
  isLuxe = false,
  googleMapsApiKey,
  googleMapsLoading = false
}: PresentationLocationProps) {
  // Données adresse
  const adresse = identification?.adresse;
  const rue = adresse?.rue || '';
  const codePostal = adresse?.codePostal || '';
  const localite = adresse?.localite || '';
  const canton = adresse?.canton || 'Genève';
  const coordinates = adresse?.coordinates;
  const cadastre = adresse?.cadastreData;

  // Proximités - filtrer les items vides
  const proximites: Proximite[] = (identification?.proximites || []).filter(
    (p: Proximite) => p.libelle?.trim() || p.distance?.trim() || p.tempsMarche?.trim()
  );

  return (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{ backgroundColor: '#1a2e35' }}
    >
      {/* 1. Carte satellite dynamique (55% hauteur) avec légende */}
      <div className="h-[55%] relative">
        {!coordinates ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-800">
            <MapPin className={cn("h-12 w-12 mb-4", isLuxe ? "text-amber-400" : "text-primary")} />
            <p className="text-white text-lg font-medium">{rue}</p>
            <p className="text-white/50">{codePostal} {localite}</p>
          </div>
        ) : googleMapsLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : googleMapsApiKey ? (
          <>
            <PresentationLocationMap
              apiKey={googleMapsApiKey}
              center={coordinates}
              isLuxe={isLuxe}
              addressLabel={`${rue} ${codePostal} ${localite}`.trim()}
            />
            {/* Légende "Votre bien" overlay */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/70 backdrop-blur-sm">
                <div className={cn(
                  "h-3 w-3 rounded-full animate-pulse",
                  isLuxe ? "bg-amber-400" : "bg-primary"
                )} />
                <span className="text-white text-sm font-medium">Votre bien</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-800">
            <MapPin className={cn("h-12 w-12 mb-4", isLuxe ? "text-amber-400" : "text-primary")} />
            <p className="text-white/70 text-sm">Clé Google Maps indisponible</p>
            <p className="text-white text-lg font-medium">{rue}</p>
            <p className="text-white/50">{codePostal} {localite}</p>
          </div>
        )}
      </div>

      {/* 2-4. Infos sous la carte (45% hauteur, scrollable) */}
      <div className="h-[45%] overflow-auto px-6 py-5 space-y-5">
        
        {/* 2. Adresse complète */}
        <div>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              isLuxe ? "bg-amber-500/20" : "bg-primary/20"
            )}>
              <MapPin className={cn("h-5 w-5", isLuxe ? "text-amber-400" : "text-primary")} />
            </div>
            <div>
              <h2 className={cn(
                "text-xl font-bold",
                isLuxe ? "text-amber-300" : "text-white"
              )}>
                {rue}
              </h2>
              <p className="text-white/60">
                {codePostal} {localite}
                {canton && `, ${canton}`}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Informations cadastrales */}
        {cadastre && (cadastre.numeroParcelle || cadastre.zone) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/40">
            {cadastre.numeroParcelle && (
              <span>Parcelle n° {cadastre.numeroParcelle}</span>
            )}
            {cadastre.zone && (
              <span>Zone : {cadastre.zone}</span>
            )}
            {cadastre.commune && (
              <span>Commune : {cadastre.commune}</span>
            )}
          </div>
        )}

        {/* 4. Proximités - scrollable */}
        {proximites.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              À proximité
            </h3>
            
            {/* Container scrollable */}
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {proximites.map((prox, idx) => (
                <ProximiteItem key={idx} proximite={prox} isLuxe={isLuxe} />
              ))}
            </div>
          </div>
        )}

        {/* Message si aucune proximité */}
        {proximites.length === 0 && (
          <div className={cn(
            "p-4 rounded-xl text-center",
            isLuxe 
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-white/5 border border-white/10"
          )}>
            <p className="text-white/50 text-sm">
              Quartier résidentiel avec excellente desserte
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}
