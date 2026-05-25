import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Sun, Moon, LogOut, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => !document.documentElement.classList.contains("light"));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [dark]);

  const handleLogout = () => { logout(); navigate("/auth"); };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate("/")} className="btn-ghost flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Chat
        </button>

        <h1 className="text-xl font-bold text-white mb-6">Settings</h1>

        {/* Profile */}
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-600 mt-1">
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dark ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-yellow-400" />}
              <div>
                <p className="text-sm font-medium text-white">{dark ? "Dark Mode" : "Light Mode"}</p>
                <p className="text-xs text-gray-500">Toggle interface theme</p>
              </div>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${dark ? "bg-indigo-600" : "bg-gray-600"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${dark ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Account</h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
