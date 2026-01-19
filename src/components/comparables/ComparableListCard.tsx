import { MapPin, Trash2, MoreVertical, FileText, Bot, User, ExternalLink, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ComparableData } from '@/hooks/useProjectDetail';
import { cn } from '@/lib/utils';

interface ComparableListCardProps {
  comparable: ComparableData;
  onLocate: () => void;
  onRemove: () => void;
  onViewDetails?: () => void;
  isHighlighted?: boolean;
}

function formatPrice(price: number | null): string {
  if (!price) return '-';
  return new Intl.NumberFormat('fr-CH', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' CHF';
}

function getStatusLabel(comparable: ComparableData): string {
  // For external comparables, use statutMarche
  if (comparable.sourceType === 'external') {
    if (comparable.statutMarche === 'vendu') return 'Vendu';
    return 'En vente';
  }
  // For GARY estimations, use statut
  switch (comparable.statut) {
    case 'mandat_signe': return 'Vendu';
    case 'presentee': return 'En vente';
    case 'en_cours': return 'En cours';
    case 'brouillon': return 'Brouillon';
    case 'a_presenter': return 'À présenter';
    case 'negociation': return 'Négociation';
    default: return comparable.statut;
  }
}

function getStatusColor(comparable: ComparableData): string {
  // For external comparables
  if (comparable.sourceType === 'external') {
    if (comparable.statutMarche === 'vendu') return 'bg-blue-500 text-white';
    return 'bg-green-500 text-white';
  }
  // For GARY estimations
  switch (comparable.statut) {
    case 'mandat_signe': return 'bg-blue-500 text-white';
    case 'presentee': return 'bg-green-500 text-white';
    case 'negociation': return 'bg-amber-500 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('fr-CH', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function ComparableListCard({
  comparable,
  onLocate,
  onRemove,
  onViewDetails,
  isHighlighted = false,
}: ComparableListCardProps) {
  const hasCoordinates = comparable.coordinates && comparable.geocodingStatus !== 'missing';

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 transition-all",
        isHighlighted && "ring-2 ring-primary shadow-md"
      )}
    >
      {/* Header: Status + Type + Source Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs", getStatusColor(comparable))}>
            {getStatusLabel(comparable)}
          </Badge>
          {comparable.typeBien && (
            <span className="text-xs text-muted-foreground capitalize">
              {comparable.typeBien}
            </span>
          )}
          {/* Source badge: GARY vs Externe */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs gap-1",
              comparable.sourceType === 'gary' 
                ? "border-primary/50 text-primary" 
                : "border-muted-foreground/50"
            )}
          >
            {comparable.sourceType === 'gary' ? (
              <>
                <Building className="h-3 w-3" />
                GARY
              </>
            ) : (
              <>
                <ExternalLink className="h-3 w-3" />
                Externe
              </>
            )}
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewDetails && comparable.sourceType === 'gary' && (
              <DropdownMenuItem onClick={onViewDetails}>
                <FileText className="h-4 w-4 mr-2" />
                Voir l'estimation
              </DropdownMenuItem>
            )}
            {comparable.urlSource && (
              <DropdownMenuItem onClick={() => window.open(comparable.urlSource!, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir l'annonce
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Retirer du projet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Price */}
      <p className="font-bold text-xl text-foreground mb-2">
        {formatPrice(comparable.prixFinal)}
      </p>

      {/* Surface & Pieces */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
        {comparable.surface && (
          <span>{comparable.surface} m²</span>
        )}
        {comparable.pieces && (
          <span>{comparable.pieces} pièces</span>
        )}
        {comparable.prixFinal && comparable.surface && (
          <span className="text-xs">
            ({Math.round(comparable.prixFinal / comparable.surface).toLocaleString('fr-CH')} CHF/m²)
          </span>
        )}
      </div>

      {/* Address */}
      <p className="text-sm text-foreground mb-1">
        {comparable.adresse || 'Adresse non renseignée'}
      </p>
      {comparable.localite && (
        <p className="text-xs text-muted-foreground mb-3">
          {comparable.codePostal} {comparable.localite}
        </p>
      )}

      {/* Footer: Source info + Date + Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Added by badge */}
          <Badge variant="outline" className="text-xs gap-1">
            {comparable.selectedByUser ? (
              <>
                <User className="h-3 w-3" />
                Manuel
              </>
            ) : (
              <>
                <Bot className="h-3 w-3" />
                Auto
              </>
            )}
          </Badge>
          
          {/* Strategie badge for external */}
          {comparable.sourceType === 'external' && comparable.strategieDiffusion && (
            <Badge variant="secondary" className="text-xs">
              {comparable.strategieDiffusion === 'off_market' ? 'Off-market' : 
               comparable.strategieDiffusion === 'coming_soon' ? 'Coming soon' : 'Public'}
            </Badge>
          )}
          
          {/* Date */}
          <span className="text-xs text-muted-foreground">
            {comparable.dateVente ? `Vendu ${formatDate(comparable.dateVente)}` : formatDate(comparable.updatedAt)}
          </span>

          {/* Geocoding warning */}
          {comparable.geocodingStatus === 'fallback' && (
            <span className="text-xs text-amber-600" title="Position approximative">
              📍 ~
            </span>
          )}
          {comparable.geocodingStatus === 'missing' && (
            <span className="text-xs text-muted-foreground" title="Pas de coordonnées">
              📍 ?
            </span>
          )}
        </div>

        {/* Locate button */}
        {hasCoordinates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLocate}
            className="h-8 gap-1.5"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Localiser</span>
          </Button>
        )}
      </div>
    </div>
  );
}