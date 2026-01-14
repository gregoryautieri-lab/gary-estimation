-- Créer les enums pour les estimations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estimation_status') THEN
    CREATE TYPE public.estimation_status AS ENUM ('brouillon', 'en_cours', 'termine', 'archive');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_bien') THEN
    CREATE TYPE public.type_bien AS ENUM ('appartement', 'maison', 'terrain', 'immeuble', 'commercial');
  END IF;
END $$;

-- Créer la table estimations avec approche hybride
CREATE TABLE public.estimations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courtier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  statut public.estimation_status NOT NULL DEFAULT 'brouillon',
  type_bien public.type_bien,
  adresse TEXT,
  code_postal TEXT,
  localite TEXT,
  prix_final NUMERIC,
  prix_min NUMERIC,
  prix_max NUMERIC,
  
  vendeur_nom TEXT,
  vendeur_email TEXT,
  vendeur_telephone TEXT,
  
  identification JSONB DEFAULT '{}'::jsonb,
  caracteristiques JSONB DEFAULT '{}'::jsonb,
  analyse_terrain JSONB DEFAULT '{}'::jsonb,
  pre_estimation JSONB DEFAULT '{}'::jsonb,
  strategie JSONB DEFAULT '{}'::jsonb,
  historique JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '{}'::jsonb,
  comparables JSONB DEFAULT '{"vendus": [], "enVente": []}'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  
  etapes_completees TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes_libres TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimations_courtier ON public.estimations(courtier_id);
CREATE INDEX idx_estimations_statut ON public.estimations(statut);
CREATE INDEX idx_estimations_localite ON public.estimations(localite);
CREATE INDEX idx_estimations_type_bien ON public.estimations(type_bien);
CREATE INDEX idx_estimations_created ON public.estimations(created_at DESC);
CREATE INDEX idx_estimations_prix ON public.estimations(prix_final);
CREATE INDEX idx_estimations_identification ON public.estimations USING GIN(identification);
CREATE INDEX idx_estimations_caracteristiques ON public.estimations USING GIN(caracteristiques);

ALTER TABLE public.estimations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les courtiers peuvent voir leurs estimations"
ON public.estimations FOR SELECT
USING (
  auth.uid() = courtier_id 
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'back_office'::app_role)
);

CREATE POLICY "Les courtiers peuvent creer leurs estimations"
ON public.estimations FOR INSERT
WITH CHECK (auth.uid() = courtier_id);

CREATE POLICY "Les courtiers peuvent modifier leurs estimations"
ON public.estimations FOR UPDATE
USING (
  auth.uid() = courtier_id 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Les courtiers peuvent supprimer leurs estimations"
ON public.estimations FOR DELETE
USING (
  auth.uid() = courtier_id 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER update_estimations_updated_at
  BEFORE UPDATE ON public.estimations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();