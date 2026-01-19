import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { ComparableData } from '@/hooks/useProjectDetail';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectDetailMapProps {
  comparables: ComparableData[];
  onLocateComparable?: (comparable: ComparableData) => void;
  selectedComparableId?: string | null;
  className?: string;
}

const DEFAULT_CENTER = { lat: 46.2044, lng: 6.1432 }; // Genève

function formatPrice(price: number | null): string {
  if (!price) return '-';
  return new Intl.NumberFormat('fr-CH', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' CHF';
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

// Inner component that uses useJsApiLoader only when API key is ready
function MapContent({ 
  apiKey,
  comparables, 
  selectedComparableId,
  className 
}: {
  apiKey: string;
  comparables: ComparableData[];
  selectedComparableId?: string | null;
  className?: string;
}) {
  const [selectedMarker, setSelectedMarker] = useState<ComparableData | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Filter comparables with coordinates
  const geolocatedComparables = comparables.filter(
    c => c.coordinates && c.geocodingStatus !== 'missing'
  );
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

  // Center on selected comparable
  useEffect(() => {
    if (selectedComparableId && mapRef.current) {
      const comp = comparables.find(c => c.linkId === selectedComparableId);
      if (comp?.coordinates) {
        mapRef.current.panTo(comp.coordinates);
        mapRef.current.setZoom(16);
        setSelectedMarker(comp);
      }
    }
  }, [selectedComparableId, comparables]);

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
      <div className={cn("flex items-center justify-center bg-muted rounded-xl h-80", className)}>
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
      <div className={cn("flex items-center justify-center bg-muted rounded-xl h-80", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (geolocatedComparables.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted rounded-xl h-80", className)}>
        <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">Aucun comparable géolocalisé</p>
        <p className="text-sm text-muted-foreground mt-1">
          {comparables.length > 0 
            ? "Les adresses n'ont pas pu être localisées"
            : "Importez des comparables pour les voir sur la carte"
          }
        </p>
      </div>
    );
  }

  const center = geolocatedComparables[0]?.coordinates || DEFAULT_CENTER;

  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', minHeight: '400px' }}
        center={center}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          mapTypeId: 'hybrid',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {geolocatedComparables.map(comp => (
          <Marker
            key={comp.linkId}
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
            <div className="p-1 min-w-[200px] max-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getStatusColor(selectedMarker.statut)}>
                  {getStatusLabel(selectedMarker.statut)}
                </Badge>
                {selectedMarker.typeBien && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedMarker.typeBien}
                  </span>
                )}
              </div>
              <p className="font-semibold text-base mb-1">
                {formatPrice(selectedMarker.prixFinal)}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {selectedMarker.surface && <span>{selectedMarker.surface} m²</span>}
                {selectedMarker.pieces && <span>• {selectedMarker.pieces} pièces</span>}
              </div>
              <p className="text-sm text-foreground">
                {selectedMarker.adresse || 'Adresse non renseignée'}
              </p>
              {selectedMarker.localite && (
                <p className="text-xs text-muted-foreground">
                  {selectedMarker.codePostal} {selectedMarker.localite}
                </p>
              )}
              {selectedMarker.geocodingStatus === 'fallback' && (
                <p className="text-xs text-amber-600 mt-2">
                  📍 Position approximative (NPA)
                </p>
              )}
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

      {/* Missing coordinates warning */}
      {missingCount > 0 && (
        <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 shadow-sm">
          <p className="text-xs text-amber-700">
            ⚠️ {missingCount} bien{missingCount > 1 ? 's' : ''} sans coordonnées GPS
          </p>
        </div>
      )}
    </div>
  );
}

// Main component that waits for API key before rendering map
export function ProjectDetailMap({ 
  comparables, 
  onLocateComparable,
  selectedComparableId,
  className 
}: ProjectDetailMapProps) {
  const { apiKey, loading: loadingKey, error: keyError } = useGoogleMapsKey();

  // Loading state - waiting for API key
  if (loadingKey) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-xl h-80", className)}>
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
      <div className={cn("flex items-center justify-center bg-muted rounded-xl h-80", className)}>
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
      selectedComparableId={selectedComparableId}
      className={className}
    />
  );
}
