-- =============================================
-- PROMPT 1 - PARTIE 2 : Tables, RLS, Triggers, Index
-- =============================================

-- 1. ENUM STATUTS
CREATE TYPE public.campagne_statut AS ENUM ('brouillon', 'planifiee', 'en_cours', 'terminee');
CREATE TYPE public.mission_statut AS ENUM ('prevue', 'en_cours', 'terminee', 'annulee');
CREATE TYPE public.type_bien_prospection AS ENUM ('PPE', 'Villa', 'Mixte');

-- 2. TABLE SUPPORTS_PROSPECTION
CREATE TABLE public.supports_prospection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  tarif_unitaire NUMERIC(10,2) NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supports_prospection ENABLE ROW LEVEL SECURITY;

-- RLS supports_prospection
CREATE POLICY "Authenticated users can view supports"
ON public.supports_prospection FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and responsables can insert supports"
ON public.supports_prospection FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Admins and responsables can update supports"
ON public.supports_prospection FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Admins and responsables can delete supports"
ON public.supports_prospection FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

-- 3. TABLE ETUDIANTS
CREATE TABLE public.etudiants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prenom TEXT NOT NULL,
  nom TEXT,
  tel TEXT,
  email TEXT,
  salaire_horaire NUMERIC(10,2) NOT NULL DEFAULT 18.00,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.etudiants ENABLE ROW LEVEL SECURITY;

-- RLS etudiants
CREATE POLICY "Admins and responsables can view all etudiants"
ON public.etudiants FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Etudiants can view own profile"
ON public.etudiants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins and responsables can insert etudiants"
ON public.etudiants FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Admins and responsables can update etudiants"
ON public.etudiants FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Admins and responsables can delete etudiants"
ON public.etudiants FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

-- 4. TABLE CAMPAGNES
CREATE TABLE public.campagnes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  courtier_id UUID NOT NULL,
  support_id UUID NOT NULL REFERENCES public.supports_prospection(id),
  commune TEXT NOT NULL,
  secteurs TEXT[],
  type_bien public.type_bien_prospection NOT NULL DEFAULT 'Mixte',
  nb_courriers INTEGER NOT NULL DEFAULT 0,
  nb_flyers INTEGER NOT NULL DEFAULT 0,
  cout_unitaire_courrier NUMERIC(10,2),
  cout_unitaire_flyer NUMERIC(10,2) NOT NULL DEFAULT 0.09,
  cout_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  uniqode_id TEXT,
  qr_destination_url TEXT,
  qr_image_url TEXT,
  scans_count INTEGER NOT NULL DEFAULT 0,
  date_debut DATE,
  date_fin DATE,
  statut public.campagne_statut NOT NULL DEFAULT 'brouillon',
  nb_prospects INTEGER NOT NULL DEFAULT 0,
  nb_estimations INTEGER NOT NULL DEFAULT 0,
  nb_mandats INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campagnes ENABLE ROW LEVEL SECURITY;

-- RLS campagnes
CREATE POLICY "Courtiers can view own campagnes"
ON public.campagnes FOR SELECT
USING (courtier_id = auth.uid());

CREATE POLICY "Admins and responsables can view all campagnes"
ON public.campagnes FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Courtiers can create own campagnes"
ON public.campagnes FOR INSERT
WITH CHECK (courtier_id = auth.uid());

CREATE POLICY "Admins and responsables can create any campagne"
ON public.campagnes FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Courtiers can update own campagnes"
ON public.campagnes FOR UPDATE
USING (courtier_id = auth.uid());

CREATE POLICY "Admins and responsables can update all campagnes"
ON public.campagnes FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Admins and responsables can delete campagnes"
ON public.campagnes FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

-- 5. TABLE MISSIONS
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id UUID NOT NULL REFERENCES public.campagnes(id) ON DELETE CASCADE,
  etudiant_id UUID REFERENCES public.etudiants(id) ON DELETE SET NULL,
  courtier_id UUID,
  date DATE NOT NULL,
  secteur_nom TEXT,
  zone_image_url TEXT,
  zone_geojson JSONB,
  courriers_prevu INTEGER NOT NULL DEFAULT 0,
  statut public.mission_statut NOT NULL DEFAULT 'prevue',
  courriers_distribues INTEGER,
  strava_screenshot_url TEXT,
  strava_temps TEXT,
  strava_distance_km NUMERIC(10,2),
  strava_vitesse_moy NUMERIC(10,2),
  strava_validated BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mission_assignee_check CHECK (etudiant_id IS NOT NULL OR courtier_id IS NOT NULL)
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- RLS missions
CREATE POLICY "Etudiants can view own missions"
ON public.missions FOR SELECT
USING (
  etudiant_id IN (SELECT id FROM public.etudiants WHERE user_id = auth.uid())
);

