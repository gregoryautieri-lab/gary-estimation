-- Ajoute la colonne lead_id à la table estimations
-- Cette colonne est optionnelle (nullable) pour les estimations existantes
ALTER TABLE public.estimations 
ADD COLUMN lead_id UUID REFERENCES public.leads(id);

-- Index pour améliorer les performances des jointures
CREATE INDEX idx_estimations_lead_id ON public.estimations(lead_id);