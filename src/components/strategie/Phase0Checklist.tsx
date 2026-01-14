// ============================================
// Composant Checklist Actions Phase 0
// ============================================

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionPhase0 } from '@/hooks/useStrategieLogic';

interface Phase0ChecklistProps {
  actions: ActionPhase0[];
  customActions: string[];
  onToggleAction: (actionId: string) => void;
  onAddCustomAction: (action: string) => void;
  onRemoveCustomAction: (action: string) => void;
}

export function Phase0Checklist({
  actions,
  customActions,
  onToggleAction,
  onAddCustomAction,
  onRemoveCustomAction
}: Phase0ChecklistProps) {
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

  return (
    <div className="space-y-3">
      {/* Actions par défaut */}
      {actions.map((action) => (
        <div
          key={action.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            action.checked 
              ? "bg-primary/5 border-primary/20" 
              : "bg-card border-border hover:border-muted-foreground/30"
          )}
        >
          <Checkbox
            id={action.id}
            checked={action.checked}
            onCheckedChange={() => onToggleAction(action.id)}
          />
          <label
            htmlFor={action.id}
            className={cn(
              "flex-1 text-sm cursor-pointer",
              action.checked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {action.label}
          </label>
        </div>
      ))}

      {/* Actions personnalisées */}
      {customActions.map((action, idx) => (
        <div
          key={`custom-${idx}`}
          className="flex items-center gap-3 p-3 rounded-lg border bg-accent/10 border-accent/20"
        >
          <Checkbox checked={true} disabled className="opacity-50" />
          <span className="flex-1 text-sm">{action}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onRemoveCustomAction(action)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Ajouter une action */}
      <div className="flex gap-2 pt-2">
        <Input
          value={newAction}
          onChange={(e) => setNewAction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter une action..."
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
    </div>
  );
}
