
-- ============================================
-- PHASE 1: EXPANDED SCHEMA FOR NATIONAL SCALE
-- ============================================

-- 1. Universities table (institutional registry)
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_code TEXT,
  domain TEXT, -- e.g., ksu.edu.sa
  region TEXT,
  type TEXT DEFAULT 'public', -- public, private
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Admins manage universities" ON public.universities FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 2. Majors repository (50+ Saudi majors with sector mapping)
CREATE TABLE public.majors_repository (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  department TEXT,
  sector TEXT NOT NULL, -- IT, Medical, Law, Business, Engineering, Arts, Healthcare, Humanities
  skill_domain TEXT,
  university_id UUID REFERENCES public.universities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, university_id)
);
ALTER TABLE public.majors_repository ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read majors" ON public.majors_repository FOR SELECT USING (true);
CREATE POLICY "Admins manage majors" ON public.majors_repository FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 3. Skill ontology (contextual skills per domain)
CREATE TABLE public.skill_ontology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  skill_category TEXT NOT NULL, -- technical, soft, domain-specific
  sector TEXT,
  context_description TEXT, -- e.g., "Clinical Diagnosis" for Medicine
  parent_skill_id UUID REFERENCES public.skill_ontology(id),
  weight NUMERIC DEFAULT 1,
  is_volatile BOOLEAN DEFAULT false, -- decays faster
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skill_ontology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read skills" ON public.skill_ontology FOR SELECT USING (true);
CREATE POLICY "Admins manage skills" ON public.skill_ontology FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 4. Job cache (market intelligence, 24h refresh)
CREATE TABLE public.job_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT,
  sector TEXT,
  location TEXT DEFAULT 'Saudi Arabia',
  required_skills TEXT[] DEFAULT '{}',
  required_certifications TEXT[] DEFAULT '{}',
  experience_level TEXT,
  source_url TEXT,
  source TEXT DEFAULT 'manual', -- linkedin, manual, api
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  raw_data JSONB
);
ALTER TABLE public.job_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read jobs" ON public.job_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage jobs" ON public.job_cache FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 5. ERS scores (advanced with decay, synergy, national readiness)
CREATE TABLE public.ers_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score NUMERIC DEFAULT 0,
  academic_score NUMERIC DEFAULT 0,
  certification_score NUMERIC DEFAULT 0,
  project_score NUMERIC DEFAULT 0,
  soft_skills_score NUMERIC DEFAULT 0,
  conduct_score NUMERIC DEFAULT 0,
  recency_score NUMERIC DEFAULT 0, -- skill decay factor
  synergy_bonus NUMERIC DEFAULT 0, -- cross-sector bonus
  national_readiness_bonus NUMERIC DEFAULT 0, -- Arabic mastery, national history
  interview_score NUMERIC DEFAULT 0,
  decay_applied NUMERIC DEFAULT 0, -- total decay deducted
  explanation JSONB, -- explainable breakdown
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.ers_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own ERS" ON public.ers_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students update own ERS" ON public.ers_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "HR view ERS" ON public.ers_scores FOR SELECT USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'university'));
CREATE POLICY "Admins manage ERS" ON public.ers_scores FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 6. Document integrity (fraud prevention)
CREATE TABLE public.document_integrity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  file_type TEXT, -- pdf, png, jpg
  creation_date TIMESTAMPTZ,
  author TEXT,
  modification_date TIMESTAMPTZ,
  enrollment_date TIMESTAMPTZ,
  flag TEXT DEFAULT 'CLEAN', -- CLEAN, REVIEW_REQUIRED, FLAGGED
  flag_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_integrity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own docs" ON public.document_integrity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage doc integrity" ON public.document_integrity FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Students insert own docs" ON public.document_integrity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Synergy mappings (cross-sector skill bonuses)
