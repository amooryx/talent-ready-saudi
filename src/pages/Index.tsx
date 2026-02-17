import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, Trophy, BarChart3, GraduationCap, Building2, University, Star, Users, TrendingUp, CheckCircle } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/hireqimah-logo.png";

const features = [
  { icon: Shield, title: "Verified Talent", desc: "Transcripts, certificates, and Credly IDs are verified for authenticity." },
  { icon: Trophy, title: "ERS Scoring", desc: "Employment Readiness Score powered by AI analysis of 100+ job listings per major." },
  { icon: BarChart3, title: "Leaderboards", desc: "Rank globally, per university, or per major. Gamified badges and progress." },
  { icon: TrendingUp, title: "Career Roadmaps", desc: "Personalized AI recommendations for certifications, courses, and projects." },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 opacity-30">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative container py-20 md:py-32 text-center">
          <motion.img
            src={logo}
            alt="HireQimah"
            className="mx-auto h-20 md:h-24 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.h1
            className="text-4xl md:text-6xl font-bold font-heading text-primary-foreground mb-4 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Saudi Arabia's <span className="text-accent">Verified Talent</span> Platform
          </motion.h1>
          <motion.p
            className="mx-auto max-w-2xl text-lg md:text-xl text-primary-foreground/80 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Connecting university students with top companies through verified credentials, AI-powered readiness scoring, and personalized career roadmaps. Supporting Vision 2030 & Saudization.
          </motion.p>
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base px-8" onClick={() => navigate("/login?role=student")}>
              <GraduationCap className="mr-2 h-5 w-5" /> Sign Up as Student
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base px-8" onClick={() => navigate("/login?role=hr")}>
              <Building2 className="mr-2 h-5 w-5" /> Sign Up as HR
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base px-8" onClick={() => navigate("/login?role=admin")}>
              <University className="mr-2 h-5 w-5" /> Partner as University
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Why HireQimah?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">A comprehensive platform that bridges the gap between Saudi talent and industry needs.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-heading mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* For Students */}
      <section id="for-students" className="bg-primary/5 py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">For Students</span>
              <h2 className="text-3xl font-bold font-heading mt-2 mb-4">Launch Your Career with Confidence</h2>
              <ul className="space-y-3">
                {["Upload transcripts & get your ERS instantly", "Compete on leaderboards across universities", "Follow AI-powered career roadmaps", "Earn badges & get noticed by top companies"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6" onClick={() => navigate("/login?role=student")}>Get Started</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Star, label: "ERS Score", value: "92/100" },
                { icon: Trophy, label: "Rank", value: "Top 1%" },
                { icon: Users, label: "Competing", value: "2,400+" },
                { icon: TrendingUp, label: "Roadmap", value: "78%" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  className="rounded-xl border bg-card p-5 text-center shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold font-heading">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Companies */}
      <section id="for-companies" className="container py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 grid grid-cols-3 gap-3">
            {["Saudi Aramco", "NEOM", "STC", "Sabic", "stc pay", "Elm"].map((c, i) => (
              <motion.div
                key={c}
                className="rounded-lg border bg-card p-4 text-center text-sm font-medium shadow-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                {c}
              </motion.div>
            ))}
          </div>
          <div className="order-1 md:order-2">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">For Companies</span>
            <h2 className="text-3xl font-bold font-heading mt-2 mb-4">Find Verified, Industry-Ready Talent</h2>
            <p className="text-muted-foreground mb-4">Search candidates by ERS, skills, certifications, and major. Build talent pools and get alerts when top students appear.</p>
            <Button variant="outline" onClick={() => navigate("/login?role=hr")}>Explore Talent</Button>
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
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
