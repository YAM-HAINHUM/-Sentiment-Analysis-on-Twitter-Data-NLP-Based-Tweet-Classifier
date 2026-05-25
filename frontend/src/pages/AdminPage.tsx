import { useEffect, useState } from "react";
import { Users, BarChart2, TrendingUp, Shield } from "lucide-react";
import { adminAPI } from "../api/client";
import type { AdminData, SentimentLabel } from "../types";
import { SENTIMENT_COLORS } from "../utils/helpers";
import StatCard from "../components/ui/StatCard";
import Spinner from "../components/ui/Spinner";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "../store/authStore";

import toast from "react-hot-toast";

const TOOLTIP_STYLE = {
  contentStyle: { background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 },
};
const card = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20 };

function buildTrend(trend: Array<{ date: string; sentiment: string; count: number }>) {
  const map: Record<string, Record<string, number>> = {};
  for (const item of trend) {
    if (!map[item.date]) map[item.date] = {};
    map[item.date][item.sentiment] = item.count;
  }
  return Object.entries(map)
    .map(([date, vals]) => ({ date: date.slice(5), Positive: vals["Positive"] ?? 0, Negative: vals["Negative"] ?? 0, Neutral: vals["Neutral"] ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [trend, setTrend] = useState<Array<{ date: string; Positive: number; Negative: number; Neutral: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;

    Promise.all([adminAPI.data(), adminAPI.trends()])

      .then(([d, t]) => {
        setData(d.data as AdminData);
        setTrend(buildTrend((t.data as { trend: Array<{ date: string; sentiment: string; count: number }> }).trend));
      })
      .catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size={32} /></div>;
  if (!data) return null;

  const dist = data.sentiment_distribution;
  const total = data.total_analyses;
  const pieData = (["Positive", "Negative", "Neutral"] as SentimentLabel[]).map(s => ({ name: s, value: dist[s] ?? 0 }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <Shield size={18} style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Global platform analytics</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"    value={data.total_users}    icon={<Users size={16} />}    color="var(--color-primary)" />
        <StatCard title="Total Analyses" value={total}               icon={<BarChart2 size={16} />} color="#06b6d4" />
        <StatCard title="Positive"       value={dist["Positive"] ?? 0} icon={<span>😊</span>}      color="#10b981"
          subtitle={total ? `${Math.round(((dist["Positive"] ?? 0) / total) * 100)}%` : "—"} />
        <StatCard title="Negative"       value={dist["Negative"] ?? 0} icon={<span>😞</span>}      color="#ef4444"
          subtitle={total ? `${Math.round(((dist["Negative"] ?? 0) / total) * 100)}%` : "—"} />
      </div>

      {/* Pie + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={card}>
          <h2 className="text-sm font-semibold text-white mb-4">Global Sentiment Distribution</h2>
          {total === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--color-text-muted)" }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                  {pieData.map(entry => <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name as SentimentLabel]} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend formatter={v => <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-sm font-semibold text-white">Global Trend (30 Days)</h2>
          </div>
          {trend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--color-text-muted)" }}>Not enough data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend}>
                <defs>
                  {(["Positive", "Negative", "Neutral"] as SentimentLabel[]).map(s => (
                    <linearGradient key={s} id={`ag-${s}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={SENTIMENT_COLORS[s]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={SENTIMENT_COLORS[s]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                {(["Positive", "Negative", "Neutral"] as SentimentLabel[]).map(s => (
                  <Area key={s} type="monotone" dataKey={s} stroke={SENTIMENT_COLORS[s]} fill={`url(#ag-${s})`} strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div style={card}>
        <h2 className="text-sm font-semibold text-white mb-4">Registered Users ({data.total_users})</h2>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                {["Name", "Email", "Role", "Joined"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map(u => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3 text-sm text-white">{u.name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-muted)" }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={u.role === "admin"
                        ? { background: "rgba(124,58,237,0.15)", color: "var(--color-primary)", border: "1px solid rgba(124,58,237,0.3)" }
                        : { background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
