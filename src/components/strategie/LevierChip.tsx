// ============================================
// Composant Chip Levier Marketing
// ============================================

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface LevierChipProps {
  label: string;
  icon?: string;
  selected: boolean;
  onToggle: () => void;
}

export function LevierChip({ label, icon, selected, onToggle }: LevierChipProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all text-sm font-medium",
        selected 
          ? "border-primary bg-primary/10 text-primary" 
          : "border-border bg-card text-foreground hover:border-primary/50"
      )}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {selected && <Check className="h-4 w-4" />}
    </button>
  );
}

// Leviers prédéfinis
export const LEVIERS_MARKETING = [
  { id: 'home_staging', label: 'Home staging virtuel', icon: '🏠' },
  { id: 'photos_pro', label: 'Photos professionnelles', icon: '📸' },
  { id: 'drone', label: 'Drone / Vue aérienne', icon: '🚁' },
  { id: 'visite_360', label: 'Visite virtuelle 360°', icon: '🔄' },
  { id: 'video', label: 'Vidéo immersive', icon: '🎬' },
  { id: 'plans', label: 'Plans 2D/3D', icon: '📐' },
  { id: 'brochure', label: 'Brochure luxe', icon: '📖' },
  { id: 'mailing', label: 'Mailing ciblé', icon: '✉️' },
  { id: 'panneau', label: 'Panneau discret', icon: '🪧' }
];
