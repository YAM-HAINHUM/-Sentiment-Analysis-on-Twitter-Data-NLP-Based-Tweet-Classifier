import { useNavigate } from "react-router-dom";
import { Brain, BarChart3, Bot, Lightbulb, ArrowRight, CheckCircle, Star, Zap, Shield, TrendingUp, ExternalLink } from "lucide-react";
import { useAuth } from "../store/authStore";
import { useTheme } from "../store/themeStore";
import { Sun, Moon } from "lucide-react";

const FEATURES = [
  {
    icon: <Brain size={22} />,
    title: "Sentiment Analysis",
    desc: "Analyze text sentiment in real-time using VADER NLP engine with confidence scoring and keyword extraction.",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
  },
  {
    icon: <Lightbulb size={22} />,
    title: "AI Insights",
    desc: "Get deep AI-powered insights from your sentiment data with trend analysis and actionable recommendations.",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Analytics Dashboard",
    desc: "Visualize sentiment trends, distributions, and patterns with interactive charts and exportable reports.",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
  },
  {
    icon: <Bot size={22} />,
    title: "AI Chatbot",
    desc: "Chat with an AI assistant trained on your sentiment data to explore insights conversationally.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  {
    icon: <Zap size={22} />,
    title: "Real-time Processing",
    desc: "Process thousands of texts in milliseconds with our optimized NLP pipeline and batch analysis.",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
  },
  {
    icon: <Shield size={22} />,
    title: "Secure & Private",
    desc: "JWT-based authentication, encrypted storage, and role-based access control keep your data safe.",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
  },
];

const STEPS = [
  { num: "01", title: "Enter Your Text", desc: "Paste any text — tweets, reviews, feedback, or articles — into the analysis input." },
  { num: "02", title: "AI Analyzes Sentiment", desc: "Our VADER NLP engine processes the text and extracts sentiment scores, keywords, and confidence." },
  { num: "03", title: "Get Insights & Reports", desc: "View detailed results, export reports, and explore trends in your personal analytics dashboard." },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Product Manager", text: "SentiAI transformed how we process customer feedback. The real-time analysis saves us hours every week.", rating: 5 },
  { name: "James R.", role: "Data Analyst", text: "The analytics dashboard is incredibly intuitive. I can spot sentiment trends instantly and share reports with my team.", rating: 5 },
  { name: "Priya M.", role: "Marketing Lead", text: "The AI chatbot feature is a game-changer. I can ask questions about our data and get instant answers.", rating: 5 },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleGetStarted = () => {
    if (isAuthenticated) navigate("/app/analyze");
    else navigate("/login");
  };

  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100vh" }}>

      {/* ── Sticky Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-nav-bg)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--color-text-heading)" }}>SentiAI</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {["Features", "How It Works", "About"].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium transition-colors hover:text-violet-400"
                style={{ color: "var(--color-text-muted)" }}>
                {link}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }}
              title={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => navigate("/login")}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
              Login
            </button>
            <button onClick={() => navigate("/signup")}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "var(--color-primary)" }}>
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(6,182,212,0.06)", filter: "blur(60px)" }} />
        <div className="absolute top-20 right-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(16,185,129,0.06)", filter: "blur(60px)" }} />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}>
            <Zap size={11} />
            Powered by VADER NLP + OpenAI
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6" style={{ color: "var(--color-text-heading)" }}>
            AI-Powered{" "}
            <span style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Sentiment Intelligence
            </span>{" "}
            Platform
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
            Analyze, understand, and act on user sentiment in real-time. Turn raw text into actionable insights with enterprise-grade NLP.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={handleGetStarted}
              className="flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 30px rgba(124,58,237,0.35)" }}>
              Get Started Free
              <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate("/app/analyze")}
              className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }}>
              Try Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16">
            {[["10K+", "Analyses Run"], ["99.9%", "Uptime"], ["< 50ms", "Response Time"], ["3", "NLP Models"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--color-text-heading)" }}>{val}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6" style={{ background: "var(--color-section-alt)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>Features</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text-heading)" }}>Everything you need to understand sentiment</h2>
            <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
              A complete platform for sentiment analysis, from single texts to bulk processing and AI-driven insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl p-6 transition-all hover:-translate-y-1"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "var(--color-text-heading)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text-heading)" }}>From text to insights in seconds</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px" style={{ background: "linear-gradient(90deg, var(--color-primary), transparent)" }} />
                )}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "var(--color-primary)" }}>
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "var(--color-text-heading)" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6" style={{ background: "var(--color-section-alt)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text-heading)" }}>Trusted by teams worldwide</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" stroke="none" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--color-text-muted)" }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.25)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />
          <div className="relative">
            <TrendingUp size={36} className="mx-auto mb-4" style={{ color: "var(--color-primary)" }} />
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--color-text-heading)" }}>Ready to understand your users?</h2>
            <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>Start analyzing sentiment for free. No credit card required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate("/signup")}
                className="px-8 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "var(--color-primary)" }}>
                Create Free Account
              </button>
              <button onClick={() => navigate("/login")}
                className="px-8 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="about" className="py-12 px-6" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
                  <Brain size={14} className="text-white" />
                </div>
                <span className="font-bold" style={{ color: "var(--color-text-heading)" }}>SentiAI</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--color-text-muted)" }}>
                AI-powered sentiment analysis platform for teams who care about understanding their users.
              </p>
              <div className="flex gap-3 mt-4">
                {[ExternalLink, ExternalLink, ExternalLink].map((Icon, i) => (
                  <button key={i} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-violet-400"
                    style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)" }}>Product</p>
              <div className="space-y-2">
                {["Features", "Dashboard", "Analytics", "API Docs"].map(l => (
                  <p key={l} className="text-sm cursor-pointer hover:text-violet-400 transition-colors" style={{ color: "var(--color-text-muted)" }}>{l}</p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)" }}>Company</p>
              <div className="space-y-2">
                {["About", "Privacy Policy", "Terms of Service", "Contact"].map(l => (
                  <p key={l} className="text-sm cursor-pointer hover:text-violet-400 transition-colors" style={{ color: "var(--color-text-muted)" }}>{l}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>© {new Date().getFullYear()} SentiAI. All rights reserved.</p>
            <div className="flex items-center gap-1 mt-2 md:mt-0">
              <CheckCircle size={12} style={{ color: "#10b981" }} />
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>All systems operational</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
