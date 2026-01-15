import { Lock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LockBannerProps {
  message: string;
  onDuplicate?: () => void;
  duplicating?: boolean;
}

/**
 * Bandeau affiché quand une estimation est verrouillée
 * Propose de dupliquer pour modifier
 */
export function LockBanner({ message, onDuplicate, duplicating }: LockBannerProps) {
  return (
    <Alert 
      className="mb-4 border-amber-300 bg-amber-50 text-amber-900"
    >
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm">{message}</span>
        {onDuplicate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            disabled={duplicating}
            className="border-amber-400 hover:bg-amber-100 whitespace-nowrap"
          >
            <Copy className="w-4 h-4 mr-1" />
            {duplicating ? 'Duplication...' : 'Dupliquer'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
