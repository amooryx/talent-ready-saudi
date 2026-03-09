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
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth check - must be admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create refresh log entry
    const { data: refreshLog } = await admin.from("market_refresh_log").insert({
      triggered_by: user.id,
      status: "running",
    }).select().single();

    const refreshId = refreshLog?.id;

    // Step 1: Fetch unanalyzed jobs from job_cache
    const { data: jobs } = await admin
      .from("job_cache")
      .select("*")
      .order("fetched_at", { ascending: false })
      .limit(200);

    if (!jobs || jobs.length === 0) {
      await admin.from("market_refresh_log").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        jobs_analyzed: 0,
      }).eq("id", refreshId);

      return new Response(JSON.stringify({ success: true, message: "No jobs to analyze" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Batch job descriptions for AI analysis (groups of 10)
    const batchSize = 10;
    const allAnalyses: any[] = [];
    let errors = 0;

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const jobSummaries = batch.map((j, idx) => 
        `[JOB ${idx + 1}] Title: ${j.title}\nCompany: ${j.company || "N/A"}\nSector: ${j.sector || "N/A"}\nLocation: ${j.location || "Saudi Arabia"}\nExperience: ${j.experience_level || "N/A"}\nRequired Skills: ${(j.required_skills || []).join(", ") || "N/A"}\nRequired Certs: ${(j.required_certifications || []).join(", ") || "N/A"}`
      ).join("\n\n");

      try {
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
              temperature: 0.1,
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: `You are a Saudi labor market intelligence analyst. Analyze each job posting and extract structured data. Return ONLY valid JSON with this structure:
{
  "jobs": [
    {
      "job_index": number,
      "detected_role": "string (normalized role title, e.g. 'Software Engineer', 'Penetration Tester', 'Data Analyst')",
      "role_category": "string (tech|business|engineering|medical|creative|legal|education|general)",
      "technical_skills": ["string"],
      "soft_skills": ["string"],
      "certifications": [{"name": "string", "normalized_name": "string", "difficulty": "entry|intermediate|advanced"}],
      "experience_level": "entry|mid|senior",
      "salary_range": "string or null",
      "confidence": number (0-100)
    }
  ]
}

Rules:
- Normalize role names (e.g. "Ethical Hacker" → "Penetration Tester")
- Normalize cert names (e.g. "Offensive Security Certified Professional" → "OSCP")
- Extract ALL skills mentioned, including implicit ones
- Be specific to Saudi market context
- If job is unclear, set confidence low`,
                },
                {
                  role: "user",
                  content: `Analyze these ${batch.length} Saudi job postings:\n\n${jobSummaries}`,
                },
              ],
            }),
          }
        );

        if (!aiResponse.ok) {
          console.error(`AI batch ${i / batchSize} failed:`, await aiResponse.text());
          errors++;
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "{}";
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch {
          console.error("Failed to parse AI response for batch", i / batchSize);
          errors++;
          continue;
        }

        if (parsed.jobs && Array.isArray(parsed.jobs)) {
          for (const analysis of parsed.jobs) {
            const jobIdx = (analysis.job_index || 1) - 1;
            const job = batch[jobIdx];
            if (!job) continue;

            allAnalyses.push({
              job_cache_id: job.id,
              detected_role: analysis.detected_role,
              extracted_skills: analysis.technical_skills || [],
              extracted_certifications: (analysis.certifications || []).map((c: any) => c.normalized_name || c.name),
              extracted_soft_skills: analysis.soft_skills || [],
              experience_level: analysis.experience_level,
              salary_range: analysis.salary_range,
              confidence_score: analysis.confidence || 50,
              raw_analysis: analysis,
            });
          }
        }
      } catch (err) {
        console.error(`Batch ${i / batchSize} error:`, err);
        errors++;
      }
    }

    // Step 3: Upsert job analysis results
    if (allAnalyses.length > 0) {
      await admin.from("job_analysis_results").upsert(allAnalyses, {
        onConflict: "job_cache_id",
      });
    }

    // Step 4: Aggregate skill demand
    const skillMap = new Map<string, { mentions: number; companies: Set<string>; recent: number; sectors: Set<string> }>();
    const certMap = new Map<string, { mentions: number; companies: Set<string>; recent: number; sectors: Set<string>; difficulty: string }>();
    const roleMap = new Map<string, { count: number; category: string }>();

    for (let i = 0; i < allAnalyses.length; i++) {
      const a = allAnalyses[i];
      const job = jobs.find(j => j.id === a.job_cache_id);
      const company = job?.company || "Unknown";
      const sector = job?.sector || "general";
      const isRecent = job ? (Date.now() - new Date(job.fetched_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

      // Skills
      for (const skill of (a.extracted_skills || [])) {
        const norm = skill.toLowerCase().trim();
        if (!skillMap.has(norm)) skillMap.set(norm, { mentions: 0, companies: new Set(), recent: 0, sectors: new Set() });
        const s = skillMap.get(norm)!;
        s.mentions++;
        s.companies.add(company);
        if (isRecent) s.recent++;
        s.sectors.add(sector);
      }

      // Certifications
      const rawAnalysis = a.raw_analysis || {};
      const certs = rawAnalysis.certifications || [];
      for (const cert of certs) {
        const norm = (cert.normalized_name || cert.name || "").toLowerCase().trim();
        if (!norm) continue;
        if (!certMap.has(norm)) certMap.set(norm, { mentions: 0, companies: new Set(), recent: 0, sectors: new Set(), difficulty: cert.difficulty || "intermediate" });
        const c = certMap.get(norm)!;
        c.mentions++;
        c.companies.add(company);
        if (isRecent) c.recent++;
        c.sectors.add(sector);
      }

      // Roles
      if (a.detected_role) {
        const roleNorm = a.detected_role.toLowerCase().trim();
        if (!roleMap.has(roleNorm)) roleMap.set(roleNorm, { count: 0, category: rawAnalysis.role_category || "general" });
        roleMap.get(roleNorm)!.count++;
      }
    }

    // Step 5: Upsert skill demand scores
    const skillRecords = Array.from(skillMap.entries()).map(([norm, data]) => ({
      skill_name: norm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      normalized_name: norm,
      mention_count: data.mentions,
      company_diversity: data.companies.size,
      recent_postings: data.recent,
      demand_score: Math.round(data.mentions * 0.5 + data.companies.size * 0.3 + data.recent * 0.2),
      trend: data.recent > data.mentions * 0.5 ? "rising" : data.recent < data.mentions * 0.2 ? "declining" : "stable",
      sector: Array.from(data.sectors)[0] || null,
      last_calculated_at: new Date().toISOString(),
    }));

    // Difficulty multipliers
    const difficultyMultiplier: Record<string, number> = { advanced: 1.5, intermediate: 1.2, entry: 0.8 };

    const certRecords = Array.from(certMap.entries()).map(([norm, data]) => {
      const demandScore = Math.round(data.mentions * 0.5 + data.companies.size * 0.3 + data.recent * 0.2);
      const mult = difficultyMultiplier[data.difficulty] || 1.2;
      return {
        cert_name: norm.toUpperCase(),
        normalized_name: norm,
        mention_count: data.mentions,
        company_diversity: data.companies.size,
        recent_postings: data.recent,
        demand_score: demandScore,
        difficulty_level: data.difficulty,
        ers_points: Math.round(demandScore * mult),
        trend: data.recent > data.mentions * 0.5 ? "rising" : data.recent < data.mentions * 0.2 ? "declining" : "stable",
        sector: Array.from(data.sectors)[0] || null,
        last_calculated_at: new Date().toISOString(),
      };
    });

    const roleRecords = Array.from(roleMap.entries()).map(([norm, data]) => ({
      role_name: norm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      role_category: data.category,
      aliases: [] as string[],
    }));

    // Batch upsert
    if (skillRecords.length > 0) {
      // Delete old and insert fresh
      await admin.from("market_skill_demand").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await admin.from("market_skill_demand").insert(skillRecords);
    }

    if (certRecords.length > 0) {
      await admin.from("market_cert_demand").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await admin.from("market_cert_demand").insert(certRecords);
    }

    if (roleRecords.length > 0) {
      for (const role of roleRecords) {
        await admin.from("market_role_taxonomy").upsert(role, { onConflict: "role_name" });
      }
    }

    // Step 6: Update refresh log
    await admin.from("market_refresh_log").update({
      status: errors > 0 ? "completed_with_errors" : "completed",
      completed_at: new Date().toISOString(),
      jobs_analyzed: allAnalyses.length,
      skills_updated: skillRecords.length,
      certs_updated: certRecords.length,
      roles_updated: roleRecords.length,
      error_message: errors > 0 ? `${errors} batch(es) failed` : null,
    }).eq("id", refreshId);

    // Audit log
    await admin.from("audit_logs").insert({
      user_id: user.id,
      action: "market_intelligence_refresh",
      resource_type: "market_intelligence",
      details: {
        jobs_analyzed: allAnalyses.length,
        skills_found: skillRecords.length,
        certs_found: certRecords.length,
        roles_found: roleRecords.length,
        errors,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        jobs_analyzed: allAnalyses.length,
        skills_found: skillRecords.length,
        certs_found: certRecords.length,
        roles_found: roleRecords.length,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Market intelligence error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