CREATE TABLE public.synergy_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_a TEXT NOT NULL,
  sector_b TEXT NOT NULL,
  bonus_percentage NUMERIC DEFAULT 5,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sector_a, sector_b)
);
ALTER TABLE public.synergy_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read synergies" ON public.synergy_mappings FOR SELECT USING (true);
CREATE POLICY "Admins manage synergies" ON public.synergy_mappings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 8. Global benchmarks (GCI comparison)
CREATE TABLE public.global_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  role_title TEXT NOT NULL,
  region TEXT DEFAULT 'Global',
  benchmark_score NUMERIC NOT NULL,
  percentile_data JSONB,
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.global_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read benchmarks" ON public.global_benchmarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage benchmarks" ON public.global_benchmarks FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 9. Soft skill assessments
CREATE TABLE public.soft_skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skill_ontology(id),
  skill_name TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  assessment_type TEXT DEFAULT 'self', -- self, peer, ai_interview
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence JSONB
);
ALTER TABLE public.soft_skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own assessments" ON public.soft_skill_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "HR view assessments" ON public.soft_skill_assessments FOR SELECT USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin'));

-- 10. Verification requests
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- certification, project, transcript
  resource_id UUID NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewer_id UUID,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students create requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage verification" ON public.verification_requests FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'university'));

-- 11. Endorsements
CREATE TABLE public.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorser_user_id UUID NOT NULL REFERENCES auth.users(id),
  skill_name TEXT NOT NULL,
  endorser_role TEXT NOT NULL, -- hr, university, peer
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_user_id, endorser_user_id, skill_name)
);
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own endorsements" ON public.endorsements FOR SELECT USING (auth.uid() = student_user_id);
CREATE POLICY "Endorsers create" ON public.endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_user_id);
CREATE POLICY "HR view endorsements" ON public.endorsements FOR SELECT USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin'));

-- 12. Skill matrix (student skills mapped to ontology)
CREATE TABLE public.skill_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skill_ontology(id),
  skill_name TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
  source TEXT DEFAULT 'self', -- self, transcript, certification, project
  verified BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_name)
);
ALTER TABLE public.skill_matrix ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own skills" ON public.skill_matrix FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "HR view skills" ON public.skill_matrix FOR SELECT USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'university'));

-- 13. Add Nafath/GOSI ready fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS employment_status TEXT,
  ADD COLUMN IF NOT EXISTS graduation_status TEXT,
  ADD COLUMN IF NOT EXISTS external_verification_token TEXT;

-- 14. Add hadaf tagging to certification_catalog
ALTER TABLE public.certification_catalog
  ADD COLUMN IF NOT EXISTS is_hadaf_reimbursed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sector TEXT,
  ADD COLUMN IF NOT EXISTS is_volatile BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS decay_rate_annual NUMERIC DEFAULT 0;

-- 15. Add onboarding_completed to student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_progress NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS career_target TEXT;

