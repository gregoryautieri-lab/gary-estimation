import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { Loader2, MapPin, AlertTriangle, Building2, Home, Ruler, DoorOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ComparableResult {
  id: string;
  adresse: string;
  localite: string;
  prixFinal: number | null;
  typeBien: string;
  statut: string;
  surface: number | null;
  pieces: number | null;
  coordinates?: { lat: number; lng: number } | null;
}

interface ExploreMapProps {
  comparables: ComparableResult[];
  className?: string;
}

const DEFAULT_CENTER = { lat: 46.2044, lng: 6.1432 }; // Genève

function formatPrice(price: number | null): string {
  if (!price) return '-';
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(price);
}

function getStatusLabel(statut: string): string {
  switch (statut) {
    case 'mandat_signe': return 'Vendu';
    case 'presentee': return 'En vente';
    case 'en_cours': return 'En cours';
    case 'brouillon': return 'Brouillon';
    default: return statut;
  }
}

function getStatusColor(statut: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (statut) {
    case 'mandat_signe': return 'default';
    case 'presentee': return 'secondary';
    default: return 'outline';
  }
}

const TYPE_BIEN_ICONS: Record<string, React.ReactNode> = {
  appartement: <Building2 className="h-4 w-4" />,
  maison: <Home className="h-4 w-4" />,
  terrain: <MapPin className="h-4 w-4" />,
  commercial: <Building2 className="h-4 w-4" />,
  immeuble: <Building2 className="h-4 w-4" />,
};

// Inner component that uses useJsApiLoader only when API key is ready
function MapContent({ 
  apiKey,
  comparables, 
  className 
}: {
  apiKey: string;
  comparables: ComparableResult[];
  className?: string;
}) {
  const navigate = useNavigate();
  const [selectedMarker, setSelectedMarker] = useState<ComparableResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Filter comparables with coordinates
  const geolocatedComparables = comparables.filter(c => c.coordinates);
  const missingCount = comparables.length - geolocatedComparables.length;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  // Auto-zoom to fit all markers
  const fitBounds = useCallback(() => {
    if (!mapRef.current || geolocatedComparables.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    geolocatedComparables.forEach(c => {
      if (c.coordinates) {
        bounds.extend(c.coordinates);
      }
    });

    if (geolocatedComparables.length === 1 && geolocatedComparables[0].coordinates) {
      mapRef.current.setCenter(geolocatedComparables[0].coordinates);
      mapRef.current.setZoom(15);
    } else {
      mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [geolocatedComparables]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setTimeout(fitBounds, 100);
  }, [fitBounds]);

  // Re-fit bounds when comparables change
  useEffect(() => {
    if (mapRef.current && geolocatedComparables.length > 0) {
      fitBounds();
    }
  }, [geolocatedComparables.length, fitBounds]);

  // Get pin icon based on status
  const getPinIcon = (statut: string): string => {
    switch (statut) {
      case 'mandat_signe':
        return '/pin-blue.svg';
      case 'presentee':
        return '/pin-green.svg';
      default:
        return '/pin-gray.svg';
    }
  };

  if (loadError) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">Impossible de charger Google Maps</p>
          <p className="text-xs text-muted-foreground mt-1">{loadError?.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (geolocatedComparables.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted", className)}>
        <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">Aucun bien géolocalisé</p>
        <p className="text-sm text-muted-foreground mt-1 text-center px-4">
          Les adresses des {comparables.length} bien{comparables.length > 1 ? 's' : ''} trouvé{comparables.length > 1 ? 's' : ''} n'ont pas pu être localisées
        </p>
      </div>
    );
  }

  const center = geolocatedComparables[0]?.coordinates || DEFAULT_CENTER;

  return (
    <div className={cn("relative", className)}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          mapTypeId: 'hybrid',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {geolocatedComparables.map(comp => (
          <Marker
            key={comp.id}
            position={comp.coordinates!}
            icon={{
              url: getPinIcon(comp.statut),
              scaledSize: new google.maps.Size(36, 36),
            }}
            onClick={() => setSelectedMarker(comp)}
          />
        ))}

        {selectedMarker && selectedMarker.coordinates && (
          <InfoWindow
            position={selectedMarker.coordinates}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div 
              className="p-1 min-w-[200px] max-w-[280px] cursor-pointer"
              onClick={() => navigate(`/estimation/${selectedMarker.id}/overview`)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getStatusColor(selectedMarker.statut)}>
                  {getStatusLabel(selectedMarker.statut)}
                </Badge>
                {selectedMarker.typeBien && (
                  <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                    {TYPE_BIEN_ICONS[selectedMarker.typeBien]}
                    {selectedMarker.typeBien}
                  </span>
                )}
              </div>
              <p className="font-semibold text-base mb-1">
                {formatPrice(selectedMarker.prixFinal)}
              </p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                {selectedMarker.surface && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" />
                    {selectedMarker.surface} m²
                  </span>
                )}
                {selectedMarker.pieces && (
                  <span className="flex items-center gap-1">
                    <DoorOpen className="h-3.5 w-3.5" />
                    {selectedMarker.pieces} pièces
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">
                {selectedMarker.adresse || 'Adresse non renseignée'}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedMarker.localite}
              </p>
              <p className="text-xs text-primary mt-2 hover:underline">
                Voir le détail →
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Vendus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>En vente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Autres</span>
          </div>
        </div>
      </div>

      {/* Count & Missing warning */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
          <p className="text-sm font-medium">
            {geolocatedComparables.length} bien{geolocatedComparables.length > 1 ? 's' : ''} sur la carte
          </p>
        </div>
        {missingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 shadow-sm">
            <p className="text-xs text-amber-700">
              ⚠️ {missingCount} bien{missingCount > 1 ? 's' : ''} sans coordonnées
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component that waits for API key before rendering map
export function ExploreMap({ 
  comparables,
  className 
}: ExploreMapProps) {
  const { apiKey, loading: loadingKey, error: keyError } = useGoogleMapsKey();

  // Loading state - waiting for API key
  if (loadingKey) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // Error state - API key fetch failed
  if (keyError || !apiKey) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">Impossible de charger Google Maps</p>
          <p className="text-xs text-muted-foreground mt-1">{keyError || "Clé API non disponible"}</p>
        </div>
      </div>
    );
  }

  // API key is ready - render the map
  return (
    <MapContent
      apiKey={apiKey}
      comparables={comparables}
      className={className}
    />
  );
}
