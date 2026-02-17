import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/hireqimah-logo.png";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/lib/mockData";

interface NavbarProps {
  user?: { name: string; role: UserRole } | null;
  onLogout?: () => void;
}

const Navbar = ({ user, onLogout }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardLink = user
    ? user.role === "student" ? "/student" : user.role === "hr" ? "/hr" : "/admin"
    : null;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="HireQimah" className="h-10 w-auto" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {!user && (
            <>
              <Link to="/" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>Home</Link>
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#for-students" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">For Students</a>
              <a href="#for-companies" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">For Companies</a>
            </>
          )}
          {dashboardLink && (
            <Link to={dashboardLink} className="text-sm font-medium text-primary">Dashboard</Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">{user.role}</span>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>Sign In</Button>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-3">
          {!user && (
            <>
              <Link to="/" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Home</Link>
              <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Features</a>
            </>
          )}
          {user ? (
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { onLogout?.(); setMobileOpen(false); }}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Sign In</Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
