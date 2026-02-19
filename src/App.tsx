import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import RoleLogin from "./pages/RoleLogin";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/StudentDashboard";
import HRDashboard from "./pages/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AccessDenied from "./components/AccessDenied";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import { getSession, getCurrentUser, logout, refreshSession, type StoredUser } from "@/lib/authStore";

const queryClient = new QueryClient();

// Scroll to hash on route change
const ScrollToHash = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const el = document.getElementById(location.hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location]);
  return null;
};

const App = () => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checked, setChecked] = useState(false);

  const checkSession = useCallback(() => {
    const session = getSession();
    if (session) {
      const u = getCurrentUser();
      setUser(u);
      refreshSession();
    } else {
      setUser(null);
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [checkSession]);

  const handleLogin = () => { checkSession(); };
  const handleLogout = () => { logout(); setUser(null); };

  const effectiveRole = user ? (user.role === "university" ? "admin" : user.role) : null;

  if (!checked) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToHash />
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Legacy /login redirects to student login */}
            <Route path="/login" element={user ? <Navigate to={`/${effectiveRole}`} /> : <Navigate to="/login/student" />} />

            {/* Role-specific login routes */}
            <Route path="/login/student" element={user ? <Navigate to={`/${effectiveRole}`} /> : <RoleLogin role="student" onLogin={handleLogin} />} />
            <Route path="/login/hr" element={user ? <Navigate to={`/${effectiveRole}`} /> : <RoleLogin role="hr" onLogin={handleLogin} />} />
            <Route path="/login/university" element={user ? <Navigate to={`/${effectiveRole}`} /> : <RoleLogin role="university" onLogin={handleLogin} />} />

            {/* Admin separate route */}
            <Route path="/admin/login" element={user ? <Navigate to={`/${effectiveRole}`} /> : <RoleLogin role="admin" onLogin={handleLogin} />} />

            <Route path="/signup" element={user ? <Navigate to={`/${effectiveRole}`} /> : <SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected dashboards with strict role checks */}
            <Route path="/student" element={effectiveRole === "student" ? <StudentDashboard user={user!} /> : user ? <AccessDenied /> : <Navigate to="/login/student" />} />
            <Route path="/hr" element={effectiveRole === "hr" ? <HRDashboard user={user!} /> : user ? <AccessDenied /> : <Navigate to="/login/hr" />} />
            <Route path="/admin" element={effectiveRole === "admin" ? <AdminDashboard user={user!} /> : user ? <AccessDenied /> : <Navigate to="/admin/login" />} />

            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
