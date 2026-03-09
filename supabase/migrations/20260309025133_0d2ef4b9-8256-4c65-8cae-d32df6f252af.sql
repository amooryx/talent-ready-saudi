
-- Badges/achievements table
CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_key TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  badge_icon TEXT DEFAULT '🏆',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read badges" ON public.student_badges FOR SELECT USING (true);
CREATE POLICY "System insert badges" ON public.student_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage badges" ON public.student_badges FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Job postings by HR
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  location TEXT DEFAULT 'Saudi Arabia',
  sector TEXT,
  required_skills TEXT[] DEFAULT '{}',
  required_certifications TEXT[] DEFAULT '{}',
  min_ers_score NUMERIC DEFAULT 0,
  experience_level TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR manage own postings" ON public.job_postings FOR ALL USING (auth.uid() = hr_user_id);
CREATE POLICY "Anyone read active postings" ON public.job_postings FOR SELECT USING (is_active = true);

CREATE INDEX idx_job_postings_active ON public.job_postings(is_active, created_at DESC);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_email)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "System insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

-- Activity feed
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university TEXT,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read activities" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "System insert activities" ON public.activity_feed FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

CREATE INDEX idx_activity_feed_recent ON public.activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_uni ON public.activity_feed(university, created_at DESC);
