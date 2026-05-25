import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../store/themeStore";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl transition-all hover:bg-white/8"
      title={isDark ? "Switch to Light" : "Switch to Dark"}
      aria-label="Toggle theme"
    >
      {isDark
        ? <Sun size={18} className="text-yellow-400" />
        : <Moon size={18} className="text-slate-500" />}
    </button>
  );
}
