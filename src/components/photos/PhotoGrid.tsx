import React, { useState, useMemo } from 'react';
import { X, Star, StarOff, Loader2, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Photo, PhotoCategorie } from '@/types/estimation';
import { PHOTO_CATEGORIES, getCategorieConfig } from '@/types/estimation';
import { PhotoEditModal } from './PhotoEditModal';
import { CategorySelector, CategoryBadge } from './CategorySelector';

interface PhotoGridProps {
  photos: Photo[];
  onDelete: (photo: Photo) => void;
  onUpdate?: (photo: Photo) => void;
  onToggleFavori?: (photo: Photo) => void;
  onCategorieChange?: (photo: Photo, categorie: PhotoCategorie | string) => void;
  readonly?: boolean;
  groupByCategory?: boolean;
  customCategories?: string[];
  onAddCustomCategory?: (name: string) => void;
}

export function PhotoGrid({ 
  photos, 
  onDelete,
  onUpdate,
  onToggleFavori,
  onCategorieChange,
  readonly,
  groupByCategory = true,
  customCategories = [],
  onAddCustomCategory
}: PhotoGridProps) {
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  // Grouper et trier par catégorie
  const groupedPhotos = useMemo(() => {
    if (!groupByCategory) {
      return [{ category: null, photos }];
    }

    const groups: Map<PhotoCategorie | 'unset', Photo[]> = new Map();
    
    // Initialiser les groupes dans l'ordre des catégories
    PHOTO_CATEGORIES.forEach(cat => {
      groups.set(cat.value, []);
    });
    groups.set('unset', []);

    // Répartir les photos
    photos.forEach(photo => {
      const cat = photo.categorie || 'unset';
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)!.push(photo);
    });

    // Convertir en array et filtrer les groupes vides
    return Array.from(groups.entries())
      .filter(([_, photos]) => photos.length > 0)
      .map(([category, photos]) => ({
        category: category === 'unset' ? null : category,
        photos: photos.sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
      }));
  }, [photos, groupByCategory]);

  const handlePhotoSave = (updatedPhoto: Photo) => {
    if (onUpdate) {
      onUpdate(updatedPhoto);
    } else if (onCategorieChange && updatedPhoto.categorie) {
      onCategorieChange(updatedPhoto, updatedPhoto.categorie);
    }
    setEditingPhoto(null);
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Aucune photo</p>
        <p className="text-xs mt-1">Prenez des photos ou importez depuis la galerie</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groupedPhotos.map(({ category, photos: groupPhotos }) => {
          const catConfig = category ? getCategorieConfig(category) : null;
          
          return (
            <div key={category || 'unset'}>
              {/* Header catégorie */}
              {groupByCategory && (
                <div className="flex items-center gap-2 mb-2">
                  {catConfig ? (
                    <>
                      <span className="text-base">{catConfig.emoji}</span>
                      <span className="font-medium text-sm">{catConfig.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {groupPhotos.length}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <span className="text-base">📷</span>
                      <span className="font-medium text-sm text-muted-foreground">Non catégorisées</span>
                      <Badge variant="outline" className="text-xs">
                        {groupPhotos.length}
                      </Badge>
                    </>
                  )}
                </div>
              )}

              {/* Grille photos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {groupPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onDelete={() => onDelete(photo)}
                    onEdit={() => setEditingPhoto(photo)}
                    onToggleFavori={onToggleFavori ? () => onToggleFavori(photo) : undefined}
                    onCategorieChange={onCategorieChange}
                    readonly={readonly}
                    customCategories={customCategories}
                    onAddCustomCategory={onAddCustomCategory}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal d'édition */}
      <PhotoEditModal
        photo={editingPhoto}
        open={!!editingPhoto}
        onOpenChange={(open) => !open && setEditingPhoto(null)}
        onSave={handlePhotoSave}
        onDelete={!readonly ? onDelete : undefined}
        customCategories={customCategories}
        onAddCustomCategory={onAddCustomCategory}
      />
    </>
  );
}

interface PhotoCardProps {
  photo: Photo;
  onDelete: () => void;
  onEdit: () => void;
  onToggleFavori?: () => void;
  onCategorieChange?: (photo: Photo, categorie: PhotoCategorie | string) => void;
  readonly?: boolean;
  customCategories?: string[];
  onAddCustomCategory?: (name: string) => void;
}

function PhotoCard({ 
  photo, 
  onDelete, 
  onEdit, 
  onToggleFavori, 
  onCategorieChange, 
  readonly,
  customCategories = [],
  onAddCustomCategory
}: PhotoCardProps) {
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const imageUrl = photo.storageUrl || photo.dataUrl;
  const categoryConfig = getCategorieConfig(photo.categorie);

  return (
    <>
      <div className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
        {/* Image */}
        {photo.uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={photo.titre || photo.nom}
            className="w-full h-full object-cover cursor-pointer"
            loading="lazy"
            onClick={onEdit}
          />
        )}

        {/* Overlay actions */}
        {!readonly && !photo.uploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 gap-1">
            {/* Éditer */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>

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

        {/* Indicateur favori */}
        {photo.favori && (
          <div className="absolute top-1.5 left-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow" />
          </div>
        )}

        {/* Indicateur défaut */}
        {photo.defaut && (
          <div className="absolute top-1.5 right-1.5">
            <AlertTriangle className="h-4 w-4 text-destructive drop-shadow" />
          </div>
        )}

        {/* Badge catégorie en bas - nouveau design lisible */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-1.5">
            <CategoryBadge
              categorie={photo.categorie || 'autre'}
              onClick={!readonly && onCategorieChange ? () => setShowCategorySelector(true) : undefined}
            />
            {photo.titre && (
              <span className="text-white text-xs truncate drop-shadow font-medium">
                {photo.titre}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Drawer sélection catégorie */}
      {onCategorieChange && (
        <CategorySelector
          open={showCategorySelector}
          onOpenChange={setShowCategorySelector}
          selected={photo.categorie || 'autre'}
          onSelect={(cat) => onCategorieChange(photo, cat as PhotoCategorie)}
          customCategories={customCategories}
          onAddCustomCategory={onAddCustomCategory}
        />
      )}
    </>
  );
}
