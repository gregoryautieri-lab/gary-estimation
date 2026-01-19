-- Ajout du champ surface_parcelle pour les maisons
ALTER TABLE public.comparables
ADD COLUMN surface_parcelle numeric NULL;

COMMENT ON COLUMN public.comparables.surface_parcelle IS 'Surface de la parcelle/terrain en m² (pour les maisons)';