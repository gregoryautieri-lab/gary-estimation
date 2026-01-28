-- =============================================
-- SIMPLIFY RLS POLICIES FOR leads TABLE
-- =============================================

-- Drop existing policies on leads
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and assigned courtiers can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Create simplified policies for leads
CREATE POLICY "Authenticated users can view leads"
ON public.leads FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert leads"
ON public.leads FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update leads"
ON public.leads FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- SIMPLIFY RLS POLICIES FOR partners TABLE
-- =============================================

-- Drop existing policies on partners
DROP POLICY IF EXISTS "Authenticated users can view partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can insert partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can update partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can delete partners" ON public.partners;

-- Create simplified policies for partners
CREATE POLICY "Authenticated users can view partners"
ON public.partners FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert partners"
ON public.partners FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update partners"
ON public.partners FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete partners"
ON public.partners FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));