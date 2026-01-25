-- Trigger function to manage nb_estimations counter on campagnes
-- Handles INSERT, UPDATE, DELETE on estimations.campagne_origin_code

CREATE OR REPLACE FUNCTION public.update_campagne_nb_estimations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_campagne_id uuid;
  new_campagne_id uuid;
BEGIN
  -- Get the campagne IDs based on the codes
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.campagne_origin_code IS NOT NULL AND OLD.campagne_origin_code != '' THEN
      SELECT id INTO old_campagne_id
      FROM public.campagnes
      WHERE code = OLD.campagne_origin_code;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.campagne_origin_code IS NOT NULL AND NEW.campagne_origin_code != '' THEN
      SELECT id INTO new_campagne_id
      FROM public.campagnes
      WHERE code = NEW.campagne_origin_code;
    END IF;
  END IF;

  -- Handle DELETE: decrement old campagne
  IF TG_OP = 'DELETE' THEN
    IF old_campagne_id IS NOT NULL THEN
      UPDATE public.campagnes
      SET nb_estimations = GREATEST(0, nb_estimations - 1)
      WHERE id = old_campagne_id;
    END IF;
    RETURN OLD;
  END IF;

  -- Handle INSERT: increment new campagne
  IF TG_OP = 'INSERT' THEN
    IF new_campagne_id IS NOT NULL THEN
      UPDATE public.campagnes
      SET nb_estimations = nb_estimations + 1
      WHERE id = new_campagne_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE: decrement old, increment new (if different)
  IF TG_OP = 'UPDATE' THEN
    -- Only process if the code actually changed
    IF COALESCE(OLD.campagne_origin_code, '') IS DISTINCT FROM COALESCE(NEW.campagne_origin_code, '') THEN
      -- Decrement old campagne if it existed
      IF old_campagne_id IS NOT NULL THEN
        UPDATE public.campagnes
        SET nb_estimations = GREATEST(0, nb_estimations - 1)
        WHERE id = old_campagne_id;
      END IF;
      
      -- Increment new campagne if it exists
      IF new_campagne_id IS NOT NULL THEN
        UPDATE public.campagnes
        SET nb_estimations = nb_estimations + 1
        WHERE id = new_campagne_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger on estimations table
DROP TRIGGER IF EXISTS trigger_update_campagne_nb_estimations ON public.estimations;

CREATE TRIGGER trigger_update_campagne_nb_estimations
AFTER INSERT OR UPDATE OF campagne_origin_code OR DELETE
ON public.estimations
FOR EACH ROW
EXECUTE FUNCTION public.update_campagne_nb_estimations();