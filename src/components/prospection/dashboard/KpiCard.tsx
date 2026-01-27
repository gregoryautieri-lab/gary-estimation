import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function KpiCard({ icon: Icon, label, value, subValue, trend, className }: KpiCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold text-foreground">{value}</p>
            {subValue && (
              <span className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-success',
                trend === 'down' && 'text-destructive',
                trend === 'neutral' && 'text-muted-foreground'
              )}>
                {subValue}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
