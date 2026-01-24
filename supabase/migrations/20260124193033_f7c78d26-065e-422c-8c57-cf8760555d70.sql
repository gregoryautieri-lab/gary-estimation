-- ============================================
-- MIGRATION 1/2 : Ajouter le statut 'validee' à l'enum
-- ============================================
ALTER TYPE estimation_status ADD VALUE IF NOT EXISTS 'validee' AFTER 'en_cours';