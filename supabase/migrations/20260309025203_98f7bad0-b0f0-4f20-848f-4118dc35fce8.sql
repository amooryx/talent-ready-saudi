
-- Tighten insert policies: only authenticated users can insert
DROP POLICY IF EXISTS "System insert badges" ON public.student_badges;
CREATE POLICY "Authenticated insert badges" ON public.student_badges FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System insert activities" ON public.activity_feed;
CREATE POLICY "Authenticated insert activities" ON public.activity_feed FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System insert referrals" ON public.referrals;
CREATE POLICY "Authenticated insert referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);
