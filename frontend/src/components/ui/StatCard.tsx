import type { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon, color = "var(--color-primary)", subtitle }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl p-5 transition-all"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>{title}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}1a`, color }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}
