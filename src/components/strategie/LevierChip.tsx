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

// Leviers prédéfinis - NETTOYÉS des doublons Phase 0
// (Photos, plans, 360, vidéo, drone, home staging sont déjà dans Phase 0)
export const LEVIERS_MARKETING = [
  { id: 'brochure', label: 'Brochure luxe imprimée', icon: '📖' },
  { id: 'mailing', label: 'Mailing ciblé acquéreurs', icon: '✉️' },
  { id: 'panneau', label: 'Panneau discret', icon: '🪧' },
  { id: 'social_ads', label: 'Publicité réseaux sociaux', icon: '📱' },
  { id: 'open_house', label: 'Open House', icon: '🏡' },
  { id: 'presse', label: 'Annonce presse locale', icon: '📰' },
  { id: 'vitrine', label: 'Vitrine agence premium', icon: '🏪' }
];
