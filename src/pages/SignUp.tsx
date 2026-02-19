import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { GraduationCap, Building2, University, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/hireqimah-logo.png";
import { registerUser, UNIVERSITIES, getMajorsForUniversity } from "@/lib/authStore";
import type { UserRole } from "@/lib/mockData";

type SignUpRole = "student" | "hr" | "university";

const roleMeta: Record<SignUpRole, { label: string; icon: typeof GraduationCap; desc: string }> = {
  student: { label: "Student", icon: GraduationCap, desc: "Create your student profile & get your ERS" },
  hr: { label: "HR / Company", icon: Building2, desc: "Find verified Saudi talent" },
  university: { label: "University", icon: University, desc: "Partner & manage student verification" },
};

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get("role") as SignUpRole) || "student";
  const [role, setRole] = useState<SignUpRole>(defaultRole);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const selectedUniversity = form.university || "";
  const availableMajors = getMajorsForUniversity(selectedUniversity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { name, email, password, confirmPassword } = form;
    if (!name || !email || !password) { setError("Please fill in all required fields."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    
    // University email restriction for students
    if (role === "student") {
      const blockedDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "aol.com", "mail.com", "protonmail.com"];
      const emailDomain = email.split("@")[1]?.toLowerCase() || "";
      if (blockedDomains.includes(emailDomain) || !emailDomain.endsWith(".edu.sa")) {
        setError("Please use your official university email address (e.g., name@ksu.edu.sa)."); return;
      }
    }
    
    if (role === "student" && (!form.university || !form.major)) { setError("Please select your university and major."); return; }
    if (role === "student" && !form.gpaScale) { setError("Please select your GPA scale."); return; }
    if (role === "hr" && !form.company) { setError("Please enter your company name."); return; }

    const gpaScale = form.gpaScale || "4";
    const maxGpa = gpaScale === "5" ? 5 : 4;
    const gpa = form.gpa ? parseFloat(form.gpa) : undefined;
    if (role === "student" && gpa !== undefined && (gpa < 0 || gpa > maxGpa)) {
      setError(`GPA must be between 0 and ${maxGpa}.`); return;
    }

    const result = registerUser({
      name: name.trim(), email: email.trim(), password,
      role: role as UserRole | "university",
      ...(role === "student" ? {
        university: form.university, major: form.major,
        gpa: gpa || 0, gpaScale: gpaScale as "4" | "5",
        nationality: form.nationality || "Saudi",
        avatar: name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      } : {}),
      ...(role === "hr" ? {
        company: form.company, position: form.position || "", industry: form.industry || "",
        avatar: name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      } : {}),
      ...(role === "university" ? {
        universityName: form.universityName || name,
        officialDomain: form.officialDomain || "",
        adminContact: form.adminContact || "",
        avatar: name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      } : {}),
    });

    if (!result.success) { setError(result.error || "Registration failed."); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
            <GraduationCap className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold font-heading mb-2">Account Created!</h2>
          <p className="text-sm text-muted-foreground mb-6">You can now sign in with your credentials.</p>
          <Button onClick={() => navigate("/login/student")} className="w-full">Go to Sign In</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-6">
          <img src={logo} alt="HireQimah" className="mx-auto h-14 mb-4" />
          <h1 className="text-2xl font-bold font-heading">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join HireQimah — Saudi's Verified Talent Platform</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {(Object.keys(roleMeta) as SignUpRole[]).map(r => {
            const meta = roleMeta[r];
            return (
              <button key={r} type="button" onClick={() => { setRole(r); setForm({}); }}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-medium transition-all ${role === r ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                <meta.icon className="h-5 w-5" />{meta.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Full Name *</Label><Input placeholder="Your full name" value={form.name || ""} onChange={e => set("name", e.target.value)} maxLength={100} /></div>
          <div><Label>Email *{role === "student" ? " (University email only)" : ""}</Label><Input type="email" placeholder={role === "student" ? "name@university.edu.sa" : "you@example.com"} value={form.email || ""} onChange={e => set("email", e.target.value)} maxLength={255} /></div>

          {role === "student" && (
            <>
              <div><Label>Nationality</Label><Input placeholder="Saudi" value={form.nationality || "Saudi"} onChange={e => set("nationality", e.target.value)} maxLength={50} /></div>
              <div>
                <Label>University *</Label>
                <Select value={selectedUniversity} onValueChange={v => { set("university", v); set("major", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Major *</Label>
                <Select value={form.major || ""} onValueChange={v => set("major", v)} disabled={!selectedUniversity}>
                  <SelectTrigger><SelectValue placeholder={selectedUniversity ? "Select major" : "Select university first"} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableMajors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>GPA Scale *</Label>
                  <Select value={form.gpaScale || ""} onValueChange={v => set("gpaScale", v)}>
                    <SelectTrigger><SelectValue placeholder="Select scale" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4.0 Scale</SelectItem>
                      <SelectItem value="5">5.0 Scale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>GPA</Label>
                  <Input type="number" step="0.01" min="0" max={form.gpaScale === "5" ? 5 : 4} placeholder={form.gpaScale === "5" ? "e.g. 4.50" : "e.g. 3.50"} value={form.gpa || ""} onChange={e => set("gpa", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {role === "hr" && (
            <>
              <div><Label>Company Name *</Label><Input placeholder="e.g., Saudi Aramco" value={form.company || ""} onChange={e => set("company", e.target.value)} maxLength={100} /></div>
              <div><Label>Position</Label><Input placeholder="e.g., HR Manager" value={form.position || ""} onChange={e => set("position", e.target.value)} maxLength={100} /></div>
              <div><Label>Industry</Label><Input placeholder="e.g., Energy" value={form.industry || ""} onChange={e => set("industry", e.target.value)} maxLength={100} /></div>
            </>
          )}

          {role === "university" && (
            <>
              <div><Label>University Name</Label><Input placeholder="Official university name" value={form.universityName || ""} onChange={e => set("universityName", e.target.value)} maxLength={150} /></div>
              <div><Label>Official Domain Email</Label><Input placeholder="e.g., admin@ksu.edu.sa" value={form.officialDomain || ""} onChange={e => set("officialDomain", e.target.value)} maxLength={100} /></div>
              <div><Label>Admin Contact</Label><Input placeholder="Phone number" value={form.adminContact || ""} onChange={e => set("adminContact", e.target.value)} maxLength={50} /></div>
            </>
          )}

          <div>
            <Label>Password *</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} placeholder="Min 8 chars, uppercase, number, special" value={form.password || ""} onChange={e => set("password", e.target.value)} maxLength={128} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div><Label>Confirm Password *</Label><Input type="password" placeholder="Re-enter password" value={form.confirmPassword || ""} onChange={e => set("confirmPassword", e.target.value)} maxLength={128} /></div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Create Account</Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <button onClick={() => navigate("/login/student")} className="text-primary hover:underline font-medium">Sign In</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
