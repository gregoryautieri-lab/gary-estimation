-- 1. Add archiving columns to campagnes table
ALTER TABLE public.campagnes
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN archived_by UUID DEFAULT NULL;

-- 2. Update the trigger function to count ALL campaigns (including archived)
-- The existing function already counts all campaigns without filtering on archived_at
-- But let's make it explicit by ensuring it doesn't filter
CREATE OR REPLACE FUNCTION public.generate_campagne_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  year_month := to_char(CURRENT_DATE, 'YYMM');
  
  -- Count ALL campaigns for this month, INCLUDING archived ones
  -- This ensures codes are never reused
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM 7 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.campagnes
  WHERE code LIKE 'C' || year_month || '-%';
  -- No filter on archived_at - we count everything
  
  new_code := 'C' || year_month || '-' || LPAD(seq_num::TEXT, 3, '0');
  
  NEW.code := new_code;
  RETURN NEW;
END;
$function$;

-- 3. Add index for performance on archived_at queries
CREATE INDEX idx_campagnes_archived_at ON public.campagnes(archived_at);