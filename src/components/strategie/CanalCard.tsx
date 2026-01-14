// ============================================
// Composant Card Canal de Diffusion
// ============================================

import { cn } from '@/lib/utils';
import { Lock, Check, X } from 'lucide-react';

interface CanalCardProps {
  id: string;
  icon: string;
  label: string;
  desc: string;
  status: 'active' | 'reserve' | 'excluded';
  locked: boolean;
  selected?: boolean;
  onToggle?: () => void;
}

export function CanalCard({ 
  icon, 
  label, 
  desc, 
  status, 
  locked,
  selected = false,
  onToggle
}: CanalCardProps) {
  const isActive = status === 'active' || selected;
  const isExcluded = status === 'excluded';
  
  return (
    <div 
      onClick={() => !locked && !isExcluded && onToggle?.()}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
        locked && "cursor-not-allowed",
        !locked && !isExcluded && "cursor-pointer",
        isActive && !isExcluded && "border-emerald-500 bg-emerald-50",
        !isActive && !isExcluded && "border-border bg-card hover:border-primary/30",
        isExcluded && "border-red-200 bg-red-50/50 opacity-50"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "text-2xl",
        isExcluded && "line-through"
      )}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-medium text-sm truncate",
            isExcluded && "line-through text-muted-foreground"
          )}>
            {label}
          </h4>
          {locked && (
            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      
      {/* Status indicator */}
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
        isActive && !isExcluded && "bg-emerald-500",
        !isActive && !isExcluded && "bg-muted",
        isExcluded && "bg-red-200"
      )}>
        {isActive && !isExcluded && <Check className="h-4 w-4 text-white" />}
        {isExcluded && <X className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  );
}
