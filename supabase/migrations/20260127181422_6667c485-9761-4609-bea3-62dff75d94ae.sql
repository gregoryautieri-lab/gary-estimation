-- Table pour les types de messages de prospection (dynamiques)
CREATE TABLE public.types_messages_prospection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe text NOT NULL,
  valeur text NOT NULL UNIQUE,
  label text NOT NULL,
  ordre integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index pour le tri
CREATE INDEX idx_types_messages_ordre ON public.types_messages_prospection(groupe, ordre);

-- Trigger pour updated_at
CREATE TRIGGER update_types_messages_updated_at
  BEFORE UPDATE ON public.types_messages_prospection
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.types_messages_prospection ENABLE ROW LEVEL SECURITY;

-- Policies : tous les utilisateurs authentifiés peuvent lire, seuls les admins peuvent modifier
CREATE POLICY "Authenticated users can view types_messages"
  ON public.types_messages_prospection
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert types_messages"
  ON public.types_messages_prospection
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update types_messages"
  ON public.types_messages_prospection
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete types_messages"
  ON public.types_messages_prospection
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insertion des données initiales depuis les constantes
INSERT INTO public.types_messages_prospection (groupe, valeur, label, ordre) VALUES
  ('Ventes', 'nous_avons_vendu', 'Nous avons vendu', 1),
  ('Ventes', 'bientot_en_vente', 'Nous avons bientôt en vente', 2),
  ('Ventes', 'nous_avons_en_vente', 'Nous avons en vente', 3),
  ('Recherche', 'nous_avons_clients', 'Nous avons des clients', 4),
  ('Recherche', 'nous_recherchons', 'Nous recherchons', 5),
  ('Recherche', 'mandat_recherche', 'Mandat de recherche', 6),
  ('Propositions', 'proposition_estimation', 'Proposition d''estimation', 7),
  ('Propositions', 'proposition_switch', 'Proposition de Switch', 8),
  ('Spécial', 'succession_hoirie', 'Succession / Hoirie', 9),
  ('Spécial', 'divorce', 'Divorce', 10),
  ('Spécial', 'retraite', 'Retraite', 11),
  ('Spécial', 'zone_developpement', 'Zone de développement', 12),
  ('Spécial', 'sortie_controle_etatique', 'Sortie du contrôle étatique', 13),
  ('Autres', 'info_proprietaires', 'Information pour propriétaires', 14),
  ('Autres', 'flyer', 'Flyer', 15);