-- Ajouter la colonne téléphone aux profils utilisateurs
ALTER TABLE public.profiles 
ADD COLUMN telephone text;