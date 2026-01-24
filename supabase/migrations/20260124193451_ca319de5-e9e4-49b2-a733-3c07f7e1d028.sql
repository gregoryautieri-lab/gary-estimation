-- ============================================
-- MIGRATION 2/2 : Migrer les données vers les nouveaux statuts
-- Note: 'vendu' n'existe pas dans l'enum DB, seulement côté TS
-- ============================================

-- en_cours → brouillon
UPDATE estimations SET statut = 'brouillon' WHERE statut = 'en_cours';

-- a_presenter → validee
UPDATE estimations SET statut = 'validee' WHERE statut = 'a_presenter';

-- reflexion → presentee
UPDATE estimations SET statut = 'presentee' WHERE statut = 'reflexion';

-- accord_oral, en_signature → negociation
UPDATE estimations SET statut = 'negociation' WHERE statut IN ('accord_oral', 'en_signature');

-- termine → mandat_signe (vendu n'existe pas en DB)
UPDATE estimations SET statut = 'mandat_signe' WHERE statut = 'termine';