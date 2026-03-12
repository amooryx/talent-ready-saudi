import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { career_target } = body;
    if (!career_target) {
      return new Response(JSON.stringify({ error: "career_target required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all relevant data in parallel
    const [
      { data: studentProfile },
      { data: skills },
      { data: certs },
      { data: projects },
      { data: topSkills },
      { data: topCerts },
      { data: roleDemand },
      { data: certMappings },
      { data: skillOntology },
      { data: recentJobs },
      { data: demandHistory },
    ] = await Promise.all([
      adminClient.from("student_profiles").select("*").eq("user_id", user.id).single(),
      adminClient.from("skill_matrix").select("*").eq("user_id", user.id),
      adminClient.from("student_certifications").select("*, certification_catalog(name, weight, category, sector)").eq("user_id", user.id),
      adminClient.from("student_projects").select("*").eq("user_id", user.id),
      adminClient.from("market_skill_demand").select("*").order("demand_score", { ascending: false }).limit(50),
      adminClient.from("market_cert_demand").select("*").order("demand_score", { ascending: false }).limit(30),
      adminClient.from("market_role_demand").select("*").order("demand_score", { ascending: false }).limit(30),
      adminClient.from("skill_cert_mapping").select("*").order("relevance_score", { ascending: false }),
      adminClient.from("skill_ontology").select("id, skill_name, skill_category, sector, parent_skill_id").limit(100),
      adminClient.from("job_cache").select("title, company, required_skills, required_certifications, sector, location, raw_data").order("fetched_at", { ascending: false }).limit(150),
      adminClient.from("demand_history").select("*").order("snapshot_date", { ascending: false }).limit(100),
    ]);

    // Build context strings
    const skillCertContext = (certMappings || []).slice(0, 40).map((m: any) =>
      `${m.skill_name} → ${m.cert_name} (relevance: ${m.relevance_score}%)`
    ).join(", ");

    const parentSkills = (skillOntology || []).filter((s: any) => !s.parent_skill_id);
    const ontologyContext = parentSkills.map((p: any) => {
      const children = (skillOntology || []).filter((c: any) => c.parent_skill_id === p.id);
      return `${p.skill_name}: ${children.map((c: any) => c.skill_name).join(", ")}`;
    }).join(" | ");

    const studentSkills = (skills || []).map((s: any) => s.skill_name).join(", ") || "None";
    const studentCerts = (certs || []).map((c: any) => c.certification_catalog?.name || c.custom_name).filter(Boolean).join(", ") || "None";
    const projectDescriptions = (projects || []).map((p: any) => `${p.title}: ${p.description || 'No description'}`).join("; ") || "None";

    const topSkillsSummary = (topSkills || []).slice(0, 25).map((s: any) =>
      `${s.skill_name} (demand: ${s.demand_score}, trend: ${s.trend}, weekly: ${s.weekly_change || 0}%, monthly: ${s.monthly_change || 0}%)`
    ).join(", ");

    const topCertsSummary = (topCerts || []).slice(0, 15).map((c: any) =>
      `${c.cert_name} (demand: ${c.demand_score}, ERS: ${c.ers_points}, difficulty: ${c.difficulty_level}, trend: ${c.trend})`
    ).join(", ");

    // Role demand context from clustered roles
    const roleDemandContext = (roleDemand || []).map((r: any) =>
      `${r.role_name} [${r.role_category}]: ${r.job_count} jobs, demand=${r.demand_score}, skills=[${(r.top_required_skills || []).join(",")}], certs=[${(r.top_certifications || []).join(",")}], companies=${r.company_diversity}, salary=${r.salary_range || "N/A"}, stability=${r.market_stability}`
    ).join("\n");

    // Recent jobs summary (100+ jobs)
    const jobsSummary = (recentJobs || []).slice(0, 120).map((j: any) =>
      `${j.title} @ ${j.company} | ${(j.required_skills || []).slice(0, 5).join(",")} | ${j.sector}`
    ).join("\n");

    const jobCount = (recentJobs || []).length;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a Saudi career intelligence advisor. You have analyzed ${jobCount} real job postings from the Saudi market. Generate a comprehensive career analysis. Return ONLY valid JSON:
{
  "career_target": "string",
  "market_demand": "high|medium|low",
  "readiness_score": number (0-100),
  "jobs_analyzed": number,
  "top_career_matches": [{"rank": number, "career": "string", "match_score": number (0-100), "job_count": number, "demand_score": number, "top_skills": ["string"], "top_certs": ["string"], "companies_hiring": ["string"], "salary_range": "string", "market_stability": "high_growth|stable|declining", "weekly_change": number, "monthly_change": number, "reason": "string"}],
  "skill_gaps": [{"skill": "string", "domain": "string", "market_demand_score": number, "priority": "critical|important|optional", "action": "string", "weekly_trend": number, "monthly_trend": number}],
  "recommended_certifications": [{"name": "string", "ers_points": number, "difficulty": "string", "market_demand": number, "reason": "string", "provider": "string"}],
  "recommended_projects": [{"title": "string", "description": "string", "skills_gained": ["string"], "estimated_time": "string"}],
  "roadmap_steps": [{"step": number, "action": "string", "timeline": "string", "impact": "string", "ers_gain": number}],
  "competing_candidates": "string",
  "salary_outlook": "string",
  "vision_2030_alignment": ["string"]
}

IMPORTANT:
- top_career_matches MUST have exactly 10 entries ranked by match_score
- Use skill ontology hierarchy to group skill_gaps by domain (critical/important/optional)
- Match student against ALL clustered roles, not just the career_target
- weekly_change and monthly_change are percentage changes in demand`,
          },
          {
            role: "user",
            content: `Career Target: ${career_target}
Student Major: ${studentProfile?.major || "Unknown"}
University: ${studentProfile?.university || "Unknown"}
GPA: ${studentProfile?.gpa || 0}/${studentProfile?.gpa_scale === "5" ? "5.0" : "4.0"}
Current Skills: ${studentSkills}
Current Certifications: ${studentCerts}
Projects: ${projectDescriptions}
Current ERS: ${studentProfile?.ers_score || 0}

REAL MARKET DATA (${jobCount} jobs analyzed):

Clustered Career Roles from Real Jobs:
${roleDemandContext || "No clustered data yet"}

Top Skills in Demand:
${topSkillsSummary || "No data yet"}

Top Certifications in Demand:
${topCertsSummary || "No data yet"}

Skill → Certification Mappings:
${skillCertContext || "No mappings yet"}

Skill Ontology (domain → sub-skills):
${ontologyContext || "No ontology yet"}

Recent Job Postings Sample:
${jobsSummary || "No jobs yet"}

Generate:
1. Top 10 career matches ranked by match_score using skills overlap, certifications, projects, and market demand
2. Skill gaps grouped by domain using ontology hierarchy (critical/important/optional)
3. Market trend indicators (weekly/monthly change) for each career and skill
4. Personalized roadmap. Be specific to Saudi market. Reference Tuwaiq Academy, Misk, SAFCSP, Coursera, Udemy where relevant.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    let roadmap;
    try {
      roadmap = JSON.parse(content);
    } catch {
      roadmap = { raw: content, parse_error: true };
    }

    // Update student career target
    await adminClient.from("student_profiles").update({
      career_target,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    // Audit
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action: "career_roadmap_generated",
      resource_type: "career_roadmap",
      resource_id: career_target,
      details: { career_target, readiness_score: roadmap.readiness_score, jobs_analyzed: jobCount },
    });

    return new Response(JSON.stringify({ success: true, roadmap, jobs_analyzed: jobCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Career roadmap error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
