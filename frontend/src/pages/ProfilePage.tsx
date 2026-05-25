import { useState } from "react";
import { Mail, User, Calendar, Shield, Edit3, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../store/authStore";

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");

  const handleSave = () => {
    if (name.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    toast.success("Profile updated!");
    setEditing(false);
  };

  const card = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-heading)" }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Manage your personal information</p>
      </div>

      {/* Avatar + Name */}
      <div style={card} className="p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              {(user?.name?.[0] ?? "U").toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#10b981", border: "2px solid var(--color-surface)" }}>
              <Check size={10} className="text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="text-lg font-bold rounded-lg px-3 py-1.5 outline-none w-full"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.4)", color: "var(--color-text-heading)" }}
                  autoFocus
                />
                <button onClick={handleSave} className="p-1.5 rounded-lg transition-colors hover:bg-emerald-500/20" style={{ color: "#10b981" }}>
                  <Check size={16} />
                </button>
                <button onClick={() => { setEditing(false); setName(user?.name ?? ""); }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20" style={{ color: "#ef4444" }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-heading)" }}>{user?.name ?? "User"}</h2>
                <button onClick={() => setEditing(true)}
                  className="p-1 rounded-md transition-colors hover:bg-white/10"
                  style={{ color: "var(--color-text-muted)" }}>
                  <Edit3 size={13} />
                </button>
              </div>
            )}
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: user?.role === "admin" ? "rgba(239,68,68,0.12)" : "rgba(124,58,237,0.12)", color: user?.role === "admin" ? "#ef4444" : "var(--color-primary)" }}>
              <Shield size={10} />
              {user?.role === "admin" ? "Administrator" : "Member"}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={card}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Account Details</p>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {[
            { icon: <User size={15} />, label: "Full Name", value: user?.name ?? "—", color: "#7c3aed" },
            { icon: <Mail size={15} />, label: "Email Address", value: user?.email ?? "—", color: "#06b6d4" },
            { icon: <Shield size={15} />, label: "Role", value: user?.role === "admin" ? "Administrator" : "Member", color: "#10b981" },
            { icon: <Calendar size={15} />, label: "Member Since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—", color: "#f59e0b" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}18`, color: item.color }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
                <p className="text-sm font-medium truncate mt-0.5" style={{ color: "var(--color-text-heading)" }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Stats */}
      <div style={card} className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)" }}>Quick Stats</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Analyses", value: "—", color: "#7c3aed" },
            { label: "This Month", value: "—", color: "#06b6d4" },
            { label: "Accuracy", value: "—", color: "#10b981" },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