CREATE POLICY "Courtiers can view missions of own campagnes"
ON public.missions FOR SELECT
USING (
  campagne_id IN (SELECT id FROM public.campagnes WHERE courtier_id = auth.uid())
);

CREATE POLICY "Admins and responsables can view all missions"
ON public.missions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Courtiers can create missions for own campagnes"
ON public.missions FOR INSERT
WITH CHECK (
  campagne_id IN (SELECT id FROM public.campagnes WHERE courtier_id = auth.uid())
);

CREATE POLICY "Admins and responsables can create any mission"
ON public.missions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Etudiants can update own missions"
ON public.missions FOR UPDATE
USING (
  etudiant_id IN (SELECT id FROM public.etudiants WHERE user_id = auth.uid())
);

CREATE POLICY "Courtiers can update missions of own campagnes"
ON public.missions FOR UPDATE
USING (
  campagne_id IN (SELECT id FROM public.campagnes WHERE courtier_id = auth.uid())
);

CREATE POLICY "Admins and responsables can update all missions"
ON public.missions FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

CREATE POLICY "Courtiers can delete missions of own campagnes"
ON public.missions FOR DELETE
USING (
  campagne_id IN (SELECT id FROM public.campagnes WHERE courtier_id = auth.uid())
);

CREATE POLICY "Admins and responsables can delete any mission"
ON public.missions FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'responsable_prospection'::app_role)
);

-- 6. MODIFICATION TABLE ESTIMATIONS
ALTER TABLE public.estimations 
ADD COLUMN IF NOT EXISTS campagne_origin_code TEXT;

-- 7. TRIGGER CODE CAMPAGNE AUTO (CYYMM-NNN)
CREATE OR REPLACE FUNCTION public.generate_campagne_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  year_month := to_char(CURRENT_DATE, 'YYMM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM 7 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.campagnes
  WHERE code LIKE 'C' || year_month || '-%';
  
  new_code := 'C' || year_month || '-' || LPAD(seq_num::TEXT, 3, '0');
  
  NEW.code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_campagne_code
BEFORE INSERT ON public.campagnes
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_campagne_code();

-- 8. TRIGGER COUT_TOTAL CAMPAGNE
CREATE OR REPLACE FUNCTION public.calculate_campagne_cout_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.cout_total := 
    (COALESCE(NEW.nb_courriers, 0) * COALESCE(NEW.cout_unitaire_courrier, 0)) +
    (COALESCE(NEW.nb_flyers, 0) * COALESCE(NEW.cout_unitaire_flyer, 0.09));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_cout_total
BEFORE INSERT OR UPDATE OF nb_courriers, nb_flyers, cout_unitaire_courrier, cout_unitaire_flyer
ON public.campagnes
FOR EACH ROW
EXECUTE FUNCTION public.calculate_campagne_cout_total();

-- 9. TRIGGERS UPDATED_AT
CREATE TRIGGER update_supports_prospection_updated_at
BEFORE UPDATE ON public.supports_prospection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_etudiants_updated_at
BEFORE UPDATE ON public.etudiants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campagnes_updated_at
BEFORE UPDATE ON public.campagnes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. INDEX PERFORMANCE
CREATE INDEX idx_campagnes_courtier_id ON public.campagnes(courtier_id);
CREATE INDEX idx_campagnes_statut ON public.campagnes(statut);
CREATE INDEX idx_campagnes_date_debut ON public.campagnes(date_debut);
CREATE INDEX idx_missions_campagne_id ON public.missions(campagne_id);
CREATE INDEX idx_missions_etudiant_id ON public.missions(etudiant_id);
CREATE INDEX idx_missions_date ON public.missions(date);
CREATE INDEX idx_missions_statut ON public.missions(statut);
CREATE INDEX idx_etudiants_user_id ON public.etudiants(user_id);

-- 11. DONNÉES INITIALES SUPPORTS
INSERT INTO public.supports_prospection (nom, tarif_unitaire, description, ordre) VALUES
  ('Boîtage', 0.20, 'Distribution en boîtes aux lettres', 1),
  ('Poste', 1.20, 'Envoi par courrier postal', 2),
  ('Flyer', 0.09, 'Distribution de flyers', 3),
  ('Edigroup', 1.07, 'Distribution via Edigroup', 4);

-- 12. BUCKET STORAGE PROSPECTION
INSERT INTO storage.buckets (id, name, public)
VALUES ('prospection', 'prospection', false)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket prospection
CREATE POLICY "Authenticated users can upload to prospection"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prospection' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view prospection files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prospection' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admins and responsables can delete prospection files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prospection' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'responsable_prospection'::app_role))
);