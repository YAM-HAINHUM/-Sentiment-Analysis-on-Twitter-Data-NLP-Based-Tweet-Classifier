import { useEffect, useState } from "react";
import { BarChart2, Lightbulb, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../components/ui/Spinner";
import { API_BASE } from "../api/client";

type SentimentDistribution = {
  Positive: number;
  Negative: number;
  Neutral: number;
};

type InsightsResponse = {
  summary?: string;
  sentiment_distribution?: SentimentDistribution;
  top_negative_keywords?: string[];
};

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("sa_token");
      const res = await fetch(`${API_BASE}/insights?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load insights");
      const data = (await res.json()) as InsightsResponse;
      setInsights(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await load();
    })();
    return () => { mounted = false; };
  }, []);


  const dist = insights?.sentiment_distribution;
  const topKeywords = insights?.top_negative_keywords ?? [];

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div style={cardStyle} className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Insights</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Automated summary + sentiment distribution computed from your analyses (no chat).
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={cardStyle} className="p-10 flex items-center justify-center gap-3">
          <Spinner size={16} />
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading insights…</span>
        </div>
      ) : (
        <>
          {/* Sentiment distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              { key: "Positive", color: "#10b981" },
              { key: "Negative", color: "#ef4444" },
              { key: "Neutral", color: "#f59e0b" },
            ] as const).map(({ key, color }) => {
              const countPct = dist ? Math.round(dist[key as keyof SentimentDistribution] ?? 0) : 0;
              return (
                <div key={key} className="rounded-xl p-4" style={cardStyle}>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{key}</p>
                  <p className="text-2xl font-bold" style={{ color }}>{countPct}%</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Share of analyses (last 30 days)
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div style={cardStyle} className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} style={{ color: "var(--color-primary)" }} />
              <h2 className="text-sm font-semibold text-white">Automated Summary</h2>
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
              {insights?.summary ?? "No summary available yet. Run some analyses first."}
            </div>
          </div>

          {/* Top keywords from negative tweets */}
          <div style={cardStyle} className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} style={{ color: "var(--color-primary)" }} />
              <h2 className="text-sm font-semibold text-white">Top Negative Keywords</h2>
            </div>
            {topKeywords.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Not enough negative tweets to extract keywords.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topKeywords.slice(0, 12).map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fecaca" }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

