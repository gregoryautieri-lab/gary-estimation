// ============================================
// Composant Éditeur de Proximités (POI)
// ============================================

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Proximite, TypeProximite } from '@/types/estimation';
import { defaultProximites, getDefaultProximiteByType } from '@/types/estimation';
import { MapPin, Footprints } from 'lucide-react';

interface ProximitesEditorProps {
  proximites: Proximite[];
  onChange: (proximites: Proximite[]) => void;
  disabled?: boolean;
}

const PROXIMITE_CONFIG: Record<TypeProximite, { label: string; placeholder: string }> = {
  transport_bus: { label: 'Arrêt de bus', placeholder: 'Ex: Arrêt Plainpalais' },
  transport_tram: { label: 'Arrêt de tram', placeholder: 'Ex: Tram 12 - Cornavin' },
  ecole: { label: 'École', placeholder: 'Ex: École primaire des Eaux-Vives' },
  commerce: { label: 'Commerces', placeholder: 'Ex: Migros, Coop, boulangerie' },
  sante: { label: 'Santé', placeholder: 'Ex: Pharmacie Sun Store' },
  nature: { label: 'Nature / Parc', placeholder: 'Ex: Parc des Bastions' }
};

export function ProximitesEditor({ proximites, onChange, disabled }: ProximitesEditorProps) {
  // Assurer qu'on a toutes les proximités (fusion avec défauts)
  const fullProximites = defaultProximites.map(defaultProx => {
    const existing = proximites.find(p => p.type === defaultProx.type);
    return existing || defaultProx;
  });

  const updateProximite = (type: TypeProximite, field: keyof Proximite, value: string) => {
    const updated = fullProximites.map(p => {
      if (p.type === type) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {fullProximites.map((prox) => {
        const config = PROXIMITE_CONFIG[prox.type];
        const hasData = prox.libelle || prox.distance || prox.tempsMarche;
        
        return (
          <div 
            key={prox.type}
            className={cn(
              "rounded-lg border p-3 transition-all",
              hasData 
                ? "bg-primary/5 border-primary/20" 
                : "bg-card border-border"
            )}
          >
            {/* Header avec icône et label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{prox.icone}</span>
              <Label className="font-medium text-sm">{config.label}</Label>
            </div>
            
            {/* Champs d'édition */}
            <div className="space-y-2">
              {/* Libellé */}
              <Input
                placeholder={config.placeholder}
                value={prox.libelle}
                onChange={(e) => updateProximite(prox.type, 'libelle', e.target.value)}
                disabled={disabled}
                className="text-sm"
              />
              
              {/* Distance et temps de marche */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Distance (ex: 200m)"
                    value={prox.distance}
                    onChange={(e) => updateProximite(prox.type, 'distance', e.target.value)}
                    disabled={disabled}
                    className="pl-8 text-sm"
                  />
                </div>
                <div className="relative">
                  <Footprints className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Temps (ex: 3 min)"
                    value={prox.tempsMarche || ''}
                    onChange={(e) => updateProximite(prox.type, 'tempsMarche', e.target.value)}
                    disabled={disabled}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
