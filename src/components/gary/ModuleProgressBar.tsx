import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { ModuleStatus } from '@/lib/completionScore';

interface ModuleProgressBarProps {
  modules: ModuleStatus[];
  currentModule: number | string;
  estimationId: string;
}

export const ModuleProgressBar = ({ 
  modules, 
  currentModule, 
  estimationId 
}: ModuleProgressBarProps) => {
  const navigate = useNavigate();

  const getStatusIcon = (status: 'complete' | 'partial' | 'empty', completion: number) => {
    if (status === 'complete') {
      return <Check className="h-3 w-3 text-white" />;
    }
    if (status === 'partial') {
      return <AlertCircle className="h-3 w-3 text-white" />;
    }
    return <Circle className="h-3 w-3 text-muted-foreground" />;
  };

  const getStatusColor = (status: 'complete' | 'partial' | 'empty', completion: number) => {
    if (status === 'complete') return 'bg-green-500';
    if (completion >= 50) return 'bg-orange-500';
    if (completion > 0) return 'bg-red-500';
    return 'bg-muted';
  };

  const getStatusBorder = (status: 'complete' | 'partial' | 'empty', completion: number, isCurrent: boolean) => {
    if (isCurrent) return 'ring-2 ring-primary ring-offset-2';
    return '';
  };

  // Calculer la progression totale
  const totalCompletion = modules.length > 0 
    ? Math.round(modules.reduce((acc, m) => acc + m.completion, 0) / modules.length)
    : 0;

  return (
    <div className="bg-background border-b border-border px-4 py-3">
      {/* Barre de progression globale */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Progression
        </span>
        <Progress value={totalCompletion} className="h-2 flex-1" />
        <span className="text-xs font-bold text-foreground min-w-[3rem] text-right">
          {totalCompletion}%
        </span>
      </div>

      {/* Modules cliquables */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
        {modules.map((module) => {
          const isCurrent = module.moduleNumber === currentModule;
          const statusColor = getStatusColor(module.status, module.completion);
          const statusBorder = getStatusBorder(module.status, module.completion, isCurrent);

          return (
            <button
              key={module.moduleNumber}
              onClick={() => navigate(module.route)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all min-w-[60px]",
                "hover:bg-muted/50",
                isCurrent && "bg-muted"
              )}
            >
              {/* Indicateur de statut */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  statusColor,
                  statusBorder
                )}
              >
                {getStatusIcon(module.status, module.completion)}
              </div>

              {/* Numéro et label */}
              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-[10px] font-medium",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  {typeof module.moduleNumber === 'number' ? `M${module.moduleNumber}` : module.moduleNumber}
                </span>
                <span className={cn(
                  "text-[9px] truncate max-w-[50px]",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {module.completion}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
