
-- 1. Skill synonyms for normalization
CREATE TABLE public.skill_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synonym TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_skill_synonyms_synonym ON public.skill_synonyms(lower(synonym));
ALTER TABLE public.skill_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage skill synonyms" ON public.skill_synonyms FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read skill synonyms" ON public.skill_synonyms FOR SELECT TO authenticated USING (true);

-- 2. Skill-to-certification mapping
CREATE TABLE public.skill_cert_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  cert_name TEXT NOT NULL,
  relevance_score NUMERIC NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_skill_cert_unique ON public.skill_cert_mapping(lower(skill_name), lower(cert_name));
ALTER TABLE public.skill_cert_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage skill cert mapping" ON public.skill_cert_mapping FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read skill cert mapping" ON public.skill_cert_mapping FOR SELECT TO authenticated USING (true);

-- 3. Demand history for trend tracking
CREATE TABLE public.demand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'skill' or 'cert'
  item_name TEXT NOT NULL,
  demand_score NUMERIC NOT NULL DEFAULT 0,
  mention_count INTEGER NOT NULL DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_demand_history_lookup ON public.demand_history(item_type, item_name, snapshot_date);
CREATE UNIQUE INDEX idx_demand_history_unique ON public.demand_history(item_type, lower(item_name), snapshot_date);
ALTER TABLE public.demand_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage demand history" ON public.demand_history FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read demand history" ON public.demand_history FOR SELECT TO authenticated USING (true);

-- 4. Add certification verification fields to student_certifications
ALTER TABLE public.student_certifications
  ADD COLUMN IF NOT EXISTS issuer TEXT,
  ADD COLUMN IF NOT EXISTS certificate_id TEXT,
  ADD COLUMN IF NOT EXISTS issued_date DATE;

-- 5. Add weekly/monthly change columns to market tables
ALTER TABLE public.market_skill_demand
  ADD COLUMN IF NOT EXISTS weekly_change NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_change NUMERIC DEFAULT 0;

ALTER TABLE public.market_cert_demand
  ADD COLUMN IF NOT EXISTS weekly_change NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_change NUMERIC DEFAULT 0;

-- 6. Seed common skill synonyms
INSERT INTO public.skill_synonyms (synonym, canonical_name) VALUES
  ('Python programming', 'Python'),
  ('Python scripting', 'Python'),
  ('Python 3', 'Python'),
  ('Py', 'Python'),
  ('JavaScript', 'JavaScript'),
  ('JS', 'JavaScript'),
  ('Node.js', 'Node.js'),
  ('NodeJS', 'Node.js'),
  ('React.js', 'React'),
  ('ReactJS', 'React'),
  ('Amazon Web Services', 'AWS'),
  ('Ethical hacking', 'Penetration Testing'),
  ('Ethical Hacker', 'Penetration Testing'),
  ('Pen testing', 'Penetration Testing'),
  ('Pen test', 'Penetration Testing'),
  ('Machine learning', 'Machine Learning'),
  ('ML', 'Machine Learning'),
  ('Deep learning', 'Deep Learning'),
  ('DL', 'Deep Learning'),
  ('Artificial intelligence', 'Artificial Intelligence'),
  ('Natural language processing', 'NLP'),
  ('Structured Query Language', 'SQL'),
  ('Microsoft Azure', 'Azure'),
  ('Google Cloud Platform', 'GCP'),
  ('Google Cloud', 'GCP'),
  ('Kubernetes', 'Kubernetes'),
  ('K8s', 'Kubernetes'),
  ('Docker containers', 'Docker'),
  ('Containerization', 'Docker'),
  ('Cybersecurity', 'Cybersecurity'),
  ('Cyber security', 'Cybersecurity'),
  ('Information security', 'Information Security'),
  ('Infosec', 'Information Security'),
  ('Web exploitation', 'Web Application Security'),
  ('Web app security', 'Web Application Security'),
  ('Burp Suite', 'Burp Suite'),
  ('BurpSuite', 'Burp Suite'),
  ('CI/CD', 'CI/CD'),
  ('Continuous integration', 'CI/CD'),
  ('Continuous deployment', 'CI/CD'),
  ('Data analysis', 'Data Analysis'),
  ('Data analytics', 'Data Analysis'),
  ('Power BI', 'Power BI'),
  ('PowerBI', 'Power BI'),
  ('Tableau', 'Tableau'),
  ('SAP ERP', 'SAP'),
  ('SAP Systems', 'SAP');

-- 7. Seed skill-to-certification mappings
INSERT INTO public.skill_cert_mapping (skill_name, cert_name, relevance_score) VALUES
  ('Penetration Testing', 'OSCP', 95),
  ('Penetration Testing', 'CEH', 80),
  ('Penetration Testing', 'eJPT', 70),
  ('Web Application Security', 'OSCP', 90),
  ('Web Application Security', 'GWAPT', 85),
  ('Cybersecurity', 'CompTIA Security+', 85),
  ('Cybersecurity', 'CISSP', 90),
  ('Cybersecurity', 'CEH', 75),
  ('Cloud Security', 'CompTIA Security+', 75),
  ('Cloud Security', 'CCSP', 90),
  ('Cloud Security', 'AWS Security Specialty', 85),
  ('AWS', 'AWS Solutions Architect', 90),
  ('AWS', 'AWS Developer Associate', 85),
  ('AWS', 'AWS Cloud Practitioner', 70),
  ('Azure', 'AZ-900', 70),
  ('Azure', 'AZ-104', 85),
  ('Azure', 'AZ-305', 90),
  ('GCP', 'Google Cloud Associate', 80),
  ('GCP', 'Google Cloud Professional', 90),
  ('Data Analysis', 'Google Data Analytics', 80),
  ('Data Analysis', 'IBM Data Analyst', 75),
  ('Machine Learning', 'TensorFlow Developer Certificate', 85),
  ('Machine Learning', 'AWS Machine Learning Specialty', 80),
  ('Python', 'PCEP', 65),
  ('Python', 'PCAP', 75),
  ('Project Management', 'PMP', 95),
  ('Project Management', 'PRINCE2', 85),
  ('Networking', 'CCNA', 90),
  ('Networking', 'CompTIA Network+', 80),
  ('Linux', 'LPIC-1', 80),
  ('Linux', 'CompTIA Linux+', 75),
  ('SAP', 'SAP Certified Associate', 85),
  ('Digital Marketing', 'Google Ads Certification', 80),
  ('Digital Marketing', 'HubSpot Inbound Marketing', 75);

-- 8. Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
