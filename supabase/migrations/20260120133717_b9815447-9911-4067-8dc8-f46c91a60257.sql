-- Create table for commission objectives
CREATE TABLE public.commission_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  type text NOT NULL CHECK (type IN ('societe', 'courtier')),
  courtier_name text, -- Only for type 'courtier'
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, type, courtier_name)
);

-- Enable RLS
ALTER TABLE public.commission_objectives ENABLE ROW LEVEL SECURITY;

-- Only admins can manage objectives
CREATE POLICY "Admins can view objectives"
ON public.commission_objectives
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create objectives"
ON public.commission_objectives
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update objectives"
ON public.commission_objectives
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete objectives"
ON public.commission_objectives
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_commission_objectives_updated_at
BEFORE UPDATE ON public.commission_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default values for current year
INSERT INTO public.commission_objectives (year, type, courtier_name, amount) VALUES
(2025, 'societe', NULL, 1850000),
(2025, 'courtier', 'Steven', 300000),
(2025, 'courtier', 'Fred', 250000),
(2025, 'courtier', 'Guive', 350000),
(2025, 'courtier', 'Michel', 200000),
(2025, 'courtier', 'Véronique', 250000),
(2025, 'courtier', 'Greg', 300000),
(2025, 'courtier', 'Jared', 200000);