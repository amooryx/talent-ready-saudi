import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/StatCard";
import { students, universities, majors, ersWeights } from "@/lib/mockData";
import { ShieldCheck, Users, FileCheck, Settings, CheckCircle, XCircle, Clock, Award, BarChart3 } from "lucide-react";

type VerificationStatus = "pending" | "approved" | "rejected";

const pendingVerifications: { id: string; student: string; type: string; university: string; submitted: string; status: VerificationStatus }[] = [
  { id: "v1", student: "Khalid Al-Otaibi", type: "Transcript", university: "King Abdulaziz University", submitted: "2h ago", status: "pending" },
  { id: "v2", student: "Fatimah Al-Rashid", type: "Certificate - React Developer", university: "King Saud University", submitted: "5h ago", status: "pending" },
  { id: "v3", student: "Omar Al-Dosari", type: "Transcript", university: "KFUPM", submitted: "1d ago", status: "pending" },
  { id: "v4", student: "Ahmed Al-Farsi", type: "Certificate - OSCP", university: "King Abdulaziz University", submitted: "3d ago", status: "approved" },
  { id: "v5", student: "Sara Al-Mutairi", type: "Transcript", university: "King Saud University", submitted: "4d ago", status: "approved" },
];

const AdminDashboard = () => {
  const [verifications, setVerifications] = useState(pendingVerifications);

  const handleVerification = (id: string, action: "approved" | "rejected") => {
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: action } : v));
  };

  const pending = verifications.filter(v => v.status === "pending").length;
  const approved = verifications.filter(v => v.status === "approved").length;

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage verifications, ERS tables, and platform settings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={students.length} delay={0} />
        <StatCard icon={Clock} label="Pending Verification" value={pending} delay={0.1} />
        <StatCard icon={FileCheck} label="Verified Documents" value={approved} delay={0.2} />
        <StatCard icon={BarChart3} label="Universities" value={universities.length} delay={0.3} />
      </div>

      <Tabs defaultValue="verify" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verify"><FileCheck className="h-4 w-4 mr-1 hidden sm:inline" />Verification</TabsTrigger>
          <TabsTrigger value="ers"><Settings className="h-4 w-4 mr-1 hidden sm:inline" />ERS Config</TabsTrigger>
          <TabsTrigger value="metrics"><BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="verify">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Document Verification Queue</h3>
            <div className="space-y-3">
              {verifications.map((v, i) => (
                <motion.div
                  key={v.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{v.student}</p>
                    <p className="text-xs text-muted-foreground">{v.type} · {v.university} · {v.submitted}</p>
                  </div>
                  {v.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleVerification(v.id, "approved")}>
                        <CheckCircle className="h-4 w-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleVerification(v.id, "rejected")}>
                        <XCircle className="h-4 w-4 mr-1" />Reject
                      </Button>
                    </div>
                  ) : (
                    <Badge className={v.status === "approved" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                      {v.status === "approved" ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {v.status}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ers">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">ERS Weight Configuration</h3>
              <p className="text-xs text-muted-foreground mb-4">ERS = (Academic × {ersWeights.academic}) + (Skills × {ersWeights.skills}) + (Soft Skills × {ersWeights.softSkills})</p>
              <div className="space-y-4">
                {[
                  { label: "Academic Score", weight: ersWeights.academic * 100 },
                  { label: "Skills & Certifications", weight: ersWeights.skills * 100 },
                  { label: "Soft Skills & Projects", weight: ersWeights.softSkills * 100 },
                ].map(w => (
                  <div key={w.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{w.label}</span>
                      <span className="font-semibold">{w.weight}%</span>
                    </div>
                    <Progress value={w.weight} className="h-3" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Certification Weights (Cybersecurity)</h3>
              <div className="space-y-2">
                {[
                  { cert: "OSCP", weight: 95 },
                  { cert: "CEH", weight: 75 },
                  { cert: "eJPT", weight: 65 },
                  { cert: "CompTIA Security+", weight: 60 },
                ].map(c => (
                  <div key={c.cert} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">{c.cert}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={c.weight} className="w-20 h-2" />
                      <span className="text-sm font-semibold w-8 text-right">{c.weight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Student Participation</h3>
              <div className="space-y-3">
                {universities.map(u => {
                  const count = students.filter(s => s.university === u).length;
                  const pct = Math.round((count / students.length) * 100);
                  return (
                    <div key={u}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{u}</span>
                        <span className="text-muted-foreground">{count} students ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Major Distribution</h3>
              <div className="space-y-3">
                {majors.map(m => {
                  const count = students.filter(s => s.major === m).length;
                  const avgErs = Math.round(students.filter(s => s.major === m).reduce((a, s) => a + s.ers, 0) / count);
                  return (
                    <div key={m} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">{m}</p>
                        <p className="text-xs text-muted-foreground">{count} students</p>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
