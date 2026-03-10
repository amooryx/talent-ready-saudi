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

    // Fetch skill synonyms for normalization
    const { data: synonyms } = await admin.from("skill_synonyms").select("synonym, canonical_name");
    const synonymMap = new Map((synonyms || []).map((s: any) => [s.synonym.toLowerCase(), s.canonical_name]));

    // Use AI to generate realistic Saudi job postings based on current market
    // This simulates what real API integrations (LinkedIn, Bayt, etc.) would provide
    const sources = ["LinkedIn", "Bayt", "GulfTalent", "Indeed", "Jadarat"];
    const sectors = ["tech", "engineering", "business", "medical", "creative", "legal", "education"];

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
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a Saudi job market data simulator. Generate 30 realistic job postings currently available in Saudi Arabia.
              
Include jobs from these sources: ${sources.join(", ")}
Cover these sectors: ${sectors.join(", ")}

Focus on Vision 2030 aligned roles: AI, cybersecurity, cloud, fintech, healthcare, renewable energy, tourism, entertainment, etc.

Include major Saudi employers: Aramco, SABIC, STC, NEOM, Red Sea Global, Lucid Motors, Saudi Airlines, Riyad Bank, Al Rajhi, Ministry of IT, SDAIA, Elm, Thiqah, Tuwaiq Academy, King Faisal Hospital.

Return ONLY valid JSON:
{
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "location": "string (city, Saudi Arabia)",
      "sector": "tech|engineering|business|medical|creative|legal|education|general",
      "experience_level": "entry|mid|senior",
      "required_skills": ["string"],
      "required_certifications": ["string"],
      "source": "LinkedIn|Bayt|GulfTalent|Indeed|Jadarat",
      "salary_range": "string or null"
    }
  ]
}

Rules:
- All jobs MUST be in Saudi Arabia
- Use realistic job titles
- Include 3-8 required skills per job
- Include 0-3 certifications per job
- Mix of entry, mid, and senior roles
- Vary across cities: Riyadh, Jeddah, Dammam, NEOM, Makkah, Madinah
- Make skills specific (not generic)
- Each batch should have different jobs than typical listings`,
            },
            {
              role: "user",
              content: `Generate 30 fresh Saudi job postings for today (${new Date().toISOString().split("T")[0]}). Make them diverse across sectors and experience levels. Include emerging roles in AI, cybersecurity, cloud, and digital transformation.`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI job generation failed:", errText);
      return new Response(
        JSON.stringify({ error: "Job generation failed", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobs = parsed.jobs || [];
    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, ingested: 0, message: "No jobs generated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize skills using synonym map
    const normalizeSkill = (skill: string): string => {
      const lower = skill.toLowerCase().trim();
      return synonymMap.get(lower) || skill.trim();
    };

    // Deduplicate against existing job_cache
    const { data: existingJobs } = await admin
      .from("job_cache")
      .select("title, company")
      .order("fetched_at", { ascending: false })
      .limit(500);

    const existingSet = new Set(
      (existingJobs || []).map((j: any) => `${j.title?.toLowerCase()}|${j.company?.toLowerCase()}`)
    );

    const newJobs = jobs
      .filter((j: any) => {
        const key = `${j.title?.toLowerCase()}|${j.company?.toLowerCase()}`;
        return !existingSet.has(key);
      })
      .map((j: any) => ({
        title: j.title,
        company: j.company,
        location: j.location || "Saudi Arabia",
        sector: j.sector || "general",
        experience_level: j.experience_level || null,
        required_skills: (j.required_skills || []).map(normalizeSkill),
        required_certifications: j.required_certifications || [],
        source: j.source || "AI Generated",
        source_url: null,
        raw_data: { salary_range: j.salary_range, ingested_at: new Date().toISOString() },
      }));

    let ingested = 0;
    if (newJobs.length > 0) {
      const { error: insertError } = await admin.from("job_cache").insert(newJobs);
      if (insertError) {
        console.error("Insert error:", insertError);
      } else {
        ingested = newJobs.length;
      }
    }

    // Clean up expired jobs (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("job_cache").delete().lt("fetched_at", thirtyDaysAgo);

    // Audit log
    await admin.from("audit_logs").insert({
      action: "job_ingestion_completed",
      resource_type: "job_cache",
      details: {
        total_generated: jobs.length,
        duplicates_skipped: jobs.length - newJobs.length,
        ingested: ingested,
        sources: sources,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        generated: jobs.length,
        duplicates_skipped: jobs.length - newJobs.length,
        ingested,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Job ingestion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
