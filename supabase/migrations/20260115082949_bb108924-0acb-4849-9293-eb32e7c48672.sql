-- Créer le bucket pour les photos d'estimation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estimation-photos', 
  'estimation-photos', 
  true,
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Politique: Les utilisateurs authentifiés peuvent voir toutes les photos
CREATE POLICY "Photos publiques en lecture"
ON storage.objects FOR SELECT
USING (bucket_id = 'estimation-photos');

-- Politique: Les courtiers peuvent uploader des photos dans leur dossier
CREATE POLICY "Courtiers peuvent uploader leurs photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'estimation-photos' 
  AND auth.uid() IS NOT NULL
);

-- Politique: Les courtiers peuvent modifier leurs propres photos
CREATE POLICY "Courtiers peuvent modifier leurs photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'estimation-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique: Les courtiers peuvent supprimer leurs propres photos
CREATE POLICY "Courtiers peuvent supprimer leurs photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'estimation-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);