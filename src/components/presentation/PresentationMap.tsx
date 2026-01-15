// ============================================
// Carte Grande Taille Mode Présentation
// ============================================

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PresentationMapProps {
  coordinates: { lat: number; lng: number } | null;
  adresse: string;
  localite: string;
}

// Icône personnalisée GARY
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 40px;
        height: 52px;
        position: relative;
      ">
        <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 32 20 32s20-17 20-32c0-11.046-8.954-20-20-20z" fill="#FA4238"/>
          <circle cx="20" cy="20" r="8" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  });
};

export function PresentationMap({ coordinates, adresse, localite }: PresentationMapProps) {
  if (!coordinates) {
    return (
      <div className="h-full flex items-center justify-center text-white/60">
        <div className="text-center">
          <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Localisation non disponible</p>
          <p className="text-sm mt-2 opacity-70">Renseignez l'adresse dans le module Identification</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={[coordinates.lat, coordinates.lng]}
          icon={createCustomIcon()}
        >
          <Popup>
            <div className="text-center p-2">
              <strong className="text-gray-900">{adresse}</strong>
              <br />
              <span className="text-gray-600">{localite}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay adresse */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-xl max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Navigation className="h-4 w-4 text-primary" />
            <span className="font-semibold text-gray-900">{adresse}</span>
          </div>
          <p className="text-sm text-gray-600">{localite}</p>
        </div>
      </div>
    </div>
  );
}
