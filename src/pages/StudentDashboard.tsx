import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ERSGauge from "@/components/ERSGauge";
import StatCard from "@/components/StatCard";
import StudentOnboarding from "@/components/StudentOnboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchStudentDashboard, calculateERSFromData, fetchLeaderboard } from "@/lib/supabaseData";
import type { AuthUser } from "@/lib/supabaseAuth";
import {
  Trophy, Target, Briefcase, Map, Bell, Upload, Award,
  TrendingUp, Star, CheckCircle, Circle, Clock, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StudentDashboardProps { user: AuthUser; }

const StudentDashboard = ({ user: authUser }: StudentDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderFilter, setLeaderFilter] = useState<"global" | "university" | "major">("global");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const loadDashboard = useCallback(async () => {
    const data = await fetchStudentDashboard(authUser.id);
    setDashData(data);
    setOnboardingComplete(data.studentProfile?.onboarding_completed || false);
    setLoading(false);
  }, [authUser.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    if (!dashData?.studentProfile) return;
    const filter = leaderFilter === "university"
      ? { university: dashData.studentProfile.university }
      : leaderFilter === "major"
      ? { major: dashData.studentProfile.major }
      : {};
    fetchLeaderboard(filter).then(setLeaderboard);
  }, [leaderFilter, dashData?.studentProfile]);

  const handleFileUpload = useCallback((type: "transcript" | "certificate" | "project") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { toast({ title: "File too large", description: "Max 10MB", variant: "destructive" }); return; }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "png", "jpg", "jpeg"].includes(ext || "")) { toast({ title: "Invalid format", description: "Only PDF, PNG, JPG", variant: "destructive" }); return; }

      const path = `${authUser.id}/${type}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }

      if (type === "transcript") {
        await supabase.from("transcript_uploads").insert({ user_id: authUser.id, file_path: path });
      } else if (type === "project") {
        const title = file.name.replace(/\.[^.]+$/, "");
        await supabase.from("student_projects").insert({ user_id: authUser.id, title, file_path: path });
      }
      toast({ title: "Uploaded", description: `${type} uploaded successfully. Pending verification.` });
      loadDashboard();
    };
    input.click();
  }, [authUser.id, toast, loadDashboard]);

  // Fetch job market data and cert catalog for roadmap/jobs tabs
  const [jobCache, setJobCache] = useState<any[]>([]);
  const [certCatalog, setCertCatalog] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("job_cache").select("*").order("fetched_at", { ascending: false }).limit(50)
      .then(({ data }) => setJobCache(data || []));
    supabase.from("certification_catalog").select("*").order("category")
      .then(({ data }) => setCertCatalog(data || []));
  }, []);

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Onboarding gate
  if (onboardingComplete === false) {
    return <StudentOnboarding userId={authUser.id} onComplete={loadDashboard} />;
  }

  const sp = dashData?.studentProfile;
  const ers = calculateERSFromData(dashData || {});
  const myRank = leaderboard.findIndex(s => s.user_id === authUser.id) + 1;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Welcome, {authUser.full_name}</h1>
          <p className="text-muted-foreground text-sm">
            {sp?.university || "—"} · {sp?.major || "—"} · GPA {sp?.gpa || "N/A"}/{sp?.gpa_scale === "5" ? "5.0" : "4.0"}
            {sp?.career_target && <span className="ml-2 text-primary font-medium">· Target: {sp.career_target}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="ERS Score" value={ers.total} delay={0} />
        <StatCard icon={Trophy} label="Rank" value={myRank > 0 ? `#${myRank}` : "—"} delay={0.1} />
        <StatCard icon={Award} label="Certifications" value={dashData?.certifications?.length || 0} delay={0.2} />
        <StatCard icon={Briefcase} label="Projects" value={dashData?.projects?.length || 0} delay={0.3} />
      </div>

      <Tabs defaultValue="ers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="ers"><Target className="h-4 w-4 mr-1 hidden sm:inline" />ERS</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1 hidden sm:inline" />Leaderboard</TabsTrigger>
          <TabsTrigger value="skills"><TrendingUp className="h-4 w-4 mr-1 hidden sm:inline" />Skills</TabsTrigger>
          <TabsTrigger value="uploads"><Upload className="h-4 w-4 mr-1 hidden sm:inline" />Documents</TabsTrigger>
          <TabsTrigger value="roadmap"><Map className="h-4 w-4 mr-1 hidden sm:inline" />Roadmap</TabsTrigger>
          <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 mr-1 hidden sm:inline" />Jobs</TabsTrigger>
        </TabsList>

        {/* ERS Tab - Explainable Breakdown */}
        <TabsContent value="ers">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div className="md:col-span-1 rounded-xl border bg-card p-6 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ERSGauge score={ers.total} size={180} />
              {myRank > 0 && <p className="mt-2 text-sm text-muted-foreground">Rank #{myRank}</p>}
              {ers.breakdown.synergyBonus > 0 && (
                <Badge className="mt-2 bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]">
                  <Star className="h-3 w-3 mr-1" />+{ers.breakdown.synergyBonus}% Synergy
                </Badge>
              )}
              {ers.breakdown.nationalReadiness > 0 && (
                <Badge className="mt-1 bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold))] shadow-[0_0_8px_hsl(var(--gold)/0.3)]">
                  <Star className="h-3 w-3 mr-1" />+{ers.breakdown.nationalReadiness}% National
                </Badge>
              )}
            </motion.div>
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold font-heading">Explainable Score Breakdown</h3>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Every score component is transparent. Click any bar for details. Zero black-box scoring — compliant with SDAIA guidelines.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Academic Performance", value: ers.breakdown.academic || 0, weight: "40%", color: "bg-primary" },
                    { label: "Certifications", value: ers.breakdown.certification || 0, weight: "25%", color: "bg-[hsl(var(--success))]" },
                    { label: "Projects", value: ers.breakdown.project || 0, weight: "15%", color: "bg-secondary" },
                    { label: "Soft Skills", value: ers.breakdown.softSkills || 0, weight: "10%", color: "bg-accent-foreground" },
                    { label: "Conduct & Attendance", value: ers.breakdown.conduct || 0, weight: "10%", color: "bg-[hsl(var(--gold))]" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label} <span className="text-muted-foreground">({item.weight})</span></span>
                        <span className="font-semibold">{Math.round(item.value)}/100</span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                    </div>
                  ))}
                  {ers.breakdown.decayApplied > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Skill Decay Applied</span>
                      <span>-{ers.breakdown.decayApplied}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold font-heading mb-3">Certifications</h3>
                {dashData?.certifications?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dashData.certifications.map((c: any) => (
                      <Badge key={c.id} variant="secondary" className={c.verified ? "" : "opacity-60"}>
                        <Award className="h-3 w-3 mr-1" />
                        {c.certification_catalog?.name || c.custom_name || "Certificate"}
                        {c.verified && <CheckCircle className="h-3 w-3 ml-1 text-[hsl(var(--success))]" />}
                        {c.certification_catalog?.is_hadaf_reimbursed && (
                          <span className="ml-1 text-[10px] text-[hsl(var(--gold))]">🇸🇦 Hadaf</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No certifications yet. Upload to boost your ERS.</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-semibold font-heading">Leaderboard</h3>
              <div className="flex gap-2">
                {(["global", "university", "major"] as const).map(f => (
                  <Button key={f} size="sm" variant={leaderFilter === f ? "default" : "outline"} onClick={() => setLeaderFilter(f)} className="capitalize text-xs">{f}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {leaderboard.map((s, i) => (
                <motion.div key={s.user_id}
                  className={`flex items-center gap-4 rounded-lg p-3 ${s.user_id === authUser.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <span className={`w-8 text-center font-bold text-lg ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.university} · {s.major}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{Math.round(s.ers_score || 0)}</p>
                    <p className="text-xs text-muted-foreground">ERS</p>
                  </div>
                </motion.div>
              ))}
              {leaderboard.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No students found.</p>}
            </div>
          </div>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Skill Matrix</h3>
            {dashData?.skills?.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dashData.skills.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className={`h-3 w-3 rounded-full ${
                      s.proficiency_level === "expert" ? "bg-[hsl(var(--success))]" :
                      s.proficiency_level === "advanced" ? "bg-primary" :
                      s.proficiency_level === "intermediate" ? "bg-[hsl(var(--gold))]" :
                      "bg-muted-foreground"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.skill_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{s.proficiency_level} · {s.source}</p>
                    </div>
                    {s.verified && <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No skills added yet.</p>}
          </div>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="uploads">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Upload Documents</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 border-dashed" onClick={() => handleFileUpload("transcript")}>
                <Upload className="h-5 w-5 mr-2" /> Upload Transcript (PDF)
              </Button>
              <Button variant="outline" className="h-20 border-dashed" onClick={() => handleFileUpload("certificate")}>
                <Upload className="h-5 w-5 mr-2" /> Upload Certificate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Accepted: PDF, PNG, JPEG · Max 10 MB</p>

            {/* Projects list */}
            <h4 className="font-semibold mt-6 mb-3">Projects</h4>
            {dashData?.projects?.length > 0 ? (
              <div className="space-y-2">
                {dashData.projects.map((p: any) => (
                  <div key={p.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${p.verified ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    </div>
                    {p.verified ? <Badge className="ml-auto text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">Verified</Badge> : <Badge variant="outline" className="ml-auto text-[10px]">Pending</Badge>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No projects yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
