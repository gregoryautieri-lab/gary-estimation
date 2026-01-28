-- Permettre aux admins de mettre à jour tous les profils
CREATE POLICY "Les admins peuvent modifier tous les profils" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));