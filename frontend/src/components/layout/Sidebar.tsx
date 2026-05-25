import { NavLink, useNavigate } from "react-router-dom";
import { Brain, BarChart3, History, LogOut, ChevronLeft, ChevronRight, User, Lightbulb, Shield, Settings, TrendingUp, HeartPulse, Download } from "lucide-react";

import { useState } from "react";
import { useAuth } from "../../store/authStore";
import toast from "react-hot-toast";

const NAV = [
  { path: "/app/analyze",   icon: <Brain size={18} />,     label: "Analyze" },
  { path: "/app/dashboard", icon: <BarChart3 size={18} />, label: "Dashboard" },
  { path: "/app/trends",    icon: <TrendingUp size={18} />, label: "Trends / Analytics" },
  { path: "/app/emotions",  icon: <HeartPulse size={18} />, label: "Emotions" },
  { path: "/app/reports",   icon: <Download size={18} />, label: "Saved Reports" },
  { path: "/app/history",   icon: <History size={18} />,   label: "History" },
  { path: "/app/insights",  icon: <Lightbulb size={18} />, label: "AI Insights" },

];


const BOTTOM_NAV = [
  { path: "/app/profile",  icon: <User size={18} />,     label: "Profile" },
  { path: "/app/settings", icon: <Settings size={18} />, label: "Settings" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? "text-violet-400" : "hover:text-white"}`;

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
  });

  return (
    <aside
      className="relative flex flex-col h-screen flex-shrink-0 transition-all duration-300"
      style={{ width: collapsed ? 64 : 224, background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "var(--color-primary)" }}>
          <Brain size={16} className="text-white" />
        </div>
        {!collapsed && <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-heading)" }}>SentiAI</span>}
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.path} to={item.path} title={collapsed ? item.label : undefined}
            className={navLinkClass} style={navLinkStyle}>
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <>
            {!collapsed && (
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>Admin</p>
              </div>
            )}
            <NavLink to="/app/admin" title={collapsed ? "Admin Panel" : undefined}
              className={navLinkClass} style={navLinkStyle}>
              <Shield size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">Admin Panel</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom Nav (Profile + Settings) */}
      <div className="p-2 space-y-1" style={{ borderTop: "1px solid var(--color-border)" }}>
        {BOTTOM_NAV.map(item => (
          <NavLink key={item.path} to={item.path} title={collapsed ? item.label : undefined}
            className={navLinkClass} style={navLinkStyle}>
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mt-1" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              {(user.name?.[0] ?? "U").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-heading)" }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)", fontSize: 10 }}>{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-150 hover:text-red-400"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10"
        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-text-muted)" }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
