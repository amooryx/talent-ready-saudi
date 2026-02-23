
-- Fix: Tighten audit log insert to require user_id matches authenticated user
DROP POLICY "System insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated insert own audit logs" ON public.audit_logs 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());
