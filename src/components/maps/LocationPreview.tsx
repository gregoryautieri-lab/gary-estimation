import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, MapPin, Move, Loader2 } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";

interface LocationPreviewProps {
  coordinates: { lat: number; lng: number } | null;
  onMapStateChange?: (state: MapState) => void;
  initialMapState?: MapState;
  className?: string;
}

export interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  mapType: "hybrid" | "satellite" | "roadmap";
  markerPosition: { lat: number; lng: number };
}

const mapContainerStyle = {
  width: "100%",
  height: "250px",
  borderRadius: "8px",
};

const MAP_TYPE_OPTIONS = [
  { value: "hybrid", label: "Satellite + Rues" },
  { value: "satellite", label: "Satellite" },
  { value: "roadmap", label: "Plan" },
];

// Composant interne qui utilise Google Maps une fois la clé chargée
const GoogleMapComponent: React.FC<LocationPreviewProps & { apiKey: string }> = ({
  coordinates,
  onMapStateChange,
  initialMapState,
  className = "",
  apiKey,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const defaultCenter = coordinates || { lat: 46.2044, lng: 6.1432 }; // Genève par défaut

  const [mapState, setMapState] = useState<MapState>(
    initialMapState || {
      center: defaultCenter,
      zoom: 18,
      mapType: "hybrid",
      markerPosition: defaultCenter,
    }
  );

  // Mettre à jour quand les coordonnées changent
  useEffect(() => {
    if (coordinates && !initialMapState) {
      setMapState((prev) => ({
        ...prev,
        center: coordinates,
        markerPosition: coordinates,
      }));
    }
  }, [coordinates, initialMapState]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(mapState.zoom + 1, 21);
    setMapState((prev) => ({ ...prev, zoom: newZoom }));
    if (mapRef.current) {
      mapRef.current.setZoom(newZoom);
    }
    notifyChange({ ...mapState, zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(mapState.zoom - 1, 10);
    setMapState((prev) => ({ ...prev, zoom: newZoom }));
    if (mapRef.current) {
      mapRef.current.setZoom(newZoom);
    }
    notifyChange({ ...mapState, zoom: newZoom });
  };

  const handleMapTypeChange = (value: string) => {
    const newMapType = value as MapState["mapType"];
    setMapState((prev) => ({ ...prev, mapType: newMapType }));
    notifyChange({ ...mapState, mapType: newMapType });
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMapState((prev) => ({ ...prev, markerPosition: newPosition }));
      notifyChange({ ...mapState, markerPosition: newPosition });
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (isAdjusting && e.latLng) {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMapState((prev) => ({ ...prev, markerPosition: newPosition }));
      notifyChange({ ...mapState, markerPosition: newPosition });
    }
  };

  const handleCenterChange = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        const newCenter = { lat: center.lat(), lng: center.lng() };
        setMapState((prev) => ({ ...prev, center: newCenter }));
      }
    }
  };

  const notifyChange = (state: MapState) => {
    if (onMapStateChange) {
      onMapStateChange(state);
    }
  };

  const toggleAdjustMode = () => {
    setIsAdjusting(!isAdjusting);
  };

  if (loadError) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground">
        Erreur de chargement de la carte
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground animate-pulse h-[250px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Chargement de la carte...
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Aperçu localisation
        </div>
        <div className="flex items-center gap-2">
          <Select value={mapState.mapType} onValueChange={handleMapTypeChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAP_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleZoomOut}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs w-8 text-center">{mapState.zoom}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleZoomIn}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="relative rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapState.center}
          zoom={mapState.zoom}
          mapTypeId={mapState.mapType}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onDragEnd={handleCenterChange}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker
            position={mapState.markerPosition}
            draggable={isAdjusting}
            onDragEnd={handleMarkerDragEnd}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 24 16 24s16-12 16-24c0-8.836-7.164-16-16-16z" fill="#FA4238"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 40),
              anchor: new google.maps.Point(16, 40),
            }}
          />
        </GoogleMap>
      </div>

      {/* Bouton ajuster */}
      <Button
        variant={isAdjusting ? "default" : "outline"}
        className="w-full"
        onClick={toggleAdjustMode}
      >
        <Move className="h-4 w-4 mr-2" />
        {isAdjusting ? "Terminer l'ajustement" : "Ajuster la position"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Cette carte sera incluse dans le PDF
      </p>
    </div>
  );
};

// Composant principal qui gère le chargement de la clé API
export const LocationPreview: React.FC<LocationPreviewProps> = (props) => {
  const { apiKey, loading, error } = useGoogleMapsKey();
  const { coordinates, className = "" } = props;

  if (!coordinates) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Aperçu localisation
        </div>
        <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground h-[250px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <MapPin className="h-8 w-8 opacity-50" />
            <span>Sélectionnez une adresse pour afficher la carte</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Aperçu localisation
        </div>
        <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground animate-pulse h-[250px] flex items-center justify-center">
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
          <MapPin className="h-4 w-4 text-primary" />
          Aperçu localisation
        </div>
        <div className="bg-muted rounded-lg p-4 text-center text-destructive h-[250px] flex items-center justify-center">
          {error || "Impossible de charger la carte"}
        </div>
      </div>
    );
  }

  return <GoogleMapComponent {...props} apiKey={apiKey} />;
};

export default LocationPreview;
