
-- =============================================
-- HIREQIMAH DATABASE SCHEMA — PRODUCTION GRADE
-- =============================================

-- 1. Custom types
CREATE TYPE public.app_role AS ENUM ('student', 'hr', 'university', 'admin');
CREATE TYPE public.gpa_scale AS ENUM ('4', '5');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  nationality TEXT DEFAULT 'Saudi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User roles table (SEPARATE — prevents privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 4. Student profiles
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  university TEXT NOT NULL,
  major TEXT NOT NULL,
  gpa NUMERIC(3,2) DEFAULT 0,
  gpa_scale gpa_scale NOT NULL DEFAULT '4',
  target_role TEXT,
  visibility_public BOOLEAN DEFAULT true,
  ers_score NUMERIC(5,2) DEFAULT 0,
  academic_score NUMERIC(5,2) DEFAULT 0,
  certification_score NUMERIC(5,2) DEFAULT 0,
  project_score NUMERIC(5,2) DEFAULT 0,
  soft_skills_score NUMERIC(5,2) DEFAULT 0,
  conduct_score NUMERIC(5,2) DEFAULT 0,
  engagement_points INTEGER DEFAULT 0,
  national_rank INTEGER,
  university_rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. HR profiles
CREATE TABLE public.hr_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. University profiles
CREATE TABLE public.university_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  official_domain TEXT,
  admin_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Certifications catalog (admin-managed)
CREATE TABLE public.certification_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  weight NUMERIC(5,2) NOT NULL DEFAULT 10,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Student certifications
CREATE TABLE public.student_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_id UUID REFERENCES public.certification_catalog(id),
  custom_name TEXT,
  file_path TEXT,
  verified BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Student projects
CREATE TABLE public.student_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Transcript uploads
CREATE TABLE public.transcript_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  parsed_data JSONB,
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. HR shortlists
CREATE TABLE public.hr_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hr_user_id, student_user_id)
);

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- TIMESTAMP TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_hr_profiles_updated_at BEFORE UPDATE ON public.hr_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_university_profiles_updated_at BEFORE UPDATE ON public.university_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _role app_role;
  _full_name TEXT;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Create base profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, _full_name, NEW.email);

  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  -- Create role-specific profile
  IF _role = 'student' THEN
    INSERT INTO public.student_profiles (user_id, university, major, gpa, gpa_scale)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'university', ''),
      COALESCE(NEW.raw_user_meta_data->>'major', ''),
      COALESCE((NEW.raw_user_meta_data->>'gpa')::NUMERIC, 0),
      COALESCE((NEW.raw_user_meta_data->>'gpa_scale')::gpa_scale, '4')
    );
  ELSIF _role = 'hr' THEN
    INSERT INTO public.hr_profiles (user_id, company_name, position, industry)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'position', ''),
      COALESCE(NEW.raw_user_meta_data->>'industry', '')
    );
  ELSIF _role = 'university' THEN
    INSERT INTO public.university_profiles (user_id, university_name, official_domain, admin_contact)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'university_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'official_domain', ''),
      COALESCE(NEW.raw_user_meta_data->>'admin_contact', '')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public profiles viewable by HR" ON public.profiles FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin')
);

-- User roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Student profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own" ON public.student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students update own" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "HR view public students" ON public.student_profiles FOR SELECT TO authenticated USING (
  visibility_public = true AND (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'university'))
);

-- HR profiles
ALTER TABLE public.hr_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR read own" ON public.hr_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR update own" ON public.hr_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin view HR" ON public.hr_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- University profiles
ALTER TABLE public.university_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Uni read own" ON public.university_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Uni update own" ON public.university_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin view uni" ON public.university_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Certification catalog (public read)
ALTER TABLE public.certification_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read certs" ON public.certification_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage certs" ON public.certification_catalog FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Student certifications
ALTER TABLE public.student_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own certs" ON public.student_certifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "HR view student certs" ON public.student_certifications FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin')
);

-- Student projects
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own projects" ON public.student_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "HR view student projects" ON public.student_projects FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin')
);

-- Transcript uploads
ALTER TABLE public.transcript_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own transcripts" ON public.transcript_uploads FOR ALL USING (auth.uid() = user_id);

-- Audit logs (admin only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- HR shortlists
ALTER TABLE public.hr_shortlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR manage own shortlists" ON public.hr_shortlists FOR ALL USING (auth.uid() = hr_user_id);

-- =============================================
-- SEED CERTIFICATION CATALOG
-- =============================================
INSERT INTO public.certification_catalog (name, category, weight, description) VALUES
  ('CompTIA Security+', 'Cybersecurity', 20, 'Foundational cybersecurity certification'),
  ('CEH (Certified Ethical Hacker)', 'Cybersecurity', 25, 'Ethical hacking and penetration testing'),
  ('OSCP', 'Cybersecurity', 30, 'Offensive Security Certified Professional'),
  ('CISSP', 'Cybersecurity', 30, 'Certified Information Systems Security Professional'),
  ('AWS Solutions Architect', 'Cloud', 25, 'AWS cloud architecture'),
  ('Azure Administrator', 'Cloud', 20, 'Microsoft Azure administration'),
  ('PMP', 'Management', 25, 'Project Management Professional'),
  ('CCNA', 'Networking', 20, 'Cisco Certified Network Associate'),
  ('Google Data Analytics', 'Data', 15, 'Google professional data analytics certificate'),
  ('CISA', 'Cybersecurity', 25, 'Certified Information Systems Auditor'),
  ('CompTIA Network+', 'Networking', 15, 'Foundational networking certification'),
  ('CySA+', 'Cybersecurity', 22, 'CompTIA Cybersecurity Analyst'),
  ('CASP+', 'Cybersecurity', 28, 'CompTIA Advanced Security Practitioner'),
  ('eJPT', 'Cybersecurity', 18, 'eLearnSecurity Junior Penetration Tester'),
  ('Terraform Associate', 'DevOps', 18, 'HashiCorp Terraform certification'),
  ('Kubernetes Administrator (CKA)', 'DevOps', 25, 'Certified Kubernetes Administrator'),
  ('TOGAF', 'Architecture', 22, 'Enterprise architecture certification'),
  ('ITIL v4 Foundation', 'IT Service Management', 15, 'IT service management framework');

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
