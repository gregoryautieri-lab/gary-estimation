import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COMMUNES_GENEVE } from '@/constants/communesGeneve';

interface MultiSelectCommunesProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplay?: number;
}

export function MultiSelectCommunes({
  value,
  onChange,
  placeholder = 'Sélectionner des communes...',
  disabled = false,
  maxDisplay = 3,
}: MultiSelectCommunesProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (commune: string) => {
    if (value.includes(commune)) {
      onChange(value.filter((v) => v !== commune));
    } else {
      onChange([...value, commune]);
    }
  };

  const handleRemove = (commune: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== commune));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between min-h-[44px] h-auto"
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : value.length <= maxDisplay ? (
              value.map((commune) => (
                <Badge
                  key={commune}
                  variant="secondary"
                  className="mr-1 mb-0.5"
                >
                  {commune}
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => handleRemove(commune, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">
                {value.length} communes sélectionnées
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une commune..." />
          <CommandList>
            <CommandEmpty>Aucune commune trouvée.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {COMMUNES_GENEVE.map((commune) => (
                <CommandItem
                  key={commune}
                  value={commune}
                  onSelect={() => handleSelect(commune)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.includes(commune) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {commune}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
