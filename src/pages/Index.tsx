import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Shield, Trophy, BarChart3, GraduationCap, Building2, University,
  TrendingUp, CheckCircle, Briefcase, Target, Users, FileCheck, Award,
  BookOpen, AlertTriangle, Search, Star, Zap, Scale, Globe, Heart,
  ArrowRight, Layers, Rocket, Eye, ClipboardCheck, MapPin, Mail
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/hireqimah-logo.png";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const Index = () => {
  const navigate = useNavigate();

  const ctaBtnClass = "font-semibold px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 h-12 text-base";

  return (
    <div className="min-h-screen bg-background">
      {/* ───────── 1. HERO SECTION ───────── */}
      <section className="relative overflow-hidden min-h-[700px] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(203,79%,10%)/0.95] via-[hsl(203,79%,15%)/0.90] to-[hsl(217,80%,30%)/0.75]" />

        <div className="relative container py-20 md:py-28 z-10">
          <div className="max-w-3xl">
            <motion.img src={logo} alt="HireQimah" className="h-16 md:h-20 mb-6 drop-shadow-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
            <motion.h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold font-heading text-white mb-4 leading-tight"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
            >
              Where Saudi Talent<br />Builds Its <span className="text-[hsl(207,89%,80%)]">Qimah</span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-white/90 mb-4 leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            >
              A verified career readiness platform that helps Saudi university students understand market demand, earn measurable value (Qimah), and connect with employers — while giving HR verified scoring and universities transparent engagement tools.
            </motion.p>
            <motion.p
              className="text-sm text-white/60 mb-8 leading-relaxed max-w-xl italic"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            >
              Serving students, HR teams, and universities — all through one structured, transparent ecosystem aligned with Vision 2030.
            </motion.p>
            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Button size="lg" className={`bg-primary text-primary-foreground hover:bg-primary/90 ${ctaBtnClass}`} onClick={() => navigate("/auth/select-role?mode=signup")}>
                <GraduationCap className="mr-2 h-5 w-5" /> Sign Up / Explore as Student
              </Button>
              <Button size="lg" className={`bg-secondary text-secondary-foreground hover:bg-secondary/90 ${ctaBtnClass}`} onClick={() => navigate("/signup?role=hr")}>
                <Building2 className="mr-2 h-5 w-5" /> Request Demo as HR
              </Button>
              <Button size="lg" className={`bg-secondary text-secondary-foreground hover:bg-secondary/90 ${ctaBtnClass}`} onClick={() => navigate("/signup?role=university")}>
                <University className="mr-2 h-5 w-5" /> Explore Partnership
              </Button>
            </motion.div>
            <motion.p className="mt-5 text-white/50 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/auth/select-role?mode=signin")} className="text-[hsl(207,89%,80%)] hover:underline font-medium">
                Sign In
              </button>
            </motion.p>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="bg-accent py-4">
        <div className="container text-center">
          <p className="text-sm font-medium text-accent-foreground">
            Unlike traditional job platforms, HireQimah is <strong>structured, verified, transparent, and performance-driven.</strong>
          </p>
        </div>
      </section>

      {/* ───────── 2. HOW IT WORKS ───────── */}
      <section id="features" className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">How HireQimah Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">A step-by-step flow connecting students, HR, and universities through one verified ecosystem.</p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6 mb-14">
          {[
            { step: "01", icon: GraduationCap, title: "Student Registers", desc: "Upload verified transcript, select GPA scale (4.0 / 5.0), and begin building your profile." },
            { step: "02", icon: BarChart3, title: "ERS Calculated", desc: "AI analyzes academics, certifications, projects, soft skills, and conduct to generate your Employment Readiness Score." },
            { step: "03", icon: TrendingUp, title: "Roadmap Generated", desc: "Personalized career roadmap based on Saudi market demand, skill gaps, and certification opportunities." },
            { step: "04", icon: Briefcase, title: "HR Discovers Talent", desc: "Companies filter and shortlist verified candidates by ERS, major, certifications, and CO-OP readiness." },
          ].map((s, i) => (
            <motion.div key={s.step} className="relative rounded-xl border bg-card p-6 shadow-sm text-center" {...fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-bold px-3 py-1">{s.step}</span>
              <s.icon className="h-8 w-8 text-primary mx-auto mb-3 mt-2" />
              <h3 className="font-semibold font-heading mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Dashboard placeholders */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Student Dashboard", icon: Target, items: ["ERS Score & Breakdown", "Career Roadmap Progress", "Certification Tracker", "Leaderboard Position", "CO-OP / Internship Eligibility"] },
            { title: "HR Dashboard", icon: Search, items: ["Verified Candidate Pool", "ERS Filter & Ranking", "Talent Pool Management", "Application Tracking", "AI Match Scoring"] },
            { title: "University Dashboard", icon: University, items: ["Attendance Monitoring", "Conduct & Discipline Tracking", "Student Engagement Overview", "CO-OP Eligibility Status", "ERS Governance Tools"] },
          ].map((d, i) => (
            <motion.div key={d.title} className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <d.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold font-heading">{d.title}</h3>
              </div>
              <ul className="space-y-2">
                {d.items.map(item => (
                  <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg bg-muted/50 border border-dashed border-border h-28 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Dashboard Preview — Coming Soon</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── 3. ROLES & BENEFITS ───────── */}
      <section id="for-students" className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Built for Every Stakeholder</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">HireQimah serves students, HR teams, and universities — each with dedicated tools, dashboards, and verified data.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Students */}
            <motion.div className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: 0, duration: 0.5 }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-1">🎓 For Students</h3>
              <p className="text-sm text-muted-foreground mb-4">Build your Qimah. Compete. Get hired.</p>
              <ul className="space-y-2 mb-6">
                {[
                  "Earn Qimah points through certifications, projects, and activities",
                  "Improve your Employment Readiness Score (ERS)",
                  "Track CO-OP and internship readiness",
                  "Build a verified professional profile",
                  "Receive a personalized career roadmap based on Saudi market demand",
                  "Compete on leaderboards: per major, per university, and nationally",
                  "Upload verified transcript (not manual GPA entry)",
                  "Get matched with HR and apply with one click",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                <h4 className="font-semibold text-sm mb-2">ERS Scoring Model</h4>
                <p className="text-xs text-muted-foreground mb-3">ERS = (40% Academic) + (25% Certs) + (15% Projects) + (10% Soft Skills) + (10% Conduct)</p>
                <div className="space-y-2">
                  {[
                    { label: "Academic Performance", pct: 40 },
                    { label: "Certifications", pct: 25 },
                    { label: "Projects", pct: 15 },
                    { label: "Soft Skills & Activities", pct: 10 },
                    { label: "Conduct & Attendance", pct: 10 },
                  ].map(w => (
                    <div key={w.label}>
                      <div className="flex justify-between text-xs mb-1"><span>{w.label}</span><span className="font-semibold text-primary">{w.pct}%</span></div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${w.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate("/auth/select-role?mode=signup")}>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </motion.div>

            {/* HR */}
            <motion.div className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: 0.1, duration: 0.5 }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-1">🏢 For HR & Companies</h3>
              <p className="text-sm text-muted-foreground mb-4">Hire verified Saudi Qimah.</p>
              <ul className="space-y-2 mb-6">
                {[
                  "Access verified, pre-ranked Saudi talent",
                  "View full ERS breakdown: academics, certifications, projects, soft skills, conduct",
                  "Filter candidates by ERS, major, university, certifications",
                  "See verified academic transcripts",
                  "Access conduct & attendance records from partner universities",
                  "View certification difficulty weight for each credential",
                  "Track candidate roadmap progress",
                  "Build and save talent pools",
                  "Shortlist and contact instantly",
                  "CO-OP eligibility badge for ready students",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mb-4 italic">Supports Saudization by helping companies identify prepared Saudi graduates faster and more fairly.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/signup?role=hr")}>Request Demo <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </motion.div>

            {/* Universities */}
            <motion.div className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <University className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-1">🏫 For Universities</h3>
              <p className="text-sm text-muted-foreground mb-4">Partner & empower your students.</p>
              <ul className="space-y-2 mb-6">
                {[
                  "Monitor student engagement and participation",
                  "Upload and track conduct & attendance records",
                  "Record positive contributions: events, mentoring, competitions",
                  "Record negative violations and disciplinary actions",
                  "Oversee CO-OP eligibility for students",
                  "Transparent assessment dashboard",
                  "Contribute to ERS governance framework",
                  "Pilot dashboards with real-time insights",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mb-4">Universities supply behavioral & participation data. System Admin controls scoring governance & certification approval.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/signup?role=university")}>Explore Partnership <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── Holistic Evaluation (preserved) ───────── */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading mb-3">More Than GPA. A Holistic Professional Identity.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">HireQimah evaluates the complete picture. Students build a verified, multi-dimensional professional profile.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { icon: BookOpen, label: "Academic Strength" },
            { icon: Award, label: "Professional Certifications" },
            { icon: Layers, label: "Technical Projects" },
            { icon: Heart, label: "Soft Skills" },
            { icon: Star, label: "Leadership" },
            { icon: Globe, label: "University Contribution" },
            { icon: Shield, label: "Conduct & Discipline" },
          ].map((item, i) => (
            <motion.div key={item.label} className="rounded-xl border bg-card p-4 text-center shadow-sm hover:shadow-md transition-shadow" {...fadeUp} transition={{ delay: i * 0.06 }}>
              <item.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── Saudization Impact (preserved) ───────── */}
      <section id="for-companies" className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">🇸🇦 Vision 2030 Aligned</span>
            <h2 className="text-3xl font-bold font-heading mt-2 mb-3">Supporting Saudization & National Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">HireQimah is positioned as a national impact platform, directly contributing to Saudi Arabia's workforce development goals.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: GraduationCap, text: "Preparing Saudi students for real market demand" },
              { icon: Zap, text: "Reducing skill gap between education and industry" },
              { icon: Briefcase, text: "Increasing internship & CO-OP placement efficiency" },
              { icon: Scale, text: "Creating transparency between universities and employers" },
              { icon: BarChart3, text: "Building measurable readiness metrics" },
            ].map((item, i) => (
              <motion.div key={i} className="rounded-xl border bg-card p-5 text-center shadow-sm" {...fadeUp} transition={{ delay: i * 0.08 }}>
                <item.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 4. PROTOTYPE NOTICE ───────── */}
      <section className="container py-16">
        <motion.div className="rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 p-8 md:p-10 text-center" {...fadeUp}>
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold font-heading mb-3">Early-Stage Prototype</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            HireQimah is currently in the <strong>pre-revenue prototype stage</strong>. All data shown on this platform is for demonstration and testing purposes only. No official university partnerships, corporate contracts, or verified integrations are active at this time.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Our vision is to partner with Saudi universities and companies to build the verified employment readiness infrastructure that the Kingdom needs. If you're interested in partnering, we'd love to connect.
          </p>
        </motion.div>
      </section>

      {/* ───────── 5. ROADMAP ───────── */}
      <section className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Our Vision Roadmap</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">From prototype to national infrastructure — three phases to transform Saudi talent readiness.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                phase: "Phase 1",
                title: "Prototype",
                status: "Current",
                icon: Rocket,
                items: [
                  "Core ERS scoring engine",
                  "Student, HR, and University dashboards",
                  "Certification point system",
                  "Basic matching & opportunity browsing",
                  "Demo data and test accounts",
                ],
              },
              {
                phase: "Phase 2",
                title: "Pilot",
                status: "Upcoming",
                icon: Eye,
                items: [
                  "First university partnerships & data integration",
                  "Initial HR onboarding and opportunity postings",
                  "Verified transcript integration",
                  "Attendance & conduct data pipelines",
                  "Student premium features",
                ],
              },
              {
                phase: "Phase 3",
                title: "National Scale",
                status: "Vision",
                icon: Globe,
                items: [
                  "Multi-university network",
                  "Enterprise HR subscriptions",
                  "AI-powered career roadmaps",
                  "Government & HRDF integration",
                  "National leaderboard & rankings",
                ],
              },
            ].map((p, i) => (
              <motion.div key={p.phase} className="rounded-xl border bg-card p-6 shadow-sm relative" {...fadeUp} transition={{ delay: i * 0.12, duration: 0.5 }}>
                <span className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  p.status === "Current" ? "bg-primary/10 text-primary" : p.status === "Upcoming" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {p.status}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{p.phase}</p>
                <h3 className="text-lg font-bold font-heading mb-3">{p.title}</h3>
                <ul className="space-y-2">
                  {p.items.map(item => (
                    <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Fairness (preserved) ───────── */}
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-heading mb-3">Transparent & Fair Scoring</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Predefined certification points, standardized activity scoring, percentile normalization across majors, and leaderboards per university & national level.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Fixed Cert Points", "Standardized Activities", "Percentile Normalization", "Conduct Impact", "CO-OP Priority"].map(tag => (
              <span key={tag} className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 6. CALL-TO-ACTION SECTION ───────── */}
      <section className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Ready to Build Your Qimah?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Join the prototype and explore how HireQimah can transform your career readiness, hiring process, or student engagement.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div className="rounded-xl border bg-card p-8 text-center shadow-sm" {...fadeUp} transition={{ delay: 0 }}>
              <GraduationCap className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading mb-2">Students</h3>
              <p className="text-sm text-muted-foreground mb-6">Register for the demo, explore your ERS, and start building your verified profile.</p>
              <Button className="w-full" onClick={() => navigate("/auth/select-role?mode=signup")}>
                Register Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div className="rounded-xl border bg-card p-8 text-center shadow-sm" {...fadeUp} transition={{ delay: 0.1 }}>
              <Building2 className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading mb-2">HR & Companies</h3>
              <p className="text-sm text-muted-foreground mb-6">Request a demo, explore the verified talent pool, and discover Saudization-aligned hiring.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/signup?role=hr")}>
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div className="rounded-xl border bg-card p-8 text-center shadow-sm" {...fadeUp} transition={{ delay: 0.2 }}>
              <University className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading mb-2">Universities</h3>
              <p className="text-sm text-muted-foreground mb-6">Explore partnership opportunities and contribute to the ERS governance framework.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/signup?role=university")}>
                Explore Partnership <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── 7. FOOTER ───────── */}
      <footer className="border-t bg-card py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="HireQimah" className="h-8" />
              <div>
                <p className="text-sm font-semibold text-foreground">HireQimah</p>
                <p className="text-xs text-muted-foreground">Empowering Saudi Talent. Supporting Vision 2030.</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground italic max-w-lg mx-auto">
              "The question is not whether Saudi Arabia needs employment readiness infrastructure. It is who builds it first."
            </p>
            <p className="text-xs text-muted-foreground mt-3">© 2026 HireQimah. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
