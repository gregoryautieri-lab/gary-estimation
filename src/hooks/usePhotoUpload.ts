import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Photo } from '@/types/estimation';
import { toast } from 'sonner';

const BUCKET_NAME = 'estimation-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

interface UsePhotoUploadReturn {
  uploading: boolean;
  progress: number;
  uploadPhoto: (file: File, estimationId: string, categorie?: Photo['categorie']) => Promise<Photo | null>;
  uploadPhotos: (files: File[], estimationId: string) => Promise<Photo[]>;
  deletePhoto: (photo: Photo, estimationId: string) => Promise<boolean>;
  getPublicUrl: (path: string) => string;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getPublicUrl = useCallback((path: string): string => {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const uploadPhoto = useCallback(async (
    file: File,
    estimationId: string,
    categorie?: Photo['categorie']
  ): Promise<Photo | null> => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      return null;
    }

    // Validation
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux (max 10MB)');
      return null;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté (JPG, PNG, WebP uniquement)');
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Générer un nom unique
      const timestamp = Date.now();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
      const filePath = `${user.id}/${estimationId}/${fileName}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setProgress(100);

      // Créer l'objet Photo
      const photo: Photo = {
        id: `photo-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        dataUrl: '', // On n'utilise plus dataUrl pour le stockage
        storageUrl: getPublicUrl(data.path),
        nom: file.name,
        date: new Date().toISOString(),
        uploaded: true,
        uploading: false,
        categorie: categorie || 'autre',
        ordre: timestamp
      };

      toast.success('Photo uploadée');
      return photo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur upload';
      toast.error(`Erreur: ${message}`);
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [user, getPublicUrl]);

  const uploadPhotos = useCallback(async (
    files: File[],
    estimationId: string
  ): Promise<Photo[]> => {
    const results: Photo[] = [];
    
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      const photo = await uploadPhoto(files[i], estimationId);
      if (photo) results.push(photo);
    }

    if (results.length > 0) {
      toast.success(`${results.length} photo(s) uploadée(s)`);
    }

    return results;
  }, [uploadPhoto]);

  const deletePhoto = useCallback(async (
    photo: Photo,
    estimationId: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      return false;
    }

    if (!photo.storageUrl) {
      // Photo non uploadée, juste supprimer localement
      return true;
    }

    try {
      // Extraire le path depuis l'URL
      const urlParts = photo.storageUrl.split(`${BUCKET_NAME}/`);
      if (urlParts.length < 2) {
        return true; // URL invalide, supprimer quand même localement
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;

      toast.success('Photo supprimée');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur suppression';
      toast.error(`Erreur: ${message}`);
      return false;
    }
  }, [user]);

  return {
    uploading,
    progress,
    uploadPhoto,
    uploadPhotos,
    deletePhoto,
    getPublicUrl
  };
}
