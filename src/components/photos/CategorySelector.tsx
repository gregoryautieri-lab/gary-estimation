import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PhotoCategorie } from '@/types/estimation';
import { PHOTO_CATEGORIES } from '@/types/estimation';

interface CategorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: PhotoCategorie | string;
  onSelect: (categorie: PhotoCategorie | string) => void;
  customCategories?: string[];
  onAddCustomCategory?: (name: string) => void;
}

export function CategorySelector({
  open,
  onOpenChange,
  selected,
  onSelect,
  customCategories = [],
  onAddCustomCategory,
}: CategorySelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleSelect = (value: PhotoCategorie | string) => {
    onSelect(value);
    onOpenChange(false);
  };

  const handleAddCustom = () => {
    if (customName.trim() && onAddCustomCategory) {
      onAddCustomCategory(customName.trim());
      setCustomName('');
      setShowCustomInput(false);
      // Sélectionner la nouvelle catégorie
      onSelect(customName.trim());
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Choisir une catégorie</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          {/* Catégories prédéfinies - grille 3 colonnes */}
          <div className="grid grid-cols-3 gap-2">
            {PHOTO_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleSelect(cat.value)}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[80px]',
                  selected === cat.value
                    ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <span className="text-2xl mb-1">{cat.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight">
                  {cat.label}
                </span>
                {selected === cat.value && (
                  <Check className="h-3 w-3 text-primary mt-1" />
                )}
              </button>
            ))}
          </div>

          {/* Catégories personnalisées */}
          {customCategories.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Catégories personnalisées
              </p>
              <div className="grid grid-cols-3 gap-2">
                {customCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                      'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[80px]',
                      selected === cat
                        ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2'
                        : 'border-dashed border-border bg-card hover:border-primary/50'
                    )}
                  >
                    <span className="text-2xl mb-1">🏷️</span>
                    <span className="text-xs font-medium text-center leading-tight truncate max-w-full">
                      {cat}
                    </span>
                    {selected === cat && (
                      <Check className="h-3 w-3 text-primary mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ajouter catégorie personnalisée */}
          {onAddCustomCategory && (
            <div className="mt-4">
              {showCustomInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom de la catégorie..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    maxLength={20}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustom();
                      if (e.key === 'Escape') {
                        setShowCustomInput(false);
                        setCustomName('');
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleAddCustom}
                    disabled={!customName.trim()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setShowCustomInput(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une catégorie
                </Button>
              )}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Composant badge compact pour afficher la catégorie sur une photo
interface CategoryBadgeProps {
  categorie: PhotoCategorie | string;
  onClick?: () => void;
  className?: string;
}

export function CategoryBadge({ categorie, onClick, className }: CategoryBadgeProps) {
  const config = PHOTO_CATEGORIES.find(c => c.value === categorie);
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all',
        'bg-black/60 text-white backdrop-blur-sm',
        onClick && 'hover:bg-black/80 cursor-pointer',
        className
      )}
    >
      <span className="text-sm">{config?.emoji || '🏷️'}</span>
      <span className="truncate max-w-[60px]">{config?.label || categorie}</span>
    </button>
  );
}
