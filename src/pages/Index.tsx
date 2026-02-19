import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Shield, Trophy, BarChart3, GraduationCap, Building2, University,
  TrendingUp, CheckCircle, Briefcase, Target, Users, FileCheck, Award,
  BookOpen, AlertTriangle, Search, Star, Zap, Scale, Globe, Heart,
  ArrowRight, Layers
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/hireqimah-logo.png";

const Index = () => {
  const navigate = useNavigate();

  const ctaBtnClass = "font-semibold px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 h-12 text-base";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[700px] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(203,79%,10%)/0.95] via-[hsl(203,79%,15%)/0.90] to-[hsl(217,80%,30%)/0.75]" />

        <div className="relative container py-20 md:py-28 z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
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
                A verified career readiness and opportunity platform helping Saudi university students understand market demand, build competitive profiles, earn measurable value (Qimah), and connect directly with HR for CO-OP, internships, and junior roles.
              </motion.p>
              <motion.p
                className="text-sm text-white/70 mb-8 leading-relaxed max-w-xl"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
              >
                Whether you are a freshman exploring your path, a student searching for CO-OP, or a graduate looking for your first opportunity — HireQimah shows you exactly what skills the Saudi market demands, which certifications are most valued, how to increase your Employment Readiness Score (ERS), and how to become visible to HR actively searching for Qimah students.
              </motion.p>
              <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Button size="lg" className={`bg-primary text-primary-foreground hover:bg-primary/90 ${ctaBtnClass}`} onClick={() => navigate("/signup?role=student")}>
                  <GraduationCap className="mr-2 h-5 w-5" /> Sign Up as Student
                </Button>
                <Button size="lg" className={`bg-secondary text-secondary-foreground hover:bg-secondary/90 ${ctaBtnClass}`} onClick={() => navigate("/signup?role=hr")}>
                  <Building2 className="mr-2 h-5 w-5" /> Sign Up as HR
                </Button>
                <Button size="lg" className={`bg-secondary text-secondary-foreground hover:bg-secondary/90 ${ctaBtnClass}`} onClick={() => navigate("/signup?role=university")}>
                  <University className="mr-2 h-5 w-5" /> Partner as University
                </Button>
              </motion.div>
              <motion.p className="mt-5 text-white/50 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                Already have an account? <button onClick={() => navigate("/login")} className="text-[hsl(207,89%,80%)] hover:underline font-medium">Sign In</button>
              </motion.p>
            </div>
            <motion.div className="hidden md:grid grid-cols-2 gap-3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.7 }}>
              {[
                { icon: Target, label: "ERS Score", value: "92/100" },
                { icon: Trophy, label: "Rank", value: "Top 1%" },
                { icon: Users, label: "Students", value: "2,400+" },
                { icon: Briefcase, label: "Opportunities", value: "150+" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-5 text-center">
                  <s.icon className="h-6 w-6 text-[hsl(207,89%,80%)] mx-auto mb-2" />
                  <p className="text-2xl font-bold font-heading text-white">{s.value}</p>
                  <p className="text-xs text-white/60">{s.label}</p>
                </div>
              ))}
            </motion.div>
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

      {/* Why HireQimah */}
      <section id="features" className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Why HireQimah Instead of Traditional Job Platforms?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">LinkedIn is crowded. CVs are inconsistent. Market requirements are unclear. HR spends time filtering unverified applicants. HireQimah solves this.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: FileCheck, title: "Verified Transcripts", desc: "No more self-reported data. Academic records are verified and weighted by market relevance." },
            { icon: BarChart3, title: "Structured Scoring (ERS)", desc: "A standardized Employment Readiness Score measuring academics, certifications, projects, soft skills, and conduct." },
            { icon: Award, title: "Pre-Calculated Cert Weights", desc: "Every certification has a fixed difficulty-based point value — fair and transparent for all students." },
            { icon: AlertTriangle, title: "Conduct & Attendance", desc: "University-provided discipline records, attendance, and case history visible to HR." },
            { icon: TrendingUp, title: "AI Roadmap from Saudi Demand", desc: "Personalized career roadmaps based on the latest Saudi job listings and market skill gaps." },
            { icon: Search, title: "Direct HR Visibility", desc: "Top-ranked students are visible to HR. No more lost applications — companies find you." },
          ].map((f, i) => (
            <motion.div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-heading mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            "CO-OP Readiness Indicators",
            "Fair Standardized Point System",
            "Soft Skills & Leadership Tracked",
          ].map(tag => (
            <div key={tag} className="flex items-center gap-2 rounded-lg border bg-accent/50 px-4 py-3 text-sm font-medium text-accent-foreground">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />{tag}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto font-medium">
          HireQimah motivates students to <strong>grow</strong>, not just apply.
        </p>
      </section>

      {/* Build Your Qimah - Student Section */}
      <section id="for-students" className="bg-accent/50 py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">🎓 For Students</span>
              <h2 className="text-3xl font-bold font-heading mt-2 mb-4">Build Your Qimah. Compete. Get Hired.</h2>
              <p className="text-muted-foreground mb-6">Students earn points through a structured, transparent system. Harder achievements earn higher points. Compete on leaderboards and become visible to HR.</p>
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-sm text-foreground">Earn Points By:</h4>
                <ul className="space-y-2">
                  {[
                    "Completing professional certifications (fixed point system by difficulty)",
                    "Participating in university activities (events, mentoring, competitions)",
                    "Mentoring freshmen & public speaking",
                    "Winning hackathons & competitions",
                    "Research publications & open-source contributions",
                    "Maintaining strong attendance & avoiding misconduct",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-sm text-foreground">Platform Features:</h4>
                <ul className="space-y-2">
                  {[
                    "Upload verified transcript (not manual GPA entry for scoring)",
                    "Select GPA scale (4.0 or 5.0 system)",
                    "AI analyzes 100+ Saudi job listings in your major",
                    "Receive your Employment Readiness Score (ERS)",
                    "Dynamic roadmap based on Saudi LinkedIn listings & market demand",
                    "Track CO-OP & internship eligibility",
                    "Get matched with HR & apply with one click",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                {["Per Major", "Per University", "National Ranking"].map(tag => (
                  <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">🏆 {tag}</span>
                ))}
              </div>
              <Button className="mt-2" onClick={() => navigate("/signup?role=student")}>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h4 className="font-semibold font-heading mb-4">ERS Scoring Model</h4>
              <p className="text-xs text-muted-foreground mb-4">ERS = (40% Academic) + (25% Certifications) + (15% Projects) + (10% Soft Skills) + (10% Conduct)</p>
              <div className="space-y-3">
                {[
                  { label: "Academic Performance", pct: 40 },
                  { label: "Certifications (Fixed Points)", pct: 25 },
                  { label: "Projects", pct: 15 },
                  { label: "Soft Skills & Activities", pct: 10 },
                  { label: "Conduct & Attendance", pct: 10 },
                ].map(w => (
                  <div key={w.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{w.label}</span>
                      <span className="font-semibold text-primary">{w.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${w.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HR Section */}
      <section id="for-companies" className="container py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="order-2 md:order-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: FileCheck, label: "Verified Transcripts" },
                { icon: BarChart3, label: "ERS Breakdown" },
                { icon: AlertTriangle, label: "Conduct & Attendance" },
                { icon: Search, label: "Filter by ERS, Major, Certs" },
                { icon: Award, label: "CO-OP Eligible Badge" },
                { icon: Users, label: "Talent Pools" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Saudi Aramco", "NEOM", "STC", "SABIC", "Riyad Bank", "Elm"].map((c, i) => (
                <motion.div key={c} className="rounded-lg border bg-card p-3 text-center text-xs font-medium shadow-sm" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  {c}
                </motion.div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <span className="text-sm font-semibold text-secondary uppercase tracking-wider">🏢 For HR & Companies</span>
            <h2 className="text-3xl font-bold font-heading mt-2 mb-4">Hire Verified Saudi Qimah.</h2>
            <p className="text-muted-foreground mb-4">This supports Saudization by helping companies identify prepared Saudi graduates faster and more fairly.</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Post CO-OP, internship, and junior opportunities",
                "Filter students by ERS, major, university, certifications",
                "View verified academic transcripts",
                "See full ERS breakdown (Academic, Certifications, Soft Skills, Conduct)",
                "Access discipline & attendance reports (from partner universities)",
                "View student case history (if misconduct recorded)",
                "See certification difficulty weight for each credential",
                "Track roadmap progress of candidates",
                "Build talent pools & shortlist instantly",
                "One-click applicant profiles with AI match ranking",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6" onClick={() => navigate("/signup?role=hr")}>Explore Talent <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      {/* For Universities */}
      <section className="bg-accent/50 py-20">
        <div className="container">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">🏫 For Universities</span>
            <h2 className="text-3xl font-bold font-heading mt-2 mb-3">Partner & Empower Your Students</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">When partnered, universities provide behavioral and participation data that enriches student ERS and increases employer trust.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileCheck, title: "Conduct & Attendance", items: ["Upload attendance records", "Record disciplinary cases", "Academic warnings", "CO-OP eligibility status"] },
              { icon: BookOpen, title: "Student Engagement", items: ["Record positive contributions", "Participation activities", "Mentoring & leadership", "Competition & event records"] },
              { icon: BarChart3, title: "Impact on ERS", items: ["Conduct affects scoring", "Attendance below threshold reduces ERS", "Case history visible to HR", "Transparent and fair system"] },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold font-heading mb-3">{card.title}</h3>
                <ul className="space-y-1.5">
                  {card.items.map(item => (
                    <li key={item} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Universities supply behavioral & participation data. System Admin controls scoring governance & certification approval.
          </p>
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => navigate("/signup?role=university")}>Partner with HireQimah</Button>
          </div>
        </div>
      </section>

      {/* Holistic Evaluation */}
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
            <motion.div key={item.label} className="rounded-xl border bg-card p-4 text-center shadow-sm hover:shadow-md transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <item.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CO-OP & Marketplace */}
      <section className="bg-accent/50 py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">CO-OP & Internships</span>
              <h2 className="text-3xl font-bold font-heading mt-2 mb-4">Secure Your Placement</h2>
              <p className="text-muted-foreground mb-4">
                HireQimah helps students secure CO-OP placements (required for graduation in Saudi universities), internships, and junior-level offers. HR can filter for "CO-OP Ready Students".
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["CO-OP placements required for graduation", "Internship tracking & eligibility", "Junior-level career entry", "HR filters: CO-OP Ready badge"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><Briefcase className="h-4 w-4 text-primary mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Verified Talent Marketplace</span>
              <h2 className="text-3xl font-bold font-heading mt-2 mb-4">More Than a Scoring Platform</h2>
              <p className="text-muted-foreground mb-4">
                HireQimah is a verified marketplace connecting Saudi students and HR teams. Students apply in one click using verified academic and conduct records. HR selects top candidates using transparent AI-powered ranking.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Profile-based one-click apply", "AI match ranking for every applicant", "Transparent scoring & fairness", "Saudization-aligned hiring"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Saudization Impact */}
      <section className="container py-20">
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
            <motion.div key={i} className="rounded-xl border bg-card p-5 text-center shadow-sm" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <item.icon className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Fairness */}
      <section className="bg-accent/50 py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-bold font-heading mb-3">Transparent & Fair Scoring</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Predefined certification points, standardized activity scoring, percentile normalization across majors, and leaderboards per university & national level. Emphasizing fairness & Saudization alignment.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Fixed Cert Points", "Standardized Activities", "Percentile Normalization", "Conduct Impact", "CO-OP Priority"].map(tag => (
              <span key={tag} className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="HireQimah" className="h-8" />
            <span className="text-sm text-muted-foreground">© 2026 HireQimah. Supporting Vision 2030.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
