// ============================================
// Composant Éditeur de Proximités (POI)
// ============================================

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Proximite, TypeProximite } from '@/types/estimation';
import { MapPin, Footprints, Car, RefreshCw, Plus, X, Loader2, Train, Bus } from 'lucide-react';
import { toast } from 'sonner';

interface TransportResult {
  nom: string;
  distance: number;
  distanceFormatted: string;
  temps: string;
  mode: 'pied' | 'voiture';
  placeId: string;
}

interface NearbyTransitResponse {
  busStop: TransportResult | null;
  trainStation: TransportResult | null;
}

interface ProximitesEditorProps {
  proximites: Proximite[];
  coordinates: { lat: number; lng: number } | null | undefined;
  onChange: (proximites: Proximite[]) => void;
  disabled?: boolean;
}

// Types de proximités manuelles (sans transports)
const MANUAL_PROXIMITE_TYPES: { value: TypeProximite; label: string; icone: string }[] = [
  { value: 'ecole', label: 'École', icone: '🏫' },
  { value: 'commerce', label: 'Commerces', icone: '🛒' },
  { value: 'sante', label: 'Santé', icone: '🏥' },
  { value: 'nature', label: 'Nature / Parc', icone: '🌳' }
];

export function ProximitesEditor({ proximites, coordinates, onChange, disabled }: ProximitesEditorProps) {
  const [loadingTransit, setLoadingTransit] = useState(false);
  const [busStop, setBusStop] = useState<TransportResult | null>(null);
  const [trainStation, setTrainStation] = useState<TransportResult | null>(null);
  
  // Proximités manuelles (exclure les transports auto)
  const manualProximites = proximites.filter(p => 
    !['transport_bus', 'transport_tram'].includes(p.type)
  );

  // Charger les transports auto depuis les proximites sauvegardées
  useEffect(() => {
    const savedBus = proximites.find(p => p.type === 'transport_bus');
    const savedTrain = proximites.find(p => p.type === 'transport_tram');
    
    if (savedBus?.libelle) {
      setBusStop({
        nom: savedBus.libelle,
        distance: parseInt(savedBus.distance) || 0,
        distanceFormatted: savedBus.distance,
        temps: savedBus.tempsMarche || '',
        mode: savedBus.tempsMarche?.includes('voiture') ? 'voiture' : 'pied',
        placeId: ''
      });
    }
    if (savedTrain?.libelle) {
      setTrainStation({
        nom: savedTrain.libelle,
        distance: parseInt(savedTrain.distance) || 0,
        distanceFormatted: savedTrain.distance,
        temps: savedTrain.tempsMarche || '',
        mode: savedTrain.tempsMarche?.includes('voiture') ? 'voiture' : 'pied',
        placeId: ''
      });
    }
  }, []);

  // Auto-fetch transports quand coordonnées disponibles
  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng && !busStop && !trainStation && !loadingTransit) {
      // Délai de 500ms pour éviter appels multiples
      const timer = setTimeout(() => {
        fetchNearbyTransit();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [coordinates]);
  const fetchNearbyTransit = async () => {
    if (!coordinates) {
      toast.error('Coordonnées GPS requises');
      return;
    }
    
    setLoadingTransit(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { action: 'nearbyTransit', lat: coordinates.lat, lng: coordinates.lng }
      });
      
      if (error) throw error;
      
      const response = data as NearbyTransitResponse;
      setBusStop(response.busStop);
      setTrainStation(response.trainStation);
      
      // Mettre à jour les proximités
      const updatedProximites = [...manualProximites];
      
      if (response.busStop) {
        updatedProximites.push({
          type: 'transport_bus',
          icone: '🚌',
          libelle: response.busStop.nom,
          distance: response.busStop.distanceFormatted,
          tempsMarche: `${response.busStop.temps} ${response.busStop.mode === 'voiture' ? '(voiture)' : '(à pied)'}`
        });
      }
      
      if (response.trainStation) {
        updatedProximites.push({
          type: 'transport_tram', // Utilise transport_tram pour la gare
          icone: '🚆',
          libelle: response.trainStation.nom,
          distance: response.trainStation.distanceFormatted,
          tempsMarche: `${response.trainStation.temps} ${response.trainStation.mode === 'voiture' ? '(voiture)' : '(à pied)'}`
        });
      }
      
      onChange(updatedProximites);
      toast.success('Transports mis à jour');
    } catch (err) {
      console.error('Erreur fetch transports:', err);
      toast.error('Erreur lors de la recherche des transports');
    } finally {
      setLoadingTransit(false);
    }
  };

  // Ajouter une proximité manuelle
  const addManualProximite = () => {
    const newProximite: Proximite = {
      type: 'commerce',
      icone: '🛒',
      libelle: '',
      distance: '',
      tempsMarche: ''
    };
    
    const updatedProximites = [
      ...proximites.filter(p => ['transport_bus', 'transport_tram'].includes(p.type)),
      ...manualProximites,
      newProximite
    ];
    onChange(updatedProximites);
  };

  // Supprimer une proximité manuelle
  const removeManualProximite = (index: number) => {
    const updated = [...manualProximites];
    updated.splice(index, 1);
    
    const updatedProximites = [
      ...proximites.filter(p => ['transport_bus', 'transport_tram'].includes(p.type)),
      ...updated
    ];
    onChange(updatedProximites);
  };

  // Mettre à jour une proximité manuelle
  const updateManualProximite = (index: number, field: keyof Proximite, value: string) => {
    const updated = [...manualProximites];
    updated[index] = { ...updated[index], [field]: value };
    
    // Si on change le type, mettre à jour l'icône
    if (field === 'type') {
      const typeConfig = MANUAL_PROXIMITE_TYPES.find(t => t.value === value);
      if (typeConfig) {
        updated[index].icone = typeConfig.icone;
      }
    }
    
    const updatedProximites = [
      ...proximites.filter(p => ['transport_bus', 'transport_tram'].includes(p.type)),
      ...updated
    ];
    onChange(updatedProximites);
  };

  return (
    <div className="space-y-6">
      {/* Section Transports automatiques */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm flex items-center gap-2">
            <span>🚌</span> Transports (automatique)
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNearbyTransit}
            disabled={disabled || loadingTransit || !coordinates}
          >
            {loadingTransit ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Rafraîchir</span>
          </Button>
        </div>
        
        {!coordinates && (
          <p className="text-xs text-muted-foreground italic">
            Sélectionnez une adresse pour rechercher les transports à proximité.
          </p>
        )}

        {/* Arrêt de bus */}
        {busStop && (
          <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3">
            <div className="flex items-center gap-3">
              <Bus className="h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">{busStop.nom}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {busStop.distanceFormatted}
                  </span>
                  <span className="flex items-center gap-1">
                    {busStop.mode === 'pied' ? <Footprints className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                    {busStop.temps}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gare */}
        {trainStation && (
          <div className="rounded-lg border bg-blue-50 border-blue-200 p-3">
            <div className="flex items-center gap-3">
              <Train className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">{trainStation.nom}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {trainStation.distanceFormatted}
                  </span>
                  <span className="flex items-center gap-1">
                    {trainStation.mode === 'pied' ? <Footprints className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                    {trainStation.temps}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!busStop && !trainStation && !coordinates && !loadingTransit && (
          <p className="text-xs text-muted-foreground italic">
            Les transports seront recherchés automatiquement dès sélection d'adresse.
          </p>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-t border-border" />

      {/* Section Proximités manuelles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm flex items-center gap-2">
            <span>📍</span> Autres proximités
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addManualProximite}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {manualProximites.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Aucune proximité manuelle. Cliquez sur "Ajouter" pour en créer.
          </p>
        )}

        {manualProximites.map((prox, index) => (
          <div 
            key={index}
            className="rounded-lg border bg-card p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              {/* Sélecteur de type */}
              <Select
                value={prox.type}
                onValueChange={(value) => updateManualProximite(index, 'type', value)}
                disabled={disabled}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_PROXIMITE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icone} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Nom */}
              <Input
                placeholder="Nom du lieu"
                value={prox.libelle}
                onChange={(e) => updateManualProximite(index, 'libelle', e.target.value)}
                disabled={disabled}
                className="flex-1 text-sm"
              />
              
              {/* Supprimer */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeManualProximite(index)}
                disabled={disabled}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Distance */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Distance (ex: 200m)"
                  value={prox.distance}
                  onChange={(e) => updateManualProximite(index, 'distance', e.target.value)}
                  disabled={disabled}
                  className="pl-8 text-sm"
                />
              </div>
              <div className="relative">
                <Footprints className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Temps (ex: 3 min)"
                  value={prox.tempsMarche || ''}
                  onChange={(e) => updateManualProximite(index, 'tempsMarche', e.target.value)}
                  disabled={disabled}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
