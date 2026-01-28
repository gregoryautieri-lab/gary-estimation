-- =============================================
-- ÉTAPE 1 : Création des tables Inbox Leads
-- =============================================

-- Table "partners" (partenaires référents)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  societe TEXT NOT NULL,
  nom TEXT,
  type TEXT, -- banque, notaire, avocat, architecte, courtier_ext, regie, promoteur, autre
  contact_nom TEXT,
  contact_role TEXT,
  contact_email TEXT,
  contact_tel TEXT,
  retro_default_type TEXT, -- pourcentage, fixe, aucune
  retro_default_valeur NUMERIC,
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Table "leads" (leads entrants)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Source du lead
  source TEXT NOT NULL, -- boitage, reseaux_sociaux, telephone, recommandation, partenariat, site_web, salon, autre
  source_detail TEXT,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  retro_type TEXT, -- pourcentage, fixe, aucune
  retro_valeur NUMERIC,
  recommande_par TEXT,
  
  -- Contact
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  
  -- Demande
  type_demande TEXT NOT NULL, -- estimation, a_qualifier
  statut TEXT DEFAULT 'nouveau' NOT NULL, -- nouveau, en_cours, converti, perdu
  perdu_raison TEXT,
  
  -- Attribution
  assigned_to UUID, -- Référence implicite à auth.users
  created_by UUID, -- Référence implicite à auth.users
  rappel_date DATE,
  
  -- Conversion
  estimation_id UUID REFERENCES public.estimations(id) ON DELETE SET NULL,
  converti_at TIMESTAMPTZ,
  
  -- Bien concerné
  bien_adresse TEXT,
  bien_npa TEXT,
  bien_localite TEXT,
  bien_type TEXT, -- appartement, villa, immeuble, terrain, commercial, autre
  
  -- Notes
  notes TEXT
);

-- =============================================
-- TRIGGERS pour updated_at
-- =============================================

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY - Partners
-- =============================================

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- SELECT : tous les utilisateurs authentifiés peuvent voir
CREATE POLICY "Authenticated users can view partners"
  ON public.partners FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : admin uniquement
CREATE POLICY "Admins can insert partners"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- UPDATE : admin uniquement
CREATE POLICY "Admins can update partners"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- DELETE : admin uniquement
CREATE POLICY "Admins can delete partners"
  ON public.partners FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- ROW LEVEL SECURITY - Leads
-- =============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- SELECT : tous les utilisateurs authentifiés peuvent voir (vision globale équipe)
CREATE POLICY "Authenticated users can view all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : admin uniquement
CREATE POLICY "Admins can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- UPDATE : admin OU courtier assigné
CREATE POLICY "Admins and assigned courtiers can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR assigned_to = auth.uid()
  );

-- DELETE : admin uniquement
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- INDEX pour performance
-- =============================================

CREATE INDEX idx_leads_statut ON public.leads(statut);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_rappel_date ON public.leads(rappel_date);
CREATE INDEX idx_leads_partner_id ON public.leads(partner_id);
CREATE INDEX idx_partners_is_active ON public.partners(is_active);