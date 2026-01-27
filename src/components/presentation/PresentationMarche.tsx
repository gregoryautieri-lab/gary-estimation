import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { Loader2, MapPin, CheckCircle2, Circle, Star, TrendingUp } from "lucide-react";
import { Comparable, PreEstimation, Identification, AnalyseTerrain } from "@/types/estimation";
import { formatPriceCHF } from "@/hooks/useEstimationCalcul";
import { geocodeAddress } from "@/lib/api/comparables";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Table des coordonnées moyennes par NPA (Genève + Vaud limitrophe)
const NPA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Genève ville
  "1200": { lat: 46.2044, lng: 6.1432 },
  "1201": { lat: 46.2088, lng: 6.1420 },
  "1202": { lat: 46.2155, lng: 6.1296 },
  "1203": { lat: 46.2180, lng: 6.1180 },
  "1204": { lat: 46.2000, lng: 6.1450 },
  "1205": { lat: 46.1920, lng: 6.1400 },
  "1206": { lat: 46.1900, lng: 6.1600 },
  "1207": { lat: 46.1950, lng: 6.1750 },
  "1208": { lat: 46.1880, lng: 6.1650 },
  "1209": { lat: 46.2250, lng: 6.1100 },
  // Rive gauche
  "1212": { lat: 46.1870, lng: 6.1250 }, // Grand-Lancy
  "1213": { lat: 46.1750, lng: 6.1350 }, // Onex / Petit-Lancy
  "1214": { lat: 46.1800, lng: 6.0950 }, // Vernier
  "1215": { lat: 46.2000, lng: 6.0800 }, // Genève Aéroport
  "1216": { lat: 46.1950, lng: 6.0600 }, // Cointrin
  "1217": { lat: 46.2000, lng: 6.0400 }, // Meyrin
  "1218": { lat: 46.1870, lng: 6.1150 }, // Grand-Saconnex
  "1219": { lat: 46.2150, lng: 6.1050 }, // Châtelaine / Aïre
  "1220": { lat: 46.2200, lng: 6.0800 }, // Les Avanchets
  "1222": { lat: 46.2050, lng: 6.0500 }, // Vésenaz
  "1223": { lat: 46.1700, lng: 6.1100 }, // Cologny
  "1224": { lat: 46.1800, lng: 6.1800 }, // Chêne-Bougeries
  "1225": { lat: 46.1850, lng: 6.2000 }, // Chêne-Bourg
  "1226": { lat: 46.1900, lng: 6.2100 }, // Thônex
  "1227": { lat: 46.1700, lng: 6.1550 }, // Carouge
  "1228": { lat: 46.1650, lng: 6.1400 }, // Plan-les-Ouates
  // Communes genevoises
  "1231": { lat: 46.1550, lng: 6.1200 }, // Conches
  "1232": { lat: 46.1500, lng: 6.1050 }, // Confignon
  "1233": { lat: 46.1400, lng: 6.0900 }, // Bernex
  "1234": { lat: 46.1600, lng: 6.0700 }, // Vessy
  "1236": { lat: 46.1350, lng: 6.1200 }, // Cartigny
  "1237": { lat: 46.1200, lng: 6.1100 }, // Avully
  "1239": { lat: 46.1100, lng: 6.0900 }, // Collex-Bossy
  "1241": { lat: 46.2400, lng: 6.0600 }, // Puplinge
  "1242": { lat: 46.2300, lng: 6.0400 }, // Satigny
  "1243": { lat: 46.2100, lng: 6.0200 }, // Presinge
  "1244": { lat: 46.1900, lng: 6.2300 }, // Choulex
  "1245": { lat: 46.2000, lng: 6.2400 }, // Collonge-Bellerive
  "1246": { lat: 46.2100, lng: 6.2550 }, // Corsier
  "1247": { lat: 46.2200, lng: 6.2700 }, // Anières
  "1248": { lat: 46.2300, lng: 6.2900 }, // Hermance
  "1251": { lat: 46.1300, lng: 6.0650 }, // Gy
  "1252": { lat: 46.1400, lng: 6.0500 }, // Meinier
  "1253": { lat: 46.1550, lng: 6.0350 }, // Vandœuvres
  "1254": { lat: 46.1650, lng: 6.0200 }, // Jussy
  "1255": { lat: 46.1750, lng: 6.0100 }, // Veyrier
  "1256": { lat: 46.1600, lng: 5.9950 }, // Troinex
  "1257": { lat: 46.1450, lng: 5.9800 }, // La Croix-de-Rozon
  "1258": { lat: 46.1300, lng: 5.9650 }, // Perly-Certoux
  // Vaud limitrophe
  "1260": { lat: 46.3833, lng: 6.2333 }, // Nyon
  "1261": { lat: 46.4000, lng: 6.2100 }, // Le Vaud / Longirod
  "1262": { lat: 46.4200, lng: 6.2800 }, // Eysins
  "1263": { lat: 46.4100, lng: 6.2600 }, // Crassier
  "1264": { lat: 46.3700, lng: 6.2000 }, // St-Cergue
  "1266": { lat: 46.4050, lng: 6.2200 }, // Duillier
  "1267": { lat: 46.4150, lng: 6.2400 }, // Coinsins
  "1268": { lat: 46.4250, lng: 6.2700 }, // Begnins
  "1269": { lat: 46.4300, lng: 6.2900 }, // Bassins
  "1270": { lat: 46.4450, lng: 6.2500 }, // Trélex
  "1271": { lat: 46.4550, lng: 6.2300 }, // Givrins
  "1272": { lat: 46.4650, lng: 6.2100 }, // Genolier
  "1273": { lat: 46.4750, lng: 6.1900 }, // Arzier-Le Muids
  "1274": { lat: 46.4350, lng: 6.3100 }, // Grens
  "1275": { lat: 46.4500, lng: 6.3300 }, // Chéserex
  "1276": { lat: 46.4200, lng: 6.3500 }, // Gingins
  "1277": { lat: 46.4050, lng: 6.3300 }, // Borex
  "1278": { lat: 46.3950, lng: 6.3100 }, // La Rippe
  "1279": { lat: 46.3800, lng: 6.2800 }, // Chavannes-de-Bogis
  "1180": { lat: 46.4600, lng: 6.3800 }, // Rolle
  "1110": { lat: 46.5110, lng: 6.4990 }, // Morges
  "1196": { lat: 46.2900, lng: 6.1700 }, // Gland
  "1197": { lat: 46.3100, lng: 6.1900 }, // Prangins
  // France voisine (approximatif)
  "74100": { lat: 46.2050, lng: 6.2500 }, // Annemasse
  "74160": { lat: 46.2700, lng: 6.2200 }, // Saint-Julien-en-Genevois
};

