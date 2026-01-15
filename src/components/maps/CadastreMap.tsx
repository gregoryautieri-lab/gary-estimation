import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, FileText } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface CadastreMapProps {
  coordinates: { lat: number; lng: number } | null;
  onZoomChange?: (zoom: number) => void;
  initialZoom?: number;
  className?: string;
}

// Composant pour synchroniser la vue de la carte
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  
  return null;
};

// Icône personnalisée pour le marqueur
const createCustomIcon = () => {
  return L.divIcon({
    html: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#FA4238" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `,
    className: "custom-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const CadastreMap: React.FC<CadastreMapProps> = ({
  coordinates,
  onZoomChange,
  initialZoom = 19,
  className = "",
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [mapKey, setMapKey] = useState(0);

  // Regénérer la carte quand les coordonnées changent significativement
  useEffect(() => {
    if (coordinates) {
      setMapKey(prev => prev + 1);
    }
  }, [coordinates?.lat, coordinates?.lng]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 1, 20);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 1, 15);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  if (!coordinates) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground h-[250px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-8 w-8 opacity-50" />
          <span>Sélectionnez une adresse pour afficher le cadastre</span>
        </div>
      </div>
    );
  }

  const center: [number, number] = [coordinates.lat, coordinates.lng];

  // Layer cadastre Swisstopo avec parcelles (meilleur layer pour le cadastre)
  const cadastreUrl = "https://wmts.geo.admin.ch/1.0.0/ch.kantone.cadastralwebmap-farbe/default/current/3857/{z}/{x}/{y}.png";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Plan cadastral (Swisstopo)
        </div>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleZoomOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xs w-8 text-center">{zoom}</span>
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

      {/* Carte cadastrale */}
      <div className="relative rounded-lg overflow-hidden border h-[250px]">
        <MapContainer
          key={mapKey}
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapUpdater center={center} zoom={zoom} />
          
          {/* Layer cadastre Swisstopo */}
          <TileLayer
            url={cadastreUrl}
            maxZoom={20}
          />
          
          <Marker 
            position={center} 
            icon={createCustomIcon()}
          />
        </MapContainer>
        
        {/* Attribution Swisstopo */}
        <div className="absolute bottom-1 right-1 bg-white/80 px-1 py-0.5 rounded text-[10px] text-gray-600 z-[1000]">
          © Swisstopo
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Plan cadastral officiel suisse
      </p>
    </div>
  );
};

export default CadastreMap;
