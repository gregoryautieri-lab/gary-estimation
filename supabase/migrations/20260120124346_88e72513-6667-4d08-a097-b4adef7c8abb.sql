-- Table des commissions pour le suivi des ventes
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone DEFAULT NULL,
  
  -- Informations du bien
  adresse text NOT NULL,
  commune text,
  
  -- Courtier principal
  courtier_principal text NOT NULL,
  courtier_principal_email text,
  
  -- Montants
  prix_vente numeric NOT NULL,
  commission_totale numeric NOT NULL,
  
  -- Dates
  date_signature date,
  date_paiement date,
  
  -- Origine du mandat
  origine text,
  origine_detail text,
  
  -- Lien optionnel vers estimation
  estimation_id uuid REFERENCES public.estimations(id) ON DELETE SET NULL,
  
  -- Notes
  notes text,
  
  -- Statut
  statut text NOT NULL DEFAULT 'Payée',
  
  -- Répartition par courtier (JSONB)
  repartition jsonb DEFAULT '{}'::jsonb
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_commissions_date_paiement ON public.commissions(date_paiement DESC);
CREATE INDEX idx_commissions_courtier ON public.commissions(courtier_principal);
CREATE INDEX idx_commissions_statut ON public.commissions(statut);
CREATE INDEX idx_commissions_deleted_at ON public.commissions(deleted_at);

-- Trigger pour updated_at
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Policies : Admin uniquement
CREATE POLICY "Admins can view commissions"
  ON public.commissions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create commissions"
  ON public.commissions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update commissions"
  ON public.commissions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete commissions"
  ON public.commissions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));