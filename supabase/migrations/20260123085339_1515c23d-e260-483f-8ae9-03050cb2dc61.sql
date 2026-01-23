-- 1. Créer l'enum pour le statut de paie
CREATE TYPE public.paie_statut AS ENUM ('brouillon', 'validee', 'payee');

-- 2. Créer la table paies
CREATE TABLE public.paies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id uuid NOT NULL REFERENCES public.etudiants(id) ON DELETE CASCADE,
  periode text NOT NULL, -- Format "YYYY-MM"
  date_debut date NOT NULL, -- 23 du mois précédent
  date_fin date NOT NULL, -- 22 du mois actuel
  total_missions integer NOT NULL DEFAULT 0,
  total_heures numeric(5,2) NOT NULL DEFAULT 0,
  salaire_horaire numeric(5,2) NOT NULL,
  montant_total numeric(8,2) NOT NULL DEFAULT 0,
  statut paie_statut NOT NULL DEFAULT 'brouillon',
  missions_ids uuid[] NOT NULL DEFAULT '{}',
  notes text,
  date_validation timestamptz,
  date_paiement timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Contrainte unique: une seule paie par étudiant par période
  CONSTRAINT unique_etudiant_periode UNIQUE (etudiant_id, periode)
);

-- 3. Créer les index pour les requêtes fréquentes
CREATE INDEX idx_paies_etudiant ON public.paies(etudiant_id);
CREATE INDEX idx_paies_periode ON public.paies(periode);
CREATE INDEX idx_paies_statut ON public.paies(statut);

-- 4. Activer RLS
ALTER TABLE public.paies ENABLE ROW LEVEL SECURITY;

-- 5. Policies RLS

-- Admins : accès complet
CREATE POLICY "Admins can view all paies"
ON public.paies FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create paies"
ON public.paies FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update paies"
ON public.paies FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete paies"
ON public.paies FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Responsables prospection : lecture seule
CREATE POLICY "Responsables can view all paies"
ON public.paies FOR SELECT
USING (has_role(auth.uid(), 'responsable_prospection'::app_role));

-- Étudiants : voir leurs propres paies uniquement
CREATE POLICY "Etudiants can view own paies"
ON public.paies FOR SELECT
USING (
  etudiant_id IN (
    SELECT id FROM public.etudiants WHERE user_id = auth.uid()
  )
);

-- 6. Trigger pour updated_at automatique
CREATE TRIGGER update_paies_updated_at
BEFORE UPDATE ON public.paies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Commentaires de documentation
COMMENT ON TABLE public.paies IS 'Gestion des salaires mensuels des étudiants';
COMMENT ON COLUMN public.paies.periode IS 'Format YYYY-MM (ex: 2026-01)';
COMMENT ON COLUMN public.paies.date_debut IS '23 du mois précédent';
COMMENT ON COLUMN public.paies.date_fin IS '22 du mois actuel';
COMMENT ON COLUMN public.paies.missions_ids IS 'Array figé des IDs missions incluses (historique)';