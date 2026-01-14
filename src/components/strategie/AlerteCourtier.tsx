// ============================================
// Composant Alerte Courtier
// ============================================

import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AlerteCourtierProps {
  type: 'warning' | 'critical' | 'info';
  message: string;
}

export function AlerteCourtier({ type, message }: AlerteCourtierProps) {
  const Icon = type === 'critical' ? AlertTriangle : type === 'warning' ? AlertCircle : Info;
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border-2",
      type === 'critical' && "bg-red-50 border-red-300",
      type === 'warning' && "bg-amber-50 border-amber-300",
      type === 'info' && "bg-blue-50 border-blue-300"
    )}>
      <Icon className={cn(
        "h-5 w-5 mt-0.5 shrink-0",
        type === 'critical' && "text-red-600",
        type === 'warning' && "text-amber-600",
        type === 'info' && "text-blue-600"
      )} />
      <div>
        <p className={cn(
          "text-sm font-medium",
          type === 'critical' && "text-red-700",
          type === 'warning' && "text-amber-700",
          type === 'info' && "text-blue-700"
        )}>
          Note courtier (non visible client)
        </p>
        <p className={cn(
          "text-sm mt-1",
          type === 'critical' && "text-red-600",
          type === 'warning' && "text-amber-600",
          type === 'info' && "text-blue-600"
        )}>
          {message}
        </p>
      </div>
    </div>
  );
}
