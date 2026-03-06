import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_ACCOUNTS = [
  {
    email: "abdullah@ksu.edu.sa",
    password: "Student@12345!",
    role: "student",
    full_name: "Abdullah Al-Rashid",
    university: "King Saud University",
    major: "Computer Science",
    gpa: "3.75",
    gpa_scale: "4",
    nationality: "Saudi",
  },
  {
    email: "reem@pnu.edu.sa",
    password: "Student@12345!",
    role: "student",
    full_name: "Reem Al-Dosari",
    university: "Princess Nourah bint Abdulrahman University",
    major: "Nursing",
    gpa: "4.20",
    gpa_scale: "5",
    nationality: "Saudi",
  },
  {
    email: "sara@kau.edu.sa",
    password: "Student@12345!",
    role: "student",
    full_name: "Sara Al-Ghamdi",
    university: "King Abdulaziz University",
    major: "Law (LLB)",
    gpa: "3.90",
    gpa_scale: "4",
    nationality: "Saudi",
  },
  {
    email: "hr@aramco.com",
    password: "Company@12345!",
    role: "hr",
    full_name: "Mohammed Al-Harbi",
    company_name: "Saudi Aramco",
    position: "Talent Acquisition Manager",
    industry: "Energy",
  },
  {
    email: "talent@stc.com.sa",
    password: "Company@12345!",
    role: "hr",
    full_name: "Nora Al-Otaibi",
    company_name: "STC",
    position: "HR Director",
    industry: "Telecommunications",
  },
  {
    email: "admin@ksu.edu.sa",
    password: "University@2026!",
    role: "university",
    full_name: "Dr. Khalid Al-Mutairi",
    university_name: "King Saud University",
    official_domain: "ksu.edu.sa",
    admin_contact: "+966-11-467-0000",
  },
  {
    email: "admin@hireqimah.com",
    password: "PlatformAdmin@2026!",
    role: "admin",
    full_name: "HireQimah Platform Admin",
  },
  {
    email: "demo@hireqimah.com",
    password: "DemoAccess@2026!",
    role: "admin",
    full_name: "Demo Admin Account",
  },
];

async function syncAccountData(adminClient: any, userId: string, account: (typeof DEMO_ACCOUNTS)[number]) {
  const { email, role, full_name, ...metadata } = account;

  const upsertByUserId = async (table: string, payload: Record<string, unknown>) => {
    const { data: existing, error: existingError } = await adminClient
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") return existingError.message;

    if (existing) {
      const { error } = await adminClient.from(table).update(payload).eq("user_id", userId);
      return error ? error.message : null;
    }

    const { error } = await adminClient.from(table).insert({ user_id: userId, ...payload });
    return error ? error.message : null;
  };

  const profileError = await upsertByUserId("profiles", {
    full_name,
    email,
    nationality: (metadata as any).nationality ?? "Saudi",
  });
  if (profileError) return `profiles: ${profileError}`;

  const { error: deleteRolesError } = await adminClient.from("user_roles").delete().eq("user_id", userId);
  if (deleteRolesError) return `user_roles(delete): ${deleteRolesError.message}`;

  const { error: insertRoleError } = await adminClient.from("user_roles").insert({ user_id: userId, role });
  if (insertRoleError) return `user_roles(insert): ${insertRoleError.message}`;

  if (role === "student") {
    const studentError = await upsertByUserId("student_profiles", {
      university: (metadata as any).university ?? "",
      major: (metadata as any).major ?? "",
      gpa: Number.parseFloat((metadata as any).gpa ?? "0") || 0,
      gpa_scale: (metadata as any).gpa_scale === "5" ? "5" : "4",
      onboarding_completed: false,
      onboarding_progress: 0,
    });
    if (studentError) return `student_profiles: ${studentError}`;
  }

  if (role === "hr") {
    const hrError = await upsertByUserId("hr_profiles", {
      company_name: (metadata as any).company_name ?? "",
      position: (metadata as any).position ?? "",
      industry: (metadata as any).industry ?? "",
    });
    if (hrError) return `hr_profiles: ${hrError}`;
  }

  if (role === "university") {
    const uniError = await upsertByUserId("university_profiles", {
      university_name: (metadata as any).university_name ?? "",
      official_domain: (metadata as any).official_domain ?? "",
      admin_contact: (metadata as any).admin_contact ?? "",
    });
    if (uniError) return `university_profiles: ${uniError}`;
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; status: string; error?: string }[] = [];

    const { data: listedUsers, error: listUsersError } = await adminClient.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const usersByEmail = new Map((listedUsers?.users ?? []).map((u) => [u.email?.toLowerCase(), u]));

    for (const account of DEMO_ACCOUNTS) {
      const { email, password, full_name, role, ...metadata } = account;
      const userMetadata = { full_name, role, ...metadata };
      const normalizedEmail = email.toLowerCase();
      const existingUser = usersByEmail.get(normalizedEmail);

      let userId: string | null = null;
      let status: "created" | "updated" = "created";

      if (existingUser?.id) {
        status = "updated";
        const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: userMetadata,
        });

        if (updateError) {
          results.push({ email, status: "error", error: updateError.message });
          continue;
        }

        userId = updated.user?.id ?? existingUser.id;
      } else {
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: userMetadata,
        });

        if (createError) {
          results.push({ email, status: "error", error: createError.message });
          continue;
        }

        userId = created.user?.id ?? null;
        if (created.user?.email) {
          usersByEmail.set(created.user.email.toLowerCase(), created.user);
        }
      }

      if (!userId) {
        results.push({ email, status: "error", error: "User ID missing after create/update" });
        continue;
      }

      const syncError = await syncAccountData(adminClient, userId, account);
      if (syncError) {
        results.push({ email, status: "sync_error", error: syncError });
        continue;
      }

      results.push({ email, status });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
