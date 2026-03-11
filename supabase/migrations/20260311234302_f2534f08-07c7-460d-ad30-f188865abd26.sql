
-- Update recalculate_ers to add score caps per category
CREATE OR REPLACE FUNCTION public.recalculate_ers(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Major-specific weights
  w_academic NUMERIC;
  w_cert NUMERIC;
  w_project NUMERIC;
  w_soft NUMERIC;
  w_conduct NUMERIC;
  v_major_category TEXT;
  -- Score caps
  CAP_CERT CONSTANT NUMERIC := 300;
  CAP_PROJECT CONSTANT NUMERIC := 200;
  CAP_ACADEMIC CONSTANT NUMERIC := 200;
  CAP_CONDUCT CONSTANT NUMERIC := 100;
  CAP_SOFT CONSTANT NUMERIC := 200;
BEGIN
  SELECT * INTO v_sp FROM student_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Determine major category and set weights
  v_major_category := CASE
    WHEN v_sp.major ILIKE ANY(ARRAY['%computer%','%software%','%data science%','%ai%','%machine learning%','%information%','%cybersecurity%','%it%','%programming%'])
      THEN 'tech'
    WHEN v_sp.major ILIKE ANY(ARRAY['%business%','%finance%','%marketing%','%accounting%','%management%','%economics%','%mba%','%commerce%'])
      THEN 'business'
    WHEN v_sp.major ILIKE ANY(ARRAY['%mechanical%','%electrical%','%civil%','%chemical%','%industrial%','%architecture%','%engineering%'])
      THEN 'engineering'
    WHEN v_sp.major ILIKE ANY(ARRAY['%medicine%','%nursing%','%pharmacy%','%dentistry%','%health%','%clinical%','%medical%','%biomedical%'])
      THEN 'medical'
    WHEN v_sp.major ILIKE ANY(ARRAY['%law%','%legal%','%sharia%'])
      THEN 'law'
    WHEN v_sp.major ILIKE ANY(ARRAY['%education%','%teaching%','%pedagogy%'])
      THEN 'education'
    WHEN v_sp.major ILIKE ANY(ARRAY['%design%','%art%','%media%','%communication%','%journalism%','%film%'])
      THEN 'creative'
    ELSE 'general'
  END;

  -- Set weights based on major category
  CASE v_major_category
    WHEN 'tech' THEN
      w_academic := 0.20; w_cert := 0.35; w_project := 0.30; w_soft := 0.05; w_conduct := 0.10;
    WHEN 'business' THEN
      w_academic := 0.20; w_cert := 0.25; w_project := 0.15; w_soft := 0.10; w_conduct := 0.30;
    WHEN 'engineering' THEN
      w_academic := 0.25; w_cert := 0.25; w_project := 0.35; w_soft := 0.05; w_conduct := 0.10;
    WHEN 'medical' THEN
      w_academic := 0.40; w_cert := 0.20; w_project := 0.10; w_soft := 0.05; w_conduct := 0.25;
    WHEN 'law' THEN
      w_academic := 0.35; w_cert := 0.20; w_project := 0.15; w_soft := 0.10; w_conduct := 0.20;
    WHEN 'education' THEN
      w_academic := 0.30; w_cert := 0.20; w_project := 0.15; w_soft := 0.15; w_conduct := 0.20;
    WHEN 'creative' THEN
      w_academic := 0.15; w_cert := 0.15; w_project := 0.40; w_soft := 0.10; w_conduct := 0.20;
    ELSE -- general
      w_academic := 0.40; w_cert := 0.25; w_project := 0.15; w_soft := 0.10; w_conduct := 0.10;
  END CASE;

  -- Calculate academic score from GPA (capped)
  IF v_sp.gpa_scale = '5' THEN
    v_academic := LEAST((COALESCE(v_sp.gpa, 0) / 5.0) * CAP_ACADEMIC, CAP_ACADEMIC);
  ELSE
    v_academic := LEAST((COALESCE(v_sp.gpa, 0) / 4.0) * CAP_ACADEMIC, CAP_ACADEMIC);
  END IF;

  -- Calculate certification score with decay (capped)
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
  v_cert_score := LEAST(v_cert_score, CAP_CERT);

  -- Project score (capped)
  SELECT LEAST(COUNT(*) * 20, CAP_PROJECT) INTO v_project_score
  FROM student_projects WHERE user_id = p_user_id;

  -- Soft skills score (capped)
  SELECT LEAST(COALESCE(AVG(score), 0), CAP_SOFT) INTO v_soft_score
  FROM soft_skill_assessments WHERE user_id = p_user_id;

  -- Conduct score (capped)
  v_conduct := LEAST(COALESCE(v_sp.conduct_score, 100), CAP_CONDUCT);

  -- Cross-sector synergy bonus
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

  -- National readiness bonus
  SELECT CASE WHEN COUNT(*) >= 2 THEN 5 ELSE 0 END INTO v_national
  FROM soft_skill_assessments
  WHERE user_id = p_user_id
    AND skill_name IN ('Professional Arabic Mastery', 'Saudi National History')
    AND score >= 70;

  -- Normalize scores to 0-100 range before applying weights
  v_total := ROUND(
    (v_academic / CAP_ACADEMIC * 100) * w_academic +
    (v_cert_score / CAP_CERT * 100) * w_cert +
    (v_project_score / CAP_PROJECT * 100) * w_project +
    (v_soft_score / CAP_SOFT * 100) * w_soft +
    (v_conduct / CAP_CONDUCT * 100) * w_conduct +
    v_synergy +
    v_national -
    v_decay * 0.25
  );
  v_total := GREATEST(LEAST(v_total, 100), 0);

  -- Get previous score
  SELECT COALESCE(total_score, 0) INTO v_previous
  FROM ers_scores WHERE user_id = p_user_id
  ORDER BY calculated_at DESC LIMIT 1;

  -- Upsert ERS score
  INSERT INTO ers_scores (
    user_id, academic_score, certification_score, project_score,
    soft_skills_score, conduct_score, decay_applied, synergy_bonus,
    national_readiness_bonus, total_score, calculated_at, explanation
  ) VALUES (
    p_user_id, v_academic, v_cert_score, v_project_score,
    v_soft_score, v_conduct, v_decay, v_synergy,
    v_national, v_total, now(),
    jsonb_build_object(
      'major_category', v_major_category,
      'weights', jsonb_build_object('academic', w_academic, 'cert', w_cert, 'project', w_project, 'soft', w_soft, 'conduct', w_conduct),
      'caps', jsonb_build_object('academic', CAP_ACADEMIC, 'cert', CAP_CERT, 'project', CAP_PROJECT, 'soft', CAP_SOFT, 'conduct', CAP_CONDUCT),
      'raw_scores', jsonb_build_object('academic', v_academic, 'cert', v_cert_score, 'project', v_project_score, 'soft', v_soft_score, 'conduct', v_conduct),
      'decay', v_decay,
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

  -- Update student_profiles
  UPDATE student_profiles SET
    academic_score = v_academic,
    certification_score = v_cert_score,
    project_score = v_project_score,
    soft_skills_score = v_soft_score,
    ers_score = v_total,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    p_user_id, 'ers_recalculated', 'ers_scores', p_user_id::text,
    jsonb_build_object(
      'previous_score', v_previous, 'new_score', v_total,
      'major_category', v_major_category,
      'caps_applied', jsonb_build_object('academic', CAP_ACADEMIC, 'cert', CAP_CERT, 'project', CAP_PROJECT, 'soft', CAP_SOFT, 'conduct', CAP_CONDUCT),
      'reason_code', 'auto_trigger', 'timestamp', now()
    )
  );
END;
$function$;
