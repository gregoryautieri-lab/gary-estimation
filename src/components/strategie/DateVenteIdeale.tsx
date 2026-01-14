// ============================================
// Composant Date de Vente Idéale
// ============================================

import { format, addMonths, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateVenteIdealeProps {
  value: string; // Format YYYY-MM
  onChange: (value: string) => void;
  message?: string;
  isUrgent?: boolean;
}

export function DateVenteIdeale({ 
  value, 
  onChange, 
  message,
  isUrgent 
}: DateVenteIdealeProps) {
  // Générer les 18 prochains mois
  const options = Array.from({ length: 18 }, (_, i) => {
    const date = addMonths(startOfMonth(new Date()), i + 1);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: fr })
    };
  });

  return (
    <div className="space-y-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full p-3 rounded-lg border bg-background text-foreground",
          "focus:ring-2 focus:ring-primary focus:border-primary",
          isUrgent && "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
        )}
      >
        <option value="">Sélectionner un mois...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {message && (
        <p className={cn(
          "text-sm px-1",
          isUrgent ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"
        )}>
          {message}
        </p>
      )}

      <p className="text-xs text-muted-foreground px-1">
        💡 Les durées de phases seront calculées automatiquement pour atteindre cette date.
      </p>
    </div>
  );
}