// Fallback Genève centre
const DEFAULT_COORDINATES = { lat: 46.2044, lng: 6.1432 };

interface MarkerData {
  id: string;
  type: 'principal' | 'vendu' | 'enVente';
  position: { lat: number; lng: number };
  adresse: string;
  prix: number;
  surface?: number;
  prixM2?: number;
  dateInfo?: string;
  isGary?: boolean;
}

interface PresentationMarcheProps {
  identification: Identification;
  preEstimation: PreEstimation;
  prixRecommande: number;
  analyseTerrain?: AnalyseTerrain;
  isLuxe?: boolean;
}

// Extraire le NPA d'une adresse
function extractNPA(address: string): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{4,5})\b/);
  return match ? match[1] : null;
}

// Obtenir les coordonnées d'un NPA
function getCoordinatesForNPA(npa: string | null): { lat: number; lng: number } {
  if (!npa) return DEFAULT_COORDINATES;
  return NPA_COORDINATES[npa] || DEFAULT_COORDINATES;
}

// Markers SVG
const MARKER_ICONS = {
  principal: `<svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 0C11 0 0 11 0 24c0 18 24 32 24 32s24-14 24-32c0-13-11-24-24-24z" fill="#FA4238"/>
    <polygon points="24,10 27,19 37,19 29,25 32,35 24,29 16,35 19,25 11,19 21,19" fill="white"/>
  </svg>`,
  vendu: `<svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0C8 0 0 8 0 18c0 14 18 26 18 26s18-12 18-26c0-10-8-18-18-18z" fill="#22c55e"/>
    <path d="M12 18l4 4 8-8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  enVente: `<svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0C8 0 0 8 0 18c0 14 18 26 18 26s18-12 18-26c0-10-8-18-18-18z" fill="#6b7280"/>
    <circle cx="18" cy="18" r="6" stroke="white" stroke-width="2.5" fill="none"/>
  </svg>`,
};

// Composant carte
function MarketMap({
  apiKey,
  bienPrincipal,
  comparablesVendus,
  comparablesEnVente,
  onMarkerClick,
  visibilityFilters,
}: {
  apiKey: string;
  bienPrincipal: MarkerData | null;
  comparablesVendus: MarkerData[];
  comparablesEnVente: MarkerData[];
  onMarkerClick: (marker: MarkerData) => void;
  visibilityFilters: { principal: boolean; vendus: boolean; enVente: boolean };
}) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const allMarkers = [
    ...(visibilityFilters.principal && bienPrincipal ? [bienPrincipal] : []),
    ...(visibilityFilters.vendus ? comparablesVendus : []),
    ...(visibilityFilters.enVente ? comparablesEnVente : []),
  ];

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Ajuster les bounds
  useEffect(() => {
    if (!mapRef.current || allMarkers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    allMarkers.forEach(m => bounds.extend(m.position));
    
    if (allMarkers.length > 1) {
      mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      // Limiter le zoom max (pas trop dézoomé)
      const listener = google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
        if (mapRef.current && mapRef.current.getZoom()! < 12) {
          mapRef.current.setZoom(12);
        }
      });
    } else {
      mapRef.current.setCenter(allMarkers[0].position);
      mapRef.current.setZoom(14);
    }
  }, [allMarkers]);

  const defaultCenter = bienPrincipal?.position || DEFAULT_COORDINATES;

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800/50 rounded-xl">
        <div className="text-center text-white/70">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-primary" />
          <p>Carte indisponible</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800/50 rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%", borderRadius: "12px" }}
      center={defaultCenter}
      zoom={13}
      onLoad={onLoad}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        scrollwheel: true,
        gestureHandling: "greedy",
        mapTypeId: "hybrid",
      }}
    >
      {allMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          onClick={() => {
            setSelectedMarker(marker);
            onMarkerClick(marker);
          }}
          icon={{
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(MARKER_ICONS[marker.type]),
            scaledSize: new google.maps.Size(marker.type === 'principal' ? 48 : 36, marker.type === 'principal' ? 56 : 44),
            anchor: new google.maps.Point(marker.type === 'principal' ? 24 : 18, marker.type === 'principal' ? 56 : 44),
          }}
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              {selectedMarker.type === 'principal' && <Star className="h-4 w-4 text-primary fill-primary" />}
              {selectedMarker.type === 'vendu' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {selectedMarker.type === 'enVente' && <Circle className="h-4 w-4 text-gray-500" />}
              <span className="font-semibold text-sm">
                {selectedMarker.type === 'principal' ? 'Votre bien' : 
                 selectedMarker.type === 'vendu' ? 'Vendu' : 'En vente'}
              </span>
              {selectedMarker.isGary && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">GARY</span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">{selectedMarker.adresse}</p>
            {selectedMarker.prix > 0 && (
              <p className="font-bold text-base text-gray-900">{formatPriceCHF(selectedMarker.prix)}</p>
            )}
            {selectedMarker.surface && (
              <p className="text-xs text-gray-500">
                {selectedMarker.surface} m²
              </p>
            )}
            {selectedMarker.dateInfo && (
              <p className="text-xs text-gray-500 mt-1">{selectedMarker.dateInfo}</p>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

// Composant card comparable - SANS prix/m²
function ComparableCard({
  marker,
  type,
  onClick,
}: {
  marker: MarkerData;
  type: 'vendu' | 'enVente';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.02]",
        type === 'vendu' 
          ? "bg-green-500/10 border-green-500/30 hover:border-green-500/50" 
          : "bg-gray-500/10 border-gray-500/30 hover:border-gray-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{marker.adresse}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "font-bold",
              type === 'vendu' ? "text-green-400" : "text-gray-300"
            )}>
              {formatPriceCHF(marker.prix)}
            </span>
            {marker.isGary && (
              <span className="bg-primary text-white text-[9px] font-bold px-1 py-0.5 rounded">G</span>
            )}
          </div>
        </div>
        {marker.surface && (
          <div className="text-right">
            <p className="text-xs text-white/60">{marker.surface} m²</p>
          </div>
        )}
      </div>
      {marker.dateInfo && (
        <p className="text-xs text-white/50 mt-1">
          {marker.dateInfo}
        </p>
      )}
    </button>
  );
}

// Composant principal
export function PresentationMarche({
  identification,
  preEstimation,
  prixRecommande,
  analyseTerrain,
  isLuxe = false,
}: PresentationMarcheProps) {
  const { apiKey, loading: apiLoading, error: apiError } = useGoogleMapsKey();
  const [principalMarker, setPrincipalMarker] = useState<MarkerData | null>(null);
  const [vendusMarkers, setVendusMarkers] = useState<MarkerData[]>([]);
  const [enVenteMarkers, setEnVenteMarkers] = useState<MarkerData[]>([]);
  const [isLoadingComparables, setIsLoadingComparables] = useState(true);
  const [visibilityFilters, setVisibilityFilters] = useState({
    principal: true,
    vendus: true,
    enVente: true,
  });

  const comparablesVendus = preEstimation?.comparablesVendus || [];
  const comparablesEnVente = preEstimation?.comparablesEnVente || [];
  const hasComparables = comparablesVendus.length > 0 || comparablesEnVente.length > 0;

  // Charger le bien principal immédiatement
  useEffect(() => {
    const coords = identification?.adresse?.coordinates;
    const adresseStr = identification?.adresse?.rue 
      ? `${identification.adresse.rue}, ${identification.adresse.codePostal || ''} ${identification.adresse.localite || ''}`.trim()
      : '';
    
    if (coords) {
      setPrincipalMarker({
        id: 'principal',
        type: 'principal',
        position: coords,
        adresse: adresseStr,
        prix: prixRecommande,
        surface: undefined,
      });
    }
  }, [identification, prixRecommande]);

  // Charger les comparables de manière progressive
  useEffect(() => {
    const loadComparables = async () => {
      setIsLoadingComparables(true);
      
      // Charger les vendus
      const vendus: MarkerData[] = [];
      for (const comp of comparablesVendus) {
        if (!comp.adresse) continue;
        
        let position = comp.coordinates;
        if (!position) {
          // Essayer geocoding
          const geocoded = await geocodeAddress(comp.adresse);
          if (geocoded) {
            position = geocoded;
          } else {
            // Fallback NPA
            const npa = extractNPA(comp.adresse);
            position = getCoordinatesForNPA(npa);
          }
        }
        
        const prix = parseFloat(comp.prix) || 0;
        const surface = parseFloat(comp.surface) || 0;
        
        vendus.push({
          id: `vendu-${vendus.length}`,
          type: 'vendu',
          position,
          adresse: comp.adresse,
          prix,
          surface: surface || undefined,
          prixM2: surface > 0 ? Math.round(prix / surface) : undefined,
          dateInfo: comp.dateVente,
          isGary: comp.isGary,
        });
        
        // Mise à jour progressive
        setVendusMarkers([...vendus]);
      }
      
      // Charger les en vente
      const enVente: MarkerData[] = [];
      for (const comp of comparablesEnVente) {
        if (!comp.adresse) continue;
        
        let position = comp.coordinates;
        if (!position) {
          // Pour les en vente, on utilise souvent juste le NPA
          const npa = extractNPA(comp.adresse);
          position = getCoordinatesForNPA(npa);
        }
        
        const prix = parseFloat(comp.prix) || 0;
        const surface = parseFloat(comp.surface) || 0;
        
        enVente.push({
          id: `enVente-${enVente.length}`,
          type: 'enVente',
          position,
          adresse: comp.adresse,
          prix,
          surface: surface || undefined,
          prixM2: surface > 0 ? Math.round(prix / surface) : undefined,
          dateInfo: comp.dureeEnVente ? `Depuis ${comp.dureeEnVente}` : undefined,
          isGary: comp.isGary,
        });
        
        // Mise à jour progressive
        setEnVenteMarkers([...enVente]);
      }
      
      setIsLoadingComparables(false);
    };

    loadComparables();
  }, [comparablesVendus, comparablesEnVente]);

  // Calculer la synthèse de positionnement
  const getPositionData = () => {
    const allPrices = [
      ...vendusMarkers.map(m => m.prix),
      ...enVenteMarkers.map(m => m.prix),
    ].filter(p => p > 0);
    
    if (allPrices.length === 0) return null;
    
    const sorted = [...allPrices].sort((a, b) => a - b);
    const minPrix = sorted[0];
    const maxPrix = sorted[sorted.length - 1];
    const mediane = sorted[Math.floor(sorted.length / 2)] || 0;
    const range = maxPrix - minPrix;
    
    // Position du bien recommandé (en %)
    const position = range > 0 
      ? Math.min(100, Math.max(0, ((prixRecommande - minPrix) / range) * 100))
      : 50;
    
    return { minPrix, maxPrix, mediane, position, allPrices };
  };

  const getSynthese = () => {
    if (!hasComparables) return null;
    
    const posData = getPositionData();
    if (!posData) return null;
    
    const { mediane } = posData;
    
    if (prixRecommande > mediane * 1.15) {
      return "Votre bien se positionne dans le segment premium du marché";
    } else if (prixRecommande > mediane * 0.95) {
      return "Votre bien se positionne dans la moyenne haute du marché";
    } else {
      return "Votre bien offre un positionnement attractif sur le marché";
    }
  };

  const toggleFilter = (key: 'principal' | 'vendus' | 'enVente') => {
    setVisibilityFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMarkerClick = (marker: MarkerData) => {
    // Scroll to card if needed (future enhancement)
  };

  if (apiLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (apiError || !apiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/70">
        <MapPin className="h-12 w-12 mb-4 text-primary" />
        <p>Carte indisponible</p>
      </div>
    );
  }

  const synthese = getSynthese();
  const positionData = getPositionData();
  const totalComparables = vendusMarkers.length + enVenteMarkers.length;
  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">Positionnement marché</h2>
        <p className="text-white/60 text-sm">Votre bien vs. les transactions locales</p>
      </div>

      {/* Carte + Légende */}
      <div className="relative flex-shrink-0" style={{ height: '45%' }}>
        <MarketMap
          apiKey={apiKey}
          bienPrincipal={principalMarker}
          comparablesVendus={vendusMarkers}
          comparablesEnVente={enVenteMarkers}
          onMarkerClick={handleMarkerClick}
          visibilityFilters={visibilityFilters}
        />
        
        {/* Légende overlay */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg p-2 flex gap-3">
          <button
            onClick={() => toggleFilter('principal')}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-opacity",
              !visibilityFilters.principal && "opacity-40"
            )}
          >
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
            <span className="text-white">Votre bien</span>
          </button>
          <button
            onClick={() => toggleFilter('vendus')}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-opacity",
              !visibilityFilters.vendus && "opacity-40"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-white">Vendus ({vendusMarkers.length})</span>
          </button>
          <button
            onClick={() => toggleFilter('enVente')}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-opacity",
              !visibilityFilters.enVente && "opacity-40"
            )}
          >
            <Circle className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-white">En vente ({enVenteMarkers.length})</span>
          </button>
        </div>

        {/* Loader comparables */}
        {isLoadingComparables && hasComparables && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white/70" />
            <span className="text-xs text-white/70">Chargement...</span>
          </div>
        )}
      </div>

      {/* Liste des comparables */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-4">
        {!hasComparables ? (
          <div className="text-center py-8">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-white/30" />
            <p className="text-white/50 text-sm">
              Ajoutez des comparables pour affiner le positionnement
            </p>
          </div>
        ) : (
          <>
            {/* Header avec compteur */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Transactions analysées
              </h3>
              <Badge variant="outline" className="text-white/60 border-white/20">
                {totalComparables} analysées
              </Badge>
            </div>

            {/* Transactions récentes */}
            {vendusMarkers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500/20 text-green-400 text-xs font-medium px-2 py-0.5 rounded">
                    Vendus récemment
                  </span>
                </div>
                <div className="space-y-2">
                  {vendusMarkers.map((marker) => (
                    <ComparableCard
                      key={marker.id}
                      marker={marker}
                      type="vendu"
                      onClick={() => handleMarkerClick(marker)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actuellement en vente */}
            {enVenteMarkers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-gray-500/20 text-gray-300 text-xs font-medium px-2 py-0.5 rounded">
                    Actuellement en vente
                  </span>
                </div>
                <div className="space-y-2">
                  {enVenteMarkers.map((marker) => (
                    <ComparableCard
                      key={marker.id}
                      marker={marker}
                      type="enVente"
                      onClick={() => handleMarkerClick(marker)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Positionnement visuel */}
      {prixRecommande > 0 && positionData && (
        <div className="mt-4 p-4 rounded-lg bg-white/5">
          <p className="text-white/60 text-sm mb-3">Positionnement de votre bien</p>
          
          <div className="relative">
            {/* Barre de fond */}
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  isLuxe 
                    ? "bg-gradient-to-r from-amber-500/50 to-amber-400/50" 
                    : "bg-gradient-to-r from-emerald-500/50 to-primary/50"
                )}
                style={{ width: '100%' }}
              />
            </div>
            
            {/* Marqueur du bien */}
            <div 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow-lg",
                isLuxe ? "bg-amber-500" : "bg-primary"
              )}
              style={{ left: `calc(${positionData.position}% - 10px)` }}
            />
            
            {/* Labels min/max */}
            <div className="flex justify-between mt-2 text-xs text-white/40">
              <span>{formatPriceCHF(positionData.minPrix)}</span>
              <span>{formatPriceCHF(positionData.maxPrix)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Conclusion */}
      {synthese && prixRecommande > 0 && positionData && (
        <div className={cn(
          "mt-4 p-4 rounded-lg text-center",
          isLuxe 
            ? "bg-amber-500/10 border border-amber-500/20" 
            : "bg-primary/10 border border-primary/20"
        )}>
          <p className={cn(
            "font-medium",
            isLuxe ? "text-amber-300" : "text-white"
          )}>
            {synthese}
          </p>
        </div>
      )}
    </div>
  );
}

export default PresentationMarche;
