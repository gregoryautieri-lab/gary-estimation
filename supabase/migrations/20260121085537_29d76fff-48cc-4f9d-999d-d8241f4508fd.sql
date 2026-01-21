-- Supprimer l'ancienne policy SELECT
DROP POLICY IF EXISTS "Users can view own comparables or admin all" ON public.comparables;

-- Créer la nouvelle policy : tous les utilisateurs authentifiés peuvent voir tous les comparables
CREATE POLICY "Authenticated users can view all comparables"
ON public.comparables
FOR SELECT
USING (auth.uid() IS NOT NULL);