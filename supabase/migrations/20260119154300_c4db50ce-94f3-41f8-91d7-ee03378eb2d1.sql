-- Supprimer la policy SELECT existante
DROP POLICY IF EXISTS "Les courtiers peuvent voir leurs estimations" ON public.estimations;

-- Créer la nouvelle policy avec accès aux estimations publiques
CREATE POLICY "Courtiers voient leurs estimations et les publiques"
ON public.estimations FOR SELECT
USING (
  auth.uid() = courtier_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'back_office'::app_role)
  OR statut IN ('mandat_signe', 'presentee')
);