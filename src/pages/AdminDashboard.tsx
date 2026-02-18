import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/StatCard";
import {
  type StoredUser, getAllUsers, getStudents, updateUser, calculateERS,
  getActivityLog, UNIVERSITIES, CERTIFICATION_POINTS,
} from "@/lib/authStore";
import {
  ShieldCheck, Users, FileCheck, Settings, CheckCircle, XCircle, Clock,
  Award, BarChart3, Ban, Activity
} from "lucide-react";

interface AdminDashboardProps { user: StoredUser; }

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const allUsers = getAllUsers();
  const students = getStudents();
  const activityLog = getActivityLog();
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  const pendingTranscripts = students.filter(s => s.transcriptUploaded && !s.transcriptVerified);
  const pendingCerts = students.flatMap(s => (s.certifications || []).filter(c => !c.verified).map(c => ({ student: s, cert: c })));

  const handleApproveTranscript = (studentId: string) => { updateUser(studentId, { transcriptVerified: true }); refresh(); };
  const handleRejectTranscript = (studentId: string) => { updateUser(studentId, { transcriptUploaded: false, transcriptVerified: false }); refresh(); };
  const handleApproveCert = (studentId: string, certName: string) => {
    const student = allUsers.find(u => u.id === studentId); if (!student) return;
    const certs = (student.certifications || []).map(c => c.name === certName ? { ...c, verified: true } : c);
    updateUser(studentId, { certifications: certs }); refresh();
  };
  const handleToggleDisable = (userId: string) => {
    const u = allUsers.find(x => x.id === userId); if (!u || u.role === "admin") return;
    updateUser(userId, { disabled: !u.disabled }); refresh();
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome, {user.name} · Manage verifications, users, and platform settings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={allUsers.length} delay={0} />
        <StatCard icon={Clock} label="Pending Transcripts" value={pendingTranscripts.length} delay={0.1} />
        <StatCard icon={FileCheck} label="Pending Certs" value={pendingCerts.length} delay={0.2} />
        <StatCard icon={BarChart3} label="Students" value={students.length} delay={0.3} />
      </div>

      <Tabs defaultValue="verify" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="verify"><FileCheck className="h-4 w-4 mr-1 hidden sm:inline" />Transcripts</TabsTrigger>
          <TabsTrigger value="certs"><Award className="h-4 w-4 mr-1 hidden sm:inline" />Certificates</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1 hidden sm:inline" />Users</TabsTrigger>
          <TabsTrigger value="ers"><Settings className="h-4 w-4 mr-1 hidden sm:inline" />ERS Config</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-1 hidden sm:inline" />Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="verify">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Transcript Verification Queue</h3>
            {pendingTranscripts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No pending transcripts.</p> : (
              <div className="space-y-3">
                {pendingTranscripts.map((s, i) => (
                  <motion.div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex-1"><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-muted-foreground">{s.university} · {s.major} · GPA {s.gpa}</p></div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveTranscript(s.id)}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectTranscript(s.id)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <h4 className="text-sm font-semibold mt-6 mb-3 text-muted-foreground">Verified Students</h4>
            <div className="space-y-2">
              {students.filter(s => s.transcriptVerified).map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                  <span className="text-sm flex-1">{s.name} — {s.university}</span>
                  <span className="text-xs text-muted-foreground">ERS: {calculateERS(s)}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="certs">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">Certificate Verification</h3>
            {pendingCerts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No pending certificates.</p> : (
              <div className="space-y-3">
                {pendingCerts.map((item, i) => (
                  <motion.div key={`${item.student.id}-${item.cert.name}`} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.cert.name} <span className="text-xs text-primary">(+{CERTIFICATION_POINTS[item.cert.name] || 5} pts)</span></p>
                      <p className="text-xs text-muted-foreground">{item.student.name} · {item.cert.credlyId ? `Credly: ${item.cert.credlyId}` : "No Credly ID"}</p>
                    </div>
                    <Button size="sm" onClick={() => handleApproveCert(item.student.id, item.cert.name)}><CheckCircle className="h-4 w-4 mr-1" />Verify</Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">User Management</h3>
            <div className="space-y-2">
              {allUsers.filter(u => u.id !== user.id).map(u => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold">{u.avatar || "?"}</div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{u.name}</p><p className="text-xs text-muted-foreground">{u.email} · {u.role}</p></div>
                  <Badge variant={u.disabled ? "destructive" : "secondary"} className="text-[10px]">{u.disabled ? "Disabled" : "Active"}</Badge>
                  <Button size="sm" variant="outline" onClick={() => handleToggleDisable(u.id)}>{u.disabled ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}</Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ers">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">ERS Weight Configuration</h3>
              <p className="text-xs text-muted-foreground mb-4">ERS = (40% Academic) + (25% Certs) + (15% Projects) + (10% Soft Skills) + (10% Conduct)</p>
              <div className="space-y-4">
                {[
                  { label: "Academic Performance", weight: 40 },
                  { label: "Certifications (Fixed Points)", weight: 25 },
                  { label: "Projects", weight: 15 },
                  { label: "Soft Skills & Activities", weight: 10 },
                  { label: "Conduct & Attendance", weight: 10 },
                ].map(w => (
                  <div key={w.label}><div className="flex justify-between text-sm mb-1"><span>{w.label}</span><span className="font-semibold">{w.weight}%</span></div><Progress value={w.weight} className="h-3" /></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold font-heading mb-4">Certification Points (Fixed)</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(CERTIFICATION_POINTS).sort((a, b) => b[1] - a[1]).map(([cert, points]) => (
                  <div key={cert} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /><span className="text-sm font-medium">{cert}</span></div>
                    <div className="flex items-center gap-2"><Progress value={(points / 30) * 100} className="w-16 h-2" /><span className="text-sm font-semibold w-10 text-right">{points} pts</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold font-heading mb-4">System Activity Log</h3>
            {activityLog.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No activity recorded.</p> : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityLog.slice(0, 50).map((log, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div><p className="text-sm">{log.message}</p><p className="text-xs text-muted-foreground">{new Date(log.time).toLocaleString()}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
