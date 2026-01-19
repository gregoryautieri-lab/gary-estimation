-- Mise à jour des RLS pour permettre aux admins de voir et supprimer tous les comparables

-- Drop les anciennes policies
DROP POLICY IF EXISTS "Users can view own comparables" ON public.comparables;
DROP POLICY IF EXISTS "Users can delete own comparables" ON public.comparables;

-- Recréer avec accès admin
CREATE POLICY "Users can view own comparables or admin all"
ON public.comparables
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own comparables or admin all"
ON public.comparables
FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));