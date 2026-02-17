import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ERSGauge from "@/components/ERSGauge";
import StatCard from "@/components/StatCard";
import { opportunities, roadmapItems } from "@/lib/mockData";
import { type StoredUser, getStudents, calculateERS, updateUser, validateFile, UNIVERSITIES, MAJORS } from "@/lib/authStore";
import {
  Trophy, Target, Briefcase, Map, Bell, Upload, Award,
  TrendingUp, Star, CheckCircle, Circle, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentDashboardProps {
  user: StoredUser;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const { toast } = useToast();
  const [leaderFilter, setLeaderFilter] = useState<"global" | "university" | "major">("global");
  const [notifications] = useState([
    { id: 1, text: "📋 Upload your transcript to activate ERS scoring", time: "Now" },
    { id: 2, text: "🎯 Complete your profile to appear on leaderboards", time: "Now" },
    { id: 3, text: "🏆 New opportunities matching your major posted!", time: "1d ago" },
  ]);

  const ers = calculateERS(user);
  const allStudents = getStudents();

  const filteredStudents = leaderFilter === "university"
    ? allStudents.filter(s => s.university === user.university)
    : leaderFilter === "major"
      ? allStudents.filter(s => s.major === user.major)
      : allStudents;

  const sorted = [...filteredStudents]
    .map(s => ({ ...s, ers: calculateERS(s) }))
    .sort((a, b) => b.ers - a.ers);

  const myRank = sorted.findIndex(s => s.id === user.id) + 1;

  const handleFileUpload = useCallback((type: "transcript" | "certificate") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({ title: "Upload Rejected", description: validation.error, variant: "destructive" });
        return;
      }
      if (type === "transcript") {
        updateUser(user.id, { transcriptUploaded: true });
        toast({ title: "Transcript Uploaded", description: "Pending admin verification." });
      } else {
        toast({ title: "Certificate Uploaded", description: "Pending verification." });
      }
    };
    input.click();
  }, [user.id, toast]);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Welcome, {user.name}</h1>
          <p className="text-muted-foreground text-sm">
            {user.university || "No university"} · {user.major || "No major"} · GPA {user.gpa || "N/A"}
          </p>
        </div>
        <div className="flex gap-2">
          {(user.badges || []).map(b => (
            <Badge key={b} className="bg-accent/20 text-accent-foreground border-accent/30">
              <Star className="h-3 w-3 mr-1" />{b}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="ERS Score" value={ers} delay={0} />
        <StatCard icon={Trophy} label="Rank" value={myRank > 0 ? `#${myRank}` : "—"} delay={0.1} />
        <StatCard icon={Award} label="Certifications" value={(user.certifications || []).length} delay={0.2} />
        <StatCard icon={Map} label="Roadmap" value={`${user.roadmapProgress || 0}%`} delay={0.3} />
      </div>

      {!user.transcriptVerified && (
        <div className="rounded-lg border-2 border-accent/40 bg-accent/5 p-4 flex items-center gap-3">
          <Upload className="h-5 w-5 text-accent shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Transcript not verified</p>
            <p className="text-xs text-muted-foreground">Upload your transcript to activate ERS scoring and appear on leaderboards.</p>
          </div>
          <Button size="sm" onClick={() => handleFileUpload("transcript")}>Upload</Button>
        </div>
      )}

      <Tabs defaultValue="ers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ers"><Target className="h-4 w-4 mr-1 hidden sm:inline" />ERS</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1 hidden sm:inline" />Leaderboard</TabsTrigger>
          <TabsTrigger value="roadmap"><Map className="h-4 w-4 mr-1 hidden sm:inline" />Roadmap</TabsTrigger>
          <TabsTrigger value="opportunities"><Briefcase className="h-4 w-4 mr-1 hidden sm:inline" />Jobs</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1 hidden sm:inline" />Alerts</TabsTrigger>
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
                <p className="text-xs text-muted-foreground mb-1">ERS = (50% Academic) + (30% Skills & Certs) + (20% Soft Skills & Projects)</p>
                <div className="space-y-4 mt-4">
                  {[
                    { label: "Academic Score", value: user.academicScore || 0, weight: "50%" },
                    { label: "Skills & Certifications", value: user.skillsScore || 0, weight: "30%" },
                    { label: "Soft Skills & Projects", value: user.softSkillsScore || 0, weight: "20%" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label} <span className="text-muted-foreground">({item.weight})</span></span>
                        <span className="font-semibold">{item.value}/100</span>
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
                        {c.verified && <CheckCircle className="h-3 w-3 ml-1 text-success" />}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No certifications added yet.</p>
                )}
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold font-heading mb-3">Upload Documents</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 border-dashed" onClick={() => handleFileUpload("transcript")}>
                    <Upload className="h-5 w-5 mr-2" /> Upload Transcript (PDF)
                  </Button>
                  <Button variant="outline" className="h-20 border-dashed" onClick={() => handleFileUpload("certificate")}>
                    <Upload className="h-5 w-5 mr-2" /> Upload Certificate
                  </Button>
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
                  <Button key={f} size="sm" variant={leaderFilter === f ? "default" : "outline"} onClick={() => setLeaderFilter(f)} className="capitalize text-xs">
                    {f}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {sorted.map((s, i) => (
                <motion.div
                  key={s.id}
                  className={`flex items-center gap-4 rounded-lg p-3 ${s.id === user.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className={`w-8 text-center font-bold text-lg ${i < 3 ? "text-accent" : "text-muted-foreground"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
                    {s.avatar || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.university} · {s.major}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{s.ers}</p>
                    <p className="text-xs text-muted-foreground">ERS</p>
                  </div>
                  <div className="flex gap-1">
                    {(s.badges || []).slice(0, 2).map(b => (
                      <Badge key={b} variant="secondary" className="text-[10px] px-1.5">{b}</Badge>
                    ))}
                  </div>
                </motion.div>
              ))}
              {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No students found for this filter.</p>}
            </div>
          </div>
        </TabsContent>

        {/* Roadmap */}
        <TabsContent value="roadmap">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold font-heading mb-1">Your Career Roadmap</h3>
              <p className="text-sm text-muted-foreground mb-4">AI-recommended based on your ERS, skills, and {user.major || "your"} job market.</p>
              <div className="space-y-3">
                {roadmapItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 ${item.completed ? "bg-success/5 border-success/20" : "bg-card"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {item.completed ? (
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
                        <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                        <Badge className={`text-[10px] ${item.priority === "high" ? "bg-destructive/10 text-destructive border-destructive/20" : item.priority === "medium" ? "bg-accent/20 text-accent-foreground border-accent/20" : "bg-muted text-muted-foreground"}`}>
                          {item.priority}
                        </Badge>
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
                <p className="text-sm text-muted-foreground">Focus on <strong>building your profile</strong> — upload transcript and certifications to boost your ERS score.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-heading">Opportunities</h3>
              <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
            </div>
            <div className="space-y-3">
              {opportunities.map((opp, i) => (
                <motion.div
                  key={opp.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{opp.title}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">{opp.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{opp.company} · {opp.location} · {opp.posted}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {opp.skills.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <Button size="sm">Apply</Button>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Notifications</h3>
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg border p-4">
                  <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
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
