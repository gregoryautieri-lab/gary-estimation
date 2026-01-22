-- Supprimer l'ancienne policy qui cause une récursion infinie
DROP POLICY IF EXISTS "Etudiants can view campagnes of their missions" ON campagnes;

-- Nouvelle policy : utilise EXISTS avec jointure directe pour éviter la récursion
CREATE POLICY "Etudiants can view assigned campagnes" 
ON campagnes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM etudiants e
    JOIN missions m ON m.etudiant_id = e.id
    WHERE e.user_id = auth.uid()
    AND m.campagne_id = campagnes.id
  )
);