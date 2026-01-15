import React from 'react';
import { X, Star, StarOff, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Photo } from '@/types/estimation';

interface PhotoGridProps {
  photos: Photo[];
  onDelete: (photo: Photo) => void;
  onToggleFavori?: (photo: Photo) => void;
  onCategorieChange?: (photo: Photo, categorie: Photo['categorie']) => void;
  readonly?: boolean;
}

const CATEGORIES: { value: Photo['categorie']; label: string; emoji: string }[] = [
  { value: 'exterieur', label: 'Extérieur', emoji: '🏠' },
  { value: 'sejour', label: 'Séjour', emoji: '🛋️' },
  { value: 'cuisine', label: 'Cuisine', emoji: '🍳' },
  { value: 'chambre', label: 'Chambre', emoji: '🛏️' },
  { value: 'sdb', label: 'Salle de bain', emoji: '🚿' },
  { value: 'vue', label: 'Vue', emoji: '🌄' },
  { value: 'parking', label: 'Parking', emoji: '🚗' },
  { value: 'autre', label: 'Autre', emoji: '📷' },
];

export function PhotoGrid({ 
  photos, 
  onDelete, 
  onToggleFavori,
  onCategorieChange,
  readonly 
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Aucune photo</p>
        <p className="text-xs mt-1">Prenez des photos ou importez depuis la galerie</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onDelete={() => onDelete(photo)}
          onToggleFavori={onToggleFavori ? () => onToggleFavori(photo) : undefined}
          onCategorieChange={onCategorieChange}
          readonly={readonly}
        />
      ))}
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  onDelete: () => void;
  onToggleFavori?: () => void;
  onCategorieChange?: (photo: Photo, categorie: Photo['categorie']) => void;
  readonly?: boolean;
}

function PhotoCard({ photo, onDelete, onToggleFavori, onCategorieChange, readonly }: PhotoCardProps) {
  const [showCategories, setShowCategories] = React.useState(false);
  const imageUrl = photo.storageUrl || photo.dataUrl;
  const categoryInfo = CATEGORIES.find(c => c.value === photo.categorie) || CATEGORIES[7];

  return (
    <div className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
      {/* Image */}
      {photo.uploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={photo.nom}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Overlay actions */}
      {!readonly && !photo.uploading && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 gap-1">
          {/* Favori */}
          {onToggleFavori && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={onToggleFavori}
            >
              {photo.favori ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Supprimer */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white hover:bg-red-500/50"
            onClick={onDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Badge catégorie */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs cursor-pointer hover:bg-secondary/80",
            !readonly && "cursor-pointer"
          )}
          onClick={() => !readonly && onCategorieChange && setShowCategories(!showCategories)}
        >
          {categoryInfo.emoji} {categoryInfo.label}
        </Badge>
      </div>

      {/* Sélecteur catégorie */}
      {showCategories && !readonly && onCategorieChange && (
        <div className="absolute inset-0 bg-black/80 p-2 flex flex-wrap content-center gap-1 z-10">
          {CATEGORIES.map(cat => (
            <Badge
              key={cat.value}
              variant={cat.value === photo.categorie ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => {
                onCategorieChange(photo, cat.value);
                setShowCategories(false);
              }}
            >
              {cat.emoji} {cat.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Indicateur favori */}
      {photo.favori && (
        <div className="absolute top-1.5 left-1.5">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow" />
        </div>
      )}
    </div>
  );
}
