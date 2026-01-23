-- Ajouter une contrainte FK avec suppression en cascade entre missions et campagnes
ALTER TABLE missions
ADD CONSTRAINT fk_missions_campagne
FOREIGN KEY (campagne_id) 
REFERENCES campagnes(id)
ON DELETE CASCADE;