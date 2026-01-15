// ============================================
// Composant Date de Vente Idéale avec Calendrier
// ============================================

import { useState } from 'react';
import { format, addMonths, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';

interface DateVenteIdealeProps {
  value: string; // Format YYYY-MM-DD ou YYYY-MM
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
  const [open, setOpen] = useState(false);
  
  // Parser la valeur existante
  const selectedDate = value 
    ? (value.length === 7 
        ? parse(value + '-15', 'yyyy-MM-dd', new Date()) // YYYY-MM format
        : parse(value, 'yyyy-MM-dd', new Date()))
    : undefined;
  
  // Limites : de maintenant à +18 mois
  const minDate = new Date();
  const maxDate = addMonths(new Date(), 18);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                isUrgent && "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate 
                ? format(selectedDate, "d MMMM yyyy", { locale: fr })
                : "Sélectionner une date..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              disabled={(date) => date < minDate || date > maxDate}
              initialFocus
              locale={fr}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        {value && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClear}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

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
