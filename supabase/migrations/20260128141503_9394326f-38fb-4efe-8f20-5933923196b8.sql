-- Ajouter le champ rdv_date pour stocker la date/heure du RDV
ALTER TABLE public.leads ADD COLUMN rdv_date TIMESTAMPTZ;