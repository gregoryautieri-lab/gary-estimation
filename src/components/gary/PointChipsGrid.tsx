// ============================================
// Composant Chips Points Forts/Faibles avec Emojis
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface PointChip {
  value: string;
  label: string;
  emoji: string;
}

interface PointChipsGridProps {
  type: 'fort' | 'faible';
  options: PointChip[];
  selected: string[];
  customItems?: string[];
  onToggle: (value: string) => void;
  onAddCustom?: (value: string) => void;
  onRemoveCustom?: (value: string) => void;
  disabled?: boolean;
}

export function PointChipsGrid({
  type,
  options,
  selected,
  customItems = [],
  onToggle,
  onAddCustom,
  onRemoveCustom,
  disabled = false
}: PointChipsGridProps) {
  const [newCustom, setNewCustom] = useState('');

  const handleAddCustom = () => {
    if (newCustom.trim() && onAddCustom) {
      onAddCustom(newCustom.trim());
      setNewCustom('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const colorClasses = type === 'fort' 
    ? {
        selected: 'bg-green-500 text-white border-green-600',
        unselected: 'bg-card text-foreground border-border hover:border-green-400 hover:bg-green-50',
        custom: 'bg-green-100 text-green-800 border-green-300'
      }
    : {
        selected: 'bg-red-500 text-white border-red-600',
        unselected: 'bg-card text-foreground border-border hover:border-red-400 hover:bg-red-50',
        custom: 'bg-red-100 text-red-800 border-red-300'
      };

  return (
    <div className="space-y-3">
      {/* Chips prédéfinies */}
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label, emoji }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() => !disabled && onToggle(value)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all",
                isSelected ? colorClasses.selected : colorClasses.unselected,
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom items */}
      {customItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customItems.map((item, idx) => (
            <div
              key={`custom-${idx}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium",
                colorClasses.custom
              )}
            >
              <span>✨</span>
              <span>{item}</span>
              {onRemoveCustom && !disabled && (
                <button
                  onClick={() => onRemoveCustom(item)}
                  className="ml-1 p-0.5 rounded-full hover:bg-black/10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ajout custom */}
      {onAddCustom && !disabled && (
        <div className="flex gap-2 pt-1">
          <Input
            value={newCustom}
            onChange={(e) => setNewCustom(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={type === 'fort' ? 'Autre point fort...' : 'Autre point faible...'}
            className="flex-1 h-9"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCustom}
            disabled={!newCustom.trim()}
            className="h-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Options prédéfinies Points Forts
// ============================================

export const POINTS_FORTS_OPTIONS: PointChip[] = [
  { value: 'lumineux', label: 'Lumineux', emoji: '☀️' },
  { value: 'vue_degagee', label: 'Vue dégagée', emoji: '🏔️' },
  { value: 'calme', label: 'Calme', emoji: '😌' },
  { value: 'traversant', label: 'Traversant', emoji: '↔️' },
  { value: 'cuisine_equipee', label: 'Cuisine équipée', emoji: '🍳' },
  { value: 'sdb_moderne', label: 'SDB moderne', emoji: '🚿' },
  { value: 'renove_recemment', label: 'Rénové récemment', emoji: '✨' },
  { value: 'beaux_volumes', label: 'Beaux volumes', emoji: '🏛️' },
  { value: 'parquet', label: 'Parquet', emoji: '🪵' },
  { value: 'cheminee', label: 'Cheminée', emoji: '🔥' },
  { value: 'terrasse_balcon', label: 'Terrasse/Balcon', emoji: '🌿' },
  { value: 'jardin', label: 'Jardin', emoji: '🌳' },
  { value: 'piscine', label: 'Piscine', emoji: '🏊' },
  { value: 'parking', label: 'Parking', emoji: '🚗' },
  { value: 'cave', label: 'Cave', emoji: '🍷' },
  { value: 'dressing', label: 'Dressing', emoji: '👔' },
  { value: 'buanderie_privee', label: 'Buanderie privée', emoji: '🧺' },
  { value: 'bon_etat', label: 'Bon état général', emoji: '✅' },
  { value: 'faibles_charges', label: 'Faibles charges', emoji: '💰' },
  { value: 'sans_vis_a_vis', label: 'Sans vis-à-vis', emoji: '👁️' },
  { value: 'dernier_etage', label: 'Dernier étage', emoji: '🔝' },
  { value: 'ascenseur', label: 'Ascenseur', emoji: '🛗' },
  { value: 'emplacement', label: 'Emplacement', emoji: '📍' },
  { value: 'transports', label: 'Transports', emoji: '🚆' },
  { value: 'ecoles', label: 'Écoles proches', emoji: '🏫' },
  { value: 'commerces', label: 'Commerces', emoji: '🛒' },
  { value: 'rare', label: 'Bien rare', emoji: '💎' },
  { value: 'copro_saine', label: 'Copro saine', emoji: '🏢' },
];

// ============================================
// Options prédéfinies Points Faibles
// ============================================

export const POINTS_FAIBLES_OPTIONS: PointChip[] = [
  { value: 'vis_a_vis', label: 'Vis-à-vis', emoji: '👁️' },
  { value: 'travaux', label: 'Travaux à prévoir', emoji: '🔨' },
  { value: 'vetuste', label: 'Vétuste', emoji: '🏚️' },
  { value: 'sombre', label: 'Sombre', emoji: '🌑' },
  { value: 'bruyant', label: 'Bruyant', emoji: '📢' },
  { value: 'petite_surface', label: 'Petite surface', emoji: '📐' },
  { value: 'config_atypique', label: 'Config. atypique', emoji: '🔀' },
  { value: 'cuisine_vetuste', label: 'Cuisine vétuste', emoji: '🍳' },
  { value: 'sdb_vetuste', label: 'SDB vétuste', emoji: '🚿' },
  { value: 'electricite', label: 'Électricité', emoji: '⚡' },
  { value: 'plomberie', label: 'Plomberie', emoji: '🔧' },
  { value: 'fenêtres', label: 'Fenêtres', emoji: '🪟' },
  { value: 'isolation', label: 'Mal isolé', emoji: '❄️' },
  { value: 'chauffage', label: 'Chauffage ancien', emoji: '🔥' },
  { value: 'dpe', label: 'Mauvais DPE', emoji: '📊' },
  { value: 'charges_elevees', label: 'Charges élevées', emoji: '💸' },
  { value: 'pas_parking', label: 'Pas de parking', emoji: '🚫' },
  { value: 'sans_ascenseur', label: 'Sans ascenseur', emoji: '🪜' },
  { value: 'rez_de_chaussee', label: 'Rez-de-chaussée', emoji: '1️⃣' },
  { value: 'manque_rangements', label: 'Manque rangements', emoji: '📦' },
  { value: 'emplacement', label: 'Emplacement', emoji: '📍' },
  { value: 'copro_vieillissante', label: 'Copro vieillissante', emoji: '🏢' },
  { value: 'gros_travaux_ppf', label: 'Gros travaux PPF', emoji: '🏗️' },
  { value: 'nuisances', label: 'Nuisances sonores', emoji: '🔊' },
  { value: 'route', label: 'Route passante', emoji: '🛣️' },
  { value: 'humidite', label: 'Humidité', emoji: '💧' },
  { value: 'agencement', label: 'Agencement', emoji: '🔲' },
  { value: 'pente', label: 'Terrain en pente', emoji: '⛰️' },
];
