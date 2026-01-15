// ============================================
// Carousel Photos Plein Écran avec Swipe
// ============================================

import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Photo, PhotoCategorie } from '@/types/estimation';
import { getCategorieConfig } from '@/types/estimation';

interface PhotoCarouselProps {
  photos: Photo[];
  isLuxe?: boolean;
}

export function PhotoCarousel({ photos, isLuxe = false }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-white/60">
        <div className="text-center">
          <Maximize className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Aucune photo disponible</p>
          <p className="text-sm mt-2 opacity-70">Ajoutez des photos depuis le module Photos</p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];
  const imageUrl = currentPhoto.storageUrl || currentPhoto.dataUrl;
  const categoryConfig = currentPhoto.categorie ? getCategorieConfig(currentPhoto.categorie) : null;

  return (
    <div 
      className="h-full flex flex-col relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Image principale */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={currentPhoto.titre || `Photo ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              {/* Badges */}
              <div className="flex items-center gap-2">
                {currentPhoto.favori && (
                  <Badge className="bg-yellow-500/80 text-white border-0">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Favori
                  </Badge>
                )}
                {categoryConfig && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {categoryConfig.emoji} {categoryConfig.label}
                  </Badge>
                )}
              </div>
              
              {/* Titre et description */}
              {currentPhoto.titre && (
                <h3 className={cn(
                  "text-xl font-semibold text-white",
                  isLuxe && "text-amber-200"
                )}>
                  {currentPhoto.titre}
                </h3>
              )}
              {currentPhoto.description && (
                <p className="text-white/80 text-sm max-w-md">
                  {currentPhoto.description}
                </p>
              )}
            </div>
            
            {/* Compteur */}
            <div className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              isLuxe ? "bg-amber-500/30 text-amber-200" : "bg-white/20 text-white"
            )}>
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </div>

        {/* Navigation flèches sur l'image */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60",
            currentIndex === 0 && "opacity-30 pointer-events-none"
          )}
          onClick={goToPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60",
            currentIndex === photos.length - 1 && "opacity-30 pointer-events-none"
          )}
          onClick={goToNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Thumbnails */}
      <div className="h-20 bg-black/50 overflow-x-auto">
        <div className="flex h-full items-center gap-2 px-4">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              className={cn(
                "h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                idx === currentIndex
                  ? isLuxe 
                    ? "border-amber-500 ring-2 ring-amber-500/30" 
                    : "border-primary ring-2 ring-primary/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              onClick={() => setCurrentIndex(idx)}
            >
              <img
                src={photo.storageUrl || photo.dataUrl}
                alt={photo.titre || `Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
