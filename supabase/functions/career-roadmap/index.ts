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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { career_target } = body;
    if (!career_target) {
      return new Response(JSON.stringify({ error: "career_target required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      { data: roles },
      { data: certMappings },
      { data: skillOntology },
    ] = await Promise.all([
      adminClient.from("student_profiles").select("*").eq("user_id", user.id).single(),
      adminClient.from("skill_matrix").select("*").eq("user_id", user.id),
      adminClient.from("student_certifications").select("*, certification_catalog(name, weight, category, sector)").eq("user_id", user.id),
      adminClient.from("student_projects").select("*").eq("user_id", user.id),
      adminClient.from("market_skill_demand").select("*").order("demand_score", { ascending: false }).limit(50),
      adminClient.from("market_cert_demand").select("*").order("demand_score", { ascending: false }).limit(30),
      adminClient.from("market_role_taxonomy").select("*"),
      adminClient.from("skill_cert_mapping").select("*").order("relevance_score", { ascending: false }),
      adminClient.from("skill_ontology").select("id, skill_name, skill_category, sector, parent_skill_id").limit(100),
    ]);

    // Build skill→cert recommendation context
    const skillCertContext = (certMappings || []).slice(0, 40).map((m: any) =>
      `${m.skill_name} → ${m.cert_name} (relevance: ${m.relevance_score}%)`
    ).join(", ");

    // Build skill ontology hierarchy context
    const parentSkills = (skillOntology || []).filter((s: any) => !s.parent_skill_id);
    const ontologyContext = parentSkills.map((p: any) => {
      const children = (skillOntology || []).filter((c: any) => c.parent_skill_id === p.id);
      return `${p.skill_name}: ${children.map((c: any) => c.skill_name).join(", ")}`;
    }).join(" | ");

    const studentSkills = (skills || []).map((s: any) => s.skill_name).join(", ") || "None";
    const studentCerts = (certs || []).map((c: any) => c.certification_catalog?.name || c.custom_name).filter(Boolean).join(", ") || "None";
    const projectCount = (projects || []).length;

    const topSkillsSummary = (topSkills || []).slice(0, 20).map((s: any) =>
      `${s.skill_name} (demand: ${s.demand_score}, trend: ${s.trend})`
    ).join(", ");

    const topCertsSummary = (topCerts || []).slice(0, 15).map((c: any) =>
      `${c.cert_name} (demand: ${c.demand_score}, ERS: ${c.ers_points}, difficulty: ${c.difficulty_level}, trend: ${c.trend})`
    ).join(", ");

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a Saudi career intelligence advisor. Generate a personalized career roadmap using REAL market demand data. You must also recommend the TOP 3 best-fit career paths for this student based on their profile. Return ONLY valid JSON:
{
  "career_target": "string",
  "market_demand": "high|medium|low",
  "readiness_score": number (0-100),
  "top_career_fits": [{"career": "string", "confidence": number (0-100), "reason": "string"}],
  "skill_gaps": [{"skill": "string", "market_demand_score": number, "priority": "critical|important|nice_to_have", "action": "string"}],
  "recommended_certifications": [{"name": "string", "ers_points": number, "difficulty": "string", "market_demand": number, "reason": "string", "provider": "string"}],
  "recommended_projects": [{"title": "string", "description": "string", "skills_gained": ["string"], "estimated_time": "string"}],
  "roadmap_steps": [{"step": number, "action": "string", "timeline": "string", "impact": "string", "ers_gain": number}],
  "competing_candidates": "string (estimate of how many students target this role)",
  "salary_outlook": "string",
  "vision_2030_alignment": ["string"]
}`,
            },
            {
              role: "user",
              content: `Career Target: ${career_target}
Student Major: ${studentProfile?.major || "Unknown"}
University: ${studentProfile?.university || "Unknown"}
GPA: ${studentProfile?.gpa || 0}/${studentProfile?.gpa_scale === "5" ? "5.0" : "4.0"}
Current Skills: ${studentSkills}
Current Certifications: ${studentCerts}
Projects Count: ${projectCount}
Current ERS: ${studentProfile?.ers_score || 0}

REAL Market Demand Data (from Saudi job postings):
Top Skills in Demand: ${topSkillsSummary || "No data yet"}
Top Certifications in Demand: ${topCertsSummary || "No data yet"}
Available Roles: ${(roles || []).map((r: any) => r.role_name).join(", ") || "No data yet"}

Skill → Certification Mappings (verified recommendations):
${skillCertContext || "No mappings yet"}

Skill Ontology (domain → sub-skills):
${ontologyContext || "No ontology yet"}

Generate a roadmap that prioritizes high-demand skills and certifications with the best ERS return. Use the skill→cert mappings to recommend specific certifications for each skill gap. Include top_career_fits with the 3 best career paths for this student based on their profile, skills and market demand. Be specific to Saudi market. Reference providers like Tuwaiq Academy, Misk, SAFCSP, Coursera, Udemy where relevant.`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      details: { career_target, readiness_score: roadmap.readiness_score },
    });

    return new Response(JSON.stringify({ success: true, roadmap }), {
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
