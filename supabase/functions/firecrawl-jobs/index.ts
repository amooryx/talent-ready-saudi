import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_QUERIES = [
  "site:bayt.com jobs Saudi Arabia",
  "site:gulftalent.com jobs Saudi Arabia",
  "site:indeed.com jobs Saudi Arabia",
  "site:linkedin.com/jobs Saudi Arabia tech",
  "site:jadarat.sa jobs Saudi Arabia",
  "Saudi Arabia cybersecurity jobs hiring",
  "Saudi Arabia AI engineer jobs 2026",
  "Saudi Arabia cloud computing jobs",
  "NEOM jobs careers Saudi",
  "Aramco careers Saudi Arabia",
  "Saudi Arabia fintech jobs",
  "Saudi Arabia data scientist jobs",
  "Saudi Arabia software developer jobs",
  "Saudi Arabia project manager jobs",
  "Saudi Arabia healthcare jobs",
];

const EXPANSION_QUERIES = [
  "site:bayt.com software engineer Saudi",
  "site:linkedin.com/jobs Riyadh developer",
  "site:indeed.com Jeddah IT jobs",
  "site:gulftalent.com Dammam engineering",
  "site:jadarat.sa technology jobs",
  "Saudi Arabia machine learning jobs",
  "Saudi Arabia DevOps engineer jobs",
  "Saudi Arabia network engineer jobs",
  "Saudi Arabia business analyst jobs",
  "Saudi Arabia UX designer jobs",
  "Red Sea Global careers Saudi",
  "STC careers Saudi Arabia",
  "SABIC careers Saudi Arabia",
  "Saudi Arabia renewable energy jobs",
  "Saudi Arabia accounting finance jobs",
  "site:bayt.com Riyadh senior developer",
  "site:linkedin.com/jobs Saudi cybersecurity analyst",
  "site:indeed.com Saudi cloud architect",
  "site:gulftalent.com Saudi marketing jobs",
  "Saudi Arabia full stack developer jobs 2026",
];

const MIN_TARGET = 100;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const minResults = body.min_results || MIN_TARGET;

    const allResults: any[] = [];
    const seenUrls = new Set<string>();

    // Phase 1: Base queries
    await scrapeQueries(BASE_QUERIES, apiKey, allResults, seenUrls);
    console.log(`Phase 1 complete: ${allResults.length} results`);

    // Phase 2: Expansion if under minimum
    if (allResults.length < minResults) {
      console.log(`Under ${minResults} target, expanding queries...`);
      await scrapeQueries(EXPANSION_QUERIES, apiKey, allResults, seenUrls);
      console.log(`Phase 2 complete: ${allResults.length} results`);
    }

    // Phase 3: Further expansion with sector-specific queries
    if (allResults.length < minResults) {
      const sectors = ["healthcare", "legal", "education", "hospitality", "logistics", "construction", "media"];
      const extraQueries = sectors.map(s => `Saudi Arabia ${s} jobs 2026`);
      await scrapeQueries(extraQueries, apiKey, allResults, seenUrls);
      console.log(`Phase 3 complete: ${allResults.length} results`);
    }

    console.log(`Firecrawl collected ${allResults.length} total results (target: ${minResults})`);

    return new Response(
      JSON.stringify({ success: true, results: allResults, count: allResults.length, target: minResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Firecrawl jobs error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function scrapeQueries(queries: string[], apiKey: string, results: any[], seenUrls: Set<string>) {
  for (let i = 0; i < queries.length; i += 3) {
    const batch = queries.slice(i, i + 3);
    const batchResults = await Promise.allSettled(
      batch.map(async (query: string) => {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 15,
            lang: "en",
            country: "SA",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (!response.ok) {
          console.error(`Firecrawl search failed for "${query}": ${response.status}`);
          return [];
        }

        const data = await response.json();
        return (data.data || []).map((r: any) => ({
          url: r.url,
          title: r.title || "",
          markdown: r.markdown || r.description || "",
          source: detectSource(r.url || ""),
        }));
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        for (const item of result.value) {
          if (item.url && !seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            results.push(item);
          }
        }
      }
    }

    if (i + 3 < queries.length) {
      await new Promise(r => setTimeout(r, 400));
    }
  }
}

function detectSource(url: string): string {
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("bayt.com")) return "Bayt";
  if (url.includes("gulftalent.com")) return "GulfTalent";
  if (url.includes("indeed.com")) return "Indeed";
  if (url.includes("jadarat.sa") || url.includes("hrsd.gov.sa")) return "Jadarat";
  return "Web";
}
