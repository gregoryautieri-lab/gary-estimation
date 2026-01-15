/**
 * Calcule la distance entre deux points GPS en km (formule de Haversine)
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formate une distance en string lisible
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Calcule la distance depuis un point de référence
 */
export function getDistanceFromReference(
  refCoords: { lat: number; lng: number } | null | undefined,
  targetCoords: { lat: number; lng: number } | null | undefined
): number | null {
  if (!refCoords || !targetCoords) return null;
  
  return calculateDistance(
    refCoords.lat,
    refCoords.lng,
    targetCoords.lat,
    targetCoords.lng
  );
}
