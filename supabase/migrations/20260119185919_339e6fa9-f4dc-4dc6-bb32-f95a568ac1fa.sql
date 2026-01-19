-- Ajout des champs acheteurs et vendeurs pour les comparables
ALTER TABLE public.comparables
ADD COLUMN acheteurs text NULL,
ADD COLUMN vendeurs text NULL;

COMMENT ON COLUMN public.comparables.acheteurs IS 'Nom(s) des acheteurs de la transaction';
COMMENT ON COLUMN public.comparables.vendeurs IS 'Nom(s) des vendeurs de la transaction';