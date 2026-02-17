import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { GraduationCap, Building2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/hireqimah-logo.png";
import type { UserRole } from "@/lib/mockData";

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const roles: { value: UserRole; label: string; icon: typeof GraduationCap; desc: string }[] = [
  { value: "student", label: "Student", icon: GraduationCap, desc: "Upload transcripts, track ERS & roadmap" },
  { value: "hr", label: "HR / Company", icon: Building2, desc: "Search verified candidates & analytics" },
  { value: "admin", label: "Admin / University", icon: ShieldCheck, desc: "Manage verification & leaderboards" },
];

const Login = ({ onLogin }: LoginProps) => {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get("role") as UserRole) || "student";
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (attempts >= 5) {
      setError("Too many attempts. Please try again later.");
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields.");
      setAttempts(a => a + 1);
      return;
    }

    // Prototype: any non-empty credentials work
    onLogin(selectedRole);
    navigate(selectedRole === "student" ? "/student" : selectedRole === "hr" ? "/hr" : "/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <img src={logo} alt="HireQimah" className="mx-auto h-14 mb-4" />
          <h1 className="text-2xl font-bold font-heading">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your HireQimah account</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {roles.map(r => (
            <button
              key={r.value}
              onClick={() => setSelectedRole(r.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-medium transition-all ${
                selectedRole === r.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <r.icon className="h-5 w-5" />
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={255}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                maxLength={128}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={attempts >= 5}>
            Sign In as {roles.find(r => r.value === selectedRole)?.label}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo prototype — enter any credentials to explore.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
