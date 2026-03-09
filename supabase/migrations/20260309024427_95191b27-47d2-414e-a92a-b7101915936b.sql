
DROP TRIGGER IF EXISTS trg_ers_cert_change ON public.student_certifications;
DROP TRIGGER IF EXISTS trg_ers_project_change ON public.student_projects;
DROP TRIGGER IF EXISTS trg_ers_endorsement ON public.endorsements;
DROP TRIGGER IF EXISTS trg_ers_assessment ON public.soft_skill_assessments;

CREATE TRIGGER trg_ers_cert_change AFTER INSERT OR UPDATE OR DELETE ON public.student_certifications
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_cert_change();

CREATE TRIGGER trg_ers_project_change AFTER INSERT OR UPDATE OR DELETE ON public.student_projects
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_project_change();

CREATE TRIGGER trg_ers_endorsement AFTER INSERT ON public.endorsements
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_endorsement();

CREATE TRIGGER trg_ers_assessment AFTER INSERT OR UPDATE OR DELETE ON public.soft_skill_assessments
  FOR EACH ROW EXECUTE FUNCTION trigger_ers_on_assessment();
