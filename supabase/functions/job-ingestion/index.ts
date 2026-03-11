import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Job Ingestion Pipeline v2
 * 1. Scrapes real Saudi job postings via Firecrawl (firecrawl-jobs function)
 * 2. Uses AI to parse and structure scraped content
 * 3. Normalizes skills via synonym map
 * 4. Deduplicates against existing job_cache
 * 5. Falls back to AI-generated jobs if Firecrawl unavailable
 */
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch skill synonyms for normalization
    const { data: synonyms } = await admin.from("skill_synonyms").select("synonym, canonical_name");
    const synonymMap = new Map((synonyms || []).map((s: any) => [s.synonym.toLowerCase(), s.canonical_name]));

    // Step 1: Try to scrape real job data via Firecrawl
    let scrapedContent: any[] = [];
    let dataSource = "firecrawl";

    try {
      const firecrawlRes = await fetch(`${supabaseUrl}/functions/v1/firecrawl-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({}),
      });

      if (firecrawlRes.ok) {
        const firecrawlData = await firecrawlRes.json();
        scrapedContent = firecrawlData.results || [];
        console.log(`Firecrawl returned ${scrapedContent.length} results`);
      } else {
        console.warn("Firecrawl unavailable, falling back to AI generation");
        dataSource = "ai_generated";
      }
    } catch (err) {
      console.warn("Firecrawl call failed:", err);
      dataSource = "ai_generated";
    }

    // Step 2: Use AI to parse scraped content OR generate realistic jobs
    const sectors = ["tech", "engineering", "business", "medical", "creative", "legal", "education"];
    const sources = ["LinkedIn", "Bayt", "GulfTalent", "Indeed", "Jadarat"];

    let aiPrompt: string;
    if (scrapedContent.length > 0) {
      // Parse real scraped data
      const scrapedSummary = scrapedContent
        .slice(0, 40) // Limit to avoid token overflow
        .map((r: any) => `[Source: ${r.source}] ${r.title}\n${(r.markdown || "").slice(0, 500)}`)
        .join("\n---\n");

      aiPrompt = `You are a Saudi job market data extractor. Parse the following REAL scraped job listings from Saudi job platforms and extract structured job data.

SCRAPED JOB DATA:
${scrapedSummary}

Extract each distinct job posting. For each job, determine:
- title: exact job title
- company: company name  
- location: city in Saudi Arabia
- sector: ${sectors.join("|")}|general
- experience_level: entry|mid|senior
- required_skills: specific technical/professional skills mentioned (3-8 per job)
- required_certifications: any certifications mentioned (0-3 per job)
- source: ${sources.join("|")}|Web (use the source tag from scraped data)
- salary_range: salary if mentioned, null otherwise

CRITICAL RULES:
- Only include jobs LOCATED IN Saudi Arabia
- Extract REAL data from the scraped content, do not fabricate
- Normalize skill names (e.g. "Python programming" → "Python")
- If a scraped result is not a job posting, skip it
- Deduplicate similar postings`;
    } else {
      // Fallback: Generate realistic jobs based on current Saudi market
      aiPrompt = `You are a Saudi job market data simulator. Generate 30 realistic job postings currently available in Saudi Arabia.
              
Include jobs from these sources: ${sources.join(", ")}
Cover these sectors: ${sectors.join(", ")}

Focus on Vision 2030 aligned roles: AI, cybersecurity, cloud, fintech, healthcare, renewable energy, tourism, entertainment.

Include major Saudi employers: Aramco, SABIC, STC, NEOM, Red Sea Global, Lucid Motors, Saudi Airlines, Riyad Bank, Al Rajhi, Ministry of IT, SDAIA, Elm, Thiqah, Tuwaiq Academy, King Faisal Hospital.

Rules:
- All jobs MUST be in Saudi Arabia
- Use realistic job titles
- Include 3-8 required skills per job
- Include 0-3 certifications per job
- Mix of entry, mid, and senior roles
- Vary across cities: Riyadh, Jeddah, Dammam, NEOM, Makkah, Madinah
- Make skills specific (not generic)`;
    }

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
          temperature: scrapedContent.length > 0 ? 0.1 : 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: aiPrompt },
            {
              role: "user",
              content: scrapedContent.length > 0
                ? `Parse the scraped job data above into structured JSON. Return ONLY: { "jobs": [{ "title", "company", "location", "sector", "experience_level", "required_skills": [], "required_certifications": [], "source", "salary_range" }] }`
                : `Generate 30 fresh Saudi job postings for today (${new Date().toISOString().split("T")[0]}). Return ONLY: { "jobs": [{ "title", "company", "location", "sector", "experience_level", "required_skills": [], "required_certifications": [], "source", "salary_range" }] }`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI job processing failed:", errText);
      return new Response(
        JSON.stringify({ error: "Job processing failed", detail: errText }),
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
        JSON.stringify({ success: true, ingested: 0, message: "No jobs found", data_source: dataSource }),
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
        source: j.source || dataSource,
        source_url: null,
        raw_data: {
          salary_range: j.salary_range,
          data_source: dataSource,
          scraped_results: scrapedContent.length,
          ingested_at: new Date().toISOString(),
        },
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
        data_source: dataSource,
        scraped_results: scrapedContent.length,
        total_parsed: jobs.length,
        duplicates_skipped: jobs.length - newJobs.length,
        ingested,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data_source: dataSource,
        scraped: scrapedContent.length,
        parsed: jobs.length,
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
