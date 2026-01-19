// ============================================
// Écran 3 : Localisation et Proximités
// Google Maps + Adresse + Cadastre + Proximités
// ============================================

import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { 
  MapPin, 
  Bus, 
  Train, 
  GraduationCap, 
  ShoppingBag, 
  TreePine,
  Building2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import type { Identification, Proximite, CadastreData } from '@/types/estimation';

interface PresentationLocationProps {
  identification: Identification;
  isLuxe?: boolean;
}

// Style de carte sobre/luxe
const MAP_STYLES_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
];

// Catégories de proximités
interface ProximiteCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  types: string[];
}

const PROXIMITE_CATEGORIES: ProximiteCategory[] = [
  { 
    key: 'transports', 
    label: 'Transports', 
    icon: <Bus className="h-4 w-4" />,
    types: ['transport_bus', 'transport_tram', 'transport']
  },
  { 
    key: 'ecoles', 
    label: 'Écoles', 
    icon: <GraduationCap className="h-4 w-4" />,
    types: ['ecole']
  },
  { 
    key: 'commerces', 
    label: 'Commerces', 
    icon: <ShoppingBag className="h-4 w-4" />,
    types: ['commerce']
  },
  { 
    key: 'nature', 
    label: 'Nature', 
    icon: <TreePine className="h-4 w-4" />,
    types: ['nature']
  }
];

// Composant carte séparé pour éviter le re-render du loader
function MapContainer({ 
  apiKey, 
  coordinates, 
  isLuxe 
}: { 
  apiKey: string; 
  coordinates: { lat: number; lng: number }; 
  isLuxe: boolean;
}) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-presentation',
    googleMapsApiKey: apiKey,
  });

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={coordinates}
      zoom={16}
      options={{
        styles: MAP_STYLES_DARK,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }}
    >
      <Marker 
        position={coordinates}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: isLuxe ? '#f59e0b' : '#FA4238',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }}
      />
    </GoogleMap>
  );
}

export function PresentationLocation({
  identification,
  isLuxe = false
}: PresentationLocationProps) {
  const { apiKey, loading: keyLoading } = useGoogleMapsKey();
  
  // Données adresse
  const adresse = identification?.adresse;
  const rue = adresse?.rue || '';
  const codePostal = adresse?.codePostal || '';
  const localite = adresse?.localite || '';
  const canton = adresse?.canton || 'Genève';
  const coordinates = adresse?.coordinates;
  const cadastre = adresse?.cadastreData;
  
  // Proximités
  const proximites = identification?.proximites || [];
  
  // Grouper les proximités par catégorie
  const groupedProximites = PROXIMITE_CATEGORIES.map(cat => ({
    ...cat,
    items: proximites
      .filter(p => cat.types.some(t => p.type?.includes(t) || p.type === t))
      .slice(0, 3) // Max 3 par catégorie
  })).filter(cat => cat.items.length > 0);

  const center = coordinates || { lat: 46.2044, lng: 6.1432 }; // Default: Genève

  return (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{ backgroundColor: '#1a2e35' }}
    >
      {/* 1. Carte Google Maps (60% hauteur) */}
      <div className="h-[60%] relative">
        {keyLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : apiKey && coordinates ? (
          <MapContainer 
            apiKey={apiKey} 
            coordinates={coordinates} 
            isLuxe={isLuxe} 
          />
        ) : (
          // Fallback si pas de coordonnées ou pas de clé
          <div className="h-full flex flex-col items-center justify-center bg-gray-800">
            <MapPin className={cn("h-12 w-12 mb-4", isLuxe ? "text-amber-400" : "text-primary")} />
            <p className="text-white text-lg font-medium">{rue}</p>
            <p className="text-white/50">{codePostal} {localite}</p>
          </div>
        )}
      </div>

      {/* 2-4. Infos sous la carte (40% hauteur, scrollable) */}
      <div className="h-[40%] overflow-auto px-6 py-5 space-y-5">
        
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

        {/* 4. Proximités par catégorie */}
        {groupedProximites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-white/60 text-sm font-medium uppercase tracking-wide">
              À proximité
            </h3>
            
            <div className="grid gap-4">
              {groupedProximites.map(category => (
                <div key={category.key}>
                  {/* Titre catégorie */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={isLuxe ? "text-amber-400" : "text-primary"}>
                      {category.icon}
                    </span>
                    <span className="text-white/70 text-sm font-medium">
                      {category.label}
                    </span>
                  </div>
                  
                  {/* Items */}
                  <div className="space-y-1.5 pl-6">
                    {category.items.map((prox, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-white/80">
                          {prox.libelle || prox.type}
                        </span>
                        <span className="text-white/40">
                          {prox.tempsMarche || prox.distance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si aucune proximité */}
        {groupedProximites.length === 0 && (
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
