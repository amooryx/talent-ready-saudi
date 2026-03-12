import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_JOBS = 100;

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

    // Step 1: Scrape real job data via Firecrawl (requesting 100+ results)
    let scrapedContent: any[] = [];
    let dataSource = "firecrawl";

    try {
      const firecrawlRes = await fetch(`${supabaseUrl}/functions/v1/firecrawl-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ min_results: MIN_JOBS }),
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

    // Step 2: Parse scraped content with AI (process in chunks to handle 100+ results)
    const sectors = ["tech", "engineering", "business", "medical", "creative", "legal", "education"];
    const sources = ["LinkedIn", "Bayt", "GulfTalent", "Indeed", "Jadarat"];
    const allParsedJobs: any[] = [];

    if (scrapedContent.length > 0) {
      // Process in chunks of 40 to avoid token limits
      const chunks = [];
      for (let i = 0; i < scrapedContent.length; i += 40) {
        chunks.push(scrapedContent.slice(i, i + 40));
      }

      for (const chunk of chunks) {
        const chunkJobs = await parseJobChunk(chunk, sectors, sources, lovableApiKey);
        allParsedJobs.push(...chunkJobs);
      }
      console.log(`Parsed ${allParsedJobs.length} jobs from ${chunks.length} chunks`);
    } else {
      // Fallback: Generate realistic jobs
      const fallbackJobs = await generateFallbackJobs(sectors, sources, lovableApiKey);
      allParsedJobs.push(...fallbackJobs);
    }

    if (allParsedJobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, ingested: 0, message: "No jobs found", data_source: dataSource }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize skills
    const normalizeSkill = (skill: string): string => {
      const lower = skill.toLowerCase().trim();
      return synonymMap.get(lower) || skill.trim();
    };

    // Deduplicate against existing job_cache
    const { data: existingJobs } = await admin
      .from("job_cache")
      .select("title, company")
      .order("fetched_at", { ascending: false })
      .limit(1000);

    const existingSet = new Set(
      (existingJobs || []).map((j: any) => `${j.title?.toLowerCase()}|${j.company?.toLowerCase()}`)
    );

    const newJobs = allParsedJobs
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
      // Insert in batches of 50
      for (let i = 0; i < newJobs.length; i += 50) {
        const batch = newJobs.slice(i, i + 50);
        const { error: insertError } = await admin.from("job_cache").insert(batch);
        if (insertError) {
          console.error("Insert error:", insertError);
        } else {
          ingested += batch.length;
        }
      }
    }

    // Step 3: Role clustering from newest 100+ jobs
    await clusterJobRoles(admin, lovableApiKey);

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
        total_parsed: allParsedJobs.length,
        duplicates_skipped: allParsedJobs.length - newJobs.length,
        ingested,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data_source: dataSource,
        scraped: scrapedContent.length,
        parsed: allParsedJobs.length,
        duplicates_skipped: allParsedJobs.length - newJobs.length,
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

async function parseJobChunk(chunk: any[], sectors: string[], sources: string[], lovableApiKey: string): Promise<any[]> {
  const scrapedSummary = chunk
    .map((r: any) => `[Source: ${r.source}] ${r.title}\n${(r.markdown || "").slice(0, 400)}`)
    .join("\n---\n");

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          content: `You are a Saudi job market data extractor. Parse scraped job listings and extract structured data.
Extract each distinct job posting with: title, company, location (Saudi city), sector (${sectors.join("|")}|general), experience_level (entry|mid|senior), required_skills (3-8 specific skills), required_certifications (0-3), source (${sources.join("|")}|Web), salary_range.
RULES: Only Saudi Arabia jobs. Skip non-job results. Normalize skill names. Deduplicate similar postings.`,
        },
        {
          role: "user",
          content: `Parse these scraped results into structured JSON:\n\n${scrapedSummary}\n\nReturn: { "jobs": [...] }`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) return [];

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return parsed.jobs || [];
  } catch {
    return [];
  }
}

async function generateFallbackJobs(sectors: string[], sources: string[], lovableApiKey: string): Promise<any[]> {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          content: `Generate 100 realistic Saudi job postings. Sources: ${sources.join(", ")}. Sectors: ${sectors.join(", ")}. Include Vision 2030 roles (AI, cybersecurity, cloud, fintech, healthcare, renewable energy). Mix entry/mid/senior. Cities: Riyadh, Jeddah, Dammam, NEOM, Makkah, Madinah. 3-8 skills per job. Employers: Aramco, SABIC, STC, NEOM, Red Sea Global, etc.`,
        },
        {
          role: "user",
          content: `Generate 100 fresh Saudi job postings for ${new Date().toISOString().split("T")[0]}. Return: { "jobs": [{ "title", "company", "location", "sector", "experience_level", "required_skills": [], "required_certifications": [], "source", "salary_range" }] }`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) return [];

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content).jobs || [];
  } catch {
    return [];
  }
}

async function clusterJobRoles(admin: any, lovableApiKey: string) {
  // Fetch newest 100+ jobs from job_cache
  const { data: recentJobs } = await admin
    .from("job_cache")
    .select("title, company, required_skills, required_certifications, sector, location, raw_data")
    .order("fetched_at", { ascending: false })
    .limit(200);

  if (!recentJobs || recentJobs.length < 10) return;

  const jobSummary = recentJobs.map((j: any) =>
    `${j.title} @ ${j.company} | Skills: ${(j.required_skills || []).join(", ")} | Certs: ${(j.required_certifications || []).join(", ")} | Sector: ${j.sector} | Salary: ${j.raw_data?.salary_range || "N/A"}`
  ).join("\n");

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          content: `You are a job market analyst. Cluster these ${recentJobs.length} Saudi job postings into distinct career roles. For each role determine:
- role_name: canonical role name
- role_category: tech|engineering|business|medical|creative|legal|education|general
- job_count: number of postings matching this role
- top_required_skills: most common skills (up to 10)
- top_certifications: most requested certs (up to 5)
- company_diversity: number of distinct companies hiring
- salary_range: if available from the data
- demand_score: calculated as (job_count * 0.5) + (company_diversity * 0.3) + (salary_weight * 0.2) where salary_weight is 0-10 based on competitiveness
- match_companies: list of companies hiring for this role
- market_stability: "high_growth" if trending up, "stable" if steady, "declining" if dropping`,
        },
        {
          role: "user",
          content: `Cluster these jobs:\n\n${jobSummary}\n\nReturn: { "roles": [{ "role_name", "role_category", "job_count", "top_required_skills": [], "top_certifications": [], "company_diversity", "salary_range", "demand_score", "match_companies": [], "market_stability" }] }`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) return;

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return;
  }

  const roles = parsed.roles || [];
  if (roles.length === 0) return;

  // Clear old role demand data and insert fresh
  await admin.from("market_role_demand").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const roleRows = roles.map((r: any) => ({
    role_name: r.role_name,
    role_category: r.role_category || "general",
    job_count: r.job_count || 0,
    top_required_skills: r.top_required_skills || [],
    top_certifications: r.top_certifications || [],
    company_diversity: r.company_diversity || 0,
    salary_range: r.salary_range || null,
    demand_score: r.demand_score || 0,
    match_companies: r.match_companies || [],
    market_stability: r.market_stability || "stable",
    last_calculated_at: new Date().toISOString(),
  }));

  await admin.from("market_role_demand").insert(roleRows);
  console.log(`Clustered ${roleRows.length} career roles from ${recentJobs.length} jobs`);
}
