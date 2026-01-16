import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Star, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Photo, PhotoCategorie } from '@/types/estimation';
import { PHOTO_CATEGORIES, getCategorieConfig, getTitreSuggestions } from '@/types/estimation';

interface PhotoEditModalProps {
  photo: Photo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
}

export function PhotoEditModal({ 
  photo, 
  open, 
  onOpenChange, 
  onSave,
  onDelete 
}: PhotoEditModalProps) {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState<PhotoCategorie>('autre');
  const [defaut, setDefaut] = useState(false);
  const [favori, setFavori] = useState(false);

  // Sync state with photo prop
  useEffect(() => {
    if (photo) {
      setTitre(photo.titre || '');
      setDescription(photo.description || '');
      setCategorie(photo.categorie || 'autre');
      setDefaut(photo.defaut || false);
      setFavori(photo.favori || false);
    }
  }, [photo]);

  // Suggestions de titres basées sur la catégorie
  const suggestions = useMemo(() => getTitreSuggestions(categorie), [categorie]);

  if (!photo) return null;

  const imageUrl = photo.storageUrl || photo.dataUrl;
  const currentCatConfig = getCategorieConfig(categorie);

  const handleSave = () => {
    onSave({
      ...photo,
      titre: titre.trim() || undefined,
      description: description.trim() || undefined,
      categorie,
      defaut,
      favori
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Supprimer cette photo ?')) {
      onDelete(photo);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Annoter la photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image preview */}
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            <img
              src={imageUrl}
              alt={photo.nom}
              className="w-full h-full object-contain"
            />
            {favori && (
              <div className="absolute top-2 left-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 drop-shadow" />
              </div>
            )}
            {defaut && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Défaut
                </Badge>
              </div>
            )}
          </div>

          {/* Titre avec suggestions */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              placeholder="Ex: Cuisine équipée, Vue dégagée..."
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={50}
            />
            {/* Suggestions intelligentes */}
            <div className="flex flex-wrap gap-1">
              <Sparkles className="h-3 w-3 text-muted-foreground mt-1" />
              {suggestions.slice(0, 4).map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className={cn(
                    "cursor-pointer text-xs hover:bg-secondary",
                    titre === suggestion && "bg-secondary"
                  )}
                  onClick={() => setTitre(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails supplémentaires, état, année de rénovation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/200
            </p>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <div className="flex flex-wrap gap-1.5">
              {PHOTO_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.value}
                  variant={categorie === cat.value ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer text-xs transition-all',
                    categorie === cat.value && 'ring-2 ring-primary ring-offset-1'
                  )}
                  onClick={() => setCategorie(cat.value)}
                >
                  {cat.emoji} {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <Star className={cn('h-4 w-4', favori && 'fill-yellow-400 text-yellow-400')} />
                <Label htmlFor="favori" className="text-sm cursor-pointer">Favori</Label>
              </div>
              <Switch
                id="favori"
                checked={favori}
                onCheckedChange={setFavori}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn('h-4 w-4', defaut && 'text-destructive')} />
                <Label htmlFor="defaut" className="text-sm cursor-pointer">Défaut</Label>
              </div>
              <Switch
                id="defaut"
                checked={defaut}
                onCheckedChange={(checked) => {
                  setDefaut(checked);
                  if (checked && categorie !== 'defaut') {
                    setCategorie('defaut');
                  }
                }}
              />
            </div>
          </div>

          {/* Info date */}
          <p className="text-xs text-muted-foreground">
            Ajoutée le {new Date(photo.date || photo.uploadedAt || '').toLocaleDateString('fr-CH')}
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
