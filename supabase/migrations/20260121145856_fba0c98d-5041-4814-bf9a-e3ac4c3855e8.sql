-- =============================================
-- PROMPT 1 - PARTIE 1 : Extension des rôles enum
-- =============================================

-- Ajouter les nouveaux rôles à l'enum existant
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'etudiant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'responsable_prospection';