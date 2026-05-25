import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Brain, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { authAPI } from "../api/client";
import { useAuth } from "../store/authStore";
import type { User as UserType } from "../types";

type Mode = "login" | "register";

export default function AuthPage({ mode: initialMode = "login" }: { mode?: Mode }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "register" && form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = mode === "login"
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.register(form);
      const { access_token, user } = res.data as { access_token: string; user: UserType };
      login(access_token, user);
      toast.success(`Welcome${user.name ? `, ${user.name}` : ""}!`);
      navigate("/app/analyze");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "w-full pl-9 pr-10 py-2.5 rounded-lg text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ background: "rgba(124,58,237,0.12)", filter: "blur(80px)" }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Brain size={24} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="text-2xl font-bold text-white">SentiAI</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Sentiment Analysis + AI Chatbot</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Tabs */}
          <div className="flex rounded-lg p-1 mb-6" style={{ background: "rgba(255,255,255,0.06)" }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}); }}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                style={mode === m ? { background: "var(--color-primary)", color: "#fff" } : { color: "var(--color-text-muted)" }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                  <input
                    type="text" placeholder="John Doe" value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }}
                    className={inputBase} style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : "rgba(255,255,255,0.1)" }}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input
                  type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: "" })); }}
                  className={inputBase} style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : "rgba(255,255,255,0.1)" }}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input
                  type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: "" })); }}
                  className={inputBase} style={{ ...inputStyle, borderColor: errors.password ? "#ef4444" : "rgba(255,255,255,0.1)" }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ background: "var(--color-primary)" }}
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "var(--color-text-muted)" }}>
            {mode === "login" ? "No account? " : "Already have one? "}
            <button onClick={() => { navigate(mode === "login" ? "/signup" : "/login"); setErrors({}); }} className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
