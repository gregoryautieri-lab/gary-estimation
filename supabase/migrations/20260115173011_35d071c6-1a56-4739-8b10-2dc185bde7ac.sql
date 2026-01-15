-- Ajouter les nouveaux statuts au type enum
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'a_presenter';
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'presentee';
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'reflexion';
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'negociation';
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'accord_oral';
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'en_signature';
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'mandat_signe';
ALTER TYPE public.estimation_status ADD VALUE IF NOT EXISTS 'perdu';

-- Table historique des statuts
CREATE TABLE public.estimation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimation_id UUID REFERENCES public.estimations(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  previous_status TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  user_name TEXT,
  comment TEXT,
  duration_in_previous_status INTEGER -- En jours
);

-- Enable RLS
ALTER TABLE public.estimation_status_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Les courtiers peuvent voir l'historique de leurs estimations"
ON public.estimation_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.estimations e 
    WHERE e.id = estimation_id 
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'back_office'))
  )
);

CREATE POLICY "Les courtiers peuvent ajouter à l'historique de leurs estimations"
ON public.estimation_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.estimations e 
    WHERE e.id = estimation_id 
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Index pour performance
CREATE INDEX idx_status_history_estimation ON public.estimation_status_history(estimation_id);
CREATE INDEX idx_status_history_timestamp ON public.estimation_status_history(timestamp DESC);