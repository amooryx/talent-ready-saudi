import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ERSGauge from "@/components/ERSGauge";
import StatCard from "@/components/StatCard";
import { roadmapItems } from "@/lib/mockData";
import {
  type StoredUser, type Opportunity, getStudents, calculateERS, updateUser, validateFile,
  getOpportunities, getStudentApplications, applyToOpportunity, withdrawApplication,
  calculateMatchScore, getNotifications, markNotificationRead, CERTIFICATION_POINTS,
} from "@/lib/authStore";
import type { AuthUser } from "@/lib/supabaseAuth";
import {
  Trophy, Target, Briefcase, Map, Bell, Upload, Award,
  TrendingUp, Star, CheckCircle, Circle, Building2, Clock, MapPin, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentDashboardProps { user: AuthUser; }

const StudentDashboard = ({ user: authUser }: StudentDashboardProps) => {
  const { toast } = useToast();
  const [leaderFilter, setLeaderFilter] = useState<"global" | "university" | "major">("global");
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  // Bridge: use mock data user by email for now until full migration
  const allStudents = getStudents();
  const mockUser = allStudents.find(s => s.email === authUser.email) || allStudents[0];
  const user = mockUser || { id: authUser.id, name: authUser.full_name, email: authUser.email } as StoredUser;

  const ers = calculateERS(user);
  const opportunities = getOpportunities().filter(o => o.status === "open");
  const myApps = getStudentApplications(user.id);
  const notifications = getNotifications(user.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredStudents = leaderFilter === "university"
    ? allStudents.filter(s => s.university === user.university)
    : leaderFilter === "major" ? allStudents.filter(s => s.major === user.major)
    : allStudents;

  const sorted = [...filteredStudents].map(s => ({ ...s, ers: calculateERS(s) })).sort((a, b) => b.ers - a.ers);
  const myRank = sorted.findIndex(s => s.id === user.id) + 1;

  const handleFileUpload = useCallback((type: "transcript" | "certificate") => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".pdf,.png,.jpg,.jpeg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      const validation = validateFile(file);
      if (!validation.valid) { toast({ title: "Upload Rejected", description: validation.error, variant: "destructive" }); return; }
      if (type === "transcript") { updateUser(user.id, { transcriptUploaded: true }); toast({ title: "Transcript Uploaded", description: "Pending admin verification." }); }
      else { toast({ title: "Certificate Uploaded", description: "Pending verification." }); }
      refresh();
    };
    input.click();
  }, [user.id, toast]);

  const handleApply = (opp: Opportunity) => {
    const result = applyToOpportunity(user.id, opp.id);
    if (result.success) { toast({ title: "Applied!", description: `Application submitted for ${opp.title}` }); }
    else { toast({ title: "Cannot Apply", description: result.error, variant: "destructive" }); }
    refresh();
  };

  const handleWithdraw = (appId: string) => {
    if (withdrawApplication(appId, user.id)) { toast({ title: "Withdrawn", description: "Application withdrawn." }); }
    refresh();
  };

  const statusColors: Record<string, string> = {
    submitted: "bg-primary/10 text-primary", under_review: "bg-secondary/10 text-secondary",
    shortlisted: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive",
    accepted: "bg-success/20 text-success", interviewed: "bg-primary/20 text-primary",
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Welcome, {user.name}</h1>
          <p className="text-muted-foreground text-sm">
            {user.university || "No university"} · {user.major || "No major"} · GPA {user.gpa || "N/A"}{user.gpaScale === "5" ? "/5.0" : "/4.0"}
            {user.coopRequired && <span className="ml-2 text-primary font-medium">· CO-OP Required</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(user.badges || []).map(b => (
            <Badge key={b} className="bg-accent text-accent-foreground border-primary/20"><Star className="h-3 w-3 mr-1" />{b}</Badge>
          ))}
          {user.coopEligible && <Badge className="bg-primary/10 text-primary border-primary/20">CO-OP Ready</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="ERS Score" value={ers} delay={0} />
        <StatCard icon={Trophy} label="Rank" value={myRank > 0 ? `#${myRank}` : "—"} delay={0.1} />
        <StatCard icon={Award} label="Certifications" value={(user.certifications || []).length} delay={0.2} />
        <StatCard icon={Briefcase} label="Applications" value={myApps.length} delay={0.3} />
      </div>

      {!user.transcriptVerified && (
        <div className="rounded-lg border-2 border-primary/30 bg-accent p-4 flex items-center gap-3">
          <Upload className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Transcript not verified</p>
            <p className="text-xs text-muted-foreground">Upload your transcript to activate ERS scoring and appear on leaderboards.</p>
          </div>
          <Button size="sm" onClick={() => handleFileUpload("transcript")}>Upload</Button>
        </div>
      )}

      <Tabs defaultValue="ers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ers"><Target className="h-4 w-4 mr-1 hidden sm:inline" />ERS</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1 hidden sm:inline" />Leaderboard</TabsTrigger>
          <TabsTrigger value="roadmap"><Map className="h-4 w-4 mr-1 hidden sm:inline" />Roadmap</TabsTrigger>
          <TabsTrigger value="opportunities"><Briefcase className="h-4 w-4 mr-1 hidden sm:inline" />Jobs</TabsTrigger>
          <TabsTrigger value="applications"><Clock className="h-4 w-4 mr-1 hidden sm:inline" />My Apps</TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            <Bell className="h-4 w-4 mr-1 hidden sm:inline" />Alerts
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">{unreadCount}</span>}
          </TabsTrigger>
        </TabsList>

        {/* ERS Tab */}
        <TabsContent value="ers">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div className="md:col-span-1 rounded-xl border bg-card p-6 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ERSGauge score={ers} size={180} />
              {ers > 0 && <p className="mt-2 text-sm text-muted-foreground">Top {Math.max(1, Math.round((1 - (myRank - 1) / Math.max(1, allStudents.length)) * 100))}% of students</p>}
              {ers === 0 && <p className="mt-2 text-sm text-muted-foreground">Complete your profile to get your ERS</p>}
            </motion.div>
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold font-heading mb-4">Score Breakdown</h3>
                <p className="text-xs text-muted-foreground mb-1">ERS = (40% Academic) + (25% Certs) + (15% Projects) + (10% Soft Skills) + (10% Conduct)</p>
                <div className="space-y-4 mt-4">
                  {[
                    { label: "Academic Performance", value: user.academicScore || 0, weight: "40%" },
                    { label: "Certifications (Fixed Points)", value: Math.min(100, ((user.certifications || []).filter(c => c.verified).reduce((s, c) => s + (CERTIFICATION_POINTS[c.name] || 5), 0) / 60) * 100), weight: "25%" },
                    { label: "Projects", value: Math.min(100, (user.projects || []).length * 25), weight: "15%" },
                    { label: "Soft Skills & Activities", value: Math.min(100, ((user.activities || []).reduce((s, a) => s + a.points, 0) / 40) * 100), weight: "10%" },
                    { label: "Conduct & Attendance", value: Math.max(0, 100 - (user.conductRecords || []).reduce((s, r) => s + r.impactPoints, 0)), weight: "10%" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label} <span className="text-muted-foreground">({item.weight})</span></span>
                        <span className="font-semibold">{Math.round(item.value)}/100</span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold font-heading mb-3">Certifications</h3>
                {(user.certifications || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(user.certifications || []).map(c => (
                      <Badge key={c.name} variant="secondary" className={c.verified ? "" : "opacity-60"}>
                        <Award className="h-3 w-3 mr-1" />{c.name}
                        {c.verified && <span className="ml-1 text-[10px] text-primary">+{CERTIFICATION_POINTS[c.name] || 5}pts</span>}
                      </Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No certifications added yet.</p>}
              </div>
              {(user.conductRecords || []).length > 0 && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                  <h3 className="font-semibold font-heading mb-3 text-destructive">Conduct Records</h3>
                  <div className="space-y-2">
                    {(user.conductRecords || []).map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <div><p>{r.description}</p><p className="text-xs text-muted-foreground">{r.date} · -{r.impactPoints} pts</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold font-heading mb-3">Upload Documents</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 border-dashed" onClick={() => handleFileUpload("transcript")}><Upload className="h-5 w-5 mr-2" /> Upload Transcript (PDF)</Button>
                  <Button variant="outline" className="h-20 border-dashed" onClick={() => handleFileUpload("certificate")}><Upload className="h-5 w-5 mr-2" /> Upload Certificate</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Accepted: PDF, PNG, JPEG · Max 5 MB</p>
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
              {sorted.map((s, i) => (
                <motion.div key={s.id} className={`flex items-center gap-4 rounded-lg p-3 ${s.id === user.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <span className={`w-8 text-center font-bold text-lg ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-bold">{s.avatar || "?"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.university} · {s.major}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{s.ers}</p>
                    <p className="text-xs text-muted-foreground">ERS</p>
                  </div>
                  <div className="flex gap-1">
                    {(s.badges || []).slice(0, 2).map(b => <Badge key={b} variant="secondary" className="text-[10px] px-1.5">{b}</Badge>)}
                    {s.coopEligible && <Badge className="text-[10px] px-1.5 bg-primary/10 text-primary">CO-OP</Badge>}
                  </div>
                </motion.div>
              ))}
              {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No students found.</p>}
            </div>
          </div>
        </TabsContent>

        {/* Roadmap */}
        <TabsContent value="roadmap">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold font-heading mb-1">Your Career Roadmap</h3>
              <p className="text-sm text-muted-foreground mb-4">Based on latest Saudi LinkedIn listings & market demand for {user.major || "your major"}.</p>
              <div className="space-y-3">
                {roadmapItems.map((item, i) => (
                  <motion.div key={item.id} className={`flex items-start gap-3 rounded-lg border p-4 ${item.completed ? "bg-success/5 border-success/20" : "bg-card"}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    {item.completed ? <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
                        <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                        <Badge className={`text-[10px] ${item.priority === "high" ? "bg-destructive/10 text-destructive" : item.priority === "medium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{item.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-6">
                <h4 className="font-semibold font-heading mb-3">Progress</h4>
                <ERSGauge score={user.roadmapProgress || 0} size={120} label="Completion" />
                <p className="text-sm text-muted-foreground text-center mt-2">{roadmapItems.filter(r => r.completed).length}/{roadmapItems.length} completed</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h4 className="font-semibold font-heading mb-3">AI Recommendation</h4>
                <p className="text-sm text-muted-foreground">Focus on <strong>building your profile</strong> — upload transcript and certifications to boost your ERS score. Market data shows high demand for certifications in your field.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Open Opportunities</h3>
            <div className="space-y-4">
              {opportunities.map((opp, i) => {
                const matchScore = calculateMatchScore(user, opp);
                const applied = myApps.some(a => a.opportunityId === opp.id);
                const typeLabels: Record<string, string> = { coop: "CO-OP", internship: "Internship", "part-time": "Part-time", junior: "Junior" };
                return (
                  <motion.div key={opp.id} className="rounded-lg border p-5 hover:bg-muted/30 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold">{opp.title}</span>
                          <Badge variant="secondary" className="text-[10px]">{typeLabels[opp.type] || opp.type}</Badge>
                          {opp.type === "coop" && user.coopRequired && <Badge className="text-[10px] bg-primary/10 text-primary">Matches CO-OP</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{opp.company} · {opp.department}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.location}</span>
                          <span>{opp.workMode}</span>
                          <span>{opp.duration}</span>
                          <span>Deadline: {opp.deadline}</span>
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {opp.skills.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                          {opp.requiredCerts.map(c => <Badge key={c} className="text-[10px] bg-primary/10 text-primary">{c}</Badge>)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>Min ERS: <strong>{opp.minERS}</strong></span>
                          <span>Min GPA: <strong>{opp.minGPA}</strong></span>
                          <span>Positions: <strong>{opp.positions}</strong></span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{matchScore}%</p>
                          <p className="text-[10px] text-muted-foreground">Match</p>
                        </div>
                        <Button size="sm" disabled={applied} onClick={() => handleApply(opp)}>
                          {applied ? "Applied" : "Apply Now"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {opportunities.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No open opportunities.</p>}
            </div>
          </div>
        </TabsContent>

        {/* My Applications */}
        <TabsContent value="applications">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">My Applications</h3>
            {myApps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No applications yet. Browse opportunities to apply.</p>
            ) : (
              <div className="space-y-3">
                {myApps.map(app => {
                  const opp = getOpportunities().find(o => o.id === app.opportunityId);
                  if (!opp) return null;
                  return (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{opp.title}</p>
                        <p className="text-xs text-muted-foreground">{opp.company} · Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className={`text-[10px] ${statusColors[app.status] || ""}`}>{app.status.replace("_", " ")}</Badge>
                      <span className="text-sm font-semibold text-primary">{app.matchScore}%</span>
                      {(app.status === "submitted" || app.status === "under_review") && (
                        <Button size="sm" variant="outline" onClick={() => handleWithdraw(app.id)}>Withdraw</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Notifications</h3>
            <div className="space-y-3">
              {notifications.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No notifications.</p>}
              {notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-4 ${n.read ? "" : "bg-accent/50 border-primary/20"}`}
                  onClick={() => { markNotificationRead(n.id); refresh(); }}>
                  <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.time).toLocaleString()}</p>
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

export default StudentDashboard;
