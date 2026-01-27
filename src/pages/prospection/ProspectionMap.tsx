import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, MapPin, Layers, Info, Mail, User } from 'lucide-react';
import { useProspectionZones, useZoneCommunes, ZONE_AGE_LEGEND, type ZoneFilters, type ZoneData } from '@/hooks/useProspectionZones';
import { useCampagnes } from '@/hooks/useCampagnes';
import { useSupportsProspection } from '@/hooks/useSupportsProspection';

// Composant pour recentrer la carte
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useMemo(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  
  return null;
}

// Composant légende
function ZoneLegend() {
  return (
    <Card className="absolute bottom-4 right-4 z-[1000] shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
          <Info className="h-4 w-4 text-primary" />
          <span>Ancienneté des zones</span>
        </div>
        <div className="space-y-1.5">
          {ZONE_AGE_LEGEND.map((item) => (
            <div key={item.category} className="flex items-center gap-2 text-xs">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: item.color, opacity: 0.6 }}
              />
              <span className="font-medium min-w-[60px]">{item.label}</span>
              <span className="text-muted-foreground">{item.description}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour afficher une zone GeoJSON
function ZonePolygon({ zone, onSelect }: { zone: ZoneData; onSelect: (zone: ZoneData) => void }) {
  const style = {
    fillColor: zone.color,
    fillOpacity: 0.4,
    color: zone.color,
    weight: 2,
    opacity: 0.8,
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => onSelect(zone),
      mouseover: (e: L.LeafletMouseEvent) => {
        const target = e.target as L.Path;
        target.setStyle({ fillOpacity: 0.6, weight: 3 });
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const target = e.target as L.Path;
        target.setStyle({ fillOpacity: 0.4, weight: 2 });
      },
    });
  };

  // GeoJSON peut être un objet brut (Polygon) ou déjà un Feature/FeatureCollection
  // react-leaflet GeoJSON attend un Feature ou FeatureCollection
  let geoJsonData = typeof zone.zone_geojson === 'string' 
    ? JSON.parse(zone.zone_geojson) 
    : zone.zone_geojson;

  // Si c'est une géométrie brute (Polygon, MultiPolygon), wrapper en Feature
  if (geoJsonData.type === 'Polygon' || geoJsonData.type === 'MultiPolygon') {
    geoJsonData = {
      type: 'Feature',
      properties: {},
      geometry: geoJsonData,
    };
  }

  return (
    <GeoJSON
      key={zone.id}
      data={geoJsonData}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}

export default function ProspectionMap() {
  const navigate = useNavigate();
  
  // Filtres
  const [filters, setFilters] = useState<ZoneFilters>({
    commune: null,
    period: '6months',
    campagne_id: null,
    support_id: null,
  });
  
  // Zone sélectionnée pour popup
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);

  // Données
  const { data: zones = [], isLoading: zonesLoading } = useProspectionZones(filters);
  const { data: communes = [] } = useZoneCommunes();
  const { campagnes } = useCampagnes({ statut: ['en_cours', 'terminee'] });
  const { supports } = useSupportsProspection();

  // Centre de la carte (Genève par défaut)
  const mapCenter: [number, number] = [46.2044, 6.1432];
  const defaultZoom = 12;

  const updateFilter = <K extends keyof ZoneFilters>(key: K, value: ZoneFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate('/campagnes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <span className="font-semibold">Carte des zones</span>
        </div>
        <div className="flex-1" />
        <GaryLogo className="h-5 text-primary" />
      </header>

      {/* Filtres */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex flex-wrap gap-2">
          {/* Commune */}
          <Select
            value={filters.commune || 'all'}
            onValueChange={(v) => updateFilter('commune', v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Commune" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes communes</SelectItem>
              {communes.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Période */}
          <Select
            value={filters.period}
            onValueChange={(v) => updateFilter('period', v as ZoneFilters['period'])}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 derniers mois</SelectItem>
              <SelectItem value="6months">6 derniers mois</SelectItem>
              <SelectItem value="1year">1 an</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>

          {/* Campagne */}
          <Select
            value={filters.campagne_id || 'all'}
            onValueChange={(v) => updateFilter('campagne_id', v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Campagne" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes campagnes</SelectItem>
              {campagnes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} - {c.commune}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Support */}
          <Select
            value={filters.support_id || 'all'}
            onValueChange={(v) => updateFilter('support_id', v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Support" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous supports</SelectItem>
              {supports.filter((s) => s.actif).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Compteur */}
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          <MapPin className="h-3 w-3" />
          <span>{zones.length} zone{zones.length !== 1 ? 's' : ''} affichée{zones.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Carte */}
      <div className="flex-1 relative">
        {zonesLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Zones */}
            {zones.map((zone) => (
              <ZonePolygon 
                key={zone.id} 
                zone={zone} 
                onSelect={setSelectedZone} 
              />
            ))}

            {/* Popup zone sélectionnée */}
            {selectedZone && selectedZone.zone_geojson && (
              <Popup
                position={(() => {
                  // Trouver le centre du GeoJSON
                  const geoJson = typeof selectedZone.zone_geojson === 'string'
                    ? JSON.parse(selectedZone.zone_geojson)
                    : selectedZone.zone_geojson;
                  
                  // Essayer de trouver les coordonnées
                  let coords: number[][] = [];
                  if (geoJson.type === 'FeatureCollection' && geoJson.features?.[0]) {
                    coords = geoJson.features[0].geometry?.coordinates?.[0] || [];
                  } else if (geoJson.type === 'Feature') {
                    coords = geoJson.geometry?.coordinates?.[0] || [];
                  } else if (geoJson.type === 'Polygon') {
                    coords = geoJson.coordinates?.[0] || [];
                  }
                  
                  if (coords.length === 0) return mapCenter;
                  
                  // Calculer le centroïde
                  const lat = coords.reduce((sum, c) => sum + (c[1] || 0), 0) / coords.length;
                  const lng = coords.reduce((sum, c) => sum + (c[0] || 0), 0) / coords.length;
                  return [lat, lng] as [number, number];
                })()}
                eventHandlers={{
                  remove: () => setSelectedZone(null)
                }}
              >
                <div className="min-w-[200px] space-y-2">
                  <div className="font-semibold text-primary">
                    {selectedZone.campagne_code}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{selectedZone.campagne_commune}</p>
                    {selectedZone.secteur_nom && (
                      <p className="text-muted-foreground">Secteur: {selectedZone.secteur_nom}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>
                        {selectedZone.courriers_distribues || selectedZone.courriers_prevu} courriers
                      </span>
                    </div>
                    <p>
                      Date: {format(new Date(selectedZone.date), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    {(selectedZone.etudiant_prenom || selectedZone.courtier_name) && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{selectedZone.etudiant_prenom || selectedZone.courtier_name}</span>
                      </div>
                    )}
                    {selectedZone.support_nom && (
                      <p>Support: {selectedZone.support_nom}</p>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </MapContainer>
        )}

        {/* Légende */}
        <ZoneLegend />
      </div>

      <BottomNav />
    </div>
  );
}
