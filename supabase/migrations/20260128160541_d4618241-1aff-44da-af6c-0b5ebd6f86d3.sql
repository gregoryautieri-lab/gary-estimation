-- Ajouter la colonne telegram_chat_id à la table profiles
ALTER TABLE public.profiles
ADD COLUMN telegram_chat_id text;