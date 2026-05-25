import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Activity, PieChart as PieIcon, Hash, Calendar } from "lucide-react";
import { historyAPI, exportAPI } from "../api/client";
import type { StatsResponse, AnalyticsResponse, SentimentLabel } from "../types";
import { SENTIMENT_COLORS } from "../utils/helpers";
import StatCard from "../components/ui/StatCard";
import Spinner from "../components/ui/Spinner";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 },
};
const card = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20 };

const DAY_OPTIONS = [7, 14, 30, 90];

function buildTrendSeries(trend: { date: string; sentiment: string; count: number }[]) {
  const dateMap: Record<string, Record<string, number>> = {};
  for (const item of trend) {
    if (!dateMap[item.date]) dateMap[item.date] = {};
    dateMap[item.date][item.sentiment as string] = item.count;
  }
  return Object.entries(dateMap)
    .map(([date, vals]) => ({ date: date.slice(5), Positive: vals["Positive"] ?? 0, Negative: vals["Negative"] ?? 0, Neutral: vals["Neutral"] ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      historyAPI.stats(),
      historyAPI.analytics(days),
    ])
      .then(([s, a]) => {
        if (!mounted) return;
        setStats(s.data as StatsResponse);
        setAnalytics(a.data as AnalyticsResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    setLoading(true);
    return () => { mounted = false; };
  }, [days]);


  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await exportAPI.pdfReport("Sentiment Analytics Report");
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "sentiment_report.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported!");
    } catch { toast.error("PDF export failed"); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size={32} /></div>;

  const dist = (stats?.distribution ?? {}) as Record<string, number>;
  const total = stats?.total ?? 0;
  const pieData = (["Positive", "Negative", "Neutral"] as SentimentLabel[]).map(s => ({ name: s, value: dist[s] ?? 0 }));
  const trendSeries = buildTrendSeries((analytics?.trend ?? []) as { date: string; sentiment: string; count: number }[]);

  // Top keywords for bar chart
  const keywordData = (analytics?.all_keywords ?? []).slice(0, 12).map(k => ({
    word: k.word,
    count: k.count,
    fill: k.type === "positive" ? "#10b981" : k.type === "negative" ? "#ef4444" : "#f59e0b",
  }));

  // Word cloud data (simple tag cloud)
  const wordCloudData = (analytics?.all_keywords ?? []).slice(0, 30);

  const posConf = analytics?.confidence_by_sentiment?.["Positive"];
  const negConf = analytics?.confidence_by_sentiment?.["Negative"];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Your sentiment analysis overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
          <div className="flex gap-1">
            {DAY_OPTIONS.map(d => (
              <button key={d} onClick={() => setDays(d)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={days === d ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={handleExportPdf} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--color-primary)" }}>
            {exporting ? <Spinner size={11} /> : "↓"} PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Analyses" value={total} icon={<Activity size={16} />} color="var(--color-primary)" />
        <StatCard title="Positive" value={dist["Positive"] ?? 0} icon={<span>😊</span>} color="#10b981"
          subtitle={total ? `${Math.round(((dist["Positive"] ?? 0) / total) * 100)}% · avg ${posConf ? (posConf * 100).toFixed(0) : "—"}% conf` : "—"} />
        <StatCard title="Negative" value={dist["Negative"] ?? 0} icon={<span>😞</span>} color="#ef4444"
          subtitle={total ? `${Math.round(((dist["Negative"] ?? 0) / total) * 100)}% · avg ${negConf ? (negConf * 100).toFixed(0) : "—"}% conf` : "—"} />
        <StatCard title="Neutral" value={dist["Neutral"] ?? 0} icon={<span>😐</span>} color="#f59e0b"
          subtitle={total ? `${Math.round(((dist["Neutral"] ?? 0) / total) * 100)}% of total` : "—"} />
      </div>

      {/* Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={card}>
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={15} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-sm font-semibold text-white">Sentiment Distribution</h2>
          </div>
          {total === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--color-text-muted)" }}>No data yet — run your first analysis!</div>
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
            <BarChart2 size={15} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-sm font-semibold text-white">Count by Sentiment</h2>
          </div>
          {total === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--color-text-muted)" }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pieData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pieData.map(entry => <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name as SentimentLabel]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trend */}
      <div style={card}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} style={{ color: "var(--color-primary)" }} />
          <h2 className="text-sm font-semibold text-white">Sentiment Trend (Last {days} Days)</h2>
        </div>
        {trendSeries.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--color-text-muted)" }}>Not enough data for trend analysis</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendSeries}>
              <defs>
                {(["Positive", "Negative", "Neutral"] as SentimentLabel[]).map(s => (
                  <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={SENTIMENT_COLORS[s]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS[s]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend formatter={v => <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{v}</span>} />
              {(["Positive", "Negative", "Neutral"] as SentimentLabel[]).map(s => (
                <Area key={s} type="monotone" dataKey={s} stroke={SENTIMENT_COLORS[s]} fill={`url(#grad-${s})`} strokeWidth={2} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Keyword Frequency */}
      {keywordData.length > 0 && (
        <div style={card}>
          <div className="flex items-center gap-2 mb-4">
            <Hash size={15} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-sm font-semibold text-white">Top Keywords (Last {days} Days)</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={keywordData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="word" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {keywordData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Word Cloud (tag style) */}
      {wordCloudData.length > 0 && (
        <div style={card}>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "var(--color-primary)", fontSize: 15 }}>☁</span>
            <h2 className="text-sm font-semibold text-white">Word Cloud</h2>
          </div>
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {wordCloudData.map((kw, i) => {
              const maxCount = wordCloudData[0]?.count ?? 1;
              const size = 11 + Math.round((kw.count / maxCount) * 16);
              const color = kw.type === "positive" ? "#10b981" : kw.type === "negative" ? "#ef4444" : "#f59e0b";
              return (
                <span key={i} className="font-medium transition-all cursor-default hover:opacity-80"
                  style={{ fontSize: size, color, opacity: 0.6 + (kw.count / maxCount) * 0.4 }}>
                  {kw.word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
