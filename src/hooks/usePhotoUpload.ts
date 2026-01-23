import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Photo } from '@/types/estimation';
import { toast } from 'sonner';
import { compressImage, formatBytes } from '@/utils/imageCompression';

const BUCKET_NAME = 'estimation-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

// Options de compression selon le type
const COMPRESSION_OPTIONS = {
  standard: { maxWidth: 1920, maxHeight: 1920, quality: 0.85 },
  thumbnail: { maxWidth: 400, maxHeight: 400, quality: 0.7 },
  preview: { maxWidth: 800, maxHeight: 800, quality: 0.8 }
};

interface UsePhotoUploadReturn {
  uploading: boolean;
  progress: number;
  uploadPhoto: (file: File, estimationId: string, categorie?: Photo['categorie']) => Promise<Photo | null>;
  uploadPhotos: (files: File[], estimationId: string) => Promise<Photo[]>;
  deletePhoto: (photo: Photo, estimationId: string) => Promise<boolean>;
  getPublicUrl: (path: string) => string;
  deleteFolder: (estimationId: string) => Promise<boolean>;
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

    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux (max 10MB)');
      return null;
    }

    // Validation type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      toast.error('Format non supporté (JPG, PNG, WebP, HEIC uniquement)');
      return null;
    }

    setUploading(true);
    setProgress(10);

    try {
      // ÉTAPE 1: Compression de l'image
      const originalSize = file.size;
      const compressedFile = await compressImage(file, COMPRESSION_OPTIONS.standard);
      const compressionRatio = Math.round((1 - compressedFile.size / originalSize) * 100);
      
      setProgress(40);
      
      // Compression effectuée silencieusement

      // ÉTAPE 2: Générer un nom unique avec structure de dossiers
      const timestamp = Date.now();
      const extension = 'jpg'; // Toujours JPG après compression
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
      
      // Structure: user_id/estimation_id/categorie/fichier
      const folder = categorie || 'autre';
      const filePath = `${user.id}/${estimationId}/${folder}/${fileName}`;

      setProgress(50);

      // ÉTAPE 3: Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedFile, {
          cacheControl: '31536000', // 1 an de cache
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      setProgress(90);

      // ÉTAPE 4: Créer l'objet Photo
      const photo: Photo = {
        id: `photo-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        dataUrl: '', // On n'utilise plus dataUrl pour le stockage
        storageUrl: getPublicUrl(data.path),
        storagePath: data.path,
        nom: file.name,
        date: new Date().toISOString(),
        uploaded: true,
        uploading: false,
        categorie: categorie || 'autre',
        ordre: timestamp,
        tailleFichier: compressedFile.size,
        dimensionsOriginales: undefined // Sera ajouté si besoin
      };

      setProgress(100);
      
      return photo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur upload';
      console.error('Erreur upload photo:', err);
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

    // Si pas d'URL storage, juste supprimer localement
    if (!photo.storageUrl && !photo.storagePath) {
      return true;
    }

    try {
      // Utiliser storagePath si disponible, sinon extraire de l'URL
      let filePath = photo.storagePath;
      
      if (!filePath && photo.storageUrl) {
        const urlParts = photo.storageUrl.split(`${BUCKET_NAME}/`);
        if (urlParts.length < 2) {
          return true; // URL invalide, supprimer quand même localement
        }
        filePath = urlParts[1];
      }

      if (!filePath) return true;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur suppression';
      console.error('Erreur suppression photo:', err);
      toast.error(`Erreur: ${message}`);
      return false;
    }
  }, [user]);

  // Supprimer tout le dossier d'une estimation
  const deleteFolder = useCallback(async (
    estimationId: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const folderPath = `${user.id}/${estimationId}`;
      
      // Lister tous les fichiers du dossier
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, { limit: 1000 });

      if (listError) throw listError;

      if (!files || files.length === 0) return true;

      // Supprimer tous les fichiers
      const filePaths = files.map(f => `${folderPath}/${f.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      console.error('[PhotoUpload] Erreur suppression dossier:', err);
      return false;
    }
  }, [user]);

  return {
    uploading,
    progress,
    uploadPhoto,
    uploadPhotos,
    deletePhoto,
    deleteFolder,
    getPublicUrl
  };
}
