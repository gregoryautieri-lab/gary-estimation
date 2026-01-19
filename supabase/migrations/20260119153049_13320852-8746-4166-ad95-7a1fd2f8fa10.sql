-- Enum pour le filtre de statut
CREATE TYPE public.project_statut_filter AS ENUM ('vendus', 'en_vente', 'tous');

-- Table principale des projets de comparables
CREATE TABLE public.projects_comparables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  courtier_name text,
  project_name text NOT NULL,
  archived boolean DEFAULT false,

  -- Critères de recherche
  commune text,
  prix_min integer,
  prix_max integer,
  type_bien text[], -- Flexibilité multi-types
  surface_min integer,
  surface_max integer,
  pieces_min numeric,
  pieces_max numeric,
  statut_filter public.project_statut_filter DEFAULT 'tous',

  -- Statistiques calculées
  nb_comparables integer DEFAULT 0,
  last_search_date timestamp with time zone
);

-- Index pour performances
CREATE INDEX idx_projects_comparables_user_id ON public.projects_comparables(user_id);
CREATE INDEX idx_projects_comparables_commune ON public.projects_comparables(commune);
CREATE INDEX idx_projects_comparables_archived ON public.projects_comparables(archived);

-- Enable RLS
ALTER TABLE public.projects_comparables ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects"
ON public.projects_comparables FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
ON public.projects_comparables FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON public.projects_comparables FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON public.projects_comparables FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_projects_comparables_updated_at
BEFORE UPDATE ON public.projects_comparables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table de liaison projets <-> estimations
CREATE TABLE public.project_comparables_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  project_id uuid NOT NULL REFERENCES public.projects_comparables(id) ON DELETE CASCADE,
  estimation_id uuid NOT NULL REFERENCES public.estimations(id) ON DELETE CASCADE,
  selected_by_user boolean DEFAULT false,
  notes text,
  UNIQUE(project_id, estimation_id)
);

-- Index pour performances
CREATE INDEX idx_links_project_id ON public.project_comparables_links(project_id);
CREATE INDEX idx_links_estimation_id ON public.project_comparables_links(estimation_id);

-- Enable RLS
ALTER TABLE public.project_comparables_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies via projet parent
CREATE POLICY "Users can view own project links"
ON public.project_comparables_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects_comparables
    WHERE id = project_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create links for own projects"
ON public.project_comparables_links FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects_comparables
    WHERE id = project_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update links for own projects"
ON public.project_comparables_links FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects_comparables
    WHERE id = project_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete links for own projects"
ON public.project_comparables_links FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects_comparables
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Fonction pour mettre à jour nb_comparables (avec SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.update_project_nb_comparables()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    target_project_id := NEW.project_id;
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
$$;

-- Trigger sur INSERT/UPDATE/DELETE
CREATE TRIGGER trigger_update_nb_comparables
AFTER INSERT OR UPDATE OR DELETE ON public.project_comparables_links
FOR EACH ROW
EXECUTE FUNCTION public.update_project_nb_comparables();