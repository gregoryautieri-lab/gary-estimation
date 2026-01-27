-- Ajouter le champ type_message à la table campagnes
-- Ce champ permet de catégoriser chaque campagne par type de message envoyé

ALTER TABLE public.campagnes
ADD COLUMN type_message TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN public.campagnes.type_message IS 'Type de message de la campagne (ex: Nous avons vendu, Proposition estimation, etc.)';