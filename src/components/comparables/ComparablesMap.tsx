import React, { useCallback, useRef, useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { Loader2, MapPin, CheckCircle2, Circle, Home } from "lucide-react";
import { Comparable } from "@/types/estimation";
import { formatPriceCHF } from "@/hooks/useEstimationCalcul";

interface ComparablesMapProps {
  bienPrincipal: {
    coordinates: { lat: number; lng: number } | null;
    adresse?: string;
    prixEstime?: number;
  };
  comparablesVendus: Comparable[];
  comparablesEnVente: Comparable[];
  className?: string;
}

interface MarkerData {
  id: string;
  type: 'principal' | 'vendu' | 'enVente';
  position: { lat: number; lng: number };
  adresse: string;
  prix: number;
  surface?: number;
  prixM2?: number;
  dateInfo?: string;
  commentaire?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "12px",
};

// Marqueurs SVG personnalisés
const MARKER_ICONS = {
  principal: `<svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28c0-11-9-20-20-20z" fill="#FA4238"/>
    <path d="M20 10l-8 7v11h5v-6h6v6h5V17l-8-7z" fill="white"/>
  </svg>`,
  vendu: `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7 0 0 7 0 16c0 12 16 24 16 24s16-12 16-24c0-9-7-16-16-16z" fill="#10b981"/>
    <path d="M12 16l3 3 6-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  enVente: `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7 0 0 7 0 16c0 12 16 24 16 24s16-12 16-24c0-9-7-16-16-16z" fill="#f59e0b"/>
    <circle cx="16" cy="16" r="5" fill="white"/>
  </svg>`,
};

// Composant interne avec Google Maps
const MapContent: React.FC<ComparablesMapProps & { apiKey: string }> = ({
  bienPrincipal,
  comparablesVendus,
  comparablesEnVente,
  className = "",
  apiKey,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Géocoder les adresses des comparables
  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!geocoder.current || !address) return null;
    
    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.current!.geocode({ address: address + ", Suisse" }, (results, status) => {
          if (status === "OK" && results) {
            resolve(results);
          } else {
            reject(new Error(status));
          }
        });
      });
      
      if (result[0]) {
        return {
          lat: result[0].geometry.location.lat(),
          lng: result[0].geometry.location.lng(),
        };
      }
    } catch (e) {
      console.warn("Geocoding failed for:", address);
    }
    return null;
  }, []);

  // Initialiser la carte
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoder.current = new google.maps.Geocoder();
    setMapReady(true);
  }, []);

  // Ajuster les bounds quand les markers ou la carte changent
  useEffect(() => {
    if (!mapReady || !mapRef.current || markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(m => bounds.extend(m.position));
    
    if (markers.length > 1) {
      mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else {
      mapRef.current.setCenter(markers[0].position);
      mapRef.current.setZoom(15);
    }
  }, [markers, mapReady]);

  // Préparer les marqueurs en utilisant les coordonnées stockées (priorité) ou géocoder si nécessaire
  useEffect(() => {
    const prepareMarkers = async () => {
      if (!geocoder.current) return;
      
      console.log("Preparing markers...", { 
        vendus: comparablesVendus.length, 
        enVente: comparablesEnVente.length,
        principal: bienPrincipal.coordinates 
      });
      
      const newMarkers: MarkerData[] = [];
      
      // Ajouter le bien principal
      if (bienPrincipal.coordinates) {
        newMarkers.push({
          id: 'principal',
          type: 'principal',
          position: bienPrincipal.coordinates,
          adresse: bienPrincipal.adresse || 'Bien en estimation',
          prix: bienPrincipal.prixEstime || 0,
        });
      }
      
      // Traiter les comparables vendus
      for (let i = 0; i < comparablesVendus.length; i++) {
        const comp = comparablesVendus[i];
        if (!comp.adresse) continue;
        
        const prix = parseFloat(comp.prix) || 0;
        const surface = parseFloat(comp.surface) || 0;
        
        // Utiliser les coordonnées stockées si disponibles
        let position = comp.coordinates;
        
        // Sinon essayer de géocoder (fallback)
        if (!position) {
          console.log("Geocoding vendu (fallback):", comp.adresse);
          position = await geocodeAddress(comp.adresse) || undefined;
        }
        
        if (position) {
          newMarkers.push({
            id: `vendu-${i}`,
            type: 'vendu',
            position,
            adresse: comp.adresse,
            prix,
            surface: surface || undefined,
            prixM2: surface > 0 ? Math.round(prix / surface) : undefined,
            dateInfo: comp.dateVente,
            commentaire: comp.commentaire,
          });
        }
      }
      
      // Traiter les comparables en vente
      for (let i = 0; i < comparablesEnVente.length; i++) {
        const comp = comparablesEnVente[i];
        if (!comp.adresse) continue;
        
        const prix = parseFloat(comp.prix) || 0;
        const surface = parseFloat(comp.surface) || 0;
        
        // Utiliser les coordonnées stockées si disponibles
        let position = comp.coordinates;
        
        // Sinon essayer de géocoder (fallback)
        if (!position) {
          console.log("Geocoding enVente (fallback):", comp.adresse);
          position = await geocodeAddress(comp.adresse) || undefined;
        }
        
        if (position) {
          newMarkers.push({
            id: `enVente-${i}`,
            type: 'enVente',
            position,
            adresse: comp.adresse,
            prix,
            surface: surface || undefined,
            prixM2: surface > 0 ? Math.round(prix / surface) : undefined,
            dateInfo: comp.dureeEnVente,
            commentaire: comp.commentaire,
          });
        }
      }
      
      console.log("Total markers:", newMarkers.length, newMarkers.map(m => ({ type: m.type, hasCoords: !!m.position })));
      setMarkers(newMarkers);
    };
    
    // Attendre que le geocoder soit initialisé
    const checkAndPrepare = () => {
      if (geocoder.current) {
        prepareMarkers();
      } else {
        // Réessayer après un court délai si le geocoder n'est pas encore prêt
        setTimeout(checkAndPrepare, 500);
      }
    };
    
    checkAndPrepare();
  }, [bienPrincipal, comparablesVendus, comparablesEnVente, geocodeAddress]);

  const defaultCenter = bienPrincipal.coordinates || { lat: 46.2044, lng: 6.1432 };

  if (loadError) {
    return (
      <div className="bg-muted rounded-xl p-4 text-center text-muted-foreground h-[300px] flex items-center justify-center">
        Erreur de chargement de la carte
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-muted rounded-xl p-4 animate-pulse h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Chargement de la carte...
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Bien estimé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Vendus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">En vente</span>
        </div>
      </div>

      {/* Carte */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={14}
          onLoad={onLoad}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { featureType: "poi", stylers: [{ visibility: "off" }] },
              { featureType: "transit", stylers: [{ visibility: "off" }] },
            ],
          }}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              onClick={() => setSelectedMarker(marker)}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(MARKER_ICONS[marker.type]),
                scaledSize: new google.maps.Size(marker.type === 'principal' ? 40 : 32, marker.type === 'principal' ? 48 : 40),
                anchor: new google.maps.Point(marker.type === 'principal' ? 20 : 16, marker.type === 'principal' ? 48 : 40),
              }}
            />
          ))}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-1 min-w-[180px]">
                <div className="flex items-center gap-2 mb-1">
                  {selectedMarker.type === 'principal' && <Home className="h-4 w-4 text-primary" />}
                  {selectedMarker.type === 'vendu' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {selectedMarker.type === 'enVente' && <Circle className="h-4 w-4 text-amber-500" />}
                  <span className="font-medium text-sm">
                    {selectedMarker.type === 'principal' ? 'Bien estimé' : 
                     selectedMarker.type === 'vendu' ? 'Vendu' : 'En vente'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{selectedMarker.adresse}</p>
                {selectedMarker.prix > 0 && (
                  <p className="font-bold text-sm">{formatPriceCHF(selectedMarker.prix)}</p>
                )}
                {selectedMarker.prixM2 && (
                  <p className="text-xs text-gray-500">{selectedMarker.prixM2.toLocaleString('fr-CH')} CHF/m²</p>
                )}
                {selectedMarker.dateInfo && (
                  <p className="text-xs text-gray-500 mt-1">{selectedMarker.dateInfo}</p>
                )}
                {selectedMarker.commentaire && (
                  <p className="text-xs text-gray-400 italic mt-1">{selectedMarker.commentaire}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Stats rapides */}
      {markers.length > 1 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-card border border-border rounded-lg p-2">
            <p className="text-lg font-bold text-primary">
              {markers.filter(m => m.type === 'principal').length}
            </p>
            <p className="text-xs text-muted-foreground">Estimé</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <p className="text-lg font-bold text-green-500">
              {markers.filter(m => m.type === 'vendu').length}
            </p>
            <p className="text-xs text-muted-foreground">Vendus</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <p className="text-lg font-bold text-amber-500">
              {markers.filter(m => m.type === 'enVente').length}
            </p>
            <p className="text-xs text-muted-foreground">En vente</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant principal
export const ComparablesMap: React.FC<ComparablesMapProps> = (props) => {
  const { apiKey, loading, error } = useGoogleMapsKey();
  const { comparablesVendus, comparablesEnVente, bienPrincipal, className = "" } = props;

  // Vérifier s'il y a des comparables à afficher
  const hasComparables = comparablesVendus.some(c => c.adresse) || comparablesEnVente.some(c => c.adresse);

  if (!hasComparables && !bienPrincipal.coordinates) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-blue-500" />
          Carte des comparables
        </div>
        <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ajoutez des comparables avec une adresse pour les visualiser sur la carte</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-blue-500" />
          Carte des comparables
        </div>
        <div className="bg-muted rounded-xl p-4 animate-pulse h-[300px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Chargement...
        </div>
      </div>
    );
  }

  if (error || !apiKey) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-blue-500" />
          Carte des comparables
        </div>
        <div className="bg-muted rounded-xl p-4 text-center text-destructive h-[200px] flex items-center justify-center">
          {error || "Impossible de charger la carte"}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="h-4 w-4 text-blue-500" />
        Carte des comparables
      </div>
      <MapContent {...props} apiKey={apiKey} />
    </div>
  );
};

export default ComparablesMap;
