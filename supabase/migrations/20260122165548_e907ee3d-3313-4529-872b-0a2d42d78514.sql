-- Rendre le bucket prospection public pour permettre l'affichage des screenshots Strava
UPDATE storage.buckets 
SET public = true 
WHERE id = 'prospection';