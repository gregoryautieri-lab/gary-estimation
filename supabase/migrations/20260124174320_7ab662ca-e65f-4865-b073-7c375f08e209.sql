-- =====================================================
-- MIGRATION: Nettoyage des policies RLS
-- Suppression des références à back_office et responsable_prospection
-- =====================================================

-- 1. TABLE: estimations
-- Supprimer l'ancienne policy SELECT et la recréer sans back_office
DROP POLICY IF EXISTS "Courtiers voient leurs estimations et les publiques" ON public.estimations;
CREATE POLICY "Courtiers voient leurs estimations et les publiques"
ON public.estimations FOR SELECT
USING (
  (auth.uid() = courtier_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (statut = ANY (ARRAY['mandat_signe'::estimation_status, 'presentee'::estimation_status]))
);

-- 2. TABLE: estimation_modifications
-- Supprimer l'ancienne policy SELECT et la recréer sans back_office
DROP POLICY IF EXISTS "Les courtiers peuvent voir les modifications de leurs estimatio" ON public.estimation_modifications;
CREATE POLICY "Les courtiers peuvent voir les modifications de leurs estimations"
ON public.estimation_modifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estimations e
    WHERE e.id = estimation_modifications.estimation_id
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- 3. TABLE: estimation_status_history
-- Supprimer l'ancienne policy SELECT et la recréer sans back_office
DROP POLICY IF EXISTS "Les courtiers peuvent voir l'historique de leurs estimations" ON public.estimation_status_history;
CREATE POLICY "Les courtiers peuvent voir l'historique de leurs estimations"
ON public.estimation_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estimations e
    WHERE e.id = estimation_status_history.estimation_id
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- 4. TABLE: estimation_versions
-- Supprimer l'ancienne policy SELECT et la recréer sans back_office
DROP POLICY IF EXISTS "Les courtiers peuvent voir les versions de leurs estimations" ON public.estimation_versions;
CREATE POLICY "Les courtiers peuvent voir les versions de leurs estimations"
ON public.estimation_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estimations e
    WHERE e.id = estimation_versions.estimation_id
    AND (e.courtier_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- 5. TABLE: campagnes
-- Supprimer les anciennes policies admin+responsable et les recréer avec admin seul
DROP POLICY IF EXISTS "Admins and responsables can view all campagnes" ON public.campagnes;
DROP POLICY IF EXISTS "Admins and responsables can create any campagne" ON public.campagnes;
DROP POLICY IF EXISTS "Admins and responsables can update all campagnes" ON public.campagnes;
DROP POLICY IF EXISTS "Admins and responsables can delete campagnes" ON public.campagnes;

CREATE POLICY "Admins can view all campagnes"
ON public.campagnes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create any campagne"
ON public.campagnes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all campagnes"
ON public.campagnes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campagnes"
ON public.campagnes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. TABLE: etudiants
-- Supprimer les anciennes policies et les recréer avec admin seul
DROP POLICY IF EXISTS "Admins and responsables can view all etudiants" ON public.etudiants;
DROP POLICY IF EXISTS "Admins and responsables can insert etudiants" ON public.etudiants;
DROP POLICY IF EXISTS "Admins and responsables can update etudiants" ON public.etudiants;
DROP POLICY IF EXISTS "Admins and responsables can delete etudiants" ON public.etudiants;

CREATE POLICY "Admins can view all etudiants"
ON public.etudiants FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert etudiants"
ON public.etudiants FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update etudiants"
ON public.etudiants FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete etudiants"
ON public.etudiants FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. TABLE: missions
-- Supprimer les anciennes policies admin+responsable et les recréer avec admin seul
DROP POLICY IF EXISTS "Admins and responsables can view all missions" ON public.missions;
DROP POLICY IF EXISTS "Admins and responsables can create any mission" ON public.missions;
DROP POLICY IF EXISTS "Admins and responsables can update all missions" ON public.missions;
DROP POLICY IF EXISTS "Admins and responsables can delete any mission" ON public.missions;

CREATE POLICY "Admins can view all missions"
ON public.missions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create any mission"
ON public.missions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all missions"
ON public.missions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any mission"
ON public.missions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. TABLE: paies
-- Supprimer la policy responsable_prospection (admin a déjà accès)
DROP POLICY IF EXISTS "Responsables can view all paies" ON public.paies;

-- 9. TABLE: supports_prospection
-- Supprimer les anciennes policies et les recréer avec admin seul
DROP POLICY IF EXISTS "Admins and responsables can insert supports" ON public.supports_prospection;
DROP POLICY IF EXISTS "Admins and responsables can update supports" ON public.supports_prospection;
DROP POLICY IF EXISTS "Admins and responsables can delete supports" ON public.supports_prospection;

CREATE POLICY "Admins can insert supports"
ON public.supports_prospection FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update supports"
ON public.supports_prospection FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete supports"
ON public.supports_prospection FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));