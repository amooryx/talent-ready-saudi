import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import HRDashboard from "./pages/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import type { UserRole } from "@/lib/mockData";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ name: string; role: UserRole } | null>(null);

  const handleLogin = (role: UserRole) => {
    const names = { student: "Ahmed Al-Farsi", hr: "HR Manager", admin: "Admin User" };
    setUser({ name: names[role], role });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={user ? <Navigate to={`/${user.role === "student" ? "student" : user.role === "hr" ? "hr" : "admin"}`} /> : <Login onLogin={handleLogin} />} />
            <Route path="/student" element={user?.role === "student" ? <StudentDashboard /> : <Navigate to="/login?role=student" />} />
            <Route path="/hr" element={user?.role === "hr" ? <HRDashboard /> : <Navigate to="/login?role=hr" />} />
            <Route path="/admin" element={user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/login?role=admin" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
