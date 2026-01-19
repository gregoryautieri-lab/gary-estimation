import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ArchivedFilter = 'active' | 'archived' | 'all';
export type SortOption = 'recent' | 'oldest' | 'nb_comparables';

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  communeFilter: string;
  onCommuneChange: (value: string) => void;
  availableCommunes: string[];
  archivedFilter: ArchivedFilter;
  onArchivedChange: (value: ArchivedFilter) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
}

export function ProjectFilters({
  search,
  onSearchChange,
  communeFilter,
  onCommuneChange,
  availableCommunes,
  archivedFilter,
  onArchivedChange,
  sortBy,
  onSortChange,
  resultCount,
}: ProjectFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un projet..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Commune filter */}
        <Select value={communeFilter} onValueChange={onCommuneChange}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Commune" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {availableCommunes.map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={archivedFilter} onValueChange={(v) => onArchivedChange(v as ArchivedFilter)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récent</SelectItem>
            <SelectItem value="oldest">Plus ancien</SelectItem>
            <SelectItem value="nb_comparables">Nb comparables</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {resultCount} projet{resultCount !== 1 ? 's' : ''} trouvé{resultCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
