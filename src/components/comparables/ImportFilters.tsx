import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';

// Types de bien disponibles
const TYPE_BIEN_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'villa', label: 'Villa' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'immeuble', label: 'Immeuble' },
];

const STATUT_OPTIONS = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'vendus', label: 'Vendus (mandat signé)' },
  { value: 'en_vente', label: 'En vente (présenté)' },
];

export interface ImportFiltersState {
  commune: string;
  prixMin: number | null;
  prixMax: number | null;
  typeBien: string[];
  statut: string;
}

interface ImportFiltersProps {
  filters: ImportFiltersState;
  onFiltersChange: (filters: ImportFiltersState) => void;
  communes: string[];
  loadingCommunes: boolean;
  resultCount: number;
}

export function ImportFilters({
  filters,
  onFiltersChange,
  communes,
  loadingCommunes,
  resultCount,
}: ImportFiltersProps) {
  const isMobile = useIsMobile();

  const updateFilter = <K extends keyof ImportFiltersState>(
    key: K,
    value: ImportFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const parseNumber = (value: string): number | null => {
    const num = value.replace(/[^\d]/g, '');
    return num ? parseInt(num, 10) : null;
  };

  const formatNumber = (value: number | null): string => {
    return value ? value.toLocaleString('fr-CH') : '';
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      {/* Commune */}
      <div className="space-y-2">
        <Label>Commune</Label>
        <Select
          value={filters.commune || '_all'}
          onValueChange={(value) => updateFilter('commune', value === '_all' ? '' : value)}
          disabled={loadingCommunes}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCommunes ? "Chargement..." : "Toutes les communes"} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="_all">Toutes les communes</SelectItem>
            {communes.map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fourchette de prix */}
      <div className="space-y-2">
        <Label>Fourchette de prix (CHF)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Min"
            value={formatNumber(filters.prixMin)}
            onChange={(e) => updateFilter('prixMin', parseNumber(e.target.value))}
          />
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Max"
            value={formatNumber(filters.prixMax)}
            onChange={(e) => updateFilter('prixMax', parseNumber(e.target.value))}
          />
        </div>
      </div>

      {/* Types de bien */}
      <div className="space-y-2">
        <Label>Types de bien</Label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_BIEN_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`import-type-${option.value}`}
                checked={filters.typeBien.includes(option.value)}
                onCheckedChange={(checked) => {
                  const newValue = checked
                    ? [...filters.typeBien, option.value]
                    : filters.typeBien.filter((v) => v !== option.value);
                  updateFilter('typeBien', newValue);
                }}
              />
              <label
                htmlFor={`import-type-${option.value}`}
                className="text-sm leading-none cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Statut */}
      <div className="space-y-2">
        <Label>Statut</Label>
        <Select
          value={filters.statut}
          onValueChange={(value) => updateFilter('statut', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compteur résultats */}
      <div className="pt-2 border-t">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{resultCount}</span> estimation{resultCount !== 1 ? 's' : ''} trouvée{resultCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );

  // Mobile: accordéon collapsible
  if (isMobile) {
    return (
      <Accordion type="single" collapsible defaultValue="filters" className="w-full">
        <AccordionItem value="filters" className="border-none">
          <AccordionTrigger className="py-3 px-4 bg-muted/50 rounded-lg hover:no-underline">
            <span className="text-sm font-medium">
              Filtres ({resultCount} résultats)
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-1">
            <FiltersContent />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Desktop: affichage direct
  return (
    <div className="p-4 bg-muted/30 rounded-lg border">
      <h3 className="font-medium mb-4">Filtres</h3>
      <FiltersContent />
    </div>
  );
}
