import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface PresentationLocationMapProps {
  apiKey: string;
  center: { lat: number; lng: number };
  isLuxe: boolean;
  addressLabel?: string;
}

export function PresentationLocationMap({
  apiKey,
  center,
  isLuxe,
  addressLabel,
}: PresentationLocationMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-800">
        <MapPin className={cn("h-12 w-12 mb-4", isLuxe ? "text-amber-400" : "text-primary")} />
        <p className="text-white/70 text-sm">Carte indisponible</p>
        {addressLabel && <p className="text-white text-lg font-medium">{addressLabel}</p>}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={16}
      options={{
        disableDefaultUI: true,
        clickableIcons: false,
        mapTypeId: "satellite", // vue satellite
        gestureHandling: "greedy",
      }}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}
