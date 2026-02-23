import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "@/components/StatCard";
import ERSGauge from "@/components/ERSGauge";
import {
  type StoredUser, type Opportunity, type Application,
  getStudents, calculateERS, UNIVERSITIES, ALL_MAJORS,
  getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity,
  getOpportunityApplications, updateApplicationStatus, getUserById,
  calculateMatchScore, getNotifications, markNotificationRead, CERTIFICATION_POINTS,
} from "@/lib/authStore";
import type { AuthUser } from "@/lib/supabaseAuth";
import {
  Search, Users, BarChart3, Bell, Star, Award, Eye, TrendingUp, Briefcase,
  Plus, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, Building2, AlertTriangle, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HRDashboardProps { user: AuthUser; }

const typeLabels: Record<string, string> = { coop: "CO-OP", internship: "Internship", "part-time": "Part-time", junior: "Junior" };

const HRDashboard = ({ user: authUser }: HRDashboardProps) => {
  const { toast } = useToast();

  // Bridge to mock data
  const allUsers = getStudents();
  const mockUser = allUsers.find(s => s.email === authUser.email) as StoredUser | undefined;
  const user = mockUser || { id: authUser.id, name: authUser.full_name, email: authUser.email, company: "Company" } as StoredUser;
  const [searchQuery, setSearchQuery] = useState("");
  const [minERS, setMinERS] = useState("");
  const [filterMajor, setFilterMajor] = useState("all");
  const [filterUni, setFilterUni] = useState("all");
  const [coopOnly, setCoopOnly] = useState(false);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  // Opportunity management
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [oppForm, setOppForm] = useState<Record<string, any>>({});
  const [viewingOppId, setViewingOppId] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<StoredUser | null>(null);
  const [sortBy, setSortBy] = useState<"match" | "ers" | "gpa">("match");

  const notifications = getNotifications(user.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  const students = getStudents().map(s => ({ ...s, ers: calculateERS(s) }));
  const myOpps = getOpportunities().filter(o => o.hrId === user.id);

  const filtered = students.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(s.certifications || []).some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (minERS && s.ers < parseInt(minERS)) return false;
    if (filterMajor !== "all" && s.major !== filterMajor) return false;
    if (filterUni !== "all" && s.university !== filterUni) return false;
    if (coopOnly && !s.coopEligible) return false;
    return true;
  }).sort((a, b) => b.ers - a.ers);

  const handleCreateOpp = () => {
    if (!oppForm.title || !oppForm.type) { toast({ title: "Missing Fields", description: "Title and type are required.", variant: "destructive" }); return; }
    createOpportunity({
      hrId: user.id, title: oppForm.title, type: oppForm.type,
      company: user.company || "Company", department: oppForm.department || "",
      requiredMajors: oppForm.requiredMajors ? oppForm.requiredMajors.split(",").map((m: string) => m.trim()) : [],
      minERS: parseInt(oppForm.minERS) || 0, minGPA: parseFloat(oppForm.minGPA) || 0,
      requiredCerts: oppForm.requiredCerts ? oppForm.requiredCerts.split(",").map((c: string) => c.trim()) : [],
      skills: oppForm.skills ? oppForm.skills.split(",").map((s: string) => s.trim()) : [],
      location: oppForm.location || "Riyadh", workMode: oppForm.workMode || "onsite",
      duration: oppForm.duration || "", deadline: oppForm.deadline || "",
      positions: parseInt(oppForm.positions) || 1, description: oppForm.description || "",
      status: "open",
    });
    toast({ title: "Opportunity Created" });
    setShowCreateForm(false); setOppForm({}); refresh();
  };

  const handleStatusChange = (appId: string, status: Application["status"]) => {
    updateApplicationStatus(appId, status);
    toast({ title: `Application ${status}` });
    refresh();
  };

  // Viewing opportunity applicants
  const viewingOpp = viewingOppId ? getOpportunities().find(o => o.id === viewingOppId) : null;
  const applicants = viewingOppId ? getOpportunityApplications(viewingOppId) : [];
  const sortedApplicants = [...applicants].sort((a, b) => {
    if (sortBy === "match") return b.matchScore - a.matchScore;
    const sa = getUserById(a.studentId); const sb = getUserById(b.studentId);
    if (sortBy === "ers") return calculateERS(sb!) - calculateERS(sa!);
    return (sb?.gpa || 0) - (sa?.gpa || 0);
  });

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">HR Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome, {user.name} — {user.company || "Company"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Candidates" value={students.length} delay={0} />
        <StatCard icon={TrendingUp} label="Avg ERS" value={students.length > 0 ? Math.round(students.reduce((a, s) => a + s.ers, 0) / students.length) : 0} delay={0.1} />
        <StatCard icon={Briefcase} label="My Opportunities" value={myOpps.length} delay={0.2} />
        <StatCard icon={Star} label="Top Talent (ERS>85)" value={students.filter(s => s.ers > 85).length} delay={0.3} />
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search"><Search className="h-4 w-4 mr-1 hidden sm:inline" />Candidates</TabsTrigger>
          <TabsTrigger value="opportunities"><Briefcase className="h-4 w-4 mr-1 hidden sm:inline" />Opportunities</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />Analytics</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            <Bell className="h-4 w-4 mr-1 hidden sm:inline" />Alerts
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">{unreadCount}</span>}
          </TabsTrigger>
        </TabsList>

        {/* Candidate Search */}
        <TabsContent value="search">
          <div className="rounded-xl border bg-card p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name or cert..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} maxLength={100} />
              </div>
              <Input placeholder="Min ERS" type="number" min={0} max={100} value={minERS} onChange={e => setMinERS(e.target.value)} />
              <Select value={filterMajor} onValueChange={setFilterMajor}>
                <SelectTrigger><SelectValue placeholder="Major" /></SelectTrigger>
                <SelectContent className="max-h-60"><SelectItem value="all">All Majors</SelectItem>{ALL_MAJORS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filterUni} onValueChange={setFilterUni}>
                <SelectTrigger><SelectValue placeholder="University" /></SelectTrigger>
                <SelectContent className="max-h-60"><SelectItem value="all">All Universities</SelectItem>{UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant={coopOnly ? "default" : "outline"} onClick={() => setCoopOnly(!coopOnly)} className="text-xs">CO-OP Ready</Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{filtered.length} candidates found</p>
            <div className="space-y-3">
              {filtered.map((s, i) => (
                <motion.div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold shrink-0">{s.avatar || "?"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{s.name}</span>
                      {(s.badges || []).map(b => <Badge key={b} className="text-[10px] bg-accent text-accent-foreground">{b}</Badge>)}
                      {s.coopEligible && <Badge className="text-[10px] bg-primary/10 text-primary">CO-OP Ready</Badge>}
                      {(s.conductRecords || []).length > 0 && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-0.5" />Conduct Flag</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.university} · {s.major} · GPA {s.gpa}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(s.certifications || []).filter(c => c.verified).map(c => <Badge key={c.name} variant="outline" className="text-[10px]">{c.name}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center"><p className="text-xl font-bold text-primary">{s.ers}</p><p className="text-[10px] text-muted-foreground">ERS</p></div>
                    <Button size="sm" variant="outline" onClick={() => setViewingProfile(s)}><Eye className="h-4 w-4 mr-1" />View</Button>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No candidates match.</p>}
            </div>
          </div>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities">
          {viewingOppId && viewingOpp ? (
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setViewingOppId(null)} className="mb-2"><X className="h-4 w-4 mr-1" />Back</Button>
                  <h3 className="text-lg font-semibold font-heading">{viewingOpp.title} — Applicants ({applicants.length})</h3>
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">AI Match Ranking</SelectItem>
                      <SelectItem value="ers">Sort by ERS</SelectItem>
                      <SelectItem value="gpa">Sort by GPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {sortedApplicants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No applicants yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedApplicants.map((app, i) => {
                    const student = getUserById(app.studentId);
                    if (!student) return null;
                    const ers = calculateERS(student);
                    const statusColors: Record<string, string> = {
                      submitted: "bg-primary/10 text-primary", under_review: "bg-secondary/10 text-secondary",
                      shortlisted: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive",
                      accepted: "bg-success/20 text-success", interviewed: "bg-primary/20 text-primary",
                    };
                    return (
                      <motion.div key={app.id} className="rounded-lg border p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold shrink-0">{student.avatar || "?"}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{student.name}</span>
                              <Badge className={`text-[10px] ${statusColors[app.status] || ""}`}>{app.status.replace("_", " ")}</Badge>
                              {(student.conductRecords || []).length > 0 && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-0.5" />Conduct</Badge>}
                              {student.coopEligible && <Badge className="text-[10px] bg-primary/10 text-primary">CO-OP Ready</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{student.university} · {student.major} · GPA {student.gpa}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center"><p className="text-lg font-bold text-primary">{app.matchScore}%</p><p className="text-[10px] text-muted-foreground">Match</p></div>
                            <div className="text-center"><p className="text-lg font-bold">{ers}</p><p className="text-[10px] text-muted-foreground">ERS</p></div>
                            <Button size="sm" variant="outline" onClick={() => setViewingProfile(student)}><Eye className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {["shortlisted", "interviewed", "accepted", "rejected"].map(status => (
                            <Button key={status} size="sm" variant={app.status === status ? "default" : "outline"} className="text-xs capitalize"
                              onClick={() => handleStatusChange(app.id, status as Application["status"])}>{status}</Button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold font-heading">My Opportunities</h3>
                <Button onClick={() => setShowCreateForm(!showCreateForm)}><Plus className="h-4 w-4 mr-1" />{showCreateForm ? "Cancel" : "Create New"}</Button>
              </div>

              {showCreateForm && (
                <div className="rounded-lg border bg-accent/30 p-6 mb-6 space-y-3">
                  <h4 className="font-semibold font-heading">New Opportunity</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label>Title *</Label><Input placeholder="e.g., Software Engineer Intern" value={oppForm.title || ""} onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))} maxLength={100} /></div>
                    <div><Label>Type *</Label>
                      <Select value={oppForm.type || ""} onValueChange={v => setOppForm(f => ({ ...f, type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent><SelectItem value="coop">CO-OP</SelectItem><SelectItem value="internship">Internship</SelectItem><SelectItem value="part-time">Part-time</SelectItem><SelectItem value="junior">Junior / Entry-Level</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Department</Label><Input placeholder="e.g., IT" value={oppForm.department || ""} onChange={e => setOppForm(f => ({ ...f, department: e.target.value }))} maxLength={100} /></div>
                    <div><Label>Location</Label><Input placeholder="e.g., Riyadh" value={oppForm.location || ""} onChange={e => setOppForm(f => ({ ...f, location: e.target.value }))} maxLength={100} /></div>
                    <div><Label>Work Mode</Label>
                      <Select value={oppForm.workMode || "onsite"} onValueChange={v => setOppForm(f => ({ ...f, workMode: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="onsite">On-site</SelectItem><SelectItem value="remote">Remote</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Duration</Label><Input placeholder="e.g., 6 months" value={oppForm.duration || ""} onChange={e => setOppForm(f => ({ ...f, duration: e.target.value }))} maxLength={50} /></div>
                    <div><Label>Min ERS</Label><Input type="number" min={0} max={100} value={oppForm.minERS || ""} onChange={e => setOppForm(f => ({ ...f, minERS: e.target.value }))} /></div>
                    <div><Label>Min GPA</Label><Input type="number" step="0.1" min={0} max={4} value={oppForm.minGPA || ""} onChange={e => setOppForm(f => ({ ...f, minGPA: e.target.value }))} /></div>
                    <div><Label>Positions</Label><Input type="number" min={1} value={oppForm.positions || ""} onChange={e => setOppForm(f => ({ ...f, positions: e.target.value }))} /></div>
                    <div><Label>Deadline</Label><Input type="date" value={oppForm.deadline || ""} onChange={e => setOppForm(f => ({ ...f, deadline: e.target.value }))} /></div>
                    <div className="sm:col-span-2"><Label>Required Majors (comma-separated)</Label><Input placeholder="e.g., Software Engineering, Computer Science" value={oppForm.requiredMajors || ""} onChange={e => setOppForm(f => ({ ...f, requiredMajors: e.target.value }))} /></div>
                    <div className="sm:col-span-2"><Label>Skills (comma-separated)</Label><Input placeholder="e.g., Python, React, SQL" value={oppForm.skills || ""} onChange={e => setOppForm(f => ({ ...f, skills: e.target.value }))} /></div>
                    <div className="sm:col-span-2"><Label>Required Certifications (comma-separated)</Label><Input placeholder="e.g., AWS Solutions Architect" value={oppForm.requiredCerts || ""} onChange={e => setOppForm(f => ({ ...f, requiredCerts: e.target.value }))} /></div>
                    <div className="sm:col-span-2"><Label>Description</Label><Textarea placeholder="Describe the role..." value={oppForm.description || ""} onChange={e => setOppForm(f => ({ ...f, description: e.target.value }))} maxLength={1000} /></div>
                  </div>
                  <Button onClick={handleCreateOpp}>Create Opportunity</Button>
                </div>
              )}

              <div className="space-y-3">
                {myOpps.map((opp, i) => {
                  const apps = getOpportunityApplications(opp.id);
                  return (
                    <motion.div key={opp.id} className="rounded-lg border p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{opp.title}</span>
                            <Badge variant="secondary" className="text-[10px]">{typeLabels[opp.type] || opp.type}</Badge>
                            <Badge className={`text-[10px] ${opp.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{opp.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{opp.location} · {opp.workMode} · Deadline: {opp.deadline} · {apps.length} applicants</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewingOppId(opp.id)}><Eye className="h-4 w-4 mr-1" />Applicants ({apps.length})</Button>
                          <Button size="sm" variant="outline" onClick={() => { updateOpportunity(opp.id, { status: opp.status === "open" ? "closed" : "open" }); refresh(); }}>
                            {opp.status === "open" ? "Close" : "Reopen"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { deleteOpportunity(opp.id); refresh(); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {myOpps.length === 0 && !showCreateForm && <p className="text-sm text-muted-foreground text-center py-8">No opportunities posted. Create one to start receiving applications.</p>}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Top In-Demand Skills</h3>
              <div className="space-y-3">
                {[
                  { skill: "Python", count: 85 }, { skill: "Cloud Security", count: 72 },
                  { skill: "React", count: 68 }, { skill: "Data Analysis", count: 60 }, { skill: "Machine Learning", count: 55 },
                ].map(s => (
                  <div key={s.skill}><div className="flex justify-between text-sm mb-1"><span>{s.skill}</span><span className="text-muted-foreground">{s.count}% demand</span></div><Progress value={s.count} className="h-2" /></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Top Universities by ERS</h3>
              <div className="space-y-3">
                {UNIVERSITIES.slice(0, 8).map(u => {
                  const uStudents = students.filter(s => s.university === u);
                  if (uStudents.length === 0) return null;
                  const avgErs = Math.round(uStudents.reduce((a, s) => a + s.ers, 0) / uStudents.length);
                  return (
                    <div key={u} className="flex items-center justify-between rounded-lg border p-3">
                      <div><p className="font-medium text-sm">{u}</p><p className="text-xs text-muted-foreground">{uStudents.length} students</p></div>
                      <div className="text-right"><p className="font-bold text-primary">{avgErs}</p><p className="text-[10px] text-muted-foreground">Avg ERS</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Notifications & Alerts</h3>
            <div className="space-y-3">
              {notifications.length === 0 && students.filter(s => s.ers >= 85).length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No alerts.</p>}
              {notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${n.read ? "" : "bg-accent/50 border-primary/20"}`}
                  onClick={() => { markNotificationRead(n.id); refresh(); }}>
                  <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div><p className="text-sm">{n.text}</p><p className="text-xs text-muted-foreground mt-1">{new Date(n.time).toLocaleString()}</p></div>
                </div>
              ))}
              {notifications.length === 0 && students.filter(s => s.ers >= 85).slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                  <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div><p className="text-sm">{s.name} has ERS {s.ers} — Top talent in {s.major}</p><p className="text-xs text-muted-foreground mt-1">{s.university}</p></div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Profile Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setViewingProfile(null)}>
          <motion.div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xl font-bold">{viewingProfile.avatar || "?"}</div>
                <div>
                  <h3 className="text-xl font-bold font-heading">{viewingProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewingProfile.university} · {viewingProfile.major} · GPA {viewingProfile.gpa}</p>
                  <div className="flex gap-1 mt-1">
                    {viewingProfile.coopEligible && <Badge className="text-[10px] bg-primary/10 text-primary">CO-OP Ready</Badge>}
                    {viewingProfile.transcriptVerified && <Badge className="text-[10px] bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-0.5" />Verified</Badge>}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingProfile(null)}><X className="h-5 w-5" /></Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border p-4 text-center">
                <ERSGauge score={calculateERS(viewingProfile)} size={100} />
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                {[
                  { label: "Academic", value: viewingProfile.academicScore || 0 },
                  { label: "Certifications", value: Math.round(Math.min(100, ((viewingProfile.certifications || []).filter(c => c.verified).reduce((s, c) => s + (CERTIFICATION_POINTS[c.name] || 5), 0) / 60) * 100)) },
                  { label: "Projects", value: Math.min(100, (viewingProfile.projects || []).length * 25) },
                  { label: "Soft Skills", value: Math.round(Math.min(100, ((viewingProfile.activities || []).reduce((s, a) => s + a.points, 0) / 40) * 100)) },
                  { label: "Conduct", value: Math.max(0, 100 - (viewingProfile.conductRecords || []).reduce((s, r) => s + r.impactPoints, 0)) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs"><span>{item.label}</span><span className="font-semibold">{item.value}/100</span></div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-sm mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-1">{(viewingProfile.certifications || []).map(c => (
                  <Badge key={c.name} variant="secondary" className="text-[10px]">{c.name} {c.verified && <CheckCircle className="h-3 w-3 ml-0.5 text-success" />} {c.verified && <span className="ml-0.5 text-primary">+{CERTIFICATION_POINTS[c.name] || 5}</span>}</Badge>
                ))}</div>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-sm mb-2">Projects</h4>
                <div className="flex flex-wrap gap-1">{(viewingProfile.projects || []).map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}</div>
              </div>
              {(viewingProfile.activities || []).length > 0 && (
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-sm mb-2">Activities</h4>
                  <div className="flex flex-wrap gap-1">{(viewingProfile.activities || []).map((a, i) => <Badge key={i} variant="outline" className="text-[10px]">{a.name} +{a.points}</Badge>)}</div>
                </div>
              )}
              {(viewingProfile.conductRecords || []).length > 0 && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h4 className="font-semibold text-sm mb-2 text-destructive">Conduct Records</h4>
                  {(viewingProfile.conductRecords || []).map((r, i) => (
                    <div key={i} className="text-xs text-muted-foreground"><span className="text-destructive font-medium">{r.type}:</span> {r.description} ({r.date}) -{r.impactPoints}pts</div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
