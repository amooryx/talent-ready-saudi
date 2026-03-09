import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser } from "@/lib/supabaseAuth";
import {
  University, Users, BarChart3, Upload, FileCheck, TrendingUp,
  CheckCircle, Activity, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UniversityDashboardProps { user: AuthUser; }

const UniversityDashboard = ({ user: authUser }: UniversityDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uniProfile, setUniProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    const [{ data: uni }, { data: studentsData }, { data: pendingData }] = await Promise.all([
      supabase.from("university_profiles").select("*").eq("user_id", authUser.id).single(),
      supabase.from("student_profiles")
        .select("*, profiles!inner(full_name, email, user_id)")
        .order("ers_score", { ascending: false })
        .limit(200),
      supabase.from("verification_requests")
        .select("*, profiles!inner(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    setUniProfile(uni);
    // Filter students by university if we have a university profile
    const uniName = uni?.university_name || "";
    const filtered = uniName
      ? (studentsData || []).filter((s: any) => s.university?.toLowerCase().includes(uniName.toLowerCase()))
      : (studentsData || []);
    setStudents(filtered);
    setVerifications(pendingData || []);
    setLoading(false);
  }, [authUser.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleVerification = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("verification_requests").update({
      status,
      reviewer_id: authUser.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    toast({ title: `Verification ${status}` });
    loadDashboard();
  };

  const handleConductUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.csv,.xlsx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { toast({ title: "File too large", description: "Max 10MB", variant: "destructive" }); return; }
      const path = `${authUser.id}/conduct/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Conduct records uploaded", description: "File uploaded successfully for processing." });
    };
    input.click();
  }, [authUser.id, toast]);

  const handleAttendanceUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.csv,.xlsx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { toast({ title: "File too large", description: "Max 10MB", variant: "destructive" }); return; }
      const path = `${authUser.id}/attendance/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Attendance records uploaded", description: "File uploaded successfully for processing." });
    };
    input.click();
  }, [authUser.id, toast]);

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

  const avgERS = students.length > 0
    ? Math.round(students.reduce((a, s) => a + (s.ers_score || 0), 0) / students.length) : 0;
  const topPerformers = students.filter(s => (s.ers_score || 0) > 80).length;
  const atRisk = students.filter(s => (s.ers_score || 0) < 40).length;

  // Major distribution for cohort analytics
  const majorStats = [...new Set(students.map(s => s.major))].map(major => {
    const group = students.filter(s => s.major === major);
    const avg = Math.round(group.reduce((a, s) => a + (s.ers_score || 0), 0) / group.length);
    return { major, count: group.length, avgERS: avg };
  }).sort((a, b) => b.avgERS - a.avgERS);

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">University Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome, {authUser.full_name} — {uniProfile?.university_name || "University"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Students" value={students.length} delay={0} />
        <StatCard icon={TrendingUp} label="Avg ERS" value={avgERS} delay={0.1} />
        <StatCard icon={CheckCircle} label="Top Performers (>80)" value={topPerformers} delay={0.2} />
        <StatCard icon={AlertTriangle} label="At Risk (<40)" value={atRisk} delay={0.3} />
      </div>

      <Tabs defaultValue="cohort" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cohort"><BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />Cohort Analytics</TabsTrigger>
          <TabsTrigger value="uploads"><Upload className="h-4 w-4 mr-1 hidden sm:inline" />Records Upload</TabsTrigger>
          <TabsTrigger value="verify"><FileCheck className="h-4 w-4 mr-1 hidden sm:inline" />Verifications</TabsTrigger>
        </TabsList>

        {/* Cohort Analytics */}
        <TabsContent value="cohort">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">ERS Distribution</h3>
              <div className="space-y-3">
                {[
                  { range: "90-100", min: 90, max: 101 },
                  { range: "80-89", min: 80, max: 90 },
                  { range: "70-79", min: 70, max: 80 },
                  { range: "60-69", min: 60, max: 70 },
                  { range: "<60", min: 0, max: 60 },
                ].map(d => {
                  const count = students.filter(s => (s.ers_score || 0) >= d.min && (s.ers_score || 0) < d.max).length;
                  return (
                    <div key={d.range}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>ERS {d.range}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <Progress value={students.length > 0 ? (count / students.length) * 100 : 0} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Major Readiness Rankings</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {majorStats.slice(0, 15).map((m, i) => (
                  <div key={m.major} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{m.major}</p>
                      <p className="text-xs text-muted-foreground">{m.count} students</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{m.avgERS}</p>
                      <p className="text-[10px] text-muted-foreground">avg ERS</p>
                    </div>
                  </div>
                ))}
                {majorStats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No student data available.</p>}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 md:col-span-2">
              <h3 className="font-semibold font-heading mb-4">Student Roster</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.slice(0, 50).map((s, i) => (
                  <motion.div key={s.user_id} className="flex items-center gap-4 rounded-lg border p-3"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.profiles?.full_name || "Student"}</p>
                      <p className="text-xs text-muted-foreground">{s.major} · GPA {s.gpa}/{s.gpa_scale === "5" ? "5.0" : "4.0"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{Math.round(s.ers_score || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">ERS</p>
                    </div>
                    {(s.ers_score || 0) < 40 && <Badge variant="destructive" className="text-[10px]">At Risk</Badge>}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Records Upload */}
        <TabsContent value="uploads">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Upload University Records</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Upload conduct and attendance records in CSV, PDF, or Excel format. Records will be processed and linked to student profiles.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 border-dashed flex flex-col gap-2" onClick={handleConductUpload}>
                <Upload className="h-6 w-6" />
                <span>Upload Conduct Records</span>
                <span className="text-[10px] text-muted-foreground">CSV, PDF, XLSX · Max 10MB</span>
              </Button>
              <Button variant="outline" className="h-24 border-dashed flex flex-col gap-2" onClick={handleAttendanceUpload}>
                <Upload className="h-6 w-6" />
                <span>Upload Attendance Records</span>
                <span className="text-[10px] text-muted-foreground">CSV, PDF, XLSX · Max 10MB</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Verifications */}
        <TabsContent value="verify">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Verification Queue ({verifications.length})</h3>
            {verifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending verifications.</p>
            ) : (
              <div className="space-y-3">
                {verifications.map((v, i) => (
                  <motion.div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{v.profiles?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{v.resource_type} · {new Date(v.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleVerification(v.id, "approved")}>
                        <CheckCircle className="h-4 w-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleVerification(v.id, "rejected")}>
                        Reject
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UniversityDashboard;
