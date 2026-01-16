import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, Loader2, Image, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection } from '@/components/gary/FormSection';
import { ModuleProgressBar } from '@/components/gary/ModuleProgressBar';
import { PhotoCapture } from '@/components/photos/PhotoCapture';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useAuth } from '@/hooks/useAuth';
import type { EstimationData, Photo, Photos, PhotoCategorie } from '@/types/estimation';
import { defaultPhotos } from '@/types/estimation';

export default function ModulePhotos() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchEstimation, updateEstimation } = useEstimationPersistence();
  const { uploading, progress, uploadPhoto, deletePhoto } = usePhotoUpload();

  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [photos, setPhotos] = useState<Photos>(defaultPhotos);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Progress tracking - MUST be before any conditional returns
  const { moduleStatuses } = useModuleProgress(
    estimation,
    id || '',
    3
  );

  // Charger l'estimation
  useEffect(() => {
    if (!id) return;
    loadEstimation();
  }, [id]);

  const loadEstimation = async () => {
    if (!id) return;
    setLoading(true);
    const data = await fetchEstimation(id);
    if (data) {
      setEstimation(data);
      setPhotos(data.photos || defaultPhotos);
    }
    setLoading(false);
  };

  // Ajouter des photos
  const handleCapture = useCallback(async (files: File[]) => {
    if (!id) return;

    for (const file of files) {
      // Créer une preview locale immédiate
      const reader = new FileReader();
      reader.onload = async (e) => {
        const tempPhoto: Photo = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          dataUrl: e.target?.result as string,
          nom: file.name,
          date: new Date().toISOString(),
          uploaded: false,
          uploading: true,
          categorie: 'autre',
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.email || 'unknown'
        };

        // Ajouter la photo temporaire
        setPhotos(prev => ({
          ...prev,
          items: [...prev.items, tempPhoto]
        }));

        // Upload vers Supabase
        const uploadedPhoto = await uploadPhoto(file, id);
        
        if (uploadedPhoto) {
          // Remplacer la photo temp par la vraie avec les métadonnées
          setPhotos(prev => ({
            ...prev,
            items: prev.items.map(p => 
              p.id === tempPhoto.id 
                ? { 
                    ...uploadedPhoto, 
                    uploadedAt: tempPhoto.uploadedAt,
                    uploadedBy: tempPhoto.uploadedBy
                  } 
                : p
            )
          }));
        } else {
          // Supprimer la photo temp en cas d'erreur
          setPhotos(prev => ({
            ...prev,
            items: prev.items.filter(p => p.id !== tempPhoto.id)
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  }, [id, uploadPhoto, user]);

  // Supprimer une photo
  const handleDelete = useCallback(async (photo: Photo) => {
    if (!id) return;
    
    const success = await deletePhoto(photo, id);
    if (success) {
      setPhotos(prev => ({
        ...prev,
        items: prev.items.filter(p => p.id !== photo.id)
      }));
    }
  }, [id, deletePhoto]);

  // Mettre à jour une photo (annotations)
  const handleUpdate = useCallback((updatedPhoto: Photo) => {
    setPhotos(prev => ({
      ...prev,
      items: prev.items.map(p =>
        p.id === updatedPhoto.id ? updatedPhoto : p
      )
    }));
    scheduleSave();
  }, []);

  // Toggle favori
  const handleToggleFavori = useCallback((photo: Photo) => {
    setPhotos(prev => ({
      ...prev,
      items: prev.items.map(p =>
        p.id === photo.id ? { ...p, favori: !p.favori } : p
      )
    }));
    scheduleSave();
  }, []);

  // Changer catégorie
  const handleCategorieChange = useCallback((photo: Photo, categorie: PhotoCategorie) => {
    setPhotos(prev => ({
      ...prev,
      items: prev.items.map(p =>
        p.id === photo.id ? { ...p, categorie } : p
      )
    }));
    scheduleSave();
  }, []);

  // Sauvegarder
  const handleSave = useCallback(async () => {
    if (!id || !estimation) return;
    setSaving(true);
    await updateEstimation(id, { photos }, true);
    setSaving(false);
  }, [id, estimation, photos, updateEstimation]);

  // Autosave pour éviter perte de données (délai plus long pour les photos)
  const { scheduleSave, isSaving: autoSaving } = useAutoSave({
    delay: 3000,
    onSave: async () => {
      if (!id || !estimation) return;
      await updateEstimation(id, { photos });
    },
    enabled: !!id && !!estimation && !loading
  });

  // Navigation
  const handleNext = async () => {
    await handleSave();
    navigate(`/estimation/${id}/4`);
  };

  const handlePrevious = async () => {
    await handleSave();
    navigate(`/estimation/${id}/3`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
      <ModuleHeader 
        moduleNumber={4}
        title="Photos" 
        onBack={() => navigate('/estimations')}
      />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const photoCount = photos.items.length;
  const uploadedCount = photos.items.filter(p => p.uploaded).length;
  const pendingCount = photos.items.filter(p => p.uploading).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <ModuleHeader 
        moduleNumber={4}
        title="Photos" 
        onBack={() => navigate('/estimations')}
        isSaving={autoSaving}
      />

      {/* Barre de progression */}
      {id && (
        <ModuleProgressBar
          modules={moduleStatuses}
          currentModule="📸"
          estimationId={id}
        />
      )}

      <div className="p-4 space-y-6">
        {/* Résumé */}
        {estimation && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium">{estimation.adresse || 'Adresse non renseignée'}</p>
            <p className="text-sm text-muted-foreground">
              {estimation.identification?.vendeur?.nom || 'Vendeur'}
            </p>
          </div>
        )}

        {/* Stats photos & Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{pendingCount} en cours</span>
              </div>
            )}
            {photos.items.filter(p => p.favori).length > 0 && (
              <span className="text-xs text-muted-foreground">
                ⭐ {photos.items.filter(p => p.favori).length} favori(s)
              </span>
            )}
          </div>
          
          {/* Toggle vue groupée */}
          <div className="flex items-center gap-2">
            <Label htmlFor="groupBy" className="text-xs text-muted-foreground">
              Grouper
            </Label>
            <Switch
              id="groupBy"
              checked={groupByCategory}
              onCheckedChange={setGroupByCategory}
            />
          </div>
        </div>

        {/* Progress upload */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Upload en cours... {progress}%
            </p>
          </div>
        )}

        {/* Capture */}
        <FormSection 
          title="Ajouter des photos" 
          icon={<Camera className="h-4 w-4" />}
        >
          <PhotoCapture 
            onCapture={handleCapture}
            disabled={saving}
            uploading={uploading}
          />
        </FormSection>

        {/* Grille photos */}
        <FormSection 
          title="Photos du bien" 
          icon={<Image className="h-4 w-4" />}
        >
          <p className="text-xs text-muted-foreground mb-3">Cliquez sur une photo pour l'annoter</p>
          <PhotoGrid
            photos={photos.items}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onToggleFavori={handleToggleFavori}
            onCategorieChange={handleCategorieChange}
            groupByCategory={groupByCategory}
          />
        </FormSection>

        {/* Conseils */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Conseils photos
          </p>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-xs">
            <li>• Photographiez toutes les pièces principales</li>
            <li>• Prenez des photos de la vue depuis les fenêtres</li>
            <li>• N'oubliez pas l'extérieur et le parking</li>
            <li>• Marquez vos meilleures photos en favori ⭐</li>
          </ul>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={saving}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
