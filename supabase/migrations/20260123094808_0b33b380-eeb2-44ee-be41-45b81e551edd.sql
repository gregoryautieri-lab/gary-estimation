-- Add column for multiple Strava screenshots (max 3)
ALTER TABLE public.missions ADD COLUMN strava_screenshots text[] DEFAULT '{}';