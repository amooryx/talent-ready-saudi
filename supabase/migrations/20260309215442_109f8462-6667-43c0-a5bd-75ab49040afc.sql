
-- Market Intelligence Tables

-- Role taxonomy for classifying job postings
CREATE TABLE public.market_role_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  role_category text NOT NULL DEFAULT 'general',
  aliases text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.market_role_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage roles taxonomy" ON public.market_role_taxonomy FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read role taxonomy" ON public.market_role_taxonomy FOR SELECT TO authenticated USING (true);

-- Skill demand tracking
CREATE TABLE public.market_skill_demand (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  normalized_name text NOT NULL,
  mention_count int NOT NULL DEFAULT 0,
  company_diversity int NOT NULL DEFAULT 0,
  recent_postings int NOT NULL DEFAULT 0,
  demand_score numeric NOT NULL DEFAULT 0,
  trend text DEFAULT 'stable',
  sector text,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_market_skill_unique ON public.market_skill_demand (normalized_name, COALESCE(sector, ''));
ALTER TABLE public.market_skill_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage skill demand" ON public.market_skill_demand FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read skill demand" ON public.market_skill_demand FOR SELECT TO authenticated USING (true);

-- Certification demand tracking
CREATE TABLE public.market_cert_demand (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_name text NOT NULL,
  normalized_name text NOT NULL,
  mention_count int NOT NULL DEFAULT 0,
  company_diversity int NOT NULL DEFAULT 0,
  recent_postings int NOT NULL DEFAULT 0,
  demand_score numeric NOT NULL DEFAULT 0,
  difficulty_level text DEFAULT 'intermediate',
  ers_points numeric NOT NULL DEFAULT 0,
  trend text DEFAULT 'stable',
  sector text,
  catalog_id uuid REFERENCES public.certification_catalog(id),
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_market_cert_unique ON public.market_cert_demand (normalized_name, COALESCE(sector, ''));
ALTER TABLE public.market_cert_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cert demand" ON public.market_cert_demand FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read cert demand" ON public.market_cert_demand FOR SELECT TO authenticated USING (true);

-- Job analysis results (tracks which jobs have been analyzed)
CREATE TABLE public.job_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_cache_id uuid REFERENCES public.job_cache(id) ON DELETE CASCADE,
  detected_role text,
  extracted_skills text[] DEFAULT '{}',
  extracted_certifications text[] DEFAULT '{}',
  extracted_soft_skills text[] DEFAULT '{}',
  experience_level text,
  salary_range text,
  confidence_score numeric DEFAULT 0,
  raw_analysis jsonb,
  analyzed_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_job_analysis_unique ON public.job_analysis_results (job_cache_id);
ALTER TABLE public.job_analysis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage job analysis" ON public.job_analysis_results FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read job analysis" ON public.job_analysis_results FOR SELECT TO authenticated USING (true);

-- Market intelligence refresh log
CREATE TABLE public.market_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid,
  jobs_analyzed int DEFAULT 0,
  skills_updated int DEFAULT 0,
  certs_updated int DEFAULT 0,
  roles_updated int DEFAULT 0,
  status text DEFAULT 'running',
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.market_refresh_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage refresh log" ON public.market_refresh_log FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert refresh log" ON public.market_refresh_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
