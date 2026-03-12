
-- Create market_role_demand table for clustered job roles
CREATE TABLE public.market_role_demand (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL,
  role_category TEXT NOT NULL DEFAULT 'general',
  job_count INTEGER NOT NULL DEFAULT 0,
  top_required_skills TEXT[] DEFAULT '{}'::TEXT[],
  top_certifications TEXT[] DEFAULT '{}'::TEXT[],
  company_diversity INTEGER NOT NULL DEFAULT 0,
  salary_range TEXT,
  demand_score NUMERIC NOT NULL DEFAULT 0,
  match_companies TEXT[] DEFAULT '{}'::TEXT[],
  weekly_change NUMERIC DEFAULT 0,
  monthly_change NUMERIC DEFAULT 0,
  market_stability TEXT DEFAULT 'stable',
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.market_role_demand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage role demand" ON public.market_role_demand FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read role demand" ON public.market_role_demand FOR SELECT TO authenticated USING (true);