-- 16. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ers_scores_user_id ON public.ers_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_ers_scores_total ON public.ers_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_skill_matrix_user_id ON public.skill_matrix(user_id);
CREATE INDEX IF NOT EXISTS idx_job_cache_sector ON public.job_cache(sector);
CREATE INDEX IF NOT EXISTS idx_job_cache_expires ON public.job_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_majors_sector ON public.majors_repository(sector);
CREATE INDEX IF NOT EXISTS idx_student_profiles_university ON public.student_profiles(university);
CREATE INDEX IF NOT EXISTS idx_endorsements_student ON public.endorsements(student_user_id);
CREATE INDEX IF NOT EXISTS idx_document_integrity_user ON public.document_integrity(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_soft_skill_assessments_user ON public.soft_skill_assessments(user_id);

-- 17. Seed universities
INSERT INTO public.universities (name, short_code, domain, region, type) VALUES
  ('King Saud University', 'KSU', 'ksu.edu.sa', 'Riyadh', 'public'),
  ('Princess Nourah bint Abdulrahman University', 'PNU', 'pnu.edu.sa', 'Riyadh', 'public'),
  ('King Abdulaziz University', 'KAU', 'kau.edu.sa', 'Jeddah', 'public'),
  ('King Fahd University of Petroleum and Minerals', 'KFUPM', 'kfupm.edu.sa', 'Dhahran', 'public'),
  ('King Khalid University', 'KKU', 'kku.edu.sa', 'Abha', 'public'),
  ('Imam Abdulrahman Bin Faisal University', 'IAU', 'iau.edu.sa', 'Dammam', 'public'),
  ('Umm Al-Qura University', 'UQU', 'uqu.edu.sa', 'Makkah', 'public'),
  ('Taibah University', 'TAIBAH', 'taibahu.edu.sa', 'Madinah', 'public'),
  ('Qassim University', 'QU', 'qu.edu.sa', 'Qassim', 'public'),
  ('Taif University', 'TU', 'tu.edu.sa', 'Taif', 'public'),
  ('Jazan University', 'JU', 'jazanu.edu.sa', 'Jazan', 'public'),
  ('Najran University', 'NU', 'nu.edu.sa', 'Najran', 'public'),
  ('Northern Borders University', 'NBU', 'nbu.edu.sa', 'Arar', 'public'),
  ('University of Tabuk', 'UT', 'ut.edu.sa', 'Tabuk', 'public'),
  ('University of Ha''il', 'UOH', 'uoh.edu.sa', 'Hail', 'public'),
  ('Shaqra University', 'SU', 'su.edu.sa', 'Shaqra', 'public'),
  ('Majmaah University', 'MU', 'mu.edu.sa', 'Majmaah', 'public'),
  ('Prince Sattam bin Abdulaziz University', 'PSAU', 'psau.edu.sa', 'Al Kharj', 'public'),
  ('Jeddah University', 'UJ', 'uj.edu.sa', 'Jeddah', 'public'),
  ('Bisha University', 'BU', 'ub.edu.sa', 'Bisha', 'public'),
  ('Alfaisal University', 'AU', 'alfaisal.edu', 'Riyadh', 'private'),
  ('Prince Sultan University', 'PSU', 'psu.edu.sa', 'Riyadh', 'private'),
  ('Dar Al-Hekma University', 'DAH', 'dah.edu.sa', 'Jeddah', 'private'),
  ('Effat University', 'EU', 'effat.edu.sa', 'Jeddah', 'private'),
  ('King Abdullah University of Science and Technology', 'KAUST', 'kaust.edu.sa', 'Thuwal', 'public'),
  ('Saudi Electronic University', 'SEU', 'seu.edu.sa', 'Riyadh', 'public'),
  ('Arab Open University', 'AOU', 'arabou.edu.sa', 'Riyadh', 'private'),
  ('Imam Muhammad ibn Saud Islamic University', 'IMSIU', 'imamu.edu.sa', 'Riyadh', 'public'),
  ('Islamic University of Madinah', 'IU', 'iu.edu.sa', 'Madinah', 'public')
ON CONFLICT DO NOTHING;

-- 18. Seed majors repository (50+ cross-sector)
INSERT INTO public.majors_repository (name, sector, skill_domain, department) VALUES
  -- IT & Computer Science
  ('Computer Science', 'IT', 'Software Engineering', 'Computing'),
  ('Information Technology', 'IT', 'Systems Administration', 'Computing'),
  ('Cybersecurity', 'IT', 'Security Engineering', 'Computing'),
  ('Artificial Intelligence', 'IT', 'Machine Learning', 'Computing'),
  ('Data Science', 'IT', 'Data Analytics', 'Computing'),
  ('Software Engineering', 'IT', 'Software Development', 'Computing'),
  ('Information Systems', 'IT', 'Business Technology', 'Computing'),
  -- Engineering
  ('Mechanical Engineering', 'Engineering', 'Mechanical Design', 'Engineering'),
  ('Electrical Engineering', 'Engineering', 'Electrical Systems', 'Engineering'),
  ('Civil Engineering', 'Engineering', 'Structural Design', 'Engineering'),
  ('Chemical Engineering', 'Engineering', 'Process Engineering', 'Engineering'),
  ('Industrial Engineering', 'Engineering', 'Operations Optimization', 'Engineering'),
  ('Petroleum Engineering', 'Engineering', 'Reservoir Engineering', 'Engineering'),
  ('Architectural Engineering', 'Engineering', 'Building Design', 'Engineering'),
  ('Environmental Engineering', 'Engineering', 'Sustainability', 'Engineering'),
  -- Medical & Healthcare
  ('Medicine (MBBS)', 'Medical', 'Clinical Practice', 'Medicine'),
  ('Nursing', 'Healthcare', 'Patient Care', 'Health Sciences'),
  ('Pharmacy', 'Healthcare', 'Pharmaceutical Sciences', 'Health Sciences'),
  ('Dentistry', 'Medical', 'Dental Practice', 'Dentistry'),
  ('Physical Therapy', 'Healthcare', 'Rehabilitation', 'Health Sciences'),
  ('Clinical Laboratory Sciences', 'Healthcare', 'Diagnostics', 'Health Sciences'),
  ('Radiology', 'Healthcare', 'Medical Imaging', 'Health Sciences'),
  ('Public Health', 'Healthcare', 'Epidemiology', 'Health Sciences'),
  ('Health Informatics', 'Healthcare', 'Health IT', 'Health Sciences'),
  -- Business & Finance
  ('Business Administration', 'Business', 'Management', 'Business'),
  ('Finance', 'Business', 'Financial Analysis', 'Business'),
  ('Accounting', 'Business', 'Financial Reporting', 'Business'),
  ('Marketing', 'Business', 'Market Strategy', 'Business'),
  ('Human Resources Management', 'Business', 'Talent Management', 'Business'),
  ('Supply Chain Management', 'Business', 'Logistics', 'Business'),
  ('Economics', 'Business', 'Economic Analysis', 'Business'),
  ('Entrepreneurship', 'Business', 'Venture Development', 'Business'),
  -- Law
  ('Law (LLB)', 'Law', 'Legal Practice', 'Law'),
  ('Islamic Law (Sharia)', 'Law', 'Sharia Compliance', 'Law'),
  ('International Law', 'Law', 'International Relations', 'Law'),
  ('Commercial Law', 'Law', 'Corporate Legal', 'Law'),
  -- Arts & Humanities
  ('Arabic Language & Literature', 'Humanities', 'Linguistics', 'Arts'),
  ('English Language & Literature', 'Humanities', 'Linguistics', 'Arts'),
  ('Translation', 'Humanities', 'Cross-Cultural Communication', 'Arts'),
  ('Islamic Studies', 'Humanities', 'Religious Scholarship', 'Arts'),
  ('History', 'Humanities', 'Historical Research', 'Arts'),
  ('Psychology', 'Humanities', 'Behavioral Science', 'Social Sciences'),
  ('Sociology', 'Humanities', 'Social Research', 'Social Sciences'),
  ('Political Science', 'Humanities', 'Governance', 'Social Sciences'),
  ('Media & Communication', 'Arts', 'Digital Media', 'Communication'),
  ('Graphic Design', 'Arts', 'Visual Design', 'Design'),
  ('Interior Design', 'Arts', 'Spatial Design', 'Design'),
  ('Architecture', 'Arts', 'Architectural Design', 'Architecture'),
  -- Education
  ('Education', 'Education', 'Pedagogy', 'Education'),
  ('Special Education', 'Education', 'Inclusive Learning', 'Education'),
  ('Early Childhood Education', 'Education', 'Child Development', 'Education'),
  -- Science
  ('Mathematics', 'Science', 'Quantitative Analysis', 'Science'),
  ('Physics', 'Science', 'Applied Physics', 'Science'),
  ('Chemistry', 'Science', 'Chemical Analysis', 'Science'),
  ('Biology', 'Science', 'Biological Research', 'Science'),
  ('Geology', 'Science', 'Earth Sciences', 'Science'),
  ('Statistics', 'Science', 'Statistical Modeling', 'Science')
ON CONFLICT DO NOTHING;

-- 19. Seed skill ontology (cross-sector contextual skills)
INSERT INTO public.skill_ontology (skill_name, skill_category, sector, context_description, is_volatile) VALUES
  ('Critical Thinking', 'soft', 'Medical', 'Clinical Diagnosis & Differential Analysis', false),
  ('Critical Thinking', 'soft', 'Law', 'Legal Precedent Analysis & Case Reasoning', false),
  ('Critical Thinking', 'soft', 'Engineering', 'Systems Optimization & Root Cause Analysis', false),
  ('Critical Thinking', 'soft', 'Business', 'Financial Risk Evaluation & Strategic Planning', false),
  ('Python Programming', 'technical', 'IT', 'Software Development & Data Science', true),
  ('Data Analysis', 'technical', 'IT', 'Statistical Analysis & Machine Learning', true),
  ('Cloud Computing', 'technical', 'IT', 'AWS/Azure/GCP Infrastructure', true),
  ('Cybersecurity', 'technical', 'IT', 'Network Security & Penetration Testing', true),
  ('Project Management', 'soft', NULL, 'Cross-sector planning & delivery', false),
  ('Communication', 'soft', NULL, 'Professional written & verbal communication', false),
  ('Leadership', 'soft', NULL, 'Team management & strategic direction', false),
  ('Problem Solving', 'soft', NULL, 'Analytical thinking & creative solutions', false),
  ('Clinical Research', 'technical', 'Medical', 'Evidence-based medical research', false),
  ('Patient Assessment', 'technical', 'Healthcare', 'Nursing & clinical evaluation', false),
  ('Legal Writing', 'technical', 'Law', 'Legal briefs & contract drafting', false),
  ('Financial Modeling', 'technical', 'Business', 'Valuation & forecasting', true),
  ('AutoCAD', 'technical', 'Engineering', 'Technical drawing & design', false),
  ('MATLAB', 'technical', 'Engineering', 'Numerical computing & simulation', false),
  ('Digital Marketing', 'technical', 'Business', 'SEO, SEM, Social Media Strategy', true),
  ('Machine Learning', 'technical', 'IT', 'Neural networks & model training', true),
  ('Arabic Proficiency', 'domain-specific', NULL, 'Professional Arabic mastery', false),
  ('Saudi National History', 'domain-specific', NULL, 'National history & governance literacy', false)
ON CONFLICT DO NOTHING;

-- 20. Seed synergy mappings
INSERT INTO public.synergy_mappings (sector_a, sector_b, bonus_percentage, description) VALUES
  ('Law', 'IT', 7, 'LegalTech & Compliance Automation'),
  ('Medical', 'IT', 8, 'Health Informatics & Digital Health'),
  ('Engineering', 'Business', 5, 'Technical Project Management'),
  ('IT', 'Business', 6, 'Digital Transformation & FinTech'),
  ('Healthcare', 'IT', 7, 'Health IT & Telemedicine'),
  ('Engineering', 'Science', 5, 'Applied Research & Innovation'),
  ('Law', 'Business', 6, 'Corporate Governance & Compliance'),
  ('Arts', 'IT', 5, 'UX Design & Digital Media'),
  ('Education', 'IT', 5, 'EdTech & E-Learning')
ON CONFLICT DO NOTHING;

-- 21. Seed global benchmarks
INSERT INTO public.global_benchmarks (sector, role_title, region, benchmark_score, source) VALUES
  ('IT', 'Software Engineer', 'Global', 72, 'Industry Average 2025'),
  ('IT', 'Data Scientist', 'Global', 75, 'Industry Average 2025'),
  ('IT', 'Cybersecurity Analyst', 'Global', 70, 'Industry Average 2025'),
  ('Medical', 'Medical Doctor', 'Global', 80, 'WHO Standards 2025'),
  ('Healthcare', 'Registered Nurse', 'Global', 68, 'WHO Standards 2025'),
  ('Engineering', 'Mechanical Engineer', 'Global', 70, 'Industry Average 2025'),
  ('Engineering', 'Petroleum Engineer', 'Saudi Arabia', 78, 'Saudi Aramco Benchmark'),
  ('Business', 'Financial Analyst', 'Global', 72, 'CFA Institute 2025'),
  ('Law', 'Corporate Lawyer', 'Global', 74, 'Industry Average 2025'),
  ('Business', 'Marketing Manager', 'Global', 65, 'Industry Average 2025')
ON CONFLICT DO NOTHING;

-- 22. Update certification catalog with new fields
UPDATE public.certification_catalog SET sector = 'IT', is_volatile = true, decay_rate_annual = 15 WHERE category = 'Cybersecurity';
UPDATE public.certification_catalog SET sector = 'IT', is_volatile = true, decay_rate_annual = 10 WHERE category = 'Cloud';
UPDATE public.certification_catalog SET sector = 'IT', is_volatile = true, decay_rate_annual = 10 WHERE category = 'Data';
UPDATE public.certification_catalog SET sector = 'IT', is_volatile = false WHERE category = 'Programming';
UPDATE public.certification_catalog SET is_hadaf_reimbursed = true WHERE name IN ('OSCP', 'CompTIA Security+', 'AWS Solutions Architect', 'Azure Administrator', 'Google Cloud Professional', 'PMP');
