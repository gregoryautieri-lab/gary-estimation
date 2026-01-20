import { MapPin, Calendar, ChevronRight, MoreVertical, Pencil, Archive, Copy, Trash2, ArchiveRestore, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectComparable } from '@/hooks/useProjectsComparables';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectCardProps {
  project: ProjectComparable;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function formatPriceRange(min: number | null, max: number | null): string {
  const format = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}'000`;
    return n.toString();
  };

  if (min && max) return `${format(min)} - ${format(max)} CHF`;
  if (min) return `Dès ${format(min)} CHF`;
  if (max) return `Jusqu'à ${format(max)} CHF`;
  return '';
}

function formatTypeBien(types: string[] | null): string {
  if (!types || types.length === 0) return '';
  if (types.length <= 2) return types.join(', ');
  return `${types.slice(0, 2).join(', ')} +${types.length - 2}`;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

export function ProjectCard({ 
  project, 
  onOpen, 
  onEdit, 
  onArchive, 
  onDuplicate, 
  onDelete 
}: ProjectCardProps) {
  const priceRange = formatPriceRange(project.prixMin, project.prixMax);
  const typeBienStr = formatTypeBien(project.typeBien);
  const lastSearchRelative = formatRelativeDate(project.lastSearchDate);
  const updatedRelative = formatRelativeDate(project.updatedAt);

  return (
    <div 
      className={`bg-card border rounded-lg p-3 transition-all hover:border-primary/50 ${
        project.archived ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-medium text-sm text-foreground truncate">
              📍 {project.projectName}
            </h3>
            {project.archived && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                Archivé
              </Badge>
            )}
          </div>
        </button>
        
        {/* Menu contextuel */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onOpen}>
              <ChevronRight className="h-4 w-4 mr-2" />
              Ouvrir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Éditer le nom
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive}>
              {project.archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Désarchiver
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Critères */}
      <button onClick={onOpen} className="w-full text-left">
        <div className="space-y-1 text-xs text-muted-foreground mb-2">
          {project.communes && project.communes.length > 0 && (
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>Commune{project.communes.length > 1 ? 's' : ''}: {project.communes.join(', ')}</span>
            </p>
          )}
          {priceRange && (
            <p className="flex items-center gap-1">
              <span className="text-foreground font-medium text-xs">{priceRange}</span>
            </p>
          )}
          {typeBienStr && (
            <p className="flex items-center gap-1">
              <Home className="h-3 w-3 shrink-0" />
              <span>{typeBienStr}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-sm">🏠</span>
            <span className="font-medium text-foreground">{project.nbComparables}</span>
            <span className="text-muted-foreground">comparable{project.nbComparables !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-2.5 w-2.5" />
            <span>
              {lastSearchRelative 
                ? `Recherche ${lastSearchRelative}` 
                : updatedRelative 
                  ? `Modifié ${updatedRelative}`
                  : ''
              }
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
