import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuth } from "../../store/authStore";

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        >
          <h1 className="text-base font-semibold hidden lg:block" style={{ color: "var(--color-text-heading)" }}>
            AI Sentiment Analytics
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-2 pl-2" style={{ borderLeft: "1px solid var(--color-border)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                  {(user.name?.[0] ?? "U").toUpperCase()}
                </div>
                <span className="text-sm hidden md:block" style={{ color: "var(--color-text-muted)" }}>{user.name}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
