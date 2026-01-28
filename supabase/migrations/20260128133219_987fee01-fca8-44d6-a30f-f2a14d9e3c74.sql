-- Ajouter la colonne campagne_id à la table leads
ALTER TABLE public.leads
ADD COLUMN campagne_id uuid REFERENCES public.campagnes(id) ON DELETE SET NULL;

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_leads_campagne_id ON public.leads(campagne_id);