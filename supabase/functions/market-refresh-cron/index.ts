import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Orchestrator function called by pg_cron every 24 hours.
 * 1. Runs job-ingestion to collect new postings
 * 2. Runs market-intelligence to analyze and score
 * 3. Snapshots demand history for trend tracking
 * 4. Calculates weekly/monthly trend changes
 */
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: any = { steps: [] };

    // Step 1: Ingest new jobs
    try {
      const ingestionRes = await fetch(`${supabaseUrl}/functions/v1/job-ingestion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({}),
      });
      const ingestionData = await ingestionRes.json();
      results.steps.push({ step: "job-ingestion", ...ingestionData });
    } catch (err) {
      console.error("Job ingestion step failed:", err);
      results.steps.push({ step: "job-ingestion", error: String(err) });
    }

    // Step 2: Run market intelligence analysis
    // We need an admin user token for this. Use service role to find an admin.
    try {
      const { data: adminRole } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminRole) {
        // Call market-intelligence with service role (bypass auth check)
        const miRes = await fetch(`${supabaseUrl}/functions/v1/market-intelligence`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({}),
        });
        const miData = await miRes.json();
        results.steps.push({ step: "market-intelligence", ...miData });
      } else {
        results.steps.push({ step: "market-intelligence", skipped: "No admin user found" });
      }
    } catch (err) {
      console.error("Market intelligence step failed:", err);
      results.steps.push({ step: "market-intelligence", error: String(err) });
    }

    // Step 3: Snapshot demand history
    try {
      const today = new Date().toISOString().split("T")[0];

      const [{ data: skillDemand }, { data: certDemand }] = await Promise.all([
        admin.from("market_skill_demand").select("skill_name, demand_score, mention_count"),
        admin.from("market_cert_demand").select("cert_name, demand_score, mention_count"),
      ]);

      const historyRecords: any[] = [];

      for (const s of (skillDemand || [])) {
        historyRecords.push({
          item_type: "skill",
          item_name: s.skill_name,
          demand_score: s.demand_score,
          mention_count: s.mention_count,
          snapshot_date: today,
        });
      }

      for (const c of (certDemand || [])) {
        historyRecords.push({
          item_type: "cert",
          item_name: c.cert_name,
          demand_score: c.demand_score,
          mention_count: c.mention_count,
          snapshot_date: today,
        });
      }

      if (historyRecords.length > 0) {
        await admin.from("demand_history").upsert(historyRecords, {
          onConflict: "item_type,item_name,snapshot_date",
          ignoreDuplicates: true,
        });
      }

      results.steps.push({ step: "demand-snapshot", records: historyRecords.length });
    } catch (err) {
      console.error("Demand snapshot failed:", err);
      results.steps.push({ step: "demand-snapshot", error: String(err) });
    }

    // Step 4: Calculate weekly/monthly trend changes
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Get historical snapshots
      const [{ data: weekData }, { data: monthData }] = await Promise.all([
        admin.from("demand_history").select("*").eq("snapshot_date", weekAgo),
        admin.from("demand_history").select("*").eq("snapshot_date", monthAgo),
      ]);

      const weekMap = new Map((weekData || []).map((d: any) => [`${d.item_type}:${d.item_name}`, d.demand_score]));
      const monthMap = new Map((monthData || []).map((d: any) => [`${d.item_type}:${d.item_name}`, d.demand_score]));

      // Update skill demand with changes
      const { data: currentSkills } = await admin.from("market_skill_demand").select("id, skill_name, demand_score");
      for (const s of (currentSkills || [])) {
        const weekPrev = weekMap.get(`skill:${s.skill_name}`);
        const monthPrev = monthMap.get(`skill:${s.skill_name}`);
        const weeklyChange = weekPrev != null ? Number(s.demand_score) - Number(weekPrev) : 0;
        const monthlyChange = monthPrev != null ? Number(s.demand_score) - Number(monthPrev) : 0;

        if (weeklyChange !== 0 || monthlyChange !== 0) {
          await admin.from("market_skill_demand").update({
            weekly_change: weeklyChange,
            monthly_change: monthlyChange,
          }).eq("id", s.id);
        }
      }

      // Update cert demand with changes
      const { data: currentCerts } = await admin.from("market_cert_demand").select("id, cert_name, demand_score");
      for (const c of (currentCerts || [])) {
        const weekPrev = weekMap.get(`cert:${c.cert_name}`);
        const monthPrev = monthMap.get(`cert:${c.cert_name}`);
        const weeklyChange = weekPrev != null ? Number(c.demand_score) - Number(weekPrev) : 0;
        const monthlyChange = monthPrev != null ? Number(c.demand_score) - Number(monthPrev) : 0;

        if (weeklyChange !== 0 || monthlyChange !== 0) {
          await admin.from("market_cert_demand").update({
            weekly_change: weeklyChange,
            monthly_change: monthlyChange,
          }).eq("id", c.id);
        }
      }

      results.steps.push({ step: "trend-calculation", completed: true });
    } catch (err) {
      console.error("Trend calculation failed:", err);
      results.steps.push({ step: "trend-calculation", error: String(err) });
    }

    // Audit
    await admin.from("audit_logs").insert({
      action: "market_refresh_cron",
      resource_type: "market_intelligence",
      details: results,
    });

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Cron orchestrator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
