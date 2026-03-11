import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Scrapes real Saudi job postings from major job platforms using Firecrawl search.
 * Called by job-ingestion to collect actual market data.
 */
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
    const searchQueries = body.queries || [
      "site:bayt.com jobs Saudi Arabia",
      "site:gulftalent.com jobs Saudi Arabia",
      "site:indeed.com jobs Saudi Arabia",
      "site:linkedin.com/jobs Saudi Arabia tech",
      "Saudi Arabia cybersecurity jobs hiring",
      "Saudi Arabia AI engineer jobs 2026",
      "Saudi Arabia cloud computing jobs",
      "NEOM jobs careers Saudi",
      "Aramco careers Saudi Arabia",
      "Saudi Arabia fintech jobs",
    ];

    const allResults: any[] = [];

    // Search each query in parallel (batch of 3 to respect rate limits)
    for (let i = 0; i < searchQueries.length; i += 3) {
      const batch = searchQueries.slice(i, i + 3);
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
              limit: 10,
              lang: "en",
              country: "SA",
              scrapeOptions: { formats: ["markdown"] },
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error(`Firecrawl search failed for "${query}":`, errText);
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
          allResults.push(...result.value);
        }
      }

      // Small delay between batches
      if (i + 3 < searchQueries.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`Firecrawl collected ${allResults.length} raw results`);

    return new Response(
      JSON.stringify({ success: true, results: allResults, count: allResults.length }),
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

function detectSource(url: string): string {
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("bayt.com")) return "Bayt";
  if (url.includes("gulftalent.com")) return "GulfTalent";
  if (url.includes("indeed.com")) return "Indeed";
  if (url.includes("jadarat.sa") || url.includes("hrsd.gov.sa")) return "Jadarat";
  return "Web";
}
