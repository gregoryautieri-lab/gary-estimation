import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, FileText, RotateCcw, Move } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface CadastreMapProps {
  coordinates: { lat: number; lng: number } | null;
  onZoomChange?: (zoom: number) => void;
  onPinMove?: (newCoords: { lat: number; lng: number }) => void;
  initialZoom?: number;
  className?: string;
  draggable?: boolean;
}

// Composant pour synchroniser la vue de la carte
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  
  return null;
};

// Icône personnalisée pour le marqueur (version normale)
const createCustomIcon = (isDraggable: boolean) => {
  return L.divIcon({
    html: `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="10" fill="#FA4238" stroke="white" stroke-width="3"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
        ${isDraggable ? `
          <circle cx="16" cy="16" r="14" fill="none" stroke="#FA4238" stroke-width="1.5" stroke-dasharray="3 2"/>
        ` : ''}
      </svg>
    `,
    className: `custom-marker ${isDraggable ? 'cursor-move' : ''}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Composant Marker déplaçable
interface DraggableMarkerProps {
  position: [number, number];
  onMove: (newPos: { lat: number; lng: number }) => void;
  isDraggable: boolean;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({ position, onMove, isDraggable }) => {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onMove({ lat: latlng.lat, lng: latlng.lng });
      }
    },
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={createCustomIcon(isDraggable)}
      draggable={isDraggable}
      eventHandlers={eventHandlers}
    />
  );
};

export const CadastreMap: React.FC<CadastreMapProps> = ({
  coordinates,
  onZoomChange,
  onPinMove,
  initialZoom = 19,
  className = "",
  draggable = false,
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [mapKey, setMapKey] = useState(0);
  const [isDragMode, setIsDragMode] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // Position effective (ajustée ou originale)
  const effectivePosition = adjustedPosition || coordinates;

  // Regénérer la carte quand les coordonnées originales changent significativement
  useEffect(() => {
    if (coordinates) {
      // Reset l'ajustement quand l'adresse principale change
      setAdjustedPosition(null);
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

  const handlePinMove = (newCoords: { lat: number; lng: number }) => {
    setAdjustedPosition(newCoords);
    onPinMove?.(newCoords);
  };

  const handleReset = () => {
    if (coordinates) {
      setAdjustedPosition(null);
      onPinMove?.(coordinates);
    }
  };

  const toggleDragMode = () => {
    setIsDragMode(prev => !prev);
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

  const center: [number, number] = [effectivePosition!.lat, effectivePosition!.lng];

  // Layer cadastre Swisstopo avec parcelles
  const cadastreUrl = "https://wmts.geo.admin.ch/1.0.0/ch.kantone.cadastralwebmap-farbe/default/current/3857/{z}/{x}/{y}.png";

  const hasAdjustment = adjustedPosition !== null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          <span>Plan cadastral</span>
          {hasAdjustment && (
            <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
              Position ajustée
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle mode déplacement */}
          {draggable && (
            <Button
              variant={isDragMode ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={toggleDragMode}
            >
              <Move className="h-3.5 w-3.5" />
              {isDragMode ? "Déplacer ON" : "Ajuster"}
            </Button>
          )}
          
          {/* Bouton reset */}
          {hasAdjustment && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          
          {/* Contrôles zoom */}
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
      </div>

      {/* Instruction drag mode */}
      {isDragMode && (
        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg flex items-center gap-2">
          <Move className="h-4 w-4" />
          <span>Glissez le point rouge pour ajuster la position cadastrale</span>
        </div>
      )}

      {/* Carte cadastrale */}
      <div className={`relative rounded-lg overflow-hidden border h-[250px] ${isDragMode ? 'ring-2 ring-amber-500' : ''}`}>
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
          
          <DraggableMarker 
            position={center} 
            onMove={handlePinMove}
            isDraggable={isDragMode}
          />
        </MapContainer>
        
        {/* Attribution Swisstopo */}
        <div className="absolute bottom-1 right-1 bg-white/80 px-1 py-0.5 rounded text-[10px] text-gray-600 z-[1000]">
          © Swisstopo
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {isDragMode 
          ? "Déplacez le marqueur pour corriger la position cadastrale" 
          : "Plan cadastral officiel suisse"}
      </p>
    </div>
  );
};

export default CadastreMap;
