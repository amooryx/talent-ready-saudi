import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { GraduationCap, Building2, ShieldCheck, Eye, EyeOff, University } from "lucide-react";
import logo from "@/assets/hireqimah-logo.png";
import { login } from "@/lib/authStore";

type LoginRole = "student" | "hr" | "admin" | "university";

const roles: { value: LoginRole; label: string; icon: typeof GraduationCap; desc: string }[] = [
  { value: "student", label: "Student", icon: GraduationCap, desc: "Upload transcripts, track ERS & roadmap" },
  { value: "hr", label: "HR / Company", icon: Building2, desc: "Search verified candidates & analytics" },
  { value: "admin", label: "Admin", icon: ShieldCheck, desc: "Manage verification & platform" },
  { value: "university", label: "University", icon: University, desc: "Partner & verify students" },
];

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get("role") as LoginRole) || "student";
  const [selectedRole, setSelectedRole] = useState<LoginRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = login(email, password);
    if (!result.success) {
      setError(result.error || "Login failed.");
      return;
    }

    const user = result.user!;
    // Verify user role matches selected role (admin can access admin, university maps to admin route)
    const effectiveRole = user.role === "university" ? "admin" : user.role;
    if (user.role !== selectedRole && !(user.role === "university" && selectedRole === "university")) {
      // Allow login but redirect to correct dashboard
    }

    onLogin();
    const dest = effectiveRole === "student" ? "/student" : effectiveRole === "hr" ? "/hr" : "/admin";
    navigate(dest);
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
        <div className="grid grid-cols-4 gap-2 mb-6">
          {roles.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setSelectedRole(r.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2.5 text-[11px] font-medium transition-all ${
                selectedRole === r.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <r.icon className="h-4 w-4" />
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

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          <button onClick={() => navigate("/forgot-password")} className="text-primary hover:underline font-medium">
            Forgot Password?
          </button>
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={() => navigate(`/signup?role=${selectedRole}`)} className="text-primary hover:underline font-medium">
              Sign Up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
