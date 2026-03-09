import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "@/components/StatCard";
import ERSGauge from "@/components/ERSGauge";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser } from "@/lib/supabaseAuth";
import {
  Search, Users, BarChart3, Star, Award, Eye, TrendingUp, Briefcase,
  CheckCircle, X, Info, ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

interface HRDashboardProps { user: AuthUser; }

const HRDashboard = ({ user: authUser }: HRDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [hrProfile, setHrProfile] = useState<any>(null);
  const [shortlists, setShortlists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [minERS, setMinERS] = useState("");
  const [filterMajor, setFilterMajor] = useState("all");
  const [filterCert, setFilterCert] = useState("all");
  const [majors, setMajors] = useState<string[]>([]);
  const [certNames, setCertNames] = useState<string[]>([]);
  const [studentCerts, setStudentCerts] = useState<any[]>([]);
  const [viewingProfile, setViewingProfile] = useState<any>(null);

  const loadDashboard = useCallback(async () => {
    const [{ data: hr }, { data: students }, { data: sl }, { data: majorsList }] = await Promise.all([
      supabase.from("hr_profiles").select("*").eq("user_id", authUser.id).single(),
      supabase.from("student_profiles")
        .select("*, profiles!inner(full_name, avatar_url, email, user_id)")
        .eq("visibility_public", true)
        .order("ers_score", { ascending: false })
        .limit(200),
      supabase.from("hr_shortlists").select("*").eq("hr_user_id", authUser.id),
      supabase.from("majors_repository").select("name").order("name"),
    ]);

    setHrProfile(hr);
    setCandidates(students || []);
    setShortlists(sl || []);
    setMajors([...new Set((majorsList || []).map((m: any) => m.name))]);
    setLoading(false);
  }, [authUser.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleShortlist = async (studentUserId: string) => {
    const exists = shortlists.find(s => s.student_user_id === studentUserId);
    if (exists) {
      await supabase.from("hr_shortlists").delete().eq("id", exists.id);
      toast({ title: "Removed from shortlist" });
    } else {
      await supabase.from("hr_shortlists").insert({ hr_user_id: authUser.id, student_user_id: studentUserId });
      toast({ title: "Added to shortlist" });
    }
    const { data: sl } = await supabase.from("hr_shortlists").select("*").eq("hr_user_id", authUser.id);
    setShortlists(sl || []);
  };

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

  const filtered = candidates.filter(s => {
    if (searchQuery && !s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (minERS && (s.ers_score || 0) < parseInt(minERS)) return false;
    if (filterMajor !== "all" && s.major !== filterMajor) return false;
    return true;
  });

  const avgERS = candidates.length > 0
    ? Math.round(candidates.reduce((a, s) => a + (s.ers_score || 0), 0) / candidates.length)
    : 0;
  const topTalent = candidates.filter(s => (s.ers_score || 0) > 85).length;

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">HR Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome, {authUser.full_name} — {hrProfile?.company_name || "Company"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Verified Candidates" value={candidates.length} delay={0} />
        <StatCard icon={TrendingUp} label="Avg ERS" value={avgERS} delay={0.1} />
        <StatCard icon={Star} label="Top Talent (>85)" value={topTalent} delay={0.2} />
        <StatCard icon={Briefcase} label="Shortlisted" value={shortlists.length} delay={0.3} />
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search"><Search className="h-4 w-4 mr-1 hidden sm:inline" />Candidates</TabsTrigger>
          <TabsTrigger value="shortlist"><Star className="h-4 w-4 mr-1 hidden sm:inline" />Shortlist</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <div className="rounded-xl border bg-card p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} maxLength={100} />
              </div>
              <Input placeholder="Min ERS" type="number" min={0} max={100} value={minERS} onChange={e => setMinERS(e.target.value)} />
              <Select value={filterMajor} onValueChange={setFilterMajor}>
                <SelectTrigger><SelectValue placeholder="Major" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Majors</SelectItem>
                  {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground flex items-center">{filtered.length} candidates</div>
            </div>
            <div className="space-y-3">
              {filtered.slice(0, 50).map((s, i) => {
                const isShortlisted = shortlists.some(sl => sl.student_user_id === s.user_id);
                return (
                  <motion.div key={s.user_id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{s.profiles?.full_name || "Student"}</span>
                        {s.onboarding_completed && <Badge className="text-[10px] bg-primary/10 text-primary">Verified</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.university} · {s.major} · GPA {s.gpa}/{s.gpa_scale === "5" ? "5.0" : "4.0"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xl font-bold text-primary">{Math.round(s.ers_score || 0)}</p>
                        <p className="text-[10px] text-muted-foreground">ERS</p>
                      </div>
                      <Button size="sm" variant={isShortlisted ? "default" : "outline"} onClick={() => handleShortlist(s.user_id)}>
                        <Star className={`h-4 w-4 ${isShortlisted ? "fill-current" : ""}`} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setViewingProfile(s)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No candidates match your filters.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shortlist">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Shortlisted Candidates ({shortlists.length})</h3>
            {shortlists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No candidates shortlisted yet. Use the Candidates tab to discover and shortlist talent.</p>
            ) : (
              <div className="space-y-3">
                {shortlists.map((sl, i) => {
                  const student = candidates.find(c => c.user_id === sl.student_user_id);
                  if (!student) return null;
                  return (
                    <motion.div key={sl.id} className="flex items-center gap-4 rounded-lg border p-4"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.profiles?.full_name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{student.university} · {student.major}</p>
                      </div>
                      <p className="font-bold text-primary">{Math.round(student.ers_score || 0)} ERS</p>
                      <Button size="sm" variant="ghost" onClick={() => handleShortlist(sl.student_user_id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">ERS Distribution</h3>
              <div className="space-y-3">
                {[
                  { range: "90-100", count: candidates.filter(s => s.ers_score >= 90).length },
                  { range: "80-89", count: candidates.filter(s => s.ers_score >= 80 && s.ers_score < 90).length },
                  { range: "70-79", count: candidates.filter(s => s.ers_score >= 70 && s.ers_score < 80).length },
                  { range: "60-69", count: candidates.filter(s => s.ers_score >= 60 && s.ers_score < 70).length },
                  { range: "<60", count: candidates.filter(s => s.ers_score < 60).length },
                ].map(d => (
                  <div key={d.range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>ERS {d.range}</span>
                      <span className="font-semibold">{d.count}</span>
                    </div>
                    <Progress value={candidates.length > 0 ? (d.count / candidates.length) * 100 : 0} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Top Majors by ERS</h3>
              <div className="space-y-2">
                {[...new Set(candidates.map(c => c.major))].map(major => {
                  const majorStudents = candidates.filter(c => c.major === major);
                  const avg = Math.round(majorStudents.reduce((a, s) => a + (s.ers_score || 0), 0) / majorStudents.length);
                  return { major, avg, count: majorStudents.length };
                }).sort((a, b) => b.avg - a.avg).slice(0, 10).map((m, i) => (
                  <div key={m.major} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{m.major}</p>
                      <p className="text-xs text-muted-foreground">{m.count} students</p>
                    </div>
                    <p className="font-bold text-primary">{m.avg} avg</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Profile Viewer Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingProfile(null)}>
          <motion.div className="bg-card rounded-xl border shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-heading">{viewingProfile.profiles?.full_name || "Student Profile"}</h3>
              <Button size="sm" variant="ghost" onClick={() => setViewingProfile(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <ERSGauge score={Math.round(viewingProfile.ers_score || 0)} size={140} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">University</p><p className="text-sm font-medium">{viewingProfile.university}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Major</p><p className="text-sm font-medium">{viewingProfile.major}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">GPA</p><p className="text-sm font-medium">{viewingProfile.gpa}/{viewingProfile.gpa_scale === "5" ? "5.0" : "4.0"}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Career Target</p><p className="text-sm font-medium">{viewingProfile.career_target || "—"}</p></div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-2">Score Breakdown</p>
                {[
                  { label: "Academic", value: viewingProfile.academic_score || 0, weight: "40%" },
                  { label: "Certifications", value: viewingProfile.certification_score || 0, weight: "25%" },
                  { label: "Projects", value: viewingProfile.project_score || 0, weight: "15%" },
                  { label: "Soft Skills", value: viewingProfile.soft_skills_score || 0, weight: "10%" },
                  { label: "Conduct", value: viewingProfile.conduct_score || 0, weight: "10%" },
                ].map(item => (
                  <div key={item.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.label} ({item.weight})</span>
                      <span className="font-semibold">{Math.round(item.value)}/100</span>
                    </div>
                    <Progress value={item.value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
