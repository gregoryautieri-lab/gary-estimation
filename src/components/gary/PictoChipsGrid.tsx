// ============================================
// Grille de picto-chips sélectionnables
// ============================================

import { cn } from '@/lib/utils';

export interface PictoChip {
  id: string;
  icon: string;
  label: string;
}

interface PictoChipsGridProps {
  options: PictoChip[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  variant?: 'default' | 'negative';
  columns?: 3 | 4 | 5 | 6;
}

export function PictoChipsGrid({ 
  options, 
  selected, 
  onChange, 
  disabled,
  variant = 'default',
  columns = 4
}: PictoChipsGridProps) {
  
  const toggleChip = (id: string) => {
    if (disabled) return;
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={cn("grid gap-2", gridCols[columns])}>
      {options.map(({ id, icon, label }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggleChip(id)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all min-h-[70px]",
              disabled && "opacity-50 cursor-not-allowed",
              // Variante par défaut
              variant === 'default' && !isSelected && "border-border bg-card hover:border-primary/50",
              variant === 'default' && isSelected && "border-primary bg-primary/10 text-primary",
              // Variante négative (nuisances)
              variant === 'negative' && !isSelected && "border-red-200 bg-red-50/50 hover:border-red-300",
              variant === 'negative' && isSelected && "border-red-500 bg-red-100 text-red-700"
            )}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-center leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Options prédéfinies pour les types de rénovation
export const RENOVATION_OPTIONS: PictoChip[] = [
  { id: 'moins10ans', icon: '🕐', label: '< 10 ans' },
  { id: 'structure', icon: '🏗️', label: 'Structure' },
  { id: 'technique', icon: '⚡', label: 'Technique' },
  { id: 'cuisine', icon: '🍳', label: 'Cuisine' },
  { id: 'salles_eau', icon: '🚿', label: "Salles d'eau" },
  { id: 'menuiseries', icon: '🪟', label: 'Fenêtres' },
  { id: 'finitions', icon: '🎨', label: 'Finitions' },
];

// Options prédéfinies pour les travaux récents
export const TRAVAUX_RECENTS_OPTIONS: PictoChip[] = [
  { id: 'toiture', icon: '🏠', label: 'Toiture' },
  { id: 'facade', icon: '🧱', label: 'Façade' },
  { id: 'fenetres', icon: '🪟', label: 'Fenêtres' },
  { id: 'chauffage', icon: '🔥', label: 'Chauffage' },
  { id: 'electrique', icon: '⚡', label: 'Électricité' },
  { id: 'plomberie', icon: '🚰', label: 'Plomberie' },
  { id: 'cuisine', icon: '🍳', label: 'Cuisine' },
  { id: 'sdb', icon: '🚿', label: 'Salle de bain' },
  { id: 'sols', icon: '🪵', label: 'Sols' },
  { id: 'isolation', icon: '🧊', label: 'Isolation' },
  { id: 'peinture', icon: '🎨', label: 'Peinture' },
  { id: 'jardin', icon: '🌳', label: 'Extérieurs' },
];

// Options prédéfinies pour les nuisances
export const NUISANCES_OPTIONS: PictoChip[] = [
  { id: 'bruit_routier', icon: '🚗', label: 'Bruit routier' },
  { id: 'bruit_aerien', icon: '✈️', label: 'Bruit aérien' },
  { id: 'bruit_ferroviaire', icon: '🚆', label: 'Train' },
  { id: 'vis_a_vis', icon: '👁️', label: 'Vis-à-vis' },
  { id: 'odeurs', icon: '👃', label: 'Odeurs' },
  { id: 'antenne', icon: '📡', label: 'Antenne' },
  { id: 'ligne_ht', icon: '⚡', label: 'Ligne HT' },
  { id: 'industrie', icon: '🏭', label: 'Industrie' },
  { id: 'bar_disco', icon: '🎵', label: 'Bar/Disco' },
  { id: 'travaux_prevus', icon: '🚧', label: 'Travaux' },
  { id: 'chantier', icon: '🏗️', label: 'Chantier' },
  { id: 'decharge', icon: '🗑️', label: 'Déchetterie' },
];

// Options prédéfinies pour le chauffage maison
export const CHAUFFAGE_MAISON_OPTIONS: PictoChip[] = [
  { id: 'pac', icon: '🌡️', label: 'PAC' },
  { id: 'gaz', icon: '🔵', label: 'Gaz' },
  { id: 'mazout', icon: '🛢️', label: 'Mazout' },
  { id: 'pellets', icon: '🪵', label: 'Pellets' },
  { id: 'electrique', icon: '⚡', label: 'Électrique' },
  { id: 'cad', icon: '🏙️', label: 'CAD' },
  { id: 'geothermie', icon: '🌍', label: 'Géothermie' },
  { id: 'solaire', icon: '☀️', label: 'Solaire' },
];
