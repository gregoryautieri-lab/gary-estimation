-- Table modifications (léger, beaucoup d'entrées)
CREATE TABLE public.estimation_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimation_id UUID REFERENCES public.estimations(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  user_name TEXT,
  module TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  action TEXT NOT NULL DEFAULT 'update'
);

-- Enable RLS
ALTER TABLE public.estimation_modifications ENABLE ROW LEVEL SECURITY;

-- Policies pour modifications
CREATE POLICY "Les courtiers peuvent voir les modifications de leurs estimations"
ON public.estimation_modifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.estimations e 
    WHERE e.id = estimation_id 
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'back_office'))
  )
);

CREATE POLICY "Les courtiers peuvent créer des modifications pour leurs estimations"
ON public.estimation_modifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.estimations e 
    WHERE e.id = estimation_id 
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Table versions (lourd, peu d'entrées)
CREATE TABLE public.estimation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimation_id UUID REFERENCES public.estimations(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  created_by_id UUID,
  label TEXT,
  snapshot JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE public.estimation_versions ENABLE ROW LEVEL SECURITY;

-- Policies pour versions
CREATE POLICY "Les courtiers peuvent voir les versions de leurs estimations"
ON public.estimation_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.estimations e 
    WHERE e.id = estimation_id 
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'back_office'))
  )
);

CREATE POLICY "Les courtiers peuvent créer des versions pour leurs estimations"
ON public.estimation_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.estimations e 
    WHERE e.id = estimation_id 
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Les admins peuvent supprimer des versions"
ON public.estimation_versions
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Indexes pour performance
CREATE INDEX idx_modifications_estimation ON public.estimation_modifications(estimation_id);
CREATE INDEX idx_modifications_timestamp ON public.estimation_modifications(timestamp DESC);
CREATE INDEX idx_versions_estimation ON public.estimation_versions(estimation_id);
CREATE INDEX idx_versions_number ON public.estimation_versions(estimation_id, version_number DESC);