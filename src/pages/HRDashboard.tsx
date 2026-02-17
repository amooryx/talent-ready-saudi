import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/StatCard";
import { students, universities, majors, companies } from "@/lib/mockData";
import { Search, Users, BarChart3, Bell, Filter, Star, Award, Eye, TrendingUp, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HRDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [minERS, setMinERS] = useState("");
  const [filterMajor, setFilterMajor] = useState("all");
  const [filterUni, setFilterUni] = useState("all");

  const filtered = students.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.certifications.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (minERS && s.ers < parseInt(minERS)) return false;
    if (filterMajor !== "all" && s.major !== filterMajor) return false;
    if (filterUni !== "all" && s.university !== filterUni) return false;
    return true;
  }).sort((a, b) => b.ers - a.ers);

  const topSkills = [
    { skill: "Python", count: 85 }, { skill: "Cloud Security", count: 72 },
    { skill: "React", count: 68 }, { skill: "Data Analysis", count: 60 },
    { skill: "Machine Learning", count: 55 },
  ];

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">HR Dashboard</h1>
        <p className="text-muted-foreground text-sm">Find and evaluate verified Saudi talent</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Candidates" value={students.length} delay={0} />
        <StatCard icon={TrendingUp} label="Avg ERS" value={Math.round(students.reduce((a, s) => a + s.ers, 0) / students.length)} delay={0.1} />
        <StatCard icon={Award} label="Certified" value={students.filter(s => s.certifications.length > 0).length} delay={0.2} />
        <StatCard icon={Star} label="Top Talent (ERS>85)" value={students.filter(s => s.ers > 85).length} delay={0.3} />
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search"><Search className="h-4 w-4 mr-1 hidden sm:inline" />Candidate Search</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />Analytics</TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="h-4 w-4 mr-1 hidden sm:inline" />Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <div className="rounded-xl border bg-card p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name or skill..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} maxLength={100} />
              </div>
              <Input placeholder="Min ERS (e.g. 80)" type="number" min={0} max={100} value={minERS} onChange={e => setMinERS(e.target.value)} />
              <Select value={filterMajor} onValueChange={setFilterMajor}>
                <SelectTrigger><SelectValue placeholder="Major" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Majors</SelectItem>
                  {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterUni} onValueChange={setFilterUni}>
                <SelectTrigger><SelectValue placeholder="University" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{filtered.length} candidates found</p>

            <div className="space-y-3">
              {filtered.map((s, i) => (
                <motion.div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold shrink-0">
                    {s.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{s.name}</span>
                      {s.badges.map(b => <Badge key={b} className="text-[10px] bg-accent/20 text-accent-foreground border-accent/30">{b}</Badge>)}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.university} · {s.major} · GPA {s.gpa}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {s.certifications.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">{s.ers}</p>
                      <p className="text-[10px] text-muted-foreground">ERS</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">{s.roadmapProgress}%</p>
                      <p className="text-[10px] text-muted-foreground">Roadmap</p>
                    </div>
                    <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />View</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Top In-Demand Skills</h3>
              <div className="space-y-3">
                {topSkills.map((s, i) => (
                  <div key={s.skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{s.skill}</span>
                      <span className="text-muted-foreground">{s.count}% demand</span>
                    </div>
                    <Progress value={s.count} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Top Universities by ERS</h3>
              <div className="space-y-3">
                {universities.map(u => {
                  const uStudents = students.filter(s => s.university === u);
                  const avgErs = Math.round(uStudents.reduce((a, s) => a + s.ers, 0) / uStudents.length);
                  return (
                    <div key={u} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">{u}</p>
                        <p className="text-xs text-muted-foreground">{uStudents.length} students</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{avgErs}</p>
                        <p className="text-[10px] text-muted-foreground">Avg ERS</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2 rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Industry-Ready Candidates by Major</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {majors.map(m => {
                  const mStudents = students.filter(s => s.major === m);
                  const ready = mStudents.filter(s => s.ers >= 80).length;
                  return (
                    <div key={m} className="text-center rounded-lg border p-4">
                      <p className="text-3xl font-bold font-heading text-primary">{ready}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m}</p>
                      <p className="text-[10px] text-muted-foreground">ERS ≥ 80</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Talent Alerts</h3>
            <div className="space-y-3">
              {[
                { text: "Ahmed Al-Farsi reached ERS 92 — Top 1% in Cybersecurity", time: "2h ago" },
                { text: "3 new students matched your Cybersecurity talent pool criteria", time: "1d ago" },
                { text: "Sara Al-Mutairi completed AWS Solutions Architect certification", time: "3d ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                  <Bell className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRDashboard;
