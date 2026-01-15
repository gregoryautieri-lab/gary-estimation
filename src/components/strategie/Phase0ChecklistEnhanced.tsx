// ============================================
// Checklist Phase 0 Complète avec 15+ actions
// ============================================

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, X, Camera, FileText, Plane, Home, Video, File, Phone, ClipboardList, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Phase0Action {
  id: string;
  label: string;
  checked: boolean;
  isDefault: boolean;
  icon?: string;
  category?: 'preparation' | 'media' | 'documents' | 'contact';
}

interface Phase0ChecklistEnhancedProps {
  actions: Phase0Action[];
  customActions: string[];
  onToggleAction: (actionId: string) => void;
  onAddCustomAction: (action: string) => void;
  onRemoveCustomAction: (action: string) => void;
  disabled?: boolean;
}

// Actions par défaut Phase 0 - OBLIGATOIRES (non cochables, progression automatique)
export const getDefaultPhase0Actions = (isMaison: boolean, isLuxe: boolean): Phase0Action[] => {
  const actions: Phase0Action[] = [
    // Documents OBLIGATOIRES
    { id: 'fixation_prix', label: 'Fixation du prix de mise en vente', checked: false, isDefault: true, icon: '💰', category: 'documents' },
    { id: 'mandat', label: 'Signature du mandat', checked: false, isDefault: true, icon: '📝', category: 'documents' },
    { id: 'dossier_vendeur', label: 'Récupérer dossier vendeur (titre, plans, etc.)', checked: false, isDefault: true, icon: '📁', category: 'documents' },
    { id: 'verif_cadastre', label: 'Vérification cadastrale', checked: false, isDefault: true, icon: '🗺️', category: 'documents' },
    { id: 'reglement_ppe', label: 'Obtenir règlement PPE / servitudes', checked: false, isDefault: true, icon: '📋', category: 'documents' },
    { id: 'pv_ag', label: 'Demander PV assemblées générales', checked: false, isDefault: true, icon: '📄', category: 'documents' },
    
    // Média OBLIGATOIRES
    { id: 'photos', label: 'Séance photos professionnelles', checked: false, isDefault: true, icon: '📸', category: 'media' },
    { id: 'plans_2d', label: 'Plans 2D / 3D', checked: false, isDefault: true, icon: '📐', category: 'media' },
    { id: 'visite360', label: 'Visite virtuelle 360°', checked: false, isDefault: true, icon: '🔄', category: 'media' },
    { id: 'video', label: 'Vidéo de présentation', checked: false, isDefault: true, icon: '🎬', category: 'media' },
  ];
  
  if (isMaison) {
    actions.push({ id: 'drone', label: 'Prise de vue drone', checked: false, isDefault: true, icon: '🚁', category: 'media' });
  }
  
  if (isLuxe) {
    actions.push({ id: 'homestaging', label: 'Home staging virtuel', checked: false, isDefault: true, icon: '🏠', category: 'media' });
    actions.push({ id: 'brochure', label: 'Brochure luxe imprimée', checked: false, isDefault: true, icon: '📖', category: 'media' });
    actions.push({ id: 'teaser', label: 'Teaser vidéo réseaux sociaux', checked: false, isDefault: true, icon: '📱', category: 'media' });
  }
  
  // Rédaction OBLIGATOIRE
  actions.push({ id: 'redaction', label: 'Rédaction annonce', checked: false, isDefault: true, icon: '✍️', category: 'preparation' });
  actions.push({ id: 'traduction', label: 'Traduction annonce (EN/DE)', checked: false, isDefault: true, icon: '🌐', category: 'preparation' });
  
  // Contact OBLIGATOIRE
  actions.push({ id: 'brief_equipe', label: 'Brief équipe commerciale', checked: false, isDefault: true, icon: '👥', category: 'contact' });
  actions.push({ id: 'contact_acquereurs', label: 'Identifier acquéreurs potentiels', checked: false, isDefault: true, icon: '📞', category: 'contact' });
  
  return actions;
};

const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  documents: { label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  media: { label: 'Médias', icon: <Camera className="h-4 w-4" /> },
  preparation: { label: 'Préparation', icon: <ClipboardList className="h-4 w-4" /> },
  contact: { label: 'Contact', icon: <Phone className="h-4 w-4" /> }
};

export function Phase0ChecklistEnhanced({
  actions,
  customActions,
  onToggleAction,
  onAddCustomAction,
  onRemoveCustomAction,
  disabled = false
}: Phase0ChecklistEnhancedProps) {
  const [newAction, setNewAction] = useState('');

  const handleAddAction = () => {
    if (newAction.trim()) {
      onAddCustomAction(newAction.trim());
      setNewAction('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAction();
    }
  };

  // Calcul progression
  const totalActions = actions.length + customActions.length;
  const completedActions = actions.filter(a => a.checked).length + customActions.length;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Grouper par catégorie
  const groupedActions = actions.reduce((acc, action) => {
    const cat = action.category || 'preparation';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {} as Record<string, Phase0Action[]>);

  return (
    <div className="space-y-4">
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Progression Phase 0</span>
          <span className={cn(
            "font-bold",
            progressPercent === 100 ? "text-green-600" : "text-primary"
          )}>
            {completedActions}/{totalActions} ({progressPercent}%)
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Actions groupées par catégorie */}
      {Object.entries(groupedActions).map(([category, categoryActions]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {categoryLabels[category]?.icon}
            <span>{categoryLabels[category]?.label || category}</span>
          </div>
          <div className="space-y-1">
            {categoryActions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                  action.checked 
                    ? "bg-green-50 border-green-200" 
                    : "bg-card border-border hover:border-muted-foreground/30",
                  disabled && "opacity-50"
                )}
              >
                <Checkbox
                  id={action.id}
                  checked={action.checked}
                  onCheckedChange={() => !disabled && onToggleAction(action.id)}
                  disabled={disabled}
                  className={action.checked ? "border-green-600 data-[state=checked]:bg-green-600" : ""}
                />
                <label
                  htmlFor={action.id}
                  className={cn(
                    "flex-1 text-sm cursor-pointer flex items-center gap-2",
                    action.checked ? "text-green-800 line-through" : "text-foreground"
                  )}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </label>
                {action.checked && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions personnalisées */}
      {customActions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Plus className="h-4 w-4" />
            <span>Actions personnalisées</span>
          </div>
          <div className="space-y-1">
            {customActions.map((action, idx) => (
              <div
                key={`custom-${idx}`}
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-blue-50 border-blue-200"
              >
                <Checkbox checked={true} disabled className="border-blue-600 data-[state=checked]:bg-blue-600" />
                <span className="flex-1 text-sm text-blue-800 flex items-center gap-2">
                  <span>✨</span>
                  {action}
                </span>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    onClick={() => onRemoveCustomAction(action)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ajouter une action */}
      {!disabled && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ajouter une action personnalisée..."
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddAction}
            disabled={!newAction.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
