-- Migration: commune (text) → communes (text[])

-- 1. Ajouter la nouvelle colonne communes[]
ALTER TABLE public.projects_comparables 
ADD COLUMN communes text[] DEFAULT NULL;

-- 2. Migrer les données existantes (commune → communes[])
UPDATE public.projects_comparables 
SET communes = ARRAY[commune] 
WHERE commune IS NOT NULL;

-- 3. Supprimer l'ancienne colonne commune
ALTER TABLE public.projects_comparables 
DROP COLUMN commune;