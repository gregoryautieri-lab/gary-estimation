import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  PriorityScore, 
  getPriorityLevelConfig,
  getPriorityBreakdownDescription 
} from '@/lib/priorityScore';

interface PriorityBadgeProps {
  priority: PriorityScore;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriorityBadge({ 
  priority, 
  showScore = true, 
  size = 'sm',
  className 
}: PriorityBadgeProps) {
  const config = getPriorityLevelConfig(priority.level);
  const descriptions = getPriorityBreakdownDescription(priority.breakdown);
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline"
          className={cn(
            sizeClasses[size],
            config.bgClass,
            config.color,
            config.borderClass,
            'font-medium cursor-help',
            className
          )}
        >
          <span className="mr-1">{config.icon}</span>
          {showScore ? priority.total : config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">Score de priorité</span>
            <span className={cn('font-bold', config.color)}>{priority.total}/100</span>
          </div>
          
          <div className="text-xs space-y-1 border-t border-border pt-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Urgence</span>
              <span>{priority.breakdown.urgence}/30</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span>{priority.breakdown.montant}/25</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ancienneté</span>
              <span>{priority.breakdown.anciennete}/20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complétion</span>
              <span>{priority.breakdown.completion}/15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Engagement</span>
              <span>{priority.breakdown.engagement}/10</span>
            </div>
          </div>
          
          {descriptions.length > 0 && (
            <div className="text-xs border-t border-border pt-2 space-y-1">
              {descriptions.map((desc, i) => (
                <div key={i}>{desc}</div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface PriorityIndicatorProps {
  priority: PriorityScore;
  className?: string;
}

export function PriorityIndicator({ priority, className }: PriorityIndicatorProps) {
  const config = getPriorityLevelConfig(priority.level);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            'w-2 h-2 rounded-full shrink-0 cursor-help',
            priority.level === 'critical' && 'bg-red-500 animate-pulse',
            priority.level === 'high' && 'bg-orange-500',
            priority.level === 'medium' && 'bg-yellow-500',
            priority.level === 'low' && 'bg-green-500',
            className
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        <span className={config.color}>
          {config.icon} Priorité {config.label.toLowerCase()} ({priority.total})
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
