import { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';
import { Search, Trash2, Camera, Loader2, MapPin, Pentagon, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useZoneCapture, type GeoJsonPolygon } from '@/hooks/useZoneCapture';
import { cn } from '@/lib/utils';

const LIBRARIES: ("drawing" | "places")[] = ['drawing', 'places'];

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '400px',
};

const DEFAULT_CENTER = { lat: 46.2044, lng: 6.1432 }; // Genève
const DEFAULT_ZOOM = 14;

// Options de style pour les zones dessinées
const ZONE_OPTIONS = {
  fillColor: '#FA4238',
  fillOpacity: 0.3,
  strokeColor: '#FA4238',
  strokeWeight: 2,
  editable: true,
  draggable: true,
};

interface ZoneDrawerProps {
  commune: string;
  initialZone?: GeoJsonPolygon | null;
  onZoneCaptured?: (imageUrl: string, geoJson: GeoJsonPolygon) => void;
  readOnly?: boolean;
  missionId?: string;
  className?: string;
}

// Composant interne qui utilise l'API une fois la clé chargée
function ZoneDrawerMap({
  commune,
  initialZone,
  onZoneCaptured,
  readOnly = false,
  missionId,
  apiKey,
}: ZoneDrawerProps & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<google.maps.Polygon | google.maps.Rectangle | null>(null);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'rectangle' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [hasZone, setHasZone] = useState(false);

  const { capturing, error: captureError, captureZone } = useZoneCapture();

  // Géocoder la commune pour centrer la carte
  useEffect(() => {
    if (!isLoaded || !commune) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: `${commune}, Genève, Suisse` },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setCenter({ lat: location.lat(), lng: location.lng() });
          if (mapRef.current) {
            mapRef.current.panTo(location);
          }
        }
      }
    );
  }, [isLoaded, commune]);

  // Charger une zone initiale si fournie
  useEffect(() => {
    if (!isLoaded || !initialZone || !mapRef.current) return;

    if (initialZone.coordinates && initialZone.coordinates[0]) {
      const coords = initialZone.coordinates[0].map(([lng, lat]) => ({
        lat,
        lng,
      }));

      const polygon = new google.maps.Polygon({
        paths: coords,
        ...ZONE_OPTIONS,
        editable: !readOnly,
        draggable: !readOnly,
      });
      polygon.setMap(mapRef.current);
      shapeRef.current = polygon;
      setHasZone(true);

      // Centrer sur le polygone
      const bounds = new google.maps.LatLngBounds();
      coords.forEach((coord) => bounds.extend(coord));
      mapRef.current.fitBounds(bounds);
    }
  }, [isLoaded, initialZone, readOnly]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handlePolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      if (shapeRef.current) {
        shapeRef.current.setMap(null);
      }
      shapeRef.current = polygon;
      setHasZone(true);
      setDrawingMode(null);
    },
    []
  );

  const handleRectangleComplete = useCallback(
    (rectangle: google.maps.Rectangle) => {
      if (shapeRef.current) {
        shapeRef.current.setMap(null);
      }
      shapeRef.current = rectangle;
      setHasZone(true);
      setDrawingMode(null);
    },
    []
  );

  const handleClearZone = useCallback(() => {
    if (shapeRef.current) {
      shapeRef.current.setMap(null);
      shapeRef.current = null;
      setHasZone(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!isLoaded || !searchValue.trim() || !mapRef.current) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: `${searchValue}, Genève, Suisse` },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          mapRef.current?.panTo(location);
          mapRef.current?.setZoom(16);
        }
      }
    );
  }, [isLoaded, searchValue]);

  // Extraire les coordonnées de la forme actuelle
  const getShapeCoordinates = useCallback((): [number, number][] => {
    const shape = shapeRef.current;
    if (!shape) return [];

    let coordinates: [number, number][] = [];

    if (shape instanceof google.maps.Polygon) {
      const path = shape.getPath();
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i);
        coordinates.push([latLng.lng(), latLng.lat()]);
      }
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]); // Fermer le polygone
      }
    } else if (shape instanceof google.maps.Rectangle) {
      const bounds = shape.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        coordinates = [
          [sw.lng(), sw.lat()],
          [ne.lng(), sw.lat()],
          [ne.lng(), ne.lat()],
          [sw.lng(), ne.lat()],
          [sw.lng(), sw.lat()],
        ];
      }
    }

    return coordinates;
  }, []);

  const handleCapture = useCallback(async () => {
    if (!mapContainerRef.current) return;

    const result = await captureZone(
      mapContainerRef.current,
      getShapeCoordinates,
      missionId
    );

    if (result && onZoneCaptured) {
      onZoneCaptured(result.imageUrl, result.geoJson);
    }
  }, [captureZone, getShapeCoordinates, missionId, onZoneCaptured]);

  // Convertir le mode de dessin en type Google Maps
  const googleDrawingMode = drawingMode === 'polygon' 
    ? google.maps.drawing.OverlayType.POLYGON 
    : drawingMode === 'rectangle' 
    ? google.maps.drawing.OverlayType.RECTANGLE 
    : null;

  if (loadError) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 flex flex-col items-center justify-center h-[400px]">
          <MapPin className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">Erreur de chargement de la carte</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Initialisation de la carte...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      {!readOnly && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une adresse..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Barre d'outils de dessin */}
      {!readOnly && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={drawingMode === 'polygon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
          >
            <Pentagon className="h-4 w-4 mr-1" />
            Polygone
          </Button>
          <Button
            variant={drawingMode === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDrawingMode(drawingMode === 'rectangle' ? null : 'rectangle')}
          >
            <Square className="h-4 w-4 mr-1" />
            Rectangle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearZone}
            disabled={!hasZone}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        </div>
      )}

      {/* Carte */}
      <div ref={mapContainerRef} className="rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center}
          zoom={DEFAULT_ZOOM}
          onLoad={onMapLoad}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {!readOnly && (
            <DrawingManager
              drawingMode={googleDrawingMode}
              onPolygonComplete={handlePolygonComplete}
              onRectangleComplete={handleRectangleComplete}
              options={{
                drawingControl: false,
                polygonOptions: ZONE_OPTIONS,
                rectangleOptions: ZONE_OPTIONS,
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Bouton capture */}
      {!readOnly && (
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleCapture}
            disabled={!hasZone || capturing}
            className="w-full"
          >
            {capturing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Capture en cours...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Capturer l'image de la zone
              </>
            )}
          </Button>
          {captureError && (
            <p className="text-sm text-destructive text-center">{captureError}</p>
          )}
          {!hasZone && (
            <p className="text-xs text-muted-foreground text-center">
              Dessinez une zone sur la carte pour pouvoir capturer
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Composant principal qui charge la clé API
export function ZoneDrawer(props: ZoneDrawerProps) {
  const { apiKey, loading, error } = useGoogleMapsKey();

  if (loading) {
    return (
      <Card className={cn('border-dashed', props.className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !apiKey) {
    return (
      <Card className={cn('border-destructive', props.className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center h-[400px]">
          <MapPin className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">Erreur de chargement</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return <ZoneDrawerMap {...props} apiKey={apiKey} />;
}
