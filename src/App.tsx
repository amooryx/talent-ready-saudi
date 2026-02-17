import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/StudentDashboard";
import HRDashboard from "./pages/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { getSession, getCurrentUser, logout, refreshSession, type StoredUser } from "@/lib/authStore";

const queryClient = new QueryClient();

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
    // Check session every 60s for timeout
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [checkSession]);

  const handleLogin = () => {
    checkSession();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const effectiveRole = user ? (user.role === "university" ? "admin" : user.role) : null;

  if (!checked) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={user ? <Navigate to={`/${effectiveRole}`} /> : <Login onLogin={handleLogin} />} />
            <Route path="/signup" element={user ? <Navigate to={`/${effectiveRole}`} /> : <SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/student" element={effectiveRole === "student" ? <StudentDashboard user={user!} /> : <Navigate to="/login?role=student" />} />
            <Route path="/hr" element={effectiveRole === "hr" ? <HRDashboard user={user!} /> : <Navigate to="/login?role=hr" />} />
            <Route path="/admin" element={effectiveRole === "admin" ? <AdminDashboard user={user!} /> : <Navigate to="/login?role=admin" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
