-- 1. CAMPAGNES - Ajouter DELETE pour les courtiers sur leurs propres campagnes
CREATE POLICY "Courtiers can delete own campagnes"
ON public.campagnes
FOR DELETE
USING (courtier_id = auth.uid());

-- 2. ETUDIANTS - Remplacer la policy SELECT admin-only par admin OR courtier
DROP POLICY IF EXISTS "Admins can view all etudiants" ON public.etudiants;

CREATE POLICY "Admins and courtiers can view all etudiants"
ON public.etudiants
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'courtier'::app_role)
);

-- 3. PAIES - Ajouter SELECT pour les courtiers (via leurs campagnes)
CREATE POLICY "Courtiers can view paies of own campagnes"
ON public.paies
FOR SELECT
USING (
  etudiant_id IN (
    SELECT DISTINCT m.etudiant_id 
    FROM missions m
    JOIN campagnes c ON m.campagne_id = c.id
    WHERE c.courtier_id = auth.uid()
  )
);