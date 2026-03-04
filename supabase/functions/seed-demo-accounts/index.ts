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
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; status: string; error?: string }[] = [];

    for (const account of DEMO_ACCOUNTS) {
      const { email, password, role, full_name, ...metadata } = account;

      // Check if user already exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const exists = existingUsers?.users?.find((u) => u.email === email);

      if (exists) {
        results.push({ email, status: "already_exists" });
        continue;
      }

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role, ...metadata },
      });

      if (error) {
        results.push({ email, status: "error", error: error.message });
      } else {
        results.push({ email, status: "created" });
      }
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
