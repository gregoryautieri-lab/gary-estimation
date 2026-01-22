-- Permettre aux étudiants de lire les campagnes auxquelles ils ont une mission assignée
CREATE POLICY "Etudiants can view campagnes of their missions"
ON campagnes FOR SELECT
USING (
  id IN (
    SELECT campagne_id FROM missions 
    WHERE etudiant_id IN (
      SELECT id FROM etudiants WHERE user_id = auth.uid()
    )
  )
);