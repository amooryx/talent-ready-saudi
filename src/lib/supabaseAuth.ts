import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "hr" | "university" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  avatar_url?: string;
}

// ===== SIGN UP =====
interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
  // Student-specific
  university?: string;
  major?: string;
  gpa?: number;
  gpa_scale?: "4" | "5";
  nationality?: string;
  // HR-specific
  company_name?: string;
  position?: string;
  industry?: string;
  // University-specific
  university_name?: string;
  official_domain?: string;
  admin_contact?: string;
}

export async function signUp(data: SignUpData) {
  // Validate password strength
  const pwError = validatePassword(data.password);
  if (pwError) return { success: false, error: pwError };

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: data.full_name,
        role: data.role,
        university: data.university,
        major: data.major,
        gpa: data.gpa?.toString(),
        gpa_scale: data.gpa_scale,
        company_name: data.company_name,
        position: data.position,
        industry: data.industry,
        university_name: data.university_name,
        official_domain: data.official_domain,
        admin_contact: data.admin_contact,
      },
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: authData.user };
}

// ===== SIGN IN =====
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false as const, error: error.message };
  
  // Fetch role from user_roles table (server-side truth)
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  const role = (roleData?.role as AppRole) || "student";
  
  return { success: true as const, user: { ...data.user, role } };
}

// ===== SIGN OUT =====
export async function signOut() {
  await supabase.auth.signOut();
}

// ===== GET CURRENT USER WITH ROLE =====
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("user_id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email || "",
    full_name: profile?.full_name || user.user_metadata?.full_name || "",
    role: (roleData?.role as AppRole) || "student",
    avatar_url: profile?.avatar_url || undefined,
  };
}

// ===== PASSWORD VALIDATION =====
export function validatePassword(password: string): string | null {
  if (password.length < 12) return "Password must be at least 12 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain a special character.";
  return null;
}

// ===== RESET PASSWORD =====
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ===== UPDATE PASSWORD =====
export async function updatePassword(newPassword: string) {
  const pwError = validatePassword(newPassword);
  if (pwError) return { success: false, error: pwError };
  
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Dashboard path helper
export function getDashboardPath(role: AppRole): string {
  switch (role) {
    case "student": return "/student";
    case "hr": return "/hr";
    case "university":
    case "admin": return "/admin";
  }
}
