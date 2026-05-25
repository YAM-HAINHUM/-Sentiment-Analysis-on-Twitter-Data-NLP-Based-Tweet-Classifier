import { useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, Bell, Lock, Shield, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../store/authStore";
import { useTheme } from "../store/themeStore";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const section = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-heading)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Manage your preferences and account</p>
      </div>

      {/* Appearance */}
      <div style={section}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Appearance</p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
                {isDark ? <Moon size={16} style={{ color: "var(--color-primary)" }} /> : <Sun size={16} style={{ color: "#f59e0b" }} />}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-heading)" }}>Theme</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{isDark ? "Dark mode is active" : "Light mode is active"}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
              style={{ background: isDark ? "var(--color-primary)" : "rgba(255,255,255,0.15)" }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                style={{ left: isDark ? "calc(100% - 22px)" : "2px" }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Account */}
      <div style={section}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Account</p>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {[
            { icon: <Lock size={15} />, label: "Change Password", sub: "Update your account password", color: "#7c3aed" },
            { icon: <Bell size={15} />, label: "Notifications", sub: "Manage email and push notifications", color: "#06b6d4" },
            { icon: <Shield size={15} />, label: "Privacy & Security", sub: "Control your data and privacy settings", color: "#10b981" },
          ].map(item => (
            <button key={item.label}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/5 text-left"
              onClick={() => toast("Coming soon!", { icon: "🚧" })}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-heading)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: "var(--color-text-muted)" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Session */}
      <div style={section}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Session</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-heading)" }}>{user?.name ?? "User"}</p>
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{user?.email}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
              {user?.role ?? "user"}
            </span>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>

      <p className="text-center text-xs pb-4" style={{ color: "var(--color-text-muted)" }}>
        SentiAI v1.0.0 · © {new Date().getFullYear()}
      </p>
    </div>
  );
}
