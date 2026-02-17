import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import logo from "@/assets/hireqimah-logo.png";
import { getUserByEmail } from "@/lib/authStore";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    const user = getUserByEmail(email);
    if (!user) { setError("No account found with this email."); return; }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <img src={logo} alt="HireQimah" className="mx-auto h-14 mb-4" />
          <h1 className="text-2xl font-bold font-heading">{sent ? "Check Your Email" : "Forgot Password"}</h1>
          <p className="text-sm text-muted-foreground">
            {sent ? "A reset link has been sent (simulated)." : "Enter your email to receive a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">In a production system, a password reset link would be sent to <strong>{email}</strong>.</p>
            <Button onClick={() => navigate("/login")} className="w-full">Back to Sign In</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} maxLength={255} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              <Mail className="h-4 w-4 mr-2" /> Send Reset Link
            </Button>
            <button type="button" onClick={() => navigate("/login")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
