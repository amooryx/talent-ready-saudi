import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Shield, Trophy, BarChart3, GraduationCap, Building2, University,
  TrendingUp, CheckCircle, Briefcase, Target, Users, FileCheck, Award,
  BookOpen, AlertTriangle, Search, Star, Zap, Scale, Globe, Heart,
  ArrowRight, Layers, Rocket, Eye, ClipboardCheck, MapPin, Mail,
  Lock, Database, Brain, Activity, Gauge, LineChart, Cpu, ServerCrash,
  ShieldCheck, Fingerprint, FileSearch, LayoutDashboard, UserCheck,
  Microscope, Network, PieChart
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
              HireQimah is a structured employment readiness platform connecting students, universities, and employers through measurable performance signals, verified academic inputs, and transparent ERS scoring aligned with Saudi Arabia's Vision 2030 and workforce transformation goals.
            </motion.p>
            <motion.p
              className="text-sm text-white/60 mb-8 leading-relaxed max-w-xl italic"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            >
              Standardized readiness scoring · Verified academic inputs · Institutional integration pathway · Long-term workforce alignment
            </motion.p>
            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Button size="lg" className={`bg-primary text-primary-foreground hover:bg-primary/90 ${ctaBtnClass}`} onClick={() => navigate("/auth/select-role?mode=signup")}>
                <GraduationCap className="mr-2 h-5 w-5" /> Sign Up as Student
              </Button>
              <Button size="lg" className={`bg-secondary text-secondary-foreground hover:bg-secondary/90 ${ctaBtnClass}`} onClick={() => navigate("/auth/select-role?mode=signin")}>
                <Building2 className="mr-2 h-5 w-5" /> Sign In as HR
              </Button>
              <Button size="lg" className={`bg-secondary text-secondary-foreground hover:bg-secondary/90 ${ctaBtnClass}`} onClick={() => navigate("/signup?role=university")}>
                <University className="mr-2 h-5 w-5" /> Register as University
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
            HireQimah is not a job board. It is a structured <strong>Employment Readiness Infrastructure</strong> designed to create measurable, transparent signals between education and industry.
          </p>
        </div>
      </section>

      {/* ───────── PROBLEM STATEMENT ───────── */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">The Gap HireQimah Addresses</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Saudi Arabia's education-to-employment pipeline lacks structured, verified performance signals.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: University, title: "Universities Measure Grades, Not Readiness", desc: "Academic transcripts alone cannot communicate a graduate's true employment readiness or market alignment." },
            { icon: Building2, title: "Employers Lack Verified Signals", desc: "Hiring decisions rely on fragmented indicators — CVs, interviews, and unverified self-reported skills." },
            { icon: GraduationCap, title: "Students Lack Structured Visibility", desc: "Students have no standardized way to understand how their profile aligns with real market demand." },
            { icon: BarChart3, title: "No Readiness Infrastructure Exists", desc: "HireQimah introduces measurable readiness infrastructure that connects all stakeholders through transparent scoring." },
          ].map((item, i) => (
            <motion.div key={item.title} className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }}>
              <item.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold font-heading mb-2 text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── 2. HOW IT WORKS ───────── */}
      <section id="features" className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">How HireQimah Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A structured flow connecting students, HR, and universities through one verified ecosystem.</p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-6 mb-14">
            {[
              { step: "01", icon: GraduationCap, title: "Student Registers", desc: "Upload verified transcript, select GPA scale (4.0 / 5.0), and begin building your profile." },
              { step: "02", icon: BarChart3, title: "ERS Calculated", desc: "System analyzes academics, certifications, projects, soft skills, and conduct to generate the Employment Readiness Score." },
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

          {/* Dashboard feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Student Dashboard", icon: Target, items: ["ERS Score & Breakdown", "Career Roadmap Progress", "Certification Tracker", "Leaderboard Position", "CO-OP / Internship Eligibility"] },
              { title: "HR Dashboard", icon: Search, items: ["Verified Candidate Pool", "ERS Filter & Ranking", "Talent Pool Management", "Application Tracking", "Match Scoring"] },
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 3. ROLES & BENEFITS ───────── */}
      <section id="for-students" className="py-20">
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
              <ul className="space-y-2 mb-4">
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

              {/* Dashboard Features */}
              <div className="space-y-3 mb-4">
                <h4 className="font-semibold text-sm text-foreground">Dashboard Capabilities</h4>
                {[
                  { title: "Learning Intelligence Panel", items: "Skill radar visualization · Knowledge gap analysis · Retention tracking · Confidence scoring" },
                  { title: "Career Readiness Tracker", items: "Target job mapping · % readiness calculation · Missing competencies · Suggested improvement pathway" },
                  { title: "AI Study Optimization", items: "Personalized scheduling · Focus time detection · Burnout signals · Adaptive revision intervals" },
                  { title: "Verified Performance Portfolio", items: "Project validation · Simulation performance logs · Certification scoring breakdown · Recruiter visibility controls" },
                  { title: "Engagement Feedback", items: "Participation index · Conduct scoring transparency · Behavioral improvement insights" },
                ].map(f => (
                  <div key={f.title} className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.items}</p>
                  </div>
                ))}
              </div>

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
              <Button className="w-full" onClick={() => navigate("/auth/select-role?mode=signup")}>Sign Up as Student <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </motion.div>

            {/* HR */}
            <motion.div className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: 0.1, duration: 0.5 }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-1">🏢 For HR & Companies</h3>
              <p className="text-sm text-muted-foreground mb-4">Access structured, verified Saudi talent through ERS scoring.</p>
              <ul className="space-y-2 mb-4">
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

              {/* Dashboard Features */}
              <div className="space-y-3 mb-4">
                <h4 className="font-semibold text-sm text-foreground">Dashboard Capabilities</h4>
                {[
                  { title: "Talent Discovery Engine", items: "Filter by verified skills · ERS score ranges · Simulation performance metrics · Certification credibility" },
                  { title: "Reliability & Consistency Indicators", items: "Completion reliability score · Engagement consistency · Learning agility metrics" },
                  { title: "Cognitive Performance Overview", items: "Decision-making patterns (simulation-based) · Stress performance signals · Collaboration indicators" },
                  { title: "Interview & Engagement Tools", items: "Candidate shortlist builder · Interview request system · Structured evaluation templates" },
                ].map(f => (
                  <div key={f.title} className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.items}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mb-4 italic">Enterprise access and institutional licensing follow structured onboarding agreements.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/auth/select-role?mode=signin")}>Sign In as HR <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </motion.div>

            {/* Universities */}
            <motion.div className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <University className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-1">🏫 For Universities</h3>
              <p className="text-sm text-muted-foreground mb-4">Institutional integration for structured readiness tracking.</p>
              <ul className="space-y-2 mb-4">
                {[
                  "Monitor student engagement and participation",
                  "Upload and track conduct & attendance records",
                  "Record positive contributions: events, mentoring, competitions",
                  "Record negative violations and disciplinary actions",
                  "Oversee CO-OP eligibility for students",
                  "Transparent assessment dashboard",
                  "Contribute to ERS governance framework",
                  "Real-time institutional insights",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Dashboard Features */}
              <div className="space-y-3 mb-4">
                <h4 className="font-semibold text-sm text-foreground">Dashboard Capabilities</h4>
                {[
                  { title: "Cohort Intelligence Analytics", items: "Engagement heatmaps · Dropout risk signals · Curriculum gap indicators" },
                  { title: "AI Teaching Support Insights", items: "Lecture engagement analysis · Weak-topic identification · Recommended reinforcement areas" },
                  { title: "Academic Integrity Layer", items: "Behavioral anomaly detection · Authorship consistency signals" },
                  { title: "Institutional KPI Tracker", items: "Retention metrics · Participation growth · Employment alignment indicators" },
                ].map(f => (
                  <div key={f.title} className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.items}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mb-4">Enterprise access and institutional licensing follow structured onboarding agreements.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/signup?role=university")}>Register as University <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </motion.div>
          </div>

          {/* Admin Dashboard Features */}
          <motion.div className="mt-8 rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: 0.3, duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold font-heading">👨‍💼 Platform Administration</h3>
                <p className="text-xs text-muted-foreground">Centralized governance, security, and system monitoring</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { title: "Security & Governance Controls", items: "Role-based access control · Audit logs · Permission matrix" },
                { title: "System Monitoring", items: "Model performance tracking · Data quality metrics · Anomaly alerts" },
                { title: "Platform Growth Analytics", items: "Active institutions · User segmentation · Institutional onboarding tracking" },
                { title: "Revenue & Licensing Overview", items: "Institutional agreements tracking · Subscription tiers · Growth pipeline visibility" },
              ].map(f => (
                <div key={f.title} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.items}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Holistic Evaluation ───────── */}
      <section className="bg-accent/50 py-20">
        <div className="container">
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
        </div>
      </section>

      {/* ───────── Saudization Impact ───────── */}
      <section id="for-companies" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">🇸🇦 Vision 2030 Aligned</span>
            <h2 className="text-3xl font-bold font-heading mt-2 mb-3">Supporting Saudization & National Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">HireQimah is positioned as national employment readiness infrastructure, directly contributing to Saudi Arabia's workforce development goals.</p>
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

      {/* ───────── WORKFORCE INTELLIGENCE ───────── */}
      <section className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Beyond Matching — Building Workforce Intelligence</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">HireQimah's long-term vision extends beyond talent matching into structured workforce intelligence for the Kingdom.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Skill Gap Intelligence Engine", desc: "Identifying systemic gaps between university curricula and employer requirements across sectors." },
              { icon: LineChart, title: "Certification ROI Tracking", desc: "Measuring the real employment impact of professional certifications on hiring outcomes and ERS improvement." },
              { icon: Gauge, title: "CO-OP Placement Probability Scoring", desc: "Predictive scoring for CO-OP placement likelihood based on ERS, major alignment, and market demand." },
              { icon: PieChart, title: "Institutional Readiness Analytics", desc: "Aggregated performance analytics for universities to benchmark graduate readiness across programs." },
              { icon: TrendingUp, title: "Market Demand Alignment Tracking", desc: "Continuous monitoring of Saudi labor market trends to inform student roadmaps and university program design." },
              { icon: Globe, title: "National Readiness Benchmark Index", desc: "A long-term vision for a standardized national index measuring employment readiness across Saudi institutions." },
            ].map((item, i) => (
              <motion.div key={item.title} className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <item.icon className="h-7 w-7 text-primary mb-3" />
                <h3 className="font-semibold font-heading mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── DATA & SCORING GOVERNANCE ───────── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Data & Scoring Governance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Transparent methodology is foundational to HireQimah's design. Scoring integrity is centrally governed with institutional oversight.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp}>
              <h3 className="font-semibold font-heading mb-4">Scoring Governance</h3>
              <ul className="space-y-3">
                {[
                  "ERS scoring weights are centrally governed and auditable",
                  "Certification approvals follow predefined, transparent criteria",
                  "Conduct inputs require university validation before impacting scores",
                  "Students have full scoring transparency and breakdown visibility",
                  "No automated hiring rejection decisions — human oversight remains in recruitment",
                  "Percentile normalization per major ensures cross-discipline fairness",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div className="rounded-xl border bg-card p-6 shadow-sm" {...fadeUp} transition={{ delay: 0.1 }}>
              <h3 className="font-semibold font-heading mb-4">Fairness & Integrity Safeguards</h3>
              <ul className="space-y-3">
                {[
                  "Fixed certification weight structure prevents manipulation",
                  "Anti-manipulation safeguards detect anomalous scoring patterns",
                  "Auditability design enables independent review of scoring decisions",
                  "Structured review protocols for disputed scores",
                  "Behavioral performance signals validated by institutional sources",
                  "No single data point can disproportionately influence final ERS",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── Fairness Tags ───────── */}
      <section className="bg-accent/50 py-16">
        <div className="container text-center">
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

      {/* ───────── SECURITY & DATA PROTECTION ───────── */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold font-heading mb-3">Security & Data Protection</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Enterprise-grade architecture designed for institutional trust and regulatory compliance.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Lock, label: "Role-Based Access Control" },
              { icon: Database, label: "Secure Data Isolation per Institution" },
              { icon: FileSearch, label: "Audit Logging" },
              { icon: ShieldCheck, label: "Compliance-Ready Architecture" },
              { icon: Fingerprint, label: "Privacy-First Data Governance" },
            ].map((item, i) => (
              <motion.div key={item.label} className="rounded-xl border bg-card p-5 text-center shadow-sm" {...fadeUp} transition={{ delay: i * 0.06 }}>
                <item.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── DEVELOPMENT STATUS ───────── */}
      <section className="bg-accent/50 py-16">
        <div className="container">
          <motion.div className="rounded-xl border bg-card p-8 md:p-10 text-center shadow-sm" {...fadeUp}>
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold font-heading mb-3">Development Status</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
              HireQimah is currently in its early-stage development phase. The platform is being actively refined to support future institutional and corporate integrations aligned with Vision 2030 and Saudization priorities.
            </p>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              No official university partnerships or corporate integrations are active at this time. If you're interested in exploring institutional collaboration, we welcome the conversation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ───────── 5. ROADMAP ───────── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Our Vision Roadmap</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">From early-stage development to national infrastructure — three phases to transform Saudi talent readiness.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                phase: "Phase 1",
                title: "Foundation",
                status: "Current",
                icon: Rocket,
                items: [
                  "Core ERS scoring engine",
                  "Student, HR, and University dashboards",
                  "Certification point system",
                  "Basic matching & opportunity browsing",
                  "Platform refinement & scoring validation",
                  "Controlled early-user onboarding",
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
                  "Skill Gap Analytics",
                  "Certification ROI modeling",
                  "CO-OP probability scoring",
                  "National Readiness Benchmark Index",
                  "Institutional performance dashboards",
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

      {/* ───────── 6. CALL-TO-ACTION SECTION ───────── */}
      <section className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Ready to Build Your Qimah?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div className="rounded-xl border bg-card p-8 text-center shadow-sm" {...fadeUp} transition={{ delay: 0 }}>
              <GraduationCap className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading mb-2">Students</h3>
              <p className="text-sm text-muted-foreground mb-6">Build your verified readiness profile and track your Qimah.</p>
              <Button className="w-full" onClick={() => navigate("/auth/select-role?mode=signup")}>
                Sign Up as Student <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div className="rounded-xl border bg-card p-8 text-center shadow-sm" {...fadeUp} transition={{ delay: 0.1 }}>
              <Building2 className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading mb-2">HR & Companies</h3>
              <p className="text-sm text-muted-foreground mb-6">Access structured, verified Saudi talent through ERS scoring.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/auth/select-role?mode=signin")}>
                Sign In as HR <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div className="rounded-xl border bg-card p-8 text-center shadow-sm" {...fadeUp} transition={{ delay: 0.2 }}>
              <University className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading mb-2">Universities</h3>
              <p className="text-sm text-muted-foreground mb-6">Register your institution and contribute to structured readiness tracking.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/signup?role=university")}>
                Register as University <ArrowRight className="ml-2 h-4 w-4" />
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
                <p className="text-xs text-muted-foreground">Employment Readiness Infrastructure for Saudi Arabia.</p>
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
              Building measurable readiness for the future Saudi workforce.
            </p>
            <p className="text-xs text-muted-foreground mt-3">© 2026 HireQimah. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
