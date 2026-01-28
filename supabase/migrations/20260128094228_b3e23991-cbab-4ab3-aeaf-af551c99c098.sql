-- Add repartition_ca column for CA split between brokers
-- This is separate from commission split (repartition)
-- Format: {"Courtier Name": percentage, ...} e.g. {"Steven": 60, "Frédéric": 40}
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS repartition_ca jsonb DEFAULT '{}'::jsonb;