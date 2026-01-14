// ============================================
// Composant Alerte Courtier (enrichi)
// ============================================

import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface AlerteCourtierProps {
  type: 'warning' | 'critical' | 'info' | 'success';
  title?: string;
  message: string;
  actions?: string[];
}

export function AlerteCourtier({ type, title, message, actions }: AlerteCourtierProps) {
  const Icon = type === 'critical' ? AlertTriangle 
    : type === 'warning' ? AlertCircle 
    : type === 'success' ? CheckCircle 
    : Info;
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border-2",
      type === 'critical' && "bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-800",
      type === 'warning' && "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800",
      type === 'info' && "bg-blue-50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-800",
      type === 'success' && "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800"
    )}>
      <Icon className={cn(
        "h-5 w-5 mt-0.5 shrink-0",
        type === 'critical' && "text-red-600",
        type === 'warning' && "text-amber-600",
        type === 'info' && "text-blue-600",
        type === 'success' && "text-green-600"
      )} />
      <div className="flex-1">
        <p className={cn(
          "text-xs font-medium opacity-70",
          type === 'critical' && "text-red-700 dark:text-red-400",
          type === 'warning' && "text-amber-700 dark:text-amber-400",
          type === 'info' && "text-blue-700 dark:text-blue-400",
          type === 'success' && "text-green-700 dark:text-green-400"
        )}>
          Note courtier (non visible client)
        </p>
        {title && (
          <p className={cn(
            "text-sm font-bold mt-1",
            type === 'critical' && "text-red-800 dark:text-red-300",
            type === 'warning' && "text-amber-800 dark:text-amber-300",
            type === 'info' && "text-blue-800 dark:text-blue-300",
            type === 'success' && "text-green-800 dark:text-green-300"
          )}>
            {title}
          </p>
        )}
        <p className={cn(
          "text-sm mt-1",
          type === 'critical' && "text-red-600 dark:text-red-400",
          type === 'warning' && "text-amber-600 dark:text-amber-400",
          type === 'info' && "text-blue-600 dark:text-blue-400",
          type === 'success' && "text-green-600 dark:text-green-400"
        )}>
          {message}
        </p>
        {actions && actions.length > 0 && (
          <ul className="mt-2 space-y-1">
            {actions.map((action, idx) => (
              <li key={idx} className={cn(
                "text-xs flex items-center gap-1.5",
                type === 'critical' && "text-red-600 dark:text-red-400",
                type === 'warning' && "text-amber-600 dark:text-amber-400",
                type === 'info' && "text-blue-600 dark:text-blue-400",
                type === 'success' && "text-green-600 dark:text-green-400"
              )}>
                <span>→</span> {action}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
