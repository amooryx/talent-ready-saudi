import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { untypedTable } from "@/lib/untypedTable";
import { Trophy, Users, TrendingUp, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const PublicLeaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [uniStats, setUniStats] = useState<any[]>([]);
  const [tab, setTab] = useState<"students" | "universities">("students");
  const [filterMajor, setFilterMajor] = useState("all");
  const [filterUni, setFilterUni] = useState("all");
  const [majors, setMajors] = useState<string[]>([]);
  const [unis, setUnis] = useState<string[]>([]);
  const [badges, setBadges] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    const load = async () => {
      const [{ data: studentsData }, { data: badgesData }] = await Promise.all([
        supabase.from("student_profiles")
          .select("user_id, university, major, ers_score, gpa, gpa_scale, visibility_public, profiles!inner(full_name, avatar_url)")
          .eq("visibility_public", true)
          .order("ers_score", { ascending: false })
          .limit(200),
        untypedTable("student_badges").select("*"),
      ]);
      const data = studentsData || [];
      setStudents(data);
      setMajors([...new Set(data.map((s: any) => s.major).filter(Boolean))]);
      setUnis([...new Set(data.map((s: any) => s.university).filter(Boolean))]);

      // Badge map
      const bMap = new Map<string, any[]>();
      (badgesData || []).forEach((b: any) => {
        const arr = bMap.get(b.user_id) || [];
        arr.push(b);
        bMap.set(b.user_id, arr);
      });
      setBadges(bMap);

      // University aggregation
      const uniMap = new Map<string, { count: number; totalERS: number }>();
      data.forEach((s: any) => {
        const entry = uniMap.get(s.university) || { count: 0, totalERS: 0 };
        entry.count++;
        entry.totalERS += s.ers_score || 0;
        uniMap.set(s.university, entry);
      });
      setUniStats(
        [...uniMap.entries()].map(([name, v]) => ({
          name, count: v.count, avgERS: Math.round(v.totalERS / v.count),
        })).sort((a, b) => b.avgERS - a.avgERS)
      );

      setLoading(false);
    };
    load();
  }, []);

  const filtered = students.filter(s => {
    if (filterMajor !== "all" && s.major !== filterMajor) return false;
    if (filterUni !== "all" && s.university !== filterUni) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="container max-w-4xl py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-heading">
          <Trophy className="h-8 w-8 inline mr-2 text-[hsl(var(--gold))]" />
          National Leaderboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Top students ranked by Employability Readiness Score</p>
      </div>

      <div className="flex gap-2 justify-center">
        <Button size="sm" variant={tab === "students" ? "default" : "outline"} onClick={() => setTab("students")}>
          <Users className="h-4 w-4 mr-1" />Students
        </Button>
        <Button size="sm" variant={tab === "universities" ? "default" : "outline"} onClick={() => setTab("universities")}>
          <Building2 className="h-4 w-4 mr-1" />Universities
        </Button>
      </div>

      {tab === "students" && (
        <>
          <div className="flex gap-3 justify-center flex-wrap">
            <Select value={filterUni} onValueChange={setFilterUni}>
              <SelectTrigger className="w-48"><SelectValue placeholder="University" /></SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Universities</SelectItem>
                {unis.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMajor} onValueChange={setFilterMajor}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Major" /></SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Majors</SelectItem>
                {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-2">
            {filtered.slice(0, 100).map((s, i) => {
              const sBadges = badges.get(s.user_id) || [];
              return (
                <motion.div key={s.user_id}
                  className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                  <span className={`w-8 text-center font-bold text-lg ${i < 3 ? "text-[hsl(var(--gold))]" : "text-muted-foreground"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${s.user_id}`} className="font-medium text-sm truncate hover:text-primary transition-colors">
                        {(s as any).profiles?.full_name || "Student"}
                      </Link>
                      {sBadges.slice(0, 3).map(b => (
                        <span key={b.id} className="text-xs" title={b.badge_label}>{b.badge_icon}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.university} · {s.major}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{Math.round(s.ers_score || 0)}</p>
                    <p className="text-[10px] text-muted-foreground">ERS</p>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No students found.</p>}
          </div>
        </>
      )}

      {tab === "universities" && (
        <div className="rounded-xl border bg-card p-6 space-y-2">
          {uniStats.map((u, i) => (
            <motion.div key={u.name} className="flex items-center gap-4 rounded-lg border p-4"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <span className={`w-8 text-center font-bold text-lg ${i < 3 ? "text-[hsl(var(--gold))]" : "text-muted-foreground"}`}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.count} students</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{u.avgERS}</p>
                <p className="text-[10px] text-muted-foreground">Avg ERS</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">Powered by HireQimah · Updated in real-time</p>
      </div>
    </div>
  );
};

export default PublicLeaderboard;
