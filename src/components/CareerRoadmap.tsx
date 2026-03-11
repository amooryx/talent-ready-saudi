import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { untypedTable } from "@/lib/untypedTable";
import { useToast } from "@/hooks/use-toast";
import {
  Map, Target, Award, Star, Briefcase, CheckCircle, Circle,
  ArrowRight, Loader2, TrendingUp, AlertTriangle, Rocket,
  BookOpen, Code, ChevronRight
} from "lucide-react";

interface CareerRoadmapProps {
  userId: string;
  currentCareerTarget?: string;
}

const POPULAR_CAREERS = [
  "Software Engineer",
  "Cloud Engineer",
  "Penetration Tester",
  "Data Analyst",
  "AI Engineer",
  "SOC Analyst",
  "DevOps Engineer",
  "Cybersecurity Analyst",
  "Full Stack Developer",
  "Business Analyst",
  "Network Engineer",
  "UI/UX Designer",
];

export default function CareerRoadmap({ userId, currentCareerTarget }: CareerRoadmapProps) {
  const { toast } = useToast();
  const [careerTarget, setCareerTarget] = useState(currentCareerTarget || "");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [marketSkills, setMarketSkills] = useState<any[]>([]);
  const [marketCerts, setMarketCerts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      untypedTable("market_skill_demand").select("*").order("demand_score", { ascending: false }).limit(20),
      untypedTable("market_cert_demand").select("*").order("demand_score", { ascending: false }).limit(15),
    ]).then(([{ data: sd }, { data: cd }]) => {
      setMarketSkills(sd || []);
      setMarketCerts(cd || []);
    });

    // Auto-trigger career fit analysis if student has a career target
    if (currentCareerTarget && currentCareerTarget.trim()) {
      setCareerTarget(currentCareerTarget);
      generateRoadmap(currentCareerTarget);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateRoadmap = async (target?: string) => {
    const finalTarget = target || careerTarget;
    if (!finalTarget.trim()) {
      toast({ title: "Enter a career target", variant: "destructive" });
      return;
    }
    setCareerTarget(finalTarget);
    setLoading(true);
    setRoadmap(null);

    try {
      const { data, error } = await supabase.functions.invoke("career-roadmap", {
        body: { career_target: finalTarget },
      });
      if (error) throw error;
      if (data?.roadmap) {
        setRoadmap(data.roadmap);
      } else {
        throw new Error("No roadmap generated");
      }
    } catch (err: any) {
      toast({ title: "Roadmap generation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Career Target Selector */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold font-heading mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          AI Career Roadmap Generator
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select or enter your target career. Our AI analyzes real Saudi job market data to create your personalized roadmap.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter career target (e.g., Penetration Tester)"
            value={careerTarget}
            onChange={(e) => setCareerTarget(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && generateRoadmap()}
          />
          <Button onClick={() => generateRoadmap()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Rocket className="h-4 w-4 mr-1" />}
            {loading ? "Analyzing..." : "Generate"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {POPULAR_CAREERS.map((career) => (
            <Button
              key={career}
              variant={careerTarget === career ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => generateRoadmap(career)}
              disabled={loading}
            >
              {career}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Analyzing Saudi market demand for "{careerTarget}"...</p>
          <p className="text-xs text-muted-foreground mt-1">Cross-referencing your profile with real job postings</p>
        </div>
      )}

      {/* Roadmap Results */}
      {roadmap && !roadmap.parse_error && (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Readiness Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-6 text-center">
              <p className="text-3xl font-bold text-primary">{roadmap.readiness_score || 0}%</p>
              <p className="text-xs text-muted-foreground">Career Readiness</p>
              <Progress value={roadmap.readiness_score || 0} className="h-2 mt-2" />
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Badge className={`text-sm ${
                roadmap.market_demand === "high" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" :
                roadmap.market_demand === "medium" ? "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" :
                "bg-destructive/10 text-destructive"
              }`}>
                {(roadmap.market_demand || "unknown").toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">Market Demand</p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <p className="text-sm font-medium">{roadmap.salary_outlook || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-1">Salary Outlook</p>
            </div>
          </div>

          {/* Skill Gaps */}
          {roadmap.skill_gaps && roadmap.skill_gaps.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <h4 className="font-semibold font-heading mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Skill Gaps to Address
              </h4>
              <div className="space-y-2">
                {roadmap.skill_gaps.map((gap: any, i: number) => (
                  <motion.div key={i} className="flex items-center gap-3 rounded-lg border p-3"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <Badge variant={
                      gap.priority === "critical" ? "destructive" :
                      gap.priority === "important" ? "default" : "secondary"
                    } className="text-[10px] shrink-0">
                      {gap.priority}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{gap.skill}</p>
                      <p className="text-xs text-muted-foreground">{gap.action}</p>
                    </div>
                    {gap.market_demand_score > 0 && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {gap.market_demand_score}
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Certifications */}
          {roadmap.recommended_certifications && roadmap.recommended_certifications.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <h4 className="font-semibold font-heading mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Recommended Certifications
              </h4>
              <div className="space-y-3">
                {roadmap.recommended_certifications.map((cert: any, i: number) => (
                  <motion.div key={i} className="rounded-lg border p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{cert.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{cert.reason}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{cert.difficulty}</Badge>
                          {cert.provider && <span className="text-[10px] text-muted-foreground">via {cert.provider}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">+{cert.ers_points}</p>
                        <p className="text-[10px] text-muted-foreground">ERS pts</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Projects */}
          {roadmap.recommended_projects && roadmap.recommended_projects.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <h4 className="font-semibold font-heading mb-4 flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Recommended Portfolio Projects
              </h4>
              <div className="space-y-3">
                {roadmap.recommended_projects.map((proj: any, i: number) => (
                  <motion.div key={i} className="rounded-lg border p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <p className="text-sm font-semibold">{proj.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {proj.skills_gained?.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                      {proj.estimated_time && (
                        <span className="text-[10px] text-muted-foreground ml-auto">⏱ {proj.estimated_time}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Roadmap */}
          {roadmap.roadmap_steps && roadmap.roadmap_steps.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <h4 className="font-semibold font-heading mb-4 flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                Your Career Roadmap
              </h4>
              <div className="space-y-3">
                {roadmap.roadmap_steps.map((step: any, i: number) => (
                  <motion.div key={i} className="flex gap-4"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {step.step || i + 1}
                      </div>
                      {i < roadmap.roadmap_steps.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-semibold">{step.action}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">⏱ {step.timeline}</span>
                        {step.ers_gain > 0 && (
                          <Badge className="text-[10px] bg-primary/10 text-primary">+{step.ers_gain} ERS</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{step.impact}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Vision 2030 Alignment */}
          {roadmap.vision_2030_alignment && roadmap.vision_2030_alignment.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <h4 className="font-semibold font-heading mb-3">🇸🇦 Vision 2030 Alignment</h4>
              <div className="flex flex-wrap gap-2">
                {roadmap.vision_2030_alignment.map((v: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Market Snapshot (when no roadmap) */}
      {!roadmap && !loading && (marketSkills.length > 0 || marketCerts.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-6">
            <h4 className="font-semibold font-heading mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Trending Skills in Saudi Market
            </h4>
            <div className="space-y-1">
              {marketSkills.slice(0, 10).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1">
                  <span className="truncate">{s.skill_name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{Math.round(s.demand_score)}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h4 className="font-semibold font-heading mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Top Certifications by ERS Value
            </h4>
            <div className="space-y-1">
              {marketCerts.slice(0, 10).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1">
                  <span className="truncate">{c.cert_name}</span>
                  <span className="text-xs font-semibold text-primary shrink-0">{c.ers_points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
