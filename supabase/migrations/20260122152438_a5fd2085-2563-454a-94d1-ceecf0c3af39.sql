-- Supprimer la policy problématique (jointure missions)
DROP POLICY IF EXISTS "Etudiants can view assigned campagnes" ON public.campagnes;

-- Nouvelle policy simple : les étudiants peuvent lire toutes les campagnes
CREATE POLICY "Etudiants can view all campagnes"
ON public.campagnes FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.etudiants
    WHERE user_id = auth.uid()
  )
);