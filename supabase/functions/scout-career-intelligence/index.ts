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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { career_target, user_id } = body;

    if (!career_target || !user_id) {
      return new Response(
        JSON.stringify({ error: "career_target and user_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Fetch student profile and skills
    const [{ data: studentProfile }, { data: skills }, { data: majors }, { data: jobs }] =
      await Promise.all([
        adminClient
          .from("student_profiles")
          .select("*")
          .eq("user_id", user_id)
          .single(),
        adminClient
          .from("skill_matrix")
          .select("skill_name, proficiency_level, verified")
          .eq("user_id", user_id),
        adminClient.from("majors_repository").select("*"),
        adminClient
          .from("job_cache")
          .select("*")
          .order("fetched_at", { ascending: false })
          .limit(100),
      ]);

    // Step 2: Call Lovable AI for career intelligence analysis
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
              content: `You are a Saudi labor market career intelligence analyst. Analyze the student's profile against the career target and available job market data. Return ONLY valid JSON with this exact structure:
{
  "career_target": "string",
  "market_demand_level": "high|medium|low",
  "compatibility_score": number (0-100),
  "top_matching_majors": [{"name": "string", "compatibility": number, "reason": "string"}],
  "skill_gaps": [{"skill": "string", "priority": "critical|important|nice_to_have", "current_level": "string", "required_level": "string"}],
  "recommended_certifications": [{"name": "string", "provider": "string", "relevance_score": number, "is_hadaf_eligible": boolean}],
  "recommended_providers": ["string"],
  "roadmap_steps": [{"step": number, "action": "string", "timeline": "string", "impact": "string"}],
  "vision_2030_alignment": ["string"],
  "sector_insights": {"demand_trend": "string", "salary_range": "string", "top_employers": ["string"]}
}`,
            },
            {
              role: "user",
              content: `Career Target: ${career_target}
Student Major: ${studentProfile?.major || "Unknown"}
University: ${studentProfile?.university || "Unknown"}
GPA: ${studentProfile?.gpa || 0}/${studentProfile?.gpa_scale === "5" ? "5.0" : "4.0"}
Current Skills: ${(skills || []).map((s: any) => `${s.skill_name} (${s.proficiency_level}${s.verified ? ", verified" : ""})`).join(", ") || "None"}
Available Majors in Saudi: ${(majors || []).slice(0, 30).map((m: any) => `${m.name} (${m.sector})`).join(", ")}
Recent Job Postings: ${(jobs || []).slice(0, 20).map((j: any) => `${j.title} at ${j.company || "Company"} - Skills: ${(j.required_skills || []).join(", ")}`).join(" | ")}

Analyze this student's readiness for the target career. Be specific to the Saudi market. Reference providers like Tuwaiq Academy, Misk Foundation, SAFCSP, Health Academy where relevant.`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed", details: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const analysisText =
      aiData.choices?.[0]?.message?.content || "{}";

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = { raw: analysisText, parse_error: true };
    }

    // Step 3: Log execution
    await adminClient.from("audit_logs").insert({
      user_id,
      action: "scout_analysis",
      resource_type: "career_intelligence",
      resource_id: career_target,
      details: {
        career_target,
        compatibility_score: analysis.compatibility_score,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ success: true, analysis }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Scout+ error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
