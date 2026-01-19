-- Ajouter colonne images à la table comparables
ALTER TABLE public.comparables 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT NULL;