-- =============================================
-- PROMPT 5: Table comparables + modification links
-- =============================================

-- 1. Créer la table comparables pour les données externes
CREATE TABLE public.comparables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Localisation
  adresse text,
  code_postal text,
  localite text,
  latitude numeric,
  longitude numeric,
  
  -- Caractéristiques
  type_bien public.type_bien,
  prix numeric,
  surface numeric,
  pieces numeric,
  
  -- Statut marché
  statut_marche text NOT NULL DEFAULT 'en_vente', -- 'vendu' | 'en_vente'
  strategie_diffusion text, -- 'off_market' | 'public' | 'coming_soon'
  date_vente timestamp with time zone,
  
  -- Source et tracking
  source text DEFAULT 'manual', -- 'manual' | 'immoscout' | 'homegate' | etc.
  url_source text,
  notes text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Trigger pour updated_at
CREATE TRIGGER update_comparables_updated_at
  BEFORE UPDATE ON public.comparables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Enable RLS
ALTER TABLE public.comparables ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies pour comparables
CREATE POLICY "Users can view own comparables"
  ON public.comparables
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own comparables"
  ON public.comparables
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comparables"
  ON public.comparables
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparables"
  ON public.comparables
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Index pour performance
CREATE INDEX idx_comparables_user_id ON public.comparables(user_id);
CREATE INDEX idx_comparables_localite ON public.comparables(localite);

-- =============================================
-- Modification de project_comparables_links
-- =============================================

-- 6. Ajouter colonne comparable_id
ALTER TABLE public.project_comparables_links
  ADD COLUMN comparable_id uuid REFERENCES public.comparables(id) ON DELETE CASCADE;

-- 7. Rendre estimation_id nullable
ALTER TABLE public.project_comparables_links
  ALTER COLUMN estimation_id DROP NOT NULL;

-- 8. Ajouter contrainte CHECK (l'un ou l'autre doit être défini)
ALTER TABLE public.project_comparables_links
  ADD CONSTRAINT check_link_type 
  CHECK ((estimation_id IS NOT NULL) OR (comparable_id IS NOT NULL));

-- 9. Index sur comparable_id
CREATE INDEX idx_project_links_comparable_id ON public.project_comparables_links(comparable_id);

-- 10. Mettre à jour le trigger de comptage pour gérer les deux types
CREATE OR REPLACE FUNCTION public.update_project_nb_comparables()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_project_id uuid;
BEGIN
  -- Gérer INSERT, DELETE et UPDATE (changement de project_id)
  IF TG_OP = 'DELETE' THEN
    target_project_id := OLD.project_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.project_id IS DISTINCT FROM NEW.project_id THEN
    -- Mise à jour de l'ancien projet
    UPDATE projects_comparables
    SET 
      nb_comparables = (
        SELECT COUNT(*) FROM project_comparables_links
        WHERE project_id = OLD.project_id
      ),
      updated_at = now()
    WHERE id = OLD.project_id;
    target_project_id := NEW.project_id;
  ELSE
    target_project_id := COALESCE(NEW.project_id, OLD.project_id);
  END IF;

  -- Mise à jour du projet cible
  UPDATE projects_comparables
  SET 
    nb_comparables = (
      SELECT COUNT(*) FROM project_comparables_links
      WHERE project_id = target_project_id
    ),
    updated_at = now()
  WHERE id = target_project_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;