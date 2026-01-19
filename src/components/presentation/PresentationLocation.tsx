// ============================================
// Écran 3 : Localisation et Proximités
// Google Maps Static + Adresse + Cadastre + Proximités
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Bus, 
  GraduationCap, 
  ShoppingBag, 
  TreePine,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { PresentationLocationMap } from '@/components/presentation/PresentationLocationMap';
import type { Identification } from '@/types/estimation';

interface PresentationLocationProps {
  identification: Identification;
  isLuxe?: boolean;
}

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

// Hook pour charger la carte statique via le proxy
function useStaticMap(coordinates: { lat: number; lng: number } | undefined) {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coordinates) return;

    const fetchMap = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('static-map-proxy', {
          body: {
            type: 'google',
            lat: coordinates.lat,
            lng: coordinates.lng,
            zoom: 16,
            mapType: 'roadmap'
          }
        });

        if (fnError) throw fnError;
        if (data?.image) {
          setMapImage(data.image);
        } else if (data?.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error('[PresentationLocation] Static map error:', err);
        setError(err instanceof Error ? err.message : 'Erreur chargement carte');
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [coordinates?.lat, coordinates?.lng]);

  return { mapImage, loading, error };
}

export function PresentationLocation({
  identification,
  isLuxe = false
}: PresentationLocationProps) {
  // Données adresse
  const adresse = identification?.adresse;
  const rue = adresse?.rue || '';
  const codePostal = adresse?.codePostal || '';
  const localite = adresse?.localite || '';
  const canton = adresse?.canton || 'Genève';
  const coordinates = adresse?.coordinates;
  const cadastre = adresse?.cadastreData;
  
  // Clé Google Maps (carte dynamique)
  const { apiKey, loading: apiKeyLoading, error: apiKeyError } = useGoogleMapsKey();

  // Proximités
  const proximites = identification?.proximites || [];
  
  // Grouper les proximités par catégorie (exclure les items vides)
  const groupedProximites = PROXIMITE_CATEGORIES.map(cat => ({
    ...cat,
    items: proximites
      .filter(p => 
        cat.types.some(t => p.type?.includes(t) || p.type === t) &&
        (p.libelle?.trim() || p.distance?.trim() || p.tempsMarche?.trim()) // Exclure les items sans contenu
      )
      .slice(0, 3) // Max 3 par catégorie
  })).filter(cat => cat.items.length > 0);

  return (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{ backgroundColor: '#1a2e35' }}
    >
      {/* 1. Carte satellite dynamique (60% hauteur) */}
      <div className="h-[60%] relative">
        {!coordinates ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-800">
            <MapPin className={cn("h-12 w-12 mb-4", isLuxe ? "text-amber-400" : "text-primary")} />
            <p className="text-white text-lg font-medium">{rue}</p>
            <p className="text-white/50">{codePostal} {localite}</p>
          </div>
        ) : apiKeyLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : apiKey ? (
          <PresentationLocationMap
            apiKey={apiKey}
            center={coordinates}
            isLuxe={isLuxe}
            addressLabel={`${rue} ${codePostal} ${localite}`.trim()}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-800">
            <MapPin className={cn("h-12 w-12 mb-4", isLuxe ? "text-amber-400" : "text-primary")} />
            <p className="text-white/70 text-sm">Clé Google Maps indisponible</p>
            <p className="text-white text-lg font-medium">{rue}</p>
            <p className="text-white/50">{codePostal} {localite}</p>
            {apiKeyError && (
              <p className="text-red-400/60 text-xs mt-2">{apiKeyError}</p>
            )}
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
