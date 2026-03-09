
-- Login attempts tracking for account lockout
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) and admins can read
CREATE POLICY "Admins read login attempts"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous inserts (login happens before auth)
CREATE POLICY "Anyone can insert login attempts"
  ON public.login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Auto-cleanup old attempts (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - interval '30 days';
$$;

-- Function to check if account is locked (5 failures in 15 min)
CREATE OR REPLACE FUNCTION public.check_account_locked(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count int;
  v_oldest timestamptz;
  v_lockout_until timestamptz;
BEGIN
  SELECT COUNT(*), MIN(attempted_at)
  INTO v_count, v_oldest
  FROM public.login_attempts
  WHERE email = lower(p_email)
    AND success = false
    AND attempted_at > now() - interval '15 minutes';

  IF v_count >= 5 THEN
    v_lockout_until := v_oldest + interval '15 minutes';
    RETURN jsonb_build_object('locked', true, 'until', v_lockout_until, 'attempts', v_count);
  END IF;

  RETURN jsonb_build_object('locked', false, 'attempts', v_count);
END;
$$;

-- Function to record a login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text, p_success boolean, p_ip text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, ip_address)
  VALUES (lower(p_email), p_success, p_ip);

  -- If successful, clear recent failures for this email
  IF p_success THEN
    DELETE FROM public.login_attempts
    WHERE email = lower(p_email) AND success = false;
  END IF;

  -- Periodic cleanup
  PERFORM public.cleanup_old_login_attempts();
END;
$$;
