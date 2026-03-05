-- ERS auto-recalculation function
CREATE OR REPLACE FUNCTION public.recalculate_ers(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sp student_profiles%ROWTYPE;
  v_cert_score NUMERIC := 0;
  v_project_score NUMERIC := 0;
  v_soft_score NUMERIC := 0;
  v_decay NUMERIC := 0;
  v_synergy NUMERIC := 0;
  v_national NUMERIC := 0;
  v_academic NUMERIC := 0;
  v_conduct NUMERIC := 0;
  v_total NUMERIC := 0;
  v_previous NUMERIC := 0;
  v_cert RECORD;
  v_sectors TEXT[];
  v_syn RECORD;
BEGIN
  SELECT * INTO v_sp FROM student_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_sp.gpa_scale = '5' THEN
    v_academic := LEAST((COALESCE(v_sp.gpa, 0) / 5.0) * 100, 100);
  ELSE
    v_academic := LEAST((COALESCE(v_sp.gpa, 0) / 4.0) * 100, 100);
  END IF;

  FOR v_cert IN
    SELECT cc.weight, cc.is_volatile, cc.decay_rate_annual, cc.sector,
           sc.uploaded_at, sc.verified
    FROM student_certifications sc
    LEFT JOIN certification_catalog cc ON cc.id = sc.certification_id
    WHERE sc.user_id = p_user_id
  LOOP
    IF v_cert.verified THEN
      DECLARE
        cert_value NUMERIC := COALESCE(v_cert.weight, 10);
        age_years NUMERIC;
      BEGIN
        age_years := EXTRACT(EPOCH FROM (now() - v_cert.uploaded_at)) / (365.25 * 86400);
        IF COALESCE(v_cert.is_volatile, false) AND age_years > 0 THEN
          cert_value := cert_value * POWER(1.0 - COALESCE(v_cert.decay_rate_annual, 0.15), age_years);
          v_decay := v_decay + (COALESCE(v_cert.weight, 10) - cert_value);
        END IF;
        v_cert_score := v_cert_score + cert_value;
        IF v_cert.sector IS NOT NULL THEN
          v_sectors := array_append(COALESCE(v_sectors, ARRAY[]::TEXT[]), v_cert.sector);
        END IF;
      END;
    END IF;
  END LOOP;
  v_cert_score := LEAST(v_cert_score, 100);

  SELECT LEAST(COUNT(*) * 20, 100) INTO v_project_score
  FROM student_projects WHERE user_id = p_user_id;

  SELECT COALESCE(AVG(score), 0) INTO v_soft_score
  FROM soft_skill_assessments WHERE user_id = p_user_id;

  v_conduct := COALESCE(v_sp.conduct_score, 100);

  IF v_sectors IS NOT NULL AND array_length(v_sectors, 1) > 1 THEN
    FOR v_syn IN
      SELECT COALESCE(bonus_percentage, 5) as bonus
      FROM synergy_mappings
      WHERE sector_a = ANY(v_sectors) AND sector_b = ANY(v_sectors)
         AND sector_a <> sector_b
      LIMIT 1
    LOOP
      v_synergy := v_syn.bonus;
    END LOOP;
  END IF;

  SELECT CASE WHEN COUNT(*) >= 2 THEN 5 ELSE 0 END INTO v_national
  FROM soft_skill_assessments
  WHERE user_id = p_user_id
    AND skill_name IN ('Professional Arabic Mastery', 'Saudi National History')
    AND score >= 70;

  v_total := ROUND(
    v_academic * 0.4 +
    v_cert_score * 0.25 +
    v_project_score * 0.15 +
    v_soft_score * 0.1 +
    v_conduct * 0.1 +
    v_synergy +
    v_national -
    v_decay * 0.25
  );
  v_total := GREATEST(LEAST(v_total, 100), 0);

  SELECT COALESCE(total_score, 0) INTO v_previous
  FROM ers_scores WHERE user_id = p_user_id
  ORDER BY calculated_at DESC LIMIT 1;

  INSERT INTO ers_scores (
    user_id, academic_score, certification_score, project_score,
    soft_skills_score, conduct_score, decay_applied, synergy_bonus,
    national_readiness_bonus, total_score, calculated_at, explanation
  ) VALUES (
    p_user_id, v_academic, v_cert_score, v_project_score,
    v_soft_score, v_conduct, v_decay, v_synergy,
    v_national, v_total, now(),
    jsonb_build_object(
      'academic_raw', v_academic, 'cert_raw', v_cert_score,
      'project_raw', v_project_score, 'soft_raw', v_soft_score,
      'conduct_raw', v_conduct, 'decay', v_decay,
      'synergy', v_synergy, 'national', v_national
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    academic_score = EXCLUDED.academic_score,
    certification_score = EXCLUDED.certification_score,
    project_score = EXCLUDED.project_score,
    soft_skills_score = EXCLUDED.soft_skills_score,
    conduct_score = EXCLUDED.conduct_score,
    decay_applied = EXCLUDED.decay_applied,
    synergy_bonus = EXCLUDED.synergy_bonus,
    national_readiness_bonus = EXCLUDED.national_readiness_bonus,
    total_score = EXCLUDED.total_score,
    calculated_at = now(),
    explanation = EXCLUDED.explanation;

  UPDATE student_profiles SET
    academic_score = v_academic,
    certification_score = v_cert_score,
    project_score = v_project_score,
    soft_skills_score = v_soft_score,
    ers_score = v_total,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    p_user_id, 'ers_recalculated', 'ers_scores', p_user_id::text,
    jsonb_build_object(
      'previous_score', v_previous, 'new_score', v_total,
      'reason_code', 'auto_trigger', 'timestamp', now()
    )
  );
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ers_scores_user_id_unique'
  ) THEN
    ALTER TABLE ers_scores ADD CONSTRAINT ers_scores_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_ers_on_cert_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM recalculate_ers(OLD.user_id); RETURN OLD;
  ELSE PERFORM recalculate_ers(NEW.user_id); RETURN NEW; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.trigger_ers_on_project_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM recalculate_ers(OLD.user_id); RETURN OLD;
  ELSE PERFORM recalculate_ers(NEW.user_id); RETURN NEW; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.trigger_ers_on_endorsement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN PERFORM recalculate_ers(NEW.student_user_id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trigger_ers_on_assessment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM recalculate_ers(OLD.user_id); RETURN OLD;
  ELSE PERFORM recalculate_ers(NEW.user_id); RETURN NEW; END IF;
END; $$;

DROP TRIGGER IF EXISTS trg_ers_cert_change ON student_certifications;
CREATE TRIGGER trg_ers_cert_change
  AFTER INSERT OR UPDATE OR DELETE ON student_certifications
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_cert_change();

DROP TRIGGER IF EXISTS trg_ers_project_change ON student_projects;
CREATE TRIGGER trg_ers_project_change
  AFTER INSERT OR UPDATE OR DELETE ON student_projects
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_project_change();

DROP TRIGGER IF EXISTS trg_ers_endorsement ON endorsements;
CREATE TRIGGER trg_ers_endorsement
  AFTER INSERT ON endorsements
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_endorsement();

DROP TRIGGER IF EXISTS trg_ers_assessment ON soft_skill_assessments;
CREATE TRIGGER trg_ers_assessment
  AFTER INSERT OR UPDATE OR DELETE ON soft_skill_assessments
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_assessment();

-- Storage RLS for documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Students upload own documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Students upload own documents"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Students read own documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Students read own documents"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins read all documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Admins read all documents"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;